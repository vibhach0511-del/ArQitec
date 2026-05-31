// ArQiteQ — local optimization engine.
// Pure, deterministic functions. No backend, no API keys. Given a configuration
// (material + topology + workload [+ optional QEC override]) these compute
// routing overhead, a weighted architecture score, a QEC recommendation,
// baseline comparisons, benchmark deltas, and a human-readable explanation.
//
// TODO(integration): swap these heuristics for real signals —
//   • routing: Qiskit transpile(circuit, coupling_map, optimization_level=3)
//     then count SWAP/CX and depth instead of estimateRouting().
//   • fidelity: compose measured per-gate errors from IBM backend properties.
//   • qec: call a Stim/PyMatching pipeline for logical error vs distance.

import {
  BASELINE_METHODS,
  ERROR_CORRECTION_CODES,
  getCode,
  getMaterial,
  getTopology,
  getWorkload,
  QUBIT_BUDGET,
} from "./data";
import type {
  ArchitectureConfig,
  BaselineComparison,
  BenchmarkMetric,
  ErrorCorrectionCode,
  MaterialProfile,
  OptimizationResult,
  OptimizationStep,
  QECRecommendation,
  QuantumWorkload,
  QubitTopology,
  RoutingEstimate,
  ScoreBreakdown,
} from "./types";

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
const round = (v: number, d = 0) => {
  const f = 10 ** d;
  return Math.round(v * f) / f;
};

export const SCORE_WEIGHTS = {
  routing: 0.25,
  fidelity: 0.2,
  qec: 0.2,
  manufacturability: 0.15,
  crosstalk: 0.1,
  workloadFit: 0.1,
} as const;

export const OPTIMIZATION_STEPS: OptimizationStep[] = [
  { id: "parse", label: "Parsing workload", detail: "Lowering circuit to a 2Q interaction graph" },
  { id: "candidates", label: "Evaluating topology candidates", detail: "Scoring lattice families against constraints" },
  { id: "routing", label: "Estimating routing overhead", detail: "SABRE-style SWAP & depth projection" },
  { id: "qec", label: "Checking QEC compatibility", detail: "Matching codes to layout & error budget" },
  { id: "mfg", label: "Computing manufacturability score", detail: "Yield, cryo complexity & degree penalties" },
  { id: "select", label: "Selecting recommended architecture", detail: "Weighted multi-objective decision" },
];

/* ------------------------------------------------------------------ routing */

// Requirement 6: simplified routing estimator.
//  - sparser connectivity  -> more SWAPs
//  - higher connectivity    -> fewer SWAPs but more crosstalk/mfg complexity
//  - workload interaction density drives routing overhead
export function estimateRouting(
  topology: QubitTopology,
  workload: QuantumWorkload,
): RoutingEstimate {
  const connectivity = topology.connectivity / 100; // 0..1
  const sparsity = 1 - connectivity;
  const density = workload.interactionDensity;

  // SWAPs per logical 2Q gate grows with sparsity and interaction density.
  const swapsPerGate = clamp(
    (0.1 + 1.15 * sparsity) * (0.35 + 0.95 * density),
    0,
    3,
  );
  const swapCount = Math.round(workload.twoQubitGates * swapsPerGate);
  // Each SWAP decomposes to ~3 CX.
  const effective2QOps = workload.twoQubitGates + swapCount * 3;
  const routedDepth = Math.round(
    workload.depth * (1 + swapsPerGate * 0.55 * (0.6 + density)),
  );
  const congestion = clamp(
    0.18 + sparsity * 0.5 * density + density * 0.25,
    0,
    1,
  ) as number;

  return {
    swapCount,
    swapsPerGate: round(swapsPerGate, 3),
    routedDepth,
    congestion: round(congestion, 3),
    effective2QOps,
  };
}

/* ------------------------------------------------------------------- scoring */

// Requirement 4: weighted architecture score. Sub-scores are 0–100 (higher is
// better); embedded penalties reduce them, which lowers the final score.
export function computeScore(
  material: MaterialProfile,
  topology: QubitTopology,
  workload: QuantumWorkload,
  code: ErrorCorrectionCode,
  routing: RoutingEstimate,
): ScoreBreakdown {
  const connectivity = topology.connectivity / 100;

  // routing: fewer SWAPs per gate is better.
  const routingScore = clamp(100 - routing.swapsPerGate * 52);

  // fidelity: gate quality eroded by total 2Q operations after routing.
  const fidelityBase = clamp((material.gate2QFidelity - 95) * 19); // 99.41% -> ~83.8
  const opPenalty = clamp((routing.effective2QOps / workload.twoQubitGates - 1) * 26, 0, 60);
  const fidelityScore = clamp(fidelityBase - opPenalty);

  // qec: topology compatibility + code compatibility - readout noise.
  const qecCompatibilityScore = clamp(
    topology.qecCompatibility * 0.6 + code.compatibility * 0.4 - material.readoutError * 4,
  );

  // manufacturability: layout + yield + (inverse) cryo - excess degree penalty.
  const degreePenalty = Math.max(0, topology.avgDegree - material.preferredDegree) * 6;
  const manufacturabilityScore = clamp(
    topology.manufacturability * 0.5 +
      material.yield * 0.3 +
      (100 - material.cryoComplexity * 100) * 0.2 -
      degreePenalty,
  );

  // crosstalk: material susceptibility + topology penalty + connectivity cost.
  const crosstalkPenalty =
    material.crosstalk * 100 * 0.5 + topology.crosstalk * 0.38 + connectivity * 16;
  const crosstalkScore = clamp(100 - crosstalkPenalty);

  // workload fit: topology connectivity should match interaction density.
  const fit = 100 - Math.abs(connectivity - workload.interactionDensity) * 115;
  const workloadFitScore = clamp(fit);

  const architectureScore = clamp(
    SCORE_WEIGHTS.routing * routingScore +
      SCORE_WEIGHTS.fidelity * fidelityScore +
      SCORE_WEIGHTS.qec * qecCompatibilityScore +
      SCORE_WEIGHTS.manufacturability * manufacturabilityScore +
      SCORE_WEIGHTS.crosstalk * crosstalkScore +
      SCORE_WEIGHTS.workloadFit * workloadFitScore,
  );

  return {
    routingScore: round(routingScore, 1),
    fidelityScore: round(fidelityScore, 1),
    qecCompatibilityScore: round(qecCompatibilityScore, 1),
    manufacturabilityScore: round(manufacturabilityScore, 1),
    crosstalkScore: round(crosstalkScore, 1),
    workloadFitScore: round(workloadFitScore, 1),
    architectureScore: round(architectureScore, 1),
  };
}

/* ----------------------------------------------------------------- QEC advisor */

// Requirement 7: recommend a code, distance, overhead, logical risk, syndrome cost.
export function recommendQEC(
  material: MaterialProfile,
  topology: QubitTopology,
  workload: QuantumWorkload,
  override?: ErrorCorrectionCode,
): QECRecommendation {
  const planarity = topology.qecCompatibility / 100;
  const ranking = ERROR_CORRECTION_CODES.map((code) => {
    // locality match: codes that demand planarity do worse on low-compat layouts.
    const localityMatch = 100 - Math.abs(code.localityRequirement - planarity) * 90;
    // syndrome workloads strongly favor topological codes.
    const workloadBias =
      workload.id === "syndrome"
        ? (code.family.includes("Topological") ? 14 : 0)
        : 0;
    const score = clamp(
      code.compatibility * 0.42 +
        topology.qecCompatibility * 0.24 +
        localityMatch * 0.2 -
        code.physicalPerLogical * 0.12 +
        workloadBias,
    );
    return { code, score: round(score, 1) };
  }).sort((a, b) => b.score - a.score);

  const code = override ?? ranking[0].code;

  // Distance: push higher when the material's 2Q fidelity lags the target.
  const fidelityGap = clamp((99.5 - material.gate2QFidelity) * 1.5, 0, 6);
  const errorPressure =
    workload.targetLogicalError < 1e-4 ? 2 : workload.targetLogicalError < 1e-2 ? 1 : 0;
  let distance = code.baseDistance + Math.round(fidelityGap / 3) + errorPressure;
  if (distance % 2 === 0) distance += 1; // distances are odd
  distance = Math.max(3, Math.min(15, distance));

  const distanceFactor = distance / code.baseDistance;
  const physicalQubitOverhead = Math.round(
    code.physicalPerLogical * distanceFactor ** 1.6 * workload.logicalQubits,
  );

  // Logical error shrinks ~ exponentially with distance, grows with poor gates.
  const subThreshold = clamp((material.gate2QFidelity - 99) / 1, 0, 1); // 0..1
  const logicalErrorRisk =
    code.logicalErrorBase *
    Math.pow(0.1, (distance - code.baseDistance) / 2) *
    (1 + (1 - subThreshold) * 8);

  const syndromeExtractionOverhead = round(
    code.syndromeOverhead * (1 + (1 - planarity) * 0.4),
    0,
  );

  const rationale =
    `${code.name} at distance ${distance} maximises compatibility (${code.compatibility}) ` +
    `with the ${topology.name} layout while keeping physical overhead at ` +
    `${physicalQubitOverhead.toLocaleString()} qubits for ${workload.logicalQubits} logical qubits.`;

  return {
    code,
    distance,
    physicalQubitOverhead,
    logicalErrorRisk,
    syndromeExtractionOverhead,
    ranking,
    rationale,
  };
}

/* --------------------------------------------------------------- explanation */

// Requirement 8: deterministic natural-language explanation.
export function generateExplanation(
  material: MaterialProfile,
  topology: QubitTopology,
  workload: QuantumWorkload,
  qec: QECRecommendation,
  score: ScoreBreakdown,
): string {
  const reasons: string[] = [];

  if (material.crosstalk >= 0.3 && topology.crosstalk <= 50) {
    reasons.push(
      `${material.short} qubits are crosstalk-sensitive, and ${topology.name} keeps coupler degree low to suppress frequency collisions`,
    );
  } else if (topology.connectivity >= 75 && workload.interactionDensity >= 0.7) {
    reasons.push(
      `${workload.name} has dense, near-all-to-all interactions, so the higher connectivity of ${topology.name} cuts routing overhead`,
    );
  } else {
    reasons.push(
      `${topology.name} balances routing efficiency with manufacturability for the ${material.short} process`,
    );
  }

  if (score.routingScore >= 70)
    reasons.push(`routing stays cheap (${score.routingScore}/100 routing score)`);
  if (material.preferredDegree < topology.avgDegree)
    reasons.push(
      `degree is held near the ${material.preferredDegree}-coupler sweet spot the process tolerates`,
    );
  reasons.push(
    `${qec.code.name} (d=${qec.distance}) gives the best error-correction fit at ${qec.physicalQubitOverhead.toLocaleString()} physical qubits`,
  );

  const lead =
    topology.kind === "ai"
      ? "ArQiteQ selected the AI-optimized topology"
      : `ArQiteQ selected ${topology.name}`;

  return `${lead} because ${reasons.join("; ")}. Overall architecture score: ${score.architectureScore}/100.`;
}

/* ----------------------------------------------------------------- baselines */

// Requirement 5: compare the five baseline methods on the active config.
export function computeBaselines(
  material: MaterialProfile,
  workload: QuantumWorkload,
  qec: ErrorCorrectionCode,
): BaselineComparison[] {
  const rows = BASELINE_METHODS.map(({ method, topologyId }) => {
    const topology = getTopology(topologyId);
    const routing = estimateRouting(topology, workload);
    const score = computeScore(material, topology, workload, qec, routing);
    return {
      method,
      topologyId,
      architectureScore: score.architectureScore,
      swapCount: routing.swapCount,
      fidelityScore: score.fidelityScore,
      crosstalkScore: score.crosstalkScore,
      manufacturabilityScore: score.manufacturabilityScore,
      isRecommended: false,
    };
  });
  const best = rows.reduce((a, b) => (b.architectureScore > a.architectureScore ? b : a));
  best.isRecommended = true;
  return rows;
}

/* --------------------------------------------------------------- benchmarks */

export function computeBenchmarks(
  material: MaterialProfile,
  topology: QubitTopology,
  workload: QuantumWorkload,
  qec: ErrorCorrectionCode,
): BenchmarkMetric[] {
  const baselineTopo = getTopology("square");
  const baseRouting = estimateRouting(baselineTopo, workload);
  const optRouting = estimateRouting(topology, workload);
  const baseScore = computeScore(material, baselineTopo, workload, qec, baseRouting);
  const optScore = computeScore(material, topology, workload, qec, optRouting);

  return [
    { key: "swap", label: "SWAP gates", baseline: baseRouting.swapCount, optimized: optRouting.swapCount, betterDirection: "lower" },
    { key: "depth", label: "Routed depth", baseline: baseRouting.routedDepth, optimized: optRouting.routedDepth, betterDirection: "lower" },
    { key: "fidelity", label: "Fidelity score", unit: "/100", baseline: baseScore.fidelityScore, optimized: optScore.fidelityScore, betterDirection: "higher" },
    { key: "crosstalk", label: "Crosstalk score", unit: "/100", baseline: baseScore.crosstalkScore, optimized: optScore.crosstalkScore, betterDirection: "higher" },
    { key: "congestion", label: "Congestion", baseline: round(baseRouting.congestion * 100, 0), optimized: round(optRouting.congestion * 100, 0), betterDirection: "lower" },
    { key: "score", label: "Architecture score", unit: "/100", baseline: baseScore.architectureScore, optimized: optScore.architectureScore, betterDirection: "higher" },
  ];
}

function pctDelta(base: number, opt: number, betterDirection: "lower" | "higher") {
  if (base === 0) return { value: "0%", direction: "up" as const, tone: "neutral" as const };
  const change = ((opt - base) / Math.abs(base)) * 100;
  const improved = betterDirection === "lower" ? change < 0 : change > 0;
  const sign = change > 0 ? "+" : "−";
  return {
    value: `${sign}${Math.abs(change).toFixed(0)}%`,
    direction: (change < 0 ? "down" : "up") as "down" | "up",
    tone: (improved ? "good" : "warn") as "good" | "warn",
  };
}

function headlineDeltas(benchmarks: BenchmarkMetric[]) {
  const pick = (key: string) => benchmarks.find((b) => b.key === key)!;
  const swap = pick("swap");
  const crosstalk = pick("crosstalk");
  const fidelity = pick("fidelity");
  const score = pick("score");
  return [
    { label: "SWAP gates", ...pctDelta(swap.baseline, swap.optimized, "lower") },
    { label: "Crosstalk score", ...pctDelta(crosstalk.baseline, crosstalk.optimized, "higher") },
    { label: "Fidelity score", ...pctDelta(fidelity.baseline, fidelity.optimized, "higher") },
    { label: "Architecture score", ...pctDelta(score.baseline, score.optimized, "higher") },
  ];
}

/* --------------------------------------------------------------- convergence */

// Deterministic convergence trace seeded by the architecture score.
export function buildConvergence(targetScore: number, iters = 32) {
  const startCost = 100 - targetScore * 0.35;
  const endCost = 100 - targetScore;
  return Array.from({ length: iters }, (_, i) => {
    const t = i / (iters - 1);
    const cost = startCost - (startCost - endCost) * (1 - Math.exp(-i / 7)) + Math.sin(i / 2) * 1.4;
    const mfg = 52 + (targetScore - 52) * (1 - Math.exp(-i / 9)) + Math.cos(i / 3) * 1.1;
    return { iter: i + 1, cost: round(cost, 1), manufacturability: round(clamp(mfg), 1) };
  });
}

/* --------------------------------------------------------- result assembly */

export function buildResult(
  config: ArchitectureConfig,
  timestamp = "",
): OptimizationResult {
  const material = getMaterial(config.materialId);
  const topology = getTopology(config.topologyId);
  const workload = getWorkload(config.workloadId);

  const qec = recommendQEC(
    material,
    topology,
    workload,
    config.qecId ? getCode(config.qecId) : undefined,
  );
  const routing = estimateRouting(topology, workload);
  const score = computeScore(material, topology, workload, qec.code, routing);
  const baselines = computeBaselines(material, workload, qec.code);
  const benchmarks = computeBenchmarks(material, topology, workload, qec.code);
  const explanation = generateExplanation(material, topology, workload, qec, score);
  const convergence = buildConvergence(score.architectureScore);

  return {
    config,
    material,
    topology,
    workload,
    score,
    routing,
    qec,
    baselines,
    benchmarks,
    convergence,
    explanation,
    headlineDeltas: headlineDeltas(benchmarks),
    seed: "0x9F2C1A",
    timestamp,
  };
}

/** Find the highest-scoring candidate topology for a material+workload. */
export function bestTopologyFor(
  config: Pick<ArchitectureConfig, "materialId" | "workloadId" | "qecId">,
): QubitTopology {
  const material = getMaterial(config.materialId);
  const workload = getWorkload(config.workloadId);
  const qec = recommendQEC(material, getTopology("heavy-hex"), workload, config.qecId ? getCode(config.qecId) : undefined);
  const rows = computeBaselines(material, workload, qec.code);
  const best = rows.reduce((a, b) => (b.architectureScore > a.architectureScore ? b : a));
  return getTopology(best.topologyId);
}

/* -------------------------------------------------------------------- export */

// Requirement 10: export the current recommendation as JSON or Markdown.
export function exportJSON(result: OptimizationResult): string {
  return JSON.stringify(result, null, 2);
}

export function exportMarkdown(result: OptimizationResult): string {
  const { material, topology, workload, score, routing, qec, baselines, benchmarks } = result;
  const line = (k: string, v: string | number) => `| ${k} | ${v} |`;
  return [
    `# ArQiteQ Recommendation`,
    ``,
    `_Generated ${result.timestamp} · seed ${result.seed} · qubit budget ${QUBIT_BUDGET}_`,
    ``,
    `## Configuration`,
    ``,
    `| Field | Value |`,
    `| ----- | ----- |`,
    line("Material", `${material.name} (${material.vendor})`),
    line("Topology", `${topology.name} · avg degree ${topology.avgDegree}`),
    line("Workload", `${workload.name} · ${workload.logicalQubits} logical qubits`),
    line("Error-correction code", `${qec.code.name} (d=${qec.distance})`),
    ``,
    `## Architecture score: **${score.architectureScore}/100**`,
    ``,
    `| Sub-score | Weight | Value |`,
    `| --------- | ------ | ----- |`,
    line("Routing", "0.25 | " + score.routingScore),
    line("Fidelity", "0.20 | " + score.fidelityScore),
    line("QEC compatibility", "0.20 | " + score.qecCompatibilityScore),
    line("Manufacturability", "0.15 | " + score.manufacturabilityScore),
    line("Crosstalk", "0.10 | " + score.crosstalkScore),
    line("Workload fit", "0.10 | " + score.workloadFitScore),
    ``,
    `## Routing estimate`,
    ``,
    `- Inserted SWAPs: **${routing.swapCount}** (${routing.swapsPerGate}/2Q gate)`,
    `- Routed depth: **${routing.routedDepth}**`,
    `- Congestion: **${(routing.congestion * 100).toFixed(0)}%**`,
    ``,
    `## Error correction`,
    ``,
    `- Recommended: **${qec.code.name}** at distance **${qec.distance}**`,
    `- Physical-qubit overhead: **${qec.physicalQubitOverhead.toLocaleString()}**`,
    `- Logical error risk: **${qec.logicalErrorRisk.toExponential(2)}**`,
    `- Syndrome overhead: **${qec.syndromeExtractionOverhead}%**`,
    ``,
    `## Baseline comparison`,
    ``,
    `| Method | Arch. score | SWAPs | Fidelity | Crosstalk | Mfg. |`,
    `| ------ | ----------- | ----- | -------- | --------- | ---- |`,
    ...baselines.map(
      (b) =>
        `| ${b.method}${b.isRecommended ? " ★" : ""} | ${b.architectureScore} | ${b.swapCount} | ${b.fidelityScore} | ${b.crosstalkScore} | ${b.manufacturabilityScore} |`,
    ),
    ``,
    `## Benchmarks (square-grid baseline vs optimized)`,
    ``,
    `| Metric | Baseline | Optimized |`,
    `| ------ | -------- | --------- |`,
    ...benchmarks.map((b) => `| ${b.label}${b.unit ?? ""} | ${b.baseline} | ${b.optimized} |`),
    ``,
    `## Rationale`,
    ``,
    result.explanation,
    ``,
  ].join("\n");
}

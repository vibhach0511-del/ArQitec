// ArQiteQ — Code Designer engine (Code -> Material, inverse design).
// Treat each QEC code as an engineering option with measurable tradeoffs.
// Given a target code profile (the 10 characteristics), find the nearest known
// code, GENERATE the required material spec, and RANK the closest real
// materials. Also implements the platform CodeFitScore and the summary table.
//
// Deterministic and self-contained (no backend). Mirrors the characteristics
// used in qec_pipeline.
//
// TODO(integration): calibrate thresholds / logical-error floors from
// qec_pipeline/outputs/summary.json instead of the static CODE_CHARACTERISTICS.

import {
  CANDIDATE_TOPOLOGIES,
  CODE_CHARACTERISTICS,
  ERROR_CORRECTION_CODES,
  MATERIAL_PROFILES,
  QUANTUM_WORKLOADS,
  WORKLOAD_CODE_AFFINITY,
  getCode,
} from "./data";
import type {
  CharacteristicKey,
  CharacteristicMeta,
  CodeCharacteristics,
  CodeFitBreakdown,
  ErrorCorrectionCode,
  MaterialFit,
  MaterialProfile,
  QECId,
  QubitTopology,
  QuantumWorkload,
  RequiredMaterialSpec,
  SummaryRow,
} from "./types";

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
const round = (v: number, d = 0) => {
  const f = 10 ** d;
  return Math.round(v * f) / f;
};

// ---- Slider metadata for the 10 characteristics -------------------------

export const CHARACTERISTIC_META: CharacteristicMeta[] = [
  { key: "thresholdPct", label: "Physical error threshold", unit: "%", min: 0.1, max: 50, step: 0.1, betterDirection: "higher", weight: 1.0, hint: "Max physical error rate where the code still helps. Higher = more forgiving hardware." },
  { key: "logicalErrorFloor", label: "Logical error floor", unit: "−log₁₀(pL)", min: 2, max: 12, step: 0.5, betterDirection: "higher", weight: 1.0, hint: "Achievable logical error. 7 means 1e-7. Higher = better fidelity." },
  { key: "distance", label: "Code distance", unit: "d", min: 3, max: 15, step: 2, betterDirection: "higher", weight: 0.6, hint: "Physical errors tolerated. Higher = more reliable, more overhead." },
  { key: "qubitOverhead", label: "Physical qubit overhead", unit: "phys/log", min: 5, max: 120, step: 1, betterDirection: "lower", weight: 1.0, hint: "Physical qubits per logical qubit. Critical for chip area/cost." },
  { key: "connectivityDegree", label: "Connectivity requirement", unit: "degree", min: 2, max: 6, step: 1, betterDirection: "lower", weight: 0.8, hint: "Required coupler degree. Determines chip topology fit." },
  { key: "syndromeOverhead", label: "Syndrome extraction overhead", unit: "%", min: 10, max: 50, step: 1, betterDirection: "lower", weight: 0.7, hint: "Extra gates/time to detect errors. Impacts latency and decoherence." },
  { key: "decoderComplexity", label: "Decoder complexity", unit: "0-100", min: 0, max: 100, step: 1, betterDirection: "lower", weight: 0.5, hint: "Classical compute to decode. Impacts the real-time control stack." },
  { key: "biasCompatibility", label: "Bias compatibility", unit: "0-100", min: 0, max: 100, step: 1, betterDirection: "higher", weight: 0.9, hint: "How well the code exploits biased (dephasing-heavy) noise." },
  { key: "crosstalkSensitivity", label: "Crosstalk sensitivity", unit: "0-100", min: 0, max: 100, step: 1, betterDirection: "lower", weight: 0.6, hint: "How much the code suffers from nearby operations." },
  { key: "manufacturabilityFit", label: "Manufacturability fit", unit: "0-100", min: 0, max: 100, step: 1, betterDirection: "higher", weight: 0.8, hint: "How naturally the code maps to your chip process/topology." },
];

const META_BY_KEY = Object.fromEntries(
  CHARACTERISTIC_META.map((m) => [m.key, m]),
) as Record<CharacteristicKey, CharacteristicMeta>;

function normalize(key: CharacteristicKey, value: number): number {
  const m = META_BY_KEY[key];
  return clamp((value - m.min) / (m.max - m.min), 0, 1);
}

// ---- Match a target profile to the nearest known code -------------------

export interface CodeMatch {
  code: ErrorCorrectionCode;
  codeId: QECId;
  similarity: number; // 0-100
  ranking: { id: QECId; name: string; similarity: number }[];
}

export function matchCode(target: CodeCharacteristics): CodeMatch {
  const keys = CHARACTERISTIC_META.map((m) => m.key);
  const weightSum = CHARACTERISTIC_META.reduce((s, m) => s + m.weight, 0);

  const scored = (Object.keys(CODE_CHARACTERISTICS) as QECId[]).map((id) => {
    const c = CODE_CHARACTERISTICS[id];
    let dist2 = 0;
    for (const k of keys) {
      const d = normalize(k, target[k]) - normalize(k, c[k]);
      dist2 += META_BY_KEY[k].weight * d * d;
    }
    // RMS-like normalized distance in [0,1]; convert to similarity.
    const dist = Math.sqrt(dist2 / weightSum);
    const similarity = round(clamp(100 * (1 - dist)), 1);
    return { id, name: getCode(id).name, similarity };
  });

  scored.sort((a, b) => b.similarity - a.similarity);
  const best = scored[0];
  return {
    code: getCode(best.id),
    codeId: best.id,
    similarity: best.similarity,
    ranking: scored,
  };
}

// ---- Generate the required material spec from a code profile ------------

const SAFETY_MARGIN = 5; // operate well below threshold

export function generateRequiredMaterial(target: CodeCharacteristics): RequiredMaterialSpec {
  const maxTwoQubitError = round(target.thresholdPct / SAFETY_MARGIN, 3);
  const maxOneQubitError = round(maxTwoQubitError / 3, 4);

  // Coherence floor grows with desired error floor and syndrome latency.
  const minT1Us = round(
    50 * (1 + (target.logicalErrorFloor - 3) * 0.6) * (1 + target.syndromeOverhead / 80),
    0,
  );
  const minT2Us = round(minT1Us * 0.7, 0);

  // Bias-compatible codes require biased materials; isotropic codes do not.
  const requiredBiasEta =
    target.biasCompatibility >= 70
      ? round(10 ** ((target.biasCompatibility - 60) / 22), 1)
      : 1;

  const maxCrosstalk = round(clamp(0.5 - target.crosstalkSensitivity / 250, 0.05, 0.5), 3);
  const requiredDegree = target.connectivityDegree;
  const targetLogicalError = 10 ** -target.logicalErrorFloor;

  return {
    maxTwoQubitError,
    maxOneQubitError,
    minT1Us,
    minT2Us,
    requiredBiasEta,
    maxCrosstalk,
    requiredDegree,
    targetLogicalError,
  };
}

// ---- Rank real materials against a required spec ------------------------

export function rankMaterials(spec: RequiredMaterialSpec): MaterialFit[] {
  const fits = MATERIAL_PROFILES.map((m): MaterialFit => {
    const twoQErr = 100 - m.gate2QFidelity; // %
    const oneQErr = 100 - m.gate1QFidelity;

    const axes: { axis: string; ok: boolean; ratio: number; detail: string }[] = [
      {
        axis: "2Q gate error",
        ok: twoQErr <= spec.maxTwoQubitError,
        ratio: clampRatio(spec.maxTwoQubitError / Math.max(twoQErr, 1e-6)),
        detail: `${twoQErr.toFixed(2)}% vs ≤ ${spec.maxTwoQubitError}%`,
      },
      {
        axis: "1Q gate error",
        ok: oneQErr <= spec.maxOneQubitError,
        ratio: clampRatio(spec.maxOneQubitError / Math.max(oneQErr, 1e-6)),
        detail: `${oneQErr.toFixed(3)}% vs ≤ ${spec.maxOneQubitError}%`,
      },
      {
        axis: "T1",
        ok: m.t1Us >= spec.minT1Us,
        ratio: clampRatio(m.t1Us / spec.minT1Us),
        detail: `${m.t1Us > 9000 ? "∞" : m.t1Us}µs vs ≥ ${spec.minT1Us}µs`,
      },
      {
        axis: "T2",
        ok: m.t2Us >= spec.minT2Us,
        ratio: clampRatio(m.t2Us / spec.minT2Us),
        detail: `${m.t2Us > 9000 ? "∞" : m.t2Us}µs vs ≥ ${spec.minT2Us}µs`,
      },
      {
        axis: "noise bias",
        ok: spec.requiredBiasEta <= 1 || m.biasEta >= spec.requiredBiasEta,
        ratio: spec.requiredBiasEta <= 1 ? 1 : clampRatio(m.biasEta / spec.requiredBiasEta),
        detail:
          spec.requiredBiasEta <= 1
            ? `any (η=${m.biasEta})`
            : `η=${m.biasEta} vs ≥ ${spec.requiredBiasEta}`,
      },
      {
        axis: "crosstalk",
        ok: m.crosstalk <= spec.maxCrosstalk,
        ratio: clampRatio(spec.maxCrosstalk / Math.max(m.crosstalk, 1e-6)),
        detail: `${m.crosstalk.toFixed(2)} vs ≤ ${spec.maxCrosstalk}`,
      },
      {
        axis: "connectivity",
        ok: m.preferredDegree >= spec.requiredDegree,
        ratio: clampRatio(m.preferredDegree / spec.requiredDegree),
        detail: `deg ${m.preferredDegree} vs ≥ ${spec.requiredDegree}`,
      },
    ];

    const fit = round(
      (axes.reduce((s, a) => s + Math.min(1, a.ratio), 0) / axes.length) * 100,
      1,
    );
    const failed = axes.filter((a) => !a.ok);
    const verdict =
      failed.length === 0
        ? "Strong fit — meets every requirement"
        : failed.length <= 2
          ? `Partial — short on ${failed.map((f) => f.axis).join(", ")}`
          : `Poor fit — fails ${failed.length} requirements`;

    return {
      material: m,
      fit,
      gaps: axes.map((a) => ({ axis: a.axis, ok: a.ok, detail: a.detail })),
      verdict,
    };
  });

  fits.sort((a, b) => b.fit - a.fit);
  return fits;
}

function clampRatio(r: number): number {
  return Math.max(0, Math.min(1.2, r));
}

// ---- CodeFitScore (platform formula) ------------------------------------

const FIT_WEIGHTS = {
  logicalFidelity: 0.25,
  topologyMatch: 0.2,
  qubitOverhead: 0.15,
  syndromeLatency: 0.15,
  decoderComplexity: 0.1,
  noiseBiasMatch: 0.1,
  manufacturability: 0.05,
} as const;

const materialBiasNorm = (eta: number) => clamp(Math.log10(Math.max(1, eta)) / 3, 0, 1);

export function codeFitScore(
  codeId: QECId,
  material: MaterialProfile,
  topology: QubitTopology,
  workload: QuantumWorkload,
): CodeFitBreakdown {
  const c = CODE_CHARACTERISTICS[codeId];
  const twoQErr = 100 - material.gate2QFidelity;

  const marginOk = twoQErr <= c.thresholdPct ? 1 : 0.5;
  const logicalFidelityScore = clamp((c.logicalErrorFloor / 12) * 100 * (0.6 + 0.4 * marginOk));

  const topologyMatchScore = clamp(
    100 -
      Math.abs(c.connectivityDegree - topology.avgDegree) * 18 -
      Math.max(0, c.connectivityDegree - material.preferredDegree) * 10,
  );

  const qubitOverheadScore = clamp(100 - c.qubitOverhead * 0.7);
  const syndromeLatencyScore = clamp(100 - c.syndromeOverhead * 1.4);
  const decoderComplexityScore = clamp(100 - c.decoderComplexity);

  const noiseBiasMatchScore = clamp(
    100 - Math.abs(c.biasCompatibility / 100 - materialBiasNorm(material.biasEta)) * 100,
  );

  const manufacturabilityScore = clamp(
    0.5 * c.manufacturabilityFit + 0.3 * topology.manufacturability + 0.2 * material.yield,
  );

  // Workload affinity nudges the fidelity term (preferred codes look better).
  const affinity = WORKLOAD_CODE_AFFINITY[workload.id] ?? [];
  const affinityBonus = affinity.includes(codeId)
    ? 8 - affinity.indexOf(codeId) * 3
    : 0;

  const total = clamp(
    FIT_WEIGHTS.logicalFidelity * logicalFidelityScore +
      FIT_WEIGHTS.topologyMatch * topologyMatchScore +
      FIT_WEIGHTS.qubitOverhead * qubitOverheadScore +
      FIT_WEIGHTS.syndromeLatency * syndromeLatencyScore +
      FIT_WEIGHTS.decoderComplexity * decoderComplexityScore +
      FIT_WEIGHTS.noiseBiasMatch * noiseBiasMatchScore +
      FIT_WEIGHTS.manufacturability * manufacturabilityScore +
      affinityBonus,
  );

  return {
    logicalFidelityScore: round(logicalFidelityScore, 1),
    topologyMatchScore: round(topologyMatchScore, 1),
    qubitOverheadScore: round(qubitOverheadScore, 1),
    syndromeLatencyScore: round(syndromeLatencyScore, 1),
    decoderComplexityScore: round(decoderComplexityScore, 1),
    noiseBiasMatchScore: round(noiseBiasMatchScore, 1),
    manufacturabilityScore: round(manufacturabilityScore, 1),
    total: round(total, 1),
  };
}

export const FIT_WEIGHT_META = FIT_WEIGHTS;

// ---- Topology helper + summary table ------------------------------------

function topologyForDegree(degree: number): QubitTopology {
  return CANDIDATE_TOPOLOGIES.reduce((best, t) =>
    Math.abs(t.avgDegree - degree) < Math.abs(best.avgDegree - degree) ? t : best,
  );
}

/** Pick the best (code, material, topology) for a workload. */
export function bestForWorkload(workload: QuantumWorkload): {
  code: ErrorCorrectionCode;
  material: MaterialProfile;
  topology: QubitTopology;
  fit: CodeFitBreakdown;
} {
  let best:
    | { code: ErrorCorrectionCode; material: MaterialProfile; topology: QubitTopology; fit: CodeFitBreakdown }
    | null = null;

  for (const code of ERROR_CORRECTION_CODES) {
    const spec = generateRequiredMaterial(CODE_CHARACTERISTICS[code.id]);
    const material = rankMaterials(spec)[0].material;
    const topology = topologyForDegree(CODE_CHARACTERISTICS[code.id].connectivityDegree);
    const fit = codeFitScore(code.id, material, topology, workload);
    if (!best || fit.total > best.fit.total) best = { code, material, topology, fit };
  }
  return best!;
}

export function buildSummaryTable(): SummaryRow[] {
  return QUANTUM_WORKLOADS.map((w) => {
    const { code, material, topology, fit } = bestForWorkload(w);
    const c = CODE_CHARACTERISTICS[code.id];
    const pL = 10 ** -c.logicalErrorFloor;
    const reason = buildReason(w, code, material, topology, fit);
    return {
      workload: w.name,
      material: material.short,
      topology: topology.name,
      code: code.name,
      logicalFidelity: `1 − ${pL.toExponential(1)}`,
      qubitOverhead: c.qubitOverhead,
      reason,
    };
  });
}

function buildReason(
  workload: QuantumWorkload,
  code: ErrorCorrectionCode,
  material: MaterialProfile,
  topology: QubitTopology,
  fit: CodeFitBreakdown,
): string {
  const parts: string[] = [];
  const c = CODE_CHARACTERISTICS[code.id];
  if (c.biasCompatibility >= 70 && material.biasEta >= 8) {
    parts.push(`${material.short}'s η=${material.biasEta} bias unlocks ${code.name}`);
  } else {
    parts.push(`${code.name} maps cleanly onto the degree-${c.connectivityDegree} ${topology.name}`);
  }
  if (fit.qubitOverheadScore >= 70) parts.push(`low overhead (${c.qubitOverhead} phys/log)`);
  if (fit.manufacturabilityScore >= 70) parts.push("manufacturable on this process");
  parts.push(`CodeFitScore ${fit.total}/100`);
  return `${parts.join("; ")}.`;
}

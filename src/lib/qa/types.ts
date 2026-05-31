// ArQiteQ — core domain types.
// These model the inputs (materials, topologies, workloads, QEC codes) and the
// outputs (scores, routing, recommendations) of the local optimization engine.
//
// All numbers are illustrative mock values calibrated to literature ranges.
// TODO(integration): replace mock-derived fields with measurements pulled from
// IBM Quantum backend properties (T1/T2, gate errors) and Qiskit transpiler stats.

export type MaterialId =
  | "cooper-pair-box"
  | "transmon"
  | "xmon"
  | "gatemon"
  | "rf-squid"
  | "flux-qubit"
  | "fluxonium"
  | "phase-qubit"
  | "quantronium";

/** Superconducting-qubit family (the Charge / Flux / Phase branches). */
export type QubitFamilyId = "charge" | "flux" | "phase";

export interface QubitFamily {
  id: QubitFamilyId;
  label: string;
  regime: string;
  accent: Accent;
}

export type TopologyId =
  | "square"
  | "heavy-hex"
  | "modular"
  | "ai-opt"
  | "random"
  | "max-connectivity";

export type WorkloadId = "qaoa" | "vqe" | "qft" | "random" | "syndrome";

export type QECId =
  | "surface"
  | "heavy-hex"
  | "color"
  | "repetition"
  | "xzzx"
  | "bacon-shor";

export type Accent = "cyan" | "violet" | "green" | "amber";

/** A qubit modality / fabrication process profile. */
export interface MaterialProfile {
  id: MaterialId;
  name: string;
  short: string;
  vendor: string;
  /** Superconducting-qubit family branch. */
  family: QubitFamilyId;
  /** Parent qubit type for sub-variants (e.g. Xmon/Gatemon -> transmon). */
  parent?: MaterialId;
  /** Short structural descriptor from the taxonomy (e.g. "Shunted capacitor"). */
  regimeLabel?: string;
  /** Relaxation time (µs). */
  t1Us: number;
  /** Dephasing time (µs). */
  t2Us: number;
  /** Single-qubit gate fidelity (%). */
  gate1QFidelity: number;
  /** Two-qubit gate fidelity (%). */
  gate2QFidelity: number;
  /** Readout/measurement error (%). */
  readoutError: number;
  /** Intrinsic crosstalk susceptibility, 0–1 (higher = worse). */
  crosstalk: number;
  /** Fabrication yield (%). */
  yield: number;
  /** Cryogenic / control complexity, 0–1 (higher = harder). */
  cryoComplexity: number;
  /** Operating temperature (mK). */
  tempMK: number;
  /** Preferred max average coupler degree the process routes cleanly. */
  preferredDegree: number;
  /** Noise bias eta = p_Z / (p_X + p_Y). ~1 isotropic, >>1 dephasing-biased. */
  biasEta: number;
  /** Coupler connectivity graph the platform natively provides. */
  connectivity?: string;
  /** Native two-qubit gate. */
  native2qGate?: string;
  /** Whether Clifford gates are native (false = engineered-expensive). */
  cliffordsNative?: boolean;
  /** Two-qubit gate duration (ns). */
  gate2qTimeNs?: number;
  /** Measurement duration (µs). */
  measTimeUs?: number;
  /** Per-gate leakage probability. */
  leakage?: number;
  /** Dominant bias axis (e.g. "Z" for dephasing). */
  biasAxis?: string;
  /** Loss is heralded (photonic) rather than a Pauli channel. */
  heraldedLoss?: boolean;
  notes: string;
}

/** A coupler-graph layout family. */
export interface QubitTopology {
  id: TopologyId;
  name: string;
  kind: "standard" | "ai" | "baseline";
  /** Average coupler degree. */
  avgDegree: number;
  /** Connectivity score 0–100 (higher = more connected). */
  connectivity: number;
  /** Intrinsic SWAP overhead 0–100 (lower = better). */
  swapOverhead: number;
  /** Intrinsic crosstalk penalty 0–100 (lower = better). */
  crosstalk: number;
  /** QEC compatibility 0–100 (higher = better). */
  qecCompatibility: number;
  /** Manufacturability 0–100 (higher = better). */
  manufacturability: number;
  description: string;
}

/** A quantum program / circuit family to map onto the chip. */
export interface QuantumWorkload {
  id: WorkloadId;
  name: string;
  /** Logical qubits required. */
  logicalQubits: number;
  /** Pre-routing two-qubit gate count. */
  twoQubitGates: number;
  /** Logical circuit depth before routing. */
  depth: number;
  /** Interaction density 0–1 (0 = local/NN, 1 = all-to-all). */
  interactionDensity: number;
  /** Target logical error rate that makes the workload "useful". */
  targetLogicalError: number;
  description: string;
}

/** A quantum error-correcting code option. */
export interface ErrorCorrectionCode {
  id: QECId;
  name: string;
  family: string;
  /** Nominal code distance. */
  baseDistance: number;
  /** Physical qubits per logical qubit at baseDistance. */
  physicalPerLogical: number;
  /** Logical error per cycle at baseDistance (illustrative). */
  logicalErrorBase: number;
  /** Syndrome-extraction overhead (%). */
  syndromeOverhead: number;
  /** Hardware compatibility 0–100. */
  compatibility: number;
  /** How strongly the code prefers low-degree planar layouts, 0–1. */
  localityRequirement: number;
}

/** Routing overhead estimate for a (topology, workload, material) triple. */
export interface RoutingEstimate {
  /** Estimated inserted SWAP gates. */
  swapCount: number;
  /** SWAP gates per logical 2Q gate. */
  swapsPerGate: number;
  /** Routed circuit depth (post-mapping). */
  routedDepth: number;
  /** Routing-induced congestion 0–1. */
  congestion: number;
  /** Effective 2Q operations after routing (incl. SWAP decomposition). */
  effective2QOps: number;
}

/** Weighted breakdown of the architecture score. */
export interface ScoreBreakdown {
  routingScore: number;
  fidelityScore: number;
  qecCompatibilityScore: number;
  manufacturabilityScore: number;
  crosstalkScore: number;
  workloadFitScore: number;
  /** Final 0–100 weighted architecture score. */
  architectureScore: number;
}

/** QEC advisor recommendation. */
export interface QECRecommendation {
  code: ErrorCorrectionCode;
  /** Recommended code distance for this configuration. */
  distance: number;
  /** Total physical qubits to protect the workload's logical qubits. */
  physicalQubitOverhead: number;
  /** Estimated logical error risk at the recommended distance. */
  logicalErrorRisk: number;
  /** Syndrome-extraction overhead (%) adjusted for topology. */
  syndromeExtractionOverhead: number;
  /** Per-code ranking scores used to choose the winner. */
  ranking: { code: ErrorCorrectionCode; score: number }[];
  rationale: string;
}

/** One row in the baseline comparison. */
export interface BaselineComparison {
  method: string;
  topologyId: TopologyId;
  architectureScore: number;
  swapCount: number;
  fidelityScore: number;
  crosstalkScore: number;
  manufacturabilityScore: number;
  isRecommended: boolean;
}

/** A single before/after benchmark metric. */
export interface BenchmarkMetric {
  key: string;
  label: string;
  unit?: string;
  baseline: number;
  optimized: number;
  /** Which direction is "better". */
  betterDirection: "lower" | "higher";
}

/** A step in the simulated optimization run. */
export interface OptimizationStep {
  id: string;
  label: string;
  detail: string;
}

/** The active selection that drives all derived metrics. */
export interface ArchitectureConfig {
  materialId: MaterialId;
  topologyId: TopologyId;
  workloadId: WorkloadId;
  /** Optional manual QEC override; otherwise the advisor picks. */
  qecId?: QECId;
}

/** A fully-resolved optimization result for a configuration. */
export interface OptimizationResult {
  config: ArchitectureConfig;
  material: MaterialProfile;
  topology: QubitTopology;
  workload: QuantumWorkload;
  score: ScoreBreakdown;
  routing: RoutingEstimate;
  qec: QECRecommendation;
  baselines: BaselineComparison[];
  benchmarks: BenchmarkMetric[];
  convergence: { iter: number; cost: number; manufacturability: number }[];
  explanation: string;
  headlineDeltas: { label: string; value: string; direction: "up" | "down"; tone: "good" | "warn" | "neutral" }[];
  seed: string;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Code Designer (Code -> Material, inverse design). Each QEC code is treated
// as an engineering option with measurable tradeoffs (the 10 characteristics).
// ---------------------------------------------------------------------------

/** Keys for the 10 tunable QEC code characteristics (the slider axes). */
export type CharacteristicKey =
  | "thresholdPct"
  | "logicalErrorFloor"
  | "distance"
  | "qubitOverhead"
  | "connectivityDegree"
  | "syndromeOverhead"
  | "decoderComplexity"
  | "biasCompatibility"
  | "crosstalkSensitivity"
  | "manufacturabilityFit";

/** A QEC code described as a vector of measurable engineering characteristics. */
export interface CodeCharacteristics {
  /** Physical error threshold (%). Higher = more forgiving hardware. */
  thresholdPct: number;
  /** Achievable logical error floor as -log10(p_L). Higher = lower error. */
  logicalErrorFloor: number;
  /** Representative code distance. */
  distance: number;
  /** Physical qubits per logical qubit at the representative distance. */
  qubitOverhead: number;
  /** Required coupler degree (connectivity requirement). */
  connectivityDegree: number;
  /** Syndrome-extraction overhead (%). Higher = more latency. */
  syndromeOverhead: number;
  /** Decoder complexity 0-100. Higher = more classical compute. */
  decoderComplexity: number;
  /** Bias compatibility 0-100. Higher = better under biased (dephasing) noise. */
  biasCompatibility: number;
  /** Crosstalk sensitivity 0-100. Higher = suffers more in dense layouts. */
  crosstalkSensitivity: number;
  /** Manufacturability fit 0-100. Higher = maps more naturally to chip process. */
  manufacturabilityFit: number;
}

/** Metadata for one characteristic slider. */
export interface CharacteristicMeta {
  key: CharacteristicKey;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  /** Which direction is "better" for hardware/design. */
  betterDirection: "lower" | "higher";
  /** Matching weight (importance when finding the nearest known code). */
  weight: number;
  hint: string;
}

/** The material a chosen/target code *requires* (generated, not looked up). */
export interface RequiredMaterialSpec {
  /** Max tolerable two-qubit gate error (%) to stay below threshold. */
  maxTwoQubitError: number;
  /** Max tolerable single-qubit gate error (%). */
  maxOneQubitError: number;
  /** Minimum T1 / T2 (µs) implied by syndrome latency vs error floor. */
  minT1Us: number;
  minT2Us: number;
  /** Required noise bias eta (minimum). 1 = isotropic ok, >1 = needs bias. */
  requiredBiasEta: number;
  /** Max tolerable crosstalk susceptibility (0-1). */
  maxCrosstalk: number;
  /** Required average coupler degree. */
  requiredDegree: number;
  /** Target logical error this spec is designed to reach. */
  targetLogicalError: number;
}

/** How well a real material meets a RequiredMaterialSpec. */
export interface MaterialFit {
  material: MaterialProfile;
  /** Overall fit 0-100. */
  fit: number;
  /** Per-axis pass/fail with a human-readable detail. */
  gaps: { axis: string; ok: boolean; detail: string }[];
  verdict: string;
}

/** CodeFitScore weighted sub-scores (per the platform formula). */
export interface CodeFitBreakdown {
  logicalFidelityScore: number;
  topologyMatchScore: number;
  qubitOverheadScore: number;
  syndromeLatencyScore: number;
  decoderComplexityScore: number;
  noiseBiasMatchScore: number;
  manufacturabilityScore: number;
  /** Final 0-100 weighted CodeFitScore. */
  total: number;
}

/** One row of the hero summary table. */
export interface SummaryRow {
  workload: string;
  material: string;
  topology: string;
  code: string;
  logicalFidelity: string;
  qubitOverhead: number;
  reason: string;
}

// ArQiteQ — surface-code characteristics model.
// Deterministic, self-contained models for the surface-code dashboard:
// the d <-> overhead trade-off, the ~1% threshold, decoder latency, magic-state
// distillation overhead, and the Google Willow 2024 milestone data.
//
// Models are illustrative but calibrated to the standard surface-code scaling
// laws and recent experiments. TODO(integration): replace with Stim+PyMatching
// fits from qec_pipeline and a real magic-state resource estimate (qualtran).

/** Circuit-level error threshold (~1%). The critical dividing line. */
export const THRESHOLD = 0.01;
export const THRESHOLD_PCT = 1.0;

/** Prefactor for the logical-error scaling law. */
const LER_PREFACTOR = 0.03;

/** Physical qubits per logical qubit for a rotated patch: 2d^2 - 1. */
export function physicalPerLogical(d: number): number {
  return 2 * d * d - 1;
}

/** Total physical qubits for nLogical patches at distance d (data only). */
export function totalPhysical(d: number, nLogical: number): number {
  return physicalPerLogical(d) * nLogical;
}

/**
 * Logical error per cycle: pL = A * (p / p_th)^((d+1)/2).
 * Below threshold (p < p_th) increasing d suppresses pL; above threshold it
 * makes things worse — the whole point of the threshold.
 */
export function logicalErrorPerCycle(d: number, p: number, pTh = THRESHOLD): number {
  return LER_PREFACTOR * Math.pow(p / pTh, (d + 1) / 2);
}

/** Error-suppression factor Λ per +2 code distance (p_th / p). >1 = good. */
export function suppressionLambda(p: number, pTh = THRESHOLD): number {
  return pTh / p;
}

/**
 * Smallest odd distance d to reach a target logical error at physical error p.
 * Returns null if p is at/above threshold (no distance helps).
 */
export function requiredDistance(targetLER: number, p: number, pTh = THRESHOLD): number | null {
  if (p >= pTh) return null;
  // A*(p/pth)^((d+1)/2) <= target  ->  (d+1)/2 >= ln(target/A)/ln(p/pth)
  const k = Math.log(targetLER / LER_PREFACTOR) / Math.log(p / pTh);
  let d = Math.ceil(2 * k - 1);
  d = Math.max(3, d);
  if (d % 2 === 0) d += 1;
  return Math.min(d, 99);
}

// ----------------------------------------------------------------- decoders

export type DecoderKind = "mwpm" | "union-find" | "neural";

export interface DecoderInfo {
  kind: DecoderKind;
  label: string;
  note: string;
}

export const DECODERS: DecoderInfo[] = [
  { kind: "mwpm", label: "MWPM", note: "Minimum-weight perfect matching. Accurate, but latency grows fast with d." },
  { kind: "union-find", label: "Union-Find", note: "Near-linear, much faster; slight accuracy cost." },
  { kind: "neural", label: "Neural", note: "Near-constant latency; active research, needs training." },
];

/** Per-cycle decode latency (ns) for distance d. Illustrative scaling. */
export function decoderLatencyNs(d: number, kind: DecoderKind): number {
  switch (kind) {
    case "mwpm":
      return 0.23 * Math.pow(d, 2.6);
    case "union-find":
      return 0.05 * d * d;
    case "neural":
      return 60 + 0.5 * d;
  }
}

/** Does the decoder keep up with the QEC cycle time? */
export function decoderKeepsUp(d: number, kind: DecoderKind, cycleNs: number): boolean {
  return decoderLatencyNs(d, kind) <= cycleNs;
}

// -------------------------------------------------- magic-state distillation

/**
 * Magic-state distillation overhead. The surface code natively supports only
 * Clifford gates; universal computation needs T gates synthesized by costly
 * distillation factories, which usually dominate the footprint.
 */
export interface DistillationEstimate {
  dataQubits: number;
  factoryQubits: number;
  factories: number;
  factoryFraction: number; // 0-1 of total footprint
  factoryDistance: number;
}

export function magicStateOverhead(
  d: number,
  nLogical: number,
  parallelFactories: number,
  factoryDistance = Math.max(3, Math.round(d * 0.6) | 1),
): DistillationEstimate {
  const dataQubits = totalPhysical(d, nLogical);
  // A 15-to-1 level-1 factory ~ 15 logical patches at the factory distance.
  const perFactory = 15 * physicalPerLogical(factoryDistance);
  const factoryQubits = parallelFactories * perFactory;
  const total = dataQubits + factoryQubits;
  return {
    dataQubits,
    factoryQubits,
    factories: parallelFactories,
    factoryFraction: total > 0 ? factoryQubits / total : 0,
    factoryDistance,
  };
}

// ------------------------------------------------------------- Willow (2024)

export interface WillowPoint {
  d: number;
  errorPerCyclePct: number;
}

/** Google Willow 2024: exponential suppression confirmed across d=3->7. */
export const WILLOW_LAMBDA = 2.14;
export const WILLOW_DATA: WillowPoint[] = [
  { d: 3, errorPerCyclePct: 0.655 },
  { d: 5, errorPerCyclePct: 0.306 },
  { d: 7, errorPerCyclePct: 0.143 },
];
export const WILLOW_CITATION = "Google Quantum AI, “Quantum error correction below the surface code threshold,” Nature 2024.";

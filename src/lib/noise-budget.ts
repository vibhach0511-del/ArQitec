// noise-budget.ts — derive the physical-noise budget a material has to hit,
// given a target QEC code, code distance d, and target logical error rate p_L.
//
// Math: surface-code threshold theorem,
//     p_L ≈ A · (p_phys / p_th)^((d+1)/2)
// Solving for p_phys (the per-gate physical error the engine has to fall under):
//     p_phys = p_th · (p_L / A)^(2/(d+1))
//
// The numbers below (p_th, A, preferred bias) are the same illustrative
// values code_preferences.json uses. Replace with decoder-fit values before any
// real decision; right now this is the calibrated-enough math for the demo.

export type CodeId =
  | "surface"
  | "xzzx"
  | "color"
  | "heavy_hex"
  | "bacon_shor"
  | "steane";

export type CodeMeta = {
  id: CodeId;
  label: string;
  thresholdP2q: number; // p_th — gate error threshold
  prefactor: number;    // A — leading constant in the threshold formula
  biasPref: "agnostic" | "low" | "high" | "extreme";
  biasTargetEta: number; // numerical η target derived from biasPref
  cycleTimeUs: number;
};

export const CODES: Record<CodeId, CodeMeta> = {
  surface:   { id: "surface",   label: "Rotated surface code",       thresholdP2q: 0.010, prefactor: 0.1, biasPref: "agnostic", biasTargetEta: 1,   cycleTimeUs: 1.0 },
  xzzx:      { id: "xzzx",      label: "XZZX surface code",          thresholdP2q: 0.030, prefactor: 0.1, biasPref: "high",     biasTargetEta: 10,  cycleTimeUs: 1.0 },
  color:     { id: "color",     label: "2D color code (6.6.6)",      thresholdP2q: 0.003, prefactor: 0.1, biasPref: "low",      biasTargetEta: 1,   cycleTimeUs: 1.2 },
  heavy_hex: { id: "heavy_hex", label: "Heavy-hex (compass)",        thresholdP2q: 0.0045, prefactor: 0.1, biasPref: "agnostic", biasTargetEta: 1,   cycleTimeUs: 1.0 },
  bacon_shor:{ id: "bacon_shor",label: "Bacon-Shor (subsystem)",     thresholdP2q: 0.002, prefactor: 0.1, biasPref: "high",     biasTargetEta: 8,   cycleTimeUs: 0.8 },
  steane:    { id: "steane",    label: "Steane [[7,1,3]]",           thresholdP2q: 0.0001, prefactor: 0.1, biasPref: "agnostic", biasTargetEta: 1,   cycleTimeUs: 0.7 },
};

export type QubitType = "transmon" | "fluxonium" | "cat";

const GATE_TIME_NS: Record<QubitType, number> = {
  transmon: 40,
  fluxonium: 80,
  cat: 200,
};

export type NoiseBudget = {
  code: CodeMeta;
  d: number;
  pLTarget: number;
  qubit: QubitType;
  pPhysReq: number;     // required physical gate error rate
  gateFidelityReq: number;   // 1 - p_phys
  t1MinUs: number;      // gate time / p_phys (rough)
  t2MinUs: number;      // a bit tighter than T1 in practice
  etaMin: number;       // bias requirement from code preference
  feasible: boolean;    // false if pPhysReq is unphysically tight
  marginNote: string;   // human-readable
};

export function deriveNoiseBudget(
  codeId: CodeId,
  d: number,
  pLTarget: number,
  qubit: QubitType,
): NoiseBudget {
  const code = CODES[codeId];
  // p_phys = p_th · (p_L / A)^(2/(d+1))
  const ratio = pLTarget / code.prefactor;
  const exponent = 2 / (d + 1);
  const pPhysReq = code.thresholdP2q * Math.pow(ratio, exponent);

  // Coherence-time floors — gate_time / T1 < p_phys per 2q gate
  const gateNs = GATE_TIME_NS[qubit];
  const t1MinUs = gateNs / pPhysReq / 1000;
  const t2MinUs = t1MinUs * 0.6;

  const etaMin = code.biasTargetEta;

  // Sanity / feasibility — if p_phys requirement is below 1e-5 the
  // material problem becomes essentially open-research-hard. Mark as such.
  const feasible = pPhysReq > 1e-5 && pPhysReq < code.thresholdP2q;

  const marginNote = feasible
    ? `Below threshold by ${((code.thresholdP2q / pPhysReq)).toFixed(1)}×`
    : pPhysReq < 1e-5
      ? "Open-research-hard regime"
      : "Above threshold — distance too small for target";

  return {
    code,
    d,
    pLTarget,
    qubit,
    pPhysReq,
    gateFidelityReq: 1 - pPhysReq,
    t1MinUs,
    t2MinUs,
    etaMin,
    feasible,
    marginNote,
  };
}

export function formatScientific(x: number, digits = 2): string {
  if (x === 0) return "0";
  const e = Math.floor(Math.log10(Math.abs(x)));
  const m = x / Math.pow(10, e);
  return `${m.toFixed(digits)}e${e >= 0 ? "+" : ""}${e}`;
}

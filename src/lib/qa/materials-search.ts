// Q-Architect — combinatorial materials search (quantum vs classical), via XpyQ.
// Searches material STACKS (electrode x substrate x junction x superinductor)
// for the best QEC fit, and projects the cost of the search:
//   - classical brute force on CPU / GPU (linear in the combination count N)
//   - quantum unstructured search (Grover) — ~sqrt(N) oracle calls
// to quantify the quantum speedup.
//
// Deterministic projection. TODO(integration): submit the real search to XpyQ
// (acceleration endpoints / IBM Quantum) — params below are the single place to
// swap in measured per-evaluation costs.

import { MATERIALS, type QubitMaterial } from "./materials-data";
import {
  mpRelevance,
  physicalPerLogical,
  recommendCode,
  requiredDistance,
  type CodesignTarget,
} from "./codesign";

// Role buckets (oxide / loss materials are excluded as contaminants).
export const ELECTRODES = MATERIALS.filter((m) => /electrode/.test(m.role));
export const SUBSTRATES = MATERIALS.filter((m) => /substrate/.test(m.role));
export const JUNCTIONS = MATERIALS.filter((m) => /junction|barrier/.test(m.role));
export const SUPERINDUCTORS = MATERIALS.filter((m) => /superinductor/.test(m.role));

export const STACK_BUCKETS = [
  { label: "Electrode", items: ELECTRODES },
  { label: "Substrate", items: SUBSTRATES },
  { label: "Junction", items: JUNCTIONS },
  { label: "Superinductor", items: SUPERINDUCTORS },
];

export function combinationCount(): number {
  return ELECTRODES.length * SUBSTRATES.length * JUNCTIONS.length * SUPERINDUCTORS.length;
}

export interface StackResult {
  electrode: QubitMaterial;
  substrate: QubitMaterial;
  junction: QubitMaterial;
  superinductor: QubitMaterial;
  effectiveP2q: number;
  biasEta: number;
  relevance: number;
  code: string;
  distance: number | null;
  perLogical: number | null;
  feasible: boolean;
}

function better(a: StackResult, b: StackResult): boolean {
  if (a.feasible !== b.feasible) return a.feasible;
  if (Math.abs(a.relevance - b.relevance) > 0.5) return a.relevance > b.relevance;
  return a.effectiveP2q < b.effectiveP2q;
}

/** Enumerate every material stack and return the best one for the target. */
export function bestStack(target: CodesignTarget): StackResult | null {
  if (!ELECTRODES.length || !SUBSTRATES.length || !JUNCTIONS.length || !SUPERINDUCTORS.length) return null;
  let best: StackResult | null = null;
  for (const e of ELECTRODES)
    for (const s of SUBSTRATES)
      for (const j of JUNCTIONS)
        for (const si of SUPERINDUCTORS) {
          // Electrode dominates gate error; junction + substrate add loss.
          const effectiveP2q = 0.6 * e.pGate2q + 0.2 * j.pGate2q + 0.2 * s.pGate2q;
          const biasEta = Math.max(e.biasEta, si.biasEta);
          const code = recommendCode({ pGate2q: effectiveP2q, biasEta });
          let d = requiredDistance(effectiveP2q, target.logicalErrorTarget);
          const feasible = d !== null && !code.startsWith("NONE");
          if (d !== null && (code.includes("XZZX") || code.includes("Color"))) {
            d = Math.max(3, d / Math.sqrt(Math.max(1, biasEta)));
          }
          const relevance = Math.round(((mpRelevance(e) + mpRelevance(s) + mpRelevance(j) + mpRelevance(si)) / 4) * 10) / 10;
          const result: StackResult = {
            electrode: e, substrate: s, junction: j, superinductor: si,
            effectiveP2q: Math.round(effectiveP2q * 1e5) / 1e5, biasEta, relevance,
            code, distance: d, perLogical: d !== null ? physicalPerLogical(d) : null, feasible,
          };
          if (!best || better(result, best)) best = result;
        }
  return best;
}

// ----------------------------------------------------- cost projection

export const SEARCH_PARAMS = {
  evalTimeS: 0.5,    // per-stack QEC evaluation (Stim + decoder sim)
  cpuCores: 8,       // workstation cores
  gpuParallel: 2048, // GPU parallel evaluations
  qpuOracleS: 0.05,  // per Grover amplitude-amplification iteration
};

/** Reference scale for the "at scale" speedup callout (e.g. a full MP pull). */
export const SCALE_REFERENCE = 1_000_000;

export interface SearchProjection {
  combos: number;
  cpuTimeS: number;
  gpuTimeS: number;
  quantumS: number;
  groverIters: number;
  speedupCpu: number;
  speedupGpu: number;
}

export function searchProjection(N: number, p = SEARCH_PARAMS): SearchProjection {
  const cpuTimeS = (N * p.evalTimeS) / p.cpuCores;
  const gpuTimeS = (N * p.evalTimeS) / p.gpuParallel;
  const groverIters = Math.ceil((Math.PI / 4) * Math.sqrt(N));
  const quantumS = groverIters * p.qpuOracleS;
  return {
    combos: N, cpuTimeS, gpuTimeS, quantumS, groverIters,
    speedupCpu: cpuTimeS / quantumS, speedupGpu: gpuTimeS / quantumS,
  };
}

/** Sweep N across decades for the time-vs-combinations chart. */
export function sweepProjection(): { n: number; cpu: number; gpu: number; quantum: number }[] {
  const out: { n: number; cpu: number; gpu: number; quantum: number }[] = [];
  for (let e = 2; e <= 9; e++) {
    const n = 10 ** e;
    const pr = searchProjection(n);
    out.push({ n, cpu: pr.cpuTimeS, gpu: pr.gpuTimeS, quantum: pr.quantumS });
  }
  return out;
}

// ArQiteQ — combinatorial materials search (quantum vs classical), via XpyQ.
// Measured benchmarks from qec_pipeline/materials_search_benchmark.py when available.

import { MATERIALS, type QubitMaterial } from "./materials-data";
import {
  mpRelevance,
  physicalPerLogical,
  recommendCode,
  requiredDistance,
  type CodesignTarget,
} from "./codesign";

import { MATERIALS_SEARCH_BENCHMARK } from "./materials-search-data";

function loadBenchmark() {
  return MATERIALS_SEARCH_BENCHMARK;
}

export function hasMeasuredBenchmark(): boolean {
  return loadBenchmark() !== null;
}

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

// ----------------------------------------------------- cost projection (fallback)

export const SEARCH_PARAMS = {
  evalTimeS: 0.5,
  cpuCores: 8,
  gpuParallel: 2048,
  qpuOracleS: 0.05,
};

export const SCALE_REFERENCE = 1_000_000;

/** Display labels — Grover-scaled paths are projected from measured per-oracle API times. */
export const SEARCH_PATH_LABELS = {
  classical: "Classical CPU (O(N) enum)",
  xpyq: "XpyQ (Grover-scaled)",
  ibm: "IBM Quantum (Grover-scaled)",
} as const;

export const GROVER_SCALING_NOTE =
  "Measured per-stack oracle via live API × ceil(π/4·√N) — not a full Grover search job.";

export interface SearchProjection {
  combos: number;
  cpuTimeS: number;
  gpuTimeS: number;
  xpyqTimeS: number;
  ibmTimeS: number;
  groverIters: number;
  speedupCpu: number;
  speedupXpyq: number;
  measured: boolean;
}

export function searchProjection(N: number): SearchProjection {
  const b = loadBenchmark();
  const groverIters = b?.groverIters ?? Math.ceil((Math.PI / 4) * Math.sqrt(N));
  const stackOracle = b?.classical.stackOracleS ?? b?.xpyq.perEvalS ?? SEARCH_PARAMS.evalTimeS;
  if (b && N === b.combos) {
    return {
      combos: N,
      cpuTimeS: b.classical.searchS ?? b.classical.totalWallS,
      gpuTimeS: b.classical.gpuProjectedS,
      xpyqTimeS: b.xpyq.groverS,
      ibmTimeS: b.ibm.groverS,
      groverIters: b.groverIters,
      speedupCpu: (b.classical.searchS ?? b.classical.totalWallS) / b.xpyq.groverS,
      speedupXpyq: (b.classical.searchS ?? b.classical.totalWallS) / b.ibm.groverS,
      measured: true,
    };
  }
  const perEval = stackOracle;
  const perXpyq = b?.xpyq.perEvalS ?? SEARCH_PARAMS.qpuOracleS;
  const perIbm = b?.ibm.perOracleS ?? SEARCH_PARAMS.qpuOracleS;
  const cpuTimeS = N * perEval;
  const gpuTimeS = cpuTimeS / SEARCH_PARAMS.gpuParallel;
  const xpyqTimeS = groverIters * perXpyq;
  const ibmTimeS = groverIters * perIbm;
  return {
    combos: N, cpuTimeS, gpuTimeS, xpyqTimeS, ibmTimeS, groverIters,
    speedupCpu: cpuTimeS / xpyqTimeS,
    speedupXpyq: cpuTimeS / ibmTimeS,
    measured: Boolean(b),
  };
}

export function measuredBarComparison(): { label: string; timeS: number; source: string }[] | null {
  const bars = loadBenchmark()?.barComparison ?? null;
  if (!bars?.length) return null;
  // Slowest → fastest so bar height decreases left-to-right.
  return [...bars].sort((a, b) => b.timeS - a.timeS);
}

/** Stable bar colors keyed by path label (not chart position). */
export function barColorForSearchLabel(label: string): string {
  if (label.startsWith("Classical")) return "oklch(0.7 0.22 25)";
  if (label.startsWith("XpyQ")) return "oklch(0.82 0.16 200)";
  return "oklch(0.78 0.18 150)";
}

export function measuredSweep(): { n: number; classical: number; gpu: number; xpyq: number; ibm: number }[] {
  const b = loadBenchmark();
  if (b?.sweep?.length) return b.sweep;
  return sweepProjectionFallback();
}

/** Fallback analytic sweep when benchmark file missing. */
export function sweepProjectionFallback(): { n: number; classical: number; gpu: number; xpyq: number; ibm: number }[] {
  const out: { n: number; classical: number; gpu: number; xpyq: number; ibm: number }[] = [];
  for (let e = 2; e <= 9; e++) {
    const n = 10 ** e;
    const pr = searchProjection(n);
    out.push({ n, classical: pr.cpuTimeS, gpu: pr.gpuTimeS, xpyq: pr.xpyqTimeS, ibm: pr.ibmTimeS });
  }
  return out;
}

/** @deprecated use measuredSweep */
export function sweepProjection(): { n: number; cpu: number; gpu: number; quantum: number }[] {
  return measuredSweep().map((r) => ({ n: r.n, cpu: r.classical, gpu: r.gpu, quantum: r.xpyq }));
}

export function ibmHardwareSamples() {
  return loadBenchmark()?.ibm.samples ?? [];
}

// Q-Architect — typed mock datasets.
// Source of truth for materials, topologies, workloads, and QEC codes.
// Values are illustrative, calibrated to 2024–2026 literature ranges.
//
// TODO(integration): hydrate MATERIAL_PROFILES from live IBM Quantum backend
// properties (QiskitRuntimeService().backend(name).properties()) and replace
// topology intrinsics with values derived from the real coupling map.

import type {
  CodeCharacteristics,
  ErrorCorrectionCode,
  MaterialProfile,
  QECId,
  QuantumWorkload,
  QubitFamily,
  QubitTopology,
  WorkloadId,
} from "./types";

// Superconducting-qubit families (the Charge / Flux / Phase branches of the
// taxonomy). The 3 families are groupings; the qubit types live in MATERIAL_PROFILES.
export const QUBIT_FAMILIES: QubitFamily[] = [
  { id: "charge", label: "Charge", regime: "EJ ≪ EC", accent: "violet" },
  { id: "flux", label: "Flux", regime: "EJ ≫ EC", accent: "green" },
  { id: "phase", label: "Phase", regime: "Large JJ, current-biased", accent: "amber" },
];

// Qubit catalogue — the superconducting-qubit taxonomy (Charge / Flux / Phase).
// Gate fidelities = 1 - p_gate; readout error = p_meas. Numbers are illustrative
// representative values calibrated to the literature; replace with measured data.
// Historical qubit types (Cooper pair box, RF-SQUID, flux/phase qubit,
// quantronium) carry deliberately low coherence to reflect their era.
export const MATERIAL_PROFILES: MaterialProfile[] = [
  // ---- Charge family (EJ ≪ EC) ----
  {
    id: "cooper-pair-box",
    name: "Cooper Pair Box",
    short: "Cooper Pair Box",
    vendor: "Original charge qubit · 15 mK",
    family: "charge", regimeLabel: "Original charge qubit",
    t1Us: 1.0, t2Us: 0.5,
    gate1QFidelity: 98.0, gate2QFidelity: 90.0, readoutError: 8.0,
    crosstalk: 0.5, yield: 60, cryoComplexity: 0.7, tempMK: 15,
    preferredDegree: 2, biasEta: 8, biasAxis: "Z",
    connectivity: "2d-nn", native2qGate: "capacitive", cliffordsNative: true,
    gate2qTimeNs: 50, measTimeUs: 1.0, leakage: 0.01,
    notes: "The original charge qubit. Severely charge-noise limited (sub-µs coherence); historical ancestor of the transmon.",
  },
  {
    id: "transmon",
    name: "Transmon",
    short: "Transmon",
    vendor: "IBM Heron-class · heavy-hex",
    family: "charge", regimeLabel: "Shunted capacitor",
    t1Us: 150, t2Us: 120,
    gate1QFidelity: 99.96, gate2QFidelity: 99.5, readoutError: 1.5,
    crosstalk: 0.3, yield: 97, cryoComplexity: 0.78, tempMK: 15,
    preferredDegree: 3, biasEta: 1.5, biasAxis: "Z",
    connectivity: "heavy-hex", native2qGate: "CZ", cliffordsNative: true,
    gate2qTimeNs: 40, measTimeUs: 1.0, leakage: 0.0001,
    notes: "Charge qubit shunted by a large capacitor to flatten charge dispersion. The modern workhorse; heavy-hex suppresses crosstalk.",
  },
  {
    id: "xmon",
    name: "Xmon",
    short: "Xmon",
    vendor: "Planar transmon · 15 mK",
    family: "charge", parent: "transmon", regimeLabel: "Cross-shaped capacitor",
    t1Us: 90, t2Us: 80,
    gate1QFidelity: 99.95, gate2QFidelity: 99.4, readoutError: 1.0,
    crosstalk: 0.25, yield: 95, cryoComplexity: 0.75, tempMK: 15,
    preferredDegree: 4, biasEta: 1.4, biasAxis: "Z",
    connectivity: "2d-nn", native2qGate: "CZ", cliffordsNative: true,
    gate2qTimeNs: 30, measTimeUs: 0.8, leakage: 0.0002,
    notes: "Transmon variant with a cross-shaped capacitor for fast tunable coupling and planar wiring (Google-style).",
  },
  {
    id: "gatemon",
    name: "Gatemon",
    short: "Gatemon",
    vendor: "Semiconductor JJ · 15 mK",
    family: "charge", parent: "transmon", regimeLabel: "Semiconductor JJ",
    t1Us: 30, t2Us: 20,
    gate1QFidelity: 99.7, gate2QFidelity: 98.5, readoutError: 2.5,
    crosstalk: 0.35, yield: 70, cryoComplexity: 0.7, tempMK: 15,
    preferredDegree: 3, biasEta: 1.6, biasAxis: "Z",
    connectivity: "2d-nn", native2qGate: "CZ", cliffordsNative: true,
    gate2qTimeNs: 40, measTimeUs: 1.0, leakage: 0.001,
    notes: "Transmon variant with a gate-voltage-tunable semiconductor Josephson junction (no flux line). Lower coherence today.",
  },
  // ---- Flux family (EJ ≫ EC) ----
  {
    id: "rf-squid",
    name: "RF-SQUID",
    short: "RF-SQUID",
    vendor: "Single-junction flux loop · 15 mK",
    family: "flux", regimeLabel: "Single junction",
    t1Us: 5, t2Us: 2,
    gate1QFidelity: 99.0, gate2QFidelity: 95.0, readoutError: 5.0,
    crosstalk: 0.4, yield: 65, cryoComplexity: 0.7, tempMK: 15,
    preferredDegree: 2, biasEta: 5, biasAxis: "Z",
    connectivity: "2d-nn", native2qGate: "CZ", cliffordsNative: true,
    gate2qTimeNs: 60, measTimeUs: 1.5, leakage: 0.005,
    notes: "Single-junction superconducting loop. Flux-noise limited; mostly of historical interest.",
  },
  {
    id: "flux-qubit",
    name: "Flux Qubit",
    short: "Flux Qubit",
    vendor: "Persistent-current loop · 15 mK",
    family: "flux", regimeLabel: "JJ persistent current",
    t1Us: 50, t2Us: 40,
    gate1QFidelity: 99.5, gate2QFidelity: 98.0, readoutError: 3.0,
    crosstalk: 0.35, yield: 75, cryoComplexity: 0.72, tempMK: 15,
    preferredDegree: 3, biasEta: 6, biasAxis: "Z",
    connectivity: "2d-nn", native2qGate: "CZ", cliffordsNative: true,
    gate2qTimeNs: 50, measTimeUs: 1.2, leakage: 0.001,
    notes: "Persistent-current (multi-junction) flux qubit. Flux-noise dephasing dominates the bias.",
  },
  {
    id: "fluxonium",
    name: "Fluxonium",
    short: "Fluxonium",
    vendor: "JJ + superinductor · 15 mK",
    family: "flux", regimeLabel: "JJ + superinductor",
    t1Us: 400, t2Us: 300,
    gate1QFidelity: 99.97, gate2QFidelity: 99.6, readoutError: 2.0,
    crosstalk: 0.15, yield: 90, cryoComplexity: 0.72, tempMK: 15,
    preferredDegree: 4, biasEta: 6.0, biasAxis: "Z",
    connectivity: "2d-nn", native2qGate: "CZ", cliffordsNative: true,
    gate2qTimeNs: 80, measTimeUs: 2.0, leakage: 0.0001,
    notes: "Junction shunted by a superinductor. Phase-dominated noise makes XZZX a natural fit; higher T1 than transmon.",
  },
  // ---- Phase family (large JJ, current-biased) ----
  {
    id: "phase-qubit",
    name: "Phase Qubit",
    short: "Phase Qubit",
    vendor: "Current-biased JJ · 15 mK",
    family: "phase", regimeLabel: "Current-biased",
    t1Us: 0.5, t2Us: 0.3,
    gate1QFidelity: 98.5, gate2QFidelity: 92.0, readoutError: 6.0,
    crosstalk: 0.45, yield: 60, cryoComplexity: 0.7, tempMK: 15,
    preferredDegree: 2, biasEta: 3, biasAxis: "Z",
    connectivity: "2d-nn", native2qGate: "CZ", cliffordsNative: true,
    gate2qTimeNs: 50, measTimeUs: 1.0, leakage: 0.01,
    notes: "Large current-biased junction operated in the phase regime. Short-lived; largely historical.",
  },
  {
    id: "quantronium",
    name: "Quantronium",
    short: "Quantronium",
    vendor: "Charge-phase hybrid · 15 mK",
    family: "phase", regimeLabel: "Charge-phase hybrid",
    t1Us: 1.5, t2Us: 0.5,
    gate1QFidelity: 99.0, gate2QFidelity: 94.0, readoutError: 5.0,
    crosstalk: 0.4, yield: 65, cryoComplexity: 0.7, tempMK: 15,
    preferredDegree: 2, biasEta: 2.5, biasAxis: "Z",
    connectivity: "2d-nn", native2qGate: "CZ", cliffordsNative: true,
    gate2qTimeNs: 50, measTimeUs: 1.0, leakage: 0.005,
    notes: "Charge-phase hybrid operated at a double sweet spot (Saclay). Demonstrated first-sweet-spot coherence gains.",
  },
];

export const QUBIT_TOPOLOGIES: QubitTopology[] = [
  {
    id: "square",
    name: "Square Grid",
    kind: "standard",
    avgDegree: 4,
    connectivity: 58,
    swapOverhead: 72,
    crosstalk: 64,
    qecCompatibility: 86,
    manufacturability: 91,
    description: "Regular 2D nearest-neighbor lattice. Canonical surface-code substrate.",
  },
  {
    id: "heavy-hex",
    name: "Heavy-Hex",
    kind: "standard",
    avgDegree: 3,
    connectivity: 49,
    swapOverhead: 68,
    crosstalk: 42,
    qecCompatibility: 88,
    manufacturability: 84,
    description: "Degree-3 hex with flag qubits. Reduced frequency collisions, IBM-style.",
  },
  {
    id: "modular",
    name: "Modular Cluster",
    kind: "standard",
    avgDegree: 5,
    connectivity: 71,
    swapOverhead: 54,
    crosstalk: 38,
    qecCompatibility: 74,
    manufacturability: 69,
    description: "Tiled clusters joined by long-range couplers. Localized dense traffic.",
  },
  {
    id: "ai-opt",
    name: "Q-Architect AI Topology",
    kind: "ai",
    avgDegree: 4.3,
    connectivity: 82,
    swapOverhead: 31,
    crosstalk: 29,
    qecCompatibility: 91,
    manufacturability: 78,
    description: "Genetic search + RL refinement. Heavy-hex backbone with selective shortcuts.",
  },
  {
    id: "random",
    name: "Random Topology",
    kind: "baseline",
    avgDegree: 2.4,
    connectivity: 34,
    swapOverhead: 88,
    crosstalk: 71,
    qecCompatibility: 41,
    manufacturability: 52,
    description: "Irregular pseudo-random couplers. Naive baseline with no structure.",
  },
  {
    id: "max-connectivity",
    name: "Max-Connectivity",
    kind: "baseline",
    avgDegree: 9.5,
    connectivity: 97,
    swapOverhead: 12,
    crosstalk: 93,
    qecCompatibility: 58,
    manufacturability: 28,
    description: "Near all-to-all couplers. Minimal routing but severe crosstalk & fab cost.",
  },
];

export const QUANTUM_WORKLOADS: QuantumWorkload[] = [
  {
    id: "qaoa",
    name: "QAOA · MaxCut-64",
    logicalQubits: 64,
    twoQubitGates: 960,
    depth: 96,
    interactionDensity: 0.55,
    targetLogicalError: 1e-2,
    description: "p=3 MaxCut on a 64-node graph. Medium-range, structured interactions.",
  },
  {
    id: "vqe",
    name: "VQE · H₂O / 6-31G",
    logicalQubits: 26,
    twoQubitGates: 1480,
    depth: 210,
    interactionDensity: 0.72,
    targetLogicalError: 5e-3,
    description: "UCCSD ansatz for water. Dense fermionic interactions, deep circuit.",
  },
  {
    id: "qft",
    name: "Quantum Fourier Transform · 32q",
    logicalQubits: 32,
    twoQubitGates: 496,
    depth: 120,
    interactionDensity: 0.9,
    targetLogicalError: 1e-3,
    description: "All-to-all controlled-phase ladder. Near-complete interaction graph.",
  },
  {
    id: "random",
    name: "Random Circuit · 20 layers",
    logicalQubits: 20,
    twoQubitGates: 1900,
    depth: 420,
    interactionDensity: 0.85,
    targetLogicalError: 5e-2,
    description: "Random two-qubit layers. Stress test for routing and crosstalk.",
  },
  {
    id: "syndrome",
    name: "Surface-Code Syndrome",
    logicalQubits: 49,
    twoQubitGates: 392,
    depth: 32,
    interactionDensity: 0.18,
    targetLogicalError: 1e-6,
    description: "Stabilizer extraction. Strictly local nearest-neighbor pattern.",
  },
];

export const ERROR_CORRECTION_CODES: ErrorCorrectionCode[] = [
  {
    id: "surface",
    name: "Surface Code",
    family: "Topological CSS",
    baseDistance: 7,
    physicalPerLogical: 98,
    logicalErrorBase: 1.4e-7,
    syndromeOverhead: 38,
    compatibility: 92,
    localityRequirement: 0.9,
  },
  {
    id: "heavy-hex",
    name: "Heavy-Hex Code",
    family: "Subsystem",
    baseDistance: 5,
    physicalPerLogical: 74,
    logicalErrorBase: 6.2e-6,
    syndromeOverhead: 31,
    compatibility: 96,
    localityRequirement: 0.7,
  },
  {
    id: "color",
    name: "Color Code",
    family: "Topological CSS",
    baseDistance: 5,
    physicalPerLogical: 91,
    logicalErrorBase: 8.4e-6,
    syndromeOverhead: 44,
    compatibility: 71,
    localityRequirement: 0.95,
  },
  {
    id: "repetition",
    name: "Repetition Code",
    family: "Classical analogue",
    baseDistance: 9,
    physicalPerLogical: 9,
    logicalErrorBase: 2.1e-3,
    syndromeOverhead: 12,
    compatibility: 100,
    localityRequirement: 0.3,
  },
  {
    id: "xzzx",
    name: "XZZX Surface Code",
    family: "Tailored CSS",
    baseDistance: 7,
    physicalPerLogical: 98,
    logicalErrorBase: 9.0e-9,
    syndromeOverhead: 40,
    compatibility: 88,
    localityRequirement: 0.9,
  },
  {
    id: "bacon-shor",
    name: "Bacon-Shor / Subsystem",
    family: "Subsystem",
    baseDistance: 5,
    physicalPerLogical: 50,
    logicalErrorBase: 4.0e-5,
    syndromeOverhead: 22,
    compatibility: 82,
    localityRequirement: 0.5,
  },
];

export const QUBIT_BUDGET = 127;

export const getMaterial = (id: string) =>
  MATERIAL_PROFILES.find((m) => m.id === id) ?? MATERIAL_PROFILES[0];
export const getTopology = (id: string) =>
  QUBIT_TOPOLOGIES.find((t) => t.id === id) ?? QUBIT_TOPOLOGIES[0];
export const getWorkload = (id: string) =>
  QUANTUM_WORKLOADS.find((w) => w.id === id) ?? QUANTUM_WORKLOADS[0];
export const getCode = (id: string) =>
  ERROR_CORRECTION_CODES.find((c) => c.id === id) ?? ERROR_CORRECTION_CODES[0];

/** Topologies that are real layout candidates (excludes naive baselines). */
export const CANDIDATE_TOPOLOGIES = QUBIT_TOPOLOGIES.filter(
  (t) => t.kind !== "baseline",
);

/** The five baseline methods compared on the Results page. */
export const BASELINE_METHODS: { method: string; topologyId: QubitTopology["id"] }[] = [
  { method: "Random topology", topologyId: "random" },
  { method: "Square grid", topologyId: "square" },
  { method: "Max-connectivity", topologyId: "max-connectivity" },
  { method: "Heavy-hex", topologyId: "heavy-hex" },
  { method: "AI-optimized", topologyId: "ai-opt" },
];

// ---------------------------------------------------------------------------
// Code Designer datasets: each QEC code as a vector of the 10 characteristics,
// and the workload -> preferred-code affinity matrix.
// ---------------------------------------------------------------------------

/**
 * CODE_CHARACTERISTICS — the 10 engineering tradeoffs per code.
 * thresholdPct: physical-error threshold (%); logicalErrorFloor: -log10(p_L);
 * distance/qubitOverhead/connectivityDegree/syndromeOverhead are raw;
 * decoderComplexity/biasCompatibility/crosstalkSensitivity/manufacturabilityFit are 0-100.
 */
export const CODE_CHARACTERISTICS: Record<QECId, CodeCharacteristics> = {
  repetition: {
    thresholdPct: 25, logicalErrorFloor: 3, distance: 9, qubitOverhead: 9,
    connectivityDegree: 2, syndromeOverhead: 12, decoderComplexity: 10,
    biasCompatibility: 95, crosstalkSensitivity: 20, manufacturabilityFit: 95,
  },
  surface: {
    thresholdPct: 0.9, logicalErrorFloor: 7, distance: 7, qubitOverhead: 98,
    connectivityDegree: 4, syndromeOverhead: 38, decoderComplexity: 55,
    biasCompatibility: 30, crosstalkSensitivity: 55, manufacturabilityFit: 80,
  },
  "heavy-hex": {
    thresholdPct: 0.5, logicalErrorFloor: 6, distance: 5, qubitOverhead: 74,
    connectivityDegree: 3, syndromeOverhead: 31, decoderComplexity: 50,
    biasCompatibility: 35, crosstalkSensitivity: 35, manufacturabilityFit: 92,
  },
  color: {
    thresholdPct: 0.4, logicalErrorFloor: 6, distance: 5, qubitOverhead: 91,
    connectivityDegree: 6, syndromeOverhead: 44, decoderComplexity: 80,
    biasCompatibility: 30, crosstalkSensitivity: 65, manufacturabilityFit: 55,
  },
  "bacon-shor": {
    thresholdPct: 0.3, logicalErrorFloor: 5, distance: 5, qubitOverhead: 50,
    connectivityDegree: 4, syndromeOverhead: 22, decoderComplexity: 35,
    biasCompatibility: 80, crosstalkSensitivity: 40, manufacturabilityFit: 70,
  },
  xzzx: {
    thresholdPct: 5.0, logicalErrorFloor: 9, distance: 7, qubitOverhead: 98,
    connectivityDegree: 4, syndromeOverhead: 40, decoderComplexity: 60,
    biasCompatibility: 98, crosstalkSensitivity: 55, manufacturabilityFit: 78,
  },
};

/** WORKLOAD_CODE_AFFINITY — preferred codes per workload (best first). */
export const WORKLOAD_CODE_AFFINITY: Record<WorkloadId, QECId[]> = {
  qaoa: ["surface", "heavy-hex"],
  vqe: ["bacon-shor", "xzzx", "heavy-hex"],
  qft: ["surface", "color"],
  random: ["surface", "heavy-hex"],
  syndrome: ["surface", "heavy-hex", "color"],
};

export const getCodeCharacteristics = (id: QECId): CodeCharacteristics =>
  CODE_CHARACTERISTICS[id];

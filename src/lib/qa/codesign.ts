// ArQiteQ — Co-Design Selector engine.
// Ports the `vibha` Python catalogues + recommender to TypeScript:
//   - SC_DEVICES         <- superconducting_qubit.py (DEVICES)
//   - CONTROL_HARDWARE   <- control_hardware_catalogue.py (HARDWARE)
//   - TARGETS            <- target.py (TARGETS)
//   - recommendCode/feasibility <- qec_recommender.py + target.py
//
// The selector: pick qubit type -> control -> cryogenics -> target, then rank
// the compatible+feasible materials (devices) and recommend the best QEC code.
//
// TODO(integration): drive these from the Python modules directly (export JSON
// from qubit_catalogue.py / control_hardware_catalogue.py / target.py).

import { MATERIALS, type QubitMaterial } from "./materials-data";
import { CRYOSTATS, type Cryostat } from "./cryostat-data";

// ---------------------------------------------------------------- data

export type SCQubitType = "transmon" | "fluxonium" | "cat" | "GKP" | "Xmon";

export interface SCDevice {
  id: string;
  name: string;
  qubitType: SCQubitType;
  biasEta: number;
  pGate2q: number;
  pGate1q: number;
  pMeas: number;
  connectivity: string;
  cliffordsNative: boolean;
  t1Us: number;
  t2Us: number;
  substrate: string;
  notes: string;
}

export const SC_DEVICES: SCDevice[] = [
  { id: "heron-r2", name: "IBM Heron R2", qubitType: "transmon", biasEta: 1.5, pGate2q: 0.005, pGate1q: 0.0004, pMeas: 0.015, connectivity: "heavy-hex", cliffordsNative: true, t1Us: 150, t2Us: 120, substrate: "silicon", notes: "Fixed-frequency transmons with tunable couplers; heavy-hex suppresses crosstalk." },
  { id: "willow", name: "Google Willow", qubitType: "transmon", biasEta: 1.4, pGate2q: 0.005, pGate1q: 0.0003, pMeas: 0.008, connectivity: "2d-nn", cliffordsNative: true, t1Us: 100, t2Us: 90, substrate: "silicon", notes: "2024 logical-qubit demo platform. Tunable transmons + couplers; square lattice." },
  { id: "ankaa-3", name: "Rigetti Ankaa-3", qubitType: "transmon", biasEta: 1.6, pGate2q: 0.007, pGate1q: 0.0005, pMeas: 0.02, connectivity: "2d-nn", cliffordsNative: true, t1Us: 80, t2Us: 50, substrate: "silicon", notes: "Square-grid tunable transmons; fast cycle, higher per-gate error than Heron." },
  { id: "iqm-garnet", name: "IQM Garnet", qubitType: "transmon", biasEta: 1.5, pGate2q: 0.008, pGate1q: 0.0008, pMeas: 0.025, connectivity: "2d-nn", cliffordsNative: true, t1Us: 60, t2Us: 40, substrate: "silicon", notes: "20-qubit commercial platform; square lattice, on-prem deployable." },
  { id: "atlantic-fluxonium", name: "Atlantic Quantum Fluxonium", qubitType: "fluxonium", biasEta: 6.0, pGate2q: 0.004, pGate1q: 0.0003, pMeas: 0.02, connectivity: "2d-nn", cliffordsNative: true, t1Us: 400, t2Us: 300, substrate: "sapphire", notes: "Heavy-fluxonium, large anharmonicity → low leakage. Bias regime fits XZZX." },
  { id: "aws-ocelot-cat", name: "AWS Ocelot-class cat", qubitType: "cat", biasEta: 500, pGate2q: 0.01, pGate1q: 0.001, pMeas: 0.005, connectivity: "2d-nn", cliffordsNative: false, t1Us: 500, t2Us: 400, substrate: "tantalum-on-silicon", notes: "Two-photon-stabilized cat; bit flips exponentially suppressed — bias is the design point." },
  { id: "yale-gkp", name: "Yale GKP-on-cavity", qubitType: "GKP", biasEta: 50, pGate2q: 0.003, pGate1q: 0.0005, pMeas: 0.01, connectivity: "2d-nn", cliffordsNative: true, t1Us: 600, t2Us: 500, substrate: "tantalum-on-silicon", notes: "Bosonic GKP in a high-Q 3D cavity; concatenation with a 2D code is the near-term plan." },
  { id: "sycamore", name: "Google Sycamore (2019)", qubitType: "Xmon", biasEta: 1.3, pGate2q: 0.006, pGate1q: 0.0005, pMeas: 0.038, connectivity: "2d-nn", cliffordsNative: true, t1Us: 15, t2Us: 10, substrate: "silicon", notes: "Historical 2019 supremacy chip; baseline before the recent T1 / readout jump." },
];

export type ControlCategory =
  | "room-temp-controller"
  | "cryogenic-controller"
  | "parametric-amplifier"
  | "hemt-amplifier"
  | "dilution-refrigerator"
  | "ion-trap-controller"
  | "photonic-controller";

export interface ControlHardware {
  id: string;
  name: string;
  vendor: string;
  category: ControlCategory;
  operatingTempK: number;
  latencyFeedbackNs?: number;
  realTimeDecoding: boolean;
  supportsPlatforms: string[];
  supportsTopology: string[];
  maxQubits: number;
  scalabilityCeiling: number;
  notes: string;
}

export const CONTROL_HARDWARE: ControlHardware[] = [
  { id: "opx1000", name: "OPX1000", vendor: "Quantum Machines", category: "room-temp-controller", operatingTempK: 300, latencyFeedbackNs: 300, realTimeDecoding: true, supportsPlatforms: ["transmon", "fluxonium", "neutral-atom", "silicon-spin"], supportsTopology: ["2d-nn", "heavy-hex", "reconfigurable"], maxQubits: 40, scalabilityCeiling: 1000, notes: "FPGA pulse processor; real-time control flow makes mid-circuit QEC feedback feasible." },
  { id: "shfqc", name: "SHFQC", vendor: "Zurich Instruments", category: "room-temp-controller", operatingTempK: 300, latencyFeedbackNs: 400, realTimeDecoding: false, supportsPlatforms: ["transmon", "fluxonium"], supportsTopology: ["2d-nn", "heavy-hex"], maxQubits: 8, scalabilityCeiling: 64, notes: "Tight drive+readout integration; no real-time decoder in the loop." },
  { id: "qblox-cluster", name: "Cluster", vendor: "Qblox", category: "room-temp-controller", operatingTempK: 300, latencyFeedbackNs: 600, realTimeDecoding: true, supportsPlatforms: ["transmon", "fluxonium", "silicon-spin"], supportsTopology: ["2d-nn", "heavy-hex"], maxQubits: 16, scalabilityCeiling: 512, notes: "Modular rack-mount; FPGA per module enables distributed decoders." },
  { id: "keysight-m9415", name: "M9415 AWG", vendor: "Keysight", category: "room-temp-controller", operatingTempK: 300, latencyFeedbackNs: 2000, realTimeDecoding: false, supportsPlatforms: ["transmon", "fluxonium", "photonic"], supportsTopology: ["2d-nn", "reconfigurable"], maxQubits: 4, scalabilityCeiling: 32, notes: "Highest signal fidelity; latency rules it out of the QEC feedback loop." },
  { id: "horse-ridge-2", name: "Horse Ridge II", vendor: "Intel", category: "cryogenic-controller", operatingTempK: 4, latencyFeedbackNs: 80, realTimeDecoding: false, supportsPlatforms: ["silicon-spin", "transmon"], supportsTopology: ["2d-nn"], maxQubits: 32, scalabilityCeiling: 10000, notes: "Cryo-CMOS in the 4 K stage — the credible path past ~1000 qubits." },
  { id: "gooseberry", name: "Gooseberry cryo-ASIC", vendor: "Microsoft", category: "cryogenic-controller", operatingTempK: 0.1, latencyFeedbackNs: 50, realTimeDecoding: true, supportsPlatforms: ["silicon-spin", "topological"], supportsTopology: ["2d-nn"], maxQubits: 64, scalabilityCeiling: 1000000, notes: "Sub-K ASIC; on-die decoder logic makes million-qubit surface code thinkable." },
  { id: "twpa", name: "TWPA (kinetic-inductance)", vendor: "Princeton/IBM/Caltech", category: "parametric-amplifier", operatingTempK: 0.02, realTimeDecoding: false, supportsPlatforms: ["transmon", "fluxonium"], supportsTopology: ["2d-nn", "heavy-hex"], maxQubits: 8, scalabilityCeiling: 100, notes: "Near-quantum-limited multi-GHz readout amp; enables fast multiplexed readout." },
  { id: "hemt", name: "LNC4_8C HEMT", vendor: "Low Noise Factory", category: "hemt-amplifier", operatingTempK: 4, realTimeDecoding: false, supportsPlatforms: ["transmon", "fluxonium", "silicon-spin"], supportsTopology: ["2d-nn", "heavy-hex"], maxQubits: 1, scalabilityCeiling: 1000, notes: "4 K second-stage amp downstream of a TWPA; ~3 K noise temperature." },
  { id: "bluefors-ld400", name: "LD400 / KIDE", vendor: "Bluefors", category: "dilution-refrigerator", operatingTempK: 0.01, realTimeDecoding: false, supportsPlatforms: ["transmon", "fluxonium", "silicon-spin", "cat-qubit", "topological"], supportsTopology: ["2d-nn", "heavy-hex", "3-colorable"], maxQubits: 0, scalabilityCeiling: 5000, notes: "The cryostat. Wiring density per fridge is the underrated scaling bottleneck." },
  { id: "oxford-mx90", name: "ProteoxMX (MX90)", vendor: "Oxford Instruments", category: "dilution-refrigerator", operatingTempK: 0.007, realTimeDecoding: false, supportsPlatforms: ["transmon", "fluxonium", "silicon-spin", "cat-qubit"], supportsTopology: ["2d-nn", "heavy-hex"], maxQubits: 0, scalabilityCeiling: 4000, notes: "Cryogen-free dilution refrigerator, ~7 mK base; modular side-loading for fast turnaround." },
  { id: "ion-trap-rack", name: "Ion-trap control rack", vendor: "Sandia/Quantinuum-class", category: "ion-trap-controller", operatingTempK: 300, latencyFeedbackNs: 500, realTimeDecoding: true, supportsPlatforms: ["trapped-ion"], supportsTopology: ["all-to-all", "3-colorable"], maxQubits: 64, scalabilityCeiling: 500, notes: "Drives lasers, RF traps, shuttling; all-to-all is the unique unlock vs solid-state." },
];

const CONTROL_CATEGORIES: ControlCategory[] = [
  "room-temp-controller", "cryogenic-controller", "ion-trap-controller", "photonic-controller",
];

export const CONTROL_OPTIONS = CONTROL_HARDWARE.filter((h) => CONTROL_CATEGORIES.includes(h.category));
// Step 3 cryostats come from cryostat_catalog.py (Tier-1 dilution refrigerators).
export const CRYO_OPTIONS = CRYOSTATS;

export interface CodesignTarget {
  id: string;
  name: string;
  logicalErrorTarget: number;
  logicalQubits: number;
  logicalOps: number;
  notes: string;
}

export const TARGETS: CodesignTarget[] = [
  { id: "nisq", name: "NISQ variational (no QEC)", logicalErrorTarget: 1e-3, logicalQubits: 50, logicalOps: 1e5, notes: "Pre-fault-tolerant. Raw physical qubits suffice for approximate optimization / VQE / QML pilots." },
  { id: "memory-demo", name: "Single-logical-qubit memory demo", logicalErrorTarget: 1e-5, logicalQubits: 1, logicalOps: 1e6, notes: "The Willow/IBM demonstration: keep one logical qubit alive to show exponential suppression." },
  { id: "chemistry", name: "Materials chemistry (catalyst design)", logicalErrorTarget: 1e-6, logicalQubits: 100, logicalOps: 1e9, notes: "Phase-estimation chemistry for catalyst/battery/drug design. Sub-µHa accuracy." },
  { id: "ft-sim", name: "Fault-tolerant simulation at scale", logicalErrorTarget: 1e-8, logicalQubits: 1000, logicalOps: 1e11, notes: "Condensed-matter dynamics, protein folding, plasma physics." },
  { id: "rsa-2048", name: "Cryptanalysis (RSA-2048)", logicalErrorTarget: 1e-15, logicalQubits: 4096, logicalOps: 1e12, notes: "Shor's algorithm. The classic driver; physical-qubit ask is enormous." },
];

// Full superconducting qubit-type taxonomy (the Step-1 tree). Families group
// types by Josephson regime + an encoded/bosonic branch. Some types (Cooper
// Pair Box, Gatemon, RF-SQUID, Flux Qubit, Phase Qubit, Quantronium) have no
// device in the catalogue yet — selecting them yields an honest "no devices"
// result rather than hiding the type.
export interface QubitTypeNode {
  id: string;
  label: string;
  family: string;
  parentId?: string;
  /** Device qubitType this node maps to (undefined = no catalogue devices). */
  deviceType?: SCQubitType;
}

export interface QubitFamilyGroup {
  id: string;
  label: string;
  regime: string;
  accent: "violet" | "green" | "amber" | "cyan";
  types: QubitTypeNode[];
}

export const QUBIT_TYPE_FAMILIES: QubitFamilyGroup[] = [
  {
    id: "charge", label: "Charge Qubits", regime: "EJ ≪ EC", accent: "violet",
    types: [
      { id: "cooper-pair-box", label: "Cooper Pair Box (CPB)", family: "charge" },
      { id: "transmon", label: "Transmon", family: "charge", deviceType: "transmon" },
      { id: "xmon", label: "Xmon", family: "charge", parentId: "transmon", deviceType: "Xmon" },
      { id: "gatemon", label: "Gatemon", family: "charge", parentId: "transmon" },
    ],
  },
  {
    id: "flux", label: "Flux Qubits", regime: "EJ ≫ EC", accent: "green",
    types: [
      { id: "rf-squid", label: "RF-SQUID", family: "flux" },
      { id: "flux-qubit", label: "Flux Qubit", family: "flux" },
      { id: "fluxonium", label: "Fluxonium", family: "flux", deviceType: "fluxonium" },
    ],
  },
  {
    id: "phase", label: "Phase Qubits", regime: "Large JJ, current-biased", accent: "amber",
    types: [
      { id: "phase-qubit", label: "Phase Qubit", family: "phase" },
      { id: "quantronium", label: "Quantronium", family: "phase" },
    ],
  },
];

export const ALL_QUBIT_NODES: QubitTypeNode[] = QUBIT_TYPE_FAMILIES.flatMap((f) => f.types);

export const qubitNodeById = (id: string): QubitTypeNode =>
  ALL_QUBIT_NODES.find((n) => n.id === id) ?? ALL_QUBIT_NODES[0];

export const devicesForNode = (node: QubitTypeNode): SCDevice[] =>
  node.deviceType ? SC_DEVICES.filter((d) => d.qubitType === node.deviceType) : [];

// ---------------------------------------------------------------- engine

const P_TH = 0.01; // ~1% surface-code threshold
const A = 0.1;     // logical-error prefactor

// Map a qubit type to the control "platform" names used in supportsPlatforms.
function platformsFor(t: SCQubitType): string[] {
  switch (t) {
    case "transmon":
    case "Xmon":
    case "GKP":
      return ["transmon"];
    case "fluxonium":
      return ["fluxonium"];
    case "cat":
      return ["cat-qubit", "transmon"];
  }
}

export function recommendCode(d: Pick<SCDevice, "pGate2q" | "biasEta">): string {
  if (d.pGate2q > 0.015) return "NONE — above 2D-code threshold";
  if (d.biasEta >= 5) return "XZZX surface code";
  if (d.biasEta < 3 && d.pGate2q < 0.003) return "Color code";
  return "Surface code (rotated)";
}

function nextOddAtLeast3(x: number): number {
  let d = Math.max(3, Math.ceil(x));
  if (d % 2 === 0) d += 1;
  return d;
}

export function requiredDistance(pPhys: number, pL: number): number | null {
  if (pPhys >= P_TH || pPhys <= 0) return null;
  if (pL >= A) return 3;
  const d = (2 * Math.log(pL / A)) / Math.log(pPhys / P_TH) - 1;
  return Math.max(3, d);
}

export function physicalPerLogical(d: number): number {
  const di = nextOddAtLeast3(d);
  return 2 * di * di - 1;
}

export interface Feasibility {
  feasible: boolean;
  reason: string;
  code: string;
  distance: number | null;
  perLogical: number | null;
  totalPhysical: number | null;
}

export function feasibility(device: SCDevice, target: CodesignTarget): Feasibility {
  const code = recommendCode(device);
  if (code.startsWith("NONE")) {
    return { feasible: false, reason: "above 2D-code threshold (p₂q too high)", code, distance: null, perLogical: null, totalPhysical: null };
  }
  let d = requiredDistance(device.pGate2q, target.logicalErrorTarget);
  if (d === null) {
    return { feasible: false, reason: "physical error above threshold for any 2D code", code, distance: null, perLogical: null, totalPhysical: null };
  }
  // Bias-noise codes: effective distance ~ d / sqrt(eta).
  if (code.includes("XZZX") || code.includes("Color")) {
    const eta = Math.max(1, device.biasEta);
    d = Math.max(3, d / Math.sqrt(eta));
  }
  const perLogical = physicalPerLogical(d);
  const totalPhysical = perLogical * target.logicalQubits;
  return { feasible: true, reason: "", code, distance: d, perLogical, totalPhysical };
}

export const needsQEC = (t: CodesignTarget): boolean => t.logicalErrorTarget < 1e-3;

export function hardwareSupports(hw: ControlHardware, qubitType: SCQubitType): boolean {
  const plats = platformsFor(qubitType);
  return hw.supportsPlatforms.some((p) => plats.includes(p));
}

export interface MaterialRanking {
  device: SCDevice;
  feasibility: Feasibility;
  possible: boolean;
  blockers: string[];
  rank: number | null;
}

export interface SelectionResult {
  controlOk: boolean;
  cryoOk: boolean;
  controlDecodingOk: boolean;
  /** Top-level blockers that disqualify ALL materials (control/cryo gating). */
  globalBlockers: string[];
  rankings: MaterialRanking[];
  best: MaterialRanking | null;
  anyPossible: boolean;
  noMatchReason: string;
}

export function evaluateSelection(
  node: QubitTypeNode,
  control: ControlHardware,
  cryo: ControlHardware,
  target: CodesignTarget,
): SelectionResult {
  const devices = devicesForNode(node);

  // Qubit type exists in the taxonomy but has no catalogue device yet.
  if (devices.length === 0) {
    return {
      controlOk: true, cryoOk: true, controlDecodingOk: true,
      globalBlockers: [], rankings: [], best: null, anyPossible: false,
      noMatchReason: `No catalogue devices of type "${node.label}" yet — add one to superconducting_qubit.py to evaluate it.`,
    };
  }

  const dt = node.deviceType!; // present whenever devices is non-empty
  const controlOk = hardwareSupports(control, dt);
  const cryoOk = hardwareSupports(cryo, dt);
  const qec = needsQEC(target);
  const controlDecodingOk = !qec || control.realTimeDecoding;

  const globalBlockers: string[] = [];
  if (!controlOk) globalBlockers.push(`${control.vendor} ${control.name} does not drive ${node.label} qubits`);
  if (!cryoOk) globalBlockers.push(`${cryo.vendor} ${cryo.name} is not rated for ${node.label} qubits`);
  if (!controlDecodingOk) globalBlockers.push(`${control.name} has no real-time decoder, required for QEC at p_L=${target.logicalErrorTarget.toExponential(0)}`);

  const rows: MaterialRanking[] = devices.map((device) => {
    const f = feasibility(device, target);
    const blockers = [...globalBlockers];
    if (!f.feasible) blockers.push(f.reason);
    const possible = blockers.length === 0;
    return { device, feasibility: f, possible, blockers, rank: null };
  });

  // Rank possible materials by smallest total physical-qubit footprint.
  const possibles = rows
    .filter((r) => r.possible)
    .sort((a, b) => (a.feasibility.totalPhysical! - b.feasibility.totalPhysical!));
  possibles.forEach((r, i) => (r.rank = i + 1));

  const best = possibles[0] ?? null;
  const anyPossible = possibles.length > 0;

  let noMatchReason = "";
  if (!anyPossible) {
    if (globalBlockers.length) noMatchReason = globalBlockers.join("; ") + ".";
    else noMatchReason = `No ${node.label} device can reach ${target.name} (p_L=${target.logicalErrorTarget.toExponential(0)}) — all are above the required distance/threshold.`;
  }

  return {
    controlOk, cryoOk, controlDecodingOk, globalBlockers,
    rankings: rows, best, anyPossible, noMatchReason,
  };
}

// ===========================================================================
// FULL WORKFLOW — Input -> Hardware Constraints -> Material Library ->
// QEC Matching Engine -> Output. (Deterministic analytic models; the
// PanQEC + Stim simulation is the backend upgrade path — see qec_pipeline.)
// ===========================================================================

// Per-control gate-time floor (ns): faster electronics -> shorter pulses.
const GATE_TIME_FLOOR_NS: Record<string, number> = {
  opx1000: 40, shfqc: 25, "qblox-cluster": 40, "keysight-m9415": 8,
  "horse-ridge-2": 30, gooseberry: 35, "ion-trap-rack": 30_000,
};

export interface HardwareConstraints {
  gateTimeFloorNs: number;
  measurementLatencyNs: number;
  thermalFloorK: number;
  /** Multiplicative penalty on physical error from a too-warm cold stage. */
  thermalPenalty: number;
  /** Effective QEC syndrome-cycle time (ns). */
  cycleTimeNs: number;
  realTimeDecoding: boolean;
  /** Multiplexed qubit capacity of the selected cryostat. */
  fridgeMaxQubits: number;
}

export function deriveConstraints(control: ControlHardware, cryo: Cryostat): HardwareConstraints {
  const gateTimeFloorNs = GATE_TIME_FLOOR_NS[control.id] ?? 50;
  const measurementLatencyNs = control.latencyFeedbackNs ?? 1000;
  const thermalFloorK = cryo.operatingTempMK / 1000;
  // mK base stage is fine; warmer stages add thermal photons -> error penalty.
  const thermalPenalty = Math.max(0, (thermalFloorK - 0.02) * 2.5);
  // A syndrome cycle ≈ a few 2Q gates + readout latency.
  const cycleTimeNs = gateTimeFloorNs * 8 + measurementLatencyNs;
  return {
    gateTimeFloorNs, measurementLatencyNs, thermalFloorK, thermalPenalty,
    cycleTimeNs, realTimeDecoding: control.realTimeDecoding,
    fridgeMaxQubits: cryo.maxQubits,
  };
}

export interface QECCode {
  id: string;
  name: string;
  threshold: number;       // physical-error threshold
  biasTailored: boolean;   // benefits from noise bias (effective d/sqrt(eta))
  /** physical qubits per logical at distance d. */
  perLogical: (d: number) => number;
}

export const CODES: QECCode[] = [
  { id: "surface", name: "Surface code", threshold: 0.01, biasTailored: false, perLogical: (d) => 2 * d * d - 1 },
  { id: "xzzx", name: "XZZX surface", threshold: 0.01, biasTailored: true, perLogical: (d) => 2 * d * d - 1 },
  { id: "bacon-shor", name: "Bacon-Shor", threshold: 0.006, biasTailored: true, perLogical: (d) => Math.round(1.5 * d * d) },
  { id: "color", name: "Color code", threshold: 0.005, biasTailored: false, perLogical: (d) => Math.round(2.4 * d * d) },
  { id: "repetition", name: "Repetition", threshold: 0.03, biasTailored: true, perLogical: (d) => 2 * d - 1 },
];

export function effectiveP2q(m: { pGate2q: number }, c: HardwareConstraints): number {
  return m.pGate2q * (1 + c.thermalPenalty);
}

/** Materials usable to build the selected qubit type. */
export const materialsForNode = (node: QubitTypeNode): QubitMaterial[] =>
  MATERIALS.filter((m) => m.families.includes(node.id));

/** Superconducting films / interconnects that form the qubit metal stack. */
export const isConductiveFilm = (m: QubitMaterial): boolean =>
  /electrode|superinductor|interconnect/.test(m.role);

/** Map a qubit-type node to the control "platform" name for compatibility. */
export function platformForNode(node: QubitTypeNode): string {
  if (node.family === "flux") return "fluxonium";
  return "transmon"; // charge + phase families are driven as transmon-class
}

export const hardwareSupportsPlatform = (hw: ControlHardware, platform: string): boolean =>
  hw.supportsPlatforms.includes(platform);

const clamp100 = (v: number) => Math.max(0, Math.min(100, v));
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

// MP-property-driven material relevance (0-100). Hackathon-friendly: lean on
// whatever Materials Project gives us (metal/insulator role fit, stability,
// magnetism, experimental vs theoretical) rather than rigid noise thresholds.
export function mpRelevance(m: QubitMaterial): number {
  const wantsMetal = /electrode|superinductor|interconnect/.test(m.role);
  const wantsDielectric = /substrate|dielectric|barrier|oxide/.test(m.role);
  let roleFit = 60;
  if (m.isMetal !== null) {
    if (wantsMetal) roleFit = m.isMetal ? 100 : 30;
    else if (wantsDielectric) roleFit = m.isMetal ? 35 : 100;
  }
  const stability = clamp100(100 - (m.eAboveHull ?? 0.1) * 250); // synthesizability
  const magnetic = (m.ordering && m.ordering !== "NM") || Math.abs(m.totalMagnetization ?? 0) > 0.1;
  const magOk = magnetic ? 10 : 100; // magnetism is a qubit killer
  const cryst = clamp100((m.theoretical === false ? 70 : 50) + (m.crystalSystem && m.crystalSystem !== "Triclinic" ? 20 : 0));
  return Math.round(clamp100(0.35 * roleFit + 0.3 * stability + 0.25 * magOk + 0.1 * cryst) * 10) / 10;
}

export interface PairResult {
  material: QubitMaterial;
  code: QECCode;
  relevance: number;
  fitScore: number;
  feasible: boolean;
  distance: number | null;
  perLogical: number | null;
  totalPhysical: number | null;
  wallClockS: number | null;
  effectiveP2q: number;
  withinBudget: boolean;
  reason: string;
}

function pairResult(
  material: QubitMaterial, code: QECCode, target: CodesignTarget,
  c: HardwareConstraints, maxPhysical: number,
): PairResult {
  const p = effectiveP2q(material, c);
  const mpRel = mpRelevance(material);
  const rel = (feasibleTier: number) => Math.round((0.6 * mpRel + 0.4 * feasibleTier) * 10) / 10;
  const base = { material, code, effectiveP2q: p };

  const speed = clamp01(1 - (c.cycleTimeNs - 200) / 2000);
  const decodeMul = needsQEC(target) && !c.realTimeDecoding ? 0.6 : 1;

  if (p >= code.threshold) {
    return { ...base, relevance: rel(30), fitScore: 0, feasible: false, distance: null, perLogical: null, totalPhysical: null, wallClockS: null, withinBudget: false, reason: `p₂q ${(p * 100).toFixed(2)}% ≥ ${code.name} threshold ${(code.threshold * 100).toFixed(1)}%` };
  }
  let d = requiredDistance(p, target.logicalErrorTarget);
  if (d === null) {
    return { ...base, relevance: rel(30), fitScore: 0, feasible: false, distance: null, perLogical: null, totalPhysical: null, wallClockS: null, withinBudget: false, reason: "above threshold for this code" };
  }
  if (code.biasTailored) {
    const eta = Math.max(1, material.biasEta);
    d = Math.max(3, d / Math.sqrt(eta));
  }
  const di = nextOddAtLeast3(d);
  const perLogical = code.perLogical(di);
  const totalPhysical = perLogical * target.logicalQubits;
  const wallClockS = c.cycleTimeNs * 1e-9 * di * target.logicalOps;
  const withinBudget = totalPhysical <= maxPhysical;

  // Input-dominated fit (0-100): target error rate, budget, hardware; MP is a tiebreaker.
  const targetFit = clamp01(1 - (di - 3) / 40);
  const budgetScore = withinBudget
    ? clamp01(1 - totalPhysical / maxPhysical)
    : clamp01(maxPhysical / totalPhysical) * 0.35;
  const fridgeHeadroom = clamp01(1 - totalPhysical / c.fridgeMaxQubits);
  const hwScore = clamp01(0.5 * speed + 0.3 * fridgeHeadroom + 0.2 * (needsQEC(target) && c.realTimeDecoding ? 1 : 0.7));
  const mpTie = mpRel / 100;
  const fitScore = Math.round(
    clamp01(0.45 * targetFit + 0.30 * budgetScore + 0.15 * hwScore + 0.10 * mpTie) * decodeMul * 100,
  );

  return {
    ...base, relevance: rel(withinBudget ? 100 : 65), fitScore, feasible: true, distance: d,
    perLogical, totalPhysical, wallClockS, withinBudget, reason: "",
  };
}

export interface NewMaterialSpec {
  maxTwoQubitError: number; // %
  minT1Us: number;
  minT2Us: number;
  minBiasEta: number;
  code: string;
  distance: number;
  perLogical: number;
}

// If nothing existing fits the qubit budget, derive the material a new device
// would need to hit the target within maxPhysical qubits, using the best code.
function newMaterialSpec(target: CodesignTarget, maxPhysical: number): NewMaterialSpec | null {
  const perLogicalBudget = maxPhysical / target.logicalQubits;
  if (perLogicalBudget < 17) return null; // can't even fit a d=3 patch
  const dMax = nextOddAtLeast3(Math.floor(Math.sqrt((perLogicalBudget + 1) / 2)) - 1) || 3;
  const d = Math.max(3, dMax);
  // Invert pL = A (p/pth)^((d+1)/2) for p.
  const P_TH = 0.01, A = 0.1;
  const reqP = P_TH * Math.pow(target.logicalErrorTarget / A, 2 / (d + 1));
  const stringency = Math.max(0, -Math.log10(target.logicalErrorTarget));
  return {
    maxTwoQubitError: Math.max(0.0001, reqP) * 100,
    minT1Us: Math.round(100 * Math.pow(2, stringency - 3)),
    minT2Us: Math.round(70 * Math.pow(2, stringency - 3)),
    minBiasEta: target.logicalErrorTarget < 1e-9 ? 10 : 1,
    code: "Surface / XZZX",
    distance: d,
    perLogical: 2 * d * d - 1,
  };
}

export type OutputMode = "existing" | "existing-over-budget" | "new-material" | "infeasible";

export interface WorkflowOutput {
  mode: OutputMode;
  best: PairResult | null;
  newSpec: NewMaterialSpec | null;
  confidence: "high" | "medium" | "low";
  confidencePct: number;
  caveats: string[];
  headline: string;
}

// Numeric confidence (0-100) derived from MP relevance + feasibility + compat;
// the high/medium/low label is read off the same number for consistency.
function confidenceFrom(
  best: PairResult | null, mode: OutputMode, compatIssue: boolean, modern: boolean,
): { pct: number; label: "high" | "medium" | "low" } {
  let pct: number;
  if (mode === "existing") pct = best?.relevance ?? 60;
  else if (mode === "existing-over-budget") pct = (best?.relevance ?? 50) * 0.6;
  else if (mode === "new-material") pct = 35;
  else pct = (best?.relevance ?? 40) * 0.45;
  if (compatIssue) pct *= 0.8;
  if (modern && mode === "existing") pct = Math.min(96, pct + 8);
  pct = Math.round(clamp100(Math.max(8, pct)));
  const label = pct >= 75 ? "high" : pct >= 50 ? "medium" : "low";
  return { pct, label };
}

export interface WorkflowResult {
  constraints: HardwareConstraints;
  controlOk: boolean;
  cryoOk: boolean;
  pairs: PairResult[];          // all (material, code) pairs, ranked
  materials: QubitMaterial[];
  output: WorkflowOutput;
}

export function runWorkflow(
  node: QubitTypeNode,
  control: ControlHardware,
  cryo: Cryostat,
  target: CodesignTarget,
  maxPhysical: number,
): WorkflowResult {
  const constraints = deriveConstraints(control, cryo);
  const materials = materialsForNode(node);
  const platform = platformForNode(node);
  const controlOk = hardwareSupportsPlatform(control, platform);
  // Every Tier-1 dilution refrigerator hosts superconducting chips; compatibility
  // is a matter of base temperature / cabling, surfaced as caveats below.
  const cryoOk = true;
  const qec = needsQEC(target);
  const decodeOk = !qec || control.realTimeDecoding;

  // QEC matching engine: every (material, code) pair.
  const pairs: PairResult[] = [];
  for (const material of materials) {
    for (const code of CODES) pairs.push(pairResult(material, code, target, constraints, maxPhysical));
  }
  pairs.sort((a, b) => {
    const film = (r: PairResult) => isConductiveFilm(r.material) ? 0 : 1;
    if (film(a) !== film(b)) return film(a) - film(b);
    const tier = (r: PairResult) => (r.feasible && r.withinBudget ? 0 : r.feasible ? 1 : 2);
    if (tier(a) !== tier(b)) return tier(a) - tier(b);
    if (b.fitScore !== a.fitScore) return b.fitScore - a.fitScore;
    return (a.totalPhysical ?? Infinity) - (b.totalPhysical ?? Infinity);
  });

  const caveats: string[] = [];
  if (!controlOk) caveats.push(`${control.name} does not list support for ${node.label} (${platform}) qubits`);
  if (maxPhysical > cryo.maxQubits) caveats.push(`${cryo.name} caps at ~${cryo.maxQubits} qubits (multiplexed readout); the ${maxPhysical}-qubit budget needs a larger fridge or chiplet tiling`);
  if (cryo.baseTempMK > 12 && node.family === "flux") caveats.push(`${cryo.name} base temp (${cryo.baseTempMK} mK) is warm for low-frequency flux qubits — expect higher thermal population`);
  if (!decodeOk) caveats.push(`${control.name} has no real-time decoder, required for QEC`);
  if (constraints.thermalPenalty > 0.1) caveats.push(`Cold stage at ${(constraints.thermalFloorK * 1000).toFixed(0)} mK adds a ${(constraints.thermalPenalty * 100).toFixed(0)}% thermal error penalty`);
  caveats.push("Quantum material properties (T1/T2, bias \u03b7, gate fidelity) come from material_properties.py; cryostat specs from cryostat_catalog.py; Materials Project supplies the crystallography. Logical-error numbers are analytic surface-code estimates (PanQEC + Stim is the backend upgrade).");

  const compatIssue = !controlOk || !cryoOk || !decodeOk;
  const feasibleWithinFilm = pairs.find((p) => p.feasible && p.withinBudget && isConductiveFilm(p.material)) ?? null;
  const feasibleWithin = feasibleWithinFilm ?? pairs.find((p) => p.feasible && p.withinBudget) ?? null;
  const feasibleAnyFilm = pairs.find((p) => p.feasible && isConductiveFilm(p.material)) ?? null;
  const feasibleAny = feasibleAnyFilm ?? pairs.find((p) => p.feasible) ?? null;
  const topByRelevance = pairs.find((p) => isConductiveFilm(p.material)) ?? pairs[0] ?? null;

  let mode: OutputMode;
  let best: PairResult | null;
  let newSpec: NewMaterialSpec | null = null;
  let headline: string;
  let extra: string[] = [];

  if (materials.length === 0) {
    mode = "new-material"; best = null; newSpec = newMaterialSpec(target, maxPhysical);
    extra = [`No catalogue material maps to "${node.label}" — showing the target spec a new material would need.`];
    headline = `No material is catalogued for ${node.label} — here is the spec to develop one.`;
  } else if (feasibleWithin) {
    mode = "existing"; best = feasibleWithin;
    headline = `${feasibleWithin.material.name} + ${feasibleWithin.code.name} fits ${target.name} within ${maxPhysical.toLocaleString()} qubits (fit ${feasibleWithin.fitScore}/100).`;
  } else if (feasibleAny) {
    mode = "existing-over-budget"; best = feasibleAny; newSpec = newMaterialSpec(target, maxPhysical);
    extra = [`Most relevant feasible material needs ${feasibleAny.totalPhysical?.toLocaleString()} qubits — over the ${maxPhysical.toLocaleString()} budget.`];
    headline = `${feasibleAny.material.name} + ${feasibleAny.code.name} is the most relevant fit but exceeds ${maxPhysical.toLocaleString()} qubits; a new-material spec is suggested.`;
  } else {
    mode = "infeasible"; best = topByRelevance; newSpec = newMaterialSpec(target, maxPhysical);
    extra = ["No code keeps these materials below threshold for this target; ranking is by Materials-Project relevance."];
    headline = `No catalogued material reaches ${target.name}. Most relevant by MP properties: ${topByRelevance?.material.name ?? "n/a"}; a new-material spec is suggested.`;
  }

  const modern = !!best && best.material.t1Us >= 80 && best.effectiveP2q < 0.008;
  const { pct, label } = confidenceFrom(best, mode, compatIssue, modern);
  const output: WorkflowOutput = {
    mode, best, newSpec, confidence: label, confidencePct: pct,
    caveats: [...extra, ...caveats], headline,
  };

  return { constraints, controlOk, cryoOk, pairs, materials, output };
}

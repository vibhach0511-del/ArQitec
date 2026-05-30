// Mock data for Q-Architect. All values are illustrative.

export type Material = {
  id: string;
  name: string;
  short: string;
  vendor: string;
  t1_us: number;
  t2_us: number;
  gate_1q_fidelity: number; // %
  gate_2q_fidelity: number; // %
  readout_error: number; // %
  crosstalk: number; // 0-1
  yield: number; // %
  cryo: number; // 0-1, 1 = most complex
  temp_mK: number;
  notes: string;
};

export const MATERIALS: Material[] = [
  {
    id: "transmon",
    name: "Superconducting Transmon",
    short: "SC-Transmon",
    vendor: "Nb / Al-Josephson · 15 mK",
    t1_us: 142,
    t2_us: 118,
    gate_1q_fidelity: 99.94,
    gate_2q_fidelity: 99.41,
    readout_error: 0.84,
    crosstalk: 0.32,
    yield: 71,
    cryo: 0.78,
    temp_mK: 15,
    notes: "Mature fab, strong 2Q gates, planar Josephson stack. Heavy-hex friendly.",
  },
  {
    id: "si-spin",
    name: "Silicon Spin Qubit",
    short: "Si-Spin",
    vendor: "28Si / SiGe · 100 mK",
    t1_us: 1100,
    t2_us: 410,
    gate_1q_fidelity: 99.87,
    gate_2q_fidelity: 99.12,
    readout_error: 1.6,
    crosstalk: 0.18,
    yield: 58,
    cryo: 0.42,
    temp_mK: 100,
    notes: "CMOS-compatible. Dense pitch. 2Q gates remain the bottleneck.",
  },
  {
    id: "photonic",
    name: "Photonic Qubit",
    short: "Photonic",
    vendor: "SiN / LiNbO₃ · 300 K",
    t1_us: 9999,
    t2_us: 9999,
    gate_1q_fidelity: 99.6,
    gate_2q_fidelity: 96.8,
    readout_error: 2.4,
    crosstalk: 0.08,
    yield: 64,
    cryo: 0.05,
    temp_mK: 300_000,
    notes: "Room-temperature operation. Probabilistic 2Q gates demand multiplexing.",
  },
  {
    id: "neutral-atom",
    name: "Neutral Atom Array",
    short: "Rydberg",
    vendor: "⁸⁷Rb / Optical tweezers · µK",
    t1_us: 4200,
    t2_us: 2800,
    gate_1q_fidelity: 99.78,
    gate_2q_fidelity: 99.05,
    readout_error: 1.1,
    crosstalk: 0.22,
    yield: 49,
    cryo: 0.12,
    temp_mK: 0.001,
    notes: "Reconfigurable connectivity via atom shuttling. Long coherence, optical bottlenecks.",
  },
];

export type Topology = {
  id: string;
  name: string;
  connectivity: number; // 0-100
  swap_overhead: number; // 0-100 (lower better)
  crosstalk: number; // 0-100 (lower better)
  qec_compat: number; // 0-100
  manufacturability: number; // 0-100
  degree: number;
  description: string;
};

export const TOPOLOGIES: Topology[] = [
  {
    id: "square",
    name: "Square Grid",
    connectivity: 58,
    swap_overhead: 72,
    crosstalk: 64,
    qec_compat: 86,
    manufacturability: 91,
    degree: 4,
    description: "Regular 2D nearest-neighbor lattice. Canonical surface-code substrate.",
  },
  {
    id: "heavy-hex",
    name: "Heavy-Hex",
    connectivity: 49,
    swap_overhead: 68,
    crosstalk: 42,
    qec_compat: 88,
    manufacturability: 84,
    degree: 3,
    description: "Degree-3 hex with flag qubits. Reduced frequency collisions, IBM-style.",
  },
  {
    id: "modular",
    name: "Modular Cluster",
    connectivity: 71,
    swap_overhead: 54,
    crosstalk: 38,
    qec_compat: 74,
    manufacturability: 69,
    degree: 5,
    description: "Tiled clusters joined by long-range couplers. Localized dense traffic.",
  },
  {
    id: "ai-opt",
    name: "Q-Architect AI Topology",
    connectivity: 82,
    swap_overhead: 31,
    crosstalk: 29,
    qec_compat: 91,
    manufacturability: 78,
    degree: 4.3,
    description: "Genetic search + RL refinement. Heavy-hex backbone with selective shortcuts.",
  },
];

export type Workload = {
  id: string;
  name: string;
  baseline: { swap: number; depth: number; fidelity: number; logErr: number; congestion: number };
  optimized: { swap: number; depth: number; fidelity: number; logErr: number; congestion: number };
};

export const WORKLOADS: Workload[] = [
  {
    id: "qaoa",
    name: "QAOA · MaxCut-64",
    baseline: { swap: 1842, depth: 312, fidelity: 71.4, logErr: 0.082, congestion: 0.74 },
    optimized: { swap: 1318, depth: 248, fidelity: 80.1, logErr: 0.061, congestion: 0.52 },
  },
  {
    id: "vqe",
    name: "VQE · H₂O / 6-31G",
    baseline: { swap: 2604, depth: 488, fidelity: 64.8, logErr: 0.121, congestion: 0.81 },
    optimized: { swap: 1872, depth: 391, fidelity: 73.6, logErr: 0.088, congestion: 0.58 },
  },
  {
    id: "qft",
    name: "Quantum Fourier Transform · 32q",
    baseline: { swap: 980, depth: 214, fidelity: 78.2, logErr: 0.045, congestion: 0.62 },
    optimized: { swap: 702, depth: 168, fidelity: 85.4, logErr: 0.031, congestion: 0.41 },
  },
  {
    id: "random",
    name: "Random Circuit · 20 layers",
    baseline: { swap: 3120, depth: 612, fidelity: 41.9, logErr: 0.184, congestion: 0.89 },
    optimized: { swap: 2244, depth: 482, fidelity: 52.8, logErr: 0.142, congestion: 0.66 },
  },
  {
    id: "qec",
    name: "Surface-Code Syndrome",
    baseline: { swap: 540, depth: 96, fidelity: 92.4, logErr: 0.0021, congestion: 0.48 },
    optimized: { swap: 388, depth: 78, fidelity: 95.1, logErr: 0.0013, congestion: 0.33 },
  },
];

export type QECCode = {
  id: string;
  name: string;
  distance: number;
  physicalPerLogical: number;
  logicalError: number;
  syndromeOverhead: number; // %
  compatibility: number; // 0-100
  family: string;
  recommended?: boolean;
};

export const QEC_CODES: QECCode[] = [
  { id: "surface", name: "Surface Code", distance: 7, physicalPerLogical: 98, logicalError: 1.4e-7, syndromeOverhead: 38, compatibility: 92, family: "Topological CSS" },
  { id: "heavy-hex", name: "Heavy-Hex Code", distance: 5, physicalPerLogical: 74, logicalError: 6.2e-6, syndromeOverhead: 31, compatibility: 96, family: "Subsystem", recommended: true },
  { id: "color", name: "Color Code", distance: 5, physicalPerLogical: 91, logicalError: 8.4e-6, syndromeOverhead: 44, compatibility: 71, family: "Topological CSS" },
  { id: "repetition", name: "Repetition Code", distance: 9, physicalPerLogical: 9, logicalError: 2.1e-3, syndromeOverhead: 12, compatibility: 100, family: "Classical analogue" },
];

export type HeadlineDelta = { label: string; value: string; direction: "down" | "up"; tone: "good" | "warn" | "neutral" };

export const HEADLINE_DELTAS: HeadlineDelta[] = [
  { label: "SWAP gates", value: "−28%", direction: "down", tone: "good" },
  { label: "Crosstalk risk", value: "−19%", direction: "down", tone: "good" },
  { label: "Workload fidelity", value: "+12%", direction: "up", tone: "good" },
  { label: "Manufacturability score", value: "+22%", direction: "up", tone: "good" },
];

export const CONVERGENCE: { iter: number; cost: number; manufacturability: number }[] = Array.from({ length: 32 }, (_, i) => ({
  iter: i + 1,
  cost: Math.round((100 - 62 * (1 - Math.exp(-i / 8)) + (Math.sin(i / 2) * 1.6)) * 10) / 10,
  manufacturability: Math.round((52 + 24 * (1 - Math.exp(-i / 10)) + (Math.cos(i / 3) * 1.2)) * 10) / 10,
}));

export type AgentTurn = {
  role: "agent" | "user";
  step?: string;
  text: string;
  evidence?: string[];
};

export const AGENT_TRANSCRIPT: AgentTurn[] = [
  { role: "user", text: "Optimize for QAOA-64 under the superconducting transmon profile, prioritize tapeout-readiness." },
  {
    role: "agent",
    step: "1 · Profile",
    text: "Loaded SC-Transmon process (T1 142µs, 2Q fidelity 99.41%). Constrained search to planar-routable topologies with ≤4 average degree.",
    evidence: ["Materials: SC-Transmon", "Constraint: deg ≤ 4", "Yield ≥ 65%"],
  },
  {
    role: "agent",
    step: "2 · Candidates",
    text: "Evaluated square grid, heavy-hex, modular cluster, and a learned hybrid across 6,400 mappings.",
    evidence: ["Search: 6,400 mappings", "Mapper: SABRE + RL refinement"],
  },
  {
    role: "agent",
    step: "3 · Decision",
    text: "Selected modular heavy-hex topology because it reduces long-range routing while maintaining QEC compatibility under the superconducting transmon profile.",
    evidence: ["SWAP −28%", "Crosstalk −19%", "QEC compat 91"],
  },
  {
    role: "agent",
    step: "4 · Codework",
    text: "Recommend heavy-hex subsystem code at distance 5. Surface code remains a strong fallback but increases physical-qubit footprint by 32%.",
    evidence: ["Heavy-hex d=5 → 74 phys/log", "Surface d=7 → 98 phys/log"],
  },
];

export type CongestionCell = { x: number; y: number; v: number };
export const CONGESTION_BASELINE: CongestionCell[] = (() => {
  const cells: CongestionCell[] = [];
  for (let y = 0; y < 8; y++) for (let x = 0; x < 12; x++) {
    const cx = 5.5, cy = 3.5;
    const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
    cells.push({ x, y, v: Math.max(0.05, Math.min(1, 0.95 - d * 0.11 + Math.sin(x * 0.7 + y) * 0.08)) });
  }
  return cells;
})();
export const CONGESTION_OPTIMIZED: CongestionCell[] = CONGESTION_BASELINE.map(c => ({ ...c, v: Math.max(0.03, c.v * 0.62 + Math.cos(c.x + c.y * 0.5) * 0.05) }));

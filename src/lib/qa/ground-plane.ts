// Ground Plane / Resonator layer suitability score.
//
// Scores how well a fabrication material works as the superconducting ground
// plane / resonator metal (the layer that sets resonator internal Q and the
// surface-limited T1 ceiling). The weighted criteria, ranges and reject/bonus
// gates are taken verbatim from the layer spec:
//
//   #  Property                          Units        Range                      Weight
//   1  Critical temperature Tc           K            1 (Al) .. 16 (NbN)          0.10
//   2  Native oxide loss tangent         tan δ        1e-6 (Ta2O5) .. 1e-3 (NbOx) 0.25
//   3  Film surface resistance Rs        Ω            1e-7 .. 1e-4                0.20
//   4  TLS density, metal-air            /µm²/GHz     1e2 .. 1e5                  0.15
//   5  TLS density, metal-substrate      /µm²/GHz     1e2 .. 1e5                  0.10
//   6  London penetration depth λ_L      nm           30 (Al) .. 200 (NbN)        0.05
//   7  Grain size / structure            string+nm    amorph .. single-xtal       0.05
//   8  Sheet kinetic inductance L_k      pH/sq        0.01 (Al) .. 10 (NbN)       0.05
//   9  Edge roughness after etch         nm RMS       0.5 .. 10                   0.05
//   10 Pinhole / void density            /µm²         0 .. large                  reject
//   11 Adhesion to substrate             bool                                     reject if no
//   12 Patterning compatibility          enum                                     reject if incompatible
//   13 Capping option available          bool                                     bonus
//   14 Resistivity at 300K               µΩ·cm        1 .. 100                    input (QC)
//   15 Film-limited T1 ceiling           µs           50 .. 1500                  output

export type Patterning = "both" | "dry" | "wet" | "poor" | "incompatible";

export interface GroundPlaneProps {
  tcK: number;                  // 1
  oxideTanDelta: number;        // 2  (lower better)
  surfaceResistanceOhm: number; // 3  (lower better)
  tlsTopPerUm2GHz: number;      // 4  (lower better)
  tlsSubPerUm2GHz: number;      // 5  (lower better)
  londonDepthNm: number;        // 6  (lower better → more standard mode geometry)
  grain: string;                // 7
  grainScore: number;           // 7  0..1 quality (single-xtal=1, amorphous low)
  sheetLkPHsq: number;          // 8  (lower better → standard resonator)
  edgeRoughnessNm: number;      // 9  (lower better)
  pinholePerUm2: number;        // 10 reject gate
  adhesion: boolean;            // 11 reject gate
  patterning: Patterning;       // 12 reject gate
  cappingAvailable: boolean;    // 13 bonus
  resistivity300K: number;      // 14 input
  t1CeilingUs: number;          // 15 output
  note: string;
}

export const GROUND_PLANE_WEIGHTS = {
  tc: 0.1, oxide: 0.25, rs: 0.2, tlsTop: 0.15, tlsSub: 0.1,
  london: 0.05, grain: 0.05, lk: 0.05, edge: 0.05,
} as const;

// Literature-plausible ground-plane / resonator properties for the
// superconducting films in the catalogue. Non-film materials (substrates,
// dielectrics, surface oxides, junction barriers) are not ground-plane metals
// and are reported as "not applicable" rather than scored.
export const GROUND_PLANE: Record<string, GroundPlaneProps> = {
  tantalum: {
    tcK: 4.4, oxideTanDelta: 3e-6, surfaceResistanceOhm: 1.5e-6,
    tlsTopPerUm2GHz: 8e2, tlsSubPerUm2GHz: 1e3, londonDepthNm: 90,
    grain: "epitaxial α-Ta", grainScore: 1.0, sheetLkPHsq: 0.1, edgeRoughnessNm: 1.0,
    pinholePerUm2: 0, adhesion: true, patterning: "both", cappingAvailable: true,
    resistivity300K: 13, t1CeilingUs: 500,
    note: "α-Ta + low-loss Ta₂O₅ native oxide — the current high-Q resonator champion (Place 2021, Wang 2022).",
  },
  niobium: {
    tcK: 9.3, oxideTanDelta: 1e-3, surfaceResistanceOhm: 5e-6,
    tlsTopPerUm2GHz: 1.5e4, tlsSubPerUm2GHz: 5e3, londonDepthNm: 39,
    grain: "polycrystalline ~100 nm", grainScore: 0.5, sheetLkPHsq: 0.085, edgeRoughnessNm: 2.0,
    pinholePerUm2: 0.05, adhesion: true, patterning: "both", cappingAvailable: false,
    resistivity300K: 15, t1CeilingUs: 150,
    note: "High Tc and easy to pattern, but the lossy Nb₂O₅/NbOx native oxide caps surface Q.",
  },
  aluminium: {
    tcK: 1.2, oxideTanDelta: 2e-4, surfaceResistanceOhm: 1e-6,
    tlsTopPerUm2GHz: 5e3, tlsSubPerUm2GHz: 3e3, londonDepthNm: 30,
    grain: "polycrystalline ~50 nm", grainScore: 0.5, sheetLkPHsq: 0.01, edgeRoughnessNm: 1.5,
    pinholePerUm2: 0.1, adhesion: true, patterning: "both", cappingAvailable: false,
    resistivity300K: 2.7, t1CeilingUs: 120,
    note: "Lowest λ_L / L_k (most standard geometry), but low Tc and a moderately lossy AlOx surface.",
  },
  tin: {
    tcK: 4.5, oxideTanDelta: 8e-6, surfaceResistanceOhm: 8e-7,
    tlsTopPerUm2GHz: 1e3, tlsSubPerUm2GHz: 2e3, londonDepthNm: 150,
    grain: "columnar ~20 nm", grainScore: 0.6, sheetLkPHsq: 1.5, edgeRoughnessNm: 0.8,
    pinholePerUm2: 0.02, adhesion: true, patterning: "dry", cappingAvailable: true,
    resistivity300K: 100, t1CeilingUs: 350,
    note: "Clean nitride surface (low loss, cappable) with high kinetic inductance — great resonator metal.",
  },
  nbn: {
    tcK: 16, oxideTanDelta: 1.5e-4, surfaceResistanceOhm: 1e-4,
    tlsTopPerUm2GHz: 1e4, tlsSubPerUm2GHz: 8e3, londonDepthNm: 200,
    grain: "columnar / amorphous", grainScore: 0.35, sheetLkPHsq: 10, edgeRoughnessNm: 2.0,
    pinholePerUm2: 0.05, adhesion: true, patterning: "dry", cappingAvailable: true,
    resistivity300K: 80, t1CeilingUs: 130,
    note: "Highest Tc and huge L_k (KI detectors / superinductors), but high Rs and TLS for qubit resonators.",
  },
  nbtin: {
    tcK: 15, oxideTanDelta: 6e-5, surfaceResistanceOhm: 5e-5,
    tlsTopPerUm2GHz: 5e3, tlsSubPerUm2GHz: 4e3, londonDepthNm: 180,
    grain: "columnar ~15 nm", grainScore: 0.45, sheetLkPHsq: 5, edgeRoughnessNm: 1.5,
    pinholePerUm2: 0.05, adhesion: true, patterning: "dry", cappingAvailable: true,
    resistivity300K: 70, t1CeilingUs: 200,
    note: "NbN's high Tc with a more stable nitride surface — a balanced high-L_k ground plane.",
  },
  "granular-al": {
    tcK: 2.0, oxideTanDelta: 1.5e-4, surfaceResistanceOhm: 3e-6,
    tlsTopPerUm2GHz: 8e3, tlsSubPerUm2GHz: 4e3, londonDepthNm: 170,
    grain: "granular / amorphous ~3 nm", grainScore: 0.3, sheetLkPHsq: 9.5, edgeRoughnessNm: 2.5,
    pinholePerUm2: 0.2, adhesion: true, patterning: "both", cappingAvailable: false,
    resistivity300K: 90, t1CeilingUs: 90,
    note: "A superinductor film (very high L_k) more than a low-loss ground plane.",
  },
  indium: {
    tcK: 3.4, oxideTanDelta: 5e-4, surfaceResistanceOhm: 1e-5,
    tlsTopPerUm2GHz: 2e4, tlsSubPerUm2GHz: 1e4, londonDepthNm: 64,
    grain: "soft polycrystalline", grainScore: 0.3, sheetLkPHsq: 0.05, edgeRoughnessNm: 8,
    pinholePerUm2: 0.5, adhesion: true, patterning: "poor", cappingAvailable: false,
    resistivity300K: 8, t1CeilingUs: 60,
    note: "Soft metal for bump-bonding, not a patternable resonator film — poor edge definition.",
  },
  "tin-metal": {
    tcK: 3.7, oxideTanDelta: 4e-4, surfaceResistanceOhm: 1e-5,
    tlsTopPerUm2GHz: 1.5e4, tlsSubPerUm2GHz: 8e3, londonDepthNm: 51,
    grain: "polycrystalline", grainScore: 0.35, sheetLkPHsq: 0.05, edgeRoughnessNm: 6,
    pinholePerUm2: 0.3, adhesion: true, patterning: "poor", cappingAvailable: false,
    resistivity300K: 11, t1CeilingUs: 70,
    note: "Historic elemental superconductor; lossy oxide and poor patternability for modern resonators.",
  },
};

const RANGE = {
  tc: [1, 16], oxide: [1e-6, 1e-3], rs: [1e-7, 1e-4],
  tls: [1e2, 1e5], london: [30, 200], lk: [0.01, 10], edge: [0.5, 10],
} as const;

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

// Linear sub-score in [lo,hi]; higherBetter flips the direction.
function lin(x: number, lo: number, hi: number, higherBetter: boolean): number {
  const t = clamp01((x - lo) / (hi - lo));
  return higherBetter ? t : 1 - t;
}
// Decade (log10) sub-score for quantities spanning orders of magnitude.
function log(x: number, lo: number, hi: number, higherBetter: boolean): number {
  const t = clamp01((Math.log10(x) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo)));
  return higherBetter ? t : 1 - t;
}

export interface GroundPlaneScore {
  applicable: boolean;
  score: number;                 // 0..100
  label: "high" | "medium" | "low" | "reject" | "n/a";
  t1CeilingUs: number | null;
  rejectedReason: string | null;
  contributions: { key: string; label: string; weight: number; sub: number }[];
  note: string;
}

const W = GROUND_PLANE_WEIGHTS;

export function groundPlaneScore(materialId: string): GroundPlaneScore {
  const g = GROUND_PLANE[materialId];
  if (!g) {
    return {
      applicable: false, score: 0, label: "n/a", t1CeilingUs: null,
      rejectedReason: "Not a superconducting ground-plane film (substrate / dielectric / oxide / junction).",
      contributions: [], note: "",
    };
  }

  const subs = {
    tc: lin(g.tcK, RANGE.tc[0], RANGE.tc[1], true),
    oxide: log(g.oxideTanDelta, RANGE.oxide[0], RANGE.oxide[1], false),
    rs: log(g.surfaceResistanceOhm, RANGE.rs[0], RANGE.rs[1], false),
    tlsTop: log(g.tlsTopPerUm2GHz, RANGE.tls[0], RANGE.tls[1], false),
    tlsSub: log(g.tlsSubPerUm2GHz, RANGE.tls[0], RANGE.tls[1], false),
    london: lin(g.londonDepthNm, RANGE.london[0], RANGE.london[1], false),
    grain: clamp01(g.grainScore),
    lk: log(g.sheetLkPHsq, RANGE.lk[0], RANGE.lk[1], false),
    edge: lin(g.edgeRoughnessNm, RANGE.edge[0], RANGE.edge[1], false),
  };

  const contributions = [
    { key: "tc", label: "Tc margin", weight: W.tc, sub: subs.tc },
    { key: "oxide", label: "Oxide tan δ", weight: W.oxide, sub: subs.oxide },
    { key: "rs", label: "Surface Rs", weight: W.rs, sub: subs.rs },
    { key: "tlsTop", label: "TLS (metal-air)", weight: W.tlsTop, sub: subs.tlsTop },
    { key: "tlsSub", label: "TLS (metal-substrate)", weight: W.tlsSub, sub: subs.tlsSub },
    { key: "london", label: "λ_L geometry", weight: W.london, sub: subs.london },
    { key: "grain", label: "Grain structure", weight: W.grain, sub: subs.grain },
    { key: "lk", label: "Sheet L_k", weight: W.lk, sub: subs.lk },
    { key: "edge", label: "Edge roughness", weight: W.edge, sub: subs.edge },
  ];

  // Reject gates (properties 10-12).
  let rejectedReason: string | null = null;
  if (g.pinholePerUm2 > 1) rejectedReason = `Pinhole/void density ${g.pinholePerUm2}/µm² risks shorts to substrate`;
  else if (!g.adhesion) rejectedReason = "Film does not adhere to substrate";
  else if (g.patterning === "incompatible") rejectedReason = "Incompatible with wet/dry etch patterning";

  let score = contributions.reduce((acc, c) => acc + c.weight * c.sub, 0);
  // Property 12: "poor" patterning is a heavy penalty (soft / hard-to-etch films).
  if (g.patterning === "poor") score *= 0.6;
  // Property 13: capping availability is a bonus (gates whether the oxide can be passivated).
  if (g.cappingAvailable) score = Math.min(1, score + 0.03);

  if (rejectedReason) {
    return { applicable: true, score: 0, label: "reject", t1CeilingUs: g.t1CeilingUs, rejectedReason, contributions, note: g.note };
  }

  const pct = Math.round(score * 100);
  const label: GroundPlaneScore["label"] = pct >= 70 ? "high" : pct >= 45 ? "medium" : "low";
  return { applicable: true, score: pct, label, t1CeilingUs: g.t1CeilingUs, rejectedReason: null, contributions, note: g.note };
}

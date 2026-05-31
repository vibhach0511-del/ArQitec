"""Qubit material catalogue, enriched from the Materials Project API.

Shows ACTUAL materials (Tantalum, Niobium, Niobium oxide, sapphire, TiN/NbN,
Si, ...) rather than named devices. Each curated entry carries:
  - role + which qubit-type families it suits (for the frontend filter)
  - representative QEC noise estimates (p_gate_2q, bias_eta, T1/T2) — these are
    NOT in Materials Project, so they are curated from the literature
  - live Materials Project properties (density, band gap, is_metal, stability,
    crystal system, mp-id) fetched at build time

Exports a static `src/lib/qa/materials-data.ts` so the app reads the data with
no API key in the browser. Re-run to refresh:

    conda activate qai
    python -m qec_pipeline.materials_project        # uses MP_API_KEY from .env

The key lives in .env (gitignored); never commit it.
"""

from __future__ import annotations

import json
import os
import time

import requests

ROOT = os.path.dirname(os.path.dirname(__file__))
OUT_TS = os.path.join(ROOT, "src", "lib", "qa", "materials-data.ts")
OUT_JSON = os.path.join(os.path.dirname(__file__), "outputs", "materials_project.json")

MP_URL = "https://api.materialsproject.org/materials/summary/"
MP_FIELDS = "material_id,formula_pretty,density,band_gap,is_metal,energy_above_hull,symmetry"

CHARGE = ["cooper-pair-box", "transmon", "xmon", "gatemon"]
FLUX = ["rf-squid", "flux-qubit", "fluxonium"]
PHASE = ["phase-qubit", "quantronium"]
ALL = CHARGE + FLUX + PHASE


# Curated QEC material catalogue. p_gate_2q / bias_eta / T1 / T2 are
# representative literature estimates for a qubit built with this material.
CURATED = [
    {"id": "tantalum", "name": "Tantalum (Ta)", "formula": "Ta", "role": "electrode",
     "families": CHARGE + ["fluxonium"], "p_gate_2q": 0.004, "bias_eta": 1.5, "T1_us": 300, "T2_us": 200,
     "note": "Ta films on sapphire give record transmon T1 (Place et al. 2021); benign native oxide."},
    {"id": "niobium", "name": "Niobium (Nb)", "formula": "Nb", "role": "electrode",
     "families": ALL, "p_gate_2q": 0.006, "bias_eta": 1.5, "T1_us": 120, "T2_us": 90,
     "note": "Workhorse superconducting film; high Tc, but native Nb2O5 is a dominant loss source."},
    {"id": "aluminium", "name": "Aluminium (Al)", "formula": "Al", "role": "electrode + junction",
     "families": ALL, "p_gate_2q": 0.008, "bias_eta": 1.3, "T1_us": 90, "T2_us": 70,
     "note": "Legacy electrode; also forms the AlOx tunnel-junction barrier."},
    {"id": "tin", "name": "Titanium Nitride (TiN)", "formula": "TiN", "role": "electrode / superinductor",
     "families": CHARGE + ["flux-qubit", "fluxonium"], "p_gate_2q": 0.005, "bias_eta": 2.0, "T1_us": 200, "T2_us": 150,
     "note": "Low microwave loss and high kinetic inductance — compact resonators and superinductors."},
    {"id": "nbn", "name": "Niobium Nitride (NbN)", "formula": "NbN", "role": "superinductor",
     "families": ["flux-qubit", "fluxonium"], "p_gate_2q": 0.006, "bias_eta": 4.0, "T1_us": 250, "T2_us": 180,
     "note": "High-Tc, high kinetic inductance — fluxonium superinductor arrays."},
    {"id": "granular-al", "name": "Granular Aluminium (grAl)", "formula": "Al", "role": "superinductor",
     "families": ["fluxonium"], "p_gate_2q": 0.005, "bias_eta": 3.0, "T1_us": 300, "T2_us": 220,
     "note": "Disordered aluminium with very high kinetic inductance for superinductors."},
    {"id": "nbtin", "name": "Niobium-Titanium Nitride (NbTiN)", "formula": "NbTiN", "role": "superinductor",
     "families": ["flux-qubit", "fluxonium"], "p_gate_2q": 0.006, "bias_eta": 3.5, "T1_us": 260, "T2_us": 190,
     "note": "Robust high-kinetic-inductance nitride; stable native interface."},
    {"id": "indium", "name": "Indium (In)", "formula": "In", "role": "interconnect",
     "families": ALL, "p_gate_2q": 0.010, "bias_eta": 1.2, "T1_us": 60, "T2_us": 40,
     "note": "Bump-bonds for flip-chip / 3D integration; not the qubit material itself."},
    {"id": "tin-metal", "name": "Tin (Sn)", "formula": "Sn", "role": "electrode (historical)",
     "families": PHASE + ["cooper-pair-box"], "p_gate_2q": 0.012, "bias_eta": 1.3, "T1_us": 20, "T2_us": 12,
     "note": "Early superconductor; largely historical for qubits."},
    {"id": "sapphire", "name": "Sapphire (Al\u2082O\u2083)", "formula": "Al2O3", "role": "substrate",
     "families": ALL, "p_gate_2q": 0.004, "bias_eta": 1.5, "T1_us": 300, "T2_us": 200,
     "note": "Ultra-low-loss crystalline substrate; pairs with Ta for record coherence."},
    {"id": "silicon", "name": "Silicon (Si)", "formula": "Si", "role": "substrate",
     "families": ALL, "p_gate_2q": 0.006, "bias_eta": 1.5, "T1_us": 150, "T2_us": 110,
     "note": "CMOS-compatible substrate; surface oxide adds loss without passivation."},
    {"id": "mgo", "name": "Magnesium Oxide (MgO)", "formula": "MgO", "role": "substrate",
     "families": ALL, "p_gate_2q": 0.007, "bias_eta": 1.4, "T1_us": 120, "T2_us": 90,
     "note": "Crystalline substrate, lattice-matched for some nitride films."},
    {"id": "alox", "name": "Aluminium Oxide (AlOx barrier)", "formula": "Al2O3", "role": "junction barrier",
     "families": ALL, "p_gate_2q": 0.008, "bias_eta": 1.3, "T1_us": 90, "T2_us": 70,
     "note": "Tunnel-junction barrier; two-level systems in the barrier cap coherence."},
    {"id": "nb2o5", "name": "Niobium Oxide (Nb\u2082O\u2085)", "formula": "Nb2O5", "role": "surface oxide / loss",
     "families": CHARGE + FLUX, "p_gate_2q": 0.020, "bias_eta": 1.4, "T1_us": 30, "T2_us": 20,
     "note": "Native Nb surface oxide — a dominant TLS loss source; minimize, do not build with it."},
    {"id": "nbo", "name": "Niobium Monoxide (NbO)", "formula": "NbO", "role": "surface oxide / loss",
     "families": CHARGE + FLUX, "p_gate_2q": 0.018, "bias_eta": 1.4, "T1_us": 35, "T2_us": 22,
     "note": "Suboxide at the Nb interface; contributes interface loss."},
    {"id": "ta2o5", "name": "Tantalum Oxide (Ta\u2082O\u2085)", "formula": "Ta2O5", "role": "surface oxide",
     "families": CHARGE, "p_gate_2q": 0.012, "bias_eta": 1.5, "T1_us": 80, "T2_us": 55,
     "note": "Ta's native oxide is far less lossy than Nb's — part of why Ta wins."},
    {"id": "sio2", "name": "Silicon Dioxide (SiO\u2082)", "formula": "SiO2", "role": "dielectric / loss",
     "families": ALL, "p_gate_2q": 0.015, "bias_eta": 1.4, "T1_us": 50, "T2_us": 35,
     "note": "Amorphous SiO2 is lossy; keep out of high-field regions."},
    {"id": "hbn", "name": "Hexagonal Boron Nitride (h-BN)", "formula": "BN", "role": "dielectric",
     "families": CHARGE + ["fluxonium"], "p_gate_2q": 0.006, "bias_eta": 1.5, "T1_us": 160, "T2_us": 120,
     "note": "Crystalline low-loss dielectric for encapsulation / clean barriers."},
]


def read_key() -> str | None:
    if os.environ.get("MP_API_KEY"):
        return os.environ["MP_API_KEY"]
    env = os.path.join(ROOT, ".env")
    if os.path.exists(env):
        for line in open(env):
            if line.strip().startswith("MP_API_KEY="):
                return line.split("=", 1)[1].strip()
    return None


def mp_query(formula: str, key: str) -> dict | None:
    try:
        r = requests.get(
            MP_URL,
            params={"formula": formula, "_fields": MP_FIELDS, "_limit": 20},
            headers={"X-API-KEY": key},
            timeout=25,
        )
        r.raise_for_status()
        docs = r.json().get("data", [])
        if not docs:
            return None
        best = min(docs, key=lambda d: d.get("energy_above_hull", 9e9))
        return {
            "mpId": best.get("material_id"),
            "density": best.get("density"),
            "bandGap": best.get("band_gap"),
            "isMetal": best.get("is_metal"),
            "eAboveHull": best.get("energy_above_hull"),
            "crystalSystem": (best.get("symmetry") or {}).get("crystal_system"),
        }
    except Exception as e:  # noqa: BLE001
        print(f"    MP query failed for {formula}: {e}")
        return None


def ts_value(v) -> str:
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "true" if v else "false"
    if isinstance(v, (int, float)):
        return repr(round(v, 6) if isinstance(v, float) else v)
    if isinstance(v, list):
        return "[" + ", ".join(json.dumps(x) for x in v) + "]"
    return json.dumps(v)


def export_ts(records: list[dict]):
    fields = ["id", "name", "formula", "role", "families", "pGate2q", "biasEta",
              "t1Us", "t2Us", "mpId", "density", "bandGap", "isMetal", "eAboveHull",
              "crystalSystem", "note"]
    rows = []
    for r in records:
        parts = ", ".join(f"{f}: {ts_value(r.get(f))}" for f in fields)
        rows.append("  { " + parts + " }")
    body = ",\n".join(rows)
    enriched = sum(1 for r in records if r.get("mpId"))
    ts = f"""// AUTO-GENERATED by qec_pipeline/materials_project.py. Do not edit by hand.
// Curated QEC qubit materials enriched with live Materials Project properties.
// QEC noise estimates (pGate2q/biasEta/t1Us/t2Us) are curated literature values
// (Materials Project does not provide qubit coherence data).

export interface QubitMaterial {{
  id: string; name: string; formula: string; role: string; families: string[];
  pGate2q: number; biasEta: number; t1Us: number; t2Us: number;
  mpId: string | null; density: number | null; bandGap: number | null;
  isMetal: boolean | null; eAboveHull: number | null; crystalSystem: string | null;
  note: string;
}}

export const MATERIALS: QubitMaterial[] = [
{body}
];

export const MATERIALS_META = {{
  source: "Materials Project (materialsproject.org)",
  enriched: {enriched},
  total: {len(records)},
  generatedAt: "{time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}",
}};
"""
    os.makedirs(os.path.dirname(OUT_TS), exist_ok=True)
    with open(OUT_TS, "w") as f:
        f.write(ts)


def main():
    key = read_key()
    if not key:
        raise SystemExit("No MP_API_KEY found in env or .env")
    print(f"Enriching {len(CURATED)} curated materials from Materials Project ...")
    records = []
    for m in CURATED:
        mp = mp_query(m["formula"], key)
        rec = {
            "id": m["id"], "name": m["name"], "formula": m["formula"], "role": m["role"],
            "families": m["families"], "pGate2q": m["p_gate_2q"], "biasEta": m["bias_eta"],
            "t1Us": m["T1_us"], "t2Us": m["T2_us"], "note": m["note"],
        }
        rec.update(mp or {"mpId": None, "density": None, "bandGap": None,
                          "isMetal": None, "eAboveHull": None, "crystalSystem": None})
        tag = rec["mpId"] or "no-mp-match"
        print(f"  {m['name']:<34} {m['formula']:<7} -> {tag}")
        records.append(rec)
        time.sleep(0.05)

    os.makedirs(os.path.dirname(OUT_JSON), exist_ok=True)
    with open(OUT_JSON, "w") as f:
        json.dump(records, f, indent=2)
    export_ts(records)
    enriched = sum(1 for r in records if r.get("mpId"))
    print(f"\n  {enriched}/{len(records)} enriched with MP data")
    print(f"  wrote {OUT_TS}")
    print(f"  wrote {OUT_JSON}")


if __name__ == "__main__":
    main()

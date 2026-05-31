"""
fitness_matrix.py — code-material fitness scoring for superconducting QEC

Given:
  - 24 planar-superconducting-compatible QEC codes (keeper set)
  - 161 fabrication materials × 8 roles (vibha's material_properties.py)
  - Per-code preferences (code_preferences.json)

Produces:
  - SQLite `fitness_matrix` table keyed on (code_id, material_id, role)
  - CSV at outputs/fitness_matrix.csv for inspection
  - Stdout: top-5 (code, material) recommendations per role for sanity check

Scoring rubric (role-conditional):
  - coherence_fit  — applies to substrate, film, cavity, superinductor (needs T1_us)
  - bias_fit       — applies to film, cavity, superinductor (needs bias_eta)
  - confidence_weight — modifier: 1.0 / 0.85 / 0.7 for measured / estimated / speculative
  - role-fit is implicit in the (material, role) key, not a separate axis
  - gate-error axis dropped; held constant per noise_profiles.py convention

Aggregation: geometric mean over *applicable* axes, then × confidence_weight.

Cells for roles without applicable axes (junction, capping, dielectric, wiring)
become feasibility markers with overall_score = 0.5 × confidence_weight.
The user query filters by role at lookup time.

Run:
    python fitness_matrix.py                       # uses ./material_properties.py
    python fitness_matrix.py --catalog PATH/to/material_properties.py
    python fitness_matrix.py --db PATH/to/quantum_hack.db

Expected location: repo root, run after vibha's material_properties.py is merged.
"""

from __future__ import annotations

import argparse
import csv
import importlib.util
import json
import math
import os
import sqlite3
import sys
from collections import defaultdict
from dataclasses import fields as dc_fields
from typing import Optional


KEEPER_CODES = [
    "surface", "rotated_surface", "toric", "xzzx", "xysurface",
    "xzzx_7_1_3", "xzzx_10_2_3", "clifford-deformed_surface",
    "triangle_surface", "surface-17",
    "color", "2d_color", "triangular_color", "488_color", "4612_color",
    "bacon_shor", "bacon_shor_4", "bacon_shor_9",
    "bravyi_bacon_shor", "bravyi_bacon_shor_6",
    "heavy_hex", "quantum_repetition", "shor_nine", "steane",
]

CONFIDENCE_WEIGHTS = {
    "measured":       1.00,
    "estimated":      0.85,
    "speculative":    0.70,
    "not_applicable": 0.50,  # fall-through for malformed entries
}

# Which roles have which axes
COHERENCE_ROLES = {"substrate", "film", "cavity", "superinductor"}
BIAS_ROLES = {"film", "cavity", "superinductor"}
# Roles with no discriminating axes — treated as feasibility markers
NO_AXIS_ROLES = {"junction", "capping", "dielectric", "wiring"}

DEFAULT_DISTANCE = 11  # typical surface-code distance for scoring purposes
NEUTRAL_FEASIBILITY_SCORE = 0.5


# ---------------------------------------------------------------------------
# Qubit-family classifier (Option A): the 24 keeper codes are planar transmon-
# style. Some materials in the catalog are bosonic-cavity, NV-hybrid, or
# topological platforms — they appear as `film` or `cavity` rows but don't
# host planar surface codes. Classify each (section, role) into:
#   superconducting_planar — in scope, full ranking
#   superconducting_bosonic — 3D cavities, out of scope for our 24 codes
#   other — NV, Majorana/nanowire, exotic non-transmon platforms
# ---------------------------------------------------------------------------

NV_SECTIONS = {"NV_DIAMOND"}
TOPOLOGICAL_SECTIONS = {"ALUMINUM_ON_INAS", "INSB_AL_NANOWIRE", "HGTE"}
EXOTIC_SECTIONS = {"BSCCO", "YBCO", "MERCURY", "IRON_SELENIDE", "TWISTED_BILAYER_GRAPHENE"}

# Display-name substring patterns for the new flat schema, where section names
# may be lowercased/role-suffixed (e.g. 'nv_diamond_film' instead of 'NV_DIAMOND').
# Matched case-insensitively against props.display_name AND the section key.
NV_PATTERNS = ("nv center", "nv-center", "nv_center", "nv diamond", "nv_diamond")
TOPO_PATTERNS = ("inas nanowire", "insb nanowire", "al-inas", "al/inas",
                 "aluminum on inas", "hgte", "majorana")
EXOTIC_PATTERNS = ("bscco", "ybco", "mercury (hg)", "iron selenide",
                   "twisted bilayer", "magic-angle")


def _matches_any(haystack: str, patterns: tuple) -> bool:
    h = (haystack or "").lower()
    return any(p in h for p in patterns)


def classify_qubit_family(section_name: str, role: str, props=None) -> str:
    """Classify a (material section, role) into qubit family for code compatibility.

    Returns one of: 'superconducting_planar', 'superconducting_bosonic', 'other'.

    Uses section name (old schema) AND display_name substring matching (new
    schema, where keys may not preserve the section identifier).
    """
    # 3D cavities host bosonic codes, not our planar code set
    if role == "cavity":
        return "superconducting_bosonic"

    # Build a search corpus from both section name and display_name
    section_lc = (section_name or "").lower()
    display = (getattr(props, "display_name", "") or "") if props else ""

    # Spin-defect (NV)
    if section_name in NV_SECTIONS \
            or _matches_any(section_lc, NV_PATTERNS) \
            or _matches_any(display, NV_PATTERNS):
        return "other"

    # Topological / Majorana / nanowire
    if section_name in TOPOLOGICAL_SECTIONS \
            or _matches_any(section_lc, TOPO_PATTERNS) \
            or _matches_any(display, TOPO_PATTERNS):
        return "other"

    # High-Tc / exotic SCs not used for transmon-class qubits
    if section_name in EXOTIC_SECTIONS \
            or _matches_any(section_lc, EXOTIC_PATTERNS) \
            or _matches_any(display, EXOTIC_PATTERNS):
        return "other"

    # Diamond-as-film is typically the NV-hybrid case
    if (section_name == "DIAMOND" or "diamond" in section_lc) and role == "film":
        # Allow CVD-diamond-film for transmon research, exclude NV-hybrid
        if _matches_any(display, NV_PATTERNS):
            return "other"

    return "superconducting_planar"


def load_material_catalog(catalog_path: str):
    """Load material_properties.py as a module; return list of (section_name, role_key, props).

    Handles two schema variants:
      NEW: a single flat dict `ALL_PROPERTIES = {key: MaterialProperties, ...}`
           plus per-role aggregation dicts (FILM_PROPERTIES, etc.) and
           DEFAULTS_BY_ROLE. We use ALL_PROPERTIES as canonical and ignore
           the per-role dicts to avoid double-counting.
      OLD: per-material dicts (ALUMINUM = {as_film: ..., as_junction: ...}, etc.).
           We scan all top-level dicts holding MaterialProperties instances.
    """
    spec = importlib.util.spec_from_file_location("matprops", catalog_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Could not load module from {catalog_path}")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)

    instances = []

    # NEW schema: prefer ALL_PROPERTIES as the single canonical source
    if hasattr(mod, "ALL_PROPERTIES"):
        all_props = getattr(mod, "ALL_PROPERTIES")
        if isinstance(all_props, dict):
            for key, props in all_props.items():
                if hasattr(props, "role") and hasattr(props, "display_name"):
                    # New schema is flat — use key as both section and role identifier
                    instances.append((key, key, props))
            return instances

    # OLD schema fallback: scan top-level dicts but skip the per-role
    # aggregation dicts and DEFAULTS_BY_ROLE templates if present.
    SKIP_DICTS = {
        "FILM_PROPERTIES", "JUNCTION_PROPERTIES", "SUBSTRATE_PROPERTIES",
        "CAVITY_PROPERTIES", "CAPPING_PROPERTIES", "DIELECTRIC_PROPERTIES",
        "SUPERINDUCTOR_PROPERTIES", "WIRING_PROPERTIES", "DEFAULTS_BY_ROLE",
    }
    for name in dir(mod):
        if name.startswith("_") or name in SKIP_DICTS:
            continue
        obj = getattr(mod, name)
        if isinstance(obj, dict) and obj:
            first_val = next(iter(obj.values()))
            if hasattr(first_val, "role") and hasattr(first_val, "display_name"):
                for role_key, props in obj.items():
                    instances.append((name, role_key, props))
    return instances


def coherence_fit(t1_us: Optional[float], code_pref: dict, distance: int) -> Optional[float]:
    """Score how well material T1 supports running this code at the target distance.

    Logic: per-round idle error = cycle_time / T1. Compare to code's threshold.

    Score curve (continuous, no hard cliff):
      ratio ≤ 0.05  (≥ 20× margin below threshold)        → 1.00
      ratio = 1.00  (exactly at threshold)                 → 0.05
      ratio = 1.50  (50% over threshold)                   → 0.030
      ratio = 2.00  (2× over threshold)                    → 0.018
      ratio = 5.00  (well past threshold)                  → ~0.001

    Below threshold uses log-scaled decay; above threshold uses exponential
    tail starting from 0.05. This preserves ranking among past-threshold
    materials rather than collapsing them all to zero.
    """
    if t1_us is None or t1_us <= 0:
        return None
    cycle_time_us = code_pref["cycle_time_us"]
    threshold = code_pref["threshold_p2q"]
    if threshold <= 0:
        return None
    per_round_idle_err = cycle_time_us / t1_us
    ratio = per_round_idle_err / threshold

    if ratio <= 0.05:
        return 1.0
    if ratio <= 1.0:
        # Smooth log-scaled decay: 1.0 at ratio=0.05, 0.05 at ratio=1.0
        return 1.0 - 0.95 * math.log(ratio / 0.05) / math.log(20.0)
    # Past threshold — exponential tail starting from 0.05
    return 0.05 * math.exp(-(ratio - 1.0))


def bias_fit(eta: Optional[float], bias_pref: str) -> Optional[float]:
    """Score how well material bias η aligns with code's bias preference."""
    if eta is None:
        return None
    if eta <= 0:
        eta = 0.01

    if bias_pref == "agnostic":
        # Bias-agnostic codes always score moderately; this axis is non-discriminating for them.
        return 0.70

    if bias_pref == "low":
        # Best at η≈1; falls off above. Smooth sigmoid centered at η=3.
        # eta=1 → ~0.95, eta=3 → 0.5, eta=10 → ~0.1
        return 1.0 / (1.0 + math.exp((eta - 3.0) / 1.5))

    if bias_pref == "high":
        # Best at η≥5; near-zero for η<2. Smooth sigmoid centered at η=4.
        # eta=1 → ~0.05, eta=4 → 0.5, eta=10 → ~0.95
        return 1.0 / (1.0 + math.exp(-(eta - 4.0) / 1.5))

    if bias_pref == "extreme":
        # Repetition code: needs η ≥ 20 to be useful. Sigmoid centered at η=20.
        return 1.0 / (1.0 + math.exp(-(eta - 20.0) / 5.0))

    return 0.5  # unknown preference


def confidence_weight(confidence: str) -> float:
    return CONFIDENCE_WEIGHTS.get(confidence, 0.7)


def geo_mean(values: list[float]) -> float:
    """Geometric mean over non-None positive values. Returns 0 if any value is 0."""
    vals = [v for v in values if v is not None]
    if not vals:
        return 0.0
    if any(v == 0.0 for v in vals):
        return 0.0
    log_sum = sum(math.log(v) for v in vals)
    return math.exp(log_sum / len(vals))


def score_cell(code_id: str, code_pref: dict, material_section: str, role_key: str, props) -> dict:
    """Compute the fitness score for one (code, material, role) cell."""
    role = props.role
    conf = props.confidence
    conf_w = confidence_weight(conf)
    qubit_family = classify_qubit_family(material_section, role, props)

    coh = bias = None
    applied_axes = []

    # Out-of-scope materials get a flat 0.0 score and a tier label.
    # We keep them in the matrix for transparency and frontend filtering.
    if qubit_family == "superconducting_bosonic":
        return _make_cell(
            code_id, material_section, role_key, role, props, conf_w,
            None, None, 0.0, "out_of_scope_bosonic", "none",
            code_pref, qubit_family,
        )
    if qubit_family == "other":
        return _make_cell(
            code_id, material_section, role_key, role, props, conf_w,
            None, None, 0.0, "out_of_scope_other", "none",
            code_pref, qubit_family,
        )

    # In-scope (superconducting_planar) materials — apply role-conditional axes.
    if role in COHERENCE_ROLES:
        coh = coherence_fit(props.T1_us, code_pref, DEFAULT_DISTANCE)
        if coh is not None:
            applied_axes.append("coherence")

    if role in BIAS_ROLES:
        b = bias_fit(props.bias_eta, code_pref["bias_preference"])
        if b is not None:
            bias = b
            applied_axes.append("bias")

    if role in NO_AXIS_ROLES or not applied_axes:
        overall = NEUTRAL_FEASIBILITY_SCORE * conf_w
        tier = "feasibility"
    else:
        raw = geo_mean([v for v in [coh, bias] if v is not None])
        overall = raw * conf_w
        tier = "ranked"

    return _make_cell(
        code_id, material_section, role_key, role, props, conf_w,
        coh, bias, overall, tier, ",".join(applied_axes) if applied_axes else "none",
        code_pref, qubit_family,
    )


def _make_cell(code_id, section, role_key, role, props, conf_w,
               coh, bias, overall, tier, applied, code_pref, qubit_family):
    return {
        "code_id": code_id,
        "material_section": section,
        "role_key": role_key,
        "role": role,
        "material_id": f"{section}:{role_key}",
        "display_name": props.display_name,
        "confidence": props.confidence,
        "qubit_family": qubit_family,
        "coherence_fit": coh,
        "bias_fit": bias,
        "confidence_weight": conf_w,
        "overall_score": overall,
        "tier": tier,
        "applied_axes": applied,
        "T1_us": props.T1_us,
        "bias_eta": props.bias_eta,
        "bias_preference": code_pref["bias_preference"],
        "threshold_p2q": code_pref["threshold_p2q"],
    }


def write_sqlite(cells: list[dict], db_path: str):
    """Create / replace the fitness_matrix table with these cells."""
    os.makedirs(os.path.dirname(db_path) or ".", exist_ok=True)
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("DROP TABLE IF EXISTS fitness_matrix")
    cur.execute("""
        CREATE TABLE fitness_matrix (
            code_id TEXT NOT NULL,
            material_id TEXT NOT NULL,
            role TEXT NOT NULL,
            qubit_family TEXT,
            display_name TEXT,
            confidence TEXT,
            coherence_fit REAL,
            bias_fit REAL,
            confidence_weight REAL,
            overall_score REAL,
            tier TEXT,
            applied_axes TEXT,
            T1_us REAL,
            bias_eta REAL,
            bias_preference TEXT,
            threshold_p2q REAL,
            PRIMARY KEY (code_id, material_id)
        )
    """)
    cur.executemany("""
        INSERT INTO fitness_matrix (
            code_id, material_id, role, qubit_family, display_name, confidence,
            coherence_fit, bias_fit, confidence_weight, overall_score,
            tier, applied_axes, T1_us, bias_eta, bias_preference, threshold_p2q
        ) VALUES (
            :code_id, :material_id, :role, :qubit_family, :display_name, :confidence,
            :coherence_fit, :bias_fit, :confidence_weight, :overall_score,
            :tier, :applied_axes, :T1_us, :bias_eta, :bias_preference, :threshold_p2q
        )
    """, cells)
    cur.execute("CREATE INDEX idx_fm_code ON fitness_matrix(code_id)")
    cur.execute("CREATE INDEX idx_fm_role ON fitness_matrix(role)")
    cur.execute("CREATE INDEX idx_fm_family ON fitness_matrix(qubit_family)")
    conn.commit()
    conn.close()


def write_csv(cells: list[dict], csv_path: str):
    os.makedirs(os.path.dirname(csv_path) or ".", exist_ok=True)
    fieldnames = ["code_id", "material_id", "role", "qubit_family", "display_name",
                  "confidence", "coherence_fit", "bias_fit", "confidence_weight",
                  "overall_score", "tier", "applied_axes", "T1_us", "bias_eta",
                  "bias_preference", "threshold_p2q"]
    with open(csv_path, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        for c in cells:
            w.writerow({k: c.get(k) for k in fieldnames})


def print_sanity_check(cells: list[dict]):
    """Print top-5 (code, material) for each role with discriminating axes.

    Only considers cells in the superconducting_planar qubit family.
    """
    print("\n" + "=" * 72)
    print("SANITY CHECK — top-5 ranked cells per role")
    print("(superconducting_planar qubit family only)")
    print("=" * 72)

    by_role_code = defaultdict(list)
    for c in cells:
        if c["tier"] == "ranked" and c["qubit_family"] == "superconducting_planar":
            by_role_code[c["role"]].append(c)

    for role in ["substrate", "film", "cavity", "superinductor"]:
        rows = by_role_code.get(role, [])
        if not rows:
            print(f"\n--- role: {role} — no ranked cells in scope ---")
            continue
        rows.sort(key=lambda r: -r["overall_score"])
        print(f"\n--- role: {role} — {len(rows)} in-scope ranked cells, top 5 ---")
        print(f"{'code_id':<28}{'material':<32}{'T1':>6}{'eta':>6}{'score':>7}  axes")
        for r in rows[:5]:
            t1 = f"{r['T1_us']:.0f}" if r['T1_us'] else "—"
            eta = f"{r['bias_eta']:.1f}" if r['bias_eta'] is not None else "—"
            print(f"{r['code_id']:<28}{r['display_name'][:30]:<32}"
                  f"{t1:>6}{eta:>6}{r['overall_score']:>7.3f}  {r['applied_axes']}")

    # Tier + family breakdown
    print("\n=== tier × qubit_family breakdown ===")
    from collections import Counter
    breakdown = Counter((c["tier"], c["qubit_family"]) for c in cells)
    for (tier, family), n in sorted(breakdown.items()):
        print(f"  {tier:<26s}{family:<28s}{n:>6d}")
    print(f"  {'TOTAL':<26s}{'':<28s}{len(cells):>6d}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--catalog", default="./material_properties.py",
                    help="Path to vibha's material_properties.py")
    ap.add_argument("--preferences", default="./code_preferences.json",
                    help="Path to per-code preferences JSON")
    ap.add_argument("--db", default="./qec_pipeline/data/quantum_hack.db",
                    help="Path to SQLite DB")
    ap.add_argument("--csv", default="./outputs/fitness_matrix.csv",
                    help="Path for CSV output")
    args = ap.parse_args()

    # Load
    if not os.path.exists(args.catalog):
        print(f"ERROR: catalog not found at {args.catalog}", file=sys.stderr)
        sys.exit(1)
    if not os.path.exists(args.preferences):
        print(f"ERROR: preferences not found at {args.preferences}", file=sys.stderr)
        sys.exit(1)

    with open(args.preferences) as f:
        prefs = json.load(f)

    catalog = load_material_catalog(args.catalog)
    print(f"Loaded catalog: {len(catalog)} (material_section, role) instances")

    code_prefs = {k: v for k, v in prefs.items() if not k.startswith("_")}
    print(f"Loaded preferences for {len(code_prefs)} codes")

    # Score every (code, material, role) cell
    cells = []
    for code_id in KEEPER_CODES:
        cp = code_prefs.get(code_id)
        if cp is None:
            print(f"  WARN: no preference for {code_id}, skipping")
            continue
        for section_name, role_key, props in catalog:
            cells.append(score_cell(code_id, cp, section_name, role_key, props))

    print(f"Generated {len(cells)} cells")

    # Write
    write_sqlite(cells, args.db)
    write_csv(cells, args.csv)
    print(f"Wrote SQLite → {args.db}")
    print(f"Wrote CSV    → {args.csv}")

    # Sanity check
    print_sanity_check(cells)


if __name__ == "__main__":
    main()

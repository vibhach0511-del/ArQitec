"""
Target operating points + feasibility analysis.

A target is a (use case, logical error rate, logical qubits, logical ops)
tuple. For each (material, target) pair we compute:
  - which QEC code the recommender picks for the material
  - required surface-code distance d to hit the logical error rate
  - physical-qubit overhead per logical qubit
  - total physical qubits to run the target application
  - whether the target is feasible at all

The math is the standard surface-code threshold formula:
    p_L  ≈  A · (p_phys / p_th) ^ ((d+1)/2)
Solved for d:
    d   =  2 · log(p_L / A) / log(p_phys / p_th)  −  1
We round d up to the next odd integer (surface-code distances are odd) and
floor at 3 (the smallest non-trivial). For biased-noise codes (XZZX, cat)
we apply the well-known approximate `d / sqrt(eta)` distance reduction —
the reason cat qubits can target the same logical error rate at tiny
distances.

Threshold and prefactor are *illustrative* representative values
(p_th = 0.01, A = 0.1). Replace with values fit to your actual decoder
and noise model before any decision that matters.
"""

import math
from typing import TypedDict

from qec_recommender import recommend_code

# Surface-code constants — illustrative.
P_TH = 0.01      # ~1% threshold for matching decoder
A    = 0.1       # logical-error prefactor


class Target(TypedDict, total=False):
    name: str
    logical_error_target: float    # per logical operation
    logical_qubits: int            # number of logical qubits the app needs
    logical_ops: float             # rough total logical operations per useful run
    notes: str


TARGETS: list[Target] = [
    {
        "name":                 "NISQ variational (no QEC)",
        "logical_error_target": 1e-3,
        "logical_qubits":       50,
        "logical_ops":          1e5,
        "notes":                "Pre-fault-tolerant. Raw physical qubits suffice for approximate optimization, VQE warm-ups, quantum ML pilots.",
    },
    {
        "name":                 "Single-logical-qubit memory demo",
        "logical_error_target": 1e-5,
        "logical_qubits":       1,
        "logical_ops":          1e6,
        "notes":                "The Google Willow / IBM kind of demonstration: keep one logical qubit alive long enough to show exponential suppression with distance.",
    },
    {
        "name":                 "Materials chemistry (catalyst design)",
        "logical_error_target": 1e-6,
        "logical_qubits":       100,
        "logical_ops":          1e9,
        "notes":                "Phase-estimation-based chemistry for industrial catalyst / battery / drug design. Sub-µHa accuracy.",
    },
    {
        "name":                 "Fault-tolerant simulation at scale",
        "logical_error_target": 1e-8,
        "logical_qubits":       1000,
        "logical_ops":          1e11,
        "notes":                "Condensed-matter dynamics, protein folding, plasma physics. The near-term FT target before cryptanalysis.",
    },
    {
        "name":                 "Cryptanalysis (RSA-2048)",
        "logical_error_target": 1e-15,
        "logical_qubits":       4096,
        "logical_ops":          1e12,
        "notes":                "Shor's algorithm. The classic 'why quantum matters' driver, but the physical-qubit ask is enormous.",
    },
]


def _next_odd_at_least_3(x: float) -> int:
    d = max(3, int(math.ceil(x)))
    if d % 2 == 0:
        d += 1
    return d


def required_distance(p_phys: float, p_L: float) -> float | None:
    """Surface-code distance needed to hit logical error p_L at physical
    gate error p_phys. Returns None if material is above threshold or
    the target is impossible."""
    if p_phys >= P_TH or p_phys <= 0:
        return None
    if p_L >= A:
        # Already below the prefactor — the smallest non-trivial code suffices.
        return 3.0
    num = math.log(p_L / A)
    den = math.log(p_phys / P_TH)
    d_raw = 2 * (num / den) - 1
    return max(3.0, d_raw)


def physical_qubits_per_logical(d: float) -> int:
    """Rotated surface code uses ~2d^2 - 1 physical qubits per logical qubit."""
    d_int = _next_odd_at_least_3(d)
    return 2 * d_int * d_int - 1


def feasibility(material: dict, target: Target) -> dict:
    """For one (material, target) pair, return a feasibility record."""
    code = recommend_code(material)
    if code.startswith("NONE"):
        return {
            "feasible":   False,
            "reason":     "material above 2D-code threshold",
            "code":       code,
            "distance":   None,
            "phys_per_logical": None,
            "total_physical_qubits": None,
        }

    d = required_distance(material["p_gate_2q"], target["logical_error_target"])
    if d is None:
        return {
            "feasible":   False,
            "reason":     "p_phys above threshold for any 2D code",
            "code":       code,
            "distance":   None,
            "phys_per_logical": None,
            "total_physical_qubits": None,
        }

    # Bias-noise codes: effective distance is d / sqrt(eta) for large bias.
    if "XZZX" in code or "Color" in code:
        eta = max(1.0, float(material.get("bias_eta", 1.0)))
        d = max(3.0, d / math.sqrt(eta))

    per_logical    = physical_qubits_per_logical(d)
    total_physical = per_logical * target["logical_qubits"]
    return {
        "feasible":              True,
        "reason":                "",
        "code":                  code,
        "distance":              d,
        "phys_per_logical":      per_logical,
        "total_physical_qubits": total_physical,
    }


def best_material_for(target: Target, materials: list[dict]) -> dict | None:
    """Return the material that achieves the target with the smallest total
    physical-qubit footprint, or None if none are feasible."""
    feasible = [(m, feasibility(m, target)) for m in materials]
    feasible = [(m, r) for m, r in feasible if r["feasible"]]
    if not feasible:
        return None
    m, r = min(feasible, key=lambda mr: mr[1]["total_physical_qubits"])
    return {"material": m, **r}


if __name__ == "__main__":
    # Run feasibility of every catalogue material on every target.
    from qubit_catalogue import QUBITS

    for t in TARGETS:
        print(f"\n=== {t['name']}  (target p_L = {t['logical_error_target']:.0e},  "
              f"L_qubits = {t['logical_qubits']}) ===")
        print(f"{'MATERIAL':<55} {'CODE':<34} {'d':>6} {'PHYS/LOG':>10} {'TOTAL PHY':>14}")
        for q in QUBITS:
            r = feasibility(q, t)
            if not r["feasible"]:
                print(f"{q['name']:<55} {r['code']:<34} {'—':>6} {'—':>10} {'—':>14}  ({r['reason']})")
            else:
                print(
                    f"{q['name']:<55} "
                    f"{r['code']:<34} "
                    f"{r['distance']:>6.1f} "
                    f"{r['phys_per_logical']:>10,} "
                    f"{r['total_physical_qubits']:>14,}"
                )

        best = best_material_for(t, QUBITS)
        if best:
            print(f"  → best fit: {best['material']['name']}  "
                  f"({best['total_physical_qubits']:,} physical qubits)")
        else:
            print("  → no catalogue material can hit this target")

"""
QEC material schema.

Canonical shape of a material entry used by qec_recommender.recommend_code().
A material describes a candidate qubit platform with the noise + architecture
characteristics that determine which QEC code is the right fit.

Three tiers of fields:
  REQUIRED        — minimum the current recommender consumes.
  RECOMMENDED ★   — high-leverage additions; the v2 recommender reads these
                    and they frequently flip the recommendation.
  OPTIONAL        — useful for deeper analysis but not load-bearing for
                    code selection today.

Old library entries with only REQUIRED fields are still valid; validate()
returns warnings for missing recommended fields, errors for missing required.
"""

from typing import Literal, TypedDict

Connectivity = Literal[
    "2d-nn", "heavy-hex", "all-to-all", "reconfigurable", "3-colorable"
]
BiasAxis = Literal["Z", "X"]
NativeGate = Literal["CZ", "CNOT", "MS", "iSWAP", "fSim"]


class Material(TypedDict, total=False):
    # --- REQUIRED ---
    name: str
    bias_eta: float            # dominant-axis error / minor-axis error
    p_gate_2q: float           # 2-qubit gate error rate, per gate

    # --- RECOMMENDED ★ (drives v2 recommender) ---
    bias_axis: BiasAxis        # which axis dominates (Z or X)
    p_gate_1q: float
    p_meas: float              # measurement error rate
    p_leakage: float           # leakage out of the computational subspace
    connectivity: Connectivity
    cliffords_native: bool     # are H, S, CNOT native + cheap?

    # --- OPTIONAL (deeper characterization) ---
    T1_us: float
    T2_us: float
    T_gate_2q_ns: float
    T_meas_us: float
    native_2q_gate: NativeGate
    qubit_yield: float         # fraction of fabricated qubits that work, 0–1
    p_prep: float
    p_reset: float
    p_idle_per_cycle: float
    p_crosstalk: float
    p_burst: float             # per-second probability of correlated wipeout
    coherent_fraction: float   # 0–1
    correlated_error_length: float  # in qubits
    non_markovian: bool
    heralded_loss: bool
    notes: str


REQUIRED_FIELDS = ("name", "bias_eta", "p_gate_2q")

RECOMMENDED_FIELDS = (
    "bias_axis",
    "p_gate_1q",
    "p_meas",
    "p_leakage",
    "connectivity",
    "cliffords_native",
)

PROBABILITY_FIELDS = (
    "p_gate_2q", "p_gate_1q", "p_meas", "p_leakage",
    "p_prep", "p_reset", "p_idle_per_cycle", "p_crosstalk",
    "coherent_fraction", "qubit_yield",
)


def validate(m: dict) -> tuple[list[str], list[str]]:
    """Return (errors, warnings) for a material entry.

    - errors: must be fixed before the entry is usable.
    - warnings: entry will work with the v1 recommender but won't unlock the
      v2 logic until these fields are populated.
    """
    errors: list[str] = []
    warnings: list[str] = []

    for f in REQUIRED_FIELDS:
        if f not in m or m[f] in (None, ""):
            errors.append(f"missing required field: {f!r}")

    for f in RECOMMENDED_FIELDS:
        if f not in m:
            warnings.append(f"missing recommended field: {f!r}")

    if "bias_eta" in m:
        if not isinstance(m["bias_eta"], (int, float)) or m["bias_eta"] < 0:
            errors.append("bias_eta must be a non-negative number")

    for f in PROBABILITY_FIELDS:
        if f in m and m[f] is not None:
            v = m[f]
            if not isinstance(v, (int, float)) or v < 0 or v > 1:
                errors.append(f"{f!r} must be in [0, 1], got {v!r}")

    if "bias_axis" in m and m["bias_axis"] not in ("Z", "X"):
        errors.append(f"bias_axis must be 'Z' or 'X', got {m['bias_axis']!r}")

    return errors, warnings


# Reference example — fully-populated material showing every tier of the schema.
EXAMPLE: Material = {
    "name": "Superconducting transmon (IBM Heron-class)",
    "bias_eta": 1.5,
    "bias_axis": "Z",
    "p_gate_2q": 0.005,
    "p_gate_1q": 0.0004,
    "p_meas": 0.015,
    "p_leakage": 0.0001,
    "connectivity": "heavy-hex",
    "cliffords_native": True,
    "T1_us": 150.0,
    "T2_us": 120.0,
    "T_gate_2q_ns": 40.0,
    "T_meas_us": 1.0,
    "native_2q_gate": "CZ",
    "qubit_yield": 0.97,
    "notes": "Reference shape for the schema; numbers are illustrative.",
}


if __name__ == "__main__":
    print("Full EXAMPLE material:")
    e, w = validate(EXAMPLE)
    print(f"  errors:   {e or '—'}")
    print(f"  warnings: {w or '—'}\n")

    minimal = {"name": "old-style", "bias_eta": 2.0, "p_gate_2q": 0.005}
    e2, w2 = validate(minimal)
    print("Minimal (v1-era) material:")
    print(f"  errors:   {e2 or '—'}")
    print(f"  warnings ({len(w2)}): {[w.split(': ', 1)[-1] for w in w2]}\n")

    broken = {"name": "bad", "bias_eta": -1, "p_gate_2q": 2.0, "bias_axis": "Y"}
    e3, w3 = validate(broken)
    print("Broken material (should error on three things):")
    print(f"  errors:   {e3}")
    print(f"  warnings ({len(w3)})")

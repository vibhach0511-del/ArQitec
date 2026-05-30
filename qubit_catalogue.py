"""
Qubit catalogue — full-schema entries for candidate platforms.

Each entry conforms to qec_schema.Material with the REQUIRED + RECOMMENDED ★
tiers populated. Selected OPTIONAL fields (T1/T2, gate / measurement
durations, native 2q gate, qubit yield) are included where they shape
near-term planning.

Numbers are illustrative representative values reflecting the general
state-of-the-art for each platform. Replace with measured values from
your own characterization or specific published runs before any decision
that matters; cite sources in the `notes` field as the catalogue tightens.
"""

from qec_recommender import recommend_code
from qec_schema import Material, validate


QUBITS: list[Material] = [
    {
        "name":              "Superconducting transmon (IBM Heron-class)",
        "bias_eta":          1.5,
        "bias_axis":         "Z",
        "p_gate_2q":         0.005,
        "p_gate_1q":         0.0004,
        "p_meas":            0.015,
        "p_leakage":         0.0001,
        "connectivity":      "heavy-hex",
        "cliffords_native":  True,
        "T1_us":             150.0,
        "T2_us":             120.0,
        "T_gate_2q_ns":      40.0,
        "T_meas_us":         1.0,
        "native_2q_gate":    "CZ",
        "qubit_yield":       0.97,
        "notes":             "Workhorse platform. Heavy-hex picked partly to suppress crosstalk; readout still the slowest step.",
    },
    {
        "name":              "Trapped ion (Quantinuum H-class)",
        "bias_eta":          3.0,
        "bias_axis":         "Z",
        "p_gate_2q":         0.002,
        "p_gate_1q":         0.00005,
        "p_meas":            0.003,
        "p_leakage":         0.00001,
        "connectivity":      "all-to-all",
        "cliffords_native":  True,
        "T1_us":             1_000_000.0,    # effectively infinite vs. circuit length
        "T2_us":             10_000.0,
        "T_gate_2q_ns":      30_000.0,
        "T_meas_us":         150.0,
        "native_2q_gate":    "MS",
        "qubit_yield":       0.99,
        "notes":             "All-to-all opens up codes that 2D platforms can't run natively. Slow gates, very high fidelity.",
    },
    {
        "name":              "Neutral atom (QuEra / Pasqal-class)",
        "bias_eta":          1.2,
        "bias_axis":         "Z",
        "p_gate_2q":         0.005,
        "p_gate_1q":         0.001,
        "p_meas":            0.01,
        "p_leakage":         0.001,
        "connectivity":      "reconfigurable",
        "cliffords_native":  True,
        "T1_us":             2_000_000.0,
        "T2_us":             1_500.0,
        "T_gate_2q_ns":      300.0,
        "T_meas_us":         5_000.0,
        "native_2q_gate":    "CZ",
        "qubit_yield":       0.95,
        "notes":             "Reconfigurable atom shuffling enables codes that need non-local connectivity. Rydberg-state lifetime drives leakage budget.",
    },
    {
        "name":              "Silicon spin qubit (Diraq / Intel-class)",
        "bias_eta":          2.0,
        "bias_axis":         "Z",
        "p_gate_2q":         0.008,
        "p_gate_1q":         0.001,
        "p_meas":            0.02,
        "p_leakage":         0.0001,
        "connectivity":      "2d-nn",
        "cliffords_native":  True,
        "T1_us":             1_000.0,
        "T2_us":             200.0,
        "T_gate_2q_ns":      100.0,
        "T_meas_us":         5.0,
        "native_2q_gate":    "CZ",
        "qubit_yield":       0.80,
        "notes":             "CMOS-foundry compatible; yield gating scale-up. Charge noise → Z-axis dephasing dominates the bias.",
    },
    {
        "name":              "Fluxonium (Atlantic Quantum-class)",
        "bias_eta":          6.0,
        "bias_axis":         "Z",
        "p_gate_2q":         0.004,
        "p_gate_1q":         0.0003,
        "p_meas":            0.02,
        "p_leakage":         0.0001,
        "connectivity":      "2d-nn",
        "cliffords_native":  True,
        "T1_us":             400.0,
        "T2_us":             300.0,
        "T_gate_2q_ns":      80.0,
        "T_meas_us":         2.0,
        "native_2q_gate":    "CZ",
        "qubit_yield":       0.90,
        "notes":             "Phase-dominated noise makes XZZX a natural fit even at modest bias. Higher T1 than transmon.",
    },
    {
        "name":              "Cat qubit (dual-rail superconducting)",
        "bias_eta":          500.0,
        "bias_axis":         "Z",
        "p_gate_2q":         0.010,
        "p_gate_1q":         0.001,
        "p_meas":            0.005,
        "p_leakage":         0.00001,
        "connectivity":      "2d-nn",
        "cliffords_native":  False,   # X gates are engineered-expensive on purpose
        "T1_us":             500.0,
        "T2_us":             400.0,
        "T_gate_2q_ns":      200.0,
        "T_meas_us":         0.5,
        "native_2q_gate":    "CZ",
        "qubit_yield":       0.85,
        "notes":             "Bias is the design point — bit flips exponentially suppressed by photon-number parity. Z-biased repetition code on top of cat qubits is the typical near-term plan.",
    },
    {
        "name":              "Bosonic GKP code",
        "bias_eta":          50.0,
        "bias_axis":         "Z",
        "p_gate_2q":         0.003,
        "p_gate_1q":         0.0005,
        "p_meas":            0.01,
        "p_leakage":         0.0001,
        "connectivity":      "2d-nn",
        "cliffords_native":  True,
        "T1_us":             600.0,
        "T2_us":             500.0,
        "T_gate_2q_ns":      150.0,
        "T_meas_us":         1.0,
        "native_2q_gate":    "CZ",
        "qubit_yield":       0.80,
        "notes":             "Continuous-variable encoding with structured logical noise. Concatenation with a 2D code on top is the typical plan.",
    },
    {
        "name":              "Early-stage topological (Majorana)",
        "bias_eta":          100.0,
        "bias_axis":         "Z",
        "p_gate_2q":         0.015,
        "p_gate_1q":         0.001,
        "p_meas":            0.005,
        "p_leakage":         0.00001,
        "connectivity":      "2d-nn",
        "cliffords_native":  False,   # braiding gives Cliffords-with-overhead; T-gate is hard
        "T1_us":             1_000.0,
        "T2_us":             800.0,
        "T_gate_2q_ns":      1_000.0,
        "T_meas_us":         10.0,
        "native_2q_gate":    "CZ",
        "qubit_yield":       0.50,
        "notes":             "Strong-bias regime if it scales; yield + real benchmarks still uncertain. Placeholder until measurements land.",
    },
    {
        "name":              "Photonic dual-rail (PsiQuantum-class)",
        "bias_eta":          1.5,
        "bias_axis":         "Z",
        "p_gate_2q":         0.020,
        "p_gate_1q":         0.002,
        "p_meas":            0.005,
        "p_leakage":         0.0,        # loss is heralded — modeled separately
        "connectivity":      "reconfigurable",
        "cliffords_native":  True,
        "T_gate_2q_ns":      1.0,
        "T_meas_us":         0.001,
        "qubit_yield":       0.50,
        "heralded_loss":     True,
        "notes":             "Loss-dominated error model. The Pauli numbers here parameterize an effective channel; heralded_loss=True is the load-bearing field.",
    },
    {
        "name":              "Trapped-ion magic-state factory candidate (high-fidelity)",
        "bias_eta":          2.5,
        "bias_axis":         "Z",
        "p_gate_2q":         0.001,
        "p_gate_1q":         0.00002,
        "p_meas":            0.001,
        "p_leakage":         0.000001,
        "connectivity":      "3-colorable",
        "cliffords_native":  True,
        "T1_us":             1_000_000.0,
        "T2_us":             50_000.0,
        "T_gate_2q_ns":      20_000.0,
        "T_meas_us":         100.0,
        "native_2q_gate":    "MS",
        "qubit_yield":       0.99,
        "notes":             "Hypothetical low-error point in a 3-colorable lattice. Unlocks the color-code branch of the recommender.",
    },
]


def by_name(query: str) -> list[Material]:
    """Case-insensitive substring lookup against qubit names."""
    q = query.lower()
    return [m for m in QUBITS if q in m["name"].lower()]


def by_connectivity(c: str) -> list[Material]:
    return [m for m in QUBITS if m.get("connectivity") == c]


def by_bias(min_eta: float) -> list[Material]:
    return [m for m in QUBITS if m["bias_eta"] >= min_eta]


if __name__ == "__main__":
    # Validate every entry, then run the recommender across the catalogue.
    print("Validation:")
    any_err = False
    for q in QUBITS:
        e, w = validate(q)
        if e:
            any_err = True
            print(f"  ✗ {q['name']}: errors={e}")
        else:
            print(f"  ✓ {q['name']}  (warnings={len(w)})")
    print()
    if any_err:
        raise SystemExit("Schema errors above — fix before using catalogue.")

    print(f"{'QUBIT':<58} {'η':>6} {'p_2q':>8} {'p_meas':>8} {'p_leak':>8}  "
          f"{'CONN':<14} {'CLIFFORDS':<8}  RECOMMENDATION")
    print("-" * 160)
    for q in QUBITS:
        print(
            f"{q['name']:<58} "
            f"{q['bias_eta']:>6.1f} "
            f"{q['p_gate_2q']:>8.4f} "
            f"{q.get('p_meas', float('nan')):>8.4f} "
            f"{q.get('p_leakage', float('nan')):>8.5f}  "
            f"{q.get('connectivity', '?'):<14} "
            f"{('yes' if q.get('cliffords_native') else 'no'):<8}  "
            f"{recommend_code(q)}"
        )

"""
Superconducting qubit deep catalogue.

Per-device entries for specific superconducting qubit chips, with the
superconducting-specific physical parameters — qubit type, junction stack,
substrate, frequency, anharmonicity, EJ/EC ratio, coupling style — that
ride underneath the bias / error numbers in qubit_catalogue.py.

Why a separate file? Most program decisions for a superconducting platform
turn on physical knobs the platform-level catalogue doesn't expose:
anharmonicity drives leakage; EJ/EC drives charge-noise sensitivity;
substrate / junction choice drives TLS (two-level system) density. Capturing
those one layer down means the v3 recommender can derive QEC-relevant
quantities rather than hard-coding them.

Each entry extends qec_schema.Material with SC-specific fields. Numbers are
representative public values reflecting roughly what each named device
reports; replace with measured / quoted specs from the vendor / paper before
any decision that matters; cite sources in the `notes` field.
"""

from typing import Literal, TypedDict

from qec_schema import Material, validate as validate_material
from qec_recommender import recommend_code


QubitType = Literal[
    "transmon",
    "fluxonium",
    "cat",
    "GKP",
    "Xmon",
    "C-shunt-flux",
]

JunctionType = Literal[
    "Al-AlOx-Al",      # canonical aluminum trilayer
    "Nb-AlOx-Nb",      # higher-Tc niobium variant
    "granular-Al",     # disordered superconductor
    "Ta-AlOx-Ta",      # tantalum on silicon
]

Substrate = Literal["silicon", "sapphire", "tantalum-on-silicon", "silicon-on-insulator"]
CouplingType = Literal["capacitive", "inductive", "tunable-coupler", "parametric"]
ResonatorType = Literal["2D-CPW", "3D-cavity", "lumped-element"]


class SuperconductingQubit(Material, total=False):
    # --- SC-specific physical parameters ---
    qubit_type: QubitType
    junction_type: JunctionType
    substrate: Substrate
    frequency_GHz: float           # qubit |0> -> |1> transition
    anharmonicity_MHz: float       # signed: negative for transmon (|1>-|2> below |0>-|1>)
    EJ_GHz: float                  # Josephson energy
    EC_MHz: float                  # charging energy
    EJ_over_EC: float              # the regime-defining ratio
    coupling_type: CouplingType
    resonator_type: ResonatorType
    tunable_frequency: bool        # qubit frequency tunable via flux
    chip_qubit_count: int          # qubits on a single physical chip


# Required SC fields on top of the inherited Material requirements.
SC_REQUIRED = ("qubit_type", "junction_type", "substrate", "frequency_GHz", "anharmonicity_MHz")


def validate_sc(q: dict) -> tuple[list[str], list[str]]:
    """Validate against Material schema + SC-specific required fields."""
    errors, warnings = validate_material(q)
    for f in SC_REQUIRED:
        if f not in q:
            errors.append(f"missing SC-required field: {f!r}")
    # Quick physics sanity checks
    if "EJ_over_EC" in q and q["EJ_over_EC"] < 1:
        warnings.append("EJ/EC < 1 — this is the charge-qubit regime, not a transmon")
    if "anharmonicity_MHz" in q and q["anharmonicity_MHz"] > 0 and q.get("qubit_type") == "transmon":
        warnings.append("transmon anharmonicity is normally negative; check sign convention")
    if "frequency_GHz" in q and not (3 <= q["frequency_GHz"] <= 10):
        warnings.append(f"frequency {q['frequency_GHz']} GHz outside typical 3–10 GHz band")
    return errors, warnings


# ---------------------------------------------------------------------------
# Catalogue — specific named devices.
# ---------------------------------------------------------------------------

DEVICES: list[SuperconductingQubit] = [
    {
        "name":              "IBM Heron R2",
        "bias_eta":          1.5,
        "bias_axis":         "Z",
        "p_gate_2q":         0.005,
        "p_gate_1q":         0.0004,
        "p_meas":            0.015,
        "p_leakage":         0.0001,
        "connectivity":      "heavy-hex",
        "cliffords_native":  True,
        # SC-specific
        "qubit_type":        "transmon",
        "junction_type":     "Al-AlOx-Al",
        "substrate":         "silicon",
        "frequency_GHz":     5.0,
        "anharmonicity_MHz": -340,
        "EJ_GHz":            15.0,
        "EC_MHz":            220.0,
        "EJ_over_EC":        68.0,
        "coupling_type":     "tunable-coupler",
        "resonator_type":    "2D-CPW",
        "tunable_frequency": False,
        "chip_qubit_count":  156,
        "T1_us":             150.0,
        "T2_us":             120.0,
        "notes":             "Fixed-frequency transmons with tunable couplers; heavy-hex chosen partly to suppress crosstalk.",
    },
    {
        "name":              "Google Willow",
        "bias_eta":          1.4,
        "bias_axis":         "Z",
        "p_gate_2q":         0.005,
        "p_gate_1q":         0.0003,
        "p_meas":            0.008,
        "p_leakage":         0.0002,
        "connectivity":      "2d-nn",
        "cliffords_native":  True,
        "qubit_type":        "transmon",
        "junction_type":     "Al-AlOx-Al",
        "substrate":         "silicon",
        "frequency_GHz":     6.0,
        "anharmonicity_MHz": -200,
        "EJ_GHz":            22.0,
        "EC_MHz":            200.0,
        "EJ_over_EC":        110.0,
        "coupling_type":     "tunable-coupler",
        "resonator_type":    "2D-CPW",
        "tunable_frequency": True,
        "chip_qubit_count":  105,
        "T1_us":             100.0,
        "T2_us":             90.0,
        "notes":             "2024 logical-qubit demonstration platform. Tunable transmons + tunable couplers; square lattice.",
    },
    {
        "name":              "Rigetti Ankaa-3",
        "bias_eta":          1.6,
        "bias_axis":         "Z",
        "p_gate_2q":         0.007,
        "p_gate_1q":         0.0005,
        "p_meas":            0.020,
        "p_leakage":         0.0002,
        "connectivity":      "2d-nn",
        "cliffords_native":  True,
        "qubit_type":        "transmon",
        "junction_type":     "Al-AlOx-Al",
        "substrate":         "silicon",
        "frequency_GHz":     5.5,
        "anharmonicity_MHz": -250,
        "EJ_GHz":            18.0,
        "EC_MHz":            230.0,
        "EJ_over_EC":        78.0,
        "coupling_type":     "tunable-coupler",
        "resonator_type":    "2D-CPW",
        "tunable_frequency": True,
        "chip_qubit_count":  82,
        "T1_us":             80.0,
        "T2_us":             50.0,
        "notes":             "Square-grid tunable transmons; fast gate cycle but higher per-gate error than Heron R2.",
    },
    {
        "name":              "IQM Garnet",
        "bias_eta":          1.5,
        "bias_axis":         "Z",
        "p_gate_2q":         0.008,
        "p_gate_1q":         0.0008,
        "p_meas":            0.025,
        "p_leakage":         0.0002,
        "connectivity":      "2d-nn",
        "cliffords_native":  True,
        "qubit_type":        "transmon",
        "junction_type":     "Al-AlOx-Al",
        "substrate":         "silicon",
        "frequency_GHz":     5.0,
        "anharmonicity_MHz": -300,
        "EJ_GHz":            16.0,
        "EC_MHz":            240.0,
        "EJ_over_EC":        67.0,
        "coupling_type":     "tunable-coupler",
        "resonator_type":    "2D-CPW",
        "tunable_frequency": True,
        "chip_qubit_count":  20,
        "T1_us":             60.0,
        "T2_us":             40.0,
        "notes":             "20-qubit commercial platform; square lattice, on-prem deployable.",
    },
    {
        "name":              "Atlantic Quantum Fluxonium prototype",
        "bias_eta":          6.0,
        "bias_axis":         "Z",
        "p_gate_2q":         0.004,
        "p_gate_1q":         0.0003,
        "p_meas":            0.020,
        "p_leakage":         0.0001,
        "connectivity":      "2d-nn",
        "cliffords_native":  True,
        "qubit_type":        "fluxonium",
        "junction_type":     "Al-AlOx-Al",
        "substrate":         "sapphire",
        "frequency_GHz":     0.5,                # fluxonium is intentionally low-frequency
        "anharmonicity_MHz": -1500,              # large by design
        "EJ_GHz":            6.0,
        "EC_MHz":            1100.0,
        "EJ_over_EC":        5.5,                # fluxonium regime, NOT transmon
        "coupling_type":     "inductive",
        "resonator_type":    "2D-CPW",
        "tunable_frequency": False,
        "chip_qubit_count":  8,
        "T1_us":             400.0,
        "T2_us":             300.0,
        "notes":             "Heavy-fluxon design with large anharmonicity → much lower leakage than transmon. Bias-noise regime fits XZZX naturally.",
    },
    {
        "name":              "AWS Ocelot-class cat qubit",
        "bias_eta":          500.0,
        "bias_axis":         "Z",
        "p_gate_2q":         0.010,
        "p_gate_1q":         0.001,
        "p_meas":            0.005,
        "p_leakage":         0.00001,
        "connectivity":      "2d-nn",
        "cliffords_native":  False,                # X gate is engineered-expensive
        "qubit_type":        "cat",
        "junction_type":     "Al-AlOx-Al",
        "substrate":         "tantalum-on-silicon",
        "frequency_GHz":     6.0,
        "anharmonicity_MHz": -200,                 # underlying transmon anharmonicity
        "EJ_GHz":            20.0,
        "EC_MHz":            200.0,
        "EJ_over_EC":        100.0,
        "coupling_type":     "parametric",
        "resonator_type":    "3D-cavity",          # stabilizing cavity holds the cat state
        "tunable_frequency": False,
        "chip_qubit_count":  9,
        "T1_us":             500.0,
        "T2_us":             400.0,
        "notes":             "Two-photon driven storage cavity stabilizes the cat. Bit flips exponentially suppressed by photon-number parity — bias is the design point, not a noise property.",
    },
    {
        "name":              "Yale GKP-on-3D-cavity",
        "bias_eta":          50.0,
        "bias_axis":         "Z",
        "p_gate_2q":         0.003,
        "p_gate_1q":         0.0005,
        "p_meas":            0.010,
        "p_leakage":         0.0001,
        "connectivity":      "2d-nn",
        "cliffords_native":  True,
        "qubit_type":        "GKP",
        "junction_type":     "Al-AlOx-Al",
        "substrate":         "tantalum-on-silicon",
        "frequency_GHz":     6.0,
        "anharmonicity_MHz": -200,
        "EJ_GHz":            20.0,
        "EC_MHz":            200.0,
        "EJ_over_EC":        100.0,
        "coupling_type":     "capacitive",
        "resonator_type":    "3D-cavity",
        "tunable_frequency": False,
        "chip_qubit_count":  4,
        "T1_us":             600.0,
        "T2_us":             500.0,
        "notes":             "Bosonic GKP code in a high-Q 3D cavity, ancilla transmon for stabilization. Concatenation with a 2D code is the typical near-term plan.",
    },
    {
        "name":              "Google Sycamore (2019)",
        "bias_eta":          1.3,
        "bias_axis":         "Z",
        "p_gate_2q":         0.006,
        "p_gate_1q":         0.0005,
        "p_meas":            0.038,
        "p_leakage":         0.001,
        "connectivity":      "2d-nn",
        "cliffords_native":  True,
        "qubit_type":        "Xmon",
        "junction_type":     "Al-AlOx-Al",
        "substrate":         "silicon",
        "frequency_GHz":     6.5,
        "anharmonicity_MHz": -210,
        "EJ_GHz":            17.0,
        "EC_MHz":            215.0,
        "EJ_over_EC":        79.0,
        "coupling_type":     "tunable-coupler",
        "resonator_type":    "2D-CPW",
        "tunable_frequency": True,
        "chip_qubit_count":  53,
        "T1_us":             15.0,
        "T2_us":             10.0,
        "notes":             "Historical reference — the 2019 quantum-supremacy chip. Useful as a baseline showing where the field was before the recent jump in T1 / measurement fidelity.",
    },
]


def by_type(t: QubitType) -> list[SuperconductingQubit]:
    return [d for d in DEVICES if d.get("qubit_type") == t]


def by_substrate(s: Substrate) -> list[SuperconductingQubit]:
    return [d for d in DEVICES if d.get("substrate") == s]


def fluxonium_family() -> list[SuperconductingQubit]:
    return by_type("fluxonium")


def bosonic_family() -> list[SuperconductingQubit]:
    return [d for d in DEVICES if d.get("qubit_type") in ("cat", "GKP")]


if __name__ == "__main__":
    print("Validation:")
    any_err = False
    for d in DEVICES:
        e, w = validate_sc(d)
        if e:
            any_err = True
            print(f"  ✗ {d['name']}: errors={e}")
        else:
            tag = f"warnings={len(w)}" if w else "clean"
            print(f"  ✓ {d['name']}  ({tag})")
    print()
    if any_err:
        raise SystemExit("Schema errors above.")

    print(f"{'DEVICE':<42} {'TYPE':<11} {'FREQ':>6} {'ANHARM':>8} "
          f"{'EJ/EC':>7} {'T1 us':>7}  RECOMMENDATION")
    print("-" * 130)
    for d in DEVICES:
        print(
            f"{d['name']:<42} "
            f"{d['qubit_type']:<11} "
            f"{d['frequency_GHz']:>5.2f}G "
            f"{d['anharmonicity_MHz']:>+7.0f} "
            f"{d.get('EJ_over_EC', float('nan')):>7.1f} "
            f"{d.get('T1_us', float('nan')):>7.0f}  "
            f"{recommend_code(d)}"
        )

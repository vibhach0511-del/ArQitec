"""
Materials Properties Library — organized by material.

Each material is described in a SINGLE section that contains all its
roles (film, junction, cap, dielectric, etc.) and its full 7-tier
characterization.

The 7 characterization tiers:
  Tier 1: Coherence (T1, T2, T_phi, T2_echo)
  Tier 2: Noise channel decomposition (bias, Pauli rates, leakage, seepage)
  Tier 3: Spatial/temporal correlations (cosmic rays, crosstalk, 1/f, TLS)
  Tier 4: Gate-specific properties (fidelities, gate times, anharmonicity)
  Tier 5: Measurement properties (readout fidelity, QND-ness)
  Tier 6: Architectural / connectivity
  Tier 7: Yield and variation

Confidence levels:
  - "measured": directly published in cited paper(s)
  - "estimated": inferred from similar materials or composition rules
  - "speculative": research-stage, numbers are educated guesses
  - "not_applicable": property doesn't apply to this material type

Structure:
  Each MATERIAL_SECTION is a dict mapping role -> MaterialProperties.
  Example: TANTALUM["alpha_phase_film"] gives properties when used as α-Ta film.
"""

from dataclasses import dataclass, field
from typing import Optional


# ============================================================
# PROPERTY SCHEMA — used for every role of every material
# ============================================================

@dataclass
class MaterialProperties:
    """7-tier property profile for any material in any role."""

    # --- Identification ---
    display_name: str
    role: str                           # "substrate" | "film" | "junction" | etc.
    confidence: str                     # "measured" | "estimated" | "speculative"
    references: list[str] = field(default_factory=list)

    # Tier 1: Coherence
    T1_us: Optional[float] = None
    T2_echo_us: Optional[float] = None
    T2_ramsey_us: Optional[float] = None
    T_phi_us: Optional[float] = None

    # Tier 2: Noise channels
    bias_eta: Optional[float] = None
    p_X_idle_per_us: Optional[float] = None
    p_Z_idle_per_us: Optional[float] = None
    p_leakage_per_gate: Optional[float] = None
    p_seepage_per_cycle: Optional[float] = None

    # Tier 3: Correlations
    cosmic_ray_rate_per_qubit_hr: Optional[float] = None
    ZZ_crosstalk_kHz: Optional[float] = None
    one_over_f_noise_amplitude: Optional[float] = None
    TLS_density_per_GHz: Optional[float] = None
    non_markovian: Optional[bool] = None

    # Tier 4: Gates
    gate_1q_fidelity: Optional[float] = None
    gate_2q_fidelity: Optional[float] = None
    gate_1q_time_ns: Optional[float] = None
    gate_2q_time_ns: Optional[float] = None
    anharmonicity_MHz: Optional[float] = None
    charge_dispersion_kHz: Optional[float] = None

    # Tier 5: Measurement
    readout_fidelity: Optional[float] = None
    measurement_time_ns: Optional[float] = None
    p_meas_induced_leakage: Optional[float] = None
    qnd_fidelity: Optional[float] = None

    # Tier 6: Architecture
    typical_connectivity: Optional[str] = None
    max_qubits_demonstrated: Optional[int] = None
    frequency_crowding_MHz: Optional[float] = None

    # Tier 7: Yield
    yield_pct: Optional[float] = None
    parameter_variation_pct: Optional[float] = None
    drift_rate_per_hour: Optional[float] = None

    notes: str = ""


# ============================================================
#                     ALUMINUM (Al)
# ============================================================
# Foundational at multiple levels:
#  - Universal Josephson junction material (Al-AlOx-Al)
#  - First-class transmon capacitor film
#  - 3D microwave cavity gold standard (6N purity)
#  - Standard cap and bond-wire material
# ============================================================

ALUMINUM = {
    "as_film": MaterialProperties(
        display_name="Aluminum film",
        role="film",
        confidence="measured",
        T1_us=270,
        T2_echo_us=200,
        T_phi_us=450,
        bias_eta=3,
        p_X_idle_per_us=3.7e-3,
        p_Z_idle_per_us=2.2e-3,
        p_leakage_per_gate=1e-4,
        p_seepage_per_cycle=1e-5,
        ZZ_crosstalk_kHz=60,
        one_over_f_noise_amplitude=2e-6,
        non_markovian=True,
        gate_1q_fidelity=0.9999,
        gate_2q_fidelity=0.995,
        gate_1q_time_ns=25,
        gate_2q_time_ns=200,
        anharmonicity_MHz=-220,
        readout_fidelity=0.99,
        measurement_time_ns=500,
        yield_pct=75,
        parameter_variation_pct=30,
        drift_rate_per_hour=0.5,
        notes=(
            "Aluminum is foundational to superconducting qubits at multiple levels. "
            "Modern Al-on-Si transmons reach T1=270μs time-averaged, 501μs max (Biznárová 2024). "
            "Aalto 2025 millisecond-coherence transmon achieved T1 median 502μs, T2_echo max 1057μs "
            "at 2.9 GHz. Aluminum's low Tc=1.2K makes it more cosmic-ray sensitive than higher-Tc "
            "materials, but it remains a first-class qubit material."
        ),
        references=[
            "Biznárová et al. 2024, npj QI 10:78 (Al-on-Si T1=270μs avg, 501μs max)",
            "Tuokkola et al. 2025, Nat Commun 16:5421 (Aalto millisecond transmon)",
            "Koch et al. 2007, PRA 76:042319 (transmon proposal — Al-based)",
        ],
    ),
    "as_junction_electrode": MaterialProperties(
        display_name="Al-AlOx-Al Josephson junction (universal)",
        role="junction",
        confidence="measured",
        charge_dispersion_kHz=0.01,
        p_leakage_per_gate=1e-4,
        yield_pct=85,
        parameter_variation_pct=30,
        notes=(
            "The Al-AlOx-Al Josephson junction is the foundation of essentially every modern "
            "superconducting qubit, regardless of capacitor material (Ta, Nb, Al, TiN). "
            "Aluminum is evaporated, briefly oxidized to form a ~1-2 nm AlOx tunnel barrier, "
            "then a second aluminum layer is deposited. The universal junction standard."
        ),
        references=["Koch et al. 2007, PRA 76:042319", "Universal across the field"],
    ),
    "as_high_purity_cavity": MaterialProperties(
        display_name="Aluminum 6N high-purity 3D cavity",
        role="cavity",
        confidence="measured",
        T1_us=1000,
        T2_echo_us=800,
        bias_eta=50,
        gate_2q_fidelity=0.99,
        anharmonicity_MHz=-200,
        notes=(
            "Six-nines purity aluminum is the gold standard for 3D microwave cavities used in "
            "cat qubits, dual-rail encodings, and bosonic quantum memories. Machined high-purity "
            "Al cavities routinely achieve T1 in the millisecond range."
        ),
        references=[
            "Reagor et al. 2013, APL 102:192604",
            "Ofek et al. 2016, Nature 536:441 (cat qubit in 3D Al cavity)",
        ],
    ),
    "as_5n_cavity": MaterialProperties(
        display_name="Aluminum 5N purity 3D cavity",
        role="cavity",
        confidence="measured",
        T1_us=1000,
        bias_eta=100,
        notes="Standard machined Al 3D cavity (5-nines purity).",
    ),
    "as_coaxial_post_cavity": MaterialProperties(
        display_name="Coaxial post Al cavity",
        role="cavity",
        confidence="estimated",
        T1_us=1500,
        bias_eta=150,
    ),
    "as_stripline_cavity": MaterialProperties(
        display_name="Stripline Al cavity",
        role="cavity",
        confidence="estimated",
        T1_us=800,
        bias_eta=80,
    ),
    "as_capping": MaterialProperties(
        display_name="Aluminum cap",
        role="capping",
        confidence="estimated",
        notes="Self-cap for Al films — forms native AlOx. Also a cap option on Nb.",
        references=["Bal et al. 2024, npj QI 10:43"],
    ),
    "as_bond_wire": MaterialProperties(
        display_name="Aluminum bond wire",
        role="wiring",
        confidence="measured",
        notes="Superconducting at base temperature. Preferred over Au for qubit wirebonding.",
    ),
    "as_jj_array_superinductor": MaterialProperties(
        display_name="Aluminum Josephson junction array (superinductor)",
        role="superinductor",
        confidence="measured",
        T1_us=150,
        bias_eta=12,
        notes=(
            "Series of small Al-AlOx-Al JJs acts as superinductor. Original fluxonium design "
            "(Manucharyan 2009). Somoroff 2023 millisecond fluxonium uses this."
        ),
        references=[
            "Manucharyan et al. 2009, Science 326:113",
            "Somoroff et al. 2023, PRL 130:267001",
        ],
    ),
}


# ============================================================
#                     TANTALUM (Ta)
# ============================================================
# Two crystal phases with radically different qubit performance.
# Modern leading-edge transmon film material. Tc=4.5 K.
# ============================================================

TANTALUM = {
    "alpha_phase_film": MaterialProperties(
        display_name="α-Tantalum film (bcc phase)",
        role="film",
        confidence="measured",
        T1_us=230,
        T2_echo_us=249,
        T_phi_us=540,
        bias_eta=4,
        p_X_idle_per_us=2.2e-3,
        p_Z_idle_per_us=1.9e-3,
        p_leakage_per_gate=1e-4,
        p_seepage_per_cycle=1e-5,
        ZZ_crosstalk_kHz=50,
        one_over_f_noise_amplitude=1e-6,
        non_markovian=True,
        gate_1q_fidelity=0.9999,
        gate_2q_fidelity=0.995,
        gate_1q_time_ns=20,
        gate_2q_time_ns=200,
        anharmonicity_MHz=-220,
        readout_fidelity=0.99,
        measurement_time_ns=500,
        yield_pct=70,
        parameter_variation_pct=30,
        notes=(
            "The 2021 Ta breakthrough material. Place 2021 reported avg T1=230μs (range 150-300μs), "
            "T2_echo=249μs. Subsequent optimization (Ganjam 2024, Crisa 2025) pushed memory T1 to "
            ">1ms and best transmon T1 to 1.68ms on silicon. Requires heated substrate growth."
        ),
        references=[
            "Place et al. 2021, Nat Commun 12:1779",
            "Wang et al. 2022, npj QI 8:3 (T1 up to 503μs with dry etch)",
            "Ganjam et al. 2024, Nat Commun 15:3687 (stripline memory T1>1ms)",
            "Crisa et al. 2025, arXiv:2503.14798 (Ta on Si, T1 up to 1.68ms)",
        ],
    ),
    "beta_phase_film": MaterialProperties(
        display_name="β-Tantalum film (tetragonal, wrong phase)",
        role="film",
        confidence="measured",
        T1_us=5,
        T2_echo_us=3,
        bias_eta=2,
        p_leakage_per_gate=5e-3,
        gate_2q_fidelity=0.92,
        readout_fidelity=0.85,
        yield_pct=30,
        notes=(
            "The 'wrong' Ta phase from room-temp deposition. Tc ~0.5 K vs ~4.4 K for α-Ta. "
            "Disastrous for qubits. Useful as a teaching example that crystal phase matters."
        ),
    ),
    "as_capping": MaterialProperties(
        display_name="Tantalum cap on Nb",
        role="capping",
        confidence="measured",
        T1_us=300,
        notes=(
            "Bal 2024 standout result: median T1=300μs, max~600μs. Ta2O5 native oxide is less "
            "lossy than Nb's NbOx. Highest published T1 for Nb-based transmons."
        ),
        references=["Bal et al. 2024, npj QI 10:43"],
    ),
    "as_stripline_cavity": MaterialProperties(
        display_name="Stripline Ta cavity (Ganjam 2024)",
        role="cavity",
        confidence="measured",
        T1_us=1000,
        T2_echo_us=2000,
        bias_eta=100,
        notes="Ganjam 2024: T1=1-1.4 ms Fock decay, T2 approaches 2T1, Tϕ > 24 ms.",
        references=["Ganjam et al. 2024, Nat Commun 15:3687"],
    ),
    "as_native_oxide": MaterialProperties(
        display_name="Native tantalum oxide (Ta2O5)",
        role="dielectric",
        confidence="measured",
        notes="Well-behaved Ta2O5 native surface oxide — key reason Ta outperforms Nb.",
    ),
    "amorphous_film": MaterialProperties(
        display_name="Amorphous tantalum film",
        role="film",
        confidence="speculative",
        T1_us=20,
        T2_echo_us=15,
        bias_eta=2,
        notes="Disordered Ta film, intermediate performance.",
    ),
    "nitride_film": MaterialProperties(
        display_name="Tantalum nitride film",
        role="film",
        confidence="speculative",
        T1_us=50,
        T2_echo_us=40,
        bias_eta=3,
        notes="Higher Tc than pure Ta, less explored for qubits.",
    ),
}


# ============================================================
#                     NIOBIUM (Nb)
# ============================================================
# 2010s workhorse. Limited by lossy native oxide. High Tc (9.2K)
# makes it ideal for feedlines and readout resonators.
# ============================================================

NIOBIUM = {
    "as_film": MaterialProperties(
        display_name="Niobium film",
        role="film",
        confidence="measured",
        T1_us=50,
        T2_echo_us=40,
        T_phi_us=100,
        bias_eta=3,
        p_X_idle_per_us=1e-2,
        p_Z_idle_per_us=1e-2,
        p_leakage_per_gate=3e-4,
        p_seepage_per_cycle=3e-5,
        ZZ_crosstalk_kHz=80,
        one_over_f_noise_amplitude=3e-6,
        non_markovian=True,
        gate_1q_fidelity=0.9995,
        gate_2q_fidelity=0.99,
        gate_1q_time_ns=30,
        gate_2q_time_ns=250,
        anharmonicity_MHz=-200,
        readout_fidelity=0.97,
        yield_pct=60,
        parameter_variation_pct=40,
        notes=(
            "2010s workhorse (Tc=9.2 K). Limited by lossy native NbOx surface oxide. "
            "Capping with Ta/Al/TiN gives 2-5x T1 improvement (Bal 2024). Also widely used for "
            "feedlines, couplers, and readout resonators."
        ),
        references=["Bal et al. 2024, npj QI 10:43 (baseline T1~50μs)"],
    ),
    "as_capping": MaterialProperties(
        display_name="Niobium cap",
        role="capping",
        confidence="estimated",
        notes="Sometimes used as cap on Al-based stacks.",
    ),
    "as_bulk_cavity": MaterialProperties(
        display_name="Bulk niobium 3D cavity",
        role="cavity",
        confidence="measured",
        T1_us=3000,
        bias_eta=300,
        notes="Higher Q than Al. Standard for SRF accelerator-style cavities in cat qubit research.",
    ),
    "as_electropolished_cavity": MaterialProperties(
        display_name="Electropolished Nb cavity",
        role="cavity",
        confidence="measured",
        T1_us=4000,
        bias_eta=400,
        notes="Surface treatment to remove damaged layer.",
    ),
    "as_bcp_cavity": MaterialProperties(
        display_name="Buffer chemical polished Nb cavity",
        role="cavity",
        confidence="estimated",
        T1_us=3500,
        bias_eta=350,
    ),
    "as_high_purity_cavity": MaterialProperties(
        display_name="High-purity Nb cavity",
        role="cavity",
        confidence="measured",
        T1_us=5000,
        bias_eta=500,
        notes="State-of-the-art for cat qubit storage modes.",
    ),
    "as_coaxial_post_cavity": MaterialProperties(
        display_name="Coaxial post Nb cavity",
        role="cavity",
        confidence="estimated",
        T1_us=3000,
        bias_eta=300,
    ),
    "native_oxide": MaterialProperties(
        display_name="Native niobium oxide (NbOx)",
        role="dielectric",
        confidence="measured",
        notes="Multi-layer Nb2O5/NbO/NbO2. Main loss source in Nb qubits.",
        references=["Bal et al. 2024, npj QI 10:43"],
    ),
    "as_junction_electrode": MaterialProperties(
        display_name="Nb-AlOx-Nb / Nb trilayer junction",
        role="junction",
        confidence="estimated",
        charge_dispersion_kHz=0.02,
        p_leakage_per_gate=3e-4,
        yield_pct=85,
        notes="Nb-based junctions used in digital SC logic and some early qubits.",
    ),
    "as_jj_array_superinductor": MaterialProperties(
        display_name="Niobium Josephson junction array",
        role="superinductor",
        confidence="estimated",
        T1_us=100,
        bias_eta=10,
    ),
    "as_tsv": MaterialProperties(
        display_name="Superconducting Nb through-silicon via",
        role="wiring",
        confidence="speculative",
        notes="Nb-filled TSV. Research stage. Critical for chiplet stacking.",
    ),
}


# ============================================================
#                     RHENIUM (Re)
# ============================================================
# Tc=1.7 K. Low microwave loss, good adhesion to sapphire.
# ============================================================

RHENIUM = {
    "as_film": MaterialProperties(
        display_name="Rhenium film",
        role="film",
        confidence="speculative",
        T1_us=100,
        bias_eta=3,
        notes=(
            "Active research as Ta-alternative with similar oxide chemistry (Tc=1.7 K). "
            "Low microwave loss and excellent adhesion to sapphire. Limited qubit-grade "
            "coherence data published."
        ),
    ),
}


# ============================================================
#                     VANADIUM (V)
# ============================================================
# Tc=5.4 K. Explored for kinetic inductance devices.
# ============================================================

VANADIUM = {
    "as_film": MaterialProperties(
        display_name="Vanadium film",
        role="film",
        confidence="speculative",
        T1_us=30,
        bias_eta=2,
        notes="Tc=5.4 K. Explored for kinetic inductance devices.",
    ),
    "as_nitride_film": MaterialProperties(
        display_name="Vanadium nitride film",
        role="film",
        confidence="speculative",
        T1_us=40,
        bias_eta=2,
    ),
}


# ============================================================
#                     INDIUM (In)
# ============================================================
# Tc=3.4 K. Primarily used for flip-chip bump bonds.
# ============================================================

INDIUM = {
    "as_film": MaterialProperties(
        display_name="Indium film",
        role="film",
        confidence="speculative",
        T1_us=30,
        bias_eta=2,
        notes="Soft superconductor, rarely used as qubit electrode.",
    ),
    "as_bump_bond": MaterialProperties(
        display_name="Indium bump bond",
        role="wiring",
        confidence="measured",
        notes=(
            "Standard for flip-chip 2D qubit module assembly. Soft superconductor enables "
            "cold-weld bonding between chiplets."
        ),
    ),
    "as_disordered_oxide": MaterialProperties(
        display_name="Disordered indium oxide film",
        role="film",
        confidence="speculative",
        T1_us=80,
        bias_eta=10,
        notes="Used in superinductor experiments.",
    ),
    "as_oxide_superinductor": MaterialProperties(
        display_name="InOx high-KI superinductor",
        role="superinductor",
        confidence="speculative",
        T1_us=80,
        bias_eta=10,
    ),
}


# ============================================================
#                     LEAD (Pb)
# ============================================================
# Tc=7.2 K. Used in early transmon experiments; complex surface oxides.
# ============================================================

LEAD = {
    "as_film": MaterialProperties(
        display_name="Lead film",
        role="film",
        confidence="speculative",
        T1_us=10,
        bias_eta=2,
        notes="Early transmon experiments; poor coherence due to complex surface oxides.",
    ),
    "as_junction_electrode": MaterialProperties(
        display_name="Pb-PbOx-Pb junction",
        role="junction",
        confidence="not_applicable",
        notes="Historical (1960s-70s). Not used in modern qubits.",
    ),
}


# ============================================================
#                     TIN (Sn)
# ============================================================
# Tc=3.7 K. Recent research as alternative junction superconductor.
# ============================================================

TIN = {
    "as_film": MaterialProperties(
        display_name="Tin film",
        role="film",
        confidence="speculative",
        T1_us=20,
        bias_eta=2,
        notes=(
            "Tc=3.7 K. Recent research (2025) explored β-Sn shells on InAs nanowires as "
            "alternative to Al for hybrid transmon junctions. Gate-tunable qubit frequency "
            "over 3 GHz range demonstrated."
        ),
        references=["Sn-junction transmon, arXiv:2508.04007 (2025)"],
    ),
    "as_telluride_film": MaterialProperties(
        display_name="Tin telluride film",
        role="film",
        confidence="speculative",
        T1_us=20,
        bias_eta=2,
        notes="Topological semimetal, research stage.",
    ),
}


# ============================================================
#                  NIOBIUM NITRIDE (NbN)
# ============================================================
# Tc~16 K. High kinetic inductance — KI qubits and parametric amps.
# ============================================================

NIOBIUM_NITRIDE = {
    "as_film": MaterialProperties(
        display_name="Niobium nitride film",
        role="film",
        confidence="measured",
        T1_us=30,
        T2_echo_us=20,
        bias_eta=2,
        p_leakage_per_gate=5e-4,
        gate_2q_fidelity=0.98,
        anharmonicity_MHz=-200,
        notes="Tc~16 K. High kinetic inductance enables KI qubits and parametric amplifiers.",
    ),
    "as_disordered_film": MaterialProperties(
        display_name="Disordered NbN (high KI)",
        role="film",
        confidence="estimated",
        T1_us=100,
        bias_eta=8,
        notes="Used in KI-based superinductors and detectors.",
    ),
    "as_reactive_sputtered": MaterialProperties(
        display_name="NbN (reactive sputtered)",
        role="film",
        confidence="estimated",
        T1_us=30,
        T2_echo_us=20,
        bias_eta=2,
        notes="Process variant of NbN.",
    ),
    "as_superinductor": MaterialProperties(
        display_name="High kinetic inductance NbN",
        role="superinductor",
        confidence="estimated",
        T1_us=100,
        bias_eta=10,
        notes="Alternative to grAl for fluxonium superinductors.",
    ),
    "as_nanowire_inductor": MaterialProperties(
        display_name="NbN nanowire inductor",
        role="superinductor",
        confidence="estimated",
        T1_us=80,
        bias_eta=8,
    ),
    "as_junction_electrode": MaterialProperties(
        display_name="NbN-AlN-NbN trilayer junction",
        role="junction",
        confidence="estimated",
        charge_dispersion_kHz=0.03,
        yield_pct=80,
        notes="All-nitride junctions, higher Tc than Al-AlOx-Al.",
    ),
    "as_kinetic_bridge": MaterialProperties(
        display_name="NbN kinetic inductance bridge",
        role="junction",
        confidence="estimated",
        notes="Kinetic-inductance bridge alternative to true JJ.",
    ),
}


# ============================================================
#               NIOBIUM TITANIUM NITRIDE (NbTiN)
# ============================================================
# Tc~15 K. Very high KI; extremely low microwave loss.
# ============================================================

NIOBIUM_TITANIUM_NITRIDE = {
    "as_film": MaterialProperties(
        display_name="Niobium titanium nitride film",
        role="film",
        confidence="estimated",
        T1_us=40,
        T2_echo_us=30,
        bias_eta=2,
        notes="Tc~15 K. Lower loss variant of NbN. Used in resonators and KI qubits.",
    ),
    "as_superinductor": MaterialProperties(
        display_name="NbTiN superinductor",
        role="superinductor",
        confidence="estimated",
        T1_us=120,
        bias_eta=10,
    ),
    "as_nanowire_inductor": MaterialProperties(
        display_name="NbTiN nanowire inductor",
        role="superinductor",
        confidence="estimated",
        T1_us=100,
        bias_eta=8,
    ),
}


# ============================================================
#                  TITANIUM NITRIDE (TiN)
# ============================================================
# Tc~5 K (tunable via N stoichiometry). NIST/Caltech KI workhorse.
# ============================================================

TITANIUM_NITRIDE = {
    "as_film": MaterialProperties(
        display_name="Titanium nitride film",
        role="film",
        confidence="measured",
        T1_us=150,
        T2_echo_us=100,
        bias_eta=4,
        p_leakage_per_gate=2e-4,
        gate_2q_fidelity=0.992,
        anharmonicity_MHz=-200,
        notes=(
            "Tc tunable via N stoichiometry. Used for resonators and fluxonium-style designs. "
            "NIST and Caltech workhorse for KI qubits."
        ),
        references=[
            "Vissers et al. 2010, APL 97:232509",
            "Chang et al. 2013 (TiN-shunt transmon, T1~60μs)",
        ],
    ),
    "as_disordered_film": MaterialProperties(
        display_name="Disordered TiN (high KI)",
        role="film",
        confidence="estimated",
        T1_us=100,
        bias_eta=6,
    ),
    "as_capping": MaterialProperties(
        display_name="Titanium nitride cap",
        role="capping",
        confidence="speculative",
        notes="Used as cap on Nb in Bal 2024 — moderately effective.",
    ),
    "as_superinductor": MaterialProperties(
        display_name="High kinetic inductance TiN",
        role="superinductor",
        confidence="measured",
        T1_us=150,
        bias_eta=8,
    ),
}


# ============================================================
#               MOLYBDENUM RHENIUM (MoRe)
# ============================================================
# Tc~9 K. Amorphous SC; very low TLS noise.
# ============================================================

MOLYBDENUM_RHENIUM = {
    "as_film": MaterialProperties(
        display_name="Molybdenum-rhenium film",
        role="film",
        confidence="speculative",
        T1_us=50,
        bias_eta=2,
        notes=(
            "Amorphous SC with low TLS density (Tc~9 K). Promising for fluxonium and transmon "
            "stacks where avoiding grain boundaries matters."
        ),
    ),
}


# ============================================================
#               NIOBIUM SILICIDE (NbSi) — NEW
# ============================================================
# Tc~3 K. Amorphous; high sheet inductance for KI devices.
# ============================================================

NIOBIUM_SILICIDE = {
    "as_film": MaterialProperties(
        display_name="Niobium silicide film",
        role="film",
        confidence="speculative",
        T1_us=30,
        bias_eta=5,
        notes=(
            "Amorphous compound SC (Tc~3 K) with high sheet inductance. Used for kinetic "
            "inductance devices and superinductor strips. Limited qubit-grade coherence data."
        ),
    ),
    "as_superinductor": MaterialProperties(
        display_name="NbSi superinductor strip",
        role="superinductor",
        confidence="speculative",
        T1_us=80,
        bias_eta=10,
        notes="Amorphous compound with high kinetic inductance for fluxonium-class designs.",
    ),
}


# ============================================================
#                MAGNESIUM DIBORIDE (MgB2)
# ============================================================
# Tc~39 K. Two-gap superconductor. Research-stage.
# ============================================================

MAGNESIUM_DIBORIDE = {
    "as_film": MaterialProperties(
        display_name="Magnesium diboride film",
        role="film",
        confidence="speculative",
        T1_us=20,
        bias_eta=2,
        notes="Two-gap SC (Tc~39 K). High-Tc research for 2D qubit platforms.",
    ),
}


# ============================================================
#               VANADIUM SILICIDE (V3Si) — NEW
# ============================================================
# Tc~17 K. A15 structure; high critical field research.
# ============================================================

VANADIUM_SILICIDE = {
    "as_film": MaterialProperties(
        display_name="Vanadium silicide (V3Si) film",
        role="film",
        confidence="speculative",
        T1_us=20,
        bias_eta=2,
        notes=(
            "A15 crystal structure (Tc~17 K). Researched for high critical field resonators. "
            "No published qubit-grade T1/T2 data."
        ),
    ),
}


# ============================================================
#               NIOBIUM ALUMINIDE (NbAl, Nb3Al) — NEW
# ============================================================
# Tc~18 K. A15 structure; high critical field applications.
# ============================================================

NIOBIUM_ALUMINIDE = {
    "as_film": MaterialProperties(
        display_name="Niobium aluminide (Nb3Al) film",
        role="film",
        confidence="speculative",
        T1_us=20,
        bias_eta=2,
        notes=(
            "A15 crystal structure (Tc~18 K). High critical field applications and research-stage "
            "resonators. No published qubit-grade T1/T2 data."
        ),
    ),
}


# ============================================================
#                  GRANULAR ALUMINUM (grAl)
# ============================================================
# Self-assembled JJ network — fluxonium superinductor.
# ============================================================

GRANULAR_ALUMINUM = {
    "as_film": MaterialProperties(
        display_name="Granular aluminum (grAl) film",
        role="film",
        confidence="measured",
        T1_us=23,
        T2_echo_us=46,
        T2_ramsey_us=30,
        T_phi_us=92,
        bias_eta=15,
        p_X_idle_per_us=4.3e-2,
        p_Z_idle_per_us=1.1e-2,
        p_leakage_per_gate=5e-5,
        anharmonicity_MHz=-3000,
        notes=(
            "Disordered Al with AlOx grain boundaries — self-assembled JJ network. Grünhaupt "
            "2018-2019 measured T1=23±4μs over 17h. NOTE: 'millisecond fluxonium' (Somoroff 2023) "
            "uses Al-AlOx-Al JJ arrays, NOT grAl."
        ),
        references=["Grünhaupt et al. 2018-2019, Nat Mater 18:816"],
    ),
    "as_superinductor_high_R": MaterialProperties(
        display_name="High-resistivity granular Al superinductor",
        role="superinductor",
        confidence="measured",
        T1_us=200,
        bias_eta=15,
        anharmonicity_MHz=-3000,
        notes="Standard fluxonium superinductor material.",
    ),
    "as_superinductor_low_R": MaterialProperties(
        display_name="Low-resistivity granular Al",
        role="superinductor",
        confidence="estimated",
        T1_us=150,
        bias_eta=8,
    ),
    "as_bridge": MaterialProperties(
        display_name="Granular aluminum bridge (gralmonium)",
        role="junction",
        confidence="estimated",
        notes="Single-layer grAl nanoconstriction as Josephson element.",
        references=["Rieger et al. 2022, Nat Mater 22:768"],
    ),
}


# ============================================================
#       ALUMINUM-INAS HYBRID (gatemon / topological-adjacent)
# ============================================================

ALUMINUM_ON_INAS = {
    "as_film_2deg": MaterialProperties(
        display_name="Aluminum on InAs 2DEG",
        role="film",
        confidence="measured",
        T1_us=10,
        T2_echo_us=5,
        bias_eta=2,
        gate_2q_fidelity=0.95,
        notes="Hybrid SC-semiconductor stack. Gatemon and topological qubit base.",
    ),
    "as_epitaxial_film": MaterialProperties(
        display_name="Epitaxial Al on InAs",
        role="film",
        confidence="measured",
        T1_us=15,
        T2_echo_us=8,
        bias_eta=2,
        notes="High-quality InAs/Al interface for topological research.",
    ),
    "as_nanowire_junction": MaterialProperties(
        display_name="InAs/Al nanowire junction (gatemon)",
        role="junction",
        confidence="measured",
        charge_dispersion_kHz=10,
        p_leakage_per_gate=3e-4,
        yield_pct=20,
        parameter_variation_pct=60,
        notes=(
            "SC-semiconductor hybrid. Voltage-tunable instead of flux-tunable. Microsoft "
            "topological-adjacent. Bottleneck: nanowire growth yield."
        ),
        references=["Larsen et al. 2015, PRL 115:127001"],
    ),
    "as_majorana_junction": MaterialProperties(
        display_name="InAs-Al Majorana junction",
        role="junction",
        confidence="speculative",
        charge_dispersion_kHz=15,
        yield_pct=5,
        notes="Topological qubit primitive. Microsoft program. Existence contested.",
    ),
}


# ============================================================
#               ALUMINUM OXIDE (AlOx)
# ============================================================
# Industry-standard tunnel barrier.
# Multiple geometry variants share this chemistry.
# ============================================================

ALUMINUM_OXIDE = {
    "as_native_oxide": MaterialProperties(
        display_name="Native aluminum oxide (AlOx)",
        role="dielectric",
        confidence="measured",
        notes=(
            "Forms on Al exposure to controlled oxygen, ~1-2nm thick. Universal tunnel barrier "
            "of superconducting qubits. Also a dominant TLS source."
        ),
    ),
    "as_junction_dolan": MaterialProperties(
        display_name="Al-AlOx-Al Dolan bridge junction",
        role="junction",
        confidence="measured",
        charge_dispersion_kHz=0.01,
        p_leakage_per_gate=1e-4,
        yield_pct=85,
        parameter_variation_pct=30,
        notes="Free-hanging bridge double-angle evap. Bridge can collapse.",
    ),
    "as_junction_manhattan": MaterialProperties(
        display_name="Al-AlOx-Al Manhattan junction",
        role="junction",
        confidence="measured",
        charge_dispersion_kHz=0.008,
        p_leakage_per_gate=8e-5,
        yield_pct=92,
        parameter_variation_pct=20,
        notes="Two perpendicular wires meet at oxidation point. More uniform than Dolan.",
    ),
    "as_junction_bandage": MaterialProperties(
        display_name="Al-AlOx-Al bandage junction",
        role="junction",
        confidence="estimated",
        charge_dispersion_kHz=0.012,
        yield_pct=88,
        notes="Extra Al patch bridges native oxide between fab steps.",
    ),
    "as_junction_merged": MaterialProperties(
        display_name="Al-AlOx-Al merged-element junction",
        role="junction",
        confidence="measured",
        charge_dispersion_kHz=0.005,
        p_leakage_per_gate=5e-5,
        yield_pct=80,
        parameter_variation_pct=15,
        notes="Junction integrated into capacitor. Reduces dielectric loss.",
    ),
    "as_junction_overlap": MaterialProperties(
        display_name="Al-AlOx-Al overlap junction",
        role="junction",
        confidence="estimated",
        charge_dispersion_kHz=0.01,
        yield_pct=85,
        notes="Two Al pads overlapping with oxide between.",
    ),
    "as_junction_shadow": MaterialProperties(
        display_name="Al-AlOx-Al shadow-evaporated junction",
        role="junction",
        confidence="measured",
        charge_dispersion_kHz=0.01,
        yield_pct=88,
        notes="Catch-all for double-angle shadow techniques.",
    ),
    "as_junction_double_oxidation": MaterialProperties(
        display_name="Al-AlOx-Al double oxidation",
        role="junction",
        confidence="estimated",
        charge_dispersion_kHz=0.008,
        yield_pct=82,
        notes="Two-step oxidation for better barrier uniformity.",
    ),
    "as_cap_controlled": MaterialProperties(
        display_name="AlOx cap (controlled thickness)",
        role="capping",
        confidence="estimated",
        notes="Controlled-thickness AlOx vs native — better uniformity.",
    ),
    "as_ald_cap": MaterialProperties(
        display_name="ALD Al2O3 cap",
        role="capping",
        confidence="estimated",
        notes="Atomic-layer-deposited alumina. Conformal but adds some TLS.",
    ),
    "as_ald_dielectric": MaterialProperties(
        display_name="ALD Al2O3 dielectric",
        role="dielectric",
        confidence="estimated",
        notes="Conformal, controlled thickness.",
    ),
}


# ============================================================
#                 ALUMINUM NITRIDE (AlN)
# ============================================================
# Alternative crystalline tunnel barrier; also substrate/cap.
# ============================================================

ALUMINUM_NITRIDE = {
    "as_junction_barrier": MaterialProperties(
        display_name="AlN tunnel junction barrier",
        role="junction",
        confidence="speculative",
        charge_dispersion_kHz=0.015,
        yield_pct=75,
        notes=(
            "Alternative crystalline barrier with potentially lower TLS than AlOx. Used in "
            "NbN-AlN-NbN trilayers. Research-stage for qubits."
        ),
    ),
    "as_substrate": MaterialProperties(
        display_name="Aluminum nitride substrate",
        role="substrate",
        confidence="speculative",
        T1_us=400,
        cosmic_ray_rate_per_qubit_hr=1.5e-3,
        non_markovian=True,
        notes="Piezoelectric — useful for transducers, not common for transmons.",
    ),
    "as_cap": MaterialProperties(
        display_name="Aluminum nitride cap",
        role="capping",
        confidence="speculative",
    ),
}


# ============================================================
#               NIOBIUM OXIDE (NbOx) — JJ barrier
# ============================================================

NIOBIUM_OXIDE_JJ = {
    "as_junction_barrier": MaterialProperties(
        display_name="Nb-NbOx-Nb junction",
        role="junction",
        confidence="speculative",
        charge_dispersion_kHz=0.05,
        yield_pct=70,
        notes=(
            "Pure Nb electrodes with native NbOx barriers. Rarely used in qubits due to lossy "
            "oxide complex. More common in SFQ digital logic."
        ),
    ),
}


# ============================================================
#                HAFNIUM OXIDE (HfO2)
# ============================================================

HAFNIUM_OXIDE = {
    "as_junction_barrier": MaterialProperties(
        display_name="Al-HfOx-Al junction",
        role="junction",
        confidence="speculative",
        charge_dispersion_kHz=0.01,
        yield_pct=80,
        notes="High-k ALD barrier as research alternative to AlOx.",
    ),
    "as_cap": MaterialProperties(
        display_name="HfO2 cap",
        role="capping",
        confidence="speculative",
    ),
    "as_ald_dielectric": MaterialProperties(
        display_name="ALD HfO2 dielectric",
        role="dielectric",
        confidence="speculative",
    ),
}


# ============================================================
#                MAGNESIUM OXIDE (MgO)
# ============================================================

MAGNESIUM_OXIDE = {
    "as_junction_barrier": MaterialProperties(
        display_name="Al-MgOx-Al junction",
        role="junction",
        confidence="speculative",
        charge_dispersion_kHz=0.012,
        yield_pct=78,
        notes="Epitaxial barrier with atomically sharp interface.",
    ),
    "as_substrate": MaterialProperties(
        display_name="Magnesium oxide substrate",
        role="substrate",
        confidence="speculative",
        T1_us=400,
        cosmic_ray_rate_per_qubit_hr=2e-3,
        non_markovian=True,
        notes="Template for epitaxial NbN and other compound SC films.",
    ),
}


# ============================================================
#              SILICON OXIDE (SiOx) — NEW as JJ barrier
# ============================================================

SILICON_OXIDE = {
    "as_junction_barrier": MaterialProperties(
        display_name="Al-SiOx-Al junction barrier",
        role="junction",
        confidence="speculative",
        charge_dispersion_kHz=0.02,
        yield_pct=65,
        notes=(
            "Thin thermal SiOx barrier as research alternative to AlOx. Higher loss than AlOx "
            "but explored for specific junction geometries."
        ),
    ),
    "as_pecvd_dielectric": MaterialProperties(
        display_name="PECVD SiO2 dielectric",
        role="dielectric",
        confidence="estimated",
        notes="High TLS, used in some bridges and crossovers.",
    ),
    "as_thermal_dielectric": MaterialProperties(
        display_name="Thermal SiO2 dielectric",
        role="dielectric",
        confidence="estimated",
        notes="Better than PECVD. Still adds TLS.",
    ),
    "as_native_si_oxide": MaterialProperties(
        display_name="Native silicon oxide",
        role="dielectric",
        confidence="measured",
        notes="SiO2 native to silicon substrates. High TLS density — avoid where possible.",
    ),
}


# ============================================================
#                    SILICON (Si)
# ============================================================
# Universal substrate with multiple oxygen/isotope variants.
# ============================================================

SILICON = {
    "as_substrate_cz": MaterialProperties(
        display_name="Silicon (Czochralski)",
        role="substrate",
        confidence="measured",
        T1_us=500,
        cosmic_ray_rate_per_qubit_hr=1.5e-3,
        non_markovian=True,
        notes="More oxygen than FZ → more TLS. CMOS-compatible.",
    ),
    "as_substrate_fz": MaterialProperties(
        display_name="Silicon (float-zone)",
        role="substrate",
        confidence="measured",
        T1_us=1000,
        cosmic_ray_rate_per_qubit_hr=1.5e-3,
        non_markovian=True,
        notes="Lower oxygen than CZ → fewer TLS. Preferred for high-coherence qubits.",
    ),
    "as_substrate_high_res": MaterialProperties(
        display_name="Silicon (high-resistivity)",
        role="substrate",
        confidence="measured",
        T1_us=800,
        cosmic_ray_rate_per_qubit_hr=1.5e-3,
        non_markovian=True,
        notes="Standard for many transmon designs.",
    ),
    "as_substrate_h_passivated": MaterialProperties(
        display_name="Silicon (hydrogen-passivated)",
        role="substrate",
        confidence="estimated",
        T1_us=1200,
        cosmic_ray_rate_per_qubit_hr=1.5e-3,
        non_markovian=True,
        notes="H-termination eliminates dangling bonds. Reduces TLS.",
    ),
    "as_substrate_intrinsic": MaterialProperties(
        display_name="Intrinsic silicon",
        role="substrate",
        confidence="estimated",
        T1_us=700,
        cosmic_ray_rate_per_qubit_hr=1.5e-3,
        non_markovian=True,
    ),
    "as_dielectric": MaterialProperties(
        display_name="Silicon (as dielectric)",
        role="dielectric",
        confidence="estimated",
    ),
}


# ============================================================
#                  SILICON-28 (Si-28)
# ============================================================
# Isotopically enriched silicon. Nuclear-spin-free.
# ============================================================

SILICON_28 = {
    "as_substrate": MaterialProperties(
        display_name="Silicon-28 (isotopically enriched)",
        role="substrate",
        confidence="measured",
        T1_us=5000,
        cosmic_ray_rate_per_qubit_hr=1.5e-3,
        non_markovian=False,
        notes=(
            "Negligible nuclear-spin noise. Critical for spin qubits (orders-of-magnitude T2 "
            "improvement). For transmons, gives modest gain. Expensive enrichment."
        ),
    ),
}


# ============================================================
#                    SAPPHIRE (Al2O3)
# ============================================================

SAPPHIRE = {
    "as_substrate_c_plane": MaterialProperties(
        display_name="C-plane sapphire",
        role="substrate",
        confidence="measured",
        T1_us=2000,
        cosmic_ray_rate_per_qubit_hr=1e-3,
        non_markovian=True,
        notes="Standard sapphire substrate. Anisotropic phonon transport.",
        references=["Place et al. 2021"],
    ),
    "as_substrate_c_annealed": MaterialProperties(
        display_name="C-plane sapphire (annealed)",
        role="substrate",
        confidence="measured",
        T1_us=5000,
        cosmic_ray_rate_per_qubit_hr=1e-3,
        non_markovian=True,
        notes="Annealing reduces TLS and surface roughness. Used in Ganjam 2024.",
        references=["Ganjam et al. 2024"],
    ),
    "as_substrate_r_plane": MaterialProperties(
        display_name="R-plane sapphire",
        role="substrate",
        confidence="estimated",
        T1_us=1500,
        cosmic_ray_rate_per_qubit_hr=1e-3,
        non_markovian=True,
    ),
    "as_substrate_a_plane": MaterialProperties(
        display_name="A-plane sapphire",
        role="substrate",
        confidence="estimated",
        T1_us=1500,
        cosmic_ray_rate_per_qubit_hr=1e-3,
        non_markovian=True,
    ),
    "as_substrate_m_plane": MaterialProperties(
        display_name="M-plane sapphire",
        role="substrate",
        confidence="speculative",
        T1_us=1500,
        cosmic_ray_rate_per_qubit_hr=1e-3,
        non_markovian=True,
    ),
    "as_dielectric": MaterialProperties(
        display_name="Sapphire (as dielectric)",
        role="dielectric",
        confidence="measured",
        notes="Excellent low-loss dielectric.",
    ),
}


# ============================================================
#                SILICON CARBIDE (SiC)
# ============================================================

SILICON_CARBIDE = {
    "as_substrate": MaterialProperties(
        display_name="Silicon carbide substrate",
        role="substrate",
        confidence="estimated",
        T1_us=800,
        cosmic_ray_rate_per_qubit_hr=1e-3,
        non_markovian=True,
        notes="High thermal conductivity. Defect-based qubit host.",
    ),
}


# ============================================================
#                       QUARTZ
# ============================================================

QUARTZ = {
    "as_substrate_crystalline": MaterialProperties(
        display_name="Crystalline quartz substrate",
        role="substrate",
        confidence="estimated",
        T1_us=300,
        cosmic_ray_rate_per_qubit_hr=2e-3,
        non_markovian=True,
        notes="Low microwave loss. Used in some 2D resonator work.",
    ),
    "as_substrate_fused_silica": MaterialProperties(
        display_name="Fused silica substrate",
        role="substrate",
        confidence="estimated",
        T1_us=200,
        cosmic_ray_rate_per_qubit_hr=2e-3,
        non_markovian=True,
        notes="Amorphous, high TLS density.",
    ),
    "as_dielectric": MaterialProperties(
        display_name="Quartz (as dielectric)",
        role="dielectric",
        confidence="estimated",
    ),
}


# ============================================================
#              STRONTIUM TITANATE (STO)
# ============================================================

STRONTIUM_TITANATE = {
    "as_substrate": MaterialProperties(
        display_name="Strontium titanate substrate",
        role="substrate",
        confidence="speculative",
        T1_us=100,
        cosmic_ray_rate_per_qubit_hr=2e-3,
        non_markovian=True,
        notes="High dielectric constant. Oxide interface SC research.",
    ),
}


# ============================================================
#            SILICON-ON-INSULATOR (SOI)
# ============================================================

SILICON_ON_INSULATOR = {
    "as_substrate": MaterialProperties(
        display_name="Silicon-on-insulator substrate",
        role="substrate",
        confidence="estimated",
        T1_us=600,
        cosmic_ray_rate_per_qubit_hr=1.5e-3,
        non_markovian=True,
        notes=(
            "High-resistivity Si over buried oxide. CMOS foundry 2D qubit processing "
            "(Imec, CEA-Leti). Buried oxide can introduce TLS."
        ),
    ),
}


# ============================================================
#                 LANTHANUM ALUMINATE (LaAlO3)
# ============================================================

LANTHANUM_ALUMINATE = {
    "as_substrate": MaterialProperties(
        display_name="Lanthanum aluminate substrate",
        role="substrate",
        confidence="speculative",
        T1_us=400,
        cosmic_ray_rate_per_qubit_hr=2e-3,
        non_markovian=True,
        notes="Used for oxide film growth, rare in qubits.",
    ),
}


# ============================================================
#         YTTRIA-STABILIZED ZIRCONIA (YSZ)
# ============================================================

YTTRIA_STABILIZED_ZIRCONIA = {
    "as_substrate": MaterialProperties(
        display_name="Yttria-stabilized zirconia substrate",
        role="substrate",
        confidence="speculative",
        T1_us=300,
        cosmic_ray_rate_per_qubit_hr=2e-3,
        non_markovian=True,
    ),
}


# ============================================================
#                  GALLIUM ARSENIDE (GaAs)
# ============================================================

GALLIUM_ARSENIDE = {
    "as_substrate": MaterialProperties(
        display_name="Gallium arsenide substrate",
        role="substrate",
        confidence="estimated",
        T1_us=100,
        cosmic_ray_rate_per_qubit_hr=2e-3,
        non_markovian=True,
        notes="Piezoelectric — couples qubit to phonons. Bad for transmons.",
    ),
}


# ============================================================
#                 INDIUM PHOSPHIDE (InP)
# ============================================================

INDIUM_PHOSPHIDE = {
    "as_substrate": MaterialProperties(
        display_name="Indium phosphide substrate",
        role="substrate",
        confidence="speculative",
        T1_us=100,
        cosmic_ray_rate_per_qubit_hr=2e-3,
        non_markovian=True,
    ),
}


# ============================================================
#                INDIUM ARSENIDE (InAs)
# ============================================================

INDIUM_ARSENIDE = {
    "as_substrate": MaterialProperties(
        display_name="Indium arsenide substrate",
        role="substrate",
        confidence="speculative",
        T1_us=50,
        cosmic_ray_rate_per_qubit_hr=2e-3,
        non_markovian=True,
        notes="Hybrid SC-semiconductor stacks (gatemons).",
    ),
}


# ============================================================
#               SILICON-GERMANIUM (SiGe)
# ============================================================

SILICON_GERMANIUM = {
    "as_substrate": MaterialProperties(
        display_name="Silicon-germanium substrate",
        role="substrate",
        confidence="estimated",
        T1_us=400,
        cosmic_ray_rate_per_qubit_hr=1.5e-3,
        non_markovian=True,
        notes="Spin qubit heterostructure base.",
    ),
}


# ============================================================
#                    GERMANIUM (Ge)
# ============================================================

GERMANIUM = {
    "as_substrate": MaterialProperties(
        display_name="Germanium substrate",
        role="substrate",
        confidence="estimated",
        T1_us=300,
        cosmic_ray_rate_per_qubit_hr=1.5e-3,
        non_markovian=True,
    ),
}


# ============================================================
#                       DIAMOND
# ============================================================

DIAMOND = {
    "as_substrate_cvd": MaterialProperties(
        display_name="Diamond substrate (CVD)",
        role="substrate",
        confidence="estimated",
        T1_us=3000,
        cosmic_ray_rate_per_qubit_hr=8e-4,
        non_markovian=True,
        notes="Ultra-low loss. NV center and SC research.",
    ),
    "as_substrate_hpht": MaterialProperties(
        display_name="Diamond substrate (HPHT)",
        role="substrate",
        confidence="speculative",
        T1_us=2500,
        cosmic_ray_rate_per_qubit_hr=8e-4,
        non_markovian=True,
    ),
    "as_dielectric": MaterialProperties(
        display_name="Diamond (as dielectric)",
        role="dielectric",
        confidence="estimated",
        notes="Ultra-low loss but expensive.",
    ),
}


# ============================================================
#                  BOROSILICATE GLASS
# ============================================================

BOROSILICATE_GLASS = {
    "as_substrate": MaterialProperties(
        display_name="Borosilicate glass substrate",
        role="substrate",
        confidence="speculative",
        T1_us=50,
        cosmic_ray_rate_per_qubit_hr=2e-3,
        non_markovian=True,
        notes="High TLS. Not used for high-coherence qubits.",
    ),
}


# ============================================================
#               SAPPHIRE-ON-SILICON
# ============================================================

SAPPHIRE_ON_SILICON = {
    "as_substrate": MaterialProperties(
        display_name="Sapphire-on-silicon composite",
        role="substrate",
        confidence="speculative",
        T1_us=800,
        cosmic_ray_rate_per_qubit_hr=1.5e-3,
        non_markovian=True,
        notes="Engineered substrate combining advantages of both.",
    ),
}


# ============================================================
#               SILICON NITRIDE (Si3N4)
# ============================================================

SILICON_NITRIDE = {
    "as_pecvd_dielectric": MaterialProperties(
        display_name="PECVD silicon nitride",
        role="dielectric",
        confidence="estimated",
        notes="Low-loss airbridges and crossovers in 2D qubit chips.",
    ),
    "as_lpcvd_dielectric": MaterialProperties(
        display_name="LPCVD silicon nitride",
        role="dielectric",
        confidence="estimated",
        notes="Higher quality than PECVD.",
    ),
}


# ============================================================
#         AMORPHOUS SILICON (a-Si) — NEW as dielectric
# ============================================================

AMORPHOUS_SILICON = {
    "as_dielectric": MaterialProperties(
        display_name="Amorphous silicon dielectric",
        role="dielectric",
        confidence="estimated",
        notes=(
            "Lower TLS density than SiO2. Used as low-loss dielectric in 2D crossover and "
            "airbridge structures. Hydrogenated variants further reduce loss."
        ),
    ),
    "as_junction_barrier": MaterialProperties(
        display_name="Al-amorphous-Si-Al junction barrier",
        role="junction",
        confidence="speculative",
        charge_dispersion_kHz=0.02,
        yield_pct=70,
        notes="Amorphous Si tunnel barrier, research stage.",
    ),
}


# ============================================================
#                 BENZOCYCLOBUTENE (BCB)
# ============================================================

BENZOCYCLOBUTENE = {
    "as_dielectric": MaterialProperties(
        display_name="Benzocyclobutene (BCB)",
        role="dielectric",
        confidence="speculative",
        notes="Polymer used in inter-layer dielectrics and flip-chip module assembly.",
    ),
}


# ============================================================
#       HYDROGEN SILSESQUIOXANE (HSQ) — NEW
# ============================================================
# E-beam resist used as permanent dielectric.
# ============================================================

HYDROGEN_SILSESQUIOXANE = {
    "as_dielectric": MaterialProperties(
        display_name="Hydrogen silsesquioxane (HSQ) dielectric",
        role="dielectric",
        confidence="speculative",
        notes=(
            "Negative-tone e-beam resist that converts to a SiOx-like dielectric after exposure. "
            "Used as permanent dielectric in 2D crossover and airbridge architectures. Adds TLS "
            "loss but enables fine patterning."
        ),
    ),
}


# ============================================================
#                    SU-8 PHOTORESIST
# ============================================================

SU8 = {
    "as_dielectric": MaterialProperties(
        display_name="SU-8 photoresist",
        role="dielectric",
        confidence="speculative",
        notes="Photoresist as permanent structure. Lossy.",
    ),
}


# ============================================================
#                      POLYIMIDE
# ============================================================

POLYIMIDE = {
    "as_dielectric": MaterialProperties(
        display_name="Polyimide dielectric",
        role="dielectric",
        confidence="speculative",
        notes="Flexible polymer dielectric.",
    ),
}


# ============================================================
#                       VACUUM
# ============================================================

VACUUM = {
    "as_dielectric": MaterialProperties(
        display_name="Vacuum / air dielectric",
        role="dielectric",
        confidence="measured",
        notes="The best dielectric. Used in 3D cavities and air-bridges.",
    ),
    "as_encapsulation": MaterialProperties(
        display_name="Vacuum encapsulation",
        role="capping",
        confidence="speculative",
        T1_us=2000,
        notes="Cutting-edge 2024-2025 technique — eliminates air-exposed oxide entirely.",
    ),
}


# ============================================================
#                HEXAGONAL BORON NITRIDE (h-BN)
# ============================================================

HEXAGONAL_BN = {
    "as_encapsulation": MaterialProperties(
        display_name="Hexagonal boron nitride encapsulation",
        role="capping",
        confidence="speculative",
        notes="Atomically thin low-loss insulator. 2D material research stage.",
    ),
}


# ============================================================
#                       PARYLENE
# ============================================================

PARYLENE = {
    "as_encapsulation": MaterialProperties(
        display_name="Parylene encapsulation",
        role="capping",
        confidence="speculative",
        notes="Polymer encapsulation. Used in some MEMS but rare for qubits.",
    ),
}


# ============================================================
#                  SURFACE TERMINATIONS
# ============================================================

HYDROGEN_TERMINATION = {
    "as_passivation": MaterialProperties(
        display_name="Hydrogen termination",
        role="capping",
        confidence="estimated",
        notes="H atoms passivate dangling bonds on Si surface.",
    ),
}

FLUORINE_TERMINATION = {
    "as_passivation": MaterialProperties(
        display_name="Fluorine termination",
        role="capping",
        confidence="speculative",
    ),
}


# ============================================================
#             YBCO (YBa2Cu3O7)
# ============================================================

YBCO = {
    "as_film": MaterialProperties(
        display_name="YBCO (yttrium barium copper oxide)",
        role="film",
        confidence="speculative",
        T1_us=5,
        bias_eta=2,
        notes=(
            "d-wave cuprate (Tc~90 K). 2D film research; not yet qubit-grade coherence due to "
            "nodal quasiparticles inherent to d-wave pairing."
        ),
    ),
}


# ============================================================
#         BSCCO / Bi2212 (Bi2Sr2CaCu2O8)
# ============================================================

BSCCO = {
    "as_film": MaterialProperties(
        display_name="BSCCO (bismuth strontium calcium copper oxide)",
        role="film",
        confidence="speculative",
        T1_us=5,
        bias_eta=2,
        notes=(
            "Cuprate (Tc~85 K). Same d-wave issues as YBCO. Research on 2D c-axis tunnel "
            "junctions in hybrid circuits."
        ),
    ),
}


# ============================================================
#                IRON SELENIDE (FeSe)
# ============================================================

IRON_SELENIDE = {
    "as_film": MaterialProperties(
        display_name="Iron selenide film",
        role="film",
        confidence="speculative",
        T1_us=10,
        bias_eta=2,
        notes=(
            "Iron-based SC (Tc~8 K bulk, ~65 K in 2D monolayer films on STO). 2D enhanced-Tc "
            "research."
        ),
    ),
}


# ============================================================
#       TWISTED BILAYER GRAPHENE (TBG) — NEW
# ============================================================

TWISTED_BILAYER_GRAPHENE = {
    "as_film": MaterialProperties(
        display_name="Twisted bilayer graphene (magic angle)",
        role="film",
        confidence="speculative",
        T1_us=1,
        bias_eta=2,
        notes=(
            "Flat-band intrinsic SC at magic angle ~1.1° (Tc~1.7 K). Research platform — no "
            "qubit-grade T1/T2 data published. Junction physics with TBG layers is emerging."
        ),
        references=["Cao et al. 2018, Nature 556:43 (TBG superconductivity)"],
    ),
    "as_junction_barrier": MaterialProperties(
        display_name="Graphene-based junction layers",
        role="junction",
        confidence="speculative",
        charge_dispersion_kHz=2,
        yield_pct=20,
        notes="Graphene barrier — research stage.",
    ),
}


# ============================================================
#         NV CENTERS IN DIAMOND (NV/Dia) — NEW
# ============================================================

NV_DIAMOND = {
    "as_hybrid_memory": MaterialProperties(
        display_name="NV centers in diamond (hybrid memory)",
        role="film",
        confidence="measured",
        T1_us=10000,
        T2_echo_us=1000,
        bias_eta=10,
        notes=(
            "Nitrogen-vacancy (NV) centers in diamond used as hybrid quantum memory nodes "
            "coupled to 2D SC qubit circuits. NV electronic spin T1 at millikelvin can reach "
            "100ms+; T2 reaches ms with 12C-isotopic purification. Coherence here is for the "
            "NV spin, not a SC qubit. NV/SC coupling via flux or strain interfaces."
        ),
        references=[
            "Doherty et al. 2013, Phys Rep 528:1 (NV center review)",
            "Astner et al. 2018, PRL 121:247201 (long NV T1 at low T)",
        ],
    ),
}


# ============================================================
#                EXOTIC TOPOLOGICAL
# ============================================================

HGTE = {
    "as_junction": MaterialProperties(
        display_name="HgTe-Al topological junction",
        role="junction",
        confidence="speculative",
        charge_dispersion_kHz=20,
        yield_pct=5,
        notes="Topological insulator base. Research stage.",
    ),
}

INSB_AL_NANOWIRE = {
    "as_junction": MaterialProperties(
        display_name="InSb-Al nanowire junction",
        role="junction",
        confidence="speculative",
        charge_dispersion_kHz=12,
        yield_pct=15,
        notes="Higher g-factor than InAs. Topological qubit research.",
    ),
}


# ============================================================
#               OTHER COMPOUND SUPERCONDUCTORS
# ============================================================

NIOBIUM_TIN_NB3SN = {
    "as_film": MaterialProperties(
        display_name="Niobium-tin (Nb3Sn) film",
        role="film",
        confidence="speculative",
        T1_us=20,
        bias_eta=2,
        notes="Used in 3D cavity coatings, not planar qubits.",
    ),
    "as_cavity_coating": MaterialProperties(
        display_name="Nb3Sn-coated cavity",
        role="cavity",
        confidence="speculative",
        T1_us=5000,
        bias_eta=500,
        notes="Higher Tc material applied to Nb cavity.",
    ),
}

NB3GE = {
    "as_film": MaterialProperties(
        display_name="Niobium-germanium (Nb3Ge)",
        role="film",
        confidence="speculative",
        T1_us=15,
        bias_eta=2,
        notes="Historical high-Tc material, rarely used in qubits.",
    ),
}

NBTI = {
    "as_film": MaterialProperties(
        display_name="Niobium-titanium alloy",
        role="film",
        confidence="speculative",
        T1_us=40,
        bias_eta=2,
        notes="Common in magnet wire, occasionally in qubit research.",
    ),
}


# ============================================================
#               REFRACTORY METAL FILMS
# ============================================================

MOLYBDENUM = {
    "as_film": MaterialProperties(
        display_name="Molybdenum film",
        role="film",
        confidence="speculative",
        T1_us=30,
        bias_eta=2,
    ),
}

TUNGSTEN = {
    "as_film": MaterialProperties(
        display_name="Tungsten film",
        role="film",
        confidence="speculative",
        T1_us=10,
        bias_eta=2,
        notes="Very low Tc. Used for thermometers, not qubits.",
    ),
    "as_tsv": MaterialProperties(
        display_name="Tungsten through-silicon via",
        role="wiring",
        confidence="speculative",
    ),
}

HAFNIUM = {
    "as_film": MaterialProperties(
        display_name="Hafnium film",
        role="film",
        confidence="speculative",
        T1_us=20,
        bias_eta=2,
    ),
}


# ============================================================
#               MERCURY (Hg) — historical
# ============================================================

MERCURY = {
    "as_film": MaterialProperties(
        display_name="Mercury (historical)",
        role="film",
        confidence="not_applicable",
        notes="The original superconductor (Onnes 1911). Not used in modern qubits.",
    ),
}


# ============================================================
#               PHOTONIC CRYSTAL CAVITY
# ============================================================

PHOTONIC_CRYSTAL_SI = {
    "as_cavity": MaterialProperties(
        display_name="Photonic crystal cavity (Si)",
        role="cavity",
        confidence="speculative",
        T1_us=500,
        bias_eta=50,
        notes="Research stage. Used for optical-microwave conversion.",
    ),
}


# ============================================================
#                       WIRING METALS
# ============================================================

GOLD = {
    "as_bond_wire": MaterialProperties(
        display_name="Gold bond wire",
        role="wiring",
        confidence="measured",
        notes="Standard bond wire. Normal metal — adds loss at interface.",
    ),
    "as_bump_bond": MaterialProperties(
        display_name="Gold bump bond",
        role="wiring",
        confidence="estimated",
        notes="Normal metal bump — limits performance.",
    ),
    "as_cap": MaterialProperties(
        display_name="Gold cap",
        role="capping",
        confidence="estimated",
        notes="Prevents oxidation but limits SC at surface.",
    ),
}

COPPER = {
    "as_pillar": MaterialProperties(
        display_name="Copper pillar bump",
        role="wiring",
        confidence="speculative",
        notes="Standard semiconductor packaging tech. Adapted for cryo.",
    ),
    "as_tsv": MaterialProperties(
        display_name="Copper through-silicon via",
        role="wiring",
        confidence="estimated",
        notes="Standard CMOS TSV. Adds loss but enables 3D integration.",
    ),
}

PLATINUM = {
    "as_cap": MaterialProperties(display_name="Platinum cap", role="capping", confidence="speculative"),
}

PALLADIUM = {
    "as_cap": MaterialProperties(display_name="Palladium cap", role="capping", confidence="speculative"),
}

TITANIUM = {
    "as_cap": MaterialProperties(
        display_name="Titanium cap",
        role="capping",
        confidence="speculative",
        notes="Less common cap material.",
    ),
}


# ============================================================
#                  MASTER REGISTRY
# ============================================================
# Maps material name -> the section dict above.
# Each section dict contains all the roles that material plays.
# ============================================================

ALL_MATERIALS = {
    # Elemental superconductors
    "aluminum": ALUMINUM,
    "tantalum": TANTALUM,
    "niobium": NIOBIUM,
    "rhenium": RHENIUM,
    "vanadium": VANADIUM,
    "indium": INDIUM,
    "lead": LEAD,
    "tin": TIN,
    "mercury": MERCURY,
    "molybdenum": MOLYBDENUM,
    "tungsten": TUNGSTEN,
    "hafnium": HAFNIUM,

    # Compound superconductors
    "niobium_nitride": NIOBIUM_NITRIDE,
    "niobium_titanium_nitride": NIOBIUM_TITANIUM_NITRIDE,
    "titanium_nitride": TITANIUM_NITRIDE,
    "molybdenum_rhenium": MOLYBDENUM_RHENIUM,
    "niobium_silicide": NIOBIUM_SILICIDE,            # NEW
    "magnesium_diboride": MAGNESIUM_DIBORIDE,
    "vanadium_silicide": VANADIUM_SILICIDE,          # NEW
    "niobium_aluminide": NIOBIUM_ALUMINIDE,          # NEW
    "niobium_tin": NIOBIUM_TIN_NB3SN,
    "niobium_germanium": NB3GE,
    "niobium_titanium": NBTI,
    "granular_aluminum": GRANULAR_ALUMINUM,

    # Hybrid SC-semiconductor
    "aluminum_on_inas": ALUMINUM_ON_INAS,
    "insb_al_nanowire": INSB_AL_NANOWIRE,
    "hgte": HGTE,

    # Junction barrier chemistries
    "aluminum_oxide": ALUMINUM_OXIDE,
    "aluminum_nitride": ALUMINUM_NITRIDE,
    "niobium_oxide_jj": NIOBIUM_OXIDE_JJ,
    "hafnium_oxide": HAFNIUM_OXIDE,
    "magnesium_oxide": MAGNESIUM_OXIDE,
    "silicon_oxide": SILICON_OXIDE,                  # NEW

    # Substrates
    "silicon": SILICON,
    "silicon_28": SILICON_28,
    "sapphire": SAPPHIRE,
    "silicon_carbide": SILICON_CARBIDE,
    "quartz": QUARTZ,
    "strontium_titanate": STRONTIUM_TITANATE,
    "silicon_on_insulator": SILICON_ON_INSULATOR,
    "lanthanum_aluminate": LANTHANUM_ALUMINATE,
    "ysz": YTTRIA_STABILIZED_ZIRCONIA,
    "gallium_arsenide": GALLIUM_ARSENIDE,
    "indium_phosphide": INDIUM_PHOSPHIDE,
    "indium_arsenide": INDIUM_ARSENIDE,
    "silicon_germanium": SILICON_GERMANIUM,
    "germanium": GERMANIUM,
    "diamond": DIAMOND,
    "borosilicate_glass": BOROSILICATE_GLASS,
    "sapphire_on_silicon": SAPPHIRE_ON_SILICON,

    # Dielectrics & encapsulants
    "silicon_nitride": SILICON_NITRIDE,
    "amorphous_silicon": AMORPHOUS_SILICON,          # NEW as dielectric
    "benzocyclobutene": BENZOCYCLOBUTENE,
    "hydrogen_silsesquioxane": HYDROGEN_SILSESQUIOXANE,  # NEW
    "su8": SU8,
    "polyimide": POLYIMIDE,
    "vacuum": VACUUM,
    "hexagonal_bn": HEXAGONAL_BN,
    "parylene": PARYLENE,
    "hydrogen_termination": HYDROGEN_TERMINATION,
    "fluorine_termination": FLUORINE_TERMINATION,

    # Emerging / exotic
    "ybco": YBCO,
    "bscco": BSCCO,
    "iron_selenide": IRON_SELENIDE,
    "twisted_bilayer_graphene": TWISTED_BILAYER_GRAPHENE,  # NEW
    "nv_diamond": NV_DIAMOND,                              # NEW

    # 3D cavities (non-elemental variants only)
    "photonic_crystal_si": PHOTONIC_CRYSTAL_SI,

    # Wiring
    "gold": GOLD,
    "copper": COPPER,
    "platinum": PLATINUM,
    "palladium": PALLADIUM,
    "titanium": TITANIUM,
}


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def get_material(name: str) -> dict:
    """Get all roles of a given material."""
    return ALL_MATERIALS[name.lower()]


def get_role(material_name: str, role_key: str) -> MaterialProperties:
    """Get a specific role of a material.

    Example: get_role('aluminum', 'as_film') -> film properties.
    """
    return ALL_MATERIALS[material_name.lower()][role_key]


def list_by_role(role: str) -> list[tuple[str, str, MaterialProperties]]:
    """Find all (material, role_key, properties) tuples for a given role."""
    results = []
    for mat_name, roles_dict in ALL_MATERIALS.items():
        for role_key, props in roles_dict.items():
            if props.role == role:
                results.append((mat_name, role_key, props))
    return results


def list_by_confidence(level: str) -> list[tuple[str, str, MaterialProperties]]:
    """Find all material-role entries at a given confidence level."""
    results = []
    for mat_name, roles_dict in ALL_MATERIALS.items():
        for role_key, props in roles_dict.items():
            if props.confidence == level:
                results.append((mat_name, role_key, props))
    return results


def total_entries() -> int:
    """Total number of material-role entries across the library."""
    return sum(len(roles) for roles in ALL_MATERIALS.values())


# ============================================================
# DEMO
# ============================================================

if __name__ == "__main__":
    print("=== Coverage ===\n")
    print(f"Total materials:             {len(ALL_MATERIALS)}")
    print(f"Total material-role entries: {total_entries()}")

    print("\n=== Materials with the most roles ===\n")
    sorted_mats = sorted(ALL_MATERIALS.items(), key=lambda x: -len(x[1]))
    for mat_name, roles in sorted_mats[:8]:
        role_keys = list(roles.keys())
        print(f"  {mat_name:<28} {len(roles):>2} roles")

    print("\n=== Confidence breakdown ===\n")
    for level in ["measured", "estimated", "speculative", "not_applicable"]:
        n = len(list_by_confidence(level))
        print(f"  {level:<20} {n} entries")

    print("\n=== Sample: ALUMINUM (all roles) ===\n")
    al = get_material("aluminum")
    for role_key, props in al.items():
        print(f"  [{role_key}]  {props.display_name}  ({props.confidence})")
        if props.T1_us is not None:
            print(f"      T1 = {props.T1_us} μs")

    print("\n=== NEW materials added from spreadsheet ===\n")
    new_materials = [
        "niobium_silicide", "vanadium_silicide", "niobium_aluminide",
        "silicon_oxide", "amorphous_silicon",
        "hydrogen_silsesquioxane", "twisted_bilayer_graphene", "nv_diamond",
    ]
    for name in new_materials:
        roles = ALL_MATERIALS[name]
        for role_key, props in roles.items():
            print(f"  {name}.{role_key:<25} → {props.display_name} ({props.confidence})")

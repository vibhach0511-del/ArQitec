"""
Materials Properties Library — 7-tier characterization.

Maps each material from material_names.py to its full property dict.

CRITICAL HONESTY NOTE:
  - Tier 1 (T1, T2) properties have published values for ~20-30 materials
  - Tier 2 (Pauli decomposition) properties are rarely measured directly
  - Tier 3-7 properties are even more rarely fully reported
  
For materials without published data, properties are ESTIMATED from
physically similar materials and marked with confidence < "high".

Confidence levels:
  - "measured": directly published in cited paper(s)
  - "estimated": inferred from similar materials or composition rules
  - "speculative": research-stage, numbers are educated guesses
  - "not_applicable": property doesn't apply to this material type
"""

from dataclasses import dataclass, field
from typing import Optional, Union
from material_names import (
    Substrate, SuperconductingFilm, JunctionMaterial, CappingMaterial,
    DielectricMaterial, CavityMaterial, SuperinductorMaterial, WiringMaterial
)


# ============================================================
# UNIVERSAL PROPERTY SCHEMA — 7 tiers
# ============================================================

@dataclass
class MaterialProperties:
    """Full 7-tier property profile for any material."""
    
    # --- Identification ---
    display_name: str
    role: str                           # "substrate" | "film" | "junction" | etc.
    confidence: str                     # "measured" | "estimated" | "speculative"
    references: list[str] = field(default_factory=list)
    
    # ============================================================
    # TIER 1: Coherence properties
    # ============================================================
    T1_us: Optional[float] = None
    T2_echo_us: Optional[float] = None
    T2_ramsey_us: Optional[float] = None
    T_phi_us: Optional[float] = None
    
    # ============================================================
    # TIER 2: Noise channel decomposition
    # ============================================================
    bias_eta: Optional[float] = None
    p_X_idle_per_us: Optional[float] = None
    p_Z_idle_per_us: Optional[float] = None
    p_leakage_per_gate: Optional[float] = None
    p_seepage_per_cycle: Optional[float] = None
    
    # ============================================================
    # TIER 3: Spatial/temporal correlations
    # ============================================================
    cosmic_ray_rate_per_qubit_hr: Optional[float] = None
    ZZ_crosstalk_kHz: Optional[float] = None
    one_over_f_noise_amplitude: Optional[float] = None
    TLS_density_per_GHz: Optional[float] = None
    non_markovian: Optional[bool] = None
    
    # ============================================================
    # TIER 4: Gate-specific properties
    # ============================================================
    gate_1q_fidelity: Optional[float] = None
    gate_2q_fidelity: Optional[float] = None
    gate_1q_time_ns: Optional[float] = None
    gate_2q_time_ns: Optional[float] = None
    anharmonicity_MHz: Optional[float] = None
    charge_dispersion_kHz: Optional[float] = None
    
    # ============================================================
    # TIER 5: Measurement properties
    # ============================================================
    readout_fidelity: Optional[float] = None
    measurement_time_ns: Optional[float] = None
    p_meas_induced_leakage: Optional[float] = None
    qnd_fidelity: Optional[float] = None
    
    # ============================================================
    # TIER 6: Architectural / connectivity
    # ============================================================
    typical_connectivity: Optional[str] = None
    max_qubits_demonstrated: Optional[int] = None
    frequency_crowding_MHz: Optional[float] = None
    
    # ============================================================
    # TIER 7: Yield and variation
    # ============================================================
    yield_pct: Optional[float] = None
    parameter_variation_pct: Optional[float] = None
    drift_rate_per_hour: Optional[float] = None
    
    notes: str = ""


# ============================================================
# DEFAULTS by physical category — used when no measurement
# ============================================================

# Reasonable defaults grouped by what kind of role the material plays.
# These are STARTING POINTS; the engine refines them per material below.

DEFAULTS_BY_ROLE = {
    "substrate": MaterialProperties(
        display_name="<default substrate>",
        role="substrate",
        confidence="estimated",
        cosmic_ray_rate_per_qubit_hr=1e-3,
        non_markovian=True,
        notes="Substrate defaults; modify per material."
    ),
    "film_standard_transmon": MaterialProperties(
        display_name="<default transmon film>",
        role="film",
        confidence="estimated",
        T1_us=100,
        T2_echo_us=80,
        bias_eta=3,
        anharmonicity_MHz=-220,
        gate_1q_fidelity=0.999,
        gate_2q_fidelity=0.99,
        readout_fidelity=0.98,
        ZZ_crosstalk_kHz=80,
        p_leakage_per_gate=3e-4,
    ),
    "film_fluxonium_class": MaterialProperties(
        display_name="<default fluxonium film>",
        role="film",
        confidence="estimated",
        T1_us=200,
        T2_echo_us=150,
        bias_eta=15,
        anharmonicity_MHz=-3000,
        gate_1q_fidelity=0.999,
        gate_2q_fidelity=0.99,
        p_leakage_per_gate=5e-5,
    ),
    "junction": MaterialProperties(
        display_name="<default junction>",
        role="junction",
        confidence="estimated",
        charge_dispersion_kHz=0.01,
        yield_pct=85,
    ),
    "capping": MaterialProperties(
        display_name="<default capping>",
        role="capping",
        confidence="estimated",
    ),
    "dielectric": MaterialProperties(
        display_name="<default dielectric>",
        role="dielectric",
        confidence="estimated",
    ),
    "cavity": MaterialProperties(
        display_name="<default 3D cavity>",
        role="cavity",
        confidence="estimated",
        T1_us=2000,                      # 3D cavities have long T1
        bias_eta=100,                    # bosonic, biased
    ),
    "superinductor": MaterialProperties(
        display_name="<default superinductor>",
        role="superinductor",
        confidence="estimated",
    ),
    "wiring": MaterialProperties(
        display_name="<default wiring>",
        role="wiring",
        confidence="estimated",
    ),
}


# ============================================================
# SUBSTRATES — properties
# ============================================================

SUBSTRATE_PROPERTIES = {
    Substrate.C_SAPPHIRE: MaterialProperties(
        display_name="C-plane sapphire",
        role="substrate",
        confidence="measured",
        T1_us=2000,                      # T1 limit imposed by substrate alone
        cosmic_ray_rate_per_qubit_hr=1e-3,
        TLS_density_per_GHz=None,
        non_markovian=True,
        notes="Standard sapphire substrate. Anisotropic phonon transport.",
        references=["Place et al. 2021"],
    ),
    Substrate.C_SAPPHIRE_ANNEALED: MaterialProperties(
        display_name="C-plane sapphire (annealed)",
        role="substrate",
        confidence="measured",
        T1_us=5000,                      # higher ceiling after annealing
        cosmic_ray_rate_per_qubit_hr=1e-3,
        non_markovian=True,
        notes="Surface annealing reduces TLS and surface roughness.",
        references=["Ganjam et al. 2024"],
    ),
    Substrate.R_SAPPHIRE: MaterialProperties(
        display_name="R-plane sapphire",
        role="substrate",
        confidence="estimated",
        T1_us=1500,
        cosmic_ray_rate_per_qubit_hr=1e-3,
        non_markovian=True,
        notes="Less common orientation. Used in some GaN epitaxy stacks.",
    ),
    Substrate.A_SAPPHIRE: MaterialProperties(
        display_name="A-plane sapphire",
        role="substrate",
        confidence="estimated",
        T1_us=1500,
        cosmic_ray_rate_per_qubit_hr=1e-3,
        non_markovian=True,
    ),
    Substrate.M_SAPPHIRE: MaterialProperties(
        display_name="M-plane sapphire",
        role="substrate",
        confidence="speculative",
        T1_us=1500,
        cosmic_ray_rate_per_qubit_hr=1e-3,
        non_markovian=True,
    ),
    Substrate.SI_CZ: MaterialProperties(
        display_name="Silicon (Czochralski)",
        role="substrate",
        confidence="measured",
        T1_us=500,                       # higher oxygen → more TLS
        cosmic_ray_rate_per_qubit_hr=1.5e-3,
        non_markovian=True,
        notes="More oxygen than FZ → more TLS defects. CMOS-compatible.",
    ),
    Substrate.SI_FZ: MaterialProperties(
        display_name="Silicon (float-zone)",
        role="substrate",
        confidence="measured",
        T1_us=1000,
        cosmic_ray_rate_per_qubit_hr=1.5e-3,
        non_markovian=True,
        notes="Lower oxygen than CZ → fewer TLS. Preferred for qubits.",
    ),
    Substrate.SI_HIGH_RES: MaterialProperties(
        display_name="Silicon (high-resistivity)",
        role="substrate",
        confidence="measured",
        T1_us=800,
        cosmic_ray_rate_per_qubit_hr=1.5e-3,
        non_markovian=True,
        notes="Standard for many transmon designs.",
    ),
    Substrate.SI_28_ENRICHED: MaterialProperties(
        display_name="Silicon-28 (isotopically enriched)",
        role="substrate",
        confidence="measured",
        T1_us=5000,                      # benefit larger for spin qubits
        cosmic_ray_rate_per_qubit_hr=1.5e-3,
        non_markovian=False,             # nuclear spin bath suppressed
        notes="Negligible nuclear-spin noise. Critical for spin qubits, modest gain for transmons.",
    ),
    Substrate.SI_H_PASSIVATED: MaterialProperties(
        display_name="Silicon (hydrogen-passivated)",
        role="substrate",
        confidence="estimated",
        T1_us=1200,
        cosmic_ray_rate_per_qubit_hr=1.5e-3,
        non_markovian=True,
        notes="H-termination eliminates dangling bonds. Reduces TLS.",
    ),
    Substrate.SOI: MaterialProperties(
        display_name="Silicon-on-insulator",
        role="substrate",
        confidence="estimated",
        T1_us=600,
        cosmic_ray_rate_per_qubit_hr=1.5e-3,
        non_markovian=True,
        notes="Buried oxide can introduce TLS. CMOS-foundry compatible.",
    ),
    Substrate.SI_INTRINSIC: MaterialProperties(
        display_name="Intrinsic silicon",
        role="substrate",
        confidence="estimated",
        T1_us=700,
        cosmic_ray_rate_per_qubit_hr=1.5e-3,
        non_markovian=True,
    ),
    Substrate.QUARTZ: MaterialProperties(
        display_name="Quartz (fused/crystalline)",
        role="substrate",
        confidence="estimated",
        T1_us=300,
        cosmic_ray_rate_per_qubit_hr=2e-3,
        non_markovian=True,
        notes="High TLS in glassy form. Used in early qubit research; less common in current devices.",
    ),
    Substrate.FUSED_SILICA: MaterialProperties(
        display_name="Fused silica",
        role="substrate",
        confidence="estimated",
        T1_us=200,
        cosmic_ray_rate_per_qubit_hr=2e-3,
        non_markovian=True,
        notes="Amorphous, high TLS density.",
    ),
    Substrate.MGO: MaterialProperties(
        display_name="Magnesium oxide",
        role="substrate",
        confidence="speculative",
        T1_us=400,
        cosmic_ray_rate_per_qubit_hr=2e-3,
        non_markovian=True,
        notes="Niche substrate for some film growth.",
    ),
    Substrate.LAALO3: MaterialProperties(
        display_name="Lanthanum aluminate",
        role="substrate",
        confidence="speculative",
        T1_us=400,
        cosmic_ray_rate_per_qubit_hr=2e-3,
        non_markovian=True,
        notes="Used for oxide film growth, rare in qubits.",
    ),
    Substrate.SRTIO3: MaterialProperties(
        display_name="Strontium titanate",
        role="substrate",
        confidence="speculative",
        T1_us=100,
        cosmic_ray_rate_per_qubit_hr=2e-3,
        non_markovian=True,
        notes="High dielectric constant — bad for qubits, good for some research.",
    ),
    Substrate.YSZ: MaterialProperties(
        display_name="Yttria-stabilized zirconia",
        role="substrate",
        confidence="speculative",
        T1_us=300,
        cosmic_ray_rate_per_qubit_hr=2e-3,
        non_markovian=True,
    ),
    Substrate.GAAS: MaterialProperties(
        display_name="Gallium arsenide",
        role="substrate",
        confidence="estimated",
        T1_us=100,
        cosmic_ray_rate_per_qubit_hr=2e-3,
        non_markovian=True,
        notes="Piezoelectric — couples qubit to phonons. Bad for transmons.",
    ),
    Substrate.INP: MaterialProperties(
        display_name="Indium phosphide",
        role="substrate",
        confidence="speculative",
        T1_us=100,
        cosmic_ray_rate_per_qubit_hr=2e-3,
        non_markovian=True,
    ),
    Substrate.INAS: MaterialProperties(
        display_name="Indium arsenide",
        role="substrate",
        confidence="speculative",
        T1_us=50,
        cosmic_ray_rate_per_qubit_hr=2e-3,
        non_markovian=True,
        notes="Hybrid superconductor-semiconductor stacks (gatemons).",
    ),
    Substrate.SIGE: MaterialProperties(
        display_name="Silicon-germanium",
        role="substrate",
        confidence="estimated",
        T1_us=400,
        cosmic_ray_rate_per_qubit_hr=1.5e-3,
        non_markovian=True,
        notes="Spin qubit heterostructure base.",
    ),
    Substrate.GE: MaterialProperties(
        display_name="Germanium",
        role="substrate",
        confidence="estimated",
        T1_us=300,
        cosmic_ray_rate_per_qubit_hr=1.5e-3,
        non_markovian=True,
    ),
    Substrate.DIAMOND_CVD: MaterialProperties(
        display_name="Diamond (CVD)",
        role="substrate",
        confidence="estimated",
        T1_us=3000,
        cosmic_ray_rate_per_qubit_hr=8e-4,      # high gap, lower burst rate
        non_markovian=True,
        notes="Ultra-low loss. Used for NV centers and some superconducting research.",
    ),
    Substrate.DIAMOND_HPHT: MaterialProperties(
        display_name="Diamond (HPHT)",
        role="substrate",
        confidence="speculative",
        T1_us=2500,
        cosmic_ray_rate_per_qubit_hr=8e-4,
        non_markovian=True,
    ),
    Substrate.ALN: MaterialProperties(
        display_name="Aluminum nitride substrate",
        role="substrate",
        confidence="speculative",
        T1_us=400,
        cosmic_ray_rate_per_qubit_hr=1.5e-3,
        non_markovian=True,
        notes="Piezoelectric — useful for transducers, not common for qubits.",
    ),
    Substrate.SIC: MaterialProperties(
        display_name="Silicon carbide",
        role="substrate",
        confidence="estimated",
        T1_us=800,
        cosmic_ray_rate_per_qubit_hr=1e-3,
        non_markovian=True,
        notes="Defect-based qubit host (similar to NV in diamond).",
    ),
    Substrate.GLASS_BOROSILICATE: MaterialProperties(
        display_name="Borosilicate glass",
        role="substrate",
        confidence="speculative",
        T1_us=50,
        cosmic_ray_rate_per_qubit_hr=2e-3,
        non_markovian=True,
        notes="High TLS. Not used for high-coherence qubits.",
    ),
    Substrate.SAPPHIRE_ON_SI: MaterialProperties(
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
# SUPERCONDUCTING FILMS — properties
# ============================================================

FILM_PROPERTIES = {
    SuperconductingFilm.ALPHA_TANTALUM: MaterialProperties(
        display_name="α-Tantalum (bcc phase)",
        role="film",
        confidence="measured",
        T1_us=230,                       # Place 2021: avg 230 μs (range 150-300 μs)
        T2_echo_us=249,                  # Place 2021: Device 18, 249±4 μs
        T_phi_us=540,                    # derived: 1/T_phi = 1/T2 - 1/(2*T1)
        bias_eta=4,                      # T2 < T1 → moderate bias toward Z
        p_X_idle_per_us=2.2e-3,          # 1/T1
        p_Z_idle_per_us=1.9e-3,          # 1/T_phi
        p_leakage_per_gate=1e-4,
        p_seepage_per_cycle=1e-5,
        ZZ_crosstalk_kHz=50,
        one_over_f_noise_amplitude=1e-6,
        non_markovian=True,
        gate_1q_fidelity=0.9999,         # routine for high-coherence transmons
        gate_2q_fidelity=0.995,
        gate_1q_time_ns=20,
        gate_2q_time_ns=200,
        anharmonicity_MHz=-220,
        readout_fidelity=0.99,
        measurement_time_ns=500,
        qnd_fidelity=0.98,
        yield_pct=70,
        parameter_variation_pct=30,
        drift_rate_per_hour=0.5,
        notes=(
            "The 2021 tantalum breakthrough material. Place 2021 reported avg T1=230 μs "
            "(range 150-300 μs), max device T1~360 μs, T2_echo=249 μs. Subsequent work "
            "with optimized fabrication (Ganjam 2024, Crisa 2025) has pushed memory T1 "
            "to >1 ms but typical transmon T1 remains in the few-hundred μs range. "
            "Requires heated substrate growth to obtain the bcc α-phase."
        ),
        references=[
            "Place et al. 2021, Nat Commun 12:1779 (T1=230μs avg, T2E=249μs)",
            "Wang et al. 2022, npj QI 8:3 (T1 up to 503μs with dry etch)",
            "Ganjam et al. 2024, Nat Commun 15:3687 (stripline memory T1>1ms)",
            "Crisa et al. 2025, arXiv:2503.14798 (Ta on Si, T1 up to 1.68ms)",
        ],
    ),
    SuperconductingFilm.BETA_TANTALUM: MaterialProperties(
        display_name="β-Tantalum (tetragonal, wrong phase)",
        role="film",
        confidence="measured",
        T1_us=5,
        T2_echo_us=3,
        T_phi_us=8,
        bias_eta=2,
        p_X_idle_per_us=0.2,
        p_Z_idle_per_us=0.2,
        p_leakage_per_gate=5e-3,
        p_seepage_per_cycle=5e-4,
        ZZ_crosstalk_kHz=200,
        non_markovian=True,
        gate_1q_fidelity=0.99,
        gate_2q_fidelity=0.92,
        anharmonicity_MHz=-220,
        readout_fidelity=0.85,
        yield_pct=30,
        notes="The 'wrong' phase — disastrous for qubits. Tc ~0.5 K vs ~4.4 K for α-Ta.",
    ),
    SuperconductingFilm.TANTALUM_AMORPHOUS: MaterialProperties(
        display_name="Amorphous tantalum",
        role="film",
        confidence="speculative",
        T1_us=20,
        T2_echo_us=15,
        bias_eta=2,
        notes="Disordered Ta film, mid-range performance.",
    ),
    SuperconductingFilm.TANTALUM_NITRIDE: MaterialProperties(
        display_name="Tantalum nitride",
        role="film",
        confidence="speculative",
        T1_us=50,
        T2_echo_us=40,
        bias_eta=3,
        notes="Higher Tc than pure Ta, less explored for qubits.",
    ),
    SuperconductingFilm.NIOBIUM: MaterialProperties(
        display_name="Niobium",
        role="film",
        confidence="measured",
        T1_us=50,                        # Bal 2024 baseline (native NbOx surface oxide)
        T2_echo_us=40,
        T_phi_us=100,                    # derived
        bias_eta=3,
        p_X_idle_per_us=1e-2,            # 1/T1
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
            "Workhorse material of the 2010s. Limited by lossy native NbOx surface oxides "
            "(Nb2O5/NbO/NbO2 mix). Capping with Ta, Al, or TiN gives 2-5x T1 improvement "
            "(Bal 2024). Baseline T1~50μs is the value before surface treatment."
        ),
        references=[
            "Bal et al. 2024, npj QI (baseline T1~50μs)",
            "Various IBM/Google qubit characterization papers, 2015-2020",
        ],
    ),
    SuperconductingFilm.NIOBIUM_NITRIDE: MaterialProperties(
        display_name="Niobium nitride",
        role="film",
        confidence="measured",
        T1_us=30,
        T2_echo_us=20,
        bias_eta=2,
        p_leakage_per_gate=5e-4,
        gate_2q_fidelity=0.98,
        anharmonicity_MHz=-200,
        notes="High Tc, useful for kinetic inductance designs.",
    ),
    SuperconductingFilm.NIOBIUM_TITANIUM_NITRIDE: MaterialProperties(
        display_name="Niobium titanium nitride",
        role="film",
        confidence="estimated",
        T1_us=40,
        T2_echo_us=30,
        bias_eta=2,
        notes="Lower loss variant of NbN.",
    ),
    SuperconductingFilm.NB3SN: MaterialProperties(
        display_name="Niobium-tin (Nb₃Sn)",
        role="film",
        confidence="speculative",
        T1_us=20,
        T2_echo_us=15,
        bias_eta=2,
        notes="Used in 3D cavity coatings, not planar qubits.",
    ),
    SuperconductingFilm.NB3GE: MaterialProperties(
        display_name="Niobium-germanium (Nb₃Ge)",
        role="film",
        confidence="speculative",
        T1_us=15,
        bias_eta=2,
        notes="Historical high-Tc material, rarely used in qubits.",
    ),
    SuperconductingFilm.NBTI: MaterialProperties(
        display_name="Niobium-titanium alloy",
        role="film",
        confidence="speculative",
        T1_us=40,
        bias_eta=2,
        notes="Common in magnet wire, occasionally in qubit research.",
    ),
    SuperconductingFilm.NBN_REACTIVE: MaterialProperties(
        display_name="NbN (reactive sputtered)",
        role="film",
        confidence="estimated",
        T1_us=30,
        T2_echo_us=20,
        bias_eta=2,
        notes="Process variant of NbN.",
    ),
    SuperconductingFilm.ALUMINUM: MaterialProperties(
        display_name="Aluminum",
        role="film",
        confidence="measured",
        T1_us=270,                       # Biznárová 2024: time-averaged up to 270μs (max 501μs)
        T2_echo_us=200,
        T_phi_us=450,                    # derived
        bias_eta=3,
        p_X_idle_per_us=3.7e-3,          # 1/T1
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
        yield_pct=75,
        parameter_variation_pct=30,
        drift_rate_per_hour=0.5,
        notes=(
            "Aluminum is the foundational material of superconducting qubits at multiple levels: "
            "(1) Universal junction material — every Al-AlOx-Al Josephson junction in modern qubits "
            "(including all Ta and Nb-based transmons) depends on aluminum and its 50-year-old "
            "thermal-oxidation tunnel barrier technology. (2) Modern Al-on-silicon transmons reach "
            "T1 = 270 μs time-averaged, 501 μs maximum (Biznárová 2024) when fabricated with thicker "
            "(>300 nm) films and HF surface preparation. (3) The Aalto 2025 millisecond-coherence "
            "transmon achieved T1 median 502 μs, T2_echo max 1057 μs operating at 2.9 GHz. "
            "Aluminum's relatively low superconducting gap means it is more sensitive to cosmic-ray "
            "bursts than higher-Tc materials, but in every other respect it remains a first-class "
            "qubit material."
        ),
        references=[
            "Biznárová et al. 2024, npj QI 10:78 (Al-on-Si T1=270μs avg, 501μs max)",
            "Tuokkola et al. 2025, Nat Commun 16:5421 (Aalto millisecond transmon)",
            "Koch et al. 2007, PRA 76:042319 (transmon proposal — Al-based)",
        ],
    ),
    SuperconductingFilm.ALUMINUM_HIGH_PURITY: MaterialProperties(
        display_name="Aluminum (6N high purity)",
        role="film",
        confidence="measured",
        T1_us=1000,                      # 3D cavity T1 can reach ms regime with 6N Al
        T2_echo_us=800,
        bias_eta=50,                     # 3D cavities have heavily biased noise
        gate_2q_fidelity=0.99,
        anharmonicity_MHz=-200,
        notes=(
            "Six-nines purity aluminum is the gold standard for 3D microwave cavities used in "
            "cat qubits, dual-rail encodings, and bosonic quantum memories. Machined high-purity "
            "aluminum cavities routinely achieve T1 in the millisecond range. This is a critical "
            "material for the Yale circuit-QED tradition and AWS's cat qubit roadmap."
        ),
        references=[
            "Reagor et al. 2013, APL 102:192604 (3D Al cavity T1 measurements)",
            "Ofek et al. 2016, Nature 536:441 (cat qubit in 3D Al cavity)",
        ],
    ),
    SuperconductingFilm.GRANULAR_ALUMINUM: MaterialProperties(
        display_name="Granular aluminum (grAl)",
        role="film",
        confidence="measured",
        T1_us=23,                        # Grünhaupt 2018: avg T1 = 23±4 μs
        T2_echo_us=46,                   # approaches 2*T1 limit
        T2_ramsey_us=30,                 # T2R ~30 μs at sweet spot
        T_phi_us=92,                     # derived
        bias_eta=15,                     # high bias from fluxonium-like physics
        p_X_idle_per_us=4.3e-2,          # 1/T1
        p_Z_idle_per_us=1.1e-2,
        p_leakage_per_gate=5e-5,         # large anharmonicity helps
        anharmonicity_MHz=-3000,
        notes=(
            "Superinductor material for fluxonium. High kinetic inductance, naturally biased "
            "noise. Grünhaupt 2018-2019 measured T1=23 μs in grAl fluxonium. NOTE: the 'millisecond "
            "fluxonium' from Somoroff 2023 (T2*=1.48ms) uses Al-AlOx-Al JJ arrays, NOT grAl — "
            "grAl-specific T1 remains in the ~20-65μs range based on published data."
        ),
        references=[
            "Grünhaupt et al. 2018-2019, Nat Mater 18:816 (grAl fluxonium, T1=23μs)",
            "(NOT to be confused with Somoroff 2023 which uses Al JJ arrays)",
        ],
    ),
    SuperconductingFilm.ALUMINUM_OXIDE_DOPED: MaterialProperties(
        display_name="Aluminum oxide doped",
        role="film",
        confidence="speculative",
        T1_us=50,
        bias_eta=3,
    ),
    SuperconductingFilm.TITANIUM_NITRIDE: MaterialProperties(
        display_name="Titanium nitride",
        role="film",
        confidence="measured",
        T1_us=150,
        T2_echo_us=100,
        bias_eta=4,
        p_leakage_per_gate=2e-4,
        gate_2q_fidelity=0.992,
        anharmonicity_MHz=-200,
        notes="High kinetic inductance, low loss. Good for resonators and fluxonium.",
    ),
    SuperconductingFilm.VANADIUM: MaterialProperties(
        display_name="Vanadium",
        role="film",
        confidence="speculative",
        T1_us=30,
        bias_eta=2,
        notes="Low Tc (~5K), occasionally researched as Ta alternative.",
    ),
    SuperconductingFilm.VANADIUM_NITRIDE: MaterialProperties(
        display_name="Vanadium nitride",
        role="film",
        confidence="speculative",
        T1_us=40,
        bias_eta=2,
    ),
    SuperconductingFilm.RHENIUM: MaterialProperties(
        display_name="Rhenium",
        role="film",
        confidence="speculative",
        T1_us=100,
        bias_eta=3,
        notes="Active research as Ta-alternative (similar oxide chemistry).",
    ),
    SuperconductingFilm.MOLYBDENUM: MaterialProperties(
        display_name="Molybdenum",
        role="film",
        confidence="speculative",
        T1_us=30,
        bias_eta=2,
    ),
    SuperconductingFilm.MOLYBDENUM_RHENIUM: MaterialProperties(
        display_name="Molybdenum-rhenium alloy",
        role="film",
        confidence="speculative",
        T1_us=50,
        bias_eta=2,
        notes="Used in some superconducting digital logic, not common for qubits.",
    ),
    SuperconductingFilm.TUNGSTEN: MaterialProperties(
        display_name="Tungsten",
        role="film",
        confidence="speculative",
        T1_us=10,
        bias_eta=2,
        notes="Very low Tc. Used for thermometers, not qubits.",
    ),
    SuperconductingFilm.HAFNIUM: MaterialProperties(
        display_name="Hafnium",
        role="film",
        confidence="speculative",
        T1_us=20,
        bias_eta=2,
    ),
    SuperconductingFilm.INDIUM: MaterialProperties(
        display_name="Indium",
        role="film",
        confidence="speculative",
        T1_us=30,
        bias_eta=2,
        notes="Soft metal, used mainly for bump bonds, not qubit electrodes.",
    ),
    SuperconductingFilm.TIN: MaterialProperties(
        display_name="Tin",
        role="film",
        confidence="speculative",
        T1_us=20,
        bias_eta=2,
        notes="Historical material.",
    ),
    SuperconductingFilm.LEAD: MaterialProperties(
        display_name="Lead",
        role="film",
        confidence="speculative",
        T1_us=10,
        bias_eta=2,
        notes="Historical, rarely used today.",
    ),
    SuperconductingFilm.MERCURY: MaterialProperties(
        display_name="Mercury",
        role="film",
        confidence="not_applicable",
        notes="Historical only. Original superconductor (1911). Not used in modern qubits.",
    ),
    SuperconductingFilm.MGB2: MaterialProperties(
        display_name="Magnesium diboride (MgB₂)",
        role="film",
        confidence="speculative",
        T1_us=20,
        bias_eta=2,
        notes="Higher-Tc material, niche use.",
    ),
    SuperconductingFilm.YBCO: MaterialProperties(
        display_name="YBCO (yttrium barium copper oxide)",
        role="film",
        confidence="speculative",
        T1_us=5,
        bias_eta=2,
        notes="High-Tc cuprate. Difficult to use for qubits — d-wave pairing causes losses.",
    ),
    SuperconductingFilm.BSCCO: MaterialProperties(
        display_name="BSCCO (bismuth strontium calcium copper oxide)",
        role="film",
        confidence="speculative",
        T1_us=5,
        bias_eta=2,
        notes="Similar issues to YBCO. Research-stage only.",
    ),
    SuperconductingFilm.FE_SE: MaterialProperties(
        display_name="Iron selenide",
        role="film",
        confidence="speculative",
        T1_us=10,
        bias_eta=2,
    ),
    SuperconductingFilm.NBN_DISORDERED: MaterialProperties(
        display_name="Disordered NbN",
        role="film",
        confidence="estimated",
        T1_us=100,
        bias_eta=8,
        notes="High kinetic inductance for superinductors.",
    ),
    SuperconductingFilm.TIN_DISORDERED: MaterialProperties(
        display_name="Disordered TiN",
        role="film",
        confidence="estimated",
        T1_us=100,
        bias_eta=6,
        notes="High kinetic inductance variant.",
    ),
    SuperconductingFilm.INOX_DISORDERED: MaterialProperties(
        display_name="Disordered indium oxide",
        role="film",
        confidence="speculative",
        T1_us=80,
        bias_eta=10,
        notes="Used in some superinductor experiments.",
    ),
    SuperconductingFilm.SNTE: MaterialProperties(
        display_name="Tin telluride (SnTe)",
        role="film",
        confidence="speculative",
        T1_us=20,
        bias_eta=2,
        notes="Topological semimetal, research stage.",
    ),
    SuperconductingFilm.ALUMINUM_ON_INAS: MaterialProperties(
        display_name="Aluminum on InAs (2DEG)",
        role="film",
        confidence="measured",
        T1_us=10,
        T2_echo_us=5,
        bias_eta=2,
        gate_2q_fidelity=0.95,
        notes="Hybrid superconductor-semiconductor stack. Gatemon and topological qubit base.",
    ),
    SuperconductingFilm.EPITAXIAL_AL_INAS: MaterialProperties(
        display_name="Epitaxial aluminum on InAs",
        role="film",
        confidence="measured",
        T1_us=15,
        T2_echo_us=8,
        bias_eta=2,
        notes="High-quality interface for topological qubit research. Microsoft program adjacent.",
    ),
}


# ============================================================
# JUNCTION MATERIALS — properties
# ============================================================

JUNCTION_PROPERTIES = {
    JunctionMaterial.AL_ALOX_AL: MaterialProperties(
        display_name="Al-AlOx-Al Josephson junction (generic)",
        role="junction",
        confidence="measured",
        charge_dispersion_kHz=0.01,
        p_leakage_per_gate=1e-4,
        yield_pct=85,
        parameter_variation_pct=30,
        notes=(
            "The Al-AlOx-Al Josephson junction is the foundation of essentially every modern "
            "superconducting qubit. Aluminum is evaporated, briefly exposed to oxygen to form "
            "a ~1-2 nm AlOx tunnel barrier, then a second aluminum layer is deposited. This "
            "50-year-old technology is universal across transmons regardless of their capacitor "
            "material (Ta, Nb, Al, TiN). Geometry variants (Dolan, Manhattan, bandage, merged) "
            "are detailed in separate entries below."
        ),
        references=[
            "Koch et al. 2007, PRA 76:042319",
            "Many subsequent papers — universal across the field",
        ],
    ),
    JunctionMaterial.AL_ALOX_AL_DOUBLE_OXIDE: MaterialProperties(
        display_name="Al-AlOx-Al with double oxidation",
        role="junction",
        confidence="estimated",
        charge_dispersion_kHz=0.008,
        yield_pct=82,
        notes="Two-step oxidation for better barrier uniformity.",
    ),
    JunctionMaterial.AL_ALOX_AL_DOLAN: MaterialProperties(
        display_name="Al-AlOx-Al Dolan bridge",
        role="junction",
        confidence="measured",
        charge_dispersion_kHz=0.01,
        p_leakage_per_gate=1e-4,
        yield_pct=85,
        parameter_variation_pct=30,
        notes="Free-hanging bridge double-angle evap. Bridge can collapse.",
    ),
    JunctionMaterial.AL_ALOX_AL_MANHATTAN: MaterialProperties(
        display_name="Al-AlOx-Al Manhattan style",
        role="junction",
        confidence="measured",
        charge_dispersion_kHz=0.008,
        p_leakage_per_gate=8e-5,
        yield_pct=92,
        parameter_variation_pct=20,
        notes="Two perpendicular wires. More uniform than Dolan.",
    ),
    JunctionMaterial.AL_ALOX_AL_BANDAGE: MaterialProperties(
        display_name="Al-AlOx-Al bandage junction",
        role="junction",
        confidence="estimated",
        charge_dispersion_kHz=0.012,
        yield_pct=88,
        notes="Extra Al patch bridges resistive native oxide.",
    ),
    JunctionMaterial.AL_ALOX_AL_MERGED_ELEMENT: MaterialProperties(
        display_name="Al-AlOx-Al merged-element transmon",
        role="junction",
        confidence="measured",
        charge_dispersion_kHz=0.005,
        p_leakage_per_gate=5e-5,
        yield_pct=80,
        parameter_variation_pct=15,
        notes="Junction integrated into capacitor. Lower dielectric loss.",
    ),
    JunctionMaterial.AL_ALOX_AL_OVERLAP: MaterialProperties(
        display_name="Al-AlOx-Al overlap",
        role="junction",
        confidence="estimated",
        charge_dispersion_kHz=0.01,
        yield_pct=85,
        notes="Two Al pads overlapping with oxide between.",
    ),
    JunctionMaterial.AL_ALOX_AL_SHADOW_EVAP: MaterialProperties(
        display_name="Al-AlOx-Al shadow-evaporated",
        role="junction",
        confidence="measured",
        charge_dispersion_kHz=0.01,
        yield_pct=88,
        notes="Catch-all term for double-angle shadow techniques.",
    ),
    JunctionMaterial.NB_ALOX_NB: MaterialProperties(
        display_name="Nb-AlOx-Nb",
        role="junction",
        confidence="estimated",
        charge_dispersion_kHz=0.02,
        p_leakage_per_gate=3e-4,
        yield_pct=85,
        notes="Nb-based junctions used in digital SC logic and some early qubits.",
    ),
    JunctionMaterial.NB_AL_ALOX_AL_NB: MaterialProperties(
        display_name="Nb-Al-AlOx-Al-Nb trilayer",
        role="junction",
        confidence="estimated",
        charge_dispersion_kHz=0.015,
        yield_pct=88,
        notes="Hybrid trilayer combining Nb electrodes with Al-AlOx tunnel.",
    ),
    JunctionMaterial.NBN_ALN_NBN: MaterialProperties(
        display_name="NbN-AlN-NbN trilayer",
        role="junction",
        confidence="estimated",
        charge_dispersion_kHz=0.03,
        yield_pct=80,
        notes="All-nitride junctions, higher Tc but different physics.",
    ),
    JunctionMaterial.NB_NBOX_NB: MaterialProperties(
        display_name="Nb-NbOx-Nb",
        role="junction",
        confidence="speculative",
        charge_dispersion_kHz=0.05,
        yield_pct=70,
        notes="Native Nb oxide barriers, rarely used.",
    ),
    JunctionMaterial.AL_HFOX_AL: MaterialProperties(
        display_name="Al-HfOx-Al",
        role="junction",
        confidence="speculative",
        charge_dispersion_kHz=0.01,
        yield_pct=80,
        notes="Research alternative to AlOx barrier.",
    ),
    JunctionMaterial.AL_TIOX_AL: MaterialProperties(
        display_name="Al-TiOx-Al",
        role="junction",
        confidence="speculative",
        charge_dispersion_kHz=0.015,
        yield_pct=75,
    ),
    JunctionMaterial.AL_MGOX_AL: MaterialProperties(
        display_name="Al-MgOx-Al",
        role="junction",
        confidence="speculative",
        charge_dispersion_kHz=0.012,
        yield_pct=78,
    ),
    JunctionMaterial.AL_AMORPHOUS_SI_AL: MaterialProperties(
        display_name="Al-amorphous-Si-Al",
        role="junction",
        confidence="speculative",
        charge_dispersion_kHz=0.02,
        yield_pct=70,
        notes="Amorphous Si barrier, research stage.",
    ),
    JunctionMaterial.INAS_AL_NANOWIRE: MaterialProperties(
        display_name="InAs-Al nanowire junction (gatemon)",
        role="junction",
        confidence="measured",
        charge_dispersion_kHz=10,                # high — the trade-off
        p_leakage_per_gate=3e-4,
        yield_pct=20,
        parameter_variation_pct=60,
        notes="Semiconductor-superconductor hybrid. Voltage-tunable. Microsoft topological-adjacent.",
    ),
    JunctionMaterial.INAS_AL_2DEG: MaterialProperties(
        display_name="InAs/Al 2DEG junction",
        role="junction",
        confidence="estimated",
        charge_dispersion_kHz=8,
        yield_pct=40,
        notes="Planar 2DEG version, less common than nanowire variant.",
    ),
    JunctionMaterial.INSB_AL_NANOWIRE: MaterialProperties(
        display_name="InSb-Al nanowire junction",
        role="junction",
        confidence="speculative",
        charge_dispersion_kHz=12,
        yield_pct=15,
        notes="Higher g-factor than InAs. Topological qubit research.",
    ),
    JunctionMaterial.GE_AL_NANOWIRE: MaterialProperties(
        display_name="Ge-Al nanowire junction",
        role="junction",
        confidence="speculative",
        charge_dispersion_kHz=8,
        yield_pct=25,
    ),
    JunctionMaterial.SI_AL_NANOWIRE: MaterialProperties(
        display_name="Si-Al nanowire junction",
        role="junction",
        confidence="speculative",
        charge_dispersion_kHz=6,
        yield_pct=30,
    ),
    JunctionMaterial.AL_CU_AL_SNS: MaterialProperties(
        display_name="Al-Cu-Al SNS junction",
        role="junction",
        confidence="estimated",
        charge_dispersion_kHz=5,
        yield_pct=60,
        notes="Superconductor-Normal-Superconductor. Used in some research designs.",
    ),
    JunctionMaterial.AL_AG_AL_SNS: MaterialProperties(
        display_name="Al-Ag-Al SNS junction",
        role="junction",
        confidence="speculative",
        charge_dispersion_kHz=4,
        yield_pct=60,
    ),
    JunctionMaterial.AL_AU_AL_SNS: MaterialProperties(
        display_name="Al-Au-Al SNS junction",
        role="junction",
        confidence="speculative",
        charge_dispersion_kHz=4,
        yield_pct=65,
    ),
    JunctionMaterial.NB_AU_NB_SNS: MaterialProperties(
        display_name="Nb-Au-Nb SNS junction",
        role="junction",
        confidence="speculative",
        charge_dispersion_kHz=6,
        yield_pct=60,
    ),
    JunctionMaterial.AL_GRAPHENE_AL: MaterialProperties(
        display_name="Al-graphene-Al junction",
        role="junction",
        confidence="speculative",
        charge_dispersion_kHz=2,
        yield_pct=20,
        notes="Graphene barrier — research stage.",
    ),
    JunctionMaterial.NBSE2_GRAPHENE_NBSE2: MaterialProperties(
        display_name="NbSe₂-graphene-NbSe₂ junction",
        role="junction",
        confidence="speculative",
        charge_dispersion_kHz=3,
        yield_pct=15,
        notes="2D-material-only junctions. Very early stage.",
    ),
    JunctionMaterial.INAS_AL_MAJORANA: MaterialProperties(
        display_name="InAs-Al Majorana junction",
        role="junction",
        confidence="speculative",
        charge_dispersion_kHz=15,
        yield_pct=5,
        notes="Topological qubit primitive. Microsoft program. Existence contested.",
    ),
    JunctionMaterial.HGTE_AL: MaterialProperties(
        display_name="HgTe-Al topological junction",
        role="junction",
        confidence="speculative",
        charge_dispersion_kHz=20,
        yield_pct=5,
        notes="Topological insulator base. Research stage.",
    ),
    JunctionMaterial.PB_PBOX_PB: MaterialProperties(
        display_name="Pb-PbOx-Pb",
        role="junction",
        confidence="not_applicable",
        notes="Historical (1960s-70s). Not used in modern qubits.",
    ),
    JunctionMaterial.GRAL_BRIDGE: MaterialProperties(
        display_name="Granular aluminum bridge",
        role="junction",
        confidence="estimated",
        notes="Kinetic-inductance bridge, not a true Josephson junction.",
    ),
    JunctionMaterial.NBN_BRIDGE: MaterialProperties(
        display_name="NbN kinetic inductance bridge",
        role="junction",
        confidence="estimated",
        notes="Kinetic-inductance bridge alternative to JJ.",
    ),
}


# ============================================================
# CAPPING MATERIALS — properties
# ============================================================

CAPPING_PROPERTIES = {
    CappingMaterial.NONE: MaterialProperties(
        display_name="No capping (bare surface)",
        role="capping",
        confidence="measured",
        notes="Baseline. Native oxide forms on air exposure.",
    ),
    CappingMaterial.TANTALUM_CAP: MaterialProperties(
        display_name="Tantalum cap",
        role="capping",
        confidence="measured",
        T1_us=300,                       # Bal 2024: median 300μs, max up to 600μs (550μs reported)
        notes=(
            "Ta cap on Nb is the standout result of Bal 2024: median T1=300μs, max~600μs, "
            "highest published T1 for Nb-based transmons. Mechanism: Ta2O5 native oxide is "
            "less lossy than Nb's amorphous NbOx mix. Works on both Si and sapphire substrates."
        ),
        references=["Bal et al. 2024, npj QI 10:43"],
    ),
    CappingMaterial.NIOBIUM_CAP: MaterialProperties(
        display_name="Niobium cap",
        role="capping",
        confidence="estimated",
        notes="Used in some Al-based stacks for surface protection.",
    ),
    CappingMaterial.TITANIUM_CAP: MaterialProperties(
        display_name="Titanium cap",
        role="capping",
        confidence="speculative",
        notes="Less common cap material.",
    ),
    CappingMaterial.GOLD_CAP: MaterialProperties(
        display_name="Gold cap",
        role="capping",
        confidence="estimated",
        notes="Gold prevents oxidation but is a normal metal — limits superconductivity at surface.",
    ),
    CappingMaterial.PLATINUM_CAP: MaterialProperties(
        display_name="Platinum cap",
        role="capping",
        confidence="speculative",
    ),
    CappingMaterial.ALUMINUM_CAP: MaterialProperties(
        display_name="Aluminum cap",
        role="capping",
        confidence="estimated",
        notes="Self-cap for Al films — forms native AlOx.",
    ),
    CappingMaterial.PALLADIUM_CAP: MaterialProperties(
        display_name="Palladium cap",
        role="capping",
        confidence="speculative",
    ),
    CappingMaterial.ALOX_CAP: MaterialProperties(
        display_name="Aluminum oxide cap",
        role="capping",
        confidence="estimated",
        notes="Controlled-thickness AlOx (vs native oxide). Better uniformity.",
    ),
    CappingMaterial.HFOX_CAP: MaterialProperties(
        display_name="Hafnium oxide cap",
        role="capping",
        confidence="speculative",
    ),
    CappingMaterial.SIOX_CAP: MaterialProperties(
        display_name="Silicon oxide cap",
        role="capping",
        confidence="estimated",
        notes="Generally adds loss. Avoid where possible.",
    ),
    CappingMaterial.AL2O3_ALD_CAP: MaterialProperties(
        display_name="ALD alumina cap",
        role="capping",
        confidence="estimated",
        notes="Atomic-layer-deposited alumina. Conformal but adds some TLS.",
    ),
    CappingMaterial.SIN_CAP: MaterialProperties(
        display_name="Silicon nitride cap",
        role="capping",
        confidence="speculative",
    ),
    CappingMaterial.ALN_CAP: MaterialProperties(
        display_name="Aluminum nitride cap",
        role="capping",
        confidence="speculative",
    ),
    CappingMaterial.TIN_CAP: MaterialProperties(
        display_name="Titanium nitride cap",
        role="capping",
        confidence="speculative",
    ),
    CappingMaterial.VACUUM_ENCAPSULATED: MaterialProperties(
        display_name="Vacuum encapsulation",
        role="capping",
        confidence="speculative",
        T1_us=2000,    # cutting-edge research result
        notes="2024-2025 cutting-edge — eliminates air-exposed oxide entirely.",
    ),
    CappingMaterial.PARYLENE: MaterialProperties(
        display_name="Parylene encapsulation",
        role="capping",
        confidence="speculative",
        notes="Polymer encapsulation. Used in some MEMS but rare for qubits.",
    ),
    CappingMaterial.HEXAGONAL_BN: MaterialProperties(
        display_name="Hexagonal boron nitride encapsulation",
        role="capping",
        confidence="speculative",
        notes="Atomically thin, low-loss insulator. Research stage.",
    ),
    CappingMaterial.HYDROGEN_TERMINATION: MaterialProperties(
        display_name="Hydrogen termination",
        role="capping",
        confidence="estimated",
        notes="H atoms passivate dangling bonds on Si surface.",
    ),
    CappingMaterial.FLUORINE_TERMINATION: MaterialProperties(
        display_name="Fluorine termination",
        role="capping",
        confidence="speculative",
    ),
}


# ============================================================
# DIELECTRIC MATERIALS — properties
# ============================================================

DIELECTRIC_PROPERTIES = {
    DielectricMaterial.VACUUM: MaterialProperties(
        display_name="Vacuum / air",
        role="dielectric",
        confidence="measured",
        notes="The best dielectric. Used in 3D cavities and air-bridges.",
    ),
    DielectricMaterial.NATIVE_AL_OXIDE: MaterialProperties(
        display_name="Native aluminum oxide",
        role="dielectric",
        confidence="measured",
        notes="Forms on Al exposure to air. Significant TLS contributor.",
    ),
    DielectricMaterial.NATIVE_NB_OXIDE: MaterialProperties(
        display_name="Native niobium oxide",
        role="dielectric",
        confidence="measured",
        notes="Multi-layer Nb2O5/NbO/NbO2 — main loss source in Nb qubits.",
    ),
    DielectricMaterial.NATIVE_TA_OXIDE: MaterialProperties(
        display_name="Native tantalum oxide",
        role="dielectric",
        confidence="measured",
        notes="Ta2O5 — much better behaved than Nb oxides. Key to Ta advantage.",
    ),
    DielectricMaterial.NATIVE_SI_OXIDE: MaterialProperties(
        display_name="Native silicon oxide",
        role="dielectric",
        confidence="measured",
        notes="SiO2 — high TLS density. Avoid where possible.",
    ),
    DielectricMaterial.SIO2_PECVD: MaterialProperties(
        display_name="PECVD silicon dioxide",
        role="dielectric",
        confidence="estimated",
        notes="High TLS, used in some bridges and crossovers.",
    ),
    DielectricMaterial.SIO2_THERMAL: MaterialProperties(
        display_name="Thermal silicon dioxide",
        role="dielectric",
        confidence="estimated",
        notes="Better than PECVD. Still adds TLS.",
    ),
    DielectricMaterial.SIN_PECVD: MaterialProperties(
        display_name="PECVD silicon nitride",
        role="dielectric",
        confidence="estimated",
    ),
    DielectricMaterial.SIN_LPCVD: MaterialProperties(
        display_name="LPCVD silicon nitride",
        role="dielectric",
        confidence="estimated",
        notes="Higher quality than PECVD.",
    ),
    DielectricMaterial.AL2O3_ALD: MaterialProperties(
        display_name="ALD aluminum oxide",
        role="dielectric",
        confidence="estimated",
        notes="Conformal, controlled thickness. Some TLS contribution.",
    ),
    DielectricMaterial.HFO2_ALD: MaterialProperties(
        display_name="ALD hafnium oxide",
        role="dielectric",
        confidence="speculative",
    ),
    DielectricMaterial.SAPPHIRE_DIELECTRIC: MaterialProperties(
        display_name="Sapphire (as dielectric)",
        role="dielectric",
        confidence="measured",
        notes="Excellent low-loss dielectric.",
    ),
    DielectricMaterial.QUARTZ_DIELECTRIC: MaterialProperties(
        display_name="Quartz (as dielectric)",
        role="dielectric",
        confidence="estimated",
    ),
    DielectricMaterial.SILICON_DIELECTRIC: MaterialProperties(
        display_name="Silicon (as dielectric)",
        role="dielectric",
        confidence="estimated",
    ),
    DielectricMaterial.DIAMOND_DIELECTRIC: MaterialProperties(
        display_name="Diamond (as dielectric)",
        role="dielectric",
        confidence="estimated",
        notes="Ultra-low loss but expensive.",
    ),
    DielectricMaterial.BCB: MaterialProperties(
        display_name="Benzocyclobutene (BCB)",
        role="dielectric",
        confidence="speculative",
        notes="Polymer used in some interlayer dielectrics. High loss.",
    ),
    DielectricMaterial.SU8: MaterialProperties(
        display_name="SU-8 photoresist",
        role="dielectric",
        confidence="speculative",
        notes="Photoresist used as permanent structure. Lossy.",
    ),
    DielectricMaterial.POLYIMIDE: MaterialProperties(
        display_name="Polyimide",
        role="dielectric",
        confidence="speculative",
        notes="Flexible polymer dielectric.",
    ),
}


# ============================================================
# 3D CAVITY MATERIALS — properties
# ============================================================

CAVITY_PROPERTIES = {
    CavityMaterial.ALUMINUM_5N: MaterialProperties(
        display_name="Aluminum 5N purity cavity",
        role="cavity",
        confidence="measured",
        T1_us=1000,
        bias_eta=100,
        notes="Standard machined Al 3D cavity.",
    ),
    CavityMaterial.ALUMINUM_6N: MaterialProperties(
        display_name="Aluminum 6N high-purity cavity",
        role="cavity",
        confidence="measured",
        T1_us=2000,
        bias_eta=200,
        notes="Yale-style ultra-high-Q machined cavity.",
    ),
    CavityMaterial.ALUMINUM_HIPS: MaterialProperties(
        display_name="High-purity machined aluminum cavity",
        role="cavity",
        confidence="measured",
        T1_us=2000,
        bias_eta=200,
        notes="Used for cat qubit and dual-rail experiments.",
    ),
    CavityMaterial.NIOBIUM_BULK: MaterialProperties(
        display_name="Bulk niobium 3D cavity",
        role="cavity",
        confidence="measured",
        T1_us=3000,
        bias_eta=300,
        notes="Higher Q than Al. Standard for SRF accelerator-style cavities.",
    ),
    CavityMaterial.NIOBIUM_HPS: MaterialProperties(
        display_name="High-purity Nb cavity",
        role="cavity",
        confidence="measured",
        T1_us=5000,
        bias_eta=500,
        notes="State-of-the-art for cat qubit storage modes.",
    ),
    CavityMaterial.NIOBIUM_ELECTROPOLISHED: MaterialProperties(
        display_name="Electropolished Nb cavity",
        role="cavity",
        confidence="measured",
        T1_us=4000,
        bias_eta=400,
        notes="Surface treatment to remove damaged layer.",
    ),
    CavityMaterial.NIOBIUM_BCP: MaterialProperties(
        display_name="Buffer chemical polished Nb cavity",
        role="cavity",
        confidence="estimated",
        T1_us=3500,
        bias_eta=350,
    ),
    CavityMaterial.NB3SN_CAVITY: MaterialProperties(
        display_name="Nb₃Sn-coated cavity",
        role="cavity",
        confidence="speculative",
        T1_us=5000,
        bias_eta=500,
        notes="Higher Tc material applied to Nb cavity. Research stage.",
    ),
    CavityMaterial.COAXIAL_POST_AL: MaterialProperties(
        display_name="Coaxial post Al cavity",
        role="cavity",
        confidence="estimated",
        T1_us=1500,
        bias_eta=150,
    ),
    CavityMaterial.COAXIAL_POST_NB: MaterialProperties(
        display_name="Coaxial post Nb cavity",
        role="cavity",
        confidence="estimated",
        T1_us=3000,
        bias_eta=300,
    ),
    CavityMaterial.STRIPLINE_AL: MaterialProperties(
        display_name="Stripline Al cavity",
        role="cavity",
        confidence="estimated",
        T1_us=800,
        bias_eta=80,
    ),
    CavityMaterial.STRIPLINE_TA: MaterialProperties(
        display_name="Stripline Ta cavity",
        role="cavity",
        confidence="measured",
        T1_us=1000,
        bias_eta=100,
        notes="Ganjam 2024 stripline architecture.",
        references=["Ganjam 2024"],
    ),
    CavityMaterial.PHOTONIC_CRYSTAL_SI: MaterialProperties(
        display_name="Photonic crystal cavity (Si)",
        role="cavity",
        confidence="speculative",
        T1_us=500,
        bias_eta=50,
        notes="Research stage. Used for optical-microwave conversion.",
    ),
}


# ============================================================
# SUPERINDUCTOR MATERIALS — properties
# ============================================================

SUPERINDUCTOR_PROPERTIES = {
    SuperinductorMaterial.GRANULAR_ALUMINUM_HIGH_R: MaterialProperties(
        display_name="High-resistivity granular Al",
        role="superinductor",
        confidence="measured",
        T1_us=200,
        bias_eta=15,
        anharmonicity_MHz=-3000,
        notes="Used in fluxonium. High kinetic inductance.",
    ),
    SuperinductorMaterial.GRANULAR_ALUMINUM_LOW_R: MaterialProperties(
        display_name="Low-resistivity granular Al",
        role="superinductor",
        confidence="estimated",
        T1_us=150,
        bias_eta=8,
        notes="Less disordered grAl, lower inductance.",
    ),
    SuperinductorMaterial.NBN_HIGH_KI: MaterialProperties(
        display_name="High kinetic inductance NbN",
        role="superinductor",
        confidence="estimated",
        T1_us=100,
        bias_eta=10,
        notes="Alternative to grAl for superinductors.",
    ),
    SuperinductorMaterial.TIN_HIGH_KI: MaterialProperties(
        display_name="High kinetic inductance TiN",
        role="superinductor",
        confidence="measured",
        T1_us=150,
        bias_eta=8,
        notes="TiN-based superinductor.",
    ),
    SuperinductorMaterial.NBTIN_HIGH_KI: MaterialProperties(
        display_name="High kinetic inductance NbTiN",
        role="superinductor",
        confidence="estimated",
        T1_us=120,
        bias_eta=10,
    ),
    SuperinductorMaterial.INOX_HIGH_KI: MaterialProperties(
        display_name="High kinetic inductance indium oxide",
        role="superinductor",
        confidence="speculative",
        T1_us=80,
        bias_eta=10,
    ),
    SuperinductorMaterial.JJ_ARRAY_AL: MaterialProperties(
        display_name="Aluminum Josephson junction array",
        role="superinductor",
        confidence="measured",
        T1_us=150,
        bias_eta=12,
        notes="Series of small JJs acts as inductor. Original fluxonium design.",
    ),
    SuperinductorMaterial.JJ_ARRAY_NB: MaterialProperties(
        display_name="Niobium Josephson junction array",
        role="superinductor",
        confidence="estimated",
        T1_us=100,
        bias_eta=10,
    ),
    SuperinductorMaterial.NBTIN_NANOWIRE: MaterialProperties(
        display_name="NbTiN nanowire inductor",
        role="superinductor",
        confidence="estimated",
        T1_us=100,
        bias_eta=8,
    ),
    SuperinductorMaterial.NBN_NANOWIRE: MaterialProperties(
        display_name="NbN nanowire inductor",
        role="superinductor",
        confidence="estimated",
        T1_us=80,
        bias_eta=8,
    ),
    SuperinductorMaterial.NIOBIUM_SPIRAL: MaterialProperties(
        display_name="Niobium geometric spiral",
        role="superinductor",
        confidence="measured",
        T1_us=80,
        bias_eta=5,
        notes="Pure geometric inductance, no kinetic component.",
    ),
    SuperinductorMaterial.ALUMINUM_SPIRAL: MaterialProperties(
        display_name="Aluminum geometric spiral",
        role="superinductor",
        confidence="estimated",
        T1_us=60,
        bias_eta=4,
    ),
}


# ============================================================
# WIRING MATERIALS — properties
# ============================================================

WIRING_PROPERTIES = {
    WiringMaterial.GOLD_BOND_WIRE: MaterialProperties(
        display_name="Gold bond wire",
        role="wiring",
        confidence="measured",
        notes="Standard bond wire. Normal metal — adds loss at interface.",
    ),
    WiringMaterial.ALUMINUM_BOND_WIRE: MaterialProperties(
        display_name="Aluminum bond wire",
        role="wiring",
        confidence="measured",
        notes="Superconducting at base temp. Preferred for qubits.",
    ),
    WiringMaterial.INDIUM_BUMP: MaterialProperties(
        display_name="Indium bump bond",
        role="wiring",
        confidence="measured",
        notes="Soft superconductor, used in flip-chip stacks.",
    ),
    WiringMaterial.GOLD_BUMP: MaterialProperties(
        display_name="Gold bump bond",
        role="wiring",
        confidence="estimated",
        notes="Normal metal bump — limits performance.",
    ),
    WiringMaterial.COPPER_PILLAR: MaterialProperties(
        display_name="Copper pillar bump",
        role="wiring",
        confidence="speculative",
        notes="Standard semiconductor packaging tech. Adapted for cryo.",
    ),
    WiringMaterial.TSV_COPPER: MaterialProperties(
        display_name="Copper through-silicon via",
        role="wiring",
        confidence="estimated",
        notes="Standard CMOS TSV. Adds loss but enables 3D integration.",
    ),
    WiringMaterial.TSV_TUNGSTEN: MaterialProperties(
        display_name="Tungsten through-silicon via",
        role="wiring",
        confidence="speculative",
    ),
    WiringMaterial.TSV_SUPERCONDUCTING: MaterialProperties(
        display_name="Superconducting through-silicon via",
        role="wiring",
        confidence="speculative",
        notes="Nb-filled TSV. Research stage. Critical for chiplet stacking.",
    ),
}


# ============================================================
# MASTER REGISTRY — unified access to everything
# ============================================================

ALL_PROPERTIES = {
    **SUBSTRATE_PROPERTIES,
    **FILM_PROPERTIES,
    **JUNCTION_PROPERTIES,
    **CAPPING_PROPERTIES,
    **DIELECTRIC_PROPERTIES,
    **CAVITY_PROPERTIES,
    **SUPERINDUCTOR_PROPERTIES,
    **WIRING_PROPERTIES,
}


def get(material_enum) -> MaterialProperties:
    """Look up properties for any material enum value."""
    return ALL_PROPERTIES[material_enum]


def list_by_confidence(level: str) -> list[MaterialProperties]:
    return [p for p in ALL_PROPERTIES.values() if p.confidence == level]


# ============================================================
# DEMO / SANITY CHECK
# ============================================================

if __name__ == "__main__":
    from material_names import (
        ALL_SUBSTRATES, ALL_FILMS, ALL_JUNCTIONS, ALL_CAPPINGS,
        ALL_DIELECTRICS, ALL_CAVITIES, ALL_SUPERINDUCTORS, ALL_WIRING,
    )
    
    print("=== Coverage check ===\n")
    print(f"Substrates:        {len(SUBSTRATE_PROPERTIES)}/{len(ALL_SUBSTRATES)}")
    print(f"SC Films:          {len(FILM_PROPERTIES)}/{len(ALL_FILMS)}")
    print(f"Junctions:         {len(JUNCTION_PROPERTIES)}/{len(ALL_JUNCTIONS)}")
    print(f"Cappings:          {len(CAPPING_PROPERTIES)}/{len(ALL_CAPPINGS)}")
    print(f"Dielectrics:       {len(DIELECTRIC_PROPERTIES)}/{len(ALL_DIELECTRICS)}")
    print(f"Cavities:          {len(CAVITY_PROPERTIES)}/{len(ALL_CAVITIES)}")
    print(f"Superinductors:    {len(SUPERINDUCTOR_PROPERTIES)}/{len(ALL_SUPERINDUCTORS)}")
    print(f"Wiring:            {len(WIRING_PROPERTIES)}/{len(ALL_WIRING)}")
    
    print(f"\nTotal materials with properties: {len(ALL_PROPERTIES)}")
    
    print("\n=== Confidence breakdown ===\n")
    for level in ["measured", "estimated", "speculative", "not_applicable"]:
        items = list_by_confidence(level)
        print(f"  {level:<20} {len(items)} materials")
    
    print("\n=== Example: α-Tantalum full profile ===\n")
    ta = get(SuperconductingFilm.ALPHA_TANTALUM)
    print(f"Name:         {ta.display_name}")
    print(f"Role:         {ta.role}")
    print(f"Confidence:   {ta.confidence}")
    print(f"T1 / T2 echo: {ta.T1_us} μs / {ta.T2_echo_us} μs")
    print(f"Bias η:       {ta.bias_eta}")
    print(f"2Q fidelity:  {ta.gate_2q_fidelity}")
    print(f"Yield:        {ta.yield_pct}%")
    print(f"References:   {ta.references}")

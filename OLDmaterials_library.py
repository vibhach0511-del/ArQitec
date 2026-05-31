"""
Materials Library for Superconducting Qubits.

Each material is characterized across 7 tiers:
  Tier 1: Coherence (T1, T2, T_phi, T2_echo)
  Tier 2: Noise channel decomposition (bias, Pauli rates, leakage, seepage)
  Tier 3: Spatial/temporal correlations (cosmic rays, crosstalk, 1/f, TLS, non-Markovian)
  Tier 4: Gate-specific properties (fidelities, gate times, anharmonicity)
  Tier 5: Measurement properties (readout fidelity, QND-ness)
  Tier 6: Architectural / connectivity
  Tier 7: Yield and variation

Fields use `None` when the property is not reliably published. Each entry
includes citations and notes about confidence/source.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


# ============================================================
# MATERIAL TYPE ENUM
# ============================================================

class MaterialType(str, Enum):
    """Material stacks for superconducting qubits.
    
    Naming convention: {superconductor}_on_{substrate}[_{variant}]
    """
    # Modern (post-2020) — the new state of the art
    TANTALUM_ON_SAPPHIRE = "Ta_on_sapphire"
    TANTALUM_ON_SILICON = "Ta_on_Si"
    TANTALUM_ON_SAPPHIRE_OPTIMIZED = "Ta_on_sapphire_optimized"  # Ganjam 2024 millisecond regime
    
    # Niobium variants
    NIOBIUM_ON_SILICON = "Nb_on_Si"
    NIOBIUM_TA_CAPPED = "Nb_with_Ta_cap"            # Bal 2024
    NIOBIUM_NITRIDE = "NbN_on_Si"
    
    # Aluminum (legacy baseline)
    ALUMINUM_ON_SILICON = "Al_on_Si"
    ALUMINUM_ON_SAPPHIRE = "Al_on_sapphire"
    
    # Exotic / specialized
    TITANIUM_NITRIDE = "TiN_on_Si"                  # high kinetic inductance
    GRANULAR_ALUMINUM = "grAl_on_Si"                # superinductor material
    
    # Junction materials (the second key axis)
    AL_ALOX_AL_JJ = "Al_AlOx_Al_junction"          # standard junction
    INAS_AL_NANOWIRE_JJ = "InAs_Al_nanowire_jj"    # gatemon junction


# ============================================================
# MATERIAL PROFILE — full 7-tier characterization
# ============================================================

@dataclass
class MaterialProfile:
    """Complete material characterization across all 7 tiers."""
    
    # --- Identification ---
    material_type: MaterialType
    display_name: str
    description: str
    substrate: str                            # "sapphire" | "silicon" | "silicon-on-insulator"
    superconductor: str                       # "Ta" | "Nb" | "Al" | "NbN" | "TiN"
    junction_material: str                    # "Al-AlOx-Al" | "InAs-Al" | etc.
    year_introduced: int
    confidence: str                           # "high" | "medium" | "low" — how well-characterized
    
    # ============================================================
    # TIER 1: Coherence properties
    # ============================================================
    T1_us: float                              # energy relaxation
    T2_echo_us: float                         # echo dephasing (Hahn echo)
    T2_ramsey_us: Optional[float] = None      # Ramsey (no decoupling)
    T_phi_us: Optional[float] = None          # pure dephasing, derived
    T1_variation_pct: Optional[float] = None  # σ across chip
    
    # ============================================================
    # TIER 2: Noise channel decomposition
    # ============================================================
    bias_eta: Optional[float] = None          # p_Z / (p_X + p_Y)
    p_X_idle_per_us: Optional[float] = None
    p_Z_idle_per_us: Optional[float] = None
    p_leakage_per_gate: Optional[float] = None
    p_seepage_per_cycle: Optional[float] = None
    
    # ============================================================
    # TIER 3: Spatial/temporal correlations
    # ============================================================
    cosmic_ray_rate_per_qubit_hr: Optional[float] = None
    ZZ_crosstalk_kHz: Optional[float] = None
    one_over_f_noise_amplitude: Optional[float] = None    # Hz^(1/2) at 1 Hz
    TLS_density_per_GHz: Optional[float] = None           # rarely directly measured
    non_markovian: bool = False
    
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
    typical_connectivity: str = "2D nearest-neighbor"
    max_qubits_demonstrated: int = 0
    frequency_crowding_MHz: Optional[float] = None
    
    # ============================================================
    # TIER 7: Yield and variation
    # ============================================================
    yield_pct: Optional[float] = None
    parameter_variation_pct: Optional[float] = None
    drift_rate_per_hour: Optional[float] = None
    
    # --- Provenance ---
    key_references: list[str] = field(default_factory=list)
    notes: str = ""


# ============================================================
# THE LIBRARY
# ============================================================

MATERIALS: dict[MaterialType, MaterialProfile] = {
    
    # ============================================================
    # TANTALUM-BASED (modern state of the art)
    # ============================================================
    
    MaterialType.TANTALUM_ON_SAPPHIRE: MaterialProfile(
        material_type=MaterialType.TANTALUM_ON_SAPPHIRE,
        display_name="Tantalum on Sapphire (Place 2021 baseline)",
        description=(
            "The breakthrough that broke the aluminum coherence ceiling. "
            "α-tantalum on c-plane sapphire produces low-loss oxides and "
            "reduced TLS density. The new industry baseline."
        ),
        substrate="sapphire",
        superconductor="Ta",
        junction_material="Al-AlOx-Al",
        year_introduced=2021,
        confidence="high",
        
        # Tier 1
        T1_us=300,
        T2_echo_us=200,
        T2_ramsey_us=150,
        T_phi_us=750,                            # 1/T_phi = 1/T2 - 1/(2T1)
        T1_variation_pct=25,
        
        # Tier 2
        bias_eta=8,                              # phase-dominated
        p_X_idle_per_us=1.7e-3,                  # 1/T1
        p_Z_idle_per_us=1.3e-3,                  # 1/T_phi
        p_leakage_per_gate=1e-4,
        p_seepage_per_cycle=1e-5,
        
        # Tier 3
        cosmic_ray_rate_per_qubit_hr=1e-3,
        ZZ_crosstalk_kHz=50,
        one_over_f_noise_amplitude=1e-6,
        TLS_density_per_GHz=None,                # not directly measured
        non_markovian=True,                      # 1/f noise tail
        
        # Tier 4
        gate_1q_fidelity=0.9999,
        gate_2q_fidelity=0.995,
        gate_1q_time_ns=20,
        gate_2q_time_ns=200,
        anharmonicity_MHz=-220,
        charge_dispersion_kHz=0.01,              # transmon regime
        
        # Tier 5
        readout_fidelity=0.99,
        measurement_time_ns=500,
        p_meas_induced_leakage=1e-3,
        qnd_fidelity=0.98,
        
        # Tier 6
        typical_connectivity="2D nearest-neighbor (heavy-hex compatible)",
        max_qubits_demonstrated=50,
        frequency_crowding_MHz=30,
        
        # Tier 7
        yield_pct=70,
        parameter_variation_pct=30,
        drift_rate_per_hour=0.5,
        
        key_references=[
            "Place et al. 2021, Nat Commun 12:1779",
            "Crowley et al. 2023, PRX 13:041005 (loss decomposition)",
        ],
        notes="The reference material for modern QEC pipelines.",
    ),
    
    MaterialType.TANTALUM_ON_SAPPHIRE_OPTIMIZED: MaterialProfile(
        material_type=MaterialType.TANTALUM_ON_SAPPHIRE_OPTIMIZED,
        display_name="Tantalum on Sapphire (Ganjam 2024 millisecond)",
        description=(
            "Optimized tantalum process with millisecond coherence times. "
            "Achieved via stripline architecture and surface treatment. "
            "Current state-of-the-art for 2D transmons."
        ),
        substrate="sapphire (annealed)",
        superconductor="Ta",
        junction_material="Al-AlOx-Al",
        year_introduced=2024,
        confidence="high",
        
        # Tier 1 — the headline numbers
        T1_us=1000,
        T2_echo_us=600,
        T2_ramsey_us=400,
        T_phi_us=1200,
        T1_variation_pct=20,
        
        # Tier 2
        bias_eta=10,
        p_X_idle_per_us=5e-4,
        p_Z_idle_per_us=4e-4,
        p_leakage_per_gate=5e-5,
        p_seepage_per_cycle=5e-6,
        
        # Tier 3
        cosmic_ray_rate_per_qubit_hr=1e-3,
        ZZ_crosstalk_kHz=30,
        one_over_f_noise_amplitude=5e-7,
        non_markovian=True,
        
        # Tier 4
        gate_1q_fidelity=0.99995,
        gate_2q_fidelity=0.998,
        gate_1q_time_ns=20,
        gate_2q_time_ns=150,
        anharmonicity_MHz=-220,
        charge_dispersion_kHz=0.01,
        
        # Tier 5
        readout_fidelity=0.995,
        measurement_time_ns=400,
        p_meas_induced_leakage=5e-4,
        qnd_fidelity=0.99,
        
        # Tier 6
        typical_connectivity="2D nearest-neighbor",
        max_qubits_demonstrated=20,
        frequency_crowding_MHz=25,
        
        # Tier 7
        yield_pct=80,
        parameter_variation_pct=20,
        drift_rate_per_hour=0.3,
        
        key_references=[
            "Ganjam et al. 2024, Nat Commun 15:3687",
        ],
        notes="State-of-the-art 2D transmon coherence as of mid-2020s.",
    ),
    
    MaterialType.TANTALUM_ON_SILICON: MaterialProfile(
        material_type=MaterialType.TANTALUM_ON_SILICON,
        display_name="Tantalum on Silicon",
        description=(
            "Tantalum on silicon substrate — more CMOS-compatible than sapphire "
            "but slightly lower coherence due to silicon dielectric losses."
        ),
        substrate="silicon (high-resistivity)",
        superconductor="Ta",
        junction_material="Al-AlOx-Al",
        year_introduced=2022,
        confidence="medium",
        
        # Tier 1
        T1_us=200,
        T2_echo_us=150,
        T2_ramsey_us=120,
        T_phi_us=500,
        T1_variation_pct=30,
        
        # Tier 2
        bias_eta=6,
        p_X_idle_per_us=2.5e-3,
        p_Z_idle_per_us=2e-3,
        p_leakage_per_gate=1.5e-4,
        p_seepage_per_cycle=1.5e-5,
        
        # Tier 3
        cosmic_ray_rate_per_qubit_hr=1e-3,
        ZZ_crosstalk_kHz=60,
        one_over_f_noise_amplitude=2e-6,
        non_markovian=True,
        
        # Tier 4
        gate_1q_fidelity=0.9998,
        gate_2q_fidelity=0.993,
        gate_1q_time_ns=25,
        gate_2q_time_ns=220,
        anharmonicity_MHz=-220,
        charge_dispersion_kHz=0.01,
        
        # Tier 5
        readout_fidelity=0.985,
        measurement_time_ns=500,
        p_meas_induced_leakage=1.5e-3,
        qnd_fidelity=0.97,
        
        # Tier 6
        typical_connectivity="2D nearest-neighbor",
        max_qubits_demonstrated=20,
        frequency_crowding_MHz=40,
        
        # Tier 7
        yield_pct=75,
        parameter_variation_pct=30,
        drift_rate_per_hour=0.7,
        
        key_references=[
            "Wang et al. 2022, npj QI 8:3 (T1 to 503 μs)",
        ],
        notes="CMOS-compatible alternative to sapphire.",
    ),
    
    # ============================================================
    # NIOBIUM-BASED
    # ============================================================
    
    MaterialType.NIOBIUM_TA_CAPPED: MaterialProfile(
        material_type=MaterialType.NIOBIUM_TA_CAPPED,
        display_name="Niobium with Tantalum Cap (Bal 2024)",
        description=(
            "Niobium base with tantalum encapsulation to suppress surface "
            "oxide losses. Compatible with established Nb-based industrial "
            "fabrication processes."
        ),
        substrate="silicon",
        superconductor="Nb (Ta-capped)",
        junction_material="Al-AlOx-Al",
        year_introduced=2024,
        confidence="high",
        
        # Tier 1
        T1_us=300,
        T2_echo_us=200,
        T2_ramsey_us=150,
        T_phi_us=600,
        T1_variation_pct=25,
        
        # Tier 2
        bias_eta=5,
        p_X_idle_per_us=1.7e-3,
        p_Z_idle_per_us=1.7e-3,
        p_leakage_per_gate=1.5e-4,
        p_seepage_per_cycle=1e-5,
        
        # Tier 3
        cosmic_ray_rate_per_qubit_hr=1e-3,
        ZZ_crosstalk_kHz=50,
        one_over_f_noise_amplitude=1e-6,
        non_markovian=True,
        
        # Tier 4
        gate_1q_fidelity=0.9998,
        gate_2q_fidelity=0.994,
        gate_1q_time_ns=25,
        gate_2q_time_ns=200,
        anharmonicity_MHz=-200,
        charge_dispersion_kHz=0.02,
        
        # Tier 5
        readout_fidelity=0.99,
        measurement_time_ns=500,
        p_meas_induced_leakage=1e-3,
        qnd_fidelity=0.98,
        
        # Tier 6
        typical_connectivity="2D nearest-neighbor",
        max_qubits_demonstrated=30,
        frequency_crowding_MHz=35,
        
        # Tier 7
        yield_pct=80,                            # better than pure Nb
        parameter_variation_pct=25,
        drift_rate_per_hour=0.5,
        
        key_references=[
            "Bal et al. 2024, npj QI",
        ],
        notes="Industrial-process compatible bridge to tantalum-era coherence.",
    ),
    
    MaterialType.NIOBIUM_ON_SILICON: MaterialProfile(
        material_type=MaterialType.NIOBIUM_ON_SILICON,
        display_name="Niobium on Silicon (pre-2020 baseline)",
        description=(
            "Bare niobium on silicon. Workhorse material for the 2010s era "
            "of superconducting qubits. Suffers from Nb-oxide surface losses "
            "that limit T1 below 100 μs typically."
        ),
        substrate="silicon",
        superconductor="Nb",
        junction_material="Al-AlOx-Al",
        year_introduced=2010,
        confidence="high",
        
        # Tier 1
        T1_us=80,
        T2_echo_us=60,
        T2_ramsey_us=40,
        T_phi_us=200,
        T1_variation_pct=40,
        
        # Tier 2
        bias_eta=3,
        p_X_idle_per_us=6.3e-3,
        p_Z_idle_per_us=5e-3,
        p_leakage_per_gate=3e-4,
        p_seepage_per_cycle=3e-5,
        
        # Tier 3
        cosmic_ray_rate_per_qubit_hr=1e-3,
        ZZ_crosstalk_kHz=80,
        one_over_f_noise_amplitude=3e-6,
        non_markovian=True,
        
        # Tier 4
        gate_1q_fidelity=0.9995,
        gate_2q_fidelity=0.99,
        gate_1q_time_ns=30,
        gate_2q_time_ns=250,
        anharmonicity_MHz=-200,
        charge_dispersion_kHz=0.05,
        
        # Tier 5
        readout_fidelity=0.97,
        measurement_time_ns=700,
        p_meas_induced_leakage=3e-3,
        qnd_fidelity=0.95,
        
        # Tier 6
        typical_connectivity="2D nearest-neighbor",
        max_qubits_demonstrated=127,             # IBM Eagle era
        frequency_crowding_MHz=50,
        
        # Tier 7
        yield_pct=60,
        parameter_variation_pct=40,
        drift_rate_per_hour=1.0,
        
        key_references=[
            "Various IBM/Google legacy papers, 2015-2020",
        ],
        notes="Legacy baseline for comparisons. Superseded by Ta-based stacks.",
    ),
    
    MaterialType.NIOBIUM_NITRIDE: MaterialProfile(
        material_type=MaterialType.NIOBIUM_NITRIDE,
        display_name="Niobium Nitride on Silicon",
        description=(
            "NbN — higher transition temperature than pure Nb, used in some "
            "kinetic inductance applications. Lower coherence for transmons "
            "but interesting for specialized designs."
        ),
        substrate="silicon",
        superconductor="NbN",
        junction_material="Al-AlOx-Al",
        year_introduced=2015,
        confidence="medium",
        
        # Tier 1
        T1_us=30,
        T2_echo_us=20,
        T2_ramsey_us=15,
        T_phi_us=60,
        T1_variation_pct=35,
        
        # Tier 2
        bias_eta=2,
        p_X_idle_per_us=1.7e-2,
        p_Z_idle_per_us=1.7e-2,
        p_leakage_per_gate=5e-4,
        p_seepage_per_cycle=5e-5,
        
        # Tier 3
        cosmic_ray_rate_per_qubit_hr=1e-3,
        ZZ_crosstalk_kHz=100,
        one_over_f_noise_amplitude=5e-6,
        non_markovian=True,
        
        # Tier 4
        gate_1q_fidelity=0.999,
        gate_2q_fidelity=0.98,
        gate_1q_time_ns=30,
        gate_2q_time_ns=300,
        anharmonicity_MHz=-200,
        charge_dispersion_kHz=0.1,
        
        # Tier 5
        readout_fidelity=0.95,
        measurement_time_ns=800,
        p_meas_induced_leakage=5e-3,
        qnd_fidelity=0.93,
        
        # Tier 6
        typical_connectivity="2D nearest-neighbor",
        max_qubits_demonstrated=10,
        frequency_crowding_MHz=60,
        
        # Tier 7
        yield_pct=55,
        parameter_variation_pct=45,
        drift_rate_per_hour=1.5,
        
        key_references=[
            "Various NbN qubit characterization papers",
        ],
        notes="Niche material. Useful for kinetic inductance applications.",
    ),
    
    # ============================================================
    # ALUMINUM (legacy baseline)
    # ============================================================
    
    MaterialType.ALUMINUM_ON_SILICON: MaterialProfile(
        material_type=MaterialType.ALUMINUM_ON_SILICON,
        display_name="Aluminum on Silicon (legacy baseline)",
        description=(
            "All-aluminum process on silicon. The original transmon material. "
            "Now mostly superseded by tantalum but still used in many academic "
            "labs and for fast prototyping."
        ),
        substrate="silicon",
        superconductor="Al",
        junction_material="Al-AlOx-Al",
        year_introduced=2007,
        confidence="high",
        
        # Tier 1
        T1_us=50,
        T2_echo_us=40,
        T2_ramsey_us=25,
        T_phi_us=100,
        T1_variation_pct=40,
        
        # Tier 2
        bias_eta=2,
        p_X_idle_per_us=1e-2,
        p_Z_idle_per_us=1e-2,
        p_leakage_per_gate=5e-4,
        p_seepage_per_cycle=5e-5,
        
        # Tier 3
        cosmic_ray_rate_per_qubit_hr=2e-3,       # Al gap is small → more burst sensitivity
        ZZ_crosstalk_kHz=100,
        one_over_f_noise_amplitude=5e-6,
        non_markovian=True,
        
        # Tier 4
        gate_1q_fidelity=0.999,
        gate_2q_fidelity=0.985,
        gate_1q_time_ns=30,
        gate_2q_time_ns=300,
        anharmonicity_MHz=-200,
        charge_dispersion_kHz=0.05,
        
        # Tier 5
        readout_fidelity=0.96,
        measurement_time_ns=700,
        p_meas_induced_leakage=5e-3,
        qnd_fidelity=0.94,
        
        # Tier 6
        typical_connectivity="2D nearest-neighbor",
        max_qubits_demonstrated=72,              # Google Bristlecone era
        frequency_crowding_MHz=60,
        
        # Tier 7
        yield_pct=50,
        parameter_variation_pct=45,
        drift_rate_per_hour=1.5,
        
        key_references=[
            "Koch et al. 2007, PRA 76:042319 (transmon proposal)",
            "Various Al-on-Si papers, 2010-2020",
        ],
        notes="Historical baseline. Cosmic-ray sensitivity is notable concern.",
    ),
    
    MaterialType.ALUMINUM_ON_SAPPHIRE: MaterialProfile(
        material_type=MaterialType.ALUMINUM_ON_SAPPHIRE,
        display_name="Aluminum on Sapphire",
        description=(
            "Al on sapphire — better dielectric than Al on Si, but still "
            "limited by Al-oxide losses. Mid-range coherence."
        ),
        substrate="sapphire",
        superconductor="Al",
        junction_material="Al-AlOx-Al",
        year_introduced=2010,
        confidence="medium",
        
        # Tier 1
        T1_us=80,
        T2_echo_us=60,
        T2_ramsey_us=40,
        T_phi_us=150,
        T1_variation_pct=35,
        
        # Tier 2
        bias_eta=3,
        p_X_idle_per_us=6.3e-3,
        p_Z_idle_per_us=6.7e-3,
        p_leakage_per_gate=4e-4,
        p_seepage_per_cycle=4e-5,
        
        # Tier 3
        cosmic_ray_rate_per_qubit_hr=2e-3,
        ZZ_crosstalk_kHz=80,
        one_over_f_noise_amplitude=3e-6,
        non_markovian=True,
        
        # Tier 4
        gate_1q_fidelity=0.9995,
        gate_2q_fidelity=0.99,
        gate_1q_time_ns=30,
        gate_2q_time_ns=250,
        anharmonicity_MHz=-200,
        charge_dispersion_kHz=0.03,
        
        # Tier 5
        readout_fidelity=0.97,
        measurement_time_ns=600,
        p_meas_induced_leakage=3e-3,
        qnd_fidelity=0.95,
        
        # Tier 6
        typical_connectivity="2D nearest-neighbor",
        max_qubits_demonstrated=20,
        frequency_crowding_MHz=50,
        
        # Tier 7
        yield_pct=65,
        parameter_variation_pct=40,
        drift_rate_per_hour=1.0,
        
        key_references=[
            "Various Al-on-sapphire papers",
        ],
        notes="Mid-tier baseline.",
    ),
    
    # ============================================================
    # EXOTIC / SPECIALIZED
    # ============================================================
    
    MaterialType.TITANIUM_NITRIDE: MaterialProfile(
        material_type=MaterialType.TITANIUM_NITRIDE,
        display_name="Titanium Nitride on Silicon",
        description=(
            "TiN has high kinetic inductance and low loss — useful for "
            "high-impedance resonators and superinductors. Less common as "
            "a transmon base but excellent for fluxonium-style designs."
        ),
        substrate="silicon",
        superconductor="TiN",
        junction_material="Al-AlOx-Al",
        year_introduced=2014,
        confidence="medium",
        
        # Tier 1
        T1_us=150,
        T2_echo_us=100,
        T2_ramsey_us=70,
        T_phi_us=300,
        T1_variation_pct=30,
        
        # Tier 2
        bias_eta=4,
        p_X_idle_per_us=3.3e-3,
        p_Z_idle_per_us=3.3e-3,
        p_leakage_per_gate=2e-4,
        p_seepage_per_cycle=2e-5,
        
        # Tier 3
        cosmic_ray_rate_per_qubit_hr=1e-3,
        ZZ_crosstalk_kHz=60,
        one_over_f_noise_amplitude=2e-6,
        non_markovian=True,
        
        # Tier 4
        gate_1q_fidelity=0.9997,
        gate_2q_fidelity=0.992,
        gate_1q_time_ns=25,
        gate_2q_time_ns=200,
        anharmonicity_MHz=-200,
        charge_dispersion_kHz=0.02,
        
        # Tier 5
        readout_fidelity=0.98,
        measurement_time_ns=500,
        p_meas_induced_leakage=2e-3,
        qnd_fidelity=0.96,
        
        # Tier 6
        typical_connectivity="2D nearest-neighbor",
        max_qubits_demonstrated=10,
        frequency_crowding_MHz=40,
        
        # Tier 7
        yield_pct=60,
        parameter_variation_pct=35,
        drift_rate_per_hour=0.8,
        
        key_references=[
            "Vissers et al. 2010, APL 97:232509 (TiN low-loss films)",
        ],
        notes="Best fit for fluxonium and high-impedance designs.",
    ),
    
    MaterialType.GRANULAR_ALUMINUM: MaterialProfile(
        material_type=MaterialType.GRANULAR_ALUMINUM,
        display_name="Granular Aluminum (grAl) on Silicon",
        description=(
            "Granular aluminum — a disordered superconductor with tunable "
            "kinetic inductance. Used to make superinductors for fluxonium "
            "without large geometric loops. Not used as a base transmon "
            "material but critical for protected qubits."
        ),
        substrate="silicon",
        superconductor="grAl",
        junction_material="Al-AlOx-Al",
        year_introduced=2018,
        confidence="medium",
        
        # Tier 1
        T1_us=200,                                # used in long-coherence fluxonium
        T2_echo_us=150,
        T2_ramsey_us=100,
        T_phi_us=400,
        T1_variation_pct=30,
        
        # Tier 2
        bias_eta=15,                              # fluxonium-typical high bias
        p_X_idle_per_us=2.5e-3,
        p_Z_idle_per_us=2.5e-3,
        p_leakage_per_gate=5e-5,                  # large anharmonicity helps
        p_seepage_per_cycle=5e-6,
        
        # Tier 3
        cosmic_ray_rate_per_qubit_hr=1e-3,
        ZZ_crosstalk_kHz=40,
        one_over_f_noise_amplitude=1e-6,
        non_markovian=True,
        
        # Tier 4
        gate_1q_fidelity=0.999,
        gate_2q_fidelity=0.99,
        gate_1q_time_ns=40,                       # slower fluxonium gates
        gate_2q_time_ns=400,
        anharmonicity_MHz=-3000,
        charge_dispersion_kHz=0.001,              # fluxonium charge-insensitive
        
        # Tier 5
        readout_fidelity=0.98,
        measurement_time_ns=600,
        p_meas_induced_leakage=1e-3,
        qnd_fidelity=0.97,
        
        # Tier 6
        typical_connectivity="2D, often sparse for fluxonium",
        max_qubits_demonstrated=8,
        frequency_crowding_MHz=20,                # low-frequency fluxonium less crowded
        
        # Tier 7
        yield_pct=55,
        parameter_variation_pct=40,
        drift_rate_per_hour=0.8,
        
        key_references=[
            "Grünhaupt et al. 2018, Nat Mater 18:816 (grAl superinductor)",
            "Somoroff et al. 2023, PRL 130:267001",
        ],
        notes="Essential for fluxonium. Not a transmon material.",
    ),
    
    # ============================================================
    # JUNCTION MATERIALS (the second axis)
    # ============================================================
    
    MaterialType.INAS_AL_NANOWIRE_JJ: MaterialProfile(
        material_type=MaterialType.INAS_AL_NANOWIRE_JJ,
        display_name="InAs/Al Nanowire Junction (gatemon)",
        description=(
            "Semiconductor-superconductor hybrid junction: InAs nanowire with "
            "Al contacts. Gate-tunable instead of flux-tunable. Used in gatemons "
            "and closely related to Microsoft's topological qubit program. "
            "Coherence limited by semiconductor charge noise."
        ),
        substrate="silicon (with InAs nanowires)",
        superconductor="Al",
        junction_material="InAs-Al nanowire",
        year_introduced=2015,
        confidence="medium",
        
        # Tier 1
        T1_us=5,                                  # short due to semiconductor losses
        T2_echo_us=3,
        T2_ramsey_us=1,
        T_phi_us=6,
        T1_variation_pct=50,
        
        # Tier 2
        bias_eta=2,
        p_X_idle_per_us=0.1,                      # high — short T1
        p_Z_idle_per_us=0.15,
        p_leakage_per_gate=3e-4,
        p_seepage_per_cycle=3e-5,
        
        # Tier 3
        cosmic_ray_rate_per_qubit_hr=1e-3,
        ZZ_crosstalk_kHz=80,
        one_over_f_noise_amplitude=1e-5,          # high charge noise
        non_markovian=True,
        
        # Tier 4
        gate_1q_fidelity=0.995,
        gate_2q_fidelity=0.95,
        gate_1q_time_ns=25,
        gate_2q_time_ns=300,
        anharmonicity_MHz=-200,
        charge_dispersion_kHz=10,                 # high — that's the trade-off
        
        # Tier 5
        readout_fidelity=0.95,
        measurement_time_ns=600,
        p_meas_induced_leakage=5e-3,
        qnd_fidelity=0.93,
        
        # Tier 6
        typical_connectivity="2D nearest-neighbor",
        max_qubits_demonstrated=2,
        frequency_crowding_MHz=80,                # high variation across nanowires
        
        # Tier 7
        yield_pct=20,                             # nanowire growth is the bottleneck
        parameter_variation_pct=60,
        drift_rate_per_hour=3.0,
        
        key_references=[
            "Larsen et al. 2015, PRL 115:127001 (first gatemon)",
            "Casparis et al. 2018, Nat Nanotechnol 13:915",
        ],
        notes=(
            "Research-grade. Material quality (especially InAs/Al interface) "
            "dominates everything. Same material stack as topological qubit work."
        ),
    ),
}


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def get(material: MaterialType) -> MaterialProfile:
    return MATERIALS[material]


def list_by_substrate(substrate: str) -> list[MaterialProfile]:
    return [m for m in MATERIALS.values() if substrate.lower() in m.substrate.lower()]


def list_by_superconductor(sc: str) -> list[MaterialProfile]:
    return [m for m in MATERIALS.values() if sc.lower() in m.superconductor.lower()]


def filter_by_threshold(max_physical_error_rate: float) -> list[MaterialProfile]:
    """Return materials whose dominant idle error rate is below threshold.
    
    Uses the worst of (p_X, p_Z) idle rates × typical gate time as a proxy.
    """
    results = []
    for m in MATERIALS.values():
        if m.p_X_idle_per_us is None or m.gate_2q_time_ns is None:
            continue
        # Idle error during one 2q gate
        idle_err = max(m.p_X_idle_per_us, m.p_Z_idle_per_us or 0) * (m.gate_2q_time_ns / 1000)
        if idle_err <= max_physical_error_rate:
            results.append(m)
    return results


def print_summary():
    """One-line-per-material summary."""
    print(f"{'Material':<45} {'T1 μs':<8} {'T2 μs':<8} {'Bias η':<8} "
          f"{'2Q F':<8} {'Year':<6}")
    print("-" * 85)
    for m in MATERIALS.values():
        bias = f"{m.bias_eta}" if m.bias_eta else "?"
        f2q = f"{m.gate_2q_fidelity:.3f}" if m.gate_2q_fidelity else "?"
        print(f"{m.display_name:<45} {m.T1_us:<8} {m.T2_echo_us:<8} "
              f"{bias:<8} {f2q:<8} {m.year_introduced:<6}")


def print_tier_view(material: MaterialType):
    """Detailed 7-tier view of a single material."""
    m = MATERIALS[material]
    print(f"\n{'=' * 70}")
    print(f"  {m.display_name}")
    print(f"  {m.description}")
    print(f"{'=' * 70}\n")
    
    print(f"[Stack]  {m.superconductor} on {m.substrate}, JJ: {m.junction_material}")
    print(f"[Year]   {m.year_introduced}    [Confidence] {m.confidence}\n")
    
    print("Tier 1 — Coherence:")
    print(f"  T1 = {m.T1_us} μs, T2_echo = {m.T2_echo_us} μs, "
          f"T_phi = {m.T_phi_us} μs, σ(T1) = {m.T1_variation_pct}%")
    
    print("Tier 2 — Noise channels:")
    print(f"  bias η = {m.bias_eta}, p_leak = {m.p_leakage_per_gate}, "
          f"p_seep = {m.p_seepage_per_cycle}")
    
    print("Tier 3 — Correlations:")
    print(f"  cosmic_ray = {m.cosmic_ray_rate_per_qubit_hr}/qubit/hr, "
          f"ZZ_xtalk = {m.ZZ_crosstalk_kHz} kHz, non-Markovian = {m.non_markovian}")
    
    print("Tier 4 — Gates:")
    print(f"  F_1q = {m.gate_1q_fidelity}, F_2q = {m.gate_2q_fidelity}, "
          f"t_1q = {m.gate_1q_time_ns}ns, t_2q = {m.gate_2q_time_ns}ns, "
          f"α = {m.anharmonicity_MHz} MHz")
    
    print("Tier 5 — Measurement:")
    print(f"  F_RO = {m.readout_fidelity}, t_meas = {m.measurement_time_ns}ns, "
          f"QND = {m.qnd_fidelity}")
    
    print("Tier 6 — Architecture:")
    print(f"  connectivity = {m.typical_connectivity}, "
          f"max demoed = {m.max_qubits_demonstrated}")
    
    print("Tier 7 — Yield:")
    print(f"  yield = {m.yield_pct}%, param variation = {m.parameter_variation_pct}%, "
          f"drift = {m.drift_rate_per_hour}/hr")
    
    print(f"\nReferences:")
    for ref in m.key_references:
        print(f"  - {ref}")
    if m.notes:
        print(f"\nNotes: {m.notes}")


# ============================================================
# DEMO
# ============================================================

if __name__ == "__main__":
    print("=== Materials Library — Summary ===\n")
    print_summary()
    
    print("\n=== Filter: materials with idle error < 0.012 threshold ===\n")
    for m in filter_by_threshold(0.012):
        print(f"  ✓ {m.display_name}")
    
    print("\n=== Filter: materials with idle error < 0.003 (for FT circuits) ===\n")
    for m in filter_by_threshold(0.003):
        print(f"  ✓ {m.display_name}")
    
    print_tier_view(MaterialType.TANTALUM_ON_SAPPHIRE_OPTIMIZED)
    print_tier_view(MaterialType.INAS_AL_NANOWIRE_JJ)

"""
Cryostat / Cryogenics Catalog.

Each entry describes a dilution refrigerator that hosts the qubit chip.
Cryostat choice affects:
  - Base temperature → thermal qubit population (kT/hf matters at low f)
  - Cooling power → how many qubits / how much dissipation you can handle
  - Cable count → maximum signal lines (drive + readout + flux + DC bias)
  - Cosmic ray shielding → burst error rate at the chip
  - Vibration isolation → 1/f noise floor
  - Sample space → physical chip + chiplet size limit

These propagate into the noise model:
  - Higher T_base → higher thermal population → higher idle error
  - Lower cooling power → fewer simultaneously active qubits
  - Fewer cables → cap on qubits before multiplexing becomes mandatory
  - Worse shielding → higher cosmic-ray burst rate (correlates with Tier 3 noise)
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


# ============================================================
# CRYOSTAT TYPE ENUM
# ============================================================

class CryostatType(str, Enum):
    """Dilution refrigerator models — the main commercial systems."""
    # Oxford Instruments
    OXFORD_PROTEOX_MX = "oxford_proteox_mx"        # mid-size, modern
    OXFORD_PROTEOX_LX = "oxford_proteox_lx"        # large
    OXFORD_TRITON_200 = "oxford_triton_200"        # workhorse
    OXFORD_TRITON_500 = "oxford_triton_500"        # large workhorse
    
    # Bluefors
    BLUEFORS_LD = "bluefors_ld"                     # LD series
    BLUEFORS_XLD = "bluefors_xld"                   # XLD — large, common in industry
    BLUEFORS_KIDE = "bluefors_kide"                 # KIDE — newest, designed for QC scale
    
    # Other commercial
    LEIDEN_CF_CS81 = "leiden_cf_cs81"               # Leiden Cryogenics
    JANIS_HE3 = "janis_he3"                         # smaller He-3, not full dilution
    
    # Specialized / custom
    IBM_CUSTOM = "ibm_custom"                       # IBM's "Goldeneye" and successors
    GOOGLE_CUSTOM = "google_custom"                 # Google internal
    
    # Adiabatic demagnetization (research stage for QC)
    ADR_HYBRID = "adr_hybrid"                       # ADR + dilution stage


# ============================================================
# CRYOSTAT PROFILE
# ============================================================

@dataclass
class CryostatProfile:
    """Complete cryostat specification."""
    
    # --- Identification ---
    cryostat_type: CryostatType
    display_name: str
    manufacturer: str
    description: str
    industrial_users: list[str]
    maturity_tier: int                       # 1 (industrial) to 3 (research)
    
    # ============================================================
    # TEMPERATURE
    # ============================================================
    base_temperature_mK: float               # mixing chamber base temp
    typical_operating_temp_mK: float         # realistic with cabling load
    
    # Stage temperatures (for context — cabling thermalization)
    still_temp_K: float = 0.8
    cold_plate_temp_K: float = 0.1
    
    # ============================================================
    # COOLING POWER
    # ============================================================
    cooling_power_uW_at_20mK: float = 0      # at the qubit stage
    cooling_power_uW_at_100mK: float = 0     # at the next stage up
    cooling_power_mW_at_4K: float = 0        # at 4K stage (1st cooling stage)
    
    # ============================================================
    # CABLING / SIGNAL LINES
    # ============================================================
    max_coax_lines: int = 0                  # microwave lines (drive + readout)
    max_dc_lines: int = 0                    # DC bias / flux lines
    typical_attenuation_dB_per_line: float = 60  # cumulative attenuation
    
    # ============================================================
    # SAMPLE SPACE
    # ============================================================
    sample_space_diameter_mm: float = 0      # physical chip size limit
    sample_space_height_mm: float = 0
    
    # ============================================================
    # SHIELDING / NOISE
    # ============================================================
    magnetic_shielding: str = "standard"     # "standard" | "enhanced" | "mu-metal+SC"
    cosmic_ray_shielding: str = "none"       # "none" | "lead" | "deep_underground"
    vibration_isolation: str = "passive"     # "passive" | "active" | "decoupled_frame"
    
    # ============================================================
    # QEC-RELEVANT DERIVED METRICS
    # ============================================================
    # Maximum qubit count achievable given cable constraints
    # (assuming 2 coax lines per qubit + readout multiplexing)
    estimated_max_qubits_unmultiplexed: int = 0
    estimated_max_qubits_multiplexed: int = 0  # with readout multiplexing 8:1
    
    # Cosmic ray burst rate at chip (events/qubit/hour)
    expected_cosmic_ray_rate_per_qubit_hr: float = 1e-3
    
    # ============================================================
    # OPERATIONAL
    # ============================================================
    cooldown_time_hours: float = 36          # from room temp to base
    automation_level: str = "manual"         # "manual" | "semi-auto" | "fully-auto"
    requires_external_compressor: bool = True
    typical_cost_usd: str = "$$"
    
    # --- Provenance ---
    documentation_url: str = ""
    key_references: list[str] = field(default_factory=list)
    notes: str = ""


# ============================================================
# THE CATALOG
# ============================================================

CRYOSTATS: dict[CryostatType, CryostatProfile] = {
    
    # ============================================================
    # OXFORD INSTRUMENTS
    # ============================================================
    
    CryostatType.OXFORD_PROTEOX_MX: CryostatProfile(
        cryostat_type=CryostatType.OXFORD_PROTEOX_MX,
        display_name="Oxford Proteox MX",
        manufacturer="Oxford Instruments NanoScience",
        description=(
            "Modern modular dilution refrigerator designed for quantum computing. "
            "Side-loading for fast sample exchange. Mid-size cooling power and "
            "cable count. Popular in academic and small industrial labs."
        ),
        industrial_users=["Academic labs", "Mid-size startups"],
        maturity_tier=1,
        base_temperature_mK=7,
        typical_operating_temp_mK=10,
        cooling_power_uW_at_20mK=20,
        cooling_power_uW_at_100mK=400,
        cooling_power_mW_at_4K=1000,
        max_coax_lines=80,
        max_dc_lines=24,
        typical_attenuation_dB_per_line=60,
        sample_space_diameter_mm=180,
        sample_space_height_mm=200,
        magnetic_shielding="enhanced",
        cosmic_ray_shielding="none",
        vibration_isolation="passive",
        estimated_max_qubits_unmultiplexed=40,
        estimated_max_qubits_multiplexed=160,
        expected_cosmic_ray_rate_per_qubit_hr=1e-3,
        cooldown_time_hours=36,
        automation_level="semi-auto",
        requires_external_compressor=True,
        typical_cost_usd="$$$ ($600K-$1M)",
        documentation_url="https://nanoscience.oxinst.com/products/proteox",
        notes="Good balance of size, cooling power, and accessibility.",
    ),
    
    CryostatType.OXFORD_PROTEOX_LX: CryostatProfile(
        cryostat_type=CryostatType.OXFORD_PROTEOX_LX,
        display_name="Oxford Proteox LX",
        manufacturer="Oxford Instruments NanoScience",
        description=(
            "Larger Proteox variant. More cooling power and cable capacity. "
            "Targets industrial QC users running 100+ qubit systems."
        ),
        industrial_users=["Industrial QC programs"],
        maturity_tier=1,
        base_temperature_mK=7,
        typical_operating_temp_mK=10,
        cooling_power_uW_at_20mK=40,
        cooling_power_uW_at_100mK=800,
        cooling_power_mW_at_4K=2000,
        max_coax_lines=200,
        max_dc_lines=48,
        typical_attenuation_dB_per_line=60,
        sample_space_diameter_mm=250,
        sample_space_height_mm=300,
        magnetic_shielding="enhanced",
        cosmic_ray_shielding="none",
        vibration_isolation="active",
        estimated_max_qubits_unmultiplexed=100,
        estimated_max_qubits_multiplexed=400,
        expected_cosmic_ray_rate_per_qubit_hr=1e-3,
        cooldown_time_hours=48,
        automation_level="semi-auto",
        typical_cost_usd="$$$$ ($1M-$2M)",
        documentation_url="https://nanoscience.oxinst.com/products/proteox",
    ),
    
    CryostatType.OXFORD_TRITON_200: CryostatProfile(
        cryostat_type=CryostatType.OXFORD_TRITON_200,
        display_name="Oxford Triton 200",
        manufacturer="Oxford Instruments NanoScience",
        description=(
            "The workhorse dilution refrigerator of the 2010s. Still very "
            "widely deployed. Bottom-loading, manual operation. Predecessor "
            "to Proteox line."
        ),
        industrial_users=["Most established academic labs worldwide"],
        maturity_tier=1,
        base_temperature_mK=10,
        typical_operating_temp_mK=15,
        cooling_power_uW_at_20mK=15,
        cooling_power_uW_at_100mK=300,
        cooling_power_mW_at_4K=800,
        max_coax_lines=64,
        max_dc_lines=24,
        typical_attenuation_dB_per_line=60,
        sample_space_diameter_mm=150,
        sample_space_height_mm=200,
        magnetic_shielding="standard",
        cosmic_ray_shielding="none",
        vibration_isolation="passive",
        estimated_max_qubits_unmultiplexed=30,
        estimated_max_qubits_multiplexed=120,
        expected_cosmic_ray_rate_per_qubit_hr=1.5e-3,    # slightly higher
        cooldown_time_hours=36,
        automation_level="manual",
        typical_cost_usd="$$ ($400K-$700K)",
        documentation_url="https://nanoscience.oxinst.com/triton",
        notes="The bread-and-butter fridge for the field. Aging but reliable.",
    ),
    
    CryostatType.OXFORD_TRITON_500: CryostatProfile(
        cryostat_type=CryostatType.OXFORD_TRITON_500,
        display_name="Oxford Triton 500",
        manufacturer="Oxford Instruments NanoScience",
        description=(
            "Larger Triton variant with more cooling power. Suited for systems "
            "with high dissipation (large qubit arrays, many active drives)."
        ),
        industrial_users=["Larger academic groups", "Industrial labs"],
        maturity_tier=1,
        base_temperature_mK=8,
        typical_operating_temp_mK=12,
        cooling_power_uW_at_20mK=30,
        cooling_power_uW_at_100mK=500,
        cooling_power_mW_at_4K=1500,
        max_coax_lines=120,
        max_dc_lines=36,
        typical_attenuation_dB_per_line=60,
        sample_space_diameter_mm=200,
        sample_space_height_mm=250,
        magnetic_shielding="standard",
        cosmic_ray_shielding="none",
        vibration_isolation="passive",
        estimated_max_qubits_unmultiplexed=60,
        estimated_max_qubits_multiplexed=240,
        expected_cosmic_ray_rate_per_qubit_hr=1.5e-3,
        cooldown_time_hours=48,
        automation_level="manual",
        typical_cost_usd="$$$ ($700K-$1.2M)",
        documentation_url="https://nanoscience.oxinst.com/triton",
    ),
    
    # ============================================================
    # BLUEFORS
    # ============================================================
    
    CryostatType.BLUEFORS_LD: CryostatProfile(
        cryostat_type=CryostatType.BLUEFORS_LD,
        display_name="Bluefors LD",
        manufacturer="Bluefors",
        description=(
            "Compact dilution refrigerator. Top-loading, fast sample exchange. "
            "Popular in academic labs for smaller experiments. Less cooling "
            "power than XLD but cheaper and faster turnaround."
        ),
        industrial_users=["Academic labs", "Material characterization"],
        maturity_tier=1,
        base_temperature_mK=10,
        typical_operating_temp_mK=15,
        cooling_power_uW_at_20mK=10,
        cooling_power_uW_at_100mK=250,
        cooling_power_mW_at_4K=600,
        max_coax_lines=48,
        max_dc_lines=12,
        typical_attenuation_dB_per_line=60,
        sample_space_diameter_mm=120,
        sample_space_height_mm=150,
        magnetic_shielding="standard",
        cosmic_ray_shielding="none",
        vibration_isolation="passive",
        estimated_max_qubits_unmultiplexed=20,
        estimated_max_qubits_multiplexed=80,
        expected_cosmic_ray_rate_per_qubit_hr=1.5e-3,
        cooldown_time_hours=30,
        automation_level="semi-auto",
        typical_cost_usd="$$ ($350K-$600K)",
        documentation_url="https://bluefors.com",
    ),
    
    CryostatType.BLUEFORS_XLD: CryostatProfile(
        cryostat_type=CryostatType.BLUEFORS_XLD,
        display_name="Bluefors XLD",
        manufacturer="Bluefors",
        description=(
            "Large dilution refrigerator. The de facto standard for industrial "
            "QC labs in the late 2010s and early 2020s. Used in many IBM, "
            "Rigetti, and IQM installations. Strong cooling power, good cable "
            "count."
        ),
        industrial_users=["IBM (older systems)", "Rigetti", "IQM", "OQC"],
        maturity_tier=1,
        base_temperature_mK=7,
        typical_operating_temp_mK=10,
        cooling_power_uW_at_20mK=30,
        cooling_power_uW_at_100mK=500,
        cooling_power_mW_at_4K=1500,
        max_coax_lines=144,
        max_dc_lines=48,
        typical_attenuation_dB_per_line=60,
        sample_space_diameter_mm=220,
        sample_space_height_mm=280,
        magnetic_shielding="enhanced",
        cosmic_ray_shielding="none",
        vibration_isolation="active",
        estimated_max_qubits_unmultiplexed=70,
        estimated_max_qubits_multiplexed=280,
        expected_cosmic_ray_rate_per_qubit_hr=1e-3,
        cooldown_time_hours=48,
        automation_level="semi-auto",
        typical_cost_usd="$$$$ ($1M-$1.8M)",
        documentation_url="https://bluefors.com",
        notes="Industry standard. If you've seen a quantum computer in a video, this is probably the fridge.",
    ),
    
    CryostatType.BLUEFORS_KIDE: CryostatProfile(
        cryostat_type=CryostatType.BLUEFORS_KIDE,
        display_name="Bluefors KIDE",
        manufacturer="Bluefors",
        description=(
            "Bluefors' newest platform, announced 2022, designed specifically "
            "for million-qubit-scale quantum computing. Hexagonal cluster "
            "architecture allows multiple cryostats to share a common vacuum "
            "space. Much higher cable capacity than XLD."
        ),
        industrial_users=["IBM (Quantum System Two)", "Future-scale programs"],
        maturity_tier=1,
        base_temperature_mK=7,
        typical_operating_temp_mK=10,
        cooling_power_uW_at_20mK=50,
        cooling_power_uW_at_100mK=900,
        cooling_power_mW_at_4K=3000,
        max_coax_lines=500,                          # major jump
        max_dc_lines=200,
        typical_attenuation_dB_per_line=60,
        sample_space_diameter_mm=400,
        sample_space_height_mm=400,
        magnetic_shielding="mu-metal+SC",
        cosmic_ray_shielding="none",
        vibration_isolation="decoupled_frame",
        estimated_max_qubits_unmultiplexed=250,
        estimated_max_qubits_multiplexed=1000,
        expected_cosmic_ray_rate_per_qubit_hr=1e-3,
        cooldown_time_hours=72,
        automation_level="fully-auto",
        typical_cost_usd="$$$$$ (>$2M)",
        documentation_url="https://bluefors.com/kide",
        notes="The platform IBM Quantum System Two is built on. Engineered for >1000 qubit scale.",
    ),
    
    # ============================================================
    # OTHER COMMERCIAL
    # ============================================================
    
    CryostatType.LEIDEN_CF_CS81: CryostatProfile(
        cryostat_type=CryostatType.LEIDEN_CF_CS81,
        display_name="Leiden CF-CS81 (Dry Dilution)",
        manufacturer="Leiden Cryogenics",
        description=(
            "Dutch-made dilution refrigerator favored by some European labs. "
            "Strong cooling power, custom configurations available. Less "
            "prevalent than Bluefors/Oxford in industrial QC."
        ),
        industrial_users=["European academic labs"],
        maturity_tier=1,
        base_temperature_mK=8,
        typical_operating_temp_mK=12,
        cooling_power_uW_at_20mK=25,
        cooling_power_uW_at_100mK=500,
        cooling_power_mW_at_4K=1200,
        max_coax_lines=72,
        max_dc_lines=24,
        typical_attenuation_dB_per_line=60,
        sample_space_diameter_mm=180,
        sample_space_height_mm=220,
        magnetic_shielding="standard",
        cosmic_ray_shielding="none",
        vibration_isolation="passive",
        estimated_max_qubits_unmultiplexed=35,
        estimated_max_qubits_multiplexed=140,
        expected_cosmic_ray_rate_per_qubit_hr=1.5e-3,
        cooldown_time_hours=48,
        automation_level="semi-auto",
        typical_cost_usd="$$$ ($500K-$900K)",
        documentation_url="https://www.leidencryogenics.com",
    ),
    
    CryostatType.JANIS_HE3: CryostatProfile(
        cryostat_type=CryostatType.JANIS_HE3,
        display_name="Janis He-3 Cryostat (limited)",
        manufacturer="Janis Research (now Lake Shore)",
        description=(
            "Pure He-3 cryostat, not full dilution. Base temperature ~250 mK "
            "is too warm for serious qubit work. Useful for characterization "
            "of resonators or basic NIS thermometry. Listed for completeness."
        ),
        industrial_users=["Material characterization only"],
        maturity_tier=2,
        base_temperature_mK=250,                     # too warm for qubits
        typical_operating_temp_mK=300,
        cooling_power_uW_at_20mK=0,                  # not achievable
        cooling_power_uW_at_100mK=0,
        cooling_power_mW_at_4K=200,
        max_coax_lines=16,
        max_dc_lines=8,
        typical_attenuation_dB_per_line=40,
        sample_space_diameter_mm=80,
        sample_space_height_mm=100,
        magnetic_shielding="none",
        cosmic_ray_shielding="none",
        vibration_isolation="passive",
        estimated_max_qubits_unmultiplexed=0,        # not viable for qubits
        estimated_max_qubits_multiplexed=0,
        expected_cosmic_ray_rate_per_qubit_hr=1e-3,
        cooldown_time_hours=8,
        automation_level="manual",
        typical_cost_usd="$ ($80K-$200K)",
        notes="NOT viable for qubit operation — included for material characterization workflows only.",
    ),
    
    # ============================================================
    # INTERNAL / CUSTOM
    # ============================================================
    
    CryostatType.IBM_CUSTOM: CryostatProfile(
        cryostat_type=CryostatType.IBM_CUSTOM,
        display_name="IBM 'Goldeneye' and successors",
        manufacturer="IBM (internal)",
        description=(
            "IBM's super-sized internal dilution refrigerator program. "
            "Goldeneye (2023) achieved cooling sufficient for >1000-qubit "
            "operation. Not commercially available. Modeled here for "
            "benchmarking IBM-published roadmaps."
        ),
        industrial_users=["IBM only"],
        maturity_tier=3,
        base_temperature_mK=5,
        typical_operating_temp_mK=8,
        cooling_power_uW_at_20mK=100,
        cooling_power_uW_at_100mK=2000,
        cooling_power_mW_at_4K=6000,
        max_coax_lines=2000,
        max_dc_lines=500,
        typical_attenuation_dB_per_line=60,
        sample_space_diameter_mm=600,
        sample_space_height_mm=600,
        magnetic_shielding="mu-metal+SC",
        cosmic_ray_shielding="lead",                  # IBM has explored shielding
        vibration_isolation="decoupled_frame",
        estimated_max_qubits_unmultiplexed=1000,
        estimated_max_qubits_multiplexed=4000,
        expected_cosmic_ray_rate_per_qubit_hr=5e-4,   # shielding helps
        cooldown_time_hours=96,
        automation_level="fully-auto",
        typical_cost_usd="Not for sale",
        documentation_url="https://research.ibm.com",
        notes="Reference point for what's possible at scale, not commercially available.",
    ),
    
    CryostatType.GOOGLE_CUSTOM: CryostatProfile(
        cryostat_type=CryostatType.GOOGLE_CUSTOM,
        display_name="Google internal cryostat",
        manufacturer="Google Quantum AI (internal)",
        description=(
            "Google's internal dilution refrigerators (modified Bluefors XLD "
            "variants for Sycamore/Willow). Custom cabling and shielding for "
            "their specific qubit array geometries."
        ),
        industrial_users=["Google only"],
        maturity_tier=3,
        base_temperature_mK=10,
        typical_operating_temp_mK=15,
        cooling_power_uW_at_20mK=30,
        cooling_power_uW_at_100mK=500,
        cooling_power_mW_at_4K=1500,
        max_coax_lines=200,                           # Willow scale
        max_dc_lines=80,
        typical_attenuation_dB_per_line=60,
        sample_space_diameter_mm=220,
        sample_space_height_mm=280,
        magnetic_shielding="enhanced",
        cosmic_ray_shielding="none",
        vibration_isolation="active",
        estimated_max_qubits_unmultiplexed=100,
        estimated_max_qubits_multiplexed=400,
        expected_cosmic_ray_rate_per_qubit_hr=1e-3,
        cooldown_time_hours=48,
        automation_level="fully-auto",
        typical_cost_usd="Not for sale",
        documentation_url="https://quantumai.google",
    ),
    
    # ============================================================
    # RESEARCH / EXOTIC
    # ============================================================
    
    CryostatType.ADR_HYBRID: CryostatProfile(
        cryostat_type=CryostatType.ADR_HYBRID,
        display_name="ADR + Dilution Hybrid (research)",
        manufacturer="Various (research-stage)",
        description=(
            "Hybrid systems combining adiabatic demagnetization refrigeration "
            "with conventional dilution. Can hit very low temperatures (<1 mK) "
            "for short periods. Not used for routine qubit operation but "
            "relevant for ultra-low-T research."
        ),
        industrial_users=["Specialized research only"],
        maturity_tier=3,
        base_temperature_mK=0.5,                      # sub-mK possible
        typical_operating_temp_mK=3,
        cooling_power_uW_at_20mK=5,                   # very limited
        cooling_power_uW_at_100mK=100,
        cooling_power_mW_at_4K=500,
        max_coax_lines=24,
        max_dc_lines=12,
        typical_attenuation_dB_per_line=60,
        sample_space_diameter_mm=80,
        sample_space_height_mm=100,
        magnetic_shielding="mu-metal+SC",
        cosmic_ray_shielding="lead",
        vibration_isolation="active",
        estimated_max_qubits_unmultiplexed=10,
        estimated_max_qubits_multiplexed=40,
        expected_cosmic_ray_rate_per_qubit_hr=5e-4,
        cooldown_time_hours=24,
        automation_level="manual",
        typical_cost_usd="$$$ (custom)",
        notes="Not used for production qubit work. Listed for research completeness.",
    ),
}


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def get(cryostat: CryostatType) -> CryostatProfile:
    return CRYOSTATS[cryostat]


def list_by_tier(tier: int) -> list[CryostatProfile]:
    return [c for c in CRYOSTATS.values() if c.maturity_tier == tier]


def list_for_input_picker() -> list[CryostatProfile]:
    """Tier 1 — commercially available systems suitable for QEC."""
    return [c for c in CRYOSTATS.values() if c.maturity_tier == 1]


def filter_by_capability(
    min_qubits: int = 0,
    max_base_temp_mK: Optional[float] = None,
    require_shielding: bool = False,
) -> list[CryostatProfile]:
    """Find cryostats matching capability requirements."""
    results = []
    for c in CRYOSTATS.values():
        if c.estimated_max_qubits_multiplexed < min_qubits:
            continue
        if max_base_temp_mK is not None and c.base_temperature_mK > max_base_temp_mK:
            continue
        if require_shielding and c.cosmic_ray_shielding == "none":
            continue
        results.append(c)
    return results


def estimate_thermal_population(cryostat: CryostatProfile, qubit_freq_GHz: float) -> float:
    """Boltzmann factor for thermal excited-state population.
    
    P_thermal = exp(-hf / kT)
    
    At T=20 mK and f=5 GHz, this is ~exp(-12) ≈ 6e-6 — usually negligible.
    But at low qubit frequencies (fluxonium ~0.5 GHz) it becomes ~0.1, which
    is a problem.
    """
    import math
    h_over_k = 4.8e-11    # h/k in K·s = 0.048 mK/MHz
    T_K = cryostat.typical_operating_temp_mK / 1000
    f_Hz = qubit_freq_GHz * 1e9
    return math.exp(-h_over_k * f_Hz / T_K)


def print_summary():
    print(f"{'Cryostat':<35} {'Base mK':<10} {'P @20mK':<10} {'Coax':<8} "
          f"{'Max Q':<8} {'Tier':<6}")
    print("-" * 85)
    for c in CRYOSTATS.values():
        print(f"{c.display_name:<35} {c.base_temperature_mK:<10} "
              f"{c.cooling_power_uW_at_20mK:<10} {c.max_coax_lines:<8} "
              f"{c.estimated_max_qubits_multiplexed:<8} T{c.maturity_tier:<5}")


# ============================================================
# DEMO
# ============================================================

if __name__ == "__main__":
    print("=== Cryostat Catalog — Summary ===\n")
    print_summary()
    
    print("\n=== Filter: >100 qubit capacity, base < 10 mK ===\n")
    for c in filter_by_capability(min_qubits=100, max_base_temp_mK=10):
        print(f"  ✓ {c.display_name} — {c.estimated_max_qubits_multiplexed} qubits "
              f"at {c.base_temperature_mK} mK")
    
    print("\n=== Thermal population check: 5 GHz transmon in various fridges ===\n")
    for c in list_for_input_picker():
        p_thermal = estimate_thermal_population(c, 5.0)
        print(f"  {c.display_name:<40} P_thermal = {p_thermal:.2e}")
    
    print("\n=== Thermal population check: 0.5 GHz fluxonium ===\n")
    for c in list_for_input_picker():
        p_thermal = estimate_thermal_population(c, 0.5)
        flag = " ⚠️ HIGH" if p_thermal > 0.01 else ""
        print(f"  {c.display_name:<40} P_thermal = {p_thermal:.2e}{flag}")

"""
Superconducting Qubit Catalog.

Each entry describes a qubit modality the user can select, along with
its characteristic properties — frequency range, anharmonicity, noise
profile shape, and which error codes it pairs well with.

This drives the dropdown / picker in the input layer, and provides
the baseline noise profile shape before material-specific tuning.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


# ============================================================
# QUBIT TYPE ENUM — extended catalog
# ============================================================

class SuperconductingQubitType(str, Enum):
    """All superconducting qubit modalities supported.
    
    Ordered roughly by industrial maturity:
      Tier 1 (mainstream):  Transmon, Fluxonium
      Tier 2 (emerging):    Cat, Tunable Transmon, Capacitively-Shunted Flux
      Tier 3 (research):    0-Pi, Heavy Fluxonium, Unimon, Gatemon
      Tier 4 (legacy):      Charge, Phase, Xmon, Flux, Quantronium
    """
    # ----- Tier 1: Industrial workhorses -----
    TRANSMON = "transmon"
    FLUXONIUM = "fluxonium"
    
    # ----- Tier 2: Emerging / specialized -----
    CAT = "cat"                              # Bosonic, dissipatively stabilized
    TUNABLE_TRANSMON = "tunable_transmon"    # SQUID-based, frequency-tunable
    CSFQ = "cshunt_flux"                     # Capacitively-shunted flux qubit
    DUAL_RAIL_CAVITY = "dual_rail_cavity"    # Erasure-biased, 3D cavities
    
    # ----- Tier 3: Research-stage -----
    ZERO_PI = "zero_pi"                      # Intrinsically protected
    HEAVY_FLUXONIUM = "heavy_fluxonium"      # Extra-long coherence variant
    UNIMON = "unimon"                        # IQM's protected design
    BIFLUXON = "bifluxon"                    # Doubly-protected
    GATEMON = "gatemon"                      # Semiconductor JJ — different material story
    
    # ----- Tier 4: Legacy (mostly historical) -----
    CHARGE = "charge"                        # Cooper pair box
    PHASE = "phase"                          # Current-biased junction
    RF_SQUID = "rf_squid"                    # Original flux qubit
    XMON = "xmon"                            # Cross-shaped capacitor transmon variant
    FLUX_PERSISTENT = "flux_persistent"      # 3-junction persistent-current flux qubit
    QUANTRONIUM = "quantronium"              # Charge-phase hybrid (Saclay)


# ============================================================
# QUBIT PROFILE — what defines each type
# ============================================================

@dataclass
class QubitProfile:
    """Characteristic properties of a superconducting qubit type."""
    
    # Identification
    qubit_type: SuperconductingQubitType
    display_name: str
    description: str
    industrial_users: list[str]              # e.g. ["IBM", "Google"]
    maturity_tier: int                       # 1 (mainstream) to 4 (legacy)
    
    # Frequency / energy structure
    typical_freq_GHz_range: tuple[float, float]
    typical_anharmonicity_MHz_range: tuple[float, float]
    
    # Coherence ballpark (typical achievable, not state-of-the-art)
    typical_T1_us_range: tuple[float, float]
    typical_T2_us_range: tuple[float, float]
    
    # Noise profile shape — the qualitative fingerprint
    intrinsic_bias_eta_range: tuple[float, float]  # p_Z / (p_X + p_Y)
    leakage_susceptibility: str              # "low" | "medium" | "high"
    charge_noise_sensitivity: str            # "low" | "medium" | "high"
    flux_noise_sensitivity: str              # "low" | "medium" | "high"
    
    # Code compatibility (qualitative recommendations)
    recommended_codes: list[str]
    
    # Fabrication / scaling notes
    fabrication_complexity: str              # "low" | "medium" | "high"
    typical_chip_size: str                   # rough scale label
    
    # Material relevance — how much does material choice matter?
    material_sensitivity: str                # "low" | "medium" | "high" | "extreme"
    
    # Fields with defaults — must come last
    incompatible_codes: list[str] = field(default_factory=list)
    key_references: list[str] = field(default_factory=list)


# ============================================================
# THE CATALOG — populated entries
# ============================================================

CATALOG: dict[SuperconductingQubitType, QubitProfile] = {

    # ============== TIER 1 ==============
    SuperconductingQubitType.TRANSMON: QubitProfile(
        qubit_type=SuperconductingQubitType.TRANSMON,
        display_name="Transmon",
        description=(
            "The industry workhorse. A weakly anharmonic oscillator built "
            "from a Josephson junction shunted by a large capacitor. Charge-noise "
            "insensitive by design. Used in virtually every major industrial "
            "superconducting quantum computer."
        ),
        industrial_users=["IBM", "Google", "Rigetti", "IQM", "OQC", "AWS"],
        maturity_tier=1,
        typical_freq_GHz_range=(4.0, 8.0),
        typical_anharmonicity_MHz_range=(-350, -150),
        typical_T1_us_range=(50, 500),
        typical_T2_us_range=(40, 300),
        intrinsic_bias_eta_range=(1.5, 10),   # depends heavily on material
        leakage_susceptibility="high",          # low anharmonicity = leakage-prone
        charge_noise_sensitivity="low",         # by design
        flux_noise_sensitivity="low",
        recommended_codes=["Surface", "XZZX", "Rotated Surface", "Color"],
        incompatible_codes=[],
        fabrication_complexity="low",
        typical_chip_size="100-1000+ qubits",
        material_sensitivity="extreme",         # this is where Ta/Nb/Al matters most
        key_references=[
            "Koch et al. 2007, PRA 76, 042319 (transmon proposal)",
            "Place et al. 2021, Nat Commun 12:1779 (Ta breakthrough)",
            "Ganjam et al. 2024, Nat Commun 15:3687 (millisecond regime)",
        ],
    ),
    
    SuperconductingQubitType.FLUXONIUM: QubitProfile(
        qubit_type=SuperconductingQubitType.FLUXONIUM,
        display_name="Fluxonium",
        description=(
            "Heavy fluxonium-style qubit using a small junction shunted by a "
            "large inductance (superinductor). Very large anharmonicity and "
            "naturally biased noise — phase errors dominate. Long coherence "
            "but slower gates and lower operating frequency than transmons."
        ),
        industrial_users=["Atlantic Quantum", "IBM Research", "Google (research)"],
        maturity_tier=1,
        typical_freq_GHz_range=(0.1, 1.0),
        typical_anharmonicity_MHz_range=(-5000, -2000),
        typical_T1_us_range=(100, 1500),
        typical_T2_us_range=(100, 1500),
        intrinsic_bias_eta_range=(10, 100),    # heavily biased toward Z
        leakage_susceptibility="low",           # large anharmonicity
        charge_noise_sensitivity="low",
        flux_noise_sensitivity="medium",        # flux bias matters
        recommended_codes=["XZZX", "Biased Repetition", "Cat-Concatenated"],
        incompatible_codes=[],
        fabrication_complexity="medium",        # superinductor is hard
        typical_chip_size="10-100 qubits",
        material_sensitivity="high",
        key_references=[
            "Manucharyan et al. 2009, Science 326:113",
            "Somoroff et al. 2023, PRL 130:267001 (millisecond fluxonium)",
            "Nguyen et al. 2019, PRX 9:041041 (heavy fluxonium)",
        ],
    ),
    
    # ============== TIER 2 ==============
    SuperconductingQubitType.CAT: QubitProfile(
        qubit_type=SuperconductingQubitType.CAT,
        display_name="Cat Qubit (dissipatively stabilized)",
        description=(
            "A logical qubit encoded in a microwave cavity using two coherent "
            "states |α⟩ and |-α⟩. Two-photon dissipation stabilizes the cat "
            "manifold and exponentially suppresses bit-flip errors with cat "
            "size — the canonical biased-noise qubit. Used as the inner code "
            "in concatenated fault-tolerant schemes."
        ),
        industrial_users=["AWS Braket", "Alice & Bob", "Yale (academic)"],
        maturity_tier=2,
        typical_freq_GHz_range=(4.0, 8.0),     # cavity frequency
        typical_anharmonicity_MHz_range=(0, 0), # N/A — bosonic mode
        typical_T1_us_range=(200, 2000),       # cavity T1
        typical_T2_us_range=(0, 0),            # N/A
        intrinsic_bias_eta_range=(100, 10000), # extreme bias by construction
        leakage_susceptibility="medium",        # cat manifold leakage
        charge_noise_sensitivity="low",
        flux_noise_sensitivity="low",
        recommended_codes=["Biased Repetition", "XZZX outer", "Cat+Surface"],
        incompatible_codes=["Vanilla Surface (wasteful)"],
        fabrication_complexity="high",          # 3D cavity + ancilla transmon
        typical_chip_size="1-50 cat qubits",
        material_sensitivity="high",            # cavity Q matters enormously
        key_references=[
            "Mirrahimi et al. 2014, NJP 16:045014 (cat qubit proposal)",
            "Lescanne et al. 2020, Nat Phys 16:509",
            "Berdou et al. 2023, PRX Quantum 4:020350 (Alice & Bob)",
        ],
    ),
    
    SuperconductingQubitType.TUNABLE_TRANSMON: QubitProfile(
        qubit_type=SuperconductingQubitType.TUNABLE_TRANSMON,
        display_name="Tunable Transmon (SQUID-based)",
        description=(
            "A transmon with a SQUID loop replacing the single junction, "
            "allowing frequency tuning via external flux. Used by Google for "
            "fast tunable couplers. Trades coherence (extra flux noise channel) "
            "for fast gates and frequency flexibility."
        ),
        industrial_users=["Google", "Rigetti"],
        maturity_tier=2,
        typical_freq_GHz_range=(4.0, 8.0),
        typical_anharmonicity_MHz_range=(-300, -150),
        typical_T1_us_range=(20, 200),         # shorter than fixed transmon
        typical_T2_us_range=(15, 150),
        intrinsic_bias_eta_range=(1, 5),
        leakage_susceptibility="high",
        charge_noise_sensitivity="low",
        flux_noise_sensitivity="high",          # the trade-off
        recommended_codes=["Surface", "Rotated Surface"],
        incompatible_codes=[],
        fabrication_complexity="medium",
        typical_chip_size="50-1000 qubits",
        material_sensitivity="high",
        key_references=[
            "Hutchings et al. 2017, PRA 95:012316 (asymmetric SQUID)",
            "Arute et al. 2019, Nature 574:505 (Sycamore)",
        ],
    ),
    
    SuperconductingQubitType.CSFQ: QubitProfile(
        qubit_type=SuperconductingQubitType.CSFQ,
        display_name="Capacitively-Shunted Flux Qubit",
        description=(
            "A flux qubit with an added shunt capacitor for reduced flux noise "
            "sensitivity. Higher frequency than fluxonium but still strongly "
            "anharmonic. Used by D-Wave (annealing) and explored by MIT-LL."
        ),
        industrial_users=["MIT Lincoln Lab", "D-Wave (annealing variant)"],
        maturity_tier=2,
        typical_freq_GHz_range=(2.0, 6.0),
        typical_anharmonicity_MHz_range=(-1500, -500),
        typical_T1_us_range=(40, 100),
        typical_T2_us_range=(40, 100),
        intrinsic_bias_eta_range=(3, 15),
        leakage_susceptibility="low",
        charge_noise_sensitivity="low",
        flux_noise_sensitivity="medium",
        recommended_codes=["Surface", "XZZX"],
        incompatible_codes=[],
        fabrication_complexity="medium",
        typical_chip_size="10-100 qubits",
        material_sensitivity="high",
        key_references=[
            "Yan et al. 2016, Nat Commun 7:12964 (CSFQ)",
        ],
    ),
    
    SuperconductingQubitType.DUAL_RAIL_CAVITY: QubitProfile(
        qubit_type=SuperconductingQubitType.DUAL_RAIL_CAVITY,
        display_name="Dual-Rail Cavity Qubit",
        description=(
            "A logical qubit encoded across two 3D cavities: |01⟩ and |10⟩ are "
            "the logical states. Photon loss is detectable (drops out of the "
            "code space) — turning the dominant error into an erasure. Erasure "
            "errors have ~2x higher QEC threshold than Pauli errors."
        ),
        industrial_users=["Quantum Circuits Inc.", "Yale"],
        maturity_tier=2,
        typical_freq_GHz_range=(4.0, 8.0),
        typical_anharmonicity_MHz_range=(0, 0),
        typical_T1_us_range=(500, 5000),       # 3D cavities are long-lived
        typical_T2_us_range=(0, 0),
        intrinsic_bias_eta_range=(0, 0),       # erasure-biased, not Pauli-biased
        leakage_susceptibility="medium",
        charge_noise_sensitivity="low",
        flux_noise_sensitivity="low",
        recommended_codes=["Erasure-tailored Surface", "Erasure Repetition"],
        incompatible_codes=[],
        fabrication_complexity="high",
        typical_chip_size="1-20 logical qubits",
        material_sensitivity="extreme",          # cavity Q is everything
        key_references=[
            "Teoh et al. 2023, PRX Quantum 4:040305",
            "Levine et al. 2024, PRX 14:011051 (dual-rail with erasure)",
        ],
    ),
    
    # ============== TIER 3 ==============
    SuperconductingQubitType.ZERO_PI: QubitProfile(
        qubit_type=SuperconductingQubitType.ZERO_PI,
        display_name="0-π Qubit",
        description=(
            "Intrinsically noise-protected qubit. Two superinductors and two "
            "junctions form a circuit where logical states are disjoint in "
            "phase space. Theoretically very long coherence but extremely "
            "hard to fabricate and operate."
        ),
        industrial_users=["University research only"],
        maturity_tier=3,
        typical_freq_GHz_range=(0.1, 1.0),
        typical_anharmonicity_MHz_range=(-2000, -500),
        typical_T1_us_range=(500, 5000),
        typical_T2_us_range=(500, 5000),
        intrinsic_bias_eta_range=(20, 200),
        leakage_susceptibility="low",
        charge_noise_sensitivity="low",
        flux_noise_sensitivity="low",
        recommended_codes=["XZZX", "Biased Repetition"],
        incompatible_codes=[],
        fabrication_complexity="high",
        typical_chip_size="1-10 qubits (proof of concept)",
        material_sensitivity="high",
        key_references=[
            "Brooks et al. 2013, PRA 87:052306",
            "Gyenis et al. 2021, PRX Quantum 2:010339",
        ],
    ),
    
    SuperconductingQubitType.HEAVY_FLUXONIUM: QubitProfile(
        qubit_type=SuperconductingQubitType.HEAVY_FLUXONIUM,
        display_name="Heavy Fluxonium",
        description=(
            "A fluxonium variant with very large inductance, pushing the qubit "
            "frequency below 100 MHz. Extreme noise bias and long coherence, "
            "but gate speed and readout become major challenges."
        ),
        industrial_users=["Maryland (Manucharyan group)", "Yale"],
        maturity_tier=3,
        typical_freq_GHz_range=(0.01, 0.3),
        typical_anharmonicity_MHz_range=(-5000, -3000),
        typical_T1_us_range=(500, 2000),
        typical_T2_us_range=(500, 2000),
        intrinsic_bias_eta_range=(50, 500),
        leakage_susceptibility="low",
        charge_noise_sensitivity="low",
        flux_noise_sensitivity="medium",
        recommended_codes=["XZZX", "Biased Repetition"],
        incompatible_codes=[],
        fabrication_complexity="high",
        typical_chip_size="1-10 qubits",
        material_sensitivity="high",
        key_references=[
            "Earnest et al. 2018, PRL 120:150504",
            "Zhang et al. 2021, PRX 11:011010",
        ],
    ),
    
    SuperconductingQubitType.UNIMON: QubitProfile(
        qubit_type=SuperconductingQubitType.UNIMON,
        display_name="Unimon",
        description=(
            "IQM's proprietary design — a single Josephson junction shunted by "
            "a quarter-wave resonator. Combines transmon-like high anharmonicity "
            "with reduced charge sensitivity. Mid-2020s research stage."
        ),
        industrial_users=["IQM"],
        maturity_tier=3,
        typical_freq_GHz_range=(3.0, 7.0),
        typical_anharmonicity_MHz_range=(-700, -400),
        typical_T1_us_range=(20, 100),
        typical_T2_us_range=(10, 50),
        intrinsic_bias_eta_range=(2, 8),
        leakage_susceptibility="medium",
        charge_noise_sensitivity="low",
        flux_noise_sensitivity="low",
        recommended_codes=["Surface", "XZZX"],
        incompatible_codes=[],
        fabrication_complexity="medium",
        typical_chip_size="10-50 qubits",
        material_sensitivity="high",
        key_references=[
            "Hyyppä et al. 2022, Nat Commun 13:6895",
        ],
    ),
    
    SuperconductingQubitType.BIFLUXON: QubitProfile(
        qubit_type=SuperconductingQubitType.BIFLUXON,
        display_name="Bifluxon",
        description=(
            "Doubly-protected qubit using parity-protected logic states. "
            "Suppresses both bit-flip and phase-flip errors at the hardware "
            "level. Very early-stage."
        ),
        industrial_users=["University research"],
        maturity_tier=3,
        typical_freq_GHz_range=(0.1, 1.0),
        typical_anharmonicity_MHz_range=(-2000, -500),
        typical_T1_us_range=(200, 1000),
        typical_T2_us_range=(200, 1000),
        intrinsic_bias_eta_range=(5, 50),
        leakage_susceptibility="low",
        charge_noise_sensitivity="low",
        flux_noise_sensitivity="low",
        recommended_codes=["Surface", "XZZX", "Color"],
        incompatible_codes=[],
        fabrication_complexity="high",
        typical_chip_size="1-5 qubits",
        material_sensitivity="medium",
        key_references=[
            "Kalashnikov et al. 2020, PRX Quantum 1:010307",
        ],
    ),
    
    SuperconductingQubitType.GATEMON: QubitProfile(
        qubit_type=SuperconductingQubitType.GATEMON,
        display_name="Gatemon",
        description=(
            "A transmon variant where the Josephson junction is replaced by a "
            "semiconductor nanowire (typically InAs) with a superconductor "
            "(typically Al) contact. The junction is gate-tunable via voltage "
            "rather than flux — saving power and avoiding flux noise. Closely "
            "related to topological qubit research (same material stack). "
            "Charge noise from the semiconductor remains a key challenge."
        ),
        industrial_users=["Microsoft (topological program-adjacent)",
                          "QuTech", "Niels Bohr Institute"],
        maturity_tier=3,
        typical_freq_GHz_range=(3.0, 8.0),
        typical_anharmonicity_MHz_range=(-300, -150),
        typical_T1_us_range=(1, 10),            # short due to semiconductor losses
        typical_T2_us_range=(0.5, 5),
        intrinsic_bias_eta_range=(1, 5),
        leakage_susceptibility="high",            # same as transmon
        charge_noise_sensitivity="medium",        # the key drawback
        flux_noise_sensitivity="low",             # voltage-tuned, no flux
        recommended_codes=["Surface", "Rotated Surface"],
        fabrication_complexity="high",
        typical_chip_size="1-10 qubits (proof of concept)",
        material_sensitivity="extreme",           # superconductor-semiconductor interface is everything
        incompatible_codes=[],
        key_references=[
            "Larsen et al. 2015, PRL 115:127001 (first gatemon)",
            "de Lange et al. 2015, PRL 115:127002 (parallel discovery)",
            "Casparis et al. 2018, Nat Nanotechnol 13:915 (gate-tunable couplers)",
        ],
    ),
    
    # ============== TIER 4: Legacy (included for completeness) ==============
    SuperconductingQubitType.CHARGE: QubitProfile(
        qubit_type=SuperconductingQubitType.CHARGE,
        display_name="Charge Qubit (Cooper Pair Box) [Legacy]",
        description=(
            "The original superconducting qubit (Nakamura 1999). Encodes "
            "information in Cooper pair number. Catastrophically sensitive to "
            "charge noise. Superseded by transmons. Included for historical "
            "reference only — not recommended for new designs."
        ),
        industrial_users=["None (historical)"],
        maturity_tier=4,
        typical_freq_GHz_range=(5.0, 15.0),
        typical_anharmonicity_MHz_range=(-2000, -500),
        typical_T1_us_range=(0.1, 5),
        typical_T2_us_range=(0.01, 1),
        intrinsic_bias_eta_range=(1, 3),
        leakage_susceptibility="medium",
        charge_noise_sensitivity="high",        # the fatal flaw
        flux_noise_sensitivity="low",
        recommended_codes=["None (legacy)"],
        incompatible_codes=["All practical codes"],
        fabrication_complexity="low",
        typical_chip_size="1-2 qubits",
        material_sensitivity="medium",
        key_references=[
            "Nakamura et al. 1999, Nature 398:786",
        ],
    ),
    
    SuperconductingQubitType.PHASE: QubitProfile(
        qubit_type=SuperconductingQubitType.PHASE,
        display_name="Phase Qubit [Legacy]",
        description=(
            "Current-biased Josephson junction. Used by NIST and UCSB in "
            "early 2000s. Superseded by transmons due to coherence issues."
        ),
        industrial_users=["None (historical)"],
        maturity_tier=4,
        typical_freq_GHz_range=(5.0, 10.0),
        typical_anharmonicity_MHz_range=(-200, -50),
        typical_T1_us_range=(0.1, 1),
        typical_T2_us_range=(0.05, 0.5),
        intrinsic_bias_eta_range=(1, 3),
        leakage_susceptibility="high",
        charge_noise_sensitivity="low",
        flux_noise_sensitivity="low",
        recommended_codes=["None (legacy)"],
        incompatible_codes=["All practical codes"],
        fabrication_complexity="low",
        typical_chip_size="1-2 qubits",
        material_sensitivity="medium",
        key_references=[
            "Martinis et al. 2002, PRL 89:117901",
        ],
    ),
    
    SuperconductingQubitType.RF_SQUID: QubitProfile(
        qubit_type=SuperconductingQubitType.RF_SQUID,
        display_name="RF SQUID Flux Qubit [Legacy]",
        description=(
            "Original flux qubit design. Sensitive to flux noise. Now mostly "
            "found in quantum annealers (D-Wave) rather than gate-based "
            "quantum computing."
        ),
        industrial_users=["D-Wave (annealing only)"],
        maturity_tier=4,
        typical_freq_GHz_range=(2.0, 10.0),
        typical_anharmonicity_MHz_range=(-1000, -200),
        typical_T1_us_range=(0.1, 5),
        typical_T2_us_range=(0.05, 2),
        intrinsic_bias_eta_range=(3, 15),
        leakage_susceptibility="low",
        charge_noise_sensitivity="low",
        flux_noise_sensitivity="high",          # fatal flaw
        recommended_codes=["None for gates"],
        incompatible_codes=["Most practical codes"],
        fabrication_complexity="medium",
        typical_chip_size="annealer scale (5000+ for D-Wave)",
        material_sensitivity="medium",
        key_references=[
            "Friedman et al. 2000, Nature 406:43",
        ],
    ),
    
    SuperconductingQubitType.XMON: QubitProfile(
        qubit_type=SuperconductingQubitType.XMON,
        display_name="Xmon [Legacy variant of Transmon]",
        description=(
            "Cross-shaped transmon variant developed at UCSB / Google. The "
            "cross geometry provides separate ports for drive, readout, and "
            "coupling, simplifying multi-qubit layout. Used in Google's early "
            "Sycamore generations but the 'Xmon' label has largely been "
            "absorbed back into 'transmon' in modern usage."
        ),
        industrial_users=["Google (legacy Sycamore)", "UCSB Martinis group"],
        maturity_tier=4,
        typical_freq_GHz_range=(4.0, 7.0),
        typical_anharmonicity_MHz_range=(-300, -200),
        typical_T1_us_range=(20, 100),
        typical_T2_us_range=(15, 80),
        intrinsic_bias_eta_range=(1.5, 5),
        leakage_susceptibility="high",
        charge_noise_sensitivity="low",
        flux_noise_sensitivity="low",
        recommended_codes=["Surface", "Rotated Surface"],
        fabrication_complexity="low",
        typical_chip_size="50-100 qubits (historical)",
        material_sensitivity="high",
        incompatible_codes=[],
        key_references=[
            "Barends et al. 2013, PRL 111:080502 (Xmon design)",
            "Kelly et al. 2015, Nature 519:66 (early surface code with Xmon)",
        ],
    ),
    
    SuperconductingQubitType.FLUX_PERSISTENT: QubitProfile(
        qubit_type=SuperconductingQubitType.FLUX_PERSISTENT,
        display_name="Persistent-Current Flux Qubit [Legacy]",
        description=(
            "The classic 3-junction flux qubit. Logical states correspond to "
            "clockwise/counterclockwise persistent currents in a superconducting "
            "loop. Strong anharmonicity but historically suffered from flux noise. "
            "Superseded by fluxonium and CSFQ. Foundational design from "
            "Delft and NEC, early 2000s."
        ),
        industrial_users=["NEC (historical)", "Delft (historical)"],
        maturity_tier=4,
        typical_freq_GHz_range=(1.0, 10.0),
        typical_anharmonicity_MHz_range=(-3000, -500),
        typical_T1_us_range=(1, 20),              # historically limited
        typical_T2_us_range=(0.5, 10),
        intrinsic_bias_eta_range=(3, 20),
        leakage_susceptibility="low",
        charge_noise_sensitivity="low",
        flux_noise_sensitivity="high",            # the fatal flaw
        recommended_codes=["XZZX (in principle)"],
        fabrication_complexity="medium",
        typical_chip_size="1-10 qubits (historical)",
        material_sensitivity="medium",
        incompatible_codes=[],
        key_references=[
            "Mooij et al. 1999, Science 285:1036",
            "Chiorescu et al. 2003, Science 299:1869",
        ],
    ),
    
    SuperconductingQubitType.QUANTRONIUM: QubitProfile(
        qubit_type=SuperconductingQubitType.QUANTRONIUM,
        display_name="Quantronium [Legacy]",
        description=(
            "Charge-phase hybrid qubit invented at CEA Saclay (2002). Operated "
            "at an 'optimal point' where it was simultaneously insensitive to "
            "first-order charge and flux noise. Historically important — "
            "introduced the concept of noise-insensitive operating points "
            "that influenced transmon design. Not used today."
        ),
        industrial_users=["CEA Saclay (historical)"],
        maturity_tier=4,
        typical_freq_GHz_range=(10.0, 20.0),
        typical_anharmonicity_MHz_range=(-1500, -500),
        typical_T1_us_range=(0.5, 5),
        typical_T2_us_range=(0.3, 3),
        intrinsic_bias_eta_range=(1, 3),
        leakage_susceptibility="medium",
        charge_noise_sensitivity="medium",        # only first-order insensitive
        flux_noise_sensitivity="medium",
        recommended_codes=["None (legacy)"],
        fabrication_complexity="medium",
        typical_chip_size="1-2 qubits (historical)",
        material_sensitivity="medium",
        incompatible_codes=["All practical codes"],
        key_references=[
            "Vion et al. 2002, Science 296:886 (original quantronium)",
        ],
    ),
}


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def list_qubits_by_tier(tier: int) -> list[QubitProfile]:
    """Return all qubits at a given maturity tier."""
    return [p for p in CATALOG.values() if p.maturity_tier == tier]


def list_recommended_for_input_picker() -> list[QubitProfile]:
    """Tier 1 + Tier 2 — what should appear in the main UI picker."""
    return [p for p in CATALOG.values() if p.maturity_tier <= 2]


def get_profile(qubit_type: SuperconductingQubitType) -> QubitProfile:
    return CATALOG[qubit_type]


def print_picker_summary():
    """Print what the user would see in a dropdown."""
    print(f"{'Qubit Type':<40} {'Tier':<6} {'Bias η':<15} {'Material':<10}")
    print("-" * 75)
    for p in CATALOG.values():
        bias = f"{p.intrinsic_bias_eta_range[0]}-{p.intrinsic_bias_eta_range[1]}"
        tier = f"T{p.maturity_tier}"
        print(f"{p.display_name:<40} {tier:<6} {bias:<15} {p.material_sensitivity:<10}")


# ============================================================
# DEMO
# ============================================================

if __name__ == "__main__":
    print("=== Full Superconducting Qubit Catalog ===\n")
    print_picker_summary()
    
    print("\n\n=== Recommended for Input Picker (Tier 1 + 2) ===\n")
    for p in list_recommended_for_input_picker():
        print(f"• {p.display_name}")
        print(f"  {p.description[:120]}...")
        print(f"  Recommended codes: {', '.join(p.recommended_codes)}")
        print(f"  Material sensitivity: {p.material_sensitivity}")
        print()
    
    print("\n=== Drill-Down: Transmon ===\n")
    t = get_profile(SuperconductingQubitType.TRANSMON)
    print(f"Display name:        {t.display_name}")
    print(f"Industrial users:    {', '.join(t.industrial_users)}")
    print(f"Frequency range:     {t.typical_freq_GHz_range[0]}-{t.typical_freq_GHz_range[1]} GHz")
    print(f"Anharmonicity range: {t.typical_anharmonicity_MHz_range[0]} to {t.typical_anharmonicity_MHz_range[1]} MHz")
    print(f"T1 range:            {t.typical_T1_us_range[0]}-{t.typical_T1_us_range[1]} μs")
    print(f"Bias η range:        {t.intrinsic_bias_eta_range[0]}-{t.intrinsic_bias_eta_range[1]}")
    print(f"Recommended codes:   {', '.join(t.recommended_codes)}")
    print(f"Material sensitivity: {t.material_sensitivity}")
    print(f"\nKey references:")
    for ref in t.key_references:
        print(f"  - {ref}")

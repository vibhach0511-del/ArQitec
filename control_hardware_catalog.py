"""
Control Hardware Catalog.

Each entry describes a control electronics stack the user can select.
Control hardware determines:
  - Minimum achievable gate times (sets coherence overhead)
  - Measurement latency (sets syndrome cycle time)
  - Channel count (sets max qubits per system)
  - Feedback latency (matters for mid-circuit measurement / active QEC)
  - Real-time decoding capability (matters for fault-tolerant operation)

These propagate into the noise model — slower hardware accumulates
more idle decoherence per QEC cycle, regardless of material quality.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


# ============================================================
# CONTROL HARDWARE TYPE ENUM
# ============================================================

class ControlHardwareType(str, Enum):
    """Categories of control electronics."""
    # Tier 1: Commercial industrial-grade
    QUANTUM_MACHINES_OPX1000 = "qm_opx1000"
    QUANTUM_MACHINES_OPX_PLUS = "qm_opx_plus"
    ZURICH_SHFQC = "zurich_shfqc"
    ZURICH_HDAWG_UHFQA = "zurich_hdawg_uhfqa"
    KEYSIGHT_M5300 = "keysight_m5300"
    KEYSIGHT_PXIE = "keysight_pxie"
    
    # Tier 2: Open-source / research-grade
    QICK_RFSOC_4x2 = "qick_rfsoc_4x2"
    QICK_RFSOC_ZCU216 = "qick_rfsoc_zcu216"
    QUALANG_QUA = "qualang_qua"
    
    # Tier 3: In-house FPGA solutions
    XILINX_RFSOC_CUSTOM = "xilinx_rfsoc_custom"
    INTEL_HORSE_RIDGE = "intel_horse_ridge"      # cryo-CMOS
    IBM_CUSTOM = "ibm_custom"                    # internal IBM stack
    GOOGLE_CUSTOM = "google_custom"              # internal Google stack
    
    # Tier 4: Legacy / academic
    LEGACY_AWG = "legacy_awg"                    # generic AWG + ADC setup


# ============================================================
# CONTROL HARDWARE PROFILE
# ============================================================

@dataclass
class ControlHardwareProfile:
    """Characteristic capabilities of a control hardware stack."""
    
    # Identification
    hw_type: ControlHardwareType
    display_name: str
    manufacturer: str
    description: str
    industrial_users: list[str]
    maturity_tier: int                          # 1 (commercial) to 4 (legacy)
    
    # ----- Timing capabilities -----
    sample_rate_GSPS: float                     # DAC sample rate (drive)
    adc_sample_rate_GSPS: float                 # ADC sample rate (readout)
    waveform_resolution_ns: float               # smallest pulse step
    
    # Achievable operation times (typical, not best-case)
    min_gate_time_1q_ns: float                  # single-qubit gate
    min_gate_time_2q_ns: float                  # two-qubit gate
    min_measure_time_ns: float                  # readout pulse + integration
    min_reset_time_ns: float                    # active reset
    
    # ----- Feedback / real-time -----
    feedback_latency_ns: float                  # measurement → conditional pulse
    supports_real_time_decoding: bool           # for active QEC
    supports_mid_circuit_measurement: bool
    
    # ----- Scale -----
    max_channels_drive: int                     # number of qubit drive lines
    max_channels_readout: int                   # number of readout lines (multiplexed)
    max_qubits_per_chassis: int                 # practical limit
    scalable_to_thousands: bool                 # via chassis stacking
    
    # ----- Frequency coverage -----
    frequency_range_GHz: tuple[float, float]    # supported qubit frequency range
    direct_synthesis: bool                      # vs requires upconversion mixers
    
    # ----- QEC-relevant capabilities -----
    syndrome_cycle_time_us_min: float           # minimum achievable QEC cycle
    decoder_integration: str                    # "none" | "external" | "onboard"
    
    # ----- Compatibility -----
    compatible_qubit_types: list[str]           # e.g. ["transmon", "fluxonium"]
    incompatible_qubit_types: list[str] = field(default_factory=list)
    
    # ----- Ecosystem -----
    sdk_languages: list[str] = field(default_factory=list)
    open_source: bool = False
    typical_cost_usd: Optional[str] = None      # rough order of magnitude
    
    # ----- References -----
    documentation_url: str = ""
    notes: str = ""


# ============================================================
# THE CATALOG
# ============================================================

CONTROL_CATALOG: dict[ControlHardwareType, ControlHardwareProfile] = {

    # ============================================================
    # TIER 1: COMMERCIAL INDUSTRIAL-GRADE
    # ============================================================
    
    ControlHardwareType.QUANTUM_MACHINES_OPX1000: ControlHardwareProfile(
        hw_type=ControlHardwareType.QUANTUM_MACHINES_OPX1000,
        display_name="Quantum Machines OPX1000",
        manufacturer="Quantum Machines",
        description=(
            "Flagship modular pulse processor with industry-leading feedback "
            "latency and real-time programmability. Modular chassis scales from "
            "8 to 1000+ channels. QUA pulse-level language with native control "
            "flow makes it the de facto choice for active QEC experiments."
        ),
        industrial_users=["IQM", "Rigetti", "Multiple national labs", "Pasqal"],
        maturity_tier=1,
        sample_rate_GSPS=2.0,
        adc_sample_rate_GSPS=2.0,
        waveform_resolution_ns=1.0,
        min_gate_time_1q_ns=10,
        min_gate_time_2q_ns=40,
        min_measure_time_ns=200,
        min_reset_time_ns=300,
        feedback_latency_ns=100,                # ~100 ns conditional latency
        supports_real_time_decoding=True,
        supports_mid_circuit_measurement=True,
        max_channels_drive=1000,
        max_channels_readout=1000,
        max_qubits_per_chassis=1000,
        scalable_to_thousands=True,
        frequency_range_GHz=(0.0, 18.0),        # with upconversion
        direct_synthesis=False,                 # needs mixers above ~1 GHz
        syndrome_cycle_time_us_min=1.0,
        decoder_integration="onboard",
        compatible_qubit_types=["transmon", "fluxonium", "tunable_transmon",
                                "cshunt_flux", "cat", "unimon"],
        sdk_languages=["QUA (Python-embedded)"],
        open_source=False,
        typical_cost_usd="$$$$ (>$1M for large systems)",
        documentation_url="https://docs.quantum-machines.co",
        notes="Industry standard for QEC research. Real-time decoding capability is the key differentiator.",
    ),
    
    ControlHardwareType.QUANTUM_MACHINES_OPX_PLUS: ControlHardwareProfile(
        hw_type=ControlHardwareType.QUANTUM_MACHINES_OPX_PLUS,
        display_name="Quantum Machines OPX+",
        manufacturer="Quantum Machines",
        description=(
            "Predecessor to OPX1000, still widely deployed. Lower channel "
            "count per chassis but similar QUA programming model. Good fit "
            "for 10-50 qubit systems."
        ),
        industrial_users=["Academic labs", "Smaller startups"],
        maturity_tier=1,
        sample_rate_GSPS=1.0,
        adc_sample_rate_GSPS=1.0,
        waveform_resolution_ns=1.0,
        min_gate_time_1q_ns=16,
        min_gate_time_2q_ns=60,
        min_measure_time_ns=250,
        min_reset_time_ns=400,
        feedback_latency_ns=200,
        supports_real_time_decoding=True,
        supports_mid_circuit_measurement=True,
        max_channels_drive=80,
        max_channels_readout=80,
        max_qubits_per_chassis=40,
        scalable_to_thousands=False,
        frequency_range_GHz=(0.0, 12.0),
        direct_synthesis=False,
        syndrome_cycle_time_us_min=2.0,
        decoder_integration="onboard",
        compatible_qubit_types=["transmon", "fluxonium", "tunable_transmon",
                                "cshunt_flux"],
        sdk_languages=["QUA (Python-embedded)"],
        open_source=False,
        typical_cost_usd="$$$ ($200K-$1M)",
        documentation_url="https://docs.quantum-machines.co",
    ),
    
    ControlHardwareType.ZURICH_SHFQC: ControlHardwareProfile(
        hw_type=ControlHardwareType.ZURICH_SHFQC,
        display_name="Zurich Instruments SHFQC",
        manufacturer="Zurich Instruments",
        description=(
            "Integrated qubit controller with direct microwave synthesis up to "
            "8.5 GHz — no external mixers required. Excellent phase stability "
            "and noise floor. Popular for high-fidelity gate calibration work."
        ),
        industrial_users=["ETH Zurich", "Multiple academic labs", "QuTech"],
        maturity_tier=1,
        sample_rate_GSPS=2.0,
        adc_sample_rate_GSPS=2.0,
        waveform_resolution_ns=0.5,
        min_gate_time_1q_ns=12,
        min_gate_time_2q_ns=50,
        min_measure_time_ns=200,
        min_reset_time_ns=500,
        feedback_latency_ns=300,
        supports_real_time_decoding=False,      # via external system
        supports_mid_circuit_measurement=True,
        max_channels_drive=6,                   # per unit, stackable
        max_channels_readout=8,
        max_qubits_per_chassis=24,
        scalable_to_thousands=False,            # requires synchronization stack
        frequency_range_GHz=(0.0, 8.5),
        direct_synthesis=True,                  # the key feature
        syndrome_cycle_time_us_min=2.5,
        decoder_integration="external",
        compatible_qubit_types=["transmon", "fluxonium", "tunable_transmon",
                                "cshunt_flux", "unimon"],
        sdk_languages=["LabOne Q (Python)", "Zurich Instruments API"],
        open_source=False,
        typical_cost_usd="$$$ ($300K-$800K for typical setup)",
        documentation_url="https://docs.zhinst.com",
        notes="Direct synthesis eliminates mixer calibration headaches. Excellent for materials characterization work.",
    ),
    
    ControlHardwareType.ZURICH_HDAWG_UHFQA: ControlHardwareProfile(
        hw_type=ControlHardwareType.ZURICH_HDAWG_UHFQA,
        display_name="Zurich HDAWG + UHFQA (Legacy Combo)",
        manufacturer="Zurich Instruments",
        description=(
            "Older Zurich stack: HDAWG for drive, UHFQA for readout. Requires "
            "external IQ mixers for microwave synthesis. Largely superseded by "
            "SHFQC but still in many older labs."
        ),
        industrial_users=["Established academic labs"],
        maturity_tier=1,
        sample_rate_GSPS=2.4,
        adc_sample_rate_GSPS=1.8,
        waveform_resolution_ns=0.5,
        min_gate_time_1q_ns=20,
        min_gate_time_2q_ns=80,
        min_measure_time_ns=300,
        min_reset_time_ns=600,
        feedback_latency_ns=600,
        supports_real_time_decoding=False,
        supports_mid_circuit_measurement=True,
        max_channels_drive=8,
        max_channels_readout=10,
        max_qubits_per_chassis=20,
        scalable_to_thousands=False,
        frequency_range_GHz=(0.0, 12.0),        # with external mixers
        direct_synthesis=False,
        syndrome_cycle_time_us_min=4.0,
        decoder_integration="external",
        compatible_qubit_types=["transmon", "fluxonium", "tunable_transmon"],
        sdk_languages=["LabOne (Python)"],
        open_source=False,
        typical_cost_usd="$$ ($150K-$400K)",
        documentation_url="https://docs.zhinst.com",
    ),
    
    ControlHardwareType.KEYSIGHT_M5300: ControlHardwareProfile(
        hw_type=ControlHardwareType.KEYSIGHT_M5300,
        display_name="Keysight M5300A Quantum Control System",
        manufacturer="Keysight Technologies",
        description=(
            "PXIe-based modular quantum control. High channel density and "
            "robust enterprise software stack. Used in some larger industrial "
            "deployments where calibration and reproducibility matter most."
        ),
        industrial_users=["Industrial R&D programs", "Defense labs"],
        maturity_tier=1,
        sample_rate_GSPS=1.0,
        adc_sample_rate_GSPS=1.0,
        waveform_resolution_ns=1.0,
        min_gate_time_1q_ns=20,
        min_gate_time_2q_ns=80,
        min_measure_time_ns=300,
        min_reset_time_ns=600,
        feedback_latency_ns=500,
        supports_real_time_decoding=False,
        supports_mid_circuit_measurement=True,
        max_channels_drive=64,
        max_channels_readout=64,
        max_qubits_per_chassis=32,
        scalable_to_thousands=False,
        frequency_range_GHz=(0.0, 12.0),
        direct_synthesis=False,
        syndrome_cycle_time_us_min=3.0,
        decoder_integration="external",
        compatible_qubit_types=["transmon", "fluxonium", "tunable_transmon"],
        sdk_languages=["Python", "MATLAB", "Keysight PathWave"],
        open_source=False,
        typical_cost_usd="$$$ ($500K-$1M)",
        documentation_url="https://www.keysight.com/quantum",
    ),
    
    ControlHardwareType.KEYSIGHT_PXIE: ControlHardwareProfile(
        hw_type=ControlHardwareType.KEYSIGHT_PXIE,
        display_name="Keysight PXIe AWG/Digitizer (general purpose)",
        manufacturer="Keysight Technologies",
        description=(
            "General-purpose PXIe AWG and digitizer cards — building blocks "
            "that many older quantum control systems were built from. Flexible "
            "but requires significant in-house firmware to compete with "
            "purpose-built systems."
        ),
        industrial_users=["DIY academic setups"],
        maturity_tier=1,
        sample_rate_GSPS=1.0,
        adc_sample_rate_GSPS=1.0,
        waveform_resolution_ns=1.0,
        min_gate_time_1q_ns=40,
        min_gate_time_2q_ns=150,
        min_measure_time_ns=500,
        min_reset_time_ns=1000,
        feedback_latency_ns=2000,                # software in the loop
        supports_real_time_decoding=False,
        supports_mid_circuit_measurement=False,  # limited
        max_channels_drive=32,
        max_channels_readout=16,
        max_qubits_per_chassis=16,
        scalable_to_thousands=False,
        frequency_range_GHz=(0.0, 6.0),
        direct_synthesis=False,
        syndrome_cycle_time_us_min=10.0,
        decoder_integration="external",
        compatible_qubit_types=["transmon", "fluxonium"],
        sdk_languages=["Python", "C", "MATLAB"],
        open_source=False,
        typical_cost_usd="$$ ($100K-$400K)",
        documentation_url="https://www.keysight.com",
    ),
    
    # ============================================================
    # TIER 2: OPEN-SOURCE / RESEARCH-GRADE
    # ============================================================
    
    ControlHardwareType.QICK_RFSOC_4x2: ControlHardwareProfile(
        hw_type=ControlHardwareType.QICK_RFSOC_4x2,
        display_name="QICK on Xilinx RFSoC 4x2",
        manufacturer="Fermilab / Open Source",
        description=(
            "Open-source Quantum Instrumentation Control Kit on Xilinx RFSoC. "
            "Direct synthesis to ~6 GHz, fully programmable in Python. The "
            "most cost-effective entry point for academic groups. Smaller "
            "channel count but excellent firmware extensibility."
        ),
        industrial_users=["Fermilab", "U. Chicago", "Many academic labs"],
        maturity_tier=2,
        sample_rate_GSPS=6.144,
        adc_sample_rate_GSPS=2.4576,
        waveform_resolution_ns=2.6,             # 384 MHz clock
        min_gate_time_1q_ns=20,
        min_gate_time_2q_ns=80,
        min_measure_time_ns=500,
        min_reset_time_ns=1000,
        feedback_latency_ns=400,
        supports_real_time_decoding=False,      # but feasible with custom firmware
        supports_mid_circuit_measurement=True,
        max_channels_drive=4,
        max_channels_readout=2,
        max_qubits_per_chassis=4,
        scalable_to_thousands=False,
        frequency_range_GHz=(0.0, 6.0),
        direct_synthesis=True,
        syndrome_cycle_time_us_min=3.0,
        decoder_integration="external",
        compatible_qubit_types=["transmon", "fluxonium"],
        sdk_languages=["Python (qick library)"],
        open_source=True,
        typical_cost_usd="$ ($10K-$15K for board)",
        documentation_url="https://github.com/openquantumhardware/qick",
        notes="Best price/performance for small-scale academic work. Material characterization fits here.",
    ),
    
    ControlHardwareType.QICK_RFSOC_ZCU216: ControlHardwareProfile(
        hw_type=ControlHardwareType.QICK_RFSOC_ZCU216,
        display_name="QICK on Xilinx ZCU216",
        manufacturer="Fermilab / Open Source",
        description=(
            "Larger QICK variant on Xilinx ZCU216 board — 16 DAC + 16 ADC "
            "channels. Same firmware ecosystem as the 4x2 but scales to ~8-16 "
            "qubits per board. Popular for mid-scale academic experiments."
        ),
        industrial_users=["Fermilab", "Multiple academic groups"],
        maturity_tier=2,
        sample_rate_GSPS=9.85,
        adc_sample_rate_GSPS=2.5,
        waveform_resolution_ns=2.6,
        min_gate_time_1q_ns=20,
        min_gate_time_2q_ns=80,
        min_measure_time_ns=400,
        min_reset_time_ns=800,
        feedback_latency_ns=400,
        supports_real_time_decoding=False,
        supports_mid_circuit_measurement=True,
        max_channels_drive=16,
        max_channels_readout=16,
        max_qubits_per_chassis=16,
        scalable_to_thousands=False,
        frequency_range_GHz=(0.0, 10.0),
        direct_synthesis=True,
        syndrome_cycle_time_us_min=3.0,
        decoder_integration="external",
        compatible_qubit_types=["transmon", "fluxonium", "tunable_transmon"],
        sdk_languages=["Python (qick library)"],
        open_source=True,
        typical_cost_usd="$$ ($30K-$50K)",
        documentation_url="https://github.com/openquantumhardware/qick",
    ),
    
    ControlHardwareType.QUALANG_QUA: ControlHardwareProfile(
        hw_type=ControlHardwareType.QUALANG_QUA,
        display_name="QuaLang / QUA-compatible generic stack",
        manufacturer="Quantum Machines (language)",
        description=(
            "Catch-all for QUA-compatible hardware that doesn't fit a specific "
            "OPX SKU. Used to model custom integrations of Quantum Machines IP "
            "into broader systems."
        ),
        industrial_users=["Various"],
        maturity_tier=2,
        sample_rate_GSPS=1.0,
        adc_sample_rate_GSPS=1.0,
        waveform_resolution_ns=1.0,
        min_gate_time_1q_ns=16,
        min_gate_time_2q_ns=60,
        min_measure_time_ns=250,
        min_reset_time_ns=500,
        feedback_latency_ns=200,
        supports_real_time_decoding=True,
        supports_mid_circuit_measurement=True,
        max_channels_drive=50,
        max_channels_readout=50,
        max_qubits_per_chassis=25,
        scalable_to_thousands=False,
        frequency_range_GHz=(0.0, 12.0),
        direct_synthesis=False,
        syndrome_cycle_time_us_min=2.0,
        decoder_integration="onboard",
        compatible_qubit_types=["transmon", "fluxonium"],
        sdk_languages=["QUA"],
        open_source=False,
        typical_cost_usd="$$",
        documentation_url="https://docs.quantum-machines.co",
    ),
    
    # ============================================================
    # TIER 3: IN-HOUSE / SPECIALIZED
    # ============================================================
    
    ControlHardwareType.XILINX_RFSOC_CUSTOM: ControlHardwareProfile(
        hw_type=ControlHardwareType.XILINX_RFSOC_CUSTOM,
        display_name="Custom Xilinx RFSoC FPGA stack",
        manufacturer="In-house (Xilinx silicon)",
        description=(
            "Generic custom Xilinx RFSoC build with proprietary firmware. "
            "Performance varies widely depending on firmware quality. Used by "
            "well-funded research groups and stealth startups."
        ),
        industrial_users=["Stealth-mode startups", "Industrial research"],
        maturity_tier=3,
        sample_rate_GSPS=6.0,
        adc_sample_rate_GSPS=2.5,
        waveform_resolution_ns=2.0,
        min_gate_time_1q_ns=20,
        min_gate_time_2q_ns=80,
        min_measure_time_ns=400,
        min_reset_time_ns=800,
        feedback_latency_ns=300,
        supports_real_time_decoding=True,       # if firmware supports
        supports_mid_circuit_measurement=True,
        max_channels_drive=16,
        max_channels_readout=16,
        max_qubits_per_chassis=16,
        scalable_to_thousands=False,
        frequency_range_GHz=(0.0, 10.0),
        direct_synthesis=True,
        syndrome_cycle_time_us_min=2.5,
        decoder_integration="onboard",
        compatible_qubit_types=["transmon", "fluxonium"],
        sdk_languages=["Custom (varies)"],
        open_source=False,
        typical_cost_usd="$$ (R&D investment varies)",
        documentation_url="",
        notes="Performance highly dependent on in-house firmware quality.",
    ),
    
    ControlHardwareType.INTEL_HORSE_RIDGE: ControlHardwareProfile(
        hw_type=ControlHardwareType.INTEL_HORSE_RIDGE,
        display_name="Intel Horse Ridge II (Cryo-CMOS)",
        manufacturer="Intel",
        description=(
            "Cryogenic CMOS controller — sits inside the dilution fridge at "
            "~4 K, dramatically reducing cable count and improving scalability "
            "for large qubit arrays. Research stage; promising for >1000 qubit "
            "systems."
        ),
        industrial_users=["Intel", "QuTech (collaboration)"],
        maturity_tier=3,
        sample_rate_GSPS=2.0,
        adc_sample_rate_GSPS=2.0,
        waveform_resolution_ns=2.0,
        min_gate_time_1q_ns=20,
        min_gate_time_2q_ns=80,
        min_measure_time_ns=300,
        min_reset_time_ns=500,
        feedback_latency_ns=100,                # very low — sits next to qubits
        supports_real_time_decoding=True,
        supports_mid_circuit_measurement=True,
        max_channels_drive=128,
        max_channels_readout=128,
        max_qubits_per_chassis=128,
        scalable_to_thousands=True,             # the whole point
        frequency_range_GHz=(2.0, 20.0),
        direct_synthesis=True,
        syndrome_cycle_time_us_min=1.5,
        decoder_integration="onboard",
        compatible_qubit_types=["transmon", "silicon_spin"],
        sdk_languages=["Custom"],
        open_source=False,
        typical_cost_usd="Not commercially available",
        documentation_url="",
        notes="Game-changer for large-scale if commercialized. Currently research-stage.",
    ),
    
    ControlHardwareType.IBM_CUSTOM: ControlHardwareProfile(
        hw_type=ControlHardwareType.IBM_CUSTOM,
        display_name="IBM in-house control stack",
        manufacturer="IBM (internal)",
        description=(
            "IBM's proprietary control electronics for Heron / Condor / Flamingo "
            "systems. Not commercially available — modeled here for resource "
            "estimation against IBM published specs."
        ),
        industrial_users=["IBM only"],
        maturity_tier=3,
        sample_rate_GSPS=2.0,
        adc_sample_rate_GSPS=2.0,
        waveform_resolution_ns=1.0,
        min_gate_time_1q_ns=24,                 # IBM published
        min_gate_time_2q_ns=68,                 # CZ on Heron
        min_measure_time_ns=560,
        min_reset_time_ns=500,
        feedback_latency_ns=600,
        supports_real_time_decoding=True,       # for QEC experiments
        supports_mid_circuit_measurement=True,
        max_channels_drive=1000,
        max_channels_readout=1000,
        max_qubits_per_chassis=1000,
        scalable_to_thousands=True,
        frequency_range_GHz=(4.0, 8.0),
        direct_synthesis=False,
        syndrome_cycle_time_us_min=1.1,         # IBM published syndrome cycle
        decoder_integration="onboard",
        compatible_qubit_types=["transmon"],
        sdk_languages=["Qiskit (high-level)", "internal"],
        open_source=False,
        typical_cost_usd="Not for sale",
        documentation_url="https://docs.quantum-computing.ibm.com",
    ),
    
    ControlHardwareType.GOOGLE_CUSTOM: ControlHardwareProfile(
        hw_type=ControlHardwareType.GOOGLE_CUSTOM,
        display_name="Google in-house control stack",
        manufacturer="Google (internal)",
        description=(
            "Google's proprietary control for Sycamore / Willow processors. "
            "Not commercially available. Optimized for tunable transmons and "
            "their specific gate set."
        ),
        industrial_users=["Google only"],
        maturity_tier=3,
        sample_rate_GSPS=2.0,
        adc_sample_rate_GSPS=2.0,
        waveform_resolution_ns=1.0,
        min_gate_time_1q_ns=25,
        min_gate_time_2q_ns=42,                 # ~fast CZ on Willow
        min_measure_time_ns=500,
        min_reset_time_ns=350,
        feedback_latency_ns=500,
        supports_real_time_decoding=True,
        supports_mid_circuit_measurement=True,
        max_channels_drive=200,                 # Willow scale
        max_channels_readout=200,
        max_qubits_per_chassis=200,
        scalable_to_thousands=True,
        frequency_range_GHz=(4.0, 8.0),
        direct_synthesis=False,
        syndrome_cycle_time_us_min=1.0,         # Google published
        decoder_integration="onboard",
        compatible_qubit_types=["tunable_transmon", "transmon"],
        sdk_languages=["Cirq (high-level)", "internal"],
        open_source=False,
        typical_cost_usd="Not for sale",
        documentation_url="https://quantumai.google",
    ),
    
    # ============================================================
    # TIER 4: LEGACY
    # ============================================================
    
    ControlHardwareType.LEGACY_AWG: ControlHardwareProfile(
        hw_type=ControlHardwareType.LEGACY_AWG,
        display_name="Generic AWG + ADC (legacy academic setup)",
        manufacturer="Various (Tektronix, etc.)",
        description=(
            "Older generic arbitrary waveform generator + digitizer setup, "
            "typically with software-controlled feedback loops. Slow and "
            "inflexible for modern QEC, included for completeness."
        ),
        industrial_users=["Older academic labs"],
        maturity_tier=4,
        sample_rate_GSPS=1.0,
        adc_sample_rate_GSPS=1.0,
        waveform_resolution_ns=1.0,
        min_gate_time_1q_ns=50,
        min_gate_time_2q_ns=200,
        min_measure_time_ns=1000,
        min_reset_time_ns=2000,
        feedback_latency_ns=10000,              # software loop
        supports_real_time_decoding=False,
        supports_mid_circuit_measurement=False,
        max_channels_drive=8,
        max_channels_readout=4,
        max_qubits_per_chassis=4,
        scalable_to_thousands=False,
        frequency_range_GHz=(0.0, 6.0),
        direct_synthesis=False,
        syndrome_cycle_time_us_min=50.0,
        decoder_integration="none",
        compatible_qubit_types=["transmon"],
        sdk_languages=["Python", "MATLAB", "LabVIEW"],
        open_source=False,
        typical_cost_usd="$ ($50K-$200K)",
        notes="Not viable for QEC at any meaningful scale.",
    ),
}


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def list_by_tier(tier: int) -> list[ControlHardwareProfile]:
    return [p for p in CONTROL_CATALOG.values() if p.maturity_tier == tier]


def list_for_input_picker() -> list[ControlHardwareProfile]:
    """Tier 1 + 2 — what shows in the user-facing dropdown."""
    return [p for p in CONTROL_CATALOG.values() if p.maturity_tier <= 2]


def filter_by_capability(
    requires_real_time_decoding: bool = False,
    requires_mid_circuit_measurement: bool = False,
    min_qubits: int = 0,
    max_syndrome_cycle_us: Optional[float] = None,
    compatible_qubit_type: Optional[str] = None,
) -> list[ControlHardwareProfile]:
    """Find hardware that meets a set of capability requirements."""
    results = []
    for p in CONTROL_CATALOG.values():
        if requires_real_time_decoding and not p.supports_real_time_decoding:
            continue
        if requires_mid_circuit_measurement and not p.supports_mid_circuit_measurement:
            continue
        if p.max_qubits_per_chassis < min_qubits:
            continue
        if max_syndrome_cycle_us is not None and p.syndrome_cycle_time_us_min > max_syndrome_cycle_us:
            continue
        if compatible_qubit_type and compatible_qubit_type not in p.compatible_qubit_types:
            continue
        results.append(p)
    return results


def get_profile(hw_type: ControlHardwareType) -> ControlHardwareProfile:
    return CONTROL_CATALOG[hw_type]


def print_picker_summary():
    """One-line summary per system, like a dropdown preview."""
    print(f"{'Hardware':<45} {'Tier':<6} {'1Q ns':<8} {'2Q ns':<8} "
          f"{'Cycle μs':<10} {'Max Q':<8} {'RT Dec':<8}")
    print("-" * 95)
    for p in CONTROL_CATALOG.values():
        rt = "✓" if p.supports_real_time_decoding else "✗"
        print(f"{p.display_name:<45} T{p.maturity_tier:<5} "
              f"{p.min_gate_time_1q_ns:<8} {p.min_gate_time_2q_ns:<8} "
              f"{p.syndrome_cycle_time_us_min:<10} {p.max_qubits_per_chassis:<8} {rt:<8}")


# ============================================================
# DEMO
# ============================================================

if __name__ == "__main__":
    print("=== Control Hardware Catalog (Summary) ===\n")
    print_picker_summary()
    
    print("\n\n=== Picker Recommendations (Tier 1 + 2) ===\n")
    for p in list_for_input_picker():
        print(f"• {p.display_name} ({p.manufacturer})")
        print(f"  {p.description[:130]}...")
        print(f"  Cost: {p.typical_cost_usd}")
        print()
    
    print("\n=== Capability filter: Real-time decoding + ≥100 qubits ===\n")
    matches = filter_by_capability(
        requires_real_time_decoding=True,
        min_qubits=100,
    )
    for p in matches:
        print(f"  • {p.display_name} (max {p.max_qubits_per_chassis} qubits)")
    
    print("\n=== Drill-down: Quantum Machines OPX1000 ===\n")
    qm = get_profile(ControlHardwareType.QUANTUM_MACHINES_OPX1000)
    print(f"Manufacturer:          {qm.manufacturer}")
    print(f"Sample rate:           {qm.sample_rate_GSPS} GSPS")
    print(f"Min 1Q / 2Q gate:      {qm.min_gate_time_1q_ns} ns / {qm.min_gate_time_2q_ns} ns")
    print(f"Min syndrome cycle:    {qm.syndrome_cycle_time_us_min} μs")
    print(f"Feedback latency:      {qm.feedback_latency_ns} ns")
    print(f"Max qubits/chassis:    {qm.max_qubits_per_chassis}")
    print(f"Real-time decoding:    {qm.supports_real_time_decoding}")
    print(f"Compatible qubits:     {', '.join(qm.compatible_qubit_types)}")

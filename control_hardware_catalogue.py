"""
Control hardware catalogue.

Each entry describes one piece of the control / readout stack that sits
between room-temperature classical compute and the qubit chip. For a QEC
plan to be implementable you need at least one entry from each tier of
the stack — pulse generation, cryogenic amplification, the cryostat
itself, and (for surface code) a real-time decoder in the feedback loop.

Numbers are illustrative representative values for each product family.
Replace with measured / quoted specs from the vendor before architectural
decisions; cite sources in the `notes` field as the catalogue tightens.

Field tiers:
  REQUIRED          name, vendor, category
  KEY OPERATIONAL   channel count, operating temperature, feedback latency,
                    real-time decoding, sample rate, bandwidth
  COMPATIBILITY     which qubit platforms / topologies it serves
  ECONOMICS         rough cost per channel, scalability ceiling
"""

from typing import Literal, TypedDict


Category = Literal[
    "room-temp-controller",  # AWG + FPGA, drives pulses from outside the cryostat
    "cryogenic-controller",  # control electronics inside the cold stage
    "parametric-amplifier",  # near-quantum-limited readout amp (TWPA, JPA)
    "hemt-amplifier",        # 4 K stage cryogenic semiconductor amp
    "digitizer",             # ADC for readout signal acquisition
    "dilution-refrigerator", # the cryostat
    "ion-trap-controller",   # laser + RF for trapped ions
    "photonic-controller",   # delay lines, switches, detectors for photonic platforms
]


class ControlHardware(TypedDict, total=False):
    # --- REQUIRED ---
    name: str
    vendor: str
    category: Category

    # --- KEY OPERATIONAL ---
    output_channels: int          # analog channels per unit / chassis
    max_qubits: int               # typical qubit count a single system supports
    operating_temp_K: float       # 300 = room, 4 = 4K stage, 0.02 = 20 mK
    latency_feedback_ns: float    # measurement → conditional gate, round-trip
    real_time_decoding: bool      # can run a QEC decoder in the feedback loop
    sample_rate_GSps: float       # DAC / ADC sample rate
    bandwidth_MHz: float          # analog bandwidth per channel

    # --- COMPATIBILITY ---
    supports_platforms: list[str] # which qubit families this drives
    supports_topology: list[str]  # which connectivity patterns it serves

    # --- ECONOMICS ---
    cost_per_channel_kUSD: float  # rough order of magnitude
    scalability_ceiling: int      # max qubits without architectural rework

    # --- NOTES ---
    notes: str


HARDWARE: list[ControlHardware] = [
    {
        "name":                "OPX1000",
        "vendor":              "Quantum Machines",
        "category":            "room-temp-controller",
        "output_channels":     80,
        "max_qubits":          40,
        "operating_temp_K":    300,
        "latency_feedback_ns": 300,
        "real_time_decoding":  True,
        "sample_rate_GSps":    1.0,
        "bandwidth_MHz":       500,
        "supports_platforms":  ["transmon", "fluxonium", "neutral-atom", "silicon-spin"],
        "supports_topology":   ["2d-nn", "heavy-hex", "reconfigurable"],
        "cost_per_channel_kUSD": 8,
        "scalability_ceiling": 1000,
        "notes":               "FPGA-based pulse processor; real-time control flow inside the controller makes mid-circuit QEC feedback feasible.",
    },
    {
        "name":                "SHFQC",
        "vendor":              "Zurich Instruments",
        "category":            "room-temp-controller",
        "output_channels":     16,
        "max_qubits":          8,
        "operating_temp_K":    300,
        "latency_feedback_ns": 400,
        "real_time_decoding":  False,
        "sample_rate_GSps":    2.0,
        "bandwidth_MHz":       1000,
        "supports_platforms":  ["transmon", "fluxonium"],
        "supports_topology":   ["2d-nn", "heavy-hex"],
        "cost_per_channel_kUSD": 12,
        "scalability_ceiling": 64,
        "notes":               "Tight integration of qubit drive and dispersive readout in one unit; ceiling driven by per-chassis channel count.",
    },
    {
        "name":                "Cluster",
        "vendor":              "Qblox",
        "category":            "room-temp-controller",
        "output_channels":     16,
        "max_qubits":          16,
        "operating_temp_K":    300,
        "latency_feedback_ns": 600,
        "real_time_decoding":  True,
        "sample_rate_GSps":    1.0,
        "bandwidth_MHz":       400,
        "supports_platforms":  ["transmon", "fluxonium", "silicon-spin"],
        "supports_topology":   ["2d-nn", "heavy-hex"],
        "cost_per_channel_kUSD": 7,
        "scalability_ceiling": 512,
        "notes":               "Modular rack-mount; FPGA per module enables distributed decoder schemes.",
    },
    {
        "name":                "M9415 AWG",
        "vendor":              "Keysight",
        "category":            "room-temp-controller",
        "output_channels":     8,
        "max_qubits":          4,
        "operating_temp_K":    300,
        "latency_feedback_ns": 2000,
        "real_time_decoding":  False,
        "sample_rate_GSps":    16.0,
        "bandwidth_MHz":       5000,
        "supports_platforms":  ["transmon", "fluxonium", "photonic"],
        "supports_topology":   ["2d-nn", "reconfigurable"],
        "cost_per_channel_kUSD": 20,
        "scalability_ceiling": 32,
        "notes":               "Highest signal fidelity in the catalogue; latency rules it out of the QEC feedback loop.",
    },
    {
        "name":                "Horse Ridge II",
        "vendor":              "Intel",
        "category":            "cryogenic-controller",
        "output_channels":     32,
        "max_qubits":          32,
        "operating_temp_K":    4,
        "latency_feedback_ns": 80,
        "real_time_decoding":  False,
        "sample_rate_GSps":    1.5,
        "bandwidth_MHz":       300,
        "supports_platforms":  ["silicon-spin", "transmon"],
        "supports_topology":   ["2d-nn"],
        "cost_per_channel_kUSD": 3,
        "scalability_ceiling": 10000,
        "notes":               "Cryogenic CMOS — moving control inside the 4 K stage is the credible path past ~1000 qubits, where room-temp wiring breaks.",
    },
    {
        "name":                "Gooseberry-class cryo-ASIC",
        "vendor":              "Microsoft (reference design)",
        "category":            "cryogenic-controller",
        "output_channels":     64,
        "max_qubits":          64,
        "operating_temp_K":    0.1,
        "latency_feedback_ns": 50,
        "real_time_decoding":  True,
        "sample_rate_GSps":    1.0,
        "bandwidth_MHz":       200,
        "supports_platforms":  ["silicon-spin", "topological"],
        "supports_topology":   ["2d-nn"],
        "cost_per_channel_kUSD": 2,
        "scalability_ceiling": 1000000,
        "notes":               "Sub-Kelvin ASIC reference design; on-die decoder logic is what makes million-qubit surface code thinkable.",
    },
    {
        "name":                "TWPA (kinetic-inductance)",
        "vendor":              "Princeton / IBM / Caltech (research)",
        "category":            "parametric-amplifier",
        "output_channels":     8,
        "max_qubits":          8,
        "operating_temp_K":    0.02,
        "sample_rate_GSps":    0.0,
        "bandwidth_MHz":       3000,
        "supports_platforms":  ["transmon", "fluxonium"],
        "supports_topology":   ["2d-nn", "heavy-hex"],
        "cost_per_channel_kUSD": 15,
        "scalability_ceiling": 100,
        "notes":               "Travelling-wave parametric amp; near-quantum-limited noise across multi-GHz band. Enables fast, multiplexed dispersive readout.",
    },
    {
        "name":                "LNC4_8C HEMT",
        "vendor":              "Low Noise Factory",
        "category":            "hemt-amplifier",
        "output_channels":     1,
        "max_qubits":          1,
        "operating_temp_K":    4,
        "sample_rate_GSps":    0.0,
        "bandwidth_MHz":       4000,
        "supports_platforms":  ["transmon", "fluxonium", "silicon-spin"],
        "supports_topology":   ["2d-nn", "heavy-hex"],
        "cost_per_channel_kUSD": 6,
        "scalability_ceiling": 1000,
        "notes":               "4 K HEMT — second-stage amp downstream of a TWPA. Quoted noise temperature ~3 K.",
    },
    {
        "name":                "LD400 / KIDE",
        "vendor":              "Bluefors",
        "category":            "dilution-refrigerator",
        "output_channels":     0,
        "max_qubits":          0,
        "operating_temp_K":    0.01,
        "real_time_decoding":  False,
        "sample_rate_GSps":    0.0,
        "bandwidth_MHz":       0.0,
        "supports_platforms":  ["transmon", "fluxonium", "silicon-spin", "cat-qubit", "topological"],
        "supports_topology":   ["2d-nn", "heavy-hex", "3-colorable"],
        "cost_per_channel_kUSD": 0,
        "scalability_ceiling": 5000,
        "notes":               "Cryostat itself. Wiring density (lines per refrigerator) is the underrated scaling bottleneck — drives the move toward cryogenic ASIC controllers.",
    },
    {
        "name":                "Ion-trap control rack (modular)",
        "vendor":              "Sandia / Quantinuum / IonQ-class",
        "category":            "ion-trap-controller",
        "output_channels":     128,
        "max_qubits":          64,
        "operating_temp_K":    300,
        "latency_feedback_ns": 500,
        "real_time_decoding":  True,
        "sample_rate_GSps":    1.0,
        "bandwidth_MHz":       100,
        "supports_platforms":  ["trapped-ion"],
        "supports_topology":   ["all-to-all", "3-colorable"],
        "cost_per_channel_kUSD": 10,
        "scalability_ceiling": 500,
        "notes":               "Drives lasers, RF traps, ion-shuttling waveforms. All-to-all connectivity is the unique architectural unlock vs. solid-state.",
    },
]


REQUIRED_FIELDS = ("name", "vendor", "category")
KEY_OPERATIONAL_FIELDS = (
    "operating_temp_K", "supports_platforms", "scalability_ceiling",
)


def validate(h: dict) -> tuple[list[str], list[str]]:
    errors, warnings = [], []
    for f in REQUIRED_FIELDS:
        if f not in h or h[f] in (None, ""):
            errors.append(f"missing required field: {f!r}")
    for f in KEY_OPERATIONAL_FIELDS:
        if f not in h:
            warnings.append(f"missing key operational field: {f!r}")
    if "operating_temp_K" in h:
        if not isinstance(h["operating_temp_K"], (int, float)) or h["operating_temp_K"] < 0:
            errors.append("operating_temp_K must be non-negative")
    if "real_time_decoding" in h and not isinstance(h["real_time_decoding"], bool):
        errors.append("real_time_decoding must be bool")
    return errors, warnings


def by_category(c: Category) -> list[ControlHardware]:
    return [h for h in HARDWARE if h.get("category") == c]


def by_platform(p: str) -> list[ControlHardware]:
    return [h for h in HARDWARE if p in h.get("supports_platforms", [])]


def cold_stage_only() -> list[ControlHardware]:
    """Hardware that lives inside the cryostat — drives the long-horizon
    scaling story past room-temp wiring limits."""
    return [h for h in HARDWARE if h.get("operating_temp_K", 300) < 50]


if __name__ == "__main__":
    print("Validation:")
    any_err = False
    for h in HARDWARE:
        e, w = validate(h)
        if e:
            any_err = True
            print(f"  ✗ {h['name']}: errors={e}")
        else:
            print(f"  ✓ {h['vendor']} {h['name']}  (warnings={len(w)})")
    print()
    if any_err:
        raise SystemExit("Schema errors above.")

    print(f"{'PRODUCT':<42} {'CATEGORY':<24} {'T (K)':>7} {'CH':>4} "
          f"{'LATENCY (ns)':>13} {'RT-DEC':>7}  PLATFORMS")
    print("-" * 140)
    for h in HARDWARE:
        rt = "yes" if h.get("real_time_decoding") else "no"
        lat = h.get("latency_feedback_ns", float("nan"))
        lat_s = f"{lat:.0f}" if lat == lat else "—"
        print(
            f"{h['vendor'] + ' ' + h['name']:<42} "
            f"{h['category']:<24} "
            f"{h['operating_temp_K']:>7.3g} "
            f"{h.get('output_channels', 0):>4} "
            f"{lat_s:>13} "
            f"{rt:>7}  "
            f"{', '.join(h.get('supports_platforms', []))}"
        )

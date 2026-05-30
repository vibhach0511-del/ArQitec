"""Stage 1 — Material -> Error model.

A small library of (material, qubit architecture) -> noise_profile mappings,
with numbers drawn from / calibrated to recent published data:

  * Place et al., Nature Communications 12, 1779 (2021) — tantalum/sapphire
    transmons, T1 up to ~0.3 ms.
  * IBM Heron (r1/r2) device specs — niobium/silicon transmons, mid T1.
  * Google "Willow" / Sycamore below-threshold surface-code demo, Nature 2024.
  * Fluxonium literature (e.g. Nguyen et al. 2019; Somoroff et al. 2023) —
    strong dephasing bias.

MODELING-HONESTY NOTE (put this on a slide):
  Idle T1/T2 errors are *mostly material*; two-qubit gate fidelity is *mostly
  control + architecture*. So here we model idle + single-qubit Pauli errors
  per material and hold the **two-qubit gate error fixed** across materials
  (P_GATE_2Q). That is a deliberate, defensible hackathon simplification.

A noise profile is the dict described in the brief:
  p_X, p_Z, p_Y          : single-qubit Pauli error rates per gate
  p_leakage              : leakage per gate (tracked, not natively Stim-able)
  p_correlated           : correlated burst rate per qubit per cycle (cosmic rays)
  T1_us, T2_us           : coherence times
  bias_eta               : p_Z / (p_X + p_Y), the noise-bias parameter
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field, asdict


# Fixed two-qubit gate error, held constant across materials (see note above).
# Representative of current good superconducting CZ/CNOT (~0.5%).
P_GATE_2Q = 5e-3

# Surface-code syndrome-extraction round wall-clock time (ns). One round =
# a handful of 2Q gates + measurement. Used for idle-decoherence accounting.
ROUND_TIME_NS = 1000.0


@dataclass
class NoiseProfile:
    name: str
    short: str
    architecture: str
    p_X: float
    p_Z: float
    p_Y: float
    p_leakage: float
    p_correlated: float
    T1_us: float
    T2_us: float
    # Single-qubit + measurement timing/error context.
    gate_time_ns: float = 35.0
    readout_error: float = 1e-2
    p_gate_2q: float = P_GATE_2Q
    citation: str = ""

    @property
    def bias_eta(self) -> float:
        """p_Z / (p_X + p_Y) — the bias parameter."""
        denom = self.p_X + self.p_Y
        return self.p_Z / denom if denom > 0 else math.inf

    @property
    def p_1q_total(self) -> float:
        return self.p_X + self.p_Y + self.p_Z

    def to_dict(self) -> dict:
        d = asdict(self)
        d["bias_eta"] = round(self.bias_eta, 3)
        d["p_1q_total"] = self.p_1q_total
        return d


# ---------------------------------------------------------------------------
# The material library. p_X/p_Y/p_Z are per single-qubit-gate Pauli rates;
# bias_eta falls out of them. Idle errors are derived separately from T1/T2.
# ---------------------------------------------------------------------------

MATERIALS: list[NoiseProfile] = [
    NoiseProfile(
        name="Tantalum / sapphire transmon",
        short="Ta/sapphire",
        architecture="2D fixed-frequency transmon",
        p_X=4.0e-5, p_Y=3.0e-5, p_Z=2.1e-4,
        p_leakage=1.0e-5, p_correlated=1.0e-6,
        T1_us=300.0, T2_us=200.0,
        gate_time_ns=30.0, readout_error=7e-3,
        citation="Place et al., Nat. Commun. 2021 (Ta on sapphire, T1~0.3ms).",
    ),
    NoiseProfile(
        name="Niobium / silicon transmon (Heron-class)",
        short="Nb/Si",
        architecture="2D tunable-coupler transmon",
        p_X=1.2e-4, p_Y=8.0e-5, p_Z=3.6e-4,
        p_leakage=2.0e-5, p_correlated=1.5e-6,
        T1_us=180.0, T2_us=120.0,
        gate_time_ns=35.0, readout_error=1.0e-2,
        citation="IBM Heron r1/r2 device specs; Google Willow Nature 2024.",
    ),
    NoiseProfile(
        name="Aluminum transmon (legacy baseline)",
        short="Al (legacy)",
        architecture="2D fixed-frequency transmon",
        p_X=3.5e-4, p_Y=2.5e-4, p_Z=7.8e-4,
        p_leakage=5.0e-5, p_correlated=3.0e-6,
        T1_us=90.0, T2_us=70.0,
        gate_time_ns=40.0, readout_error=1.5e-2,
        citation="Pre-Ta aluminum transmons (~2015-2019 era), T1~80-100us.",
    ),
    NoiseProfile(
        name="Fluxonium (dephasing-biased)",
        short="Fluxonium",
        architecture="2D heavy-fluxonium",
        p_X=2.0e-5, p_Y=1.5e-5, p_Z=5.6e-4,
        p_leakage=8.0e-6, p_correlated=1.0e-6,
        T1_us=800.0, T2_us=400.0,
        gate_time_ns=60.0, readout_error=1.2e-2,
        citation="Nguyen et al. 2019; Somoroff et al. 2023 (high-bias regime).",
    ),
    NoiseProfile(
        name="Ideal biased material (upper bound)",
        short="Ideal-biased",
        architecture="hypothetical engineered-bias qubit",
        p_X=5.0e-7, p_Y=5.0e-7, p_Z=1.0e-3,
        p_leakage=1.0e-7, p_correlated=1.0e-8,
        T1_us=5000.0, T2_us=3000.0,
        gate_time_ns=25.0, readout_error=3e-3,
        citation="Hypothetical cat-qubit-like bias upper bound (eta ~ 1000).",
    ),
]

MATERIAL_BY_SHORT = {m.short: m for m in MATERIALS}


def idle_pauli_from_T(T1_us: float, T2_us: float, t_ns: float) -> tuple[float, float, float]:
    """Pauli-twirl approximation of amplitude+phase damping over idle time t.

    Returns (px, py, pz). Standard relations:
        p_relax = 1 - exp(-t/T1)        -> px = py = p_relax/4
        1/Tphi  = 1/T2 - 1/(2 T1)
        p_deph  = (1 - exp(-t/Tphi))/2  -> pz = p_deph - p_relax/4

    GOTCHA (slide it): this Pauli-twirl ignores leakage, non-Markovian effects,
    and correlated cosmic-ray bursts (tracked separately as p_correlated).
    """
    t_us = t_ns / 1000.0
    p_relax = 1.0 - math.exp(-t_us / T1_us)
    px = py = p_relax / 4.0
    inv_tphi = max(1e-9, 1.0 / T2_us - 1.0 / (2.0 * T1_us))
    tphi = 1.0 / inv_tphi
    p_deph = 0.5 * (1.0 - math.exp(-t_us / tphi))
    pz = max(0.0, p_deph - p_relax / 4.0)
    return px, py, pz


def round_pauli_channel(m: NoiseProfile, round_time_ns: float = ROUND_TIME_NS) -> tuple[float, float, float]:
    """Effective per-qubit per-round biased Pauli channel: gate error + idle.

    Combines the material's single-qubit gate Pauli rates with idle decoherence
    accumulated over one syndrome-extraction round.
    """
    ix, iy, iz = idle_pauli_from_T(m.T1_us, m.T2_us, round_time_ns)
    return m.p_X + ix, m.p_Y + iy, m.p_Z + iz


if __name__ == "__main__":
    hdr = f"{'MATERIAL':<22}{'T1us':>7}{'T2us':>7}{'p_X':>10}{'p_Z':>10}{'bias_eta':>10}{'round p_tot':>13}"
    print(hdr)
    print("-" * len(hdr))
    for m in MATERIALS:
        rx, ry, rz = round_pauli_channel(m)
        print(
            f"{m.short:<22}{m.T1_us:>7.0f}{m.T2_us:>7.0f}{m.p_X:>10.2e}{m.p_Z:>10.2e}"
            f"{m.bias_eta:>10.1f}{rx + ry + rz:>13.2e}"
        )

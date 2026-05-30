"""Stage 3 — The crossover (cost model).

We use crossover framing (C) as the primary story: same algorithm, different
material -> different code distance needed for a target logical error rate ->
different physical-qubit count and wall-clock time. Plot (A), the classical-
simulation-vs-QPU cost crossover, is included as a secondary toy.

Modeling:
  * CSS suppression is CALIBRATED from the real Stim+PyMatching distance sweep
    (Stage 2a): we fit ln(LER) = ln A - alpha * d per material.
  * The XZZX bias-tailoring advantage is a MODEL layer calibrated on top of the
    CSS fit, following Bonilla Ataides et al., "The XZZX surface code",
    Nat. Commun. 12, 2172 (2021): under Z-biased noise the effective error
    suppression per unit distance improves with the bias eta. We scale alpha by
    a bias gain. (Full XZZX *circuit* simulation is future work — slide it.)

  Resource-estimation thresholds (logical qubits + target logical error):
    * Shor / RSA-2048   — Gidney & Ekera, Quantum 5, 433 (2021).
    * FeMoco (QPE)      — Reiher et al. PNAS 2017; von Burg et al. 2021.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np

from .noise_profiles import NoiseProfile
from .surface_sim import MemoryResult


@dataclass
class CodeFit:
    """Calibrated CSS error model for one material: LER(d) = A*exp(-alpha*d)."""
    material: str
    bias_eta: float
    A: float
    alpha: float  # CSS suppression exponent (per unit distance)

    def ler_css(self, d: float) -> float:
        return self.A * math.exp(-self.alpha * d)

    def alpha_xzzx(self) -> float:
        # Bias gain (Bonilla Ataides 2021): steeper suppression under bias.
        gain = 1.0 + 0.45 * math.log10(max(1.0, self.bias_eta))
        return self.alpha * min(gain, 3.0)

    def ler_xzzx(self, d: float) -> float:
        return self.A * math.exp(-self.alpha_xzzx() * d)

    def required_distance(self, target_ler: float, code: str = "css") -> int:
        alpha = self.alpha if code == "css" else self.alpha_xzzx()
        if alpha <= 0:
            return 99
        d = (math.log(self.A) - math.log(target_ler)) / alpha
        d = max(3, math.ceil(d))
        if d % 2 == 0:
            d += 1
        return min(d, 99)


@dataclass
class Algorithm:
    name: str
    short: str
    target_ler: float
    n_logical: int
    citation: str


# Fault-tolerant algorithm thresholds (target logical error + logical qubits).
ALGORITHMS = [
    Algorithm("Shor · RSA-2048", "RSA-2048", 1e-12, 4098,
              "Gidney & Ekera, Quantum 5, 433 (2021)"),
    Algorithm("FeMoco simulation (QPE)", "FeMoco", 1e-10, 2000,
              "Reiher et al. PNAS 2017; von Burg et al. 2021"),
]


def physical_per_logical(distance: int) -> int:
    """Rotated surface-code patch: d^2 data + (d^2 - 1) ancilla qubits."""
    return 2 * distance * distance - 1


def calibrate(materials: list[NoiseProfile], sweep: list[MemoryResult]) -> dict[str, CodeFit]:
    """Fit LER(d) = A*exp(-alpha*d) per material from the Stim sweep."""
    by_material: dict[str, list[MemoryResult]] = {}
    for r in sweep:
        by_material.setdefault(r.material, []).append(r)

    eta = {m.short: m.bias_eta for m in materials}
    fits: dict[str, CodeFit] = {}
    for short, results in by_material.items():
        results = sorted(results, key=lambda r: r.distance)
        ds = np.array([r.distance for r in results], dtype=float)
        lers = np.array([max(r.logical_error_per_round, 1e-12) for r in results])
        # Linear fit in log space: ln(LER) = ln A - alpha * d
        slope, intercept = np.polyfit(ds, np.log(lers), 1)
        fits[short] = CodeFit(
            material=short,
            bias_eta=eta.get(short, 1.0),
            A=float(math.exp(intercept)),
            alpha=float(-slope),
        )
    return fits


# ---- Crossover (A): classical statevector sim vs fault-tolerant QPU cost ----

def classical_cost_seconds(n_qubits: int, ns_per_amplitude: float = 1e-9) -> float:
    """Statevector simulation: ~2^n amplitudes, a few flops each."""
    return ns_per_amplitude * (2.0 ** n_qubits)


def quantum_cost_qubit_seconds(
    n_logical: int, distance: int, t_logical_ns: float
) -> float:
    """Fault-tolerant QPU cost in physical-qubit-seconds."""
    phys = physical_per_logical(distance) * n_logical
    return phys * (t_logical_ns * 1e-9)


def crossover_qubit_count(
    fit: CodeFit,
    target_ler: float = 1e-9,
    classical_plateau: int = 50,
) -> int:
    """Toy crossover: classical statevector sim plateaus ~50 qubits; beyond
    that a fault-tolerant QPU is the only option. Returns that plateau (the
    crossover point is dominated by classical memory scaling, not material)."""
    return classical_plateau

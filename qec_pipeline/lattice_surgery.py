"""Stage 2b — Lattice surgery (logical CNOT via merge & split) + idle-time cost.

A logical CNOT between two surface-code patches is done by *merging* the two
patches with an intermediate ancilla patch (measure the joint ZZ / XX operator
for ~d rounds) and then *splitting* them back (~d rounds). So a logical CNOT
costs ~2d syndrome rounds across ~3 patches.

GOTCHA (slide it): lattice surgery is slower than a transversal gate. The
*total time* of the logical operation matters for the crossover — a longer
logical gate means more idle decoherence accumulates, so we must MULTIPLY the
per-round logical error by the number of rounds AND the number of active
patches. We do exactly that here.
"""

from __future__ import annotations

from dataclasses import dataclass

from .noise_profiles import ROUND_TIME_NS


# A merge+split CNOT touches: control patch, target patch, intermediate ancilla.
SURGERY_PATCHES = 3


def surgery_rounds(distance: int) -> int:
    """Syndrome rounds for a merge+split logical CNOT (~d merge + ~d split)."""
    return 2 * distance


def surgery_time_ns(distance: int, round_time_ns: float = ROUND_TIME_NS) -> float:
    return surgery_rounds(distance) * round_time_ns


@dataclass
class SurgeryCost:
    distance: int
    rounds: int
    time_ns: float
    per_round_ler: float
    cnot_logical_error: float


def cnot_logical_error(per_round_ler: float, distance: int, patches: int = SURGERY_PATCHES) -> float:
    """Accumulated logical error of a merge+split CNOT.

    Multiply the per-round logical error by the rounds and active patches:
        P_fail = 1 - (1 - per_round_ler) ** (rounds * patches)
    """
    rounds = surgery_rounds(distance)
    survival = (1.0 - per_round_ler) ** (rounds * patches)
    return 1.0 - survival


def surgery_cost(per_round_ler: float, distance: int, round_time_ns: float = ROUND_TIME_NS) -> SurgeryCost:
    return SurgeryCost(
        distance=distance,
        rounds=surgery_rounds(distance),
        time_ns=surgery_time_ns(distance, round_time_ns),
        per_round_ler=per_round_ler,
        cnot_logical_error=cnot_logical_error(per_round_ler, distance),
    )


if __name__ == "__main__":
    from .noise_profiles import MATERIALS
    from .surface_sim import simulate_memory

    print(f"{'MATERIAL':<16}{'d':>3}{'rounds':>8}{'time_us':>10}{'CNOT_err':>12}")
    print("-" * 49)
    for m in MATERIALS[:3]:
        for d in (3, 5, 7):
            res = simulate_memory(m, d, shots=20_000, seed=1)
            c = surgery_cost(res.logical_error_per_round, d)
            print(f"{m.short:<16}{d:>3}{c.rounds:>8}{c.time_ns / 1000:>10.1f}{c.cnot_logical_error:>12.3e}")

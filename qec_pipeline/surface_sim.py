"""Stage 2 — Lattice-surgery / surface-code simulation with Stim + PyMatching.

Stage 2a (this module's core): per-material rotated surface-code *memory*
experiment. We sweep code distance d, inject the material's effective noise,
sample syndromes with Stim, decode with PyMatching (MWPM), and report the
logical error rate per round.

Stage 2b: a biased-noise comparison (CSS vs an XZZX-equivalent bias-tailoring)
and a lattice-surgery CNOT (merge/split) experiment with explicit idle-time
accounting, in `lattice_surgery.py`.

GOTCHAS (put on a slide):
  * Stim noise channels are Pauli channels. Leakage, non-Markovian effects and
    correlated cosmic-ray bursts (p_leakage, p_correlated) do NOT fit cleanly;
    we track them in the profile but do not inject them here (Pauli-twirl
    approximation). Leakage would need Stim's leakage extensions / custom
    circuit-level injection.
  * The standard rotated-code generator uses an *isotropic* depolarizing data
    channel, so it cannot express noise bias. Stage 2a therefore collapses each
    material to an effective depolarizing rate; the *bias* payoff is shown
    separately in Stage 2b where it actually matters.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import stim
import pymatching

from .noise_profiles import NoiseProfile, round_pauli_channel, ROUND_TIME_NS


@dataclass
class MemoryResult:
    material: str
    distance: int
    rounds: int
    shots: int
    logical_errors: int
    logical_error_per_shot: float
    logical_error_per_round: float
    physical_error: float  # effective per-round single-qubit error injected


def effective_depolarizing(m: NoiseProfile, round_time_ns: float = ROUND_TIME_NS) -> float:
    """Collapse a material's biased per-round Pauli channel to a single
    depolarizing-equivalent total error probability (gate + idle)."""
    px, py, pz = round_pauli_channel(m, round_time_ns)
    return px + py + pz


def build_memory_circuit(
    m: NoiseProfile,
    distance: int,
    rounds: int | None = None,
    basis: str = "z",
    round_time_ns: float = ROUND_TIME_NS,
) -> stim.Circuit:
    """Rotated surface-code memory circuit for a material at a given distance."""
    if rounds is None:
        rounds = distance
    p_data = effective_depolarizing(m, round_time_ns)
    return stim.Circuit.generated(
        f"surface_code:rotated_memory_{basis}",
        distance=distance,
        rounds=rounds,
        after_clifford_depolarization=m.p_gate_2q,
        before_round_data_depolarization=p_data,
        before_measure_flip_probability=m.readout_error,
        after_reset_flip_probability=m.readout_error,
    )


def simulate_memory(
    m: NoiseProfile,
    distance: int,
    rounds: int | None = None,
    shots: int = 50_000,
    basis: str = "z",
    seed: int | None = None,
) -> MemoryResult:
    """Sample + decode a memory experiment; return logical error rate."""
    if rounds is None:
        rounds = distance
    circuit = build_memory_circuit(m, distance, rounds, basis)
    dem = circuit.detector_error_model(decompose_errors=True)
    matcher = pymatching.Matching.from_detector_error_model(dem)

    sampler = circuit.compile_detector_sampler(seed=seed)
    det, obs = sampler.sample(shots, separate_observables=True)
    pred = matcher.decode_batch(det)
    errors = int(np.sum(pred[:, 0] != obs[:, 0]))

    per_shot = errors / shots
    # Convert whole-experiment error into a per-round rate.
    if 0 < per_shot < 0.5:
        per_round = 0.5 * (1.0 - (1.0 - 2.0 * per_shot) ** (1.0 / rounds))
    else:
        per_round = per_shot / rounds
    return MemoryResult(
        material=m.short,
        distance=distance,
        rounds=rounds,
        shots=shots,
        logical_errors=errors,
        logical_error_per_shot=per_shot,
        logical_error_per_round=per_round,
        physical_error=effective_depolarizing(m),
    )


def distance_sweep(
    materials: list[NoiseProfile],
    distances: tuple[int, ...] = (3, 5, 7),
    shots: int = 50_000,
    basis: str = "z",
    seed: int | None = 1,
) -> list[MemoryResult]:
    out: list[MemoryResult] = []
    for m in materials:
        for d in distances:
            out.append(simulate_memory(m, d, shots=shots, basis=basis, seed=seed))
    return out


if __name__ == "__main__":
    from .noise_profiles import MATERIALS

    print(f"{'MATERIAL':<16}{'d':>3}{'p_phys':>10}{'LER/round':>13}{'errors':>9}")
    print("-" * 51)
    for res in distance_sweep(MATERIALS, distances=(3, 5, 7), shots=20_000):
        print(
            f"{res.material:<16}{res.distance:>3}{res.physical_error:>10.2e}"
            f"{res.logical_error_per_round:>13.3e}{res.logical_errors:>9}"
        )

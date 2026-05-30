"""Quantum vs classical gain — for QUANTUM ERROR CORRECTION.

The QEC analog of the optimization-advantage story:

  * The task: keep a logical qubit alive (surface-code memory) for d rounds.
  * Quality: logical error rate per round + the suppression factor Lambda
    (the QEC analog of "approximation ratio").
  * Quantum (live): the real Stim + PyMatching surface-code simulation from
    surface_sim.py gives the logical error rate AND a measured wall-clock for the
    *stabilizer* simulation (cheap - the honesty caveat: ideal Clifford QEC is
    classically simulable, Gottesman-Knill).
  * Classical (exact): fully simulating the NOISY device state needs ~2^n
    amplitudes for n = 2d^2 - 1 physical qubits - exponential, infeasible past
    ~50 qubits.
  * Quantum (projected QPU): d rounds x cycle time (~us) - near-flat in n.
  * Quantum (evidence): a small repetition-code memory run on real IBM hardware
    (--hardware), measuring wall-clock and the logical vs physical error.

Metric: time-to-solution / wall-clock, with logical-error suppression as the
quality axis.

Usage:
    conda activate qai
    python -m qec_pipeline.qec_advantage             # sim + classical sweep
    python -m qec_pipeline.qec_advantage --hardware   # also run 1 IBM rep-code job
"""

from __future__ import annotations

import argparse
import json
import os
import time
from dataclasses import asdict, dataclass

import numpy as np

from .noise_profiles import MATERIALS, ROUND_TIME_NS
from .surface_sim import simulate_memory

OUT = os.path.join(os.path.dirname(__file__), "outputs")
FRONTEND_TS = os.path.join(
    os.path.dirname(__file__), "..", "src", "lib", "qa", "advantage-data.ts"
)
HW_CACHE = os.path.join(OUT, "ibm_qec_run.json")

CYCLE_TIME_S = 1e-6          # ~1 us QEC cycle
AMP_TIME_S = 1e-9            # classical seconds per statevector amplitude-op
SHOTS = 40_000


@dataclass
class QECRecord:
    d: int
    physical_qubits: int
    rounds: int
    logical_error_per_round: float
    lambda_suppression: float
    classical_exact_time_s: float
    classical_stim_time_s: float
    qpu_projected_time_s: float


def physical_per_logical(d: int) -> int:
    return 2 * d * d - 1


def classical_exact_time_s(n: int) -> float:
    """Exact statevector simulation of the noisy QEC circuit: ~2^n amplitudes."""
    return AMP_TIME_S * float(2 ** n)


def qpu_projected_time_s(d: int) -> float:
    """A QPU runs d syndrome rounds natively: d x cycle time."""
    return d * CYCLE_TIME_S


def run_sweep(distances, shots, material_index=0):
    m = MATERIALS[material_index]
    records: list[QECRecord] = []
    prev_ler = None
    for d in distances:
        t0 = time.perf_counter()
        res = simulate_memory(m, d, shots=shots, seed=1)
        stim_time = time.perf_counter() - t0
        n = physical_per_logical(d)
        ler = res.logical_error_per_round
        lam = (prev_ler / ler) if (prev_ler and ler > 0) else 1.0
        prev_ler = ler
        records.append(
            QECRecord(
                d=d,
                physical_qubits=n,
                rounds=d,
                logical_error_per_round=ler,
                lambda_suppression=round(lam, 3),
                classical_exact_time_s=classical_exact_time_s(n),
                classical_stim_time_s=round(stim_time, 6),
                qpu_projected_time_s=qpu_projected_time_s(d),
            )
        )
        print(f"  d={d:<3} n={n:<5} LER/round={ler:.3e} Λ={lam:.2f} "
              f"stim={stim_time:.3f}s exact~{classical_exact_time_s(n):.1e}s")
    return records, m


# ----------------------------------------------------- IBM repetition code

def run_ibm_repetition(distance: int = 3, rounds: int = 2, shots: int = 4096) -> dict | None:
    """Run a bit-flip repetition-code memory on real IBM hardware (majority vote)."""
    try:
        from qiskit import QuantumCircuit, transpile
        from qiskit_ibm_runtime import QiskitRuntimeService, SamplerV2
    except Exception as e:  # noqa: BLE001
        print(f"  IBM runtime unavailable: {e}")
        return None

    n_data = distance  # 3 data qubits for d=3
    qc = QuantumCircuit(n_data, n_data)
    # logical |0> = all data |0>; let them idle 'rounds' barriers to accrue error
    for _ in range(rounds):
        qc.barrier()
        for q in range(n_data):
            qc.id(q)
    qc.measure(range(n_data), range(n_data))

    try:
        service = QiskitRuntimeService()
        backend = service.least_busy(operational=True, simulator=False)
        isa = transpile(qc, backend, optimization_level=1)
        sampler = SamplerV2(mode=backend)
        t0 = time.perf_counter()
        job = sampler.run([isa], shots=shots)
        print(f"  submitted rep-code job {job.job_id()} to {backend.name} ...")
        result = job.result()
        wall = time.perf_counter() - t0
        counts = result[0].data.c.get_counts()

        logical_fail = 0
        phys_fail = 0
        total = 0
        for bitstr, cnt in counts.items():
            bits = [int(b) for b in bitstr.replace(" ", "")]
            total += cnt
            # majority vote -> logical bit
            logical = 1 if sum(bits) > len(bits) / 2 else 0
            if logical != 0:
                logical_fail += cnt
            phys_fail += sum(bits) * cnt  # per-qubit flips
        logical_err = logical_fail / total
        phys_err = phys_fail / (total * n_data)
        record = {
            "backend": backend.name,
            "code": f"Repetition d={distance}",
            "distance": distance,
            "rounds": rounds,
            "shots": shots,
            "wallclock_s": round(wall, 2),
            "logical_error_per_round": round(logical_err / max(rounds, 1), 5),
            "physical_error_per_round": round(phys_err / max(rounds, 1), 5),
            "job_id": job.job_id(),
        }
        os.makedirs(OUT, exist_ok=True)
        with open(HW_CACHE, "w") as f:
            json.dump(record, f, indent=2)
        print(f"  cached real-hardware QEC run to {HW_CACHE}")
        return record
    except Exception as e:  # noqa: BLE001
        print(f"  IBM hardware run failed: {e}")
        return None


def load_cached_hardware() -> dict | None:
    if os.path.exists(HW_CACHE):
        with open(HW_CACHE) as f:
            return json.load(f)
    return None


# ----------------------------------------------------- export + figure

def export_frontend_ts(records: list[QECRecord], hardware: dict | None, gain: dict, material: str):
    rows = ",\n".join(
        "  { "
        + ", ".join(
            f"{k}: {v if not isinstance(v, float) else repr(round(v, 12))}"
            for k, v in asdict(r).items()
        )
        + " }"
        for r in records
    )
    hw_ts = "null" if hardware is None else json.dumps(hardware)
    ts = f"""// AUTO-GENERATED by qec_pipeline/qec_advantage.py. Do not edit by hand.
// Quantum vs classical for QUANTUM ERROR CORRECTION (surface-code memory).

export interface AdvantageQECRecord {{
  d: number; physical_qubits: number; rounds: number;
  logical_error_per_round: number; lambda_suppression: number;
  classical_exact_time_s: number; classical_stim_time_s: number; qpu_projected_time_s: number;
}}
export interface HardwareRun {{
  backend: string; code: string; distance: number; rounds: number; shots: number;
  wallclock_s: number; logical_error_per_round: number; physical_error_per_round: number; job_id: string;
}}

export const ADVANTAGE_RECORDS: AdvantageQECRecord[] = [
{rows}
];

export const ADVANTAGE_HARDWARE: HardwareRun | null = {hw_ts};

export const ADVANTAGE_GAIN = {json.dumps(gain)};

export const ADVANTAGE_META = {{
  task: "Surface-code memory",
  material: "{material}",
  shots: {SHOTS},
  cycleTimeUs: {CYCLE_TIME_S * 1e6},
  generatedAt: "{time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}",
}};
"""
    os.makedirs(os.path.dirname(FRONTEND_TS), exist_ok=True)
    with open(FRONTEND_TS, "w") as f:
        f.write(ts)
    print(f"  wrote {FRONTEND_TS}")


def figure(records: list[QECRecord], hardware: dict | None, path: str):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    ns = [r.physical_qubits for r in records]
    fig, (ax, ax2) = plt.subplots(1, 2, figsize=(12, 5))

    ax.semilogy(ns, [r.classical_exact_time_s for r in records], "o-", color="#d62728", label="Classical exact sim (~2ⁿ)")
    ax.semilogy(ns, [r.classical_stim_time_s for r in records], "s-", color="#ff7f0e", label="Classical Stim (stabilizer)")
    ax.semilogy(ns, [r.qpu_projected_time_s for r in records], "D-", color="#1f77b4", label="Quantum (projected QPU)")
    if hardware:
        ax.scatter([physical_per_logical(hardware["distance"])], [hardware["wallclock_s"]],
                   color="#2ca02c", s=90, zorder=5, label=f"Real IBM ({hardware['backend']})")
    ax.set_title("QEC time-to-solution: classical vs QPU", fontweight="bold")
    ax.set_xlabel("Physical qubits  n = 2d²−1")
    ax.set_ylabel("Time to solution (s, log)")
    ax.grid(True, which="both", alpha=0.25)
    ax.legend(fontsize=8)

    ax2.semilogy([r.d for r in records], [r.logical_error_per_round for r in records], "^-", color="#9467bd")
    ax2.set_title("Logical error suppression (the QEC win)", fontweight="bold")
    ax2.set_xlabel("Code distance d")
    ax2.set_ylabel("Logical error / round (log)")
    ax2.set_xticks([r.d for r in records])
    ax2.grid(True, which="both", alpha=0.25)

    fig.tight_layout()
    fig.savefig(path, dpi=140)
    plt.close(fig)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--hardware", action="store_true", help="run one real IBM repetition-code job")
    ap.add_argument("--distances", type=int, nargs="+", default=[3, 5, 7, 9])
    ap.add_argument("--shots", type=int, default=SHOTS)
    args = ap.parse_args()
    os.makedirs(OUT, exist_ok=True)

    print("== QEC surface-code memory sweep (Stim + PyMatching) ==")
    records, material = run_sweep(args.distances, args.shots)

    hardware = run_ibm_repetition() if args.hardware else load_cached_hardware()

    big = records[-1]
    mean_lambda = float(np.mean([r.lambda_suppression for r in records if r.lambda_suppression > 0]))
    gain = {
        "atDistance": big.d,
        "atQubits": big.physical_qubits,
        "classicalTimeS": big.classical_exact_time_s,
        "qpuTimeS": big.qpu_projected_time_s,
        "speedup": big.classical_exact_time_s / max(big.qpu_projected_time_s, 1e-12),
        "finalLogicalError": big.logical_error_per_round,
        "meanLambda": round(mean_lambda, 2),
    }

    figure(records, hardware, os.path.join(OUT, "qec_advantage.png"))
    with open(os.path.join(OUT, "qec_advantage.json"), "w") as f:
        json.dump({"records": [asdict(r) for r in records], "hardware": hardware, "gain": gain}, f, indent=2)
    export_frontend_ts(records, hardware, gain, material.short)

    print(f"\n  gain @ n={gain['atQubits']}: classical exact ~{gain['classicalTimeS']:.1e}s vs "
          f"projected QPU {gain['qpuTimeS']:.1e}s; mean Λ {gain['meanLambda']}; "
          f"final LER/round {gain['finalLogicalError']:.2e}")
    print("  wrote outputs/ (figure + json) and advantage-data.ts")


if __name__ == "__main__":
    main()

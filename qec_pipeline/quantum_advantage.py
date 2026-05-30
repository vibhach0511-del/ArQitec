"""Quantum vs classical gain — QAOA MaxCut time-to-solution.

Compares running a QAOA MaxCut optimization workload on:
  * Quantum (live): IBM/Qiskit Aer simulator (validates solution quality + gives
    a wall-clock; on a simulator this still scales exponentially - that's the
    honesty caveat).
  * Quantum (projected QPU): shots x circuit time, ~flat in problem size for
    fixed p - the real source of advantage once on hardware.
  * Quantum (evidence): one cached run on real IBM hardware (--hardware), so the
    demo shows a genuine "ran on a QPU" data point and works offline afterwards.
  * Classical: exact brute force (exponential) + a timed heuristic baseline.

Metric: time-to-solution / wall-clock (approximation ratio as quality context).

HONESTY: at these NISQ sizes a laptop still wins on raw runtime. The gain is the
*scaling* (classical exponential vs projected-QPU near-flat) plus the credible
real-hardware run. Where quantum provably wins is the fault-tolerant regime -
see Stage 3 of this pipeline (crossover.py).

Usage:
    conda activate qai
    python -m qec_pipeline.quantum_advantage            # sim + classical sweep
    python -m qec_pipeline.quantum_advantage --hardware  # also submit 1 IBM job
"""

from __future__ import annotations

import argparse
import json
import math
import os
import random
import time
from dataclasses import asdict, dataclass

import numpy as np

OUT = os.path.join(os.path.dirname(__file__), "outputs")
FRONTEND_TS = os.path.join(
    os.path.dirname(__file__), "..", "src", "lib", "qa", "advantage-data.ts"
)
HW_CACHE = os.path.join(OUT, "ibm_hardware_run.json")

# Projected-QPU model constants.
GATE_TIME_US = 0.1   # per 2Q gate
READOUT_US = 1.0     # per shot measurement settle
SHOTS = 1024


@dataclass
class SizeRecord:
    n: int
    edges: int
    optimum: int
    brute_force_time_s: float
    heuristic_time_s: float
    quantum_sim_time_s: float
    qpu_projected_time_s: float
    approx_ratio: float


# ----------------------------------------------------------------- graphs

def random_graph(n: int, seed: int = 7) -> list[tuple[int, int]]:
    """Sparse connected-ish random graph, avg degree ~3."""
    rng = random.Random(seed + n)
    edges: set[tuple[int, int]] = set()
    # ring backbone keeps it connected
    for i in range(n):
        edges.add((i, (i + 1) % n))
    extra = int(n * 0.8)
    while len(edges) < n + extra:
        a, b = rng.randrange(n), rng.randrange(n)
        if a != b:
            edges.add((min(a, b), max(a, b)))
    return sorted(edges)


def cut_value(bits: int, edges: list[tuple[int, int]]) -> int:
    return sum(1 for a, b in edges if ((bits >> a) & 1) != ((bits >> b) & 1))


def brute_force_maxcut(n: int, edges: list[tuple[int, int]]) -> tuple[int, float]:
    t0 = time.perf_counter()
    best = max(cut_value(x, edges) for x in range(1 << n))
    return best, time.perf_counter() - t0


def heuristic_maxcut(n: int, edges: list[tuple[int, int]], restarts: int = 40) -> tuple[int, float]:
    """Simulated-annealing-ish local search baseline."""
    t0 = time.perf_counter()
    rng = random.Random(1234 + n)
    best = 0
    for _ in range(restarts):
        x = rng.randrange(1 << n)
        cur = cut_value(x, edges)
        improved = True
        while improved:
            improved = False
            for q in range(n):
                cand = x ^ (1 << q)
                cv = cut_value(cand, edges)
                if cv > cur:
                    x, cur, improved = cand, cv, True
        best = max(best, cur)
    return best, time.perf_counter() - t0


# ----------------------------------------------------------------- QAOA (Aer)

def qaoa_maxcut_sim(n: int, edges: list[tuple[int, int]], shots: int = SHOTS, maxiter: int = 25):
    """Optimize a p=1 QAOA for MaxCut on the Aer simulator.

    Returns (best_cut, wallclock_s, num_2q_gates, depth).
    """
    from qiskit import QuantumCircuit, transpile
    from qiskit_aer import AerSimulator
    from scipy.optimize import minimize

    sim = AerSimulator()

    def build(gamma: float, beta: float) -> QuantumCircuit:
        qc = QuantumCircuit(n, n)
        qc.h(range(n))
        for a, b in edges:               # cost unitary
            qc.cx(a, b)
            qc.rz(2 * gamma, b)
            qc.cx(a, b)
        for q in range(n):               # mixer
            qc.rx(2 * beta, q)
        qc.measure(range(n), range(n))
        return qc

    def counts_for(params):
        qc = transpile(build(params[0], params[1]), sim)
        res = sim.run(qc, shots=shots).result().get_counts()
        return res

    def neg_expected_cut(params):
        total = 0.0
        c = counts_for(params)
        for bitstr, cnt in c.items():
            bits = int(bitstr.replace(" ", ""), 2)
            total += cut_value(bits, edges) * cnt
        return -total / shots

    t0 = time.perf_counter()
    res = minimize(neg_expected_cut, x0=[0.8, 0.6], method="COBYLA",
                   options={"maxiter": maxiter})
    # final sample -> best observed cut
    final = counts_for(res.x)
    best_cut = max(cut_value(int(b.replace(" ", ""), 2), edges) for b in final)
    wall = time.perf_counter() - t0

    probe = transpile(build(res.x[0], res.x[1]), sim)
    num_2q = sum(1 for inst in probe.data if inst.operation.num_qubits == 2)
    return best_cut, wall, num_2q, probe.depth()


def qpu_projected_time_s(num_2q: int, shots: int = SHOTS) -> float:
    # shots x (2Q-gate time + readout); near-flat in n for fixed p / sparse graph.
    return shots * (num_2q * GATE_TIME_US + READOUT_US) * 1e-6


# ----------------------------------------------------------------- IBM HW

def run_ibm_hardware(n: int = 8, shots: int = SHOTS) -> dict | None:
    """Submit ONE QAOA instance to a real IBM backend; cache the result."""
    try:
        from qiskit import QuantumCircuit, transpile
        from qiskit_ibm_runtime import QiskitRuntimeService, SamplerV2
    except Exception as e:  # noqa: BLE001
        print(f"  IBM runtime unavailable: {e}")
        return None

    edges = random_graph(n)
    gamma, beta = 0.8, 0.6
    qc = QuantumCircuit(n, n)
    qc.h(range(n))
    for a, b in edges:
        qc.cx(a, b); qc.rz(2 * gamma, b); qc.cx(a, b)
    for q in range(n):
        qc.rx(2 * beta, q)
    qc.measure(range(n), range(n))

    try:
        service = QiskitRuntimeService()
        backend = service.least_busy(operational=True, simulator=False)
        isa = transpile(qc, backend, optimization_level=3)
        sampler = SamplerV2(mode=backend)
        submit = time.perf_counter()
        job = sampler.run([isa], shots=shots)
        print(f"  submitted job {job.job_id()} to {backend.name} ...")
        result = job.result()
        wall = time.perf_counter() - submit
        counts = result[0].data.c.get_counts()
        best_cut = max(cut_value(int(b, 2), edges) for b in counts)
        opt, _ = brute_force_maxcut(n, edges)
        record = {
            "backend": backend.name,
            "n": n,
            "shots": shots,
            "wallclock_s": round(wall, 2),
            "two_qubit_gates": int(sum(1 for i in isa.data if i.operation.num_qubits == 2)),
            "depth": int(isa.depth()),
            "best_cut": int(best_cut),
            "optimum": int(opt),
            "approx_ratio": round(best_cut / opt, 3),
            "job_id": job.job_id(),
        }
        os.makedirs(OUT, exist_ok=True)
        with open(HW_CACHE, "w") as f:
            json.dump(record, f, indent=2)
        print(f"  cached real-hardware run to {HW_CACHE}")
        return record
    except Exception as e:  # noqa: BLE001
        print(f"  IBM hardware run failed: {e}")
        return None


def load_cached_hardware() -> dict | None:
    if os.path.exists(HW_CACHE):
        with open(HW_CACHE) as f:
            return json.load(f)
    return None


# ----------------------------------------------------------------- export

def export_frontend_ts(records: list[SizeRecord], hardware: dict | None, gain: dict):
    rows = ",\n".join(
        "  { "
        + ", ".join(
            f"{k}: {round(v, 6) if isinstance(v, float) else v}"
            for k, v in asdict(r).items()
        )
        + " }"
        for r in records
    )
    hw_ts = "null" if hardware is None else json.dumps(hardware)
    ts = f"""// AUTO-GENERATED by qec_pipeline/quantum_advantage.py. Do not edit by hand.
// Quantum vs classical QAOA MaxCut time-to-solution benchmark.

export interface AdvantageSizeRecord {{
  n: number; edges: number; optimum: number;
  brute_force_time_s: number; heuristic_time_s: number;
  quantum_sim_time_s: number; qpu_projected_time_s: number; approx_ratio: number;
}}
export interface HardwareRun {{
  backend: string; n: number; shots: number; wallclock_s: number;
  two_qubit_gates: number; depth: number; best_cut: number; optimum: number;
  approx_ratio: number; job_id: string;
}}

export const ADVANTAGE_RECORDS: AdvantageSizeRecord[] = [
{rows}
];

export const ADVANTAGE_HARDWARE: HardwareRun | null = {hw_ts};

export const ADVANTAGE_GAIN = {json.dumps(gain)};

export const ADVANTAGE_META = {{
  shots: {SHOTS},
  generatedAt: "{time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}",
}};
"""
    os.makedirs(os.path.dirname(FRONTEND_TS), exist_ok=True)
    with open(FRONTEND_TS, "w") as f:
        f.write(ts)
    print(f"  wrote {FRONTEND_TS}")


def figure(records: list[SizeRecord], hardware: dict | None, path: str):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    ns = [r.n for r in records]
    fig, ax = plt.subplots(figsize=(8, 5.2))
    ax.semilogy(ns, [r.brute_force_time_s for r in records], "o-", color="#d62728", label="Classical brute force (exact)")
    ax.semilogy(ns, [r.heuristic_time_s for r in records], "s-", color="#ff7f0e", label="Classical heuristic")
    ax.semilogy(ns, [r.quantum_sim_time_s for r in records], "^-", color="#9467bd", label="Quantum (Aer simulator)")
    ax.semilogy(ns, [r.qpu_projected_time_s for r in records], "D-", color="#1f77b4", label="Quantum (projected QPU)")
    if hardware:
        ax.scatter([hardware["n"]], [hardware["wallclock_s"]], color="#2ca02c", s=90, zorder=5,
                   label=f"Real IBM hardware ({hardware['backend']})")
    ax.set_title("Quantum vs Classical — QAOA MaxCut time-to-solution", fontsize=12, fontweight="bold")
    ax.set_xlabel("Problem size n (qubits)")
    ax.set_ylabel("Time to solution (s, log)")
    ax.grid(True, which="both", alpha=0.25)
    ax.legend(fontsize=8)
    fig.tight_layout()
    fig.savefig(path, dpi=140)
    plt.close(fig)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--hardware", action="store_true", help="submit one real IBM job")
    ap.add_argument("--sizes", type=int, nargs="+", default=[6, 8, 10, 12, 14, 16])
    args = ap.parse_args()
    os.makedirs(OUT, exist_ok=True)

    records: list[SizeRecord] = []
    print("== QAOA MaxCut sweep (Aer sim vs classical) ==")
    for n in args.sizes:
        edges = random_graph(n)
        opt, bf_t = brute_force_maxcut(n, edges)
        _, heur_t = heuristic_maxcut(n, edges)
        best_cut, q_t, num_2q, _ = qaoa_maxcut_sim(n, edges)
        rec = SizeRecord(
            n=n, edges=len(edges), optimum=opt,
            brute_force_time_s=round(bf_t, 6),
            heuristic_time_s=round(heur_t, 6),
            quantum_sim_time_s=round(q_t, 6),
            qpu_projected_time_s=round(qpu_projected_time_s(num_2q), 6),
            approx_ratio=round(best_cut / opt, 3),
        )
        records.append(rec)
        print(f"  n={n:<3} opt={opt:<3} approx={rec.approx_ratio:<5} "
              f"bf={bf_t:.4f}s qpu_proj={rec.qpu_projected_time_s:.5f}s")

    hardware = run_ibm_hardware() if args.hardware else load_cached_hardware()

    big = records[-1]
    gain = {
        "atSize": big.n,
        "classicalTimeS": big.brute_force_time_s,
        "qpuProjectedTimeS": big.qpu_projected_time_s,
        "speedup": round(big.brute_force_time_s / max(big.qpu_projected_time_s, 1e-9), 1),
        "meanApproxRatio": round(float(np.mean([r.approx_ratio for r in records])), 3),
    }

    figure(records, hardware, os.path.join(OUT, "quantum_advantage.png"))
    with open(os.path.join(OUT, "quantum_advantage.json"), "w") as f:
        json.dump({"records": [asdict(r) for r in records], "hardware": hardware, "gain": gain}, f, indent=2)
    export_frontend_ts(records, hardware, gain)

    print(f"\n  gain @ n={gain['atSize']}: classical {gain['classicalTimeS']}s vs "
          f"projected QPU {gain['qpuProjectedTimeS']}s -> {gain['speedup']}x; "
          f"mean approx ratio {gain['meanApproxRatio']}")
    print(f"  wrote outputs/ (figure + json) and advantage-data.ts")


if __name__ == "__main__":
    main()

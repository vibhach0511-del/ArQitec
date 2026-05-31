"""IBM Quantum oracle benchmarks for combinatorial materials search (Qiskit Runtime)."""

from __future__ import annotations

import json
import math
import os
import time

ROOT = os.path.join(os.path.dirname(__file__), "..")
OUT = os.path.join(os.path.dirname(__file__), "outputs")
HW_CACHE = os.path.join(OUT, "ibm_materials_search_runs.json")

SHOTS = 256  # enough for oracle timing; full wall-clock includes queue separately
N_ORACLE_QUBITS = 4


def _execution_s_from_result(result) -> float | None:
    """Extract on-device execution seconds from SamplerV2 result metadata."""
    try:
        meta = getattr(result, "metadata", None) or {}
        spans = meta.get("execution", {}).get("execution_spans")
        if not spans:
            return None
        total = 0.0
        for span in spans:
            start = getattr(span, "start", None)
            stop = getattr(span, "stop", None)
            if start is None or stop is None:
                continue
            total += (stop - start).total_seconds()
        return round(total, 6) if total > 0 else None
    except Exception:  # noqa: BLE001
        return None


def read_ibm_token() -> str | None:
    if os.environ.get("IBM_QUANTUM_TOKEN"):
        return os.environ["IBM_QUANTUM_TOKEN"]
    env = os.path.join(ROOT, ".env")
    if os.path.exists(env):
        for line in open(env):
            if line.strip().startswith("IBM_QUANTUM_TOKEN="):
                val = line.split("=", 1)[1].strip()
                return val or None
    return None


def ensure_ibm_account(token: str | None) -> None:
    if not token:
        return
    try:
        from qiskit_ibm_runtime import QiskitRuntimeService

        QiskitRuntimeService.save_account(token=token, overwrite=True)
    except Exception as e:  # noqa: BLE001
        print(f"  IBM save_account skipped: {e}")


def _stack_phase(stack: dict) -> float:
    """Map stack fitness to a rotation angle (Grover oracle marker)."""
    rel = stack.get("relevance", 50) / 100.0
    p2q = stack.get("effective_p2q", 0.01)
    return math.pi * rel * (1.0 - min(p2q, 0.02) / 0.02)


def build_oracle_circuit(stack: dict):
    from qiskit import QuantumCircuit

    qc = QuantumCircuit(N_ORACLE_QUBITS, N_ORACLE_QUBITS)
    qc.h(range(N_ORACLE_QUBITS))
    theta = _stack_phase(stack)
    qc.rz(theta, 0)
    qc.cx(0, 1)
    qc.rz(theta * 0.5, 1)
    qc.cx(1, 2)
    qc.barrier()
    for q in range(N_ORACLE_QUBITS):
        qc.id(q)
    qc.measure(range(N_ORACLE_QUBITS), range(N_ORACLE_QUBITS))
    return qc


def run_oracle_job(stack: dict, *, use_hardware: bool) -> dict | None:
    try:
        from qiskit.transpiler import generate_preset_pass_manager
        from qiskit_ibm_runtime import QiskitRuntimeService, SamplerV2
    except ImportError as e:
        print(f"  qiskit-ibm-runtime unavailable: {e}")
        return None

    qc = build_oracle_circuit(stack)
    try:
        if use_hardware:
            service = QiskitRuntimeService()
            backend = service.least_busy(simulator=False, operational=True)
        else:
            from qiskit_ibm_runtime.fake_provider import FakeBelemV2

            backend = FakeBelemV2()
            service = None

        pm = generate_preset_pass_manager(backend=backend, optimization_level=1)
        isa = pm.run(qc)
        sampler = SamplerV2(mode=backend)
        t0 = time.perf_counter()
        job = sampler.run([isa], shots=SHOTS)
        job_id = job.job_id()
        print(f"  IBM job {job_id} ({stack['stack_id']}) on {backend.name} ...")
        result = job.result()
        wall = time.perf_counter() - t0
        execution_s = _execution_s_from_result(result)
        oracle_s = execution_s if execution_s is not None else wall
        return {
            "stack_id": stack["stack_id"],
            "backend": backend.name,
            "shots": SHOTS,
            "wallclock_s": round(wall, 3),
            "execution_s": round(oracle_s, 6),
            "job_id": job_id,
            "hardware": use_hardware,
            "oracle_qubits": N_ORACLE_QUBITS,
        }
    except Exception as e:  # noqa: BLE001
        print(f"  IBM oracle failed for {stack['stack_id']}: {e}")
        return None


def pick_sample_stacks(stacks: list[dict], n: int = 5) -> list[dict]:
    """Best, worst, median relevance, max/min bias_eta."""
    if len(stacks) <= n:
        return stacks
    by_rel = sorted(stacks, key=lambda s: s["relevance"])
    by_bias = sorted(stacks, key=lambda s: s["bias_eta"])
    picks: dict[str, dict] = {}
    picks[by_rel[-1]["stack_id"]] = by_rel[-1]
    picks[by_rel[0]["stack_id"]] = by_rel[0]
    picks[by_rel[len(by_rel) // 2]["stack_id"]] = by_rel[len(by_rel) // 2]
    picks[by_bias[-1]["stack_id"]] = by_bias[-1]
    picks[by_bias[0]["stack_id"]] = by_bias[0]
    return list(picks.values())[:n]


def run_sample_oracles(stacks: list[dict], *, use_hardware: bool) -> list[dict]:
    token = read_ibm_token()
    if use_hardware and token:
        ensure_ibm_account(token)

    samples = pick_sample_stacks(stacks)
    records: list[dict] = []
    for st in samples:
        rec = run_oracle_job(st, use_hardware=use_hardware)
        if rec:
            records.append(rec)
    if records:
        os.makedirs(OUT, exist_ok=True)
        with open(HW_CACHE, "w") as f:
            json.dump(records, f, indent=2)
        print(f"  cached {len(records)} IBM oracle runs -> {HW_CACHE}")
    return records


def load_cached() -> list[dict]:
    if os.path.exists(HW_CACHE):
        with open(HW_CACHE) as f:
            data = json.load(f)
        return data if isinstance(data, list) else [data]
    return []


def enrich_execution_times(records: list[dict]) -> list[dict]:
    """Backfill execution_s from IBM job metadata when only wallclock was stored."""
    if not records or all(r.get("execution_s") for r in records):
        return records
    try:
        from qiskit_ibm_runtime import QiskitRuntimeService
    except ImportError:
        return records
    token = read_ibm_token()
    if not token:
        return records
    try:
        QiskitRuntimeService.save_account(token=token, overwrite=True)
        service = QiskitRuntimeService()
    except Exception:  # noqa: BLE001
        return records

    out: list[dict] = []
    for rec in records:
        if rec.get("execution_s"):
            out.append(rec)
            continue
        job_id = rec.get("job_id")
        if not job_id:
            out.append(rec)
            continue
        try:
            job = service.job(job_id)
            result = job.result()
            execution_s = _execution_s_from_result(result)
            if execution_s is not None:
                rec = {**rec, "execution_s": execution_s}
        except Exception:  # noqa: BLE001
            pass
        out.append(rec)
    return out

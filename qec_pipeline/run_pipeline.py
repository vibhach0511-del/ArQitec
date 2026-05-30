"""End-to-end pipeline: Material -> Error Model -> Lattice Surgery -> Crossover.

Runs the real Stim+PyMatching distance sweep, calibrates the CSS error model,
layers the XZZX bias-tailoring model, computes lattice-surgery CNOT costs, and
produces the crossover figures + a JSON/CSV data dump in ./outputs.

Usage:
    conda activate qai
    python -m qec_pipeline.run_pipeline            # full run
    python -m qec_pipeline.run_pipeline --fast     # fewer shots, quick smoke
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import os
from dataclasses import asdict

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

from .noise_profiles import MATERIALS, ROUND_TIME_NS
from .surface_sim import distance_sweep
from .lattice_surgery import surgery_cost, surgery_rounds
from .crossover import (
    ALGORITHMS,
    calibrate,
    classical_cost_seconds,
    physical_per_logical,
    quantum_cost_qubit_seconds,
)

OUT = os.path.join(os.path.dirname(__file__), "outputs")

# Distinct colors per material (colorblind-friendly-ish).
COLORS = {
    "Ta/sapphire": "#1f77b4",
    "Nb/Si": "#2ca02c",
    "Al (legacy)": "#d62728",
    "Fluxonium": "#9467bd",
    "Ideal-biased": "#ff7f0e",
}
BIASED = {"Fluxonium", "Ideal-biased"}


def _style(ax, title, xlabel, ylabel):
    ax.set_title(title, fontsize=12, fontweight="bold")
    ax.set_xlabel(xlabel, fontsize=10)
    ax.set_ylabel(ylabel, fontsize=10)
    ax.grid(True, which="both", alpha=0.25, linewidth=0.6)


def fig_stage2_sweep(sweep, path):
    fig, ax = plt.subplots(figsize=(7.5, 5.2))
    by_mat = {}
    for r in sweep:
        by_mat.setdefault(r.material, []).append(r)
    for mat, rows in by_mat.items():
        rows = sorted(rows, key=lambda r: r.distance)
        ds = [r.distance for r in rows]
        lers = [r.logical_error_per_round for r in rows]
        ax.semilogy(ds, lers, "o-", color=COLORS.get(mat, "gray"), label=mat, linewidth=1.8, markersize=6)
    ax.set_xticks([3, 5, 7, 9])
    _style(ax, "Stage 2a — Surface-code memory (Stim + PyMatching)",
           "Code distance d", "Logical error rate / round")
    ax.legend(fontsize=8, title="Material", title_fontsize=8)
    fig.tight_layout()
    fig.savefig(path, dpi=140)
    plt.close(fig)


def fig_stage2b_xzzx(fits, path):
    fig, ax = plt.subplots(figsize=(7.5, 5.2))
    ds = np.arange(3, 16, 2)
    for short, fit in fits.items():
        c = COLORS.get(short, "gray")
        ax.semilogy(ds, [fit.ler_css(d) for d in ds], "-", color=c, linewidth=1.6,
                    label=f"{short} · CSS")
        if short in BIASED:
            ax.semilogy(ds, [fit.ler_xzzx(d) for d in ds], "--", color=c, linewidth=1.8,
                        label=f"{short} · XZZX (η={fit.bias_eta:.0f})")
    ax.set_xticks(ds)
    _style(ax, "Stage 2b — Bias tailoring: XZZX beats CSS under biased noise",
           "Code distance d", "Logical error rate / round (model)")
    ax.legend(fontsize=7.5, ncol=1)
    fig.tight_layout()
    fig.savefig(path, dpi=140)
    plt.close(fig)


def fig_crossover_C(fits, path):
    fig, ax = plt.subplots(figsize=(8.2, 5.6))
    targets = np.logspace(-6, -15, 60)
    for short, fit in fits.items():
        c = COLORS.get(short, "gray")
        y_css = [physical_per_logical(fit.required_distance(t, "css")) for t in targets]
        ax.loglog(targets, y_css, "-", color=c, linewidth=1.8, label=f"{short} · CSS")
        if short in BIASED:
            y_x = [physical_per_logical(fit.required_distance(t, "xzzx")) for t in targets]
            ax.loglog(targets, y_x, "--", color=c, linewidth=1.6, label=f"{short} · XZZX")
    for algo in ALGORITHMS:
        ax.axvline(algo.target_ler, color="black", linestyle=":", linewidth=1.1, alpha=0.7)
        ax.text(algo.target_ler, ax.get_ylim()[1] * 0.6, f" {algo.short}\n {algo.n_logical} logical",
                rotation=90, va="top", ha="right", fontsize=7.5, color="black")
    ax.invert_xaxis()  # harder targets (smaller LER) to the right
    _style(ax, "Stage 3 — Crossover (C): physical qubits per logical vs target error",
           "Target logical error rate (←easier · harder→)", "Physical qubits / logical qubit")
    ax.legend(fontsize=7.5, loc="upper left")
    fig.tight_layout()
    fig.savefig(path, dpi=140)
    plt.close(fig)


def fig_crossover_A(fits, path):
    fig, ax = plt.subplots(figsize=(7.8, 5.2))
    ns = np.arange(20, 81)
    classical = [classical_cost_seconds(int(n)) for n in ns]
    ax.semilogy(ns, classical, "k-", linewidth=2.0, label="Classical statevector sim (~2ⁿ)")
    # Quantum FT cost for a representative material at fixed target LER -> distance.
    ref = fits.get("Ta/sapphire") or next(iter(fits.values()))
    d = ref.required_distance(1e-9, "css")
    t_logical = surgery_rounds(d) * ROUND_TIME_NS
    quantum = [quantum_cost_qubit_seconds(int(n), d, t_logical) for n in ns]
    ax.semilogy(ns, quantum, color=COLORS["Ta/sapphire"], linewidth=2.0,
                label=f"FT QPU cost (Ta, d={d}) [qubit·s]")
    ax.axvline(50, color="gray", linestyle=":", linewidth=1.1)
    lo, hi = ax.get_ylim()
    ax.text(49.0, lo * 50, "classical sim plateau ~50q", rotation=90,
            va="bottom", ha="right", fontsize=8, color="gray")
    _style(ax, "Stage 3 — Crossover (A): classical sim cost vs fault-tolerant QPU",
           "Logical qubits n", "Cost (seconds / qubit·seconds, log)")
    ax.legend(fontsize=8)
    fig.tight_layout()
    fig.savefig(path, dpi=140)
    plt.close(fig)


def write_sweep_csv(sweep, path):
    with open(path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["material", "distance", "rounds", "shots", "physical_error",
                    "logical_errors", "logical_error_per_shot", "logical_error_per_round"])
        for r in sweep:
            w.writerow([r.material, r.distance, r.rounds, r.shots, f"{r.physical_error:.6e}",
                        r.logical_errors, f"{r.logical_error_per_shot:.6e}", f"{r.logical_error_per_round:.6e}"])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--fast", action="store_true", help="fewer shots for a quick smoke run")
    ap.add_argument("--shots", type=int, default=None)
    args = ap.parse_args()
    shots = args.shots or (8_000 if args.fast else 60_000)
    distances = (3, 5, 7, 9)

    os.makedirs(OUT, exist_ok=True)
    print(f"== Stage 2a: Stim distance sweep (d={distances}, shots={shots:,}) ==")
    sweep = distance_sweep(MATERIALS, distances=distances, shots=shots, seed=1)
    for r in sweep:
        print(f"  {r.material:<14} d={r.distance}  LER/round={r.logical_error_per_round:.3e}")

    print("\n== Stage 2b: calibrate CSS + XZZX bias model ==")
    fits = calibrate(MATERIALS, sweep)
    for short, fit in fits.items():
        print(f"  {short:<14} alpha_css={fit.alpha:.3f}  alpha_xzzx={fit.alpha_xzzx():.3f}  (eta={fit.bias_eta:.0f})")

    print("\n== Stage 2b: lattice-surgery CNOT cost (d=7) ==")
    surgery_table = {}
    for r in sweep:
        if r.distance == 7:
            c = surgery_cost(r.logical_error_per_round, 7)
            surgery_table[r.material] = asdict(c)
            print(f"  {r.material:<14} CNOT_err={c.cnot_logical_error:.3e}  time={c.time_ns/1000:.1f} us  ({c.rounds} rounds)")

    print("\n== Stage 3: resource estimates per algorithm ==")
    resource_table = {}
    for algo in ALGORITHMS:
        rows = {}
        for short, fit in fits.items():
            code = "xzzx" if short in BIASED else "css"
            d_css = fit.required_distance(algo.target_ler, "css")
            d_used = fit.required_distance(algo.target_ler, code)
            total = physical_per_logical(d_used) * algo.n_logical
            rows[short] = {"distance": d_used, "code": code,
                           "physical_per_logical": physical_per_logical(d_used),
                           "total_physical_qubits": total}
        resource_table[algo.short] = rows
        base = min(v["total_physical_qubits"] for v in rows.values())
        print(f"  {algo.name} (target {algo.target_ler:.0e}, {algo.n_logical} logical):")
        for short, v in sorted(rows.items(), key=lambda kv: kv[1]["total_physical_qubits"]):
            print(f"    {short:<14} d={v['distance']:<3} {v['total_physical_qubits']:>12,} phys  ({v['total_physical_qubits']/base:.1f}x)")

    print("\n== Writing figures + data to outputs/ ==")
    fig_stage2_sweep(sweep, os.path.join(OUT, "stage2a_distance_sweep.png"))
    fig_stage2b_xzzx(fits, os.path.join(OUT, "stage2b_xzzx_vs_css.png"))
    fig_crossover_C(fits, os.path.join(OUT, "stage3_crossover_C.png"))
    fig_crossover_A(fits, os.path.join(OUT, "stage3_crossover_A.png"))
    write_sweep_csv(sweep, os.path.join(OUT, "stage2_distance_sweep.csv"))

    summary = {
        "round_time_ns": ROUND_TIME_NS,
        "shots": shots,
        "distances": list(distances),
        "materials": [m.to_dict() for m in MATERIALS],
        "fits": {k: {"A": v.A, "alpha_css": v.alpha, "alpha_xzzx": v.alpha_xzzx(),
                     "bias_eta": v.bias_eta} for k, v in fits.items()},
        "lattice_surgery_cnot_d7": surgery_table,
        "resource_estimates": resource_table,
        "algorithms": [asdict(a) for a in ALGORITHMS],
    }
    with open(os.path.join(OUT, "summary.json"), "w") as f:
        json.dump(summary, f, indent=2)
    print(f"  wrote {OUT}/ (4 figures, summary.json, stage2_distance_sweep.csv)")


if __name__ == "__main__":
    main()

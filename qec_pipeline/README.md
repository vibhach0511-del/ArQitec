# QEC Pipeline — Material → Error Model → Lattice Surgery → Crossover

A material-aware quantum-error-correction pipeline. It maps qubit materials to
noise profiles, simulates surface-code memory + lattice surgery with **Stim +
PyMatching**, and turns the results into a fault-tolerant **resource crossover**:
*same algorithm, different material → different code distance → different
physical-qubit count and cost.*

## Run

```bash
conda activate qai
python -m qec_pipeline.run_pipeline          # full run (~15s)
python -m qec_pipeline.run_pipeline --fast   # quick smoke run
```

Outputs land in `qec_pipeline/outputs/`:

- `stage2a_distance_sweep.png` — logical error/round vs distance per material (real Stim).
- `stage2b_xzzx_vs_css.png` — XZZX vs CSS; biased materials cross *below* unbiased ones.
- `stage3_crossover_C.png` — physical qubits/logical vs target error, with RSA-2048 & FeMoco lines.
- `stage3_crossover_A.png` — classical statevector sim vs fault-tolerant QPU cost.
- `summary.json`, `stage2_distance_sweep.csv` — raw numbers.

## Stages

1. **`noise_profiles.py`** — 5 materials (Ta/sapphire, Nb/Si, Al legacy, fluxonium, ideal-biased) as full Pauli noise-profile dicts (`p_X,p_Z,p_Y,p_leakage,p_correlated,T1,T2,bias_eta`), plus a Pauli-twirl idle model from T1/T2.
2. **`surface_sim.py`** — rotated surface-code memory via `stim.Circuit.generated`, decoded with PyMatching. Distance sweep → logical error rate / round.
3. **`lattice_surgery.py`** — logical CNOT via merge+split (~2d rounds × 3 patches); accumulates per-round logical error over the operation's *time*.
4. **`crossover.py`** — calibrates CSS suppression from the Stim sweep, layers the XZZX bias-tailoring model, computes required code distance and physical-qubit counts per algorithm.

## Modeling honesty (put these on a slide)

- **Idle vs gate errors.** Idle T1/T2 is mostly *material*; 2Q gate fidelity is mostly *control/architecture*. We model idle + 1Q Pauli errors per material and hold the **2Q gate error fixed** (`P_GATE_2Q = 5e-3`) across materials. Deliberate simplification.
- **Pauli-twirl approximation.** Stim noise is Pauli channels. Leakage (`p_leakage`) and correlated cosmic-ray bursts (`p_correlated`) are tracked in the profile but **not injected** — they don't fit a Pauli channel cleanly. Leakage needs Stim leakage extensions / custom injection.
- **XZZX is a calibrated model layer, not yet a full circuit sim.** Stage 2a CSS is fully simulated in Stim. The XZZX biased-noise advantage is modeled by scaling the *measured* CSS suppression with the bias η, following Bonilla Ataides et al. (2021). Full XZZX circuit simulation is the clear next step.
- **Lattice surgery costs time.** A logical CNOT is ~2d rounds across ~3 patches; we multiply per-round error accordingly (longer op → more accumulated decoherence).
- **Wall-clock vs qubit-seconds.** Crossover (A) compares classical *seconds* to QPU *qubit-seconds* — different metrics. A fab/cooling pitch cares about qubit count; a cloud provider cares about throughput. State which you optimize.
- **Classical methods keep improving.** Tensor networks have repeatedly "uncrossed" claimed advantage (Google 2019, IBM 2023). Frame the crossover only for **provably hard FT workloads** (factoring, certain chemistry), not NISQ benchmarks.

## Citations

- Place et al., *Nat. Commun.* 12, 1779 (2021) — tantalum transmons.
- Google "Willow" below-threshold surface code, *Nature* (2024); IBM Heron specs.
- Bonilla Ataides et al., *Nat. Commun.* 12, 2172 (2021) — XZZX surface code.
- Gidney & Ekerå, *Quantum* 5, 433 (2021) — Shor / RSA-2048 resources.
- Reiher et al., *PNAS* (2017); von Burg et al. (2021) — FeMoco resources.

## TODO (real-hardware / heavier integration)

- Replace the XZZX model layer with a full XZZX circuit simulation in Stim.
- Inject leakage + correlated bursts via Stim leakage extensions.
- Pull live T1/T2/readout from IBM Quantum backend properties (`QiskitRuntimeService`).
- Swap the analytic resource estimate for **Qualtran** / Azure Quantum Resource Estimator (both installed in `qai`) to get T-factory-aware physical-qubit + runtime counts.
- Surface these results in the ArQiteQ frontend (new "Error Model" / "Crossover" views fed by `summary.json`).

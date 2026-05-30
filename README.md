# Quantum

> Using quantum computing to accelerate decision-taking in chip design,
> routing, and materials-science discovery. See [ROADMAP.md](ROADMAP.md)
> for the three-stage plan.

This `vibha` branch builds out the **measure → match → target** stack
underneath Stage 1 of the roadmap: which QEC code does a given material
need, and what does that QEC overhead cost for a real application?

---

## What is QEC?

**Quantum Error Correction.** It's the only way to keep a quantum
computation alive long enough to finish.

Quantum hardware today has ~10⁻³ error per gate. Useful algorithms need
~10⁻⁶ to ~10⁻¹⁵. QEC closes that 15-order-of-magnitude gap by **encoding
one logical qubit redundantly across many physical qubits**, then
continuously detecting and fixing errors — without measuring (and thus
destroying) the actual quantum state. The trick is to measure *clever
combinations* called stabilizers that reveal which error happened but
nothing about the data.

A **QEC code** is one specific encoding scheme. The four families that
show up in this repo:

| Code | When it wins |
|---|---|
| **Surface code** | The 2D-grid workhorse; ~1% physical-error threshold. Default. |
| **XZZX surface code** | Noise is biased toward Z errors (fluxonium, cat qubits). |
| **Color code** | Cliffords (H, S, CNOT) are natively cheap *and* physical error is very low. |
| **Bosonic (GKP, cat)** | Encode into oscillator states; sit *under* a 2D code. |

The right code depends on the material. That's what this branch maps.

---

## The layered model

| File | What it answers |
|---|---|
| [`qec_schema.py`](qec_schema.py) | What properties of a material decide which QEC code fits? |
| [`qec_recommender.py`](qec_recommender.py) | Given a material, which code family? |
| [`materials_library.py`](materials_library.py) | (v1) 10 platforms with the minimal schema. |
| [`qubit_catalogue.py`](qubit_catalogue.py) | (v2) Same 10 platforms with the full schema populated. |
| [`superconducting_qubit.py`](superconducting_qubit.py) | The superconducting family in physics-level depth (transmon, fluxonium, cat, GKP, Xmon) for 8 named devices. |
| [`control_hardware_catalogue.py`](control_hardware_catalogue.py) | The control stack — feedback latency, channel count, real-time decoding. QEC is hardware-bound from this side too. |
| [`target.py`](target.py) | Given a real application (chemistry, RSA-2048, ...), how many physical qubits does the QEC overhead actually cost? |

---

## Try it

```bash
python3 target.py                         # feasibility of every material vs. every target
python3 qubit_catalogue.py                # platform catalogue + per-platform recommendation
python3 superconducting_qubit.py          # SC-deep catalogue
python3 control_hardware_catalogue.py     # control stack
```

Each `__main__` block validates its entries against the relevant schema
and prints a readable table.

---

## The headline this branch produces

Same logical-error target, very different physical-qubit cost:

```
Target: materials chemistry (1e-6 logical error, 100 logical qubits)

Trapped ion (Quantinuum H-class)    Surface code         d=13     44,900 physical qubits
Fluxonium (Atlantic Quantum)        XZZX surface code    d=10     24,100
Bosonic GKP code                    XZZX surface code    d=3       1,700  ← best fit
Silicon spin (Diraq)                Surface code         d=102 2,121,700  ← punished by p_2q
```

**Bias buys you everything.** A bosonic GKP at η = 50 needs ~100× fewer
physical qubits than a transmon at η = 1.5 for the same target
reliability. The strategic argument for biased-noise codes hides inside
exactly this kind of table.

---

## Caveats

All numbers in the catalogue files are **illustrative representative
values** — not pulled from specific published runs. Replace with
measured / quoted specs before any decision that matters; the `notes`
field on every entry is where citations should land as the catalogue
tightens.

The surface-code threshold (`P_TH = 0.01`) and logical-error prefactor
(`A = 0.1`) in `target.py` are also illustrative. Fit them to your
actual decoder and noise model before drawing strategic conclusions.

---

## Branch difference

`main` has the strategic roadmap and the first-pass v1 files
(`qec_recommender.py`, `materials_library.py`). This `vibha` branch
adds the v2 schema, the deeper catalogues, the control-stack layer,
and the target-driven feasibility analysis.

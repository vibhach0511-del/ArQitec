# Roadmap

> Three-stage plan for applying quantum computing to the problems that gate
> next-generation chip design, routing, and materials discovery.

## Why this is hard, and why now

Chip placement and global routing are NP-hard combinatorial problems that
already absorb hundreds of GPU-hours per design closure. Materials discovery —
finding novel compounds with target properties — sits on exponentially-scaling
quantum chemistry simulations that classical solvers approximate at the cost
of accuracy. Both domains are where today's NISQ (Noisy Intermediate-Scale
Quantum) hardware can plausibly contribute at the right scale and with the
right hybrid pipeline, even before fault-tolerant quantum computers arrive.

The plan below is incremental: each stage stands on what the previous one
proved, and each stage ships a usable deliverable rather than a paper.

---

## Stage 1 — Hybrid Quantum-Classical Prototype for Chip Placement & Routing

**Goal:** Demonstrate measurable benefit on one representative EDA subproblem
before committing to integration work.

- **Problem.** Pick one tractable, hard sub-step of chip design — global
  routing on a partitioned netlist, or initial macro placement — and
  reformulate it as a QUBO (Quadratic Unconstrained Binary Optimization).
- **Approach.** QAOA on gate-model hardware (IBM, Rigetti, IonQ) and quantum
  annealing on D-Wave, both wrapped in a classical pre/post-processing
  pipeline so the quantum step only solves the kernel it's good at.
- **Hardware.** Cloud quantum access via Qiskit Runtime / Amazon Braket; no
  on-prem investment.
- **Deliverable.** Open-source SDK + benchmark report comparing the hybrid
  pipeline to simulated annealing and modern classical heuristics across
  representative problem sizes.
- **Success metric.** Statistically significant runtime *or* solution-quality
  advantage on a defined benchmark set within six months.

## Stage 2 — Pilot Integration into Production EDA Workflows

**Goal:** Prove the prototype matters inside a real design house, not just on
synthetic benchmarks.

- **Problem.** Drop the Stage 1 pipeline into an existing EDA flow at one
  specific bottleneck — clock tree synthesis or post-placement detailed
  routing — without rewriting the surrounding tool.
- **Approach.** Plugin / API for OpenROAD first (open source, easy iteration),
  then commercial integration with Cadence Innovus or Synopsys ICC2.
- **Customers.** One or two semiconductor design partners willing to test on
  a non-critical-path block of a real chip.
- **Deliverable.** Production-grade plugin + a measured speedup or
  quality-of-result improvement on a real design.
- **Success metric.** ≥10% reduction in design closure time on at least one
  pilot workload, or a routability win classical tools couldn't reach.

## Stage 3 — Materials Discovery & Cross-Domain Expansion

**Goal:** Extend the hybrid platform from optimization into simulation — the
second domain where quantum hardware has a credible long-horizon edge.

- **Problem.** Predict ground-state energies and electronic properties of
  small candidate molecules and crystal lattices relevant to chip thermal
  management, advanced packaging, or next-generation semiconductor materials.
- **Approach.** Variational Quantum Eigensolver (VQE) for ground states;
  quantum kernel methods for property regression; classical screening in
  front to keep the quantum workload small.
- **Deliverable.** Materials-discovery platform sitting on the same hybrid
  runtime as Stages 1 and 2, with at least one novel material whose target
  property has been experimentally validated by a partner lab.
- **Success metric.** First identified material picked up for downstream
  characterization, plus a published paper describing the discovery pipeline.

---

## What the three stages share

A single hybrid quantum-classical runtime, hardened progressively. Stage 1
proves the runtime; Stage 2 hardens it for production; Stage 3 generalizes
it to a second problem class. The compounding asset is the runtime, the
benchmark library, and the team's pattern library of which problem
reformulations actually work on near-term hardware.

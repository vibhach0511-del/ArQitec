# ArQiteQ

ArQiteQ is a QEC recommendation engine for superconducting quantum chips, built at Hackathon 2026. Given a material's noise profile — bias ratio and two-qubit gate error rate — it recommends the optimal quantum error-correction code (Surface, XZZX etc..) and ranks Layer 2 material stacks across thousands of combinations. The engine covers the full pipeline from qubit and control hardware selection through to fabrication targets, replacing years of trial-and-error with a single lookup.

---

## The Problem

Quantum computing hardware is bottlenecked by **decoherence** and **gate errors**. Error-correcting codes are the solution, but:

- **Physicists designing new qubit materials** (e.g., tantalum vs. aluminum on silicon) don't know which QEC code will best leverage their hardware's strengths.
- **QEC theorists** design codes assuming idealized hardware, ignoring real material constraints like crosstalk, leakage, and fabrication yield.
- **No tool exists** to systematically explore the intersection of material properties and code performance.

ArQiteQ closes this gap.

---

## How It Works

### Input: The Physicist's Constraints

```
User (Physicist)
├── Qubit Type: e.g., Flux, Transmon, Charge
├── Control: e.g., ASIC, FPGA, Custom Pulse
├── Cryogenics: e.g., Oxford Instruments MX100, Bluefors LD400
└── Target: e.g., Error rate < 10⁻¹⁵, 100 logical qubits
```

### Processing: The Materials Stack

ArQiteQ models the qubit as a **6-layer material stack**:

| Layer | Component | Key Properties |
|-------|-----------|----------------|
| 1 | Substrate | Silicon, Sapphire, Diamond |
| 2 | Buffer/Adhesion | Oxide quality, interface defects |
| 3 | Superconducting Film | Al, Nb, Ta (T₁, T₂, coherence) |
| 4 | Junction Barrier | AlOₓ, NbN (critical current, uniformity) |
| 5 | Control Wiring | Crosstalk, impedance, loss |
| 6 | Packaging/Shielding | Magnetic shielding, thermalization |

Each layer contributes to the **effective noise model**:
- Relaxation (T₁)
- Dephasing (T₂)
- Gate infidelity
- Measurement error
- Crosstalk / leakage

### Output: Ranked QEC Recommendations

```
Best QEC Matches (Ranked by Pareto Optimality)
├── 1. Surface Code (distance-7) — Best error suppression
├── 2. Heavy-Hex Code (distance-5) — Best for IBM-style connectivity
├── 3. Steane [[7,1,3]] — Lowest overhead, moderate protection
└── ... with tradeoff explanations if no match meets target
```

Each match includes:
- **Logical error rate** (from Stim simulation)
- **Physical qubit overhead**
- **Classical simulation cost** (CPU time, memory)
- **QPU execution cost** (gate count, runtime)
- **Crossover point**: where classical simulation becomes intractable

---

## Key Features

| Feature | Description |
|---------|-------------|
| **Many-to-Many Matching** | One material supports multiple codes; one code works across multiple materials |
| **Lattice Surgery Simulation** | Uses TQEC + Stim to compile and simulate surface code circuits |
| **Cost Crossover Analysis** | Compares classical decoder cost vs. QPU execution cost at scale |
| **Tradeoff Engine** | If no code meets the target, presents nearest options with clear explanations |
| **Bidirectional Design** | Future: design materials *from* a target QEC code (reverse problem) |

---

## Tech Stack

| Component | Tool |
|-----------|------|
| QEC Simulation | [Stim](https://github.com/quantumlib/Stim) — Fast stabilizer circuit simulation |
| Lattice Surgery | [TQEC](https://github.com/tqec/tqec) — 3D model to circuit compilation |
| IBM Integration | [Qiskit QEC](https://github.com/qiskit-community/qiskit-qec) — Heavy-hex, hardware compilation |
| Decoder | [PyMatching](https://github.com/oscarhiggott/PyMatching) — MWPM decoder |
| Error Rate Estimation | [ScaLER](https://github.com/quantum-x-labs/scaler) — Scalable logical error rates |
| Frontend | React / TanStack Start |
| Backend | Python, NumPy, NetworkX |

---

## Quick Start

```bash
# Clone the repo
git clone https://github.com/techstar9797/ArQiteQ.git
cd quantum

# Install dependencies
pip install -r requirements.txt
bun install

# Run the web app
bun run dev

# Run the QEC pipeline
python -m qec_pipeline.run_pipeline
```

---

## License

MIT — Open for research and commercial use.

---

> *"The best QEC code is the one that matches your materials—not the one with the lowest theoretical error rate."*

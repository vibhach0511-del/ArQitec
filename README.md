# Q-ArQite

> **Architecting the Quantum Stack: Intelligent Matching of Error-Correcting Codes to Quantum Materials**

---

## What is Q-ArQite?

Q-ArQite is an AI agent that bridges the gap between **quantum materials science** and **quantum error correction (QEC) theory**. Given a physicist's hardware constraints—qubit type, control electronics, cryogenics, and target performance—Q-ArQite recommends the optimal error-correcting code and simulates its performance on that specific material stack.

The core insight: **materials and codes have a many-to-many relationship**, and the best match depends on tradeoffs between error suppression, hardware overhead, and computational cost.

---

## The Problem

Quantum computing hardware is bottlenecked by **decoherence** and **gate errors**. Error-correcting codes are the solution, but:

- **Physicists designing new qubit materials** (e.g., tantalum vs. aluminum on silicon) don't know which QEC code will best leverage their hardware's strengths.
- **QEC theorists** design codes assuming idealized hardware, ignoring real material constraints like crosstalk, leakage, and fabrication yield.
- **No tool exists** to systematically explore the intersection of material properties and code performance.

Q-ArQite closes this gap.

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

Q-ArQite models the qubit as a **6-layer material stack**:

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
| Frontend | Streamlit / React (TBD) |
| Backend | Python, NumPy, NetworkX |

---

## Current Scope (Hackathon MVP)

- **2D QEC codes only** — Applicable to both superconducting and topological qubits
- **Superconducting materials focus** — Al/Si, Ta/Si, Nb/Sapphire
- **Surface code family** — Distance 3, 5, 7 with lattice surgery
- **Steane [[7,1,3]]** — For comparison and trapped-ion crossover
- **Heavy-hex code** — IBM-native architecture

### Out of Scope (Future Work)

- 3D codes (reserved for topological qubits)
- Full bidirectional design (material → QEC and QEC → material)
- Real-time neural decoders (AlphaQubit-style)
- Lab automation integration (pharma pipeline)

---

## Quick Start

```bash
# Clone the repo
git clone https://github.com/techstar9797/quantum.git
cd quantum

# Install dependencies
pip install -r requirements.txt

# Run the agent
python q_arqite.py   --qubit-type transmon   --material ta-si   --target-error 1e-15   --logical-qubits 100

# Or launch the web demo
streamlit run app.py
```

---

## Example Output

```
Input: Tantalum on Silicon (Ta/Si), T₁ = 150 µs, T₂ = 100 µs
       Target: 100 logical qubits @ error rate < 10⁻¹⁵

Match 1: Surface Code (distance-17)
  - Logical error rate: 8.2 × 10⁻¹⁶  ✓ MEETS TARGET
  - Physical qubits: 11,560
  - Classical decoder cost: ~2.4 TFLOP / round
  - QPU runtime: ~18 ms / round
  - Crossover: Classical viable up to ~10⁶ rounds

Match 2: Heavy-Hex Code (distance-11)
  - Logical error rate: 3.1 × 10⁻¹⁴  ✗ BELOW TARGET
  - Physical qubits: 7,920
  - Better connectivity match for IBM-style hardware

Match 3: Steane [[7,1,3]] (concatenated ×3)
  - Logical error rate: 2.8 × 10⁻¹²  ✗ BELOW TARGET
  - Physical qubits: 343
  - Lowest overhead, best for near-term NISQ crossover

No perfect match. Best tradeoff: Surface Code (distance-17)
  → Increase T₁ to 200 µs to reduce distance to 13 (-40% qubits)
  → Or accept error rate 8.2 × 10⁻¹⁶ (already meets target)
```

---

## Why This Matters

| Stakeholder | Pain Point | Q-ArQite Solves |
|-------------|-----------|-----------------|
| **Materials Physicist** | "I made a better T₁ qubit—now what?" | Shows which QEC code unlocks that improvement |
| **QEC Theorist** | "My code assumes perfect connectivity" | Validates code on real material constraints |
| **Hardware Engineer** | "Should I use Al or Ta for my next fab run?" | Quantifies the QEC impact of material choices |
| **Investor/PM** | "Which platform will scale first?" | Compares crossover points across material-code pairs |

---

## Next Steps

### Immediate (Post-Hackathon)

1. **Validate on real data** — Run against Google Quantum AI public surface code datasets
2. **Expand material library** — Add Nb/Sapphire, Al/Sapphire, InAs-Al (topological)
3. **Add color codes** — Implement via MQT QECC for trapped-ion crossover analysis
4. **Improve decoder cost model** — Integrate union-find and neural decoder benchmarks

### Short-Term (1–3 Months)

5. **Bidirectional mode** — Given a target QEC code, recommend material stack modifications
6. **3D code support** — Extend to topological qubits (Majorana, Floquet)
7. **Hardware API integration** — Compile matched codes directly to Qiskit Runtime or Google Quantum AI
8. **Error budget tool** — Decompose logical error into per-layer contributions

### Long-Term (3–12 Months)

9. **Lab automation bridge** — Export material recommendations to fabrication control systems
10. **Pharma pipeline** — Adapt framework for quantum simulation target matching (drug discovery)
11. **Community dataset** — Crowdsource material-QEC performance data from labs worldwide
12. **Publication** — "Q-ArQite: A Materials-Aware Framework for Quantum Error Correction Design"

---

---

## License

MIT — Open for research and commercial use.

---

## Acknowledgments

- Google Quantum AI for Stim and public surface code data
- TQEC community for lattice surgery tools
- IBM Quantum for Qiskit QEC and heavy-hex architecture
- MQT team for QECC framework and color code support

---

> *"The best QEC code is the one that matches your materials—not the one with the lowest theoretical error rate."*

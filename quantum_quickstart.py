"""Drop 2 quickstart: Bell state + QAOA toy portfolio.

Run inside the `qai` env:
    conda activate qai && python quantum_quickstart.py
"""
from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator


def bell_state():
    print("=== Bell State Hello World (expect ~50% '00', ~50% '11') ===")
    qc = QuantumCircuit(2, 2)
    qc.h(0)          # superposition
    qc.cx(0, 1)      # entanglement
    qc.measure([0, 1], [0, 1])

    sim = AerSimulator()
    result = sim.run(qc, shots=1024).result()
    print("counts:", result.get_counts())


def qaoa_toy():
    print("\n=== QAOA 2-Asset Toy Portfolio ===")
    from qiskit_optimization import QuadraticProgram
    from qiskit_algorithms import QAOA
    from qiskit_algorithms.optimizers import COBYLA

    # qiskit 2.x removed the V1 primitives Sampler. The reference
    # StatevectorSampler (V2) decomposes the high-level QAOA ansatz gate,
    # which Aer's sampler cannot run without explicit transpilation.
    from qiskit.primitives import StatevectorSampler

    qp = QuadraticProgram()
    qp.binary_var("x0")
    qp.binary_var("x1")
    qp.maximize(linear={"x0": 0.1, "x1": 0.15}, quadratic={("x0", "x1"): -0.05})

    operator, offset = qp.to_ising()
    qaoa = QAOA(sampler=StatevectorSampler(), optimizer=COBYLA(), reps=1)
    result = qaoa.compute_minimum_eigenvalue(operator)
    print("best_measurement:", result.best_measurement)


if __name__ == "__main__":
    bell_state()
    qaoa_toy()

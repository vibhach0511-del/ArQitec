import stim
import json

CODES = [
    ("repetition_code:memory",          [3,5,7,9], 1),
    ("surface_code:rotated_memory_z",   [3,5,7,9], 1),
    ("surface_code:unrotated_memory_z", [3,5,7,9], 1),
    ("surface_code:rotated_memory_x",   [3,5,7,9], 1),
    ("surface_code:unrotated_memory_x", [3,5,7,9], 1),
    ("color_code:memory_xyz",           [3,5,7,9], 2),
]

CLIFFORD_GATES = {"H","S","CNOT","CZ","CX","ISWAP","SQRT_X","SQRT_Y","S_DAG","SQRT_X_DAG"}
TWO_QUBIT_GATES = {"CNOT","CZ","CX","ISWAP"}

results = []

for code_task, distances, rounds in CODES:
    for d in distances:
        try:
            circuit = stim.Circuit.generated(
                code_task, distance=d, rounds=rounds,
                after_clifford_depolarization=0.001
            )
            coords = circuit.get_detector_coordinates()
            instructions = list(circuit)
            clifford_count = sum(1 for i in instructions if i.name in CLIFFORD_GATES)
            two_q_count = sum(1 for i in instructions if i.name in TWO_QUBIT_GATES)
            gate_types = list(set(i.name for i in instructions if i.name in TWO_QUBIT_GATES))
            record = {
                "code_id": code_task.replace(":", "_").replace("/", "_"),
                "distance": d,
                "n_qubits": circuit.num_qubits,
                "detector_count": len(coords),
                "clifford_gate_count": clifford_count,
                "two_qubit_gate_count": two_q_count,
                "gate_types_required": gate_types,
                "circuit_depth": len(instructions),
                "detector_coords": {str(k): list(v) for k, v in coords.items()},
            }
            results.append(record)
            print(f"OK: {code_task} d={d} | qubits={circuit.num_qubits} | 2Q gates={two_q_count}")
        except Exception as e:
            print(f"SKIP: {code_task} d={d} — {e}")

with open("stim_coords.json", "w") as f:
    json.dump(results, f, indent=2)

print(f"Saved {len(results)} records to stim_coords.json")

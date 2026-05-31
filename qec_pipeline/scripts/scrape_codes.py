import panqec.codes as pc
import inspect
import json
import numpy as np

SKIP = {"StabilizerCode"}

class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super().default(obj)

code_classes = [
    (name, obj) for name, obj in inspect.getmembers(pc)
    if inspect.isclass(obj) and name not in SKIP
]

results = []

for name, cls in code_classes:
    try:
        code = cls(4, 4)
        record = {
            "name": name,
            "n_qubits": code.n,
            "k_logicals": code.k,
            "distance": code.d,
            "dimension": code.dimension,
            "qubit_coords": [list(c) for c in code.qubit_coordinates],
            "stabilizer_coords": [list(c) for c in code.stabilizer_coordinates],
        }
        results.append(record)
        print(f"OK: {name}")
    except Exception as e:
        print(f"SKIP: {name} — {e}")

with open("codes.json", "w") as f:
    json.dump(results, f, indent=2, cls=NumpyEncoder)

print(f"\nSaved {len(results)} codes to codes.json")

import os, yaml, json

TARGET_DIRS = [
    "eczoo_data/codes/quantum/qubits/stabilizer",
    "eczoo_data/codes/quantum/qubits/small_distance",
    "eczoo_data/codes/quantum/qubits/subsystem",
    "eczoo_data/codes/quantum/qubits/dynamic",
    "eczoo_data/codes/quantum/spins",
]

TARGET_FILES = [
    "eczoo_data/codes/quantum/qubits/nonabelian_kitaev_honeycomb.yml",
]

results = []

def load_yaml(fpath):
    with open(fpath, "r") as f:
        try:
            return yaml.safe_load(f)
        except Exception:
            return None

for target in TARGET_DIRS:
    for root, dirs, files in os.walk(target):
        for fname in files:
            if not fname.endswith(".yml"):
                continue
            data = load_yaml(os.path.join(root, fname))
            if not data:
                continue
            results.append({
                "code_id": data.get("code_id", fname),
                "name": data.get("name", ""),
                "description": str(data.get("description", ""))[:500],
                "physical": data.get("physical", ""),
                "logical": data.get("logical", ""),
                "relations": data.get("relations", {}),
            })

for fpath in TARGET_FILES:
    data = load_yaml(fpath)
    if data:
        results.append({
            "code_id": data.get("code_id", fpath),
            "name": data.get("name", ""),
            "description": str(data.get("description", ""))[:500],
            "physical": data.get("physical", ""),
            "logical": data.get("logical", ""),
            "relations": data.get("relations", {}),
        })

with open("eczoo_codes.json", "w") as f:
    json.dump(results, f, indent=2)

print(f"Saved {len(results)} codes to eczoo_codes.json")

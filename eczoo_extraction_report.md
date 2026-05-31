# Error Correction Zoo (ECZoo) Extraction — Process Report

## Overview

This report documents the process of scraping, cleaning, and filtering structured error correction code data from the Error Correction Zoo for use in a quantum hackathon project. The goal was to produce a clean JSON dataset of quantum error correction codes relevant to 2D topological and semiconductor qubit systems, compatible with Stim/Crumble simulation workflows.

---

## Source

**Website:** https://errorcorrectionzoo.org/

**Data repository:** https://github.com/errorcorrectionzoo/eczoo_data

The ECZoo separates data storage from presentation. All code metadata is stored as structured YAML files (one per code) in the GitHub repository, making it a clean programmatic scrape target — no HTML parsing required.

---

## Step 1 — Repository Clone

The data repository was cloned locally:

```bash
git clone https://github.com/errorcorrectionzoo/eczoo_data.git
```

**Result:** ~77,583 objects, 13.82 MiB. Repository contains subdirectories for classical, quantum, and classical-into-quantum code families.

---

## Step 2 — Initial Scrape Attempt (Failed)

**Approach:** Keyword-based filtering across all YAML files using terms including `surface`, `toric`, `lattice`, `topological`, `stabilizer`, `css`, `semiconductor`, `spin`, `2d`.

**Problem:** The keyword `lattice` matched classical lattice codes (Barnes-Wall, Niemeier, root lattices, modulation schemes). First 10 results included:

- `modulation` — Modulation scheme
- `coxeter_todd` — Coxeter-Todd lattice
- `bw32` — Barnes-Wall lattice
- `niemeier` — Niemeier lattice

**Result:** 287 codes, majority classical — not useful.

---

## Step 3 — Tightened Keyword Filter (Partially Failed)

**Fix attempted:** Refined keywords to multi-word phrases (`surface code`, `toric code`, `css code`) and added exclusion keywords (`classical`, `analog`, `lattice code`, `barnes-wall`). Also added path filter restricting to `/quantum/` subdirectory.

**Problem:** Reduced count only marginally (287 → 277). Bosonic and GKP codes still present — not relevant to 2D topological/semiconductor scope.

**Root cause:** Keyword filtering is a blunt instrument across a heterogeneous dataset. Path-based filtering is more reliable.

---

## Step 4 — Directory Structure Inspection

Inspected the repository structure to identify the correct subdirectories:

```
eczoo_data/codes/quantum/
    categories/
    oscillators/        ← bosonic/GKP — excluded
    qubits/
        dynamic/        ← Floquet, honeycomb codes
        holographic/    ← excluded
        majorana/       ← excluded
        nonstabilizer/  ← excluded (incompatible with Stim)
        permutation_invariant/ ← excluded
        small_distance/ ← near-term codes, included
        stabilizer/     ← primary target
        subsystem/      ← Bacon-Shor and topological variants
    qudits/             ← excluded
    spins/              ← semiconductor spin qubits, included
```

---

## Step 5 — Directory-Targeted Scrape (Final Approach)

**Strategy:** Replace keyword filtering entirely with explicit directory targeting. Selected directories based on relevance to 2D topological codes and semiconductor qubit compatibility.

**Target directories:**

| Directory | Rationale |
|---|---|
| `qubits/stabilizer` | Primary — surface, toric, color, CSS codes |
| `qubits/small_distance` | Near-term, experimentally relevant |
| `qubits/subsystem` | Bacon-Shor, Kitaev honeycomb variants |
| `qubits/dynamic` | Floquet codes, honeycomb Floquet |
| `spins` | Semiconductor spin qubit codes |

**Additional file:**

| File | Rationale |
|---|---|
| `qubits/nonabelian_kitaev_honeycomb.yml` | Topological, 2D relevant |

**Excluded directories:**

- `oscillators` — bosonic/GKP, not Stim-compatible
- `holographic` — not experimentally relevant
- `majorana` — niche material requirement
- `nonstabilizer` — incompatible with Stim stabilizer circuit framework
- `permutation_invariant` — not topological
- `qudits`, `groups`, `homogeneous` — outside scope

---

## Step 6 — Path Correction

The `nonabelian_kitaev_honeycomb.yml` file path required correction. Initial path used:

```
eczoo_data/codes/quantum/nonabelian_kitaev_honeycomb.yml  ← incorrect
```

Correct path found via `find`:

```
eczoo_data/codes/quantum/qubits/nonabelian_kitaev_honeycomb.yml  ← correct
```

---

## Final Script

```python
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
```

---

## Final Output

**File:** `eczoo_codes.json`
**Count:** 290 codes
**Format:** JSON array, one object per code

**Fields per record:**

| Field | Description |
|---|---|
| `code_id` | Unique identifier string |
| `name` | Human-readable code name (may contain LaTeX) |
| `description` | First 500 characters of description |
| `physical` | Physical encoding type |
| `logical` | Logical encoding type |
| `relations` | Parent/child code relationships |

**Sample entries (every 30th):**

| code_id | name |
|---|---|
| qubit_css | Qubit CSS code |
| generalized_shor | Generalized Shor code |
| hhb_fracton | Hsieh-Halasz-Balents (HHB) code |
| hyperbolic_surface | Hyperbolic surface code |
| bb288 | [[288,12,18]] double-gross code |
| quantum_reed_muller | Quantum Reed-Muller (RM) code |
| hgp_7_2_2 | [[7,2,2]] HGP phantom code |
| stab_12_2_2 | [[12,2,2]] CSS code |
| kitaev_honeycomb | Kitaev honeycomb code |
| haar_random | Haar-random qubit code |

---

## Known Limitations

- `haar_random` (Haar-random qubit code) is present — a randomly generated code with no material relevance. Not worth refiltering for a single entry.
- Description field truncated to 500 characters — sufficient for agent input, not complete reference.
- LaTeX markup present in `name` fields (e.g. `\([[288,12,18]]\)`) — requires stripping before display use.
- 3D fracton codes (e.g. `hhb_fracton`) are included per the "some 3D codes" allowance but should be flagged separately in downstream processing.

---

## Next Steps

- Join `eczoo_codes.json` with `codes.json` (Stim-native structures) to map metadata to simulation-ready circuits
- Strip LaTeX from name fields for clean display
- Tag entries by dimensionality (2D vs 3D) for agent routing
- Build Stim circuit generation layer for priority codes

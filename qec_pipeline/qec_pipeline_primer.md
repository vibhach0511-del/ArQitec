# QEC Pipeline — Team Primer

## What this is

The `qec_pipeline` directory contains a data pipeline built to support the QEC code-to-material fitness matching system. It provides structured data about quantum error correction codes sourced from multiple academic and simulation tools, stored in a SQLite database alongside raw JSON files.

This pipeline feeds into the fitness matrix (Steps 5 and 6) that powers `qec_recommender.py`.

---

## Directory structure

See `qec_pipeline/` for the full file tree. Key files: `data/quantum_hack.db`, `data/eczoo_codes_full.json`, `data/stim_coords.json`, `data/parity_matrices.json`, and all scripts under `scripts/`.

---

## The database

Open `quantum_hack.db` with DB Browser for SQLite (free GUI) or pandas.

Six tables:

- `eczoo_codes` — 290 rows, QEC code metadata from Error Correction Zoo
- `stim_circuits` — 24 rows, circuit depth and gate counts from Stim
- `parity_matrices` — 12 rows, H_X and H_Z matrix properties from qldpc
- `materials` — 0 rows, schema ready, aligned with qec_schema.py
- `fitness_matrix` — 0 rows, schema ready
- `code_mapping` — 0 rows, needs 15-20 rows to bridge naming differences

Quick start:

    import sqlite3, pandas as pd
    conn = sqlite3.connect('qec_pipeline/data/quantum_hack.db')
    df = pd.read_sql('SELECT * FROM eczoo_codes', conn)

---

## Naming gap

The three datasets use different strings for the same code. Do not join on code_id directly until code_mapping is populated. Example mappings needed:

- rotated_surface / surface_code_rotated_memory_z / surface
- toric / (none) / toric
- 2d_color / color_code_memory_xyz / (none)
- quantum_repetition / repetition_code_memory / repetition

---

## Connection to the recommender

qec_recommender.py at the repo root is a v1 heuristic using only bias_eta and p_gate_2q. The database enables a v2 flow: filter parity_matrices by connectivity, filter stim_circuits by gate type compatibility, score remaining codes against material noise profile, look up LER from qECCBenchWiki SQLite, write to fitness_matrix.

---

## Your immediate tasks

Step 5: Populate materials table. Use qec_schema.py for field definitions. Required: name, bias_eta, p_gate_2q. Target 4-6 materials: superconducting transmon, silicon spin, trapped ion, neutral atom, NV center.

Step 6: Populate fitness_matrix. Score code x material pairs on connectivity, noise bias, and geometry. Key on (code_id, material_id, distance).

code_mapping: Populate before Step 6. 15-20 rows. Can be a hardcoded Python dict or SQLite rows.

---

## Environment setup

    python3 -m venv venv && source venv/bin/activate
    pip install stim scalerqec qldpc deltakit pandas pyyaml python-dotenv

macOS only for qldpc and deltakit:

    brew install llvm@20
    export CMAKE_PREFIX_PATH=/usr/local/opt/llvm@20
    pip install llvmlite qldpc deltakit

Deltakit API token in .env:

    DELTAKIT_API_KEY=your_token_here

---

## External repos to clone

    git clone https://github.com/errorcorrectionzoo/eczoo_data.git
    git clone https://github.com/yezhuoyang/ScaLERQEC.git
    git clone https://github.com/QuantumSavory/qECCBenchWiki.git
    cd qECCBenchWiki && git restore --source remotes/origin/evaluation_results_branch codes/results.sqlite

---

## Reference documents

- qec_pipeline_primer.md — full detail on everything above
- qec_dataset_coverage_v2.md — missing fields and sources
- qec_data_sources_v2.md — all data sources and their role
- eczoo_extraction_report.md — ECZoo scraping process log

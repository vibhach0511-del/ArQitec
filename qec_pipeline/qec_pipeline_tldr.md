# QEC Pipeline — TLDR

## What's here

A data pipeline that feeds the QEC code-to-material recommender. Three datasets, one database, six tables.

---

## The database

`qec_pipeline/data/quantum_hack.db` — open with DB Browser (GUI) or pandas.

| Table | Rows | What it is |
|---|---|---|
| `eczoo_codes` | 290 | QEC code metadata from Error Correction Zoo |
| `stim_circuits` | 24 | Circuit depth, gate counts, qubit layout |
| `parity_matrices` | 12 | H_X, H_Z degree, ancilla fraction |
| `materials` | 0 | Your job — populate with priority materials |
| `fitness_matrix` | 0 | Your job — populate with code x material scores |
| `code_mapping` | 0 | Your job — 15-20 rows bridging naming differences |

---

## Quick start

    import sqlite3, pandas as pd
    conn = sqlite3.connect('qec_pipeline/data/quantum_hack.db')
    df = pd.read_sql('SELECT * FROM eczoo_codes', conn)

---

## Your immediate tasks

1. Populate materials — use qec_schema.py for field definitions. Required: name, bias_eta, p_gate_2q. Target 4-6 materials.
2. Populate code_mapping — 15-20 rows mapping the same code across different naming conventions. See primer for the table.
3. Populate fitness_matrix — score code x material pairs using connectivity, noise bias, and geometry. See qec_recommender.py for the existing v1 logic to build from.

---

## Key naming gotcha

The three tables call the same code by different names. Don't join on code_id directly until code_mapping is populated — the join will silently return nothing.

---

## Environment setup

    python3 -m venv venv && source venv/bin/activate
    pip install stim scalerqec qldpc deltakit pandas pyyaml python-dotenv

macOS only:

    brew install llvm@20
    export CMAKE_PREFIX_PATH=/usr/local/opt/llvm@20
    pip install llvmlite qldpc deltakit

---

## External repos needed to regenerate data

    git clone https://github.com/errorcorrectionzoo/eczoo_data.git
    git clone https://github.com/yezhuoyang/ScaLERQEC.git
    git clone https://github.com/QuantumSavory/qECCBenchWiki.git

---

## Reference docs

- qec_pipeline_primer.md — full detail on everything above
- qec_dataset_coverage_v2.md — what fields are missing and where to get them
- qec_data_sources_v2.md — all data sources and their role

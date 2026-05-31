## Fitness Matrix (Step 6)

Scores 24 superconducting-compatible QEC codes against the fabrication
material catalog, producing a (code × material × role) compatibility matrix
used by the recommender.

### Run

    source bin/activate
    python fitness_matrix.py

Writes:
- `qec_pipeline/data/quantum_hack.db` — populates the `fitness_matrix` table
- `outputs/fitness_matrix.csv` — same data as CSV for inspection

Runtime: ~1 second.

### Verify

After running, check the table populated:

    sqlite3 qec_pipeline/data/quantum_hack.db \
      "SELECT COUNT(*) FROM fitness_matrix"

Should return 3864 (24 codes × 161 materials) with the current catalog.

Sanity-check the top film recommendations:

    sqlite3 qec_pipeline/data/quantum_hack.db <<SQL
    SELECT code_id, display_name, overall_score
    FROM fitness_matrix
    WHERE role='film' AND qubit_family='superconducting_planar'
      AND tier='ranked'
    ORDER BY overall_score DESC LIMIT 5;
    SQL

### Inputs

- `material_properties.py` — fabrication catalog (read-only by this script)
- `code_preferences.json` — per-code bias preferences and thresholds

If you update either, re-run the script. The DB table is dropped and
recreated each run.

### Scoring model

Three axes applied where data exists:
- **coherence_fit** — T1 vs code's syndrome cycle requirement
  (applies to substrate, film, cavity, superinductor)
- **bias_fit** — material `bias_eta` vs code's bias preference
  (applies to film, cavity, superinductor)
- **role-fit** — implicit in the (material, role) key

Plus a **confidence weight** multiplier (1.0 / 0.85 / 0.7 for
measured / estimated / speculative entries).

Aggregation: geometric mean over applicable axes × confidence weight.

Gate-error axis is held constant across materials (P_GATE_2Q = 5e-3),
matching `qec_pipeline/noise_profiles.py` convention.

Codes/materials not relevant to the superconducting planar regime
(NV centers, 3D cavities, topological platforms) are scored as
`out_of_scope_*` tiers — present in the matrix for transparency but
excluded from ranking.

### Next: frontend bridge

The matrix sits in SQLite but isn't yet exposed to the frontend. The
pattern to follow is `qec_pipeline/export_catalogs.py` (which exports
`cryostat_catalog.py` to `src/lib/qa/cryostat-data.ts`). A parallel
`export_fitness.py` would read the `fitness_matrix` table and write
`src/lib/qa/fitness-data.ts` for the Co-Design Selector.

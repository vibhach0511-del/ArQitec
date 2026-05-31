# Frontend Bridge for the Fitness Matrix — Open Questions

The `fitness_matrix` table (3864 rows in `qec_pipeline/data/quantum_hack.db`)
scores 24 QEC codes against 161 fabrication materials. It's not yet exposed
to the frontend. Before writing the bridge, three design questions need
input — written up here for team feedback.

See `FITNESS_MATRIX.md` for the scoring model details.

---

## Context

There are three materials datasets currently in the repo, and a natural
join key between them:

```
material_properties.py (161 fabrication materials, vibha)
        │
        │ display_name
        ▼
fitness_matrix table (3864 cells: 161 materials × 24 codes)
        │
        │ display_name  ←→  qpropsSource
        ▼
materials-data.ts (18 curated frontend materials)
        │
        ▼
Co-Design Selector (src/lib/qa/codesign.ts)
```

The Co-Design Selector's flow (per `codesign.ts` comments): *"pick qubit type →
control → cryogenics → target, then rank the compatible+feasible materials
and recommend the best QEC code."*

The fitness_matrix is exactly the "for each material, find its best QEC code"
lookup table the selector needs. The bridge connects the middle to the bottom.

The pattern to follow is `qec_pipeline/export_catalogs.py` — reads a Python
data source, emits a typed TypeScript module at `src/lib/qa/<name>-data.ts`.

---

## Question 1 — What shape should `fitness-data.ts` take?

**Option A — Dump all in-scope cells (~3264 entries).**
Flat array. Frontend filters at query time. Bundle ~500KB. Simplest exporter.
Maximum flexibility for downstream UI changes.

**Option B — Join to the 18 frontend materials (~432 entries).**
For each curated material, emit cells for 24 codes (via
`qpropsSource`-to-`display_name` match). Bundle <100KB. Tightly coupled to
current frontend material set. If `materials-data.ts` adds materials, the
exporter has to know.

**Option C — Hybrid.**
Option A's full array plus a pre-built "top 5 codes per frontend material"
index for UI convenience.

**Current lean: A.** Smallest amount of work, future-proof against frontend
materials list changes. Bundle size is fine for a static export. B's join
is fragile if `qpropsSource` and `display_name` drift.

---

## Question 2 — Separate exporter or merge into `fitness_matrix.py`?

The codebase has both patterns:
- `qec_pipeline/export_catalogs.py` — separate exporter (reads
  `cryostat_catalog.py`, writes `cryostat-data.ts`)
- `qec_pipeline/materials_project.py` — combined (populates Python + emits
  `materials-data.ts`)

**Option I — New `qec_pipeline/export_fitness.py`** (separate).
Two-step workflow: `python fitness_matrix.py` then
`python -m qec_pipeline.export_fitness`. Matches the `export_catalogs.py`
pattern. Cleaner separation of concerns.

**Option II — Add `--export-ts` flag to `fitness_matrix.py`** (combined).
One-step workflow. Less aligned with the `qec_pipeline/`-organized exporter
convention.

**Current lean: I.** Mirrors existing convention, keeps `fitness_matrix.py`
focused on computation, makes dependency explicit (must populate before export).

---

## Question 3 — What does the frontend actually need in each cell?

Minimum likely required, based on a skim of `codesign.ts`:

- `code_id` — which code
- `material_id` / `display_name` — matches `qpropsSource` for join
- `role` — substrate, film, junction, cavity, etc.
- `overall_score` — the ranking number
- `coherence_fit`, `bias_fit` — axis breakdowns ("why this code")
- `confidence` — data quality (measured / estimated / speculative)
- `qubit_family`, `tier` — for frontend filtering

Plus possibly from `code_preferences.json`:
- `bias_preference`, `threshold_p2q` — for rendering explanations
  ("this code wants high-bias materials; yours has η=15")

Open question: does the UI need anything else? Top-N hints? Pre-computed
"why-not" explanations for out-of-scope cells? Confidence weight separately
from confidence label?

---

## Other things worth deciding

- **Does this need to work for `noise_profiles.py`-style profiles too**,
  or only the 161-material catalog? The plot pipeline uses 5 hardcoded
  materials and produces its own QEC story (the crossover plots). If those
  need to flow into the frontend too, that's a different (and larger) bridge.

- **Naming.** Suggestion: `src/lib/qa/fitness-data.ts` with `FITNESS_CELLS`
  and `FITNESS_META` exports, mirroring `cryostat-data.ts` /
  `materials-data.ts`. Open to alternatives.

- **Regeneration cadence.** After any change to `material_properties.py`
  or `code_preferences.json`: re-run `fitness_matrix.py` then
  `export_fitness.py`. Worth a make-target or script wrapper? Or fine to
  document as a two-step manual procedure?

---

## What I need from the team

Quick reactions on any of these:

1. **Q1 (shape):** Option A, B, or C?
2. **Q2 (organization):** Option I or II?
3. **Q3 (fields):** anything missing from the proposed cell schema?
4. **Frontend UI direction:** is the Co-Design Selector ending in *one* code
   recommendation, or a *ranked list*? Affects whether Option C's pre-built
   top-N index is worth building.
5. **Anyone actively in `codesign.ts`?** If so, would prefer to coordinate
   shape with that work rather than guess.

Reply on Slack or annotate this file directly.

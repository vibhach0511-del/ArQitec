
# Q-Architect — Frontend Build Plan

A polished, demo-ready frontend for an AI + quantum optimizer platform aimed at semiconductor R&D teams. Dark mode, scientific/EDA aesthetic, neon cyan/violet/blue/green accents, dense engineering data presented cleanly. All data mocked.

## Design system

- Dark theme by default (no theme toggle needed for v1)
- Background: deep near-black with subtle blue tint; surfaces in layered slate
- Accents (semantic tokens in `src/styles.css`, all `oklch`):
  - `--accent-cyan` (primary signal)
  - `--accent-violet` (AI/optimization)
  - `--accent-blue` (data/metrics)
  - `--accent-green` (success/fidelity)
  - `--accent-amber` / `--accent-red` (risk/error)
- Typography: Inter for UI, JetBrains Mono for numeric/engineering values
- Sparse glassmorphism: only on floating inspector panels and status bar
- Grid backgrounds, hairline borders, subtle scanline/glow on canvas areas
- Components built on existing shadcn primitives (Card, Tabs, Table, Tooltip, Progress, Badge, ScrollArea, Sheet, Dialog)

## Routes (TanStack Start, file-based)

```
src/routes/
  __root.tsx           (existing — add dark class, fonts, metadata)
  index.tsx            (Landing / Mission)
  _app.tsx             (pathless layout: sidebar + top status bar + Outlet)
  _app/workspace.tsx   (Design Workspace — main dashboard)
  _app/materials.tsx   (Materials & Process Panel)
  _app/topology.tsx    (Topology Explorer)
  _app/benchmarks.tsx  (Workload Benchmark)
  _app/qec.tsx         (Error Correction Advisor)
  _app/results.tsx     (Optimization Results — before/after)
  _app/agent.tsx       (AI Agent Reasoning Panel — full page view)
```

Each route gets its own `head()` with route-specific title + description. Agent panel also appears as a collapsible right-side drawer on the Workspace page.

## Page contents

**1. Landing (`/`)**
- Hero: "Q-Architect" wordmark with subtle chip-lattice background SVG, subtitle, primary CTA "Open Workspace", secondary "View Demo Results"
- 3 value cards: Topology Optimization · Error-Correction Readiness · Materials-Aware DSE
- Strip of mock "trusted by" research labs (subtle, monochrome)
- Footer with version / build hash mock

**2. Design Workspace (`/workspace`)**
- Left sidebar (collapsible, icon mini-state): Workspace, Materials, Topology, Benchmarks, QEC, Results, Agent
- Top status bar: Workload selector (QAOA), Qubit budget (127), Backend profile (Transmon · 15mK), Optimization status pill (Idle/Running/Converged), Run Optimization button, Compare Baselines button, Export Report button
- Center: Quantum Chip Canvas — SVG rendering of qubit nodes (circles with glow) + coupler links, color-coded by fidelity/crosstalk; selectable nodes
- Right inspector: tabs (Qubit · Coupler · Region) with metric rows, mini sparkline, "Why this?" link opening Agent drawer

**3. Materials & Process (`/materials`)**
- 4 large profile cards (Transmon, Si spin, Photonic, Neutral atom)
- Each: header with icon, key metrics grid (coherence T1/T2, gate fidelity 1Q/2Q, readout error, crosstalk sensitivity, fab yield, cryo complexity), radar chart mini, "Select profile" action
- Comparison table below toggled via tab

**4. Topology Explorer (`/topology`)**
- 4 topology cards (Square grid, Heavy-hex, Modular cluster, AI-optimized) with SVG graph viz
- Metric bars per card: Connectivity, SWAP overhead, Crosstalk penalty, QEC compatibility, Manufacturability
- "Compare selected" multi-select pinning topologies into a side-by-side table

**5. Workload Benchmarks (`/benchmarks`)**
- Workload selector chips: QAOA, VQE, QFT, Random circuit, QEC syndrome
- Baseline vs Optimized grouped bar charts (Recharts): SWAP count, Circuit depth, Estimated fidelity, Logical error risk, Routing congestion
- Mock heatmap of routing congestion per qubit region
- Summary delta cards

**6. Error Correction Advisor (`/qec`)**
- 4 code cards: Surface, Heavy-hex, Color, Repetition
- Each with required physical qubits, logical error estimate (scientific notation), code distance slider preview, syndrome overhead, compatibility score
- AI recommendation banner: "Recommended: Heavy-hex code under current profile" with reasoning excerpt

**7. Optimization Results (`/results`)**
- Headline metric strip: −28% SWAPs · −19% crosstalk · +12% fidelity · +22% manufacturability
- Side-by-side topology visualizations (Baseline grid vs Optimized) with synced hover
- Detailed comparison table
- Trend chart (mock convergence over iterations)
- Export Report button (mock — triggers toast "Report generated · q-architect-run-0427.pdf")

**8. AI Agent Reasoning (`/agent` + drawer on workspace)**
- Chat-style transcript of scientific reasoning steps
- Pre-seeded mock conversation including the canonical line: "Selected modular heavy-hex topology because it reduces long-range routing while maintaining QEC compatibility under the superconducting transmon profile."
- Step cards with collapsible "Evidence" (cites materials profile, topology metrics, benchmark deltas)
- Input box is decorative/disabled with placeholder "Ask the architect agent…" (no backend)

## Shared components

`src/components/qa/`
- `app-sidebar.tsx` — shadcn Sidebar wired to TanStack routes, active state via `useRouterState`
- `status-bar.tsx` — top bar (workload, budget, profile, status, action buttons)
- `metric-card.tsx`, `metric-row.tsx`, `delta-pill.tsx`
- `chip-canvas.tsx` — SVG qubit lattice with glow + selection
- `topology-graph.tsx` — small SVG graphs for each topology type
- `heatmap.tsx` — grid heatmap (cell color from value)
- `comparison-table.tsx`
- `agent-panel.tsx` — chat-style reasoning list, used in drawer + full page
- `radar-mini.tsx` — small radar via Recharts
- `progress-stat.tsx`

## Mock data

`src/data/`
- `materials.ts`, `topologies.ts`, `workloads.ts`, `qec-codes.ts`, `optimization-results.ts`, `agent-transcript.ts`, `chip-layout.ts`
- All typed; values realistic (e.g., T1 ~ 80–150 µs for transmon, gate fidelity 99.5%+, code distances 3/5/7)

## Charts / viz

- Recharts for bar/line/radar (already in shadcn `chart.tsx`)
- Custom SVG for chip canvas, topology graphs, heatmaps (no extra deps)

## Out of scope (v1)

- Real backend / live optimization
- Authentication
- Persistence (no DB; selections live in React state / URL search params where useful)
- Real PDF export (Export button shows a toast only)

## Verification

After build: load `/`, navigate through every route via sidebar, confirm canvas renders, charts paint, no console errors, dark theme consistent across pages, mobile sidebar collapses correctly.

import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Check, X, Sparkles } from "lucide-react";
import {
  CODES,
  type CodeId,
  type QubitType,
  deriveNoiseBudget,
  formatScientific,
} from "@/lib/noise-budget";
import { LatticeHeatmap } from "@/components/lattice-heatmap";

export const Route = createFileRoute("/design")({
  head: () => ({
    meta: [
      { title: "Design — ArQitec" },
      {
        name: "description",
        content:
          "Pick a target QEC code. ArQitec derives the noise budget and the doping pattern that hits it.",
      },
    ],
  }),
  component: DesignPage,
});

// Discrete options for the controls — distance must be odd.
const DISTANCES = [3, 5, 7, 9, 11, 13];
const LOG_PL_OPTIONS = [
  { v: 1e-3,  label: "1e-3"  },
  { v: 1e-5,  label: "1e-5"  },
  { v: 1e-6,  label: "1e-6"  },
  { v: 1e-8,  label: "1e-8"  },
  { v: 1e-10, label: "1e-10" },
  { v: 1e-15, label: "1e-15" },
];
const QUBITS: { v: QubitType; label: string; sub: string }[] = [
  { v: "transmon",  label: "Transmon",  sub: "fast gates, isotropic" },
  { v: "fluxonium", label: "Fluxonium", sub: "biased, long T1"  },
  { v: "cat",       label: "Cat qubit", sub: "engineered η = 500+" },
];
const ALGORITHMS = [
  "VQE 10 electrons",
  "Shor RSA-2048",
  "Quantum simulation",
  "Custom",
];

function DesignPage() {
  const [codeId, setCodeId] = useState<CodeId>("surface");
  const [d, setD] = useState(5);
  const [pL, setPL] = useState(1e-6);
  const [qubit, setQubit] = useState<QubitType>("transmon");
  const [algo, setAlgo] = useState(ALGORITHMS[0]);

  const budget = useMemo(
    () => deriveNoiseBudget(codeId, d, pL, qubit),
    [codeId, d, pL, qubit],
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60">
        <div className="mx-auto max-w-6xl flex items-center justify-between h-14 px-6">
          <Link to="/" className="flex items-baseline gap-2">
            <span className="h-syne text-base font-semibold">ArQitec</span>
            <span className="text-[10px] mono uppercase tracking-[0.18em] text-muted-foreground">
              v2 · design engine
            </span>
          </Link>
          <nav className="flex items-center gap-7 text-sm">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition">Home</Link>
            <Link to="/design" className="text-foreground">Design</Link>
            <Link to="/why" className="text-muted-foreground hover:text-foreground transition">Why</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="mono text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: "var(--cyan)" }}>
          <span className="inline-flex items-center gap-2">
            <Sparkles className="h-3 w-3" />
            specification engine
          </span>
        </div>
        <h1 className="h-syne text-3xl md:text-4xl font-semibold">
          Tell ArQitec the target. It builds the recipe.
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-10">
          {/* ─── INPUTS ──────────────────────────────────────────── */}
          <section className="lg:col-span-5 space-y-6">
            <SectionLabel num="01" title="Target QEC" />

            <Field label="QEC code">
              <select
                value={codeId}
                onChange={(e) => setCodeId(e.target.value as CodeId)}
                className="input-base"
              >
                {Object.values(CODES).map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Code distance d">
              <div className="flex gap-1">
                {DISTANCES.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setD(opt)}
                    className={`flex-1 py-2 text-sm rounded-md border transition ${
                      d === opt
                        ? "border-transparent text-white"
                        : "border-border/60 text-muted-foreground hover:text-foreground"
                    }`}
                    style={d === opt ? { background: "var(--cyan)" } : {}}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Target logical error rate">
              <div className="flex gap-1">
                {LOG_PL_OPTIONS.map((opt) => (
                  <button
                    key={opt.v}
                    onClick={() => setPL(opt.v)}
                    className={`flex-1 py-2 text-xs mono rounded-md border transition ${
                      pL === opt.v
                        ? "border-transparent text-white"
                        : "border-border/60 text-muted-foreground hover:text-foreground"
                    }`}
                    style={pL === opt.v ? { background: "var(--cyan)" } : {}}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </Field>

            <SectionLabel num="02" title="Platform" />

            <Field label="Qubit family">
              <div className="grid grid-cols-3 gap-2">
                {QUBITS.map((q) => (
                  <button
                    key={q.v}
                    onClick={() => setQubit(q.v)}
                    className={`text-left p-3 rounded-md border transition ${
                      qubit === q.v
                        ? "text-white"
                        : "border-border/60 hover:border-foreground/30"
                    }`}
                    style={qubit === q.v ? { background: "var(--cyan)", borderColor: "transparent" } : {}}
                  >
                    <div className="text-sm font-medium">{q.label}</div>
                    <div className={`text-[10px] uppercase tracking-[0.15em] mt-0.5 ${qubit === q.v ? "opacity-80" : "text-muted-foreground"}`}>
                      {q.sub}
                    </div>
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Target algorithm">
              <select
                value={algo}
                onChange={(e) => setAlgo(e.target.value)}
                className="input-base"
              >
                {ALGORITHMS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </Field>
          </section>

          {/* ─── DERIVED + HEATMAP ──────────────────────────────── */}
          <section className="lg:col-span-7 space-y-6">
            <SectionLabel num="03" title="Derived noise budget" />

            <div className="rounded-lg border border-border/60 bg-surface-1 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-muted-foreground">
                  Required physical-gate error
                </div>
                <div className="text-2xl font-semibold mono tabular-nums tracking-tight" style={{ color: "var(--cyan)" }}>
                  {formatScientific(budget.pPhysReq, 2)}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{budget.marginNote}</span>
                {" · "}
                code threshold {formatScientific(budget.code.thresholdP2q, 1)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <BudgetTile label="T1 floor"     value={`${budget.t1MinUs.toFixed(0)} μs`}     sub="energy relaxation" />
              <BudgetTile label="T2 floor"     value={`${budget.t2MinUs.toFixed(0)} μs`}     sub="dephasing"          />
              <BudgetTile label="η target"     value={`${budget.etaMin.toFixed(0)}+`}        sub="bias preference"    />
              <BudgetTile label="gate fidelity" value={`${(budget.gateFidelityReq * 100).toFixed(3)}%`} sub="per 2-q gate" />
            </div>

            <div className={`rounded-lg border p-4 flex items-center gap-3 ${budget.feasible ? "border-border/60 bg-surface-2" : "border-destructive/30 bg-destructive/5"}`}>
              {budget.feasible ? (
                <Check className="h-4 w-4 flex-shrink-0" style={{ color: "var(--cyan)" }} />
              ) : (
                <X className="h-4 w-4 text-destructive flex-shrink-0" />
              )}
              <div>
                <div className="text-sm font-medium">
                  {budget.feasible
                    ? "Feasibility: within the regime of present-day materials science"
                    : "Feasibility: outside today's measurable regime — choose smaller d or larger p_L"}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  For algorithm <span className="text-foreground">{algo}</span> on {QUBITS.find(q => q.v === qubit)?.label}.
                </div>
              </div>
            </div>

            <SectionLabel num="04" title="Junction lattice (5×5)" />

            <div className="rounded-lg border border-border/60 bg-surface-1 p-6 flex items-start gap-6">
              <LatticeHeatmap size={300} />
              <div className="text-sm text-muted-foreground leading-relaxed flex-1">
                <p>
                  The heatmap is the headline output: a doping pattern across the
                  junction lattice that — per the THRML Gibbs sampler + GNN
                  refinement — hits the noise budget on the left.
                </p>
                <p className="mt-3">
                  Phase A shows a static placeholder. Phase B wires it to the live
                  sampler so the pattern updates every iteration with running margins.
                </p>
                <div className="mt-5 inline-flex items-center gap-2 text-xs mono uppercase tracking-[0.18em] px-3 py-1.5 rounded-md" style={{ background: "var(--cyan-soft)", color: "var(--cyan-strong)" }}>
                  Phase A · static pattern
                </div>
              </div>
            </div>

            <SectionLabel num="05" title="Fabrication recipe" />

            <div className="rounded-lg border border-border/60 bg-surface-1 p-5 font-mono text-xs leading-relaxed">
              <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">
                draft recipe — auto-generated from the budget above
              </div>
              <RecipeRow k="Junction barrier" v="AlOₓ · 12% N doping · 2.3 nm" />
              <RecipeRow k="SC film"           v="α-Ta on sapphire" />
              <RecipeRow k="UBM layer"         v="NbN · 15 nm" />
              <RecipeRow k="Interconnect"      v="Nb-Nb direct bond" />
              <RecipeRow k="Deposition"        v="ALD · 220 °C · 0.7 mTorr N₂" />
              <div className="text-[10px] mt-4 text-muted-foreground" style={{ color: "var(--cyan-strong)" }}>
                Phase A recipe is illustrative · Phase C wires the actual EM solver.
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

// ─── Small UI helpers ──────────────────────────────────────────────────

function SectionLabel({ num, title }: { num: string; title: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="mono text-[10px] uppercase tracking-[0.3em]" style={{ color: "var(--cyan)" }}>
        {num}
      </span>
      <span className="mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        {title}
      </span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2 block">
        {label}
      </label>
      {children}
    </div>
  );
}

function BudgetTile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-surface-1 px-4 py-3">
      <div className="mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </div>
      <div className="text-xl font-semibold mt-1 tabular-nums tracking-tight">
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-0.5">
        {sub}
      </div>
    </div>
  );
}

function RecipeRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-border/40 last:border-b-0">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-foreground">{v}</span>
    </div>
  );
}

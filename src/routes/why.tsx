import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/why")({
  head: () => ({
    meta: [
      { title: "Why — ArQitec" },
      {
        name: "description",
        content:
          "Why an inverse-design engine for QEC × material is the right shape of tool for the next 5 years of superconducting qubit work.",
      },
    ],
  }),
  component: WhyPage,
});

const STEPS = [
  {
    n: "01",
    title: "Pick the target QEC code + distance + target logical error rate",
    body: "The user starts from what they actually want: 'Surface code, d=5, hitting p_L = 1e-6.' This is the shape of every fault-tolerance plan in the field today.",
  },
  {
    n: "02",
    title: "Derive the noise budget",
    body: "Invert the threshold formula p_L ≈ A · (p_phys / p_th)^((d+1)/2) to back out the physical-gate error rate the chip has to fall under. Then translate that into per-axis floors: T1, T2, η, gate fidelity.",
  },
  {
    n: "03",
    title: "Map noise budget → material constraints",
    body: "Search the existing materials catalogue (161 materials × 8 roles) for combinations that satisfy each axis. The fitness-scoring kernel from V1 lives here — same math, inverted intent.",
  },
  {
    n: "04",
    title: "Sample the junction lattice (THRML Gibbs)",
    body: "Run Gibbs sampling over the 5×5 doping-configuration space, conditioned on the noise budget. Each step proposes a candidate dopant placement and accepts or rejects based on a learned acceptance ratio.",
  },
  {
    n: "05",
    title: "Refine with the equivariant GNN",
    body: "An equivariant graph neural network takes a candidate doping pattern + the noise budget and predicts T1 / T2 / η. Trained against experimental data; refines toward configurations that hit all constraints.",
  },
  {
    n: "06",
    title: "Validate with the 3D EM mesh",
    body: "Real geometry → real microwave simulation. Verifies the GNN's predictions on a high-fidelity solver (HFSS / COMSOL / Sonnet). The heavy step — only run once per converged candidate.",
  },
  {
    n: "07",
    title: "Iterate until every constraint is green",
    body: "Steps 04–06 in a loop. Each iteration streams the updated heatmap + the running margins to the UI. When everything passes, output the fabrication recipe — barrier thickness, N2 partial pressure, deposition parameters.",
  },
];

const SOURCES = [
  { t: "ECZoo — Error Correction Zoo",                 u: "https://errorcorrectionzoo.org/" },
  { t: "Stim — fast stabilizer simulator",             u: "https://github.com/quantumlib/Stim" },
  { t: "PyMatching — MWPM decoder",                    u: "https://github.com/oscarhiggott/PyMatching" },
  { t: "TQEC — 3D model → circuit",                    u: "https://github.com/tqec/tqec" },
  { t: "Qiskit QEC — heavy-hex tooling",               u: "https://github.com/qiskit-community/qiskit-qec" },
  { t: "Bonilla Ataides — XZZX surface code (2021)",   u: "https://arxiv.org/abs/2009.07851" },
  { t: "Fowler et al. — Surface code fault tolerance", u: "https://arxiv.org/abs/1208.0928" },
  { t: "Place et al. — Tantalum on sapphire (2021)",   u: "https://arxiv.org/abs/2003.00024" },
];

function WhyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60">
        <div className="mx-auto max-w-6xl flex items-center justify-between h-14 px-6">
          <Link to="/" className="flex items-baseline gap-2">
            <span className="text-base font-semibold tracking-tight">ArQitec</span>
            <span className="text-[10px] mono uppercase tracking-[0.18em] text-muted-foreground">v2 · design engine</span>
          </Link>
          <nav className="flex items-center gap-7 text-sm">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition">Home</Link>
            <Link to="/design" className="text-muted-foreground hover:text-foreground transition">Design</Link>
            <Link to="/why" className="text-foreground">Why</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-16 space-y-20">
        <section>
          <div className="mono text-[10px] uppercase tracking-[0.3em] mb-4" style={{ color: "var(--cyan)" }}>
            inverse design — why
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-[1.1]">
            QEC codes assume hardware that doesn't exist yet.
          </h1>
          <p className="mt-6 text-base md:text-lg text-muted-foreground leading-relaxed max-w-3xl">
            Picking an error-correcting code for a real superconducting qubit
            isn't a textbook exercise. The textbook picks the surface code,
            assumes depolarizing noise, prints a threshold. The chip in the
            fridge has a specific stack — silicon-on-sapphire, tantalum traces,
            Al-AlOₓ-Al junction — that doesn't match the textbook assumption.
          </p>
          <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed max-w-3xl">
            ArQitec runs the question backward.
            <span className="text-foreground font-medium"> Start from the code you want.
            Get the material that supports it.</span>
          </p>
        </section>

        <section>
          <div className="mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-6">
            the seven-step pipeline
          </div>
          <ol className="space-y-6">
            {STEPS.map((s) => (
              <li key={s.n} className="flex gap-5">
                <div className="flex-shrink-0 mono text-sm tracking-tight w-10" style={{ color: "var(--cyan)" }}>
                  {s.n}
                </div>
                <div>
                  <div className="text-base font-semibold tracking-tight">{s.title}</div>
                  <p className="text-sm text-muted-foreground leading-relaxed mt-1.5">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <div className="mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-6">
            sources + tooling
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SOURCES.map((s) => (
              <li key={s.u}>
                <a
                  href={s.u}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-start justify-between gap-3 rounded-md border border-border/60 bg-surface-1 px-4 py-3 hover:border-foreground/30 transition"
                >
                  <span className="text-sm">{s.t}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground flex-shrink-0 mt-0.5" />
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-t border-border/60 pt-10 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-lg font-semibold tracking-tight">Want to drive it?</div>
            <div className="text-sm text-muted-foreground mt-1">
              The designer accepts your target right now.
            </div>
          </div>
          <Link
            to="/design"
            className="inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition hover:opacity-90"
            style={{ background: "var(--cyan)", color: "#fff" }}
          >
            Open the designer
          </Link>
        </section>
      </main>
    </div>
  );
}

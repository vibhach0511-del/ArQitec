import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { HeroLattice } from "@/components/hero-lattice";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ArQitec — design chips to a QEC target" },
      {
        name: "description",
        content:
          "Pick a target QEC code. Get a doping pattern, predicted T1 / T2 / η, and a fabrication recipe.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60">
        <div className="mx-auto max-w-6xl flex items-center justify-between h-14 px-6">
          <Link to="/" className="flex items-baseline gap-2">
            <span className="h-syne text-base font-semibold">ArQitec</span>
            <span className="text-[10px] mono uppercase tracking-[0.18em] text-muted-foreground">
              v2
            </span>
          </Link>
          <nav className="flex items-center gap-7 text-sm">
            <Link to="/" className="text-foreground">Home</Link>
            <Link to="/design" className="text-muted-foreground hover:text-foreground transition">Design</Link>
            <Link to="/why" className="text-muted-foreground hover:text-foreground transition">Why</Link>
          </nav>
        </div>
      </header>

      <main>
        {/* HERO — headline + the live lattice. That's it. */}
        <section className="mx-auto max-w-6xl px-6 pt-20 pb-16">
          <div className="text-center max-w-3xl mx-auto">
            <div className="mono text-[10px] uppercase tracking-[0.32em] mb-5" style={{ color: "var(--cyan)" }}>
              junction lattice · 5 × 5 · live sampler
            </div>
            <h1 className="h-syne text-5xl md:text-7xl font-semibold leading-[0.98]">
              Design chips to a
              <br />
              <span className="text-glow-cyan">QEC target.</span>
            </h1>
            <p className="mt-7 text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Pick the code. Pick the distance. Pick the logical error rate.
              ArQitec returns the doping pattern, the predicted T1 / T2 / η, and a fabrication recipe.
            </p>
          </div>

          <div className="mt-14 flex flex-col items-center">
            <HeroLattice />
          </div>

          <div className="mt-12 flex items-center justify-center gap-5">
            <Link
              to="/design"
              className="inline-flex items-center gap-2 rounded-md px-6 py-3 text-sm font-medium transition hover:opacity-90"
              style={{ background: "var(--cyan)", color: "#fff" }}
            >
              Design a chip <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/why"
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:opacity-70 transition"
            >
              How it works
            </Link>
          </div>
        </section>

        {/* WHAT YOU GET OUT — one tight strip, three things, no flourish */}
        <section className="border-t border-border/60 bg-surface-2">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-8 text-center">
              what comes out
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <OutputItem
                num="01"
                title="Doping pattern"
                body="A 5×5 placement of dopant atoms across the junction lattice — the headline output, what the heatmap above shows."
              />
              <OutputItem
                num="02"
                title="Predicted T1 / T2 / η"
                body="Coherence times and noise bias the chip is expected to hit. Each value graded against the QEC target's threshold."
              />
              <OutputItem
                num="03"
                title="Fabrication recipe"
                body="Barrier thickness, N₂ partial pressure, deposition temperature. What an engineer actually takes to the cleanroom."
              />
            </div>
          </div>
        </section>

        <footer className="border-t border-border/60">
          <div className="mx-auto max-w-6xl px-6 py-8 flex items-center justify-between text-xs text-muted-foreground mono uppercase tracking-[0.18em]">
            <span>ArQitec · hackathon 2026</span>
            <span>v2.0.0-α</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

function OutputItem({ num, title, body }: { num: string; title: string; body: string }) {
  return (
    <div>
      <div className="mono text-[10px] uppercase tracking-[0.3em] mb-2" style={{ color: "var(--cyan)" }}>
        {num}
      </div>
      <div className="text-base font-semibold tracking-tight mb-2">{title}</div>
      <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}

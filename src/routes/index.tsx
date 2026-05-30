import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Network, ShieldCheck, FlaskConical, CircuitBoard, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Q-Architect — Quantum Chip Co-Design" },
      { name: "description", content: "AI-powered quantum chip architecture co-design for semiconductor R&D teams. Explore materials, topologies, error-correction, and tapeout-readiness before silicon." },
      { property: "og:title", content: "Q-Architect — Quantum Chip Co-Design" },
      { property: "og:description", content: "AI + quantum optimizer for semiconductor R&D teams designing quantum chips." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <BackgroundLattice />
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-cyan/30 to-violet/30 border border-cyan/40 qa-glow-cyan">
            <CircuitBoard className="h-4 w-4 text-cyan" />
          </div>
          <div className="leading-none">
            <div className="text-sm font-semibold tracking-tight">Q-Architect</div>
            <div className="mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">co-design platform</div>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-6 mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          <a className="hover:text-foreground transition" href="#mission">Mission</a>
          <a className="hover:text-foreground transition" href="#capabilities">Capabilities</a>
          <a className="hover:text-foreground transition" href="#stack">Stack</a>
        </nav>
        <Link to="/workspace" className="inline-flex items-center gap-1.5 rounded-md bg-cyan px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-cyan/90 transition">
          Open Workspace <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </header>

      <section id="mission" className="relative z-10 mx-auto max-w-7xl px-6 pt-16 pb-24">
        <div className="mono text-[10px] uppercase tracking-[0.3em] text-cyan mb-5">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-cyan animate-pulse" />
            qa · build 0.9.4 · semiconductor R&D
          </span>
        </div>
        <h1 className="text-5xl md:text-7xl font-semibold tracking-tight leading-[1.02] max-w-5xl">
          AI-powered quantum chip <br />
          <span className="bg-gradient-to-r from-cyan via-neon-blue to-violet bg-clip-text text-transparent">
            architecture co-design
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-base text-muted-foreground leading-relaxed">
          Q-Architect helps semiconductor R&D teams explore qubit materials, layout topologies, error-correction strategies, and manufacturability — all before tapeout. Built for chip architects who think in lattice constants and code distances.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link to="/workspace" className="inline-flex items-center gap-2 rounded-md bg-cyan px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-cyan/90 transition">
            Open Workspace <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/results" className="inline-flex items-center gap-2 rounded-md border border-border/70 bg-surface-2/50 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface-3/70 transition">
            View Demo Results
          </Link>
          <Link to="/agent" className="inline-flex items-center gap-2 px-3 py-2 text-xs mono uppercase tracking-[0.18em] text-violet hover:text-violet/80 transition">
            <Sparkles className="h-3.5 w-3.5" /> See AI reasoning trace
          </Link>
        </div>

        <div id="capabilities" className="mt-20 grid gap-4 md:grid-cols-3">
          <ValueCard
            icon={<Network className="h-5 w-5" />}
            eyebrow="01 · Topology"
            title="Topology Optimization"
            body="Search square grids, heavy-hex, modular clusters, and learned hybrids. Minimize SWAP overhead under fab-aware constraints."
            accent="cyan"
          />
          <ValueCard
            icon={<ShieldCheck className="h-5 w-5" />}
            eyebrow="02 · QEC"
            title="Error-Correction Readiness"
            body="Score surface, heavy-hex, and color codes against the chosen process. Quantify logical error and physical-qubit overhead."
            accent="violet"
          />
          <ValueCard
            icon={<FlaskConical className="h-5 w-5" />}
            eyebrow="03 · DSE"
            title="Materials-Aware DSE"
            body="Co-design across transmon, Si-spin, photonic, and neutral-atom profiles. Crosstalk, yield, and cryo complexity in one loop."
            accent="green"
          />
        </div>

        <div id="stack" className="mt-20 rounded-lg border border-border/60 bg-surface-1/60 backdrop-blur p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <div className="mono text-[10px] uppercase tracking-[0.18em] text-cyan">trusted by R&D pre-tapeout teams</div>
              <div className="mt-1 text-sm text-muted-foreground">Compatible with major fab process kits and quantum SDKs.</div>
            </div>
            <div className="mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">QA · co-design v0.9.4</div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-x-6 gap-y-3 mono text-[11px] text-muted-foreground/80 uppercase tracking-[0.16em]">
            {["Qiskit", "Cirq", "PennyLane", "TKET", "OpenQASM 3", "Stim", "Cadence", "Synopsys", "GDSII", "IBM Quantum", "Pasqal", "Quantinuum"].map(s => (
              <span key={s} className="border-l border-border/60 pl-3">{s}</span>
            ))}
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-border/60 bg-surface-1/40">
        <div className="mx-auto max-w-7xl px-6 py-5 flex flex-wrap items-center justify-between gap-3 mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          <span>© 2026 Q-Architect Labs · Confidential pre-tapeout build</span>
          <span>commit 9f2c1a · region: us-west-2 · region replica nominal</span>
        </div>
      </footer>
    </div>
  );
}

function ValueCard({ icon, eyebrow, title, body, accent }: { icon: React.ReactNode; eyebrow: string; title: string; body: string; accent: "cyan" | "violet" | "green" }) {
  const ring = { cyan: "border-cyan/30 bg-cyan/5", violet: "border-violet/30 bg-violet/5", green: "border-neon-green/30 bg-neon-green/5" }[accent];
  const text = { cyan: "text-cyan", violet: "text-violet", green: "text-neon-green" }[accent];
  return (
    <div className="group relative rounded-lg border border-border/60 bg-surface-1/60 backdrop-blur p-5 hover:border-border transition">
      <div className={`inline-flex items-center justify-center h-10 w-10 rounded-md border ${ring} ${text} mb-4`}>{icon}</div>
      <div className={`mono text-[10px] uppercase tracking-[0.22em] ${text} mb-1.5`}>{eyebrow}</div>
      <div className="text-lg font-semibold text-foreground">{title}</div>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
      <div className="mt-4 flex items-center justify-between mono text-[10px] text-muted-foreground/70 uppercase tracking-[0.18em] border-t border-border/40 pt-3">
        <span>module</span>
        <span className={text}>operational</span>
      </div>
    </div>
  );
}

function BackgroundLattice() {
  return (
    <>
      <div className="absolute inset-0 qa-grid-bg opacity-30" />
      <div className="absolute -top-32 -right-32 h-[480px] w-[480px] rounded-full bg-cyan/10 blur-3xl" />
      <div className="absolute top-1/3 -left-32 h-[420px] w-[420px] rounded-full bg-violet/10 blur-3xl" />
      <svg className="absolute inset-0 h-full w-full opacity-[0.08] pointer-events-none" viewBox="0 0 1400 900">
        {Array.from({ length: 28 }).map((_, r) =>
          Array.from({ length: 44 }).map((_, c) => {
            if ((r + c) % 3 === 2) return null;
            const x = 30 + c * 32 + (r % 2 ? 16 : 0);
            const y = 30 + r * 30;
            return <circle key={`${r}-${c}`} cx={x} cy={y} r={1.8} fill="oklch(0.82 0.16 200)" />;
          })
        )}
      </svg>
    </>
  );
}

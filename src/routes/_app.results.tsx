import { createFileRoute } from "@tanstack/react-router";
import { HEADLINE_DELTAS, CONVERGENCE, TOPOLOGIES } from "@/data/mock";
import { Panel, SectionHeader } from "@/components/qa/primitives";
import { TopologyGraph } from "@/components/qa/topology-graph";
import { ArrowDownRight, ArrowUpRight, FileDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/results")({
  head: () => ({ meta: [{ title: "Optimization Results — Q-Architect" }, { name: "description", content: "Headline deltas, convergence trend, and baseline vs optimized topology side-by-side." }] }),
  component: ResultsPage,
});

function ResultsPage() {
  const base = TOPOLOGIES[0];
  const opt = TOPOLOGIES[3];

  return (
    <div className="p-6">
      <SectionHeader
        eyebrow="Optimization Run · qa-run-0427"
        title="Baseline vs Q-Architect optimized"
        description="Final headline deltas across SWAPs, crosstalk, fidelity, and manufacturability — for the QAOA-64 / SC-Transmon profile."
        action={
          <button onClick={() => toast.success("Report exported", { description: "q-architect-run-0427.pdf · 18 pages" })}
            className="inline-flex items-center gap-1.5 rounded-md bg-cyan px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-cyan/90 transition mono uppercase tracking-[0.14em]">
            <FileDown className="h-3.5 w-3.5" /> Export Report
          </button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {HEADLINE_DELTAS.map(d => (
          <div key={d.label} className="rounded-lg border border-border/60 bg-gradient-to-br from-surface-1 to-surface-2/60 p-4">
            <div className="mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{d.label}</div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="mono text-3xl font-semibold text-neon-green tabular-nums">{d.value}</span>
              {d.direction === "down" ? <ArrowDownRight className="h-5 w-5 text-neon-green" /> : <ArrowUpRight className="h-5 w-5 text-neon-green" />}
            </div>
            <div className="mt-1 mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">vs baseline grid</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
        <Panel title="Baseline" subtitle={`${base.name} · degree ${base.degree}`}>
          <div className="p-3">
            <TopologyGraph id={base.id} accent="violet" height={260} />
          </div>
          <div className="border-t border-border/60 px-4 py-2.5 mono text-[11px] grid grid-cols-3 gap-2 text-muted-foreground">
            <span>SWAP {base.swap_overhead}</span>
            <span>Crosstalk {base.crosstalk}</span>
            <span>QEC {base.qec_compat}</span>
          </div>
        </Panel>
        <Panel title="Optimized" subtitle={`${opt.name} · degree ${opt.degree}`}>
          <div className="p-3">
            <TopologyGraph id={opt.id} accent="cyan" height={260} />
          </div>
          <div className="border-t border-border/60 px-4 py-2.5 mono text-[11px] grid grid-cols-3 gap-2 text-cyan">
            <span>SWAP {opt.swap_overhead}</span>
            <span>Crosstalk {opt.crosstalk}</span>
            <span>QEC {opt.qec_compat}</span>
          </div>
        </Panel>
      </div>

      <Panel title="Convergence trend" subtitle="32 iterations · cost vs manufacturability">
        <div className="p-3 h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={CONVERGENCE} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid stroke="oklch(0.32 0.03 255 / 0.3)" vertical={false} />
              <XAxis dataKey="iter" tick={{ fill: "oklch(0.68 0.03 250)", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "oklch(0.68 0.03 250)", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "oklch(0.22 0.025 252)", border: "1px solid oklch(0.3 0.03 255 / 0.6)", borderRadius: 8, fontFamily: "JetBrains Mono", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontFamily: "JetBrains Mono", fontSize: 11 }} />
              <Line type="monotone" dataKey="cost" stroke="oklch(0.7 0.21 295)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="manufacturability" stroke="oklch(0.82 0.16 200)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );
}

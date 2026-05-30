import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { WORKLOADS, CONGESTION_BASELINE, CONGESTION_OPTIMIZED } from "@/data/mock";
import { Panel, SectionHeader, MetricCard } from "@/components/qa/primitives";
import { Heatmap } from "@/components/qa/heatmap";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export const Route = createFileRoute("/_app/benchmarks")({
  head: () => ({ meta: [{ title: "Workload Benchmarks — Q-Architect" }, { name: "description", content: "QAOA, VQE, QFT, random circuit, and QEC syndrome benchmarks baseline vs optimized." }] }),
  component: BenchmarksPage,
});

function BenchmarksPage() {
  const [active, setActive] = useState(WORKLOADS[0].id);
  const w = WORKLOADS.find(x => x.id === active)!;

  const barData = [
    { metric: "SWAP", baseline: w.baseline.swap, optimized: w.optimized.swap },
    { metric: "Depth", baseline: w.baseline.depth, optimized: w.optimized.depth },
    { metric: "Fidelity ×10", baseline: w.baseline.fidelity * 10, optimized: w.optimized.fidelity * 10 },
    { metric: "LogErr ×1k", baseline: w.baseline.logErr * 1000, optimized: w.optimized.logErr * 1000 },
    { metric: "Congestion ×100", baseline: w.baseline.congestion * 100, optimized: w.optimized.congestion * 100 },
  ];

  const pct = (a: number, b: number) => `${(((b - a) / a) * 100).toFixed(1)}%`;

  return (
    <div className="p-6">
      <SectionHeader
        eyebrow="Workload Benchmark"
        title="Baseline vs Q-Architect optimized"
        description="Synthetic mock benchmarks. Select a workload to compare SWAPs, depth, fidelity, logical error, and routing congestion."
      />
      <div className="flex flex-wrap gap-1.5 mb-4">
        {WORKLOADS.map(wl => (
          <button key={wl.id} onClick={() => setActive(wl.id)}
            className={`mono text-[11px] uppercase tracking-[0.14em] rounded border px-2.5 py-1.5 transition ${active === wl.id ? "border-cyan/50 bg-cyan/10 text-cyan" : "border-border/60 text-muted-foreground hover:text-foreground"}`}>
            {wl.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <MetricCard label="SWAP count" value={w.optimized.swap} delta={pct(w.baseline.swap, w.optimized.swap)} tone="good" hint={`base ${w.baseline.swap}`} />
        <MetricCard label="Circuit depth" value={w.optimized.depth} delta={pct(w.baseline.depth, w.optimized.depth)} tone="good" hint={`base ${w.baseline.depth}`} />
        <MetricCard label="Est. fidelity" value={w.optimized.fidelity.toFixed(1)} unit="%" delta={`+${(w.optimized.fidelity - w.baseline.fidelity).toFixed(1)}`} tone="good" />
        <MetricCard label="Logical err" value={w.optimized.logErr.toExponential(2)} delta={pct(w.baseline.logErr, w.optimized.logErr)} tone="good" />
        <MetricCard label="Congestion" value={w.optimized.congestion.toFixed(2)} delta={pct(w.baseline.congestion, w.optimized.congestion)} tone="good" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Panel className="xl:col-span-2" title="Baseline vs Optimized" subtitle={w.name}>
          <div className="p-3 h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid stroke="oklch(0.32 0.03 255 / 0.3)" vertical={false} />
                <XAxis dataKey="metric" tick={{ fill: "oklch(0.68 0.03 250)", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "oklch(0.68 0.03 250)", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "oklch(0.22 0.025 252)", border: "1px solid oklch(0.3 0.03 255 / 0.6)", borderRadius: 8, fontFamily: "JetBrains Mono", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontFamily: "JetBrains Mono", fontSize: 11 }} />
                <Bar dataKey="baseline" fill="oklch(0.7 0.21 295)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="optimized" fill="oklch(0.82 0.16 200)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Routing congestion map" subtitle="Per-region traffic (mock)">
          <div className="p-3 space-y-3">
            <Heatmap cells={CONGESTION_BASELINE} title="Baseline · square grid" accent="violet" />
            <Heatmap cells={CONGESTION_OPTIMIZED} title="Optimized · Q-Architect" accent="cyan" />
          </div>
        </Panel>
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { QUANTUM_WORKLOADS, getTopology } from "@/lib/qa/data";
import { estimateRouting } from "@/lib/qa/engine";
import { Panel, SectionHeader, MetricCard } from "@/components/qa/primitives";
import { Heatmap, type CongestionCell } from "@/components/qa/heatmap";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useQA } from "@/lib/qa/store";
import type { WorkloadId } from "@/lib/qa/types";

export const Route = createFileRoute("/_app/benchmarks")({
  head: () => ({ meta: [{ title: "Workload Benchmarks — ArQiteQ" }, { name: "description", content: "QAOA, VQE, QFT, random circuit, and QEC syndrome benchmarks baseline vs optimized." }] }),
  component: BenchmarksPage,
});

function buildCongestion(level: number): CongestionCell[] {
  const cells: CongestionCell[] = [];
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 12; x++) {
      const cx = 5.5, cy = 3.5;
      const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      const v = Math.max(0.04, Math.min(1, level * (1.15 - d * 0.12) + Math.sin(x * 0.7 + y) * 0.06));
      cells.push({ x, y, v });
    }
  return cells;
}

function BenchmarksPage() {
  const qa = useQA();
  const benchmarks = qa.result.benchmarks;

  const barData = useMemo(
    () =>
      benchmarks.map((b) => ({
        metric: b.label,
        baseline: 100,
        optimized: b.baseline === 0 ? 0 : Math.round((b.optimized / b.baseline) * 100),
      })),
    [benchmarks],
  );

  const baseCongestion = useMemo(() => estimateRouting(getTopology("square"), qa.workload).congestion, [qa.workload]);
  const optCongestion = qa.result.routing.congestion;

  const get = (key: string) => benchmarks.find((b) => b.key === key)!;
  const delta = (key: string) => {
    const b = get(key);
    const change = ((b.optimized - b.baseline) / Math.abs(b.baseline || 1)) * 100;
    const improved = b.betterDirection === "lower" ? change < 0 : change > 0;
    return { text: `${change > 0 ? "+" : "−"}${Math.abs(change).toFixed(0)}%`, tone: improved ? ("good" as const) : ("warn" as const) };
  };

  return (
    <div className="p-6">
      <SectionHeader
        eyebrow="Workload Benchmark"
        title="Baseline vs ArQiteQ optimized"
        description="Square-grid baseline vs the current topology. Select a workload to recompute SWAPs, depth, fidelity, crosstalk, and routing congestion."
      />
      <div className="flex flex-wrap gap-1.5 mb-4">
        {QUANTUM_WORKLOADS.map((wl) => (
          <button
            key={wl.id}
            onClick={() => qa.setWorkload(wl.id as WorkloadId)}
            className={`mono text-[11px] uppercase tracking-[0.14em] rounded border px-2.5 py-1.5 transition ${qa.config.workloadId === wl.id ? "border-cyan/50 bg-cyan/10 text-cyan" : "border-border/60 text-muted-foreground hover:text-foreground"}`}
          >
            {wl.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <MetricCard label="SWAP count" value={get("swap").optimized} delta={delta("swap").text} tone={delta("swap").tone} hint={`base ${get("swap").baseline}`} />
        <MetricCard label="Routed depth" value={get("depth").optimized} delta={delta("depth").text} tone={delta("depth").tone} hint={`base ${get("depth").baseline}`} />
        <MetricCard label="Fidelity score" value={get("fidelity").optimized} unit="/100" delta={delta("fidelity").text} tone={delta("fidelity").tone} />
        <MetricCard label="Crosstalk score" value={get("crosstalk").optimized} unit="/100" delta={delta("crosstalk").text} tone={delta("crosstalk").tone} />
        <MetricCard label="Arch. score" value={get("score").optimized} unit="/100" delta={delta("score").text} tone={delta("score").tone} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Panel className="xl:col-span-2" title="Baseline vs Optimized" subtitle={`${qa.workload.name} · indexed to baseline = 100`}>
          <div className="p-3 h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid stroke="oklch(0.32 0.03 255 / 0.3)" vertical={false} />
                <XAxis dataKey="metric" tick={{ fill: "oklch(0.68 0.03 250)", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} interval={0} angle={-12} textAnchor="end" height={50} />
                <YAxis tick={{ fill: "oklch(0.68 0.03 250)", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "oklch(0.22 0.025 252)", border: "1px solid oklch(0.3 0.03 255 / 0.6)", borderRadius: 8, fontFamily: "JetBrains Mono", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontFamily: "JetBrains Mono", fontSize: 11 }} />
                <Bar dataKey="baseline" fill="oklch(0.7 0.21 295)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="optimized" fill="oklch(0.82 0.16 200)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Routing congestion map" subtitle="Per-region traffic (modeled)">
          <div className="p-3 space-y-3">
            <Heatmap cells={buildCongestion(baseCongestion)} title="Baseline · square grid" accent="violet" />
            <Heatmap cells={buildCongestion(optCongestion)} title={`Optimized · ${qa.topology.name}`} accent="cyan" />
          </div>
        </Panel>
      </div>
    </div>
  );
}

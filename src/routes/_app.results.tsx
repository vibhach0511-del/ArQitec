import { createFileRoute } from "@tanstack/react-router";
import { getTopology } from "@/lib/qa/data";
import { OPTIMIZATION_STEPS } from "@/lib/qa/engine";
import { Panel, SectionHeader } from "@/components/qa/primitives";
import { TopologyGraph } from "@/components/qa/topology-graph";
import { ArrowDownRight, ArrowUpRight, FileDown, FileJson, Check, Loader2, Circle } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useQA } from "@/lib/qa/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/results")({
  head: () => ({ meta: [{ title: "Optimization Results — ArQiteQ" }, { name: "description", content: "Headline deltas, baseline comparison, convergence trend, and report export." }] }),
  component: ResultsPage,
});

function ResultsPage() {
  const qa = useQA();
  const r = qa.hasRun ? qa.committed : qa.result;
  const baselineTopo = getTopology("square");

  const baselineChart = r.baselines.map((b) => ({
    method: b.method.replace(" topology", "").replace("-", "-\n"),
    score: b.architectureScore,
    recommended: b.isRecommended,
  }));

  return (
    <div className="p-6">
      <SectionHeader
        eyebrow={`Optimization Run · ${qa.hasRun ? "converged" : "live preview"}`}
        title="Baseline vs ArQiteQ optimized"
        description={`Headline deltas, five-method baseline comparison, and convergence for ${r.workload.name} on the ${r.material.short} profile.`}
        action={
          <div className="flex items-center gap-2">
            <button onClick={() => qa.exportReport("json")}
              className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-surface-2/50 px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-3/70 transition mono uppercase tracking-[0.14em]">
              <FileJson className="h-3.5 w-3.5" /> JSON
            </button>
            <button onClick={() => qa.exportReport("markdown")}
              className="inline-flex items-center gap-1.5 rounded-md bg-cyan px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-cyan/90 transition mono uppercase tracking-[0.14em]">
              <FileDown className="h-3.5 w-3.5" /> Markdown report
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {r.headlineDeltas.map((d) => {
          const tone = d.tone === "good" ? "text-neon-green" : d.tone === "warn" ? "text-amber" : "text-muted-foreground";
          const Icon = d.direction === "down" ? ArrowDownRight : ArrowUpRight;
          return (
            <div key={d.label} className="rounded-lg border border-border/60 bg-gradient-to-br from-surface-1 to-surface-2/60 p-4">
              <div className="mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{d.label}</div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className={cn("mono text-3xl font-semibold tabular-nums", tone)}>{d.value}</span>
                <Icon className={cn("h-5 w-5", tone)} />
              </div>
              <div className="mt-1 mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">vs square-grid baseline</div>
            </div>
          );
        })}
      </div>

      {/* Run progress (Requirement 9) */}
      <Panel className="mb-4" title="Optimization pipeline" subtitle={qa.status === "running" ? "running…" : qa.hasRun ? "converged" : "idle · press Run Optimization"}>
        <div className="p-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {OPTIMIZATION_STEPS.map((s, i) => {
            const done = qa.status === "converged" || (qa.status === "running" && i < qa.activeStep);
            const active = qa.status === "running" && i === qa.activeStep;
            return (
              <div key={s.id} className={cn("flex items-start gap-2.5 rounded-md border px-3 py-2.5 transition", active ? "border-cyan/50 bg-cyan/5" : "border-border/60 bg-surface-2/30")}>
                <div className="mt-0.5">
                  {done ? <Check className="h-4 w-4 text-neon-green" /> : active ? <Loader2 className="h-4 w-4 text-cyan animate-spin" /> : <Circle className="h-4 w-4 text-muted-foreground/50" />}
                </div>
                <div className="min-w-0">
                  <div className="mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{String(i + 1).padStart(2, "0")}</div>
                  <div className="text-sm text-foreground">{s.label}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{s.detail}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
        <Panel title="Baseline comparison" subtitle="Architecture score across five methods">
          <div className="p-3 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={baselineChart} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid stroke="oklch(0.32 0.03 255 / 0.3)" vertical={false} />
                <XAxis dataKey="method" tick={{ fill: "oklch(0.68 0.03 250)", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} interval={0} />
                <YAxis domain={[0, 100]} tick={{ fill: "oklch(0.68 0.03 250)", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "oklch(0.22 0.025 252)", border: "1px solid oklch(0.3 0.03 255 / 0.6)", borderRadius: 8, fontFamily: "JetBrains Mono", fontSize: 12 }} cursor={{ fill: "oklch(0.3 0.03 255 / 0.15)" }} />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {baselineChart.map((d, i) => (
                    <Cell key={i} fill={d.recommended ? "oklch(0.82 0.16 200)" : "oklch(0.7 0.21 295)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Convergence trend" subtitle="32 iterations · cost vs manufacturability">
          <div className="p-3 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={r.convergence} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
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

      <Panel className="mb-4" title="Baseline methods" subtitle="Lower SWAPs and higher scores are better">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mono">
              <tr className="border-b border-border/60">
                <th className="text-left px-4 py-2.5">Method</th>
                <th className="text-right px-4 py-2.5">Arch. score</th>
                <th className="text-right px-4 py-2.5">SWAPs</th>
                <th className="text-right px-4 py-2.5">Fidelity</th>
                <th className="text-right px-4 py-2.5">Crosstalk</th>
                <th className="text-right px-4 py-2.5">Mfg.</th>
              </tr>
            </thead>
            <tbody className="mono tabular-nums">
              {r.baselines.map((b) => (
                <tr key={b.method} className={cn("border-b border-border/40 last:border-0 hover:bg-surface-2/40", b.isRecommended && "bg-cyan/5")}>
                  <td className="px-4 py-2.5 text-foreground flex items-center gap-2">
                    {b.isRecommended && <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan" />}
                    {b.method}
                  </td>
                  <td className={cn("px-4 py-2.5 text-right", b.isRecommended ? "text-cyan font-semibold" : "text-foreground")}>{b.architectureScore}</td>
                  <td className="px-4 py-2.5 text-right text-amber">{b.swapCount}</td>
                  <td className="px-4 py-2.5 text-right">{b.fidelityScore}</td>
                  <td className="px-4 py-2.5 text-right text-violet">{b.crosstalkScore}</td>
                  <td className="px-4 py-2.5 text-right text-neon-green">{b.manufacturabilityScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Panel title="Baseline" subtitle={`${baselineTopo.name} · degree ${baselineTopo.avgDegree}`}>
          <div className="p-3">
            <TopologyGraph id="square" accent="violet" height={240} />
          </div>
        </Panel>
        <Panel title="Optimized" subtitle={`${r.topology.name} · degree ${r.topology.avgDegree}`}>
          <div className="p-3">
            <TopologyGraph id={r.topology.id === "random" || r.topology.id === "max-connectivity" ? "ai-opt" : r.topology.id} accent="cyan" height={240} />
          </div>
        </Panel>
      </div>
    </div>
  );
}

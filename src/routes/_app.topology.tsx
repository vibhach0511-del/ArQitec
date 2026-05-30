import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { CANDIDATE_TOPOLOGIES } from "@/lib/qa/data";
import { computeScore, estimateRouting } from "@/lib/qa/engine";
import { Panel, SectionHeader, MetricRow, DeltaPill } from "@/components/qa/primitives";
import { TopologyGraph } from "@/components/qa/topology-graph";
import { useQA } from "@/lib/qa/store";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export const Route = createFileRoute("/_app/topology")({
  head: () => ({ meta: [{ title: "Topology Explorer — Q-Architect" }, { name: "description", content: "Compare square grid, heavy-hex, modular cluster, and AI-optimized topologies." }] }),
  component: TopologyPage,
});

function TopologyPage() {
  const qa = useQA();
  const code = qa.result.qec.code;

  const scored = useMemo(
    () =>
      CANDIDATE_TOPOLOGIES.map((t) => {
        const routing = estimateRouting(t, qa.workload);
        const score = computeScore(qa.material, t, qa.workload, code, routing);
        return { topology: t, routing, score };
      }),
    [qa.material, qa.workload, code],
  );

  const bestId = scored.reduce((a, b) => (b.score.architectureScore > a.score.architectureScore ? b : a)).topology.id;

  return (
    <div className="p-6">
      <SectionHeader
        eyebrow="Topology Explorer"
        title="Lattice candidates"
        description={`Scored live against ${qa.workload.name} on the ${qa.material.short} process. Click a candidate to load it into the workspace.`}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
        {scored.map(({ topology: t, routing, score }) => {
          const active = qa.config.topologyId === t.id;
          const recommended = t.id === bestId;
          return (
            <Panel
              key={t.id}
              className={cn("cursor-pointer transition hover:border-border", active && "ring-1 ring-cyan/50")}
              title={t.name}
              subtitle={t.description}
              action={
                recommended ? (
                  <DeltaPill value="RECOMMENDED" />
                ) : (
                  <span className="mono text-[10px] text-muted-foreground">deg {t.avgDegree.toFixed(1)}</span>
                )
              }
            >
              <div className="p-3" onClick={() => qa.setTopology(t.id)}>
                <TopologyGraph id={t.id} accent={t.kind === "ai" ? "violet" : "cyan"} height={180} />
              </div>
              <div className="border-t border-border/60" onClick={() => qa.setTopology(t.id)}>
                <MetricRow label="Architecture score" value={`${score.architectureScore} / 100`} bar={score.architectureScore} tone={t.kind === "ai" ? "violet" : "cyan"} />
                <MetricRow label="Est. SWAPs" value={routing.swapCount} bar={score.routingScore} tone="amber" />
                <MetricRow label="Crosstalk score" value={score.crosstalkScore} bar={score.crosstalkScore} tone="violet" />
                <MetricRow label="QEC compatibility" value={score.qecCompatibilityScore} bar={score.qecCompatibilityScore} tone="green" />
                <MetricRow label="Manufacturability" value={score.manufacturabilityScore} bar={score.manufacturabilityScore} tone="cyan" />
              </div>
              <div className="border-t border-border/60 px-4 py-2.5 flex items-center justify-end">
                <button
                  onClick={() => qa.setTopology(t.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded border px-2 py-1 mono text-[10px] uppercase tracking-[0.18em] transition",
                    active ? "border-cyan/50 bg-cyan/20 text-cyan" : "border-border/60 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {active && <Check className="h-3 w-3" />}
                  {active ? "Loaded" : "Load topology"}
                </button>
              </div>
            </Panel>
          );
        })}
      </div>

      <Panel className="mt-6" title="Comparison" subtitle="Live scores · current material & workload">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mono">
              <tr className="border-b border-border/60">
                <th className="text-left px-4 py-2.5">Topology</th>
                <th className="text-right px-4 py-2.5">Arch. score</th>
                <th className="text-right px-4 py-2.5">SWAPs</th>
                <th className="text-right px-4 py-2.5">Crosstalk</th>
                <th className="text-right px-4 py-2.5">QEC</th>
                <th className="text-right px-4 py-2.5">Mfg.</th>
              </tr>
            </thead>
            <tbody className="mono tabular-nums">
              {scored.map(({ topology: t, routing, score }) => (
                <tr key={t.id} className={cn("border-b border-border/40 last:border-0 hover:bg-surface-2/40", qa.config.topologyId === t.id && "bg-surface-2/40")}>
                  <td className="px-4 py-2.5 text-foreground">{t.name}</td>
                  <td className="px-4 py-2.5 text-right text-foreground">{score.architectureScore}</td>
                  <td className="px-4 py-2.5 text-right text-amber">{routing.swapCount}</td>
                  <td className="px-4 py-2.5 text-right text-violet">{score.crosstalkScore}</td>
                  <td className="px-4 py-2.5 text-right text-neon-green">{score.qecCompatibilityScore}</td>
                  <td className="px-4 py-2.5 text-right text-cyan">{score.manufacturabilityScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

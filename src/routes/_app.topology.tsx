import { createFileRoute } from "@tanstack/react-router";
import { TOPOLOGIES } from "@/data/mock";
import { Panel, SectionHeader, MetricRow, DeltaPill } from "@/components/qa/primitives";
import { TopologyGraph } from "@/components/qa/topology-graph";

export const Route = createFileRoute("/_app/topology")({
  head: () => ({ meta: [{ title: "Topology Explorer — Q-Architect" }, { name: "description", content: "Compare square grid, heavy-hex, modular cluster, and AI-optimized topologies." }] }),
  component: TopologyPage,
});

function TopologyPage() {
  return (
    <div className="p-6">
      <SectionHeader
        eyebrow="Topology Explorer"
        title="Lattice candidates"
        description="Four topologies scored against the active workload (QAOA · MaxCut-64) and the SC-Transmon process profile."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
        {TOPOLOGIES.map((t) => {
          const isAi = t.id === "ai-opt";
          return (
            <Panel key={t.id} title={t.name} subtitle={t.description}
              action={isAi ? <DeltaPill value="RECOMMENDED" /> : <span className="mono text-[10px] text-muted-foreground">deg {t.degree.toFixed(1)}</span>}>
              <div className="p-3">
                <TopologyGraph id={t.id} accent={isAi ? "violet" : "cyan"} height={180} />
              </div>
              <div className="border-t border-border/60">
                <MetricRow label="Connectivity score" value={t.connectivity} bar={t.connectivity} />
                <MetricRow label="SWAP overhead" value={t.swap_overhead} bar={100 - t.swap_overhead} tone="amber" />
                <MetricRow label="Crosstalk penalty" value={t.crosstalk} bar={100 - t.crosstalk} tone="violet" />
                <MetricRow label="QEC compatibility" value={t.qec_compat} bar={t.qec_compat} tone="green" />
                <MetricRow label="Manufacturability" value={t.manufacturability} bar={t.manufacturability} tone="cyan" />
              </div>
            </Panel>
          );
        })}
      </div>

      <Panel className="mt-6" title="Comparison" subtitle="Side-by-side · lower values are worse for SWAP/crosstalk">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mono">
              <tr className="border-b border-border/60">
                <th className="text-left px-4 py-2.5">Topology</th>
                <th className="text-right px-4 py-2.5">Connectivity</th>
                <th className="text-right px-4 py-2.5">SWAP</th>
                <th className="text-right px-4 py-2.5">Crosstalk</th>
                <th className="text-right px-4 py-2.5">QEC</th>
                <th className="text-right px-4 py-2.5">Mfg.</th>
              </tr>
            </thead>
            <tbody className="mono tabular-nums">
              {TOPOLOGIES.map(t => (
                <tr key={t.id} className="border-b border-border/40 last:border-0 hover:bg-surface-2/40">
                  <td className="px-4 py-2.5 text-foreground">{t.name}</td>
                  <td className="px-4 py-2.5 text-right">{t.connectivity}</td>
                  <td className="px-4 py-2.5 text-right text-amber">{t.swap_overhead}</td>
                  <td className="px-4 py-2.5 text-right text-violet">{t.crosstalk}</td>
                  <td className="px-4 py-2.5 text-right text-neon-green">{t.qec_compat}</td>
                  <td className="px-4 py-2.5 text-right text-cyan">{t.manufacturability}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

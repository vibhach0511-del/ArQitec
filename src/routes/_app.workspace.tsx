import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { TopologyCanvas, sampleQubit } from "@/components/qa/topology-canvas";
import { AgentPanel } from "@/components/qa/agent-panel";
import { Panel, MetricRow, MetricCard } from "@/components/qa/primitives";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useQA } from "@/lib/qa/store";

export const Route = createFileRoute("/_app/workspace")({
  head: () => ({ meta: [{ title: "Workspace — ArQiteQ" }, { name: "description", content: "Design workspace: live chip canvas, qubit inspector, and AI agent reasoning." }] }),
  component: WorkspacePage,
});

function WorkspacePage() {
  const qa = useQA();
  const [selected, setSelected] = useState<number | null>(null);
  const q = selected !== null ? sampleQubit(qa.config.topologyId, qa.material, selected) : null;
  const { score, routing } = qa.result;
  const swapDelta = qa.result.headlineDeltas.find((d) => d.label === "SWAP gates");

  return (
    <div className="grid h-[calc(100vh-7.5rem)] grid-cols-12 gap-3 p-3">
      <div className="col-span-12 lg:col-span-7 xl:col-span-7 flex flex-col gap-3 min-h-0">
        <Panel className="flex-1 min-h-0" title="Chip Canvas" subtitle={`${qa.topology.name} · ${qa.material.short} · ${qa.workload.name}`}>
          <div className="h-[calc(100%-0px)] p-3">
            <TopologyCanvas
              topologyId={qa.config.topologyId}
              material={qa.material}
              selected={selected}
              onSelect={setSelected}
              accent={qa.topology.kind === "ai" ? "violet" : "cyan"}
              label={`Live wafer · die A4 · ${qa.topology.kind === "ai" ? "ArQiteQ AI" : qa.topology.name}`}
            />
          </div>
        </Panel>
        <div className="grid grid-cols-4 gap-3">
          <MetricCard label="Avg 2Q fidelity" value={qa.material.gate2QFidelity.toFixed(2)} unit="%" tone="good" />
          <MetricCard label="SWAP / 2Q gate" value={routing.swapsPerGate.toFixed(2)} delta={swapDelta?.value} tone={swapDelta?.tone === "warn" ? "warn" : "good"} />
          <MetricCard label="Crosstalk score" value={score.crosstalkScore.toFixed(0)} unit="/100" tone={score.crosstalkScore > 60 ? "good" : "warn"} />
          <MetricCard label="Architecture score" value={score.architectureScore.toFixed(0)} unit="/100" tone={score.architectureScore > 70 ? "good" : "warn"} />
        </div>
      </div>

      <div className="col-span-12 lg:col-span-5 xl:col-span-5 grid grid-rows-2 gap-3 min-h-0">
        <Panel title="Inspector" subtitle={q ? `Qubit Q${q.id}` : "Select a qubit"}>
          <Tabs defaultValue="qubit" className="px-3 pt-2">
            <TabsList className="bg-surface-2 border border-border/60">
              <TabsTrigger value="qubit">Qubit</TabsTrigger>
              <TabsTrigger value="coupler">Coupler</TabsTrigger>
              <TabsTrigger value="region">Region</TabsTrigger>
            </TabsList>
            <TabsContent value="qubit">
              {q ? (
                <div className="-mx-3 mt-2">
                  <MetricRow label="Frequency" value={`${q.freq.toFixed(3)} GHz`} bar={62} />
                  <MetricRow label="T1" value={q.t1 > 9000 ? "∞" : `${q.t1.toFixed(0)} µs`} bar={Math.min(100, q.t1 / 14)} tone="green" />
                  <MetricRow label="T2 (echo)" value={q.t2 > 9000 ? "∞" : `${q.t2.toFixed(0)} µs`} bar={Math.min(100, q.t2 / 14)} tone="green" />
                  <MetricRow label="2Q gate fidelity" value={`${(q.fidelity * 100).toFixed(3)} %`} bar={Math.min(100, (q.fidelity - 0.96) * 2500)} tone="cyan" />
                  <MetricRow label="Readout error" value={`${q.readout.toFixed(2)} %`} bar={Math.min(100, (3 - q.readout) * 33)} tone="amber" />
                  <MetricRow label="Crosstalk to neighbors" value={q.crosstalk.toFixed(3)} bar={Math.min(100, q.crosstalk * 220)} tone="violet" />
                </div>
              ) : (
                <div className="px-1 py-6 text-sm text-muted-foreground text-center">
                  Click any qubit on the canvas to inspect its metrics.
                </div>
              )}
            </TabsContent>
            <TabsContent value="coupler">
              <div className="-mx-3 mt-2">
                <MetricRow label="Coupling strength" value="12.4 MHz" bar={48} />
                <MetricRow label="2Q gate time" value="284 ns" bar={32} tone="violet" />
                <MetricRow label="2Q gate fidelity" value={`${qa.material.gate2QFidelity.toFixed(2)} %`} bar={94} tone="cyan" />
                <MetricRow label="Leakage" value="2.1e-4" bar={18} tone="amber" />
              </div>
            </TabsContent>
            <TabsContent value="region">
              <div className="-mx-3 mt-2">
                <MetricRow label="Routed depth" value={routing.routedDepth} bar={Math.min(100, routing.routedDepth / 12)} />
                <MetricRow label="Avg connectivity" value={`${qa.topology.avgDegree.toFixed(1)} deg`} bar={qa.topology.connectivity} />
                <MetricRow label="Congestion (this run)" value={routing.congestion.toFixed(2)} bar={routing.congestion * 100} tone="amber" />
                <MetricRow label="QEC compatibility" value={score.qecCompatibilityScore.toFixed(0)} bar={score.qecCompatibilityScore} tone="green" />
              </div>
            </TabsContent>
          </Tabs>
        </Panel>
        <Panel title="Architect Agent" subtitle="Why this layout?">
          <AgentPanel compact />
        </Panel>
      </div>
    </div>
  );
}

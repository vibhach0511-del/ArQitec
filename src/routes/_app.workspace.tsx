import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChipCanvas, getQubitSample } from "@/components/qa/chip-canvas";
import { AgentPanel } from "@/components/qa/agent-panel";
import { Panel, MetricRow, MetricCard } from "@/components/qa/primitives";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/_app/workspace")({
  head: () => ({ meta: [{ title: "Workspace — Q-Architect" }, { name: "description", content: "Design workspace: live chip canvas, qubit inspector, and AI agent reasoning." }] }),
  component: WorkspacePage,
});

function WorkspacePage() {
  const [selected, setSelected] = useState<number | null>(34);
  const q = selected !== null ? getQubitSample(selected) : null;

  return (
    <div className="grid h-[calc(100vh-7.5rem)] grid-cols-12 gap-3 p-3">
      <div className="col-span-12 lg:col-span-7 xl:col-span-7 flex flex-col gap-3 min-h-0">
        <Panel className="flex-1 min-h-0" title="Chip Canvas" subtitle="127-qubit · heavy-hex · Q-Architect AI">
          <div className="h-[calc(100%-0px)] p-3">
            <ChipCanvas selected={selected} onSelect={setSelected} />
          </div>
        </Panel>
        <div className="grid grid-cols-4 gap-3">
          <MetricCard label="Avg 2Q fidelity" value="99.41" unit="%" delta="+0.18" tone="good" />
          <MetricCard label="Mean SWAP/op" value="0.42" delta="−28%" tone="good" />
          <MetricCard label="Crosstalk σ" value="0.029" delta="−19%" tone="good" />
          <MetricCard label="Yield est." value="71" unit="%" delta="+4.2" tone="good" />
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
                  <MetricRow label="Frequency" value={`${(5.12 + (q.id % 7) * 0.018).toFixed(3)} GHz`} bar={62} />
                  <MetricRow label="T1" value={`${q.t1.toFixed(0)} µs`} bar={Math.min(100, q.t1 / 1.6)} tone="green" />
                  <MetricRow label="T2 (echo)" value={`${(q.t1 * 0.82).toFixed(0)} µs`} bar={Math.min(100, (q.t1 * 0.82) / 1.6)} tone="green" />
                  <MetricRow label="1Q gate fidelity" value={`${(q.fidelity * 100).toFixed(3)} %`} bar={Math.min(100, (q.fidelity - 0.98) * 5000)} tone="cyan" />
                  <MetricRow label="Readout error" value={`${(0.6 + ((q.id % 5) * 0.1)).toFixed(2)} %`} bar={Math.min(100, (1.2 - (0.6 + (q.id % 5) * 0.1)) * 80)} tone="amber" />
                  <MetricRow label="Crosstalk to neighbors" value={`${(0.02 + ((q.id % 9) * 0.004)).toFixed(3)}`} bar={Math.min(100, (0.02 + (q.id % 9) * 0.004) * 1200)} tone="violet" />
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
                <MetricRow label="2Q gate fidelity" value="99.41 %" bar={94} tone="cyan" />
                <MetricRow label="Leakage" value="2.1e-4" bar={18} tone="amber" />
              </div>
            </TabsContent>
            <TabsContent value="region">
              <div className="-mx-3 mt-2">
                <MetricRow label="Region size" value="16 qubits" bar={40} />
                <MetricRow label="Connectivity" value="3.8 avg" bar={64} />
                <MetricRow label="Congestion (this run)" value="0.41" bar={41} tone="amber" />
                <MetricRow label="Surface-code patch fits" value="2 × d=5" bar={70} tone="green" />
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

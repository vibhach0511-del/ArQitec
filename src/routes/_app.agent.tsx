import { createFileRoute } from "@tanstack/react-router";
import { AgentPanel } from "@/components/qa/agent-panel";
import { Panel, SectionHeader } from "@/components/qa/primitives";

export const Route = createFileRoute("/_app/agent")({
  head: () => ({ meta: [{ title: "Architect Agent — Q-Architect" }, { name: "description", content: "AI reasoning trace for the active optimization run." }] }),
  component: AgentPage,
});

function AgentPage() {
  return (
    <div className="p-6">
      <SectionHeader
        eyebrow="Architect Agent"
        title="Scientific reasoning trace"
        description="Step-by-step rationale for the current chip architecture decisions. Evidence links cite materials, topology, and QEC modules."
      />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Panel className="xl:col-span-2 h-[72vh]" title="Run qa-run-0427" subtitle="QAOA-64 · SC-Transmon · heavy-hex">
          <AgentPanel />
        </Panel>
        <Panel title="Run metadata" subtitle="Reproducibility">
          <div className="p-4 space-y-2 mono text-[11px] text-muted-foreground">
            <Meta k="seed" v="0x9F2C1A" />
            <Meta k="iterations" v="32" />
            <Meta k="search" v="genetic + RL" />
            <Meta k="mapper" v="SABRE + RL" />
            <Meta k="qubit budget" v="127" />
            <Meta k="profile" v="SC-Transmon · 15 mK" />
            <Meta k="workload" v="QAOA · MaxCut-64" />
            <Meta k="code" v="heavy-hex d=5" />
            <Meta k="cost final" v="38.4" />
            <Meta k="mfg score" v="78.1" />
            <Meta k="status" v="CONVERGED" />
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Meta({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
      <span className="uppercase tracking-[0.18em]">{k}</span>
      <span className="text-foreground">{v}</span>
    </div>
  );
}
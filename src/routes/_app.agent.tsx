import { createFileRoute } from "@tanstack/react-router";
import { AgentPanel } from "@/components/qa/agent-panel";
import { Panel, SectionHeader } from "@/components/qa/primitives";
import { useQA } from "@/lib/qa/store";

export const Route = createFileRoute("/_app/agent")({
  head: () => ({ meta: [{ title: "Architect Agent — ArQiteQ" }, { name: "description", content: "AI reasoning trace for the active optimization run." }] }),
  component: AgentPage,
});

function AgentPage() {
  const qa = useQA();
  const r = qa.hasRun ? qa.committed : qa.result;

  return (
    <div className="p-6">
      <SectionHeader
        eyebrow="Architect Agent"
        title="Scientific reasoning trace"
        description="Step-by-step rationale for the current chip architecture decisions. Evidence chips cite the live materials, topology, routing, and QEC modules."
      />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Panel className="xl:col-span-2 h-[72vh]" title={`Run · ${r.workload.name}`} subtitle={`${r.material.short} · ${r.topology.name}`}>
          <AgentPanel />
        </Panel>
        <Panel title="Run metadata" subtitle="Reproducibility">
          <div className="p-4 space-y-2 mono text-[11px] text-muted-foreground">
            <Meta k="seed" v={r.seed} />
            <Meta k="iterations" v={String(r.convergence.length)} />
            <Meta k="search" v="genetic + RL" />
            <Meta k="mapper" v="SABRE + RL" />
            <Meta k="profile" v={r.material.vendor} />
            <Meta k="workload" v={r.workload.name} />
            <Meta k="topology" v={r.topology.name} />
            <Meta k="code" v={`${r.qec.code.name} d=${r.qec.distance}`} />
            <Meta k="arch score" v={`${r.score.architectureScore} / 100`} />
            <Meta k="est. SWAPs" v={String(r.routing.swapCount)} />
            <Meta k="status" v={qa.status === "converged" ? "CONVERGED" : qa.status === "running" ? "RUNNING" : "PREVIEW"} />
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

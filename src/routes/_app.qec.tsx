import { createFileRoute } from "@tanstack/react-router";
import { ERROR_CORRECTION_CODES } from "@/lib/qa/data";
import { Panel, SectionHeader, MetricRow, DeltaPill } from "@/components/qa/primitives";
import { ShieldCheck, Sparkles, RotateCcw, Check } from "lucide-react";
import { useQA } from "@/lib/qa/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/qec")({
  head: () => ({ meta: [{ title: "Error Correction Advisor — ArQiteQ" }, { name: "description", content: "Compare surface, heavy-hex, color, and repetition codes for the current chip profile." }] }),
  component: QecPage,
});

function QecPage() {
  const qa = useQA();
  const { qec } = qa.result;
  const rankScore = (id: string) => qec.ranking.find((r) => r.code.id === id)?.score ?? 0;

  return (
    <div className="p-6">
      <SectionHeader
        eyebrow="Error Correction Advisor"
        title="Code selection · current profile"
        description={`Codes scored against the ${qa.material.short} process and ${qa.topology.name} layout for ${qa.workload.name}.`}
        action={
          qa.config.qecId ? (
            <button
              onClick={() => qa.setQEC(undefined)}
              className="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-surface-2/50 px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-3/70 transition mono uppercase tracking-[0.14em]"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Let advisor choose
            </button>
          ) : undefined
        }
      />

      <div className="mb-5 rounded-lg border border-violet/30 bg-gradient-to-r from-violet/10 via-transparent to-cyan/10 px-5 py-4 flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md bg-violet/20 border border-violet/40">
          <Sparkles className="h-4 w-4 text-violet" />
        </div>
        <div className="flex-1">
          <div className="mono text-[10px] uppercase tracking-[0.2em] text-violet">
            {qa.config.qecId ? "Manual override" : "Agent recommendation"}
          </div>
          <div className="mt-0.5 text-sm text-foreground">{qec.rationale}</div>
          <div className="mt-2 flex flex-wrap gap-3 mono text-[11px] text-muted-foreground">
            <span>distance <span className="text-foreground">d={qec.distance}</span></span>
            <span>physical <span className="text-foreground">{qec.physicalQubitOverhead.toLocaleString()}</span></span>
            <span>logical risk <span className="text-foreground">{qec.logicalErrorRisk.toExponential(1)}</span></span>
            <span>syndrome <span className="text-foreground">{qec.syndromeExtractionOverhead}%</span></span>
          </div>
        </div>
        <DeltaPill value="selected" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {ERROR_CORRECTION_CODES.map((c) => {
          const recommended = c.id === qec.code.id;
          const active = qa.config.qecId === c.id;
          return (
            <Panel
              key={c.id}
              className={cn("cursor-pointer transition hover:border-border", active && "ring-1 ring-violet/50")}
              title={c.family}
              subtitle={c.name}
              action={
                recommended ? <DeltaPill value="RECOMMENDED" /> : <span className="mono text-[10px] text-muted-foreground">score {rankScore(c.id)}</span>
              }
            >
              <div className="p-4 grid grid-cols-3 gap-3" onClick={() => qa.setQEC(c.id)}>
                <div className="rounded-md border border-border/60 bg-surface-2/40 p-3 col-span-1 flex flex-col items-center justify-center">
                  <ShieldCheck className={`h-7 w-7 ${recommended ? "text-violet" : "text-cyan"}`} />
                  <div className="mt-2 mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">code distance</div>
                  <div className="mono text-3xl font-semibold text-foreground">d={recommended ? qec.distance : c.baseDistance}</div>
                </div>
                <div className="col-span-2">
                  <MetricRow label="Physical qubits / logical" value={c.physicalPerLogical} bar={Math.min(100, c.physicalPerLogical)} />
                  <MetricRow label="Logical error estimate" value={c.logicalErrorBase.toExponential(1)} bar={Math.max(2, 100 - Math.log10(1 / c.logicalErrorBase) * 12)} tone="amber" />
                  <MetricRow label="Syndrome overhead" value={`${c.syndromeOverhead}%`} bar={c.syndromeOverhead} tone="violet" />
                  <MetricRow label="Advisor score" value={rankScore(c.id)} bar={rankScore(c.id)} tone="green" />
                </div>
              </div>
              <div className="border-t border-border/60 px-4 py-2.5 flex items-center justify-end">
                <button
                  onClick={() => qa.setQEC(c.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded border px-2 py-1 mono text-[10px] uppercase tracking-[0.18em] transition",
                    active ? "border-violet/50 bg-violet/20 text-violet" : "border-border/60 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {active && <Check className="h-3 w-3" />}
                  {active ? "Pinned" : "Pin this code"}
                </button>
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

import { useState } from "react";
import { Sparkles, ChevronDown, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQA } from "@/lib/qa/store";
import type { OptimizationResult } from "@/lib/qa/types";

interface Turn {
  role: "agent" | "user";
  step?: string;
  text: string;
  evidence?: string[];
}

// Deterministic reasoning trace generated from the active configuration.
// TODO(integration): stream a real reasoning chain from an LLM (e.g. via the
// XpyQ / OpenAI agent in baselines.py) instead of this template generator.
function buildTrace(r: OptimizationResult): Turn[] {
  const { material, topology, workload, routing, score, qec } = r;
  return [
    {
      role: "user",
      text: `Optimize for ${workload.name} under the ${material.name} profile, prioritize tapeout-readiness.`,
    },
    {
      role: "agent",
      step: "1 · Profile",
      text: `Loaded ${material.short} process (T1 ${material.t1Us > 9000 ? "∞" : `${material.t1Us}µs`}, 2Q fidelity ${material.gate2QFidelity}%). Constrained search to layouts near the ${material.preferredDegree}-coupler degree this process tolerates.`,
      evidence: [`Material: ${material.short}`, `deg ≈ ${material.preferredDegree}`, `yield ${material.yield}%`],
    },
    {
      role: "agent",
      step: "2 · Candidates",
      text: `Scored ${r.baselines.length} topology families against the workload's interaction density (${workload.interactionDensity.toFixed(2)}). ${r.baselines.find((b) => b.isRecommended)?.method ?? "AI-optimized"} leads on the weighted objective.`,
      evidence: r.baselines
        .slice()
        .sort((a, b) => b.architectureScore - a.architectureScore)
        .slice(0, 3)
        .map((b) => `${b.method}: ${b.architectureScore}`),
    },
    {
      role: "agent",
      step: "3 · Routing",
      text: `Projected ${routing.swapCount.toLocaleString()} inserted SWAPs (${routing.swapsPerGate}/2Q gate) and routed depth ${routing.routedDepth} on ${topology.name}. Congestion settles at ${(routing.congestion * 100).toFixed(0)}%.`,
      evidence: [`SWAPs ${routing.swapCount}`, `depth ${routing.routedDepth}`, `routing score ${score.routingScore}`],
    },
    {
      role: "agent",
      step: "4 · Decision",
      text: r.explanation,
      evidence: [`routing ${score.routingScore}`, `crosstalk ${score.crosstalkScore}`, `QEC ${score.qecCompatibilityScore}`, `score ${score.architectureScore}`],
    },
    {
      role: "agent",
      step: "5 · Codework",
      text: `Recommend ${qec.code.name} at distance ${qec.distance} → ${qec.physicalQubitOverhead.toLocaleString()} physical qubits for ${workload.logicalQubits} logical, logical error risk ${qec.logicalErrorRisk.toExponential(1)}.`,
      evidence: [`${qec.code.name} d=${qec.distance}`, `${qec.physicalQubitOverhead.toLocaleString()} phys`, `syndrome ${qec.syndromeExtractionOverhead}%`],
    },
  ];
}

export function AgentPanel({ compact = false, className }: { compact?: boolean; className?: string }) {
  const qa = useQA();
  const trace = buildTrace(qa.hasRun ? qa.committed : qa.result);
  const running = qa.status === "running";

  // Progressive reveal while a run is in flight.
  const agentTurns = trace.filter((t) => t.role === "agent");
  const visibleAgent = running ? Math.min(agentTurns.length, qa.activeStep + 1) : agentTurns.length;
  let seenAgent = 0;
  const turns = trace.filter((t) => {
    if (t.role === "user") return true;
    seenAgent += 1;
    return seenAgent <= visibleAgent;
  });

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-violet/20 border border-violet/40">
            <Sparkles className="h-3.5 w-3.5 text-violet" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-foreground">Architect Agent</div>
            <div className="mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">deterministic reasoning · {qa.workload.name}</div>
          </div>
        </div>
        <span className={cn("inline-flex items-center gap-1.5 mono text-[10px]", running ? "text-amber" : "text-neon-green")}>
          <span className={cn("h-1.5 w-1.5 rounded-full", running ? "bg-amber animate-pulse" : "bg-neon-green")} />
          {running ? "THINKING" : "READY"}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {turns.map((t, i) => (
          <TurnCard key={i} turn={t} compact={compact} />
        ))}
        {running && visibleAgent < agentTurns.length && (
          <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground mono">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-violet" /> reasoning…
          </div>
        )}
      </div>
      <div className="border-t border-border/60 p-3">
        <div className="flex items-center gap-2 rounded-md border border-border/60 bg-surface-2/50 px-3 py-2">
          <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            disabled
            placeholder="Ask the architect agent… (LLM integration TODO)"
            className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground/70 focus:outline-none"
          />
          <kbd className="mono text-[10px] text-muted-foreground border border-border/60 rounded px-1.5 py-0.5">⌘ K</kbd>
        </div>
      </div>
    </div>
  );
}

function TurnCard({ turn, compact }: { turn: Turn; compact?: boolean }) {
  const [open, setOpen] = useState(!compact);
  if (turn.role === "user") {
    return (
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-3 border border-border/60">
          <User className="h-3 w-3 text-muted-foreground" />
        </div>
        <div className="flex-1 text-sm text-foreground/90 leading-relaxed">{turn.text}</div>
      </div>
    );
  }
  return (
    <div className="rounded-md border border-violet/20 bg-violet/[0.04] p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-violet" />
          {turn.step && <span className="mono text-[10px] uppercase tracking-[0.18em] text-violet">{turn.step}</span>}
        </div>
        {turn.evidence && (
          <button onClick={() => setOpen((o) => !o)} className="text-muted-foreground hover:text-foreground transition">
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
          </button>
        )}
      </div>
      <div className="mt-1.5 text-sm leading-relaxed text-foreground/90">{turn.text}</div>
      {open && turn.evidence && (
        <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-violet/15 pt-2.5">
          {turn.evidence.map((e, i) => (
            <span key={i} className="rounded border border-violet/30 bg-violet/10 px-1.5 py-0.5 mono text-[10px] text-violet/90">{e}</span>
          ))}
        </div>
      )}
    </div>
  );
}

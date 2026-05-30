import { useState } from "react";
import { AGENT_TRANSCRIPT } from "@/data/mock";
import { Sparkles, ChevronDown, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function AgentPanel({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-violet/20 border border-violet/40">
            <Sparkles className="h-3.5 w-3.5 text-violet" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-foreground">Architect Agent</div>
            <div className="mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">reasoning trace · run-0427</div>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 mono text-[10px] text-neon-green">
          <span className="h-1.5 w-1.5 rounded-full bg-neon-green animate-pulse" />
          ACTIVE
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {AGENT_TRANSCRIPT.map((t, i) => (
          <TurnCard key={i} turn={t} compact={compact} />
        ))}
      </div>
      <div className="border-t border-border/60 p-3">
        <div className="flex items-center gap-2 rounded-md border border-border/60 bg-surface-2/50 px-3 py-2">
          <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            disabled
            placeholder="Ask the architect agent…"
            className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground/70 focus:outline-none"
          />
          <kbd className="mono text-[10px] text-muted-foreground border border-border/60 rounded px-1.5 py-0.5">⌘ K</kbd>
        </div>
      </div>
    </div>
  );
}

function TurnCard({ turn, compact }: { turn: typeof AGENT_TRANSCRIPT[number]; compact?: boolean }) {
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
          <button onClick={() => setOpen(o => !o)} className="text-muted-foreground hover:text-foreground transition">
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
import * as React from "react";
import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export function Panel({ className, children, title, subtitle, action }: { className?: string; children: React.ReactNode; title?: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className={cn("relative rounded-lg border border-border/60 bg-surface-1/70 backdrop-blur-sm overflow-hidden", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
          <div className="flex flex-col">
            {title && <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mono">{title}</span>}
            {subtitle && <span className="text-sm text-foreground/90">{subtitle}</span>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function MetricCard({ label, value, unit, delta, tone = "neutral", hint }: { label: string; value: string | number; unit?: string; delta?: string; tone?: "good" | "warn" | "bad" | "neutral"; hint?: string }) {
  const toneColor = {
    good: "text-neon-green",
    warn: "text-amber",
    bad: "text-danger",
    neutral: "text-muted-foreground",
  }[tone];
  return (
    <div className="rounded-md border border-border/60 bg-surface-2/40 p-3">
      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mono">{label}</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="mono text-xl font-semibold text-foreground tabular-nums">{value}</span>
        {unit && <span className="text-xs text-muted-foreground mono">{unit}</span>}
      </div>
      {(delta || hint) && (
        <div className="mt-1 flex items-center justify-between text-[11px] mono">
          {delta && <span className={cn("inline-flex items-center gap-0.5", toneColor)}>
            {delta.startsWith("-") || delta.startsWith("−") ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
            {delta}
          </span>}
          {hint && <span className="text-muted-foreground/80 truncate">{hint}</span>}
        </div>
      )}
    </div>
  );
}

export function MetricRow({ label, value, bar, tone = "cyan" }: { label: string; value: string | number; bar?: number; tone?: "cyan" | "violet" | "green" | "amber" }) {
  const color = { cyan: "bg-cyan", violet: "bg-violet", green: "bg-neon-green", amber: "bg-amber" }[tone];
  return (
    <div className="px-4 py-2.5 border-b border-border/40 last:border-0">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="mono text-foreground tabular-nums">{value}</span>
      </div>
      {typeof bar === "number" && (
        <div className="mt-1.5 h-1 w-full rounded-full bg-surface-3/80 overflow-hidden">
          <div className={cn("h-full rounded-full", color)} style={{ width: `${Math.min(100, Math.max(0, bar))}%` }} />
        </div>
      )}
    </div>
  );
}

export function DeltaPill({ value, tone = "good" }: { value: string; tone?: "good" | "bad" | "neutral" }) {
  const color = tone === "good" ? "text-neon-green border-neon-green/30 bg-neon-green/10" : tone === "bad" ? "text-danger border-danger/30 bg-danger/10" : "text-muted-foreground border-border/60 bg-surface-2/50";
  return <span className={cn("inline-flex items-center gap-1 rounded border px-1.5 py-0.5 mono text-[10px] font-semibold", color)}>{value}</span>;
}

export function SectionHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        {eyebrow && <div className="text-[10px] uppercase tracking-[0.24em] mono text-cyan mb-1">{eyebrow}</div>}
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{description}</p>}
      </div>
      {action}
    </div>
  );
}
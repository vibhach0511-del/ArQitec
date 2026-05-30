import { cn } from "@/lib/utils";

export type CongestionCell = { x: number; y: number; v: number };

export function Heatmap({ cells, cols = 12, rows = 8, title, className, accent = "violet" }: { cells: CongestionCell[]; cols?: number; rows?: number; title?: string; className?: string; accent?: "violet" | "cyan" }) {
  const base = accent === "violet" ? "oklch(0.7 0.21 295)" : "oklch(0.82 0.16 200)";
  return (
    <div className={cn("rounded-md border border-border/60 bg-surface-1/60 p-3", className)}>
      {title && <div className="mb-2 mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{title}</div>}
      <div className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {cells.map((c, i) => (
          <div key={i} className="aspect-square rounded-sm" style={{ backgroundColor: base, opacity: 0.12 + c.v * 0.78 }} title={`(${c.x},${c.y}) · ${(c.v * 100).toFixed(0)}%`} />
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between mono text-[10px] text-muted-foreground">
        <span>low</span>
        <div className="h-1.5 flex-1 mx-2 rounded-full" style={{ background: `linear-gradient(90deg, ${base}22, ${base})` }} />
        <span>high</span>
      </div>
    </div>
  );
}
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

type Qubit = { id: number; x: number; y: number; fidelity: number; t1: number };
type Edge = { a: number; b: number; weight: number };

function buildHeavyHex(cols: number, rows: number): { qubits: Qubit[]; edges: Edge[] } {
  const qubits: Qubit[] = [];
  const edges: Edge[] = [];
  let id = 0;
  const idAt = new Map<string, number>();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if ((r + c) % 3 === 2) continue;
      const x = c * 60 + (r % 2 ? 30 : 0) + 40;
      const y = r * 56 + 40;
      const fidelity = 0.985 + (Math.sin(c * 1.3 + r) * 0.5 + 0.5) * 0.013;
      const t1 = 110 + Math.cos(c + r * 2) * 30;
      qubits.push({ id, x, y, fidelity, t1 });
      idAt.set(`${c},${r}`, id);
      id++;
    }
  }
  for (const [key, qid] of idAt) {
    const [c, r] = key.split(",").map(Number);
    const neighbors = [
      [c + 1, r],
      [c, r + 1],
      [c - 1, r + 1],
    ];
    for (const [nc, nr] of neighbors) {
      const nid = idAt.get(`${nc},${nr}`);
      if (nid !== undefined) {
        const w = 0.94 + Math.sin(c + nr * 1.7) * 0.05;
        edges.push({ a: qid, b: nid, weight: w });
      }
    }
  }
  return { qubits, edges };
}

export function ChipCanvas({ selected, onSelect, optimized = true, className }: { selected?: number | null; onSelect?: (id: number | null) => void; optimized?: boolean; className?: string }) {
  const { qubits, edges } = useMemo(() => buildHeavyHex(13, 9), []);
  const W = 13 * 60 + 60;
  const H = 9 * 56 + 60;

  const colorFor = (f: number) => {
    if (f > 0.994) return "oklch(0.82 0.16 200)"; // cyan
    if (f > 0.99) return "oklch(0.78 0.18 150)"; // green
    if (f > 0.987) return "oklch(0.82 0.16 75)"; // amber
    return "oklch(0.7 0.22 25)"; // red
  };

  return (
    <div className={cn("relative h-full w-full overflow-hidden rounded-md border border-border/60 bg-[oklch(0.14_0.02_250)]", className)}>
      <div className="absolute inset-0 qa-grid-bg opacity-30" />
      <div className="absolute left-3 top-3 z-10 flex items-center gap-2 mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-cyan animate-pulse" />
        Live wafer · die A4 · {optimized ? "Q-Architect AI" : "Baseline"}
      </div>
      <div className="absolute right-3 top-3 z-10 mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {qubits.length} qubits · {edges.length} couplers
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="qglow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="oklch(0.82 0.16 200)" stopOpacity="0.7" />
            <stop offset="100%" stopColor="oklch(0.82 0.16 200)" stopOpacity="0" />
          </radialGradient>
        </defs>
        {edges.map((e, i) => {
          const a = qubits[e.a], b = qubits[e.b];
          if (!a || !b) return null;
          const op = (e.weight - 0.9) * 6;
          return (
            <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke="oklch(0.82 0.16 200)" strokeOpacity={Math.max(0.12, Math.min(0.55, op))} strokeWidth={1.1} />
          );
        })}
        {qubits.map((q) => {
          const isSel = selected === q.id;
          return (
            <g key={q.id} onClick={() => onSelect?.(isSel ? null : q.id)} className="cursor-pointer">
              {isSel && <circle cx={q.x} cy={q.y} r={16} fill="url(#qglow)" />}
              <circle cx={q.x} cy={q.y} r={isSel ? 7 : 5} fill={colorFor(q.fidelity)} fillOpacity={0.18}
                stroke={colorFor(q.fidelity)} strokeWidth={isSel ? 2 : 1.2} />
              {isSel && (
                <text x={q.x + 10} y={q.y - 8} fontSize="9" fontFamily="JetBrains Mono" fill="oklch(0.96 0.01 240)">
                  Q{q.id}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="absolute bottom-3 right-3 z-10 flex items-center gap-3 rounded-md border border-border/60 bg-surface-2/80 px-2.5 py-1.5 mono text-[10px]">
        <LegendDot color="oklch(0.82 0.16 200)" label="F > 99.4%" />
        <LegendDot color="oklch(0.78 0.18 150)" label="> 99.0%" />
        <LegendDot color="oklch(0.82 0.16 75)" label="> 98.7%" />
        <LegendDot color="oklch(0.7 0.22 25)" label="risk" />
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

export function getQubitSample(id: number): Qubit | null {
  const { qubits } = buildHeavyHex(13, 9);
  return qubits.find(q => q.id === id) ?? null;
}
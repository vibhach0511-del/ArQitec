import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { getTopologySpec } from "@/lib/qa/topology-spec";
import type { MaterialProfile, TopologyId } from "@/lib/qa/types";

const ACCENT = {
  cyan: "oklch(0.82 0.16 200)",
  violet: "oklch(0.7 0.21 295)",
  green: "oklch(0.78 0.18 150)",
  amber: "oklch(0.82 0.16 75)",
} as const;

export interface CanvasQubit {
  id: number;
  x: number;
  y: number;
  fidelity: number;
  t1: number;
  t2: number;
  freq: number;
  readout: number;
  crosstalk: number;
}

const VW = 820;
const VH = 540;

// Derive deterministic per-qubit properties from the material profile.
export function buildCanvasQubits(
  topologyId: TopologyId,
  material: MaterialProfile,
): CanvasQubit[] {
  const spec = getTopologySpec(topologyId);
  return spec.nodes.map((n, i) => {
    const jitter = Math.sin(i * 1.7 + 0.3) * 0.5 + 0.5; // 0..1 deterministic
    const j2 = Math.cos(i * 0.9 + 1.1) * 0.5 + 0.5;
    const fidelity = material.gate2QFidelity / 100 - (1 - jitter) * 0.006;
    return {
      id: i,
      x: n.x * VW,
      y: n.y * VH,
      fidelity,
      t1: material.t1Us > 9000 ? 9999 : material.t1Us * (0.8 + jitter * 0.4),
      t2: material.t2Us > 9000 ? 9999 : material.t2Us * (0.8 + j2 * 0.4),
      freq: 5.05 + jitter * 0.35,
      readout: material.readoutError * (0.7 + j2 * 0.6),
      crosstalk: material.crosstalk * (0.6 + jitter * 0.8),
    };
  });
}

export function sampleQubit(
  topologyId: TopologyId,
  material: MaterialProfile,
  id: number,
): CanvasQubit | null {
  return buildCanvasQubits(topologyId, material).find((q) => q.id === id) ?? null;
}

function colorFor(f: number) {
  if (f > 0.994) return ACCENT.cyan;
  if (f > 0.99) return ACCENT.green;
  if (f > 0.987) return ACCENT.amber;
  return "oklch(0.7 0.22 25)";
}

export function TopologyCanvas({
  topologyId,
  material,
  selected,
  onSelect,
  label,
  accent = "cyan",
  className,
}: {
  topologyId: TopologyId;
  material: MaterialProfile;
  selected?: number | null;
  onSelect?: (id: number | null) => void;
  label?: string;
  accent?: keyof typeof ACCENT;
  className?: string;
}) {
  const spec = useMemo(() => getTopologySpec(topologyId), [topologyId]);
  const qubits = useMemo(
    () => buildCanvasQubits(topologyId, material),
    [topologyId, material],
  );
  const edgeColor = ACCENT[accent];

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden rounded-md border border-border/60 bg-[oklch(0.14_0.02_250)]",
        className,
      )}
    >
      <div className="absolute inset-0 qa-grid-bg opacity-30" />
      <div className="absolute left-3 top-3 z-10 flex items-center gap-2 mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-cyan animate-pulse" />
        {label ?? "Live wafer · die A4"}
      </div>
      <div className="absolute right-3 top-3 z-10 mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {qubits.length} qubits · {spec.edges.length} couplers
      </div>
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <radialGradient id="qa-canvas-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={edgeColor} stopOpacity="0.7" />
            <stop offset="100%" stopColor={edgeColor} stopOpacity="0" />
          </radialGradient>
        </defs>
        {spec.edges.map(([a, b], i) => {
          const qa = qubits[a];
          const qb = qubits[b];
          if (!qa || !qb) return null;
          const touchesSel = selected === a || selected === b;
          return (
            <line
              key={i}
              x1={qa.x}
              y1={qa.y}
              x2={qb.x}
              y2={qb.y}
              stroke={edgeColor}
              strokeOpacity={touchesSel ? 0.9 : 0.4}
              strokeWidth={touchesSel ? 1.8 : 1}
            />
          );
        })}
        {qubits.map((q) => {
          const isSel = selected === q.id;
          const c = colorFor(q.fidelity);
          return (
            <g
              key={q.id}
              onClick={() => onSelect?.(isSel ? null : q.id)}
              className={onSelect ? "cursor-pointer" : undefined}
            >
              {isSel && <circle cx={q.x} cy={q.y} r={18} fill="url(#qa-canvas-glow)" />}
              <circle
                cx={q.x}
                cy={q.y}
                r={isSel ? 8 : 5.5}
                fill={c}
                fillOpacity={0.2}
                stroke={c}
                strokeWidth={isSel ? 2.2 : 1.3}
              />
              {isSel && (
                <text
                  x={q.x + 11}
                  y={q.y - 9}
                  fontSize="11"
                  fontFamily="JetBrains Mono"
                  fill="oklch(0.96 0.01 240)"
                >
                  Q{q.id}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="absolute bottom-3 right-3 z-10 flex items-center gap-3 rounded-md border border-border/60 bg-surface-2/80 px-2.5 py-1.5 mono text-[10px]">
        <LegendDot color={ACCENT.cyan} label="F > 99.4%" />
        <LegendDot color={ACCENT.green} label="> 99.0%" />
        <LegendDot color={ACCENT.amber} label="> 98.7%" />
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

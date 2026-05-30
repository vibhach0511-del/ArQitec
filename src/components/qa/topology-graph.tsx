import { cn } from "@/lib/utils";

type Node = { x: number; y: number };
type Spec = { nodes: Node[]; edges: [number, number][] };

function squareGrid(): Spec {
  const nodes: Node[] = [];
  const edges: [number, number][] = [];
  const cols = 6, rows = 5;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    nodes.push({ x: 20 + c * 28, y: 18 + r * 26 });
  }
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const i = r * cols + c;
    if (c < cols - 1) edges.push([i, i + 1]);
    if (r < rows - 1) edges.push([i, i + cols]);
  }
  return { nodes, edges };
}

function heavyHex(): Spec {
  const nodes: Node[] = [];
  const edges: [number, number][] = [];
  const cols = 7, rows = 6;
  const idMap = new Map<string, number>();
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    if ((r + c) % 3 === 2) continue;
    const x = 18 + c * 24 + (r % 2 ? 12 : 0);
    const y = 14 + r * 22;
    idMap.set(`${c},${r}`, nodes.length);
    nodes.push({ x, y });
  }
  for (const [k, id] of idMap) {
    const [c, r] = k.split(",").map(Number);
    for (const [nc, nr] of [[c + 1, r], [c, r + 1], [c - 1, r + 1]]) {
      const nid = idMap.get(`${nc},${nr}`);
      if (nid !== undefined) edges.push([id, nid]);
    }
  }
  return { nodes, edges };
}

function modular(): Spec {
  const nodes: Node[] = [];
  const edges: [number, number][] = [];
  const clusters = [{ cx: 45, cy: 40 }, { cx: 130, cy: 40 }, { cx: 45, cy: 110 }, { cx: 130, cy: 110 }];
  const perCluster = 6;
  const centers: number[] = [];
  clusters.forEach((cluster, ci) => {
    const start = nodes.length;
    for (let i = 0; i < perCluster; i++) {
      const a = (i / perCluster) * Math.PI * 2;
      nodes.push({ x: cluster.cx + Math.cos(a) * 20, y: cluster.cy + Math.sin(a) * 20 });
    }
    for (let i = 0; i < perCluster; i++) {
      edges.push([start + i, start + ((i + 1) % perCluster)]);
      edges.push([start + i, start + ((i + 2) % perCluster)]);
    }
    centers.push(start);
  });
  // long-range links
  edges.push([centers[0], centers[1]]);
  edges.push([centers[2], centers[3]]);
  edges.push([centers[0] + 3, centers[2] + 3]);
  edges.push([centers[1] + 3, centers[3] + 3]);
  return { nodes, edges };
}

function aiOpt(): Spec {
  const base = heavyHex();
  // add a few shortcut edges
  const extras: [number, number][] = [
    [0, 8], [3, 12], [5, 18], [10, 22], [14, 26],
  ].filter(([a, b]) => a < base.nodes.length && b < base.nodes.length) as [number, number][];
  return { nodes: base.nodes, edges: [...base.edges, ...extras] };
}

const SPECS: Record<string, () => Spec> = {
  square: squareGrid,
  "heavy-hex": heavyHex,
  modular,
  "ai-opt": aiOpt,
};

export function TopologyGraph({ id, accent = "cyan", className, height = 160 }: { id: string; accent?: "cyan" | "violet" | "green" | "amber"; className?: string; height?: number }) {
  const spec = (SPECS[id] ?? squareGrid)();
  const color = { cyan: "oklch(0.82 0.16 200)", violet: "oklch(0.7 0.21 295)", green: "oklch(0.78 0.18 150)", amber: "oklch(0.82 0.16 75)" }[accent];
  return (
    <div className={cn("relative rounded-md border border-border/60 bg-[oklch(0.14_0.02_250)] overflow-hidden", className)} style={{ height }}>
      <div className="absolute inset-0 qa-grid-bg opacity-25" />
      <svg viewBox="0 0 200 150" className="h-full w-full">
        {spec.edges.map(([a, b], i) => (
          <line key={i} x1={spec.nodes[a].x} y1={spec.nodes[a].y} x2={spec.nodes[b].x} y2={spec.nodes[b].y}
            stroke={color} strokeOpacity={0.5} strokeWidth={0.8} />
        ))}
        {spec.nodes.map((n, i) => (
          <circle key={i} cx={n.x} cy={n.y} r={2.4} fill={color} fillOpacity={0.25} stroke={color} strokeWidth={0.9} />
        ))}
      </svg>
    </div>
  );
}
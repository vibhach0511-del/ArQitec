// Geometry builders for topology coupler graphs.
// Each builder returns nodes in a normalized 0..1 x 0..1 box plus undirected
// edges (index pairs). Consumers scale to their own viewBox. This is the single
// source of truth for "render nodes and coupler edges from data".

import type { TopologyId } from "./types";

export interface GraphNode {
  x: number;
  y: number;
}
export type GraphEdge = [number, number];
export interface TopologySpec {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

function normalize(nodes: GraphNode[]): GraphNode[] {
  if (nodes.length === 0) return nodes;
  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  const pad = 0.08;
  return nodes.map((n) => ({
    x: pad + ((n.x - minX) / spanX) * (1 - 2 * pad),
    y: pad + ((n.y - minY) / spanY) * (1 - 2 * pad),
  }));
}

function squareGrid(cols = 8, rows = 6): TopologySpec {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) nodes.push({ x: c, y: r });
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      if (c < cols - 1) edges.push([i, i + 1]);
      if (r < rows - 1) edges.push([i, i + cols]);
    }
  return { nodes: normalize(nodes), edges };
}

function heavyHex(cols = 9, rows = 8): TopologySpec {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const idMap = new Map<string, number>();
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      if ((r + c) % 3 === 2) continue;
      const x = c + (r % 2 ? 0.5 : 0);
      const y = r * 0.92;
      idMap.set(`${c},${r}`, nodes.length);
      nodes.push({ x, y });
    }
  for (const [k, id] of idMap) {
    const [c, r] = k.split(",").map(Number);
    for (const [nc, nr] of [
      [c + 1, r],
      [c, r + 1],
      [c - 1, r + 1],
    ]) {
      const nid = idMap.get(`${nc},${nr}`);
      if (nid !== undefined) edges.push([id, nid]);
    }
  }
  return { nodes: normalize(nodes), edges };
}

function modular(): TopologySpec {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const clusters = [
    { cx: 0, cy: 0 },
    { cx: 3, cy: 0 },
    { cx: 0, cy: 3 },
    { cx: 3, cy: 3 },
  ];
  const perCluster = 7;
  const hubs: number[] = [];
  clusters.forEach((cl) => {
    const start = nodes.length;
    // central hub
    nodes.push({ x: cl.cx, y: cl.cy });
    hubs.push(start);
    for (let i = 0; i < perCluster - 1; i++) {
      const a = (i / (perCluster - 1)) * Math.PI * 2;
      nodes.push({ x: cl.cx + Math.cos(a) * 0.9, y: cl.cy + Math.sin(a) * 0.9 });
      edges.push([start, start + 1 + i]);
      edges.push([start + 1 + i, start + 1 + ((i + 1) % (perCluster - 1))]);
    }
  });
  edges.push([hubs[0], hubs[1]]);
  edges.push([hubs[2], hubs[3]]);
  edges.push([hubs[0], hubs[2]]);
  edges.push([hubs[1], hubs[3]]);
  return { nodes: normalize(nodes), edges };
}

function aiOptimized(): TopologySpec {
  const base = heavyHex(9, 8);
  const extras: GraphEdge[] = [];
  // deterministic long-range shortcuts on a heavy-hex backbone
  const n = base.nodes.length;
  for (const [a, b] of [
    [2, 10],
    [6, 16],
    [9, 22],
    [14, 28],
    [20, 34],
    [25, 40],
  ] as GraphEdge[]) {
    if (a < n && b < n) extras.push([a, b]);
  }
  return { nodes: base.nodes, edges: [...base.edges, ...extras] };
}

function randomMesh(count = 46): TopologySpec {
  // Deterministic pseudo-random placement + sparse irregular couplers.
  const nodes: GraphNode[] = [];
  let s = 1337;
  const rnd = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  for (let i = 0; i < count; i++) nodes.push({ x: rnd(), y: rnd() });
  const edges: GraphEdge[] = [];
  for (let i = 0; i < count; i++) {
    // connect to 1–2 nearest-ish nodes
    const dists = nodes
      .map((n, j) => ({ j, d: (n.x - nodes[i].x) ** 2 + (n.y - nodes[i].y) ** 2 }))
      .filter((o) => o.j !== i)
      .sort((a, b) => a.d - b.d);
    const k = 1 + Math.floor(rnd() * 2);
    for (let t = 0; t < k; t++) {
      const j = dists[t].j;
      if (!edges.some(([a, b]) => (a === i && b === j) || (a === j && b === i)))
        edges.push([i, j]);
    }
  }
  return { nodes: normalize(nodes), edges };
}

function maxConnectivity(count = 18): TopologySpec {
  // Nodes on a circle, near all-to-all couplers (dense).
  const nodes: GraphNode[] = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    nodes.push({ x: Math.cos(a), y: Math.sin(a) });
  }
  const edges: GraphEdge[] = [];
  for (let i = 0; i < count; i++)
    for (let j = i + 1; j < count; j++) {
      // skip a few of the longest chords to avoid total clutter
      const span = Math.min(Math.abs(i - j), count - Math.abs(i - j));
      if (span <= count / 2 - 1) edges.push([i, j]);
    }
  return { nodes: normalize(nodes), edges };
}

const BUILDERS: Record<TopologyId, () => TopologySpec> = {
  square: () => squareGrid(),
  "heavy-hex": () => heavyHex(),
  modular,
  "ai-opt": aiOptimized,
  random: () => randomMesh(),
  "max-connectivity": () => maxConnectivity(),
};

const cache = new Map<TopologyId, TopologySpec>();

export function getTopologySpec(id: TopologyId): TopologySpec {
  if (!cache.has(id)) cache.set(id, (BUILDERS[id] ?? squareGrid)());
  return cache.get(id)!;
}

/** Average node degree implied purely by the geometry. */
export function geometricAvgDegree(id: TopologyId): number {
  const spec = getTopologySpec(id);
  if (spec.nodes.length === 0) return 0;
  return (2 * spec.edges.length) / spec.nodes.length;
}

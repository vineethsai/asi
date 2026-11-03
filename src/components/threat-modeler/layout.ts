import Dagre from "@dagrejs/dagre";
import { fitBoundariesToChildren } from "./canvasOps";
import { nodeSize } from "./export/geometry";
import { orderByParent } from "./persistence";
import type { CanvasEdge, CanvasNode } from "./types";

/**
 * "Tidy" layout (§7.5): dagre compound graph with trust boundaries as
 * clusters and measured node sizes. Returns the laid-out nodes (positions
 * relative to their parent boundary, boundaries resized to their children).
 */
export function tidyLayout(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  options: { rankdir?: "TB" | "LR" } = {},
): CanvasNode[] {
  const boundaries = new Set(nodes.filter((n) => n.type === "trustBoundary").map((n) => n.id));
  const run = (compound: boolean) => {
    const g = new Dagre.graphlib.Graph({ compound }).setDefaultEdgeLabel(() => ({}));
    g.setGraph({
      rankdir: options.rankdir ?? "TB",
      nodesep: 70,
      ranksep: 90,
      marginx: 20,
      marginy: 20,
    });
    for (const n of nodes) {
      if (boundaries.has(n.id)) {
        if (compound)
          g.setNode(n.id, { paddingTop: 40, paddingLeft: 24, paddingRight: 24, paddingBottom: 24 });
        continue;
      }
      const s = nodeSize(n);
      g.setNode(n.id, { width: s.width, height: s.height });
    }
    if (compound)
      for (const n of nodes)
        if (n.parentId && boundaries.has(n.parentId) && g.hasNode(n.id))
          g.setParent(n.id, n.parentId);
    for (const e of edges)
      if (
        g.hasNode(e.source) &&
        g.hasNode(e.target) &&
        !boundaries.has(e.source) &&
        !boundaries.has(e.target)
      )
        g.setEdge(e.source, e.target);
    Dagre.layout(g);
    return g;
  };
  let g: Dagre.graphlib.Graph;
  try {
    g = run(boundaries.size > 0);
  } catch {
    g = run(false);
  }
  // Absolute top-left corners from dagre centres.
  const abs = new Map<string, { x: number; y: number }>();
  for (const n of nodes) {
    const p = g.node(n.id) as { x: number; y: number; width?: number; height?: number } | undefined;
    if (!p || !Number.isFinite(p.x)) continue;
    const s = boundaries.has(n.id) ? { width: p.width ?? 0, height: p.height ?? 0 } : nodeSize(n);
    abs.set(n.id, { x: p.x - s.width / 2, y: p.y - s.height / 2 });
  }
  const laid = nodes.map((n) => {
    const a = abs.get(n.id);
    if (!a) return n;
    const parent = n.parentId ? abs.get(n.parentId) : undefined;
    return {
      ...n,
      position: { x: Math.round(a.x - (parent?.x ?? 0)), y: Math.round(a.y - (parent?.y ?? 0)) },
    };
  });
  return orderByParent(fitBoundariesToChildren(laid));
}

/** Interpolated node positions between two layouts (t = 0…1, ease-out). */
export function interpolatePositions(
  from: CanvasNode[],
  to: CanvasNode[],
  t: number,
): CanvasNode[] {
  const e = 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);
  const start = new Map(from.map((n) => [n.id, n]));
  return to.map((n) => {
    const s = start.get(n.id);
    if (!s || s.parentId !== n.parentId) return n;
    return {
      ...n,
      position: {
        x: s.position.x + (n.position.x - s.position.x) * e,
        y: s.position.y + (n.position.y - s.position.y) * e,
      },
    };
  });
}

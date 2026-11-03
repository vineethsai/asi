import type { ThreatModelDocument } from "./document";
import { isValidConnection, nextEdgeId } from "./engine/graph";
import { absolutePosition, nodeSize } from "./export/geometry";
import { orderByParent } from "./persistence";
import type { PaletteEntry } from "./paletteData";
import {
  DEFAULT_EDGE_METADATA,
  MaestroLayer,
  type CanvasEdge,
  type CanvasEdgeData,
  type CanvasNode,
  type CanvasNodeData,
} from "./types";

/**
 * Pure graph operations used by the canvas (P3-25). Every function takes and
 * returns plain document parts, so the store can commit the result and tests
 * can call them directly.
 */

let nodeCounter = 0;
export function genNodeId(existing?: { id: string }[]): string {
  const used = existing ? new Set(existing.map((n) => n.id)) : null;
  let id: string;
  do {
    nodeCounter += 1;
    id = `node-${Date.now().toString(36)}-${nodeCounter}`;
  } while (used?.has(id));
  return id;
}

const isBoundary = (n: CanvasNode) => n.type === "trustBoundary";
const byIdMap = (nodes: CanvasNode[]) => new Map(nodes.map((n) => [n.id, n]));

export const BOUNDARY_DEFAULT = { width: 320, height: 220 } as const;

/** A fresh node for a palette entry at an absolute flow position. */
export function createNode(
  entry: PaletteEntry,
  position: { x: number; y: number },
  existing: CanvasNode[] = [],
): CanvasNode {
  const data = JSON.parse(JSON.stringify(entry.data)) as CanvasNodeData;
  data.threats = [];
  const boundary = entry.nodeType === "trustBoundary";
  return {
    id: genNodeId(existing),
    type: entry.nodeType,
    position: { x: Math.round(position.x), y: Math.round(position.y) },
    data,
    ...(boundary
      ? {
          zIndex: -10,
          style: { width: BOUNDARY_DEFAULT.width, height: BOUNDARY_DEFAULT.height, zIndex: -10 },
        }
      : {}),
  };
}

/** Absolute bounding box of a node. */
export function nodeBox(node: CanvasNode, byId: Map<string, CanvasNode>) {
  const p = absolutePosition(node, byId);
  const s = nodeSize(node);
  return { x: p.x, y: p.y, width: s.width, height: s.height };
}

function ancestors(id: string, byId: Map<string, CanvasNode>): Set<string> {
  const out = new Set<string>();
  let cur = byId.get(id)?.parentId;
  while (cur && !out.has(cur)) {
    out.add(cur);
    cur = byId.get(cur)?.parentId;
  }
  return out;
}

/** Re-parent a node (keeps its absolute position). */
export function reparent(
  node: CanvasNode,
  parentId: string | undefined,
  byId: Map<string, CanvasNode>,
): CanvasNode {
  if (node.parentId === parentId) return node;
  const abs = absolutePosition(node, byId);
  const parent = parentId ? byId.get(parentId) : undefined;
  const base = parent ? absolutePosition(parent, byId) : { x: 0, y: 0 };
  const next: CanvasNode = { ...node, position: { x: abs.x - base.x, y: abs.y - base.y } };
  if (parentId) next.parentId = parentId;
  else delete next.parentId;
  delete (next as { extent?: unknown }).extent;
  return next;
}

/**
 * Drop containment (§7.5): each moved node (component or boundary) becomes a
 * child of the innermost trust boundary containing its centre, or leaves its
 * boundary when dragged out. Boundaries nest; a boundary never contains itself
 * or an ancestor. Returns null when nothing changed.
 */
export function applyContainment(
  nodes: CanvasNode[],
  movedIds: Iterable<string>,
): CanvasNode[] | null {
  let current = nodes;
  let changed = false;
  for (const id of movedIds) {
    const byId = byIdMap(current);
    const node = byId.get(id);
    if (!node) continue;
    const target = findDropTarget(current, id) ?? undefined;
    if (target !== node.parentId) {
      const moved = reparent(node, target, byId);
      current = orderByParent(current.map((n) => (n.id === id ? moved : n)));
      changed = true;
    }
  }
  return changed ? current : null;
}

/** Innermost trust boundary containing the centre of node `id` (null = none). */
export function findDropTarget(nodes: CanvasNode[], id: string): string | null {
  const byId = byIdMap(nodes);
  const node = byId.get(id);
  if (!node) return null;
  const box = nodeBox(node, byId);
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  let best: { id: string; area: number } | null = null;
  for (const b of nodes) {
    if (!isBoundary(b) || b.id === id) continue;
    if (ancestors(b.id, byId).has(id)) continue; // b is inside the moved node
    const bb = nodeBox(b, byId);
    if (isBoundary(node) && bb.width * bb.height <= box.width * box.height) continue;
    if (cx >= bb.x && cx <= bb.x + bb.width && cy >= bb.y && cy <= bb.y + bb.height) {
      const area = bb.width * bb.height;
      if (!best || area < best.area) best = { id: b.id, area };
    }
  }
  return best?.id ?? null;
}

/**
 * Grow trust boundaries so they wrap their children (after tidy / drops).
 * Innermost first so nested boundaries resize their parents correctly.
 */
export function fitBoundariesToChildren(nodes: CanvasNode[], pad = 24, top = 40): CanvasNode[] {
  let current = nodes;
  const depth = (n: CanvasNode, byId: Map<string, CanvasNode>) => ancestors(n.id, byId).size;
  const boundaries = current
    .filter(isBoundary)
    .sort((a, b) => depth(b, byIdMap(current)) - depth(a, byIdMap(current)));
  for (const b of boundaries) {
    const byId = byIdMap(current);
    const kids = current.filter((n) => n.parentId === b.id);
    if (!kids.length) continue;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const k of kids) {
      const s = nodeSize(k);
      minX = Math.min(minX, k.position.x);
      minY = Math.min(minY, k.position.y);
      maxX = Math.max(maxX, k.position.x + s.width);
      maxY = Math.max(maxY, k.position.y + s.height);
    }
    // Shift children so the top-left padding holds, and move the boundary to compensate.
    const dx = minX < pad ? pad - minX : minX > pad ? pad - minX : 0;
    const dy = minY < top ? top - minY : minY > top ? top - minY : 0;
    const self = byId.get(b.id)!;
    const width = Math.max(200, maxX - minX + 2 * pad);
    const height = Math.max(150, maxY - minY + top + pad);
    current = current.map((n) => {
      if (n.parentId === b.id)
        return { ...n, position: { x: n.position.x + dx, y: n.position.y + dy } };
      if (n.id === b.id)
        return {
          ...self,
          position: { x: self.position.x - dx, y: self.position.y - dy },
          width: undefined,
          height: undefined,
          style: { ...(self.style ?? {}), width, height },
        };
      return n;
    });
  }
  return current;
}

/**
 * Delete nodes and edges. Children of a deleted boundary keep their absolute
 * position and move to the boundary's parent (P3-25); flows touching deleted
 * nodes go too.
 */
export function deleteElements(
  doc: Pick<ThreatModelDocument, "nodes" | "edges">,
  nodeIds: Iterable<string>,
  edgeIds: Iterable<string> = [],
): { nodes: CanvasNode[]; edges: CanvasEdge[] } {
  const del = new Set(nodeIds);
  const delEdges = new Set(edgeIds);
  let nodes = doc.nodes;
  // Re-parent surviving children, innermost deleted boundary first.
  for (const id of del) {
    const byId = byIdMap(nodes);
    const gone = byId.get(id);
    if (!gone) continue;
    let newParent = gone.parentId;
    while (newParent && del.has(newParent)) newParent = byId.get(newParent)?.parentId;
    nodes = nodes.map((n) =>
      n.parentId === id && !del.has(n.id) ? reparent(n, newParent, byId) : n,
    );
  }
  return {
    nodes: orderByParent(nodes.filter((n) => !del.has(n.id))),
    edges: doc.edges.filter((e) => !delEdges.has(e.id) && !del.has(e.source) && !del.has(e.target)),
  };
}

export interface Clipboard {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

/** Copy nodes (with descendants of copied boundaries) and the flows between them. */
export function copySelection(
  doc: Pick<ThreatModelDocument, "nodes" | "edges">,
  ids: string[],
): Clipboard | null {
  if (!ids.length) return null;
  const set = new Set(ids);
  let grew = true;
  while (grew) {
    grew = false;
    for (const n of doc.nodes)
      if (n.parentId && set.has(n.parentId) && !set.has(n.id)) {
        set.add(n.id);
        grew = true;
      }
  }
  const byId = byIdMap(doc.nodes);
  const nodes = doc.nodes
    .filter((n) => set.has(n.id))
    .map((n) => {
      // Parents outside the copy are dropped: store the absolute position.
      if (n.parentId && !set.has(n.parentId)) return reparent(n, undefined, byId);
      return n;
    });
  const edges = doc.edges.filter((e) => set.has(e.source) && set.has(e.target));
  return JSON.parse(JSON.stringify({ nodes, edges })) as Clipboard;
}

/** Paste a clipboard with fresh ids, offset by `offset`; returns the new parts and new node ids. */
export function pasteClipboard(
  doc: Pick<ThreatModelDocument, "nodes" | "edges">,
  clip: Clipboard,
  offset = { x: 40, y: 40 },
): { nodes: CanvasNode[]; edges: CanvasEdge[]; newIds: string[] } {
  const idMap = new Map<string, string>();
  const all = [...doc.nodes];
  for (const n of clip.nodes) {
    const id = genNodeId(all);
    idMap.set(n.id, id);
    all.push({ ...n, id });
  }
  const pasted = clip.nodes.map((n) => {
    const next: CanvasNode = {
      ...n,
      id: idMap.get(n.id)!,
      selected: true,
      data: { ...n.data, threats: [] },
      position:
        n.parentId && idMap.has(n.parentId)
          ? n.position
          : { x: n.position.x + offset.x, y: n.position.y + offset.y },
    };
    if (n.parentId && idMap.has(n.parentId)) next.parentId = idMap.get(n.parentId);
    else delete next.parentId;
    return next;
  });
  let edges = doc.edges;
  for (const e of clip.edges) {
    const id = nextEdgeId(edges);
    edges = [
      ...edges,
      {
        ...e,
        id,
        source: idMap.get(e.source)!,
        target: idMap.get(e.target)!,
        selected: false,
        data: { ...(e.data as CanvasEdgeData), threats: [] },
      },
    ];
  }
  return {
    nodes: orderByParent([
      ...doc.nodes.map((n) => (n.selected ? { ...n, selected: false } : n)),
      ...pasted,
    ]),
    edges,
    newIds: pasted.map((n) => n.id),
  };
}

/** Wrap nodes in a new trust boundary (nested inside their common boundary, if any). */
export function groupInBoundary(
  nodes: CanvasNode[],
  ids: string[],
): { nodes: CanvasNode[]; boundaryId: string } | null {
  const targets = nodes.filter((n) => ids.includes(n.id));
  if (!targets.length) return null;
  const byId = byIdMap(nodes);
  const boxes = targets.map((n) => nodeBox(n, byId));
  const minX = Math.min(...boxes.map((b) => b.x));
  const minY = Math.min(...boxes.map((b) => b.y));
  const maxX = Math.max(...boxes.map((b) => b.x + b.width));
  const maxY = Math.max(...boxes.map((b) => b.y + b.height));
  const parents = new Set(targets.map((n) => n.parentId));
  const commonParent = parents.size === 1 ? [...parents][0] : undefined;
  const boundaryId = genNodeId(nodes);
  const parentAbs =
    commonParent && byId.get(commonParent)
      ? absolutePosition(byId.get(commonParent)!, byId)
      : { x: 0, y: 0 };
  const boundary: CanvasNode = {
    id: boundaryId,
    type: "trustBoundary",
    position: { x: minX - 30 - parentAbs.x, y: minY - 50 - parentAbs.y },
    ...(commonParent ? { parentId: commonParent } : {}),
    zIndex: -10,
    style: { width: maxX - minX + 60, height: maxY - minY + 80, zIndex: -10 },
    data: {
      label: "Trust Boundary",
      category: "trust-boundary",
      maestroLayers: [MaestroLayer.SecurityCompliance],
      trustLevel: "trusted",
      threats: [],
    },
  };
  const withBoundary = [...nodes, boundary];
  const map2 = byIdMap(withBoundary);
  const next = withBoundary.map((n) => (ids.includes(n.id) ? reparent(n, boundaryId, map2) : n));
  return { nodes: orderByParent(next), boundaryId };
}

export function nudge(nodes: CanvasNode[], ids: Set<string>, dx: number, dy: number): CanvasNode[] {
  return nodes.map((n) =>
    ids.has(n.id) && !(n.parentId && ids.has(n.parentId))
      ? { ...n, position: { x: n.position.x + dx, y: n.position.y + dy } }
      : n,
  );
}

const zOf = (n: CanvasNode) =>
  ((n.style as Record<string, number> | undefined)?.zIndex ?? n.zIndex ?? 0) as number;

export function reorder(
  nodes: CanvasNode[],
  ids: Set<string>,
  mode: "front" | "back" | "forward" | "backward",
): CanvasNode[] {
  const all = nodes.map(zOf);
  const max = Math.max(0, ...all);
  const min = Math.min(0, ...all);
  return nodes.map((n) => {
    if (!ids.has(n.id)) return n;
    const cur = zOf(n);
    const z =
      mode === "front"
        ? max + 1
        : mode === "back"
          ? min - 1
          : mode === "forward"
            ? cur + 1
            : cur - 1;
    return { ...n, zIndex: z, style: { ...(n.style ?? {}), zIndex: z } };
  });
}

/** A new data flow, or null when the connection is invalid (self-loop, actor→actor, duplicate…). */
export function connect(
  doc: Pick<ThreatModelDocument, "nodes" | "edges">,
  source: string,
  target: string,
  handles: { sourceHandle?: string | null; targetHandle?: string | null } = {},
): CanvasEdge | null {
  if (!isValidConnection({ source, target }, doc.nodes, doc.edges)) return null;
  return {
    id: nextEdgeId(doc.edges),
    source,
    target,
    ...(handles.sourceHandle ? { sourceHandle: handles.sourceHandle } : {}),
    ...(handles.targetHandle ? { targetHandle: handles.targetHandle } : {}),
    type: "dataFlow",
    data: { ...DEFAULT_EDGE_METADATA, customMetadata: {}, threats: [] },
  } as CanvasEdge;
}

/** Edges whose posture came from an import and was never confirmed (P0-12 posture prompt). */
export function unverifiedEdges(edges: CanvasEdge[]): CanvasEdge[] {
  return edges.filter((e) => e.data?.customMetadata?.postureUnverified === "true");
}

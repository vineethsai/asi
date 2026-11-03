import {
  DEFAULT_EDGE_METADATA,
  type CanvasEdge,
  type CanvasEdgeData,
  type CanvasNode,
  type CanvasNodeData,
  type GuardrailCoverage,
  type SemanticKind,
} from "../types";
import { buildNodeProfiles, type NodeRiskProfile } from "./nodeProfile";
import {
  AGENT_KINDS,
  AI_KINDS,
  CONTROL_KINDS,
  GATE_KINDS,
  MODEL_KINDS,
  STORE_KINDS,
  TOOL_KINDS,
  guardrailCoverage,
  resolveKind,
} from "./semantics";
import { stableHash, stableStringify } from "./hash";

// ─── Graph view used by every engine module ─────────────────────

export interface NodeInfo {
  id: string;
  node: CanvasNode;
  data: CanvasNodeData;
  label: string;
  kind: SemanticKind;
  profile: NodeRiskProfile;
  /** Nearest enclosing trust boundary id (parent chain), if any. */
  boundaryId?: string;
  isActor: boolean;
  isExternal: boolean;
  /** Where attacker-controlled input can originate: actors, external systems, untrusted nodes. */
  isEntry: boolean;
  isAI: boolean;
  isAgent: boolean;
  isModel: boolean;
  isTool: boolean;
  isStore: boolean;
  isGate: boolean;
  isHitl: boolean;
  isGuardrail: boolean;
  isObservability: boolean;
  isIdentity: boolean;
  isControl: boolean;
  /** Tool/infra able to execute code or change state irreversibly. */
  isPrivileged: boolean;
  isExecution: boolean;
  isSensitive: boolean;
  coverage: Set<GuardrailCoverage>;
}

export interface EdgeInfo {
  id: string;
  edge: CanvasEdge;
  data: CanvasEdgeData;
  source: string;
  target: string;
  encrypted: boolean;
  authenticated: boolean;
  /** authenticated AND encrypted — stops propagation (P3-03). */
  secure: boolean;
  /** carries PII or Confidential/Restricted data. */
  sensitive: boolean;
  crossesBoundary: boolean;
}

/** One step of attacker influence: along a flow, or back along a call as its response. */
export interface InfluenceHop {
  from: string;
  to: string;
  edgeId: string;
  dir: "forward" | "response";
}

export interface ModelGraph {
  nodes: NodeInfo[];
  nodeById: Map<string, NodeInfo>;
  boundaries: CanvasNode[];
  edges: EdgeInfo[];
  edgeById: Map<string, EdgeInfo>;
  out: Map<string, EdgeInfo[]>;
  in: Map<string, EdgeInfo[]>;
  influence: Map<string, InfluenceHop[]>;
  neighbours: Map<string, Set<string>>;
  entries: string[];
  profiles: Map<string, NodeRiskProfile>;
}

const SENSITIVE_DATA = new Set(["pii", "credentials", "regulated"]);

export function isAuthenticated(data?: Partial<CanvasEdgeData>): boolean {
  const auth = (data?.authentication ?? "").trim().toLowerCase();
  return auth !== "" && auth !== "none";
}

export function isSecureEdge(data?: Partial<CanvasEdgeData>): boolean {
  return !!data?.encrypted && isAuthenticated(data);
}

function nearestBoundary(
  node: CanvasNode | undefined,
  rawById: Map<string, CanvasNode>,
): string | undefined {
  let parentId = node?.parentId;
  const seen = new Set<string>();
  while (parentId && !seen.has(parentId)) {
    seen.add(parentId);
    const parent = rawById.get(parentId);
    if (!parent) return undefined;
    if (parent.type === "trustBoundary") return parent.id;
    parentId = parent.parentId;
  }
  return undefined;
}

/**
 * The single definition of "this flow crosses a trust boundary" (P3-04):
 * the nearest enclosing boundaries of source and target differ. Two nodes
 * that are both outside every boundary do not cross one.
 */
export function crossesBoundary(
  edge: Pick<CanvasEdge, "source" | "target">,
  nodes: CanvasNode[] | Map<string, CanvasNode>,
): boolean {
  const byId = nodes instanceof Map ? nodes : new Map(nodes.map((n) => [n.id, n]));
  const a = nearestBoundary(byId.get(edge.source), byId);
  const b = nearestBoundary(byId.get(edge.target), byId);
  return a !== b;
}

export function getBoundaryId(nodeId: string, nodes: CanvasNode[]): string | undefined {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  return nearestBoundary(byId.get(nodeId), byId);
}

function isResponder(kind: SemanticKind): boolean {
  return kind !== "actor" && kind !== "boundary";
}

export function buildGraph(rawNodes: CanvasNode[], rawEdges: CanvasEdge[]): ModelGraph {
  const rawById = new Map(rawNodes.map((n) => [n.id, n]));
  const profiles = buildNodeProfiles(rawNodes);
  const nodes: NodeInfo[] = [];
  const boundaries: CanvasNode[] = [];
  for (const node of rawNodes) {
    if (node.type === "trustBoundary") {
      boundaries.push(node);
      continue;
    }
    if (!node.data) continue;
    const kind = resolveKind(node);
    const profile = profiles.get(node.id)!;
    const isActor = kind === "actor";
    const isExternal = kind === "external";
    const isExecution = profile.isExecutionCapable || /^kc6\.2/.test(node.data.componentId ?? "");
    const isTool = TOOL_KINDS.has(kind);
    nodes.push({
      id: node.id,
      node,
      data: node.data,
      label: node.data.label ?? node.id,
      kind,
      profile,
      boundaryId: nearestBoundary(node, rawById),
      isActor,
      isExternal,
      isEntry: isActor || isExternal || node.data.trustLevel === "untrusted",
      isAI: AI_KINDS.has(kind),
      isAgent: AGENT_KINDS.has(kind),
      isModel: MODEL_KINDS.has(kind),
      isTool,
      isStore: STORE_KINDS.has(kind),
      isGate: GATE_KINDS.has(kind),
      isHitl: kind === "hitl-gate",
      isGuardrail: kind === "guardrail",
      isObservability: kind === "observability",
      isIdentity: kind === "identity",
      isControl: CONTROL_KINDS.has(kind),
      isPrivileged:
        (isTool || isExternal) &&
        (isExecution ||
          profile.accessDanger === "dangerous" ||
          profile.accessDanger === "critical" ||
          /^kc6\.(2|5|6|7)/.test(node.data.componentId ?? "")),
      isExecution,
      isSensitive: SENSITIVE_DATA.has(node.data.dataSensitivity ?? "none"),
      coverage: guardrailCoverage(kind, node.data.semantics),
    });
  }
  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  const edges: EdgeInfo[] = [];
  for (const edge of rawEdges) {
    if (!nodeById.has(edge.source) || !nodeById.has(edge.target)) continue;
    if (edge.source === edge.target) continue;
    const data = { ...DEFAULT_EDGE_METADATA, threats: [], ...(edge.data ?? {}) } as CanvasEdgeData;
    const authenticated = isAuthenticated(data);
    edges.push({
      id: edge.id,
      edge,
      data,
      source: edge.source,
      target: edge.target,
      encrypted: !!data.encrypted,
      authenticated,
      secure: !!data.encrypted && authenticated,
      sensitive:
        !!data.containsPII ||
        data.dataClassification === "Confidential" ||
        data.dataClassification === "Restricted",
      crossesBoundary: crossesBoundary(edge, rawById),
    });
  }
  edges.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const edgeById = new Map(edges.map((e) => [e.id, e]));

  const out = new Map<string, EdgeInfo[]>();
  const inn = new Map<string, EdgeInfo[]>();
  const influence = new Map<string, InfluenceHop[]>();
  const neighbours = new Map<string, Set<string>>();
  for (const n of nodes) {
    out.set(n.id, []);
    inn.set(n.id, []);
    influence.set(n.id, []);
    neighbours.set(n.id, new Set());
  }
  for (const e of edges) {
    out.get(e.source)!.push(e);
    inn.get(e.target)!.push(e);
    neighbours.get(e.source)!.add(e.target);
    neighbours.get(e.target)!.add(e.source);
    influence.get(e.source)!.push({ from: e.source, to: e.target, edgeId: e.id, dir: "forward" });
    const tgt = nodeById.get(e.target)!;
    if (e.data.bidirectional) {
      influence.get(e.target)!.push({ from: e.target, to: e.source, edgeId: e.id, dir: "forward" });
    } else if (isResponder(tgt.kind)) {
      influence
        .get(e.target)!
        .push({ from: e.target, to: e.source, edgeId: e.id, dir: "response" });
    }
  }

  return {
    nodes,
    nodeById,
    boundaries,
    edges,
    edgeById,
    out,
    in: inn,
    influence,
    neighbours,
    entries: nodes.filter((n) => n.isEntry).map((n) => n.id),
    profiles,
  };
}

// ─── Reachability ────────────────────────────────────────────────

export type GateKind = GuardrailCoverage | "hitl";

/** Does `node` block traversal for any of `kinds` when entered in direction `dir`? */
export function gateBlocks(node: NodeInfo, kinds: GateKind[], dir: InfluenceHop["dir"]): boolean {
  if (kinds.length === 0) return false;
  if (node.isHitl) return kinds.includes("hitl");
  if (!node.isGuardrail) return false;
  for (const k of kinds) {
    if (k === "hitl") continue;
    if (k === "output" ? dir === "response" && node.coverage.has("output") : node.coverage.has(k))
      return true;
  }
  return false;
}

export interface ReachInfo {
  /** Influence hops from the nearest entry; Infinity when unreachable. */
  hops: number;
  /** Shortest influence path from an entry (node ids, entry first). */
  path: string[];
  edgeIds: string[];
}

/**
 * Multi-source BFS over the influence graph from `sources`. Nodes that block
 * one of `blockedBy` gate kinds are reached but not expanded, so anything
 * behind them counts as "only reachable through a gate".
 */
export function reachFrom(
  graph: ModelGraph,
  sources: string[],
  blockedBy: GateKind[] = [],
): Map<string, ReachInfo> {
  const result = new Map<string, ReachInfo>();
  const queue: string[] = [];
  for (const s of [...sources].sort()) {
    if (!graph.nodeById.has(s) || result.has(s)) continue;
    result.set(s, { hops: 0, path: [s], edgeIds: [] });
    queue.push(s);
  }
  while (queue.length > 0) {
    const id = queue.shift()!;
    const cur = result.get(id)!;
    const node = graph.nodeById.get(id)!;
    for (const hop of graph.influence.get(id) ?? []) {
      if (result.has(hop.to)) continue;
      const next = graph.nodeById.get(hop.to)!;
      result.set(hop.to, {
        hops: cur.hops + 1,
        path: [...cur.path, hop.to],
        edgeIds: [...cur.edgeIds, hop.edgeId],
      });
      // A gate is reached but does not let the influence through.
      if (gateBlocks(next, blockedBy, hop.dir)) continue;
      if (next.isActor && cur.hops > 0) continue; // humans do not relay
      queue.push(hop.to);
    }
    void node;
  }
  return result;
}

// ─── Editor helpers (exported for the UI) ────────────────────────

/**
 * Connection validity for React Flow's `isValidConnection`: no self-loops,
 * no actor→actor flows, nothing to/from trust boundaries, no duplicates.
 */
export function isValidConnection(
  conn: { source?: string | null; target?: string | null },
  nodes: CanvasNode[],
  edges: CanvasEdge[] = [],
): boolean {
  if (!conn.source || !conn.target || conn.source === conn.target) return false;
  const src = nodes.find((n) => n.id === conn.source);
  const tgt = nodes.find((n) => n.id === conn.target);
  if (!src || !tgt) return false;
  if (src.type === "trustBoundary" || tgt.type === "trustBoundary") return false;
  const isActorLike = (n: CanvasNode) =>
    n.type === "actor" || n.data?.category === "actor" || n.data?.category === "external";
  if (isActorLike(src) && isActorLike(tgt)) return false;
  return !edges.some((e) => e.source === conn.source && e.target === conn.target);
}

/** Collision-free edge id generator (replaces `edge-${Date.now()}`). */
export function createEdgeIdFactory(existing: { id: string }[] = [], prefix = "edge") {
  const re = new RegExp(`^${prefix}-(\\d+)$`);
  const used = new Set(existing.map((e) => e.id));
  let counter = 0;
  for (const e of existing) {
    const m = re.exec(e.id);
    if (m) counter = Math.max(counter, Number(m[1]));
  }
  return () => {
    let id: string;
    do {
      counter += 1;
      id = `${prefix}-${counter}`;
    } while (used.has(id));
    used.add(id);
    return id;
  };
}

export function nextEdgeId(existing: { id: string }[], prefix = "edge"): string {
  return createEdgeIdFactory(existing, prefix)();
}

const VOLATILE_NODE_DATA = new Set(["threats"]);

/**
 * Structural fingerprint of the model: changes whenever anything the engine
 * reads changes (all node/edge metadata, containment, semantics, applied
 * mitigations) and never for positions, selection or threat badges.
 */
export function modelFingerprint(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  extra?: unknown,
): string {
  const nodePart = nodes
    .map((n) => {
      const data: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(n.data ?? {})) {
        if (!VOLATILE_NODE_DATA.has(k)) data[k] = v;
      }
      return stableStringify({ id: n.id, type: n.type, parentId: n.parentId, data });
    })
    .sort();
  const edgePart = edges
    .map((e) => {
      const data: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(e.data ?? {})) {
        if (k !== "threats") data[k] = v;
      }
      return stableStringify({ id: e.id, source: e.source, target: e.target, data });
    })
    .sort();
  return stableHash(`${nodePart.join("|")}::${edgePart.join("|")}::${stableStringify(extra)}`);
}

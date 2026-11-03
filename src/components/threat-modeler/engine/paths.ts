import type { GeneratedThreat, Severity } from "../types";
import type { EdgeInfo, InfluenceHop, ModelGraph, NodeInfo } from "./graph";
import { stableHash } from "./hash";
import { severityFromScore } from "./severity";

export interface AttackPathHop {
  from: string;
  to: string;
  edgeId: string;
  dir: InfluenceHop["dir"];
  likelihood: number;
  /** Human-readable step for the path animation / report. */
  text: string;
}

/** Legacy fields first (AttackPathPanel / exports), Phase 3 fields after. */
export interface AttackPath {
  id: string;
  name: string;
  description: string;
  nodes: string[];
  edges: string[];
  severity: Severity;
  /** 0–25, same scale as threat scores. */
  score: number;
  threats: string[];
  entryPoint: string;
  target: string;
  hops: AttackPathHop[];
  likelihood: number;
  targetImpact: number;
  residualScore: number;
  gatesPassed: string[];
}

export interface AttackPathResult {
  paths: AttackPath[];
  /** More paths were found than `limit`. */
  truncated: boolean;
  total: number;
  /** Paths that would exist but are broken by an HITL gate. */
  brokenByGates: number;
}

const MAX_NODES = 7;
const MAX_ENUMERATED = 5000;

/** Impact of reaching a target, 0 = not a target. */
export function targetImpact(n: NodeInfo, graph: ModelGraph): number {
  if (n.isActor || n.isExternal || n.isControl) return 0;
  const d = n.data;
  if (n.isExecution || n.profile.accessDanger === "critical") return 5;
  if (d.dataSensitivity === "credentials" || d.dataSensitivity === "regulated") return 5;
  if (n.isPrivileged) return 4;
  if (d.dataSensitivity === "pii") return 4;
  if (n.isStore) {
    const sensitiveFlow = [...(graph.in.get(n.id) ?? []), ...(graph.out.get(n.id) ?? [])].some(
      (e) => e.sensitive,
    );
    return sensitiveFlow ? 4 : 3;
  }
  if (n.kind === "training-pipeline") return 3;
  return 0;
}

function hopLikelihood(e: EdgeInfo, dir: InfluenceHop["dir"]): number {
  if (dir === "response") return 0.7;
  if (!e.authenticated && !e.encrypted) return 0.9;
  if (!e.authenticated) return 0.75;
  if (!e.encrypted) return 0.6;
  return 0.45;
}

function postureText(e: EdgeInfo): string {
  const a = e.authenticated ? `auth ${e.data.authentication}` : "unauthenticated";
  return `${a}, ${e.encrypted ? "encrypted" : "unencrypted"}`;
}

/**
 * Directed attack paths (§7.2.5) from entry points to high-impact targets
 * over the influence graph. Score = weakest link (the most exploitable hop)
 * × target impact × length penalty × guardrail factor; HITL gates break
 * paths. Ids are a hash of the node sequence, so they are stable.
 */
export function findAttackPaths(
  graph: ModelGraph,
  threats: GeneratedThreat[],
  limit = 20,
): AttackPathResult {
  const targets = new Map<string, number>();
  for (const n of graph.nodes) {
    const imp = targetImpact(n, graph);
    if (imp > 0) targets.set(n.id, imp);
  }
  const found: AttackPath[] = [];
  let enumerated = 0;
  let broken = 0;

  const threatsByNode = new Map<string, GeneratedThreat[]>();
  const threatsByEdge = new Map<string, GeneratedThreat[]>();
  for (const t of threats) {
    for (const id of t.affectedNodeIds) {
      if (!threatsByNode.has(id)) threatsByNode.set(id, []);
      threatsByNode.get(id)!.push(t);
    }
    for (const id of t.affectedEdgeIds) {
      if (!threatsByEdge.has(id)) threatsByEdge.set(id, []);
      threatsByEdge.get(id)!.push(t);
    }
  }

  const entries = [...graph.entries].sort();
  for (const entry of entries) {
    const stack: { id: string; nodes: string[]; hops: InfluenceHop[] }[] = [
      { id: entry, nodes: [entry], hops: [] },
    ];
    while (stack.length > 0 && enumerated < MAX_ENUMERATED) {
      const cur = stack.pop()!;
      const curNode = graph.nodeById.get(cur.id)!;
      if (cur.hops.length > 0 && targets.has(cur.id)) {
        enumerated++;
        found.push(
          buildPath(graph, cur.nodes, cur.hops, targets.get(cur.id)!, threatsByNode, threatsByEdge),
        );
      }
      if (cur.nodes.length >= MAX_NODES) continue;
      if (cur.hops.length > 0 && (curNode.isActor || curNode.isExternal)) continue;
      const nexts = [...(graph.influence.get(cur.id) ?? [])].sort((a, b) =>
        a.to === b.to ? (a.edgeId < b.edgeId ? 1 : -1) : a.to < b.to ? 1 : -1,
      );
      for (const h of nexts) {
        if (cur.nodes.includes(h.to)) continue;
        const nxt = graph.nodeById.get(h.to)!;
        if (nxt.isHitl) {
          broken++;
          continue;
        }
        if (nxt.isActor) continue;
        stack.push({ id: h.to, nodes: [...cur.nodes, h.to], hops: [...cur.hops, h] });
      }
    }
  }

  // One path per node sequence; prefer higher score, then id.
  const unique = new Map<string, AttackPath>();
  for (const p of found) {
    const existing = unique.get(p.id);
    if (!existing || p.score > existing.score) unique.set(p.id, p);
  }
  const all = [...unique.values()].sort((a, b) =>
    b.score !== a.score ? b.score - a.score : a.id < b.id ? -1 : 1,
  );
  return {
    paths: all.slice(0, limit),
    truncated: all.length > limit || enumerated >= MAX_ENUMERATED,
    total: all.length,
    brokenByGates: broken,
  };
}

function buildPath(
  graph: ModelGraph,
  nodes: string[],
  hops: InfluenceHop[],
  impact: number,
  threatsByNode: Map<string, GeneratedThreat[]>,
  threatsByEdge: Map<string, GeneratedThreat[]>,
): AttackPath {
  const label = (id: string) => graph.nodeById.get(id)?.label ?? id;
  const gates: string[] = [];
  let gateFactor = 1;
  const pathHops: AttackPathHop[] = hops.map((h) => {
    const e = graph.edgeById.get(h.edgeId)!;
    const to = graph.nodeById.get(h.to)!;
    if (to.isGuardrail) {
      const covers =
        h.dir === "response"
          ? to.coverage.has("output")
          : to.coverage.has("input") || to.coverage.has("tool-call");
      if (covers) {
        gateFactor *= 0.5;
        gates.push(to.label);
      }
    }
    const lk = hopLikelihood(e, h.dir);
    const text =
      h.dir === "forward"
        ? `${label(h.from)} sends "${e.data.label}" to ${label(h.to)} (${postureText(e)})`
        : `${label(h.from)}'s response to "${e.data.label}" reaches ${label(h.to)}`;
    return { from: h.from, to: h.to, edgeId: h.edgeId, dir: h.dir, likelihood: lk, text };
  });
  const weakest = Math.max(...pathHops.map((h) => h.likelihood));
  const lengthPenalty = Math.pow(0.92, Math.max(0, hops.length - 1));
  const likelihood = Math.round(weakest * lengthPenalty * gateFactor * 1000) / 1000;
  const score = Math.round(25 * likelihood * (impact / 5) * 10) / 10;

  const edgeIds = hops.map((h) => h.edgeId);
  const pathThreats = new Map<string, GeneratedThreat>();
  for (const id of nodes.slice(1))
    for (const t of threatsByNode.get(id) ?? []) pathThreats.set(t.id, t);
  for (const id of edgeIds) for (const t of threatsByEdge.get(id) ?? []) pathThreats.set(t.id, t);
  const targetThreats = (threatsByNode.get(nodes[nodes.length - 1]) ?? []).filter(
    (t) => !t.inherited,
  );
  const residualFactor =
    targetThreats.length > 0
      ? targetThreats.reduce((s, t) => s + (t.residualFactor ?? 1), 0) / targetThreats.length
      : 1;

  const entry = nodes[0];
  const target = nodes[nodes.length - 1];
  return {
    id: `path-${stableHash(nodes.join(">"))}`,
    name: `${label(entry)} → ${label(target)}`,
    description: `${label(entry)} reaches ${label(target)} in ${hops.length} hop(s)${
      gates.length ? ` through ${gates.join(", ")}` : ""
    }`,
    nodes,
    edges: edgeIds,
    severity: severityFromScore(score),
    score,
    threats: [...pathThreats.keys()].sort(),
    entryPoint: entry,
    target,
    hops: pathHops,
    likelihood,
    targetImpact: impact,
    residualScore: Math.round(score * residualFactor * 10) / 10,
    gatesPassed: gates,
  };
}

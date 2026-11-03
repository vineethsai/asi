/**
 * Attack-path builder for the reference architecture diagrams (IMPROVEMENT_PLAN §8.5, 6.5
 * "Walk an attack"). Turns one `relevantThreats` scenario of an architecture into the step list
 * that <AttackPathPlayer> animates.
 *
 * Which node is "hit" is derived from the data, in this order:
 *   1. KC codes named in the scenario text ("…the agent's core KC1 (LLM)…", "KC6.1.1") →
 *      diagram nodes of those KCs;
 *   2. otherwise the `componentIds` of the threats named in the title ("T6 … & T15 …");
 *   3. otherwise the orchestration (KC2) or model (KC1) nodes.
 * The path is the shortest flow from the entry node (User / event source) to the nearest hit
 * node, then fans out along the flows to the other hit nodes ("the compromise spreads").
 * Severity is the highest `riskBand(riskScore)` of the named threats.
 *
 * React-free; safe to unit test.
 */

import { threatsData, type Threat } from "@/components/components/securityData";
import { KC, type KcId } from "@/data/kc";
import { maxBand, riskBand, type SeverityBand } from "@/lib/severity";
import {
  ARCHITECTURE_FLOWS,
  flowEntryNode,
  isKcCategory,
  type FlowDef,
  type FlowEdgeDef,
  type FlowNodeDef,
} from "./architectureFlows";

export interface AttackPathStep {
  /** Node highlighted (and pulsed) on this step. */
  nodeId: string;
  /** Edge traversed to reach `nodeId` (omit for the entry step). */
  edgeId?: string;
  /** Edge is traversed target → source (the moving dot runs backwards). */
  reverse?: boolean;
  /** One sentence shown under the diagram while this step is active. */
  caption: string;
  /** Colour of the pulse / path; default "high". */
  severity?: SeverityBand;
  /** The node is a component the threat targets (drawn with a stronger highlight). */
  affected?: boolean;
}

export interface AttackScenario {
  title: string;
  description: string;
}

export interface AttackPath {
  steps: AttackPathStep[];
  /** Threat ids named in the scenario title, in order ("t6", "t15"). */
  threatIds: string[];
  /** Diagram node ids the scenario targets. */
  targetNodeIds: string[];
  /** KCs the targets were chosen by. */
  targetKcs: KcId[];
  band: SeverityBand;
  /** How the targets were chosen (for transparency in the UI / tests). */
  basis: "kc-mention" | "threat-components" | "fallback" | "none";
}

const MAX_STEPS = 7;

/** Threat ids named in free text: "T6 (Intent Breaking) & T15" → ["t6", "t15"] (known ids only). */
export function threatIdsInText(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(/\bT(\d{1,2})\b/g)) {
    const id = `t${Number(m[1])}`;
    if (threatsData[id] && !out.includes(id)) out.push(id);
  }
  return out;
}

/** KC ids named in free text: "KC1 (LLM)", "KC6.1.1" → ["kc1", "kc6"]. */
export function kcIdsInText(text: string): KcId[] {
  const out: KcId[] = [];
  for (const m of text.matchAll(/\bKC([1-6])(?:\.\d+)*\b/gi)) {
    const id = `kc${m[1]}` as KcId;
    if (!out.includes(id)) out.push(id);
  }
  return out;
}

type Adj = Map<string, { edge: FlowEdgeDef; to: string; reverse: boolean }[]>;

function adjacency(flow: FlowDef, undirected: boolean): Adj {
  const adj: Adj = new Map(flow.nodes.map((node) => [node.id, []]));
  for (const edge of flow.edges) {
    adj.get(edge.source)?.push({ edge, to: edge.target, reverse: false });
    if (undirected) adj.get(edge.target)?.push({ edge, to: edge.source, reverse: true });
  }
  return adj;
}

type Hop = { edge: FlowEdgeDef; to: string; reverse: boolean };

/** BFS from `start`; returns parent pointers keyed by node id. */
function bfs(adj: Adj, start: string): Map<string, Hop | null> {
  const parent = new Map<string, Hop | null>([[start, null]]);
  const queue = [start];
  while (queue.length) {
    const cur = queue.shift() as string;
    for (const hop of adj.get(cur) ?? []) {
      if (parent.has(hop.to)) continue;
      parent.set(hop.to, { ...hop, to: cur });
      queue.push(hop.to);
    }
  }
  return parent;
}

/** Hops from the BFS root to `target` (each hop: edge + node reached), [] when unreachable. */
function pathTo(
  parent: Map<string, Hop | null>,
  target: string,
): { edge: FlowEdgeDef; node: string; reverse: boolean }[] {
  if (!parent.has(target)) return [];
  const hops: { edge: FlowEdgeDef; node: string; reverse: boolean }[] = [];
  let cur = target;
  let link = parent.get(cur);
  while (link) {
    hops.unshift({ edge: link.edge, node: cur, reverse: link.reverse });
    cur = link.to;
    link = parent.get(cur);
  }
  return hops;
}

function distanceOrder(parent: Map<string, Hop | null>, ids: string[]): string[] {
  const depth = (id: string) => pathTo(parent, id).length;
  return ids.filter((id) => parent.has(id)).sort((a, b) => depth(a) - depth(b));
}

function threatLabel(t: Threat): string {
  return `${t.code} ${t.shortName ?? t.name}`;
}

function kcShort(category: string): string {
  return isKcCategory(category) ? KC[category as KcId].code : "";
}

/**
 * Build the animated walk for one scenario of an architecture. Returns an empty step list
 * when the architecture has no diagram.
 */
export function buildAttackPath(architectureId: string, scenario: AttackScenario): AttackPath {
  const flow = ARCHITECTURE_FLOWS[architectureId];
  const threatIds = threatIdsInText(scenario.title);
  const threats = threatIds.map((id) => threatsData[id]).filter(Boolean) as Threat[];
  const band: SeverityBand = threats.length
    ? maxBand(threats.map((t) => riskBand(t.riskScore)))
    : "high";
  const empty: AttackPath = {
    steps: [],
    threatIds,
    targetNodeIds: [],
    targetKcs: [],
    band,
    basis: "none",
  };
  if (!flow) return empty;

  const nodesOf = (kcs: readonly string[]) =>
    flow.nodes.filter((node) => kcs.includes(node.data.category));

  let basis: AttackPath["basis"] = "kc-mention";
  let targetKcs = kcIdsInText(`${scenario.title} ${scenario.description}`);
  let targets = nodesOf(targetKcs);
  if (!targets.length) {
    basis = "threat-components";
    targetKcs = Array.from(
      new Set(threats.flatMap((t) => t.componentIds.map((c) => c.split(".")[0] as KcId))),
    ).filter((k) => k in KC);
    targets = nodesOf(targetKcs);
  }
  if (!targets.length) {
    basis = "fallback";
    targetKcs = nodesOf(["kc2"]).length ? ["kc2"] : ["kc1"];
    targets = nodesOf(targetKcs);
  }
  if (!targets.length) return { ...empty, basis: "none" };

  const entry = flowEntryNode(flow) as FlowNodeDef;
  const label = new Map(flow.nodes.map((node) => [node.id, node.data.label]));
  const category = new Map(flow.nodes.map((node) => [node.id, node.data.category]));
  const targetIds = targets.map((t) => t.id);
  const named = threats.length ? threats.map(threatLabel).join(", ") : scenario.title;

  const directed = adjacency(flow, false);
  const undirected = adjacency(flow, true);

  // 1. Entry → nearest target (directed flows first, then either direction).
  let fromEntry = bfs(directed, entry.id);
  if (!distanceOrder(fromEntry, targetIds).length) fromEntry = bfs(undirected, entry.id);
  const firstTarget = targetIds.includes(entry.id)
    ? entry.id
    : distanceOrder(fromEntry, targetIds)[0];

  const steps: AttackPathStep[] = [];
  const entryIsActor = entry.data.category === "actor";
  steps.push({
    nodeId: entry.id,
    caption: entryIsActor
      ? `Attacker-controlled input arrives from ${entry.data.label}.`
      : `A malicious event arrives from ${entry.data.label}.`,
    severity: band,
    affected: targetIds.includes(entry.id),
  });

  const visitedNodes = new Set([entry.id]);
  const visitedEdges = new Set<string>();
  const hitCaption = (nodeId: string) => {
    const kc = kcShort(category.get(nodeId) ?? "");
    return `${label.get(nodeId)}${kc ? ` (${kc})` : ""} is hit: ${named}.`;
  };

  if (firstTarget && firstTarget !== entry.id) {
    for (const hop of pathTo(fromEntry, firstTarget)) {
      if (steps.length >= MAX_STEPS) break;
      const isTarget = hop.node === firstTarget;
      const src = hop.reverse ? hop.edge.target : hop.edge.source;
      steps.push({
        nodeId: hop.node,
        edgeId: hop.edge.id,
        reverse: hop.reverse || undefined,
        caption: isTarget
          ? hitCaption(hop.node)
          : `“${hop.edge.data.label}” carries the payload from ${label.get(src)} to ${label.get(hop.node)}.`,
        severity: band,
        affected: targetIds.includes(hop.node) || undefined,
      });
      visitedNodes.add(hop.node);
      visitedEdges.add(hop.edge.id);
    }
  }

  // 2. Fan out from the first hit node to the remaining targets along the flows.
  const origin = firstTarget ?? entry.id;
  let spread = bfs(directed, origin);
  const remaining = targetIds.filter((id) => !visitedNodes.has(id));
  if (remaining.length && !distanceOrder(spread, remaining).length) {
    spread = bfs(undirected, origin);
  }
  for (const target of distanceOrder(spread, remaining)) {
    for (const hop of pathTo(spread, target)) {
      if (steps.length >= MAX_STEPS) break;
      if (visitedEdges.has(hop.edge.id)) continue;
      const src = hop.reverse ? hop.edge.target : hop.edge.source;
      const isTarget = targetIds.includes(hop.node);
      steps.push({
        nodeId: hop.node,
        edgeId: hop.edge.id,
        reverse: hop.reverse || undefined,
        caption: isTarget
          ? `The compromise spreads over “${hop.edge.data.label}” from ${label.get(src)} to ${label.get(hop.node)}.`
          : `“${hop.edge.data.label}” relays it from ${label.get(src)} to ${label.get(hop.node)}.`,
        severity: band,
        affected: isTarget || undefined,
      });
      visitedNodes.add(hop.node);
      visitedEdges.add(hop.edge.id);
    }
  }

  return { steps, threatIds, targetNodeIds: targetIds, targetKcs, band, basis };
}

/** Attack path for an architecture's first `relevantThreats` entry (Home showcase). */
export function primaryAttackPath(
  architectureId: string,
  scenarios: readonly AttackScenario[] | undefined,
): AttackPath | undefined {
  const first = scenarios?.[0];
  return first ? buildAttackPath(architectureId, first) : undefined;
}

// ─── Highlight state (what the diagram draws for a given step) ─────────────

export interface AttackHighlight {
  /** Node of the current step (pulses). */
  activeNodeId?: string;
  /** Edge of the current step (moving dot). */
  activeEdgeId?: string;
  activeEdgeReverse?: boolean;
  /** Nodes / edges reached so far, including the current step. */
  visitedNodeIds: string[];
  visitedEdgeIds: string[];
  /** Reached nodes that the threat targets. */
  affectedNodeIds: string[];
  band: SeverityBand;
  /** Changes whenever pulses and dots should restart (step change, replay). */
  runKey: number;
  /** Travel time of the moving dot along one edge. */
  hopMs: number;
  /** Delay before the node pulse starts (the dot's travel time, 0 for the entry step). */
  pulseDelayMs: number;
  /** Reduced motion / paused final frame: no dots, pulses or dash animation. */
  still: boolean;
}

/** Highlight for `steps[index]` (undefined before the first step). */
export function highlightForStep(
  steps: readonly AttackPathStep[],
  index: number,
  opts: { runKey: number; hopMs: number; still: boolean },
): AttackHighlight | undefined {
  if (index < 0 || index >= steps.length) return undefined;
  const upto = steps.slice(0, index + 1);
  const step = steps[index];
  return {
    activeNodeId: step.nodeId,
    activeEdgeId: step.edgeId,
    activeEdgeReverse: step.reverse,
    visitedNodeIds: upto.map((s) => s.nodeId),
    visitedEdgeIds: upto.flatMap((s) => (s.edgeId ? [s.edgeId] : [])),
    affectedNodeIds: upto.filter((s) => s.affected).map((s) => s.nodeId),
    band: step.severity ?? "high",
    runKey: opts.runKey,
    hopMs: opts.hopMs,
    pulseDelayMs: step.edgeId ? opts.hopMs : 0,
    still: opts.still,
  };
}

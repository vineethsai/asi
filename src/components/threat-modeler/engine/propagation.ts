import type { GeneratedThreat } from "../types";
import type { ModelGraph } from "./graph";
import type { ThreatRule } from "./catalog/types";
import { capToBand, degrade } from "./severity";

/** Hard cap on propagation depth (P3-03). */
export const MAX_PROPAGATION_HOPS = 2;

export interface PropagationSource {
  threat: GeneratedThreat;
  rule: ThreatRule;
  /** Node the compromise originates from. */
  originId: string;
}

/**
 * Inherited-threat propagation (P3-03 / §7.2.3):
 *  - only rules flagged `propagates`;
 *  - follows attacker influence (flows and call responses);
 *  - degrades one severity level per hop and stops below "low";
 *  - at most `maxHops` (≤ 2) hops;
 *  - stops at authenticated + encrypted edges and at guardrail / HITL nodes;
 *  - never lands on actors, external systems or nodes the same rule already affects.
 */
export function propagateThreats(
  graph: ModelGraph,
  sources: PropagationSource[],
): GeneratedThreat[] {
  const affectedByRule = new Map<string, Set<string>>();
  for (const { threat } of sources) {
    if (!threat.ruleId) continue;
    const set = affectedByRule.get(threat.ruleId) ?? new Set<string>();
    for (const id of threat.affectedNodeIds) set.add(id);
    affectedByRule.set(threat.ruleId, set);
  }

  const landed = new Map<string, GeneratedThreat>(); // `${ruleId}@${nodeId}` → inherited threat
  const ordered = [...sources]
    .filter((s) => s.rule.propagates)
    .sort((a, b) => (a.threat.id < b.threat.id ? -1 : a.threat.id > b.threat.id ? 1 : 0));

  for (const { threat, rule, originId } of ordered) {
    const maxHops = Math.min(rule.maxHops ?? MAX_PROPAGATION_HOPS, MAX_PROPAGATION_HOPS);
    const already = affectedByRule.get(rule.id) ?? new Set<string>();
    const origin = graph.nodeById.get(originId);
    if (!origin) continue;
    const visited = new Set<string>([originId]);
    let frontier: { id: string; path: string[]; edges: string[] }[] = [
      { id: originId, path: [originId], edges: [] },
    ];
    for (let hop = 1; hop <= maxHops && frontier.length > 0; hop++) {
      const next: typeof frontier = [];
      for (const cur of frontier) {
        for (const h of graph.influence.get(cur.id) ?? []) {
          if (visited.has(h.to)) continue;
          const edge = graph.edgeById.get(h.edgeId)!;
          if (edge.secure) continue; // authenticated + encrypted stops propagation
          const target = graph.nodeById.get(h.to)!;
          visited.add(h.to);
          if (target.isActor || target.isExternal || target.isGate) continue;
          if (rule.propagatesTo && !rule.propagatesTo(target)) continue;
          if (already.has(target.id)) continue;
          const severity = degrade(threat.severity, hop);
          if (!severity) continue;
          const key = `${rule.id}@${target.id}`;
          const path = [...cur.path, target.id];
          const edges = [...cur.edges, h.edgeId];
          if (!landed.has(key)) {
            const s = capToBand(threat.score ?? 1, severity);
            landed.set(key, {
              ...threat,
              id: `${threat.id}~>${target.id}`,
              componentKey: `${target.id}<${threat.componentKey ?? origin.id}`,
              severity,
              score: s,
              likelihood: Math.max(1, (threat.likelihood ?? 1) - hop),
              affectedNodeIds: [target.id],
              focusNodeId: target.id,
              affectedEdgeIds: edges,
              inherited: true,
              inheritedFrom: threat.id,
              hops: hop,
              propagationPath: path,
              sourceNodeId: origin.id,
              description: `Inherited from "${origin.label}" (${hop} hop${hop > 1 ? "s" : ""}): ${threat.description}`,
              why: {
                ruleId: rule.id,
                evidence: [
                  `Propagated from ${origin.label} via ${path.map((id) => graph.nodeById.get(id)?.label ?? id).join(" → ")}`,
                  ...(threat.why?.evidence.slice(0, 2) ?? []),
                ],
                path,
                factors: [{ kind: "likelihood", label: `Propagated ${hop} hop(s)`, delta: -hop }],
              },
            });
          }
          next.push({ id: target.id, path, edges });
        }
      }
      frontier = next;
    }
  }
  return [...landed.values()].sort((a, b) => (a.id < b.id ? -1 : 1));
}

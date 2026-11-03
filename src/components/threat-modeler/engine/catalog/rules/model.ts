import { MaestroLayer } from "../../../types";
import type { NodeInfo } from "../../graph";
import type { MatchEvidence, RuleContext, ThreatRule } from "../types";
import { hasProvenance, listLabels } from "./util";

/** Model-scope (topology) rules. */

/** Node ids an observability component covers: declared `covers` plus direct neighbours. */
export function observedNodeIds(ctx: Pick<RuleContext, "graph">): Set<string> {
  const covered = new Set<string>();
  for (const o of ctx.graph.nodes) {
    if (!o.isObservability) continue;
    for (const id of o.data.semantics?.observability?.covers ?? []) covered.add(id);
    for (const id of ctx.graph.neighbours.get(o.id) ?? []) covered.add(id);
  }
  return covered;
}

const agentsOf = (ctx: RuleContext) => ctx.graph.nodes.filter((n) => n.isAgent);

export const MODEL_RULES: ThreatRule[] = [
  {
    id: "TM-MODEL-001",
    scope: "model",
    title: "Components outside any trust boundary",
    description:
      "Trust zones are defined but some components sit outside all of them, so their trust assumptions are implicit.",
    methodology: "topology",
    when: (ctx) => {
      if (ctx.graph.boundaries.length === 0) return false;
      const outside = ctx.graph.nodes.filter((n) => !n.boundaryId && !n.isActor && !n.isExternal);
      if (outside.length === 0) return false;
      return {
        evidence: [
          `Outside every boundary: ${listLabels(
            ctx,
            outside.map((n) => n.id),
            10,
          )}`,
        ],
        nodeIds: outside.map((n) => n.id),
      };
    },
    likelihood: () => 3,
    impact: () => 2,
    fixedSeverity: true,
    mitigationIds: ["MIT-SEGMENTATION"],
    maps: { aisvs: ["C4"], stride: ["E"], maestroLayer: MaestroLayer.SecurityCompliance },
  },
  {
    id: "TM-MODEL-002",
    scope: "model",
    title: "Agent and tool activity is not observable",
    description:
      "No observability component covers these agents or high-risk tools, so hijacks, loops and cascading failures go undetected and cannot be reconstructed.",
    methodology: "topology",
    when: (ctx) => {
      const covered = observedNodeIds(ctx);
      const agents = agentsOf(ctx);
      const subjects: NodeInfo[] =
        agents.length > 0
          ? [...agents, ...ctx.graph.nodes.filter((n) => n.isPrivileged)]
          : ctx.graph.nodes.filter((n) => n.isModel);
      const uncovered = subjects.filter((n) => !covered.has(n.id));
      if (uncovered.length === 0) return false;
      const hasObs = ctx.graph.nodes.some((n) => n.isObservability);
      return {
        evidence: [
          hasObs
            ? "An observability component exists but does not cover:"
            : "No observability component (MAESTRO L5) in the model",
          `Not covered: ${listLabels(
            ctx,
            uncovered.map((n) => n.id),
            10,
          )}`,
        ],
        nodeIds: uncovered.map((n) => n.id),
      };
    },
    likelihood: () => 3,
    impact: () => 3,
    fixedSeverity: true,
    mitigationIds: ["MIT-AUDIT-LOGGING", "MIT-BEHAVIOR-MONITOR", "MIT-INCIDENT-RESPONSE"],
    maps: {
      owaspAsi: ["ASI08"],
      owaspAsiRelated: ["ASI10"],
      cisco: ["OB-009"],
      ciscoTechniques: ["AITech-9.2"],
      aisvs: ["C12"],
      stride: ["R"],
      maestroLayer: MaestroLayer.EvaluationObservability,
      catalogThreat: "t8",
    },
  },
  {
    id: "TM-MODEL-003",
    scope: "model",
    title: "Unverified agent framework and tool supply chain",
    description:
      "Agent frameworks, tool packages and containers are used without declared signed provenance or pinned versions.",
    methodology: "topology",
    when: (ctx) => {
      const subjects = ctx.graph.nodes.filter(
        (n) => (n.isAgent || n.isTool) && n.kind !== "mcp-server" && !hasProvenance(n),
      );
      if (subjects.length === 0) return false;
      return {
        evidence: [
          `No signed/pinned provenance: ${listLabels(
            ctx,
            subjects.map((n) => n.id),
            10,
          )}`,
        ],
        nodeIds: subjects.map((n) => n.id),
      };
    },
    likelihood: () => 2,
    impact: () => 4,
    fixedSeverity: true,
    mitigationIds: ["MIT-DEP-PINNING", "MIT-SECURE-SDLC"],
    maps: {
      owaspAsi: ["ASI04"],
      cisco: ["OB-009"],
      ciscoTechniques: ["AITech-9.3"],
      aisvs: ["C6"],
      stride: ["T"],
      maestroLayer: MaestroLayer.AgentFrameworks,
      catalogThreat: "t17",
    },
  },
  {
    id: "TM-MODEL-004",
    scope: "model",
    title: "Cascading failure through a shared store",
    description:
      "Three or more agents read and write the same store with no gate in between; one poisoned or hallucinated entry propagates to every agent.",
    methodology: "topology",
    when: (ctx) => {
      const out: MatchEvidence[] = [];
      for (const s of ctx.graph.nodes) {
        if (!s.isStore) continue;
        const agents = [...(ctx.graph.neighbours.get(s.id) ?? [])].filter(
          (id) => ctx.h.node(id)?.isAgent,
        );
        if (agents.length < 3) continue;
        out.push({
          evidence: [`${s.label} is shared by ${listLabels(ctx, agents)} without a gate`],
          nodeIds: [s.id, ...agents],
          componentKey: s.id,
          focusNodeId: s.id,
        });
      }
      return out;
    },
    likelihood: () => 3,
    impact: () => 4,
    mitigationIds: [
      "MIT-MEMORY-VALIDATION",
      "MIT-REASONING-VALIDATION",
      "MIT-CIRCUIT-BREAKER",
      "MIT-MEMORY-ISOLATION",
    ],
    maps: {
      owaspAsi: ["ASI08"],
      owaspAsiRelated: ["ASI06"],
      cisco: ["OB-007"],
      ciscoTechniques: ["AITech-7.2"],
      aisvs: ["C8", "C9"],
      stride: ["T", "D"],
      maestroLayer: MaestroLayer.AgentEcosystem,
      catalogThreat: "t5",
    },
  },
  {
    id: "TM-MODEL-005",
    scope: "model",
    title: "Rogue agent containment gap",
    description:
      "Several collaborating agents with no behavioural monitoring covering all of them: a compromised or drifting agent can act unnoticed and cannot be isolated.",
    methodology: "topology",
    when: (ctx) => {
      const agents = agentsOf(ctx);
      if (agents.length < 2) return false;
      const collaborating = agents.some((a) =>
        [...(ctx.graph.neighbours.get(a.id) ?? [])].some((id) => ctx.h.node(id)?.isAgent),
      );
      const sharedStore = ctx.graph.nodes.some(
        (s) =>
          s.isStore &&
          [...(ctx.graph.neighbours.get(s.id) ?? [])].filter((id) => ctx.h.node(id)?.isAgent)
            .length >= 2,
      );
      if (!collaborating && !sharedStore) return false;
      const covered = observedNodeIds(ctx);
      const unmonitored = agents.filter((a) => !covered.has(a.id));
      if (unmonitored.length === 0) return false;
      return {
        evidence: [
          `${agents.length} collaborating agents`,
          `Without behavioural monitoring: ${listLabels(
            ctx,
            unmonitored.map((a) => a.id),
          )}`,
        ],
        nodeIds: unmonitored.map((a) => a.id),
      };
    },
    likelihood: () => 2,
    impact: () => 4,
    fixedSeverity: true,
    mitigationIds: [
      "MIT-KILL-SWITCH",
      "MIT-BEHAVIOR-MONITOR",
      "MIT-AGENT-IDENTITY",
      "MIT-LEAST-PRIVILEGE",
    ],
    maps: {
      owaspAsi: ["ASI10"],
      cisco: ["OB-002"],
      aisvs: ["C9", "C12"],
      stride: ["E", "R"],
      maestroLayer: MaestroLayer.AgentEcosystem,
      catalogThreat: "t13",
    },
  },
  {
    id: "TM-MODEL-006",
    scope: "model",
    title: "Empty trust boundary",
    description:
      "A trust boundary contains no components, which usually means the model is incomplete.",
    methodology: "topology",
    when: (ctx) =>
      ctx.graph.boundaries
        .filter((b) => !ctx.graph.nodes.some((n) => n.boundaryId === b.id))
        .map((b) => ({
          evidence: [`Boundary "${b.data?.label ?? b.id}" contains no components`],
          nodeIds: [b.id],
          componentKey: b.id,
        })),
    likelihood: () => 1,
    impact: () => 2,
    fixedSeverity: true,
    mitigationIds: ["MIT-SEGMENTATION"],
    maps: { aisvs: ["C4"], maestroLayer: MaestroLayer.SecurityCompliance },
  },
  {
    id: "TM-MODEL-007",
    scope: "model",
    title: "Excessive trust-boundary crossings",
    description:
      "A component exchanges data with three or more trust zones, which widens its attack surface and blurs zone separation.",
    methodology: "topology",
    when: (ctx) => {
      const out: MatchEvidence[] = [];
      for (const n of ctx.graph.nodes) {
        const zones = new Set<string>();
        const edges = [...ctx.h.inbound(n.id), ...ctx.h.outbound(n.id)].filter(
          (e) => e.crossesBoundary,
        );
        for (const e of edges) {
          const other = ctx.h.node(e.source === n.id ? e.target : e.source);
          zones.add(other?.boundaryId ?? "(outside)");
        }
        if (n.boundaryId) zones.add(n.boundaryId);
        if (zones.size < 3) continue;
        out.push({
          evidence: [`${n.label} exchanges data with ${zones.size} trust zones`],
          nodeIds: [n.id],
          edgeIds: edges.map((e) => e.id),
          componentKey: n.id,
          focusNodeId: n.id,
        });
      }
      return out;
    },
    likelihood: () => 2,
    impact: () => 3,
    mitigationIds: ["MIT-SEGMENTATION", "MIT-STRONG-AUTHN"],
    maps: {
      cisco: ["OB-014"],
      aisvs: ["C4"],
      stride: ["E"],
      maestroLayer: MaestroLayer.SecurityCompliance,
    },
  },
];

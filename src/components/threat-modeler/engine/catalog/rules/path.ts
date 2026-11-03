import { MaestroLayer } from "../../../types";
import { stableHash } from "../../hash";
import type { MatchEvidence, ThreatRule } from "../types";
import { REF, label } from "./util";

/** Path-scope rules: evaluated over directed influence paths. */

const DELEGATED_AUTH = /deleg|on-behalf|\bobo\b/i;

export const PATH_RULES: ThreatRule[] = [
  {
    id: "TM-PATH-001",
    scope: "path",
    title: "Privileged action reachable without human approval",
    description:
      "Untrusted input can drive a destructive, executing or critical tool without passing a human approval gate.",
    methodology: "topology",
    when: (ctx) => {
      const out: MatchEvidence[] = [];
      for (const p of ctx.graph.nodes) {
        if (!p.isPrivileged) continue;
        const r = ctx.h.reachBlocked(p.id, ["hitl"]);
        if (!r || r.hops === 0) continue;
        const pathLabels = r.path.map((id) => label(ctx, id)).join(" → ");
        out.push({
          evidence: [
            `${p.label} (${p.data.toolAccessMode ?? p.data.componentId ?? "privileged"}${
              p.data.toolRiskTier ? `, ${p.data.toolRiskTier}` : ""
            }) is reachable without an approval gate`,
            `Path: ${pathLabels}`,
          ],
          path: r.path,
          componentKey: p.id,
          focusNodeId: p.id,
          nodeIds: [p.id, ...r.path.slice(1, -1).filter((id) => ctx.h.node(id)?.isAI)],
          edgeIds: r.edgeIds,
        });
      }
      return out;
    },
    likelihood: () => 4,
    impact: () => 5,
    gates: ["tool-call"],
    skipImpactFactors: ["tool"],
    mitigationIds: [
      "MIT-HITL-APPROVAL",
      "MIT-LEAST-PRIVILEGE",
      "MIT-TOOL-ALLOWLIST",
      "MIT-KILL-SWITCH",
    ],
    maps: {
      owaspAsi: ["ASI02"],
      owaspAsiRelated: ["ASI09"],
      cisco: ["OB-012", "OB-002"],
      ciscoTechniques: ["AITech-12.1"],
      aisvs: ["C9"],
      stride: ["E"],
      maestroLayer: MaestroLayer.AgentEcosystem,
      catalogThreat: "t2",
    },
    references: [REF.asi],
  },
  {
    id: "TM-PATH-002",
    scope: "path",
    title: "Delegated user credential reaches a tool without scope narrowing",
    description:
      "The agent acts on the user's behalf with their full credential; a hijacked agent can use it for anything the user could do (confused deputy).",
    methodology: "topology",
    when: (ctx) => {
      const out: MatchEvidence[] = [];
      const seen = new Set<string>();
      const identities = ctx.graph.nodes.filter(
        (n) =>
          n.isIdentity &&
          n.data.semantics?.identity?.delegation &&
          !n.data.semantics.identity.scopeNarrowing,
      );
      // Forward-only BFS from each delegating identity to tools within 3 hops.
      for (const idn of identities) {
        const queue: { id: string; path: string[] }[] = [{ id: idn.id, path: [idn.id] }];
        const visited = new Set([idn.id]);
        while (queue.length > 0) {
          const { id, path } = queue.shift()!;
          if (path.length > 4) continue;
          for (const e of ctx.h.outbound(id)) {
            if (visited.has(e.target)) continue;
            visited.add(e.target);
            const t = ctx.h.node(e.target)!;
            const next = [...path, t.id];
            if ((t.isTool || t.isExternal) && t.profile.accessDanger !== "safe") {
              const key = `${idn.id}>${t.id}`;
              if (!seen.has(key)) {
                seen.add(key);
                out.push({
                  evidence: [
                    `${idn.label} delegates the user's credential without scope narrowing`,
                    `Reaches ${t.label} (${t.data.toolAccessMode ?? "access mode not set"}) via ${next
                      .map((x) => label(ctx, x))
                      .join(" → ")}`,
                  ],
                  path: next,
                  componentKey: key,
                  focusNodeId: t.id,
                  nodeIds: [idn.id, t.id],
                });
              }
            }
            if (!t.isActor) queue.push({ id: t.id, path: next });
          }
        }
      }
      // Edges that declare delegated auth into a tool with no narrowing identity on the way.
      for (const e of ctx.graph.edges) {
        if (!DELEGATED_AUTH.test(e.data.authentication ?? "")) continue;
        const t = ctx.h.node(e.target)!;
        if (!(t.isTool || t.isExternal) || t.profile.accessDanger === "safe") continue;
        const key = `${e.source}>${t.id}`;
        if (seen.has(key)) continue;
        const narrowed = ctx.h
          .inbound(e.source)
          .some((x) => ctx.h.node(x.source)?.data.semantics?.identity?.scopeNarrowing);
        if (narrowed) continue;
        seen.add(key);
        out.push({
          evidence: [
            `${label(ctx, e.source)} → ${t.label} uses delegated authentication "${e.data.authentication}"`,
            "No identity component narrows the delegated scope",
          ],
          path: [e.source, t.id],
          componentKey: key,
          focusNodeId: t.id,
          nodeIds: [e.source, t.id],
          edgeIds: [e.id],
        });
      }
      return out;
    },
    likelihood: () => 3,
    impact: () => 4,
    mitigationIds: ["MIT-SCOPE-NARROWING", "MIT-LEAST-PRIVILEGE", "MIT-AUDIT-LOGGING"],
    maps: {
      owaspAsi: ["ASI03"],
      cisco: ["OB-014"],
      ciscoTechniques: ["AITech-14.2"],
      aisvs: ["C5", "C9"],
      stride: ["E"],
      maestroLayer: MaestroLayer.SecurityCompliance,
      catalogThreat: "t3",
    },
    references: [REF.asi],
  },
  {
    id: "TM-PATH-003",
    scope: "path",
    title: "Cascading compromise across an agent chain",
    description:
      "Untrusted influence passes through three or more agents with no gate or validation; one agent's error or hijack cascades through the chain.",
    methodology: "topology",
    when: (ctx) => {
      const out: MatchEvidence[] = [];
      const seen = new Set<string>();
      for (const n of ctx.graph.nodes) {
        if (!n.isAgent) continue;
        // An approval gate between agents breaks the cascade.
        const r = ctx.h.reachBlocked(n.id, ["hitl"]);
        if (!r) continue;
        const agents = r.path.filter((id) => ctx.h.node(id)?.isAgent);
        if (agents.length < 3) continue;
        const key = stableHash(agents.join(">"));
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({
          evidence: [
            `Ungated chain: ${r.path.map((id) => label(ctx, id)).join(" → ")}`,
            `${agents.length} agents in sequence`,
          ],
          path: r.path,
          componentKey: key,
          focusNodeId: n.id,
          nodeIds: agents,
        });
      }
      return out;
    },
    likelihood: () => 3,
    impact: () => 3,
    gates: ["input", "hitl"],
    mitigationIds: [
      "MIT-REASONING-VALIDATION",
      "MIT-CIRCUIT-BREAKER",
      "MIT-MESSAGE-SIGNING",
      "MIT-BEHAVIOR-MONITOR",
    ],
    maps: {
      owaspAsi: ["ASI08"],
      cisco: ["OB-007"],
      ciscoTechniques: ["AITech-7.1"],
      aisvs: ["C9"],
      stride: ["T", "D"],
      maestroLayer: MaestroLayer.AgentEcosystem,
      catalogThreat: "t5",
    },
  },
];

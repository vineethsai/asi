import { MaestroLayer } from "../../../types";
import type { NodeInfo } from "../../graph";
import type { RuleContext, ThreatRule } from "../types";
import { REF, listLabels } from "./util";

/** Agentic-native rules driven by `CanvasNodeData.semantics` (Phase 3 §7.6). */

const WRITE_SCOPE = /write|admin|delete|exec|deploy|send|pay|\*/i;
const MANY_TOOLS = 5;

function untrustedWriters(ctx: RuleContext, n: NodeInfo): NodeInfo[] {
  const mem = n.data.semantics?.memory;
  if (!mem) return [];
  return mem.writeAccess
    .map((id) => ctx.h.node(id))
    .filter((w): w is NodeInfo => !!w && (w.isEntry || w.data.trustLevel === "untrusted"));
}

export const AGENTIC_RULES: ThreatRule[] = [
  {
    id: "TM-AGT-001",
    scope: "node",
    title: "Unverified MCP server provenance",
    description:
      "An MCP server that is not signed and version-pinned can be swapped or updated to a malicious build (rug pull) that every connected agent trusts.",
    methodology: "component",
    appliesTo: (n) => n.kind === "mcp-server",
    when: (ctx) => {
      const p = ctx.node!.data.semantics?.mcp?.provenance ?? ctx.node!.data.semantics?.provenance;
      if (p?.signed && p.pinned) return false;
      return {
        evidence: [
          !p
            ? "MCP server provenance not declared"
            : `Provenance: ${p.signed ? "signed" : "unsigned"}, ${p.pinned ? "pinned" : "unpinned"}`,
        ],
      };
    },
    likelihood: () => 3,
    impact: () => 4,
    mitigationIds: ["MIT-MCP-HARDENING", "MIT-DEP-PINNING"],
    maps: {
      owaspAsi: ["ASI04"],
      cisco: ["OB-009"],
      ciscoTechniques: ["AITech-9.3"],
      aisvs: ["C10", "C6"],
      stride: ["T"],
      maestroLayer: MaestroLayer.AgentFrameworks,
      catalogThreat: "t17",
    },
    references: [REF.mcp, REF.asi],
  },
  {
    id: "TM-AGT-002",
    scope: "node",
    title: "MCP tool poisoning and over-exposed tools",
    description:
      "Tool descriptions and results from an MCP server are model-visible content: a malicious description can instruct the agent, and a broad tool set widens what a hijacked agent can do.",
    methodology: "component",
    appliesTo: (n) => n.kind === "mcp-server",
    when: (ctx) => {
      const tools = ctx.node!.data.semantics?.mcp?.toolsExposed;
      return {
        evidence: [
          tools
            ? `Exposes ${tools.length} tool(s): ${tools.slice(0, 8).join(", ")}`
            : "Exposed tool set not declared",
          "Tool descriptions are injected into the agent's context",
        ],
        data: { many: !tools || tools.length > MANY_TOOLS },
      };
    },
    likelihood: () => 3,
    impact: (_c, m) => (m.data?.many ? 4 : 3),
    gates: ["tool-call", "hitl"],
    mitigationIds: [
      "MIT-MCP-HARDENING",
      "MIT-TOOL-ALLOWLIST",
      "MIT-CONTEXT-SEGREGATION",
      "MIT-HITL-APPROVAL",
    ],
    maps: {
      owaspAsi: ["ASI02"],
      owaspAsiRelated: ["ASI01"],
      cisco: ["OB-012", "OB-001"],
      ciscoTechniques: ["AITech-12.1", "AITech-1.2"],
      aisvs: ["C10"],
      stride: ["T", "E"],
      maestroLayer: MaestroLayer.AgentEcosystem,
      catalogThreat: "t16",
    },
    references: [REF.mcp],
  },
  {
    id: "TM-AGT-003",
    scope: "node",
    title: "Unauthenticated remote MCP transport",
    description:
      "A network-reachable MCP server accepts calls without authentication, so anyone who can reach it can invoke its tools or impersonate the client.",
    methodology: "component",
    appliesTo: (n) => n.kind === "mcp-server",
    when: (ctx) => {
      const mcp = ctx.node!.data.semantics?.mcp;
      if (!mcp || mcp.transport === "stdio" || mcp.auth !== "none") return false;
      return { evidence: [`Transport ${mcp.transport} with auth "none"`] };
    },
    likelihood: () => 4,
    impact: () => 4,
    fixedSeverity: true,
    mitigationIds: ["MIT-MCP-HARDENING", "MIT-STRONG-AUTHN", "MIT-TLS"],
    maps: {
      owaspAsi: ["ASI03"],
      owaspAsiRelated: ["ASI02"],
      cisco: ["OB-014", "OB-004"],
      ciscoTechniques: ["AITech-14.1", "AITech-4.3"],
      aisvs: ["C10", "C5"],
      stride: ["S", "E"],
      maestroLayer: MaestroLayer.DeploymentInfrastructure,
      catalogThreat: "t16",
    },
    references: [REF.mcp],
  },
  {
    id: "TM-AGT-010",
    scope: "node",
    title: "Write-scoped tool without allow-list or rate limit",
    description:
      "A tool granted write/admin scopes has no allow-list of permitted operations or no rate limit, so misuse is unbounded.",
    methodology: "component",
    appliesTo: (n) => !!n.data.semantics?.tool,
    when: (ctx) => {
      const tool = ctx.node!.data.semantics!.tool!;
      const writes = tool.scopes.filter((s) => WRITE_SCOPE.test(s));
      if (writes.length === 0) return false;
      const missing = [
        ...((tool.allowList?.length ?? 0) === 0 ? ["allow-list"] : []),
        ...(!tool.rateLimit ? ["rate limit"] : []),
      ];
      if (missing.length === 0) return false;
      return { evidence: [`Scopes: ${writes.join(", ")}`, `Missing: ${missing.join(", ")}`] };
    },
    likelihood: () => 3,
    impact: () => 3,
    mitigationIds: ["MIT-LEAST-PRIVILEGE", "MIT-TOOL-ALLOWLIST", "MIT-RATE-LIMIT"],
    maps: {
      owaspAsi: ["ASI02"],
      cisco: ["OB-012"],
      aisvs: ["C9", "C5"],
      stride: ["E"],
      maestroLayer: MaestroLayer.AgentEcosystem,
      catalogThreat: "t2",
    },
  },
  {
    id: "TM-AGT-020",
    scope: "node",
    title: "A2A peer without mutual authentication",
    description:
      "A remote agent peer is not mutually authenticated, so an attacker can impersonate it and send instructions or receive delegated tasks.",
    methodology: "component",
    appliesTo: (n) => n.kind === "a2a-peer",
    when: (ctx) => {
      const a2a = ctx.node!.data.semantics?.a2a;
      if (a2a?.mutualAuth) return false;
      return { evidence: [a2a ? "mutualAuth: false" : "A2A security properties not declared"] };
    },
    likelihood: () => 4,
    impact: () => 3,
    mitigationIds: ["MIT-AGENT-IDENTITY", "MIT-MESSAGE-SIGNING"],
    maps: {
      owaspAsi: ["ASI07"],
      owaspAsiRelated: ["ASI03"],
      cisco: ["OB-003", "OB-004"],
      ciscoTechniques: ["AITech-3.1", "AITech-4.1"],
      aisvs: ["C9"],
      stride: ["S"],
      maestroLayer: MaestroLayer.AgentEcosystem,
      catalogThreat: "t9",
    },
    references: [REF.asi],
  },
  {
    id: "TM-AGT-021",
    scope: "node",
    title: "A2A messages not signed or schema-validated",
    description:
      "Authenticated peers still exchange unsigned, free-form messages; a compromised peer or relay can alter tasks and smuggle instructions.",
    methodology: "component",
    appliesTo: (n) => n.kind === "a2a-peer",
    when: (ctx) => {
      const a2a = ctx.node!.data.semantics?.a2a;
      if (!a2a?.mutualAuth) return false;
      const missing = [
        ...(!a2a.messageSigning ? ["message signing"] : []),
        ...(!a2a.schemaValidation ? ["schema validation"] : []),
      ];
      if (missing.length === 0) return false;
      return { evidence: [`Missing: ${missing.join(", ")}`] };
    },
    likelihood: () => 3,
    impact: () => 3,
    mitigationIds: ["MIT-MESSAGE-SIGNING", "MIT-CONTEXT-SEGREGATION"],
    maps: {
      owaspAsi: ["ASI07"],
      cisco: ["OB-004"],
      ciscoTechniques: ["AITech-4.3"],
      aisvs: ["C9"],
      stride: ["T"],
      maestroLayer: MaestroLayer.AgentEcosystem,
      catalogThreat: "t12",
    },
  },
  {
    id: "TM-AGT-030",
    scope: "node",
    title: "Shared memory writable by untrusted agents",
    description:
      "Untrusted agents or sources have write access to memory that other agents trust — the highest-impact form of memory poisoning.",
    methodology: "component",
    appliesTo: (n) => n.isStore && !!n.data.semantics?.memory,
    when: (ctx) => {
      const w = untrustedWriters(ctx, ctx.node!);
      if (w.length === 0) return false;
      return {
        evidence: [
          `Write access granted to untrusted ${listLabels(
            ctx,
            w.map((x) => x.id),
          )}`,
          `Memory kind: ${ctx.node!.data.semantics!.memory!.kind}`,
        ],
        nodeIds: w.map((x) => x.id),
      };
    },
    likelihood: () => 4,
    impact: () => 5,
    gates: ["input"],
    propagates: true,
    maxHops: 1,
    propagatesTo: (n) => n.isAI,
    mitigationIds: ["MIT-MEMORY-VALIDATION", "MIT-MEMORY-ISOLATION", "MIT-AGENT-IDENTITY"],
    maps: {
      owaspAsi: ["ASI06"],
      cisco: ["OB-007", "OB-005"],
      ciscoTechniques: ["AITech-7.2", "AITech-5.1"],
      aisvs: ["C8"],
      stride: ["T"],
      maestroLayer: MaestroLayer.DataOperations,
      catalogThreat: "t1",
    },
    references: [REF.asi],
  },
  {
    id: "TM-AGT-031",
    scope: "node",
    title: "Memory without per-user isolation",
    description:
      "Memory shared across users without isolation lets one user's data surface in another user's session, or one user poison everyone's context.",
    methodology: "component",
    appliesTo: (n) => n.isStore && !!n.data.semantics?.memory,
    when: (ctx) => {
      const mem = ctx.node!.data.semantics!.memory!;
      if (mem.perUserIsolation || mem.kind === "session") return false;
      if (!ctx.h.reach(ctx.node!.id)) return false;
      return { evidence: [`Memory kind "${mem.kind}" declares perUserIsolation: false`] };
    },
    likelihood: () => 3,
    impact: () => 4,
    mitigationIds: ["MIT-MEMORY-ISOLATION", "MIT-DLP"],
    maps: {
      owaspAsi: ["ASI06"],
      cisco: ["OB-008"],
      ciscoTechniques: ["AITech-8.3"],
      aisvs: ["C8", "C5"],
      stride: ["I"],
      maestroLayer: MaestroLayer.DataOperations,
      catalogThreat: "t1",
    },
  },
  {
    id: "TM-AGT-032",
    scope: "node",
    title: "Indefinite retention of sensitive memory",
    description:
      "Sensitive conversation data is retained indefinitely, increasing breach impact and conflicting with data-minimisation duties.",
    methodology: "component",
    appliesTo: (n) => n.isStore && n.data.semantics?.memory?.retention === "indefinite",
    when: (ctx) => {
      const n = ctx.node!;
      const sensitive =
        n.isSensitive || [...ctx.h.inbound(n.id), ...ctx.h.outbound(n.id)].some((e) => e.sensitive);
      return sensitive ? { evidence: ["retention: indefinite", "Stores sensitive data"] } : false;
    },
    likelihood: () => 2,
    impact: () => 3,
    fixedSeverity: true,
    mitigationIds: ["MIT-DLP", "MIT-ENCRYPTION-AT-REST", "MIT-MEMORY-ISOLATION"],
    maps: {
      cisco: ["OB-008"],
      aisvs: ["C8"],
      stride: ["I"],
      maestroLayer: MaestroLayer.DataOperations,
    },
  },
  {
    id: "TM-AGT-040",
    scope: "node",
    title: "Overwhelming human-in-the-loop (approval fatigue)",
    description:
      "One approval gate fronts many high-risk actions; reviewers rubber-stamp under volume and attackers can hide a harmful request in the queue.",
    methodology: "component",
    appliesTo: (n) => n.isHitl,
    when: (ctx) => {
      const n = ctx.node!;
      const protectedIds = new Set<string>(n.data.semantics?.hitl?.protects ?? []);
      for (const e of ctx.h.outbound(n.id)) {
        const t = ctx.h.node(e.target);
        if (t && (t.isTool || t.isPrivileged || t.isExternal)) protectedIds.add(t.id);
      }
      if (protectedIds.size < 3) return false;
      return {
        evidence: [`Gates ${protectedIds.size} actions: ${listLabels(ctx, [...protectedIds])}`],
        nodeIds: [...protectedIds],
      };
    },
    likelihood: () => 3,
    impact: () => 3,
    fixedSeverity: true,
    mitigationIds: ["MIT-HITL-TRIAGE", "MIT-LEAST-PRIVILEGE"],
    maps: {
      owaspAsi: ["ASI09"],
      aisvs: ["C9"],
      stride: ["E"],
      maestroLayer: MaestroLayer.AgentEcosystem,
      catalogThreat: "t10",
    },
    references: [REF.tm],
  },
];

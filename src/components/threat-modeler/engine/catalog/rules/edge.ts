import { MaestroLayer } from "../../../types";
import type { ThreatRule } from "../types";
import { REF, edgeText, entryVia, isActionTarget, label } from "./util";

/** Edge-scope rules: replaces the copy-pasted if-chains of connectionRules.ts. */

const trustRank = { untrusted: 0, "semi-trusted": 1, trusted: 2 } as const;

export const EDGE_RULES: ThreatRule[] = [
  {
    id: "TM-CONN-001",
    scope: "edge",
    title: "Direct prompt injection / agent goal hijack",
    description:
      "Untrusted input flows straight into an AI component that treats it as instructions, letting an attacker override goals, extract data or trigger tools.",
    methodology: "connection",
    when: (ctx) => {
      const { edge, source, target } = ctx;
      if (!target!.isAI && !target!.profile.promptInjectionSurface) return false;
      if (target!.isGate) return false;
      const via = source!.isEntry
        ? { entry: source!, gates: [], edge: edge! }
        : source!.isGate
          ? entryVia(ctx, source!.id)
          : undefined;
      if (!via) return false;
      return {
        evidence: [
          `${via.entry.label} (${via.entry.data.trustLevel}) sends input to ${target!.label}`,
          edgeText(ctx, via.edge),
          ...(via.gates.length > 0 || source!.isGate
            ? [
                `Passes ${[...via.gates, ...(source!.isGate ? [source!] : [])]
                  .map((g) => g.label)
                  .join(", ")}`,
              ]
            : []),
        ],
        nodeIds: [via.entry.id],
        entryIds: [via.entry.id],
        data: { trustedEntry: via.entry.data.trustLevel === "trusted" },
      };
    },
    likelihood: (_c, m) => (m.data?.trustedEntry ? 3 : 4),
    impact: () => 3,
    gates: ["input"],
    propagates: true,
    maxHops: 2,
    propagatesTo: (n) => n.isAI || n.isTool,
    mitigationIds: [
      "MIT-INPUT-FILTER",
      "MIT-PROMPT-HARDENING",
      "MIT-GUARDRAIL",
      "MIT-LEAST-PRIVILEGE",
    ],
    maps: {
      owaspAsi: ["ASI01"],
      cisco: ["OB-001"],
      ciscoTechniques: ["AITech-1.1", "AITech-1.3"],
      aisvs: ["C2"],
      stride: ["T", "E"],
      maestroLayer: MaestroLayer.AgentFrameworks,
      catalogThreat: "t6",
    },
    references: [REF.asi, REF.tm],
  },
  {
    id: "TM-CONN-002",
    scope: "edge",
    title: "Indirect prompt injection via tool or API output",
    description:
      "An AI component consumes output from an untrusted tool, web page or external API; instructions hidden in that content are executed as if they came from the user.",
    methodology: "connection",
    when: (ctx) => {
      const { edge, source, target } = ctx;
      if (!source!.isAI) return false;
      const untrusted =
        target!.isExternal ||
        (target!.isTool && target!.data.trustLevel === "untrusted") ||
        /^kc6\.4/.test(target!.data.componentId ?? "");
      if (!untrusted) return false;
      return {
        evidence: [
          `${source!.label} consumes responses from ${target!.label} (${target!.data.trustLevel})`,
          edgeText(ctx, edge!),
        ],
        focusNodeId: source!.id,
        entryIds: [target!.id],
      };
    },
    likelihood: (ctx) => (ctx.target!.isExternal ? 4 : 3),
    impact: () => 3,
    gates: ["input", "tool-call"],
    propagates: true,
    maxHops: 1,
    propagatesTo: (n) => n.isAI || n.isTool,
    mitigationIds: [
      "MIT-CONTEXT-SEGREGATION",
      "MIT-INPUT-FILTER",
      "MIT-GUARDRAIL",
      "MIT-TOOL-ALLOWLIST",
    ],
    maps: {
      owaspAsi: ["ASI01"],
      owaspAsiRelated: ["ASI06"],
      cisco: ["OB-001"],
      ciscoTechniques: ["AITech-1.2"],
      aisvs: ["C2", "C9"],
      stride: ["T"],
      maestroLayer: MaestroLayer.AgentEcosystem,
      catalogThreat: "t6",
    },
    references: [REF.asi],
  },
  {
    id: "TM-CONN-003",
    scope: "edge",
    title: "Tool misuse via a hijacked agent",
    description:
      "A manipulated agent invokes a tool with legitimate permissions in a harmful way; severity follows the tool's access mode and risk tier.",
    methodology: "connection",
    when: (ctx) => {
      const { edge, source, target } = ctx;
      if (!source!.isAI || !isActionTarget(target!) || target!.isExecution) return false;
      const tool = target!.data.semantics?.tool;
      const allowListed = (tool?.allowList?.length ?? 0) > 0;
      return {
        evidence: [
          `${source!.label} invokes ${target!.label} (${target!.data.toolAccessMode ?? "access mode not set"}${
            target!.data.toolRiskTier ? `, ${target!.data.toolRiskTier}` : ""
          })`,
          edgeText(ctx, edge!),
          ...(allowListed ? ["Tool declares an allow-list"] : []),
        ],
        focusNodeId: target!.id,
        data: { danger: target!.profile.accessDanger, allowListed },
      };
    },
    likelihood: (ctx) => (ctx.target!.isPrivileged ? 4 : 3),
    impact: (_c, m) => {
      const d = m.data?.danger;
      if (d === "critical") return 5;
      if (d === "dangerous") return 4;
      if (d === "guarded") return 3;
      return m.data?.allowListed ? 1 : 2;
    },
    gates: ["hitl", "tool-call"],
    skipImpactFactors: ["tool"],
    mitigationIds: [
      "MIT-LEAST-PRIVILEGE",
      "MIT-TOOL-ALLOWLIST",
      "MIT-HITL-APPROVAL",
      "MIT-TOOL-SANDBOX",
      "MIT-AUDIT-LOGGING",
    ],
    maps: {
      owaspAsi: ["ASI02"],
      cisco: ["OB-012"],
      ciscoTechniques: ["AITech-12.1"],
      aisvs: ["C9"],
      stride: ["E", "T"],
      maestroLayer: MaestroLayer.AgentEcosystem,
      catalogThreat: "t2",
    },
    references: [REF.asi, REF.tm],
  },
  {
    id: "TM-CONN-006",
    scope: "edge",
    title: "Insecure inter-agent communication",
    description:
      "Messages between agents lack mutual authentication, integrity or schema validation, so a compromised or spoofed peer can inject instructions into another agent.",
    methodology: "connection",
    when: (ctx) => {
      const { edge, source, target } = ctx;
      if (!source!.isAgent || !target!.isAgent) return false;
      const a2a = target!.data.semantics?.a2a ?? source!.data.semantics?.a2a;
      const missing: string[] = [];
      if (!edge!.authenticated) missing.push("authentication");
      if (!edge!.encrypted) missing.push("encryption");
      if (!a2a) missing.push("declared message signing / schema validation");
      else {
        if (!a2a.mutualAuth && edge!.authenticated) missing.push("mutual authentication");
        if (!a2a.messageSigning) missing.push("message signing");
        if (!a2a.schemaValidation) missing.push("schema validation");
      }
      if (missing.length === 0) return false;
      return {
        evidence: [edgeText(ctx, edge!), `Missing: ${missing.join(", ")}`],
        data: { channelInsecure: !edge!.secure },
      };
    },
    likelihood: (ctx, m) => (!ctx.edge!.authenticated ? 4 : m.data?.channelInsecure ? 3 : 2),
    impact: () => 3,
    propagates: true,
    maxHops: 1,
    propagatesTo: (n) => n.isAgent,
    mitigationIds: [
      "MIT-AGENT-IDENTITY",
      "MIT-MESSAGE-SIGNING",
      "MIT-TLS",
      "MIT-CONTEXT-SEGREGATION",
    ],
    maps: {
      owaspAsi: ["ASI07"],
      cisco: ["OB-004"],
      ciscoTechniques: ["AITech-4.1", "AITech-4.3"],
      aisvs: ["C9"],
      stride: ["S", "T"],
      maestroLayer: MaestroLayer.AgentEcosystem,
      catalogThreat: "t12",
    },
    references: [REF.asi],
  },
  {
    id: "TM-CONN-007",
    scope: "edge",
    title: "Insecure connection to an external system",
    description:
      "A flow to or from an external system is unencrypted or unauthenticated, allowing eavesdropping, tampering or spoofed data.",
    methodology: "connection",
    when: (ctx) => {
      const { edge, source, target } = ctx;
      if (!source!.isExternal && !target!.isExternal) return false;
      if (edge!.secure) return false;
      return {
        evidence: [edgeText(ctx, edge!)],
        data: { both: !edge!.encrypted && !edge!.authenticated },
      };
    },
    likelihood: (_c, m) => (m.data?.both ? 4 : 3),
    impact: () => 3,
    mitigationIds: ["MIT-TLS", "MIT-STRONG-AUTHN", "MIT-SEGMENTATION"],
    maps: {
      cisco: ["OB-016", "OB-003"],
      ciscoTechniques: ["AITech-16.1", "AITech-3.1"],
      aisvs: ["C4", "C5"],
      stride: ["S", "T", "I"],
      maestroLayer: MaestroLayer.DeploymentInfrastructure,
    },
  },
  {
    id: "TM-CONN-008",
    scope: "edge",
    title: "Unencrypted internal data flow",
    description: "Internal traffic in clear text can be read or modified by anyone on the path.",
    methodology: "connection",
    when: (ctx) => {
      const { edge, source, target } = ctx;
      if (edge!.encrypted || source!.isExternal || target!.isExternal) return false;
      return { evidence: [edgeText(ctx, edge!)], data: { crosses: edge!.crossesBoundary } };
    },
    likelihood: (_c, m) => (m.data?.crosses ? 3 : 2),
    impact: () => 2,
    skipImpactFactors: ["blast", "tool"],
    mitigationIds: ["MIT-TLS", "MIT-SEGMENTATION"],
    maps: {
      cisco: ["OB-016"],
      ciscoTechniques: ["AITech-16.1"],
      aisvs: ["C4"],
      stride: ["I", "T"],
      maestroLayer: MaestroLayer.DataOperations,
    },
  },
  {
    id: "TM-CONN-009",
    scope: "edge",
    title: "Sensitive data sent to an untrusted component",
    description:
      "PII or confidential data flows to an external or untrusted component without evidence of minimisation or redaction.",
    methodology: "connection",
    when: (ctx) => {
      const { edge, target } = ctx;
      if (!edge!.sensitive || target!.isActor) return false;
      if (!target!.isExternal && target!.data.trustLevel !== "untrusted") return false;
      return { evidence: [edgeText(ctx, edge!), `${target!.label} is ${target!.data.trustLevel}`] };
    },
    likelihood: () => 3,
    impact: () => 3,
    mitigationIds: ["MIT-DLP", "MIT-OUTPUT-FILTER", "MIT-LEAST-PRIVILEGE"],
    maps: {
      cisco: ["OB-008"],
      ciscoTechniques: ["AITech-8.2"],
      aisvs: ["C7"],
      stride: ["I"],
      maestroLayer: MaestroLayer.DataOperations,
    },
  },
  {
    id: "TM-CONN-010",
    scope: "edge",
    title: "Unauthenticated access from an entry point",
    description:
      "A user-facing entry into the system has no authentication, so anyone can impersonate users, abuse the agent or exhaust it.",
    methodology: "connection",
    when: (ctx) => {
      const { edge, source, target } = ctx;
      if (edge!.authenticated) return false;
      if (!source!.isEntry || source!.isExternal) return false;
      if (!target!.isAI && !target!.isTool && !target!.isStore && !target!.isGate) return false;
      return { evidence: [edgeText(ctx, edge!)], focusNodeId: target!.id, entryIds: [source!.id] };
    },
    likelihood: (ctx) => (ctx.source!.data.trustLevel === "untrusted" ? 4 : 3),
    impact: () => 3,
    skipImpactFactors: ["blast"],
    mitigationIds: ["MIT-STRONG-AUTHN", "MIT-RATE-LIMIT", "MIT-AUDIT-LOGGING"],
    maps: {
      owaspAsi: ["ASI03"],
      cisco: ["OB-003", "OB-014"],
      ciscoTechniques: ["AITech-14.1"],
      aisvs: ["C5"],
      stride: ["S"],
      maestroLayer: MaestroLayer.SecurityCompliance,
      catalogThreat: "t9",
    },
  },
  {
    id: "TM-CONN-011",
    scope: "edge",
    title: "Cross-boundary flow without authentication",
    description:
      "A flow crosses a trust boundary without authentication, so a compromised component in one zone can talk to another zone as anyone.",
    methodology: "connection",
    when: (ctx) => {
      const { edge, source } = ctx;
      if (!edge!.crossesBoundary || edge!.authenticated || source!.isEntry) return false;
      return { evidence: [edgeText(ctx, edge!), "Crosses a trust boundary"] };
    },
    likelihood: () => 3,
    impact: () => 3,
    mitigationIds: ["MIT-STRONG-AUTHN", "MIT-AGENT-IDENTITY", "MIT-SEGMENTATION"],
    maps: {
      owaspAsiRelated: ["ASI03"],
      cisco: ["OB-014"],
      ciscoTechniques: ["AITech-14.1"],
      aisvs: ["C5", "C4"],
      stride: ["S", "E"],
      maestroLayer: MaestroLayer.SecurityCompliance,
    },
  },
  {
    id: "TM-CONN-012",
    scope: "edge",
    title: "Data-layer compromise crosses into the agent zone",
    description:
      "A store in a less-trusted zone feeds an agent in a more-trusted zone; poisoned data crosses the boundary and misaligns the agent's goals (MAESTRO L2 → L7).",
    methodology: "MAESTRO",
    when: (ctx) => {
      const { edge, source, target } = ctx;
      if (!source!.isStore || !target!.isAgent || !edge!.crossesBoundary) return false;
      if (trustRank[source!.data.trustLevel] > trustRank[target!.data.trustLevel]) return false;
      return {
        evidence: [
          edgeText(ctx, edge!),
          `${source!.label} → ${target!.label} crosses a trust boundary`,
        ],
        focusNodeId: target!.id,
      };
    },
    likelihood: () => 2,
    impact: () => 4,
    mitigationIds: ["MIT-MEMORY-VALIDATION", "MIT-CONTEXT-SEGREGATION", "MIT-REASONING-VALIDATION"],
    maps: {
      owaspAsi: ["ASI06"],
      owaspAsiRelated: ["ASI08"],
      cisco: ["OB-007"],
      ciscoTechniques: ["AITech-7.3"],
      aisvs: ["C8", "C9"],
      stride: ["T"],
      maestroLayer: MaestroLayer.DataOperations,
      catalogThreat: "t1",
    },
    references: [REF.maestro],
  },
  {
    id: "TM-CONN-013",
    scope: "edge",
    title: "Lateral movement from execution environment to data",
    description:
      "An execution environment has a direct path to a data store; code run there (by a hijacked agent) can read or alter the data (MAESTRO L4 → L2).",
    methodology: "MAESTRO",
    when: (ctx) => {
      const { edge, source, target } = ctx;
      if (!(source!.isExecution || source!.kind === "infrastructure")) return false;
      if (!target!.isStore && !target!.isSensitive) return false;
      return {
        evidence: [edgeText(ctx, edge!), `${label(ctx, source!.id)} can reach ${target!.label}`],
        focusNodeId: target!.id,
      };
    },
    likelihood: () => 2,
    impact: () => 4,
    mitigationIds: ["MIT-SEGMENTATION", "MIT-LEAST-PRIVILEGE", "MIT-CODE-SANDBOX"],
    maps: {
      owaspAsiRelated: ["ASI05"],
      cisco: ["OB-014"],
      ciscoTechniques: ["AITech-14.1"],
      aisvs: ["C4"],
      stride: ["E"],
      maestroLayer: MaestroLayer.DeploymentInfrastructure,
      catalogThreat: "t3",
    },
    references: [REF.maestro],
  },
];

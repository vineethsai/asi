import { MaestroLayer } from "../../../types";
import type { NodeInfo } from "../../graph";
import { lv, type MatchEvidence, type RuleContext, type ThreatRule } from "../types";
import {
  DANGER_WEIGHT,
  REF,
  edgeText,
  hasProvenance,
  isActionTarget,
  label,
  listLabels,
} from "./util";

/** Node-scope rules: MAESTRO layer threats converted to predicates (P3-09). */

const exposedEdges = (ctx: RuleContext, n: NodeInfo) =>
  ctx.h.inbound(n.id).filter((e) => ctx.h.node(e.source)?.isEntry);

function reachEvidence(ctx: RuleContext, n: NodeInfo): MatchEvidence | false {
  const r = ctx.h.reach(n.id);
  if (!r || r.hops === 0) return false;
  return {
    evidence: [
      `${n.label} is reachable from ${label(ctx, r.path[0])} in ${r.hops} hop(s): ${r.path
        .map((id) => label(ctx, id))
        .join(" → ")}`,
    ],
  };
}

/** Writers of a store whose input an attacker can influence. */
function influencedWriters(ctx: RuleContext, n: NodeInfo) {
  const writers = ctx.h.writers(n.id);
  return writers.filter((w) => w.isEntry || (!!ctx.h.reach(w.id) && !w.isObservability));
}

const isRetrievalStore = (n: NodeInfo) =>
  /^kc4\.3|^kc6\.3\.3/.test(n.data.componentId ?? "") ||
  n.data.semantics?.memory?.kind === "vector" ||
  n.data.semantics?.memory?.kind === "semantic";

function ragIngest(ctx: RuleContext, n: NodeInfo): MatchEvidence | false {
  if (!n.isStore) return false;
  const ingest = ctx.h.inbound(n.id).filter((e) => {
    const src = ctx.h.node(e.source);
    return !!src && !src.isActor && (src.isExternal || src.data.trustLevel === "untrusted");
  });
  if (ingest.length === 0) return false;
  const consumers = [
    ...ctx.h.outbound(n.id).map((e) => e.target),
    ...ctx.h.inbound(n.id).map((e) => e.source),
  ].filter((id) => ctx.h.node(id)?.isAI);
  if (consumers.length === 0 && !isRetrievalStore(n)) return false;
  return {
    evidence: [
      ...ingest.map((e) => `Ingests content from ${label(ctx, e.source)} — ${edgeText(ctx, e)}`),
      ...(consumers.length > 0 ? [`Retrieved by ${listLabels(ctx, [...new Set(consumers)])}`] : []),
    ],
    data: { unauthenticated: ingest.some((e) => !e.authenticated) },
  };
}

function sharedUntrustedWrite(ctx: RuleContext, n: NodeInfo): MatchEvidence | false {
  const mem = n.data.semantics?.memory;
  if (!mem) return false;
  const declared = mem.writeAccess
    .map((id) => ctx.h.node(id))
    .filter((w): w is NodeInfo => !!w && (w.isEntry || w.data.trustLevel === "untrusted"));
  if (declared.length === 0) return false;
  return {
    evidence: [
      `Memory kind "${mem.kind}" grants write access to untrusted ${listLabels(
        ctx,
        declared.map((w) => w.id),
      )}`,
    ],
  };
}

export const NODE_RULES: ThreatRule[] = [
  {
    id: "TM-NODE-001",
    scope: "node",
    title: "Model safety-alignment bypass (jailbreak)",
    description:
      "Adversarial prompts crafted to bypass the model's safety training and system instructions so it produces disallowed output or follows attacker goals.",
    methodology: "MAESTRO",
    appliesTo: (n) => n.isModel,
    when: (ctx) => reachEvidence(ctx, ctx.node!),
    likelihood: () => 3,
    impact: () => 3,
    gates: ["input"],
    mitigationIds: ["MIT-INPUT-FILTER", "MIT-GUARDRAIL", "MIT-PROMPT-HARDENING", "MIT-SECURE-SDLC"],
    maps: {
      owaspAsi: ["ASI01"],
      cisco: ["OB-001", "OB-011"],
      ciscoTechniques: ["AITech-1.1", "AITech-11.1"],
      aisvs: ["C11", "C7"],
      stride: ["T", "E"],
      maestroLayer: MaestroLayer.FoundationModels,
      catalogThreat: "t6",
    },
    references: [REF.asi, REF.maestro],
  },
  {
    id: "TM-NODE-002",
    scope: "node",
    title: "Model extraction through an exposed endpoint",
    description:
      "An externally reachable model can be systematically queried to replicate its behaviour or recover proprietary fine-tuning.",
    methodology: "MAESTRO",
    appliesTo: (n) => n.isModel,
    when: (ctx) => {
      const n = ctx.node!;
      const exposed = exposedEdges(ctx, n);
      if (exposed.length === 0 && n.data.trustLevel !== "untrusted") return false;
      return {
        evidence:
          exposed.length > 0
            ? exposed.map((e) => `Directly exposed: ${edgeText(ctx, e)}`)
            : [`${n.label} is marked untrusted (exposed)`],
      };
    },
    likelihood: () => 2,
    impact: (ctx) => (ctx.node!.kind === "training-pipeline" ? 4 : 3),
    mitigationIds: ["MIT-RATE-LIMIT", "MIT-QUERY-MONITOR", "MIT-WATERMARK", "MIT-STRONG-AUTHN"],
    maps: {
      cisco: ["OB-010"],
      ciscoTechniques: ["AITech-10.1"],
      aisvs: ["C11"],
      stride: ["I"],
      maestroLayer: MaestroLayer.FoundationModels,
    },
    references: [REF.maestro],
  },
  {
    id: "TM-NODE-003",
    scope: "node",
    title: "Unverified model provenance (backdoored weights)",
    description:
      "Model weights obtained without signed provenance or a pinned version may contain backdoors or poisoned behaviour that activates on attacker triggers and flows into every caller.",
    methodology: "MAESTRO",
    appliesTo: (n) => n.isModel,
    when: (ctx) =>
      hasProvenance(ctx.node!)
        ? false
        : { evidence: [`No signed, pinned provenance declared for ${ctx.node!.label}`] },
    likelihood: () => 2,
    impact: () => 4,
    propagates: true,
    maxHops: 1,
    propagatesTo: (n) => n.isAgent,
    mitigationIds: ["MIT-MODEL-PROVENANCE", "MIT-DEP-PINNING", "MIT-SECURE-SDLC"],
    maps: {
      owaspAsi: ["ASI04"],
      cisco: ["OB-009"],
      ciscoTechniques: ["AITech-9.1"],
      aisvs: ["C6", "C3"],
      stride: ["T"],
      maestroLayer: MaestroLayer.FoundationModels,
      catalogThreat: "t17",
    },
    references: [REF.asi, REF.aisvs],
  },
  {
    id: "TM-NODE-004",
    scope: "node",
    title: "Training / fine-tuning data poisoning",
    description:
      "Poisoned samples in the fine-tuning or training pipeline implant behaviour the attacker can trigger later.",
    methodology: "MAESTRO",
    appliesTo: (n) => n.kind === "training-pipeline",
    when: (ctx) => {
      const n = ctx.node!;
      const writers = ctx.h.writers(n.id);
      return {
        evidence: [
          `${n.label} is a trained / fine-tuned component`,
          ...(writers.length > 0
            ? [
                `Training inputs from ${listLabels(
                  ctx,
                  writers.map((w) => w.id),
                )}`,
              ]
            : []),
        ],
        data: { untrustedWriter: writers.some((w) => w.isEntry) },
      };
    },
    likelihood: (_c, m) => (m.data?.untrustedWriter ? 4 : 2),
    impact: () => 4,
    fixedSeverity: false,
    mitigationIds: ["MIT-TRAINING-DATA-VALIDATION", "MIT-MODEL-PROVENANCE", "MIT-SECURE-SDLC"],
    maps: {
      cisco: ["OB-006"],
      ciscoTechniques: ["AITech-6.1"],
      aisvs: ["C1"],
      stride: ["T"],
      maestroLayer: MaestroLayer.FoundationModels,
    },
    references: [REF.aisvs],
  },
  {
    id: "TM-NODE-005",
    scope: "node",
    title: "Membership inference / training-data disclosure",
    description:
      "Queries against a fine-tuned model reveal whether specific records were in its training data or regurgitate them.",
    methodology: "MAESTRO",
    appliesTo: (n) => n.kind === "training-pipeline",
    when: (ctx) => reachEvidence(ctx, ctx.node!),
    likelihood: () => 2,
    impact: () => 3,
    mitigationIds: ["MIT-PRIVACY-PRESERVING", "MIT-QUERY-MONITOR", "MIT-OUTPUT-FILTER"],
    maps: {
      cisco: ["OB-008"],
      ciscoTechniques: ["AITech-8.1"],
      aisvs: ["C11"],
      stride: ["I"],
      maestroLayer: MaestroLayer.FoundationModels,
    },
  },
  {
    id: "TM-NODE-006",
    scope: "node",
    title: "Resource exhaustion / denial of wallet",
    description:
      "Unbounded, expensive or recursive requests from an entry point exhaust model capacity or budget.",
    methodology: "MAESTRO",
    appliesTo: (n) => n.isAI,
    when: (ctx) => {
      const n = ctx.node!;
      if (n.data.semantics?.tool?.rateLimit) return false;
      const exposed = exposedEdges(ctx, n);
      if (exposed.length === 0) return false;
      return { evidence: exposed.map((e) => `First AI hop for ${edgeText(ctx, e)}`) };
    },
    likelihood: () => 3,
    impact: () => 2,
    skipImpactFactors: ["data"],
    mitigationIds: ["MIT-RATE-LIMIT", "MIT-CIRCUIT-BREAKER", "MIT-BEHAVIOR-MONITOR"],
    maps: {
      cisco: ["OB-013"],
      ciscoTechniques: ["AITech-13.1", "AITech-13.2"],
      aisvs: ["C4"],
      stride: ["D"],
      maestroLayer: MaestroLayer.DeploymentInfrastructure,
      catalogThreat: "t4",
    },
    references: [REF.tm],
  },
  {
    id: "TM-NODE-010",
    scope: "node",
    title: "Memory & context poisoning",
    description:
      "Content an attacker can influence is written to persistent memory and later retrieved as trusted context, steering future sessions or other agents.",
    methodology: "MAESTRO",
    appliesTo: (n) => n.isStore,
    when: (ctx) => {
      const n = ctx.node!;
      if (ragIngest(ctx, n) || sharedUntrustedWrite(ctx, n)) return false;
      const writers = influencedWriters(ctx, n);
      if (writers.length === 0) return false;
      const shared =
        /^kc4\.(2|4|6)/.test(n.data.componentId ?? "") ||
        n.data.semantics?.memory?.kind === "shared" ||
        writers.filter((w) => w.isAI).length >= 2;
      const persistent =
        /^kc4\.(3|4|5|6)/.test(n.data.componentId ?? "") ||
        n.data.semantics?.memory?.retention === "months" ||
        n.data.semantics?.memory?.retention === "indefinite";
      return {
        evidence: [
          `Written by ${listLabels(
            ctx,
            writers.map((w) => w.id),
          )}, which untrusted input can influence`,
          ...(shared ? ["Shared across agents or users"] : []),
          ...(persistent ? ["Persists across sessions"] : []),
        ],
        data: { direct: writers.some((w) => w.isEntry), shared, persistent },
      };
    },
    likelihood: (_c, m) => (m.data?.direct ? 4 : 3),
    impact: (_c, m) => lv(3 + (m.data?.shared ? 1 : 0) + (m.data?.persistent ? 1 : 0)),
    gates: ["input"],
    propagates: true,
    maxHops: 1,
    propagatesTo: (n) => n.isAI,
    mitigationIds: [
      "MIT-MEMORY-VALIDATION",
      "MIT-MEMORY-ISOLATION",
      "MIT-CONTEXT-SEGREGATION",
      "MIT-AUDIT-LOGGING",
    ],
    maps: {
      owaspAsi: ["ASI06"],
      cisco: ["OB-007", "OB-005"],
      ciscoTechniques: ["AITech-7.2", "AITech-5.1"],
      aisvs: ["C8"],
      stride: ["T"],
      maestroLayer: MaestroLayer.DataOperations,
      catalogThreat: "t1",
    },
    references: [REF.asi, REF.tm],
  },
  {
    id: "TM-NODE-011",
    scope: "node",
    title: "Retrieval source poisoning (indirect prompt injection)",
    description:
      "A retrieval store ingests content from an untrusted source; documents carrying hidden instructions are retrieved into model context and hijack its behaviour.",
    methodology: "MAESTRO",
    appliesTo: (n) => n.isStore,
    when: (ctx) => ragIngest(ctx, ctx.node!),
    likelihood: (_c, m) => (m.data?.unauthenticated ? 4 : 3),
    impact: () => 4,
    gates: ["input"],
    propagates: true,
    maxHops: 1,
    propagatesTo: (n) => n.isAI,
    mitigationIds: [
      "MIT-RAG-SOURCE-VALIDATION",
      "MIT-CONTEXT-SEGREGATION",
      "MIT-MEMORY-VALIDATION",
      "MIT-INPUT-FILTER",
    ],
    maps: {
      owaspAsi: ["ASI01", "ASI06"],
      cisco: ["OB-001", "OB-007"],
      ciscoTechniques: ["AITech-1.2", "AITech-7.3"],
      aisvs: ["C8", "C2"],
      stride: ["T"],
      maestroLayer: MaestroLayer.DataOperations,
      catalogThreat: "t1",
    },
    references: [REF.asi, REF.tm],
  },
  {
    id: "TM-NODE-012",
    scope: "node",
    title: "Sensitive data disclosure from a store",
    description:
      "A store holding PII, credentials or regulated data is queryable through an AI component that an attacker can steer, enabling exfiltration through responses.",
    methodology: "MAESTRO",
    appliesTo: (n) => n.isStore,
    when: (ctx) => {
      const n = ctx.node!;
      const flows = [...ctx.h.inbound(n.id), ...ctx.h.outbound(n.id)].filter((e) => e.sensitive);
      if (!n.isSensitive && flows.length === 0) return false;
      const r = ctx.h.reach(n.id);
      if (!r || r.hops < 2) return false;
      return {
        evidence: [
          n.isSensitive
            ? `${n.label} holds ${n.data.dataSensitivity} data`
            : `Sensitive flows: ${flows.map((e) => edgeText(ctx, e)).join("; ")}`,
          `Reachable from ${label(ctx, r.path[0])} via ${r.path
            .slice(1, -1)
            .map((id) => label(ctx, id))
            .join(" → ")}`,
        ],
      };
    },
    likelihood: () => 3,
    impact: () => 3,
    gates: ["output"],
    gateDirection: "outbound",
    mitigationIds: [
      "MIT-DLP",
      "MIT-ENCRYPTION-AT-REST",
      "MIT-OUTPUT-FILTER",
      "MIT-LEAST-PRIVILEGE",
    ],
    maps: {
      cisco: ["OB-008"],
      ciscoTechniques: ["AITech-8.2", "AITech-8.3"],
      aisvs: ["C8", "C7"],
      stride: ["I"],
      maestroLayer: MaestroLayer.DataOperations,
    },
  },
  {
    id: "TM-NODE-020",
    scope: "node",
    title: "Function-call schema exploitation",
    description:
      "Crafted input manipulates a function-calling schema to invoke unintended functions or pass malicious arguments.",
    methodology: "MAESTRO",
    appliesTo: (n) => n.profile.functionCallSurface,
    when: (ctx) => {
      const n = ctx.node!;
      const tools = ctx.h
        .outbound(n.id)
        .map((e) => e.target)
        .filter((id) => {
          const t = ctx.h.node(id);
          return !!t && isActionTarget(t);
        });
      return {
        evidence: [
          `${n.label} defines a function-call schema`,
          ...(tools.length > 0 ? [`Drives ${listLabels(ctx, tools)}`] : []),
        ],
        nodeIds: tools,
      };
    },
    likelihood: () => 3,
    impact: (_c, m) => ((m.nodeIds?.length ?? 0) > 0 ? 3 : 2),
    gates: ["input", "tool-call"],
    mitigationIds: [
      "MIT-TOOL-ALLOWLIST",
      "MIT-LEAST-PRIVILEGE",
      "MIT-AUDIT-LOGGING",
      "MIT-RATE-LIMIT",
    ],
    maps: {
      owaspAsi: ["ASI02"],
      cisco: ["OB-012"],
      ciscoTechniques: ["AITech-12.1"],
      aisvs: ["C9"],
      stride: ["T", "E"],
      maestroLayer: MaestroLayer.AgentFrameworks,
      catalogThreat: "t2",
    },
  },
  {
    id: "TM-NODE-021",
    scope: "node",
    title: "System prompt extraction",
    description:
      "Attackers coax the model into revealing its system prompt, exposing business logic, guardrail wording or embedded secrets.",
    methodology: "MAESTRO",
    appliesTo: (n) => n.data.promptType === "system",
    when: (ctx) => reachEvidence(ctx, ctx.node!),
    likelihood: () => 3,
    impact: () => 2,
    gates: ["output"],
    gateDirection: "outbound",
    mitigationIds: ["MIT-PROMPT-HARDENING", "MIT-OUTPUT-FILTER", "MIT-DLP"],
    maps: {
      cisco: ["OB-008"],
      ciscoTechniques: ["AITech-8.4"],
      aisvs: ["C7", "C2"],
      stride: ["I"],
      maestroLayer: MaestroLayer.AgentFrameworks,
    },
  },
  {
    id: "TM-NODE-022",
    scope: "node",
    title: "Excessive agency",
    description:
      "One agent holds many or high-risk tools, so a single hijack or reasoning error has a large blast radius.",
    methodology: "topology",
    appliesTo: (n) => n.isAI,
    when: (ctx) => {
      const n = ctx.node!;
      const targets = [...new Set(ctx.h.outbound(n.id).map((e) => e.target))]
        .map((id) => ctx.h.node(id)!)
        .filter((t) => isActionTarget(t) || t.isPrivileged);
      const weighted = targets.reduce(
        (s, t) => s + (DANGER_WEIGHT[t.profile.accessDanger] ?? 1),
        0,
      );
      if (weighted < 3) return false;
      const privileged = targets.filter((t) => t.isPrivileged);
      return {
        evidence: [
          `${n.label} can call ${targets.length} tools (weighted ${weighted.toFixed(1)}): ${listLabels(
            ctx,
            targets.map((t) => t.id),
          )}`,
          ...(privileged.length > 0
            ? [
                `High-risk: ${listLabels(
                  ctx,
                  privileged.map((t) => t.id),
                )}`,
              ]
            : []),
        ],
        nodeIds: targets.map((t) => t.id),
        data: { privileged: privileged.length > 0 },
      };
    },
    likelihood: () => 3,
    impact: (_c, m) => (m.data?.privileged ? 4 : 3),
    gates: ["hitl", "tool-call"],
    skipImpactFactors: ["tool"],
    mitigationIds: [
      "MIT-LEAST-PRIVILEGE",
      "MIT-HITL-APPROVAL",
      "MIT-TOOL-ALLOWLIST",
      "MIT-BEHAVIOR-MONITOR",
    ],
    maps: {
      owaspAsi: ["ASI02"],
      owaspAsiRelated: ["ASI03"],
      cisco: ["OB-002", "OB-012"],
      aisvs: ["C9", "C5"],
      stride: ["E"],
      maestroLayer: MaestroLayer.AgentFrameworks,
      catalogThreat: "t2",
    },
  },
  {
    id: "TM-NODE-023",
    scope: "node",
    title: "Lethal trifecta: untrusted content, private data and an exfiltration channel",
    description:
      "One agent is exposed to attacker-controlled content, can read private data and can send data out. An indirect prompt injection can exfiltrate that data without any user action.",
    methodology: "topology",
    appliesTo: (n) => n.isAgent || n.isModel,
    when: (ctx) => {
      const n = ctx.node!;
      // (a) untrusted content: a non-human entry influences this node.
      const untrusted = [
        ...ctx.h.inbound(n.id).map((e) => e.source),
        ...ctx.h.outbound(n.id).map((e) => e.target),
      ]
        .map((id) => ctx.h.node(id)!)
        .filter((x) => !x.isActor && (x.isExternal || x.data.trustLevel === "untrusted"));
      const viaStore = ctx.h
        .outbound(n.id)
        .map((e) => ctx.h.node(e.target)!)
        .concat(ctx.h.inbound(n.id).map((e) => ctx.h.node(e.source)!))
        .filter(
          (s) =>
            s.isStore &&
            ctx.h.inbound(s.id).some((e) => {
              const w = ctx.h.node(e.source);
              return !!w && !w.isActor && (w.isExternal || w.data.trustLevel === "untrusted");
            }),
        );
      if (untrusted.length === 0 && viaStore.length === 0) return false;
      // (b) private data
      const flows = [...ctx.h.inbound(n.id), ...ctx.h.outbound(n.id)];
      const privateData =
        flows.some((e) => e.sensitive) ||
        flows.some((e) => ctx.h.node(e.source === n.id ? e.target : e.source)?.isSensitive);
      if (!privateData) return false;
      // (c) ungated outbound channel to an external system
      const channels = ctx.h.outbound(n.id).filter((e) => {
        const t = ctx.h.node(e.target)!;
        return t.isExternal || (t.isTool && /^kc6\.4/.test(t.data.componentId ?? ""));
      });
      if (channels.length === 0) return false;
      return {
        evidence: [
          `Untrusted content from ${listLabels(
            ctx,
            [...untrusted, ...viaStore].map((x) => x.id),
          )}`,
          "Has access to sensitive data (PII / confidential flows or stores)",
          `Can send data out via ${channels.map((e) => edgeText(ctx, e)).join("; ")}`,
        ],
        nodeIds: channels.map((e) => e.target),
      };
    },
    likelihood: () => 4,
    impact: () => 4,
    mitigationIds: [
      "MIT-CONTEXT-SEGREGATION",
      "MIT-DLP",
      "MIT-HITL-APPROVAL",
      "MIT-TOOL-ALLOWLIST",
      "MIT-LEAST-PRIVILEGE",
    ],
    maps: {
      owaspAsi: ["ASI01"],
      owaspAsiRelated: ["ASI02"],
      cisco: ["OB-008", "OB-001"],
      ciscoTechniques: ["AITech-8.2", "AITech-1.2"],
      aisvs: ["C9", "C7"],
      stride: ["I"],
      maestroLayer: MaestroLayer.AgentEcosystem,
      catalogThreat: "t6",
    },
    references: [REF.trifecta, REF.asi],
  },
  {
    id: "TM-NODE-030",
    scope: "node",
    title: "Unexpected code execution",
    description:
      "A component executes model-generated code or commands; a hijacked agent can run arbitrary code on the host and pivot from it.",
    methodology: "MAESTRO",
    appliesTo: (n) => n.isExecution,
    when: (ctx) => {
      const n = ctx.node!;
      const callers = ctx.h
        .inbound(n.id)
        .map((e) => e.source)
        .filter((id) => !ctx.h.node(id)?.isActor);
      return {
        evidence: [
          `${n.label} can execute code (${n.data.toolAccessMode ?? n.data.componentId ?? "execution environment"})`,
          ...(callers.length > 0 ? [`Invoked by ${listLabels(ctx, callers)}`] : []),
          ...(n.boundaryId ? [] : ["Not isolated inside a trust boundary"]),
        ],
        nodeIds: callers,
      };
    },
    likelihood: () => 3,
    impact: () => 5,
    gates: ["hitl", "tool-call"],
    skipImpactFactors: ["tool"],
    mitigationIds: [
      "MIT-CODE-SANDBOX",
      "MIT-TOOL-SANDBOX",
      "MIT-HITL-APPROVAL",
      "MIT-SEGMENTATION",
      "MIT-BEHAVIOR-MONITOR",
    ],
    maps: {
      owaspAsi: ["ASI05"],
      cisco: ["OB-012"],
      ciscoTechniques: ["AITech-12.1", "AITech-12.2"],
      aisvs: ["C9", "C4"],
      stride: ["E"],
      maestroLayer: MaestroLayer.DeploymentInfrastructure,
      catalogThreat: "t11",
    },
    references: [REF.asi],
  },
  {
    id: "TM-NODE-040",
    scope: "node",
    title: "Sensitive data leakage through telemetry",
    description:
      "Prompts, responses and tool arguments captured in logs or traces expose PII and secrets to anyone with dashboard access.",
    methodology: "MAESTRO",
    appliesTo: (n) => n.isObservability,
    when: (ctx) => {
      const n = ctx.node!;
      const sensitive = ctx.h.inbound(n.id).filter((e) => e.sensitive);
      const fromSensitiveSystem = ctx.graph.nodes.some(
        (x) => x.isSensitive || ctx.graph.edges.some((e) => e.sensitive),
      );
      if (sensitive.length === 0 && !fromSensitiveSystem) return false;
      return {
        evidence:
          sensitive.length > 0
            ? sensitive.map((e) => `Receives ${edgeText(ctx, e)}`)
            : ["The modelled system processes PII or sensitive data that telemetry may capture"],
      };
    },
    likelihood: () => 2,
    impact: () => 3,
    mitigationIds: ["MIT-LOG-REDACTION", "MIT-ENCRYPTION-AT-REST", "MIT-DLP"],
    maps: {
      cisco: ["OB-008"],
      ciscoTechniques: ["AITech-8.3"],
      aisvs: ["C12"],
      stride: ["I"],
      maestroLayer: MaestroLayer.EvaluationObservability,
    },
  },
  {
    id: "TM-NODE-041",
    scope: "node",
    title: "Audit trail tampering (repudiation)",
    description:
      "Agents that can write to their own audit trail can erase or forge evidence of what they did once compromised.",
    methodology: "MAESTRO",
    appliesTo: (n) => n.isObservability,
    when: (ctx) => {
      const n = ctx.node!;
      if (n.data.semantics?.observability?.immutable) return false;
      const writers = ctx.h.writers(n.id).filter((w) => w.isAI);
      if (writers.length === 0) return false;
      return {
        evidence: [
          `Writable by ${listLabels(
            ctx,
            writers.map((w) => w.id),
          )}`,
          "Not declared append-only / immutable",
        ],
      };
    },
    likelihood: () => 2,
    impact: () => 3,
    skipImpactFactors: ["data", "blast"],
    mitigationIds: ["MIT-AUDIT-LOGGING", "MIT-BEHAVIOR-MONITOR"],
    maps: {
      owaspAsiRelated: ["ASI08"],
      cisco: ["OB-009"],
      ciscoTechniques: ["AITech-9.2"],
      aisvs: ["C12"],
      stride: ["R"],
      maestroLayer: MaestroLayer.EvaluationObservability,
      catalogThreat: "t8",
    },
  },
  {
    id: "TM-NODE-050",
    scope: "node",
    title: "Guardrail evasion",
    description:
      "Obfuscated, encoded or multi-turn inputs slip past the guardrail; traffic it does not inspect is not protected at all.",
    methodology: "MAESTRO",
    appliesTo: (n) => n.isGuardrail,
    when: (ctx) => {
      const n = ctx.node!;
      const all = ["input", "output", "tool-call"] as const;
      const missing = all.filter((c) => !n.coverage.has(c));
      return {
        evidence: [
          `Covers: ${[...n.coverage].join(", ") || "nothing declared"}`,
          ...(missing.length > 0 ? [`Does not inspect: ${missing.join(", ")}`] : []),
        ],
        data: { missing: missing.length },
      };
    },
    likelihood: (_c, m) => ((m.data?.missing as number) >= 2 ? 3 : 2),
    impact: () => 3,
    skipImpactFactors: ["data", "blast"],
    mitigationIds: ["MIT-SECURE-SDLC", "MIT-BEHAVIOR-MONITOR", "MIT-OUTPUT-FILTER"],
    maps: {
      owaspAsi: ["ASI01"],
      cisco: ["OB-001", "OB-011"],
      ciscoTechniques: ["AITech-11.1"],
      aisvs: ["C2", "C7", "C11"],
      stride: ["T"],
      maestroLayer: MaestroLayer.SecurityCompliance,
    },
  },
  {
    id: "TM-NODE-060",
    scope: "node",
    title: "Single point of failure",
    description:
      "A hub connected to nearly every component: its compromise or outage affects the whole system.",
    methodology: "topology",
    appliesTo: (n) => !n.isActor && !n.isExternal,
    when: (ctx) => {
      const n = ctx.node!;
      const total = ctx.graph.nodes.length;
      if (total < 4) return false;
      const distinct = ctx.graph.neighbours.get(n.id)?.size ?? 0;
      if (distinct < Math.max(3, total - 1)) return false;
      return {
        evidence: [`${n.label} connects to ${distinct} of ${total - 1} other components`],
      };
    },
    likelihood: () => 2,
    impact: () => 3,
    skipImpactFactors: ["data"],
    mitigationIds: ["MIT-CIRCUIT-BREAKER", "MIT-SEGMENTATION", "MIT-KILL-SWITCH"],
    maps: {
      owaspAsi: ["ASI08"],
      cisco: ["OB-013"],
      ciscoTechniques: ["AITech-13.1"],
      aisvs: ["C4"],
      stride: ["D"],
      maestroLayer: MaestroLayer.DeploymentInfrastructure,
    },
  },
];

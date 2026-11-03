import { aiuc1Principles, AIUC1_VERSION } from "@/components/components/aiuc1Data";
import type { GeneratedThreat } from "../types";
import {
  type EdgeInfo,
  type GateKind,
  type ModelGraph,
  type NodeInfo,
  type ReachInfo,
  reachFrom,
} from "./graph";
import { observedNodeIds } from "./catalog/rules/model";
import { aisvsChapterOf } from "./catalog/aisvs";
import { getMitigation } from "./catalog/mitigations";
import { getAisvsChapters } from "./aisvsSource";
import type { AISVSCoverageResult, AISVSMapping, RequirementStatus } from "./aisvsMapping";
import type { ComplianceGapReport } from "./complianceGap";
import type { ComplianceViolation } from "./dataFlowCompliance";
import type {
  Aiuc1ComplianceResult,
  Aiuc1PrincipleScore,
  Aiuc1RequirementStatus,
} from "./aiuc1Compliance";

// ─── Types ───────────────────────────────────────────────────────

export type Verdict = "met" | "partial" | "gap" | "not-applicable";

export interface CheckSubject {
  /** Node id, edge id or "model". */
  id: string;
  label: string;
  status: "ok" | "partial" | "missing";
  note: string;
}

export interface ComplianceCheckResult {
  id: string;
  title: string;
  description: string;
  verdict: Verdict;
  /** One line per subject: what was found. */
  evidence: string[];
  subjects: CheckSubject[];
  aisvs: string[];
  aiuc1: string[];
  mitigationIds: string[];
  relatedRuleIds: string[];
  linkedThreats: string[];
  recommendation: string;
}

export interface AisvsChapterResult {
  code: string;
  name: string;
  verdict: Verdict;
  checks: string[];
  evidence: string[];
  linkedThreats: string[];
  mitigatedThreats: string[];
  requirementCount?: number;
}

export interface ComplianceResult {
  /** Verdicts are derived from the diagram only — label them "indicative". */
  indicative: true;
  checks: ComplianceCheckResult[];
  aisvs: {
    version: string;
    chapters: AisvsChapterResult[];
    summary: { met: number; partial: number; gap: number; notApplicable: number; percent: number };
  };
  aiuc1: Aiuc1ComplianceResult;
  dataFlow: ComplianceViolation[];
  /** Legacy shapes for existing panels/exports. */
  aisvsResult: AISVSCoverageResult;
  complianceGapReport: ComplianceGapReport;
}

export interface ComplianceInput {
  graph: ModelGraph;
  /** Direct + inherited threats after residual scoring. */
  threats: GeneratedThreat[];
  /** Implemented mitigation ids for a node id, an edge id (both endpoints) or "*" (model-wide). */
  implementedFor: (id: string) => Set<string>;
}

// ─── Check context ───────────────────────────────────────────────

interface CheckCtx {
  graph: ModelGraph;
  reach: Map<string, ReachInfo>;
  reachGated: (kinds: GateKind[]) => Map<string, ReachInfo>;
  observed: Set<string>;
  label: (id: string) => string;
}

interface CheckDef {
  id: string;
  title: string;
  description: string;
  aisvs: string[];
  aiuc1: string[];
  mitigationIds: string[];
  ruleIds: string[];
  recommendation: string;
  /** Subjects to evaluate; empty → not applicable. */
  evaluate: (c: CheckCtx) => CheckSubject[];
}

const ok = (id: string, label: string, note: string): CheckSubject => ({
  id,
  label,
  status: "ok",
  note,
});
const partial = (id: string, label: string, note: string): CheckSubject => ({
  id,
  label,
  status: "partial",
  note,
});
const missing = (id: string, label: string, note: string): CheckSubject => ({
  id,
  label,
  status: "missing",
  note,
});

const edgeLabel = (c: CheckCtx, e: EdgeInfo) => `${c.label(e.source)} → ${c.label(e.target)}`;
const reachable = (c: CheckCtx, n: NodeInfo) => {
  const r = c.reach.get(n.id);
  return !!r && r.hops > 0;
};
const pathText = (c: CheckCtx, r?: ReachInfo) => (r ? r.path.map(c.label).join(" → ") : "");
const systemNodes = (g: ModelGraph) => g.nodes.filter((n) => !n.isActor && !n.isExternal);

const CHECKS: CheckDef[] = [
  {
    id: "CHK-01",
    title: "Input filtering in front of AI components",
    description: "Every path from an entry point to an agent or model passes an input guardrail.",
    aisvs: ["C2"],
    aiuc1: ["B002", "B005"],
    mitigationIds: ["MIT-INPUT-FILTER", "MIT-GUARDRAIL"],
    ruleIds: ["TM-CONN-001", "TM-NODE-001", "TM-NODE-050"],
    recommendation:
      "Place a guardrail with input coverage between users/external data and every AI component.",
    evaluate: (c) => {
      const gated = c.reachGated(["input"]);
      return c.graph.nodes
        .filter((n) => n.isAI && !n.isEntry && n.kind !== "training-pipeline" && reachable(c, n))
        .map((n) =>
          gated.has(n.id)
            ? missing(
                n.id,
                n.label,
                `Reachable without input filtering: ${pathText(c, gated.get(n.id))}`,
              )
            : ok(n.id, n.label, "Every entry path passes an input guardrail"),
        );
    },
  },
  {
    id: "CHK-02",
    title: "Output filtering before responses reach users",
    description: "AI responses pass an output guardrail before they reach an actor.",
    aisvs: ["C7"],
    aiuc1: ["A006", "B009", "C003", "C004"],
    mitigationIds: ["MIT-OUTPUT-FILTER", "MIT-GUARDRAIL", "MIT-DLP"],
    ruleIds: ["TM-NODE-012", "TM-NODE-021"],
    recommendation:
      "Add a guardrail with output coverage on the response path (PII/secret redaction, policy checks).",
    evaluate: (c) => {
      const out: CheckSubject[] = [];
      for (const n of c.graph.nodes) {
        if (!n.isAI || n.isEntry || n.kind === "training-pipeline") continue;
        const free = reachFrom(c.graph, [n.id]);
        const actors = c.graph.nodes.filter((a) => a.isActor && free.has(a.id));
        if (actors.length === 0) continue;
        const gated = reachFrom(c.graph, [n.id], ["output"]);
        const leaking = actors.filter((a) => gated.has(a.id));
        out.push(
          leaking.length > 0
            ? missing(
                n.id,
                n.label,
                `Responses reach ${leaking.map((a) => a.label).join(", ")} unfiltered`,
              )
            : ok(n.id, n.label, "Responses pass an output guardrail"),
        );
      }
      return out;
    },
  },
  {
    id: "CHK-03",
    title: "Human approval before privileged actions",
    description:
      "Execution-capable or destructive tools are only reachable through a human approval gate.",
    aisvs: ["C9"],
    aiuc1: ["B006", "C007", "D003"],
    mitigationIds: ["MIT-HITL-APPROVAL"],
    ruleIds: ["TM-PATH-001", "TM-CONN-003", "TM-NODE-030"],
    recommendation:
      "Route privileged tool calls through a Human Approval Gate (or an approval step in the tool).",
    evaluate: (c) => {
      const hitl = c.reachGated(["hitl"]);
      const toolGate = c.reachGated(["hitl", "tool-call"]);
      return c.graph.nodes
        .filter((n) => n.isPrivileged && reachable(c, n))
        .map((n) => {
          if (!hitl.has(n.id))
            return ok(n.id, n.label, "Every entry path passes a human approval gate");
          if (!toolGate.has(n.id))
            return partial(
              n.id,
              n.label,
              "Tool calls are inspected by a guardrail but not approved by a human",
            );
          return missing(n.id, n.label, `No approval on ${pathText(c, hitl.get(n.id))}`);
        });
    },
  },
  {
    id: "CHK-04",
    title: "Least-privilege tool scopes",
    description: "Tools declare scopes and an allow-list, or are read-only.",
    aisvs: ["C9", "C5"],
    aiuc1: ["A003", "B006", "D003"],
    mitigationIds: ["MIT-LEAST-PRIVILEGE", "MIT-TOOL-ALLOWLIST", "MIT-SCOPE-NARROWING"],
    ruleIds: ["TM-NODE-022", "TM-AGT-010", "TM-CONN-003"],
    recommendation:
      "Declare per-tool scopes and an allow-list of operations; prefer read-only access.",
    evaluate: (c) =>
      c.graph.nodes
        .filter((n) => n.isTool && (n.kind !== "infrastructure" || n.isPrivileged))
        .map((n) => {
          const t = n.data.semantics?.tool;
          if (n.data.toolAccessMode === "read-only") return ok(n.id, n.label, "Read-only access");
          if (t?.scopes?.length && (t.allowList?.length || n.kind === "scoped-tool"))
            return ok(n.id, n.label, `Scopes ${t.scopes.join(", ")} with an allow-list`);
          if (t?.scopes?.length)
            return partial(n.id, n.label, `Scopes ${t.scopes.join(", ")}, no allow-list`);
          return missing(
            n.id,
            n.label,
            `No declared scope (${n.data.toolAccessMode ?? "access mode unset"})`,
          );
        }),
  },
  {
    id: "CHK-05",
    title: "Sensitive flows encrypted",
    description: "Flows carrying PII or Confidential/Restricted data are encrypted.",
    aisvs: ["C4"],
    aiuc1: ["A006", "B008"],
    mitigationIds: ["MIT-TLS"],
    ruleIds: ["TM-CONN-008", "TM-CONN-009"],
    recommendation:
      "Encrypt every flow that carries PII or Confidential/Restricted data (TLS 1.2+ / mTLS).",
    evaluate: (c) =>
      c.graph.edges
        .filter((e) => e.sensitive)
        .map((e) =>
          e.encrypted
            ? ok(e.id, edgeLabel(c, e), "Encrypted")
            : missing(e.id, edgeLabel(c, e), `Unencrypted (${e.data.protocol})`),
        ),
  },
  {
    id: "CHK-06",
    title: "Entry flows authenticated",
    description: "Flows from users, external systems and untrusted components are authenticated.",
    aisvs: ["C5"],
    aiuc1: ["B007"],
    mitigationIds: ["MIT-STRONG-AUTHN"],
    ruleIds: ["TM-CONN-010", "TM-CONN-007"],
    recommendation: "Authenticate every entry flow (OAuth2/OIDC, mTLS or signed API keys).",
    evaluate: (c) =>
      c.graph.edges
        .filter(
          (e) =>
            c.graph.nodeById.get(e.source)!.isEntry && !c.graph.nodeById.get(e.target)!.isEntry,
        )
        .map((e) =>
          e.authenticated
            ? ok(e.id, edgeLabel(c, e), `Authenticated (${e.data.authentication})`)
            : missing(e.id, edgeLabel(c, e), "No authentication"),
        ),
  },
  {
    id: "CHK-07",
    title: "Cross-boundary flows authenticated and encrypted",
    description: "Flows that cross a trust boundary are both authenticated and encrypted.",
    aisvs: ["C4", "C5"],
    aiuc1: ["B008"],
    mitigationIds: ["MIT-TLS", "MIT-STRONG-AUTHN"],
    ruleIds: ["TM-CONN-011", "TM-CONN-012", "TM-MODEL-007"],
    recommendation: "Require mutual authentication and encryption on every boundary-crossing flow.",
    evaluate: (c) =>
      c.graph.edges
        .filter((e) => e.crossesBoundary)
        .map((e) =>
          e.secure
            ? ok(e.id, edgeLabel(c, e), "Authenticated and encrypted")
            : e.authenticated || e.encrypted
              ? partial(
                  e.id,
                  edgeLabel(c, e),
                  e.authenticated ? "Authenticated, not encrypted" : "Encrypted, not authenticated",
                )
              : missing(e.id, edgeLabel(c, e), "Neither authenticated nor encrypted"),
        ),
  },
  {
    id: "CHK-08",
    title: "Trust boundaries defined",
    description: "Trust zones are drawn and every system component sits inside one.",
    aisvs: ["C4"],
    aiuc1: ["B008"],
    mitigationIds: ["MIT-SEGMENTATION"],
    ruleIds: ["TM-MODEL-001", "TM-MODEL-006"],
    recommendation:
      "Draw trust boundaries (e.g. user zone, agent runtime, data tier) and place every component.",
    evaluate: (c) => {
      const sys = systemNodes(c.graph);
      if (sys.length === 0) return [];
      if (c.graph.boundaries.length === 0)
        return [missing("model", "Model", "No trust boundary drawn")];
      const outside = sys.filter((n) => !n.boundaryId);
      return [
        outside.length === 0
          ? ok(
              "model",
              "Model",
              `${c.graph.boundaries.length} boundary(ies); every component placed`,
            )
          : partial(
              "model",
              "Model",
              `Outside every boundary: ${outside.map((n) => n.label).join(", ")}`,
            ),
      ];
    },
  },
  {
    id: "CHK-09",
    title: "Agent activity observable",
    description: "An observability component covers every agent and privileged tool.",
    aisvs: ["C12"],
    aiuc1: ["C008", "E015"],
    mitigationIds: ["MIT-AUDIT-LOGGING", "MIT-BEHAVIOR-MONITOR"],
    ruleIds: ["TM-MODEL-002"],
    recommendation:
      "Connect an observability / audit-log component to every agent and privileged tool.",
    evaluate: (c) => {
      const agents = c.graph.nodes.filter((n) => n.isAgent);
      const subjects =
        agents.length > 0
          ? [...agents, ...c.graph.nodes.filter((n) => n.isPrivileged && !n.isAgent)]
          : c.graph.nodes.filter((n) => n.isModel);
      return subjects.map((n) =>
        c.observed.has(n.id)
          ? ok(n.id, n.label, "Covered by an observability component")
          : missing(n.id, n.label, "Not covered by any observability component"),
      );
    },
  },
  {
    id: "CHK-10",
    title: "Memory isolated per user / tenant",
    description: "Agent memory declares per-user isolation and restricted writers.",
    aisvs: ["C8"],
    aiuc1: ["A003", "A005"],
    mitigationIds: ["MIT-MEMORY-ISOLATION"],
    ruleIds: ["TM-AGT-030", "TM-AGT-031", "TM-NODE-010"],
    recommendation:
      "Partition memory per user/tenant and restrict which components may write to it.",
    evaluate: (c) =>
      c.graph.nodes
        .filter((n) => n.kind === "memory")
        .map((n) => {
          const m = n.data.semantics?.memory;
          if (m?.perUserIsolation) return ok(n.id, n.label, "Per-user isolation declared");
          if (m?.writeAccess?.length)
            return partial(n.id, n.label, "Writers restricted, no per-user isolation");
          return missing(n.id, n.label, "No isolation or write restriction declared");
        }),
  },
  {
    id: "CHK-11",
    title: "Model and component provenance verified",
    description: "Models and MCP servers are signed and version-pinned.",
    aisvs: ["C6", "C3"],
    aiuc1: ["E006"],
    mitigationIds: ["MIT-MODEL-PROVENANCE", "MIT-DEP-PINNING"],
    ruleIds: ["TM-NODE-003", "TM-MODEL-003", "TM-AGT-001"],
    recommendation:
      "Pin model and server versions and verify signatures / checksums before deployment.",
    evaluate: (c) =>
      c.graph.nodes
        .filter((n) => (n.isModel && n.kind !== "training-pipeline") || n.kind === "mcp-server")
        .map((n) => {
          const p = n.data.semantics?.provenance ?? n.data.semantics?.mcp?.provenance;
          if (p?.signed && p?.pinned) return ok(n.id, n.label, "Signed and pinned");
          if (p?.signed || p?.pinned)
            return partial(n.id, n.label, p.signed ? "Signed, not pinned" : "Pinned, not signed");
          return missing(n.id, n.label, "No provenance declared");
        }),
  },
  {
    id: "CHK-12",
    title: "MCP servers hardened",
    description:
      "MCP servers authenticate clients, have verified provenance and an explicit tool inventory.",
    aisvs: ["C10"],
    aiuc1: ["B006", "D003"],
    mitigationIds: ["MIT-MCP-HARDENING"],
    ruleIds: ["TM-AGT-001", "TM-AGT-002", "TM-AGT-003"],
    recommendation:
      "Authenticate MCP clients (OAuth2/mTLS), pin and sign servers, and allow-list exposed tools.",
    evaluate: (c) =>
      c.graph.nodes
        .filter((n) => n.kind === "mcp-server")
        .map((n) => {
          const m = n.data.semantics?.mcp;
          const authed = !!m && (m.auth !== "none" || m.transport === "stdio");
          if (authed && m!.provenance?.signed && m!.toolsExposed.length > 0)
            return ok(
              n.id,
              n.label,
              `${m!.transport}/${m!.auth}, signed, ${m!.toolsExposed.length} tool(s) listed`,
            );
          if (authed)
            return partial(n.id, n.label, "Authenticated, provenance or tool inventory missing");
          return missing(
            n.id,
            n.label,
            m ? `Remote ${m.transport} without authentication` : "No MCP posture declared",
          );
        }),
  },
  {
    id: "CHK-13",
    title: "Inter-agent channels authenticated",
    description: "Agent-to-agent messages are mutually authenticated and integrity-protected.",
    aisvs: ["C9"],
    aiuc1: ["B006", "B007"],
    mitigationIds: ["MIT-AGENT-IDENTITY", "MIT-MESSAGE-SIGNING"],
    ruleIds: ["TM-CONN-006", "TM-AGT-020", "TM-AGT-021"],
    recommendation: "Give agents verifiable identities and sign inter-agent messages.",
    evaluate: (c) =>
      c.graph.edges
        .filter(
          (e) => c.graph.nodeById.get(e.source)!.isAgent && c.graph.nodeById.get(e.target)!.isAgent,
        )
        .map((e) => {
          const a2a = c.graph.nodeById.get(e.target)!.data.semantics?.a2a;
          if (e.secure || (a2a?.mutualAuth && a2a.messageSigning))
            return ok(e.id, edgeLabel(c, e), "Authenticated and integrity-protected");
          if (e.authenticated || e.encrypted || a2a?.mutualAuth)
            return partial(e.id, edgeLabel(c, e), "Partially protected");
          return missing(e.id, edgeLabel(c, e), "Unauthenticated, unencrypted");
        }),
  },
  {
    id: "CHK-14",
    title: "Rate limiting on exposed AI endpoints",
    description: "AI components fed directly by entry points have rate limits / quotas.",
    aisvs: ["C4", "C11"],
    aiuc1: ["B004"],
    mitigationIds: ["MIT-RATE-LIMIT", "MIT-CIRCUIT-BREAKER"],
    ruleIds: ["TM-NODE-006", "TM-NODE-002"],
    recommendation: "Apply per-user rate limits and token quotas at the first AI hop.",
    evaluate: (c) =>
      c.graph.nodes
        .filter((n) => n.isAI && !n.isEntry && (c.reach.get(n.id)?.hops ?? 99) <= 2)
        .filter((n) =>
          (c.graph.in.get(n.id) ?? []).some((e) => {
            const s = c.graph.nodeById.get(e.source)!;
            return s.isEntry || s.isGate;
          }),
        )
        .map((n) => {
          const gated = !c.reachGated(["input"]).has(n.id);
          return gated
            ? partial(n.id, n.label, "Behind a guardrail; no rate limit declared")
            : missing(n.id, n.label, "No rate limit declared");
        }),
  },
  {
    id: "CHK-15",
    title: "Code execution sandboxed",
    description: "Execution-capable tools run isolated from agents and data.",
    aisvs: ["C9", "C4"],
    aiuc1: ["B008", "D003"],
    mitigationIds: ["MIT-CODE-SANDBOX", "MIT-TOOL-SANDBOX"],
    ruleIds: ["TM-NODE-030", "TM-CONN-013"],
    recommendation:
      "Run code execution in an ephemeral sandbox (no network, no credentials, resource limits).",
    evaluate: (c) =>
      c.graph.nodes
        .filter((n) => n.isExecution)
        .map((n) => {
          const callers = (c.graph.in.get(n.id) ?? []).map((e) => c.graph.nodeById.get(e.source)!);
          const isolated =
            !!n.boundaryId &&
            callers.length > 0 &&
            callers.every((s) => s.boundaryId !== n.boundaryId);
          return isolated
            ? partial(n.id, n.label, "In its own trust zone; sandbox not declared")
            : missing(n.id, n.label, "No sandbox or isolation declared");
        }),
  },
  {
    id: "CHK-16",
    title: "Sensitive data kept from untrusted components",
    description: "No flow carries PII or confidential data to an untrusted or external component.",
    aisvs: ["C7"],
    aiuc1: ["A006"],
    mitigationIds: ["MIT-DLP", "MIT-OUTPUT-FILTER"],
    ruleIds: ["TM-CONN-009"],
    recommendation: "Redact or tokenise sensitive data before it leaves the trusted zone.",
    evaluate: (c) => {
      const sensitive = c.graph.edges.filter((e) => e.sensitive);
      if (sensitive.length === 0) return [];
      const leaks = sensitive.filter((e) => {
        const t = c.graph.nodeById.get(e.target)!;
        return t.isExternal || t.data.trustLevel === "untrusted";
      });
      if (leaks.length === 0)
        return [
          ok(
            "model",
            "Model",
            `${sensitive.length} sensitive flow(s), none to untrusted components`,
          ),
        ];
      return leaks.map((e) =>
        missing(e.id, edgeLabel(c, e), "Sensitive data reaches an untrusted component"),
      );
    },
  },
  {
    id: "CHK-17",
    title: "Delegated credentials narrowed",
    description: "Identity providers issuing delegated tokens narrow their scope per task.",
    aisvs: ["C5", "C9"],
    aiuc1: ["B006", "B007"],
    mitigationIds: ["MIT-SCOPE-NARROWING"],
    ruleIds: ["TM-PATH-002"],
    recommendation:
      "Issue short-lived, task-scoped tokens (token exchange / down-scoping) to agents.",
    evaluate: (c) =>
      c.graph.nodes
        .filter((n) => n.isIdentity)
        .map((n) => {
          const id = n.data.semantics?.identity;
          if (id?.scopeNarrowing) return ok(n.id, n.label, "Scope narrowing declared");
          if (id && !id.delegation) return ok(n.id, n.label, "No delegation");
          return missing(n.id, n.label, "Delegated credentials without scope narrowing");
        }),
  },
  {
    id: "CHK-18",
    title: "Credentials protected in transit",
    description:
      "Every flow touching a component that holds credentials is authenticated and encrypted.",
    aisvs: ["C4", "C5"],
    aiuc1: ["A008"],
    mitigationIds: ["MIT-TLS", "MIT-STRONG-AUTHN"],
    ruleIds: [],
    recommendation:
      "Keep secrets in a vault; authenticate and encrypt every flow that can carry them.",
    evaluate: (c) =>
      c.graph.nodes
        .filter((n) => n.data.dataSensitivity === "credentials")
        .map((n) => {
          const flows = [...(c.graph.in.get(n.id) ?? []), ...(c.graph.out.get(n.id) ?? [])];
          if (flows.every((e) => e.secure))
            return ok(n.id, n.label, "All flows authenticated and encrypted");
          if (flows.every((e) => e.encrypted))
            return partial(n.id, n.label, "Encrypted, not all authenticated");
          return missing(n.id, n.label, "Unencrypted flows touch the credential store");
        }),
  },
  {
    id: "CHK-19",
    title: "Model extraction defences",
    description: "Models directly exposed to entry points have query monitoring / rate limits.",
    aisvs: ["C11"],
    aiuc1: ["A004", "B004"],
    mitigationIds: ["MIT-RATE-LIMIT", "MIT-QUERY-MONITOR", "MIT-WATERMARK"],
    ruleIds: ["TM-NODE-002", "TM-NODE-005"],
    recommendation: "Monitor query patterns, rate-limit and watermark outputs of exposed models.",
    evaluate: (c) => {
      const gated = c.reachGated(["input"]);
      return c.graph.nodes
        .filter(
          (n) =>
            n.isModel && n.kind !== "training-pipeline" && (c.reach.get(n.id)?.hops ?? 99) === 1,
        )
        .map((n) =>
          gated.has(n.id)
            ? missing(n.id, n.label, "Directly queried by an entry point")
            : partial(n.id, n.label, "Behind a guardrail; no query monitoring declared"),
        );
    },
  },
  {
    id: "CHK-20",
    title: "Training data validated",
    description: "Training pipelines only ingest trusted, validated data.",
    aisvs: ["C1"],
    aiuc1: [],
    mitigationIds: ["MIT-TRAINING-DATA-VALIDATION"],
    ruleIds: ["TM-NODE-004"],
    recommendation:
      "Validate, version and track provenance of training data; quarantine untrusted sources.",
    evaluate: (c) =>
      c.graph.nodes
        .filter((n) => n.kind === "training-pipeline")
        .map((n) => {
          const writers = (c.graph.in.get(n.id) ?? []).map((e) => c.graph.nodeById.get(e.source)!);
          return writers.length > 0 && writers.every((w) => w.data.trustLevel === "trusted")
            ? partial(n.id, n.label, "Only trusted sources write; validation not declared")
            : missing(n.id, n.label, "Untrusted or unknown data sources");
        }),
  },
  {
    id: "CHK-21",
    title: "Audit trail tamper-evident",
    description: "Observability components store logs immutably.",
    aisvs: ["C12"],
    aiuc1: ["E015"],
    mitigationIds: ["MIT-AUDIT-LOGGING"],
    ruleIds: ["TM-NODE-041"],
    recommendation: "Use append-only / WORM storage for audit logs and restrict delete rights.",
    evaluate: (c) =>
      c.graph.nodes
        .filter((n) => n.isObservability)
        .map((n) =>
          n.data.semantics?.observability?.immutable
            ? ok(n.id, n.label, "Immutable storage declared")
            : missing(n.id, n.label, "Immutability not declared"),
        ),
  },
  {
    id: "CHK-22",
    title: "Agents can be halted",
    description:
      "Agents have a kill switch / circuit breaker or are monitored with human intervention.",
    aisvs: ["C9"],
    aiuc1: ["C009", "E001"],
    mitigationIds: ["MIT-KILL-SWITCH", "MIT-CIRCUIT-BREAKER"],
    ruleIds: ["TM-MODEL-005", "TM-PATH-003"],
    recommendation: "Provide a kill switch and circuit breakers for every autonomous agent.",
    evaluate: (c) =>
      c.graph.nodes
        .filter((n) => n.isAgent)
        .map((n) => {
          const nearHitl = [...(c.graph.neighbours.get(n.id) ?? [])].some(
            (id) => c.graph.nodeById.get(id)?.isHitl,
          );
          return c.observed.has(n.id) || nearHitl
            ? partial(
                n.id,
                n.label,
                nearHitl
                  ? "Human gate adjacent; no kill switch declared"
                  : "Monitored; no kill switch declared",
              )
            : missing(n.id, n.label, "No kill switch, monitoring or human gate");
        }),
  },
];

/** Static metadata of the compliance checks (for the guide / check-rules). */
export const COMPLIANCE_CHECKS = CHECKS.map(({ evaluate: _e, ...meta }) => meta);

// ─── Evaluation ──────────────────────────────────────────────────

const isAddressed = (t: GeneratedThreat) =>
  t.status === "mitigated" || t.status === "false-positive" || t.mitigationState === "mitigated";

function combine(verdicts: Verdict[]): Verdict {
  const v = verdicts.filter((x) => x !== "not-applicable");
  if (v.length === 0) return "not-applicable";
  if (v.every((x) => x === "met")) return "met";
  if (v.every((x) => x === "gap")) return "gap";
  return "partial";
}

function threatVerdict(threats: GeneratedThreat[]): Verdict {
  if (threats.length === 0) return "not-applicable";
  const done = threats.filter(isAddressed).length;
  return done === threats.length ? "met" : done === 0 ? "gap" : "partial";
}

function runChecks(input: ComplianceInput, threats: GeneratedThreat[]): ComplianceCheckResult[] {
  const { graph } = input;
  const gatedCache = new Map<string, Map<string, ReachInfo>>();
  const ctx: CheckCtx = {
    graph,
    reach: reachFrom(graph, graph.entries),
    reachGated: (kinds) => {
      const key = [...kinds].sort().join(",");
      if (!gatedCache.has(key)) gatedCache.set(key, reachFrom(graph, graph.entries, kinds));
      return gatedCache.get(key)!;
    },
    observed: observedNodeIds({ graph }),
    label: (id) => graph.nodeById.get(id)?.label ?? id,
  };
  const byRule = new Map<string, string[]>();
  for (const t of threats) {
    if (!t.ruleId) continue;
    if (!byRule.has(t.ruleId)) byRule.set(t.ruleId, []);
    byRule.get(t.ruleId)!.push(t.id);
  }

  return CHECKS.map((def) => {
    const subjects = def.evaluate(ctx).map((s) => {
      if (s.status === "ok") return s;
      const impl = input.implementedFor(s.id === "model" ? "*" : s.id);
      const hit = def.mitigationIds.find((m) => impl.has(m));
      if (!hit) return s;
      return {
        ...s,
        status: "ok" as const,
        note: `${s.note}; implemented: ${getMitigation(hit)?.name ?? hit}`,
      };
    });
    const verdict: Verdict =
      subjects.length === 0
        ? "not-applicable"
        : subjects.every((s) => s.status === "ok")
          ? "met"
          : subjects.every((s) => s.status === "missing")
            ? "gap"
            : "partial";
    return {
      id: def.id,
      title: def.title,
      description: def.description,
      verdict,
      evidence: subjects.map((s) => `${s.label}: ${s.note}`),
      subjects,
      aisvs: def.aisvs,
      aiuc1: def.aiuc1,
      mitigationIds: def.mitigationIds,
      relatedRuleIds: def.ruleIds,
      linkedThreats: def.ruleIds.flatMap((r) => byRule.get(r) ?? []).sort(),
      recommendation:
        verdict === "met" || verdict === "not-applicable" ? "No action needed" : def.recommendation,
    };
  });
}

function aisvsChapters(checks: ComplianceCheckResult[], direct: GeneratedThreat[]) {
  const source = getAisvsChapters();
  const chapters: AisvsChapterResult[] = source.chapters.map((ch) => {
    const cs = checks.filter((c) => c.aisvs.some((a) => aisvsChapterOf(a) === ch.code));
    const linked = direct.filter((t) => (t.aisvs ?? []).some((a) => aisvsChapterOf(a) === ch.code));
    const verdict = combine([...cs.map((c) => c.verdict), threatVerdict(linked)]);
    return {
      code: ch.code,
      name: ch.name,
      verdict,
      checks: cs.map((c) => c.id),
      evidence: [
        ...cs
          .filter((c) => c.verdict !== "not-applicable")
          .map((c) => `${c.id} ${c.title}: ${c.verdict}`),
        ...(linked.length
          ? [`${linked.filter(isAddressed).length}/${linked.length} linked threat(s) mitigated`]
          : []),
      ],
      linkedThreats: linked.map((t) => t.id).sort(),
      mitigatedThreats: linked
        .filter(isAddressed)
        .map((t) => t.id)
        .sort(),
      requirementCount: ch.requirementCount,
    };
  });
  const applicable = chapters.filter((c) => c.verdict !== "not-applicable");
  const met = applicable.filter((c) => c.verdict === "met").length;
  return {
    version: source.version,
    chapters,
    summary: {
      met,
      partial: applicable.filter((c) => c.verdict === "partial").length,
      gap: applicable.filter((c) => c.verdict === "gap").length,
      notApplicable: chapters.length - applicable.length,
      percent: applicable.length ? Math.round((met / applicable.length) * 100) : 0,
    },
  };
}

function legacyAisvs(aisvs: ComplianceResult["aisvs"]): AISVSCoverageResult {
  const toStatus: Record<Exclude<Verdict, "not-applicable">, RequirementStatus> = {
    met: "addressed",
    partial: "identified",
    gap: "gap",
  };
  const mappings: AISVSMapping[] = aisvs.chapters
    .filter((c) => c.verdict !== "not-applicable")
    .map((c) => ({
      requirementId: c.code,
      code: c.code,
      title: c.name,
      level: 1,
      categoryName: `${c.code} ${c.name}`,
      status: toStatus[c.verdict as Exclude<Verdict, "not-applicable">],
    }));
  const addressed = mappings.filter((m) => m.status === "addressed").length;
  const identified = mappings.filter((m) => m.status !== "gap").length;
  const byCat: AISVSCoverageResult["coverageByCategory"] = {};
  for (const m of mappings) {
    byCat[m.categoryName] = {
      total: 1,
      identified: m.status !== "gap" ? 1 : 0,
      addressed: m.status === "addressed" ? 1 : 0,
    };
  }
  return {
    mappings,
    totalRequirements: mappings.length,
    identifiedRequirements: identified,
    addressedRequirements: addressed,
    gapRequirements: mappings.length - identified,
    percent: mappings.length ? Math.round((addressed / mappings.length) * 100) : 0,
    version: aisvs.version,
    coverageByLevel: { 1: { total: mappings.length, identified, addressed } },
    coverageByCategory: byCat,
  };
}

function aiuc1(checks: ComplianceCheckResult[], direct: GeneratedThreat[]): Aiuc1ComplianceResult {
  const checksByReq = new Map<string, ComplianceCheckResult[]>();
  for (const c of checks)
    for (const r of c.aiuc1) {
      if (!checksByReq.has(r)) checksByReq.set(r, []);
      checksByReq.get(r)!.push(c);
    }
  const threatsByAsi = new Map<string, GeneratedThreat[]>();
  for (const t of direct)
    for (const m of t.owaspMapping ?? []) {
      if (m.confidence === "low") continue;
      if (!threatsByAsi.has(m.asiId)) threatsByAsi.set(m.asiId, []);
      threatsByAsi.get(m.asiId)!.push(t);
    }

  const requirements: Aiuc1RequirementStatus[] = [];
  const retired: string[] = [];
  for (const p of aiuc1Principles) {
    for (const req of p.requirements) {
      if (req.status === "retired") {
        retired.push(req.id);
        continue;
      }
      const cs = checksByReq.get(req.id) ?? [];
      const applicable = cs.filter((c) => c.verdict !== "not-applicable");
      const linked = req.asiId ? (threatsByAsi.get(req.asiId) ?? []) : [];
      const open = linked.filter((t) => !isAddressed(t));
      let status: Aiuc1RequirementStatus["status"];
      let matchedVia: Aiuc1RequirementStatus["matchedVia"] = "none";
      let assessable = true;
      let recommendation: string;
      const evidence: string[] = applicable.map((c) => `${c.id} ${c.title}: ${c.verdict}`);
      if (linked.length)
        evidence.push(
          `${linked.length - open.length}/${linked.length} ${req.asiId} threat(s) mitigated`,
        );

      if (applicable.length > 0) {
        matchedVia = "topology";
        status = combine(applicable.map((c) => c.verdict)) as Aiuc1RequirementStatus["status"];
        if (status === "met" && open.length > 0) status = "partial";
        recommendation =
          status === "met"
            ? "Architecture evidence present; verify the controls are operating."
            : applicable
                .filter((c) => c.verdict !== "met")
                .map((c) => c.recommendation)
                .join(" ");
      } else if (linked.length > 0) {
        matchedVia = "asi-bridge";
        status = threatVerdict(linked) as Aiuc1RequirementStatus["status"];
        recommendation =
          status === "met"
            ? `Linked ${req.asiId} threats are mitigated; keep evidence of the controls.`
            : `Mitigate the ${open.length} open ${req.asiId} (${req.asiTitle ?? ""}) threat(s).`;
      } else if (cs.length > 0) {
        matchedVia = "topology";
        status = "not-applicable";
        recommendation = "No component in this model is in scope.";
      } else {
        assessable = false;
        status = "gap";
        recommendation = "Not assessable from the architecture; provide policy / process evidence.";
      }
      requirements.push({
        requirementId: req.id,
        requirementTitle: req.title,
        principle: p.name,
        principleId: p.id,
        application: req.application,
        status,
        matchedVia,
        relevantThreats: [
          ...new Set([...linked.map((t) => t.id), ...applicable.flatMap((c) => c.linkedThreats)]),
        ].sort(),
        recommendation,
        assessable,
        evidence,
        checks: cs.map((c) => c.id),
      });
    }
  }

  const scored = requirements.filter((r) => r.assessable && r.status !== "not-applicable");
  const principleScores: Record<string, Aiuc1PrincipleScore> = {};
  for (const p of aiuc1Principles)
    principleScores[p.id] = { met: 0, partial: 0, gap: 0, total: 0, score: 0 };
  const s = {
    total: scored.length,
    mandatory: 0,
    mandatoryMet: 0,
    mandatoryPartial: 0,
    mandatoryGap: 0,
    optionalMet: 0,
    optionalPartial: 0,
    optionalGap: 0,
    notAssessable: requirements.filter((r) => !r.assessable).length,
    notApplicable: requirements.filter((r) => r.status === "not-applicable").length,
  };
  let num = 0;
  let den = 0;
  for (const r of scored) {
    const ps = principleScores[r.principleId];
    ps.total++;
    const mand = r.application === "Mandatory";
    const w = mand ? 1 : 0.5;
    den += w;
    if (mand) s.mandatory++;
    if (r.status === "met") {
      ps.met++;
      num += w;
      if (mand) s.mandatoryMet++;
      else s.optionalMet++;
    } else if (r.status === "partial") {
      ps.partial++;
      num += w / 2;
      if (mand) s.mandatoryPartial++;
      else s.optionalPartial++;
    } else {
      ps.gap++;
      if (mand) s.mandatoryGap++;
      else s.optionalGap++;
    }
  }
  for (const ps of Object.values(principleScores))
    ps.score = ps.total ? Math.round(((ps.met + ps.partial / 2) / ps.total) * 100) : 0;
  const overallScore = den ? Math.round((num / den) * 100) : 0;
  let verdict: Aiuc1ComplianceResult["verdict"];
  let verdictLabel: string;
  if (s.mandatoryGap === 0) {
    verdict = "likely-compliant";
    verdictLabel = "Likely compliant (indicative)";
  } else if (s.mandatoryMet + s.mandatoryPartial > s.mandatoryGap) {
    verdict = "partially-compliant";
    verdictLabel = "Partially compliant (indicative)";
  } else {
    verdict = "significant-gaps";
    verdictLabel = "Significant gaps (indicative)";
  }
  return {
    requirements,
    verdict,
    verdictLabel,
    overallScore,
    principleScores,
    version: AIUC1_VERSION,
    retired,
    summary: s,
  };
}

// ─── Data-flow violations ────────────────────────────────────────

/** Edge-level data-handling violations (legacy "data flow compliance", P3-17 fixed). */
export function dataFlowViolations(graph: ModelGraph): ComplianceViolation[] {
  const out: ComplianceViolation[] = [];
  const push = (
    e: EdgeInfo,
    key: string,
    name: string,
    description: string,
    severity: ComplianceViolation["severity"],
    rule: string,
  ) =>
    out.push({
      id: `dfc-${key}-${e.id}`,
      name,
      description,
      severity,
      affectedEdgeIds: [e.id],
      affectedNodeIds: [e.source, e.target],
      rule,
    });
  for (const e of graph.edges) {
    const s = graph.nodeById.get(e.source)!;
    const t = graph.nodeById.get(e.target)!;
    const between = `"${s.label}" and "${t.label}"`;
    const d = e.data;
    if (d.containsPII && !e.encrypted)
      push(
        e,
        "pii-unencrypted",
        "PII transmitted without encryption",
        `PII flows between ${between} without encryption.`,
        "critical",
        "PII must be encrypted in transit",
      );
    if (d.containsPII && (t.data.trustLevel === "untrusted" || t.isExternal))
      push(
        e,
        "pii-untrusted",
        "PII flowing to an untrusted zone",
        `PII flows from "${s.label}" to untrusted component "${t.label}".`,
        "critical",
        "PII must not flow to untrusted components without sanitisation",
      );
    if (d.dataClassification === "Restricted" && !e.encrypted)
      push(
        e,
        "restricted-unencrypted",
        "Restricted data without encryption",
        `Restricted data between ${between} is not encrypted.`,
        "critical",
        "Restricted data must always be encrypted",
      );
    if (d.dataClassification === "Confidential" && !e.authenticated)
      push(
        e,
        "confidential-noauth",
        "Confidential data without authentication",
        `Confidential data flows between ${between} without authentication.`,
        "high",
        "Confidential data flows must be authenticated",
      );
    if (e.crossesBoundary && e.sensitive && !e.authenticated)
      push(
        e,
        "cross-boundary",
        "Sensitive data crossing a trust boundary without auth",
        `Sensitive data crosses a trust boundary between ${between} without authentication.`,
        "high",
        "Cross-boundary sensitive data flows must be authenticated",
      );
    if ((s.isExternal || t.isExternal) && (/^http$/i.test(d.protocol ?? "") || !e.encrypted))
      push(
        e,
        "external-http",
        "External connection without encryption",
        `External connection between ${between} uses ${d.protocol || "an unencrypted protocol"}.`,
        "high",
        "External connections must use HTTPS or an equivalent encrypted protocol",
      );
    // P3-17: describe the data of whichever side actually holds it.
    const holder = [s, t].find(
      (n) => n.profile.handlesCredentials || n.profile.handlesRegulatedData,
    );
    if (holder && (!e.encrypted || !e.authenticated)) {
      const kind = holder.profile.handlesCredentials ? "credentials" : "regulated data";
      const miss = [!e.encrypted && "encryption", !e.authenticated && "authentication"].filter(
        Boolean,
      ) as string[];
      push(
        e,
        "sensitive-flow",
        `Sensitive data flow missing ${miss.join(" & ")}`,
        `"${holder.label}" handles ${kind}. The data flow between ${between} is missing ${miss.join(" and ")}.`,
        "critical",
        `Data flows involving ${kind} must have both encryption and authentication`,
      );
    }
    if (
      s.profile.handlesPII &&
      (t.profile.accessDanger === "dangerous" || t.profile.accessDanger === "critical")
    )
      push(
        e,
        "pii-to-dangerous",
        "PII flowing to a high-risk component",
        `PII from "${s.label}" flows to "${t.label}" which has ${t.profile.accessDanger} access.`,
        "critical",
        "PII must not flow to components with dangerous or critical access without strict controls",
      );
  }
  return out;
}

// ─── Entry point ─────────────────────────────────────────────────

export function runCompliance(input: ComplianceInput): ComplianceResult {
  const direct = input.threats.filter((t) => !t.inherited);
  const checks = runChecks(input, input.threats);
  const aisvs = aisvsChapters(checks, direct);
  const applicableChecks = checks.filter((c) => c.verdict !== "not-applicable");
  const met = applicableChecks.filter((c) => c.verdict === "met").length;
  const part = applicableChecks.filter((c) => c.verdict === "partial").length;
  const complianceGapReport: ComplianceGapReport = {
    items: applicableChecks.map((c) => ({
      requirementCode: c.id,
      requirementTitle: c.title,
      categoryName: c.aisvs.join(", "),
      level: 1,
      status: c.verdict as "met" | "partial" | "gap",
      relevantThreats: c.linkedThreats,
      recommendation: c.recommendation,
      evidence: c.evidence,
    })),
    summary: {
      totalChecks: applicableChecks.length,
      met,
      partial: part,
      gaps: applicableChecks.length - met - part,
      levelScores: {
        1: applicableChecks.length
          ? Math.round(((met + part / 2) / applicableChecks.length) * 100)
          : 0,
      },
    },
  };
  return {
    indicative: true,
    checks,
    aisvs,
    aiuc1: aiuc1(checks, direct),
    dataFlow: dataFlowViolations(input.graph),
    aisvsResult: legacyAisvs(aisvs),
    complianceGapReport,
  };
}

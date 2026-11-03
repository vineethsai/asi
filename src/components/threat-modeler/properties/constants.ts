import { kcLabel } from "@/data/kc";
import type {
  NodeSemantics,
  DataSensitivity,
  PromptType,
  SemanticKind,
  ToolAccessMode,
  ToolRiskTier,
  TrustLevel,
} from "../types";

/** Trust level → stripe colour (untrusted red / semi amber / trusted green), as on the canvas. */
export const TRUST_STYLES: Record<TrustLevel, { label: string; color: string; text: string }> = {
  untrusted: {
    label: "Untrusted",
    color: "hsl(var(--security-critical, 0 84% 60%))",
    text: "Attacker-controlled input can originate here.",
  },
  "semi-trusted": {
    label: "Semi-trusted",
    color: "hsl(var(--security-medium, 38 92% 50%))",
    text: "Processes untrusted content; its behaviour can be influenced.",
  },
  trusted: {
    label: "Trusted",
    color: "hsl(var(--security-low, 142 71% 45%))",
    text: "Operated by you; treated as a trust anchor.",
  },
};

export const TRUST_OPTIONS: { value: TrustLevel; label: string }[] = [
  { value: "untrusted", label: "Untrusted" },
  { value: "semi-trusted", label: "Semi-trusted" },
  { value: "trusted", label: "Trusted" },
];

export const SENSITIVITY_OPTIONS: { value: DataSensitivity; label: string }[] = [
  { value: "none", label: "None" },
  { value: "internal", label: "Internal" },
  { value: "pii", label: "PII" },
  { value: "credentials", label: "Credentials / secrets" },
  { value: "regulated", label: "Regulated (PHI, PCI …)" },
];

export const ACCESS_OPTIONS: { value: ToolAccessMode; label: string }[] = [
  { value: "read-only", label: "Read-only" },
  { value: "read-write", label: "Read-write" },
  { value: "write-only", label: "Write-only" },
  { value: "execute", label: "Execute" },
  { value: "admin", label: "Admin" },
];

export const RISK_TIER_OPTIONS: { value: ToolRiskTier; label: string }[] = [
  { value: "benign", label: "Benign" },
  { value: "sensitive", label: "Sensitive" },
  { value: "destructive", label: "Destructive" },
  { value: "critical", label: "Critical" },
];

export const PROMPT_OPTIONS: { value: PromptType; label: string }[] = [
  { value: "system", label: "System prompt" },
  { value: "user", label: "User prompt" },
  { value: "few-shot", label: "Few-shot" },
  { value: "chain-of-thought", label: "Chain-of-thought" },
  { value: "function-call", label: "Function-call schema" },
  { value: "multi-turn", label: "Multi-turn" },
];

export const AUTH_OPTIONS = [
  "None",
  "API Key",
  "OAuth2",
  "mTLS",
  "JWT",
  "Basic",
  "Session",
  "Service account / IAM",
  "Custom",
].map((v) => ({ value: v, label: v }));

export const PROTOCOL_OPTIONS = [
  "HTTPS",
  "HTTP",
  "gRPC",
  "WebSocket",
  "MCP (stdio)",
  "MCP (HTTP)",
  "A2A",
  "TCP",
  "Message queue",
  "In-process",
  "Custom",
].map((v) => ({ value: v, label: v }));

export const CLASSIFICATION_OPTIONS = ["Public", "Internal", "Confidential", "Restricted"].map(
  (v) => ({ value: v as "Public" | "Internal" | "Confidential" | "Restricted", label: v }),
);

/** Semantic kinds the editor offers (boundary is implied by the node type). */
export const KIND_OPTIONS: { value: SemanticKind; label: string; effect: string }[] = [
  { value: "agent", label: "Agent", effect: "Goal-hijack, excessive-agency and HITL rules apply." },
  {
    value: "orchestrator",
    label: "Orchestrator",
    effect: "Delegates to agents; cascading-failure rules apply.",
  },
  { value: "model", label: "LLM / model", effect: "Prompt-injection target; provenance checked." },
  { value: "reasoning", label: "Reasoning / prompt", effect: "Prompt and planning rules apply." },
  {
    value: "guardrail",
    label: "Guardrail / policy engine",
    effect: "Lowers injection likelihood on paths through it, by declared coverage.",
  },
  {
    value: "hitl-gate",
    label: "Human approval gate",
    effect: "Breaks propagation and satisfies Missing-HITL for the tools it protects.",
  },
  {
    value: "tool",
    label: "Tool",
    effect: "Tool-misuse rules; access mode and risk tier drive impact.",
  },
  {
    value: "scoped-tool",
    label: "Tool (scoped)",
    effect: "Scopes, rate limit and allow-list lower tool-misuse severity.",
  },
  {
    value: "mcp-server",
    label: "MCP server",
    effect:
      "Supply-chain (ASI04) and tool-misuse (ASI02) rules from transport, auth and provenance.",
  },
  {
    value: "a2a-peer",
    label: "A2A peer",
    effect: "Inter-agent channel rules (ASI07): mutual auth, signing, schema validation.",
  },
  {
    value: "memory",
    label: "Memory store",
    effect: "Memory-poisoning rules (ASI06) from isolation and write access.",
  },
  { value: "datastore", label: "Data store", effect: "Data-exposure rules from sensitivity." },
  {
    value: "identity",
    label: "Identity / credential",
    effect: "Delegation without scope narrowing raises privilege rules (ASI03).",
  },
  {
    value: "observability",
    label: "Observability",
    effect: "Covers agents/tools for detectability checks (ASI08 / ASI10).",
  },
  { value: "infrastructure", label: "Infrastructure", effect: "Runtime / host rules apply." },
  {
    value: "training-pipeline",
    label: "Training pipeline",
    effect: "Data-poisoning and model-supply-chain rules apply.",
  },
  { value: "actor", label: "Actor", effect: "An entry point for untrusted input." },
  { value: "external", label: "External system", effect: "An entry point outside your control." },
  { value: "custom", label: "Custom", effect: "Only your custom threats apply." },
];

export const KIND_LABEL: Record<string, string> = Object.fromEntries(
  KIND_OPTIONS.map((k) => [k.value, k.label]),
);

export const MITIGATION_STATUS_OPTIONS = [
  { value: "not-started", label: "Not started" },
  { value: "in-progress", label: "In progress" },
  { value: "implemented", label: "Implemented" },
  { value: "accepted-risk", label: "Accepted risk" },
] as const;

export const THREAT_STATUS_LABEL: Record<string, string> = {
  open: "Open",
  mitigated: "Mitigated",
  accepted: "Accepted",
  transferred: "Transferred",
  "false-positive": "False positive",
};

/** Default sub-objects for a kind, keeping whatever the node already declares. */
export function semanticsForKind(kind: SemanticKind, prev?: NodeSemantics): NodeSemantics {
  const next: NodeSemantics = { ...(prev ?? {}), kind };
  switch (kind) {
    case "guardrail":
      next.guardrail = prev?.guardrail ?? { coverage: ["input", "output"] };
      break;
    case "hitl-gate":
      next.hitl = prev?.hitl ?? { protects: [] };
      break;
    case "tool":
    case "scoped-tool":
      next.tool = prev?.tool ?? { scopes: [] };
      break;
    case "mcp-server":
      next.mcp = prev?.mcp ?? {
        transport: "http",
        auth: "none",
        toolsExposed: [],
        provenance: { signed: false, pinned: false },
      };
      break;
    case "a2a-peer":
      next.a2a = prev?.a2a ?? { mutualAuth: false, messageSigning: false, schemaValidation: false };
      break;
    case "memory":
      next.memory = prev?.memory ?? { kind: "vector", perUserIsolation: false, writeAccess: [] };
      break;
    case "identity":
      next.identity = prev?.identity ?? { delegation: false, scopeNarrowing: false };
      break;
    case "observability":
      next.observability = prev?.observability ?? { covers: [], immutable: false };
      break;
  }
  return next;
}

const CATEGORY_LABEL: Record<string, string> = {
  actor: "Actor",
  external: "External system",
  datastore: "Data store",
  "trust-boundary": "Trust boundary",
  custom: "Custom component",
};

/** Human label for a node category (KC codes go through the shared kcLabel). */
export function categoryText(category: string): string {
  return /^kc[1-6]$/.test(category) ? kcLabel(category) : (CATEGORY_LABEL[category] ?? category);
}

/**
 * Mitigation catalog (Phase 3 §7.2.4). Rules reference these ids; the UI
 * stores applied mitigations by id; `controlId` links to the site's control
 * pages (securityData `mitigationsData`). `effectiveness` is the fraction of
 * a threat's score an *implemented* mitigation removes (summed, capped 0.9).
 * `aliases` are the free-text names the v1 engine used, for migration only.
 */
export type MitigationPhase = "design" | "build" | "operate";

export interface CatalogMitigation {
  id: string;
  name: string;
  description: string;
  effectiveness: number;
  /** OWASP AISVS 1.01 chapters. */
  aisvs: string[];
  /** securityData control id, m1…m20. */
  controlId?: string;
  phase: MitigationPhase;
  aliases?: string[];
}

export const MITIGATIONS: CatalogMitigation[] = [
  {
    id: "MIT-INPUT-FILTER",
    name: "Input validation & prompt-injection filtering",
    description:
      "Validate, normalise and classify untrusted input before it reaches a model or agent; block or flag known injection and jailbreak patterns.",
    effectiveness: 0.5,
    aisvs: ["C2"],
    controlId: "m4",
    phase: "build",
    aliases: [
      "input validation and sanitization",
      "strict input validation",
      "input/output filtering",
      "content security filtering",
      "adversarial training",
    ],
  },
  {
    id: "MIT-PROMPT-HARDENING",
    name: "Prompt hardening & instruction hierarchy",
    description:
      "Separate system instructions from user and retrieved content, enforce an instruction hierarchy and keep secrets out of prompts.",
    effectiveness: 0.4,
    aisvs: ["C2", "C7"],
    controlId: "m4",
    phase: "design",
    aliases: [
      "prompt hardening",
      "prompt hardening and instruction hierarchy",
      "instruction hierarchy enforcement",
    ],
  },
  {
    id: "MIT-CONTEXT-SEGREGATION",
    name: "Treat retrieved and tool content as data",
    description:
      "Mark retrieved documents, tool output and inter-agent messages as untrusted data (spotlighting, delimiting, provenance tags) so they cannot issue instructions.",
    effectiveness: 0.4,
    aisvs: ["C2", "C8"],
    controlId: "m4",
    phase: "design",
  },
  {
    id: "MIT-GUARDRAIL",
    name: "Runtime guardrail / policy engine",
    description:
      "Place a policy engine on the input, output and tool-call paths that enforces allowed intents, topics and actions at runtime.",
    effectiveness: 0.6,
    aisvs: ["C2", "C7", "C9"],
    controlId: "m11",
    phase: "build",
    aliases: ["defense-in-depth", "behavioral constraints"],
  },
  {
    id: "MIT-OUTPUT-FILTER",
    name: "Output filtering & content security",
    description:
      "Filter and validate model output before it is shown to users, executed or passed to another component (encoding, schema checks, harmful-content filters).",
    effectiveness: 0.5,
    aisvs: ["C7"],
    controlId: "m11",
    phase: "build",
    aliases: ["output perturbation", "rag output verification", "content filtering"],
  },
  {
    id: "MIT-DLP",
    name: "Data loss prevention & PII redaction",
    description:
      "Detect and redact PII, secrets and regulated data in prompts, responses, memory writes and outbound tool calls.",
    effectiveness: 0.5,
    aisvs: ["C7", "C12"],
    controlId: "m11",
    phase: "build",
    aliases: ["data loss prevention", "pii redaction"],
  },
  {
    id: "MIT-HITL-APPROVAL",
    name: "Human approval for high-impact actions",
    description:
      "Require an explicit, informed human approval (with the full action and its arguments shown) before destructive, financial, external or irreversible actions.",
    effectiveness: 0.7,
    aisvs: ["C9"],
    controlId: "m8",
    phase: "design",
    aliases: [
      "human-in-the-loop for destructive actions",
      "mandatory approval workflow for critical tool actions",
      "human-in-the-loop approval",
      "add human approval step for sensitive operations",
      "implement hitl approval workflow",
      "human oversight",
      "require approval for sensitive tool calls",
    ],
  },
  {
    id: "MIT-HITL-TRIAGE",
    name: "Risk-based approval queues",
    description:
      "Batch, prioritise and rate-limit approval requests so reviewers are not flooded; auto-deny on timeout and escalate anomalies.",
    effectiveness: 0.4,
    aisvs: ["C9"],
    controlId: "m8",
    phase: "operate",
  },
  {
    id: "MIT-LEAST-PRIVILEGE",
    name: "Least-privilege tool scopes",
    description:
      "Give each agent only the tools and scopes it needs, with per-tool credentials and read-only defaults.",
    effectiveness: 0.6,
    aisvs: ["C5", "C9"],
    controlId: "m7",
    phase: "design",
    aliases: [
      "apply least-privilege principle",
      "limit tool access per agent",
      "permission boundaries per tool",
      "permission boundaries",
      "least-privilege access",
    ],
  },
  {
    id: "MIT-TOOL-ALLOWLIST",
    name: "Tool & function allow-list with schema validation",
    description:
      "Allow-list callable functions and argument values; validate every call against a strict JSON schema before execution.",
    effectiveness: 0.5,
    aisvs: ["C9", "C2"],
    controlId: "m2",
    phase: "build",
    aliases: [
      "validate all function call parameters against strict json schemas",
      "validate function call parameters against strict schemas",
      "whitelist allowed function names",
      "whitelist allowed function names and argument types",
      "parameterized interfaces",
    ],
  },
  {
    id: "MIT-TOOL-SANDBOX",
    name: "Tool sandboxing & isolation",
    description:
      "Run tools in isolated processes with egress controls, scoped filesystem access and resource limits.",
    effectiveness: 0.6,
    aisvs: ["C9", "C4"],
    controlId: "m2",
    phase: "build",
    aliases: ["tool sandboxing", "tool sandboxing and isolation", "sandboxed interactions"],
  },
  {
    id: "MIT-CODE-SANDBOX",
    name: "Isolated code-execution sandbox",
    description:
      "Execute generated code in an ephemeral sandbox (microVM/gVisor) without host filesystem, credentials or unrestricted network access; enforce CPU/memory/time limits.",
    effectiveness: 0.7,
    aisvs: ["C9", "C4"],
    controlId: "m14",
    phase: "build",
    aliases: [
      "sandbox all code execution in isolated containers",
      "sandboxed execution",
      "enforce strict resource limits (cpu, memory, network)",
      "block access to host filesystem and network",
      "runtime protection",
    ],
  },
  {
    id: "MIT-RATE-LIMIT",
    name: "Rate limiting & quotas",
    description:
      "Per-identity rate limits, token budgets and cost quotas on model endpoints and tool invocations.",
    effectiveness: 0.5,
    aisvs: ["C4"],
    controlId: "m9",
    phase: "operate",
    aliases: [
      "rate limiting",
      "rate limiting on inference apis",
      "resource quotas",
      "implement function call rate limiting",
      "implement rate limiting on tool invocations",
      "query complexity analysis",
    ],
  },
  {
    id: "MIT-QUERY-MONITOR",
    name: "Query-pattern monitoring",
    description:
      "Detect systematic probing, extraction and membership-inference query patterns on exposed model endpoints.",
    effectiveness: 0.4,
    aisvs: ["C11", "C12"],
    controlId: "m6",
    phase: "operate",
    aliases: ["query pattern monitoring"],
  },
  {
    id: "MIT-WATERMARK",
    name: "Model watermarking & fingerprinting",
    description: "Embed verifiable watermarks or fingerprints to detect and prove model theft.",
    effectiveness: 0.3,
    aisvs: ["C11"],
    controlId: "m12",
    phase: "build",
    aliases: ["watermarking models"],
  },
  {
    id: "MIT-PRIVACY-PRESERVING",
    name: "Privacy-preserving training & output perturbation",
    description:
      "Differential privacy, de-duplication of sensitive records and output perturbation to limit memorisation and membership inference.",
    effectiveness: 0.4,
    aisvs: ["C11", "C1"],
    controlId: "m12",
    phase: "build",
    aliases: ["differential privacy"],
  },
  {
    id: "MIT-MODEL-PROVENANCE",
    name: "Model provenance verification",
    description:
      "Use models only from vetted sources; verify signatures/hashes of weights, pin versions and scan for backdoors before deployment.",
    effectiveness: 0.6,
    aisvs: ["C6", "C3"],
    controlId: "m17",
    phase: "build",
    aliases: ["model provenance verification", "backdoor detection scanning"],
  },
  {
    id: "MIT-DEP-PINNING",
    name: "Pinned, signed dependencies with an AI-BOM",
    description:
      "Pin and verify agent framework, tool and container dependencies; maintain an SBOM/AI-BOM and scan it continuously.",
    effectiveness: 0.6,
    aisvs: ["C6"],
    controlId: "m17",
    phase: "build",
    aliases: [
      "dependency scanning",
      "sbom management",
      "pinned dependencies",
      "signature verification",
      "supply chain security",
      "image scanning",
      "signed images",
    ],
  },
  {
    id: "MIT-MCP-HARDENING",
    name: "MCP server hardening & tool provenance",
    description:
      "Allow-list MCP servers, pin and verify their versions, review tool descriptions for embedded instructions, authenticate remote transports and expose the minimum tool set.",
    effectiveness: 0.6,
    aisvs: ["C10"],
    phase: "build",
  },
  {
    id: "MIT-TRAINING-DATA-VALIDATION",
    name: "Training-data provenance & validation",
    description:
      "Track the origin of fine-tuning data, validate and de-duplicate it, and screen for poisoned or backdoor-trigger samples.",
    effectiveness: 0.6,
    aisvs: ["C1"],
    controlId: "m12",
    phase: "build",
    aliases: [
      "data provenance tracking",
      "training data validation",
      "anomaly detection in training",
    ],
  },
  {
    id: "MIT-MEMORY-VALIDATION",
    name: "Memory write validation & sanitisation",
    description:
      "Validate and attribute every memory write, quarantine content from untrusted sources and expire unverified entries.",
    effectiveness: 0.6,
    aisvs: ["C8"],
    controlId: "m1",
    phase: "build",
    aliases: [
      "memory validation and sanitization",
      "output verification before storage",
      "memory integrity checks",
      "data integrity verification",
      "data validation and sanitization before storage",
    ],
  },
  {
    id: "MIT-MEMORY-ISOLATION",
    name: "Per-user and per-tenant memory isolation",
    description:
      "Partition memory and vector indexes by user/tenant and enforce the partition on every read and write.",
    effectiveness: 0.6,
    aisvs: ["C8", "C5"],
    controlId: "m1",
    phase: "design",
  },
  {
    id: "MIT-RAG-SOURCE-VALIDATION",
    name: "Retrieval source allow-listing & content provenance",
    description:
      "Ingest only from approved sources, sign or hash ingested documents and scan content for embedded instructions before indexing.",
    effectiveness: 0.5,
    aisvs: ["C8", "C2"],
    controlId: "m1",
    phase: "build",
    aliases: ["source validation", "input validation pipelines"],
  },
  {
    id: "MIT-ENCRYPTION-AT-REST",
    name: "Encryption at rest & store access control",
    description:
      "Encrypt stores holding sensitive data, restrict access per service identity and audit reads.",
    effectiveness: 0.5,
    aisvs: ["C4", "C8"],
    controlId: "m10",
    phase: "build",
    aliases: ["encryption at rest", "access controls"],
  },
  {
    id: "MIT-TLS",
    name: "Encryption in transit (TLS/mTLS)",
    description: "Encrypt every flow with TLS 1.2+; use mTLS between internal services and agents.",
    effectiveness: 0.7,
    aisvs: ["C4"],
    controlId: "m10",
    phase: "build",
    aliases: [
      "encryption in transit (tls)",
      "enforce tls/mtls for all external connections",
      "communication channel encryption",
      "encrypt all cross-boundary data flows",
      "validate external system certificates",
    ],
  },
  {
    id: "MIT-STRONG-AUTHN",
    name: "Strong authentication on every entry point",
    description:
      "Authenticate users and external systems (OIDC/OAuth2, mTLS, signed webhooks) before they reach AI components.",
    effectiveness: 0.6,
    aisvs: ["C5"],
    controlId: "m15",
    phase: "build",
    aliases: [
      "implement strong authentication",
      "strong authentication",
      "add authentication on all cross-boundary flows",
      "access controls on model apis",
    ],
  },
  {
    id: "MIT-AGENT-IDENTITY",
    name: "Agent identity & mutual authentication",
    description:
      "Give every agent a verifiable workload identity; mutually authenticate agent-to-agent and agent-to-tool calls.",
    effectiveness: 0.6,
    aisvs: ["C5", "C9"],
    controlId: "m15",
    phase: "design",
    aliases: [
      "mutual authentication",
      "mutual authentication between agents",
      "agent identity verification",
      "certificate-based trust",
      "agent registry validation",
      "token rotation",
    ],
  },
  {
    id: "MIT-MESSAGE-SIGNING",
    name: "Signed, schema-validated inter-agent messages",
    description:
      "Sign inter-agent messages, validate them against a schema and reject instructions arriving as data.",
    effectiveness: 0.5,
    aisvs: ["C9"],
    controlId: "m3",
    phase: "build",
    aliases: ["message integrity verification", "message authentication", "integrity checksums"],
  },
  {
    id: "MIT-SCOPE-NARROWING",
    name: "Delegated-credential scope narrowing",
    description:
      "Exchange the user's token for a short-lived, audience- and scope-restricted token per tool call (token exchange / on-behalf-of with down-scoping).",
    effectiveness: 0.6,
    aisvs: ["C5", "C9"],
    controlId: "m7",
    phase: "design",
  },
  {
    id: "MIT-SEGMENTATION",
    name: "Network segmentation & trust boundaries",
    description:
      "Segment components into trust zones and force cross-zone traffic through authenticated, monitored gateways.",
    effectiveness: 0.5,
    aisvs: ["C4"],
    controlId: "m10",
    phase: "design",
    aliases: [
      "network segmentation",
      "zero trust architecture",
      "micro-segmentation",
      "place component within an appropriate trust boundary",
      "define explicit trust relationships",
      "implement trust boundary controls",
      "minimize cross-boundary connections",
      "consider adding a gateway or proxy to consolidate cross-boundary traffic",
    ],
  },
  {
    id: "MIT-AUDIT-LOGGING",
    name: "Tamper-evident audit logging",
    description:
      "Log every prompt, tool call, approval and memory write with agent identity to an append-only store.",
    effectiveness: 0.5,
    aisvs: ["C12"],
    controlId: "m6",
    phase: "operate",
    aliases: [
      "audit logging",
      "action auditing",
      "implement comprehensive audit logging",
      "log and audit all function call invocations",
      "immutable logging",
      "log integrity verification",
    ],
  },
  {
    id: "MIT-LOG-REDACTION",
    name: "Log sanitisation & access control",
    description: "Redact PII and secrets before logging; restrict dashboard and trace access.",
    effectiveness: 0.5,
    aisvs: ["C12"],
    controlId: "m6",
    phase: "operate",
    aliases: ["log sanitization", "access controls on dashboards"],
  },
  {
    id: "MIT-BEHAVIOR-MONITOR",
    name: "Behavioural monitoring & anomaly detection",
    description:
      "Baseline agent behaviour (tools used, data touched, goals) and alert on drift, loops and anomalous actions.",
    effectiveness: 0.5,
    aisvs: ["C12"],
    controlId: "m16",
    phase: "operate",
    aliases: [
      "runtime monitoring",
      "behavioral analysis",
      "agent behavior monitoring",
      "behavioral baselining",
      "anomaly detection",
      "set up anomaly detection",
      "add monitoring/observability component",
      "resource monitoring",
    ],
  },
  {
    id: "MIT-KILL-SWITCH",
    name: "Agent kill switch & containment",
    description:
      "Be able to pause, quarantine or revoke an agent and its credentials instantly; contain blast radius per agent.",
    effectiveness: 0.5,
    aisvs: ["C9", "C12"],
    controlId: "m18",
    phase: "operate",
  },
  {
    id: "MIT-CIRCUIT-BREAKER",
    name: "Circuit breakers & redundancy",
    description:
      "Bound retries, fan-out and recursion; add circuit breakers and redundancy around hub components.",
    effectiveness: 0.5,
    aisvs: ["C4"],
    controlId: "m9",
    phase: "design",
    aliases: [
      "add redundancy for critical components",
      "implement circuit breakers",
      "consider decomposing into smaller components",
    ],
  },
  {
    id: "MIT-REASONING-VALIDATION",
    name: "Plan & output grounding checks",
    description:
      "Validate multi-step plans and factual outputs (critic models, grounding against sources) before they drive actions.",
    effectiveness: 0.4,
    aisvs: ["C7", "C9"],
    controlId: "m5",
    phase: "build",
    aliases: ["goal alignment verification"],
  },
  {
    id: "MIT-SECURE-SDLC",
    name: "Secure SDLC, red teaming & adversarial testing",
    description:
      "Threat-model, red-team and adversarially test the system before release and after every model or prompt change.",
    effectiveness: 0.3,
    aisvs: ["C3", "C11"],
    controlId: "m13",
    phase: "design",
    aliases: [
      "model robustness testing",
      "adversarial robustness testing",
      "red team testing",
      "peer review",
      "iac scanning",
      "git signing",
      "drift detection",
    ],
  },
  {
    id: "MIT-INCIDENT-RESPONSE",
    name: "AI incident response & recovery",
    description:
      "Runbooks to roll back models, purge poisoned memory and revoke agent credentials after an incident.",
    effectiveness: 0.3,
    aisvs: ["C12"],
    controlId: "m18",
    phase: "operate",
  },
];

let byId: Map<string, CatalogMitigation> | null = null;
export function mitigationsById(): Map<string, CatalogMitigation> {
  if (!byId) byId = new Map(MITIGATIONS.map((m) => [m.id, m]));
  return byId;
}

export function getMitigation(id: string): CatalogMitigation | undefined {
  return mitigationsById().get(id);
}

let aliasIndex: Map<string, string> | null = null;
/** Resolve a v1 free-text mitigation (or a catalog id/name) to a catalog id. */
export function resolveMitigationId(textOrId: string): string | undefined {
  if (mitigationsById().has(textOrId)) return textOrId;
  if (!aliasIndex) {
    aliasIndex = new Map();
    for (const m of MITIGATIONS) {
      aliasIndex.set(m.name.toLowerCase(), m.id);
      for (const a of m.aliases ?? []) aliasIndex.set(a.toLowerCase().trim(), m.id);
    }
  }
  return aliasIndex.get(textOrId.toLowerCase().trim());
}

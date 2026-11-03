import {
  MaestroLayer,
  type CanvasNodeData,
  type ComponentCategory,
  type NodeSemantics,
  type SemanticKind,
  type TrustLevel,
} from "./types";

/**
 * Palette-ready definitions of the agentic primitives (§7.6 / P3-32).
 * Each entry carries the node data a drop creates (category, component id,
 * MAESTRO layers and default `semantics`), the metadata chips the palette
 * shows, and a one-line "why it matters". The engine reads `semantics`
 * (engine/semantics.ts), never the label.
 */
export interface SemanticTypeDefinition {
  /** Palette item id. */
  id: string;
  kind: SemanticKind;
  label: string;
  /** One line: why this component matters for the threat model. */
  why: string;
  category: ComponentCategory;
  componentId?: string;
  maestroLayers: MaestroLayer[];
  /** React Flow node type. */
  nodeType: "agentComponent" | "dataStore" | "actor";
  /** Icon registry key (src/lib/icons.ts). */
  icon: string;
  trustLevel: TrustLevel;
  semantics: NodeSemantics;
  /** Extra node data (tool access mode, data sensitivity, …). */
  data?: Partial<CanvasNodeData>;
  /** Metadata chips shown on the palette card. */
  chips: string[];
}

export const SEMANTIC_TYPES: SemanticTypeDefinition[] = [
  {
    id: "sem-agent",
    kind: "agent",
    label: "Agent",
    why: "Plans and acts on untrusted input; the main target of goal hijacking.",
    category: "kc2",
    componentId: "kc2",
    maestroLayers: [MaestroLayer.AgentFrameworks],
    nodeType: "agentComponent",
    icon: "bot",
    trustLevel: "semi-trusted",
    semantics: { kind: "agent" },
    chips: ["autonomous"],
  },
  {
    id: "sem-orchestrator",
    kind: "orchestrator",
    label: "Orchestrator",
    why: "Delegates to other agents; a compromise cascades to every worker.",
    category: "kc2",
    componentId: "kc2.2",
    maestroLayers: [MaestroLayer.AgentFrameworks, MaestroLayer.AgentEcosystem],
    nodeType: "agentComponent",
    icon: "network",
    trustLevel: "semi-trusted",
    semantics: { kind: "orchestrator" },
    chips: ["delegates"],
  },
  {
    id: "sem-llm",
    kind: "model",
    label: "LLM",
    why: "Follows instructions found anywhere in its context window.",
    category: "kc1",
    componentId: "kc1",
    maestroLayers: [MaestroLayer.FoundationModels],
    nodeType: "agentComponent",
    icon: "brain",
    trustLevel: "semi-trusted",
    semantics: { kind: "model", provenance: { signed: false, pinned: false } },
    chips: ["provenance: unverified"],
  },
  {
    id: "sem-memory-episodic",
    kind: "memory",
    label: "Episodic Memory",
    why: "Persists what the agent saw; poisoned entries steer future sessions.",
    category: "kc4",
    componentId: "kc4",
    maestroLayers: [MaestroLayer.DataOperations],
    nodeType: "dataStore",
    icon: "database",
    trustLevel: "trusted",
    semantics: {
      kind: "memory",
      memory: { kind: "episodic", retention: "months", perUserIsolation: false, writeAccess: [] },
    },
    chips: ["episodic", "shared"],
  },
  {
    id: "sem-memory-semantic",
    kind: "memory",
    label: "Semantic Memory",
    why: "Long-lived facts the agent trusts; a write path for persistent injection.",
    category: "kc4",
    componentId: "kc4.5",
    maestroLayers: [MaestroLayer.DataOperations],
    nodeType: "dataStore",
    icon: "database",
    trustLevel: "trusted",
    semantics: {
      kind: "memory",
      memory: {
        kind: "semantic",
        retention: "indefinite",
        perUserIsolation: false,
        writeAccess: [],
      },
    },
    chips: ["semantic", "indefinite"],
  },
  {
    id: "sem-memory-vector",
    kind: "memory",
    label: "Vector Store",
    why: "Retrieved chunks enter the prompt verbatim (RAG poisoning).",
    category: "kc4",
    componentId: "kc4.3",
    maestroLayers: [MaestroLayer.DataOperations],
    nodeType: "dataStore",
    icon: "database",
    trustLevel: "trusted",
    semantics: {
      kind: "memory",
      memory: { kind: "vector", retention: "indefinite", perUserIsolation: false, writeAccess: [] },
    },
    chips: ["vector", "RAG"],
  },
  {
    id: "sem-tool-scoped",
    kind: "scoped-tool",
    label: "Tool (scoped)",
    why: "Every tool call is an action; scopes and allow-lists bound the blast radius.",
    category: "kc5",
    componentId: "kc5",
    maestroLayers: [MaestroLayer.AgentFrameworks],
    nodeType: "agentComponent",
    icon: "wrench",
    trustLevel: "semi-trusted",
    semantics: { kind: "scoped-tool", tool: { scopes: ["read"], allowList: [] } },
    data: { toolAccessMode: "read-only", toolRiskTier: "benign" },
    chips: ["scopes: read"],
  },
  {
    id: "sem-mcp-server",
    kind: "mcp-server",
    label: "MCP Server",
    why: "Tool descriptions and results flow straight into the model (tool poisoning).",
    category: "kc5",
    componentId: "kc5.3",
    maestroLayers: [MaestroLayer.AgentFrameworks, MaestroLayer.AgentEcosystem],
    nodeType: "agentComponent",
    icon: "server",
    trustLevel: "semi-trusted",
    semantics: {
      kind: "mcp-server",
      mcp: {
        transport: "http",
        auth: "none",
        toolsExposed: [],
        provenance: { signed: false, pinned: false },
      },
    },
    chips: ["http", "auth: none", "unsigned"],
  },
  {
    id: "sem-a2a-peer",
    kind: "a2a-peer",
    label: "A2A Peer",
    why: "Another organisation's agent: its messages are untrusted instructions.",
    category: "kc2",
    componentId: "kc2",
    maestroLayers: [MaestroLayer.AgentEcosystem],
    nodeType: "agentComponent",
    icon: "users",
    trustLevel: "untrusted",
    semantics: {
      kind: "a2a-peer",
      a2a: { mutualAuth: false, messageSigning: false, schemaValidation: false },
    },
    chips: ["no mTLS", "unsigned"],
  },
  {
    id: "sem-guardrail",
    kind: "guardrail",
    label: "Guardrail / Policy",
    why: "Inspects traffic it sits on; lowers likelihood of threats behind it.",
    category: "kc3",
    componentId: "kc3.4",
    maestroLayers: [MaestroLayer.SecurityCompliance, MaestroLayer.AgentFrameworks],
    nodeType: "agentComponent",
    icon: "shield",
    trustLevel: "trusted",
    semantics: { kind: "guardrail", guardrail: { coverage: ["input", "output"] } },
    chips: ["input", "output"],
  },
  {
    id: "sem-hitl-gate",
    kind: "hitl-gate",
    label: "Human Approval Gate",
    why: "Breaks attack paths to privileged actions — if approvals stay meaningful.",
    category: "kc6",
    componentId: "kc6",
    maestroLayers: [MaestroLayer.SecurityCompliance],
    nodeType: "agentComponent",
    icon: "user-check",
    trustLevel: "trusted",
    semantics: { kind: "hitl-gate", hitl: { protects: [] } },
    chips: ["approval"],
  },
  {
    id: "sem-identity",
    kind: "identity",
    label: "Identity Provider / Credential",
    why: "Issues the tokens agents act with; delegation without narrowing is privilege abuse.",
    category: "kc6",
    componentId: "kc6",
    maestroLayers: [MaestroLayer.SecurityCompliance],
    nodeType: "agentComponent",
    icon: "key",
    trustLevel: "trusted",
    semantics: { kind: "identity", identity: { delegation: true, scopeNarrowing: false } },
    data: { dataSensitivity: "credentials" },
    chips: ["delegation", "no narrowing"],
  },
  {
    id: "sem-observability",
    kind: "observability",
    label: "Observability",
    why: "Without traces you cannot detect a rogue or hijacked agent.",
    category: "kc6",
    componentId: "kc6",
    maestroLayers: [MaestroLayer.EvaluationObservability],
    nodeType: "agentComponent",
    icon: "activity",
    trustLevel: "trusted",
    semantics: { kind: "observability", observability: { covers: [], immutable: false } },
    chips: ["traces"],
  },
];

export const SEMANTIC_TYPES_BY_ID = new Map(SEMANTIC_TYPES.map((t) => [t.id, t]));

/** Node data for a fresh drop of `def` (deep-copies the default semantics). */
export function nodeDataFor(def: SemanticTypeDefinition): CanvasNodeData {
  return {
    label: def.label,
    description: def.why,
    category: def.category,
    componentId: def.componentId,
    maestroLayers: [...def.maestroLayers],
    trustLevel: def.trustLevel,
    icon: def.icon,
    threats: [],
    ...(def.data ?? {}),
    semantics: JSON.parse(JSON.stringify(def.semantics)) as NodeSemantics,
  };
}

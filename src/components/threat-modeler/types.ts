import type { Node, Edge } from "@xyflow/react";

// ─── MAESTRO Layers ───────────────────────────────────────────────
export enum MaestroLayer {
  FoundationModels = 1,
  DataOperations = 2,
  AgentFrameworks = 3,
  DeploymentInfrastructure = 4,
  EvaluationObservability = 5,
  SecurityCompliance = 6,
  AgentEcosystem = 7,
}

export const MAESTRO_LAYER_LABELS: Record<MaestroLayer, string> = {
  [MaestroLayer.FoundationModels]: "L1: Foundation Models",
  [MaestroLayer.DataOperations]: "L2: Data Operations",
  [MaestroLayer.AgentFrameworks]: "L3: Agent Frameworks",
  [MaestroLayer.DeploymentInfrastructure]: "L4: Deployment Infra",
  [MaestroLayer.EvaluationObservability]: "L5: Eval/Observability",
  [MaestroLayer.SecurityCompliance]: "L6: Security/Compliance",
  [MaestroLayer.AgentEcosystem]: "L7: Agent Ecosystem",
};

/** Full CSA MAESTRO layer names (A4): use in prose, the Guide and tooltips. */
export const MAESTRO_LAYER_NAMES: Record<MaestroLayer, string> = {
  [MaestroLayer.FoundationModels]: "Foundation Models",
  [MaestroLayer.DataOperations]: "Data Operations",
  [MaestroLayer.AgentFrameworks]: "Agent Frameworks",
  [MaestroLayer.DeploymentInfrastructure]: "Deployment & Infrastructure",
  [MaestroLayer.EvaluationObservability]: "Evaluation & Observability",
  [MaestroLayer.SecurityCompliance]: "Security & Compliance",
  [MaestroLayer.AgentEcosystem]: "Agent Ecosystem",
};

export const MAESTRO_LAYER_COLORS: Record<MaestroLayer, string> = {
  [MaestroLayer.FoundationModels]: "#3b82f6",
  [MaestroLayer.DataOperations]: "#a855f7",
  [MaestroLayer.AgentFrameworks]: "#22c55e",
  [MaestroLayer.DeploymentInfrastructure]: "#f97316",
  [MaestroLayer.EvaluationObservability]: "#06b6d4",
  [MaestroLayer.SecurityCompliance]: "#ef4444",
  [MaestroLayer.AgentEcosystem]: "#eab308",
};

// ─── Node Types ───────────────────────────────────────────────────
export type ComponentCategory =
  | "kc1"
  | "kc2"
  | "kc3"
  | "kc4"
  | "kc5"
  | "kc6"
  | "actor"
  | "external"
  | "datastore"
  | "trust-boundary"
  | "custom";

export type TrustLevel = "untrusted" | "semi-trusted" | "trusted";

export type ToolAccessMode = "read-only" | "read-write" | "write-only" | "execute" | "admin";
export type ToolRiskTier = "benign" | "sensitive" | "destructive" | "critical";
export type PromptType =
  | "system"
  | "user"
  | "few-shot"
  | "chain-of-thought"
  | "function-call"
  | "multi-turn";
export type DataSensitivity = "none" | "internal" | "pii" | "credentials" | "regulated";

export interface ThreatBadge {
  threatId: string;
  name: string;
  severity: "high" | "medium" | "low";
  inherited: boolean;
  source?: string;
}

// ─── Agentic semantics (Phase 3 §7.6) ───────────────────────────
// Optional, additive metadata that gives a node engine-visible meaning
// beyond its KC category. Every field is optional so older models load
// unchanged; the engine infers a `kind` when `semantics` is absent.
export type SemanticKind =
  | "agent"
  | "orchestrator"
  | "model"
  | "reasoning"
  | "guardrail"
  | "hitl-gate"
  | "tool"
  | "scoped-tool"
  | "mcp-server"
  | "a2a-peer"
  | "memory"
  | "datastore"
  | "identity"
  | "observability"
  | "infrastructure"
  | "training-pipeline"
  | "actor"
  | "external"
  | "boundary"
  | "custom";

export type GuardrailCoverage = "input" | "output" | "tool-call";

export interface ProvenanceInfo {
  signed: boolean;
  pinned: boolean;
}

export interface NodeSemantics {
  kind: SemanticKind;
  /** Guardrail / policy engine: which traffic it inspects. */
  guardrail?: { coverage: GuardrailCoverage[] };
  /** Human approval gate: optional explicit list of node ids it protects. */
  hitl?: { protects?: string[] };
  /** Tool with a permission scope. `allowList` = allowed operations/targets; rateLimit = calls/minute. */
  tool?: { scopes: string[]; rateLimit?: number; allowList?: string[] };
  mcp?: {
    transport: "stdio" | "http" | "sse" | "websocket";
    auth: "none" | "api-key" | "oauth2" | "mtls";
    toolsExposed: string[];
    provenance: ProvenanceInfo;
  };
  a2a?: { mutualAuth: boolean; messageSigning: boolean; schemaValidation: boolean };
  memory?: {
    kind: "episodic" | "semantic" | "vector" | "shared" | "session";
    retention?: "session" | "days" | "months" | "indefinite";
    perUserIsolation: boolean;
    /** Node ids allowed to write. Empty = only declared edges write. */
    writeAccess: string[];
  };
  identity?: { delegation: boolean; scopeNarrowing: boolean };
  observability?: { covers: string[]; immutable?: boolean };
  /** Model / framework / tool provenance (signed artefact, pinned version). */
  provenance?: ProvenanceInfo;
}

export interface CanvasNodeData {
  [key: string]: unknown;
  label: string;
  description?: string;
  category: ComponentCategory;
  componentId?: string;
  subComponentId?: string;
  maestroLayers: MaestroLayer[];
  trustLevel: TrustLevel;
  icon?: string;
  color?: string;
  threats: ThreatBadge[];
  toolAccessMode?: ToolAccessMode;
  toolRiskTier?: ToolRiskTier;
  promptType?: PromptType;
  dataSensitivity?: DataSensitivity;
  customMetadata?: Record<string, string>;
  isCustom?: boolean;
  customThreatIds?: string[];
  /** Mitigation catalog ids (see engine/catalog/mitigations.ts). */
  appliedMitigations?: string[];
  mitigationStatuses?: Record<string, MitigationStatusEntry>;
  semantics?: NodeSemantics;
}

export type MitigationStatusValue = "not-started" | "in-progress" | "implemented" | "accepted-risk";

export interface MitigationStatusEntry {
  status: MitigationStatusValue;
  justification?: string;
  owner?: string;
  due?: string;
  evidenceUrl?: string;
  updatedAt?: string;
}

export type CanvasNode = Node<CanvasNodeData>;

// ─── Edge / Data Flow Types ──────────────────────────────────────
export interface DataFlowMetadata {
  label: string;
  protocol: string;
  encrypted: boolean;
  authentication: string;
  dataClassification: "Public" | "Internal" | "Confidential" | "Restricted";
  containsPII: boolean;
  bidirectional: boolean;
  customMetadata: Record<string, string>;
}

export interface CanvasEdgeData extends DataFlowMetadata {
  [key: string]: unknown;
  threats: ThreatBadge[];
}

export type CanvasEdge = Edge<CanvasEdgeData>;

// ─── Custom Component Definition ─────────────────────────────────
export interface CustomThreatDefinition {
  id: string;
  name: string;
  description: string;
  severity: "high" | "medium" | "low";
  maestroLayer: MaestroLayer;
  attackVectors: string[];
  mitigations: string[];
}

export interface CustomComponentDefinition {
  id: string;
  name: string;
  description: string;
  maestroLayers: MaestroLayer[];
  category: ComponentCategory;
  trustLevel: TrustLevel;
  icon: string;
  color: string;
  associatedThreatIds: string[];
  customThreats: CustomThreatDefinition[];
  metadata: Record<string, string>;
}

// ─── Threat Engine Output ────────────────────────────────────────
export interface CiscoTaxonomyMapping {
  objectiveId: string;
  objectiveName: string;
  techniques?: string[];
}

export interface OwaspAgenticMapping {
  asiId: string;
  asiName: string;
  confidence: "high" | "medium" | "low";
}

export type ThreatStatus = "open" | "mitigated" | "accepted" | "transferred" | "false-positive";

export type RuleScope = "node" | "edge" | "path" | "model";
/** STRIDE category letters. */
export type Stride = "S" | "T" | "R" | "I" | "D" | "E";
export type Severity = "critical" | "high" | "medium" | "low";

/** One contextual adjustment applied by the severity model (engine/severity.ts). */
export interface SeverityFactor {
  kind: "likelihood" | "impact";
  label: string;
  delta: number;
}

/** Why a threat fired: rule id, matched evidence and (optionally) the path. */
export interface ThreatExplanation {
  ruleId: string;
  evidence: string[];
  path?: string[];
  factors: SeverityFactor[];
}

export interface GeneratedThreat {
  id: string;
  threatId?: string;
  name: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  methodology: "MAESTRO" | "component" | "connection" | "topology" | "custom";
  maestroLayer?: MaestroLayer;
  affectedNodeIds: string[];
  affectedEdgeIds: string[];
  inherited: boolean;
  propagationPath?: string[];
  sourceNodeId?: string;
  mitigations: string[];
  mitigationIds?: string[];
  crossLayerChain?: { fromLayer: MaestroLayer; toLayer: MaestroLayer; description: string }[];
  ciscoMapping?: CiscoTaxonomyMapping[];
  owaspMapping?: OwaspAgenticMapping[];
  status?: ThreatStatus;
  statusJustification?: string;
  // ─── Phase 3 engine fields (all optional for backwards compatibility) ───
  /** Stable catalog rule id, e.g. "TM-CONN-001" (also the SARIF ruleId). */
  ruleId?: string;
  /** Stable key of the affected component(s); `${ruleId}::${componentKey}` is the threat id. */
  componentKey?: string;
  scope?: RuleScope;
  likelihood?: number;
  impact?: number;
  /** likelihood × impact, 1–25. */
  score?: number;
  /** score × (1 − Σ effectiveness of implemented mitigations, capped 0.9); 0 when mitigated/false-positive. */
  residualScore?: number;
  residualFactor?: number;
  mitigationState?: "none" | "partial" | "mitigated";
  implementedMitigationIds?: string[];
  /** securityData control ids (m1…m20) behind the catalog mitigations. */
  controlIds?: string[];
  why?: ThreatExplanation;
  stride?: Stride[];
  aisvs?: string[];
  /** securityData threat id ("t1"…"t17"). */
  catalogThreat?: string;
  references?: { title: string; url: string }[];
  /** Node whose context drove likelihood/impact (used to attribute the threat in the model score). */
  focusNodeId?: string;
  /** For inherited threats: id of the direct threat it was propagated from. */
  inheritedFrom?: string;
  hops?: number;
  owner?: string;
  due?: string;
  evidenceUrl?: string;
}

export interface ThreatAnalysisResult {
  threats: GeneratedThreat[];
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    inherited: number;
    mitigated: number;
    byMethodology: Record<string, number>;
    byLayer: Partial<Record<MaestroLayer, number>>;
  };
}

// ─── Canvas State ────────────────────────────────────────────────
export type AnalysisMode = "manual" | "live";
export type MethodologyMode = "maestro";

export interface ThreatModelState {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  customComponents: CustomComponentDefinition[];
  customThreats: CustomThreatDefinition[];
  analysisMode: AnalysisMode;
  methodology: MethodologyMode;
  analysisResult: ThreatAnalysisResult | null;
}

// ─── Palette Items ───────────────────────────────────────────────
export interface PaletteItem {
  id: string;
  label: string;
  description?: string;
  category: ComponentCategory;
  componentId?: string;
  subComponentId?: string;
  maestroLayers: MaestroLayer[];
  icon: string;
  color: string;
  nodeType: string;
}

export interface PaletteGroup {
  id: string;
  label: string;
  items: PaletteItem[];
  color: string;
}

// ─── Templates ───────────────────────────────────────────────────
export interface ArchitectureTemplate {
  id: string;
  name: string;
  description: string;
  nodes: Omit<CanvasNode, "id">[];
  edges: Omit<CanvasEdge, "id">[];
}

// ─── Default metadata for new edges ──────────────────────────────
export const DEFAULT_EDGE_METADATA: DataFlowMetadata = {
  label: "Data Flow",
  protocol: "HTTPS",
  encrypted: true,
  authentication: "None",
  dataClassification: "Internal",
  containsPII: false,
  bidirectional: false,
  customMetadata: {},
};

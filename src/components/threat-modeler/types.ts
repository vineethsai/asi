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
  appliedMitigations?: string[];
  mitigationStatuses?: Record<string, MitigationStatusEntry>;
}

export type MitigationStatusValue = "not-started" | "in-progress" | "implemented" | "accepted-risk";

export interface MitigationStatusEntry {
  status: MitigationStatusValue;
  justification?: string;
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

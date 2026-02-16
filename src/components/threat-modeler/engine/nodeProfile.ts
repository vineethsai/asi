import type {
  CanvasNode,
  ComponentCategory,
  TrustLevel,
  ToolAccessMode,
  ToolRiskTier,
  PromptType,
  DataSensitivity,
} from "../types";

// ─── Node Risk Profile ───────────────────────────────────────────
// Centralized derived-risk view of a node. Every engine module should
// consume this instead of hand-reading raw CanvasNodeData fields.
// When a new metadata field is added to CanvasNodeData, update
// `buildSingleProfile` below and every module picks it up for free.

export interface NodeRiskProfile {
  nodeId: string;
  label: string;
  category: ComponentCategory;
  trustLevel: TrustLevel;

  // Raw metadata (passed through for modules that need the original values)
  toolAccessMode?: ToolAccessMode;
  toolRiskTier?: ToolRiskTier;
  promptType?: PromptType;
  dataSensitivity?: DataSensitivity;

  // Derived risk properties
  inherentRiskMultiplier: number; // 0.5 (benign/RO) to 3.0 (critical/exec)
  accessDanger: "safe" | "guarded" | "dangerous" | "critical";
  handlesCredentials: boolean;
  handlesPII: boolean;
  handlesRegulatedData: boolean;
  isExecutionCapable: boolean;
  isExternallyFacing: boolean;
  promptInjectionSurface: boolean;
  functionCallSurface: boolean;
}

// ─── Risk Multiplier Computation ─────────────────────────────────

const ACCESS_MULTIPLIER: Record<ToolAccessMode, number> = {
  "read-only": 0.5,
  "read-write": 1.2,
  "write-only": 1.5,
  execute: 2.5,
  admin: 3.0,
};

const RISK_TIER_MULTIPLIER: Record<ToolRiskTier, number> = {
  benign: 0.6,
  sensitive: 1.2,
  destructive: 2.0,
  critical: 3.0,
};

const SENSITIVITY_MULTIPLIER: Record<DataSensitivity, number> = {
  none: 1.0,
  internal: 1.1,
  pii: 1.5,
  credentials: 2.0,
  regulated: 1.8,
};

function computeInherentRiskMultiplier(
  toolAccessMode?: ToolAccessMode,
  toolRiskTier?: ToolRiskTier,
  dataSensitivity?: DataSensitivity,
): number {
  const accessFactor = toolAccessMode ? ACCESS_MULTIPLIER[toolAccessMode] : 1.0;
  const riskFactor = toolRiskTier ? RISK_TIER_MULTIPLIER[toolRiskTier] : 1.0;
  const sensitivityFactor = dataSensitivity ? SENSITIVITY_MULTIPLIER[dataSensitivity] : 1.0;
  // Geometric mean keeps the multiplier from exploding
  return Math.round(Math.cbrt(accessFactor * riskFactor * sensitivityFactor) * 100) / 100;
}

function computeAccessDanger(
  toolAccessMode?: ToolAccessMode,
  toolRiskTier?: ToolRiskTier,
): NodeRiskProfile["accessDanger"] {
  if (toolRiskTier === "critical" || toolAccessMode === "admin") return "critical";
  if (toolRiskTier === "destructive" || toolAccessMode === "execute") return "dangerous";
  if (
    toolRiskTier === "sensitive" ||
    toolAccessMode === "read-write" ||
    toolAccessMode === "write-only"
  )
    return "guarded";
  return "safe";
}

// ─── Build Profiles ──────────────────────────────────────────────

function buildSingleProfile(node: CanvasNode): NodeRiskProfile {
  const d = node.data;
  return {
    nodeId: node.id,
    label: d?.label ?? "Unknown",
    category: d?.category ?? "custom",
    trustLevel: d?.trustLevel ?? "semi-trusted",

    toolAccessMode: d?.toolAccessMode,
    toolRiskTier: d?.toolRiskTier,
    promptType: d?.promptType,
    dataSensitivity: d?.dataSensitivity,

    inherentRiskMultiplier: computeInherentRiskMultiplier(
      d?.toolAccessMode,
      d?.toolRiskTier,
      d?.dataSensitivity,
    ),
    accessDanger: computeAccessDanger(d?.toolAccessMode, d?.toolRiskTier),
    handlesCredentials: d?.dataSensitivity === "credentials",
    handlesPII: d?.dataSensitivity === "pii",
    handlesRegulatedData: d?.dataSensitivity === "regulated",
    isExecutionCapable: d?.toolAccessMode === "execute" || d?.toolAccessMode === "admin",
    isExternallyFacing: d?.category === "external" || d?.trustLevel === "untrusted",
    promptInjectionSurface: !!d?.promptType,
    functionCallSurface: d?.promptType === "function-call",
  };
}

export function buildNodeProfiles(nodes: CanvasNode[]): Map<string, NodeRiskProfile> {
  const profiles = new Map<string, NodeRiskProfile>();
  for (const node of nodes) {
    if (!node.data || node.type === "trustBoundary") continue;
    profiles.set(node.id, buildSingleProfile(node));
  }
  return profiles;
}

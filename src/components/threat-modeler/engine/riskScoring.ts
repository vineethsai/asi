import type { CanvasNode, CanvasEdge, ThreatAnalysisResult } from "../types";
import type { NodeRiskProfile } from "./nodeProfile";

export interface ComponentRiskScore {
  nodeId: string;
  label: string;
  inherentRisk: number;
  mitigatedRisk: number;
  residualRisk: number;
  attackSurface: number;
  threatCount: number;
  criticalCount: number;
  highCount: number;
}

export interface ModelRiskSummary {
  overallScore: number;
  severityLabel: string;
  componentScores: ComponentRiskScore[];
  riskDistribution: { critical: number; high: number; medium: number; low: number };
  topRisks: { name: string; score: number; nodeId: string }[];
}

const SEVERITY_WEIGHTS = { critical: 10, high: 7, medium: 4, low: 1 };

export function calculateModelRisk(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  result: ThreatAnalysisResult,
  profiles?: Map<string, NodeRiskProfile>,
): ModelRiskSummary {
  const componentScores: ComponentRiskScore[] = [];
  const connectionCount = new Map<string, number>();

  for (const edge of edges) {
    connectionCount.set(edge.source, (connectionCount.get(edge.source) ?? 0) + 1);
    connectionCount.set(edge.target, (connectionCount.get(edge.target) ?? 0) + 1);
  }

  const SENSITIVITY_SURFACE: Record<string, number> = {
    credentials: 20,
    regulated: 15,
    pii: 10,
    internal: 5,
    none: 0,
  };

  for (const node of nodes) {
    if (!node.data || node.type === "trustBoundary") continue;
    const nodeThreats = result.threats.filter((t) => t.affectedNodeIds.includes(node.id));
    const profile = profiles?.get(node.id);
    const riskMultiplier = profile?.inherentRiskMultiplier ?? 1.0;
    const rawInherentRisk = nodeThreats.reduce(
      (sum, t) => sum + (SEVERITY_WEIGHTS[t.severity] ?? 0),
      0,
    );
    const inherentRisk = Math.round(rawInherentRisk * riskMultiplier);
    const mitigatedCount = nodeThreats.filter((t) => t.mitigations.length > 0).length;
    const mitigatedRisk = mitigatedCount * 2;
    const connections = connectionCount.get(node.id) ?? 0;
    const trustMultiplier =
      node.data.trustLevel === "untrusted"
        ? 1.5
        : node.data.trustLevel === "semi-trusted"
          ? 1.0
          : 0.7;
    const sensitivityBonus = profile?.dataSensitivity
      ? (SENSITIVITY_SURFACE[profile.dataSensitivity] ?? 0)
      : 0;
    const attackSurface = Math.round(connections * trustMultiplier * 10) + sensitivityBonus;

    componentScores.push({
      nodeId: node.id,
      label: node.data.label,
      inherentRisk,
      mitigatedRisk,
      residualRisk: Math.max(0, inherentRisk - mitigatedRisk),
      attackSurface,
      threatCount: nodeThreats.length,
      criticalCount: nodeThreats.filter((t) => t.severity === "critical").length,
      highCount: nodeThreats.filter((t) => t.severity === "high").length,
    });
  }

  const totalInherent = componentScores.reduce((s, c) => s + c.inherentRisk, 0);
  const totalResidual = componentScores.reduce((s, c) => s + c.residualRisk, 0);
  const maxPossible = Math.max(totalInherent, 1);
  const overallScore = Math.round((totalResidual / maxPossible) * 100);
  const severityLabel =
    overallScore >= 80
      ? "Critical"
      : overallScore >= 60
        ? "High"
        : overallScore >= 40
          ? "Medium"
          : overallScore >= 20
            ? "Low"
            : "Minimal";

  const topRisks = componentScores
    .sort((a, b) => b.residualRisk - a.residualRisk)
    .slice(0, 5)
    .map((c) => ({ name: c.label, score: c.residualRisk, nodeId: c.nodeId }));

  return {
    overallScore,
    severityLabel,
    componentScores,
    riskDistribution: {
      critical: result.summary.critical,
      high: result.summary.high,
      medium: result.summary.medium,
      low: result.summary.low,
    },
    topRisks,
  };
}

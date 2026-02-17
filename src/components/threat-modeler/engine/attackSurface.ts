import type { CanvasNode, CanvasEdge } from "../types";
import type { NodeRiskProfile } from "./nodeProfile";

function getNodeBoundaryId(node: CanvasNode, nodes: CanvasNode[]): string | undefined {
  if (!node.parentId) return undefined;
  const parent = nodes.find((n) => n.id === node.parentId);
  return parent?.type === "trustBoundary" ? parent.id : undefined;
}

export interface AttackSurfaceScore {
  nodeId: string;
  label: string;
  score: number;
  factors: {
    connections: number;
    trustLevel: number;
    externalExposure: number;
    unencryptedFlows: number;
    unauthenticatedFlows: number;
    piiExposure: number;
    riskTierFactor: number;
    sensitivityFactor: number;
    executionFactor: number;
    crossBoundaryFlows: number;
  };
  riskLevel: "critical" | "high" | "medium" | "low";
}

const RISK_TIER_SURFACE: Record<string, number> = {
  critical: 25,
  destructive: 20,
  sensitive: 10,
  benign: 0,
};

const SENSITIVITY_SURFACE: Record<string, number> = {
  credentials: 25,
  regulated: 20,
  pii: 15,
  internal: 5,
  none: 0,
};

export function calculateAttackSurface(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  profiles?: Map<string, NodeRiskProfile>,
): AttackSurfaceScore[] {
  const scores: AttackSurfaceScore[] = [];
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  for (const node of nodes) {
    if (!node.data || node.type === "trustBoundary") continue;

    const profile = profiles?.get(node.id);
    const connectedEdges = edges.filter((e) => e.source === node.id || e.target === node.id);
    const connections = connectedEdges.length;
    const trustLevel =
      node.data.trustLevel === "untrusted" ? 30 : node.data.trustLevel === "semi-trusted" ? 15 : 5;

    const externalConnections = connectedEdges.filter((e) => {
      const other = e.source === node.id ? nodeMap.get(e.target) : nodeMap.get(e.source);
      return other?.data?.category === "external" || other?.data?.category === "actor";
    });
    const externalExposure = externalConnections.length * 15;

    const unencryptedFlows = connectedEdges.filter((e) => e.data && !e.data.encrypted).length * 20;
    const unauthenticatedFlows =
      connectedEdges.filter((e) => e.data?.authentication === "None").length * 15;
    const piiExposure = connectedEdges.filter((e) => e.data?.containsPII).length * 10;

    const riskTierFactor = profile?.toolRiskTier
      ? (RISK_TIER_SURFACE[profile.toolRiskTier] ?? 0)
      : 0;
    const sensitivityFactor = profile?.dataSensitivity
      ? (SENSITIVITY_SURFACE[profile.dataSensitivity] ?? 0)
      : 0;
    const executionFactor = profile?.isExecutionCapable ? 15 : 0;

    const nodeBoundary = getNodeBoundaryId(node, nodes);
    const crossBoundaryFlows =
      connectedEdges.filter((e) => {
        const otherId = e.source === node.id ? e.target : e.source;
        const other = nodeMap.get(otherId);
        if (!other) return false;
        const otherBoundary = getNodeBoundaryId(other, nodes);
        return nodeBoundary !== otherBoundary;
      }).length * 12;

    const score =
      connections * 5 +
      trustLevel +
      externalExposure +
      unencryptedFlows +
      unauthenticatedFlows +
      piiExposure +
      riskTierFactor +
      sensitivityFactor +
      executionFactor +
      crossBoundaryFlows;
    const riskLevel: AttackSurfaceScore["riskLevel"] =
      score >= 100 ? "critical" : score >= 60 ? "high" : score >= 30 ? "medium" : "low";

    scores.push({
      nodeId: node.id,
      label: node.data.label,
      score,
      factors: {
        connections,
        trustLevel,
        externalExposure,
        unencryptedFlows,
        unauthenticatedFlows,
        piiExposure,
        riskTierFactor,
        sensitivityFactor,
        executionFactor,
        crossBoundaryFlows,
      },
      riskLevel,
    });
  }

  return scores.sort((a, b) => b.score - a.score);
}

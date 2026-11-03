import type { CanvasEdge, CanvasNode } from "../types";
import { buildGraph, type ModelGraph } from "./graph";

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

/** Per-component attack surface (graph-based; boundary crossing via graph.crossesBoundary). */
export function attackSurfaceFromGraph(graph: ModelGraph): AttackSurfaceScore[] {
  const scores: AttackSurfaceScore[] = [];
  for (const n of graph.nodes) {
    const touching = [...(graph.in.get(n.id) ?? []), ...(graph.out.get(n.id) ?? [])];
    const connections = touching.length;
    const trustLevel =
      n.data.trustLevel === "untrusted" ? 30 : n.data.trustLevel === "semi-trusted" ? 15 : 5;
    const externalExposure =
      touching.filter((e) => {
        const other = graph.nodeById.get(e.source === n.id ? e.target : e.source);
        return !!other && (other.isActor || other.isExternal);
      }).length * 15;
    const unencryptedFlows = touching.filter((e) => !e.encrypted).length * 20;
    const unauthenticatedFlows = touching.filter((e) => !e.authenticated).length * 15;
    const piiExposure = touching.filter((e) => e.data.containsPII).length * 10;
    const riskTierFactor = RISK_TIER_SURFACE[n.data.toolRiskTier ?? ""] ?? 0;
    const sensitivityFactor = SENSITIVITY_SURFACE[n.data.dataSensitivity ?? "none"] ?? 0;
    const executionFactor = n.isExecution ? 15 : 0;
    const crossBoundaryFlows = touching.filter((e) => e.crossesBoundary).length * 12;
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
    scores.push({
      nodeId: n.id,
      label: n.label,
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
      riskLevel: score >= 100 ? "critical" : score >= 60 ? "high" : score >= 30 ? "medium" : "low",
    });
  }
  return scores.sort((a, b) => b.score - a.score || (a.nodeId < b.nodeId ? -1 : 1));
}

export function calculateAttackSurface(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
): AttackSurfaceScore[] {
  return attackSurfaceFromGraph(buildGraph(nodes, edges));
}

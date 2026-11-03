import type { GeneratedThreat } from "../types";
import { type ModelGraph, type NodeInfo, reachFrom } from "./graph";
import type { AttackPath } from "./paths";
import { riskLabel } from "./severity";
import type { AttackSurfaceScore } from "./attackSurface";
import type { ModelRiskSummary } from "./riskScoring";

export interface ComponentScore {
  nodeId: string;
  label: string;
  /** 0–100, from residual threat scores. */
  residual: number;
  /** 0–100, from inherent threat scores. */
  inherent: number;
  weight: number;
  reachWeight: number;
  assetWeight: number;
  /** Influence hops from the nearest entry point (null = unreachable). */
  hops: number | null;
  threatCount: number;
  openCount: number;
  topThreatIds: string[];
}

export interface ModelScore {
  /** 0–100 residual model score. */
  overall: number;
  label: string;
  /** Same formula on inherent scores (nothing implemented / no statuses). */
  inherent: number;
  inherentLabel: string;
  components: ComponentScore[];
  breakdown: {
    /** Reachability/asset-weighted mean component residual risk, 0–1. */
    weightedMeanResidual: number;
    /** Highest attack-path residual, 0–25. */
    topPathResidual: number;
    topPathId?: string;
    componentWeight: number;
    pathWeight: number;
    /** Contribution of each term to `overall` (they sum to it, ±1 rounding). */
    componentTerm: number;
    pathTerm: number;
  };
}

/** Weight of the component term vs the attack-path term. */
export const COMPONENT_WEIGHT = 0.65;
export const PATH_WEIGHT = 0.35;
/**
 * Scale of the component risk curve: risk = 1 − e^(−decayedSum / K). It never
 * saturates, so closing any open threat lowers the score (a hard cap at 1
 * hid mitigations on busy components).
 */
export const COMPONENT_RISK_SCALE = 20;

export function reachWeight(hops: number | null): number {
  if (hops === null) return 0.4;
  if (hops <= 1) return 1;
  if (hops === 2) return 0.85;
  return 0.7;
}

/** Decayed sum: the worst threat counts fully, each next one half as much. */
function componentRisk(scores: number[]): number {
  const sorted = [...scores].sort((a, b) => b - a);
  let sum = 0;
  for (let i = 0; i < sorted.length; i++) sum += sorted[i] * Math.pow(0.5, i);
  return 1 - Math.exp(-sum / COMPONENT_RISK_SCALE);
}

const isSystem = (n: NodeInfo) => !n.isActor && !n.isExternal && !n.isControl;

/** Node a threat is attributed to for the model score. */
export function attributedNode(graph: ModelGraph, t: GeneratedThreat): string | undefined {
  const focus = t.focusNodeId ? graph.nodeById.get(t.focusNodeId) : undefined;
  if (focus && isSystem(focus)) return focus.id;
  for (const id of t.affectedNodeIds) {
    const n = graph.nodeById.get(id);
    if (n && isSystem(n)) return n.id;
  }
  return undefined;
}

/**
 * Model score (§7.2.2): residual threat risk per system component, weighted
 * by reachability from entry points and asset value, blended with the worst
 * attack path. Adding a gate, implementing a mitigation or marking a threat
 * mitigated lowers it; nothing is counted twice.
 */
export function computeModelScore(
  graph: ModelGraph,
  threats: GeneratedThreat[],
  paths: AttackPath[],
): ModelScore {
  const reach = reachFrom(graph, graph.entries);
  const byNode = new Map<string, GeneratedThreat[]>();
  for (const t of threats) {
    const id = attributedNode(graph, t);
    if (!id) continue;
    if (!byNode.has(id)) byNode.set(id, []);
    byNode.get(id)!.push(t);
  }

  const components: ComponentScore[] = [];
  let wSum = 0;
  let rSum = 0;
  let iSum = 0;
  for (const n of graph.nodes) {
    if (!isSystem(n)) continue;
    const ts = byNode.get(n.id) ?? [];
    const hops = reach.has(n.id) ? reach.get(n.id)!.hops : null;
    const rw = reachWeight(hops);
    const aw = 1 + (n.isSensitive ? 0.5 : 0) + (n.isPrivileged ? 0.5 : 0);
    const w = rw * aw;
    const residual = componentRisk(ts.map((t) => t.residualScore ?? t.score ?? 0));
    const inherent = componentRisk(ts.map((t) => t.score ?? 0));
    wSum += w;
    rSum += w * residual;
    iSum += w * inherent;
    components.push({
      nodeId: n.id,
      label: n.label,
      residual: Math.round(residual * 100),
      inherent: Math.round(inherent * 100),
      weight: Math.round(w * 100) / 100,
      reachWeight: rw,
      assetWeight: aw,
      hops,
      threatCount: ts.length,
      openCount: ts.filter(
        (t) => (t.residualScore ?? t.score ?? 0) > 0 && t.mitigationState !== "mitigated",
      ).length,
      topThreatIds: [...ts]
        .sort((a, b) => (b.residualScore ?? 0) - (a.residualScore ?? 0) || (a.id < b.id ? -1 : 1))
        .slice(0, 3)
        .map((t) => t.id),
    });
  }
  components.sort(
    (a, b) => b.residual * b.weight - a.residual * a.weight || (a.nodeId < b.nodeId ? -1 : 1),
  );

  const meanResidual = wSum ? rSum / wSum : 0;
  const meanInherent = wSum ? iSum / wSum : 0;
  const topPath = [...paths].sort(
    (a, b) => b.residualScore - a.residualScore || (a.id < b.id ? -1 : 1),
  )[0];
  const topInherentPath = paths.reduce((m, p) => Math.max(m, p.score), 0);
  const topPathResidual = topPath?.residualScore ?? 0;
  const componentTerm = 100 * COMPONENT_WEIGHT * meanResidual;
  const pathTerm = 100 * PATH_WEIGHT * (topPathResidual / 25);
  const overall = Math.round(componentTerm + pathTerm);
  const inherent = Math.round(
    100 * (COMPONENT_WEIGHT * meanInherent + PATH_WEIGHT * (topInherentPath / 25)),
  );
  return {
    overall,
    label: riskLabel(overall),
    inherent,
    inherentLabel: riskLabel(inherent),
    components,
    breakdown: {
      weightedMeanResidual: Math.round(meanResidual * 1000) / 1000,
      topPathResidual,
      topPathId: topPath?.id,
      componentWeight: COMPONENT_WEIGHT,
      pathWeight: PATH_WEIGHT,
      componentTerm: Math.round(componentTerm * 10) / 10,
      pathTerm: Math.round(pathTerm * 10) / 10,
    },
  };
}

/** Legacy ReportDashboard / export shape. */
export function toRiskSummary(
  score: ModelScore,
  threats: GeneratedThreat[],
  surface: AttackSurfaceScore[],
  graph: ModelGraph,
): ModelRiskSummary {
  const surfaceById = new Map(surface.map((s) => [s.nodeId, s.score]));
  const byNode = new Map<string, GeneratedThreat[]>();
  for (const t of threats) {
    const id = attributedNode(graph, t);
    if (!id) continue;
    if (!byNode.has(id)) byNode.set(id, []);
    byNode.get(id)!.push(t);
  }
  const open = threats.filter(
    (t) => t.mitigationState !== "mitigated" && (t.residualScore ?? 1) > 0,
  );
  return {
    overallScore: score.overall,
    severityLabel: score.label,
    componentScores: score.components.map((c) => {
      const ts = byNode.get(c.nodeId) ?? [];
      return {
        nodeId: c.nodeId,
        label: c.label,
        inherentRisk: c.inherent,
        mitigatedRisk: Math.max(0, c.inherent - c.residual),
        residualRisk: c.residual,
        attackSurface: surfaceById.get(c.nodeId) ?? 0,
        threatCount: ts.length,
        criticalCount: ts.filter((t) => t.severity === "critical").length,
        highCount: ts.filter((t) => t.severity === "high").length,
      };
    }),
    riskDistribution: {
      critical: open.filter((t) => t.severity === "critical").length,
      high: open.filter((t) => t.severity === "high").length,
      medium: open.filter((t) => t.severity === "medium").length,
      low: open.filter((t) => t.severity === "low").length,
    },
    topRisks: score.components
      .filter((c) => c.residual > 0)
      .slice(0, 5)
      .map((c) => ({ name: c.label, score: c.residual, nodeId: c.nodeId })),
  };
}

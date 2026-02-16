import type {
  CanvasNode,
  CanvasEdge,
  GeneratedThreat,
  ThreatAnalysisResult,
  MethodologyMode,
  MaestroLayer,
} from "../types";
import { buildNodeProfiles, type NodeRiskProfile } from "./nodeProfile";
import { runMaestroAnalysis } from "./maestroRules";
import { runConnectionAnalysis } from "./connectionRules";
import { runTopologyAnalysis } from "./topologyRules";
import { runInheritedThreatPropagation } from "./inheritedThreats";

export { buildNodeProfiles, type NodeRiskProfile };

export function runThreatAnalysis(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  _methodology: MethodologyMode,
  customComponentThreats?: GeneratedThreat[],
): ThreatAnalysisResult {
  const profiles = buildNodeProfiles(nodes);
  const allThreats: GeneratedThreat[] = [];

  allThreats.push(...runMaestroAnalysis(nodes, edges, profiles));

  allThreats.push(...runConnectionAnalysis(nodes, edges, profiles));
  allThreats.push(...runTopologyAnalysis(nodes, edges, profiles));

  if (customComponentThreats) {
    allThreats.push(...customComponentThreats);
  }

  const inherited = runInheritedThreatPropagation(nodes, edges, allThreats);
  allThreats.push(...inherited);

  const deduped = deduplicateThreats(allThreats);

  return {
    threats: deduped,
    summary: computeSummary(deduped),
  };
}

function deduplicateThreats(threats: GeneratedThreat[]): GeneratedThreat[] {
  const seen = new Map<string, GeneratedThreat>();
  for (const threat of threats) {
    const key = `${threat.name}__${threat.affectedNodeIds.sort().join(",")}__${threat.inherited}`;
    if (!seen.has(key)) {
      seen.set(key, threat);
    }
  }
  return Array.from(seen.values());
}

function computeSummary(threats: GeneratedThreat[]): ThreatAnalysisResult["summary"] {
  const byMethodology: Record<string, number> = {};
  const byLayer: Partial<Record<MaestroLayer, number>> = {};

  for (const t of threats) {
    byMethodology[t.methodology] = (byMethodology[t.methodology] ?? 0) + 1;
    if (t.maestroLayer !== undefined) {
      byLayer[t.maestroLayer] = (byLayer[t.maestroLayer] ?? 0) + 1;
    }
  }

  return {
    total: threats.length,
    critical: threats.filter((t) => t.severity === "critical").length,
    high: threats.filter((t) => t.severity === "high").length,
    medium: threats.filter((t) => t.severity === "medium").length,
    low: threats.filter((t) => t.severity === "low").length,
    inherited: threats.filter((t) => t.inherited).length,
    mitigated: 0,
    byMethodology,
    byLayer,
  };
}

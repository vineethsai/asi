import type {
  CanvasEdge,
  CanvasNode,
  CustomComponentDefinition,
  MethodologyMode,
  ThreatAnalysisResult,
} from "../types";
import { analyzeThreatModel } from "./analyze";
import { buildNodeProfiles, type NodeRiskProfile } from "./nodeProfile";

export { buildNodeProfiles, type NodeRiskProfile };

/**
 * Legacy entry point kept for callers that only need threats + summary.
 * Prefer `analyzeThreatModel` (engine/analyze.ts) or the worker wrapper
 * `runAnalysis` (engine/runAnalysis.ts), which return the full result.
 */
export function runThreatAnalysis(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  _methodology: MethodologyMode = "maestro",
  customComponents?: CustomComponentDefinition[],
): ThreatAnalysisResult {
  const r = analyzeThreatModel({ nodes, edges, customComponents });
  return { threats: r.threats, summary: r.summary };
}

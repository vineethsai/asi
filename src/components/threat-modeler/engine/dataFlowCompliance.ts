import type { CanvasEdge, CanvasNode } from "../types";
import { buildGraph } from "./graph";
import { dataFlowViolations } from "./compliance";

export interface ComplianceViolation {
  id: string;
  name: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  affectedEdgeIds: string[];
  affectedNodeIds: string[];
  rule: string;
}

/** Data-flow compliance violations for a raw model (wrapper over engine/compliance.ts). */
export function runDataFlowComplianceCheck(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
): ComplianceViolation[] {
  return dataFlowViolations(buildGraph(nodes, edges));
}

import type { CanvasNode, CanvasEdge, GeneratedThreat } from "../types";

export function runTopologyAnalysis(nodes: CanvasNode[], edges: CanvasEdge[]): GeneratedThreat[] {
  const threats: GeneratedThreat[] = [];
  threats.push(...checkUnboundedComponents(nodes));
  threats.push(...checkExcessiveAgency(nodes, edges));
  threats.push(...checkMissingHITL(nodes, edges));
  threats.push(...checkSinglePointsOfFailure(nodes, edges));
  threats.push(...checkMissingObservability(nodes));
  return threats;
}

function checkUnboundedComponents(nodes: CanvasNode[]): GeneratedThreat[] {
  const threats: GeneratedThreat[] = [];
  const boundaryNodeIds = new Set<string>();
  for (const node of nodes) {
    if (node.parentId) {
      const parent = nodes.find((n) => n.id === node.parentId);
      if (parent?.type === "trustBoundary") boundaryNodeIds.add(node.id);
    }
  }
  for (const node of nodes) {
    if (!node.data || node.type === "trustBoundary") continue;
    if (!boundaryNodeIds.has(node.id)) {
      threats.push({
        id: `topo-unbounded-${node.id}`,
        name: "Component Outside Trust Boundary",
        description: `"${node.data.label}" is not contained within any trust boundary, increasing exposure to attacks.`,
        severity: "medium",
        methodology: "topology",
        affectedNodeIds: [node.id],
        affectedEdgeIds: [],
        inherited: false,
        mitigations: [
          "Place component within an appropriate trust boundary",
          "Define explicit trust relationships",
        ],
      });
    }
  }
  return threats;
}

function checkExcessiveAgency(nodes: CanvasNode[], edges: CanvasEdge[]): GeneratedThreat[] {
  const threats: GeneratedThreat[] = [];
  const outgoingToolConnections = new Map<string, string[]>();
  for (const edge of edges) {
    const target = nodes.find((n) => n.id === edge.target);
    if (
      target?.data?.category === "kc5" ||
      target?.data?.category === "kc6" ||
      target?.data?.category === "external"
    ) {
      if (!outgoingToolConnections.has(edge.source)) outgoingToolConnections.set(edge.source, []);
      outgoingToolConnections.get(edge.source)!.push(edge.target);
    }
  }
  for (const [nodeId, targets] of outgoingToolConnections) {
    if (targets.length >= 3) {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node?.data || node.type === "trustBoundary") continue;
      threats.push({
        id: `topo-excessive-agency-${nodeId}`,
        name: "Excessive Agency",
        description: `"${node.data.label}" has access to ${targets.length} tools/external systems. Consider restricting capabilities.`,
        severity: "high",
        methodology: "topology",
        affectedNodeIds: [nodeId, ...targets],
        affectedEdgeIds: [],
        inherited: false,
        mitigations: [
          "Apply least-privilege principle",
          "Limit tool access per agent",
          "Require approval for sensitive tool calls",
        ],
      });
    }
  }
  return threats;
}

function checkMissingHITL(nodes: CanvasNode[], edges: CanvasEdge[]): GeneratedThreat[] {
  const threats: GeneratedThreat[] = [];
  const hasActor = nodes.some((n) => n.data?.category === "actor");
  const highPrivilegeNodes = nodes.filter(
    (n) =>
      n.data?.category === "kc6" || (n.data?.category === "kc5" && n.data.trustLevel !== "trusted"),
  );
  for (const hpNode of highPrivilegeNodes) {
    const hasDirectActorConnection = edges.some(
      (e) =>
        (e.target === hpNode.id || e.source === hpNode.id) &&
        nodes.find((n) => n.id === (e.target === hpNode.id ? e.source : e.target))?.data
          ?.category === "actor",
    );
    if (!hasDirectActorConnection && !hasActor) {
      threats.push({
        id: `topo-no-hitl-${hpNode.id}`,
        name: "Missing Human-in-the-Loop",
        description: `"${hpNode.data?.label}" performs privileged operations without human oversight.`,
        severity: "high",
        methodology: "topology",
        affectedNodeIds: [hpNode.id],
        affectedEdgeIds: [],
        inherited: false,
        mitigations: [
          "Add human approval step for sensitive operations",
          "Implement HITL approval workflow",
          "Add confirmation prompts for destructive actions",
        ],
      });
    }
  }
  return threats;
}

function checkSinglePointsOfFailure(nodes: CanvasNode[], edges: CanvasEdge[]): GeneratedThreat[] {
  const threats: GeneratedThreat[] = [];
  const connectionCount = new Map<string, number>();
  for (const edge of edges) {
    connectionCount.set(edge.source, (connectionCount.get(edge.source) ?? 0) + 1);
    connectionCount.set(edge.target, (connectionCount.get(edge.target) ?? 0) + 1);
  }
  const totalNodes = nodes.filter((n) => n.type !== "trustBoundary").length;
  for (const [nodeId, count] of connectionCount) {
    if (totalNodes >= 4 && count >= totalNodes - 1) {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node?.data || node.type === "trustBoundary") continue;
      threats.push({
        id: `topo-spof-${nodeId}`,
        name: "Single Point of Failure",
        description: `"${node.data.label}" is connected to almost every component. Its compromise would affect the entire system.`,
        severity: "high",
        methodology: "topology",
        affectedNodeIds: [nodeId],
        affectedEdgeIds: [],
        inherited: false,
        mitigations: [
          "Add redundancy for critical components",
          "Implement circuit breakers",
          "Consider decomposing into smaller components",
        ],
      });
    }
  }
  return threats;
}

function checkMissingObservability(nodes: CanvasNode[]): GeneratedThreat[] {
  const threats: GeneratedThreat[] = [];
  const hasObservabilityNode = nodes.some(
    (n) =>
      n.data?.maestroLayers?.includes(5) ||
      n.data?.label?.toLowerCase().includes("monitor") ||
      n.data?.label?.toLowerCase().includes("observ") ||
      n.data?.label?.toLowerCase().includes("logging"),
  );
  if (!hasObservabilityNode && nodes.filter((n) => n.type !== "trustBoundary").length >= 3) {
    threats.push({
      id: "topo-no-observability",
      name: "Missing Observability Layer",
      description:
        "No observability or monitoring component detected (MAESTRO Layer 5). Agent actions may go undetected.",
      severity: "medium",
      methodology: "topology",
      affectedNodeIds: nodes.filter((n) => n.type !== "trustBoundary").map((n) => n.id),
      affectedEdgeIds: [],
      inherited: false,
      mitigations: [
        "Add monitoring/observability component",
        "Implement comprehensive audit logging",
        "Set up anomaly detection",
      ],
    });
  }
  return threats;
}

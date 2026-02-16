import type { CanvasNode, CanvasEdge, GeneratedThreat } from "../types";

const SEVERITY_ORDER: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };

function degradeSeverity(
  severity: "critical" | "high" | "medium" | "low",
  hops: number,
): "critical" | "high" | "medium" | "low" {
  const order = SEVERITY_ORDER[severity] ?? 2;
  const degraded = Math.max(1, order - Math.floor(hops / 2));
  const map: Record<number, "critical" | "high" | "medium" | "low"> = {
    4: "critical",
    3: "high",
    2: "medium",
    1: "low",
  };
  return map[degraded] ?? "low";
}

export function runInheritedThreatPropagation(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  directThreats: GeneratedThreat[],
): GeneratedThreat[] {
  const inherited: GeneratedThreat[] = [];
  const adjacencyForward = new Map<string, { target: string; edgeId: string }[]>();
  for (const edge of edges) {
    if (!adjacencyForward.has(edge.source)) adjacencyForward.set(edge.source, []);
    adjacencyForward.get(edge.source)!.push({ target: edge.target, edgeId: edge.id! });
  }
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const threatsByNode = new Map<string, GeneratedThreat[]>();
  for (const threat of directThreats) {
    for (const nodeId of threat.affectedNodeIds) {
      if (!threatsByNode.has(nodeId)) threatsByNode.set(nodeId, []);
      threatsByNode.get(nodeId)!.push(threat);
    }
  }
  const seenPropagations = new Set<string>();
  for (const [sourceNodeId, sourceThreats] of threatsByNode) {
    for (const threat of sourceThreats) {
      if (threat.inherited) continue;
      const visited = new Set<string>();
      const queue: { nodeId: string; path: string[]; depth: number }[] = [];
      const neighbors = adjacencyForward.get(sourceNodeId) ?? [];
      for (const n of neighbors) {
        queue.push({ nodeId: n.target, path: [sourceNodeId, n.target], depth: 1 });
      }
      while (queue.length > 0) {
        const { nodeId, path, depth } = queue.shift()!;
        if (depth > 4) continue;
        if (visited.has(nodeId)) continue;
        visited.add(nodeId);
        const propagationKey = `${threat.id}__inherited__${nodeId}`;
        if (seenPropagations.has(propagationKey)) continue;
        seenPropagations.add(propagationKey);
        const targetNode = nodeMap.get(nodeId);
        if (!targetNode?.data) continue;
        const crossesBoundary = checkCrossesTrustBoundary(sourceNodeId, nodeId, nodes);
        inherited.push({
          id: propagationKey,
          threatId: threat.threatId,
          name: `[Inherited] ${threat.name}`,
          description: `Propagated from "${nodeMap.get(sourceNodeId)?.data?.label ?? sourceNodeId}": ${threat.description}`,
          severity: crossesBoundary ? threat.severity : degradeSeverity(threat.severity, depth),
          methodology: threat.methodology,
          maestroLayer: threat.maestroLayer,
          affectedNodeIds: [nodeId],
          affectedEdgeIds: [],
          inherited: true,
          propagationPath: path,
          sourceNodeId: sourceNodeId,
          mitigations: [
            ...threat.mitigations,
            "Validate inputs from upstream components",
            "Implement trust boundary controls",
          ],
        });
        const next = adjacencyForward.get(nodeId) ?? [];
        for (const n of next) {
          if (!visited.has(n.target)) {
            queue.push({ nodeId: n.target, path: [...path, n.target], depth: depth + 1 });
          }
        }
      }
    }
  }
  return inherited;
}

function checkCrossesTrustBoundary(
  sourceId: string,
  targetId: string,
  nodes: CanvasNode[],
): boolean {
  const sourceNode = nodes.find((n) => n.id === sourceId);
  const targetNode = nodes.find((n) => n.id === targetId);
  const sourceParent = sourceNode?.parentId;
  const targetParent = targetNode?.parentId;
  if (!sourceParent && !targetParent) return false;
  if (!sourceParent || !targetParent) return true;
  return sourceParent !== targetParent;
}

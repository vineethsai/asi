import { type CanvasNode, type CanvasEdge, type GeneratedThreat } from "../types";
import { MAESTRO_THREAT_CATALOG, MAESTRO_CROSS_LAYER_THREATS } from "./maestroData";

export function runMaestroAnalysis(nodes: CanvasNode[], edges: CanvasEdge[]): GeneratedThreat[] {
  const threats: GeneratedThreat[] = [];
  threats.push(...analyzeLayerThreats(nodes));
  threats.push(...analyzeCrossLayerThreats(nodes, edges));
  return threats;
}

function analyzeLayerThreats(nodes: CanvasNode[]): GeneratedThreat[] {
  const threats: GeneratedThreat[] = [];
  for (const node of nodes) {
    if (!node.data || node.type === "trustBoundary") continue;
    if (node.data.category === "actor" || node.data.category === "external") continue;
    const layers = node.data.maestroLayers ?? [];
    for (const layer of layers) {
      const layerThreats = MAESTRO_THREAT_CATALOG.filter((t) => t.layer === layer);
      for (const lt of layerThreats) {
        threats.push({
          id: `${lt.id}__${node.id}`,
          threatId: lt.id,
          name: lt.name,
          description: lt.description,
          severity: lt.severity,
          methodology: "MAESTRO",
          maestroLayer: lt.layer,
          affectedNodeIds: [node.id],
          affectedEdgeIds: [],
          inherited: false,
          mitigations: lt.mitigations,
        });
      }
    }
  }
  return threats;
}

function analyzeCrossLayerThreats(nodes: CanvasNode[], edges: CanvasEdge[]): GeneratedThreat[] {
  const threats: GeneratedThreat[] = [];
  const adjacencyMap = new Map<string, Set<string>>();
  for (const edge of edges) {
    if (!adjacencyMap.has(edge.source)) adjacencyMap.set(edge.source, new Set());
    if (!adjacencyMap.has(edge.target)) adjacencyMap.set(edge.target, new Set());
    adjacencyMap.get(edge.source)!.add(edge.target);
    adjacencyMap.get(edge.target)!.add(edge.source);
  }
  const _nodeMap = new Map(nodes.map((n) => [n.id, n]));
  for (const crossThreat of MAESTRO_CROSS_LAYER_THREATS) {
    const fromNodes = nodes.filter((n) => n.data?.maestroLayers?.includes(crossThreat.fromLayer));
    const toNodes = nodes.filter((n) => n.data?.maestroLayers?.includes(crossThreat.toLayer));
    for (const fromNode of fromNodes) {
      for (const toNode of toNodes) {
        if (fromNode.id === toNode.id) continue;
        if (isConnected(fromNode.id, toNode.id, adjacencyMap, 4)) {
          threats.push({
            id: `${crossThreat.id}__${fromNode.id}__${toNode.id}`,
            name: crossThreat.name,
            description: crossThreat.description,
            severity: crossThreat.severity,
            methodology: "MAESTRO",
            maestroLayer: crossThreat.fromLayer,
            affectedNodeIds: [fromNode.id, toNode.id],
            affectedEdgeIds: [],
            inherited: false,
            mitigations: [
              "Implement cross-layer security controls",
              "Network segmentation",
              "Defense-in-depth",
            ],
            crossLayerChain: [
              {
                fromLayer: crossThreat.fromLayer,
                toLayer: crossThreat.toLayer,
                description: crossThreat.description,
              },
            ],
          });
        }
      }
    }
  }
  return threats;
}

function isConnected(
  startId: string,
  targetId: string,
  adjacency: Map<string, Set<string>>,
  maxDepth: number,
): boolean {
  const visited = new Set<string>();
  const queue: { id: string; depth: number }[] = [{ id: startId, depth: 0 }];
  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    if (id === targetId) return true;
    if (depth >= maxDepth) continue;
    if (visited.has(id)) continue;
    visited.add(id);
    const neighbors = adjacency.get(id);
    if (neighbors) {
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) queue.push({ id: neighbor, depth: depth + 1 });
      }
    }
  }
  return false;
}

import { type CanvasNode, type CanvasEdge, type GeneratedThreat, MaestroLayer } from "../types";
import type { NodeRiskProfile } from "./nodeProfile";
import { MAESTRO_THREAT_CATALOG, MAESTRO_CROSS_LAYER_THREATS } from "./maestroData";

export function runMaestroAnalysis(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  profiles?: Map<string, NodeRiskProfile>,
): GeneratedThreat[] {
  const threats: GeneratedThreat[] = [];
  threats.push(...analyzeLayerThreats(nodes, profiles));
  threats.push(...analyzeCrossLayerThreats(nodes, edges));
  if (profiles) threats.push(...analyzeFunctionCallSurface(nodes, profiles));
  return threats;
}

function escalateSeverity(
  severity: "critical" | "high" | "medium" | "low",
): "critical" | "high" | "medium" | "low" {
  if (severity === "medium") return "high";
  if (severity === "high") return "critical";
  return severity;
}

function analyzeLayerThreats(
  nodes: CanvasNode[],
  profiles?: Map<string, NodeRiskProfile>,
): GeneratedThreat[] {
  const threats: GeneratedThreat[] = [];
  for (const node of nodes) {
    if (!node.data || node.type === "trustBoundary") continue;
    if (node.data.category === "actor" || node.data.category === "external") continue;
    const layers = node.data.maestroLayers ?? [];
    const profile = profiles?.get(node.id);
    for (const layer of layers) {
      const layerThreats = MAESTRO_THREAT_CATALOG.filter((t) => t.layer === layer);
      for (const lt of layerThreats) {
        const shouldEscalate = profile && profile.inherentRiskMultiplier >= 2.0;
        threats.push({
          id: `${lt.id}__${node.id}`,
          threatId: lt.id,
          name: lt.name,
          description: shouldEscalate
            ? `${lt.description} [Elevated: high-risk component (${profile.accessDanger})]`
            : lt.description,
          severity: shouldEscalate ? escalateSeverity(lt.severity) : lt.severity,
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

function analyzeFunctionCallSurface(
  nodes: CanvasNode[],
  profiles: Map<string, NodeRiskProfile>,
): GeneratedThreat[] {
  const threats: GeneratedThreat[] = [];
  for (const node of nodes) {
    const profile = profiles.get(node.id);
    if (!profile || !profile.functionCallSurface) continue;
    threats.push({
      id: `maestro-fn-call-exploit__${node.id}`,
      name: "Function Call Schema Exploitation",
      description: `"${profile.label}" defines a function call schema. An attacker could craft inputs that manipulate the schema to invoke unintended functions or pass malicious arguments.`,
      severity: "high",
      methodology: "MAESTRO",
      maestroLayer: MaestroLayer.AgentFrameworks,
      affectedNodeIds: [node.id],
      affectedEdgeIds: [],
      inherited: false,
      mitigations: [
        "Validate all function call parameters against strict JSON schemas",
        "Whitelist allowed function names",
        "Implement function call rate limiting",
        "Log and audit all function call invocations",
      ],
    });
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

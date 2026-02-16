import type { CanvasNode, CanvasEdge, GeneratedThreat } from "../types";
import type { NodeRiskProfile } from "./nodeProfile";

export interface AttackPath {
  id: string;
  name: string;
  description: string;
  nodes: string[];
  edges: string[];
  severity: "critical" | "high" | "medium" | "low";
  score: number;
  threats: string[];
  entryPoint: string;
  target: string;
}

export function findAttackPaths(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  threats: GeneratedThreat[],
  profiles?: Map<string, NodeRiskProfile>,
): AttackPath[] {
  const paths: AttackPath[] = [];
  const adjacency = new Map<string, { target: string; edgeId: string }[]>();
  for (const edge of edges) {
    if (!adjacency.has(edge.source)) adjacency.set(edge.source, []);
    adjacency.get(edge.source)!.push({ target: edge.target, edgeId: edge.id! });
  }

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const entryPoints = nodes.filter((n) => {
    if (
      n.data?.category === "actor" ||
      n.data?.category === "external" ||
      n.data?.trustLevel === "untrusted"
    )
      return true;
    const profile = profiles?.get(n.id);
    if (profile?.isExternallyFacing) return true;
    return false;
  });
  const highValueTargets = nodes.filter((n) => {
    if (
      n.data?.category === "kc4" ||
      n.data?.category === "kc6" ||
      n.data?.category === "datastore"
    )
      return true;
    const profile = profiles?.get(n.id);
    if (profile?.handlesCredentials || profile?.handlesRegulatedData) return true;
    if (profile?.isExecutionCapable) return true;
    return false;
  });

  for (const entry of entryPoints) {
    for (const target of highValueTargets) {
      if (entry.id === target.id) continue;
      const foundPaths = bfsPaths(entry.id, target.id, adjacency, 6);
      for (const path of foundPaths) {
        const pathEdges: string[] = [];
        for (let i = 0; i < path.length - 1; i++) {
          const neighbors = adjacency.get(path[i]) ?? [];
          const edge = neighbors.find((n) => n.target === path[i + 1]);
          if (edge) pathEdges.push(edge.edgeId);
        }

        const pathThreats = threats.filter(
          (t) =>
            t.affectedNodeIds.some((nid) => path.includes(nid)) ||
            t.affectedEdgeIds.some((eid) => pathEdges.includes(eid)),
        );

        if (pathThreats.length === 0) continue;

        const severityScores = { critical: 10, high: 7, medium: 4, low: 1 };
        const maxProfileMultiplier = profiles
          ? Math.max(...path.map((nid) => profiles.get(nid)?.inherentRiskMultiplier ?? 1.0))
          : 1.0;
        const rawScore = pathThreats.reduce((sum, t) => sum + (severityScores[t.severity] ?? 0), 0);
        const score = Math.round(rawScore * maxProfileMultiplier);
        const maxSeverity = pathThreats.reduce(
          (max, t) => {
            const order = { critical: 4, high: 3, medium: 2, low: 1 };
            return (order[t.severity] ?? 0) > (order[max] ?? 0) ? t.severity : max;
          },
          "low" as "critical" | "high" | "medium" | "low",
        );

        const entryLabel = nodeMap.get(entry.id)?.data?.label ?? entry.id;
        const targetLabel = nodeMap.get(target.id)?.data?.label ?? target.id;

        paths.push({
          id: `path-${entry.id}-${target.id}-${paths.length}`,
          name: `${entryLabel} -> ${targetLabel}`,
          description: `Attack path from ${entryLabel} to ${targetLabel} via ${path.length - 2} intermediate nodes`,
          nodes: path,
          edges: pathEdges,
          severity: maxSeverity,
          score,
          threats: pathThreats.map((t) => t.id),
          entryPoint: entry.id,
          target: target.id,
        });
      }
    }
  }

  return paths.sort((a, b) => b.score - a.score).slice(0, 20);
}

function bfsPaths(
  start: string,
  end: string,
  adjacency: Map<string, { target: string; edgeId: string }[]>,
  maxDepth: number,
): string[][] {
  const results: string[][] = [];
  const queue: { nodeId: string; path: string[] }[] = [{ nodeId: start, path: [start] }];

  while (queue.length > 0 && results.length < 5) {
    const { nodeId, path } = queue.shift()!;
    if (path.length > maxDepth) continue;
    if (nodeId === end) {
      results.push(path);
      continue;
    }
    const neighbors = adjacency.get(nodeId) ?? [];
    for (const n of neighbors) {
      if (!path.includes(n.target)) {
        queue.push({ nodeId: n.target, path: [...path, n.target] });
      }
    }
  }

  return results;
}

import type { CanvasEdge, CanvasNode, GeneratedThreat } from "../types";
import { buildGraph } from "./graph";
import { findAttackPaths as findPaths } from "./paths";

export type { AttackPath, AttackPathHop, AttackPathResult } from "./paths";

/** Legacy signature: top attack paths for a raw model (see engine/paths.ts). */
export function findAttackPaths(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  threats: GeneratedThreat[] = [],
) {
  return findPaths(buildGraph(nodes, edges), threats).paths;
}

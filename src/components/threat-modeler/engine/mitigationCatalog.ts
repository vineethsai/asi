import type { GeneratedThreat } from "../types";
import { getMitigation, resolveMitigationId } from "./catalog/mitigations";

export interface MitigationItem {
  /** Mitigation catalog id (MIT-…); stored on the node as the mitigationStatuses key. */
  id: string;
  name: string;
  /** Lifecycle phase (design / build / operate). */
  category: string;
  threatsAddressed: string[];
  description?: string;
  effectiveness?: number;
  /** securityData control id (m1…m20) for the control page link. */
  controlId?: string;
}

export interface NodeMitigationCatalog {
  nodeId: string;
  nodeLabel: string;
  mitigations: MitigationItem[];
  totalThreats: number;
}

/** Catalog mitigations that address the threats on a node, joined by id (no name matching). */
export function buildNodeMitigationCatalog(
  nodeId: string,
  nodeLabel: string,
  threats: GeneratedThreat[],
): NodeMitigationCatalog {
  const nodeThreats = threats.filter((t) => t.affectedNodeIds.includes(nodeId));
  const byId = new Map<string, Set<string>>();
  for (const t of nodeThreats) {
    const ids = t.mitigationIds?.length
      ? t.mitigationIds
      : (t.mitigations.map((m) => resolveMitigationId(m)).filter(Boolean) as string[]);
    for (const id of ids) {
      if (!byId.has(id)) byId.set(id, new Set());
      byId.get(id)!.add(t.id);
    }
  }
  const mitigations: MitigationItem[] = [...byId.entries()]
    .map(([id, set]) => {
      const m = getMitigation(id);
      return {
        id,
        name: m?.name ?? id,
        category: m?.phase ?? "design",
        threatsAddressed: [...set].sort(),
        description: m?.description,
        effectiveness: m?.effectiveness,
        controlId: m?.controlId,
      };
    })
    .sort(
      (a, b) => b.threatsAddressed.length - a.threatsAddressed.length || (a.id < b.id ? -1 : 1),
    );
  return { nodeId, nodeLabel, mitigations, totalThreats: nodeThreats.length };
}

/**
 * True when the threat counts as mitigated: its residual state is
 * "mitigated" (implemented mitigations ≥ the coverage threshold) or its
 * status is mitigated / false-positive. Computed by the engine.
 */
export function isThreatMitigated(threat: GeneratedThreat): boolean {
  return (
    threat.mitigationState === "mitigated" ||
    threat.status === "mitigated" ||
    threat.status === "false-positive"
  );
}

export function filterMitigatedThreats(threats: GeneratedThreat[]): {
  active: GeneratedThreat[];
  mitigated: GeneratedThreat[];
} {
  const active: GeneratedThreat[] = [];
  const mitigated: GeneratedThreat[] = [];
  for (const t of threats) (isThreatMitigated(t) ? mitigated : active).push(t);
  return { active, mitigated };
}

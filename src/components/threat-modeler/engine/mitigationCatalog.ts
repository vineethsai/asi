import type { GeneratedThreat } from "../types";

export interface MitigationItem {
  id: string;
  name: string;
  category: string;
  threatsAddressed: string[];
}

export interface NodeMitigationCatalog {
  nodeId: string;
  nodeLabel: string;
  mitigations: MitigationItem[];
  totalThreats: number;
}

export function buildNodeMitigationCatalog(
  nodeId: string,
  nodeLabel: string,
  threats: GeneratedThreat[],
): NodeMitigationCatalog {
  const nodeThreats = threats.filter((t) => t.affectedNodeIds.includes(nodeId));

  const mitigationMap = new Map<string, { category: string; threatIds: Set<string> }>();

  for (const threat of nodeThreats) {
    const category = threat.methodology;
    for (const mitigation of threat.mitigations) {
      const key = mitigation.toLowerCase().trim();
      if (!mitigationMap.has(key)) {
        mitigationMap.set(key, { category: String(category), threatIds: new Set() });
      }
      mitigationMap.get(key)!.threatIds.add(threat.id);
    }
  }

  const mitigations: MitigationItem[] = Array.from(mitigationMap.entries())
    .map(([key, value]) => ({
      id: key,
      name: key.charAt(0).toUpperCase() + key.slice(1),
      category: value.category,
      threatsAddressed: Array.from(value.threatIds),
    }))
    .sort((a, b) => b.threatsAddressed.length - a.threatsAddressed.length);

  return {
    nodeId,
    nodeLabel,
    mitigations,
    totalThreats: nodeThreats.length,
  };
}

export function isThreatMitigated(
  threat: GeneratedThreat,
  appliedMitigationsByNode: Map<string, Set<string>>,
): boolean {
  if (threat.mitigations.length === 0) return false;

  for (const nodeId of threat.affectedNodeIds) {
    const applied = appliedMitigationsByNode.get(nodeId);
    if (!applied) continue;
    const matched = threat.mitigations.filter((m) => applied.has(m.toLowerCase().trim()));
    if (matched.length > 0) return true;
  }

  return false;
}

export function filterMitigatedThreats(
  threats: GeneratedThreat[],
  appliedMitigationsByNode: Map<string, Set<string>>,
): { active: GeneratedThreat[]; mitigated: GeneratedThreat[] } {
  const active: GeneratedThreat[] = [];
  const mitigated: GeneratedThreat[] = [];

  for (const threat of threats) {
    if (isThreatMitigated(threat, appliedMitigationsByNode)) {
      mitigated.push(threat);
    } else {
      active.push(threat);
    }
  }

  return { active, mitigated };
}

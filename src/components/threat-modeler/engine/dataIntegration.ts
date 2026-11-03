import { mitigationsData } from "@/components/components/securityData";
import type { GeneratedThreat } from "../types";
import { getMitigation } from "./catalog/mitigations";

/**
 * Site control pages behind a threat's catalog mitigations, joined by id
 * (catalog mitigation → `controlId` → securityData `mitigationsData`).
 * Replaces the v1 name-substring join (§7.2.4).
 */
export function controlsForThreat(threat: GeneratedThreat): { id: string; name: string }[] {
  const out = new Map<string, string>();
  for (const id of threat.mitigationIds ?? []) {
    const controlId = getMitigation(id)?.controlId;
    if (!controlId || out.has(controlId)) continue;
    const name = (mitigationsData as Record<string, { name?: string }>)[controlId]?.name;
    out.set(controlId, name ?? controlId);
  }
  return [...out.entries()].map(([id, name]) => ({ id, name }));
}

/** Kept for old callers: the engine already attaches ids, names and taxonomy mappings. */
export function enrichThreatsWithSecurityData(threats: GeneratedThreat[]): GeneratedThreat[] {
  return threats.map((t) => ({
    ...t,
    controlIds: t.controlIds ?? controlsForThreat(t).map((c) => c.id),
  }));
}

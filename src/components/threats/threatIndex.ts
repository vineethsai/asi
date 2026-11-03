/**
 * Derived, read-only views of the threat catalog (securityData.threatsData) shared by the Threats
 * list, ThreatDetail and the heatmap. Everything here is computed from the data modules at load
 * time; nothing is hand-counted.
 */
import {
  mitigationsData,
  threatsData,
  type Mitigation,
  type Threat,
} from "@/components/components/securityData";
import { impactBand, riskBand, type Band } from "@/lib/severity";

const codeNumber = (code: string) => Number.parseInt(code.replace(/\D+/g, ""), 10) || 0;

/** Sort by catalog code: T1, T2 … T17 (numeric, not lexical). */
export function compareThreatCodes(a: Threat, b: Threat): number {
  return codeNumber(a.code) - codeNumber(b.code);
}

/** Sort controls by id number: m1, m2 … m20. */
export function compareMitigationIds(a: Mitigation, b: Mitigation): number {
  return codeNumber(a.id) - codeNumber(b.id);
}

/** Every threat in catalog order (T1 → T17). */
export const THREAT_LIST: readonly Threat[] = Object.values(threatsData).sort(compareThreatCodes);

/** Every control in id order (m1 → m20). */
export const MITIGATION_LIST: readonly Mitigation[] =
  Object.values(mitigationsData).sort(compareMitigationIds);

/** Controls that list the threat in `threatIds` (the canonical direction of the mapping). */
export function mitigationsForThreat(threatId: string): Mitigation[] {
  return MITIGATION_LIST.filter((m) => m.threatIds.includes(threatId));
}

/** Short display label: `shortName` when present, else the official name. */
export function threatLabel(t: Threat): string {
  return t.shortName ?? t.name;
}

/** Risk band from the 1–10 risk score; falls back to the impact level when no score exists. */
export function threatBand(t: Threat): Band {
  return typeof t.riskScore === "number" ? riskBand(t.riskScore) : impactBand(t.impactLevel);
}

/** "Control M7" style code for a mitigation id ("m7" → "M7"). */
export function controlCode(id: string): string {
  return id.toUpperCase();
}

/** Previous / next threat in catalog order (no wrap-around). */
export function threatNeighbours(threatId: string): { prev?: Threat; next?: Threat } {
  const i = THREAT_LIST.findIndex((t) => t.id === threatId);
  if (i < 0) return {};
  return { prev: THREAT_LIST[i - 1], next: THREAT_LIST[i + 1] };
}

export const THREAT_STATS = {
  threats: THREAT_LIST.length,
  attackVectors: THREAT_LIST.reduce((n, t) => n + (t.attackVectors?.length ?? 0), 0),
  /** Distinct controls mapped to at least one threat. */
  mitigations: new Set(
    MITIGATION_LIST.filter((m) => m.threatIds.some((id) => id in threatsData)).map((m) => m.id),
  ).size,
};

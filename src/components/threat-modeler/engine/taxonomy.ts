import { agenticTop10Data } from "@/components/components/owaspAgenticTop10Data";
import { ciscoTaxonomyData } from "@/components/components/ciscoTaxonomyData";
import type { CiscoTaxonomyMapping, OwaspAgenticMapping } from "../types";
import type { RuleMaps } from "./catalog/types";

let asiNames: Map<string, string> | null = null;
let ciscoNames: Map<string, string> | null = null;
let ciscoTechs: Map<string, Set<string>> | null = null;

function asiName(id: string): string {
  if (!asiNames) asiNames = new Map(agenticTop10Data.map((e) => [e.id, e.name ?? e.id]));
  return asiNames.get(id) ?? id;
}

function ciscoName(code: string): string {
  if (!ciscoNames) ciscoNames = new Map(ciscoTaxonomyData.map((o) => [o.code, o.description]));
  return ciscoNames.get(code) ?? code;
}

/**
 * Taxonomy mappings authored on the rule (P3-18): high = the rule's primary
 * ASI ids, medium = related ids. No keyword/regex fallbacks.
 */
export function owaspMappingFor(maps: RuleMaps): OwaspAgenticMapping[] {
  const out: OwaspAgenticMapping[] = [];
  for (const id of maps.owaspAsi ?? [])
    out.push({ asiId: id, asiName: asiName(id), confidence: "high" });
  for (const id of maps.owaspAsiRelated ?? []) {
    if (out.some((m) => m.asiId === id)) continue;
    out.push({ asiId: id, asiName: asiName(id), confidence: "medium" });
  }
  return out;
}

/** Cisco v2 objectives with the rule's techniques that sit under each one. */
export function ciscoMappingFor(maps: RuleMaps): CiscoTaxonomyMapping[] {
  if (!ciscoTechs)
    ciscoTechs = new Map(
      ciscoTaxonomyData.map((o) => [o.code, new Set(o.ai_tech.map((t) => t.code))]),
    );
  return (maps.cisco ?? []).map((code) => {
    const under = ciscoTechs!.get(code);
    const techniques = (maps.ciscoTechniques ?? []).filter((t) => under?.has(t));
    return {
      objectiveId: code,
      objectiveName: ciscoName(code),
      ...(techniques.length ? { techniques } : {}),
    };
  });
}

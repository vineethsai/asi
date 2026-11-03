/**
 * Site-wide counts for Home and About (IMPROVEMENT_PLAN §3 "data-driven copy"). Every number
 * shown in those pages' copy comes from here, computed from the data modules at load time.
 */

import { threatsData, mitigationsData } from "@/components/components/securityData";
import { architecturesData } from "@/components/components/architecturesData";
import { frameworkData, type ComponentNode } from "@/components/components/frameworkData";
import { ARCHITECTURE_TEMPLATES } from "@/components/threat-modeler/templates";
import { NIST_AISVS_REMAP } from "@/data/nistAisvsRemap";
import { aisvsStats } from "@/data/aisvs";
import { KC_LIST } from "@/data/kc";
import { NAV_ITEMS } from "@/config/navigation";
import { CROSSWALK_EXTERNAL_FRAMEWORKS } from "@/components/taxonomy/overview/crosswalkGroups";
import { riskBand, type SeverityBand } from "@/lib/severity";

function countNodes(nodes: readonly ComponentNode[]): number {
  return nodes.reduce((n, node) => n + 1 + countNodes(node.children ?? []), 0);
}

const threats = Object.values(threatsData);

/** Taxonomy tabs reachable from the command palette ("/taxonomy?tab=…"). */
export const TAXONOMY_FRAMEWORKS = NAV_ITEMS.filter((item) =>
  item.path.startsWith("/taxonomy?tab="),
).map((item) => ({ label: item.label, path: item.path }));

export const SITE_STATS = {
  threats: threats.length,
  attackVectors: threats.reduce((n, t) => n + (t.attackVectors?.length ?? 0), 0),
  controls: Object.keys(mitigationsData).length,
  aisvsRequirements: aisvsStats.requirements,
  aisvsChapters: aisvsStats.chapters,
  aisvsVersion: aisvsStats.version,
  patterns: Object.keys(architecturesData).length,
  modelerTemplates: ARCHITECTURE_TEMPLATES.length,
  /** Key components (KC1–KC6). */
  keyComponents: KC_LIST.length,
  /** Every node in the KC tree (KCs + sub-components). */
  componentNodes: countNodes(frameworkData),
  /** External frameworks in the Taxonomy crosswalk (Agentic, LLM Top 10, Cisco, AIVSS, AIUC-1). */
  taxonomyFrameworks: CROSSWALK_EXTERNAL_FRAMEWORKS.length,
  nistSubcategories: Object.keys(NIST_AISVS_REMAP).length,
} as const;

export type SiteStats = typeof SITE_STATS;

/** Threat counts by risk band (riskBand(riskScore)) for a list of threat ids — sparkline input. */
export function threatBandCounts(
  threatIds: readonly string[],
): Partial<Record<SeverityBand, number>> {
  const counts: Partial<Record<SeverityBand, number>> = {};
  for (const id of threatIds) {
    const t = threatsData[id];
    if (!t) continue;
    const b = riskBand(t.riskScore);
    counts[b] = (counts[b] ?? 0) + 1;
  }
  return counts;
}

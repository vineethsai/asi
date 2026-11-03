/**
 * One cross-framework mapping model for the Taxonomy overview (IMPROVEMENT_PLAN §6.8, §9): the
 * Sankey, the interconnection map and the density matrix all read it, so their numbers agree.
 *
 * Link value = number of underlying mapping statements in the data (never a guess):
 *   ASI ↔ T&M     1 per pair in threat.asiMapping ∪ agenticTop10Data.relatedThreats (Appendix A;
 *                 pairs only in asiMappingUnofficial are labelled "editorial")
 *   T&M ↔ Cisco   1 per pair in threat.ciscoMapping
 *   ASI ↔ Cisco   Cisco techniques + sub-techniques under the objective that carry "OWASP: ASIxx"
 *                 in Cisco's own taxonomy file
 *   ASI ↔ AIVSS   1 per primary / secondary pair in OWASP AIVSS v0.8 Appendix B
 *   ASI ↔ AIUC-1  active AIUC-1 requirements of the principle whose ASI mapping is the entry
 *   AIVSS ↔ AIUC-1 active AIUC-1 requirements of the principle that list the risk (primary or
 *                 secondary)
 *   LLM ↔ ASI     1 per primary pair in the OWASP Top 10 for LLM Applications 2026 Appendix A
 *   LLM ↔ Cisco   Cisco techniques + sub-techniques under the objective that carry
 *                 "OWASP: LLMxx:2026" in Cisco's own taxonomy file
 *   LLM ↔ T&M     1 per pair in llmTop10Data.relatedThreats (this site's editorial mapping;
 *                 labelled "editorial")
 */
import { agenticTop10Data } from "@/components/components/owaspAgenticTop10Data";
import { threatsData } from "@/components/components/securityData";
import { ciscoTaxonomyData } from "@/components/components/ciscoTaxonomyData";
import {
  AIVSS_ASI_MAPPING,
  AIVSS_CORE_RISK_NAMES,
  coreRiskScores,
} from "@/components/components/aivssCalcData";
import { aiuc1Principles, isAiuc1RequirementActive } from "@/components/components/aiuc1Data";
import { llmTop10Data, OWASP_LLM_TOP10_EDITION } from "@/components/components/owaspLlmTop10Data";
import {
  CROSSWALK_GROUPS,
  type CrosswalkFramework,
  type CrosswalkLink,
  type CrosswalkNode,
} from "./crosswalkGroups";

export {
  CROSSWALK_EXTERNAL_FRAMEWORKS,
  CROSSWALK_GROUPS,
  type CrosswalkFramework,
  type CrosswalkGroup,
  type CrosswalkLink,
  type CrosswalkNode,
} from "./crosswalkGroups";

const tax = (tab: string, entry?: string) =>
  `/taxonomy?tab=${tab}${entry ? `&entry=${encodeURIComponent(entry)}` : ""}`;

export const nodeId = (group: CrosswalkFramework, code: string) => `${group}:${code}`;

function build() {
  const nodes: CrosswalkNode[] = [];
  const links: CrosswalkLink[] = [];
  const add = (l: CrosswalkLink) => {
    const prev = links.find((x) => x.source === l.source && x.target === l.target);
    if (prev) prev.value += l.value;
    else links.push({ ...l });
  };

  for (const e of agenticTop10Data) {
    nodes.push({
      id: nodeId("asi", e.code),
      code: e.code,
      label: `${e.code} ${e.name}`,
      group: "asi",
      href: tax("owasp-agentic", e.code),
    });
  }
  const threats = Object.values(threatsData).sort((a, b) =>
    a.id.localeCompare(b.id, "en", { numeric: true }),
  );
  for (const t of threats) {
    nodes.push({
      id: nodeId("tm", t.id),
      code: t.code,
      label: `${t.code} ${t.shortName ?? t.name}`,
      group: "tm",
      href: `/threats/${t.id}`,
    });
  }
  for (const og of ciscoTaxonomyData) {
    nodes.push({
      id: nodeId("cisco", og.code),
      code: og.code,
      label: `${og.code} ${og.description}`,
      group: "cisco",
      href: tax("cisco", og.code),
    });
  }
  for (const name of AIVSS_CORE_RISK_NAMES) {
    const risk = coreRiskScores.find((r) => r.name === name);
    nodes.push({
      id: nodeId("aivss", name),
      code: risk ? `#${risk.rank}` : name,
      label: name,
      group: "aivss",
      href: tax("aivss", risk?.id),
    });
  }
  for (const p of aiuc1Principles) {
    nodes.push({
      id: nodeId("aiuc1", p.id),
      code: p.id,
      label: `AIUC-1 ${p.id} · ${p.name}`,
      group: "aiuc1",
      href: tax("aiuc-1"),
    });
  }

  for (const e of llmTop10Data) {
    nodes.push({
      id: nodeId("llm", e.id),
      code: e.id,
      label: `${e.id} ${e.name}`,
      group: "llm",
      href: tax("llm-top10", e.id),
    });
  }

  // ASI ↔ T&M
  const asiThreatPairs = new Map<string, { official: boolean }>();
  for (const t of threats) {
    const unofficial = new Set(t.asiMappingUnofficial ?? []);
    for (const asi of t.asiMapping ?? []) {
      const key = `${asi}|${t.id}`;
      const official = !unofficial.has(asi);
      asiThreatPairs.set(key, {
        official: (asiThreatPairs.get(key)?.official ?? false) || official,
      });
    }
  }
  for (const e of agenticTop10Data) {
    for (const tid of e.relatedThreats) asiThreatPairs.set(`${e.code}|${tid}`, { official: true });
  }
  for (const [key, { official }] of asiThreatPairs) {
    const [asi, tid] = key.split("|");
    if (!threatsData[tid]) continue;
    add({
      source: nodeId("asi", asi),
      target: nodeId("tm", tid),
      value: 1,
      label: official ? "OWASP Appendix A" : "editorial",
    });
  }

  // T&M ↔ Cisco
  for (const t of threats) {
    for (const ob of t.ciscoMapping ?? []) {
      add({
        source: nodeId("tm", t.id),
        target: nodeId("cisco", ob),
        value: 1,
        label: "threat → Cisco objective",
      });
    }
  }

  // ASI ↔ Cisco (Cisco's own OWASP mappings, counted per technique / sub-technique)
  for (const og of ciscoTaxonomyData) {
    for (const tech of og.ai_tech) {
      for (const node of [tech, ...tech.ai_subtech]) {
        const asis = new Set(
          node.mappings
            .map((m) => m.match(/^OWASP:\s*(ASI\d{2})\b/)?.[1])
            .filter(Boolean) as string[],
        );
        for (const asi of asis) {
          add({
            source: nodeId("asi", asi),
            target: nodeId("cisco", og.code),
            value: 1,
            label: "Cisco techniques mapped to the ASI entry",
          });
        }
      }
    }
  }

  // ASI ↔ AIVSS (v0.8 Appendix B)
  for (const [asi, m] of Object.entries(AIVSS_ASI_MAPPING)) {
    for (const r of m.primary)
      add({
        source: nodeId("asi", asi),
        target: nodeId("aivss", r),
        value: 1,
        label: "primary AIVSS risk",
      });
    for (const r of m.secondary)
      add({
        source: nodeId("asi", asi),
        target: nodeId("aivss", r),
        value: 1,
        label: "secondary AIVSS risk",
      });
  }

  // AIUC-1 (active requirements, per principle)
  const riskNames = new Set<string>(AIVSS_CORE_RISK_NAMES);
  for (const p of aiuc1Principles) {
    for (const r of p.requirements.filter(isAiuc1RequirementActive)) {
      if (r.asiId)
        add({
          source: nodeId("asi", r.asiId),
          target: nodeId("aiuc1", p.id),
          value: 1,
          label: "AIUC-1 requirements mapped to the ASI entry",
        });
      for (const risk of [r.aivss_primary, r.aivss_secondary]) {
        if (risk && riskNames.has(risk)) {
          add({
            source: nodeId("aivss", risk),
            target: nodeId("aiuc1", p.id),
            value: 1,
            label: "AIUC-1 requirements citing the AIVSS risk",
          });
        }
      }
    }
  }

  // OWASP LLM Top 10 (2026): ASI (official Appendix A), Cisco (Cisco's own mappings, per
  // technique / sub-technique), T&M (editorial)
  for (const e of llmTop10Data) {
    for (const asi of e.relatedAsi)
      add({
        source: nodeId("llm", e.id),
        target: nodeId("asi", asi),
        value: 1,
        label: `OWASP LLM Top 10 ${OWASP_LLM_TOP10_EDITION.version} Appendix A`,
      });
    for (const tid of e.relatedThreats) {
      if (!threatsData[tid]) continue;
      add({
        source: nodeId("llm", e.id),
        target: nodeId("tm", tid),
        value: 1,
        label: "editorial (this site's mapping)",
      });
    }
  }
  const llmRe = new RegExp(`^OWASP:\\s*(LLM\\d{2}):${OWASP_LLM_TOP10_EDITION.version}\\b`);
  for (const og of ciscoTaxonomyData) {
    for (const tech of og.ai_tech) {
      for (const node of [tech, ...tech.ai_subtech]) {
        const llms = new Set(
          node.mappings.map((m) => m.match(llmRe)?.[1]).filter(Boolean) as string[],
        );
        for (const llm of llms) {
          add({
            source: nodeId("llm", llm),
            target: nodeId("cisco", og.code),
            value: 1,
            label: "Cisco techniques mapped to the LLM entry",
          });
        }
      }
    }
  }

  const known = new Set(nodes.map((n) => n.id));
  return { nodes, links: links.filter((l) => known.has(l.source) && known.has(l.target)) };
}

export const CROSSWALK = build();

/** Sum of link values between two frameworks (order-insensitive). */
export function frameworkPairCount(a: CrosswalkFramework, b: CrosswalkFramework): number {
  if (a === b) return 0;
  const groupOf = new Map(CROSSWALK.nodes.map((n) => [n.id, n.group]));
  let sum = 0;
  for (const l of CROSSWALK.links) {
    const ga = groupOf.get(l.source);
    const gb = groupOf.get(l.target);
    if ((ga === a && gb === b) || (ga === b && gb === a)) sum += l.value;
  }
  return sum;
}

export const FRAMEWORK_PAIR_COUNTS: Record<string, number> = Object.fromEntries(
  CROSSWALK_GROUPS.flatMap((a) =>
    CROSSWALK_GROUPS.map((b) => [`${a.id}|${b.id}`, frameworkPairCount(a.id, b.id)]),
  ),
);

/** Entry count per framework (AIUC-1: active requirements; the Sankey groups them by principle). */
export function frameworkEntryCount(id: CrosswalkFramework): number {
  if (id === "aiuc1")
    return aiuc1Principles.reduce(
      (n, p) => n + p.requirements.filter(isAiuc1RequirementActive).length,
      0,
    );
  return CROSSWALK.nodes.filter((n) => n.group === id).length;
}

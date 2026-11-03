import { describe, expect, it } from "vitest";
import {
  CROSSWALK,
  CROSSWALK_EXTERNAL_FRAMEWORKS,
  CROSSWALK_GROUPS,
  FRAMEWORK_PAIR_COUNTS,
} from "@/components/taxonomy/overview/crosswalkGraph";
import { llmTop10Data } from "@/components/components/owaspLlmTop10Data";
import { getCiscoObjectivesByLlm } from "@/components/components/ciscoTaxonomyData";
import { SITE_STATS } from "@/components/home/siteStats";

describe("crosswalk graph", () => {
  it("only links known nodes, with positive integer values", () => {
    const ids = new Set(CROSSWALK.nodes.map((n) => n.id));
    for (const l of CROSSWALK.links) {
      expect(ids.has(l.source)).toBe(true);
      expect(ids.has(l.target)).toBe(true);
      expect(Number.isInteger(l.value) && l.value > 0).toBe(true);
    }
  });
  it("has symmetric pair counts and links every framework", () => {
    for (const a of CROSSWALK_GROUPS)
      for (const b of CROSSWALK_GROUPS)
        expect(FRAMEWORK_PAIR_COUNTS[`${a.id}|${b.id}`]).toBe(
          FRAMEWORK_PAIR_COUNTS[`${b.id}|${a.id}`],
        );
    for (const g of CROSSWALK_GROUPS) {
      const total = CROSSWALK_GROUPS.reduce(
        (n, o) => n + FRAMEWORK_PAIR_COUNTS[`${g.id}|${o.id}`],
        0,
      );
      expect(total).toBeGreaterThan(0);
    }
  });

  it("cross-maps the OWASP LLM Top 10 (2026) to ASI, Cisco and T&M", () => {
    expect(CROSSWALK_GROUPS.find((g) => g.id === "llm")?.tab).toBe("llm-top10");
    const llmNodes = CROSSWALK.nodes.filter((n) => n.group === "llm");
    expect(llmNodes.map((n) => n.code)).toEqual(llmTop10Data.map((e) => e.id));
    expect(FRAMEWORK_PAIR_COUNTS["llm|asi"]).toBe(
      llmTop10Data.reduce((n, e) => n + e.relatedAsi.length, 0),
    );
    const groupOf = new Map(CROSSWALK.nodes.map((n) => [n.id, n.group]));
    const between = (a: string, b: string) =>
      CROSSWALK.links.filter((l) => groupOf.get(l.source) === a && groupOf.get(l.target) === b);
    const tm = between("llm", "tm");
    expect(tm.length).toBeGreaterThan(0);
    for (const l of tm) expect(l.label).toMatch(/editorial/);
    // Every Cisco objective that cites an LLM entry (Cisco's own data) gets a ribbon.
    const cisco = new Set(between("llm", "cisco").map((l) => `${l.source}|${l.target}`));
    for (const [llm, objectives] of Object.entries(getCiscoObjectivesByLlm()))
      for (const ob of objectives) expect(cisco.has(`llm:${llm}|cisco:${ob}`)).toBe(true);
    expect(SITE_STATS.taxonomyFrameworks).toBe(CROSSWALK_EXTERNAL_FRAMEWORKS.length);
    expect(CROSSWALK_EXTERNAL_FRAMEWORKS.map((g) => g.id)).toContain("llm");
  });
});

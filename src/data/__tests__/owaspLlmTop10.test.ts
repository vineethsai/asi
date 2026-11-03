import { describe, expect, it } from "vitest";
import {
  LLM_ATLAS_TACTICS,
  LLM_CWE_NAMES,
  OWASP_LLM_TOP10_EDITION,
  findLlmTop10Entry,
  llmTop10Data,
} from "@/components/components/owaspLlmTop10Data";
import { agenticTop10Data } from "@/components/components/owaspAgenticTop10Data";
import { mitigationsData, threatsData } from "@/components/components/securityData";
import { getCiscoObjectivesByLlm } from "@/components/components/ciscoTaxonomyData";
import { aisvsData } from "@/data/aisvs";
import { SOURCES } from "@/data/sources";
import { parseCiscoMapping } from "@/components/taxonomy/tabs/links";
import { checkSitePath } from "./routeCheck";

describe("OWASP Top 10 for LLM Applications data", () => {
  it("carries the 2026 edition in rank order with its 2025 predecessors", () => {
    expect(OWASP_LLM_TOP10_EDITION.version).toBe("2026");
    expect(llmTop10Data.map((e) => e.id)).toEqual(
      Array.from({ length: 10 }, (_, i) => `LLM${String(i + 1).padStart(2, "0")}`),
    );
    expect(llmTop10Data.map((e) => e.code)).toEqual(llmTop10Data.map((e) => `${e.id}:2026`));
    // Every 2025 id appears exactly once.
    expect(new Set(llmTop10Data.map((e) => e.previous.id)).size).toBe(10);
    expect(SOURCES.llmTop10.version).toMatch(/^2026/);
  });

  it("resolves 2026 ids, edition-qualified codes and 2025 citations", () => {
    expect(findLlmTop10Entry("LLM01")?.name).toBe("Prompt Injection");
    expect(findLlmTop10Entry("llm3")?.name).toBe("Excessive Agency");
    expect(findLlmTop10Entry("LLM03:2026")?.name).toBe("Excessive Agency");
    expect(findLlmTop10Entry("LLM06:2025 Excessive Agency")?.id).toBe("LLM03");
    expect(findLlmTop10Entry("LLM07:2025")?.name).toBe("Hidden Context Exposure");
    expect(findLlmTop10Entry("LLM10:2025")?.name).toBe("Unbounded Consumption");
    expect(findLlmTop10Entry("LLM11")).toBeUndefined();
    expect(findLlmTop10Entry("LLM01:2023")).toBeUndefined();
    expect(findLlmTop10Entry("ASI01")).toBeUndefined();
    // Every LLM citation in the Agentic Top 10 (2025 ids) resolves.
    for (const asi of agenticTop10Data) {
      for (const ref of asi.relatedLLMTop10) expect(findLlmTop10Entry(ref), ref).toBeDefined();
    }
  });

  it("maps to existing threats, controls, ASI entries, AISVS chapters, tactics and CWEs", () => {
    const asiCodes = new Set(agenticTop10Data.map((e) => e.code));
    for (const e of llmTop10Data) {
      for (const id of e.relatedThreats) expect(threatsData[id], `${e.id} ${id}`).toBeDefined();
      for (const id of e.relatedControls)
        expect(mitigationsData[id], `${e.id} ${id}`).toBeDefined();
      for (const code of e.relatedAsi) expect(asiCodes.has(code), `${e.id} ${code}`).toBe(true);
      for (const code of [...e.relatedAisvs, ...e.supportingAisvs])
        expect(aisvsData[code], `${e.id} ${code}`).toBeDefined();
      for (const id of e.atlasTactics) expect(LLM_ATLAS_TACTICS[id], id).toBeDefined();
      for (const id of e.cwe) expect(LLM_CWE_NAMES[id], id).toBeDefined();
      for (const t of e.relatedThreats) expect(checkSitePath(`/threats/${t}`)).toBeNull();
      for (const m of e.relatedControls) expect(checkSitePath(`/controls/${m}`)).toBeNull();
    }
  });

  it("keeps Cisco objectives in step with Cisco's own LLM mappings", () => {
    const derived = getCiscoObjectivesByLlm();
    for (const e of llmTop10Data) {
      expect([...e.relatedCiscoObjectives].sort(), e.id).toEqual(derived[e.id] ?? []);
    }
  });

  it("links Cisco's OWASP LLM mapping chips to the LLM Top 10 tab", () => {
    expect(parseCiscoMapping("OWASP: LLM03:2026: Excessive Agency")?.to).toBe(
      "/taxonomy?tab=llm-top10&entry=LLM03%3A2026",
    );
    expect(parseCiscoMapping("OWASP: ASI01: Agent Goal Hijack")?.to).toBe(
      "/taxonomy?tab=owasp-agentic&entry=ASI01",
    );
  });
});

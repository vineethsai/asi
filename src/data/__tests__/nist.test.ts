import { describe, expect, it } from "vitest";
import {
  NIST_CATEGORIES,
  NIST_GAI_RISKS,
  NIST_SUBCATEGORIES,
  getNistCategory,
  getNistSubcategory,
  nistAIRMF,
} from "@/data/nist";
import { NIST_AISVS_REMAP } from "@/data/nistAisvsRemap";
import { AISVS_CHAPTER_CODES, isAisvsCode } from "@/data/aisvs";

describe("NIST AI RMF data", () => {
  const remapCodes = Object.keys(NIST_AISVS_REMAP).sort();
  const subCodes = NIST_SUBCATEGORIES.map((s) => s.code);

  it("lists exactly the subcategories of the AISVS remap (no gaps, no extras, no duplicates)", () => {
    expect(new Set(subCodes).size).toBe(subCodes.length);
    expect([...subCodes].sort()).toEqual(remapCodes);
    expect(subCodes).toHaveLength(72);
    for (const sub of NIST_SUBCATEGORIES) {
      expect(NIST_AISVS_REMAP[sub.code], sub.code).toBeDefined();
    }
  });

  it("takes every AISVS mapping from the remap and only uses AISVS 1.01 chapters", () => {
    const chapters = new Set(AISVS_CHAPTER_CODES);
    for (const sub of NIST_SUBCATEGORIES) {
      expect(sub.aisvs).toEqual(NIST_AISVS_REMAP[sub.code].aisvs);
      expect(sub.organizational).toBe(sub.aisvs.length === 0);
      for (const ch of sub.aisvs) expect(chapters.has(ch), `${sub.code} → ${ch}`).toBe(true);
      for (const req of sub.requirements)
        expect(isAisvsCode(req), `${sub.code} → ${req}`).toBe(true);
    }
    // The pre-1.01 draft's 13th chapter must not survive anywhere (built so check:data's scan
    // for stale AISVS codes does not flag this test itself).
    const draftOnlyChapter = ["C", AISVS_CHAPTER_CODES.length + 1].join("");
    expect(JSON.stringify(nistAIRMF)).not.toContain(`"${draftOnlyChapter}"`);
  });

  it("keeps the AI RMF structure: 4 functions, categories nested by code", () => {
    expect(nistAIRMF.map((f) => f.code)).toEqual(["GOVERN", "MAP", "MEASURE", "MANAGE"]);
    for (const cat of NIST_CATEGORIES) {
      expect(cat.code.startsWith(`${cat.functionCode}.`)).toBe(true);
      for (const sub of cat.subcategories) {
        expect(sub.categoryCode).toBe(cat.code);
        expect(sub.code.startsWith(`${cat.code}.`)).toBe(true);
        expect(sub.nameIsEditorial).toBe(true);
        expect(sub.description.length).toBeGreaterThan(20);
      }
    }
  });

  it("only tags NIST AI 600-1 risks that exist, in every function", () => {
    const ids = new Set(NIST_GAI_RISKS.map((r) => r.id));
    expect(ids.size).toBe(12);
    const tagged = NIST_SUBCATEGORIES.filter((s) => s.gaiRisks?.length);
    for (const sub of tagged) {
      for (const r of sub.gaiRisks ?? []) expect(ids.has(r), `${sub.code} → ${r}`).toBe(true);
    }
    for (const fn of ["GOVERN", "MAP", "MEASURE", "MANAGE"]) {
      expect(tagged.filter((s) => s.functionCode === fn).length).toBeGreaterThanOrEqual(3);
    }
  });

  it("looks codes up case-insensitively", () => {
    expect(getNistSubcategory("govern.1.1")?.code).toBe("GOVERN.1.1");
    expect(getNistSubcategory("MEASURE 2.7")?.code).toBe("MEASURE.2.7");
    expect(getNistCategory("map.4")?.code).toBe("MAP.4");
    expect(getNistSubcategory("GOVERN.9.9")).toBeUndefined();
  });
});

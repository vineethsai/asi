/**
 * NIST mapping page model: selection, filters and the aggregates shared by the graph, the
 * compliance matrix and the drawer. React-free.
 */
import {
  NIST_CATEGORIES,
  NIST_SUBCATEGORIES,
  getNistCategory,
  getNistFunction,
  getNistGaiRisk,
  getNistSubcategory,
  normalizeNistCode,
  type NistFunctionCode,
  type NistRmfSubcategory,
} from "@/data/nist";
import { AISVS_CHAPTER_CODES, aisvsData } from "@/data/aisvs";

export type NistSelectionKind = "function" | "category" | "subcategory" | "chapter";

export interface NistSelection {
  kind: NistSelectionKind;
  /** NIST code ("GOVERN", "GOVERN.1", "GOVERN.1.1") or AISVS chapter ("C5"). */
  code: string;
  /** AISVS chapter context (e.g. a compliance-matrix cell): the drawer focuses on that chapter. */
  chapter?: string;
}

/** `?sub=` value → selection (case-insensitive; accepts function, category or subcategory codes). */
export function parseSubParam(raw: string | null | undefined): NistSelection | null {
  if (!raw) return null;
  const code = normalizeNistCode(raw);
  if (getNistSubcategory(code)) return { kind: "subcategory", code };
  if (getNistCategory(code)) return { kind: "category", code };
  if (getNistFunction(code)) return { kind: "function", code };
  return null;
}

/** The `?sub=` value for a selection (chapters are not encoded in the URL). */
export function selectionParam(sel: NistSelection | null): string | null {
  return sel && sel.kind !== "chapter" ? sel.code : null;
}

export const NODE_PREFIX: Record<NistSelectionKind, string> = {
  function: "fn:",
  category: "cat:",
  subcategory: "sub:",
  chapter: "ch:",
};

export function nodeIdFor(sel: NistSelection | null): string | null {
  return sel ? `${NODE_PREFIX[sel.kind]}${sel.code}` : null;
}

export function selectionFromNodeId(id: string | null): NistSelection | null {
  if (!id) return null;
  for (const kind of Object.keys(NODE_PREFIX) as NistSelectionKind[]) {
    const prefix = NODE_PREFIX[kind];
    if (id.startsWith(prefix)) return { kind, code: id.slice(prefix.length) };
  }
  return null;
}

/** Function code of a NIST code ("MEASURE.2.7" → "MEASURE"). */
export function functionOf(code: string): NistFunctionCode {
  return code.split(".")[0] as NistFunctionCode;
}

export function chapterName(code: string): string {
  return aisvsData[code]?.name ?? code;
}

// ─── Filters (applied to every tab) ────────────────────────────────────────

export interface NistFilters {
  search: string;
  fn: NistFunctionCode | "all";
  chapter: string | "all";
  gai: string | "all";
}

export const EMPTY_FILTERS: NistFilters = { search: "", fn: "all", chapter: "all", gai: "all" };

export function isFiltered(f: NistFilters): boolean {
  return f.search.trim() !== "" || f.fn !== "all" || f.chapter !== "all" || f.gai !== "all";
}

function haystack(sub: NistRmfSubcategory): string {
  const cat = getNistCategory(sub.categoryCode);
  return [
    sub.code,
    sub.name,
    sub.description,
    sub.rationale,
    cat?.name ?? "",
    cat?.description ?? "",
    ...sub.aisvs.map((c) => `${c} ${chapterName(c)}`),
    ...sub.requirements,
    ...(sub.gaiRisks ?? []).map((r) => getNistGaiRisk(r)?.name ?? r),
  ]
    .join(" ")
    .toLowerCase();
}

const HAYSTACKS = new Map(NIST_SUBCATEGORIES.map((s) => [s.code, haystack(s)]));

/** Subcategories that pass every filter, in framework order. */
export function filterSubcategories(f: NistFilters): NistRmfSubcategory[] {
  const terms = f.search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return NIST_SUBCATEGORIES.filter((s) => {
    if (f.fn !== "all" && s.functionCode !== f.fn) return false;
    if (f.chapter !== "all" && !s.aisvs.includes(f.chapter)) return false;
    if (f.gai !== "all" && !(s.gaiRisks ?? []).includes(f.gai as never)) return false;
    if (terms.length) {
      const h = HAYSTACKS.get(s.code) ?? "";
      if (!terms.every((t) => h.includes(t))) return false;
    }
    return true;
  });
}

// ─── Aggregates ────────────────────────────────────────────────────────────

/** Requirement ids a subcategory's rationale cites within one chapter. */
export function citedIn(sub: NistRmfSubcategory, chapter: string): string[] {
  return sub.requirements.filter((r) => r.split(".")[0] === chapter);
}

/** Number of the given subcategories mapping to each AISVS chapter (all 12 keys present). */
export function chapterCounts(subs: readonly NistRmfSubcategory[]): Record<string, number> {
  const out: Record<string, number> = Object.fromEntries(AISVS_CHAPTER_CODES.map((c) => [c, 0]));
  for (const s of subs) for (const c of s.aisvs) out[c] = (out[c] ?? 0) + 1;
  return out;
}

/** Categories (framework order) that contain at least one of the given subcategories. */
export function categoriesOf(subs: readonly NistRmfSubcategory[]) {
  const codes = new Set(subs.map((s) => s.categoryCode));
  return NIST_CATEGORIES.filter((c) => codes.has(c.code));
}

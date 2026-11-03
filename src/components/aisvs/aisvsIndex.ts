/**
 * Precomputed AISVS indexes for the AISVS page (IMPROVEMENT_PLAN §6.6, P1-11). Built once at module
 * load from `@/data/aisvs` and the controls in `securityData` — no counts are hard-coded.
 */
import {
  AISVS_CHAPTER_CODES,
  AISVS_VERSION,
  aisvsData,
  aisvsRequirements,
  type AISVSCategory,
  type AISVSRequirement,
} from "@/data/aisvs";
import { mitigationsData } from "@/components/components/securityData";

export type AisvsLevel = 1 | 2 | 3;
export const AISVS_LEVELS: readonly AisvsLevel[] = [1, 2, 3] as const;

/** Chapters in standard order. */
export const AISVS_CHAPTERS: AISVSCategory[] = AISVS_CHAPTER_CODES.map((c) => aisvsData[c]);

const chapterOfSection = new Map<string, string>();
for (const ch of AISVS_CHAPTERS)
  for (const s of ch.subCategories) chapterOfSection.set(s.code, ch.code);
const requirementById = new Map(aisvsRequirements.map((r) => [r.id, r]));

/** Requirement ids per level across the whole standard. */
export const REQUIREMENT_IDS_BY_LEVEL: Record<AisvsLevel, string[]> = {
  1: aisvsRequirements.filter((r) => r.level === 1).map((r) => r.id),
  2: aisvsRequirements.filter((r) => r.level === 2).map((r) => r.id),
  3: aisvsRequirements.filter((r) => r.level === 3).map((r) => r.id),
};

/** Requirement ids per chapter and level. */
export const CHAPTER_LEVEL_IDS: Record<string, Record<AisvsLevel, string[]>> = Object.fromEntries(
  AISVS_CHAPTERS.map((ch) => {
    const reqs = ch.subCategories.flatMap((s) => s.requirements);
    return [
      ch.code,
      {
        1: reqs.filter((r) => r.level === 1).map((r) => r.id),
        2: reqs.filter((r) => r.level === 2).map((r) => r.id),
        3: reqs.filter((r) => r.level === 3).map((r) => r.id),
      },
    ];
  }),
);

export interface CitingControl {
  id: string;
  name: string;
}

function buildCitations() {
  const byRequirement = new Map<string, CitingControl[]>();
  const byChapter = new Map<string, CitingControl[]>();
  const push = (map: Map<string, CitingControl[]>, key: string, c: CitingControl) => {
    const list = map.get(key) ?? [];
    if (!list.some((x) => x.id === c.id)) list.push(c);
    map.set(key, list);
  };
  for (const m of Object.values(mitigationsData)) {
    const ctl = { id: m.id, name: m.name };
    for (const reqId of m.aisvsRequirements ?? []) {
      if (requirementById.has(reqId)) push(byRequirement, reqId, ctl);
    }
    for (const ch of m.aisvsCategories ?? []) {
      if (ch in aisvsData) push(byChapter, ch, ctl);
    }
  }
  const order = (a: CitingControl, b: CitingControl) =>
    a.id.localeCompare(b.id, "en", { numeric: true });
  byRequirement.forEach((l) => l.sort(order));
  byChapter.forEach((l) => l.sort(order));
  return { byRequirement, byChapter };
}

const citations = buildCitations();

/** Controls (mitigationsData) whose `aisvsRequirements` cite this requirement id. */
export function controlsCitingRequirement(reqId: string): CitingControl[] {
  return citations.byRequirement.get(reqId) ?? [];
}

/** Controls whose `aisvsCategories` include this chapter. */
export function controlsCitingChapter(chapter: string): CitingControl[] {
  return citations.byChapter.get(chapter) ?? [];
}

export interface AisvsAnchor {
  chapter: string;
  section?: string;
  requirement?: string;
  /** The DOM id to scroll to (requirement id, section code or chapter code). */
  target: string;
}

/**
 * Parse a deep-link hash or code into chapter / section / requirement:
 * "#C5", "C5.1", "c5.1.2", "V5.1.2" (legacy prefix), "5.1.2", "v1.01-C5.1.2", "AISVS C5".
 * Returns null when it does not resolve in this AISVS version.
 */
export function parseAisvsAnchor(raw: string | null | undefined): AisvsAnchor | null {
  if (!raw) return null;
  let s = raw.trim();
  try {
    s = decodeURIComponent(s);
  } catch {
    /* keep raw */
  }
  s = s
    .replace(/^#/, "")
    .replace(/^aisvs[\s-]*/i, "")
    .replace(/^v\d+(?:\.\d+)*-/i, "")
    .trim();
  const m = s.match(/^[CV]?(\d{1,2})(?:\.(\d{1,2}))?(?:\.(\d{1,2}))?$/i);
  if (!m) return null;
  const chapter = `C${Number(m[1])}`;
  if (!(chapter in aisvsData)) return null;
  if (!m[2]) return { chapter, target: chapter };
  const section = `${chapter}.${Number(m[2])}`;
  if (chapterOfSection.get(section) !== chapter) return { chapter, target: chapter };
  if (!m[3]) return { chapter, section, target: section };
  const requirement = `${section}.${Number(m[3])}`;
  if (!requirementById.has(requirement)) return { chapter, section, target: section };
  return { chapter, section, requirement, target: requirement };
}

/** DOM ids used on the page (the AISVS codes themselves, so `/aisvs#C5.1.2` also works natively). */
export const domId = (code: string) => code;
export const checkboxId = (reqId: string) => `aisvs-check-${reqId}`;

export function citationOf(req: AISVSRequirement): string {
  return req.citation || `v${AISVS_VERSION}-${req.id}`;
}

// ─── Search ────────────────────────────────────────────────────────────────

export function normalizeQuery(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, " ");
}

/** True when the requirement's official text, id or number matches the (normalised) query. */
export function requirementMatches(req: AISVSRequirement, q: string): boolean {
  if (!q) return true;
  const code = q.replace(/^[cv]/, "");
  return (
    req.text.toLowerCase().includes(q) ||
    req.id.toLowerCase() === q ||
    req.id.toLowerCase().startsWith(`${q}.`) ||
    req.code === code ||
    req.code.startsWith(`${code}.`)
  );
}

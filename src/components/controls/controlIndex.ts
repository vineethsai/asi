/**
 * Derived views of the control catalog (securityData.mitigationsData) × OWASP AISVS 1.01:
 * cited requirements per control, the reverse requirement → controls index, per-chapter
 * coverage and related controls. All computed from the data modules; nothing hand-counted.
 */
import { threatsData, type Mitigation } from "@/components/components/securityData";
import {
  aisvsData,
  AISVS_CHAPTER_CODES,
  getAisvsRequirement,
  type AISVSRequirement,
} from "@/data/aisvs";
import { MITIGATION_LIST, mitigationsForThreat } from "@/components/threats/threatIndex";
import { FRAMEWORK_ORDER, FRAMEWORK_PALETTE, MAESTRO_ORDER, MAESTRO_PALETTE } from "@/lib/palette";

export const CONTROL_LIST = MITIGATION_LIST;

const byId = new Map(CONTROL_LIST.map((m) => [m.id, m]));
export function controlById(id: string | null | undefined): Mitigation | undefined {
  return id ? byId.get(id.toLowerCase()) : undefined;
}

/** Valid AISVS 1.01 requirements the control cites (unknown ids are dropped). */
export function citedRequirements(m: Mitigation): AISVSRequirement[] {
  const seen = new Set<string>();
  const out: AISVSRequirement[] = [];
  for (const ref of m.aisvsRequirements ?? []) {
    const r = getAisvsRequirement(ref);
    if (r && !seen.has(r.id)) {
      seen.add(r.id);
      out.push(r);
    }
  }
  return out;
}

/** AISVS chapters the control maps to: `aisvsCategories` plus chapters of cited requirements. */
export function controlChapters(m: Mitigation): string[] {
  const set = new Set(
    [...(m.aisvsCategories ?? []), ...citedRequirements(m).map((r) => r.category)].filter(
      (c) => c in aisvsData,
    ),
  );
  return AISVS_CHAPTER_CODES.filter((c) => set.has(c));
}

/** Chapters listed in `aisvsCategories` with no cited requirement (chapter-level mapping only). */
export function chapterOnlyMappings(m: Mitigation): string[] {
  const cited = new Set(citedRequirements(m).map((r) => r.category));
  return controlChapters(m).filter((c) => !cited.has(c));
}

const REQUIREMENT_CONTROLS = new Map<string, Mitigation[]>();
for (const m of CONTROL_LIST) {
  for (const r of citedRequirements(m)) {
    const list = REQUIREMENT_CONTROLS.get(r.id) ?? [];
    list.push(m);
    REQUIREMENT_CONTROLS.set(r.id, list);
  }
}

/** Controls citing a requirement ("C2.1.1"). */
export function controlsForRequirement(id: string): Mitigation[] {
  return REQUIREMENT_CONTROLS.get(id) ?? [];
}

/** Requirements of one chapter cited by the given controls (one control each). */
export function citedInChapter(m: Mitigation, chapter: string): AISVSRequirement[] {
  return citedRequirements(m).filter((r) => r.category === chapter);
}

/** Requirement ids cited by any control mitigating the threat. */
export function requirementIdsForThreat(threatId: string): Set<string> {
  return new Set(
    mitigationsForThreat(threatId).flatMap((m) => citedRequirements(m).map((r) => r.id)),
  );
}

/** Other controls that share threats with `m`, most shared first. */
export function relatedControls(
  m: Mitigation,
  limit = 4,
): { control: Mitigation; sharedThreatIds: string[] }[] {
  const mine = new Set(m.threatIds);
  return CONTROL_LIST.filter((o) => o.id !== m.id)
    .map((o) => ({ control: o, sharedThreatIds: o.threatIds.filter((t) => mine.has(t)) }))
    .filter((x) => x.sharedThreatIds.length > 0)
    .sort(
      (a, b) =>
        b.sharedThreatIds.length - a.sharedThreatIds.length ||
        CONTROL_LIST.indexOf(a.control) - CONTROL_LIST.indexOf(b.control),
    )
    .slice(0, limit);
}

/** Highest AISVS level among the control's cited requirements (undefined when none). */
export function controlLevels(m: Mitigation): Set<number> {
  return new Set(citedRequirements(m).map((r) => r.level));
}

export const CONTROL_STATS = {
  controls: CONTROL_LIST.length,
  threatsCovered: new Set(CONTROL_LIST.flatMap((m) => m.threatIds.filter((t) => t in threatsData)))
    .size,
  citedRequirements: REQUIREMENT_CONTROLS.size,
  chaptersCovered: new Set(CONTROL_LIST.flatMap(controlChapters)).size,
};

// One stable colour per control, cycled from the shared categorical palettes.
const CONTROL_COLORS: readonly string[] = [
  ...FRAMEWORK_ORDER.map((k) => FRAMEWORK_PALETTE[k].css),
  ...MAESTRO_ORDER.map((l) => MAESTRO_PALETTE[l].css),
];
export function controlColor(id: string): string {
  const i = CONTROL_LIST.findIndex((m) => m.id === id);
  return CONTROL_COLORS[(i < 0 ? 0 : i) % CONTROL_COLORS.length];
}

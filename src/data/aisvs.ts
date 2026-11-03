/**
 * OWASP AISVS adapter.
 *
 * Exposes the generated AISVS dataset (`./aisvs.generated.ts`, written by
 * `scripts/import-aisvs.mjs`) in the long-standing `aisvsData` shape that the
 * AISVS, Controls and NIST pages, the command palette, the References page and
 * the threat modeler consume. Do not hand-edit requirement content here:
 * re-run the importer instead.
 *
 * Id scheme (AISVS 1.01):
 *   chapter      id/code  "C1"       (record key "C1")
 *   section      id/code  "C1.1"
 *   requirement  id       "C1.1.1"   code "1.1.1"   citation "v1.01-C1.1.1"
 *
 * `title` is NOT part of the standard (AISVS requirements are untitled): it is
 * the requirement text without the leading "Verify that", shortened for list
 * views. `description` and `text` carry the official wording verbatim.
 */
import { aisvs } from "./aisvs.generated";

export interface AISVSRequirement {
  /** "C1.1.1" */
  id: string;
  /** "1.1.1" — the number as printed in the standard. */
  code: string;
  /** Derived short label (see file header); not official. */
  title: string;
  /** Official requirement text ("Verify that …"). Same as `text`. */
  description: string;
  level: 1 | 2 | 3;
  /** Parent chapter code / record key, e.g. "C1". */
  category: string;
  /** AISVS 1.01 tables have no Role column; kept for compatibility. */
  role?: string;
  /** Per-requirement references (AISVS 1.01 lists references per chapter only). */
  references: { title: string; url: string }[];
  /** Official requirement text ("Verify that …"). */
  text: string;
  /** Parent section code, e.g. "C1.1". */
  section: string;
  /** Citation form used by OWASP, e.g. "v1.01-C1.1.1". */
  citation: string;
}

export interface AISVSSubCategory {
  /** "C1.1" */
  id: string;
  /** "C1.1" */
  code: string;
  name: string;
  requirements: AISVSRequirement[];
  /** Section introduction from the standard. */
  description: string;
  /** Requirement ids reserved as "Requirement removed." upstream. */
  removed: string[];
}

export interface AISVSCategory {
  /** "C1" (also the record key in `aisvsData`). */
  id: string;
  /** "C1" */
  code: string;
  name: string;
  /** The chapter's Control Objective. */
  description: string;
  subCategories: AISVSSubCategory[];
  /** UI accent colour (site-specific, not part of the standard). */
  color: string;
  /** Icon registry key (src/lib/icons.ts). */
  icon: string;
  /** References listed at the end of the chapter in the standard. */
  references: { title: string; url: string }[];
  /** Chapter number, 1-12. */
  number: number;
  /** AISVS version these requirements come from, e.g. "1.01". */
  version: string;
  /** Number of verifiable requirements in the chapter. */
  requirementCount: number;
  /** Chapter source file on GitHub. */
  sourceUrl: string;
}

/** Site-specific presentation per chapter (keys of src/lib/icons.ts). */
const CHAPTER_STYLE: Record<string, { color: string; icon: string }> = {
  C1: { color: "#3b82f6", icon: "training-data" },
  C2: { color: "#10b981", icon: "input-validation" },
  C3: { color: "#f59e0b", icon: "model-lifecycle" },
  C4: { color: "#ef4444", icon: "infrastructure" },
  C5: { color: "#8b5cf6", icon: "access-control" },
  C6: { color: "#f97316", icon: "supply-chain" },
  C7: { color: "#06b6d4", icon: "output-control" },
  C8: { color: "#ec4899", icon: "vector-database" },
  C9: { color: "#a855f7", icon: "orchestration" },
  C10: { color: "#14b8a6", icon: "mcp" },
  C11: { color: "#e11d48", icon: "adversarial-robustness" },
  C12: { color: "#6366f1", icon: "monitoring" },
};

export const AISVS_VERSION: string = aisvs.version;

const TITLE_MAX = 96;

/** Short list label from the official text (drops "Verify that", trims to a word boundary). */
export function deriveAisvsTitle(text: string): string {
  let t = text
    .replace(/^Verify that,?\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
  t = t.charAt(0).toUpperCase() + t.slice(1);
  t = t.replace(/\.$/, "");
  if (t.length <= TITLE_MAX) return t;
  const cut = t.slice(0, TITLE_MAX);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 40 ? lastSpace : TITLE_MAX).replace(/[,;:]$/, "")}…`;
}

function sourceFileUrl(file: string): string {
  const ref = aisvs.sourceCommit ?? "main";
  return `https://github.com/OWASP/AISVS/blob/${ref}/${aisvs.version}/en/${file}`;
}

function buildAisvsData(): Record<string, AISVSCategory> {
  const out: Record<string, AISVSCategory> = {};
  for (const chapter of aisvs.chapters) {
    const style = CHAPTER_STYLE[chapter.code] ?? { color: "#64748b", icon: "shield" };
    const subCategories: AISVSSubCategory[] = chapter.sections.map((section) => ({
      id: section.code,
      code: section.code,
      name: section.name,
      description: section.description,
      removed: section.removed ?? [],
      requirements: section.requirements.map((req) => ({
        id: req.id,
        code: req.id.replace(/^C/, ""),
        title: deriveAisvsTitle(req.text),
        description: req.text,
        text: req.text,
        level: req.level,
        category: chapter.code,
        section: section.code,
        citation: `v${aisvs.version}-${req.id}`,
        ...(req.role ? { role: req.role } : {}),
        references: [],
      })),
    }));
    out[chapter.code] = {
      id: chapter.code,
      code: chapter.code,
      number: chapter.number,
      name: chapter.name,
      description: chapter.description,
      version: aisvs.version,
      color: style.color,
      icon: style.icon,
      references: chapter.references.map((r) => ({ title: r.title, url: r.url })),
      sourceUrl: sourceFileUrl(chapter.sourceFile),
      requirementCount: subCategories.reduce((sum, s) => sum + s.requirements.length, 0),
      subCategories,
    };
  }
  return out;
}

/** AISVS 1.01 chapters keyed by code ("C1" … "C12"), in chapter order. */
export const aisvsData: Record<string, AISVSCategory> = buildAisvsData();

/** Chapter codes in order: ["C1", …, "C12"]. */
export const AISVS_CHAPTER_CODES: string[] = Object.keys(aisvsData);

/** Every verifiable requirement, in document order. */
export const aisvsRequirements: AISVSRequirement[] = Object.values(aisvsData).flatMap((c) =>
  c.subCategories.flatMap((s) => s.requirements),
);

const requirementIndex = new Map(aisvsRequirements.map((r) => [r.id, r]));
const sectionIndex = new Map(
  Object.values(aisvsData).flatMap((c) => c.subCategories.map((s) => [s.code, s] as const)),
);

/** Look up a requirement by "C1.1.1", "1.1.1" or "v1.01-C1.1.1". */
export function getAisvsRequirement(ref: string): AISVSRequirement | undefined {
  const id = ref
    .trim()
    .replace(/^v\d+(\.\d+)*-/i, "")
    .replace(/^(?=\d)/, "C")
    .toUpperCase();
  return requirementIndex.get(id);
}

/** True when `code` is a chapter ("C9"), section ("C9.4") or requirement ("C9.4.3") of this version. */
export function isAisvsCode(code: string): boolean {
  return code in aisvsData || sectionIndex.has(code) || requirementIndex.has(code);
}

export const aisvsStats = {
  version: aisvs.version,
  chapters: AISVS_CHAPTER_CODES.length,
  sections: sectionIndex.size,
  requirements: aisvsRequirements.length,
  byLevel: ([1, 2, 3] as const).map(
    (level) => aisvsRequirements.filter((r) => r.level === level).length,
  ) as [number, number, number],
};

export const source = {
  name: "OWASP AI Security Verification Standard (AISVS)",
  version: aisvs.version,
  url: `https://github.com/OWASP/AISVS/tree/main/${aisvs.version}/en`,
  retrievedAt: aisvs.retrievedAt,
};

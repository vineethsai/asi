import { AISVS_CHAPTERS, AISVS_VERSION } from "./catalog/aisvs";

/** Shape written by scripts/import-aisvs.mjs (IMPROVEMENT_PLAN A1). */
export interface GeneratedAisvs {
  version: string;
  retrievedAt?: string;
  chapters: {
    code: string;
    name: string;
    description?: string;
    sections: {
      code: string;
      name: string;
      requirements: { id: string; text: string; level: 1 | 2 | 3; role?: string }[];
    }[];
  }[];
}

export interface AisvsChapterInfo {
  code: string;
  name: string;
  requirementCount?: number;
}

let cached: { version: string; chapters: AisvsChapterInfo[]; generated: boolean } | null = null;

/**
 * AISVS chapters for compliance reporting. Uses the generated 1.01 dataset
 * when it exists (requirement counts, official names), else the built-in
 * chapter list. `import.meta.glob` resolves to `{}` when the file is absent,
 * so the engine never depends on a file another change has not landed yet.
 */
export function getAisvsChapters() {
  if (cached) return cached;
  let data: GeneratedAisvs | undefined;
  try {
    const mods = import.meta.glob("/src/data/aisvs.generated.ts", { eager: true }) as Record<
      string,
      Record<string, unknown>
    >;
    const mod = Object.values(mods)[0];
    if (mod) {
      const candidate = (mod.default ?? mod.aisvs ?? mod.AISVS ?? Object.values(mod)[0]) as
        | GeneratedAisvs
        | undefined;
      if (candidate && Array.isArray(candidate.chapters)) data = candidate;
    }
  } catch {
    data = undefined;
  }
  if (data) {
    cached = {
      version: data.version ?? AISVS_VERSION,
      generated: true,
      chapters: data.chapters.map((c) => ({
        code: c.code,
        name: c.name,
        requirementCount: c.sections.reduce((s, sec) => s + sec.requirements.length, 0),
      })),
    };
  } else {
    cached = { version: AISVS_VERSION, generated: false, chapters: AISVS_CHAPTERS };
  }
  return cached;
}

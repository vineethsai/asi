/**
 * Phase tasks of a control (mitigation.implementationDetail): each phase text is split into
 * heading sections; a section whose body is a single bullet list (more than one item) is a
 * checklist, with task ids `${phasePrefix}-${sectionIndex}-${itemIndex}` stored per control in
 * the progress store (useControlProgress). The rule matches RichText's `checklist` rule
 * exactly (one unordered, non-inline list as the only block), so counts and checkboxes agree.
 */
import type { Mitigation } from "@/components/components/securityData";
import { parseBlocks } from "@/components/content/richTextCore";
import type { Phase } from "@/components/content/PhaseBadge";

export const PHASE_ORDER: readonly Phase[] = ["design", "build", "operations"] as const;

export const PHASE_META: Readonly<
  Record<
    Phase,
    {
      label: string;
      prefix: string;
      field: keyof Mitigation["implementationDetail"];
      flag: "designPhase" | "buildPhase" | "operationPhase";
      blurb: string;
    }
  >
> = {
  design: {
    label: "Design",
    prefix: "design-phase",
    field: "design",
    flag: "designPhase",
    blurb: "Architecture, threat modelling and policy decisions made before code is written.",
  },
  build: {
    label: "Build",
    prefix: "build-phase",
    field: "build",
    flag: "buildPhase",
    blurb: "Implementation, testing and hardening while the agent is developed.",
  },
  operations: {
    label: "Operations",
    // Legacy id prefix kept for stored progress.
    prefix: "operation-phase",
    field: "operations",
    flag: "operationPhase",
    blurb: "Monitoring, response and continuous improvement once the agent is live.",
  },
};

export function isPhase(value: string | null | undefined): value is Phase {
  return value === "design" || value === "build" || value === "operations";
}

export interface PhaseSection {
  /** The heading line as written (e.g. "**Sandboxing Architecture:**"), if any. */
  heading?: string;
  /** Plain-text heading for labels. */
  title?: string;
  body: string;
  /** Checklist id prefix; task ids are `${idPrefix}-${i}`. */
  idPrefix: string;
  /** Checkable items in this section (0 when the body is not a single bullet list). */
  taskCount: number;
}

const HEADING_RE = [/^\*\*([^*]+?)\*\*:?$/, /^\*\*([^*]+?):\*\*$/, /^#{1,4}\s+(.+)$/];

function headingTitle(line: string): string | undefined {
  const t = line.trim();
  for (const re of HEADING_RE) {
    const m = t.match(re);
    if (m) return m[1].replace(/:$/, "").trim();
  }
  return undefined;
}

/** Number of checkboxes RichText renders for `text` with a checklist. */
export function checklistItemCount(text: string): number {
  const blocks = parseBlocks(text);
  if (blocks.length !== 1) return 0;
  const b = blocks[0];
  return b.type === "list" && !b.ordered && !b.inline && b.items.length > 1 ? b.items.length : 0;
}

/** Split markdown-ish text into heading sections (code fences are never split). */
export function splitSections(text: string, prefix: string): PhaseSection[] {
  const sections: { heading?: string; title?: string; lines: string[] }[] = [];
  let current: { heading?: string; title?: string; lines: string[] } = { lines: [] };
  let inFence = false;
  for (const line of (text ?? "").split("\n")) {
    if (/^\s*```/.test(line)) inFence = !inFence;
    const title = inFence ? undefined : headingTitle(line);
    if (title) {
      if (current.heading || current.lines.some((l) => l.trim())) sections.push(current);
      current = { heading: line.trim(), title, lines: [] };
    } else current.lines.push(line);
  }
  if (current.heading || current.lines.some((l) => l.trim())) sections.push(current);
  return sections.map((s, i) => {
    const body = s.lines.join("\n").trim();
    return {
      heading: s.heading,
      title: s.title,
      body,
      idPrefix: `${prefix}-${i}`,
      taskCount: checklistItemCount(body),
    };
  });
}

const cache = new Map<string, PhaseSection[]>();

export function phaseSections(m: Mitigation, phase: Phase): PhaseSection[] {
  const key = `${m.id}:${phase}`;
  let hit = cache.get(key);
  if (!hit) {
    const meta = PHASE_META[phase];
    hit = splitSections(m.implementationDetail[meta.field] ?? "", meta.prefix);
    cache.set(key, hit);
  }
  return hit;
}

export function phaseTaskIds(m: Mitigation, phase: Phase): string[] {
  return phaseSections(m, phase).flatMap((s) =>
    Array.from({ length: s.taskCount }, (_, i) => `${s.idPrefix}-${i}`),
  );
}

export function phaseTaskTotal(m: Mitigation, phase: Phase): number {
  return phaseSections(m, phase).reduce((n, s) => n + s.taskCount, 0);
}

export function controlTaskTotal(m: Mitigation): number {
  return PHASE_ORDER.reduce((n, p) => n + phaseTaskTotal(m, p), 0);
}

/** Completed tasks of one phase (ignores stale ids that no longer exist in the text). */
export function phaseDoneCount(done: ReadonlySet<string>, m: Mitigation, phase: Phase): number {
  return phaseTaskIds(m, phase).filter((id) => done.has(id)).length;
}

export function phaseApplies(m: Mitigation, phase: Phase): boolean {
  return m[PHASE_META[phase].flag];
}

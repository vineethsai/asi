/**
 * Pure roll-ups for the /progress dashboard (P4-05). Every total is computed from the data
 * modules; the store only holds what the visitor checked.
 */
import { mitigationsData, type Mitigation } from "@/components/components/securityData";
import { aisvsRequirements } from "@/data/aisvs";
import { LEARNING_STEPS, isQuizPassed, summarizeLearningPath } from "@/data/learningPath";
import { QUIZ_IDS, quizTitle } from "@/data/quizzes";
import type { ProgressData, QuizResult } from "@/lib/progress";

const pct = (done: number, total: number) => (total > 0 ? Math.round((done / total) * 100) : 0);

// ─── AISVS ──────────────────────────────────────────────────────────────────

export const AISVS_LEVELS = [1, 2, 3] as const;
export type AisvsLevel = (typeof AISVS_LEVELS)[number];

const AISVS_IDS = new Set(aisvsRequirements.map((r) => r.id));
const AISVS_IDS_BY_LEVEL: Record<AisvsLevel, Set<string>> = {
  1: new Set(aisvsRequirements.filter((r) => r.level === 1).map((r) => r.id)),
  2: new Set(aisvsRequirements.filter((r) => r.level === 2).map((r) => r.id)),
  3: new Set(aisvsRequirements.filter((r) => r.level === 3).map((r) => r.id)),
};

export interface Fraction {
  done: number;
  total: number;
  percent: number;
}

const fraction = (done: number, total: number): Fraction => ({
  done,
  total,
  percent: pct(done, total),
});

/** AISVS requirements checked (ids of the current AISVS version only), overall and per level. */
export function aisvsProgress(checked: ReadonlySet<string>) {
  const count = (ids: Set<string>) => [...checked].filter((id) => ids.has(id)).length;
  return {
    overall: fraction(count(AISVS_IDS), AISVS_IDS.size),
    byLevel: AISVS_LEVELS.map((level) => ({
      level,
      ...fraction(count(AISVS_IDS_BY_LEVEL[level]), AISVS_IDS_BY_LEVEL[level].size),
    })),
  };
}

// ─── Controls ───────────────────────────────────────────────────────────────

/**
 * Checklist tasks per control: the bullet lines ("- …") across the four implementation sections,
 * the same rule ControlDetail uses for its "x / y tasks" counter.
 */
export function controlTaskTotal(m: Mitigation): number {
  const d = m.implementationDetail;
  return [d?.design, d?.build, d?.operations, d?.toolsAndFrameworks].filter(Boolean).reduce(
    (n, section) =>
      n +
      String(section)
        .split("\n")
        .filter((l) => l.trim().startsWith("- ")).length,
    0,
  );
}

const CONTROLS = Object.values(mitigationsData);
const TASK_TOTALS = new Map(CONTROLS.map((m) => [m.id, controlTaskTotal(m)]));

export function controlsProgress(controls: ProgressData["controls"]) {
  let started = 0;
  let completed = 0;
  let tasksDone = 0;
  const rows = CONTROLS.map((m) => {
    const done = controls[m.id]?.size ?? 0;
    const total = TASK_TOTALS.get(m.id) ?? 0;
    if (done > 0) started++;
    if (total > 0 && done >= total) completed++;
    tasksDone += Math.min(done, total);
    return { id: m.id, name: m.name, done, total };
  });
  const tasksTotal = [...TASK_TOTALS.values()].reduce((a, b) => a + b, 0);
  return {
    total: CONTROLS.length,
    started,
    completed,
    tasks: fraction(tasksDone, tasksTotal),
    rows: rows.filter((r) => r.done > 0),
  };
}

// ─── Quizzes & path ─────────────────────────────────────────────────────────

export interface QuizRow extends QuizResult {
  id: string;
  title: string;
  percent: number;
  passed: boolean;
}

/** Best results in display order (known quizzes first, then any other recorded ids). */
export function quizRows(quizzes: ProgressData["quizzes"]): QuizRow[] {
  const ids = [...QUIZ_IDS, ...Object.keys(quizzes).filter((id) => !QUIZ_IDS.includes(id))];
  return ids
    .filter((id) => quizzes[id])
    .map((id) => {
      const r = quizzes[id];
      return {
        id,
        title: quizTitle(id),
        ...r,
        percent: pct(r.score, r.total),
        passed: isQuizPassed(r),
      };
    });
}

export function learningProgress(path: ProgressData["path"]) {
  const s = summarizeLearningPath(path);
  return { ...s, steps: LEARNING_STEPS.map((st) => ({ ...st, done: path[st.id] === true })) };
}

export interface BadgeStats {
  aisvs: Fraction;
  controls: Fraction;
  path: Fraction;
  quizzes: Fraction;
}

/** The four headline numbers shown on the share badge. */
export function badgeStats(s: ProgressData): BadgeStats {
  const aisvs = aisvsProgress(s.aisvs).overall;
  const c = controlsProgress(s.controls);
  const p = summarizeLearningPath(s.path);
  const passed = QUIZ_IDS.filter((id) => isQuizPassed(s.quizzes[id])).length;
  return {
    aisvs,
    controls: c.tasks,
    path: fraction(p.completed, p.total),
    quizzes: fraction(passed, QUIZ_IDS.length),
  };
}

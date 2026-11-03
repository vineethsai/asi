/**
 * React bindings for the progress store (src/lib/progress.ts, P1-08).
 *
 *   const done = useProgress((s) => s.checklist.has(item.id));       // subscribe to a slice
 *   const pct  = useProgress(aisvsPct(total));                       // pure selector from lib
 *   const { done, toggle } = useControlProgress("m2");               // per-control helper
 *   const state = useProgress();                                     // whole store (re-renders on any change)
 *
 * Selectors returning new objects/arrays are wrapped in `useShallow` automatically by the helper
 * hooks; when you write your own, return primitives or use `useProgressShallow`.
 */

import { useCallback, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  aisvsPct,
  checklistPct,
  controlsStarted,
  progressSummary,
  useProgressStore,
  type ProgressState,
} from "@/lib/progress";

export function useProgress(): ProgressState;
export function useProgress<T>(selector: (s: ProgressState) => T): T;
export function useProgress<T>(selector?: (s: ProgressState) => T) {
  return useProgressStore(selector ?? ((s) => s as unknown as T));
}

/** Like `useProgress` but shallow-compares the selected object/array. */
export function useProgressShallow<T extends object>(selector: (s: ProgressState) => T): T {
  return useProgressStore(useShallow(selector));
}

/** AISVS namespace helpers. `total` = number of requirements in the current dataset. */
export function useAisvsProgress(total: number) {
  return useProgressStore(
    useShallow((s) => ({
      checked: s.aisvs,
      count: s.aisvs.size,
      pct: aisvsPct(total)(s),
      toggle: s.toggleAisvs,
      set: s.setAisvs,
      setMany: s.setAisvsMany,
      reset: s.resetAisvs,
      showArchivedNotice: s.legacy?.aisvsArchivedNotice === true,
      archivedCount: s.legacy?.aisvsDraft?.length ?? 0,
      dismissArchivedNotice: s.dismissAisvsNotice,
    })),
  );
}

const EMPTY: ReadonlySet<string> = new Set();

/** Per-control checklist helpers (task ids such as "design-phase-0"). */
export function useControlProgress(controlId: string) {
  const done = useProgressStore((s) => (s.controls[controlId] ?? EMPTY) as ReadonlySet<string>);
  const toggleTask = useProgressStore((s) => s.toggleControlTask);
  const setTask = useProgressStore((s) => s.setControlTask);
  const resetControl = useProgressStore((s) => s.resetControl);
  const toggle = useCallback(
    (taskId: string) => toggleTask(controlId, taskId),
    [toggleTask, controlId],
  );
  const set = useCallback(
    (taskId: string, value: boolean) => setTask(controlId, taskId, value),
    [setTask, controlId],
  );
  const reset = useCallback(() => resetControl(controlId), [resetControl, controlId]);
  return useMemo(
    () => ({ done, count: done.size, toggle, set, reset }),
    [done, toggle, set, reset],
  );
}

/** Security checklist helpers. */
export function useChecklistProgress(total: number) {
  return useProgressStore(
    useShallow((s) => ({
      done: s.checklist,
      count: s.checklist.size,
      pct: checklistPct(total)(s),
      toggle: s.toggleChecklist,
      set: s.setChecklist,
      reset: s.resetChecklist,
    })),
  );
}

/** Roll-up numbers for the Home progress card. */
export function useProgressSummary() {
  return useProgressStore(useShallow(progressSummary));
}

/** Number of controls with ≥ 1 task done. */
export function useControlsStarted(): number {
  return useProgressStore(controlsStarted);
}

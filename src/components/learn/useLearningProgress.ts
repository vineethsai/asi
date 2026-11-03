import { useMemo } from "react";
import { useProgressStore } from "@/lib/progress";
import { summarizeLearningPath, type LearningPathSummary } from "@/data/learningPath";

/**
 * Learning-path progress from the store's `path` namespace (P4-01).
 *
 *   const { currentStep, completed, total } = useLearningProgress();   // "Step 3 of 6"
 *
 * Also returns `currentStepId`, `completedIds`, `done` and `percent` (see LearningPathSummary).
 */
export function useLearningProgress(): LearningPathSummary {
  const path = useProgressStore((s) => s.path);
  return useMemo(() => summarizeLearningPath(path), [path]);
}

export default useLearningProgress;

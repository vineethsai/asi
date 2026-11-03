import { describe, expect, it } from "vitest";
import {
  LEARNING_STEPS,
  PASS_RATIO,
  isQuizPassed,
  nextLearningStep,
  previousLearningStep,
  summarizeLearningPath,
} from "@/data/learningPath";
import { checkSitePath } from "./routeCheck";

describe("learning path", () => {
  it("has six ordered steps: Components → Threats → Controls → AISVS → NIST → Model it", () => {
    expect(LEARNING_STEPS.map((s) => s.id)).toEqual([
      "components",
      "threats",
      "controls",
      "aisvs",
      "nist",
      "model",
    ]);
    LEARNING_STEPS.forEach((s, i) => expect(s.number).toBe(i + 1));
  });

  it("lists 3–5 readings per step, each resolving to a real route and entity", () => {
    for (const step of LEARNING_STEPS) {
      expect(step.readings.length, step.id).toBeGreaterThanOrEqual(3);
      expect(step.readings.length, step.id).toBeLessThanOrEqual(5);
      for (const r of step.readings) {
        expect(checkSitePath(r.path), `${step.id}: ${r.path}`).toBeNull();
        expect(r.label).toBeTruthy();
        expect(r.description).toBeTruthy();
      }
    }
  });

  it("step pages are routable", () => {
    for (const step of LEARNING_STEPS) expect(checkSitePath(`/learn/${step.id}`)).toBeNull();
    expect(checkSitePath("/learn")).toBeNull();
    expect(checkSitePath("/progress")).toBeNull();
  });

  it("completion rule is quiz ≥ 80 %", () => {
    expect(PASS_RATIO).toBe(0.8);
    expect(isQuizPassed({ score: 4, total: 5 })).toBe(true);
    expect(isQuizPassed({ score: 3, total: 5 })).toBe(false);
    expect(isQuizPassed({ score: 0, total: 0 })).toBe(false);
    expect(isQuizPassed(undefined)).toBe(false);
  });

  it("summarizes progress as 'step N of 6'", () => {
    expect(summarizeLearningPath({})).toMatchObject({ currentStep: 1, completed: 0, total: 6 });
    const mid = summarizeLearningPath({ components: true, threats: true, aisvs: true });
    expect(mid).toMatchObject({ currentStep: 3, currentStepId: "controls", completed: 3 });
    const all = summarizeLearningPath(Object.fromEntries(LEARNING_STEPS.map((s) => [s.id, true])));
    expect(all).toMatchObject({ done: true, completed: 6, currentStep: 6, percent: 100 });
    expect(nextLearningStep("components")?.id).toBe("threats");
    expect(nextLearningStep("model")).toBeUndefined();
    expect(previousLearningStep("components")).toBeUndefined();
  });
});

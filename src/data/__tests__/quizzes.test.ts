import { describe, expect, it } from "vitest";
import { mitigationsData, threatsData } from "@/components/components/securityData";
import { agenticTop10Data } from "@/components/components/owaspAgenticTop10Data";
import { kcId } from "@/data/kc";
import { LEARNING_STEPS } from "@/data/learningPath";
import {
  CHALLENGE_PLAN,
  QUESTION_KINDS,
  QUIZ_IDS,
  buildChallengeQuiz,
  buildQuestion,
  buildStepQuiz,
  controlsForThreat,
  createRng,
  dayKey,
  questionSubjects,
  stepQuizId,
  threatsForControl,
  type QuizQuestion,
} from "@/data/quizzes";
import { checkSitePath } from "./routeCheck";

function expectValid(q: QuizQuestion | null, label: string): asserts q is QuizQuestion {
  expect(q, label).not.toBeNull();
  if (!q) return;
  expect(q.choices, `${label} choices`).toHaveLength(4);
  expect(new Set(q.choices).size, `${label} unique choices`).toBe(4);
  expect(q.answerIndex, label).toBeGreaterThanOrEqual(0);
  expect(q.answerIndex, label).toBeLessThan(4);
  expect(q.choices[q.answerIndex], label).toBeTruthy();
  expect(q.prompt.length, label).toBeGreaterThan(10);
  expect(q.explanation.length, label).toBeGreaterThan(10);
  expect(checkSitePath(q.link.href), `${label} link ${q.link.href}`).toBeNull();
}

/** `${kind}:${subject}:${mode}:${answerKey}` → parts (membership questions). */
const parseId = (q: QuizQuestion) => {
  const [, subject, mode, answer] = q.id.split(":");
  return { subject, mode, answer };
};

describe("quiz generators", () => {
  it("every kind yields valid questions for every subject it can support", () => {
    for (const kind of QUESTION_KINDS) {
      const subjects = questionSubjects(kind);
      expect(subjects.length, kind).toBeGreaterThan(0);
      let built = 0;
      for (const subject of subjects) {
        const q = buildQuestion(kind, subject, createRng(`${kind}:${subject}`));
        if (q) {
          expectValid(q, `${kind}/${subject}`);
          built++;
        }
      }
      expect(built, kind).toBeGreaterThan(0);
    }
  });

  it("covers every threat: KC, ASI and control questions with correct answers", () => {
    for (const t of Object.values(threatsData)) {
      for (let seed = 0; seed < 4; seed++) {
        const rng = createRng(`${t.id}:${seed}`);
        const kcQ = buildQuestion("threat-kc", t.id, rng);
        expectValid(kcQ, `threat-kc ${t.id}`);
        const kcs = new Set(t.componentIds.map((c) => kcId(c)));
        const k = parseId(kcQ);
        expect(kcs.has(k.answer as never), `${t.id} kc`).toBe(k.mode === "in");

        const asiQ = buildQuestion("threat-asi", t.id, rng);
        expectValid(asiQ, `threat-asi ${t.id}`);
        const a = parseId(asiQ);
        const mapped =
          (t.asiMapping ?? []).includes(a.answer) ||
          agenticTop10Data.some((e) => e.id === a.answer && e.relatedThreats.includes(t.id));
        expect(mapped, `${t.id} asi`).toBe(a.mode === "in");
        // No distractor may also be a mapped entry in "in" mode.
        if (a.mode === "in") {
          const mappedLabels = asiQ.choices.filter((c) => {
            const id = c.split(" · ")[0];
            return (
              (t.asiMapping ?? []).includes(id) ||
              agenticTop10Data.some((e) => e.id === id && e.relatedThreats.includes(t.id))
            );
          });
          expect(mappedLabels, `${t.id} asi distractors`).toHaveLength(1);
        }

        const cQ = buildQuestion("threat-control", t.id, rng);
        expectValid(cQ, `threat-control ${t.id}`);
        const c = parseId(cQ);
        expect(controlsForThreat(t).has(c.answer), `${t.id} control`).toBe(c.mode === "in");
      }
    }
  });

  it("covers every control: threat and AISVS questions", () => {
    for (const m of Object.values(mitigationsData)) {
      const rng = createRng(m.id);
      const tq = buildQuestion("control-threat", m.id, rng);
      expectValid(tq, `control-threat ${m.id}`);
      const p = parseId(tq);
      expect(threatsForControl(m).has(p.answer), `${m.id} threat`).toBe(p.mode === "in");
      if (m.aisvsCategories?.length) {
        const aq = buildQuestion("control-aisvs", m.id, rng);
        expectValid(aq, `control-aisvs ${m.id}`);
        const pa = parseId(aq);
        expect(m.aisvsCategories.includes(pa.answer), `${m.id} aisvs`).toBe(pa.mode === "in");
      }
    }
  });

  it("rates every attack vector with its catalog severity", () => {
    for (const t of Object.values(threatsData)) {
      (t.attackVectors ?? []).forEach((v, i) => {
        if (!v.severity) return;
        const q = buildQuestion("vector-severity", `${t.id}#${i}`, createRng("v"));
        expectValid(q, `vector ${t.id}#${i}`);
        expect(q.choices[q.answerIndex].toLowerCase()).toBe(v.severity);
      });
    }
  });

  it("builds five stable questions per learning-path step", () => {
    const date = new Date(2026, 10, 3);
    for (const step of LEARNING_STEPS) {
      const quiz = buildStepQuiz(step.id, { date });
      expect(quiz.id).toBe(step.quizId);
      expect(quiz.id).toBe(stepQuizId(step.id));
      expect(quiz.questions).toHaveLength(5);
      expect(new Set(quiz.questions.map((q) => q.id)).size).toBe(5);
      quiz.questions.forEach((q, i) => expectValid(q, `${step.id}[${i}]`));
      // Same day → same questions; another attempt → a different draw.
      expect(buildStepQuiz(step.id, { date }).questions).toEqual(quiz.questions);
      const other = buildStepQuiz(step.id, { date, attempt: 1 });
      expect(other.seed).not.toBe(quiz.seed);
    }
  });

  it("builds a ten-question challenge across datasets", () => {
    const quiz = buildChallengeQuiz({ date: new Date(2026, 10, 3) });
    expect(quiz.questions).toHaveLength(CHALLENGE_PLAN.length);
    expect(quiz.questions).toHaveLength(10);
    expect(new Set(quiz.questions.map((q) => q.kind)).size).toBe(new Set(CHALLENGE_PLAN).size);
    quiz.questions.forEach((q, i) => expectValid(q, `challenge[${i}]`));
    expect(QUIZ_IDS).toContain(quiz.id);
  });

  it("formats day keys in local time", () => {
    expect(dayKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

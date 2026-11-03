/**
 * <Quiz> — one-question-at-a-time quiz over generated questions (IMPROVEMENT_PLAN P4-02).
 *
 * Props:
 *   quizId: string                    — key in the progress store's `quizzes` namespace
 *   questions: QuizQuestion[]         — from src/data/quizzes.ts (buildStepQuiz / buildChallengeQuiz)
 *   title?: string                    — accessible name / results heading
 *   passRatio?: number                — default PASS_RATIO (0.8)
 *   onComplete?: (result) => void     — after the last answer (score, total, percent, passed, firstPass)
 *   onNewQuestions?: () => void       — shows a "New questions" button on the results screen
 *   resultActions?: (result) => node  — extra buttons on the results screen (e.g. "Next step")
 *   celebrate?: boolean               — confetti the first time the quiz is passed (default true)
 *   record?: boolean                  — write the best score to the store (default true)
 *
 * Keyboard: 1–4 answer, ↑/↓ (or ←/→ before answering) move between choices, Enter/Space
 * choose, → or Enter on "Next" continues. Answers give immediate feedback with the explanation
 * and a deep link. On finish the best score is recorded (`quizzes[quizId] = {score,total,at}`),
 * the existing `quiz_complete` analytics event fires and, on a first pass, confetti + a toast.
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Check, RotateCcw, Shuffle, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Ring } from "@/components/charts/Ring";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { trackPageEvents } from "@/lib/analytics";
import { useProgressStore } from "@/lib/progress";
import { severityToken } from "@/lib/severity";
import { cn } from "@/lib/utils";
import { PASS_RATIO, isQuizPassed } from "@/data/learningPath";
import type { QuizQuestion } from "@/data/quizzes";
import { celebrate as fireConfetti } from "./celebrate";

export interface QuizCompletion {
  quizId: string;
  score: number;
  total: number;
  /** 0–100, rounded. */
  percent: number;
  passed: boolean;
  /** True when this attempt is the first passing one on record. */
  firstPass: boolean;
}

export interface QuizProps {
  quizId: string;
  questions: QuizQuestion[];
  title?: string;
  passRatio?: number;
  onComplete?: (result: QuizCompletion) => void;
  onNewQuestions?: () => void;
  resultActions?: (result: QuizCompletion) => ReactNode;
  celebrate?: boolean;
  record?: boolean;
  className?: string;
}

const correctToken = severityToken("low");
const wrongToken = severityToken("critical");

/** Option styles (moved from the old global `.quiz-option*` classes). */
const optionClass = {
  base: "group flex w-full items-start gap-3 rounded-lg border px-3.5 py-3 text-left text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
  idle: "bg-card hover:border-primary/60 hover:bg-accent/60",
  correct: cn(correctToken.bg, correctToken.border, "border-2"),
  wrong: cn(wrongToken.bg, wrongToken.border, "border-2"),
  dim: "bg-card opacity-60",
} as const;

function QuizInner({
  quizId,
  questions,
  title = "Quiz",
  passRatio = PASS_RATIO,
  onComplete,
  onNewQuestions,
  resultActions,
  celebrate = true,
  record = true,
  className,
}: QuizProps) {
  const reduced = useReducedMotion();
  const navigate = useNavigate();
  const recordQuiz = useProgressStore((s) => s.recordQuiz);
  const baseId = useId();
  const total = questions.length;

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [focusIndex, setFocusIndex] = useState(0);
  const [result, setResult] = useState<QuizCompletion | null>(null);

  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const nextRef = useRef<HTMLButtonElement | null>(null);
  const resultRef = useRef<HTMLHeadingElement | null>(null);
  const pendingFocus = useRef<"option" | "next" | "result" | null>(null);

  const question = questions[index];
  const selected = answers[index];
  const answered = selected !== null && selected !== undefined;
  const score = useMemo(
    () => answers.reduce<number>((n, a, i) => n + (a === questions[i]?.answerIndex ? 1 : 0), 0),
    [answers, questions],
  );

  // Move focus after state changes (never on first mount).
  useEffect(() => {
    const target = pendingFocus.current;
    pendingFocus.current = null;
    if (target === "option") optionRefs.current[focusIndex]?.focus();
    else if (target === "next") nextRef.current?.focus();
    else if (target === "result") resultRef.current?.focus();
  });

  const answer = useCallback(
    (choice: number) => {
      if (answered || !question || choice < 0 || choice >= question.choices.length) return;
      setAnswers((prev) => prev.map((a, i) => (i === index ? choice : a)));
      setFocusIndex(choice);
      pendingFocus.current = "next";
    },
    [answered, question, index],
  );

  const finish = useCallback(
    (finalScore: number) => {
      const passedNow = total > 0 && finalScore / total >= passRatio;
      const prev = useProgressStore.getState().quizzes[quizId];
      const firstPass = passedNow && !isQuizPassed(prev);
      if (record) {
        const better = !prev || prev.total === 0 || finalScore / total >= prev.score / prev.total;
        if (better) recordQuiz(quizId, finalScore, total);
      }
      const percent = total > 0 ? Math.round((finalScore / total) * 100) : 0;
      trackPageEvents.quizComplete(percent, quizId);
      const completion: QuizCompletion = {
        quizId,
        score: finalScore,
        total,
        percent,
        passed: passedNow,
        firstPass,
      };
      if (firstPass) {
        if (celebrate) void fireConfetti({ reduced });
        toast.success(`${title} passed: ${finalScore} / ${total}`, {
          description: "Your progress page can turn this into a shareable badge.",
          action: { label: "Share badge", onClick: () => navigate("/progress#badge") },
        });
      }
      setResult(completion);
      pendingFocus.current = "result";
      onComplete?.(completion);
    },
    [total, passRatio, quizId, record, recordQuiz, celebrate, reduced, title, navigate, onComplete],
  );

  const next = useCallback(() => {
    if (!answered) return;
    if (index + 1 >= total) {
      finish(score);
      return;
    }
    setIndex(index + 1);
    setFocusIndex(0);
    pendingFocus.current = "option";
  }, [answered, index, total, finish, score]);

  const restart = useCallback(() => {
    setAnswers(questions.map(() => null));
    setIndex(0);
    setFocusIndex(0);
    setResult(null);
    pendingFocus.current = "option";
  }, [questions]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (result || e.metaKey || e.ctrlKey || e.altKey) return;
    const n = question?.choices.length ?? 0;
    if (/^[1-9]$/.test(e.key) && Number(e.key) <= n && !answered) {
      e.preventDefault();
      answer(Number(e.key) - 1);
      return;
    }
    if (answered) {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      }
      return;
    }
    const delta =
      e.key === "ArrowDown" || e.key === "ArrowRight"
        ? 1
        : e.key === "ArrowUp" || e.key === "ArrowLeft"
          ? -1
          : 0;
    if (delta && n) {
      e.preventDefault();
      const to = (focusIndex + delta + n) % n;
      setFocusIndex(to);
      optionRefs.current[to]?.focus();
    }
  };

  if (!total) {
    return (
      <p className={cn("rounded-lg border p-4 text-sm text-muted-foreground", className)}>
        No questions available for this quiz.
      </p>
    );
  }

  // ─── Results ─────────────────────────────────────────────────────────────
  if (result) {
    const needed = Math.ceil(total * passRatio);
    return (
      <section className={cn("space-y-5", className)} aria-labelledby={`${baseId}-result`}>
        <div className="flex flex-col items-start gap-4 rounded-xl border bg-card p-5 sm:flex-row sm:items-center">
          <Ring
            value={result.score}
            max={total}
            size={84}
            thickness={8}
            tone="progress"
            format={(v, m) => `${v}/${m}`}
            ariaLabel={`${result.score} of ${total} correct`}
          />
          <div className="min-w-0 flex-1 space-y-1">
            <h3
              id={`${baseId}-result`}
              ref={resultRef}
              tabIndex={-1}
              className="text-lg font-semibold outline-none"
            >
              {result.passed ? "Passed" : "Not quite"} — {result.score} of {total} correct (
              {result.percent}%)
            </h3>
            <p className="text-sm text-muted-foreground">
              {result.passed
                ? result.firstPass
                  ? "Nice work — your score is saved to your progress."
                  : "Passed again. Your best score is kept."
                : `You need ${needed} of ${total} to pass. Review the explanations below and try again.`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {resultActions?.(result)}
            <Button type="button" variant="outline" onClick={restart}>
              <RotateCcw aria-hidden="true" />
              Try again
            </Button>
            {onNewQuestions && (
              <Button type="button" variant="outline" onClick={onNewQuestions}>
                <Shuffle aria-hidden="true" />
                New questions
              </Button>
            )}
          </div>
        </div>

        <ol className="space-y-2" aria-label="Your answers">
          {questions.map((q, i) => {
            const ok = answers[i] === q.answerIndex;
            const given = answers[i];
            return (
              <li key={q.id} className="rounded-lg border bg-card p-3 text-sm">
                <div className="flex items-start gap-2">
                  <span
                    className={cn(
                      "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                      ok ? correctToken.badge : wrongToken.badge,
                    )}
                  >
                    {ok ? (
                      <Check className="h-3 w-3" aria-hidden="true" />
                    ) : (
                      <X className="h-3 w-3" aria-hidden="true" />
                    )}
                    <span className="sr-only">{ok ? "Correct" : "Incorrect"}</span>
                  </span>
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium">{q.prompt}</p>
                    <p className="text-muted-foreground">
                      {ok ? (
                        <>Your answer: {q.choices[q.answerIndex]}</>
                      ) : (
                        <>
                          Your answer: {given != null ? q.choices[given] : "—"} · Correct:{" "}
                          <span className="text-foreground">{q.choices[q.answerIndex]}</span>
                        </>
                      )}
                    </p>
                    <Link
                      to={q.link.href}
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {q.link.label}
                      <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    );
  }

  // ─── Question ────────────────────────────────────────────────────────────
  const promptId = `${baseId}-prompt`;
  const correct = answered && selected === question.answerIndex;

  return (
    <div
      className={cn("space-y-4", className)}
      onKeyDown={onKeyDown}
      role="group"
      aria-label={title}
    >
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span className="font-medium tabular-nums">
          Question {index + 1} of {total}
        </span>
        <span className="hidden sm:inline">
          Keys: <kbd className="font-mono">1</kbd>–
          <kbd className="font-mono">{question.choices.length}</kbd> answer ·{" "}
          <kbd className="font-mono">→</kbd> next
        </span>
      </div>
      <ol className="flex gap-1" aria-hidden="true">
        {questions.map((q, i) => {
          const a = answers[i];
          return (
            <li
              key={q.id}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors duration-300",
                a == null
                  ? i === index
                    ? "bg-primary/50"
                    : "bg-muted"
                  : a === q.answerIndex
                    ? correctToken.chart
                    : wrongToken.chart,
              )}
            />
          );
        })}
      </ol>

      <div className="enter is-visible space-y-1" key={question.id} data-visible="">
        <h3 id={promptId} className="text-base font-semibold leading-snug md:text-lg">
          {question.prompt}
        </h3>
        {question.context && <p className="text-sm text-muted-foreground">{question.context}</p>}
      </div>

      <div role="group" aria-labelledby={promptId} className="grid gap-2">
        {question.choices.map((choice, i) => {
          const isAnswer = i === question.answerIndex;
          const isSelected = i === selected;
          const state = !answered ? "idle" : isAnswer ? "correct" : isSelected ? "wrong" : "dim";
          return (
            <button
              key={`${question.id}-${i}`}
              ref={(el) => {
                optionRefs.current[i] = el;
              }}
              type="button"
              tabIndex={i === focusIndex ? 0 : -1}
              aria-pressed={isSelected}
              aria-disabled={answered || undefined}
              onClick={() => answer(i)}
              onFocus={() => setFocusIndex(i)}
              className={cn(optionClass.base, optionClass[state])}
            >
              <kbd
                className={cn(
                  "mt-px inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded border bg-muted px-1 font-mono text-[11px] text-muted-foreground",
                  state === "correct" && correctToken.fg,
                  state === "wrong" && wrongToken.fg,
                )}
              >
                {i + 1}
              </kbd>
              <span className="min-w-0 flex-1">{choice}</span>
              {state === "correct" && (
                <Check className={cn("h-4 w-4 shrink-0", correctToken.fg)} aria-hidden="true" />
              )}
              {state === "wrong" && (
                <X className={cn("h-4 w-4 shrink-0", wrongToken.fg)} aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>

      <div aria-live="polite" className="min-h-0">
        {answered && (
          <div
            className={cn(
              "enter is-visible space-y-3 rounded-lg border p-4 text-sm",
              correct ? correctToken.bg : "bg-muted/40",
            )}
            data-visible=""
          >
            <p className="font-semibold">
              <span className={correct ? correctToken.fg : wrongToken.fg}>
                {correct ? "Correct." : "Not quite."}
              </span>{" "}
              {!correct && (
                <span className="font-normal">
                  The answer is <strong>{question.choices[question.answerIndex]}</strong>.
                </span>
              )}
            </p>
            <p className="text-muted-foreground">{question.explanation}</p>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link
                to={question.link.href}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                {question.link.label}
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
              <Button ref={nextRef} type="button" size="sm" onClick={next}>
                {index + 1 >= total ? "See results" : "Next question"}
                <ArrowRight aria-hidden="true" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Remounts (fresh state) whenever the question set changes. */
export function Quiz(props: QuizProps) {
  const key = useMemo(() => props.questions.map((q) => q.id).join("|"), [props.questions]);
  return <QuizInner key={key} {...props} />;
}

export default Quiz;

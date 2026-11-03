import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, Trophy } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/content/EmptyState";
import { Button } from "@/components/ui/button";
import { Quiz, type QuizCompletion } from "@/components/quiz/Quiz";
import { LearningStepper } from "@/components/learn/LearningStepper";
import { useLearningProgress } from "@/components/learn/useLearningProgress";
import { useReveal } from "@/hooks/useReveal";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { getIcon } from "@/lib/icons";
import { stagger } from "@/lib/motion";
import { useProgressStore } from "@/lib/progress";
import { cn } from "@/lib/utils";
import {
  LEARNING_STEPS,
  PASS_RATIO,
  getLearningStep,
  isQuizPassed,
  learningStepPath,
  nextLearningStep,
  previousLearningStep,
  type LearningStep,
} from "@/data/learningPath";
import {
  CHALLENGE_PLAN,
  CHALLENGE_QUIZ_ID,
  CHALLENGE_TITLE,
  STEP_QUIZ_PLAN,
  buildChallengeQuiz,
  buildStepQuiz,
} from "@/data/quizzes";

const PASS_PCT = Math.round(PASS_RATIO * 100);
const QUESTIONS_PER_STEP = STEP_QUIZ_PLAN.components.length;
const READING_COUNT = LEARNING_STEPS.reduce((n, s) => n + s.readings.length, 0);

function BestScore({ quizId }: { quizId: string }) {
  const result = useProgressStore((s) => s.quizzes[quizId]);
  if (!result) return null;
  const passed = isQuizPassed(result);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs tabular-nums",
        passed ? "border-primary/40 text-primary" : "text-muted-foreground",
      )}
    >
      Best {result.score}/{result.total}
    </span>
  );
}

// ─── Overview (/learn) ──────────────────────────────────────────────────────

function ChallengeSection() {
  const [attempt, setAttempt] = useState(0);
  const quiz = useMemo(() => buildChallengeQuiz({ attempt }), [attempt]);
  const { hash } = useLocation();
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (hash === `#${CHALLENGE_QUIZ_ID}`) {
      ref.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    }
  }, [hash, reduced]);

  return (
    <section
      id={CHALLENGE_QUIZ_ID}
      ref={ref}
      aria-labelledby="challenge-heading"
      className="scroll-mt-20 space-y-4 rounded-xl border bg-muted/20 p-4 md:p-6"
    >
      <div className="flex items-start gap-3">
        <Trophy className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
        <div className="space-y-1">
          <h2 id="challenge-heading" className="text-xl font-semibold tracking-tight">
            {CHALLENGE_TITLE}
          </h2>
          <p className="text-sm text-muted-foreground">
            {CHALLENGE_PLAN.length} questions drawn from every dataset on the site — new ones each
            day. <BestScore quizId={CHALLENGE_QUIZ_ID} />
          </p>
        </div>
      </div>
      <Quiz
        quizId={quiz.id}
        title={CHALLENGE_TITLE}
        questions={quiz.questions}
        onNewQuestions={() => setAttempt((a) => a + 1)}
      />
    </section>
  );
}

function Overview() {
  const progress = useLearningProgress();
  const doneSet = new Set(progress.completedIds);
  const current = getLearningStep(progress.currentStepId) ?? LEARNING_STEPS[0];
  const { ref } = useReveal<HTMLOListElement>();

  return (
    <PageLayout
      title="Learning path"
      description={`Learn agentic AI security in ${LEARNING_STEPS.length} steps — components, threats, controls, AISVS, NIST and threat modeling — each with readings and a short generated quiz.`}
      canonicalPath="/learn"
      className="space-y-10"
    >
      <PageHeader
        eyebrow="Learn"
        title="Learning path"
        description={`${LEARNING_STEPS.length} steps from the building blocks of an agent to a working threat model. Read a few pages, then pass a ${QUESTIONS_PER_STEP}-question quiz with ${PASS_PCT} % to complete each step.`}
        stats={[
          { label: "steps", value: progress.total },
          { label: "completed", value: progress.completed },
          { label: "readings", value: READING_COUNT },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to={learningStepPath(current.id)}>
                {progress.done
                  ? "Review the path"
                  : progress.completed
                    ? `Continue: step ${current.number}`
                    : "Start the path"}
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/progress">Your progress</Link>
            </Button>
          </div>
        }
      />

      <ol ref={ref} className="grid gap-3 md:grid-cols-2" aria-label="Steps">
        {LEARNING_STEPS.map((step, i) => {
          const done = doneSet.has(step.id);
          const upNext = !progress.done && step.id === progress.currentStepId;
          const Icon = getIcon(step.icon, BookOpen);
          return (
            <li key={step.id} className="enter" style={stagger(i)}>
              <Link
                to={learningStepPath(step.id)}
                className={cn(
                  "card-hover flex h-full gap-4 rounded-xl border bg-card p-4 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  upNext && "border-primary/60",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border font-mono text-sm",
                    done
                      ? "border-primary bg-primary text-primary-foreground"
                      : upNext
                        ? "border-primary text-primary"
                        : "text-muted-foreground",
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : step.number}
                </span>
                <span className="min-w-0 flex-1 space-y-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <span className="font-semibold">
                      <span className="sr-only">Step {step.number}: </span>
                      {step.title}
                    </span>
                    {done && <span className="sr-only">(completed)</span>}
                    {upNext && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        Up next
                      </span>
                    )}
                  </span>
                  <span className="block text-sm text-muted-foreground">{step.summary}</span>
                  <span className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
                    <span>
                      {step.readings.length} readings · {STEP_QUIZ_PLAN[step.id].length}-question
                      quiz
                    </span>
                    <BestScore quizId={step.quizId} />
                  </span>
                </span>
                <ChevronRight
                  className="mt-2 h-4 w-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
              </Link>
            </li>
          );
        })}
      </ol>

      <ChallengeSection />
    </PageLayout>
  );
}

// ─── Step page (/learn/:stepId) ─────────────────────────────────────────────

function StepPage({ step }: { step: LearningStep }) {
  const done = useProgressStore((s) => s.path[step.id] === true);
  const setPathStep = useProgressStore((s) => s.setPathStep);
  const [attempt, setAttempt] = useState(0);
  const quiz = useMemo(() => buildStepQuiz(step.id, { attempt }), [step.id, attempt]);
  const next = nextLearningStep(step.id);
  const prev = previousLearningStep(step.id);
  const { ref } = useReveal<HTMLUListElement>();

  const onComplete = (r: QuizCompletion) => {
    if (r.passed && !done) setPathStep(step.id, true);
  };

  const continueAction = (r: QuizCompletion) =>
    r.passed ? (
      <Button asChild>
        <Link to={next ? learningStepPath(next.id) : "/progress"}>
          {next ? `Continue: ${next.title}` : "See your progress"}
          <ArrowRight aria-hidden="true" />
        </Link>
      </Button>
    ) : null;

  return (
    <PageLayout
      title={`${step.title} · Learning path`}
      description={step.summary}
      canonicalPath={learningStepPath(step.id)}
      className="space-y-8"
    >
      <LearningStepper activeId={step.id} />

      <PageHeader
        eyebrow={`Step ${step.number} of ${LEARNING_STEPS.length}`}
        title={step.title}
        description={step.summary}
        actions={
          <Button asChild variant="ghost" size="sm">
            <Link to="/learn">
              <ArrowLeft aria-hidden="true" />
              All steps
            </Link>
          </Button>
        }
      >
        {done && (
          <p className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-sm text-primary">
            <Check className="h-4 w-4" aria-hidden="true" />
            Step complete
            {next && (
              <>
                {" "}
                ·{" "}
                <Link
                  to={learningStepPath(next.id)}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  next: {next.title}
                </Link>
              </>
            )}
          </p>
        )}
      </PageHeader>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section aria-labelledby="readings-heading" className="space-y-3">
          <h2 id="readings-heading" className="text-lg font-semibold">
            1 · Read
          </h2>
          <ul ref={ref} className="space-y-2">
            {step.readings.map((r, i) => (
              <li key={r.path} className="enter" style={stagger(i)}>
                <Link
                  to={r.path}
                  className="card-hover flex items-start gap-3 rounded-lg border bg-card p-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{r.label}</span>
                    <span className="block text-xs text-muted-foreground">{r.description}</span>
                  </span>
                  <ChevronRight
                    className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="quiz-heading" className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="quiz-heading" className="text-lg font-semibold">
              2 · Check yourself
            </h2>
            <p className="text-xs text-muted-foreground">
              Pass with {Math.ceil(quiz.questions.length * PASS_RATIO)} of {quiz.questions.length}{" "}
              to complete the step. <BestScore quizId={step.quizId} />
            </p>
          </div>
          <div className="rounded-xl border bg-muted/20 p-4 md:p-5">
            <Quiz
              quizId={quiz.id}
              title={quiz.title}
              questions={quiz.questions}
              onComplete={onComplete}
              onNewQuestions={() => setAttempt((a) => a + 1)}
              resultActions={continueAction}
            />
          </div>
        </section>
      </div>

      <nav
        aria-label="Previous and next step"
        className="flex flex-wrap justify-between gap-3 border-t pt-6"
      >
        {prev ? (
          <Button asChild variant="outline">
            <Link to={learningStepPath(prev.id)}>
              <ArrowLeft aria-hidden="true" />
              Step {prev.number}: {prev.title}
            </Link>
          </Button>
        ) : (
          <span />
        )}
        {next ? (
          <Button asChild variant="outline">
            <Link to={learningStepPath(next.id)}>
              Step {next.number}: {next.title}
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        ) : (
          <Button asChild variant="outline">
            <Link to="/progress">
              Your progress
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        )}
      </nav>
    </PageLayout>
  );
}

export default function Learn() {
  const { stepId } = useParams<{ stepId?: string }>();
  if (!stepId) return <Overview />;
  const step = getLearningStep(stepId);
  if (!step) {
    return (
      <PageLayout
        title="Step not found"
        description="This learning-path step does not exist."
        canonicalPath={`/learn/${stepId}`}
        noindex
      >
        <EmptyState
          icon="book-open"
          title="Step not found"
          description={`There is no learning-path step called “${stepId}”.`}
          action={{ label: "See all steps", href: "/learn" }}
        />
      </PageLayout>
    );
  }
  return <StepPage key={step.id} step={step} />;
}

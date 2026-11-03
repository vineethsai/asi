import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, GraduationCap } from "lucide-react";
import { Ring } from "@/components/charts/Ring";
import { useProgress, useProgressSummary } from "@/hooks/useProgress";
import { useLearningProgress } from "@/components/learn/useLearningProgress";
import { getLearningStep, learningStepPath } from "@/data/learningPath";
import { SITE_STATS } from "./siteStats";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * "Your progress" (6.1 item 4) from the shared progress store. When nothing has been recorded
 * it becomes a "Start the learning path" call to action.
 */
export function ProgressCard() {
  const summary = useProgressSummary();
  const path = useLearningProgress();
  const pathStarted = path.completed > 0;
  const currentStep = getLearningStep(path.currentStepId);
  const quizzes = useProgress((s) => s.quizzes);
  const lastQuiz = useMemo(
    () =>
      Object.entries(quizzes)
        .map(([id, r]) => ({ id, ...r }))
        .sort((a, b) => b.at.localeCompare(a.at))[0],
    [quizzes],
  );

  const empty =
    summary.aisvsChecked === 0 &&
    summary.controlsStarted === 0 &&
    summary.checklistDone === 0 &&
    summary.quizzesTaken === 0 &&
    summary.pathStepsDone === 0;

  if (empty) {
    return (
      <article
        className="flex h-full flex-col justify-between rounded-lg border border-dashed bg-card p-5"
        aria-labelledby="progress-title"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Your progress
          </p>
          <h3 id="progress-title" className="mt-3 flex items-center gap-2 text-lg font-semibold">
            <GraduationCap className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            Start the learning path
          </h3>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Work from components to threats, controls and verification. Progress on AISVS
            requirements, control checklists and quizzes is saved in this browser and shows up here.
          </p>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <Link
            to="/learn"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Start the learning path <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
          <Link to="/aisvs" className="link-underline text-muted-foreground hover:text-foreground">
            or begin with the {SITE_STATS.aisvsRequirements} AISVS requirements
          </Link>
        </div>
      </article>
    );
  }

  const aisvsTotal = SITE_STATS.aisvsRequirements;
  const rows: { label: string; value: string; to: string }[] = [
    {
      label: "Controls started",
      value: `${summary.controlsStarted} of ${SITE_STATS.controls}`,
      to: "/controls",
    },
    { label: "Control tasks done", value: String(summary.controlTasksDone), to: "/controls" },
    { label: "Checklist items done", value: String(summary.checklistDone), to: "/interactive" },
  ];
  if (lastQuiz) {
    rows.push({
      label: "Last quiz",
      value: `${lastQuiz.score}/${lastQuiz.total} · ${formatDate(lastQuiz.at)}`,
      to: "/learn",
    });
  }

  return (
    <article
      className="flex h-full flex-col rounded-lg border bg-card p-5"
      aria-labelledby="progress-title"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">Your progress</p>
      <h3 id="progress-title" className="sr-only">
        Your progress
      </h3>
      {pathStarted && (
        <Link
          to={path.done ? "/learn" : learningStepPath(path.currentStepId)}
          className="mt-3 flex items-center gap-3 rounded-md border bg-muted/30 px-3 py-2 text-sm transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <GraduationCap className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block font-medium">
              {path.done
                ? `Learning path complete: ${path.completed} of ${path.total} steps`
                : `Step ${path.currentStep} of ${path.total}`}
            </span>
            {!path.done && currentStep && (
              <span className="block truncate text-xs text-muted-foreground">
                Next: {currentStep.title} · {path.completed} done
              </span>
            )}
          </span>
          <span
            className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-muted"
            aria-hidden="true"
          >
            <span
              className="block h-full rounded-full bg-primary"
              style={{ width: `${path.percent}%` }}
            />
          </span>
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        </Link>
      )}
      <div className="mt-3 flex items-center gap-4">
        <Ring
          value={summary.aisvsChecked}
          max={aisvsTotal}
          size={72}
          tone="progress"
          ariaLabel={`AISVS: ${summary.aisvsChecked} of ${aisvsTotal} requirements verified`}
        />
        <div className="min-w-0">
          <p className="text-sm font-medium">AISVS verification</p>
          <p className="text-xs text-muted-foreground">
            {summary.aisvsChecked} of {aisvsTotal} requirements checked
          </p>
          <Link
            to="/aisvs"
            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Continue <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        </div>
      </div>
      <dl className="mt-4 divide-y rounded-md border text-sm">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-3 px-3 py-2">
            <dt className="text-muted-foreground">
              <Link to={r.to} className="hover:text-foreground hover:underline">
                {r.label}
              </Link>
            </dt>
            <dd className="font-mono tabular-nums">{r.value}</dd>
          </div>
        ))}
      </dl>
      {summary.hasArchivedAisvs && (
        <p className="mt-3 text-xs text-muted-foreground">
          Progress from the earlier AISVS draft is archived; see the AISVS page.
        </p>
      )}
    </article>
  );
}

export default ProgressCard;

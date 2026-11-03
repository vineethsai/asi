/**
 * LearningStepper — the six learning-path steps as a horizontal stepper (P4-01).
 *
 * Props:
 *   activeId?: LearningStepId   — the step page being shown (aria-current="step")
 *   className?: string
 *
 * Status comes from the progress store: done steps show a check, the first incomplete step is
 * marked "Up next". Every step is a link (the order is a suggestion, not a lock).
 */
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { LEARNING_STEPS, learningStepPath, type LearningStepId } from "@/data/learningPath";
import { useLearningProgress } from "./useLearningProgress";

export interface LearningStepperProps {
  activeId?: LearningStepId;
  className?: string;
}

export function LearningStepper({ activeId, className }: LearningStepperProps) {
  const { completedIds, currentStepId, done: allDone } = useLearningProgress();
  const doneSet = new Set(completedIds);

  return (
    <nav aria-label="Learning path steps" className={className}>
      <ol className="grid grid-cols-6 gap-1.5 sm:gap-2">
        {LEARNING_STEPS.map((step) => {
          const done = doneSet.has(step.id);
          const active = step.id === activeId;
          const upNext = !allDone && step.id === currentStepId;
          const status = done ? "completed" : upNext ? "up next" : "not started";
          return (
            <li key={step.id} className="min-w-0">
              <Link
                to={learningStepPath(step.id)}
                aria-current={active ? "step" : undefined}
                aria-label={`Step ${step.number}: ${step.title} (${status})`}
                className={cn(
                  "group flex h-full flex-col gap-1.5 rounded-md p-1.5 text-xs outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring sm:p-2",
                  active ? "bg-accent" : "hover:bg-accent/60",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-1.5 w-full rounded-full transition-colors duration-500",
                    done ? "bg-primary" : upNext ? "bg-primary/40" : "bg-muted",
                  )}
                />
                <span className="flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] tabular-nums",
                      done
                        ? "border-primary bg-primary text-primary-foreground"
                        : active || upNext
                          ? "border-primary text-primary"
                          : "text-muted-foreground",
                    )}
                  >
                    {done ? <Check className="h-3 w-3" /> : step.number}
                  </span>
                  <span
                    className={cn(
                      "hidden truncate font-medium sm:block",
                      active
                        ? "text-foreground"
                        : "text-muted-foreground group-hover:text-foreground",
                    )}
                  >
                    {step.short}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default LearningStepper;

/**
 * PhaseChecklist — one lifecycle phase of a control rendered through <RichText>, with each
 * single-list section as a checklist bound to the shared progress store (useControlProgress).
 * Used by ControlDetail (phase tabs) and the Lifecycle view (inline panel).
 *
 * Props: control; phase; variant?: RichText variant (default "prose"); showProgress? (default true)
 */
import { useMemo } from "react";
import type { Mitigation } from "@/components/components/securityData";
import { RichText } from "@/components/content/RichText";
import type { Phase } from "@/components/content/PhaseBadge";
import { Progress } from "@/components/ui/progress";
import { useControlProgress } from "@/hooks/useProgress";
import { cn } from "@/lib/utils";
import { PHASE_META, phaseDoneCount, phaseSections, phaseTaskTotal } from "./phaseTasks";
import { renderCodeBlock } from "./renderCode";

export interface PhaseChecklistProps {
  control: Mitigation;
  phase: Phase;
  variant?: "prose" | "compact";
  showProgress?: boolean;
  className?: string;
}

export function PhaseChecklist({
  control,
  phase,
  variant = "prose",
  showProgress = true,
  className,
}: PhaseChecklistProps) {
  const { done, set } = useControlProgress(control.id);
  const sections = phaseSections(control, phase);
  const total = phaseTaskTotal(control, phase);
  const completed = phaseDoneCount(done, control, phase);
  const pct = total ? Math.round((completed / total) * 100) : 0;
  const label = PHASE_META[phase].label;

  const checklist = useMemo(
    () => (idPrefix: string) => ({
      idPrefix,
      isChecked: (id: string) => done.has(id),
      onToggle: (id: string, checked: boolean) => set(id, checked),
    }),
    [done, set],
  );

  if (!sections.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No {label.toLowerCase()} guidance is documented for this control.
      </p>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {showProgress && (
        <div className="flex flex-wrap items-center gap-3 rounded-md border bg-muted/30 px-3 py-2">
          {total > 0 ? (
            <>
              <span className="text-sm font-medium tabular-nums">
                {completed}/{total} {label.toLowerCase()} tasks done
              </span>
              <Progress
                value={pct}
                aria-label={`${label} tasks completed`}
                aria-valuetext={`${completed} of ${total} (${pct}%)`}
                className="h-2 min-w-[6rem] flex-1"
              />
              <span className="text-xs tabular-nums text-muted-foreground">{pct}%</span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">
              Guidance only: this phase has no checklist items.
            </span>
          )}
        </div>
      )}
      {sections.map((s) => (
        <section key={s.idPrefix} className="space-y-2">
          {s.heading && <RichText text={s.heading} variant={variant} />}
          {s.body && (
            <RichText
              text={s.body}
              variant={variant}
              renderCode={renderCodeBlock}
              checklist={s.taskCount ? checklist(s.idPrefix) : undefined}
            />
          )}
        </section>
      ))}
    </div>
  );
}

export default PhaseChecklist;

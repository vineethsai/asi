/**
 * LifecycleView — Design → Build → Operations lanes (§6.9). Each lane lists the controls that
 * apply in that phase as chips with a phase progress ring; selecting a chip (or arriving with
 * `?control=<id>&phase=<phase>`) opens that control's phase tasks inline as a checklist bound to
 * the shared progress store.
 */
import { useEffect, useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, ChevronRight, X } from "lucide-react";
import type { Mitigation } from "@/components/components/securityData";
import { PhaseBadge, type Phase } from "@/components/content/PhaseBadge";
import { Ring } from "@/components/charts/Ring";
import { Button } from "@/components/ui/button";
import { useProgress } from "@/hooks/useProgress";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";
import { CONTROL_LIST, controlById } from "@/components/controls/controlIndex";
import { PhaseChecklist } from "@/components/controls/PhaseChecklist";
import {
  PHASE_META,
  PHASE_ORDER,
  isPhase,
  phaseApplies,
  phaseTaskIds,
} from "@/components/controls/phaseTasks";
import { SegmentedControl } from "@/components/threats/SegmentedControl";
import { controlCode } from "@/components/threats/threatIndex";

const EMPTY: ReadonlySet<string> = new Set();

export interface LifecycleViewProps {
  /** Restrict the lanes to these controls (e.g. a search result); defaults to all. */
  controls?: readonly Mitigation[];
  className?: string;
}

export function LifecycleView({ controls = CONTROL_LIST, className }: LifecycleViewProps) {
  const [params, setParams] = useSearchParams();
  const progress = useProgress((s) => s.controls);
  const reduced = useReducedMotion();
  const panelRef = useRef<HTMLElement>(null);

  const selected = controlById(params.get("control"));
  const phaseParam = params.get("phase");
  const phase: Phase = isPhase(phaseParam)
    ? phaseParam
    : (PHASE_ORDER.find((p) => selected && phaseApplies(selected, p)) ?? "design");

  const select = (id: string | null, p?: Phase) => {
    const next = new URLSearchParams(params);
    if (id) next.set("control", id);
    else next.delete("control");
    if (id && p) next.set("phase", p);
    else next.delete("phase");
    setParams(next, { replace: true });
  };

  const lanes = useMemo(
    () =>
      PHASE_ORDER.map((p) => {
        const list = controls.filter((m) => phaseApplies(m, p));
        let total = 0;
        let done = 0;
        const perControl = new Map<string, { total: number; done: number }>();
        for (const m of list) {
          const ids = phaseTaskIds(m, p);
          const set = progress[m.id] ?? EMPTY;
          const d = ids.filter((id) => set.has(id)).length;
          perControl.set(m.id, { total: ids.length, done: d });
          total += ids.length;
          done += d;
        }
        return { phase: p, controls: list, total, done, perControl };
      }),
    [controls, progress],
  );

  const selectedKey = selected ? `${selected.id}:${phase}` : "";
  useEffect(() => {
    if (!selectedKey) return;
    panelRef.current?.scrollIntoView?.({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
  }, [selectedKey, reduced]);

  return (
    <div className={className}>
      <ol className="grid gap-4 lg:grid-cols-3" aria-label="Lifecycle phases">
        {lanes.map((lane, li) => (
          <li key={lane.phase} className="relative flex flex-col rounded-lg border bg-card p-4">
            {li < lanes.length - 1 && (
              <ChevronRight
                aria-hidden
                className="absolute -right-4 top-8 z-10 hidden h-6 w-6 rounded-full border bg-background p-0.5 text-muted-foreground lg:block"
              />
            )}
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="flex items-center gap-2 text-base font-semibold">
                  <span className="font-mono text-xs text-muted-foreground">{li + 1}</span>
                  <PhaseBadge phase={lane.phase} />
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {PHASE_META[lane.phase].blurb}
                </p>
              </div>
              <Ring
                value={lane.done}
                max={Math.max(1, lane.total)}
                size={56}
                thickness={6}
                tone="progress"
                ariaLabel={`${PHASE_META[lane.phase].label}: ${lane.done} of ${lane.total} tasks done across ${lane.controls.length} controls`}
                className="shrink-0"
              />
            </div>
            <p className="mb-2 text-xs tabular-nums text-muted-foreground">
              {lane.controls.length} controls · {lane.done}/{lane.total} tasks done
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {lane.controls.map((m) => {
                const pc = lane.perControl.get(m.id) ?? { total: 0, done: 0 };
                const active = selected?.id === m.id && phase === lane.phase;
                const complete = pc.total > 0 && pc.done === pc.total;
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      aria-pressed={active}
                      aria-controls="lifecycle-panel"
                      title={m.name}
                      onClick={() => (active ? select(null) : select(m.id, lane.phase))}
                      className={cn(
                        "inline-flex h-7 items-center gap-1.5 rounded-md border px-2 font-mono text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "bg-muted/40 hover:border-primary/50 hover:bg-primary/5",
                        complete && !active && "border-emerald-500/50",
                      )}
                    >
                      {controlCode(m.id)}
                      {pc.total > 0 && (
                        <span
                          className={cn(
                            "tabular-nums",
                            active ? "opacity-80" : "text-muted-foreground",
                          )}
                        >
                          {pc.done}/{pc.total}
                        </span>
                      )}
                      <span className="sr-only">
                        {" "}
                        {m.name}, {PHASE_META[lane.phase].label.toLowerCase()} tasks
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ol>

      <section
        id="lifecycle-panel"
        ref={panelRef}
        aria-live="polite"
        aria-label={
          selected ? `${selected.name}: ${PHASE_META[phase].label} tasks` : "Selected control"
        }
        className="mt-6 scroll-mt-24"
      >
        {selected ? (
          <div className="rounded-lg border bg-card p-4 md:p-6">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="font-mono text-xs text-muted-foreground">
                  {controlCode(selected.id)}
                </span>
                <h2 className="text-lg font-semibold">{selected.name}</h2>
                <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                  {selected.description}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link to={`/controls/${selected.id}?tab=${phase}`}>
                    Open control <ArrowRight aria-hidden className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => select(null)}
                  aria-label="Close tasks"
                >
                  <X aria-hidden className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <SegmentedControl
              label="Phase"
              value={phase}
              onValueChange={(v) => select(selected.id, v as Phase)}
              options={PHASE_ORDER.filter((p) => phaseApplies(selected, p)).map((p) => ({
                value: p,
                label: PHASE_META[p].label,
              }))}
              className="mb-4"
            />
            <PhaseChecklist control={selected} phase={phase} variant="compact" />
          </div>
        ) : (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Select a control in any phase to work through its tasks here. Progress is saved in this
            browser and shared with the control pages.
          </p>
        )}
      </section>
    </div>
  );
}

export default LifecycleView;

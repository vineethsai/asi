/**
 * ScenarioWalkthrough — narrative stepper + architecture diagram for one scenario (P4-03).
 *
 * One state machine (`useAttackPath`, src/components/visual) drives both the diagram highlight
 * (moving dot along the edge, node pulse, §8.5) and the narrative. Prev/next buttons, the step
 * list and ←/→ (Home/End) when focus is inside the walkthrough all move the same index;
 * Play walks the path automatically. Reduced motion: no dots or pulses (handled by the hook).
 */
import { useEffect, useMemo, useRef, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import ArchitectureFlowDiagram from "@/components/visual/ArchitectureFlowDiagram";
import { getArchitectureFlow } from "@/components/visual/architectureFlows";
import { useAttackPath } from "@/components/visual/useAttackPath";
import { RichText } from "@/components/content/RichText";
import { SeverityBadge } from "@/components/content/SeverityBadge";
import { Button } from "@/components/ui/button";
import { threatsData } from "@/components/components/securityData";
import { architecturesData } from "@/components/components/architecturesData";
import { useReveal } from "@/hooks/useReveal";
import { kcLabel } from "@/data/kc";
import { severityColor } from "@/lib/severity";
import { cn } from "@/lib/utils";
import type { Scenario } from "@/data/scenarios";
import { isTypingTarget } from "@/components/layout/commandPaletteContext";
import { toAttackPathSteps } from "./attackSteps";

export function ScenarioWalkthrough({ scenario }: { scenario: Scenario }) {
  const steps = useMemo(() => toAttackPathSteps(scenario), [scenario]);
  const flow = getArchitectureFlow(scenario.archId);
  const nodeLabel = useMemo(
    () => new Map(flow?.nodes.map((n) => [n.id, n.data.label]) ?? []),
    [flow],
  );
  const { ref: revealRef, isVisible } = useReveal<HTMLDivElement>({ rootMargin: "0px" });
  const ap = useAttackPath(steps, { active: isVisible });
  const total = scenario.steps.length;
  const index = Math.max(0, Math.min(total - 1, ap.index));
  const step = scenario.steps[index];
  const listRef = useRef<HTMLOListElement | null>(null);
  const started = useRef(false);

  // Show the entry step on the diagram from the start (no autoplay).
  useEffect(() => {
    if (started.current || !steps.length) return;
    started.current = true;
    ap.goTo(0);
  }, [ap, steps.length]);

  const go = (i: number) => {
    if (steps.length) ap.goTo(Math.max(0, Math.min(total - 1, i)));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
    const to =
      e.key === "ArrowRight" || e.key === "ArrowDown"
        ? index + 1
        : e.key === "ArrowLeft" || e.key === "ArrowUp"
          ? index - 1
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? total - 1
              : null;
    if (to === null) return;
    e.preventDefault();
    go(to);
    const btn =
      listRef.current?.querySelectorAll<HTMLButtonElement>("button[data-step]")[
        Math.max(0, Math.min(total - 1, to))
      ];
    if (btn && listRef.current?.contains(document.activeElement)) btn.focus();
  };

  const archName = architecturesData[scenario.archId]?.name ?? scenario.archId;
  const where = step.nodeId
    ? nodeLabel.get(step.nodeId)
    : step.kc
      ? `${kcLabel(step.kc, { short: true })} (not drawn in this diagram)`
      : undefined;

  return (
    <div
      ref={revealRef}
      onKeyDown={onKeyDown}
      className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]"
      role="group"
      aria-label={`Walkthrough: ${scenario.title}`}
    >
      <div className="min-w-0 space-y-3">
        <ArchitectureFlowDiagram
          architectureId={scenario.archId}
          highlight={ap.highlight}
          className="h-[300px] w-full sm:h-[380px]"
          title={`${archName} — ${scenario.title}`}
        />
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={ap.playing ? ap.pause : ap.done ? ap.replay : ap.play}
            disabled={!steps.length}
          >
            {ap.playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
            {ap.playing ? "Pause" : ap.done ? "Replay" : "Play"}
          </Button>
          {where && (
            <span className="text-muted-foreground">
              Now at: <span className="font-medium text-foreground">{where}</span>
              {step.nodeId && step.kc && (
                <span className="text-muted-foreground">
                  {" "}
                  · {kcLabel(step.kc, { short: true })}
                </span>
              )}
            </span>
          )}
        </div>
      </div>

      <div className="min-w-0 space-y-4">
        <ol ref={listRef} className="space-y-2" aria-label="Steps">
          {scenario.steps.map((s, i) => {
            const active = i === index;
            const reached = i <= index;
            const threat = s.threatId ? threatsData[s.threatId] : undefined;
            return (
              <li key={`${s.title}-${i}`} className="rounded-lg border bg-card">
                <button
                  type="button"
                  data-step={i}
                  onClick={() => go(i)}
                  aria-current={active ? "step" : undefined}
                  aria-expanded={active}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                    active ? "bg-accent/60" : "hover:bg-accent/40",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] transition-colors",
                      !reached && "text-muted-foreground",
                    )}
                    style={
                      reached
                        ? {
                            borderColor: severityColor(s.severity),
                            color: severityColor(s.severity, "fg"),
                          }
                        : undefined
                    }
                  >
                    {i + 1}
                  </span>
                  <span
                    className={cn("min-w-0 flex-1 font-medium", !active && "text-muted-foreground")}
                  >
                    {s.title}
                  </span>
                  <SeverityBadge band={s.severity} size="xs" showLabel={false} />
                </button>
                {active && (
                  <div className="enter is-visible space-y-2 px-3 pb-3 pt-1" data-visible="">
                    <RichText text={s.narrative} variant="compact" glossary={false} />
                    {threat && (
                      <Link
                        to={`/threats/${threat.id}`}
                        className="inline-block text-xs font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {threat.code} {threat.shortName ?? threat.name} in the threat catalog
                      </Link>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => go(index - 1)}
            disabled={index <= 0}
          >
            <ChevronLeft aria-hidden="true" />
            Previous
          </Button>
          <span className="text-xs tabular-nums text-muted-foreground" aria-live="polite">
            Step {index + 1} of {total}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => go(index + 1)}
            disabled={index >= total - 1}
          >
            Next
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
        <p className="hidden text-xs text-muted-foreground sm:block">
          Tip: use <kbd className="font-mono">←</kbd> <kbd className="font-mono">→</kbd> to move
          between steps.
        </p>
      </div>
    </div>
  );
}

export default ScenarioWalkthrough;

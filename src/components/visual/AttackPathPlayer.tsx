/**
 * AttackPathPlayer — reusable attack-path sequencer (IMPROVEMENT_PLAN §8.5) for
 * <ArchitectureFlowDiagram> (or any canvas via the render prop).
 *
 * Animates one hop per step: the edge turns `animated` with a moving dot (SVG animateMotion
 * along the edge path, `hopMs` ≈ 1.2 s), then the affected node pulses (box-shadow
 * 0 → 8 px severity colour → 0, 900 ms × 2). Play / pause / previous / next / replay controls
 * and per-step dots have aria-labels; the caption is an aria-live region and the whole walk is
 * also listed for screen readers. Reduced motion shows the final frame (no dots or pulses).
 *
 * Props:
 *   steps: { nodeId; edgeId?; caption; severity?; reverse?; affected? }[]   (AttackPathStep)
 *   autoplay?: boolean            — start when the player first scrolls into view
 *                                   (IntersectionObserver via useReveal); default false
 *   onStepChange?: (index, step) => void
 *   architectureId?: string       — render ArchitectureFlowDiagram for this pattern
 *   children?: (state) => ReactNode — custom canvas; receives useAttackPath state (`highlight`)
 *   hopMs?: number (1200); title?: string; className?; diagramClassName?
 *   showCaption?: boolean (true); controls?: "full" | "compact" ("full")
 *   toolbar?: ReactNode           — extra controls rendered at the end of the control row
 *
 * Usage:
 *   const path = buildAttackPath("reactive", arch.relevantThreats[0]);
 *   <AttackPathPlayer architectureId="reactive" steps={path.steps} autoplay />
 *
 * Helpers for other canvases: `useAttackPath` (./useAttackPath), `buildAttackPath`,
 * `highlightForStep` and the `AttackPathStep` / `AttackHighlight` types (./attackPath).
 */

import { useMemo, type ReactNode } from "react";
import { Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReveal } from "@/hooks/useReveal";
import { severityColor } from "@/lib/severity";
import { cn } from "@/lib/utils";
import ArchitectureFlowDiagram from "./ArchitectureFlowDiagram";
import type { AttackPathStep } from "./attackPath";
import { DEFAULT_HOP_MS, useAttackPath, type AttackPathState } from "./useAttackPath";

export type { AttackPathStep } from "./attackPath";

export interface AttackPathPlayerProps {
  steps: AttackPathStep[];
  autoplay?: boolean;
  onStepChange?: (index: number, step: AttackPathStep | undefined) => void;
  architectureId?: string;
  children?: (state: AttackPathState) => ReactNode;
  hopMs?: number;
  title?: string;
  className?: string;
  diagramClassName?: string;
  showCaption?: boolean;
  controls?: "full" | "compact";
  toolbar?: ReactNode;
}

function PlayerBody({
  steps,
  autoplay,
  active,
  onStepChange,
  architectureId,
  children,
  hopMs,
  title,
  diagramClassName,
  showCaption,
  controls,
  toolbar,
}: Omit<AttackPathPlayerProps, "className"> & { active: boolean }) {
  const ap = useAttackPath(steps, { autoplay, active, hopMs, onStepChange });
  const label = title ?? "Attack path";
  const canvas = children
    ? children(ap)
    : architectureId && (
        <ArchitectureFlowDiagram
          architectureId={architectureId}
          highlight={ap.highlight}
          className={diagramClassName}
          title={label}
        />
      );

  const btn = "h-8 w-8 p-0";
  const hasSteps = steps.length > 0;

  return (
    <>
      {canvas}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={btn}
          onClick={ap.toggle}
          disabled={!hasSteps}
          aria-label={ap.playing ? `Pause ${label}` : `Play ${label}`}
          title={ap.playing ? "Pause" : "Play"}
        >
          {ap.playing ? (
            <Pause className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Play className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
        {controls === "full" && (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={btn}
              onClick={ap.prev}
              disabled={!hasSteps || ap.index <= 0}
              aria-label="Previous step"
              title="Previous step"
            >
              <SkipBack className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={btn}
              onClick={ap.next}
              disabled={!hasSteps || ap.done}
              aria-label="Next step"
              title="Next step"
            >
              <SkipForward className="h-4 w-4" aria-hidden="true" />
            </Button>
          </>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 px-2.5"
          onClick={ap.replay}
          disabled={!hasSteps}
          aria-label={`Replay ${label}`}
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="text-xs">Replay</span>
        </Button>

        {controls === "full" && hasSteps && (
          <ol className="ml-1 flex items-center gap-1" aria-label="Steps">
            {steps.map((s, i) => {
              const reached = i <= ap.index;
              return (
                <li key={`${s.nodeId}-${i}`}>
                  <button
                    type="button"
                    onClick={() => ap.goTo(i)}
                    aria-label={`Step ${i + 1} of ${steps.length}: ${s.caption}`}
                    aria-current={i === ap.index ? "step" : undefined}
                    className="flex h-6 w-6 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "block rounded-full transition-all",
                        i === ap.index ? "h-2.5 w-2.5" : "h-2 w-2",
                        !reached && "bg-muted-foreground/30",
                      )}
                      style={
                        reached
                          ? { backgroundColor: severityColor(s.severity ?? "high") }
                          : undefined
                      }
                    />
                  </button>
                </li>
              );
            })}
          </ol>
        )}

        <span className="ml-auto text-xs tabular-nums text-muted-foreground">
          {hasSteps
            ? ap.index >= 0
              ? `Step ${ap.index + 1} of ${steps.length}`
              : `${steps.length} steps`
            : "No path for this pattern"}
        </span>
        {toolbar}
      </div>

      {showCaption && (
        <p className="mt-2 min-h-[2.5rem] text-sm text-muted-foreground" aria-live="polite">
          {ap.step?.caption ?? (hasSteps ? "Press play to walk the attack." : "")}
        </p>
      )}
      {hasSteps && (
        <ol className="sr-only" aria-label={`${label}, all steps`}>
          {steps.map((s, i) => (
            <li key={`${s.nodeId}-${i}`}>{s.caption}</li>
          ))}
        </ol>
      )}
    </>
  );
}

export function AttackPathPlayer({
  steps,
  autoplay = false,
  hopMs = DEFAULT_HOP_MS,
  className,
  diagramClassName = "w-full h-[320px]",
  showCaption = true,
  controls = "full",
  title,
  ...rest
}: AttackPathPlayerProps) {
  const { ref, isVisible } = useReveal<HTMLDivElement>({ rootMargin: "0px", threshold: 0.35 });
  // A new path remounts the sequencer so it starts from the beginning.
  const stepsKey = useMemo(
    () => steps.map((s) => `${s.nodeId}:${s.edgeId ?? ""}:${s.caption}`).join("|"),
    [steps],
  );

  return (
    <div ref={ref} className={className} role="group" aria-label={title ?? "Attack path"}>
      <PlayerBody
        key={stepsKey}
        steps={steps}
        autoplay={autoplay}
        active={isVisible}
        hopMs={hopMs}
        diagramClassName={diagramClassName}
        showCaption={showCaption}
        controls={controls}
        title={title}
        {...rest}
      />
    </div>
  );
}

export default AttackPathPlayer;

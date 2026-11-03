/**
 * StackedBars — "done vs total" bars per row, e.g. AISVS L1 / L2 / L3 (§9 "AISVS level stacks").
 * HTML bars (not SVG); widths grow from 0 (§8.4, CSS, reduced-motion safe). Every row prints
 * "done / total · pct %", so colour is never the only cue. Rows become toggle buttons when
 * `onSelect` is given (click filters to that level).
 *
 * Props:
 *   data: { id; label; done; total; band?: SeverityBand; color?: string; hint?: string }[]
 *   selectedId?: string | null; onSelect?: (id: string | null) => void   — click again to clear
 *   ariaLabel: string; title?; description?; legend?; toolbar?
 *   doneLabel?: string (default "done"); showPercent?: boolean (default true)
 *   compact?: boolean — thinner bars, no frame chrome
 *
 * Usage:
 *   <StackedBars ariaLabel="AISVS progress by level" title="Progress by level"
 *     data={[1,2,3].map((l) => ({ id: `L${l}`, label: `Level ${l}`, done: d[l], total: t[l], band: aisvsLevelBand(l) }))}
 *     selectedId={level} onSelect={setLevel} />
 */

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { severityColor, type SeverityBand } from "@/lib/severity";
import { ChartFrame } from "./ChartFrame";
import { CHART_MOTION, stagger, usePrefersReducedMotion } from "./motion";
import { percent } from "./chartUtils";

export interface StackedBarsDatum {
  id: string;
  label: string;
  done: number;
  total: number;
  band?: SeverityBand;
  color?: string;
  hint?: string;
}

export interface StackedBarsProps {
  data: StackedBarsDatum[];
  ariaLabel: string;
  title?: ReactNode;
  description?: ReactNode;
  legend?: ReactNode;
  toolbar?: ReactNode;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  doneLabel?: string;
  showPercent?: boolean;
  compact?: boolean;
  className?: string;
}

export function StackedBars({
  data,
  ariaLabel,
  title,
  description,
  legend,
  toolbar,
  selectedId,
  onSelect,
  doneLabel = "done",
  showPercent = true,
  compact = false,
  className,
}: StackedBarsProps) {
  const reduced = usePrefersReducedMotion();
  const [grown, setGrown] = useState(reduced);
  useEffect(() => {
    if (reduced) return setGrown(true);
    const id = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(id);
  }, [reduced]);

  return (
    <ChartFrame
      ariaLabel={ariaLabel}
      title={title}
      description={description}
      legend={legend}
      toolbar={toolbar}
      bare={compact}
      interactive={!!onSelect}
      empty={data.length === 0}
      className={className}
      table={{
        columns: ["Row", doneLabel, "Total", "Percent"],
        rows: data.map((d) => [d.label, d.done, d.total, `${percent(d.done, d.total)}%`]),
      }}
    >
      <ul className={cn(compact ? "space-y-2" : "space-y-3")}>
        {data.map((d, i) => {
          const pct = percent(d.done, d.total);
          const color = d.color ?? (d.band ? severityColor(d.band) : "hsl(var(--primary))");
          const selected = selectedId === d.id;
          const dimmed = selectedId != null && !selected;
          const body = (
            <>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate font-medium text-foreground">{d.label}</span>
                <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                  {d.done} / {d.total}
                  {showPercent && <span className="ml-1.5 text-foreground">{pct}%</span>}
                </span>
              </div>
              <div
                aria-hidden
                className={cn(
                  "relative mt-1.5 w-full overflow-hidden rounded-full bg-muted",
                  compact ? "h-1.5" : "h-2.5",
                )}
              >
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: grown ? `${pct}%` : "0%",
                    background: color,
                    transition: `width ${CHART_MOTION.barMs}ms ${CHART_MOTION.cssEase} ${stagger(i, reduced)}ms`,
                  }}
                />
              </div>
              {d.hint && <p className="mt-1 text-xs text-muted-foreground">{d.hint}</p>}
            </>
          );
          return (
            <li
              key={d.id}
              className={cn("transition-opacity", dimmed && "opacity-50")}
              data-id={d.id}
            >
              {onSelect ? (
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onSelect(selected ? null : d.id)}
                  className={cn(
                    "-mx-2 block w-[calc(100%+1rem)] rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selected && "bg-muted/60",
                  )}
                >
                  {body}
                </button>
              ) : (
                body
              )}
            </li>
          );
        })}
      </ul>
    </ChartFrame>
  );
}

export default StackedBars;

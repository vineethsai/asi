/**
 * CoverageBars — HTML stacked segments per row (§9 "Control coverage bars").
 * Row = e.g. an AISVS chapter; segments = controls covering it (control colour); segment width =
 * requirements covered. Segments are focusable buttons with a tooltip; each row prints its value
 * as text (percentage of `total` when given), so colour is never the only cue.
 *
 * Props:
 *   rows: { id; label; sublabel?; href?; total?: number; segments: { id; label; value; color?; href?; detail? }[] }[]
 *   ariaLabel: string; title?; description?; legend?; toolbar?
 *   max?: number               — value that maps to 100 % width (default: largest row sum or total)
 *   onSegmentClick?: (row, segment) => void; onRowClick?: (row) => void
 *   valueFormat?: (row, sum) => string   — default "sum / total (pct %)" or "sum"
 *   sort?: "none" | "desc"     — default "none"
 *   scale?: "shared" | "row"   — "shared" (default): one scale for all rows (`max`); "row": each
 *                                row's track is its own `total` (rows without `total` use `max`)
 *   row.filled?: number        — value the filled part represents (default: segment sum), e.g.
 *                                distinct requirements when segments overlap; segments split it
 *                                in proportion to their values
 *   labelWidth?: number        — px for the row label column on ≥ sm (default 180)
 *
 * Usage:
 *   <CoverageBars ariaLabel="AISVS chapters covered by controls" rows={rows}
 *     onSegmentClick={(_, s) => navigate(`/controls/${s.id}`)} />
 */

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { FRAMEWORK_ORDER, FRAMEWORK_PALETTE } from "@/lib/palette";
import { ChartFrame } from "./ChartFrame";
import { ChartTooltip } from "./ChartTooltip";
import { useChartTooltip } from "./useChartTooltip";
import { CHART_MOTION, stagger, usePrefersReducedMotion } from "./motion";
import { percent } from "./chartUtils";

export interface CoverageSegment {
  id: string;
  label: string;
  value: number;
  color?: string;
  href?: string;
  detail?: ReactNode;
}

export interface CoverageRow {
  id: string;
  label: string;
  sublabel?: string;
  href?: string;
  total?: number;
  /** Filled extent (defaults to the segment sum); segments share it proportionally. */
  filled?: number;
  segments: CoverageSegment[];
}

export interface CoverageBarsProps {
  rows: CoverageRow[];
  ariaLabel: string;
  title?: ReactNode;
  description?: ReactNode;
  legend?: ReactNode;
  toolbar?: ReactNode;
  max?: number;
  onSegmentClick?: (row: CoverageRow, segment: CoverageSegment) => void;
  onRowClick?: (row: CoverageRow) => void;
  valueFormat?: (row: CoverageRow, sum: number) => string;
  sort?: "none" | "desc";
  scale?: "shared" | "row";
  labelWidth?: number;
  className?: string;
}

const FALLBACK_COLORS = FRAMEWORK_ORDER.map((k) => FRAMEWORK_PALETTE[k].css);
const sumOf = (r: CoverageRow) => r.segments.reduce((n, s) => n + Math.max(0, s.value), 0);

export function CoverageBars({
  rows,
  ariaLabel,
  title,
  description,
  legend,
  toolbar,
  max,
  onSegmentClick,
  onRowClick,
  valueFormat,
  sort = "none",
  scale: scaleMode = "shared",
  labelWidth = 180,
  className,
}: CoverageBarsProps) {
  const reduced = usePrefersReducedMotion();
  const [grown, setGrown] = useState(reduced);
  useEffect(() => {
    if (reduced) return setGrown(true);
    const id = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(id);
  }, [reduced]);
  const {
    tip,
    show,
    hide,
    id: tipId,
  } = useChartTooltip<{ row: CoverageRow; seg: CoverageSegment }>();

  const sorted = useMemo(
    () => (sort === "desc" ? [...rows].sort((a, b) => sumOf(b) - sumOf(a)) : rows),
    [rows, sort],
  );
  const scale = max ?? Math.max(1, ...rows.map((r) => Math.max(sumOf(r), r.total ?? 0)));
  const fmt =
    valueFormat ??
    ((r: CoverageRow, s: number) =>
      r.total ? `${s} / ${r.total} (${percent(s, r.total)}%)` : `${s}`);

  return (
    <ChartFrame
      ariaLabel={ariaLabel}
      title={title}
      description={description}
      legend={legend}
      toolbar={toolbar}
      interactive
      empty={rows.length === 0}
      className={className}
      table={{
        columns: ["Row", "Segments", "Value"],
        rows: sorted.map((r) => [
          r.label,
          r.segments.map((s) => `${s.label}: ${s.value}`).join("; ") || "none",
          fmt(r, sumOf(r)),
        ]),
      }}
    >
      <ul className="space-y-2.5">
        {sorted.map((row, ri) => {
          const sum = sumOf(row);
          const filled = row.filled ?? sum;
          const denom = scaleMode === "row" && row.total ? row.total : scale;
          const labelEl = (
            <>
              <span className="block truncate text-sm font-medium text-foreground">
                {row.label}
              </span>
              {row.sublabel && (
                <span className="block truncate text-xs text-muted-foreground">{row.sublabel}</span>
              )}
            </>
          );
          return (
            <li
              key={row.id}
              className="grid grid-cols-1 items-center gap-x-3 gap-y-1 sm:grid-cols-[var(--cov-label)_1fr_auto]"
              style={{ ["--cov-label" as string]: `${labelWidth}px` }}
            >
              <div className="min-w-0">
                {onRowClick ? (
                  <button
                    type="button"
                    onClick={() => onRowClick(row)}
                    className="w-full rounded text-left hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {labelEl}
                  </button>
                ) : (
                  labelEl
                )}
              </div>
              <div className="relative h-5 w-full overflow-hidden rounded bg-muted">
                <div
                  className="absolute inset-y-0 left-0 flex gap-px"
                  style={{
                    width: grown ? `${Math.min(100, (filled / denom) * 100)}%` : "0%",
                    transition: `width ${CHART_MOTION.barMs}ms ${CHART_MOTION.cssEase} ${stagger(ri, reduced)}ms`,
                  }}
                >
                  {row.segments
                    .filter((s) => s.value > 0)
                    .map((seg, si) => {
                      const color = seg.color ?? FALLBACK_COLORS[si % FALLBACK_COLORS.length];
                      const label = `${row.label}: ${seg.label}, ${seg.value}`;
                      const open =
                        tip.open && tip.content?.seg.id === seg.id && tip.content.row.id === row.id;
                      return (
                        <button
                          key={seg.id}
                          type="button"
                          aria-label={label}
                          aria-describedby={open ? tipId : undefined}
                          onClick={() => onSegmentClick?.(row, seg)}
                          onMouseMove={(e) => show(e, { row, seg })}
                          onMouseLeave={hide}
                          onFocus={(e) => show(e.currentTarget, { row, seg })}
                          onBlur={hide}
                          className={cn(
                            "h-full min-w-[3px] transition-[filter] hover:brightness-110 focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                            !onSegmentClick && "cursor-default",
                          )}
                          style={{ flexGrow: seg.value, flexBasis: 0, background: color }}
                        />
                      );
                    })}
                </div>
              </div>
              <span className="whitespace-nowrap text-right font-mono text-xs tabular-nums text-muted-foreground">
                {fmt(row, sum)}
              </span>
            </li>
          );
        })}
      </ul>
      <ChartTooltip {...tip} id={tipId} onDismiss={hide}>
        {tip.content && (
          <div className="space-y-0.5">
            <p className="font-medium">{tip.content.seg.label}</p>
            <p className="text-muted-foreground">
              {tip.content.row.label}: {tip.content.seg.value}
            </p>
            {tip.content.seg.detail}
          </div>
        )}
      </ChartTooltip>
    </ChartFrame>
  );
}

export default CoverageBars;

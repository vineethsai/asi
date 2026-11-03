/**
 * Radar — recharts RadarChart wrapper (§9 "Control radar", "Architecture radar small multiples").
 * Overlay mode draws every series on one chart; individual mode renders small multiples.
 * Colours are resolved from the theme (recharts cannot read CSS vars) and update on theme toggle.
 * Build-in animation follows recharts' own animation, disabled under reduced motion.
 *
 * Props:
 *   axes: { key: string; label: string }[]
 *   series: { id: string; label: string; color?: string; values: Record<axisKey, number> }[]
 *   mode?: "overlay" | "individual"; defaultMode?; onModeChange?; showModeToggle?
 *   max?: number              — radial domain max (default: largest value, at least 1)
 *   height?: number (default 320); smallHeight?: number (default 220)
 *   fillOpacity?: number (default 0.18)
 *   valueFormat?: (v) => string
 *   ariaLabel: string; title?; description?; legend?; toolbar?
 *
 * Usage:
 *   <Radar ariaLabel="AISVS chapters addressed by M2" axes={chapters.map((c) => ({ key: c.code, label: c.code }))}
 *     series={[{ id: "m2", label: "M2", values: coverage }]} max={1} />
 */

import { useMemo, useState, type ReactNode } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar as ReRadar,
  RadarChart,
  Tooltip as ReTooltip,
} from "recharts";
import { cn } from "@/lib/utils";
import { FRAMEWORK_ORDER } from "@/lib/palette";
import { ChartFrame, ChartLegend } from "./ChartFrame";
import { useChartTheme } from "./useChartTheme";
import { useResizeObserver } from "./useResizeObserver";
import { CHART_MOTION, usePrefersReducedMotion } from "./motion";

export interface RadarAxis {
  key: string;
  label: string;
}
export interface RadarSeries {
  id: string;
  label: string;
  color?: string;
  values: Record<string, number>;
}
export interface RadarProps {
  axes: RadarAxis[];
  series: RadarSeries[];
  ariaLabel: string;
  title?: ReactNode;
  description?: ReactNode;
  legend?: ReactNode;
  toolbar?: ReactNode;
  mode?: "overlay" | "individual";
  defaultMode?: "overlay" | "individual";
  onModeChange?: (mode: "overlay" | "individual") => void;
  showModeToggle?: boolean;
  max?: number;
  height?: number;
  smallHeight?: number;
  fillOpacity?: number;
  valueFormat?: (v: number) => string;
  className?: string;
}

export function Radar({
  axes,
  series,
  ariaLabel,
  title,
  description,
  legend,
  toolbar,
  mode,
  defaultMode,
  onModeChange,
  showModeToggle,
  max,
  height = 320,
  smallHeight = 220,
  fillOpacity = 0.18,
  valueFormat = (v) => `${Math.round(v * 100) / 100}`,
  className,
}: RadarProps) {
  const theme = useChartTheme();
  const reduced = usePrefersReducedMotion();
  const { ref, width } = useResizeObserver<HTMLDivElement>({ initialWidth: 360 });
  const [innerMode, setInnerMode] = useState(
    defaultMode ?? (series.length > 1 ? "overlay" : "individual"),
  );
  const current = mode ?? innerMode;
  const setMode = (m: "overlay" | "individual") => {
    if (mode === undefined) setInnerMode(m);
    onModeChange?.(m);
  };

  const colors = useMemo(() => {
    const cycle = FRAMEWORK_ORDER.map((k) => theme.framework[k]);
    return series.map((s, i) => s.color ?? cycle[i % cycle.length]);
  }, [series, theme]);

  const domainMax = useMemo(
    () =>
      max ?? Math.max(1, ...series.flatMap((s) => axes.map((a) => Number(s.values[a.key] ?? 0)))),
    [max, series, axes],
  );

  const rows = useMemo(
    () =>
      axes.map((a) => {
        const row: Record<string, string | number> = { axis: a.label };
        series.forEach((s) => (row[s.id] = Number(s.values[a.key] ?? 0)));
        return row;
      }),
    [axes, series],
  );

  const toggle =
    (showModeToggle ?? series.length > 1) ? (
      <div
        role="group"
        aria-label="Radar layout"
        className="inline-flex rounded-md border p-0.5 text-xs"
      >
        {(["overlay", "individual"] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={current === m}
            onClick={() => setMode(m)}
            className={cn(
              "rounded px-2 py-1 capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              current === m ? "bg-muted font-medium text-foreground" : "text-muted-foreground",
            )}
          >
            {m}
          </button>
        ))}
      </div>
    ) : null;

  const chart = (list: RadarSeries[], w: number, h: number, key: string) => (
    <RadarChart key={key} width={w} height={h} data={rows} outerRadius={Math.min(w, h) / 2 - 36}>
      <PolarGrid stroke={theme.grid} />
      <PolarAngleAxis
        dataKey="axis"
        tick={{ fill: theme.mutedForeground, fontSize: 11, fontFamily: theme.fontFamily }}
      />
      <PolarRadiusAxis domain={[0, domainMax]} tick={false} axisLine={false} stroke={theme.grid} />
      {list.map((s) => {
        const c = colors[series.indexOf(s)];
        return (
          <ReRadar
            key={s.id}
            name={s.label}
            dataKey={s.id}
            stroke={c}
            fill={c}
            fillOpacity={fillOpacity}
            strokeWidth={2}
            dot={{ r: 2.5, fill: c, strokeWidth: 0 }}
            isAnimationActive={!reduced}
            animationDuration={CHART_MOTION.barMs}
          />
        );
      })}
      <ReTooltip
        formatter={(v: number) => valueFormat(Number(v))}
        contentStyle={{
          background: theme.card,
          border: `1px solid ${theme.border}`,
          borderRadius: 6,
          fontSize: 12,
          color: theme.foreground,
        }}
        labelStyle={{ color: theme.foreground, fontWeight: 600 }}
      />
    </RadarChart>
  );

  const safeWidth = Math.max(200, width);
  const cols = safeWidth >= 900 ? 3 : safeWidth >= 560 ? 2 : 1;
  const smallW = Math.floor((safeWidth - (cols - 1) * 16) / cols);

  return (
    <ChartFrame
      ariaLabel={ariaLabel}
      title={title}
      description={description}
      toolbar={
        toolbar || toggle ? (
          <>
            {toolbar}
            {toggle}
          </>
        ) : undefined
      }
      legend={
        legend ??
        (series.length > 1 ? (
          <ChartLegend
            items={series.map((s, i) => ({
              id: s.id,
              label: s.label,
              color: colors[i],
              shape: "line",
            }))}
          />
        ) : undefined)
      }
      empty={axes.length < 3 || series.length === 0}
      emptyDescription={axes.length < 3 ? "A radar needs at least three axes." : undefined}
      className={className}
      table={{
        columns: ["Axis", ...series.map((s) => s.label)],
        rows: axes.map((a) => [
          a.label,
          ...series.map((s) => valueFormat(Number(s.values[a.key] ?? 0))),
        ]),
      }}
    >
      <div ref={ref} className="w-full">
        {current === "overlay" || series.length <= 1 ? (
          <div className="flex justify-center">{chart(series, safeWidth, height, "overlay")}</div>
        ) : (
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {series.map((s) => (
              <div key={s.id} className="flex flex-col items-center">
                <p className="text-sm font-medium">{s.label}</p>
                {chart([s], smallW, smallHeight, s.id)}
              </div>
            ))}
          </div>
        )}
      </div>
    </ChartFrame>
  );
}

export default Radar;

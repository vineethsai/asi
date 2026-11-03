/**
 * Chart primitives (IMPROVEMENT_PLAN.md P1-09, §8.3–8.4, §9). Import from "@/components/charts".
 * Heavy D3 charts (Sunburst, Sankey, Bipartite) and recharts (Radar) are re-exported here for
 * convenience; import them from their own files if you want a page to lazy-load them.
 */

export { ChartFrame, ChartLegend, ChartDataTable } from "./ChartFrame";
export type { ChartFrameProps, ChartTable } from "./ChartFrame";
export { ChartTooltip } from "./ChartTooltip";
export type { ChartTooltipProps } from "./ChartTooltip";
export { useChartTooltip } from "./useChartTooltip";
export type { TooltipState } from "./useChartTooltip";
export { useChartTheme, readChartTheme } from "./useChartTheme";
export type { ChartTheme } from "./useChartTheme";
export { useResizeObserver } from "./useResizeObserver";
export { CHART_MOTION, usePrefersReducedMotion, prefersReducedMotion } from "./motion";
export { progressBand, percent, connectedClosure, defaultAggregate } from "./chartUtils";

export { Ring } from "./Ring";
export type { RingProps } from "./Ring";
export { Gauge } from "./Gauge";
export type { GaugeProps } from "./Gauge";
export { Sparkline } from "./Sparkline";
export type { SparklineProps } from "./Sparkline";
export { StackedBars } from "./StackedBars";
export type { StackedBarsProps, StackedBarsDatum } from "./StackedBars";
export { CoverageBars } from "./CoverageBars";
export type { CoverageBarsProps, CoverageRow, CoverageSegment } from "./CoverageBars";
export { Heatmap } from "./Heatmap";
export type {
  HeatmapProps,
  HeatmapRow,
  HeatmapColumn,
  HeatmapGroup,
  HeatmapCell,
  HeatmapCells,
} from "./Heatmap";
export { LayerStack } from "./LayerStack";
export type { LayerStackProps, LayerStackLayer, LayerStackChip } from "./LayerStack";
export { Radar } from "./Radar";
export type { RadarProps, RadarAxis, RadarSeries } from "./Radar";
export { Sunburst } from "./Sunburst";
export type { SunburstProps, HierarchyDatum } from "./Sunburst";
export { Sankey } from "./Sankey";
export type { SankeyProps, SankeyNodeDatum, SankeyLinkDatum, SankeyGroup } from "./Sankey";
export { Bipartite } from "./Bipartite";
export type { BipartiteProps, BipartiteNode, BipartiteColumn, BipartiteLink } from "./Bipartite";

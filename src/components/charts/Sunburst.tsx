/**
 * Sunburst — zoomable D3 partition with a treemap toggle (§9 "Component hierarchy").
 * Ring 1 = top-level groups (e.g. KC, coloured by KC palette), ring 2 = children (e.g. component
 * nodes); arc size = value (e.g. threat count). Click / Enter on an arc with children zooms in
 * (breadcrumb + centre button zoom out); on a leaf it calls `onNavigate`. Arcs are focusable and
 * show a tooltip on hover/focus. A nested list is always available to screen readers and via
 * the "List" toggle. D3 joins are incremental (keyed by id); arcs tween between zoom states and
 * sweep in on first render unless reduced motion is on.
 *
 * Props:
 *   data: HierarchyDatum            — { id; name; value?; color?; href?; children? } (root = centre)
 *   ariaLabel: string; title?; description?; legend?; toolbar?
 *   mode?: "sunburst" | "treemap"; defaultMode?; onModeChange?; showModeToggle? (default true)
 *   rings?: number (default 2)       — levels visible at once
 *   size?: number (default 440)      — max diameter in px (shrinks to the container)
 *   valueLabel?: string              — unit for tooltips, e.g. "threats" (default "items")
 *   colorFor?: (datum, depth) => string   — default: datum.color → inherited → KC palette by index
 *   onNavigate?: (datum) => void     — leaf activation (and "Open" link in the breadcrumb)
 *   showListToggle?: boolean (default true)
 *   formatValue?: (datum, value) => string   — text for a node's value in labels, the centre,
 *       the list view and the tooltip (default `${value} ${valueLabel}`); use it when arc size is
 *       not the number to print (e.g. sizes split from a parent)
 *   renderTooltip?: (datum, value) => ReactNode — replaces the tooltip body (e.g. threat chips)
 *
 * Usage:
 *   <Sunburst ariaLabel="Components by KC, sized by threat count" valueLabel="threats"
 *     data={{ id: "root", name: "Components", children: kcNodes }} onNavigate={(d) => navigate(`/components/${d.id}`)} />
 */

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as d3 from "d3";
import { ChevronRight, List, PieChart, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { KC_ORDER, KC } from "@/data/kc";
import { ChartFrame } from "./ChartFrame";
import { ChartTooltip } from "./ChartTooltip";
import { useChartTooltip } from "./useChartTooltip";
import { useResizeObserver } from "./useResizeObserver";
import { CHART_MOTION, usePrefersReducedMotion } from "./motion";
import { truncate, translateTween } from "./chartUtils";

export interface HierarchyDatum {
  id: string;
  name: string;
  value?: number;
  color?: string;
  href?: string;
  children?: HierarchyDatum[];
}

export interface SunburstProps {
  data: HierarchyDatum;
  ariaLabel: string;
  title?: ReactNode;
  description?: ReactNode;
  legend?: ReactNode;
  toolbar?: ReactNode;
  mode?: "sunburst" | "treemap";
  defaultMode?: "sunburst" | "treemap";
  onModeChange?: (mode: "sunburst" | "treemap") => void;
  showModeToggle?: boolean;
  rings?: number;
  size?: number;
  valueLabel?: string;
  colorFor?: (datum: HierarchyDatum, depth: number) => string;
  onNavigate?: (datum: HierarchyDatum) => void;
  showListToggle?: boolean;
  formatValue?: (datum: HierarchyDatum, value: number) => string;
  renderTooltip?: (datum: HierarchyDatum, value: number) => ReactNode;
  className?: string;
}

type PNode = d3.HierarchyRectangularNode<HierarchyDatum>;
type Coords = { x0: number; x1: number; y0: number; y1: number };
type ArcEl = SVGPathElement & { __current?: Coords };
type RectEl = SVGGElement & { __current?: Coords };

const DEFAULT_COLORS = KC_ORDER.map((id) => KC[id].color);
const TAU = 2 * Math.PI;

function NestedList({
  node,
  valueLabel,
  formatValue,
}: {
  node: HierarchyDatum;
  valueLabel: string;
  formatValue?: (datum: HierarchyDatum, value: number) => string;
}) {
  if (!node.children?.length) return null;
  return (
    <ul className="ml-4 list-disc space-y-0.5">
      {node.children.map((c) => (
        <li key={c.id}>
          {c.href ? (
            <a href={c.href} className="text-primary hover:underline">
              {c.name}
            </a>
          ) : (
            c.name
          )}
          {formatValue ? (
            <span className="text-muted-foreground"> — {formatValue(c, c.value ?? 0)}</span>
          ) : (
            c.value !== undefined && (
              <span className="text-muted-foreground">
                {" "}
                — {c.value} {valueLabel}
              </span>
            )
          )}
          <NestedList node={c} valueLabel={valueLabel} formatValue={formatValue} />
        </li>
      ))}
    </ul>
  );
}

export function Sunburst({
  data,
  ariaLabel,
  title,
  description,
  legend,
  toolbar,
  mode,
  defaultMode = "sunburst",
  onModeChange,
  showModeToggle = true,
  rings = 2,
  size = 440,
  valueLabel = "items",
  colorFor,
  onNavigate,
  showListToggle = true,
  formatValue,
  renderTooltip,
  className,
}: SunburstProps) {
  const reduced = usePrefersReducedMotion();
  const { ref: boxRef, width } = useResizeObserver<HTMLDivElement>({ initialWidth: size });
  const [innerMode, setInnerMode] = useState(defaultMode);
  const current = mode ?? innerMode;
  const setMode = (m: "sunburst" | "treemap") => {
    if (mode === undefined) setInnerMode(m);
    onModeChange?.(m);
  };
  const [asList, setAsList] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const prevFocus = useRef<string | null>(null);
  const firstRender = useRef(true);
  const { tip, show, hide, id: tipId } = useChartTooltip<PNode>();

  const root = useMemo(() => {
    const h = d3
      .hierarchy(data)
      .sum((d) => (d.children?.length ? 0 : Math.max(0, d.value ?? 1)))
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
    return d3.partition<HierarchyDatum>().size([TAU, h.height + 1])(h);
  }, [data]);

  const byId = useMemo(() => {
    const m = new Map<string, PNode>();
    root.each((n) => m.set(n.data.id, n));
    return m;
  }, [root]);

  const [focusId, setFocusId] = useState<string>(data.id);
  const focus = byId.get(focusId) ?? root;

  const colorOf = useMemo(() => {
    const topIndex = new Map<string, number>();
    (root.children ?? []).forEach((c, i) => topIndex.set(c.data.id, i));
    return (n: PNode): string => {
      if (colorFor) return colorFor(n.data, n.depth);
      for (let a: PNode | null = n; a; a = a.parent) if (a.data.color) return a.data.color;
      const top = n.ancestors().find((a) => a.depth === 1);
      return DEFAULT_COLORS[(top ? (topIndex.get(top.data.id) ?? 0) : 0) % DEFAULT_COLORS.length];
    };
  }, [root, colorFor]);

  const fmt = (d: HierarchyDatum, v: number) =>
    formatValue ? formatValue(d, v) : `${v} ${valueLabel}`;
  const fmtRef = useRef(fmt);
  fmtRef.current = fmt;

  const W = Math.max(240, Math.min(width || size, 1200));
  const sunSize = Math.min(size, W);
  const H = current === "sunburst" ? sunSize : Math.round(Math.min(size, W) * 0.75);
  const radius = sunSize / 2 / (rings + 1);

  const activate = (n: PNode) => {
    if (n.children?.length && n !== focus) {
      setFocusId(n.data.id);
      hide();
    } else if (n === focus && n.parent) {
      setFocusId(n.parent.data.id);
    } else {
      onNavigate?.(n.data);
    }
  };
  const activateRef = useRef(activate);
  activateRef.current = activate;
  const showRef = useRef(show);
  showRef.current = show;

  // ── D3 render (incremental joins) ───────────────────────────────────────
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const sel = d3.select(svg);
    const ms = firstRender.current ? CHART_MOTION.nodeMs + 150 : CHART_MOTION.updateMs + 150;
    const duration = reduced ? 0 : ms;
    const prev = (prevFocus.current && byId.get(prevFocus.current)) || focus;

    const rel = (n: PNode, f: PNode): Coords => ({
      x0: Math.max(0, Math.min(1, (n.x0 - f.x0) / (f.x1 - f.x0 || 1))) * TAU,
      x1: Math.max(0, Math.min(1, (n.x1 - f.x0) / (f.x1 - f.x0 || 1))) * TAU,
      y0: Math.min(rings + 1, Math.max(0, n.y0 - f.depth)),
      y1: Math.min(rings + 1, Math.max(0, n.y1 - f.depth)),
    });
    const arc = d3
      .arc<Coords>()
      .startAngle((d) => d.x0)
      .endAngle((d) => d.x1)
      .padAngle((d) => Math.min((d.x1 - d.x0) / 2, 0.006))
      .padRadius(radius * 1.5)
      .innerRadius((d) => d.y0 * radius)
      .outerRadius((d) => Math.max(d.y0 * radius, d.y1 * radius - 1));

    const sunG = sel.select<SVGGElement>("g[data-layer=sun]");
    const mapG = sel.select<SVGGElement>("g[data-layer=map]");
    sunG.attr("transform", `translate(${W / 2},${sunSize / 2})`);

    // Sunburst arcs
    const visibleArcs =
      current === "sunburst"
        ? focus.descendants().filter((n) => {
            const c = rel(n, focus);
            return n !== focus && c.y0 >= 1 && c.y1 <= rings + 1 && c.x1 - c.x0 > 0.0005;
          })
        : [];

    const arcs = sunG
      .select<SVGGElement>("g[data-layer=arcs]")
      .selectAll<ArcEl, PNode>("path")
      .data(visibleArcs, (d) => d.data.id)
      .join(
        (enter) =>
          enter
            .append<ArcEl>("path")
            .attr("tabindex", 0)
            .attr("role", "button")
            .style("cursor", "pointer")
            .style("outline", "none")
            .each(function (d) {
              const start = firstRender.current
                ? { ...rel(d, focus), x1: rel(d, focus).x0 }
                : rel(d, prev);
              this.__current = start;
            })
            .attr("d", function () {
              return arc(this.__current as Coords);
            }),
        (update) => update,
        (exit) =>
          exit
            .attr("tabindex", -1)
            .style("pointer-events", "none")
            .call((x) => {
              if (duration === 0) x.remove();
              else
                x.transition()
                  .duration(duration)
                  .ease(CHART_MOTION.d3Ease)
                  .attrTween("d", function (d) {
                    const i = d3.interpolate(this.__current as Coords, rel(d, focus));
                    return (t) => arc(i(t)) ?? "";
                  })
                  .style("opacity", 0)
                  .remove();
            }),
      );

    arcs
      .attr("aria-label", (d) => {
        const kids = d.children?.length
          ? `, ${d.children.length} sub-items, press Enter to zoom`
          : "";
        return `${d.data.name}: ${fmtRef.current(d.data, d.value ?? 0)}${kids}`;
      })
      .style("fill", (d) => colorOf(d))
      .style("fill-opacity", (d) => (d.depth - focus.depth > 1 ? 0.62 : 0.9))
      .style("stroke", "hsl(var(--card))")
      .style("stroke-width", 1)
      .on("click", (_e, d) => activateRef.current(d))
      .on("keydown", (e: KeyboardEvent, d) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activateRef.current(d);
        } else if (e.key === "Escape" && focus.parent) {
          setFocusId(focus.parent.data.id);
        }
      })
      .on("mousemove", (e: MouseEvent, d) => showRef.current(e, d))
      .on("mouseleave", () => hide())
      .on("focus", function (_e, d) {
        d3.select(this).style("stroke", "hsl(var(--ring))").style("stroke-width", 2.5);
        showRef.current(this, d);
      })
      .on("blur", function () {
        d3.select(this).style("stroke", "hsl(var(--card))").style("stroke-width", 1);
        hide();
      });

    if (duration === 0) {
      arcs.attr("d", function (d) {
        this.__current = rel(d, focus);
        return arc(this.__current);
      });
    } else {
      arcs
        .transition()
        .duration(duration)
        .ease(CHART_MOTION.d3Ease)
        .attrTween("d", function (d) {
          const target = rel(d, focus);
          const i = d3.interpolate(this.__current ?? target, target);
          this.__current = target;
          return (t) => arc(i(t)) ?? "";
        });
    }

    // Arc labels
    const labelOk = (c: Coords) => {
      const mid = ((c.y0 + c.y1) / 2) * radius;
      return (c.y1 - c.y0) * radius > 14 && (c.x1 - c.x0) * mid > 26;
    };
    sunG
      .select<SVGGElement>("g[data-layer=labels]")
      .selectAll<SVGTextElement, PNode>("text")
      .data(
        visibleArcs.filter((n) => labelOk(rel(n, focus))),
        (d) => d.data.id,
      )
      .join(
        (enter) => enter.append("text").attr("dy", "0.35em").style("opacity", 0),
        (update) => update,
        (exit) => exit.remove(),
      )
      .attr("text-anchor", "middle")
      .attr("aria-hidden", "true")
      .style("font-size", "11px")
      .style("font-weight", 500)
      .style("pointer-events", "none")
      .style("fill", "hsl(var(--foreground))")
      .style("paint-order", "stroke")
      .style("stroke", "hsl(var(--card) / 0.85)")
      .style("stroke-width", 3)
      .text((d) => {
        const c = rel(d, focus);
        const maxChars = Math.max(
          3,
          Math.floor(((c.x1 - c.x0) * ((c.y0 + c.y1) / 2) * radius) / 6.5),
        );
        return truncate(
          d.data.name,
          Math.min(maxChars, Math.floor(((c.y1 - c.y0) * radius) / 6.2) + 6),
        );
      })
      .attr("transform", (d) => {
        const c = rel(d, focus);
        const x = (((c.x0 + c.x1) / 2) * 180) / Math.PI;
        const y = ((c.y0 + c.y1) / 2) * radius;
        return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
      })
      .transition()
      .delay(duration * 0.6)
      .duration(reduced ? 0 : 200)
      .style("opacity", 1);

    // Treemap
    const tmNodes: PNode[] = [];
    if (current === "treemap") {
      const sub = d3
        .hierarchy(focus.data)
        .sum((d) => (d.children?.length ? 0 : Math.max(0, d.value ?? 1)))
        .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
      const laid = d3
        .treemap<HierarchyDatum>()
        .size([W, H])
        .paddingOuter(3)
        .paddingTop(20)
        .paddingInner(2)
        .round(true)(sub);
      laid.descendants().forEach((n) => {
        if (n.depth >= 1 && n.depth <= rings) {
          const real = byId.get(n.data.id);
          if (real) {
            Object.assign(n, { __real: real });
            tmNodes.push(n as unknown as PNode);
          }
        }
      });
    }
    const realOf = (n: PNode) => (n as unknown as { __real: PNode }).__real ?? n;
    const cells = mapG
      .selectAll<RectEl, PNode>("g.cell")
      .data(tmNodes, (d) => d.data.id)
      .join(
        (enter) => {
          const g = enter
            .append("g")
            .attr("class", "cell")
            .attr("tabindex", 0)
            .attr("role", "button")
            .style("cursor", "pointer")
            .style("outline", "none")
            .style("opacity", 0);
          g.append("rect").attr("rx", 3);
          g.append("text").attr("x", 6).attr("y", 14).attr("aria-hidden", "true");
          return g;
        },
        (update) => update,
        (exit) => exit.remove(),
      );
    cells
      .attr("aria-label", (d) => `${d.data.name}: ${fmtRef.current(d.data, d.value ?? 0)}`)
      .on("click", (_e, d) => activateRef.current(realOf(d)))
      .on("keydown", (e: KeyboardEvent, d) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activateRef.current(realOf(d));
        } else if (e.key === "Escape" && focus.parent) setFocusId(focus.parent.data.id);
      })
      .on("mousemove", (e: MouseEvent, d) => showRef.current(e, realOf(d)))
      .on("mouseleave", () => hide())
      .on("focus", function (_e, d) {
        d3.select(this).select("rect").style("stroke", "hsl(var(--ring))").style("stroke-width", 2);
        showRef.current(this, realOf(d));
      })
      .on("blur", function () {
        d3.select(this).select("rect").style("stroke", "hsl(var(--card))").style("stroke-width", 1);
        hide();
      });
    const tr = cells
      .transition()
      .duration(reduced ? 0 : CHART_MOTION.updateMs)
      .ease(CHART_MOTION.d3Ease);
    tr.style("opacity", 1).attrTween(
      "transform",
      translateTween((d: PNode) => `translate(${d.x0},${d.y0})`),
    );
    cells
      .select("rect")
      .style("fill", (d) => colorOf(realOf(d)))
      .style("fill-opacity", (d) => (d.depth > 1 ? 0.6 : 0.22))
      .style("stroke", "hsl(var(--card))")
      .transition()
      .duration(reduced ? 0 : CHART_MOTION.updateMs)
      .attr("width", (d) => Math.max(0, d.x1 - d.x0))
      .attr("height", (d) => Math.max(0, d.y1 - d.y0));
    cells
      .select("text")
      .style("font-size", "11px")
      .style("font-weight", (d) => (d.depth === 1 ? 600 : 500))
      .style("fill", "hsl(var(--foreground))")
      .style("pointer-events", "none")
      .text((d) => {
        const w = d.x1 - d.x0;
        const h = d.y1 - d.y0;
        if (w < 34 || h < 18) return "";
        return truncate(d.data.name, Math.floor((w - 10) / 6.2));
      });

    prevFocus.current = focus.data.id;
    firstRender.current = false;
  }, [byId, focus, current, W, H, sunSize, radius, rings, reduced, colorOf, valueLabel, hide]);

  const crumbs = focus.ancestors().reverse();
  const toggle = (
    <div className="flex items-center gap-1">
      {showModeToggle && !asList && (
        <div
          role="group"
          aria-label="Chart type"
          className="inline-flex rounded-md border p-0.5 text-xs"
        >
          {(
            [
              ["sunburst", PieChart, "Sunburst"],
              ["treemap", LayoutGrid, "Treemap"],
            ] as const
          ).map(([m, Ico, label]) => (
            <button
              key={m}
              type="button"
              aria-pressed={current === m}
              onClick={() => setMode(m)}
              className={cn(
                "inline-flex items-center gap-1 rounded px-2 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                current === m ? "bg-muted font-medium text-foreground" : "text-muted-foreground",
              )}
            >
              <Ico aria-hidden className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      )}
      {showListToggle && (
        <button
          type="button"
          aria-pressed={asList}
          onClick={() => setAsList((v) => !v)}
          className={cn(
            "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            asList ? "bg-muted font-medium text-foreground" : "text-muted-foreground",
          )}
        >
          <List aria-hidden className="h-3.5 w-3.5" />
          List
        </button>
      )}
    </div>
  );

  return (
    <ChartFrame
      ariaLabel={ariaLabel}
      title={title}
      description={description}
      legend={legend}
      toolbar={
        <>
          {toolbar}
          {toggle}
        </>
      }
      interactive
      empty={!data.children?.length}
      className={className}
    >
      {asList ? (
        <div className="relative max-h-[480px] max-w-full overflow-auto text-sm">
          <p className="font-medium">{data.name}</p>
          <NestedList node={data} valueLabel={valueLabel} formatValue={formatValue} />
        </div>
      ) : (
        <>
          <nav
            aria-label="Hierarchy breadcrumb"
            className="mb-2 flex flex-wrap items-center gap-1 text-xs"
          >
            {crumbs.map((c, i) => (
              <span key={c.data.id} className="inline-flex items-center gap-1">
                {i > 0 && <ChevronRight aria-hidden className="h-3 w-3 text-muted-foreground" />}
                {c === focus ? (
                  <span aria-current="location" className="font-medium text-foreground">
                    {c.data.name}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setFocusId(c.data.id)}
                    className="rounded px-0.5 text-muted-foreground hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {c.data.name}
                  </button>
                )}
              </span>
            ))}
            {focus !== root && onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate(focus.data)}
                className="ml-2 rounded px-1 text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Open {focus.data.name} →
              </button>
            )}
          </nav>
          <div ref={boxRef} className="relative w-full max-w-full">
            <svg
              ref={svgRef}
              width={W}
              height={H}
              viewBox={`0 0 ${W} ${H}`}
              className="mx-auto block max-w-full"
              style={{ fontFamily: '"Geist Sans", system-ui, sans-serif' }}
            >
              <g data-layer="sun">
                <g data-layer="arcs" />
                <g data-layer="labels" />
                {current === "sunburst" && (
                  <g>
                    <circle
                      r={Math.max(0, radius - 2)}
                      role={focus.parent ? "button" : undefined}
                      tabIndex={focus.parent ? 0 : undefined}
                      aria-label={
                        focus.parent ? `Zoom out to ${focus.parent.data.name}` : undefined
                      }
                      onClick={() => focus.parent && setFocusId(focus.parent.data.id)}
                      onKeyDown={(e) => {
                        if ((e.key === "Enter" || e.key === " ") && focus.parent) {
                          e.preventDefault();
                          setFocusId(focus.parent.data.id);
                        }
                      }}
                      style={{
                        fill: "hsl(var(--muted) / 0.5)",
                        cursor: focus.parent ? "pointer" : "default",
                        outline: "none",
                      }}
                      className="focus-visible:[stroke:hsl(var(--ring))] focus-visible:[stroke-width:2]"
                    />
                    <text
                      textAnchor="middle"
                      dy="-0.2em"
                      aria-hidden
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        fill: "hsl(var(--foreground))",
                        pointerEvents: "none",
                      }}
                    >
                      {truncate(focus.data.name, Math.max(6, Math.floor((radius * 2) / 8)))}
                    </text>
                    <text
                      textAnchor="middle"
                      dy="1.2em"
                      aria-hidden
                      style={{
                        fontSize: 11,
                        fill: "hsl(var(--muted-foreground))",
                        pointerEvents: "none",
                      }}
                    >
                      {fmt(focus.data, focus.value ?? 0)}
                    </text>
                  </g>
                )}
              </g>
              <g data-layer="map" />
            </svg>
          </div>
          <div className="sr-only">
            <p>{data.name}</p>
            <NestedList node={data} valueLabel={valueLabel} formatValue={formatValue} />
          </div>
        </>
      )}
      <ChartTooltip {...tip} id={tipId} onDismiss={hide}>
        {tip.content && renderTooltip ? (
          <div className="space-y-1">
            {renderTooltip(tip.content.data, tip.content.value ?? 0)}
            <p className="text-muted-foreground">
              {tip.content.children?.length ? "Click to zoom" : onNavigate ? "Click to open" : ""}
            </p>
          </div>
        ) : tip.content ? (
          <div className="space-y-0.5">
            <p className="font-medium">{tip.content.data.name}</p>
            <p className="text-muted-foreground">
              {fmt(tip.content.data, tip.content.value ?? 0)}
              {tip.content.children?.length ? ` · ${tip.content.children.length} sub-items` : ""}
            </p>
            <p className="text-muted-foreground">
              {tip.content.children?.length ? "Click to zoom" : onNavigate ? "Click to open" : ""}
            </p>
          </div>
        ) : null}
      </ChartTooltip>
    </ChartFrame>
  );
}

export default Sunburst;

/**
 * Bipartite — ordered columns of nodes joined by bundled links (§9 "NIST bipartite").
 * Widths come from the container; zoom/pan uses a stored d3-zoom transform that is preserved
 * across data/selection updates (never reset on click). Wheel zoom requires Ctrl/⌘ (pinch on
 * trackpads) and touch needs two fingers, so the page keeps scrolling normally; zoom buttons
 * are provided.
 *
 * Interactions: hover/focus highlights the node's connected path (up- and downstream);
 * click / Enter selects (pins) it, click again / Escape clears; Shift+Enter or double-click calls
 * `onNodeActivate` (e.g. navigate). Arrow keys: ↑↓ within a column, ←→ to the nearest connected
 * node in the neighbouring column.
 *
 * Props:
 *   columns: { id; label; color? }[]           — left → right
 *   nodes: { id; label; column; color?; group?; href? }[]   — `group` bundles links (e.g. NIST function)
 *   links: { source; target; weight? }[]       — weight → stroke width
 *   ariaLabel: string; title?; description?; legend?; toolbar?
 *   selectedId? / defaultSelectedId? / onSelect?(id | null); onNodeActivate?(node)
 *   rowHeight?: number (default 22); height?: number (viewport; default fits content, 320–640)
 *   bundling?: number (0–1, default 0.85); showZoomControls?: boolean (default true)
 *   labelWidth?: number (default 170); valueLabel?: string (default "links")
 *
 * Links draw in once, on enter, at the measured width (`drawInLinks`); every update / resize clears
 * the dash attributes so each link always rests fully stroked from source to target.
 *
 * Usage:
 *   <Bipartite ariaLabel="NIST AI RMF subcategories mapped to controls"
 *     columns={[{ id: "fn", label: "Function" }, { id: "sub", label: "Subcategory" }, { id: "ctl", label: "Control" }]}
 *     nodes={nodes} links={links} onNodeActivate={(n) => n.href && navigate(n.href)} />
 */

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as d3 from "d3";
import { Maximize2, Minus, Plus } from "lucide-react";
import { FRAMEWORK_ORDER, FRAMEWORK_PALETTE } from "@/lib/palette";
import { ChartFrame } from "./ChartFrame";
import { ChartTooltip } from "./ChartTooltip";
import { useChartTooltip } from "./useChartTooltip";
import { useResizeObserver } from "./useResizeObserver";
import { CHART_MOTION, clearLinkDraw, drawInLinks, usePrefersReducedMotion } from "./motion";
import { connectedClosure, cssEscape, truncate, translateTween } from "./chartUtils";

export interface BipartiteColumn {
  id: string;
  label: string;
  color?: string;
}
export interface BipartiteNode {
  id: string;
  label: string;
  column: string;
  color?: string;
  group?: string;
  href?: string;
}
export interface BipartiteLink {
  source: string;
  target: string;
  weight?: number;
}

export interface BipartiteProps {
  columns: BipartiteColumn[];
  nodes: BipartiteNode[];
  links: BipartiteLink[];
  ariaLabel: string;
  title?: ReactNode;
  description?: ReactNode;
  legend?: ReactNode;
  toolbar?: ReactNode;
  selectedId?: string | null;
  defaultSelectedId?: string | null;
  onSelect?: (id: string | null) => void;
  onNodeActivate?: (node: BipartiteNode) => void;
  rowHeight?: number;
  height?: number;
  bundling?: number;
  showZoomControls?: boolean;
  labelWidth?: number;
  valueLabel?: string;
  className?: string;
}

type PNode = BipartiteNode & { x: number; y: number; col: number; color: string; degree: number };
type PLink = { key: string; s: PNode; t: PNode; weight: number };
type LinkEl = SVGPathElement;

const HEADER = 30;
const FONT = 12;
const FALLBACK = FRAMEWORK_ORDER.map((k) => FRAMEWORK_PALETTE[k].css);

export function Bipartite({
  columns,
  nodes,
  links,
  ariaLabel,
  title,
  description,
  legend,
  toolbar,
  selectedId,
  defaultSelectedId = null,
  onSelect,
  onNodeActivate,
  rowHeight = 22,
  height,
  bundling = 0.85,
  showZoomControls = true,
  labelWidth = 170,
  valueLabel = "links",
  className,
}: BipartiteProps) {
  const reduced = usePrefersReducedMotion();
  const { ref: boxRef, width, measured } = useResizeObserver<HTMLDivElement>({ initialWidth: 900 });
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const transformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);
  const [innerSel, setInnerSel] = useState<string | null>(defaultSelectedId);
  const selected = selectedId !== undefined ? selectedId : innerSel;
  const setSelected = (id: string | null) => {
    if (selectedId === undefined) setInnerSel(id);
    onSelect?.(id);
  };
  const [hovered, setHovered] = useState<string | null>(null);
  const { tip, show, hide, id: tipId } = useChartTooltip<PNode>();

  const W = Math.max(560, width || 900);
  const layout = useMemo(() => {
    const colIdx = new Map(columns.map((c, i) => [c.id, i]));
    const byCol = columns.map(() => [] as BipartiteNode[]);
    nodes.forEach((n) => {
      const i = colIdx.get(n.column);
      if (i !== undefined) byCol[i].push(n);
    });
    const maxRows = Math.max(1, ...byCol.map((c) => c.length));
    const contentH = HEADER + maxRows * rowHeight + 12;
    const k = columns.length;
    const left = labelWidth;
    const right = k > 1 ? labelWidth : 0;
    const gap = k > 1 ? (W - left - right) / (k - 1) : 0;
    const degree = new Map<string, number>();
    links.forEach((l) => {
      degree.set(l.source, (degree.get(l.source) ?? 0) + 1);
      degree.set(l.target, (degree.get(l.target) ?? 0) + 1);
    });
    const pos = new Map<string, PNode>();
    byCol.forEach((list, ci) => {
      const offset = ((maxRows - list.length) * rowHeight) / 2;
      list.forEach((n, ri) => {
        pos.set(n.id, {
          ...n,
          col: ci,
          x: left + ci * gap,
          y: HEADER + offset + ri * rowHeight + rowHeight / 2,
          color: n.color ?? columns[ci].color ?? FALLBACK[ci % FALLBACK.length],
          degree: degree.get(n.id) ?? 0,
        });
      });
    });
    const plinks: PLink[] = [];
    const seen = new Set<string>();
    links.forEach((l) => {
      let s = pos.get(l.source);
      let t = pos.get(l.target);
      if (!s || !t || s.col === t.col) return;
      if (s.col > t.col) [s, t] = [t, s];
      const key = `${s.id}→${t.id}`;
      if (seen.has(key)) return;
      seen.add(key);
      plinks.push({ key, s, t, weight: l.weight ?? 1 });
    });
    // Group hubs for bundling: mean y of same-group nodes in a column.
    const hub = new Map<string, number>();
    const acc = new Map<string, { sum: number; n: number }>();
    pos.forEach((p) => {
      const key = `${p.col}|${p.group ?? "__all"}`;
      const a = acc.get(key) ?? { sum: 0, n: 0 };
      a.sum += p.y;
      a.n += 1;
      acc.set(key, a);
    });
    acc.forEach((a, key) => hub.set(key, a.sum / a.n));
    return { pos, plinks, hub, gap, contentH, maxW: Math.max(1, ...plinks.map((l) => l.weight)) };
  }, [columns, nodes, links, rowHeight, labelWidth, W]);

  const H = height ?? Math.max(320, Math.min(640, layout.contentH));
  const active = selected ?? hovered;
  const closure = useMemo(
    () =>
      active
        ? connectedClosure(
            active,
            layout.plinks.map((l) => ({ source: l.s.id, target: l.t.id })),
          )
        : null,
    [active, layout.plinks],
  );

  const handlers = useRef({
    select: (_id: string) => {},
    clear: () => {},
    activate: (_n: PNode) => {},
    hover: (_id: string | null) => {},
    show,
    hide,
    move: (_n: PNode, _key: string) => {},
  });
  handlers.current = {
    select: (id) => setSelected(selected === id ? null : id),
    clear: () => setSelected(null),
    activate: (n) => onNodeActivate?.(n),
    hover: setHovered,
    show,
    hide,
    move: (n, key) => {
      const all = [...layout.pos.values()];
      let next: PNode | undefined;
      if (key === "ArrowDown" || key === "ArrowUp") {
        const same = all.filter((p) => p.col === n.col).sort((a, b) => a.y - b.y);
        const i = same.findIndex((p) => p.id === n.id);
        next = same[key === "ArrowDown" ? i + 1 : i - 1];
      } else {
        const dir = key === "ArrowRight" ? 1 : -1;
        const neighbours = layout.plinks
          .filter((l) => (dir > 0 ? l.s.id === n.id : l.t.id === n.id))
          .map((l) => (dir > 0 ? l.t : l.s));
        const pool = neighbours.length ? neighbours : all.filter((p) => p.col === n.col + dir);
        next = pool.sort((a, b) => Math.abs(a.y - n.y) - Math.abs(b.y - n.y))[0];
      }
      if (next) {
        svgRef.current
          ?.querySelector<SVGGElement>(`g[data-node-id="${cssEscape(next.id)}"]`)
          ?.focus();
      }
    },
  };

  // Zoom behaviour: created once; the stored transform survives every re-render.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    if (!zoomRef.current) {
      zoomRef.current = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.4, 4])
        .filter((e: Event) => {
          const ev = e as MouseEvent & WheelEvent;
          // Never hijack page scrolling: wheel needs Ctrl/⌘ (trackpad pinch sets ctrlKey) and
          // single-finger touch scrolls the page; two-finger touch pans/zooms the chart.
          if (ev.type === "wheel") return ev.ctrlKey || ev.metaKey;
          if (ev.type.startsWith("touch")) return ((e as TouchEvent).touches?.length ?? 0) >= 2;
          return !ev.button && ev.type !== "dblclick";
        })
        .on("zoom", (e: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
          transformRef.current = e.transform;
          d3.select(svg).select("g[data-layer=viewport]").attr("transform", e.transform.toString());
        });
      d3.select(svg).call(zoomRef.current);
    }
    zoomRef.current.extent([
      [0, 0],
      [W, H],
    ]);
  }, [W, H]);

  const zoomBy = (k: number) => {
    const svg = svgRef.current;
    if (!svg || !zoomRef.current) return;
    d3.select(svg)
      .transition()
      .duration(reduced ? 0 : CHART_MOTION.updateMs)
      .call(zoomRef.current.scaleBy, k);
  };
  const zoomReset = () => {
    const svg = svgRef.current;
    if (!svg || !zoomRef.current) return;
    d3.select(svg)
      .transition()
      .duration(reduced ? 0 : CHART_MOTION.updateMs)
      .call(zoomRef.current.transform, d3.zoomIdentity);
  };

  // Marks (incremental joins). Waits for the container width so the first (animated) draw
  // happens at the final geometry.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !measured) return;
    const sel = d3.select(svg);
    const vp = sel.select<SVGGElement>("g[data-layer=viewport]");
    vp.attr("transform", transformRef.current.toString());
    const dur = reduced ? 0 : CHART_MOTION.updateMs;
    const line = d3
      .line<[number, number]>()
      .curve(d3.curveBundle.beta(Math.max(0, Math.min(1, bundling))));
    const pathOf = (l: PLink) => {
      const g = layout.gap * 0.42;
      const hs = layout.hub.get(`${l.s.col}|${l.s.group ?? "__all"}`) ?? l.s.y;
      const ht = layout.hub.get(`${l.t.col}|${l.t.group ?? "__all"}`) ?? l.t.y;
      return (
        line([
          [l.s.x + 6, l.s.y],
          [l.s.x + g, hs],
          [l.t.x - g, ht],
          [l.t.x - 6, l.t.y],
        ]) ?? ""
      );
    };
    const on = (l: PLink) => !closure || (closure.has(l.s.id) && closure.has(l.t.id));
    const strokeWidth = (l: PLink) => 1 + (l.weight / layout.maxW) * 3;
    const strokeOpacity = (l: PLink) => (closure ? (on(l) ? 0.75 : 0.05) : 0.28);

    // The draw-in runs once, on enter, from the final path; any update / re-join (re-layout,
    // resize, highlight) or exit clears it, so no link is ever left part-dashed.
    const linkSel = vp
      .select<SVGGElement>("g[data-layer=links]")
      .selectAll<LinkEl, PLink>("path")
      .data(layout.plinks, (d) => d.key)
      .join(
        (enter) =>
          enter
            .append("path")
            .attr("fill", "none")
            .attr("d", pathOf)
            .attr("stroke-width", strokeWidth)
            .style("stroke-opacity", strokeOpacity)
            .call((s) => drawInLinks(s, reduced)),
        (update) => clearLinkDraw(update.interrupt().style("opacity", null)),
        (exit) => clearLinkDraw(exit).transition().duration(dur).style("opacity", 0).remove(),
      );
    linkSel
      .style("stroke", (d) => d.s.color)
      .style("pointer-events", "none")
      .transition()
      .duration(dur)
      .ease(CHART_MOTION.d3Ease)
      .attr("d", pathOf)
      .attr("stroke-width", strokeWidth)
      .style("stroke-opacity", strokeOpacity);

    const nodesArr = [...layout.pos.values()];
    const nodeSel = vp
      .select<SVGGElement>("g[data-layer=nodes]")
      .selectAll<SVGGElement, PNode>("g.node")
      .data(nodesArr, (d) => d.id)
      .join(
        (enter) => {
          const g = enter
            .append("g")
            .attr("class", "node")
            .attr("tabindex", 0)
            .attr("role", "button")
            .style("cursor", "pointer")
            .style("outline", "none")
            .attr("transform", (d) => `translate(${d.x},${d.y})`);
          g.append("circle").attr("r", reduced ? 5 : 5 * CHART_MOTION.nodeFromScale);
          g.append("text").attr("dy", "0.35em");
          g.append("title");
          return g;
        },
        // interrupt(): a node re-joined while fading out must not finish its exit (remove()).
        (update) => update.interrupt(),
        (exit) => exit.transition().duration(dur).style("opacity", 0).remove(),
      );
    nodeSel
      .attr("data-node-id", (d) => d.id)
      .attr("aria-pressed", (d) => (selected === d.id ? "true" : "false"))
      .attr(
        "aria-label",
        (d) => `${d.label} (${columns[d.col]?.label ?? d.column}): ${d.degree} ${valueLabel}`,
      )
      .on("click", (_e, d) => handlers.current.select(d.id))
      .on("dblclick", (_e, d) => handlers.current.activate(d))
      .on("keydown", (e: KeyboardEvent, d) => {
        if (e.key === "Enter" && e.shiftKey) {
          e.preventDefault();
          handlers.current.activate(d);
        } else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handlers.current.select(d.id);
        } else if (e.key === "Escape") {
          handlers.current.clear();
          handlers.current.hide();
        } else if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
          e.preventDefault();
          handlers.current.move(d, e.key);
        }
      })
      .on("mouseenter", (e: MouseEvent, d) => {
        handlers.current.hover(d.id);
        handlers.current.show(e, d);
      })
      .on("mouseleave", () => {
        handlers.current.hover(null);
        handlers.current.hide();
      })
      .on("focus", function (_e, d) {
        handlers.current.hover(d.id);
        handlers.current.show(this, d);
        d3.select(this)
          .select("circle")
          .style("stroke", "hsl(var(--ring))")
          .style("stroke-width", 3);
      })
      .on("blur", function () {
        handlers.current.hover(null);
        handlers.current.hide();
        d3.select(this)
          .select("circle")
          .style("stroke", "hsl(var(--card))")
          .style("stroke-width", 1.5);
      });
    nodeSel
      .transition()
      .duration(dur)
      .ease(CHART_MOTION.d3Ease)
      .attrTween(
        "transform",
        translateTween((d: PNode) => `translate(${d.x},${d.y})`),
      )
      .style("opacity", (d) => (closure && !closure.has(d.id) ? 0.3 : 1));
    nodeSel
      .select("circle")
      .style("fill", (d) => d.color)
      .style("stroke", "hsl(var(--card))")
      .style("stroke-width", 1.5)
      .transition()
      .duration(reduced ? 0 : CHART_MOTION.nodeMs)
      .ease(CHART_MOTION.d3Ease)
      .attr("r", (d) => (active === d.id ? 7 : 5));
    const lastCol = columns.length - 1;
    nodeSel
      .select("text")
      .attr("x", (d) => (d.col === 0 ? -10 : 10))
      .attr("text-anchor", (d) => (d.col === 0 ? "end" : "start"))
      .style("font-size", `${FONT}px`)
      .style("font-weight", (d) => (active === d.id ? 700 : 400))
      .style("fill", "hsl(var(--foreground))")
      .style("paint-order", "stroke")
      .style("stroke", "hsl(var(--card))")
      .style("stroke-width", 3)
      .style("stroke-linejoin", "round")
      .style("pointer-events", "none")
      .text((d) => {
        const budget = d.col === 0 || d.col === lastCol ? labelWidth - 16 : layout.gap * 0.45;
        return truncate(d.label, Math.max(4, Math.floor(budget / (FONT * 0.56))));
      });
    nodeSel.select("title").text((d) => d.label);

    vp.select<SVGGElement>("g[data-layer=headers]")
      .selectAll<SVGTextElement, BipartiteColumn>("text")
      .data(columns, (d) => d.id)
      .join("text")
      .attr("x", (_d, i) => labelWidth + i * layout.gap)
      .attr("y", 14)
      .attr("text-anchor", (_d, i) => (i === 0 ? "end" : "start"))
      .attr("dx", (_d, i) => (i === 0 ? 6 : -6))
      .attr("aria-hidden", "true")
      .style("font-size", "11px")
      .style("font-weight", 700)
      .style("letter-spacing", "0.04em")
      .style("text-transform", "uppercase")
      .style("fill", (d, i) => d.color ?? FALLBACK[i % FALLBACK.length])
      .text((d) => d.label);
  }, [
    layout,
    measured,
    closure,
    active,
    selected,
    reduced,
    bundling,
    columns,
    labelWidth,
    valueLabel,
  ]);

  const zoomControls = showZoomControls ? (
    <div role="group" aria-label="Zoom" className="inline-flex rounded-md border p-0.5">
      {(
        [
          ["Zoom in", Plus, () => zoomBy(1.3)],
          ["Zoom out", Minus, () => zoomBy(1 / 1.3)],
          ["Reset zoom", Maximize2, zoomReset],
        ] as const
      ).map(([label, Ico, fn]) => (
        <button
          key={label}
          type="button"
          aria-label={label}
          title={label}
          onClick={fn}
          className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Ico aria-hidden className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  ) : null;

  return (
    <ChartFrame
      ariaLabel={ariaLabel}
      title={title}
      description={description}
      legend={legend}
      toolbar={
        <>
          {toolbar}
          {selected && (
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="rounded-md border px-2 py-1 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Clear selection
            </button>
          )}
          {zoomControls}
        </>
      }
      interactive
      empty={nodes.length === 0}
      className={className}
      table={{
        columns: ["From", "To", "Weight"],
        rows: layout.plinks.map((l) => [l.s.label, l.t.label, l.weight]),
      }}
      footer={
        <p className="text-[11px] text-muted-foreground">
          Drag to pan · Ctrl/⌘ + scroll or the buttons to zoom · Shift+Enter or double-click opens a
          node
        </p>
      }
    >
      <div
        ref={boxRef}
        className="relative w-full max-w-full overflow-hidden rounded-md border bg-background/40"
      >
        <svg
          ref={svgRef}
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          className="block max-w-full select-none"
          style={{ fontFamily: '"Geist Sans", system-ui, sans-serif', cursor: "grab" }}
        >
          <g data-layer="viewport">
            <g data-layer="headers" />
            <g data-layer="links" />
            <g data-layer="nodes" />
          </g>
        </svg>
      </div>
      <ChartTooltip {...tip} id={tipId} onDismiss={hide}>
        {tip.content && (
          <div className="space-y-0.5">
            <p className="font-medium">{tip.content.label}</p>
            <p className="text-muted-foreground">
              {columns[tip.content.col]?.label} · {tip.content.degree} {valueLabel}
            </p>
            <p className="text-muted-foreground">
              {selected === tip.content.id
                ? "Selected — click to clear"
                : "Click to highlight its path"}
            </p>
          </div>
        )}
      </ChartTooltip>
    </ChartFrame>
  );
}

export default Bipartite;

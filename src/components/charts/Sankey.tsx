/**
 * Sankey — weighted flows between ordered columns (d3-sankey) (§9 "Cross-framework Sankey").
 * Columns are the `groups` in order (e.g. ASI → Threats → Cisco/AIVSS); ribbon width = link value;
 * node colour = node.color → group colour → framework palette. Labels are 12 px with a halo and
 * are never truncated below the column budget (full text in <title>). Height grows with the
 * busiest column (`rowHeight` per node); below `minWidth` the chart scrolls horizontally.
 *
 * Interactions: hover/focus a node to highlight everything connected up- and downstream;
 * click / Enter pins the highlight (click again or Escape to unpin); arrow keys move between
 * nodes (↑↓ within a column, ←→ to a connected node in the neighbouring column); hovering a
 * ribbon shows "A → B · value". Group legend toggles hide whole columns.
 *
 * Props:
 *   nodes: { id; label; group; color?; href? }[]
 *   links: { source; target; value; label? }[]     — duplicates are summed; right-to-left links are flipped
 *   groups: { id; label; short?; color? }[]         — column order; `short` is the column header
 *                                                     when `label` does not fit the column gap
 *   ariaLabel: string; title?; description?; legend?; toolbar?
 *   colorBy?: "source" | "target" (default "source")
 *   pinnedId? / defaultPinnedId? / onPinChange?(id | null); onNodeClick?(node)
 *   hiddenGroups? / defaultHiddenGroups? / onHiddenGroupsChange?; showGroupToggles? (default true)
 *   hideIsolated?: boolean (default true)
 *   rowHeight?: number (default 24); minHeight?: number (default 280); minWidth?: number (default 640)
 *   maxHeight?: number (default 900) — cap for the value-driven height (see below)
 *   minUnitHeight?: number (default 2) — px per unit of value the height aims for, so a 1-mapping
 *        node / ribbon stays visible; the busiest column (nodes × padding + value × unit) sets H
 *   nodeWidth?: number (default 12); nodePadding?: number (default 10, raised to the label height
 *        so labels in a column never overlap); valueLabel?: string ("mappings")
 *
 * Geometry: node rects, ribbon paths and ribbon widths all come from the same d3-sankey layout
 * (node x0/x1/y0/y1, link y0/y1/width) and transition together. Ribbons draw in once, on enter,
 * at the measured width (`drawInLinks`); every update clears the dash attributes.
 *
 * Usage:
 *   <Sankey ariaLabel="Mappings from OWASP ASI to threats to Cisco objectives"
 *     groups={[{ id: "asi", label: "OWASP ASI", color: FRAMEWORK_PALETTE.asi.css }, …]}
 *     nodes={nodes} links={links} onNodeClick={(n) => n.href && navigate(n.href)} />
 */

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as d3 from "d3";
import {
  sankey as d3Sankey,
  sankeyLinkHorizontal,
  type SankeyLink,
  type SankeyNode,
} from "d3-sankey";
import { FRAMEWORK_ORDER, FRAMEWORK_PALETTE } from "@/lib/palette";
import { ChartFrame, ChartLegend } from "./ChartFrame";
import { ChartTooltip } from "./ChartTooltip";
import { useChartTooltip } from "./useChartTooltip";
import { useResizeObserver } from "./useResizeObserver";
import { CHART_MOTION, clearLinkDraw, drawInLinks, usePrefersReducedMotion } from "./motion";
import {
  approxTextWidth,
  connectedClosure,
  cssEscape,
  truncate,
  translateTween,
} from "./chartUtils";

export interface SankeyNodeDatum {
  id: string;
  label: string;
  group: string;
  color?: string;
  href?: string;
}
export interface SankeyLinkDatum {
  source: string;
  target: string;
  value: number;
  label?: string;
}
export interface SankeyGroup {
  id: string;
  label: string;
  /** Shorter column header used when `label` is wider than the column gap. */
  short?: string;
  color?: string;
}

export interface SankeyProps {
  nodes: SankeyNodeDatum[];
  links: SankeyLinkDatum[];
  groups: SankeyGroup[];
  ariaLabel: string;
  title?: ReactNode;
  description?: ReactNode;
  legend?: ReactNode;
  toolbar?: ReactNode;
  colorBy?: "source" | "target";
  pinnedId?: string | null;
  defaultPinnedId?: string | null;
  onPinChange?: (id: string | null) => void;
  onNodeClick?: (node: SankeyNodeDatum) => void;
  hiddenGroups?: string[];
  defaultHiddenGroups?: string[];
  onHiddenGroupsChange?: (ids: string[]) => void;
  showGroupToggles?: boolean;
  hideIsolated?: boolean;
  rowHeight?: number;
  minHeight?: number;
  maxHeight?: number;
  minUnitHeight?: number;
  minWidth?: number;
  nodeWidth?: number;
  nodePadding?: number;
  valueLabel?: string;
  className?: string;
}

type NExtra = SankeyNodeDatum & { dummy?: boolean; order: number; col: number; color: string };
type LExtra = { key: string; label?: string; dummy?: boolean };
type SNode = SankeyNode<NExtra, LExtra>;
type SLink = SankeyLink<NExtra, LExtra>;
type PathEl = SVGPathElement;

const FONT = 12;
const HEADER = 28;
/** Minimum gap between neighbouring nodes in a column: one 12 px label line plus breathing room. */
const LABEL_GAP = FONT + 4;
const GROUP_FALLBACK = FRAMEWORK_ORDER.map((k) => FRAMEWORK_PALETTE[k].css);

export function Sankey({
  nodes,
  links,
  groups,
  ariaLabel,
  title,
  description,
  legend,
  toolbar,
  colorBy = "source",
  pinnedId,
  defaultPinnedId = null,
  onPinChange,
  onNodeClick,
  hiddenGroups,
  defaultHiddenGroups,
  onHiddenGroupsChange,
  showGroupToggles = true,
  hideIsolated = true,
  rowHeight = 24,
  minHeight = 280,
  maxHeight = 900,
  minUnitHeight = 2,
  minWidth = 640,
  nodeWidth = 12,
  nodePadding = 10,
  valueLabel = "mappings",
  className,
}: SankeyProps) {
  const reduced = usePrefersReducedMotion();
  const { ref: boxRef, width, measured } = useResizeObserver<HTMLDivElement>({ initialWidth: 960 });
  const svgRef = useRef<SVGSVGElement>(null);
  const [innerPinned, setInnerPinned] = useState<string | null>(defaultPinnedId);
  const pinned = pinnedId !== undefined ? pinnedId : innerPinned;
  const setPinned = (id: string | null) => {
    if (pinnedId === undefined) setInnerPinned(id);
    onPinChange?.(id);
  };
  const [hovered, setHovered] = useState<string | null>(null);
  const [innerHidden, setInnerHidden] = useState<string[]>(defaultHiddenGroups ?? []);
  const hidden = useMemo(() => new Set(hiddenGroups ?? innerHidden), [hiddenGroups, innerHidden]);
  const toggleGroup = (id: string) => {
    const next = hidden.has(id) ? [...hidden].filter((g) => g !== id) : [...hidden, id];
    if (hiddenGroups === undefined) setInnerHidden(next);
    onHiddenGroupsChange?.(next);
  };
  const {
    tip,
    show,
    hide,
    id: tipId,
  } = useChartTooltip<{ kind: "node"; node: SNode } | { kind: "link"; link: SLink }>();

  const groupColor = useMemo(() => {
    const m = new Map<string, string>();
    groups.forEach((g, i) => m.set(g.id, g.color ?? GROUP_FALLBACK[i % GROUP_FALLBACK.length]));
    return m;
  }, [groups]);

  const visibleGroups = useMemo(() => groups.filter((g) => !hidden.has(g.id)), [groups, hidden]);

  // Clean graph: visible groups only, links left→right, duplicates summed.
  const graph = useMemo(() => {
    const col = new Map(visibleGroups.map((g, i) => [g.id, i]));
    const nodeById = new Map(nodes.filter((n) => col.has(n.group)).map((n) => [n.id, n]));
    const sums = new Map<
      string,
      { source: string; target: string; value: number; label?: string }
    >();
    for (const l of links) {
      let s = nodeById.get(l.source);
      let t = nodeById.get(l.target);
      if (!s || !t || !(l.value > 0) || s.group === t.group) continue;
      if ((col.get(s.group) ?? 0) > (col.get(t.group) ?? 0)) [s, t] = [t, s];
      const key = `${s.id}→${t.id}`;
      const prev = sums.get(key);
      if (prev) prev.value += l.value;
      else sums.set(key, { source: s.id, target: t.id, value: l.value, label: l.label });
    }
    const linked = new Set<string>();
    sums.forEach((l) => {
      linked.add(l.source);
      linked.add(l.target);
    });
    const kept = [...nodeById.values()].filter((n) => !hideIsolated || linked.has(n.id));
    return { col, nodes: kept, links: [...sums.entries()].map(([key, l]) => ({ ...l, key })) };
  }, [nodes, links, visibleGroups, hideIsolated]);

  // Per column: node count and total node value (d3-sankey node value = max(in, out)).
  const columnStats = useMemo(() => {
    const stats = visibleGroups.map(() => ({ n: 0, value: 0 }));
    const inSum = new Map<string, number>();
    const outSum = new Map<string, number>();
    graph.links.forEach((l) => {
      outSum.set(l.source, (outSum.get(l.source) ?? 0) + l.value);
      inSum.set(l.target, (inSum.get(l.target) ?? 0) + l.value);
    });
    graph.nodes.forEach((n) => {
      const s = stats[graph.col.get(n.group) ?? 0];
      s.n += 1;
      s.value += Math.max(inSum.get(n.id) ?? 0, outSum.get(n.id) ?? 0);
    });
    return stats;
  }, [graph, visibleGroups]);

  const pad = Math.max(nodePadding, LABEL_GAP);
  const W = Math.max(minWidth, width || 960);
  // Height: a label row per node in the densest column, and enough room in the busiest column
  // (its paddings, incl. the zero-height dummy, plus value × minUnitHeight) that small nodes and
  // their ribbons stay visible; the value-driven part is capped at maxHeight.
  const demand = Math.max(0, ...columnStats.map((c) => c.n * pad + c.value * minUnitHeight));
  const H = Math.max(
    minHeight,
    Math.max(1, ...columnStats.map((c) => c.n)) * rowHeight + HEADER + 12,
    Math.min(maxHeight, Math.ceil(demand) + HEADER + 6),
  );

  // Label budgets: first column labels sit left, the rest sit right of their node.
  const firstLabels = graph.nodes.filter((n) => graph.col.get(n.group) === 0).map((n) => n.label);
  const lastIdx = visibleGroups.length - 1;
  const lastLabels = graph.nodes
    .filter((n) => graph.col.get(n.group) === lastIdx)
    .map((n) => n.label);
  const leftPad = Math.min(
    220,
    Math.max(60, ...firstLabels.map((l) => approxTextWidth(l, FONT) + 10)),
  );
  const rightPad = Math.min(
    220,
    Math.max(60, ...lastLabels.map((l) => approxTextWidth(l, FONT) + 10)),
  );
  const colGap =
    visibleGroups.length > 1 ? (W - leftPad - rightPad) / (visibleGroups.length - 1) : W;
  const midBudget = Math.max(40, colGap - nodeWidth - 16);

  const layout = useMemo(() => {
    if (!graph.links.length || visibleGroups.length < 2) return null;
    const order = new Map(graph.nodes.map((n, i) => [n.id, i]));
    const sNodes: NExtra[] = graph.nodes.map((n) => ({
      ...n,
      order: order.get(n.id) ?? 0,
      col: graph.col.get(n.group) ?? 0,
      color: n.color ?? groupColor.get(n.group) ?? GROUP_FALLBACK[0],
    }));
    // Zero-value dummy chain guarantees one column per visible group (d3-sankey derives the
    // column count from graph depth). Dummies sort last and are never drawn.
    const dummies: NExtra[] = visibleGroups.map((g, i) => ({
      id: `__dummy_${i}`,
      label: "",
      group: g.id,
      dummy: true,
      order: Number.MAX_SAFE_INTEGER - visibleGroups.length + i,
      col: i,
      color: "transparent",
    }));
    const dummyLinks = dummies.slice(1).map((d, i) => ({
      source: dummies[i].id,
      target: d.id,
      value: 0,
      key: `dummy-${i}`,
      dummy: true,
    }));
    const gen = d3Sankey<NExtra, LExtra>()
      .nodeId((d) => d.id)
      .nodeAlign((n) => n.col)
      .nodeSort((a, b) => a.order - b.order)
      .linkSort(null)
      .nodeWidth(nodeWidth)
      .nodePadding(pad)
      .extent([
        [leftPad, HEADER],
        [W - rightPad, H - 6],
      ]);
    try {
      return gen({
        nodes: [...sNodes, ...dummies],
        links: [
          ...graph.links.map((l) => ({
            source: l.source,
            target: l.target,
            value: l.value,
            key: l.key,
            label: l.label,
          })),
          ...dummyLinks,
        ],
      });
    } catch {
      return null;
    }
  }, [graph, visibleGroups, groupColor, nodeWidth, pad, leftPad, rightPad, W, H]);

  const active = pinned ?? hovered;
  const closure = useMemo(
    () => (active ? connectedClosure(active, graph.links) : null),
    [active, graph.links],
  );

  const handlers = useRef({
    pin: (_id: string) => {},
    unpin: () => {},
    hover: (_id: string | null) => {},
    show,
    hide,
    move: (_n: SNode, _key: string) => {},
  });
  handlers.current = {
    pin: (id) => {
      const node = graph.nodes.find((n) => n.id === id);
      setPinned(pinned === id ? null : id);
      if (node) onNodeClick?.(node);
    },
    unpin: () => setPinned(null),
    hover: setHovered,
    show,
    hide,
    move: (n, key) => {
      if (!layout) return;
      const real = (layout.nodes as SNode[]).filter((x) => !x.dummy);
      let next: SNode | undefined;
      if (key === "ArrowDown" || key === "ArrowUp") {
        const same = real.filter((x) => x.col === n.col).sort((a, b) => (a.y0 ?? 0) - (b.y0 ?? 0));
        const i = same.indexOf(n);
        next = same[key === "ArrowDown" ? i + 1 : i - 1];
      } else {
        const right = key === "ArrowRight";
        const cand = (right ? n.sourceLinks : n.targetLinks)?.map((l) =>
          right ? (l.target as SNode) : (l.source as SNode),
        );
        next = cand?.filter((x) => !x.dummy).sort((a, b) => (a.y0 ?? 0) - (b.y0 ?? 0))[0];
      }
      if (next) {
        svgRef.current
          ?.querySelector<SVGGElement>(`g[data-node-id="${cssEscape(next.id)}"]`)
          ?.focus();
      }
    },
  };

  useEffect(() => {
    const svg = svgRef.current;
    // Wait for the container width so the first (animated) draw happens at the final geometry.
    if (!svg || !measured) return;
    const sel = d3.select(svg);
    const dur = reduced ? 0 : CHART_MOTION.updateMs;
    // Nodes and ribbons share one duration so they never drift apart during a re-layout.
    const geomMs = reduced ? 0 : CHART_MOTION.nodeMs;
    const realNodes = layout ? (layout.nodes as SNode[]).filter((n) => !n.dummy) : [];
    // Paint order: ribbons that skip columns first, so they sit under the ribbons that end in the
    // column they cross (a small node there is never hidden behind a wide pass-through ribbon).
    const span = (l: SLink) => (l.target as SNode).col - (l.source as SNode).col;
    const realLinks = layout
      ? (layout.links as SLink[]).filter((l) => !l.dummy).sort((a, b) => span(b) - span(a))
      : [];
    const path = sankeyLinkHorizontal<NExtra, LExtra>();
    const colorOfLink = (l: SLink) =>
      ((colorBy === "source" ? l.source : l.target) as SNode).color ?? "hsl(var(--primary))";
    const linkOn = (l: SLink) =>
      !closure || (closure.has((l.source as SNode).id) && closure.has((l.target as SNode).id));
    const linkWidth = (l: SLink) => Math.max(1.5, l.width ?? 1);
    const linkOpacity = (l: SLink) => (closure ? (linkOn(l) ? 0.7 : 0.06) : 0.32);

    // Ribbons. The draw-in runs once, on enter, from the final path; any update / re-join
    // (re-layout, resize, highlight) or exit clears it, so no path is ever left part-dashed.
    const linkSel = sel
      .select<SVGGElement>("g[data-layer=links]")
      .selectAll<PathEl, SLink>("path")
      .data(realLinks, (d) => d.key)
      .join(
        (enter) =>
          enter
            .append<PathEl>("path")
            .attr("fill", "none")
            .attr("d", (d) => path(d) ?? "")
            .attr("stroke-width", linkWidth)
            .style("stroke-opacity", linkOpacity)
            .call((s) => drawInLinks(s, reduced)),
        (update) => clearLinkDraw(update.interrupt().style("opacity", null)),
        (exit) => clearLinkDraw(exit).transition().duration(dur).style("opacity", 0).remove(),
      );
    linkSel
      .order()
      .style("stroke", (d) => colorOfLink(d))
      .style("mix-blend-mode", "normal")
      .on("mousemove", (e: MouseEvent, d) => handlers.current.show(e, { kind: "link", link: d }))
      .on("mouseleave", () => handlers.current.hide());
    linkSel
      .transition()
      .duration(geomMs)
      .ease(CHART_MOTION.d3Ease)
      .attr("d", (d) => path(d) ?? "")
      .attr("stroke-width", linkWidth)
      .style("stroke-opacity", linkOpacity);

    // Nodes
    const nodeSel = sel
      .select<SVGGElement>("g[data-layer=nodes]")
      .selectAll<SVGGElement, SNode>("g.node")
      .data(realNodes, (d) => d.id)
      .join(
        (enter) => {
          const g = enter
            .append("g")
            .attr("class", "node")
            .attr("tabindex", 0)
            .attr("role", "button")
            .style("cursor", "pointer")
            .style("outline", "none")
            .style("opacity", 0)
            .attr("transform", (d) => `translate(${d.x0},${d.y0})`);
          g.append("rect")
            .attr("rx", 2)
            .attr("width", (d) => (d.x1 ?? 0) - (d.x0 ?? 0))
            .attr("height", 0);
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
      .attr("aria-pressed", (d) => (pinned === d.id ? "true" : "false"))
      .attr("aria-label", (d) => {
        const ins = d.targetLinks?.filter((l) => !l.dummy).length ?? 0;
        const outs = d.sourceLinks?.filter((l) => !l.dummy).length ?? 0;
        const grp = groups.find((g) => g.id === d.group)?.label ?? d.group;
        return `${d.label} (${grp}): ${d.value ?? 0} ${valueLabel}, ${ins} in, ${outs} out`;
      })
      .on("click", (_e, d) => handlers.current.pin(d.id))
      .on("keydown", (e: KeyboardEvent, d) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handlers.current.pin(d.id);
        } else if (e.key === "Escape") {
          handlers.current.unpin();
          handlers.current.hide();
        } else if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
          e.preventDefault();
          handlers.current.move(d, e.key);
        }
      })
      .on("mouseenter", (e: MouseEvent, d) => {
        handlers.current.hover(d.id);
        handlers.current.show(e, { kind: "node", node: d });
      })
      .on("mouseleave", () => {
        handlers.current.hover(null);
        handlers.current.hide();
      })
      .on("focus", function (_e, d) {
        handlers.current.hover(d.id);
        handlers.current.show(this, { kind: "node", node: d });
        d3.select(this).select("rect").style("stroke", "hsl(var(--ring))").style("stroke-width", 2);
      })
      .on("blur", function () {
        handlers.current.hover(null);
        handlers.current.hide();
        d3.select(this).select("rect").style("stroke", null).style("stroke-width", null);
      });

    nodeSel
      .transition()
      .duration(geomMs)
      .ease(CHART_MOTION.d3Ease)
      .attrTween(
        "transform",
        translateTween((d: SNode) => `translate(${d.x0},${d.y0})`),
      )
      .style("opacity", (d) => (closure && !closure.has(d.id) ? 0.35 : 1));
    nodeSel
      .select("rect")
      .style("fill", (d) => d.color)
      .transition()
      .duration(geomMs)
      .ease(CHART_MOTION.d3Ease)
      .attr("width", (d) => (d.x1 ?? 0) - (d.x0 ?? 0))
      .attr("height", (d) => Math.max(2, (d.y1 ?? 0) - (d.y0 ?? 0)));
    nodeSel
      .select("text")
      .attr("x", (d) => (d.col === 0 ? -6 : (d.x1 ?? 0) - (d.x0 ?? 0) + 6))
      .attr("y", (d) => Math.max(2, (d.y1 ?? 0) - (d.y0 ?? 0)) / 2)
      .attr("text-anchor", (d) => (d.col === 0 ? "end" : "start"))
      .style("font-size", `${FONT}px`)
      .style("font-weight", (d) => (active === d.id ? 700 : 500))
      .style("fill", "hsl(var(--foreground))")
      .style("paint-order", "stroke")
      .style("stroke", "hsl(var(--card))")
      .style("stroke-width", 3)
      .style("stroke-linejoin", "round")
      .style("pointer-events", "none")
      .text((d) => {
        const budget = d.col === 0 ? leftPad - 10 : d.col === lastIdx ? rightPad - 10 : midBudget;
        return truncate(d.label, Math.max(4, Math.floor(budget / (FONT * 0.56))));
      });
    nodeSel.select("title").text((d) => `${d.label}: ${d.value ?? 0} ${valueLabel}`);

    // Column headers: full label when it fits the space the column owns, else `short`, else
    // truncated (11 px bold uppercase + 0.04em tracking ≈ 0.72em per character).
    const headerBudget = (i: number) =>
      i === 0 ? leftPad + nodeWidth : i === lastIdx ? rightPad + nodeWidth : colGap - 12;
    const headerText = (g: SankeyGroup, i: number) => {
      const per = 11 * 0.72;
      const budget = headerBudget(i);
      if (g.label.length * per <= budget) return g.label;
      if (g.short && g.short.length * per <= budget) return g.short;
      return truncate(g.short ?? g.label, Math.max(4, Math.floor(budget / per)));
    };
    const cols = layout
      ? visibleGroups.map((g, i) => {
          const any = (layout.nodes as SNode[]).find((n) => n.col === i);
          return { g, i, x: ((any?.x0 ?? 0) + (any?.x1 ?? 0)) / 2 };
        })
      : [];
    sel
      .select<SVGGElement>("g[data-layer=headers]")
      .selectAll<SVGTextElement, (typeof cols)[number]>("text")
      .data(cols, (d) => d.g.id)
      .join("text")
      .attr("y", 14)
      .attr("x", (d) => d.x)
      .attr("text-anchor", (d) => (d.i === 0 ? "end" : d.i === lastIdx ? "start" : "middle"))
      .attr("dx", (d) => (d.i === 0 ? nodeWidth / 2 : d.i === lastIdx ? -nodeWidth / 2 : 0))
      .attr("aria-hidden", "true")
      .style("font-size", "11px")
      .style("font-weight", 700)
      .style("letter-spacing", "0.04em")
      .style("text-transform", "uppercase")
      .style("fill", (d) => groupColor.get(d.g.id) ?? "hsl(var(--muted-foreground))")
      .text((d) => headerText(d.g, d.i));
  }, [
    layout,
    measured,
    closure,
    active,
    pinned,
    reduced,
    colorBy,
    groups,
    visibleGroups,
    groupColor,
    leftPad,
    rightPad,
    midBudget,
    colGap,
    lastIdx,
    nodeWidth,
    valueLabel,
  ]);

  const legendNode =
    legend ??
    (showGroupToggles ? (
      <ChartLegend
        items={groups.map((g) => ({ id: g.id, label: g.label, color: groupColor.get(g.id) ?? "" }))}
        hidden={hidden}
        onToggle={toggleGroup}
      />
    ) : undefined);

  return (
    <ChartFrame
      ariaLabel={ariaLabel}
      title={title}
      description={description}
      legend={legendNode}
      toolbar={
        <>
          {toolbar}
          {pinned && (
            <button
              type="button"
              onClick={() => setPinned(null)}
              className="rounded-md border px-2 py-1 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Clear highlight
            </button>
          )}
        </>
      }
      interactive
      empty={!layout && !hidden.size}
      className={className}
      table={{
        columns: ["From", "To", "Value"],
        rows: graph.links.map((l) => [
          graph.nodes.find((n) => n.id === l.source)?.label ?? l.source,
          graph.nodes.find((n) => n.id === l.target)?.label ?? l.target,
          l.value,
        ]),
      }}
    >
      <div ref={boxRef} className="relative w-full max-w-full overflow-x-auto">
        {layout ? (
          <svg
            ref={svgRef}
            width={W}
            height={H}
            viewBox={`0 0 ${W} ${H}`}
            className="block"
            style={{ fontFamily: '"Geist Sans", system-ui, sans-serif' }}
          >
            <g data-layer="headers" />
            <g data-layer="links" />
            <g data-layer="nodes" />
          </svg>
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Show at least two groups with mappings to draw the flow.
          </p>
        )}
      </div>
      <ChartTooltip {...tip} id={tipId} onDismiss={hide}>
        {tip.content?.kind === "node" && (
          <div className="space-y-0.5">
            <p className="font-medium">{tip.content.node.label}</p>
            <p className="text-muted-foreground">
              {tip.content.node.value ?? 0} {valueLabel}
            </p>
            <p className="text-muted-foreground">
              {pinned === tip.content.node.id ? "Pinned — click to unpin" : "Click to pin"}
            </p>
          </div>
        )}
        {tip.content?.kind === "link" && (
          <div className="space-y-0.5">
            <p className="font-medium">
              {(tip.content.link.source as SNode).label} →{" "}
              {(tip.content.link.target as SNode).label}
            </p>
            <p className="text-muted-foreground">
              {tip.content.link.value} {valueLabel}
              {tip.content.link.label ? ` · ${tip.content.link.label}` : ""}
            </p>
          </div>
        )}
      </ChartTooltip>
    </ChartFrame>
  );
}

export default Sankey;

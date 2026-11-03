/**
 * ArchitectureNavigator — expandable graph explorer: architecture patterns → key components →
 * threats → mitigations (IMPROVEMENT_PLAN P4-08). Lives in /architectures?view=graph (dialog).
 *
 * - D3 joins are incremental (keyed by id): expanding animates new nodes out of their parent and
 *   collapsing pulls them back in; nothing is redrawn from scratch (§8.4, P1-09).
 * - Colours come from useChartTheme() and update live on theme toggle: architectures = primary,
 *   components = their KC colour, threats = risk band, mitigations = the "low" (safe) token.
 *   Every node also carries a type letter, so colour is never the only cue.
 * - Nodes are keyboard operable (Tab, Enter/Space to expand, focus shows the tooltip).
 * - "Collapse others" keeps only the selected node's branch open.
 * - Component names come from the shared componentDataMap.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Maximize,
  Minimize,
  RotateCcw,
  Search,
  Shrink,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { architecturesData, type Architecture } from "../components/architecturesData";
import { getComponentById } from "../components/frameworkData";
import { componentDataMap } from "../components/componentDataMap";
import { threatsData, mitigationsData } from "../components/securityData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RiskScore } from "@/components/content/RiskScore";
import { useChartTheme, type ChartTheme } from "@/components/charts/useChartTheme";
import { useResizeObserver } from "@/components/charts/useResizeObserver";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { kcByCode } from "@/data/kc";
import { riskBand } from "@/lib/severity";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

type NodeType = "architecture" | "component" | "threat" | "mitigation";

interface GraphNode {
  id: string;
  name: string;
  type: NodeType;
  description: string;
  size: number;
  riskScore?: number;
  tags?: string[];
  parentArchId?: string;
  parentCompId?: string;
  /** Node this one grows out of when it appears (and retracts into when it goes). */
  originId?: string;
}

interface GraphLink {
  id: string;
  source: string;
  target: string;
  type: "arch-comp" | "comp-threat" | "threat-mitigation";
}

type Pos = { x: number; y: number };

const TYPES: NodeType[] = ["architecture", "component", "threat", "mitigation"];
const TYPE_LETTER: Record<NodeType, string> = {
  architecture: "A",
  component: "C",
  threat: "T",
  mitigation: "M",
};
const LABEL_SIZE: Record<NodeType, number> = {
  architecture: 12,
  component: 10,
  threat: 9,
  mitigation: 8,
};
const LETTER_SIZE: Record<NodeType, number> = {
  architecture: 16,
  component: 11,
  threat: 9,
  mitigation: 8,
};
const DARK_TEXT = "hsl(240 10% 8%)";

function componentInfo(id: string): { title: string; description: string; tags?: string[] } | null {
  const shared = componentDataMap[id];
  const node = getComponentById(id);
  if (!shared && !node) return null;
  return {
    title: shared?.title ?? node?.title ?? id.toUpperCase(),
    description: shared?.description ?? node?.description ?? "",
    tags: node?.threatCategories,
  };
}

function nodeColor(node: GraphNode, theme: ChartTheme): string {
  switch (node.type) {
    case "architecture":
      return theme.primary;
    case "component": {
      const kc = kcByCode(node.id);
      return kc ? theme.kc[kc.id] : theme.mutedForeground;
    }
    case "threat":
      return theme.severity[riskBand(node.riskScore)];
    case "mitigation":
      return theme.severity.low;
  }
}

function legendColor(type: NodeType, theme: ChartTheme): string {
  if (type === "architecture") return theme.primary;
  if (type === "component") return theme.kc.kc2;
  if (type === "threat") return theme.severity.high;
  return theme.severity.low;
}

function linkColor(type: GraphLink["type"], theme: ChartTheme): string {
  if (type === "arch-comp") return theme.primary;
  if (type === "comp-threat") return theme.severity.high;
  return theme.severity.low;
}

function getDetailPath(node: GraphNode): string | null {
  switch (node.type) {
    case "architecture":
      return `/architectures/${node.id}`;
    case "component":
      return `/components/${node.id}`;
    case "threat":
      return `/threats/${node.id}`;
    case "mitigation":
      return `/controls/${node.id}`;
    default:
      return null;
  }
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.substring(0, max) + "…" : text;
}

function threatAffects(threatId: string, compId: string): boolean {
  const threat = threatsData[threatId];
  const root = compId.split(".")[0];
  return (threat?.componentIds ?? []).some((c) => {
    const cid = c.replace(/-/g, ".");
    return cid === compId || cid === root;
  });
}

// ── Graph model (pure) ─────────────────────────────────────────────────────

function buildGraph(
  architectures: Architecture[],
  expandedArchitectures: ReadonlySet<string>,
  expandedComponents: ReadonlySet<string>,
) {
  const nodeMap = new Map<string, GraphNode>();
  const links: GraphLink[] = [];
  const add = (node: GraphNode) => {
    if (!nodeMap.has(node.id)) nodeMap.set(node.id, node);
  };
  const link = (source: string, target: string, type: GraphLink["type"]) =>
    links.push({ id: `${source}->${target}`, source, target, type });

  architectures.forEach((arch) =>
    add({
      id: arch.id,
      name: arch.name,
      type: "architecture",
      description: arch.description,
      size: 45,
      riskScore: arch.riskScore,
      tags: arch.tags,
    }),
  );

  expandedArchitectures.forEach((archId) => {
    const arch = architecturesData[archId];
    if (!arch) return;
    arch.keyComponents.forEach((compId) => {
      const comp = componentInfo(compId);
      if (!comp) return;
      add({
        id: compId,
        name: comp.title,
        type: "component",
        description: comp.description,
        size: 30,
        parentArchId: archId,
        tags: comp.tags,
        originId: archId,
      });
      link(archId, compId, "arch-comp");
      if (!expandedComponents.has(compId)) return;

      arch.threatIds.forEach((threatId) => {
        const threat = threatsData[threatId];
        if (!threat || !threatAffects(threatId, compId)) return;
        add({
          id: threatId,
          name: threat.name,
          type: "threat",
          description: threat.description,
          size: 20,
          riskScore: threat.riskScore,
          tags: threat.tags,
          parentCompId: compId,
          parentArchId: archId,
          originId: compId,
        });
        link(compId, threatId, "comp-threat");
        arch.mitigationIds.forEach((mitId) => {
          const mit = mitigationsData[mitId];
          if (!mit || !mit.threatIds?.includes(threatId)) return;
          add({
            id: mitId,
            name: mit.name,
            type: "mitigation",
            description: mit.description,
            size: 16,
            tags: mit.tags,
            parentCompId: compId,
            parentArchId: archId,
            originId: threatId,
          });
          link(threatId, mitId, "threat-mitigation");
        });
      });
    });
  });

  // Links can only point at nodes that exist (a deduplicated node keeps its first parent).
  const ids = new Set(nodeMap.keys());
  const uniq = new Map(
    links.filter((l) => ids.has(l.source) && ids.has(l.target)).map((l) => [l.id, l]),
  );
  return { nodes: Array.from(nodeMap.values()), links: Array.from(uniq.values()) };
}

/** Deterministic radial layout: patterns on a circle, children fanned out from their parent. */
function layout(
  nodes: GraphNode[],
  links: GraphLink[],
  width: number,
  height: number,
): Map<string, Pos> {
  const pos = new Map<string, Pos>();
  const cx = width / 2;
  const cy = height / 2;
  const scale = width < 768 ? 0.65 : 1;
  const archs = nodes.filter((n) => n.type === "architecture");
  const archRadius = Math.min(cx, cy) * 0.85;
  archs.forEach((arch, i) => {
    const angle = (2 * Math.PI * i) / Math.max(1, archs.length) - Math.PI / 2;
    pos.set(arch.id, {
      x: cx + archRadius * Math.cos(angle),
      y: cy + archRadius * Math.sin(angle),
    });
  });

  const fan = (
    children: GraphNode[],
    parent: Pos,
    grand: Pos,
    spreadMax: number,
    per: number,
    dist: number,
  ) => {
    const base = Math.atan2(parent.y - grand.y, parent.x - grand.x);
    const spread = Math.min(spreadMax, children.length * per);
    const start = base - spread / 2;
    const step = children.length > 1 ? spread / (children.length - 1) : 0;
    children.forEach((child, i) => {
      if (pos.has(child.id)) return;
      const a = start + step * i;
      pos.set(child.id, { x: parent.x + dist * Math.cos(a), y: parent.y + dist * Math.sin(a) });
    });
  };

  const centre = { x: cx, y: cy };
  archs.forEach((arch) => {
    const p = pos.get(arch.id);
    if (!p) return;
    const comps = nodes.filter((n) => n.type === "component" && n.parentArchId === arch.id);
    fan(comps, p, centre, Math.PI * 1.2, 0.45, 240 * scale);
  });
  nodes
    .filter((n) => n.type === "component")
    .forEach((comp) => {
      const p = pos.get(comp.id);
      const gp = pos.get(comp.parentArchId ?? "");
      if (!p || !gp) return;
      const threats = nodes.filter((n) => n.type === "threat" && n.parentCompId === comp.id);
      fan(threats, p, gp, Math.PI, 0.5, 160 * scale);
    });
  nodes
    .filter((n) => n.type === "threat")
    .forEach((threat) => {
      const p = pos.get(threat.id);
      const gp = pos.get(threat.parentCompId ?? "");
      if (!p || !gp) return;
      const mitIds = new Set(links.filter((l) => l.source === threat.id).map((l) => l.target));
      const mits = nodes.filter((n) => n.type === "mitigation" && mitIds.has(n.id));
      fan(mits, p, gp, Math.PI * 0.8, 0.5, 110 * scale);
    });
  return pos;
}

// ── Main Component ─────────────────────────────────────────────────────────

const ArchitectureNavigator: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const explorerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const posRef = useRef<Map<string, Pos>>(new Map());
  const fitKeyRef = useRef("");
  const fitRef = useRef<() => void>(() => {});
  const theme = useChartTheme();
  const reduced = useReducedMotion();
  const {
    ref: containerRef,
    width,
    height,
  } = useResizeObserver<HTMLDivElement>({
    initialWidth: 800,
    initialHeight: 600,
  });
  const dimensions = useMemo(
    () => ({
      width: Math.max(320, width),
      height: Math.max(width < 768 ? 400 : 560, height),
    }),
    [width, height],
  );

  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 200);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedArchitectures, setExpandedArchitectures] = useState<Set<string>>(new Set());
  const [expandedComponents, setExpandedComponents] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<Record<NodeType, boolean>>({
    architecture: true,
    component: true,
    threat: true,
    mitigation: true,
  });
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    name: string;
    type: string;
  } | null>(null);

  const allArchitectures = useMemo(
    () =>
      Object.values(architecturesData).sort(
        (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
      ),
    [],
  );

  const { nodes, links } = useMemo(
    () => buildGraph(allArchitectures, expandedArchitectures, expandedComponents),
    [allArchitectures, expandedArchitectures, expandedComponents],
  );

  // ── Filter by search & type toggles ──────────────────────────────────
  const filteredData = useMemo(() => {
    const s = debouncedSearch.toLowerCase();
    const filteredNodes = nodes.filter((node) => {
      if (!filters[node.type]) return false;
      if (!s) return true;
      return (
        node.name.toLowerCase().includes(s) ||
        node.description.toLowerCase().includes(s) ||
        (node.tags ?? []).some((tag) => tag.toLowerCase().includes(s))
      );
    });
    const ids = new Set(filteredNodes.map((n) => n.id));
    return {
      nodes: filteredNodes,
      links: links.filter((l) => ids.has(l.source) && ids.has(l.target)),
    };
  }, [nodes, links, filters, debouncedSearch]);

  const connectedCount = useMemo(() => {
    if (!selectedNode) return 0;
    const ids = new Set<string>();
    filteredData.links.forEach((l) => {
      if (l.source === selectedNode.id) ids.add(l.target);
      if (l.target === selectedNode.id) ids.add(l.source);
    });
    return ids.size;
  }, [selectedNode, filteredData.links]);

  // ── Expand / collapse ────────────────────────────────────────────────
  const toggleArchitecture = useCallback((archId: string) => {
    setExpandedArchitectures((prev) => {
      const next = new Set(prev);
      if (next.has(archId)) {
        next.delete(archId);
        setExpandedComponents((prevComps) => {
          const nextComps = new Set(prevComps);
          architecturesData[archId]?.keyComponents.forEach((c) => nextComps.delete(c));
          return nextComps;
        });
      } else {
        next.add(archId);
      }
      return next;
    });
  }, []);

  const toggleComponent = useCallback((compId: string) => {
    setExpandedComponents((prev) => {
      const next = new Set(prev);
      if (next.has(compId)) next.delete(compId);
      else next.add(compId);
      return next;
    });
  }, []);

  const activate = useCallback(
    (d: GraphNode) => {
      setSelectedNode(d);
      if (d.type === "architecture") toggleArchitecture(d.id);
      else if (d.type === "component") toggleComponent(d.id);
    },
    [toggleArchitecture, toggleComponent],
  );

  const collapseAll = useCallback(() => {
    setExpandedArchitectures(new Set());
    setExpandedComponents(new Set());
    setSelectedNode(null);
  }, []);

  /** Keep only the selected node's branch open. */
  const focusArchId =
    selectedNode?.type === "architecture" ? selectedNode.id : selectedNode?.parentArchId;
  const focusCompId =
    selectedNode?.type === "component" ? selectedNode.id : selectedNode?.parentCompId;
  const canCollapseOthers =
    !!focusArchId &&
    (Array.from(expandedArchitectures).some((a) => a !== focusArchId) ||
      Array.from(expandedComponents).some((c) => c !== focusCompId));
  const collapseOthers = useCallback(() => {
    if (!focusArchId) return;
    setExpandedArchitectures(new Set([focusArchId]));
    setExpandedComponents(focusCompId ? new Set([focusCompId]) : new Set());
  }, [focusArchId, focusCompId]);

  // ── D3: one-time scaffold (zoom, layers, markers) ────────────────────
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const defs = svg.append("defs");
    (["arch-comp", "comp-threat", "threat-mitigation"] as const).forEach((type) => {
      defs
        .append("marker")
        .attr("id", `nav-arrow-${type}`)
        .attr("viewBox", "0 -4 8 8")
        .attr("refX", 8)
        .attr("refY", 0)
        .attr("markerWidth", 5)
        .attr("markerHeight", 5)
        .attr("orient", "auto")
        .append("path")
        .attr("class", `nav-arrow-${type}`)
        .attr("d", "M0,-4L8,0L0,4");
    });
    const g = svg.append("g").attr("class", "nav-viewport");
    g.append("g").attr("class", "nav-links");
    g.append("g").attr("class", "nav-nodes");
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 4])
      .on("zoom", (event) => g.attr("transform", event.transform.toString()));
    zoomRef.current = zoom;
    svg.call(zoom);
    return () => {
      svg.on(".zoom", null);
      svg.selectAll("*").remove();
      posRef.current = new Map();
      fitKeyRef.current = "";
    };
  }, []);

  // ── D3: incremental update ───────────────────────────────────────────
  useEffect(() => {
    const svgEl = svgRef.current;
    const zoom = zoomRef.current;
    if (!svgEl || !zoom) return;
    const svg = d3.select(svgEl);
    const g = svg.select<SVGGElement>("g.nav-viewport");
    const ms = (v: number) => (reduced ? 0 : v);
    const isMobile = dimensions.width < 768;
    const scale = isMobile ? 0.65 : 1;
    const { nodes: data, links: linkData } = filteredData;

    const prevPos = posRef.current;
    const pos = layout(data, linkData, dimensions.width, dimensions.height);
    const at = (id: string | undefined): Pos | undefined => (id ? pos.get(id) : undefined);
    /** Where a node grows from / retracts to. */
    const originOf = (d: GraphNode): Pos =>
      at(d.originId) ?? prevPos.get(d.originId ?? "") ?? at(d.id) ?? { x: 0, y: 0 };

    // Markers follow the theme.
    (["arch-comp", "comp-threat", "threat-mitigation"] as const).forEach((type) =>
      svg.select(`path.nav-arrow-${type}`).attr("fill", linkColor(type, theme)),
    );

    svg.on("click", () => {
      setSelectedNode(null);
      g.selectAll<SVGGElement, GraphNode>("g.node-group").style("opacity", null);
      g.selectAll<SVGLineElement, GraphLink>("line.link-line").style("opacity", null);
    });

    // Links
    g.select("g.nav-links")
      .selectAll<SVGLineElement, GraphLink>("line.link-line")
      .data(linkData, (l) => l.id)
      .join(
        (enter) =>
          enter
            .append("line")
            .attr("class", "link-line")
            .attr("x1", (l) => at(l.source)?.x ?? 0)
            .attr("y1", (l) => at(l.source)?.y ?? 0)
            .attr("x2", (l) => at(l.source)?.x ?? 0)
            .attr("y2", (l) => at(l.source)?.y ?? 0)
            .attr("stroke-opacity", 0),
        (update) => update,
        (exit) => {
          const t = exit.transition().duration(ms(250));
          t.attr("stroke-opacity", 0)
            .attr("x2", function () {
              return Number(d3.select(this).attr("x1"));
            })
            .attr("y2", function () {
              return Number(d3.select(this).attr("y1"));
            })
            .remove();
          return exit;
        },
      )
      .attr("stroke", (l) => linkColor(l.type, theme))
      .attr("stroke-width", (l) => (l.type === "arch-comp" ? 2 : 1.5))
      .attr("marker-end", (l) => `url(#nav-arrow-${l.type})`)
      .transition()
      .duration(ms(450))
      .ease(d3.easeCubicOut)
      .attr("stroke-opacity", 0.5)
      .attr("x1", (l) => at(l.source)?.x ?? 0)
      .attr("y1", (l) => at(l.source)?.y ?? 0)
      .attr("x2", (l) => at(l.target)?.x ?? 0)
      .attr("y2", (l) => at(l.target)?.y ?? 0);

    // Nodes
    const connectedTo = (id: string) => {
      const set = new Set<string>([id]);
      linkData.forEach((l) => {
        if (l.source === id) set.add(l.target);
        if (l.target === id) set.add(l.source);
      });
      return set;
    };
    /** Instant style opacity (null restores the animated attribute opacity). */
    const highlight = (id: string | null) => {
      const keep = id ? connectedTo(id) : null;
      g.selectAll<SVGGElement, GraphNode>("g.node-group").style("opacity", (n) =>
        !keep || keep.has(n.id) ? null : 0.25,
      );
      g.selectAll<SVGLineElement, GraphLink>("line.link-line").style("opacity", (l) =>
        !id ? null : l.source === id || l.target === id ? 1 : 0.15,
      );
    };

    const merged = g
      .select("g.nav-nodes")
      .selectAll<SVGGElement, GraphNode>("g.node-group")
      .data(data, (d) => d.id)
      .join(
        (enter) => {
          const ge = enter
            .append("g")
            .attr("class", "node-group")
            .attr("tabindex", 0)
            .attr("role", "button")
            .style("cursor", "pointer")
            .style("outline", "none")
            .attr("opacity", 0)
            .attr("transform", (d) => {
              const o = originOf(d);
              return `translate(${o.x},${o.y}) scale(0.6)`;
            });
          ge.append("circle").attr("class", "glow-ring").attr("fill", "none");
          ge.append("circle").attr("class", "expanded-ring").attr("fill", "none");
          ge.append("circle").attr("class", "focus-ring").attr("fill", "none").attr("opacity", 0);
          ge.append("circle").attr("class", "main");
          ge.append("circle").attr("class", "risk-ring").attr("fill", "none");
          ge.append("text").attr("class", "letter").attr("text-anchor", "middle").attr("dy", 1);
          ge.append("text").attr("class", "label").attr("text-anchor", "middle");
          ge.append("text").attr("class", "hint").attr("text-anchor", "middle");
          return ge;
        },
        (update) => update,
        (exit) => {
          exit
            .attr("tabindex", -1)
            .transition()
            .duration(ms(250))
            .attr("opacity", 0)
            .attr("transform", (d) => {
              const o = at(d.originId) ?? prevPos.get(d.originId ?? "") ?? { x: 0, y: 0 };
              return `translate(${o.x},${o.y}) scale(0.6)`;
            })
            .remove();
          return exit;
        },
      );

    merged.attr("aria-label", (d) => {
      const expandable = d.type === "architecture" || d.type === "component";
      const open =
        (d.type === "architecture" && expandedArchitectures.has(d.id)) ||
        (d.type === "component" && expandedComponents.has(d.id));
      return `${d.type}: ${d.name}${expandable ? (open ? " (expanded)" : " (collapsed)") : ""}`;
    });
    merged.attr("aria-expanded", (d) =>
      d.type === "architecture"
        ? String(expandedArchitectures.has(d.id))
        : d.type === "component"
          ? String(expandedComponents.has(d.id))
          : null,
    );

    merged
      .select<SVGCircleElement>("circle.glow-ring")
      .attr("r", (d) => (d.size + 6) * scale)
      .attr("stroke", (d) => nodeColor(d, theme))
      .attr("stroke-width", 2)
      .attr("stroke-opacity", (d) => (d.type === "architecture" ? 0.2 : 0));
    merged
      .select<SVGCircleElement>("circle.expanded-ring")
      .attr("r", (d) => (d.size + (d.type === "architecture" ? 10 : 6)) * scale)
      .attr("stroke", (d) => nodeColor(d, theme))
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", (d) => (d.type === "architecture" ? "4,3" : "3,2"))
      .attr("stroke-opacity", (d) =>
        (d.type === "architecture" && expandedArchitectures.has(d.id)) ||
        (d.type === "component" && expandedComponents.has(d.id))
          ? 0.45
          : 0,
      );
    merged
      .select<SVGCircleElement>("circle.focus-ring")
      .attr("r", (d) => (d.size + 4) * scale)
      .attr("stroke", theme.ring)
      .attr("stroke-width", 2.5);
    merged
      .select<SVGCircleElement>("circle.main")
      .attr("r", (d) => d.size * scale)
      .attr("stroke", theme.background)
      .attr("stroke-width", (d) => (d.type === "architecture" ? 3 : 2))
      .attr("fill", (d) => nodeColor(d, theme));
    merged
      .select<SVGCircleElement>("circle.risk-ring")
      .attr("r", (d) => (d.size + 4) * scale)
      .attr("stroke", (d) => theme.severity[riskBand(d.riskScore)])
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "3,3")
      .attr("stroke-opacity", (d) => (d.type === "threat" && (d.riskScore ?? 0) > 0 ? 1 : 0));
    merged
      .select<SVGTextElement>("text.letter")
      .attr("font-size", (d) => `${LETTER_SIZE[d.type] * scale}px`)
      .attr("font-weight", 700)
      .attr("fill", (d) => (d.type === "architecture" ? theme.primaryForeground : DARK_TEXT))
      .attr("pointer-events", "none")
      .text((d) => TYPE_LETTER[d.type]);
    merged
      .select<SVGTextElement>("text.label")
      .attr("dy", (d) => (d.size + 14) * scale)
      .attr("font-size", (d) => `${LABEL_SIZE[d.type] * scale}px`)
      .attr("font-weight", (d) => (d.type === "architecture" ? 600 : 400))
      .attr("fill", theme.foreground)
      .attr("pointer-events", "none")
      .text((d) => {
        const max = d.type === "architecture" ? 22 : d.type === "component" ? 18 : 14;
        return truncate(d.name, isMobile ? max - 5 : max);
      });
    merged
      .select<SVGTextElement>("text.hint")
      .attr("dy", (d) => (d.size + (d.type === "architecture" ? 26 : 22)) * scale)
      .attr("font-size", (d) => `${(d.type === "architecture" ? 9 : 8) * scale}px`)
      .attr("fill", theme.mutedForeground)
      .attr("pointer-events", "none")
      .text((d) => {
        if (d.type === "architecture")
          return expandedArchitectures.has(d.id) ? "click to collapse" : "click to explore";
        if (d.type === "component")
          return expandedComponents.has(d.id) ? "collapse" : "expand threats";
        return "";
      });

    merged
      .on("click", (event: MouseEvent, d) => {
        event.stopPropagation();
        activate(d);
      })
      .on("keydown", (event: KeyboardEvent, d) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activate(d);
        }
      })
      .on("mouseover", (event: MouseEvent, d) => {
        setTooltip({ x: event.clientX, y: event.clientY, name: d.name, type: d.type });
        highlight(d.id);
      })
      .on("mousemove", (event: MouseEvent) =>
        setTooltip((prev) => (prev ? { ...prev, x: event.clientX, y: event.clientY } : null)),
      )
      .on("mouseout", () => {
        setTooltip(null);
        highlight(null);
      })
      .on("focus", function (_event: FocusEvent, d) {
        d3.select(this).select("circle.focus-ring").attr("opacity", 1);
        const r = (this as SVGGElement).getBoundingClientRect();
        setTooltip({ x: r.left + r.width / 2, y: r.top, name: d.name, type: d.type });
        highlight(d.id);
      })
      .on("blur", function () {
        d3.select(this).select("circle.focus-ring").attr("opacity", 0);
        setTooltip(null);
        highlight(null);
      });

    merged
      .transition()
      .duration(ms(450))
      .ease(d3.easeCubicOut)
      .attr("opacity", 1)
      .attr("transform", (d) => {
        const p = pos.get(d.id) ?? { x: 0, y: 0 };
        return `translate(${p.x},${p.y}) scale(1)`;
      });

    posRef.current = pos;

    // Fit to view when the set of nodes (or the viewport) changes — not on theme changes.
    const fit = () => {
      let x0 = Infinity;
      let y0 = Infinity;
      let x1 = -Infinity;
      let y1 = -Infinity;
      data.forEach((d) => {
        const p = pos.get(d.id);
        if (!p) return;
        const r = (d.size + 30) * scale;
        x0 = Math.min(x0, p.x - r);
        y0 = Math.min(y0, p.y - r);
        x1 = Math.max(x1, p.x + r);
        y1 = Math.max(y1, p.y + r);
      });
      if (!Number.isFinite(x0)) return;
      const bw = x1 - x0;
      const bh = y1 - y0;
      const k = Math.min(dimensions.width / (bw + 40), dimensions.height / (bh + 40), 1.6) * 0.95;
      const tx = dimensions.width / 2 - k * (x0 + bw / 2);
      const ty = dimensions.height / 2 - k * (y0 + bh / 2);
      svg
        .transition("fit")
        .duration(ms(600))
        .call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(k));
    };
    fitRef.current = fit;
    const fitKey = `${dimensions.width}x${dimensions.height}|${data.map((d) => d.id).join(",")}`;
    if (fitKey !== fitKeyRef.current && data.length) {
      fitKeyRef.current = fitKey;
      fit();
    }
  }, [
    filteredData,
    dimensions,
    expandedArchitectures,
    expandedComponents,
    theme,
    reduced,
    activate,
  ]);

  // ── Zoom controls ────────────────────────────────────────────────────
  const zoomBy = useCallback(
    (factor: number) => {
      if (svgRef.current && zoomRef.current)
        d3.select(svgRef.current)
          .transition()
          .duration(reduced ? 0 : 300)
          .call(zoomRef.current.scaleBy, factor);
    },
    [reduced],
  );
  const resetZoom = useCallback(() => {
    if (svgRef.current && zoomRef.current)
      d3.select(svgRef.current)
        .transition()
        .duration(reduced ? 0 : 300)
        .call(zoomRef.current.transform, d3.zoomIdentity);
  }, [reduced]);
  const centerView = useCallback(() => fitRef.current(), []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement && explorerRef.current) {
        await explorerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      setIsFullscreen((v) => !v);
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  if (allArchitectures.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h3 className="mb-2 text-lg font-semibold">No Data Available</h3>
          <p className="text-muted-foreground">No architecture data found.</p>
        </div>
      </div>
    );
  }

  const detailPath = selectedNode ? getDetailPath(selectedNode) : null;
  const hasExpanded = expandedArchitectures.size > 0;
  const shownCounts = TYPES.map(
    (t) => [t, filteredData.nodes.filter((n) => n.type === t).length] as const,
  );

  return (
    <div
      ref={explorerRef}
      className={cn(
        "flex h-full flex-col gap-3 lg:flex-row",
        isFullscreen && "fixed inset-0 z-[9999] bg-background p-3",
      )}
    >
      {/* Mobile sidebar toggle */}
      <div className="mb-1 flex items-center gap-2 lg:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-expanded={sidebarOpen}
          aria-controls="nav-controls"
          className="gap-1"
        >
          {sidebarOpen ? (
            <ChevronDown className="h-3 w-3" aria-hidden="true" />
          ) : (
            <ChevronRight className="h-3 w-3" aria-hidden="true" />
          )}
          Controls
        </Button>
        <span className="text-xs text-muted-foreground">{filteredData.nodes.length} nodes</span>
      </div>

      {/* Controls Panel */}
      <div
        id="nav-controls"
        className={cn(
          "shrink-0 space-y-3 overflow-y-auto lg:w-72",
          !sidebarOpen && "hidden lg:block",
          isFullscreen && "max-h-screen",
        )}
      >
        <Card>
          <CardContent className="space-y-3 p-3">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                placeholder="Search nodes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 pl-9 pr-8 text-sm"
                aria-label="Search graph nodes"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
            {debouncedSearch && filteredData.nodes.length === 0 && (
              <p className="text-xs text-muted-foreground" role="status">
                No matching nodes found.
              </p>
            )}

            <div>
              <div className="mb-1.5 text-xs font-medium text-muted-foreground">Navigation</div>
              <div className="grid grid-cols-4 gap-1.5">
                <Button
                  onClick={() => zoomBy(1.5)}
                  variant="outline"
                  size="sm"
                  aria-label="Zoom in"
                  className="h-7 px-0"
                >
                  <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
                <Button
                  onClick={() => zoomBy(1 / 1.5)}
                  variant="outline"
                  size="sm"
                  aria-label="Zoom out"
                  className="h-7 px-0"
                >
                  <ZoomOut className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
                <Button
                  onClick={centerView}
                  variant="outline"
                  size="sm"
                  aria-label="Fit to view"
                  className="h-7 px-0 text-xs"
                >
                  Fit
                </Button>
                <Button
                  onClick={resetZoom}
                  variant="outline"
                  size="sm"
                  aria-label="Reset zoom"
                  className="h-7 px-0"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <Button
                onClick={toggleFullscreen}
                variant="outline"
                size="sm"
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                className="h-7 flex-1 gap-1 text-xs"
              >
                {isFullscreen ? (
                  <Minimize className="h-3 w-3" aria-hidden="true" />
                ) : (
                  <Maximize className="h-3 w-3" aria-hidden="true" />
                )}
                {isFullscreen ? "Exit" : "Fullscreen"}
              </Button>
              {hasExpanded && (
                <Button
                  onClick={collapseAll}
                  variant="outline"
                  size="sm"
                  className="h-7 flex-1 gap-1 text-xs"
                >
                  <RotateCcw className="h-3 w-3" aria-hidden="true" />
                  Collapse all
                </Button>
              )}
              {canCollapseOthers && (
                <Button
                  onClick={collapseOthers}
                  variant="outline"
                  size="sm"
                  className="h-7 w-full gap-1 text-xs"
                >
                  <Shrink className="h-3 w-3" aria-hidden="true" />
                  Collapse others
                </Button>
              )}
            </div>

            <fieldset>
              <legend className="mb-1.5 text-xs font-medium text-muted-foreground">
                Show / hide
              </legend>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                {shownCounts.map(([type, count]) => (
                  <label key={type} className="flex cursor-pointer items-center gap-2">
                    <Checkbox
                      checked={filters[type]}
                      onCheckedChange={() =>
                        setFilters((prev) => ({ ...prev, [type]: !prev[type] }))
                      }
                      className="h-3.5 w-3.5"
                    />
                    <span className="flex items-center gap-1.5 text-xs capitalize">
                      <span
                        className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold"
                        style={{ backgroundColor: legendColor(type, theme), color: DARK_TEXT }}
                        aria-hidden="true"
                      >
                        {TYPE_LETTER[type]}
                      </span>
                      {type}s
                      {filters[type] && (
                        <span className="text-muted-foreground tabular-nums">({count})</span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Components take their KC colour; threats their risk band.
              </p>
            </fieldset>

            <details>
              <summary className="cursor-pointer select-none text-xs font-medium text-muted-foreground">
                Help
              </summary>
              <div className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
                <p>Click or press Enter on a pattern to expand its components.</p>
                <p>Expand a component to reveal its threats and the controls for them.</p>
                <p>Scroll or pinch to zoom. Drag the background to pan.</p>
                <p>Click empty space to deselect.</p>
              </div>
            </details>
          </CardContent>
        </Card>

        {selectedNode && (
          <Card>
            <CardContent className="max-h-96 space-y-2.5 overflow-y-auto p-3">
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: nodeColor(selectedNode, theme) }}
                  aria-hidden="true"
                />
                <h3 className="text-sm font-semibold leading-tight">{selectedNode.name}</h3>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs capitalize">
                  {selectedNode.type}
                </Badge>
                {connectedCount > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {connectedCount} connection{connectedCount !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              <p className="text-xs leading-relaxed text-muted-foreground">
                {selectedNode.description}
              </p>

              {selectedNode.riskScore != null && selectedNode.riskScore > 0 && (
                <RiskScore score={selectedNode.riskScore} label="Risk" tone="severity" />
              )}

              {selectedNode.tags && selectedNode.tags.length > 0 && (
                <div>
                  <div className="mb-1 text-xs font-medium">Tags</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedNode.tags.slice(0, 8).map((tag) => (
                      <Badge key={tag} variant="secondary" className="px-1.5 py-0 text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {selectedNode.tags.length > 8 && (
                      <Badge variant="secondary" className="px-1.5 py-0 text-xs">
                        +{selectedNode.tags.length - 8}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-1">
                {detailPath && (
                  <Link
                    to={detailPath}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    View full details <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </Link>
                )}
                {canCollapseOthers && (
                  <button
                    type="button"
                    onClick={collapseOthers}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
                  >
                    <Shrink className="h-3 w-3" aria-hidden="true" /> Collapse others
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Graph */}
      <div className="relative min-h-0 flex-1" ref={containerRef}>
        <Card className="h-full">
          <CardContent className="relative h-full overflow-hidden p-0">
            <svg
              ref={svgRef}
              width={dimensions.width}
              height={dimensions.height}
              className="block h-full w-full touch-none"
              role="group"
              aria-roledescription="interactive graph"
              aria-label={`Architecture explorer: ${filteredData.nodes.length} nodes, ${filteredData.links.length} links`}
            />
          </CardContent>
        </Card>

        {tooltip && (
          <div
            className="pointer-events-none fixed z-[10000] rounded border bg-popover px-2.5 py-1.5 text-xs shadow-sm"
            style={{ left: tooltip.x + 12, top: tooltip.y - 8 }}
            role="tooltip"
          >
            <div className="font-medium">{tooltip.name}</div>
            <div className="capitalize text-muted-foreground">{tooltip.type}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchitectureNavigator;

export const HierarchicalArchitectureNavigator = ArchitectureNavigator;

import { memo, useMemo } from "react";
import { absolutePosition, nodeSize } from "../export/geometry";
import type { CanvasEdge, CanvasNode } from "../types";

export interface TemplateThumbnailProps {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  /** Accessible name, e.g. "RAG pipeline layout". */
  title: string;
  className?: string;
}

/** Fill per node kind; theme tokens so the thumbnail follows light/dark. */
function fillFor(n: CanvasNode): string {
  const c = n.data?.category;
  if (c === "actor" || c === "external") return "hsl(var(--muted-foreground) / 0.35)";
  if (c === "kc1") return "hsl(var(--kc-1, 217 91% 60%) / 0.55)";
  if (c === "kc2") return "hsl(var(--kc-2, 142 71% 45%) / 0.55)";
  if (c === "kc3") return "hsl(var(--kc-3, 45 93% 47%) / 0.55)";
  if (c === "kc4" || c === "datastore") return "hsl(var(--kc-4, 271 91% 65%) / 0.55)";
  if (c === "kc5") return "hsl(var(--kc-5, 330 81% 60%) / 0.55)";
  if (c === "kc6") return "hsl(var(--kc-6, 239 84% 67%) / 0.55)";
  return "hsl(var(--primary) / 0.45)";
}

/**
 * Miniature of a template / model: components as rounded rects at their
 * absolute positions (parent offsets resolved), trust boundaries dashed,
 * flows as lines between card centres, fitted to the viewBox.
 */
function TemplateThumbnail({ nodes, edges, title, className }: TemplateThumbnailProps) {
  const layout = useMemo(() => {
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const boxes = new Map<string, { x: number; y: number; w: number; h: number; n: CanvasNode }>();
    for (const n of nodes) {
      const p = absolutePosition(n, byId);
      const s = nodeSize(n);
      const isBoundary = n.type === "trustBoundary";
      // Cards are drawn smaller than their measured size so gaps stay visible.
      const w = isBoundary ? s.width : Math.min(s.width, 180);
      const h = isBoundary ? s.height : Math.min(s.height, 80);
      boxes.set(n.id, { x: p.x, y: p.y, w, h, n });
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const b of boxes.values()) {
      minX = Math.min(minX, b.x);
      minY = Math.min(minY, b.y);
      maxX = Math.max(maxX, b.x + b.w);
      maxY = Math.max(maxY, b.y + b.h);
    }
    if (!Number.isFinite(minX)) return null;
    const pad = 30;
    return {
      viewBox: `${minX - pad} ${minY - pad} ${maxX - minX + 2 * pad} ${maxY - minY + 2 * pad}`,
      boundaries: [...boxes.values()].filter((b) => b.n.type === "trustBoundary"),
      cards: [...boxes.values()].filter((b) => b.n.type !== "trustBoundary"),
      lines: edges
        .map((e) => {
          const a = boxes.get(e.source);
          const b = boxes.get(e.target);
          if (!a || !b) return null;
          return {
            id: e.id,
            x1: a.x + a.w / 2,
            y1: a.y + a.h / 2,
            x2: b.x + b.w / 2,
            y2: b.y + b.h / 2,
            dashed: e.data?.encrypted === false,
          };
        })
        .filter(Boolean) as {
        id: string;
        x1: number;
        y1: number;
        x2: number;
        y2: number;
        dashed: boolean;
      }[],
    };
  }, [nodes, edges]);

  if (!layout)
    return (
      <div
        className={className}
        role="img"
        aria-label={`${title}: empty canvas`}
        style={{ background: "hsl(var(--muted) / 0.4)" }}
      />
    );

  return (
    <svg
      viewBox={layout.viewBox}
      preserveAspectRatio="xMidYMid meet"
      className={className}
      role="img"
      aria-label={`${title}: ${layout.cards.length} components, ${layout.lines.length} flows`}
    >
      <rect
        x="-100000"
        y="-100000"
        width="200000"
        height="200000"
        fill="hsl(var(--muted) / 0.35)"
      />
      {layout.boundaries.map((b) => (
        <rect
          key={b.n.id}
          x={b.x}
          y={b.y}
          width={b.w}
          height={b.h}
          rx={18}
          fill="hsl(var(--destructive) / 0.05)"
          stroke="hsl(var(--destructive) / 0.6)"
          strokeWidth={6}
          strokeDasharray="22 14"
        />
      ))}
      {layout.lines.map((l) => (
        <line
          key={l.id}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          stroke="hsl(var(--muted-foreground) / 0.7)"
          strokeWidth={6}
          strokeDasharray={l.dashed ? "16 12" : undefined}
        />
      ))}
      {layout.cards.map((b) => (
        <rect
          key={b.n.id}
          x={b.x}
          y={b.y}
          width={b.w}
          height={b.h}
          rx={b.n.type === "actor" ? 40 : 14}
          fill={fillFor(b.n)}
          stroke="hsl(var(--foreground) / 0.35)"
          strokeWidth={4}
        />
      ))}
    </svg>
  );
}

export default memo(TemplateThumbnail);

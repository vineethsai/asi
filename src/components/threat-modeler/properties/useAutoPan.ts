/**
 * Keep the selected component (or flow) visible next to the property panel.
 * Pane: centre it only when it is outside the visible canvas.
 * Sheet: the bottom sheet covers the lower canvas, so move it into the top third.
 */
import { useEffect } from "react";
import { useReactFlow } from "@xyflow/react";
import type { CanvasEdge, CanvasNode } from "../types";

const MARGIN = 24;

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function useAutoPan(
  target: { nodeId?: string | null; edge?: CanvasEdge | null },
  variant: "pane" | "sheet",
) {
  const rf = useReactFlow<CanvasNode, CanvasEdge>();
  const nodeId = target.nodeId ?? null;
  const source = target.edge?.source ?? null;
  const dest = target.edge?.target ?? null;

  useEffect(() => {
    const ids = nodeId ? [nodeId] : source && dest ? [source, dest] : [];
    if (!ids.length) return;
    const timer = window.setTimeout(() => {
      const el = document.querySelector<HTMLElement>(".tm-canvas .react-flow");
      if (!el) return;
      const boxes: Box[] = [];
      for (const id of ids) {
        const n = rf.getInternalNode(id);
        if (!n) continue;
        const p = n.internals.positionAbsolute;
        boxes.push({
          x: p.x,
          y: p.y,
          w: n.measured?.width ?? n.width ?? 0,
          h: n.measured?.height ?? n.height ?? 0,
        });
      }
      if (!boxes.length) return;
      const x0 = Math.min(...boxes.map((b) => b.x));
      const y0 = Math.min(...boxes.map((b) => b.y));
      const x1 = Math.max(...boxes.map((b) => b.x + b.w));
      const y1 = Math.max(...boxes.map((b) => b.y + b.h));
      const cx = (x0 + x1) / 2;
      const cy = (y0 + y1) / 2;

      const rect = el.getBoundingClientRect();
      const { zoom } = rf.getViewport();
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      const duration = reduce ? 0 : 300;

      if (variant === "pane") {
        // For a flow, its midpoint is enough; for a node, the whole box must fit.
        const tl = rf.flowToScreenPosition(nodeId ? { x: x0, y: y0 } : { x: cx, y: cy });
        const br = rf.flowToScreenPosition(nodeId ? { x: x1, y: y1 } : { x: cx, y: cy });
        const visible =
          tl.x >= rect.left + MARGIN &&
          tl.y >= rect.top + MARGIN &&
          br.x <= rect.right - MARGIN &&
          br.y <= rect.bottom - MARGIN;
        if (!visible) void rf.setCenter(cx, cy, { zoom, duration });
        return;
      }

      // Sheet: aim the centre at the middle of the top third (rect.height / 6).
      const at = rf.flowToScreenPosition({ x: cx, y: cy });
      const inTopThird =
        at.y >= rect.top + MARGIN &&
        at.y <= rect.top + rect.height / 3 &&
        at.x >= rect.left + MARGIN &&
        at.x <= rect.right - MARGIN;
      if (inTopThird) return;
      // setCenter puts (cx, cy') at rect.height / 2; shifting by height/3 lands cy at height/6.
      void rf.setCenter(cx, cy + rect.height / 3 / zoom, { zoom, duration });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [rf, nodeId, source, dest, variant]);
}

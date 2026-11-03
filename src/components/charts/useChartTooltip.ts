/**
 * useChartTooltip — state for <ChartTooltip>. `show()` accepts a mouse/pointer event (uses the
 * pointer position) or an element (uses the top-centre of its bounding box, for keyboard focus).
 *
 *   const { tip, show, hide, id } = useChartTooltip<Datum>();
 */

import { useCallback, useId, useState } from "react";

export interface TooltipState<T> {
  open: boolean;
  x: number;
  y: number;
  content: T | null;
}

type Anchor = { clientX: number; clientY: number } | Element | null | undefined;

function anchorPoint(a: Anchor): { x: number; y: number } {
  if (!a) return { x: 0, y: 0 };
  if ("clientX" in a) return { x: a.clientX, y: a.clientY };
  const r = (a as Element).getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top };
}

export function useChartTooltip<T>() {
  const id = useId();
  const [tip, setTip] = useState<TooltipState<T>>({ open: false, x: 0, y: 0, content: null });
  const show = useCallback((anchor: Anchor, content: T) => {
    const { x, y } = anchorPoint(anchor);
    setTip({ open: true, x, y, content });
  }, []);
  const hide = useCallback(() => setTip((t) => (t.open ? { ...t, open: false } : t)), []);
  return { tip, show, hide, id: `chart-tip-${id.replace(/:/g, "")}` };
}

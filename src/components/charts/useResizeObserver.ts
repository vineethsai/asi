/**
 * useResizeObserver — measure an element's content box, rAF-throttled.
 *
 *   const { ref, width, height } = useResizeObserver<HTMLDivElement>({ initialWidth: 640 });
 *   return <div ref={ref}>{width > 0 && <svg width={width} … />}</div>;
 *
 * Falls back to `initialWidth` / `initialHeight` where ResizeObserver is unavailable (jsdom, old
 * browsers) or the element has not been laid out yet. `measured` turns true once the element's
 * size (or that fallback) has been applied: charts that animate their first draw wait for it, so
 * the build-in runs at the final width instead of the placeholder `initialWidth`.
 */

import { useCallback, useEffect, useRef, useState } from "react";

export interface UseResizeObserverOptions {
  initialWidth?: number;
  initialHeight?: number;
}

export interface ResizeObserverResult<T extends Element> {
  ref: (node: T | null) => void;
  width: number;
  height: number;
  /** True once the first real measurement (or the fallback) has been applied. */
  measured: boolean;
  node: T | null;
}

/**
 * The element's content box, matching what ResizeObserver's `contentRect` reports later
 * (getBoundingClientRect is the border box: a bordered container would otherwise measure a few
 * px wider first and re-layout one frame later).
 */
function contentBox(el: Element): { width: number; height: number } {
  const rect = el.getBoundingClientRect?.();
  if (!rect) return { width: 0, height: 0 };
  const cs = typeof getComputedStyle === "function" ? getComputedStyle(el) : null;
  const px = (v: string | undefined) => parseFloat(v ?? "") || 0;
  const dx = cs
    ? px(cs.borderLeftWidth) + px(cs.borderRightWidth) + px(cs.paddingLeft) + px(cs.paddingRight)
    : 0;
  const dy = cs
    ? px(cs.borderTopWidth) + px(cs.borderBottomWidth) + px(cs.paddingTop) + px(cs.paddingBottom)
    : 0;
  return { width: rect.width - dx, height: rect.height - dy };
}

export function useResizeObserver<T extends Element = HTMLDivElement>(
  opts: UseResizeObserverOptions = {},
): ResizeObserverResult<T> {
  const { initialWidth = 0, initialHeight = 0 } = opts;
  const [node, setNode] = useState<T | null>(null);
  const [size, setSize] = useState({
    width: initialWidth,
    height: initialHeight,
    measured: false,
  });
  const frame = useRef<number | null>(null);

  const ref = useCallback((n: T | null) => setNode(n), []);

  useEffect(() => {
    if (!node) return;
    const apply = (w: number, h: number) => {
      const width = w > 0 ? Math.round(w) : initialWidth;
      const height = h > 0 ? Math.round(h) : initialHeight;
      setSize((prev) =>
        prev.measured && prev.width === width && prev.height === height
          ? prev
          : { width, height, measured: true },
      );
    };
    const first = contentBox(node);
    apply(first.width, first.height);
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => apply(width, height));
    });
    ro.observe(node);
    return () => {
      ro.disconnect();
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [node, initialWidth, initialHeight]);

  return { ref, width: size.width, height: size.height, measured: size.measured, node };
}

export default useResizeObserver;

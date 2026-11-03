/**
 * useResizeObserver — measure an element's content box, rAF-throttled.
 *
 *   const { ref, width, height } = useResizeObserver<HTMLDivElement>({ initialWidth: 640 });
 *   return <div ref={ref}>{width > 0 && <svg width={width} … />}</div>;
 *
 * Falls back to `initialWidth` / `initialHeight` where ResizeObserver is unavailable (jsdom, old
 * browsers) or the element has not been laid out yet.
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
  node: T | null;
}

export function useResizeObserver<T extends Element = HTMLDivElement>(
  opts: UseResizeObserverOptions = {},
): ResizeObserverResult<T> {
  const { initialWidth = 0, initialHeight = 0 } = opts;
  const [node, setNode] = useState<T | null>(null);
  const [size, setSize] = useState({ width: initialWidth, height: initialHeight });
  const frame = useRef<number | null>(null);

  const ref = useCallback((n: T | null) => setNode(n), []);

  useEffect(() => {
    if (!node) return;
    const apply = (w: number, h: number) => {
      const width = w > 0 ? Math.round(w) : initialWidth;
      const height = h > 0 ? Math.round(h) : initialHeight;
      setSize((prev) =>
        prev.width === width && prev.height === height ? prev : { width, height },
      );
    };
    const rect = node.getBoundingClientRect?.();
    if (rect) apply(rect.width, rect.height);
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

  return { ref, width: size.width, height: size.height, node };
}

export default useResizeObserver;

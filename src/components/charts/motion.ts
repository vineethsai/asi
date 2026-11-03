/**
 * Chart motion tokens (IMPROVEMENT_PLAN.md §8.3, §8.4, §8.10) and the reduced-motion hook used by
 * every chart. CSS transitions are additionally neutralised by the global reduced-motion rule in
 * index.css; JS (D3) transitions must check `usePrefersReducedMotion()` / `prefersReducedMotion()`.
 *
 * If src/lib/motion.ts lands with the same API, re-export from there and delete this file.
 */

import { useEffect, useState } from "react";
import { easeCubicOut } from "d3";

export const CHART_MOTION = {
  /** §8.4 bars grow from 0 */
  barMs: 500,
  barStaggerMs: 20,
  /** §8.4 links draw via stroke-dasharray */
  linkMs: 700,
  /** §8.4 nodes scale from 0.6 */
  nodeFromScale: 0.6,
  nodeMs: 450,
  /** §8.3 gauge / ring arc */
  ringMs: 600,
  /** generic update (re-layout, zoom) */
  updateMs: 350,
  /** CSS easing matching §8.1 */
  cssEase: "cubic-bezier(.2,.8,.2,1)",
  /** D3 easing */
  d3Ease: easeCubicOut,
  /** cap for any stagger chain */
  maxStaggerMs: 400,
} as const;

const QUERY = "(prefers-reduced-motion: reduce)";

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia(QUERY).matches
  );
}

/** Reactive `prefers-reduced-motion`. Safe in SSR / jsdom (returns false without matchMedia). */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(prefersReducedMotion);
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia(QUERY);
    const onChange = () => setReduced(mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
}

/** Duration helper: 0 when motion is reduced. */
export const dur = (ms: number, reduced: boolean) => (reduced ? 0 : ms);

/** Stagger delay for item `i`, capped at `CHART_MOTION.maxStaggerMs`. */
export const stagger = (i: number, reduced: boolean, step: number = CHART_MOTION.barStaggerMs) =>
  reduced ? 0 : Math.min(i * step, CHART_MOTION.maxStaggerMs);

import type { CSSProperties } from "react";

/**
 * Motion tokens (IMPROVEMENT_PLAN §8). CSS mirrors these in src/index.css
 * (`.enter`, `.card-hover`, view transitions). All JS-driven motion must check
 * `prefersReducedMotion()` / `useReducedMotion()` first.
 */
export const duration = {
  /** Hover, tab and route cross-fades. */
  fast: 150,
  /** Entrance (`.enter`). */
  base: 320,
  /** Gauges, rings, chart build-in. */
  slow: 600,
  /** Count-up for stat numbers. */
  countUp: 900,
} as const;

export const easing = {
  /** Default entrance / hover curve. */
  standard: "cubic-bezier(.2,.8,.2,1)",
  /** Strong deceleration for count-ups and draws. */
  out: "cubic-bezier(.16,1,.3,1)",
  inOut: "cubic-bezier(.65,0,.35,1)",
} as const;

export const STAGGER_STEP_MS = 40;
export const STAGGER_MAX_MS = 400;

/** Delay in ms for the i-th child of a staggered group, capped. */
export function staggerDelay(index: number, step = STAGGER_STEP_MS, max = STAGGER_MAX_MS): number {
  return Math.min(Math.max(0, index) * step, max);
}

/**
 * Style for the i-th `.enter` child: sets `--i`, which the CSS turns into
 * `animation-delay: min(var(--i) * 40ms, 400ms)` (see .enter in index.css).
 *
 * @example <Card className="enter" style={stagger(i)} />
 */
export function stagger(index: number): CSSProperties {
  return { "--i": Math.max(0, index) } as CSSProperties;
}

export function easeOutExpo(t: number): number {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia?.(REDUCED_MOTION_QUERY).matches;
}

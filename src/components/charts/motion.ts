/**
 * Chart motion tokens (IMPROVEMENT_PLAN.md §8.3, §8.4, §8.10) and the reduced-motion hook used by
 * every chart. CSS transitions are additionally neutralised by the global reduced-motion rule in
 * index.css; JS (D3) transitions must check `usePrefersReducedMotion()` / `prefersReducedMotion()`.
 *
 * If src/lib/motion.ts lands with the same API, re-export from there and delete this file.
 */

import { useEffect, useState } from "react";
import { easeCubicOut, type BaseType, type Selection } from "d3";

export const CHART_MOTION = {
  /** §8.4 bars grow from 0 */
  barMs: 500,
  barStaggerMs: 20,
  /** §8.4 links draw via stroke-dasharray (see `drawInLinks`; initial enter only) */
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

/**
 * Name of the §8.4 link draw-in transition. It is named so the chart's own default-named update
 * transitions (d / stroke-width / opacity) never interrupt it half-way.
 */
export const LINK_DRAW_TRANSITION = "link-draw";

function removeDash(this: Element) {
  this.removeAttribute("stroke-dasharray");
  this.removeAttribute("stroke-dashoffset");
}

/**
 * Remove every trace of the link draw-in: stop it and drop `stroke-dasharray` /
 * `stroke-dashoffset`, so the resting path is fully stroked whatever the animation did. Call it on
 * every update / re-join (and on exit): a draw-in must never survive a geometry change, because
 * the dash length it measured belongs to the old path.
 */
export function clearLinkDraw<E extends SVGPathElement, D, P extends BaseType, PD>(
  sel: Selection<E, D, P, PD>,
): Selection<E, D, P, PD> {
  return sel
    .interrupt(LINK_DRAW_TRANSITION)
    .attr("stroke-dasharray", null)
    .attr("stroke-dashoffset", null);
}

/**
 * §8.4 draw-in for freshly ENTERED link paths (never for updates or resizes). The path must
 * already carry its final `d`. The length is measured when the transition starts (not when it is
 * scheduled), and the dash attributes are removed on end, interrupt and cancel, so the resting
 * state never depends on the animation. Reduced motion: no animation, no dash attributes.
 */
export function drawInLinks<E extends SVGPathElement, D, P extends BaseType, PD>(
  sel: Selection<E, D, P, PD>,
  reduced: boolean,
): Selection<E, D, P, PD> {
  if (reduced) return clearLinkDraw(sel);
  sel
    .transition(LINK_DRAW_TRANSITION)
    .duration(CHART_MOTION.linkMs)
    .ease(CHART_MOTION.d3Ease)
    .attrTween("stroke-dashoffset", function () {
      let len = 0;
      try {
        len = typeof this.getTotalLength === "function" ? this.getTotalLength() : 0;
      } catch {
        len = 0;
      }
      if (!(len > 0)) return () => "0";
      this.setAttribute("stroke-dasharray", `${len} ${len}`);
      return (t: number) => `${len * (1 - t)}`;
    })
    .on("end interrupt cancel", removeDash);
  return sel;
}

import { useEffect, useRef, useState } from "react";
import { duration as motionDuration, easeOutExpo } from "@/lib/motion";
import { useReducedMotion } from "./useReducedMotion";

/**
 * Animated integer count-up (IMPROVEMENT_PLAN §8.2).
 *
 * Returns the number to display. Counts from the previously displayed value (0 initially)
 * to `value` over `ms` with easeOutExpo once `start` is true (pair it with `useReveal()`'s
 * `isVisible` to start on first view). Non-integers, non-finite values and reduced motion
 * return `value` immediately. Render the final value for assistive tech separately
 * (e.g. an `sr-only` span) since intermediate frames are visual only.
 */
export function useCountUp(
  value: number,
  ms: number = motionDuration.countUp,
  start = true,
): number {
  const reduced = useReducedMotion();
  const animatable = Number.isFinite(value) && Number.isInteger(value) && ms > 0 && !reduced;
  const [display, setDisplay] = useState(0);
  const displayRef = useRef(0);

  useEffect(() => {
    if (!animatable || !start) return;
    const from = displayRef.current;
    if (from === value) return;
    let frame = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / ms);
      const next = Math.round(from + (value - from) * easeOutExpo(t)) || 0; // `|| 0` folds -0
      displayRef.current = next;
      setDisplay(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [animatable, start, value, ms]);

  if (!animatable) return value;
  return display;
}

export default useCountUp;

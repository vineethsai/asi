import { useSyncExternalStore } from "react";
import { REDUCED_MOTION_QUERY, prefersReducedMotion } from "@/lib/motion";

function subscribe(onChange: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const mq = window.matchMedia(REDUCED_MOTION_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/** Live `prefers-reduced-motion: reduce` flag for JS-driven animation (count-ups, D3, confetti). */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, prefersReducedMotion, () => false);
}

export default useReducedMotion;

import { useSyncExternalStore } from "react";

/** Live media-query match (SSR/test safe). */
export function useMediaQuery(query: string, fallback = true): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === "undefined" || !window.matchMedia) return () => {};
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () =>
      typeof window !== "undefined" && window.matchMedia
        ? window.matchMedia(query).matches
        : fallback,
    () => fallback,
  );
}

/** `lg` breakpoint (1024 px): three-pane layout at or above, bottom sheets below. */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 1024px)", true);
}

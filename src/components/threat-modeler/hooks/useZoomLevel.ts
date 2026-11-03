import { useStore } from "@xyflow/react";

/**
 * Zoom tier via a quantised selector (§7.8): the selector returns the tier,
 * not the zoom, so nodes re-render only when the tier changes — never per
 * zoom frame.
 */
export type ZoomTier = "full" | "compact" | "minimal";

export function tierForZoom(zoom: number): ZoomTier {
  return zoom >= 0.7 ? "full" : zoom >= 0.4 ? "compact" : "minimal";
}

const selectTier = (s: { transform: [number, number, number] }) => tierForZoom(s.transform[2]);

export function useZoomTier(): ZoomTier {
  return useStore(selectTier);
}

/** Back-compat shape ({ tier }); prefer `useZoomTier()`. */
export function useZoomLevel(): { tier: ZoomTier } {
  return { tier: useZoomTier() };
}

/** Handles grow as the canvas zooms out so they stay grabbable. */
export function getHandleSize(tier: ZoomTier): string {
  switch (tier) {
    case "full":
      return "!w-2.5 !h-2.5";
    case "compact":
      return "!w-3 !h-3";
    case "minimal":
      return "!w-4 !h-4";
  }
}

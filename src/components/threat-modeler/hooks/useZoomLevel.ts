import { useStore } from "@xyflow/react";

export type ZoomTier = "full" | "compact" | "minimal";

export function useZoomLevel(): { zoom: number; tier: ZoomTier } {
  const zoom = useStore((state) => state.transform[2]);

  const tier: ZoomTier = zoom >= 0.7 ? "full" : zoom >= 0.4 ? "compact" : "minimal";

  return { zoom, tier };
}

export function getHandleSize(tier: ZoomTier): string {
  switch (tier) {
    case "full":
      return "!w-2 !h-2";
    case "compact":
      return "!w-3 !h-3";
    case "minimal":
      return "!w-4 !h-4";
  }
}

/**
 * ChartTooltip — positioned, portalled, keyboard-dismissable tooltip for chart marks.
 *
 * Props:
 *   open: boolean
 *   x, y: number                  — viewport (client) coordinates of the anchor point
 *   onDismiss?: () => void        — called on Escape (and on scroll when `dismissOnScroll`)
 *   placement?: "top" | "bottom"  — preferred side (flips to stay on-screen); default "top"
 *   id?: string                   — use for aria-describedby on the focused mark
 *   children: ReactNode
 *
 * Hook (./useChartTooltip.ts): `useChartTooltip<T>()` → { tip, show(evt | element, content), hide, id }
 *   const { tip, show, hide, id } = useChartTooltip<Datum>();
 *   <rect onMouseMove={(e) => show(e, d)} onFocus={(e) => show(e.currentTarget, d)}
 *         onMouseLeave={hide} onBlur={hide} aria-describedby={tip.open ? id : undefined} />
 *   <ChartTooltip {...tip} id={id} onDismiss={hide}>{tip.content && render(tip.content)}</ChartTooltip>
 */

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export interface ChartTooltipProps {
  open: boolean;
  x: number;
  y: number;
  onDismiss?: () => void;
  placement?: "top" | "bottom";
  dismissOnScroll?: boolean;
  id?: string;
  className?: string;
  children?: ReactNode;
}

const GAP = 10;
const MARGIN = 8;

export function ChartTooltip({
  open,
  x,
  y,
  onDismiss,
  placement = "top",
  dismissOnScroll = true,
  id,
  className,
  children,
}: ChartTooltipProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    if (!open || !ref.current) return;
    const el = ref.current;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const vw = window.innerWidth || 1024;
    const vh = window.innerHeight || 768;
    let top = placement === "top" ? y - h - GAP : y + GAP;
    if (placement === "top" && top < MARGIN) top = y + GAP;
    if (placement === "bottom" && top + h > vh - MARGIN) top = y - h - GAP;
    const left = Math.max(MARGIN, Math.min(vw - w - MARGIN, x - w / 2));
    setPos({ left, top: Math.max(MARGIN, Math.min(vh - h - MARGIN, top)) });
  }, [open, x, y, placement, children]);

  useEffect(() => {
    if (!open || !onDismiss) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    const onScroll = () => onDismiss();
    document.addEventListener("keydown", onKey);
    if (dismissOnScroll) window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (dismissOnScroll) window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, onDismiss, dismissOnScroll]);

  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div
      ref={ref}
      id={id}
      role="tooltip"
      className={cn(
        "pointer-events-none fixed z-[9999] max-w-xs rounded-md border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md",
        "animate-in fade-in-0 zoom-in-95",
        className,
      )}
      style={{
        left: pos?.left ?? x,
        top: pos?.top ?? y,
        visibility: pos ? "visible" : "hidden",
      }}
    >
      {children}
    </div>,
    document.body,
  );
}

export default ChartTooltip;

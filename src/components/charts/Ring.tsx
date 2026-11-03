/**
 * Ring — animated progress ring (§8.3: stroke-dashoffset 600 ms, colour follows severity tokens).
 *
 * Props:
 *   value: number; max?: number (default 100)
 *   size?: number (px, default 64); thickness?: number (default 6)
 *   tone?: "primary" | "progress" | SeverityBand   — "progress" walks high → medium → info → low
 *                                                    (green at 100 %); default "primary"
 *   color?: string                                  — explicit CSS colour (overrides tone)
 *   label?: ReactNode                               — centre content (default: the percentage)
 *   showValue?: boolean (default true); format?: (value, max) => string
 *   ariaLabel?: string                              — default "<pct>% complete"
 *
 * Usage:
 *   <Ring value={done} max={total} tone="progress" ariaLabel={`C1: ${done} of ${total} checked`} />
 */

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { severityColor, type SeverityBand } from "@/lib/severity";
import { CHART_MOTION, usePrefersReducedMotion } from "./motion";
import { progressBand } from "./chartUtils";

export interface RingProps {
  value: number;
  max?: number;
  size?: number;
  thickness?: number;
  tone?: "primary" | "progress" | SeverityBand;
  color?: string;
  label?: ReactNode;
  showValue?: boolean;
  format?: (value: number, max: number) => string;
  ariaLabel?: string;
  className?: string;
}

export function Ring({
  value,
  max = 100,
  size = 64,
  thickness = 6,
  tone = "primary",
  color,
  label,
  showValue = true,
  format,
  ariaLabel,
  className,
}: RingProps) {
  const reduced = usePrefersReducedMotion();
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  const [shown, setShown] = useState(reduced ? pct : 0);
  useEffect(() => {
    if (reduced) {
      setShown(pct);
      return;
    }
    const id = requestAnimationFrame(() => setShown(pct));
    return () => cancelAnimationFrame(id);
  }, [pct, reduced]);

  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const stroke =
    color ??
    (tone === "primary"
      ? "hsl(var(--primary))"
      : tone === "progress"
        ? severityColor(progressBand(pct))
        : severityColor(tone));
  const text = format ? format(value, max) : `${Math.round(pct)}%`;

  return (
    <div
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={ariaLabel ?? `${Math.round(pct)}% complete`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={thickness}
          style={{ stroke: "hsl(var(--muted))" }}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={thickness}
          strokeLinecap={shown > 0 ? "round" : "butt"}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - shown / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            stroke,
            transition: `stroke-dashoffset ${CHART_MOTION.ringMs}ms ${CHART_MOTION.cssEase}, stroke ${CHART_MOTION.ringMs}ms ease`,
          }}
          data-testid="ring-value"
        />
      </svg>
      {(label !== undefined || showValue) && (
        <span
          aria-hidden
          className="absolute inset-0 flex items-center justify-center text-center font-mono font-semibold tabular-nums leading-none text-foreground"
          style={{ fontSize: Math.max(10, size * 0.22) }}
        >
          {label ?? text}
        </span>
      )}
    </div>
  );
}

export default Ring;

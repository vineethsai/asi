/**
 * Sparkline — inline severity bars (§9 "Risk sparkline"), e.g. on architecture cards.
 *
 * Props:
 *   counts: Partial<Record<SeverityBand, number>>    — e.g. { critical: 2, high: 1, medium: 2 }
 *   bands?: SeverityBand[]   — bars to draw, default ["critical","high","medium","low"]
 *   width?: number (default 64); height?: number (default 20)
 *   noun?: string            — for the text alternative (default "threat")
 *   showText?: boolean       — also print "5 threats (2 critical…)" next to the bars
 *   ariaLabel?: string
 *
 * Usage:
 *   <Sparkline counts={countByBand(arch.threats)} noun="threat" showText />
 */

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  severityColor,
  severityAbbr,
  summarizeBandCounts,
  type SeverityBand,
} from "@/lib/severity";
import { CHART_MOTION, stagger, usePrefersReducedMotion } from "./motion";

export interface SparklineProps {
  counts: Partial<Record<SeverityBand, number>>;
  bands?: SeverityBand[];
  width?: number;
  height?: number;
  noun?: string;
  showText?: boolean;
  ariaLabel?: string;
  className?: string;
}

export function Sparkline({
  counts,
  bands = ["critical", "high", "medium", "low"],
  width = 64,
  height = 20,
  noun = "threat",
  showText = false,
  ariaLabel,
  className,
}: SparklineProps) {
  const reduced = usePrefersReducedMotion();
  const [grown, setGrown] = useState(reduced);
  useEffect(() => {
    if (reduced) return setGrown(true);
    const id = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(id);
  }, [reduced]);

  const max = Math.max(1, ...bands.map((b) => counts[b] ?? 0));
  const gap = 2;
  const bw = Math.max(2, (width - gap * (bands.length - 1)) / bands.length);
  const summary = summarizeBandCounts(counts, noun);

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={ariaLabel ?? summary}
      >
        {bands.map((b, i) => {
          const v = counts[b] ?? 0;
          const h = v > 0 ? Math.max(2, (v / max) * (height - 1)) : 1;
          return (
            <rect
              key={b}
              x={i * (bw + gap)}
              y={height - h}
              width={bw}
              height={h}
              rx={1}
              data-band={b}
              style={{
                fill: v > 0 ? severityColor(b) : "hsl(var(--border))",
                transform: grown ? "scaleY(1)" : "scaleY(0)",
                transformOrigin: `0 ${height}px`,
                transformBox: "view-box",
                transition: `transform ${CHART_MOTION.barMs}ms ${CHART_MOTION.cssEase} ${stagger(i, reduced)}ms`,
              }}
            >
              <title>{`${severityAbbr(b)}: ${v}`}</title>
            </rect>
          );
        })}
      </svg>
      {showText && <span className="text-xs text-muted-foreground">{summary}</span>}
    </span>
  );
}

export default Sparkline;

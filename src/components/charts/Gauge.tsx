/**
 * Gauge — 0–10 semicircular gauge for AIVSS scores (§8.3, §9 "AIVSS gauge").
 * The arc animates (stroke-dashoffset 600 ms) and is coloured by `aivssBand()`; the score and the
 * band label are always printed, so colour is never the only cue.
 *
 * Props:
 *   score: number (0–10); max?: number (default 10)
 *   size?: number (width px, default 220)
 *   label?: string            — caption under the score (default: band label, e.g. "High")
 *   showBands?: boolean       — faint band segments + ticks at 4 / 7 / 9 (default true)
 *   ariaLabel?: string        — default "AIVSS score 7.4 out of 10, High"
 *
 * Usage:
 *   <Gauge score={result.score} />
 */

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { aivssBand, severityColor, severityLabel, type SeverityBand } from "@/lib/severity";
import { CHART_MOTION, usePrefersReducedMotion } from "./motion";

export interface GaugeProps {
  score: number;
  max?: number;
  size?: number;
  label?: string;
  showBands?: boolean;
  ariaLabel?: string;
  className?: string;
}

const BAND_STOPS: { from: number; to: number; band: SeverityBand }[] = [
  { from: 0, to: 4, band: "low" },
  { from: 4, to: 7, band: "medium" },
  { from: 7, to: 9, band: "high" },
  { from: 9, to: 10, band: "critical" },
];

export function Gauge({
  score,
  max = 10,
  size = 220,
  label,
  showBands = true,
  ariaLabel,
  className,
}: GaugeProps) {
  const reduced = usePrefersReducedMotion();
  const safe = Number.isFinite(score) ? Math.max(0, Math.min(max, score)) : 0;
  const pct = max > 0 ? (safe / max) * 100 : 0;
  const [shown, setShown] = useState(reduced ? pct : 0);
  useEffect(() => {
    if (reduced) {
      setShown(pct);
      return;
    }
    const id = requestAnimationFrame(() => setShown(pct));
    return () => cancelAnimationFrame(id);
  }, [pct, reduced]);

  const band = aivssBand((safe / max) * 10);
  const stroke = 14;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = r + stroke / 2;
  const h = cy + 8;
  const arc = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const at = (v: number) => {
    const a = Math.PI * (1 - v / 10);
    return { x: cx + Math.cos(a) * r, y: cy - Math.sin(a) * r };
  };
  const scoreText = safe.toFixed(1);
  const caption = label ?? severityLabel(band);

  return (
    <div className={cn("inline-flex flex-col items-center", className)} style={{ width: size }}>
      <svg
        width={size}
        height={h}
        viewBox={`0 0 ${size} ${h}`}
        role="img"
        aria-label={ariaLabel ?? `AIVSS score ${scoreText} out of ${max}, ${severityLabel(band)}`}
      >
        <path
          d={arc}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          style={{ stroke: "hsl(var(--muted))" }}
        />
        {showBands &&
          BAND_STOPS.map((b) => (
            <path
              key={b.band}
              d={arc}
              fill="none"
              strokeWidth={stroke}
              pathLength={100}
              strokeDasharray={`${(b.to - b.from) * 10} 100`}
              strokeDashoffset={-b.from * 10}
              style={{ stroke: severityColor(b.band, "base", 0.18) }}
            />
          ))}
        <path
          d={arc}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap={shown > 0 ? "round" : "butt"}
          pathLength={100}
          strokeDasharray="100 100"
          strokeDashoffset={100 - shown}
          style={{
            stroke: severityColor(band),
            transition: `stroke-dashoffset ${CHART_MOTION.ringMs}ms ${CHART_MOTION.cssEase}, stroke ${CHART_MOTION.ringMs}ms ease`,
          }}
          data-testid="gauge-value"
        />
        {showBands &&
          [0, 4, 7, 9, 10].map((v) => {
            const p = at(v);
            const inner = { x: cx + (p.x - cx) * 0.8, y: cy + (p.y - cy) * 0.8 };
            return (
              <text
                key={v}
                x={inner.x}
                y={inner.y + 4}
                textAnchor="middle"
                fontSize={10}
                aria-hidden
                style={{ fill: "hsl(var(--muted-foreground))" }}
              >
                {v}
              </text>
            );
          })}
        <text
          x={cx}
          y={cy - 10}
          textAnchor="middle"
          fontSize={Math.round(size * 0.16)}
          fontWeight={700}
          aria-hidden
          className="font-mono tabular-nums"
          style={{ fill: "hsl(var(--foreground))" }}
        >
          {scoreText}
        </text>
      </svg>
      <span
        aria-hidden
        className="mt-1 text-xs font-semibold uppercase tracking-wide"
        style={{ color: severityColor(band, "fg") }}
      >
        {caption}
      </span>
    </div>
  );
}

export default Gauge;

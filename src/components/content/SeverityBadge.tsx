/**
 * SeverityBadge — the only way to show a severity / level chip (P1-03).
 *
 * Props:
 *   band?: SeverityBand            — explicit band ("critical" | "high" | "medium" | "low" | "info" | "none")
 *   score?: number                 — or derive the band from a score…
 *   scale?: "risk" | "aivss"       — …on this scale (default "risk": ≥8 / ≥6 / ≥4)
 *   size?: "xs" | "sm" | "md"      — default "sm"
 *   showLabel?: boolean            — default true; false renders the one-letter abbreviation
 *                                    (the full label stays available to screen readers)
 *   showScore?: boolean            — append the score ("High · 7")
 *   variant?: "soft" | "solid" | "outline"   — default "soft"
 *   label?: string                 — override the text (e.g. "Level 2")
 *   glyph?: boolean                — default true; shape glyph so colour is never the only cue
 *
 * Usage:
 *   <SeverityBadge score={threat.riskScore} showScore />
 *   <SeverityBadge band={aisvsLevelBand(req.level)} label={`L${req.level}`} size="xs" />
 */

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import {
  aivssBand,
  riskBand,
  severityAbbr,
  severityLabel,
  severityShape,
  severityToken,
  type SeverityBand,
  type SeverityShape,
} from "@/lib/severity";

export interface SeverityBadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  band?: SeverityBand;
  score?: number;
  scale?: "risk" | "aivss";
  size?: "xs" | "sm" | "md";
  showLabel?: boolean;
  showScore?: boolean;
  variant?: "soft" | "solid" | "outline";
  label?: string;
  glyph?: boolean;
}

const SIZES = {
  xs: "h-5 gap-1 px-1.5 text-[10px]",
  sm: "h-6 gap-1.5 px-2 text-xs",
  md: "h-7 gap-1.5 px-2.5 text-sm",
} as const;

/** Tiny inline SVG glyph; `currentColor` so it inherits the badge text colour. */
export function SeverityGlyph({ shape, className }: { shape: SeverityShape; className?: string }) {
  const common = { fill: "currentColor" };
  return (
    <svg viewBox="0 0 10 10" aria-hidden focusable="false" className={cn("h-2.5 w-2.5", className)}>
      {shape === "diamond" && <path d="M5 0 10 5 5 10 0 5Z" {...common} />}
      {shape === "triangle" && <path d="M5 0.5 9.8 9.5H0.2Z" {...common} />}
      {shape === "square" && <rect x="1" y="1" width="8" height="8" rx="1" {...common} />}
      {shape === "circle" && <circle cx="5" cy="5" r="4.2" {...common} />}
      {shape === "dot" && <circle cx="5" cy="5" r="2.5" {...common} />}
      {shape === "dash" && <rect x="1" y="4" width="8" height="2" rx="1" {...common} />}
    </svg>
  );
}

export function SeverityBadge({
  band,
  score,
  scale = "risk",
  size = "sm",
  showLabel = true,
  showScore = false,
  variant = "soft",
  label,
  glyph = true,
  className,
  ...rest
}: SeverityBadgeProps) {
  const resolved: SeverityBand =
    band ?? (score === undefined ? "none" : scale === "aivss" ? aivssBand(score) : riskBand(score));
  const t = severityToken(resolved);
  const text = label ?? severityLabel(resolved);
  const scoreText =
    showScore && score !== undefined
      ? Number.isInteger(score)
        ? `${score}`
        : score.toFixed(1)
      : "";
  const fullLabel = `${text}${scoreText ? ` (${scoreText})` : ""}${label ? "" : " severity"}`;

  return (
    <span
      data-band={resolved}
      title={showLabel ? undefined : fullLabel}
      className={cn(
        "inline-flex shrink-0 items-center whitespace-nowrap rounded-full border font-semibold leading-none",
        SIZES[size],
        variant === "soft" && t.badge,
        variant === "solid" && cn(t.solid, "border-transparent"),
        variant === "outline" && cn(t.fg, t.border, "bg-transparent"),
        className,
      )}
      {...rest}
    >
      {glyph && <SeverityGlyph shape={severityShape(resolved)} />}
      {showLabel ? (
        <span>{text}</span>
      ) : (
        <>
          <span aria-hidden>{label ? text : severityAbbr(resolved)}</span>
          <span className="sr-only">{fullLabel}</span>
        </>
      )}
      {scoreText && (
        <span className="font-mono tabular-nums opacity-90" aria-hidden={!showLabel}>
          · {scoreText}
        </span>
      )}
    </span>
  );
}

export default SeverityBadge;

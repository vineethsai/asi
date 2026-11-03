/**
 * RiskScore — a score out of `max` with a small meter (P1-03). Neutral by default: a control's
 * risk score means "the risk this control addresses", which is not an alarm.
 *
 * Props:
 *   score: number
 *   max?: number                        — default 10
 *   label?: string                      — default "Addresses risk" (use "Risk" for threats)
 *   tone?: "neutral" | "severity"       — default "neutral"; "severity" colours by riskBand()
 *   size?: "sm" | "md"                  — default "sm"
 *   showBar?: boolean                   — default true
 *   showBand?: boolean                  — append the band label ("High") — default when tone="severity"
 *
 * Usage:
 *   <RiskScore score={mitigation.riskScore} />
 *   <RiskScore score={threat.riskScore} label="Risk" tone="severity" />
 */

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { riskBand, severityLabel, severityToken } from "@/lib/severity";

export interface RiskScoreProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  score: number;
  max?: number;
  label?: string;
  tone?: "neutral" | "severity";
  size?: "sm" | "md";
  showBar?: boolean;
  showBand?: boolean;
}

export function RiskScore({
  score,
  max = 10,
  label = "Addresses risk",
  tone = "neutral",
  size = "sm",
  showBar = true,
  showBand,
  className,
  ...rest
}: RiskScoreProps) {
  const safe = Number.isFinite(score) ? Math.max(0, Math.min(max, score)) : 0;
  const band = riskBand((safe / max) * 10);
  const t = severityToken(band);
  const withBand = showBand ?? tone === "severity";
  const pct = max > 0 ? (safe / max) * 100 : 0;
  const value = Number.isInteger(safe) ? `${safe}` : safe.toFixed(1);

  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={safe}
      aria-valuetext={`${value} out of ${max}${withBand ? `, ${severityLabel(band)}` : ""}`}
      data-band={band}
      className={cn(
        "inline-flex items-center gap-2 rounded-md border px-2 py-1",
        tone === "neutral" ? "border-border bg-muted/40 text-foreground" : cn(t.badge),
        size === "md" && "px-2.5 py-1.5",
        className,
      )}
      {...rest}
    >
      <span
        className={cn(
          "whitespace-nowrap",
          size === "sm" ? "text-[11px]" : "text-xs",
          tone === "neutral" ? "text-muted-foreground" : "opacity-90",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "font-mono font-semibold tabular-nums",
          size === "sm" ? "text-xs" : "text-sm",
        )}
      >
        {value}
        <span className="font-normal opacity-60">/{max}</span>
      </span>
      {showBar && (
        <span
          aria-hidden
          className={cn(
            "relative h-1.5 overflow-hidden rounded-full bg-border",
            size === "sm" ? "w-10" : "w-14",
          )}
        >
          <span
            className={cn(
              "absolute inset-y-0 left-0 rounded-full transition-[width] duration-500",
              tone === "neutral" ? "bg-foreground/60" : t.chart,
            )}
            style={{ width: `${pct}%` }}
          />
        </span>
      )}
      {withBand && (
        <span
          className={cn("text-[11px] font-medium", tone === "neutral" && "text-muted-foreground")}
        >
          {severityLabel(band)}
        </span>
      )}
    </div>
  );
}

export default RiskScore;

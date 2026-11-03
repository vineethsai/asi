/**
 * PhaseBadge — lifecycle phase chip for controls (design / build / operations).
 *
 * Props:
 *   phase: "design" | "build" | "operations"
 *   active?: boolean        — default true; false renders a dimmed "not applicable" chip
 *   size?: "xs" | "sm"      — default "sm"
 *   showIcon?: boolean      — default true
 *
 * Usage:
 *   {(["design","build","operations"] as const).map((p) =>
 *     <PhaseBadge key={p} phase={p} active={phaseFlags[p]} />)}
 */

import type { HTMLAttributes } from "react";
import { Hammer, PencilRuler, Settings, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type Phase = "design" | "build" | "operations";

export interface PhaseBadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  phase: Phase;
  active?: boolean;
  size?: "xs" | "sm";
  showIcon?: boolean;
}

const PHASES: Record<Phase, { label: string; icon: LucideIcon; cls: string }> = {
  design: {
    label: "Design",
    icon: PencilRuler,
    cls: "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  },
  build: {
    label: "Build",
    icon: Hammer,
    cls: "border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-300",
  },
  operations: {
    label: "Operations",
    icon: Settings,
    cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  },
};

export function PhaseBadge({
  phase,
  active = true,
  size = "sm",
  showIcon = true,
  className,
  ...rest
}: PhaseBadgeProps) {
  const p = PHASES[phase];
  const Icon = p.icon;
  return (
    <span
      data-phase={phase}
      data-active={active}
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full border font-medium leading-none",
        size === "xs" ? "h-5 px-1.5 text-[10px]" : "h-6 px-2 text-xs",
        active ? p.cls : "border-dashed border-border bg-transparent text-muted-foreground",
        className,
      )}
      {...rest}
    >
      {showIcon && <Icon aria-hidden className={size === "xs" ? "h-3 w-3" : "h-3.5 w-3.5"} />}
      <span className={cn(!active && "line-through decoration-muted-foreground/60")}>
        {p.label}
      </span>
      {!active && <span className="sr-only">(not applicable)</span>}
    </span>
  );
}

export default PhaseBadge;

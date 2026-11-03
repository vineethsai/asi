import type { ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { stagger } from "@/lib/motion";
import { useReveal } from "@/hooks/useReveal";
import { useCountUp } from "@/hooks/useCountUp";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export interface PageHeaderStat {
  label: string;
  /** Numbers count up on first view; strings render as-is. Always compute from data. */
  value: number | string;
  /** Short explanation shown in a tooltip (e.g. how the number is derived). */
  hint?: string;
}

/** Dataset provenance (IMPROVEMENT_PLAN A11). */
export interface PageHeaderSource {
  name: string;
  version: string;
  url: string;
  /** ISO date, e.g. "2026-11-03"; rendered as "2026-11". */
  retrievedAt: string;
}

export interface PageHeaderProps {
  /** Small section label above the title (e.g. "Learn", "Threat catalog"). */
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  stats?: PageHeaderStat[];
  /** Right-aligned buttons/links next to the title. */
  actions?: ReactNode;
  /** One row of search/select/toggle controls under the stats. */
  filters?: ReactNode;
  source?: PageHeaderSource;
  className?: string;
  /** Rendered between the title block and the stats (e.g. a breadcrumb or badges). */
  children?: ReactNode;
}

function StatChip({
  stat,
  index,
  visible,
}: {
  stat: PageHeaderStat;
  index: number;
  visible: boolean;
}) {
  const numeric = typeof stat.value === "number";
  const counted = useCountUp(numeric ? (stat.value as number) : 0, undefined, visible);
  const display = numeric ? counted.toLocaleString() : stat.value;
  const finalText = numeric ? (stat.value as number).toLocaleString() : stat.value;

  const chip = (
    <li
      className="enter inline-flex items-baseline gap-1.5 rounded-full border bg-muted/40 px-3 py-1 text-sm"
      style={stagger(index)}
      tabIndex={stat.hint ? 0 : undefined}
    >
      <span
        className="font-semibold tabular-nums text-foreground"
        aria-hidden={numeric || undefined}
      >
        {display}
      </span>
      {numeric && <span className="sr-only">{finalText}</span>}
      <span className="text-muted-foreground">{stat.label}</span>
    </li>
  );

  if (!stat.hint) return chip;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{chip}</TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs">{stat.hint}</TooltipContent>
    </Tooltip>
  );
}

function formatRetrieved(value: string) {
  return /^\d{4}-\d{2}/.test(value) ? value.slice(0, 7) : value;
}

/**
 * Compact page header (IMPROVEMENT_PLAN P1-07): eyebrow, left-aligned h1, description,
 * count-up stat chips, optional actions, one filter row and a provenance line.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  stats,
  actions,
  filters,
  source,
  className,
  children,
}: PageHeaderProps) {
  const { ref, isVisible } = useReveal<HTMLUListElement>({ rootMargin: "0px" });

  return (
    <header className={cn("mb-6 space-y-3", className)}>
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">{eyebrow}</p>
      )}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
          {description && <p className="max-w-3xl text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
      {stats && stats.length > 0 && (
        <ul ref={ref} className="flex flex-wrap gap-2" aria-label="Summary">
          {stats.map((stat, i) => (
            <StatChip key={stat.label} stat={stat} index={i} visible={isVisible} />
          ))}
        </ul>
      )}
      {filters && (
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filters">
          {filters}
        </div>
      )}
      {source && (
        <p className="text-xs text-muted-foreground">
          Source:{" "}
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 underline-offset-2 hover:text-foreground hover:underline"
          >
            {source.name} {source.version}
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>{" "}
          · retrieved{" "}
          <time dateTime={source.retrievedAt}>{formatRetrieved(source.retrievedAt)}</time>
        </p>
      )}
    </header>
  );
}

export default PageHeader;

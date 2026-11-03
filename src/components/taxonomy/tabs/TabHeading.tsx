/**
 * Title block of a Taxonomy tab: the page owns the only h1 (PageHeader), each tab renders an h2
 * with a version chip and a one-line description.
 */
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TabHeadingProps {
  title: ReactNode;
  /** Version / edition label, e.g. "v2.0.0", "AIVSS v0.8", "AIUC-1 Q4-2026". */
  version?: ReactNode;
  description?: ReactNode;
  /** Right-aligned actions (buttons). */
  actions?: ReactNode;
  id?: string;
  className?: string;
}

export function TabHeading({
  title,
  version,
  description,
  actions,
  id,
  className,
}: TabHeadingProps) {
  return (
    <div
      className={cn(
        "mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id={id} className="text-xl font-semibold tracking-tight">
            {title}
          </h2>
          {version && (
            <span className="inline-flex items-center rounded-full border bg-muted/50 px-2 py-0.5 font-mono text-xs text-muted-foreground">
              {version}
            </span>
          )}
        </div>
        {description && <p className="max-w-3xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

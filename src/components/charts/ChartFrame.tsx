/**
 * ChartFrame — the wrapper every visualization renders inside (P1-09, §9).
 * Owns: heading + description, legend slot, toolbar slot, empty state, height, the accessible
 * name (`role="img"` + `aria-label`) and a visually hidden data-table fallback.
 *
 * Props:
 *   ariaLabel: string                     — required text alternative (summary of what the chart shows)
 *   title?: ReactNode; description?: ReactNode; headingLevel?: 2 | 3 | 4 (default 3)
 *   legend?: ReactNode; toolbar?: ReactNode; footer?: ReactNode (e.g. <SourceNote/>)
 *   empty?: boolean | ReactNode           — true → default EmptyState; node → custom
 *   emptyTitle?: string; emptyDescription?: string
 *   height?: number | string              — min-height of the plot area
 *   table?: { caption?: string; columns: string[]; rows: (string | number)[][] }  — sr-only
 *   interactive?: boolean                 — plot contains focusable marks: the plot becomes a
 *        labelled group (role="group", aria-roledescription="chart") and the role="img" text
 *        alternative moves to a sibling, so focusable children are not nested inside role="img"
 *        (axe: nested-interactive). Non-interactive charts put role="img" on the plot itself.
 *   bare?: boolean                        — no card chrome (border/padding)
 *   className?, plotClassName?, id?
 *
 * Usage:
 *   <ChartFrame title="Threat coverage" ariaLabel="Bar chart of …" table={{ columns, rows }}
 *     legend={<Legend/>} toolbar={<ToggleGroup/>}>
 *     <svg …/>
 *   </ChartFrame>
 */

import { useId, type ReactNode } from "react";
import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/content/EmptyState";

export interface ChartTable {
  caption?: string;
  columns: string[];
  rows: (string | number | null | undefined)[][];
}

export interface ChartFrameProps {
  ariaLabel: string;
  title?: ReactNode;
  description?: ReactNode;
  headingLevel?: 2 | 3 | 4;
  legend?: ReactNode;
  toolbar?: ReactNode;
  footer?: ReactNode;
  empty?: boolean | ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  height?: number | string;
  table?: ChartTable;
  interactive?: boolean;
  bare?: boolean;
  id?: string;
  className?: string;
  plotClassName?: string;
  children?: ReactNode;
}

/**
 * Visually hidden data table. The `.sr-only` clip lives on a wrapping <div>, not on the <table>:
 * a table box ignores `width: 1px` (its used width is at least its content width, and the
 * cells are `white-space: nowrap`) and `overflow` does not apply to table boxes, so an sr-only
 * table stays as wide as its text and widens the document on narrow screens. A block wrapper
 * clips it to 1x1px.
 */
export function ChartDataTable({ table, id }: { table: ChartTable; id?: string }) {
  return (
    <div className="sr-only">
      <table id={id}>
        {table.caption && <caption>{table.caption}</caption>}
        <thead>
          <tr>
            {table.columns.map((c, i) => (
              <th key={i} scope="col">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((r, ri) => (
            <tr key={ri}>
              {r.map((cell, ci) =>
                ci === 0 ? (
                  <th key={ci} scope="row">
                    {cell ?? ""}
                  </th>
                ) : (
                  <td key={ci}>{cell ?? ""}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ChartFrame({
  ariaLabel,
  title,
  description,
  headingLevel = 3,
  legend,
  toolbar,
  footer,
  empty,
  emptyTitle = "No data to show",
  emptyDescription,
  height,
  table,
  interactive = false,
  bare = false,
  id,
  className,
  plotClassName,
  children,
}: ChartFrameProps) {
  const uid = useId().replace(/:/g, "");
  const titleId = `${uid}-title`;
  const descId = `${uid}-desc`;
  const tableId = `${uid}-table`;
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const isEmpty = empty === true || (empty !== false && empty != null);
  const minHeight = typeof height === "number" ? `${height}px` : height;

  const plot = isEmpty ? (
    empty === true ? (
      <EmptyState compact icon={BarChart3} title={emptyTitle} description={emptyDescription} />
    ) : (
      (empty as ReactNode)
    )
  ) : interactive ? (
    <>
      <span role="img" aria-label={ariaLabel} className="sr-only" />
      <div
        role="group"
        aria-roledescription="interactive chart"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : "Interactive chart"}
        aria-describedby={description ? descId : undefined}
        className={cn("relative", plotClassName)}
        style={{ minHeight }}
      >
        {children}
      </div>
    </>
  ) : (
    <div
      role="img"
      aria-label={ariaLabel}
      aria-describedby={description ? descId : undefined}
      className={cn("relative", plotClassName)}
      style={{ minHeight }}
    >
      {children}
    </div>
  );

  return (
    <figure
      id={id}
      aria-labelledby={title ? titleId : undefined}
      className={cn(!bare && "rounded-lg border bg-card p-4 md:p-5", "min-w-0", className)}
    >
      {(title || description || toolbar) && (
        <div className="mb-3 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          {(title || description) && (
            <figcaption className="min-w-0 space-y-0.5">
              {title && (
                <Heading id={titleId} className="text-base font-semibold leading-tight">
                  {title}
                </Heading>
              )}
              {description && (
                <p id={descId} className="text-sm text-muted-foreground">
                  {description}
                </p>
              )}
            </figcaption>
          )}
          {toolbar && <div className="flex shrink-0 flex-wrap items-center gap-2">{toolbar}</div>}
        </div>
      )}
      {legend && !isEmpty && <div className="mb-3">{legend}</div>}
      {plot}
      {table && !isEmpty && <ChartDataTable table={table} id={tableId} />}
      {footer && <div className="mt-3">{footer}</div>}
    </figure>
  );
}

/** Simple swatch legend. `shape` adds a non-colour cue. */
export function ChartLegend({
  items,
  className,
  onToggle,
  hidden,
}: {
  items: { id: string; label: ReactNode; color: string; shape?: "square" | "circle" | "line" }[];
  className?: string;
  onToggle?: (id: string) => void;
  hidden?: ReadonlySet<string>;
}) {
  return (
    <ul className={cn("flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground", className)}>
      {items.map((it) => {
        const off = hidden?.has(it.id);
        const swatch = (
          <span
            aria-hidden
            className={cn(
              "inline-block shrink-0",
              it.shape === "circle" && "h-2.5 w-2.5 rounded-full",
              it.shape === "line" && "h-0.5 w-4 rounded",
              (!it.shape || it.shape === "square") && "h-2.5 w-2.5 rounded-sm",
            )}
            style={{ background: it.color, opacity: off ? 0.3 : 1 }}
          />
        );
        return (
          <li key={it.id}>
            {onToggle ? (
              <button
                type="button"
                aria-pressed={!off}
                onClick={() => onToggle(it.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded px-1 py-0.5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  off && "line-through opacity-60",
                )}
              >
                {swatch}
                {it.label}
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                {swatch}
                {it.label}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default ChartFrame;

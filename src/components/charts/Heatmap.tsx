/**
 * Heatmap — HTML <table> grid (§9 "Threat × Component heatmap"; not SVG, so native table
 * semantics are the accessible fallback). Fill = severity band, glyph size = magnitude
 * (e.g. attack vectors), cell text = value, so colour is never the only cue.
 *
 * Features: collapsible column groups (collapsed group → one aggregate column), sticky header
 * rows, first column pinned (sticky left) for horizontal scrolling on mobile, roving tabindex
 * with arrow / Home / End / PageUp / PageDown keys, Enter/Space → onCellClick, tooltip on
 * hover and focus.
 *
 * Props:
 *   rows: { id; label; sublabel?; href? }[]
 *   columns: { id; label; short?; group?; href? }[]
 *   groups?: { id; label; color? }[]                     — column groups (ids referenced by column.group)
 *   cells: Record<rowId, Record<colId, HeatmapCell>> | (rowId, colId) => HeatmapCell | undefined
 *       HeatmapCell = { value?: number; band?: SeverityBand; glyph?: number (0–1 size); label?: string; text?: string }
 *   onCellClick?: (row, column, cell) => void; onRowHeaderClick?: (row) => void
 *   collapsedGroups? / defaultCollapsedGroups? / onCollapsedGroupsChange?
 *   aggregate?: (cells, row, group) => HeatmapCell       — default: max band, summed value
 *   showValues?: boolean (default true); cellSize?: number (default 34)
 *   verticalHeaders?: boolean (default: columns > 10); maxHeight?: number | string
 *   rowHeaderLabel?: string; renderTooltip?: (row, column, cell) => ReactNode
 *   showTotals?: boolean (default false) — row totals (last column) and column totals (footer
 *       row): the number of mapped cells; totalLabel?: string (default "Total")
 *   ariaLabel: string; title?; description?; legend?; toolbar?
 *
 * Usage:
 *   <Heatmap ariaLabel="Threats by component" rows={threatRows} columns={componentCols}
 *     groups={KC_LIST.map((k) => ({ id: k.id, label: k.code, color: k.color }))}
 *     cells={(t, c) => matrix[t]?.[c]} onCellClick={(r) => navigate(`/threats/${r.id}`)} />
 */

import { useCallback, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { severityColor, severityLabel, type SeverityBand } from "@/lib/severity";
import { ChartFrame } from "./ChartFrame";
import { ChartTooltip } from "./ChartTooltip";
import { useChartTooltip } from "./useChartTooltip";
import { defaultAggregate } from "./chartUtils";

export interface HeatmapRow {
  id: string;
  label: string;
  sublabel?: string;
  href?: string;
}
export interface HeatmapColumn {
  id: string;
  label: string;
  short?: string;
  group?: string;
  href?: string;
}
export interface HeatmapGroup {
  id: string;
  label: string;
  color?: string;
}
export interface HeatmapCell {
  value?: number;
  band?: SeverityBand;
  /** Relative glyph size 0–1 (e.g. vectors / max vectors). */
  glyph?: number;
  /** Accessible / tooltip text for the cell. */
  label?: string;
  /** Visible text override (default: value). */
  text?: string;
}
export type HeatmapCells =
  | Record<string, Record<string, HeatmapCell | undefined> | undefined>
  | ((rowId: string, colId: string) => HeatmapCell | undefined);

export interface HeatmapProps {
  rows: HeatmapRow[];
  columns: HeatmapColumn[];
  groups?: HeatmapGroup[];
  cells: HeatmapCells;
  ariaLabel: string;
  title?: ReactNode;
  description?: ReactNode;
  legend?: ReactNode;
  toolbar?: ReactNode;
  onCellClick?: (row: HeatmapRow, column: HeatmapColumn, cell: HeatmapCell | undefined) => void;
  onRowHeaderClick?: (row: HeatmapRow) => void;
  collapsedGroups?: string[];
  defaultCollapsedGroups?: string[];
  onCollapsedGroupsChange?: (ids: string[]) => void;
  aggregate?: (cells: HeatmapCell[], row: HeatmapRow, group: HeatmapGroup) => HeatmapCell;
  showValues?: boolean;
  cellSize?: number;
  verticalHeaders?: boolean;
  maxHeight?: number | string;
  rowHeaderLabel?: string;
  showTotals?: boolean;
  totalLabel?: string;
  renderTooltip?: (
    row: HeatmapRow,
    column: HeatmapColumn,
    cell: HeatmapCell | undefined,
  ) => ReactNode;
  className?: string;
}

/** Visible column: a real column or a collapsed group's aggregate column. */
type VisibleCol =
  | { kind: "col"; col: HeatmapColumn; group?: HeatmapGroup }
  | { kind: "agg"; group: HeatmapGroup; members: HeatmapColumn[] };

export function Heatmap({
  rows,
  columns,
  groups,
  cells,
  ariaLabel,
  title,
  description,
  legend,
  toolbar,
  onCellClick,
  onRowHeaderClick,
  collapsedGroups,
  defaultCollapsedGroups,
  onCollapsedGroupsChange,
  aggregate,
  showValues = true,
  cellSize = 34,
  verticalHeaders,
  maxHeight,
  rowHeaderLabel = "",
  showTotals = false,
  totalLabel = "Total",
  renderTooltip,
  className,
}: HeatmapProps) {
  const [innerCollapsed, setInnerCollapsed] = useState<string[]>(defaultCollapsedGroups ?? []);
  const collapsed = useMemo(
    () => new Set(collapsedGroups ?? innerCollapsed),
    [collapsedGroups, innerCollapsed],
  );
  const toggleGroup = useCallback(
    (id: string) => {
      const next = collapsed.has(id) ? [...collapsed].filter((g) => g !== id) : [...collapsed, id];
      if (collapsedGroups === undefined) setInnerCollapsed(next);
      onCollapsedGroupsChange?.(next);
    },
    [collapsed, collapsedGroups, onCollapsedGroupsChange],
  );

  const getCell = useCallback(
    (r: string, c: string): HeatmapCell | undefined =>
      typeof cells === "function" ? cells(r, c) : cells[r]?.[c],
    [cells],
  );

  const groupById = useMemo(() => new Map((groups ?? []).map((g) => [g.id, g])), [groups]);

  // Visible columns + header segments (contiguous runs of the same group).
  const { visible, segments } = useMemo(() => {
    const vis: VisibleCol[] = [];
    const segs: { group?: HeatmapGroup; span: number; collapsed: boolean }[] = [];
    let i = 0;
    while (i < columns.length) {
      const g = columns[i].group ? groupById.get(columns[i].group as string) : undefined;
      let j = i;
      while (j < columns.length && columns[j].group === columns[i].group) j++;
      const run = columns.slice(i, j);
      if (g && collapsed.has(g.id)) {
        vis.push({ kind: "agg", group: g, members: run });
        segs.push({ group: g, span: 1, collapsed: true });
      } else {
        run.forEach((col) => vis.push({ kind: "col", col, group: g }));
        segs.push({ group: g, span: run.length, collapsed: false });
      }
      i = j;
    }
    return { visible: vis, segments: segs };
  }, [columns, groupById, collapsed]);

  const cellAt = useCallback(
    (row: HeatmapRow, vc: VisibleCol): HeatmapCell | undefined => {
      if (vc.kind === "col") return getCell(row.id, vc.col.id);
      const member = vc.members
        .map((m) => getCell(row.id, m.id))
        .filter((c): c is HeatmapCell => !!c);
      return aggregate ? aggregate(member, row, vc.group) : defaultAggregate(member);
    },
    [getCell, aggregate],
  );

  // Roving tabindex
  const [focus, setFocus] = useState<[number, number]>([0, 0]);
  const tableRef = useRef<HTMLTableElement>(null);
  const {
    tip,
    show,
    hide,
    id: tipId,
  } = useChartTooltip<{
    row: HeatmapRow;
    vc: VisibleCol;
    cell?: HeatmapCell;
  }>();

  const fr = Math.min(focus[0], Math.max(0, rows.length - 1));
  const fc = Math.min(focus[1], Math.max(0, visible.length - 1));

  const focusCell = (r: number, c: number) => {
    const rr = Math.max(0, Math.min(rows.length - 1, r));
    const cc = Math.max(0, Math.min(visible.length - 1, c));
    setFocus([rr, cc]);
    const el = tableRef.current?.querySelector<HTMLElement>(`[data-cell="${rr}:${cc}"]`);
    el?.focus();
  };

  const activate = (row: HeatmapRow, vc: VisibleCol) => {
    if (vc.kind === "agg") toggleGroup(vc.group.id);
    else onCellClick?.(row, vc.col, getCell(row.id, vc.col.id));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLElement>, r: number, c: number) => {
    const keys: Record<string, () => void> = {
      ArrowRight: () => focusCell(r, c + 1),
      ArrowLeft: () => focusCell(r, c - 1),
      ArrowDown: () => focusCell(r + 1, c),
      ArrowUp: () => focusCell(r - 1, c),
      Home: () => (e.ctrlKey || e.metaKey ? focusCell(0, 0) : focusCell(r, 0)),
      End: () =>
        e.ctrlKey || e.metaKey
          ? focusCell(rows.length - 1, visible.length - 1)
          : focusCell(r, visible.length - 1),
      PageDown: () => focusCell(r + 5, c),
      PageUp: () => focusCell(r - 5, c),
      Enter: () => activate(rows[r], visible[c]),
      " ": () => activate(rows[r], visible[c]),
      Escape: () => hide(),
    };
    const fn = keys[e.key];
    if (fn) {
      e.preventDefault();
      fn();
    }
  };

  const isMapped = (c?: HeatmapCell) => !!c && (c.value !== undefined || !!c.band);
  const rowTotal = (row: HeatmapRow) =>
    columns.reduce((n, col) => n + (isMapped(getCell(row.id, col.id)) ? 1 : 0), 0);
  const colTotal = (vc: VisibleCol) =>
    rows.reduce(
      (n, row) =>
        n +
        ((vc.kind === "col" ? [vc.col] : vc.members).some((m) => isMapped(getCell(row.id, m.id)))
          ? 1
          : 0),
      0,
    );
  const totalCls = "border-b bg-muted/40 px-2 text-center font-mono font-semibold tabular-nums";

  const vertical = verticalHeaders ?? columns.length > 10;
  const hasGroups = !!groups?.length;
  const colLabel = (vc: VisibleCol) =>
    vc.kind === "col" ? vc.col.label : `${vc.group.label} (all)`;
  const describe = (row: HeatmapRow, vc: VisibleCol, cell?: HeatmapCell) => {
    if (!cell || (cell.value === undefined && !cell.band))
      return `${row.label} × ${colLabel(vc)}: none`;
    const parts = [
      cell.band && cell.band !== "none" ? severityLabel(cell.band) : null,
      cell.value !== undefined ? String(cell.value) : null,
      cell.label ?? null,
    ].filter(Boolean);
    return `${row.label} × ${colLabel(vc)}: ${parts.join(", ")}`;
  };

  return (
    <ChartFrame
      ariaLabel={ariaLabel}
      title={title}
      description={description}
      legend={legend}
      toolbar={toolbar}
      interactive
      empty={rows.length === 0 || columns.length === 0}
      className={className}
    >
      <div
        className="relative max-w-full overflow-auto rounded-md border"
        style={{ maxHeight: typeof maxHeight === "number" ? `${maxHeight}px` : maxHeight }}
      >
        <table
          ref={tableRef}
          role="grid"
          aria-label={ariaLabel}
          aria-rowcount={rows.length + (hasGroups ? 2 : 1) + (showTotals ? 1 : 0)}
          aria-colcount={visible.length + 1 + (showTotals ? 1 : 0)}
          className="border-separate border-spacing-0 text-xs"
        >
          <thead>
            {hasGroups && (
              <tr className="h-8">
                <th
                  scope="col"
                  rowSpan={2}
                  className="sticky left-0 top-0 z-30 border-b border-r bg-card px-3 text-left align-bottom font-medium text-muted-foreground"
                >
                  {rowHeaderLabel}
                </th>
                {segments.map((s, i) =>
                  s.group ? (
                    <th
                      key={`${s.group.id}-${i}`}
                      scope="colgroup"
                      colSpan={s.span}
                      className="sticky top-0 z-20 h-8 border-b border-r bg-card px-1 text-center font-semibold"
                      style={{
                        boxShadow: s.group.color ? `inset 0 3px 0 ${s.group.color}` : undefined,
                      }}
                    >
                      <button
                        type="button"
                        aria-expanded={!s.collapsed}
                        onClick={() => toggleGroup(s.group!.id)}
                        className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        title={
                          s.collapsed ? `Expand ${s.group.label}` : `Collapse ${s.group.label}`
                        }
                      >
                        {s.collapsed ? (
                          <ChevronRight aria-hidden className="h-3 w-3" />
                        ) : (
                          <ChevronLeft aria-hidden className="h-3 w-3" />
                        )}
                        <span className="whitespace-nowrap">{s.group.label}</span>
                      </button>
                    </th>
                  ) : (
                    <th
                      key={`none-${i}`}
                      scope="colgroup"
                      colSpan={s.span}
                      className="sticky top-0 z-20 h-8 border-b border-r bg-card"
                    />
                  ),
                )}
                {showTotals && (
                  <th
                    scope="col"
                    rowSpan={2}
                    className="sticky top-0 z-20 border-b bg-card px-2 align-bottom font-medium text-muted-foreground"
                  >
                    {totalLabel}
                  </th>
                )}
              </tr>
            )}
            <tr>
              {!hasGroups && (
                <th
                  scope="col"
                  className="sticky left-0 top-0 z-30 border-b border-r bg-card px-3 text-left align-bottom font-medium text-muted-foreground"
                >
                  {rowHeaderLabel}
                </th>
              )}
              {visible.map((vc, ci) => {
                const label = vc.kind === "col" ? (vc.col.short ?? vc.col.label) : vc.group.label;
                return (
                  <th
                    key={vc.kind === "col" ? vc.col.id : `agg-${vc.group.id}`}
                    scope="col"
                    title={colLabel(vc)}
                    className={cn(
                      "sticky z-20 border-b border-r bg-card px-1 py-1.5 align-bottom font-medium text-muted-foreground",
                      hasGroups ? "top-8" : "top-0",
                      vc.kind === "agg" && "bg-muted/60 italic",
                    )}
                    style={{ minWidth: cellSize, maxWidth: vertical ? cellSize : 120 }}
                    aria-colindex={ci + 2}
                  >
                    <span
                      className={cn(
                        "block whitespace-nowrap",
                        vertical &&
                          "mx-auto max-h-28 overflow-hidden text-ellipsis [writing-mode:vertical-rl] rotate-180",
                        !vertical && "truncate",
                      )}
                    >
                      {label}
                    </span>
                  </th>
                );
              })}
              {showTotals && !hasGroups && (
                <th
                  scope="col"
                  className="sticky top-0 z-20 border-b bg-card px-2 align-bottom font-medium text-muted-foreground"
                >
                  {totalLabel}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={row.id}>
                <th
                  scope="row"
                  className="sticky left-0 z-10 max-w-[11rem] border-b border-r bg-card px-3 py-1 text-left font-medium text-foreground sm:max-w-[16rem]"
                >
                  {onRowHeaderClick ? (
                    <button
                      type="button"
                      onClick={() => onRowHeaderClick(row)}
                      className="block w-full truncate rounded text-left hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      title={row.label}
                    >
                      {row.label}
                    </button>
                  ) : (
                    <span className="block truncate" title={row.label}>
                      {row.label}
                    </span>
                  )}
                  {row.sublabel && (
                    <span className="block truncate text-[10px] font-normal text-muted-foreground">
                      {row.sublabel}
                    </span>
                  )}
                </th>
                {visible.map((vc, ci) => {
                  const cell = cellAt(row, vc);
                  const band = cell?.band ?? (cell?.value ? "info" : undefined);
                  const has = !!cell && (cell.value !== undefined || !!cell.band);
                  const g = Math.max(0, Math.min(1, cell?.glyph ?? (has ? 0.5 : 0)));
                  const d = Math.round(6 + g * (cellSize - 16));
                  const isFocus = ri === fr && ci === fc;
                  const tipOpen =
                    tip.open && tip.content?.row.id === row.id && tip.content?.vc === vc;
                  return (
                    <td
                      key={vc.kind === "col" ? vc.col.id : `agg-${vc.group.id}`}
                      role="gridcell"
                      data-cell={`${ri}:${ci}`}
                      data-band={band}
                      tabIndex={isFocus ? 0 : -1}
                      aria-label={describe(row, vc, cell)}
                      aria-describedby={tipOpen ? tipId : undefined}
                      aria-colindex={ci + 2}
                      onClick={() => {
                        setFocus([ri, ci]);
                        activate(row, vc);
                      }}
                      onKeyDown={(e) => onKeyDown(e, ri, ci)}
                      onFocus={(e) => {
                        setFocus([ri, ci]);
                        show(e.currentTarget, { row, vc, cell });
                      }}
                      onBlur={hide}
                      onMouseEnter={(e) => show(e.currentTarget, { row, vc, cell })}
                      onMouseLeave={hide}
                      className={cn(
                        "relative border-b border-r p-0 text-center align-middle outline-none transition-colors",
                        "focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                        (onCellClick || vc.kind === "agg") &&
                          "cursor-pointer hover:brightness-95 dark:hover:brightness-125",
                        vc.kind === "agg" && "bg-muted/40",
                      )}
                      style={{
                        width: cellSize,
                        height: cellSize,
                        minWidth: cellSize,
                        background: has && band ? severityColor(band, "base", 0.14) : undefined,
                      }}
                    >
                      {has && band && (
                        <span
                          aria-hidden
                          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                          style={{
                            width: d,
                            height: d,
                            background: severityColor(band, "base", 0.85),
                          }}
                        />
                      )}
                      {has && showValues && (
                        <span
                          aria-hidden
                          className="relative font-mono text-[10px] font-semibold tabular-nums text-foreground"
                          style={{ textShadow: "0 0 2px hsl(var(--card))" }}
                        >
                          {cell?.text ?? cell?.value ?? ""}
                        </span>
                      )}
                    </td>
                  );
                })}
                {showTotals && (
                  <td
                    role="gridcell"
                    aria-label={`${row.label}: ${rowTotal(row)} mapped`}
                    className={totalCls}
                  >
                    {rowTotal(row)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          {showTotals && (
            <tfoot>
              <tr>
                <th
                  scope="row"
                  className="sticky left-0 z-10 border-r bg-card px-3 py-1 text-left font-medium text-muted-foreground"
                >
                  {totalLabel}
                </th>
                {visible.map((vc) => (
                  <td
                    key={vc.kind === "col" ? vc.col.id : `agg-${vc.group.id}`}
                    role="gridcell"
                    aria-label={`${colLabel(vc)}: ${colTotal(vc)} mapped`}
                    className={cn(totalCls, "border-r")}
                    style={{ height: cellSize }}
                  >
                    {colTotal(vc)}
                  </td>
                ))}
                <td
                  role="gridcell"
                  aria-label={`${rows.reduce((n, r) => n + rowTotal(r), 0)} mapped in all`}
                  className={totalCls}
                >
                  {rows.reduce((n, r) => n + rowTotal(r), 0)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <ChartTooltip {...tip} id={tipId} onDismiss={hide}>
        {tip.content &&
          (renderTooltip && tip.content.vc.kind === "col" ? (
            renderTooltip(tip.content.row, tip.content.vc.col, tip.content.cell)
          ) : (
            <div className="space-y-0.5">
              <p className="font-medium">{tip.content.row.label}</p>
              <p className="text-muted-foreground">{colLabel(tip.content.vc)}</p>
              <p>
                {tip.content.cell && (tip.content.cell.value !== undefined || tip.content.cell.band)
                  ? [
                      tip.content.cell.band ? severityLabel(tip.content.cell.band) : null,
                      tip.content.cell.value !== undefined ? `${tip.content.cell.value}` : null,
                      tip.content.cell.label,
                    ]
                      .filter(Boolean)
                      .join(" · ")
                  : "No mapping"}
              </p>
              {tip.content.vc.kind === "agg" && (
                <p className="text-muted-foreground">Enter to expand group</p>
              )}
            </div>
          ))}
      </ChartTooltip>
    </ChartFrame>
  );
}

export default Heatmap;

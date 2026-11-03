/**
 * NIST AI RMF × AISVS 1.01 compliance matrix (§9 "NIST compliance matrix"): an HTML table with
 * all AISVS chapters as columns, sticky header row and first column, horizontal scroll, and two
 * row granularities:
 *   - Category    → cell = number of the category's (filtered) subcategories mapping to the
 *                   chapter, sequential fill normalised by the largest cell, number printed;
 *   - Subcategory → cell = mapped (✓) or not, with the cited-requirement count in its label.
 * Cells are buttons in a roving-tabindex grid (arrow keys, Home/End); Enter/click opens the drawer
 * with that row and chapter.
 */
import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { sequentialColor, sequentialNeedsInverseText } from "@/lib/palette";
import { AISVS_CHAPTER_CODES, AISVS_VERSION } from "@/data/aisvs";
import { getNistCategory, type NistRmfSubcategory } from "@/data/nist";
import { categoriesOf, chapterCounts, chapterName, citedIn, type NistSelection } from "./selection";

export type MatrixGranularity = "category" | "subcategory";

interface Row {
  kind: "category" | "subcategory";
  code: string;
  name: string;
  values: Record<string, number>;
  /** Accessible / tooltip text per chapter. */
  labels: Record<string, string>;
  total: number;
}

export interface NistComplianceMatrixProps {
  subcategories: readonly NistRmfSubcategory[];
  selection: NistSelection | null;
  onSelect: (sel: NistSelection) => void;
  granularity?: MatrixGranularity;
  onGranularityChange?: (g: MatrixGranularity) => void;
}

const MAPPED_T = 0.65;

export function NistComplianceMatrix({
  subcategories,
  selection,
  onSelect,
  granularity: controlled,
  onGranularityChange,
}: NistComplianceMatrixProps) {
  const [inner, setInner] = useState<MatrixGranularity>("category");
  const granularity = controlled ?? inner;
  const setGranularity = (g: MatrixGranularity) => {
    if (controlled === undefined) setInner(g);
    onGranularityChange?.(g);
  };
  const chapters = AISVS_CHAPTER_CODES;

  const { rows, max, totals } = useMemo(() => {
    const out: Row[] = [];
    if (granularity === "category") {
      for (const cat of categoriesOf(subcategories)) {
        const subs = subcategories.filter((s) => s.categoryCode === cat.code);
        const values = chapterCounts(subs);
        const labels: Record<string, string> = {};
        for (const ch of chapters) {
          labels[ch] =
            `${cat.code} × ${ch} ${chapterName(ch)}: ${values[ch]} of ${subs.length} subcategories map`;
        }
        out.push({
          kind: "category",
          code: cat.code,
          name: cat.name,
          values,
          labels,
          total: Object.values(values).reduce((a, b) => a + b, 0),
        });
      }
    } else {
      for (const sub of subcategories) {
        const values: Record<string, number> = {};
        const labels: Record<string, string> = {};
        for (const ch of chapters) {
          const mapped = sub.aisvs.includes(ch);
          const cited = citedIn(sub, ch);
          values[ch] = mapped ? 1 : 0;
          labels[ch] = mapped
            ? `${sub.code} × ${ch} ${chapterName(ch)}: mapped; cites ${cited.length} requirement${cited.length === 1 ? "" : "s"}${cited.length ? ` (${cited.join(", ")})` : ""}`
            : `${sub.code} × ${ch} ${chapterName(ch)}: not mapped`;
        }
        out.push({
          kind: "subcategory",
          code: sub.code,
          name: sub.name,
          values,
          labels,
          total: sub.aisvs.length,
        });
      }
    }
    const maxValue = Math.max(1, ...out.flatMap((r) => chapters.map((c) => r.values[c])));
    return { rows: out, max: maxValue, totals: chapterCounts(subcategories) };
  }, [granularity, subcategories, chapters]);

  // Roving tabindex over the body cells.
  const [focus, setFocus] = useState<[number, number]>([0, 0]);
  const gridRef = useRef<HTMLTableSectionElement>(null);
  const fr = Math.min(focus[0], Math.max(0, rows.length - 1));
  const fc = Math.min(focus[1], chapters.length - 1);
  const moveTo = (r: number, c: number) => {
    const nr = Math.max(0, Math.min(rows.length - 1, r));
    const nc = Math.max(0, Math.min(chapters.length - 1, c));
    setFocus([nr, nc]);
    gridRef.current?.querySelector<HTMLButtonElement>(`button[data-cell="${nr}:${nc}"]`)?.focus();
  };
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, r: number, c: number) => {
    const map: Record<string, [number, number]> = {
      ArrowUp: [r - 1, c],
      ArrowDown: [r + 1, c],
      ArrowLeft: [r, c - 1],
      ArrowRight: [r, c + 1],
      Home: [r, 0],
      End: [r, chapters.length - 1],
    };
    const next = map[e.key];
    if (!next) return;
    e.preventDefault();
    moveTo(next[0], next[1]);
  };

  const selectedRow =
    selection && (selection.kind === "category" || selection.kind === "subcategory")
      ? selection.code
      : null;
  const selectedChapter =
    selection?.chapter ?? (selection?.kind === "chapter" ? selection.code : null);

  const toolbar = (
    <div role="group" aria-label="Rows" className="inline-flex rounded-md border p-0.5 text-xs">
      {(["category", "subcategory"] as const).map((g) => (
        <button
          key={g}
          type="button"
          aria-pressed={granularity === g}
          onClick={() => setGranularity(g)}
          className={cn(
            "rounded px-2 py-1 capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            granularity === g
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {g === "category" ? "Categories" : "Subcategories"}
        </button>
      ))}
    </div>
  );

  const legendSteps = granularity === "category" ? Math.min(max, 5) : 1;
  const legend = (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <span
          aria-hidden
          className="h-3 w-3 rounded-sm border"
          style={{ background: sequentialColor(0) }}
        />
        0 · no mapping
      </span>
      {granularity === "category" ? (
        <span className="inline-flex items-center gap-1">
          {Array.from({ length: legendSteps }, (_, i) => {
            const v = Math.round(((i + 1) / legendSteps) * max);
            return (
              <span
                key={v}
                aria-hidden
                className="h-3 w-3 rounded-sm"
                style={{ background: sequentialColor(v / max) }}
              />
            );
          })}
          <span className="ml-1">1 – {max} subcategories mapping</span>
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className="inline-flex h-3 w-3 items-center justify-center rounded-sm"
            style={{ background: sequentialColor(MAPPED_T) }}
          />
          ✓ mapped (label lists cited requirements)
        </span>
      )}
      <span>Row labels are short labels by this site.</span>
    </div>
  );

  return (
    <ChartFrame
      title="Compliance matrix"
      description={`NIST AI RMF ${granularity === "category" ? "categories" : "subcategories"} against every AISVS ${AISVS_VERSION} chapter. Select a cell for details.`}
      ariaLabel={`Matrix of ${rows.length} NIST AI RMF ${granularity === "category" ? "categories" : "subcategories"} by ${chapters.length} AISVS ${AISVS_VERSION} chapters`}
      toolbar={toolbar}
      legend={legend}
      interactive
      empty={rows.length === 0}
      emptyTitle="No subcategories match the filters"
    >
      <div className="max-h-[70vh] overflow-auto rounded-md border">
        <table className="w-full border-separate border-spacing-0 text-sm">
          <caption className="sr-only">
            NIST AI RMF {granularity === "category" ? "categories" : "subcategories"} (rows) mapped
            to AISVS {AISVS_VERSION} chapters (columns); last column and row are totals.
          </caption>
          <thead>
            <tr>
              <th
                scope="col"
                className="sticky left-0 top-0 z-20 border-b border-r bg-card px-3 py-2 text-left text-xs font-semibold text-muted-foreground"
              >
                NIST AI RMF
              </th>
              {chapters.map((ch) => (
                <th
                  key={ch}
                  scope="col"
                  title={`${ch}: ${chapterName(ch)}`}
                  className={cn(
                    "sticky top-0 z-10 border-b bg-card px-1 py-2 text-center font-mono text-xs font-semibold",
                    selectedChapter === ch && "text-primary",
                  )}
                >
                  {ch}
                  <span className="sr-only">: {chapterName(ch)}</span>
                </th>
              ))}
              <th
                scope="col"
                className="sticky top-0 z-10 border-b border-l bg-card px-2 py-2 text-center text-xs font-semibold text-muted-foreground"
              >
                Total
              </th>
            </tr>
          </thead>
          <tbody ref={gridRef}>
            {rows.map((row, r) => {
              const rowSelected = selectedRow === row.code;
              const fnCat =
                row.kind === "subcategory"
                  ? getNistCategory(row.code.split(".").slice(0, 2).join("."))
                  : undefined;
              return (
                <tr key={row.code} className={cn(rowSelected && "bg-primary/5")}>
                  <th
                    scope="row"
                    className={cn(
                      "sticky left-0 z-[5] max-w-[16rem] border-b border-r bg-card p-0 text-left font-normal",
                      rowSelected && "bg-accent",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => onSelect({ kind: row.kind, code: row.code })}
                      title={fnCat ? `${fnCat.code} ${fnCat.name} › ${row.name}` : row.name}
                      className="flex w-full min-w-[11rem] flex-col items-start px-3 py-1.5 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    >
                      <span className="font-mono text-xs font-semibold">{row.code}</span>
                      <span className="line-clamp-1 text-xs text-muted-foreground">{row.name}</span>
                    </button>
                  </th>
                  {chapters.map((ch, c) => {
                    const v = row.values[ch];
                    const t = row.kind === "category" ? v / max : v ? MAPPED_T : 0;
                    const inverse = v > 0 && sequentialNeedsInverseText(t);
                    const cellSelected = rowSelected && selectedChapter === ch;
                    return (
                      <td key={ch} className="border-b p-0.5 text-center">
                        <button
                          type="button"
                          data-cell={`${r}:${c}`}
                          tabIndex={r === fr && c === fc ? 0 : -1}
                          aria-label={row.labels[ch]}
                          title={row.labels[ch]}
                          onFocus={() => setFocus([r, c])}
                          onKeyDown={(e) => onKeyDown(e, r, c)}
                          onClick={() => onSelect({ kind: row.kind, code: row.code, chapter: ch })}
                          className={cn(
                            "flex h-8 w-full min-w-[2.25rem] items-center justify-center rounded text-xs font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            inverse ? "text-primary-foreground" : "text-foreground",
                            v === 0 && "text-muted-foreground/40",
                            cellSelected && "ring-2 ring-primary",
                          )}
                          style={{ background: v > 0 ? sequentialColor(t) : undefined }}
                        >
                          {row.kind === "subcategory" ? (
                            v ? (
                              <Check aria-hidden className="h-3.5 w-3.5" />
                            ) : (
                              <span aria-hidden>·</span>
                            )
                          ) : (
                            <span aria-hidden>{v || "·"}</span>
                          )}
                        </button>
                      </td>
                    );
                  })}
                  <td className="border-b border-l px-2 text-center text-xs font-semibold tabular-nums text-muted-foreground">
                    {row.total}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <th
                scope="row"
                className="sticky left-0 z-[5] border-r bg-card px-3 py-2 text-left text-xs font-semibold text-muted-foreground"
              >
                Subcategories mapping
              </th>
              {chapters.map((ch) => (
                <td key={ch} className="px-1 py-2 text-center text-xs font-semibold tabular-nums">
                  {totals[ch]}
                </td>
              ))}
              <td className="border-l px-2 py-2 text-center text-xs font-semibold tabular-nums">
                {Object.values(totals).reduce((a, b) => a + b, 0)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </ChartFrame>
  );
}

export default NistComplianceMatrix;

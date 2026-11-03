import { ChartFrame } from "@/components/charts/ChartFrame";
import { sequentialColor, sequentialNeedsInverseText } from "@/lib/palette";
import { cn } from "@/lib/utils";
import { CROSSWALK_GROUPS, FRAMEWORK_PAIR_COUNTS, type CrosswalkFramework } from "./crosswalkGraph";

export interface DensityMatrixProps {
  /** Cell click: show only these two frameworks in the Sankey. */
  onSelectPair: (a: CrosswalkFramework, b: CrosswalkFramework) => void;
  selectedPair?: [CrosswalkFramework, CrosswalkFramework] | null;
}

const MAX = Math.max(1, ...Object.values(FRAMEWORK_PAIR_COUNTS));

/** Framework × framework mapping counts (sequential fill); each cell filters the Sankey. */
export function DensityMatrix({ onSelectPair, selectedPair }: DensityMatrixProps) {
  const isSelected = (a: string, b: string) =>
    !!selectedPair &&
    ((selectedPair[0] === a && selectedPair[1] === b) ||
      (selectedPair[0] === b && selectedPair[1] === a));

  return (
    <ChartFrame
      title="Cross-reference density"
      description="Mapping statements between each pair of frameworks. Select a cell to show just that pair in the flow above."
      ariaLabel="Matrix of mapping counts between frameworks"
      interactive
    >
      <div className="relative max-w-full overflow-x-auto">
        <table className="w-full min-w-[34rem] border-separate border-spacing-1 text-sm">
          <caption className="sr-only">
            Number of mapping statements between frameworks; empty cells have none.
          </caption>
          <thead>
            <tr>
              <td />
              {CROSSWALK_GROUPS.map((g) => (
                <th key={g.id} scope="col" className="px-2 py-1 text-center text-xs font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      aria-hidden
                      className="h-2.5 w-2.5 rounded-sm"
                      style={{ background: g.color }}
                    />
                    {g.short}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CROSSWALK_GROUPS.map((row) => (
              <tr key={row.id}>
                <th
                  scope="row"
                  className="whitespace-nowrap px-2 py-1 text-left text-xs font-medium"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      aria-hidden
                      className="h-2.5 w-2.5 rounded-sm"
                      style={{ background: row.color }}
                    />
                    {row.short}
                  </span>
                </th>
                {CROSSWALK_GROUPS.map((col) => {
                  if (row.id === col.id)
                    return (
                      <td
                        key={col.id}
                        className="text-center text-muted-foreground/50"
                        aria-label="Same framework"
                      >
                        —
                      </td>
                    );
                  const count = FRAMEWORK_PAIR_COUNTS[`${row.id}|${col.id}`] ?? 0;
                  const t = count / MAX;
                  if (count === 0)
                    return (
                      <td
                        key={col.id}
                        className="rounded-md bg-muted/40 text-center text-xs text-muted-foreground"
                      >
                        <span aria-label={`${row.short} and ${col.short}: no mappings`}>0</span>
                      </td>
                    );
                  return (
                    <td key={col.id} className="p-0">
                      <button
                        type="button"
                        onClick={() => onSelectPair(row.id, col.id)}
                        aria-pressed={isSelected(row.id, col.id)}
                        aria-label={`${row.short} and ${col.short}: ${count} mappings. Show this pair in the flow.`}
                        className={cn(
                          "h-9 w-full min-w-[3.5rem] rounded-md font-mono text-xs tabular-nums transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          isSelected(row.id, col.id) && "ring-2 ring-primary",
                          sequentialNeedsInverseText(t)
                            ? "text-primary-foreground"
                            : "text-foreground",
                        )}
                        style={{ background: sequentialColor(t) }}
                      >
                        {count}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartFrame>
  );
}

export default DensityMatrix;

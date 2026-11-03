/** Visible threat filters (P3-34): search, severity, status, scope, inherited/resolved toggles. */
import { useId } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { severityLabel, severityToken } from "@/lib/severity";
import type { Severity } from "../types";
import {
  DEFAULT_FILTERS,
  SEVERITIES,
  STATUS_LABELS,
  STATUS_OPTIONS,
  isDefaultFilters,
  type GroupBy,
  type ScopeFilter,
  type StatusFilter,
  type ThreatFilterState,
} from "./helpers";

const select =
  "h-7 rounded-md border border-input bg-background px-1.5 text-[11px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function ThreatFilters({
  filters,
  onChange,
  groupBy,
  onGroupBy,
  counts,
}: {
  filters: ThreatFilterState;
  onChange: (next: ThreatFilterState) => void;
  groupBy: GroupBy;
  onGroupBy: (g: GroupBy) => void;
  counts: Record<Severity, number>;
}) {
  const uid = useId();
  const set = (patch: Partial<ThreatFilterState>) => onChange({ ...filters, ...patch });
  const toggleSev = (s: Severity) =>
    set({
      severities: filters.severities.includes(s)
        ? filters.severities.filter((x) => x !== s)
        : [...filters.severities, s],
    });
  return (
    <div className="space-y-1.5" role="group" aria-label="Threat filters">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <label htmlFor={`${uid}-q`} className="sr-only">
          Search threats
        </label>
        <input
          id={`${uid}-q`}
          type="search"
          value={filters.search}
          onChange={(e) => set({ search: e.target.value })}
          placeholder="Search threats, rule ids, components, ASI…"
          className="h-8 w-full rounded-md border border-input bg-background pl-7 pr-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Severity">
        {SEVERITIES.map((s) => {
          const on = filters.severities.includes(s);
          const t = severityToken(s);
          return (
            <button
              key={s}
              type="button"
              aria-pressed={on}
              onClick={() => toggleSev(s)}
              className={cn(
                "inline-flex h-6 items-center gap-1 rounded-full border px-2 text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                on ? t.badge : "border-border text-muted-foreground hover:bg-accent",
              )}
            >
              <span aria-hidden className={cn("h-2 w-2 rounded-full", t.chart)} />
              {severityLabel(s)} {counts[s]}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <label htmlFor={`${uid}-status`} className="sr-only">
          Status
        </label>
        <select
          id={`${uid}-status`}
          className={select}
          value={filters.status}
          onChange={(e) => set({ status: e.target.value as StatusFilter })}
        >
          <option value="any">Any status</option>
          <option value="open">Open only</option>
          <option value="resolved">Resolved only</option>
          {STATUS_OPTIONS.filter((s) => s !== "open").map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <label htmlFor={`${uid}-scope`} className="sr-only">
          Scope
        </label>
        <select
          id={`${uid}-scope`}
          className={select}
          value={filters.scope}
          onChange={(e) => set({ scope: e.target.value as ScopeFilter })}
        >
          <option value="all">All scopes</option>
          <option value="node">Component</option>
          <option value="edge">Data flow</option>
          <option value="path">Path</option>
          <option value="model">Model-wide</option>
          <option value="custom">Custom</option>
        </select>
        <label htmlFor={`${uid}-group`} className="sr-only">
          Group by
        </label>
        <select
          id={`${uid}-group`}
          className={select}
          value={groupBy}
          onChange={(e) => onGroupBy(e.target.value as GroupBy)}
        >
          <option value="component">Group: component</option>
          <option value="rule">Group: rule</option>
          <option value="layer">Group: MAESTRO layer</option>
          <option value="severity">Group: severity</option>
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-[11px]">
        <label className="inline-flex items-center gap-1">
          <input
            type="checkbox"
            className="h-3.5 w-3.5 accent-primary"
            checked={filters.showInherited}
            onChange={(e) => set({ showInherited: e.target.checked })}
          />
          Show inherited
        </label>
        <label className="inline-flex items-center gap-1">
          <input
            type="checkbox"
            className="h-3.5 w-3.5 accent-primary"
            checked={filters.showResolved}
            onChange={(e) => set({ showResolved: e.target.checked })}
          />
          Show resolved
        </label>
        {!isDefaultFilters(filters) && (
          <button
            type="button"
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="ml-auto inline-flex items-center gap-0.5 font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          >
            <X className="h-3 w-3" aria-hidden />
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}

export default ThreatFilters;

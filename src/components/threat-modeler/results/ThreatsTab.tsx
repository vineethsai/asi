/**
 * Threats tab (P3-34): visible filters, grouping (component / rule / MAESTRO
 * layer / severity), inherited threats collapsed under their source, bulk
 * status changes, "Jump to critical", the change strip and suppressions.
 */
import { useCallback, useEffect, useMemo, useRef } from "react";
import { ChevronDown, ChevronRight, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { compareThreats, type AnalysisResult } from "../engine/analyze";
import { getRule } from "../engine/catalog";
import { SEVERITY_ORDER } from "../engine/severity";
import { threatResolution, tm, useTM } from "../store";
import { useCanvasActions } from "../hooks/useCanvasActions";
import { MAESTRO_LAYER_NAMES, type GeneratedThreat, type Severity } from "../types";
import { BulkBar } from "./BulkBar";
import { ChangeStrip } from "./ChangeStrip";
import { SuppressedList } from "./SuppressedList";
import { ThreatCard } from "./ThreatCard";
import { ThreatFilters } from "./ThreatFilters";
import {
  DEFAULT_FILTERS,
  matchesFilters,
  threatDomId,
  useNodeLabels,
  useReadOnly,
  useUnverifiedEdges,
  type GroupBy,
  type ThreatsView,
} from "./helpers";
import { SevChip } from "./shared";

interface Group {
  key: string;
  label: string;
  top: GeneratedThreat[];
  total: number;
  open: number;
  resolved: number;
  worst: Severity;
  order: number;
}

const toggleIn = (set: Set<string>, id: string, on?: boolean) => {
  const next = new Set(set);
  if (on ?? !next.has(id)) next.add(id);
  else next.delete(id);
  return next;
};

function groupKey(
  t: GeneratedThreat,
  by: GroupBy,
  labels: Map<string, string>,
): [string, string, number] {
  switch (by) {
    case "rule": {
      const id = t.ruleId ?? t.id;
      return [id, `${id} · ${getRule(id)?.title ?? t.name}`, 0];
    }
    case "layer":
      return t.maestroLayer !== undefined
        ? [
            `L${t.maestroLayer}`,
            `L${t.maestroLayer} · ${MAESTRO_LAYER_NAMES[t.maestroLayer]}`,
            t.maestroLayer,
          ]
        : ["none", "No MAESTRO layer", 99];
    case "severity":
      return [
        t.severity,
        t.severity[0].toUpperCase() + t.severity.slice(1),
        5 - SEVERITY_ORDER[t.severity],
      ];
    default: {
      if (t.scope === "model" && !t.focusNodeId) return ["model", "Model-wide", -1];
      const id = t.focusNodeId ?? t.affectedNodeIds[0];
      return id ? [id, labels.get(id) ?? id, 0] : ["model", "Model-wide", -1];
    }
  }
}

export function ThreatsTab({ analysis, view }: { analysis: AnalysisResult; view: ThreatsView }) {
  const labels = useNodeLabels();
  const unverified = useUnverifiedEdges();
  const readOnly = useReadOnly();
  const selectedThreatId = useTM((s) => s.ui.selectedThreatId);
  const actions = useCanvasActions();
  const { filters, groupBy, expanded, checked, collapsed, inheritedOpen } = view;

  const byId = useMemo(() => new Map(analysis.threats.map((t) => [t.id, t])), [analysis]);

  const { groups, childrenOf, visible, counts } = useMemo(() => {
    const counts: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const t of analysis.threats)
      if (threatResolution(t) === "open" && !t.inherited) counts[t.severity] += 1;
    const visible = analysis.threats.filter((t) => matchesFilters(t, filters, labels));
    const visibleIds = new Set(visible.map((t) => t.id));
    const childrenOf = new Map<string, GeneratedThreat[]>();
    const top: GeneratedThreat[] = [];
    for (const t of visible) {
      if (t.inherited && t.inheritedFrom && visibleIds.has(t.inheritedFrom)) {
        const list = childrenOf.get(t.inheritedFrom) ?? [];
        list.push(t);
        childrenOf.set(t.inheritedFrom, list);
      } else top.push(t);
    }
    for (const list of childrenOf.values()) list.sort(compareThreats);
    const map = new Map<string, Group>();
    for (const t of top) {
      const [key, label, order] = groupKey(t, groupBy, labels);
      let g = map.get(key);
      if (!g) {
        g = { key, label, top: [], total: 0, open: 0, resolved: 0, worst: "low", order };
        map.set(key, g);
      }
      g.top.push(t);
      for (const x of [t, ...(childrenOf.get(t.id) ?? [])]) {
        g.total += 1;
        if (threatResolution(x) === "open") {
          g.open += 1;
          if (SEVERITY_ORDER[x.severity] > SEVERITY_ORDER[g.worst]) g.worst = x.severity;
        } else g.resolved += 1;
      }
    }
    const groups = [...map.values()];
    for (const g of groups) g.top.sort(compareThreats);
    groups.sort((a, b) =>
      groupBy === "layer" || groupBy === "severity"
        ? a.order - b.order
        : a.order - b.order ||
          (b.open > 0 ? 1 : 0) - (a.open > 0 ? 1 : 0) ||
          SEVERITY_ORDER[b.worst] - SEVERITY_ORDER[a.worst] ||
          b.open - a.open ||
          a.label.localeCompare(b.label),
    );
    return { groups, childrenOf, visible, counts };
  }, [analysis, filters, groupBy, labels]);

  const { setExpanded, setChecked, setInheritedOpen, setCollapsed, setFilters } = view;
  const onToggle = useCallback((id: string) => setExpanded((s) => toggleIn(s, id)), [setExpanded]);
  const onChecked = useCallback(
    (id: string, on: boolean) => setChecked((s) => toggleIn(s, id, on)),
    [setChecked],
  );
  const onToggleInherited = useCallback(
    (id: string) => setInheritedOpen((s) => toggleIn(s, id)),
    [setInheritedOpen],
  );
  // Selections made from a card itself: locate, but don't re-expand or scroll.
  const internalPick = useRef<string | null>(null);
  const onFocusThreat = useCallback(
    (t: GeneratedThreat) => {
      internalPick.current = t.id;
      tm().setUi({ selectedThreatId: t.id });
      if (t.affectedNodeIds.length) actions.locate(t.affectedNodeIds);
    },
    [actions],
  );

  // Reveal a threat selected elsewhere (Jump to critical, change strip, canvas, `?threat=`):
  // clear hiding filters, expand it, open its group / source, scroll it into view.
  useEffect(() => {
    if (!selectedThreatId) return;
    if (internalPick.current === selectedThreatId) {
      internalPick.current = null;
      return;
    }
    internalPick.current = null;
    const t = byId.get(selectedThreatId);
    if (!t) return;
    const filtersNow = matchesFilters(t, filters, labels) ? filters : DEFAULT_FILTERS;
    if (filtersNow !== filters) setFilters(DEFAULT_FILTERS);
    setExpanded((s) => toggleIn(s, t.id, true));
    const src = t.inherited && t.inheritedFrom ? byId.get(t.inheritedFrom) : undefined;
    const nested = !!src && matchesFilters(src, filtersNow, labels);
    if (nested) setInheritedOpen((s) => toggleIn(s, src.id, true));
    const [key] = groupKey(nested ? src : t, groupBy, labels);
    setCollapsed((s) => toggleIn(s, key, false));
    const timer = window.setTimeout(() => {
      document
        .getElementById(threatDomId(t.id))
        ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, 60);
    return () => window.clearTimeout(timer);
    // Only when the selection (or the analysis) changes — not on every filter edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedThreatId, byId]);

  const firstCritical = useMemo(() => {
    for (const g of groups)
      for (const t of g.top) {
        if (t.severity === "critical" && threatResolution(t) === "open") return t;
        const c = (childrenOf.get(t.id) ?? []).find(
          (x) => x.severity === "critical" && threatResolution(x) === "open",
        );
        if (c) return c;
      }
    return analysis.threats.find(
      (t) => t.severity === "critical" && threatResolution(t) === "open",
    );
  }, [groups, childrenOf, analysis]);

  const checkedThreats = useMemo(
    () => analysis.threats.filter((t) => checked.has(t.id)),
    [analysis, checked],
  );
  const allVisibleChecked = visible.length > 0 && visible.every((t) => checked.has(t.id));

  const renderCard = (t: GeneratedThreat, nested = false) => {
    const kids = nested ? [] : (childrenOf.get(t.id) ?? []);
    return (
      <ThreatCard
        key={t.id}
        threat={t}
        nested={nested}
        expanded={expanded.has(t.id)}
        onToggle={onToggle}
        checked={checked.has(t.id)}
        onCheckedChange={onChecked}
        highlighted={selectedThreatId === t.id}
        labels={labels}
        unverified={unverified}
        readOnly={readOnly}
        onFocusThreat={onFocusThreat}
        inheritedCount={kids.length}
        inheritedOpen={inheritedOpen.has(t.id)}
        onToggleInherited={onToggleInherited}
        inheritedSlot={kids.length ? kids.map((c) => renderCard(c, true)) : undefined}
      />
    );
  };

  return (
    <div className="space-y-2">
      <ChangeStrip
        change={analysis.changeSummary}
        threatsById={byId}
        labels={labels}
        onSelect={(id) => tm().setUi({ selectedThreatId: id })}
      />
      <ThreatFilters
        filters={filters}
        onChange={(f) => view.setFilters(f)}
        groupBy={groupBy}
        onGroupBy={(g) => view.setGroupBy(g)}
        counts={counts}
      />
      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        <label className="inline-flex items-center gap-1">
          <input
            type="checkbox"
            className="h-3.5 w-3.5 accent-primary"
            checked={allVisibleChecked}
            disabled={!visible.length}
            onChange={(e) =>
              view.setChecked(e.target.checked ? new Set(visible.map((t) => t.id)) : new Set())
            }
          />
          Select all {visible.length} shown
        </label>
        <span className="text-muted-foreground">
          {visible.length} of {analysis.threats.length}
        </span>
        <span className="ml-auto flex items-center gap-1">
          {firstCritical && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() =>
                selectedThreatId === firstCritical.id
                  ? document
                      .getElementById(threatDomId(firstCritical.id))
                      ?.scrollIntoView({ block: "nearest", behavior: "smooth" })
                  : tm().setUi({ selectedThreatId: firstCritical.id })
              }
            >
              <Flame className="h-3.5 w-3.5" aria-hidden />
              Jump to critical
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() =>
              view.setCollapsed(collapsed.size ? new Set() : new Set(groups.map((g) => g.key)))
            }
          >
            {collapsed.size ? "Expand groups" : "Collapse groups"}
          </Button>
        </span>
      </div>
      <BulkBar
        selected={checkedThreats}
        onClear={() => view.setChecked(new Set())}
        readOnly={readOnly}
      />

      {groups.length === 0 ? (
        <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
          No threats match these filters.{" "}
          <button
            type="button"
            className="font-medium text-primary hover:underline"
            onClick={() => view.setFilters(DEFAULT_FILTERS)}
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {groups.map((g) => {
            const isOpen = !collapsed.has(g.key);
            const gid = `tm-group-${threatDomId(g.key)}`;
            return (
              <section key={g.key} aria-labelledby={`${gid}-h`} className="space-y-1.5">
                <h3
                  id={`${gid}-h`}
                  className="sticky top-0 z-[1] -mx-1 bg-background/95 px-1 py-0.5 backdrop-blur"
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={gid}
                    onClick={() => view.setCollapsed((s) => toggleIn(s, g.key))}
                    className="flex w-full items-center gap-1.5 rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {isOpen ? (
                      <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                    )}
                    <span className="min-w-0 flex-1 truncate text-xs font-semibold">{g.label}</span>
                    {g.open > 0 && groupBy !== "severity" && <SevChip band={g.worst} />}
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {g.open} open
                      {g.resolved > 0 && (
                        <>
                          {" · "}
                          <s aria-label={`${g.resolved} resolved`}>{g.resolved}</s> resolved
                        </>
                      )}
                    </span>
                  </button>
                </h3>
                <div id={gid} hidden={!isOpen} className="space-y-1.5">
                  {isOpen && g.top.map((t) => renderCard(t))}
                </div>
              </section>
            );
          })}
        </div>
      )}
      <SuppressedList labels={labels} readOnly={readOnly} />
    </div>
  );
}

export default ThreatsTab;

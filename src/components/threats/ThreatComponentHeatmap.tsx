/**
 * Threat × Component heatmap (IMPROVEMENT_PLAN §6.3 / §9): rows = the threats passed in (already
 * filtered and sorted by the page), columns = the 40 component nodes grouped under KC1–KC6
 * (collapsible). Cell fill and dot size follow the threat's risk band; the number is the risk
 * score, so colour is never the only cue. Click / Enter on a cell opens the threat's Components
 * tab; the row header opens the threat.
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Threat } from "@/components/components/securityData";
import { ChartLegend } from "@/components/charts/ChartFrame";
import {
  Heatmap,
  type HeatmapCell,
  type HeatmapColumn,
  type HeatmapGroup,
  type HeatmapRow,
} from "@/components/charts/Heatmap";
import { KC, KC_LIST, KC_ORDER, type KcId } from "@/data/kc";
import { BANDS, maxBand, severityColor, severityLabel, type SeverityBand } from "@/lib/severity";
import { COMPONENT_ENTRIES, componentEntry } from "@/components/kc-components/componentIndex";
import { threatBand, threatLabel } from "./threatIndex";

export interface ThreatComponentHeatmapProps {
  threats: readonly Threat[];
  /** When set, the other KC groups start collapsed. */
  focusKc?: KcId | null;
  className?: string;
}

const COLUMNS: HeatmapColumn[] = COMPONENT_ENTRIES.map((e) => ({
  id: e.id,
  label: e.depth === 0 ? `${e.code} ${e.title} (whole component)` : `${e.code} ${e.title}`,
  short: e.code,
  group: e.kc,
  href: `/components/${e.id}`,
}));

const GROUPS: HeatmapGroup[] = KC_LIST.map((k) => ({
  id: k.id,
  label: k.code,
  color: k.color,
}));

const GROUP_SIZE: Record<string, number> = Object.fromEntries(
  KC_ORDER.map((id) => [id, COMPONENT_ENTRIES.filter((e) => e.kc === id).length]),
);

export function ThreatComponentHeatmap({
  threats,
  focusKc,
  className,
}: ThreatComponentHeatmapProps) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState<string[]>(() =>
    focusKc ? KC_ORDER.filter((k) => k !== focusKc) : [],
  );
  useEffect(() => {
    setCollapsed(focusKc ? KC_ORDER.filter((k) => k !== focusKc) : []);
  }, [focusKc]);

  const byThreat = useMemo(() => new Map(threats.map((t) => [t.id, t])), [threats]);

  const rows: HeatmapRow[] = useMemo(
    () =>
      threats.map((t) => ({
        id: t.id,
        label: `${t.code} ${threatLabel(t)}`,
        sublabel:
          typeof t.riskScore === "number"
            ? `Risk ${t.riskScore}/10 · ${severityLabel(threatBand(t))}`
            : severityLabel(threatBand(t)),
        href: `/threats/${t.id}`,
      })),
    [threats],
  );

  const cells = useMemo(
    () =>
      (rowId: string, colId: string): HeatmapCell | undefined => {
        const t = byThreat.get(rowId);
        const entry = componentEntry(colId);
        if (!t || !entry || !entry.threatIds.includes(t.id)) return undefined;
        const score = typeof t.riskScore === "number" ? t.riskScore : undefined;
        return {
          band: threatBand(t),
          value: score,
          glyph: score !== undefined ? score / 10 : 0.5,
          text: entry.inherited ? "" : score !== undefined ? String(score) : "",
          label: entry.inherited
            ? `inherited from ${entry.inheritedFrom?.toUpperCase()} (no sub-component mapping in the source)`
            : "mapped in the source",
        };
      },
    [byThreat],
  );

  const aggregate = (members: HeatmapCell[], _row: HeatmapRow, group: HeatmapGroup) => {
    if (!members.length) return {};
    const size = GROUP_SIZE[group.id] ?? members.length;
    return {
      band: maxBand(members.map((m) => m.band ?? "none")),
      value: members.length,
      glyph: members.length / size,
      text: String(members.length),
      label: `affects ${members.length} of ${size} ${KC[group.id as KcId]?.code ?? group.label} components`,
    } satisfies HeatmapCell;
  };

  const presentBands = useMemo(() => {
    const set = new Set<SeverityBand>(threats.map(threatBand));
    return BANDS.filter((b) => set.has(b));
  }, [threats]);

  const legend = (
    <div className="space-y-1.5">
      <ChartLegend
        items={presentBands.map((b) => ({
          id: b,
          label: `${severityLabel(b)} risk`,
          color: severityColor(b),
          shape: "circle" as const,
        }))}
      />
      <p className="text-xs text-muted-foreground">
        Number = the threat&apos;s risk score (1–10); the dot grows with risk. A dot without a
        number is inherited from the parent KC (the source maps those threats to the KC as a whole).
        A collapsed KC column shows how many of its components the threat affects.
      </p>
    </div>
  );

  return (
    <Heatmap
      className={className}
      title="Threat × component heatmap"
      description={`${rows.length} threat${rows.length === 1 ? "" : "s"} × ${COLUMNS.length} component nodes, grouped by key component. Use the KC headers to collapse a group; arrow keys move between cells, Enter opens the threat.`}
      ariaLabel={`Heatmap of ${rows.length} threats against ${COLUMNS.length} agent component nodes; cell colour and number give the threat's risk score.`}
      rows={rows}
      columns={COLUMNS}
      groups={GROUPS}
      cells={cells}
      aggregate={aggregate}
      collapsedGroups={collapsed}
      onCollapsedGroupsChange={setCollapsed}
      onCellClick={(row) => navigate(`/threats/${row.id}?tab=components`)}
      onRowHeaderClick={(row) => navigate(`/threats/${row.id}`)}
      rowHeaderLabel="Threat"
      showTotals
      totalLabel="Total"
      maxHeight="72vh"
      legend={legend}
      renderTooltip={(row, column, cell) => {
        const entry = componentEntry(column.id);
        return (
          <div className="max-w-[16rem] space-y-0.5">
            <p className="font-medium">{row.label}</p>
            <p className="text-muted-foreground">
              {entry ? `${entry.code} · ${entry.title}` : column.label}
            </p>
            {cell?.band ? (
              <>
                <p>
                  {severityLabel(cell.band)}
                  {cell.value !== undefined ? ` · risk ${cell.value}/10` : ""}
                </p>
                {cell.label && <p className="text-muted-foreground">{cell.label}</p>}
                <p className="text-muted-foreground">Enter / click: open the Components tab</p>
              </>
            ) : (
              <p className="text-muted-foreground">Not mapped</p>
            )}
          </div>
        );
      }}
    />
  );
}

export default ThreatComponentHeatmap;

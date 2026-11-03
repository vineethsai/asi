/**
 * ComponentHierarchy — the six key components (KC1–KC6) and their sub-components as a zoomable
 * sunburst (treemap toggle built in). Arc area follows threat count: each KC's arc equals its
 * distinct threats, split among its sub-components in proportion to their own (or inherited)
 * threat counts. Labels and tooltips always print the node's real threat count.
 */
import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sunburst, type HierarchyDatum } from "@/components/charts/Sunburst";
import { SeverityBadge } from "@/components/content/SeverityBadge";
import { threatsData } from "@/components/components/securityData";
import { KC, type KcId } from "@/data/kc";
import { threatBand } from "@/components/threats/threatIndex";
import {
  COMPONENT_ENTRIES,
  componentEntry,
  threatIdsInKc,
  type ComponentEntry,
} from "./componentIndex";

const MAX_CHIPS = 8;

function realThreatIds(id: string): string[] {
  if (id === "root") return [...new Set(COMPONENT_ENTRIES.flatMap((e) => e.threatIds))];
  const e = componentEntry(id);
  if (!e) return [];
  return e.depth === 0 ? threatIdsInKc(e.kc) : e.threatIds;
}

function build(entry: ComponentEntry, value: number): HierarchyDatum {
  const kids = entry.childIds.map((c) => componentEntry(c)).filter(Boolean) as ComponentEntry[];
  const base: HierarchyDatum = {
    id: entry.id,
    name: `${entry.code} ${entry.title}`,
    href: `/components/${entry.id}`,
  };
  if (!kids.length) return { ...base, value };
  const weights = kids.map((k) => Math.max(0, k.threatIds.length));
  const sum = weights.reduce((n, w) => n + w, 0);
  return {
    ...base,
    children: kids.map((k, i) =>
      build(k, sum > 0 ? (value * weights[i]) / sum : value / kids.length),
    ),
  };
}

export interface ComponentHierarchyProps {
  /** KCs to show (canonical order); defaults to all six. */
  kcs?: readonly KcId[];
  className?: string;
}

export function ComponentHierarchy({ kcs, className }: ComponentHierarchyProps) {
  const navigate = useNavigate();
  const data = useMemo<HierarchyDatum>(() => {
    const roots = COMPONENT_ENTRIES.filter((e) => e.depth === 0 && (!kcs || kcs.includes(e.kc)));
    return {
      id: "root",
      name: "Key components",
      children: roots.map((r) => ({
        ...build(r, Math.max(1, threatIdsInKc(r.kc).length)),
        color: KC[r.kc].color,
      })),
    };
  }, [kcs]);

  return (
    <Sunburst
      className={className}
      data={data}
      title="Component hierarchy"
      description="Rings: key components, then their sub-components; area follows the number of threats. Select a ring to zoom in, a leaf to open it."
      ariaLabel={`Sunburst of ${data.children?.length ?? 0} key components and their sub-components, sized by threat count.`}
      valueLabel="threats"
      formatValue={(d) => {
        const n = realThreatIds(d.id).length;
        const inherited = componentEntry(d.id)?.inherited;
        return `${n} threat${n === 1 ? "" : "s"}${inherited ? " (inherited)" : ""}`;
      }}
      renderTooltip={(d) => {
        const ids = realThreatIds(d.id);
        const e = componentEntry(d.id);
        return (
          <div className="max-w-xs space-y-1.5">
            <p className="font-medium">{d.name}</p>
            <p className="text-xs text-muted-foreground">
              {ids.length} threat{ids.length === 1 ? "" : "s"}
              {e?.inherited ? ` inherited from ${e.inheritedFrom?.toUpperCase()}` : ""}
            </p>
            {ids.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {ids.slice(0, MAX_CHIPS).map((id) => {
                  const t = threatsData[id];
                  return t ? (
                    <SeverityBadge key={id} band={threatBand(t)} label={t.code} size="xs" />
                  ) : null;
                })}
                {ids.length > MAX_CHIPS && (
                  <span className="text-xs text-muted-foreground">+{ids.length - MAX_CHIPS}</span>
                )}
              </div>
            )}
          </div>
        );
      }}
      onNavigate={(d) => {
        if (d.id !== "root") navigate(`/components/${d.id}`);
      }}
      legend={
        <p className="text-xs text-muted-foreground">
          Every threat is also listed on its{" "}
          <Link
            to="/threats?view=heatmap"
            className="underline underline-offset-2 hover:text-foreground"
          >
            threat × component heatmap
          </Link>
          .
        </p>
      }
    />
  );
}

export default ComponentHierarchy;

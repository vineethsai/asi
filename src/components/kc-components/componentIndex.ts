/**
 * Flat index of the 40 component nodes (KC1–KC6 and their sub-components) with the threats mapped
 * to each, used by the Components list, ComponentDetail, the Threat × Component heatmap and the
 * hierarchy sunburst.
 *
 * Mapping rules (all from data, nothing hand-entered):
 * - direct threats = the node's `threatIds` in frameworkData, plus — for a top-level KC — every
 *   threat whose `componentIds` lists that KC (threatsData). The two sources mostly agree; the
 *   union keeps both.
 * - a sub-component without its own mapping inherits the nearest ancestor's threats and is flagged
 *   `inherited` (e.g. KC4.1–KC4.6: the source guide maps threats to KC4 as a whole).
 *
 * Order is canonical: KC1 → KC6 (src/data/kc.ts), then depth-first in source order.
 */
import { frameworkData, type ComponentNode } from "@/components/components/frameworkData";
import { threatsData, type Threat } from "@/components/components/securityData";
import { KC, KC_ORDER, kcId as toKcId, type KcEntry, type KcId } from "@/data/kc";
import { compareThreatCodes } from "@/components/threats/threatIndex";

export interface ComponentEntry {
  /** Dotted id, e.g. "kc6.1.1". */
  id: string;
  /** Upper-case code, e.g. "KC6.1.1". */
  code: string;
  title: string;
  description: string;
  kc: KcId;
  /** 0 = the KC itself, 1 = sub-component, 2 = sub-sub-component. */
  depth: number;
  parentId?: string;
  childIds: string[];
  /** Threats mapped to this node in the source data. */
  directThreatIds: string[];
  /** Effective threats: direct, or inherited from the nearest mapped ancestor. */
  threatIds: string[];
  inherited: boolean;
  /** Ancestor whose mapping was inherited. */
  inheritedFrom?: string;
}

const normalize = (id: string) => id.replace(/-/g, ".").toLowerCase();
const byThreatCode = (a: string, b: string) =>
  compareThreatCodes(
    threatsData[a] ?? ({ code: a } as Threat),
    threatsData[b] ?? ({ code: b } as Threat),
  );

function buildIndex(): ComponentEntry[] {
  const out: ComponentEntry[] = [];
  const roots = [...frameworkData].sort(
    (a, b) => KC_ORDER.indexOf(toKcId(a.id) as KcId) - KC_ORDER.indexOf(toKcId(b.id) as KcId),
  );
  const visit = (node: ComponentNode, depth: number, parent?: ComponentEntry) => {
    const id = normalize(node.id);
    const kc = (toKcId(id) ?? "kc1") as KcId;
    const direct = new Set(node.threatIds ?? []);
    if (depth === 0) {
      for (const t of Object.values(threatsData)) {
        if (t.componentIds.some((c) => normalize(c) === id)) direct.add(t.id);
      }
    }
    const directIds = [...direct].filter((t) => t in threatsData).sort(byThreatCode);
    const inherited = directIds.length === 0 && !!parent && parent.threatIds.length > 0;
    const entry: ComponentEntry = {
      id,
      code: id.toUpperCase(),
      title: depth === 0 ? (KC[kc]?.name ?? node.title) : node.title,
      description: node.description ?? "",
      kc,
      depth,
      parentId: parent?.id,
      childIds: (node.children ?? []).map((c) => normalize(c.id)),
      directThreatIds: directIds,
      threatIds: inherited ? [...(parent?.threatIds ?? [])] : directIds,
      inherited,
      inheritedFrom: inherited ? (parent?.inheritedFrom ?? parent?.id) : undefined,
    };
    out.push(entry);
    for (const child of node.children ?? []) visit(child, depth + 1, entry);
  };
  for (const root of roots) visit(root, 0);
  return out;
}

/** All component nodes in canonical order. */
export const COMPONENT_ENTRIES: readonly ComponentEntry[] = buildIndex();

const byId = new Map(COMPONENT_ENTRIES.map((e) => [e.id, e]));

/** Look up a node by id ("kc6.1.1", "KC6-1-1"). */
export function componentEntry(id: string | null | undefined): ComponentEntry | undefined {
  return id ? byId.get(normalize(id)) : undefined;
}

/** The KC entry (official name, colour) for any node id. */
export function kcOf(id: string): KcEntry | undefined {
  const kc = toKcId(id);
  return kc ? KC[kc] : undefined;
}

/** Threat objects (catalog order) for a node, using the effective mapping. */
export function threatsForComponent(id: string): Threat[] {
  return (componentEntry(id)?.threatIds ?? []).map((t) => threatsData[t]).filter(Boolean);
}

/** Nodes (canonical order) whose effective mapping includes the threat. */
export function componentsForThreat(threatId: string): ComponentEntry[] {
  return COMPONENT_ENTRIES.filter((e) => e.threatIds.includes(threatId));
}

/** Every node under (and including) a KC. */
export function entriesInKc(kc: KcId): ComponentEntry[] {
  return COMPONENT_ENTRIES.filter((e) => e.kc === kc);
}

/** Distinct threats across a KC and all its descendants. */
export function threatIdsInKc(kc: KcId): string[] {
  return [...new Set(entriesInKc(kc).flatMap((e) => e.threatIds))].sort(byThreatCode);
}

/** Every descendant (any depth) of a node, excluding the node itself. */
export function descendantsOf(id: string): ComponentEntry[] {
  const root = componentEntry(id);
  if (!root) return [];
  const res: ComponentEntry[] = [];
  const walk = (e: ComponentEntry) => {
    for (const c of e.childIds) {
      const child = byId.get(c);
      if (child) {
        res.push(child);
        walk(child);
      }
    }
  };
  walk(root);
  return res;
}

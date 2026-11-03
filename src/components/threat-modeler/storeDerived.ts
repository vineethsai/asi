import type { ThreatModelDocument } from "./document";
import { isThreatClosed, type AnalysisResult } from "./engine/analyze";
import { modelFingerprint } from "./engine/graph";
import { severityFromScore, SEVERITY_ORDER } from "./engine/severity";
import type { Prefs } from "./persistence";
import type { EdgeThreatSummary, NodeThreatSummary, UiState } from "./storeTypes";
import type { GeneratedThreat, Severity } from "./types";

/** Pure helpers behind the Threat Modeler store (exported for components and tests). */

export const MAX_HISTORY = 50;
export const COALESCE_MS = 1000;

// ─── Derived helpers (exported for components and tests) ────────

const fpCache = new WeakMap<object, { edges: unknown; extra: unknown; fp: string }>();

/** Structural fingerprint of everything the engine reads (not positions/selection). */
export function documentFingerprint(doc: ThreatModelDocument): string {
  const hit = fpCache.get(doc.nodes);
  const extra = doc.suppressedRules;
  if (hit && hit.edges === doc.edges && hit.extra === extra) return hit.fp;
  const fp = modelFingerprint(doc.nodes, doc.edges, {
    s: doc.suppressedRules,
    c: doc.customComponents.map((c) => [c.id, c.customThreats?.map((t) => t.id)]),
  });
  fpCache.set(doc.nodes, { edges: doc.edges, extra, fp });
  return fp;
}

export type Resolution = "open" | "resolved";

export function threatResolution(t: GeneratedThreat): Resolution {
  if (isThreatClosed(t) || t.status === "accepted" || t.status === "transferred") return "resolved";
  return "open";
}

const SEV_TEXT: Severity[] = ["critical", "high", "medium", "low"];

export function deriveThreatMaps(analysis: AnalysisResult | null): {
  nodeThreats: Record<string, NodeThreatSummary>;
  edgeThreats: Record<string, EdgeThreatSummary>;
} {
  if (!analysis) return { nodeThreats: {}, edgeThreats: {} };
  type Acc = {
    total: number;
    open: number;
    resolved: number;
    inherited: number;
    maxResidual: number;
    sev: Record<Severity, number>;
  };
  const nodes = new Map<string, Acc>();
  const edges = new Map<string, Acc>();
  const acc = (m: Map<string, Acc>, id: string) => {
    let a = m.get(id);
    if (!a) {
      a = {
        total: 0,
        open: 0,
        resolved: 0,
        inherited: 0,
        maxResidual: 0,
        sev: { critical: 0, high: 0, medium: 0, low: 0 },
      };
      m.set(id, a);
    }
    return a;
  };
  for (const t of analysis.threats) {
    const open = threatResolution(t) === "open";
    const residual = t.residualScore ?? t.score ?? 0;
    const apply = (a: Acc) => {
      a.total += 1;
      if (t.inherited) a.inherited += 1;
      if (open) {
        a.open += 1;
        a.maxResidual = Math.max(a.maxResidual, residual);
        a.sev[severityFromScore(residual)] += 1;
      } else a.resolved += 1;
    };
    for (const id of new Set(t.affectedNodeIds)) apply(acc(nodes, id));
    for (const id of new Set(t.affectedEdgeIds)) apply(acc(edges, id));
  }
  const componentResidual = new Map(
    (analysis.modelScore?.components ?? []).map((c) => [c.nodeId, c.residual]),
  );
  const nodeThreats: Record<string, NodeThreatSummary> = {};
  let order = 0;
  for (const [id, a] of nodes) {
    const parts = SEV_TEXT.filter((s) => a.sev[s] > 0).map((s) => `${a.sev[s]} ${s}`);
    const comp = componentResidual.get(id);
    nodeThreats[id] = {
      total: a.total,
      open: a.open,
      resolved: a.resolved,
      inherited: a.inherited,
      band: a.open > 0 ? severityFromScore(a.maxResidual) : null,
      intensity: a.open > 0 ? Math.min(1, (comp ?? (a.maxResidual / 25) * 100) / 100) : 0,
      order: order++,
      text:
        `${a.open} open threat${a.open === 1 ? "" : "s"}` +
        (parts.length ? ` (${parts.join(", ")})` : "") +
        (a.resolved ? `; ${a.resolved} resolved` : "") +
        (a.inherited ? `; ${a.inherited} inherited` : ""),
    };
  }
  const pathWeight = new Map<string, number>();
  for (const p of analysis.paths?.paths ?? [])
    for (const e of p.edges)
      pathWeight.set(e, Math.max(pathWeight.get(e) ?? 0, (p.residualScore ?? p.score) / 25));
  const edgeThreats: Record<string, EdgeThreatSummary> = {};
  for (const [id, a] of edges)
    edgeThreats[id] = {
      total: a.total,
      open: a.open,
      band: a.open > 0 ? severityFromScore(a.maxResidual) : null,
      pathWeight: pathWeight.get(id) ?? 0,
    };
  for (const [id, w] of pathWeight)
    if (!edgeThreats[id]) edgeThreats[id] = { total: 0, open: 0, band: null, pathWeight: w };
  return { nodeThreats, edgeThreats };
}

/** Highest severity first. */
export function bySeverity(a: Severity, b: Severity): number {
  return SEVERITY_ORDER[b] - SEVERITY_ORDER[a];
}

export function stripSelection(doc: ThreatModelDocument): ThreatModelDocument {
  if (!doc.nodes.some((n) => n.selected) && !doc.edges.some((e) => e.selected)) return doc;
  return {
    ...doc,
    nodes: doc.nodes.map((n) => (n.selected ? { ...n, selected: false } : n)),
    edges: doc.edges.map((e) => (e.selected ? { ...e, selected: false } : e)),
  };
}

export function defaultUi(prefs: Prefs): UiState {
  return {
    selectedNodeId: null,
    selectedEdgeId: null,
    selectedThreatId: null,
    paletteMode: prefs.paletteMode ?? "open",
    resultsOpen: prefs.resultsOpen ?? true,
    resultsWidth: prefs.resultsWidth ?? 380,
    resultsTab: "threats",
    sheet: null,
    flowAnimation: prefs.flowAnimation ?? false,
    snapToGrid: false,
    legendOpen: prefs.legendOpen ?? true,
    connectFrom: null,
    dropTargetId: null,
    whatIf: { active: false, result: null },
    playback: null,
    highlight: null,
    sweepKey: 0,
    dialog: null,
  };
}

export const PREF_KEYS: (keyof UiState & keyof Prefs)[] = [
  "paletteMode",
  "resultsOpen",
  "resultsWidth",
  "legendOpen",
  "flowAnimation",
];

export function wait(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

export function prefersReduced(): boolean {
  try {
    return !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

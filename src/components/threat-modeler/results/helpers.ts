/**
 * Non-component helpers for the results panel (kept out of .tsx files so
 * React Fast Refresh keeps working): status vocabulary, filters, confidence,
 * DOM ids and the label hooks that avoid re-rendering on every drag frame.
 */
import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import type { AnalysisResult } from "../engine/analyze";
import { threatResolution, tm, useTM } from "../store";
import type { CanvasEdge, CanvasNode, GeneratedThreat, Severity, ThreatStatus } from "../types";

export const SEVERITIES: Severity[] = ["critical", "high", "medium", "low"];

export const STATUS_LABELS: Record<ThreatStatus, string> = {
  open: "Open",
  mitigated: "Mitigated",
  accepted: "Accepted risk",
  transferred: "Transferred",
  "false-positive": "False positive",
};

export const STATUS_OPTIONS: ThreatStatus[] = [
  "open",
  "mitigated",
  "accepted",
  "transferred",
  "false-positive",
];

export function statusOf(t: GeneratedThreat): ThreatStatus {
  if (t.status) return t.status;
  return t.mitigationState === "mitigated" ? "mitigated" : "open";
}

/** Stable DOM id for a threat card (threat ids contain ":" and ">"). */
export function threatDomId(id: string): string {
  return `tm-threat-${id.replace(/[^a-zA-Z0-9_-]/g, (c) => `_${c.charCodeAt(0).toString(16)}`)}`;
}

// ─── Labels without per-frame re-renders ────────────────────────

const labelKeyCache = new WeakMap<CanvasNode[], string>();
function nodeLabelKey(nodes: CanvasNode[]): string {
  let k = labelKeyCache.get(nodes);
  if (k === undefined) {
    k = nodes.map((n) => `${n.id}\u0001${n.data?.label ?? ""}`).join("\u0002");
    labelKeyCache.set(nodes, k);
  }
  return k;
}

/** Node id → label; re-computes only when a label (or the node set) changes, not on drags. */
export function useNodeLabels(): Map<string, string> {
  const key = useTM((s) => nodeLabelKey(s.document.nodes));
  return useMemo(() => {
    void key;
    return new Map(tm().document.nodes.map((n) => [n.id, n.data?.label || n.id]));
  }, [key]);
}

const unverifiedCache = new WeakMap<CanvasEdge[], string>();
function unverifiedKey(edges: CanvasEdge[]): string {
  let k = unverifiedCache.get(edges);
  if (k === undefined) {
    k = edges
      .filter((e) => e.data?.customMetadata?.postureUnverified === "true")
      .map((e) => e.id)
      .join(",");
    unverifiedCache.set(edges, k);
  }
  return k;
}

/** Ids of imported edges whose posture was never confirmed. */
export function useUnverifiedEdges(): Set<string> {
  const key = useTM((s) => unverifiedKey(s.document.edges));
  return useMemo(() => new Set(key ? key.split(",") : []), [key]);
}

export function useReadOnly(): boolean {
  return useTM((s) => s.persist === "readonly");
}

// ─── Confidence (P3-35) ─────────────────────────────────────────

export type Confidence = "high" | "medium" | "low";

export function threatConfidence(
  t: GeneratedThreat,
  unverified: Set<string>,
): { level: Confidence; reason: string } {
  if (t.affectedEdgeIds.some((id) => unverified.has(id)))
    return {
      level: "low",
      reason: "Assumed posture: an imported flow's authentication/encryption was never confirmed.",
    };
  if (t.inherited) {
    const hops = t.hops ?? 1;
    return hops <= 1
      ? { level: "medium", reason: "Inherited one hop downstream from a direct finding." }
      : { level: "low", reason: `Inherited ${hops} hops downstream; influence weakens per hop.` };
  }
  if (t.scope === "model" || t.scope === "path")
    return {
      level: "medium",
      reason: "Derived from the overall topology rather than one component's metadata.",
    };
  if (t.methodology === "custom")
    return { level: "medium", reason: "Custom threat defined on this component type." };
  return { level: "high", reason: "The rule matched explicit metadata on this component or flow." };
}

export const CONFIDENCE_LABEL: Record<Confidence, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function residualText(t: GeneratedThreat): string {
  const r = t.residualScore ?? t.score ?? 0;
  const s = t.score ?? 0;
  return r !== s ? `Residual ${r} / 25 (inherent ${s})` : `Score ${s} / 25`;
}

// ─── Status editor ──────────────────────────────────────────────

export interface StatusDraft {
  status: ThreatStatus;
  justification: string;
  owner: string;
  due: string;
  evidenceUrl: string;
}

export function validateStatus(
  d: Pick<StatusDraft, "status" | "justification" | "evidenceUrl">,
): string | null {
  if (d.status === "accepted" && !d.justification.trim())
    return "Accepted risk needs a justification.";
  if (d.evidenceUrl.trim() && !/^https?:\/\/\S+$/i.test(d.evidenceUrl.trim()))
    return "The evidence link must be an http(s) URL.";
  return null;
}

export function draftToEntry(d: StatusDraft) {
  return {
    status: d.status,
    ...(d.justification.trim() ? { justification: d.justification.trim() } : {}),
    ...(d.owner.trim() ? { owner: d.owner.trim() } : {}),
    ...(d.due ? { due: d.due } : {}),
    ...(d.evidenceUrl.trim() ? { evidenceUrl: d.evidenceUrl.trim() } : {}),
  };
}

// ─── Filters ────────────────────────────────────────────────────

export type GroupBy = "component" | "rule" | "layer" | "severity";
export type StatusFilter = "any" | "open" | "resolved" | ThreatStatus;
export type ScopeFilter = "all" | "node" | "edge" | "path" | "model" | "custom";

export interface ThreatFilterState {
  search: string;
  severities: Severity[];
  status: StatusFilter;
  scope: ScopeFilter;
  showInherited: boolean;
  showResolved: boolean;
}

export const DEFAULT_FILTERS: ThreatFilterState = {
  search: "",
  severities: [],
  status: "any",
  scope: "all",
  showInherited: true,
  showResolved: true,
};

export function isDefaultFilters(f: ThreatFilterState): boolean {
  return (
    !f.search &&
    !f.severities.length &&
    f.status === "any" &&
    f.scope === "all" &&
    f.showInherited &&
    f.showResolved
  );
}

export function matchesFilters(
  t: GeneratedThreat,
  f: ThreatFilterState,
  labels: Map<string, string>,
): boolean {
  if (t.inherited && !f.showInherited) return false;
  const open = threatResolution(t) === "open";
  if (!open && !f.showResolved) return false;
  if (f.severities.length && !f.severities.includes(t.severity)) return false;
  if (f.status === "open" && !open) return false;
  if (f.status === "resolved" && open) return false;
  if (
    f.status !== "any" &&
    f.status !== "open" &&
    f.status !== "resolved" &&
    statusOf(t) !== f.status
  )
    return false;
  if (f.scope !== "all") {
    if (
      f.scope === "custom"
        ? t.methodology !== "custom"
        : (t.scope ?? "node") !== f.scope || t.methodology === "custom"
    )
      return false;
  }
  const q = f.search.trim().toLowerCase();
  if (q) {
    const hay = [
      t.name,
      t.description,
      t.ruleId,
      t.id,
      ...t.affectedNodeIds.map((id) => labels.get(id) ?? id),
      ...(t.owaspMapping ?? []).map((m) => m.asiId),
      ...(t.ciscoMapping ?? []).map((m) => m.objectiveId),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

// ─── Threats tab view state ─────────────────────────────────────

export interface ThreatsView {
  filters: ThreatFilterState;
  setFilters: Dispatch<SetStateAction<ThreatFilterState>>;
  groupBy: GroupBy;
  setGroupBy: Dispatch<SetStateAction<GroupBy>>;
  expanded: Set<string>;
  setExpanded: Dispatch<SetStateAction<Set<string>>>;
  checked: Set<string>;
  setChecked: Dispatch<SetStateAction<Set<string>>>;
  collapsed: Set<string>;
  setCollapsed: Dispatch<SetStateAction<Set<string>>>;
  inheritedOpen: Set<string>;
  setInheritedOpen: Dispatch<SetStateAction<Set<string>>>;
}

/** List state lifted into the panel so it survives tab switches. */
export function useThreatsView(): ThreatsView {
  const [filters, setFilters] = useState<ThreatFilterState>(DEFAULT_FILTERS);
  const [groupBy, setGroupBy] = useState<GroupBy>("component");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [checked, setChecked] = useState<Set<string>>(() => new Set());
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const [inheritedOpen, setInheritedOpen] = useState<Set<string>>(() => new Set());
  return {
    filters,
    setFilters,
    groupBy,
    setGroupBy,
    expanded,
    setExpanded,
    checked,
    setChecked,
    collapsed,
    setCollapsed,
    inheritedOpen,
    setInheritedOpen,
  };
}

// ─── Tab counts ─────────────────────────────────────────────────

/** Count shown on the Compliance tab: failing architecture checks plus data-flow violations. */
export function complianceGapCount(a: AnalysisResult): number {
  return (
    a.compliance.checks.filter((c) => c.verdict === "gap").length + a.compliance.dataFlow.length
  );
}

import type {
  CanvasEdge,
  CanvasNode,
  CustomComponentDefinition,
  GeneratedThreat,
  MaestroLayer,
  MitigationStatusEntry,
  MitigationStatusValue,
  SemanticKind,
  Severity,
  ThreatAnalysisResult,
  ThreatStatus,
} from "../types";
import {
  buildGraph,
  modelFingerprint,
  reachFrom,
  type GateKind,
  type ModelGraph,
  type ReachInfo,
} from "./graph";
import { RULES, getMitigation, resolveMitigationId, rulesById } from "./catalog";
import type {
  MatchEvidence,
  RuleContext,
  RuleHelpers,
  RuleMatch,
  ThreatRule,
} from "./catalog/types";
import { assess, forwardWithin, residual, score as scoreOf, SEVERITY_ORDER } from "./severity";
import { propagateThreats, type PropagationSource } from "./propagation";
import { findAttackPaths, type AttackPath, type AttackPathResult } from "./paths";
import { computeModelScore, toRiskSummary, type ModelScore } from "./modelScore";
import { runCompliance, type ComplianceResult } from "./compliance";
import { attackSurfaceFromGraph, type AttackSurfaceScore } from "./attackSurface";
import { ciscoMappingFor, owaspMappingFor } from "./taxonomy";
import type { ModelRiskSummary } from "./riskScoring";
import type { AISVSCoverageResult } from "./aisvsMapping";
import type { ComplianceGapReport } from "./complianceGap";
import type { ComplianceViolation } from "./dataFlowCompliance";
import type { Aiuc1ComplianceResult } from "./aiuc1Compliance";

export const ENGINE_VERSION = "3.0.0";

// ─── Input ───────────────────────────────────────────────────────

export interface ThreatStatusEntry {
  status: ThreatStatus;
  justification?: string;
  owner?: string;
  due?: string;
  evidenceUrl?: string;
  updatedAt?: string;
}

/** "Not applicable here" feedback (P3-35): drop a rule for one component, a component kind, or everywhere. */
export interface SuppressedRule {
  ruleId: string;
  componentKey?: string;
  componentKind?: SemanticKind;
  reason?: string;
}

export interface PreviousRunSummary {
  threats: { id: string; severity: Severity; residualScore?: number; name?: string }[];
  modelScore?: number;
}

export interface AnalysisInput {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  customComponents?: CustomComponentDefinition[];
  /** Keyed by threat id (`${ruleId}::${componentKey}`). */
  threatStatuses?: Record<string, ThreatStatusEntry>;
  /**
   * Mitigation status per node id (or "*" for model-wide). Values are a status or a
   * status entry; only "implemented" reduces residual risk. Node `data.mitigationStatuses`
   * are read as well, so callers normally do not need to pass this.
   */
  mitigations?: Record<string, Record<string, MitigationStatusEntry | MitigationStatusValue>>;
  suppressedRules?: SuppressedRule[];
  previous?: PreviousRunSummary | null;
  options?: { pathLimit?: number };
}

// ─── Output ──────────────────────────────────────────────────────

export interface ChangeSummary {
  added: string[];
  resolved: string[];
  severityChanged: { id: string; from: Severity; to: Severity }[];
  /** Model score delta vs the previous run (null when unknown). */
  scoreDelta: number | null;
}

type BaseSummary = ThreatAnalysisResult["summary"];

export interface AnalysisSummary extends BaseSummary {
  open: number;
  suppressed: number;
  byRule: Record<string, number>;
}

export interface AnalysisResult extends ThreatAnalysisResult {
  engineVersion: string;
  /** modelFingerprint of the analysed nodes/edges. */
  fingerprint: string;
  threats: GeneratedThreat[];
  summary: AnalysisSummary;
  paths: AttackPathResult;
  modelScore: ModelScore;
  compliance: ComplianceResult;
  changeSummary: ChangeSummary | null;
  suppressed: { threatId: string; ruleId: string; componentKey: string }[];
  // Legacy superset fields (existing panels and exports)
  riskSummary: ModelRiskSummary;
  attackPaths: AttackPath[];
  aisvsResult: AISVSCoverageResult;
  complianceViolations: ComplianceViolation[];
  complianceGapReport: ComplianceGapReport;
  attackSurfaceScores: AttackSurfaceScore[];
  aiuc1Result: Aiuc1ComplianceResult;
}

// ─── Rule evaluation ─────────────────────────────────────────────

export function createHelpers(graph: ModelGraph): RuleHelpers {
  let all: Map<string, ReachInfo> | null = null;
  const blocked = new Map<string, Map<string, ReachInfo>>();
  return {
    node: (id) => graph.nodeById.get(id),
    label: (id) => graph.nodeById.get(id)?.label ?? id,
    inbound: (id) => graph.in.get(id) ?? [],
    outbound: (id) => graph.out.get(id) ?? [],
    reach: (id) => {
      if (!all) all = reachFrom(graph, graph.entries);
      return all.get(id);
    },
    reachBlocked: (id, kinds: GateKind[]) => {
      const key = [...kinds].sort().join(",");
      if (!blocked.has(key)) blocked.set(key, reachFrom(graph, graph.entries, kinds));
      return blocked.get(key)!.get(id);
    },
    downstream: (id, maxHops = 4) =>
      forwardWithin(graph, id, maxHops).filter((x) => !graph.nodeById.get(x)?.isActor),
    writers: (id) =>
      (graph.in.get(id) ?? []).map((e) => graph.nodeById.get(e.source)!).filter(Boolean),
  };
}

function normalise(m: RuleMatch): MatchEvidence[] {
  if (!m) return [];
  if (m === true) return [{ evidence: [] }];
  return Array.isArray(m) ? m : [m];
}

const DEFAULT_METHODOLOGY: Record<ThreatRule["scope"], GeneratedThreat["methodology"]> = {
  node: "MAESTRO",
  edge: "connection",
  path: "topology",
  model: "topology",
};

function uniq<T>(xs: T[]): T[] {
  return [...new Set(xs)];
}

function buildThreat(rule: ThreatRule, ctx: RuleContext, match: MatchEvidence): GeneratedThreat {
  let focusId: string | undefined;
  let componentKey: string;
  let nodeIds: string[];
  let edgeIds: string[];
  switch (rule.scope) {
    case "node":
      focusId = match.focusNodeId ?? ctx.node!.id;
      componentKey = match.componentKey ?? ctx.node!.id;
      nodeIds = uniq([ctx.node!.id, ...(match.nodeIds ?? [])]);
      edgeIds = uniq(match.edgeIds ?? []);
      break;
    case "edge":
      focusId = match.focusNodeId ?? ctx.edge!.target;
      componentKey = match.componentKey ?? ctx.edge!.id;
      nodeIds = uniq([ctx.edge!.source, ctx.edge!.target, ...(match.nodeIds ?? [])]);
      edgeIds = uniq([ctx.edge!.id, ...(match.edgeIds ?? [])]);
      break;
    default:
      focusId = match.focusNodeId ?? match.path?.[match.path.length - 1];
      // Without a path the node set is unordered: sort it so ids and score
      // attribution never depend on canvas array order.
      nodeIds = match.path ? uniq(match.nodeIds ?? match.path) : uniq(match.nodeIds ?? []).sort();
      edgeIds = uniq(match.edgeIds ?? []).sort();
      componentKey =
        match.componentKey ?? (match.path ? match.path.join(">") : nodeIds.join(",") || "model");
  }
  const a = assess(rule, ctx, match, focusId);
  const maps = rule.maps;
  return {
    id: `${rule.id}::${componentKey}`,
    threatId: maps.catalogThreat,
    ruleId: rule.id,
    componentKey,
    scope: rule.scope,
    name: rule.title,
    description: rule.message ? rule.message(ctx, match) : rule.description,
    severity: a.severity,
    likelihood: a.likelihood,
    impact: a.impact,
    score: a.score,
    methodology: rule.methodology ?? DEFAULT_METHODOLOGY[rule.scope],
    maestroLayer: maps.maestroLayer,
    affectedNodeIds: nodeIds,
    affectedEdgeIds: edgeIds,
    focusNodeId: focusId,
    inherited: false,
    mitigationIds: rule.mitigationIds,
    mitigations: rule.mitigationIds.map((id) => getMitigation(id)?.name ?? id),
    controlIds: uniq(
      rule.mitigationIds.map((id) => getMitigation(id)?.controlId).filter(Boolean) as string[],
    ),
    owaspMapping: owaspMappingFor(maps),
    ciscoMapping: ciscoMappingFor(maps),
    aisvs: maps.aisvs ?? [],
    stride: maps.stride ?? [],
    catalogThreat: maps.catalogThreat,
    references: rule.references ?? [],
    why: { ruleId: rule.id, evidence: match.evidence, path: match.path, factors: a.factors },
  };
}

/** Evaluate every catalog rule against the graph (pure, deterministic). */
export function evaluateRules(graph: ModelGraph, rules: ThreatRule[] = RULES): GeneratedThreat[] {
  const h = createHelpers(graph);
  const out = new Map<string, GeneratedThreat>();
  const add = (t: GeneratedThreat) => {
    const existing = out.get(t.id);
    if (!existing || (t.score ?? 0) > (existing.score ?? 0)) out.set(t.id, t);
  };
  for (const rule of rules) {
    if (rule.scope === "node") {
      for (const node of graph.nodes) {
        if (rule.appliesTo && !rule.appliesTo(node)) continue;
        const ctx: RuleContext = { graph, h, node };
        for (const m of normalise(rule.when(ctx))) add(buildThreat(rule, ctx, m));
      }
    } else if (rule.scope === "edge") {
      for (const edge of graph.edges) {
        const ctx: RuleContext = {
          graph,
          h,
          edge,
          source: graph.nodeById.get(edge.source),
          target: graph.nodeById.get(edge.target),
        };
        for (const m of normalise(rule.when(ctx))) add(buildThreat(rule, ctx, m));
      }
    } else {
      const ctx: RuleContext = { graph, h };
      for (const m of normalise(rule.when(ctx))) add(buildThreat(rule, ctx, m));
    }
  }
  return [...out.values()];
}

const CUSTOM_LEVELS: Record<string, [number, number]> = {
  high: [4, 4],
  medium: [3, 3],
  low: [2, 2],
};

function customThreats(
  graph: ModelGraph,
  defs: CustomComponentDefinition[] = [],
): GeneratedThreat[] {
  const out: GeneratedThreat[] = [];
  const byId = new Map<
    string,
    { def: CustomComponentDefinition; ct: CustomComponentDefinition["customThreats"][number] }
  >();
  for (const def of defs) for (const ct of def.customThreats ?? []) byId.set(ct.id, { def, ct });
  for (const n of graph.nodes) {
    if (!n.data.isCustom || !n.data.customThreatIds?.length) continue;
    for (const ctId of n.data.customThreatIds) {
      const found = byId.get(ctId);
      if (!found) continue;
      const { ct } = found;
      const [l, i] = CUSTOM_LEVELS[ct.severity] ?? [3, 3];
      const s = scoreOf(l, i);
      const ids = uniq(
        (ct.mitigations ?? []).map((m) => resolveMitigationId(m)).filter(Boolean) as string[],
      );
      out.push({
        id: `CUSTOM-${ct.id}::${n.id}`,
        threatId: ct.id,
        ruleId: `CUSTOM-${ct.id}`,
        componentKey: n.id,
        scope: "node",
        name: ct.name,
        description: ct.description,
        severity: s.severity,
        likelihood: l,
        impact: i,
        score: s.score,
        methodology: "custom",
        maestroLayer: ct.maestroLayer as MaestroLayer,
        affectedNodeIds: [n.id],
        affectedEdgeIds: [],
        focusNodeId: n.id,
        inherited: false,
        mitigations: ct.mitigations ?? [],
        mitigationIds: ids,
        why: {
          ruleId: `CUSTOM-${ct.id}`,
          evidence: [`Custom threat defined on ${n.label}`],
          factors: [],
        },
      });
    }
  }
  return out;
}

// ─── Mitigations / statuses ──────────────────────────────────────

function statusValue(
  v: MitigationStatusEntry | MitigationStatusValue | undefined,
): MitigationStatusValue | undefined {
  if (!v) return undefined;
  return typeof v === "string" ? v : v.status;
}

/** Implemented mitigation ids per node id ("*" = model-wide). Only status "implemented" counts. */
export function implementedMitigations(
  input: Pick<AnalysisInput, "nodes" | "mitigations">,
): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  const add = (key: string, raw: string) => {
    const id = resolveMitigationId(raw);
    if (!id) return;
    if (!out.has(key)) out.set(key, new Set());
    out.get(key)!.add(id);
  };
  for (const n of input.nodes) {
    const statuses = n.data?.mitigationStatuses ?? {};
    for (const [id, entry] of Object.entries(statuses))
      if (entry?.status === "implemented") add(n.id, id);
    // Legacy: ids applied without a status entry were toggled "implemented".
    for (const id of n.data?.appliedMitigations ?? []) if (!statuses[id]) add(n.id, id);
  }
  for (const [key, map] of Object.entries(input.mitigations ?? {}))
    for (const [id, v] of Object.entries(map ?? {}))
      if (statusValue(v) === "implemented") add(key, id);
  return out;
}

function isSuppressed(t: GeneratedThreat, graph: ModelGraph, rules: SuppressedRule[]): boolean {
  for (const r of rules) {
    if (r.ruleId !== t.ruleId) continue;
    if (r.componentKey && r.componentKey !== t.componentKey) continue;
    if (r.componentKind) {
      const focus = t.focusNodeId ? graph.nodeById.get(t.focusNodeId) : undefined;
      if (!focus || focus.kind !== r.componentKind) continue;
    }
    return true;
  }
  return false;
}

function applyResidual(
  t: GeneratedThreat,
  implemented: Map<string, Set<string>>,
  statuses: Record<string, ThreatStatusEntry>,
): GeneratedThreat {
  const set = new Set<string>(implemented.get("*") ?? []);
  for (const id of t.affectedNodeIds) for (const m of implemented.get(id) ?? []) set.add(m);
  const st = statuses[t.id];
  const ruleMitigations = t.mitigationIds ?? [];
  const r = residual(t.score ?? 0, ruleMitigations, set, st?.status);
  const next: GeneratedThreat = {
    ...t,
    residualScore: r.residualScore,
    residualFactor: r.residualFactor,
    mitigationState: r.mitigationState,
    implementedMitigationIds: r.implemented,
  };
  if (st) {
    next.status = st.status;
    if (st.justification) next.statusJustification = st.justification;
    if (st.owner) next.owner = st.owner;
    if (st.due) next.due = st.due;
    if (st.evidenceUrl) next.evidenceUrl = st.evidenceUrl;
  } else {
    delete next.status;
    delete next.statusJustification;
    delete next.owner;
    delete next.due;
    delete next.evidenceUrl;
  }
  return next;
}

const byId = (a: { id: string }, b: { id: string }) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

export const isThreatClosed = (t: GeneratedThreat) =>
  t.mitigationState === "mitigated" || t.status === "mitigated" || t.status === "false-positive";

function summarise(threats: GeneratedThreat[], suppressed: number): AnalysisSummary {
  const byMethodology: Record<string, number> = {};
  const byLayer: Partial<Record<MaestroLayer, number>> = {};
  const byRule: Record<string, number> = {};
  for (const t of threats) {
    byMethodology[t.methodology] = (byMethodology[t.methodology] ?? 0) + 1;
    if (t.maestroLayer !== undefined) byLayer[t.maestroLayer] = (byLayer[t.maestroLayer] ?? 0) + 1;
    if (t.ruleId) byRule[t.ruleId] = (byRule[t.ruleId] ?? 0) + 1;
  }
  const mitigated = threats.filter(isThreatClosed).length;
  return {
    total: threats.length,
    critical: threats.filter((t) => t.severity === "critical").length,
    high: threats.filter((t) => t.severity === "high").length,
    medium: threats.filter((t) => t.severity === "medium").length,
    low: threats.filter((t) => t.severity === "low").length,
    inherited: threats.filter((t) => t.inherited).length,
    mitigated,
    open: threats.filter(
      (t) => !isThreatClosed(t) && t.status !== "accepted" && t.status !== "transferred",
    ).length,
    suppressed,
    byMethodology,
    byLayer,
    byRule,
  };
}

function diff(
  prev: PreviousRunSummary | null | undefined,
  threats: GeneratedThreat[],
  score: number,
): ChangeSummary | null {
  if (!prev) return null;
  const before = new Map(prev.threats.map((t) => [t.id, t]));
  const now = new Map(threats.map((t) => [t.id, t]));
  const added = threats.filter((t) => !before.has(t.id)).map((t) => t.id);
  const resolved = prev.threats.filter((t) => !now.has(t.id)).map((t) => t.id);
  const severityChanged: ChangeSummary["severityChanged"] = [];
  for (const t of threats) {
    const p = before.get(t.id);
    if (p && p.severity !== t.severity)
      severityChanged.push({ id: t.id, from: p.severity, to: t.severity });
  }
  return {
    added: added.sort(),
    resolved: resolved.sort(),
    severityChanged: severityChanged.sort(byId),
    scoreDelta: typeof prev.modelScore === "number" ? score - prev.modelScore : null,
  };
}

/** Everything that depends on statuses and implemented mitigations (cheap; no rule evaluation). */
function finalize(
  graph: ModelGraph,
  base: GeneratedThreat[],
  suppressedList: AnalysisResult["suppressed"],
  input: AnalysisInput,
): AnalysisResult {
  const implemented = implementedMitigations(input);
  const statuses = input.threatStatuses ?? {};
  const threats = base.map((t) => applyResidual(t, implemented, statuses)).sort(byId);
  const paths = findAttackPaths(graph, threats, input.options?.pathLimit ?? 20);
  const modelScore = computeModelScore(graph, threats, paths.paths);
  const compliance = runCompliance({
    graph,
    threats,
    implementedFor: (id) => {
      if (id === "*") return implemented.get("*") ?? new Set();
      const edge = graph.edgeById.get(id);
      const ids = edge ? [edge.source, edge.target] : [id];
      const s = new Set<string>(implemented.get("*") ?? []);
      for (const k of ids) for (const m of implemented.get(k) ?? []) s.add(m);
      return s;
    },
  });
  const attackSurfaceScores = attackSurfaceFromGraph(graph);
  return {
    engineVersion: ENGINE_VERSION,
    fingerprint: modelFingerprint(input.nodes, input.edges),
    threats,
    summary: summarise(threats, suppressedList.length),
    paths,
    modelScore,
    compliance,
    changeSummary: diff(input.previous, threats, modelScore.overall),
    suppressed: suppressedList,
    riskSummary: toRiskSummary(modelScore, threats, attackSurfaceScores, graph),
    attackPaths: paths.paths,
    aisvsResult: compliance.aisvsResult,
    complianceViolations: compliance.dataFlow,
    complianceGapReport: compliance.complianceGapReport,
    attackSurfaceScores,
    aiuc1Result: compliance.aiuc1,
  };
}

/**
 * The threat-model analysis (Phase 3 engine entry point). Pure and
 * deterministic: the same input always yields the same, structured-cloneable
 * result. Run it in the worker via `runAnalysis()` (engine/runAnalysis.ts).
 */
export function analyzeThreatModel(input: AnalysisInput): AnalysisResult {
  const graph = buildGraph(input.nodes, input.edges);
  const direct = [...evaluateRules(graph), ...customThreats(graph, input.customComponents)];
  const rules = rulesById();
  const sources: PropagationSource[] = [];
  for (const t of direct) {
    const rule = t.ruleId ? rules.get(t.ruleId) : undefined;
    if (rule?.propagates && t.focusNodeId)
      sources.push({ threat: t, rule, originId: t.focusNodeId });
  }
  const inherited = propagateThreats(graph, sources);
  const all = [...direct, ...inherited];
  const suppressedRules = input.suppressedRules ?? [];
  const kept: GeneratedThreat[] = [];
  const suppressed: AnalysisResult["suppressed"] = [];
  for (const t of all) {
    const supp =
      isSuppressed(t, graph, suppressedRules) ||
      (t.inheritedFrom ? suppressed.some((s) => s.threatId === t.inheritedFrom) : false);
    if (supp)
      suppressed.push({
        threatId: t.id,
        ruleId: t.ruleId ?? "",
        componentKey: t.componentKey ?? "",
      });
    else kept.push(t);
  }
  // Inherited copies of suppressed threats (sorted after their source by id) are dropped too.
  const suppressedIds = new Set(suppressed.map((s) => s.threatId));
  const final = kept.filter((t) => !(t.inheritedFrom && suppressedIds.has(t.inheritedFrom)));
  for (const t of kept)
    if (t.inheritedFrom && suppressedIds.has(t.inheritedFrom) && !suppressedIds.has(t.id))
      suppressed.push({
        threatId: t.id,
        ruleId: t.ruleId ?? "",
        componentKey: t.componentKey ?? "",
      });
  suppressed.sort((a, b) => (a.threatId < b.threatId ? -1 : 1));
  return finalize(graph, final, suppressed, input);
}

/**
 * Re-apply threat statuses and implemented mitigations to an existing result
 * without re-running the rules (instant feedback for status / mitigation
 * edits). Structural edits need `analyzeThreatModel`.
 */
export function rescoreAnalysis(previous: AnalysisResult, input: AnalysisInput): AnalysisResult {
  const graph = buildGraph(input.nodes, input.edges);
  return finalize(graph, previous.threats, previous.suppressed, {
    ...input,
    previous: input.previous ?? null,
  });
}

/** Compact summary of a run for the next run's `previous` (change strip, P3-34). */
export function summariseForNextRun(r: AnalysisResult): PreviousRunSummary {
  return {
    threats: r.threats.map((t) => ({
      id: t.id,
      severity: t.severity,
      residualScore: t.residualScore,
      name: t.name,
    })),
    modelScore: r.modelScore.overall,
  };
}

/** Highest severity first, then score, then id (UI default ordering). */
export function compareThreats(a: GeneratedThreat, b: GeneratedThreat): number {
  return (
    SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity] ||
    (b.residualScore ?? 0) - (a.residualScore ?? 0) ||
    (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  );
}

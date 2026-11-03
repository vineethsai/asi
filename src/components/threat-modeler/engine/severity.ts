import type { Severity, SeverityFactor, ThreatStatus } from "../types";
import { type ModelGraph, type ReachInfo, gateBlocks, reachFrom } from "./graph";
import { getMitigation } from "./catalog/mitigations";
import type { Level, MatchEvidence, RuleContext, ThreatRule } from "./catalog/types";

// ─── Score bands ────────────────────────────────────────────────

export const SEVERITY_ORDER: Record<Severity, number> = { critical: 4, high: 3, medium: 2, low: 1 };
const BY_ORDER: Severity[] = ["low", "low", "medium", "high", "critical"];
/** SARIF `security-severity` per band (GitHub code scanning convention). */
export const SECURITY_SEVERITY: Record<Severity, number> = {
  critical: 9.0,
  high: 7.0,
  medium: 4.0,
  low: 1.0,
};
const BAND_MAX: Record<Severity, number> = { critical: 25, high: 19, medium: 11, low: 5 };

export function severityFromScore(s: number): Severity {
  if (s >= 20) return "critical";
  if (s >= 12) return "high";
  if (s >= 6) return "medium";
  return "low";
}

/** likelihood × impact → numeric score (1–25) and severity band. */
export function score(likelihood: number, impact: number): { score: number; severity: Severity } {
  const l = clamp(Math.round(likelihood), 1, 5);
  const i = clamp(Math.round(impact), 1, 5);
  const s = l * i;
  return { score: s, severity: severityFromScore(s) };
}

export function degrade(sev: Severity, levels: number): Severity | null {
  const o = SEVERITY_ORDER[sev] - levels;
  return o < 1 ? null : BY_ORDER[o];
}

/** Clamp a score into the band of `sev` (used for inherited threats). */
export function capToBand(s: number, sev: Severity): number {
  return Math.min(s, BAND_MAX[sev]);
}

export function riskLabel(score0to100: number): string {
  if (score0to100 >= 80) return "Critical";
  if (score0to100 >= 60) return "High";
  if (score0to100 >= 40) return "Medium";
  if (score0to100 >= 20) return "Low";
  return "Minimal";
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

// ─── Contextual likelihood / impact ─────────────────────────────

export interface Assessment {
  likelihood: Level;
  impact: Level;
  score: number;
  severity: Severity;
  factors: SeverityFactor[];
}

function gateLabels(graph: ModelGraph, r: ReachInfo, rule: ThreatRule): string[] {
  const out: string[] = [];
  for (let i = 1; i < r.path.length; i++) {
    const n = graph.nodeById.get(r.path[i]);
    if (n && (n.isGate || n.isGuardrail) && gateBlocks(n, rule.gates ?? [], "forward"))
      out.push(n.label);
  }
  return out;
}

/**
 * Apply the severity model: base likelihood/impact from the rule, adjusted
 * by entry-point reachability, gates, edge posture and source trust
 * (likelihood) and by data sensitivity, tool privilege and blast radius
 * (impact). Every adjustment is recorded as an explainable factor.
 */
export function assess(
  rule: ThreatRule,
  ctx: RuleContext,
  match: MatchEvidence,
  focusId: string | undefined,
): Assessment {
  const graph = ctx.graph;
  let l: number = rule.likelihood(ctx, match);
  let i: number = rule.impact(ctx, match);
  const factors: SeverityFactor[] = [];
  const focus = focusId ? graph.nodeById.get(focusId) : undefined;

  if (!rule.fixedSeverity && focus) {
    const entries = match.entryIds?.length ? match.entryIds : graph.entries;
    let lMod = 0;
    const r: ReachInfo | undefined =
      focus.isEntry && !match.entryIds
        ? { hops: 0, path: [focus.id], edgeIds: [] }
        : reachFrom(graph, entries).get(focus.id);
    if (!r) {
      lMod -= 2;
      factors.push({ kind: "likelihood", label: "Not reachable from any entry point", delta: -2 });
    } else {
      if (r.hops >= 3) {
        lMod -= 1;
        factors.push({
          kind: "likelihood",
          label: `${r.hops} hops from the nearest entry point`,
          delta: -1,
        });
      }
      // Gates (guardrail coverage / HITL)
      if (rule.gates?.length) {
        if (rule.gateDirection === "outbound") {
          const free = reachFrom(graph, [focus.id]);
          const gated = reachFrom(graph, [focus.id], rule.gates);
          const anyFree = graph.entries.some((e) => e !== focus.id && free.has(e));
          const anyGated = graph.entries.some((e) => e !== focus.id && gated.has(e));
          if (anyFree && !anyGated) {
            lMod -= 2;
            factors.push({
              kind: "likelihood",
              label: `Every path back to an entry point passes a ${rule.gates.join("/")} gate`,
              delta: -2,
            });
          }
        } else if (r.hops > 0) {
          // reachFrom marks a blocking gate as reached but does not expand it, so the
          // focus is "gated" when it cannot be reached at all while gates block.
          const blocked = reachFrom(graph, entries, rule.gates).get(focus.id);
          if (!blocked) {
            const names = gateLabels(graph, r, rule);
            lMod -= 2;
            factors.push({
              kind: "likelihood",
              label: `Every entry path passes ${names.length ? names.join(", ") : "a gate"} (${rule.gates.join("/")})`,
              delta: -2,
            });
          }
        }
      }
      // Edge posture on the shortest entry path
      if (r.edgeIds.length > 0) {
        const edges = r.edgeIds.map((id) => graph.edgeById.get(id)!).filter(Boolean);
        if (edges.every((e) => e.secure)) {
          lMod -= 1;
          factors.push({
            kind: "likelihood",
            label: "Entry path is authenticated and encrypted",
            delta: -1,
          });
        } else if (!edges[0].authenticated) {
          lMod += 1;
          factors.push({
            kind: "likelihood",
            label: `Unauthenticated entry flow from ${graph.nodeById.get(r.path[0])?.label ?? r.path[0]}`,
            delta: 1,
          });
        }
      }
      // Trust of the source
      const entry = graph.nodeById.get(r.path[0]);
      if (entry && entry.data.trustLevel === "trusted") {
        lMod -= 1;
        factors.push({
          kind: "likelihood",
          label: `Entry point ${entry.label} is trusted`,
          delta: -1,
        });
      }
    }
    l += clamp(lMod, -3, 1);

    // Impact
    const skip = new Set(rule.skipImpactFactors ?? []);
    let iMod = 0;
    if (!skip.has("data")) {
      const touching = [...(graph.in.get(focus.id) ?? []), ...(graph.out.get(focus.id) ?? [])];
      const matchEdges = (match.edgeIds ?? [])
        .concat(ctx.edge ? [ctx.edge.id] : [])
        .map((id) => graph.edgeById.get(id))
        .filter(Boolean);
      if (focus.isSensitive) {
        iMod += 1;
        factors.push({
          kind: "impact",
          label: `${focus.label} handles ${focus.data.dataSensitivity} data`,
          delta: 1,
        });
      } else if (touching.some((e) => e.sensitive) || matchEdges.some((e) => e!.sensitive)) {
        iMod += 1;
        factors.push({ kind: "impact", label: "Flows carry PII or confidential data", delta: 1 });
      }
    }
    if (!skip.has("tool")) {
      if (focus.isPrivileged) {
        iMod += 1;
        factors.push({
          kind: "impact",
          label: `${focus.label} is a privileged component`,
          delta: 1,
        });
      } else {
        const near = forwardWithin(graph, focus.id, 2).find(
          (id) => graph.nodeById.get(id)?.isPrivileged,
        );
        if (near) {
          iMod += 1;
          factors.push({
            kind: "impact",
            label: `Can drive privileged ${graph.nodeById.get(near)!.label}`,
            delta: 1,
          });
        }
      }
    }
    if (!skip.has("blast")) {
      const down = forwardWithin(graph, focus.id, 4).filter(
        (id) => !graph.nodeById.get(id)?.isActor,
      );
      if (down.length >= 3) {
        iMod += 1;
        factors.push({ kind: "impact", label: `${down.length} downstream components`, delta: 1 });
      }
    }
    i += Math.min(2, iMod);
  }

  const s = score(l, i);
  return {
    likelihood: clamp(Math.round(l), 1, 5) as Level,
    impact: clamp(Math.round(i), 1, 5) as Level,
    score: s.score,
    severity: s.severity,
    factors,
  };
}

/** Nodes reachable along forward flows within `maxHops`. */
export function forwardWithin(graph: ModelGraph, from: string, maxHops: number): string[] {
  const seen = new Set([from]);
  let frontier = [from];
  const out: string[] = [];
  for (let d = 0; d < maxHops && frontier.length > 0; d++) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const e of graph.out.get(id) ?? []) {
        if (seen.has(e.target)) continue;
        seen.add(e.target);
        out.push(e.target);
        next.push(e.target);
      }
    }
    frontier = next;
  }
  return out;
}

// ─── Residual risk ───────────────────────────────────────────────

/** Σ effectiveness at or above this counts as "mitigated". */
export const MITIGATED_COVERAGE_THRESHOLD = 0.6;
export const MAX_REDUCTION = 0.9;

export interface ResidualResult {
  residualScore: number;
  residualFactor: number;
  mitigationState: "none" | "partial" | "mitigated";
  implemented: string[];
}

/**
 * residual = score × (1 − Σ effectiveness of IMPLEMENTED mitigations, capped 0.9).
 * Only mitigation ids the rule lists count; in-progress / accepted-risk never count.
 * A threat whose status is "mitigated" or "false-positive" has no residual risk.
 */
export function residual(
  baseScore: number,
  ruleMitigationIds: string[],
  implemented: Set<string>,
  status: ThreatStatus | undefined,
): ResidualResult {
  const hit = ruleMitigationIds.filter((id) => implemented.has(id));
  const sum = hit.reduce((s, id) => s + (getMitigation(id)?.effectiveness ?? 0), 0);
  const reduction = Math.min(MAX_REDUCTION, sum);
  if (status === "mitigated" || status === "false-positive") {
    return { residualScore: 0, residualFactor: 0, mitigationState: "mitigated", implemented: hit };
  }
  const factor = Math.round((1 - reduction) * 1000) / 1000;
  return {
    residualScore: Math.round(baseScore * factor * 10) / 10,
    residualFactor: factor,
    mitigationState:
      reduction >= MITIGATED_COVERAGE_THRESHOLD ? "mitigated" : reduction > 0 ? "partial" : "none",
    implemented: hit,
  };
}

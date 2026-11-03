import { kcByCode } from "@/data/kc";
import {
  MAESTRO_LAYER_LABELS,
  type CanvasEdge,
  type CanvasNode,
  type GeneratedThreat,
  type MitigationStatusEntry,
  type Severity,
} from "../types";
import { type AnalysisResult, compareThreats, isThreatClosed } from "../engine/analyze";
import { getMitigation, getRule } from "../engine/catalog";
import { SECURITY_SEVERITY } from "../engine/severity";
import { resolveKind } from "../engine/semantics";
import { crossesBoundary, isAuthenticated } from "../engine/graph";

/**
 * Report model (P3-40): every exporter (PDF, Markdown, CSV work items)
 * renders from this one structure, so they cannot disagree. Rows hold
 * display strings only (labels, never raw ids, except the stable rule id).
 */
export interface ReportTable {
  id: string;
  title?: string;
  columns: string[];
  rows: string[][];
  /** e.g. "Showing 20 of 34 paths". Never truncate silently. */
  note?: string;
}

export interface ReportSection {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  tables?: ReportTable[];
  children?: ReportSection[];
}

export interface WorkItem {
  mitigationId: string;
  mitigation: string;
  componentId: string;
  component: string;
  threats: string[];
  threatCount: number;
  status: string;
  owner: string;
  due: string;
  effectiveness: number;
  controlId?: string;
}

export interface ReportModel {
  title: string;
  modelName: string;
  generatedAt: string;
  engineVersion: string;
  /** Always shown: verdicts are derived from the diagram only. */
  indicativeNote: string;
  headline: {
    score: number;
    label: string;
    inherent: number;
    threats: number;
    open: number;
    mitigated: number;
    inherited: number;
    bySeverity: Record<Severity, number>;
    components: number;
    flows: number;
    boundaries: number;
    paths: number;
    pathsTruncated: boolean;
  };
  sections: ReportSection[];
  workItems: WorkItem[];
  approval: { role: string; name: string; date: string }[];
  /** Node id → display label (unique). */
  labels: Record<string, string>;
}

export interface ReportDocumentLike {
  name?: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  appliedMitigations?: Record<string, Record<string, MitigationStatusEntry>>;
}

const SEVERITIES: Severity[] = ["critical", "high", "medium", "low"];
const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const yesNo = (b: boolean) => (b ? "Yes" : "No");

/** Unique display labels: duplicates get " (2)", " (3)" … in id order. */
export function componentLabels(nodes: CanvasNode[]): Record<string, string> {
  const out: Record<string, string> = {};
  const seen = new Map<string, number>();
  for (const n of [...nodes].sort((a, b) => (a.id < b.id ? -1 : 1))) {
    const base = n.data?.label || n.id;
    const k = (seen.get(base) ?? 0) + 1;
    seen.set(base, k);
    out[n.id] = k === 1 ? base : `${base} (${k})`;
  }
  return out;
}

export function categoryLabel(category?: string): string {
  if (!category) return "";
  const kc = kcByCode(category);
  if (kc) return `${kc.code} ${kc.name}`;
  const map: Record<string, string> = {
    actor: "Actor",
    external: "External system",
    datastore: "Data store",
    "trust-boundary": "Trust boundary",
    custom: "Custom component",
  };
  return map[category] ?? category;
}

function threatComponents(t: GeneratedThreat, labels: Record<string, string>) {
  return t.affectedNodeIds.map((id) => labels[id] ?? id).join(", ");
}

function mitigationStatusFor(
  doc: ReportDocumentLike,
  nodeId: string,
  mitId: string,
): MitigationStatusEntry | undefined {
  const node = doc.nodes.find((n) => n.id === nodeId);
  return doc.appliedMitigations?.[nodeId]?.[mitId] ?? node?.data?.mitigationStatuses?.[mitId];
}

/** One work item per (mitigation × component) across open direct threats. */
export function buildWorkItems(doc: ReportDocumentLike, analysis: AnalysisResult): WorkItem[] {
  const labels = componentLabels(doc.nodes);
  const items = new Map<string, WorkItem>();
  for (const t of analysis.threats) {
    if (t.inherited) continue;
    const componentId = t.focusNodeId ?? t.affectedNodeIds[0];
    if (!componentId) continue;
    for (const mitId of t.mitigationIds ?? []) {
      const key = `${mitId}@${componentId}`;
      const m = getMitigation(mitId);
      if (!items.has(key)) {
        const st = mitigationStatusFor(doc, componentId, mitId);
        items.set(key, {
          mitigationId: mitId,
          mitigation: m?.name ?? mitId,
          componentId,
          component: labels[componentId] ?? componentId,
          threats: [],
          threatCount: 0,
          status: st?.status ?? "not-started",
          owner: st?.owner ?? "",
          due: st?.due ?? "",
          effectiveness: m?.effectiveness ?? 0,
          controlId: m?.controlId,
        });
      }
      const wi = items.get(key)!;
      wi.threats.push(`${t.ruleId ?? t.id} ${t.name}`);
      wi.threatCount += 1;
    }
  }
  return [...items.values()].sort(
    (a, b) =>
      b.threatCount - a.threatCount ||
      b.effectiveness - a.effectiveness ||
      (a.mitigationId + a.componentId < b.mitigationId + b.componentId ? -1 : 1),
  );
}

export function buildReportModel(
  doc: ReportDocumentLike,
  analysis: AnalysisResult,
  options: { generatedAt?: string; title?: string } = {},
): ReportModel {
  const labels = componentLabels(doc.nodes);
  const L = (id: string) => labels[id] ?? id;
  const nodes = doc.nodes.filter((n) => n.type !== "trustBoundary");
  const boundaries = doc.nodes.filter((n) => n.type === "trustBoundary");
  const threats = [...analysis.threats].sort(compareThreats);
  const direct = threats.filter((t) => !t.inherited);
  const inherited = threats.filter((t) => t.inherited);
  const bySeverity = Object.fromEntries(
    SEVERITIES.map((s) => [s, threats.filter((t) => t.severity === s).length]),
  ) as Record<Severity, number>;
  const ms = analysis.modelScore;
  const comp = analysis.compliance;
  const sections: ReportSection[] = [];

  // 1. Executive summary
  const topThreats = direct.filter((t) => !isThreatClosed(t)).slice(0, 5);
  const topPath = analysis.paths.paths[0];
  sections.push({
    id: "summary",
    title: "Executive summary",
    paragraphs: [
      `Residual model score ${ms.overall}/100 (${ms.label}); inherent ${ms.inherent}/100 before implemented mitigations and threat statuses.`,
      `${threats.length} threats (${direct.length} direct, ${inherited.length} inherited): ${SEVERITIES.map((s) => `${bySeverity[s]} ${s}`).join(", ")}. ${analysis.summary.mitigated} mitigated, ${analysis.summary.open} open.`,
      topPath
        ? `Highest-risk attack path: ${topPath.nodes.map(L).join(" → ")} (score ${topPath.score}/25, residual ${topPath.residualScore}).`
        : "No attack path from an entry point to a high-impact target was found.",
      `AISVS ${comp.aisvs.version}: ${comp.aisvs.summary.met} of ${comp.aisvs.chapters.length - comp.aisvs.summary.notApplicable} applicable chapters met (${comp.aisvs.summary.percent} %). AIUC-1 ${comp.aiuc1.version ?? ""}: ${comp.aiuc1.verdictLabel}, score ${comp.aiuc1.overallScore} %.`,
    ],
    tables: [
      {
        id: "top-threats",
        title: "Top open threats",
        columns: ["Rule", "Threat", "Component", "Severity", "Residual"],
        rows: topThreats.map((t) => [
          t.ruleId ?? "",
          t.name,
          threatComponents(t, labels),
          cap(t.severity),
          String(t.residualScore ?? t.score ?? ""),
        ]),
      },
    ],
  });

  // 2. Legend
  sections.push({
    id: "legend",
    title: "Legend",
    tables: [
      {
        id: "severity-legend",
        columns: ["Severity", "Score (likelihood × impact)", "SARIF security-severity"],
        rows: [
          ["Critical", "20–25", String(SECURITY_SEVERITY.critical)],
          ["High", "12–19", String(SECURITY_SEVERITY.high)],
          ["Medium", "6–11", String(SECURITY_SEVERITY.medium)],
          ["Low", "1–5", String(SECURITY_SEVERITY.low)],
        ],
      },
    ],
    bullets: [
      "Residual = score × (1 − Σ effectiveness of implemented mitigations, capped at 0.9); mitigated / false-positive threats have no residual.",
      "Inherited threats were propagated from a compromised neighbour (at most 2 hops, one severity level lower per hop).",
      "Compliance verdicts are indicative: they are derived from the diagram, not from audited evidence.",
    ],
  });

  // 3. Architecture, grouped by trust boundary
  const groups = new Map<string, CanvasNode[]>();
  const boundaryOf = (n: CanvasNode) => {
    let p = n.parentId;
    const seen = new Set<string>();
    while (p && !seen.has(p)) {
      seen.add(p);
      const parent = doc.nodes.find((x) => x.id === p);
      if (!parent) return undefined;
      if (parent.type === "trustBoundary") return parent.id;
      p = parent.parentId;
    }
    return undefined;
  };
  for (const n of nodes) {
    const b = boundaryOf(n) ?? "";
    if (!groups.has(b)) groups.set(b, []);
    groups.get(b)!.push(n);
  }
  const compScore = new Map(ms.components.map((c) => [c.nodeId, c]));
  const archTables: ReportTable[] = [];
  const order = [...boundaries.map((b) => b.id), ""];
  for (const bid of order) {
    const members = groups.get(bid);
    if (!members?.length) continue;
    archTables.push({
      id: `arch-${bid || "outside"}`,
      title: bid
        ? `Trust boundary: ${L(bid)}`
        : boundaries.length
          ? "Outside any trust boundary"
          : "Components",
      columns: [
        "Component",
        "Kind",
        "Category",
        "Trust",
        "MAESTRO layers",
        "Threats (open/total)",
        "Residual risk",
      ],
      rows: members
        .sort((a, b) => (L(a.id) < L(b.id) ? -1 : 1))
        .map((n) => {
          const ts = threats.filter((t) => t.affectedNodeIds.includes(n.id));
          const c = compScore.get(n.id);
          return [
            L(n.id),
            resolveKind(n),
            categoryLabel(n.data?.category),
            n.data?.trustLevel ?? "",
            (n.data?.maestroLayers ?? []).map((l) => MAESTRO_LAYER_LABELS[l] ?? `L${l}`).join(", "),
            `${ts.filter((t) => !isThreatClosed(t)).length}/${ts.length}`,
            c ? `${c.residual}/100` : "—",
          ];
        }),
    });
  }
  sections.push({ id: "architecture", title: "Architecture", tables: archTables });

  // 4. Data flows
  sections.push({
    id: "flows",
    title: "Data flows",
    tables: [
      {
        id: "flows",
        columns: [
          "From",
          "To",
          "Flow",
          "Protocol",
          "Authentication",
          "Encrypted",
          "Classification",
          "PII",
          "Crosses boundary",
        ],
        rows: doc.edges.map((e) => [
          L(e.source),
          L(e.target),
          e.data?.label ?? "",
          e.data?.protocol ?? "",
          isAuthenticated(e.data) ? (e.data?.authentication ?? "") : "None",
          yesNo(!!e.data?.encrypted),
          e.data?.dataClassification ?? "",
          yesNo(!!e.data?.containsPII),
          yesNo(crossesBoundary(e, doc.nodes)),
        ]),
      },
    ],
  });

  // 5. Threat register + details
  const register: ReportTable = {
    id: "threat-register",
    title: "Threat register",
    columns: [
      "Rule",
      "Threat",
      "Components",
      "Severity",
      "L × I",
      "Score",
      "Residual",
      "Status",
      "Owner",
      "Due",
    ],
    rows: direct.map((t) => [
      t.ruleId ?? "",
      t.name,
      threatComponents(t, labels),
      cap(t.severity),
      t.likelihood && t.impact ? `${t.likelihood} × ${t.impact}` : "",
      String(t.score ?? ""),
      String(t.residualScore ?? ""),
      t.status ??
        (t.mitigationState === "mitigated"
          ? "mitigated"
          : t.mitigationState === "partial"
            ? "partially mitigated"
            : "open"),
      t.owner ?? "",
      t.due ?? "",
    ]),
  };
  const inheritedTable: ReportTable = {
    id: "inherited",
    title: "Inherited threats",
    columns: ["Rule", "Threat", "Lands on", "From", "Hops", "Severity", "Residual"],
    rows: inherited.map((t) => [
      t.ruleId ?? "",
      t.name,
      threatComponents(t, labels),
      t.sourceNodeId ? L(t.sourceNodeId) : "",
      String(t.hops ?? ""),
      cap(t.severity),
      String(t.residualScore ?? ""),
    ]),
  };
  const details: ReportSection[] = direct.map((t) => ({
    id: `threat-${t.id}`,
    title: `${t.ruleId ?? ""} ${t.name} — ${threatComponents(t, labels)}`,
    paragraphs: [t.description],
    bullets: [
      `Severity ${cap(t.severity)} (likelihood ${t.likelihood ?? "?"} × impact ${t.impact ?? "?"} = ${t.score ?? "?"}; residual ${t.residualScore ?? "?"}).`,
      ...(t.why?.evidence ?? []).map((e) => `Evidence: ${e}`),
      ...(t.why?.factors ?? []).map(
        (f) => `${cap(f.kind)} ${f.delta > 0 ? "+" : ""}${f.delta}: ${f.label}`,
      ),
      ...(t.why?.path?.length ? [`Path: ${t.why.path.map(L).join(" → ")}`] : []),
      `Mitigations: ${(t.mitigationIds ?? []).map((id) => getMitigation(id)?.name ?? id).join("; ") || t.mitigations.join("; ") || "—"}`,
      ...(t.implementedMitigationIds?.length
        ? [
            `Implemented: ${t.implementedMitigationIds.map((id) => getMitigation(id)?.name ?? id).join("; ")}`,
          ]
        : []),
      ...(t.owaspMapping?.length
        ? [
            `OWASP ASI: ${t.owaspMapping.map((m) => `${m.asiId} ${m.asiName} (${m.confidence})`).join("; ")}`,
          ]
        : []),
      ...(t.ciscoMapping?.length
        ? [`Cisco: ${t.ciscoMapping.map((m) => `${m.objectiveId} ${m.objectiveName}`).join("; ")}`]
        : []),
      ...(t.aisvs?.length ? [`AISVS: ${t.aisvs.join(", ")}`] : []),
      ...(t.statusJustification ? [`Justification: ${t.statusJustification}`] : []),
    ],
  }));
  sections.push({
    id: "threats",
    title: "Threats",
    tables: inherited.length ? [register, inheritedTable] : [register],
    children: details,
  });

  // 6. Attack paths
  sections.push({
    id: "paths",
    title: "Attack paths",
    tables: [
      {
        id: "paths",
        columns: [
          "#",
          "Path",
          "Hops",
          "Likelihood",
          "Target impact",
          "Score",
          "Residual",
          "Gates passed",
        ],
        rows: analysis.paths.paths.map((p, i) => [
          String(i + 1),
          p.nodes.map(L).join(" → "),
          String(p.hops.length),
          p.likelihood.toFixed(2),
          `${p.targetImpact}/5`,
          String(p.score),
          String(p.residualScore),
          p.gatesPassed.join(", ") || "—",
        ]),
        note: analysis.paths.truncated
          ? `Showing ${analysis.paths.paths.length} of ${analysis.paths.total} paths (highest scores first).`
          : analysis.paths.brokenByGates
            ? `${analysis.paths.brokenByGates} path(s) are broken by human approval gates.`
            : undefined,
      },
    ],
  });

  // 7. Compliance
  sections.push({
    id: "compliance",
    title: "Compliance (indicative)",
    paragraphs: [
      "Verdicts are derived from the diagram (topology, flow posture, declared semantics and implemented mitigations). They indicate where evidence is present or missing; they are not an audit.",
    ],
    tables: [
      {
        id: "aisvs",
        title: `OWASP AISVS ${comp.aisvs.version} chapters`,
        columns: ["Chapter", "Name", "Verdict", "Evidence"],
        rows: comp.aisvs.chapters.map((c) => [
          c.code,
          c.name,
          c.verdict,
          c.evidence.join("; ") || "—",
        ]),
        note: `${comp.aisvs.summary.met} met, ${comp.aisvs.summary.partial} partial, ${comp.aisvs.summary.gap} gap, ${comp.aisvs.summary.notApplicable} not applicable — ${comp.aisvs.summary.percent} % of applicable chapters met.`,
      },
      {
        id: "checks",
        title: "Architecture checks",
        columns: ["Check", "Title", "Verdict", "AISVS", "AIUC-1", "Evidence"],
        rows: comp.checks.map((c) => [
          c.id,
          c.title,
          c.verdict,
          c.aisvs.join(", "),
          c.aiuc1.join(", "),
          c.evidence.join("; ") || "—",
        ]),
      },
      {
        id: "aiuc1",
        title: `AIUC-1 ${comp.aiuc1.version ?? ""} — ${comp.aiuc1.verdictLabel} (${comp.aiuc1.overallScore} %)`,
        columns: [
          "Requirement",
          "Title",
          "Principle",
          "Application",
          "Verdict",
          "Basis",
          "Recommendation",
        ],
        rows: comp.aiuc1.requirements.map((r) => [
          r.requirementId,
          r.requirementTitle,
          r.principle,
          r.application,
          r.assessable === false ? "not assessable" : r.status,
          r.matchedVia,
          r.recommendation,
        ]),
        note: comp.aiuc1.retired?.length
          ? `Retired in this release (not scored): ${comp.aiuc1.retired.join(", ")}.`
          : undefined,
      },
      {
        id: "dataflow",
        title: "Data-flow violations",
        columns: ["Severity", "Violation", "Flow", "Rule"],
        rows: comp.dataFlow.map((v) => [
          cap(v.severity),
          v.name,
          v.affectedNodeIds.map(L).join(" → "),
          v.rule,
        ]),
      },
    ],
  });

  // 8. Mitigation plan
  const workItems = buildWorkItems(doc, analysis);
  sections.push({
    id: "mitigations",
    title: "Mitigation plan",
    tables: [
      {
        id: "work-items",
        columns: [
          "Mitigation",
          "Component",
          "Threats addressed",
          "Status",
          "Owner",
          "Due",
          "Effectiveness",
        ],
        rows: workItems.map((w) => [
          w.mitigation,
          w.component,
          String(w.threatCount),
          w.status,
          w.owner,
          w.due,
          `${Math.round(w.effectiveness * 100)} %`,
        ]),
      },
    ],
  });

  // 9. Risk decisions and approval
  const decided = threats.filter((t) => t.status && t.status !== "open");
  sections.push({
    id: "decisions",
    title: "Risk decisions and approval",
    tables: [
      {
        id: "decisions",
        columns: ["Rule", "Threat", "Component", "Status", "Justification", "Owner", "Evidence"],
        rows: decided.map((t) => [
          t.ruleId ?? "",
          t.name,
          threatComponents(t, labels),
          t.status ?? "",
          t.statusJustification ?? "",
          t.owner ?? "",
          t.evidenceUrl ?? "",
        ]),
      },
    ],
  });

  // 10. Appendix — rules that fired
  const fired = Object.entries(analysis.summary.byRule).sort(([a], [b]) => (a < b ? -1 : 1));
  sections.push({
    id: "rules",
    title: "Appendix: rules that fired",
    tables: [
      {
        id: "rules",
        columns: ["Rule", "Title", "Scope", "Findings", "Reference"],
        rows: fired.map(([id, n]) => {
          const r = getRule(id);
          return [
            id,
            r?.title ?? id,
            r?.scope ?? "custom",
            String(n),
            r?.references?.[0]?.url ?? "",
          ];
        }),
      },
    ],
  });

  return {
    title: options.title ?? "Threat Model Report",
    modelName: doc.name ?? "Untitled model",
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    engineVersion: analysis.engineVersion,
    indicativeNote: "Indicative assessment generated from the architecture diagram.",
    headline: {
      score: ms.overall,
      label: ms.label,
      inherent: ms.inherent,
      threats: threats.length,
      open: analysis.summary.open,
      mitigated: analysis.summary.mitigated,
      inherited: inherited.length,
      bySeverity,
      components: nodes.length,
      flows: doc.edges.length,
      boundaries: boundaries.length,
      paths: analysis.paths.total,
      pathsTruncated: analysis.paths.truncated,
    },
    sections,
    workItems,
    approval: [
      { role: "Prepared by", name: "", date: "" },
      { role: "Reviewed by", name: "", date: "" },
      { role: "Risk owner approval", name: "", date: "" },
    ],
    labels,
  };
}

import { MAESTRO_LAYER_LABELS, type CanvasNode, type GeneratedThreat } from "../types";
import type { AnalysisResult } from "../engine/analyze";
import { getMitigation } from "../engine/catalog/mitigations";
import { buildWorkItems, componentLabels, type ReportDocumentLike } from "./reportModel";
import { downloadBlob, exportFilename } from "./download";

/** UTF-8 byte-order mark so Excel opens the file as UTF-8 (P3-42). */
export const CSV_BOM = "﻿";

/**
 * RFC 4180 cell. Text that a spreadsheet would run as a formula (leading
 * = + - @ tab or CR) gets a leading apostrophe (OWASP CSV-injection guidance).
 */
export function csvCell(v: unknown): string {
  let s = v === undefined || v === null ? "" : String(v);
  if (typeof v === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n']/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(header: string[], rows: unknown[][]): string {
  return CSV_BOM + [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

const THREAT_HEADER = [
  "Threat ID",
  "Rule",
  "Severity",
  "Likelihood",
  "Impact",
  "Score",
  "Residual",
  "Name",
  "Description",
  "Components",
  "Flows",
  "MAESTRO layer",
  "Inherited",
  "Status",
  "Justification",
  "Owner",
  "Due",
  "OWASP ASI",
  "Cisco",
  "AISVS",
  "Mitigations",
  "Implemented mitigations",
];

/** The one threats CSV (panel "export selected" and toolbar export both use it). */
export function buildThreatsCsv(
  threats: GeneratedThreat[],
  nodes: CanvasNode[] = [],
  edgeLabels: Record<string, string> = {},
): string {
  const labels = componentLabels(nodes);
  const rows = threats.map((t) => [
    t.id,
    t.ruleId ?? "",
    t.severity,
    t.likelihood ?? "",
    t.impact ?? "",
    t.score ?? "",
    t.residualScore ?? "",
    t.name,
    t.description,
    t.affectedNodeIds.map((id) => labels[id] ?? id).join("; "),
    t.affectedEdgeIds.map((id) => edgeLabels[id] ?? id).join("; "),
    t.maestroLayer !== undefined ? MAESTRO_LAYER_LABELS[t.maestroLayer] : "",
    t.inherited ? "Yes" : "No",
    t.status ?? (t.mitigationState === "mitigated" ? "mitigated" : "open"),
    t.statusJustification ?? "",
    t.owner ?? "",
    t.due ?? "",
    (t.owaspMapping ?? [])
      .filter((m) => m.confidence !== "low")
      .map((m) => `${m.asiId} ${m.asiName}`)
      .join("; "),
    (t.ciscoMapping ?? []).map((m) => `${m.objectiveId} ${m.objectiveName}`).join("; "),
    (t.aisvs ?? []).join("; "),
    (t.mitigationIds ?? []).map((id) => getMitigation(id)?.name ?? id).join("; ") ||
      t.mitigations.join("; "),
    (t.implementedMitigationIds ?? []).map((id) => getMitigation(id)?.name ?? id).join("; "),
  ]);
  return toCsv(THREAT_HEADER, rows);
}

/** Edge id → "Source → Target (label)" for CSV/SARIF display. */
export function edgeLabelMap(
  doc: Pick<ReportDocumentLike, "nodes" | "edges">,
): Record<string, string> {
  const labels = componentLabels(doc.nodes);
  return Object.fromEntries(
    doc.edges.map((e) => [
      e.id,
      `${labels[e.source] ?? e.source} → ${labels[e.target] ?? e.target}${e.data?.label ? ` (${e.data.label})` : ""}`,
    ]),
  );
}

/** "Mitigations as work items": one row per mitigation × component (Jira/Linear import). */
export function buildWorkItemsCsv(doc: ReportDocumentLike, analysis: AnalysisResult): string {
  const items = buildWorkItems(doc, analysis);
  return toCsv(
    [
      "Summary",
      "Mitigation ID",
      "Mitigation",
      "Component",
      "Threats addressed",
      "Threat count",
      "Status",
      "Owner",
      "Due",
      "Effectiveness",
      "Control",
    ],
    items.map((w) => [
      `${w.mitigation} — ${w.component}`,
      w.mitigationId,
      w.mitigation,
      w.component,
      w.threats.join("; "),
      w.threatCount,
      w.status,
      w.owner,
      w.due,
      `${Math.round(w.effectiveness * 100)}%`,
      w.controlId ?? "",
    ]),
  );
}

export function exportThreatsCSV(
  analysis: Pick<AnalysisResult, "threats">,
  doc: Pick<ReportDocumentLike, "nodes" | "edges"> & { name?: string } = { nodes: [], edges: [] },
  filename?: string,
): void {
  downloadBlob(
    buildThreatsCsv(analysis.threats, doc.nodes, edgeLabelMap(doc)),
    filename ?? exportFilename(doc.name, "csv"),
    "text/csv;charset=utf-8",
  );
}

export function exportWorkItemsCSV(
  doc: ReportDocumentLike,
  analysis: AnalysisResult,
  filename?: string,
): void {
  downloadBlob(
    buildWorkItemsCsv(doc, analysis),
    filename ?? exportFilename(`${doc.name ?? "model"}-work-items`, "csv"),
    "text/csv;charset=utf-8",
  );
}

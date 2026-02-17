import { type ThreatAnalysisResult, MAESTRO_LAYER_LABELS } from "../types";

export function exportThreatsCSV(result: ThreatAnalysisResult, filename?: string): void {
  const headers = [
    "Severity",
    "Name",
    "Description",
    "Methodology",
    "MAESTRO Layer",
    "Inherited",
    "Status",
    "Status Justification",
    "Affected Components",
    "Mitigations",
  ];
  const rows = result.threats.map((t) => [
    t.severity,
    `"${t.name.replace(/"/g, '""')}"`,
    `"${t.description.replace(/"/g, '""')}"`,
    t.methodology,
    t.maestroLayer !== undefined ? MAESTRO_LAYER_LABELS[t.maestroLayer] : "",
    t.inherited ? "Yes" : "No",
    t.status ?? "open",
    `"${(t.statusJustification ?? "").replace(/"/g, '""')}"`,
    t.affectedNodeIds.join("; "),
    `"${t.mitigations.join("; ").replace(/"/g, '""')}"`,
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename ?? `threat-model-${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

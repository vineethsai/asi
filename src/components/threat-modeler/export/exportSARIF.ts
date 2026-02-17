import type { ThreatAnalysisResult } from "../types";

interface SARIFResult {
  ruleId: string;
  level: "error" | "warning" | "note";
  message: { text: string };
  locations: { physicalLocation: { artifactLocation: { uri: string } } }[];
}

const SEVERITY_TO_SARIF: Record<string, "error" | "warning" | "note"> = {
  critical: "error",
  high: "error",
  medium: "warning",
  low: "note",
};

export function exportSARIF(result: ThreatAnalysisResult, filename?: string): void {
  const rules = result.threats.map((t) => ({
    id: t.id,
    name: t.name,
    shortDescription: { text: t.name },
    fullDescription: { text: t.description },
    defaultConfiguration: { level: SEVERITY_TO_SARIF[t.severity] ?? "warning" },
    help: {
      text: t.mitigations.join(". "),
      markdown: t.mitigations.map((m) => `- ${m}`).join("\n"),
    },
  }));

  const results: SARIFResult[] = result.threats.map((t) => ({
    ruleId: t.id,
    level: SEVERITY_TO_SARIF[t.severity] ?? "warning",
    message: { text: `${t.severity.toUpperCase()}: ${t.name} - ${t.description}` },
    locations: t.affectedNodeIds.map((nid) => ({
      physicalLocation: { artifactLocation: { uri: `threat-model://components/${nid}` } },
    })),
    ...(t.status
      ? {
          properties: {
            threatStatus: t.status,
            ...(t.statusJustification ? { statusJustification: t.statusJustification } : {}),
          },
        }
      : {}),
  }));

  const sarif = {
    $schema:
      "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/main/sarif-2.1/schema/sarif-schema-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: "ASI Threat Modeler",
            version: "1.0.0",
            informationUri: "https://vineethsai.github.io/asi/threat-modeler",
            rules,
          },
        },
        results,
      },
    ],
  };

  const blob = new Blob([JSON.stringify(sarif, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename ?? `threat-model-${Date.now()}.sarif.json`;
  link.click();
  URL.revokeObjectURL(url);
}

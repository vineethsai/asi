import type { GeneratedThreat, Severity } from "../types";
import { type AnalysisResult, ENGINE_VERSION } from "../engine/analyze";
import { getMitigation, getRule } from "../engine/catalog";
import { SECURITY_SEVERITY, SEVERITY_ORDER } from "../engine/severity";
import { stableHash } from "../engine/hash";
import { componentLabels, type ReportDocumentLike } from "./reportModel";
import { downloadBlob, exportFilename } from "./download";

/** SARIF 2.1.0 (P3-41): catalog rule ids, logical locations, stable fingerprints. */
export const SARIF_SCHEMA = "https://json.schemastore.org/sarif-2.1.0.json";
export const INFORMATION_URI = "https://agenticsecurity.info";
export const ruleHelpUri = (ruleId: string) =>
  `${INFORMATION_URI}/threat-modeler-guide#rule-${encodeURIComponent(ruleId.toLowerCase())}`;

type Level = "error" | "warning" | "note";
const LEVEL: Record<Severity, Level> = {
  critical: "error",
  high: "error",
  medium: "warning",
  low: "note",
};

/** Stable fingerprint of a finding: rule + component key (never positions or run order). */
export function threatFingerprint(
  t: Pick<GeneratedThreat, "id" | "ruleId" | "componentKey">,
): string {
  return stableHash(`${t.ruleId ?? ""}::${t.componentKey ?? t.id}`);
}

const pascal = (s: string) =>
  s
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join("");

export interface SarifOptions {
  /** Previous run's threat ids → baselineState new/unchanged. */
  previousThreatIds?: string[];
  /** Committed model file the findings refer to (adds a physical location). */
  artifactUri?: string;
}

export function buildSarif(
  analysis: Pick<AnalysisResult, "threats"> &
    Partial<Pick<AnalysisResult, "modelScore" | "engineVersion">>,
  doc: Pick<ReportDocumentLike, "nodes"> & { name?: string } = { nodes: [] },
  options: SarifOptions = {},
) {
  const labels = componentLabels(doc.nodes);
  const threats = [...analysis.threats].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const prev = options.previousThreatIds ? new Set(options.previousThreatIds) : null;

  // One rule per catalog rule id (not per instance), worst instance severity as default.
  const ruleIds = [...new Set(threats.map((t) => t.ruleId ?? t.id))].sort();
  const worst = new Map<string, Severity>();
  for (const t of threats) {
    const id = t.ruleId ?? t.id;
    const cur = worst.get(id);
    if (!cur || SEVERITY_ORDER[t.severity] > SEVERITY_ORDER[cur]) worst.set(id, t.severity);
  }
  const rules = ruleIds.map((id) => {
    const r = getRule(id);
    const sample = threats.find((t) => (t.ruleId ?? t.id) === id)!;
    const sev = worst.get(id)!;
    const mitigations = (r?.mitigationIds ?? sample.mitigationIds ?? []).map(
      (m) => getMitigation(m)?.name ?? m,
    );
    const asi = r?.maps.owaspAsi ?? [];
    return {
      id,
      name: pascal(r?.title ?? sample.name),
      shortDescription: { text: r?.title ?? sample.name },
      fullDescription: { text: r?.description ?? sample.description },
      helpUri: ruleHelpUri(id),
      help: {
        text: mitigations.length
          ? `Mitigations: ${mitigations.join("; ")}`
          : (r?.description ?? sample.description),
        markdown: mitigations.length
          ? `**Mitigations**\n\n${mitigations.map((m) => `- ${m}`).join("\n")}${
              r?.references?.length
                ? `\n\n**References**\n\n${r.references.map((x) => `- [${x.title}](${x.url})`).join("\n")}`
                : ""
            }`
          : (r?.description ?? sample.description),
      },
      defaultConfiguration: { level: LEVEL[sev] },
      properties: {
        tags: [
          "security",
          "threat-model",
          "agentic-ai",
          ...asi,
          ...(r?.maps.aisvs ?? []).map((a) => `AISVS-${a}`),
        ],
        precision: "medium",
        "security-severity": SECURITY_SEVERITY[sev].toFixed(1),
        scope: r?.scope ?? "node",
      },
    };
  });
  const ruleIndex = new Map(ruleIds.map((id, i) => [id, i]));

  const results = threats.map((t) => {
    const ruleId = t.ruleId ?? t.id;
    const closed = t.status === "mitigated" || t.mitigationState === "mitigated";
    const suppressed =
      t.status === "accepted" ||
      t.status === "false-positive" ||
      t.status === "transferred" ||
      closed;
    const components = t.affectedNodeIds.length ? t.affectedNodeIds : ["model"];
    return {
      ruleId,
      ruleIndex: ruleIndex.get(ruleId)!,
      level: LEVEL[t.severity],
      message: {
        text: `${t.name}: ${t.description}${t.why?.evidence?.length ? ` Evidence: ${t.why.evidence.join("; ")}.` : ""}`,
      },
      locations: [
        {
          ...(options.artifactUri
            ? {
                physicalLocation: {
                  artifactLocation: { uri: options.artifactUri, uriBaseId: "%SRCROOT%" },
                },
              }
            : {}),
          logicalLocations: components.map((id) => ({
            name: labels[id] ?? id,
            fullyQualifiedName: `${doc.name ?? "model"}/${labels[id] ?? id}`,
            kind: "component",
          })),
        },
      ],
      partialFingerprints: { "threatId/v1": threatFingerprint(t) },
      ...(prev ? { baselineState: prev.has(t.id) ? "unchanged" : "new" } : {}),
      ...(suppressed
        ? {
            suppressions: [
              {
                kind: "external",
                status: "accepted",
                justification:
                  t.statusJustification ??
                  (closed
                    ? `Mitigated${t.implementedMitigationIds?.length ? `: ${t.implementedMitigationIds.map((m) => getMitigation(m)?.name ?? m).join("; ")}` : ""}`
                    : `Status: ${t.status}`),
              },
            ],
          }
        : {}),
      properties: {
        "security-severity": SECURITY_SEVERITY[t.severity].toFixed(1),
        severity: t.severity,
        likelihood: t.likelihood,
        impact: t.impact,
        score: t.score,
        residualScore: t.residualScore,
        inherited: t.inherited,
        componentKey: t.componentKey,
        threatId: t.id,
        status: t.status ?? "open",
        owaspAsi: (t.owaspMapping ?? []).map((m) => m.asiId),
        cisco: (t.ciscoMapping ?? []).map((m) => m.objectiveId),
        aisvs: t.aisvs ?? [],
      },
    };
  });

  return {
    $schema: SARIF_SCHEMA,
    version: "2.1.0" as const,
    runs: [
      {
        tool: {
          driver: {
            name: "Agentic Security Threat Modeler",
            version: analysis.engineVersion ?? ENGINE_VERSION,
            semanticVersion: analysis.engineVersion ?? ENGINE_VERSION,
            informationUri: INFORMATION_URI,
            rules,
          },
        },
        automationDetails: {
          id: `threat-model/${(doc.name ?? "model").toLowerCase().replace(/[^a-z0-9]+/g, "-")}/`,
        },
        results,
        ...(analysis.modelScore
          ? {
              properties: {
                modelScore: analysis.modelScore.overall,
                modelScoreLabel: analysis.modelScore.label,
              },
            }
          : {}),
      },
    ],
  };
}

export function exportSARIF(
  analysis: Parameters<typeof buildSarif>[0],
  doc: Parameters<typeof buildSarif>[1] = { nodes: [] },
  options: SarifOptions = {},
  filename?: string,
): void {
  downloadBlob(
    JSON.stringify(buildSarif(analysis, doc, options), null, 2),
    filename ?? exportFilename(doc.name, "sarif"),
    "application/sarif+json",
  );
}

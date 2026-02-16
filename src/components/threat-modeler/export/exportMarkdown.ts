import {
  type CanvasNode,
  type CanvasEdge,
  type ThreatAnalysisResult,
  MAESTRO_LAYER_LABELS,
} from "../types";
import type { ModelRiskSummary } from "../engine/riskScoring";
import type { AttackPath } from "../engine/attackPaths";
import type { AISVSCoverageResult } from "../engine/aisvsMapping";

interface ReportOptions {
  riskSummary?: ModelRiskSummary | null;
  attackPaths?: AttackPath[];
  aisvsResult?: AISVSCoverageResult | null;
}

export function generateMarkdownReport(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  result: ThreatAnalysisResult,
  options: ReportOptions = {},
): string {
  const { riskSummary, attackPaths, aisvsResult } = options;
  let md = `# Threat Model Report\n\n`;
  md += `**Generated:** ${new Date().toISOString()}\n`;
  md += `**Methodology:** MAESTRO 7-Layer Analysis\n\n`;
  md += `---\n\n`;

  // ─── Executive Summary ───────────────────────────────────
  md += `## Executive Summary\n\n`;
  md += `| Metric | Value |\n|---|---|\n`;
  md += `| Total Components | ${nodes.filter((n) => n.type !== "trustBoundary").length} |\n`;
  md += `| Data Flows | ${edges.length} |\n`;
  md += `| Total Threats | ${result.summary.total} |\n`;
  md += `| Critical | ${result.summary.critical} |\n`;
  md += `| High | ${result.summary.high} |\n`;
  md += `| Medium | ${result.summary.medium} |\n`;
  md += `| Low | ${result.summary.low} |\n`;
  md += `| Inherited | ${result.summary.inherited} |\n`;
  if (result.summary.mitigated) md += `| Mitigated | ${result.summary.mitigated} |\n`;
  md += "\n";

  // ─── Risk Assessment ─────────────────────────────────────
  if (riskSummary) {
    md += `## Risk Assessment\n\n`;
    md += `| Metric | Value |\n|---|---|\n`;
    md += `| Overall Risk Score | **${riskSummary.overallScore}** |\n`;
    md += `| Severity | **${riskSummary.severityLabel}** |\n\n`;

    if (riskSummary.topRisks.length > 0) {
      md += `### Top Risk Components\n\n`;
      md += `| Component | Risk Score |\n|---|---|\n`;
      for (const risk of riskSummary.topRisks) {
        md += `| ${risk.name} | ${risk.score} |\n`;
      }
      md += "\n";
    }
  }

  // ─── AISVS Compliance ────────────────────────────────────
  if (aisvsResult && aisvsResult.totalRequirements > 0) {
    const pct = Math.round(
      (aisvsResult.identifiedRequirements / aisvsResult.totalRequirements) * 100,
    );
    const addressedPct = Math.round(
      (aisvsResult.addressedRequirements / aisvsResult.totalRequirements) * 100,
    );
    md += `## AISVS Compliance Coverage\n\n`;
    md += `| Metric | Value |\n|---|---|\n`;
    md += `| Total Requirements | ${aisvsResult.totalRequirements} |\n`;
    md += `| Identified | ${aisvsResult.identifiedRequirements} (${pct}%) |\n`;
    md += `| Addressed (mitigated) | ${aisvsResult.addressedRequirements} (${addressedPct}%) |\n`;
    md += `| Gaps | ${aisvsResult.gapRequirements} |\n\n`;

    md += `### Coverage by Category\n\n`;
    md += `| Category | Identified | Addressed | Total | Coverage |\n|---|---|---|---|---|\n`;
    for (const [cat, stats] of Object.entries(aisvsResult.coverageByCategory).sort(([a], [b]) =>
      a.localeCompare(b),
    )) {
      const catPct =
        stats.total > 0
          ? Math.round(((stats.identified + stats.addressed) / stats.total) * 100)
          : 0;
      md += `| ${cat} | ${stats.identified} | ${stats.addressed} | ${stats.total} | ${catPct}% |\n`;
    }
    md += "\n";
  }

  // ─── Attack Paths ────────────────────────────────────────
  if (attackPaths && attackPaths.length > 0) {
    md += `## Attack Paths\n\n`;
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const topPaths = attackPaths.slice(0, 10);
    for (let i = 0; i < topPaths.length; i++) {
      const path = topPaths[i];
      const pathLabels = path.nodes.map((nId) => nodeMap.get(nId)?.data?.label ?? nId.slice(0, 8));
      md += `### Path ${i + 1} (${path.severity.toUpperCase()}, score: ${path.score})\n\n`;
      md += `\`${pathLabels.join(" → ")}\`\n\n`;
      if (path.threats.length > 0) {
        md += `Threats along path:\n`;
        for (const t of path.threats.slice(0, 5)) {
          md += `- ${t}\n`;
        }
        md += "\n";
      }
    }
  }

  // ─── Cisco Taxonomy Mapping ─────────────────────────────
  const ciscoThreats = result.threats.filter((t) => t.ciscoMapping && t.ciscoMapping.length > 0);
  if (ciscoThreats.length > 0) {
    md += `## Cisco AI Security Taxonomy Mapping\n\n`;
    const ciscoMap = new Map<string, { name: string; count: number; techniques: Set<string> }>();
    for (const t of ciscoThreats) {
      for (const m of t.ciscoMapping!) {
        const existing = ciscoMap.get(m.objectiveId);
        if (existing) {
          existing.count++;
          m.techniques?.forEach((tech) => existing.techniques.add(tech));
        } else {
          ciscoMap.set(m.objectiveId, {
            name: m.objectiveName,
            count: 1,
            techniques: new Set(m.techniques ?? []),
          });
        }
      }
    }
    md += `| Objective ID | Objective Name | Threats Mapped |\n|---|---|---|\n`;
    for (const [id, data] of Array.from(ciscoMap.entries()).sort(
      (a, b) => b[1].count - a[1].count,
    )) {
      md += `| ${id} | ${data.name} | ${data.count} |\n`;
    }
    md += "\n";
  }

  // ─── OWASP Agentic Top 10 Mapping ─────────────────────────
  const owaspThreats = result.threats.filter((t) => t.owaspMapping && t.owaspMapping.length > 0);
  if (owaspThreats.length > 0) {
    md += `## OWASP Agentic Top 10 Mapping\n\n`;
    const owaspMap = new Map<string, { name: string; high: number; med: number; low: number }>();
    for (const t of owaspThreats) {
      for (const m of t.owaspMapping!) {
        const existing = owaspMap.get(m.asiId);
        if (existing) {
          if (m.confidence === "high") existing.high++;
          else if (m.confidence === "medium") existing.med++;
          else existing.low++;
        } else {
          owaspMap.set(m.asiId, {
            name: m.asiName,
            high: m.confidence === "high" ? 1 : 0,
            med: m.confidence === "medium" ? 1 : 0,
            low: m.confidence === "low" ? 1 : 0,
          });
        }
      }
    }
    md += `| ASI ID | Category | High Confidence | Medium | Low |\n|---|---|---|---|---|\n`;
    for (const [id, data] of Array.from(owaspMap.entries()).sort(
      (a, b) => b[1].high + b[1].med - (a[1].high + a[1].med),
    )) {
      md += `| ${id} | ${data.name} | ${data.high} | ${data.med} | ${data.low} |\n`;
    }
    md += "\n";
  }

  // ─── Component Inventory ─────────────────────────────────
  md += `## Component Inventory\n\n`;
  md += `| Component | Type | Trust Level | Threats |\n|---|---|---|---|\n`;
  for (const node of nodes) {
    if (node.type === "trustBoundary") continue;
    const threatCount = result.threats.filter((t) => t.affectedNodeIds.includes(node.id)).length;
    md += `| ${node.data?.label ?? "Unknown"} | ${node.data?.category ?? "-"} | ${node.data?.trustLevel ?? "-"} | ${threatCount} |\n`;
  }
  md += "\n";

  // ─── Mitigation Status ───────────────────────────────────
  const nodesWithMitigations = nodes.filter((n) => n.data?.appliedMitigations?.length);
  if (nodesWithMitigations.length > 0) {
    md += `## Mitigation Status\n\n`;
    md += `| Component | Applied Controls | Status |\n|---|---|---|\n`;
    for (const node of nodesWithMitigations) {
      const count = node.data?.appliedMitigations?.length ?? 0;
      md += `| ${node.data?.label ?? "Unknown"} | ${count} | Active |\n`;
    }
    md += "\n";
  }

  // ─── Data Flow Inventory ─────────────────────────────────
  md += `## Data Flow Inventory\n\n`;
  md += `| Flow | Protocol | Encrypted | Auth | Classification | PII |\n|---|---|---|---|---|---|\n`;
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  for (const edge of edges) {
    const src = nodeMap.get(edge.source)?.data?.label ?? edge.source;
    const tgt = nodeMap.get(edge.target)?.data?.label ?? edge.target;
    const d = edge.data;
    md += `| ${src} -> ${tgt} | ${d?.protocol ?? "-"} | ${d?.encrypted ? "Yes" : "No"} | ${d?.authentication ?? "-"} | ${d?.dataClassification ?? "-"} | ${d?.containsPII ? "Yes" : "No"} |\n`;
  }
  md += "\n";

  // ─── Threats ─────────────────────────────────────────────
  const severityOrder = ["critical", "high", "medium", "low"];
  const sorted = [...result.threats].sort(
    (a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity),
  );

  md += `## Threats\n\n`;
  for (const threat of sorted) {
    md += `### ${threat.severity.toUpperCase()}: ${threat.name}\n\n`;
    md += `${threat.description}\n\n`;
    md += `- **Methodology:** ${threat.methodology}\n`;
    if (threat.maestroLayer !== undefined)
      md += `- **MAESTRO Layer:** ${MAESTRO_LAYER_LABELS[threat.maestroLayer]}\n`;
    if (threat.inherited) md += `- **Inherited:** Yes\n`;
    if (threat.ciscoMapping && threat.ciscoMapping.length > 0) {
      md += `- **Cisco Taxonomy:** ${threat.ciscoMapping.map((m) => `${m.objectiveId} (${m.objectiveName})`).join(", ")}\n`;
    }
    if (threat.owaspMapping && threat.owaspMapping.length > 0) {
      const highMed = threat.owaspMapping.filter((m) => m.confidence !== "low");
      if (highMed.length > 0) {
        md += `- **OWASP Agentic:** ${highMed.map((m) => `${m.asiId} (${m.asiName})`).join(", ")}\n`;
      }
    }
    if (threat.mitigations.length > 0) {
      md += `- **Mitigations:**\n`;
      threat.mitigations.forEach((m) => {
        md += `  - ${m}\n`;
      });
    }
    md += "\n";
  }

  // ─── Prioritized Remediation ─────────────────────────────
  if (riskSummary && riskSummary.topRisks.length > 0) {
    md += `## Prioritized Remediation Plan\n\n`;
    md += `The following components have the highest residual risk and should be addressed first:\n\n`;
    for (let i = 0; i < riskSummary.topRisks.length; i++) {
      const risk = riskSummary.topRisks[i];
      const compThreats = result.threats.filter((t) =>
        t.affectedNodeIds.some((nId) => {
          const node = nodeMap.get(nId);
          return node?.data?.label === risk.name;
        }),
      );
      const unmitigated = compThreats.filter((t) => t.mitigations.length === 0);
      md += `${i + 1}. **${risk.name}** (risk score: ${risk.score})\n`;
      if (unmitigated.length > 0) {
        md += `   - ${unmitigated.length} threat(s) without mitigations\n`;
        for (const t of unmitigated.slice(0, 3)) {
          md += `   - Address: ${t.name} (${t.severity})\n`;
        }
      } else {
        md += `   - All threats have mitigations defined; ensure implementation\n`;
      }
    }
    md += "\n";
  }

  return md;
}

export function downloadMarkdownReport(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  result: ThreatAnalysisResult,
  options: ReportOptions = {},
): void {
  const md = generateMarkdownReport(nodes, edges, result, options);
  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `threat-model-report-${Date.now()}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

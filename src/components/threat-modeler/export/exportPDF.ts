import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  type CanvasNode,
  type CanvasEdge,
  type ThreatAnalysisResult,
  MAESTRO_LAYER_LABELS,
} from "../types";
import type { ModelRiskSummary } from "../engine/riskScoring";
import type { AttackPath } from "../engine/attackPaths";
import type { AISVSCoverageResult } from "../engine/aisvsMapping";

interface PDFReportOptions {
  riskSummary?: ModelRiskSummary | null;
  attackPaths?: AttackPath[];
  aisvsResult?: AISVSCoverageResult | null;
  modelName?: string;
}

export function exportPDFReport(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  result: ThreatAnalysisResult,
  options: PDFReportOptions = {},
): void {
  const { riskSummary, attackPaths, aisvsResult, modelName } = options;
  const doc = new jsPDF();
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  let y = 20;

  const addPageCheck = (needed: number) => {
    if (y + needed > 270) {
      doc.addPage();
      y = 20;
    }
  };

  const sectionTitle = (title: string) => {
    addPageCheck(20);
    y += 6;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(title, 14, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
  };

  // ─── Title Page ────────────────────────────────────────────
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("Threat Model Report", 14, 40);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(modelName ?? "AI Security Threat Model", 14, 52);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 62);
  doc.text("Methodology: MAESTRO 7-Layer Analysis", 14, 70);
  doc.text(
    `Components: ${nodes.filter((n) => n.type !== "trustBoundary").length} | Data Flows: ${edges.length} | Threats: ${result.summary.total}`,
    14,
    78,
  );

  // ─── Executive Summary ─────────────────────────────────────
  y = 95;
  sectionTitle("Executive Summary");
  autoTable(doc, {
    startY: y,
    head: [["Metric", "Value"]],
    body: [
      ["Total Threats", String(result.summary.total)],
      ["Critical", String(result.summary.critical)],
      ["High", String(result.summary.high)],
      ["Medium", String(result.summary.medium)],
      ["Low", String(result.summary.low)],
      ["Inherited", String(result.summary.inherited)],
      ...(result.summary.mitigated ? [["Mitigated", String(result.summary.mitigated)]] : []),
    ],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [41, 128, 185] },
    margin: { left: 14 },
  });
  y = (doc as unknown as Record<string, number>).lastAutoTable?.finalY ?? y + 40;

  // ─── Risk Assessment ───────────────────────────────────────
  if (riskSummary) {
    sectionTitle("Risk Assessment");
    autoTable(doc, {
      startY: y,
      head: [["Metric", "Value"]],
      body: [
        ["Overall Risk Score", String(riskSummary.overallScore)],
        ["Severity", riskSummary.severityLabel],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [192, 57, 43] },
      margin: { left: 14 },
    });
    y = (doc as unknown as Record<string, number>).lastAutoTable?.finalY ?? y + 20;

    if (riskSummary.topRisks.length > 0) {
      addPageCheck(30);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Top Risk Components", 14, y + 8);
      y += 12;
      doc.setFont("helvetica", "normal");
      autoTable(doc, {
        startY: y,
        head: [["Component", "Risk Score"]],
        body: riskSummary.topRisks.map((r) => [r.name, String(r.score)]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [192, 57, 43] },
        margin: { left: 14 },
      });
      y = (doc as unknown as Record<string, number>).lastAutoTable?.finalY ?? y + 20;
    }
  }

  // ─── Threat Inventory ──────────────────────────────────────
  sectionTitle("Threat Inventory");
  const severityOrder = ["critical", "high", "medium", "low"];
  const sorted = [...result.threats].sort(
    (a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity),
  );

  autoTable(doc, {
    startY: y,
    head: [["Severity", "Name", "Methodology", "Layer", "Mitigations"]],
    body: sorted.map((t) => [
      t.severity.toUpperCase(),
      t.name.slice(0, 50),
      t.methodology,
      t.maestroLayer !== undefined ? MAESTRO_LAYER_LABELS[t.maestroLayer] : "-",
      String(t.mitigations.length),
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [44, 62, 80] },
    margin: { left: 14 },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 60 },
      4: { cellWidth: 20 },
    },
  });
  y = (doc as unknown as Record<string, number>).lastAutoTable?.finalY ?? y + 20;

  // ─── Component Inventory ───────────────────────────────────
  sectionTitle("Component Inventory");
  const compData = nodes
    .filter((n) => n.type !== "trustBoundary")
    .map((n) => [
      n.data?.label ?? "Unknown",
      n.data?.category ?? "-",
      n.data?.trustLevel ?? "-",
      String(result.threats.filter((t) => t.affectedNodeIds.includes(n.id)).length),
    ]);

  autoTable(doc, {
    startY: y,
    head: [["Component", "Type", "Trust Level", "Threats"]],
    body: compData,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [39, 174, 96] },
    margin: { left: 14 },
  });
  y = (doc as unknown as Record<string, number>).lastAutoTable?.finalY ?? y + 20;

  // ─── Attack Paths ─────────────────────────────────────────
  if (attackPaths && attackPaths.length > 0) {
    sectionTitle("Attack Paths (Top 10)");
    const pathData = attackPaths.slice(0, 10).map((path, i) => {
      const labels = path.nodes
        .map((nId) => nodeMap.get(nId)?.data?.label ?? nId.slice(0, 8))
        .join(" → ");
      return [String(i + 1), path.severity.toUpperCase(), String(path.score), labels.slice(0, 80)];
    });

    autoTable(doc, {
      startY: y,
      head: [["#", "Severity", "Score", "Path"]],
      body: pathData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [142, 68, 173] },
      margin: { left: 14 },
      columnStyles: { 0: { cellWidth: 10 }, 3: { cellWidth: 100 } },
    });
    y = (doc as unknown as Record<string, number>).lastAutoTable?.finalY ?? y + 20;
  }

  // ─── AISVS Compliance ─────────────────────────────────────
  if (aisvsResult && aisvsResult.totalRequirements > 0) {
    sectionTitle("AISVS Compliance Summary");
    const pct = Math.round(
      (aisvsResult.identifiedRequirements / aisvsResult.totalRequirements) * 100,
    );
    autoTable(doc, {
      startY: y,
      head: [["Metric", "Value"]],
      body: [
        ["Total Requirements", String(aisvsResult.totalRequirements)],
        ["Identified", `${aisvsResult.identifiedRequirements} (${pct}%)`],
        ["Addressed", String(aisvsResult.addressedRequirements)],
        ["Gaps", String(aisvsResult.gapRequirements)],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [22, 160, 133] },
      margin: { left: 14 },
    });
    y = (doc as unknown as Record<string, number>).lastAutoTable?.finalY ?? y + 20;
  }

  // ─── Cisco Taxonomy Mapping ────────────────────────────────
  const ciscoThreats = result.threats.filter((t) => t.ciscoMapping && t.ciscoMapping.length > 0);
  if (ciscoThreats.length > 0) {
    sectionTitle("Cisco AI Security Taxonomy Mapping");
    const ciscoMap = new Map<string, { name: string; count: number }>();
    for (const t of ciscoThreats) {
      for (const m of t.ciscoMapping!) {
        const existing = ciscoMap.get(m.objectiveId);
        if (existing) existing.count++;
        else ciscoMap.set(m.objectiveId, { name: m.objectiveName, count: 1 });
      }
    }

    autoTable(doc, {
      startY: y,
      head: [["Objective ID", "Objective Name", "Threat Count"]],
      body: Array.from(ciscoMap.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .map(([id, data]) => [id, data.name, String(data.count)]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [0, 151, 167] },
      margin: { left: 14 },
    });
    y = (doc as unknown as Record<string, number>).lastAutoTable?.finalY ?? y + 20;
  }

  // ─── OWASP Agentic Top 10 Mapping ─────────────────────────
  const owaspThreats = result.threats.filter((t) => t.owaspMapping && t.owaspMapping.length > 0);
  if (owaspThreats.length > 0) {
    sectionTitle("OWASP Agentic Top 10 Mapping");
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

    autoTable(doc, {
      startY: y,
      head: [["ASI ID", "Category", "High", "Medium", "Low"]],
      body: Array.from(owaspMap.entries())
        .sort((a, b) => b[1].high + b[1].med - (a[1].high + a[1].med))
        .map(([id, data]) => [
          id,
          data.name,
          String(data.high),
          String(data.med),
          String(data.low),
        ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [102, 51, 153] },
      margin: { left: 14 },
    });
    y = (doc as unknown as Record<string, number>).lastAutoTable?.finalY ?? y + 20;
  }

  // ─── Data Flow Inventory ───────────────────────────────────
  sectionTitle("Data Flow Inventory");
  const flowData = edges.map((e) => {
    const src = nodeMap.get(e.source)?.data?.label ?? e.source;
    const tgt = nodeMap.get(e.target)?.data?.label ?? e.target;
    const d = e.data;
    return [
      `${src} → ${tgt}`.slice(0, 40),
      d?.protocol ?? "-",
      d?.encrypted ? "Yes" : "No",
      d?.authentication ?? "-",
      d?.dataClassification ?? "-",
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [["Flow", "Protocol", "Encrypted", "Auth", "Classification"]],
    body: flowData,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [52, 73, 94] },
    margin: { left: 14 },
  });
  y = (doc as unknown as Record<string, number>).lastAutoTable?.finalY ?? y + 20;

  // ─── Prioritized Remediation ───────────────────────────────
  if (riskSummary && riskSummary.topRisks.length > 0) {
    sectionTitle("Prioritized Remediation Plan");
    const remData = riskSummary.topRisks.map((risk, i) => {
      const compThreats = result.threats.filter((t) =>
        t.affectedNodeIds.some((nId) => nodeMap.get(nId)?.data?.label === risk.name),
      );
      const unmitigated = compThreats.filter((t) => t.mitigations.length === 0);
      return [
        String(i + 1),
        risk.name,
        String(risk.score),
        unmitigated.length > 0 ? `${unmitigated.length} unmitigated threat(s)` : "All mitigated",
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [["Priority", "Component", "Risk Score", "Status"]],
      body: remData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [211, 84, 0] },
      margin: { left: 14 },
    });
  }

  doc.save(`threat-model-report-${Date.now()}.pdf`);
}

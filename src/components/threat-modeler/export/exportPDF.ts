import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { toPng } from "html-to-image";
import {
  type CanvasNode,
  type CanvasEdge,
  type ThreatAnalysisResult,
  type ThreatStatus,
  MAESTRO_LAYER_LABELS,
  MAESTRO_LAYER_COLORS,
} from "../types";
import type { ModelRiskSummary } from "../engine/riskScoring";
import type { AttackPath } from "../engine/attackPaths";
import type { AISVSCoverageResult } from "../engine/aisvsMapping";
import type { ComplianceViolation } from "../engine/dataFlowCompliance";
import type { ComplianceGapReport } from "../engine/complianceGap";
import type { AttackSurfaceScore } from "../engine/attackSurface";

interface PDFReportOptions {
  riskSummary?: ModelRiskSummary | null;
  attackPaths?: AttackPath[];
  aisvsResult?: AISVSCoverageResult | null;
  complianceViolations?: ComplianceViolation[];
  complianceGapReport?: ComplianceGapReport | null;
  attackSurfaceScores?: AttackSurfaceScore[];
  canvasElement?: HTMLElement | null;
  modelName?: string;
  threatStatuses?: Map<string, { status: ThreatStatus; justification?: string }>;
}

const PAGE_WIDTH = 210;
const MARGIN = 14;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const SEVERITY_FILL: Record<string, [number, number, number]> = {
  critical: [220, 38, 38],
  high: [249, 115, 22],
  medium: [234, 179, 8],
  low: [59, 130, 246],
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

async function captureCanvasImage(element: HTMLElement): Promise<string | null> {
  try {
    const isDark = document.documentElement.classList.contains("dark");
    return await toPng(element, {
      backgroundColor: isDark ? "#1e1e2e" : "#ffffff",
      pixelRatio: 2,
      filter: (node) => {
        const exclude = ["react-flow__minimap", "react-flow__controls", "react-flow__panel"];
        return !exclude.some((cls) => node.classList?.contains(cls));
      },
    });
  } catch {
    return null;
  }
}

export async function exportPDFReport(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  result: ThreatAnalysisResult,
  options: PDFReportOptions = {},
): Promise<void> {
  const {
    riskSummary,
    attackPaths,
    aisvsResult,
    complianceViolations,
    complianceGapReport,
    attackSurfaceScores,
    canvasElement,
    modelName,
    threatStatuses,
  } = options;

  const doc = new jsPDF();
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  let y = 20;

  const getY = (): number =>
    (doc as unknown as Record<string, Record<string, number>>).lastAutoTable?.finalY ?? y;

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
    doc.setDrawColor(41, 128, 185);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, y + 2, MARGIN + CONTENT_WIDTH, y + 2);
    doc.text(title, MARGIN, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
  };

  const subTitle = (title: string) => {
    addPageCheck(14);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(title, MARGIN, y + 6);
    y += 10;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
  };

  const componentCount = nodes.filter((n) => n.type !== "trustBoundary").length;
  const boundaryCount = nodes.filter((n) => n.type === "trustBoundary").length;
  const genDate = new Date().toLocaleString();

  // ─── Title Page ──────────────────────────────────────────────
  doc.setFillColor(41, 128, 185);
  doc.rect(0, 0, PAGE_WIDTH, 8, "F");

  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(41, 128, 185);
  doc.text("Threat Model Report", MARGIN, 30);
  doc.setTextColor(0, 0, 0);

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text(modelName ?? "AI Security Threat Model", MARGIN, 42);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${genDate}`, MARGIN, 54);
  doc.text("Methodology: MAESTRO 7-Layer Analysis", MARGIN, 62);
  doc.setTextColor(0, 0, 0);

  doc.setFontSize(9);
  const summaryMetrics = [
    `Components: ${componentCount}`,
    `Trust Boundaries: ${boundaryCount}`,
    `Data Flows: ${edges.length}`,
    `Threats: ${result.summary.total}`,
    `Critical: ${result.summary.critical}`,
    `High: ${result.summary.high}`,
  ];
  doc.text(summaryMetrics.join("  |  "), MARGIN, 72);

  // Risk score badge on title page
  if (riskSummary) {
    const rColor: [number, number, number] =
      riskSummary.overallScore >= 80
        ? [220, 38, 38]
        : riskSummary.overallScore >= 60
          ? [249, 115, 22]
          : riskSummary.overallScore >= 40
            ? [234, 179, 8]
            : [34, 197, 94];
    doc.setFillColor(...rColor);
    doc.roundedRect(150, 24, 46, 30, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(String(riskSummary.overallScore), 173, 38, { align: "center" });
    doc.setFontSize(8);
    doc.text(riskSummary.severityLabel, 173, 48, { align: "center" });
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
  }

  // ─── Architecture Diagram ───────────────────────────────────
  let canvasImage: string | null = null;
  if (canvasElement) {
    canvasImage = await captureCanvasImage(canvasElement);
  }

  if (canvasImage) {
    y = 82;
    addPageCheck(130);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Architecture Diagram", MARGIN, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    try {
      const img = new Image();
      img.src = canvasImage;
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
        setTimeout(resolve, 2000);
      });

      const imgW = img.naturalWidth || 800;
      const imgH = img.naturalHeight || 600;
      const maxW = CONTENT_WIDTH;
      const maxH = 120;
      const scale = Math.min(maxW / imgW, maxH / imgH);
      const drawW = imgW * scale;
      const drawH = imgH * scale;

      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.rect(MARGIN, y, drawW, drawH);
      doc.addImage(canvasImage, "PNG", MARGIN, y, drawW, drawH);
      y += drawH + 6;
    } catch {
      y += 4;
    }
  } else {
    y = 82;
  }

  // ─── Threat Status Summary ──────────────────────────────────
  const statusCounts = { open: 0, mitigated: 0, accepted: 0, transferred: 0, "false-positive": 0 };
  for (const t of result.threats) {
    const s = t.status ?? threatStatuses?.get(t.id)?.status ?? "open";
    statusCounts[s]++;
  }
  const addressed = result.summary.total - statusCounts.open;

  if (result.summary.total > 0) {
    sectionTitle("Threat Status Overview");
    autoTable(doc, {
      startY: y,
      head: [["Status", "Count", "Percentage"]],
      body: [
        [
          "Open",
          String(statusCounts.open),
          `${Math.round((statusCounts.open / result.summary.total) * 100)}%`,
        ],
        [
          "Mitigated",
          String(statusCounts.mitigated),
          `${Math.round((statusCounts.mitigated / result.summary.total) * 100)}%`,
        ],
        [
          "Accepted",
          String(statusCounts.accepted),
          `${Math.round((statusCounts.accepted / result.summary.total) * 100)}%`,
        ],
        [
          "Transferred",
          String(statusCounts.transferred),
          `${Math.round((statusCounts.transferred / result.summary.total) * 100)}%`,
        ],
        [
          "False Positive",
          String(statusCounts["false-positive"]),
          `${Math.round((statusCounts["false-positive"] / result.summary.total) * 100)}%`,
        ],
        [
          "TOTAL ADDRESSED",
          String(addressed),
          `${Math.round((addressed / result.summary.total) * 100)}%`,
        ],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [39, 174, 96] },
      margin: { left: MARGIN },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      didParseCell: (data: any) => {
        if (data.row.index === 5) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [240, 240, 240];
        }
      },
    });
    y = getY() + 6;
  }

  // ─── Executive Summary ──────────────────────────────────────
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
      [
        "By Methodology",
        Object.entries(result.summary.byMethodology)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", "),
      ],
      [
        "By Layer",
        Object.entries(result.summary.byLayer)
          .map(
            ([k, v]) =>
              `${MAESTRO_LAYER_LABELS[Number(k) as keyof typeof MAESTRO_LAYER_LABELS] ?? k}: ${v}`,
          )
          .join(", "),
      ],
    ],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [41, 128, 185] },
    margin: { left: MARGIN },
  });
  y = getY() + 6;

  // ─── Risk Assessment ────────────────────────────────────────
  if (riskSummary) {
    sectionTitle("Risk Assessment");
    autoTable(doc, {
      startY: y,
      head: [["Metric", "Value"]],
      body: [
        ["Overall Risk Score", `${riskSummary.overallScore} / 100`],
        ["Severity", riskSummary.severityLabel],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [192, 57, 43] },
      margin: { left: MARGIN },
    });
    y = getY() + 4;

    if (riskSummary.topRisks.length > 0) {
      subTitle("Top Risk Components");
      autoTable(doc, {
        startY: y,
        head: [["Component", "Risk Score"]],
        body: riskSummary.topRisks.map((r) => [r.name, String(r.score)]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [192, 57, 43] },
        margin: { left: MARGIN },
      });
      y = getY() + 6;
    }
  }

  // ─── Trust Boundary Analysis ────────────────────────────────
  const boundaries = nodes.filter((n) => n.type === "trustBoundary");
  if (boundaries.length > 0) {
    sectionTitle("Trust Boundary Analysis");
    const boundaryRows = boundaries.map((b) => {
      const children = nodes.filter((n) => n.parentId === b.id && n.type !== "trustBoundary");
      const childIds = new Set(children.map((c) => c.id));
      const crossEdges = edges.filter((e) => {
        const srcIn = childIds.has(e.source);
        const tgtIn = childIds.has(e.target);
        return (srcIn && !tgtIn) || (!srcIn && tgtIn);
      });
      const threatCount = result.threats.filter((t) =>
        t.affectedNodeIds.some((nid) => childIds.has(nid)),
      ).length;
      const criticalCount = result.threats.filter(
        (t) => t.severity === "critical" && t.affectedNodeIds.some((nid) => childIds.has(nid)),
      ).length;
      const health = criticalCount > 0 ? "CRITICAL" : threatCount > 3 ? "WARNING" : "GOOD";
      return [
        b.data?.label ?? "Unnamed",
        b.data?.trustLevel ?? "-",
        String(children.length),
        String(crossEdges.length),
        String(threatCount),
        health,
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [
        ["Boundary", "Trust Level", "Components", "Cross-Boundary Edges", "Threats", "Health"],
      ],
      body: boundaryRows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 160, 133] },
      margin: { left: MARGIN },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      didParseCell: (data: any) => {
        if (data.section === "body" && data.column.index === 5) {
          const val = (data.row.raw as string[])?.[5];
          if (val === "CRITICAL") data.cell.styles.textColor = [220, 38, 38];
          else if (val === "WARNING") data.cell.styles.textColor = [234, 179, 8];
          else data.cell.styles.textColor = [34, 197, 94];
        }
      },
    });
    y = getY() + 6;
  }

  // ─── Attack Surface Scores ──────────────────────────────────
  if (attackSurfaceScores && attackSurfaceScores.length > 0) {
    sectionTitle("Attack Surface Analysis");
    autoTable(doc, {
      startY: y,
      head: [
        [
          "Component",
          "Score",
          "Risk",
          "Connections",
          "Trust",
          "External",
          "Unencrypted",
          "Cross-Boundary",
        ],
      ],
      body: attackSurfaceScores
        .slice(0, 15)
        .map((s) => [
          s.label,
          String(s.score),
          s.riskLevel.toUpperCase(),
          String(s.factors.connections),
          String(s.factors.trustLevel),
          String(s.factors.externalExposure),
          String(s.factors.unencryptedFlows),
          String(s.factors.crossBoundaryFlows),
        ]),
      styles: { fontSize: 7 },
      headStyles: { fillColor: [155, 89, 182] },
      margin: { left: MARGIN },
      columnStyles: { 0: { cellWidth: 35 } },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      didParseCell: (data: any) => {
        if (data.section === "body" && data.column.index === 2) {
          const val = (data.row.raw as string[])?.[2];
          if (val === "CRITICAL") data.cell.styles.textColor = [220, 38, 38];
          else if (val === "HIGH") data.cell.styles.textColor = [249, 115, 22];
          else if (val === "MEDIUM") data.cell.styles.textColor = [234, 179, 8];
        }
      },
    });
    y = getY() + 6;
  }

  // ─── Threat Inventory ───────────────────────────────────────
  sectionTitle("Threat Inventory");
  const severityOrder = ["critical", "high", "medium", "low"];
  const sorted = [...result.threats].sort(
    (a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity),
  );

  autoTable(doc, {
    startY: y,
    head: [["Severity", "Name", "Status", "Methodology", "Layer", "Affected", "Mitigations"]],
    body: sorted.map((t) => {
      const s = t.status ?? threatStatuses?.get(t.id)?.status ?? "open";
      return [
        t.severity.toUpperCase(),
        t.name.slice(0, 45),
        s.toUpperCase(),
        t.methodology,
        t.maestroLayer !== undefined ? MAESTRO_LAYER_LABELS[t.maestroLayer] : "-",
        String(t.affectedNodeIds.length),
        String(t.mitigations.length),
      ];
    }),
    styles: { fontSize: 7 },
    headStyles: { fillColor: [44, 62, 80] },
    margin: { left: MARGIN },
    columnStyles: {
      0: { cellWidth: 16 },
      1: { cellWidth: 45 },
      2: { cellWidth: 22 },
      5: { cellWidth: 14 },
      6: { cellWidth: 18 },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    didParseCell: (data: any) => {
      if (data.section === "body" && data.column.index === 0) {
        const sev = (data.row.raw as string[])?.[0]?.toLowerCase();
        if (sev && SEVERITY_FILL[sev]) data.cell.styles.textColor = SEVERITY_FILL[sev];
      }
    },
  });
  y = getY() + 6;

  // ─── Detailed Threat Descriptions ───────────────────────────
  sectionTitle("Detailed Threat Analysis");

  for (const threat of sorted) {
    addPageCheck(40);
    const s = threat.status ?? threatStatuses?.get(threat.id)?.status ?? "open";
    const sevColor = SEVERITY_FILL[threat.severity] ?? [100, 100, 100];

    doc.setFillColor(...sevColor);
    doc.roundedRect(MARGIN, y - 1, 3, 8, 1, 1, "F");

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`${threat.severity.toUpperCase()}: ${threat.name}`, MARGIN + 5, y + 4);
    doc.setFont("helvetica", "normal");
    y += 10;

    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    const descLines = doc.splitTextToSize(threat.description, CONTENT_WIDTH - 5);
    for (const line of descLines) {
      addPageCheck(6);
      doc.text(line, MARGIN + 5, y);
      y += 4;
    }
    y += 2;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);

    const metaItems: string[] = [`Methodology: ${threat.methodology}`, `Status: ${s}`];
    if (threat.maestroLayer !== undefined) {
      metaItems.push(`Layer: ${MAESTRO_LAYER_LABELS[threat.maestroLayer]}`);
    }
    if (threat.inherited) metaItems.push("Inherited: Yes");
    if (threat.affectedNodeIds.length > 0) {
      const labels = threat.affectedNodeIds
        .map((nid) => nodeMap.get(nid)?.data?.label ?? nid.slice(0, 8))
        .slice(0, 5)
        .join(", ");
      metaItems.push(`Affected: ${labels}`);
    }

    addPageCheck(6);
    doc.setTextColor(100, 100, 100);
    doc.text(metaItems.join("  |  "), MARGIN + 5, y);
    doc.setTextColor(0, 0, 0);
    y += 5;

    if (threat.ciscoMapping && threat.ciscoMapping.length > 0) {
      addPageCheck(5);
      doc.setTextColor(0, 151, 167);
      doc.text(
        `Cisco: ${threat.ciscoMapping
          .map((m) => `${m.objectiveId} (${m.objectiveName})`)
          .join(", ")
          .slice(0, 120)}`,
        MARGIN + 5,
        y,
      );
      doc.setTextColor(0, 0, 0);
      y += 4;
    }

    if (threat.owaspMapping && threat.owaspMapping.length > 0) {
      const highMed = threat.owaspMapping.filter((m) => m.confidence !== "low");
      if (highMed.length > 0) {
        addPageCheck(5);
        doc.setTextColor(102, 51, 153);
        doc.text(
          `OWASP: ${highMed
            .map((m) => `${m.asiId} (${m.asiName})`)
            .join(", ")
            .slice(0, 120)}`,
          MARGIN + 5,
          y,
        );
        doc.setTextColor(0, 0, 0);
        y += 4;
      }
    }

    if (threat.mitigations.length > 0) {
      addPageCheck(5);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text("Mitigations:", MARGIN + 5, y);
      doc.setFont("helvetica", "normal");
      y += 4;
      for (const m of threat.mitigations.slice(0, 5)) {
        addPageCheck(5);
        doc.text(`  \u2022 ${m.slice(0, 100)}`, MARGIN + 7, y);
        y += 4;
      }
      if (threat.mitigations.length > 5) {
        doc.text(`  ... +${threat.mitigations.length - 5} more`, MARGIN + 7, y);
        y += 4;
      }
    }

    if (threat.statusJustification ?? threatStatuses?.get(threat.id)?.justification) {
      const just =
        threat.statusJustification ?? threatStatuses?.get(threat.id)?.justification ?? "";
      addPageCheck(5);
      doc.setTextColor(100, 100, 100);
      doc.text(`Justification: ${just.slice(0, 100)}`, MARGIN + 5, y);
      doc.setTextColor(0, 0, 0);
      y += 4;
    }

    y += 4;
  }

  // ─── Component Inventory ────────────────────────────────────
  sectionTitle("Component Inventory");
  const compData = nodes
    .filter((n) => n.type !== "trustBoundary")
    .map((n) => {
      const parentBoundary = n.parentId
        ? nodes.find((b) => b.id === n.parentId && b.type === "trustBoundary")
        : null;
      return [
        n.data?.label ?? "Unknown",
        n.data?.category ?? "-",
        n.data?.trustLevel ?? "-",
        parentBoundary?.data?.label ?? "None",
        n.data?.toolAccessMode ?? "-",
        n.data?.dataSensitivity ?? "-",
        String(result.threats.filter((t) => t.affectedNodeIds.includes(n.id)).length),
      ];
    });

  autoTable(doc, {
    startY: y,
    head: [["Component", "Category", "Trust", "Boundary", "Access", "Sensitivity", "Threats"]],
    body: compData,
    styles: { fontSize: 7 },
    headStyles: { fillColor: [39, 174, 96] },
    margin: { left: MARGIN },
    columnStyles: {
      0: { cellWidth: 30 },
      6: { cellWidth: 14 },
    },
  });
  y = getY() + 6;

  // ─── Data Flow Inventory ────────────────────────────────────
  sectionTitle("Data Flow Inventory");
  const flowData = edges.map((e) => {
    const src = nodeMap.get(e.source)?.data?.label ?? e.source;
    const tgt = nodeMap.get(e.target)?.data?.label ?? e.target;
    const d = e.data;
    const srcBoundary = nodeMap.get(e.source)?.parentId;
    const tgtBoundary = nodeMap.get(e.target)?.parentId;
    const crossesBoundary = srcBoundary !== tgtBoundary ? "Yes" : "No";
    return [
      `${src} \u2192 ${tgt}`.slice(0, 38),
      d?.protocol ?? "-",
      d?.encrypted ? "Yes" : "No",
      d?.authentication ?? "-",
      d?.dataClassification ?? "-",
      d?.containsPII ? "Yes" : "No",
      crossesBoundary,
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [["Flow", "Protocol", "Encrypted", "Auth", "Classification", "PII", "Cross-Boundary"]],
    body: flowData,
    styles: { fontSize: 7 },
    headStyles: { fillColor: [52, 73, 94] },
    margin: { left: MARGIN },
    columnStyles: { 0: { cellWidth: 38 } },
  });
  y = getY() + 6;

  // ─── Data Flow Compliance Violations ────────────────────────
  if (complianceViolations && complianceViolations.length > 0) {
    sectionTitle("Data Flow Compliance Violations");
    autoTable(doc, {
      startY: y,
      head: [["Severity", "Violation", "Description", "Rule"]],
      body: complianceViolations.map((v) => [
        v.severity.toUpperCase(),
        v.name,
        v.description.slice(0, 80),
        v.rule,
      ]),
      styles: { fontSize: 7 },
      headStyles: { fillColor: [211, 84, 0] },
      margin: { left: MARGIN },
      columnStyles: {
        0: { cellWidth: 16 },
        2: { cellWidth: 65 },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      didParseCell: (data: any) => {
        if (data.section === "body" && data.column.index === 0) {
          const sev = (data.row.raw as string[])?.[0]?.toLowerCase();
          if (sev && SEVERITY_FILL[sev]) data.cell.styles.textColor = SEVERITY_FILL[sev];
        }
      },
    });
    y = getY() + 6;
  }

  // ─── Attack Paths ──────────────────────────────────────────
  if (attackPaths && attackPaths.length > 0) {
    sectionTitle("Attack Paths (Top 10)");
    const pathData = attackPaths.slice(0, 10).map((path, i) => {
      const labels = path.nodes
        .map((nId) => nodeMap.get(nId)?.data?.label ?? nId.slice(0, 8))
        .join(" \u2192 ");
      return [
        String(i + 1),
        path.severity.toUpperCase(),
        String(path.score),
        String(path.nodes.length),
        labels.slice(0, 90),
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [["#", "Severity", "Score", "Hops", "Path"]],
      body: pathData,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [142, 68, 173] },
      margin: { left: MARGIN },
      columnStyles: { 0: { cellWidth: 8 }, 4: { cellWidth: 100 } },
    });
    y = getY() + 6;
  }

  // ─── AISVS Compliance Summary ──────────────────────────────
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
      margin: { left: MARGIN },
    });
    y = getY() + 4;

    if (aisvsResult.coverageByCategory) {
      subTitle("AISVS Coverage by Category");
      autoTable(doc, {
        startY: y,
        head: [["Category", "Identified", "Addressed", "Total", "Coverage"]],
        body: Object.entries(aisvsResult.coverageByCategory)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([cat, stats]) => {
            const catPct =
              stats.total > 0
                ? Math.round(((stats.identified + stats.addressed) / stats.total) * 100)
                : 0;
            return [
              cat,
              String(stats.identified),
              String(stats.addressed),
              String(stats.total),
              `${catPct}%`,
            ];
          }),
        styles: { fontSize: 7 },
        headStyles: { fillColor: [22, 160, 133] },
        margin: { left: MARGIN },
      });
      y = getY() + 6;
    }
  }

  // ─── Compliance Gap Report ──────────────────────────────────
  if (complianceGapReport && complianceGapReport.items.length > 0) {
    sectionTitle("AISVS Compliance Gap Analysis");
    autoTable(doc, {
      startY: y,
      head: [["Metric", "Value"]],
      body: [
        ["Total Checks", String(complianceGapReport.summary.totalChecks)],
        ["Met", String(complianceGapReport.summary.met)],
        ["Partial", String(complianceGapReport.summary.partial)],
        ["Gaps", String(complianceGapReport.summary.gaps)],
        [
          "Coverage",
          `${complianceGapReport.summary.totalChecks > 0 ? Math.round(((complianceGapReport.summary.met + complianceGapReport.summary.partial * 0.5) / complianceGapReport.summary.totalChecks) * 100) : 0}%`,
        ],
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [231, 76, 60] },
      margin: { left: MARGIN },
    });
    y = getY() + 4;

    const gapItems = complianceGapReport.items.filter((i) => i.status === "gap");
    if (gapItems.length > 0) {
      subTitle("Unmet Requirements (Gaps)");
      autoTable(doc, {
        startY: y,
        head: [["Code", "Requirement", "Category", "Level", "Recommendation"]],
        body: gapItems
          .slice(0, 20)
          .map((item) => [
            item.requirementCode,
            item.requirementTitle.slice(0, 40),
            item.categoryName.slice(0, 25),
            String(item.level),
            item.recommendation.slice(0, 50),
          ]),
        styles: { fontSize: 7 },
        headStyles: { fillColor: [231, 76, 60] },
        margin: { left: MARGIN },
      });
      y = getY() + 6;
    }
  }

  // ─── Cisco Taxonomy Mapping ─────────────────────────────────
  const ciscoThreats = result.threats.filter((t) => t.ciscoMapping && t.ciscoMapping.length > 0);
  if (ciscoThreats.length > 0) {
    sectionTitle("Cisco AI Security Taxonomy Mapping");
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

    autoTable(doc, {
      startY: y,
      head: [["Objective ID", "Objective Name", "Threats", "Techniques"]],
      body: Array.from(ciscoMap.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .map(([id, data]) => [
          id,
          data.name,
          String(data.count),
          Array.from(data.techniques).slice(0, 3).join(", ").slice(0, 60) || "-",
        ]),
      styles: { fontSize: 7 },
      headStyles: { fillColor: [0, 151, 167] },
      margin: { left: MARGIN },
    });
    y = getY() + 6;
  }

  // ─── OWASP Agentic Top 10 Mapping ──────────────────────────
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
      head: [["ASI ID", "Category", "High", "Medium", "Low", "Total"]],
      body: Array.from(owaspMap.entries())
        .sort((a, b) => b[1].high + b[1].med - (a[1].high + a[1].med))
        .map(([id, data]) => [
          id,
          data.name,
          String(data.high),
          String(data.med),
          String(data.low),
          String(data.high + data.med + data.low),
        ]),
      styles: { fontSize: 7 },
      headStyles: { fillColor: [102, 51, 153] },
      margin: { left: MARGIN },
    });
    y = getY() + 6;
  }

  // ─── MAESTRO Layer Breakdown ────────────────────────────────
  const layerEntries = Object.entries(result.summary.byLayer);
  if (layerEntries.length > 0) {
    sectionTitle("MAESTRO Layer Breakdown");
    autoTable(doc, {
      startY: y,
      head: [["Layer", "Label", "Threat Count"]],
      body: layerEntries
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([key, count]) => {
          const layerNum = Number(key) as keyof typeof MAESTRO_LAYER_LABELS;
          return [`L${key}`, MAESTRO_LAYER_LABELS[layerNum] ?? `Layer ${key}`, String(count)];
        }),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [52, 152, 219] },
      margin: { left: MARGIN },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      didParseCell: (data: any) => {
        if (data.section === "body" && data.column.index === 0) {
          const layerKey = Number((data.row.raw as string[])?.[0]?.replace("L", ""));
          const color = MAESTRO_LAYER_COLORS[layerKey as keyof typeof MAESTRO_LAYER_COLORS];
          if (color) data.cell.styles.textColor = hexToRgb(color);
        }
      },
    });
    y = getY() + 6;
  }

  // ─── Prioritized Remediation ────────────────────────────────
  if (riskSummary && riskSummary.topRisks.length > 0) {
    sectionTitle("Prioritized Remediation Plan");
    const remData = riskSummary.topRisks.map((risk, i) => {
      const compThreats = result.threats.filter((t) =>
        t.affectedNodeIds.some((nId) => nodeMap.get(nId)?.data?.label === risk.name),
      );
      const criticalThreats = compThreats.filter((t) => t.severity === "critical").length;
      const openThreats = compThreats.filter((t) => {
        const s = t.status ?? threatStatuses?.get(t.id)?.status ?? "open";
        return s === "open";
      }).length;
      const unmitigated = compThreats.filter((t) => t.mitigations.length === 0);
      return [
        String(i + 1),
        risk.name,
        String(risk.score),
        String(compThreats.length),
        String(criticalThreats),
        String(openThreats),
        unmitigated.length > 0 ? `${unmitigated.length} unmitigated` : "All mitigated",
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [["#", "Component", "Risk", "Threats", "Critical", "Open", "Status"]],
      body: remData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [211, 84, 0] },
      margin: { left: MARGIN },
      columnStyles: { 0: { cellWidth: 8 } },
    });
    y = getY() + 6;
  }

  // ─── Footer on Last Page ────────────────────────────────────
  addPageCheck(20);
  doc.setDrawColor(41, 128, 185);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y + 2, MARGIN + CONTENT_WIDTH, y + 2);
  y += 8;
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(`Generated by ASI Threat Modeler | ${genDate}`, MARGIN, y);
  doc.text(
    `${result.summary.total} threats across ${componentCount} components and ${edges.length} data flows`,
    MARGIN,
    y + 5,
  );
  doc.setTextColor(0, 0, 0);

  // Add page numbers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${totalPages}`, PAGE_WIDTH - 25, 290);
    doc.text("ASI Threat Modeler Report", MARGIN, 290);
    doc.setTextColor(0, 0, 0);
  }

  doc.save(`threat-model-report-${Date.now()}.pdf`);
}

import type { ReportModel, ReportSection, ReportTable } from "./reportModel";
import { exportFilename } from "./download";
import { renderCanvasImage } from "./exportPNG";
import type { CanvasNode } from "../types";

/**
 * PDF report rendered from the shared report model (P3-40): autoTable for
 * every table (wrapping, no truncation, no silent caps), table of contents,
 * legend, evidence per threat and an approval block. jsPDF and
 * jspdf-autotable are loaded on demand.
 */
export interface PdfOptions {
  /** Canvas element to capture as the architecture diagram. */
  canvasElement?: HTMLElement | null;
  /** Nodes to fit the capture to (React Flow getNodesBounds). */
  nodes?: CanvasNode[];
  /** Pre-rendered diagrams (e.g. one per trust boundary). */
  images?: { title: string; dataUrl: string }[];
  filename?: string;
}

const PAGE_W = 210;
const PAGE_H = 297;
const M = 14;
const W = PAGE_W - 2 * M;
const BOTTOM = PAGE_H - 16;

const VERDICT_FILL: Record<string, [number, number, number]> = {
  met: [220, 252, 231],
  partial: [254, 249, 195],
  gap: [254, 226, 226],
};
const SEVERITY_FILL: Record<string, [number, number, number]> = {
  Critical: [254, 202, 202],
  High: [254, 215, 170],
  Medium: [254, 240, 138],
  Low: [191, 219, 254],
};

export async function buildPdf(model: ReportModel, options: PdfOptions = {}) {
  const [{ jsPDF }, autoTableMod] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const autoTable = autoTableMod.default;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = M;

  const ensure = (h: number) => {
    if (y + h > BOTTOM) {
      doc.addPage();
      y = M;
    }
  };
  const text = (
    s: string,
    size = 9.5,
    style: "normal" | "bold" | "italic" = "normal",
    gap = 1.5,
  ) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(s, W) as string[];
    for (const line of lines) {
      ensure(size * 0.45);
      doc.text(line, M, y);
      y += size * 0.42;
    }
    y += gap;
  };
  const heading = (s: string, level: number) => {
    const size = level === 1 ? 15 : level === 2 ? 12 : 10.5;
    ensure(size * 0.9 + 6);
    y += level === 1 ? 2 : 1;
    text(s, size, "bold", 2);
  };
  const table = (t: ReportTable) => {
    if (t.title) heading(t.title, 3);
    if (t.rows.length === 0) {
      text("None.", 9, "italic");
      return;
    }
    const sevCol = t.columns.findIndex((c) => c === "Severity");
    const verdictCol = t.columns.findIndex((c) => c === "Verdict");
    autoTable(doc, {
      startY: y,
      head: [t.columns],
      body: t.rows,
      margin: { left: M, right: M, bottom: 18 },
      styles: { fontSize: 7.5, cellPadding: 1.4, overflow: "linebreak", valign: "top" },
      headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didParseCell: (data) => {
        if (data.section !== "body") return;
        const v = String(data.cell.raw ?? "");
        if (data.column.index === sevCol && SEVERITY_FILL[v])
          data.cell.styles.fillColor = SEVERITY_FILL[v];
        if (data.column.index === verdictCol && VERDICT_FILL[v])
          data.cell.styles.fillColor = VERDICT_FILL[v];
      },
    });
    y = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 3;
    if (t.note) text(t.note, 8, "italic");
  };
  const bullets = (items: string[]) => {
    for (const b of items) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      const lines = doc.splitTextToSize(b, W - 4) as string[];
      lines.forEach((line, i) => {
        ensure(4);
        if (i === 0) doc.text("•", M, y);
        doc.text(line, M + 4, y);
        y += 3.7;
      });
    }
    y += 1.5;
  };
  const image = async (dataUrl: string, title?: string) => {
    const props = doc.getImageProperties(dataUrl);
    const maxH = 120;
    let w = W;
    let h = (props.height / props.width) * w;
    if (h > maxH) {
      h = maxH;
      w = (props.width / props.height) * h;
    }
    if (title) heading(title, 3);
    ensure(h + 4);
    doc.addImage(dataUrl, "PNG", M + (W - w) / 2, y, w, h);
    y += h + 4; // exactly the rendered height: no half-page gap after the image
  };

  // ── Title page ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(model.title, M, y + 6);
  y += 14;
  text(model.modelName, 13, "bold");
  text(
    `Generated ${model.generatedAt.slice(0, 19).replace("T", " ")} UTC · engine ${model.engineVersion}`,
    8.5,
  );
  text(model.indicativeNote, 8.5, "italic");
  const h = model.headline;
  table({
    id: "headline",
    columns: [
      "Model score",
      "Inherent",
      "Threats",
      "Open",
      "Mitigated",
      "Components",
      "Flows",
      "Boundaries",
      "Paths",
    ],
    rows: [
      [
        `${h.score}/100 (${h.label})`,
        `${h.inherent}/100`,
        String(h.threats),
        String(h.open),
        String(h.mitigated),
        String(h.components),
        String(h.flows),
        String(h.boundaries),
        `${h.paths}${h.pathsTruncated ? "+" : ""}`,
      ],
    ],
  });
  const images = [...(options.images ?? [])];
  if (images.length === 0 && options.canvasElement) {
    try {
      images.push({
        title: "Architecture diagram",
        dataUrl: await renderCanvasImage(options.canvasElement, { nodes: options.nodes }),
      });
    } catch {
      /* diagram is optional */
    }
  }
  for (const img of images) await image(img.dataUrl, img.title);

  // ── TOC placeholder ──
  doc.addPage();
  const tocPage = doc.getCurrentPageInfo().pageNumber;
  const tocEntries: { title: string; page: number }[] = [];

  const renderSection = (s: ReportSection, level: number) => {
    if (level === 1) {
      doc.addPage();
      y = M;
      tocEntries.push({ title: s.title, page: doc.getCurrentPageInfo().pageNumber });
    }
    heading(s.title, level);
    for (const p of s.paragraphs ?? []) text(p);
    for (const t of s.tables ?? []) table(t);
    if (s.bullets?.length) bullets(s.bullets);
    for (const c of s.children ?? []) renderSection(c, Math.min(level + 1, 3));
  };
  for (const s of model.sections) renderSection(s, 1);

  // ── Approval block ──
  ensure(50);
  heading("Approval", 2);
  table({
    id: "approval",
    columns: ["Role", "Name", "Date", "Signature"],
    rows: model.approval.map((a) => [a.role, a.name, a.date, ""]),
  });

  // ── TOC ──
  doc.setPage(tocPage);
  y = M;
  heading("Contents", 1);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  for (const e of tocEntries) {
    doc.text(e.title, M, y);
    doc.text(String(e.page), PAGE_W - M, y, { align: "right" });
    doc.link(M, y - 4, W, 5, { pageNumber: e.page });
    y += 6;
  }

  // ── Footers ──
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(120);
    doc.text(`${model.modelName} — ${model.indicativeNote}`, M, PAGE_H - 8);
    doc.text(`Page ${i} of ${pages}`, PAGE_W - M, PAGE_H - 8, { align: "right" });
    doc.setTextColor(0);
  }
  return doc;
}

export async function exportPDFReport(model: ReportModel, options: PdfOptions = {}): Promise<void> {
  const doc = await buildPdf(model, options);
  doc.save(options.filename ?? exportFilename(model.modelName, "pdf"));
}

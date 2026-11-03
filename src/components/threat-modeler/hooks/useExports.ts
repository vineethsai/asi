import { useMemo } from "react";
import { toast } from "sonner";
import { serializeDocument } from "../document";
import type { AnalysisResult } from "../engine/analyze";
import { documentFingerprint, tm } from "../store";

/**
 * Exports (P3-40…P3-43, §7.8). Every exporter and its libraries are loaded
 * with `await import()` on click, so none of them is in the modeler chunk.
 * Exports always use a fresh analysis of the current document (statuses,
 * owners and suppressions included).
 */

async function ensureAnalysis(): Promise<AnalysisResult | null> {
  const s = tm();
  if (!s.document.nodes.length) {
    toast.error("Add components before exporting a report.");
    return null;
  }
  if (s.analysis && s.analysisFingerprint === documentFingerprint(s.document)) return s.analysis;
  toast.info("Running analysis for the export…");
  return tm().analyze();
}

function reportDoc() {
  const d = tm().document;
  return { name: d.name, nodes: d.nodes, edges: d.edges, appliedMitigations: d.appliedMitigations };
}

function canvasElement(): HTMLElement | null {
  return document.querySelector(".tm-canvas .react-flow") as HTMLElement | null;
}

async function run(label: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    toast.success(`${label} exported`);
  } catch (e) {
    console.error(e);
    toast.error(`${label} export failed`);
  }
}

/** Threat ids of the run before the current one (SARIF baselineState). */
function previousThreatIds(a: AnalysisResult): string[] | undefined {
  const c = a.changeSummary;
  if (!c) return undefined;
  const added = new Set(c.added);
  return [...a.threats.map((t) => t.id).filter((id) => !added.has(id)), ...c.resolved];
}

export function shareUrl(encoded: string): string {
  const base =
    typeof window !== "undefined" ? `${window.location.origin}/threat-modeler` : "/threat-modeler";
  return `${base}?m=${encoded}`;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function useExports() {
  return useMemo(
    () => ({
      json: () =>
        run("JSON", async () => {
          const { downloadBlob, exportFilename } = await import("../export/download");
          const d = tm().document;
          downloadBlob(serializeDocument(d), exportFilename(d.name, "json"), "application/json");
        }),
      png: () =>
        run("PNG", async () => {
          const el = canvasElement();
          if (!el) throw new Error("Canvas not found");
          const [{ exportCanvasPNG }, { exportFilename }] = await Promise.all([
            import("../export/exportPNG"),
            import("../export/download"),
          ]);
          const d = tm().document;
          await exportCanvasPNG(el, exportFilename(d.name, "png"), { nodes: d.nodes });
        }),
      svg: () =>
        run("SVG", async () => {
          const el = canvasElement();
          if (!el) throw new Error("Canvas not found");
          const [{ exportCanvasSVG }, { exportFilename }] = await Promise.all([
            import("../export/exportPNG"),
            import("../export/download"),
          ]);
          const d = tm().document;
          await exportCanvasSVG(el, exportFilename(d.name, "svg"), { nodes: d.nodes });
        }),
      pdf: async () => {
        const a = await ensureAnalysis();
        if (!a) return;
        toast.info("Generating PDF report…");
        await run("PDF report", async () => {
          const [{ exportPDFReport }, { buildReportModel }] = await Promise.all([
            import("../export/exportPDF"),
            import("../export/reportModel"),
          ]);
          const doc = reportDoc();
          await exportPDFReport(buildReportModel(doc, a, { title: doc.name }), {
            canvasElement: canvasElement(),
            nodes: doc.nodes,
          });
        });
      },
      markdown: async () => {
        const a = await ensureAnalysis();
        if (!a) return;
        await run("Markdown report", async () => {
          const [{ downloadMarkdownReport }, { buildReportModel }, { exportFilename }] =
            await Promise.all([
              import("../export/exportMarkdown"),
              import("../export/reportModel"),
              import("../export/download"),
            ]);
          const doc = reportDoc();
          downloadMarkdownReport(
            buildReportModel(doc, a, { title: doc.name }),
            exportFilename(doc.name, "md"),
          );
        });
      },
      csv: async () => {
        const a = await ensureAnalysis();
        if (!a) return;
        await run("CSV", async () => {
          const { exportThreatsCSV } = await import("../export/exportCSV");
          exportThreatsCSV(a, reportDoc());
        });
      },
      workItems: async () => {
        const a = await ensureAnalysis();
        if (!a) return;
        await run("Work items CSV", async () => {
          const { exportWorkItemsCSV } = await import("../export/exportCSV");
          exportWorkItemsCSV(reportDoc(), a);
        });
      },
      sarif: async () => {
        const a = await ensureAnalysis();
        if (!a) return;
        await run("SARIF", async () => {
          const { exportSARIF } = await import("../export/exportSARIF");
          exportSARIF(a, reportDoc(), { previousThreatIds: previousThreatIds(a) });
        });
      },
      threatDragon: async () => {
        const a = await ensureAnalysis();
        if (!a) return;
        await run("Threat Dragon", async () => {
          const { exportThreatDragon } = await import("../export/exportThreatDragon");
          exportThreatDragon(reportDoc(), a);
        });
      },
      otm: async () => {
        const a = await ensureAnalysis();
        if (!a) return;
        await run("Open Threat Model", async () => {
          const { exportOTM } = await import("../export/exportOTM");
          exportOTM(reportDoc(), a);
        });
      },
      copyJson: async () => {
        if (await copyText(serializeDocument(tm().document)))
          toast.success("Model JSON copied to the clipboard");
        else toast.error("Clipboard is not available");
      },
      share: () => tm().openDialog("share"),
    }),
    [],
  );
}

export type Exports = ReturnType<typeof useExports>;

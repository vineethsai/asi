import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { unverifiedEdges } from "../canvasOps";
import { createDocument, loadDocument, type ThreatModelDocument } from "../document";
import { tidyLayout } from "../layout";
import { tm } from "../store";
import type { CanvasEdge, CanvasNode } from "../types";
import type { ImportedNote } from "../parsers/threatDragon";
import { useCanvasActions } from "./useCanvasActions";

/**
 * Imports (P0-12 / P3-44): JSON (v1 or v2 via loadDocument), CycloneDX /
 * cisco-aibom (BOM dialog) and OWASP Threat Dragon v2. Every import merges the
 * custom-component library, is one undoable step, resets the analysis, and
 * prompts for the posture of imported flows.
 */

export interface PendingImport {
  document: ThreatModelDocument;
  label: string;
  notes?: ImportedNote[];
  warnings?: string[];
}

function pickFile(accept = ".json,application/json"): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.click();
  });
}

export function useImports() {
  const actions = useCanvasActions();

  const apply = useCallback(
    (p: PendingImport) => {
      tm().replaceDocument(p.document, p.label);
      window.setTimeout(() => actions.fit(), 80);
      const pending = unverifiedEdges(p.document.edges).map((e) => e.id);
      if (p.notes?.length || p.warnings?.length)
        tm().openDialog("notes", {
          notes: p.notes ?? [],
          warnings: p.warnings ?? [],
          name: p.document.name,
          postureEdgeIds: pending,
        });
      else if (pending.length) tm().openDialog("posture", { edgeIds: pending });
      toast.success(`Imported "${p.document.name}"`);
    },
    [actions],
  );

  /** Confirm before replacing a non-empty canvas. */
  const offer = useCallback(
    (p: PendingImport) => {
      if (tm().document.nodes.length) tm().openDialog("importConfirm", { pending: p });
      else apply(p);
    },
    [apply],
  );

  const importFile = useCallback(async () => {
    const file = await pickFile();
    if (!file) return;
    let json: unknown;
    try {
      json = JSON.parse(await file.text());
    } catch {
      toast.error("Import failed: the file is not valid JSON.");
      return;
    }
    const { detectImportFormat, parseThreatDragon, parseBom, mapToCanvas } =
      await import("../parsers");
    const isV2 = !!json && typeof json === "object" && "schemaVersion" in (json as object);
    const format = isV2 ? "document" : detectImportFormat(json);
    if (format === "document") {
      const r = loadDocument(json, { name: file.name.replace(/\.json$/i, "") });
      if (!r.ok) {
        toast.error(`Import failed: ${(r as { error: string }).error}`);
        return;
      }
      offer({ document: r.value, label: "Import JSON" });
      return;
    }
    if (format === "threat-dragon") {
      try {
        const td = parseThreatDragon(json);
        offer({
          document: createDocument({
            name: td.name || "Threat Dragon model",
            description: td.description,
            nodes: td.nodes,
            edges: td.edges,
          }),
          label: "Import Threat Dragon",
          notes: td.notes,
          warnings: td.warnings,
        });
      } catch (e) {
        toast.error(`Threat Dragon import failed: ${e instanceof Error ? e.message : String(e)}`);
      }
      return;
    }
    const parsed = parseBom(json);
    if (!parsed.components.length) {
      toast.error(parsed.warnings[0] ?? "No components found in this file.");
      return;
    }
    const { nodes, edges } = mapToCanvas(parsed);
    offer({
      document: createDocument({
        name: file.name.replace(/\.json$/i, "") || "Imported BOM",
        nodes: tidyLayout(nodes, edges),
        edges,
      }),
      label: format === "cyclonedx" ? "Import CycloneDX" : "Import AIBOM",
      warnings: parsed.warnings,
    });
  }, [offer]);

  /** BOM dialog result (already previewed by the user). */
  const importBomGraph = useCallback(
    (
      nodes: CanvasNode[],
      edges: CanvasEdge[],
      info: { warnings: string[]; format: "cyclonedx" | "cisco-aibom" },
    ) => {
      apply({
        document: createDocument({
          name: info.format === "cyclonedx" ? "Imported CycloneDX ML-BOM" : "Imported AIBOM",
          nodes: tidyLayout(nodes, edges),
          edges,
        }),
        label: info.format === "cyclonedx" ? "Import CycloneDX" : "Import AIBOM",
      });
      // Analyse the imported graph (the store reads the latest document — no stale closure, P3-25).
      window.setTimeout(() => void tm().analyze(), 120);
    },
    [apply],
  );

  return useMemo(
    () => ({ importFile, importBomGraph, apply }),
    [importFile, importBomGraph, apply],
  );
}

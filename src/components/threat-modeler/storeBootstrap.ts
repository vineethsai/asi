import {
  createDocument,
  decodeShareLink,
  documentToAnalysisInput,
  type ThreatModelDocument,
} from "./document";
import { analyzeThreatModel, type AnalysisResult } from "./engine/analyze";
import { readStoredDocument, type StorageLike } from "./persistence";
import type { BootstrapResult, ThreatModelState, WhatIfResult } from "./storeTypes";
import { ARCHITECTURE_TEMPLATES, instantiateTemplate, resolveTemplateId } from "./templates";

/** What-if removal (§7.5): the model's numbers with a component (and its children) gone. */
export function whatIfRemoval(
  document: ThreatModelDocument,
  analysis: AnalysisResult | null,
  nodeId: string,
): WhatIfResult | null {
  const node = document.nodes.find((n) => n.id === nodeId);
  if (!node) return null;
  const removed = new Set([
    nodeId,
    ...document.nodes.filter((n) => n.parentId === nodeId).map((n) => n.id),
  ]);
  const input = documentToAnalysisInput(document);
  const base = analysis ?? analyzeThreatModel(input);
  const after = analyzeThreatModel({
    ...input,
    nodes: input.nodes
      .filter((n) => !removed.has(n.id))
      .map((n) => (n.parentId && removed.has(n.parentId) ? { ...n, parentId: undefined } : n)),
    edges: input.edges.filter((e) => !removed.has(e.source) && !removed.has(e.target)),
  });
  const pick = (r: AnalysisResult) => ({
    threats: r.summary.total,
    open: r.summary.open,
    score: r.modelScore.overall,
    paths: r.paths.total,
  });
  return { nodeId, label: node.data.label, before: pick(base), after: pick(after) };
}

/**
 * Where the document comes from on page load (P3-24): `?m=` opens a shared
 * model read-only, `?template=` previews a template without touching the
 * autosave, otherwise the autosaved document (or an empty one) is restored.
 */
export function bootstrapFromSearch(
  search: string,
  get: () => ThreatModelState,
  set: (patch: Partial<ThreatModelState>) => void,
  storage: StorageLike | null,
): BootstrapResult {
  const s = get();
  if (s.bootstrappedSearch === search) return { source: "kept" };
  const params = new URLSearchParams(search);
  const threatId = params.get("threat") ?? undefined;
  set({ bootstrappedSearch: search });
  const m = params.get("m");
  let error: string | undefined;
  if (m) {
    const doc = decodeShareLink(m);
    if (doc) {
      get().replaceDocument(doc, "Open shared model", {
        persist: "readonly",
        resetHistory: true,
        mergeCustom: false,
      });
      return { source: "shared", threatId };
    }
    error = "This share link is invalid or too large to open.";
  }
  const t = params.get("template");
  if (t && !error) {
    const id = resolveTemplateId(t);
    const template = id ? ARCHITECTURE_TEMPLATES.find((x) => x.id === id) : undefined;
    if (template) {
      const stored = readStoredDocument(storage);
      const { nodes, edges } = instantiateTemplate(template);
      const doc = createDocument({
        name: template.name,
        description: template.description,
        nodes,
        edges,
        customComponents: stored?.customComponents ?? [],
      });
      // Transient: nothing is written until the user edits (P3-24).
      get().replaceDocument(doc, "Load template", {
        persist: "transient",
        resetHistory: true,
        mergeCustom: false,
      });
      return { source: "template", threatId, templateName: template.name };
    }
    error = `Unknown template "${t}".`;
  }
  // Same session, plain URL: keep the live autosaved document. A template
  // preview or shared view left behind is replaced by the user's own canvas.
  if (s.bootstrappedSearch !== null && !error && get().persist === "autosave")
    return { source: "kept", threatId };
  const stored = readStoredDocument(storage);
  if (stored) {
    get().replaceDocument(stored, "Restore", {
      persist: "autosave",
      resetHistory: true,
      mergeCustom: false,
    });
    return { source: "autosave", error, threatId };
  }
  if (get().persist !== "autosave" && get().document.nodes.length)
    get().replaceDocument(createDocument(), "New model", {
      persist: "autosave",
      resetHistory: true,
      mergeCustom: false,
    });
  else set({ persist: "autosave" });
  return { source: "empty", error, threatId };
}

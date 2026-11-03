/**
 * OWASP Threat Dragon v2 export (P3-44). Each canvas node/flow becomes a
 * cell; direct (non-inherited) engine threats are attached to the cell they
 * focus on, so the model round-trips through parseThreatDragon.
 */
import { type AnalysisResult, isThreatClosed } from "../engine/analyze";
import type { CanvasNode, GeneratedThreat } from "../types";
import { downloadBlob, exportFilename } from "./download";
import { STRIDE_NAMES, absolutePosition, nodeSize } from "./geometry";
import type { ReportDocumentLike } from "./reportModel";

export const THREAT_DRAGON_VERSION = "2.2.0";
const SCALE = 1 / 1.5;

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

function tdStatus(t: GeneratedThreat): "Open" | "Mitigated" | "NotApplicable" {
  if (t.status === "mitigated" || t.mitigationState === "mitigated") return "Mitigated";
  if (t.status === "accepted" || t.status === "transferred" || t.status === "false-positive")
    return "NotApplicable";
  return "Open";
}

function threatCellId(t: GeneratedThreat): string | undefined {
  if (t.scope === "edge" && t.affectedEdgeIds[0]) return t.affectedEdgeIds[0];
  return t.focusNodeId ?? t.affectedNodeIds[0] ?? t.affectedEdgeIds[0];
}

export function buildThreatDragon(
  doc: ReportDocumentLike & { description?: string },
  analysis: Pick<AnalysisResult, "threats">,
) {
  const byId = new Map(doc.nodes.map((n) => [n.id, n]));
  const threatsByCell = new Map<string, GeneratedThreat[]>();
  for (const t of analysis.threats) {
    if (t.inherited) continue;
    const cell = threatCellId(t);
    if (!cell) continue;
    if (!threatsByCell.has(cell)) threatsByCell.set(cell, []);
    threatsByCell.get(cell)!.push(t);
  }
  let number = 0;
  const tdThreats = (cellId: string) =>
    (threatsByCell.get(cellId) ?? []).map((t) => ({
      id: t.id,
      title: t.name,
      status: tdStatus(t),
      severity: cap(t.severity),
      type: STRIDE_NAMES[t.stride?.[0] ?? "T"],
      description: t.description,
      mitigation: t.mitigations.join("; "),
      modelType: "STRIDE",
      number: ++number,
      score: t.score !== undefined ? String(t.score) : "",
      new: false,
      ruleId: t.ruleId,
    }));
  const hasOpen = (cellId: string) =>
    (threatsByCell.get(cellId) ?? []).some((t) => !isThreatClosed(t));

  const shapeOf = (n: CanvasNode) =>
    n.type === "trustBoundary"
      ? { shape: "trust-boundary-box", type: "tm.BoundaryBox" }
      : n.type === "actor" || n.data.category === "actor" || n.data.category === "external"
        ? { shape: "actor", type: "tm.Actor" }
        : n.type === "dataStore" || n.data.category === "datastore" || n.data.category === "kc4"
          ? { shape: "store", type: "tm.Store" }
          : { shape: "process", type: "tm.Process" };

  const cells: unknown[] = [];
  doc.nodes.forEach((n, i) => {
    const { shape, type } = shapeOf(n);
    const pos = absolutePosition(n, byId);
    const size = nodeSize(n);
    const boundary = type === "tm.BoundaryBox";
    const data: Record<string, unknown> = {
      name: n.data.label,
      description: n.data.description ?? "",
      type,
      isTrustBoundary: boundary,
      outOfScope: n.data.customMetadata?.outOfScope === "true",
      reasonOutOfScope: "",
    };
    if (!boundary) {
      data.threats = tdThreats(n.id);
      data.hasOpenThreats = hasOpen(n.id);
    }
    if (type === "tm.Process") data.privilegeLevel = n.data.toolAccessMode ?? "";
    if (type === "tm.Store") {
      data.isALog = n.data.semantics?.kind === "observability";
      data.storesCredentials = n.data.dataSensitivity === "credentials";
      data.isEncrypted = false;
      data.isSigned = false;
    }
    if (type === "tm.Actor") data.providesAuthentication = n.data.semantics?.kind === "identity";
    cells.push({
      id: n.id,
      shape,
      zIndex: boundary ? -1 : i + 1,
      visible: true,
      position: { x: Math.round(pos.x * SCALE), y: Math.round(pos.y * SCALE) },
      size: { width: Math.round(size.width * SCALE), height: Math.round(size.height * SCALE) },
      attrs: { text: { text: n.data.label } },
      data,
    });
  });
  doc.edges.forEach((e, i) => {
    const label = e.data?.label ?? "";
    cells.push({
      id: e.id,
      shape: "flow",
      zIndex: doc.nodes.length + i + 1,
      connector: "smooth",
      source: { cell: e.source },
      target: { cell: e.target },
      labels: label ? [label] : [],
      vertices: [],
      data: {
        name: label,
        description: "",
        type: "tm.Flow",
        isTrustBoundary: false,
        outOfScope: false,
        reasonOutOfScope: "",
        protocol: e.data?.protocol ?? "",
        isEncrypted: !!e.data?.encrypted,
        isPublicNetwork: e.data?.customMetadata?.publicNetwork === "true",
        isBidirectional: !!e.data?.bidirectional,
        threats: tdThreats(e.id),
        hasOpenThreats: hasOpen(e.id),
      },
    });
  });

  return {
    version: THREAT_DRAGON_VERSION,
    summary: {
      title: doc.name ?? "Threat model",
      owner: "",
      description: doc.description ?? "",
      id: 0,
    },
    detail: {
      contributors: [],
      diagrams: [
        {
          id: 0,
          title: doc.name ?? "Threat model",
          diagramType: "STRIDE",
          placeholder: "",
          thumbnail: "./public/content/images/thumbnail.stride.jpg",
          version: THREAT_DRAGON_VERSION,
          cells,
        },
      ],
      diagramTop: 1,
      reviewer: "",
      threatTop: number,
    },
  };
}

export function exportThreatDragon(
  doc: ReportDocumentLike,
  analysis: Pick<AnalysisResult, "threats">,
  filename?: string,
): void {
  downloadBlob(
    JSON.stringify(buildThreatDragon(doc, analysis), null, 2),
    filename ?? exportFilename(`${doc.name ?? "model"}-threat-dragon`, "json"),
    "application/json",
  );
}

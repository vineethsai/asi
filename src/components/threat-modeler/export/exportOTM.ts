/**
 * Open Threat Model (OTM 0.2.0) export (P3-44). Trust boundaries become trust
 * zones; nodes outside every boundary go to an "Internet" zone (actors,
 * externals, untrusted nodes) or an "Unassigned" zone. Threat and mitigation
 * definitions come from the engine result and the mitigation catalog.
 */
import { type AnalysisResult, isThreatClosed } from "../engine/analyze";
import { getMitigation } from "../engine/catalog";
import type { CanvasNode, GeneratedThreat } from "../types";
import { downloadBlob, exportFilename } from "./download";
import { STRIDE_NAMES, absolutePosition, nodeSize } from "./geometry";
import type { ReportDocumentLike } from "./reportModel";

export const OTM_VERSION = "0.2.0";
const INTERNET = "zone-internet";
const UNASSIGNED = "zone-unassigned";
const TRUST_RATING = { untrusted: 10, "semi-trusted": 50, trusted: 90 } as const;

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "threat-model";

function threatState(t: GeneratedThreat): string {
  if (t.status && t.status !== "open") return t.status;
  return t.mitigationState === "mitigated" ? "mitigated" : "identified";
}

export function buildOtm(
  doc: ReportDocumentLike & { description?: string },
  analysis: Pick<AnalysisResult, "threats">,
) {
  const byId = new Map(doc.nodes.map((n) => [n.id, n]));
  const boundaries = doc.nodes.filter((n) => n.type === "trustBoundary");
  const components = doc.nodes.filter((n) => n.type !== "trustBoundary");
  const parentBoundary = (n: CanvasNode): string | undefined => {
    let p = n.parentId;
    const seen = new Set<string>();
    while (p && !seen.has(p)) {
      seen.add(p);
      const parent = byId.get(p);
      if (!parent) return undefined;
      if (parent.type === "trustBoundary") return parent.id;
      p = parent.parentId;
    }
    return undefined;
  };
  const representation = (n: CanvasNode) => {
    const pos = absolutePosition(n, byId);
    const size = nodeSize(n);
    return [
      {
        representation: "architecture-diagram",
        name: n.data.label,
        id: `${n.id}-representation`,
        position: { x: Math.round(pos.x), y: Math.round(pos.y) },
        size: { width: Math.round(size.width), height: Math.round(size.height) },
      },
    ];
  };

  const direct = analysis.threats.filter((t) => !t.inherited);
  const threatsOn = new Map<string, GeneratedThreat[]>();
  for (const t of direct) {
    const key =
      t.scope === "edge" && t.affectedEdgeIds[0]
        ? t.affectedEdgeIds[0]
        : (t.focusNodeId ?? t.affectedNodeIds[0]);
    if (!key) continue;
    if (!threatsOn.has(key)) threatsOn.set(key, []);
    threatsOn.get(key)!.push(t);
  }
  const instances = (id: string) =>
    (threatsOn.get(id) ?? []).map((t) => ({
      threat: t.id,
      state: threatState(t),
      mitigations: (t.mitigationIds ?? []).map((m) => ({
        mitigation: m,
        state: t.implementedMitigationIds?.includes(m) ? "implemented" : "required",
      })),
    }));

  const usesInternet = components.some(
    (n) =>
      !parentBoundary(n) &&
      (n.data.category === "actor" ||
        n.data.category === "external" ||
        n.data.trustLevel === "untrusted"),
  );
  const usesUnassigned = components.some(
    (n) =>
      !parentBoundary(n) &&
      !(
        n.data.category === "actor" ||
        n.data.category === "external" ||
        n.data.trustLevel === "untrusted"
      ),
  );
  const trustZones = [
    ...boundaries.map((b) => ({
      id: b.id,
      name: b.data.label,
      type: "trust-boundary",
      description: b.data.description ?? "",
      risk: { trustRating: TRUST_RATING[b.data.trustLevel] ?? 90 },
      ...(parentBoundary(b) ? { parent: { trustZone: parentBoundary(b) } } : {}),
      representations: representation(b),
    })),
    ...(usesInternet
      ? [
          {
            id: INTERNET,
            name: "Internet",
            type: "internet",
            description: "Outside every trust boundary (untrusted)",
            risk: { trustRating: 0 },
          },
        ]
      : []),
    ...(usesUnassigned
      ? [
          {
            id: UNASSIGNED,
            name: "Unassigned",
            type: "unassigned",
            description: "Outside every trust boundary",
            risk: { trustRating: 50 },
          },
        ]
      : []),
  ];

  const mitigationIds = [...new Set(direct.flatMap((t) => t.mitigationIds ?? []))].sort();
  return {
    otmVersion: OTM_VERSION,
    project: {
      name: doc.name ?? "Threat model",
      id: slug(doc.name ?? "threat-model"),
      description: doc.description ?? "",
      attributes: { generator: "agenticsecurity.info threat modeler" },
    },
    representations: [
      { name: "Architecture diagram", id: "architecture-diagram", type: "diagram" },
    ],
    trustZones,
    components: components.map((n) => {
      const zone = parentBoundary(n);
      const untrusted =
        n.data.category === "actor" ||
        n.data.category === "external" ||
        n.data.trustLevel === "untrusted";
      return {
        id: n.id,
        name: n.data.label,
        type: n.data.semantics?.kind ?? n.data.componentId ?? n.data.category,
        description: n.data.description ?? "",
        parent: { trustZone: zone ?? (untrusted ? INTERNET : UNASSIGNED) },
        tags: [n.data.category, ...(n.data.componentId ? [n.data.componentId] : [])],
        attributes: {
          trustLevel: n.data.trustLevel,
          ...(n.data.toolAccessMode ? { toolAccessMode: n.data.toolAccessMode } : {}),
          ...(n.data.dataSensitivity ? { dataSensitivity: n.data.dataSensitivity } : {}),
        },
        representations: representation(n),
        threats: instances(n.id),
      };
    }),
    dataflows: doc.edges.map((e) => ({
      id: e.id,
      name: e.data?.label ?? `${e.source} → ${e.target}`,
      bidirectional: !!e.data?.bidirectional,
      source: e.source,
      destination: e.target,
      tags: [e.data?.protocol ?? ""].filter(Boolean),
      attributes: {
        protocol: e.data?.protocol ?? "",
        encrypted: !!e.data?.encrypted,
        authentication: e.data?.authentication ?? "",
        dataClassification: e.data?.dataClassification ?? "",
        containsPII: !!e.data?.containsPII,
      },
      threats: instances(e.id),
    })),
    threats: direct.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      categories: (t.stride ?? []).map((s) => STRIDE_NAMES[s]),
      cwes: [],
      risk: { likelihood: (t.likelihood ?? 3) * 20, impact: (t.impact ?? 3) * 20 },
      tags: [t.ruleId ?? "", ...(t.owaspMapping ?? []).map((m) => m.asiId)].filter(Boolean),
      attributes: {
        ruleId: t.ruleId ?? "",
        severity: t.severity,
        score: t.score ?? 0,
        residualScore: t.residualScore ?? t.score ?? 0,
        open: !isThreatClosed(t),
      },
    })),
    mitigations: mitigationIds.map((id) => {
      const m = getMitigation(id);
      return {
        id,
        name: m?.name ?? id,
        description: m?.description ?? "",
        riskReduction: Math.round((m?.effectiveness ?? 0) * 100),
        attributes: {
          phase: m?.phase ?? "",
          controlId: m?.controlId ?? "",
          aisvs: (m?.aisvs ?? []).join(","),
        },
      };
    }),
  };
}

export function exportOTM(
  doc: ReportDocumentLike,
  analysis: Pick<AnalysisResult, "threats">,
  filename?: string,
): void {
  downloadBlob(
    JSON.stringify(buildOtm(doc, analysis), null, 2),
    filename ?? exportFilename(`${doc.name ?? "model"}-otm`, "otm.json"),
    "application/json",
  );
}

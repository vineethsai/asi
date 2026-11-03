/**
 * OWASP Threat Dragon v2 JSON import (P3-44). Cells become canvas nodes and
 * flows; `tm.BoundaryBox` cells become trust boundaries that contain the
 * nodes whose centre lies inside them. Threat Dragon's hand-written threats
 * are returned as notes (they have no engine rule id); flows are flagged
 * `postureUnverified` so the UI prompts for authentication/encryption.
 */
import { z } from "zod";
import {
  type CanvasEdge,
  type CanvasEdgeData,
  type CanvasNode,
  type CanvasNodeData,
  DEFAULT_EDGE_METADATA,
  MaestroLayer,
} from "../types";

const ThreatSchema = z.looseObject({
  id: z.union([z.string(), z.number()]).optional(),
  title: z.string().optional(),
  status: z.string().optional(),
  severity: z.string().optional(),
  type: z.string().optional(),
  description: z.string().optional(),
  mitigation: z.string().optional(),
});

const CellSchema = z.looseObject({
  id: z.union([z.string(), z.number()]),
  shape: z.string().optional(),
  position: z.looseObject({ x: z.number(), y: z.number() }).optional(),
  size: z.looseObject({ width: z.number(), height: z.number() }).optional(),
  source: z.looseObject({ cell: z.union([z.string(), z.number()]).optional() }).optional(),
  target: z.looseObject({ cell: z.union([z.string(), z.number()]).optional() }).optional(),
  labels: z.array(z.unknown()).optional(),
  attrs: z.looseObject({}).optional(),
  data: z
    .looseObject({
      name: z.string().optional(),
      description: z.string().optional(),
      type: z.string().optional(),
      isTrustBoundary: z.boolean().optional(),
      outOfScope: z.boolean().optional(),
      threats: z.array(ThreatSchema).optional(),
      protocol: z.string().optional(),
      isEncrypted: z.boolean().optional(),
      isPublicNetwork: z.boolean().optional(),
      storesCredentials: z.boolean().optional(),
      isALog: z.boolean().optional(),
      providesAuthentication: z.boolean().optional(),
      privilegeLevel: z.string().optional(),
    })
    .optional(),
});

export const ThreatDragonSchema = z.looseObject({
  version: z.string().optional(),
  summary: z
    .looseObject({ title: z.string().optional(), description: z.string().optional() })
    .optional(),
  detail: z.looseObject({
    diagrams: z.array(
      z.looseObject({ title: z.string().optional(), cells: z.array(CellSchema).default([]) }),
    ),
  }),
});

export interface ImportedNote {
  cellId: string;
  nodeId?: string;
  edgeId?: string;
  title: string;
  status: string;
  severity: string;
  type: string;
  description: string;
  mitigation: string;
}

export interface ThreatDragonImport {
  name: string;
  description?: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  notes: ImportedNote[];
  warnings: string[];
}

export function isThreatDragon(json: unknown): boolean {
  const d = (json as { detail?: { diagrams?: unknown } } | null)?.detail;
  return !!d && Array.isArray(d.diagrams);
}

/** Threat Dragon cards are ~160×80; our cards are ~220×120. */
const SCALE = 1.5;

type Cell = z.infer<typeof CellSchema>;

function cellKind(
  c: Cell,
): "actor" | "process" | "store" | "flow" | "boundary-box" | "boundary-curve" | "other" {
  const t = c.data?.type ?? "";
  const s = c.shape ?? "";
  if (t === "tm.Actor" || s === "actor") return "actor";
  if (t === "tm.Store" || s === "store") return "store";
  if (t === "tm.Process" || s === "process") return "process";
  if (t === "tm.Flow" || s === "flow") return "flow";
  if (t === "tm.BoundaryBox" || s === "trust-boundary-box") return "boundary-box";
  if (t === "tm.Boundary" || s === "trust-boundary-curve") return "boundary-curve";
  return "other";
}

function cellName(c: Cell): string {
  const attrText = (c.attrs as { text?: { text?: unknown } } | undefined)?.text?.text;
  const label = typeof c.labels?.[0] === "string" ? (c.labels[0] as string) : undefined;
  return (
    c.data?.name ||
    (typeof attrText === "string" ? attrText : "") ||
    label ||
    "Unnamed"
  ).trim();
}

function processData(
  name: string,
): Pick<CanvasNodeData, "category" | "componentId" | "maestroLayers" | "semantics"> {
  const n = name.toLowerCase();
  if (/guardrail|moderation|filter|policy/.test(n))
    return {
      category: "kc3",
      componentId: "kc3.4",
      maestroLayers: [MaestroLayer.SecurityCompliance],
      semantics: { kind: "guardrail", guardrail: { coverage: ["input", "output"] } },
    };
  if (/orchestrat|planner|supervisor/.test(n))
    return { category: "kc2", componentId: "kc2.2", maestroLayers: [MaestroLayer.AgentFrameworks] };
  if (/agent/.test(n))
    return { category: "kc2", componentId: "kc2", maestroLayers: [MaestroLayer.AgentFrameworks] };
  if (/\bllm\b|model|gpt|claude|gemini|llama/.test(n))
    return { category: "kc1", componentId: "kc1", maestroLayers: [MaestroLayer.FoundationModels] };
  if (/\bmcp\b/.test(n))
    return { category: "kc5", componentId: "kc5.3", maestroLayers: [MaestroLayer.AgentEcosystem] };
  if (/tool|plugin|function/.test(n))
    return { category: "kc5", componentId: "kc5", maestroLayers: [MaestroLayer.AgentEcosystem] };
  return {
    category: "kc6",
    componentId: "kc6",
    maestroLayers: [MaestroLayer.DeploymentInfrastructure],
  };
}

export function parseThreatDragon(json: unknown): ThreatDragonImport {
  const parsed = ThreatDragonSchema.safeParse(json);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      name: "Imported model",
      nodes: [],
      edges: [],
      notes: [],
      warnings: [`Not a Threat Dragon v2 model: ${issue?.path.join(".")} ${issue?.message}`],
    };
  }
  const td = parsed.data;
  const warnings: string[] = [];
  if (td.version && !td.version.startsWith("2"))
    warnings.push(`Threat Dragon ${td.version}: only v2 is supported`);
  const diagrams = td.detail.diagrams;
  if (diagrams.length > 1)
    warnings.push(`${diagrams.length} diagrams found; they are laid out side by side.`);

  const nodes: CanvasNode[] = [];
  const edges: CanvasEdge[] = [];
  const notes: ImportedNote[] = [];
  const idFor = new Map<string, string>();
  let offsetX = 0;

  diagrams.forEach((diagram, di) => {
    const cells = diagram.cells;
    const prefix = diagrams.length > 1 ? `td${di}-` : "td-";
    let maxX = 0;
    const boxes: { id: string; x: number; y: number; w: number; h: number }[] = [];
    // Boundaries first so they render beneath and can parent nodes.
    for (const c of cells.filter((x) => cellKind(x) === "boundary-box")) {
      const id = `${prefix}${c.id}`;
      const x = (c.position?.x ?? 0) * SCALE + offsetX;
      const y = (c.position?.y ?? 0) * SCALE;
      const w = (c.size?.width ?? 400) * SCALE;
      const h = (c.size?.height ?? 300) * SCALE;
      boxes.push({ id, x, y, w, h });
      maxX = Math.max(maxX, x + w);
      idFor.set(String(c.id), id);
      nodes.push({
        id,
        type: "trustBoundary",
        position: { x, y },
        zIndex: -10,
        style: { width: w, height: h, zIndex: -10 },
        data: {
          label: cellName(c),
          description: c.data?.description,
          category: "trust-boundary",
          maestroLayers: [MaestroLayer.SecurityCompliance],
          trustLevel: "trusted",
          threats: [],
        },
      } as CanvasNode);
    }
    const curves = cells.filter((x) => cellKind(x) === "boundary-curve").length;
    if (curves)
      warnings.push(
        `${curves} trust-boundary line(s) skipped: draw them as boundary boxes so containment is explicit.`,
      );

    for (const c of cells) {
      const kind = cellKind(c);
      if (kind !== "actor" && kind !== "process" && kind !== "store") continue;
      const id = `${prefix}${c.id}`;
      idFor.set(String(c.id), id);
      const name = cellName(c);
      const ax = (c.position?.x ?? 0) * SCALE + offsetX;
      const ay = (c.position?.y ?? 0) * SCALE;
      const w = (c.size?.width ?? 160) * SCALE;
      const h = (c.size?.height ?? 80) * SCALE;
      maxX = Math.max(maxX, ax + w);
      // Smallest box containing the centre.
      const cx = ax + w / 2;
      const cy = ay + h / 2;
      const parent = boxes
        .filter((b) => cx >= b.x && cx <= b.x + b.w && cy >= b.y && cy <= b.y + b.h)
        .sort((a, b) => a.w * a.h - b.w * b.h)[0];
      const meta: Record<string, string> = { importedFrom: "threat-dragon" };
      if (c.data?.outOfScope) meta.outOfScope = "true";
      if (c.data?.privilegeLevel) meta.privilegeLevel = c.data.privilegeLevel;
      if (c.data?.isALog) meta.isALog = "true";
      const base = {
        label: name,
        description: c.data?.description || undefined,
        threats: [],
        customMetadata: meta,
      };
      const data: CanvasNodeData =
        kind === "actor"
          ? {
              ...base,
              category: "actor",
              maestroLayers: [MaestroLayer.AgentEcosystem],
              trustLevel: "untrusted",
            }
          : kind === "store"
            ? {
                ...base,
                category: /memory|vector|embedding/i.test(name) ? "kc4" : "datastore",
                componentId: /memory|vector|embedding/i.test(name) ? "kc4" : undefined,
                maestroLayers: [MaestroLayer.DataOperations],
                trustLevel: "trusted",
                dataSensitivity: c.data?.storesCredentials ? "credentials" : undefined,
              }
            : { ...base, ...processData(name), trustLevel: "semi-trusted" };
      nodes.push({
        id,
        type: kind === "actor" ? "actor" : kind === "store" ? "dataStore" : "agentComponent",
        position: parent ? { x: ax - parent.x, y: ay - parent.y } : { x: ax, y: ay },
        ...(parent ? { parentId: parent.id } : {}),
        data,
      } as CanvasNode);
    }

    for (const c of cells) {
      if (cellKind(c) !== "flow") continue;
      const s = idFor.get(String(c.source?.cell ?? ""));
      const t = idFor.get(String(c.target?.cell ?? ""));
      if (!s || !t) {
        warnings.push(`Flow "${cellName(c)}" skipped: it is not attached to two elements.`);
        continue;
      }
      const id = `${prefix}${c.id}`;
      idFor.set(String(c.id), id);
      const meta: Record<string, string> = {
        postureUnverified: "true",
        importedFrom: "threat-dragon",
      };
      if (c.data?.isPublicNetwork) meta.publicNetwork = "true";
      if (c.data?.outOfScope) meta.outOfScope = "true";
      edges.push({
        id,
        source: s,
        target: t,
        type: "dataFlow",
        data: {
          ...DEFAULT_EDGE_METADATA,
          label: cellName(c),
          protocol: c.data?.protocol || DEFAULT_EDGE_METADATA.protocol,
          encrypted: !!c.data?.isEncrypted,
          customMetadata: meta,
          threats: [],
        } as CanvasEdgeData,
      });
    }

    for (const c of cells) {
      for (const th of c.data?.threats ?? []) {
        const mapped = idFor.get(String(c.id));
        const isFlow = cellKind(c) === "flow";
        notes.push({
          cellId: String(c.id),
          ...(mapped ? (isFlow ? { edgeId: mapped } : { nodeId: mapped }) : {}),
          title: th.title ?? "Untitled threat",
          status: th.status ?? "Open",
          severity: th.severity ?? "",
          type: th.type ?? "",
          description: th.description ?? "",
          mitigation: th.mitigation ?? "",
        });
      }
    }
    offsetX = maxX + 200;
  });

  // Parents must precede children for React Flow.
  nodes.sort((a, b) => Number(b.type === "trustBoundary") - Number(a.type === "trustBoundary"));
  return {
    name: td.summary?.title || diagrams[0]?.title || "Imported Threat Dragon model",
    description: td.summary?.description,
    nodes,
    edges,
    notes,
    warnings,
  };
}

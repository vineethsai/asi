import { z } from "zod";
import LZString from "lz-string";
import type {
  CanvasEdge,
  CanvasNode,
  CustomComponentDefinition,
  MitigationStatusEntry,
  ThreatStatus,
} from "./types";
import { resolveMitigationId } from "./engine/catalog/mitigations";
import type { AnalysisInput, SuppressedRule, ThreatStatusEntry } from "./engine/analyze";

/**
 * Threat-model document v2 (P3-22). One JSON object holds everything a model
 * needs: graph, custom components, threat statuses (keyed by stable threat id
 * `${ruleId}::${componentKey}`), applied mitigations (catalog ids per node, "*"
 * = model-wide), suppressed rules and settings. No analysis results: they are
 * derived. Exported JSON, autosave, saved models and share links all use it.
 */
export const SCHEMA_VERSION = 2 as const;

const ThreatStatusValue = z.enum([
  "open",
  "mitigated",
  "accepted",
  "transferred",
  "false-positive",
]);
const MitigationStatusValue = z.enum([
  "not-started",
  "in-progress",
  "implemented",
  "accepted-risk",
]);

export const ThreatStatusEntrySchema = z.object({
  status: ThreatStatusValue,
  justification: z.string().optional(),
  owner: z.string().optional(),
  due: z.string().optional(),
  evidenceUrl: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const MitigationStatusEntrySchema = z.object({
  status: MitigationStatusValue,
  justification: z.string().optional(),
  owner: z.string().optional(),
  due: z.string().optional(),
  evidenceUrl: z.string().optional(),
  updatedAt: z.string().optional(),
});

const NodeSchema = z.looseObject({
  id: z.string().min(1),
  type: z.string().optional(),
  position: z.object({ x: z.number(), y: z.number() }),
  parentId: z.string().optional(),
  data: z.looseObject({
    label: z.string(),
    category: z.string(),
    maestroLayers: z.array(z.number()).default([]),
    trustLevel: z.enum(["untrusted", "semi-trusted", "trusted"]).default("semi-trusted"),
    threats: z.array(z.unknown()).default([]),
  }),
});

const EdgeSchema = z.looseObject({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  type: z.string().optional(),
  data: z.looseObject({}).optional(),
});

export const SuppressedRuleSchema = z.object({
  ruleId: z.string(),
  componentKey: z.string().optional(),
  componentKind: z.string().optional(),
  reason: z.string().optional(),
});

export const DocumentSettingsSchema = z.looseObject({
  analysisMode: z.enum(["manual", "live"]).default("manual"),
  methodology: z.literal("maestro").default("maestro"),
});

export const ThreatModelDocumentSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  id: z.string().min(1),
  name: z.string(),
  description: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  nodes: z.array(NodeSchema),
  edges: z.array(EdgeSchema),
  customComponents: z.array(z.looseObject({ id: z.string() })).default([]),
  threatStatuses: z.record(z.string(), ThreatStatusEntrySchema).default({}),
  appliedMitigations: z
    .record(z.string(), z.record(z.string(), MitigationStatusEntrySchema))
    .default({}),
  suppressedRules: z.array(SuppressedRuleSchema).default([]),
  settings: DocumentSettingsSchema.default({ analysisMode: "manual", methodology: "maestro" }),
  /** v1 data the migration could not map (kept so nothing is silently lost). */
  legacy: z
    .object({
      threatStatuses: z.record(z.string(), ThreatStatusEntrySchema).optional(),
      mitigations: z.record(z.string(), z.array(z.string())).optional(),
    })
    .optional(),
});

export interface ThreatModelDocument {
  schemaVersion: typeof SCHEMA_VERSION;
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  customComponents: CustomComponentDefinition[];
  threatStatuses: Record<string, ThreatStatusEntry>;
  /** nodeId (or "*") → mitigation catalog id → status. */
  appliedMitigations: Record<string, Record<string, MitigationStatusEntry>>;
  suppressedRules: SuppressedRule[];
  settings: { analysisMode: "manual" | "live"; methodology: "maestro"; [k: string]: unknown };
  legacy?: {
    threatStatuses?: Record<string, ThreatStatusEntry>;
    mitigations?: Record<string, string[]>;
  };
}

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

function issues(e: z.ZodError): string {
  return e.issues
    .slice(0, 5)
    .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("; ");
}

let idCounter = 0;
function newId(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  idCounter += 1;
  return `tm-${Date.now().toString(36)}-${idCounter}`;
}

export function createDocument(
  partial: Partial<Omit<ThreatModelDocument, "schemaVersion">> = {},
  now: string = new Date().toISOString(),
): ThreatModelDocument {
  return {
    schemaVersion: SCHEMA_VERSION,
    id: partial.id ?? newId(),
    name: partial.name ?? "Untitled model",
    description: partial.description,
    createdAt: partial.createdAt ?? now,
    updatedAt: partial.updatedAt ?? now,
    nodes: partial.nodes ?? [],
    edges: partial.edges ?? [],
    customComponents: partial.customComponents ?? [],
    threatStatuses: partial.threatStatuses ?? {},
    appliedMitigations: partial.appliedMitigations ?? {},
    suppressedRules: partial.suppressedRules ?? [],
    settings: { analysisMode: "manual", methodology: "maestro", ...(partial.settings ?? {}) },
    ...(partial.legacy ? { legacy: partial.legacy } : {}),
  };
}

/** Validate a v2 document (zod). */
export function parseDocument(raw: unknown): ParseResult<ThreatModelDocument> {
  const r = ThreatModelDocumentSchema.safeParse(raw);
  if (!r.success) return { ok: false, error: issues(r.error) };
  return { ok: true, value: r.data as unknown as ThreatModelDocument };
}

// ─── v1 migration ────────────────────────────────────────────────

/** Shapes written by the v1 canvas (autosave / export / ModelManager / statuses key). */
export interface V1Model {
  nodes?: CanvasNode[];
  edges?: CanvasEdge[];
  methodology?: string;
  customComponents?: CustomComponentDefinition[];
  analysisResult?: unknown;
  exportDate?: string;
  timestamp?: number;
}

export interface V1SavedModel {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  nodeCount?: number;
  edgeCount?: number;
  /** JSON string of V1Model. */
  data: string;
}

export type V1ThreatStatuses =
  | [string, { status: ThreatStatus; justification?: string }][]
  | Record<string, { status: ThreatStatus; justification?: string }>;

const V1_EDGE_RULES: [RegExp, string][] = [
  [/^conn-prompt-injection(?:-custom)?-(.+)$/, "TM-CONN-001"],
  [/^conn-tool-misuse(?:-custom)?-(.+)$/, "TM-CONN-003"],
  [/^conn-multi-agent-(.+)$/, "TM-CONN-006"],
  [/^conn-external-insecure-(.+)$/, "TM-CONN-007"],
];
/** v1 edge-keyed ids that are node-scoped (on the edge target) in v2. */
const V1_EDGE_TARGET_RULES: [RegExp, string][] = [
  [/^conn-code-exec(?:-custom)?-(.+)$/, "TM-NODE-030"],
  [/^conn-fn-call-injection(?:-custom)?-(.+)$/, "TM-NODE-020"],
  [/^conn-memory-poisoning-(.+)$/, "TM-NODE-010"],
];
const V1_NODE_RULES: [RegExp, string][] = [
  [/^topo-empty-boundary-(.+)$/, "TM-MODEL-006"],
  [/^topo-excessive-agency-(.+)$/, "TM-NODE-022"],
  [/^topo-no-hitl-(.+)$/, "TM-PATH-001"],
  [/^topo-spof-(.+)$/, "TM-NODE-060"],
  [/^topo-excessive-boundary-crossing-(.+)$/, "TM-MODEL-007"],
];

/** Map a v1 threat id to the v2 `${ruleId}::${componentKey}` id, when one exists. */
export function mapV1ThreatId(id: string, edges: CanvasEdge[] = []): string | undefined {
  for (const [re, rule] of V1_EDGE_RULES) {
    const m = re.exec(id);
    if (m) return `${rule}::${m[1]}`;
  }
  for (const [re, rule] of V1_EDGE_TARGET_RULES) {
    const m = re.exec(id);
    if (!m) continue;
    const edge = edges.find((e) => e.id === m[1]);
    return edge ? `${rule}::${edge.target}` : undefined;
  }
  for (const [re, rule] of V1_NODE_RULES) {
    const m = re.exec(id);
    if (m) return `${rule}::${m[1]}`;
  }
  return undefined;
}

function toEntries(s: V1ThreatStatuses | undefined) {
  if (!s) return [] as [string, { status: ThreatStatus; justification?: string }][];
  return Array.isArray(s) ? s : Object.entries(s);
}

/**
 * Migrate any v1 shape (autosave, exported JSON, ModelManager SavedModel,
 * user template) plus the old global statuses key into a v2 document.
 * Legacy free-text mitigation keys become catalog ids; statuses whose v1 id
 * maps to a v2 rule key move over; anything unmapped goes to `legacy`.
 */
export function migrateV1(
  input: V1Model | V1SavedModel | string,
  options: { statuses?: V1ThreatStatuses; name?: string; id?: string; now?: string } = {},
): ThreatModelDocument {
  let raw: unknown = input;
  if (typeof raw === "string") raw = JSON.parse(raw);
  let meta: Partial<V1SavedModel> = {};
  let model = raw as V1Model;
  if (raw && typeof (raw as V1SavedModel).data === "string") {
    meta = raw as V1SavedModel;
    model = JSON.parse((raw as V1SavedModel).data) as V1Model;
  }
  const edges = (model.edges ?? []).map((e) => ({
    ...e,
    data: e.data ? { ...e.data, threats: [] } : e.data,
  })) as CanvasEdge[];
  const appliedMitigations: ThreatModelDocument["appliedMitigations"] = {};
  const legacyMitigations: Record<string, string[]> = {};
  const nodes = (model.nodes ?? []).map((n) => {
    const d = n.data ?? ({} as CanvasNode["data"]);
    const statuses: Record<string, MitigationStatusEntry> = {};
    const unmapped: string[] = [];
    for (const [key, entry] of Object.entries(d.mitigationStatuses ?? {})) {
      const id = resolveMitigationId(key);
      if (id) statuses[id] = { ...entry };
      else unmapped.push(key);
    }
    for (const key of d.appliedMitigations ?? []) {
      const id = resolveMitigationId(key);
      if (!id) {
        if (!unmapped.includes(key) && !(key in (d.mitigationStatuses ?? {}))) unmapped.push(key);
        continue;
      }
      // v1 toggled mitigations without a status entry were "implemented".
      if (!statuses[id] && !(key in (d.mitigationStatuses ?? {})))
        statuses[id] = { status: "implemented" };
    }
    if (Object.keys(statuses).length) appliedMitigations[n.id] = statuses;
    if (unmapped.length) legacyMitigations[n.id] = unmapped;
    const implemented = Object.entries(statuses)
      .filter(([, s]) => s.status === "implemented")
      .map(([id]) => id);
    const data = {
      ...d,
      threats: [],
      mitigationStatuses: statuses,
      appliedMitigations: implemented,
    };
    if (!Object.keys(statuses).length) {
      delete (data as Partial<typeof data>).mitigationStatuses;
      delete (data as Partial<typeof data>).appliedMitigations;
    }
    return { ...n, data } as CanvasNode;
  });

  const threatStatuses: Record<string, ThreatStatusEntry> = {};
  const legacyStatuses: Record<string, ThreatStatusEntry> = {};
  for (const [id, entry] of toEntries(options.statuses)) {
    if (!entry || !ThreatStatusValue.safeParse(entry.status).success) continue;
    const v2 = id.includes("::") ? id : mapV1ThreatId(id, edges);
    if (v2)
      threatStatuses[v2] = {
        status: entry.status,
        ...(entry.justification ? { justification: entry.justification } : {}),
      };
    else
      legacyStatuses[id] = {
        status: entry.status,
        ...(entry.justification ? { justification: entry.justification } : {}),
      };
  }

  const now = options.now ?? new Date().toISOString();
  const created =
    meta.createdAt ??
    model.exportDate ??
    (model.timestamp ? new Date(model.timestamp).toISOString() : now);
  const legacy =
    Object.keys(legacyStatuses).length || Object.keys(legacyMitigations).length
      ? {
          ...(Object.keys(legacyStatuses).length ? { threatStatuses: legacyStatuses } : {}),
          ...(Object.keys(legacyMitigations).length ? { mitigations: legacyMitigations } : {}),
        }
      : undefined;
  return createDocument(
    {
      id: options.id ?? meta.id,
      name: options.name ?? meta.name ?? "Imported model",
      description: meta.description,
      createdAt: created,
      updatedAt: meta.updatedAt ?? now,
      nodes,
      edges,
      customComponents: model.customComponents ?? [],
      threatStatuses,
      appliedMitigations,
      legacy,
    },
    now,
  );
}

/** Accept a v2 document or any v1 shape; validates the result. */
export function loadDocument(
  raw: unknown,
  options: Parameters<typeof migrateV1>[1] = {},
): ParseResult<ThreatModelDocument> {
  try {
    const value = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (
      value &&
      typeof value === "object" &&
      (value as { schemaVersion?: number }).schemaVersion === SCHEMA_VERSION
    )
      return parseDocument(value);
    if (
      value &&
      typeof value === "object" &&
      (value as { schemaVersion?: number }).schemaVersion !== undefined
    )
      return {
        ok: false,
        error: `Unsupported schemaVersion ${(value as { schemaVersion: unknown }).schemaVersion}`,
      };
    return parseDocument(migrateV1(value as V1Model, options));
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Engine input for a document. */
export function documentToAnalysisInput(doc: ThreatModelDocument): AnalysisInput {
  return {
    nodes: doc.nodes,
    edges: doc.edges,
    customComponents: doc.customComponents,
    threatStatuses: doc.threatStatuses,
    mitigations: doc.appliedMitigations,
    suppressedRules: doc.suppressedRules,
  };
}

/** Exported JSON: the document without volatile badge data. */
export function serializeDocument(doc: ThreatModelDocument): string {
  const clean = {
    ...doc,
    nodes: doc.nodes.map((n) => ({
      ...n,
      selected: undefined,
      dragging: undefined,
      data: { ...n.data, threats: [] },
    })),
    edges: doc.edges.map((e) => ({
      ...e,
      selected: undefined,
      data: e.data ? { ...e.data, threats: [] } : e.data,
    })),
  };
  return JSON.stringify(clean, null, 2);
}

// ─── Share links (P3-24) ─────────────────────────────────────────

/** Maximum compressed share-link payload. */
export const SHARE_LINK_MAX_BYTES = 30 * 1024;

/** `?m=` value for a document, or null when it would exceed 30 KB. */
export function encodeShareLink(doc: ThreatModelDocument): string | null {
  const compact = JSON.stringify({
    ...doc,
    nodes: doc.nodes.map((n) => ({
      ...n,
      selected: undefined,
      dragging: undefined,
      measured: undefined,
      data: { ...n.data, threats: [] },
    })),
    edges: doc.edges.map((e) => ({
      ...e,
      selected: undefined,
      data: e.data ? { ...e.data, threats: [] } : e.data,
    })),
  });
  const encoded = LZString.compressToEncodedURIComponent(compact);
  return encoded.length > SHARE_LINK_MAX_BYTES ? null : encoded;
}

/** Decode and validate a `?m=` value; null when malformed, oversized or invalid. */
export function decodeShareLink(param: string | null | undefined): ThreatModelDocument | null {
  if (!param || param.length > SHARE_LINK_MAX_BYTES) return null;
  try {
    const json = LZString.decompressFromEncodedURIComponent(param);
    if (!json) return null;
    const r = loadDocument(JSON.parse(json));
    return r.ok ? r.value : null;
  } catch {
    return null;
  }
}

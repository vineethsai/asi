import {
  createDocument,
  loadDocument,
  parseDocument,
  type ThreatModelDocument,
  type V1ThreatStatuses,
} from "./document";
import type { CanvasNode, CustomComponentDefinition, MitigationStatusEntry } from "./types";

/**
 * Browser persistence for the Threat Modeler (P3-22).
 *
 *   threat-modeler-document-v2  — the working document (autosave), a v2 ThreatModelDocument
 *   threat-modeler-library-v2   — saved models (with versions) and user templates
 *   threat-modeler-ui-v2        — per-viewer UI preferences (onboarding seen, pane sizes)
 *
 * The six v1 keys are migrated once through `loadDocument` and then removed.
 */
export const DOCUMENT_KEY = "threat-modeler-document-v2";
export const LIBRARY_KEY = "threat-modeler-library-v2";
export const PREFS_KEY = "threat-modeler-ui-v2";

export const LEGACY_KEYS = {
  autosave: "threat-modeler-autosave",
  statuses: "threat-modeler-threat-statuses",
  customComponents: "threat-modeler-custom-components",
  savedModels: "threat-modeler-saved-models",
  userTemplates: "threat-modeler-user-templates",
  onboarding: "threat-modeler-onboarding-seen",
} as const;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** localStorage, or null where it is unavailable (private mode, SSR, blocked). */
export function browserStorage(): StorageLike | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function readJson<T>(store: StorageLike | null, key: string): T | null {
  if (!store) return null;
  try {
    const raw = store.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(store: StorageLike | null, key: string, value: unknown): boolean {
  if (!store) return false;
  try {
    store.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false; // quota exceeded / blocked
  }
}

// ─── Document normalisation ─────────────────────────────────────

/** Parents before children (React Flow requires it); stable otherwise. */
export function orderByParent<T extends { id: string; parentId?: string }>(nodes: T[]): T[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const depth = (n: T, seen = new Set<string>()): number => {
    if (!n.parentId || !byId.has(n.parentId) || seen.has(n.id)) return 0;
    seen.add(n.id);
    return 1 + depth(byId.get(n.parentId)!, seen);
  };
  return nodes
    .map((n, i) => ({ n, i, d: depth(n) }))
    .sort((a, b) => a.d - b.d || a.i - b.i)
    .map((x) => x.n);
}

/**
 * One source of truth per concern: node-level mitigation statuses (v1 / imports)
 * move into `document.appliedMitigations`; badge data and selection flags are
 * dropped; dangling parent ids are cleared; parents are ordered first.
 */
export function normaliseDocument(doc: ThreatModelDocument): ThreatModelDocument {
  const applied: Record<string, Record<string, MitigationStatusEntry>> = {
    ...doc.appliedMitigations,
  };
  const ids = new Set(doc.nodes.map((n) => n.id));
  let changed = false;
  const nodes = doc.nodes.map((n) => {
    const d = n.data ?? ({} as CanvasNode["data"]);
    const hasLegacy = d.mitigationStatuses || d.appliedMitigations;
    const dangling = n.parentId && !ids.has(n.parentId);
    const volatile = n.selected || n.dragging || (d.threats && d.threats.length > 0);
    if (!hasLegacy && !dangling && !volatile) return n;
    changed = true;
    const data = { ...d, threats: [] };
    if (hasLegacy) {
      const own: Record<string, MitigationStatusEntry> = {};
      for (const [id, entry] of Object.entries(d.mitigationStatuses ?? {})) own[id] = entry;
      for (const id of d.appliedMitigations ?? [])
        if (!own[id] && id.startsWith("MIT-")) own[id] = { status: "implemented" };
      if (Object.keys(own).length) applied[n.id] = { ...own, ...(applied[n.id] ?? {}) };
      delete (data as Partial<typeof data>).mitigationStatuses;
      delete (data as Partial<typeof data>).appliedMitigations;
    }
    const next: CanvasNode = { ...n, data, selected: false, dragging: false };
    if (dangling) delete next.parentId;
    return next;
  });
  const edges = doc.edges.map((e) => {
    if (!e.selected && !(e.data?.threats && e.data.threats.length)) return e;
    changed = true;
    return { ...e, selected: false, data: e.data ? { ...e.data, threats: [] } : e.data };
  });
  const ordered = orderByParent(nodes);
  if (ordered.some((n, i) => n !== nodes[i])) changed = true;
  return changed ? { ...doc, nodes: ordered, edges, appliedMitigations: applied } : doc;
}

/** JSON written to storage: no selection / drag / badge state. */
export function storableDocument(doc: ThreatModelDocument): ThreatModelDocument {
  return {
    ...doc,
    nodes: doc.nodes.map((n) => {
      const { selected: _s, dragging: _d, ...rest } = n;
      void _s;
      void _d;
      return { ...rest, data: { ...n.data, threats: [] } } as CanvasNode;
    }),
    edges: doc.edges.map((e) => {
      const { selected: _s, ...rest } = e;
      void _s;
      return { ...rest, data: e.data ? { ...e.data, threats: [] } : e.data } as typeof e;
    }),
  };
}

/** Merge custom-component libraries by id (incoming wins). */
export function mergeCustomComponents(
  current: CustomComponentDefinition[],
  incoming: CustomComponentDefinition[],
): CustomComponentDefinition[] {
  const map = new Map(current.map((c) => [c.id, c]));
  for (const c of incoming) map.set(c.id, c);
  return [...map.values()];
}

// ─── Saved models, versions, user templates ─────────────────────

export interface SavedVersion {
  id: string;
  label: string;
  savedAt: string;
  document: ThreatModelDocument;
}

export interface SavedModelEntry {
  /** Same as the document id. */
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  /** Oldest first; the last entry is the current head. */
  versions: SavedVersion[];
}

export interface UserTemplateEntry {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  document: ThreatModelDocument;
}

export interface Library {
  version: 2;
  models: SavedModelEntry[];
  templates: UserTemplateEntry[];
}

export interface Prefs {
  onboardingSeen?: boolean;
  paletteMode?: "open" | "rail";
  resultsOpen?: boolean;
  resultsWidth?: number;
  legendOpen?: boolean;
  flowAnimation?: boolean;
}

const EMPTY_LIBRARY: Library = { version: 2, models: [], templates: [] };

let uid = 0;
function shortId(prefix: string): string {
  uid += 1;
  return `${prefix}-${Date.now().toString(36)}-${uid.toString(36)}`;
}

function validDoc(raw: unknown): ThreatModelDocument | null {
  const r = parseDocument(raw);
  return r.ok ? normaliseDocument(r.value) : null;
}

export function readLibrary(store: StorageLike | null = browserStorage()): Library {
  const raw = readJson<Library>(store, LIBRARY_KEY);
  if (!raw || raw.version !== 2) return { ...EMPTY_LIBRARY, models: [], templates: [] };
  const models = (raw.models ?? [])
    .map((m) => ({
      ...m,
      versions: (m.versions ?? [])
        .map((v) => {
          const document = validDoc(v.document);
          return document ? { ...v, document } : null;
        })
        .filter(Boolean) as SavedVersion[],
    }))
    .filter((m) => m.versions.length > 0);
  const templates = (raw.templates ?? [])
    .map((t) => {
      const document = validDoc(t.document);
      return document ? { ...t, document } : null;
    })
    .filter(Boolean) as UserTemplateEntry[];
  return { version: 2, models, templates };
}

export function writeLibrary(lib: Library, store: StorageLike | null = browserStorage()): boolean {
  return writeJson(store, LIBRARY_KEY, {
    ...lib,
    models: lib.models.map((m) => ({
      ...m,
      versions: m.versions.map((v) => ({ ...v, document: storableDocument(v.document) })),
    })),
    templates: lib.templates.map((t) => ({ ...t, document: storableDocument(t.document) })),
  });
}

/**
 * Save `doc` to the library. "Save" (default) replaces the head version of
 * the model with the same id (update in place); `asVersion` appends a new
 * snapshot. Returns the updated entry.
 */
export function saveModel(
  doc: ThreatModelDocument,
  options: { asVersion?: boolean; label?: string; now?: string } = {},
  store: StorageLike | null = browserStorage(),
): SavedModelEntry {
  const lib = readLibrary(store);
  const now = options.now ?? new Date().toISOString();
  const snapshot = storableDocument({ ...doc, updatedAt: now });
  const idx = lib.models.findIndex((m) => m.id === doc.id);
  let entry: SavedModelEntry;
  if (idx < 0) {
    entry = {
      id: doc.id,
      name: doc.name,
      description: doc.description,
      createdAt: now,
      updatedAt: now,
      versions: [
        { id: shortId("v"), label: options.label ?? "v1", savedAt: now, document: snapshot },
      ],
    };
    lib.models.push(entry);
  } else {
    const prev = lib.models[idx];
    const versions = [...prev.versions];
    if (options.asVersion || versions.length === 0) {
      versions.push({
        id: shortId("v"),
        label: options.label ?? `v${versions.length + 1}`,
        savedAt: now,
        document: snapshot,
      });
    } else {
      const head = versions[versions.length - 1];
      versions[versions.length - 1] = {
        ...head,
        savedAt: now,
        document: snapshot,
        ...(options.label ? { label: options.label } : {}),
      };
    }
    entry = {
      ...prev,
      name: doc.name,
      description: doc.description,
      updatedAt: now,
      versions,
    };
    lib.models[idx] = entry;
  }
  writeLibrary(lib, store);
  return entry;
}

export function deleteModel(id: string, store: StorageLike | null = browserStorage()): void {
  const lib = readLibrary(store);
  writeLibrary({ ...lib, models: lib.models.filter((m) => m.id !== id) }, store);
}

export function deleteVersion(
  modelId: string,
  versionId: string,
  store: StorageLike | null = browserStorage(),
): void {
  const lib = readLibrary(store);
  writeLibrary(
    {
      ...lib,
      models: lib.models
        .map((m) =>
          m.id === modelId ? { ...m, versions: m.versions.filter((v) => v.id !== versionId) } : m,
        )
        .filter((m) => m.versions.length > 0),
    },
    store,
  );
}

export function saveUserTemplate(
  doc: ThreatModelDocument,
  name: string,
  description = "",
  store: StorageLike | null = browserStorage(),
): UserTemplateEntry {
  const lib = readLibrary(store);
  const entry: UserTemplateEntry = {
    id: shortId("user-template"),
    name,
    description,
    createdAt: new Date().toISOString(),
    document: storableDocument({
      ...doc,
      threatStatuses: {},
      appliedMitigations: {},
      suppressedRules: [],
    }),
  };
  writeLibrary({ ...lib, templates: [...lib.templates, entry] }, store);
  return entry;
}

export function deleteUserTemplate(id: string, store: StorageLike | null = browserStorage()) {
  const lib = readLibrary(store);
  writeLibrary({ ...lib, templates: lib.templates.filter((t) => t.id !== id) }, store);
}

// ─── Working document (autosave) ────────────────────────────────

export function readStoredDocument(
  store: StorageLike | null = browserStorage(),
): ThreatModelDocument | null {
  migrateLegacyStorage(store);
  const raw = readJson<unknown>(store, DOCUMENT_KEY);
  if (!raw) return null;
  const r = loadDocument(raw);
  return r.ok ? normaliseDocument(r.value) : null;
}

export function writeStoredDocument(
  doc: ThreatModelDocument,
  store: StorageLike | null = browserStorage(),
): boolean {
  return writeJson(store, DOCUMENT_KEY, storableDocument(doc));
}

export function clearStoredDocument(store: StorageLike | null = browserStorage()): void {
  try {
    store?.removeItem(DOCUMENT_KEY);
  } catch {
    /* ignore */
  }
}

export function readPrefs(store: StorageLike | null = browserStorage()): Prefs {
  return readJson<Prefs>(store, PREFS_KEY) ?? {};
}

export function writePrefs(patch: Prefs, store: StorageLike | null = browserStorage()): void {
  writeJson(store, PREFS_KEY, { ...readPrefs(store), ...patch });
}

// ─── One-time v1 migration ──────────────────────────────────────

interface V1SavedModelShape {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  data: string;
}

/**
 * Migrate the six v1 keys into the v2 keys, once. The v1 autosave (with the
 * global statuses and custom-component library) becomes the working document
 * unless a v2 document already exists; saved models and user templates move
 * into the library; the onboarding flag moves into the prefs. The legacy keys
 * are removed afterwards. Returns true when anything was migrated.
 */
export function migrateLegacyStorage(store: StorageLike | null = browserStorage()): boolean {
  if (!store) return false;
  let present = false;
  try {
    present = Object.values(LEGACY_KEYS).some((k) => store.getItem(k) !== null);
  } catch {
    return false;
  }
  if (!present) return false;

  const statuses = readJson<V1ThreatStatuses>(store, LEGACY_KEYS.statuses) ?? undefined;
  const custom = readJson<CustomComponentDefinition[]>(store, LEGACY_KEYS.customComponents) ?? [];

  if (!readJson<unknown>(store, DOCUMENT_KEY)) {
    const autosave = readJson<unknown>(store, LEGACY_KEYS.autosave);
    let doc: ThreatModelDocument | null = null;
    if (autosave) {
      const r = loadDocument(autosave, { statuses, name: "Restored model" });
      if (r.ok) doc = r.value;
    }
    if (!doc && custom.length) doc = createDocument({ name: "Untitled model" });
    if (doc) {
      doc = normaliseDocument({
        ...doc,
        customComponents: mergeCustomComponents(custom, doc.customComponents),
      });
      writeStoredDocument(doc, store);
    }
  }

  const lib = readLibrary(store);
  for (const m of readJson<V1SavedModelShape[]>(store, LEGACY_KEYS.savedModels) ?? []) {
    if (!m || typeof m.data !== "string" || lib.models.some((x) => x.id === m.id)) continue;
    const r = loadDocument(m, { statuses });
    if (!r.ok) continue;
    const doc = normaliseDocument(r.value);
    lib.models.push({
      id: doc.id,
      name: doc.name,
      description: doc.description,
      createdAt: m.createdAt ?? doc.createdAt,
      updatedAt: m.updatedAt ?? doc.updatedAt,
      versions: [{ id: shortId("v"), label: "v1", savedAt: doc.updatedAt, document: doc }],
    });
  }
  for (const t of readJson<V1SavedModelShape[]>(store, LEGACY_KEYS.userTemplates) ?? []) {
    if (!t || typeof t.data !== "string" || lib.templates.some((x) => x.id === t.id)) continue;
    const r = loadDocument(t.data, { name: t.name });
    if (!r.ok) continue;
    lib.templates.push({
      id: t.id,
      name: t.name,
      description: t.description,
      createdAt: t.createdAt ?? new Date().toISOString(),
      document: normaliseDocument(r.value),
    });
  }
  writeLibrary(lib, store);

  if (store.getItem(LEGACY_KEYS.onboarding)) writePrefs({ onboardingSeen: true }, store);
  for (const k of Object.values(LEGACY_KEYS)) {
    try {
      store.removeItem(k);
    } catch {
      /* ignore */
    }
  }
  return true;
}

/** In-memory StorageLike (tests, and a fallback when localStorage is blocked). */
export function memoryStorage(seed: Record<string, string> = {}): StorageLike & {
  dump(): Record<string, string>;
} {
  const map = new Map(Object.entries(seed));
  return {
    getItem: (k) => (map.has(k) ? map.get(k)! : null),
    setItem: (k, v) => void map.set(k, String(v)),
    removeItem: (k) => void map.delete(k),
    dump: () => Object.fromEntries(map),
  };
}

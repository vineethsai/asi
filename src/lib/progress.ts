/**
 * One versioned progress store for the whole site (IMPROVEMENT_PLAN.md P1-08).
 *
 * localStorage key: `ash-progress-v1`. Namespaces:
 *   aisvs:     Set<requirementId>                      (AISVS 1.01 ids)
 *   controls:  Record<controlId, Set<taskId>>          (ControlDetail checklists, e.g. "design-phase-0")
 *   checklist: Set<itemId>                             (/interactive SecurityChecklist)
 *   quizzes:   Record<quizId, { score, total, at }>    (Phase 4)
 *   path:      Record<stepId, boolean>                 (learning path, Phase 4)
 *   legacy?:   { aisvsDraft, aisvsArchivedNotice, migratedAt, migratedKeys }
 *
 * On first load (no `ash-progress-v1` yet) the three legacy keys are migrated once:
 *   `aisvs-checked-requirements` (string[])   → archived under legacy.aisvsDraft (ids changed in
 *                                                AISVS 1.01) + legacy.aisvsArchivedNotice = true
 *   `control-<id>-progress` ({[taskId]: bool}) → controls[<id>] (true values only)
 *   `ai-security-checklist` (string[])         → checklist
 * Legacy keys are left in place (pages still reading them keep working) until
 * `removeLegacyKeys()` is called.
 *
 * Usage (components):
 *   import { useProgress } from "@/hooks/useProgress";
 *   const done = useProgress((s) => s.aisvs.has(req.id));
 *   const toggle = useProgress((s) => s.toggleAisvs);
 *   const pct = useProgress(aisvsPct(totalRequirements));
 * Non-React: `useProgressStore.getState().toggleChecklist("iv-1")`.
 */

import { create, type StoreApi, type UseBoundStore } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

export const PROGRESS_STORAGE_KEY = "ash-progress-v1";
export const PROGRESS_VERSION = 1;

/** Legacy keys read by the one-time migration. */
export const LEGACY_KEYS = {
  aisvs: "aisvs-checked-requirements",
  controlPrefix: "control-",
  controlSuffix: "-progress",
  checklist: "ai-security-checklist",
} as const;

export interface QuizResult {
  score: number;
  total: number;
  /** ISO timestamp of the attempt. */
  at: string;
}

export interface LegacyArchive {
  /** Requirement ids checked against the pre-1.01 AISVS draft (ids no longer match). */
  aisvsDraft?: string[];
  /** True until the AISVS page has shown its one-time "your old progress was archived" notice. */
  aisvsArchivedNotice?: boolean;
  /** ISO timestamp of the migration. */
  migratedAt?: string;
  /** Which legacy localStorage keys contributed data. */
  migratedKeys?: string[];
}

export interface ProgressData {
  version: typeof PROGRESS_VERSION;
  aisvs: Set<string>;
  controls: Record<string, Set<string>>;
  checklist: Set<string>;
  quizzes: Record<string, QuizResult>;
  path: Record<string, boolean>;
  legacy?: LegacyArchive;
}

export type ProgressNamespace = "aisvs" | "controls" | "checklist" | "quizzes" | "path";

export interface ProgressActions {
  // AISVS
  toggleAisvs: (reqId: string) => void;
  setAisvs: (reqId: string, done: boolean) => void;
  setAisvsMany: (reqIds: readonly string[], done: boolean) => void;
  resetAisvs: () => void;
  dismissAisvsNotice: () => void;
  // Controls
  toggleControlTask: (controlId: string, taskId: string) => void;
  setControlTask: (controlId: string, taskId: string, done: boolean) => void;
  resetControl: (controlId: string) => void;
  resetControls: () => void;
  // Checklist
  toggleChecklist: (itemId: string) => void;
  setChecklist: (itemId: string, done: boolean) => void;
  resetChecklist: () => void;
  // Quizzes
  recordQuiz: (quizId: string, score: number, total: number, at?: string) => void;
  resetQuiz: (quizId: string) => void;
  resetQuizzes: () => void;
  // Learning path
  setPathStep: (stepId: string, done: boolean) => void;
  togglePathStep: (stepId: string) => void;
  resetPath: () => void;
  // Whole store
  resetNamespace: (ns: ProgressNamespace) => void;
  reset: () => void;
  exportJSON: () => string;
  importJSON: (json: string, mode?: "replace" | "merge") => ImportResult;
}

export type ProgressState = ProgressData & ProgressActions;
export type ImportResult = { ok: true } | { ok: false; error: string };

export function emptyProgress(): ProgressData {
  return {
    version: PROGRESS_VERSION,
    aisvs: new Set(),
    controls: {},
    checklist: new Set(),
    quizzes: {},
    path: {},
  };
}

// ─── Serialisation (Sets ⇄ arrays) ──────────────────────────────────────────

export interface SerializedProgress {
  version: number;
  aisvs: string[];
  controls: Record<string, string[]>;
  checklist: string[];
  quizzes: Record<string, QuizResult>;
  path: Record<string, boolean>;
  legacy?: LegacyArchive;
}

export function serializeProgress(d: ProgressData): SerializedProgress {
  const controls: Record<string, string[]> = {};
  for (const [id, set] of Object.entries(d.controls)) if (set.size) controls[id] = [...set];
  return {
    version: PROGRESS_VERSION,
    aisvs: [...d.aisvs],
    controls,
    checklist: [...d.checklist],
    quizzes: { ...d.quizzes },
    path: { ...d.path },
    ...(d.legacy ? { legacy: { ...d.legacy } } : {}),
  };
}

const strArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
const isObj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);

/** Tolerant parse of a serialised payload (unknown fields dropped, wrong types ignored). */
export function deserializeProgress(raw: unknown): ProgressData {
  const out = emptyProgress();
  if (!isObj(raw)) return out;
  out.aisvs = new Set(strArray(raw.aisvs));
  out.checklist = new Set(strArray(raw.checklist));
  if (isObj(raw.controls)) {
    for (const [id, tasks] of Object.entries(raw.controls)) {
      const arr = strArray(tasks);
      if (arr.length) out.controls[id] = new Set(arr);
    }
  }
  if (isObj(raw.quizzes)) {
    for (const [id, q] of Object.entries(raw.quizzes)) {
      if (isObj(q) && typeof q.score === "number" && typeof q.total === "number") {
        out.quizzes[id] = {
          score: q.score,
          total: q.total,
          at: typeof q.at === "string" ? q.at : new Date(0).toISOString(),
        };
      }
    }
  }
  if (isObj(raw.path)) {
    for (const [id, v] of Object.entries(raw.path)) if (typeof v === "boolean") out.path[id] = v;
  }
  if (isObj(raw.legacy)) {
    const l = raw.legacy;
    out.legacy = {
      ...(Array.isArray(l.aisvsDraft) ? { aisvsDraft: strArray(l.aisvsDraft) } : {}),
      ...(typeof l.aisvsArchivedNotice === "boolean"
        ? { aisvsArchivedNotice: l.aisvsArchivedNotice }
        : {}),
      ...(typeof l.migratedAt === "string" ? { migratedAt: l.migratedAt } : {}),
      ...(Array.isArray(l.migratedKeys) ? { migratedKeys: strArray(l.migratedKeys) } : {}),
    };
  }
  return out;
}

// ─── Legacy migration ───────────────────────────────────────────────────────

/** Minimal Storage surface used by the migration (window.localStorage satisfies it). */
export type LegacyStorage = Pick<Storage, "getItem" | "key" | "length">;

function safeJSON(raw: string | null): unknown {
  if (raw == null) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

/** Keys of the form `control-<id>-progress` present in storage. */
export function legacyControlKeys(storage: LegacyStorage): string[] {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const k = storage.key(i);
    if (
      k &&
      k.startsWith(LEGACY_KEYS.controlPrefix) &&
      k.endsWith(LEGACY_KEYS.controlSuffix) &&
      k.length > LEGACY_KEYS.controlPrefix.length + LEGACY_KEYS.controlSuffix.length
    ) {
      keys.push(k);
    }
  }
  return keys.sort();
}

/**
 * Build a fresh `ProgressData` from the legacy keys. Pure apart from reading `storage`;
 * returns `migrated: false` when no legacy data exists.
 */
export function migrateLegacy(
  storage: LegacyStorage,
  now: () => string = () => new Date().toISOString(),
): { data: ProgressData; migrated: boolean } {
  const data = emptyProgress();
  const migratedKeys: string[] = [];

  const aisvs = strArray(safeJSON(storage.getItem(LEGACY_KEYS.aisvs)));
  if (aisvs.length) {
    migratedKeys.push(LEGACY_KEYS.aisvs);
    data.legacy = { aisvsDraft: [...new Set(aisvs)], aisvsArchivedNotice: true };
  }

  for (const key of legacyControlKeys(storage)) {
    const controlId = key.slice(
      LEGACY_KEYS.controlPrefix.length,
      key.length - LEGACY_KEYS.controlSuffix.length,
    );
    const parsed = safeJSON(storage.getItem(key));
    if (!isObj(parsed)) continue;
    const done = Object.entries(parsed)
      .filter(([, v]) => v === true)
      .map(([taskId]) => taskId);
    if (done.length) {
      data.controls[controlId] = new Set(done);
      migratedKeys.push(key);
    }
  }

  const checklist = strArray(safeJSON(storage.getItem(LEGACY_KEYS.checklist)));
  if (checklist.length) {
    data.checklist = new Set(checklist);
    migratedKeys.push(LEGACY_KEYS.checklist);
  }

  if (!migratedKeys.length) return { data, migrated: false };
  data.legacy = { ...(data.legacy ?? {}), migratedAt: now(), migratedKeys };
  return { data, migrated: true };
}

/** Remove the legacy keys (call once every page reads from the new store). */
export function removeLegacyKeys(storage: Storage = window.localStorage): string[] {
  const keys = [LEGACY_KEYS.aisvs, LEGACY_KEYS.checklist, ...legacyControlKeys(storage)];
  const removed: string[] = [];
  for (const k of keys) {
    if (storage.getItem(k) !== null) {
      storage.removeItem(k);
      removed.push(k);
    }
  }
  return removed;
}

// ─── Selectors (pure; pass to useProgress / useProgressStore) ───────────────

const pct = (done: number, total: number) =>
  total > 0 ? Math.min(100, Math.round((done / total) * 1000) / 10) : 0;

/** Percent (0–100, one decimal) of AISVS requirements checked. */
export const aisvsPct =
  (total: number) =>
  (s: ProgressData): number =>
    pct(s.aisvs.size, total);

/** Count of checked requirements among `ids` (e.g. one chapter). */
export const aisvsDoneIn =
  (ids: readonly string[]) =>
  (s: ProgressData): number =>
    ids.reduce((n, id) => n + (s.aisvs.has(id) ? 1 : 0), 0);

/** Percent of a level's requirements checked. `idsByLevel` = { 1: [...], 2: [...], 3: [...] }. */
export const aisvsLevelPct =
  (level: 1 | 2 | 3, idsByLevel: Partial<Record<1 | 2 | 3, readonly string[]>>) =>
  (s: ProgressData): number => {
    const ids = idsByLevel[level] ?? [];
    return pct(aisvsDoneIn(ids)(s), ids.length);
  };

/** Number of controls with at least one task done. */
export const controlsStarted = (s: ProgressData): number =>
  Object.values(s.controls).filter((set) => set.size > 0).length;

/** Tasks done for a control. */
export const controlDone =
  (controlId: string) =>
  (s: ProgressData): number =>
    s.controls[controlId]?.size ?? 0;

/** Percent of a control's tasks done. */
export const controlPct =
  (controlId: string, total: number) =>
  (s: ProgressData): number =>
    pct(controlDone(controlId)(s), total);

export const isControlTaskDone =
  (controlId: string, taskId: string) =>
  (s: ProgressData): boolean =>
    s.controls[controlId]?.has(taskId) ?? false;

/** Percent of the security checklist completed. */
export const checklistPct =
  (total: number) =>
  (s: ProgressData): number =>
    pct(s.checklist.size, total);

/** Whether a learning-path step is done. */
export const pathStep =
  (stepId: string) =>
  (s: ProgressData): boolean =>
    s.path[stepId] === true;

/** Number of completed learning-path steps. */
export const pathDoneCount = (s: ProgressData): number =>
  Object.values(s.path).filter(Boolean).length;

export const quizResult =
  (quizId: string) =>
  (s: ProgressData): QuizResult | undefined =>
    s.quizzes[quizId];

/** One-line roll-up for the Home progress card. */
export const progressSummary = (s: ProgressData) => ({
  aisvsChecked: s.aisvs.size,
  controlsStarted: controlsStarted(s),
  controlTasksDone: Object.values(s.controls).reduce((n, set) => n + set.size, 0),
  checklistDone: s.checklist.size,
  quizzesTaken: Object.keys(s.quizzes).length,
  pathStepsDone: pathDoneCount(s),
  hasArchivedAisvs: (s.legacy?.aisvsDraft?.length ?? 0) > 0,
  showAisvsNotice: s.legacy?.aisvsArchivedNotice === true,
});

/** True when nothing has been recorded anywhere (Home can hide the progress card). */
export const isProgressEmpty = (s: ProgressData): boolean =>
  s.aisvs.size === 0 &&
  controlsStarted(s) === 0 &&
  s.checklist.size === 0 &&
  Object.keys(s.quizzes).length === 0 &&
  pathDoneCount(s) === 0;

// ─── Store factory ──────────────────────────────────────────────────────────

const withToggled = (set: Set<string>, id: string, done?: boolean): Set<string> => {
  const next = new Set(set);
  const shouldHave = done ?? !set.has(id);
  if (shouldHave) next.add(id);
  else next.delete(id);
  return next;
};

const pickData = (s: ProgressData): ProgressData => ({
  version: s.version,
  aisvs: s.aisvs,
  controls: s.controls,
  checklist: s.checklist,
  quizzes: s.quizzes,
  path: s.path,
  ...(s.legacy ? { legacy: s.legacy } : {}),
});

function mergeData(base: ProgressData, add: ProgressData): ProgressData {
  const controls: Record<string, Set<string>> = { ...base.controls };
  for (const [id, set] of Object.entries(add.controls)) {
    controls[id] = new Set([...(controls[id] ?? []), ...set]);
  }
  return {
    version: PROGRESS_VERSION,
    aisvs: new Set([...base.aisvs, ...add.aisvs]),
    controls,
    checklist: new Set([...base.checklist, ...add.checklist]),
    quizzes: { ...base.quizzes, ...add.quizzes },
    path: { ...base.path, ...add.path },
    ...(base.legacy || add.legacy ? { legacy: { ...base.legacy, ...add.legacy } } : {}),
  };
}

export interface CreateProgressStoreOptions {
  /** Storage backend (default: window.localStorage when available). */
  storage?: Storage;
  /** Storage key (default `ash-progress-v1`). */
  key?: string;
  /** Clock for timestamps (tests). */
  now?: () => string;
  /** Listen to cross-tab `storage` events and rehydrate (default true in the browser). */
  syncTabs?: boolean;
}

export type ProgressStore = UseBoundStore<StoreApi<ProgressState>>;

function browserStorage(): Storage | undefined {
  try {
    return typeof window !== "undefined" ? window.localStorage : undefined;
  } catch {
    return undefined;
  }
}

const memoryStorage = (): StateStorage => {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
  };
};

/** Create a progress store (the app uses the `useProgressStore` singleton below). */
export function createProgressStore(opts: CreateProgressStoreOptions = {}): ProgressStore {
  const storage = opts.storage ?? browserStorage();
  const key = opts.key ?? PROGRESS_STORAGE_KEY;
  const now = opts.now ?? (() => new Date().toISOString());

  // One-time migration: only when the new key has never been written.
  let initial = emptyProgress();
  let didMigrate = false;
  if (storage) {
    let existing: string | null = null;
    try {
      existing = storage.getItem(key);
    } catch {
      existing = null;
    }
    if (existing === null) {
      try {
        const res = migrateLegacy(storage, now);
        initial = res.data;
        didMigrate = res.migrated;
      } catch {
        /* corrupt legacy data: start empty */
      }
    }
  }

  const store = create<ProgressState>()(
    persist(
      (set, get) => {
        const patch = (fn: (s: ProgressState) => Partial<ProgressData>) => set((s) => fn(s));
        return {
          ...initial,

          toggleAisvs: (id) => patch((s) => ({ aisvs: withToggled(s.aisvs, id) })),
          setAisvs: (id, done) => patch((s) => ({ aisvs: withToggled(s.aisvs, id, done) })),
          setAisvsMany: (ids, done) =>
            patch((s) => {
              const next = new Set(s.aisvs);
              for (const id of ids) {
                if (done) next.add(id);
                else next.delete(id);
              }
              return { aisvs: next };
            }),
          resetAisvs: () => patch(() => ({ aisvs: new Set() })),
          dismissAisvsNotice: () =>
            patch((s) => (s.legacy ? { legacy: { ...s.legacy, aisvsArchivedNotice: false } } : {})),

          toggleControlTask: (cid, tid) =>
            patch((s) => ({
              controls: { ...s.controls, [cid]: withToggled(s.controls[cid] ?? new Set(), tid) },
            })),
          setControlTask: (cid, tid, done) =>
            patch((s) => ({
              controls: {
                ...s.controls,
                [cid]: withToggled(s.controls[cid] ?? new Set(), tid, done),
              },
            })),
          resetControl: (cid) =>
            patch((s) => {
              const { [cid]: _drop, ...rest } = s.controls;
              return { controls: rest };
            }),
          resetControls: () => patch(() => ({ controls: {} })),

          toggleChecklist: (id) => patch((s) => ({ checklist: withToggled(s.checklist, id) })),
          setChecklist: (id, done) =>
            patch((s) => ({ checklist: withToggled(s.checklist, id, done) })),
          resetChecklist: () => patch(() => ({ checklist: new Set() })),

          recordQuiz: (qid, score, total, at) =>
            patch((s) => ({ quizzes: { ...s.quizzes, [qid]: { score, total, at: at ?? now() } } })),
          resetQuiz: (qid) =>
            patch((s) => {
              const { [qid]: _drop, ...rest } = s.quizzes;
              return { quizzes: rest };
            }),
          resetQuizzes: () => patch(() => ({ quizzes: {} })),

          setPathStep: (sid, done) => patch((s) => ({ path: { ...s.path, [sid]: done } })),
          togglePathStep: (sid) => patch((s) => ({ path: { ...s.path, [sid]: !s.path[sid] } })),
          resetPath: () => patch(() => ({ path: {} })),

          resetNamespace: (ns) => {
            const empty = emptyProgress();
            patch(() => ({ [ns]: empty[ns] }) as Partial<ProgressData>);
          },
          reset: () => {
            const { legacy } = get();
            // Keep the archived AISVS draft (it cannot be regenerated) but drop the notice.
            set({
              ...emptyProgress(),
              ...(legacy?.aisvsDraft?.length
                ? { legacy: { aisvsDraft: legacy.aisvsDraft, aisvsArchivedNotice: false } }
                : { legacy: undefined }),
            });
          },

          exportJSON: () =>
            JSON.stringify(
              {
                schema: "ash-progress",
                exportedAt: now(),
                ...serializeProgress(pickData(get())),
              },
              null,
              2,
            ),
          importJSON: (json, mode = "replace") => {
            let parsed: unknown;
            try {
              parsed = JSON.parse(json);
            } catch {
              return { ok: false, error: "Not valid JSON." };
            }
            if (!isObj(parsed)) return { ok: false, error: "Expected a JSON object." };
            if (parsed.schema !== undefined && parsed.schema !== "ash-progress") {
              return { ok: false, error: `Unknown schema "${String(parsed.schema)}".` };
            }
            if (typeof parsed.version === "number" && parsed.version > PROGRESS_VERSION) {
              return { ok: false, error: `Export is from a newer version (${parsed.version}).` };
            }
            const incoming = deserializeProgress(parsed);
            set(mode === "merge" ? mergeData(pickData(get()), incoming) : incoming);
            return { ok: true };
          },
        };
      },
      {
        name: key,
        version: PROGRESS_VERSION,
        storage: createJSONStorage(() => (storage as StateStorage) ?? memoryStorage()),
        partialize: (s) => serializeProgress(pickData(s)) as unknown as ProgressState,
        merge: (persisted, current) => ({
          ...current,
          ...(persisted ? deserializeProgress(persisted) : {}),
        }),
        migrate: (persisted) => persisted as ProgressState,
      },
    ),
  );

  // Persist the migrated snapshot immediately so the migration really is one-time.
  if (didMigrate) store.setState({});

  if ((opts.syncTabs ?? true) && typeof window !== "undefined" && storage === browserStorage()) {
    window.addEventListener("storage", (e) => {
      if (e.key === key) void store.persist.rehydrate();
    });
  }

  return store;
}

/** App-wide singleton. Prefer the `useProgress` hook in components. */
export const useProgressStore: ProgressStore = createProgressStore();

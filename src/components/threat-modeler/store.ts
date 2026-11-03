import { createStore, type StoreApi } from "zustand/vanilla";
import { useStore } from "zustand";
import { createDocument, documentToAnalysisInput, type ThreatModelDocument } from "./document";
import { rescoreAnalysis, summariseForNextRun, type SuppressedRule } from "./engine/analyze";
import { runAnalysis } from "./engine/runAnalysis";
import {
  browserStorage,
  mergeCustomComponents,
  normaliseDocument,
  readLibrary,
  readPrefs,
  readStoredDocument,
  saveModel,
  writePrefs,
  writeStoredDocument,
  type Prefs,
} from "./persistence";
import type { CanvasEdgeData } from "./types";
import {
  COALESCE_MS,
  MAX_HISTORY,
  PREF_KEYS,
  defaultUi,
  deriveThreatMaps,
  documentFingerprint,
  prefersReduced,
  stripSelection,
  wait,
} from "./storeDerived";
import type { AnalysisUpdate, HistoryEntry, StoreOptions, ThreatModelState } from "./storeTypes";

import { bootstrapFromSearch, whatIfRemoval } from "./storeBootstrap";

export * from "./storeTypes";
export {
  bySeverity,
  deriveThreatMaps,
  documentFingerprint,
  threatResolution,
  type Resolution,
} from "./storeDerived";

/**
 * Threat Modeler store (P3-20 / P3-21 / P3-22). One zustand store holds the v2
 * document, the analysis that belongs to it, undo/redo history and UI state.
 *
 * - `commit(next, label)` is the only way to change the model: it sets state
 *   AND pushes the previous {document, analysis} onto the undo stack, so undo
 *   and redo restore the analysis too.
 * - `setGraph()` is for transient React Flow changes (drag frames, selection,
 *   measuring); a drag is wrapped in `beginGesture()` / `endGesture(label)`.
 * - Statuses, mitigations and "not applicable" suppressions live in the
 *   document; status / mitigation commits re-score the analysis in place.
 * - Persistence: `autosave` writes the document under DOCUMENT_KEY; `transient`
 *   (a ?template= link) writes nothing until the first commit; `readonly`
 *   (a ?m= share link) refuses commits until `makeCopy()`.
 */

// ─── Store factory ──────────────────────────────────────────────

export function createThreatModelStore(options: StoreOptions = {}): StoreApi<ThreatModelState> {
  const storage = options.storage === undefined ? browserStorage() : options.storage;
  const autosaveDelay = options.autosaveDelayMs ?? 400;
  const minSweep = options.minSweepMs ?? 500;
  let runSeq = 0;
  let gesture: HistoryEntry | null = null;
  let saveTimer: ReturnType<typeof setTimeout> | null = null;

  const store = createStore<ThreatModelState>()((set, get) => {
    const pushPast = (entry: HistoryEntry, coalesce?: string): HistoryEntry[] => {
      const past = get().past;
      const last = past[past.length - 1];
      if (coalesce && last?.coalesce === coalesce && entry.at - last.at < COALESCE_MS) {
        // Keep the older snapshot; refresh its timestamp so a burst stays one entry.
        return [...past.slice(0, -1), { ...last, at: entry.at }];
      }
      const next = [...past, { ...entry, coalesce }];
      return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
    };

    const nextAnalysis = (
      doc: ThreatModelDocument,
      update: AnalysisUpdate | undefined,
    ): Pick<
      ThreatModelState,
      "analysis" | "analysisFingerprint" | "nodeThreats" | "edgeThreats"
    > | null => {
      const s = get();
      if (update === undefined || update === "keep") return null;
      if (update === "reset" || update === null)
        return { analysis: null, analysisFingerprint: null, ...deriveThreatMaps(null) };
      if (update === "rescore") {
        if (!s.analysis) return null;
        if (s.analysisFingerprint !== documentFingerprint(doc)) return null; // stale: re-run instead
        const rescored = rescoreAnalysis(s.analysis, documentToAnalysisInput(doc));
        const analysis = { ...rescored, changeSummary: s.analysis.changeSummary };
        return {
          analysis,
          analysisFingerprint: s.analysisFingerprint,
          ...deriveThreatMaps(analysis),
        };
      }
      return {
        analysis: update,
        analysisFingerprint: documentFingerprint(doc),
        ...deriveThreatMaps(update),
      };
    };

    const touch = (doc: ThreatModelDocument): ThreatModelDocument => ({
      ...doc,
      updatedAt: new Date().toISOString(),
    });

    const commit: ThreatModelState["commit"] = (next, label, opts = {}) => {
      const s = get();
      if (s.persist === "readonly") return false;
      const prev = s.document;
      const doc = typeof next === "function" ? next(prev) : next;
      if (doc === prev) return false;
      const now = Date.now();
      const analysisPatch = nextAnalysis(doc, opts.analysis);
      set({
        document: touch(doc),
        past: pushPast(
          {
            document: stripSelection(prev),
            analysis: s.analysis,
            analysisFingerprint: s.analysisFingerprint,
            label,
            at: now,
          },
          opts.coalesce,
        ),
        future: [],
        persist: s.persist === "transient" ? "autosave" : s.persist,
        ...(analysisPatch ?? {}),
      });
      // Statuses on a stale analysis cannot be re-scored in place: re-run.
      if (opts.analysis === "rescore" && !analysisPatch && get().analysis) void get().analyze();
      return true;
    };

    const prefs = readPrefs(storage);

    return {
      document: createDocument(),
      analysis: null,
      analysisFingerprint: null,
      analysisPhase: "idle",
      analysisError: null,
      runBaseline: null,
      past: [],
      future: [],
      // Nothing is written until bootstrap() decides where the document comes from.
      persist: "transient",
      lastSavedAt: null,
      bootstrappedSearch: null,
      stashedModel: null,
      nodeThreats: {},
      edgeThreats: {},
      ui: defaultUi(prefs),

      commit,

      setGraph: (update) => {
        const s = get();
        const { nodes, edges } = update(s.document.nodes, s.document.edges);
        if (nodes === s.document.nodes && edges === s.document.edges) return;
        set({ document: { ...s.document, nodes, edges } });
      },

      beginGesture: () => {
        const s = get();
        gesture = {
          document: stripSelection(s.document),
          analysis: s.analysis,
          analysisFingerprint: s.analysisFingerprint,
          label: "",
          at: Date.now(),
        };
      },

      endGesture: (label) => {
        const g = gesture;
        gesture = null;
        const s = get();
        if (!g || s.persist === "readonly") return;
        const before = g.document;
        const moved =
          s.document.nodes.some((n, i) => {
            const b = before.nodes[i];
            return (
              !b ||
              b.id !== n.id ||
              b.position.x !== n.position.x ||
              b.position.y !== n.position.y ||
              b.parentId !== n.parentId ||
              b.style !== n.style
            );
          }) ||
          before.nodes.length !== s.document.nodes.length ||
          before.edges !== s.document.edges;
        if (!moved) return;
        set({
          document: touch(s.document),
          past: pushPast({ ...g, label, at: Date.now() }),
          future: [],
          persist: s.persist === "transient" ? "autosave" : s.persist,
        });
      },

      cancelGesture: () => {
        if (!gesture) return;
        const g = gesture;
        gesture = null;
        set({ document: g.document });
      },

      undo: () => {
        const s = get();
        const entry = s.past[s.past.length - 1];
        if (!entry || s.persist === "readonly") return;
        set({
          document: entry.document,
          analysis: entry.analysis,
          analysisFingerprint: entry.analysis
            ? (entry.analysisFingerprint ?? documentFingerprint(entry.document))
            : null,
          ...deriveThreatMaps(entry.analysis),
          past: s.past.slice(0, -1),
          future: [
            ...s.future,
            {
              document: stripSelection(s.document),
              analysis: s.analysis,
              analysisFingerprint: s.analysisFingerprint,
              label: entry.label,
              at: Date.now(),
            },
          ],
          ui: {
            ...s.ui,
            selectedNodeId: null,
            selectedEdgeId: null,
            whatIf: { active: s.ui.whatIf.active, result: null },
            playback: null,
            highlight: null,
          },
        });
      },

      redo: () => {
        const s = get();
        const entry = s.future[s.future.length - 1];
        if (!entry || s.persist === "readonly") return;
        set({
          document: entry.document,
          analysis: entry.analysis,
          analysisFingerprint: entry.analysis
            ? (entry.analysisFingerprint ?? documentFingerprint(entry.document))
            : null,
          ...deriveThreatMaps(entry.analysis),
          future: s.future.slice(0, -1),
          past: [
            ...s.past,
            {
              document: stripSelection(s.document),
              analysis: s.analysis,
              analysisFingerprint: s.analysisFingerprint,
              label: entry.label,
              at: Date.now(),
            },
          ],
          ui: {
            ...s.ui,
            selectedNodeId: null,
            selectedEdgeId: null,
            playback: null,
            highlight: null,
          },
        });
      },

      resetAnalysis: () => {
        runSeq += 1; // drop any run in flight
        set((s) => ({
          analysis: null,
          analysisFingerprint: null,
          analysisPhase: "idle",
          analysisError: null,
          runBaseline: null,
          nodeThreats: {},
          edgeThreats: {},
          ui: {
            ...s.ui,
            selectedThreatId: null,
            whatIf: { active: false, result: null },
            playback: null,
            highlight: null,
          },
        }));
      },

      replaceDocument: (doc, label, opts = {}) => {
        const s = get();
        let next = normaliseDocument(doc);
        if (opts.mergeCustom !== false)
          next = {
            ...next,
            customComponents: mergeCustomComponents(
              s.document.customComponents,
              next.customComponents,
            ),
          };
        if (opts.resetHistory || opts.persist === "readonly" || s.persist === "readonly") {
          get().resetAnalysis();
          set({
            document: next,
            past: [],
            future: [],
            persist: opts.persist ?? "autosave",
            ui: { ...get().ui, selectedNodeId: null, selectedEdgeId: null, connectFrom: null },
          });
          return;
        }
        get().resetAnalysis();
        set({
          document: next,
          past: pushPast({
            document: stripSelection(s.document),
            analysis: s.analysis,
            analysisFingerprint: s.analysisFingerprint,
            label,
            at: Date.now(),
          }),
          future: [],
          persist: opts.persist ?? (s.persist === "transient" ? "autosave" : s.persist),
          ui: { ...get().ui, selectedNodeId: null, selectedEdgeId: null, connectFrom: null },
        });
      },

      analyze: async () => {
        const seq = ++runSeq;
        const doc = get().document;
        const fp = documentFingerprint(doc);
        set({ analysisPhase: "running", analysisError: null });
        const started = Date.now();
        try {
          const result = await runAnalysis(documentToAnalysisInput(doc), {
            inThread: options.inThread,
            previous: get().runBaseline,
          });
          if (seq !== runSeq) return null;
          const remaining = minSweep - (Date.now() - started);
          if (remaining > 0 && !prefersReduced()) await wait(remaining);
          if (seq !== runSeq) return null;
          set((s) => ({
            analysis: result,
            analysisFingerprint: fp,
            analysisPhase: "idle",
            runBaseline: summariseForNextRun(result),
            ...deriveThreatMaps(result),
            ui: { ...s.ui, sweepKey: s.ui.sweepKey + 1, whatIf: { ...s.ui.whatIf, result: null } },
          }));
          return result;
        } catch (e) {
          if (seq === runSeq)
            set({
              analysisPhase: "idle",
              analysisError: e instanceof Error ? e.message : String(e),
            });
          return null;
        }
      },

      updateNodeData: (id, patch, label = "Edit component") => {
        commit(
          (doc) => ({
            ...doc,
            nodes: doc.nodes.map((n) =>
              n.id === id ? { ...n, data: { ...n.data, ...patch } } : n,
            ),
          }),
          label,
          { coalesce: `node:${id}:${Object.keys(patch).sort().join(",")}` },
        );
      },

      updateEdgeData: (id, patch, label = "Edit data flow") => {
        commit(
          (doc) => ({
            ...doc,
            edges: doc.edges.map((e) =>
              e.id === id ? { ...e, data: { ...(e.data as CanvasEdgeData), ...patch } } : e,
            ),
          }),
          label,
        );
      },

      setDocumentMeta: (patch) => {
        commit((doc) => ({ ...doc, ...patch }), "Rename model", { coalesce: "meta" });
      },

      setThreatStatus: (ids, entry) => {
        if (!ids.length) return;
        const updatedAt = new Date().toISOString();
        commit(
          (doc) => {
            const threatStatuses = { ...doc.threatStatuses };
            for (const id of ids) {
              if (!entry || entry.status === "open") delete threatStatuses[id];
              else threatStatuses[id] = { ...entry, updatedAt };
            }
            return { ...doc, threatStatuses };
          },
          ids.length > 1 ? `Set status of ${ids.length} threats` : "Set threat status",
          { analysis: "rescore" },
        );
      },

      setMitigation: (target, mitigationId, entry) => {
        commit(
          (doc) => {
            const forTarget = { ...(doc.appliedMitigations[target] ?? {}) };
            const hasDetail =
              !!entry && !!(entry.owner || entry.due || entry.justification || entry.evidenceUrl);
            if (!entry || (entry.status === "not-started" && !hasDetail))
              delete forTarget[mitigationId];
            else forTarget[mitigationId] = { ...entry, updatedAt: new Date().toISOString() };
            const appliedMitigations = { ...doc.appliedMitigations, [target]: forTarget };
            if (!Object.keys(forTarget).length) delete appliedMitigations[target];
            return { ...doc, appliedMitigations };
          },
          "Update mitigation",
          { analysis: "rescore" },
        );
      },

      suppress: (rule) => {
        const ok = commit(
          (doc) => ({ ...doc, suppressedRules: [...doc.suppressedRules, rule] }),
          "Mark not applicable",
          { analysis: "keep" },
        );
        if (ok && get().analysis) void get().analyze();
      },

      unsuppress: (rule) => {
        const same = (r: SuppressedRule) =>
          r.ruleId === rule.ruleId &&
          r.componentKey === rule.componentKey &&
          r.componentKind === rule.componentKind;
        const ok = commit(
          (doc) => ({ ...doc, suppressedRules: doc.suppressedRules.filter((r) => !same(r)) }),
          "Restore rule",
          { analysis: "keep" },
        );
        if (ok && get().analysis) void get().analyze();
      },

      setUi: (patch) => {
        const s = get();
        const p = typeof patch === "function" ? patch(s.ui) : patch;
        const ui = { ...s.ui, ...p };
        set({ ui });
        const prefPatch: Prefs = {};
        let any = false;
        for (const k of PREF_KEYS)
          if (k in p) {
            (prefPatch as Record<string, unknown>)[k] = ui[k];
            any = true;
          }
        if (any) writePrefs(prefPatch, storage);
      },

      openDialog: (name, payload) => set((s) => ({ ui: { ...s.ui, dialog: { name, payload } } })),
      closeDialog: () => set((s) => ({ ui: { ...s.ui, dialog: null } })),

      simulateRemoval: (nodeId) => {
        const result = whatIfRemoval(get().document, get().analysis, nodeId);
        if (result) set((st) => ({ ui: { ...st.ui, whatIf: { active: true, result } } }));
      },

      makeCopy: () => {
        const s = get();
        const copy = createDocument({
          ...s.document,
          id: undefined,
          name: `Copy of ${s.document.name}`,
          createdAt: undefined,
          updatedAt: undefined,
        });
        set({ document: normaliseDocument(copy), persist: "autosave", past: [], future: [] });
        get().flushAutosave();
      },

      bootstrap: (search) => bootstrapFromSearch(search, get, (patch) => set(patch), storage),

      flushAutosave: () => {
        if (saveTimer) {
          clearTimeout(saveTimer);
          saveTimer = null;
        }
        const s = get();
        if (s.persist !== "autosave") return;
        if (writeStoredDocument(s.document, storage))
          set({ lastSavedAt: new Date().toISOString() });
      },
    };
  });

  // Before a template or shared model starts autosaving over the user's own
  // canvas, keep that canvas in the library so nothing is lost silently.
  store.subscribe((state, prev) => {
    if (state.persist !== "autosave" || prev.persist === "autosave" || !storage) return;
    const stored = readStoredDocument(storage);
    if (!stored || !stored.nodes.length || stored.id === state.document.id) return;
    const existing = readLibrary(storage).models.find((m) => m.id === stored.id);
    const head = existing?.versions[existing.versions.length - 1];
    if (head && documentFingerprint(head.document) === documentFingerprint(stored)) return;
    saveModel(
      stored,
      existing ? { asVersion: true, label: "Autosave before switching" } : {},
      storage,
    );
    store.setState({ stashedModel: { name: stored.name, at: Date.now() } });
  });

  // Autosave: debounce writes of the document while in autosave mode.
  store.subscribe((state, prev) => {
    if (state.persist !== "autosave") return;
    if (state.document === prev.document && state.persist === prev.persist) return;
    if (saveTimer) clearTimeout(saveTimer);
    if (autosaveDelay <= 0) {
      store.getState().flushAutosave();
      return;
    }
    saveTimer = setTimeout(() => store.getState().flushAutosave(), autosaveDelay);
  });

  return store;
}

// ─── App singleton ──────────────────────────────────────────────

let singleton: StoreApi<ThreatModelState> | null = null;

export function getThreatModelStore(): StoreApi<ThreatModelState> {
  if (!singleton) singleton = createThreatModelStore();
  return singleton;
}

/** Select from the Threat Modeler store. */
export function useTM<T>(selector: (s: ThreatModelState) => T): T {
  return useStore(getThreatModelStore(), selector);
}

/** Imperative access (event handlers). */
export const tm = () => getThreatModelStore().getState();

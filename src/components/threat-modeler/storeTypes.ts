import type { ThreatModelDocument } from "./document";
import type {
  AnalysisResult,
  PreviousRunSummary,
  SuppressedRule,
  ThreatStatusEntry,
} from "./engine/analyze";
import type { StorageLike } from "./persistence";
import type {
  CanvasEdge,
  CanvasEdgeData,
  CanvasNode,
  CanvasNodeData,
  MitigationStatusEntry,
  Severity,
} from "./types";

/** State and option types of the Threat Modeler store (see store.ts). */

export type PersistMode = "autosave" | "transient" | "readonly";

export type DialogName =
  | "shortcuts"
  | "onboarding"
  | "templates"
  | "models"
  | "bomImport"
  | "clear"
  | "posture"
  | "customComponent"
  | "importConfirm"
  | "notes"
  | "share";

export interface DialogState {
  name: DialogName;
  payload?: Record<string, unknown>;
}

export type ResultsTab = "threats" | "paths" | "compliance" | "mappings" | "dashboard";

export interface CanvasHighlight {
  activeNodeId?: string;
  activeEdgeId?: string;
  activeEdgeReverse?: boolean;
  visitedNodeIds: string[];
  visitedEdgeIds: string[];
  band: Severity;
  runKey: number;
  hopMs: number;
  still: boolean;
}

export interface WhatIfResult {
  nodeId: string;
  label: string;
  before: { threats: number; open: number; score: number; paths: number };
  after: { threats: number; open: number; score: number; paths: number };
}

export interface UiState {
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  /** Threat highlighted in the results panel (and its nodes on the canvas). */
  selectedThreatId: string | null;
  paletteMode: "open" | "rail";
  resultsOpen: boolean;
  resultsWidth: number;
  resultsTab: ResultsTab;
  /** Bottom sheet shown below `lg`. */
  sheet: null | "palette" | "results" | "properties";
  flowAnimation: boolean;
  snapToGrid: boolean;
  legendOpen: boolean;
  /** Keyboard / tap connection in progress from this node (P3-38 `C`). */
  connectFrom: string | null;
  /** Trust boundary under the node being dragged (drop-target highlight). */
  dropTargetId: string | null;
  whatIf: { active: boolean; result: WhatIfResult | null };
  playback: { pathId: string } | null;
  highlight: CanvasHighlight | null;
  /** Bumped when a run lands; nodes re-run their badge pop animation. */
  sweepKey: number;
  dialog: DialogState | null;
}

export interface NodeThreatSummary {
  total: number;
  open: number;
  /** Mitigated, false-positive, accepted or transferred (shown struck through). */
  resolved: number;
  inherited: number;
  /** Severity band of the highest open residual score (null when nothing is open). */
  band: Severity | null;
  /** 0–1 fill intensity from the component's residual risk. */
  intensity: number;
  /** Position among nodes with threats (badge pop stagger). */
  order: number;
  /** Screen-reader summary used by aria-describedby. */
  text: string;
}

export interface EdgeThreatSummary {
  total: number;
  open: number;
  band: Severity | null;
  /** 0–1: highest attack-path residual through this edge. */
  pathWeight: number;
}

export interface HistoryEntry {
  document: ThreatModelDocument;
  analysis: AnalysisResult | null;
  /** Fingerprint the analysis was computed for (it may already have been stale). */
  analysisFingerprint?: string | null;
  label: string;
  at: number;
  coalesce?: string;
}

export type AnalysisUpdate = "keep" | "rescore" | "reset" | AnalysisResult | null;

export interface CommitOptions {
  analysis?: AnalysisUpdate;
  /** Merge with the previous entry when it has the same key and is < 1 s old (nudges, typing). */
  coalesce?: string;
}

export interface BootstrapResult {
  source: "shared" | "template" | "autosave" | "empty" | "kept";
  error?: string;
  threatId?: string;
  templateName?: string;
}

export interface ThreatModelState {
  document: ThreatModelDocument;
  analysis: AnalysisResult | null;
  /** Fingerprint of the document the analysis was computed for. */
  analysisFingerprint: string | null;
  analysisPhase: "idle" | "running";
  analysisError: string | null;
  /** Baseline for the next run's change strip. */
  runBaseline: PreviousRunSummary | null;
  past: HistoryEntry[];
  future: HistoryEntry[];
  persist: PersistMode;
  lastSavedAt: string | null;
  bootstrappedSearch: string | null;
  /**
   * Name of the autosaved canvas that was moved to "My models" because a
   * template or shared link took its place (set once per stash; the UI toasts).
   */
  stashedModel: { name: string; at: number } | null;
  nodeThreats: Record<string, NodeThreatSummary>;
  edgeThreats: Record<string, EdgeThreatSummary>;
  ui: UiState;

  commit: (
    next: ThreatModelDocument | ((doc: ThreatModelDocument) => ThreatModelDocument),
    label: string,
    options?: CommitOptions,
  ) => boolean;
  setGraph: (
    update: (
      nodes: CanvasNode[],
      edges: CanvasEdge[],
    ) => { nodes: CanvasNode[]; edges: CanvasEdge[] },
  ) => void;
  beginGesture: () => void;
  endGesture: (label: string) => void;
  cancelGesture: () => void;
  undo: () => void;
  redo: () => void;
  resetAnalysis: () => void;
  replaceDocument: (
    doc: ThreatModelDocument,
    label: string,
    options?: { persist?: PersistMode; resetHistory?: boolean; mergeCustom?: boolean },
  ) => void;
  analyze: () => Promise<AnalysisResult | null>;
  updateNodeData: (id: string, patch: Partial<CanvasNodeData>, label?: string) => void;
  updateEdgeData: (id: string, patch: Partial<CanvasEdgeData>, label?: string) => void;
  setDocumentMeta: (patch: { name?: string; description?: string }) => void;
  setThreatStatus: (ids: string[], entry: Omit<ThreatStatusEntry, "updatedAt"> | null) => void;
  setMitigation: (
    target: string,
    mitigationId: string,
    entry: MitigationStatusEntry | null,
  ) => void;
  suppress: (rule: SuppressedRule) => void;
  unsuppress: (rule: SuppressedRule) => void;
  setUi: (patch: Partial<UiState> | ((ui: UiState) => Partial<UiState>)) => void;
  openDialog: (name: DialogName, payload?: Record<string, unknown>) => void;
  closeDialog: () => void;
  simulateRemoval: (nodeId: string) => void;
  makeCopy: () => void;
  bootstrap: (search: string) => BootstrapResult;
  flushAutosave: () => void;
}

export interface StoreOptions {
  storage?: StorageLike | null;
  autosaveDelayMs?: number;
  /** Minimum duration of the analysis sweep (§7.5). 0 in tests. */
  minSweepMs?: number;
  /** Run the engine in-thread (tests). */
  inThread?: boolean;
}

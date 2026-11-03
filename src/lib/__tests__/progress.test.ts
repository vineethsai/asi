import { beforeEach, describe, expect, it } from "vitest";
import {
  PROGRESS_STORAGE_KEY,
  aisvsLevelPct,
  aisvsPct,
  checklistPct,
  controlPct,
  controlsStarted,
  createProgressStore,
  isProgressEmpty,
  migrateLegacy,
  pathStep,
  progressSummary,
  removeLegacyKeys,
} from "@/lib/progress";

const NOW = "2026-11-03T12:00:00.000Z";

/**
 * In-memory Storage. Node >= 25 ships an experimental global `localStorage` getter that shadows
 * jsdom's implementation (it is `undefined` without --localstorage-file), so tests bring their own.
 */
class MemoryStorage implements Storage {
  private m = new Map<string, string>();
  get length() {
    return this.m.size;
  }
  clear() {
    this.m.clear();
  }
  getItem(k: string) {
    return this.m.has(k) ? (this.m.get(k) as string) : null;
  }
  key(i: number) {
    return [...this.m.keys()][i] ?? null;
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
  setItem(k: string, v: string) {
    this.m.set(k, String(v));
  }
}

const localStorage = new MemoryStorage();
const make = () => createProgressStore({ storage: localStorage, syncTabs: false, now: () => NOW });

function seedLegacy() {
  localStorage.setItem(
    "aisvs-checked-requirements",
    JSON.stringify(["v1.1.1", "v2.3.4", "v1.1.1"]),
  );
  localStorage.setItem(
    "control-m2-progress",
    JSON.stringify({ "design-phase-0": true, "design-phase-1": false, "build-phase-2": true }),
  );
  localStorage.setItem("control-m7-progress", JSON.stringify({ "tools-frameworks-0": false }));
  localStorage.setItem("control-broken-progress", "{not json");
  localStorage.setItem("ai-security-checklist", JSON.stringify(["iv-1", "auth-2"]));
  localStorage.setItem("theme", "dark");
}

beforeEach(() => localStorage.clear());

describe("migrateLegacy", () => {
  it("returns migrated=false when there is nothing to migrate", () => {
    const { migrated, data } = migrateLegacy(localStorage);
    expect(migrated).toBe(false);
    expect(isProgressEmpty(data)).toBe(true);
    expect(data.legacy).toBeUndefined();
  });

  it("archives AISVS, converts control maps (true only) and the checklist", () => {
    seedLegacy();
    const { migrated, data } = migrateLegacy(localStorage, () => NOW);
    expect(migrated).toBe(true);
    // AISVS ids changed in 1.01 → archived, not imported.
    expect(data.aisvs.size).toBe(0);
    expect(data.legacy?.aisvsDraft).toEqual(["v1.1.1", "v2.3.4"]);
    expect(data.legacy?.aisvsArchivedNotice).toBe(true);
    expect([...data.controls.m2].sort()).toEqual(["build-phase-2", "design-phase-0"]);
    expect(data.controls.m7).toBeUndefined(); // only false values
    expect(data.controls.broken).toBeUndefined(); // corrupt JSON ignored
    expect([...data.checklist]).toEqual(["iv-1", "auth-2"]);
    expect(data.legacy?.migratedAt).toBe(NOW);
    expect(data.legacy?.migratedKeys).toEqual([
      "aisvs-checked-requirements",
      "control-m2-progress",
      "ai-security-checklist",
    ]);
  });
});

describe("createProgressStore", () => {
  it("migrates once on first load and persists immediately", () => {
    seedLegacy();
    const store = make();
    expect(store.getState().controls.m2.has("design-phase-0")).toBe(true);
    const raw = JSON.parse(localStorage.getItem(PROGRESS_STORAGE_KEY) ?? "null");
    expect(raw.version).toBe(1);
    expect(raw.state.controls.m2).toContain("design-phase-0");
    expect(raw.state.legacy.aisvsArchivedNotice).toBe(true);
    // Legacy keys are kept for pages that still read them.
    expect(localStorage.getItem("ai-security-checklist")).not.toBeNull();

    // Second load must NOT re-migrate (user reset is respected).
    store.getState().resetChecklist();
    const again = make();
    expect(again.getState().checklist.size).toBe(0);
  });

  it("toggles / sets / resets every namespace and survives a reload", () => {
    const s = make();
    s.getState().toggleAisvs("C1.1.1");
    s.getState().setAisvsMany(["C1.1.2", "C1.1.3"], true);
    s.getState().toggleAisvs("C1.1.3");
    s.getState().toggleControlTask("m1", "design-phase-0");
    s.getState().setControlTask("m1", "build-phase-1", true);
    s.getState().toggleChecklist("iv-1");
    s.getState().recordQuiz("asi-basics", 8, 10);
    s.getState().setPathStep("step-1", true);

    const reloaded = make().getState();
    expect([...reloaded.aisvs].sort()).toEqual(["C1.1.1", "C1.1.2"]);
    expect(reloaded.controls.m1.size).toBe(2);
    expect(reloaded.checklist.has("iv-1")).toBe(true);
    expect(reloaded.quizzes["asi-basics"]).toEqual({ score: 8, total: 10, at: NOW });
    expect(reloaded.path["step-1"]).toBe(true);

    s.getState().resetControl("m1");
    expect(s.getState().controls.m1).toBeUndefined();
    s.getState().resetNamespace("aisvs");
    expect(s.getState().aisvs.size).toBe(0);
    s.getState().reset();
    expect(isProgressEmpty(s.getState())).toBe(true);
  });

  it("dismissAisvsNotice clears the one-time flag but keeps the archive", () => {
    seedLegacy();
    const s = make();
    s.getState().dismissAisvsNotice();
    expect(s.getState().legacy?.aisvsArchivedNotice).toBe(false);
    expect(s.getState().legacy?.aisvsDraft).toHaveLength(2);
    s.getState().reset();
    expect(s.getState().legacy?.aisvsDraft).toHaveLength(2);
  });

  it("exports and imports JSON (replace and merge)", () => {
    const a = make();
    a.getState().toggleChecklist("iv-1");
    a.getState().toggleControlTask("m3", "x");
    const json = a.getState().exportJSON();
    expect(JSON.parse(json).schema).toBe("ash-progress");

    localStorage.clear();
    const b = make();
    b.getState().toggleChecklist("auth-9");
    expect(b.getState().importJSON(json, "merge")).toEqual({ ok: true });
    expect([...b.getState().checklist].sort()).toEqual(["auth-9", "iv-1"]);
    expect(b.getState().importJSON(json)).toEqual({ ok: true });
    expect([...b.getState().checklist]).toEqual(["iv-1"]);

    expect(b.getState().importJSON("nope").ok).toBe(false);
    expect(b.getState().importJSON(JSON.stringify({ schema: "other" })).ok).toBe(false);
    expect(b.getState().importJSON(JSON.stringify({ version: 99 })).ok).toBe(false);
  });

  it("removeLegacyKeys removes only legacy keys", () => {
    seedLegacy();
    const removed = removeLegacyKeys(localStorage);
    expect(removed).toContain("control-m2-progress");
    expect(localStorage.getItem("theme")).toBe("dark");
    expect(localStorage.getItem("aisvs-checked-requirements")).toBeNull();
  });
});

describe("selectors", () => {
  it("compute percentages and counts", () => {
    const s = make();
    const st = s.getState();
    st.setAisvsMany(["a", "b", "c"], true);
    st.toggleControlTask("m1", "t1");
    st.toggleControlTask("m2", "t1");
    st.toggleControlTask("m2", "t2");
    st.toggleChecklist("x");
    st.setPathStep("p1", true);
    const state = s.getState();

    expect(aisvsPct(12)(state)).toBe(25);
    expect(aisvsPct(0)(state)).toBe(0);
    expect(aisvsLevelPct(1, { 1: ["a", "b", "z", "y"], 2: ["c"] })(state)).toBe(50);
    expect(aisvsLevelPct(2, { 1: ["a"], 2: ["c"] })(state)).toBe(100);
    expect(aisvsLevelPct(3, { 1: ["a"] })(state)).toBe(0);
    expect(controlsStarted(state)).toBe(2);
    expect(controlPct("m2", 8)(state)).toBe(25);
    expect(checklistPct(3)(state)).toBe(33.3);
    expect(pathStep("p1")(state)).toBe(true);
    expect(pathStep("p2")(state)).toBe(false);
    expect(progressSummary(state)).toMatchObject({
      aisvsChecked: 3,
      controlsStarted: 2,
      controlTasksDone: 3,
      checklistDone: 1,
      pathStepsDone: 1,
    });
  });
});

import { describe, expect, it } from "vitest";
import { createDocument, encodeShareLink, decodeShareLink } from "../document";
import {
  DOCUMENT_KEY,
  LEGACY_KEYS,
  LIBRARY_KEY,
  PREFS_KEY,
  memoryStorage,
  readLibrary,
  readPrefs,
  readStoredDocument,
  writeStoredDocument,
} from "../persistence";
import { createThreatModelStore, documentFingerprint } from "../store";
import { actor, flow, node, templateModel } from "./fixtures";

const opts = (storage = memoryStorage()) => ({
  storage,
  autosaveDelayMs: 0,
  minSweepMs: 0,
  inThread: true,
});

function newStore(storage = memoryStorage()) {
  const store = createThreatModelStore(opts(storage));
  store.getState().bootstrap("");
  return { store, s: () => store.getState(), storage };
}

const addNode = (id: string) => (doc: ReturnType<typeof createDocument>) => ({
  ...doc,
  nodes: [...doc.nodes, node(id)],
});
const ids = (nodes: { id: string }[]) => nodes.map((n) => n.id);

describe("store: commit / undo / redo", () => {
  it("records one history entry per commit and undoes / redoes it", () => {
    const { s } = newStore();
    expect(s().commit(addNode("a"), "Add a")).toBe(true);
    expect(s().commit(addNode("b"), "Add b")).toBe(true);
    expect(s().past.map((p) => p.label)).toEqual(["Add a", "Add b"]);
    s().undo();
    expect(ids(s().document.nodes)).toEqual(["a"]);
    s().redo();
    expect(ids(s().document.nodes)).toEqual(["a", "b"]);
    expect(s().future).toHaveLength(0);
  });

  it("redo after delete restores the deletion (P3-25 acceptance)", () => {
    const { s } = newStore();
    s().commit(addNode("a"), "Add a");
    s().commit((d) => ({ ...d, nodes: d.nodes.filter((n) => n.id !== "a") }), "Delete a");
    s().undo();
    expect(ids(s().document.nodes)).toEqual(["a"]);
    s().redo();
    expect(s().document.nodes).toHaveLength(0);
    s().undo();
    expect(ids(s().document.nodes)).toEqual(["a"]);
  });

  it("a new commit clears the redo stack", () => {
    const { s } = newStore();
    s().commit(addNode("a"), "Add a");
    s().undo();
    expect(s().future).toHaveLength(1);
    s().commit(addNode("b"), "Add b");
    expect(s().future).toHaveLength(0);
  });

  it("coalesces nudges within a second into one entry", () => {
    const { s } = newStore();
    s().commit(addNode("a"), "Add a");
    for (let i = 1; i <= 5; i++)
      s().commit(
        (d) => ({ ...d, nodes: d.nodes.map((n) => ({ ...n, position: { x: i * 8, y: 0 } })) }),
        "Move",
        { coalesce: "nudge" },
      );
    expect(s().past.map((p) => p.label)).toEqual(["Add a", "Move"]);
    s().undo();
    expect(s().document.nodes[0].position.x).toBe(0);
  });

  it("a drag gesture becomes one undo step", () => {
    const { s } = newStore();
    s().commit(addNode("a"), "Add a");
    s().beginGesture();
    for (let i = 1; i <= 10; i++)
      s().setGraph((ns, es) => ({
        nodes: ns.map((n) => ({ ...n, position: { x: i, y: i } })),
        edges: es,
      }));
    s().endGesture("Move");
    expect(s().past.map((p) => p.label)).toEqual(["Add a", "Move"]);
    s().undo();
    expect(s().document.nodes[0].position).toEqual({ x: 0, y: 0 });
  });

  it("undo restores the analysis that belonged to the earlier document", async () => {
    const { s } = newStore();
    s().replaceDocument(
      createDocument({ ...templateModel("simple-agent"), name: "Simple" }),
      "Load",
    );
    const first = await s().analyze();
    expect(first?.threats.length).toBeGreaterThan(0);
    const fp = documentFingerprint(s().document);
    s().replaceDocument(createDocument({ ...s().document, nodes: [], edges: [] }), "Clear canvas");
    expect(s().analysis).toBeNull();
    s().undo();
    expect(s().analysis).toBe(first);
    expect(s().analysisFingerprint).toBe(fp);
    expect(Object.keys(s().nodeThreats).length).toBeGreaterThan(0);
  });
});

describe("store: resetAnalysis", () => {
  it("clears results and the derived canvas maps", async () => {
    const { s } = newStore();
    s().replaceDocument(createDocument({ ...templateModel("rag-pipeline") }), "Load");
    await s().analyze();
    expect(s().analysis).not.toBeNull();
    s().resetAnalysis();
    expect(s().analysis).toBeNull();
    expect(s().analysisFingerprint).toBeNull();
    expect(s().nodeThreats).toEqual({});
    expect(s().edgeThreats).toEqual({});
  });

  it("statuses live in the document and survive a re-run", async () => {
    const { s } = newStore();
    s().replaceDocument(createDocument({ ...templateModel("rag-pipeline") }), "Load");
    const a = await s().analyze();
    const id = a!.threats[0].id;
    s().setThreatStatus([id], { status: "accepted", justification: "Out of scope" });
    expect(s().document.threatStatuses[id]?.status).toBe("accepted");
    const b = await s().analyze();
    expect(b!.threats.find((t) => t.id === id)?.status).toBe("accepted");
  });
});

describe("store: autosave and legacy migration", () => {
  it("writes the document under the v2 key after a commit", () => {
    const { s, storage } = newStore();
    s().commit(addNode("a"), "Add a");
    const raw = storage.getItem(DOCUMENT_KEY);
    expect(raw).toBeTruthy();
    expect(ids(readStoredDocument(storage)!.nodes)).toEqual(["a"]);
    expect(s().lastSavedAt).not.toBeNull();
  });

  it("restores the autosaved document on the next load", () => {
    const storage = memoryStorage();
    newStore(storage).s().commit(addNode("a"), "Add a");
    const { s } = newStore(storage);
    expect(ids(s().document.nodes)).toEqual(["a"]);
    expect(s().persist).toBe("autosave");
  });

  it("migrates the six v1 keys once and removes them", () => {
    const v1 = {
      nodes: [actor("u"), node("a")],
      edges: [flow("u", "a", {}, "e1")],
      methodology: "maestro",
    };
    const saved = {
      id: "saved-1",
      name: "Old saved model",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
      data: JSON.stringify(v1),
    };
    const storage = memoryStorage({
      [LEGACY_KEYS.autosave]: JSON.stringify(v1),
      [LEGACY_KEYS.statuses]: JSON.stringify([
        ["conn-prompt-injection-e1", { status: "accepted", justification: "ok" }],
      ]),
      [LEGACY_KEYS.customComponents]: JSON.stringify([
        {
          id: "cc-1",
          name: "My gateway",
          description: "",
          category: "kc5",
          icon: "box",
          maestroLayers: [3],
          trustLevel: "semi-trusted",
          nodeType: "customComponent",
        },
      ]),
      [LEGACY_KEYS.savedModels]: JSON.stringify([saved]),
      [LEGACY_KEYS.userTemplates]: JSON.stringify([{ ...saved, id: "tpl-1", name: "My template" }]),
      [LEGACY_KEYS.onboarding]: "true",
    });
    const { s } = newStore(storage);
    expect(ids(s().document.nodes)).toEqual(["u", "a"]);
    expect(s().document.threatStatuses["TM-CONN-001::e1"]?.status).toBe("accepted");
    expect(s().document.customComponents.map((c) => c.id)).toContain("cc-1");
    const lib = readLibrary(storage);
    expect(lib.models.map((m) => m.name)).toContain("Old saved model");
    expect(lib.templates.map((t) => t.name)).toContain("My template");
    expect(readPrefs(storage).onboardingSeen).toBe(true);
    for (const k of Object.values(LEGACY_KEYS)) expect(storage.getItem(k)).toBeNull();
    expect(Object.keys(storage.dump()).sort()).toEqual(
      [DOCUMENT_KEY, LIBRARY_KEY, PREFS_KEY].sort(),
    );
  });
});

describe("store: share links and templates (P3-24)", () => {
  it("round-trips a document through ?m= and opens it read-only", () => {
    const storage = memoryStorage();
    const mine = newStore(storage);
    mine.s().commit(addNode("mine"), "Add mine");
    const before = storage.getItem(DOCUMENT_KEY);

    const shared = createDocument({ ...templateModel("mcp-coding-agent"), name: "Shared model" });
    const encoded = encodeShareLink(shared)!;
    expect(encoded).toBeTruthy();
    expect(ids(decodeShareLink(encoded)!.nodes)).toEqual(ids(shared.nodes));

    const { store } = { store: createThreatModelStore(opts(storage)) };
    const r = store.getState().bootstrap(`?m=${encoded}&threat=t1`);
    expect(r).toMatchObject({ source: "shared", threatId: "t1" });
    expect(store.getState().persist).toBe("readonly");
    expect(store.getState().document.name).toBe("Shared model");
    expect(store.getState().commit(addNode("x"), "Add x")).toBe(false);
    store.getState().flushAutosave();
    expect(storage.getItem(DOCUMENT_KEY)).toBe(before);

    store.getState().makeCopy();
    expect(store.getState().persist).toBe("autosave");
    expect(store.getState().document.name).toBe("Copy of Shared model");
    expect(readStoredDocument(storage)!.name).toBe("Copy of Shared model");
    // The user's own canvas was kept in the library before being replaced.
    expect(
      readLibrary(storage).models.some((m) =>
        m.versions.some((v) => v.document.nodes.some((n) => n.id === "mine")),
      ),
    ).toBe(true);
    expect(store.getState().stashedModel?.name).toBeTruthy();
  });

  it("an invalid share link falls back to the autosave with an error", () => {
    const storage = memoryStorage();
    newStore(storage).s().commit(addNode("mine"), "Add mine");
    const store = createThreatModelStore(opts(storage));
    const r = store.getState().bootstrap("?m=not-a-model");
    expect(r.source).toBe("autosave");
    expect(r.error).toMatch(/invalid/);
    expect(ids(store.getState().document.nodes)).toEqual(["mine"]);
  });

  it("?template= loads without overwriting the autosave until the first edit", () => {
    const storage = memoryStorage();
    const mine = createDocument({ name: "My work", nodes: [node("mine")] });
    writeStoredDocument(mine, storage);

    const store = createThreatModelStore(opts(storage));
    const r = store.getState().bootstrap("?template=rag-pipeline");
    expect(r).toMatchObject({ source: "template", templateName: "RAG Pipeline" });
    expect(store.getState().persist).toBe("transient");
    expect(store.getState().document.nodes.length).toBeGreaterThan(1);
    store
      .getState()
      .setGraph((ns, es) => ({ nodes: ns.map((n) => ({ ...n, selected: true })), edges: es }));
    store.getState().flushAutosave();
    expect(readStoredDocument(storage)!.name).toBe("My work");

    // Analysis does not count as an edit either.
    store.getState().resetAnalysis();
    expect(readStoredDocument(storage)!.name).toBe("My work");

    store.getState().commit(addNode("extra"), "Add extra");
    expect(store.getState().persist).toBe("autosave");
    expect(readStoredDocument(storage)!.name).toBe("RAG Pipeline");
    expect(readLibrary(storage).models.find((m) => m.id === mine.id)?.name).toBe("My work");
  });

  it("resolves architecture ids and returns to the user's canvas on a plain URL", () => {
    const storage = memoryStorage();
    writeStoredDocument(createDocument({ name: "My work", nodes: [node("mine")] }), storage);
    const store = createThreatModelStore(opts(storage));
    expect(store.getState().bootstrap("?template=collaborative").source).toBe("template");
    expect(store.getState().bootstrap("?template=collaborative").source).toBe("kept");
    expect(store.getState().bootstrap("").source).toBe("autosave");
    expect(store.getState().document.name).toBe("My work");
    expect(store.getState().bootstrap("?template=nope").error).toMatch(/Unknown template/);
  });
});

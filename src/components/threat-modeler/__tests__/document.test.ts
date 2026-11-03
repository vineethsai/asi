import { describe, expect, it } from "vitest";
import {
  SCHEMA_VERSION,
  SHARE_LINK_MAX_BYTES,
  createDocument,
  decodeShareLink,
  documentToAnalysisInput,
  encodeShareLink,
  loadDocument,
  mapV1ThreatId,
  migrateV1,
  parseDocument,
  serializeDocument,
} from "../document";
import { analyzeThreatModel } from "../engine/analyze";
import { stableHash } from "../engine/hash";
import { actor, flow, node, templateModel } from "./fixtures";

const NOW = "2026-11-03T00:00:00.000Z";

function v1Model() {
  const nodes = [
    actor("u"),
    node("a", { appliedMitigations: ["Input validation and sanitization", "Something custom"] }),
    node("t", {
      category: "kc5",
      toolAccessMode: "execute",
      mitigationStatuses: { "MIT-HITL-APPROVAL": { status: "in-progress", owner: "sec" } },
    }),
  ];
  const edges = [flow("u", "a", {}, "e1"), flow("a", "t", {}, "e2")];
  return {
    nodes,
    edges,
    methodology: "maestro",
    customComponents: [],
    exportDate: "2026-01-01T00:00:00.000Z",
  };
}

describe("v1 → v2 migration", () => {
  it("maps v1 threat ids to rule::component ids", () => {
    const edges = v1Model().edges;
    expect(mapV1ThreatId("conn-prompt-injection-e1", edges)).toBe("TM-CONN-001::e1");
    expect(mapV1ThreatId("conn-code-exec-e2", edges)).toBe("TM-NODE-030::t");
    expect(mapV1ThreatId("topo-spof-a", edges)).toBe("TM-NODE-060::a");
    expect(mapV1ThreatId("maestro-l3-something-a", edges)).toBeUndefined();
  });

  it("migrates an autosave with statuses and mitigations", () => {
    const doc = migrateV1(v1Model(), {
      now: NOW,
      statuses: [
        ["conn-prompt-injection-e1", { status: "mitigated", justification: "filter" }],
        ["maestro-l3-old-a", { status: "accepted" }],
      ],
    });
    expect(doc.schemaVersion).toBe(SCHEMA_VERSION);
    expect(doc.createdAt).toBe("2026-01-01T00:00:00.000Z");
    expect(doc.threatStatuses["TM-CONN-001::e1"]).toEqual({
      status: "mitigated",
      justification: "filter",
    });
    expect(doc.legacy?.threatStatuses?.["maestro-l3-old-a"]).toEqual({ status: "accepted" });
    // A toggled v1 mitigation without a status entry was implemented.
    expect(doc.appliedMitigations.a["MIT-INPUT-FILTER"]).toEqual({ status: "implemented" });
    expect(doc.legacy?.mitigations?.a).toEqual(["Something custom"]);
    // in-progress stays in-progress and is NOT listed as applied.
    expect(doc.appliedMitigations.t["MIT-HITL-APPROVAL"].status).toBe("in-progress");
    expect(doc.nodes.find((n) => n.id === "t")!.data.appliedMitigations).toEqual([]);
    expect(parseDocument(doc).ok).toBe(true);
  });

  it("migrates a ModelManager SavedModel", () => {
    const saved = {
      id: "m1",
      name: "Saved",
      description: "d",
      createdAt: "2026-02-01T00:00:00.000Z",
      updatedAt: "2026-02-02T00:00:00.000Z",
      data: JSON.stringify(v1Model()),
    };
    const r = loadDocument(saved, { now: NOW });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value).toMatchObject({
      id: "m1",
      name: "Saved",
      createdAt: "2026-02-01T00:00:00.000Z",
    });
    expect(r.value.nodes).toHaveLength(3);
  });

  it("rejects unknown schema versions and invalid documents", () => {
    expect(loadDocument({ schemaVersion: 3, nodes: [] }).ok).toBe(false);
    expect(loadDocument("{not json").ok).toBe(false);
    const bad = { ...createDocument({}, NOW), nodes: "nope" };
    const r = parseDocument(bad);
    expect(r.ok).toBe(false);
  });

  it("migrated statuses apply in the engine", () => {
    const doc = migrateV1(v1Model(), {
      now: NOW,
      statuses: { "conn-prompt-injection-e1": { status: "mitigated" } },
    });
    const r = analyzeThreatModel(documentToAnalysisInput(doc));
    const t = r.threats.find((x) => x.id === "TM-CONN-001::e1");
    expect(t?.status).toBe("mitigated");
    expect(t?.residualScore).toBe(0);
  });
});

describe("serialisation and share links", () => {
  it("serialises without badge data and round-trips", () => {
    const m = templateModel("rag-pipeline");
    m.nodes[1].data.threats = [{ threatId: "x", name: "x", severity: "high", inherited: false }];
    const doc = createDocument({ name: "RAG", nodes: m.nodes, edges: m.edges }, NOW);
    const json = serializeDocument(doc);
    expect(json).not.toContain('"threatId":"x"');
    const back = loadDocument(json);
    expect(back.ok && back.value.nodes.length).toBe(m.nodes.length);
  });

  it("encodes and decodes a share link", () => {
    const m = templateModel("multi-agent");
    const doc = createDocument({ name: "Share", nodes: m.nodes, edges: m.edges }, NOW);
    const param = encodeShareLink(doc);
    expect(param).not.toBeNull();
    expect(param!.length).toBeLessThanOrEqual(SHARE_LINK_MAX_BYTES);
    const back = decodeShareLink(param);
    expect(back?.name).toBe("Share");
    expect(back?.edges).toHaveLength(m.edges.length);
  });

  it("returns null when the link would exceed 30 KB, and rejects junk", () => {
    const nodes = Array.from({ length: 400 }, (_, i) =>
      node(`n${i}`, {
        description: Array.from({ length: 12 }, (_, j) => stableHash(`${i}-${j}`)).join(" "),
      }),
    );
    expect(encodeShareLink(createDocument({ nodes }, NOW))).toBeNull();
    expect(decodeShareLink("garbage")).toBeNull();
    expect(decodeShareLink("")).toBeNull();
    expect(decodeShareLink("x".repeat(SHARE_LINK_MAX_BYTES + 1))).toBeNull();
  });
});

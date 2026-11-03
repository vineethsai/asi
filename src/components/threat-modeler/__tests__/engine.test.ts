import { afterEach, describe, expect, it, vi } from "vitest";
import { createDocument } from "../document";
import { analyzeThreatModel } from "../engine/analyze";
import { disposeAnalysisWorker, runAnalysis } from "../engine/runAnalysis";
import { runThreatAnalysis } from "../engine/threatEngine";
import { type CustomComponentDefinition, MaestroLayer } from "../types";
import { actor, boundary, flow, node, templateModel } from "./fixtures";

describe("propagation", () => {
  const chain = (secure: boolean) => ({
    nodes: [actor(), node("a"), node("b"), node("c"), node("d")],
    edges: [
      flow("user", "a"),
      flow(
        "a",
        "b",
        secure ? { authentication: "mTLS", encrypted: true } : { authentication: "None" },
      ),
      flow("b", "c"),
      flow("c", "d"),
    ],
  });

  it("inherited copies stay within 2 hops, never land on actors and are labelled", () => {
    const r = analyzeThreatModel(chain(false));
    const inherited = r.threats.filter((t) => t.inherited);
    expect(inherited.length).toBeGreaterThan(0);
    for (const t of inherited) {
      expect(t.hops).toBeLessThanOrEqual(2);
      expect(t.focusNodeId).not.toBe("user");
      expect(t.inheritedFrom).toBeDefined();
      expect(t.propagationPath?.length).toBeGreaterThan(1);
    }
  });

  it("an authenticated + encrypted flow stops propagation", () => {
    const open = analyzeThreatModel(chain(false)).threats.filter(
      (t) => t.inherited && t.focusNodeId === "b",
    );
    const secure = analyzeThreatModel(chain(true)).threats.filter(
      (t) => t.inherited && t.propagationPath?.[0] === "a" && t.focusNodeId === "b",
    );
    expect(open.length).toBeGreaterThan(0);
    expect(secure).toEqual([]);
  });
});

describe("attack paths", () => {
  it("HITL gates break paths and ids are stable", () => {
    const tool = node("tool", { category: "kc5", toolAccessMode: "execute", label: "Shell" });
    const open = analyzeThreatModel({
      nodes: [actor(), node("agent"), tool],
      edges: [flow("user", "agent"), flow("agent", "tool")],
    });
    expect(open.paths.total).toBeGreaterThan(0);
    expect(open.paths.paths[0].id).toMatch(/^path-[0-9a-f]{16}$/);
    const gated = analyzeThreatModel({
      nodes: [
        actor(),
        node("agent"),
        node("hitl", { category: "kc6", semantics: { kind: "hitl-gate", hitl: {} } }),
        tool,
      ],
      edges: [flow("user", "agent"), flow("agent", "hitl"), flow("hitl", "tool")],
    });
    expect(gated.paths.total).toBe(0);
    expect(gated.paths.brokenByGates).toBeGreaterThan(0);
  });

  it("caps the list and reports truncation", () => {
    const r = analyzeThreatModel({
      ...templateModel("research-swarm-a2a"),
      options: { pathLimit: 5 },
    });
    expect(r.paths.paths).toHaveLength(5);
    expect(r.paths.truncated).toBe(true);
    expect(r.paths.total).toBeGreaterThan(5);
  });
});

describe("severity and residual", () => {
  it("residual never drops below 10 % of the score from mitigations alone", () => {
    const m = templateModel("simple-agent");
    const r = analyzeThreatModel(m);
    const t = r.threats.find((x) => !x.inherited && (x.mitigationIds?.length ?? 0) >= 2)!;
    const node = t.focusNodeId ?? t.affectedNodeIds[0];
    const all = Object.fromEntries(
      (t.mitigationIds ?? []).map((id) => [id, { status: "implemented" as const }]),
    );
    const after = analyzeThreatModel({ ...m, mitigations: { [node]: all, "*": all } }).threats.find(
      (x) => x.id === t.id,
    )!;
    expect(after.residualScore).toBeGreaterThanOrEqual(Math.round(t.score! * 0.1 * 10) / 10 - 0.01);
    expect(after.residualScore!).toBeLessThan(t.score!);
    expect(after.mitigationState).not.toBe("none");
  });

  it("records likelihood/impact factors in why", () => {
    const r = analyzeThreatModel(templateModel("mcp-coding-agent"));
    expect(r.threats.some((t) => (t.why?.factors.length ?? 0) > 0)).toBe(true);
  });
});

describe("suppression and custom components", () => {
  it("suppressed rules move threats (and their inherited copies) to `suppressed`", () => {
    const m = templateModel("simple-agent");
    const before = analyzeThreatModel(m);
    const ruleId = before.threats.find((t) => t.inherited)!.inheritedFrom!.split("::")[0];
    const r = analyzeThreatModel({
      ...m,
      suppressedRules: [{ ruleId, reason: "accepted design" }],
    });
    expect(r.threats.some((t) => t.ruleId === ruleId)).toBe(false);
    expect(r.suppressed.length).toBeGreaterThan(0);
    expect(r.summary.suppressed).toBe(r.suppressed.length);
  });

  it("custom component threats get stable ids", () => {
    const cc: CustomComponentDefinition = {
      id: "vault",
      name: "Vault",
      description: "",
      maestroLayers: [MaestroLayer.DeploymentInfrastructure],
      category: "custom",
      trustLevel: "trusted",
      icon: "box",
      color: "#000",
      associatedThreatIds: [],
      customThreats: [
        {
          id: "leak",
          name: "Secret leak",
          description: "Secrets leak",
          severity: "high",
          maestroLayer: MaestroLayer.DeploymentInfrastructure,
          attackVectors: [],
          mitigations: ["Rotate"],
        },
      ],
      metadata: {},
    };
    const n = node("v", {
      category: "custom",
      isCustom: true,
      customThreatIds: ["leak"],
      type: "customComponent",
    });
    const r = analyzeThreatModel({
      nodes: [actor(), n],
      edges: [flow("user", "v")],
      customComponents: [cc],
    });
    const t = r.threats.find((x) => x.ruleId?.startsWith("CUSTOM-"));
    expect(t?.id).toBe("CUSTOM-leak::v");
    expect(t?.severity).toBe("high");
  });
});

describe("runAnalysis (worker entry)", () => {
  afterEach(() => {
    disposeAnalysisWorker();
    vi.unstubAllGlobals();
  });

  it("falls back to in-thread analysis when Worker is unavailable", async () => {
    vi.stubGlobal("Worker", undefined);
    const m = templateModel("rag-pipeline");
    const r = await runAnalysis(m);
    expect(r.fingerprint).toBe(analyzeThreatModel(m).fingerprint);
  });

  it("accepts a v2 document", async () => {
    const m = templateModel("rag-pipeline");
    const doc = createDocument({ nodes: m.nodes, edges: m.edges }, "2026-11-03T00:00:00.000Z");
    const r = await runAnalysis(doc, { inThread: true });
    expect(r.threats.length).toBe(analyzeThreatModel(m).threats.length);
  });

  it("falls back when the worker fails to start", async () => {
    class Broken {
      onmessage: unknown;
      onerror: (() => void) | null = null;
      postMessage() {
        queueMicrotask(() => this.onerror?.());
      }
      terminate() {}
    }
    vi.stubGlobal("Worker", Broken);
    const m = templateModel("simple-agent");
    const r = await runAnalysis(m);
    expect(r.threats.length).toBe(analyzeThreatModel(m).threats.length);
  });

  it("legacy runThreatAnalysis wraps the new engine", () => {
    const m = templateModel("simple-agent");
    expect(runThreatAnalysis(m.nodes, m.edges).threats.length).toBe(
      analyzeThreatModel(m).threats.length,
    );
  });
});

describe("boundaries", () => {
  it("an empty boundary is reported, a populated one is not", () => {
    const r = analyzeThreatModel({
      nodes: [boundary("b1"), boundary("b2"), actor(), node("a", { parentId: "b2" })],
      edges: [flow("user", "a")],
    });
    const ids = r.threats.filter((t) => t.ruleId === "TM-MODEL-006").map((t) => t.componentKey);
    expect(ids).toEqual(["b1"]);
  });
});

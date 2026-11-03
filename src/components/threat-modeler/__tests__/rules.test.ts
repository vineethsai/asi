import { describe, expect, it } from "vitest";
import { analyzeThreatModel } from "../engine/analyze";
import { RULES, getMitigation } from "../engine/catalog";
import { ARCHITECTURE_TEMPLATES, instantiateTemplate } from "../templates";
import { RULE_FIXTURES, actor, flow, node, withGuardrailAndHitl } from "./fixtures";

const ruleIds = (m: Parameters<typeof analyzeThreatModel>[0]) =>
  new Set(analyzeThreatModel(m).threats.map((t) => t.ruleId));

describe("rule catalog", () => {
  it("every rule fires on a shipped template or its fixture", () => {
    const fired = new Set<string>();
    for (const t of ARCHITECTURE_TEMPLATES)
      for (const id of ruleIds(instantiateTemplate(t))) fired.add(id!);
    for (const id of ruleIds(withGuardrailAndHitl())) fired.add(id!);
    for (const build of Object.values(RULE_FIXTURES))
      for (const id of ruleIds(build())) fired.add(id!);
    expect(RULES.filter((r) => !fired.has(r.id)).map((r) => r.id)).toEqual([]);
  });

  it.each(Object.keys(RULE_FIXTURES))("%s fires on its fixture", (id) => {
    expect(ruleIds(RULE_FIXTURES[id]())).toContain(id);
  });

  it("rule ids are unique and every mitigation id resolves", () => {
    expect(new Set(RULES.map((r) => r.id)).size).toBe(RULES.length);
    for (const r of RULES) {
      expect(r.mitigationIds.length, r.id).toBeGreaterThan(0);
      for (const m of r.mitigationIds) expect(getMitigation(m), `${r.id} → ${m}`).toBeDefined();
      expect(r.maps.aisvs?.length, r.id).toBeGreaterThan(0);
    }
  });

  it("every threat explains itself and carries a stable id", () => {
    const r = analyzeThreatModel(instantiateTemplate(ARCHITECTURE_TEMPLATES[0]));
    for (const t of r.threats) {
      expect(t.ruleId).toMatch(/^TM-|^CUSTOM-/);
      expect(t.why?.evidence.length).toBeGreaterThan(0);
      if (t.inherited) continue;
      expect(t.id).toBe(`${t.ruleId}::${t.componentKey}`);
      expect(t.score).toBe((t.likelihood ?? 0) * (t.impact ?? 0));
    }
  });
});

describe("rule negatives", () => {
  it("TM-AGT-021 is silent once signing and schema validation are on", () => {
    const m = RULE_FIXTURES["TM-AGT-021"]();
    m.nodes[2].data.semantics = {
      kind: "a2a-peer",
      a2a: { mutualAuth: true, messageSigning: true, schemaValidation: true },
    };
    expect(ruleIds(m)).not.toContain("TM-AGT-021");
  });

  it("TM-AGT-010 is silent with an allow-list and a rate limit", () => {
    const m = RULE_FIXTURES["TM-AGT-010"]();
    m.nodes[2].data.semantics = {
      kind: "scoped-tool",
      tool: { scopes: ["repo:write"], allowList: ["open_pr"], rateLimit: 10 },
    };
    expect(ruleIds(m)).not.toContain("TM-AGT-010");
  });

  it("TM-CONN-008 is silent on encrypted flows", () => {
    const m = RULE_FIXTURES["TM-CONN-008"]();
    m.edges[1].data!.encrypted = true;
    expect(ruleIds(m)).not.toContain("TM-CONN-008");
  });

  it("a HITL gate breaks the cascading agent chain", () => {
    const m = {
      nodes: [
        actor(),
        node("a1"),
        node("hitl", { category: "kc6", semantics: { kind: "hitl-gate", hitl: {} } }),
        node("a2"),
        node("a3"),
      ],
      edges: [flow("user", "a1"), flow("a1", "hitl"), flow("hitl", "a2"), flow("a2", "a3")],
    };
    expect(ruleIds(m)).not.toContain("TM-PATH-003");
  });

  it("no rule fires on an empty canvas", () => {
    expect(analyzeThreatModel({ nodes: [], edges: [] }).threats).toEqual([]);
  });
});

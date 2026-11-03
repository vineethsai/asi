import { describe, expect, it } from "vitest";
import { aiuc1Principles } from "@/components/components/aiuc1Data";
import { analyzeThreatModel } from "../engine/analyze";
import { COMPLIANCE_CHECKS } from "../engine/compliance";
import { ARCHITECTURE_TEMPLATES } from "../templates";
import { actor, flow, node, templateModel, withGuardrailAndHitl } from "./fixtures";

const VERDICTS = ["met", "partial", "gap", "not-applicable"];

describe("compliance", () => {
  it.each(ARCHITECTURE_TEMPLATES.map((t) => t.id))(
    "%s: all checks, AISVS C1–C12 and AIUC-1 are produced",
    (id) => {
      const c = analyzeThreatModel(templateModel(id)).compliance;
      expect(c.indicative).toBe(true);
      expect(c.checks.map((x) => x.id)).toEqual(COMPLIANCE_CHECKS.map((x) => x.id));
      for (const ch of c.checks) {
        expect(VERDICTS).toContain(ch.verdict);
        if (ch.verdict !== "not-applicable") expect(ch.subjects.length).toBeGreaterThan(0);
      }
      expect(c.aisvs.version).toBe("1.01");
      expect(c.aisvs.chapters.map((x) => x.code)).toEqual(
        Array.from({ length: 12 }, (_, i) => `C${i + 1}`),
      );
      const s = c.aisvs.summary;
      expect(s.met + s.partial + s.gap + s.notApplicable).toBe(12);
      expect(c.aiuc1.requirements.length).toBeGreaterThan(0);
    },
  );

  it("AISVS percent counts addressed requirements once (P3-16)", () => {
    const r = analyzeThreatModel(templateModel("support-rag-hitl")).compliance.aisvsResult;
    expect(r.percent).toBe(Math.round((r.addressedRequirements / r.totalRequirements) * 100));
    for (const cat of Object.values(r.coverageByCategory))
      expect(cat.addressed).toBeLessThanOrEqual(cat.total);
  });

  it("AIUC-1 excludes retired requirements and scores only assessable ones", () => {
    const a = analyzeThreatModel(templateModel("simple-agent")).compliance.aiuc1;
    const retired = aiuc1Principles.flatMap((p) =>
      p.requirements.filter((r) => r.status === "retired").map((r) => r.id),
    );
    expect(a.retired ?? []).toEqual(expect.arrayContaining(retired));
    for (const r of a.requirements) expect(retired).not.toContain(r.requirementId);
    for (const r of a.requirements.filter((x) => x.assessable === false))
      expect(r.status).toBe("gap");
    expect(a.overallScore).toBeGreaterThanOrEqual(0);
    expect(a.overallScore).toBeLessThanOrEqual(100);
  });

  it("an input guardrail turns CHK-01 from gap into met for the gated agent", () => {
    const before = analyzeThreatModel(templateModel("simple-agent")).compliance.checks.find(
      (c) => c.id === "CHK-01",
    )!;
    const after = analyzeThreatModel(withGuardrailAndHitl()).compliance.checks.find(
      (c) => c.id === "CHK-01",
    )!;
    const agent = "template-simple-agent-1";
    expect(before.subjects.find((s) => s.id === agent)?.status).toBe("missing");
    expect(after.subjects.find((s) => s.id === agent)?.status).toBe("ok");
  });

  it("an implemented mitigation upgrades a subject; in-progress does not", () => {
    const m = { nodes: [actor(), node("agent")], edges: [flow("user", "agent")] };
    const chk = (status?: "implemented" | "in-progress") =>
      analyzeThreatModel({
        ...m,
        ...(status ? { mitigations: { agent: { "MIT-INPUT-FILTER": { status } } } } : {}),
      }).compliance.checks.find((c) => c.id === "CHK-01")!;
    expect(chk().verdict).toBe("gap");
    expect(chk("in-progress").verdict).toBe("gap");
    expect(chk("implemented").verdict).toBe("met");
  });

  it("an empty canvas is not applicable rather than compliant", () => {
    const c = analyzeThreatModel({ nodes: [], edges: [] }).compliance;
    expect(c.checks.every((x) => x.verdict === "not-applicable" || x.verdict === "gap")).toBe(true);
    expect(c.aisvs.summary.met).toBe(0);
  });
});

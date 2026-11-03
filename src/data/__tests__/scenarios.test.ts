import { describe, expect, it } from "vitest";
import { architecturesData } from "@/components/components/architecturesData";
import { agenticTop10Data } from "@/components/components/owaspAgenticTop10Data";
import { mitigationsData, threatsData } from "@/components/components/securityData";
import { getArchitectureFlow } from "@/components/visual/architectureFlows";
import {
  SCENARIOS,
  adjacentScenarios,
  featuredScenario,
  getScenario,
  scenarioPath,
  scenariosForArchitecture,
  scenariosForAsi,
  scenariosForThreat,
} from "@/data/scenarios";
import { checkSitePath } from "./routeCheck";

describe("scenarios", () => {
  it("builds one walkthrough per ASI attack scenario and per architecture relevant threat", () => {
    const asi = agenticTop10Data.reduce((n, e) => n + e.attackScenarios.length, 0);
    const arch = Object.values(architecturesData).reduce(
      (n, a) => n + (a.relevantThreats ?? []).filter((rt) => /\bT\d+\b/.test(rt.title)).length,
      0,
    );
    expect(SCENARIOS.filter((s) => s.source === "asi")).toHaveLength(asi);
    expect(SCENARIOS.filter((s) => s.source === "architecture")).toHaveLength(arch);
    expect(new Set(SCENARIOS.map((s) => s.id)).size).toBe(SCENARIOS.length);
  });

  it("references existing architectures, threats, controls, ASI entries and diagram nodes", () => {
    for (const s of SCENARIOS) {
      expect(architecturesData[s.archId], s.id).toBeDefined();
      expect(s.threatIds.length, s.id).toBeGreaterThan(0);
      for (const id of s.threatIds) expect(threatsData[id], `${s.id} ${id}`).toBeDefined();
      expect(s.controlsThatStop.length, s.id).toBeGreaterThan(0);
      for (const id of s.controlsThatStop)
        expect(mitigationsData[id], `${s.id} ${id}`).toBeDefined();
      if (s.asiId)
        expect(
          agenticTop10Data.some((e) => e.id === s.asiId),
          s.id,
        ).toBe(true);
      expect(s.steps.length, s.id).toBeGreaterThanOrEqual(4);
      expect(s.steps.length, s.id).toBeLessThanOrEqual(6);
      expect(s.steps[0].entry, s.id).toBe(true);
      const flow = getArchitectureFlow(s.archId);
      for (const step of s.steps) {
        expect(step.title && step.narrative, s.id).toBeTruthy();
        if (step.threatId) expect(threatsData[step.threatId], s.id).toBeDefined();
        if (step.nodeId)
          expect(
            flow?.nodes.some((n) => n.id === step.nodeId),
            s.id,
          ).toBe(true);
        if (step.edgeId)
          expect(
            flow?.edges.some((e) => e.id === step.edgeId),
            s.id,
          ).toBe(true);
      }
      expect(checkSitePath(scenarioPath(s.id))).toBeNull();
      expect(getScenario(s.id)).toBe(s);
    }
  });

  it("controls that stop a scenario are mapped to at least one of its threats", () => {
    for (const s of SCENARIOS) {
      for (const cid of s.controlsThatStop) {
        const m = mitigationsData[cid];
        const covers = s.threatIds.some(
          (tid) => m.threatIds.includes(tid) || threatsData[tid].mitigationIds?.includes(cid),
        );
        expect(covers, `${s.id} ${cid}`).toBe(true);
      }
    }
  });

  it("exposes lookups for ASI entries, architectures and threats", () => {
    for (const e of agenticTop10Data) {
      const list = scenariosForAsi(e.id);
      expect(list.length, e.id).toBeGreaterThan(0);
      expect(list.every((s) => s.asiId === e.id)).toBe(true);
    }
    for (const a of Object.values(architecturesData)) {
      const list = scenariosForArchitecture(a.id);
      expect(list.length, a.id).toBeGreaterThan(0);
      expect(list[0].source).toBe("architecture");
    }
    const t6 = scenariosForThreat("t6");
    expect(t6.length).toBeGreaterThan(0);
    expect(t6.every((s) => s.threatIds.includes("t6"))).toBe(true);
    expect(getScenario("nope")).toBeUndefined();
  });

  it("picks a stable featured scenario per day and wraps neighbours", () => {
    const d = new Date(2026, 10, 3);
    expect(featuredScenario(d)).toBe(featuredScenario(new Date(2026, 10, 3, 23, 59)));
    const first = SCENARIOS[0];
    const adj = adjacentScenarios(first.id);
    expect(adj?.prev).toBe(SCENARIOS[SCENARIOS.length - 1]);
    expect(adj?.next).toBe(SCENARIOS[1]);
  });
});

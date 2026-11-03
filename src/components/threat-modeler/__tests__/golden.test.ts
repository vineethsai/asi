/**
 * Golden numbers for the shipped templates (IMPROVEMENT_PLAN §7.9). A rule
 * or severity change that moves these must update the table on purpose.
 *
 * Old engine (commit 87406d3): rag-pipeline 60 threats (36 inherited),
 * multi-agent 106, simple-agent 55, sequential-pipeline 61,
 * collaborative-swarm 123, reactive-agent 72, knowledge-intensive 91;
 * model scores 65–69.
 */
import { describe, expect, it } from "vitest";
import { analyzeThreatModel, rescoreAnalysis } from "../engine/analyze";
import { ARCHITECTURE_TEMPLATES, instantiateTemplate } from "../templates";
import { templateModel, withGuardrailAndHitl } from "./fixtures";

const GOLDEN: Record<
  string,
  {
    threats: number;
    inherited: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    score: number;
    paths: number;
  }
> = {
  "rag-pipeline": {
    threats: 9,
    inherited: 1,
    critical: 1,
    high: 3,
    medium: 2,
    low: 3,
    score: 68,
    paths: 2,
  },
  "multi-agent": {
    threats: 15,
    inherited: 4,
    critical: 0,
    high: 3,
    medium: 10,
    low: 2,
    score: 59,
    paths: 2,
  },
  "simple-agent": {
    threats: 12,
    inherited: 3,
    critical: 2,
    high: 4,
    medium: 6,
    low: 0,
    score: 59,
    paths: 1,
  },
  "sequential-pipeline": {
    threats: 8,
    inherited: 1,
    critical: 0,
    high: 0,
    medium: 5,
    low: 3,
    score: 28,
    paths: 0,
  },
  "collaborative-swarm": {
    threats: 15,
    inherited: 3,
    critical: 3,
    high: 9,
    medium: 3,
    low: 0,
    score: 65,
    paths: 5,
  },
  "reactive-agent": {
    threats: 11,
    inherited: 3,
    critical: 0,
    high: 1,
    medium: 8,
    low: 2,
    score: 37,
    paths: 0,
  },
  "knowledge-intensive": {
    threats: 15,
    inherited: 4,
    critical: 0,
    high: 5,
    medium: 8,
    low: 2,
    score: 52,
    paths: 4,
  },
  "mcp-coding-agent": {
    threats: 21,
    inherited: 1,
    critical: 1,
    high: 4,
    medium: 13,
    low: 3,
    score: 56,
    paths: 2,
  },
  "support-rag-hitl": {
    threats: 9,
    inherited: 0,
    critical: 0,
    high: 0,
    medium: 2,
    low: 7,
    score: 35,
    paths: 4,
  },
  "research-swarm-a2a": {
    threats: 19,
    inherited: 1,
    critical: 2,
    high: 4,
    medium: 11,
    low: 2,
    score: 47,
    paths: 23,
  },
};

const ORIGINAL_SEVEN = [
  "rag-pipeline",
  "multi-agent",
  "simple-agent",
  "sequential-pipeline",
  "collaborative-swarm",
  "reactive-agent",
  "knowledge-intensive",
];

const run = (id: string) => analyzeThreatModel(templateModel(id));

describe("golden template numbers", () => {
  it("covers every shipped template", () => {
    expect(Object.keys(GOLDEN).sort()).toEqual(ARCHITECTURE_TEMPLATES.map((t) => t.id).sort());
  });

  it.each(Object.keys(GOLDEN))("%s", (id) => {
    const r = run(id);
    const s = r.summary;
    expect({
      threats: s.total,
      inherited: s.inherited,
      critical: s.critical,
      high: s.high,
      medium: s.medium,
      low: s.low,
      score: r.modelScore.overall,
      paths: r.paths.total,
    }).toEqual(GOLDEN[id]);
  });
});

describe("§7.9 acceptance targets", () => {
  it("rag-pipeline: ≤ 20 threats, ≤ 25 % inherited", () => {
    const r = run("rag-pipeline");
    expect(r.summary.total).toBeLessThanOrEqual(20);
    expect(r.summary.inherited / r.summary.total).toBeLessThanOrEqual(0.25);
  });

  it("collaborative-swarm: ≤ 40 threats", () => {
    expect(run("collaborative-swarm").summary.total).toBeLessThanOrEqual(40);
  });

  it("model score spread across the original 7 templates ≥ 25 points", () => {
    const scores = ORIGINAL_SEVEN.map((id) => run(id).modelScore.overall);
    expect(Math.max(...scores) - Math.min(...scores)).toBeGreaterThanOrEqual(25);
  });

  it("guardrail + HITL gate lowers simple-agent by ≥ 15 points", () => {
    const before = run("simple-agent").modelScore.overall;
    const after = analyzeThreatModel(withGuardrailAndHitl()).modelScore.overall;
    expect(before - after).toBeGreaterThanOrEqual(15);
  });

  it("is deterministic across runs (ids, order, scores, fingerprint)", () => {
    for (const t of ARCHITECTURE_TEMPLATES) {
      const a = analyzeThreatModel(instantiateTemplate(t));
      const b = analyzeThreatModel(instantiateTemplate(t));
      expect(b.fingerprint).toBe(a.fingerprint);
      expect(JSON.stringify(b)).toBe(JSON.stringify(a));
    }
  });

  it("is independent of node/edge array order", () => {
    for (const t of ARCHITECTURE_TEMPLATES) {
      const m = instantiateTemplate(t);
      const a = analyzeThreatModel(m);
      const b = analyzeThreatModel({
        nodes: [...m.nodes].reverse(),
        edges: [...m.edges].reverse(),
      });
      expect(
        b.threats.map((x) => [x.id, x.score, x.residualScore]),
        t.id,
      ).toEqual(a.threats.map((x) => [x.id, x.score, x.residualScore]));
      expect(
        b.paths.paths.map((p) => p.id),
        t.id,
      ).toEqual(a.paths.paths.map((p) => p.id));
      expect(b.modelScore.overall, t.id).toBe(a.modelScore.overall);
    }
  });
});

describe("statuses and mitigations move the score", () => {
  it("marking the worst threat mitigated lowers residual and the model score", () => {
    const m = templateModel("simple-agent");
    const r = analyzeThreatModel(m);
    const worst = r.threats[0];
    const after = rescoreAnalysis(r, {
      ...m,
      threatStatuses: { [worst.id]: { status: "mitigated" } },
    });
    expect(after.threats.find((t) => t.id === worst.id)!.residualScore).toBe(0);
    expect(after.modelScore.overall).toBeLessThan(r.modelScore.overall);
    expect(after.summary.open).toBe(r.summary.open - 1);
  });

  it("only implemented mitigations count", () => {
    const m = templateModel("simple-agent");
    const r = analyzeThreatModel(m);
    const target = r.threats.find((t) => !t.inherited && (t.mitigationIds?.length ?? 0) > 0)!;
    const mit = target.mitigationIds![0];
    const node = target.focusNodeId ?? target.affectedNodeIds[0];
    const withStatus = (status: "in-progress" | "accepted-risk" | "implemented") =>
      analyzeThreatModel({ ...m, mitigations: { [node]: { [mit]: { status } } } }).threats.find(
        (t) => t.id === target.id,
      )!;
    expect(withStatus("in-progress").residualScore).toBe(target.residualScore);
    expect(withStatus("accepted-risk").residualScore).toBe(target.residualScore);
    expect(withStatus("implemented").residualScore!).toBeLessThan(target.residualScore!);
  });

  it("rescoreAnalysis matches a full re-run", () => {
    const m = templateModel("knowledge-intensive");
    const r = analyzeThreatModel(m);
    const statuses = { [r.threats[1].id]: { status: "accepted" as const, justification: "test" } };
    const re = rescoreAnalysis(r, { ...m, threatStatuses: statuses });
    const full = analyzeThreatModel({ ...m, threatStatuses: statuses });
    expect(re.modelScore).toEqual(full.modelScore);
    expect(re.threats.map((t) => [t.id, t.residualScore, t.status])).toEqual(
      full.threats.map((t) => [t.id, t.residualScore, t.status]),
    );
  });

  it("reports what changed since the previous run", () => {
    const first = analyzeThreatModel(templateModel("simple-agent"));
    const second = analyzeThreatModel({
      ...withGuardrailAndHitl(),
      previous: {
        threats: first.threats.map((t) => ({
          id: t.id,
          severity: t.severity,
          residualScore: t.residualScore,
        })),
        modelScore: first.modelScore.overall,
      },
    });
    expect(second.changeSummary).toBeDefined();
    expect(second.changeSummary!.scoreDelta).toBe(
      second.modelScore.overall - first.modelScore.overall,
    );
    expect(second.changeSummary!.resolved.length).toBeGreaterThan(0);
  });
});

import { describe, expect, it } from "vitest";
import { z } from "zod";
import { analyzeThreatModel } from "../engine/analyze";
import { SARIF_SCHEMA, buildSarif, threatFingerprint } from "../export/exportSARIF";
import { ARCHITECTURE_TEMPLATES } from "../templates";
import { templateModel } from "./fixtures";

const Message = z.object({ text: z.string().min(1), markdown: z.string().optional() });
const Level = z.enum(["none", "note", "warning", "error"]);
const SecuritySeverity = z.string().regex(/^\d+(\.\d+)?$/);

/** The SARIF 2.1.0 subset we emit, strict (unknown keys rejected). */
const SarifSchema = z.strictObject({
  $schema: z.literal(SARIF_SCHEMA),
  version: z.literal("2.1.0"),
  runs: z
    .array(
      z.strictObject({
        tool: z.strictObject({
          driver: z.strictObject({
            name: z.string().min(1),
            version: z.string(),
            semanticVersion: z.string().regex(/^\d+\.\d+\.\d+/),
            informationUri: z.url(),
            rules: z.array(
              z.strictObject({
                id: z.string().regex(/^(TM|CUSTOM)-/),
                name: z.string().regex(/^[A-Z][A-Za-z0-9]*$/),
                shortDescription: Message,
                fullDescription: Message,
                helpUri: z.url(),
                help: Message,
                defaultConfiguration: z.strictObject({ level: Level }),
                properties: z.looseObject({
                  tags: z.array(z.string()),
                  precision: z.enum(["very-high", "high", "medium", "low"]),
                  "security-severity": SecuritySeverity,
                }),
              }),
            ),
          }),
        }),
        automationDetails: z.strictObject({ id: z.string().endsWith("/") }),
        results: z.array(
          z.strictObject({
            ruleId: z.string(),
            ruleIndex: z.number().int().nonnegative(),
            level: Level,
            message: Message,
            locations: z
              .array(
                z.strictObject({
                  physicalLocation: z
                    .strictObject({
                      artifactLocation: z.strictObject({ uri: z.string(), uriBaseId: z.string() }),
                    })
                    .optional(),
                  logicalLocations: z
                    .array(
                      z.strictObject({
                        name: z.string(),
                        fullyQualifiedName: z.string(),
                        kind: z.literal("component"),
                      }),
                    )
                    .min(1),
                }),
              )
              .min(1),
            partialFingerprints: z.record(z.string(), z.string().min(8)),
            baselineState: z.enum(["new", "unchanged", "updated", "absent"]).optional(),
            suppressions: z
              .array(
                z.strictObject({
                  kind: z.enum(["inSource", "external"]),
                  status: z.enum(["accepted", "underReview", "rejected"]).optional(),
                  justification: z.string().optional(),
                }),
              )
              .optional(),
            properties: z.looseObject({ threatId: z.string(), severity: z.string() }),
          }),
        ),
        properties: z.looseObject({}).optional(),
      }),
    )
    .length(1),
});

describe("SARIF 2.1.0 export", () => {
  it.each(ARCHITECTURE_TEMPLATES.map((t) => t.id))("%s validates", (id) => {
    const m = templateModel(id);
    const sarif = JSON.parse(
      JSON.stringify(buildSarif(analyzeThreatModel(m), { name: id, nodes: m.nodes })),
    );
    const parsed = SarifSchema.safeParse(sarif);
    expect(parsed.success ? "ok" : JSON.stringify(parsed.error.issues.slice(0, 3))).toBe("ok");
    const run = sarif.runs[0];
    for (const r of run.results) expect(run.tool.driver.rules[r.ruleIndex].id).toBe(r.ruleId);
    expect(new Set(run.tool.driver.rules.map((r: { id: string }) => r.id)).size).toBe(
      run.tool.driver.rules.length,
    );
  });

  it("fingerprints are unique and stable across runs and canvas order", () => {
    const m = templateModel("research-swarm-a2a");
    const fp = (s: ReturnType<typeof buildSarif>) =>
      s.runs[0].results.map((r) => r.partialFingerprints["threatId/v1"]);
    const a = fp(buildSarif(analyzeThreatModel(m), m));
    const b = fp(
      buildSarif(
        analyzeThreatModel({ nodes: [...m.nodes].reverse(), edges: [...m.edges].reverse() }),
        m,
      ),
    );
    expect(new Set(a).size).toBe(a.length);
    expect(b).toEqual(a);
    expect(JSON.stringify(buildSarif(analyzeThreatModel(m), m))).toBe(
      JSON.stringify(buildSarif(analyzeThreatModel(m), m)),
    );
  });

  it("fingerprints depend only on rule id + component key", () => {
    expect(threatFingerprint({ id: "x", ruleId: "TM-CONN-001", componentKey: "e1" })).toBe(
      threatFingerprint({ id: "y", ruleId: "TM-CONN-001", componentKey: "e1" }),
    );
    expect(threatFingerprint({ id: "x", ruleId: "TM-CONN-001", componentKey: "e1" })).not.toBe(
      threatFingerprint({ id: "x", ruleId: "TM-CONN-001", componentKey: "e2" }),
    );
  });

  it("closed threats are suppressed, baselineState tracks the previous run", () => {
    const m = templateModel("simple-agent");
    const first = analyzeThreatModel(m);
    const [a, b] = first.threats;
    const r = analyzeThreatModel({
      ...m,
      threatStatuses: {
        [a.id]: { status: "accepted", justification: "Owner accepted" },
        [b.id]: { status: "mitigated" },
      },
    });
    const sarif = buildSarif(r, m, { previousThreatIds: first.threats.slice(1).map((t) => t.id) });
    const byId = new Map(sarif.runs[0].results.map((x) => [x.properties.threatId, x]));
    expect(byId.get(a.id)!.suppressions?.[0]).toMatchObject({
      kind: "external",
      status: "accepted",
      justification: "Owner accepted",
    });
    expect(byId.get(b.id)!.suppressions).toHaveLength(1);
    expect(byId.get(a.id)!.baselineState).toBe("new");
    expect(byId.get(b.id)!.baselineState).toBe("unchanged");
  });

  it("uses component labels, never raw ids, in logical locations", () => {
    const m = templateModel("multi-agent");
    const sarif = buildSarif(analyzeThreatModel(m), { name: "x", nodes: m.nodes });
    for (const r of sarif.runs[0].results)
      for (const l of r.locations[0].logicalLocations) expect(l.name).not.toMatch(/^template-/);
  });
});

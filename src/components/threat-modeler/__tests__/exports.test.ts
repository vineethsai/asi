import { describe, expect, it } from "vitest";
import { analyzeThreatModel } from "../engine/analyze";
import { CSV_BOM, buildThreatsCsv, buildWorkItemsCsv, csvCell } from "../export/exportCSV";
import { renderMarkdown } from "../export/exportMarkdown";
import { buildOtm } from "../export/exportOTM";
import { buildPdf } from "../export/exportPDF";
import { buildReportModel, componentLabels } from "../export/reportModel";
import { buildThreatDragon } from "../export/exportThreatDragon";
import { parseAibomReport } from "../parsers/aibomParser";
import { parseCycloneDx } from "../parsers/cyclonedx";
import { mapToCanvas } from "../parsers/frameworkMapper";
import { detectImportFormat, parseBom } from "../parsers";
import { parseThreatDragon } from "../parsers/threatDragon";
import { templateModel } from "./fixtures";

const NOW = "2026-11-03T00:00:00.000Z";

/** Minimal RFC 4180 reader for assertions. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell || row.length) rows.push([...row, cell]);
  return rows;
}
const model = (id = "mcp-coding-agent") => {
  const m = templateModel(id);
  return { doc: { name: "Test model", ...m }, analysis: analyzeThreatModel(m) };
};

describe("CSV", () => {
  it("starts with a BOM, uses labels and neutralises formulas", () => {
    const { doc, analysis } = model();
    const csv = buildThreatsCsv(analysis.threats, doc.nodes);
    expect(csv.startsWith(CSV_BOM)).toBe(true);
    const rows = parseCsv(csv.slice(1));
    expect(rows).toHaveLength(analysis.threats.length + 1);
    const col = rows[0].indexOf("Components");
    expect(col).toBeGreaterThan(0);
    for (const r of rows.slice(1)) expect(r[col]).not.toMatch(/template-mcp-coding-agent-\d/);
    expect(csvCell("=HYPERLINK(1)")).toBe(`"'=HYPERLINK(1)"`);
    expect(csvCell('a "b", c')).toBe('"a ""b"", c"');
  });

  it("exports one work item per mitigation × component", () => {
    const { doc, analysis } = model();
    const csv = buildWorkItemsCsv(doc, analysis);
    expect(csv.split(/\r?\n/)[0]).toContain("Mitigation");
    expect(csv.trim().split(/\r?\n/).length).toBeGreaterThan(1);
  });

  it("duplicate labels get a suffix", () => {
    const { doc } = model("collaborative-swarm");
    const labels = Object.values(componentLabels(doc.nodes));
    expect(new Set(labels).size).toBe(labels.length);
  });
});

describe("report model, Markdown and PDF", () => {
  it("builds every section and renders Markdown without raw ids or undefined", () => {
    const { doc, analysis } = model();
    const rm = buildReportModel(doc, analysis, { generatedAt: NOW });
    const ids = rm.sections.map((s) => s.id);
    for (const id of ["summary", "architecture", "threats", "paths", "compliance", "mitigations"])
      expect(ids).toContain(id);
    const md = renderMarkdown(rm);
    expect(md).toContain("## Contents");
    expect(md).not.toMatch(/\bundefined\b|\bNaN\b|\[object Object\]/);
    expect(md).not.toMatch(/template-mcp-coding-agent-\d/);
    expect(md).toContain("indicative");
  });

  it("builds a PDF with a TOC and page footers", async () => {
    const { doc, analysis } = model("rag-pipeline");
    const pdf = await buildPdf(buildReportModel(doc, analysis, { generatedAt: NOW }));
    expect(pdf.getNumberOfPages()).toBeGreaterThan(2);
    const out = pdf.output();
    expect(out.startsWith("%PDF-")).toBe(true);
    expect(out).toContain(`Page 1 of ${pdf.getNumberOfPages()}`);
  });
});

describe("Threat Dragon v2", () => {
  it("round-trips nodes, flows, boundaries and threats", () => {
    const { doc, analysis } = model("support-rag-hitl");
    const td = JSON.parse(JSON.stringify(buildThreatDragon(doc, analysis)));
    expect(td.version).toMatch(/^2\./);
    const back = parseThreatDragon(td);
    expect(back.warnings).toEqual([]);
    expect(back.nodes).toHaveLength(doc.nodes.length);
    expect(back.edges).toHaveLength(doc.edges.length);
    expect(back.nodes.filter((n) => n.type === "trustBoundary")).toHaveLength(
      doc.nodes.filter((n) => n.type === "trustBoundary").length,
    );
    // Children land back inside a boundary.
    expect(back.nodes.filter((n) => n.parentId).length).toBe(
      doc.nodes.filter((n) => n.parentId).length,
    );
    expect(back.notes.length).toBe(analysis.threats.filter((t) => !t.inherited).length);
    expect(back.edges.every((e) => e.data?.customMetadata?.postureUnverified === "true")).toBe(
      true,
    );
    // Imported model analyses without error.
    expect(analyzeThreatModel(back).threats.length).toBeGreaterThan(0);
  });

  it("rejects non-Threat-Dragon JSON with a warning", () => {
    const r = parseThreatDragon({ foo: 1 });
    expect(r.nodes).toEqual([]);
    expect(r.warnings[0]).toMatch(/Threat Dragon/);
    expect(detectImportFormat({ detail: { diagrams: [] } })).toBe("threat-dragon");
  });
});

describe("Open Threat Model", () => {
  it("references only defined zones, components, threats and mitigations", () => {
    const { doc, analysis } = model("research-swarm-a2a");
    const otm = buildOtm(doc, analysis);
    expect(otm.otmVersion).toBe("0.2.0");
    const zones = new Set(otm.trustZones.map((z) => z.id));
    const comps = new Set(otm.components.map((c) => c.id));
    const threats = new Set(otm.threats.map((t) => t.id));
    const mits = new Set(otm.mitigations.map((m) => m.id));
    for (const c of otm.components) expect(zones.has(c.parent.trustZone)).toBe(true);
    for (const f of otm.dataflows)
      expect(comps.has(f.source) && comps.has(f.destination)).toBe(true);
    for (const inst of [...otm.components, ...otm.dataflows].flatMap((x) => x.threats)) {
      expect(threats.has(inst.threat)).toBe(true);
      for (const m of inst.mitigations) expect(mits.has(m.mitigation)).toBe(true);
    }
    for (const z of otm.trustZones) expect(z.risk.trustRating).toBeGreaterThanOrEqual(0);
  });
});

describe("BOM imports", () => {
  const bom = {
    bomFormat: "CycloneDX",
    specVersion: "1.6",
    components: [
      { "bom-ref": "app", type: "application", name: "support-agent" },
      {
        "bom-ref": "m1",
        type: "machine-learning-model",
        name: "llama",
        hashes: [{ alg: "SHA-256", content: "abc123def4567890" }],
        modelCard: {},
      },
      { "bom-ref": "m2", type: "machine-learning-model", name: "llama" },
      { "bom-ref": "emb", type: "machine-learning-model", name: "text-embedding" },
      { "bom-ref": "kb", type: "data", name: "kb-vectors" },
    ],
    services: [{ "bom-ref": "mcp", name: "github mcp", authenticated: true }],
    dependencies: [
      { ref: "app", dependsOn: ["m1", "m2", "kb", "mcp", "missing"] },
      { ref: "kb", dependsOn: ["emb"] },
    ],
  };

  it("parses CycloneDX 1.6 ML-BOM by bom-ref", () => {
    const r = parseCycloneDx(bom);
    expect(r.components.map((c) => c.type)).toEqual([
      "agent",
      "model",
      "model",
      "embedding",
      "datastore",
      "mcp",
    ]);
    expect(r.components.filter((c) => c.name.startsWith("llama")).map((c) => c.name)).toEqual([
      "llama",
      "llama (2)",
    ]);
    expect(r.components[1].metadata.hashes).toContain("SHA-256");
    expect(r.connections).toHaveLength(5);
    expect(r.connections.find((c) => c.targetKey === "m2")?.target).toBe("llama (2)");
    expect(r.warnings.some((w) => w.includes("missing"))).toBe(true);
    expect(detectImportFormat(bom)).toBe("cyclonedx");
    expect(parseBom(bom).components).toHaveLength(6);
  });

  it("cisco-aibom: duplicate names resolve by instance id (P3-19)", () => {
    const report = {
      aibom_analysis: {
        sources: {
          repo: {
            components: {
              model: [
                { name: "langchain.llms.OpenAI", instance_id: "llm-a" },
                { name: "langchain.llms.OpenAI", instance_id: "llm-b" },
              ],
              agent: [{ name: "AgentExecutor", instance_id: "agent" }],
            },
            relationships: [
              {
                source_instance_id: "agent",
                target_instance_id: "llm-b",
                source_name: "AgentExecutor",
                target_name: "OpenAI",
                label: "USES_LLM",
              },
            ],
          },
        },
      },
    };
    const r = parseAibomReport(report);
    expect(r.components.map((c) => c.name)).toEqual(["OpenAI", "OpenAI (2)", "AgentExecutor"]);
    expect(r.connections[0]).toMatchObject({ target: "OpenAI (2)", targetKey: "repo::llm-b" });
    const { nodes, edges } = mapToCanvas(r);
    const target = nodes.find(
      (n) => n.id === edges.find((e) => e.data?.label !== "User Request")!.target,
    )!;
    expect(target.data.label).toBe("OpenAI (2)");
    expect(edges.every((e) => e.data?.customMetadata?.postureUnverified === "true")).toBe(true);
  });
});

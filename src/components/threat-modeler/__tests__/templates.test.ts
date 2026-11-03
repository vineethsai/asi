import { describe, expect, it } from "vitest";
import { architecturesData } from "@/components/components/architecturesData";
import { absolutePosition, nodeSize } from "../export/geometry";
import {
  ARCHITECTURE_TEMPLATES,
  ARCHITECTURE_TEMPLATE_MAP,
  TEMPLATE_GRID,
  instantiateTemplate,
  resolveTemplateId,
} from "../templates";
import type { CanvasNode } from "../types";

type Box = { id: string; x: number; y: number; w: number; h: number };
const overlaps = (a: Box, b: Box) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

function boxes(nodes: CanvasNode[]) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  return nodes.map((n) => {
    const p = absolutePosition(n, byId);
    const s =
      n.type === "trustBoundary"
        ? nodeSize(n)
        : { width: TEMPLATE_GRID.nodeWidth, height: TEMPLATE_GRID.nodeHeight };
    return { id: n.id, x: p.x, y: p.y, w: s.width, h: s.height, node: n };
  });
}

describe.each(ARCHITECTURE_TEMPLATES.map((t) => [t.id, t] as const))("template %s", (_id, t) => {
  const { nodes, edges } = instantiateTemplate(t);
  const all = boxes(nodes);
  const cards = all.filter((b) => b.node.type !== "trustBoundary");

  it("no two cards overlap on the 260 × 180 grid", () => {
    for (let i = 0; i < cards.length; i++)
      for (let j = i + 1; j < cards.length; j++)
        expect(
          overlaps(cards[i], cards[j]),
          `${cards[i].node.data.label} × ${cards[j].node.data.label}`,
        ).toBe(false);
  });

  it("children sit inside their boundary; parents precede children", () => {
    const index = new Map(nodes.map((n, i) => [n.id, i]));
    for (const b of all) {
      const parentId = b.node.parentId;
      if (!parentId) continue;
      expect(index.get(parentId)!).toBeLessThan(index.get(b.id)!);
      const p = all.find((x) => x.id === parentId)!;
      expect(
        b.x >= p.x && b.y >= p.y && b.x + b.w <= p.x + p.w && b.y + b.h <= p.y + p.h,
        b.node.data.label,
      ).toBe(true);
    }
  });

  it("cards outside a boundary do not overlap it", () => {
    const bounds = all.filter((b) => b.node.type === "trustBoundary");
    for (const c of cards.filter((c) => !c.node.parentId))
      for (const b of bounds)
        expect(overlaps(c, b), `${c.node.data.label} × ${b.node.data.label}`).toBe(false);
  });

  it("flows reference existing nodes, ids are unique", () => {
    const ids = new Set(nodes.map((n) => n.id));
    expect(ids.size).toBe(nodes.length);
    expect(new Set(edges.map((e) => e.id)).size).toBe(edges.length);
    for (const e of edges) {
      expect(ids.has(e.source) && ids.has(e.target)).toBe(true);
      expect(e.source).not.toBe(e.target);
    }
  });
});

describe("template catalog", () => {
  it("has the three agentic templates", () => {
    const ids = ARCHITECTURE_TEMPLATES.map((t) => t.id);
    for (const id of ["mcp-coding-agent", "support-rag-hitl", "research-swarm-a2a"])
      expect(ids).toContain(id);
  });

  it("maps every architecture page to an existing template", () => {
    for (const arch of Object.keys(architecturesData)) {
      const id = ARCHITECTURE_TEMPLATE_MAP[arch];
      expect(id, arch).toBeDefined();
      expect(resolveTemplateId(arch)).toBe(id);
      expect(ARCHITECTURE_TEMPLATES.some((t) => t.id === id)).toBe(true);
    }
  });

  it("resolves template ids and rejects unknown ids", () => {
    expect(resolveTemplateId("rag-pipeline")).toBe("rag-pipeline");
    expect(resolveTemplateId("nope")).toBeUndefined();
    expect(resolveTemplateId(undefined)).toBeUndefined();
  });
});

import { beforeAll, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AttackPathPlayer } from "@/components/visual/AttackPathPlayer";
import { buildAttackPath, highlightForStep } from "@/components/visual/attackPath";
import { ARCHITECTURE_FLOWS } from "@/components/visual/architectureFlows";
import { architecturesData } from "@/components/components/architecturesData";

beforeAll(() => {
  class RO {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  class IO {
    constructor(private cb: IntersectionObserverCallback) {}
    observe(el: Element) {
      this.cb(
        [{ isIntersecting: true, target: el } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver,
      );
    }
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  vi.stubGlobal("ResizeObserver", RO);
  vi.stubGlobal("IntersectionObserver", IO);
  if (!("DOMMatrixReadOnly" in window)) {
    vi.stubGlobal(
      "DOMMatrixReadOnly",
      class {
        m22 = 1;
        constructor() {}
      },
    );
  }
  if (!window.matchMedia) {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }));
  }
});

describe("buildAttackPath", () => {
  it("finds a path for every documented scenario of every architecture", () => {
    for (const arch of Object.values(architecturesData)) {
      const flow = ARCHITECTURE_FLOWS[arch.id];
      expect(flow, `flow for ${arch.id}`).toBeDefined();
      const nodeIds = new Set(flow.nodes.map((n) => n.id));
      const edgeIds = new Set(flow.edges.map((e) => e.id));
      for (const scenario of arch.relevantThreats ?? []) {
        const path = buildAttackPath(arch.id, scenario);
        expect(path.steps.length, `${arch.id}: ${scenario.title}`).toBeGreaterThan(1);
        expect(path.steps.some((s) => s.affected)).toBe(true);
        path.steps.forEach((s) => {
          expect(nodeIds.has(s.nodeId)).toBe(true);
          if (s.edgeId) expect(edgeIds.has(s.edgeId)).toBe(true);
          expect(s.caption.length).toBeGreaterThan(0);
        });
      }
    }
  });

  it("accumulates visited nodes up to the current step", () => {
    const arch = Object.values(architecturesData)[0];
    const scenario = arch.relevantThreats![0];
    const { steps } = buildAttackPath(arch.id, scenario);
    const last = highlightForStep(steps, steps.length - 1, { runKey: 0, hopMs: 0, still: true });
    expect(last?.activeNodeId).toBe(steps[steps.length - 1].nodeId);
    expect(last?.visitedNodeIds.length).toBeGreaterThanOrEqual(
      new Set(steps.map((s) => s.nodeId)).size - 1,
    );
    expect(highlightForStep(steps, -1, { runKey: 0, hopMs: 0, still: false })).toBeUndefined();
  });
});

describe("AttackPathPlayer", () => {
  const steps = [
    { nodeId: "0", caption: "Attacker input arrives from the user." },
    { nodeId: "1", edgeId: "e01", caption: "The payload reaches the guard." },
    {
      nodeId: "2",
      edgeId: "e12",
      caption: "The core is hit.",
      affected: true,
      severity: "high" as const,
    },
  ];
  const arch = Object.keys(architecturesData)[0];

  it("renders controls, a caption and an accessible step list", () => {
    render(
      <MemoryRouter>
        <AttackPathPlayer architectureId={arch} steps={steps} title="Demo attack" />
      </MemoryRouter>,
    );
    expect(screen.getByRole("button", { name: /^play demo attack/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next step/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /previous step/i })).toBeInTheDocument();
    // sr-only ordered list of all captions
    const list = screen.getAllByRole("list").find((l) => l.tagName === "OL");
    expect(list).toBeDefined();
    expect(within(list!).getAllByRole("listitem")).toHaveLength(steps.length);
  });

  it("steps forward and back, updating the live caption", () => {
    render(
      <MemoryRouter>
        <AttackPathPlayer architectureId={arch} steps={steps} title="Demo attack" />
      </MemoryRouter>,
    );
    const next = screen.getByRole("button", { name: /next step/i });
    fireEvent.click(next);
    const live = document.querySelector("[aria-live='polite']");
    expect(live?.textContent).toContain(steps[0].caption);
    fireEvent.click(next);
    expect(live?.textContent).toContain(steps[1].caption);
    expect(screen.getByText(/step 2 of 3/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /previous step/i }));
    expect(live?.textContent).toContain(steps[0].caption);
    const dot = screen.getByRole("button", { name: /step 3 of 3/i });
    fireEvent.click(dot);
    expect(dot).toHaveAttribute("aria-current", "step");
    expect(live?.textContent).toContain(steps[2].caption);
  });
});

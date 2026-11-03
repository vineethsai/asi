import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Learn from "@/pages/Learn";
import ProgressDashboard from "@/pages/ProgressDashboard";
import ScenarioPage from "@/pages/Scenario";
import { LEARNING_STEPS } from "@/data/learningPath";
import { SCENARIOS } from "@/data/scenarios";
import { useProgressStore } from "@/lib/progress";
import { BADGE_HEIGHT, BADGE_WIDTH, buildBadgeSvg } from "@/components/learn/badge";
import { badgeStats } from "@/components/learn/progressStats";

vi.mock("@/lib/analytics", () => ({ trackPageEvents: { quizComplete: vi.fn() } }));
vi.mock("canvas-confetti", () => ({ default: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

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
  if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {};
});

afterEach(() => {
  cleanup();
  act(() => useProgressStore.getState().reset());
});

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/learn" element={<Learn />} />
        <Route path="/learn/:stepId" element={<Learn />} />
        <Route path="/progress" element={<ProgressDashboard />} />
        <Route path="/scenarios/:id" element={<ScenarioPage />} />
      </Routes>
    </MemoryRouter>,
  );

describe("Phase 4 pages render", () => {
  it("learning path overview lists every step and the challenge", () => {
    renderAt("/learn");
    expect(screen.getByRole("heading", { level: 1, name: "Learning path" })).toBeInTheDocument();
    for (const step of LEARNING_STEPS) {
      expect(
        screen.getAllByRole("link").some((a) => a.getAttribute("href") === `/learn/${step.id}`),
      ).toBe(true);
    }
    expect(document.getElementById("challenge")).not.toBeNull();
  });

  it("a step page shows its readings and a five-question quiz", () => {
    renderAt("/learn/controls");
    const step = LEARNING_STEPS.find((s) => s.id === "controls")!;
    expect(screen.getByRole("heading", { level: 1, name: step.title })).toBeInTheDocument();
    for (const r of step.readings) {
      expect(screen.getAllByRole("link").some((a) => a.getAttribute("href") === r.path)).toBe(true);
    }
    expect(screen.getByText(/question 1 of 5/i)).toBeInTheDocument();
  });

  it("an unknown step shows the not-found state", () => {
    renderAt("/learn/nope");
    expect(screen.getAllByText("Step not found").length).toBeGreaterThan(0);
  });

  it("a scenario walks through its steps and reveals the controls", () => {
    const s = SCENARIOS[0];
    renderAt(`/scenarios/${s.id}`);
    expect(screen.getByRole("heading", { level: 1, name: s.title })).toBeInTheDocument();
    const reveal = screen.getByRole("button", { name: /what would have stopped this/i });
    expect(reveal).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(reveal);
    expect(reveal).toHaveAttribute("aria-expanded", "true");
    for (const id of s.controlsThatStop) {
      expect(
        screen.getAllByRole("link").some((a) => a.getAttribute("href") === `/controls/${id}`),
      ).toBe(true);
    }
  });

  it("an unknown scenario shows the not-found state", () => {
    renderAt("/scenarios/does-not-exist");
    expect(screen.getAllByText("Scenario not found").length).toBeGreaterThan(0);
  });

  it("the progress dashboard renders with empty progress and reflects a quiz score", () => {
    act(() => useProgressStore.getState().recordQuiz("challenge", 8, 10));
    renderAt("/progress");
    expect(screen.getByRole("heading", { level: 1, name: "Your progress" })).toBeInTheDocument();
    expect(screen.getAllByText(/8\s*\/\s*10/).length).toBeGreaterThan(0);
    expect(document.getElementById("badge")).not.toBeNull();
  });
});

describe("badge", () => {
  it("builds a 1200×630 SVG from the store", () => {
    const svg = buildBadgeSvg(badgeStats(useProgressStore.getState()), new Date("2026-11-03"));
    expect(svg).toContain(`width="${BADGE_WIDTH}"`);
    expect(svg).toContain(`height="${BADGE_HEIGHT}"`);
    expect(svg.startsWith("<svg")).toBe(true);
  });
});

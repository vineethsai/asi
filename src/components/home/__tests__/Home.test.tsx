import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Index from "@/pages/Index";
import { SITE_STATS } from "@/components/home/siteStats";
import { featuredThreatFor } from "@/lib/featured";
import { architecturesData } from "@/components/components/architecturesData";
import { featuredScenario, scenarioPath } from "@/data/scenarios";
import { LEARNING_STEPS } from "@/data/learningPath";
import { useProgressStore } from "@/lib/progress";

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
});

afterEach(() => {
  cleanup();
  act(() => useProgressStore.getState().resetPath());
  localStorage.clear();
});

const renderHome = () =>
  render(
    <MemoryRouter>
      <Index />
    </MemoryRouter>,
  );

describe("Home page", () => {
  it("renders the hero with a search entry point and data-driven 'What's inside' counts", () => {
    renderHome();
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What's inside" })).toBeInTheDocument();
    const inside = screen.getByRole("heading", { name: "What's inside" }).parentElement!;
    // Final values are exposed to assistive tech even while the count-up runs.
    expect(
      within(inside).getAllByText(new RegExp(`\\b${SITE_STATS.threats}\\b`)).length,
    ).toBeGreaterThan(0);
    expect(
      within(inside).getAllByText(new RegExp(`\\b${SITE_STATS.aisvsRequirements}\\b`)).length,
    ).toBeGreaterThan(0);
    expect(within(inside).getAllByRole("link").length).toBeGreaterThanOrEqual(8);
  });

  it("features today's threat and links to its page", () => {
    renderHome();
    expect(screen.getByText(/threat of the day/i)).toBeInTheDocument();
    const t = featuredThreatFor(new Date());
    const links = screen
      .getAllByRole("link")
      .filter((a) => a.getAttribute("href") === `/threats/${t.id}`);
    expect(links.length).toBeGreaterThan(0);
  });

  it("shows the learning-path call to action when there is no progress", () => {
    renderHome();
    const cta = screen.getAllByRole("link", { name: /start the learning path/i })[0];
    expect(cta).toHaveAttribute("href", "/learn");
  });

  it("shows one showcase tab per architecture pattern and the how-to strip", () => {
    renderHome();
    const showcase = screen
      .getByRole("heading", { name: /architecture patterns under attack/i })
      .closest("section")!;
    const tabs = within(showcase).getAllByRole("tab");
    expect(tabs).toHaveLength(Object.keys(architecturesData).length);
    expect(tabs.filter((t) => t.getAttribute("aria-selected") === "true")).toHaveLength(1);
    expect(screen.getByRole("heading", { name: /how to use this site/i })).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("link")
        .some((a) => a.getAttribute("href") === "/architectures?view=graph"),
    ).toBe(true);
  });

  it("links today's featured scenario next to the threat of the day", () => {
    renderHome();
    const s = featuredScenario(new Date());
    const link = screen.getByRole("link", {
      name: new RegExp(s.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    });
    expect(link).toHaveAttribute("href", scenarioPath(s.id));
  });

  it("shows 'Step N of total' once the learning path has started", () => {
    act(() => useProgressStore.getState().setPathStep(LEARNING_STEPS[0].id, true));
    renderHome();
    expect(
      screen.getByText(`Step ${LEARNING_STEPS[1].number} of ${LEARNING_STEPS.length}`),
    ).toBeInTheDocument();
  });

  it("shows a platform-appropriate palette shortcut", () => {
    renderHome();
    const mac = /mac|iphone|ipad|ipod/i.test(navigator.platform || navigator.userAgent);
    expect(screen.getByText(mac ? "⌘K" : "Ctrl K")).toBeInTheDocument();
  });

  it("loads the challenge quiz only after 'Start the challenge'", async () => {
    renderHome();
    expect(
      screen.getByRole("heading", { name: /agentic security challenge/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("radiogroup")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /start the challenge/i }));
    expect(await screen.findByText(/questions\./i, {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /start the challenge/i })).toBeNull();
  });
});

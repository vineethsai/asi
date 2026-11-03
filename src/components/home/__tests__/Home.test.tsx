import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Index from "@/pages/Index";
import { SITE_STATS } from "@/components/home/siteStats";
import { featuredThreatFor } from "@/lib/featured";
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
});

import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import Architectures from "@/pages/Architectures";
import ArchitectureDetail from "@/pages/ArchitectureDetail";
import { architecturesData } from "@/components/components/architecturesData";
import { scenarioPath, scenariosForArchitecture } from "@/data/scenarios";

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

afterEach(cleanup);

const renderAt = (url: string, ui: ReactElement) =>
  render(
    <TooltipProvider>
      <MemoryRouter initialEntries={[url]}>{ui}</MemoryRouter>
    </TooltipProvider>,
  );
const detailRoutes = (
  <Routes>
    <Route path="/architectures/:architectureId" element={<ArchitectureDetail />} />
  </Routes>
);

const ARCHS = Object.values(architecturesData);

describe("Architectures list", () => {
  it("renders one card per pattern", () => {
    renderAt("/architectures", <Architectures />);
    for (const a of ARCHS) {
      expect(
        screen
          .getAllByRole("link")
          .some((l) => l.getAttribute("href") === `/architectures/${a.id}`),
      ).toBe(true);
    }
  });
});

describe("ArchitectureDetail", () => {
  const tabs = ["overview", "diagram", "components", "threats", "mitigations"];
  for (const a of ARCHS) {
    it.each(tabs)(`${a.id}: renders the %s tab`, (tab) => {
      renderAt(`/architectures/${a.id}?tab=${tab}`, detailRoutes);
      expect(screen.getByRole("heading", { level: 1, name: a.name })).toBeInTheDocument();
      const selected = screen
        .getAllByRole("tab")
        .find((t) => t.getAttribute("aria-selected") === "true");
      expect(selected?.textContent?.toLowerCase()).toContain(tab);
      expect(
        screen
          .getAllByRole("link")
          .some((l) => l.getAttribute("href")?.startsWith("/threat-modeler")),
      ).toBe(true);
    });
  }

  it.each(ARCHS.map((a) => a.id))("%s: threats tab links its scenario walkthroughs", (id) => {
    renderAt(`/architectures/${id}?tab=threats`, detailRoutes);
    const expected = scenariosForArchitecture(id);
    const hrefs = screen.getAllByRole("link").map((l) => l.getAttribute("href"));
    expected.forEach((s) => expect(hrefs).toContain(scenarioPath(s.id)));
  });

  it("gives Knowledge-Intensive its real-world examples", () => {
    renderAt("/architectures/knowledge_intensive", detailRoutes);
    expect(screen.getByRole("heading", { name: /real-world examples/i })).toBeInTheDocument();
  });

  it("shows the not-found state for an unknown id", () => {
    renderAt("/architectures/nope", detailRoutes);
    expect(screen.queryByRole("tab")).toBeNull();
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import Controls from "@/pages/Controls";
import ControlDetail from "@/pages/ControlDetail";
import { SecurityChecklist } from "@/components/interactive/SecurityChecklist";
import { RichText } from "@/components/content/RichText";
import { mitigationsData } from "@/components/components/securityData";
import { isAisvsCode, aisvsData } from "@/data/aisvs";
import { phaseSections, phaseTaskTotal } from "@/components/controls/phaseTasks";
import { CONTROL_LIST, controlChapters } from "@/components/controls/controlIndex";

function renderAt(path: string) {
  return render(
    <TooltipProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/controls" element={<Controls />} />
          <Route path="/controls/:controlId" element={<ControlDetail />} />
          <Route path="/interactive" element={<SecurityChecklist />} />
        </Routes>
      </MemoryRouter>
    </TooltipProvider>,
  );
}

afterEach(() => vi.restoreAllMocks());

describe("phase tasks", () => {
  it("counts exactly the checkboxes RichText renders for each section", () => {
    const m = mitigationsData.m2;
    for (const s of phaseSections(m, "design")) {
      const { container, unmount } = render(
        <MemoryRouter>
          <RichText
            text={s.body}
            checklist={{ idPrefix: s.idPrefix, isChecked: () => false, onToggle: () => {} }}
          />
        </MemoryRouter>,
      );
      expect(container.querySelectorAll('button[role="checkbox"]')).toHaveLength(s.taskCount);
      unmount();
    }
    expect(phaseTaskTotal(m, "design")).toBeGreaterThan(0);
  });
});

describe("Controls page", () => {
  it("applies the chapter filter to the controls and requirements tabs alike", () => {
    renderAt("/controls?chapter=C10");
    const expected = CONTROL_LIST.filter((m) => controlChapters(m).includes("C10")).length;
    expect(screen.getByRole("tab", { name: `Controls (${expected})` })).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: `AISVS requirements (${aisvsData.C10.requirementCount})` }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Active Controls/i)).not.toBeInTheDocument();
  });

  it("renders the AISVS coverage bars with one row per chapter", () => {
    renderAt("/controls?tab=coverage");
    expect(
      screen.getByRole("heading", { name: "AISVS 1.01 coverage by control" }),
    ).toBeInTheDocument();
    for (const code of Object.keys(aisvsData)) {
      expect(screen.getAllByText(new RegExp(`^${code} `)).length).toBeGreaterThan(0);
    }
  });
});

describe("ControlDetail", () => {
  it("shows the lifecycle link and phase progress rings", () => {
    renderAt("/controls/m2");
    expect(screen.getByRole("link", { name: /see in lifecycle/i })).toHaveAttribute(
      "href",
      "/implementation?control=m2",
    );
    const progress = screen.getByRole("heading", { name: /your progress/i }).closest("section")!;
    expect(within(progress).getAllByRole("button")).toHaveLength(3);
  });
});

describe("ControlDetail AISVS footprint", () => {
  it("lists all 12 chapters as bars, zero rows included, instead of a radar", async () => {
    const control = CONTROL_LIST.find((m) => controlChapters(m).length > 0)!;
    const { container } = renderAt(`/controls/${control.id}`);
    // ControlFootprint is lazy-loaded; CI runners can take more than the default 1 s.
    const heading = await screen.findByRole(
      "heading",
      { name: "AISVS footprint" },
      { timeout: 10_000 },
    );
    const figure = heading.closest("figure")!;
    const rows = figure.querySelectorAll("li[data-chapter]");
    expect([...rows].map((r) => r.getAttribute("data-chapter"))).toEqual(Object.keys(aisvsData));
    expect([...rows].some((r) => r.textContent?.endsWith("0"))).toBe(true);
    expect(within(figure).getByRole("table")).toHaveTextContent("AISVS chapter");
    expect(container.querySelector(".recharts-wrapper")).toBeNull();
    expect(screen.getByRole("list", { name: "Mapped chapters" })).toBeInTheDocument();
  });
});

describe("SecurityChecklist", () => {
  it("links valid AISVS 1.01 references and renders without DOM nesting warnings", () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    renderAt("/interactive");
    const links = screen
      .getAllByRole("link")
      .filter((a) => a.getAttribute("href")?.startsWith("/aisvs#"));
    expect(links.length).toBeGreaterThan(0);
    for (const a of links) {
      expect(isAisvsCode(a.getAttribute("href")!.slice("/aisvs#".length))).toBe(true);
    }
    expect(screen.getByText(/60% critical items/)).toBeInTheDocument();
    const nesting = err.mock.calls.filter((c) => String(c[0]).includes("validateDOMNesting"));
    expect(nesting).toHaveLength(0);
  });
});

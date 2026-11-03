import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import Threats from "@/pages/Threats";
import ThreatDetail from "@/pages/ThreatDetail";
import { threatsData } from "@/components/components/securityData";
import { THREAT_LIST, threatNeighbours } from "@/components/threats/threatIndex";
import { threatFrameworkRefs } from "@/components/threats/frameworkLinks";
import { COMPONENT_ENTRIES } from "@/components/kc-components/componentIndex";

function renderAt(path: string) {
  return render(
    <TooltipProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/threats" element={<Threats />} />
          <Route path="/threats/:threatId" element={<ThreatDetail />} />
        </Routes>
      </MemoryRouter>
    </TooltipProvider>,
  );
}

describe("Threats page heatmap", () => {
  it("renders one heatmap row per threat and one column per component node", () => {
    renderAt("/threats?view=heatmap");
    const grid = screen.getByRole("grid");
    const body = grid.querySelector("tbody")!;
    const rows = within(body as HTMLElement).getAllByRole("row");
    expect(rows).toHaveLength(Object.keys(threatsData).length);
    expect(rows).toHaveLength(17);
    THREAT_LIST.forEach((t, i) => expect(rows[i]).toHaveTextContent(t.code));
    expect(COMPONENT_ENTRIES).toHaveLength(40);
  });

  it("filters the heatmap rows with the impact filter", () => {
    renderAt("/threats?view=heatmap&impact=medium");
    const expected = THREAT_LIST.filter((t) => t.impactLevel === "medium").length;
    const body = screen.getByRole("grid").querySelector("tbody")!;
    expect(within(body as HTMLElement).getAllByRole("row")).toHaveLength(expected);
  });

  it("labels the search field and shows the catalog count", () => {
    renderAt("/threats");
    expect(screen.getByLabelText("Search threats")).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: `Catalog (${THREAT_LIST.length})` }),
    ).toBeInTheDocument();
  });
});

describe("ThreatDetail", () => {
  it("renders T16 with deep-linked framework chips, prev/next and the modeler link", () => {
    renderAt("/threats/t16?tab=frameworks");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(threatsData.t16.name);
    const refs = threatFrameworkRefs(threatsData.t16);
    expect(refs.asi.length).toBeGreaterThan(0);
    for (const ref of [...refs.asi, ...refs.cisco, ...refs.aivss]) {
      expect(ref.href).toMatch(/^\/taxonomy\?tab=(owasp-agentic|cisco|aivss)&entry=/);
    }
    const asiLink = screen
      .getAllByRole("link")
      .find((a) => a.getAttribute("href") === refs.asi[0].href);
    expect(asiLink).toBeDefined();
    const modeler = screen.getByRole("link", { name: /open in threat modeler/i });
    expect(modeler.getAttribute("href")).toMatch(/^\/threat-modeler\?template=[\w-]+&threat=t16$/);
    const { prev, next } = threatNeighbours("t16");
    const nav = screen.getByRole("navigation", { name: "Other threats" });
    expect(within(nav).getByRole("link", { name: new RegExp(prev!.code) })).toHaveAttribute(
      "href",
      `/threats/${prev!.id}`,
    );
    expect(within(nav).getByRole("link", { name: new RegExp(next!.code) })).toHaveAttribute(
      "href",
      `/threats/${next!.id}`,
    );
  });

  it("gives every tab an accessible name and makes constellation nodes focusable", () => {
    renderAt("/threats/t1?tab=frameworks");
    for (const name of ["Overview", "Attack vectors", "Controls", "Components", "Frameworks"]) {
      expect(screen.getByRole("tab", { name: new RegExp(name) })).toBeInTheDocument();
    }
    const nodes = document.querySelectorAll('g[role="link"][tabindex="0"]');
    const refs = threatFrameworkRefs(threatsData.t1);
    expect(nodes).toHaveLength(refs.asi.length + refs.cisco.length + refs.aivss.length);
  });
});

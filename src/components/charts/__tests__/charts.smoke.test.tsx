import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactElement } from "react";
import {
  Bipartite,
  ChartFrame,
  CoverageBars,
  Gauge,
  Heatmap,
  LayerStack,
  Radar,
  Ring,
  Sankey,
  Sparkline,
  StackedBars,
  Sunburst,
} from "@/components/charts";

const wrap = (ui: ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);
const img = (name: RegExp | string) => screen.getAllByRole("img", { name })[0];

describe("ChartFrame", () => {
  it("renders title, role=img with aria-label and an sr-only table", () => {
    wrap(
      <ChartFrame
        title="Coverage"
        description="Things"
        ariaLabel="Bar chart of coverage"
        table={{ columns: ["Name", "Value"], rows: [["A", 1]] }}
      >
        <svg />
      </ChartFrame>,
    );
    expect(screen.getByRole("heading", { name: "Coverage" })).toBeInTheDocument();
    expect(img("Bar chart of coverage")).toBeInTheDocument();
    const table = screen.getByRole("table");
    expect(table).toHaveClass("sr-only");
    expect(within(table).getByText("A")).toBeInTheDocument();
  });

  it("interactive charts expose a labelled group and keep a role=img text alternative", () => {
    wrap(
      <ChartFrame title="Map" ariaLabel="Interactive map" interactive>
        <button type="button">mark</button>
      </ChartFrame>,
    );
    expect(img("Interactive map")).toBeInTheDocument();
    const group = screen.getByRole("group", { name: "Map" });
    expect(group).toHaveAttribute("aria-roledescription", "interactive chart");
    expect(within(group).getByRole("button", { name: "mark" })).toBeInTheDocument();
  });

  it("shows the empty state", () => {
    wrap(<ChartFrame ariaLabel="x" empty emptyTitle="Nothing yet" />);
    expect(screen.getByText("Nothing yet")).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "x" })).toBeNull();
  });
});

describe("Ring", () => {
  it("renders an accessible progress ring", () => {
    wrap(<Ring value={3} max={4} tone="progress" ariaLabel="C1: 3 of 4" />);
    expect(img("C1: 3 of 4")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
  });
});

describe("Gauge", () => {
  it("renders the AIVSS score, band and aria-label", () => {
    wrap(<Gauge score={7.4} />);
    expect(img(/AIVSS score 7.4 out of 10, High/)).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
  });
});

describe("Sparkline", () => {
  it("summarises counts as text", () => {
    wrap(<Sparkline counts={{ critical: 2, high: 1, low: 2 }} showText />);
    expect(img("5 threats (2 critical, 1 high, 2 low)")).toBeInTheDocument();
  });
});

describe("StackedBars", () => {
  it("renders rows with counts and toggles selection", () => {
    const onSelect = vi.fn();
    wrap(
      <StackedBars
        ariaLabel="AISVS by level"
        title="By level"
        onSelect={onSelect}
        data={[
          { id: "L1", label: "Level 1", done: 5, total: 10, band: "low" },
          { id: "L2", label: "Level 2", done: 0, total: 8, band: "medium" },
        ]}
      />,
    );
    expect(img("AISVS by level")).toBeInTheDocument();
    expect(screen.getAllByText("50%").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: /Level 1/ }));
    expect(onSelect).toHaveBeenCalledWith("L1");
  });
});

describe("CoverageBars", () => {
  it("renders segments as buttons", () => {
    const onSeg = vi.fn();
    wrap(
      <CoverageBars
        ariaLabel="Chapters covered by controls"
        onSegmentClick={onSeg}
        rows={[
          {
            id: "C1",
            label: "C1 Training data",
            total: 10,
            segments: [
              { id: "m1", label: "M1", value: 3 },
              { id: "m2", label: "M2", value: 2 },
            ],
          },
        ]}
      />,
    );
    expect(img("Chapters covered by controls")).toBeInTheDocument();
    expect(screen.getAllByText("5 / 10 (50%)").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "C1 Training data: M2, 2" }));
    expect(onSeg).toHaveBeenCalled();
  });
});

describe("Heatmap", () => {
  const rows = [
    { id: "t1", label: "Memory Poisoning" },
    { id: "t2", label: "Tool Misuse" },
  ];
  const columns = [
    { id: "kc1.1", label: "LLM", group: "kc1" },
    { id: "kc1.2", label: "MLLM", group: "kc1" },
    { id: "kc4.1", label: "Vector DB", group: "kc4" },
  ];
  const groups = [
    { id: "kc1", label: "KC1" },
    { id: "kc4", label: "KC4" },
  ];
  const cells = {
    t1: {
      "kc1.1": { value: 3, band: "critical" as const, glyph: 1 },
      "kc4.1": { value: 1, band: "high" as const },
    },
    t2: { "kc1.2": { value: 2, band: "medium" as const } },
  };

  it("renders a grid with roving tabindex, keyboard nav and collapsible groups", () => {
    const onCell = vi.fn();
    wrap(
      <Heatmap
        ariaLabel="Threats by component"
        title="Threat heatmap"
        rows={rows}
        columns={columns}
        groups={groups}
        cells={cells}
        onCellClick={onCell}
      />,
    );
    expect(img("Threats by component")).toBeInTheDocument();
    const grid = screen.getByRole("grid", { name: "Threats by component" });
    const gridcells = within(grid).getAllByRole("gridcell");
    expect(gridcells).toHaveLength(6);
    expect(gridcells.filter((c) => c.tabIndex === 0)).toHaveLength(1);
    const first = gridcells[0];
    expect(first).toHaveAccessibleName("Memory Poisoning × LLM: Critical, 3");
    act(() => first.focus());
    fireEvent.keyDown(first, { key: "ArrowRight" });
    expect(document.activeElement).toBe(gridcells[1]);
    fireEvent.keyDown(gridcells[1], { key: "Enter" });
    expect(onCell).toHaveBeenCalledWith(rows[0], columns[1], undefined);

    fireEvent.click(screen.getByRole("button", { name: "KC1" }));
    expect(within(grid).getAllByRole("gridcell")).toHaveLength(4);
    expect(screen.getByRole("button", { name: "KC1" })).toHaveAttribute("aria-expanded", "false");
  });
});

describe("LayerStack", () => {
  it("renders seven MAESTRO bands with chips", () => {
    const onLayer = vi.fn();
    wrap(
      <LayerStack
        ariaLabel="Threats by MAESTRO layer"
        countLabel="threats"
        onLayerClick={onLayer}
        layers={[
          {
            layer: 3,
            count: 2,
            chips: [{ id: "t2", label: "T2", href: "/threats/t2", band: "critical" }],
          },
        ]}
      />,
    );
    expect(img("Threats by MAESTRO layer")).toBeInTheDocument();
    expect(
      screen.getAllByRole("listitem").filter((li) => li.hasAttribute("data-layer")),
    ).toHaveLength(7);
    expect(screen.getByRole("link", { name: /T2/ })).toHaveAttribute("href", "/threats/t2");
    fireEvent.click(screen.getByRole("button", { name: /Agent Frameworks/ }));
    expect(onLayer).toHaveBeenCalledWith(3);
  });
});

describe("Radar", () => {
  it("renders overlay and individual modes", () => {
    wrap(
      <Radar
        ariaLabel="Architecture features"
        axes={[
          { key: "a", label: "Autonomy" },
          { key: "b", label: "Memory" },
          { key: "c", label: "Tools" },
        ]}
        series={[
          { id: "s1", label: "Sequential", values: { a: 1, b: 2, c: 3 } },
          { id: "s2", label: "Swarm", values: { a: 3, b: 2, c: 1 } },
        ]}
      />,
    );
    expect(img("Architecture features")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "individual" }));
    expect(screen.getAllByText("Swarm").length).toBeGreaterThan(0);
  });
});

describe("Sunburst", () => {
  it("renders arcs for two rings and a nested list fallback", () => {
    const onNavigate = vi.fn();
    wrap(
      <Sunburst
        ariaLabel="Components by KC"
        valueLabel="threats"
        onNavigate={onNavigate}
        data={{
          id: "root",
          name: "Components",
          children: [
            {
              id: "kc1",
              name: "LLMs",
              children: [
                { id: "kc1.1", name: "LLM", value: 4 },
                { id: "kc1.2", name: "MLLM", value: 2 },
              ],
            },
            { id: "kc4", name: "Memory", children: [{ id: "kc4.1", name: "Vector DB", value: 3 }] },
          ],
        }}
      />,
    );
    expect(img("Components by KC")).toBeInTheDocument();
    const arcs = document.querySelectorAll("g[data-layer=arcs] path");
    expect(arcs.length).toBe(5);
    const leaf = screen.getByRole("button", { name: "Vector DB: 3 threats" });
    fireEvent.click(leaf);
    expect(onNavigate).toHaveBeenCalledWith(expect.objectContaining({ id: "kc4.1" }));
    fireEvent.click(screen.getByRole("button", { name: /^LLMs: 6 threats/ }));
    expect(screen.getByRole("navigation", { name: "Hierarchy breadcrumb" })).toHaveTextContent(
      "LLMs",
    );
    fireEvent.click(screen.getByRole("button", { name: "Treemap" }));
    expect(document.querySelectorAll("g[data-layer=map] g.cell").length).toBeGreaterThan(0);
  });
});

describe("Sankey", () => {
  it("lays out columns, pins on click and exposes a data table", () => {
    const onPin = vi.fn();
    wrap(
      <Sankey
        ariaLabel="ASI to threats to Cisco"
        onPinChange={onPin}
        groups={[
          { id: "asi", label: "ASI" },
          { id: "tm", label: "Threats" },
          { id: "cisco", label: "Cisco" },
        ]}
        nodes={[
          { id: "ASI01", label: "Agent Goal Hijack", group: "asi" },
          { id: "t6", label: "Intent Breaking", group: "tm" },
          { id: "t2", label: "Tool Misuse", group: "tm" },
          { id: "OB-1", label: "Goal hijacking", group: "cisco" },
        ]}
        links={[
          { source: "ASI01", target: "t6", value: 2 },
          { source: "ASI01", target: "t2", value: 1 },
          { source: "OB-1", target: "t6", value: 1 },
        ]}
      />,
    );
    expect(img("ASI to threats to Cisco")).toBeInTheDocument();
    const nodes = document.querySelectorAll("g[data-layer=nodes] g.node");
    expect(nodes.length).toBe(4);
    const t6 = screen.getByRole("button", { name: /^Intent Breaking/ });
    fireEvent.click(t6);
    expect(onPin).toHaveBeenCalledWith("t6");
    expect(screen.getAllByRole("table")[0]).toHaveTextContent("Goal hijacking");
  });
});

describe("Bipartite", () => {
  it("renders columns, highlights on select and keeps zoom controls", () => {
    const onSelect = vi.fn();
    wrap(
      <Bipartite
        ariaLabel="NIST to controls"
        onSelect={onSelect}
        columns={[
          { id: "fn", label: "Function" },
          { id: "ctl", label: "Control" },
        ]}
        nodes={[
          { id: "GOVERN", label: "Govern", column: "fn", group: "GOVERN" },
          { id: "MAP", label: "Map", column: "fn", group: "MAP" },
          { id: "m1", label: "M1", column: "ctl" },
          { id: "m2", label: "M2", column: "ctl" },
        ]}
        links={[
          { source: "GOVERN", target: "m1" },
          { source: "MAP", target: "m2", weight: 2 },
        ]}
      />,
    );
    expect(img("NIST to controls")).toBeInTheDocument();
    expect(document.querySelectorAll("g[data-layer=links] path").length).toBe(2);
    fireEvent.click(screen.getByRole("button", { name: /^Govern/ }));
    expect(onSelect).toHaveBeenCalledWith("GOVERN");
    expect(screen.getByRole("button", { name: "Zoom in" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
  });
});

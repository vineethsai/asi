/** Smoke test for the results panel: tabs, cards, banners and empty states render and respond. */
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { ReactFlowProvider } from "@xyflow/react";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createDocument, documentToAnalysisInput } from "../../document";
import { analyzeThreatModel } from "../../engine/analyze";
import { deriveThreatMaps, documentFingerprint, getThreatModelStore, tm } from "../../store";
import { templateModel } from "../../__tests__/fixtures";
import ResultsPanel from "../ResultsPanel";

beforeAll(() => {
  const g = globalThis as unknown as Record<string, unknown>;
  if (!g.ResizeObserver)
    g.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  if (!window.matchMedia)
    window.matchMedia = ((q: string) => ({
      matches: false,
      media: q,
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
  Element.prototype.scrollIntoView = function () {};
});

function load(withAnalysis = true) {
  const doc = createDocument({ ...templateModel("mcp-coding-agent"), name: "Test" });
  const analysis = withAnalysis ? analyzeThreatModel(documentToAnalysisInput(doc)) : null;
  getThreatModelStore().setState((s) => ({
    document: doc,
    analysis,
    analysisFingerprint: analysis ? documentFingerprint(doc) : null,
    analysisError: null,
    analysisPhase: "idle",
    persist: "autosave",
    ...deriveThreatMaps(analysis),
    ui: {
      ...s.ui,
      resultsTab: "threats",
      selectedThreatId: null,
      whatIf: { active: false, result: null },
      playback: null,
    },
  }));
  return analysis;
}

const renderPanel = () =>
  render(
    <ReactFlowProvider>
      <ResultsPanel variant="pane" />
    </ReactFlowProvider>,
  );

describe("ResultsPanel", () => {
  beforeEach(() => load());

  it("renders one tablist with counts and roving arrow keys", () => {
    const a = tm().analysis!;
    renderPanel();
    expect(screen.getAllByRole("tablist")).toHaveLength(1);
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((t) => t.textContent?.replace(/\d+.*$/, ""))).toEqual([
      "Threats",
      "Paths",
      "Compliance",
      "Mappings",
      "Dashboard",
    ]);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(tabs[0].textContent).toContain(String(a.summary.open));
    fireEvent.keyDown(tabs[0], { key: "ArrowRight" });
    expect(tm().ui.resultsTab).toBe("paths");
    fireEvent.keyDown(screen.getAllByRole("tab")[1], { key: "End" });
    expect(tm().ui.resultsTab).toBe("dashboard");
  });

  it("expands a threat card and shows why it fired", () => {
    renderPanel();
    const first = tm().analysis!.threats.find((t) => !t.inherited)!;
    const header = screen
      .getAllByRole("button", { expanded: false })
      .find((b) => b.textContent?.includes(first.name));
    expect(header).toBeTruthy();
    fireEvent.click(header!);
    expect(tm().ui.selectedThreatId).toBe(first.id);
    expect(screen.getAllByText(/why it fired/i).length).toBeGreaterThan(0);
  });

  it("jump to critical selects an open critical threat", () => {
    renderPanel();
    const btn = screen.queryByRole("button", { name: /jump to critical/i });
    if (!btn) return;
    fireEvent.click(btn);
    const sel = tm().analysis!.threats.find((t) => t.id === tm().ui.selectedThreatId);
    expect(sel?.severity).toBe("critical");
  });

  it("paths, compliance, mappings and dashboard tabs render", async () => {
    renderPanel();
    act(() => tm().setUi({ resultsTab: "paths" }));
    if (tm().analysis!.paths.paths.length) {
      fireEvent.click(screen.getAllByRole("button", { name: /play on canvas/i })[0]);
      expect(tm().ui.playback?.pathId).toBe(tm().analysis!.paths.paths[0].id);
      expect(screen.getAllByText(/playing/i).length).toBeGreaterThan(0);
    }
    act(() => tm().setUi({ resultsTab: "compliance" }));
    expect(screen.getByText(/Indicative — derived from the diagram only/)).toBeInTheDocument();
    act(() => tm().setUi({ resultsTab: "mappings" }));
    expect(screen.getByText(/OWASP Agentic Security/)).toBeInTheDocument();
    act(() => tm().setUi({ resultsTab: "dashboard" }));
    expect(await screen.findByText("Model risk score")).toBeInTheDocument();
  });

  it("shows stale and what-if banners", () => {
    renderPanel();
    act(() =>
      getThreatModelStore().setState((s) => ({
        document: {
          ...s.document,
          nodes: s.document.nodes.map((n, i) =>
            i === 0 ? { ...n, data: { ...n.data, label: "Renamed" } } : n,
          ),
        },
      })),
    );
    expect(screen.getByText(/Model changed since this analysis/)).toBeInTheDocument();
    act(() =>
      tm().setUi({
        whatIf: {
          active: true,
          result: {
            nodeId: "x",
            label: "Gateway",
            before: { threats: 5, open: 4, score: 50, paths: 2 },
            after: { threats: 3, open: 2, score: 30, paths: 1 },
          },
        },
      }),
    );
    const banner = screen
      .getByText(/What if “Gateway” were removed/)
      .closest("[role=status]") as HTMLElement;
    fireEvent.click(within(banner).getByRole("button", { name: "Exit" }));
    expect(tm().ui.whatIf.active).toBe(false);
  });

  it("shows the run-analysis empty state", () => {
    load(false);
    renderPanel();
    expect(screen.getByText("Not analysed yet")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /run analysis/i })).toBeEnabled();
  });
});

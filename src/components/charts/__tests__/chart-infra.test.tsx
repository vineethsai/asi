import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { select } from "d3";
import {
  ChartTooltip,
  clearLinkDraw,
  connectedClosure,
  drawInLinks,
  defaultAggregate,
  percent,
  progressBand,
  readChartTheme,
  useChartTheme,
  useResizeObserver,
} from "@/components/charts";

describe("useChartTheme", () => {
  it("re-reads colours when the <html> class changes", async () => {
    const { result } = renderHook(() => useChartTheme());
    expect(result.current.isDark).toBe(false);
    expect(result.current.severity.critical).toBe("hsl(0 84% 60%)");
    await act(async () => {
      document.documentElement.classList.add("dark");
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(result.current.isDark).toBe(true);
    expect(result.current.severity.critical).toBe("hsl(0 84% 65%)");
    expect(result.current.kc.kc1).toBe("hsl(213 94% 68%)");
    await act(async () => {
      document.documentElement.classList.remove("dark");
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(result.current.isDark).toBe(false);
  });

  it("readChartTheme works outside React", () => {
    const t = readChartTheme();
    expect(Object.keys(t.maestro)).toHaveLength(7);
    expect(t.framework.asi).toMatch(/^hsl\(/);
  });
});

describe("ChartTooltip", () => {
  it("portals a role=tooltip and dismisses on Escape", () => {
    const onDismiss = vi.fn();
    render(
      <ChartTooltip open x={10} y={10} id="tip" onDismiss={onDismiss}>
        Hello
      </ChartTooltip>,
    );
    expect(screen.getByRole("tooltip")).toHaveTextContent("Hello");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onDismiss).toHaveBeenCalled();
  });

  it("renders nothing when closed", () => {
    render(
      <ChartTooltip open={false} x={0} y={0}>
        Hidden
      </ChartTooltip>,
    );
    expect(screen.queryByRole("tooltip")).toBeNull();
  });
});

describe("useResizeObserver", () => {
  it("falls back to the initial size without ResizeObserver", () => {
    const { result } = renderHook(() =>
      useResizeObserver({ initialWidth: 320, initialHeight: 100 }),
    );
    expect(result.current.width).toBe(320);
    expect(result.current.height).toBe(100);
  });

  it("reports measured once the first size (or fallback) is applied", () => {
    const { result } = renderHook(() => {
      const r = useResizeObserver<HTMLDivElement>({ initialWidth: 500 });
      return r;
    });
    expect(result.current.measured).toBe(false);
    act(() => result.current.ref(document.createElement("div")));
    expect(result.current.measured).toBe(true);
    expect(result.current.width).toBe(500);
  });
});

describe("link draw-in (drawInLinks / clearLinkDraw)", () => {
  const SVG_NS = "http://www.w3.org/2000/svg";
  function makePath(length: number) {
    const svg = document.createElementNS(SVG_NS, "svg");
    const path = document.createElementNS(SVG_NS, "path") as SVGPathElement;
    path.setAttribute("d", "M0,0C40,0 60,80 100,80");
    const measure = vi.fn(() => length);
    Object.defineProperty(path, "getTotalLength", { value: measure });
    svg.appendChild(path);
    document.body.appendChild(svg);
    return { path, measure };
  }
  const dashed = (p: Element) =>
    p.hasAttribute("stroke-dasharray") || p.hasAttribute("stroke-dashoffset");

  it("measures the length when the transition starts and removes the dash on end", async () => {
    const { path, measure } = makePath(120);
    drawInLinks(select(path), false);
    // Nothing is measured or dashed until the transition actually starts.
    expect(measure).not.toHaveBeenCalled();
    expect(dashed(path)).toBe(false);
    await waitFor(() => expect(path.getAttribute("stroke-dasharray")).toBe("120 120"));
    await waitFor(() => expect(dashed(path)).toBe(false), { timeout: 2000 });
    expect(measure).toHaveBeenCalledTimes(1);
  });

  it("clearLinkDraw interrupts a running draw-in and leaves a fully stroked path", async () => {
    const { path } = makePath(80);
    drawInLinks(select(path), false);
    await waitFor(() => expect(path.hasAttribute("stroke-dasharray")).toBe(true));
    clearLinkDraw(select(path));
    expect(dashed(path)).toBe(false);
    await new Promise((r) => setTimeout(r, 60));
    expect(dashed(path)).toBe(false);
  });

  it("a draw-in cancelled before it starts leaves nothing behind", async () => {
    const { path, measure } = makePath(50);
    drawInLinks(select(path), false);
    clearLinkDraw(select(path));
    await new Promise((r) => setTimeout(r, 60));
    expect(measure).not.toHaveBeenCalled();
    expect(dashed(path)).toBe(false);
  });

  it("does not animate under reduced motion", async () => {
    const { path, measure } = makePath(50);
    path.setAttribute("stroke-dasharray", "10 10");
    drawInLinks(select(path), true);
    expect(dashed(path)).toBe(false);
    await new Promise((r) => setTimeout(r, 60));
    expect(measure).not.toHaveBeenCalled();
    expect(dashed(path)).toBe(false);
  });
});

describe("chart utils", () => {
  it("computes helpers", () => {
    expect(progressBand(100)).toBe("low");
    expect(progressBand(10)).toBe("high");
    expect(percent(1, 3)).toBe(33.3);
    expect(percent(1, 0)).toBe(0);
    const c = connectedClosure("b", [
      { source: "a", target: "b" },
      { source: "b", target: "c" },
      { source: "x", target: "y" },
    ]);
    expect([...c].sort()).toEqual(["a", "b", "c"]);
    expect(
      defaultAggregate([
        { value: 2, band: "low" },
        { value: 3, band: "high" },
      ]),
    ).toMatchObject({
      value: 5,
      band: "high",
    });
  });
});

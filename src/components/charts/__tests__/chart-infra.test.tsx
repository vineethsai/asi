import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import {
  ChartTooltip,
  connectedClosure,
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

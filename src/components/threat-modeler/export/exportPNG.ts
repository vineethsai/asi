import type { CanvasNode } from "../types";

const EXCLUDE = [
  "react-flow__minimap",
  "react-flow__controls",
  "react-flow__panel",
  "react-flow__attribution",
];

/** Theme-aware background: the page's computed background colour (P3-43). */
export function canvasBackground(element?: Element | null): string {
  const pick = (el: Element | null | undefined) => {
    if (!el || typeof getComputedStyle === "undefined") return "";
    const c = getComputedStyle(el).backgroundColor;
    return c && c !== "transparent" && !/rgba\(0, 0, 0, 0\)/.test(c) ? c : "";
  };
  return (
    pick(element) ||
    pick(document.body) ||
    pick(document.documentElement) ||
    (document.documentElement.classList.contains("dark") ? "#0b0f19" : "#ffffff")
  );
}

export interface CanvasImageOptions {
  /** Fit the image to these nodes' bounds instead of the visible viewport. */
  nodes?: CanvasNode[];
  width?: number;
  height?: number;
  pixelRatio?: number;
  backgroundColor?: string;
}

/** Render the canvas to a PNG data URL (lazy html-to-image; used by PNG and PDF exports). */
export async function renderCanvasImage(
  element: HTMLElement,
  options: CanvasImageOptions = {},
  format: "png" | "svg" = "png",
): Promise<string> {
  const lib = await import("html-to-image");
  const background = options.backgroundColor ?? canvasBackground(element);
  const filter = (node: HTMLElement) => !EXCLUDE.some((cls) => node.classList?.contains(cls));
  const render = format === "png" ? lib.toPng : lib.toSvg;
  if (options.nodes?.length) {
    const { getNodesBounds, getViewportForBounds } = await import("@xyflow/react");
    const width = options.width ?? 1600;
    const height = options.height ?? 1000;
    const bounds = getNodesBounds(options.nodes);
    const vp = getViewportForBounds(bounds, width, height, 0.2, 2, 0.08);
    const viewport =
      (element.querySelector(".react-flow__viewport") as HTMLElement | null) ?? element;
    return render(viewport, {
      backgroundColor: background,
      width,
      height,
      pixelRatio: options.pixelRatio ?? 2,
      filter,
      style: {
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate(${vp.x}px, ${vp.y}px) scale(${vp.zoom})`,
      },
    });
  }
  return render(element, {
    backgroundColor: background,
    pixelRatio: options.pixelRatio ?? 2,
    filter,
  });
}

function clickDownload(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export async function exportCanvasPNG(
  element: HTMLElement,
  filename?: string,
  options: CanvasImageOptions = {},
): Promise<void> {
  clickDownload(
    await renderCanvasImage(element, options, "png"),
    filename ?? `threat-model-${Date.now()}.png`,
  );
}

export async function exportCanvasSVG(
  element: HTMLElement,
  filename?: string,
  options: CanvasImageOptions = {},
): Promise<void> {
  clickDownload(
    await renderCanvasImage(element, options, "svg"),
    filename ?? `threat-model-${Date.now()}.svg`,
  );
}

import { toPng } from "html-to-image";

function detectBackground(): string {
  const isDark = document.documentElement.classList.contains("dark");
  return isDark ? "#1e1e2e" : "#ffffff";
}

export async function exportCanvasPNG(element: HTMLElement, filename?: string): Promise<void> {
  try {
    const dataUrl = await toPng(element, {
      backgroundColor: detectBackground(),
      pixelRatio: 2,
      filter: (node) => {
        const exclude = ["react-flow__minimap", "react-flow__controls", "react-flow__panel"];
        return !exclude.some((cls) => node.classList?.contains(cls));
      },
    });
    const link = document.createElement("a");
    link.download = filename ?? `threat-model-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error("PNG export failed:", err);
    throw err;
  }
}

export async function exportCanvasSVG(element: HTMLElement, filename?: string): Promise<void> {
  const { toSvg } = await import("html-to-image");
  try {
    const dataUrl = await toSvg(element, {
      filter: (node) => {
        const exclude = ["react-flow__minimap", "react-flow__controls", "react-flow__panel"];
        return !exclude.some((cls) => node.classList?.contains(cls));
      },
    });
    const link = document.createElement("a");
    link.download = filename ?? `threat-model-${Date.now()}.svg`;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error("SVG export failed:", err);
    throw err;
  }
}

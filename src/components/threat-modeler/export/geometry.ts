import type { CanvasNode, Stride } from "../types";

export const DEFAULT_NODE_SIZE = { width: 220, height: 120 } as const;

/** Absolute canvas position of a node (sums parent offsets). */
export function absolutePosition(
  node: CanvasNode,
  byId: Map<string, CanvasNode>,
): { x: number; y: number } {
  let x = node.position?.x ?? 0;
  let y = node.position?.y ?? 0;
  const seen = new Set<string>([node.id]);
  let parentId = node.parentId;
  while (parentId && !seen.has(parentId)) {
    seen.add(parentId);
    const parent = byId.get(parentId);
    if (!parent) break;
    x += parent.position?.x ?? 0;
    y += parent.position?.y ?? 0;
    parentId = parent.parentId;
  }
  return { x, y };
}

export function nodeSize(node: CanvasNode): { width: number; height: number } {
  const style = (node.style ?? {}) as { width?: unknown; height?: unknown };
  const num = (v: unknown) =>
    typeof v === "number" ? v : typeof v === "string" ? parseFloat(v) : NaN;
  const width = node.measured?.width ?? node.width ?? num(style.width);
  const height = node.measured?.height ?? node.height ?? num(style.height);
  return {
    width: Number.isFinite(width) ? Number(width) : DEFAULT_NODE_SIZE.width,
    height: Number.isFinite(height) ? Number(height) : DEFAULT_NODE_SIZE.height,
  };
}

export const STRIDE_NAMES: Record<Stride, string> = {
  S: "Spoofing",
  T: "Tampering",
  R: "Repudiation",
  I: "Information disclosure",
  D: "Denial of service",
  E: "Elevation of privilege",
};

/**
 * Small pure helpers shared by the chart components.
 */

import { interpolateString } from "d3";
import { maxBand, severityLabel, type SeverityBand } from "@/lib/severity";

/** Ring "progress" tone: high → medium → info → low (green at 100 %). */
export function progressBand(pct: number): SeverityBand {
  if (pct >= 100) return "low";
  if (pct >= 66) return "info";
  if (pct >= 33) return "medium";
  return "high";
}

/** Percentage with at most one decimal, safe for total = 0. */
export function percent(done: number, total: number): number {
  return total > 0 ? Math.round((done / total) * 1000) / 10 : 0;
}

/** Truncate to `max` characters with an ellipsis (labels keep the full text in <title>). */
export function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, Math.max(1, max - 1))}…` : text;
}

/** Approximate rendered width of a label at `fontSize` px (no DOM; Geist ≈ 0.56em avg). */
export function approxTextWidth(text: string, fontSize = 12): number {
  return text.length * fontSize * 0.56;
}

/** CSS-safe id fragment. */
export function cssId(s: string): string {
  return s.replace(/[^a-zA-Z0-9_-]/g, "_");
}

/** Breadth-first walk over an adjacency map from `start` (inclusive). */
export function reachable(start: string, adj: Map<string, string[]>): Set<string> {
  const seen = new Set<string>([start]);
  const queue = [start];
  while (queue.length) {
    const n = queue.shift() as string;
    for (const m of adj.get(n) ?? []) {
      if (!seen.has(m)) {
        seen.add(m);
        queue.push(m);
      }
    }
  }
  return seen;
}

/** Up- and downstream closure of `id` over directed links. */
export function connectedClosure(
  id: string,
  links: readonly { source: string; target: string }[],
): Set<string> {
  const down = new Map<string, string[]>();
  const up = new Map<string, string[]>();
  for (const l of links) {
    (down.get(l.source) ?? down.set(l.source, []).get(l.source)!).push(l.target);
    (up.get(l.target) ?? up.set(l.target, []).get(l.target)!).push(l.source);
  }
  const a = reachable(id, down);
  for (const n of reachable(id, up)) a.add(n);
  return a;
}

/** Heatmap default aggregate for a collapsed column group: max band, summed value, max glyph. */
export function defaultAggregate(
  cells: readonly { value?: number; band?: SeverityBand; glyph?: number }[],
): { value?: number; band?: SeverityBand; glyph?: number; label?: string } {
  const present = cells.filter(Boolean);
  if (!present.length) return {};
  const value = present.reduce((n, c) => n + (c.value ?? 0), 0);
  const band = maxBand(present.map((c) => c.band ?? "none"));
  const glyph = Math.max(0, ...present.map((c) => c.glyph ?? 0));
  return { value, band, glyph, label: `${present.length} mapped, ${severityLabel(band)} max` };
}

/** CSS.escape with a fallback for environments without it (jsdom). */
export function cssEscape(s: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") return CSS.escape(s);
  return s.replace(/["\\]/g, "\\$&");
}

/**
 * Transition tween for `transform="translate(…)"` strings. d3's default transform interpolator
 * parses SVG transforms via `transform.baseVal` (missing in jsdom); a string tween is equivalent
 * for same-shaped translate() values and works everywhere.
 */
export function translateTween<D>(target: (d: D) => string) {
  return function (this: Element, d: D) {
    const to = target(d);
    return interpolateString(this.getAttribute("transform") ?? to, to);
  };
}

/**
 * Colour palettes for charts and categorical encodings (IMPROVEMENT_PLAN.md §9 colour rules).
 *
 * - KC palette (6)          → `KC_PALETTE.kc1` … `kc6`     (mirrors src/data/kc.ts)
 * - Framework palette        → `FRAMEWORK_PALETTE.asi | tm | cisco | aivss | aiuc1 | nist`
 * - NIST function palette    → `NIST_FUNCTION_PALETTE.GOVERN | MAP | MEASURE | MANAGE`
 * - MAESTRO layers (7)       → `MAESTRO_PALETTE[1]` … `[7]` (mirrors threat-modeler/types.ts)
 * - Severity ramp            → `SEVERITY_RAMP` (info → critical, ordinal)
 * - Sequential ramp          → `sequentialColor(t)` (0–1, primary hue, for counts / density)
 *
 * Every token is CSS-variable based (`token.css` = "hsl(var(--kc-1, 217 91% 60%))") so it follows
 * the theme with zero JS. For D3 interpolation or canvas use the resolved values from
 * `resolveToken(token)` / `useChartTheme()` (src/components/charts/useChartTheme.ts).
 *
 * React-free: safe to import from scripts, workers and data modules.
 */

import { KC, KC_ORDER, type KcId } from "@/data/kc";
import {
  SEVERITY_FALLBACKS,
  SEVERITY_VARS,
  severityColor,
  type Band,
  type SeverityBand,
} from "@/lib/severity";

export interface PaletteToken {
  /** Stable key, e.g. "kc1", "asi", "3". */
  key: string;
  label: string;
  /** CSS custom property name, e.g. "--kc-1". */
  cssVar: string;
  /** HSL components ("h s% l%") used as fallbacks when the var is undefined. */
  light: string;
  dark: string;
  /** Theme-aware CSS colour: `hsl(var(--x, <light>))`. */
  css: string;
}

const token = (key: string, label: string, cssVar: string, light: string, dark: string) =>
  ({ key, label, cssVar, light, dark, css: `hsl(var(${cssVar}, ${light}))` }) as PaletteToken;

/** CSS colour with alpha that still follows the theme: `withAlpha(KC_PALETTE.kc1, 0.2)`. */
export function withAlpha(t: PaletteToken, alpha: number): string {
  return `hsl(var(${t.cssVar}, ${t.light}) / ${Math.max(0, Math.min(1, alpha))})`;
}

// ─── KC (6) ────────────────────────────────────────────────────────────────

export const KC_PALETTE: Readonly<Record<KcId, PaletteToken>> = Object.fromEntries(
  KC_ORDER.map((id) => [
    id,
    token(id, KC[id].short, KC[id].colorVar, KC[id].colorHsl.light, KC[id].colorHsl.dark),
  ]),
) as Record<KcId, PaletteToken>;

/** Theme-aware CSS colour for a KC id/code ("kc3", "KC3", "kc3.1"); muted for unknown ids. */
export function kcColor(idOrCode: string | null | undefined, alpha?: number): string {
  const m = String(idOrCode ?? "").match(/kc\s*([1-6])/i);
  if (!m)
    return alpha === undefined
      ? "hsl(var(--muted-foreground))"
      : `hsl(var(--muted-foreground) / ${alpha})`;
  const t = KC_PALETTE[`kc${m[1]}` as KcId];
  return alpha === undefined ? t.css : withAlpha(t, alpha);
}

// ─── Frameworks ────────────────────────────────────────────────────────────

export type FrameworkId = "asi" | "tm" | "cisco" | "aivss" | "aiuc1" | "nist";

/**
 * The five framework families of the cross-framework views (OWASP Agentic Top 10, OWASP Threats &
 * Mitigations, Cisco AI taxonomy, AIVSS/AIUC-1, NIST AI RMF). AIVSS and AIUC-1 share a family but
 * get distinct hues (amber / emerald) because the interconnection map shows them as two nodes.
 */
export const FRAMEWORK_PALETTE: Readonly<Record<FrameworkId, PaletteToken>> = {
  asi: token("asi", "OWASP Agentic Top 10", "--fw-asi", "350 89% 60%", "351 95% 71%"),
  tm: token("tm", "OWASP Threats & Mitigations", "--fw-tm", "258 90% 66%", "255 92% 76%"),
  cisco: token("cisco", "Cisco AI Taxonomy", "--fw-cisco", "189 94% 43%", "188 86% 53%"),
  aivss: token("aivss", "OWASP AIVSS", "--fw-aivss", "38 92% 50%", "43 96% 56%"),
  aiuc1: token("aiuc1", "AIUC-1", "--fw-aiuc1", "160 84% 39%", "158 64% 52%"),
  nist: token("nist", "NIST AI RMF", "--fw-nist", "221 83% 53%", "213 94% 68%"),
};

export const FRAMEWORK_ORDER: readonly FrameworkId[] = [
  "asi",
  "tm",
  "cisco",
  "aivss",
  "aiuc1",
  "nist",
] as const;

/** Accepts common aliases: "agentic", "owasp-agentic", "threats", "aiuc-1", "nist-rmf"… */
export function frameworkToken(id: string): PaletteToken | undefined {
  const k = id.toLowerCase().replace(/[^a-z0-9]/g, "");
  const alias: Record<string, FrameworkId> = {
    asi: "asi",
    agentic: "asi",
    owaspagentic: "asi",
    owaspagentictop10: "asi",
    tm: "tm",
    threats: "tm",
    threatmodel: "tm",
    owasptm: "tm",
    cisco: "cisco",
    aivss: "aivss",
    aiuc1: "aiuc1",
    nist: "nist",
    nistrmf: "nist",
    nistairmf: "nist",
  };
  const fw = alias[k];
  return fw ? FRAMEWORK_PALETTE[fw] : undefined;
}

// ─── NIST AI RMF functions (mirrors NISTMapping.tsx data colours) ─────────

export type NistFunction = "GOVERN" | "MAP" | "MEASURE" | "MANAGE";
export const NIST_FUNCTION_PALETTE: Readonly<Record<NistFunction, PaletteToken>> = {
  GOVERN: token("GOVERN", "Govern", "--nist-govern", "217 91% 60%", "213 94% 68%"),
  MAP: token("MAP", "Map", "--nist-map", "160 84% 39%", "158 64% 52%"),
  MEASURE: token("MEASURE", "Measure", "--nist-measure", "38 92% 50%", "43 96% 56%"),
  MANAGE: token("MANAGE", "Manage", "--nist-manage", "0 84% 60%", "0 91% 71%"),
};

// ─── MAESTRO layers (mirrors MAESTRO_LAYER_COLORS in threat-modeler/types.ts) ─

export type MaestroLayerNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const MAESTRO_PALETTE: Readonly<Record<MaestroLayerNumber, PaletteToken>> = {
  1: token("1", "Foundation Models", "--maestro-1", "217 91% 60%", "213 94% 68%"), // #3b82f6
  2: token("2", "Data Operations", "--maestro-2", "271 91% 65%", "270 95% 75%"), // #a855f7
  3: token("3", "Agent Frameworks", "--maestro-3", "142 71% 45%", "142 69% 58%"), // #22c55e
  4: token("4", "Deployment Infrastructure", "--maestro-4", "25 95% 53%", "27 96% 61%"), // #f97316
  5: token("5", "Evaluation & Observability", "--maestro-5", "189 94% 43%", "188 86% 53%"), // #06b6d4
  6: token("6", "Security & Compliance", "--maestro-6", "0 84% 60%", "0 91% 71%"), // #ef4444
  7: token("7", "Agent Ecosystem", "--maestro-7", "45 93% 47%", "48 96% 53%"), // #eab308
};

export const MAESTRO_ORDER: readonly MaestroLayerNumber[] = [1, 2, 3, 4, 5, 6, 7] as const;

export function maestroColor(layer: number, alpha?: number): string {
  const t = MAESTRO_PALETTE[layer as MaestroLayerNumber];
  if (!t) return "hsl(var(--muted-foreground))";
  return alpha === undefined ? t.css : withAlpha(t, alpha);
}

// ─── Severity ramp (ordinal) & sequential ramp (continuous) ────────────────

const sevToken = (band: SeverityBand): PaletteToken => ({
  key: band,
  label: band,
  cssVar: SEVERITY_VARS[band].base,
  light: SEVERITY_FALLBACKS[band].base.light,
  dark: SEVERITY_FALLBACKS[band].base.dark,
  css: severityColor(band),
});

/** Ordinal ramp from least to most severe: info, low, medium, high, critical. */
export const SEVERITY_RAMP: readonly PaletteToken[] = (
  ["info", "low", "medium", "high", "critical"] as Band[]
).map(sevToken);

export const SEVERITY_PALETTE: Readonly<Record<SeverityBand, PaletteToken>> = {
  critical: sevToken("critical"),
  high: sevToken("high"),
  medium: sevToken("medium"),
  low: sevToken("low"),
  info: sevToken("info"),
  none: sevToken("none"),
};

/** 5-step sequential ramp on the primary hue (for densities / mapping counts). */
export const SEQUENTIAL_STEPS = [0.1, 0.25, 0.45, 0.65, 0.88] as const;

/**
 * Sequential fill for a normalised value t ∈ [0, 1] (primary hue, alpha ramp). `t <= 0` returns
 * the muted surface so "zero" never looks like data. Pass `steps` to quantise (default 5).
 */
export function sequentialColor(t: number, steps: number = SEQUENTIAL_STEPS.length): string {
  if (!Number.isFinite(t) || t <= 0) return "hsl(var(--muted))";
  const clamped = Math.min(1, t);
  const i = Math.min(steps - 1, Math.floor(clamped * steps - 1e-9));
  const alpha =
    steps === SEQUENTIAL_STEPS.length
      ? SEQUENTIAL_STEPS[Math.max(0, i)]
      : 0.1 + (0.78 * Math.max(0, i)) / Math.max(1, steps - 1);
  return `hsl(var(--primary) / ${alpha})`;
}

/** Whether text on `sequentialColor(t)` should switch to the primary-foreground colour. */
export function sequentialNeedsInverseText(t: number): boolean {
  return t > 0.6;
}

// ─── Resolving CSS vars to concrete colours (D3 interpolation, canvas, export) ─

export function isDarkTheme(): boolean {
  return typeof document !== "undefined" && document.documentElement.classList.contains("dark");
}

/**
 * Read a CSS custom property from <html> and return a usable colour string.
 * "220 70% 50%" (shadcn HSL components) → "hsl(220 70% 50%)"; "#fff" / "rgb(…)" pass through.
 * Returns `fallback` (wrapped the same way) when the var is missing or there is no DOM.
 */
export function resolveCssVar(name: string, fallback = ""): string {
  let raw = "";
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    try {
      raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    } catch {
      raw = "";
    }
  }
  return toColor(raw || fallback);
}

function toColor(v: string): string {
  const s = v.trim();
  if (!s) return "";
  if (/^(#|rgb|hsl|oklch|oklab|lab|lch|color\(|var\()/i.test(s)) return s;
  // shadcn style "h s% l%" or "h s% l% / a"
  if (/^-?[\d.]+(deg)?\s+[\d.]+%\s+[\d.]+%(\s*\/\s*[\d.]+%?)?$/.test(s)) return `hsl(${s})`;
  return s;
}

/** Resolve a palette token to a concrete colour for the current theme. */
export function resolveToken(t: PaletteToken, dark = isDarkTheme()): string {
  return resolveCssVar(t.cssVar, dark ? t.dark : t.light);
}

/** Resolve a band's base (or fg) colour to a concrete colour for the current theme. */
export function resolveSeverity(
  band: SeverityBand,
  variant: "base" | "fg" = "base",
  dark = isDarkTheme(),
): string {
  const fb = SEVERITY_FALLBACKS[band] ?? SEVERITY_FALLBACKS.none;
  return resolveCssVar(SEVERITY_VARS[band][variant], dark ? fb[variant].dark : fb[variant].light);
}

/**
 * Severity system — the single source of truth for every severity / level / priority scale
 * used on the site (IMPROVEMENT_PLAN.md P1-03).
 *
 * Every scale maps onto one `Band`, and every band maps onto the `--security-*` CSS variables
 * (src/index.css) so badges, matrix cells, chart series and modeler nodes all agree in both themes.
 *
 * Usage:
 *   const band = riskBand(threat.riskScore);          // "critical"
 *   const t = severityToken(band);                     // Tailwind classes
 *   <span className={cn(t.bg, t.fg, t.border, "border")}>{severityLabel(band)}</span>
 *   d3.select(el).attr("fill", severityColor(band));   // "hsl(var(--security-critical))"
 *
 * Never encode severity by colour alone — pair it with `severityLabel()` / `severityAbbr()` text
 * or a `severityShape()` glyph.
 */

export type Band = "critical" | "high" | "medium" | "low" | "info";
/** `Band` plus "none" (e.g. an AIVSS score of 0, or "no data"). */
export type SeverityBand = Band | "none";

/** Bands from most to least severe. */
export const BANDS: readonly Band[] = ["critical", "high", "medium", "low", "info"] as const;
export const SEVERITY_BANDS: readonly SeverityBand[] = [...BANDS, "none"] as const;

/** Sort rank: lower = more severe. Use with `compareBands` or `sort((a,b) => severityOrder[a]-severityOrder[b])`. */
export const severityOrder: Readonly<Record<SeverityBand, number>> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
  none: 5,
};

/** Comparator: most severe first. */
export function compareBands(a: SeverityBand, b: SeverityBand): number {
  return severityOrder[a] - severityOrder[b];
}

/** The most severe band of a list ("none" for an empty list). */
export function maxBand(bands: Iterable<SeverityBand>): SeverityBand {
  let best: SeverityBand = "none";
  for (const b of bands) if (severityOrder[b] < severityOrder[best]) best = b;
  return best;
}

export function isBand(value: unknown): value is SeverityBand {
  return typeof value === "string" && value in severityOrder;
}

// ─── Scale → band mappers ──────────────────────────────────────────────────

/** Threat / control risk score 1–10: ≥8 critical, ≥6 high, ≥4 medium, else low. */
export function riskBand(score: number | null | undefined): Band {
  const s = Number(score);
  if (!Number.isFinite(s)) return "low";
  if (s >= 8) return "critical";
  if (s >= 6) return "high";
  if (s >= 4) return "medium";
  return "low";
}

/** Threat impact level / attack-vector severity ("high" | "medium" | "low", any case). */
export function impactBand(level: string | null | undefined): Band {
  switch (String(level ?? "").toLowerCase()) {
    case "critical":
      return "critical";
    case "high":
      return "high";
    case "medium":
    case "moderate":
      return "medium";
    default:
      return "low";
  }
}

/** AISVS verification level 1–3 (L1 baseline → L3 highest assurance). */
export function aisvsLevelBand(level: 1 | 2 | 3 | number): Band {
  if (level >= 3) return "high";
  if (level === 2) return "medium";
  return "low";
}

/** AIVSS score 0–10: ≥9 critical, ≥7 high, ≥4 medium, >0 low, 0 none. */
export function aivssBand(score: number | null | undefined): SeverityBand {
  const s = Number(score);
  if (!Number.isFinite(s) || s <= 0) return "none";
  if (s >= 9) return "critical";
  if (s >= 7) return "high";
  if (s >= 4) return "medium";
  return "low";
}

/**
 * AIUC-1 evidence confidence ("High" | "Medium" | "Low"). High confidence is reassuring (green,
 * "low" band); low confidence is a caution ("high" band).
 */
export function confidenceBand(confidence: string | null | undefined): Band {
  switch (String(confidence ?? "").toLowerCase()) {
    case "high":
      return "low";
    case "medium":
      return "medium";
    case "low":
      return "high";
    default:
      return "info";
  }
}

/** Checklist priority ("critical" | "high" | "medium" | "low"). */
export function priorityBand(priority: string | null | undefined): Band {
  const p = String(priority ?? "").toLowerCase();
  return p === "critical" || p === "high" || p === "medium" || p === "low" ? p : "info";
}

/** Parse any severity-ish string ("Critical", "HIGH", "info", "none"…) — unknown → "none". */
export function parseBand(value: string | null | undefined): SeverityBand {
  const v = String(value ?? "")
    .trim()
    .toLowerCase();
  if (v === "moderate") return "medium";
  if (v === "informational") return "info";
  return isBand(v) ? v : "none";
}

// ─── Labels & glyphs (non-colour encodings) ────────────────────────────────

const LABELS: Record<SeverityBand, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  info: "Info",
  none: "None",
};

export function severityLabel(band: SeverityBand): string {
  return LABELS[band] ?? LABELS.none;
}

/** One-letter abbreviation for dense cells: C / H / M / L / I / – */
export function severityAbbr(band: SeverityBand): string {
  return band === "none" ? "–" : (LABELS[band]?.[0] ?? "–");
}

export type SeverityShape = "diamond" | "triangle" | "square" | "circle" | "dot" | "dash";

/** Shape glyph per band, for charts that must not rely on colour alone. */
export function severityShape(band: SeverityBand): SeverityShape {
  return (
    {
      critical: "diamond",
      high: "triangle",
      medium: "square",
      low: "circle",
      info: "dot",
      none: "dash",
    } as const
  )[band];
}

// ─── Colour tokens ─────────────────────────────────────────────────────────

/**
 * CSS custom-property names per band. `base` is the existing `--security-*` var (index.css:79-83);
 * `fg` is a darker (light mode) / lighter (dark mode) text variant with ≥ 4.5:1 contrast on a
 * 12–20 % tint of `base`. Until the shell adds `--security-*-fg`, the fallbacks below apply.
 */
export const SEVERITY_VARS: Readonly<Record<SeverityBand, { base: string; fg: string }>> = {
  critical: { base: "--security-critical", fg: "--security-critical-fg" },
  high: { base: "--security-high", fg: "--security-high-fg" },
  medium: { base: "--security-medium", fg: "--security-medium-fg" },
  low: { base: "--security-low", fg: "--security-low-fg" },
  info: { base: "--security-info", fg: "--security-info-fg" },
  none: { base: "--muted-foreground", fg: "--muted-foreground" },
};

/** HSL component fallbacks (used when a var is missing, e.g. in tests or before index.css lands). */
export const SEVERITY_FALLBACKS: Readonly<
  Record<
    SeverityBand,
    { base: { light: string; dark: string }; fg: { light: string; dark: string } }
  >
> = {
  critical: {
    base: { light: "0 84% 60%", dark: "0 84% 65%" },
    fg: { light: "0 74% 40%", dark: "0 94% 82%" },
  },
  high: {
    base: { light: "25 95% 53%", dark: "25 95% 58%" },
    fg: { light: "20 91% 33%", dark: "31 97% 72%" },
  },
  medium: {
    base: { light: "38 92% 50%", dark: "38 92% 55%" },
    fg: { light: "32 95% 29%", dark: "46 97% 65%" },
  },
  low: {
    base: { light: "142 71% 45%", dark: "142 71% 50%" },
    fg: { light: "142 72% 25%", dark: "142 77% 73%" },
  },
  info: {
    base: { light: "199 89% 48%", dark: "199 89% 53%" },
    fg: { light: "201 96% 30%", dark: "199 95% 74%" },
  },
  none: {
    base: { light: "240 4% 46%", dark: "240 5% 70%" },
    fg: { light: "240 4% 46%", dark: "240 5% 70%" },
  },
};

export interface SeverityToken {
  /** Text colour (contrast-safe on `bg`, card and background in both themes). */
  fg: string;
  /** Soft tinted background for badges / cells (base at 12 % alpha). */
  bg: string;
  /** Border colour (base at 40 % alpha). */
  border: string;
  /** Solid background for bars, dots and legend swatches. */
  chart: string;
  /** Focus / selection ring colour. */
  ring: string;
  /** SVG fill / stroke utilities. */
  fill: string;
  stroke: string;
  /** Solid badge: solid base background + near-black text (≥ 4.5:1 for every band). */
  solid: string;
  /** Convenience: `bg fg border` joined — ready for a bordered badge. */
  badge: string;
}

/*
 * Tailwind needs literal class strings to generate CSS, so every token is spelled out below.
 * `fg` uses `var(--security-x-fg, <fallback>)` with a light fallback and a `dark:` fallback, so it
 * is correct in both themes whether or not the `-fg` vars exist yet.
 */
const TOKENS: Record<SeverityBand, SeverityToken> = {
  critical: {
    fg: "text-[hsl(var(--security-critical-fg,0_74%_40%))] dark:text-[hsl(var(--security-critical-fg,0_94%_82%))]",
    bg: "bg-[hsl(var(--security-critical)/0.12)]",
    border: "border-[hsl(var(--security-critical)/0.4)]",
    chart: "bg-[hsl(var(--security-critical))]",
    ring: "ring-[hsl(var(--security-critical))]",
    fill: "fill-[hsl(var(--security-critical))]",
    stroke: "stroke-[hsl(var(--security-critical))]",
    solid: "bg-[hsl(var(--security-critical))] text-[hsl(240_10%_8%)]",
    badge:
      "bg-[hsl(var(--security-critical)/0.12)] text-[hsl(var(--security-critical-fg,0_74%_40%))] dark:text-[hsl(var(--security-critical-fg,0_94%_82%))] border-[hsl(var(--security-critical)/0.4)]",
  },
  high: {
    fg: "text-[hsl(var(--security-high-fg,20_91%_33%))] dark:text-[hsl(var(--security-high-fg,31_97%_72%))]",
    bg: "bg-[hsl(var(--security-high)/0.12)]",
    border: "border-[hsl(var(--security-high)/0.4)]",
    chart: "bg-[hsl(var(--security-high))]",
    ring: "ring-[hsl(var(--security-high))]",
    fill: "fill-[hsl(var(--security-high))]",
    stroke: "stroke-[hsl(var(--security-high))]",
    solid: "bg-[hsl(var(--security-high))] text-[hsl(240_10%_8%)]",
    badge:
      "bg-[hsl(var(--security-high)/0.12)] text-[hsl(var(--security-high-fg,20_91%_33%))] dark:text-[hsl(var(--security-high-fg,31_97%_72%))] border-[hsl(var(--security-high)/0.4)]",
  },
  medium: {
    fg: "text-[hsl(var(--security-medium-fg,32_95%_29%))] dark:text-[hsl(var(--security-medium-fg,46_97%_65%))]",
    bg: "bg-[hsl(var(--security-medium)/0.12)]",
    border: "border-[hsl(var(--security-medium)/0.4)]",
    chart: "bg-[hsl(var(--security-medium))]",
    ring: "ring-[hsl(var(--security-medium))]",
    fill: "fill-[hsl(var(--security-medium))]",
    stroke: "stroke-[hsl(var(--security-medium))]",
    solid: "bg-[hsl(var(--security-medium))] text-[hsl(240_10%_8%)]",
    badge:
      "bg-[hsl(var(--security-medium)/0.12)] text-[hsl(var(--security-medium-fg,32_95%_29%))] dark:text-[hsl(var(--security-medium-fg,46_97%_65%))] border-[hsl(var(--security-medium)/0.4)]",
  },
  low: {
    fg: "text-[hsl(var(--security-low-fg,142_72%_25%))] dark:text-[hsl(var(--security-low-fg,142_77%_73%))]",
    bg: "bg-[hsl(var(--security-low)/0.12)]",
    border: "border-[hsl(var(--security-low)/0.4)]",
    chart: "bg-[hsl(var(--security-low))]",
    ring: "ring-[hsl(var(--security-low))]",
    fill: "fill-[hsl(var(--security-low))]",
    stroke: "stroke-[hsl(var(--security-low))]",
    solid: "bg-[hsl(var(--security-low))] text-[hsl(240_10%_8%)]",
    badge:
      "bg-[hsl(var(--security-low)/0.12)] text-[hsl(var(--security-low-fg,142_72%_25%))] dark:text-[hsl(var(--security-low-fg,142_77%_73%))] border-[hsl(var(--security-low)/0.4)]",
  },
  info: {
    fg: "text-[hsl(var(--security-info-fg,201_96%_30%))] dark:text-[hsl(var(--security-info-fg,199_95%_74%))]",
    bg: "bg-[hsl(var(--security-info)/0.12)]",
    border: "border-[hsl(var(--security-info)/0.4)]",
    chart: "bg-[hsl(var(--security-info))]",
    ring: "ring-[hsl(var(--security-info))]",
    fill: "fill-[hsl(var(--security-info))]",
    stroke: "stroke-[hsl(var(--security-info))]",
    solid: "bg-[hsl(var(--security-info))] text-[hsl(240_10%_8%)]",
    badge:
      "bg-[hsl(var(--security-info)/0.12)] text-[hsl(var(--security-info-fg,201_96%_30%))] dark:text-[hsl(var(--security-info-fg,199_95%_74%))] border-[hsl(var(--security-info)/0.4)]",
  },
  none: {
    fg: "text-muted-foreground",
    bg: "bg-muted",
    border: "border-border",
    chart: "bg-muted-foreground/40",
    ring: "ring-ring",
    fill: "fill-muted-foreground/40",
    stroke: "stroke-muted-foreground",
    solid: "bg-muted text-foreground",
    badge: "bg-muted text-muted-foreground border-border",
  },
};

/** Tailwind class strings for a band (see `SeverityToken`). */
export function severityToken(band: SeverityBand): SeverityToken {
  return TOKENS[band] ?? TOKENS.none;
}

/**
 * A CSS colour string for D3 / SVG / inline styles that follows the theme automatically:
 * `severityColor("high")` → `"hsl(var(--security-high, 25 95% 53%))"`.
 * `variant: "fg"` gives the contrast-safe text colour; `alpha` (0–1) adds transparency.
 * For D3 colour *interpolation* use the resolved values from `useChartTheme()` instead.
 */
export function severityColor(
  band: SeverityBand,
  variant: "base" | "fg" = "base",
  alpha?: number,
): string {
  const vars = SEVERITY_VARS[band] ?? SEVERITY_VARS.none;
  const fb = (SEVERITY_FALLBACKS[band] ?? SEVERITY_FALLBACKS.none)[variant].light;
  const a = alpha === undefined ? "" : ` / ${Math.max(0, Math.min(1, alpha))}`;
  return `hsl(var(${vars[variant]}, ${fb})${a})`;
}

/** The CSS variable name for a band (e.g. "--security-high"). */
export function severityCssVar(band: SeverityBand, variant: "base" | "fg" = "base"): string {
  return (SEVERITY_VARS[band] ?? SEVERITY_VARS.none)[variant];
}

/** "5 threats (2 critical, 1 high)" — text equivalent for severity count summaries. */
export function summarizeBandCounts(
  counts: Partial<Record<SeverityBand, number>>,
  noun = "item",
  pluralNoun = `${noun}s`,
): string {
  const total = SEVERITY_BANDS.reduce((n, b) => n + (counts[b] ?? 0), 0);
  const parts = SEVERITY_BANDS.filter((b) => (counts[b] ?? 0) > 0 && b !== "none").map(
    (b) => `${counts[b]} ${severityLabel(b).toLowerCase()}`,
  );
  const head = `${total} ${total === 1 ? noun : pluralNoun}`;
  return parts.length ? `${head} (${parts.join(", ")})` : head;
}

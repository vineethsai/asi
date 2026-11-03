/**
 * useChartTheme — resolved (concrete) colours for D3 / canvas / recharts, re-read reactively when
 * the theme changes (MutationObserver on <html class|style|data-theme>). Use this when a colour
 * must be interpolated or passed to a library that cannot read CSS variables; otherwise prefer
 * the CSS-var strings from src/lib/palette.ts and src/lib/severity.ts (zero JS on theme change).
 *
 *   const theme = useChartTheme();
 *   sel.attr("fill", theme.severity.high).attr("stroke", theme.border);
 *   <PolarGrid stroke={theme.grid} />
 *
 * Returns a referentially stable object until the theme actually changes.
 */

import { useEffect, useState } from "react";
import {
  FRAMEWORK_PALETTE,
  KC_PALETTE,
  MAESTRO_PALETTE,
  NIST_FUNCTION_PALETTE,
  isDarkTheme,
  resolveCssVar,
  resolveSeverity,
  resolveToken,
  type FrameworkId,
  type MaestroLayerNumber,
  type NistFunction,
} from "@/lib/palette";
import { SEVERITY_BANDS, type SeverityBand } from "@/lib/severity";
import type { KcId } from "@/data/kc";

export interface ChartTheme {
  isDark: boolean;
  background: string;
  card: string;
  foreground: string;
  mutedForeground: string;
  muted: string;
  border: string;
  grid: string;
  primary: string;
  primaryForeground: string;
  ring: string;
  /** Severity base colours (fills, strokes). */
  severity: Record<SeverityBand, string>;
  /** Severity text colours (contrast-safe labels). */
  severityFg: Record<SeverityBand, string>;
  kc: Record<KcId, string>;
  framework: Record<FrameworkId, string>;
  nist: Record<NistFunction, string>;
  maestro: Record<MaestroLayerNumber, string>;
  /** Font stack for SVG text. */
  fontFamily: string;
  monoFamily: string;
}

const LIGHT = {
  background: "240 10% 98%",
  card: "0 0% 100%",
  foreground: "240 10% 8%",
  mutedForeground: "240 4% 46%",
  muted: "240 5% 96%",
  border: "240 6% 85%",
  primary: "220 70% 50%",
  primaryForeground: "0 0% 100%",
};
const DARK = {
  background: "240 7% 8%",
  card: "240 6% 10%",
  foreground: "240 5% 92%",
  mutedForeground: "240 5% 70%",
  muted: "240 4% 18%",
  border: "240 4% 20%",
  primary: "220 70% 55%",
  primaryForeground: "0 0% 100%",
};

const mapObj = <K extends string | number, V>(obj: Record<K, V>, fn: (v: V, k: K) => string) =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fn(v as V, k as K)])) as Record<
    K,
    string
  >;

/** Read the current theme synchronously (also usable outside React, e.g. in export code). */
export function readChartTheme(): ChartTheme {
  const dark = isDarkTheme();
  const fb = dark ? DARK : LIGHT;
  const v = (name: string, fallback: string) => resolveCssVar(name, fallback);
  const border = v("--border", fb.border);
  return {
    isDark: dark,
    background: v("--background", fb.background),
    card: v("--card", fb.card),
    foreground: v("--foreground", fb.foreground),
    mutedForeground: v("--muted-foreground", fb.mutedForeground),
    muted: v("--muted", fb.muted),
    border,
    grid: border,
    primary: v("--primary", fb.primary),
    primaryForeground: v("--primary-foreground", fb.primaryForeground),
    ring: v("--ring", fb.primary),
    severity: Object.fromEntries(
      SEVERITY_BANDS.map((b) => [b, resolveSeverity(b, "base", dark)]),
    ) as Record<SeverityBand, string>,
    severityFg: Object.fromEntries(
      SEVERITY_BANDS.map((b) => [b, resolveSeverity(b, "fg", dark)]),
    ) as Record<SeverityBand, string>,
    kc: mapObj(KC_PALETTE, (t) => resolveToken(t, dark)),
    framework: mapObj(FRAMEWORK_PALETTE, (t) => resolveToken(t, dark)),
    nist: mapObj(NIST_FUNCTION_PALETTE, (t) => resolveToken(t, dark)),
    maestro: mapObj(MAESTRO_PALETTE, (t) => resolveToken(t, dark)),
    fontFamily: '"Geist Sans", system-ui, -apple-system, sans-serif',
    monoFamily: '"Geist Mono", ui-monospace, SFMono-Regular, monospace',
  };
}

const sameTheme = (a: ChartTheme, b: ChartTheme) => JSON.stringify(a) === JSON.stringify(b);

export function useChartTheme(): ChartTheme {
  const [theme, setTheme] = useState<ChartTheme>(readChartTheme);
  useEffect(() => {
    if (typeof document === "undefined") return;
    const update = () => {
      const next = readChartTheme();
      setTheme((prev) => (sameTheme(prev, next) ? prev : next));
    };
    update();
    if (typeof MutationObserver === "undefined") return;
    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style", "data-theme"],
    });
    return () => mo.disconnect();
  }, []);
  return theme;
}

export default useChartTheme;

/**
 * "Threat of the day" (IMPROVEMENT_PLAN 6.1 item 2, P4-04).
 *
 * Deterministic by UTC calendar date: every visitor sees the same threat on the same day, and
 * the catalog is walked in catalog order (T1, T2, …), so each threat is featured once per
 * cycle of `FEATURED_THREATS.length` days. Used by the Home card and the `/threats/today`
 * redirect.
 *
 *   featuredThreatFor(new Date()).id   // "t7"
 */

import { threatsData, type Threat } from "@/components/components/securityData";

const MS_PER_DAY = 86_400_000;

/** Threats in catalog order (displayOrder, then numeric code). */
export const FEATURED_THREATS: readonly Threat[] = Object.values(threatsData)
  .filter((t) => t.status !== "deprecated")
  .sort((a, b) => {
    if (a.displayOrder != null && b.displayOrder != null && a.displayOrder !== b.displayOrder) {
      return a.displayOrder - b.displayOrder;
    }
    const num = (t: Threat) => Number(t.code.replace(/\D/g, "")) || 0;
    return num(a) - num(b) || a.id.localeCompare(b.id);
  });

/** Days since 1970-01-01 for the UTC calendar date of `date` (time of day ignored). */
export function utcDayNumber(date: Date): number {
  return Math.floor(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / MS_PER_DAY,
  );
}

/** Index into a list of `count` items for the UTC date of `date` (0 when `count` < 1). */
export function featuredIndex(date: Date, count: number): number {
  if (!Number.isFinite(count) || count < 1) return 0;
  const day = utcDayNumber(date);
  return ((day % count) + count) % count;
}

/** The featured threat for the UTC date of `date`. */
export function featuredThreatFor(date: Date): Threat {
  return FEATURED_THREATS[featuredIndex(date, FEATURED_THREATS.length)];
}

/** Path of today's threat (for links and the `/threats/today` redirect). */
export function featuredThreatPath(date: Date = new Date()): string {
  return `/threats/${featuredThreatFor(date).id}`;
}

import { describe, expect, it } from "vitest";
import {
  FEATURED_THREATS,
  featuredIndex,
  featuredThreatFor,
  featuredThreatPath,
  utcDayNumber,
} from "@/lib/featured";
import { threatsData } from "@/components/components/securityData";

describe("featured threat of the day", () => {
  it("rotates through every non-deprecated threat", () => {
    expect(FEATURED_THREATS.length).toBeGreaterThan(0);
    const ids = new Set(FEATURED_THREATS.map((t) => t.id));
    expect(ids.size).toBe(FEATURED_THREATS.length);
    FEATURED_THREATS.forEach((t) => expect(threatsData[t.id]).toBeDefined());
  });

  it("is deterministic within a UTC day, whatever the time", () => {
    const a = featuredThreatFor(new Date("2026-11-03T00:00:00Z"));
    const b = featuredThreatFor(new Date("2026-11-03T12:34:56Z"));
    const c = featuredThreatFor(new Date("2026-11-03T23:59:59.999Z"));
    expect(b.id).toBe(a.id);
    expect(c.id).toBe(a.id);
    // Same instant, same answer on repeated calls.
    expect(featuredThreatFor(new Date("2026-11-03T08:00:00Z")).id).toBe(a.id);
  });

  it("moves to the next threat on consecutive days and wraps around", () => {
    const n = FEATURED_THREATS.length;
    const start = new Date("2026-01-01T09:00:00Z");
    const seen: string[] = [];
    for (let d = 0; d < n; d++) {
      const date = new Date(start.getTime() + d * 86_400_000);
      seen.push(featuredThreatFor(date).id);
    }
    expect(new Set(seen).size).toBe(n);
    const wrapped = featuredThreatFor(new Date(start.getTime() + n * 86_400_000));
    expect(wrapped.id).toBe(seen[0]);
    if (n > 1) expect(seen[1]).not.toBe(seen[0]);
  });

  it("computes UTC day numbers and a safe modulo", () => {
    expect(utcDayNumber(new Date("1970-01-01T23:00:00Z"))).toBe(0);
    expect(utcDayNumber(new Date("1970-01-02T00:00:00Z"))).toBe(1);
    expect(utcDayNumber(new Date("1969-12-31T12:00:00Z"))).toBe(-1);
    expect(featuredIndex(new Date("1970-01-02T00:00:00Z"), 5)).toBe(1);
    // Pre-epoch dates still give an index in range.
    const idx = featuredIndex(new Date("1900-06-15T00:00:00Z"), 7);
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(idx).toBeLessThan(7);
    expect(featuredIndex(new Date(), 0)).toBe(0);
  });

  it("builds the threat detail path", () => {
    const date = new Date("2026-11-03T10:00:00Z");
    expect(featuredThreatPath(date)).toBe(`/threats/${featuredThreatFor(date).id}`);
  });
});

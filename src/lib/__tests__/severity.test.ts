import { describe, expect, it } from "vitest";
import {
  BANDS,
  aisvsLevelBand,
  aivssBand,
  compareBands,
  confidenceBand,
  impactBand,
  maxBand,
  parseBand,
  priorityBand,
  riskBand,
  severityAbbr,
  severityColor,
  severityLabel,
  severityOrder,
  severityToken,
  summarizeBandCounts,
} from "@/lib/severity";

describe("severity mappers", () => {
  it("riskBand uses ≥8 / ≥6 / ≥4 thresholds", () => {
    expect([10, 8, 7.9, 6, 5, 4, 3.9, 1].map(riskBand)).toEqual([
      "critical",
      "critical",
      "high",
      "high",
      "medium",
      "medium",
      "low",
      "low",
    ]);
    expect(riskBand(undefined)).toBe("low");
  });

  it("aivssBand uses ≥9 / ≥7 / ≥4 / >0 / 0", () => {
    expect([10, 9, 8.9, 7, 6.9, 4, 3.9, 0.1, 0].map(aivssBand)).toEqual([
      "critical",
      "critical",
      "high",
      "high",
      "medium",
      "medium",
      "low",
      "low",
      "none",
    ]);
  });

  it("maps the categorical scales", () => {
    expect(impactBand("High")).toBe("high");
    expect(impactBand("medium")).toBe("medium");
    expect(impactBand("low")).toBe("low");
    expect([1, 2, 3].map(aisvsLevelBand)).toEqual(["low", "medium", "high"]);
    expect(confidenceBand("High")).toBe("low");
    expect(confidenceBand("Low")).toBe("high");
    expect(priorityBand("critical")).toBe("critical");
    expect(priorityBand("weird")).toBe("info");
    expect(parseBand("CRITICAL")).toBe("critical");
    expect(parseBand("moderate")).toBe("medium");
    expect(parseBand("??")).toBe("none");
  });

  it("orders, labels and summarises", () => {
    const sorted = (["low", "critical", "none", "medium"] as const).slice().sort(compareBands);
    expect(sorted).toEqual(["critical", "medium", "low", "none"]);
    expect(maxBand(["low", "high", "medium"])).toBe("high");
    expect(maxBand([])).toBe("none");
    expect(severityOrder.critical).toBeLessThan(severityOrder.info);
    expect(severityLabel("high")).toBe("High");
    expect(severityAbbr("critical")).toBe("C");
    expect(severityAbbr("none")).toBe("–");
    expect(summarizeBandCounts({ critical: 2, high: 1, low: 2 }, "threat")).toBe(
      "5 threats (2 critical, 1 high, 2 low)",
    );
    expect(summarizeBandCounts({}, "threat")).toBe("0 threats");
  });
});

describe("severity tokens", () => {
  it("returns CSS-var based Tailwind classes for every band", () => {
    for (const b of BANDS) {
      const t = severityToken(b);
      expect(t.bg).toContain(`--security-${b}`);
      expect(t.fg).toContain(`--security-${b}-fg`);
      expect(t.fg).toContain("dark:");
      expect(t.border).toContain(`--security-${b}`);
      expect(t.chart).toContain(`--security-${b}`);
      expect(t.ring).toContain("ring-");
    }
    expect(severityToken("none").fg).toBe("text-muted-foreground");
  });

  it("severityColor returns a theme-following CSS colour", () => {
    expect(severityColor("high")).toBe("hsl(var(--security-high, 25 95% 53%))");
    expect(severityColor("critical", "fg", 0.5)).toBe(
      "hsl(var(--security-critical-fg, 0 74% 40%) / 0.5)",
    );
  });
});

import { afterEach, describe, expect, it } from "vitest";
import {
  FRAMEWORK_PALETTE,
  KC_PALETTE,
  MAESTRO_PALETTE,
  SEVERITY_RAMP,
  frameworkToken,
  kcColor,
  maestroColor,
  resolveCssVar,
  resolveSeverity,
  resolveToken,
  sequentialColor,
  withAlpha,
} from "@/lib/palette";
import { KC, KC_ORDER, kcByCode, kcLabel } from "@/data/kc";

afterEach(() => {
  document.documentElement.classList.remove("dark");
  document.documentElement.style.removeProperty("--kc-1");
});

describe("palette tokens", () => {
  it("exposes CSS-var tokens with fallbacks", () => {
    expect(KC_PALETTE.kc1.css).toBe("hsl(var(--kc-1, 217 91% 60%))");
    expect(Object.keys(KC_PALETTE)).toEqual([...KC_ORDER]);
    expect(Object.keys(FRAMEWORK_PALETTE)).toHaveLength(6);
    expect(Object.keys(MAESTRO_PALETTE)).toHaveLength(7);
    expect(SEVERITY_RAMP.map((t) => t.key)).toEqual(["info", "low", "medium", "high", "critical"]);
    expect(withAlpha(KC_PALETTE.kc2, 0.25)).toBe("hsl(var(--kc-2, 142 71% 45%) / 0.25)");
    expect(kcColor("KC3.1")).toBe(KC_PALETTE.kc3.css);
    expect(kcColor("nope")).toContain("--muted-foreground");
    expect(maestroColor(4)).toContain("--maestro-4");
    expect(frameworkToken("owasp-agentic")?.key).toBe("asi");
    expect(frameworkToken("AIUC-1")?.key).toBe("aiuc1");
  });

  it("sequentialColor quantises and keeps zero muted", () => {
    expect(sequentialColor(0)).toBe("hsl(var(--muted))");
    expect(sequentialColor(1)).toBe("hsl(var(--primary) / 0.88)");
    expect(sequentialColor(0.05)).toBe("hsl(var(--primary) / 0.1)");
  });

  it("resolves CSS vars, honouring theme fallbacks", () => {
    expect(resolveToken(KC_PALETTE.kc1)).toBe("hsl(217 91% 60%)");
    document.documentElement.classList.add("dark");
    expect(resolveToken(KC_PALETTE.kc1)).toBe("hsl(213 94% 68%)");
    expect(resolveSeverity("critical", "fg")).toBe("hsl(0 94% 82%)");
    document.documentElement.style.setProperty("--kc-1", "10 20% 30%");
    expect(resolveCssVar("--kc-1")).toBe("hsl(10 20% 30%)");
    expect(resolveCssVar("--missing", "#fff")).toBe("#fff");
  });
});

describe("KC taxonomy", () => {
  it("uses the official names from frameworkData.ts", () => {
    expect(KC_ORDER.map((id) => KC[id].name)).toEqual([
      "Language Models (LLMs)",
      "Orchestration (Control Flow)",
      "Reasoning / Planning Paradigm",
      "Memory Modules",
      "Tool Integration Frameworks",
      "Operational Environment (Agencies)",
    ]);
    expect(kcByCode("kc5-ro")?.code).toBe("KC5");
    expect(kcByCode("KC5 Read-Only Tools")?.id).toBe("kc5");
    expect(kcByCode("x")).toBeUndefined();
    expect(kcLabel("kc1")).toBe("KC1 · Language Models (LLMs)");
    expect(kcLabel("KC4", { short: true, separator: ": " })).toBe("KC4: Memory");
  });

  it("matches the runtime titles of frameworkData", async () => {
    const { frameworkData } = await import("@/components/components/frameworkData");
    for (const node of frameworkData) {
      const kc = kcByCode(node.id);
      expect(kc?.name).toBe(node.title);
    }
  });
});

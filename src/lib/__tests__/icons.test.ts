import { describe, expect, it } from "vitest";
import {
  FALLBACK_ICON,
  ICON_KEYS,
  PREVIOUSLY_UNRESOLVED_ICON_KEYS,
  UNRESOLVED_ICON_KEYS,
  getIcon,
  hasIcon,
  normalizeIconKey,
  resolveIconKey,
} from "@/lib/icons";
import { threatsData, mitigationsData, aisvsData } from "@/components/components/securityData";
import { architecturesData } from "@/components/components/architecturesData";
import { agenticTop10Data } from "@/components/components/owaspAgenticTop10Data";
import { aiuc1Principles } from "@/components/components/aiuc1Data";
import { frameworkData } from "@/components/components/frameworkData";
import { KC_LIST } from "@/data/kc";

function collectIcons(): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  const push = (src: string, icon: unknown) => {
    if (typeof icon === "string" && icon) out.push([src, icon]);
  };
  Object.values(threatsData).forEach((t) => push(`threat ${t.id}`, t.icon));
  Object.values(mitigationsData).forEach((m) => push(`mitigation ${m.id}`, m.icon));
  Object.values(aisvsData).forEach((c) => push(`aisvs ${c.id}`, c.icon));
  Object.values(architecturesData).forEach((a) => push(`architecture ${a.id}`, a.icon));
  agenticTop10Data.forEach((e) => push(`asi ${e.id}`, e.icon));
  aiuc1Principles.forEach((p) => push(`aiuc1 ${p.id}`, p.icon));
  frameworkData.forEach((c) => push(`component ${c.id}`, c.icon));
  KC_LIST.forEach((k) => push(`kc ${k.id}`, k.icon));
  return out;
}

describe("icon registry", () => {
  it("resolves every data icon key (zero fallbacks)", () => {
    const icons = collectIcons();
    expect(icons.length).toBeGreaterThan(60);
    const missing = icons.filter(([, key]) => !hasIcon(key));
    expect(missing).toEqual([]);
    expect(UNRESOLVED_ICON_KEYS).toEqual([]);
    for (const k of PREVIOUSLY_UNRESOLVED_ICON_KEYS) expect(hasIcon(k)).toBe(true);
  });

  it("covers AISVS 1.01 chapter codes C1–C12 and KC ids", () => {
    for (let i = 1; i <= 12; i++) expect(resolveIconKey(`C${i}`)).toBe(`c${i}`);
    for (let i = 1; i <= 6; i++) expect(hasIcon(`KC${i}`)).toBe(true);
  });

  it("normalises keys and falls back for unknown ones", () => {
    expect(normalizeIconKey("BrainCircuit")).toBe("brain-circuit");
    expect(normalizeIconKey(" shield_check ")).toBe("shield-check");
    expect(resolveIconKey("Tool")).toBe("tool");
    expect(getIcon("definitely-not-an-icon")).toBe(FALLBACK_ICON);
    expect(ICON_KEYS).toContain("shield-check");
    expect(new Set(ICON_KEYS).size).toBe(ICON_KEYS.length);
  });
});

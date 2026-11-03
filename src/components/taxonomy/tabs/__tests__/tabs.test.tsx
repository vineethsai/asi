import { describe, expect, it, vi, beforeAll } from "vitest";
import { fireEvent, render, screen, within, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactElement } from "react";
import { OwaspAgenticTop10Content } from "@/pages/OwaspAgenticTop10";
import { CiscoTaxonomyContent } from "@/pages/CiscoTaxonomy";
import { AIVSSCalculatorContent } from "@/pages/AIVSSCalculator";
import { AIUC1Content } from "@/pages/AIUC1Content";
import { AtlasCrosswalkContent } from "@/components/taxonomy/tabs/AtlasCrosswalkTab";
import { entryDomId } from "@/components/taxonomy/deepLink";
import { agenticTop10Data } from "@/components/components/owaspAgenticTop10Data";
import { ciscoTaxonomyData } from "@/components/components/ciscoTaxonomyData";
import {
  agenticRiskFactors,
  coreRiskScores,
  scoreAIVSS,
} from "@/components/components/aivssCalcData";
import { atlasCrosswalk } from "@/data/atlasCrosswalk";

beforeAll(() => {
  if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {};
  if (typeof window.ResizeObserver === "undefined") {
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  }
  if (!window.matchMedia) {
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
  }
});

const wrap = (ui: ReactElement, url = "/taxonomy") =>
  render(<MemoryRouter initialEntries={[url]}>{ui}</MemoryRouter>);

/** The accordion trigger (first button) inside an element with the given DOM id. */
const triggerIn = (id: string) => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} not rendered`);
  return within(el).getAllByRole("button")[0];
};

describe("OwaspAgenticTop10Content", () => {
  it("expands the ?entry= item without reporting a change, and reports user expansion", () => {
    const onEntryChange = vi.fn();
    wrap(<OwaspAgenticTop10Content entry="asi03" focusKey={1} onEntryChange={onEntryChange} />);
    expect(screen.getByRole("heading", { level: 2, name: /OWASP Top 10/ })).toBeInTheDocument();
    expect(triggerIn(entryDomId("ASI03"))).toHaveAttribute("aria-expanded", "true");
    const asi03 = agenticTop10Data.find((e) => e.code === "ASI03")!;
    expect(screen.getByText(asi03.description)).toBeInTheDocument();
    expect(onEntryChange).not.toHaveBeenCalled();

    fireEvent.click(triggerIn(entryDomId("ASI05")));
    expect(onEntryChange).toHaveBeenLastCalledWith("ASI05");
    expect(triggerIn(entryDomId("ASI05"))).toHaveAttribute("aria-expanded", "true");
    expect(triggerIn(entryDomId("ASI03"))).toHaveAttribute("aria-expanded", "false");
  });

  it("links related threats and controls from the expanded entry", () => {
    wrap(<OwaspAgenticTop10Content entry="ASI01" />);
    const item = document.getElementById(entryDomId("ASI01"))!;
    const links = within(item).getAllByRole("link");
    expect(links.some((a) => a.getAttribute("href")?.startsWith("/threats/t"))).toBe(true);
    expect(links.some((a) => a.getAttribute("href")?.startsWith("/controls/m"))).toBe(true);
    expect(
      links.some((a) => a.getAttribute("href")?.startsWith("/taxonomy?tab=cisco&entry=OB-")),
    ).toBe(true);
  });
});

describe("CiscoTaxonomyContent", () => {
  it("expands the objective and technique for entry=AITech-1.1", () => {
    wrap(<CiscoTaxonomyContent entry="AITech-1.1" focusKey={1} />);
    const og = ciscoTaxonomyData.find((o) => o.ai_tech.some((t) => t.code === "AITech-1.1"))!;
    const tech = og.ai_tech.find((t) => t.code === "AITech-1.1")!;
    expect(triggerIn(entryDomId(og.code))).toHaveAttribute("aria-expanded", "true");
    expect(triggerIn(entryDomId("AITech-1.1"))).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(tech.definition)).toBeInTheDocument();
    expect(screen.getByText(/v2\.0\.0/)).toBeInTheDocument();
  });

  it("category filters are toggle buttons", () => {
    wrap(<CiscoTaxonomyContent />);
    const group = screen.getByRole("group", { name: "Filter by category" });
    const all = within(group).getByRole("button", { name: /^All/ });
    expect(all).toHaveAttribute("aria-pressed", "true");
  });
});

describe("AIVSSCalculatorContent", () => {
  it("reads factor values from the share URL and scores them", () => {
    const f = "1111111h1h";
    wrap(<AIVSSCalculatorContent />, `/taxonomy?tab=aivss&f=${f}&cvss=9.4&em=P&mf=none`);
    const levels = Object.fromEntries(
      agenticRiskFactors.map((factor, i) => [
        factor.id,
        f[i] === "1" ? "full" : f[i] === "h" ? "partial" : "none",
      ]),
    );
    const expected = scoreAIVSS({
      cvssBase: 9.4,
      factorValues: levels,
      exploitMaturity: "P",
      mitigation: "none",
    }).aivssScore;
    expect(
      screen.getByRole("img", { name: new RegExp(`AIVSS score ${expected.toFixed(1)} out of 10`) }),
    ).toBeInTheDocument();
    const au = screen.getByRole("radiogroup", { name: agenticRiskFactors[0].name });
    expect(within(au).getByRole("radio", { name: "Full (1)" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    const id = screen.getByRole("radiogroup", { name: agenticRiskFactors[7].name });
    expect(within(id).getByRole("radio", { name: "Partial (0.5)" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("ignores an invalid factor vector and loads a worked example", () => {
    wrap(<AIVSSCalculatorContent />, "/taxonomy?tab=aivss&f=11x&cvss=99");
    // Defaults: CVSS 8.0, every factor partial.
    const au = screen.getByRole("radiogroup", { name: agenticRiskFactors[0].name });
    expect(within(au).getByRole("radio", { name: "Partial (0.5)" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    const risk = coreRiskScores[coreRiskScores.length - 1];
    fireEvent.click(screen.getByRole("button", { name: `Load ${risk.name} into the calculator` }));
    expect(
      screen.getByRole("img", {
        name: new RegExp(`AIVSS score ${risk.aivssScore.toFixed(1)} out of 10`),
      }),
    ).toBeInTheDocument();
  });

  it("copies a share URL with the encoded factor vector", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    wrap(<AIVSSCalculatorContent />, "/taxonomy?tab=aivss&f=0000000000&cvss=5.0&em=U&mf=strong");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Share/ }));
    });
    expect(writeText).toHaveBeenCalledTimes(1);
    const url = new URL(writeText.mock.calls[0][0]);
    expect(url.searchParams.get("tab")).toBe("aivss");
    expect(url.searchParams.get("f")).toBe("0000000000");
    expect(url.searchParams.get("cvss")).toBe("5.0");
    expect(url.searchParams.get("em")).toBe("U");
    expect(url.searchParams.get("mf")).toBe("strong");
  });
});

describe("AIUC1Content", () => {
  it("hides retired requirements unless the deep link targets one", () => {
    const { unmount } = wrap(<AIUC1Content />);
    expect(document.getElementById(entryDomId("C011"))).toBeNull();
    expect(screen.getByRole("switch", { name: /Show retired/ })).toHaveAttribute(
      "aria-checked",
      "false",
    );
    unmount();
    wrap(<AIUC1Content entry="C011" focusKey={1} />);
    expect(document.getElementById(entryDomId("C011"))).not.toBeNull();
  });
});

describe("AtlasCrosswalkContent", () => {
  it("lists every crosswalk row and selects the ?entry= row", () => {
    const row = atlasCrosswalk[0];
    const onEntryChange = vi.fn();
    wrap(<AtlasCrosswalkContent entry={row.atlasId} focusKey={1} onEntryChange={onEntryChange} />);
    expect(
      screen.getByText(`Showing ${atlasCrosswalk.length} of ${atlasCrosswalk.length}`),
    ).toBeInTheDocument();
    const el = document.getElementById(entryDomId(row.atlasId))!;
    expect(el).toHaveAttribute("data-selected", "true");
    expect(onEntryChange).not.toHaveBeenCalled();
    const other = atlasCrosswalk[1];
    fireEvent.click(screen.getByRole("button", { name: other.atlasName }));
    expect(onEntryChange).toHaveBeenLastCalledWith(other.atlasId);
  });
});

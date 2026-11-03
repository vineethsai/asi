import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import AisvsPage from "@/pages/AISVS";
import { aisvsData, aisvsRequirements } from "@/data/aisvs";
import { mitigationsData } from "@/components/components/securityData";
import {
  controlsCitingChapter,
  controlsCitingRequirement,
  parseAisvsAnchor,
} from "@/components/aisvs/aisvsIndex";
import { buildAisvsCsv, buildAisvsJson } from "@/components/aisvs/exportProgress";

function renderAt(url: string) {
  return render(
    <TooltipProvider>
      <MemoryRouter initialEntries={[url]}>
        <AisvsPage />
      </MemoryRouter>
    </TooltipProvider>,
  );
}

const chapterTrigger = (code: string) =>
  screen.getByRole("button", { name: new RegExp(`^${code} ${aisvsData[code].name}`) });

describe("parseAisvsAnchor", () => {
  const req = aisvsRequirements.find((r) => r.category === "C5")!;
  it("resolves chapter, section and requirement codes in every accepted spelling", () => {
    expect(parseAisvsAnchor("#C5")).toEqual({ chapter: "C5", target: "C5" });
    expect(parseAisvsAnchor(`#${req.section}`)).toMatchObject({ section: req.section });
    for (const spelling of [`#${req.id}`, `#V${req.code}`, req.code, `v1.01-${req.id}`]) {
      expect(parseAisvsAnchor(spelling)).toMatchObject({
        chapter: "C5",
        section: req.section,
        requirement: req.id,
        target: req.id,
      });
    }
  });
  it("rejects codes that do not exist in this version", () => {
    expect(parseAisvsAnchor("#C13")).toBeNull();
    expect(parseAisvsAnchor("#overview")).toBeNull();
    expect(parseAisvsAnchor("")).toBeNull();
  });
});

describe("AISVS reverse index (controls citing requirements)", () => {
  it("matches mitigationsData.aisvsRequirements / aisvsCategories", () => {
    for (const m of Object.values(mitigationsData)) {
      for (const id of m.aisvsRequirements ?? []) {
        expect(controlsCitingRequirement(id).map((c) => c.id)).toContain(m.id);
      }
      for (const ch of m.aisvsCategories ?? []) {
        expect(controlsCitingChapter(ch).map((c) => c.id)).toContain(m.id);
      }
    }
  });
});

describe("AISVS exports", () => {
  it("CSV has one row per requirement and JSON carries the version", () => {
    const first = aisvsRequirements[0].id;
    const csv = buildAisvsCsv(new Set([first]));
    expect(csv.split("\r\n")).toHaveLength(aisvsRequirements.length + 1);
    const json = JSON.parse(buildAisvsJson(new Set([first])));
    expect(json.standard.version).toBe("1.01");
    expect(json.verified).toEqual([first]);
  });
});

describe("AISVS page deep links", () => {
  it("#C5 expands chapter C5 only", () => {
    renderAt("/aisvs#C5");
    expect(chapterTrigger("C5")).toHaveAttribute("aria-expanded", "true");
    expect(chapterTrigger("C4")).toHaveAttribute("aria-expanded", "false");
  });

  it("a requirement hash expands its chapter and section and shows the official text", () => {
    const req = aisvsRequirements.find((r) => r.category === "C9")!;
    renderAt(`/aisvs#${req.id}`);
    expect(chapterTrigger("C9")).toHaveAttribute("aria-expanded", "true");
    const row = document.getElementById(req.id)!;
    expect(row).toBeTruthy();
    expect(within(row).getByText(req.text)).toBeVisible();
    expect(within(row).getByRole("checkbox")).toBeInTheDocument();
  });

  it("legacy V-prefixed hashes resolve", () => {
    const req = aisvsRequirements.find((r) => r.category === "C2")!;
    renderAt(`/aisvs#V${req.code}`);
    expect(chapterTrigger("C2")).toHaveAttribute("aria-expanded", "true");
    expect(document.getElementById(req.id)).toBeTruthy();
  });
});

import { beforeAll, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactElement } from "react";
import { LlmTop10Content } from "@/components/taxonomy/tabs/LlmTop10Tab";
import { entryDomId } from "@/components/taxonomy/deepLink";
import { llmTop10Data } from "@/components/components/owaspLlmTop10Data";

beforeAll(() => {
  if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {};
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

const wrap = (ui: ReactElement) =>
  render(<MemoryRouter initialEntries={["/taxonomy?tab=llm-top10"]}>{ui}</MemoryRouter>);

const triggerIn = (id: string) => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} not rendered`);
  return within(el).getAllByRole("button")[0];
};

describe("LlmTop10Content", () => {
  it("renders all ten entries and expands the ?entry= item without reporting a change", () => {
    const onEntryChange = vi.fn();
    wrap(<LlmTop10Content entry="LLM08" focusKey={1} onEntryChange={onEntryChange} />);
    expect(
      screen.getByRole("heading", { level: 2, name: /OWASP Top 10 for LLM Applications/ }),
    ).toBeInTheDocument();
    for (const e of llmTop10Data) expect(document.getElementById(entryDomId(e.id))).not.toBeNull();
    expect(triggerIn(entryDomId("LLM08"))).toHaveAttribute("aria-expanded", "true");
    const llm08 = llmTop10Data.find((e) => e.id === "LLM08")!;
    expect(screen.getByText(llm08.summary)).toBeInTheDocument();
    expect(onEntryChange).not.toHaveBeenCalled();

    fireEvent.click(triggerIn(entryDomId("LLM03")));
    expect(onEntryChange).toHaveBeenLastCalledWith("LLM03");
    expect(triggerIn(entryDomId("LLM03"))).toHaveAttribute("aria-expanded", "true");
  });

  it("opens the 2026 entry for a 2025 id", () => {
    wrap(<LlmTop10Content entry="LLM06:2025" focusKey={1} />);
    expect(triggerIn(entryDomId("LLM03"))).toHaveAttribute("aria-expanded", "true");
    expect(
      within(document.getElementById(entryDomId("LLM03"))!).getByText(/was LLM06:2025/),
    ).toBeInTheDocument();
  });

  it("links related threats, controls, ASI entries and AISVS chapters", () => {
    wrap(<LlmTop10Content entry="LLM01" />);
    const item = document.getElementById(entryDomId("LLM01"))!;
    const hrefs = within(item)
      .getAllByRole("link")
      .map((a) => a.getAttribute("href") ?? "");
    expect(hrefs).toContain("/threats/t6");
    expect(hrefs).toContain("/controls/m4");
    expect(hrefs).toContain("/taxonomy?tab=owasp-agentic&entry=ASI01");
    expect(hrefs).toContain("/aisvs#C2");
    expect(hrefs.some((h) => h.startsWith("https://atlas.mitre.org/tactics/AML.TA"))).toBe(true);
    expect(hrefs).toContain("https://cwe.mitre.org/data/definitions/1427.html");
  });

  it("filters by a 2025 name", () => {
    wrap(<LlmTop10Content />);
    fireEvent.change(screen.getByLabelText("Search LLM Top 10 entries"), {
      target: { value: "system prompt leakage" },
    });
    expect(document.getElementById(entryDomId("LLM08"))).not.toBeNull();
    expect(document.getElementById(entryDomId("LLM01"))).toBeNull();
  });
});

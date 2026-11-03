import { beforeAll, describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import Taxonomy from "@/pages/Taxonomy";
import { entryDomId } from "@/components/taxonomy/deepLink";

beforeAll(() => {
  if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {};
  if (typeof window.ResizeObserver === "undefined") {
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  }
});

function LocationProbe() {
  const loc = useLocation();
  return <output data-testid="location">{`${loc.pathname}${loc.search}`}</output>;
}

function renderAt(url: string) {
  return render(
    <TooltipProvider>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route
            path="/taxonomy"
            element={
              <>
                <Taxonomy />
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    </TooltipProvider>,
  );
}

/** First button (the accordion trigger) inside the element with this DOM id. */
async function triggerIn(id: string) {
  await waitFor(() => expect(document.getElementById(id)).toBeTruthy(), { timeout: 4000 });
  return within(document.getElementById(id)!).getAllByRole("button")[0];
}

describe("Taxonomy ?tab=&entry= deep links", () => {
  it("renders one h1 and the overview charts by default", () => {
    renderAt("/taxonomy");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("tab", { name: /Overview/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("heading", { name: "Cross-framework flow" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cross-reference density" })).toBeInTheDocument();
  });

  it("selects the OWASP tab and expands the entry; user selection rewrites ?entry=", async () => {
    renderAt("/taxonomy?tab=owasp-agentic&entry=ASI03");
    expect(screen.getByRole("tab", { name: /Agentic/ })).toHaveAttribute("aria-selected", "true");
    expect(await triggerIn(entryDomId("ASI03"))).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);

    fireEvent.click(await triggerIn(entryDomId("ASI06")));
    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/taxonomy?tab=owasp-agentic&entry=ASI06",
      ),
    );
    expect(await triggerIn(entryDomId("ASI06"))).toHaveAttribute("aria-expanded", "true");
  });

  it("opens a Cisco objective from ?tab=cisco&entry=OB-004", async () => {
    renderAt("/taxonomy?tab=cisco&entry=OB-004");
    expect(screen.getByRole("tab", { name: /Cisco/ })).toHaveAttribute("aria-selected", "true");
    expect(await triggerIn(entryDomId("OB-004"))).toHaveAttribute("aria-expanded", "true");
  });

  it("accepts the aiuc1 alias and the atlas tab", async () => {
    const { unmount } = renderAt("/taxonomy?tab=aiuc1&entry=A001");
    expect(screen.getByRole("tab", { name: /AIUC-1/ })).toHaveAttribute("aria-selected", "true");
    await waitFor(() => expect(document.getElementById(entryDomId("A001"))).toBeTruthy(), {
      timeout: 4000,
    });
    unmount();
    renderAt("/taxonomy?tab=atlas&entry=AML.T0051");
    expect(screen.getByRole("tab", { name: /ATLAS/ })).toHaveAttribute("aria-selected", "true");
    await waitFor(() => expect(document.getElementById(entryDomId("AML.T0051"))).toBeTruthy(), {
      timeout: 4000,
    });
  });
});

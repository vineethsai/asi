import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import NISTMapping from "@/pages/NISTMapping";
import { AISVS_CHAPTER_CODES } from "@/data/aisvs";

function LocationProbe() {
  const loc = useLocation();
  return <output data-testid="location">{`${loc.pathname}${loc.search}${loc.hash}`}</output>;
}

function renderAt(url: string) {
  return render(
    <TooltipProvider>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route
            path="/nist-mapping"
            element={
              <>
                <NISTMapping />
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    </TooltipProvider>,
  );
}

describe("NISTMapping page", () => {
  it("opens the details drawer for a ?sub= deep link (case-insensitive)", async () => {
    renderAt("/nist-mapping?sub=govern.1.1");
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("heading", { level: 2 })).toHaveTextContent("GOVERN.1.1");
    expect(
      within(dialog).getByText(/Legal and regulatory requirements involving AI/),
    ).toBeVisible();
  });

  it("closing the drawer removes ?sub= and keeps the tab hash", async () => {
    renderAt("/nist-mapping?sub=MAP.1.1#compliance-matrix");
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Close details" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByTestId("location")).toHaveTextContent(/^\/nist-mapping#compliance-matrix$/);
  });

  it("shows every AISVS chapter in the compliance matrix", () => {
    renderAt("/nist-mapping#compliance-matrix");
    const table = screen.getByRole("table");
    for (const ch of AISVS_CHAPTER_CODES) {
      expect(within(table).getByRole("columnheader", { name: new RegExp(`^${ch}:`) })).toBeTruthy();
    }
  });
});

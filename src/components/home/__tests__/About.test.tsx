import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import About from "@/pages/About";
import { LEARNING_STEPS, learningStepPath } from "@/data/learningPath";
import { SOURCES } from "@/data/sources";

describe("About page", () => {
  it("builds the methodology stepper from LEARNING_STEPS and lists every data source", () => {
    render(
      <TooltipProvider>
        <MemoryRouter>
          <About />
        </MemoryRouter>
      </TooltipProvider>,
    );
    const section = screen.getByRole("heading", { name: "Methodology" }).closest("section")!;
    const items = within(section).getAllByRole("listitem");
    expect(items).toHaveLength(LEARNING_STEPS.length);
    LEARNING_STEPS.forEach((step, i) => {
      const item = items[i];
      expect(within(item).getByRole("heading", { level: 3 })).toHaveTextContent(step.title);
      const hrefs = within(item)
        .getAllByRole("link")
        .map((a) => a.getAttribute("href"));
      expect(hrefs).toContain(learningStepPath(step.id));
      if (step.readings[0]) expect(hrefs).toContain(step.readings[0].path);
    });
    expect(within(section).getByRole("link", { name: /start the learning path/i })).toHaveAttribute(
      "href",
      "/learn",
    );
    const sources = screen.getByRole("heading", { name: "Data sources" }).closest("section")!;
    expect(within(sources).getAllByRole("listitem")).toHaveLength(Object.keys(SOURCES).length);
  });
});

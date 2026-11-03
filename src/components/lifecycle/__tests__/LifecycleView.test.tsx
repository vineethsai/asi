import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import Implementation from "@/pages/Implementation";
import { mitigationsData } from "@/components/components/securityData";
import { phaseTaskTotal } from "@/components/controls/phaseTasks";
import { useProgressStore } from "@/lib/progress";

function renderAt(path: string) {
  return render(
    <TooltipProvider>
      <MemoryRouter initialEntries={[path]}>
        <Implementation />
      </MemoryRouter>
    </TooltipProvider>,
  );
}

describe("Lifecycle view", () => {
  beforeEach(() => {
    useProgressStore.getState().resetControl("m2");
  });

  it("renders the three phase lanes with a chip per applicable control", () => {
    renderAt("/implementation");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Lifecycle view");
    const lanes = within(screen.getByRole("list", { name: "Lifecycle phases" })).getAllByRole(
      "listitem",
      { name: "" },
    );
    expect(lanes.length).toBeGreaterThanOrEqual(3);
    const designChips = screen.getAllByRole("button", { name: /design tasks/ });
    expect(designChips).toHaveLength(
      Object.values(mitigationsData).filter((m) => m.designPhase).length,
    );
  });

  it("opens ?control= inline and binds the checklist to the progress store", () => {
    renderAt("/implementation?control=m2&phase=build");
    const panel = document.getElementById("lifecycle-panel")!;
    expect(within(panel).getByRole("heading", { level: 2 })).toHaveTextContent(
      mitigationsData.m2.name,
    );
    const boxes = within(panel).getAllByRole("checkbox");
    expect(boxes).toHaveLength(phaseTaskTotal(mitigationsData.m2, "build"));
    fireEvent.click(boxes[0]);
    expect(useProgressStore.getState().controls.m2?.size).toBe(1);
    expect(within(panel).getByText(`1/${boxes.length} build tasks done`)).toBeInTheDocument();
  });
});

/** Smoke test for the assembled modeler page: bootstrap, banners, toolbar menus, dialogs. */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeAll, describe, expect, it } from "vitest";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import ThreatModelerPage from "@/pages/ThreatModeler";
import { encodeShareLink, createDocument } from "../document";
import { getThreatModelStore, tm } from "../store";
import { templateModel } from "./fixtures";

beforeAll(() => {
  const g = globalThis as unknown as Record<string, unknown>;
  if (!g.ResizeObserver)
    g.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  if (!g.DOMMatrixReadOnly)
    g.DOMMatrixReadOnly = class {
      m22 = 1;
      constructor() {}
    };
  window.matchMedia = ((q: string) => ({
    matches: q.includes("min-width"),
    media: q,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
  Element.prototype.scrollIntoView = function () {};
  // Onboarding would auto-open on an empty canvas.
  localStorage.setItem("threat-modeler-ui-v2", JSON.stringify({ onboardingSeen: true }));
});

function renderAt(url: string) {
  getThreatModelStore().setState({
    bootstrappedSearch: null,
    persist: "transient",
    past: [],
    future: [],
  });
  return render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path="/threat-modeler" element={<ThreatModelerPage />} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
  );
}

describe("Threat Modeler page", () => {
  it("previews a ?template= link without autosaving it, then analyses", async () => {
    renderAt("/threat-modeler?template=rag-pipeline");
    expect(await screen.findByText(/Previewing the/)).toBeInTheDocument();
    expect(tm().persist).toBe("transient");
    expect(screen.getByRole("toolbar", { name: /threat modeler tools/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Model name")).toHaveValue("RAG Pipeline");
    await waitFor(() => expect(tm().analysis).not.toBeNull());
    expect(localStorage.getItem("threat-modeler-document-v2")).toBeNull();
  });

  it("opens a shared model read-only with Make a copy", async () => {
    const doc = createDocument({ ...templateModel("simple-agent"), name: "Shared one" });
    renderAt(`/threat-modeler?m=${encodeShareLink(doc)}`);
    expect(await screen.findByText(/You are viewing a shared model/)).toBeInTheDocument();
    expect(tm().persist).toBe("readonly");
    fireEvent.click(screen.getAllByRole("button", { name: /make a copy/i })[0]);
    expect(tm().persist).toBe("autosave");
    expect(tm().document.name).toBe("Copy of Shared one");
  });

  it("shows the empty state and opens the shortcuts dialog with ?", async () => {
    localStorage.removeItem("threat-modeler-document-v2");
    renderAt("/threat-modeler");
    act(() =>
      tm().replaceDocument(createDocument({}), "Clear", {
        persist: "autosave",
        resetHistory: true,
      }),
    );
    expect(await screen.findByText("Start your threat model")).toBeInTheDocument();
    const canvas = screen.getByRole("region", { name: /threat model canvas/i });
    canvas.focus();
    fireEvent.keyDown(canvas, { key: "?" });
    expect(await screen.findByRole("dialog", { name: /keyboard shortcuts/i })).toBeInTheDocument();
  });
});

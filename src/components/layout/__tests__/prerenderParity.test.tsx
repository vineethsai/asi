/**
 * The prerendered head (scripts/seo-model.mjs) mirrors each page's <PageLayout> props. This test
 * renders the pages and compares what react-helmet would set with the model, so a title or
 * description changed in a page without the model (or the other way round) fails here instead of
 * shipping a head that flips after the app boots.
 */
import fs from "fs";
import path from "path";
import type { ComponentType } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { Helmet } from "react-helmet";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  MODULES,
  OPTIONAL_MODULES,
  buildSiteModel,
  projectRoot,
  readChecklist,
} from "../../../../scripts/seo-model.mjs";
import About from "@/pages/About";
import AISVS from "@/pages/AISVS";
import ArchitectureDetail from "@/pages/ArchitectureDetail";
import Architectures from "@/pages/Architectures";
import ComponentDetail from "@/pages/ComponentDetail";
import ControlDetail from "@/pages/ControlDetail";
import Components from "@/pages/Components";
import Controls from "@/pages/Controls";
import Implementation from "@/pages/Implementation";
import Index from "@/pages/Index";
import Interactive from "@/pages/Interactive";
import Learn from "@/pages/Learn";
import NISTMapping from "@/pages/NISTMapping";
import ProgressDashboard from "@/pages/ProgressDashboard";
import References from "@/pages/References";
import Scenario from "@/pages/Scenario";
import Taxonomy from "@/pages/Taxonomy";
import ThreatDetail from "@/pages/ThreatDetail";
import ThreatModeler from "@/pages/ThreatModeler";
import ThreatModelerGuide from "@/pages/ThreatModelerGuide";
import Threats from "@/pages/Threats";

interface Route {
  path: string;
  kind: string;
  fullTitle: string;
  metaDescription: string;
  canonicalUrl: string;
}

interface HelmetState {
  title: string | string[];
  metaTags: { name?: string; property?: string; content?: string }[];
  linkTags: { rel?: string; href?: string }[];
}

const PAGES: [pattern: string, Page: ComponentType][] = [
  ["/", Index],
  ["/threats", Threats],
  ["/threats/:threatId", ThreatDetail],
  ["/controls", Controls],
  ["/controls/:controlId", ControlDetail],
  ["/nist-mapping", NISTMapping],
  ["/taxonomy", Taxonomy],
  ["/progress", ProgressDashboard],
  ["/threat-modeler", ThreatModeler],
  ["/components", Components],
  ["/components/:componentId", ComponentDetail],
  ["/architectures", Architectures],
  ["/architectures/:architectureId", ArchitectureDetail],
  ["/aisvs", AISVS],
  ["/implementation", Implementation],
  ["/interactive", Interactive],
  ["/references", References],
  ["/about", About],
  ["/threat-modeler-guide", ThreatModelerGuide],
  ["/learn", Learn],
  ["/learn/:stepId", Learn],
  ["/scenarios/:id", Scenario],
];

const KINDS = new Set([
  "home",
  "threats",
  "threat",
  "controls",
  "components",
  "component",
  "architectures",
  "architecture",
  "aisvs",
  "implementation",
  "interactive",
  "references",
  "about",
  "guide",
  "control",
  "nist",
  "taxonomy",
  "progress",
  "threat-modeler",
  "learn",
  "learn-step",
  "scenario",
]);

let routes: Route[] = [];

beforeAll(async () => {
  class Observer {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  vi.stubGlobal("ResizeObserver", Observer);
  vi.stubGlobal("IntersectionObserver", Observer);

  const mods: Record<string, unknown> = {};
  for (const [key, id] of Object.entries(MODULES as Record<string, string>)) {
    mods[key] = await import(/* @vite-ignore */ path.join(projectRoot, id));
  }
  for (const [key, id] of Object.entries(OPTIONAL_MODULES as Record<string, string>)) {
    const file = path.join(projectRoot, id);
    if (fs.existsSync(file)) mods[key] = await import(/* @vite-ignore */ file);
  }
  mods.checklist = readChecklist();
  const model = buildSiteModel(mods, { buildDate: "2026-11-03" }) as { routes: Route[] };
  // Every static page plus the first two of each detail kind keeps the run short.
  const seen: Record<string, number> = {};
  routes = model.routes.filter((r) => {
    if (!KINDS.has(r.kind)) return false;
    seen[r.kind] = (seen[r.kind] ?? 0) + 1;
    return seen[r.kind] <= 2;
  });
}, 120_000);

afterEach(cleanup);

function headFor(routePath: string): HelmetState {
  render(
    <ThemeProvider>
      <TooltipProvider>
        <MemoryRouter initialEntries={[routePath]}>
          <Routes>
            {PAGES.map(([pattern, Page]) => (
              <Route key={pattern} path={pattern} element={<Page />} />
            ))}
          </Routes>
        </MemoryRouter>
      </TooltipProvider>
    </ThemeProvider>,
  );
  return Helmet.peek() as unknown as HelmetState;
}

describe("prerendered head matches the React page", () => {
  it("covers every page kind", () => {
    expect(new Set(routes.map((r) => r.kind))).toEqual(KINDS);
  });

  it("has the same title, description and canonical as react-helmet", () => {
    const mismatches: string[] = [];
    for (const route of routes) {
      const head = headFor(route.path);
      const title = Array.isArray(head.title) ? head.title.join("") : head.title;
      const description = head.metaTags.find((t) => t.name === "description")?.content;
      const canonical = head.linkTags.find((t) => t.rel === "canonical")?.href;
      if (title !== route.fullTitle)
        mismatches.push(`${route.path} title: "${title}" vs "${route.fullTitle}"`);
      if (description !== route.metaDescription) {
        mismatches.push(
          `${route.path} description: "${description}" vs "${route.metaDescription}"`,
        );
      }
      if (canonical !== route.canonicalUrl) {
        mismatches.push(`${route.path} canonical: ${canonical} vs ${route.canonicalUrl}`);
      }
      cleanup();
    }
    expect(mismatches).toEqual([]);
  }, 120_000);
});

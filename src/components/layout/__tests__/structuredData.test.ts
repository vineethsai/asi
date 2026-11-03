// @vitest-environment node
/**
 * Structured data and sitemap checks for the build-time SEO output (scripts/seo-model.mjs,
 * scripts/prerender.mjs, scripts/generate-seo.js): every route is rendered exactly as the
 * postbuild step renders it, every JSON-LD block is parsed and checked for the fields its
 * schema.org type needs, and the sitemap is compared with the canonical URLs.
 */
import fs from "fs";
import path from "path";
import { beforeAll, describe, expect, it } from "vitest";
import {
  MODULES,
  OPTIONAL_MODULES,
  buildSiteModel,
  projectRoot,
  readChecklist,
} from "../../../../scripts/seo-model.mjs";
import {
  createContext,
  extractJsonLd,
  prepareTemplate,
  renderRoute,
} from "../../../../scripts/prerender.mjs";
import { buildSitemap } from "../../../../scripts/generate-seo.js";
import {
  META_DESCRIPTION_MAX,
  ORGANIZATION_ID,
  SITE_ORIGIN,
  autoJsonLd,
  breadcrumbTrail,
  metaDescription,
  normalizePath,
} from "../seo";

type LdValue = string | number | boolean | null | LdNode | LdValue[];
interface LdNode {
  [key: string]: LdValue;
}

interface Route {
  path: string;
  kind: string;
  tier: string;
  title: string;
  fullTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  noindex: boolean;
  indexable: boolean;
  lastmod: string;
  changefreq: string;
  priority: string;
  dateModified?: string;
}

interface Rendered {
  route: Route;
  html: string;
  blocks: { attrs: string; data: LdNode }[];
}

const BUILD_DATE = "2026-11-03";
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const TEMPLATE = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Agentic Security Hub</title>
    <meta data-react-helmet="true" name="description" content="shell" />
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"Thing"}</script>
    <script type="module" crossorigin src="/assets/index-test.js"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
`;

const asNode = (value: LdValue | undefined): LdNode => value as LdNode;
const asNodes = (value: LdValue | undefined): LdNode[] =>
  (Array.isArray(value) ? value : []) as LdNode[];
const isAbsolute = (value: LdValue | undefined) =>
  typeof value === "string" && /^https:\/\/[^/\s]+/.test(value);
const onSite = (value: LdValue | undefined) =>
  typeof value === "string" && (value === SITE_ORIGIN || value.startsWith(`${SITE_ORIGIN}/`));

/**
 * Problems with one node (and its nested typed nodes), as readable strings. Nested nodes are
 * references or list summaries, so they need less than a top-level block (an author needs a
 * name, a listed article a name or headline).
 */
function checkNode(node: LdNode, where: string, problems: string[], nested = false) {
  const type = node["@type"];
  const need = (field: string, ok: (v: LdValue | undefined) => boolean = (v) => !!v) => {
    if (!ok(node[field])) problems.push(`${where}: ${String(type)} needs ${field}`);
  };
  const positions = (items: LdNode[], label: string) => {
    items.forEach((item, i) => {
      if (item["@type"] !== "ListItem") problems.push(`${where}: ${label}[${i}] is not a ListItem`);
      if (item.position !== i + 1)
        problems.push(`${where}: ${label}[${i}] position ${item.position}`);
    });
  };

  if (typeof type !== "string" || !type) problems.push(`${where}: missing @type`);
  for (const key of ["url", "item", "@id", "logo", "image"]) {
    const value = node[key];
    if (typeof value === "string" && !isAbsolute(value)) {
      problems.push(`${where}: ${String(type)}.${key} is not an absolute URL (${value})`);
    }
  }
  if (typeof node.dateModified === "string" && !ISO_DATE.test(node.dateModified)) {
    problems.push(`${where}: dateModified ${node.dateModified} is not YYYY-MM-DD`);
  }

  switch (type) {
    case "WebSite":
      need("name");
      need("url", onSite);
      break;
    case "Organization":
      need("name");
      if (!nested) {
        need("url", isAbsolute);
        need("logo", isAbsolute);
      }
      break;
    case "WebPage":
    case "CollectionPage":
      need("name");
      need("url", onSite);
      break;
    case "TechArticle":
      if (nested) need("name", () => !!(node.headline || node.name));
      else need("headline", (v) => typeof v === "string" && v.length > 0 && v.length <= 110);
      if (node.url !== undefined) need("url", onSite);
      break;
    case "SoftwareApplication": {
      need("name");
      need("url", onSite);
      need("applicationCategory");
      need("operatingSystem");
      const offers = asNode(node.offers);
      if (!offers || offers.price === undefined || !offers.priceCurrency) {
        problems.push(`${where}: SoftwareApplication needs offers.price and offers.priceCurrency`);
      }
      break;
    }
    case "BreadcrumbList": {
      const items = asNodes(node.itemListElement);
      if (items.length < 2) problems.push(`${where}: BreadcrumbList needs at least two items`);
      positions(items, "itemListElement");
      items.forEach((item, i) => {
        if (!item.name) problems.push(`${where}: breadcrumb ${i + 1} has no name`);
        if (!onSite(item.item)) problems.push(`${where}: breadcrumb ${i + 1} item not on site`);
      });
      break;
    }
    case "ItemList": {
      const items = asNodes(node.itemListElement);
      need("itemListElement", () => items.length > 0);
      if (node.numberOfItems !== undefined && node.numberOfItems !== items.length) {
        problems.push(`${where}: numberOfItems ${node.numberOfItems} != ${items.length}`);
      }
      positions(items, "itemListElement");
      items.forEach((item, i) => {
        const target = item.url ?? asNode(item.item)?.url ?? item.item;
        if (!onSite(target)) problems.push(`${where}: list item ${i + 1} has no on-site URL`);
      });
      break;
    }
    case "DefinedTermSet": {
      need("name");
      need("@id", onSite);
      const terms = asNodes(node.hasDefinedTerm);
      need("hasDefinedTerm", () => terms.length > 0);
      const codes = new Set<string>();
      terms.forEach((term, i) => {
        if (term["@type"] !== "DefinedTerm")
          problems.push(`${where}: term ${i} is not a DefinedTerm`);
        if (!term.name || !term.termCode)
          problems.push(`${where}: term ${i} needs name and termCode`);
        if (term.inDefinedTermSet !== node["@id"])
          problems.push(`${where}: term ${i} set mismatch`);
        if (codes.has(String(term.termCode)))
          problems.push(`${where}: duplicate term ${term.termCode}`);
        codes.add(String(term.termCode));
      });
      break;
    }
    default:
      break;
  }

  for (const [key, value] of Object.entries(node)) {
    const children = Array.isArray(value) ? value : [value];
    children.forEach((child, i) => {
      if (child && typeof child === "object" && !Array.isArray(child) && "@type" in child) {
        checkNode(child as LdNode, `${where} › ${key}[${i}]`, problems, true);
      }
    });
  }
}

let model: { buildDate: string; routes: Route[] };
let rendered: Rendered[];

beforeAll(async () => {
  const mods: Record<string, unknown> = {};
  for (const [key, id] of Object.entries(MODULES as Record<string, string>)) {
    mods[key] = await import(/* @vite-ignore */ path.join(projectRoot, id));
  }
  for (const [key, id] of Object.entries(OPTIONAL_MODULES as Record<string, string>)) {
    const file = path.join(projectRoot, id);
    if (fs.existsSync(file)) mods[key] = await import(/* @vite-ignore */ file);
  }
  mods.checklist = readChecklist();
  model = buildSiteModel(mods, { buildDate: BUILD_DATE });
  const ctx = createContext(model);
  const template = prepareTemplate(TEMPLATE);
  rendered = model.routes.map((route) => {
    const html = renderRoute(route, ctx, template) as string;
    return { route, html, blocks: extractJsonLd(html) };
  });
}, 120_000);

describe("seo helpers", () => {
  it("normalizes paths to the canonical form", () => {
    expect(normalizePath("/")).toBe("/");
    expect(normalizePath("/threats/")).toBe("/threats");
    expect(normalizePath("/threats/t7#vectors")).toBe("/threats/t7");
  });

  it("clamps meta descriptions without cutting words", () => {
    const short = "Short   description\nwith  spacing.";
    expect(metaDescription(short)).toBe("Short description with spacing.");
    const long = `${"Agentic systems call tools and keep memory. ".repeat(6)}Final words here`;
    const clamped = metaDescription(long);
    expect(clamped.length).toBeLessThanOrEqual(META_DESCRIPTION_MAX);
    expect(clamped).toMatch(/[.!?…]$/);
    expect(long.startsWith(clamped.replace(/…$/, "").trimEnd())).toBe(true);
  });

  it("builds a breadcrumb trail from the path and title", () => {
    const trail = breadcrumbTrail("/threats/t7", "T7 Misaligned & Deceptive Behaviors · Threats");
    expect(trail.map((c) => c.name)).toEqual([
      "Home",
      "Threats",
      "T7 Misaligned & Deceptive Behaviors",
    ]);
    expect(breadcrumbTrail("/", "Home")).toEqual([]);
  });

  it("adds structured data by route", () => {
    const home = autoJsonLd({ canonicalPath: "/", title: "Home", description: "d" });
    expect(home.map((item) => item["@type"])).toContain("Organization");
    const tool = autoJsonLd({
      canonicalPath: "/threat-modeler",
      title: "Threat Modeler",
      description: "d",
    });
    expect(tool.map((item) => item["@type"])).toEqual(
      expect.arrayContaining(["SoftwareApplication", "BreadcrumbList"]),
    );
    expect(
      autoJsonLd({ canonicalPath: "/progress", title: "P", description: "d", noindex: true }),
    ).toEqual([]);
  });
});

describe("prerendered structured data", () => {
  it("renders every route", () => {
    expect(rendered.length).toBeGreaterThan(100);
    const paths = new Set(rendered.map((r) => r.route.path));
    for (const p of [
      "/",
      "/threats",
      "/threats/t7",
      "/aisvs",
      "/nist-mapping",
      "/taxonomy",
      "/threat-modeler",
    ]) {
      expect(paths.has(p), p).toBe(true);
    }
  });

  it("emits valid JSON-LD with the required fields for its type", () => {
    const problems: string[] = [];
    for (const { route, blocks } of rendered) {
      blocks.forEach(({ data }, i) => {
        const where = `${route.path} #${i}`;
        if (data["@context"] !== "https://schema.org") problems.push(`${where}: @context`);
        checkNode(data, where, problems);
        const top = data["@type"];
        if (
          ["TechArticle", "WebPage", "CollectionPage", "SoftwareApplication", "ItemList"].includes(
            String(top),
          )
        ) {
          if (data.url !== undefined && data.url !== route.canonicalUrl) {
            problems.push(
              `${where}: ${String(top)}.url ${data.url} != canonical ${route.canonicalUrl}`,
            );
          }
        }
      });
    }
    expect(problems).toEqual([]);
  });

  it("gives each kind of page the structured data it should have", () => {
    const typesOf = (p: string) =>
      rendered.find((r) => r.route.path === p)!.blocks.map((b) => String(b.data["@type"]));
    expect(typesOf("/")).toEqual(expect.arrayContaining(["WebSite", "Organization"]));
    expect(typesOf("/threat-modeler")).toEqual(
      expect.arrayContaining(["SoftwareApplication", "BreadcrumbList"]),
    );
    expect(typesOf("/threats")).toEqual(expect.arrayContaining(["ItemList", "BreadcrumbList"]));
    expect(typesOf("/aisvs")).toContain("DefinedTermSet");
    expect(typesOf("/taxonomy")).toContain("DefinedTermSet");

    for (const { route, blocks } of rendered) {
      const types = blocks.map((b) => String(b.data["@type"]));
      if (route.noindex) {
        expect(types, route.path).toEqual([]);
        continue;
      }
      if (route.path !== "/") expect(types, route.path).toContain("BreadcrumbList");
      if (route.tier === "detail") {
        const article = blocks.find((b) => b.data["@type"] === "TechArticle");
        expect(article, route.path).toBeDefined();
        expect(article!.data.dateModified, route.path).toMatch(ISO_DATE);
      }
    }
  });

  it("writes one canonical, matching robots and a clamped description per page", () => {
    for (const { route, html } of rendered) {
      const canonicals = [...html.matchAll(/rel="canonical" href="([^"]+)"/g)].map((m) => m[1]);
      expect(canonicals, route.path).toEqual([route.canonicalUrl]);
      expect(route.canonicalUrl === `${SITE_ORIGIN}/` || !route.canonicalUrl.endsWith("/")).toBe(
        true,
      );
      const robots = html.match(/name="robots" content="([^"]+)"/)?.[1] ?? "";
      expect(robots.startsWith(route.noindex ? "noindex" : "index"), route.path).toBe(true);
      expect(route.metaDescription.length, route.path).toBeLessThanOrEqual(META_DESCRIPTION_MAX);
      expect(route.metaDescription.length, route.path).toBeGreaterThan(50);
      expect(html.match(/<title>/g), route.path).toHaveLength(1);
      expect(html, route.path).toContain('<main id="main-content"');
      expect(html, route.path).toContain('src="/assets/index-test.js"');
    }
  });

  it("keeps the organization @id stable on the home page", () => {
    const home = rendered.find((r) => r.route.path === "/")!;
    const org = home.blocks.find((b) => b.data["@type"] === "Organization");
    expect(org?.data["@id"]).toBe(ORGANIZATION_ID);
  });
});

describe("sitemap", () => {
  it("lists exactly the indexable canonical URLs", () => {
    const { xml } = buildSitemap(model) as { xml: string };
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, "&"));
    const canonical = model.routes.filter((r) => r.indexable).map((r) => r.canonicalUrl);
    expect(locs).toEqual(canonical);
    expect(new Set(locs).size).toBe(locs.length);
    expect(locs.some((loc) => loc.includes("/progress") || loc.includes("404"))).toBe(false);
  });

  it("sets lastmod, changefreq and priority by page tier", () => {
    const priority: Record<string, string> = {
      home: "1.0",
      catalog: "0.9",
      detail: "0.8",
      tool: "0.7",
    };
    for (const route of model.routes.filter((r) => r.indexable)) {
      expect(route.lastmod, route.path).toMatch(ISO_DATE);
      expect(route.lastmod <= BUILD_DATE, route.path).toBe(true);
      expect(route.changefreq, route.path).toMatch(/^(daily|weekly|monthly|yearly)$/);
      if (route.tier in priority) {
        expect(String(route.priority), route.path).toBe(priority[route.tier]);
      }
    }
    const { xml } = buildSitemap(model) as { xml: string };
    expect(xml).toContain("<priority>1.0</priority>");
    expect(xml).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
  });
});

/**
 * The site model shared by the build-time SEO scripts (scripts/generate-seo.js and
 * scripts/prerender.mjs) and by src/components/layout/__tests__/structuredData.test.ts:
 * every indexable route with its title, description, canonical path, structured data and
 * sitemap fields, built from the same data modules and helpers the pages use.
 *
 *   const mods = await loadSiteModules();          // Vite SSR loader (TS, "@/" alias, JSON)
 *   const model = buildSiteModel(mods, { buildDate: "2026-11-03" });
 *   model.routes  // [{ path, kind, title, description, ogType, noindex, lastmod, ... }]
 *
 * Titles and descriptions mirror the `<PageLayout title description>` props of each page, so the
 * prerendered head matches what react-helmet sets after the app boots. When a page's props change,
 * change STATIC_PAGES (or the detail builders) here too.
 */

import fs from "fs";
import path from "path";
import ts from "typescript";
import { fileURLToPath } from "url";

export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Modules the model needs (Vite ids, relative to the project root). */
export const MODULES = {
  seo: "/src/components/layout/seo.ts",
  nav: "/src/config/navigation.ts",
  security: "/src/components/components/securityData.ts",
  architectures: "/src/components/components/architecturesData.ts",
  framework: "/src/components/components/frameworkData.ts",
  componentIndex: "/src/components/kc-components/componentIndex.ts",
  kc: "/src/data/kc.ts",
  threatIndex: "/src/components/threats/threatIndex.ts",
  frameworkLinks: "/src/components/threats/frameworkLinks.ts",
  modelerLink: "/src/components/threats/modelerLink.ts",
  controlIndex: "/src/components/controls/controlIndex.ts",
  phaseTasks: "/src/components/controls/phaseTasks.ts",
  richText: "/src/components/content/richTextCore.ts",
  top10: "/src/components/components/owaspAgenticTop10Data.ts",
  cisco: "/src/components/components/ciscoTaxonomyData.ts",
  aivss: "/src/components/components/aivssCalcData.ts",
  aiuc1: "/src/components/components/aiuc1Data.ts",
  atlas: "/src/data/atlasCrosswalk.ts",
  aisvs: "/src/data/aisvs.ts",
  nist: "/src/data/nist.ts",
  scenarios: "/src/data/scenarios.ts",
  learning: "/src/data/learningPath.ts",
  sources: "/src/data/sources.ts",
  references: "/src/components/references/referenceIndex.ts",
  siteStats: "/src/components/home/siteStats.ts",
  templates: "/src/components/threat-modeler/templates.ts",
  semanticTypes: "/src/components/threat-modeler/semanticTypes.ts",
  ruleCatalog: "/src/components/threat-modeler/engine/catalog/index.ts",
  modelerTypes: "/src/components/threat-modeler/types.ts",
  shortcuts: "/src/components/threat-modeler/shortcuts.ts",
  severity: "/src/lib/severity.ts",
};

/** Loaded when the file exists (datasets that may not be present in every checkout). */
export const OPTIONAL_MODULES = {
  llmTop10: "/src/components/components/owaspLlmTop10Data.ts",
};

const CHECKLIST_FILE = "src/components/interactive/SecurityChecklist.tsx";

/**
 * Load every module in MODULES (+ the OPTIONAL_MODULES that exist) through Vite's SSR loader,
 * which resolves TS, the "@/" alias, JSON and package imports exactly like the app build.
 */
export async function loadSiteModules({ root = projectRoot, modules = MODULES } = {}) {
  const { createServer } = await import("vite");
  const server = await createServer({
    root,
    configFile: path.join(root, "vite.config.ts"),
    logLevel: "error",
    appType: "custom",
    server: { middlewareMode: true, hmr: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  try {
    const mods = {};
    for (const [key, id] of Object.entries(modules)) mods[key] = await server.ssrLoadModule(id);
    for (const [key, id] of Object.entries(OPTIONAL_MODULES)) {
      if (!fs.existsSync(path.join(root, id))) continue;
      try {
        mods[key] = await server.ssrLoadModule(id);
      } catch (error) {
        console.warn(`seo-model: optional module ${id} failed to load (${error.message}); skipped`);
      }
    }
    mods.checklist = readChecklist(root);
    return mods;
  } finally {
    await server.close();
  }
}

// ── Security checklist (the data is a non-exported const inside a component) ──

function literalValue(node) {
  if (!node) return undefined;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.map(literalValue).filter((v) => v !== undefined);
  }
  if (ts.isObjectLiteralExpression(node)) {
    const out = {};
    for (const prop of node.properties) {
      if (!ts.isPropertyAssignment(prop)) continue;
      const name =
        ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name) ? prop.name.text : null;
      if (!name) continue;
      const value = literalValue(prop.initializer);
      if (value !== undefined) out[name] = value;
    }
    return out;
  }
  if (ts.isAsExpression(node) || ts.isParenthesizedExpression(node)) {
    return literalValue(node.expression);
  }
  return undefined;
}

/** `securityChecklist` from SecurityChecklist.tsx, read from the AST (categories with items). */
export function readChecklist(root = projectRoot) {
  const file = path.join(root, CHECKLIST_FILE);
  if (!fs.existsSync(file)) return [];
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.ES2022,
    true,
    ts.ScriptKind.TSX,
  );
  let result = [];
  const visit = (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === "securityChecklist" &&
      node.initializer
    ) {
      result = literalValue(node.initializer) ?? [];
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return Array.isArray(result) ? result : [];
}

// ── Static routes declared in src/App.tsx ──────────────────────────────────

/** Static, non-redirect page routes in src/App.tsx (no params, no catch-all). */
export function readAppRoutes(root = projectRoot) {
  const text = fs.readFileSync(path.join(root, "src/App.tsx"), "utf8");
  const pages = [];
  const redirects = [];
  for (const match of text.matchAll(/<Route\s+path="(\/[^"]*)"\s+element=\{\s*<(\w+)([^>]*)/g)) {
    const [, routePath, element, rest] = match;
    if (/[:*]/.test(routePath)) continue;
    if (element === "Navigate") {
      const to = rest.match(/to="([^"]+)"/)?.[1];
      if (to) redirects.push({ from: routePath, to });
      continue;
    }
    pages.push({ path: routePath, element });
  }
  // The full-screen modeler route's element is a <Suspense> wrapper.
  return { pages, redirects };
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function isoDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

/** Build date: SOURCE_DATE_EPOCH when set (reproducible builds), else today (UTC). */
export function buildDateFromEnv(env = process.env) {
  const epoch = Number(env.SOURCE_DATE_EPOCH);
  return isoDate(Number.isFinite(epoch) && epoch > 0 ? new Date(epoch * 1000) : new Date());
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Latest valid YYYY-MM-DD among the values, never later than `cap`. */
function latest(values, cap) {
  const dates = values.filter((v) => typeof v === "string" && DATE_RE.test(v)).sort();
  const last = dates[dates.length - 1];
  if (!last) return cap;
  return cap && last > cap ? cap : last;
}

const SITE = "https://agenticsecurity.info";
const isPartOfSite = { "@type": "WebSite", name: "Agentic Security Hub", url: SITE };
const OWASP_ORG = { "@type": "Organization", name: "OWASP", url: "https://owasp.org" };

/** Sitemap priority / change frequency per route kind. */
export const SITEMAP_POLICY = {
  home: { priority: "1.0", changefreq: "weekly" },
  catalog: { priority: "0.9", changefreq: "weekly" },
  detail: { priority: "0.8", changefreq: "monthly" },
  tool: { priority: "0.7", changefreq: "monthly" },
  step: { priority: "0.6", changefreq: "monthly" },
  page: { priority: "0.5", changefreq: "monthly" },
};

// ── Model ──────────────────────────────────────────────────────────────────

/**
 * Every route the prerender writes. `indexable` routes go to the sitemap; the rest
 * (noindex pages, redirect stubs) are written but not listed.
 */
export function buildSiteModel(mods, { buildDate = buildDateFromEnv() } = {}) {
  const { seo, nav, security, threatIndex, controlIndex, componentIndex, kc, sources } = mods;
  const SOURCES = sources.SOURCES;
  const THREATS = threatIndex.THREAT_LIST;
  const CONTROLS = threatIndex.MITIGATION_LIST;
  const ARCHITECTURES = Object.values(mods.architectures.architecturesData).sort(
    (a, b) => (a.displayOrder ?? 99) - (b.displayOrder ?? 99),
  );
  const COMPONENTS = componentIndex.COMPONENT_ENTRIES;
  const SCENARIOS = mods.scenarios.SCENARIOS;
  const STEPS = mods.learning.LEARNING_STEPS;
  const REFERENCES = mods.references.REFERENCES;
  const { aisvsStats, AISVS_VERSION } = mods.aisvs;
  const routes = [];

  const add = (route) => {
    const policy = SITEMAP_POLICY[route.tier] ?? SITEMAP_POLICY.page;
    routes.push({
      ogType: "website",
      noindex: false,
      jsonLd: [],
      extraJsonLd: [],
      ...policy,
      ...route,
      lastmod: latest([route.lastmod], buildDate),
      indexable: route.indexable ?? !route.noindex,
    });
  };

  const navByPath = new Map();
  for (const item of nav.NAV_ITEMS) {
    const base = item.path.split("?")[0];
    if (!navByPath.has(base)) navByPath.set(base, item);
  }

  const itemList = (name, routePath, items) => ({
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    url: seo.absoluteUrl(routePath),
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: seo.absoluteUrl(item.path),
    })),
  });
  const collectionPage = (name, routePath, description, items) => ({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: seo.absoluteUrl(routePath),
    isPartOf: { "@id": seo.WEBSITE_ID, ...isPartOfSite },
    mainEntity: { ...itemList(name, routePath, items), "@context": undefined },
  });
  const techArticle = ({ headline, description, routePath, dateModified, keywords, about }) => ({
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline,
    description,
    url: seo.absoluteUrl(routePath),
    ...(dateModified ? { dateModified } : {}),
    author: { "@type": "Organization", name: "OWASP" },
    publisher: OWASP_ORG,
    ...(about ? { about } : {}),
    ...(keywords ? { keywords } : {}),
    isPartOf: isPartOfSite,
  });

  const threatDates = THREATS.map((t) => t.lastUpdated);
  const controlDates = CONTROLS.map((m) => m.lastUpdated);
  const archDates = ARCHITECTURES.map((a) => a.lastUpdated);
  const dataDate = sources.DATA_RETRIEVED_AT;

  // ── Static pages (mirror each page's <PageLayout> props) ──
  const homeDescription =
    "OWASP-aligned guide to agentic AI security: AI agent threats and controls, OWASP AISVS requirements, NIST AI RMF mapping and a free in-browser threat modeler.";
  add({
    path: "/",
    kind: "home",
    tier: "home",
    title: "OWASP Agentic AI Security: AI Agent Threats, AISVS & Threat Modeling",
    description: homeDescription,
    lastmod: latest([dataDate, ...threatDates, ...controlDates], buildDate),
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Agentic Security Hub",
        description: homeDescription,
        url: "https://agenticsecurity.info/",
        publisher: {
          "@type": "Organization",
          name: "OWASP Securing Agentic Applications",
          url: "https://owasp.org/www-project-securing-agentic-applications/",
        },
        about: [
          { "@type": "Thing", name: "AI agent security" },
          { "@type": "Thing", name: "NIST AI RMF" },
          { "@type": "Thing", name: "OWASP AISVS" },
        ],
      },
    ],
  });

  add({
    path: "/threats",
    kind: "threats",
    tier: "catalog",
    title: "AI Agent Threats",
    description: `The ${threatIndex.THREAT_STATS.threats} OWASP agentic AI threats, from memory poisoning and tool misuse to privilege compromise, with attack vectors, affected components and controls.`,
    lastmod: latest(threatDates, buildDate),
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "AI Agent Threats & Security Risks",
        description: `The ${threatIndex.THREAT_STATS.threats} threats to agentic AI systems from the OWASP Agentic AI Threats and Mitigations guide`,
        url: "https://agenticsecurity.info/threats",
        isPartOf: isPartOfSite,
      },
    ],
    extraJsonLd: [
      itemList(
        "OWASP agentic AI threats",
        "/threats",
        THREATS.map((t) => ({ name: `${t.code} ${t.name}`, path: `/threats/${t.id}` })),
      ),
    ],
  });

  add({
    path: "/controls",
    kind: "controls",
    tier: "catalog",
    title: "Security Controls",
    description:
      "AI security controls for agentic systems, mapped to the threats they mitigate and to OWASP AISVS 1.01 requirements, with design, build and operations guidance.",
    lastmod: latest(controlDates, buildDate),
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "AI Security Controls & AISVS Coverage",
        description: `${controlIndex.CONTROL_STATS.controls} security controls for agentic AI systems mapped to OWASP AISVS ${SOURCES.aisvs.version}`,
        url: "https://agenticsecurity.info/controls",
        isPartOf: isPartOfSite,
      },
    ],
    extraJsonLd: [
      itemList(
        "Agentic AI security controls",
        "/controls",
        CONTROLS.map((m) => ({
          name: `${threatIndex.controlCode(m.id)} ${m.name}`,
          path: `/controls/${m.id}`,
        })),
      ),
    ],
  });

  const kcRoots = kc.KC_ORDER.map((id) => componentIndex.componentEntry(id)).filter(Boolean);
  add({
    path: "/components",
    kind: "components",
    tier: "catalog",
    title: "Agent Components",
    description: `The ${kc.KC_ORDER.length} key components of agentic AI systems, from LLMs and orchestration to memory, tools and the operational environment, and the AI agent threats facing each.`,
    lastmod: latest([SOURCES.kc.retrievedAt, SOURCES.components.retrievedAt], buildDate),
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Key components of agentic AI systems",
        description: "Key components of agentic AI systems and their security considerations",
        url: "https://agenticsecurity.info/components",
        numberOfItems: kcRoots.length,
        itemListElement: kcRoots.map((c, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "TechArticle",
            name: kc.KC[c.kc].name,
            description: c.description,
            url: `https://agenticsecurity.info/components/${c.id}`,
          },
        })),
      },
    ],
  });

  add({
    path: "/architectures",
    kind: "architectures",
    tier: "catalog",
    title: "Agent Architectures",
    description: `${ARCHITECTURES.length} reference architectures for agentic AI, from single sequential agents to hierarchical and swarm designs, with the components, threats and controls of each.`,
    lastmod: latest(archDates, buildDate),
    extraJsonLd: [
      collectionPage(
        "Agentic AI architecture patterns",
        "/architectures",
        "Reference patterns for agentic systems, the components each one uses and the threats it exposes.",
        ARCHITECTURES.map((a) => ({ name: a.name, path: `/architectures/${a.id}` })),
      ),
    ],
  });

  const aisvsChapters = Object.values(mods.aisvs.aisvsData);
  add({
    path: "/aisvs",
    kind: "aisvs",
    tier: "catalog",
    title: "OWASP AISVS",
    description: `Interactive OWASP AI Security Verification Standard (AISVS) ${AISVS_VERSION}: ${aisvsStats.requirements} verification requirements in ${aisvsStats.chapters} chapters by level, with progress tracking and export.`,
    lastmod: latest([SOURCES.aisvs.retrievedAt], buildDate),
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "TechArticle",
        headline: `OWASP AISVS ${AISVS_VERSION} — AI Security Verification Standard`,
        description:
          "Interactive OWASP AI Security Verification Standard with verification requirements by level and the controls that cite them.",
        url: "https://agenticsecurity.info/aisvs",
        isBasedOn: SOURCES.aisvs.url,
        publisher: OWASP_ORG,
        about: { "@type": "Thing", name: "AI Security Verification" },
      },
    ],
    extraJsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "DefinedTermSet",
        "@id": `${SITE}/aisvs#chapters`,
        name: `OWASP AISVS ${AISVS_VERSION} chapters`,
        url: seo.absoluteUrl("/aisvs"),
        isBasedOn: SOURCES.aisvs.url,
        hasDefinedTerm: aisvsChapters.map((c) => ({
          "@type": "DefinedTerm",
          termCode: c.code,
          name: c.name,
          description: c.description,
          url: seo.absoluteUrl(`/aisvs#${c.code}`),
          inDefinedTermSet: `${SITE}/aisvs#chapters`,
        })),
      },
    ],
  });

  add({
    path: "/nist-mapping",
    kind: "nist",
    tier: "catalog",
    title: "NIST AI RMF Mapping",
    description: `The NIST AI RMF 1.0 Core mapped to OWASP AISVS ${AISVS_VERSION}: every function, category and subcategory linked to AISVS chapters, with rationale and GenAI risk tags.`,
    lastmod: latest([SOURCES.nist.retrievedAt, SOURCES.aisvs.retrievedAt], buildDate),
    extraJsonLd: [
      techArticle({
        headline: `NIST AI RMF 1.0 mapped to OWASP AISVS ${AISVS_VERSION}`,
        description: `The ${mods.nist.NIST_SUBCATEGORIES.length} NIST AI RMF Core subcategories mapped to OWASP AISVS chapters, with rationale and NIST AI 600-1 generative-AI risk tags.`,
        routePath: "/nist-mapping",
        dateModified: latest([SOURCES.nist.retrievedAt], buildDate),
        about: { "@type": "Thing", name: "NIST AI Risk Management Framework" },
      }),
    ],
  });

  const top10 = mods.top10.agenticTop10Data;
  const llmTop10 = llmTop10Entries(mods);
  add({
    path: "/taxonomy",
    kind: "taxonomy",
    tier: "catalog",
    title: "Threat Taxonomy",
    description:
      "How the OWASP Agentic Top 10, the OWASP agentic threat catalog, the Cisco AI taxonomy, OWASP AIVSS and AIUC-1 map onto each other.",
    lastmod: latest(
      [
        SOURCES.top10.retrievedAt,
        SOURCES.cisco.retrievedAt,
        SOURCES.atlas.retrievedAt,
        SOURCES.aivss.retrievedAt,
        SOURCES.aiuc1.retrievedAt,
      ],
      buildDate,
    ),
    extraJsonLd: [
      definedTermSet(
        seo,
        `${SITE}/taxonomy#owasp-agentic`,
        "OWASP Top 10 for Agentic Applications",
        SOURCES.top10.url,
        top10.map((e) => ({
          code: e.code,
          name: e.name,
          description: e.description,
          path: `/taxonomy?tab=owasp-agentic&entry=${e.code}`,
        })),
      ),
      ...(llmTop10.length
        ? [
            definedTermSet(
              seo,
              `${SITE}/taxonomy#llm-top10`,
              "OWASP Top 10 for LLM Applications",
              llmTop10Source(mods),
              llmTop10.map((e) => ({
                code: e.code,
                name: e.name,
                description: e.description,
                path: `/taxonomy?tab=llm-top10&entry=${encodeURIComponent(e.entryId)}`,
              })),
            ),
          ]
        : []),
    ],
  });

  add({
    path: "/threat-modeler",
    kind: "threat-modeler",
    tier: "tool",
    title: "Threat Modeler",
    description:
      "Free browser-based threat modeling tool for agentic AI: draw your system and get OWASP agentic threats, MAESTRO layers, attack paths, AISVS coverage and fixes.",
    lastmod: buildDate,
  });
  add({
    path: "/threat-modeler-guide",
    kind: "guide",
    tier: "tool",
    title: "Threat Modeler Guide",
    description:
      "How to threat model an agentic AI system in the Threat Modeler: components, data flows, trust boundaries, MAESTRO layers, every rule, templates and sharing.",
    lastmod: buildDate,
  });
  add({
    path: "/implementation",
    kind: "implementation",
    tier: "tool",
    title: "Lifecycle view",
    description:
      "Every agentic AI security control laid out across the design, build and operations phases, with checklists that track your implementation progress.",
    lastmod: latest(controlDates, buildDate),
  });
  add({
    path: "/interactive",
    kind: "interactive",
    tier: "tool",
    title: "Security Checklist",
    description:
      "Step-by-step AI security implementation checklist with progress tracking, code examples and OWASP AISVS references for securing agentic AI systems.",
    lastmod: buildDate,
  });
  add({
    path: "/references",
    kind: "references",
    tier: "catalog",
    title: "References & Resources",
    description: `${REFERENCES.length} papers, standards, tools and write-ups cited across the agentic AI threat catalog, controls, OWASP AISVS and the Agentic Top 10, linked to every citation.`,
    lastmod: dataDate,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "References & Resources",
        url: "https://agenticsecurity.info/references",
        numberOfItems: REFERENCES.length,
      },
    ],
  });
  add({
    path: "/about",
    kind: "about",
    tier: "page",
    title: "About",
    description:
      "About the Agentic Security Hub: an open, OWASP-aligned companion for securing AI agents, with its sources, methodology, data versions and how to contribute.",
    lastmod: dataDate,
  });
  add({
    path: "/learn",
    kind: "learn",
    tier: "catalog",
    title: "Learning path",
    description: `Learn agentic AI security in ${STEPS.length} steps, from components, threats and controls to AISVS, NIST AI RMF and threat modeling, each with readings and a short quiz.`,
    lastmod: dataDate,
    extraJsonLd: [
      itemList(
        "Agentic AI security learning path",
        "/learn",
        STEPS.map((s) => ({
          name: `Step ${s.number}: ${s.title}`,
          path: mods.learning.learningStepPath(s.id),
        })),
      ),
    ],
  });
  add({
    path: "/progress",
    kind: "progress",
    tier: "page",
    title: "Your progress",
    description:
      "Your AISVS verification, control tasks, checklist, learning path and quiz scores — stored in this browser.",
    noindex: true,
    lastmod: buildDate,
  });

  // ── Detail pages ──
  for (const t of THREATS) {
    add({
      path: `/threats/${t.id}`,
      kind: "threat",
      tier: "detail",
      title: `${t.name} (${t.code})`,
      description: `${t.description} Attack vectors, affected components and mitigations for this agentic AI threat.`,
      ogType: "article",
      lastmod: latest([t.lastUpdated], buildDate),
      entity: t,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "TechArticle",
          headline: t.name,
          description: t.description,
          url: `https://agenticsecurity.info/threats/${t.id}`,
          ...(t.lastUpdated ? { dateModified: t.lastUpdated } : {}),
          author: { "@type": "Organization", name: "OWASP" },
          publisher: OWASP_ORG,
          about: "AI Security Threat",
          keywords: t.tags?.join(", ") || "",
          isPartOf: isPartOfSite,
        },
      ],
    });
  }

  for (const m of CONTROLS) {
    add({
      path: `/controls/${m.id}`,
      kind: "control",
      tier: "detail",
      title: `${m.name} (${threatIndex.controlCode(m.id)})`,
      description: `${m.description} How to implement this AI security control across design, build and operations.`,
      ogType: "article",
      lastmod: latest([m.lastUpdated], buildDate),
      entity: m,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "TechArticle",
          headline: m.name,
          description: m.description,
          url: `https://agenticsecurity.info/controls/${m.id}`,
          ...(m.lastUpdated ? { dateModified: m.lastUpdated } : {}),
          isPartOf: isPartOfSite,
        },
      ],
    });
  }

  for (const entry of COMPONENTS) {
    const kcEntry = kc.KC[entry.kc];
    const isSub = entry.depth > 0;
    const source = isSub ? SOURCES.components : SOURCES.kc;
    const description = entry.description || kcEntry.description;
    const threatIds = entry.depth === 0 ? componentIndex.threatIdsInKc(entry.kc) : entry.threatIds;
    const threatCodes = threatIds
      .map((id) => security.threatsData[id])
      .filter(Boolean)
      .sort(threatIndex.compareThreatCodes)
      .map((t) => t.code);
    add({
      path: `/components/${entry.id}`,
      kind: "component",
      tier: "detail",
      title: `${entry.title} (${entry.code})`,
      description: `${description} Threats, controls and architecture patterns for this agentic AI component.`,
      ogType: "article",
      lastmod: latest([source.retrievedAt], buildDate),
      entity: entry,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "TechArticle",
          headline: entry.title,
          description,
          url: `https://agenticsecurity.info/components/${entry.id}`,
          dateModified: source.retrievedAt,
          author: { "@type": "Organization", name: "OWASP" },
          publisher: OWASP_ORG,
          about: "AI Security",
          keywords: threatCodes.join(", "),
          isPartOf: isPartOfSite,
        },
      ],
    });
  }

  for (const a of ARCHITECTURES) {
    const archTitle = /\barchitecture$/i.test(a.name.trim()) ? a.name : `${a.name} Architecture`;
    add({
      path: `/architectures/${a.id}`,
      kind: "architecture",
      tier: "detail",
      title: archTitle,
      description: `${a.description} Learn about security threats, mitigations, and implementation best practices for this AI architecture pattern.`,
      ogType: "article",
      lastmod: latest([a.lastUpdated], buildDate),
      entity: a,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "TechArticle",
          headline: archTitle,
          description: a.description,
          url: `https://agenticsecurity.info/architectures/${a.id}`,
          ...(a.lastUpdated ? { dateModified: a.lastUpdated } : {}),
          author: { "@type": "Organization", name: "OWASP" },
          publisher: OWASP_ORG,
          about: "AI Architecture Security",
          keywords: a.tags?.join(", ") || "",
          isPartOf: isPartOfSite,
        },
      ],
    });
  }

  for (const s of SCENARIOS) {
    const arch = mods.architectures.architecturesData[s.archId];
    const scenarioPath = mods.scenarios.scenarioPath(s.id);
    const dateModified = latest(
      [s.source === "asi" ? SOURCES.top10.retrievedAt : arch?.lastUpdated],
      buildDate,
    );
    add({
      path: scenarioPath,
      kind: "scenario",
      tier: "detail",
      title: `${s.title} · Attack walkthrough`,
      description: `${s.summary} A step-by-step agentic AI attack walkthrough and the controls that stop it.`,
      ogType: "article",
      lastmod: dateModified,
      entity: s,
      extraJsonLd: [
        techArticle({
          headline: s.title,
          description: s.summary,
          routePath: scenarioPath,
          dateModified,
          about: { "@type": "Thing", name: "Agentic AI attack scenario" },
          keywords: s.threatIds
            .map((id) => security.threatsData[id]?.code)
            .filter(Boolean)
            .join(", "),
        }),
      ],
    });
  }

  for (const step of STEPS) {
    const stepPath = mods.learning.learningStepPath(step.id);
    add({
      path: stepPath,
      kind: "learn-step",
      tier: "step",
      title: `${step.title} · Learning path`,
      description: `${step.summary} Step ${step.number} of ${STEPS.length} in the agentic AI security learning path.`,
      lastmod: dataDate,
      entity: step,
      extraJsonLd: [
        techArticle({
          headline: `Step ${step.number}: ${step.title}`,
          description: step.summary,
          routePath: stepPath,
          dateModified: latest([dataDate], buildDate),
          about: { "@type": "Thing", name: "Agentic AI security" },
        }),
      ],
    });
  }

  // ── Coverage: every page the app routes to is either modelled or deliberately left out ──
  const known = new Set(routes.map((r) => r.path));
  const { pages, redirects } = readAppRoutes();
  const NOT_PRERENDERED = new Set(["/threats/today"]); // client-side redirect to a daily threat
  const missing = [...pages.map((p) => p.path), ...[...navByPath.keys()]].filter(
    (p) => !known.has(p) && !NOT_PRERENDERED.has(p),
  );
  if (missing.length) {
    throw new Error(
      `seo-model: no route model for ${[...new Set(missing)].join(", ")} — add it to scripts/seo-model.mjs`,
    );
  }

  // Head fields every consumer needs, computed once with the app's own helpers.
  for (const route of routes) {
    route.fullTitle = seo.formatTitle(route.title);
    route.metaDescription = seo.metaDescription(route.description);
    route.canonicalUrl = seo.absoluteUrl(seo.normalizePath(route.path));
    route.ogImage = seo.absoluteUrl(`/og/${seo.ogSlug(route.path)}.png`);
    route.nav = navByPath.get(route.path);
    route.dateModified = route.ogType === "article" ? seo.dateModifiedOf(route.jsonLd) : undefined;
    route.headJsonLd = [
      ...route.jsonLd,
      ...seo.autoJsonLd({
        canonicalPath: route.path,
        title: route.title,
        description: route.metaDescription,
        noindex: route.noindex,
      }),
    ];
  }

  return {
    buildDate,
    routes,
    byPath: new Map(routes.map((r) => [r.path, r])),
    redirects,
    notPrerendered: [...NOT_PRERENDERED],
    llmTop10,
    mods,
  };
}

function definedTermSet(seo, id, name, isBasedOn, terms) {
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    "@id": id,
    name,
    url: seo.absoluteUrl("/taxonomy"),
    ...(isBasedOn ? { isBasedOn } : {}),
    hasDefinedTerm: terms.map((t) => ({
      "@type": "DefinedTerm",
      termCode: t.code,
      name: t.name,
      description: t.description,
      url: seo.absoluteUrl(t.path),
      inDefinedTermSet: id,
    })),
  };
}

/**
 * Entries of the optional OWASP Top 10 for LLM Applications dataset, whatever its export is
 * called: the first exported array whose items have an id/code and a name.
 */
export function llmTop10Entries(mods) {
  const mod = mods.llmTop10;
  if (!mod) return [];
  const arrays = Object.values(mod).filter(
    (v) => Array.isArray(v) && v.length && v.every((e) => e && typeof e === "object"),
  );
  const list = arrays.find((a) => a.every((e) => (e.code || e.id) && (e.name || e.title)));
  if (!list) return [];
  return list.map((e) => ({
    ...e,
    code: String(e.code ?? e.id),
    /** Deep-link key (`?entry=`): the rank id ("LLM01") when the dataset has one. */
    entryId: String(e.id ?? e.code),
    name: String(e.name ?? e.title),
    description: String(e.description ?? e.summary ?? ""),
  }));
}

export function llmTop10Source(mods) {
  const src = mods.llmTop10?.source;
  return src && typeof src.url === "string" ? src.url : undefined;
}

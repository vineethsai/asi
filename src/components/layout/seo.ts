/**
 * Head-tag helpers shared by PageLayout (React, per route) and the build-time scripts
 * (scripts/generate-seo.js for the sitemap and OG cards, scripts/prerender.mjs for the static
 * HTML of every route). Keep this module free of data and package imports: it is part of the
 * app shell and is loaded by the scripts through Vite's SSR loader.
 */

export const SITE_NAME = "Agentic Security Hub";
export const SITE_ORIGIN = "https://agenticsecurity.info";
export const SITE_LOGO = `${SITE_ORIGIN}/android-chrome-512x512.png`;
export const OWASP_PROJECT_URL = "https://owasp.org/www-project-securing-agentic-applications/";
export const REPO_URL = "https://github.com/vineethsai/asi";

/** robots for indexable pages: allow large image previews in Search and Discover. */
export const ROBOTS_INDEX = "index, follow, max-image-preview:large";
export const ROBOTS_NOINDEX = "noindex, nofollow";

/** Google shows ~155–160 characters of a meta description. */
export const META_DESCRIPTION_MAX = 160;

/**
 * Attribute on the JSON-LD blocks that only the prerendered HTML carries (ItemList,
 * DefinedTermSet, …). react-helmet does not manage them, so they survive hydration; PageLayout
 * removes them once the visitor navigates to another route. The value is the route's path.
 */
export const PRERENDER_LD_ATTR = "data-prerender-ld";

export type JsonLd = Record<string, unknown>;

/** "/" → "home", "/threats/t1" → "threats-t1". Default OG image is `/og/${ogSlug(path)}.png`. */
export function ogSlug(canonicalPath: string): string {
  const clean = canonicalPath.split(/[?#]/)[0].replace(/^\/+|\/+$/g, "");
  return clean === "" ? "home" : clean.replace(/\//g, "-");
}

/** Site path → absolute URL on the canonical origin (absolute URLs pass through). */
export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_ORIGIN}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

/** "{title} · Agentic Security Hub" (unless the title already names the site). */
export function formatTitle(title: string): string {
  return title.includes(SITE_NAME) ? title : `${title} · ${SITE_NAME}`;
}

/** Path without hash and trailing slash ("/threats/" → "/threats", "" → "/"). */
export function normalizePath(path: string): string {
  const clean = path.split("#")[0].replace(/\/+(\?|$)/, "$1");
  return clean === "" || clean.startsWith("?") ? `/${clean}` : clean;
}

/**
 * Meta description: whitespace collapsed and at most `max` characters. Longer text is cut at the
 * last sentence end that keeps at least 110 characters, otherwise at a word boundary with "…".
 */
export function metaDescription(text: string, max: number = META_DESCRIPTION_MAX): string {
  const clean = String(text ?? "")
    .replace(/\s+/g, " ")
    .trim();
  if (clean.length <= max) return clean;
  const head = clean.slice(0, max + 1);
  const sentenceEnd = Math.max(
    head.lastIndexOf(". "),
    head.lastIndexOf("! "),
    head.lastIndexOf("? "),
  );
  if (sentenceEnd >= 110) return clean.slice(0, sentenceEnd + 1);
  const cut = clean.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  const base = (space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,;:.—–-]+$/, "");
  return `${base}…`;
}

// ── Structured data (schema.org JSON-LD) ──────────────────────────────────

export const ORGANIZATION_ID = `${SITE_ORIGIN}/#organization`;
export const WEBSITE_ID = `${SITE_ORIGIN}/#website`;

/** The site's publisher: an OWASP-aligned open project. */
export function organizationJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: SITE_NAME,
    url: `${SITE_ORIGIN}/`,
    logo: SITE_LOGO,
    description:
      "Open, OWASP-aligned project that maps agentic AI threats to controls, OWASP AISVS requirements and the NIST AI RMF.",
    sameAs: [OWASP_PROJECT_URL, REPO_URL],
  };
}

/** Labels of the first path segment, for breadcrumbs ("/threats/t7" → Threats). */
export const SECTION_LABELS: Readonly<Record<string, string>> = {
  threats: "Threats",
  controls: "Controls",
  components: "Components",
  architectures: "Architectures",
  learn: "Learning path",
  taxonomy: "Taxonomy",
};

export interface BreadcrumbItem {
  name: string;
  /** Site path (may carry a query string). */
  path: string;
}

/**
 * Home › Section › Page for a canonical path. The section level is only added when the section
 * has its own page (SECTION_LABELS); pages without one ("/scenarios/x", "/about") are Home › Page.
 */
export function breadcrumbTrail(canonicalPath: string, title: string): BreadcrumbItem[] {
  const path = normalizePath(canonicalPath);
  if (path === "/") return [];
  const [pathname, query] = path.split("?");
  const segments = pathname.split("/").filter(Boolean);
  const name = title.split(" · ")[0].trim() || title;
  const trail: BreadcrumbItem[] = [{ name: "Home", path: "/" }];
  const section = segments[0];
  const sectionLabel = SECTION_LABELS[section];
  if (sectionLabel && (segments.length > 1 || query)) {
    trail.push({ name: sectionLabel, path: `/${section}` });
  }
  trail.push({ name, path });
  return trail;
}

export function breadcrumbJsonLd(canonicalPath: string, title: string): JsonLd | null {
  const trail = breadcrumbTrail(canonicalPath, title);
  if (trail.length < 2) return null;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/** /threat-modeler: a free, browser-based application. */
export function softwareApplicationJsonLd(description: string): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${SITE_NAME} Threat Modeler`,
    url: absoluteUrl("/threat-modeler"),
    description,
    applicationCategory: "SecurityApplication",
    operatingSystem: "Any (runs in a web browser)",
    browserRequirements: "Requires JavaScript and a modern web browser.",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    publisher: { "@id": ORGANIZATION_ID },
    image: absoluteUrl("/og/threat-modeler.png"),
  };
}

/**
 * Structured data PageLayout adds to every route on top of the page's own `jsonLd`:
 * Organization on the home page, SoftwareApplication on the Threat Modeler and a BreadcrumbList
 * on every other indexable page.
 */
export function autoJsonLd(opts: {
  canonicalPath: string;
  title: string;
  description: string;
  noindex?: boolean;
}): JsonLd[] {
  if (opts.noindex) return [];
  const path = normalizePath(opts.canonicalPath);
  if (path === "/") return [organizationJsonLd()];
  const out: JsonLd[] = [];
  if (path === "/threat-modeler") out.push(softwareApplicationJsonLd(opts.description));
  const crumbs = breadcrumbJsonLd(path, opts.title);
  if (crumbs) out.push(crumbs);
  return out;
}

/** First `dateModified` among the blocks (YYYY-MM-DD), for article:modified_time. */
export function dateModifiedOf(items: readonly JsonLd[]): string | undefined {
  for (const item of items) {
    const value = item?.dateModified;
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) return value;
  }
  return undefined;
}

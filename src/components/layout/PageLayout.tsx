import { Suspense, lazy, memo, useEffect, useMemo, type ReactNode } from "react";
import { Helmet } from "react-helmet";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { reportPageView } from "@/hooks/useAnalytics";
import Footer from "./Footer";
import { useShell, type LayoutSection } from "./shellContext";
import {
  PRERENDER_LD_ATTR,
  ROBOTS_INDEX,
  ROBOTS_NOINDEX,
  SITE_NAME,
  absoluteUrl,
  autoJsonLd,
  dateModifiedOf,
  formatTitle,
  metaDescription,
  normalizePath,
  ogSlug,
  type JsonLd,
} from "./seo";

const SectionRail = lazy(() => import("./SectionRail"));

export interface PageLayoutProps {
  /** Page title without the site suffix; rendered as "{title} · Agentic Security Hub". */
  title: string;
  /** Meta / OG / Twitter description (clamped to 160 characters by metaDescription()). */
  description: string;
  /** Path of the canonical URL, e.g. "/threats/t1" (no origin, no "#"). */
  canonicalPath: string;
  /** OG/Twitter image (absolute URL or site path). Default: `/og/${ogSlug(canonicalPath)}.png`. */
  ogImage?: string;
  /** Renders the section rail (lg+) and the drawer's section list. Detail pages only. */
  section?: LayoutSection;
  /** Entity highlighted in the rail (threat/control/architecture id; component id with dots). */
  activeId?: string;
  /** Full-bleed content: no centered container or page padding (the page manages its own). */
  wide?: boolean;
  noFooter?: boolean;
  /** og:type; detail pages pass "article". */
  ogType?: "website" | "article";
  /** Emit robots noindex (404s, not-found entities). */
  noindex?: boolean;
  keywords?: string;
  /**
   * Structured data; each object becomes one application/ld+json script. PageLayout adds
   * Organization (home), SoftwareApplication (/threat-modeler) and a BreadcrumbList (autoJsonLd),
   * and article:modified_time from the first `dateModified` on article pages.
   */
  jsonLd?: JsonLd | JsonLd[];
  /** Extra classes for the content container. */
  className?: string;
  children: ReactNode;
}

interface PageMetaProps {
  fullTitle: string;
  description: string;
  keywords?: string;
  noindex: boolean;
  canonicalUrl: string;
  ogType: "website" | "article";
  image: string;
  modifiedTime?: string;
  jsonLdText: string[];
}

/**
 * Head tags, memoised on primitive props. react-helmet commits DOM changes on a deferred
 * animation frame and reschedules it on every re-render of a <Helmet>; keeping this subtree
 * out of the page's re-render path (count-ups, lazy chunks, scroll spies) guarantees the
 * commit lands even when frames are throttled.
 */
const PageMeta = memo(
  function PageMeta({
    fullTitle,
    description,
    keywords,
    noindex,
    canonicalUrl,
    ogType,
    image,
    modifiedTime,
    jsonLdText,
  }: PageMetaProps) {
    return (
      <Helmet>
        <title>{fullTitle}</title>
        <meta name="description" content={description} />
        {keywords && <meta name="keywords" content={keywords} />}
        <meta name="robots" content={noindex ? ROBOTS_NOINDEX : ROBOTS_INDEX} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:locale" content="en_US" />
        <meta property="og:type" content={ogType} />
        <meta property="og:title" content={fullTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={image} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={fullTitle} />
        {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={fullTitle} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={image} />
        {jsonLdText.map((text, i) => (
          <script key={i} type="application/ld+json">
            {text}
          </script>
        ))}
      </Helmet>
    );
  },
  (a, b) =>
    a.fullTitle === b.fullTitle &&
    a.description === b.description &&
    a.keywords === b.keywords &&
    a.noindex === b.noindex &&
    a.canonicalUrl === b.canonicalUrl &&
    a.ogType === b.ogType &&
    a.image === b.image &&
    a.modifiedTime === b.modifiedTime &&
    a.jsonLdText.length === b.jsonLdText.length &&
    a.jsonLdText.every((t, i) => t === b.jsonLdText[i]),
);

/**
 * Page shell (IMPROVEMENT_PLAN P1-01). The Header, mobile drawer and skip link live in AppShell
 * (outside the route Suspense boundary); PageLayout owns per-page metadata, the optional
 * section rail, the main landmark, the content container and the footer.
 */
export function PageLayout({
  title,
  description,
  canonicalPath,
  ogImage,
  section,
  activeId,
  wide = false,
  noFooter = false,
  ogType = "website",
  noindex = false,
  keywords,
  jsonLd,
  className,
  children,
}: PageLayoutProps) {
  const { pathname, search } = useLocation();
  const shell = useShell();
  const setSectionInfo = shell?.setSectionInfo;
  const fullTitle = formatTitle(title);
  const metaDesc = metaDescription(description);
  const canonicalUrl = absoluteUrl(normalizePath(canonicalPath));
  const image = absoluteUrl(ogImage ?? `/og/${ogSlug(canonicalPath)}.png`);
  const { ldJson, modifiedTime } = useMemo(() => {
    const items = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
    const all = [...items, ...autoJsonLd({ canonicalPath, title, description: metaDesc, noindex })];
    return {
      ldJson: all.map((item) => JSON.stringify(item)),
      modifiedTime: ogType === "article" ? dateModifiedOf(items) : undefined,
    };
  }, [jsonLd, canonicalPath, title, metaDesc, noindex, ogType]);

  // The prerendered HTML carries extra JSON-LD for its own route (ItemList, DefinedTermSet, …)
  // that react-helmet does not manage; drop it once the visitor is on another route.
  useEffect(() => {
    const here = normalizePath(pathname);
    document.querySelectorAll<HTMLScriptElement>(`script[${PRERENDER_LD_ATTR}]`).forEach((el) => {
      if (el.getAttribute(PRERENDER_LD_ATTR) !== here) el.remove();
    });
  }, [pathname]);

  // Register the section so the mobile drawer can list its entities.
  useEffect(() => {
    if (!setSectionInfo) return;
    setSectionInfo(section ? { section, activeId } : null);
  }, [setSectionInfo, section, activeId]);
  useEffect(() => () => setSectionInfo?.(null), [setSectionInfo]);

  // One page_view per navigation, sent with this page's title.
  useEffect(() => {
    reportPageView(pathname, search, { title: fullTitle });
  }, [pathname, search, fullTitle]);

  const content = (
    <main
      id="main-content"
      tabIndex={-1}
      className={cn(
        "min-w-0 flex-1 outline-none",
        !wide && "container max-w-7xl px-4 py-8 md:px-6",
        className,
      )}
    >
      {children}
    </main>
  );

  return (
    <>
      <PageMeta
        fullTitle={fullTitle}
        description={metaDesc}
        keywords={keywords}
        noindex={noindex}
        canonicalUrl={canonicalUrl}
        ogType={ogType}
        image={image}
        modifiedTime={modifiedTime}
        jsonLdText={ldJson}
      />

      {section ? (
        <div className="flex min-h-[calc(100vh-3.5rem)] items-stretch">
          <Suspense fallback={<div className="hidden w-64 shrink-0 border-r lg:block xl:w-72" />}>
            <SectionRail section={section} activeId={activeId} />
          </Suspense>
          {content}
        </div>
      ) : (
        <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">{content}</div>
      )}

      {!noFooter && <Footer />}
    </>
  );
}

export default PageLayout;

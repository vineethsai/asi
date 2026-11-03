import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, X } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/content/EmptyState";
import { SourceNote } from "@/components/content/SourceNote";
import { ReferenceCard } from "@/components/references/ReferenceCard";
import {
  CITATION_COUNT,
  CITING_KINDS,
  REFERENCES,
  REFERENCE_TYPES,
  filterReferences,
  type CitingKind,
  type ReferenceEntry,
  type ReferenceType,
} from "@/components/references/referenceIndex";
import { SOURCES } from "@/data/sources";
import { usePageTracking } from "@/hooks/useAnalytics";
import { Icon } from "@/lib/icons";

type View = "list" | "domain";
type Sort = "cited" | "az";

const TYPE_IDS = new Set<string>(REFERENCE_TYPES.map((t) => t.id));
const KIND_IDS = new Set<string>(CITING_KINDS.map((k) => k.id));
const DOMAIN_COUNT = new Set(REFERENCES.map((r) => r.host)).size;
const TYPE_TOTALS = REFERENCES.reduce<Record<ReferenceType, number>>(
  (acc, r) => ({ ...acc, [r.type]: acc[r.type] + 1 }),
  { standard: 0, paper: 0, tool: 0, blog: 0 },
);
const COMPILED_FROM = (["threats", "controls", "aisvs", "top10"] as const).map(
  (key) => [key, SOURCES[key]] as const,
);

function sortEntries(entries: ReferenceEntry[], sort: Sort): ReferenceEntry[] {
  if (sort === "az") return entries; // REFERENCES is already A–Z
  return [...entries].sort((a, b) => b.citedBy.length - a.citedBy.length);
}

function groupByDomain(entries: readonly ReferenceEntry[]) {
  const groups = new Map<string, ReferenceEntry[]>();
  for (const e of entries) {
    const list = groups.get(e.host);
    if (list) list.push(e);
    else groups.set(e.host, [e]);
  }
  return [...groups.entries()]
    .map(([host, items]) => ({ host, items }))
    .sort((a, b) => b.items.length - a.items.length || a.host.localeCompare(b.host));
}

function ReferencesPage() {
  usePageTracking("References - AI Security Resources", {
    page_type: "references",
    content_category: "resources",
  });

  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const typeParam = params.get("type");
  const type = typeParam && TYPE_IDS.has(typeParam) ? (typeParam as ReferenceType) : null;
  const citedParam = params.get("cited");
  const cited = citedParam && KIND_IDS.has(citedParam) ? (citedParam as CitingKind) : null;
  const view: View = params.get("view") === "domain" ? "domain" : "list";
  const sort: Sort = params.get("sort") === "az" ? "az" : "cited";

  const setParam = useCallback(
    (key: string, value: string | null) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set(key, value);
          else next.delete(key);
          return next;
        },
        { replace: true, preventScrollReset: true },
      );
    },
    [setParams],
  );

  const clearFilters = useCallback(() => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const k of ["q", "type", "cited"]) next.delete(k);
        return next;
      },
      { replace: true, preventScrollReset: true },
    );
  }, [setParams]);

  const withoutType = useMemo(
    () => filterReferences(REFERENCES, { query, type: null, citedBy: cited }),
    [query, cited],
  );
  const facetCounts = useMemo(() => {
    const counts: Record<ReferenceType, number> = { standard: 0, paper: 0, tool: 0, blog: 0 };
    for (const r of withoutType) counts[r.type] += 1;
    return counts;
  }, [withoutType]);
  const shown = useMemo(
    () => sortEntries(type ? withoutType.filter((r) => r.type === type) : withoutType, sort),
    [withoutType, type, sort],
  );
  const groups = useMemo(() => (view === "domain" ? groupByDomain(shown) : []), [shown, view]);
  const filtersActive = Boolean(query || type || cited);

  return (
    <PageLayout
      title="References & Resources"
      description={`${REFERENCES.length} research papers, standards, tools and write-ups cited across the AI agent threat catalogue, security controls, OWASP AISVS and the OWASP Top 10 for Agentic Applications — de-duplicated and linked back to where each is cited.`}
      canonicalPath="/references"
      keywords="AI security references, AI agents resources, OWASP AISVS references, AI security research, AI threat references, security controls documentation, AI security standards"
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "References & Resources",
        url: "https://agenticsecurity.info/references",
        numberOfItems: REFERENCES.length,
      }}
    >
      <PageHeader
        eyebrow="Resources"
        title="References"
        description="Every external source cited by the threats, controls, AISVS chapters and the OWASP Top 10 for Agentic Applications. Links that point at the same document are merged, and each one links back to everything that cites it."
        stats={[
          {
            label: "references",
            value: REFERENCES.length,
            hint: `Distinct documents after merging ${CITATION_COUNT} citations that share a URL`,
          },
          { label: "citations", value: CITATION_COUNT, hint: "One per citing item per link" },
          { label: "domains", value: DOMAIN_COUNT },
          { label: "standards", value: TYPE_TOTALS.standard },
          { label: "papers", value: TYPE_TOTALS.paper },
        ]}
        filters={
          <>
            <div className="relative min-w-[14rem] flex-1">
              <label htmlFor="references-search" className="sr-only">
                Search references by title, domain or citing item
              </label>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="references-search"
                type="search"
                placeholder="Search titles, domains or a citing id (e.g. T6, ASI02)…"
                value={query}
                onChange={(e) => setParam("q", e.target.value || null)}
                className="pl-9"
              />
            </div>
            <Select
              value={cited ?? "all"}
              onValueChange={(v) => setParam("cited", v === "all" ? null : v)}
            >
              <SelectTrigger className="w-full sm:w-[12rem]" aria-label="Filter by citing source">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Cited by anything</SelectItem>
                {CITING_KINDS.map((k) => (
                  <SelectItem key={k.id} value={k.id}>
                    Cited by {k.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => setParam("sort", v === "az" ? "az" : null)}>
              <SelectTrigger className="w-full sm:w-[10rem]" aria-label="Sort references">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cited">Most cited</SelectItem>
                <SelectItem value="az">Title A–Z</SelectItem>
              </SelectContent>
            </Select>
            <div className="inline-flex rounded-md border p-0.5" role="group" aria-label="View">
              {(["list", "domain"] as const).map((v) => (
                <Button
                  key={v}
                  type="button"
                  size="sm"
                  variant={view === v ? "secondary" : "ghost"}
                  className="h-8"
                  aria-pressed={view === v}
                  onClick={() => setParam("view", v === "list" ? null : v)}
                >
                  {v === "list" ? "List" : "By domain"}
                </Button>
              ))}
            </div>
            {filtersActive && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-10"
              >
                <X className="mr-1 h-4 w-4" aria-hidden />
                Clear
              </Button>
            )}
            <div
              className="flex w-full flex-wrap gap-2"
              role="group"
              aria-label="Filter by reference type"
            >
              <Button
                type="button"
                size="sm"
                variant={type === null ? "default" : "outline"}
                aria-pressed={type === null}
                onClick={() => setParam("type", null)}
              >
                All types
                <span className="ml-1.5 tabular-nums opacity-80">{withoutType.length}</span>
              </Button>
              {REFERENCE_TYPES.map((t) => (
                <Button
                  key={t.id}
                  type="button"
                  size="sm"
                  variant={type === t.id ? "default" : "outline"}
                  aria-pressed={type === t.id}
                  title={t.description}
                  onClick={() => setParam("type", type === t.id ? null : t.id)}
                >
                  <Icon name={t.icon} className="mr-1.5 h-3.5 w-3.5" />
                  {t.label}
                  <span className="ml-1.5 tabular-nums opacity-80">{facetCounts[t.id]}</span>
                </Button>
              ))}
            </div>
          </>
        }
      />

      <section aria-labelledby="references-list-heading">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="references-list-heading" className="text-lg font-semibold">
            {view === "domain" ? "By domain" : "All references"}
          </h2>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            Showing {shown.length} of {REFERENCES.length} references
            {view === "domain" ? ` from ${groups.length} domains` : ""}
          </p>
        </div>

        {shown.length === 0 ? (
          <EmptyState
            title="No references match"
            description="Try a different search term, or clear the type and source filters."
            action={{ label: "Clear filters", onClick: clearFilters }}
          />
        ) : view === "domain" ? (
          <div className="space-y-6">
            {groups.map((g) => (
              <section key={g.host} aria-labelledby={`ref-domain-${g.host}`}>
                <h3
                  id={`ref-domain-${g.host}`}
                  className="mb-2 flex items-baseline gap-2 font-mono text-sm font-semibold"
                >
                  {g.host}
                  <span className="font-sans text-xs font-normal text-muted-foreground">
                    {g.items.length} {g.items.length === 1 ? "reference" : "references"}
                  </span>
                </h3>
                <ul className="grid gap-3">
                  {g.items.map((r) => (
                    <li key={r.key}>
                      <ReferenceCard
                        entry={r}
                        query={query}
                        hideDomain={r.domain === r.host}
                        titleAs="h4"
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <ul className="grid gap-3">
            {shown.map((r) => (
              <li key={r.key}>
                <ReferenceCard entry={r} query={query} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="mt-10 space-y-2 border-t pt-4 text-xs text-muted-foreground">
        <p>
          Compiled from the references in these datasets. Types are inferred from each link&rsquo;s
          host and path; domains are shown as text so no third-party icon service sees your
          browsing.
        </p>
        <ul className="space-y-1">
          {COMPILED_FROM.map(([key, source]) => (
            <li key={key}>
              <SourceNote source={source} prefix="From" />
            </li>
          ))}
        </ul>
      </footer>
    </PageLayout>
  );
}

export default ReferencesPage;

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { BookOpen, GitBranch, Layers, Network, Search, X } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import { PageHeader, type PageHeaderStat } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/content/EmptyState";
import { SourceNote } from "@/components/content/SourceNote";
import { getIcon } from "@/lib/icons";
import { NIST_FUNCTION_PALETTE, withAlpha } from "@/lib/palette";
import { cn } from "@/lib/utils";
import { SOURCES } from "@/data/sources";
import { AISVS_CHAPTER_CODES, AISVS_VERSION, aisvsData } from "@/data/aisvs";
import {
  NIST_AI_RMF_HOME,
  NIST_CATEGORIES,
  NIST_GAI_RISKS,
  NIST_SUBCATEGORIES,
  gaiSource,
  getNistSubcategory,
  nistAIRMF,
  type NistFunctionCode,
} from "@/data/nist";
import { entryDomId, focusEntry } from "@/components/taxonomy/deepLink";
import { NistGraph } from "@/components/nist/NistGraph";
import {
  NistComplianceMatrix,
  type MatrixGranularity,
} from "@/components/nist/NistComplianceMatrix";
import { NistDrawer } from "@/components/nist/NistDrawer";
import { NistSubcategoryCard } from "@/components/nist/NistSubcategoryCard";
import {
  EMPTY_FILTERS,
  categoriesOf,
  chapterCounts,
  chapterName,
  filterSubcategories,
  isFiltered,
  nodeIdFor,
  parseSubParam,
  selectionParam,
  type NistFilters,
  type NistSelection,
} from "@/components/nist/selection";

type TabId = "graph" | "overview" | "mapping" | "matrix";

/** Hash aliases kept from the previous page (old links keep working). */
const HASH_TO_TAB: Record<string, TabId> = {
  graph: "graph",
  "interactive-graph": "graph",
  overview: "overview",
  "framework-overview": "overview",
  mapping: "mapping",
  "detailed-mapping": "mapping",
  matrix: "matrix",
  "compliance-matrix": "matrix",
  "integration-matrix": "matrix",
};
const TAB_TO_HASH: Record<TabId, string> = {
  graph: "interactive-graph",
  overview: "framework-overview",
  mapping: "detailed-mapping",
  matrix: "compliance-matrix",
};
const TABS: { id: TabId; label: string; icon: typeof Network }[] = [
  { id: "graph", label: "Interactive graph", icon: Network },
  { id: "overview", label: "Framework overview", icon: BookOpen },
  { id: "mapping", label: "Detailed mapping", icon: Layers },
  { id: "matrix", label: "Compliance matrix", icon: GitBranch },
];

const ALL = "all";

// Data-wide figures for the header (never literal).
const MAPPED = NIST_SUBCATEGORIES.filter((s) => !s.organizational).length;
const ORGANIZATIONAL = NIST_SUBCATEGORIES.length - MAPPED;
const CHAPTERS_COVERED = AISVS_CHAPTER_CODES.filter((c) =>
  NIST_SUBCATEGORIES.some((s) => s.aisvs.includes(c)),
).length;
const GAI_TAGGED = NIST_SUBCATEGORIES.filter((s) => s.gaiRisks?.length).length;

const HEADER_STATS: PageHeaderStat[] = [
  { label: "functions", value: nistAIRMF.length },
  { label: "categories", value: NIST_CATEGORIES.length },
  { label: "subcategories", value: NIST_SUBCATEGORIES.length },
  {
    label: `mapped to AISVS ${AISVS_VERSION}`,
    value: MAPPED,
    hint: `${ORGANIZATIONAL} subcategories are organizational practices that no AISVS chapter addresses directly.`,
  },
  {
    label: "AISVS chapters covered",
    value: `${CHAPTERS_COVERED}/${AISVS_CHAPTER_CODES.length}`,
    hint: "AISVS chapters that at least one NIST subcategory maps to.",
  },
  {
    label: "with NIST AI 600-1 tags",
    value: GAI_TAGGED,
    hint: "Subcategories for which the Generative AI Profile lists suggested actions and GAI risks.",
  },
];

export const NISTMapping = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const subParam = searchParams.get("sub");

  const [filters, setFilters] = useState<NistFilters>(EMPTY_FILTERS);
  const [selection, setSelection] = useState<NistSelection | null>(null);
  const [openCats, setOpenCats] = useState<string[]>([]);
  const [granularity, setGranularity] = useState<MatrixGranularity>("category");

  const hashTab = HASH_TO_TAB[location.hash.replace(/^#/, "")];
  const activeTab: TabId = hashTab ?? "graph";

  const filtered = useMemo(() => filterSubcategories(filters), [filters]);
  const filteredSet = useMemo(() => new Set(filtered.map((s) => s.code)), [filtered]);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const selectionRef = useRef(selection);
  selectionRef.current = selection;

  // ── URL sync: ?sub= and the tab hash, both with replaceState ──────────────
  const selfWrite = useRef(false);
  const updateUrl = useCallback(
    (changes: { sub?: string | null; tab?: TabId }) => {
      const params = new URLSearchParams(location.search);
      let subChanged = false;
      if (changes.sub !== undefined && (params.get("sub") ?? null) !== changes.sub) {
        subChanged = true;
        if (changes.sub) params.set("sub", changes.sub);
        else params.delete("sub");
      }
      const hash = changes.tab ? `#${TAB_TO_HASH[changes.tab]}` : location.hash;
      if (!subChanged && hash === location.hash) return;
      if (subChanged) selfWrite.current = true;
      const search = params.toString();
      navigate(
        { pathname: location.pathname, search: search ? `?${search}` : "", hash },
        { replace: true },
      );
    },
    [location.pathname, location.search, location.hash, navigate],
  );

  // Deep-link focus requests (external navigation, "Show in detailed mapping").
  const pendingFocus = useRef<NistSelection | null>(null);
  const [focusTick, setFocusTick] = useState(0);
  const requestFocus = useCallback((sel: NistSelection) => {
    const catCode =
      sel.kind === "subcategory"
        ? getNistSubcategory(sel.code)?.categoryCode
        : sel.kind === "category"
          ? sel.code
          : undefined;
    if (catCode) setOpenCats((prev) => (prev.includes(catCode) ? prev : [...prev, catCode]));
    pendingFocus.current = sel;
    setFocusTick((t) => t + 1);
  }, []);

  // URL → state. Our own writes are skipped; anything else is an external deep link.
  useEffect(() => {
    if (selfWrite.current) {
      selfWrite.current = false;
      return;
    }
    const parsed = parseSubParam(subParam);
    const cur = selectionRef.current;
    if (!parsed) {
      if (!subParam && cur && cur.kind !== "chapter") setSelection(null);
      return;
    }
    if (cur && cur.kind === parsed.kind && cur.code === parsed.code) return;
    // Make sure the target is not hidden by the current filters.
    if (parsed.kind === "subcategory") {
      const visible = filterSubcategories(filtersRef.current).some((s) => s.code === parsed.code);
      if (!visible) setFilters(EMPTY_FILTERS);
    }
    setSelection(parsed);
    requestFocus(parsed);
  }, [subParam, requestFocus]);

  // Scroll a pending deep-link target into view once the mapping tab shows it.
  useEffect(() => {
    const sel = pendingFocus.current;
    if (!sel || activeTab !== "mapping") return;
    pendingFocus.current = null;
    const id =
      sel.kind === "subcategory"
        ? entryDomId(sel.code, "sub")
        : sel.kind === "category"
          ? entryDomId(sel.code, "cat")
          : entryDomId(sel.code, "fn");
    void focusEntry(id);
  }, [focusTick, activeTab]);

  const select = useCallback(
    (sel: NistSelection | null) => {
      setSelection(sel);
      updateUrl({ sub: selectionParam(sel) });
    },
    [updateUrl],
  );
  const close = useCallback(() => select(null), [select]);

  const setTab = useCallback(
    (value: string) => updateUrl({ tab: (value in TAB_TO_HASH ? value : "graph") as TabId }),
    [updateUrl],
  );

  /** Select a NIST code, switch to the detailed mapping and scroll it into view. */
  const showInMapping = useCallback(
    (code: string) => {
      const sel = parseSubParam(code);
      if (!sel) return;
      if (sel.kind === "subcategory" && !filteredSet.has(sel.code)) setFilters(EMPTY_FILTERS);
      setSelection(sel);
      updateUrl({ sub: selectionParam(sel), tab: "mapping" });
      requestFocus(sel);
    },
    [filteredSet, requestFocus, updateUrl],
  );

  const setGai = useCallback(
    (id: string) => setFilters((f) => ({ ...f, gai: f.gai === id ? ALL : id })),
    [],
  );

  // ── Derived views ─────────────────────────────────────────────────────────
  const filteredCats = useMemo(() => categoriesOf(filtered), [filtered]);
  const filteredFns = useMemo(
    () => nistAIRMF.filter((f) => filtered.some((s) => s.functionCode === f.code)),
    [filtered],
  );
  const chapterTotals = useMemo(() => chapterCounts(filtered), [filtered]);
  const chapterMax = Math.max(1, ...Object.values(chapterTotals));
  const filteredActive = isFiltered(filters);
  const selectedSub = selection?.kind === "subcategory" ? selection.code : null;
  const chapterContext =
    selection?.chapter ?? (filters.chapter !== ALL ? filters.chapter : undefined);

  const filterControls = (
    <>
      <div className="relative min-w-[14rem] flex-1">
        <label htmlFor="nist-search" className="sr-only">
          Search NIST subcategories
        </label>
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id="nist-search"
          type="search"
          placeholder="Search codes, NIST text, AISVS chapters, GAI risks…"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          className="pl-9"
        />
      </div>
      <Select
        value={filters.fn}
        onValueChange={(v) => setFilters((f) => ({ ...f, fn: v as NistFunctionCode | "all" }))}
      >
        <SelectTrigger aria-label="Filter by NIST function" className="w-full sm:w-[11rem]">
          <SelectValue placeholder="All functions" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All functions</SelectItem>
          {nistAIRMF.map((fn) => (
            <SelectItem key={fn.code} value={fn.code}>
              <span className="inline-flex items-center gap-2">
                <span
                  aria-hidden
                  className="h-2 w-2 rounded-full"
                  style={{ background: NIST_FUNCTION_PALETTE[fn.code].css }}
                />
                {fn.code}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={filters.chapter}
        onValueChange={(v) => setFilters((f) => ({ ...f, chapter: v }))}
      >
        <SelectTrigger aria-label="Filter by AISVS chapter" className="w-full sm:w-[13rem]">
          <SelectValue placeholder="All AISVS chapters" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All AISVS chapters</SelectItem>
          {AISVS_CHAPTER_CODES.map((c) => (
            <SelectItem key={c} value={c}>
              {c} · {chapterName(c)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={filters.gai} onValueChange={(v) => setFilters((f) => ({ ...f, gai: v }))}>
        <SelectTrigger
          aria-label="Filter by NIST AI 600-1 GAI risk"
          className="w-full sm:w-[13rem]"
        >
          <SelectValue placeholder="All GAI risks" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All GAI risks (AI 600-1)</SelectItem>
          {NIST_GAI_RISKS.map((r) => (
            <SelectItem key={r.id} value={r.id}>
              {r.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {filteredActive && (
        <Button type="button" variant="ghost" size="sm" onClick={() => setFilters(EMPTY_FILTERS)}>
          <X aria-hidden className="mr-1 h-3.5 w-3.5" />
          Clear filters
        </Button>
      )}
    </>
  );

  const empty = (
    <EmptyState
      icon="filter"
      title="No subcategories match the filters"
      description="Try a different search term or clear a filter."
      action={{ label: "Clear filters", onClick: () => setFilters(EMPTY_FILTERS) }}
    />
  );

  return (
    <PageLayout
      title="NIST AI RMF Mapping"
      description={`The NIST AI Risk Management Framework (AI RMF 1.0) Core mapped to OWASP AISVS ${AISVS_VERSION}: a function → category → subcategory → AISVS chapter graph, the detailed mapping with rationale, a compliance matrix and NIST AI 600-1 generative-AI risk tags.`}
      canonicalPath="/nist-mapping"
      keywords="NIST AI RMF mapping, NIST AI 600-1, Generative AI Profile, OWASP AISVS mapping, AI risk management, AI governance, AI security verification, agentic AI compliance"
    >
      <div
        className={cn(
          "transition-[padding] duration-200 motion-reduce:transition-none",
          selection && "lg:pr-[28rem]",
        )}
      >
        <PageHeader
          eyebrow="Framework mapping"
          title="NIST AI RMF Mapping"
          description={`How the NIST AI Risk Management Framework 1.0 Core lines up with the OWASP AI Security Verification Standard ${AISVS_VERSION}, with the NIST AI 600-1 Generative AI Profile risks each subcategory addresses.`}
          stats={HEADER_STATS}
          filters={filterControls}
          source={SOURCES.nist}
        />

        <p className="mb-4 text-sm text-muted-foreground" aria-live="polite">
          {filteredActive
            ? `Showing ${filtered.length} of ${NIST_SUBCATEGORIES.length} subcategories in ${filteredCats.length} categories. Filters apply to every tab.`
            : "Category and subcategory names are short labels by this site; the NIST wording is shown with each."}
        </p>

        <Tabs value={activeTab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            {TABS.map(({ id, label, icon: Ico }) => (
              <TabsTrigger key={id} value={id} className="gap-2">
                <Ico aria-hidden className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only">{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── Graph ─────────────────────────────────────────────────────── */}
          <TabsContent value="graph" className="mt-6">
            <h2 className="sr-only">Interactive graph</h2>
            {filtered.length === 0 ? (
              empty
            ) : (
              <NistGraph
                subcategories={filtered}
                chapterFilter={filters.chapter !== ALL ? filters.chapter : undefined}
                selectedNodeId={nodeIdFor(selection)}
                onSelect={select}
                onActivate={(sel) =>
                  sel.kind === "chapter" ? select(sel) : showInMapping(sel.code)
                }
              />
            )}
          </TabsContent>

          {/* ── Overview ──────────────────────────────────────────────────── */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            <h2 className="sr-only">Framework overview</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {nistAIRMF.map((fn) => {
                const Ico = getIcon(fn.icon);
                const all = NIST_SUBCATEGORIES.filter((s) => s.functionCode === fn.code);
                const shown = filtered.filter((s) => s.functionCode === fn.code);
                const token = NIST_FUNCTION_PALETTE[fn.code];
                return (
                  <button
                    key={fn.code}
                    type="button"
                    onClick={() => select({ kind: "function", code: fn.code })}
                    aria-pressed={selection?.kind === "function" && selection.code === fn.code}
                    className="card-hover flex flex-col gap-2 rounded-lg border border-l-4 bg-card p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    style={{ borderLeftColor: token.css }}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md"
                        style={{ background: withAlpha(token, 0.15), color: token.css }}
                      >
                        <Ico aria-hidden className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="block font-mono text-xs text-muted-foreground">
                          {fn.code}
                        </span>
                        <span className="block font-semibold">{fn.name}</span>
                      </span>
                    </span>
                    <span className="text-sm text-muted-foreground">{fn.description}</span>
                    <span className="mt-auto text-xs tabular-nums text-muted-foreground">
                      {fn.categories.length} categories ·{" "}
                      {filteredActive ? `${shown.length} of ${all.length}` : all.length}{" "}
                      subcategories · {all.filter((s) => !s.organizational).length} mapped to AISVS
                    </span>
                  </button>
                );
              })}
            </div>

            <Card>
              <CardContent className="space-y-3 p-4 sm:p-6">
                <h3 className="font-semibold">AISVS {AISVS_VERSION} chapters</h3>
                <p className="text-sm text-muted-foreground">
                  Number of {filteredActive ? "matching " : ""}NIST subcategories mapped to each
                  chapter. Select a chapter for its NIST subcategories.
                </p>
                <ul className="grid gap-1.5 md:grid-cols-2">
                  {AISVS_CHAPTER_CODES.map((c) => {
                    const n = chapterTotals[c];
                    return (
                      <li key={c}>
                        <button
                          type="button"
                          onClick={() => select({ kind: "chapter", code: c })}
                          aria-pressed={selection?.kind === "chapter" && selection.code === c}
                          className="grid w-full grid-cols-[3rem_1fr_auto] items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <span className="font-mono text-xs font-semibold">{c}</span>
                          <span className="min-w-0">
                            <span className="block truncate">{aisvsData[c]?.name}</span>
                            <span aria-hidden className="mt-1 block h-1.5 rounded-full bg-muted">
                              <span
                                className="block h-full rounded-full bg-primary/70"
                                style={{ width: `${(n / chapterMax) * 100}%` }}
                              />
                            </span>
                          </span>
                          <span className="text-xs tabular-nums text-muted-foreground">{n}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Detailed mapping ──────────────────────────────────────────── */}
          <TabsContent value="mapping" className="mt-6 space-y-6">
            <h2 className="sr-only">Detailed mapping</h2>
            {filtered.length === 0
              ? empty
              : filteredFns.map((fn) => {
                  const token = NIST_FUNCTION_PALETTE[fn.code];
                  const cats = filteredCats.filter((c) => c.functionCode === fn.code);
                  return (
                    <Card
                      key={fn.code}
                      id={entryDomId(fn.code, "fn")}
                      className="scroll-mt-24 overflow-hidden border-l-4"
                      style={{ borderLeftColor: token.css }}
                    >
                      <CardContent className="p-4 sm:p-6">
                        <h3 className="text-lg font-semibold">
                          <span className="font-mono text-sm text-muted-foreground">{fn.code}</span>{" "}
                          {fn.name}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">{fn.description}</p>
                        <Accordion
                          type="multiple"
                          className="mt-3"
                          value={openCats.filter((c) => cats.some((x) => x.code === c))}
                          onValueChange={(vals) =>
                            setOpenCats((prev) => [
                              ...prev.filter((c) => !cats.some((x) => x.code === c)),
                              ...vals,
                            ])
                          }
                        >
                          {cats.map((cat) => {
                            const subs = filtered.filter((s) => s.categoryCode === cat.code);
                            return (
                              <AccordionItem
                                key={cat.code}
                                value={cat.code}
                                id={entryDomId(cat.code, "cat")}
                                className="scroll-mt-24"
                              >
                                <AccordionTrigger className="text-left hover:no-underline">
                                  <span className="flex min-w-0 items-start gap-3">
                                    <span className="mt-0.5 shrink-0 rounded border px-1.5 py-0.5 font-mono text-xs">
                                      {cat.code}
                                    </span>
                                    <span className="min-w-0">
                                      <span className="block font-medium">{cat.name}</span>
                                      <span className="block text-xs font-normal text-muted-foreground">
                                        {filteredActive
                                          ? `${subs.length} of ${cat.subcategories.length}`
                                          : subs.length}{" "}
                                        subcategories ·{" "}
                                        {subs.filter((s) => !s.organizational).length} mapped
                                      </span>
                                    </span>
                                  </span>
                                </AccordionTrigger>
                                <AccordionContent className="space-y-3 pb-4">
                                  <p className="text-sm text-muted-foreground">
                                    <span className="font-medium text-foreground">NIST: </span>
                                    {cat.description}
                                  </p>
                                  {subs.map((sub) => (
                                    <NistSubcategoryCard
                                      key={sub.code}
                                      sub={sub}
                                      selected={selectedSub === sub.code}
                                      chapterEmphasis={chapterContext}
                                      gaiSelected={filters.gai !== ALL ? filters.gai : undefined}
                                      onSelect={(code) =>
                                        select(
                                          selectedSub === code
                                            ? null
                                            : { kind: "subcategory", code },
                                        )
                                      }
                                      onGaiFilter={setGai}
                                    />
                                  ))}
                                </AccordionContent>
                              </AccordionItem>
                            );
                          })}
                        </Accordion>
                      </CardContent>
                    </Card>
                  );
                })}
          </TabsContent>

          {/* ── Compliance matrix ─────────────────────────────────────────── */}
          <TabsContent value="matrix" className="mt-6">
            <h2 className="sr-only">Compliance matrix</h2>
            <NistComplianceMatrix
              subcategories={filtered}
              selection={selection}
              onSelect={select}
              granularity={granularity}
              onGranularityChange={setGranularity}
            />
          </TabsContent>
        </Tabs>

        <aside
          aria-labelledby="nist-about-heading"
          className="mt-10 space-y-2 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground"
        >
          <h2 id="nist-about-heading" className="font-semibold text-foreground">
            About this mapping
          </h2>
          <p>
            This page follows the AI RMF 1.0 Core (NIST AI 100-1, January 2023). NIST is updating
            the AI RMF; check the{" "}
            <a
              href={NIST_AI_RMF_HOME}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline-offset-2 hover:underline"
            >
              NIST AI RMF page
            </a>{" "}
            for the current status.
          </p>
          <p>
            The AISVS {AISVS_VERSION} mapping and its rationale are editorial: neither NIST nor
            OWASP publishes this crosswalk. Subcategories that describe purely organizational
            practices map to no chapter. The NIST AI 600-1 risk tags are this site&apos;s reading of
            the profile&apos;s suggested-action tables. Category and subcategory names are short
            labels by this site.
          </p>
          <div className="space-y-0.5 pt-1">
            <SourceNote source={SOURCES.nist} />
            <SourceNote source={gaiSource} prefix="GAI risk tags" />
            <SourceNote source={SOURCES.aisvs} prefix="AISVS" />
          </div>
        </aside>
      </div>

      <NistDrawer
        selection={selection}
        onClose={close}
        onSelect={select}
        onShowInMapping={showInMapping}
        onGaiFilter={setGai}
      />
    </PageLayout>
  );
};

export default NISTMapping;

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Archive, Download, FileJson, RotateCcw, Search, Target, X } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Accordion } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { StackedBars } from "@/components/charts/StackedBars";
import { EmptyState } from "@/components/content/EmptyState";
import { SeverityBadge } from "@/components/content/SeverityBadge";
import { SourceNote } from "@/components/content/SourceNote";
import { ChapterPanel, type VisibleSection } from "@/components/aisvs/ChapterPanel";
import {
  AISVS_CHAPTERS,
  AISVS_LEVELS,
  REQUIREMENT_IDS_BY_LEVEL,
  citationOf,
  normalizeQuery,
  parseAisvsAnchor,
  requirementMatches,
  type AisvsLevel,
} from "@/components/aisvs/aisvsIndex";
import {
  buildAisvsCsv,
  buildAisvsJson,
  copyToClipboard,
  downloadText,
} from "@/components/aisvs/exportProgress";
import { useLevelMilestone } from "@/components/aisvs/useLevelMilestone";
import { focusEntry, highlightElement } from "@/components/taxonomy/deepLink";
import { AISVS_VERSION, aisvsStats, type AISVSRequirement } from "@/data/aisvs";
import { SOURCES } from "@/data/sources";
import { useAisvsProgress } from "@/hooks/useProgress";
import { usePageTracking } from "@/hooks/useAnalytics";
import { aisvsLevelBand } from "@/lib/severity";

type StatusFilter = "all" | "open" | "done";

const uniq = (xs: string[]) => [...new Set(xs)];

/** Chapters and sections that contain a search hit (for auto-expanding on search). */
function searchHits(q: string): { chapters: string[]; sections: string[] } {
  const chapters: string[] = [];
  const sections: string[] = [];
  if (!q) return { chapters, sections };
  for (const ch of AISVS_CHAPTERS) {
    const chapterHit =
      ch.name.toLowerCase().includes(q) || ch.description.toLowerCase().includes(q);
    let any = false;
    for (const s of ch.subCategories) {
      const hit =
        chapterHit ||
        s.name.toLowerCase().includes(q) ||
        s.requirements.some((r) => requirementMatches(r, q));
      if (hit) {
        sections.push(s.code);
        any = true;
      }
    }
    if (any) chapters.push(ch.code);
  }
  return { chapters, sections };
}

/** Rewrite the hash without a router navigation (keeps the entry shareable, no re-scroll). */
function writeHash(code: string | null) {
  if (typeof window === "undefined") return;
  const { pathname, search } = window.location;
  window.history.replaceState(
    window.history.state,
    "",
    `${pathname}${search}${code ? `#${code}` : ""}`,
  );
}

function AisvsPage() {
  usePageTracking("AISVS - AI Security Verification Standard", {
    page_type: "aisvs",
    content_category: "security_standards",
  });

  const total = aisvsStats.requirements;
  const {
    checked,
    count,
    pct,
    toggle,
    setMany,
    reset,
    showArchivedNotice,
    archivedCount,
    dismissArchivedNotice,
  } = useAisvsProgress(total);

  const [rawQuery, setRawQuery] = useState("");
  const [chapterFilter, setChapterFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<AisvsLevel | null>(null);
  const [status, setStatus] = useState<StatusFilter>("all");
  /** Rows checked while "not verified" is active stay visible until the filters change. */
  const [sticky, setSticky] = useState<Set<string>>(() => new Set());
  const [openChapters, setOpenChapters] = useState<string[]>([]);
  const [openSections, setOpenSections] = useState<string[]>([]);

  const q = normalizeQuery(rawQuery);
  const filtersActive = !!q || chapterFilter !== "all" || levelFilter !== null || status !== "all";

  // Filters changed → drop sticky rows.
  useEffect(() => setSticky(new Set()), [q, chapterFilter, levelFilter, status]);

  const handleToggle = useCallback(
    (id: string) => {
      if (status === "open" && !checked.has(id)) {
        setSticky((prev) => new Set(prev).add(id));
      }
      toggle(id);
    },
    [status, checked, toggle],
  );

  const handleSetMany = useCallback(
    (ids: readonly string[], done: boolean) => {
      if (done && status === "open") setSticky((prev) => new Set([...prev, ...ids]));
      setMany(ids, done);
    },
    [status, setMany],
  );

  // ── Search: auto-expand hits, restore the previous expansion when cleared ──
  const preSearch = useRef<{ chapters: string[]; sections: string[] } | null>(null);
  useEffect(() => {
    if (q) {
      if (!preSearch.current)
        preSearch.current = { chapters: openChapters, sections: openSections };
      const hits = searchHits(q);
      setOpenChapters(hits.chapters);
      setOpenSections(hits.sections);
    } else if (preSearch.current) {
      setOpenChapters(preSearch.current.chapters);
      setOpenSections(preSearch.current.sections);
      preSearch.current = null;
    }
    // Only the query drives this; the expansion state is read as a snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // ── Deep links: #C5 · #C5.1 · #C5.1.2 (also V-prefixed and bare numbers) ──
  const location = useLocation();
  useEffect(() => {
    const anchor = parseAisvsAnchor(location.hash);
    if (!anchor) return;
    setRawQuery("");
    setChapterFilter("all");
    setLevelFilter(null);
    setStatus("all");
    preSearch.current = null;
    setOpenChapters((prev) => uniq([...prev, anchor.chapter]));
    if (anchor.section) setOpenSections((prev) => uniq([...prev, anchor.section!]));
    void focusEntry(anchor.target, { block: anchor.requirement ? "center" : "start" });
    // location.key changes on every navigation, so a repeated palette jump re-focuses.
  }, [location.key, location.hash]);

  const onChaptersChange = useCallback(
    (next: string[]) => {
      const opened = next.find((c) => !openChapters.includes(c));
      if (opened) writeHash(opened);
      setOpenChapters(next);
    },
    [openChapters],
  );

  const onSectionsChange = useCallback(
    (chapter: string, next: string[]) => {
      const opened = next.find((s) => !openSections.includes(s));
      if (opened) writeHash(opened);
      const others = openSections.filter((s) => !s.startsWith(`${chapter}.`));
      setOpenSections(uniq([...others, ...next]));
    },
    [openSections],
  );

  const onAnchor = useCallback((code: string) => {
    writeHash(code);
    const el = document.getElementById(code);
    if (el) highlightElement(el);
    const url = `${window.location.origin}${window.location.pathname}#${code}`;
    void copyToClipboard(url).then((ok) => {
      if (ok) toast.success(`Link to ${code} copied`);
    });
  }, []);

  const onCopy = useCallback((req: AISVSRequirement) => {
    const citation = citationOf(req);
    void copyToClipboard(citation).then((ok) =>
      ok ? toast.success(`Copied ${citation}`) : toast.error("Could not copy to the clipboard"),
    );
  }, []);

  // ── Visible tree ──
  const visible = useMemo(() => {
    const out: { chapter: (typeof AISVS_CHAPTERS)[number]; sections: VisibleSection[] }[] = [];
    for (const ch of AISVS_CHAPTERS) {
      if (chapterFilter !== "all" && ch.code !== chapterFilter) continue;
      const chapterHit =
        !!q && (ch.name.toLowerCase().includes(q) || ch.description.toLowerCase().includes(q));
      const sections: VisibleSection[] = [];
      for (const section of ch.subCategories) {
        const sectionHit = chapterHit || (!!q && section.name.toLowerCase().includes(q));
        const requirements = section.requirements.filter((r) => {
          if (levelFilter !== null && r.level !== levelFilter) return false;
          if (status === "done" && !checked.has(r.id)) return false;
          if (status === "open" && checked.has(r.id) && !sticky.has(r.id)) return false;
          return !q || sectionHit || requirementMatches(r, q);
        });
        if (requirements.length) sections.push({ section, requirements });
      }
      if (sections.length) out.push({ chapter: ch, sections });
    }
    return out;
  }, [q, chapterFilter, levelFilter, status, checked, sticky]);

  const shownCount = visible.reduce(
    (n, c) => n + c.sections.reduce((m, s) => m + s.requirements.length, 0),
    0,
  );

  // ── Levels & milestone ──
  const levelDone = useMemo(
    () =>
      Object.fromEntries(
        AISVS_LEVELS.map((l) => [
          l,
          REQUIREMENT_IDS_BY_LEVEL[l].reduce((n, id) => n + (checked.has(id) ? 1 : 0), 0),
        ]),
      ) as Record<AisvsLevel, number>,
    [checked],
  );
  const l1Total = REQUIREMENT_IDS_BY_LEVEL[1].length;
  const l1Complete = l1Total > 0 && levelDone[1] === l1Total;
  const l1Left = l1Total - levelDone[1];

  const shareMilestone = useCallback(() => {
    const text = `I verified all ${l1Total} OWASP AISVS ${AISVS_VERSION} Level 1 requirements.`;
    const url = `${window.location.origin}${window.location.pathname}`;
    if (typeof navigator.share === "function") {
      void navigator.share({ title: "AISVS Level 1 complete", text, url }).catch(() => {});
      return;
    }
    void copyToClipboard(`${text} ${url}`).then((ok) => ok && toast.success("Copied to share"));
  }, [l1Total]);
  useLevelMilestone(1, levelDone[1], l1Total, shareMilestone);

  const applyL1Preset = useCallback(() => {
    const active = levelFilter === 1 && status === "open" && !q && chapterFilter === "all";
    if (active) {
      setLevelFilter(null);
      setStatus("all");
      return;
    }
    setRawQuery("");
    setChapterFilter("all");
    setLevelFilter(1);
    setStatus("open");
    // Expand everything that still has open L1 requirements.
    const chapters: string[] = [];
    const sections: string[] = [];
    for (const ch of AISVS_CHAPTERS) {
      for (const s of ch.subCategories) {
        if (s.requirements.some((r) => r.level === 1 && !checked.has(r.id))) {
          sections.push(s.code);
          if (!chapters.includes(ch.code)) chapters.push(ch.code);
        }
      }
    }
    setOpenChapters(chapters);
    setOpenSections(sections);
  }, [levelFilter, status, q, chapterFilter, checked]);
  const presetActive = levelFilter === 1 && status === "open" && !q && chapterFilter === "all";

  const clearFilters = useCallback(() => {
    setRawQuery("");
    setChapterFilter("all");
    setLevelFilter(null);
    setStatus("all");
  }, []);

  const exportCsv = () =>
    downloadText(
      `aisvs-${AISVS_VERSION}-progress.csv`,
      "text/csv;charset=utf-8",
      buildAisvsCsv(checked),
    );
  const exportJson = () =>
    downloadText(
      `aisvs-${AISVS_VERSION}-progress.json`,
      "application/json",
      buildAisvsJson(checked),
    );
  const resetProgress = () => {
    if (window.confirm(`Clear all ${count} AISVS checkmarks stored in this browser?`)) reset();
  };

  const levelBars = AISVS_LEVELS.map((l) => ({
    id: `L${l}`,
    label: `Level ${l}`,
    done: levelDone[l],
    total: REQUIREMENT_IDS_BY_LEVEL[l].length,
    band: aisvsLevelBand(l),
    hint:
      l === 1
        ? "Baseline for every AI system"
        : l === 2
          ? "Standard assurance (adds to Level 1)"
          : "High assurance (adds to Levels 1 and 2)",
  }));

  return (
    <PageLayout
      title="OWASP AISVS"
      description={`Interactive OWASP AI Security Verification Standard (AISVS) ${AISVS_VERSION}: ${aisvsStats.requirements} verification requirements in ${aisvsStats.chapters} chapters by level, with progress tracking and export.`}
      canonicalPath="/aisvs"
      keywords="OWASP AISVS, AI security verification standard, AI agent security requirements, AISVS 1.01, AI security controls, LLM security verification, agentic systems security"
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "TechArticle",
        headline: `OWASP AISVS ${AISVS_VERSION} — AI Security Verification Standard`,
        description:
          "Interactive OWASP AI Security Verification Standard with verification requirements by level and the controls that cite them.",
        url: "https://agenticsecurity.info/aisvs",
        isBasedOn: SOURCES.aisvs.url,
        publisher: { "@type": "Organization", name: "OWASP", url: "https://owasp.org" },
        about: { "@type": "Thing", name: "AI Security Verification" },
      }}
    >
      <PageHeader
        eyebrow="Verify"
        title="OWASP AISVS"
        description="The AI Security Verification Standard: testable requirements at three assurance levels. Check off what you have verified; progress stays in this browser."
        source={SOURCES.aisvs}
        stats={[
          { label: "chapters", value: aisvsStats.chapters },
          { label: "requirements", value: aisvsStats.requirements },
          {
            label: "Level 1",
            value: aisvsStats.byLevel[0],
            hint: "Baseline requirements every AI system should meet",
          },
          { label: "Level 2", value: aisvsStats.byLevel[1], hint: "Standard assurance" },
          { label: "Level 3", value: aisvsStats.byLevel[2], hint: "High assurance" },
          {
            label: "verified",
            value: `${Math.round(pct)}%`,
            hint: `${count} of ${total} requirements checked in this browser`,
          },
        ]}
        actions={
          <>
            <Button type="button" variant="outline" size="sm" onClick={exportCsv}>
              <Download className="mr-1.5 h-4 w-4" aria-hidden />
              CSV
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={exportJson}>
              <FileJson className="mr-1.5 h-4 w-4" aria-hidden />
              JSON
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetProgress}
              disabled={count === 0}
            >
              <RotateCcw className="mr-1.5 h-4 w-4" aria-hidden />
              Reset
            </Button>
          </>
        }
        filters={
          <>
            <div className="relative min-w-[14rem] flex-1">
              <label htmlFor="aisvs-search" className="sr-only">
                Search requirement text, chapters and sections
              </label>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="aisvs-search"
                type="search"
                placeholder="Search requirements (text or id, e.g. C9.4)…"
                value={rawQuery}
                onChange={(e) => setRawQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={chapterFilter} onValueChange={setChapterFilter}>
              <SelectTrigger className="w-full sm:w-[13rem]" aria-label="Filter by chapter">
                <SelectValue placeholder="All chapters" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All chapters</SelectItem>
                {AISVS_CHAPTERS.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.code} · {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={levelFilter === null ? "all" : String(levelFilter)}
              onValueChange={(v) => setLevelFilter(v === "all" ? null : (Number(v) as AisvsLevel))}
            >
              <SelectTrigger className="w-full sm:w-[9.5rem]" aria-label="Filter by level">
                <SelectValue placeholder="All levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All levels</SelectItem>
                {AISVS_LEVELS.map((l) => (
                  <SelectItem key={l} value={String(l)}>
                    Level {l} only
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
              <SelectTrigger className="w-full sm:w-[10.5rem]" aria-label="Filter by status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any status</SelectItem>
                <SelectItem value="open">Not verified</SelectItem>
                <SelectItem value="done">Verified</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant={presetActive ? "default" : "outline"}
              size="sm"
              aria-pressed={presetActive}
              onClick={applyL1Preset}
              className="h-10"
            >
              <Target className="mr-1.5 h-4 w-4" aria-hidden />
              Verify to L1
              <span className="ml-1.5 tabular-nums opacity-80">
                · {l1Left === 0 ? "done" : `${l1Left} left`}
              </span>
            </Button>
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
          </>
        }
      >
        {l1Complete && (
          <SeverityBadge band="low" size="md" label="Level 1 complete" className="w-fit" />
        )}
      </PageHeader>

      {showArchivedNotice && (
        <Alert className="mb-6">
          <Archive className="h-4 w-4" aria-hidden />
          <AlertTitle>Your earlier AISVS progress was archived</AlertTitle>
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>
              AISVS was updated to {AISVS_VERSION}; {archivedCount} previous checkmark
              {archivedCount === 1 ? " was" : "s were"} archived because the old requirement ids no
              longer exist. Your archive is kept in the progress export.
            </span>
            <Button type="button" size="sm" variant="outline" onClick={dismissArchivedNotice}>
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <section aria-labelledby="aisvs-progress-heading" className="mb-6">
        <h2 id="aisvs-progress-heading" className="sr-only">
          Progress
        </h2>
        <StackedBars
          title="Progress by level"
          description="AISVS levels are cumulative: verifying to Level 2 means all Level 1 and Level 2 requirements. Select a level to filter the list."
          ariaLabel="AISVS requirements verified per level"
          data={levelBars}
          selectedId={levelFilter ? `L${levelFilter}` : null}
          onSelect={(id) => setLevelFilter(id ? (Number(id.slice(1)) as AisvsLevel) : null)}
          doneLabel="verified"
        />
      </section>

      <section aria-labelledby="aisvs-chapters-heading">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="aisvs-chapters-heading" className="text-lg font-semibold">
            Chapters
          </h2>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            Showing {shownCount} of {total} requirements
          </p>
        </div>

        {visible.length === 0 ? (
          <EmptyState
            title="No requirements match"
            description={
              status === "open" && levelFilter === 1
                ? "Every Level 1 requirement is verified."
                : "Try a different search or clear the filters."
            }
            action={{ label: "Clear filters", onClick: clearFilters }}
          />
        ) : (
          <Accordion
            type="multiple"
            value={openChapters}
            onValueChange={onChaptersChange}
            className="space-y-3"
          >
            {visible.map(({ chapter, sections }) => (
              <ChapterPanel
                key={chapter.code}
                chapter={chapter}
                sections={sections}
                checked={checked}
                query={q}
                filtered={filtersActive}
                openSections={openSections.filter((s) => s.startsWith(`${chapter.code}.`))}
                onOpenSectionsChange={onSectionsChange}
                onToggle={handleToggle}
                onSetMany={handleSetMany}
                onCopy={onCopy}
                onAnchor={onAnchor}
                levelFilter={levelFilter}
                onLevelSelect={setLevelFilter}
              />
            ))}
          </Accordion>
        )}
      </section>

      <footer className="mt-8 space-y-1 border-t pt-4">
        <SourceNote source={SOURCES.aisvs} />
        <p className="text-xs text-muted-foreground">
          Requirement text is quoted verbatim from AISVS {AISVS_VERSION}. Control links show which
          of this site&apos;s controls cite a requirement; that mapping is editorial. Cite a
          requirement as {citationOf(AISVS_CHAPTERS[0].subCategories[0].requirements[0])}.
        </p>
      </footer>
    </PageLayout>
  );
}

export default AisvsPage;

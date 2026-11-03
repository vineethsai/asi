import { useMemo } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Search, X } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import PageHeader from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { EmptyState } from "@/components/content/EmptyState";
import { SourceNote } from "@/components/content/SourceNote";
import type { Mitigation } from "@/components/components/securityData";
import {
  AISVS_CHAPTER_CODES,
  aisvsData,
  aisvsRequirements,
  type AISVSRequirement,
} from "@/data/aisvs";
import { SOURCES } from "@/data/sources";
import { Icon } from "@/lib/icons";
import { stagger } from "@/lib/motion";
import { useReveal } from "@/hooks/useReveal";
import { THREAT_LIST, controlCode, threatLabel } from "@/components/threats/threatIndex";
import { ControlCard } from "@/components/controls/ControlCard";
import { ControlCoverage } from "@/components/controls/ControlCoverage";
import {
  CONTROL_LIST,
  CONTROL_STATS,
  citedRequirements,
  controlChapters,
  controlsForRequirement,
  requirementIdsForThreat,
} from "@/components/controls/controlIndex";

type TabKey = "controls" | "aisvs" | "coverage";
const TAB_KEYS: TabKey[] = ["controls", "aisvs", "coverage"];
/** Legacy hash anchors (#security-controls …) and old tab ids → tabs. */
const LEGACY_TABS: Record<string, TabKey> = {
  "security-controls": "controls",
  mitigations: "controls",
  "aisvs-requirements": "aisvs",
  aisvs: "aisvs",
  "integration-matrix": "coverage",
  integration: "coverage",
};
const LEVELS = ["1", "2", "3"] as const;

const sectionName = new Map(
  Object.values(aisvsData).flatMap((c) => c.subCategories.map((s) => [s.code, s.name] as const)),
);

export const Controls = () => {
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const chapterParam = (params.get("chapter") ?? "").toUpperCase();
  const chapter = chapterParam in aisvsData ? chapterParam : null;
  const levelParam = params.get("level") ?? "";
  const level = (LEVELS as readonly string[]).includes(levelParam) ? Number(levelParam) : null;
  const threatParam = (params.get("threat") ?? "").toLowerCase();
  const threat = THREAT_LIST.find((t) => t.id === threatParam) ?? null;
  const tabParam = params.get("tab") ?? "";
  const tab: TabKey = TAB_KEYS.includes(tabParam as TabKey)
    ? (tabParam as TabKey)
    : (LEGACY_TABS[location.hash.replace("#", "")] ?? "controls");

  const update = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value === null || value === "" || value === "all") next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };
  const clearFilters = () => {
    const next = new URLSearchParams(params);
    ["q", "chapter", "level", "threat"].forEach((k) => next.delete(k));
    setParams(next, { replace: true });
  };
  const filtersActive = !!q || !!chapter || level !== null || !!threat;

  const needle = q.trim().toLowerCase();

  const controls = useMemo(
    () =>
      CONTROL_LIST.filter((m: Mitigation) => {
        if (
          needle &&
          ![controlCode(m.id), m.name, m.description, ...(m.tags ?? [])].some((s) =>
            s.toLowerCase().includes(needle),
          )
        )
          return false;
        if (chapter && !controlChapters(m).includes(chapter)) return false;
        if (level !== null && !citedRequirements(m).some((r) => r.level === level)) return false;
        if (threat && !m.threatIds.includes(threat.id)) return false;
        return true;
      }),
    [needle, chapter, level, threat],
  );

  const threatReqs = useMemo(() => (threat ? requirementIdsForThreat(threat.id) : null), [threat]);
  const requirements = useMemo(
    () =>
      aisvsRequirements.filter((r: AISVSRequirement) => {
        if (
          needle &&
          ![
            r.id,
            r.text,
            r.category,
            aisvsData[r.category]?.name ?? "",
            sectionName.get(r.section) ?? "",
          ].some((s) => s.toLowerCase().includes(needle))
        )
          return false;
        if (chapter && r.category !== chapter) return false;
        if (level !== null && r.level !== level) return false;
        if (threatReqs && !threatReqs.has(r.id)) return false;
        return true;
      }),
    [needle, chapter, level, threatReqs],
  );
  const reqByChapter = useMemo(() => {
    const map = new Map<string, AISVSRequirement[]>();
    for (const r of requirements) map.set(r.category, [...(map.get(r.category) ?? []), r]);
    return map;
  }, [requirements]);

  const { ref: gridRef } = useReveal<HTMLDivElement>();
  const filterKey = `${needle}|${chapter}|${level}|${threat?.id}`;
  const empty = (what: string) => (
    <EmptyState
      icon="filter"
      title={`No ${what} match these filters`}
      description="Try another search term, AISVS chapter, level or threat."
      action={{ label: "Clear filters", onClick: clearFilters }}
    />
  );

  return (
    <PageLayout
      title="Security Controls"
      description="AI security controls for agentic systems, mapped to the threats they mitigate and to OWASP AISVS 1.01 requirements, with design, build and operations guidance."
      canonicalPath="/controls"
      keywords="AI security controls, agent security, security mitigations, OWASP AISVS, agentic systems security, LLM security controls, AI security requirements, secure AI development"
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "AI Security Controls & AISVS Coverage",
        description: `${CONTROL_STATS.controls} security controls for agentic AI systems mapped to OWASP AISVS ${SOURCES.aisvs.version}`,
        url: "https://agenticsecurity.info/controls",
        isPartOf: {
          "@type": "WebSite",
          name: "Agentic Security Hub",
          url: "https://agenticsecurity.info",
        },
      }}
    >
      <PageHeader
        eyebrow="Control catalog"
        title="Security controls"
        description="Controls that mitigate the agentic threats, each mapped to OWASP AISVS chapters and requirements and broken into design, build and operations tasks."
        source={SOURCES.controls}
        stats={[
          { label: "controls", value: CONTROL_STATS.controls },
          {
            label: "threats covered",
            value: CONTROL_STATS.threatsCovered,
            hint: "Distinct threats mitigated by at least one control.",
          },
          {
            label: "AISVS requirements cited",
            value: CONTROL_STATS.citedRequirements,
            hint: `Distinct AISVS ${SOURCES.aisvs.version} requirements cited by at least one control, of ${aisvsRequirements.length}.`,
          },
          {
            label: "AISVS chapters",
            value: `${CONTROL_STATS.chaptersCovered}/${AISVS_CHAPTER_CODES.length}`,
            hint: "Chapters with at least one mapped control.",
          },
        ]}
        filters={
          <>
            <div className="relative w-full sm:w-64">
              <label htmlFor="controls-search" className="sr-only">
                Search controls and requirements
              </label>
              <Search
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="controls-search"
                type="search"
                placeholder="Search controls, requirements…"
                value={q}
                onChange={(e) => update("q", e.target.value)}
                className="h-9 pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="controls-chapter" className="text-xs text-muted-foreground">
                AISVS chapter
              </label>
              <Select value={chapter ?? "all"} onValueChange={(v) => update("chapter", v)}>
                <SelectTrigger id="controls-chapter" className="h-9 w-[13rem]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All chapters</SelectItem>
                  {AISVS_CHAPTER_CODES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c} · {aisvsData[c].name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="controls-level" className="text-xs text-muted-foreground">
                Level
              </label>
              <Select
                value={level === null ? "all" : String(level)}
                onValueChange={(v) => update("level", v)}
              >
                <SelectTrigger id="controls-level" className="h-9 w-[7rem]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All levels</SelectItem>
                  {LEVELS.map((l) => (
                    <SelectItem key={l} value={l}>
                      Level {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="controls-threat" className="text-xs text-muted-foreground">
                Threat
              </label>
              <Select value={threat?.id ?? "all"} onValueChange={(v) => update("threat", v)}>
                <SelectTrigger id="controls-threat" className="h-9 w-[12rem]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All threats</SelectItem>
                  {THREAT_LIST.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.code} · {threatLabel(t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {filtersActive && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
                <X aria-hidden className="mr-1 h-4 w-4" />
                Clear
              </Button>
            )}
          </>
        }
      />

      {filtersActive && (
        <p className="mb-4 text-xs text-muted-foreground">
          Filters apply to every tab. Controls match a chapter they map to, a level among the
          requirements they cite, and a threat they mitigate; requirements match their chapter,
          their level, and citation by a control that mitigates the threat.
        </p>
      )}

      <Tabs value={tab} onValueChange={(v) => update("tab", v === "controls" ? null : v)}>
        <TabsList className="mb-6 h-auto flex-wrap">
          <TabsTrigger value="controls">Controls ({controls.length})</TabsTrigger>
          <TabsTrigger value="aisvs">AISVS requirements ({requirements.length})</TabsTrigger>
          <TabsTrigger value="coverage">AISVS coverage</TabsTrigger>
        </TabsList>

        <TabsContent value="controls" className="mt-0">
          {controls.length === 0 ? (
            empty("controls")
          ) : (
            <div ref={gridRef} className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {controls.map((m, i) => (
                <ControlCard key={m.id} control={m} className="enter" style={stagger(i)} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="aisvs" className="mt-0">
          {requirements.length === 0 ? (
            empty("requirements")
          ) : (
            <Accordion
              key={filterKey}
              type="multiple"
              defaultValue={filtersActive && reqByChapter.size <= 3 ? [...reqByChapter.keys()] : []}
              className="w-full"
            >
              {AISVS_CHAPTER_CODES.filter((c) => reqByChapter.has(c)).map((code) => {
                const cat = aisvsData[code];
                const reqs = reqByChapter.get(code) ?? [];
                return (
                  <AccordionItem key={code} value={code}>
                    <AccordionTrigger className="hover:no-underline">
                      <span className="flex items-start gap-3 text-left">
                        <Icon
                          name={cat.icon}
                          className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground"
                        />
                        <span>
                          <span className="block text-base font-semibold">
                            {code} · {cat.name}
                          </span>
                          <span className="mt-0.5 block text-sm font-normal text-muted-foreground">
                            {reqs.length === cat.requirementCount
                              ? `${reqs.length} requirements`
                              : `${reqs.length} of ${cat.requirementCount} requirements`}
                          </span>
                        </span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="mb-4 max-w-3xl text-sm text-muted-foreground">
                        {cat.description}
                      </p>
                      <ul className="space-y-3">
                        {reqs.map((r) => {
                          const citing = controlsForRequirement(r.id);
                          return (
                            <li key={r.id} className="rounded-lg border bg-card p-4">
                              <div className="mb-1 flex flex-wrap items-center gap-2">
                                <Link
                                  to={`/aisvs#${r.id}`}
                                  className="font-mono text-sm font-semibold hover:underline"
                                >
                                  {r.id}
                                </Link>
                                <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                                  Level {r.level}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {sectionName.get(r.section)}
                                </span>
                              </div>
                              <p className="text-sm leading-relaxed text-foreground">{r.text}</p>
                              {citing.length > 0 && (
                                <p className="mt-2 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                                  Cited by
                                  {citing.map((m) => (
                                    <Link
                                      key={m.id}
                                      to={`/controls/${m.id}`}
                                      title={m.name}
                                      className="inline-flex h-5 items-center rounded border px-1.5 font-mono text-[11px] text-foreground hover:bg-muted"
                                    >
                                      {controlCode(m.id)}
                                      <span className="sr-only"> {m.name}</span>
                                    </Link>
                                  ))}
                                </p>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                      {cat.references.length > 0 && (
                        <div className="mt-4 rounded-lg bg-muted/50 p-4">
                          <h4 className="mb-2 text-sm font-semibold">Chapter references</h4>
                          <ul className="space-y-1">
                            {cat.references.map((ref) => (
                              <li key={ref.url}>
                                <a
                                  href={ref.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-primary underline-offset-2 hover:underline"
                                >
                                  {ref.title}
                                  <span className="sr-only"> (opens in a new tab)</span>
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
          <SourceNote source={SOURCES.aisvs} className="mt-6" />
        </TabsContent>

        <TabsContent value="coverage" className="mt-0">
          {controls.length === 0 ? (
            empty("controls")
          ) : (
            <ControlCoverage
              controls={controls}
              chapters={chapter ? [chapter] : AISVS_CHAPTER_CODES}
            />
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Mapping source: each control's <code>aisvsCategories</code> and{" "}
            <code>aisvsRequirements</code> fields (site editorial mapping to AISVS{" "}
            {SOURCES.aisvs.version}, validated by the data checks).
          </p>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
};

export default Controls;

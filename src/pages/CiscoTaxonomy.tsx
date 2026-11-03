import { useEffect, useMemo, useRef, useState } from "react";
import { Info, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { EmptyState } from "@/components/content/EmptyState";
import {
  CISCO_TAXONOMY_VERSION,
  CISCO_V1_DEPRECATED,
  CISCO_V1_DEPRECATIONS,
  CISCO_V1_REUSED_CODES,
  ciscoTaxonomyData,
  getTaxonomyStats,
  type AISubTechnique,
  type AITechnique,
  type ObjectiveGroup,
} from "@/components/components/ciscoTaxonomyData";
import { getIcon } from "@/lib/icons";
import { FRAMEWORK_PALETTE, withAlpha } from "@/lib/palette";
import { cn } from "@/lib/utils";
import type { TaxonomyTabProps } from "@/components/taxonomy/types";
import { entryDomId, focusEntry } from "@/components/taxonomy/deepLink";
import { Chip } from "@/components/taxonomy/tabs/Chip";
import { TabHeading } from "@/components/taxonomy/tabs/TabHeading";
import { groupCiscoMappings } from "@/components/taxonomy/tabs/links";

/** Category → icon registry key (categories come from Cisco's Taxonomy Navigator). */
const CATEGORY_ICON: Record<string, string> = {
  "Common Manipulation Risks": "target",
  "Data-Related Risks": "database",
  "Downstream / Impact Risks": "zap",
};

interface NodePath {
  objective: string;
  technique?: string;
  sub?: string;
}

const PATHS: Map<string, NodePath> = (() => {
  const m = new Map<string, NodePath>();
  for (const og of ciscoTaxonomyData) {
    m.set(og.code.toLowerCase(), { objective: og.code });
    for (const t of og.ai_tech) {
      m.set(t.code.toLowerCase(), { objective: og.code, technique: t.code });
      for (const s of t.ai_subtech) {
        m.set(s.code.toLowerCase(), { objective: og.code, technique: t.code, sub: s.code });
      }
    }
  }
  return m;
})();

const DEPRECATION_BY_V1 = new Map(CISCO_V1_DEPRECATIONS.map((d) => [d.v1.toLowerCase(), d]));
const REUSED = new Set(CISCO_V1_REUSED_CODES.map((c) => c.toLowerCase()));
const V1_KEYS = new Map(Object.keys(CISCO_V1_DEPRECATED).map((k) => [k.toLowerCase(), k]));

interface ResolvedEntry {
  /** v2 code to show. */
  code: string;
  path: NodePath;
  /** Set when the requested code was a v1 code. */
  notice?: { kind: "moved" | "reused"; requested: string; v1Name: string; note: string };
}

function resolveEntry(raw: string | null | undefined): ResolvedEntry | null {
  const key = raw?.trim().toLowerCase();
  if (!key) return null;
  const path = PATHS.get(key);
  const dep = DEPRECATION_BY_V1.get(key);
  if (path) {
    const code = path.sub ?? path.technique ?? path.objective;
    return REUSED.has(key) && dep
      ? {
          code,
          path,
          notice: { kind: "reused", requested: dep.v1, v1Name: dep.v1Name, note: dep.note },
        }
      : { code, path };
  }
  const v1 = V1_KEYS.get(key);
  if (v1 && dep) {
    const target = CISCO_V1_DEPRECATED[v1];
    const targetPath = PATHS.get(target.toLowerCase());
    if (targetPath) {
      return {
        code: target,
        path: targetPath,
        notice: { kind: "moved", requested: v1, v1Name: dep.v1Name, note: dep.note },
      };
    }
  }
  return null;
}

function MappingChips({ mappings }: { mappings: string[] }) {
  const groups = groupCiscoMappings(mappings);
  if (groups.length === 0) return null;
  return (
    <dl className="mt-3 space-y-1.5">
      {groups.map((g) => (
        <div key={g.framework} className="flex flex-wrap items-baseline gap-1.5">
          <dt className="mr-1 text-xs font-medium text-muted-foreground">{g.label}</dt>
          {g.items.map((m) => (
            <dd key={m.code} className="max-w-full">
              <Chip
                to={m.to}
                href={m.href}
                tone={m.tone}
                title={m.label ? `${m.code}: ${m.label}` : m.code}
              >
                <span className="font-mono">{m.code}</span>
                {m.label && <span className="text-muted-foreground"> {m.label}</span>}
              </Chip>
            </dd>
          ))}
        </div>
      ))}
    </dl>
  );
}

function matchesText(node: { code: string; description: string; definition: string }, q: string) {
  return (
    node.code.toLowerCase().includes(q) ||
    node.description.toLowerCase().includes(q) ||
    node.definition.toLowerCase().includes(q)
  );
}

function techniqueMatches(t: AITechnique, q: string) {
  return (
    matchesText(t, q) ||
    t.mappings.some((m) => m.toLowerCase().includes(q)) ||
    t.ai_subtech.some(
      (s: AISubTechnique) =>
        matchesText(s, q) || s.mappings.some((m) => m.toLowerCase().includes(q)),
    )
  );
}

function objectiveMatches(og: ObjectiveGroup, q: string) {
  return matchesText(og, q) || og.ai_tech.some((t) => techniqueMatches(t, q));
}

/** Cisco AI Security and Safety Taxonomy v2 tab (`/taxonomy?tab=cisco&entry=OB-004`). */
export function CiscoTaxonomyContent({ entry, focusKey, onEntryChange }: TaxonomyTabProps) {
  const stats = getTaxonomyStats();
  const initial = resolveEntry(entry);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [openObjectives, setOpenObjectives] = useState<string[]>(() =>
    initial ? [initial.path.objective] : [],
  );
  const [openTechniques, setOpenTechniques] = useState<string[]>(() =>
    initial?.path.technique ? [initial.path.technique] : [],
  );

  const resolved = useMemo(() => resolveEntry(entry), [entry]);
  const resolvedCode = resolved?.code;

  // Keep the requested node expanded when ?entry= changes.
  useEffect(() => {
    if (!resolvedCode) return;
    const path = PATHS.get(resolvedCode.toLowerCase());
    if (!path) return;
    setOpenObjectives((o) => (o.includes(path.objective) ? o : [...o, path.objective]));
    if (path.technique) {
      const tech = path.technique;
      setOpenTechniques((t) => (t.includes(tech) ? t : [...t, tech]));
    }
  }, [resolvedCode]);

  // Scroll + highlight on deep-link requests.
  const resolvedRef = useRef(resolved);
  useEffect(() => {
    resolvedRef.current = resolved;
  });
  useEffect(() => {
    const r = resolvedRef.current;
    if (!focusKey || !r) return;
    const og = ciscoTaxonomyData.find((o) => o.code === r.path.objective);
    setSelectedCategory((c) => (og && c !== "all" && c !== og.objective_group ? "all" : c));
    setSearchQuery("");
    void focusEntry(entryDomId(r.code), { block: r.path.technique ? "center" : "start" });
  }, [focusKey]);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    ciscoTaxonomyData.forEach((og) =>
      counts.set(og.objective_group, (counts.get(og.objective_group) ?? 0) + 1),
    );
    return [...counts.entries()];
  }, []);

  const q = searchQuery.trim().toLowerCase();
  const filteredData = useMemo(() => {
    let data = ciscoTaxonomyData;
    if (selectedCategory !== "all") {
      data = data.filter((og) => og.objective_group === selectedCategory);
    }
    if (q) data = data.filter((og) => objectiveMatches(og, q));
    return data;
  }, [q, selectedCategory]);

  const onObjectivesChange = (next: string[]) => {
    const opened = next.find((c) => !openObjectives.includes(c));
    const closed = openObjectives.find((c) => !next.includes(c));
    setOpenObjectives(next);
    if (opened) onEntryChange?.(opened);
    else if (closed && resolved && PATHS.get(resolved.code.toLowerCase())?.objective === closed) {
      onEntryChange?.(null);
    }
  };

  const onTechniquesChange = (objective: string, ofObjective: string[], next: string[]) => {
    const others = openTechniques.filter((t) => !ofObjective.includes(t));
    const prev = openTechniques.filter((t) => ofObjective.includes(t));
    const opened = next.find((c) => !prev.includes(c));
    const closed = prev.find((c) => !next.includes(c));
    setOpenTechniques([...others, ...next]);
    if (opened) onEntryChange?.(opened);
    else if (closed && resolved && PATHS.get(resolved.code.toLowerCase())?.technique === closed) {
      onEntryChange?.(objective);
    }
  };

  const filterButton = (value: string, label: string, count: number, icon?: string) => {
    const Icon = icon ? getIcon(icon) : null;
    const active = selectedCategory === value;
    return (
      <button
        key={value}
        type="button"
        aria-pressed={active}
        onClick={() => setSelectedCategory(value)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          active
            ? "border-primary bg-primary text-primary-foreground"
            : "text-muted-foreground hover:border-primary/60 hover:text-foreground",
        )}
      >
        {Icon && <Icon aria-hidden className="h-3.5 w-3.5" />}
        {label}
        <span className="tabular-nums opacity-80">({count})</span>
      </button>
    );
  };

  const accent = withAlpha(FRAMEWORK_PALETTE.cisco, 0.8);

  return (
    <section aria-labelledby="cisco-heading">
      <TabHeading
        id="cisco-heading"
        title="Cisco AI Security and Safety Taxonomy"
        version={`v${CISCO_TAXONOMY_VERSION}`}
        description={`${stats.objectiveGroups} objectives, ${stats.techniques} techniques and ${stats.subTechniques} sub-techniques, each cross-referenced by Cisco to OWASP, MITRE ATLAS, MITRE ATT&CK and NIST AML.`}
      />

      {resolved?.notice && (
        <div
          role="status"
          className="mb-4 flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 p-3 text-sm"
        >
          <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>
            {resolved.notice.kind === "moved" ? (
              <>
                <span className="font-mono">{resolved.notice.requested}</span> (v1 “
                {resolved.notice.v1Name}”) is not a v{CISCO_TAXONOMY_VERSION} code; showing{" "}
                <span className="font-mono">{resolved.code}</span>. {resolved.notice.note}
              </>
            ) : (
              <>
                In Cisco v1, <span className="font-mono">{resolved.notice.requested}</span> meant “
                {resolved.notice.v1Name}”. {resolved.notice.note}
              </>
            )}
          </p>
        </div>
      )}

      <div className="mb-5 flex flex-col gap-3">
        <div className="relative">
          <label htmlFor="cisco-search" className="sr-only">
            Search Cisco objectives, techniques and mappings
          </label>
          <Search
            aria-hidden
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="cisco-search"
            type="search"
            placeholder="Search objectives, techniques, mappings (e.g. AML.T0051, ASI02)…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {filterButton("all", "All", ciscoTaxonomyData.length)}
          {categories.map(([cat, count]) => filterButton(cat, cat, count, CATEGORY_ICON[cat]))}
        </div>
      </div>

      {filteredData.length === 0 ? (
        <EmptyState
          title="No objectives match"
          description={q ? `Nothing matches “${searchQuery}” in this category.` : undefined}
          action={{
            label: "Clear filters",
            onClick: () => {
              setSearchQuery("");
              setSelectedCategory("all");
            },
          }}
        />
      ) : (
        <Accordion
          type="multiple"
          value={openObjectives}
          onValueChange={onObjectivesChange}
          className="space-y-3"
        >
          {filteredData.map((og) => {
            const CatIcon = getIcon(CATEGORY_ICON[og.objective_group] ?? "shield");
            const techCodes = og.ai_tech.map((t) => t.code);
            const visibleTech = q
              ? og.ai_tech.filter((t) => matchesText(og, q) || techniqueMatches(t, q))
              : og.ai_tech;
            return (
              <AccordionItem
                key={og.code}
                value={og.code}
                id={entryDomId(og.code)}
                className="scroll-mt-24 rounded-lg border border-l-4 bg-card"
                style={{ borderLeftColor: accent }}
              >
                <AccordionTrigger className="px-4 py-4 text-left hover:no-underline sm:px-6">
                  <span className="flex w-full flex-col items-start">
                    <span className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="rounded border px-1.5 py-0.5 font-mono text-xs">
                        {og.code}
                      </span>
                      <span className="text-base font-semibold sm:text-lg">{og.description}</span>
                    </span>
                    <span className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
                      <CatIcon aria-hidden className="h-3.5 w-3.5" />
                      {og.objective_group} · {og.ai_tech.length} technique
                      {og.ai_tech.length === 1 ? "" : "s"}
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 sm:px-6">
                  <p className="leading-relaxed text-muted-foreground">{og.definition}</p>
                  <MappingChips mappings={og.mappings} />

                  <Accordion
                    type="multiple"
                    value={openTechniques.filter((t) => techCodes.includes(t))}
                    onValueChange={(next) => onTechniquesChange(og.code, techCodes, next)}
                    className="mt-4 space-y-2"
                  >
                    {visibleTech.map((tech) => (
                      <AccordionItem
                        key={tech.code}
                        value={tech.code}
                        id={entryDomId(tech.code)}
                        className="scroll-mt-24 rounded-md border bg-muted/30"
                      >
                        <AccordionTrigger className="px-4 py-3 text-left hover:no-underline">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs">
                              {tech.code}
                            </span>
                            <span className="text-sm font-medium">{tech.description}</span>
                            {tech.ai_subtech.length > 0 && (
                              <span className="text-xs font-normal text-muted-foreground">
                                {tech.ai_subtech.length} sub-technique
                                {tech.ai_subtech.length === 1 ? "" : "s"}
                              </span>
                            )}
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-3">
                          <p className="leading-relaxed text-muted-foreground">{tech.definition}</p>
                          <MappingChips mappings={tech.mappings} />

                          {tech.ai_subtech.length > 0 && (
                            <ul className="ml-1 mt-4 space-y-2 sm:ml-4">
                              {tech.ai_subtech.map((sub) => (
                                <li
                                  key={sub.code}
                                  id={entryDomId(sub.code)}
                                  className="scroll-mt-24 rounded-sm border-l-2 border-muted-foreground/20 py-2 pl-4"
                                >
                                  <div className="mb-1 flex flex-wrap items-center gap-2">
                                    <span className="rounded border px-1.5 py-0.5 font-mono text-xs">
                                      {sub.code}
                                    </span>
                                    <span className="text-sm font-medium">{sub.description}</span>
                                  </div>
                                  <p className="text-xs leading-relaxed text-muted-foreground">
                                    {sub.definition}
                                  </p>
                                  <MappingChips mappings={sub.mappings} />
                                </li>
                              ))}
                            </ul>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </section>
  );
}

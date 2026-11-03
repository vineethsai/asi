import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, X } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import PageHeader from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/content/EmptyState";
import { SOURCES } from "@/data/sources";
import { KC, KC_ORDER, type KcId } from "@/data/kc";
import { stagger } from "@/lib/motion";
import { useReveal } from "@/hooks/useReveal";
import { SegmentedControl } from "@/components/threats/SegmentedControl";
import { THREAT_LIST, threatLabel } from "@/components/threats/threatIndex";
import { ComponentCard } from "@/components/kc-components/ComponentCard";
import { ComponentHierarchy } from "@/components/kc-components/ComponentHierarchy";
import {
  COMPONENT_ENTRIES,
  componentEntry,
  entriesInKc,
  threatIdsInKc,
} from "@/components/kc-components/componentIndex";

type SortKey = "kc" | "threats";
const SORTS: { value: SortKey; label: string }[] = [
  { value: "kc", label: "KC order" },
  { value: "threats", label: "Threats" },
];

const THREATS_BY_KC = Object.fromEntries(
  KC_ORDER.map((k) => [k, new Set(threatIdsInKc(k))]),
) as Record<KcId, Set<string>>;
const MAPPED_THREATS = new Set(COMPONENT_ENTRIES.flatMap((e) => e.threatIds)).size;

const Components = () => {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const threatParam = (params.get("threat") ?? "").toLowerCase();
  const threat = THREAT_LIST.find((t) => t.id === threatParam) ?? null;
  const sort: SortKey = params.get("sort") === "threats" ? "threats" : "kc";

  const update = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value === null || value === "" || value === "all") next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };
  const clearFilters = () => {
    const next = new URLSearchParams(params);
    ["q", "threat"].forEach((k) => next.delete(k));
    setParams(next, { replace: true });
  };
  const filtersActive = !!q || !!threat;

  const kcs = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = KC_ORDER.filter((k) => {
      if (threat && !THREATS_BY_KC[k].has(threat.id)) return false;
      if (!needle) return true;
      return entriesInKc(k).some((e) =>
        [e.code, e.title, e.description, KC[k].name, KC[k].short].some((s) =>
          s.toLowerCase().includes(needle),
        ),
      );
    });
    return sort === "threats"
      ? [...list].sort(
          (a, b) =>
            THREATS_BY_KC[b].size - THREATS_BY_KC[a].size ||
            KC_ORDER.indexOf(a) - KC_ORDER.indexOf(b),
        )
      : list;
  }, [q, threat, sort]);

  const { ref: gridRef } = useReveal<HTMLDivElement>();
  const roots = KC_ORDER.map((k) => componentEntry(k)).filter(Boolean);

  return (
    <PageLayout
      title="Agent Components"
      description={`The ${KC_ORDER.length} key components of agentic AI systems, from LLMs and orchestration to memory, tools and the operational environment, and the AI agent threats facing each.`}
      canonicalPath="/components"
      keywords="AI agent components, AI security architecture, agent architectures, agentic systems components, LLM security, AI orchestration security, memory modules security, tool integration security"
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Key components of agentic AI systems",
        description: "Key components of agentic AI systems and their security considerations",
        url: "https://agenticsecurity.info/components",
        numberOfItems: roots.length,
        itemListElement: roots.map((c, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "TechArticle",
            name: KC[c!.kc].name,
            description: c!.description,
            url: `https://agenticsecurity.info/components/${c!.id}`,
          },
        })),
      }}
    >
      <PageHeader
        eyebrow="Architecture"
        title="Key components"
        description="The six key components (KC1–KC6) of an agentic AI system from the OWASP Agentic Security guide, their sub-components and the threats that affect each."
        source={SOURCES.kc}
        stats={[
          { label: "key components", value: KC_ORDER.length },
          {
            label: "components in all",
            value: COMPONENT_ENTRIES.length,
            hint: "The six key components plus every sub-component.",
          },
          {
            label: "threats mapped",
            value: MAPPED_THREATS,
            hint: "Distinct threats mapped to at least one component.",
          },
        ]}
        filters={
          <>
            <div className="relative w-full sm:w-64">
              <label htmlFor="component-search" className="sr-only">
                Search components
              </label>
              <Search
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="component-search"
                type="search"
                placeholder="Search components…"
                value={q}
                onChange={(e) => update("q", e.target.value)}
                className="h-9 pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="component-threat" className="text-xs text-muted-foreground">
                Threat
              </label>
              <Select value={threat?.id ?? "all"} onValueChange={(v) => update("threat", v)}>
                <SelectTrigger id="component-threat" className="h-9 w-[12rem]">
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
            <SegmentedControl
              label="Sort"
              value={sort}
              onValueChange={(v) => update("sort", v === "kc" ? null : v)}
              options={SORTS}
            />
            {filtersActive && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
                <X aria-hidden className="mr-1 h-4 w-4" />
                Clear
              </Button>
            )}
          </>
        }
      />

      <p className="mb-4 text-sm text-muted-foreground" aria-live="polite">
        Showing {kcs.length} of {KC_ORDER.length} key components
      </p>

      {kcs.length === 0 ? (
        <EmptyState
          icon="filter"
          title="No components match these filters"
          description="Try a different search term or threat."
          action={{ label: "Clear filters", onClick: clearFilters }}
        />
      ) : (
        <>
          <div ref={gridRef} className="mb-10 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {kcs.map((k, i) => {
              const entry = componentEntry(k);
              return entry ? (
                <ComponentCard key={k} entry={entry} className="enter" style={stagger(i)} />
              ) : null;
            })}
          </div>
          <ComponentHierarchy kcs={kcs} />
        </>
      )}
    </PageLayout>
  );
};

export default Components;

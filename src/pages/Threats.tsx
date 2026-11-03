import { useMemo } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/content/EmptyState";
import type { Threat } from "@/components/components/securityData";
import { SOURCES } from "@/data/sources";
import { KC_LIST, kcId, type KcId } from "@/data/kc";
import { stagger } from "@/lib/motion";
import { useReveal } from "@/hooks/useReveal";
import { ThreatCard } from "@/components/threats/ThreatCard";
import { ThreatComponentHeatmap } from "@/components/threats/ThreatComponentHeatmap";
import { SegmentedControl } from "@/components/threats/SegmentedControl";
import {
  THREAT_LIST,
  THREAT_STATS,
  compareThreatCodes,
  mitigationsForThreat,
  threatLabel,
} from "@/components/threats/threatIndex";
import { threatIdsInKc } from "@/components/kc-components/componentIndex";

type SortKey = "code" | "risk" | "name" | "mitigations";
type Impact = "all" | "high" | "medium" | "low";

const SORTS: { value: SortKey; label: string }[] = [
  { value: "code", label: "Code" },
  { value: "risk", label: "Risk" },
  { value: "name", label: "Name" },
  { value: "mitigations", label: "Controls" },
];

const MITIGATION_COUNT: Record<string, number> = Object.fromEntries(
  THREAT_LIST.map((t) => [t.id, mitigationsForThreat(t.id).length]),
);

const THREATS_BY_KC: Record<string, Set<string>> = Object.fromEntries(
  KC_LIST.map((k) => [k.id, new Set(threatIdsInKc(k.id))]),
);

function sortThreats(list: Threat[], sort: SortKey): Threat[] {
  const out = [...list];
  switch (sort) {
    case "risk":
      return out.sort(
        (a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0) || compareThreatCodes(a, b),
      );
    case "name":
      return out.sort((a, b) => threatLabel(a).localeCompare(threatLabel(b)));
    case "mitigations":
      return out.sort(
        (a, b) =>
          (MITIGATION_COUNT[b.id] ?? 0) - (MITIGATION_COUNT[a.id] ?? 0) || compareThreatCodes(a, b),
      );
    default:
      return out.sort(compareThreatCodes);
  }
}

export const Threats = () => {
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const impact = (params.get("impact") ?? "all") as Impact;
  const kc = (kcId(params.get("kc")) ?? null) as KcId | null;
  const sort = (
    SORTS.some((s) => s.value === params.get("sort")) ? params.get("sort") : "code"
  ) as SortKey;
  const view =
    params.get("view") === "heatmap" || location.hash === "#threat-matrix" ? "heatmap" : "catalog";

  const update = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value === null || value === "" || value === "all") next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };
  const clearFilters = () => {
    const next = new URLSearchParams(params);
    ["q", "impact", "kc"].forEach((k) => next.delete(k));
    setParams(next, { replace: true });
  };

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const filtered = THREAT_LIST.filter((t) => {
      const matchesSearch =
        !needle ||
        [t.code, t.name, t.shortName ?? "", t.description, ...(t.tags ?? [])].some((s) =>
          s.toLowerCase().includes(needle),
        );
      const matchesImpact = impact === "all" || t.impactLevel === impact;
      const matchesKc = !kc || THREATS_BY_KC[kc]?.has(t.id);
      return matchesSearch && matchesImpact && matchesKc;
    });
    return sortThreats(filtered, sort);
  }, [q, impact, kc, sort]);

  const filtersActive = !!q || impact !== "all" || !!kc;
  const { ref: gridRef } = useReveal<HTMLDivElement>();

  const empty = (
    <EmptyState
      icon="filter"
      title="No threats match these filters"
      description="Try a different search term, impact level or component."
      action={{ label: "Clear filters", onClick: clearFilters }}
    />
  );

  return (
    <PageLayout
      title="AI Agent Threats"
      description="Analysis of the threats to agentic AI systems — memory poisoning, tool misuse, privilege compromise and more — with their attack vectors, affected components and mitigations."
      canonicalPath="/threats"
      keywords="AI agent threats, AI security risks, agent security threats, agentic threats, prompt injection, memory poisoning, AI risks, LLM security threats, AI agent vulnerabilities"
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "AI Agent Threats & Security Risks",
        description: `The ${THREAT_STATS.threats} threats to agentic AI systems from the OWASP Agentic AI Threats and Mitigations guide`,
        url: "https://agenticsecurity.info/threats",
        isPartOf: {
          "@type": "WebSite",
          name: "Agentic Security Hub",
          url: "https://agenticsecurity.info",
        },
      }}
    >
      <PageHeader
        eyebrow="Threat catalog"
        title="Threats"
        description="The key threats to agentic AI systems, their attack vectors, the components they hit and the controls that mitigate them."
        stats={[
          { label: "threats", value: THREAT_STATS.threats },
          {
            label: "attack vectors",
            value: THREAT_STATS.attackVectors,
            hint: "Sum of the documented attack vectors across all threats.",
          },
          {
            label: "mitigating controls",
            value: THREAT_STATS.mitigations,
            hint: "Distinct controls mapped to at least one threat.",
          },
        ]}
        source={SOURCES.threats}
        filters={
          <>
            <div className="relative w-full sm:w-64">
              <label htmlFor="threat-search" className="sr-only">
                Search threats
              </label>
              <Search
                aria-hidden
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="threat-search"
                type="search"
                placeholder="Search threats, tags…"
                value={q}
                onChange={(e) => update("q", e.target.value)}
                className="h-9 pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="threat-impact" className="text-xs text-muted-foreground">
                Impact
              </label>
              <Select value={impact} onValueChange={(v) => update("impact", v)}>
                <SelectTrigger id="threat-impact" className="h-9 w-[7.5rem]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="threat-kc" className="text-xs text-muted-foreground">
                Component
              </label>
              <Select value={kc ?? "all"} onValueChange={(v) => update("kc", v)}>
                <SelectTrigger id="threat-kc" className="h-9 w-[13rem]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All components</SelectItem>
                  {KC_LIST.map((k) => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.code} · {k.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <SegmentedControl
              label="Sort"
              value={sort}
              onValueChange={(v) => update("sort", v === "code" ? null : v)}
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

      <Tabs
        value={view}
        onValueChange={(v) => {
          const next = new URLSearchParams(params);
          if (v === "heatmap") next.set("view", "heatmap");
          else next.delete("view");
          setParams(next, { replace: true });
        }}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="catalog">Catalog ({visible.length})</TabsTrigger>
            <TabsTrigger value="heatmap">Component heatmap</TabsTrigger>
          </TabsList>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            Showing {visible.length} of {THREAT_STATS.threats} threats
          </p>
        </div>

        <TabsContent value="catalog" className="mt-0">
          {visible.length === 0 ? (
            empty
          ) : (
            <div ref={gridRef} className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {visible.map((threat, i) => (
                <ThreatCard
                  key={threat.id}
                  threat={threat}
                  mitigationCount={MITIGATION_COUNT[threat.id] ?? 0}
                  className="enter"
                  style={stagger(i)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="heatmap" className="mt-0">
          {visible.length === 0 ? empty : <ThreatComponentHeatmap threats={visible} focusKc={kc} />}
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
};

export default Threats;

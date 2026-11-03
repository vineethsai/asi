import React, { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  Calculator,
  Layers,
  ListOrdered,
  Map as MapIcon,
  Network,
  Shield,
  Target,
} from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import { PageHeader, type PageHeaderSource } from "@/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SourceNote } from "@/components/content/SourceNote";
import { TaxonomySankey } from "@/components/taxonomy/overview/TaxonomySankey";
import { FrameworkMap } from "@/components/taxonomy/overview/FrameworkMap";
import { DensityMatrix } from "@/components/taxonomy/overview/DensityMatrix";
import {
  CROSSWALK_GROUPS,
  frameworkEntryCount,
  type CrosswalkFramework,
  type CrosswalkGroup,
} from "@/components/taxonomy/overview/crosswalkGraph";
import { focusEntry } from "@/components/taxonomy/deepLink";
import type { TaxonomyTabId, TaxonomyTabProps } from "@/components/taxonomy/types";
import { getTaxonomyStats } from "@/components/components/ciscoTaxonomyData";
import { atlasCrosswalk } from "@/data/atlasCrosswalk";
import { SOURCES } from "@/data/sources";

const CiscoTaxonomyContent = React.lazy(() =>
  import("./CiscoTaxonomy").then((m) => ({ default: m.CiscoTaxonomyContent })),
);
const OwaspAgenticTop10Content = React.lazy(() =>
  import("./OwaspAgenticTop10").then((m) => ({ default: m.OwaspAgenticTop10Content })),
);
const AIVSSCalculatorContent = React.lazy(() =>
  import("./AIVSSCalculator").then((m) => ({ default: m.AIVSSCalculatorContent })),
);
const AIUC1ContentLazy = React.lazy(() =>
  import("./AIUC1Content").then((m) => ({ default: m.AIUC1Content })),
);
const LlmTop10Content = React.lazy(() =>
  import("@/components/taxonomy/tabs/LlmTop10Tab").then((m) => ({
    default: m.LlmTop10Content,
  })),
);
const AtlasCrosswalkContent = React.lazy(() =>
  import("@/components/taxonomy/tabs/AtlasCrosswalkTab").then((m) => ({
    default: m.AtlasCrosswalkContent,
  })),
);

interface TabMeta {
  title: string;
  label: string;
  short: string;
  icon: typeof Network;
  description: string;
  source?: PageHeaderSource;
}

const TAB_META: Record<TaxonomyTabId, TabMeta> = {
  overview: {
    title: "Threat Taxonomy",
    label: "Overview & mapping",
    short: "Overview",
    icon: Network,
    description:
      "How the OWASP Agentic Top 10, the OWASP agentic threat catalog, the Cisco AI taxonomy, OWASP AIVSS and AIUC-1 map onto each other.",
  },
  "owasp-agentic": {
    title: "OWASP Top 10 for Agentic Applications",
    label: "Agentic Top 10",
    short: "Agentic",
    icon: Target,
    description:
      "The OWASP Top 10 for Agentic Applications (ASI01–ASI10) with examples, attack scenarios, prevention guidelines, related threats and controls.",
    source: SOURCES.top10,
  },
  "llm-top10": {
    title: "OWASP Top 10 for LLM Applications",
    label: "LLM Top 10",
    short: "LLM",
    icon: ListOrdered,
    description:
      "OWASP Top 10 for LLM Applications 2026 (LLM01–LLM10): examples, 2025 numbering, and links to agentic threats, controls, AISVS, Cisco, ATLAS and CWE.",
    source: SOURCES.llmTop10,
  },
  cisco: {
    title: "Cisco AI Security Taxonomy",
    label: "Cisco Taxonomy",
    short: "Cisco",
    icon: Layers,
    description:
      "Cisco AI Security and Safety Taxonomy objectives, techniques and sub-techniques with their OWASP, MITRE ATLAS and ATT&CK cross-references.",
    source: SOURCES.cisco,
  },
  atlas: {
    title: "MITRE ATLAS Crosswalk",
    label: "MITRE ATLAS",
    short: "ATLAS",
    icon: MapIcon,
    description:
      "MITRE ATLAS techniques mapped to Cisco AI taxonomy techniques, OWASP Agentic Top 10 entries and agentic threats, derived from Cisco's published mappings.",
    source: SOURCES.atlas,
  },
  aivss: {
    title: "AIVSS Calculator",
    label: "AIVSS Calculator",
    short: "AIVSS",
    icon: Calculator,
    description:
      "Score agentic AI vulnerabilities with the OWASP AI Vulnerability Scoring System and compare the published core-risk worked examples.",
    source: SOURCES.aivss,
  },
  "aiuc-1": {
    title: "AIUC-1 Requirements",
    label: "AIUC-1",
    short: "AIUC-1",
    icon: Shield,
    description:
      "AIUC-1 requirements by principle with their OWASP Agentic Top 10 and AIVSS cross-references.",
    source: SOURCES.aiuc1,
  },
};

const TAB_ORDER: TaxonomyTabId[] = [
  "overview",
  "owasp-agentic",
  "llm-top10",
  "cisco",
  "atlas",
  "aivss",
  "aiuc-1",
];

/** Alternate spellings accepted in ?tab= (the command palette uses "aiuc1"). */
const TAB_ALIASES: Record<string, TaxonomyTabId> = {
  aiuc1: "aiuc-1",
  agentic: "owasp-agentic",
  asi: "owasp-agentic",
  "mitre-atlas": "atlas",
  llm: "llm-top10",
  "owasp-llm": "llm-top10",
  "llm-top-10": "llm-top10",
};

function resolveTab(raw: string | null): TaxonomyTabId {
  const t = (raw ?? "overview").toLowerCase();
  const resolved = TAB_ALIASES[t] ?? t;
  return (TAB_ORDER as string[]).includes(resolved) ? (resolved as TaxonomyTabId) : "overview";
}

const TabLoader = () => (
  <div className="space-y-3 py-6" aria-busy="true" aria-label="Loading">
    <div className="h-7 w-64 animate-pulse rounded bg-muted" />
    <div className="h-4 w-full max-w-xl animate-pulse rounded bg-muted" />
    <div className="h-24 w-full animate-pulse rounded-lg bg-muted" />
    <div className="h-24 w-full animate-pulse rounded-lg bg-muted" />
  </div>
);

function OverviewTab({ onOpenFramework }: { onOpenFramework: (g: CrosswalkGroup) => void }) {
  const [hiddenGroups, setHiddenGroups] = useState<CrosswalkFramework[]>([]);
  const [pinned, setPinned] = useState<string | null>(null);
  const pair: [CrosswalkFramework, CrosswalkFramework] | null =
    hiddenGroups.length === CROSSWALK_GROUPS.length - 2
      ? (CROSSWALK_GROUPS.filter((g) => !hiddenGroups.includes(g.id)).map((g) => g.id) as [
          CrosswalkFramework,
          CrosswalkFramework,
        ])
      : null;

  const selectPair = (a: CrosswalkFramework, b: CrosswalkFramework) => {
    const same = pair && pair.includes(a) && pair.includes(b);
    setHiddenGroups(
      same ? [] : CROSSWALK_GROUPS.filter((g) => g.id !== a && g.id !== b).map((g) => g.id),
    );
    setPinned(null);
    void focusEntry("taxonomy-sankey", { block: "start" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{TAB_META.overview.label}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Every number below is counted from the mapping data on this site; each chart offers a text
          table for screen readers.
        </p>
      </div>
      <TaxonomySankey
        id="taxonomy-sankey"
        hiddenGroups={hiddenGroups}
        onHiddenGroupsChange={setHiddenGroups}
        pinned={pinned}
        onPinChange={setPinned}
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <FrameworkMap onOpen={onOpenFramework} />
        <DensityMatrix onSelectPair={selectPair} selectedPair={pair} />
      </div>
      <div className="space-y-1 border-t pt-4">
        {[SOURCES.top10, SOURCES.threats, SOURCES.cisco, SOURCES.aivss, SOURCES.aiuc1].map((s) => (
          <SourceNote key={s.name} source={s} />
        ))}
      </div>
    </div>
  );
}

export default function Taxonomy() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = resolveTab(searchParams.get("tab"));
  const tabMeta = TAB_META[activeTab];
  const entry = searchParams.get("entry");

  // focusKey: bump on every navigation that carries ?entry=, except our own replaceState writes.
  const ownWrite = useRef<string | null>(null);
  const [focusKey, setFocusKey] = useState(0);
  useEffect(() => {
    const own = ownWrite.current !== null && ownWrite.current === location.search;
    ownWrite.current = null;
    if (!own && entry) setFocusKey((k) => k + 1);
    // location.key changes on every navigation (including repeated jumps to the same URL).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  const onEntryChange = useCallback(
    (code: string | null) => {
      const next = new URLSearchParams(searchParams);
      if (code) next.set("entry", code);
      else next.delete("entry");
      const qs = next.toString();
      if (`?${qs}` === location.search || (!qs && !location.search)) return;
      ownWrite.current = qs ? `?${qs}` : "";
      setSearchParams(next, { replace: true, preventScrollReset: true });
    },
    [searchParams, setSearchParams, location.search],
  );

  const handleTabChange = useCallback(
    (value: string) => {
      setSearchParams(value === "overview" ? {} : { tab: value });
      window.scrollTo({ top: 0 });
    },
    [setSearchParams],
  );

  const openFramework = useCallback(
    (g: CrosswalkGroup) => (g.id === "tm" ? navigate("/threats") : handleTabChange(g.tab)),
    [navigate, handleTabChange],
  );

  const cisco = getTaxonomyStats();
  const tabProps: TaxonomyTabProps = { entry, focusKey, onEntryChange };

  return (
    <PageLayout
      title={tabMeta.title}
      description={tabMeta.description}
      canonicalPath={activeTab === "overview" ? "/taxonomy" : `/taxonomy?tab=${activeTab}`}
    >
      <PageHeader
        eyebrow="Learn · Frameworks"
        title="Threat Taxonomy"
        description="AI security frameworks and standards side by side, with the mappings between them."
        source={tabMeta.source}
        stats={[
          { label: "ASI entries", value: frameworkEntryCount("asi") },
          { label: "threats", value: frameworkEntryCount("tm") },
          {
            label: "Cisco objectives",
            value: cisco.objectiveGroups,
            hint: `${cisco.techniques} techniques, ${cisco.subTechniques} sub-techniques`,
          },
          { label: "ATLAS techniques", value: atlasCrosswalk.length },
          { label: "AIVSS core risks", value: frameworkEntryCount("aivss") },
          {
            label: "AIUC-1 requirements",
            value: frameworkEntryCount("aiuc1"),
            hint: "Active requirements in the current release",
          },
        ]}
      />

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="relative -mx-4 mb-6 overflow-x-auto px-4">
          <TabsList className="inline-flex w-auto min-w-full rounded-xl p-1 sm:min-w-0">
            {TAB_ORDER.map((id) => {
              const meta = TAB_META[id];
              const Icon = meta.icon;
              return (
                <TabsTrigger key={id} value={id} className="gap-1.5">
                  <Icon className="h-4 w-4" aria-hidden />
                  <span className="hidden sm:inline">{meta.label}</span>
                  <span className="sm:hidden">{meta.short}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-0">
          <OverviewTab onOpenFramework={openFramework} />
        </TabsContent>

        <TabsContent value="owasp-agentic" className="mt-0">
          <Suspense fallback={<TabLoader />}>
            <OwaspAgenticTop10Content {...tabProps} />
          </Suspense>
        </TabsContent>

        <TabsContent value="llm-top10" className="mt-0">
          <Suspense fallback={<TabLoader />}>
            <LlmTop10Content {...tabProps} />
          </Suspense>
        </TabsContent>

        <TabsContent value="cisco" className="mt-0">
          <Suspense fallback={<TabLoader />}>
            <CiscoTaxonomyContent {...tabProps} />
          </Suspense>
        </TabsContent>

        <TabsContent value="atlas" className="mt-0">
          <Suspense fallback={<TabLoader />}>
            <AtlasCrosswalkContent {...tabProps} />
          </Suspense>
        </TabsContent>

        <TabsContent value="aivss" className="mt-0">
          <Suspense fallback={<TabLoader />}>
            <AIVSSCalculatorContent {...tabProps} />
          </Suspense>
        </TabsContent>

        <TabsContent value="aiuc-1" className="mt-0">
          <Suspense fallback={<TabLoader />}>
            <AIUC1ContentLazy {...tabProps} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}

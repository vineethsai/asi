import { Suspense, lazy, useId, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Crosshair, Search, Share2 } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import PageHeader from "@/components/layout/PageHeader";
import { SkeletonBlock } from "@/components/layout/Skeletons";
import { threatModelerPathFor } from "@/config/navigation";
import { architecturesData, type Architecture } from "@/components/components/architecturesData";
import { getComponentTitle } from "@/components/components/componentDataMap";
import FeatureComparisonMatrix from "@/components/home/FeatureComparisonMatrix";
import { threatBandCounts } from "@/components/home/siteStats";
import ArchitectureFlowDiagram from "@/components/visual/ArchitectureFlowDiagram";
import { Sparkline } from "@/components/charts/Sparkline";
import { SeverityBadge } from "@/components/content/SeverityBadge";
import { EmptyState } from "@/components/content/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Icon } from "@/lib/icons";
import { stagger } from "@/lib/motion";
import { BANDS, compareBands, riskBand, severityLabel, type Band } from "@/lib/severity";
import { SOURCES } from "@/data/sources";
import { useReveal } from "@/hooks/useReveal";

const ArchitectureNavigator = lazy(() => import("@/components/architecture/ArchitectureNavigator"));

const ARCHITECTURES: Architecture[] = Object.values(architecturesData).sort(
  (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
);

type SortKey = "displayOrder" | "name" | "threats" | "risk";

const SORTS: { value: SortKey; label: string }[] = [
  { value: "displayOrder", label: "Default order" },
  { value: "risk", label: "Risk (highest first)" },
  { value: "threats", label: "Threats (most first)" },
  { value: "name", label: "Name (A–Z)" },
];

const distinct = (lists: string[][]) => new Set(lists.flat()).size;

/** Static diagram, mounted the first time the card scrolls into view and never re-rendered. */
function DiagramThumb({ arch }: { arch: Architecture }) {
  const { ref, isVisible } = useReveal<HTMLDivElement>({ rootMargin: "200px 0px" });
  return (
    <div ref={ref} className="h-40 border-b bg-muted/20">
      {isVisible ? (
        <ArchitectureFlowDiagram
          architectureId={arch.id}
          variant="thumbnail"
          className="h-full w-full"
          title={`${arch.name} diagram`}
        />
      ) : (
        <SkeletonBlock className="h-full w-full rounded-none" />
      )}
    </div>
  );
}

function ArchitectureCard({ arch, index }: { arch: Architecture; index: number }) {
  const counts = useMemo(() => threatBandCounts(arch.threatIds), [arch]);
  return (
    <li className="enter" style={stagger(index)}>
      <article className="card-hover relative flex h-full flex-col overflow-hidden rounded-lg border bg-card focus-within:ring-2 focus-within:ring-ring">
        <DiagramThumb arch={arch} />
        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="flex min-w-0 items-center gap-2 text-lg font-semibold leading-snug">
              <Icon name={arch.icon} className="h-5 w-5 shrink-0 text-muted-foreground" />
              <Link
                to={`/architectures/${arch.id}`}
                className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
              >
                {arch.name}
              </Link>
            </h2>
            {arch.riskScore != null && (
              <SeverityBadge
                score={arch.riskScore}
                showScore
                size="xs"
                className="shrink-0"
                title="Editorial pattern risk (1–10)"
              />
            )}
          </div>

          <p className="line-clamp-3 text-sm text-muted-foreground">{arch.description}</p>

          {arch.tags && arch.tags.length > 0 && (
            <ul className="flex flex-wrap gap-1.5" aria-label="Tags">
              {arch.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                >
                  {tag}
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <Sparkline counts={counts} showText width={72} height={20} />
            <span className="text-muted-foreground">
              <span className="font-medium text-foreground">{arch.mitigationIds.length}</span>{" "}
              mitigations
            </span>
            <span className="text-muted-foreground">
              <span className="font-medium text-foreground">{arch.keyComponents.length}</span> key
              components
            </span>
          </div>

          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Key components: </span>
            {arch.keyComponents.map((id) => getComponentTitle(id)).join(", ")}
          </p>

          <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3">
            <span className="text-xs text-muted-foreground">
              v{arch.version ?? "–"} · updated{" "}
              {arch.lastUpdated ? <time dateTime={arch.lastUpdated}>{arch.lastUpdated}</time> : "–"}
            </span>
            <Link
              to={threatModelerPathFor(arch.id)}
              className="relative z-10 inline-flex shrink-0 items-center gap-1.5 rounded-md border border-primary/30 px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Crosshair className="h-3 w-3" aria-hidden="true" />
              Open in Threat Modeler
            </Link>
          </div>
        </div>
      </article>
    </li>
  );
}

const Architectures = () => {
  const [params, setParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [band, setBand] = useState<Band | "all">("all");
  const [sortBy, setSortBy] = useState<SortKey>("displayOrder");
  const searchId = useId();
  const bandId = useId();
  const sortId = useId();
  const { ref: gridRef } = useReveal<HTMLUListElement>();

  const graphOpen = params.get("view") === "graph";
  const setGraphOpen = (open: boolean) => {
    const next = new URLSearchParams(params);
    if (open) next.set("view", "graph");
    else next.delete("view");
    setParams(next, { replace: !open });
  };

  const bandsPresent = useMemo(() => {
    const counts = new Map<Band, number>();
    ARCHITECTURES.forEach((a) => {
      const b = riskBand(a.riskScore);
      counts.set(b, (counts.get(b) ?? 0) + 1);
    });
    return BANDS.filter((b) => counts.has(b)).map((b) => ({ band: b, count: counts.get(b) ?? 0 }));
  }, []);

  const sorted = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const list = ARCHITECTURES.filter((a) => {
      const matches =
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        (a.tags ?? []).some((tag) => tag.toLowerCase().includes(q)) ||
        a.keyComponents.some((c) => getComponentTitle(c).toLowerCase().includes(q));
      return matches && (band === "all" || riskBand(a.riskScore) === band);
    });
    return [...list].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "threats") return b.threatIds.length - a.threatIds.length;
      if (sortBy === "risk")
        return (
          compareBands(riskBand(a.riskScore), riskBand(b.riskScore)) ||
          (b.riskScore ?? 0) - (a.riskScore ?? 0)
        );
      return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
    });
  }, [searchTerm, band, sortBy]);

  const stats = [
    { label: "patterns", value: ARCHITECTURES.length },
    {
      label: "threats covered",
      value: distinct(ARCHITECTURES.map((a) => a.threatIds)),
      hint: "Distinct threats linked to at least one pattern",
    },
    {
      label: "controls",
      value: distinct(ARCHITECTURES.map((a) => a.mitigationIds)),
      hint: "Distinct mitigations linked to at least one pattern",
    },
    {
      label: "key components",
      value: distinct(ARCHITECTURES.map((a) => a.keyComponents)),
      hint: "Distinct KC sub-components used by the patterns",
    },
  ];

  const resetFilters = () => {
    setSearchTerm("");
    setBand("all");
  };

  return (
    <PageLayout
      title="Agent Architectures"
      description="Guide to agentic architecture patterns and their security implications: secure design patterns, architectural best practices and the threats each pattern exposes."
      canonicalPath="/architectures"
      keywords="agent architectures, AI security patterns, agentic architectures, secure AI development, AI agent design, agent security, AI security architecture, LLM architectures, artificial intelligence patterns, secure agent development, AI system design"
    >
      <PageHeader
        eyebrow="Learn"
        title="Agent architectures"
        description="Reference patterns for agentic systems, the components each one uses and the threats it exposes."
        stats={stats}
        source={SOURCES.architectures}
        actions={
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setGraphOpen(true)}
          >
            <Share2 className="h-4 w-4" aria-hidden="true" />
            Open graph explorer
          </Button>
        }
        filters={
          <>
            <div className="relative w-full sm:w-64">
              <label htmlFor={searchId} className="sr-only">
                Search architectures
              </label>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id={searchId}
                type="search"
                placeholder="Search patterns, tags, components…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <label htmlFor={bandId} className="sr-only">
              Risk band
            </label>
            <Select value={band} onValueChange={(v) => setBand(v as Band | "all")}>
              <SelectTrigger id={bandId} className="w-full sm:w-44">
                <SelectValue placeholder="All risk levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All risk levels</SelectItem>
                {bandsPresent.map(({ band: b, count }) => (
                  <SelectItem key={b} value={b}>
                    {severityLabel(b)} risk ({count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <label htmlFor={sortId} className="sr-only">
              Sort by
            </label>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
              <SelectTrigger id={sortId} className="w-full sm:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORTS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground" role="status">
              {sorted.length} of {ARCHITECTURES.length} shown
            </span>
          </>
        }
      />

      {sorted.length > 0 ? (
        <ul ref={gridRef} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {sorted.map((arch, i) => (
            <ArchitectureCard key={arch.id} arch={arch} index={i} />
          ))}
        </ul>
      ) : (
        <EmptyState
          icon="filter"
          title="No architectures match"
          description="Try a different search term or risk level."
          action={{ label: "Clear filters", onClick: resetFilters }}
        />
      )}

      <div className="mt-16">
        <FeatureComparisonMatrix />
      </div>

      <Dialog open={graphOpen} onOpenChange={setGraphOpen}>
        <DialogContent className="flex h-[90vh] w-[96vw] max-w-7xl flex-col gap-0 overflow-hidden p-0">
          <div className="border-b px-4 py-3 pr-12">
            <DialogTitle className="text-base">Architecture graph explorer</DialogTitle>
            <DialogDescription className="text-xs">
              Expand a pattern into its components, then a component into the threats that hit it
              and the controls that answer them.
            </DialogDescription>
          </div>
          <div className="min-h-0 flex-1 p-3">
            {graphOpen && (
              <Suspense
                fallback={
                  <div className="flex h-full gap-3" role="status" aria-busy="true">
                    <span className="sr-only">Loading graph explorer…</span>
                    <SkeletonBlock className="hidden h-full w-72 lg:block" />
                    <SkeletonBlock className="h-full flex-1" />
                  </div>
                }
              >
                <ArchitectureNavigator />
              </Suspense>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default Architectures;

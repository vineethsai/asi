import { lazy, Suspense, useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Hammer,
  Info,
  ListChecks,
  PencilRuler,
  RotateCcw,
  Settings,
  Wrench,
} from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import PageHeader from "@/components/layout/PageHeader";
import NotFoundEntity from "@/components/layout/NotFoundEntity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  mitigationsData,
  threatsData,
  type Mitigation,
} from "@/components/components/securityData";
import { RichText } from "@/components/content/RichText";
import { RiskScore } from "@/components/content/RiskScore";
import { SeverityBadge } from "@/components/content/SeverityBadge";
import { PhaseBadge, type Phase } from "@/components/content/PhaseBadge";
import { SourceNote } from "@/components/content/SourceNote";
import { Ring } from "@/components/charts/Ring";
import { SOURCES } from "@/data/sources";
import { useControlProgress } from "@/hooks/useProgress";
import { Icon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { PhaseChecklist } from "@/components/controls/PhaseChecklist";
import { renderCodeBlock } from "@/components/controls/renderCode";
import {
  PHASE_META,
  PHASE_ORDER,
  phaseApplies,
  phaseDoneCount,
  phaseTaskTotal,
} from "@/components/controls/phaseTasks";
import {
  chapterOnlyMappings,
  citedRequirements,
  controlChapters,
  relatedControls,
} from "@/components/controls/controlIndex";
import {
  compareThreatCodes,
  controlCode,
  threatBand,
  threatLabel,
} from "@/components/threats/threatIndex";

const ControlRadar = lazy(() => import("@/components/controls/ControlRadar"));

type TabKey = "overview" | Phase | "tools";
const TAB_KEYS: readonly TabKey[] = ["overview", ...PHASE_ORDER, "tools"];

function PhaseRings({
  control,
  onSelect,
}: {
  control: Mitigation;
  onSelect: (phase: Phase) => void;
}) {
  const { done, count, reset } = useControlProgress(control.id);
  const phases = PHASE_ORDER.map((p) => ({
    phase: p,
    total: phaseTaskTotal(control, p),
    done: phaseDoneCount(done, control, p),
  }));
  const total = phases.reduce((n, p) => n + p.total, 0);
  if (!total) {
    return (
      <p className="mb-6 rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        This control's guidance has no checklist items, so there is no progress to track.
      </p>
    );
  }
  return (
    <section aria-labelledby="control-progress" className="mb-6 rounded-lg border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 id="control-progress" className="text-sm font-semibold">
          Your progress
          <span className="ml-2 font-normal text-muted-foreground">saved in this browser</span>
        </h2>
        {count > 0 && (
          <Button variant="ghost" size="sm" onClick={reset} className="h-8">
            <RotateCcw aria-hidden className="mr-1.5 h-3.5 w-3.5" />
            Reset
          </Button>
        )}
      </div>
      <ul className="grid grid-cols-3 gap-3">
        {phases.map((p) => (
          <li key={p.phase}>
            <button
              type="button"
              onClick={() => onSelect(p.phase)}
              disabled={!p.total}
              className="flex w-full flex-col items-center gap-2 rounded-md p-2 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 sm:flex-row sm:justify-center"
            >
              <Ring
                value={p.done}
                max={Math.max(1, p.total)}
                size={56}
                thickness={6}
                tone="progress"
                ariaLabel={`${PHASE_META[p.phase].label}: ${p.done} of ${p.total} tasks done`}
              />
              <span className="text-center sm:text-left">
                <PhaseBadge phase={p.phase} size="xs" />
                <span className="mt-1 block text-xs tabular-nums text-muted-foreground">
                  {p.total ? `${p.done}/${p.total} tasks` : "no checklist"}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export const ControlDetail = () => {
  const { controlId } = useParams<{ controlId: string }>();
  const [params, setParams] = useSearchParams();
  const control: Mitigation | undefined = controlId
    ? mitigationsData[controlId.toLowerCase()]
    : undefined;

  const data = useMemo(() => {
    if (!control) return null;
    return {
      threats: control.threatIds
        .map((id) => threatsData[id])
        .filter(Boolean)
        .sort(compareThreatCodes),
      cited: citedRequirements(control),
      chapters: controlChapters(control),
      chapterOnly: chapterOnlyMappings(control),
      related: relatedControls(control, 4),
      taskTotal: PHASE_ORDER.reduce((n, p) => n + phaseTaskTotal(control, p), 0),
    };
  }, [control]);

  if (!control || !data) {
    return (
      <PageLayout
        title="Control not found"
        description="This security control does not exist in the controls catalog."
        canonicalPath={`/controls/${controlId ?? ""}`}
        noindex
        section="controls"
      >
        <NotFoundEntity type="control" id={controlId} />
      </PageLayout>
    );
  }

  const { threats, cited, chapters, chapterOnly, related, taskTotal } = data;
  const hasTools = !!control.implementationDetail.toolsAndFrameworks?.trim();
  const tabParam = params.get("tab") ?? "";
  const tab: TabKey =
    TAB_KEYS.includes(tabParam as TabKey) && (tabParam !== "tools" || hasTools)
      ? (tabParam as TabKey)
      : "overview";
  const setTab = (v: string) => {
    const next = new URLSearchParams(params);
    if (v === "overview") next.delete("tab");
    else next.set("tab", v);
    setParams(next, { replace: true });
  };
  const code = controlCode(control.id);

  return (
    <PageLayout
      title={`${control.name} (${code})`}
      description={`${control.description} How to implement this AI security control across design, build and operations.`}
      canonicalPath={`/controls/${control.id}`}
      ogType="article"
      section="controls"
      activeId={control.id}
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "TechArticle",
        headline: control.name,
        description: control.description,
        url: `https://agenticsecurity.info/controls/${control.id}`,
        ...(control.lastUpdated ? { dateModified: control.lastUpdated } : {}),
        isPartOf: {
          "@type": "WebSite",
          name: "Agentic Security Hub",
          url: "https://agenticsecurity.info",
        },
      }}
    >
      <Link
        to="/controls"
        className="mb-6 inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="mr-2 h-4 w-4" />
        All controls
      </Link>

      <PageHeader
        eyebrow={`Control ${code}`}
        title={control.name}
        description={control.description}
        source={SOURCES.controls}
        actions={
          <Button asChild size="sm" variant="outline">
            <Link to={`/implementation?control=${control.id}`}>
              <ListChecks aria-hidden className="mr-1.5 h-4 w-4" />
              See in lifecycle
            </Link>
          </Button>
        }
        stats={[
          { label: "threats mitigated", value: threats.length },
          {
            label: "AISVS requirements cited",
            value: cited.length,
            hint: `Specific OWASP AISVS ${SOURCES.aisvs.version} requirements this control helps satisfy.`,
          },
          { label: "checklist tasks", value: taskTotal },
          { label: "references", value: control.references?.length ?? 0 },
        ]}
      >
        <div className="flex flex-wrap items-center gap-3">
          {typeof control.riskScore === "number" && (
            <RiskScore score={control.riskScore} className="w-40" />
          )}
          <span className="flex flex-wrap gap-1.5">
            {PHASE_ORDER.map((p) => (
              <PhaseBadge key={p} phase={p} size="xs" active={phaseApplies(control, p)} />
            ))}
          </span>
        </div>
      </PageHeader>

      <PhaseRings control={control} onSelect={setTab} />

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList
          className={cn("mb-6 grid h-auto w-full", hasTools ? "grid-cols-5" : "grid-cols-4")}
        >
          <TabsTrigger value="overview" className="gap-2">
            <Info aria-hidden className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="design" className="gap-2">
            <PencilRuler aria-hidden className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only">Design</span>
          </TabsTrigger>
          <TabsTrigger value="build" className="gap-2">
            <Hammer aria-hidden className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only">Build</span>
          </TabsTrigger>
          <TabsTrigger value="operations" className="gap-2">
            <Settings aria-hidden className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only">Operations</span>
          </TabsTrigger>
          {hasTools && (
            <TabsTrigger value="tools" className="gap-2">
              <Wrench aria-hidden className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only">Tools</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Mitigates</CardTitle>
            </CardHeader>
            <CardContent>
              {threats.length ? (
                <ul className="grid gap-3 md:grid-cols-2">
                  {threats.map((t) => (
                    <li key={t.id}>
                      <Link
                        to={`/threats/${t.id}`}
                        className="group flex h-full items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs text-muted-foreground">
                              {t.code}
                            </span>
                            <SeverityBadge band={threatBand(t)} size="xs" />
                          </span>
                          <span className="mt-1 block font-semibold group-hover:text-primary">
                            {threatLabel(t)}
                          </span>
                          <span className="mt-0.5 line-clamp-2 block text-sm text-muted-foreground">
                            {t.description}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No threats are mapped to this control.</p>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">AISVS {SOURCES.aisvs.version} mapping</CardTitle>
              </CardHeader>
              <CardContent>
                <Suspense
                  fallback={<div className="h-[300px] animate-pulse rounded-md bg-muted/40" />}
                >
                  <ControlRadar control={control} />
                </Suspense>
                <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Mapped chapters">
                  {chapters.map((c) => (
                    <li key={c}>
                      <Link
                        to={`/aisvs#${c}`}
                        className="inline-flex h-6 items-center rounded border px-1.5 font-mono text-[11px] hover:bg-muted"
                      >
                        {c}
                        {chapterOnly.includes(c) && (
                          <span className="ml-1 text-muted-foreground">(chapter)</span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cited requirements ({cited.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {cited.length ? (
                  <ul className="max-h-[26rem] space-y-2 overflow-y-auto pr-1">
                    {cited.map((r) => (
                      <li key={r.id} className="rounded-md border p-3">
                        <div className="mb-1 flex items-center gap-2">
                          <Link
                            to={`/aisvs#${r.id}`}
                            className="font-mono text-xs font-semibold hover:underline"
                          >
                            {r.id}
                          </Link>
                          <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                            Level {r.level}
                          </Badge>
                        </div>
                        <p className="line-clamp-3 text-sm text-muted-foreground">{r.text}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Mapped at chapter level only; no specific requirement is cited yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {related.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Related controls</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-3 md:grid-cols-2">
                  {related.map(({ control: o, sharedThreatIds }) => (
                    <li key={o.id}>
                      <Link
                        to={`/controls/${o.id}`}
                        className="group flex h-full items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Icon
                          name={o.icon ?? "shield"}
                          className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="font-mono text-xs text-muted-foreground">
                            {controlCode(o.id)}
                          </span>
                          <span className="block font-semibold group-hover:text-primary">
                            {o.name}
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            Shares {sharedThreatIds.length} threat
                            {sharedThreatIds.length === 1 ? "" : "s"}:{" "}
                            {sharedThreatIds.map((id) => threatsData[id]?.code ?? id).join(", ")}
                          </span>
                        </span>
                        <ArrowRight
                          aria-hidden
                          className="mt-1 h-4 w-4 shrink-0 text-muted-foreground"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {control.references?.length ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">References</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {control.references.map((ref) => (
                    <li key={ref.url}>
                      <a
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                      >
                        <ExternalLink
                          aria-hidden
                          className="h-4 w-4 shrink-0 text-muted-foreground"
                        />
                        <span className="text-sm font-medium group-hover:text-primary">
                          {ref.title}
                        </span>
                        <span className="sr-only">(opens in a new tab)</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>

        {PHASE_ORDER.map((p) => (
          <TabsContent key={p} value={p}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  {PHASE_META[p].label} phase
                </CardTitle>
                <p className="text-sm text-muted-foreground">{PHASE_META[p].blurb}</p>
              </CardHeader>
              <CardContent>
                <PhaseChecklist control={control} phase={p} />
              </CardContent>
            </Card>
          </TabsContent>
        ))}

        {hasTools && (
          <TabsContent value="tools">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tools & frameworks</CardTitle>
              </CardHeader>
              <CardContent>
                <RichText
                  text={control.implementationDetail.toolsAndFrameworks}
                  renderCode={renderCodeBlock}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <SourceNote source={SOURCES.controls} className="mt-8" />
    </PageLayout>
  );
};

export default ControlDetail;

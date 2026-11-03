import { useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Crosshair,
  ExternalLink,
  Grid3x3,
  Info,
  Layers,
  Network,
  Shield,
  ShieldCheck,
  ShieldX,
  Workflow,
} from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import PageHeader from "@/components/layout/PageHeader";
import NotFoundEntity from "@/components/layout/NotFoundEntity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { threatsData, type Threat } from "@/components/components/securityData";
import { SeverityBadge } from "@/components/content/SeverityBadge";
import { RiskScore } from "@/components/content/RiskScore";
import { PhaseBadge } from "@/components/content/PhaseBadge";
import { SourceNote } from "@/components/content/SourceNote";
import { RichText } from "@/components/content/RichText";
import { SOURCES } from "@/data/sources";
import { KC_LIST } from "@/data/kc";
import { Icon } from "@/lib/icons";
import { FRAMEWORK_PALETTE, kcColor } from "@/lib/palette";
import { parseBand, severityLabel, severityToken } from "@/lib/severity";
import { cn } from "@/lib/utils";
import { CiaChips } from "@/components/threats/ThreatCard";
import { ThreatConstellation } from "@/components/threats/ThreatConstellation";
import { KillChainStrip } from "@/components/threats/KillChainStrip";
import {
  threatFrameworkRefs,
  type FrameworkKey,
  type FrameworkRef,
} from "@/components/threats/frameworkLinks";
import { threatModelerTarget } from "@/components/threats/modelerLink";
import {
  controlCode,
  mitigationsForThreat,
  threatBand,
  threatLabel,
  threatNeighbours,
} from "@/components/threats/threatIndex";
import { componentsForThreat } from "@/components/kc-components/componentIndex";
import { ScenarioLinks } from "@/components/scenarios/ScenarioLinks";
import { scenariosForThreat } from "@/data/scenarios";
import { PHASE_ORDER, phaseApplies, phaseTaskTotal } from "@/components/controls/phaseTasks";

const TABS = ["overview", "attack-vectors", "mitigations", "components", "frameworks"] as const;
type TabKey = (typeof TABS)[number];

const FRAMEWORK_CARDS: { key: FrameworkKey; title: string; empty: string }[] = [
  {
    key: "asi",
    title: "OWASP Top 10 for Agentic Applications",
    empty: "No Agentic Top 10 entry maps to this threat.",
  },
  {
    key: "cisco",
    title: "Cisco AI Security Taxonomy",
    empty: "No Cisco taxonomy objective is mapped.",
  },
  {
    key: "aivss",
    title: "OWASP AIVSS core risks",
    empty: "No AIVSS core risk shares this threat's ASI entries.",
  },
];

function basisNote(ref: FrameworkRef): string | undefined {
  if (ref.framework === "asi") {
    if (ref.unofficial) return "Editorial mapping (not in Appendix A)";
    if (ref.basis === "appendix") return "Listed in Top 10 Appendix A";
    return undefined;
  }
  if (ref.framework === "aivss") {
    return ref.basis === "primary" ? "Primary ASI entry matches" : "Secondary ASI entry matches";
  }
  return undefined;
}

function FrameworkRefList({ refs, empty }: { refs: FrameworkRef[]; empty: string }) {
  if (!refs.length) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="space-y-2">
      {refs.map((ref) => {
        const note = basisNote(ref);
        const band = ref.severity ? parseBand(ref.severity) : undefined;
        return (
          <li key={`${ref.framework}-${ref.code}`}>
            <Link
              to={ref.href}
              className="group flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span
                aria-hidden
                className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: FRAMEWORK_PALETTE[ref.framework].css }}
              />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-foreground">
                    {ref.code}
                  </span>
                  {band && band !== "none" && <SeverityBadge band={band} size="xs" />}
                  {ref.unofficial && (
                    <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                      editorial
                    </Badge>
                  )}
                </span>
                <span className="mt-0.5 block text-sm font-medium group-hover:text-primary">
                  {ref.name}
                </span>
                {(ref.detail || note) && (
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {[ref.detail, note].filter(Boolean).join(" · ")}
                  </span>
                )}
              </span>
              <ArrowRight
                aria-hidden
                className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function CiaCard({ label, affected }: { label: string; affected: boolean }) {
  const t = severityToken("high");
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border p-4",
        affected ? cn(t.bg, t.border) : "border-muted bg-muted/40",
      )}
    >
      {affected ? (
        <ShieldX aria-hidden className={cn("h-7 w-7 shrink-0", t.fg)} />
      ) : (
        <ShieldCheck aria-hidden className="h-7 w-7 shrink-0 text-muted-foreground" />
      )}
      <div>
        <div className="font-semibold">{label}</div>
        <div className={cn("text-sm font-medium", affected ? t.fg : "text-muted-foreground")}>
          {affected ? "Affected" : "Not affected"}
        </div>
      </div>
    </div>
  );
}

function ThreatPager({ threat }: { threat: Threat }) {
  const { prev, next } = threatNeighbours(threat.id);
  if (!prev && !next) return null;
  return (
    <nav aria-label="Other threats" className="mt-10 grid gap-3 border-t pt-6 sm:grid-cols-2">
      {prev ? (
        <Link
          to={`/threats/${prev.id}`}
          rel="prev"
          className="group flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft
            aria-hidden
            className="h-4 w-4 shrink-0 text-muted-foreground group-hover:-translate-x-0.5"
          />
          <span className="min-w-0">
            <span className="block text-xs text-muted-foreground">Previous · {prev.code}</span>
            <span className="block truncate font-medium">{threatLabel(prev)}</span>
          </span>
        </Link>
      ) : (
        <span className="hidden sm:block" />
      )}
      {next && (
        <Link
          to={`/threats/${next.id}`}
          rel="next"
          className="group flex items-center justify-end gap-3 rounded-lg border p-4 text-right transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="min-w-0">
            <span className="block text-xs text-muted-foreground">Next · {next.code}</span>
            <span className="block truncate font-medium">{threatLabel(next)}</span>
          </span>
          <ArrowRight
            aria-hidden
            className="h-4 w-4 shrink-0 text-muted-foreground group-hover:translate-x-0.5"
          />
        </Link>
      )}
    </nav>
  );
}

export const ThreatDetail = () => {
  const { threatId } = useParams<{ threatId: string }>();
  const [params, setParams] = useSearchParams();
  const threat: Threat | undefined = threatId ? threatsData[threatId.toLowerCase()] : undefined;

  const data = useMemo(() => {
    if (!threat) return null;
    const refs = threatFrameworkRefs(threat);
    const components = componentsForThreat(threat.id);
    return {
      refs,
      refCount: refs.asi.length + refs.cisco.length + refs.aivss.length,
      mitigations: mitigationsForThreat(threat.id),
      components,
      modeler: threatModelerTarget(threat),
      scenarios: scenariosForThreat(threat.id),
      kcGroups: KC_LIST.map((kc) => ({
        kc,
        entries: components.filter((e) => e.kc === kc.id),
      })).filter((g) => g.entries.length > 0),
    };
  }, [threat]);

  if (!threat || !data) {
    return (
      <PageLayout
        title="Threat not found"
        description="This threat does not exist in the agentic threat catalog."
        canonicalPath={`/threats/${threatId ?? ""}`}
        noindex
        section="threats"
      >
        <NotFoundEntity type="threat" id={threatId} />
      </PageLayout>
    );
  }

  const { refs, refCount, mitigations, components, modeler, kcGroups, scenarios } = data;
  const tabParam = params.get("tab");
  const activeTab: TabKey = (TABS as readonly string[]).includes(tabParam ?? "")
    ? (tabParam as TabKey)
    : "overview";
  const setTab = (v: string) => {
    const next = new URLSearchParams(params);
    if (v === "overview") next.delete("tab");
    else next.set("tab", v);
    setParams(next, { replace: true });
  };
  const tabHref = (tab: TabKey) => `/threats/${threat.id}?tab=${tab}`;

  const vectorCount = threat.attackVectors?.length ?? 0;
  const band = threatBand(threat);
  const kcCodes = [...new Set(components.map((c) => c.kc))];

  return (
    <PageLayout
      title={`${threat.name} (${threat.code})`}
      description={`${threat.description} Attack vectors, affected components and mitigations for this agentic AI threat.`}
      canonicalPath={`/threats/${threat.id}`}
      ogType="article"
      section="threats"
      activeId={threat.id}
      keywords={`${threat.name}, AI security threat, OWASP, agentic systems, ${threat.tags?.join(", ") || ""}, AI threats, security vulnerabilities`}
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "TechArticle",
        headline: threat.name,
        description: threat.description,
        url: `https://agenticsecurity.info/threats/${threat.id}`,
        ...(threat.lastUpdated ? { dateModified: threat.lastUpdated } : {}),
        author: { "@type": "Organization", name: "OWASP" },
        publisher: { "@type": "Organization", name: "OWASP", url: "https://owasp.org" },
        about: "AI Security Threat",
        keywords: threat.tags?.join(", ") || "",
        isPartOf: {
          "@type": "WebSite",
          name: "Agentic Security Hub",
          url: "https://agenticsecurity.info",
        },
      }}
    >
      <Link
        to="/threats"
        className="mb-6 inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="mr-2 h-4 w-4" />
        All threats
      </Link>

      <PageHeader
        eyebrow={`Threat ${threat.code}`}
        title={threat.name}
        description={threat.description}
        source={SOURCES.threats}
        actions={
          <>
            <Button asChild size="sm">
              <Link to={modeler.href} title={modeler.reason}>
                <Workflow aria-hidden className="mr-1.5 h-4 w-4" />
                Open in Threat Modeler
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/threats?view=heatmap">
                <Grid3x3 aria-hidden className="mr-1.5 h-4 w-4" />
                Heatmap
              </Link>
            </Button>
          </>
        }
        stats={[
          {
            label: "risk",
            value: typeof threat.riskScore === "number" ? `${threat.riskScore}/10` : "n/a",
            hint: `This site's 1–10 risk rating (${severityLabel(band)}).`,
          },
          { label: "attack vectors", value: vectorCount },
          { label: "mitigating controls", value: mitigations.length },
          {
            label: "framework refs",
            value: refCount,
            hint: "OWASP Agentic Top 10, Cisco taxonomy and AIVSS entries linked to this threat.",
          },
        ]}
      >
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge
            band={band}
            score={threat.riskScore}
            showScore={typeof threat.riskScore === "number"}
          />
          <CiaChips threat={threat} />
          {kcCodes.map((id) => {
            const kc = KC_LIST.find((k) => k.id === id);
            return (
              <Link
                key={id}
                to={`/components/${id}`}
                className="inline-flex h-6 items-center gap-1.5 rounded-full border px-2 text-xs font-medium hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span
                  aria-hidden
                  className="h-2 w-2 rounded-full"
                  style={{ background: kcColor(id) }}
                />
                {kc?.code ?? id.toUpperCase()}
                <span className="sr-only"> {kc?.name}</span>
              </Link>
            );
          })}
          {threat.alternateNames?.length ? (
            <span className="text-xs text-muted-foreground">
              Also called {threat.alternateNames.join(", ")}
            </span>
          ) : null}
        </div>
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setTab} className="w-full">
        <TabsList className="mb-6 grid h-auto w-full grid-cols-5">
          <TabsTrigger value="overview" className="gap-2">
            <Info aria-hidden className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="attack-vectors" className="gap-2">
            <Crosshair aria-hidden className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only">Attack vectors</span>
            <span className="hidden text-xs text-muted-foreground md:inline">({vectorCount})</span>
          </TabsTrigger>
          <TabsTrigger value="mitigations" className="gap-2">
            <Shield aria-hidden className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only">Controls</span>
            <span className="hidden text-xs text-muted-foreground md:inline">
              ({mitigations.length})
            </span>
          </TabsTrigger>
          <TabsTrigger value="components" className="gap-2">
            <Layers aria-hidden className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only">Components</span>
            <span className="hidden text-xs text-muted-foreground md:inline">
              ({components.length})
            </span>
          </TabsTrigger>
          <TabsTrigger value="frameworks" className="gap-2">
            <Network aria-hidden className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only">Frameworks</span>
            <span className="hidden text-xs text-muted-foreground md:inline">({refCount})</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Impact analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {threat.impactAnalysis ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <CiaCard
                    label="Confidentiality"
                    affected={threat.impactAnalysis.confidentiality}
                  />
                  <CiaCard label="Integrity" affected={threat.impactAnalysis.integrity} />
                  <CiaCard label="Availability" affected={threat.impactAnalysis.availability} />
                </div>
              ) : (
                <p className="text-muted-foreground">No impact analysis available.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
              <CardTitle className="text-lg">Top controls</CardTitle>
              <Link
                to={tabHref("mitigations")}
                className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                All {mitigations.length}
              </Link>
            </CardHeader>
            <CardContent>
              {mitigations.length ? (
                <ul className="grid gap-3 md:grid-cols-2">
                  {[...mitigations]
                    .sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0))
                    .slice(0, 4)
                    .map((m) => (
                      <li key={m.id}>
                        <Link
                          to={`/controls/${m.id}`}
                          className="group flex h-full flex-col gap-1 rounded-lg border p-4 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <span className="font-mono text-xs text-muted-foreground">
                            {controlCode(m.id)}
                          </span>
                          <span className="font-semibold group-hover:text-primary">{m.name}</span>
                          <span className="line-clamp-2 text-sm text-muted-foreground">
                            {m.description}
                          </span>
                        </Link>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No controls are mapped to this threat.</p>
              )}
            </CardContent>
          </Card>

          {threat.references?.length ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">References</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {threat.references.map((ref) => (
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

        {/* Attack vectors → kill chain */}
        <TabsContent value="attack-vectors">
          <h2 className="mb-2 text-lg font-semibold">Kill chain</h2>
          <KillChainStrip
            threat={threat}
            controls={mitigations}
            allControlsHref={tabHref("mitigations")}
          />
          <ScenarioLinks scenarios={scenarios} className="mt-8" />
        </TabsContent>

        {/* Controls */}
        <TabsContent value="mitigations">
          <h2 className="sr-only">Mitigating controls</h2>
          {mitigations.length ? (
            <ul className="grid gap-4">
              {mitigations.map((m) => (
                <li key={m.id} className="card-hover relative rounded-lg border bg-card p-5">
                  <div className="flex items-start gap-4">
                    <span className="mt-0.5 shrink-0 text-muted-foreground">
                      <Icon name={m.icon ?? "shield"} className="h-6 w-6" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3 className="text-lg font-semibold">
                          <Link
                            to={`/controls/${m.id}`}
                            className="after:absolute after:inset-0 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <span className="mr-2 font-mono text-sm text-muted-foreground">
                              {controlCode(m.id)}
                            </span>
                            {m.name}
                          </Link>
                        </h3>
                        {typeof m.riskScore === "number" && (
                          <RiskScore score={m.riskScore} className="w-36" />
                        )}
                      </div>
                      <RichText
                        text={m.description}
                        variant="compact"
                        glossary={false}
                        className="mt-1"
                      />
                      <div className="relative z-10 mt-3 flex flex-wrap gap-2">
                        {PHASE_ORDER.map((p) => {
                          const n = phaseTaskTotal(m, p);
                          return phaseApplies(m, p) ? (
                            <Link
                              key={p}
                              to={`/controls/${m.id}?tab=${p}`}
                              className="inline-flex items-center gap-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              aria-label={`${m.name}, ${p} phase${n ? `: ${n} tasks` : ""}`}
                            >
                              <PhaseBadge phase={p} size="xs" />
                              {n > 0 && (
                                <span className="text-xs tabular-nums text-muted-foreground">
                                  {n}
                                </span>
                              )}
                            </Link>
                          ) : (
                            <PhaseBadge key={p} phase={p} size="xs" active={false} />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No controls are mapped to this threat.</p>
          )}
        </TabsContent>

        {/* Components */}
        <TabsContent value="components" className="space-y-6">
          <h2 className="sr-only">Affected components</h2>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Key components (KC1–KC6) where {threat.code} applies. A sub-component marked “inherited”
            has no mapping of its own; the source maps the threat to its parent.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {kcGroups.map(({ kc, entries }) => (
              <Card key={kc.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span
                      aria-hidden
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ background: kcColor(kc.id) }}
                    />
                    <Link
                      to={`/components/${kc.id}`}
                      className="hover:text-primary hover:underline"
                    >
                      {kc.code} · {kc.name}
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5">
                    {entries
                      .filter((e) => e.depth > 0)
                      .map((e) => (
                        <li key={e.id}>
                          <Link
                            to={`/components/${e.id}`}
                            className={cn(
                              "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                              e.depth > 1 && "ml-4",
                            )}
                          >
                            <span className="w-16 shrink-0 font-mono text-xs text-muted-foreground">
                              {e.code}
                            </span>
                            <span className="min-w-0 flex-1 truncate">{e.title}</span>
                            {e.inherited && (
                              <span className="shrink-0 text-[11px] text-muted-foreground">
                                inherited from {e.inheritedFrom?.toUpperCase()}
                              </span>
                            )}
                          </Link>
                        </li>
                      ))}
                    {entries.every((e) => e.depth === 0) && (
                      <li className="text-sm text-muted-foreground">
                        Mapped to the component as a whole.
                      </li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
          {threat.affectedComponents?.length ? (
            <div>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                As described in the source
              </h3>
              <ul className="flex flex-wrap gap-2">
                {threat.affectedComponents.map((c) => (
                  <li key={c}>
                    <Badge variant="outline">{c}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </TabsContent>

        {/* Frameworks */}
        <TabsContent value="frameworks" className="space-y-6">
          <h2 className="sr-only">Framework mappings</h2>
          <ThreatConstellation threat={threat} refs={refs} />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {FRAMEWORK_CARDS.map((f) => (
              <Card key={f.key}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span
                      aria-hidden
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ background: FRAMEWORK_PALETTE[f.key].css }}
                    />
                    {f.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FrameworkRefList refs={refs[f.key]} empty={f.empty} />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <ThreatPager threat={threat} />
      <SourceNote source={SOURCES.threats} className="mt-6" />
    </PageLayout>
  );
};

export default ThreatDetail;

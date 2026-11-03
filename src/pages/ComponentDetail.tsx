import { useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  GitMerge,
  Info,
  Shield,
  Workflow,
} from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import PageHeader from "@/components/layout/PageHeader";
import NotFoundEntity from "@/components/layout/NotFoundEntity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { threatsData, type Mitigation, type Threat } from "@/components/components/securityData";
import { getComponentById } from "@/components/components/frameworkData";
import { architecturesData } from "@/components/components/architecturesData";
import { RichText } from "@/components/content/RichText";
import { SeverityBadge } from "@/components/content/SeverityBadge";
import { PhaseBadge } from "@/components/content/PhaseBadge";
import { SourceNote } from "@/components/content/SourceNote";
import { SOURCES } from "@/data/sources";
import { KC } from "@/data/kc";
import { threatModelerPathFor } from "@/config/navigation";
import { Icon } from "@/lib/icons";
import { kcColor } from "@/lib/palette";
import { severityLabel } from "@/lib/severity";
import { cn } from "@/lib/utils";
import {
  componentEntry,
  descendantsOf,
  threatIdsInKc,
  type ComponentEntry,
} from "@/components/kc-components/componentIndex";
import {
  MITIGATION_LIST,
  compareThreatCodes,
  controlCode,
  threatBand,
  threatLabel,
} from "@/components/threats/threatIndex";
import { PHASE_META, PHASE_ORDER, phaseApplies } from "@/components/controls/phaseTasks";
import { renderCodeBlock } from "@/components/controls/renderCode";

const TABS = ["overview", "threats", "mitigations", "architectures"] as const;
type TabKey = (typeof TABS)[number];

/** A pattern uses a node when one of its key components is the node, a descendant or an ancestor. */
function usesComponent(keyComponents: string[], id: string): string[] {
  return keyComponents.filter((k) => {
    const kk = k.toLowerCase();
    return kk === id || kk.startsWith(`${id}.`) || id.startsWith(`${kk}.`);
  });
}

function KcPill({ entry }: { entry: ComponentEntry }) {
  return (
    <span
      className="inline-flex h-6 items-center rounded-full border px-2 font-mono text-xs font-semibold text-foreground"
      style={{ background: kcColor(entry.kc, 0.14), borderColor: kcColor(entry.kc, 0.45) }}
    >
      {entry.code}
    </span>
  );
}

function ControlGuidance({ control }: { control: Mitigation }) {
  const sections = [
    ...PHASE_ORDER.map((p) => ({
      key: p,
      label: `${PHASE_META[p].label} phase`,
      text: control.implementationDetail[PHASE_META[p].field],
    })),
    {
      key: "tools",
      label: "Tools & frameworks",
      text: control.implementationDetail.toolsAndFrameworks,
    },
  ].filter((s) => s.text?.trim());
  if (!sections.length) return null;
  return (
    <Accordion type="multiple" className="rounded-md border px-3">
      {sections.map((s) => (
        <AccordionItem key={s.key} value={s.key} className="last:border-b-0">
          <AccordionTrigger className="py-3 text-sm hover:no-underline">{s.label}</AccordionTrigger>
          <AccordionContent>
            <RichText text={s.text} variant="compact" renderCode={renderCodeBlock} />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

const ComponentDetail = () => {
  const { componentId } = useParams<{ componentId: string }>();
  const [params, setParams] = useSearchParams();
  const entry = componentEntry(componentId);

  const data = useMemo(() => {
    if (!entry) return null;
    const node = getComponentById(entry.id);
    const root = getComponentById(entry.kc);
    const parent = componentEntry(entry.parentId);
    const threatIds = entry.depth === 0 ? threatIdsInKc(entry.kc) : entry.threatIds;
    const threats = threatIds
      .map((id) => threatsData[id])
      .filter((t): t is Threat => !!t)
      .sort(compareThreatCodes);
    const threatSet = new Set(threats.map((t) => t.id));
    const controls = MITIGATION_LIST.filter((m) => m.threatIds.some((t) => threatSet.has(t)));
    const relevance = new Map((root?.relatedArchitectures ?? []).map((a) => [a.id, a.relevance]));
    const architectures = Object.values(architecturesData)
      .map((a) => ({
        arch: a,
        uses: usesComponent(a.keyComponents, entry.id),
        relevance: relevance.get(a.id),
      }))
      .filter((x) => x.uses.length > 0 || (entry.depth === 0 && x.relevance))
      .sort(
        (a, b) =>
          Number(b.relevance === "primary") - Number(a.relevance === "primary") ||
          b.uses.length - a.uses.length,
      );
    return {
      node,
      root,
      parent,
      threats,
      controls,
      architectures,
      children: entry.childIds.map((c) => componentEntry(c)).filter(Boolean) as ComponentEntry[],
      descendants: descendantsOf(entry.id),
    };
  }, [entry]);

  if (!entry || !data) {
    return (
      <PageLayout
        title="Component not found"
        description="This component does not exist in the agentic components framework."
        canonicalPath={`/components/${componentId ?? ""}`}
        noindex
        section="components"
      >
        <NotFoundEntity type="component" id={componentId} />
      </PageLayout>
    );
  }

  const { node, root, parent, threats, controls, architectures, children, descendants } = data;
  const kc = KC[entry.kc];
  const isSub = entry.depth > 0;
  const source = isSub ? SOURCES.components : SOURCES.kc;
  const description = entry.description || kc.description;
  const tabParam = params.get("tab");
  const tab: TabKey = (TABS as readonly string[]).includes(tabParam ?? "")
    ? (tabParam as TabKey)
    : "overview";
  const setTab = (v: string) => {
    const next = new URLSearchParams(params);
    if (v === "overview") next.delete("tab");
    else next.set("tab", v);
    setParams(next, { replace: true });
  };
  const threatCodes = threats.map((t) => t.code);

  return (
    <PageLayout
      title={`${entry.title} (${entry.code})`}
      description={`${description} Threats, controls and architecture patterns for this agentic AI component.`}
      canonicalPath={`/components/${entry.id}`}
      ogType="article"
      section="components"
      activeId={entry.id}
      keywords={`${entry.title}, ${entry.code}, AI security, OWASP, agentic systems, ${threatCodes.join(", ")}`}
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "TechArticle",
        headline: entry.title,
        description,
        url: `https://agenticsecurity.info/components/${entry.id}`,
        dateModified: source.retrievedAt,
        author: { "@type": "Organization", name: "OWASP" },
        publisher: { "@type": "Organization", name: "OWASP", url: "https://owasp.org" },
        about: "AI Security",
        keywords: threatCodes.join(", "),
        isPartOf: {
          "@type": "WebSite",
          name: "Agentic Security Hub",
          url: "https://agenticsecurity.info",
        },
      }}
    >
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          <li>
            <Link to="/components" className="inline-flex items-center hover:text-foreground">
              <ArrowLeft aria-hidden className="mr-1.5 h-4 w-4" />
              Components
            </Link>
          </li>
          {isSub && (
            <li className="flex items-center gap-1.5">
              <span aria-hidden>/</span>
              <Link to={`/components/${kc.id}`} className="hover:text-foreground">
                {kc.code} {kc.name}
              </Link>
            </li>
          )}
          {parent && parent.depth > 0 && (
            <li className="flex items-center gap-1.5">
              <span aria-hidden>/</span>
              <Link to={`/components/${parent.id}`} className="hover:text-foreground">
                {parent.code} {parent.title}
              </Link>
            </li>
          )}
        </ol>
      </nav>

      <PageHeader
        eyebrow={isSub ? `Sub-component of ${kc.code}` : "Key component"}
        title={entry.title}
        description={description}
        source={source}
        stats={[
          ...(descendants.length ? [{ label: "sub-components", value: descendants.length }] : []),
          {
            label: "threats",
            value: threats.length,
            hint: entry.inherited
              ? `No mapping of its own; inherited from ${entry.inheritedFrom?.toUpperCase()}.`
              : isSub
                ? undefined
                : "Distinct threats mapped to this component or any sub-component.",
          },
          {
            label: "controls",
            value: controls.length,
            hint: "Controls that mitigate at least one of these threats.",
          },
          { label: "architecture patterns", value: architectures.length },
        ]}
      >
        <div className="flex flex-wrap items-center gap-2">
          <KcPill entry={entry} />
          {entry.inherited && (
            <Badge variant="outline" className="text-xs">
              Threats inherited from {entry.inheritedFrom?.toUpperCase()}
            </Badge>
          )}
        </div>
      </PageHeader>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="mb-6 grid h-auto w-full grid-cols-4">
          <TabsTrigger value="overview" className="gap-2">
            <Info aria-hidden className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="threats" className="gap-2">
            <AlertTriangle aria-hidden className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only">Threats</span>
            <span className="hidden text-xs text-muted-foreground md:inline">
              ({threats.length})
            </span>
          </TabsTrigger>
          <TabsTrigger value="mitigations" className="gap-2">
            <Shield aria-hidden className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only">Controls</span>
            <span className="hidden text-xs text-muted-foreground md:inline">
              ({controls.length})
            </span>
          </TabsTrigger>
          <TabsTrigger value="architectures" className="gap-2">
            <GitMerge aria-hidden className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only">Architectures</span>
            <span className="hidden text-xs text-muted-foreground md:inline">
              ({architectures.length})
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {children.length > 0 && (
            <section aria-labelledby="subcomponents">
              <h2 id="subcomponents" className="mb-3 text-lg font-semibold">
                Sub-components
              </h2>
              <ul className="grid gap-3 md:grid-cols-2">
                {children.map((c) => (
                  <li key={c.id}>
                    <Link
                      to={`/components/${c.id}`}
                      className="group flex h-full items-start gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="font-mono text-xs text-muted-foreground">{c.code}</span>
                        <span className="block font-semibold group-hover:text-primary">
                          {c.title}
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-sm text-muted-foreground">
                          {c.description}
                        </span>
                        <span className="mt-1.5 block text-xs text-muted-foreground">
                          {c.threatIds.length} threat{c.threatIds.length === 1 ? "" : "s"}
                          {c.inherited ? " (inherited)" : ""}
                          {c.childIds.length ? ` · ${c.childIds.length} sub-components` : ""}
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
            </section>
          )}

          {root?.securityImplications && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Security implications{isSub ? ` of ${kc.code}` : ""}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RichText text={root.securityImplications} variant="compact" />
              </CardContent>
            </Card>
          )}
          {root?.implementationConsiderations && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Implementation considerations{isSub ? ` for ${kc.code}` : ""}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RichText text={root.implementationConsiderations} variant="compact" />
              </CardContent>
            </Card>
          )}

          {!isSub && (root?.relatedComponents?.length ?? 0) > 0 && (
            <section aria-labelledby="related-components">
              <h2 id="related-components" className="mb-3 text-lg font-semibold">
                Related components
              </h2>
              <ul className="flex flex-wrap gap-2">
                {root!.relatedComponents!.map((id) => {
                  const rel = componentEntry(id);
                  return rel ? (
                    <li key={rel.id}>
                      <Link
                        to={`/components/${rel.id}`}
                        className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span
                          aria-hidden
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: kcColor(rel.kc) }}
                        />
                        {rel.code} · {rel.title}
                      </Link>
                    </li>
                  ) : null;
                })}
              </ul>
            </section>
          )}
          {isSub && node?.description == null && (
            <p className="text-sm text-muted-foreground">
              No further detail is documented for this sub-component.
            </p>
          )}
        </TabsContent>

        <TabsContent value="threats" className="space-y-4">
          <h2 className="sr-only">Threats to {entry.title}</h2>
          {entry.inherited && (
            <p className="text-sm text-muted-foreground">
              The source maps these threats to {entry.inheritedFrom?.toUpperCase()} as a whole; this
              sub-component has no mapping of its own.
            </p>
          )}
          {threats.length ? (
            <ul className="grid gap-4 md:grid-cols-2">
              {threats.map((t) => (
                <li
                  key={t.id}
                  className="card-hover relative flex flex-col rounded-lg border bg-card p-5"
                >
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{t.code}</span>
                    <SeverityBadge band={threatBand(t)} size="xs" />
                  </div>
                  <h3 className="font-semibold">
                    <Link
                      to={`/threats/${t.id}`}
                      className="after:absolute after:inset-0 hover:underline focus-visible:outline-none"
                    >
                      {t.name}
                    </Link>
                  </h3>
                  <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{t.description}</p>
                  <ul
                    className="relative z-10 mt-3 flex flex-wrap gap-1.5"
                    aria-label="Components affected"
                  >
                    {[...new Set(t.componentIds.map((c) => c.toLowerCase()))].map((c) => {
                      const ce = componentEntry(c);
                      return ce ? (
                        <li key={c}>
                          <Link
                            to={`/components/${ce.id}`}
                            className="inline-flex h-6 items-center gap-1 rounded border px-1.5 font-mono text-[11px] hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <span
                              aria-hidden
                              className="h-2 w-2 rounded-full"
                              style={{ background: kcColor(ce.kc) }}
                            />
                            {ce.code}
                          </Link>
                        </li>
                      ) : null;
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No threats are mapped to this component.</p>
          )}
        </TabsContent>

        <TabsContent value="mitigations" className="space-y-4">
          <h2 className="sr-only">Controls for {entry.title}</h2>
          {controls.length ? (
            <ul className="space-y-4">
              {controls.map((m) => {
                const mitigated = m.threatIds
                  .filter((id) => threats.some((t) => t.id === id))
                  .map((id) => threatsData[id])
                  .filter(Boolean)
                  .sort(compareThreatCodes);
                return (
                  <li key={m.id} className="rounded-lg border bg-card p-5">
                    <div className="flex items-start gap-3">
                      <Icon
                        name={m.icon ?? "shield"}
                        className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground"
                      />
                      <div className="min-w-0 flex-1 space-y-3">
                        <div>
                          <span className="font-mono text-xs text-muted-foreground">
                            {controlCode(m.id)}
                          </span>
                          <h3 className="font-semibold">
                            <Link
                              to={`/controls/${m.id}`}
                              className="hover:text-primary hover:underline"
                            >
                              {m.name}
                            </Link>
                          </h3>
                          <RichText
                            text={m.description}
                            variant="compact"
                            glossary={false}
                            className="mt-1"
                          />
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {PHASE_ORDER.map((p) => (
                            <PhaseBadge key={p} phase={p} size="xs" active={phaseApplies(m, p)} />
                          ))}
                          <span className="mx-1 h-4 w-px bg-border" aria-hidden />
                          <span className="text-xs text-muted-foreground">Mitigates here:</span>
                          {mitigated.map((t) => (
                            <Link
                              key={t.id}
                              to={`/threats/${t.id}`}
                              title={threatLabel(t)}
                              className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                              <SeverityBadge band={threatBand(t)} label={t.code} size="xs" />
                              <span className="sr-only">
                                {" "}
                                {threatLabel(t)}, {severityLabel(threatBand(t))} risk
                              </span>
                            </Link>
                          ))}
                        </div>
                        <ControlGuidance control={m} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-muted-foreground">No controls address this component's threats.</p>
          )}
        </TabsContent>

        <TabsContent value="architectures" className="space-y-4">
          <h2 className="sr-only">Architecture patterns using {entry.title}</h2>
          {architectures.length ? (
            <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {architectures.map(({ arch, uses, relevance }) => (
                <li key={arch.id} className="flex flex-col rounded-lg border bg-card p-5">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">
                      <Link
                        to={`/architectures/${arch.id}`}
                        className="hover:text-primary hover:underline"
                      >
                        {arch.name}
                      </Link>
                    </h3>
                    {relevance && (
                      <Badge
                        variant={relevance === "primary" ? "default" : "outline"}
                        className="h-5 px-1.5 text-[10px]"
                      >
                        {relevance === "primary" ? "Primary role" : "Supporting role"}
                      </Badge>
                    )}
                  </div>
                  <p className="line-clamp-3 text-sm text-muted-foreground">{arch.description}</p>
                  {uses.length > 0 && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Uses{" "}
                      {uses.map((u, i) => (
                        <span key={u}>
                          {i > 0 && ", "}
                          <Link
                            to={`/components/${u.toLowerCase()}`}
                            className={cn("font-mono hover:text-foreground hover:underline")}
                          >
                            {u.toUpperCase()}
                          </Link>
                        </span>
                      ))}
                    </p>
                  )}
                  <div className="mt-auto flex flex-wrap gap-2 pt-4">
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/architectures/${arch.id}`}>View pattern</Link>
                    </Button>
                    <Button asChild size="sm" variant="ghost">
                      <Link to={threatModelerPathFor(arch.id)}>
                        <Workflow aria-hidden className="mr-1.5 h-4 w-4" />
                        Model it
                      </Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No architecture pattern lists this component.</p>
          )}
        </TabsContent>
      </Tabs>

      <SourceNote source={source} className="mt-8" />
    </PageLayout>
  );
};

export default ComponentDetail;

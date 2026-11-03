import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { ArrowLeft, ArrowRight, Crosshair, ExternalLink } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import PageHeader from "@/components/layout/PageHeader";
import NotFoundEntity from "@/components/layout/NotFoundEntity";
import { threatModelerPathFor } from "@/config/navigation";
import { architecturesData, type Architecture } from "@/components/components/architecturesData";
import { componentDataMap } from "@/components/components/componentDataMap";
import { getComponentById } from "@/components/components/frameworkData";
import { threatsData, mitigationsData, type Threat } from "@/components/components/securityData";
import { threatBandCounts } from "@/components/home/siteStats";
import AttackPathPlayer from "@/components/visual/AttackPathPlayer";
import { buildAttackPath, threatIdsInText } from "@/components/visual/attackPath";
import { Heatmap, type HeatmapCell } from "@/components/charts/Heatmap";
import { Sunburst, type HierarchyDatum } from "@/components/charts/Sunburst";
import { Sparkline } from "@/components/charts/Sparkline";
import { ChartLegend } from "@/components/charts/ChartFrame";
import { SeverityBadge } from "@/components/content/SeverityBadge";
import { PhaseBadge } from "@/components/content/PhaseBadge";
import { SourceNote } from "@/components/content/SourceNote";
import { EmptyState } from "@/components/content/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SOURCES } from "@/data/sources";
import { KC, kcByCode, type KcId } from "@/data/kc";
import { scenariosForArchitecture } from "@/data/scenarios";
import { ScenarioLinks } from "@/components/scenarios/ScenarioLinks";
import { BANDS, riskBand, severityColor, severityLabel } from "@/lib/severity";
import { stagger } from "@/lib/motion";
import { useReveal } from "@/hooks/useReveal";
import { cn } from "@/lib/utils";

// Real-world examples per architecture id (keys must match architecturesData ids).
const realWorldExamples: Record<string, string[]> = {
  sequential: [
    "Basic chatbots with linear conversation flows",
    "Simple automation pipelines (e.g., data processing workflows)",
    "Step-by-step customer support bots",
    "Document processing agents with sequential validation",
    "Linear content generation workflows",
  ],
  hierarchical: [
    "Multi-agent task orchestration systems",
    "Complex workflow engines with specialized agents",
    "Enterprise RPA with sub-process delegation",
    "AI-powered project management with task breakdown",
    "Research assistants with domain-specific sub-agents",
  ],
  collaborative: [
    "Distributed problem-solving agent networks",
    "Collaborative content creation systems",
    "Multi-agent game AI with peer coordination",
    "Decentralized decision-making systems",
    "Swarm intelligence applications",
  ],
  reactive: [
    "Real-time monitoring agents for infrastructure and security",
    "Event-driven chatbots with dynamic response capabilities",
    "IoT device controllers with adaptive behavior",
    "Automated incident response systems",
    "Live customer support with real-time context adaptation",
  ],
  knowledge_intensive: [
    "Research assistants for scientific literature analysis",
    "Legal document review and case law synthesis",
    "Medical diagnosis support with clinical knowledge retrieval",
    "Enterprise knowledge management and search systems",
    "Financial analysis agents with regulatory document access",
  ],
};

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "diagram", label: "Diagram" },
  { id: "components", label: "Components" },
  { id: "threats", label: "Threats" },
  { id: "mitigations", label: "Mitigations" },
] as const;
type TabId = (typeof TABS)[number]["id"];
const isTab = (v: string | null): v is TabId => TABS.some((t) => t.id === v);

const ORDERED = Object.values(architecturesData).sort(
  (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
);

const LG_QUERY = "(min-width: 1024px)";
function useIsLg(): boolean {
  return useSyncExternalStore(
    (cb) => {
      if (typeof window === "undefined" || !window.matchMedia) return () => {};
      const mq = window.matchMedia(LG_QUERY);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => typeof window !== "undefined" && !!window.matchMedia?.(LG_QUERY).matches,
    () => false,
  );
}

function componentTitle(id: string): string {
  return componentDataMap[id]?.title ?? getComponentById(id)?.title ?? id.toUpperCase();
}
function componentDescription(id: string): string {
  return componentDataMap[id]?.description ?? getComponentById(id)?.description ?? "";
}
/** Threat catalog mapping: the threat lists the component's KC in `componentIds`. */
function threatAffectsComponent(threat: Threat, compId: string): boolean {
  const root = compId.split(".")[0];
  return (threat.componentIds ?? []).some((c) => c === compId || c === root);
}
function kcOf(compId: string): KcId | undefined {
  return kcByCode(compId)?.id;
}
function archTitleOf(arch: Architecture): string {
  return /\barchitecture$/i.test(arch.name.trim()) ? arch.name : `${arch.name} Architecture`;
}
function shortArchName(arch: Architecture): string {
  return arch.name.replace(/\s+(Agent\s+)?Architecture$/i, "").trim();
}

// ─── Tabs ─────────────────────────────────────────────────────────────────

function OverviewTab({ arch, onGo }: { arch: Architecture; onGo: (tab: TabId) => void }) {
  const examples = realWorldExamples[arch.id] ?? [];
  const counts = threatBandCounts(arch.threatIds);
  return (
    <div className="space-y-6">
      {arch.detailedDescription && (
        <section aria-labelledby="ov-desc">
          <h2 id="ov-desc" className="mb-2 text-lg font-semibold">
            How it works
          </h2>
          <p className="leading-relaxed text-muted-foreground">{arch.detailedDescription}</p>
        </section>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <section aria-labelledby="ov-glance" className="rounded-lg border bg-card p-4">
          <h2 id="ov-glance" className="mb-3 text-base font-semibold">
            At a glance
          </h2>
          <Sparkline counts={counts} showText width={96} height={24} />
          <ul className="mt-3 space-y-1.5 text-sm">
            {(
              [
                ["components", arch.keyComponents.length, "key components"],
                ["threats", arch.threatIds.length, "threats"],
                ["mitigations", arch.mitigationIds.length, "mitigations"],
                ["diagram", arch.relevantThreats?.length ?? 0, "attack scenarios to walk"],
              ] as const
            ).map(([tab, n, label]) => (
              <li key={tab}>
                <button
                  type="button"
                  onClick={() => onGo(tab)}
                  className="inline-flex items-center gap-1.5 text-left hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="font-mono font-medium tabular-nums">{n}</span>
                  <span className="text-muted-foreground">{label}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </section>

        {examples.length > 0 && (
          <section aria-labelledby="ov-examples" className="rounded-lg border bg-card p-4">
            <h2 id="ov-examples" className="mb-2 text-base font-semibold">
              Real-world examples
            </h2>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {examples.map((ex) => (
                <li key={ex}>{ex}</li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {arch.references && arch.references.length > 0 && (
        <section aria-labelledby="ov-refs">
          <h2 id="ov-refs" className="mb-2 text-base font-semibold">
            References
          </h2>
          <ul className="space-y-1 text-sm">
            {arch.references.map((ref) => (
              <li key={ref.url}>
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
                >
                  {ref.title}
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
      <SourceNote source={SOURCES.architectures} />
    </div>
  );
}

function DiagramTab({ arch }: { arch: Architecture }) {
  const scenarios = arch.relevantThreats ?? [];
  const [selected, setSelected] = useState(0);
  const scenario = scenarios[selected];
  const path = useMemo(
    () => (scenario ? buildAttackPath(arch.id, scenario) : undefined),
    [arch.id, scenario],
  );
  const title = `${shortArchName(arch)} diagram`;

  return (
    <div className="space-y-4">
      <section aria-labelledby="walk-title" className="space-y-3">
        <div>
          <h2 id="walk-title" className="text-lg font-semibold">
            Walk an attack
          </h2>
          <p className="text-sm text-muted-foreground">
            Pick a scenario to see how it moves through the {shortArchName(arch).toLowerCase()}{" "}
            pattern. The hit component is chosen from the KC named in the scenario, otherwise from
            the threat&apos;s affected components.
          </p>
        </div>
        {scenarios.length > 0 ? (
          <>
            <ToggleGroup.Root
              type="single"
              value={String(selected)}
              onValueChange={(v) => v && setSelected(Number(v))}
              aria-label="Attack scenario"
              className="flex flex-wrap gap-2"
            >
              {scenarios.map((s, i) => {
                const ids = threatIdsInText(s.title);
                const band = ids.length
                  ? riskBand(Math.max(...ids.map((id) => threatsData[id]?.riskScore ?? 0)))
                  : "high";
                return (
                  <ToggleGroup.Item
                    key={s.title}
                    value={String(i)}
                    className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-left text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=on]:border-primary data-[state=on]:bg-primary/5 data-[state=on]:font-medium"
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: severityColor(band) }}
                      aria-hidden="true"
                    />
                    {s.title}
                  </ToggleGroup.Item>
                );
              })}
            </ToggleGroup.Root>
            {scenario && (
              <p className="rounded-md border-l-2 border-[hsl(var(--security-high))] bg-muted/30 p-3 text-sm text-muted-foreground">
                {scenario.description}
              </p>
            )}
          </>
        ) : (
          <EmptyState compact title="No attack scenarios documented for this pattern." />
        )}
      </section>

      <AttackPathPlayer
        architectureId={arch.id}
        steps={path?.steps ?? []}
        autoplay
        title={title}
        diagramClassName="w-full h-[420px]"
        toolbar={
          scenarios.length > 1 ? (
            <span className="flex items-center gap-1">
              <button
                type="button"
                className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
                onClick={() => setSelected((i) => Math.max(0, i - 1))}
                disabled={selected === 0}
              >
                ← Previous scenario
              </button>
              <button
                type="button"
                className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
                onClick={() => setSelected((i) => Math.min(scenarios.length - 1, i + 1))}
                disabled={selected === scenarios.length - 1}
              >
                Next scenario →
              </button>
            </span>
          ) : undefined
        }
      />
      {path && path.threatIds.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Threats in this scenario:{" "}
          {path.threatIds.map((id, i) => (
            <span key={id}>
              {i > 0 && ", "}
              <Link to={`/threats/${id}`} className="text-primary hover:underline">
                {threatsData[id].code} {threatsData[id].shortName ?? threatsData[id].name}
              </Link>
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

function ComponentsTab({ arch }: { arch: Architecture }) {
  const navigate = useNavigate();
  const threats = useMemo(
    () => arch.threatIds.map((id) => threatsData[id]).filter(Boolean) as Threat[],
    [arch],
  );
  const { ref } = useReveal<HTMLUListElement>();

  // Arc size = threats affecting the component (min 1 so untouched components stay visible);
  // labels print the real count via formatValue.
  const { data, hitCount } = useMemo(() => {
    const hitCount = new Map<string, number>();
    const groups = new Map<KcId, HierarchyDatum[]>();
    const groupThreats = new Map<KcId, Set<string>>();
    arch.keyComponents.forEach((compId) => {
      const kc = kcOf(compId);
      if (!kc) return;
      const hits = threats.filter((t) => threatAffectsComponent(t, compId));
      hitCount.set(compId, hits.length);
      const seen = groupThreats.get(kc) ?? new Set<string>();
      hits.forEach((t) => seen.add(t.id));
      groupThreats.set(kc, seen);
      const list = groups.get(kc) ?? [];
      list.push({
        id: compId,
        name: componentTitle(compId),
        value: Math.max(1, hits.length),
        href: `/components/${compId}`,
      });
      groups.set(kc, list);
    });
    groupThreats.forEach((set, kc) => hitCount.set(`group-${kc}`, set.size));
    hitCount.set(arch.id, threats.length);
    const data: HierarchyDatum = {
      id: arch.id,
      name: shortArchName(arch),
      children: Array.from(groups.entries()).map(([kc, children]) => ({
        id: `group-${kc}`,
        name: `${KC[kc].code} ${KC[kc].short}`,
        color: KC[kc].color,
        children,
      })),
    };
    return { data, hitCount };
  }, [arch, threats]);

  return (
    <div className="space-y-6">
      <Sunburst
        title="Key components by KC"
        description={`Inner ring: key component (KC) families; outer ring: the ${arch.keyComponents.length} components this pattern uses, sized by how many of its ${threats.length} threats affect them (components with none keep a thin slice).`}
        ariaLabel={`Sunburst of ${arch.keyComponents.length} key components grouped by KC, sized by threat count`}
        data={data}
        valueLabel="threats"
        formatValue={(d) => {
          const n = hitCount.get(d.id) ?? 0;
          return `${n} threat${n === 1 ? "" : "s"}`;
        }}
        size={380}
        onNavigate={(d) => {
          if (d.href) navigate(d.href);
        }}
      />
      <section aria-labelledby="comp-list">
        <h2 id="comp-list" className="mb-3 text-base font-semibold">
          Components used
        </h2>
        <ul ref={ref} className="grid gap-3 md:grid-cols-2">
          {arch.keyComponents.map((compId, i) => {
            const kc = kcOf(compId);
            const node = getComponentById(compId);
            const subs = node?.children?.length ?? 0;
            const hits = threats.filter((t) => threatAffectsComponent(t, compId));
            return (
              <li key={compId} className="enter" style={stagger(i)}>
                <Link
                  to={`/components/${compId}`}
                  className="card-hover group flex h-full flex-col rounded-lg border bg-card p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="rounded px-1.5 py-0.5 font-mono text-xs"
                      style={{
                        backgroundColor: kc ? `hsl(var(${KC[kc].colorVar}) / 0.15)` : undefined,
                      }}
                    >
                      {compId.toUpperCase()}
                    </span>
                    <span className="font-medium">{componentTitle(compId)}</span>
                  </span>
                  <span className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                    {componentDescription(compId)}
                  </span>
                  <span className="mt-2 text-xs text-muted-foreground">
                    {hits.length} of {threats.length} threats
                    {subs > 0 && ` · ${subs} sub-component${subs === 1 ? "" : "s"}`}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function ThreatsTab({ arch }: { arch: Architecture }) {
  const navigate = useNavigate();
  const threats = useMemo(
    () =>
      (arch.threatIds.map((id) => threatsData[id]).filter(Boolean) as Threat[]).sort(
        (a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0),
      ),
    [arch],
  );
  const maxVectors = Math.max(1, ...threats.map((t) => t.attackVectors?.length ?? 0));
  const kcs = Array.from(
    new Set(arch.keyComponents.map(kcOf).filter((k): k is KcId => !!k)),
  ).sort();
  const columns = arch.keyComponents
    .filter((c) => kcOf(c))
    .sort(
      (a, b) =>
        (kcOf(a) ?? "").localeCompare(kcOf(b) ?? "") || a.localeCompare(b, "en", { numeric: true }),
    )
    .map((c) => ({
      id: c,
      label: componentTitle(c),
      short: c.toUpperCase(),
      group: kcOf(c),
      href: `/components/${c}`,
    }));
  const cells = (rowId: string, colId: string): HeatmapCell | undefined => {
    const t = threatsData[rowId];
    if (!t || !threatAffectsComponent(t, colId)) return undefined;
    const vectors = t.attackVectors?.length ?? 0;
    return {
      value: t.riskScore,
      band: riskBand(t.riskScore),
      glyph: vectors / maxVectors,
      label: `${t.code} ${t.shortName ?? t.name} affects ${componentTitle(colId)}: risk ${t.riskScore}/10, ${vectors} attack vectors`,
    };
  };
  const scenarios = arch.relevantThreats ?? [];
  const walkthroughs = useMemo(() => scenariosForArchitecture(arch.id), [arch.id]);

  return (
    <div className="space-y-6">
      {scenarios.length > 0 && (
        <section aria-labelledby="scenarios-title">
          <h2 id="scenarios-title" className="mb-1 text-lg font-semibold">
            How this pattern gets attacked
          </h2>
          <p className="mb-3 text-sm text-muted-foreground">
            {scenarios.length} scenarios specific to this architecture. Animate each one on the
            Diagram tab, or open a step-by-step walkthrough below.
          </p>
          <ul className="grid gap-3 md:grid-cols-2">
            {scenarios.map((s) => {
              const ids = threatIdsInText(s.title);
              return (
                <li key={s.title} className="rounded-lg border bg-card p-4">
                  <h3 className="font-medium">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                  {ids.length > 0 && (
                    <p className="mt-2 flex flex-wrap gap-1.5">
                      {ids.map((id) => (
                        <Link
                          key={id}
                          to={`/threats/${id}`}
                          className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <SeverityBadge
                            score={threatsData[id].riskScore}
                            size="xs"
                            label={threatsData[id].code}
                          />
                        </Link>
                      ))}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {walkthroughs.length > 0 && (
        <ScenarioLinks
          scenarios={walkthroughs}
          title="Step-by-step attack walkthroughs"
          max={walkthroughs.length}
        />
      )}

      {threats.length > 0 && columns.length > 0 && (
        <Heatmap
          title="Threat × component map"
          description={`Rows: the ${threats.length} threats linked to this pattern, by risk. Columns: its ${columns.length} key components grouped by KC. A cell means the threat catalog lists that component's KC; colour and number = risk, dot size = attack vectors.`}
          ariaLabel={`Heatmap of ${threats.length} threats against ${columns.length} components`}
          rows={threats.map((t) => ({
            id: t.id,
            label: `${t.code} ${t.shortName ?? t.name}`,
            href: `/threats/${t.id}`,
          }))}
          columns={columns}
          groups={kcs.map((k) => ({ id: k, label: KC[k].code, color: KC[k].color }))}
          cells={cells}
          rowHeaderLabel="Threat"
          onCellClick={(row) => navigate(`/threats/${row.id}`)}
          onRowHeaderClick={(row) => navigate(`/threats/${row.id}`)}
          legend={
            <ChartLegend
              items={BANDS.filter((b) => b !== "info").map((b) => ({
                id: b,
                label: severityLabel(b),
                color: severityColor(b),
              }))}
            />
          }
        />
      )}

      <section aria-labelledby="threat-list">
        <h2 id="threat-list" className="mb-3 text-base font-semibold">
          Associated threats
        </h2>
        {threats.length ? (
          <ul className="divide-y rounded-lg border bg-card">
            {threats.map((t) => (
              <li
                key={t.id}
                className="flex flex-col gap-1 p-4 sm:flex-row sm:items-start sm:gap-4"
              >
                <SeverityBadge score={t.riskScore} showScore size="xs" className="shrink-0" />
                <div className="min-w-0">
                  <Link to={`/threats/${t.id}`} className="font-medium hover:underline">
                    <span className="font-mono text-sm text-muted-foreground">{t.code}</span>{" "}
                    {t.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">{t.description}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState compact title="No threats documented." />
        )}
      </section>
    </div>
  );
}

function MitigationsTab({ arch }: { arch: Architecture }) {
  const mitigations = arch.mitigationIds.map((id) => mitigationsData[id]).filter(Boolean);
  const archThreats = new Set(arch.threatIds);
  const { ref } = useReveal<HTMLUListElement>();
  if (!mitigations.length) return <EmptyState compact title="No mitigations documented." />;
  return (
    <section aria-labelledby="mit-title">
      <h2 id="mit-title" className="mb-1 text-lg font-semibold">
        Mitigations
      </h2>
      <p className="mb-3 text-sm text-muted-foreground">
        {mitigations.length} controls linked to this pattern, with the lifecycle phases they apply
        to and which of its threats they address.
      </p>
      <ul ref={ref} className="grid gap-3 md:grid-cols-2">
        {mitigations.map((m, i) => {
          const covers = (m.threatIds ?? []).filter((id) => archThreats.has(id));
          return (
            <li key={m.id} className="enter" style={stagger(i)}>
              <article className="card-hover relative flex h-full flex-col rounded-lg border bg-card p-4 focus-within:ring-2 focus-within:ring-ring">
                <h3 className="font-medium">
                  <Link
                    to={`/controls/${m.id}`}
                    className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
                  >
                    {m.name}
                  </Link>
                </h3>
                <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{m.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <PhaseBadge phase="design" active={m.designPhase} size="xs" />
                  <PhaseBadge phase="build" active={m.buildPhase} size="xs" />
                  <PhaseBadge phase="operations" active={m.operationPhase} size="xs" />
                </div>
                {covers.length > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Addresses{" "}
                    {covers
                      .map((id) => threatsData[id]?.code)
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

const ArchitectureDetail = () => {
  const { architectureId } = useParams<{ architectureId: string }>();
  const [params, setParams] = useSearchParams();
  const isLg = useIsLg();
  const architecture: Architecture | undefined = architectureId
    ? architecturesData[architectureId]
    : undefined;

  const tabParam = params.get("tab");
  const tab: TabId = isTab(tabParam) ? tabParam : "overview";
  const setTab = useCallback(
    (next: string) => {
      const p = new URLSearchParams(params);
      if (next === "overview") p.delete("tab");
      else p.set("tab", next);
      setParams(p, { replace: true });
    },
    [params, setParams],
  );

  if (!architecture) {
    return (
      <PageLayout
        title="Architecture not found"
        description="This architecture pattern does not exist in the catalog."
        canonicalPath={`/architectures/${architectureId ?? ""}`}
        noindex
        section="architectures"
      >
        <NotFoundEntity type="architecture" id={architectureId} />
      </PageLayout>
    );
  }

  // Names such as "Hierarchical Agent Architecture" already carry the suffix (P0-04).
  const archTitle = archTitleOf(architecture);
  const idx = ORDERED.findIndex((a) => a.id === architecture.id);
  const prev = idx > 0 ? ORDERED[idx - 1] : undefined;
  const next = idx >= 0 && idx < ORDERED.length - 1 ? ORDERED[idx + 1] : undefined;
  const tabCounts: Partial<Record<TabId, number>> = {
    diagram: architecture.relevantThreats?.length ?? 0,
    components: architecture.keyComponents.length,
    threats: architecture.threatIds.length,
    mitigations: architecture.mitigationIds.length,
  };

  return (
    <PageLayout
      title={archTitle}
      description={`${architecture.description} Learn about security threats, mitigations, and implementation best practices for this AI architecture pattern.`}
      canonicalPath={`/architectures/${architecture.id}`}
      ogType="article"
      section="architectures"
      activeId={architecture.id}
      keywords={`${architecture.name}, AI architecture, OWASP, agentic systems, ${architecture.tags?.join(", ") || ""}, AI security patterns, architecture security`}
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "TechArticle",
        headline: archTitle,
        description: architecture.description,
        url: `https://agenticsecurity.info/architectures/${architecture.id}`,
        ...(architecture.lastUpdated ? { dateModified: architecture.lastUpdated } : {}),
        author: { "@type": "Organization", name: "OWASP" },
        publisher: { "@type": "Organization", name: "OWASP", url: "https://owasp.org" },
        about: "AI Architecture Security",
        keywords: architecture.tags?.join(", ") || "",
        isPartOf: {
          "@type": "WebSite",
          name: "Agentic Security Hub",
          url: "https://agenticsecurity.info",
        },
      }}
    >
      <Link
        to="/architectures"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> All architectures
      </Link>

      <PageHeader
        eyebrow="Architecture pattern"
        title={architecture.name}
        description={architecture.description}
        stats={[
          { label: "key components", value: architecture.keyComponents.length },
          { label: "threats", value: architecture.threatIds.length },
          { label: "mitigations", value: architecture.mitigationIds.length },
          ...(architecture.riskScore != null
            ? [
                {
                  label: `risk (${severityLabel(riskBand(architecture.riskScore)).toLowerCase()})`,
                  value: `${architecture.riskScore}/10`,
                  hint: "Editorial pattern risk score (1–10)",
                },
              ]
            : []),
        ]}
        actions={
          <Link
            to={threatModelerPathFor(architecture.id)}
            className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Crosshair className="h-3.5 w-3.5" aria-hidden="true" />
            Open in Threat Modeler
          </Link>
        }
      >
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {(architecture.tags ?? []).map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-secondary px-2 py-0.5 text-secondary-foreground"
            >
              {tag}
            </span>
          ))}
          <span>
            v{architecture.version ?? "–"} · updated {architecture.lastUpdated ?? "–"}
            {architecture.updatedBy ? ` by ${architecture.updatedBy}` : ""}
          </span>
        </div>
      </PageHeader>

      <Tabs
        value={tab}
        onValueChange={setTab}
        orientation={isLg ? "vertical" : "horizontal"}
        className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_11rem]"
      >
        <TabsList
          aria-label="On this page"
          className="h-auto w-full justify-start overflow-x-auto lg:sticky lg:top-20 lg:col-start-2 lg:row-start-1 lg:flex-col lg:items-stretch lg:self-start lg:bg-transparent lg:p-0"
        >
          {TABS.map((t) => (
            <TabsTrigger
              key={t.id}
              value={t.id}
              className="justify-between gap-2 lg:rounded-none lg:border-l-2 lg:border-transparent lg:px-3 lg:py-1.5 lg:data-[state=active]:border-primary lg:data-[state=active]:bg-muted/50 lg:data-[state=active]:shadow-none"
            >
              {t.label}
              {tabCounts[t.id] != null && (
                <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                  {tabCounts[t.id]}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <TabsContent value="overview" className="mt-0">
            <OverviewTab arch={architecture} onGo={setTab} />
          </TabsContent>
          <TabsContent value="diagram" className="mt-0">
            <DiagramTab key={architecture.id} arch={architecture} />
          </TabsContent>
          <TabsContent value="components" className="mt-0">
            <ComponentsTab arch={architecture} />
          </TabsContent>
          <TabsContent value="threats" className="mt-0">
            <ThreatsTab arch={architecture} />
          </TabsContent>
          <TabsContent value="mitigations" className="mt-0">
            <MitigationsTab arch={architecture} />
          </TabsContent>
        </div>
      </Tabs>

      <nav
        aria-label="Other architecture patterns"
        className="mt-12 grid gap-3 border-t pt-6 sm:grid-cols-2"
      >
        {prev ? (
          <Link
            to={`/architectures/${prev.id}`}
            className="group rounded-lg border p-4 transition-colors hover:bg-muted/50"
            rel="prev"
          >
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <ArrowLeft className="h-3 w-3" aria-hidden="true" /> Previous pattern
            </span>
            <span className="mt-1 block font-medium">{prev.name}</span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link
            to={`/architectures/${next.id}`}
            className={cn(
              "group rounded-lg border p-4 text-right transition-colors hover:bg-muted/50",
            )}
            rel="next"
          >
            <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
              Next pattern <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </span>
            <span className="mt-1 block font-medium">{next.name}</span>
          </Link>
        )}
      </nav>
    </PageLayout>
  );
};

export default ArchitectureDetail;

import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Workflow } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/content/EmptyState";
import { SeverityBadge } from "@/components/content/SeverityBadge";
import { SourceNote } from "@/components/content/SourceNote";
import { Button } from "@/components/ui/button";
import { ScenarioWalkthrough } from "@/components/scenarios/ScenarioWalkthrough";
import { StopControls } from "@/components/scenarios/StopControls";
import { ScenarioLinks } from "@/components/scenarios/ScenarioLinks";
import { architecturesData, source as archSource } from "@/components/components/architecturesData";
import {
  agenticTop10Data,
  source as asiSource,
} from "@/components/components/owaspAgenticTop10Data";
import { threatsData } from "@/components/components/securityData";
import { threatModelerPathFor } from "@/config/navigation";
import {
  adjacentScenarios,
  getScenario,
  scenarioPath,
  scenariosForArchitecture,
  scenariosForAsi,
} from "@/data/scenarios";

const chip =
  "inline-flex items-center gap-1 rounded-full border bg-muted/40 px-2.5 py-0.5 text-xs font-medium hover:border-primary/50 hover:text-primary";

export default function Scenario() {
  const { id } = useParams<{ id: string }>();
  const scenario = getScenario(id);

  const related = useMemo(() => {
    if (!scenario) return [];
    const pool = [
      ...(scenario.asiId ? scenariosForAsi(scenario.asiId) : []),
      ...scenariosForArchitecture(scenario.archId),
    ];
    const seen = new Set([scenario.id]);
    return pool.filter((s) => !seen.has(s.id) && seen.add(s.id));
  }, [scenario]);

  if (!scenario) {
    return (
      <PageLayout
        title="Scenario not found"
        description="This attack walkthrough does not exist."
        canonicalPath={`/scenarios/${id ?? ""}`}
        noindex
      >
        <EmptyState
          icon="target"
          title="Scenario not found"
          description={`There is no attack walkthrough with the id “${id}”.`}
          action={{ label: "Browse the OWASP Agentic Top 10", href: "/taxonomy?tab=owasp-agentic" }}
        />
      </PageLayout>
    );
  }

  const arch = architecturesData[scenario.archId];
  const asi = scenario.asiId ? agenticTop10Data.find((e) => e.id === scenario.asiId) : undefined;
  const adj = adjacentScenarios(scenario.id);
  const src = scenario.source === "asi" ? asiSource : archSource;

  return (
    <PageLayout
      title={`${scenario.title} · Attack walkthrough`}
      description={`${scenario.summary} A step-by-step agentic AI attack walkthrough and the controls that stop it.`}
      canonicalPath={scenarioPath(scenario.id)}
      ogType="article"
      className="space-y-8"
    >
      <PageHeader
        eyebrow={
          scenario.source === "asi" && asi
            ? `Attack walkthrough · ${asi.code} ${asi.name}`
            : `Attack walkthrough · ${arch?.name}`
        }
        title={scenario.title}
        description={scenario.summary}
        actions={
          <Button asChild variant="outline">
            <Link to={threatModelerPathFor(scenario.archId)}>
              <Workflow aria-hidden="true" />
              Open in Threat Modeler
            </Link>
          </Button>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge band={scenario.severity} size="sm" />
          {arch && (
            <Link to={`/architectures/${arch.id}`} className={chip}>
              {arch.name}
            </Link>
          )}
          {asi && (
            <Link to={`/taxonomy?tab=owasp-agentic&entry=${asi.id}`} className={chip}>
              {asi.code} {asi.name}
            </Link>
          )}
          {scenario.threatIds.map((tid) => (
            <Link key={tid} to={`/threats/${tid}`} className={chip}>
              {threatsData[tid].code} {threatsData[tid].shortName ?? threatsData[tid].name}
            </Link>
          ))}
        </div>
      </PageHeader>

      <ScenarioWalkthrough key={scenario.id} scenario={scenario} />

      <StopControls key={`stop-${scenario.id}`} scenario={scenario} />

      {related.length > 0 && <ScenarioLinks scenarios={related} title="Related walkthroughs" />}

      <SourceNote source={src} prefix="Scenario source" />

      {adj && (
        <nav
          aria-label="Previous and next walkthrough"
          className="flex flex-wrap justify-between gap-3 border-t pt-6"
        >
          <Button
            asChild
            variant="ghost"
            className="h-auto max-w-[48%] justify-start whitespace-normal py-2 text-left"
          >
            <Link to={scenarioPath(adj.prev.id)}>
              <ArrowLeft aria-hidden="true" />
              <span>
                <span className="block text-xs text-muted-foreground">Previous</span>
                {adj.prev.title}
              </span>
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            className="ml-auto h-auto max-w-[48%] justify-end whitespace-normal py-2 text-right"
          >
            <Link to={scenarioPath(adj.next.id)}>
              <span>
                <span className="block text-xs text-muted-foreground">Next</span>
                {adj.next.title}
              </span>
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </nav>
      )}
    </PageLayout>
  );
}

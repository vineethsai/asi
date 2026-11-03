import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  GitBranch,
  GraduationCap,
  Layers,
  Network,
  Target,
  Users,
} from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import PageHeader from "@/components/layout/PageHeader";
import { SITE_STATS } from "@/components/home/siteStats";
import { SourceNote } from "@/components/content/SourceNote";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SOURCES, DATA_RETRIEVED_AT, type DataSourceKey } from "@/data/sources";
import { LEARNING_STEPS, learningStepPath } from "@/data/learningPath";
import { getIcon } from "@/lib/icons";
import { useReveal } from "@/hooks/useReveal";
import { stagger } from "@/lib/motion";

const GITHUB_URL = "https://github.com/vineethsai/asi";
const OWASP_URL = "https://owasp.org/www-project-securing-agentic-applications/";

// Every number on this page is computed from the data modules (via SITE_STATS).
const S = SITE_STATS;

/** What each data source feeds on this site (keys of SOURCES). */
const SOURCE_LABELS: Record<DataSourceKey, string> = {
  aisvs: "AISVS requirements",
  threats: "Threat catalog",
  controls: "Controls",
  top10: "Agentic Top 10",
  llmTop10: "LLM Top 10",
  cisco: "Cisco AI taxonomy",
  atlas: "MITRE ATLAS",
  aiuc1: "AIUC-1",
  aivss: "AIVSS scores",
  kc: "Key components",
  components: "Component details",
  architectures: "Architecture patterns",
  nist: "NIST AI RMF",
};
const SOURCE_ENTRIES = (Object.keys(SOURCES) as DataSourceKey[]).map((key) => ({
  key,
  label: SOURCE_LABELS[key] ?? key,
  source: SOURCES[key],
}));

const CONTRIBUTE = [
  "Report vulnerabilities via GitHub issue templates",
  "Submit pull requests for new controls or threats",
  "Improve documentation and implementation guides",
  "Share feedback on the interactive assessment tools",
  "Help expand AISVS verification requirements",
];

/** Methodology = the learning path's steps (LEARNING_STEPS), so About and /learn cannot drift. */
function MethodologyStepper() {
  const { ref } = useReveal<HTMLOListElement>();
  const total = LEARNING_STEPS.length;
  return (
    <section aria-labelledby="methodology" className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h2 id="methodology" className="text-2xl font-bold tracking-tight">
            Methodology
          </h2>
          <p className="mt-1 text-muted-foreground">
            A structured path from system analysis through implementation to governance. Each of the{" "}
            {total} steps has its own reference page and a short quiz on the learning path.
          </p>
        </div>
        <Button asChild variant="outline" size="sm" className="self-start sm:self-auto">
          <Link to="/learn">
            <GraduationCap className="mr-2 h-4 w-4" aria-hidden="true" />
            Start the learning path
          </Link>
        </Button>
      </div>

      <ol ref={ref} className="relative space-y-3">
        {LEARNING_STEPS.map((step, i) => {
          const Icon = getIcon(step.icon);
          const page = step.readings[0];
          const last = i === total - 1;
          return (
            <li key={step.id} className="enter relative flex gap-4" style={stagger(i)}>
              {/* Rail: number badge + connector to the next step */}
              <div className="flex flex-col items-center" aria-hidden="true">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-primary/40 bg-background font-mono text-sm font-semibold text-primary">
                  {step.number}
                </span>
                {!last && <span className="mt-1 w-px flex-1 bg-border" />}
              </div>
              <article className="card-hover mb-1 flex flex-1 flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:gap-4">
                <Icon
                  className="hidden h-5 w-5 shrink-0 text-muted-foreground sm:block"
                  aria-hidden="true"
                />
                <div className="flex-1">
                  <h3 className="font-semibold">
                    <span className="sr-only">
                      Step {step.number} of {total}:{" "}
                    </span>
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{step.summary}</p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  {page && (
                    <Link
                      to={page.path}
                      className="inline-flex items-center gap-1 font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {page.label}
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  )}
                  <Link
                    to={learningStepPath(step.id)}
                    className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
                    Learn<span className="sr-only">: {step.title}</span>
                  </Link>
                </div>
              </article>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function SourcesList() {
  return (
    <section aria-labelledby="sources" className="space-y-4">
      <div>
        <h2 id="sources" className="text-2xl font-bold tracking-tight">
          Data sources
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The {SOURCE_ENTRIES.length} datasets behind every page, with the version used and when it
          was last retrieved (most recent:{" "}
          <time dateTime={DATA_RETRIEVED_AT}>{DATA_RETRIEVED_AT}</time>).
        </p>
      </div>
      <ul className="grid gap-x-6 gap-y-2 rounded-lg border bg-card p-4 md:grid-cols-2">
        {SOURCE_ENTRIES.map(({ key, label, source }) => (
          <li key={key}>
            <SourceNote source={source} prefix={label} className="text-sm" />
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function About() {
  const { ref: cardsRef } = useReveal<HTMLDivElement>();
  return (
    <PageLayout
      title="About"
      description="About the Agentic Security Hub: an open, OWASP-aligned companion for securing AI agents, with its sources, methodology, data versions and how to contribute."
      canonicalPath="/about"
      className="space-y-12"
    >
      <PageHeader
        eyebrow="About"
        title="About the Agentic Security Hub"
        description="An interactive companion to the OWASP Securing Agentic Applications guide, providing security practitioners with actionable tools, frameworks, and verification standards for building secure AI agent systems."
        stats={[
          { label: "threats", value: S.threats, hint: `${S.attackVectors} attack vectors` },
          { label: "controls", value: S.controls },
          {
            label: "AISVS requirements",
            value: S.aisvsRequirements,
            hint: `AISVS ${S.aisvsVersion}, ${S.aisvsChapters} chapters`,
          },
          { label: "architecture patterns", value: S.patterns },
          {
            label: "frameworks mapped",
            value: S.taxonomyFrameworks,
            hint: "Taxonomy crosswalk tabs",
          },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                <GitBranch className="mr-2 h-4 w-4" aria-hidden="true" />
                GitHub
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={OWASP_URL} target="_blank" rel="noopener noreferrer">
                <BookOpen className="mr-2 h-4 w-4" aria-hidden="true" />
                OWASP project
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </Button>
          </div>
        }
      />

      {/* Project overview */}
      <div ref={cardsRef} className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="enter bg-card" style={stagger(0)}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              Mission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Provide comprehensive, practical security guidance for organizations developing and
              deploying AI agentic systems. We bridge the gap between security theory and
              implementation with interactive tools.
            </p>
          </CardContent>
        </Card>
        <Card className="enter bg-card" style={stagger(1)}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Network className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              Scope
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Covers the full lifecycle of agentic AI security: from component-level threat modeling
              and architecture patterns to verification standards and operational monitoring aligned
              with NIST AI RMF.
            </p>
          </CardContent>
        </Card>
        <Card className="enter bg-card" style={stagger(2)}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Layers className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              Framework
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Built on {S.keyComponents} key components ({S.componentNodes} nodes), {S.patterns}{" "}
              architecture patterns, {S.threats} threats with {S.attackVectors} attack vectors,{" "}
              {S.controls} controls, and {S.aisvsRequirements} AISVS {S.aisvsVersion} requirements
              across {S.aisvsChapters} chapters, mapped to {S.nistSubcategories} NIST AI RMF
              subcategories and {S.taxonomyFrameworks} external frameworks.
            </p>
          </CardContent>
        </Card>
      </div>

      <MethodologyStepper />

      {/* Contributing */}
      <section aria-labelledby="contributing" className="space-y-6">
        <h2 id="contributing" className="text-2xl font-bold tracking-tight">
          Contributing
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <GitBranch className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                Open Source
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                This project is fully open source. We welcome contributions including new threat
                research, control recommendations, vulnerability disclosures, and documentation
                improvements.
              </p>
              <Button asChild variant="outline" className="w-full">
                <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                  <GitBranch className="mr-2 h-4 w-4" aria-hidden="true" />
                  View on GitHub
                  <ExternalLink className="ml-2 h-3 w-3" aria-hidden="true" />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </Button>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                OWASP Community
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Part of the OWASP ecosystem for application security. Join the community to
                collaborate on securing AI systems and share knowledge with security professionals
                worldwide.
              </p>
              <Button asChild variant="outline" className="w-full">
                <a href={OWASP_URL} target="_blank" rel="noopener noreferrer">
                  <BookOpen className="mr-2 h-4 w-4" aria-hidden="true" />
                  OWASP Project Page
                  <ExternalLink className="ml-2 h-3 w-3" aria-hidden="true" />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card">
          <CardContent className="space-y-4 p-6 md:p-8">
            <h3 className="text-lg font-semibold">How to Contribute</h3>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {CONTRIBUTE.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2
                    className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span className="text-sm text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <SourcesList />
    </PageLayout>
  );
}

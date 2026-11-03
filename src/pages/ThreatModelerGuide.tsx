import { Suspense, lazy, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { PageHeader, type PageHeaderStat } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import AgenticSemantics from "@/components/threat-modeler/guide/AgenticSemantics";
import ComponentReference from "@/components/threat-modeler/guide/ComponentReference";
import ShortcutsSection from "@/components/threat-modeler/guide/ShortcutsSection";
import TemplatesSection from "@/components/threat-modeler/guide/TemplatesSection";
import {
  Callout,
  DefinitionList,
  GuideSection,
  Kbd,
  SubHeading,
} from "@/components/threat-modeler/guide/GuideSection";
import {
  GUIDE_TOC,
  sectionNumber,
  type GuideSectionId,
} from "@/components/threat-modeler/guide/guideData";
import { PALETTE_SECTIONS } from "@/components/threat-modeler/paletteData";
import { SEMANTIC_TYPES } from "@/components/threat-modeler/semanticTypes";
import { SHORTCUTS, formatKey } from "@/components/threat-modeler/shortcuts";
import { ARCHITECTURE_TEMPLATES } from "@/components/threat-modeler/templates";

// Both import the rule catalog, so they load as separate chunks.
const MaestroStack = lazy(() => import("@/components/threat-modeler/guide/MaestroStack"));
const RulesBrowser = lazy(() => import("@/components/threat-modeler/guide/RulesBrowser"));

const PALETTE_COUNT = PALETTE_SECTIONS.reduce((n, s) => n + s.entries.length, 0);

const STATS: PageHeaderStat[] = [
  {
    label: "palette components",
    value: PALETTE_COUNT,
    hint: `${PALETTE_SECTIONS.length} groups`,
  },
  { label: "agentic types", value: SEMANTIC_TYPES.length },
  { label: "templates", value: ARCHITECTURE_TEMPLATES.length },
  { label: "shortcuts", value: SHORTCUTS.length },
];

/** Ctrl / ⌘ chord rendered as key caps for the current platform. */
function Chord({ keys }: { keys: string[] }) {
  return (
    <span className="inline-flex items-center gap-0.5 align-middle">
      {keys.map((k, i) => (
        <span key={k} className="inline-flex items-center gap-0.5">
          {i > 0 && (
            <span aria-hidden className="text-[11px] text-muted-foreground">
              +
            </span>
          )}
          <Kbd>{formatKey(k)}</Kbd>
        </span>
      ))}
    </span>
  );
}

function Section(props: { id: GuideSectionId; lead?: ReactNode; children: ReactNode }) {
  const entry = GUIDE_TOC.find((s) => s.id === props.id)!;
  return (
    <GuideSection
      id={props.id}
      number={sectionNumber(props.id)}
      title={entry.title}
      lead={props.lead}
    >
      {props.children}
    </GuideSection>
  );
}

function SectionLink({ id, children }: { id: GuideSectionId; children?: ReactNode }) {
  const entry = GUIDE_TOC.find((s) => s.id === id)!;
  return (
    <a href={`#${id}`} className="text-primary hover:underline">
      {children ?? `§${sectionNumber(id)} ${entry.title}`}
    </a>
  );
}

function ChunkFallback({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="h-40 animate-pulse rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground"
    >
      Loading {label}…
    </div>
  );
}

function Toc() {
  return (
    <nav aria-labelledby="guide-toc-heading" className="text-sm">
      <h2
        id="guide-toc-heading"
        className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
      >
        On this page
      </h2>
      <ol className="space-y-1">
        {GUIDE_TOC.map((s, i) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              className="flex gap-2 rounded px-1 py-0.5 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="w-5 shrink-0 text-right font-mono text-[11px] leading-5">
                {i + 1}.
              </span>
              <span>{s.title}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

const QUICK_START: { title: string; body: ReactNode }[] = [
  {
    title: "Place an agent",
    body: (
      <>
        Drag <strong>Agent</strong> from the Agentic group of the palette onto the canvas, or click
        (tap) the entry to add it to the middle of the view. Give it a name and a trust level in the
        properties panel.
      </>
    ),
  },
  {
    title: "Connect a tool",
    body: (
      <>
        Add a <strong>Scoped tool</strong> and drag from the agent&apos;s handle to the tool to draw
        a data flow. From the keyboard: select the agent, press <Kbd>C</Kbd>, focus the tool and
        press <Kbd>Enter</Kbd>. Set the flow&apos;s authentication and encryption.
      </>
    ),
  },
  {
    title: "Run the analysis",
    body: (
      <>
        Press <strong>Analyze</strong> or <Chord keys={["Mod", "Enter"]} />. Findings appear on the
        components and in the results panel, each naming the rule that fired and the evidence it
        matched.
      </>
    ),
  },
];

export default function ThreatModelerGuide() {
  return (
    <PageLayout
      title="Threat Modeler Guide"
      description="How to model an agentic AI system in the Threat Modeler: components, agentic semantics, data flows, MAESTRO layers, how the analysis scores threats, every rule, templates, saving, sharing and shortcuts."
      canonicalPath="/threat-modeler-guide"
    >
      <PageHeader
        eyebrow="Tools"
        title="Threat Modeler Guide"
        description="How to model an agentic system, what the analysis engine checks and how to read its results. The reference tables are generated from the modeler's own palette, rule catalog, templates and shortcuts, so they always match the tool."
        stats={STATS}
        actions={
          <Button asChild>
            <Link to="/threat-modeler">
              Open the modeler <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
            </Link>
          </Button>
        }
      />

      <div className="mt-8 lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10">
        <aside className="mb-8 rounded-lg border p-3 lg:sticky lg:top-24 lg:mb-0 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto lg:border-0 lg:p-0">
          <Toc />
        </aside>

        <div className="min-w-0 space-y-14">
          <Section
            id="quick-start"
            lead="Three steps from an empty canvas to your first findings. The modeler's first-run tour walks through the same steps and can place each component for you."
          >
            <ol className="grid gap-3 md:grid-cols-3">
              {QUICK_START.map((step, i) => (
                <li key={step.title} className="rounded-lg border bg-card p-4">
                  <p className="flex items-center gap-2 font-semibold">
                    <span
                      aria-hidden
                      className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground"
                    >
                      {i + 1}
                    </span>
                    {step.title}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </li>
              ))}
            </ol>
            <p className="text-sm text-muted-foreground">
              Prefer a worked example? Open one of the{" "}
              <SectionLink id="templates">templates</SectionLink> and run the analysis on it.
            </p>
          </Section>

          <Section id="layout">
            <DefinitionList
              items={[
                {
                  term: "Palette (left)",
                  detail:
                    "Searchable list of components, grouped as in the component reference below. It collapses to an icon rail. Drag an entry onto the canvas, or click / tap it to add it to the middle of the view.",
                },
                {
                  term: "Canvas (centre)",
                  detail:
                    "Components, data flows and trust boundaries. The toolbar holds Analyze, live mode, undo / redo, templates, save / open, import / export, tidy layout, grouping, flow animation, what-if and snap to grid. Right-click (or long-press) the canvas for the same actions on the selection.",
                },
                {
                  term: "Side panel (right)",
                  detail:
                    "Properties of the selected component or flow, and the results: threats, attack paths and compliance. The panel can be resized and collapsed.",
                },
                {
                  term: "Below 1024 px",
                  detail:
                    "The palette and the results open as bottom sheets with a drag handle and the canvas takes the full width. Pinch to zoom on touch screens.",
                },
              ]}
            />
            <SubHeading>Canvas legend</SubHeading>
            <p className="text-sm text-muted-foreground">
              The legend button on the canvas opens the same key. Colour is never the only signal:
              severities are also written out, and flow posture also uses a lock glyph and line
              style.
            </p>
            <DefinitionList
              items={[
                {
                  term: "Severity ring",
                  detail:
                    "Ring colour is the highest open severity on the component (critical, high, medium, low); a stronger fill means higher residual risk. A struck-through number counts resolved findings.",
                },
                {
                  term: "Trust stripe",
                  detail:
                    "The left stripe of a component, and the colour of a trust boundary, show its trust level: untrusted, semi-trusted or trusted.",
                },
                {
                  term: "Flow line",
                  detail:
                    "Solid with a lock = encrypted; dashed with an open lock = unencrypted; double arrow = bidirectional; thicker = on a riskier attack path; colour = data classification (Public, Internal, Confidential, Restricted). Dashes move only with the Flow toggle or during attack-path playback.",
                },
              ]}
            />
          </Section>

          <Section
            id="components"
            lead={`${PALETTE_SECTIONS.length} palette groups, ${PALETTE_COUNT} components. Agentic types come first because the engine reads their semantics (next section). The KC groups follow the official key components of OWASP "Securing Agentic Applications"; data-flow primitives (actors, external systems, trust boundaries) come last. Each entry shows the MAESTRO layer(s) it sits on.`}
          >
            <ComponentReference />
          </Section>

          <Section
            id="agentic-semantics"
            lead="An agentic type sets a component's semantic kind. Generic KC components get a kind from their group (for example a KC1 component is a model). The properties panel refines a kind: tool permission scopes, rate limit and allow-list; MCP transport, auth, exposed tools and provenance; A2A mutual auth, message signing and schema validation; memory kind, retention, per-user isolation and write access; guardrail coverage; which tools an approval gate protects."
          >
            <AgenticSemantics />
          </Section>

          <Section id="data-flows">
            <DefinitionList
              items={[
                {
                  term: "Flow fields",
                  detail:
                    "Label, protocol, authentication (None, API Key, OAuth2, mTLS, JWT, Basic, Session), encrypted, data classification, contains PII, and bidirectional.",
                },
                {
                  term: "Secure flows",
                  detail:
                    "A flow counts as secure only when it is encrypted and authenticated. Secure flows stop inherited threats from spreading, and a fully authenticated, encrypted entry path lowers likelihood.",
                },
                {
                  term: "Attacker influence",
                  detail:
                    "A flow carries influence from source to target. Its response carries influence back unless the target is a person (actor). Bidirectional flows carry it both ways.",
                },
                {
                  term: "Entry points",
                  detail:
                    "Actors, external systems and anything marked untrusted. Reachability and hop counts are measured from them.",
                },
                {
                  term: "Trust boundaries",
                  detail:
                    "Add one from the data-flow primitives, or select components and press G. Drop a component into a boundary to place it inside; boundaries can nest. The boundary's trust level sets its colour, and flows that cross a boundary are checked by the connection rules.",
                },
              ]}
            />
            <Callout title="Posture is never assumed">
              <p>
                Flows created by an import are marked unverified and the modeler asks for their
                authentication, encryption, classification and PII instead of defaulting to
                &ldquo;None&rdquo;. Findings that depend on unverified posture show lower confidence
                until you confirm it.
              </p>
            </Callout>
          </Section>

          <Section
            id="maestro"
            lead="CSA MAESTRO splits an agentic system into seven layers. Each palette component sits on one or more layers and each rule is filed under one. Select a layer to list its rules and components."
          >
            <Suspense fallback={<ChunkFallback label="MAESTRO layers" />}>
              <MaestroStack />
            </Suspense>
          </Section>

          <Section
            id="analysis"
            lead="Analysis runs on demand in a background worker. The same model always produces the same findings, with stable ids."
          >
            <ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed text-muted-foreground marker:font-semibold marker:text-foreground">
              <li>
                <strong className="text-foreground">Graph.</strong> Components, flows, boundaries,
                entry points, reachability and attacker influence are computed from the canvas.
              </li>
              <li>
                <strong className="text-foreground">Rules.</strong> Every rule in the catalog (
                <SectionLink id="rules" />) is evaluated at its scope: per component, per flow, per
                entry-to-target path, or once for the whole model.
              </li>
              <li>
                <strong className="text-foreground">Severity.</strong> Score = likelihood × impact
                (1–5 each, so 1–25). Likelihood drops by 2 when the component is unreachable, by 1
                at three or more hops, by 2 when every entry path passes a gate the rule names, by 1
                for an authenticated and encrypted entry path and by 1 for a trusted entry point; it
                rises by 1 for an unauthenticated entry flow (net change −3 to +1). Impact rises by
                1 each for sensitive data, a privileged component within two hops and three or more
                downstream components (at most +2). Bands: 20+ critical, 12+ high, 6+ medium, below
                that low. Model-hygiene rules use a fixed severity.
              </li>
              <li>
                <strong className="text-foreground">Propagation.</strong> Rules marked as
                propagating leave inherited copies up to two hops downstream, one severity level
                lower per hop. They stop at secure flows and at guardrail or approval gates, and
                never land on actors, external systems or components the rule already flags.
              </li>
              <li>
                <strong className="text-foreground">Attack paths.</strong> Weakest-link paths from
                entry points to sensitive targets. A human-approval gate on a path breaks it. Long
                lists are truncated and say so.
              </li>
              <li>
                <strong className="text-foreground">Residual risk.</strong> Residual = score × (1 −
                the summed effectiveness of <em>implemented</em> mitigations, capped at 90%). At 60%
                coverage or more the finding counts as mitigated. A threat marked mitigated or false
                positive has no residual risk. In-progress and accepted-risk mitigations do not
                reduce it.
              </li>
              <li>
                <strong className="text-foreground">Model score.</strong> 0–100: residual risk per
                component, weighted by reachability and asset value (65%), blended with the worst
                attack path (35%).
              </li>
              <li>
                <strong className="text-foreground">Compliance.</strong> Indicative coverage of
                OWASP AISVS chapters and AIUC-1 (met, partial, gap or not applicable). It is a
                design-time signal, not an audit.
              </li>
            </ol>
            <Callout>
              <p>
                Editing the model clears the results until you run the analysis again. The next run
                lists what changed: new, resolved and re-scored findings.
              </p>
            </Callout>
          </Section>

          <Section id="results">
            <DefinitionList
              items={[
                {
                  term: "Grouping and filters",
                  detail:
                    "Group by component, rule, MAESTRO layer or severity, and filter by severity. Inherited findings are hidden until you tick Show inherited.",
                },
                {
                  term: "Explainability",
                  detail:
                    "Each finding names its rule, the evidence that matched, the likelihood and impact modifiers that applied, its mappings (OWASP ASI, Cisco, AISVS, STRIDE, MAESTRO) and the mitigations that address it.",
                },
                {
                  term: "Threat status",
                  detail:
                    "Open, Mitigated, Accepted, Transferred or False positive, with an owner, a due date and an evidence link (http or https). Accepted needs a justification. Select several findings to change them together.",
                },
                {
                  term: "Mitigation status",
                  detail:
                    "Not started, in progress, implemented or accepted risk, per component. Only implemented mitigations lower residual risk.",
                },
                {
                  term: "Not applicable here",
                  detail:
                    "Suppresses a rule for one component, or for every component of that kind, with an optional reason. Suppressed findings are listed with a Restore button, and Undo reverses the action.",
                },
                {
                  term: "Attack-path playback",
                  detail:
                    "Select a path to highlight it on the canvas; Play steps through its hops.",
                },
                {
                  term: "What-if",
                  detail:
                    "With What-if on, pick a component to see threats, open findings, model score and attack paths before and after removing it. The model itself is not changed.",
                },
              ]}
            />
          </Section>

          <Section
            id="rules"
            lead="Every finding in the modeler cites one of these rules. Search by id, title, description or mapping code, or filter by scope. Rule ids elsewhere on this page link here."
          >
            <Suspense fallback={<ChunkFallback label="the rule catalog" />}>
              <RulesBrowser />
            </Suspense>
          </Section>

          <Section
            id="templates"
            lead="Starting points for common agentic architectures. Each opens in the modeler, ready to analyze."
          >
            <TemplatesSection />
          </Section>

          <Section id="saving">
            <DefinitionList
              items={[
                {
                  term: "Autosave",
                  detail:
                    "The current model is saved in this browser a moment after each edit. Nothing is uploaded; clearing site data removes it.",
                },
                {
                  term: "Saved models",
                  detail: (
                    <>
                      <Chord keys={["Mod", "S"]} /> saves the model to your library in this browser.
                      Save as a new version to keep history, then compare any two versions (or a
                      version and the current canvas) to see added, resolved and re-scored findings.
                    </>
                  ),
                },
                {
                  term: "Share links",
                  detail: (
                    <>
                      A share link carries the whole model, compressed, in its <code>?m=</code>{" "}
                      parameter; no server is involved. Links over 30 KB are refused, so export JSON
                      for large models. A shared model opens read-only: choose{" "}
                      <strong>Make a copy</strong> to edit it as your own.
                    </>
                  ),
                },
                {
                  term: "Template links",
                  detail: (
                    <>
                      <code>/threat-modeler?template=&lt;id&gt;</code> opens a template. Your
                      autosaved model is kept until you edit the template, and is then moved to My
                      models.
                    </>
                  ),
                },
                {
                  term: "Finding links",
                  detail: (
                    <>
                      Add <code>?threat=&lt;id&gt;</code> to open the modeler on one finding.
                    </>
                  ),
                },
              ]}
            />
          </Section>

          <Section id="import-export">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border p-4">
                <SubHeading>Export</SubHeading>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  <li>JSON (the full model, re-importable)</li>
                  <li>PNG and SVG images of the canvas</li>
                  <li>PDF and Markdown reports</li>
                  <li>CSV, one row per finding</li>
                  <li>SARIF 2.1.0, with rule ids as the SARIF ruleId</li>
                  <li>OWASP Threat Dragon v2 and Open Threat Model (OTM)</li>
                </ul>
              </div>
              <div className="rounded-lg border p-4">
                <SubHeading>Import</SubHeading>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  <li>JSON models, validated before loading; custom components are merged</li>
                  <li>CycloneDX 1.6 ML-BOM and cisco-aibom reports</li>
                  <li>OWASP Threat Dragon v2, with its stored threats kept as notes</li>
                  <li>Imported flows prompt for their security posture (see above)</li>
                </ul>
              </div>
            </div>
          </Section>

          <Section
            id="shortcuts"
            lead={
              <>
                Press <Kbd>?</Kbd> in the modeler to see this list. Canvas shortcuts work while the
                canvas has focus; the rest work anywhere in the modeler.
              </>
            }
          >
            <ShortcutsSection />
          </Section>

          <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 p-4 text-sm">
            <span className="font-medium">Next:</span>
            <Button asChild size="sm">
              <Link to="/threat-modeler">Open the modeler</Link>
            </Button>
            <Link to="/architectures" className="text-primary hover:underline">
              Reference architectures
            </Link>
            <Link to="/taxonomy" className="text-primary hover:underline">
              Threat taxonomy
            </Link>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

import { useId, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { ChevronRight } from "lucide-react";
import { Radar, type RadarSeries } from "@/components/charts/Radar";
import { SourceNote } from "@/components/content/SourceNote";
import { architecturesData } from "@/components/components/architecturesData";
import { SOURCES } from "@/data/sources";
import { cn } from "@/lib/utils";

/**
 * Architecture comparison (6.5): small-multiple radar of eight editorial 1–5 feature scores per
 * pattern (overlay / individual via a Radix ToggleGroup), with the full scored table (notes and
 * ideal use cases) as an expandable "View as table" data view.
 *
 * Scores are this site's editorial assessment, not part of an OWASP publication. Higher means
 * "more of the property"; for Implementation Complexity a higher score means harder to build.
 */

type ArchKey = "sequential" | "hierarchical" | "collaborative" | "reactive" | "knowledge_intensive";

interface Score {
  score: number;
  note: string;
}

type Feature = { category: string; short: string; description: string } & Record<ArchKey, Score>;

const ARCH_KEYS: ArchKey[] = [
  "sequential",
  "hierarchical",
  "collaborative",
  "reactive",
  "knowledge_intensive",
];

const FEATURES: Feature[] = [
  {
    category: "Implementation Complexity",
    short: "Complexity",
    description: "Difficulty to design, develop, and deploy",
    sequential: {
      score: 1,
      note: "Simplest pattern to implement with minimal branching logic",
    },
    hierarchical: {
      score: 4,
      note: "Complex orchestration logic and role relationships require careful design",
    },
    collaborative: {
      score: 4,
      note: "Communication protocols and coordination mechanisms add complexity",
    },
    reactive: {
      score: 2,
      note: "Moderately complex due to event handling and stimulus mapping",
    },
    knowledge_intensive: {
      score: 3,
      note: "Knowledge retrieval and integration mechanisms add complexity",
    },
  },
  {
    category: "Scalability",
    short: "Scalability",
    description: "Ability to handle larger problem spaces and workloads",
    sequential: {
      score: 1,
      note: "Poor scaling to complex problems, becomes unwieldy for large tasks",
    },
    hierarchical: {
      score: 5,
      note: "Excellent scalability through task decomposition and specialized agents",
    },
    collaborative: {
      score: 5,
      note: "Highly scalable through parallel processing and agent distribution",
    },
    reactive: {
      score: 3,
      note: "Moderately scalable, limited by centralized event processing",
    },
    knowledge_intensive: {
      score: 4,
      note: "Scales well with additional knowledge sources and retrieval capacity",
    },
  },
  {
    category: "Fault Tolerance",
    short: "Fault tolerance",
    description: "Resilience to component failures or errors",
    sequential: {
      score: 1,
      note: "Single point of failure; entire pipeline fails if any step fails",
    },
    hierarchical: {
      score: 3,
      note: "Partial resilience through task reassignment, but vulnerable to orchestrator failure",
    },
    collaborative: {
      score: 5,
      note: "High resilience through redundancy and distributed responsibility",
    },
    reactive: {
      score: 3,
      note: "Moderate resilience through event-based decoupling",
    },
    knowledge_intensive: {
      score: 2,
      note: "Vulnerable to knowledge source corruption or retrieval failures",
    },
  },
  {
    category: "Resource Efficiency",
    short: "Efficiency",
    description: "Computational and memory requirements",
    sequential: {
      score: 5,
      note: "Minimal overhead with straightforward processing flow",
    },
    hierarchical: {
      score: 3,
      note: "Moderate overhead from orchestration and communication",
    },
    collaborative: {
      score: 2,
      note: "Higher resource consumption due to redundant processing and communication",
    },
    reactive: {
      score: 4,
      note: "Good efficiency through targeted activation of components",
    },
    knowledge_intensive: {
      score: 2,
      note: "Resource-intensive for knowledge storage and retrieval operations",
    },
  },
  {
    category: "Adaptability",
    short: "Adaptability",
    description: "Ability to adapt to changing requirements or environments",
    sequential: {
      score: 1,
      note: "Rigid structure requires redesign for new scenarios",
    },
    hierarchical: {
      score: 4,
      note: "Good adaptability through dynamic task decomposition and agent assignment",
    },
    collaborative: {
      score: 4,
      note: "Adaptable through dynamic agent recruitment and emergent behavior",
    },
    reactive: {
      score: 5,
      note: "Excellent adaptability by design, responds to changing stimuli",
    },
    knowledge_intensive: {
      score: 3,
      note: "Adapts well to new information, less to structural changes",
    },
  },
  {
    category: "Security Profile",
    short: "Security",
    description: "Inherent security characteristics and attack surface",
    sequential: {
      score: 4,
      note: "Smaller attack surface but limited isolation between steps",
    },
    hierarchical: {
      score: 3,
      note: "Vulnerable to orchestrator compromise but good component isolation",
    },
    collaborative: {
      score: 2,
      note: "Expanded attack surface through agent communication channels",
    },
    reactive: {
      score: 3,
      note: "Vulnerable to event spoofing but good compartmentalization",
    },
    knowledge_intensive: {
      score: 2,
      note: "Vulnerable to knowledge poisoning and retrieval manipulation",
    },
  },
  {
    category: "Explainability",
    short: "Explainability",
    description: "Ease of understanding and explaining system behavior",
    sequential: {
      score: 5,
      note: "Highly traceable linear process flow",
    },
    hierarchical: {
      score: 3,
      note: "Moderately explainable through task hierarchies, but complex interactions",
    },
    collaborative: {
      score: 1,
      note: "Emergent behaviors often difficult to predict or explain",
    },
    reactive: {
      score: 3,
      note: "Event-response pairs are explainable, but complex chains less so",
    },
    knowledge_intensive: {
      score: 4,
      note: "Knowledge sources provide good basis for explaining decisions",
    },
  },
  {
    category: "Human Oversight",
    short: "Oversight",
    description: "Ease of human supervision and intervention",
    sequential: {
      score: 5,
      note: "Straightforward to monitor with clear checkpoints",
    },
    hierarchical: {
      score: 3,
      note: "Requires multi-level monitoring but has structured intervention points",
    },
    collaborative: {
      score: 2,
      note: "Challenging to monitor distributed processing and intervene effectively",
    },
    reactive: {
      score: 4,
      note: "Observable event-response patterns with intervention opportunities",
    },
    knowledge_intensive: {
      score: 4,
      note: "Reviewable knowledge bases and explainable retrieval",
    },
  },
];

const USE_CASES: Record<ArchKey, string[]> = {
  sequential: [
    "Simple, well-defined workflows",
    "Processes with minimal decision branching",
    "Single-domain tasks with clear steps",
    "Scenarios requiring high traceability/auditability",
  ],
  hierarchical: [
    "Complex problems requiring decomposition",
    "Multi-domain tasks needing specialized handling",
    "Projects requiring clear responsibility delegation",
    "Systems needing centralized control with distributed execution",
  ],
  collaborative: [
    "Problems benefiting from diverse approaches",
    "Scenarios requiring high fault tolerance",
    "Tasks that can be naturally parallelized",
    "Domains with emergent or collective intelligence needs",
  ],
  reactive: [
    "Real-time response systems",
    "Environment-driven workflows",
    "User interaction and conversation agents",
    "Systems requiring rapid adaptation to changing conditions",
  ],
  knowledge_intensive: [
    "Research and information synthesis tasks",
    "Complex reasoning requiring extensive context",
    "Decision support systems",
    "Agents requiring deep domain expertise",
  ],
};

const SCORE_LABEL: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very good",
  5: "Excellent",
};

function archLabel(key: ArchKey): string {
  return (architecturesData[key]?.name ?? key).replace(/\s+(Agent\s+)?Architecture$/i, "").trim();
}

const ARCHS = ARCH_KEYS.filter((k) => architecturesData[k]).map((k) => ({
  key: k,
  label: archLabel(k),
  path: `/architectures/${k}`,
}));

function ScoreDots({ score }: { score: number }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 w-3 rounded-sm",
              i <= score ? "bg-primary" : "bg-muted-foreground/20",
            )}
          />
        ))}
      </span>
      <span className="font-mono text-xs tabular-nums">{score}/5</span>
      <span className="sr-only">({SCORE_LABEL[score]})</span>
    </span>
  );
}

const FeatureComparisonMatrix = () => {
  const [mode, setMode] = useState<"overlay" | "individual">("individual");
  const toggleId = useId();

  const axes = useMemo(() => FEATURES.map((f) => ({ key: f.short, label: f.short })), []);
  const series: RadarSeries[] = useMemo(
    () =>
      ARCHS.map((a) => ({
        id: a.key,
        label: a.label,
        values: Object.fromEntries(FEATURES.map((f) => [f.short, f[a.key].score])),
      })),
    [],
  );

  const toolbar = (
    <div className="flex items-center gap-2">
      <span id={toggleId} className="text-xs text-muted-foreground">
        Layout
      </span>
      <ToggleGroup.Root
        type="single"
        value={mode}
        onValueChange={(v) => v && setMode(v as "overlay" | "individual")}
        aria-labelledby={toggleId}
        className="inline-flex rounded-md border p-0.5 text-xs"
      >
        {(["individual", "overlay"] as const).map((m) => (
          <ToggleGroup.Item
            key={m}
            value={m}
            className="rounded px-2 py-1 capitalize text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=on]:bg-muted data-[state=on]:font-medium data-[state=on]:text-foreground"
          >
            {m === "individual" ? "Small multiples" : "Overlay"}
          </ToggleGroup.Item>
        ))}
      </ToggleGroup.Root>
    </div>
  );

  return (
    <section aria-labelledby="comparison-title" className="space-y-4">
      <div>
        <h2 id="comparison-title" className="text-xl font-semibold tracking-tight">
          Comparing the {ARCHS.length} patterns
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Editorial 1–5 scores on {FEATURES.length} properties. Higher means more of the property;
          for complexity, higher means harder to build. Real systems often combine patterns.
        </p>
      </div>

      <Radar
        ariaLabel={`Radar charts of ${FEATURES.length} feature scores (1–5) for ${ARCHS.length} architecture patterns`}
        axes={axes}
        series={series}
        max={5}
        mode={mode}
        showModeToggle={false}
        toolbar={toolbar}
        smallHeight={240}
        height={380}
        valueFormat={(v) => `${v}/5`}
      />

      <details className="group rounded-lg border bg-card">
        <summary className="flex cursor-pointer select-none items-center gap-2 px-4 py-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <ChevronRight
            className="h-4 w-4 transition-transform group-open:rotate-90"
            aria-hidden="true"
          />
          View as table
        </summary>
        <div className="relative max-w-full overflow-x-auto border-t">
          <table className="min-w-[56rem] divide-y divide-border text-sm">
            <caption className="sr-only">
              Feature scores (1–5) with notes and ideal use cases per architecture pattern
            </caption>
            <thead className="bg-muted/50">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground"
                >
                  Feature
                </th>
                {ARCHS.map((a) => (
                  <th
                    key={a.key}
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  >
                    <Link to={a.path} className="text-primary underline-offset-2 hover:underline">
                      {a.label}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {FEATURES.map((f) => (
                <tr key={f.category}>
                  <th scope="row" className="px-4 py-3 text-left align-top font-normal">
                    <span className="block font-medium text-foreground">{f.category}</span>
                    <span className="block text-xs text-muted-foreground">{f.description}</span>
                  </th>
                  {ARCHS.map((a) => (
                    <td key={a.key} className="px-4 py-3 align-top">
                      <ScoreDots score={f[a.key].score} />
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {f[a.key].note}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <th scope="row" className="px-4 py-3 text-left align-top font-normal">
                  <span className="block font-medium text-foreground">Ideal use cases</span>
                  <span className="block text-xs text-muted-foreground">
                    Scenarios where the pattern excels
                  </span>
                </th>
                {ARCHS.map((a) => (
                  <td key={a.key} className="px-4 py-3 align-top">
                    <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                      {USE_CASES[a.key].map((u) => (
                        <li key={u}>{u}</li>
                      ))}
                    </ul>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </details>
      <SourceNote source={SOURCES.architectures} prefix="Patterns" />
    </section>
  );
};

export default FeatureComparisonMatrix;

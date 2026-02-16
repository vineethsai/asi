import { Link } from "react-router-dom";

const FeatureComparisonMatrix = () => {
  const archColumns = [
    { key: "sequential", label: "Sequential", path: "/architectures/sequential" },
    { key: "hierarchical", label: "Hierarchical", path: "/architectures/hierarchical" },
    { key: "collaborative", label: "Collaborative Swarm", path: "/architectures/collaborative" },
    { key: "reactive", label: "Reactive", path: "/architectures/reactive" },
    { key: "knowledge", label: "Knowledge-Intensive", path: "/architectures/knowledge_intensive" },
  ];

  const features = [
    {
      category: "Implementation Complexity",
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
      knowledge: {
        score: 3,
        note: "Knowledge retrieval and integration mechanisms add complexity",
      },
    },
    {
      category: "Scalability",
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
      knowledge: {
        score: 4,
        note: "Scales well with additional knowledge sources and retrieval capacity",
      },
    },
    {
      category: "Fault Tolerance",
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
      knowledge: {
        score: 2,
        note: "Vulnerable to knowledge source corruption or retrieval failures",
      },
    },
    {
      category: "Resource Efficiency",
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
      knowledge: {
        score: 2,
        note: "Resource-intensive for knowledge storage and retrieval operations",
      },
    },
    {
      category: "Adaptability",
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
      knowledge: {
        score: 3,
        note: "Adapts well to new information, less to structural changes",
      },
    },
    {
      category: "Security Profile",
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
      knowledge: {
        score: 2,
        note: "Vulnerable to knowledge poisoning and retrieval manipulation",
      },
    },
    {
      category: "Explainability",
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
      knowledge: {
        score: 4,
        note: "Knowledge sources provide good basis for explaining decisions",
      },
    },
    {
      category: "Human Oversight",
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
      knowledge: {
        score: 4,
        note: "Reviewable knowledge bases and explainable retrieval",
      },
    },
  ];

  const useCases = {
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
    knowledge: [
      "Research and information synthesis tasks",
      "Complex reasoning requiring extensive context",
      "Decision support systems",
      "Agents requiring deep domain expertise",
    ],
  };

  const renderScore = (score: number) => {
    const colors: Record<number, string> = {
      1: "bg-red-500",
      2: "bg-orange-400",
      3: "bg-yellow-400",
      4: "bg-lime-500",
      5: "bg-green-500",
    };

    return (
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${colors[score]}`}></div>
        <span>{score}/5</span>
      </div>
    );
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="rounded-xl shadow-md overflow-hidden border border-border bg-card">
        {/* Matrix header with title */}
        <div className="bg-muted p-4 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            Agent Architecture Comparison Matrix
          </h2>
          <p className="text-muted-foreground mt-1">
            Comparative analysis of strengths and weaknesses across different agent architecture
            patterns
          </p>
        </div>

        {/* Matrix body */}
        <div className="p-2 sm:p-4">
          {/* Score key */}
          <div className="mb-4 flex items-center gap-4 flex-wrap">
            <span className="text-sm font-medium text-foreground">Score Key:</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-xs text-muted-foreground">1 (Poor)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-orange-400"></div>
              <span className="text-xs text-muted-foreground">2 (Fair)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <span className="text-xs text-muted-foreground">3 (Good)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-lime-500"></div>
              <span className="text-xs text-muted-foreground">4 (Very Good)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-xs text-muted-foreground">5 (Excellent)</span>
            </div>
          </div>

          {/* Comparison table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th
                    scope="col"
                    className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-1/6"
                  >
                    Feature Category
                  </th>
                  {archColumns.map((col) => (
                    <th
                      key={col.key}
                      scope="col"
                      className="px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-1/6"
                    >
                      <Link
                        to={col.path}
                        className="text-primary hover:text-primary/80 underline-offset-2 hover:underline"
                      >
                        {col.label}
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {features.map((feature, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-muted/30" : "bg-card"}>
                    <td className="px-3 sm:px-6 py-4">
                      <div className="font-medium text-foreground">{feature.category}</div>
                      <div className="text-xs text-muted-foreground">{feature.description}</div>
                    </td>
                    {archColumns.map((col) => {
                      const data = feature[col.key as keyof typeof feature] as {
                        score: number;
                        note: string;
                      };
                      return (
                        <td key={col.key} className="px-3 sm:px-6 py-4">
                          <div className="mb-1">{renderScore(data.score)}</div>
                          <div className="text-xs text-muted-foreground">{data.note}</div>
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Ideal Use Cases row */}
                <tr className="bg-muted/30">
                  <td className="px-3 sm:px-6 py-4">
                    <div className="font-medium text-foreground">Ideal Use Cases</div>
                    <div className="text-xs text-muted-foreground">
                      Scenarios where this architecture excels
                    </div>
                  </td>
                  {archColumns.map((col) => {
                    const cases = useCases[col.key as keyof typeof useCases];
                    return (
                      <td key={col.key} className="px-3 sm:px-6 py-4">
                        <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1">
                          {cases.map((useCase, i) => (
                            <li key={i}>{useCase}</li>
                          ))}
                        </ul>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Notes */}
          <div className="mt-6 text-sm text-muted-foreground">
            <p>
              <strong>Note:</strong> This comparison represents general architectural
              characteristics. Specific implementations may vary in their strengths and weaknesses.
              Many real-world systems combine elements from multiple architecture patterns.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureComparisonMatrix;

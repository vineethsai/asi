import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/layout/Header";
import { architecturesData, Architecture } from "../components/components/architecturesData";
import { threatsData, mitigationsData } from "../components/components/securityData";
import { frameworkData as allComponentNodes } from "../components/components/frameworkData";
import { cn } from "@/lib/utils";
import SidebarNav from "../components/layout/SidebarNav";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Icon } from "@/components/ui/icon";

// Helper to get component description from frameworkData
const getComponentDescription = (id: string): string => {
  const node = allComponentNodes.find((n) => n.id === id);
  return node?.description || "";
};

// Real-world examples for each architecture
const realWorldExamples: Record<string, string[]> = {
  sequential: [
    "Basic chatbots with scripted flows",
    "Simple automation pipelines (e.g., ETL jobs)",
    "Linear document processing workflows",
    "Step-by-step customer support bots"
  ],
  hierarchical: [
    "Multi-agent task orchestration",
    "Complex workflow engines",
    "Enterprise RPA with sub-processes"
  ],
  collaborative: [
    "Swarm robotics",
    "Distributed problem-solving agents",
    "Crowdsourced moderation systems"
  ],
  reactive: [
    "Real-time monitoring agents",
    "Event-driven chatbots",
    "IoT device controllers"
  ],
  knowledge: [
    "Research assistants",
    "Legal/medical information synthesis",
    "Enterprise knowledge management bots"
  ]
};

const ArchitectureDetail = () => {
  const { architectureId } = useParams<{ architectureId: string }>();
  const architecture: Architecture | undefined = architectureId ? architecturesData[architectureId] : undefined;

  // Get threats and mitigations
  const threats = architecture?.threatIds.map(id => threatsData[id]).filter(Boolean) || [];
  const mitigations = architecture?.mitigationIds.map(id => mitigationsData[id]).filter(Boolean) || [];

  // Get components with descriptions
  const components = architecture?.keyComponents.map(id => ({
    id,
    description: getComponentDescription(id)
  })) || [];

  // Build threat-to-component matrix for visualization
  const threatComponentMatrix = threats.map(threat => ({
    threat,
    affected: architecture?.keyComponents.filter(cid => threat.componentIds.includes(cid)) || []
  }));

  // Helper: does a threat affect a component (by root)?
  function threatAffectsComponent(threat, compId) {
    // e.g., threat.componentIds: ["kc4"] matches compId: "kc4.1"
    const root = compId.split(".")[0];
    return (threat.componentIds || []).includes(root);
  }

  // Helper to get full component node by ID (including subcomponents)
  function getComponentNodeById(id) {
    // Recursively search allComponentNodes and their children
    function search(nodes) {
      for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
          const found = search(node.children);
          if (found) return found;
        }
      }
      return null;
    }
    return search(allComponentNodes);
  }

  if (!architecture) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Architecture Not Found</h1>
        <Link to="/architectures">
          <button className="btn">Back to Architectures</button>
        </Link>
      </div>
    );
  }

  // Visual diagram for sequential pattern
  const renderDiagram = () => {
    if (architecture.id === "sequential") {
      return (
        <div className="flex justify-center mb-10">
          <svg width="420" height="80" viewBox="0 0 420 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="20" width="80" height="40" rx="8" fill="#e0e7ff" stroke="#6366f1" strokeWidth="2" />
            <rect x="120" y="20" width="80" height="40" rx="8" fill="#e0e7ff" stroke="#6366f1" strokeWidth="2" />
            <rect x="230" y="20" width="80" height="40" rx="8" fill="#e0e7ff" stroke="#6366f1" strokeWidth="2" />
            <rect x="340" y="20" width="70" height="40" rx="8" fill="#e0e7ff" stroke="#6366f1" strokeWidth="2" />
            <text x="50" y="45" textAnchor="middle" alignmentBaseline="middle" fontSize="15" fill="#3730a3">Step 1</text>
            <text x="160" y="45" textAnchor="middle" alignmentBaseline="middle" fontSize="15" fill="#3730a3">Step 2</text>
            <text x="270" y="45" textAnchor="middle" alignmentBaseline="middle" fontSize="15" fill="#3730a3">Step 3</text>
            <text x="375" y="45" textAnchor="middle" alignmentBaseline="middle" fontSize="15" fill="#3730a3">Output</text>
            <polygon points="90,40 120,40 110,35 110,45" fill="#6366f1" />
            <polygon points="200,40 230,40 220,35 220,45" fill="#6366f1" />
            <polygon points="310,40 340,40 330,35 330,45" fill="#6366f1" />
          </svg>
        </div>
      );
    }
    // Add more diagrams for other patterns as needed
    return null;
  };

  return (
    <>
      <Header />
      <section className="py-12 bg-secondary/50 min-h-screen">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <SidebarNav type="architectures" activeId={architecture.id} />
            <div className="flex-1">
              <Link to="/architectures" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4">
                &larr; Back to Architectures
              </Link>
              {/* Overview Card */}
              <Card className="mb-4 border border-architecture/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    {architecture.icon && <Icon name={architecture.icon} color={architecture.color} size={32} />}
                    <h1 className="text-2xl font-bold" style={{ color: architecture.color }}>{architecture.name}</h1>
                    {architecture.status && <Badge variant="outline" className="capitalize ml-2">{architecture.status}</Badge>}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(architecture.tags || []).map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">Version: {architecture.version || "-"} | Last Updated: {architecture.lastUpdated || "-"} | Updated By: {architecture.updatedBy || "-"}</div>
                  {architecture.references && architecture.references.length > 0 && <div className="text-xs mt-1">{architecture.references.map(ref => <a key={ref.url} href={ref.url} target="_blank" rel="noopener noreferrer" className="underline text-blue-600 mr-2">{ref.title}</a>)}</div>}
                  <p className="text-muted-foreground mt-4">{architecture.description}</p>
                </CardContent>
              </Card>
              {/* Grid for the rest of the cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Visual Diagram */}
                {renderDiagram() && (
                  <Card className="border border-border bg-background">
                    <CardContent className="p-4">
                      <h2 className="text-base font-semibold mb-2 text-foreground">Visual Diagram</h2>
                      {renderDiagram()}
                    </CardContent>
                  </Card>
                )}
                {/* Real-world Examples */}
                {realWorldExamples[architecture.id] && (
                  <Card className="border border-border bg-background">
                    <CardContent className="p-4">
                      <h2 className="text-base font-semibold mb-2 text-foreground">Real-World Examples</h2>
                      <ul className="list-disc pl-6 text-muted-foreground">
                        {realWorldExamples[architecture.id].map((ex, i) => (
                          <li key={i}>{ex}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
                {/* Key Components */}
                <Card className="border border-primary/20 bg-background">
                  <CardContent className="p-4">
                    <h2 className="text-base font-semibold mb-2 text-primary">Key Components</h2>
                    <div className="space-y-4">
                      {components.map((comp) => {
                        const node = getComponentNodeById(comp.id);
                        return (
                          <div key={comp.id} className="border rounded-lg p-3 bg-primary/5">
                            <div className="mb-1">
                              <span className="font-bold text-lg text-primary">{node?.title || comp.id.toUpperCase()}</span>
                              <span className="ml-2 font-mono text-xs text-primary/70">{comp.id.toUpperCase()}</span>
                            </div>
                            {node?.description && <div className="text-sm text-muted-foreground mb-1">{node.description}</div>}
                            {node?.threatCategories && node.threatCategories.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-1">
                                {node.threatCategories.map((cat, i) => (
                                  <span key={i} className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full">{cat}</span>
                                ))}
                              </div>
                            )}
                            <Link to={`/components/${comp.id}`} className="text-blue-700 font-medium underline text-xs mt-2 inline-block">View Details</Link>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
                {/* Associated Threats */}
                <Card className="border border-threat/20 bg-background">
                  <CardContent className="p-4">
                    <h2 className="text-base font-semibold mb-2 text-threat">Associated Threats</h2>
                    <ul className="space-y-4">
                      {threats.length > 0 ? (
                        threats.map((threat) => (
                          <li key={threat.id}>
                            <Link to={`/threats/${threat.id}`} className="text-threat underline font-medium">
                              {threat.code} - {threat.name}
                            </Link>
                            <div className="text-sm text-muted-foreground mt-1 ml-2">
                              {threat.description}
                            </div>
                          </li>
                        ))
                      ) : (
                        <li className="text-muted-foreground">No threats documented.</li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
                {/* Mitigations */}
                <Card className="border border-control/20 bg-background">
                  <CardContent className="p-4">
                    <h2 className="text-base font-semibold mb-2 text-control">Mitigations</h2>
                    <ul className="space-y-4">
                      {mitigations.length > 0 ? (
                        mitigations.map((mitigation) => (
                          <li key={mitigation.id}>
                            <Link to={`/controls/${mitigation.id}`} className="text-control underline font-medium">
                              {mitigation.name}
                            </Link>
                            <div className="text-sm text-muted-foreground mt-1 ml-2">
                              {mitigation.description}
                            </div>
                          </li>
                        ))
                      ) : (
                        <li className="text-muted-foreground">No mitigations documented.</li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
                {/* Threat-Component Matrix */}
                {threats.length > 0 && components.length > 0 && (
                  <Card className="border border-yellow-200 bg-background lg:col-span-2">
                    <CardContent className="p-4">
                      <h2 className="text-base font-semibold mb-2 text-foreground">Threat-Component Relationship Map</h2>
                      <div className="overflow-x-auto">
                        <table className="min-w-full border text-sm">
                          <thead>
                            <tr>
                              <th className="px-3 py-2 border-b">Threat</th>
                              {components.map((comp) => (
                                <th key={comp.id} className="px-3 py-2 border-b text-center">{comp.id.toUpperCase()}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {threats.map((threat) => (
                              <tr key={threat.id}>
                                <td className="px-3 py-2 border-b font-medium">
                                  <Link to={`/threats/${threat.id}`} className="text-threat underline">
                                    {threat.code}
                                  </Link>
                                </td>
                                {components.map((comp) => (
                                  <td key={comp.id} className="px-3 py-2 border-b text-center">
                                    {threatAffectsComponent(threat, comp.id) ? (
                                      <span className="inline-block w-3 h-3 rounded-full bg-yellow-400" title="Threatens" />
                                    ) : null}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ArchitectureDetail; 
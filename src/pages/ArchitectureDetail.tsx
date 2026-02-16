import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/layout/Header";
import SidebarNav from "@/components/layout/SidebarNav";
import Footer from "@/components/layout/Footer";
import { architecturesData, Architecture } from "../components/components/architecturesData";
import { componentDataMap as sharedComponentDataMap } from "../components/components/componentDataMap";
import { threatsData, mitigationsData } from "../components/components/securityData";
import { frameworkData as allComponentNodes } from "../components/components/frameworkData";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Helmet } from "react-helmet";
import { Crosshair } from "lucide-react";
import ArchitectureFlowDiagram from "@/components/visual/ArchitectureFlowDiagram";

const ARCH_TO_TEMPLATE: Record<string, string> = {
  sequential: "sequential-pipeline",
  hierarchical: "multi-agent",
  collaborative: "collaborative-swarm",
  reactive: "reactive-agent",
  knowledge_intensive: "knowledge-intensive",
};

// Helper to get component description from frameworkData
const getComponentDescription = (id: string): string => {
  const node = allComponentNodes.find((n) => n.id === id);
  return node?.description || "";
};

// Real-world examples for each architecture
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
  swarm: [
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
  knowledge: [
    "Research assistants for scientific literature analysis",
    "Legal document review and case law synthesis",
    "Medical diagnosis support with clinical knowledge retrieval",
    "Enterprise knowledge management and search systems",
    "Financial analysis agents with regulatory document access",
  ],
};

const ArchitectureDetail = () => {
  const { architectureId } = useParams<{ architectureId: string }>();
  const architecture: Architecture | undefined = architectureId
    ? architecturesData[architectureId]
    : undefined;

  // Get threats and mitigations
  const threats = architecture?.threatIds.map((id) => threatsData[id]).filter(Boolean) || [];
  const mitigations =
    architecture?.mitigationIds.map((id) => mitigationsData[id]).filter(Boolean) || [];

  // Get components with descriptions
  const components =
    architecture?.keyComponents.map((id) => ({
      id,
      description: getComponentDescription(id),
    })) || [];

  // Helper: does a threat affect a component (by root)?
  function threatAffectsComponent(threat, compId) {
    // e.g., threat.componentIds: ["kc4"] matches compId: "kc4.1"
    const root = compId.split(".")[0];
    return (threat.componentIds || []).includes(root);
  }

  // Component data imported from shared map
  const componentDataMap = sharedComponentDataMap;

  // Helper to get component data by ID
  function getComponentDataById(id) {
    // First try the component data map
    const componentData = componentDataMap[id];
    if (componentData) {
      return componentData;
    }

    // Fallback to searching in framework data
    function search(nodes) {
      for (const node of nodes) {
        // Normalize both IDs to dot notation for comparison
        const normalizedNodeId = node.id.replace(/-/g, ".");
        const normalizedSearchId = id.replace(/-/g, ".");
        if (normalizedNodeId === normalizedSearchId) return node;
        if (node.children) {
          const found = search(node.children);
          if (found) return found;
        }
      }
      return null;
    }
    return search(allComponentNodes);
  }

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

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

  return (
    <>
      <Helmet>
        <title>{architecture.name} Architecture | OWASP Securing Agentic Applications Guide</title>
        <meta
          name="description"
          content={`${architecture.description} Learn about security threats, mitigations, and implementation best practices for this AI architecture pattern.`}
        />
        <meta
          name="keywords"
          content={`${architecture.name}, AI architecture, OWASP, agentic systems, ${architecture.tags?.join(", ") || ""}, AI security patterns, architecture security`}
        />
        <meta name="robots" content="index, follow" />
        <link
          rel="canonical"
          href={`https://agenticsecurity.info/architectures/${architecture.id}`}
        />
        <meta property="og:title" content={`${architecture.name} Architecture | OWASP Guide`} />
        <meta property="og:description" content={architecture.description} />
        <meta property="og:type" content="article" />
        <meta
          property="og:url"
          content={`https://agenticsecurity.info/architectures/${architecture.id}`}
        />
        <meta property="og:site_name" content="OWASP Securing Agentic Applications Guide" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${architecture.name} Architecture | OWASP Guide`} />
        <meta name="twitter:description" content={architecture.description} />
        <meta
          name="twitter:url"
          content={`https://agenticsecurity.info/architectures/${architecture.id}`}
        />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TechArticle",
            headline: `${architecture.name} Architecture`,
            description: architecture.description,
            url: `https://agenticsecurity.info/architectures/${architecture.id}`,
            datePublished: new Date().toISOString(),
            dateModified: new Date().toISOString(),
            author: {
              "@type": "Organization",
              name: "OWASP",
            },
            publisher: {
              "@type": "Organization",
              name: "OWASP",
              url: "https://owasp.org",
            },
            about: "AI Architecture Security",
            keywords: architecture.tags?.join(", ") || "",
            isPartOf: {
              "@type": "WebSite",
              name: "OWASP Securing Agentic Applications Guide",
              url: "https://agenticsecurity.info",
            },
          })}
        </script>
      </Helmet>
      <Header onMobileMenuToggle={handleMobileMenuToggle} isMobileMenuOpen={isMobileMenuOpen} />

      {/* Mobile Navigation Sidebar */}
      <SidebarNav
        type="architectures"
        activeId={architecture.id}
        isOpen={isMobileMenuOpen}
        onClose={handleMobileMenuClose}
      />

      <section id="main-content" className="py-12 min-h-screen">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col gap-6">
            <div className="flex-1">
              <Link
                to="/architectures"
                className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4"
              >
                &larr; Back to Architectures
              </Link>
              {/* Overview Card */}
              <div className="mb-8">
                <h1 className="text-2xl font-bold tracking-tight">{architecture.name}</h1>
                <p className="mt-1 text-muted-foreground">{architecture.description}</p>
              </div>
              <Card className="mb-4 border border-architecture/20 bg-card">
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(architecture.tags || []).map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Version: {architecture.version || "-"} | Last Updated:{" "}
                    {architecture.lastUpdated || "-"} | Updated By: {architecture.updatedBy || "-"}
                  </div>
                  {architecture.references && architecture.references.length > 0 && (
                    <div className="text-xs mt-1">
                      {architecture.references.map((ref) => (
                        <a
                          key={ref.url}
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline text-primary hover:text-primary/80 mr-2"
                        >
                          {ref.title}
                        </a>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Architecture Diagram - Full width, prominent */}
              <Card className="mb-4 border border-border bg-card">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-foreground">Architecture Diagram</h2>
                    <Link
                      to={`/threat-modeler?template=${ARCH_TO_TEMPLATE[architecture.id] ?? ""}`}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 border border-primary/30 rounded-md px-3 py-1.5 hover:bg-primary/5 transition-colors"
                    >
                      <Crosshair className="h-3.5 w-3.5" />
                      Open in Threat Modeler
                    </Link>
                  </div>
                  <ArchitectureFlowDiagram
                    architectureId={architecture.id}
                    className="w-full h-[400px]"
                  />
                </CardContent>
              </Card>

              {/* Detailed Description Card */}
              {architecture.detailedDescription && (
                <Card className="mb-4 border border-border bg-card">
                  <CardContent className="p-4">
                    <h2 className="text-lg font-semibold mb-3 text-foreground">
                      Architecture Overview
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                      {architecture.detailedDescription}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Relevant Threats Section */}
              {architecture.relevantThreats && architecture.relevantThreats.length > 0 && (
                <Card className="mb-4 border border-destructive/20 dark:border-destructive/30 bg-card">
                  <CardContent className="p-4">
                    <h2 className="text-lg font-semibold mb-3 text-destructive">
                      Relevant Threats
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      Security concerns are focused on protecting this architecture from the
                      following attack vectors:
                    </p>
                    <div className="space-y-4">
                      {architecture.relevantThreats.map((threat, index) => (
                        <div
                          key={index}
                          className="border rounded-lg p-4 bg-destructive/5 dark:bg-destructive/10 border-destructive/20 dark:border-destructive/30"
                        >
                          <h3 className="font-semibold text-destructive mb-2">{threat.title}</h3>
                          <p className="text-sm text-destructive/80 leading-relaxed">
                            {threat.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Grid for the rest of the cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Real-world Examples */}
                {realWorldExamples[architecture.id] && (
                  <Card className="border border-border bg-card">
                    <CardContent className="p-4">
                      <h2 className="text-base font-semibold mb-2 text-foreground">
                        Real-World Examples
                      </h2>
                      <ul className="list-disc pl-6 text-muted-foreground">
                        {realWorldExamples[architecture.id].map((ex, i) => (
                          <li key={i}>{ex}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
                {/* Key Components */}
                <Card className="border border-primary/20 bg-card lg:col-span-2">
                  <CardContent className="p-4">
                    <h2 className="text-base font-semibold mb-4 text-primary">
                      Key Components & Sub-Components
                    </h2>
                    <div className="space-y-6">
                      {components.map((comp) => {
                        const node = getComponentDataById(comp.id);
                        return (
                          <div key={comp.id} className="border rounded-lg p-4 bg-primary/5">
                            {/* Main Component */}
                            <div className="mb-3">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <span className="font-bold text-lg text-primary">
                                    {node?.title || comp.id.toUpperCase()}
                                  </span>
                                  <span className="ml-2 font-mono text-xs text-primary/70 bg-primary/10 px-2 py-1 rounded">
                                    {comp.id.replace(/-/g, ".").toUpperCase()}
                                  </span>
                                </div>
                                <Link
                                  to={`/components/${comp.id.replace(/-/g, ".")}`}
                                  className="text-primary hover:text-primary/80 font-medium underline text-xs"
                                >
                                  View Details →
                                </Link>
                              </div>
                              {node?.description && (
                                <div className="text-sm text-muted-foreground mb-3 leading-relaxed border-l-4 border-primary/20 pl-3 bg-muted/30 py-2 rounded-r">
                                  <span className="font-medium text-primary/80">Summary: </span>
                                  {node.description}
                                </div>
                              )}
                              {node?.threatCategories && node.threatCategories.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {node.threatCategories.map((cat, i) => (
                                    <span
                                      key={i}
                                      className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs px-2 py-0.5 rounded-full"
                                    >
                                      {cat}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Sub-Components */}
                            {node?.children && node.children.length > 0 && (
                              <div className="ml-4 border-l-2 border-primary/20 pl-4">
                                <h4 className="text-sm font-semibold text-primary/80 mb-3">
                                  Sub-Components:
                                </h4>
                                <div className="grid gap-3">
                                  {node.children.map((subComp) => (
                                    <div
                                      key={subComp.id}
                                      className="bg-muted/30 border border-primary/10 rounded-md p-3"
                                    >
                                      <div className="flex items-center justify-between mb-2">
                                        <div>
                                          <span className="font-medium text-sm text-primary">
                                            {subComp.title}
                                          </span>
                                          <span className="ml-2 font-mono text-xs text-primary/60 bg-primary/5 px-1.5 py-0.5 rounded">
                                            {subComp.id.replace(/-/g, ".")}
                                          </span>
                                        </div>
                                        <Link
                                          to={`/components/${subComp.id.replace(/-/g, ".")}`}
                                          className="text-primary text-xs hover:text-primary/80 underline"
                                        >
                                          Details
                                        </Link>
                                      </div>
                                      {subComp.description && (
                                        <div className="text-xs text-muted-foreground leading-relaxed mb-2 border-l-2 border-primary/10 pl-2 bg-muted/30 py-1">
                                          <span className="font-medium text-primary/70">
                                            Summary:{" "}
                                          </span>
                                          {subComp.description}
                                        </div>
                                      )}
                                      {subComp.threatCategories &&
                                        subComp.threatCategories.length > 0 && (
                                          <div className="flex flex-wrap gap-1 mt-2">
                                            {subComp.threatCategories.map((cat, i) => (
                                              <span
                                                key={i}
                                                className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs px-1.5 py-0.5 rounded"
                                              >
                                                {cat}
                                              </span>
                                            ))}
                                          </div>
                                        )}

                                      {/* Sub-sub-components */}
                                      {subComp.children && subComp.children.length > 0 && (
                                        <div className="ml-4 mt-3 border-l-2 border-primary/15 pl-3">
                                          <div className="text-xs font-semibold text-primary/70 mb-2">
                                            Sub-components:
                                          </div>
                                          <div className="space-y-2">
                                            {subComp.children.map((subSubComp) => (
                                              <div
                                                key={subSubComp.id}
                                                className="bg-muted/30 border border-primary/10 rounded p-2"
                                              >
                                                <div className="flex items-center justify-between mb-2">
                                                  <div>
                                                    <span className="font-medium text-xs text-primary/90">
                                                      {subSubComp.title}
                                                    </span>
                                                    <span className="ml-2 font-mono text-xs text-primary/50 bg-primary/5 px-1 py-0.5 rounded">
                                                      {subSubComp.id.replace(/-/g, ".")}
                                                    </span>
                                                  </div>
                                                  <Link
                                                    to={`/components/${subSubComp.id.replace(/-/g, ".")}`}
                                                    className="text-primary text-xs hover:text-primary/80 underline"
                                                  >
                                                    Details
                                                  </Link>
                                                </div>
                                                {subSubComp.description && (
                                                  <div className="text-xs text-muted-foreground leading-relaxed border-l border-primary/10 pl-2 bg-muted/30 py-1">
                                                    <span className="font-medium text-primary/60">
                                                      Summary:{" "}
                                                    </span>
                                                    {subSubComp.description}
                                                  </div>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
                {/* Associated Threats */}
                <Card className="border border-threat/20 bg-card">
                  <CardContent className="p-4">
                    <h2 className="text-base font-semibold mb-2 text-threat">Associated Threats</h2>
                    <ul className="space-y-4">
                      {threats.length > 0 ? (
                        threats.map((threat) => (
                          <li key={threat.id}>
                            <Link
                              to={`/threats/${threat.id}`}
                              className="text-threat underline font-medium"
                            >
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
                <Card className="border border-control/20 bg-card">
                  <CardContent className="p-4">
                    <h2 className="text-base font-semibold mb-2 text-control">Mitigations</h2>
                    <ul className="space-y-4">
                      {mitigations.length > 0 ? (
                        mitigations.map((mitigation) => (
                          <li key={mitigation.id}>
                            <Link
                              to={`/controls/${mitigation.id}`}
                              className="text-control underline font-medium"
                            >
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
                  <Card className="border border-yellow-200 dark:border-yellow-800 bg-card lg:col-span-2">
                    <CardContent className="p-4">
                      <h2 className="text-base font-semibold mb-2 text-foreground">
                        Threat-Component Relationship Map
                      </h2>
                      <div className="overflow-x-auto">
                        <table className="min-w-full border text-sm">
                          <thead>
                            <tr>
                              <th className="px-3 py-2 border-b">Threat</th>
                              {components.map((comp) => {
                                const node = getComponentDataById(comp.id);
                                return (
                                  <th
                                    key={comp.id}
                                    className="px-3 py-2 border-b text-center min-w-[120px]"
                                  >
                                    <div className="text-xs font-medium text-primary">
                                      {node?.title || comp.id.toUpperCase()}
                                    </div>
                                    <div className="text-xs font-mono text-muted-foreground mt-1 bg-muted px-1 py-0.5 rounded">
                                      {comp.id.replace(/-/g, ".").toUpperCase()}
                                    </div>
                                  </th>
                                );
                              })}
                            </tr>
                          </thead>
                          <tbody>
                            {threats.map((threat) => (
                              <tr key={threat.id}>
                                <td className="px-3 py-2 border-b font-medium">
                                  <Link
                                    to={`/threats/${threat.id}`}
                                    className="text-threat underline"
                                  >
                                    {threat.code}
                                  </Link>
                                </td>
                                {components.map((comp) => (
                                  <td key={comp.id} className="px-3 py-2 border-b text-center">
                                    {threatAffectsComponent(threat, comp.id) ? (
                                      <span
                                        className="inline-block w-3 h-3 rounded-full bg-yellow-400"
                                        title="Threatens"
                                      />
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
      <Footer />
    </>
  );
};

export default ArchitectureDetail;

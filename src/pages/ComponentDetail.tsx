import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SidebarNav from "@/components/layout/SidebarNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  ArrowRight,
  Shield,
  AlertTriangle,
  GitMerge,
  Wrench,
  Code,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { threatsData, mitigationsData, Threat } from "../components/components/securityData";
import { Helmet } from "react-helmet";
import {
  getComponentById,
  getMainComponentId,
  buildComponentMap,
} from "../components/components/frameworkData";

const componentMap = buildComponentMap();
const normalizeId = (id: string) => id.replace(/-/g, ".").toLowerCase();

const ComponentDetail = () => {
  const { componentId } = useParams<{ componentId: string }>();
  const [activeTab, setActiveTab] = useState<
    "overview" | "threats" | "mitigations" | "architectures"
  >("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const {
    component,
    subComponent,
    isSubComponent,
    mainComponentId,
    threatCodes,
    relatedThreats,
    relatedMitigations,
  } = useMemo(() => {
    const mainId = getMainComponentId(componentId ?? "");
    const currentNode = componentId ? getComponentById(componentId) : undefined;
    const mainNode = getComponentById(mainId);
    const parentNode = mainNode ?? currentNode;
    const isSub = currentNode && parentNode && currentNode.id !== parentNode.id;

    const viewComponent = parentNode
      ? {
          id: parentNode.id,
          title: parentNode.title,
          description: parentNode.description ?? "",
          color: parentNode.color,
          subComponents: (parentNode.children ?? []).map((c) => ({
            id: c.id,
            title: c.title,
            description: c.description ?? "",
          })),
          relatedArchitectures: parentNode.relatedArchitectures ?? [],
          relatedComponents: parentNode.relatedComponents ?? [],
          securityImplications: parentNode.securityImplications ?? "",
          implementationConsiderations: parentNode.implementationConsiderations ?? "",
        }
      : null;

    const threatIds = (currentNode ?? parentNode)?.threatIds ?? [];
    const threats = threatIds.map((tid) => threatsData[tid]).filter((t): t is Threat => !!t);
    const mitigations = Object.values(mitigationsData).filter((m) =>
      threats.some((t) => m.threatIds.includes(t.id)),
    );
    const codes = threatIds.map((tid) => threatsData[tid]?.code).filter(Boolean) as string[];

    return {
      component: viewComponent,
      subComponent:
        currentNode && isSub
          ? {
              id: currentNode.id,
              title: currentNode.title,
              description: currentNode.description ?? "",
            }
          : null,
      isSubComponent: !!isSub,
      mainComponentId: mainId,
      threatCodes: codes,
      relatedThreats: threats,
      relatedMitigations: mitigations,
    };
  }, [componentId]);

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  // Icons for subcomponents based on component type
  const getSubcomponentIcon = (componentId: string) => {
    switch (componentId) {
      case "kc1":
        return null;
      case "kc2":
        return <GitMerge className="w-4 h-4 mr-2" />;
      case "kc3":
        return null;
      case "kc4":
        return null;
      case "kc5":
        return <Wrench className="w-4 h-4 mr-2" />;
      case "kc6":
        return componentId.includes("kc6.2") ? (
          <Code className="w-4 h-4 mr-2" />
        ) : componentId.includes("kc6.3") ? (
          <Database className="w-4 h-4 mr-2" />
        ) : null;
      default:
        return null;
    }
  };

  // If component not found, or sub-component not found, show not found message
  if (!component || (isSubComponent && !subComponent)) {
    return (
      <>
        <Header onMobileMenuToggle={handleMobileMenuToggle} isMobileMenuOpen={isMobileMenuOpen} />

        {/* Mobile Navigation Sidebar */}
        <SidebarNav type="components" isOpen={isMobileMenuOpen} onClose={handleMobileMenuClose} />

        <main id="main-content" className="container py-12">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4">
              {isSubComponent ? "Sub-Component Not Found" : "Component Not Found"}
            </h1>
            <p className="text-muted-foreground mb-6">
              The {isSubComponent ? "sub-component" : "component"} you're looking for does not exist
              or has been removed.
            </p>
            <Link to="/components">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Components
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Prepare SEO data
  const pageTitle = isSubComponent ? subComponent!.title : component.title;
  const pageDescription = isSubComponent ? subComponent!.description : component.description;
  const pageUrl = `https://agenticsecurity.info/components/${componentId}`;

  return (
    <>
      <Helmet>
        <title>{pageTitle} | OWASP Securing Agentic Applications Guide</title>
        <meta
          name="description"
          content={`${pageDescription} Learn about security threats, mitigations, and best practices for this AI component.`}
        />
        <meta
          name="keywords"
          content={`${pageTitle}, AI security, OWASP, agentic systems, ${threatCodes.join(", ")}, AI threats, security controls`}
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={pageUrl} />
        <meta property="og:title" content={`${pageTitle} | OWASP Guide`} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:site_name" content="OWASP Securing Agentic Applications Guide" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${pageTitle} | OWASP Guide`} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:url" content={pageUrl} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TechArticle",
            headline: pageTitle,
            description: pageDescription,
            url: pageUrl,
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
            about: "AI Security",
            keywords: threatCodes.join(", "),
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
        type="components"
        activeId={componentId}
        isOpen={isMobileMenuOpen}
        onClose={handleMobileMenuClose}
      />

      <main id="main-content" className="container py-12">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Link
              to="/components"
              className="inline-flex items-center text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Components
            </Link>

            {isSubComponent && (
              <>
                <span className="text-muted-foreground">/</span>
                <Link
                  to={`/components/${mainComponentId}`}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {component.title}
                </Link>
              </>
            )}
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">
              {isSubComponent ? subComponent!.title : component.title}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {isSubComponent ? subComponent!.description : component.description}
            </p>
            {isSubComponent && (
              <p className="mt-1 text-sm text-muted-foreground">Part of: {component.title}</p>
            )}
          </div>

          {/* Tab navigation */}
          <div className="border-b mb-6">
            <div className="flex flex-wrap gap-y-2 md:gap-y-0 space-x-6">
              <button
                onClick={() => setActiveTab("overview")}
                className={cn(
                  "pb-2 px-1 font-medium",
                  activeTab === "overview"
                    ? "border-b-2 border-primary text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("threats")}
                className={cn(
                  "pb-2 px-1 font-medium flex items-center",
                  activeTab === "threats"
                    ? "border-b-2 border-threat text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <AlertTriangle className="mr-1 h-4 w-4" />
                Threats
                <span className="ml-1 text-xs bg-threat/10 text-threat px-2 py-0.5 rounded-full">
                  {relatedThreats.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("mitigations")}
                className={cn(
                  "pb-2 px-1 font-medium flex items-center",
                  activeTab === "mitigations"
                    ? "border-b-2 border-control text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Shield className="mr-1 h-4 w-4" />
                Mitigations
                <span className="ml-1 text-xs bg-control/10 text-control px-2 py-0.5 rounded-full">
                  {relatedMitigations.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("architectures")}
                className={cn(
                  "pb-2 px-1 font-medium flex items-center",
                  activeTab === "architectures"
                    ? "border-b-2 border-architecture text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <GitMerge className="mr-1 h-4 w-4" />
                Architectures
              </button>
            </div>
          </div>

          {/* Tab content */}
          <div>
            {activeTab === "overview" && (
              <div className="space-y-8">
                {!isSubComponent && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Subcomponents</h2>
                    <div className="grid grid-cols-1 gap-4">
                      {component.subComponents.map((subComp) => (
                        <Link to={`/components/${subComp.id}`} key={subComp.id}>
                          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                            <CardContent className="pt-6">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center">
                                  {getSubcomponentIcon(subComp.id)}
                                  <h3 className="text-lg font-medium">{subComp.title}</h3>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <p className="text-muted-foreground">{subComp.description}</p>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {isSubComponent && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Detailed Information</h2>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-medium mb-2">Description</h3>
                            <p className="text-muted-foreground">{subComponent!.description}</p>
                          </div>
                          <div>
                            <h3 className="font-medium mb-2">Parent Component</h3>
                            <Link to={`/components/${mainComponentId}`}>
                              <div
                                className={cn(
                                  "inline-block border rounded-md p-3 transition-colors hover:bg-accent",
                                  component.color,
                                )}
                              >
                                {component.title}
                              </div>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {!isSubComponent && (
                  <>
                    <div>
                      <h2 className="text-xl font-semibold mb-4">Security Implications</h2>
                      <Card>
                        <CardContent className="pt-6">
                          <p className="text-muted-foreground">{component.securityImplications}</p>
                        </CardContent>
                      </Card>
                    </div>

                    <div>
                      <h2 className="text-xl font-semibold mb-4">Implementation Considerations</h2>
                      <Card>
                        <CardContent className="pt-6">
                          <p className="text-muted-foreground">
                            {component.implementationConsiderations}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <div>
                      <h2 className="text-xl font-semibold mb-4">Related Components</h2>
                      <div className="flex flex-wrap gap-3">
                        {component.relatedComponents.map((id) => (
                          <Link to={`/components/${id}`} key={id}>
                            <div
                              className={cn(
                                "border rounded-md p-3 transition-colors hover:bg-accent",
                                componentMap.get(normalizeId(id))?.color,
                              )}
                            >
                              {componentMap.get(normalizeId(id))?.title}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === "threats" && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">Threats to {component.title}</h2>
                {relatedThreats.length > 0 ? (
                  <div className="space-y-4">
                    {relatedThreats.map((threat) => (
                      <Card key={threat.id} className="border-threat/20">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-medium">
                              <span className="font-mono text-xs bg-threat/10 text-threat px-2 py-0.5 rounded mr-2">
                                {threat.code}
                              </span>
                              {threat.name}
                            </h3>
                            <span
                              className={cn(
                                "text-xs px-2 py-0.5 rounded-full",
                                threat.impactLevel === "high"
                                  ? "bg-destructive/10 text-destructive"
                                  : threat.impactLevel === "medium"
                                    ? "bg-warning/10 text-warning"
                                    : "bg-primary/10 text-primary",
                              )}
                            >
                              {threat.impactLevel.charAt(0).toUpperCase() +
                                threat.impactLevel.slice(1)}{" "}
                              Impact
                            </span>
                          </div>
                          <p className="text-muted-foreground mb-4">{threat.description}</p>
                          <div className="text-sm">
                            <span className="font-medium">Affected Components: </span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {threat.componentIds.map((id) => (
                                <Link to={`/components/${id}`} key={id}>
                                  <span className="inline-block bg-secondary px-2 py-1 rounded text-xs">
                                    {componentMap.get(normalizeId(id))?.title?.split(" ")[0] ?? id}
                                  </span>
                                </Link>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    No specific threats documented for this component.
                  </p>
                )}
              </div>
            )}

            {activeTab === "mitigations" && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">Security Controls & Mitigations</h2>
                {relatedMitigations.length > 0 ? (
                  <div className="space-y-4">
                    {relatedMitigations.map((mitigation) => (
                      <Card key={mitigation.id} className="border-control/20">
                        <CardContent className="pt-6">
                          <h3 className="text-lg font-medium mb-2 text-foreground">
                            {mitigation.name}
                          </h3>
                          <p className="text-muted-foreground mb-4">{mitigation.description}</p>

                          <div className="flex flex-wrap gap-2 mb-4">
                            {mitigation.designPhase && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                Design Phase
                              </span>
                            )}
                            {mitigation.buildPhase && (
                              <span className="text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded-full">
                                Build Phase
                              </span>
                            )}
                            {mitigation.operationPhase && (
                              <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full">
                                Operation Phase
                              </span>
                            )}
                          </div>

                          <div className="mb-4">
                            <span className="text-sm font-medium">Mitigates Threats: </span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {mitigation.threatIds.map((threatId) => {
                                const threat = threatsData[threatId];
                                return threat ? (
                                  <span
                                    key={threatId}
                                    className="text-xs bg-threat/10 text-threat px-2 py-0.5 rounded-full"
                                  >
                                    <span className="font-mono">{threat.code}</span> - {threat.name}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          </div>
                          <div className="bg-muted p-4 rounded-md">
                            <h4 className="text-sm font-medium mb-2">Implementation Guidance</h4>
                            {mitigation.implementationDetail ? (
                              <div className="space-y-2">
                                {mitigation.implementationDetail.design && (
                                  <div>
                                    <span className="font-semibold">Design Phase:</span>
                                    <div className="text-sm text-muted-foreground whitespace-pre-line">
                                      {mitigation.implementationDetail.design}
                                    </div>
                                  </div>
                                )}
                                {mitigation.implementationDetail.build && (
                                  <div>
                                    <span className="font-semibold">Build Phase:</span>
                                    <div className="text-sm text-muted-foreground whitespace-pre-line">
                                      {mitigation.implementationDetail.build}
                                    </div>
                                  </div>
                                )}
                                {mitigation.implementationDetail.operations && (
                                  <div>
                                    <span className="font-semibold">Operation Phase:</span>
                                    <div className="text-sm text-muted-foreground whitespace-pre-line">
                                      {mitigation.implementationDetail.operations}
                                    </div>
                                  </div>
                                )}
                                {mitigation.implementationDetail.toolsAndFrameworks && (
                                  <div>
                                    <span className="font-semibold">Tools & Frameworks:</span>
                                    <div className="text-sm text-muted-foreground whitespace-pre-line">
                                      {mitigation.implementationDetail.toolsAndFrameworks}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                No implementation guidance available.
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    No specific mitigations documented for this component's threats.
                  </p>
                )}
              </div>
            )}

            {activeTab === "architectures" && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">Relevant Architectures</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {component.relatedArchitectures.map((arch) => (
                    <Card key={arch.id} className="bg-card">
                      <CardContent className="pt-6">
                        <h3 className="text-lg font-medium mb-2">{arch.name}</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {arch.relevance === "primary"
                            ? `${component.title} is a primary component in this architecture.`
                            : `${component.title} plays a supporting role in this architecture.`}
                        </p>
                        <Link to={`/architectures/${arch.id}`}>
                          <Button variant="outline" size="sm">
                            View Architecture
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default ComponentDetail;

import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { threatsData, mitigationsData, Threat, Mitigation } from "../components/components/securityData";
import Header from "@/components/layout/Header";
import SidebarNav from "../components/layout/SidebarNav";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Icon } from "@/components/ui/icon";
import { Helmet } from "react-helmet";

export const ThreatDetail = () => {
  const { threatId } = useParams<{ threatId: string }>();
  const threat: Threat | undefined = threatId ? threatsData[threatId] : undefined;
  const mitigations: Mitigation[] = threat
    ? Object.values(mitigationsData).filter(m => m.threatIds.includes(threat.id))
    : [];



  if (!threat) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Threat Not Found</h1>
        <Link to="/threats">
          <Button>Back to Threats</Button>
        </Link>
      </div>
    );
  }

  // Analytics for mitigations/components/tags
  const mitigationCount = threat.mitigationIds?.length || 0;
  const componentCount = threat.componentIds?.length || 0;
  const tagCount = (threat.tags || []).length;

  return (
    <>
      <Helmet>
        <title>{threat.name} | OWASP Securing Agentic Applications Guide</title>
        <meta name="description" content={`${threat.description} Learn about this AI security threat, its impact, attack vectors, and available mitigations.`} />
        <meta name="keywords" content={`${threat.name}, AI security threat, OWASP, agentic systems, ${threat.tags?.join(', ') || ''}, AI threats, security vulnerabilities`} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`https://agenticsecurity.info/threats/${threat.id}`} />
        <meta property="og:title" content={`${threat.name} | OWASP Guide`} />
        <meta property="og:description" content={threat.description} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://agenticsecurity.info/threats/${threat.id}`} />
        <meta property="og:site_name" content="OWASP Securing Agentic Applications Guide" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${threat.name} | OWASP Guide`} />
        <meta name="twitter:description" content={threat.description} />
        <meta name="twitter:url" content={`https://agenticsecurity.info/threats/${threat.id}`} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TechArticle",
            "headline": threat.name,
            "description": threat.description,
            "url": `https://agenticsecurity.info/threats/${threat.id}`,
            "datePublished": new Date().toISOString(),
            "dateModified": new Date().toISOString(),
            "author": {
              "@type": "Organization",
              "name": "OWASP"
            },
            "publisher": {
              "@type": "Organization",
              "name": "OWASP",
              "url": "https://owasp.org"
            },
            "about": "AI Security Threat",
            "keywords": threat.tags?.join(', ') || '',
            "isPartOf": {
              "@type": "WebSite",
              "name": "OWASP Securing Agentic Applications Guide",
              "url": "https://agenticsecurity.info"
            }
          })}
        </script>
      </Helmet>
      <Header />
      <section className="py-12 bg-secondary/50 min-h-screen">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <SidebarNav type="threats" activeId={threat.id} isOpen={false} onClose={() => {}} />
            <div className="flex-1">
              <Link to="/threats" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4">
                &larr; Back to Threats
              </Link>
              {/* Overview/Metadata Card */}
              <Card className="mb-4 border border-threat/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    {threat.icon && <Icon name={threat.icon} color={threat.color} size={32} />}
                    <h1 className="text-2xl font-bold text-foreground">{threat.name}</h1>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(threat.tags || []).map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">Version: {threat.version || "-"} | Last Updated: {threat.lastUpdated || "-"} | Updated By: {threat.updatedBy || "-"}</div>
                  {threat.references && threat.references.length > 0 && <div className="text-xs mt-1">{threat.references.map(ref => <a key={ref.url} href={ref.url} target="_blank" rel="noopener noreferrer" className="underline text-primary hover:text-primary/80 mr-2">{ref.title}</a>)}</div>}
                  <p className="text-muted-foreground mt-4">{threat.description}</p>
                  {/* Analytics widgets */}
                  <div className="flex flex-wrap gap-4 mt-4">
                    <div className="bg-muted rounded-lg border p-2 flex flex-col items-center min-w-[100px]">
                      <div className="text-xs text-muted-foreground mb-1">Mitigations</div>
                      <span className="font-bold text-lg text-control">{mitigationCount}</span>
                    </div>
                    <div className="bg-muted rounded-lg border p-2 flex flex-col items-center min-w-[100px]">
                      <div className="text-xs text-muted-foreground mb-1">Affected Components</div>
                      <span className="font-bold text-lg text-primary">{componentCount}</span>
                    </div>
                    <div className="bg-muted rounded-lg border p-2 flex flex-col items-center min-w-[100px]">
                      <div className="text-xs text-muted-foreground mb-1">Tags</div>
                      <span className="font-bold text-lg text-yellow-600 dark:text-yellow-400">{tagCount}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* Grid for the rest of the cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Technical Details */}
                <Card className="border border-blue-200 dark:border-blue-800">
                  <CardContent className="p-4">
                    <h2 className="text-base font-semibold mb-2 text-blue-900 dark:text-blue-100">Technical Details</h2>
                    <div className="mb-2">
                      <span className="font-medium">Affected Components: </span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {threat.componentIds.map(id => (
                          <Link to={`/components/${id}`} key={id}>
                            <span className="inline-block bg-muted px-2 py-1 rounded text-xs">
                              {id.toUpperCase()}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Impact Level: </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        threat.impactLevel === "high"
                          ? "bg-destructive/10 text-destructive"
                          : threat.impactLevel === "medium"
                          ? "bg-warning/10 text-warning"
                          : "bg-primary/10 text-primary"
                      }`}>
                        {threat.impactLevel.charAt(0).toUpperCase() + threat.impactLevel.slice(1)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                {/* Attack Vectors */}
                <Card className="border border-yellow-200 dark:border-yellow-800">
                  <CardContent className="p-4">
                    <h2 className="text-base font-semibold mb-2 text-yellow-900 dark:text-yellow-100">Attack Vectors</h2>
                    <div className="space-y-3">
                      {(threat.attackVectors || []).length > 0 ? (
                        threat.attackVectors!.map((attack, i) => (
                          <div key={i} className="border-l-4 border-yellow-400 pl-3">
                            <div className="font-medium text-sm">{attack.vector}</div>
                            {attack.example && <div className="text-xs text-muted-foreground mt-1">{attack.example}</div>}
                            {attack.severity && (
                              <span className={`inline-block text-xs px-2 py-0.5 rounded-full mt-1 ${
                                attack.severity === "high"
                                  ? "bg-destructive/10 text-destructive"
                                  : attack.severity === "medium"
                                  ? "bg-warning/10 text-warning"
                                  : "bg-primary/10 text-primary"
                              }`}>
                                {attack.severity.charAt(0).toUpperCase() + attack.severity.slice(1)}
                              </span>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground">No attack vectors documented.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
                {/* Impact Analysis */}
                <Card className="border border-red-200 dark:border-red-800">
                  <CardContent className="p-4">
                    <h2 className="text-base font-semibold mb-2 text-red-900 dark:text-red-100">Impact Analysis</h2>
                    {threat.impactAnalysis ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Confidentiality:</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            threat.impactAnalysis.confidentiality 
                              ? "bg-destructive/10 text-destructive" 
                              : "bg-muted text-muted-foreground"
                          }`}>
                            {threat.impactAnalysis.confidentiality ? "Affected" : "Not Affected"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Integrity:</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            threat.impactAnalysis.integrity 
                              ? "bg-destructive/10 text-destructive" 
                              : "bg-muted text-muted-foreground"
                          }`}>
                            {threat.impactAnalysis.integrity ? "Affected" : "Not Affected"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Availability:</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            threat.impactAnalysis.availability 
                              ? "bg-destructive/10 text-destructive" 
                              : "bg-muted text-muted-foreground"
                          }`}>
                            {threat.impactAnalysis.availability ? "Affected" : "Not Affected"}
                          </span>
                        </div>
                        <div className="mt-3">
                          <span className="font-medium">Risk Score: </span>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            (threat.riskScore || 0) >= 8 
                              ? "bg-destructive/10 text-destructive" 
                              : (threat.riskScore || 0) >= 6
                              ? "bg-warning/10 text-warning"
                              : "bg-primary/10 text-primary"
                          }`}>
                            {threat.riskScore || "N/A"} / 10
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No impact analysis available.</p>
                    )}
                  </CardContent>
                </Card>
                {/* Affected Components */}
                <Card className="border border-purple-200 dark:border-purple-800">
                  <CardContent className="p-4">
                    <h2 className="text-base font-semibold mb-2 text-purple-900 dark:text-purple-100">Affected Components</h2>
                    {threat.affectedComponents && threat.affectedComponents.length > 0 ? (
                      <div className="space-y-2">
                        {threat.affectedComponents.map((component, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                            <span className="text-sm">{component}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No specific affected components documented.</p>
                    )}
                  </CardContent>
                </Card>
                {/* Mitigation Names */}
                <Card className="border border-green-200 dark:border-green-800">
                  <CardContent className="p-4">
                    <h2 className="text-base font-semibold mb-2 text-green-900 dark:text-green-100">Mitigation Categories</h2>
                    {threat.mitigationNames && threat.mitigationNames.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {threat.mitigationNames.map((name, i) => (
                          <Badge key={i} variant="outline" className="border-green-300 text-green-700 dark:border-green-700 dark:text-green-300">
                            {name}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No mitigation categories documented.</p>
                    )}
                  </CardContent>
                </Card>
                {/* References */}
                <Card className="border border-blue-300 dark:border-blue-700">
                  <CardContent className="p-4">
                    <h2 className="text-base font-semibold mb-2 text-blue-900 dark:text-blue-100">References</h2>
                    {threat.references && threat.references.length > 0 ? (
                      <div className="space-y-2">
                        {threat.references.map((ref, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                            <a href={ref.url} target="_blank" rel="noopener noreferrer" className="underline text-primary hover:text-primary/80 text-sm">
                              {ref.title}
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No references documented.</p>
                    )}
                  </CardContent>
                </Card>
                {/* Mitigation */}
                <Card className="border border-control/20">
                  <CardContent className="p-4">
                    <h2 className="text-base font-semibold mb-2">Mitigations</h2>
                    {mitigations.length > 0 ? (
                      <ul className="mt-2 space-y-2">
                        {mitigations.map(mitigation => (
                          <li key={mitigation.id}>
                            <Link to={`/controls/${mitigation.id}`} className="text-control underline">
                              {mitigation.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="ml-2 text-muted-foreground">No mitigations documented.</span>
                    )}
                  </CardContent>
                </Card>

              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ThreatDetail; 
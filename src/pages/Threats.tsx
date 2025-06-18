import Header from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { threatsData, Threat } from "../components/components/securityData";
import { frameworkData } from "../components/components/frameworkData";
import SidebarNav from "../components/layout/SidebarNav";
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Icon } from "@/components/ui/icon";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Helmet } from "react-helmet";

// Helper to map component IDs to names
const componentIdToName: Record<string, string> = Object.fromEntries(
  frameworkData.map((c) => [c.id, c.title])
);

export const Threats = () => {
  const threats: Threat[] = Object.values(threatsData);
  // Collect all tags and statuses
  const allTags = Array.from(new Set(threats.flatMap(t => t.tags || [])));
  const allStatuses = Array.from(new Set(threats.map(t => t.status).filter(Boolean)));
  // Filter/sort state
  const [tagFilter, setTagFilter] = useState<string|null>(null);
  const [statusFilter, setStatusFilter] = useState<string|null>(null);
  const [sortBy, setSortBy] = useState<string>("displayOrder");
  // Filtering
  const filteredThreats = useMemo(() => {
    return threats.filter(t =>
      (!tagFilter || (t.tags || []).includes(tagFilter)) &&
      (!statusFilter || t.status === statusFilter)
    );
  }, [threats, tagFilter, statusFilter]);
  // Sorting
  const sortedThreats = useMemo(() => {
    return [...filteredThreats].sort((a, b) => {
      if (sortBy === "risk") return (b.riskScore || 0) - (a.riskScore || 0);
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "displayOrder") return (a.displayOrder || 999) - (b.displayOrder || 999);
      return 0;
    });
  }, [filteredThreats, sortBy]);
  // Analytics
  const statusCounts = useMemo(() => {
    const counts = {};
    for (const t of threats) counts[t.status || "unknown"] = (counts[t.status || "unknown"] || 0) + 1;
    return counts;
  }, [threats]);
  const avgRisk = useMemo(() => {
    const risks = threats.map(t => t.riskScore).filter(x => typeof x === "number");
    return risks.length ? (risks.reduce((a, b) => a + (b || 0), 0) / risks.length).toFixed(1) : "-";
  }, [threats]);
  const tagCloud = useMemo(() => {
    const tagMap = {};
    for (const t of threats) for (const tag of t.tags || []) tagMap[tag] = (tagMap[tag] || 0) + 1;
    return tagMap;
  }, [threats]);

  return (
    <>
      <Helmet>
        <title>Threats | OWASP Securing Agentic Applications Guide</title>
        <meta name="description" content="Explore key threats to agentic AI systems, including prompt injection, memory poisoning, and more. Learn how to secure your AI applications." />
        <meta name="keywords" content="AI security, OWASP, agentic threats, prompt injection, memory poisoning, AI risks, LLM security, agent security" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://asi.lovable.dev/threats" />
        <meta property="og:url" content="https://asi.lovable.dev/threats" />
        <meta name="twitter:url" content="https://asi.lovable.dev/threats" />
      </Helmet>
      <Header />
      
      {/* Floating sidebar controlled by toggle button */}
      <SidebarNav type="threats" isOpen={false} onClose={() => {}} />
      
      <section className="py-16 bg-secondary/50">
        <div className="container px-4 md:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="space-y-2 max-w-3xl">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Threats</h2>
                <p className="text-muted-foreground md:text-xl">
                  Explore the key threats to agentic systems and their components
                </p>
              </div>
            </div>
            
            {/* Threats grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {sortedThreats.map((threat) => (
                <Link to={`/threats/${threat.id}`} key={threat.id}>
                  <Card className="h-full border border-threat/20 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                    <CardContent className="p-6">
                      <div className="flex items-center mb-2 gap-2">
                        {threat.icon && <Icon name={threat.icon} color={threat.color} size={28} />}
                        <span className="font-mono text-xs bg-threat/10 text-threat px-2 py-0.5 rounded">
                          {threat.code}
                        </span>
                        <h3 className="text-xl font-bold" style={{ color: threat.color }}>{threat.name}</h3>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {(threat.tags || []).map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                      </div>
                      <div className="text-xs text-muted-foreground mb-1">Version: {threat.version || "-"} | Last Updated: {threat.lastUpdated || "-"} | Updated By: {threat.updatedBy || "-"}</div>
                      {threat.references && threat.references.length > 0 && <div className="text-xs mt-1">{threat.references.map(ref => <a key={ref.url} href={ref.url} target="_blank" rel="noopener noreferrer" className="underline text-primary hover:text-primary/80 mr-2">{ref.title}</a>)}</div>}
                      <p className="text-muted-foreground mt-4">{threat.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Threats; 
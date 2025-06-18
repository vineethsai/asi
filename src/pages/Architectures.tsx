import Header from "@/components/layout/Header";
import SidebarNav from "@/components/layout/SidebarNav";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { architecturesData, Architecture } from "../components/components/architecturesData";
import FeatureComparisonMatrix from "../components/home/FeatureComparisonMatrix";
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Icon } from "@/components/ui/icon";
import { Helmet } from "react-helmet";

const Architectures = () => {
  const architectures: Architecture[] = Object.values(architecturesData);
  // Collect all tags and statuses
  const allTags = Array.from(new Set(architectures.flatMap(a => a.tags || [])));
  const allStatuses = Array.from(new Set(architectures.map(a => a.status).filter(Boolean)));
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [riskFilter, setRiskFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<string>("displayOrder");
  // Filtering
  const filtered = useMemo(() => architectures.filter(a => {
    if (tagFilter && !(a.tags || []).includes(tagFilter)) return false;
    if (statusFilter && a.status !== statusFilter) return false;
    if (riskFilter && a.riskScore !== riskFilter) return false;
    return true;
  }), [architectures, tagFilter, statusFilter, riskFilter]);
  // Sorting
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortBy === "risk") return (b.riskScore || 0) - (a.riskScore || 0);
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return (a.displayOrder || 0) - (b.displayOrder || 0);
    });
  }, [filtered, sortBy]);
  // Analytics
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    architectures.forEach(a => { if (a.status) counts[a.status] = (counts[a.status] || 0) + 1; });
    return counts;
  }, [architectures]);
  const avgRisk = useMemo(() => {
    const risks = architectures.map(a => a.riskScore).filter(Boolean) as number[];
    return risks.length ? (risks.reduce((a, b) => a + b, 0) / risks.length).toFixed(1) : "-";
  }, [architectures]);
  const tagCloud = useMemo(() => {
    const counts: Record<string, number> = {};
    architectures.forEach(a => (a.tags || []).forEach(t => { counts[t] = (counts[t] || 0) + 1; }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [architectures]);

  return (
    <>
      <Helmet>
        <title>Architectures | OWASP Securing Agentic Applications Guide</title>
        <meta name="description" content="Explore agentic AI system architectures, their security implications, and best practices for secure design." />
        <meta name="keywords" content="AI security, OWASP, agentic architectures, security patterns, AI best practices, LLM security, agent security" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://agenticsecurity.info/architectures" />
        <meta property="og:url" content="https://agenticsecurity.info/architectures" />
        <meta name="twitter:url" content="https://agenticsecurity.info/architectures" />
      </Helmet>
      <Header />
      
      {/* Floating sidebar controlled by toggle button */}
      <SidebarNav type="architectures" isOpen={false} onClose={() => {}} />
      
      <section className="py-16 bg-secondary/50">
        <div className="container px-4 md:px-6">
          <div className="max-w-7xl mx-auto">
            {/* Architectures Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-0">
              {sorted.map((arch) => (
                <Link to={`/architectures/${arch.id}`} key={arch.id}>
                  <Card className="h-full border border-architecture/20 hover:shadow-lg transition-shadow" style={{ borderColor: arch.color || undefined }}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-2">
                        {arch.icon && <Icon name={arch.icon} color={arch.color} size={24} />}
                        <h3 className="text-xl font-bold text-foreground">{arch.name}</h3>
                        {arch.status && <Badge variant="outline" className="capitalize ml-2">{arch.status}</Badge>}
                      </div>
                      <p className="text-muted-foreground mb-2">{arch.description}</p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {(arch.tags || []).map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                      </div>
                      <div className="text-xs text-muted-foreground mb-1">Version: {arch.version || "-"} | Last Updated: {arch.lastUpdated || "-"}</div>
                      {arch.references && arch.references.length > 0 && <div className="text-xs mt-1">{arch.references.map(ref => <a key={ref.url} href={ref.url} target="_blank" rel="noopener noreferrer" className="underline text-blue-600 mr-2">{ref.title}</a>)}</div>}
                      <div className="text-sm mt-2">
                        <span className="font-medium">Key Components: </span>
                        <span>{arch.keyComponents.map(id => id.toUpperCase()).join(", ")}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            <div className="mt-16">
              <FeatureComparisonMatrix />
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Architectures; 
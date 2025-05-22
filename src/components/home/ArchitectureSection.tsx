import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle, AlertTriangle, GaugeCircle, BarChart3 } from "lucide-react";
import clsx from "clsx";
import { architecturesData, Architecture } from "../../components/components/architecturesData";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Icon } from "@/components/ui/icon";
import { useState, useMemo } from "react";

export const ArchitectureSection = () => {
  // Use all architectures from architecturesData, explicitly typed
  const architectures: Architecture[] = Object.values(architecturesData);
  // Collect all tags and statuses
  const allTags = Array.from(new Set(architectures.flatMap(a => a.tags || [])));
  const allStatuses = Array.from(new Set(architectures.map(a => a.status).filter(Boolean)));
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  // Filtering
  const filtered = useMemo(() => architectures.filter(a => {
    if (tagFilter && !(a.tags || []).includes(tagFilter)) return false;
    if (statusFilter && a.status !== statusFilter) return false;
    return true;
  }), [architectures, tagFilter, statusFilter]);
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

  // Visual indicator helpers
  const complexityIcon = (level: string) => {
    switch (level) {
      case "Low":
        return <CheckCircle className="text-green-600 inline-block mr-1" size={18} />;
      case "Medium":
        return <GaugeCircle className="text-yellow-500 inline-block mr-1" size={18} />;
      case "High":
        return <AlertTriangle className="text-red-600 inline-block mr-1" size={18} />;
      default:
        return null;
    }
  };
  const securityIcon = (level: string) => {
    switch (level) {
      case "Low":
        return <AlertTriangle className="text-red-600 inline-block mr-1" size={18} />;
      case "Medium":
        return <GaugeCircle className="text-yellow-500 inline-block mr-1" size={18} />;
      case "High":
        return <CheckCircle className="text-green-600 inline-block mr-1" size={18} />;
      default:
        return null;
    }
  };
  const performanceIcon = (level: string) => {
    switch (level) {
      case "High":
        return <BarChart3 className="text-green-600 inline-block mr-1" size={18} />;
      case "Medium":
        return <BarChart3 className="text-yellow-500 inline-block mr-1" size={18} />;
      case "Low":
        return <BarChart3 className="text-red-600 inline-block mr-1" size={18} />;
      case "Variable":
        return <BarChart3 className="text-blue-600 inline-block mr-1" size={18} />;
      default:
        return null;
    }
  };

  // Architecture meta for table (add for all 5)
  const architectureMeta: Record<string, { complexity: string; security: string; performance: string }> = {
    sequential: { complexity: "Low", security: "Medium", performance: "High" },
    hierarchical: { complexity: "High", security: "High", performance: "Medium" },
    collaborative: { complexity: "Medium", security: "Low", performance: "Variable" },
    reactive: { complexity: "Medium", security: "Medium", performance: "High" },
    knowledge: { complexity: "High", security: "Low", performance: "Medium" }
  };

  // Simple SVG representations of the architecture patterns
  const renderArchitectureImage = (type: string) => {
    if (type === "sequential") {
      return (
        <svg className="h-24 w-full" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="20" y="40" width="30" height="30" rx="4" fill="currentColor" className="text-primary/20" stroke="currentColor" strokeWidth="2" />
          <rect x="85" y="40" width="30" height="30" rx="4" fill="currentColor" className="text-primary/20" stroke="currentColor" strokeWidth="2" />
          <rect x="150" y="40" width="30" height="30" rx="4" fill="currentColor" className="text-primary/20" stroke="currentColor" strokeWidth="2" />
          <line x1="50" y1="55" x2="85" y2="55" stroke="currentColor" strokeWidth="2" />
          <line x1="115" y1="55" x2="150" y2="55" stroke="currentColor" strokeWidth="2" />
          <polygon points="79,50 79,60 89,55" fill="currentColor" />
          <polygon points="144,50 144,60 154,55" fill="currentColor" />
        </svg>
      );
    } else if (type === "hierarchical") {
      return (
        <svg className="h-24 w-full" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="85" y="10" width="30" height="30" rx="4" fill="currentColor" className="text-primary/20" stroke="currentColor" strokeWidth="2" />
          <rect x="20" y="60" width="30" height="30" rx="4" fill="currentColor" className="text-primary/20" stroke="currentColor" strokeWidth="2" />
          <rect x="85" y="60" width="30" height="30" rx="4" fill="currentColor" className="text-primary/20" stroke="currentColor" strokeWidth="2" />
          <rect x="150" y="60" width="30" height="30" rx="4" fill="currentColor" className="text-primary/20" stroke="currentColor" strokeWidth="2" />
          <line x1="100" y1="40" x2="100" y2="60" stroke="currentColor" strokeWidth="2" />
          <line x1="95" y1="25" x2="35" y2="60" stroke="currentColor" strokeWidth="2" />
          <line x1="105" y1="25" x2="165" y2="60" stroke="currentColor" strokeWidth="2" />
          <polygon points="100,54 95,44 105,44" fill="currentColor" />
          <polygon points="41,54 31,46 46,40" fill="currentColor" />
          <polygon points="159,54 169,46 154,40" fill="currentColor" />
        </svg>
      );
    } else {
      return (
        <svg className="h-24 w-full" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="85" y="35" width="30" height="30" rx="4" fill="currentColor" className="text-primary/20" stroke="currentColor" strokeWidth="2" />
          <rect x="20" y="35" width="30" height="30" rx="4" fill="currentColor" className="text-primary/20" stroke="currentColor" strokeWidth="2" />
          <rect x="150" y="35" width="30" height="30" rx="4" fill="currentColor" className="text-primary/20" stroke="currentColor" strokeWidth="2" />
          <line x1="50" y1="50" x2="85" y2="50" stroke="currentColor" strokeWidth="2" />
          <line x1="115" y1="50" x2="150" y2="50" stroke="currentColor" strokeWidth="2" />
          <line x1="35" y1="35" x2="75" y2="20" stroke="currentColor" strokeWidth="2" />
          <line x1="165" y1="35" x2="125" y2="20" stroke="currentColor" strokeWidth="2" />
          <line x1="35" y1="65" x2="75" y2="80" stroke="currentColor" strokeWidth="2" />
          <line x1="165" y1="65" x2="125" y2="80" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    }
  };

  return (
    <section className="py-16">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Architecture Patterns</h2>
            <p className="max-w-[700px] text-muted-foreground md:text-xl">
              Understand the security implications of different agentic system architectures
            </p>
          </div>
        </div>
        {/* Mini-summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 mb-8">
          <div className="p-4 bg-card rounded-lg border">
            <div className="text-xs text-muted-foreground mb-1">Architectures by Status</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(statusCounts).map(([status, count]) => (
                <Badge key={status} variant="outline" className="capitalize">{status}: {count}</Badge>
              ))}
            </div>
          </div>
          <div className="p-4 bg-card rounded-lg border">
            <div className="text-xs text-muted-foreground mb-1">Average Risk Score</div>
            <div className="flex items-center gap-2">
              <Progress value={Number(avgRisk) * 10} className="w-24" />
              <span className="font-bold">{avgRisk}</span>
            </div>
          </div>
          <div className="p-4 bg-card rounded-lg border">
            <div className="text-xs text-muted-foreground mb-1">Tags</div>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
          </div>
        </div>
        {/* Quick Filter Chips */}
        <div className="flex flex-wrap gap-4 mb-8 items-center">
          <div className="flex gap-2 items-center">
            <span className="text-sm">Tag:</span>
            {allTags.map(tag => (
              <button key={tag} className={`px-2 py-1 rounded text-xs ${tagFilter === tag ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`} onClick={() => setTagFilter(tagFilter === tag ? null : tag)}>{tag}</button>
            ))}
            <button className="text-xs underline text-muted-foreground ml-2" onClick={() => setTagFilter(null)}>Clear</button>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-sm">Status:</span>
            {allStatuses.map(status => (
              <button key={status} className={`px-2 py-1 rounded text-xs capitalize ${statusFilter === status ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`} onClick={() => setStatusFilter(statusFilter === status ? null : status)}>{status}</button>
            ))}
            <button className="text-xs underline text-muted-foreground ml-2" onClick={() => setStatusFilter(null)}>Clear</button>
          </div>
        </div>
        {/* Architecture Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {filtered.map((architecture, i) => (
            <Card key={i} className="overflow-hidden hover-card-trigger border" style={{ borderColor: architecture.color || undefined }}>
              <CardContent className="p-6">
                <div className="text-center mb-4 flex flex-col items-center gap-2">
                  <Icon name={architecture.icon} color={architecture.color} size={32} />
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold mb-0">{architecture.name}</h3>
                    {architecture.status && <Badge variant="outline" className="capitalize ml-2">{architecture.status}</Badge>}
                  </div>
                </div>
                <p className="text-muted-foreground mb-2">{architecture.description}</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(architecture.tags || []).map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                </div>
                {architecture.riskScore !== undefined && <div className="flex items-center gap-2 mb-2"><span className="text-xs">Risk:</span><Progress value={architecture.riskScore * 10} className="w-16" /><span className="text-xs font-bold">{architecture.riskScore}</span></div>}
                <div className="text-xs text-muted-foreground mb-1">Version: {architecture.version || "-"} | Last Updated: {architecture.lastUpdated || "-"}</div>
                <Link to={`/architectures/${architecture.id}`} className="inline-block w-full mt-2">
                  <Button variant="outline" className="w-full">
                    Explore
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link to="/architectures">
            <Button size="lg">
              View All Architectures
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ArchitectureSection;

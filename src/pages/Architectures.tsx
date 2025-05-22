import Header from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { architecturesData, Architecture } from "../components/components/architecturesData";
import FeatureComparisonMatrix from "../components/home/FeatureComparisonMatrix";
import SidebarNav from "../components/layout/SidebarNav";
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Icon } from "@/components/ui/icon";

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
      <Header />
      <section className="py-16 bg-secondary/50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col lg:flex-row gap-8">
            <SidebarNav type="architectures" />
            <div className="flex-1">
              {/* Filter Controls */}
              <div className="flex flex-wrap gap-4 mb-8 items-center">
                <div>
                  <span className="mr-2 text-sm">Tag:</span>
                  <select value={tagFilter || ""} onChange={e => setTagFilter(e.target.value || null)} className="border rounded px-2 py-1">
                    <option value="">All</option>
                    {allTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
                  </select>
                </div>
                <div>
                  <span className="mr-2 text-sm">Status:</span>
                  <select value={statusFilter || ""} onChange={e => setStatusFilter(e.target.value || null)} className="border rounded px-2 py-1">
                    <option value="">All</option>
                    {allStatuses.map(status => <option key={status} value={status}>{status}</option>)}
                  </select>
                </div>
                <div>
                  <span className="mr-2 text-sm">Risk:</span>
                  <select value={riskFilter || ""} onChange={e => setRiskFilter(e.target.value ? Number(e.target.value) : null)} className="border rounded px-2 py-1">
                    <option value="">All</option>
                    {[...new Set(architectures.map(a => a.riskScore).filter(Boolean))].map(risk => <option key={risk} value={risk}>{risk}</option>)}
                  </select>
                </div>
                <div>
                  <span className="mr-2 text-sm">Sort by:</span>
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="border rounded px-2 py-1">
                    <option value="displayOrder">Order</option>
                    <option value="risk">Risk</option>
                    <option value="name">Name</option>
                  </select>
                </div>
                <button className="ml-auto text-xs underline text-muted-foreground" onClick={() => { setTagFilter(null); setStatusFilter(null); setRiskFilter(null); setSortBy("displayOrder"); }}>Reset Filters</button>
              </div>
              {/* Architectures Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-0">
                {sorted.map((arch) => (
                  <Link to={`/architectures/${arch.id}`} key={arch.id}>
                    <Card className="h-full border border-architecture/20 hover:shadow-lg transition-shadow" style={{ borderColor: arch.color || undefined }}>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-2">
                          {arch.icon && <Icon name={arch.icon} color={arch.color} size={24} />}
                          <h3 className="text-xl font-bold">{arch.name}</h3>
                          {arch.status && <Badge variant="outline" className="capitalize ml-2">{arch.status}</Badge>}
                        </div>
                        <p className="text-muted-foreground mb-2">{arch.description}</p>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {(arch.tags || []).map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                        </div>
                        {arch.riskScore !== undefined && <div className="flex items-center gap-2 mb-2"><span className="text-xs">Risk:</span><Progress value={arch.riskScore * 10} className="w-16" /><span className="text-xs font-bold">{arch.riskScore}</span></div>}
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
        </div>
      </section>
    </>
  );
};

export default Architectures; 
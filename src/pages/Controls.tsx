import Header from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { mitigationsData, Mitigation } from "../components/components/securityData";
import SidebarNav from "../components/layout/SidebarNav";
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Icon } from "@/components/ui/icon";

export const Controls = () => {
  const controls: Mitigation[] = Object.values(mitigationsData);
  // Collect all tags and statuses
  const allTags = Array.from(new Set(controls.flatMap(c => c.tags || [])));
  const allStatuses = Array.from(new Set(controls.map(c => c.status).filter(Boolean)));
  // Filter/sort state
  const [tagFilter, setTagFilter] = useState<string|null>(null);
  const [statusFilter, setStatusFilter] = useState<string|null>(null);
  const [sortBy, setSortBy] = useState<string>("displayOrder");
  // Filtering
  const filteredControls = useMemo(() => {
    return controls.filter(c =>
      (!tagFilter || (c.tags || []).includes(tagFilter)) &&
      (!statusFilter || c.status === statusFilter)
    );
  }, [controls, tagFilter, statusFilter]);
  // Sorting
  const sortedControls = useMemo(() => {
    return [...filteredControls].sort((a, b) => {
      if (sortBy === "risk") return (b.riskScore || 0) - (a.riskScore || 0);
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "displayOrder") return (a.displayOrder || 999) - (b.displayOrder || 999);
      return 0;
    });
  }, [filteredControls, sortBy]);
  // Analytics
  const statusCounts = useMemo(() => {
    const counts = {};
    for (const c of controls) counts[c.status || "unknown"] = (counts[c.status || "unknown"] || 0) + 1;
    return counts;
  }, [controls]);
  const avgRisk = useMemo(() => {
    const risks = controls.map(c => c.riskScore).filter(x => typeof x === "number");
    return risks.length ? (risks.reduce((a, b) => a + (b || 0), 0) / risks.length).toFixed(1) : "-";
  }, [controls]);
  const tagCloud = useMemo(() => {
    const tagMap = {};
    for (const c of controls) for (const tag of c.tags || []) tagMap[tag] = (tagMap[tag] || 0) + 1;
    return tagMap;
  }, [controls]);

  return (
    <>
      <Header />
      <section className="py-16 bg-secondary/50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col lg:flex-row gap-8">
            <SidebarNav type="controls" />
            <div className="flex-1">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2 max-w-3xl">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Security Controls & Mitigations</h2>
                  <p className="text-muted-foreground md:text-xl">
                    Explore security controls and mitigations for agentic systems
                  </p>
                </div>
              </div>
              {/* Analytics widgets */}
              {/* (Removed analytics widgets bar) */}
              {/* Controls grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                {sortedControls.map((control) => (
                  <Link to={`/controls/${control.id}`} key={control.id}>
                    <Card className="h-full border border-control/20 hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center mb-2 gap-2">
                          {control.icon && <Icon name={control.icon} color={control.color} size={28} />}
                          <h3 className="text-xl font-bold" style={{ color: control.color }}>{control.name}</h3>
                          {control.status && <Badge variant="outline" className="capitalize ml-2">{control.status}</Badge>}
                        </div>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {(control.tags || []).map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                        </div>
                        <div className="text-xs text-muted-foreground mb-1">Version: {control.version || "-"} | Last Updated: {control.lastUpdated || "-"} | Updated By: {control.updatedBy || "-"}</div>
                        {control.references && control.references.length > 0 && <div className="text-xs mt-1">{control.references.map(ref => <a key={ref.url} href={ref.url} target="_blank" rel="noopener noreferrer" className="underline text-blue-600 mr-2">{ref.title}</a>)}</div>}
                        <p className="text-muted-foreground mt-4">{control.description}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Controls; 
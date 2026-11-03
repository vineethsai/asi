import PageLayout from "@/components/layout/PageLayout";
import { threatModelerPathFor } from "@/config/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { architecturesData, Architecture } from "../components/components/architecturesData";
import { getComponentTitle } from "../components/components/componentDataMap";
import FeatureComparisonMatrix from "../components/home/FeatureComparisonMatrix";
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Search, Crosshair, ShieldAlert, Shield, Layers } from "lucide-react";

const Architectures = () => {
  const architectures: Architecture[] = Object.values(architecturesData);
  const [searchTerm, setSearchTerm] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("displayOrder");

  const allTags = useMemo(
    () => Array.from(new Set(architectures.flatMap((a) => a.tags || []))),
    [architectures],
  );

  const filtered = useMemo(() => {
    return architectures.filter((a) => {
      const matchesSearch =
        searchTerm === "" ||
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.tags || []).some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesTag = !tagFilter || (a.tags || []).includes(tagFilter);
      return matchesSearch && matchesTag;
    });
  }, [architectures, searchTerm, tagFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "threats") return (b.threatIds?.length || 0) - (a.threatIds?.length || 0);
      return (a.displayOrder || 0) - (b.displayOrder || 0);
    });
  }, [filtered, sortBy]);

  // Summary statistics
  const totalThreats = useMemo(
    () => new Set(architectures.flatMap((a) => a.threatIds || [])).size,
    [architectures],
  );
  const totalMitigations = useMemo(
    () => new Set(architectures.flatMap((a) => a.mitigationIds || [])).size,
    [architectures],
  );

  return (
    <PageLayout
      title="Agent Architectures"
      description="Guide to agentic architecture patterns and their security implications: secure design patterns, architectural best practices and the threats each pattern exposes."
      canonicalPath="/architectures"
      keywords="agent architectures, AI security patterns, agentic architectures, secure AI development, AI agent design, agent security, AI security architecture, LLM architectures, artificial intelligence patterns, secure agent development, AI system design"
    >
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">AI Agent Architectures</h1>
          <p className="mt-1 text-muted-foreground">
            Comprehensive guide to agent architectures and AI security patterns for agentic systems.
            Explore secure design patterns, architectural best practices, and security implications
            for AI agents.
          </p>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
            <div className="rounded-md bg-primary/10 p-2">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{architectures.length}</p>
              <p className="text-xs text-muted-foreground">Architectures</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
            <div className="rounded-md bg-destructive/10 p-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalThreats}</p>
              <p className="text-xs text-muted-foreground">Unique Threats</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
            <div className="rounded-md bg-green-500/10 p-2">
              <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalMitigations}</p>
              <p className="text-xs text-muted-foreground">Unique Mitigations</p>
            </div>
          </div>
        </div>

        {/* Search, Filter, Sort Controls */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search architectures..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Tag</label>
            <Select
              value={tagFilter || "all"}
              onValueChange={(val) => setTagFilter(val === "all" ? null : val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Tags" />
              </SelectTrigger>
              <SelectContent className="z-[9999] bg-popover border shadow-lg">
                <SelectItem value="all">All Tags</SelectItem>
                {allTags.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Sort By</label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent className="z-[9999] bg-popover border shadow-lg">
                <SelectItem value="displayOrder">Default Order</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="threats">Threats (High to Low)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Architectures Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-0">
          {sorted.map((arch) => (
            <Card
              key={arch.id}
              className="h-full bg-card hover:bg-muted/50 transition-colors overflow-hidden"
              style={{ borderLeft: `4px solid ${arch.color || "var(--border)"}` }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Link
                    to={`/architectures/${arch.id}`}
                    className="flex items-center gap-2 min-w-0"
                  >
                    {arch.icon && (
                      <span className="text-muted-foreground shrink-0">
                        <Icon name={arch.icon} color="currentColor" size={24} />
                      </span>
                    )}
                    <h3 className="text-xl font-bold text-foreground hover:text-primary transition-colors">
                      {arch.name}
                    </h3>
                  </Link>
                  {arch.status && (
                    <Badge variant="outline" className="capitalize shrink-0">
                      {arch.status}
                    </Badge>
                  )}
                </div>

                <Link to={`/architectures/${arch.id}`}>
                  <p className="text-muted-foreground mb-3">{arch.description}</p>
                </Link>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {(arch.tags || []).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Threat & Mitigation Counts */}
                <div className="flex gap-4 mb-3 text-sm">
                  <div className="flex items-center gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5 text-destructive" />
                    <span className="text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {arch.threatIds?.length || 0}
                      </span>{" "}
                      threats
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                    <span className="text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {arch.mitigationIds?.length || 0}
                      </span>{" "}
                      mitigations
                    </span>
                  </div>
                </div>

                {/* Key Components - human-readable names */}
                <div className="text-sm mb-3">
                  <span className="font-medium">Key Components: </span>
                  <span className="text-muted-foreground">
                    {arch.keyComponents.map((id) => getComponentTitle(id)).join(", ")}
                  </span>
                </div>

                {/* Footer: version, date, references, Threat Modeler CTA */}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Version: {arch.version || "-"} | Last Updated: {arch.lastUpdated || "-"}
                    </div>
                    {arch.references && arch.references.length > 0 && (
                      <div className="text-xs mt-1">
                        {arch.references.map((ref) => (
                          <a
                            key={ref.url}
                            href={ref.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline text-primary mr-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {ref.title}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  <Link
                    to={threatModelerPathFor(arch.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 border border-primary/30 rounded-md px-2.5 py-1.5 hover:bg-primary/5 transition-colors shrink-0 ml-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Crosshair className="h-3 w-3" />
                    Threat Modeler
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Results */}
        {sorted.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No architectures match your search criteria. Try adjusting your filters.
          </div>
        )}

        <div className="mt-16">
          <FeatureComparisonMatrix />
        </div>
      </div>
    </PageLayout>
  );
};

export default Architectures;

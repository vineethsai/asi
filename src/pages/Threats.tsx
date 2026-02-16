import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { threatsData, Threat, mitigationsData } from "../components/components/securityData";
import SidebarNav from "../components/layout/SidebarNav";
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Helmet } from "react-helmet";

import { Search, AlertTriangle, ArrowRight } from "lucide-react";

function getFrameworkBadges(threat: Threat) {
  const badges: { label: string; color: string }[] = [];

  if (threat.asiMapping && threat.asiMapping.length > 0) {
    badges.push({
      label: `ASI (${threat.asiMapping.length})`,
      color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    });
  }

  if (threat.ciscoMapping && threat.ciscoMapping.length > 0) {
    badges.push({
      label: `Cisco (${threat.ciscoMapping.length})`,
      color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
    });
  }

  return badges;
}

export const Threats = () => {
  const threats: Threat[] = Object.values(threatsData);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const allTags = Array.from(new Set(threats.flatMap((t) => t.tags || [])));

  const [searchTerm, setSearchTerm] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("displayOrder");

  const filteredThreats = useMemo(() => {
    return threats.filter((t) => {
      const matchesSearch =
        searchTerm === "" ||
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.tags || []).some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesTag = !tagFilter || (t.tags || []).includes(tagFilter);
      return matchesSearch && matchesTag;
    });
  }, [threats, searchTerm, tagFilter]);

  const sortedThreats = useMemo(() => {
    return [...filteredThreats].sort((a, b) => {
      if (sortBy === "risk") return (b.riskScore || 0) - (a.riskScore || 0);
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "displayOrder") return (a.displayOrder || 999) - (b.displayOrder || 999);
      return 0;
    });
  }, [filteredThreats, sortBy]);

  const handleMobileMenuToggle = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const handleMobileMenuClose = () => setIsMobileMenuOpen(false);

  function getMitigationCount(threat: Threat) {
    return Object.values(mitigationsData).filter((m) => m.threatIds.includes(threat.id)).length;
  }

  function getRiskColor(score: number) {
    if (score >= 8) return "text-red-600 dark:text-red-400";
    if (score >= 6) return "text-orange-600 dark:text-orange-400";
    if (score >= 4) return "text-yellow-600 dark:text-yellow-400";
    return "text-green-600 dark:text-green-400";
  }

  return (
    <>
      <Helmet>
        <title>AI Agent Threats & Security Risks | AI Security Threat Analysis</title>
        <meta
          name="description"
          content="Comprehensive analysis of AI agent threats and security risks for agentic systems. Learn about prompt injection, memory poisoning, and other critical threats to AI agents and LLM applications with mitigation strategies."
        />
        <meta
          name="keywords"
          content="AI agent threats, AI security risks, agent security threats, agentic threats, prompt injection, memory poisoning, AI risks, LLM security threats, artificial intelligence threats, AI agent vulnerabilities, secure AI development"
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://agenticsecurity.info/threats" />
        <meta property="og:url" content="https://agenticsecurity.info/threats" />
        <meta name="twitter:url" content="https://agenticsecurity.info/threats" />
      </Helmet>

      <Header onMobileMenuToggle={handleMobileMenuToggle} isMobileMenuOpen={isMobileMenuOpen} />

      <SidebarNav type="threats" isOpen={isMobileMenuOpen} onClose={handleMobileMenuClose} />

      <section id="main-content" className="py-16 bg-background min-h-screen">
        <div className="container px-4 md:px-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="space-y-2 max-w-4xl">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Threat Landscape
                </h1>
                <p className="text-muted-foreground md:text-xl">
                  Explore the key threats to agentic AI systems, their attack vectors, and available
                  mitigations
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search threats..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
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

              <div className="space-y-2">
                <label className="text-sm font-medium">Sort By</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent className="z-[9999] bg-popover border shadow-lg">
                    <SelectItem value="displayOrder">Default Order</SelectItem>
                    <SelectItem value="risk">Risk Score (High to Low)</SelectItem>
                    <SelectItem value="name">Name (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">
                Showing {sortedThreats.length} of {threats.length} threats
              </p>
            </div>

            {/* Threats grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {sortedThreats.map((threat) => {
                const mitCount = getMitigationCount(threat);
                return (
                  <Link to={`/threats/${threat.id}`} key={threat.id}>
                    <Card className="h-full border hover:bg-muted/50 transition-colors">
                      <CardContent className="p-6">
                        {/* Header row */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {threat.icon && (
                              <Icon name={threat.icon} color={threat.color} size={28} />
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs bg-threat/10 text-threat px-2 py-0.5 rounded font-semibold">
                                  {threat.code}
                                </span>
                              </div>
                              <h3
                                className="text-lg font-bold mt-1"
                                style={{ color: threat.color }}
                              >
                                {threat.name}
                              </h3>
                            </div>
                          </div>
                          {threat.riskScore != null && (
                            <div className="text-right flex-shrink-0">
                              <div
                                className={`text-xl font-bold ${getRiskColor(threat.riskScore)}`}
                              >
                                {threat.riskScore}
                              </div>
                              <div className="text-[10px] text-muted-foreground">Risk</div>
                            </div>
                          )}
                        </div>

                        {/* Mitigations + Vectors */}
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="outline" className="text-xs">
                            {mitCount} mitigation{mitCount !== 1 ? "s" : ""}
                          </Badge>
                          {(threat.attackVectors || []).length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {threat.attackVectors!.length} vector
                              {threat.attackVectors!.length !== 1 ? "s" : ""}
                            </Badge>
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-3 leading-relaxed">
                          {threat.description}
                        </p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {(threat.tags || []).slice(0, 4).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {(threat.tags || []).length > 4 && (
                            <Badge variant="secondary" className="text-xs">
                              +{(threat.tags || []).length - 4}
                            </Badge>
                          )}
                        </div>

                        {/* Framework badges */}
                        <div className="flex flex-wrap gap-1.5 pt-3 border-t">
                          {getFrameworkBadges(threat).map((b) => (
                            <span
                              key={b.label}
                              className={`inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full ${b.color}`}
                            >
                              {b.label}
                            </span>
                          ))}
                          <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                            View details <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>

            {sortedThreats.length === 0 && (
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No threats match your filters</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default Threats;

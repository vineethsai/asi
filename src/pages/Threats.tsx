import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { threatsData, Threat, mitigationsData } from "../components/components/securityData";
import { frameworkData, ComponentNode } from "../components/components/frameworkData";
import SidebarNav from "../components/layout/SidebarNav";
import { useState, useMemo, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Helmet } from "react-helmet";

import {
  Search,
  AlertTriangle,
  ArrowRight,
  Filter,
  BookOpen,
  Crosshair,
  Layers,
  ShieldCheck,
} from "lucide-react";

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

function getRiskColor(score: number) {
  if (score >= 8) return "text-red-600 dark:text-red-400";
  if (score >= 6) return "text-orange-600 dark:text-orange-400";
  if (score >= 4) return "text-yellow-600 dark:text-yellow-400";
  return "text-green-600 dark:text-green-400";
}

function flattenComponents(nodes: ComponentNode[]): ComponentNode[] {
  const result: ComponentNode[] = [];
  for (const node of nodes) {
    result.push(node);
    if (node.children) {
      result.push(...flattenComponents(node.children));
    }
  }
  return result;
}

export const Threats = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const threats: Threat[] = Object.values(threatsData);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const allTags = Array.from(new Set(threats.flatMap((t) => t.tags || [])));

  const [searchTerm, setSearchTerm] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [frameworkFilter, setFrameworkFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("displayOrder");
  const [activeTab, setActiveTab] = useState("threat-catalog");

  // URL hash navigation
  useEffect(() => {
    const hash = location.hash.replace("#", "");
    const validTabs = ["threat-catalog", "threat-matrix"];
    if (hash && validTabs.includes(hash)) {
      setActiveTab(hash);
    } else if (!hash) {
      setActiveTab("threat-catalog");
    }
  }, [location.hash]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`${location.pathname}#${value}`, { replace: true });
  };

  const filteredThreats = useMemo(() => {
    return threats.filter((t) => {
      const matchesSearch =
        searchTerm === "" ||
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.tags || []).some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesTag = !tagFilter || (t.tags || []).includes(tagFilter);
      const matchesFramework =
        frameworkFilter === "all" ||
        (frameworkFilter === "asi" && (t.asiMapping || []).length > 0) ||
        (frameworkFilter === "cisco" && (t.ciscoMapping || []).length > 0);
      return matchesSearch && matchesTag && matchesFramework;
    });
  }, [threats, searchTerm, tagFilter, frameworkFilter]);

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

  // Analytics
  const analytics = useMemo(() => {
    const totalThreats = threats.length;
    const totalAttackVectors = threats.reduce((sum, t) => sum + (t.attackVectors || []).length, 0);
    const uniqueMitigationIds = new Set(
      threats.flatMap((t) =>
        Object.values(mitigationsData)
          .filter((m) => m.threatIds.includes(t.id))
          .map((m) => m.id),
      ),
    );
    return {
      totalThreats,
      totalAttackVectors,
      totalMitigations: uniqueMitigationIds.size,
    };
  }, [threats]);

  // Components for the matrix
  const allComponents = useMemo(() => {
    return flattenComponents(frameworkData).filter((c) => c.threatIds && c.threatIds.length > 0);
  }, []);

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

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://agenticsecurity.info/threats" />
        <meta
          property="og:title"
          content="AI Agent Threats & Security Risks | AI Security Threat Analysis"
        />
        <meta
          property="og:description"
          content="Comprehensive analysis of AI agent threats and security risks for agentic systems. Explore prompt injection, memory poisoning, and other critical threats with mitigation strategies."
        />
        <meta property="og:image" content="https://agenticsecurity.info/og-threats.png" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://agenticsecurity.info/threats" />
        <meta
          property="twitter:title"
          content="AI Agent Threats & Security Risks | AI Security Threat Analysis"
        />
        <meta
          property="twitter:description"
          content="Comprehensive analysis of AI agent threats and security risks for agentic systems. Explore prompt injection, memory poisoning, and other critical threats with mitigation strategies."
        />
        <meta property="twitter:image" content="https://agenticsecurity.info/og-threats.png" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "AI Agent Threats & Security Risks",
            description:
              "Comprehensive analysis of AI agent threats and security risks for agentic systems",
            url: "https://agenticsecurity.info/threats",
            isPartOf: {
              "@type": "WebSite",
              name: "OWASP Securing Agentic Applications Guide",
              url: "https://agenticsecurity.info",
            },
            about: [
              {
                "@type": "Thing",
                name: "AI Security Threats",
                description:
                  "Security threats targeting artificial intelligence and agentic systems",
              },
              {
                "@type": "Thing",
                name: "Threat Modeling",
                description: "Analysis and categorization of AI agent security threats",
              },
            ],
          })}
        </script>
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

            {/* Analytics Dashboard */}
            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground mb-6">
              <span>
                <strong className="text-foreground">{analytics.totalThreats}</strong> Total Threats
              </span>
              <span>
                <strong className="text-foreground">{analytics.totalAttackVectors}</strong> Attack
                Vectors
              </span>
              <span>
                <strong className="text-foreground">{analytics.totalMitigations}</strong>{" "}
                Mitigations
              </span>
            </div>

            {/* Filters */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters & Search
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    <label className="text-sm font-medium">Framework</label>
                    <Select value={frameworkFilter} onValueChange={setFrameworkFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Frameworks" />
                      </SelectTrigger>
                      <SelectContent className="z-[9999] bg-popover border shadow-lg">
                        <SelectItem value="all">All Frameworks</SelectItem>
                        <SelectItem value="asi">ASI Mapped</SelectItem>
                        <SelectItem value="cisco">Cisco Mapped</SelectItem>
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
              </CardContent>
            </Card>

            {/* Quick Navigation */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Quick Navigation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Link
                    to="/threats#threat-catalog"
                    className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    onClick={() => handleTabChange("threat-catalog")}
                  >
                    <Crosshair className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Threat Catalog</span>
                  </Link>
                  <Link
                    to="/threats#threat-matrix"
                    className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    onClick={() => handleTabChange("threat-matrix")}
                  >
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Threat-Component Matrix</span>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="threat-catalog">
                  Threat Catalog ({sortedThreats.length})
                </TabsTrigger>
                <TabsTrigger value="threat-matrix">Threat-Component Matrix</TabsTrigger>
              </TabsList>

              {/* ===== Threat Catalog Tab ===== */}
              <TabsContent value="threat-catalog" className="mt-6">
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
                    const cia = threat.impactAnalysis;
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

                            {/* CIA Impact + Mitigations + Vectors */}
                            <div className="flex items-center gap-2 mb-3 flex-wrap">
                              {cia && (
                                <div className="flex items-center gap-1 mr-1">
                                  <span
                                    className={`inline-flex items-center justify-center w-5 h-5 rounded text-[9px] font-bold ${cia.confidentiality ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" : "bg-muted text-muted-foreground/50"}`}
                                    title={`Confidentiality: ${cia.confidentiality ? "Impacted" : "Not impacted"}`}
                                  >
                                    C
                                  </span>
                                  <span
                                    className={`inline-flex items-center justify-center w-5 h-5 rounded text-[9px] font-bold ${cia.integrity ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" : "bg-muted text-muted-foreground/50"}`}
                                    title={`Integrity: ${cia.integrity ? "Impacted" : "Not impacted"}`}
                                  >
                                    I
                                  </span>
                                  <span
                                    className={`inline-flex items-center justify-center w-5 h-5 rounded text-[9px] font-bold ${cia.availability ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300" : "bg-muted text-muted-foreground/50"}`}
                                    title={`Availability: ${cia.availability ? "Impacted" : "Not impacted"}`}
                                  >
                                    A
                                  </span>
                                </div>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {mitCount} mitigation{mitCount !== 1 ? "s" : ""}
                              </Badge>
                              {(threat.attackVectors || []).length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {threat.attackVectors!.length} vector
                                  {threat.attackVectors!.length !== 1 ? "s" : ""}
                                </Badge>
                              )}
                              {threat.componentIds && threat.componentIds.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  {threat.componentIds.length} component
                                  {threat.componentIds.length !== 1 ? "s" : ""}
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
              </TabsContent>

              {/* ===== Threat-Component Matrix Tab ===== */}
              <TabsContent value="threat-matrix" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Layers className="h-5 w-5" />
                      Threat-Component Matrix
                    </CardTitle>
                    <CardDescription>
                      Cross-reference of threats and the components they affect, with risk
                      indicators and mitigation coverage
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-3 font-semibold text-muted-foreground sticky left-0 bg-background z-10 min-w-[180px]">
                              Threat
                            </th>
                            <th className="text-center py-3 px-2 font-semibold text-muted-foreground min-w-[50px]">
                              Risk
                            </th>
                            {allComponents.slice(0, 8).map((comp) => (
                              <th
                                key={comp.id}
                                className="text-center py-3 px-2 font-semibold text-muted-foreground min-w-[100px]"
                              >
                                <span className="text-xs">{comp.title}</span>
                              </th>
                            ))}
                            <th className="text-center py-3 px-2 font-semibold text-muted-foreground min-w-[80px]">
                              Mitigations
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {threats.map((threat) => {
                            const mitCount = getMitigationCount(threat);
                            return (
                              <tr
                                key={threat.id}
                                className="border-b hover:bg-muted/30 transition-colors"
                              >
                                <td className="py-3 px-3 sticky left-0 bg-background z-10">
                                  <Link
                                    to={`/threats/${threat.id}`}
                                    className="flex items-center gap-2 hover:underline"
                                  >
                                    <span className="font-mono text-xs bg-threat/10 text-threat px-1.5 py-0.5 rounded">
                                      {threat.code}
                                    </span>
                                    <span
                                      className="font-medium text-xs"
                                      style={{ color: threat.color }}
                                    >
                                      {threat.name}
                                    </span>
                                  </Link>
                                </td>
                                <td className="text-center py-3 px-2">
                                  <span
                                    className={`font-bold text-sm ${getRiskColor(threat.riskScore || 0)}`}
                                  >
                                    {threat.riskScore}
                                  </span>
                                </td>
                                {allComponents.slice(0, 8).map((comp) => {
                                  const isAffected =
                                    threat.componentIds.includes(comp.id) ||
                                    (comp.threatIds || []).includes(threat.id);
                                  return (
                                    <td key={comp.id} className="text-center py-3 px-2">
                                      {isAffected ? (
                                        <span
                                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                            (threat.riskScore || 0) >= 8
                                              ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                                              : (threat.riskScore || 0) >= 6
                                                ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
                                                : (threat.riskScore || 0) >= 4
                                                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300"
                                                  : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                                          }`}
                                          title={`${threat.name} affects ${comp.title}`}
                                        >
                                          !
                                        </span>
                                      ) : (
                                        <span className="text-muted-foreground/30">-</span>
                                      )}
                                    </td>
                                  );
                                })}
                                <td className="text-center py-3 px-2">
                                  <div className="flex items-center justify-center gap-1">
                                    <ShieldCheck className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                                    <span className="text-xs font-medium">{mitCount}</span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Matrix Summary */}
                    <div className="mt-8 p-6 bg-muted/30 rounded-xl">
                      <h3 className="text-lg font-semibold mb-4">Matrix Summary</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary mb-1">
                            {threats.length}
                          </div>
                          <div className="text-sm text-muted-foreground">Total Threats</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary mb-1">
                            {allComponents.slice(0, 8).length}
                          </div>
                          <div className="text-sm text-muted-foreground">Key Components</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary mb-1">
                            {threats.reduce((sum, t) => sum + t.componentIds.length, 0)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Threat-Component Links
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                            {Object.values(mitigationsData).length}
                          </div>
                          <div className="text-sm text-muted-foreground">Total Mitigations</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default Threats;

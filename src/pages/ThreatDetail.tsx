import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  threatsData,
  mitigationsData,
  Threat,
  Mitigation,
} from "../components/components/securityData";
import { frameworkData } from "../components/components/frameworkData";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SidebarNav from "../components/layout/SidebarNav";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Icon } from "@/components/ui/icon";
import { Helmet } from "react-helmet";
import {
  Shield,
  ShieldCheck,
  ShieldX,
  ExternalLink,
  Layers,
  Target,
  Calculator,
  Network,
  ArrowRight,
  Info,
  Crosshair,
  Activity,
  Lock,
  Eye,
  Gauge,
} from "lucide-react";
import { agenticTop10Data } from "@/components/components/owaspAgenticTop10Data";
import { ciscoTaxonomyData } from "@/components/components/ciscoTaxonomyData";
import { coreRiskScores, getSeverityColor } from "@/components/components/aivssCalcData";

const componentIdToName: Record<string, string> = Object.fromEntries(
  frameworkData.map((c) => [c.id, c.title]),
);

/* ─── Radial Constellation Visualization ─── */
function ThreatConstellationDiagram({
  threat,
  mappings,
}: {
  threat: Threat;
  mappings: {
    allAsi: { id: string; code: string; name: string }[];
    ciscoEntries: { code: string; description: string }[];
    atlasMatches: unknown[];
    aivssMatches: {
      rank: number;
      name: string;
      severity: string;
      asiCode: string;
      aivssScore: number;
    }[];
  };
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const navigate = useNavigate();

  const cx = 300,
    cy = 195,
    outerR = 145;

  const FCOLORS: Record<string, string> = {
    asi: "#f43f5e",
    cisco: "#06b6d4",
    aivss: "#f59e0b",
  };

  const FLABELS: Record<string, string> = {
    asi: "OWASP Agentic",
    cisco: "Cisco Taxonomy",
    aivss: "AIVSS Scores",
  };

  const nodes = useMemo(() => {
    const result: Array<{
      id: string;
      code: string;
      label: string;
      framework: string;
      link: string;
      x: number;
      y: number;
    }> = [];

    const sectors = [
      {
        key: "asi",
        center: -Math.PI / 2,
        items: mappings.allAsi.map((e) => ({
          code: e.code,
          label: `${e.code}: ${e.name}`,
          link: "/taxonomy?tab=owasp-agentic",
        })),
      },
      {
        key: "cisco",
        center: Math.PI / 6,
        items: mappings.ciscoEntries.map((e) => ({
          code: e.code,
          label: `${e.code}: ${e.description}`,
          link: "/taxonomy?tab=cisco",
        })),
      },
      {
        key: "aivss",
        center: (5 * Math.PI) / 6,
        items: mappings.aivssMatches.map((e) => ({
          code: `#${e.rank}`,
          label: `#${e.rank} ${e.name} (${e.severity})`,
          link: "/taxonomy?tab=aivss",
        })),
      },
    ];

    const arcSpan = (2 * Math.PI) / 3;
    const padding = 0.12;

    for (const sector of sectors) {
      const n = sector.items.length;
      if (n === 0) continue;
      const start = sector.center - arcSpan / 2 + arcSpan * padding;
      const end = sector.center + arcSpan / 2 - arcSpan * padding;
      for (let i = 0; i < n; i++) {
        const t = n === 1 ? 0.5 : i / (n - 1);
        const angle = start + t * (end - start);
        result.push({
          id: `${sector.key}-${i}`,
          code: sector.items[i].code,
          label: sector.items[i].label,
          framework: sector.key,
          link: sector.items[i].link,
          x: cx + outerR * Math.cos(angle),
          y: cy + outerR * Math.sin(angle),
        });
      }
    }
    return result;
  }, [mappings]);

  if (nodes.length === 0) return null;

  return (
    <div className="mb-4">
      <svg viewBox="0 0 600 390" className="w-full" style={{ maxHeight: 340 }}>
        <defs>
          <filter id="cGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Framework arc labels */}
        {(["asi", "cisco", "aivss"] as const).map((key) => {
          const centerAngle = {
            asi: -Math.PI / 2,
            cisco: Math.PI / 6,
            aivss: (5 * Math.PI) / 6,
          }[key];
          const lx = cx + (outerR + 28) * Math.cos(centerAngle);
          const ly = cy + (outerR + 28) * Math.sin(centerAngle);
          if (!nodes.some((n) => n.framework === key)) return null;
          return (
            <text
              key={key}
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={FCOLORS[key]}
              fontSize="10"
              fontWeight="600"
              opacity={0.7}
            >
              {FLABELS[key]}
            </text>
          );
        })}

        {/* Connection paths (curved bezier) */}
        {nodes.map((node) => {
          const dx = node.x - cx;
          const dy = node.y - cy;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const perpX = (-dy / len) * 12;
          const perpY = (dx / len) * 12;
          const midX = (cx + node.x) / 2 + perpX;
          const midY = (cy + node.y) / 2 + perpY;
          const isActive = hoveredId === node.id;
          const isDim = hoveredId !== null && !isActive;
          return (
            <path
              key={`p-${node.id}`}
              d={`M ${cx} ${cy} Q ${midX} ${midY} ${node.x} ${node.y}`}
              fill="none"
              stroke={FCOLORS[node.framework]}
              strokeWidth={isActive ? 3 : 1.5}
              strokeOpacity={isDim ? 0.08 : isActive ? 0.9 : 0.3}
              strokeDasharray={isActive ? "none" : "4 3"}
              className="transition-all duration-200"
            />
          );
        })}

        {/* Center threat node */}
        <circle cx={cx} cy={cy} r={32} fill={threat.color || "#6366f1"} filter="url(#cGlow)" />
        <circle
          cx={cx}
          cy={cy}
          r={34}
          fill="none"
          stroke={threat.color || "#6366f1"}
          strokeWidth={2}
          strokeOpacity={0.4}
        />
        <text
          x={cx}
          y={cy - 5}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize="11"
          fontWeight="700"
          className="pointer-events-none"
        >
          {threat.code}
        </text>
        <text
          x={cx}
          y={cy + 8}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize="7"
          fontWeight="500"
          opacity={0.85}
          className="pointer-events-none"
        >
          {threat.name.length > 20 ? threat.name.substring(0, 18) + "\u2026" : threat.name}
        </text>

        {/* Outer framework nodes */}
        {nodes.map((node) => {
          const isActive = hoveredId === node.id;
          const isDim = hoveredId !== null && !isActive;
          const r = isActive ? 24 : 20;
          return (
            <g
              key={node.id}
              onMouseEnter={() => setHoveredId(node.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => navigate(node.link)}
              style={{ cursor: "pointer" }}
            >
              <circle
                cx={node.x}
                cy={node.y}
                r={r}
                fill={FCOLORS[node.framework]}
                opacity={isDim ? 0.15 : isActive ? 1 : 0.85}
                className="transition-all duration-200"
              />
              {isActive && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={r + 3}
                  fill="none"
                  stroke={FCOLORS[node.framework]}
                  strokeWidth={2}
                  strokeOpacity={0.5}
                />
              )}
              <text
                x={node.x}
                y={node.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize="8"
                fontWeight="600"
                opacity={isDim ? 0.15 : 1}
                className="pointer-events-none transition-opacity duration-200"
              >
                {node.code.length > 10 ? node.code.substring(0, 8) + ".." : node.code}
              </text>
              {isActive && (
                <g>
                  <rect
                    x={node.x - 85}
                    y={node.y + r + 4}
                    width={170}
                    height={20}
                    rx={4}
                    fill="hsl(var(--card))"
                    stroke="hsl(var(--border))"
                    strokeWidth={1}
                  />
                  <text
                    x={node.x}
                    y={node.y + r + 15}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="hsl(var(--foreground))"
                    fontSize="8"
                    fontWeight="500"
                    className="pointer-events-none"
                  >
                    {node.label.length > 42 ? node.label.substring(0, 40) + "\u2026" : node.label}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export const ThreatDetail = () => {
  const { threatId } = useParams<{ threatId: string }>();
  const threat: Threat | undefined = threatId ? threatsData[threatId] : undefined;
  const mitigations: Mitigation[] = threat
    ? Object.values(mitigationsData).filter((m) => m.threatIds.includes(threat.id))
    : [];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const handleMobileMenuToggle = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const handleMobileMenuClose = () => setIsMobileMenuOpen(false);

  const frameworkMappings = useMemo(() => {
    if (!threat) return null;

    const asiCodes = threat.asiMapping || [];
    const directAsi = agenticTop10Data.filter((e) => asiCodes.includes(e.code));
    const reverseAsi = agenticTop10Data.filter(
      (e) => e.relatedThreats.includes(threat.id) && !asiCodes.includes(e.code),
    );
    const allAsi = [...directAsi, ...reverseAsi];

    const ciscoCodes = threat.ciscoMapping || [];
    const ciscoEntries = ciscoTaxonomyData.filter((og) => ciscoCodes.includes(og.code));

    const aivssMatches = coreRiskScores.filter((r) => asiCodes.includes(r.asiCode));

    return { allAsi, ciscoEntries, atlasMatches: [] as unknown[], aivssMatches };
  }, [threat]);

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

  const mitigationCount = mitigations.length;
  const attackVectorCount = (threat.attackVectors || []).length;
  const riskScore = threat.riskScore || 0;

  const frameworkCount = frameworkMappings
    ? frameworkMappings.allAsi.length +
      frameworkMappings.ciscoEntries.length +
      frameworkMappings.aivssMatches.length
    : 0;

  function getRiskColor(score: number) {
    if (score >= 8) return "text-red-600 dark:text-red-400";
    if (score >= 6) return "text-orange-600 dark:text-orange-400";
    if (score >= 4) return "text-yellow-600 dark:text-yellow-400";
    return "text-green-600 dark:text-green-400";
  }

  function getSeverityBadge(severity: string) {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
      default:
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    }
  }

  return (
    <>
      <Helmet>
        <title>{threat.name} | OWASP Securing Agentic Applications Guide</title>
        <meta
          name="description"
          content={`${threat.description} Learn about this AI security threat, its impact, attack vectors, and available mitigations.`}
        />
        <meta
          name="keywords"
          content={`${threat.name}, AI security threat, OWASP, agentic systems, ${threat.tags?.join(", ") || ""}, AI threats, security vulnerabilities`}
        />
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
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TechArticle",
            headline: threat.name,
            description: threat.description,
            url: `https://agenticsecurity.info/threats/${threat.id}`,
            dateModified: threat.lastUpdated || new Date().toISOString(),
            author: { "@type": "Organization", name: "OWASP" },
            publisher: { "@type": "Organization", name: "OWASP", url: "https://owasp.org" },
            about: "AI Security Threat",
            keywords: threat.tags?.join(", ") || "",
            isPartOf: {
              "@type": "WebSite",
              name: "OWASP Securing Agentic Applications Guide",
              url: "https://agenticsecurity.info",
            },
          })}
        </script>
      </Helmet>

      <Header onMobileMenuToggle={handleMobileMenuToggle} isMobileMenuOpen={isMobileMenuOpen} />

      <SidebarNav
        type="threats"
        activeId={threat.id}
        isOpen={isMobileMenuOpen}
        onClose={handleMobileMenuClose}
      />

      <section id="main-content" className="py-8 bg-background min-h-screen">
        <div className="container px-4 md:px-6 max-w-7xl">
          {/* Breadcrumb */}
          <Link
            to="/threats"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
            Back to Threats
          </Link>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">{threat.name}</h1>
            <p className="mt-1 text-muted-foreground">{threat.description}</p>
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <Card className="bg-card border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Gauge className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Risk Score</span>
                  </div>
                  <div className={`text-3xl font-bold ${getRiskColor(riskScore)}`}>
                    {riskScore || "N/A"}
                    <span className="text-sm font-normal text-muted-foreground"> / 10</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Crosshair className="h-4 w-4 text-yellow-500" />
                    <span className="text-xs text-muted-foreground">Attack Vectors</span>
                  </div>
                  <div className="text-2xl font-bold">{attackVectorCount}</div>
                  <div className="text-xs text-muted-foreground">Documented</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Mitigations</span>
                  </div>
                  <div className="text-2xl font-bold text-control">{mitigationCount}</div>
                  <div className="text-xs text-muted-foreground">Available</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Network className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Framework Refs</span>
                  </div>
                  <div className="text-2xl font-bold">{frameworkCount}</div>
                  <div className="text-xs text-muted-foreground">Mappings</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Tabbed Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="attack-vectors" className="flex items-center gap-2">
                <Crosshair className="h-4 w-4" />
                <span className="hidden sm:inline">Attack Vectors</span>
                {attackVectorCount > 0 && (
                  <Badge variant="secondary" className="text-xs ml-1 hidden md:inline-flex">
                    {attackVectorCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="mitigations" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Mitigations</span>
                {mitigationCount > 0 && (
                  <Badge variant="secondary" className="text-xs ml-1 hidden md:inline-flex">
                    {mitigationCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="frameworks" className="flex items-center gap-2">
                <Network className="h-4 w-4" />
                <span className="hidden sm:inline">Frameworks</span>
                {frameworkCount > 0 && (
                  <Badge variant="secondary" className="text-xs ml-1 hidden md:inline-flex">
                    {frameworkCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Impact Analysis - CIA Triad */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-muted-foreground" />
                    Impact Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {threat.impactAnalysis ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div
                        className={`flex items-center gap-4 p-4 rounded-lg border ${
                          threat.impactAnalysis.confidentiality
                            ? "bg-destructive/5 dark:bg-destructive/10 border-destructive/20 dark:border-destructive/30"
                            : "bg-muted/50 border-muted"
                        }`}
                      >
                        {threat.impactAnalysis.confidentiality ? (
                          <ShieldX className="h-8 w-8 text-destructive flex-shrink-0" />
                        ) : (
                          <ShieldCheck className="h-8 w-8 text-green-500 flex-shrink-0" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <Lock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">Confidentiality</span>
                          </div>
                          <span
                            className={`text-sm font-medium ${
                              threat.impactAnalysis.confidentiality
                                ? "text-red-600 dark:text-red-400"
                                : "text-green-600 dark:text-green-400"
                            }`}
                          >
                            {threat.impactAnalysis.confidentiality ? "Affected" : "Not Affected"}
                          </span>
                        </div>
                      </div>

                      <div
                        className={`flex items-center gap-4 p-4 rounded-lg border ${
                          threat.impactAnalysis.integrity
                            ? "bg-destructive/5 dark:bg-destructive/10 border-destructive/20 dark:border-destructive/30"
                            : "bg-muted/50 border-muted"
                        }`}
                      >
                        {threat.impactAnalysis.integrity ? (
                          <ShieldX className="h-8 w-8 text-destructive flex-shrink-0" />
                        ) : (
                          <ShieldCheck className="h-8 w-8 text-green-500 flex-shrink-0" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">Integrity</span>
                          </div>
                          <span
                            className={`text-sm font-medium ${
                              threat.impactAnalysis.integrity
                                ? "text-red-600 dark:text-red-400"
                                : "text-green-600 dark:text-green-400"
                            }`}
                          >
                            {threat.impactAnalysis.integrity ? "Affected" : "Not Affected"}
                          </span>
                        </div>
                      </div>

                      <div
                        className={`flex items-center gap-4 p-4 rounded-lg border ${
                          threat.impactAnalysis.availability
                            ? "bg-destructive/5 dark:bg-destructive/10 border-destructive/20 dark:border-destructive/30"
                            : "bg-muted/50 border-muted"
                        }`}
                      >
                        {threat.impactAnalysis.availability ? (
                          <ShieldX className="h-8 w-8 text-destructive flex-shrink-0" />
                        ) : (
                          <ShieldCheck className="h-8 w-8 text-green-500 flex-shrink-0" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">Availability</span>
                          </div>
                          <span
                            className={`text-sm font-medium ${
                              threat.impactAnalysis.availability
                                ? "text-red-600 dark:text-red-400"
                                : "text-green-600 dark:text-green-400"
                            }`}
                          >
                            {threat.impactAnalysis.availability ? "Affected" : "Not Affected"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No impact analysis available.</p>
                  )}
                </CardContent>
              </Card>

              {/* Affected Components */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-muted-foreground" />
                    Affected Components
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {threat.componentIds.map((id) => (
                      <Link
                        to={`/components/${id}`}
                        key={id}
                        className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors group"
                      >
                        <div className="w-3 h-3 rounded-full bg-purple-500 group-hover:scale-125 transition-transform flex-shrink-0"></div>
                        <div className="flex-1">
                          <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {componentIdToName[id] || id.toUpperCase()}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {id.toUpperCase()}
                          </div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </Link>
                    ))}
                  </div>
                  {threat.affectedComponents && threat.affectedComponents.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">
                        Specific Modules
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {threat.affectedComponents.map((component, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="border-purple-200 text-purple-700 dark:border-purple-800 dark:text-purple-300"
                          >
                            {component}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Mitigation Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                    Mitigation Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {mitigations.length > 0 ? (
                    <div className="space-y-4">
                      {threat.mitigationNames && threat.mitigationNames.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-muted-foreground mb-2">
                            Categories
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {threat.mitigationNames.map((name, i) => (
                              <Badge
                                key={i}
                                variant="outline"
                                className="border-green-200 text-green-700 dark:border-green-700 dark:text-green-300"
                              >
                                {name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="grid gap-3">
                        {mitigations.slice(0, 4).map((m) => (
                          <Link
                            key={m.id}
                            to={`/controls/${m.id}`}
                            className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors group"
                          >
                            <div className="w-2 h-2 rounded-full bg-control mt-2 group-hover:scale-125 transition-transform flex-shrink-0"></div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                                {m.name}
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {m.description}
                              </p>
                            </div>
                            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                          </Link>
                        ))}
                      </div>
                      {mitigations.length > 4 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveTab("mitigations")}
                          className="w-full"
                        >
                          View all {mitigations.length} mitigations{" "}
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      No mitigations documented for this threat.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* References */}
              {threat.references && threat.references.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ExternalLink className="h-5 w-5 text-muted-foreground" />
                      References & Resources
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {threat.references.map((ref, index) => (
                        <a
                          key={index}
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                        >
                          <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                          <span className="text-sm font-medium group-hover:text-primary transition-colors">
                            {ref.title}
                          </span>
                        </a>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Attack Vectors Tab */}
            <TabsContent value="attack-vectors" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crosshair className="h-5 w-5 text-muted-foreground" />
                    Attack Vectors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(threat.attackVectors || []).length > 0 ? (
                    <div className="space-y-4">
                      {threat.attackVectors!.map((attack, i) => (
                        <div
                          key={i}
                          className={`p-5 rounded-lg border-l-4 border bg-card ${
                            attack.severity === "high"
                              ? "border-l-red-500"
                              : attack.severity === "medium"
                                ? "border-l-yellow-500"
                                : "border-l-blue-500"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-lg font-semibold text-foreground">
                              {attack.vector}
                            </h3>
                            {attack.severity && (
                              <Badge className={`${getSeverityBadge(attack.severity)} capitalize`}>
                                {attack.severity}
                              </Badge>
                            )}
                          </div>
                          {attack.example && (
                            <p className="text-muted-foreground leading-relaxed">
                              {attack.example}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      No attack vectors documented for this threat.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Mitigations Tab */}
            <TabsContent value="mitigations" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                    Available Mitigations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {mitigations.length > 0 ? (
                    <div className="grid gap-4">
                      {mitigations.map((m) => (
                        <Link
                          key={m.id}
                          to={`/controls/${m.id}`}
                          className="flex items-start gap-4 p-5 rounded-lg border hover:bg-muted/50 hover:border-control/40 transition-all group"
                        >
                          {m.icon && (
                            <span className="text-muted-foreground flex-shrink-0">
                              <Icon name={m.icon} color="currentColor" size={24} />
                            </span>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1 text-lg">
                              {m.name}
                            </div>
                            <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                              {m.description}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {m.designPhase && (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                                >
                                  Design
                                </Badge>
                              )}
                              {m.buildPhase && (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300"
                                >
                                  Build
                                </Badge>
                              )}
                              {m.operationPhase && (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
                                >
                                  Operations
                                </Badge>
                              )}
                              {(m.tags || []).slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      No mitigations documented for this threat.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Frameworks Tab */}
            <TabsContent value="frameworks" className="space-y-6">
              {frameworkMappings && (
                <>
                  <ThreatConstellationDiagram threat={threat} mappings={frameworkMappings} />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* OWASP Agentic Top 10 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Target className="h-5 w-5 text-muted-foreground" />
                          OWASP Agentic Top 10
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {frameworkMappings.allAsi.length > 0 ? (
                          <div className="space-y-2">
                            {frameworkMappings.allAsi.map((entry) => (
                              <Link
                                key={entry.id}
                                to={`/taxonomy?tab=owasp-agentic`}
                                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-colors group"
                              >
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800 flex-shrink-0"
                                >
                                  {entry.code}
                                </Badge>
                                <span className="text-sm font-medium group-hover:text-rose-700 dark:group-hover:text-rose-300 transition-colors">
                                  {entry.name}
                                </span>
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No OWASP Agentic Top 10 mappings
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Cisco AI Taxonomy */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Layers className="h-5 w-5 text-muted-foreground" />
                          Cisco AI Taxonomy
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {frameworkMappings.ciscoEntries.length > 0 ? (
                          <div className="space-y-2">
                            {frameworkMappings.ciscoEntries.map((og) => (
                              <Link
                                key={og.code}
                                to={`/taxonomy?tab=cisco`}
                                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-cyan-50/50 dark:hover:bg-cyan-950/20 transition-colors group"
                              >
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-800 flex-shrink-0"
                                >
                                  {og.code}
                                </Badge>
                                <span className="text-sm font-medium group-hover:text-cyan-700 dark:group-hover:text-cyan-300 transition-colors">
                                  {og.description}
                                </span>
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No Cisco AI Taxonomy mappings
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    {/* AIVSS Scores */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Calculator className="h-5 w-5 text-amber-500" />
                          AIVSS Risk Scores
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {frameworkMappings.aivssMatches.length > 0 ? (
                          <div className="space-y-2">
                            {frameworkMappings.aivssMatches.map((risk) => (
                              <Link
                                key={risk.rank}
                                to={`/taxonomy?tab=aivss`}
                                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-colors group"
                              >
                                <Badge
                                  variant="outline"
                                  className={`text-xs flex-shrink-0 ${getSeverityColor(risk.severity)}`}
                                >
                                  #{risk.rank}
                                </Badge>
                                <div className="flex-1">
                                  <span className="text-sm font-medium group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                                    {risk.name}
                                  </span>
                                  <div className="text-xs text-muted-foreground">
                                    AIVSS {risk.aivssScore.toFixed(1)} ({risk.severity})
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No AIVSS risk score mappings
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default ThreatDetail;

import { useState, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  ChevronDown,
  ChevronRight,
  ArrowRight,
  BarChart3,
  Route,
  Shield,
  Search,
  SlidersHorizontal,
  ClipboardCheck,
} from "lucide-react";
import {
  type ThreatAnalysisResult,
  type GeneratedThreat,
  type CanvasNode,
  MAESTRO_LAYER_LABELS,
  MAESTRO_LAYER_COLORS,
} from "./types";
import type { ModelRiskSummary } from "./engine/riskScoring";
import type { AttackPath } from "./engine/attackPaths";
import type { AISVSCoverageResult } from "./engine/aisvsMapping";
import ReportDashboard from "./ReportDashboard";
import AttackPathPanel from "./AttackPathPanel";
import CompliancePanel from "./CompliancePanel";

interface ThreatResultsPanelProps {
  result: ThreatAnalysisResult | null;
  riskSummary?: ModelRiskSummary | null;
  attackPaths?: AttackPath[];
  nodes?: CanvasNode[];
  onThreatClick?: (threat: GeneratedThreat) => void;
  showMitigated?: boolean;
  onToggleShowMitigated?: () => void;
  totalBeforeMitigation?: number;
  aisvsResult?: AISVSCoverageResult | null;
}

const SEVERITY_CONFIG = {
  critical: {
    bg: "bg-red-500/10",
    border: "border-red-500/40",
    text: "text-red-600 dark:text-red-400",
    badge: "bg-red-500",
  },
  high: {
    bg: "bg-orange-500/10",
    border: "border-orange-500/40",
    text: "text-orange-600 dark:text-orange-400",
    badge: "bg-orange-500",
  },
  medium: {
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/40",
    text: "text-yellow-600 dark:text-yellow-400",
    badge: "bg-yellow-500",
  },
  low: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/40",
    text: "text-blue-600 dark:text-blue-400",
    badge: "bg-blue-500",
  },
};

const SEVERITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

type TabKey = "all" | "maestro" | "other" | "dashboard" | "paths" | "compliance";
type SortKey = "severity" | "layer" | "name" | "components";

const SEVERITY_OPTIONS = ["critical", "high", "medium", "low"] as const;

export default function ThreatResultsPanel({
  result,
  riskSummary,
  attackPaths,
  nodes,
  onThreatClick,
  showMitigated,
  onToggleShowMitigated,
  totalBeforeMitigation,
  aisvsResult,
}: ThreatResultsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [expandedThreats, setExpandedThreats] = useState<Set<string>>(new Set());

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<Set<string>>(new Set());
  const [inheritedFilter, setInheritedFilter] = useState<"all" | "yes" | "no">("all");
  const [mitigationFilter, setMitigationFilter] = useState<"all" | "yes" | "no">("all");
  const [sortBy, setSortBy] = useState<SortKey>("severity");

  const filteredAndSorted = useMemo(() => {
    if (!result) return [];
    let threats = result.threats;

    // Tab filter
    if (activeTab === "maestro") threats = threats.filter((t) => t.methodology === "MAESTRO");
    else if (activeTab === "other") threats = threats.filter((t) => t.methodology !== "MAESTRO");

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      threats = threats.filter(
        (t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
      );
    }

    // Severity filter
    if (severityFilter.size > 0) {
      threats = threats.filter((t) => severityFilter.has(t.severity));
    }

    // Inherited filter
    if (inheritedFilter === "yes") threats = threats.filter((t) => t.inherited);
    else if (inheritedFilter === "no") threats = threats.filter((t) => !t.inherited);

    // Mitigation filter
    if (mitigationFilter === "yes") threats = threats.filter((t) => t.mitigations.length > 0);
    else if (mitigationFilter === "no") threats = threats.filter((t) => t.mitigations.length === 0);

    // Sort
    const sorted = [...threats];
    if (sortBy === "severity") {
      sorted.sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 4) - (SEVERITY_ORDER[b.severity] ?? 4));
    } else if (sortBy === "layer") {
      sorted.sort((a, b) => (a.maestroLayer ?? 99) - (b.maestroLayer ?? 99));
    } else if (sortBy === "name") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "components") {
      sorted.sort((a, b) => b.affectedNodeIds.length - a.affectedNodeIds.length);
    }

    return sorted;
  }, [result, activeTab, searchQuery, severityFilter, inheritedFilter, mitigationFilter, sortBy]);

  const hasActiveFilters =
    searchQuery.trim() ||
    severityFilter.size > 0 ||
    inheritedFilter !== "all" ||
    mitigationFilter !== "all";

  if (!result) {
    return (
      <div className="w-72 border-l bg-background/95 flex items-center justify-center p-4">
        <p className="text-xs text-muted-foreground text-center">Run analysis to see threats</p>
      </div>
    );
  }

  const toggle = (id: string) => {
    setExpandedThreats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSeverityFilter = (sev: string) => {
    setSeverityFilter((prev) => {
      const next = new Set(prev);
      if (next.has(sev)) next.delete(sev);
      else next.add(sev);
      return next;
    });
  };

  const tabs: { key: TabKey; label: string; count?: number; icon?: React.ElementType }[] = [
    { key: "dashboard", label: "Dashboard", icon: BarChart3 },
    { key: "all", label: "All", count: result.threats.length },
    {
      key: "maestro",
      label: "MAESTRO",
      count: result.threats.filter((t) => t.methodology === "MAESTRO").length,
    },
    {
      key: "other",
      label: "Other",
      count: result.threats.filter((t) => t.methodology !== "MAESTRO").length,
    },
    { key: "paths", label: "Paths", count: attackPaths?.length ?? 0, icon: Route },
    ...(aisvsResult ? [{ key: "compliance" as TabKey, label: "AISVS", icon: ClipboardCheck }] : []),
  ];

  const isThreatTab = activeTab === "all" || activeTab === "maestro" || activeTab === "other";

  return (
    <div className="w-72 border-l bg-background/95 flex flex-col h-full">
      <div className="p-2 border-b space-y-2">
        <h3 className="text-xs font-bold">Threat Analysis</h3>
        <div className="grid grid-cols-4 gap-1 text-center">
          <div className="rounded bg-red-500/10 p-1">
            <p className="text-sm font-bold text-red-600 dark:text-red-400">
              {result.summary.critical}
            </p>
            <p className="text-[8px] text-muted-foreground">Critical</p>
          </div>
          <div className="rounded bg-orange-500/10 p-1">
            <p className="text-sm font-bold text-orange-600 dark:text-orange-400">
              {result.summary.high}
            </p>
            <p className="text-[8px] text-muted-foreground">High</p>
          </div>
          <div className="rounded bg-yellow-500/10 p-1">
            <p className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
              {result.summary.medium}
            </p>
            <p className="text-[8px] text-muted-foreground">Medium</p>
          </div>
          <div className="rounded bg-blue-500/10 p-1">
            <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
              {result.summary.low}
            </p>
            <p className="text-[8px] text-muted-foreground">Low</p>
          </div>
        </div>
        {(result.summary.mitigated ?? 0) > 0 && (
          <div className="p-1.5 rounded bg-green-500/10 border border-green-500/20 flex items-center justify-between">
            <div className="text-[10px]">
              <span className="font-semibold text-green-600 dark:text-green-400">
                {result.summary.mitigated} mitigated
              </span>
              <span className="text-muted-foreground">
                {" "}
                of {totalBeforeMitigation ?? result.summary.total + result.summary.mitigated}
              </span>
            </div>
            <button
              onClick={onToggleShowMitigated}
              className={`text-[9px] px-1.5 py-0.5 rounded transition-all ${showMitigated ? "bg-green-500/20 text-green-600 font-semibold" : "bg-muted text-muted-foreground hover:bg-accent"}`}
            >
              {showMitigated ? "Showing all" : "Show mitigated"}
            </button>
          </div>
        )}
        <div className="flex gap-0.5 bg-accent rounded-md p-0.5 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-0.5 flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded transition-all ${activeTab === tab.key ? "bg-background shadow-sm font-semibold" : "hover:bg-background/50"}`}
            >
              {tab.icon &&
                (() => {
                  const I = tab.icon;
                  return <I className="h-2.5 w-2.5" />;
                })()}
              {tab.label}
              {tab.count !== undefined && (
                <span className="text-muted-foreground ml-0.5">({tab.count})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "dashboard" ? (
        <ReportDashboard
          result={result}
          riskSummary={riskSummary ?? null}
          aisvsResult={aisvsResult ?? null}
        />
      ) : activeTab === "paths" ? (
        <AttackPathPanel paths={attackPaths ?? []} nodes={nodes ?? []} />
      ) : activeTab === "compliance" && aisvsResult ? (
        <CompliancePanel result={aisvsResult} />
      ) : (
        <>
          {/* Search & filter bar */}
          {isThreatTab && (
            <div className="p-1.5 border-b space-y-1">
              <div className="flex gap-1">
                <div className="relative flex-1">
                  <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    placeholder="Search threats..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-6 h-6 text-[10px]"
                  />
                </div>
                <button
                  onClick={() => setShowFilters((v) => !v)}
                  className={`p-1 rounded transition-all ${showFilters || hasActiveFilters ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                </button>
              </div>
              {showFilters && (
                <div className="space-y-1.5 pt-1">
                  {/* Severity toggles */}
                  <div>
                    <p className="text-[9px] font-semibold text-muted-foreground mb-0.5">
                      Severity
                    </p>
                    <div className="flex gap-0.5">
                      {SEVERITY_OPTIONS.map((sev) => (
                        <button
                          key={sev}
                          onClick={() => toggleSeverityFilter(sev)}
                          className={`text-[9px] px-1.5 py-0.5 rounded transition-all ${
                            severityFilter.has(sev)
                              ? `${SEVERITY_CONFIG[sev].badge} text-white font-semibold`
                              : "bg-muted text-muted-foreground hover:bg-accent"
                          }`}
                        >
                          {sev}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Inherited filter */}
                  <div className="flex gap-2">
                    <div>
                      <p className="text-[9px] font-semibold text-muted-foreground mb-0.5">
                        Inherited
                      </p>
                      <div className="flex gap-0.5">
                        {(["all", "yes", "no"] as const).map((v) => (
                          <button
                            key={v}
                            onClick={() => setInheritedFilter(v)}
                            className={`text-[9px] px-1.5 py-0.5 rounded transition-all ${inheritedFilter === v ? "bg-primary text-primary-foreground font-semibold" : "bg-muted text-muted-foreground hover:bg-accent"}`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[9px] font-semibold text-muted-foreground mb-0.5">
                        Has Mitigations
                      </p>
                      <div className="flex gap-0.5">
                        {(["all", "yes", "no"] as const).map((v) => (
                          <button
                            key={v}
                            onClick={() => setMitigationFilter(v)}
                            className={`text-[9px] px-1.5 py-0.5 rounded transition-all ${mitigationFilter === v ? "bg-primary text-primary-foreground font-semibold" : "bg-muted text-muted-foreground hover:bg-accent"}`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Sort */}
                  <div>
                    <p className="text-[9px] font-semibold text-muted-foreground mb-0.5">Sort by</p>
                    <div className="flex gap-0.5">
                      {(
                        [
                          ["severity", "Severity"],
                          ["layer", "Layer"],
                          ["name", "Name"],
                          ["components", "Components"],
                        ] as [SortKey, string][]
                      ).map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => setSortBy(key)}
                          className={`text-[9px] px-1.5 py-0.5 rounded transition-all ${sortBy === key ? "bg-primary text-primary-foreground font-semibold" : "bg-muted text-muted-foreground hover:bg-accent"}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {hasActiveFilters && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setSeverityFilter(new Set());
                        setInheritedFilter("all");
                        setMitigationFilter("all");
                      }}
                      className="text-[9px] text-destructive hover:underline"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              )}
              {hasActiveFilters && !showFilters && (
                <p className="text-[9px] text-muted-foreground">
                  Showing {filteredAndSorted.length} of {result.threats.length} threats
                </p>
              )}
            </div>
          )}

          <ScrollArea className="flex-1">
            <div className="p-1.5 space-y-1">
              {filteredAndSorted.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  {hasActiveFilters ? "No threats match filters" : "No threats in this category"}
                </p>
              )}
              {filteredAndSorted.map((threat) => {
                const config = SEVERITY_CONFIG[threat.severity];
                const isExpanded = expandedThreats.has(threat.id);
                return (
                  <div
                    key={threat.id}
                    className={`border rounded-md overflow-hidden ${config.border} ${config.bg}`}
                  >
                    <button
                      onClick={() => {
                        toggle(threat.id);
                        onThreatClick?.(threat);
                      }}
                      className="flex items-start gap-1.5 w-full text-left p-2"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-3 w-3 mt-0.5 shrink-0" />
                      ) : (
                        <ChevronRight className="h-3 w-3 mt-0.5 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span
                            className={`text-[8px] px-1 py-0 rounded text-white font-bold ${config.badge}`}
                          >
                            {threat.severity.toUpperCase()}
                          </span>
                          {threat.inherited && (
                            <span className="text-[8px] px-1 py-0 rounded border border-orange-400 text-orange-500 font-medium">
                              Inherited
                            </span>
                          )}
                          {threat.methodology === "MAESTRO" &&
                            threat.maestroLayer !== undefined && (
                              <span
                                className="text-[8px] px-1 py-0 rounded text-white font-medium"
                                style={{
                                  backgroundColor: MAESTRO_LAYER_COLORS[threat.maestroLayer],
                                }}
                              >
                                {MAESTRO_LAYER_LABELS[threat.maestroLayer]}
                              </span>
                            )}
                        </div>
                        <p className="text-[11px] font-semibold mt-0.5 leading-tight">
                          {threat.name}
                        </p>
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="px-2 pb-2 space-y-1.5 border-t border-current/5">
                        <p className="text-[10px] text-muted-foreground leading-relaxed mt-1.5">
                          {threat.description}
                        </p>
                        {threat.propagationPath && threat.propagationPath.length > 0 && (
                          <div className="text-[9px]">
                            <span className="font-semibold">Propagation:</span>
                            <div className="flex items-center gap-0.5 flex-wrap mt-0.5">
                              {threat.propagationPath.map((nodeId, i) => {
                                const node = nodes?.find((n) => n.id === nodeId);
                                return (
                                  <span key={i} className="flex items-center gap-0.5">
                                    <span className="px-1 py-0 bg-background rounded text-[8px]">
                                      {node?.data?.label ?? nodeId.slice(0, 8)}
                                    </span>
                                    {i < (threat.propagationPath?.length ?? 0) - 1 && (
                                      <ArrowRight className="h-2 w-2" />
                                    )}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {threat.crossLayerChain && threat.crossLayerChain.length > 0 && (
                          <div className="text-[9px]">
                            <span className="font-semibold">Cross-Layer:</span>
                            {threat.crossLayerChain.map((chain, i) => (
                              <div key={i} className="flex items-center gap-1 mt-0.5">
                                <span
                                  className="px-1 py-0 rounded text-white text-[7px]"
                                  style={{ backgroundColor: MAESTRO_LAYER_COLORS[chain.fromLayer] }}
                                >
                                  {MAESTRO_LAYER_LABELS[chain.fromLayer]}
                                </span>
                                <ArrowRight className="h-2 w-2" />
                                <span
                                  className="px-1 py-0 rounded text-white text-[7px]"
                                  style={{ backgroundColor: MAESTRO_LAYER_COLORS[chain.toLayer] }}
                                >
                                  {MAESTRO_LAYER_LABELS[chain.toLayer]}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        {threat.mitigations.length > 0 && (
                          <div className="text-[9px]">
                            <span className="font-semibold flex items-center gap-1">
                              <Shield className="h-2.5 w-2.5" />
                              Mitigations:
                            </span>
                            <ul className="list-disc list-inside mt-0.5 space-y-0.5">
                              {threat.mitigations.slice(0, 5).map((m, i) => (
                                <li key={i} className="text-muted-foreground">
                                  {m}
                                </li>
                              ))}
                              {threat.mitigations.length > 5 && (
                                <li className="text-muted-foreground">
                                  +{threat.mitigations.length - 5} more
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </>
      )}
    </div>
  );
}

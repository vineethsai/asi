import { useState, useMemo, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
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
  Crosshair,
  Download,
  Globe,
  Network,
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
import type { ComplianceViolation } from "./engine/dataFlowCompliance";
import type { ComplianceGapReport } from "./engine/complianceGap";
import type { AttackSurfaceScore } from "./engine/attackSurface";
import ReportDashboard from "./ReportDashboard";
import AttackPathPanel from "./AttackPathPanel";
import CompliancePanel from "./CompliancePanel";

interface ThreatResultsPanelProps {
  result: ThreatAnalysisResult | null;
  riskSummary?: ModelRiskSummary | null;
  attackPaths?: AttackPath[];
  nodes?: CanvasNode[];
  onThreatClick?: (threat: GeneratedThreat) => void;
  onLocateThreat?: (threat: GeneratedThreat) => void;
  showMitigated?: boolean;
  onToggleShowMitigated?: () => void;
  totalBeforeMitigation?: number;
  aisvsResult?: AISVSCoverageResult | null;
  complianceViolations?: ComplianceViolation[];
  complianceGapReport?: ComplianceGapReport | null;
  attackSurfaceScores?: AttackSurfaceScore[];
  onPathClick?: (path: AttackPath) => void;
  whatIfResult?: {
    removedNodeLabel: string;
    beforeCount: number;
    afterCount: number;
    beforeRisk: number;
    afterRisk: number;
    eliminatedPaths: number;
  } | null;
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

type TabKey =
  | "all"
  | "maestro"
  | "other"
  | "dashboard"
  | "paths"
  | "compliance"
  | "cisco"
  | "owasp";
type SortKey = "severity" | "layer" | "name" | "components";

const SEVERITY_OPTIONS = ["critical", "high", "medium", "low"] as const;

export default function ThreatResultsPanel({
  result,
  riskSummary,
  attackPaths,
  nodes,
  onThreatClick,
  onLocateThreat,
  showMitigated,
  onToggleShowMitigated,
  totalBeforeMitigation,
  aisvsResult,
  complianceViolations,
  complianceGapReport,
  attackSurfaceScores,
  onPathClick,
  whatIfResult,
}: ThreatResultsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [expandedThreats, setExpandedThreats] = useState<Set<string>>(new Set());
  const [selectedThreats, setSelectedThreats] = useState<Set<string>>(new Set());

  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<Set<string>>(new Set());
  const [inheritedFilter, setInheritedFilter] = useState<"all" | "yes" | "no">("all");
  const [mitigationFilter, setMitigationFilter] = useState<"all" | "yes" | "no">("all");
  const [sortBy, setSortBy] = useState<SortKey>("severity");

  const filteredAndSorted = useMemo(() => {
    if (!result) return [];
    let threats = result.threats;

    if (activeTab === "maestro") threats = threats.filter((t) => t.methodology === "MAESTRO");
    else if (activeTab === "other") threats = threats.filter((t) => t.methodology !== "MAESTRO");

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      threats = threats.filter(
        (t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
      );
    }

    if (severityFilter.size > 0) threats = threats.filter((t) => severityFilter.has(t.severity));
    if (inheritedFilter === "yes") threats = threats.filter((t) => t.inherited);
    else if (inheritedFilter === "no") threats = threats.filter((t) => !t.inherited);
    if (mitigationFilter === "yes") threats = threats.filter((t) => t.mitigations.length > 0);
    else if (mitigationFilter === "no") threats = threats.filter((t) => t.mitigations.length === 0);

    const sorted = [...threats];
    if (sortBy === "severity")
      sorted.sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 4) - (SEVERITY_ORDER[b.severity] ?? 4));
    else if (sortBy === "layer")
      sorted.sort((a, b) => (a.maestroLayer ?? 99) - (b.maestroLayer ?? 99));
    else if (sortBy === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "components")
      sorted.sort((a, b) => b.affectedNodeIds.length - a.affectedNodeIds.length);

    return sorted;
  }, [result, activeTab, searchQuery, severityFilter, inheritedFilter, mitigationFilter, sortBy]);

  const hasActiveFilters =
    searchQuery.trim() ||
    severityFilter.size > 0 ||
    inheritedFilter !== "all" ||
    mitigationFilter !== "all";
  const activeFilterCount =
    (searchQuery.trim() ? 1 : 0) +
    (severityFilter.size > 0 ? 1 : 0) +
    (inheritedFilter !== "all" ? 1 : 0) +
    (mitigationFilter !== "all" ? 1 : 0);

  // Cisco mapping aggregation
  const ciscoAggregation = useMemo(() => {
    if (!result) return [];
    const map = new Map<
      string,
      {
        objectiveId: string;
        objectiveName: string;
        techniques: Set<string>;
        threatCount: number;
        threatNames: string[];
      }
    >();
    for (const t of result.threats) {
      if (!t.ciscoMapping) continue;
      for (const m of t.ciscoMapping) {
        const existing = map.get(m.objectiveId);
        if (existing) {
          existing.threatCount++;
          existing.threatNames.push(t.name);
          m.techniques?.forEach((tech) => existing.techniques.add(tech));
        } else {
          map.set(m.objectiveId, {
            objectiveId: m.objectiveId,
            objectiveName: m.objectiveName,
            techniques: new Set(m.techniques ?? []),
            threatCount: 1,
            threatNames: [t.name],
          });
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => b.threatCount - a.threatCount);
  }, [result]);

  // OWASP mapping aggregation
  const owaspAggregation = useMemo(() => {
    if (!result) return [];
    const map = new Map<
      string,
      {
        asiId: string;
        asiName: string;
        highCount: number;
        medCount: number;
        lowCount: number;
        threatNames: string[];
      }
    >();
    for (const t of result.threats) {
      if (!t.owaspMapping) continue;
      for (const m of t.owaspMapping) {
        const existing = map.get(m.asiId);
        if (existing) {
          existing.threatNames.push(t.name);
          if (m.confidence === "high") existing.highCount++;
          else if (m.confidence === "medium") existing.medCount++;
          else existing.lowCount++;
        } else {
          map.set(m.asiId, {
            asiId: m.asiId,
            asiName: m.asiName,
            highCount: m.confidence === "high" ? 1 : 0,
            medCount: m.confidence === "medium" ? 1 : 0,
            lowCount: m.confidence === "low" ? 1 : 0,
            threatNames: [t.name],
          });
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      const aTotal = a.highCount + a.medCount + a.lowCount;
      const bTotal = b.highCount + b.medCount + b.lowCount;
      return bTotal - aTotal;
    });
  }, [result]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedThreats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (selectedThreats.size === filteredAndSorted.length) {
      setSelectedThreats(new Set());
    } else {
      setSelectedThreats(new Set(filteredAndSorted.map((t) => t.id)));
    }
  }, [filteredAndSorted, selectedThreats.size]);

  const handleExportSelected = useCallback(() => {
    if (!result) return;
    const selected = result.threats.filter((t) => selectedThreats.has(t.id));
    const csv = [
      ["Name", "Severity", "Methodology", "Description", "Mitigations"].join(","),
      ...selected.map((t) =>
        [
          t.name,
          t.severity,
          t.methodology,
          `"${t.description.replace(/"/g, '""')}"`,
          `"${t.mitigations.join("; ")}"`,
        ].join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "selected-threats.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [result, selectedThreats]);

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

  const scrollToFirstCritical = () => {
    const first = filteredAndSorted.find((t) => t.severity === "critical");
    if (first) {
      setExpandedThreats((prev) => new Set([...prev, first.id]));
      onThreatClick?.(first);
    }
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
    ...(ciscoAggregation.length > 0
      ? [{ key: "cisco" as TabKey, label: "Cisco", count: ciscoAggregation.length, icon: Network }]
      : []),
    ...(owaspAggregation.length > 0
      ? [{ key: "owasp" as TabKey, label: "OWASP", count: owaspAggregation.length, icon: Globe }]
      : []),
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
              className={`text-[9px] px-2 py-1 rounded border transition-all ${showMitigated ? "bg-green-500/20 border-green-500/40 text-green-600 font-semibold" : "bg-muted border-border text-muted-foreground hover:bg-accent hover:text-foreground"}`}
            >
              {showMitigated ? "Showing all" : "Showing active"}
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

      {/* What-If Result Banner */}
      {whatIfResult && (
        <div className="p-2 border-b bg-orange-500/10 border-orange-500/30 space-y-1">
          <div className="flex items-center gap-1">
            <Crosshair className="h-3 w-3 text-orange-500" />
            <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400">
              What-If: Remove &quot;{whatIfResult.removedNodeLabel}&quot;
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 text-center">
            <div className="rounded bg-background p-1">
              <p className="text-[9px] text-muted-foreground">Threats</p>
              <p className="text-xs font-bold">
                {whatIfResult.beforeCount} → {whatIfResult.afterCount}
              </p>
              <p
                className={`text-[9px] font-semibold ${whatIfResult.afterCount < whatIfResult.beforeCount ? "text-green-600" : "text-muted-foreground"}`}
              >
                {whatIfResult.afterCount < whatIfResult.beforeCount
                  ? `−${whatIfResult.beforeCount - whatIfResult.afterCount}`
                  : "No change"}
              </p>
            </div>
            <div className="rounded bg-background p-1">
              <p className="text-[9px] text-muted-foreground">Risk</p>
              <p className="text-xs font-bold">
                {whatIfResult.beforeRisk} → {whatIfResult.afterRisk}
              </p>
              <p
                className={`text-[9px] font-semibold ${whatIfResult.afterRisk < whatIfResult.beforeRisk ? "text-green-600" : "text-muted-foreground"}`}
              >
                {whatIfResult.afterRisk < whatIfResult.beforeRisk
                  ? `−${whatIfResult.beforeRisk - whatIfResult.afterRisk}`
                  : "No change"}
              </p>
            </div>
            <div className="rounded bg-background p-1">
              <p className="text-[9px] text-muted-foreground">Paths</p>
              <p className="text-xs font-bold">
                {whatIfResult.eliminatedPaths > 0 ? `−${whatIfResult.eliminatedPaths}` : "0"}
              </p>
              <p className="text-[9px] text-muted-foreground">eliminated</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "dashboard" ? (
        <ReportDashboard
          result={result}
          riskSummary={riskSummary ?? null}
          aisvsResult={aisvsResult ?? null}
          attackSurfaceScores={attackSurfaceScores}
          complianceViolations={complianceViolations}
          complianceGapReport={complianceGapReport}
        />
      ) : activeTab === "paths" ? (
        <AttackPathPanel paths={attackPaths ?? []} nodes={nodes ?? []} onPathClick={onPathClick} />
      ) : activeTab === "compliance" && aisvsResult ? (
        <CompliancePanel result={aisvsResult} />
      ) : activeTab === "cisco" ? (
        <CiscoMappingTab data={ciscoAggregation} />
      ) : activeTab === "owasp" ? (
        <OwaspMappingTab data={owaspAggregation} />
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
                  className={`p-1 rounded transition-all relative ${showFilters || hasActiveFilters ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  {activeFilterCount > 0 && !showFilters && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[7px] font-bold rounded-full h-3 w-3 flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>
              {/* Jump to critical + select all */}
              <div className="flex gap-1 items-center">
                {result.summary.critical > 0 && (
                  <button
                    onClick={scrollToFirstCritical}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors"
                  >
                    Jump to critical
                  </button>
                )}
                <button
                  onClick={selectAll}
                  className="text-[9px] px-1.5 py-0.5 rounded bg-muted hover:bg-accent transition-colors text-muted-foreground"
                >
                  {selectedThreats.size === filteredAndSorted.length && filteredAndSorted.length > 0
                    ? "Deselect all"
                    : "Select all"}
                </button>
              </div>
              {showFilters && (
                <div className="space-y-1.5 pt-1">
                  <div>
                    <p className="text-[9px] font-semibold text-muted-foreground mb-0.5">
                      Severity
                    </p>
                    <div className="flex gap-0.5">
                      {SEVERITY_OPTIONS.map((sev) => (
                        <button
                          key={sev}
                          onClick={() => toggleSeverityFilter(sev)}
                          className={`text-[9px] px-1.5 py-0.5 rounded transition-all ${severityFilter.has(sev) ? `${SEVERITY_CONFIG[sev].badge} text-white font-semibold` : "bg-muted text-muted-foreground hover:bg-accent"}`}
                        >
                          {sev}
                        </button>
                      ))}
                    </div>
                  </div>
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

          {/* Bulk action bar */}
          {selectedThreats.size > 0 && isThreatTab && (
            <div className="p-1.5 border-b bg-primary/5 flex items-center gap-2">
              <span className="text-[10px] font-semibold">{selectedThreats.size} selected</span>
              <button
                onClick={handleExportSelected}
                className="flex items-center gap-1 text-[9px] px-2 py-1 rounded bg-primary/10 hover:bg-primary/20 transition-colors"
              >
                <Download className="h-2.5 w-2.5" /> Export Selected
              </button>
              <button
                onClick={() => setSelectedThreats(new Set())}
                className="text-[9px] text-muted-foreground hover:underline ml-auto"
              >
                Clear
              </button>
            </div>
          )}

          <ScrollArea className="flex-1">
            <div className="p-1.5 space-y-1">
              {filteredAndSorted.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  {hasActiveFilters
                    ? "No threats match filters"
                    : activeTab === "all"
                      ? "Run analysis to see threats"
                      : "No threats in this category"}
                </p>
              )}
              {filteredAndSorted.map((threat) => {
                const config = SEVERITY_CONFIG[threat.severity];
                const isExpanded = expandedThreats.has(threat.id);
                const isSelected = selectedThreats.has(threat.id);
                const mitigationCount = threat.mitigations.length;
                return (
                  <div
                    key={threat.id}
                    className={`border rounded-md overflow-hidden ${config.border} ${config.bg}`}
                  >
                    <div className="flex items-start gap-1 w-full text-left p-2">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(threat.id)}
                        className="mt-0.5 h-3 w-3"
                      />
                      <button
                        onClick={() => {
                          toggle(threat.id);
                          onThreatClick?.(threat);
                        }}
                        className="flex items-start gap-1.5 flex-1 min-w-0 text-left"
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
                            {mitigationCount > 0 && (
                              <span className="text-[7px] px-1 py-0 rounded bg-green-500/20 text-green-600 font-medium">
                                {mitigationCount} mitigation{mitigationCount > 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] font-semibold mt-0.5 leading-tight">
                            {threat.name}
                          </p>
                        </div>
                      </button>
                      {onLocateThreat && (
                        <button
                          onClick={() => onLocateThreat(threat)}
                          className="p-0.5 rounded hover:bg-accent transition-colors shrink-0"
                          title="Locate on canvas"
                        >
                          <Crosshair className="h-3 w-3 text-muted-foreground" />
                        </button>
                      )}
                    </div>
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
                              <Shield className="h-2.5 w-2.5" /> Mitigations:
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
                        {/* Cisco & OWASP inline badges */}
                        {threat.ciscoMapping && threat.ciscoMapping.length > 0 && (
                          <div className="text-[9px]">
                            <span className="font-semibold flex items-center gap-1">
                              <Network className="h-2.5 w-2.5" /> Cisco:
                            </span>
                            <div className="flex flex-wrap gap-0.5 mt-0.5">
                              {threat.ciscoMapping.map((m, i) => (
                                <span
                                  key={i}
                                  className="px-1 py-0 rounded bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 text-[8px]"
                                >
                                  {m.objectiveId}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {threat.owaspMapping && threat.owaspMapping.length > 0 && (
                          <div className="text-[9px]">
                            <span className="font-semibold flex items-center gap-1">
                              <Globe className="h-2.5 w-2.5" /> OWASP:
                            </span>
                            <div className="flex flex-wrap gap-0.5 mt-0.5">
                              {threat.owaspMapping
                                .filter((m) => m.confidence !== "low")
                                .map((m, i) => (
                                  <span
                                    key={i}
                                    className={`px-1 py-0 rounded text-[8px] ${m.confidence === "high" ? "bg-purple-500/15 text-purple-700 dark:text-purple-400" : "bg-purple-500/10 text-purple-600 dark:text-purple-300"}`}
                                  >
                                    {m.asiId}
                                  </span>
                                ))}
                            </div>
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

// ─── Cisco Taxonomy Tab ──────────────────────────────────────────
function CiscoMappingTab({
  data,
}: {
  data: {
    objectiveId: string;
    objectiveName: string;
    techniques: Set<string>;
    threatCount: number;
    threatNames: string[];
  }[];
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setExpanded((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  if (data.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-xs text-muted-foreground text-center">
          Run analysis to see Cisco taxonomy mappings
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="p-2 space-y-1">
        <p className="text-[9px] text-muted-foreground mb-1">
          {data.length} Cisco objective groups matched across{" "}
          {data.reduce((s, d) => s + d.threatCount, 0)} threat mappings
        </p>
        {data.map((item) => {
          const isOpen = expanded.has(item.objectiveId);
          return (
            <div
              key={item.objectiveId}
              className="border rounded-md overflow-hidden bg-cyan-500/5 border-cyan-500/20"
            >
              <button
                onClick={() => toggle(item.objectiveId)}
                className="flex items-start gap-1.5 w-full text-left p-2"
              >
                {isOpen ? (
                  <ChevronDown className="h-3 w-3 mt-0.5 shrink-0" />
                ) : (
                  <ChevronRight className="h-3 w-3 mt-0.5 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-[8px] px-1 py-0 rounded bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 font-bold">
                      {item.objectiveId}
                    </span>
                    <span className="text-[8px] px-1 py-0 rounded bg-muted text-muted-foreground">
                      {item.threatCount} threat{item.threatCount > 1 ? "s" : ""}
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold mt-0.5 leading-tight">
                    {item.objectiveName}
                  </p>
                </div>
              </button>
              {isOpen && (
                <div className="px-2 pb-2 space-y-1 border-t border-cyan-500/10">
                  {item.techniques.size > 0 && (
                    <div className="text-[9px] mt-1">
                      <span className="font-semibold">Techniques:</span>
                      <ul className="list-disc list-inside mt-0.5 space-y-0.5">
                        {Array.from(item.techniques)
                          .slice(0, 5)
                          .map((t, i) => (
                            <li key={i} className="text-muted-foreground">
                              {t}
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                  <div className="text-[9px]">
                    <span className="font-semibold">Related Threats:</span>
                    <div className="flex flex-wrap gap-0.5 mt-0.5">
                      {item.threatNames.slice(0, 5).map((n, i) => (
                        <span key={i} className="px-1 py-0 rounded bg-background text-[8px]">
                          {n}
                        </span>
                      ))}
                      {item.threatNames.length > 5 && (
                        <span className="text-[8px] text-muted-foreground">
                          +{item.threatNames.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

// ─── OWASP Agentic Top 10 Tab ───────────────────────────────────
function OwaspMappingTab({
  data,
}: {
  data: {
    asiId: string;
    asiName: string;
    highCount: number;
    medCount: number;
    lowCount: number;
    threatNames: string[];
  }[];
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setExpanded((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  if (data.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-xs text-muted-foreground text-center">
          Run analysis to see OWASP mappings
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="p-2 space-y-1">
        <p className="text-[9px] text-muted-foreground mb-1">
          {data.length} of 10 OWASP Agentic categories matched
        </p>
        {data.map((item) => {
          const isOpen = expanded.has(item.asiId);
          const total = item.highCount + item.medCount + item.lowCount;
          return (
            <div
              key={item.asiId}
              className="border rounded-md overflow-hidden bg-purple-500/5 border-purple-500/20"
            >
              <button
                onClick={() => toggle(item.asiId)}
                className="flex items-start gap-1.5 w-full text-left p-2"
              >
                {isOpen ? (
                  <ChevronDown className="h-3 w-3 mt-0.5 shrink-0" />
                ) : (
                  <ChevronRight className="h-3 w-3 mt-0.5 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[8px] px-1 py-0 rounded bg-purple-500/20 text-purple-700 dark:text-purple-400 font-bold">
                      {item.asiId}
                    </span>
                    {item.highCount > 0 && (
                      <span className="text-[7px] px-1 py-0 rounded bg-red-500/15 text-red-600">
                        {item.highCount} high
                      </span>
                    )}
                    {item.medCount > 0 && (
                      <span className="text-[7px] px-1 py-0 rounded bg-yellow-500/15 text-yellow-600">
                        {item.medCount} med
                      </span>
                    )}
                    {item.lowCount > 0 && (
                      <span className="text-[7px] px-1 py-0 rounded bg-blue-500/15 text-blue-600">
                        {item.lowCount} low
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-semibold mt-0.5 leading-tight">{item.asiName}</p>
                  <div className="mt-1">
                    <Progress value={(item.highCount / Math.max(total, 1)) * 100} className="h-1" />
                  </div>
                </div>
              </button>
              {isOpen && (
                <div className="px-2 pb-2 space-y-1 border-t border-purple-500/10">
                  <div className="text-[9px] mt-1">
                    <span className="font-semibold">Matched Threats ({total}):</span>
                    <div className="flex flex-wrap gap-0.5 mt-0.5">
                      {item.threatNames.slice(0, 8).map((n, i) => (
                        <span key={i} className="px-1 py-0 rounded bg-background text-[8px]">
                          {n}
                        </span>
                      ))}
                      {item.threatNames.length > 8 && (
                        <span className="text-[8px] text-muted-foreground">
                          +{item.threatNames.length - 8} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

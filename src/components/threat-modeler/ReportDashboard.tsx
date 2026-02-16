import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import {
  type ThreatAnalysisResult,
  MAESTRO_LAYER_LABELS,
  MAESTRO_LAYER_COLORS,
  type MaestroLayer,
} from "./types";
import type { ModelRiskSummary } from "./engine/riskScoring";
import type { AISVSCoverageResult } from "./engine/aisvsMapping";
import type { ComplianceViolation } from "./engine/dataFlowCompliance";
import type { ComplianceGapReport } from "./engine/complianceGap";
import type { AttackSurfaceScore } from "./engine/attackSurface";

interface ReportDashboardProps {
  result: ThreatAnalysisResult;
  riskSummary: ModelRiskSummary | null;
  aisvsResult: AISVSCoverageResult | null;
  attackSurfaceScores?: AttackSurfaceScore[];
  complianceViolations?: ComplianceViolation[];
  complianceGapReport?: ComplianceGapReport | null;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#3b82f6",
};

const SURFACE_RISK_COLORS: Record<string, string> = {
  critical: "text-red-600 dark:text-red-400",
  high: "text-orange-600 dark:text-orange-400",
  medium: "text-yellow-600 dark:text-yellow-400",
  low: "text-blue-600 dark:text-blue-400",
};

const VIOLATION_SEV_COLORS: Record<string, string> = {
  critical: "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400",
  high: "bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400",
  medium: "bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400",
  low: "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400",
};

export default function ReportDashboard({
  result,
  riskSummary,
  aisvsResult,
  attackSurfaceScores,
  complianceViolations,
  complianceGapReport,
}: ReportDashboardProps) {
  const severityData = [
    { name: "Critical", value: result.summary.critical, color: SEVERITY_COLORS.critical },
    { name: "High", value: result.summary.high, color: SEVERITY_COLORS.high },
    { name: "Medium", value: result.summary.medium, color: SEVERITY_COLORS.medium },
    { name: "Low", value: result.summary.low, color: SEVERITY_COLORS.low },
  ].filter((d) => d.value > 0);

  const methodologyData = Object.entries(result.summary.byMethodology).map(([key, value]) => ({
    name: key,
    count: value,
  }));

  const layerData = Object.entries(result.summary.byLayer).map(([key, value]) => ({
    name: MAESTRO_LAYER_LABELS[Number(key) as MaestroLayer]?.replace("L", "").split(":")[0] ?? key,
    count: value,
    color: MAESTRO_LAYER_COLORS[Number(key) as MaestroLayer] ?? "#6b7280",
  }));

  const riskColor = !riskSummary
    ? "#6b7280"
    : riskSummary.overallScore >= 80
      ? "#ef4444"
      : riskSummary.overallScore >= 60
        ? "#f97316"
        : riskSummary.overallScore >= 40
          ? "#eab308"
          : "#22c55e";

  const aisvsPct =
    aisvsResult && aisvsResult.totalRequirements > 0
      ? Math.round((aisvsResult.identifiedRequirements / aisvsResult.totalRequirements) * 100)
      : null;

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-4">
        {riskSummary && (
          <div className="text-center p-3 rounded-lg border bg-accent/20">
            <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
              Overall Risk
            </p>
            <p className="text-3xl font-bold mt-1" style={{ color: riskColor }}>
              {riskSummary.overallScore}
            </p>
            <p className="text-xs font-semibold" style={{ color: riskColor }}>
              {riskSummary.severityLabel}
            </p>
          </div>
        )}

        {aisvsResult && aisvsPct !== null && (
          <div className="p-2.5 rounded-lg border bg-accent/20 space-y-1.5">
            <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
              AISVS Coverage
            </p>
            <div className="flex items-center gap-2">
              <Progress value={aisvsPct} className="h-2 flex-1" />
              <span className="text-sm font-bold">{aisvsPct}%</span>
            </div>
            <div className="flex justify-between text-[9px] text-muted-foreground">
              <span>{aisvsResult.addressedRequirements} addressed</span>
              <span>
                {aisvsResult.identifiedRequirements - aisvsResult.addressedRequirements} identified
              </span>
              <span>{aisvsResult.gapRequirements} gaps</span>
            </div>
          </div>
        )}

        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">
            Severity Distribution
          </p>
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Pie
                data={severityData}
                cx="50%"
                cy="50%"
                innerRadius={25}
                outerRadius={45}
                paddingAngle={2}
                dataKey="value"
              >
                {severityData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: "11px", padding: "4px 8px" }} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: "10px" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">
            By Methodology
          </p>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart
              data={methodologyData}
              layout="vertical"
              margin={{ left: 0, right: 10, top: 0, bottom: 0 }}
            >
              <XAxis type="number" tick={{ fontSize: 9 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={65} />
              <Tooltip contentStyle={{ fontSize: "11px", padding: "4px 8px" }} />
              <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {layerData.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">
              By MAESTRO Layer
            </p>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={layerData} margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 8 }} />
                <YAxis tick={{ fontSize: 9 }} width={25} />
                <Tooltip contentStyle={{ fontSize: "11px", padding: "4px 8px" }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={18}>
                  {layerData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {riskSummary && riskSummary.topRisks.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">
              Top Risk Components
            </p>
            <div className="space-y-1">
              {riskSummary.topRisks.map((risk, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs p-1.5 rounded border bg-accent/20"
                >
                  <span className="truncate">{risk.name}</span>
                  <span className="font-bold text-red-500 shrink-0 ml-2">{risk.score}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data Flow Compliance Violations */}
        {complianceViolations && complianceViolations.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Data Flow Violations ({complianceViolations.length})
            </p>
            <div className="space-y-1">
              {complianceViolations.slice(0, 5).map((v) => (
                <div
                  key={v.id}
                  className={`p-1.5 rounded border text-[10px] ${VIOLATION_SEV_COLORS[v.severity]}`}
                >
                  <p className="font-semibold">{v.name}</p>
                  <p className="text-muted-foreground mt-0.5">{v.description}</p>
                </div>
              ))}
              {complianceViolations.length > 5 && (
                <p className="text-[9px] text-muted-foreground text-center">
                  +{complianceViolations.length - 5} more violations
                </p>
              )}
            </div>
          </div>
        )}

        {/* Compliance Gap Summary */}
        {complianceGapReport && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1 flex items-center gap-1">
              <ShieldAlert className="h-3 w-3" />
              AISVS Compliance Gaps
            </p>
            <div className="grid grid-cols-3 gap-1 text-center">
              <div className="rounded bg-green-500/10 p-1.5">
                <p className="text-sm font-bold text-green-600">
                  {complianceGapReport.summary.met}
                </p>
                <p className="text-[8px] text-muted-foreground">Met</p>
              </div>
              <div className="rounded bg-yellow-500/10 p-1.5">
                <p className="text-sm font-bold text-yellow-600">
                  {complianceGapReport.summary.partial}
                </p>
                <p className="text-[8px] text-muted-foreground">Partial</p>
              </div>
              <div className="rounded bg-red-500/10 p-1.5">
                <p className="text-sm font-bold text-red-600">{complianceGapReport.summary.gaps}</p>
                <p className="text-[8px] text-muted-foreground">Gaps</p>
              </div>
            </div>
            <div className="mt-1.5">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Coverage</span>
                <Progress
                  value={
                    complianceGapReport.summary.totalChecks > 0
                      ? Math.round(
                          ((complianceGapReport.summary.met +
                            complianceGapReport.summary.partial * 0.5) /
                            complianceGapReport.summary.totalChecks) *
                            100,
                        )
                      : 0
                  }
                  className="h-1.5 flex-1"
                />
                <span className="text-[9px] font-bold">
                  {complianceGapReport.summary.totalChecks > 0
                    ? Math.round(
                        ((complianceGapReport.summary.met +
                          complianceGapReport.summary.partial * 0.5) /
                          complianceGapReport.summary.totalChecks) *
                          100,
                      )
                    : 0}
                  %
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Attack Surface Scores */}
        {attackSurfaceScores && attackSurfaceScores.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">
              Attack Surface (Top 5)
            </p>
            <div className="space-y-1">
              {attackSurfaceScores.slice(0, 5).map((s) => (
                <div
                  key={s.nodeId}
                  className="flex items-center justify-between text-xs p-1.5 rounded border bg-accent/20"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`text-[8px] font-bold uppercase ${SURFACE_RISK_COLORS[s.riskLevel]}`}
                    >
                      {s.riskLevel}
                    </span>
                    <span className="truncate">{s.label}</span>
                  </div>
                  <span className="font-bold shrink-0 ml-2">{s.score}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center pt-2 border-t">
          <p className="text-[9px] text-muted-foreground">
            Total: {result.summary.total} threats | Inherited: {result.summary.inherited}
          </p>
        </div>
      </div>
    </ScrollArea>
  );
}

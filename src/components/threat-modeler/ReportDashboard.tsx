/**
 * Results dashboard (P3-36): model risk score (residual vs inherent and how it
 * is composed), severity histogram, riskiest components and indicative
 * compliance summaries. Lazy-loaded by results/ResultsPanel — recharts lives
 * only here so it stays out of the modeler's first paint.
 */
import { useMemo, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartFrame, Ring, useChartTheme, usePrefersReducedMotion } from "@/components/charts";
import { cn } from "@/lib/utils";
import { severityColor, severityLabel, type SeverityBand } from "@/lib/severity";
import type { AnalysisResult } from "./engine/analyze";
import { riskLabel } from "./engine/severity";
import { threatResolution, tm, useTM } from "./store";
import type { Severity } from "./types";
import { SevChip } from "./results/shared";

const SEVS: Severity[] = ["critical", "high", "medium", "low"];

/** engine riskLabel() text → severity band for colour + glyph. */
function labelBand(label: string): SeverityBand {
  switch (label) {
    case "Critical":
      return "critical";
    case "High":
      return "high";
    case "Medium":
      return "medium";
    case "Low":
      return "low";
    default:
      return "info";
  }
}

function Heading({ children, note }: { children: ReactNode; note?: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <h3 className="text-xs font-semibold">{children}</h3>
      {note && <span className="text-[11px] text-muted-foreground">{note}</span>}
    </div>
  );
}

function ScoreSection({
  analysis,
  onLocate,
}: {
  analysis: AnalysisResult;
  onLocate?: (ids: string[]) => void;
}) {
  const ms = analysis.modelScore;
  const b = ms.breakdown;
  const topPath = b.topPathId ? analysis.paths.paths.find((p) => p.id === b.topPathId) : undefined;
  const band = labelBand(ms.label);
  const reduced = ms.inherent - ms.overall;
  return (
    <section aria-labelledby="tm-dash-score" className="space-y-2 rounded-md border bg-card p-3">
      <Heading>
        <span id="tm-dash-score">Model risk score</span>
      </Heading>
      <div className="flex items-center gap-4">
        <Ring
          value={ms.overall}
          max={100}
          size={88}
          thickness={8}
          tone={band}
          ariaLabel={`Residual model risk ${ms.overall} of 100, ${ms.label}`}
          label={<span className="text-[11px] text-muted-foreground">/ 100</span>}
        />
        <div className="min-w-0 space-y-1 text-xs">
          <p className="flex items-center gap-1.5">
            <SevChip band={band} label={ms.label} />
            <span className="text-muted-foreground">residual risk</span>
          </p>
          <p>
            Inherent <strong>{ms.inherent}</strong> ({ms.inherentLabel}) →{" "}
            <strong>{ms.overall}</strong> after mitigations and statuses
            {reduced > 0 ? ` (−${reduced})` : ""}.
          </p>
          <p className="text-[11px] text-muted-foreground">0–100 · lower is better</p>
        </div>
      </div>
      <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 border-t pt-2 text-xs">
        <dt>
          Component term
          <span className="block text-[11px] text-muted-foreground">
            {Math.round(b.componentWeight * 100)}% × reach/asset-weighted mean residual{" "}
            {Math.round(b.weightedMeanResidual * 100)}%
          </span>
        </dt>
        <dd className="text-right font-semibold tabular-nums">{b.componentTerm}</dd>
        <dt>
          Attack-path term
          <span className="block text-[11px] text-muted-foreground">
            {Math.round(b.pathWeight * 100)}% × top path residual {b.topPathResidual}/25
            {topPath && onLocate && (
              <>
                {" · "}
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => onLocate(topPath.nodes)}
                >
                  show path
                </button>
              </>
            )}
          </span>
        </dt>
        <dd className="text-right font-semibold tabular-nums">{b.pathTerm}</dd>
        <dt className="border-t pt-1 font-medium">Overall</dt>
        <dd className="border-t pt-1 text-right font-semibold tabular-nums">{ms.overall}</dd>
      </dl>
    </section>
  );
}

function SeveritySection({ analysis }: { analysis: AnalysisResult }) {
  const theme = useChartTheme();
  const reducedMotion = usePrefersReducedMotion();
  const data = useMemo(
    () =>
      SEVS.map((s) => {
        let direct = 0;
        let inherited = 0;
        let resolved = 0;
        for (const t of analysis.threats) {
          if (t.severity !== s) continue;
          if (threatResolution(t) === "resolved") resolved += 1;
          else if (t.inherited) inherited += 1;
          else direct += 1;
        }
        return { severity: s, name: severityLabel(s), direct, inherited, resolved };
      }),
    [analysis],
  );
  const total = analysis.threats.length;
  return (
    <section className="rounded-md border bg-card p-3">
      <ChartFrame
        ariaLabel="Threats by severity: open direct, open inherited and resolved"
        title="Threats by severity"
        headingLevel={3}
        description={`${analysis.summary.open} open of ${total}. Faded = inherited downstream; grey = resolved.`}
        empty={total === 0}
        emptyTitle="No threats"
        height={160}
        bare
        table={{
          caption: "Threats by severity",
          columns: ["Severity", "Open (direct)", "Open (inherited)", "Resolved"],
          rows: data.map((d) => [d.name, d.direct, d.inherited, d.resolved]),
        }}
      >
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid vertical={false} stroke={theme.grid} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: theme.mutedForeground }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: theme.mutedForeground }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: theme.muted, opacity: 0.4 }}
              contentStyle={{
                background: theme.card,
                border: `1px solid ${theme.border}`,
                borderRadius: 6,
                fontSize: 11,
                color: theme.foreground,
              }}
            />
            <Bar
              dataKey="direct"
              name="Open (direct)"
              stackId="s"
              isAnimationActive={!reducedMotion}
            >
              {data.map((d) => (
                <Cell key={d.severity} fill={theme.severity[d.severity]} />
              ))}
            </Bar>
            <Bar
              dataKey="inherited"
              name="Open (inherited)"
              stackId="s"
              isAnimationActive={!reducedMotion}
            >
              {data.map((d) => (
                <Cell key={d.severity} fill={theme.severity[d.severity]} fillOpacity={0.45} />
              ))}
            </Bar>
            <Bar
              dataKey="resolved"
              name="Resolved"
              stackId="s"
              fill={theme.mutedForeground}
              fillOpacity={0.35}
              isAnimationActive={!reducedMotion}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>
      <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Open threats by severity">
        {data.map((d) => (
          <li key={d.severity} className="flex items-center gap-1 text-[11px]">
            <SevChip
              band={d.severity}
              label={`${severityLabel(d.severity)} ${d.direct + d.inherited}`}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function ComponentsSection({
  analysis,
  onLocate,
}: {
  analysis: AnalysisResult;
  onLocate?: (ids: string[]) => void;
}) {
  const rows = useMemo(
    () =>
      [...analysis.modelScore.components]
        .filter((c) => c.threatCount > 0)
        .sort((a, b) => b.residual - a.residual || b.inherent - a.inherent)
        .slice(0, 8),
    [analysis],
  );
  if (!rows.length) return null;
  const pick = (id: string) => {
    tm().setUi({ selectedNodeId: id, selectedEdgeId: null });
    onLocate?.([id]);
  };
  return (
    <section
      aria-labelledby="tm-dash-components"
      className="space-y-2 rounded-md border bg-card p-3"
    >
      <Heading note="residual of 100 · bar shows inherent behind">
        <span id="tm-dash-components">Riskiest components</span>
      </Heading>
      <table className="w-full text-xs">
        <caption className="sr-only">Components ranked by residual risk</caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">Component</th>
            <th scope="col">Residual risk</th>
            <th scope="col">Open threats</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => {
            const band = labelBand(riskLabel(c.residual));
            return (
              <tr key={c.nodeId} className="align-middle">
                <th scope="row" className="max-w-0 py-1 pr-2 text-left font-normal">
                  <button
                    type="button"
                    onClick={() => pick(c.nodeId)}
                    className="block w-full truncate text-left hover:underline"
                    title={
                      c.hops === null
                        ? "Not reachable from an entry point"
                        : `${c.hops} hop(s) from an entry point`
                    }
                  >
                    {c.label}
                  </button>
                  <span className="text-[11px] text-muted-foreground">
                    {c.hops === null
                      ? "unreachable"
                      : c.hops === 0
                        ? "entry point"
                        : `${c.hops} hop${c.hops === 1 ? "" : "s"} from entry`}
                  </span>
                </th>
                <td className="w-[45%] py-1">
                  <div className="relative h-2 rounded bg-muted" aria-hidden>
                    <div
                      className="absolute inset-y-0 left-0 rounded bg-muted-foreground/25"
                      style={{ width: `${c.inherent}%` }}
                    />
                    <div
                      className="absolute inset-y-0 left-0 rounded"
                      style={{ width: `${c.residual}%`, background: severityColor(band) }}
                    />
                  </div>
                  <span className="text-[11px] tabular-nums">
                    {c.residual}
                    {c.inherent !== c.residual && (
                      <span className="text-muted-foreground"> (inherent {c.inherent})</span>
                    )}
                  </span>
                </td>
                <td className="py-1 pl-2 text-right text-[11px] tabular-nums text-muted-foreground">
                  {c.openCount}/{c.threatCount} open
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function Tile({
  title,
  version,
  value,
  sub,
  lines,
  onOpen,
}: {
  title: string;
  version?: string;
  value: number;
  sub: string;
  lines: { text: string; muted?: boolean }[];
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-md border bg-card p-2 text-left hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Ring
        value={value}
        size={52}
        thickness={6}
        tone="progress"
        ariaLabel={`${title}: ${value}% (indicative)`}
      />
      <span className="min-w-0 space-y-0.5 text-xs">
        <span className="block font-medium">
          {title}
          {version && (
            <span className="ml-1 text-[11px] font-normal text-muted-foreground">{version}</span>
          )}
        </span>
        <span className="block text-[11px]">{sub}</span>
        {lines.map((l, i) => (
          <span key={i} className={cn("block text-[11px]", l.muted && "text-muted-foreground")}>
            {l.text}
          </span>
        ))}
      </span>
    </button>
  );
}

function ComplianceSection({ analysis }: { analysis: AnalysisResult }) {
  const c = analysis.compliance;
  const counts = { met: 0, partial: 0, gap: 0, na: 0 };
  for (const x of c.checks) {
    if (x.verdict === "not-applicable") counts.na += 1;
    else counts[x.verdict] += 1;
  }
  const applicable = counts.met + counts.partial + counts.gap;
  const checkPct = applicable
    ? Math.round(((counts.met + counts.partial / 2) / applicable) * 100)
    : 0;
  const a = c.aiuc1;
  const s = a.summary;
  const open = () => tm().setUi({ resultsTab: "compliance" });
  return (
    <section aria-labelledby="tm-dash-compliance" className="space-y-2">
      <Heading note="Indicative — derived from the diagram only">
        <span id="tm-dash-compliance">Compliance</span>
      </Heading>
      <Tile
        title="Architecture checks"
        value={checkPct}
        sub={`${counts.gap} gap · ${counts.partial} partial · ${counts.met} met`}
        lines={
          counts.na
            ? [{ text: `${counts.na} not applicable to this model (not scored)`, muted: true }]
            : []
        }
        onOpen={open}
      />
      <Tile
        title="OWASP AISVS"
        version={c.aisvs.version}
        value={c.aisvs.summary.percent}
        sub={`${c.aisvs.summary.met} met · ${c.aisvs.summary.partial} partial · ${c.aisvs.summary.gap} gap chapters`}
        lines={
          c.aisvs.summary.notApplicable
            ? [
                {
                  text: `${c.aisvs.summary.notApplicable} not applicable (not scored)`,
                  muted: true,
                },
              ]
            : []
        }
        onOpen={open}
      />
      <Tile
        title="AIUC-1"
        version={a.version}
        value={a.overallScore}
        sub={a.verdictLabel}
        lines={[
          {
            text: `Mandatory: ${s.mandatoryMet} met · ${s.mandatoryPartial} partial · ${s.mandatoryGap} gap`,
          },
          ...((s.notAssessable ?? 0) > 0
            ? [
                {
                  text: `${s.notAssessable} not assessable from a diagram (need process evidence)`,
                  muted: true,
                },
              ]
            : []),
          ...((s.notApplicable ?? 0) > 0
            ? [{ text: `${s.notApplicable} not applicable (not scored)`, muted: true }]
            : []),
        ]}
        onOpen={open}
      />
    </section>
  );
}

export interface ReportDashboardProps {
  /** Defaults to the store's current analysis. */
  analysis?: AnalysisResult | null;
  /** Fit the canvas to these node ids (the panel passes useCanvasActions().locate). */
  onLocate?: (nodeIds: string[]) => void;
}

export default function ReportDashboard({ analysis: given, onLocate }: ReportDashboardProps) {
  const stored = useTM((s) => s.analysis);
  const analysis = given ?? stored;
  if (!analysis) {
    return (
      <p className="p-4 text-center text-xs text-muted-foreground">
        Run an analysis to see the dashboard.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      <ScoreSection analysis={analysis} onLocate={onLocate} />
      <SeveritySection analysis={analysis} />
      <ComponentsSection analysis={analysis} onLocate={onLocate} />
      <ComplianceSection analysis={analysis} />
    </div>
  );
}

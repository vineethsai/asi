/**
 * Threats on the selected component or flow, grouped by rule, each with
 * "why it fired" (rule evidence) — P3-33 / P3-35. Clicking a threat opens it
 * in the results panel.
 */
import { useMemo } from "react";
import { ChevronRight, RefreshCw } from "lucide-react";
import { SeverityBadge } from "@/components/content/SeverityBadge";
import { cn } from "@/lib/utils";
import { SEVERITY_ORDER } from "../engine/severity";
import { documentFingerprint, threatResolution, tm, useTM } from "../store";
import type { GeneratedThreat } from "../types";
import { THREAT_STATUS_LABEL } from "./constants";

interface Group {
  ruleId: string;
  title: string;
  threats: GeneratedThreat[];
  top: GeneratedThreat;
}

function groupByRule(threats: GeneratedThreat[]): Group[] {
  const map = new Map<string, GeneratedThreat[]>();
  for (const t of threats) {
    const key = t.ruleId ?? t.id;
    map.set(key, [...(map.get(key) ?? []), t]);
  }
  const rank = (t: GeneratedThreat) => SEVERITY_ORDER[t.severity] * 100 + (t.residualScore ?? 0);
  return [...map.entries()]
    .map(([ruleId, ts]) => {
      const sorted = [...ts].sort((a, b) => rank(b) - rank(a));
      return { ruleId, title: sorted[0].name, threats: sorted, top: sorted[0] };
    })
    .sort((a, b) => rank(b.top) - rank(a.top) || a.ruleId.localeCompare(b.ruleId));
}

export default function NodeThreatsSection({
  nodeId,
  edgeId,
  variant,
}: {
  nodeId?: string;
  edgeId?: string;
  variant: "pane" | "sheet";
}) {
  const analysis = useTM((s) => s.analysis);
  const phase = useTM((s) => s.analysisPhase);
  const stale = useTM((s) =>
    s.analysis ? s.analysisFingerprint !== documentFingerprint(s.document) : false,
  );
  const labels = useTM((s) => s.document.nodes);
  const labelOf = useMemo(() => new Map(labels.map((n) => [n.id, n.data.label])), [labels]);

  const threats = useMemo(
    () =>
      (analysis?.threats ?? []).filter((t) =>
        edgeId
          ? t.affectedEdgeIds.includes(edgeId)
          : nodeId
            ? t.affectedNodeIds.includes(nodeId)
            : false,
      ),
    [analysis, nodeId, edgeId],
  );
  const groups = useMemo(() => groupByRule(threats), [threats]);

  if (!analysis)
    return (
      <div className="space-y-2">
        <p className="text-[11px] text-muted-foreground">
          No analysis yet. Run it to see the threats on this {edgeId ? "flow" : "component"}.
        </p>
        <button
          type="button"
          disabled={phase === "running"}
          onClick={() => void tm().analyze()}
          className="inline-flex items-center gap-1 rounded border px-2 py-1 text-[11px] hover:bg-accent disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3 w-3", phase === "running" && "animate-spin")} aria-hidden />
          Run analysis
        </button>
      </div>
    );

  const open = (t: GeneratedThreat) =>
    tm().setUi({
      selectedThreatId: t.id,
      resultsTab: "threats",
      resultsOpen: true,
      ...(variant === "sheet" ? { sheet: "results" as const } : {}),
    });

  return (
    <div className="space-y-2">
      {stale && (
        <p className="flex items-center justify-between gap-2 rounded-md border border-dashed px-2 py-1 text-[11px] text-muted-foreground">
          The model changed since this analysis.
          <button
            type="button"
            onClick={() => void tm().analyze()}
            className="shrink-0 rounded border px-1.5 py-0.5 hover:bg-accent"
          >
            Re-run
          </button>
        </p>
      )}
      {groups.length === 0 && (
        <p className="text-[11px] text-muted-foreground">
          No threats on this {edgeId ? "flow" : "component"}.
        </p>
      )}
      <ul className="space-y-2">
        {groups.map((g) => (
          <li key={g.ruleId} className="rounded-md border">
            <div className="flex items-center gap-2 border-b bg-muted/40 px-2 py-1">
              <span className="font-mono text-[11px] text-muted-foreground">{g.ruleId}</span>
              <span className="min-w-0 flex-1 truncate text-xs font-medium" title={g.title}>
                {g.title}
              </span>
              {g.threats.length > 1 && (
                <span className="text-[11px] text-muted-foreground">×{g.threats.length}</span>
              )}
            </div>
            <ul>
              {g.threats.map((t) => {
                const resolved = threatResolution(t) === "resolved";
                return (
                  <li key={t.id} className="border-b last:border-b-0">
                    <button
                      type="button"
                      onClick={() => open(t)}
                      className="flex w-full items-start gap-2 px-2 py-1.5 text-left hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                      aria-label={`Open threat ${t.name} in results`}
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <SeverityBadge band={t.severity} size="xs" />
                          <span className="text-[11px] text-muted-foreground">
                            residual {t.residualScore ?? t.score ?? 0}/25
                          </span>
                          <span
                            className={cn(
                              "rounded px-1 text-[11px]",
                              resolved
                                ? "bg-muted text-muted-foreground line-through"
                                : "bg-muted/60",
                            )}
                          >
                            {THREAT_STATUS_LABEL[t.status ?? "open"] ?? t.status}
                            {t.mitigationState === "mitigated" && !t.status ? " · mitigated" : ""}
                            {t.mitigationState === "partial" ? " · partly mitigated" : ""}
                          </span>
                          {t.inherited && (
                            <span className="text-[11px] text-muted-foreground">
                              inherited
                              {t.sourceNodeId && labelOf.get(t.sourceNodeId)
                                ? ` from ${labelOf.get(t.sourceNodeId)}`
                                : ""}
                              {t.hops ? ` · ${t.hops} hop${t.hops === 1 ? "" : "s"}` : ""}
                            </span>
                          )}
                        </div>
                        {(t.why?.evidence?.length ?? 0) > 0 && (
                          <ul className="list-disc space-y-0.5 pl-4 text-[11px] leading-snug text-muted-foreground">
                            {t.why!.evidence.slice(0, 3).map((e, i) => (
                              <li key={i}>{e}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <ChevronRight
                        className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

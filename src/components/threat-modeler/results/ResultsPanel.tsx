/**
 * Results panel (P3-34/35/36): one tablist — Threats, Paths, Compliance,
 * Mappings, Dashboard — over the latest analysis, with stale / what-if /
 * read-only banners and empty states. Fills its parent; the container decides
 * where it lives (right pane at `lg`, bottom sheet below).
 */
import {
  Suspense,
  lazy,
  useEffect,
  useId,
  useRef,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  AlertTriangle,
  FlaskConical,
  Loader2,
  Lock,
  PanelRightClose,
  Play,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AnalysisResult } from "../engine/analyze";
import { useCanvasActions } from "../hooks/useCanvasActions";
import { documentFingerprint, tm, useTM, type ResultsTab } from "../store";
import { ComplianceTab } from "./ComplianceTab";
import { MappingsTab } from "./MappingsTab";
import { PathsTab } from "./PathsTab";
import { ThreatsTab } from "./ThreatsTab";
import { complianceGapCount, useReadOnly, useThreatsView } from "./helpers";

const ReportDashboard = lazy(() => import("../ReportDashboard"));

const TABS: { id: ResultsTab; label: string }[] = [
  { id: "threats", label: "Threats" },
  { id: "paths", label: "Paths" },
  { id: "compliance", label: "Compliance" },
  { id: "mappings", label: "Mappings" },
  { id: "dashboard", label: "Dashboard" },
];

function tabCount(id: ResultsTab, a: AnalysisResult | null): number | null {
  if (!a) return null;
  switch (id) {
    case "threats":
      return a.summary.open;
    case "paths":
      return a.paths.total;
    case "compliance":
      return complianceGapCount(a);
    default:
      return null;
  }
}

const COUNT_HINT: Partial<Record<ResultsTab, string>> = {
  threats: "open threats",
  paths: "attack paths",
  compliance: "gaps",
};

function DashboardSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading dashboard">
      {[96, 180, 140, 120].map((h, i) => (
        <div
          key={i}
          className="animate-pulse rounded-md bg-muted motion-reduce:animate-none"
          style={{ height: h }}
        />
      ))}
    </div>
  );
}

function Banner({
  tone,
  icon: Icon,
  children,
  action,
}: {
  tone: "warn" | "info" | "error";
  icon: typeof AlertTriangle;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-center gap-2 border-b px-3 py-1.5 text-[11px]",
        tone === "warn" && "bg-amber-500/10 text-amber-900 dark:text-amber-200",
        tone === "info" && "bg-primary/10 text-foreground",
        tone === "error" && "bg-destructive/10 text-destructive",
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="min-w-0 flex-1">{children}</span>
      {action}
    </div>
  );
}

function EmptyState({
  hasNodes,
  running,
  error,
}: {
  hasNodes: boolean;
  running: boolean;
  error: string | null;
}) {
  if (!hasNodes)
    return (
      <div className="flex flex-col items-center gap-2 p-6 text-center text-xs text-muted-foreground">
        <p className="font-medium text-foreground">No components yet</p>
        <p>Drag components onto the canvas and connect them, or start from a template.</p>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={() => tm().openDialog("templates")}
        >
          Browse templates
        </Button>
      </div>
    );
  return (
    <div className="flex flex-col items-center gap-2 p-6 text-center text-xs text-muted-foreground">
      {error ? (
        <p role="alert" className="text-destructive">
          Analysis failed: {error}
        </p>
      ) : (
        <>
          <p className="font-medium text-foreground">Not analysed yet</p>
          <p>Run the analysis to find threats, attack paths and compliance gaps in this model.</p>
        </>
      )}
      <Button
        size="sm"
        className="h-8 gap-1.5 text-xs"
        disabled={running}
        onClick={() => void tm().analyze()}
      >
        {running ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        ) : (
          <Play className="h-3.5 w-3.5" aria-hidden />
        )}
        {running ? "Analysing…" : error ? "Try again" : "Run analysis"}
      </Button>
    </div>
  );
}

export default function ResultsPanel({ variant }: { variant: "pane" | "sheet" }) {
  const uid = useId();
  const actions = useCanvasActions();
  const analysis = useTM((s) => s.analysis);
  const tab = useTM((s) => s.ui.resultsTab);
  const running = useTM((s) => s.analysisPhase === "running");
  const error = useTM((s) => s.analysisError);
  const hasNodes = useTM((s) => s.document.nodes.length > 0);
  const stale = useTM(
    (s) => !!s.analysis && s.analysisFingerprint !== documentFingerprint(s.document),
  );
  const whatIf = useTM((s) => s.ui.whatIf);
  const selectedThreatId = useTM((s) => s.ui.selectedThreatId);
  const readOnly = useReadOnly();
  const view = useThreatsView();
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // A threat picked elsewhere (canvas badge, `?threat=` link) opens the Threats tab.
  const lastSelected = useRef<string | null>(null);
  useEffect(() => {
    if (
      selectedThreatId &&
      selectedThreatId !== lastSelected.current &&
      tm().ui.resultsTab !== "threats"
    )
      tm().setUi({ resultsTab: "threats" });
    lastSelected.current = selectedThreatId;
  }, [selectedThreatId]);

  const setTab = (id: ResultsTab, focus = false) => {
    tm().setUi({ resultsTab: id });
    if (focus) tabRefs.current[id]?.focus();
  };
  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const i = TABS.findIndex((t) => t.id === tab);
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % TABS.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp")
      next = (i - 1 + TABS.length) % TABS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = TABS.length - 1;
    if (next < 0) return;
    e.preventDefault();
    setTab(TABS[next].id, true);
  };

  const panelId = (id: ResultsTab) => `${uid}-panel-${id}`;
  const tabId = (id: ResultsTab) => `${uid}-tab-${id}`;

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      {(variant === "pane" || analysis) && (
        <div className="flex items-center gap-2 border-b px-3 py-2">
          {variant === "pane" && <h2 className="text-sm font-semibold">Results</h2>}
          {analysis && (
            <span className="text-[11px] text-muted-foreground">
              Risk {analysis.modelScore.overall}/100 · {analysis.modelScore.label}
            </span>
          )}
          <span className="ml-auto flex items-center gap-1">
            {analysis && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                disabled={running}
                onClick={() => void tm().analyze()}
              >
                {running ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                )}
                {running ? "Analysing…" : "Re-run"}
              </Button>
            )}
            {variant === "pane" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                aria-label="Hide results panel"
                onClick={() => tm().setUi({ resultsOpen: false })}
              >
                <PanelRightClose className="h-4 w-4" aria-hidden />
              </Button>
            )}
          </span>
        </div>
      )}

      <div
        role="tablist"
        aria-label="Analysis results"
        className="flex shrink-0 gap-0.5 overflow-x-auto border-b px-2"
      >
        {TABS.map((t) => {
          const selected = tab === t.id;
          const count = tabCount(t.id, analysis);
          return (
            <button
              key={t.id}
              ref={(el) => {
                tabRefs.current[t.id] = el;
              }}
              id={tabId(t.id)}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={panelId(t.id)}
              tabIndex={selected ? 0 : -1}
              onClick={() => setTab(t.id)}
              onKeyDown={onTabKey}
              className={cn(
                "-mb-px flex shrink-0 items-center gap-1 border-b-2 px-2 py-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                selected
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              {count !== null && (
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[11px] tabular-nums",
                    selected ? "bg-primary/15 text-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  {count}
                  <span className="sr-only"> {COUNT_HINT[t.id]}</span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {readOnly && (
        <Banner
          tone="info"
          icon={Lock}
          action={
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 text-[11px]"
              onClick={() => tm().makeCopy()}
            >
              Make a copy
            </Button>
          }
        >
          Shared model (read-only) — statuses and suppressions can't be changed.
        </Banner>
      )}
      {stale && (
        <Banner
          tone="warn"
          icon={AlertTriangle}
          action={
            <Button
              variant="outline"
              size="sm"
              className="h-6 gap-1 px-2 text-[11px]"
              disabled={running}
              onClick={() => void tm().analyze()}
            >
              {running && <Loader2 className="h-3 w-3 animate-spin" aria-hidden />}
              Re-run
            </Button>
          }
        >
          Model changed since this analysis.
        </Banner>
      )}
      {analysis && error && (
        <Banner tone="error" icon={AlertTriangle}>
          Last run failed: {error}. Showing the previous results.
        </Banner>
      )}
      {whatIf.active && (
        <Banner
          tone="info"
          icon={FlaskConical}
          action={
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 text-[11px]"
              onClick={() => tm().setUi({ whatIf: { active: false, result: null } })}
            >
              Exit
            </Button>
          }
        >
          {whatIf.result ? (
            <>
              <strong>What if “{whatIf.result.label}” were removed:</strong> open threats{" "}
              {whatIf.result.before.open} → {whatIf.result.after.open}, risk{" "}
              {whatIf.result.before.score} → {whatIf.result.after.score}, paths{" "}
              {whatIf.result.before.paths} → {whatIf.result.after.paths}. Nothing was changed.
            </>
          ) : (
            "What-if mode: choose “Simulate removal” on a component to preview its effect."
          )}
        </Banner>
      )}

      {TABS.map(({ id }) => (
        <div
          key={id}
          role="tabpanel"
          id={panelId(id)}
          aria-labelledby={tabId(id)}
          hidden={tab !== id}
          tabIndex={0}
          className={cn(
            "min-h-0 flex-1 overflow-y-auto focus-visible:outline-none",
            variant === "sheet" ? "p-2" : "p-3",
          )}
        >
          {tab !== id ? null : !analysis ? (
            <EmptyState hasNodes={hasNodes} running={running} error={error} />
          ) : id === "threats" ? (
            <ThreatsTab analysis={analysis} view={view} />
          ) : id === "paths" ? (
            <PathsTab analysis={analysis} />
          ) : id === "compliance" ? (
            <ComplianceTab analysis={analysis} />
          ) : id === "mappings" ? (
            <MappingsTab analysis={analysis} />
          ) : (
            <Suspense fallback={<DashboardSkeleton />}>
              <ReportDashboard analysis={analysis} onLocate={actions.locate} />
            </Suspense>
          )}
        </div>
      ))}
    </div>
  );
}

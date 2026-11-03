import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { toast } from "sonner";
import { ListChecks, PanelBottomOpen, Puzzle, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import CanvasContextMenu from "./CanvasContextMenu";
import CanvasToolbar from "./CanvasToolbar";
import ComponentPalette from "./ComponentPalette";
import AnalysisSweep from "./canvas/AnalysisSweep";
import { ModeBanner, ModeHint } from "./canvas/CanvasBanners";
import CanvasLegend from "./canvas/CanvasLegend";
import EmptyCanvasCard from "./canvas/EmptyCanvasCard";
import FlowCanvas from "./canvas/FlowCanvas";
import PathPlaybackBar from "./canvas/PathPlaybackBar";
import DialogHost from "./dialogs/DialogHost";
import { useCanvasActions } from "./hooks/useCanvasActions";
import { useLiveAnalysis } from "./hooks/useLiveAnalysis";
import { useIsDesktop, useMediaQuery } from "./hooks/useMediaQuery";
import { useModelerKeyboard } from "./hooks/useModelerKeyboard";
import { readPrefs } from "./persistence";
import PropertyPanel from "./properties/PropertyPanel";
import ResultsPanel from "./results/ResultsPanel";
import { tm, useTM } from "./store";
import { BottomSheet } from "./ui/BottomSheet";

const RESULTS_MIN = 300;
const RESULTS_MAX = 720;
const clampWidth = (w: number) => Math.round(Math.max(RESULTS_MIN, Math.min(RESULTS_MAX, w)));

/**
 * Threat Modeler container (P3-21): store-driven three-pane layout. Palette ·
 * canvas · properties/results on `lg+`; canvas with bottom sheets below.
 * All state lives in the zustand store (`./store`); this file only lays out.
 */
export default function ThreatModelCanvas() {
  return (
    <ReactFlowProvider>
      <ModelerShell />
    </ReactFlowProvider>
  );
}

function ModelerShell() {
  const actions = useCanvasActions();
  const canvasRef = useRef<HTMLDivElement>(null);
  const onKeyDown = useModelerKeyboard(canvasRef, actions);
  const desktop = useIsDesktop();
  useLiveAnalysis();
  useLifecycle(desktop);

  return (
    <div
      className="flex h-full min-h-0 flex-col bg-background text-foreground"
      onKeyDown={onKeyDown}
    >
      <ModeBanner />
      <CanvasToolbar />
      <div className="flex min-h-0 flex-1">
        {desktop && <DesktopPalette />}
        <div className="relative min-w-0 flex-1">
          <CanvasRegion canvasRef={canvasRef} />
        </div>
        {desktop && <RightPanes />}
      </div>
      {!desktop && <MobileBar />}
      {!desktop && <MobileSheets />}
      <DialogHost />
    </div>
  );
}

/** Autosave flush, onboarding auto-open and the "moved to My models" notice. */
function useLifecycle(desktop: boolean) {
  const bootstrapped = useTM((s) => s.bootstrappedSearch !== null);
  const stashed = useTM((s) => s.stashedModel);

  useEffect(() => {
    const flush = () => tm().flushAutosave();
    window.addEventListener("beforeunload", flush);
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("beforeunload", flush);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, []);

  useEffect(() => {
    if (!bootstrapped || !desktop) return;
    const s = tm();
    if (
      readPrefs().onboardingSeen ||
      s.document.nodes.length ||
      s.persist === "readonly" ||
      s.ui.dialog
    )
      return;
    s.openDialog("onboarding");
    // Only once per page load; the overlay records onboardingSeen itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootstrapped]);

  useEffect(() => {
    if (!stashed) return;
    toast.info(`Your previous canvas “${stashed.name}” was saved to My models`, {
      action: { label: "Open", onClick: () => tm().openDialog("models", { mode: "load" }) },
    });
  }, [stashed]);
}

function CanvasRegion({ canvasRef }: { canvasRef: React.RefObject<HTMLDivElement> }) {
  const actions = useCanvasActions();
  const empty = useTM((s) => s.document.nodes.length === 0);
  const readOnly = useTM((s) => s.persist === "readonly");
  const bootstrapped = useTM((s) => s.bootstrappedSearch !== null);

  return (
    <CanvasContextMenu actions={actions}>
      <div
        ref={canvasRef}
        role="region"
        aria-label="Threat model canvas. Press question mark for keyboard shortcuts."
        tabIndex={0}
        data-tour="canvas"
        className="tm-canvas absolute inset-0 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <FlowCanvas />
        <AnalysisSweep />
        <PathPlaybackBar />
        <ModeHint />
        <CanvasLegend className="absolute bottom-3 left-3 z-10 hidden sm:block" />
        {empty && bootstrapped && !readOnly && <EmptyCanvasCard />}
      </div>
    </CanvasContextMenu>
  );
}

function DesktopPalette() {
  const mode = useTM((s) => s.ui.paletteMode);
  return <ComponentPalette variant={mode === "rail" ? "rail" : "pane"} />;
}

/** Property pane (when something is selected) and the resizable results pane. */
function RightPanes() {
  const hasSelection = useTM((s) => !!(s.ui.selectedNodeId || s.ui.selectedEdgeId));
  const resultsOpen = useTM((s) => s.ui.resultsOpen);
  const wide = useMediaQuery("(min-width: 1280px)");
  // Between lg and xl there is room for one side pane: properties win while selected.
  const showResults = resultsOpen && (wide || !hasSelection);

  return (
    <>
      {hasSelection && (
        <div className="w-80 shrink-0">
          <PropertyPanel variant="pane" />
        </div>
      )}
      {showResults ? (
        <ResultsPane />
      ) : (
        <CollapsedResults hiddenBySelection={resultsOpen && hasSelection} />
      )}
    </>
  );
}

function ResultsPane() {
  const stored = useTM((s) => s.ui.resultsWidth);
  const [drag, setDrag] = useState<number | null>(null);
  const start = useRef<{ x: number; w: number } | null>(null);
  const width = clampWidth(drag ?? stored);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    start.current = { x: e.clientX, w: width };
    setDrag(width);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!start.current) return;
    setDrag(clampWidth(start.current.w + (start.current.x - e.clientX)));
  };
  const onPointerUp = () => {
    if (!start.current) return;
    start.current = null;
    if (drag !== null) tm().setUi({ resultsWidth: clampWidth(drag) });
    setDrag(null);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 64 : 16;
    let next: number | null = null;
    if (e.key === "ArrowLeft") next = width + step;
    else if (e.key === "ArrowRight") next = width - step;
    else if (e.key === "Home") next = RESULTS_MIN;
    else if (e.key === "End") next = RESULTS_MAX;
    else if (e.key === "Enter") {
      e.preventDefault();
      tm().setUi({ resultsOpen: false });
      return;
    }
    if (next === null) return;
    e.preventDefault();
    e.stopPropagation();
    tm().setUi({ resultsWidth: clampWidth(next) });
  };

  return (
    <div className="relative flex shrink-0 border-l" style={{ width }}>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize results panel (arrow keys; Enter hides it)"
        aria-valuemin={RESULTS_MIN}
        aria-valuemax={RESULTS_MAX}
        aria-valuenow={width}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        onDoubleClick={() => tm().setUi({ resultsWidth: 380 })}
        className={cn(
          "absolute inset-y-0 -left-1.5 z-20 w-3 cursor-col-resize touch-none outline-none",
          "after:absolute after:inset-y-0 after:left-1/2 after:w-0.5 after:-translate-x-1/2 after:bg-transparent after:transition-colors",
          "hover:after:bg-primary/50 focus-visible:after:bg-primary",
          drag !== null && "after:bg-primary",
        )}
      />
      <div className="min-w-0 flex-1">
        <ResultsPanel variant="pane" />
      </div>
    </div>
  );
}

function CollapsedResults({ hiddenBySelection }: { hiddenBySelection: boolean }) {
  const open = useTM((s) => s.analysis?.summary.open ?? null);
  const show = () => {
    if (hiddenBySelection) tm().setUi({ selectedNodeId: null, selectedEdgeId: null });
    tm().setUi({ resultsOpen: true });
  };
  return (
    <button
      type="button"
      onClick={show}
      aria-label={`Show results${open !== null ? ` (${open} open threats)` : ""}`}
      className="flex w-9 shrink-0 flex-col items-center gap-2 border-l bg-muted/30 py-3 text-xs hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
    >
      <ListChecks className="h-4 w-4" aria-hidden />
      <span className="[writing-mode:vertical-rl]">Results</span>
      {open !== null && (
        <span className="rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
          {open}
        </span>
      )}
    </button>
  );
}

function MobileBar() {
  const open = useTM((s) => s.analysis?.summary.open ?? null);
  const hasSelection = useTM((s) => !!(s.ui.selectedNodeId || s.ui.selectedEdgeId));
  const readOnly = useTM((s) => s.persist === "readonly");
  const item = "flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[11px] disabled:opacity-40";
  return (
    <nav
      aria-label="Modeler panels"
      className="flex shrink-0 border-t bg-card pb-[env(safe-area-inset-bottom)]"
    >
      <button
        type="button"
        className={item}
        onClick={() => tm().setUi({ sheet: "palette" })}
        disabled={readOnly}
      >
        <Puzzle className="h-5 w-5" aria-hidden />
        Components
      </button>
      <button
        type="button"
        className={item}
        onClick={() => tm().setUi({ sheet: "properties" })}
        disabled={!hasSelection}
      >
        <SlidersHorizontal className="h-5 w-5" aria-hidden />
        Properties
      </button>
      <button type="button" className={item} onClick={() => tm().setUi({ sheet: "results" })}>
        <PanelBottomOpen className="h-5 w-5" aria-hidden />
        Results{open !== null ? ` (${open})` : ""}
      </button>
    </nav>
  );
}

function MobileSheets() {
  const sheet = useTM((s) => s.ui.sheet);
  const close = useCallback((open: boolean) => {
    if (!open) tm().setUi({ sheet: null });
  }, []);
  return (
    <>
      <BottomSheet
        open={sheet === "palette"}
        onOpenChange={close}
        title="Components"
        description="Tap a component to add it to the canvas."
      >
        <ComponentPalette variant="sheet" onAdded={() => tm().setUi({ sheet: null })} />
      </BottomSheet>
      <BottomSheet open={sheet === "properties"} onOpenChange={close} title="Properties">
        <PropertyPanel variant="sheet" />
      </BottomSheet>
      <BottomSheet open={sheet === "results"} onOpenChange={close} title="Results" height="85dvh">
        <ResultsPanel variant="sheet" />
      </BottomSheet>
    </>
  );
}

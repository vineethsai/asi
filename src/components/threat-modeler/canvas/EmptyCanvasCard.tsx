import { FileUp, LayoutTemplate, MousePointerClick, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCanvasActions } from "../hooks/useCanvasActions";
import { useImports } from "../hooks/useImports";
import { useIsDesktop } from "../hooks/useMediaQuery";
import { tm } from "../store";

const QUICK_STARTS = [
  { id: "simple-agent", label: "Simple agent" },
  { id: "mcp-coding-agent", label: "MCP coding agent" },
  { id: "support-rag-hitl", label: "Support agent + RAG + HITL" },
];

/** Centred empty state (P3-30: no longer pinned at `left: 224px`). */
export default function EmptyCanvasCard() {
  const actions = useCanvasActions();
  const { importFile } = useImports();
  const desktop = useIsDesktop();

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-4">
      <section
        aria-labelledby="tm-empty-title"
        className="pointer-events-auto w-full max-w-md rounded-xl border bg-card/95 p-5 text-center shadow-lg backdrop-blur"
      >
        <MousePointerClick className="mx-auto mb-2 h-7 w-7 text-primary" aria-hidden />
        <h2 id="tm-empty-title" className="text-base font-semibold">
          Start your threat model
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {desktop
            ? "Drag a component from the palette, or select it and press Enter to place it here. Then connect components and run the analysis."
            : "Tap a component in the palette to add it. Then connect components and run the analysis."}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {!desktop && (
            <Button size="sm" onClick={() => tm().setUi({ sheet: "palette" })}>
              Add components
            </Button>
          )}
          <Button
            size="sm"
            variant={desktop ? "default" : "outline"}
            onClick={() => tm().openDialog("templates")}
          >
            <LayoutTemplate className="mr-1.5 h-4 w-4" aria-hidden />
            Browse templates
          </Button>
          <Button size="sm" variant="outline" onClick={() => tm().openDialog("onboarding")}>
            <Sparkles className="mr-1.5 h-4 w-4" aria-hidden />
            Guided build
          </Button>
          <Button size="sm" variant="outline" onClick={() => void importFile()}>
            <FileUp className="mr-1.5 h-4 w-4" aria-hidden />
            Import
          </Button>
        </div>
        <div className="mt-4 border-t pt-3">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Quick start
          </p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {QUICK_STARTS.map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => actions.loadTemplate(q.id)}
                className="rounded-full border px-2.5 py-1 text-xs hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {q.label}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

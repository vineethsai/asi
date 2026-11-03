/**
 * One property panel for components, trust boundaries and data flows (P3-33).
 * `variant="pane"` is the right-hand column on desktop; `variant="sheet"` is
 * the bottom sheet below `lg`. Must render inside <ReactFlowProvider>.
 */
import { Lock, MousePointerClick, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { resolveKind } from "../engine/semantics";
import { selectNodes } from "../hooks/useCanvasActions";
import { tm, useTM } from "../store";
import { KIND_LABEL } from "./constants";
import EdgePanel from "./EdgePanel";
import NodePanel from "./NodePanel";
import { useAutoPan } from "./useAutoPan";

function close(variant: "pane" | "sheet") {
  tm().setUi((ui) => ({
    selectedNodeId: null,
    selectedEdgeId: null,
    ...(variant === "sheet" && ui.sheet === "properties" ? { sheet: null } : {}),
  }));
  selectNodes([]);
}

export default function PropertyPanel({ variant }: { variant: "pane" | "sheet" }) {
  const nodeId = useTM((s) => s.ui.selectedNodeId);
  const edgeId = useTM((s) => s.ui.selectedEdgeId);
  const node = useTM((s) => (nodeId ? s.document.nodes.find((n) => n.id === nodeId) : undefined));
  const edge = useTM((s) =>
    !node && edgeId ? s.document.edges.find((e) => e.id === edgeId) : undefined,
  );
  const multi = useTM((s) => s.document.nodes.filter((n) => n.selected).length);
  const readonly = useTM((s) => s.persist === "readonly");
  const sourceLabel = useTM((s) =>
    edge ? s.document.nodes.find((n) => n.id === edge.source)?.data.label : undefined,
  );
  const targetLabel = useTM((s) =>
    edge ? s.document.nodes.find((n) => n.id === edge.target)?.data.label : undefined,
  );

  useAutoPan({ nodeId: node?.id, edge }, variant);

  const isBoundary = node?.type === "trustBoundary";
  const kicker = node
    ? isBoundary
      ? "Trust boundary"
      : (KIND_LABEL[resolveKind(node)] ?? "Component")
    : edge
      ? "Data flow"
      : "";
  const title = node
    ? node.data.label || node.id
    : edge
      ? edge.data?.label || `${sourceLabel ?? edge.source} → ${targetLabel ?? edge.target}`
      : "";
  const Tag = variant === "pane" ? "aside" : "section";

  return (
    <Tag
      aria-label="Properties"
      className={cn(
        "tm-property-panel flex min-h-0 flex-col bg-background text-foreground",
        variant === "pane" ? "h-full border-l" : "h-full",
      )}
    >
      {node || edge ? (
        <>
          <header className="flex items-start gap-2 border-b px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {kicker}
              </p>
              <h2 className="truncate text-sm font-semibold" title={title}>
                {title}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => close(variant)}
              aria-label="Close properties"
              className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </header>
          {readonly && (
            <p className="flex items-center gap-1.5 border-b bg-muted/50 px-3 py-1.5 text-[11px] text-muted-foreground">
              <Lock className="h-3 w-3" aria-hidden />
              Read-only model. Make a copy to edit it.
            </p>
          )}
          <ScrollArea className="min-h-0 flex-1">
            <div className="pb-6">
              {node ? (
                <NodePanel key={node.id} node={node} variant={variant} />
              ) : edge ? (
                <EdgePanel key={edge.id} edge={edge} variant={variant} />
              ) : null}
            </div>
          </ScrollArea>
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
          <MousePointerClick className="h-5 w-5 text-muted-foreground" aria-hidden />
          <p className="text-xs text-muted-foreground">
            {multi > 1
              ? `${multi} components selected. Select one to edit its properties.`
              : "Select a component or data flow to see and edit its properties."}
          </p>
        </div>
      )}
    </Tag>
  );
}

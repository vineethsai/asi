import { useRef, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowDownToLine,
  ArrowUp,
  ArrowUpToLine,
  Boxes,
  CheckSquare,
  ClipboardPaste,
  Copy,
  CopyPlus,
  FlaskConical,
  Link2,
  Maximize2,
  PanelRight,
  Shield,
  Trash2,
  Wand2,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { selectNodes, type CanvasActions } from "./hooks/useCanvasActions";
import { shortcutHint } from "./shortcuts";
import { tm, useTM } from "./store";

interface Target {
  nodeId: string | null;
  edgeId: string | null;
  x: number;
  y: number;
}

function targetOf(e: { target: EventTarget | null; clientX: number; clientY: number }): Target {
  const el = e.target instanceof Element ? e.target : null;
  return {
    nodeId: el?.closest(".react-flow__node")?.getAttribute("data-id") ?? null,
    edgeId: el?.closest(".react-flow__edge")?.getAttribute("data-id") ?? null,
    x: e.clientX,
    y: e.clientY,
  };
}

/**
 * Right-click / long-press (Radix handles touch long-press) menu for the
 * canvas. Trust level and other properties live in the property panel only
 * (P3-33); this menu acts on the selection, selecting the clicked element first.
 */
export default function CanvasContextMenu({
  actions,
  children,
}: {
  actions: CanvasActions;
  children: ReactNode;
}) {
  const target = useRef<Target>({ nodeId: null, edgeId: null, x: 0, y: 0 });
  const readOnly = useTM((s) => s.persist === "readonly");
  const selectedNodes = useTM((s) => s.document.nodes.filter((n) => n.selected).length);
  const selectedEdge = useTM((s) => s.ui.selectedEdgeId);
  const single = useTM((s) => {
    const sel = s.document.nodes.filter((n) => n.selected);
    return sel.length === 1 ? sel[0] : null;
  });
  const empty = useTM((s) => s.document.nodes.length === 0);

  const record = (e: React.MouseEvent | React.PointerEvent) => {
    target.current = targetOf(e);
  };

  const onOpenChange = (open: boolean) => {
    if (!open) return;
    const { nodeId, edgeId } = target.current;
    const s = tm();
    if (nodeId) {
      if (!s.document.nodes.find((n) => n.id === nodeId)?.selected) selectNodes([nodeId]);
    } else if (edgeId) {
      s.setGraph((ns, es) => ({
        nodes: ns.map((n) => (n.selected ? { ...n, selected: false } : n)),
        edges: es.map((e) =>
          e.selected === (e.id === edgeId) ? e : { ...e, selected: e.id === edgeId },
        ),
      }));
      s.setUi({ selectedNodeId: null, selectedEdgeId: edgeId });
    }
  };

  const openProperties = () => {
    if (!window.matchMedia("(min-width: 1024px)").matches) tm().setUi({ sheet: "properties" });
  };
  const at = () => actions.rf.screenToFlowPosition({ x: target.current.x, y: target.current.y });
  const hasNode = selectedNodes > 0;
  const isBoundary = single?.type === "trustBoundary";

  return (
    <ContextMenu onOpenChange={onOpenChange}>
      <ContextMenuTrigger asChild onContextMenuCapture={record} onPointerDownCapture={record}>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-60">
        {hasNode && (
          <>
            <ContextMenuLabel className="truncate text-xs text-muted-foreground">
              {single ? single.data.label : `${selectedNodes} components`}
            </ContextMenuLabel>
            {single && (
              <ContextMenuItem onSelect={openProperties}>
                <PanelRight className="mr-2 h-4 w-4" aria-hidden /> Properties
              </ContextMenuItem>
            )}
            {single && !isBoundary && !readOnly && (
              <ContextMenuItem onSelect={() => actions.startConnect(single.id)}>
                <Link2 className="mr-2 h-4 w-4" aria-hidden /> Connect from here
                <ContextMenuShortcut>{shortcutHint("connect")}</ContextMenuShortcut>
              </ContextMenuItem>
            )}
            {single && !isBoundary && (
              <ContextMenuItem onSelect={() => tm().simulateRemoval(single.id)} disabled={empty}>
                <FlaskConical className="mr-2 h-4 w-4" aria-hidden /> What if it were removed?
              </ContextMenuItem>
            )}
            {!readOnly && (
              <>
                <ContextMenuSeparator />
                <ContextMenuItem onSelect={actions.duplicate}>
                  <CopyPlus className="mr-2 h-4 w-4" aria-hidden /> Duplicate
                  <ContextMenuShortcut>{shortcutHint("duplicate")}</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem onSelect={actions.copy}>
                  <Copy className="mr-2 h-4 w-4" aria-hidden /> Copy
                  <ContextMenuShortcut>{shortcutHint("copy")}</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem onSelect={actions.group}>
                  <Boxes className="mr-2 h-4 w-4" aria-hidden /> Group in trust boundary
                  <ContextMenuShortcut>{shortcutHint("group")}</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuSub>
                  <ContextMenuSubTrigger>
                    <ArrowUpToLine className="mr-2 h-4 w-4" aria-hidden /> Arrange
                  </ContextMenuSubTrigger>
                  <ContextMenuSubContent className="w-48">
                    <ContextMenuItem onSelect={() => actions.reorder("front")}>
                      <ArrowUpToLine className="mr-2 h-4 w-4" aria-hidden /> Bring to front
                    </ContextMenuItem>
                    <ContextMenuItem onSelect={() => actions.reorder("forward")}>
                      <ArrowUp className="mr-2 h-4 w-4" aria-hidden /> Bring forward
                    </ContextMenuItem>
                    <ContextMenuItem onSelect={() => actions.reorder("backward")}>
                      <ArrowDown className="mr-2 h-4 w-4" aria-hidden /> Send backward
                    </ContextMenuItem>
                    <ContextMenuItem onSelect={() => actions.reorder("back")}>
                      <ArrowDownToLine className="mr-2 h-4 w-4" aria-hidden /> Send to back
                    </ContextMenuItem>
                  </ContextMenuSubContent>
                </ContextMenuSub>
                <ContextMenuSeparator />
                <ContextMenuItem
                  onSelect={actions.deleteSelection}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" aria-hidden /> Delete
                  <ContextMenuShortcut>{shortcutHint("delete")}</ContextMenuShortcut>
                </ContextMenuItem>
              </>
            )}
            <ContextMenuSeparator />
          </>
        )}
        {!hasNode && selectedEdge && (
          <>
            <ContextMenuItem onSelect={openProperties}>
              <PanelRight className="mr-2 h-4 w-4" aria-hidden /> Data flow properties
            </ContextMenuItem>
            {!readOnly && (
              <ContextMenuItem
                onSelect={actions.deleteSelection}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" aria-hidden /> Delete data flow
              </ContextMenuItem>
            )}
            <ContextMenuSeparator />
          </>
        )}
        {!readOnly && (
          <>
            <ContextMenuItem onSelect={() => actions.paste()} disabled={!actions.hasClipboard()}>
              <ClipboardPaste className="mr-2 h-4 w-4" aria-hidden /> Paste
              <ContextMenuShortcut>{shortcutHint("paste")}</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => actions.addEntryById("dfd-trust", at())}>
              <Shield className="mr-2 h-4 w-4" aria-hidden /> Add trust boundary here
            </ContextMenuItem>
            <ContextMenuItem onSelect={actions.tidy} disabled={empty}>
              <Wand2 className="mr-2 h-4 w-4" aria-hidden /> Tidy layout
              <ContextMenuShortcut>{shortcutHint("tidy")}</ContextMenuShortcut>
            </ContextMenuItem>
          </>
        )}
        <ContextMenuItem onSelect={actions.selectAll} disabled={empty}>
          <CheckSquare className="mr-2 h-4 w-4" aria-hidden /> Select all
          <ContextMenuShortcut>{shortcutHint("selectAll")}</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onSelect={actions.fit} disabled={empty}>
          <Maximize2 className="mr-2 h-4 w-4" aria-hidden /> Fit view
          <ContextMenuShortcut>{shortcutHint("fit")}</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

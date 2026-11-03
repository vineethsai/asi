import { useCallback, useMemo, useRef } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
  type Connection,
  type EdgeChange,
  type EdgeTypes,
  type NodeChange,
  type NodeTypes,
  type OnSelectionChangeParams,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useTheme } from "@/components/layout/ThemeProvider";
import { severityColor } from "@/lib/severity";
import { applyContainment, findDropTarget } from "../canvasOps";
import { isValidConnection } from "../engine/graph";
import { useCanvasActions } from "../hooks/useCanvasActions";
import { useIsDesktop } from "../hooks/useMediaQuery";
import { PALETTE_DND_TYPE } from "../paletteData";
import { tm, useTM } from "../store";
import type { CanvasEdge, CanvasNode } from "../types";
import ActorNode from "../nodes/ActorNode";
import AgentComponentNode from "../nodes/AgentComponentNode";
import CustomComponentNode from "../nodes/CustomComponentNode";
import DataStoreNode from "../nodes/DataStoreNode";
import TrustBoundaryNode from "../nodes/TrustBoundaryNode";
import DataFlowEdge from "../edges/DataFlowEdge";
import { CANVAS_CSS } from "./canvasStyles";

const nodeTypes: NodeTypes = {
  agentComponent: AgentComponentNode,
  actor: ActorNode,
  dataStore: DataStoreNode,
  trustBoundary: TrustBoundaryNode,
  customComponent: CustomComponentNode,
};
const edgeTypes: EdgeTypes = { dataFlow: DataFlowEdge };
const defaultEdgeOptions = { type: "dataFlow" };
const SNAP: [number, number] = [16, 16];
const MULTI_KEYS = ["Meta", "Control"];

const isValid = (c: Connection | CanvasEdge) =>
  isValidConnection(c, tm().document.nodes, tm().document.edges);

/**
 * The React Flow surface. Nodes and edges come straight from the store's
 * document; transient changes (drag frames, selection, measuring) go through
 * `setGraph`, every model edit through `commit` (one undo step each).
 */
export default function FlowCanvas() {
  const nodes = useTM((s) => s.document.nodes);
  const edges = useTM((s) => s.document.edges);
  const readOnly = useTM((s) => s.persist === "readonly");
  const snapToGrid = useTM((s) => s.ui.snapToGrid);
  const whatIf = useTM((s) => s.ui.whatIf.active);
  const connecting = useTM((s) => !!s.ui.connectFrom);
  const nodeThreats = useTM((s) => s.nodeThreats);
  const { theme } = useTheme();
  const desktop = useIsDesktop();
  const actions = useCanvasActions();
  const rf = useReactFlow<CanvasNode, CanvasEdge>();
  const dragging = useRef(false);

  const onNodesChange = useCallback((changes: NodeChange<CanvasNode>[]) => {
    // Removal goes through deleteSelection (one commit, boundary children absolutised).
    const kept = changes.filter((c) => c.type !== "remove");
    if (!kept.length) return;
    const keyboardMove =
      !dragging.current &&
      kept.some((c) => c.type === "position" && c.position && !("dragging" in c && c.dragging));
    if (keyboardMove) {
      // React Flow's own arrow-key move on a focused node: record it as a nudge.
      tm().commit((doc) => ({ ...doc, nodes: applyNodeChanges(kept, doc.nodes) }), "Move", {
        coalesce: "nudge",
      });
      return;
    }
    tm().setGraph((ns, es) => ({ nodes: applyNodeChanges(kept, ns), edges: es }));
  }, []);

  const onEdgesChange = useCallback((changes: EdgeChange<CanvasEdge>[]) => {
    const kept = changes.filter((c) => c.type !== "remove");
    if (kept.length) tm().setGraph((ns, es) => ({ nodes: ns, edges: applyEdgeChanges(kept, es) }));
  }, []);

  const onSelectionChange = useCallback(({ nodes: sn, edges: se }: OnSelectionChangeParams) => {
    const ui = tm().ui;
    const nodeId = sn.length === 1 && se.length === 0 ? sn[0].id : null;
    const edgeId = se.length === 1 && sn.length === 0 ? se[0].id : null;
    if (ui.selectedNodeId !== nodeId || ui.selectedEdgeId !== edgeId)
      tm().setUi({ selectedNodeId: nodeId, selectedEdgeId: edgeId });
  }, []);

  const onNodeDragStart = useCallback(() => {
    dragging.current = true;
    tm().beginGesture();
  }, []);

  const onNodeDrag = useCallback((_e: unknown, node: CanvasNode) => {
    const target = findDropTarget(tm().document.nodes, node.id);
    if (tm().ui.dropTargetId !== target) tm().setUi({ dropTargetId: target });
  }, []);

  const onNodeDragStop = useCallback((_e: unknown, _node: CanvasNode, moved: CanvasNode[]) => {
    dragging.current = false;
    const ids = moved.map((n) => n.id);
    tm().setGraph((ns, es) => ({ nodes: applyContainment(ns, ids) ?? ns, edges: es }));
    tm().setUi({ dropTargetId: null });
    tm().endGesture(ids.length > 1 ? `Move ${ids.length} components` : "Move");
  }, []);

  const onSelectionDragStop = useCallback(
    (e: unknown, moved: CanvasNode[]) => onNodeDragStop(e, moved[0], moved),
    [onNodeDragStop],
  );

  const onConnect = useCallback(
    (c: Connection) => {
      if (c.source && c.target) actions.connect(c.source, c.target, c);
    },
    [actions],
  );

  const onReconnect = useCallback((oldEdge: CanvasEdge, c: Connection) => {
    if (!c.source || !c.target) return;
    const others = tm().document.edges.filter((e) => e.id !== oldEdge.id);
    if (!isValidConnection(c, tm().document.nodes, others)) return;
    tm().commit(
      (doc) => ({
        ...doc,
        edges: doc.edges.map((e) =>
          e.id === oldEdge.id
            ? {
                ...e,
                source: c.source!,
                target: c.target!,
                sourceHandle: c.sourceHandle,
                targetHandle: c.targetHandle,
              }
            : e,
        ),
      }),
      "Reconnect data flow",
    );
  }, []);

  const onNodeClick = useCallback(
    (_e: unknown, node: CanvasNode) => {
      const ui = tm().ui;
      if (ui.connectFrom) {
        if (node.id !== ui.connectFrom && node.type !== "trustBoundary")
          actions.connect(ui.connectFrom, node.id);
        return;
      }
      if (ui.whatIf.active) {
        tm().simulateRemoval(node.id);
        return;
      }
      if (!desktop) tm().setUi({ sheet: "properties" });
    },
    [actions, desktop],
  );

  const onPaneClick = useCallback(() => {
    const ui = tm().ui;
    if (ui.connectFrom) tm().setUi({ connectFrom: null });
    if (ui.selectedNodeId || ui.selectedEdgeId)
      tm().setUi({ selectedNodeId: null, selectedEdgeId: null });
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes(PALETTE_DND_TYPE)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      const id = e.dataTransfer.getData(PALETTE_DND_TYPE);
      if (!id) return;
      e.preventDefault();
      actions.addEntryById(id, rf.screenToFlowPosition({ x: e.clientX, y: e.clientY }));
    },
    [actions, rf],
  );

  const nodeColor = useCallback(
    (n: CanvasNode) => {
      if (n.type === "trustBoundary") return "transparent";
      const band = nodeThreats[n.id]?.band;
      return band ? severityColor(band) : "hsl(var(--muted-foreground) / 0.5)";
    },
    [nodeThreats],
  );

  const className = useMemo(
    () =>
      [
        "bg-background",
        whatIf ? "ring-2 ring-inset ring-[hsl(var(--security-medium))]" : "",
        connecting ? "cursor-crosshair" : "",
      ].join(" "),
    [whatIf, connecting],
  );

  return (
    <>
      <style>{CANVAS_CSS}</style>
      <ReactFlow<CanvasNode, CanvasEdge>
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        colorMode={theme}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onSelectionChange={onSelectionChange}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onSelectionDragStart={onNodeDragStart}
        onSelectionDragStop={onSelectionDragStop}
        onConnect={onConnect}
        isValidConnection={isValid}
        onReconnect={onReconnect}
        edgesReconnectable={!readOnly}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        deleteKeyCode={null}
        selectionKeyCode="Shift"
        multiSelectionKeyCode={MULTI_KEYS}
        snapToGrid={snapToGrid}
        snapGrid={SNAP}
        minZoom={0.1}
        maxZoom={2.5}
        zoomOnPinch
        fitView
        fitViewOptions={{ padding: 0.15 }}
        proOptions={{ hideAttribution: true }}
        className={className}
        aria-label="Threat model canvas"
      >
        <Background
          variant={snapToGrid ? BackgroundVariant.Lines : BackgroundVariant.Dots}
          gap={16}
          size={snapToGrid ? 0.5 : 1}
        />
        <Controls showInteractive={false} position="bottom-right" aria-label="Zoom controls" />
        {desktop && (
          <MiniMap<CanvasNode>
            position="top-right"
            nodeColor={nodeColor}
            nodeStrokeWidth={2}
            pannable
            zoomable
            ariaLabel="Mini map (component colour = highest open severity)"
          />
        )}
      </ReactFlow>
    </>
  );
}

import { useMemo } from "react";
import { useReactFlow } from "@xyflow/react";
import { toast } from "sonner";
import {
  applyContainment,
  connect as connectOp,
  copySelection,
  createNode,
  deleteElements,
  groupInBoundary,
  nudge as nudgeOp,
  pasteClipboard,
  reorder as reorderOp,
  type Clipboard,
} from "../canvasOps";
import { createDocument } from "../document";
import { interpolatePositions, tidyLayout } from "../layout";
import { findPaletteEntry, type PaletteEntry } from "../paletteData";
import { orderByParent, readLibrary } from "../persistence";
import { tm } from "../store";
import { ARCHITECTURE_TEMPLATES, instantiateTemplate } from "../templates";
import type { CanvasEdge, CanvasNode } from "../types";

let clipboard: Clipboard | null = null;

function reducedMotion(): boolean {
  try {
    return !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/** Ids of the selected nodes (multi-selection, else the panel selection). */
export function selectedNodeIds(): string[] {
  const s = tm();
  const multi = s.document.nodes.filter((n) => n.selected).map((n) => n.id);
  if (multi.length) return multi;
  return s.ui.selectedNodeId ? [s.ui.selectedNodeId] : [];
}

export function selectedEdgeIds(): string[] {
  const s = tm();
  const multi = s.document.edges.filter((e) => e.selected).map((e) => e.id);
  if (multi.length) return multi;
  return s.ui.selectedEdgeId ? [s.ui.selectedEdgeId] : [];
}

/** Select exactly these nodes (and clear edge selection). */
export function selectNodes(ids: string[]) {
  const set = new Set(ids);
  tm().setGraph((nodes, edges) => ({
    nodes: nodes.map((n) =>
      !!n.selected === set.has(n.id) ? n : { ...n, selected: set.has(n.id) },
    ),
    edges: edges.map((e) => (e.selected ? { ...e, selected: false } : e)),
  }));
  tm().setUi({ selectedNodeId: ids.length === 1 ? ids[0] : null, selectedEdgeId: null });
}

/**
 * Canvas actions shared by the toolbar, palette, context menu, keyboard and
 * panels. Must be used inside <ReactFlowProvider>.
 */
export function useCanvasActions() {
  const rf = useReactFlow<CanvasNode, CanvasEdge>();

  return useMemo(() => {
    const viewportCenter = () => {
      const el = document.querySelector(".tm-canvas .react-flow") as HTMLElement | null;
      const r = el?.getBoundingClientRect();
      if (!r || !r.width) return { x: 200, y: 150 };
      return rf.screenToFlowPosition({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    };

    const focusNodes = (ids: string[], padding = 0.35) => {
      if (!ids.length) return;
      // fitView({ nodes }) handles children of boundaries (absolute positions), P3-25.
      window.requestAnimationFrame(
        () =>
          void rf.fitView({
            nodes: ids.map((id) => ({ id })),
            duration: 450,
            padding,
            maxZoom: 1.4,
          }),
      );
    };

    const addEntry = (entry: PaletteEntry, at?: { x: number; y: number }): string | null => {
      const s = tm();
      if (s.persist === "readonly") return null;
      const c = at ?? viewportCenter();
      // Centre the card on the point when placing from the keyboard / tap.
      const pos = at ? c : { x: c.x - 110, y: c.y - 50 };
      const node = { ...createNode(entry, pos, s.document.nodes), selected: true };
      s.commit((doc) => {
        const nodes = orderByParent([
          ...doc.nodes.map((n) => (n.selected ? { ...n, selected: false } : n)),
          node,
        ]);
        // Dropped inside a trust boundary → becomes its child (§7.5 droppable boundaries).
        return { ...doc, nodes: applyContainment(nodes, [node.id]) ?? nodes };
      }, `Add ${entry.label}`);
      tm().setUi({ selectedNodeId: node.id, selectedEdgeId: null });
      return node.id;
    };

    const addEntryById = (id: string, at?: { x: number; y: number }) => {
      const entry = findPaletteEntry(id, tm().document.customComponents);
      return entry ? addEntry(entry, at) : null;
    };

    const deleteSelection = () => {
      const nodeIds = selectedNodeIds();
      const edgeIds = selectedEdgeIds();
      if (!nodeIds.length && !edgeIds.length) return;
      tm().commit(
        (doc) => ({ ...doc, ...deleteElements(doc, nodeIds, edgeIds) }),
        nodeIds.length + edgeIds.length > 1
          ? `Delete ${nodeIds.length + edgeIds.length} items`
          : "Delete",
      );
      tm().setUi({ selectedNodeId: null, selectedEdgeId: null, connectFrom: null });
    };

    const copy = () => {
      clipboard = copySelection(tm().document, selectedNodeIds());
      if (clipboard)
        toast.success(
          `Copied ${clipboard.nodes.length} component${clipboard.nodes.length === 1 ? "" : "s"}`,
        );
    };

    const paste = () => {
      if (!clipboard) return;
      const clip = clipboard;
      let newIds: string[] = [];
      tm().commit((doc) => {
        const r = pasteClipboard(doc, clip);
        newIds = r.newIds;
        return { ...doc, nodes: r.nodes, edges: r.edges };
      }, "Paste");
      // Successive pastes cascade.
      clipboard = {
        ...clip,
        nodes: clip.nodes.map((n) =>
          n.parentId ? n : { ...n, position: { x: n.position.x + 40, y: n.position.y + 40 } },
        ),
      };
      tm().setUi({ selectedNodeId: newIds.length === 1 ? newIds[0] : null });
    };

    const duplicate = () => {
      const clip = copySelection(tm().document, selectedNodeIds());
      if (!clip) return;
      tm().commit((doc) => {
        const r = pasteClipboard(doc, clip, { x: 30, y: 30 });
        return { ...doc, nodes: r.nodes, edges: r.edges };
      }, "Duplicate");
    };

    const selectAll = () => {
      tm().setGraph((nodes, edges) => ({
        nodes: nodes.map((n) => ({ ...n, selected: true })),
        edges,
      }));
      tm().setUi({ selectedNodeId: null, selectedEdgeId: null });
    };

    const group = () => {
      const ids = selectedNodeIds();
      if (!ids.length) return;
      tm().commit((doc) => {
        const r = groupInBoundary(doc.nodes, ids);
        return r ? { ...doc, nodes: r.nodes } : doc;
      }, "Group in trust boundary");
    };

    const reorder = (mode: "front" | "back" | "forward" | "backward") => {
      const ids = new Set(selectedNodeIds());
      if (!ids.size) return;
      tm().commit((doc) => ({ ...doc, nodes: reorderOp(doc.nodes, ids, mode) }), "Reorder");
    };

    const nudge = (dx: number, dy: number) => {
      const ids = new Set(selectedNodeIds());
      if (!ids.size) return;
      tm().commit((doc) => ({ ...doc, nodes: nudgeOp(doc.nodes, ids, dx, dy) }), "Move", {
        coalesce: "nudge",
      });
    };

    const tidy = () => {
      const s = tm();
      if (s.persist === "readonly" || !s.document.nodes.length) return;
      const from = s.document.nodes;
      const to = tidyLayout(from, s.document.edges);
      const finish = () => {
        tm().setGraph((_n, edges) => ({ nodes: to, edges }));
        tm().endGesture("Tidy layout");
        window.setTimeout(() => void rf.fitView({ duration: 300, padding: 0.15 }), 30);
      };
      s.beginGesture();
      if (reducedMotion()) return finish();
      const start = performance.now();
      const step = (now: number) => {
        const t = (now - start) / 300;
        if (t >= 1) return finish();
        tm().setGraph((_n, edges) => ({ nodes: interpolatePositions(from, to, t), edges }));
        window.requestAnimationFrame(step);
      };
      window.requestAnimationFrame(step);
    };

    const connect = (
      source: string,
      target: string,
      handles?: { sourceHandle?: string | null; targetHandle?: string | null },
    ) => {
      const edge = connectOp(tm().document, source, target, handles);
      if (!edge) {
        toast.error(
          "That connection is not allowed (self-loop, actor → actor, boundary or duplicate).",
        );
        return null;
      }
      tm().commit((doc) => ({ ...doc, edges: [...doc.edges, edge] }), "Connect");
      tm().setUi({ connectFrom: null, selectedEdgeId: edge.id, selectedNodeId: null });
      return edge.id;
    };

    const startConnect = (from?: string) => {
      const id = from ?? selectedNodeIds()[0];
      if (!id) {
        toast.info("Select a component first, then press C.");
        return;
      }
      tm().setUi({ connectFrom: id });
    };

    const clear = () => {
      const s = tm();
      if (!s.document.nodes.length) return;
      s.replaceDocument(
        createDocument({
          ...s.document,
          nodes: [],
          edges: [],
          threatStatuses: {},
          appliedMitigations: {},
          suppressedRules: [],
        }),
        "Clear canvas",
        { mergeCustom: false },
      );
    };

    const loadTemplate = (id: string): boolean => {
      const s = tm();
      const user = readLibrary().templates.find((t) => t.id === id);
      if (user) {
        s.replaceDocument(
          createDocument({ ...user.document, id: undefined, name: user.name }),
          `Load template ${user.name}`,
        );
        window.setTimeout(() => void rf.fitView({ duration: 300, padding: 0.15 }), 60);
        return true;
      }
      const t = ARCHITECTURE_TEMPLATES.find((x) => x.id === id);
      if (!t) return false;
      const { nodes, edges } = instantiateTemplate(t);
      s.replaceDocument(
        createDocument({ name: t.name, description: t.description, nodes, edges }),
        `Load template ${t.name}`,
      );
      window.setTimeout(() => void rf.fitView({ duration: 300, padding: 0.15 }), 60);
      return true;
    };

    return {
      rf,
      viewportCenter,
      focusNodes,
      locate: (nodeIds: string[]) => {
        selectNodes(nodeIds);
        focusNodes(nodeIds);
      },
      addEntry,
      addEntryById,
      deleteSelection,
      copy,
      paste,
      duplicate,
      selectAll,
      group,
      reorder,
      nudge,
      tidy,
      connect,
      startConnect,
      cancelConnect: () => tm().setUi({ connectFrom: null }),
      clear,
      loadTemplate,
      fit: () => void rf.fitView({ duration: 300, padding: 0.15 }),
      zoomIn: () => void rf.zoomIn({ duration: 200 }),
      zoomOut: () => void rf.zoomOut({ duration: 200 }),
      hasClipboard: () => !!clipboard,
    };
  }, [rf]);
}

export type CanvasActions = ReturnType<typeof useCanvasActions>;

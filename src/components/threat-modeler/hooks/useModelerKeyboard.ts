import { useCallback, type KeyboardEvent as ReactKeyboardEvent, type RefObject } from "react";
import { toast } from "sonner";
import { isTypingTarget } from "@/components/layout/commandPaletteContext";
import { readLibrary, saveModel } from "../persistence";
import { matchShortcut } from "../shortcuts";
import { tm } from "../store";
import { selectedNodeIds, selectNodes, type CanvasActions } from "./useCanvasActions";

/** Ctrl/⌘+S: update the saved model in place, or ask for a name the first time (P3-23). */
export function saveCurrentModel() {
  const s = tm();
  if (s.persist === "readonly") {
    toast.info("This is a read-only shared model. Make a copy to save it.");
    return;
  }
  const exists = readLibrary().models.some((m) => m.id === s.document.id);
  if (!exists) {
    s.openDialog("models", { mode: "save" });
    return;
  }
  saveModel(s.document);
  s.flushAutosave();
  toast.success(`Saved "${s.document.name}"`);
}

function focusedNodeId(target: EventTarget | null): string | null {
  const el = target instanceof HTMLElement ? target.closest(".react-flow__node") : null;
  return el?.getAttribute("data-id") ?? null;
}

/**
 * Scoped keyboard handling (P3-38): attach `onKeyDown` to the modeler root.
 * Canvas shortcuts fire only while focus is inside `canvasRef`; modeler
 * shortcuts anywhere except text fields. No window-level listeners.
 */
export function useModelerKeyboard(
  canvasRef: RefObject<HTMLElement | null>,
  actions: CanvasActions,
) {
  return useCallback(
    (e: ReactKeyboardEvent<HTMLElement>) => {
      if (e.nativeEvent.isComposing) return;
      const inCanvas = !!canvasRef.current?.contains(e.target as Node);
      const typing = isTypingTarget(e.target);
      const id = matchShortcut(e, inCanvas && !typing ? "canvas" : "modeler");
      if (!id) return;
      // Typing: only save passes through (Ctrl/⌘+S never opens the browser dialog).
      if (typing && id !== "save") return;
      if (tm().ui.dialog) return; // dialogs own the keyboard
      const s = tm();
      const ro = s.persist === "readonly";
      const handled = () => {
        e.preventDefault();
        e.stopPropagation();
      };
      switch (id) {
        case "save":
          handled();
          saveCurrentModel();
          return;
        case "undo":
          handled();
          s.undo();
          return;
        case "redo":
          handled();
          s.redo();
          return;
        case "analyze":
          handled();
          void s.analyze();
          return;
        case "help":
          handled();
          s.openDialog("shortcuts");
          return;
      }
      if (!inCanvas) return;
      // React Flow already moved / selected a focused node (it calls preventDefault).
      if (e.defaultPrevented && (id === "nudge" || id === "nudgeFar" || id === "confirm")) return;
      switch (id) {
        case "delete":
          if (ro) return;
          handled();
          actions.deleteSelection();
          return;
        case "selectAll":
          handled();
          actions.selectAll();
          return;
        case "copy":
          handled();
          actions.copy();
          return;
        case "paste":
          if (ro) return;
          handled();
          actions.paste();
          return;
        case "duplicate":
          if (ro) return;
          handled();
          actions.duplicate();
          return;
        case "nudge":
        case "nudgeFar": {
          if (ro || !selectedNodeIds().length) return;
          handled();
          const d = id === "nudgeFar" ? 32 : 8;
          const k = e.key;
          actions.nudge(
            k === "ArrowLeft" ? -d : k === "ArrowRight" ? d : 0,
            k === "ArrowUp" ? -d : k === "ArrowDown" ? d : 0,
          );
          return;
        }
        case "connect":
          if (ro) return;
          handled();
          actions.startConnect(focusedNodeId(e.target) ?? undefined);
          return;
        case "confirm": {
          const target = focusedNodeId(e.target);
          const from = s.ui.connectFrom;
          if (from && target && target !== from) {
            handled();
            actions.connect(from, target);
          } else if (target) {
            handled();
            selectNodes([target]);
          }
          return;
        }
        case "escape":
          if (s.ui.connectFrom) {
            handled();
            actions.cancelConnect();
            return;
          }
          if (s.ui.whatIf.active) {
            handled();
            s.setUi({ whatIf: { active: false, result: null } });
            return;
          }
          if (s.ui.playback) {
            handled();
            s.setUi({ playback: null });
            return;
          }
          handled();
          selectNodes([]);
          return;
        case "fit":
          handled();
          actions.fit();
          return;
        case "zoomIn":
          handled();
          actions.zoomIn();
          return;
        case "zoomOut":
          handled();
          actions.zoomOut();
          return;
        case "group":
          if (ro) return;
          handled();
          actions.group();
          return;
        case "tidy":
          if (ro) return;
          handled();
          actions.tidy();
          return;
      }
    },
    [canvasRef, actions],
  );
}

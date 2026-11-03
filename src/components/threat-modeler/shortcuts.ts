/**
 * Keyboard shortcuts (P3-38). One table drives the keyboard handler, the
 * shortcuts dialog and the Guide, so they cannot drift.
 *
 * Scopes:
 *   "canvas"  — only while focus is inside the canvas region (role="application")
 *   "modeler" — anywhere in the modeler, except while typing in a field
 * There is deliberately no global Space / Backspace handler.
 */

export type ShortcutScope = "canvas" | "modeler";

export type ShortcutId =
  | "save"
  | "undo"
  | "redo"
  | "analyze"
  | "help"
  | "delete"
  | "selectAll"
  | "copy"
  | "paste"
  | "duplicate"
  | "nudge"
  | "nudgeFar"
  | "connect"
  | "confirm"
  | "escape"
  | "fit"
  | "zoomIn"
  | "zoomOut"
  | "group"
  | "tidy";

export interface ShortcutDef {
  id: ShortcutId;
  /** Display keys; "Mod" renders as ⌘ on macOS and Ctrl elsewhere. */
  keys: string[][];
  description: string;
  scope: ShortcutScope;
  group: "File" | "Edit" | "Canvas" | "Analysis" | "Help";
}

export interface KeyLike {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

export const SHORTCUTS: ShortcutDef[] = [
  {
    id: "save",
    keys: [["Mod", "S"]],
    description: "Save the current model",
    scope: "modeler",
    group: "File",
  },
  { id: "undo", keys: [["Mod", "Z"]], description: "Undo", scope: "modeler", group: "Edit" },
  {
    id: "redo",
    keys: [
      ["Mod", "Shift", "Z"],
      ["Mod", "Y"],
    ],
    description: "Redo",
    scope: "modeler",
    group: "Edit",
  },
  {
    id: "analyze",
    keys: [["Mod", "Enter"]],
    description: "Run threat analysis",
    scope: "modeler",
    group: "Analysis",
  },
  {
    id: "help",
    keys: [["?"]],
    description: "Show keyboard shortcuts",
    scope: "modeler",
    group: "Help",
  },
  {
    id: "delete",
    keys: [["Delete"], ["Backspace"]],
    description: "Delete the selected components / flows",
    scope: "canvas",
    group: "Edit",
  },
  {
    id: "selectAll",
    keys: [["Mod", "A"]],
    description: "Select every component",
    scope: "canvas",
    group: "Edit",
  },
  {
    id: "copy",
    keys: [["Mod", "C"]],
    description: "Copy selection (with the flows between it)",
    scope: "canvas",
    group: "Edit",
  },
  { id: "paste", keys: [["Mod", "V"]], description: "Paste", scope: "canvas", group: "Edit" },
  {
    id: "duplicate",
    keys: [["Mod", "D"]],
    description: "Duplicate selection",
    scope: "canvas",
    group: "Edit",
  },
  {
    id: "nudge",
    keys: [["←", "↑", "→", "↓"]],
    description: "Move selection by 8 px",
    scope: "canvas",
    group: "Canvas",
  },
  {
    id: "nudgeFar",
    keys: [["Shift", "Arrow"]],
    description: "Move selection by 32 px",
    scope: "canvas",
    group: "Canvas",
  },
  {
    id: "connect",
    keys: [["C"]],
    description:
      "Start a data flow from the selected component (then focus a target and press Enter)",
    scope: "canvas",
    group: "Canvas",
  },
  {
    id: "confirm",
    keys: [["Enter"]],
    description: "Finish the connection on the focused component",
    scope: "canvas",
    group: "Canvas",
  },
  {
    id: "escape",
    keys: [["Esc"]],
    description: "Cancel connection / clear selection",
    scope: "canvas",
    group: "Canvas",
  },
  {
    id: "fit",
    keys: [["F"], ["Mod", "0"]],
    description: "Fit the model to the view",
    scope: "canvas",
    group: "Canvas",
  },
  { id: "zoomIn", keys: [["+"]], description: "Zoom in", scope: "canvas", group: "Canvas" },
  { id: "zoomOut", keys: [["-"]], description: "Zoom out", scope: "canvas", group: "Canvas" },
  {
    id: "group",
    keys: [["G"]],
    description: "Wrap the selection in a trust boundary",
    scope: "canvas",
    group: "Canvas",
  },
  {
    id: "tidy",
    keys: [["T"]],
    description: "Tidy layout (animated)",
    scope: "canvas",
    group: "Canvas",
  },
];

const mod = (e: KeyLike) => e.ctrlKey || e.metaKey;
const plain = (e: KeyLike) => !e.ctrlKey && !e.metaKey && !e.altKey;
const k = (e: KeyLike) => (e.key.length === 1 ? e.key.toLowerCase() : e.key);

/** Which shortcut a key event triggers in `scope` (null = none). */
export function matchShortcut(e: KeyLike, scope: ShortcutScope): ShortcutId | null {
  const key = k(e);
  if (mod(e) && !e.altKey) {
    if (key === "s") return "save";
    if (key === "z") return e.shiftKey ? "redo" : "undo";
    if (key === "y") return "redo";
    if (key === "Enter") return "analyze";
    if (scope !== "canvas") return null;
    if (key === "a") return "selectAll";
    if (key === "c") return "copy";
    if (key === "v") return "paste";
    if (key === "d") return "duplicate";
    if (key === "0") return "fit";
    return null;
  }
  if (!plain(e)) return null;
  if (key === "?") return "help";
  if (scope !== "canvas") return null;
  switch (key) {
    case "Delete":
    case "Backspace":
      return "delete";
    case "ArrowLeft":
    case "ArrowRight":
    case "ArrowUp":
    case "ArrowDown":
      return e.shiftKey ? "nudgeFar" : "nudge";
    case "c":
      return e.shiftKey ? null : "connect";
    case "Enter":
      return "confirm";
    case "Escape":
      return "escape";
    case "f":
      return "fit";
    case "+":
    case "=":
      return "zoomIn";
    case "-":
      return "zoomOut";
    case "g":
      return "group";
    case "t":
      return "tidy";
    default:
      return null;
  }
}

export function isMacPlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
}

/** "Mod" → "⌘"/"Ctrl". */
export function formatKey(key: string, mac = isMacPlatform()): string {
  if (key === "Mod") return mac ? "⌘" : "Ctrl";
  if (key === "Shift") return mac ? "⇧" : "Shift";
  return key;
}

/** First key combination of a shortcut, for menu hints and titles ("⌘+S"). */
export function shortcutHint(id: ShortcutId, mac = isMacPlatform()): string {
  const keys = SHORTCUTS.find((s) => s.id === id)?.keys[0];
  return keys ? keys.map((k) => formatKey(k, mac)).join("+") : "";
}

export const SHORTCUT_GROUPS: ShortcutDef["group"][] = [
  "File",
  "Edit",
  "Canvas",
  "Analysis",
  "Help",
];

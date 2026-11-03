import { createContext, useContext } from "react";

export interface CommandPaletteContextValue {
  open: boolean;
  /** Open the palette, optionally pre-filled with a query (e.g. from the 404 page). */
  openPalette: (query?: string) => void;
  closePalette: () => void;
  setOpen: (open: boolean) => void;
  /** Query to pre-fill on the next open; consumed by the dialog. */
  initialQuery: string;
}

export const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

const noop = () => {};
const fallback: CommandPaletteContextValue = {
  open: false,
  openPalette: noop,
  closePalette: noop,
  setOpen: noop,
  initialQuery: "",
};

/** Palette controls. Outside the provider this returns inert no-ops instead of throwing. */
export function useCommandPalette(): CommandPaletteContextValue {
  return useContext(CommandPaletteContext) ?? fallback;
}

/** True when the key event comes from a text field, so single-key shortcuts must not fire. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag === "INPUT") {
    const type = (target as HTMLInputElement).type;
    return !["checkbox", "radio", "button", "submit", "reset", "range", "color"].includes(type);
  }
  return target.getAttribute("role") === "combobox" || target.getAttribute("role") === "textbox";
}

import { Suspense, lazy, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { CommandPaletteContext, isTypingTarget } from "./commandPaletteContext";

const CommandPalette = lazy(() => import("./CommandPalette"));

/**
 * Owns palette state and the global shortcuts: ⌘K / Ctrl-K toggles; "/" opens when focus is not
 * in a text field. The dialog chunk (cmdk + search index) loads on first open.
 */
export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpenState] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [initialQuery, setInitialQuery] = useState("");

  const setOpen = useCallback((next: boolean) => {
    if (next) setMounted(true);
    setOpenState(next);
  }, []);

  const openPalette = useCallback(
    (query = "") => {
      setInitialQuery(query);
      setOpen(true);
    },
    [setOpen],
  );

  const closePalette = useCallback(() => setOpen(false), [setOpen]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setInitialQuery("");
        setMounted(true);
        setOpenState((o) => !o);
        return;
      }
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey && !isTypingTarget(e.target)) {
        e.preventDefault();
        openPalette();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openPalette]);

  const value = useMemo(
    () => ({ open, openPalette, closePalette, setOpen, initialQuery }),
    [open, openPalette, closePalette, setOpen, initialQuery],
  );

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
      {mounted && (
        <Suspense fallback={null}>
          <CommandPalette open={open} onOpenChange={setOpen} initialQuery={initialQuery} />
        </Suspense>
      )}
    </CommandPaletteContext.Provider>
  );
}

export default CommandPaletteProvider;

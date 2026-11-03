/**
 * Deep-link helpers shared by the Taxonomy tabs, the AISVS page and the NIST page (P1-11).
 *
 *   <li id={entryDomId(code)} className="scroll-mt-24">…</li>
 *   useEffect(() => { if (entry && focusKey) focusEntry(entryDomId(entry)); }, [focusKey]);
 */
import { prefersReducedMotion } from "@/lib/motion";

/** Stable, CSS-safe DOM id for an entry code ("AML.T0051.001" → "entry-AML-T0051-001"). */
export function entryDomId(code: string, prefix = "entry"): string {
  return `${prefix}-${code.replace(/[^A-Za-z0-9_-]/g, "-")}`;
}

const HIGHLIGHT = ["ring-2", "ring-primary", "ring-offset-2", "ring-offset-background"];
const timers = new WeakMap<Element, number>();

/** Briefly ring-highlight an element (no-op animation under reduced motion: the ring still shows). */
export function highlightElement(el: Element, ms = 1800): void {
  el.classList.add(...HIGHLIGHT);
  const prev = timers.get(el);
  if (prev) window.clearTimeout(prev);
  timers.set(
    el,
    window.setTimeout(() => {
      el.classList.remove(...HIGHLIGHT);
      timers.delete(el);
    }, ms),
  );
}

/**
 * Scroll the element with `id` into view and highlight it. Retries for a few frames so it works
 * right after an accordion expands or a lazy tab mounts. Resolves true when the element was found.
 */
export function focusEntry(
  id: string,
  opts: {
    block?: ScrollLogicalPosition;
    highlight?: boolean;
    attempts?: number;
    focus?: boolean;
  } = {},
): Promise<boolean> {
  const { block = "start", highlight = true, attempts = 20, focus = false } = opts;
  return new Promise((resolve) => {
    let tries = 0;
    const run = () => {
      const el = typeof document !== "undefined" ? document.getElementById(id) : null;
      if (!el) {
        if (++tries >= attempts) return resolve(false);
        window.setTimeout(run, 50);
        return;
      }
      // Wait one more frame so expanded accordion content has its final height.
      requestAnimationFrame(() => {
        el.scrollIntoView?.({ behavior: prefersReducedMotion() ? "auto" : "smooth", block });
        if (highlight) highlightElement(el);
        if (focus && el instanceof HTMLElement) el.focus({ preventScroll: true });
        resolve(true);
      });
    };
    run();
  });
}

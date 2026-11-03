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

/**
 * Query parameters that make a page scroll to an element itself (`focusEntry()`): the Taxonomy
 * `?entry=`, NIST `?sub=` and `?control=` deep links. A bare `?tab=` selects a tab, not an
 * element, so a route change to it still starts at the top (ScrollToTop).
 */
export const DEEP_LINK_PARAMS = ["entry", "sub", "control"] as const;

/** True when a location targets an element: a non-empty hash, or one of DEEP_LINK_PARAMS. */
export function isDeepLinkLocation(search: string, hash: string): boolean {
  if (hash && hash !== "#") return true;
  if (!search) return false;
  const params = new URLSearchParams(search);
  return DEEP_LINK_PARAMS.some((p) => !!params.get(p));
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

/** Re-check delays (ms after the first scroll) used by `focusEntry` on top of the initial scroll. */
export const FOCUS_SETTLE_DELAYS: readonly number[] = [300, 900, 1800];
/**
 * Events that mean the user has taken over scrolling; pending re-checks are dropped.
 * `pointerdown` covers dragging the scrollbar, which fires no wheel/key/touch event.
 */
const USER_SCROLL_EVENTS = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
/** A check that lands while the page is still scrolling (smooth scroll in flight) waits this long. */
const SCROLL_SETTLE_MS = 120;
const MAX_DEFERS = 6;

/** Bottom edge of a sticky/fixed site header at the top of the viewport (0 when there is none). */
function topInset(): number {
  const header = document.querySelector("header");
  if (!header) return 0;
  const pos = getComputedStyle(header).position;
  if (pos !== "sticky" && pos !== "fixed") return 0;
  const { top, bottom } = header.getBoundingClientRect();
  return top <= 1 && bottom > 0 ? bottom : 0;
}

/**
 * True when the element is usefully on screen: at least half of the viewport (or all of the
 * element, when it is shorter) is visible and its top edge is not hidden under the sticky header.
 * Elements with no box (hidden, or jsdom) count as in view, so nothing keeps retrying them.
 */
export function isEntryInView(el: Element): boolean {
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight || 0;
  if (!vh || (r.width === 0 && r.height === 0)) return true;
  const inset = topInset();
  const band = vh - inset;
  const visible = Math.min(r.bottom, vh) - Math.max(r.top, inset);
  if (visible < Math.min(r.height, band / 2) - 1) return false;
  if (r.top < inset - 4) return false;
  return true;
}

let cancelPending: (() => void) | null = null;

/** Drop the re-checks of the last `focusEntry` call (a newer jump, or the page unmounting). */
export function cancelPendingFocus(): void {
  cancelPending?.();
}

/**
 * Scroll the element with `id` into view and highlight it. Waits (50 ms polls, `attempts` times)
 * for the element to exist, so it works right after an accordion expands or a lazy tab mounts.
 * Resolves true when the element was found and scrolled to.
 *
 * On a direct page load the element exists early but the layout keeps moving (lazy chunks,
 * accordion content, entrance animations), so after the first scroll the element's rect is
 * re-checked at `settle` delays (default 300 / 900 / 1800 ms) and scrolled to again while it is
 * out of view. A check that lands mid-scroll waits for the scroll to settle. The re-checks stop
 * once the element is in view, when a newer `focusEntry` starts, or on the first user `wheel`,
 * `touchstart`, `keydown` or `pointerdown`, so they never fight the user. Reduced motion →
 * instant scrolls. An entry taller than the viewport is aligned to the top, whatever `block` says.
 */
export function focusEntry(
  id: string,
  opts: {
    block?: ScrollLogicalPosition;
    highlight?: boolean;
    attempts?: number;
    focus?: boolean;
    /** Re-check delays in ms after the first scroll; [] disables the re-checks. */
    settle?: readonly number[];
  } = {},
): Promise<boolean> {
  const {
    block = "start",
    highlight = true,
    attempts = 20,
    focus = false,
    settle = FOCUS_SETTLE_DELAYS,
  } = opts;
  cancelPending?.();

  const timers = new Set<number>();
  let frame = 0;
  let done = false;
  let lastScrollAt = -Infinity;
  const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());
  const onScroll = () => {
    lastScrollAt = now();
  };
  const listening = { on: false };

  const stop = () => {
    if (done) return;
    done = true;
    timers.forEach((t) => window.clearTimeout(t));
    timers.clear();
    if (frame) cancelAnimationFrame(frame);
    if (listening.on) {
      for (const ev of USER_SCROLL_EVENTS) window.removeEventListener(ev, stop, true);
      window.removeEventListener("scroll", onScroll, true);
    }
    if (cancelPending === stop) cancelPending = null;
  };
  cancelPending = stop;

  const later = (fn: () => void, ms: number) => {
    const t = window.setTimeout(() => {
      timers.delete(t);
      fn();
    }, ms);
    timers.add(t);
  };
  const scrollTo = (el: Element) => {
    // Centering an entry taller than the viewport would hide its heading: align its top instead.
    const tall = el.getBoundingClientRect().height > (window.innerHeight || 0) - topInset();
    el.scrollIntoView?.({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: tall && block !== "nearest" ? "start" : block,
    });
  };

  const scheduleChecks = () => {
    if (!settle.length) return stop();
    listening.on = true;
    for (const ev of USER_SCROLL_EVENTS) window.addEventListener(ev, stop, true);
    window.addEventListener("scroll", onScroll, { capture: true, passive: true });
    const last = settle.length - 1;
    settle.forEach((delay, i) => {
      let defers = 0;
      const check = () => {
        if (done) return;
        if (now() - lastScrollAt < SCROLL_SETTLE_MS && defers++ < MAX_DEFERS) {
          later(check, SCROLL_SETTLE_MS);
          return;
        }
        // Re-query: the node may have been re-mounted since the first scroll.
        const el = document.getElementById(id);
        if (!el || isEntryInView(el)) return stop();
        scrollTo(el);
        if (i === last) stop();
      };
      later(check, delay);
    });
  };

  return new Promise((resolve) => {
    let tries = 0;
    const run = () => {
      if (done) return resolve(false);
      const el = typeof document !== "undefined" ? document.getElementById(id) : null;
      if (!el) {
        if (++tries >= attempts) {
          stop();
          return resolve(false);
        }
        later(run, 50);
        return;
      }
      // Wait one more frame so expanded accordion content has its final height.
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (done) return resolve(false);
        scrollTo(el);
        if (highlight) highlightElement(el);
        if (focus && el instanceof HTMLElement) el.focus({ preventScroll: true });
        scheduleChecks();
        resolve(true);
      });
    };
    run();
  });
}

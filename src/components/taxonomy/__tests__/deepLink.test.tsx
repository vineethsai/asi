import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import {
  FOCUS_SETTLE_DELAYS,
  cancelPendingFocus,
  focusEntry,
  isDeepLinkLocation,
  isEntryInView,
} from "@/components/taxonomy/deepLink";
import ScrollToTop from "@/components/layout/ScrollToTop";

const VH = 800;

/** A target whose rect top we control; `scrollIntoView` moves it to the next queued top. */
function mountTarget(initialTop: number, afterScroll: number[]) {
  const el = document.createElement("div");
  el.id = "target";
  document.body.appendChild(el);
  let top = initialTop;
  el.getBoundingClientRect = () =>
    ({ top, bottom: top + 120, height: 120, width: 300, left: 0, right: 300 }) as DOMRect;
  const scroll = vi.fn(() => {
    if (afterScroll.length) top = afterScroll.shift()!;
  });
  el.scrollIntoView = scroll;
  return {
    el,
    scroll,
    setTop: (t: number) => {
      top = t;
    },
  };
}

function setReducedMotion(reduced: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reduced && query.includes("reduce"),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  }));
}

describe("focusEntry settle retries", () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: [
        "setTimeout",
        "clearTimeout",
        "requestAnimationFrame",
        "cancelAnimationFrame",
        "performance",
        "Date",
      ],
    });
    Object.defineProperty(window, "innerHeight", { value: VH, configurable: true });
    setReducedMotion(false);
  });
  afterEach(() => {
    cancelPendingFocus();
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  /** Let the element lookup + the one-frame wait run, then return the resolved value. */
  async function start(p: Promise<boolean>) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(20);
    });
    return p;
  }

  it("scrolls again at the settle delays while the layout keeps pushing the entry out of view", async () => {
    // First scroll lands, then late content pushes the entry below the fold (900),
    // the 300 ms re-check scrolls again and it stays put (100).
    const t = mountTarget(2000, [900, 100]);
    await expect(start(focusEntry("target"))).resolves.toBe(true);
    expect(t.scroll).toHaveBeenCalledTimes(1);
    expect(t.scroll).toHaveBeenLastCalledWith({ behavior: "smooth", block: "start" });

    await vi.advanceTimersByTimeAsync(FOCUS_SETTLE_DELAYS[0]);
    expect(t.scroll).toHaveBeenCalledTimes(2);

    // In view at 900 ms → the retries stop; nothing happens at 1800 ms either.
    await vi.advanceTimersByTimeAsync(3000);
    expect(t.scroll).toHaveBeenCalledTimes(2);
  });

  it("re-checks at ~300, ~900 and ~1800 ms and never more than that", async () => {
    const t = mountTarget(2000, []); // never comes into view
    await start(focusEntry("target"));
    expect(t.scroll).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(300);
    expect(t.scroll).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(600);
    expect(t.scroll).toHaveBeenCalledTimes(3);
    await vi.advanceTimersByTimeAsync(900);
    expect(t.scroll).toHaveBeenCalledTimes(4);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(t.scroll).toHaveBeenCalledTimes(4);
  });

  it("does not scroll again when the entry is already in view", async () => {
    const t = mountTarget(2000, [96]);
    await start(focusEntry("target"));
    await vi.advanceTimersByTimeAsync(5000);
    expect(t.scroll).toHaveBeenCalledTimes(1);
  });

  it.each(["wheel", "touchstart", "keydown", "pointerdown"])(
    "aborts the re-checks on the first user %s",
    async (type) => {
      const t = mountTarget(2000, []);
      await start(focusEntry("target"));
      window.dispatchEvent(new Event(type));
      await vi.advanceTimersByTimeAsync(5000);
      expect(t.scroll).toHaveBeenCalledTimes(1);
    },
  );

  it("waits for an in-flight scroll to settle before re-checking", async () => {
    const t = mountTarget(2000, []);
    await start(focusEntry("target"));
    await vi.advanceTimersByTimeAsync(250);
    window.dispatchEvent(new Event("scroll")); // smooth scroll still moving at ~270 ms
    await vi.advanceTimersByTimeAsync(60); // the 300 ms check is deferred
    expect(t.scroll).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(200); // settled → re-check runs
    expect(t.scroll).toHaveBeenCalledTimes(2);
  });

  it("uses instant scrolls under reduced motion", async () => {
    setReducedMotion(true);
    const t = mountTarget(2000, []);
    await start(focusEntry("target", { block: "center" }));
    await vi.advanceTimersByTimeAsync(300);
    expect(t.scroll).toHaveBeenCalledTimes(2);
    for (const call of t.scroll.mock.calls as unknown as [ScrollIntoViewOptions][])
      expect(call[0]).toEqual({ behavior: "auto", block: "center" });
  });

  it("aligns an entry taller than the viewport to the top instead of centring it", async () => {
    const t = mountTarget(2000, [100]);
    t.el.getBoundingClientRect = () =>
      ({ top: 2000, bottom: 3100, height: 1100, width: 300, left: 0, right: 300 }) as DOMRect;
    await start(focusEntry("target", { block: "center" }));
    expect(t.scroll).toHaveBeenLastCalledWith({ behavior: "smooth", block: "start" });
  });

  it("a newer focusEntry cancels the previous one's re-checks", async () => {
    const a = mountTarget(2000, []);
    await start(focusEntry("target"));
    const b = document.createElement("div");
    b.id = "other";
    b.scrollIntoView = vi.fn();
    document.body.appendChild(b);
    await start(focusEntry("other"));
    await vi.advanceTimersByTimeAsync(5000);
    expect(a.scroll).toHaveBeenCalledTimes(1);
  });

  it("settle: [] disables the re-checks; a missing element resolves false", async () => {
    const t = mountTarget(2000, []);
    await start(focusEntry("target", { settle: [] }));
    await vi.advanceTimersByTimeAsync(5000);
    expect(t.scroll).toHaveBeenCalledTimes(1);

    const p = focusEntry("missing", { attempts: 3 });
    await vi.advanceTimersByTimeAsync(500);
    await expect(p).resolves.toBe(false);
  });

  it("isEntryInView: below the fold, above the viewport and partly visible", () => {
    const t = mountTarget(100, []);
    expect(isEntryInView(t.el)).toBe(true);
    t.setTop(840); // the measured AISVS failure: top below an 800 px viewport
    expect(isEntryInView(t.el)).toBe(false);
    t.setTop(-400);
    expect(isEntryInView(t.el)).toBe(false);
    t.setTop(VH - 40); // only a 40 px sliver of a 120 px entry
    expect(isEntryInView(t.el)).toBe(false);
  });
});

describe("isDeepLinkLocation", () => {
  it("treats hashes and entry/sub/control params as deep links, not a bare tab", () => {
    expect(isDeepLinkLocation("", "#C5.1.2")).toBe(true);
    expect(isDeepLinkLocation("?tab=owasp-agentic&entry=ASI05", "")).toBe(true);
    expect(isDeepLinkLocation("?sub=MAP.1.1", "")).toBe(true);
    expect(isDeepLinkLocation("?control=c1", "")).toBe(true);
    expect(isDeepLinkLocation("?tab=cisco", "")).toBe(false);
    expect(isDeepLinkLocation("", "")).toBe(false);
    expect(isDeepLinkLocation("?entry=", "#")).toBe(false);
  });
});

describe("ScrollToTop", () => {
  let go: (to: string) => void = () => {};
  /** Mirrors App.tsx: ScrollToTop gets the rendered route's pathname + hash. */
  function Harness() {
    const navigate = useNavigate();
    const { pathname, hash } = useLocation();
    useEffect(() => {
      go = (to) => navigate(to);
    }, [navigate]);
    return <ScrollToTop pathname={pathname} hash={hash} />;
  }

  it("resets only on pathname changes without a deep link, never on the first render", () => {
    const scrollTo = vi.fn();
    window.scrollTo = scrollTo as unknown as typeof window.scrollTo;
    render(
      <MemoryRouter initialEntries={["/threats"]}>
        <Harness />
      </MemoryRouter>,
    );
    expect(scrollTo).not.toHaveBeenCalled(); // direct load

    act(() => go("/threats?q=x")); // search-only change
    expect(scrollTo).not.toHaveBeenCalled();
    act(() => go("/taxonomy?tab=cisco")); // route change; a bare tab is not a deep link
    expect(scrollTo).toHaveBeenCalledTimes(1);
    act(() => go("/aisvs#C5.1.2")); // hash deep link: the page scrolls itself
    act(() => go("/taxonomy?tab=owasp-agentic&entry=ASI05")); // entry deep link
    act(() => go("/nist-mapping?sub=MAP.1.1")); // sub deep link
    act(() => go("/nist-mapping#detailed-mapping")); // hash-only change
    expect(scrollTo).toHaveBeenCalledTimes(1);
    act(() => go("/about"));
    expect(scrollTo).toHaveBeenCalledTimes(2);
  });
});

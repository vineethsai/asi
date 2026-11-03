import { useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { isDeepLinkLocation } from "@/components/taxonomy/deepLink";

interface ScrollToTopProps {
  /** The rendered route's pathname (from useTransitionLocation), not the live URL. */
  pathname: string;
  hash?: string;
  /** The rendered route's search string; defaults to the live location's. */
  search?: string;
}

/**
 * Resets scroll when the rendered route's pathname changes, and only then: search- and
 * hash-only changes never scroll. Runs as a layout effect in the commit that swaps the route
 * (before the new page's effects, lazy chunk or `focusEntry` retries), so it can never land after
 * a deep-link scroll. Inside a view transition the new snapshot is already at the top.
 *
 * Deep links are left alone: when the new location carries a hash or an `entry`/`sub`/`control`
 * parameter, the page scrolls to its target itself (AISVS hash, Taxonomy entry, NIST sub). A hash
 * whose element already exists is scrolled to directly. The first render (a direct load) never
 * scrolls: the browser starts at the top, and a late reset would fight the page's own scroll.
 */
const ScrollToTop = ({ pathname, hash: hashProp, search: searchProp }: ScrollToTopProps) => {
  const live = useLocation();
  const hash = hashProp ?? live.hash;
  const search = searchProp ?? live.search;
  const first = useRef(true);

  useLayoutEffect(() => {
    const isFirst = first.current;
    first.current = false;
    if (hash && hash !== "#") {
      let target: HTMLElement | null = null;
      try {
        target = document.getElementById(decodeURIComponent(hash.slice(1)));
      } catch {
        target = null; // malformed escape: leave it to the page
      }
      target?.scrollIntoView({ block: "start" });
      return;
    }
    if (isFirst || isDeepLinkLocation(search, hash)) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    // Only pathname changes matter; search/hash changes within a page are left to the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
};

export default ScrollToTop;

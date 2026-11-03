import { useLayoutEffect, useRef } from "react";

interface ScrollToTopProps {
  /** The rendered route's pathname (from useTransitionLocation), not the live URL. */
  pathname: string;
  hash?: string;
}

/**
 * Resets scroll when the rendered route changes. Runs as a layout effect so that, inside a view
 * transition, the new snapshot is already at the top. A hash that matches an element id scrolls
 * to that element instead (pages that build their DOM later handle their own hash).
 */
const ScrollToTop = ({ pathname, hash }: ScrollToTopProps) => {
  const first = useRef(true);

  useLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      if (!hash) return;
    }
    const id = hash ? decodeURIComponent(hash.slice(1)) : "";
    const target = id ? document.getElementById(id) : null;
    if (target) {
      target.scrollIntoView({ block: "start" });
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    // Only route changes matter; hash changes within a page are left to the browser/page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
};

export default ScrollToTop;

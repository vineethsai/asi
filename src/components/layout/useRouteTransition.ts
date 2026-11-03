import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useLocation, type Location } from "react-router-dom";
import { duration, easing } from "@/lib/motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => unknown;
};

/**
 * Route transitions (IMPROVEMENT_PLAN §8.7). Returns the location to render: when the pathname
 * changes, the previous route stays on screen until `document.startViewTransition` captures it,
 * then the new route is committed synchronously inside the transition (150 ms cross-fade, see
 * `::view-transition-*` in index.css). Without the API, the new route renders immediately and
 * `useRouteFadeIn` plays a 150 ms fade/rise. Search/hash-only changes never transition.
 *
 * Pass the returned location to `<Routes location={…}>`; react-router then gives route
 * elements that same location from `useLocation()`, so pages never see a mismatched URL.
 */
export function useTransitionLocation(): Location {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (location.pathname === displayLocation.pathname) return;
    const doc = document as ViewTransitionDocument;
    if (!reduced && typeof doc.startViewTransition === "function") {
      doc.startViewTransition(() => {
        flushSync(() => setDisplayLocation(location));
      });
    } else {
      setDisplayLocation(location);
    }
  }, [location, displayLocation.pathname, reduced]);

  return location.pathname === displayLocation.pathname ? location : displayLocation;
}

/** Fallback fade for browsers without View Transitions; attach the ref to the route container. */
export function useRouteFadeIn<T extends HTMLElement>(pathname: string) {
  const ref = useRef<T>(null);
  const reduced = useReducedMotion();
  const first = useRef(true);

  useLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const el = ref.current;
    const doc = document as ViewTransitionDocument;
    if (!el || reduced || typeof doc.startViewTransition === "function" || !el.animate) return;
    el.animate(
      [
        { opacity: 0, transform: "translateY(4px)" },
        { opacity: 1, transform: "none" },
      ],
      { duration: duration.fast, easing: easing.standard },
    );
  }, [pathname, reduced]);

  return ref;
}

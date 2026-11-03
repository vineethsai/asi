import { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { GA_TRACKING_ID, trackPageEvents } from "@/lib/analytics";

/**
 * Page-view tracking (IMPROVEMENT_PLAN P0-18).
 *
 * Exactly one `page_view` per navigation, where a navigation is a change of
 * pathname + search (hash-only changes such as tab anchors do not count). `index.html`
 * configures gtag with `send_page_view: false`, so this module is the only sender.
 *
 * The view is sent once the route has reported its title (PageLayout calls
 * `reportPageView`) so `page_title` is the new page's, with a fallback timer for routes
 * that do not use PageLayout.
 */

type PageInfo = { title?: string; params?: Record<string, unknown> };

const FALLBACK_MS = 1500;

let current: { key: string; sent: boolean; timer?: number; flush?: number } | null = null;
const pending = new Map<string, PageInfo>();

function locationKey(pathname: string, search: string) {
  return pathname + search;
}

function send(key: string) {
  if (!current || current.key !== key || current.sent) return;
  current.sent = true;
  window.clearTimeout(current.timer);
  window.clearTimeout(current.flush);
  const info = pending.get(key) ?? {};
  pending.delete(key);
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", "page_view", {
    send_to: GA_TRACKING_ID,
    page_location: window.location.origin + key,
    page_path: key,
    page_title: info.title ?? document.title,
    ...info.params,
  });
}

/** Defer to the next task so the title and any page params from the same commit merge first. */
function scheduleFlush(key: string) {
  if (!current || current.key !== key || current.sent) return;
  window.clearTimeout(current.flush);
  current.flush = window.setTimeout(() => send(key), 0);
}

/**
 * Report the current route's metadata. Called by PageLayout with the document title; pages
 * may add params via `usePageTracking`. Safe to call before or after the shell registers the
 * navigation.
 */
export function reportPageView(pathname: string, search: string, info: PageInfo) {
  const key = locationKey(pathname, search);
  const prev = pending.get(key) ?? {};
  pending.set(key, {
    title: info.title ?? prev.title,
    params: { ...prev.params, ...info.params },
  });
  if (info.title) scheduleFlush(key);
}

/** Mount once, in the app shell. Registers each navigation and sends its page_view. */
export const useAnalytics = () => {
  const { pathname, search } = useLocation();
  const key = locationKey(pathname, search);

  useEffect(() => {
    if (current && !current.sent) {
      window.clearTimeout(current.timer);
      window.clearTimeout(current.flush);
    }
    current = { key, sent: false };
    current.timer = window.setTimeout(() => send(key), FALLBACK_MS);
    if (pending.get(key)?.title) scheduleFlush(key);
  }, [key]);

  return trackPageEvents;
};

/**
 * Attach custom parameters to the current route's page_view. Does not send a page view of its
 * own; metadata is memoized by value, so passing a fresh object literal each render is fine.
 */
export const usePageTracking = (pageName: string, additionalData?: Record<string, unknown>) => {
  const { pathname, search } = useLocation();
  const dataKey = JSON.stringify(additionalData ?? {});
  const params = useMemo(
    () => ({ page_name: pageName, ...(JSON.parse(dataKey) as Record<string, unknown>) }),
    [pageName, dataKey],
  );

  useEffect(() => {
    reportPageView(pathname, search, { params });
  }, [pathname, search, params]);
};

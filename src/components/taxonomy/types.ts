/**
 * Contract between the Taxonomy page (src/pages/Taxonomy.tsx) and its tab components
 * (OWASP Agentic Top 10, Cisco, ATLAS, AIVSS, AIUC-1) for deep links (IMPROVEMENT_PLAN P1-11).
 *
 * URL: /taxonomy?tab=owasp-agentic|cisco|atlas|aivss|aiuc-1(alias aiuc1)&entry=<code>
 *   entry examples: ASI01 · OB-004 · AITech-1.1 · AISubtech-1.1.1 · A001 · AML.T0051
 */
export type TaxonomyTabId = "overview" | "owasp-agentic" | "cisco" | "atlas" | "aivss" | "aiuc-1";

export interface TaxonomyTabProps {
  /** Entry code from `?entry=` (decoded), or null. */
  entry?: string | null;
  /**
   * Increments whenever the page wants the tab to bring `entry` into view: on first load with a
   * deep link and on every external navigation (command palette, cross-links). It does NOT change
   * when the URL was rewritten by the tab itself through `onEntryChange`. On change the tab
   * expands/selects the entry, scrolls it into view and briefly highlights it
   * (see `focusEntry()` in ./deepLink).
   */
  focusKey?: number;
  /**
   * The user expanded/selected (code) or collapsed (null) an entry. The page writes `?entry=`
   * with replaceState so the current entry is shareable.
   */
  onEntryChange?: (entry: string | null) => void;
}

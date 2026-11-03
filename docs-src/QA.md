# Manual QA checklist

Run this before every release. `docs/` is build output; this folder (`docs-src/`) holds source documentation.

Viewports: **375 px** (phone), **768 px** (tablet), **1280 px** (desktop). Themes: **dark** and **light**. One keyboard-only pass on a list page, a detail page, and the Threat Modeler.

## Global shell

- [ ] Header: logo → `/`, every primary item routes, "More" menu opens/closes with mouse, Escape and outside click, focus returns to trigger.
- [ ] Mobile drawer opens on **every** page and lists all routes grouped (Learn / Verify / Tools / Project).
- [ ] Command palette: `⌘K` / `Ctrl-K` and `/` open it; typing `asi03`, `T7`, `M3`, `C5`, `OB-004`, `GOVERN.1.1` lands on the exact entry; recent items persist; works at 375 px via the header icon.
- [ ] Theme toggle switches instantly; a hard reload of `/threat-modeler` and `/some-404` honours the stored theme (no light flash).
- [ ] No fixed-position element overlaps the breadcrumb or the h1 at 1024 / 1280 / 1440 px.
- [ ] Skip link appears on first Tab and moves focus to main.
- [ ] Footer columns derive from the nav config; "Security Checklist" naming is consistent.
- [ ] Console: no `validateDOMNesting`, no React key warnings, no uncaught errors on any route.

## Home

- [ ] Count-ups match data counts (threats, controls, AISVS requirements, patterns, templates).
- [ ] Featured threat changes with the date and links to the right detail page.
- [ ] Architecture showcase tabs switch; attack-path animation plays once visible and the replay button works.
- [ ] Progress card hidden when nothing is tracked; shows after ticking an AISVS requirement.

## List pages (Components, Threats, Controls, Architectures, AISVS, NIST, Taxonomy, References)

- [ ] First content card visible without scrolling at 1280×800.
- [ ] Filters and search change results; empty state appears when nothing matches; "Clear" resets.
- [ ] Sort controls work and persist within the session.
- [ ] Severity badges meet contrast in light mode (no yellow-on-white).
- [ ] Charts: tooltips on hover **and** on keyboard focus; theme toggle recolours live; `sr-only` table present.
- [ ] Threat × Component heatmap: column groups collapse, first column pinned at 375 px, cell click opens the threat with the component tab preselected.
- [ ] NIST graph keeps zoom/pan across selections; compliance matrix shows all AISVS chapters; drawer opens on click.
- [ ] Taxonomy deep links: `/taxonomy?tab=owasp-agentic&entry=ASI01`, `/taxonomy?tab=cisco&entry=OB-004` expand and scroll to the entry.
- [ ] AISVS: `#C5` and `#C5.1.2` scroll/expand; search matches requirement text; ticking a requirement updates progress and persists after reload; the one-time "AISVS 1.01" notice shows once.

## Detail pages (threat, control, component, architecture)

- [ ] Section rail highlights the current item on lg+, hidden below.
- [ ] Prev/next navigation at the bottom.
- [ ] Framework chips deep-link to the exact entry.
- [ ] "Open in Threat Modeler" loads a template **without** overwriting the autosaved model.
- [ ] Unknown id (`/threats/t99`) shows the in-layout not-found page with suggestions.
- [ ] Architecture diagram: wheel scrolls the page; fullscreen dialog allows wheel zoom; "Walk an attack" steps highlight nodes and edges.

## Threat Modeler

- [ ] Direct load in dark mode is dark; React Flow controls follow the theme.
- [ ] Every template loads with no overlapping nodes; analysis finishes; results panel shows counts in tabs.
- [ ] Undo and **Redo** both work after delete, move and property edits.
- [ ] Clear empties the results panel and the dashboard.
- [ ] Marking a threat "mitigated" lowers the model score; "in progress" and "accepted risk" do not.
- [ ] Adding a Guardrail and a Human Approval Gate to Simple Agent lowers the score ≥ 15 points.
- [ ] Threat card shows rule id and evidence; "Not applicable here" suppresses and is undoable.
- [ ] Export menu closes on Escape and outside click; PDF, Markdown, CSV, SARIF, PNG, JSON all download; SARIF rule ids are catalog ids.
- [ ] Import JSON (v1 and v2), CycloneDX ML-BOM, Threat Dragon; share link round-trips; read-only banner shows for `?m=`.
- [ ] 390 px: palette and results open as bottom sheets; tap-to-add places a node; pinch zoom works.
- [ ] Keyboard: palette item + Enter places a node; arrows nudge; Delete removes; shortcuts do not fire inside inputs or dialogs.

## Learning and progress

- [ ] `/learn` stepper: quiz grades, ≥ 80 % completes the step, confetti once, progress persists.
- [ ] `/progress` rings reflect AISVS, controls, checklist, path and quizzes; export/import JSON round-trips; reset clears.

## Build and SEO

- [ ] `npm run validate` green; largest chunk < 600 KB; `index` chunk < 250 KB.
- [ ] `docs/sitemap.xml` lists every route; `docs/og/*.png` exist for routes and detail pages; page source has one `<title>`, canonical, `og:image`.
- [ ] Lighthouse desktop: Performance ≥ 90 (modeler ≥ 80), Accessibility ≥ 95, SEO ≥ 95 on `/`, `/threats`, `/aisvs`, `/nist-mapping`, `/threat-modeler`.

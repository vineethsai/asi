# Agentic Security Hub — Deep Improvement Plan

**Repo:** `vineethsai/asi` · **Live:** https://agenticsecurity.info · **Plan date:** 2026-11-03
**Audience:** the engineer/agent implementing this (expected: Claude Opus in this repo). Read §0 first.

This plan is the output of (a) a full browser walkthrough of every route in dark, light and 375 px mobile, (b) a line-level read of the page components and the threat-modeler engine, and (c) a web check of every dataset against its authoritative source (OWASP, CSA, NIST, Cisco, AIVSS, AIUC-1). Every finding below cites `path:line` against commit `87406d3`.

---

## 0. How to use this plan

- **Phases are ordered by dependency, not by size.** Phase 0 (correctness) and Phase 1 (foundation) unblock everything else; do not start Phase 2 page work until Phase 1's shared primitives exist, or you will build the same thing three times (the current codebase's core problem).
- **Each task has an ID** (`P1-03`), a scope, concrete file targets, and an acceptance check. Implement in that order inside a phase unless a task says it is independent. Keep PRs per task or per small group of tasks; the repo has `npm run validate` (typecheck + lint + data integrity + build) and a Husky pre-commit; both must stay green after every PR.
- **Single sources of truth.** Several tasks create a shared module (nav config, severity tokens, icon registry, KC taxonomy, progress store, page layout). Once a shared module exists, every later task must consume it rather than re-declaring its own copy. Grep before you write.
- **Data accuracy beats polish.** If a visual task and an accuracy task conflict, accuracy wins. This is an OWASP-branded reference site; a wrong ASI name is worse than a missing animation.
- **Motion is opt-in and gated.** All animation goes through the motion tokens in §8 and respects the existing `prefers-reduced-motion` rule (`src/index.css:662`).
- **Definition of done per phase** is in §11. Run it before declaring a phase complete.

Verification commands you will use constantly:

```bash
npm run validate
```

```bash
npm run check:data -- --check-links
```

```bash
npm run build && ls -S docs/assets/*.js | head -5 | xargs -I{} sh -c 'printf "%8d KB  %s\n" $(( $(stat -f%z {}) / 1024 )) {}'
```

---

## 1. Executive summary

The site has a lot of real content (15 threats, 18 controls, 40 component nodes, 5 architectures, 556 AISVS requirements, 72 NIST subcategories, 10 ASI entries, Cisco taxonomy, AIUC-1, a working threat-modeling engine) but presents it as flat, repetitive card lists with almost no motion, several visible bugs, and three mutually inconsistent copies of its own key taxonomy. The threat modeler is the strongest asset and also the noisiest: a 5-node template produces 123 threats, most of them duplicates.

The ten things that matter most, in order:

1. **Correctness bugs users hit immediately**: floating sidebar toggle overlaps every detail-page breadcrumb and page titles; theme is light on direct load of the Threat Modeler and 404; the architecture diagram hijacks the mouse wheel; the Implementation page prints raw markdown; hamburger menu does nothing on 8 pages; `/test-navigator` is a shipped dev page.
2. **Three conflicting KC1–KC6 taxonomies** (`frameworkData.ts` = OWASP official; `ComponentPalette.tsx:70-493` = a second naming; `ThreatModelerGuide.tsx:45-84` = a third). This is the single biggest accuracy problem.
3. **Stale/invented numbers** in copy: "100+ controls", "15+ attack vectors", hard-coded "13 categories"/"5 architectures", heuristic "coverage %" presented as data, "Active 18/18" stats, and a modeler dashboard that reports "40 met / 108 addressed" on a model with zero mitigations implemented.
4. **No shared layout**: mobile-menu state is copy-pasted into 11 pages, nav lists exist in 3 divergent copies, 5 pages have no `<Helmet>`, 8+ severity colour maps, 5 icon maps with mismatched keys (12 of 13 AISVS icons fall back to a warning icon).
5. **Visualizations are the weakest part of the UX**: a force graph with five truncated circles on the home page, a Sankey with 9 px truncated labels and hairline ribbons, a NIST tree that tears itself down and resets zoom on every click, a threat matrix that shows 8 of 40 components, a comparison matrix as a raw table.
6. **Zero motion system**: no entrance, stagger, count-up, tab transitions, diagram animation. Everything appears at once and sits still.
7. **Threat modeler noise and credibility**: duplicated per-node generic threats, inherited copies, undifferentiated attack paths, meaningless "mitigated" math (`riskScoring.ts:61-62` counts a threat as mitigated if it merely *has* suggested mitigations), light-only on direct load, overlapping template nodes, unusable on mobile.
8. **Discoverability**: Implementation, Interactive checklist, References, About, Threat Modeler Guide are unreachable from the header; taxonomy entries have no deep links; search is title-substring only, hidden on phones, and routes AISVS/ASI/Cisco hits to page roots.
9. **Three separate progress stores** (AISVS checkboxes, per-control checklists, security checklist) that never roll up anywhere.
10. **Nothing to come back for**: no learning path, quiz, scenario, featured content, or progress dashboard, despite styles (`.quiz-option`) and analytics events (`quiz_complete`) already existing for them.

Target outcome: a site that (1) is verifiably accurate against the 2026 sources, (2) has one layout/nav/theme/severity/icon system, (3) presents each dataset with a purpose-built, animated, accessible visualization, (4) has a threat modeler whose output a security engineer would put in a report, and (5) gives visitors a reason to return (progress, paths, quizzes, scenarios).

---

## 2. Current-state snapshot (facts to build on)

| Area | Fact |
|---|---|
| Stack | React 18, Vite 5, TS, Tailwind 3, shadcn/Radix, D3 v7, `@xyflow/react` 12, dagre, jspdf, react-router 6, react-helmet |
| Routes | 20 real routes + 4 redirects (`src/App.tsx:50-75`) |
| Data | 15 threats / 90 attack vectors / 18 controls / 40 component nodes / 5 architectures / 13 AISVS categories, 556 requirements / 4 NIST functions, 19 categories, 72 subcategories / 10 ASI / 19 Cisco objective groups, 40 techniques, 112 sub-techniques / 51 AIUC-1 requirements |
| Checks | `npm run typecheck`, `lint`, `check:data` all pass today; one warning: ASI04 and ASI07 are not referenced by any `threatsData.asiMapping` |
| Bundle (prod) | `ThreatModeler` chunk 1.19 MB, `ControlDetail` 645 KB (react-syntax-highlighter), `input` chunk 447 KB, `html2canvas` 197 KB, `ciscoTaxonomyData` 143 KB |
| Dead deps | `@tanstack/react-query` (0 uses), `@radix-ui/themes` (only the `<Theme>` wrapper, full stylesheet imported + 140 lines of `.rt-*` overrides in `index.css:487-625`), `recharts` (modeler dashboard only), `react-syntax-highlighter` (ControlDetail only) |
| Dead code | `src/components/home/ComponentsSection.tsx`, `src/pages/TestNavigator.tsx` + route, default-export shells in `OwaspAgenticTop10.tsx:255-265`, `CiscoTaxonomy.tsx:262-272`, `AIVSSCalculator.tsx:314-324`, `AIUC1Content.tsx:323-325`, `src/App.css`, ~30 unused classes in `index.css` (`.glass-card`, `.status-*`, `.nav-link`, `.btn-*`, `.form-*`, `.quiz-option*`, `.loading-skeleton`, `.flowchart-*`, `.progress-*`, …) |
| Persistence | localStorage keys: `theme`, `aisvs-checked-requirements`, `control-<id>-progress`, `ai-security-checklist`, `threat-modeler-autosave`, `threat-modeler-saved-models`, `threat-modeler-user-templates`, `threat-modeler-custom-components`, `threat-modeler-threat-statuses`, `threat-modeler-onboarding-seen` |
| Motion today | hero `animate-ping`/`animate-blink`, Radix accordion, `transition-colors` hovers, a few D3 transitions. Reduced-motion rule exists globally. |

---

## 3. Design direction

Keep the identity (Geist Sans/Mono, zinc dark surface, indigo primary, terminal `>_` motif); it is distinctive enough. Change how it is *used*:

- **Hierarchy over chrome.** Every list page currently stacks hero → stat line → "Filters & Search" card → "Quick Navigation" card (which duplicates the tabs) → tabs → content: ~600 px of chrome before the first real item. Replace with a single compact `<PageHeader>` (eyebrow, title, one-line description, inline stat chips, inline filter row) and drop the Quick Navigation cards entirely.
- **Severity is a system, not a style attribute.** One `lib/severity.ts` maps the project's scales (risk 1–10, impact high/medium/low, AISVS level 1–3, attack-vector severity, AIVSS, AIUC-1 confidence, checklist priority) to the existing `--security-*` CSS variables (`index.css:79-83`, currently unused). Badges, chips, matrix cells, chart series and modeler nodes all read from it. No more `style={{color: threat.color}}` on headings (fails contrast in light mode for the yellow/lime threats).
- **Data-driven copy.** Any number shown in UI text is computed from the data module at render time (counts, coverage, "X of Y"). No literal counts in JSX.
- **Motion with a purpose** (§8): entrance stagger to establish reading order, count-ups to draw the eye to stats, highlighted paths/edges to explain relationships, state transitions for progress. Nothing loops except the hero cursor.
- **One shell.** `PageLayout` owns Header, mobile drawer, optional section sidebar, Footer, Helmet defaults, skip link, and theme. Pages render content only.
- **Touch and keyboard first for SVG.** Every hover affordance gets a tap/focus equivalent; every colour encoding gets a text/shape equivalent.

---

## 4. Phase 0 — Correctness and accuracy (do first, small PRs)

### 4.1 Visible bugs

| ID | Bug | Where | Fix | Accept |
|---|---|---|---|---|
| P0-01 | Floating sidebar toggle overlaps breadcrumb on every detail page and the h1 on `/aisvs`, `/nist-mapping`; labelled "Controls" on AISVS/NIST and "Components" on Home | `src/components/layout/SidebarNav.tsx:112` (`fixed top-20 left-4`), wiring in `AISVS.tsx:188`, `NISTMapping.tsx:1495`, `Index.tsx` | Remove the floating pill. Section navigation becomes an in-layout left rail on `lg+` (collapsible, sticky under the header) rendered by `PageLayout` only when a page passes `section="threats"` etc. Home/AISVS/NIST pass nothing. | No fixed-position element overlaps page content at 1024/1280/1440 px; AISVS/NIST show no "Controls" rail. |
| P0-02 | Theme class only applied in `ThemeToggle` `useEffect`; direct load of `/threat-modeler` and `/404` renders light for dark users; dark users also get a light flash on every page | `src/components/layout/ThemeToggle.tsx:8-16`, `index.html` | Add an inline `<script>` in `index.html` `<head>` that reads `localStorage.theme` / `prefers-color-scheme` and sets `document.documentElement.classList` before first paint. Add `ThemeProvider` (context) in `App.tsx`; `ThemeToggle` consumes it. Add `<meta name="theme-color">` for both schemes. | Direct load of `/threat-modeler` in dark mode is dark; no flash on reload. |
| P0-03 | Architecture diagram zooms on mouse wheel instead of scrolling the page; at the end of a scroll the diagram is a dot | `src/components/visual/ArchitectureFlowDiagram.tsx:405` (`zoomOnScroll`) | `zoomOnScroll={false} zoomOnPinch panOnScroll={false} preventScrolling={false}`; keep `fitView`; add a small "⤢ fullscreen" control that opens the diagram in a dialog where wheel-zoom is allowed. | Wheel over diagram scrolls the page; diagram stays fitted. |
| P0-04 | Document title "Hierarchical Agent Architecture Architecture" | `src/pages/ArchitectureDetail.tsx:153,167` | Don't append " Architecture" when the name already ends with it (or drop the suffix everywhere). | Title reads once. |
| P0-05 | Implementation page renders markdown source (`**Heading:** - bullet`) as one paragraph | `src/pages/Implementation.tsx:178-193` | Use the same formatter as `ControlDetail.tsx:240-420` extracted to `src/components/content/RichText.tsx` (see P1-06). Also fix `ComponentDetail.tsx:529-556` (same bug). | No literal `**` on either page. |
| P0-06 | Hamburger does nothing on Taxonomy, Implementation, Interactive, References, About, Guide (pages render `<Header />` without toggle props) | those pages | Solved by P1-01 (`PageLayout` owns the drawer). Until then, do nothing. | Drawer opens on every page. |
| P0-07 | `/test-navigator` is a bare dev page in production | `src/App.tsx:72`, `src/pages/TestNavigator.tsx` | Delete route and file. | 404 at `/test-navigator`. |
| P0-08 | `<button>` nested in `<button>` (Checkbox inside AccordionTrigger) → React DOM warning | `src/components/interactive/SecurityChecklist.tsx` (accordion item header) | Move the Checkbox outside the trigger (sibling in a flex row). Same pattern check for `AISVS.tsx:284` (`CardTitle` h3 inside trigger button). | No `validateDOMNesting` warnings in console across all routes. |
| P0-09 | Data artifact title "$PDF$ OpenAI GPT-4.5 System Card" | `src/components/components/securityData.ts:6231` | Fix the title; extend `scripts/check-data-integrity.js` `collectReference` to reject titles matching `/\$[A-Z]+\$/`. | check:data fails on such titles. |
| P0-10 | Wrong counts in copy: "100+ security controls", "15+ attack vectors" | `src/pages/About.tsx:31,38,128-129` | Compute from data (`Object.keys(mitigationsData).length`, etc.). | No literal counts in About. |
| P0-11 | Hard-coded hero counts | `src/components/home/HeroSection.tsx:8,32` | Compute from `aisvsData` and `architecturesData`. | — |
| P0-12 | Export dropdown stays open after Escape / clicking the canvas (Threat Modeler) | `src/components/threat-modeler/CanvasToolbar.tsx` export menu | Use Radix `DropdownMenu` (add `@radix-ui/react-dropdown-menu`) instead of the hand-rolled menu; it handles outside-click/Escape/focus return. Same for the Templates menu. | Escape and outside click close menus; focus returns to trigger. |
| P0-13 | Collaborative Swarm template nodes overlap (x = 100/250/400 with 160–220 px nodes) | `src/components/threat-modeler/templates.ts` (swarm block ≈ lines 420-557) | Re-space all 7 templates on a 260 px horizontal / 180 px vertical grid, or run dagre on load for templates (`layoutDirection: "TB"`). | No node bounding boxes intersect after loading any template. |
| P0-14 | 404 page has no header, forces light background, uses `<a href="/">` full reload | `src/pages/NotFound.tsx` | Render inside `PageLayout`; add search box + "did you mean" links (threats/controls/architectures by fuzzy match on the slug). | — |
| P0-15 | Not-found branches of ThreatDetail/ControlDetail/ArchitectureDetail/ComponentDetail render without Header; ArchitectureDetail uses non-existent class `btn` | `ThreatDetail.tsx:362-371`, `ArchitectureDetail.tsx:144` | Use `PageLayout` + a shared `<NotFoundEntity type="threat" />`. | — |
| P0-16 | `og:image` points to non-existent PNGs; `index.html` uses `favicon.svg` as OG image and apple-touch-icon | `Index.tsx:54,65`, `Threats.tsx:182,195`, `Controls.tsx:243,256`, `index.html:23,29,33` | Generate real 1200×630 OG images at build (see P1-12). Point apple-touch-icon at the existing `public/apple-touch-icon.png`. | Social preview validators show an image. |
| P0-17 | JSON-LD `SearchAction` targets non-existent `/search?q=` | `src/pages/Index.tsx:106` | Remove until a search route exists (or implement `/search` in P1-10). | — |
| P0-18 | Analytics: `usePageTracking` deps include a new object literal each render → `gtag("config")` fires on every re-render (AISVS fires per checkbox); `useAnalytics` also fires per route → double page views | `src/hooks/useAnalytics.ts:11-15,35` | Memoize metadata via `useMemo`/`JSON.stringify` key; track page views in one place (route change only). | One `page_view` per navigation in GA debug view. |
| P0-19 | `<label>` without `htmlFor`, icon-only tab triggers with `hidden sm:inline` labels (no accessible name), clickable `<span>`/`<Badge>` not keyboard-operable | `Threats.tsx:274-321`, `Architectures.tsx:149-182`, `ThreatDetail.tsx:520-542`, `Taxonomy.tsx:73-84`, `CiscoTaxonomy.tsx:145-162` | `htmlFor`/`id` pairs; `sr-only` instead of `hidden`; buttons instead of spans. | axe DevTools: 0 serious/critical on these pages. |
| P0-20 | GA script before `<meta charset>`; no font preload (Geist woff2 fetched late, blank text pills on first paint) | `index.html:4-13`, `src/index.css:1-16` | Move charset/viewport first; add `<link rel="preload" as="font" type="font/woff2" crossorigin>` for both Geist files. | Fonts requested in the first 100 ms of the waterfall. |

### 4.2 Accuracy fixes (content against authoritative sources)

Every dataset was checked against its primary source (official PDFs/GitHub/standard sites) on 2026-11-03. Verdicts:

| Source (current version) | Repo file | Verdict | Action |
|---|---|---|---|
| OWASP Top 10 for Agentic Applications, **Version 2026** (Dec 2025) | `owaspAgenticTop10Data.ts` | **Accurate** (ASI01–ASI10 ids, names, related threats match Appendix A) | Add edition/date to the UI; add T16/T17 links once A2 lands (Appendix A maps ASI02→T16, ASI04→T16+T17, ASI07→T16). |
| OWASP Agentic AI Threats & Mitigations, **v1.1** (Dec 2025; the download PDF is labelled 1.1 while the landing page still shows the Feb 2025 cover — verify from the PDF) | `securityData.ts` `threatsData` | **Stale** | A2 below. |
| OWASP Securing Agentic Applications Guide 1.0 (Jul 2025), KC1–KC6 | `frameworkData.ts` | **Accurate** | Make it the single source (P1-05); modeler palette and guide currently contradict it. |
| OWASP **AISVS 1.01** (stable; 1.02-dev active) — 12 chapters, 214 requirements | `securityData.ts` `aisvsData` (13 categories, 556 requirements, header says "Source: User-provided data", line ≈4001) | **Wrong / pre-1.0 draft** | A1 below. This is the biggest content defect on the site. |
| CSA MAESTRO (7 layers) | `threat-modeler/types.ts` ✔ · `ThreatModelerGuide.tsx` ✘ | Engine accurate, guide wrong | A4. |
| NIST AI RMF 1.0 Core (72 subcategories) | `NISTMapping.tsx` | Text **accurate** (verbatim); `name` labels are site-invented; `aisvsMapping` uses draft C1–C13 codes | A8 + re-map after A1. |
| OWASP **AIVSS v0.8** (Mar 2026; site also links an AIVSS 1.0 calculator) | `aivssCalcData.ts`, `AIVSSCalculator.tsx` | **Wrong** (factors, formula, ThM, pre-scored table match neither v0.5 nor v0.8; export labelled "v0.5") | A3. |
| AIUC-1 **Q4-2026** (Oct 15 2026): 55 IDs, 49 active | `aiuc1Data.ts` (51, ≈Q1-2026) | **Stale** | A6. |
| Cisco AI Security Taxonomy **v2** (Sep 9 2026) | `cisco_taxonomy.json` (= v1, Dec 2025) | **Stale** (OB-002 is now Agentic Autonomy Failures; Jailbreak folded into OB-001) | A7. |
| MITRE ATLAS | — | **Over-claimed** in README/CHANGELOG (no ATLAS data or page exists) | A9. |

#### A1 — Re-base AISVS to 1.01 (own PR series; touches AISVS, Controls, NIST, modeler, progress)

1. **Generator, not hand-editing**: `scripts/import-aisvs.mjs` fetches `https://raw.githubusercontent.com/OWASP/AISVS/main/1.01/en/0x10-C0{1..12}-*.md`, parses chapter title, sections and requirement rows (`**1.2.3**`, text, level columns, role), and writes `src/data/aisvs.generated.ts` with `{ version: "1.01", retrievedAt, chapters: [{ code:"C1", name, description, sections:[{ code:"C1.1", name, requirements:[{ id:"C1.1.1", text, level:1|2|3, role }] }] }] }`. Commit the generated file; re-run to upgrade to 1.02 later.
2. Official chapter names (from the README): C1 Training Data Integrity & Traceability · C2 Input Validation · C3 Model Lifecycle Management & Change Control · C4 Infrastructure, Configuration & Deployment Security · C5 Access Control & Identity for AI Components & Users · C6 Supply Chain Security for Models · C7 Model Behavior, Output Control & Safety Assurance · C8 Memory, Embeddings & Vector Database Security · C9 Orchestration & Agentic Security · C10 Model Context Protocol (MCP) Security · C11 Adversarial Robustness · C12 Monitoring, Logging & Anomaly Detection. **No C13.** Citation form `v1.01-C9.4.3`.
3. Delete the draft `aisvsData` (≈11,600 lines of `securityData.ts`), including its 556 filler references (dozens of identical "MITRE ATLAS ML Attack Framework" entries that inflate the References page).
4. Re-map consumers: `NISTMapping.tsx` `aisvsMapping` arrays (hand re-map each of the 72 subcategories to C1–C12 with the new C10/C11 meanings; drop C13), `Controls.tsx` `aisvs-*` tags and the new `mitigation.aisvsCategories` field (6.4), `threat-modeler/engine/aisvsMapping.ts` + `CompliancePanel`, ThreatDetail/ControlDetail framework chips, Hero/About counts (computed), CHANGELOG line "556 requirements".
5. Progress migration: old draft requirement ids do not exist in 1.01; on first load after the change, `useProgress` archives the old `aisvs-checked-requirements` under `legacy` and shows a one-time notice ("AISVS was updated to 1.01; previous checkmarks were archived").
6. `check:data` verifies `aisvs.generated.ts` matches the schema and that every AISVS code referenced anywhere in `src/` exists in it.

#### A2 — Threats: adopt Threats & Mitigations v1.1

- Restore full official names (`securityData.ts`): T5 "Cascading Hallucination Attacks" (`:370`), T7 "Misaligned & Deceptive Behaviors" (`:526`), T8 "Repudiation & Untraceability" (`:602`), T9 "Agent Identity Compromise" (v1.1 rename of "Identity Spoofing & Impersonation", `:676`), T10 "Overwhelming Human in the Loop" (`:747`), T11 "Unexpected RCE and Code Attacks" (`:820`), T12 "Agent Communication Poisoning" (`:896`), T13 "Rogue Agents in Multi-Agent Systems" (`:969`), T14 "Human Attacks on Multi-Agent Systems" (`:1048`). Keep a `shortName` for cards.
- **Add T16 Insecure Inter-Agent Protocol Abuse** (MCP/A2A protocol flaws: consent bypass, context hijacking) and **T17 Supply Chain Compromise**, each with `componentIds`, `attackVectors`, `impactLevel`, `mitigationIds` (new controls likely needed: "MCP server hardening & tool provenance", "Agent supply-chain integrity"), references, and ASI mappings (ASI02/ASI04/ASI07 → T16; ASI04 → T17).
- Fix `asiMapping` against Appendix A: t8 → `["ASI08","ASI09"]` and t12 → `["ASI04","ASI06","ASI07"]` (both currently have **no** mapping); t4 add ASI02; t2 add ASI04; t6 add ASI06; t11 add ASI04; t13 add ASI04; t7 → `["ASI01","ASI09"]` (ASI10 is not official); keep t9→ASI03 and t15→ASI09 but flag `unofficial: true`. Make the "every ASI referenced by ≥1 threat" check an error.
- Add `sourceVersion: "OWASP Agentic AI T&M v1.1 (2025-12)"` and refresh `lastUpdated`; m2–m18 still say `version: "2024.2"`, m12 says `"1.0"` — normalise.

#### A3 — AIVSS: re-base the calculator

- Replace the invented model (`aivssCalcData.ts:30-300, 549-575`) with the newest **published** OWASP AIVSS model. As of this audit: **v0.8** — ten factors *Execution Autonomy, External Tool Control Surface, Natural Language Interface, Contextual Awareness, Behavioral Non-Determinism, Opacity & Reflexivity, Persistent State Retention, Dynamic Identity, Multi-Agent Interactions, Self-Modification* (each 0 / 0.5 / 1.0); `AARS = (10 − CVSS_Base) × (Factor_Sum / 10) × ThM`; `AIVSS = (CVSS_Base + AARS) × Mitigation_Factor`; ThM by exploit maturity (Attacked 1.00 / PoC 0.97 default / Unreported 0.50); Mitigation Factor 1.00 / 0.83 / 0.67; CVSS **v4.0** base. aivss.owasp.org also links a live "AIVSS 1.0" calculator — the implementer must open it, and if it defines a newer model, implement that instead; whichever is chosen, show "AIVSS vX.Y" in the UI and in the JSON export (today mislabelled `AIVSS-Agentic-v0.5`, `AIVSSCalculator.tsx:94`).
- Replace `coreRiskScores` (every risk 10.0 — an artefact of the invented formula) with the official published ranking (v0.5 table: Tool Misuse 8.7 · Access Control Violation 7.6 · Orchestration & Multi-Agent Exploitation 7.2 · Cascading Failures 7.1 · Identity Impersonation 6.3 · Insecure Critical Systems Interaction 5.8 · Memory & Context Manipulation 5.7 · Supply Chain 5.0 · Untraceability 4.8 · Goal & Instruction Manipulation 3.0) or recompute under v0.8 and label the method. Fix the internal inconsistency ASI07 ↔ "Orchestration" vs "Memory & Context" (`aivssCalcData.ts` rank 4 vs `aiuc1Data.ts:1625-1636`).

#### A4 — MAESTRO in the Guide

`ThreatModelerGuide.tsx:138-151`: L4 must be "Deployment & Infrastructure" (not "Inter-Agent Communication"), L5 "Evaluation & Observability" (not "Security & Compliance"), L6 "Security & Compliance" (not "Deployment Infrastructure"). Component→layer labels at `:48,72,86,101,109` are also wrong (e.g. "L2: Foundation Models" should be L1). Resolved structurally by generating the guide from `types.ts` (§6.12, P3-39).

#### A5 — One KC taxonomy — see P1-05 (palette `ComponentPalette.tsx:70-493` and guide `:45-84` must use the official names from `frameworkData.ts`).

#### A6 — AIUC-1 Q4-2026 refresh (`aiuc1Data.ts`)

55 IDs (A 9, B 10, C 12, D 4, E 18, F 2), 49 active. Add A008 "Prevent leakage of credentials and secrets", A009 "Third-party testing for data & privacy risk", B010 "Promote secure patterns in generated code", E018 "Third-party testing for accountability risk". Rename: B001→"Third-party testing for security risk", C010→"Third-party testing for safety risk", D004→"Third-party testing for reliability risk", E006→"Conduct vendor and model due diligence", A003→"Limit AI agent data access", B008→"Protect AI system deployment environment", C005→"…agent-specific high risk outputs", C007→"Flag high risk outputs for human review", E005→"Document data storage security", E015→"Log AI system activity". Mark C011, C012, D002 retired. Header `:3` "51 requirements" → computed. Show "AIUC-1 Q4-2026" in the tab header.

#### A7 — Cisco taxonomy v2

Import v2 (Sep 2026): OB-002 becomes "Agentic Autonomy Failures" (AITech-2.1 Excessive Agency, 2.2 Goal Drift, 2.3 Reward Hacking; +8 sub-techniques); jailbreak folds under OB-001. Surface `"version"` (`cisco_taxonomy.json:2`) in the tab header. Re-map: `threatsData.t6.ciscoMapping` (`securityData.ts:521`) and ASI01 `relatedCiscoObjectives` (`owaspAgenticTop10Data.ts:81`) currently mean "Jailbreak" by OB-002 → move to OB-001; OB-002 (v2) now belongs with T7/T13/ASI10. Also fix weak links: t10→OB-008 and t14→OB-008 (`:815`, `:1115`; OB-013/OB-012 fit better), t5→OB-013 (`:442`; OB-015 fits better); align ASI02/ASI04/ASI06 Cisco lists with the JSON's own technique mappings; ASI09/ASI10 lists include objectives the JSON does not map.

#### A8 — NIST

Label the invented subcategory `name` fields as editorial summaries (tooltip "Short label by this site; NIST text below"). Add NIST AI 600-1 (Generative AI Profile, Jul 2024) as a tag layer: each subcategory may list the GAI risks it addresses; show as chips and as a filter. Note in the page footer that AI RMF 1.0 is being updated by NIST.

#### A9 — Claims in README / CHANGELOG / About

Remove or fulfil the MITRE ATLAS claim (`README.md:7,26`, `CHANGELOG.md:15`); recommended: fulfil it minimally with an ATLAS technique crosswalk tab in Taxonomy generated from the Cisco JSON's ATLAS mappings (it already carries them) rather than a full ATLAS browser. Fix `README.md:20` ("router, parallel" patterns do not exist; the five are sequential, hierarchical, collaborative, reactive, knowledge-intensive). Replace all literal counts with generated ones (a `scripts/print-counts.mjs` can emit a README badge block).

#### A10 — References hygiene

Fix wrong arXiv titles: `owaspAgenticTop10Data.ts:134` (2504.19951 is "Securing GenAI Multi-Agent Systems Against Tool Squatting", not Progent) and `:75,:637` (2503.12188 is "Multi-Agent Systems Execute Arbitrary Malicious Code", not AgentFlayer — AgentFlayer is a Zenity Labs post). Replace bare-domain URLs (`:66 securityadvisory.io`, `:138 aim.security`, `:142 bleepingcomputer.com`, `:197 blackhat.com`, `:322 cole-murray.com`, `:325 github.com`, `:449 usenix.org`, `:451 mdpi.com`) with the specific article or remove. References page: de-duplicate by URL and show "cited by N" instead of listing the same link dozens of times. Extend `check:data` to flag bare-domain URLs (path = `/`) and to run `--check-links` in a weekly scheduled workflow (not on every push).

#### A11 — Provenance everywhere

Every dataset module exports `source: { name, version, url, retrievedAt }`; `PageHeader` renders "Source: OWASP AISVS 1.01 · retrieved 2026-11" on AISVS, Taxonomy tabs, NIST, Threats, Controls, Components; exports (PDF/Markdown/SARIF `tool.driver.version` + `properties.sources`) carry the same. `check:data` warns when `retrievedAt` is older than 12 months.

---

## 5. Phase 1 — Foundation (shared primitives; everything later depends on these)

| ID | Task | Details | Accept |
|---|---|---|---|
| P1-01 | `src/components/layout/PageLayout.tsx` | Props: `title`, `description`, `canonicalPath`, `ogImage?`, `section?: "components"\|"threats"\|"controls"\|"architectures"`, `activeId?`, `wide?`, `noFooter?`. Owns Header, mobile drawer state, section rail (replaces floating pill), Footer, skip link, Helmet defaults (title template `"{title} · Agentic Security Hub"`, canonical from `canonicalPath`, OG/Twitter from title/description/ogImage, `og:url` **without** `/#/`). Migrate all 19 pages; delete the 11 copies of `isMobileMenuOpen`. | Every page uses `PageLayout`; `grep -c isMobileMenuOpen src/pages` = 0; Taxonomy has a title. |
| P1-02 | `src/config/navigation.ts` | One typed array: `{ label, path, icon, group: "learn"\|"verify"\|"tools"\|"project", description, showIn: ("header"\|"drawer"\|"footer"\|"palette")[] }`. Header shows 8 primary items + an "More" dropdown (Implementation, Checklist, References, Guide, About); drawer shows all grouped; footer derives its three columns from `group`. Delete the three hand-written lists (`Header.tsx:153-162`, `SidebarNav.tsx:85-97`, `Footer.tsx`). | All routes reachable from Header or its More menu; one definition. |
| P1-03 | `src/lib/severity.ts` + `<SeverityBadge>` / `<RiskScore>` / `<PhaseBadge>` | Exports: `riskBand(score: 1..10) → "critical"\|"high"\|"medium"\|"low"` (thresholds ≥8 / ≥6 / ≥4 / else, the thresholds the three current copies agree on), `impactBand`, `aisvsLevelBand`, `severityToken(band) → { fg, bg, border, chart }` using `--security-*` vars, plus dark-aware Tailwind classes. Replace the ≥8 ad-hoc maps listed in the audit (`Threats.tsx:53`, `ThreatDetail.tsx:383-399`, `ArchitectureNavigator.tsx:732,1165`, `ComponentDetail.tsx:438-442`, `Controls.tsx:1115-1120`, `ControlDetail.tsx:765-770`, `AISVS.tsx:118-129`, `SecurityChecklist.tsx:608-621`, `AIUC1Content.tsx:95-101`). Also delete the non-dark-aware `threat/control/architecture` hexes in `tailwind.config.ts:52-63` in favour of CSS vars. | `grep -rn "bg-red-100\|text-yellow-" src/pages` returns 0 (all via tokens). Light-mode contrast ≥ 4.5:1 on every badge (check with axe). |
| P1-04 | `src/lib/icons.ts` single icon registry | Map every data icon key (AISVS 13, mitigations 18, threats 15, architectures 5, ASI 10, AIUC-1 principles 6, components 6) to a lucide component. Delete `Controls.tsx:54-68`, `OwaspAgenticTop10.tsx:34`, `AIUC1Content.tsx:29`, `References.tsx:147`, and fold `ui/icon.tsx` into it. Add a data-integrity check that every `icon` field in data resolves. | 0 fallbacks to `AlertCircle`/`Shield`; check:data fails on unknown icon keys. |
| P1-05 | `src/data/kc.ts` canonical KC taxonomy | The official OWASP Securing Agentic Applications KC names from `frameworkData.ts` are the source of truth. Export `KC = { kc1: { code:"KC1", name:"Language Models (LLMs)", short:"LLMs", color, icon, maestroLayers }, … }`. The modeler palette groups (`ComponentPalette.tsx:70-493`) and the guide (`ThreatModelerGuide.tsx:42-230`) import from it; palette *sub-groups* (e.g. "KC5 Read-Only Tools") keep their own labels but are nested under the official KC heading. Add `kcColor` to severity/colour tokens. | `grep -rn '"KC[1-6]: ' src` returns only `src/data/kc.ts`. |
| P1-06 | `src/components/content/RichText.tsx` | Extract `ControlDetail.tsx:240-420` formatter (handles `**Heading:**`, `- bullets`, inline code, `AISVS Vx.y.z` tokens → links) into a component used by ControlDetail, Implementation, ComponentDetail, and modeler mitigation text. Replace per-word `<span>` + per-term `TooltipProvider` (`ControlDetail.tsx:216-228`) with a single provider and a term-regex pass. | Snapshot test of one mitigation renders identical structure on all three pages. |
| P1-07 | `<PageHeader>` | Eyebrow (section), h1 `text-2xl md:text-3xl` left-aligned, description, `stats: {label, value, hint?}[]` rendered as chips with count-up (§8), optional `actions` slot, optional `filters` slot (search + selects in one row). Used by every list page; delete the "Quick Navigation" cards (`Threats.tsx`, `Controls.tsx`, `NISTMapping.tsx:1524-1567`). | First content card visible without scrolling at 1280×800 on Threats/Controls/NIST. |
| P1-08 | `src/lib/progress.ts` + `useProgress()` | One versioned store `ash-progress-v1` with namespaces `{ aisvs: Set<reqId>, controls: Record<controlId, Set<taskId>>, checklist: Set<itemId>, quizzes: Record<quizId, score>, path: Record<stepId, done> }`, migration from the three legacy keys, selectors (`aisvsPct`, `aisvsLevelPct(level)`, `controlsStarted`, `checklistPct`), export/import JSON, reset. Used by AISVS, ControlDetail, SecurityChecklist, Home progress card, Learning Path (Phase 4). | Legacy keys migrated on first load; progress visible on Home. |
| P1-09 | `src/components/charts/` primitives | Thin wrappers used by all visualizations: `ChartFrame` (title, legend slot, toolbar slot, empty state, `role="img"` + `aria-label` + visually-hidden data table), `useChartTheme()` (reads CSS vars *reactively* on theme change via a `MutationObserver` on `<html class>`), `Tooltip` (positioned, keyboard-dismissable), `useResizeObserver`. D3 charts must use incremental joins (`.join()`), never `selectAll("*").remove()` on update. | NIST graph/Sankey/Navigator re-colour live when the theme toggles. |
| P1-10 | Command palette (⌘K / Ctrl-K / `/`) | Replace the header search with a `cmdk`-style dialog (add `cmdk`): grouped results (Pages, Threats, Controls, Components, Architectures, AISVS, ASI, Cisco, AIUC-1), code-aware matching (`T7`, `M3`, `C5`, `ASI01`, `OB-004`, `V2.1.3`), recent items, keyboard nav, works on mobile (icon button always visible). Deep-link targets: `/aisvs#C5`, `/taxonomy?tab=owasp-agentic&entry=ASI01`, `/taxonomy?tab=cisco&entry=OB-004`, `/nist-mapping?sub=GOVERN.1.1`. Fix duplicate React keys (`Header.tsx:275`). | Typing `asi03` opens ASI03 expanded; `/` focuses palette on any page. |
| P1-11 | Deep links | `Taxonomy.tsx` reads `?tab=&entry=` and expands/scrolls to the entry (`OwaspAgenticTop10Content` already has `expandedId` + `#entry-` ids `:49,:103`); AISVS reads `#C5` / `#V2.1.3`; NIST reads `?sub=`. All cross-links from ThreatDetail (`:952,989,1026`), Controls, Cisco, ASI use them. Remove the four redirect routes once nothing links to them (keep as redirects for external links). | Every framework chip on ThreatDetail lands on the exact entry. |
| P1-12 | SEO/meta pipeline | Build-time script (`scripts/generate-seo.js`, run in `postbuild`): regenerate `sitemap.xml` from the route list + data ids (today it is dated 2025-02-16 and lists removed `/vulnerabilities`), generate OG PNGs per route and per threat/control/architecture via `@resvg/resvg-js` or `satori` (1200×630, title + section + severity strip), emit `docs/og/*.png`. `PageLayout` sets `og:image` accordingly. | `sitemap.xml` lists every route; each detail page has a unique OG image. |
| P1-13 | Dead code and dependency removal | Delete: `TestNavigator`, `ComponentsSection`, `App.css`, the four unused page shells, `@tanstack/react-query` (+ provider), `@radix-ui/themes` (+ `styles.css` import + `index.css:487-625`), unused `index.css` classes (keep `.skip-to-content`, `.hero-grid-bg`, `.animate-blink`, `.term-prompt`, reduced-motion block), duplicate `@keyframes fade-in` (`index.css:445` vs `tailwind.config.ts:87`), `ArchitectureNavigator.tsx:49-226` duplicate of `componentDataMap.ts`, `ARCH_TO_TEMPLATE` duplicate (`Architectures.tsx:23`/`ArchitectureDetail.tsx:16`), `FCOLORS` duplicate (`ThreatDetail.tsx:70`/`Taxonomy.tsx:564`), analytics events never emitted. | `npm run build` size of `index` chunk drops ≥ 80 KB; no unused exports (run `npx knip` once and fix). |
| P1-14 | Code splitting for heavy chunks | Lazy-load `react-syntax-highlighter` (use the `light` build + register only `bash`, `python`, `typescript`, `yaml`, `json`), lazy-load `jspdf`/`jspdf-autotable`/`html-to-image` inside the export handlers only, lazy-load `ReportDashboard` (recharts) when its tab opens. | `ThreatModeler` chunk < 600 KB, `ControlDetail` < 150 KB. |
| P1-15 | Data integrity script extensions | Add checks: icon keys resolve (P1-04); KC names in palette/guide equal `kc.ts`; every ASI entry referenced by ≥1 threat (currently ASI04, ASI07 are not — fix the mappings, then make it an error); reference titles sane (P0-09); no `**` markdown in `description` fields (only in `implementationDetail`); `lastUpdated` within 18 months → warning. | `npm run check:data` covers the new fields. |

---

## 6. Phase 2 — Page-by-page redesign

Conventions for every page: uses `PageLayout` + `PageHeader`; stats from data; filters in header row; severity via tokens; entrance stagger on card grids (§8); empty state component when filters match nothing; every visualization through `ChartFrame`.

### 6.1 Home (`/`)
Current: static hero + six link cards, a half-empty architecture showcase (350 px box, diagram occupies ~30 %), and a giant force graph with five truncated circles.
Plan:
1. **Hero**: keep title/cursor. Replace the six-card grid with a 2-row "what's inside" strip whose cards carry *live counts* (15 threats, 18 controls, 556 requirements, 5 patterns, 7 modeler templates) and count-up on first view. Add Components and Taxonomy cards (they are in the header nav but not the hero).
2. **Featured threat** ("Threat of the day", deterministic by date from `threatsData`): code, name, one-line description, CIA chips, risk ring, the ThreatDetail constellation SVG at thumbnail size, "Read →". Rotates daily; gives a reason to return.
3. **Architecture showcase**: keep the tabbed diagram but make it full-width with the description beneath; the diagram runs the attack-path animation (§8.5) for the pattern's `relevantThreats[0]` when the tab becomes visible (IntersectionObserver), with a replay button.
4. **Your progress** card (from `useProgress`): AISVS %, controls started, checklist %, last quiz; hidden if all zero, replaced by a "Start the learning path" CTA (Phase 4).
5. **Replace** `ArchitectureGraphSection` with a compact "Explore the graph" CTA that opens the navigator in a dialog or links to `/architectures?view=graph`. Do not mount the 1242-line explorer on first paint.
6. Section order: Hero → Featured threat + Progress (2 cols) → Architecture showcase → "How to use this site" 4-step strip (Learn components → Map threats → Pick controls → Verify with AISVS → Model it) → Footer.

### 6.2 Components (`/components`, `/components/:id`)
- List: implement the dead filter/sort state (`Components.tsx:13-15`) as header filters; keep canonical KC1→KC6 order (never alphabetical). Add a **hierarchy sunburst/treemap** (`ChartFrame`, D3 `partition` or `treemap`): 6 KCs → 40 nodes, area = threat count, click = navigate, hover/tap = tooltip with threat chips. Cards: KC code pill, 2-line description, "N subcomponents · M threats" chips; threat badges become `SeverityBadge` links.
- Detail: Radix Tabs (`role="tab"`) instead of the hand-rolled tabs (`ComponentDetail.tsx:263-316`); fix invisible build badge (`:495`); `RichText` for mitigation text (`:529-556`); Architectures tab shows the `ArchitectureFlowDiagram` thumbnail with this component's nodes highlighted; fix JSON-LD `datePublished: new Date()` (`:193`) → use `lastUpdated`.

### 6.3 Threats (`/threats`, `/threats/:id`)
- List: `PageHeader` with stats (threats, attack vectors, mitigations) and filter row; remove hero-sized centered h1 (`Threats.tsx:238`) and the Quick Navigation card. Cards: already good; replace inline colour on h3 (`:408,573`) with a left severity bar + `RiskScore`. Add sort by risk/name/mitigations as a segmented control.
- **Threat × Component heatmap** (replaces the 8-of-40 "!" matrix at `:519-660`): rows = 15 threats, columns = 40 nodes grouped under KC1–KC6 headers (collapsible groups), cell = risk-scaled fill with text/shape fallback (`●` size), row/column totals, respects filters and sort (today uses `threats` not `sortedThreats`, `:556`), click cell → threat detail with the component tab preselected, keyboard navigable (roving tabindex), sticky headers, horizontal scroll on mobile with first column pinned.
- Detail: keep the structure (it is the best page). Add prev/next threat footer nav; `sr-only` tab labels; deep-linked framework chips (P1-11); a **kill-chain strip**: attack vectors ordered by severity with the mitigations that address each, laid out by phase (Design → Build → Operations); make constellation nodes focusable with tooltips on focus; "Open in Threat Modeler" button that loads the template with this threat's affected component types pre-added.

### 6.4 Controls (`/controls`, `/controls/:id`)
- List: `PageHeader`; drop "Active Controls 18/18" stat (`Controls.tsx:324`) and the "Active" badge on cards; rename the destructive "Risk: 8" badge (`:499`) to a neutral "Addresses risk 8/10" `RiskScore`; filters must apply consistently (AISVS Category currently does nothing on the Controls tab; Threat filter empties the AISVS tab silently, `:619`; tab count vs accordion mismatch `:611-621`).
- **Replace the heuristic Integration Matrix** (`:753-1006`, `name.includes("memory")`-style matching summarised as "Coverage Rate %") with a real mapping: add `aisvsCategories: string[]` (and optional `aisvsRequirements: string[]`) to each mitigation in `securityData.ts` (the `aisvs-*` tags at `:548` are a start), validated by check:data. Visualize as **coverage bars per AISVS category** (13 rows, segments = controls) plus a **control radar** (13 axes) on each control's detail page. Label any remaining heuristic as such.
- Detail: Helmet canonical/OG (`ControlDetail.tsx:616-622`); glossary (`:138-204`) becomes data per control or is removed; progress rolls into `useProgress`; show a per-phase progress ring in the header stats; "Related controls" by shared threats.

### 6.5 Architectures (`/architectures`, `/architectures/:id`)
- List: whole card clickable (`:284,295` leftovers removed); each card shows the `ArchitectureFlowDiagram` as a static thumbnail (render once with `nodesDraggable={false}`, no controls) + risk sparkline (threat count by severity). Replace `FeatureComparisonMatrix` table (`:12-205`, hard-coded 1–5 scores) with a **small-multiple radar** (8 axes × 5 patterns, toggle overlay/individual) and keep the table as the `sr-only`/expandable "data" view.
- Detail: fix `realWorldExamples` keys `swarm`/`knowledge` (`ArchitectureDetail.tsx:53,67`) so Knowledge-Intensive gets examples; convert the single 600-line column into tabs (Overview · Diagram · Components · Threats · Mitigations) with a sticky in-page TOC on `lg+`; collapse the three-level nested component boxes (`:355-490`) into the sunburst from 6.2 filtered to this architecture; replace yellow-dot matrix (`:591`) with the heatmap component from 6.3 filtered to this architecture's threats; **"Walk an attack"**: step-through of `relevantThreats` that highlights the affected node and animates the edge path (§8.5).

### 6.6 AISVS (`/aisvs`)
- Search filters requirements too (today categories only, `AISVS.tsx:320-325`) with match highlighting and auto-expand; icons from the registry (12/13 currently fall back); fix heading-in-button (`:284`); `og:url` hash form (`:151,170`).
- **Level progression visualization**: per category a stacked bar L1/L2/L3 done vs total; a global "Level 1 complete" milestone with celebration animation (§8.6); "Verify to L1" preset filter.
- Requirement rows: level pill via tokens, copy-id button, link to the controls that cite this requirement (reverse index built from mitigation references at module load).
- Export progress as CSV/JSON (from `useProgress`).

### 6.7 NIST AI RMF mapping (`/nist-mapping`)
README calls this "force-directed"; it is a hand-laid columnar tree (`NISTMapping.tsx:1063-1164`) that tears down and resets zoom on every click (`:1028,1452`), reads theme colours once (`:1031-1035`), uses absolute column x (`:1064-1068`, overlaps under ~950 px), has no legend, and whose "highlight related NIST controls" promise (`:1929`) does nothing (`:1219` keeps 0.35 opacity).
Plan:
1. Rewrite the graph as a **bipartite/hierarchical edge-bundling view** with incremental D3 joins: columns Function → Category → Subcategory → AISVS category, widths from container (`useResizeObserver`), zoom/pan preserved across state changes, selected path highlighted (links to full opacity, others 0.08), hover/tap tooltips, legend, zoom buttons (reuse Navigator's), theme-reactive via `useChartTheme`.
2. **Compliance matrix**: all 13 AISVS columns (today `slice(0,10)` drops C11–C13, `:1864,1885`), sticky headers, cell = mapping strength (count of subcategories) as sequential fill, click = detail drawer. Filters (search/function/category) apply to all tabs, not only Detailed Mapping (`:1756`).
3. Details drawer (right side on `lg+`, bottom sheet on mobile) instead of a panel 650 px below the canvas.
4. Add NIST AI 600-1 (GenAI profile) risk tags where the data provides them (see §4.2).

### 6.8 Taxonomy (`/taxonomy` + tabs)
- Add `<Helmet>` (none today → inherits previous page's title); one `<h1>`; sub-tabs render `<h2>` (`OwaspAgenticTop10.tsx:63`, `CiscoTaxonomy.tsx:114`, `AIVSSCalculator.tsx:123`).
- **Sankey rewrite** with `d3-sankey` (add dep): weighted ribbons (link weight = number of shared mappings), nodes grouped by framework with group headers, 12 px labels with full text (truncate only on `<md` with tooltip), click-to-pin highlighting (tap on touch), keyboard focus on nodes, a framework toggle row (OWASP Agentic · Cisco · AIVSS · AIUC-1) and a "threat focus" select that dims everything except one threat's ribbons. Height grows with node count; horizontal scroll on mobile.
- Framework Interconnection Map: keep, add tap/focus, animate link weights on load (§8.4).
- Density matrix: keep; make cells clickable → filtered Sankey.
- OWASP Agentic Top 10 tab: deep-link entries (P1-11); each entry card gets related threats (T-codes) and related controls as chips; add "attack scenario" accordion from `attackScenarios` data.
- Cisco tab: filter badges become buttons; technique rows show their OWASP/ATLAS/ATT&CK cross-refs as chips.
- AIVSS tab: animated gauge (§8.3); factors as segmented controls (0 / 0.25 / 0.5 / 0.75 / 1) instead of 10 selects; clicking a pre-scored core risk loads its `factorValues` into the calculator (`coreRiskScores[].factorValues` exists, unused) and animates the gauge; "share" copies a URL with factor values in the query string.
- AIUC-1 tab: replace native `<select>` (`AIUC1Content.tsx:240-260`) with shadcn Select; add a principle-level coverage bar.

### 6.9 Implementation (`/implementation`)
Today a flat duplicate of `/controls` with raw markdown. Re-scope as **"Lifecycle view"**: a horizontal Design → Build → Operations timeline; each phase lane shows its controls as chips; selecting a control opens its phase tasks inline (`RichText`) with checkboxes bound to `useProgress`; a phase progress ring per lane. Reachable from the More menu and from every control detail ("See in lifecycle").

### 6.10 Interactive checklist (`/interactive`)
Rename to "Security Checklist" everywhere (title, h1, footer link disagree today). Fix nested buttons (P0-08). Link each item's `aisvsReference` to the AISVS deep link and verify the references (at least one looks mis-filed: API auth → C3.1, `SecurityChecklist.tsx:376`). Use the Prism+copy code block from ControlDetail. Label the "Security Score" (`:623-640`) as a weighted estimate and show the weights. Progress from `useProgress`.

### 6.11 References (`/references`)
Keep; add type facets (paper / standard / tool / blog), "cited by" chips linking back, favicon/domain per link, stable keys (not `index`), and a copy-BibTeX-ish "cite" action for standards.

### 6.12 About, Guide, 404
- About: data-driven counts; methodology steps become the Learning Path entry (Phase 4).
- Threat Modeler Guide (`ThreatModelerGuide.tsx`, 1216 lines of static JSX): import `COMPONENT_TYPES`, `MAESTRO_LAYERS`, `TEMPLATES`, `KEYBOARD_SHORTCUTS` from the modeler's own modules instead of hand copies (`:42-230`); render the MAESTRO section as a **layer stack diagram** (7 stacked bands, component chips placed on their layer, hover shows threats per layer).
- 404: P0-14.

---

## 7. Phase 3 — Threat Modeler overhaul

Path shorthand in this section: `TM/` = `src/components/threat-modeler/`.

### 7.0 Where it stands (measured)

The engine was bundled and run against all 7 built-in templates (probe script, not committed). Results:

| Template | Nodes/edges | Threats | Inherited | Inherited onto an already-affected node | Overall risk |
|---|---|---|---|---|---|
| rag-pipeline | 4/4 | 60 | 36 | 22 | 66 High |
| simple-agent | 4/3 | 55 | 30 | 11 | 69 High |
| sequential-pipeline | 5/4 | 61 | 32 | 21 | 65 High |
| reactive-agent | 5/4 | 72 | 37 | 14 | 68 High |
| knowledge-intensive | 6/5 | 91 | 54 | 20 | 69 High |
| multi-agent | 6/5 | 106 | 62 | 31 | 65 High |
| collaborative-swarm | 5/7 | 123 | 68 | 51 | 67 High |

Two facts drive this whole section: **every model scores 65–69 "High" no matter what is in it**, and **half the output is propagated noise**. A security engineer will not trust it until both change.

As-is architecture: one 2,060-line component `TM/ThreatModelCanvas.tsx` with ~35 `useState` hooks (nodes/edges, `analysisResult` *and* an identical `fullAnalysisResult`, risk, paths, AISVS, compliance, gap, surface, AIUC-1, statuses, custom components, selection, dialogs, undo history). `doAnalysis()` (line 386) → `engine/threatEngine.ts` (MAESTRO catalog + cross-layer + connection rules + topology rules + inherited propagation → dedup) → `dataIntegration.ts` (name-substring join to `securityData.ts`, regex Cisco/OWASP mapping) → seven follow-on analyses, each in its own state → `ThreatResultsPanel` (9 tabs) / `NodePropertiesPanel` → exporters read state slices directly. Persistence: six unrelated localStorage keys, no schema version, statuses keyed by node *instance* id under a global key. No tests; no test runner in `package.json`.

### 7.1 Engine correctness (fix before touching UX)

| ID | Bug | Where | Fix |
|---|---|---|---|
| P3-01 | Dedup mutates `affectedNodeIds` in place and keys on `name` (two catalog threats with the same name, or a custom threat named like a MAESTRO one, collapse) | `TM/engine/threatEngine.ts:49` | `[...ids].sort()`; key on `(threatId ?? ruleId) + sortedIds + inherited`. |
| P3-02 | `summary.mitigated` hard-coded 0; canvas recomputes it but exporters receive the raw result | `threatEngine.ts:75`, `ThreatModelCanvas.tsx:1635-1674` | Compute in the engine from threat status + applied mitigations; exporters consume one authoritative result object. |
| P3-03 | Inherited propagation re-emits threats onto nodes already in `affectedNodeIds`; depth-1 keeps full severity (`Math.floor(1/2)=0`); never looks at edges or intermediate nodes | `TM/engine/inheritedThreats.ts:10,40-85` | Skip targets already affected; propagate only catalog entries flagged `propagates: true`; degrade one severity level per hop; cap 2 hops; stop at an edge with `authentication !== "None" && encrypted` or at a guardrail/HITL node (7.6). |
| P3-04 | Two different "crosses trust boundary" definitions | `inheritedThreats.ts:91-103` vs `topologyRules.ts` `getBoundaryId` | One helper `crossesBoundary(edge, nodes)` in `engine/graph.ts`. |
| P3-05 | Missing-HITL rule is dead (`!hasActor` clause; every template has a User) | `TM/engine/topologyRules.ts:172` | Require a path actor → privileged node that contains an approval/HITL node (7.6); otherwise fire. |
| P3-06 | "Component Outside Trust Boundary" fires once per node (4–6 mediums per template, the most frequent finding) | `topologyRules.ts:48-77` | One model-level finding listing the nodes; suppressed until ≥1 boundary exists. |
| P3-07 | SPOF counts edge endpoints not unique neighbours (bidirectional pairs double) | `topologyRules.ts:196-226` | Count distinct neighbours. |
| P3-08 | Observability/monitoring detected by label substring (`"monitor"`, `"observ"`) | `topologyRules.ts:230-235`, `complianceGap.ts:39-44`, `aiuc1Compliance.ts:107-112` | Use `maestroLayers.includes(EvaluationObservability)` or `componentId`. |
| P3-09 | Every node in a layer gets every catalog threat for that layer; `tags`/`triggerCondition` never evaluated | `TM/engine/maestroRules.ts:64-84`, `maestroData.ts:9,340` | Add `appliesWhen(profile, ctx)` predicates per catalog entry (e.g. Model Stealing needs `isExternallyFacing`; Training Data Poisoning needs a training/fine-tune component). |
| P3-10 | Cross-layer rule: undirected BFS depth 4 → every layer pair fires for every node pair; actors carry L7 so "Foundation Model Compromise → Ecosystem Impact" lands on the human User | `maestroRules.ts:99-131` | Directed traversal along data flow; exclude actor/external from "ecosystem" targets; evaluate `triggerCondition`. |
| P3-11 | Severity escalation only at `inherentRiskMultiplier >= 2.0`, which the geometric mean (`nodeProfile.ts:75`) practically never reaches | `maestroRules.ts:67` | Replaced by the severity model in 7.2. |
| P3-12 | `mitigatedRisk = (threats with any mitigation text) × 2` → residual ≈ inherent − 2n → every model 65–69 | `TM/engine/riskScoring.ts:58-62`; flat `× (1 − ratio × 0.7)` in `ThreatModelCanvas.tsx:1621` | Replaced by 7.2. Also `componentScores.sort()` mutates the returned array (`:100`). |
| P3-13 | Attack path ids include `paths.length` (unstable); score = sum of all threats on path (longer = scarier); silently capped at 5/pair and 20 total | `TM/engine/attackPaths.ts:67-80,93,108` | Stable id = hash of node sequence; score = weakest-link (max over hops of hop-likelihood × target-impact) with length penalty; report `truncated: true` to the UI. |
| P3-14 | Mitigations keyed by lower-cased free text; "Input validation and sanitization" ≠ "Strict input validation"; `isThreatMitigated` true if *one* of 3–5 is applied; `mitigationIds` populated by name-substring | `TM/engine/mitigationCatalog.ts:29,63`, `dataIntegration.ts:9-23` | Catalog with stable ids (7.2). |
| P3-15 | Compliance gap: `hasAuth` true for an edge with no `data`; one encrypted edge anywhere marks every "encrypt" requirement met; relevance by first-word match | `TM/engine/complianceGap.ts:38,69-73,98-106` | Evidence-based checks per requirement (7.2.6). |
| P3-16 | AISVS "addressed" == "identified" (any threat with mitigation text), `identified` double-incremented → `(identified+addressed)/total` can exceed 100 % | `TM/engine/aisvsMapping.ts:109-147`; consumers `exportMarkdown.ts:82`, `exportPDF.ts:751`, `CompliancePanel.tsx:96` | `addressed` only when the linked threat is `mitigated`; fix the three consumers to `addressed/total`. |
| P3-17 | `sensitivityType` reads source profile when the *target* holds the data | `TM/engine/dataFlowCompliance.ts:120-122` | Use the profile of whichever side matched. |
| P3-18 | Regex taxonomy fallbacks attach 2–3 ASI and 3–6 Cisco objectives to every threat (`/trust/` matches "trust boundary", `/auth/` matches "author"); OB-019 missing from the layer map | `TM/engine/owaspMapping.ts:80-88`, `ciscoMapping.ts:5-13` | Author mappings on catalog entries; delete the fallbacks; show only high/medium confidence. |
| P3-19 | AIBOM relationships resolve by name after names were de-duplicated by renaming | `TM/parsers/aibomParser.ts:38,138-140` | Resolve by source index/id before renaming. |

### 7.2 Engine redesign (the core of Phase 3)

**7.2.1 Rule catalog (`TM/engine/catalog/`)** — replace the hard-coded `if` chains in `connectionRules.ts` (308 lines, with lines 36-87 vs 197-252 copy-pasted) and `topologyRules.ts` with a declarative table:

```ts
interface ThreatRule {
  id: string;                 // "TM-CONN-012" — stable, exported as SARIF ruleId
  scope: "node" | "edge" | "path" | "model";
  title: string; description: string;
  when: (ctx: RuleContext) => boolean | MatchEvidence;   // pure, testable
  likelihood: (ctx) => 1|2|3|4|5;  impact: (ctx) => 1|2|3|4|5;
  propagates?: boolean; maxHops?: number;
  mitigationIds: string[];    // from mitigation catalog
  maps: { owaspAsi?: string[]; cisco?: string[]; aisvs?: string[]; stride?: STRIDE[]; maestroLayer?: MaestroLayer; catalogThreat?: "t1".."t15" };
  references?: { title; url }[];
}
```
Rules are grouped in files by scope; MAESTRO layer threats become node-scope rules with `appliesWhen` predicates. A `scripts/check-rules.js` (hooked into `check:data`) asserts every `mitigationId`, ASI code, Cisco code, AISVS code and `catalogThreat` resolves. Add a rules browser in the Guide generated from the catalog (so the Guide can never drift).

**7.2.2 Severity model** — one function, `score(likelihood, impact) → severity + numeric`, with:
- *likelihood* from entry-point reachability (hops from an actor/external), edge posture on the path (auth none / encrypted), presence of guardrail/HITL gates, trust level of the source;
- *impact* from target `dataSensitivity`, `toolRiskTier`/`toolAccessMode`, blast radius (downstream reach), and `dataClassification`/`containsPII` of the flow;
- *residual* per threat = severity × (1 − Σ effectiveness of **implemented** mitigations, capped 0.9); `in-progress` and `accepted-risk` must **not** count as implemented (today `ThreatModelCanvas.tsx:1544-1603` adds them to `appliedMitigations`).
- *model score* = normalised residual over components with a reachability weight, so adding a guardrail or marking a threat mitigated visibly moves the number.

**7.2.3 Propagation** — as P3-03; plus a per-threat `propagationPath` and a `why` object (`rule`, matched evidence, path) that the UI shows (7.4 explainability).

**7.2.4 Mitigation catalog** — `TM/engine/catalog/mitigations.ts`: `{ id, name, description, effectiveness: 0.3–0.9, aisvs: string[], controlId?: "m1".."m18", phase }`. Rules reference ids; `securityData.ts` controls link by `controlId` (no more name-substring joins in `dataIntegration.ts`). Node-level "applied mitigations" become `{ mitigationId, status, owner?, due?, justification?, evidenceUrl? }`.

**7.2.5 Attack paths** — directed paths from actors/external nodes to high-impact targets (execute tools, credential/regulated stores), hop cost from edge posture, weakest-link score, stable ids, gates break paths, top-N with `truncated` flag; each path carries its hop-by-hop narrative for the animation (§8.5).

**7.2.6 Compliance (AISVS / AIUC-1 / data-flow)** — evidence-based: each requirement check declares what evidence it needs (`edge.encrypted` on flows carrying PII, an observability node connected to every agent, an HITL gate before execute tools, …) and returns `met | partial | gap | not-applicable` with the evidence list. Label the verdict "indicative" in UI and exports. AIUC-1 tab is always visible (today hidden until `summary.mitigated > 0`, `ThreatResultsPanel.tsx:448`).

**7.2.7 Tests** — add Vitest (`npm run test`) with golden tests for the 7 templates (threat count, severity histogram, model score, top paths) and unit tests per rule. Acceptance numbers in 7.9.

### 7.3 State, persistence, model document

| ID | Task | Details |
|---|---|---|
| P3-20 | `useReducer` + `commit()` | Replace the ~35 `useState`s with a reducer (`model`, `analysis`, `ui`) or Zustand store. One `commit(next, label)` sets state **and** pushes history. Fixes the pre-change `pushHistory` calls (`ThreatModelCanvas.tsx:602,745,817,839,854,868,882,1117,1484,1818`) that make Redo a no-op, and the debounced closure bug (`:328-352`). Undo/redo restore analysis too. |
| P3-21 | `resetAnalysis()` | Used by clear/load/import/undo/template. Today Clear leaves `fullAnalysisResult`, AISVS, compliance, surface, AIUC-1 and what-if intact (`:1215-1225`), so the panel shows the previous model's threats. |
| P3-22 | Model document v2 | `{ schemaVersion: 2, id, name, createdAt, updatedAt, nodes, edges, customComponents, threatStatuses: Record<ruleId+componentKey, {status, justification, owner, due, evidenceUrl, updatedAt}>, appliedMitigations, settings }`. Migrate v1 autosave/saved models/statuses on load; statuses leave the global key (`:145-185`). Exported JSON = the document (no volatile `analysisResult`). |
| P3-23 | Versioning + diff | ModelManager keeps snapshots per model (update-in-place "Save", "Save as version"); current model name in the toolbar; `Ctrl+S` saves the current model (today it only writes autosave, `:653-657`); a Diff view lists threats added/resolved/severity-changed between two versions; SARIF gets `baselineState`. |
| P3-24 | Share link | `?m=<lz-string compressed document>` read-only mode (banner + "Make a copy"), copy-to-clipboard JSON, and "Open in Threat Modeler" from the site uses `?template=` **without** overwriting autosave (today `:263-268,277-320` auto-saves the template over the user's session 5 s after any such link). |
| P3-25 | Small fixes | AIBOM import analyses the previous node set (stale `doAnalysis` closure, `:1527-1542` → `doAnalysisRef`); edge id collision (`edge-${Date.now()}`, `:374`) → counter; `isValidConnection` (no self-loops, no actor→actor); `onReconnect`/`edgesReconnectable`; boundary delete orphans children (`:579-603`) → absolutise positions; multi-node copy/paste with edges (`:605-618,677-693`); `onLocateThreat` uses relative position for children (`:1838-1845`) → `fitView({nodes})`; live-mode fingerprint misses `toolAccessMode`, `toolRiskTier`, `promptType`, `dataSensitivity`, `parentId`, `containsPII`, `bidirectional`, applied mitigations (`:552-577`); import merges the custom-component library instead of replacing (`:1261-1265`); `handleLoadModel` restores `customComponents` and pushes history. |

### 7.4 UX and flow

| ID | Task | Details |
|---|---|---|
| P3-30 | Responsive three-pane layout | Palette (collapsible to icon rail), canvas, results (resizable, collapsible). Below `lg`: palette as a bottom sheet, results as a bottom sheet with a handle; empty-state card no longer at `left: 224px` (`:1971`). Touch: tap-to-add in the palette (the hover-only "+" at `ComponentPalette.tsx:680` is unreachable on touch), pinch zoom, long-press context menu. |
| P3-31 | Dark mode | P0-02 plus `colorMode` on `<ReactFlow>` so controls/minimap chrome follow the theme. |
| P3-32 | Palette | Groups by official KC (P1-05) with agentic primitives promoted to a first "Agentic" group: Agent, Orchestrator, LLM, Memory (episodic/semantic/vector), Tool (scoped), MCP Server, A2A Peer, Guardrail/Policy, Human Approval Gate, Identity Provider/Credential, Observability. Each item shows the metadata it carries (chips) and a one-line "why it matters". Search filters across groups. Custom components editable/deletable (none today; `CustomComponentDialog.tsx:56-67` also never resets after save). |
| P3-33 | One property panel | Replace the three editing surfaces (inline panel, `NodeEditorDialog`, context-menu trust submenu) with one right-side panel with sections: Identity · Trust & posture · Tool/memory/prompt metadata · Mitigations (with status/owner/due/justification) · Threats on this node (grouped by rule, with "why it fired"). Edges: same panel with draft/cancel (today every keystroke commits, `EdgeMetadataEditor.tsx:34-36`). Keep the dialog only for custom component authoring. Panel must not cover the selected node (auto-pan the canvas). |
| P3-34 | Results panel | Group by component (default) / by rule / by MAESTRO layer / by severity; inherited collapsed under their source with "N inherited hidden"; one `role="tablist"`; counts in tabs; filters visible (not hidden behind a toggle) with status filter included in "Clear all" (`ThreatResultsPanel.tsx:820-825`); bulk status change for the selection (only bulk export exists today); "Jump to critical" scrolls to the item; minimum 11 px text; a "What changed since last run" strip (+3 new / −1 resolved). |
| P3-35 | Explainability | Every threat card: rule id, matched evidence (e.g. "edge User→Agent: authentication None, carries PII"), path, confidence; "Not applicable here" feedback suppresses the rule for that component type in this model (recorded in the document). |
| P3-36 | Status workflow | Status + justification (type already supports it) + owner + due date + evidence link; accepted-risk requires justification; statuses visible on the canvas badge (struck-through count) and in all exports. |
| P3-37 | Onboarding and templates | Replace the 5 static slides with a 3-step guided build (drop an agent, connect a tool, run analysis) using spotlight highlights; fix template layouts (P0-13) and add 3 agentic templates: "MCP-connected coding agent", "Customer-support agent with RAG + HITL", "Multi-agent research swarm with A2A". Map every architecture page to a template (`Architectures.tsx:23-29` leaves `rag-pipeline`/`simple-agent` unmapped and unknown ids fail silently, `ThreatModelCanvas.tsx:301`). |
| P3-38 | Keyboard scope | Shortcuts only when the canvas has focus; remove the global Space (fitView) and Backspace handlers that fire inside selects/dialogs (`:621-734`); add keyboard node creation (palette Enter → place at viewport centre), arrow-key nudging, `C` to start a connection from the selected node. |
| P3-39 | Guide parity | Guide sections generated from catalog/templates/shortcuts modules (P1-05, §6.12); remove claims that are false today ("entirely via keyboard", "colour-coded components"). |

### 7.5 Visual and animation

- **Node design**: severity ring and fill intensity from residual risk (real heat map on the canvas, not just the minimap, `ThreatModelCanvas.tsx:1453-1464`); critical shows as critical (badge currently collapses critical→high, `:499-502`); trust level as a left stripe (untrusted red / semi amber / trusted green); tool access mode and data sensitivity as icon chips; zoom tiers keep icons scaled; `DataStoreNode` honours `color`.
- **Edges**: direction via animated dash offset (CSS, 1.5 s loop, only while the "Flow" toggle is on or during attack-path playback); width from path score; colour from classification; unencrypted = dashed + lock-open glyph; bidirectional = double arrow; labels unclipped (`max-w-[80px]` → auto with ellipsis + tooltip); tooltip repositioned on pan/zoom (today positioned once on mount).
- **Trust boundaries**: nestable; zone trust level sets the stroke colour; droppable target; auto-resize to children on layout; cross-zone flows table in the panel.
- **Layout**: dagre compound graphs (boundaries as clusters) with measured sizes; "Tidy" button animates nodes to new positions (300 ms).
- **Analysis transition**: no full-canvas blur; instead a 500 ms sweep (gradient wipe left→right) while threats are being applied, then badges pop in per node with 30 ms stagger; the results panel shows the change strip.
- **Attack-path playback**: §8.5 on the canvas, driven from the Paths tab; what-if removal ghosts the node (opacity 0.3, dashed) instead of only a banner.
- **Legend**: persistent mini-legend (severity, trust stripe, edge posture) in the canvas corner, collapsible.

### 7.6 Agentic-native semantics (what makes this modeler different from Threat Dragon)

New node kinds with engine effects (via `CanvasNodeData.semantics`):
- **Guardrail / policy engine** on an edge path: downgrades prompt-injection/goal-hijack likelihood by its declared coverage (input / output / tool-call), with evidence shown.
- **Human approval gate**: breaks propagation and satisfies Missing-HITL for the protected tools.
- **Tool with permission scope**: `scopes[]`, `rateLimit`, `allowList`; `execute`/`admin` tools without a gate are critical; read-only with allow-list are low.
- **MCP server**: `transport` (stdio/http), `auth`, `toolsExposed[]`, `provenance` (signed? pinned version?) → supply-chain (ASI04) and tool-misuse (ASI02) rules.
- **A2A peer / inter-agent channel**: `mutualAuth`, `messageSigning`, `schemaValidation` → ASI07 rules; cascading-failure (ASI08) rule when ≥3 agents share a store without a gate.
- **Memory store**: `kind` (episodic/semantic/vector/shared), `retention`, `perUserIsolation`, `writeAccess[]` → memory-poisoning (ASI06) rules; shared write access from untrusted agents is critical.
- **Identity / credential + delegation chain**: who acts on whose behalf; a tool reachable with a user's delegated credential without scope narrowing → ASI03.
- **Observability**: coverage of agents/tools; missing → ASI08/ASI10 detectability findings.

Each maps to OWASP Agentic Top 10 2026 ids, to `threatsData` T-codes, to AISVS categories, and to the mitigation catalog, authored in the rule table (no regex).

### 7.7 Exports and imports

| ID | Task | Details |
|---|---|---|
| P3-40 | Report model | Build a `ReportModel` (sections → rows) once; PDF (autoTable only, with TOC, legend, per-boundary diagram, evidence/approval block), Markdown and HTML all render from it. Fix: half-page gap after the title image (`exportPDF.ts:184/219`), 45-char name truncation, silent 20-item caps, remediation merging components by label (`:929`), "All mitigated" status column (always true today), Markdown raw threat ids (`exportMarkdown.ts:101-103`) and raw `kc2` categories, double-counted coverage (`:80-83`). |
| P3-41 | SARIF hardening | `ruleId` = catalog id (today one rule per instance, 60–120 rules that change every run, `exportSARIF.ts:19,31`); `rules[]` from the catalog with `helpUri`; `logicalLocations[{name, kind:"component"}]` instead of fake `threat-model://` physical locations; `partialFingerprints` (stable hash of rule + component key); `properties["security-severity"]` 9.0/7.0/4.0/1.0; `suppressions[]` for accepted/false-positive with justification; `baselineState` from the diff; `informationUri` = https://agenticsecurity.info. Validate with the SARIF SDK/validator in CI. |
| P3-42 | CSV | Labels not ids; OWASP/Cisco/AISVS/status/owner/due columns; BOM for Excel; one implementation (the panel's "selected" CSV is a second, unquoted copy, `ThreatResultsPanel.tsx:341-347`). Add "Mitigations as work items" CSV (one row per mitigation × component with owner/due/status) for Jira/Linear import. |
| P3-43 | PNG/SVG | Render from `getNodesBounds` + fit, without selection rings/badges toggle, theme-aware background (hard-coded `#1e1e2e` today). All exporters `await import()` their libraries (P1-14). |
| P3-44 | Imports | CycloneDX 1.6 ML-BOM (`components[].type: "machine-learning-model"`, `modelCard`, `dependencies[]`), keep the existing `cisco-aibom` shape, OWASP Threat Dragon v2 JSON (`detail.diagrams[].cells[]` with `threats[]`) import + export, Open Threat Model (OTM) export. Imported edges prompt for posture instead of defaulting to `authentication: "None"`. JSON import validates against the v2 schema (zod) and merges custom components. |

### 7.8 Performance and accessibility

- Engine in a Web Worker (`engine.worker.ts`, Comlink or plain `postMessage`); catalogue-derived maps memoised at module load; `nodes.find` loops → `Map`; keyboard effect uses refs instead of re-registering per drag frame (`:621-734`); history stores structural state only (no `data.threats`); zoom tier via a quantised selector so nodes don't re-render per zoom frame (`hooks/useZoomLevel.ts:6`).
- Lazy-load `ReportDashboard` (recharts) and all exporters; target modeler chunk < 600 KB.
- A11y: `role="tablist"`/`tab`/`aria-selected` on panel tabs; labelled checkboxes/selects; `aria-expanded`; severity text next to every colour; min 11 px text; `OnboardingOverlay` and `KeyboardShortcutsPanel` become Radix dialogs (focus trap, Escape); edge tooltip reachable on focus; resize handle keyboard-operable; nodes `aria-describedby` threat summary.

### 7.9 Acceptance targets for Phase 3

| Metric | Today | Target |
|---|---|---|
| Threats on `rag-pipeline` template | 60 (36 inherited) | ≤ 20, ≤ 25 % inherited |
| Threats on `collaborative-swarm` | 123 | ≤ 40 |
| Model score spread across the 7 templates | 65–69 | ≥ 25 points spread; adding a guardrail + HITL gate to `simple-agent` lowers its score ≥ 15 points |
| Redo after delete | no-op | restores |
| Results after Clear | previous model's threats remain | empty |
| Rules with `id` + authored mappings + tests | 0 | 100 % |
| SARIF | validator warnings | passes validator; stable fingerprints across runs |
| Modeler chunk | 1.19 MB | < 600 KB |
| Usable at 390 px wide | no | yes (bottom sheets, tap-to-add) |
| Direct-load dark mode | light | dark |

---

## 8. Motion system (used by Phases 2–4)

Add `src/lib/motion.ts` and a small set of components; **no framer-motion** unless Phase 3 needs layout animations on the canvas (then add `motion` and tree-shake). CSS-first keeps the bundle small.

| # | Pattern | Spec | Where |
|---|---|---|---|
| 8.1 | **Entrance stagger** | `.enter` → opacity 0 / translateY(8px) → 1 / 0 over 320 ms `cubic-bezier(.2,.8,.2,1)`, child delay `index * 40 ms` capped at 400 ms; triggered by `IntersectionObserver` once (`useReveal()` hook) | every card grid, list rows, stat chips |
| 8.2 | **Count-up** | `useCountUp(value, 900 ms, easeOutExpo)`; integers only; starts when visible; shows final value immediately if reduced motion | PageHeader stats, hero counts, AISVS progress numbers, modeler summary tiles |
| 8.3 | **Gauge / ring** | SVG arc `stroke-dashoffset` transition 600 ms; colour interpolates through severity tokens | AIVSS gauge, AISVS category rings, modeler Overall Risk |
| 8.4 | **Chart build-in** | D3 transitions: bars grow from 0 (500 ms, staggered 20 ms), links draw via `stroke-dasharray` (700 ms), nodes scale from 0.6 | heatmaps, Sankey, interconnection map, radar |
| 8.5 | **Attack-path animation** | React Flow edges `animated` + a moving dot (`<circle>` on `<animateMotion>` along the edge path, 1.2 s per hop); affected node pulses (box-shadow 0 → 8 px severity colour → 0, 900 ms ×2); sequencer with play/pause/step and a caption per step | Home showcase, ArchitectureDetail "Walk an attack", modeler Attack Paths tab |
| 8.6 | **Milestone** | `canvas-confetti` (add, lazy) once per milestone (AISVS L1 complete, quiz ≥ 80 %, first model analyzed); toast with "share" | AISVS, quizzes, modeler |
| 8.7 | **Tab/route transitions** | Content cross-fade 150 ms + 4 px rise; `View Transitions API` for route changes where supported (`document.startViewTransition`), fallback to fade | all tabbed pages, route changes |
| 8.8 | **Hover depth** | Cards: `translateY(-2px)` + border-colour shift + shadow-sm→md, 150 ms; links: underline grows from left | cards, nav |
| 8.9 | **Skeletons** | Shimmer skeleton for lazy chunks instead of the centered spinner (`App.tsx:34-41`), shaped like the page (header + 3 cards) so Header doesn't disappear during chunk load — render Header outside Suspense | App shell |
| 8.10 | **Reduced motion** | Existing global rule stays; `useReducedMotion()` for JS-driven animations (count-up, D3, confetti, attack path shows final frame) | everywhere |

---

## 9. Visualization spec (one entry per chart; build with `ChartFrame`)

| Chart | Page | Type | Encoding | Interactions | A11y fallback |
|---|---|---|---|---|---|
| Component hierarchy | Components, ArchitectureDetail | D3 sunburst (treemap toggle) | ring 1 = KC (kc colour), ring 2 = node, arc = threat count | hover/tap tooltip, click navigate, breadcrumb zoom | nested list in `sr-only` + "view as list" toggle |
| Threat × Component heatmap | Threats, ArchitectureDetail | HTML `<table>` grid (not SVG) | fill = risk band, glyph size = vectors; KC column groups collapsible | sort, filter, keyboard cell nav, click → detail | native table semantics; text in cells |
| Control coverage bars | Controls | HTML bars | 13 rows, segments = controls (control colour), width = requirements covered | hover shows control list; click → control | text percentages |
| Control radar | ControlDetail | SVG radar (recharts `RadarChart` is fine, already a dep) | 13 axes AISVS | hover axis | table |
| Architecture radar small multiples | Architectures | recharts radar ×5 or overlay | 8 feature axes | toggle overlay/individual | existing table |
| Risk sparkline | Architecture cards | inline SVG bars | 4 severity bars | — | text "5 threats (2 high)" |
| AISVS level stacks | AISVS | HTML stacked bars | L1/L2/L3 done/total | click filters to level | text |
| NIST bipartite | NIST | D3 columns + bundled links | function colour; link weight | select/path highlight, zoom/pan persistent, legend | detailed-mapping tab |
| NIST compliance matrix | NIST | HTML table | sequential fill by mapping count | click → drawer, sticky headers | counts in cells |
| Cross-framework Sankey | Taxonomy | `d3-sankey` | node = framework colour, ribbon width = mappings | pin, focus, framework toggles | density matrix + list |
| Framework interconnection | Taxonomy | D3 force (5 nodes) | edge width = count | tap/focus | matrix |
| AIVSS gauge | Taxonomy | SVG arc | severity colour | animated on change | numeric |
| MAESTRO layer stack | Guide, modeler | HTML/SVG stacked bands | layer colours from `types.ts` | hover shows threats per layer | list |
| Modeler dashboard | Threat Modeler | see §7 | | | |

Colour rules: categorical series use the KC palette (6) or framework palette (5) defined once in `src/lib/palette.ts`; sequential fills use the severity ramp; all read from CSS vars so dark/light both work; never encode by colour alone (add glyph/size/text).

---

## 10. Phase 4 — Engagement and learning

| ID | Feature | Details |
|---|---|---|
| P4-01 | **Learning path** (`/learn`) | The About page's 5 steps become a stepper: Components → Threats → Controls → AISVS → NIST → Model it. Each step lists 3–5 pages to read, a 5-question quiz, and completes when quiz ≥ 80 %. Progress in `useProgress.path`; Home shows "Step 3 of 6". |
| P4-02 | **Quizzes** (`src/data/quizzes.ts` + `<Quiz>`) | Generated from data, not hand-written: "Which KC does T7 affect?" (threat.componentIds), "Which ASI maps to T1?" (asiMapping), "Rate this attack vector" (90 vectors with severity), "Which control mitigates X?" (mitigationIds), "Which MAESTRO layer…". 5 per step + a 10-question "Agentic Security Challenge" on Home. Uses the existing `.quiz-option` styles (move them to the component), `quiz_complete` analytics, milestone confetti. |
| P4-03 | **Scenario walkthroughs** | From `owaspAgenticTop10Data.attackScenarios` and `architecturesData.relevantThreats`: a 4–6 step narrative with the React Flow diagram animating the path (§8.5); "What would have stopped this?" reveals the mapped controls. Entry points: ASI entries, architecture detail, Home featured. |
| P4-04 | **Threat of the day** | Home card (6.1); also a `/threats/today` redirect; deterministic by date; tweetable OG image via P1-12. |
| P4-05 | **Progress dashboard** (`/progress`) | Rings for AISVS (by level), controls, checklist, path, quizzes; export/import JSON; "share my badge" image. |
| P4-06 | **Command palette everywhere** | P1-10 plus actions: "Open in Threat Modeler", "Toggle theme", "Start quiz". |
| P4-07 | **AIVSS what-if + share** | 6.8. |
| P4-08 | **Explorer upgrades** | `ArchitectureNavigator`: mitigation nodes link to `/controls/:id` (not `/controls`, `:268`), animated expand instead of full redraw, "collapse others", theme-reactive colours, lives in `/architectures?view=graph` and a dialog. |

---

## 11. Phase roadmap and definition of done

### 11.1 Sequencing (each line ≈ one PR or a small series)

**Phase 0 — Correctness (1–2 weeks)**
1. P0-01, P0-03, P0-04, P0-07, P0-09, P0-10, P0-11, P0-14, P0-17, P0-20 (one "visible bugs" PR)
2. P0-02 theme bootstrap + ThemeProvider
3. P0-08, P0-19 a11y fixes
4. P0-12, P0-13 modeler menus + template layouts
5. A2 threats v1.1 (names, T16, T17, ASI mapping) · A4 MAESTRO guide · A9 claims · A10 references · A11 provenance fields
6. A7 Cisco v2 · A6 AIUC-1 Q4-2026
7. **A1 AISVS 1.01 re-base** (generator PR, then consumer re-map PR, then NIST re-map PR) — start this early; it gates 6.4, 6.6, 6.7 and the modeler's AISVS tab
8. A3 AIVSS re-base

**Phase 1 — Foundation (2–3 weeks)**
9. P1-02 nav config → P1-01 PageLayout (+ P0-06, P0-15, P0-16 fall out) → P1-07 PageHeader
10. P1-03 severity tokens → P1-04 icon registry → P1-05 KC taxonomy (A5)
11. P1-06 RichText (+ P0-05)
12. P1-08 progress store
13. P1-09 chart primitives
14. P1-10 command palette + P1-11 deep links
15. P1-13 dead code → P1-14 code splitting → P1-12 SEO pipeline → P1-15 integrity checks
16. §8 motion primitives (`useReveal`, `useCountUp`, ring, skeletons, view transitions)

**Phase 2 — Pages (3–4 weeks; order by traffic)**
17. 6.1 Home · 6.3 Threats (+ heatmap) · 6.4 Controls (+ real coverage) · 6.2 Components (+ sunburst)
18. 6.6 AISVS (+ level stacks) · 6.7 NIST (graph rewrite + full matrix) · 6.8 Taxonomy (Sankey rewrite, AIVSS gauge, deep links)
19. 6.5 Architectures (+ radar, attack walkthrough) · 6.9 Implementation lifecycle · 6.10 Checklist · 6.11 References · 6.12 About/Guide/404

**Phase 3 — Threat Modeler (4–6 weeks)**
20. 7.1 engine bug fixes + Vitest golden tests (baseline the numbers first, then fix)
21. 7.2.1 rule catalog + 7.2.4 mitigation catalog + 7.2.2 severity model + 7.2.3 propagation + 7.2.5 paths
22. 7.3 reducer/commit/resetAnalysis/model document v2/migration
23. 7.4 responsive layout, dark mode, palette, unified panel, results grouping, explainability, status workflow
24. 7.6 agentic semantics (guardrail, HITL, scoped tools, MCP, A2A, memory kinds, identity, observability) + 3 new templates
25. 7.5 visuals (heat map, edges, boundaries, transitions, path playback)
26. 7.7 report model, SARIF hardening, CSV, imports (CycloneDX, Threat Dragon, OTM)
27. 7.3 versioning/diff/share link · 7.8 worker + a11y

**Phase 4 — Engagement (2–3 weeks)**
28. P4-01 learning path · P4-02 quizzes · P4-03 scenarios · P4-04 threat of the day · P4-05 progress dashboard · P4-07/08

### 11.2 Definition of done (per phase)

- `npm run validate` green; `npm run test` green (Vitest added in Phase 3 at the latest — add it in Phase 1 if convenient, with tests for `severity.ts`, `progress.ts`, `navigation.ts`).
- axe DevTools: 0 critical/serious on every route in light and dark.
- Lighthouse (desktop) on `/`, `/threats`, `/aisvs`, `/nist-mapping`, `/threat-modeler`: Performance ≥ 90 (modeler ≥ 80), Accessibility ≥ 95, SEO ≥ 95.
- Bundle: largest chunk < 600 KB; `index` < 250 KB.
- Manual walkthrough checklist (keep in `docs-src/QA.md`, not in `docs/` which is build output): every route at 375 / 768 / 1280 px, both themes, keyboard-only pass on one list page, one detail page, the modeler.
- Phase 0 additionally: every item in §4.1 and §4.2 has a line in CHANGELOG under a new `[2.1.0]` entry; counts in README regenerated.
- Phase 3 additionally: the §7.9 table.

### 11.3 Decisions the owner should confirm before Phase 0 item 7 and Phase 3

1. **AISVS 1.01 re-base resets user progress** (ids change). Accept the archive-and-notify approach, or keep a mapping table for the subset of draft requirements that survived into 1.01?
2. **AIVSS target version**: v0.8 (published PDF) vs the "AIVSS 1.0" calculator linked from aivss.owasp.org. Recommendation: implement whatever is newest and *published with a formula*, label it, and keep the model in one data file so swapping is a data change.
3. **MITRE ATLAS**: drop the claim, or add the crosswalk tab (recommended, ~1 day).
4. **Cisco v2 vs v1**: carry both (version selector) or replace. Recommendation: replace, keep v1 ids in a `deprecated` map for old links.
5. **State library for the modeler**: `useReducer` (no dep) vs Zustand (cleaner selectors, ~1 KB). Recommendation: Zustand.
6. **Share links** encode the full model in the URL (no backend). Acceptable size limit ≈ 30 KB compressed; larger models fall back to JSON download.

### 11.4 Out of scope (deliberately)

No backend, auth, or database; no framework migration (stay on Vite + React Router); no CMS; no i18n in this pass; no redesign of the brand (fonts, palette, logo stay).

---

## Appendix A — Where things live after Phase 1

```
src/
  config/navigation.ts          one nav list (header / drawer / footer / palette)
  data/
    kc.ts                       canonical KC1–KC6 (from frameworkData)
    aisvs.generated.ts          AISVS 1.01 (generated by scripts/import-aisvs.mjs)
    quizzes.ts                  Phase 4
  lib/
    severity.ts  palette.ts  icons.ts  progress.ts  motion.ts
  components/
    layout/PageLayout.tsx  PageHeader.tsx  SectionRail.tsx  CommandPalette.tsx
    content/RichText.tsx  SeverityBadge.tsx  RiskScore.tsx  PhaseBadge.tsx
    charts/ChartFrame.tsx  useChartTheme.ts  Sunburst.tsx  Heatmap.tsx  CoverageBars.tsx  Radar.tsx  Sankey.tsx  Bipartite.tsx  Gauge.tsx  LayerStack.tsx
    threat-modeler/
      engine/catalog/{rules,mitigations}.ts   engine/{severity,propagation,paths,compliance}.ts   engine.worker.ts
      store.ts (reducer/Zustand)  document.ts (schema v2 + migrations)
      export/reportModel.ts  export/{pdf,markdown,sarif,csv,png}.ts  import/{cyclonedx,threatDragon,otm,aibom}.ts
scripts/
  check-data-integrity.js  import-aisvs.mjs  generate-seo.js  print-counts.mjs  check-rules.js
```

## Appendix B — Source links used for the accuracy audit

- OWASP Top 10 for Agentic Applications (Version 2026): https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications/
- OWASP Agentic AI Threats & Mitigations: https://genai.owasp.org/resource/agentic-ai-threats-and-mitigations/
- OWASP Securing Agentic Applications Guide 1.0: https://genai.owasp.org/resource/securing-agentic-applications-guide-1-0/
- OWASP AISVS (1.01 stable): https://github.com/OWASP/AISVS/tree/main/1.01/en
- OWASP AIVSS: https://aivss.owasp.org/
- CSA MAESTRO: https://cloudsecurityalliance.org/blog/2025/02/06/agentic-ai-threat-modeling-framework-maestro
- NIST AI RMF 1.0 Core: https://airc.nist.gov/AI_RMF_Knowledge_Base/AI_RMF/Core_And_Profiles/5-sec-core · NIST AI 600-1: https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf
- AIUC-1 standard: https://standard.aiuc-1.com/
- Cisco AI Security Taxonomy v1 (arXiv 2512.12921) and v2: https://blogs.cisco.com/ai/security-framework-v2
- OWASP Threat Dragon JSON, Open Threat Model, CycloneDX 1.6 ML-BOM, SARIF 2.1.0 — for §7.7

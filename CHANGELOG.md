# Changelog

## [2.2.0] - 2026-11-03

### Data

- New dataset: OWASP Top 10 for LLM Applications, 2026 edition (v1.0, published 2026-08-04; `src/components/components/owaspLlmTop10Data.ts`). The 2026 list renumbered the 2025 one (Excessive Agency #6 → #3, Unbounded Consumption #10 → #6, Improper Output Handling #5 → #10) and renamed System Prompt Leakage to Hidden Context Exposure; every entry carries its 2025 id and `findLlmTop10Entry()` resolves both numberings. Agentic Top 10, ATLAS tactic and CWE links are the edition's Appendix A primary mappings, AISVS chapters come from its AISVS appendix, Cisco objectives are derived from Cisco's own `LLMxx:2026` mappings, and threat/control links are editorial with a per-entry note. Summaries and examples are paraphrased.
- New Taxonomy tab `?tab=llm-top10` (aliases `llm`, `owasp-llm`; deep link `entry=LLM01`, also `entry=LLM06:2025`), command palette group "OWASP LLM Top 10" (2025 codes are aliases), and Cisco "OWASP: LLMxx:2026" mapping chips now link to it.
- `npm run check:data` checks the LLM Top 10 ids, names and 2025 predecessors, that every mapping resolves (ASI, threats, controls, AISVS chapters, ATLAS tactics, CWEs, Cisco objectives), that each entry keeps a threat its official ASI mappings reach, that Cisco objectives match Cisco's data, and that every `relatedLLMTop10` citation in the Agentic Top 10 resolves.
- Source versions re-verified on 2026-11-03, all unchanged: OWASP AISVS 1.01 (latest stable; release tag `v1.01`, `1.01/en` tree identical to the pinned commit; 1.02 is still `1.02-dev`), OWASP Top 10 for Agentic Applications 2026 (Dec 2025), Agentic AI Threats & Mitigations 1.1, NIST AI RMF 1.0 and AI 600-1 (revision announced, no draft; the Cyber AI Profile NIST IR 8596 is still a preliminary draft, so it is not added), Cisco AI Security and Safety Taxonomy 2.0.0, AIUC-1 Q4-2026 (next release 2027-01-15), MITRE ATLAS 2026.10. The NIST page footer now states this status from `NIST_RMF_STATUS`; the AISVS source records its pinned commit as `dataUrl`.

## [2.1.0] - 2026-11-03

Site-wide release implementing `IMPROVEMENT_PLAN.md`: every dataset follows the current published version of its source, the pages share one layout/severity/icon/KC system with purpose-built visualizations and a motion system, the Threat Modeler engine was rebuilt around a rule catalog with principled risk scoring, and a learning layer (path, quizzes, scenarios, progress) was added.

### Site shell and pages (Phase 0–2)

- One `PageLayout` (header, mobile drawer, section rail, footer, Helmet defaults) and one navigation config drive every page; the floating sidebar pill that overlapped breadcrumbs and titles is gone (P0-01, P0-06, P1-01, P1-02).
- Theme is applied before first paint from an inline bootstrap, so direct loads of the Threat Modeler and the 404 page honour dark mode (P0-02).
- Command palette (⌘K / Ctrl-K / `/`) with code-aware matching (T7, M3, C5, ASI01, OB-004, GOVERN.1.1) and deep links into every framework entry; header search replaced (P1-10, P1-11).
- Shared severity tokens, icon registry, canonical KC1–KC6 taxonomy (`src/data/kc.ts`), RichText formatter, versioned progress store and chart primitives (P1-03 … P1-09).
- Home: live counts, threat of the day (`/threats/today`), progress card, animated architecture showcase, how-to strip. Threats: URL-persisted filters and a 17×40 threat-by-component heatmap. Controls: AISVS 1.01 coverage bars replace the heuristic matrix; neutral "Addresses risk" score. Components: canonical KC order and a hierarchy sunburst. Architectures: radar comparison, diagram thumbnails, tabbed detail with "Walk an attack". AISVS: requirement search, level progression bars, L1 milestone, archived-progress notice. NIST: bipartite graph with persistent zoom, full 12-chapter matrix, details drawer, NIST AI 600-1 tags. Taxonomy: weighted Sankey, ATLAS crosswalk tab, AIVSS v0.8 gauge calculator with shareable factors, AIUC-1 Q4-2026 tab. Implementation re-scoped as a Design/Build/Operations lifecycle view. References de-duplicated with "cited by" chips.
- Fixed: wheel-zoom hijack on architecture diagrams (P0-03), doubled page titles (P0-04), raw markdown on Implementation and ComponentDetail (P0-05), shipped dev page `/test-navigator` (P0-07), nested buttons (P0-08), hard-coded counts in About and the hero (P0-10, P0-11), 404 outside the layout (P0-14), OG images and apple-touch-icon (P0-16), JSON-LD SearchAction (P0-17), doubled analytics page views (P0-18), label/tab accessibility (P0-19), GA before charset and missing font preload (P0-20).

### Motion and visualization (§8, §9)

- Entrance stagger, count-ups, rings/gauges, D3 build-in transitions, attack-path playback with moving dot and node pulse, view transitions between routes, page-shaped skeletons, hover depth; all gated by `prefers-reduced-motion`.
- Every chart renders through `ChartFrame` with an accessible table fallback, keyboard focus and theme-reactive colours.

### Threat Modeler (Phase 3)

- Engine 3.0: 49 declarative rules with stable ids and authored OWASP Agentic Top 10 / Cisco / AISVS 1.01 / STRIDE mappings, a 38-entry mitigation catalog joined to the site's controls, likelihood × impact severity with residual scoring (only implemented mitigations count), reachability-weighted model score, bounded propagation that stops at secure flows and HITL gates, directed attack paths with weakest-link scoring, evidence-based AISVS / AIUC-1 / data-flow compliance labelled "indicative". Template output dropped from 55–123 threats to 8–21 and the model score now spreads 28–68 across templates (P3-01 … P3-19, §7.2).
- Agentic semantics: guardrail, human approval gate, scoped tool, MCP server, A2A peer, memory kinds, identity/delegation, observability (§7.6); three new templates; all templates re-spaced (P0-13, P3-37).
- Document schema v2 with migration from the six legacy localStorage keys, zustand store with working undo/redo, `resetAnalysis` on clear/load, versions and diff, read-only share links, `?template=` without overwriting autosave (P3-20 … P3-25).
- UI: responsive three-pane layout with bottom sheets on phones, theme-aware canvas, palette grouped by official KC with an Agentic group, one property panel, grouped results with explainability and "not applicable" suppression, status workflow with owner/due/justification, Radix menus and dialogs, keyboard scope fixes (P0-12, P3-30 … P3-39).
- Exports from one report model (PDF, Markdown, CSV + work-items CSV, hardened SARIF with catalog rule ids and stable fingerprints, Threat Dragon v2, OTM) and imports (JSON v1/v2, CycloneDX 1.6 ML-BOM, Threat Dragon); exporters load lazily; engine runs in a Web Worker (P3-40 … P3-44, §7.8).
- Guide generated from the modeler's own modules: KC groups, MAESTRO layer stack (A4 fixed), templates, shortcuts, rules browser.

### Learning and progress (Phase 4)

- `/learn`: six-step learning path with data-generated quizzes (12 question types), completion at 80 %, confetti once. `/scenarios/:id`: 57 narrative attack walkthroughs with diagram highlights and the controls that stop them. `/progress`: rings per namespace, JSON export/import, shareable badge. Palette actions for all three (P4-01 … P4-06).

### Build and tooling

- `postbuild` regenerates `sitemap.xml` and 1200×630 OG cards per route and per threat/control/component/architecture (P1-12); vendor chunking (P1-14); Vitest with golden tests for the modeler templates; `check:rules` validates the rule catalog; CI runs tests and the rule check; weekly scheduled link check (A10); `docs-src/QA.md` manual checklist.
- Removed dead dependencies (`@tanstack/react-query`, `@radix-ui/themes`) and dead code (P1-13).

### Data accuracy

Every dataset now follows the current published version of its source and records where it came from.

#### Changed

- **AISVS 1.01 (A1).** Requirements are generated from the official OWASP AISVS repository (`npm run import:aisvs` → `src/data/aisvs.generated.ts`, commit `8fff304`) and adapted in `src/data/aisvs.ts`. That gives 12 chapters, 44 sections and 213 requirements (L1 57 / L2 110 / L3 46); C10.2.6 is "Requirement removed." upstream. The ≈11,600-line pre-1.0 draft and its filler references were deleted. Chapter and requirement ids changed: there is no C13, C10 is now MCP Security and C11 is Adversarial Robustness. `securityData.ts` re-exports `aisvsData` in the same shape.
- **Threats (A2)** follow OWASP Agentic AI – Threats and Mitigations v1.1 (Dec 2025):
  - official names, plus a `shortName` for cards
  - new T16 Insecure Inter-Agent Protocol Abuse and T17 Supply Chain Compromise
  - `asiMapping` aligned with Appendix A of the Top 10 for Agentic Applications; the two non-official links are flagged `asiMappingUnofficial`
  - `sourceVersion`, version and `lastUpdated` normalised
- **Controls.** New m19 "MCP Server Hardening & Tool Provenance" and m20 "Agent Supply-Chain Integrity". Every control carries `aisvsCategories` and `aisvsRequirements` (AISVS 1.01), and the `aisvs-cN` tags were updated to match.
- **AIVSS (A3).** The calculator implements OWASP AIVSS v0.8 (CVSS v4.0 base, 10 agentic risk factors, threat multiplier, mitigation factor). The ten v0.8 worked examples are included and recompute exactly. Core-risk names are canonical across modules, and the ASI mapping follows v0.8 Appendix B. The JSON export is labelled `aivss-v0.8`.
- **AIUC-1 Q4-2026 (A6).** 55 requirement ids, 50 active. C011, C012 and D002 are marked retired (Q4-2026), and E007 and E014 retired (Q1-2026), each with `retiredIn` / `replacedBy`. New and renamed requirements follow the standard.
- **Cisco AI Security and Safety Taxonomy v2.0.0 (A7).** 19 objectives, 44 techniques, 130 sub-techniques. OB-002 is now "Agentic Autonomy Failures" and jailbreak moved under OB-001. `CISCO_V1_DEPRECATED` maps v1 codes to their v2 equivalents. Threat and Top 10 Cisco links were re-mapped from the taxonomy's own OWASP mappings.
- **NIST AI RMF (A1/A8).** All 72 subcategories are re-mapped to AISVS 1.01 chapters, with a rationale each (`src/data/nistAisvsRemap.ts`). The mapping is editorial; 17 subcategories are organizational and map to no chapter.

#### Added

- **MITRE ATLAS crosswalk (A9)** in `src/data/atlasCrosswalk.ts`: 72 ATLAS 2026.10 techniques and sub-techniques, plus one tactic, linked to Cisco taxonomy nodes, OWASP ASI risks and site threats. It is derived from Cisco's published ATLAS mappings; ids that ATLAS has since renumbered are redirected, and official names are used.
- **Provenance (A11).** Every data module exports `source: { name, version, url, retrievedAt }`, and `src/data/sources.ts` aggregates them as `SOURCES`.
- **`npm run counts`** generates the README dataset table, which replaces hand-written counts (A9).

#### Fixed

- README and CHANGELOG claims (A9): MITRE ATLAS was over-claimed; the architecture patterns are sequential, hierarchical, collaborative, reactive and knowledge-intensive, not "router, parallel"; the "556 requirements" figure is corrected.
- References (A10): wrong arXiv titles corrected (2504.19951, 2503.12188, 2504.11703), and bare-domain URLs replaced with the specific article.
- A reference titled "$PDF$ OpenAI GPT-4.5 System Card" was removed with the AISVS draft (P0-09).

#### Checks

`npm run check:data` now:
- resolves TypeScript and JSON imports
- validates the AISVS schema
- warns on AISVS codes anywhere in `src/` that do not exist in 1.01
- errors when an ASI risk has no threat, or when threat ↔ Appendix A mappings disagree
- recomputes the AIVSS worked examples
- checks AIUC-1 and Cisco counts and the v1→v2 targets
- validates the NIST remap and the ATLAS crosswalk
- rejects `$TEMPLATE$` titles and `**` in descriptions
- flags bare-domain URLs
- warns when a source's `retrievedAt` is more than 12 months old (or `lastUpdated` more than 18)

## [2.0.0] - 2025-02-16

Major rewrite. The project was restructured from a vulnerability database into a comprehensive, interactive security guide for agentic AI applications.

### Added

- Threat Modeler with drag-and-drop canvas, MAESTRO-layer analysis, and STRIDE classification
- NIST AI RMF interactive mapping with force-directed D3 graph
- AIVSS Calculator for AI vulnerability severity scoring
- OWASP Agentic Top 10 dedicated page
- Cisco AI Security Taxonomy browser
- Cross-framework Sankey diagram (OWASP Agentic, Cisco, AIVSS)
- MITRE ATLAS links on individual threats and controls (correction, 2.1.0: this entry originally claimed ATLAS tactics, techniques and case studies, but no ATLAS dataset or page shipped; `mitreAtlasData.ts` was removed in this release, see below)
- Security testing navigator and interactive checklist
- Architecture detail pages with threat/mitigation associations
- Geist font family (replacing Inter/JetBrains Mono)
- Pre-commit hooks via Husky and lint-staged
- PR validation workflow with dependency auditing
- Data integrity check script (`npm run check:data`)
- Apache 2.0 license

### Changed

- Redesigned homepage with terminal-inspired hero section
- Updated color palette to Deep Indigo theme
- Switched build output to `docs/` for GitHub Pages deployment
- Expanded AISVS from categories to requirement-level detail, from a pre-1.0 AISVS draft (correction, 2.1.0: the "556" figure counted that draft's filler references, not requirements; the draft was replaced by AISVS 1.01 in 2.1.0)
- Replaced Google Fonts CDN with locally bundled Geist fonts

### Removed

- Vulnerability database and markdown-based vulnerability files
- Assessment tool questionnaire
- `gray-matter` dependency and custom frontmatter parser
- `npm run test-vulns` and `npm run create-vuln` scripts
- `src/data/vulnerabilities/` directory
- `src/lib/generatedData.json`, `mitreAtlasData.ts`, `vulnerabilityLoader.ts`

## [1.0.0] - 2025-01-25

- Initial release with vulnerability database, basic component explorer, and manual deployment process.

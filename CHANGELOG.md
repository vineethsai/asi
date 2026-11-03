# Changelog

## [2.1.0] - 2026-11-03

Data accuracy release: every dataset now follows the current published version of its source and records where it came from.

### Changed

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

### Added

- **MITRE ATLAS crosswalk (A9)** in `src/data/atlasCrosswalk.ts`: 72 ATLAS 2026.10 techniques and sub-techniques, plus one tactic, linked to Cisco taxonomy nodes, OWASP ASI risks and site threats. It is derived from Cisco's published ATLAS mappings; ids that ATLAS has since renumbered are redirected, and official names are used.
- **Provenance (A11).** Every data module exports `source: { name, version, url, retrievedAt }`, and `src/data/sources.ts` aggregates them as `SOURCES`.
- **`npm run counts`** generates the README dataset table, which replaces hand-written counts (A9).

### Fixed

- README and CHANGELOG claims (A9): MITRE ATLAS was over-claimed; the architecture patterns are sequential, hierarchical, collaborative, reactive and knowledge-intensive, not "router, parallel"; the "556 requirements" figure is corrected.
- References (A10): wrong arXiv titles corrected (2504.19951, 2503.12188, 2504.11703), and bare-domain URLs replaced with the specific article.
- A reference titled "$PDF$ OpenAI GPT-4.5 System Card" was removed with the AISVS draft (P0-09).

### Checks

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

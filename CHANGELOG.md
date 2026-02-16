# Changelog

## [2.0.0] - 2025-02-16

Major rewrite. The project was restructured from a vulnerability database into a comprehensive, interactive security guide for agentic AI applications.

### Added

- Threat Modeler with drag-and-drop canvas, MAESTRO-layer analysis, and STRIDE classification
- NIST AI RMF interactive mapping with force-directed D3 graph
- AIVSS Calculator for AI vulnerability severity scoring
- OWASP Agentic Top 10 dedicated page
- Cisco AI Security Taxonomy browser
- Cross-framework Sankey diagram (OWASP Agentic, Cisco, AIVSS)
- MITRE ATLAS tactics, techniques, and case studies
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
- Expanded AISVS from categories to full requirement-level detail (556 requirements)
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

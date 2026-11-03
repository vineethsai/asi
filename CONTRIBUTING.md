# Contributing Guide

Thanks for your interest in contributing to the OWASP Securing Agentic Applications project.

## Prerequisites

- Node.js 20+
- npm 10+

## Local Setup

```sh
npm ci
npm run dev
```

## Required Checks

Run the full validation suite before submitting a PR:

```sh
npm run validate
```

This runs TypeScript type checking, ESLint, Prettier, data integrity checks, unit tests, and a production build in sequence.

You can also run individual checks:

```sh
npm run typecheck        # Type check only
npm run lint             # Lint only
npm run check:data       # Validate cross-dataset integrity
npm run format:check     # Check Prettier formatting
npm run build            # Production build
```

## Data

Every dataset has a primary source and records it as `source: { name, version, url, retrievedAt }`. `src/data/sources.ts` aggregates them all.

| Data | File | Source |
| --- | --- | --- |
| AISVS requirements | `src/data/aisvs.generated.ts` (generated), adapter `src/data/aisvs.ts` | OWASP AISVS repository |
| Threats `t1`–`t17`, controls `m1`–`m20` | `src/components/components/securityData.ts` | OWASP Agentic AI – Threats and Mitigations v1.1 (controls are editorial) |
| OWASP Top 10 for Agentic Applications | `owaspAgenticTop10Data.ts` | Top 10 2026, Appendix A for threat links |
| AIVSS | `aivssCalcData.ts` | OWASP AIVSS v0.8 |
| AIUC-1 | `aiuc1Data.ts` | AIUC-1 Q4-2026 |
| Cisco taxonomy | `cisco_taxonomy.json`, `ciscoTaxonomyData.ts` | Cisco AI Security and Safety Taxonomy v2 |
| MITRE ATLAS crosswalk | `src/data/atlasCrosswalk.ts` (derived from the Cisco JSON) | ATLAS 2026.10 names |
| NIST AI RMF → AISVS | `src/data/nistAisvsRemap.ts` (editorial) | NIST AI RMF 1.0 Core |
| Components `kc*`, architectures | `frameworkData.ts`, `componentDataMap.ts`, `architecturesData.ts` | Securing Agentic Applications Guide 1.0 (architectures are editorial) |

Rules:

- Do not hand-edit `src/data/aisvs.generated.ts`. Run `npm run import:aisvs` (options: `-- --version 1.01 --ref <commit>`, or `-- --from <dir>` for a local checkout) and commit the result.
- Use official names, ids and wording from the source. Mark anything this project adds as editorial: for example `asiMappingUnofficial` on a threat, or a rationale in the NIST remap.
- When you check data against its source, update that module's `source.retrievedAt`. `check:data` warns after 12 months.
- Cite the specific page, not a bare domain. Titles must not contain template placeholders such as `$PDF$`.
- Threat ids follow `t<number>`, controls `m<number>`, components `kc<number>`; AISVS codes use the 1.01 scheme (`C9`, `C9.4`, `C9.4.3`).
- Run `npm run check:data` (add `-- --check-links` to test URLs). It fails on broken cross-references and warns on files that still use codes which no longer exist.
- Run `npm run counts -- --write README.md` when counts change.

## Pull Requests

- Keep changes scoped and include a clear description of what changed and why.
- If you modify datasets, include the output of `npm run check:data` in your PR description.
- Prefer additive changes over broad rewrites unless a rewrite is explicitly required.
- The CI pipeline (`pr-check.yml`) will automatically validate your PR.

## Code Style

This project uses ESLint and Prettier. Formatting is enforced by a pre-commit hook via Husky and lint-staged. Run `npm run format` to auto-format before committing.

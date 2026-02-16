# Contributing Guide

Thanks for contributing.

## Prerequisites

- Node.js 20+
- npm 10+

## Local Setup

```sh
npm ci
npm run dev
```

## Required Checks

Run these before submitting a PR:

```sh
npm run test-vulns
npm run check:data
npm run lint
npm run build
```

## Data Contribution Rules

- Vulnerabilities must be stored as markdown files in `src/data/vulnerabilities/`.
- Each vulnerability file must include valid frontmatter with required fields:
  - `id`, `title`, `description`, `severity`, `cvss_score`, `disclosure_date`, `discovered_by`
- `threat_mapping` values must exist in `src/components/components/securityData.ts` as `t*` IDs.
- `mitigation_mapping` values must exist in `src/components/components/securityData.ts` as `m*` IDs.
- `references` entries must include `title`, `url`, and `type`.
- MITRE ATLAS `aisvsMapping` entries should use AISVS requirement IDs (for example `v4.3.1`) or category IDs (`v4`).

## Pull Requests

- Keep changes scoped and include a clear description of what changed and why.
- If you modify datasets, include the output of `npm run test-vulns` and `npm run check:data` in your PR notes.
- Prefer additive changes over broad rewrites unless a rewrite is explicitly required.

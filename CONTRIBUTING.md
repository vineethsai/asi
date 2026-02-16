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

This runs TypeScript type checking, ESLint, data integrity checks, and a production build in sequence.

You can also run individual checks:

```sh
npm run typecheck        # Type check only
npm run lint             # Lint only
npm run check:data       # Validate cross-dataset integrity
npm run format:check     # Check Prettier formatting
npm run build            # Production build
```

## Data Contributions

Security data lives in `src/components/components/`:

- `securityData.ts` -- Threats (`t*` IDs), mitigations (`m*` IDs), and AISVS categories/requirements.
- `architecturesData.ts` -- Architecture patterns referencing threat and mitigation IDs.
- `frameworkData.ts` -- Component tree (`kc*` IDs).

When adding or modifying data entries:

- Threat IDs must follow the pattern `t<number>` and be defined in `securityData.ts`.
- Mitigation IDs must follow the pattern `m<number>` and be defined in `securityData.ts`.
- Component IDs must follow the pattern `kc<number>` and be defined in `frameworkData.ts`.
- Run `npm run check:data` to verify all cross-references are valid.

## Pull Requests

- Keep changes scoped and include a clear description of what changed and why.
- If you modify datasets, include the output of `npm run check:data` in your PR description.
- Prefer additive changes over broad rewrites unless a rewrite is explicitly required.
- The CI pipeline (`pr-check.yml`) will automatically validate your PR.

## Code Style

This project uses ESLint and Prettier. Formatting is enforced by a pre-commit hook via Husky and lint-staged. Run `npm run format` to auto-format before committing.

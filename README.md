# OWASP Securing Agentic Applications Guide

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Deploy](https://github.com/vineethsai/asi/actions/workflows/deploy.yml/badge.svg)](https://github.com/vineethsai/asi/actions/workflows/deploy.yml)
[![PR Check](https://github.com/vineethsai/asi/actions/workflows/pr-check.yml/badge.svg)](https://github.com/vineethsai/asi/actions/workflows/pr-check.yml)

An interactive web application providing a comprehensive, visual guide for securing AI agentic applications using OWASP best practices, NIST AI RMF, MITRE ATLAS, and industry taxonomies.

**Live Site** -- <https://agenticsecurity.info/>
**OWASP Project** -- [Securing Agentic Applications](https://owasp.org/www-project-securing-agentic-applications/)

---

## Features

- **Threat Modeler** -- Drag-and-drop canvas for modeling agentic AI systems with automated MAESTRO-layer threat analysis, STRIDE classification, and exportable reports.
- **NIST AI RMF Mapping** -- Interactive force-directed graph mapping NIST AI Risk Management Framework functions to AISVS security controls.
- **AISVS Controls** -- Full OWASP AI Security Verification Standard (AISVS) with searchable categories, requirements, and implementation guidance.
- **AIVSS Calculator** -- AI Vulnerability Severity Score calculator for quantifying risk in AI/ML systems.
- **Architecture Explorer** -- Visual exploration of common agentic AI architecture patterns (sequential, router, parallel, hierarchical, etc.) with associated threats and mitigations.
- **Threat Catalog** -- Comprehensive catalog of 15 agentic AI threats with attack vectors, impact analysis, and linked mitigations.
- **Security Controls** -- 18 security controls and mitigations with implementation details.
- **OWASP Agentic Top 10** -- Dedicated page for the OWASP Agentic AI Top 10 risks.
- **Cisco AI Security Taxonomy** -- Browsable view of the Cisco AI security taxonomy.
- **Cross-Framework Taxonomy** -- Sankey diagram linking threats across OWASP Agentic, Cisco, and AIVSS frameworks.
- **MITRE ATLAS** -- Tactics, techniques, and case studies from the MITRE ATLAS framework for adversarial ML.
- **Interactive Checklist** -- Security checklist and testing navigator for agentic AI systems.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+ and npm 10+ (install via [nvm](https://github.com/nvm-sh/nvm#installing-and-updating))

### Local Development

```sh
git clone https://github.com/vineethsai/asi.git
cd asi
npm install
npm run dev
```

The app will be available at `http://localhost:8080`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Production build (outputs to `docs/`) |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint with auto-fix |
| `npm run typecheck` | TypeScript type checking |
| `npm run format` | Format source files with Prettier |
| `npm run format:check` | Check formatting without writing |
| `npm run check:data` | Validate cross-dataset integrity (threats, controls, AISVS, architectures) |
| `npm run validate` | Run all checks: typecheck, lint, data integrity, and build |

## Project Structure

```
src/
  components/
    architecture/     Architecture explorer (D3 force graph)
    components/       Framework data files (security, architectures, taxonomy)
    home/             Homepage sections
    interactive/      Security checklist and test navigator
    layout/           Header, Footer, Sidebar
    threat-modeler/   Drag-and-drop threat modeling canvas
      edges/          Custom ReactFlow edge types
      engine/         MAESTRO analysis engine and rules
      export/         Report export (PNG, JSON)
      nodes/          Custom ReactFlow node types
      parsers/        Import parsers
    ui/               shadcn/ui primitives
    visual/           Architecture diagrams
  hooks/              Custom React hooks
  lib/                Utilities (analytics, helpers)
  pages/              Route-level page components
scripts/
  check-data-integrity.js   Cross-dataset validation
docs/                       Production build output (GitHub Pages)
public/                     Static assets (favicons, fonts, manifest)
```

## Tech Stack

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) -- UI framework
- [Vite](https://vitejs.dev/) -- Build tool and dev server
- [Tailwind CSS](https://tailwindcss.com/) -- Utility-first styling
- [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/) -- Component library
- [D3.js](https://d3js.org/) -- Data visualizations (force graphs, Sankey diagrams)
- [React Flow](https://reactflow.dev/) -- Threat modeler node canvas
- [React Router](https://reactrouter.com/) -- Client-side routing
- [Geist](https://vercel.com/font) -- Typography (Geist Sans + Geist Mono)

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a pull request.

## Security

To report a vulnerability, see [SECURITY.md](SECURITY.md).

## License

This project is licensed under the [Apache License 2.0](LICENSE).

## Contact

- **Author**: [Vineeth Sai](http://vineethsai.com/) -- [LinkedIn](https://www.linkedin.com/in/vineethsai/)
- **Repository**: [github.com/vineethsai/asi](https://github.com/vineethsai/asi/)
- **OWASP Project**: [Securing Agentic Applications](https://owasp.org/www-project-securing-agentic-applications/)

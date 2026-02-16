import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  MousePointer,
  Zap,
  Play,
  Download,
  Layers,
  Shield,
  ArrowRight,
  FileJson,
  Image,
  FileText,
  FileSpreadsheet,
  FileCode,
  Upload,
  Crosshair,
  Flame,
  LayoutGrid,
  Save,
  Grid3x3,
  Settings,
  BookOpen,
  Clipboard,
  Keyboard,
  FileDown,
  FileType,
  Network,
  Globe,
  Edit3,
  ZoomIn,
  FolderOpen,
  Trash2,
  Undo2,
  Plus,
  HelpCircle,
  Eye,
} from "lucide-react";

const COMPONENT_TYPES = [
  {
    id: "kc1",
    name: "KC1 - Foundation Models",
    description:
      "Core LLMs and foundation models that provide the base intelligence for the system.",
    layer: "L2: Foundation Models",
    examples: "GPT-4, Claude, Llama, Gemini",
  },
  {
    id: "kc2",
    name: "KC2 - Agent Frameworks",
    description:
      "Agent orchestrators, coordinators, and individual agents that use LLMs to reason and act.",
    layer: "L3: Agent Frameworks",
    examples: "LangChain Agent, AutoGPT, CrewAI Agent",
  },
  {
    id: "kc3",
    name: "KC3 - Input/Output Guardrails",
    description:
      "Components that validate, sanitize, and filter inputs and outputs to/from agents.",
    layer: "L3: Agent Frameworks",
    examples: "Guardrails AI, NeMo Guardrails, Output Validators",
  },
  {
    id: "kc4",
    name: "KC4 - Data & Memory",
    description:
      "Data stores, vector databases, conversation memory, and knowledge bases used by agents.",
    layer: "L4: Data Operations",
    examples: "Pinecone, ChromaDB, Redis Memory, S3 Knowledge Store",
  },
  {
    id: "kc5",
    name: "KC5 - Tools & APIs",
    description: "External tools, APIs, and services that agents can invoke to perform actions.",
    layer: "L3: Agent Frameworks",
    examples: "Web Search, Database Query, Email API, Code Interpreter",
  },
  {
    id: "kc6",
    name: "KC6 - Infrastructure",
    description: "Deployment infrastructure, sandboxes, and execution environments.",
    layer: "L6: Deployment Infrastructure",
    examples: "Docker Container, Lambda, Kubernetes Pod",
  },
  {
    id: "actor",
    name: "Actor (User / External)",
    description:
      "Human users, external systems, or any entity that interacts with the agentic system from outside.",
    layer: "L7: Agent Ecosystem",
    examples: "End User, Admin, External API, Partner System",
  },
  {
    id: "datastore",
    name: "Data Store",
    description: "Persistent storage for structured or unstructured data accessed by the system.",
    layer: "L4: Data Operations",
    examples: "PostgreSQL, Vector DB, File System, S3 Bucket",
  },
  {
    id: "trust-boundary",
    name: "Trust Boundary",
    description:
      "A visual grouping that defines a security perimeter. Components inside share a trust level.",
    layer: "L5: Security & Compliance",
    examples: "Internal Network, DMZ, Public Internet, Sandbox",
  },
  {
    id: "custom",
    name: "Custom Component",
    description:
      "User-defined component with custom MAESTRO layers, trust levels, metadata, and associated threats.",
    layer: "Any layer (user defined)",
    examples: "Custom plugin, proprietary model, third-party service",
  },
];

const MAESTRO_LAYERS = [
  {
    num: 1,
    name: "Foundation Models",
    desc: "Security of base LLMs - adversarial examples, model poisoning, prompt injection.",
  },
  {
    num: 2,
    name: "Data Operations",
    desc: "Data pipeline security - training data integrity, vector store poisoning, data leakage.",
  },
  {
    num: 3,
    name: "Agent Frameworks",
    desc: "Agent logic security - tool misuse, excessive agency, goal hijacking.",
  },
  {
    num: 4,
    name: "Inter-Agent Communication",
    desc: "Agent-to-agent security - message tampering, impersonation, protocol abuse.",
  },
  {
    num: 5,
    name: "Security & Compliance",
    desc: "Guardrails, monitoring, audit logging, access controls.",
  },
  {
    num: 6,
    name: "Deployment Infrastructure",
    desc: "Infrastructure security - container escape, resource abuse, network exposure.",
  },
  {
    num: 7,
    name: "Agent Ecosystem",
    desc: "Ecosystem-level security - supply chain, trust propagation, inter-system attacks.",
  },
];

const TEMPLATES = [
  {
    name: "RAG Pipeline",
    id: "rag-pipeline",
    desc: "Retrieval-Augmented Generation with user, LLM, vector store, and external data.",
  },
  {
    name: "Multi-Agent System",
    id: "multi-agent",
    desc: "Orchestrator coordinating specialist agents with tool access.",
  },
  {
    name: "Simple Agent",
    id: "simple-agent",
    desc: "Basic agent with LLM, memory, and a single tool.",
  },
  {
    name: "Sequential Pipeline",
    id: "sequential-pipeline",
    desc: "Input validation, processing, and output verification chain.",
  },
  {
    name: "Collaborative Swarm",
    id: "collaborative-swarm",
    desc: "Peer-to-peer agents with shared knowledge and consensus.",
  },
  {
    name: "Tool-Heavy Agent",
    id: "tool-heavy-agent",
    desc: "Single agent with many external tools and API integrations.",
  },
  {
    name: "Supervised Agent",
    id: "supervised-agent",
    desc: "Agent with human-in-the-loop approval and monitoring.",
  },
];

const KEYBOARD_SHORTCUTS = [
  {
    category: "General",
    shortcuts: [
      { key: "Ctrl+S", action: "Save model" },
      { key: "Ctrl+E", action: "Run threat analysis" },
      { key: "Ctrl+A", action: "Select all nodes" },
      { key: "Esc", action: "Deselect / close panel" },
      { key: "?", action: "Show onboarding overlay" },
      { key: "Ctrl+Shift+?", action: "Keyboard shortcuts panel" },
    ],
  },
  {
    category: "Editing",
    shortcuts: [
      { key: "Ctrl+Z", action: "Undo" },
      { key: "Ctrl+Y", action: "Redo" },
      { key: "Ctrl+D", action: "Duplicate selected node" },
      { key: "Ctrl+C", action: "Copy selected node" },
      { key: "Ctrl+V", action: "Paste copied node" },
      { key: "Delete / Backspace", action: "Delete selected elements" },
    ],
  },
  {
    category: "Navigation",
    shortcuts: [
      { key: "+", action: "Zoom in" },
      { key: "-", action: "Zoom out" },
      { key: "Ctrl+0", action: "Fit view" },
      { key: "Space", action: "Fit view" },
    ],
  },
];

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-xl font-bold tracking-tight mt-10 mb-4 scroll-mt-20 border-b pb-2">
      {children}
    </h2>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold mt-6 mb-2">{children}</h3>;
}

export default function ThreatModelerGuide() {
  return (
    <>
      <Helmet>
        <title>Threat Modeler Guide - Agentic Security Hub</title>
        <meta
          name="description"
          content="Comprehensive guide for using the AI Threat Modeler with MAESTRO 7-layer analysis, Cisco taxonomy mapping, OWASP Agentic Top 10 mapping, and PDF reporting"
        />
      </Helmet>
      <Header />
      <main id="main-content" className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* Hero */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Threat Modeler Guide</h1>
          </div>
          <p className="text-muted-foreground">
            Learn how to use the interactive Threat Modeler to build, analyze, and secure your
            agentic AI architectures using the MAESTRO 7-layer framework, with integrated Cisco AI
            Security Taxonomy and OWASP Agentic Top 10 mapping.
          </p>
          <div className="mt-4">
            <Link
              to="/threat-modeler"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Open Threat Modeler <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Table of Contents */}
        <nav className="rounded-lg border bg-accent/20 p-4">
          <p className="text-sm font-semibold mb-2">Contents</p>
          <ol className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm">
            {[
              ["introduction", "1. Introduction"],
              ["quick-start", "2. Quick Start"],
              ["components", "3. Component Reference"],
              ["data-flows", "4. Data Flow Configuration"],
              ["analysis-engine", "5. Analysis Engine"],
              ["taxonomy-mapping", "6. Taxonomy Mapping"],
              ["results-panel", "7. Results Panel"],
              ["inline-editing", "8. Inline Editing"],
              ["zoom-aware", "9. Zoom-Aware Rendering"],
              ["templates", "10. Templates & User Templates"],
              ["auto-save", "11. Auto-Save & Model Management"],
              ["export-formats", "12. Export Formats"],
              ["import", "13. Import"],
              ["shortcuts", "14. Keyboard Shortcuts"],
              ["toolbar-reference", "15. Toolbar Reference"],
              ["tips", "16. Tips & Best Practices"],
            ].map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`} className="text-primary hover:underline">
                  {label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* 1. Introduction */}
        <SectionHeading id="introduction">1. Introduction</SectionHeading>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The Threat Modeler is a visual, interactive tool for building threat models of agentic AI
          systems. It uses the <strong>MAESTRO 7-layer framework</strong> to systematically identify
          threats across all layers of an AI system -- from foundation models to the broader
          ecosystem. Every detected threat is automatically mapped to the{" "}
          <strong>Cisco AI Security Taxonomy</strong> and <strong>OWASP Agentic Top 10</strong> for
          comprehensive coverage.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          <div className="rounded-lg border p-4 bg-accent/10">
            <Shield className="h-5 w-5 text-primary mb-2" />
            <p className="text-sm font-semibold">Deep Threat Detection</p>
            <p className="text-xs text-muted-foreground mt-1">
              Automatically identifies threats based on component types, metadata, connections,
              topology, and MAESTRO layers -- with Cisco and OWASP mapping.
            </p>
          </div>
          <div className="rounded-lg border p-4 bg-accent/10">
            <Layers className="h-5 w-5 text-primary mb-2" />
            <p className="text-sm font-semibold">Multi-Framework Analysis</p>
            <p className="text-xs text-muted-foreground mt-1">
              MAESTRO 7-layer, Cisco AI Security Taxonomy, OWASP Agentic Top 10, and AISVS
              compliance -- all in one analysis run.
            </p>
          </div>
          <div className="rounded-lg border p-4 bg-accent/10">
            <Crosshair className="h-5 w-5 text-primary mb-2" />
            <p className="text-sm font-semibold">Attack Paths & Export</p>
            <p className="text-xs text-muted-foreground mt-1">
              Discovers multi-hop attack paths and exports full reports in PDF, Markdown, CSV,
              SARIF, JSON, PNG, and SVG formats.
            </p>
          </div>
        </div>

        {/* Who is this for */}
        <SubHeading>Who is this for?</SubHeading>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li>Security engineers evaluating AI/ML system architectures</li>
          <li>AI/ML engineers designing agentic systems and wanting to identify risks early</li>
          <li>Architects planning multi-agent deployments</li>
          <li>Compliance teams assessing AISVS, NIST AI RMF, Cisco, and OWASP coverage</li>
          <li>Red teams building threat models for adversarial testing</li>
        </ul>

        {/* 2. Quick Start */}
        <SectionHeading id="quick-start">2. Quick Start</SectionHeading>
        <div className="space-y-6">
          <div className="flex items-start gap-4 p-4 rounded-lg border bg-accent/10">
            <div className="rounded-full bg-primary/10 p-2.5 shrink-0">
              <MousePointer className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Step 1: Drag and Drop Components</p>
              <p className="text-xs text-muted-foreground mt-1">
                Open the{" "}
                <Link to="/threat-modeler" className="text-primary hover:underline">
                  Threat Modeler
                </Link>
                . The left panel shows all available component types. Drag components from the
                palette onto the canvas. Each component represents a piece of your AI architecture
                (LLM, agent, data store, tool, etc.).
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 rounded-lg border bg-accent/10">
            <div className="rounded-full bg-primary/10 p-2.5 shrink-0">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Step 2: Connect Components</p>
              <p className="text-xs text-muted-foreground mt-1">
                Hover over a component to reveal connection handles (small dots on the edges). Click
                and drag from one handle to another to create a data flow. A dialog will open to
                configure the flow's metadata (protocol, encryption, authentication, data
                classification).
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 rounded-lg border bg-accent/10">
            <div className="rounded-full bg-primary/10 p-2.5 shrink-0">
              <Edit3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Step 3: Configure Node Properties</p>
              <p className="text-xs text-muted-foreground mt-1">
                Click any component to open its properties panel on the right. You can{" "}
                <strong>inline-edit</strong> the node name and trust level directly. The panel also
                shows component metadata, associated threats, and mitigation progress.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 rounded-lg border bg-accent/10">
            <div className="rounded-full bg-primary/10 p-2.5 shrink-0">
              <Play className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Step 4: Run Analysis</p>
              <p className="text-xs text-muted-foreground mt-1">
                Click the <strong>Analyze</strong> button (or press{" "}
                <code className="px-1 bg-muted rounded text-[11px]">Ctrl+E</code>) to run the threat
                analysis engine. Alternatively, enable <strong>Live</strong> mode to re-analyze
                automatically whenever the model changes. Results include MAESTRO threats, Cisco
                taxonomy mappings, and OWASP Agentic Top 10 correlations.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 rounded-lg border bg-accent/10">
            <div className="rounded-full bg-primary/10 p-2.5 shrink-0">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Step 5: Review and Mitigate</p>
              <p className="text-xs text-muted-foreground mt-1">
                Browse threats in the right panel across multiple tabs: All Threats, MAESTRO Layers,
                Dashboard, Attack Paths, Compliance, Cisco Taxonomy, and OWASP Agentic. Use bulk
                selection to export multiple threats at once. Click "Jump to Critical" to locate
                high-severity threats on the canvas.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 rounded-lg border bg-accent/10">
            <div className="rounded-full bg-primary/10 p-2.5 shrink-0">
              <Download className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Step 6: Export Results</p>
              <p className="text-xs text-muted-foreground mt-1">
                Click the <strong>Export</strong> dropdown in the toolbar to choose from: PDF (full
                report), JSON, PNG, SVG, Markdown, CSV, or SARIF. The PDF and Markdown exports
                include Cisco and OWASP taxonomy mapping sections for comprehensive reporting.
              </p>
            </div>
          </div>
        </div>

        {/* 3. Component Reference */}
        <SectionHeading id="components">3. Component Reference</SectionHeading>
        <p className="text-sm text-muted-foreground mb-4">
          The Threat Modeler provides the following component types. Each maps to one or more
          MAESTRO layers and includes rich metadata that feeds the analysis engine.
        </p>
        <div className="space-y-2">
          {COMPONENT_TYPES.map((c) => (
            <div key={c.id} className="rounded-lg border p-3 hover:bg-accent/10 transition-colors">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{c.name}</p>
                <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
                  {c.layer}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{c.description}</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                <span className="font-medium">Examples:</span> {c.examples}
              </p>
            </div>
          ))}
        </div>

        {/* 4. Data Flow Configuration */}
        <SectionHeading id="data-flows">4. Data Flow Configuration</SectionHeading>
        <p className="text-sm text-muted-foreground mb-4">
          When you create a connection between components, you can configure its metadata. This
          metadata directly affects threat detection -- unencrypted flows, missing authentication,
          and PII exposure all generate specific compliance violations.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border rounded-lg">
            <thead>
              <tr className="bg-accent/30">
                <th className="text-left p-2 font-semibold">Property</th>
                <th className="text-left p-2 font-semibold">Options</th>
                <th className="text-left p-2 font-semibold">Impact on Analysis</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="p-2 font-medium">Protocol</td>
                <td className="p-2 text-muted-foreground">
                  HTTP, HTTPS, gRPC, WebSocket, Internal, Custom
                </td>
                <td className="p-2 text-muted-foreground">
                  External HTTP connections flag as violations
                </td>
              </tr>
              <tr>
                <td className="p-2 font-medium">Encrypted</td>
                <td className="p-2 text-muted-foreground">Yes / No</td>
                <td className="p-2 text-muted-foreground">
                  Unencrypted PII/restricted data = critical violation
                </td>
              </tr>
              <tr>
                <td className="p-2 font-medium">Authentication</td>
                <td className="p-2 text-muted-foreground">
                  None, API Key, OAuth2, mTLS, JWT, Custom
                </td>
                <td className="p-2 text-muted-foreground">
                  No-auth on confidential data = high violation
                </td>
              </tr>
              <tr>
                <td className="p-2 font-medium">Data Classification</td>
                <td className="p-2 text-muted-foreground">
                  Public, Internal, Confidential, Restricted
                </td>
                <td className="p-2 text-muted-foreground">
                  Higher classification requires stronger controls
                </td>
              </tr>
              <tr>
                <td className="p-2 font-medium">Contains PII</td>
                <td className="p-2 text-muted-foreground">Yes / No</td>
                <td className="p-2 text-muted-foreground">
                  PII to untrusted zones or without encryption = critical
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 5. Analysis Engine */}
        <SectionHeading id="analysis-engine">5. Analysis Engine</SectionHeading>
        <p className="text-sm text-muted-foreground mb-4">
          The analysis engine runs multiple detection strategies in sequence, enriches results with
          security data, and maps findings to Cisco and OWASP taxonomies:
        </p>

        <SubHeading>MAESTRO Layer Threats</SubHeading>
        <p className="text-sm text-muted-foreground mb-3">
          Each component's MAESTRO layer mapping is checked against a catalog of ~30 known threats.
          Cross-layer threats are detected when components on different layers are connected within
          4 hops.
        </p>
        <div className="space-y-1.5">
          {MAESTRO_LAYERS.map((l) => (
            <div key={l.num} className="flex items-start gap-3 p-2 rounded border bg-accent/10">
              <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded shrink-0">
                L{l.num}
              </span>
              <div>
                <p className="text-xs font-semibold">{l.name}</p>
                <p className="text-[11px] text-muted-foreground">{l.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <SubHeading>Connection Rules</SubHeading>
        <p className="text-sm text-muted-foreground">
          Specific connection patterns trigger threats: Actor-to-LLM connections flag prompt
          injection risk, agent-to-tool flows flag tool misuse, agent-to-memory flows flag memory
          poisoning, and agent-to-agent connections flag multi-agent delegation risks.
        </p>

        <SubHeading>Topology Rules</SubHeading>
        <p className="text-sm text-muted-foreground">
          The engine examines overall architecture shape: unbounded components (outside trust
          boundaries), excessive agency (agents with 3+ tools), missing human-in-the-loop, single
          points of failure, and missing observability components.
        </p>

        <SubHeading>Inherited Threat Propagation</SubHeading>
        <p className="text-sm text-muted-foreground">
          Threats propagate downstream through data flows (BFS, up to 4 hops). Severity degrades
          with each hop unless crossing a trust boundary, in which case it remains high. This models
          real-world cascading failures.
        </p>

        <SubHeading>Data Flow Compliance</SubHeading>
        <p className="text-sm text-muted-foreground">
          Edge metadata is checked for PII without encryption, restricted data without auth,
          cross-boundary flows without authentication, and external connections using HTTP. These
          generate compliance violations shown in the Dashboard.
        </p>

        <SubHeading>Attack Surface Scoring</SubHeading>
        <p className="text-sm text-muted-foreground">
          Each component receives a numeric attack surface score based on: number of connections,
          trust level, external exposure, unencrypted flows, unauthenticated flows, and PII
          exposure. Higher scores indicate larger attack surfaces.
        </p>

        <SubHeading>Security Data Enrichment</SubHeading>
        <p className="text-sm text-muted-foreground">
          After threat detection, each threat is enriched with mitigations and controls from the
          security data catalog. The enrichment engine then applies Cisco and OWASP taxonomy
          mappings (see next section) so every threat has full cross-framework coverage.
        </p>

        {/* 6. Taxonomy Mapping */}
        <SectionHeading id="taxonomy-mapping">6. Taxonomy Mapping</SectionHeading>
        <p className="text-sm text-muted-foreground mb-4">
          Every detected threat is automatically mapped to two additional taxonomies, providing
          defense-in-depth coverage and compliance alignment:
        </p>

        <div className="space-y-4">
          <div className="rounded-lg border p-4 bg-accent/10">
            <div className="flex items-center gap-2 mb-2">
              <Network className="h-5 w-5 text-primary" />
              <p className="text-sm font-semibold">Cisco AI Security Taxonomy</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Threats are mapped to Cisco's AI Security Taxonomy objectives and techniques using a
              combination of MAESTRO layer correlation and keyword-based matching. Each mapping
              identifies which Cisco security objectives are relevant and what specific techniques
              apply. Results appear in the dedicated <strong>Cisco</strong> tab in the results
              panel, and are included in Markdown and PDF reports.
            </p>
          </div>
          <div className="rounded-lg border p-4 bg-accent/10">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-5 w-5 text-primary" />
              <p className="text-sm font-semibold">OWASP Agentic Top 10</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Threats are mapped to OWASP Agentic Security Initiative (ASI) categories with
              confidence levels (high/medium/low). Mapping uses keyword pattern matching and MAESTRO
              layer correlations. Results appear in the <strong>OWASP</strong> tab in the results
              panel, and are included in Markdown and PDF reports.
            </p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-3 p-3 rounded-lg border bg-accent/5">
          <strong>Note:</strong> When adding custom threats or custom components with appropriate
          metadata (MAESTRO layers, keywords in titles/descriptions), the taxonomy mapping engine
          automatically picks up the new content. No additional configuration is needed.
        </p>

        {/* 7. Results Panel */}
        <SectionHeading id="results-panel">7. Results Panel</SectionHeading>
        <p className="text-sm text-muted-foreground mb-4">
          After running analysis, the right panel provides multiple views of results:
        </p>
        <div className="space-y-2">
          {[
            {
              name: "All",
              desc: "Every detected threat, filterable by severity. Supports bulk selection and export.",
            },
            {
              name: "MAESTRO",
              desc: "Threats grouped by MAESTRO layer, showing which layers have the most threats.",
            },
            {
              name: "Dashboard",
              desc: "Risk overview with severity distribution, top affected components, and compliance violations.",
            },
            {
              name: "Attack Paths",
              desc: "Multi-hop attack paths from external actors to high-value targets through your architecture.",
            },
            {
              name: "Compliance",
              desc: "AISVS compliance violations showing which controls are met and which are missing.",
            },
            {
              name: "Cisco",
              desc: "Aggregated Cisco AI Security Taxonomy mappings across all detected threats.",
            },
            {
              name: "OWASP",
              desc: "Aggregated OWASP Agentic Top 10 mappings with confidence levels.",
            },
          ].map((tab) => (
            <div key={tab.name} className="flex items-start gap-3 p-3 rounded-lg border">
              <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded shrink-0 mt-0.5">
                {tab.name}
              </span>
              <p className="text-xs text-muted-foreground">{tab.desc}</p>
            </div>
          ))}
        </div>

        <SubHeading>Bulk Actions</SubHeading>
        <p className="text-sm text-muted-foreground">
          In the "All" tab, use checkboxes to select multiple threats, then click{" "}
          <strong>Export Selected</strong> to download just those threats as CSV. The{" "}
          <strong>Jump to Critical</strong> button highlights all critical-severity threats on the
          canvas.
        </p>

        <SubHeading>Threat-to-Canvas Navigation</SubHeading>
        <p className="text-sm text-muted-foreground">
          Click any threat to highlight the affected component(s) on the canvas. The canvas pans and
          zooms to show the relevant node, making it easy to locate issues in large diagrams.
        </p>

        {/* 8. Inline Editing */}
        <SectionHeading id="inline-editing">8. Inline Editing</SectionHeading>
        <p className="text-sm text-muted-foreground mb-4">
          Edit node properties directly from the properties panel without opening a separate dialog:
        </p>
        <div className="space-y-3">
          <div className="rounded-lg border p-4 bg-accent/10">
            <p className="text-sm font-semibold flex items-center gap-2">
              <Edit3 className="h-4 w-4 text-primary" /> Node Name
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Click the node name in the properties panel to enter edit mode. Press{" "}
              <code className="px-1 bg-muted rounded text-[11px]">Enter</code> to save or{" "}
              <code className="px-1 bg-muted rounded text-[11px]">Escape</code> to cancel. Changes
              are reflected immediately on the canvas.
            </p>
          </div>
          <div className="rounded-lg border p-4 bg-accent/10">
            <p className="text-sm font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" /> Trust Level
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Click the trust level badge to cycle through available trust levels. Changes
              automatically affect the threat analysis when Live mode is enabled.
            </p>
          </div>
          <div className="rounded-lg border p-4 bg-accent/10">
            <p className="text-sm font-semibold flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" /> Mitigation Tracking
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              The properties panel shows a mitigation progress bar and collapsible sections for each
              threat and mitigation associated with the selected node.
            </p>
          </div>
        </div>

        {/* 9. Zoom-Aware Rendering */}
        <SectionHeading id="zoom-aware">9. Zoom-Aware Rendering</SectionHeading>
        <p className="text-sm text-muted-foreground mb-4">
          Components adapt their display based on the current zoom level for optimal readability:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border rounded-lg">
            <thead>
              <tr className="bg-accent/30">
                <th className="text-left p-2 font-semibold">Zoom Level</th>
                <th className="text-left p-2 font-semibold">Tier</th>
                <th className="text-left p-2 font-semibold">Display</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="p-2 font-medium">&gt;= 70%</td>
                <td className="p-2">
                  <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-600 text-xs font-medium">
                    Full
                  </span>
                </td>
                <td className="p-2 text-muted-foreground">
                  Complete component card with icon, name, subtitle, metadata, and small connection
                  handles
                </td>
              </tr>
              <tr>
                <td className="p-2 font-medium">40% - 70%</td>
                <td className="p-2">
                  <span className="px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-600 text-xs font-medium">
                    Compact
                  </span>
                </td>
                <td className="p-2 text-muted-foreground">
                  Condensed card with icon and name only, medium-sized handles for easier
                  connections
                </td>
              </tr>
              <tr>
                <td className="p-2 font-medium">&lt; 40%</td>
                <td className="p-2">
                  <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-600 text-xs font-medium">
                    Minimal
                  </span>
                </td>
                <td className="p-2 text-muted-foreground">
                  Icon-only pill with large connection handles for easy interaction at overview zoom
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          This ensures the canvas remains usable and readable whether you're zoomed in to edit
          properties or zoomed out for a high-level architecture overview.
        </p>

        {/* 10. Templates & User Templates */}
        <SectionHeading id="templates">10. Templates & User Templates</SectionHeading>
        <p className="text-sm text-muted-foreground mb-4">
          Start quickly with pre-built architecture templates, or create and reuse your own.
        </p>

        <SubHeading>Built-in Templates</SubHeading>
        <p className="text-sm text-muted-foreground mb-3">
          Select a template from the Templates dropdown in the toolbar:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {TEMPLATES.map((t) => (
            <Link
              key={t.id}
              to={`/threat-modeler?template=${t.id}`}
              className="rounded-lg border p-3 hover:bg-accent/20 transition-colors group"
            >
              <p className="text-sm font-semibold group-hover:text-primary transition-colors">
                {t.name}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
            </Link>
          ))}
        </div>

        <SubHeading>User Templates</SubHeading>
        <p className="text-sm text-muted-foreground">
          When saving a model via the Save Model dialog, check the{" "}
          <strong>"Save as Template"</strong> option. This strips analysis results and saves a clean
          architecture snapshot you can reuse. User templates appear in the Templates dropdown under
          a "Your Templates" section and in the Load Model dialog under a separate heading.
          Templates are stored in browser localStorage.
        </p>

        {/* 11. Auto-Save & Model Management */}
        <SectionHeading id="auto-save">11. Auto-Save & Model Management</SectionHeading>
        <div className="space-y-3">
          <div className="rounded-lg border p-4 bg-accent/10">
            <p className="text-sm font-semibold flex items-center gap-2">
              <Save className="h-4 w-4 text-primary" /> Auto-Save
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              The Threat Modeler auto-saves your work in three ways: (1) a periodic save every 30
              seconds, (2) a debounced save 5 seconds after any node or edge change, and (3) an
              immediate save when you close or navigate away from the tab. Auto-saved data includes
              all nodes, edges, analysis results, methodology settings, and custom components. It is
              restored automatically when you return.
            </p>
          </div>
          <div className="rounded-lg border p-4 bg-accent/10">
            <p className="text-sm font-semibold flex items-center gap-2">
              <Save className="h-4 w-4 text-primary" /> Manual Save
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Press <code className="px-1 bg-muted rounded text-[11px]">Ctrl+S</code> or click the
              Save button to create a named snapshot. You can save multiple models and load any of
              them later via the Load Model dialog.
            </p>
          </div>
          <div className="rounded-lg border p-4 bg-accent/10">
            <p className="text-sm font-semibold flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-primary" /> Load Model
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Open the Load Model dialog to see all saved models and user templates. Each entry
              shows the save date and component count. You can delete old saves from this dialog.
            </p>
          </div>
          <div className="rounded-lg border p-4 bg-accent/10">
            <p className="text-sm font-semibold flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-primary" /> Clear Canvas
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              The Clear Canvas button removes all components and connections and also clears the
              auto-save data, giving you a truly fresh start.
            </p>
          </div>
        </div>

        {/* 12. Export Formats */}
        <SectionHeading id="export-formats">12. Export Formats</SectionHeading>
        <p className="text-sm text-muted-foreground mb-4">
          Use the <strong>Export</strong> dropdown in the toolbar to export in any of these formats:
        </p>
        <div className="space-y-2">
          {[
            {
              icon: FileDown,
              name: "PDF Report",
              desc: "Full multi-page PDF report including: executive summary, risk assessment, threat inventory with Cisco & OWASP mappings, component inventory, attack paths, AISVS compliance, data flow inventory, and prioritized remediation plan.",
            },
            {
              icon: FileJson,
              name: "JSON",
              desc: "Complete model export including nodes, edges, analysis results, custom components, and all metadata. Use for backup, sharing, or re-importing.",
            },
            {
              icon: Image,
              name: "PNG",
              desc: "High-resolution screenshot of the canvas. Useful for documentation and presentations.",
            },
            {
              icon: FileType,
              name: "SVG",
              desc: "Scalable vector graphic of the canvas. Ideal for high-quality prints and embedding in documents.",
            },
            {
              icon: FileText,
              name: "Markdown",
              desc: "Comprehensive report with architecture summary, threat list, risk scores, attack paths, AISVS coverage, and Cisco/OWASP taxonomy mapping sections.",
            },
            {
              icon: FileSpreadsheet,
              name: "CSV",
              desc: "All threats as a spreadsheet. Import into Excel or Google Sheets for further analysis and tracking.",
            },
            {
              icon: FileCode,
              name: "SARIF",
              desc: "Static Analysis Results Interchange Format (v2.1.0). Integrates with GitHub Security, Azure DevOps, and other SAST tools for CI/CD pipeline integration.",
            },
          ].map((f) => (
            <div key={f.name} className="flex items-start gap-3 p-3 rounded-lg border">
              <f.icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">{f.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 13. Import */}
        <SectionHeading id="import">13. Import</SectionHeading>
        <p className="text-sm text-muted-foreground mb-4">
          Use the <strong>Import</strong> dropdown in the toolbar:
        </p>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg border">
            <Upload className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">JSON Model Import</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Load a previously exported JSON threat model. Restores all nodes, edges, analysis
                results, methodology settings, and custom components.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg border">
            <FileCode className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">Cisco AI BOM Import</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Import architecture from a Cisco AI Bill of Materials (AIBOM) JSON scan. The parser
                extracts components and connections from the BOM and places them on the canvas with
                auto-layout. Analysis runs automatically after import.
              </p>
            </div>
          </div>
        </div>

        {/* 14. Keyboard Shortcuts */}
        <SectionHeading id="shortcuts">14. Keyboard Shortcuts</SectionHeading>
        <p className="text-sm text-muted-foreground mb-4">
          Press <code className="px-1 bg-muted rounded text-[11px]">Ctrl+Shift+?</code> inside the
          Threat Modeler to open the keyboard shortcuts panel. Here's the full reference:
        </p>
        {KEYBOARD_SHORTCUTS.map((group) => (
          <div key={group.category} className="mb-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              {group.category}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border rounded-lg">
                <thead>
                  <tr className="bg-accent/30">
                    <th className="text-left p-2 font-semibold w-48">Shortcut</th>
                    <th className="text-left p-2 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {group.shortcuts.map((s) => (
                    <tr key={s.key}>
                      <td className="p-2">
                        <code className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">
                          {s.key}
                        </code>
                      </td>
                      <td className="p-2 text-muted-foreground">{s.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {/* 15. Toolbar Reference */}
        <SectionHeading id="toolbar-reference">15. Toolbar Reference</SectionHeading>
        <p className="text-sm text-muted-foreground mb-4">
          A quick guide to every control in the toolbar, from left to right:
        </p>
        <div className="space-y-1.5">
          {[
            {
              icon: Play,
              name: "MAESTRO badge & Analyze",
              desc: "Shows the active framework. Click Analyze to run threat analysis or toggle Live mode for auto-analysis.",
            },
            {
              icon: Flame,
              name: "Heat Map",
              desc: "Color-codes components by threat severity (red = critical, orange = high, etc.).",
            },
            {
              icon: Crosshair,
              name: "What-If Mode",
              desc: "Click any component to simulate removing it and see how many threats/attack paths are eliminated.",
            },
            {
              icon: Undo2,
              name: "Undo / Redo",
              desc: "Step backward and forward through your editing history.",
            },
            {
              icon: LayoutGrid,
              name: "Auto Layout",
              desc: "Arranges all components in a clean top-to-bottom hierarchy automatically.",
            },
            {
              icon: Grid3x3,
              name: "Snap to Grid",
              desc: "Aligns components to a grid when dragging for precise placement.",
            },
            {
              icon: Settings,
              name: "Templates",
              desc: "Dropdown to load built-in architecture templates or your saved user templates.",
            },
            {
              icon: Plus,
              name: "Custom",
              desc: "Create a custom component with user-defined MAESTRO layers, trust levels, and threats.",
            },
            {
              icon: Save,
              name: "Save / Load",
              desc: "Save your current model to browser storage or load a previously saved model.",
            },
            {
              icon: Upload,
              name: "Import dropdown",
              desc: "Import JSON model or Cisco AIBOM file.",
            },
            {
              icon: Download,
              name: "Export dropdown",
              desc: "Export to PDF, JSON, PNG, SVG, Markdown, CSV, or SARIF.",
            },
            {
              icon: HelpCircle,
              name: "Help",
              desc: "Shows the guided onboarding tour and keyboard shortcuts panel.",
            },
            { icon: BookOpen, name: "Full Guide", desc: "Opens this guide page in a new tab." },
            {
              icon: Trash2,
              name: "Clear Canvas",
              desc: "Removes all components, connections, and auto-save data.",
            },
          ].map((item) => (
            <div
              key={item.name}
              className="flex items-start gap-3 p-2.5 rounded-lg border hover:bg-accent/10 transition-colors"
            >
              <item.icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold">{item.name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 16. Tips & Best Practices */}
        <SectionHeading id="tips">16. Tips & Best Practices</SectionHeading>
        <div className="space-y-3">
          <div className="rounded-lg border p-4 bg-accent/10">
            <p className="text-sm font-semibold flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" /> Define Trust Boundaries Early
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Before adding components, think about your trust zones (internal, DMZ, public). Add
              trust boundaries first, then drag components inside them. This enables cross-boundary
              threat detection.
            </p>
          </div>
          <div className="rounded-lg border p-4 bg-accent/10">
            <p className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" /> Use Live Mode for Iterative Design
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Enable Live mode when iterating on your architecture. Threats update automatically as
              you add or remove components, giving you immediate feedback on security implications.
            </p>
          </div>
          <div className="rounded-lg border p-4 bg-accent/10">
            <p className="text-sm font-semibold flex items-center gap-2">
              <Flame className="h-4 w-4 text-primary" /> Use the Heat Map
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Toggle the Heat Map to visually identify hotspots. Components are color-coded by
              threat severity -- red means high risk, making it easy to spot critical areas at a
              glance.
            </p>
          </div>
          <div className="rounded-lg border p-4 bg-accent/10">
            <p className="text-sm font-semibold flex items-center gap-2">
              <Crosshair className="h-4 w-4 text-primary" /> Try What-If Analysis
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Enable What-If mode and click a component to simulate its removal. The panel shows how
              many threats and attack paths would be eliminated, helping you prioritize security
              investments.
            </p>
          </div>
          <div className="rounded-lg border p-4 bg-accent/10">
            <p className="text-sm font-semibold flex items-center gap-2">
              <ZoomIn className="h-4 w-4 text-primary" /> Leverage Zoom-Aware Rendering
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Zoom out to get a high-level overview (components switch to compact/minimal mode).
              Zoom in to see full details and metadata. Connection handles scale up when zoomed out,
              making it easy to create connections at any zoom level.
            </p>
          </div>
          <div className="rounded-lg border p-4 bg-accent/10">
            <p className="text-sm font-semibold flex items-center gap-2">
              <Clipboard className="h-4 w-4 text-primary" /> Duplicate and Copy Nodes
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Use <code className="px-1 bg-muted rounded text-[11px]">Ctrl+D</code> to duplicate a
              selected node, or <code className="px-1 bg-muted rounded text-[11px]">Ctrl+C</code> /{" "}
              <code className="px-1 bg-muted rounded text-[11px]">Ctrl+V</code> for copy-paste.
              Duplicated nodes inherit all metadata and are offset on the canvas for easy editing.
            </p>
          </div>
          <div className="rounded-lg border p-4 bg-accent/10">
            <p className="text-sm font-semibold flex items-center gap-2">
              <Save className="h-4 w-4 text-primary" /> Save as Template for Reuse
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              After designing an architecture you'll reuse, save it with the "Save as Template"
              option. Templates strip out analysis results, so you start fresh each time while
              keeping the architecture intact.
            </p>
          </div>
          <div className="rounded-lg border p-4 bg-accent/10">
            <p className="text-sm font-semibold flex items-center gap-2">
              <FileDown className="h-4 w-4 text-primary" /> Use PDF for Stakeholder Reports
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              The PDF export generates a professional multi-page report with executive summary,
              threat inventory, Cisco and OWASP mappings, attack paths, and remediation plan --
              perfect for sharing with leadership, compliance teams, or auditors.
            </p>
          </div>
          <div className="rounded-lg border p-4 bg-accent/10">
            <p className="text-sm font-semibold flex items-center gap-2">
              <LayoutGrid className="h-4 w-4 text-primary" /> Use Auto Layout
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              After adding many components, click Auto Layout to arrange everything in a clean
              top-to-bottom hierarchy. Enable Snap to Grid for precise placement.
            </p>
          </div>
          <div className="rounded-lg border p-4 bg-accent/10">
            <p className="text-sm font-semibold flex items-center gap-2">
              <Edit3 className="h-4 w-4 text-primary" /> Name Components Descriptively
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Click any component's name in the properties panel to inline-edit it. Descriptive
              names make your threat model readable and your exported reports more useful.
            </p>
          </div>
          <div className="rounded-lg border p-4 bg-accent/10">
            <p className="text-sm font-semibold flex items-center gap-2">
              <Keyboard className="h-4 w-4 text-primary" /> Learn the Keyboard Shortcuts
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Press <code className="px-1 bg-muted rounded text-[11px]">Ctrl+Shift+?</code> to see
              all shortcuts. Power users can model, analyze, and export entirely via keyboard.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-6 text-center mt-10">
          <h3 className="text-lg font-bold">Ready to get started?</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Open the Threat Modeler and start building your AI security model.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <Link
              to="/threat-modeler"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Open Threat Modeler <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/threat-modeler?template=rag-pipeline"
              className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
              Try RAG Template
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

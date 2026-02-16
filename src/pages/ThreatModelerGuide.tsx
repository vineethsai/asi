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
  { key: "Ctrl+E", action: "Run threat analysis" },
  { key: "Ctrl+Z", action: "Undo" },
  { key: "Ctrl+Y", action: "Redo" },
  { key: "Ctrl+S", action: "Save model" },
  { key: "Ctrl+A", action: "Select all nodes" },
  { key: "Delete / Backspace", action: "Delete selected elements" },
  { key: "?", action: "Show onboarding / help" },
  { key: "Space", action: "Fit view to canvas" },
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
          content="Comprehensive guide for using the AI Threat Modeler with MAESTRO 7-layer analysis"
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
            agentic AI architectures using the MAESTRO 7-layer framework.
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
              ["templates", "6. Templates"],
              ["export-formats", "7. Export Formats"],
              ["import", "8. Import"],
              ["shortcuts", "9. Keyboard Shortcuts"],
              ["tips", "10. Tips & Best Practices"],
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
          ecosystem.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          <div className="rounded-lg border p-4 bg-accent/10">
            <Shield className="h-5 w-5 text-primary mb-2" />
            <p className="text-sm font-semibold">Threat Detection</p>
            <p className="text-xs text-muted-foreground mt-1">
              Automatically identifies threats based on component types, connections, topology, and
              MAESTRO layers.
            </p>
          </div>
          <div className="rounded-lg border p-4 bg-accent/10">
            <Layers className="h-5 w-5 text-primary mb-2" />
            <p className="text-sm font-semibold">7-Layer Analysis</p>
            <p className="text-xs text-muted-foreground mt-1">
              Covers foundation models, data operations, agent frameworks, inter-agent comms,
              security, infrastructure, and ecosystem.
            </p>
          </div>
          <div className="rounded-lg border p-4 bg-accent/10">
            <Crosshair className="h-5 w-5 text-primary mb-2" />
            <p className="text-sm font-semibold">Attack Paths</p>
            <p className="text-xs text-muted-foreground mt-1">
              Discovers attack paths from external actors to high-value targets through your
              architecture.
            </p>
          </div>
        </div>

        {/* Who is this for */}
        <SubHeading>Who is this for?</SubHeading>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li>Security engineers evaluating AI/ML system architectures</li>
          <li>AI/ML engineers designing agentic systems and wanting to identify risks early</li>
          <li>Architects planning multi-agent deployments</li>
          <li>Compliance teams assessing AISVS and NIST AI RMF coverage</li>
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
              <Play className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Step 3: Run Analysis</p>
              <p className="text-xs text-muted-foreground mt-1">
                Click the <strong>Analyze</strong> button (or press{" "}
                <code className="px-1 bg-muted rounded text-[11px]">Ctrl+E</code>) to run the threat
                analysis engine. Alternatively, enable <strong>Live</strong> mode to re-analyze
                automatically whenever the model changes. Results appear in the right panel.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 rounded-lg border bg-accent/10">
            <div className="rounded-full bg-primary/10 p-2.5 shrink-0">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Step 4: Review and Mitigate</p>
              <p className="text-xs text-muted-foreground mt-1">
                Browse threats in the right panel, organized by severity. Click a threat to
                highlight affected components on the canvas. Click a component to open its
                properties panel, where you can track mitigation status for each threat.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 rounded-lg border bg-accent/10">
            <div className="rounded-full bg-primary/10 p-2.5 shrink-0">
              <Download className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Step 5: Export Results</p>
              <p className="text-xs text-muted-foreground mt-1">
                Export your threat model as JSON (full model), PNG (screenshot), CSV (threats
                spreadsheet), Markdown (full report), or SARIF (for CI/CD integration). Use the
                toolbar buttons on the right side.
              </p>
            </div>
          </div>
        </div>

        {/* 3. Component Reference */}
        <SectionHeading id="components">3. Component Reference</SectionHeading>
        <p className="text-sm text-muted-foreground mb-4">
          The Threat Modeler provides the following component types. Each maps to one or more
          MAESTRO layers.
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
          The analysis engine runs multiple detection strategies in sequence:
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

        {/* 6. Templates */}
        <SectionHeading id="templates">6. Templates</SectionHeading>
        <p className="text-sm text-muted-foreground mb-4">
          Start quickly with pre-built architecture templates. Select a template from the toolbar
          dropdown.
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

        {/* 7. Export Formats */}
        <SectionHeading id="export-formats">7. Export Formats</SectionHeading>
        <div className="space-y-2">
          {[
            {
              icon: FileJson,
              name: "JSON",
              desc: "Complete model export including nodes, edges, analysis results, and custom components. Use for backup, sharing, or re-importing.",
            },
            {
              icon: Image,
              name: "PNG",
              desc: "High-resolution screenshot of the canvas. Useful for documentation and presentations.",
            },
            {
              icon: FileSpreadsheet,
              name: "CSV",
              desc: "All threats as a spreadsheet. Import into Excel or Google Sheets for further analysis and tracking.",
            },
            {
              icon: FileText,
              name: "Markdown",
              desc: "Comprehensive report with architecture summary, threat list, risk scores, attack paths, and AISVS coverage.",
            },
            {
              icon: FileCode,
              name: "SARIF",
              desc: "Static Analysis Results Interchange Format (v2.1.0). Integrates with GitHub Security, Azure DevOps, and other SAST tools.",
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

        {/* 8. Import */}
        <SectionHeading id="import">8. Import</SectionHeading>
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

        {/* 9. Keyboard Shortcuts */}
        <SectionHeading id="shortcuts">9. Keyboard Shortcuts</SectionHeading>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border rounded-lg">
            <thead>
              <tr className="bg-accent/30">
                <th className="text-left p-2 font-semibold w-48">Shortcut</th>
                <th className="text-left p-2 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {KEYBOARD_SHORTCUTS.map((s) => (
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

        {/* 10. Tips & Best Practices */}
        <SectionHeading id="tips">10. Tips & Best Practices</SectionHeading>
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
              <Save className="h-4 w-4 text-primary" /> Save Regularly
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              The tool auto-saves every 30 seconds, but use{" "}
              <code className="px-1 bg-muted rounded text-[11px]">Ctrl+S</code> or the Save Model
              button to create named snapshots you can return to later.
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
              <Grid3x3 className="h-4 w-4 text-primary" /> Name Components Descriptively
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Double-click any component to edit its name and properties. Descriptive names make
              your threat model readable and your exported reports more useful.
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

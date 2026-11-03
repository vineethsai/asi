import {
  type ArchitectureTemplate,
  type CanvasEdge,
  type CanvasEdgeData,
  type CanvasNode,
  type CanvasNodeData,
  DEFAULT_EDGE_METADATA,
  MaestroLayer,
} from "./types";

/**
 * Architecture templates (P0-13 / P3-37). Every template is laid out on a
 * 260 × 180 px grid (node cards are 160–220 px wide), so no two cards
 * overlap; trust boundaries wrap whole grid cells. The layout test in
 * __tests__/templates.test.ts enforces this.
 */
export const TEMPLATE_GRID = { col: 260, row: 180, nodeWidth: 220, nodeHeight: 120 } as const;
const PAD = 15;
const TOP = 35;

type Cell = [col: number, row: number];

interface NodeSpec {
  key: string;
  at: Cell;
  type: "actor" | "agentComponent" | "dataStore";
  /** Key of the enclosing boundary. */
  in?: string;
  data: Omit<CanvasNodeData, "threats">;
}

interface BoundarySpec {
  key: string;
  label: string;
  from: Cell;
  to: Cell;
}

interface FlowSpec extends Partial<Omit<CanvasEdgeData, "threats">> {
  from: string;
  to: string;
  label: string;
}

const L = MaestroLayer;

function boundaryBox(b: BoundarySpec) {
  return {
    x: b.from[0] * TEMPLATE_GRID.col - PAD,
    y: b.from[1] * TEMPLATE_GRID.row - TOP,
    width: (b.to[0] - b.from[0]) * TEMPLATE_GRID.col + TEMPLATE_GRID.nodeWidth + 2 * PAD,
    height: (b.to[1] - b.from[1]) * TEMPLATE_GRID.row + TEMPLATE_GRID.nodeHeight + TOP + PAD,
  };
}

function template(
  id: string,
  name: string,
  description: string,
  spec: { boundaries?: BoundarySpec[]; nodes: NodeSpec[]; flows: FlowSpec[] },
): ArchitectureTemplate {
  const index = new Map<string, string>();
  const nodes: ArchitectureTemplate["nodes"] = [];
  const boxes = new Map<string, ReturnType<typeof boundaryBox>>();
  for (const b of spec.boundaries ?? []) {
    const box = boundaryBox(b);
    boxes.set(b.key, box);
    index.set(b.key, String(nodes.length));
    nodes.push({
      type: "trustBoundary",
      position: { x: box.x, y: box.y },
      zIndex: -10,
      style: { width: box.width, height: box.height, zIndex: -10 },
      data: {
        label: b.label,
        category: "trust-boundary",
        maestroLayers: [L.SecurityCompliance],
        trustLevel: "trusted",
        threats: [],
      },
    } as ArchitectureTemplate["nodes"][number]);
  }
  for (const n of spec.nodes) {
    const abs = { x: n.at[0] * TEMPLATE_GRID.col, y: n.at[1] * TEMPLATE_GRID.row };
    const parent = n.in ? boxes.get(n.in) : undefined;
    if (n.in && !parent) throw new Error(`template ${id}: unknown boundary ${n.in}`);
    index.set(n.key, String(nodes.length));
    nodes.push({
      type: n.type,
      position: parent ? { x: abs.x - parent.x, y: abs.y - parent.y } : abs,
      ...(n.in ? { parentId: index.get(n.in)! } : {}),
      data: { ...n.data, threats: [] },
    } as ArchitectureTemplate["nodes"][number]);
  }
  const edges: ArchitectureTemplate["edges"] = spec.flows.map((f) => {
    const { from, to, ...meta } = f;
    if (!index.has(from) || !index.has(to))
      throw new Error(`template ${id}: bad flow ${from}→${to}`);
    return {
      source: index.get(from)!,
      target: index.get(to)!,
      type: "dataFlow",
      data: { ...DEFAULT_EDGE_METADATA, ...meta, threats: [] },
    } as ArchitectureTemplate["edges"][number];
  });
  return { id, name, description, nodes, edges };
}

// ─── Reusable node data ─────────────────────────────────────────

const user = (label = "User"): NodeSpec["data"] => ({
  label,
  category: "actor",
  maestroLayers: [L.AgentEcosystem],
  trustLevel: "untrusted",
});
const external = (
  label: string,
  trustLevel: CanvasNodeData["trustLevel"] = "untrusted",
): NodeSpec["data"] => ({
  label,
  category: "external",
  maestroLayers: [L.AgentEcosystem],
  trustLevel,
});
const llm = (label = "LLM", description = "Foundation model"): NodeSpec["data"] => ({
  label,
  description,
  category: "kc1",
  componentId: "kc1",
  maestroLayers: [L.FoundationModels],
  trustLevel: "semi-trusted",
});
const agent = (
  label: string,
  description: string,
  extra: Partial<NodeSpec["data"]> = {},
): NodeSpec["data"] => ({
  label,
  description,
  category: "kc2",
  componentId: "kc2",
  maestroLayers: [L.AgentFrameworks],
  trustLevel: "semi-trusted",
  ...extra,
});

// ─── Templates ──────────────────────────────────────────────────

export const ARCHITECTURE_TEMPLATES: ArchitectureTemplate[] = [
  template(
    "rag-pipeline",
    "RAG Pipeline",
    "Retrieval-Augmented Generation pipeline with user, LLM, vector store, and external data source.",
    {
      nodes: [
        { key: "user", at: [0, 0], type: "actor", data: user() },
        { key: "src", at: [1, 0], type: "actor", data: external("External Data Source") },
        {
          key: "llm",
          at: [0, 1],
          type: "agentComponent",
          data: llm("LLM / Foundation Model", "Core language model for generation"),
        },
        {
          key: "vs",
          at: [1, 1],
          type: "dataStore",
          data: {
            label: "Vector Store",
            description: "Embeddings database for retrieval",
            category: "kc4",
            componentId: "kc4.3",
            maestroLayers: [L.DataOperations],
            trustLevel: "trusted",
          },
        },
      ],
      flows: [
        {
          from: "user",
          to: "llm",
          label: "User Query",
          encrypted: true,
          authentication: "OAuth2",
          containsPII: true,
        },
        { from: "llm", to: "vs", label: "Embedding Query", encrypted: true },
        {
          from: "src",
          to: "vs",
          label: "Data Ingestion",
          encrypted: false,
          authentication: "None",
        },
        { from: "vs", to: "llm", label: "Retrieved Context", encrypted: true },
      ],
    },
  ),
  template(
    "multi-agent",
    "Hierarchical Multi-Agent",
    "Orchestrator delegating to a research agent (web search) and a coding agent (code execution).",
    {
      nodes: [
        { key: "user", at: [1, 0], type: "actor", data: user() },
        {
          key: "orch",
          at: [1, 1],
          type: "agentComponent",
          data: agent("Orchestrator Agent", "Plans and delegates tasks", {
            componentId: "kc2.2",
            maestroLayers: [L.AgentFrameworks, L.AgentEcosystem],
          }),
        },
        {
          key: "research",
          at: [0, 2],
          type: "agentComponent",
          data: agent("Research Agent", "Gathers information"),
        },
        {
          key: "coding",
          at: [2, 2],
          type: "agentComponent",
          data: agent("Coding Agent", "Writes and runs code"),
        },
        {
          key: "search",
          at: [0, 3],
          type: "agentComponent",
          data: {
            label: "Web Search Tool",
            description: "Returns untrusted web content",
            category: "kc5",
            componentId: "kc5.ro.3",
            maestroLayers: [L.AgentFrameworks],
            trustLevel: "untrusted",
            toolAccessMode: "read-only",
            toolRiskTier: "benign",
          },
        },
        {
          key: "exec",
          at: [2, 3],
          type: "agentComponent",
          data: {
            label: "Code Executor",
            description: "Executes generated code",
            category: "kc5",
            componentId: "kc5.ex.1",
            maestroLayers: [L.AgentFrameworks, L.DeploymentInfrastructure],
            trustLevel: "semi-trusted",
            toolAccessMode: "execute",
            toolRiskTier: "destructive",
          },
        },
      ],
      flows: [
        {
          from: "user",
          to: "orch",
          label: "User Request",
          encrypted: true,
          authentication: "OAuth2",
          containsPII: true,
        },
        { from: "orch", to: "research", label: "Research Task", encrypted: true },
        { from: "orch", to: "coding", label: "Coding Task", encrypted: true },
        {
          from: "research",
          to: "search",
          label: "Search Query",
          encrypted: true,
          authentication: "API Key",
        },
        { from: "coding", to: "exec", label: "Code to Execute", encrypted: true },
      ],
    },
  ),
  template("simple-agent", "Simple Agent", "A single agent with memory and an LLM.", {
    nodes: [
      { key: "user", at: [0, 0], type: "actor", data: user() },
      {
        key: "agent",
        at: [0, 1],
        type: "agentComponent",
        data: agent("Agent", "Single autonomous agent"),
      },
      {
        key: "mem",
        at: [1, 1],
        type: "dataStore",
        data: {
          label: "Memory Store",
          description: "Conversation and long-term memory",
          category: "kc4",
          componentId: "kc4",
          maestroLayers: [L.DataOperations],
          trustLevel: "trusted",
        },
      },
      { key: "llm", at: [0, 2], type: "agentComponent", data: llm() },
    ],
    flows: [
      { from: "user", to: "agent", label: "User Message", encrypted: true, containsPII: true },
      { from: "agent", to: "mem", label: "Store Memory", encrypted: true },
      { from: "agent", to: "llm", label: "LLM Call", encrypted: true },
    ],
  }),
  template(
    "sequential-pipeline",
    "Sequential Pipeline",
    "Input validation, processing agent and an output guard in a fixed sequence.",
    {
      nodes: [
        { key: "user", at: [0, 0], type: "actor", data: user() },
        {
          key: "validator",
          at: [1, 0],
          type: "agentComponent",
          data: {
            label: "Input Validator",
            description: "Validates and filters input",
            category: "kc3",
            componentId: "kc3.4",
            maestroLayers: [L.AgentFrameworks, L.SecurityCompliance],
            trustLevel: "semi-trusted",
            semantics: { kind: "guardrail", guardrail: { coverage: ["input"] } },
          },
        },
        {
          key: "agent",
          at: [2, 0],
          type: "agentComponent",
          data: agent("Processing Agent", "Processes validated input"),
        },
        {
          key: "guard",
          at: [3, 0],
          type: "agentComponent",
          data: {
            label: "Output Guard",
            description: "Filters output before it is returned",
            category: "kc3",
            componentId: "kc3.4",
            maestroLayers: [L.AgentFrameworks, L.SecurityCompliance],
            trustLevel: "trusted",
            semantics: { kind: "guardrail", guardrail: { coverage: ["output"] } },
          },
        },
        { key: "llm", at: [2, 1], type: "agentComponent", data: llm() },
      ],
      flows: [
        {
          from: "user",
          to: "validator",
          label: "Raw Input",
          encrypted: true,
          authentication: "OAuth2",
          containsPII: true,
        },
        { from: "validator", to: "agent", label: "Validated Input", encrypted: true },
        { from: "agent", to: "llm", label: "LLM Request", encrypted: true },
        { from: "agent", to: "guard", label: "Processed Output", encrypted: true },
        { from: "guard", to: "user", label: "Final Response", encrypted: true },
      ],
    },
  ),
  template(
    "collaborative-swarm",
    "Collaborative Swarm",
    "Peer agents collaborating over mTLS and sharing a knowledge base.",
    {
      nodes: [
        { key: "user", at: [1, 0], type: "actor", data: user() },
        {
          key: "alpha",
          at: [0, 1],
          type: "agentComponent",
          data: agent("Agent Alpha", "Swarm member", {
            maestroLayers: [L.AgentFrameworks, L.AgentEcosystem],
          }),
        },
        {
          key: "gamma",
          at: [1, 1],
          type: "agentComponent",
          data: agent("Agent Gamma", "Swarm entry agent", {
            maestroLayers: [L.AgentFrameworks, L.AgentEcosystem],
          }),
        },
        {
          key: "beta",
          at: [2, 1],
          type: "agentComponent",
          data: agent("Agent Beta", "Swarm member", {
            maestroLayers: [L.AgentFrameworks, L.AgentEcosystem],
          }),
        },
        {
          key: "kb",
          at: [1, 2],
          type: "dataStore",
          data: {
            label: "Shared Knowledge Base",
            description: "Shared state for all agents",
            category: "kc4",
            componentId: "kc4.5",
            maestroLayers: [L.DataOperations],
            trustLevel: "trusted",
          },
        },
      ],
      flows: [
        { from: "user", to: "gamma", label: "User Task", encrypted: true, containsPII: true },
        { from: "alpha", to: "beta", label: "Agent Comm", encrypted: true, authentication: "mTLS" },
        { from: "beta", to: "gamma", label: "Agent Comm", encrypted: true, authentication: "mTLS" },
        {
          from: "gamma",
          to: "alpha",
          label: "Agent Comm",
          encrypted: true,
          authentication: "mTLS",
        },
        { from: "alpha", to: "kb", label: "Store Results", encrypted: true },
        { from: "beta", to: "kb", label: "Store Results", encrypted: true },
        { from: "gamma", to: "kb", label: "Store Results", encrypted: true },
      ],
    },
  ),
  template(
    "reactive-agent",
    "Reactive Agent",
    "Event-driven agent that decides with an LLM, acts through a tool and logs events.",
    {
      nodes: [
        { key: "events", at: [0, 0], type: "actor", data: external("Event Source") },
        {
          key: "agent",
          at: [1, 0],
          type: "agentComponent",
          data: agent("Reactive Agent", "Responds to events"),
        },
        {
          key: "tool",
          at: [2, 0],
          type: "agentComponent",
          data: {
            label: "Action Tool",
            description: "Performs actions in business systems",
            category: "kc5",
            componentId: "kc5.rw.3",
            maestroLayers: [L.AgentFrameworks],
            trustLevel: "semi-trusted",
            toolAccessMode: "read-write",
            toolRiskTier: "sensitive",
          },
        },
        { key: "llm", at: [1, 1], type: "agentComponent", data: llm() },
        {
          key: "log",
          at: [2, 1],
          type: "dataStore",
          data: {
            label: "Event Log",
            description: "Audit trail of events and actions",
            category: "kc4",
            componentId: "kc4",
            maestroLayers: [L.DataOperations, L.EvaluationObservability],
            trustLevel: "trusted",
          },
        },
      ],
      flows: [
        {
          from: "events",
          to: "agent",
          label: "Event Trigger",
          encrypted: true,
          authentication: "API Key",
        },
        { from: "agent", to: "llm", label: "Decision Request", encrypted: true },
        { from: "agent", to: "tool", label: "Execute Action", encrypted: true },
        { from: "agent", to: "log", label: "Log Event", encrypted: true },
      ],
    },
  ),
  template(
    "knowledge-intensive",
    "Knowledge-Intensive Agent",
    "Agent combining vector search, a knowledge graph and external APIs.",
    {
      nodes: [
        { key: "user", at: [1, 0], type: "actor", data: user() },
        {
          key: "agent",
          at: [1, 1],
          type: "agentComponent",
          data: agent("Knowledge Agent", "Answers from curated knowledge"),
        },
        { key: "apis", at: [2, 1], type: "actor", data: external("External APIs") },
        { key: "llm", at: [1, 2], type: "agentComponent", data: llm() },
        {
          key: "vdb",
          at: [0, 2],
          type: "dataStore",
          data: {
            label: "Vector DB",
            description: "Semantic search index",
            category: "kc4",
            componentId: "kc4.3",
            maestroLayers: [L.DataOperations],
            trustLevel: "trusted",
          },
        },
        {
          key: "kg",
          at: [2, 2],
          type: "dataStore",
          data: {
            label: "Knowledge Graph",
            description: "Structured knowledge",
            category: "kc4",
            componentId: "kc4.5",
            maestroLayers: [L.DataOperations],
            trustLevel: "trusted",
          },
        },
      ],
      flows: [
        {
          from: "user",
          to: "agent",
          label: "Query",
          encrypted: true,
          authentication: "OAuth2",
          containsPII: true,
        },
        { from: "agent", to: "llm", label: "LLM Call", encrypted: true },
        { from: "agent", to: "vdb", label: "Vector Search", encrypted: true },
        { from: "agent", to: "kg", label: "Graph Query", encrypted: true },
        {
          from: "agent",
          to: "apis",
          label: "API Call",
          encrypted: true,
          authentication: "API Key",
        },
      ],
    },
  ),
  template(
    "mcp-coding-agent",
    "MCP-connected Coding Agent",
    "IDE coding agent using a local filesystem MCP server, a remote GitHub MCP server behind an approval prompt, a community MCP server and a code sandbox.",
    {
      boundaries: [
        { key: "ws", label: "Developer workstation", from: [0, 1], to: [1, 2] },
        { key: "cloud", label: "Cloud services", from: [2, 1], to: [3, 2] },
      ],
      nodes: [
        {
          key: "dev",
          at: [0, 0],
          type: "actor",
          data: { ...user("Developer"), trustLevel: "semi-trusted" },
        },
        {
          key: "agent",
          at: [0, 1],
          in: "ws",
          type: "agentComponent",
          data: agent("IDE Coding Agent", "Plans changes and calls MCP tools"),
        },
        {
          key: "fs",
          at: [1, 1],
          in: "ws",
          type: "agentComponent",
          data: {
            label: "Filesystem MCP Server",
            description: "Local stdio server exposing the repository",
            category: "kc5",
            componentId: "kc5.3",
            maestroLayers: [L.AgentFrameworks, L.AgentEcosystem],
            trustLevel: "trusted",
            toolAccessMode: "read-write",
            toolRiskTier: "sensitive",
            semantics: {
              kind: "mcp-server",
              mcp: {
                transport: "stdio",
                auth: "none",
                toolsExposed: ["read_file", "write_file", "list_directory"],
                provenance: { signed: true, pinned: true },
              },
            },
          },
        },
        {
          key: "sandbox",
          at: [0, 2],
          in: "ws",
          type: "agentComponent",
          data: {
            label: "Code Sandbox",
            description: "Runs tests in a container",
            category: "kc5",
            componentId: "kc5.ex.3",
            maestroLayers: [L.AgentFrameworks, L.DeploymentInfrastructure],
            trustLevel: "semi-trusted",
            toolAccessMode: "execute",
            toolRiskTier: "sensitive",
          },
        },
        {
          key: "approve",
          at: [1, 2],
          in: "ws",
          type: "agentComponent",
          data: {
            label: "Push Approval",
            description: "Developer confirms every push / PR",
            category: "kc6",
            componentId: "kc6",
            maestroLayers: [L.SecurityCompliance],
            trustLevel: "trusted",
            semantics: { kind: "hitl-gate", hitl: {} },
          },
        },
        {
          key: "llm",
          at: [2, 1],
          in: "cloud",
          type: "agentComponent",
          data: llm("LLM API", "Hosted code model"),
        },
        {
          key: "gh",
          at: [3, 2],
          in: "cloud",
          type: "agentComponent",
          data: {
            label: "GitHub MCP Server",
            description: "Remote server: branches, pushes, pull requests",
            category: "kc5",
            componentId: "kc5.3",
            maestroLayers: [L.AgentFrameworks, L.AgentEcosystem],
            trustLevel: "semi-trusted",
            toolAccessMode: "read-write",
            toolRiskTier: "destructive",
            semantics: {
              kind: "mcp-server",
              mcp: {
                transport: "http",
                auth: "oauth2",
                toolsExposed: ["create_branch", "push_files", "create_pull_request"],
                provenance: { signed: true, pinned: true },
              },
            },
          },
        },
        {
          key: "community",
          at: [3, 0],
          type: "agentComponent",
          data: {
            label: "Community MCP Server",
            description: "Third-party server installed from a registry",
            category: "kc5",
            componentId: "kc5.3",
            maestroLayers: [L.AgentFrameworks, L.AgentEcosystem],
            trustLevel: "untrusted",
            semantics: {
              kind: "mcp-server",
              mcp: {
                transport: "sse",
                auth: "none",
                toolsExposed: [],
                provenance: { signed: false, pinned: false },
              },
            },
          },
        },
      ],
      flows: [
        {
          from: "dev",
          to: "agent",
          label: "Task Prompt",
          encrypted: true,
          authentication: "OS Session",
        },
        {
          from: "agent",
          to: "llm",
          label: "Completion Request",
          encrypted: true,
          authentication: "API Key",
        },
        {
          from: "agent",
          to: "fs",
          label: "File Tools",
          protocol: "stdio",
          encrypted: true,
          authentication: "Process",
        },
        {
          from: "agent",
          to: "sandbox",
          label: "Run Tests",
          encrypted: true,
          authentication: "Process",
        },
        {
          from: "agent",
          to: "approve",
          label: "Proposed Push",
          encrypted: true,
          authentication: "OS Session",
        },
        {
          from: "approve",
          to: "gh",
          label: "Approved Push / PR",
          encrypted: true,
          authentication: "OAuth2",
        },
        {
          from: "agent",
          to: "community",
          label: "Tool Calls",
          protocol: "SSE",
          encrypted: true,
          authentication: "None",
        },
      ],
    },
  ),
  template(
    "support-rag-hitl",
    "Customer-Support Agent (RAG + HITL)",
    "Support agent behind an input/output guardrail, answering from a knowledge base, with per-user memory, an audit log and human approval for refunds.",
    {
      boundaries: [
        { key: "platform", label: "Support platform", from: [0, 1], to: [2, 2] },
        { key: "model", label: "Model provider", from: [3, 1], to: [3, 1] },
        { key: "biz", label: "Business systems", from: [3, 2], to: [3, 2] },
      ],
      nodes: [
        { key: "customer", at: [0, 0], type: "actor", data: user("Customer") },
        {
          key: "cms",
          at: [2, 0],
          type: "actor",
          data: external("Help Center CMS", "semi-trusted"),
        },
        {
          key: "guard",
          at: [0, 1],
          in: "platform",
          type: "agentComponent",
          data: {
            label: "Guardrail",
            description: "Prompt-injection and PII filter on input and output",
            category: "kc3",
            componentId: "kc3.4",
            maestroLayers: [L.SecurityCompliance, L.AgentFrameworks],
            trustLevel: "trusted",
            semantics: { kind: "guardrail", guardrail: { coverage: ["input", "output"] } },
          },
        },
        {
          key: "agent",
          at: [1, 1],
          in: "platform",
          type: "agentComponent",
          data: agent("Support Agent", "Answers tickets"),
        },
        {
          key: "kb",
          at: [2, 1],
          in: "platform",
          type: "dataStore",
          data: {
            label: "Knowledge Base",
            description: "Vector index of help-center articles",
            category: "kc4",
            componentId: "kc4.3",
            maestroLayers: [L.DataOperations],
            trustLevel: "trusted",
            semantics: {
              kind: "memory",
              memory: {
                kind: "vector",
                retention: "months",
                perUserIsolation: true,
                writeAccess: [],
              },
            },
          },
        },
        {
          key: "audit",
          at: [0, 2],
          in: "platform",
          type: "agentComponent",
          data: {
            label: "Audit Log",
            description: "Immutable trace of conversations and actions",
            category: "kc6",
            componentId: "kc6",
            maestroLayers: [L.EvaluationObservability],
            trustLevel: "trusted",
            semantics: { kind: "observability", observability: { covers: [], immutable: true } },
          },
        },
        {
          key: "mem",
          at: [1, 2],
          in: "platform",
          type: "dataStore",
          data: {
            label: "Conversation Memory",
            description: "Per-customer session state",
            category: "kc4",
            componentId: "kc4",
            maestroLayers: [L.DataOperations],
            trustLevel: "trusted",
            dataSensitivity: "pii",
            semantics: {
              kind: "memory",
              memory: {
                kind: "session",
                retention: "days",
                perUserIsolation: true,
                writeAccess: [],
              },
            },
          },
        },
        {
          key: "approve",
          at: [2, 2],
          in: "platform",
          type: "agentComponent",
          data: {
            label: "Refund Approval",
            description: "Support lead approves refunds",
            category: "kc6",
            componentId: "kc6",
            maestroLayers: [L.SecurityCompliance],
            trustLevel: "trusted",
            semantics: { kind: "hitl-gate", hitl: {} },
          },
        },
        {
          key: "llm",
          at: [3, 1],
          in: "model",
          type: "agentComponent",
          data: llm("LLM", "Hosted chat model"),
        },
        {
          key: "crm",
          at: [3, 2],
          in: "biz",
          type: "agentComponent",
          data: {
            label: "CRM / Refund API",
            description: "Customer records and refunds",
            category: "kc5",
            componentId: "kc5.rw.3",
            maestroLayers: [L.AgentFrameworks],
            trustLevel: "trusted",
            toolAccessMode: "read-write",
            toolRiskTier: "sensitive",
            dataSensitivity: "pii",
            semantics: {
              kind: "scoped-tool",
              tool: {
                scopes: ["refund:create", "customer:read"],
                allowList: ["refund<=100"],
                rateLimit: 10,
              },
            },
          },
        },
      ],
      flows: [
        {
          from: "customer",
          to: "guard",
          label: "Chat Message",
          encrypted: true,
          authentication: "OAuth2",
          containsPII: true,
        },
        {
          from: "guard",
          to: "agent",
          label: "Filtered Message",
          encrypted: true,
          authentication: "mTLS",
        },
        {
          from: "agent",
          to: "llm",
          label: "Completion",
          encrypted: true,
          authentication: "API Key",
        },
        {
          from: "agent",
          to: "kb",
          label: "Retrieve Articles",
          encrypted: true,
          authentication: "mTLS",
        },
        {
          from: "cms",
          to: "kb",
          label: "Article Sync",
          encrypted: true,
          authentication: "API Key",
        },
        {
          from: "agent",
          to: "mem",
          label: "Conversation State",
          encrypted: true,
          authentication: "mTLS",
          containsPII: true,
        },
        {
          from: "agent",
          to: "approve",
          label: "Refund Request",
          encrypted: true,
          authentication: "mTLS",
        },
        {
          from: "approve",
          to: "crm",
          label: "Approved Refund",
          encrypted: true,
          authentication: "OAuth2",
          containsPII: true,
        },
        { from: "agent", to: "audit", label: "Traces", encrypted: true, authentication: "mTLS" },
      ],
    },
  ),
  template(
    "research-swarm-a2a",
    "Multi-Agent Research Swarm (A2A)",
    "Coordinator delegating over A2A to internal research and analysis agents and to a partner organisation's agent, with shared memory and tracing.",
    {
      boundaries: [
        { key: "platform", label: "Research platform", from: [0, 1], to: [2, 3] },
        { key: "model", label: "Model provider", from: [3, 2], to: [3, 2] },
      ],
      nodes: [
        { key: "user", at: [1, 0], type: "actor", data: user("Researcher") },
        {
          key: "partner",
          at: [3, 1],
          type: "agentComponent",
          data: {
            label: "Partner Org Agent",
            description: "External agent reached over A2A",
            category: "kc2",
            componentId: "kc2",
            maestroLayers: [L.AgentEcosystem],
            trustLevel: "untrusted",
            semantics: {
              kind: "a2a-peer",
              a2a: { mutualAuth: false, messageSigning: false, schemaValidation: false },
            },
          },
        },
        {
          key: "coord",
          at: [1, 1],
          in: "platform",
          type: "agentComponent",
          data: agent("Coordinator", "Splits the question and merges results", {
            componentId: "kc2.2",
            maestroLayers: [L.AgentFrameworks, L.AgentEcosystem],
          }),
        },
        {
          key: "web",
          at: [0, 2],
          in: "platform",
          type: "agentComponent",
          data: agent("Web Research Agent", "Searches and reads the web", {
            semantics: {
              kind: "agent",
              a2a: { mutualAuth: true, messageSigning: true, schemaValidation: true },
            },
          }),
        },
        {
          key: "analysis",
          at: [2, 2],
          in: "platform",
          type: "agentComponent",
          data: agent("Analysis Agent", "Synthesises findings", {
            semantics: {
              kind: "agent",
              a2a: { mutualAuth: true, messageSigning: true, schemaValidation: true },
            },
          }),
        },
        {
          key: "trace",
          at: [0, 3],
          in: "platform",
          type: "agentComponent",
          data: {
            label: "Trace Collector",
            description: "Distributed traces of every agent step",
            category: "kc6",
            componentId: "kc6",
            maestroLayers: [L.EvaluationObservability],
            trustLevel: "trusted",
            semantics: { kind: "observability", observability: { covers: [], immutable: false } },
          },
        },
        {
          key: "mem",
          at: [1, 3],
          in: "platform",
          type: "dataStore",
          data: {
            label: "Shared Memory",
            description: "Findings shared by all agents",
            category: "kc4",
            componentId: "kc4.5",
            maestroLayers: [L.DataOperations],
            trustLevel: "trusted",
            semantics: {
              kind: "memory",
              memory: {
                kind: "shared",
                retention: "indefinite",
                perUserIsolation: false,
                writeAccess: [],
              },
            },
          },
        },
        {
          key: "llm",
          at: [3, 2],
          in: "model",
          type: "agentComponent",
          data: llm("LLM", "Hosted reasoning model"),
        },
        { key: "webext", at: [0, 4], type: "actor", data: external("Public Web") },
      ],
      flows: [
        {
          from: "user",
          to: "coord",
          label: "Research Question",
          encrypted: true,
          authentication: "OAuth2",
        },
        { from: "coord", to: "web", label: "A2A Task", encrypted: true, authentication: "mTLS" },
        {
          from: "coord",
          to: "analysis",
          label: "A2A Task",
          encrypted: true,
          authentication: "mTLS",
        },
        {
          from: "coord",
          to: "partner",
          label: "A2A Delegation",
          encrypted: true,
          authentication: "None",
        },
        {
          from: "web",
          to: "webext",
          label: "Search & Fetch",
          encrypted: true,
          authentication: "None",
        },
        {
          from: "web",
          to: "mem",
          label: "Write Findings",
          encrypted: true,
          authentication: "mTLS",
        },
        {
          from: "analysis",
          to: "mem",
          label: "Read Findings",
          encrypted: true,
          authentication: "mTLS",
        },
        { from: "coord", to: "llm", label: "Planning", encrypted: true, authentication: "API Key" },
        {
          from: "analysis",
          to: "llm",
          label: "Completion",
          encrypted: true,
          authentication: "API Key",
        },
        { from: "coord", to: "trace", label: "Traces", encrypted: true, authentication: "mTLS" },
        { from: "web", to: "trace", label: "Traces", encrypted: true, authentication: "mTLS" },
        { from: "analysis", to: "trace", label: "Traces", encrypted: true, authentication: "mTLS" },
      ],
    },
  ),
];

/** Every architecturesData id → the template that models it (P3-37). */
export const ARCHITECTURE_TEMPLATE_MAP: Record<string, string> = {
  sequential: "sequential-pipeline",
  hierarchical: "multi-agent",
  collaborative: "collaborative-swarm",
  reactive: "reactive-agent",
  knowledge_intensive: "knowledge-intensive",
};

/** Accepts a template id or an architecture id; undefined when neither is known. */
export function resolveTemplateId(id: string | null | undefined): string | undefined {
  if (!id) return undefined;
  if (ARCHITECTURE_TEMPLATES.some((t) => t.id === id)) return id;
  return ARCHITECTURE_TEMPLATE_MAP[id];
}

/**
 * Concrete nodes/edges for a template: stable ids `template-<id>-<i>` /
 * `template-edge-<id>-<i>`, parent ids resolved, boundaries first.
 */
export function instantiateTemplate(t: ArchitectureTemplate): {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
} {
  const nid = (i: string) => `template-${t.id}-${i}`;
  const nodes = t.nodes.map((n, i) => {
    const node = { ...n, id: nid(String(i)), data: { ...n.data, threats: [] } } as CanvasNode;
    if (n.parentId) node.parentId = nid(n.parentId);
    return node;
  });
  const edges = t.edges.map(
    (e, i) =>
      ({
        ...e,
        id: `template-edge-${t.id}-${i}`,
        source: nid((e as { source: string }).source),
        target: nid((e as { target: string }).target),
        data: { ...(e.data as CanvasEdgeData), threats: [] },
      }) as CanvasEdge,
  );
  return { nodes, edges };
}

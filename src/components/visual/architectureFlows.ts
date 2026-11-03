/**
 * Read-only flow definitions for the five reference architecture diagrams
 * (ArchitectureFlowDiagram, AttackPathPlayer, attack-path builder). React-free so tests and
 * non-visual code can import it without pulling in React Flow.
 *
 * Node `category` is a KC id ("kc1"…"kc6") for system components, "actor" for the human
 * entry point and "external" for outside systems/event sources.
 */

export type FlowNodeType = "agentComponent" | "actor" | "dataStore";

export interface FlowNodeDef {
  id: string;
  type: FlowNodeType;
  position: { x: number; y: number };
  data: { label: string; category: string };
}

export interface FlowEdgeDef {
  id: string;
  source: string;
  target: string;
  type: "dataFlow";
  data: { label: string };
}

export interface FlowDef {
  nodes: FlowNodeDef[];
  edges: FlowEdgeDef[];
}

function n(
  id: string,
  type: FlowNodeType,
  x: number,
  y: number,
  label: string,
  category: string,
): FlowNodeDef {
  return { id, type, position: { x, y }, data: { label, category } };
}

function e(id: string, source: string, target: string, label: string): FlowEdgeDef {
  return { id, source, target, type: "dataFlow", data: { label } };
}

export const ARCHITECTURE_FLOWS: Readonly<Record<string, FlowDef>> = {
  sequential: {
    nodes: [
      n("0", "actor", 0, 55, "User", "actor"),
      n("1", "agentComponent", 140, 50, "Input Guard", "kc3"),
      n("2", "agentComponent", 300, 50, "LLM Core", "kc1"),
      n("3", "dataStore", 460, 45, "Memory", "kc4"),
      n("4", "agentComponent", 610, 50, "Output Guard", "kc3"),
      n("5", "actor", 770, 55, "Output", "external"),
    ],
    edges: [
      e("e01", "0", "1", "Raw Input"),
      e("e12", "1", "2", "Validated"),
      e("e23", "2", "3", "Context"),
      e("e34", "3", "4", "Response"),
      e("e45", "4", "5", "Safe Output"),
    ],
  },

  hierarchical: {
    nodes: [
      n("0", "actor", 240, 0, "User", "actor"),
      n("1", "agentComponent", 210, 110, "Orchestrator", "kc2"),
      n("2", "agentComponent", 20, 240, "Research Agent", "kc2"),
      n("3", "agentComponent", 210, 240, "Coding Agent", "kc2"),
      n("4", "agentComponent", 400, 240, "Analysis Agent", "kc2"),
      n("5", "agentComponent", 20, 360, "Web Search", "kc5"),
      n("6", "agentComponent", 210, 360, "Code Sandbox", "kc6"),
      n("7", "agentComponent", 400, 360, "LLM", "kc1"),
    ],
    edges: [
      e("e01", "0", "1", "Request"),
      e("e12", "1", "2", "Research"),
      e("e13", "1", "3", "Code"),
      e("e14", "1", "4", "Analyze"),
      e("e25", "2", "5", "Search"),
      e("e36", "3", "6", "Execute"),
      e("e47", "4", "7", "LLM Call"),
    ],
  },

  collaborative: {
    nodes: [
      n("0", "actor", 210, 0, "User", "actor"),
      n("1", "agentComponent", 20, 130, "Agent Alpha", "kc2"),
      n("2", "agentComponent", 200, 130, "Agent Beta", "kc2"),
      n("3", "agentComponent", 380, 130, "Agent Gamma", "kc2"),
      n("4", "dataStore", 160, 280, "Shared Knowledge", "kc4"),
      n("5", "agentComponent", 200, 390, "LLM", "kc1"),
    ],
    edges: [
      e("e02", "0", "2", "Task"),
      e("e12", "1", "2", "Peer Comm"),
      e("e23", "2", "3", "Peer Comm"),
      e("e31", "3", "1", "Peer Comm"),
      e("e14", "1", "4", "Store"),
      e("e24", "2", "4", "Store"),
      e("e34", "3", "4", "Store"),
      e("e45", "4", "5", "LLM Call"),
    ],
  },

  reactive: {
    nodes: [
      n("0", "actor", 0, 90, "Event Source", "external"),
      n("1", "agentComponent", 170, 85, "Reactive Agent", "kc2"),
      n("2", "agentComponent", 170, 220, "LLM", "kc1"),
      n("3", "agentComponent", 380, 30, "Action Tool", "kc5"),
      n("4", "dataStore", 380, 140, "Event Log", "kc4"),
      n("5", "agentComponent", 380, 260, "Feedback", "kc3"),
    ],
    edges: [
      e("e01", "0", "1", "Trigger"),
      e("e12", "1", "2", "Decide"),
      e("e13", "1", "3", "Act"),
      e("e14", "1", "4", "Log"),
      e("e45", "4", "5", "Analyze"),
      e("e51", "5", "1", "Adapt"),
    ],
  },

  knowledge_intensive: {
    nodes: [
      n("0", "actor", 210, 0, "User", "actor"),
      n("1", "agentComponent", 180, 120, "Knowledge Agent", "kc2"),
      n("2", "agentComponent", 180, 260, "LLM", "kc1"),
      n("3", "dataStore", 0, 260, "Vector DB", "kc4"),
      n("4", "dataStore", 360, 260, "Knowledge Graph", "kc4"),
      n("5", "actor", 400, 120, "External APIs", "external"),
      n("6", "dataStore", 0, 120, "Doc Store", "kc4"),
    ],
    edges: [
      e("e01", "0", "1", "Query"),
      e("e12", "1", "2", "LLM Call"),
      e("e13", "1", "3", "Search"),
      e("e14", "1", "4", "Graph Query"),
      e("e15", "1", "5", "API Call"),
      e("e16", "1", "6", "Retrieve"),
    ],
  },
};

export function getArchitectureFlow(architectureId: string): FlowDef | undefined {
  return ARCHITECTURE_FLOWS[architectureId];
}

/** True for KC component categories ("kc1"…"kc6"). */
export function isKcCategory(category: string): boolean {
  return /^kc[1-6]$/.test(category);
}

/**
 * The node where outside input enters: an actor/external node with outgoing flows and no
 * incoming ones (the human "User" when present), else the first node.
 */
export function flowEntryNode(flow: FlowDef): FlowNodeDef | undefined {
  const incoming = new Set(flow.edges.map((x) => x.target));
  const outgoing = new Set(flow.edges.map((x) => x.source));
  const candidates = flow.nodes.filter(
    (node) => node.type === "actor" && outgoing.has(node.id) && !incoming.has(node.id),
  );
  return candidates.find((c) => c.data.category === "actor") ?? candidates[0] ?? flow.nodes[0];
}

/**
 * Plain-text alternative for a diagram: "6 elements (User, Input Guard, …). Flows: User → Input
 * Guard (Raw Input); …". Used next to `aria-hidden` thumbnails.
 */
export function describeArchitectureFlow(architectureId: string): string {
  const flow = ARCHITECTURE_FLOWS[architectureId];
  if (!flow) return "No diagram available.";
  const label = new Map(flow.nodes.map((node) => [node.id, node.data.label]));
  const flows = flow.edges
    .map((x) => `${label.get(x.source)} → ${label.get(x.target)} (${x.data.label})`)
    .join("; ");
  return `${flow.nodes.length} elements (${flow.nodes
    .map((node) => node.data.label)
    .join(", ")}). Flows: ${flows}.`;
}

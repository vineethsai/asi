/**
 * Maps a ParseResult (from any parser) into React Flow CanvasNode[] and CanvasEdge[]
 * ready to be placed on the threat modeler canvas.
 */

import type { ParseResult, ParsedComponentType } from "./types";
import {
  type CanvasNode,
  type CanvasEdge,
  type CanvasNodeData,
  type CanvasEdgeData,
  type ComponentCategory,
  type TrustLevel,
  MaestroLayer,
  DEFAULT_EDGE_METADATA,
} from "../types";

// ─── Mapping table ────────────────────────────────────────────────
interface ComponentMapping {
  nodeType: string;
  category: ComponentCategory;
  componentId: string;
  maestroLayers: MaestroLayer[];
  icon: string;
  color: string;
  trustLevel: TrustLevel;
}

const TYPE_MAP: Record<ParsedComponentType, ComponentMapping> = {
  model: {
    nodeType: "agentComponent",
    category: "kc1",
    componentId: "kc1",
    maestroLayers: [MaestroLayer.FoundationModels],
    icon: "brain",
    color: "#3b82f6",
    trustLevel: "trusted",
  },
  embedding: {
    nodeType: "agentComponent",
    category: "kc1",
    componentId: "kc1.2",
    maestroLayers: [MaestroLayer.FoundationModels],
    icon: "brain",
    color: "#3b82f6",
    trustLevel: "trusted",
  },
  agent: {
    nodeType: "agentComponent",
    category: "kc2",
    componentId: "kc2",
    maestroLayers: [MaestroLayer.AgentFrameworks, MaestroLayer.AgentEcosystem],
    icon: "git-branch",
    color: "#22c55e",
    trustLevel: "trusted",
  },
  prompt: {
    nodeType: "agentComponent",
    category: "kc3",
    componentId: "kc3.3",
    maestroLayers: [MaestroLayer.AgentFrameworks],
    icon: "file-text",
    color: "#eab308",
    trustLevel: "trusted",
  },
  guardrail: {
    nodeType: "agentComponent",
    category: "kc3",
    componentId: "kc3.4",
    maestroLayers: [MaestroLayer.SecurityCompliance, MaestroLayer.AgentFrameworks],
    icon: "shield",
    color: "#eab308",
    trustLevel: "trusted",
  },
  memory: {
    nodeType: "dataStore",
    category: "kc4",
    componentId: "kc4",
    maestroLayers: [MaestroLayer.DataOperations],
    icon: "database",
    color: "#a855f7",
    trustLevel: "semi-trusted",
  },
  datastore: {
    nodeType: "dataStore",
    category: "kc4",
    componentId: "kc4.3",
    maestroLayers: [MaestroLayer.DataOperations],
    icon: "database",
    color: "#a855f7",
    trustLevel: "semi-trusted",
  },
  tool: {
    nodeType: "agentComponent",
    category: "kc5",
    componentId: "kc5",
    maestroLayers: [MaestroLayer.AgentFrameworks],
    icon: "wrench",
    color: "#ec4899",
    trustLevel: "semi-trusted",
  },
  mcp: {
    nodeType: "agentComponent",
    category: "kc5",
    componentId: "kc5.3",
    maestroLayers: [MaestroLayer.AgentFrameworks, MaestroLayer.AgentEcosystem],
    icon: "server",
    color: "#ec4899",
    trustLevel: "semi-trusted",
  },
  other: {
    nodeType: "agentComponent",
    category: "custom" as ComponentCategory,
    componentId: "custom",
    maestroLayers: [MaestroLayer.AgentFrameworks],
    icon: "box",
    color: "#6b7280",
    trustLevel: "semi-trusted",
  },
};

let _counter = 0;
function genId(prefix: string) {
  return `${prefix}-${Date.now()}-${_counter++}`;
}

/**
 * Get a human-readable MAESTRO layer label for a component type.
 */
export function getMaestroLabel(type: ParsedComponentType): string {
  const mapping = TYPE_MAP[type];
  if (!mapping) return "L3: Agent Frameworks";
  const primary = mapping.maestroLayers[0];
  const labels: Record<number, string> = {
    1: "L1: Foundation Models",
    2: "L2: Data Operations",
    3: "L3: Agent Frameworks",
    4: "L4: Deployment Infra",
    5: "L5: Eval/Observability",
    6: "L6: Security/Compliance",
    7: "L7: Agent Ecosystem",
  };
  return labels[primary] ?? "L3: Agent Frameworks";
}

/**
 * Convert a ParseResult into canvas-ready nodes and edges.
 */
export function mapToCanvas(
  result: ParseResult,
  options: { addUserActor?: boolean } = {},
): { nodes: CanvasNode[]; edges: CanvasEdge[] } {
  const { addUserActor = true } = options;
  const nodes: CanvasNode[] = [];
  const edges: CanvasEdge[] = [];

  // Map of component name → node id for connection resolution
  const nameToId = new Map<string, string>();

  // Optionally add a User actor as entry point
  if (addUserActor && result.components.length > 0) {
    const userId = genId("import-actor");
    nodes.push({
      id: userId,
      type: "actor",
      position: { x: 0, y: 0 },
      data: {
        label: "User",
        description: "End user or caller",
        category: "actor",
        maestroLayers: [MaestroLayer.AgentEcosystem],
        trustLevel: "untrusted",
        icon: "user",
        color: "#3b82f6",
        threats: [],
      } as CanvasNodeData,
    });
    nameToId.set("__user__", userId);
  }

  // Create a node for each parsed component
  for (const comp of result.components) {
    const mapping = TYPE_MAP[comp.type] ?? TYPE_MAP.other;
    const nodeId = genId("import");
    nameToId.set(comp.name, nodeId);

    const description =
      comp.metadata.description ??
      comp.metadata.modelName ??
      comp.metadata.promptText ??
      `${comp.type} component`;

    nodes.push({
      id: nodeId,
      type: mapping.nodeType,
      position: { x: 0, y: 0 },
      data: {
        label: comp.name,
        description,
        category: mapping.category,
        componentId: mapping.componentId,
        maestroLayers: [...mapping.maestroLayers],
        trustLevel: mapping.trustLevel,
        icon: mapping.icon,
        color: mapping.color,
        threats: [],
        customMetadata: comp.metadata,
      } as CanvasNodeData,
    });
  }

  // Connect user actor to any top-level agents (those that are not targets of other connections)
  if (addUserActor && nameToId.has("__user__")) {
    const targetNames = new Set(result.connections.map((c) => c.target));
    const topAgents = result.components.filter(
      (c) => c.type === "agent" && !targetNames.has(c.name),
    );
    // If no clear top-level agent, connect to the first agent found
    const agentsToConnect =
      topAgents.length > 0
        ? topAgents
        : result.components.filter((c) => c.type === "agent").slice(0, 1);

    for (const agent of agentsToConnect) {
      const agentNodeId = nameToId.get(agent.name);
      if (agentNodeId) {
        edges.push({
          id: genId("import-edge"),
          source: nameToId.get("__user__")!,
          target: agentNodeId,
          type: "dataFlow",
          data: {
            ...DEFAULT_EDGE_METADATA,
            label: "User Request",
            threats: [],
          } as CanvasEdgeData,
        });
      }
    }
  }

  // Create edges from parsed connections
  for (const conn of result.connections) {
    const sourceId = nameToId.get(conn.source);
    const targetId = nameToId.get(conn.target);
    if (!sourceId || !targetId) continue;

    edges.push({
      id: genId("import-edge"),
      source: sourceId,
      target: targetId,
      type: "dataFlow",
      data: {
        ...DEFAULT_EDGE_METADATA,
        label: formatLabel(conn.label),
        threats: [],
      } as CanvasEdgeData,
    });
  }

  return { nodes, edges };
}

/**
 * Convert AIBOM relationship labels to human-friendly labels.
 */
function formatLabel(raw: string): string {
  const map: Record<string, string> = {
    USES_TOOL: "Uses Tool",
    USES_LLM: "Uses LLM",
    USES_MODEL: "Uses Model",
    USES_EMBEDDING: "Uses Embedding",
    USES_MEMORY: "Uses Memory",
    USES_PROMPT: "Uses Prompt",
    RELATED: "Related",
    CALLS: "Calls",
    ORCHESTRATES: "Orchestrates",
  };
  return map[raw] ?? raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

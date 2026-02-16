import type { CanvasNode, CanvasEdge, GeneratedThreat } from "../types";

export function runConnectionAnalysis(nodes: CanvasNode[], edges: CanvasEdge[]): GeneratedThreat[] {
  const threats: GeneratedThreat[] = [];
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  for (const edge of edges) {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);
    if (!source?.data || !target?.data) continue;
    const srcCat = source.data.category;
    const tgtCat = target.data.category;
    if (srcCat === "actor" && (tgtCat === "kc1" || tgtCat === "kc2" || tgtCat === "kc3")) {
      threats.push({
        id: `conn-prompt-injection-${edge.id}`,
        name: "Prompt Injection Vector",
        description: `User/Actor "${source.data.label}" has a direct data flow to "${target.data.label}". This is a potential prompt injection vector.`,
        severity: "high",
        methodology: "connection",
        affectedNodeIds: [edge.source, edge.target],
        affectedEdgeIds: [edge.id!],
        inherited: false,
        mitigations: [
          "Input validation and sanitization",
          "Prompt hardening and instruction hierarchy",
          "Content security filtering",
        ],
      });
    }
    if ((srcCat === "kc2" || srcCat === "kc1") && (tgtCat === "kc5" || tgtCat === "kc6")) {
      threats.push({
        id: `conn-tool-misuse-${edge.id}`,
        name: "Tool Misuse via Agent",
        description: `"${source.data.label}" sends commands to "${target.data.label}". A compromised agent could misuse tool capabilities.`,
        severity: "high",
        methodology: "connection",
        affectedNodeIds: [edge.source, edge.target],
        affectedEdgeIds: [edge.id!],
        inherited: false,
        mitigations: [
          "Tool sandboxing and isolation",
          "Permission boundaries per tool",
          "Human-in-the-loop for destructive actions",
        ],
      });
    }
    if ((srcCat === "kc1" || srcCat === "kc2" || srcCat === "kc3") && tgtCat === "kc4") {
      threats.push({
        id: `conn-memory-poisoning-${edge.id}`,
        name: "Memory Poisoning via Agent Output",
        description: `"${source.data.label}" writes to memory component "${target.data.label}". Compromised outputs could poison stored data.`,
        severity: "medium",
        methodology: "connection",
        affectedNodeIds: [edge.source, edge.target],
        affectedEdgeIds: [edge.id!],
        inherited: false,
        mitigations: [
          "Memory validation and sanitization",
          "Output verification before storage",
          "Memory integrity checks",
        ],
      });
    }
    if (srcCat === "kc2" && tgtCat === "kc2") {
      threats.push({
        id: `conn-multi-agent-${edge.id}`,
        name: "Multi-Agent Communication Risk",
        description: `Communication between agents "${source.data.label}" and "${target.data.label}" could be exploited for cascading failures or rogue behavior.`,
        severity: "high",
        methodology: "connection",
        affectedNodeIds: [edge.source, edge.target],
        affectedEdgeIds: [edge.id!],
        inherited: false,
        mitigations: [
          "Mutual authentication between agents",
          "Message integrity verification",
          "Agent behavior monitoring",
          "Communication channel encryption",
        ],
      });
    }
    if (tgtCat === "external" || srcCat === "external") {
      const meta = edge.data;
      if (meta && (!meta.encrypted || meta.authentication === "None")) {
        threats.push({
          id: `conn-external-insecure-${edge.id}`,
          name: "Insecure External System Connection",
          description: `Connection to external system lacks ${!meta.encrypted ? "encryption" : ""}${!meta.encrypted && meta.authentication === "None" ? " and " : ""}${meta.authentication === "None" ? "authentication" : ""}.`,
          severity: "high",
          methodology: "connection",
          affectedNodeIds: [edge.source, edge.target],
          affectedEdgeIds: [edge.id!],
          inherited: false,
          mitigations: [
            "Enforce TLS/mTLS for all external connections",
            "Implement strong authentication",
            "Validate external system certificates",
          ],
        });
      }
    }
  }
  return threats;
}

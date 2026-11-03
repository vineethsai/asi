import {
  MaestroLayer,
  type CanvasNode,
  type GuardrailCoverage,
  type NodeSemantics,
  type SemanticKind,
} from "../types";

/**
 * Resolve the semantic kind of a node. An explicit `data.semantics.kind`
 * always wins; otherwise the kind is inferred from the KC category, the
 * component id and the MAESTRO layers — never from the free-text label.
 */
export function resolveKind(node: CanvasNode): SemanticKind {
  if (node.type === "trustBoundary") return "boundary";
  const d = node.data;
  if (!d) return "custom";
  if (d.semantics?.kind) return d.semantics.kind;
  const layers = d.maestroLayers ?? [];
  const componentId = d.componentId ?? "";
  switch (d.category) {
    case "actor":
      return "actor";
    case "external":
      return "external";
    case "trust-boundary":
      return "boundary";
    case "kc1":
      return componentId.startsWith("kc1.4") ? "training-pipeline" : "model";
    case "kc2":
      return componentId.startsWith("kc2.2") ? "orchestrator" : "agent";
    case "kc3":
      // A reasoning/pattern component placed in the Security & Compliance
      // layer acts as a policy engine (the palette's "Guardrail" item).
      return componentId.startsWith("kc3.4") || layers.includes(MaestroLayer.SecurityCompliance)
        ? "guardrail"
        : "reasoning";
    case "kc4":
    case "datastore":
      return layers.includes(MaestroLayer.EvaluationObservability) ? "observability" : "memory";
    case "kc5":
      return componentId.startsWith("kc5.3") ? "mcp-server" : "tool";
    case "kc6":
      if (layers.includes(MaestroLayer.EvaluationObservability)) return "observability";
      if (componentId.startsWith("kc6.3")) return "datastore";
      return "infrastructure";
    default: {
      if (layers.includes(MaestroLayer.EvaluationObservability)) return "observability";
      if (d.toolAccessMode) return "tool";
      if (d.promptType) return "reasoning";
      if (d.dataSensitivity && d.dataSensitivity !== "none") return "datastore";
      return "custom";
    }
  }
}

export const AI_KINDS: ReadonlySet<SemanticKind> = new Set([
  "model",
  "training-pipeline",
  "agent",
  "orchestrator",
  "reasoning",
  "a2a-peer",
]);
export const AGENT_KINDS: ReadonlySet<SemanticKind> = new Set([
  "agent",
  "orchestrator",
  "a2a-peer",
]);
export const MODEL_KINDS: ReadonlySet<SemanticKind> = new Set(["model", "training-pipeline"]);
export const TOOL_KINDS: ReadonlySet<SemanticKind> = new Set([
  "tool",
  "scoped-tool",
  "mcp-server",
  "infrastructure",
]);
export const STORE_KINDS: ReadonlySet<SemanticKind> = new Set(["memory", "datastore"]);
export const GATE_KINDS: ReadonlySet<SemanticKind> = new Set(["guardrail", "hitl-gate"]);
export const CONTROL_KINDS: ReadonlySet<SemanticKind> = new Set([
  "guardrail",
  "hitl-gate",
  "observability",
  "identity",
]);

/** Coverage declared by a guardrail; inferred guardrails cover input + output. */
export function guardrailCoverage(
  kind: SemanticKind,
  semantics?: NodeSemantics,
): Set<GuardrailCoverage> {
  if (kind !== "guardrail") return new Set();
  const declared = semantics?.guardrail?.coverage;
  if (declared && declared.length > 0) return new Set(declared);
  return new Set<GuardrailCoverage>(["input", "output"]);
}

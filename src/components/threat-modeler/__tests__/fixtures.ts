/** Shared builders for the threat-modeler tests. */
import { ARCHITECTURE_TEMPLATES, instantiateTemplate } from "../templates";
import {
  type CanvasEdge,
  type CanvasEdgeData,
  type CanvasNode,
  type CanvasNodeData,
  DEFAULT_EDGE_METADATA,
  MaestroLayer,
} from "../types";

export function templateModel(id: string): { nodes: CanvasNode[]; edges: CanvasEdge[] } {
  const t = ARCHITECTURE_TEMPLATES.find((x) => x.id === id);
  if (!t) throw new Error(`no template ${id}`);
  return instantiateTemplate(t);
}

type NodeOpts = Partial<CanvasNodeData> & { parentId?: string; type?: string };

export function node(id: string, opts: NodeOpts = {}): CanvasNode {
  const { parentId, type, ...data } = opts;
  const category = data.category ?? "kc2";
  return {
    id,
    type:
      type ??
      (category === "actor"
        ? "actor"
        : category === "datastore" || category === "kc4"
          ? "dataStore"
          : category === "trust-boundary"
            ? "trustBoundary"
            : "agentComponent"),
    position: { x: 0, y: 0 },
    ...(parentId ? { parentId } : {}),
    data: {
      label: id,
      componentId: category.startsWith("kc") ? category : undefined,
      maestroLayers: [MaestroLayer.AgentFrameworks],
      trustLevel: category === "actor" || category === "external" ? "untrusted" : "semi-trusted",
      threats: [],
      ...data,
      category,
    } as CanvasNodeData,
  };
}

export const actor = (id = "user", opts: NodeOpts = {}) => node(id, { category: "actor", ...opts });
export const boundary = (id: string, label = id) =>
  node(id, { category: "trust-boundary", label, trustLevel: "trusted", type: "trustBoundary" });

let edgeSeq = 0;
export function flow(
  source: string,
  target: string,
  data: Partial<CanvasEdgeData> = {},
  id?: string,
): CanvasEdge {
  return {
    id: id ?? `e${++edgeSeq}-${source}-${target}`,
    source,
    target,
    type: "dataFlow",
    data: { ...DEFAULT_EDGE_METADATA, threats: [], ...data } as CanvasEdgeData,
  };
}

/** simple-agent with an input/output guardrail in front of the agent and an HITL gate before memory. */
export function withGuardrailAndHitl() {
  const { nodes, edges } = templateModel("simple-agent");
  const [user, agent, mem] = ["0", "1", "2"].map((i) => `template-simple-agent-${i}`);
  const guard = node("guard", {
    label: "Guardrail",
    category: "kc3",
    componentId: "kc3.4",
    maestroLayers: [MaestroLayer.SecurityCompliance],
    trustLevel: "trusted",
    semantics: { kind: "guardrail", guardrail: { coverage: ["input", "output"] } },
  });
  const hitl = node("hitl", {
    label: "Approval",
    category: "kc6",
    maestroLayers: [MaestroLayer.SecurityCompliance],
    trustLevel: "trusted",
    semantics: { kind: "hitl-gate", hitl: {} },
  });
  const rest = edges.filter(
    (e) => !(e.source === user && e.target === agent) && !(e.source === agent && e.target === mem),
  );
  const userEdge = edges.find((e) => e.source === user)!;
  const memEdge = edges.find((e) => e.target === mem)!;
  const via = (id: string, s: string, t: string, base: CanvasEdge): CanvasEdge => ({
    ...base,
    id,
    source: s,
    target: t,
    data: { ...DEFAULT_EDGE_METADATA, ...base.data, threats: [] } as CanvasEdgeData,
  });
  return {
    nodes: [...nodes, guard, hitl],
    edges: [
      ...rest,
      via("e-u-g", user, "guard", userEdge),
      via("e-g-a", "guard", agent, userEdge),
      via("e-a-h", agent, "hitl", memEdge),
      via("e-h-m", "hitl", mem, memEdge),
    ],
  };
}

/** One small model per rule that the shipped templates do not exercise. */
export const RULE_FIXTURES: Record<string, () => { nodes: CanvasNode[]; edges: CanvasEdge[] }> = {
  "TM-AGT-010": () => ({
    nodes: [
      actor(),
      node("agent"),
      node("tool", {
        category: "kc5",
        semantics: { kind: "scoped-tool", tool: { scopes: ["repo:write"] } },
      }),
    ],
    edges: [flow("user", "agent"), flow("agent", "tool")],
  }),
  "TM-AGT-021": () => ({
    nodes: [
      actor(),
      node("agent"),
      node("peer", {
        semantics: {
          kind: "a2a-peer",
          a2a: { mutualAuth: true, messageSigning: false, schemaValidation: false },
        },
      }),
    ],
    edges: [flow("user", "agent"), flow("agent", "peer", { authentication: "mTLS" })],
  }),
  "TM-AGT-030": () => ({
    nodes: [
      actor(),
      node("ext", { category: "external" }),
      node("agent"),
      node("mem", {
        category: "kc4",
        semantics: {
          kind: "memory",
          memory: { kind: "shared", perUserIsolation: false, writeAccess: ["ext"] },
        },
      }),
    ],
    edges: [flow("user", "agent"), flow("agent", "mem"), flow("ext", "mem")],
  }),
  "TM-AGT-032": () => ({
    nodes: [
      actor(),
      node("agent"),
      node("mem", {
        category: "kc4",
        dataSensitivity: "pii",
        semantics: {
          kind: "memory",
          memory: {
            kind: "episodic",
            retention: "indefinite",
            perUserIsolation: true,
            writeAccess: [],
          },
        },
      }),
    ],
    edges: [flow("user", "agent"), flow("agent", "mem")],
  }),
  "TM-AGT-040": () => ({
    nodes: [
      actor(),
      node("agent"),
      node("hitl", {
        category: "kc6",
        trustLevel: "trusted",
        semantics: { kind: "hitl-gate", hitl: {} },
      }),
      ...["t1", "t2", "t3"].map((id) =>
        node(id, { category: "kc5", toolAccessMode: "read-write" }),
      ),
    ],
    edges: [
      flow("user", "agent"),
      flow("agent", "hitl"),
      flow("hitl", "t1"),
      flow("hitl", "t2"),
      flow("hitl", "t3"),
    ],
  }),
  "TM-CONN-008": () => ({
    nodes: [actor(), node("agent"), node("db", { category: "datastore", trustLevel: "trusted" })],
    edges: [flow("user", "agent"), flow("agent", "db", { encrypted: false, protocol: "TCP" })],
  }),
  "TM-CONN-009": () => ({
    nodes: [
      actor(),
      node("agent"),
      node("partner", { category: "external", label: "Partner API" }),
    ],
    edges: [
      flow("user", "agent"),
      flow("agent", "partner", { containsPII: true, dataClassification: "Confidential" }),
    ],
  }),
  "TM-CONN-012": () => ({
    nodes: [
      boundary("bd", "Data zone"),
      boundary("ba", "Agent zone"),
      actor(),
      node("agent", { parentId: "ba" }),
      node("db", { category: "datastore", trustLevel: "semi-trusted", parentId: "bd" }),
    ],
    edges: [flow("user", "agent"), flow("db", "agent")],
  }),
  "TM-CONN-013": () => ({
    nodes: [
      actor(),
      node("agent"),
      node("exec", { category: "kc5", toolAccessMode: "execute", label: "Code Executor" }),
      node("db", { category: "datastore" }),
    ],
    edges: [flow("user", "agent"), flow("agent", "exec"), flow("exec", "db")],
  }),
  "TM-MODEL-006": () => ({
    nodes: [boundary("empty", "Empty zone"), actor(), node("agent")],
    edges: [flow("user", "agent")],
  }),
  "TM-NODE-004": () => ({
    nodes: [
      actor(),
      node("agent"),
      node("ft", { category: "kc1", componentId: "kc1.4", label: "Fine-tuning pipeline" }),
    ],
    edges: [flow("user", "agent"), flow("agent", "ft")],
  }),
  "TM-NODE-005": () => RULE_FIXTURES["TM-NODE-004"](),
  "TM-NODE-020": () => ({
    nodes: [
      actor(),
      node("agent", { promptType: "function-call" }),
      node("tool", { category: "kc5", toolAccessMode: "read-write" }),
    ],
    edges: [flow("user", "agent"), flow("agent", "tool")],
  }),
  "TM-NODE-021": () => ({
    nodes: [actor(), node("agent", { promptType: "system" })],
    edges: [flow("user", "agent")],
  }),
  "TM-PATH-002": () => ({
    nodes: [
      actor(),
      node("idp", {
        category: "kc6",
        trustLevel: "trusted",
        semantics: { kind: "identity", identity: { delegation: true, scopeNarrowing: false } },
      }),
      node("agent"),
      node("tool", { category: "kc5", toolAccessMode: "read-write", toolRiskTier: "sensitive" }),
    ],
    edges: [flow("user", "idp"), flow("idp", "agent"), flow("agent", "tool")],
  }),
  "TM-PATH-003": () => ({
    nodes: [actor(), node("a1"), node("a2"), node("a3")],
    edges: [flow("user", "a1"), flow("a1", "a2"), flow("a2", "a3")],
  }),
};

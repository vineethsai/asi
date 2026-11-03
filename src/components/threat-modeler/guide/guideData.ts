import type { SemanticKind } from "../types";

/** Table of contents (anchor id → title), in page order. */
export const GUIDE_TOC = [
  { id: "quick-start", title: "Quick start" },
  { id: "layout", title: "Workspace layout" },
  { id: "components", title: "Component reference" },
  { id: "agentic-semantics", title: "Agentic semantics" },
  { id: "data-flows", title: "Data flows and trust boundaries" },
  { id: "maestro", title: "MAESTRO layers" },
  { id: "analysis", title: "How the analysis works" },
  { id: "results", title: "Results, explainability and statuses" },
  { id: "rules", title: "Rules browser" },
  { id: "templates", title: "Templates" },
  { id: "saving", title: "Saving, versions and sharing" },
  { id: "import-export", title: "Import and export" },
  { id: "shortcuts", title: "Keyboard shortcuts" },
] as const;

export type GuideSectionId = (typeof GUIDE_TOC)[number]["id"];

/** 1-based section number for an anchor id. */
export function sectionNumber(id: GuideSectionId): number {
  return GUIDE_TOC.findIndex((s) => s.id === id) + 1;
}

/**
 * What the engine does with each semantic kind (§7.6). Each line is backed by
 * the rule files in engine/catalog/rules and engine/graph.ts / propagation.ts;
 * `rules` lists the catalog ids that read the kind or its metadata.
 */
export const KIND_EFFECTS: Partial<Record<SemanticKind, { effect: string; rules: string[] }>> = {
  agent: {
    effect:
      "Target of goal hijacking: prompt-injection rules fire on untrusted flows into it, excessive agency when it drives many or privileged tools, and chains of three or more ungated agents raise a cascade finding.",
    rules: ["TM-CONN-001", "TM-CONN-002", "TM-NODE-022", "TM-PATH-003", "TM-MODEL-005"],
  },
  orchestrator: {
    effect:
      "Treated as an agent that delegates: everything an agent gets, plus it counts towards shared-store cascades and rogue-agent containment.",
    rules: ["TM-NODE-022", "TM-PATH-003", "TM-MODEL-004", "TM-MODEL-005"],
  },
  model: {
    effect:
      "Jailbreak and model-extraction rules apply when it is reachable from an entry point; signed + pinned provenance clears the backdoored-weights finding.",
    rules: ["TM-NODE-001", "TM-NODE-002", "TM-NODE-003", "TM-NODE-006"],
  },
  memory: {
    effect:
      "Memory-poisoning rules read kind, retention, per-user isolation and write access: untrusted writers are critical, shared long-lived memory without isolation is flagged, three agents on one store raise a cascade.",
    rules: ["TM-NODE-010", "TM-AGT-030", "TM-AGT-031", "TM-AGT-032", "TM-MODEL-004"],
  },
  tool: {
    effect:
      "Tool misuse via a hijacked agent; access mode and risk tier set impact, and execute / destructive tools count as privileged (they need an approval gate).",
    rules: ["TM-CONN-003", "TM-NODE-030", "TM-PATH-001"],
  },
  "scoped-tool": {
    effect:
      "Write / admin scopes without an allow-list or rate limit are flagged; a declared allow-list lowers tool-misuse likelihood and a rate limit clears the resource-exhaustion finding.",
    rules: ["TM-AGT-010", "TM-CONN-003", "TM-NODE-006"],
  },
  "mcp-server": {
    effect:
      'Supply-chain and tool-poisoning rules: unsigned or unpinned servers, the exposed tool set, and network transports (anything but stdio) with auth "none".',
    rules: ["TM-AGT-001", "TM-AGT-002", "TM-AGT-003"],
  },
  "a2a-peer": {
    effect:
      "Inter-agent channel checks: missing mutual authentication, unsigned messages and missing schema validation.",
    rules: ["TM-AGT-020", "TM-AGT-021", "TM-CONN-006"],
  },
  guardrail: {
    effect:
      "A gate for the traffic it covers (input / output / tool-call): when every entry path passes it, rules gated on that coverage lose two likelihood levels, and inherited threats stop at it. Uncovered traffic is reported as guardrail evasion.",
    rules: ["TM-NODE-050"],
  },
  "hitl-gate": {
    effect:
      'Breaks attack paths and inherited propagation, and satisfies "privileged action without human approval" for the actions behind it. One gate in front of many high-risk actions raises approval fatigue.',
    rules: ["TM-PATH-001", "TM-AGT-040"],
  },
  identity: {
    effect:
      "A delegated user credential that reaches a tool without scope narrowing is flagged (confused deputy).",
    rules: ["TM-PATH-002"],
  },
  observability: {
    effect:
      "Covers the nodes it lists plus its direct neighbours; agents and high-risk tools outside that coverage raise a detectability finding. Telemetry carrying sensitive data and logs that are not immutable are flagged on the node itself.",
    rules: ["TM-MODEL-002", "TM-NODE-040", "TM-NODE-041"],
  },
};

/** Architecture page ids → display names (architecture data is not imported here to keep the chunk small). */
export function humaniseId(id: string): string {
  const s = id.replace(/[_-]+/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

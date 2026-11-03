import type { MaestroLayer, GeneratedThreat, RuleScope, Stride } from "../../types";
import type { EdgeInfo, GateKind, ModelGraph, NodeInfo, ReachInfo } from "../graph";

export type Level = 1 | 2 | 3 | 4 | 5;

/** What a rule matched, rendered in the UI as "why it fired". */
export interface MatchEvidence {
  evidence: string[];
  /** Extra affected nodes (node/edge scope) or all affected nodes (path/model scope). */
  nodeIds?: string[];
  edgeIds?: string[];
  /** Node sequence for path-scope matches (entry first). */
  path?: string[];
  /** Overrides the component key for path/model matches. */
  componentKey?: string;
  /** Node whose context drives likelihood/impact and propagation (defaults per scope). */
  focusNodeId?: string;
  /** Restrict which entry points the severity model considers (default: all). */
  entryIds?: string[];
  /** Free-form numbers the rule's likelihood/impact functions can read. */
  data?: Record<string, number | string | boolean>;
}

export type RuleMatch = boolean | MatchEvidence | MatchEvidence[] | null | undefined;

export interface RuleHelpers {
  node(id: string): NodeInfo | undefined;
  label(id: string): string;
  inbound(id: string): EdgeInfo[];
  outbound(id: string): EdgeInfo[];
  /** Shortest ungated influence path from any entry point. */
  reach(id: string): ReachInfo | undefined;
  /** Same, but gates covering `kinds` stop the influence. */
  reachBlocked(id: string, kinds: GateKind[]): ReachInfo | undefined;
  /** Components reachable along forward flows from `id` (excluding actors). */
  downstream(id: string, maxHops?: number): string[];
  /** Nodes that write into `id` (sources of inbound flows). */
  writers(id: string): NodeInfo[];
}

export interface RuleContext {
  graph: ModelGraph;
  h: RuleHelpers;
  node?: NodeInfo;
  edge?: EdgeInfo;
  source?: NodeInfo;
  target?: NodeInfo;
}

export interface RuleMaps {
  /** OWASP Top 10 for Agentic Applications 2026 ids, high confidence. */
  owaspAsi?: string[];
  /** Medium-confidence related ASI ids. */
  owaspAsiRelated?: string[];
  /** Cisco AI Security Taxonomy objective codes (OB-xxx). */
  cisco?: string[];
  /** Cisco technique codes (AITech-x.y) for the objectives above. */
  ciscoTechniques?: string[];
  /** OWASP AISVS 1.01 chapter (C1–C12) or requirement codes (C9.4.3). */
  aisvs?: string[];
  stride?: Stride[];
  maestroLayer?: MaestroLayer;
  /** OWASP Agentic AI Threats & Mitigations id ("t1"…"t17") in securityData. */
  catalogThreat?: string;
}

export type ImpactFactor = "data" | "tool" | "blast";

export interface ThreatRule {
  /** Stable id, e.g. "TM-CONN-012" — exported as the SARIF ruleId. */
  id: string;
  scope: RuleScope;
  title: string;
  description: string;
  methodology?: GeneratedThreat["methodology"];
  /** Node-scope prefilter (cheap) before `when`. */
  appliesTo?: (node: NodeInfo) => boolean;
  /** Pure predicate. Node/edge scope: boolean | evidence; path/model: evidence[] allowed. */
  when: (ctx: RuleContext) => RuleMatch;
  likelihood: (ctx: RuleContext, match: MatchEvidence) => Level;
  impact: (ctx: RuleContext, match: MatchEvidence) => Level;
  /** Gates that reduce likelihood when every entry path passes one. */
  gates?: GateKind[];
  /**
   * "inbound" (default): gates between entry points and the focus node count.
   * "outbound": gates between the focus node and any entry (exfiltration / output) count.
   */
  gateDirection?: "inbound" | "outbound";
  /** Context impact factors to skip (the rule's own impact already accounts for them). */
  skipImpactFactors?: ImpactFactor[];
  /** Skip the contextual likelihood model (model-level hygiene findings). */
  fixedSeverity?: boolean;
  propagates?: boolean;
  maxHops?: number;
  /** Which downstream nodes an inherited copy may land on. */
  propagatesTo?: (node: NodeInfo) => boolean;
  /** Instance-specific description; defaults to `description`. */
  message?: (ctx: RuleContext, match: MatchEvidence) => string;
  mitigationIds: string[];
  maps: RuleMaps;
  references?: { title: string; url: string }[];
}

export const lv = (n: number): Level => Math.max(1, Math.min(5, Math.round(n))) as Level;

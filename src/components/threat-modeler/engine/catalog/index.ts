import type { ThreatRule } from "./types";
import { NODE_RULES } from "./rules/node";
import { EDGE_RULES } from "./rules/edge";
import { PATH_RULES } from "./rules/path";
import { MODEL_RULES } from "./rules/model";
import { AGENTIC_RULES } from "./rules/agentic";

export * from "./types";
export * from "./mitigations";

/** The full declarative rule catalog, in stable id order. */
export const RULES: ThreatRule[] = [
  ...NODE_RULES,
  ...EDGE_RULES,
  ...PATH_RULES,
  ...MODEL_RULES,
  ...AGENTIC_RULES,
].sort((a, b) => (a.id < b.id ? -1 : 1));

let byId: Map<string, ThreatRule> | null = null;
export function rulesById(): Map<string, ThreatRule> {
  if (!byId) byId = new Map(RULES.map((r) => [r.id, r]));
  return byId;
}

export function getRule(id: string): ThreatRule | undefined {
  return rulesById().get(id);
}

/** Serialisable rule metadata (for the guide's rules browser, SARIF rules[], check-rules). */
export function ruleMetadata(rule: ThreatRule) {
  return {
    id: rule.id,
    scope: rule.scope,
    title: rule.title,
    description: rule.description,
    propagates: !!rule.propagates,
    mitigationIds: rule.mitigationIds,
    maps: rule.maps,
    references: rule.references ?? [],
  };
}

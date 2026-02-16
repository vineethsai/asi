import type { GeneratedThreat, CiscoTaxonomyMapping } from "../types";
import { ciscoTaxonomyData } from "@/components/components/ciscoTaxonomyData";

// Maps MAESTRO layers to the most relevant Cisco objective groups
const MAESTRO_TO_CISCO: Record<number, string[]> = {
  1: ["OB-001", "OB-002", "OB-005"], // Foundation Models -> Model Security
  2: ["OB-005", "OB-006", "OB-007"], // Data Operations -> Data Integrity
  3: ["OB-001", "OB-009", "OB-012"], // Agent Frameworks -> Agent/Tool Security
  4: ["OB-009", "OB-010", "OB-013"], // Deployment Infra -> Infra Security
  5: ["OB-011", "OB-015"], // Eval/Observability -> Monitoring
  6: ["OB-003", "OB-014", "OB-016"], // Security/Compliance -> Access Control
  7: ["OB-004", "OB-018", "OB-008"], // Agent Ecosystem -> Multi-Agent
};

// Keyword patterns that map to specific Cisco objective groups
const KEYWORD_TO_CISCO: [RegExp, string][] = [
  [/prompt.?injection|goal.?hijack/i, "OB-001"],
  [/jailbreak|guardrail/i, "OB-002"],
  [/auth|privilege|access.?control|identity/i, "OB-003"],
  [/multi.?agent|inter.?agent|rogue/i, "OB-004"],
  [/data.?poison|training.?data|dataset/i, "OB-005"],
  [/memory.?poison|context.?poison|rag.?poison/i, "OB-006"],
  [/data.?leak|exfiltrat|sensitive.?data/i, "OB-007"],
  [/human.?in.?the.?loop|oversight|trust/i, "OB-008"],
  [/supply.?chain|dependency|library/i, "OB-009"],
  [/deploy|container|infrastructure/i, "OB-010"],
  [/monitor|observ|logging|audit/i, "OB-011"],
  [/tool.?misuse|tool.?exploit|code.?exec|rce|sandbox/i, "OB-012"],
  [/cascad|failure|resilien|availability/i, "OB-013"],
  [/key.?manage|credential|secret|encrypt/i, "OB-014"],
  [/feedback|eval|red.?team/i, "OB-015"],
  [/communication|channel|protocol/i, "OB-016"],
  [/model.?theft|intellectual.?property/i, "OB-017"],
  [/autonomous|self.?replicat/i, "OB-018"],
];

function findObjective(code: string) {
  return ciscoTaxonomyData.find((og) => og.code === code);
}

function mapSingleThreat(threat: GeneratedThreat): CiscoTaxonomyMapping[] {
  const matchedCodes = new Set<string>();

  // 1. Match by MAESTRO layer
  if (threat.maestroLayer !== undefined) {
    const layerCodes = MAESTRO_TO_CISCO[threat.maestroLayer as number];
    if (layerCodes) layerCodes.forEach((c) => matchedCodes.add(c));
  }

  // 2. Match by keywords in name + description
  const text = `${threat.name} ${threat.description}`;
  for (const [pattern, code] of KEYWORD_TO_CISCO) {
    if (pattern.test(text)) matchedCodes.add(code);
  }

  // Build mapping results
  const results: CiscoTaxonomyMapping[] = [];
  for (const code of matchedCodes) {
    const og = findObjective(code);
    if (!og) continue;
    const techniques = og.ai_tech?.slice(0, 3).map((t) => `${t.code}: ${t.description}`) ?? [];
    results.push({
      objectiveId: og.code,
      objectiveName: og.objective_group,
      techniques: techniques.length > 0 ? techniques : undefined,
    });
  }

  return results;
}

export function applyCiscoMapping(threats: GeneratedThreat[]): GeneratedThreat[] {
  return threats.map((t) => ({
    ...t,
    ciscoMapping: mapSingleThreat(t),
  }));
}

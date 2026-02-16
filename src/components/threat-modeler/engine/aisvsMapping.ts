import { aisvsData } from "@/components/components/securityData";
import { type GeneratedThreat, MaestroLayer } from "../types";

export type RequirementStatus = "addressed" | "identified" | "gap";

export interface AISVSMapping {
  requirementId: string;
  code: string;
  title: string;
  level: number;
  categoryName: string;
  status: RequirementStatus;
}

export interface AISVSCoverageResult {
  mappings: AISVSMapping[];
  totalRequirements: number;
  identifiedRequirements: number;
  addressedRequirements: number;
  gapRequirements: number;
  coverageByLevel: Record<number, { total: number; identified: number; addressed: number }>;
  coverageByCategory: Record<string, { total: number; identified: number; addressed: number }>;
}

const MAESTRO_TO_AISVS_KEYWORDS: Partial<Record<MaestroLayer, string[]>> = {
  [MaestroLayer.FoundationModels]: [
    "model",
    "training",
    "adversarial",
    "robustness",
    "integrity",
    "validation",
  ],
  [MaestroLayer.DataOperations]: [
    "data",
    "privacy",
    "confidentiality",
    "data protection",
    "encryption",
    "disclosure",
    "input",
    "sanitization",
  ],
  [MaestroLayer.AgentFrameworks]: [
    "framework",
    "supply chain",
    "dependency",
    "injection",
    "prompt",
    "input validation",
  ],
  [MaestroLayer.DeploymentInfrastructure]: [
    "infrastructure",
    "container",
    "deployment",
    "network",
    "availability",
    "rate limit",
    "resource",
    "resilience",
  ],
  [MaestroLayer.EvaluationObservability]: [
    "logging",
    "audit",
    "traceability",
    "monitoring",
    "observability",
    "evaluation",
  ],
  [MaestroLayer.SecurityCompliance]: [
    "authentication",
    "authorization",
    "access control",
    "privilege",
    "permission",
    "compliance",
    "security",
  ],
  [MaestroLayer.AgentEcosystem]: [
    "identity",
    "verification",
    "spoofing",
    "agent",
    "ecosystem",
    "trust",
  ],
};

export function runAISVSMapping(threats: GeneratedThreat[]): AISVSCoverageResult {
  const allRequirements: AISVSMapping[] = [];
  const identifiedIds = new Set<string>();
  const addressedIds = new Set<string>();

  for (const [, category] of Object.entries(aisvsData)) {
    for (const subCat of category.subCategories ?? []) {
      for (const req of subCat.requirements ?? []) {
        allRequirements.push({
          requirementId: req.id,
          code: req.code,
          title: req.title,
          level: req.level,
          categoryName: category.name,
          status: "gap",
        });
      }
    }
  }

  for (const threat of threats) {
    const keywords: string[] = [];
    if (threat.maestroLayer !== undefined) {
      keywords.push(...(MAESTRO_TO_AISVS_KEYWORDS[threat.maestroLayer] ?? []));
    }
    if (keywords.length === 0) continue;

    for (const req of allRequirements) {
      const titleLower = req.title.toLowerCase();
      if (!keywords.some((kw) => titleLower.includes(kw))) continue;

      // Two-tier: "identified" if threat exists, "addressed" if mitigations exist
      if (!identifiedIds.has(req.requirementId)) {
        identifiedIds.add(req.requirementId);
        req.status = "identified";
      }
      if (threat.mitigations.length > 0 && !addressedIds.has(req.requirementId)) {
        addressedIds.add(req.requirementId);
        req.status = "addressed";
      }
    }
  }

  const coverageByLevel: Record<number, { total: number; identified: number; addressed: number }> =
    {};
  const coverageByCategory: Record<
    string,
    { total: number; identified: number; addressed: number }
  > = {};

  for (const req of allRequirements) {
    if (!coverageByLevel[req.level])
      coverageByLevel[req.level] = { total: 0, identified: 0, addressed: 0 };
    coverageByLevel[req.level].total++;
    if (req.status === "identified") coverageByLevel[req.level].identified++;
    if (req.status === "addressed") {
      coverageByLevel[req.level].identified++;
      coverageByLevel[req.level].addressed++;
    }

    if (!coverageByCategory[req.categoryName])
      coverageByCategory[req.categoryName] = { total: 0, identified: 0, addressed: 0 };
    coverageByCategory[req.categoryName].total++;
    if (req.status === "identified") coverageByCategory[req.categoryName].identified++;
    if (req.status === "addressed") {
      coverageByCategory[req.categoryName].identified++;
      coverageByCategory[req.categoryName].addressed++;
    }
  }

  return {
    mappings: allRequirements,
    totalRequirements: allRequirements.length,
    identifiedRequirements: identifiedIds.size,
    addressedRequirements: addressedIds.size,
    gapRequirements: allRequirements.length - identifiedIds.size,
    coverageByLevel,
    coverageByCategory,
  };
}

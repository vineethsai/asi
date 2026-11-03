/** AIUC-1 result types; computed by engine/compliance.ts (always produced, indicative). */
export interface Aiuc1RequirementStatus {
  requirementId: string;
  requirementTitle: string;
  principle: string;
  principleId: string;
  application: "Mandatory" | "Optional";
  status: "met" | "partial" | "gap" | "not-applicable";
  matchedVia: "asi-bridge" | "aivss-bridge" | "topology" | "keyword" | "none";
  relevantThreats: string[];
  recommendation: string;
  /** false = needs process/documentation evidence the diagram cannot show (excluded from the score). */
  assessable?: boolean;
  evidence?: string[];
  /** Compliance check ids (CHK-xx) that informed the verdict. */
  checks?: string[];
}

export interface Aiuc1PrincipleScore {
  met: number;
  partial: number;
  gap: number;
  total: number;
  score: number;
}

export interface Aiuc1ComplianceResult {
  requirements: Aiuc1RequirementStatus[];
  verdict: "likely-compliant" | "partially-compliant" | "significant-gaps";
  verdictLabel: string;
  overallScore: number;
  principleScores: Record<string, Aiuc1PrincipleScore>;
  version?: string;
  /** Retired requirement ids in the current release (not scored). */
  retired?: string[];
  summary: {
    total: number;
    mandatory: number;
    mandatoryMet: number;
    mandatoryPartial: number;
    mandatoryGap: number;
    optionalMet: number;
    optionalPartial: number;
    optionalGap: number;
    notAssessable?: number;
    notApplicable?: number;
  };
}

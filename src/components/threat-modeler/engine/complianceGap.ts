/** Legacy compliance-gap report shape, derived from engine/compliance.ts checks (P3-15). */
export interface ComplianceGapItem {
  requirementCode: string;
  requirementTitle: string;
  categoryName: string;
  level: number;
  status: "met" | "partial" | "gap";
  relevantThreats: string[];
  recommendation: string;
  /** What the check found (Phase 3). */
  evidence?: string[];
}

export interface ComplianceGapReport {
  items: ComplianceGapItem[];
  summary: {
    totalChecks: number;
    met: number;
    partial: number;
    gaps: number;
    levelScores: Record<number, number>;
  };
}

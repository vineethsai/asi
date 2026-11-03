/** Legacy model-risk summary shape (ReportDashboard / exports). Computed by engine/modelScore.ts. */
export interface ComponentRiskScore {
  nodeId: string;
  label: string;
  /** Σ-decayed inherent threat score, 0–100. */
  inherentRisk: number;
  /** inherentRisk − residualRisk. */
  mitigatedRisk: number;
  /** Σ-decayed residual threat score, 0–100. */
  residualRisk: number;
  attackSurface: number;
  threatCount: number;
  criticalCount: number;
  highCount: number;
}

export interface ModelRiskSummary {
  overallScore: number;
  severityLabel: string;
  componentScores: ComponentRiskScore[];
  riskDistribution: { critical: number; high: number; medium: number; low: number };
  topRisks: { name: string; score: number; nodeId: string }[];
}

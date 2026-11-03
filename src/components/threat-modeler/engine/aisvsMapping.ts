/**
 * Legacy AISVS coverage types (kept so the existing panels compile).
 * The coverage itself is computed by engine/compliance.ts per AISVS 1.01
 * chapter from evidence-based checks (P3-16).
 */
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
  /** Applicable rows (not-applicable chapters are excluded). */
  totalRequirements: number;
  /** Rows with status "identified" or "addressed". */
  identifiedRequirements: number;
  /** Rows whose verdict is met (every linked threat mitigated, every check met). */
  addressedRequirements: number;
  gapRequirements: number;
  /** addressed / total, 0–100 (P3-16: never (identified + addressed) / total). */
  percent?: number;
  version?: string;
  coverageByLevel: Record<number, { total: number; identified: number; addressed: number }>;
  coverageByCategory: Record<string, { total: number; identified: number; addressed: number }>;
}

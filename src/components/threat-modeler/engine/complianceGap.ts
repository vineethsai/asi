import { aisvsData } from "@/components/components/securityData";
import type { CanvasNode, CanvasEdge, GeneratedThreat } from "../types";
import type { NodeRiskProfile } from "./nodeProfile";

export interface ComplianceGapItem {
  requirementCode: string;
  requirementTitle: string;
  categoryName: string;
  level: number;
  status: "met" | "partial" | "gap";
  relevantThreats: string[];
  recommendation: string;
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

export function runComplianceGapAnalysis(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  threats: GeneratedThreat[],
  profiles?: Map<string, NodeRiskProfile>,
): ComplianceGapReport {
  const items: ComplianceGapItem[] = [];
  let met = 0,
    partial = 0,
    gaps = 0;

  const hasEncryption = edges.some((e) => e.data?.encrypted);
  const hasAuth = edges.some((e) => e.data?.authentication !== "None");
  const hasLogging = nodes.some(
    (n) =>
      n.data?.label?.toLowerCase().includes("log") ||
      n.data?.label?.toLowerCase().includes("monitor") ||
      n.data?.maestroLayers?.includes(5),
  );
  const hasTrustBoundary = nodes.some((n) => n.type === "trustBoundary");
  const hasHITL = nodes.some((n) => n.data?.category === "actor");
  const _threatNames = threats.map((t) => t.name.toLowerCase()).join(" ");

  // Profile-derived flags
  const hasCredentialNodes = profiles
    ? Array.from(profiles.values()).some((p) => p.handlesCredentials)
    : false;
  const hasRegulatedNodes = profiles
    ? Array.from(profiles.values()).some((p) => p.handlesRegulatedData)
    : false;
  const hasExecNodes = profiles
    ? Array.from(profiles.values()).some((p) => p.isExecutionCapable)
    : false;

  for (const [, category] of Object.entries(aisvsData)) {
    for (const subCat of category.subCategories ?? []) {
      for (const req of subCat.requirements ?? []) {
        const titleLower = req.title.toLowerCase();
        const descLower = (req.description ?? "").toLowerCase();
        let status: "met" | "partial" | "gap" = "gap";
        const relevantThreats: string[] = [];
        let recommendation = `Review and implement: ${req.title}`;

        if (titleLower.includes("encrypt") || descLower.includes("encrypt")) {
          status = hasEncryption ? "met" : "gap";
          recommendation = hasEncryption
            ? "Encryption in place"
            : "Add encryption to all data flows";
        } else if (titleLower.includes("authenti") || descLower.includes("authenti")) {
          status = hasAuth ? "met" : "gap";
          recommendation = hasAuth
            ? "Authentication configured"
            : "Add authentication to data flows";
        } else if (
          titleLower.includes("log") ||
          titleLower.includes("audit") ||
          titleLower.includes("monitor")
        ) {
          status = hasLogging ? "met" : "gap";
          recommendation = hasLogging
            ? "Logging/monitoring present"
            : "Add observability component";
        } else if (titleLower.includes("boundary") || titleLower.includes("segment")) {
          status = hasTrustBoundary ? "met" : "gap";
          recommendation = hasTrustBoundary
            ? "Trust boundaries defined"
            : "Define trust boundaries";
        } else if (titleLower.includes("human") || titleLower.includes("oversight")) {
          status = hasHITL ? "met" : "gap";
          recommendation = hasHITL ? "Human oversight present" : "Add human-in-the-loop";
        }

        for (const t of threats) {
          if (
            t.name.toLowerCase().includes(titleLower.split(" ")[0]) ||
            titleLower.includes(t.name.toLowerCase().split(" ")[0])
          ) {
            relevantThreats.push(t.id);
            if (status === "gap" && t.mitigations.length > 0) status = "partial";
          }
        }

        if (status === "met") met++;
        else if (status === "partial") partial++;
        else gaps++;

        items.push({
          requirementCode: req.code,
          requirementTitle: req.title,
          categoryName: category.name,
          level: req.level,
          status,
          relevantThreats,
          recommendation,
        });
      }
    }
  }

  // Profile-driven compliance requirements
  if (hasCredentialNodes || hasRegulatedNodes) {
    const credStatus: "met" | "partial" | "gap" =
      hasEncryption && hasAuth ? "met" : hasEncryption || hasAuth ? "partial" : "gap";
    items.push({
      requirementCode: "META-CRED-1",
      requirementTitle: "Credential & Regulated Data Protection",
      categoryName: "Metadata-Driven Requirements",
      level: 1,
      status: credStatus,
      relevantThreats: [],
      recommendation:
        credStatus === "met"
          ? "Encryption and authentication in place for sensitive flows"
          : "Ensure all data flows involving credentials or regulated data have both encryption and authentication. Add credential rotation and key management policies.",
    });
    if (credStatus === "met") met++;
    else if (credStatus === "partial") partial++;
    else gaps++;

    const auditStatus: "met" | "partial" | "gap" = hasLogging ? "met" : "gap";
    items.push({
      requirementCode: "META-CRED-2",
      requirementTitle: "Audit Trail for Sensitive Data Access",
      categoryName: "Metadata-Driven Requirements",
      level: 2,
      status: auditStatus,
      relevantThreats: [],
      recommendation:
        auditStatus === "met"
          ? "Logging/monitoring present for audit trail"
          : "Add comprehensive audit logging for all access to credential and regulated data stores.",
    });
    if (auditStatus === "met") met++;
    else gaps++;
  }

  if (hasExecNodes) {
    const sandboxStatus: "met" | "partial" | "gap" = hasTrustBoundary ? "partial" : "gap";
    items.push({
      requirementCode: "META-EXEC-1",
      requirementTitle: "Code Execution Sandboxing",
      categoryName: "Metadata-Driven Requirements",
      level: 1,
      status: sandboxStatus,
      relevantThreats: [],
      recommendation:
        sandboxStatus === "partial"
          ? "Trust boundaries exist but verify execution-capable components are isolated within them."
          : "Execution-capable components detected. Add sandboxing, resource limits, and code review controls.",
    });
    if (sandboxStatus === "partial") partial++;
    else gaps++;

    const reviewStatus: "met" | "partial" | "gap" = hasHITL ? "partial" : "gap";
    items.push({
      requirementCode: "META-EXEC-2",
      requirementTitle: "Human Review for Code Execution",
      categoryName: "Metadata-Driven Requirements",
      level: 2,
      status: reviewStatus,
      relevantThreats: [],
      recommendation:
        reviewStatus === "partial"
          ? "Human actors present but verify they approve code execution actions."
          : "No human oversight for execution-capable components. Add human-in-the-loop approval for code execution.",
    });
    if (reviewStatus === "partial") partial++;
    else gaps++;
  }

  const totalChecks = items.length;
  const levelScores: Record<number, number> = {};
  for (const item of items) {
    if (!levelScores[item.level]) levelScores[item.level] = 0;
    if (item.status === "met")
      levelScores[item.level] += 100 / items.filter((i) => i.level === item.level).length;
    else if (item.status === "partial")
      levelScores[item.level] += 50 / items.filter((i) => i.level === item.level).length;
  }

  return { items, summary: { totalChecks, met, partial, gaps, levelScores } };
}

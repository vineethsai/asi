import { aisvsData } from "@/components/components/securityData";
import type { CanvasNode, CanvasEdge, GeneratedThreat } from "../types";

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

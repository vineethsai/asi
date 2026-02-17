import { aiuc1Principles, type Aiuc1Requirement } from "@/components/components/aiuc1Data";
import type { GeneratedThreat, CanvasNode, CanvasEdge } from "../types";
import type { AISVSCoverageResult } from "./aisvsMapping";
import type { NodeRiskProfile } from "./nodeProfile";

export interface Aiuc1RequirementStatus {
  requirementId: string;
  requirementTitle: string;
  principle: string;
  principleId: string;
  application: "Mandatory" | "Optional";
  status: "met" | "partial" | "gap";
  matchedVia: "asi-bridge" | "aivss-bridge" | "topology" | "keyword" | "none";
  relevantThreats: string[];
  recommendation: string;
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
  summary: {
    total: number;
    mandatory: number;
    mandatoryMet: number;
    mandatoryPartial: number;
    mandatoryGap: number;
    optionalMet: number;
    optionalPartial: number;
    optionalGap: number;
  };
}

const KEYWORD_PATTERNS: { pattern: RegExp; requirementIds: string[] }[] = [
  {
    pattern: /prompt.?inject|jailbreak|adversar/i,
    requirementIds: ["B001", "B002", "B005", "C010"],
  },
  { pattern: /hallucin|fabricat|false.?output/i, requirementIds: ["D001", "D002"] },
  {
    pattern: /tool.?call|tool.?misuse|function.?call|unauthorized.?action/i,
    requirementIds: ["D003", "D004", "B006"],
  },
  { pattern: /data.?leak|pii|personal.?data|privacy/i, requirementIds: ["A006", "A005", "A003"] },
  { pattern: /ip.?leak|intellectual.?property|copyright/i, requirementIds: ["A004", "A007"] },
  {
    pattern: /supply.?chain|dependency|upstream|vendor/i,
    requirementIds: ["E005", "E006", "A007"],
  },
  { pattern: /access.?control|privilege|authori[sz]/i, requirementIds: ["B007", "B008", "B006"] },
  { pattern: /cascad|propaga|chain.?fail/i, requirementIds: ["E001", "E002", "E003"] },
  {
    pattern: /goal.?hijack|instruction.?manipul|scope.?viol/i,
    requirementIds: ["C003", "C004", "C005"],
  },
  { pattern: /scraping|rate.?limit|endpoint.?abuse/i, requirementIds: ["B004"] },
  { pattern: /rogue.?agent|unmonitor|drift/i, requirementIds: ["C008", "E015"] },
  { pattern: /harmful.?output|offensive|bias|deception/i, requirementIds: ["C003", "C010"] },
  { pattern: /code.?exec|rce|injection.?vuln/i, requirementIds: ["C006"] },
  { pattern: /cyber.?attack|exploit/i, requirementIds: ["F001"] },
  { pattern: /cbrn|catastroph|bioweapon|nuclear|chemical/i, requirementIds: ["F002"] },
  { pattern: /encrypt|tls|data.?protect/i, requirementIds: ["B008", "A005"] },
  { pattern: /log|audit|monitor|observ/i, requirementIds: ["E015", "C008"] },
  { pattern: /human.?in.?the.?loop|oversight|review|intervene/i, requirementIds: ["C007", "C009"] },
  { pattern: /trust.?boundar|segment|isolat/i, requirementIds: ["A005", "B006"] },
  { pattern: /output.?filter|output.?limit|obfuscat/i, requirementIds: ["B009"] },
];

function buildRequirementMap(): Map<
  string,
  { req: Aiuc1Requirement; principleId: string; principleName: string }
> {
  const map = new Map<
    string,
    { req: Aiuc1Requirement; principleId: string; principleName: string }
  >();
  for (const p of aiuc1Principles) {
    for (const r of p.requirements) {
      map.set(r.id, { req: r, principleId: p.id, principleName: p.name });
    }
  }
  return map;
}

export function runAiuc1Compliance(
  threats: GeneratedThreat[],
  aisvsResult: AISVSCoverageResult | null,
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  _profiles?: Map<string, NodeRiskProfile>,
): Aiuc1ComplianceResult {
  const reqMap = buildRequirementMap();
  const results: Aiuc1RequirementStatus[] = [];

  const hasEncryption = edges.some((e) => e.data?.encrypted);
  const hasAuth = edges.some((e) => e.data?.authentication !== "None" && e.data?.authentication);
  const hasLogging = nodes.some(
    (n) =>
      n.data?.label?.toLowerCase().includes("log") ||
      n.data?.label?.toLowerCase().includes("monitor") ||
      n.data?.maestroLayers?.includes(5),
  );
  const hasTrustBoundary = nodes.some((n) => n.type === "trustBoundary");
  const hasHITL = nodes.some((n) => n.data?.category === "actor");

  const asiIdsInThreats = new Set<string>();
  const asiIdsWithMitigations = new Set<string>();
  const aivssRisksInThreats = new Set<string>();
  const aivssRisksWithMitigations = new Set<string>();
  const matchedByKeyword = new Map<string, { threatIds: string[]; hasMitigations: boolean }>();

  for (const threat of threats) {
    if (threat.owaspMapping) {
      for (const m of threat.owaspMapping) {
        asiIdsInThreats.add(m.asiId);
        if (threat.mitigations.length > 0) asiIdsWithMitigations.add(m.asiId);
      }
    }

    const threatText = `${threat.name} ${threat.description}`.toLowerCase();
    for (const kp of KEYWORD_PATTERNS) {
      if (kp.pattern.test(threatText)) {
        for (const rid of kp.requirementIds) {
          const entry = matchedByKeyword.get(rid) ?? { threatIds: [], hasMitigations: false };
          entry.threatIds.push(threat.id);
          if (threat.mitigations.length > 0) entry.hasMitigations = true;
          matchedByKeyword.set(rid, entry);
        }
      }
    }
  }

  if (aisvsResult) {
    for (const mapping of aisvsResult.mappings) {
      if (mapping.status === "addressed") {
        aivssRisksWithMitigations.add(mapping.categoryName.toLowerCase());
      } else if (mapping.status === "identified") {
        aivssRisksInThreats.add(mapping.categoryName.toLowerCase());
      }
    }
  }

  // Requirements that are purely organizational/process-based and cannot be
  // verified from a threat model alone. These stay "gap" unless topology or
  // very strong mitigation evidence exists. They can only reach "partial".
  const processOnlyRequirements = new Set([
    "A001",
    "A002", // data policies (legal docs)
    "B003", // manage public release of technical details
    "C001", // define AI risk taxonomy (document)
    "C002", // pre-deployment testing (process)
    "C010",
    "C011",
    "C012", // third-party testing
    "D002",
    "D004", // third-party testing
    "E001",
    "E002",
    "E003", // failure plans
    "E004",
    "E006",
    "E007",
    "E008",
    "E010",
    "E011",
    "E012",
    "E013",
    "E014",
    "E016",
    "E017", // accountability docs
    "E005", // cloud vs on-prem assessment
  ]);

  for (const [reqId, { req, principleId, principleName }] of reqMap) {
    let status: "met" | "partial" | "gap" = "gap";
    let matchedVia: Aiuc1RequirementStatus["matchedVia"] = "none";
    const relevantThreats: string[] = [];
    let recommendation = `Review and implement: ${req.title}`;

    const isProcessOnly = processOnlyRequirements.has(reqId);
    const maxStatusForProcess: "met" | "partial" = "partial";

    // Cap status: process-only requirements can never be "met" from a threat model
    const capStatus = (s: "met" | "partial" | "gap"): "met" | "partial" | "gap" => {
      if (isProcessOnly && s === "met") return maxStatusForProcess;
      return s;
    };

    // 1. ASI bridge: threats with OWASP mapping matching this requirement's ASI ID
    //    - With mitigations: partial (threat model shows risk awareness + some controls)
    //    - Without mitigations: gap (risk identified but nothing done)
    if (req.asiId && asiIdsInThreats.has(req.asiId)) {
      if (asiIdsWithMitigations.has(req.asiId)) {
        status = capStatus("partial");
        recommendation = `Risk identified and partially mitigated via ${req.asiId} (${req.asiTitle}). Full implementation requires verifying controls are operational.`;
      }
      // Without mitigations, stay "gap" -- just having a threat isn't compliance
      matchedVia = "asi-bridge";

      for (const t of threats) {
        if (t.owaspMapping?.some((m) => m.asiId === req.asiId)) {
          relevantThreats.push(t.id);
        }
      }
    }

    // 2. AIVSS bridge: AISVS coverage for this requirement's AIVSS risk
    //    - Addressed: partial (AISVS requirements have controls, but doesn't prove AIUC-1 implementation)
    //    - Identified: gap
    if (status === "gap" && aisvsResult) {
      const primaryLower = req.aivss_primary.toLowerCase();
      const addressedCategories = aisvsResult.mappings
        .filter((m) => m.status === "addressed")
        .map((m) => m.title.toLowerCase());

      const primaryKeywords = primaryLower.split(/\s+/).filter((w) => w.length > 3);
      const hasAddressed = addressedCategories.some((cat) =>
        primaryKeywords.some((kw) => cat.includes(kw)),
      );

      if (hasAddressed) {
        status = capStatus("partial");
        matchedVia = "aivss-bridge";
        recommendation = `AISVS requirements addressed for "${req.aivss_primary}". Verify AIUC-1 specific controls are implemented.`;
      }
    }

    // 3. Keyword matching from threats
    //    - With mitigations: partial (relevant threats found and partially addressed)
    //    - Without mitigations: gap (just having threats isn't progress)
    if (status === "gap") {
      const kwMatch = matchedByKeyword.get(reqId);
      if (kwMatch && kwMatch.hasMitigations) {
        relevantThreats.push(...kwMatch.threatIds);
        status = capStatus("partial");
        matchedVia = "keyword";
        recommendation = `Related threats identified with mitigations for "${req.title}". Verify full requirement implementation.`;
      } else if (kwMatch) {
        // Threats found but no mitigations -- still a gap, but note the relevance
        relevantThreats.push(...kwMatch.threatIds);
        matchedVia = "keyword";
        recommendation = `Related threats detected but no mitigations in place for "${req.title}"`;
      }
    }

    // 4. Topology checks -- these provide concrete evidence from the model
    //    Topology can elevate to "met" for technical requirements (not process-only)
    //    because they represent verifiable architectural decisions
    if (status !== "met") {
      const titleLower = req.fullText.toLowerCase();

      let topologyMatch = false;
      let topologyRecommendation = "";

      if (
        (titleLower.includes("encrypt") || titleLower.includes("deployment environment")) &&
        hasEncryption
      ) {
        topologyMatch = true;
        topologyRecommendation = "Encryption detected in data flows";
      } else if (
        (titleLower.includes("access control") ||
          titleLower.includes("access privilege") ||
          titleLower.includes("authori")) &&
        hasAuth
      ) {
        topologyMatch = true;
        topologyRecommendation = hasEncryption
          ? "Authentication and encryption detected in model"
          : "Authentication present; consider also adding encryption to all flows";
      } else if (
        (titleLower.includes("log") ||
          titleLower.includes("audit") ||
          titleLower.includes("monitor")) &&
        hasLogging &&
        !isProcessOnly
      ) {
        topologyMatch = true;
        topologyRecommendation = "Logging/monitoring component detected in model";
      } else if (
        (titleLower.includes("human") ||
          titleLower.includes("oversight") ||
          titleLower.includes("intervention") ||
          titleLower.includes("feedback")) &&
        hasHITL
      ) {
        topologyMatch = true;
        topologyRecommendation = "Human-in-the-loop actor present in model";
      } else if (
        (titleLower.includes("isolat") ||
          titleLower.includes("boundar") ||
          titleLower.includes("limit ai agent")) &&
        hasTrustBoundary
      ) {
        topologyMatch = true;
        topologyRecommendation = "Trust boundaries defined in model";
      }

      if (topologyMatch) {
        // Topology + existing partial = met (for technical requirements)
        // Topology alone = partial
        if (status === "partial" && !isProcessOnly) {
          status = "met";
          recommendation =
            topologyRecommendation +
            ". Combined with threat mitigations, this requirement appears addressed.";
        } else {
          status = capStatus("partial");
          recommendation = topologyRecommendation + ". Verify full operational implementation.";
        }
        matchedVia = "topology";
      }
    }

    results.push({
      requirementId: reqId,
      requirementTitle: req.title,
      principle: principleName,
      principleId,
      application: req.application,
      status,
      matchedVia,
      relevantThreats: [...new Set(relevantThreats)],
      recommendation,
    });
  }

  // Compute scores
  const principleScores: Record<string, Aiuc1PrincipleScore> = {};
  for (const p of aiuc1Principles) {
    principleScores[p.id] = { met: 0, partial: 0, gap: 0, total: 0, score: 0 };
  }

  let mandatoryMet = 0,
    mandatoryPartial = 0,
    mandatoryGap = 0;
  let optionalMet = 0,
    optionalPartial = 0,
    optionalGap = 0;

  for (const r of results) {
    const ps = principleScores[r.principleId];
    ps.total++;
    if (r.status === "met") {
      ps.met++;
      if (r.application === "Mandatory") mandatoryMet++;
      else optionalMet++;
    } else if (r.status === "partial") {
      ps.partial++;
      if (r.application === "Mandatory") mandatoryPartial++;
      else optionalPartial++;
    } else {
      ps.gap++;
      if (r.application === "Mandatory") mandatoryGap++;
      else optionalGap++;
    }
  }

  for (const ps of Object.values(principleScores)) {
    ps.score = ps.total > 0 ? Math.round(((ps.met + ps.partial * 0.5) / ps.total) * 100) : 0;
  }

  const total = results.length;
  const mandatory = mandatoryMet + mandatoryPartial + mandatoryGap;
  const overallScore =
    total > 0
      ? Math.round(
          ((mandatoryMet + mandatoryPartial * 0.5 + optionalMet * 0.3 + optionalPartial * 0.15) /
            total) *
            100,
        )
      : 0;

  let verdict: Aiuc1ComplianceResult["verdict"];
  let verdictLabel: string;

  if (mandatoryGap === 0) {
    verdict = "likely-compliant";
    verdictLabel = "Likely AIUC-1 Compliant";
  } else if (mandatoryMet + mandatoryPartial > mandatoryGap) {
    verdict = "partially-compliant";
    verdictLabel = "Partially Compliant";
  } else {
    verdict = "significant-gaps";
    verdictLabel = "Significant Gaps";
  }

  return {
    requirements: results,
    verdict,
    verdictLabel,
    overallScore,
    principleScores,
    summary: {
      total,
      mandatory,
      mandatoryMet,
      mandatoryPartial,
      mandatoryGap,
      optionalMet,
      optionalPartial,
      optionalGap,
    },
  };
}

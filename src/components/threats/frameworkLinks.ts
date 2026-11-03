/**
 * Cross-framework references for one threat, with deep links in the site-wide formats:
 *   OWASP Agentic Top 10 → /taxonomy?tab=owasp-agentic&entry=ASI01
 *   Cisco AI taxonomy     → /taxonomy?tab=cisco&entry=OB-004
 *   OWASP AIVSS           → /taxonomy?tab=aivss&entry=<core-risk id>
 */
import type { Threat } from "@/components/components/securityData";
import { agenticTop10Data } from "@/components/components/owaspAgenticTop10Data";
import { findCiscoNode } from "@/components/components/ciscoTaxonomyData";
import { coreRiskScores } from "@/components/components/aivssCalcData";

export type FrameworkKey = "asi" | "cisco" | "aivss";

export interface FrameworkRef {
  framework: FrameworkKey;
  /** Short code shown on chips: "ASI01", "OB-004", "AIVSS #3". */
  code: string;
  name: string;
  href: string;
  /**
   * How the link was found:
   * - "mapped": listed on the threat (asiMapping / ciscoMapping)
   * - "appendix": the ASI entry lists this threat in Top 10 Appendix A (relatedThreats)
   * - "primary" / "secondary": AIVSS core risk whose primary / secondary ASI entry is one of the
   *   threat's ASI codes (AIVSS v0.8 Appendix B)
   */
  basis: "mapped" | "appendix" | "primary" | "secondary";
  /** Editorial mapping of this site, not in the source appendix. */
  unofficial?: boolean;
  /** Extra detail for AIVSS (score / severity). */
  detail?: string;
  severity?: string;
}

/** ASI codes of a threat: `asiMapping` plus the legacy single `asiCode` field when present. */
export function threatAsiCodes(threat: Threat): string[] {
  const legacy = (threat as Threat & { asiCode?: string }).asiCode;
  return [...new Set([...(threat.asiMapping ?? []), ...(legacy ? [legacy] : [])])];
}

export function threatFrameworkRefs(threat: Threat): Record<FrameworkKey, FrameworkRef[]> {
  const asiCodes = threatAsiCodes(threat);
  const unofficial = new Set(threat.asiMappingUnofficial ?? []);

  const asi: FrameworkRef[] = [];
  for (const entry of agenticTop10Data) {
    const mapped = asiCodes.includes(entry.code);
    const appendix = entry.relatedThreats.includes(threat.id);
    if (!mapped && !appendix) continue;
    asi.push({
      framework: "asi",
      code: entry.code,
      name: entry.name,
      href: `/taxonomy?tab=owasp-agentic&entry=${encodeURIComponent(entry.code)}`,
      basis: mapped ? "mapped" : "appendix",
      unofficial: unofficial.has(entry.code),
    });
  }

  const cisco: FrameworkRef[] = (threat.ciscoMapping ?? []).map((code) => {
    const node = findCiscoNode(code);
    return {
      framework: "cisco" as const,
      code,
      name: node?.description ?? code,
      href: `/taxonomy?tab=cisco&entry=${encodeURIComponent(code)}`,
      basis: "mapped" as const,
    };
  });

  // AIVSS: a core risk matches when its primary (`asiCode` / `asiPrimary`) or any listed ASI
  // entry (`asiCodes`) is one of the threat's ASI codes. Primary matches first.
  const aivss: FrameworkRef[] = [];
  for (const r of coreRiskScores) {
    const primaryCodes = new Set([r.asiCode, ...(r.asiPrimary ?? [])].filter(Boolean));
    const allCodes = new Set([...(r.asiCodes ?? []), r.asiCode].filter(Boolean));
    const primary = asiCodes.some((c) => primaryCodes.has(c));
    const any = asiCodes.some((c) => allCodes.has(c));
    if (!any) continue;
    aivss.push({
      framework: "aivss",
      code: `AIVSS #${r.rank}`,
      name: r.name,
      href: `/taxonomy?tab=aivss&entry=${encodeURIComponent(r.id)}`,
      basis: primary ? "primary" : "secondary",
      detail: `AIVSS ${r.aivssScore.toFixed(1)} (${r.severity})`,
      severity: r.severity,
    });
  }
  aivss.sort((a, b) => (a.basis === b.basis ? 0 : a.basis === "primary" ? -1 : 1));

  return { asi, cisco, aivss };
}

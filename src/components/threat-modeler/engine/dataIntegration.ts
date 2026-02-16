import { threatsData, mitigationsData } from "@/components/components/securityData";
import type { GeneratedThreat } from "../types";
import { applyCiscoMapping } from "./ciscoMapping";
import { applyOwaspMapping } from "./owaspMapping";

export function enrichThreatsWithSecurityData(threats: GeneratedThreat[]): GeneratedThreat[] {
  let enriched = threats.map((threat) => {
    const result = { ...threat };
    for (const [, threatData] of Object.entries(threatsData)) {
      if (
        threat.name.toLowerCase().includes(threatData.name.toLowerCase()) ||
        threatData.name.toLowerCase().includes(threat.name.toLowerCase())
      ) {
        result.mitigationIds = threatData.mitigationIds;
        const mitigationNames = (threatData.mitigationIds ?? [])
          .map((mid) => mitigationsData[mid]?.name)
          .filter(Boolean) as string[];
        if (mitigationNames.length > 0) {
          result.mitigations = [...new Set([...result.mitigations, ...mitigationNames])];
        }
        break;
      }
    }
    return result;
  });

  // Apply taxonomy mappings
  enriched = applyCiscoMapping(enriched);
  enriched = applyOwaspMapping(enriched);

  return enriched;
}

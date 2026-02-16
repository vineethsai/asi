import { threatsData, mitigationsData } from "@/components/components/securityData";
import type { GeneratedThreat } from "../types";

export function enrichThreatsWithSecurityData(threats: GeneratedThreat[]): GeneratedThreat[] {
  return threats.map((threat) => {
    const enriched = { ...threat };
    for (const [, threatData] of Object.entries(threatsData)) {
      if (
        threat.name.toLowerCase().includes(threatData.name.toLowerCase()) ||
        threatData.name.toLowerCase().includes(threat.name.toLowerCase())
      ) {
        enriched.mitigationIds = threatData.mitigationIds;
        const mitigationNames = (threatData.mitigationIds ?? [])
          .map((mid) => mitigationsData[mid]?.name)
          .filter(Boolean) as string[];
        if (mitigationNames.length > 0) {
          enriched.mitigations = [...new Set([...enriched.mitigations, ...mitigationNames])];
        }
        break;
      }
    }
    return enriched;
  });
}

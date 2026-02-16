export interface AgenticRiskFactor {
  id: string;
  name: string;
  abbreviation: string;
  description: string;
  levels: {
    none: { value: number; label: string; description: string };
    low: { value: number; label: string; description: string };
    medium: { value: number; label: string; description: string };
    high: { value: number; label: string; description: string };
    critical: { value: number; label: string; description: string };
  };
}

export interface CoreRiskScore {
  rank: number;
  name: string;
  asiCode: string;
  cvssBase: number;
  aars: number;
  threatMultiplier: number;
  aivssScore: number;
  severity: "Critical" | "High" | "Medium" | "Low";
  factorValues: Record<string, string>;
}

export const agenticRiskFactors: AgenticRiskFactor[] = [
  {
    id: "AU",
    name: "Autonomy Level",
    abbreviation: "AU",
    description:
      "Degree to which the agent operates independently without human oversight or intervention in its decision-making and action execution.",
    levels: {
      none: {
        value: 0,
        label: "None",
        description: "Fully human-controlled, no autonomous capability",
      },
      low: {
        value: 0.25,
        label: "Low",
        description: "Limited autonomy, most actions require human approval",
      },
      medium: {
        value: 0.5,
        label: "Medium",
        description: "Moderate autonomy with periodic human oversight",
      },
      high: {
        value: 0.75,
        label: "High",
        description: "High autonomy with minimal human intervention required",
      },
      critical: {
        value: 1.0,
        label: "Critical",
        description: "Fully autonomous operation with no human-in-the-loop",
      },
    },
  },
  {
    id: "TI",
    name: "Tool Integration",
    abbreviation: "TI",
    description:
      "Extent and criticality of tools, APIs, plugins, and external services the agent can access and invoke during operation.",
    levels: {
      none: { value: 0, label: "None", description: "No external tool access" },
      low: {
        value: 0.25,
        label: "Low",
        description: "Read-only access to limited, non-sensitive tools",
      },
      medium: {
        value: 0.5,
        label: "Medium",
        description: "Read/write access to multiple tools with some constraints",
      },
      high: {
        value: 0.75,
        label: "High",
        description: "Broad tool access including sensitive systems",
      },
      critical: {
        value: 1.0,
        label: "Critical",
        description: "Unrestricted access to critical infrastructure tools",
      },
    },
  },
  {
    id: "MU",
    name: "Memory Use",
    abbreviation: "MU",
    description:
      "Scope and persistence of agent memory (short-term, long-term, shared, cross-session) and its influence on future decisions.",
    levels: {
      none: { value: 0, label: "None", description: "Stateless, no memory between interactions" },
      low: {
        value: 0.25,
        label: "Low",
        description: "Session-only memory, cleared between sessions",
      },
      medium: { value: 0.5, label: "Medium", description: "Persistent memory within user scope" },
      high: {
        value: 0.75,
        label: "High",
        description: "Cross-session persistent memory with shared context",
      },
      critical: {
        value: 1.0,
        label: "Critical",
        description: "Cross-user, cross-agent shared persistent memory",
      },
    },
  },
  {
    id: "CA",
    name: "Contextual Awareness",
    abbreviation: "CA",
    description:
      "Degree to which the agent's behavior is influenced by and adaptive to its operational context, environment, and situational factors.",
    levels: {
      none: { value: 0, label: "None", description: "No contextual awareness" },
      low: { value: 0.25, label: "Low", description: "Basic prompt context only" },
      medium: {
        value: 0.5,
        label: "Medium",
        description: "Context from conversation history and user profile",
      },
      high: {
        value: 0.75,
        label: "High",
        description: "Rich environmental context including external data sources",
      },
      critical: {
        value: 1.0,
        label: "Critical",
        description: "Full situational awareness with real-time environmental sensing",
      },
    },
  },
  {
    id: "MA",
    name: "Multi-Agent Interaction",
    abbreviation: "MA",
    description:
      "Level of interaction, delegation, and trust relationships between multiple agents in orchestrated or collaborative workflows.",
    levels: {
      none: { value: 0, label: "None", description: "Single agent, no multi-agent interaction" },
      low: {
        value: 0.25,
        label: "Low",
        description: "Limited interaction with other agents, isolated tasks",
      },
      medium: {
        value: 0.5,
        label: "Medium",
        description: "Coordinated multi-agent workflows with defined roles",
      },
      high: {
        value: 0.75,
        label: "High",
        description: "Dynamic multi-agent orchestration with delegation",
      },
      critical: {
        value: 1.0,
        label: "Critical",
        description: "Fully autonomous multi-agent swarm with emergent behavior",
      },
    },
  },
  {
    id: "PP",
    name: "Persistence & Planning",
    abbreviation: "PP",
    description:
      "Capability of the agent to create and execute multi-step plans, maintain state across tasks, and persist its operational goals over time.",
    levels: {
      none: { value: 0, label: "None", description: "Single-turn, no planning or persistence" },
      low: {
        value: 0.25,
        label: "Low",
        description: "Basic multi-step execution within a session",
      },
      medium: {
        value: 0.5,
        label: "Medium",
        description: "Multi-step planning with intermediate checkpoints",
      },
      high: {
        value: 0.75,
        label: "High",
        description: "Complex planning with persistent goals across sessions",
      },
      critical: {
        value: 1.0,
        label: "Critical",
        description: "Long-horizon autonomous planning with self-modification",
      },
    },
  },
  {
    id: "EI",
    name: "Environmental Impact",
    abbreviation: "EI",
    description:
      "Criticality and sensitivity of the systems, data, and physical environments the agent can affect through its actions.",
    levels: {
      none: {
        value: 0,
        label: "None",
        description: "No environmental impact, read-only information",
      },
      low: {
        value: 0.25,
        label: "Low",
        description: "Impact limited to non-sensitive digital systems",
      },
      medium: {
        value: 0.5,
        label: "Medium",
        description: "Impact on business-critical digital systems",
      },
      high: {
        value: 0.75,
        label: "High",
        description: "Impact on sensitive data, financial systems, or infrastructure",
      },
      critical: {
        value: 1.0,
        label: "Critical",
        description: "Impact on critical infrastructure, safety systems, or physical world",
      },
    },
  },
  {
    id: "SC",
    name: "Supply Chain Exposure",
    abbreviation: "SC",
    description:
      "Degree to which the agent depends on third-party components, tools, models, and services that could be compromised.",
    levels: {
      none: {
        value: 0,
        label: "None",
        description: "Fully self-contained, no third-party dependencies",
      },
      low: { value: 0.25, label: "Low", description: "Minimal vetted third-party dependencies" },
      medium: {
        value: 0.5,
        label: "Medium",
        description: "Multiple third-party tools and model providers",
      },
      high: {
        value: 0.75,
        label: "High",
        description: "Extensive third-party ecosystem with dynamic loading",
      },
      critical: {
        value: 1.0,
        label: "Critical",
        description: "Runtime-loaded third-party agents and tools with minimal vetting",
      },
    },
  },
  {
    id: "ID",
    name: "Identity & Delegation",
    abbreviation: "ID",
    description:
      "Complexity and risk of identity management, credential handling, and privilege delegation in the agent's operational context.",
    levels: {
      none: { value: 0, label: "None", description: "No identity or credential management" },
      low: {
        value: 0.25,
        label: "Low",
        description: "Static, scoped credentials with minimal delegation",
      },
      medium: {
        value: 0.5,
        label: "Medium",
        description: "Dynamic credentials with role-based access",
      },
      high: {
        value: 0.75,
        label: "High",
        description: "Complex delegation chains with inherited privileges",
      },
      critical: {
        value: 1.0,
        label: "Critical",
        description: "Fully dynamic identity with cross-agent privilege inheritance",
      },
    },
  },
  {
    id: "OB",
    name: "Observability & Governance",
    abbreviation: "OB",
    description:
      "Level of monitoring, logging, auditing, and governance controls applied to the agent's operations and decisions.",
    levels: {
      none: {
        value: 0,
        label: "None",
        description: "Comprehensive monitoring and governance in place",
      },
      low: { value: 0.25, label: "Low", description: "Good logging with some monitoring gaps" },
      medium: {
        value: 0.5,
        label: "Medium",
        description: "Basic logging, limited real-time monitoring",
      },
      high: { value: 0.75, label: "High", description: "Minimal logging, no real-time monitoring" },
      critical: {
        value: 1.0,
        label: "Critical",
        description: "No logging, monitoring, or governance controls",
      },
    },
  },
];

export const coreRiskScores: CoreRiskScore[] = [
  {
    rank: 1,
    name: "Agentic AI Tool Misuse",
    asiCode: "ASI02",
    cvssBase: 9.3,
    aars: 7.75,
    threatMultiplier: 1.31,
    aivssScore: 10.0,
    severity: "Critical",
    factorValues: {
      AU: "high",
      TI: "critical",
      MU: "medium",
      CA: "high",
      MA: "high",
      PP: "high",
      EI: "critical",
      SC: "high",
      ID: "high",
      OB: "high",
    },
  },
  {
    rank: 2,
    name: "Agent Access Control Violation",
    asiCode: "ASI03",
    cvssBase: 9.1,
    aars: 7.5,
    threatMultiplier: 1.3,
    aivssScore: 10.0,
    severity: "Critical",
    factorValues: {
      AU: "high",
      TI: "high",
      MU: "high",
      CA: "high",
      MA: "high",
      PP: "medium",
      EI: "high",
      SC: "medium",
      ID: "critical",
      OB: "high",
    },
  },
  {
    rank: 3,
    name: "Agent Cascading Failures",
    asiCode: "ASI08",
    cvssBase: 8.7,
    aars: 7.75,
    threatMultiplier: 1.31,
    aivssScore: 10.0,
    severity: "Critical",
    factorValues: {
      AU: "high",
      TI: "high",
      MU: "high",
      CA: "high",
      MA: "critical",
      PP: "high",
      EI: "high",
      SC: "high",
      ID: "medium",
      OB: "high",
    },
  },
  {
    rank: 4,
    name: "Agent Orchestration and Multi-Agent Exploitation",
    asiCode: "ASI07",
    cvssBase: 8.7,
    aars: 7.5,
    threatMultiplier: 1.3,
    aivssScore: 10.0,
    severity: "Critical",
    factorValues: {
      AU: "high",
      TI: "high",
      MU: "high",
      CA: "high",
      MA: "critical",
      PP: "high",
      EI: "high",
      SC: "medium",
      ID: "high",
      OB: "medium",
    },
  },
  {
    rank: 5,
    name: "Agent Identity Impersonation",
    asiCode: "ASI03",
    cvssBase: 8.6,
    aars: 7.0,
    threatMultiplier: 1.28,
    aivssScore: 10.0,
    severity: "Critical",
    factorValues: {
      AU: "high",
      TI: "medium",
      MU: "medium",
      CA: "high",
      MA: "high",
      PP: "medium",
      EI: "high",
      SC: "medium",
      ID: "critical",
      OB: "high",
    },
  },
  {
    rank: 6,
    name: "Agent Memory and Context Manipulation",
    asiCode: "ASI06",
    cvssBase: 8.2,
    aars: 7.25,
    threatMultiplier: 1.29,
    aivssScore: 10.0,
    severity: "Critical",
    factorValues: {
      AU: "high",
      TI: "medium",
      MU: "critical",
      CA: "critical",
      MA: "high",
      PP: "high",
      EI: "medium",
      SC: "medium",
      ID: "medium",
      OB: "high",
    },
  },
  {
    rank: 7,
    name: "Insecure Agent Critical Systems Interaction",
    asiCode: "ASI05",
    cvssBase: 9.0,
    aars: 6.75,
    threatMultiplier: 1.27,
    aivssScore: 10.0,
    severity: "Critical",
    factorValues: {
      AU: "high",
      TI: "critical",
      MU: "medium",
      CA: "high",
      MA: "medium",
      PP: "medium",
      EI: "critical",
      SC: "medium",
      ID: "medium",
      OB: "medium",
    },
  },
  {
    rank: 8,
    name: "Agent Supply Chain and Dependency Attacks",
    asiCode: "ASI04",
    cvssBase: 8.1,
    aars: 6.75,
    threatMultiplier: 1.27,
    aivssScore: 10.0,
    severity: "Critical",
    factorValues: {
      AU: "medium",
      TI: "high",
      MU: "medium",
      CA: "medium",
      MA: "medium",
      PP: "medium",
      EI: "high",
      SC: "critical",
      ID: "medium",
      OB: "high",
    },
  },
  {
    rank: 9,
    name: "Agent Untraceability",
    asiCode: "ASI09",
    cvssBase: 7.5,
    aars: 7.0,
    threatMultiplier: 1.28,
    aivssScore: 9.6,
    severity: "Critical",
    factorValues: {
      AU: "high",
      TI: "medium",
      MU: "high",
      CA: "high",
      MA: "medium",
      PP: "high",
      EI: "medium",
      SC: "medium",
      ID: "medium",
      OB: "critical",
    },
  },
  {
    rank: 10,
    name: "Agent Goal and Instruction Manipulation",
    asiCode: "ASI01",
    cvssBase: 8.5,
    aars: 6.5,
    threatMultiplier: 1.26,
    aivssScore: 10.0,
    severity: "Critical",
    factorValues: {
      AU: "high",
      TI: "medium",
      MU: "high",
      CA: "high",
      MA: "medium",
      PP: "high",
      EI: "medium",
      SC: "low",
      ID: "medium",
      OB: "medium",
    },
  },
];

export function calculateAARS(factorValues: Record<string, string>): number {
  let totalWeight = 0;
  let weightedSum = 0;

  for (const factor of agenticRiskFactors) {
    const level = factorValues[factor.id] as keyof AgenticRiskFactor["levels"] | undefined;
    if (level && factor.levels[level]) {
      const value = factor.levels[level].value;
      weightedSum += value * 10;
      totalWeight += 1;
    }
  }

  if (totalWeight === 0) return 0;
  return Math.round((weightedSum / totalWeight) * 100) / 100;
}

export function calculateThreatMultiplier(aars: number): number {
  const thm = 1 + aars / 25;
  return Math.round(thm * 100) / 100;
}

export function calculateAIVSS(cvssBase: number, aars: number): number {
  const thm = calculateThreatMultiplier(aars);
  const raw = cvssBase * thm;
  return Math.min(10.0, Math.round(raw * 10) / 10);
}

export function getSeverityLabel(score: number): CoreRiskScore["severity"] {
  if (score >= 9.0) return "Critical";
  if (score >= 7.0) return "High";
  if (score >= 4.0) return "Medium";
  return "Low";
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case "Critical":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    case "High":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
    case "Medium":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
    case "Low":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
  }
}

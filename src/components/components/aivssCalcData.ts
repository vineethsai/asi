/**
 * OWASP AIVSS (AI Vulnerability Scoring System) — Agentic AI Core Security Risks, v0.8.
 *
 * Source: "AIVSS Scoring System For OWASP Agentic AI Core Security Risks v0.8"
 * (published 2026-03-19, https://aivss.owasp.org/). Factor names, the 3-point scale,
 * the AARS / AIVSS equations, Threat Multiplier (Table 4a), Mitigation Factor (Table 4b),
 * severity bands (§3.5.2), the §3.6 worked examples (Table 5) and the Appendix B ASI
 * mapping are taken from that document. Factor and level descriptions are paraphrased.
 *
 * The whole model lives in this file so that moving to a newer AIVSS release is a data change.
 */

export interface AivssSource {
  name: string;
  version: string;
  url: string;
  retrievedAt: string;
}

export const source: AivssSource = {
  name: "OWASP AIVSS",
  version: "0.8",
  url: "https://aivss.owasp.org/",
  retrievedAt: "2026-11-03",
};

/** Exploit maturity code used to pick the Threat Multiplier (v0.8 Table 4a). */
export type ExploitMaturity = "A" | "P" | "U";

/** Mitigation strength used to pick the Mitigation Factor (v0.8 Table 4b). */
export type MitigationStrength = "none" | "partial" | "strong";

/** The v0.8 3-point factor scale (Table 1). */
export type FactorLevelKey = "none" | "partial" | "full";

export interface FactorLevel {
  value: number;
  label: string;
  description: string;
}

export interface AgenticRiskFactor {
  /** Stable short id used in factor vectors and saved calculator state. */
  id: string;
  /** Full factor name as written in AIVSS v0.8 §2.2. */
  name: string;
  /** Short name used by the v0.8 rubric and formula (e.g. "Autonomy"). */
  shortName: string;
  abbreviation: string;
  /** Position in the v0.8 calculation vector (1–10). */
  order: number;
  description: string;
  /** Operational question the assessor answers (v0.8 Table 2, paraphrased). */
  question: string;
  levels: {
    none: FactorLevel;
    partial: FactorLevel;
    full: FactorLevel;
  };
}

export interface CoreRiskScore {
  rank: number;
  /** Stable slug for the core risk. */
  id: string;
  /** Exact v0.8 core risk name. */
  name: string;
  /** v0.8 section of the worked example, e.g. "3.6.1". */
  section: string;
  /** Primary ASI code (first of `asiCodes`). Kept for existing consumers. */
  asiCode: string;
  /** Every ASI entry that lists this risk in v0.8 Appendix B: primary mappings first, then secondary. */
  asiCodes: string[];
  /** ASI entries that list this risk as their PRIMARY AIVSS core risk (may be empty). */
  asiPrimary: string[];
  cvssBase: number;
  cvssVector: string;
  factorSum: number;
  /** Unrounded AARS as printed in the v0.8 worked example. */
  aars: number;
  threatMultiplier: number;
  mitigationFactor: number;
  aivssScore: number;
  severity: "Critical" | "High" | "Medium" | "Low";
  /** Factor levels keyed by `AgenticRiskFactor.id`; recomputes to `aivssScore`. */
  factorValues: Record<string, string>;
  method: string;
}

export const DEFAULT_THREAT_MULTIPLIER = 0.97;
export const DEFAULT_MITIGATION_FACTOR = 1.0;

export const AIVSS_MODEL = {
  id: "aivss-v0.8",
  version: "0.8",
  name: "OWASP AIVSS (Agentic AI Core Security Risks) v0.8",
  shortLabel: "AIVSS v0.8",
  published: "2026-03-19",
  url: "https://aivss.owasp.org/",
  pdfUrl:
    "https://aivss.owasp.org/assets/publications/AIVSS%20Scoring%20System%20For%20OWASP%20Agentic%20AI%20Core%20Security%20Risks%20v0.8.pdf",
  cvssVersion: "4.0",
  factorScale: [0, 0.5, 1.0],
  formula: {
    factorSum: "Factor_Sum = sum of the 10 agentic risk amplification factors (0–10)",
    aars: "AARS = (10 − CVSS_Base) × (Factor_Sum / 10) × ThM",
    aivss: "AIVSS = RoundHalfUp((CVSS_Base + AARS) × Mitigation_Factor, 1)",
  },
  threatMultipliers: [
    {
      id: "A" as ExploitMaturity,
      label: "Attacked",
      value: 1.0,
      description: "Actively exploited in the wild",
    },
    {
      id: "P" as ExploitMaturity,
      label: "Proof-of-Concept",
      value: 0.97,
      default: true,
      description: "Functional exploit code or a detailed walkthrough exists",
    },
    {
      id: "U" as ExploitMaturity,
      label: "Unreported",
      value: 0.5,
      description: "No known exploit; theoretical only",
    },
  ],
  mitigationFactors: [
    {
      id: "none" as MitigationStrength,
      label: "No/Weak Mitigation",
      value: 1.0,
      default: true,
      description: "Mitigations are absent or ineffective",
    },
    {
      id: "partial" as MitigationStrength,
      label: "Partial Mitigation",
      value: 0.83,
      description: "Mitigations exist but are incomplete, not reliably enforced, or unvalidated",
    },
    {
      id: "strong" as MitigationStrength,
      label: "Strong Mitigation",
      value: 0.67,
      description: "Validated, consistently enforceable mitigations (fail-closed where applicable)",
    },
  ],
  severityBands: [
    { label: "Critical" as const, min: 9.0, max: 10.0 },
    { label: "High" as const, min: 7.0, max: 8.9 },
    { label: "Medium" as const, min: 4.0, max: 6.9 },
    { label: "Low" as const, min: 0.1, max: 3.9 },
  ],
  notes: [
    "AIVSS v0.8 (PDF, 2026-03-19) is the newest AIVSS release with a published specification and formula; it is the model implemented here.",
    "AIVSS requires a CVSS v4.0 base score; CVSS v3.1 scores must not be used as input.",
    "Scores are ordinal: interpret findings by severity band and do not average scores across findings (v0.8 §3.2).",
    "The 0.67 mitigation-factor floor is described by v0.8 as a provisional value open to community calibration.",
    "aivss.owasp.org also hosts an 'AIVSS 1.0' reference calculator (https://aivss.owasp.org/calculator/, added 2026-10-22). It uses a different lookup-table model (vector AIVSS:1.0/LC/CP/AP/RH/ES) whose specification has not been published yet; the project has announced the official v1.0 launch for the end of 2026. It is not implemented here.",
  ],
} as const;

export const agenticRiskFactors: AgenticRiskFactor[] = [
  {
    id: "AU",
    name: "Execution Autonomy",
    shortName: "Autonomy",
    abbreviation: "AU",
    order: 1,
    description: "Ability to execute actions without human verification.",
    question: "Can the agent commit actions without a human co-sign?",
    levels: {
      none: {
        value: 0,
        label: "None",
        description: "No autonomous commits; a human is always in the loop",
      },
      partial: {
        value: 0.5,
        label: "Partial",
        description: "Autonomous only in sandboxed or non-critical paths",
      },
      full: {
        value: 1,
        label: "Full",
        description: "Autonomous commits in production or critical systems",
      },
    },
  },
  {
    id: "TC",
    name: "External Tool Control Surface",
    shortName: "Tools",
    abbreviation: "TC",
    order: 2,
    description: "Breadth and privilege of the external APIs and tools the agent can use.",
    question: "How broad and privileged are the agent's external tools and APIs?",
    levels: {
      none: { value: 0, label: "None", description: "Read-only tools or no external access" },
      partial: {
        value: 0.5,
        label: "Partial",
        description: "Mixed read/write, but tightly scoped or allowlisted",
      },
      full: {
        value: 1,
        label: "Full",
        description: "Broad, high-authority tools (cloud, CI/CD, SQL, OT)",
      },
    },
  },
  {
    id: "NL",
    name: "Natural Language Interface",
    shortName: "Language",
    abbreviation: "NL",
    order: 3,
    description: "Reliance on unstructured natural language for goals and instructions.",
    question: "Does natural language drive the agent's control logic?",
    levels: {
      none: {
        value: 0,
        label: "None",
        description: "Structured API inputs only; no NL in control logic",
      },
      partial: {
        value: 0.5,
        label: "Partial",
        description: "NL used for retrieval or Q&A, not for execution",
      },
      full: {
        value: 1,
        label: "Full",
        description: "NL prompts directly drive planning and tool execution",
      },
    },
  },
  {
    id: "CX",
    name: "Contextual Awareness",
    shortName: "Context",
    abbreviation: "CX",
    order: 4,
    description: "Use of environmental sensors or broad data context to drive decisions.",
    question: "Does sensor or environment state decide the agent's actions?",
    levels: {
      none: {
        value: 0,
        label: "None",
        description: "No environmental context; operates in a vacuum",
      },
      partial: {
        value: 0.5,
        label: "Partial",
        description: "Narrow signals only (e.g. a specific user location)",
      },
      full: {
        value: 1,
        label: "Full",
        description: "Broad environmental signals drive autonomous decisions",
      },
    },
  },
  {
    id: "ND",
    name: "Behavioral Non-Determinism",
    shortName: "Non-Determinism",
    abbreviation: "ND",
    order: 5,
    description: "Variance in output or action for identical inputs.",
    question: "Can output variance change outcomes?",
    levels: {
      none: { value: 0, label: "None", description: "Deterministic (rule-based or fixed seed)" },
      partial: {
        value: 0.5,
        label: "Partial",
        description: "Bounded variance with strict guardrails",
      },
      full: {
        value: 1,
        label: "Full",
        description: "High variance, weak guards, probabilistic logic",
      },
    },
  },
  {
    id: "OP",
    name: "Opacity & Reflexivity",
    shortName: "Opacity",
    abbreviation: "OP",
    order: 6,
    description: "Lack of internal visibility or of the ability to audit decision logic.",
    question: "Can the agent's reasoning and actions be introspected and traced?",
    levels: {
      none: { value: 0, label: "None", description: "Full traceability; deterministic logging" },
      partial: {
        value: 0.5,
        label: "Partial",
        description: "Partial or fragmented logs; black-box reasoning",
      },
      full: {
        value: 1,
        label: "Full",
        description: "Low visibility; cannot trace why an action was taken",
      },
    },
  },
  {
    id: "PS",
    name: "Persistent State Retention",
    shortName: "Persistence",
    abbreviation: "PS",
    order: 7,
    description: "Ability to retain memory or state across sessions.",
    question: "How much memory does the agent retain?",
    levels: {
      none: { value: 0, label: "None", description: "No memory (stateless)" },
      partial: { value: 0.5, label: "Partial", description: "Ephemeral, session-only memory" },
      full: {
        value: 1,
        label: "Full",
        description: "Long-term memory (e.g. vector DB) persists across sessions",
      },
    },
  },
  {
    id: "ID",
    name: "Dynamic Identity",
    shortName: "Identity",
    abbreviation: "ID",
    order: 8,
    description: "Ability to assume different user roles or permissions at runtime.",
    question: "Can the agent's role or identity change at runtime?",
    levels: {
      none: { value: 0, label: "None", description: "Fixed identity or service account" },
      partial: {
        value: 0.5,
        label: "Partial",
        description: "Limited swaps (e.g. scoped per specific tool)",
      },
      full: {
        value: 1,
        label: "Full",
        description: "Can assume roles or cross tenant boundaries dynamically",
      },
    },
  },
  {
    id: "MA",
    name: "Multi-Agent Interactions",
    shortName: "Multi-Agent",
    abbreviation: "MA",
    order: 9,
    description: "Coordination with, or dependencies on, other autonomous agents.",
    question: "Does the agent coordinate with other agents or services?",
    levels: {
      none: { value: 0, label: "None", description: "Isolated instance" },
      partial: {
        value: 0.5,
        label: "Partial",
        description: "Limited coordination with one or two known agents",
      },
      full: {
        value: 1,
        label: "Full",
        description: "Complex orchestration, swarm or market-based patterns",
      },
    },
  },
  {
    id: "SM",
    name: "Self-Modification",
    shortName: "Self-Mod",
    abbreviation: "SM",
    order: 10,
    description: "Ability to alter its own code, prompts or tool configuration.",
    question: "Can the agent change its own goals, tools or code?",
    levels: {
      none: { value: 0, label: "None", description: "Static configuration" },
      partial: {
        value: 0.5,
        label: "Partial",
        description: "Can update its own system prompts or configuration only",
      },
      full: {
        value: 1,
        label: "Full",
        description: "Can alter tools or control flow, or generate and execute code",
      },
    },
  },
];

/** The 10 canonical OWASP AIVSS v0.8 core risk names (§3.6.1–§3.6.10 order). */
export const AIVSS_CORE_RISK_NAMES = [
  "Agentic AI Tool Misuse",
  "Agent Access Control Violation",
  "Agent Cascading Failures",
  "Agent Orchestration and Multi-Agent Exploitation",
  "Agent Identity Impersonation",
  "Agent Memory and Context Manipulation",
  "Insecure Agent Critical Systems Interaction",
  "Agent Supply Chain and Dependency Risk",
  "Agent Untraceability",
  "Agent Goal and Instruction Manipulation",
] as const;

export type AivssCoreRiskName = (typeof AIVSS_CORE_RISK_NAMES)[number];

/** OWASP AIVSS v0.8 Appendix B: ASI Top 10 (2026) → primary / secondary AIVSS core risks. */
export const AIVSS_ASI_MAPPING: Record<
  "ASI01" | "ASI02" | "ASI03" | "ASI04" | "ASI05" | "ASI06" | "ASI07" | "ASI08" | "ASI09" | "ASI10",
  { primary: AivssCoreRiskName[]; secondary: AivssCoreRiskName[] }
> = {
  ASI01: {
    primary: ["Agent Goal and Instruction Manipulation"],
    secondary: [
      "Agent Memory and Context Manipulation",
      "Insecure Agent Critical Systems Interaction",
    ],
  },
  ASI02: {
    primary: ["Agentic AI Tool Misuse"],
    secondary: [
      "Agent Orchestration and Multi-Agent Exploitation",
      "Insecure Agent Critical Systems Interaction",
    ],
  },
  ASI03: {
    primary: ["Agent Access Control Violation"],
    secondary: ["Agent Identity Impersonation", "Agent Untraceability"],
  },
  ASI04: {
    primary: ["Agent Supply Chain and Dependency Risk"],
    secondary: ["Agentic AI Tool Misuse", "Agent Orchestration and Multi-Agent Exploitation"],
  },
  ASI05: {
    primary: ["Agentic AI Tool Misuse"],
    secondary: ["Agent Access Control Violation", "Insecure Agent Critical Systems Interaction"],
  },
  ASI06: {
    primary: ["Agent Memory and Context Manipulation"],
    secondary: ["Agent Goal and Instruction Manipulation", "Agent Cascading Failures"],
  },
  ASI07: {
    primary: ["Agent Orchestration and Multi-Agent Exploitation"],
    secondary: ["Agent Access Control Violation", "Agent Identity Impersonation"],
  },
  ASI08: {
    primary: ["Agent Cascading Failures"],
    secondary: [
      "Agent Orchestration and Multi-Agent Exploitation",
      "Agent Memory and Context Manipulation",
    ],
  },
  ASI09: {
    primary: ["Agent Identity Impersonation"],
    secondary: ["Agent Goal and Instruction Manipulation", "Agent Access Control Violation"],
  },
  ASI10: {
    primary: ["Agent Access Control Violation"],
    secondary: ["Agent Untraceability", "Agent Goal and Instruction Manipulation"],
  },
};

const WORKED_EXAMPLE_METHOD = "OWASP AIVSS v0.8 §3.6 worked example (Table 5)";

/** Builds a factor-level map from the v0.8 vector order [AU, TC, NL, CX, ND, OP, PS, ID, MA, SM]. */
function vectorToLevels(values: number[]): Record<string, string> {
  const levels: Record<string, string> = {};
  agenticRiskFactors.forEach((factor, index) => {
    const value = values[index] ?? 0;
    levels[factor.id] = value >= 1 ? "full" : value >= 0.5 ? "partial" : "none";
  });
  return levels;
}

/**
 * OWASP AIVSS v0.8 §3.6 worked examples (Table 5), sorted by AIVSS score (ties keep §3.6 order).
 * All examples use ThM = 0.97 (Proof-of-Concept) and Mitigation_Factor = 1.0.
 */
export const coreRiskScores: CoreRiskScore[] = [
  {
    rank: 1,
    id: "orchestration-multi-agent-exploitation",
    name: "Agent Orchestration and Multi-Agent Exploitation",
    section: "3.6.4",
    asiCode: "ASI07",
    asiCodes: ["ASI07", "ASI02", "ASI04", "ASI08"],
    asiPrimary: ["ASI07"],
    cvssBase: 9.4,
    cvssVector: "CVSS:4.0/AV:A/AC:L/AT:N/PR:L/UI:N/VC:H/VI:H/VA:H/SC:H/SI:H/SA:H",
    factorSum: 9.5,
    aars: 0.5529,
    threatMultiplier: 0.97,
    mitigationFactor: 1.0,
    aivssScore: 10.0,
    severity: "Critical",
    factorValues: vectorToLevels([1, 1, 1, 1, 1, 1, 1, 1, 1, 0.5]),
    method: WORKED_EXAMPLE_METHOD,
  },
  {
    rank: 2,
    id: "tool-misuse",
    name: "Agentic AI Tool Misuse",
    section: "3.6.1",
    asiCode: "ASI02",
    asiCodes: ["ASI02", "ASI05", "ASI04"],
    asiPrimary: ["ASI02", "ASI05"],
    cvssBase: 9.4,
    cvssVector: "CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:A/VC:H/VI:H/VA:H/SC:H/SI:H/SA:H",
    factorSum: 9.0,
    aars: 0.5238,
    threatMultiplier: 0.97,
    mitigationFactor: 1.0,
    aivssScore: 9.9,
    severity: "Critical",
    factorValues: vectorToLevels([1, 1, 1, 1, 1, 1, 0.5, 1, 1, 0.5]),
    method: WORKED_EXAMPLE_METHOD,
  },
  {
    rank: 3,
    id: "access-control-violation",
    name: "Agent Access Control Violation",
    section: "3.6.2",
    asiCode: "ASI03",
    asiCodes: ["ASI03", "ASI10", "ASI05", "ASI07", "ASI09"],
    asiPrimary: ["ASI03", "ASI10"],
    cvssBase: 8.7,
    cvssVector: "CVSS:4.0/AV:N/AC:L/AT:N/PR:L/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N",
    factorSum: 8.0,
    aars: 1.0088,
    threatMultiplier: 0.97,
    mitigationFactor: 1.0,
    aivssScore: 9.7,
    severity: "Critical",
    factorValues: vectorToLevels([1, 1, 1, 1, 0.5, 1, 1, 1, 0.5, 0]),
    method: WORKED_EXAMPLE_METHOD,
  },
  {
    rank: 4,
    id: "supply-chain-dependency-risk",
    name: "Agent Supply Chain and Dependency Risk",
    section: "3.6.8",
    asiCode: "ASI04",
    asiCodes: ["ASI04"],
    asiPrimary: ["ASI04"],
    cvssBase: 9.3,
    cvssVector: "CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N",
    factorSum: 6.5,
    aars: 0.44135,
    threatMultiplier: 0.97,
    mitigationFactor: 1.0,
    aivssScore: 9.7,
    severity: "Critical",
    factorValues: vectorToLevels([1, 1, 0, 0, 1, 1, 0.5, 1, 1, 0]),
    method: WORKED_EXAMPLE_METHOD,
  },
  {
    rank: 5,
    id: "cascading-failures",
    name: "Agent Cascading Failures",
    section: "3.6.3",
    asiCode: "ASI08",
    asiCodes: ["ASI08", "ASI06"],
    asiPrimary: ["ASI08"],
    cvssBase: 7.1,
    cvssVector: "CVSS:4.0/AV:N/AC:H/AT:N/PR:L/UI:N/VC:N/VI:N/VA:H/SC:N/SI:H/SA:H",
    factorSum: 8.0,
    aars: 2.2504,
    threatMultiplier: 0.97,
    mitigationFactor: 1.0,
    aivssScore: 9.4,
    severity: "Critical",
    factorValues: vectorToLevels([1, 0.5, 1, 1, 1, 1, 0.5, 0.5, 1, 0.5]),
    method: WORKED_EXAMPLE_METHOD,
  },
  {
    rank: 6,
    id: "identity-impersonation",
    name: "Agent Identity Impersonation",
    section: "3.6.5",
    asiCode: "ASI09",
    asiCodes: ["ASI09", "ASI03", "ASI07"],
    asiPrimary: ["ASI09"],
    cvssBase: 7.4,
    cvssVector: "CVSS:4.0/AV:N/AC:H/AT:N/PR:N/UI:A/VC:H/VI:H/VA:N/SC:N/SI:N/SA:N",
    factorSum: 7.5,
    aars: 1.8915,
    threatMultiplier: 0.97,
    mitigationFactor: 1.0,
    aivssScore: 9.3,
    severity: "Critical",
    factorValues: vectorToLevels([1, 1, 1, 1, 1, 1, 0, 1, 0.5, 0]),
    method: WORKED_EXAMPLE_METHOD,
  },
  {
    rank: 7,
    id: "critical-systems-interaction",
    name: "Insecure Agent Critical Systems Interaction",
    section: "3.6.7",
    // No ASI entry lists this risk as primary; ASI05 (Unexpected Code Execution) is the most
    // specific of the three entries that list it as secondary.
    asiCode: "ASI05",
    asiCodes: ["ASI05", "ASI01", "ASI02"],
    asiPrimary: [],
    cvssBase: 6.9,
    cvssVector: "CVSS:4.0/AV:A/AC:L/AT:N/PR:H/UI:N/VC:N/VI:H/VA:H/SC:N/SI:N/SA:N",
    factorSum: 7.5,
    aars: 2.25525,
    threatMultiplier: 0.97,
    mitigationFactor: 1.0,
    aivssScore: 9.2,
    severity: "Critical",
    factorValues: vectorToLevels([1, 1, 0.5, 1, 0.5, 1, 0.5, 0, 1, 1]),
    method: WORKED_EXAMPLE_METHOD,
  },
  {
    rank: 8,
    id: "memory-context-manipulation",
    name: "Agent Memory and Context Manipulation",
    section: "3.6.6",
    asiCode: "ASI06",
    asiCodes: ["ASI06", "ASI01", "ASI08"],
    asiPrimary: ["ASI06"],
    cvssBase: 5.8,
    cvssVector: "CVSS:4.0/AV:A/AC:H/AT:N/PR:H/UI:N/VC:L/VI:H/VA:L/SC:N/SI:N/SA:N",
    factorSum: 7.5,
    aars: 3.0555,
    threatMultiplier: 0.97,
    mitigationFactor: 1.0,
    aivssScore: 8.9,
    severity: "High",
    factorValues: vectorToLevels([1, 0.5, 1, 1, 0.5, 1, 1, 0, 0.5, 1]),
    method: WORKED_EXAMPLE_METHOD,
  },
  {
    rank: 9,
    id: "untraceability",
    name: "Agent Untraceability",
    section: "3.6.9",
    // No ASI entry lists this risk as primary; v0.8 Appendix B lists it as secondary for ASI03 and
    // ASI10 and describes ASI10 (Rogue Agents) as emerging from traceability failures.
    asiCode: "ASI10",
    asiCodes: ["ASI10", "ASI03"],
    asiPrimary: [],
    cvssBase: 5.3,
    cvssVector: "CVSS:4.0/AV:N/AC:L/AT:N/PR:L/UI:N/VC:N/VI:L/VA:N/SC:N/SI:N/SA:N",
    factorSum: 6.5,
    aars: 2.96335,
    threatMultiplier: 0.97,
    mitigationFactor: 1.0,
    aivssScore: 8.3,
    severity: "High",
    factorValues: vectorToLevels([1, 1, 0, 0, 1, 1, 0.5, 0.5, 1, 0.5]),
    method: WORKED_EXAMPLE_METHOD,
  },
  {
    rank: 10,
    id: "goal-instruction-manipulation",
    name: "Agent Goal and Instruction Manipulation",
    section: "3.6.10",
    asiCode: "ASI01",
    asiCodes: ["ASI01", "ASI06", "ASI09", "ASI10"],
    asiPrimary: ["ASI01"],
    cvssBase: 2.1,
    cvssVector: "CVSS:4.0/AV:N/AC:H/AT:N/PR:N/UI:A/VC:L/VI:L/VA:N/SC:N/SI:N/SA:N",
    factorSum: 6.5,
    aars: 4.98095,
    threatMultiplier: 0.97,
    mitigationFactor: 1.0,
    aivssScore: 7.1,
    severity: "High",
    factorValues: vectorToLevels([0.5, 0, 1, 1, 1, 1, 1, 0, 0, 1]),
    method: WORKED_EXAMPLE_METHOD,
  },
];

/**
 * Historical: the published OWASP AIVSS v0.5 (2025-07) §4.3 "Final Ranking by AIVSS Score".
 * v0.5 used a different formula; kept for reference only, not used by the calculator.
 */
export const AIVSS_V05_RANKING = {
  version: "0.5",
  published: "2025-07-28",
  historical: true,
  rows: [
    { rank: 1, name: "Agentic AI Tool Misuse", score: 8.7 },
    { rank: 2, name: "Agent Access Control Violation", score: 7.6 },
    { rank: 3, name: "Agent Orchestration & Multi-Agent Exploitation", score: 7.2 },
    { rank: 4, name: "Agent Cascading Failures", score: 7.1 },
    { rank: 5, name: "Agent Identity Impersonation", score: 6.3 },
    { rank: 6, name: "Insecure Agent Critical Systems Interaction", score: 5.8 },
    { rank: 7, name: "Agent Memory and Context Manipulation", score: 5.7 },
    { rank: 8, name: "Agent Supply Chain and Dependency Attacks", score: 5.0 },
    { rank: 9, name: "Agent Untraceability", score: 4.8 },
    { rank: 10, name: "Agent Goal and Instruction Manipulation", score: 3.0 },
  ],
} as const;

/** Round half up to `decimals` places, tolerant of binary floating-point error (8.65 → 8.7). */
export function roundHalfUp(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round(Number((value * factor).toFixed(8))) / factor;
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(10, Math.max(0, value));
}

/** Numeric value (0 / 0.5 / 1) of a factor level; unknown factors or levels count as 0. */
export function getFactorValue(factorId: string, level: string | undefined): number {
  const factor = agenticRiskFactors.find((f) => f.id === factorId);
  if (!factor || !level) return 0;
  return factor.levels[level as FactorLevelKey]?.value ?? 0;
}

/** Factor_Sum: sum of the 10 factor values (0–10). */
export function calculateFactorSum(factorValues: Record<string, string>): number {
  return agenticRiskFactors.reduce(
    (sum, factor) => sum + getFactorValue(factor.id, factorValues[factor.id]),
    0,
  );
}

/** Threat Multiplier (ThM) for an exploit maturity (v0.8 Table 4a). Defaults to PoC (0.97). */
export function calculateThreatMultiplier(exploitMaturity: ExploitMaturity = "P"): number {
  return (
    AIVSS_MODEL.threatMultipliers.find((t) => t.id === exploitMaturity)?.value ??
    DEFAULT_THREAT_MULTIPLIER
  );
}

/** Mitigation_Factor for a mitigation strength (v0.8 Table 4b). Defaults to No/Weak (1.0). */
export function getMitigationFactor(strength: MitigationStrength = "none"): number {
  return (
    AIVSS_MODEL.mitigationFactors.find((m) => m.id === strength)?.value ?? DEFAULT_MITIGATION_FACTOR
  );
}

/** AARS = (10 − CVSS_Base) × (Factor_Sum / 10) × ThM. Returned unrounded (intermediate value). */
export function calculateAARS(
  cvssBase: number,
  factorValues: Record<string, string>,
  thm: number = DEFAULT_THREAT_MULTIPLIER,
): number {
  const base = clampScore(cvssBase);
  return (10 - base) * (calculateFactorSum(factorValues) / 10) * thm;
}

/** AIVSS = RoundHalfUp((CVSS_Base + AARS) × Mitigation_Factor, 1), clamped to 0–10. */
export function calculateAIVSS(
  cvssBase: number,
  aars: number,
  mitigationFactor: number = DEFAULT_MITIGATION_FACTOR,
): number {
  return roundHalfUp(clampScore((clampScore(cvssBase) + aars) * mitigationFactor), 1);
}

export interface AivssScoreInput {
  cvssBase: number;
  factorValues: Record<string, string>;
  exploitMaturity?: ExploitMaturity;
  mitigation?: MitigationStrength;
}

export interface AivssScoreResult {
  model: typeof AIVSS_MODEL.id;
  cvssBase: number;
  factorSum: number;
  threatMultiplier: number;
  mitigationFactor: number;
  aars: number;
  aivssScore: number;
  severity: CoreRiskScore["severity"];
}

/** Full v0.8 scoring pipeline with every intermediate value. */
export function scoreAIVSS(input: AivssScoreInput): AivssScoreResult {
  const cvssBase = clampScore(input.cvssBase);
  const threatMultiplier = calculateThreatMultiplier(input.exploitMaturity);
  const mitigationFactor = getMitigationFactor(input.mitigation);
  const factorSum = calculateFactorSum(input.factorValues);
  const aars = calculateAARS(cvssBase, input.factorValues, threatMultiplier);
  const aivssScore = calculateAIVSS(cvssBase, aars, mitigationFactor);
  return {
    model: AIVSS_MODEL.id,
    cvssBase,
    factorSum,
    threatMultiplier,
    mitigationFactor,
    aars,
    aivssScore,
    severity: getSeverityLabel(aivssScore),
  };
}

/** v0.8 severity bands (§3.5.2). A score of 0.0 is reported as "Low". */
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

import taxonomyRaw from "./cisco_taxonomy.json";

/**
 * Cisco AI Security and Safety Taxonomy — v2 (2.0.0, announced 2026-09-09).
 *
 * `cisco_taxonomy.json` is the public machine-readable snapshot Cisco ships in
 * cisco-ai-defense/skill-scanner (Apache-2.0), converted to this site's schema:
 * all codes, names, definitions and mappings are verbatim; `objective_group`
 * (not present in the public file) is taken from Cisco's public Taxonomy
 * Navigator. v2 replaces v1 (Dec 2025, arXiv 2512.12921); old v1 links resolve
 * through `CISCO_V1_DEPRECATED`.
 */

export interface AISubTechnique {
  code: string;
  description: string;
  definition: string;
  mappings: string[];
}

export interface AITechnique {
  code: string;
  description: string;
  definition: string;
  mappings: string[];
  ai_subtech: AISubTechnique[];
}

export interface ObjectiveGroup {
  code: string;
  description: string;
  objective_group: string;
  definition: string;
  mappings: string[];
  ai_tech: AITechnique[];
}

const rawData = taxonomyRaw as Record<string, unknown>;

/** Taxonomy version string from the data file, e.g. "2.0.0". */
export const CISCO_TAXONOMY_VERSION: string = String(rawData.version ?? "unknown");

export const source = {
  name: "Cisco AI Security and Safety Taxonomy",
  version: CISCO_TAXONOMY_VERSION,
  url: "https://blogs.cisco.com/ai/security-framework-v2",
  dataUrl:
    "https://raw.githubusercontent.com/cisco-ai-defense/skill-scanner/55b3a8baebf615c8c7e02a2dca117b6c53d78ff0/skill_scanner/data/taxonomy/cisco_ai_taxonomy.json",
  retrievedAt: "2026-11-03",
};

function parseObjectiveGroups(): ObjectiveGroup[] {
  const groups: ObjectiveGroup[] = [];
  for (const key of Object.keys(rawData)) {
    if (!/^OB-\d+$/.test(key)) continue;
    const entry = rawData[key] as ObjectiveGroup;
    groups.push({
      code: entry.code,
      description: entry.description,
      objective_group: entry.objective_group,
      definition: entry.definition,
      mappings: entry.mappings || [],
      ai_tech: (entry.ai_tech || []).map((tech) => ({
        code: tech.code,
        description: tech.description,
        definition: tech.definition,
        mappings: tech.mappings || [],
        ai_subtech: (tech.ai_subtech || []).map((sub) => ({
          code: sub.code,
          description: sub.description,
          definition: sub.definition,
          mappings: sub.mappings || [],
        })),
      })),
    });
  }
  return groups;
}

export const ciscoTaxonomyData: ObjectiveGroup[] = parseObjectiveGroups();

export interface CiscoDeprecation {
  /** v1 code (objective, technique or sub-technique). */
  v1: string;
  /** v1 name, for display on old links. */
  v1Name: string;
  /** Best v2 target(s); the first one is used by `CISCO_V1_DEPRECATED`. */
  v2: string[];
  /**
   * identity = same definition under a new code; official = stated by Cisco
   * (v2 announcement / v2 definitions); inferred = this site's judgement
   * (Cisco publishes no v1→v2 crosswalk).
   */
  basis: "identity" | "official" | "inferred";
  /** True when the v1 code still exists in v2 with a DIFFERENT meaning. */
  reused: boolean;
  note: string;
}

/**
 * v1 codes whose meaning moved in v2. Codes not listed kept their code and name
 * (definitions identical; mappings updated, mainly OWASP LLM Top 10 2025 → 2026).
 */
export const CISCO_V1_DEPRECATIONS: CiscoDeprecation[] = [
  {
    v1: "OB-002",
    v1Name: "Jailbreak",
    v2: ["OB-001"],
    basis: "official",
    reused: true,
    note: "Jailbreak folded into OB-001 Goal Hijacking; OB-002 is now Agentic Autonomy Failures.",
  },
  {
    v1: "AITech-2.1",
    v1Name: "Jailbreak",
    v2: ["AITech-1.1"],
    basis: "official",
    reused: true,
    note: "Now AITech-1.1 Direct Prompt Injection and Jailbreak; AITech-2.1 is now Excessive Agency.",
  },
  {
    v1: "AISubtech-2.1.1",
    v1Name: "Context Manipulation (Jailbreak)",
    v2: ["AISubtech-1.1.5"],
    basis: "inferred",
    reused: true,
    note: "AISubtech-2.1.1 is now Execution Approval Bypass.",
  },
  {
    v1: "AISubtech-2.1.2",
    v1Name: "Obfuscation (Jailbreak)",
    v2: ["AISubtech-1.1.2"],
    basis: "inferred",
    reused: true,
    note: "AISubtech-2.1.2 is now Capability and Permission Overreach.",
  },
  {
    v1: "AISubtech-2.1.3",
    v1Name: "Semantic Manipulation (Jailbreak)",
    v2: ["AISubtech-1.1.5"],
    basis: "inferred",
    reused: false,
    note: "Adversarial argumentation is covered by Context Manipulation.",
  },
  {
    v1: "AISubtech-2.1.4",
    v1Name: "Token Exploitation (Jailbreak)",
    v2: ["AISubtech-1.1.4"],
    basis: "inferred",
    reused: false,
    note: "",
  },
  {
    v1: "AISubtech-2.1.5",
    v1Name: "Multi-Agent Jailbreak Collaboration",
    v2: ["AISubtech-1.1.3"],
    basis: "inferred",
    reused: false,
    note: "Now Multi-Agent Propagation.",
  },
  {
    v1: "AITech-1.3",
    v1Name: "Goal Manipulation",
    v2: ["AITech-1.1", "AITech-1.2"],
    basis: "inferred",
    reused: true,
    note: "Attacker-driven goal change stays in OB-001; self-originated drift is AITech-2.2 Goal Drift. AITech-1.3 is now Multimodal Injection and Manipulation.",
  },
  {
    v1: "AISubtech-1.3.1",
    v1Name: "Goal Manipulation (Models, Agents)",
    v2: ["AITech-1.1"],
    basis: "inferred",
    reused: true,
    note: "AISubtech-1.3.1 is now Image-Text Injection.",
  },
  {
    v1: "AISubtech-1.3.2",
    v1Name: "Goal Manipulation (Tools, Prompts, Resources)",
    v2: ["AITech-1.2", "AISubtech-12.1.2"],
    basis: "inferred",
    reused: true,
    note: "Redirection via compromised tools/resources: Indirect Prompt Injection or Tool Poisoning. AISubtech-1.3.2 is now Image Manipulation.",
  },
  {
    v1: "AITech-1.4",
    v1Name: "Multi-Modal Injection and Manipulation",
    v2: ["AITech-1.3"],
    basis: "identity",
    reused: false,
    note: "Renumbered.",
  },
  {
    v1: "AISubtech-1.4.1",
    v1Name: "Image-Text Injection",
    v2: ["AISubtech-1.3.1"],
    basis: "identity",
    reused: false,
    note: "Renumbered.",
  },
  {
    v1: "AISubtech-1.4.2",
    v1Name: "Image Manipulation",
    v2: ["AISubtech-1.3.2"],
    basis: "identity",
    reused: false,
    note: "Renumbered.",
  },
  {
    v1: "AISubtech-1.4.3",
    v1Name: "Audio Command Injection",
    v2: ["AISubtech-1.3.3"],
    basis: "identity",
    reused: false,
    note: "Renumbered.",
  },
  {
    v1: "AISubtech-1.4.4",
    v1Name: "Video Overlay Manipulation",
    v2: ["AISubtech-1.3.4"],
    basis: "identity",
    reused: false,
    note: "Renumbered.",
  },
  {
    v1: "AISubtech-1.2.1",
    v1Name: "Instruction Manipulation (Indirect Prompt Injection)",
    v2: ["AITech-1.2"],
    basis: "inferred",
    reused: false,
    note: "v2 AITech-1.2 has no sub-techniques.",
  },
  {
    v1: "AISubtech-1.2.2",
    v1Name: "Obfuscation (Indirect Prompt Injection)",
    v2: ["AITech-1.2"],
    basis: "inferred",
    reused: false,
    note: "v2 AITech-1.2 has no sub-techniques.",
  },
  {
    v1: "AISubtech-1.2.3",
    v1Name: "Multi-Agent (Indirect Prompt Injection)",
    v2: ["AITech-1.2", "AISubtech-1.1.3"],
    basis: "inferred",
    reused: false,
    note: "Multi-agent propagation is AISubtech-1.1.3.",
  },
  {
    v1: "AISubtech-15.1.25",
    v1Name: "Privacy Attacks: PII / PHI / PCI",
    v2: ["AITech-8.5", "AITech-8.6", "AITech-8.7"],
    basis: "official",
    reused: true,
    note: "Moved under OB-008 Data and Privacy Violations; AISubtech-15.1.25 is now General Harms.",
  },
];

/** v1 code → best v2 code, for resolving old links (`?entry=OB-002` meant Jailbreak in v1). */
export const CISCO_V1_DEPRECATED: Record<string, string> = Object.fromEntries(
  CISCO_V1_DEPRECATIONS.map((d) => [d.v1, d.v2[0]]),
);

/** Codes that exist in both versions but mean something different in v2. */
export const CISCO_V1_REUSED_CODES: string[] = CISCO_V1_DEPRECATIONS.filter((d) => d.reused).map(
  (d) => d.v1,
);

export function getTaxonomyStats() {
  let totalTechniques = 0;
  let totalSubTechniques = 0;
  for (const og of ciscoTaxonomyData) {
    totalTechniques += og.ai_tech.length;
    for (const tech of og.ai_tech) {
      totalSubTechniques += tech.ai_subtech.length;
    }
  }
  return {
    objectiveGroups: ciscoTaxonomyData.length,
    techniques: totalTechniques,
    subTechniques: totalSubTechniques,
  };
}

/** Find an objective, technique or sub-technique by code (v2 codes). */
export function findCiscoNode(
  code: string,
): ObjectiveGroup | AITechnique | AISubTechnique | undefined {
  for (const og of ciscoTaxonomyData) {
    if (og.code === code) return og;
    for (const tech of og.ai_tech) {
      if (tech.code === code) return tech;
      const sub = tech.ai_subtech.find((s) => s.code === code);
      if (sub) return sub;
    }
  }
  return undefined;
}

/** OB codes whose techniques/sub-techniques carry an "OWASP: ASIxx" mapping, per ASI id. */
export function getCiscoObjectivesByAsi(): Record<string, string[]> {
  const out: Record<string, Set<string>> = {};
  for (const og of ciscoTaxonomyData) {
    for (const tech of og.ai_tech) {
      for (const node of [tech, ...tech.ai_subtech]) {
        for (const mapping of node.mappings) {
          const m = mapping.match(/^OWASP:\s*(ASI\d{2})\b/);
          if (m) (out[m[1]] ??= new Set()).add(og.code);
        }
      }
    }
  }
  return Object.fromEntries(Object.entries(out).map(([asi, set]) => [asi, [...set].sort()]));
}

/**
 * OWASP Top 10 for LLM Applications id (e.g. "LLM01") → Cisco objectives whose techniques or
 * sub-techniques carry an "OWASP: LLMxx:<edition>" mapping in Cisco's own data (sorted).
 */
export function getCiscoObjectivesByLlm(edition = "2026"): Record<string, string[]> {
  const out: Record<string, Set<string>> = {};
  const re = new RegExp(`^OWASP:\\s*(LLM\\d{2}):${edition}\\b`);
  for (const og of ciscoTaxonomyData) {
    for (const tech of og.ai_tech) {
      for (const node of [tech, ...tech.ai_subtech]) {
        for (const mapping of node.mappings) {
          const m = mapping.match(re);
          if (m) (out[m[1]] ??= new Set()).add(og.code);
        }
      }
    }
  }
  return Object.fromEntries(Object.entries(out).map(([id, set]) => [id, [...set].sort()]));
}

export function parseMappingBadge(mapping: string): {
  framework: string;
  code: string;
  label: string;
} {
  const parts = mapping.split(": ");
  if (parts.length >= 2) {
    const framework = parts[0].trim();
    const rest = parts.slice(1).join(": ").trim();
    const codeParts = rest.split(": ");
    return {
      framework,
      code: codeParts[0]?.trim() || rest,
      label: codeParts.length > 1 ? codeParts.slice(1).join(": ").trim() : rest,
    };
  }
  return { framework: "Other", code: mapping, label: mapping };
}

export function getMappingColor(framework: string): string {
  switch (framework) {
    case "OWASP":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
    case "MITRE ATLAS":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    case "MITRE ATT&CK":
      return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300";
    case "NIST AML":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    case "Cisco AI MDL Code":
      return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
  }
}

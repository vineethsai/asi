import taxonomyRaw from "./cisco_taxonomy.json";

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

export type ObjectiveCategory =
  | "Common Manipulation Risks"
  | "Data-Related Risks"
  | "Downstream / Impact Risks";

export const objectiveCategoryColors: Record<ObjectiveCategory, string> = {
  "Common Manipulation Risks": "#ef4444",
  "Data-Related Risks": "#f59e0b",
  "Downstream / Impact Risks": "#8b5cf6",
};

const rawData = taxonomyRaw as Record<string, unknown>;

function parseObjectiveGroups(): ObjectiveGroup[] {
  const groups: ObjectiveGroup[] = [];
  for (const key of Object.keys(rawData)) {
    if (key === "version") continue;
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

export const ciscoTaxonomyVersion: string = (rawData as Record<string, string>).version || "1.0.0";

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

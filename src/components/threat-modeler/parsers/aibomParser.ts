/**
 * Parser for Cisco AI BOM (AIBOM) JSON output.
 *
 * Reads the structured JSON report produced by `cisco-aibom analyze` and
 * converts it into a normalised ParseResult for the threat modeler.
 *
 * @see https://github.com/cisco-ai-defense/aibom
 */

import type { ParseResult, ParsedComponent, ParsedConnection, ParsedComponentType } from "./types";

// Categories that AIBOM produces – mapped to our internal type system.
const AIBOM_CATEGORY_MAP: Record<string, ParsedComponentType> = {
  model: "model",
  agent: "agent",
  tool: "tool",
  prompt: "prompt",
  embedding: "embedding",
  memory: "memory",
  datastore: "datastore",
  guardrail: "guardrail",
  mcp: "mcp",
};

/**
 * Shorten fully-qualified Python class names to the final segment.
 * e.g. `langchain_community.llms.openai.OpenAI` → `OpenAI`
 */
function shortenName(raw: string): string {
  if (!raw) return "Unnamed";
  const parts = raw.split(".");
  return parts[parts.length - 1] || raw;
}

/**
 * Deduplicate component names by appending a counter when collisions occur.
 */
function deduplicateNames(components: ParsedComponent[]): ParsedComponent[] {
  const seen = new Map<string, number>();
  return components.map((c) => {
    const count = seen.get(c.name) ?? 0;
    seen.set(c.name, count + 1);
    if (count > 0) {
      return { ...c, name: `${c.name} (${count + 1})` };
    }
    return c;
  });
}

/**
 * Extract metadata keys from an AIBOM component entry.
 */
function extractMetadata(entry: Record<string, unknown>): Record<string, string> {
  const meta: Record<string, string> = {};
  if (entry.file_path) meta.filePath = String(entry.file_path);
  if (entry.line_number != null) meta.lineNumber = String(entry.line_number);
  if (entry.model_name) meta.modelName = String(entry.model_name);
  if (entry.description) meta.description = String(entry.description);
  if (entry.text) meta.promptText = String(entry.text).slice(0, 200);
  if (entry.decorated_by) meta.decoratedBy = String(entry.decorated_by);
  if (entry.framework) meta.framework = String(entry.framework);
  return meta;
}

/**
 * Parse a Cisco AIBOM JSON report into a normalised ParseResult.
 *
 * Accepts the raw JSON object (already parsed by the caller via JSON.parse).
 */
export function parseAibomReport(json: unknown): ParseResult {
  const warnings: string[] = [];
  const components: ParsedComponent[] = [];
  const connections: ParsedConnection[] = [];

  if (!json || typeof json !== "object") {
    return { components, connections, warnings: ["Invalid JSON: expected an object"] };
  }

  const root = json as Record<string, unknown>;

  // The AIBOM output wraps everything under `aibom_analysis`
  const analysis = root.aibom_analysis as Record<string, unknown> | undefined;
  if (!analysis) {
    return {
      components,
      connections,
      warnings: ['Missing "aibom_analysis" root key. Is this a Cisco AIBOM report?'],
    };
  }

  const sources = analysis.sources as Record<string, unknown> | undefined;
  if (!sources || typeof sources !== "object") {
    return { components, connections, warnings: ['No "sources" found inside aibom_analysis'] };
  }

  const usedKeys = new Set<string>();

  // Iterate over every source (e.g. a scanned file / project)
  for (const [sourceName, sourceData] of Object.entries(sources)) {
    if (!sourceData || typeof sourceData !== "object") continue;
    const source = sourceData as Record<string, unknown>;
    // P3-19: relationships resolve by instance id (or by the ORIGINAL name, per source)
    // before display names are de-duplicated by renaming.
    const byInstance = new Map<string, string>();
    const byName = new Map<string, string[]>();

    // --- Components ---
    const comps = source.components as Record<string, unknown[]> | undefined;
    if (comps && typeof comps === "object") {
      for (const [category, entries] of Object.entries(comps)) {
        if (!Array.isArray(entries)) continue;
        const mappedType: ParsedComponentType =
          AIBOM_CATEGORY_MAP[category.toLowerCase()] ?? "other";
        if (mappedType === "other" && category.toLowerCase() !== "other") {
          warnings.push(
            `Unrecognized AIBOM category "${category}" in source "${sourceName}" – mapped as "other"`,
          );
        }
        entries.forEach((entry, i) => {
          if (!entry || typeof entry !== "object") return;
          const record = entry as Record<string, unknown>;
          const rawName = String(
            record.name ?? record.class_name ?? record.instance_id ?? "Unknown",
          );
          const name = shortenName(rawName);
          let key = `${sourceName}::${record.instance_id ?? `${category}:${i}`}`;
          if (usedKeys.has(key)) key = `${key}#${category}:${i}`;
          usedKeys.add(key);
          if (record.instance_id != null) byInstance.set(String(record.instance_id), key);
          for (const n of new Set([name, rawName])) byName.set(n, [...(byName.get(n) ?? []), key]);
          components.push({
            key,
            name,
            type: mappedType,
            metadata: {
              ...extractMetadata(record),
              source: sourceName,
              originalCategory: category,
            },
          });
        });
      }
    }

    // --- Relationships ---
    const rels = source.relationships as unknown[] | undefined;
    if (Array.isArray(rels)) {
      const resolve = (instance: unknown, name: unknown): string | undefined => {
        if (instance != null && byInstance.has(String(instance)))
          return byInstance.get(String(instance));
        if (name == null) return undefined;
        const keys = byName.get(String(name)) ?? byName.get(shortenName(String(name)));
        if (keys && keys.length > 1)
          warnings.push(
            `Relationship endpoint "${String(name)}" is ambiguous in "${sourceName}"; using the first match`,
          );
        return keys?.[0];
      };
      for (const rel of rels) {
        if (!rel || typeof rel !== "object") continue;
        const r = rel as Record<string, unknown>;
        const sourceKey = resolve(r.source_instance_id, r.source_name);
        const targetKey = resolve(r.target_instance_id, r.target_name);
        const label = String(r.label ?? r.relationship_type ?? "RELATED");
        if (sourceKey && targetKey) {
          connections.push({
            source: shortenName(String(r.source_name ?? r.source_instance_id ?? "")),
            target: shortenName(String(r.target_name ?? r.target_instance_id ?? "")),
            sourceKey,
            targetKey,
            label,
          });
        } else {
          warnings.push(`Skipped relationship with an unknown endpoint in "${sourceName}"`);
        }
      }
    }
  }

  // Deduplicate display names (keys stay unique and unchanged)
  const deduped = deduplicateNames(components);
  const nameByKey = new Map(deduped.map((c) => [c.key!, c.name]));
  for (const c of connections) {
    c.source = nameByKey.get(c.sourceKey!) ?? c.source;
    c.target = nameByKey.get(c.targetKey!) ?? c.target;
  }

  if (deduped.length === 0) {
    warnings.push(
      "No components were found in the AIBOM report. Ensure the report was generated with `cisco-aibom analyze`.",
    );
  }

  return { components: deduped, connections, warnings };
}

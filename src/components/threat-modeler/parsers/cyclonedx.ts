/**
 * CycloneDX 1.6 ML-BOM import (P3-44): `components[]` (machine-learning-model,
 * data, application, framework, library, service …), `services[]` and
 * `dependencies[]` become a ParseResult that `mapToCanvas` places on the
 * canvas. Connections resolve by `bom-ref`, never by name.
 */
import { z } from "zod";
import type { ParseResult, ParsedComponent, ParsedComponentType, ParsedConnection } from "./types";

const ComponentSchema = z.looseObject({
  "bom-ref": z.string().optional(),
  type: z.string(),
  name: z.string(),
  version: z.string().optional(),
  description: z.string().optional(),
  group: z.string().optional(),
  purl: z.string().optional(),
  hashes: z.array(z.looseObject({ alg: z.string(), content: z.string() })).optional(),
  modelCard: z.looseObject({}).optional(),
  data: z.array(z.looseObject({})).optional(),
  components: z.array(z.looseObject({})).optional(),
});

const ServiceSchema = z.looseObject({
  "bom-ref": z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  endpoints: z.array(z.string()).optional(),
  authenticated: z.boolean().optional(),
  "x-trust-boundary": z.boolean().optional(),
});

export const CycloneDxSchema = z.looseObject({
  bomFormat: z.literal("CycloneDX"),
  specVersion: z.string(),
  metadata: z.looseObject({ component: ComponentSchema.optional() }).optional(),
  components: z.array(ComponentSchema).optional(),
  services: z.array(ServiceSchema).optional(),
  dependencies: z
    .array(z.looseObject({ ref: z.string(), dependsOn: z.array(z.string()).optional() }))
    .optional(),
});

export function isCycloneDx(json: unknown): boolean {
  return (
    !!json &&
    typeof json === "object" &&
    (json as { bomFormat?: unknown }).bomFormat === "CycloneDX"
  );
}

function typeFor(c: z.infer<typeof ComponentSchema>): ParsedComponentType {
  const t = c.type.toLowerCase();
  const name = `${c.name} ${c.description ?? ""}`.toLowerCase();
  if (t === "machine-learning-model") return /embed/.test(name) ? "embedding" : "model";
  if (t === "data") return "datastore";
  if (t === "application" && /agent/.test(name)) return "agent";
  if (/\bmcp\b|model context protocol/.test(name)) return "mcp";
  if (/guardrail|moderation|safety filter/.test(name)) return "guardrail";
  if (/vector|chroma|pinecone|weaviate|qdrant|faiss|memory/.test(name)) return "memory";
  if (t === "application") return "agent";
  return "other";
}

export function parseCycloneDx(json: unknown): ParseResult {
  const parsed = CycloneDxSchema.safeParse(json);
  if (!parsed.success) {
    return {
      components: [],
      connections: [],
      warnings: [
        `Not a valid CycloneDX BOM: ${parsed.error.issues[0]?.path.join(".")} ${parsed.error.issues[0]?.message}`,
      ],
    };
  }
  const bom = parsed.data;
  const warnings: string[] = [];
  if (!/^1\.[4-7]$/.test(bom.specVersion))
    warnings.push(`CycloneDX ${bom.specVersion}: tested with 1.6`);
  const components: ParsedComponent[] = [];
  const keys = new Set<string>();
  const names = new Map<string, number>();
  const add = (
    key: string,
    name: string,
    type: ParsedComponentType,
    metadata: Record<string, string>,
  ) => {
    if (keys.has(key)) return;
    keys.add(key);
    const n = (names.get(name) ?? 0) + 1;
    names.set(name, n);
    components.push({ key, name: n === 1 ? name : `${name} (${n})`, type, metadata });
  };

  const flat: z.infer<typeof ComponentSchema>[] = [];
  const walk = (list?: z.infer<typeof ComponentSchema>[]) => {
    for (const c of list ?? []) {
      flat.push(c);
      walk(c.components as z.infer<typeof ComponentSchema>[] | undefined);
    }
  };
  walk(bom.components);
  flat.forEach((c, i) => {
    const key = c["bom-ref"] ?? `component-${i}`;
    const meta: Record<string, string> = { cyclonedxType: c.type };
    if (c.version) meta.version = c.version;
    if (c.purl) meta.purl = c.purl;
    if (c.description) meta.description = c.description;
    if (c.hashes?.length)
      meta.hashes = c.hashes.map((h) => `${h.alg}:${h.content.slice(0, 12)}`).join(", ");
    if (c.modelCard) meta.modelCard = "present";
    add(key, c.group ? `${c.group}/${c.name}` : c.name, typeFor(c), meta);
  });
  (bom.services ?? []).forEach((s, i) => {
    const key = s["bom-ref"] ?? `service-${i}`;
    const meta: Record<string, string> = { cyclonedxType: "service" };
    if (s.endpoints?.length) meta.endpoints = s.endpoints.join(", ");
    if (s.authenticated !== undefined) meta.authenticated = String(s.authenticated);
    if (s["x-trust-boundary"] !== undefined) meta.trustBoundary = String(s["x-trust-boundary"]);
    add(key, s.name, /\bmcp\b/i.test(s.name) ? "mcp" : "tool", meta);
  });

  const nameOf = new Map(components.map((c) => [c.key!, c.name]));
  const connections: ParsedConnection[] = [];
  for (const d of bom.dependencies ?? []) {
    if (!nameOf.has(d.ref)) continue;
    for (const target of d.dependsOn ?? []) {
      if (!nameOf.has(target)) {
        warnings.push(`Dependency ${d.ref} → ${target}: unknown bom-ref`);
        continue;
      }
      connections.push({
        source: nameOf.get(d.ref)!,
        target: nameOf.get(target)!,
        sourceKey: d.ref,
        targetKey: target,
        label: "DEPENDS_ON",
      });
    }
  }
  if (components.length === 0) warnings.push("The BOM lists no components or services.");
  return { components, connections, warnings };
}

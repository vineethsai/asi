import { KC, KC_ORDER, type KcId } from "@/data/kc";
import { SEMANTIC_TYPES, nodeDataFor } from "./semanticTypes";
import type { CanvasNodeData, CustomComponentDefinition } from "./types";
import { LEGACY_GROUPS, type LegacyItem } from "./paletteCatalog";

/**
 * Palette catalogue (P3-32). Groups follow the official OWASP KC taxonomy from
 * `@/data/kc` (P1-05 / A5); agentic primitives from SEMANTIC_TYPES come first.
 * Sub-groups (e.g. "Read-only tools") keep their own labels but sit under the
 * official KC heading. Every entry carries the node data a drop creates, the
 * metadata chips the palette shows and a one-line "why it matters".
 */

export type PaletteNodeType =
  | "agentComponent"
  | "actor"
  | "dataStore"
  | "trustBoundary"
  | "customComponent";

export interface PaletteEntry {
  id: string;
  label: string;
  /** One line: why this component matters for the threat model. */
  why: string;
  nodeType: PaletteNodeType;
  /** Node data a fresh drop gets (threats are filled by the analysis). */
  data: CanvasNodeData;
  /** Metadata chips (access mode, sensitivity, semantics …). */
  chips: string[];
  /** Icon registry key (src/lib/icons.ts). */
  icon: string;
  /** Sub-group label inside its group, e.g. "Read-only tools". */
  subgroup?: string;
  /** Custom component id (custom group only). */
  customId?: string;
}

export interface PaletteSection {
  id: string;
  label: string;
  /** Official KC code when the section is a KC group. */
  kc?: KcId;
  description: string;
  color: string;
  icon: string;
  entries: PaletteEntry[];
}

/** Old palette group id → official KC section and sub-group label. */
const GROUP_MAP: Record<string, { section: KcId | "dfd"; subgroup?: string }> = {
  kc1: { section: "kc1" },
  kc2: { section: "kc2" },
  kc3: { section: "kc3" },
  kc4: { section: "kc4" },
  kc5: { section: "kc5", subgroup: "Tools & MCP" },
  "kc5-ro": { section: "kc5", subgroup: "Read-only tools" },
  "kc5-rw": { section: "kc5", subgroup: "Read-write tools" },
  "kc5-exec": { section: "kc5", subgroup: "Execute tools" },
  "kc5-ext": { section: "kc5", subgroup: "External APIs" },
  kc6: { section: "kc6" },
  dfd: { section: "dfd" },
};

const WHY: Record<string, string> = {
  "kc1-llm": "Follows instructions found anywhere in its context window.",
  "kc1-embedding": "Poisoned or swapped embeddings silently change what retrieval returns.",
  "kc2-agent": "Plans and acts on untrusted input; the main target of goal hijacking.",
  "kc2-orchestrator": "Delegates work; one compromised plan cascades to every worker.",
  "kc3-rag": "Retrieved documents are an indirect prompt-injection channel.",
  "kc3-cot": "Reasoning traces can be steered or leak sensitive context.",
  "kc3-prompt": "Templates mix trusted instructions with untrusted variables.",
  "kc3-system-prompt": "Leaked or overridden system prompts remove the agent's guardrails.",
  "kc3-user-prompt": "User-controlled text is the direct prompt-injection entry point.",
  "kc3-few-shot": "Poisoned examples bias every completion that uses them.",
  "kc3-fn-call": "Schemas decide which arguments reach tools; loose ones enable misuse.",
  "kc3-guardrail": "Filters inputs/outputs; lowers injection likelihood on paths through it.",
  "kc4-memory": "Persisted context; poisoned entries steer future sessions.",
  "kc4-vectordb": "Shared retrieval store; writes from untrusted sources poison answers.",
  "kc4-knowledge": "Trusted facts the agent repeats; tampering spreads misinformation.",
  "kc5-tool": "Every tool call turns model output into a real-world action.",
  "kc5-mcp": "Third-party tool server; a supply-chain and tool-misuse surface.",
  "kc5-file-reader": "Read access still exfiltrates data when the agent is hijacked.",
  "kc5-web-scraper": "Fetched pages carry indirect prompt injection.",
  "kc5-search": "Search results are attacker-influenced content.",
  "kc5-db-query": "Over-broad queries leak records across tenants.",
  "kc5-db-rw": "Writes let a hijacked agent corrupt or delete data.",
  "kc5-file-mgr": "File writes can plant payloads or overwrite configuration.",
  "kc5-crm-api": "Customer records: PII exposure and unauthorised updates.",
  "kc5-code-interpreter": "Executes generated code; needs sandboxing and approval.",
  "kc5-shell": "Arbitrary command execution on the host.",
  "kc5-sandbox": "Contains code execution if the sandbox holds.",
  "kc5-email": "Sends data out of the system; a classic exfiltration channel.",
  "kc5-payment": "Irreversible financial actions; requires human approval.",
  "kc5-deploy": "Changes production; one bad call is an outage.",
  "kc6-infra": "Hosts the agents; compromise affects every workload on it.",
  "kc6-runtime": "Where tools execute; isolation decides the blast radius.",
  "dfd-user": "Where untrusted input enters the system.",
  "dfd-external": "Third-party system outside your control.",
  "dfd-datastore": "Holds data at rest; sensitivity drives impact.",
  "dfd-trust": "Groups components that share a trust level; flows across it are checked.",
};

const ICON_ALIASES: Record<string, string> = { "file-search": "file-search", pencil: "pencil" };

function chipsFor(item: LegacyItem): string[] {
  const chips: string[] = [];
  if (item.toolAccessMode) chips.push(item.toolAccessMode);
  if (item.toolRiskTier) chips.push(item.toolRiskTier);
  if (item.promptType) chips.push(`${item.promptType} prompt`);
  return chips;
}

function legacyEntry(item: LegacyItem, subgroup?: string): PaletteEntry {
  const data: CanvasNodeData = {
    label: item.label,
    description: item.description,
    category: item.category,
    componentId: item.componentId,
    maestroLayers: [...item.maestroLayers],
    trustLevel:
      item.category === "trust-boundary"
        ? "trusted"
        : item.category === "actor" || item.category === "external"
          ? "untrusted"
          : "semi-trusted",
    icon: item.icon,
    threats: [],
    ...(item.toolAccessMode ? { toolAccessMode: item.toolAccessMode } : {}),
    ...(item.toolRiskTier ? { toolRiskTier: item.toolRiskTier } : {}),
    ...(item.promptType ? { promptType: item.promptType } : {}),
    ...(item.id === "kc3-guardrail"
      ? {
          semantics: {
            kind: "guardrail" as const,
            guardrail: { coverage: ["input", "output"] as ("input" | "output")[] },
          },
        }
      : {}),
  };
  return {
    id: item.id,
    label: item.label,
    why: WHY[item.id] ?? item.description ?? "",
    nodeType: item.nodeType as PaletteNodeType,
    data,
    chips: chipsFor(item),
    icon: ICON_ALIASES[item.icon] ?? item.icon,
    subgroup,
  };
}

const AGENTIC_SECTION: PaletteSection = {
  id: "agentic",
  label: "Agentic",
  description:
    "Agentic primitives with engine-visible semantics: gates break propagation, scopes and provenance change severity.",
  color: "hsl(var(--primary))",
  icon: "bot",
  entries: SEMANTIC_TYPES.map((def) => ({
    id: def.id,
    label: def.label,
    why: def.why,
    nodeType: def.nodeType,
    data: nodeDataFor(def),
    chips: def.chips,
    icon: def.icon,
  })),
};

function buildSections(): PaletteSection[] {
  const byKc = new Map<string, PaletteEntry[]>();
  for (const g of LEGACY_GROUPS) {
    const map = GROUP_MAP[g.id] ?? { section: "dfd" as const };
    const list = byKc.get(map.section) ?? [];
    for (const item of g.items) list.push(legacyEntry(item, map.subgroup));
    byKc.set(map.section, list);
  }
  const kcSections: PaletteSection[] = KC_ORDER.map((id) => ({
    id,
    label: `${KC[id].code} · ${KC[id].name}`,
    kc: id,
    description: KC[id].description,
    color: KC[id].color,
    icon: KC[id].icon,
    entries: byKc.get(id) ?? [],
  }));
  const dfd: PaletteSection = {
    id: "dfd",
    label: "Data-flow primitives",
    description: "Actors, external systems, data stores and trust boundaries.",
    color: "hsl(var(--muted-foreground))",
    icon: "shield",
    entries: byKc.get("dfd") ?? [],
  };
  return [AGENTIC_SECTION, ...kcSections, dfd];
}

export const PALETTE_SECTIONS: PaletteSection[] = buildSections();

/** Palette entry for a custom component definition. */
export function customEntry(def: CustomComponentDefinition): PaletteEntry {
  return {
    id: `custom-${def.id}`,
    customId: def.id,
    label: def.name,
    why: def.description || "Custom component",
    nodeType: "customComponent",
    icon: def.icon || "box",
    chips: [
      `${def.customThreats?.length ?? 0} custom threat${def.customThreats?.length === 1 ? "" : "s"}`,
    ],
    data: {
      label: def.name,
      description: def.description,
      category: "custom",
      maestroLayers: [...def.maestroLayers],
      trustLevel: def.trustLevel,
      icon: def.icon,
      color: def.color,
      threats: [],
      isCustom: true,
      customThreatIds: def.customThreats?.map((t) => t.id) ?? [],
      customMetadata: { ...(def.metadata ?? {}) },
    },
  };
}

const ENTRY_INDEX = new Map(PALETTE_SECTIONS.flatMap((s) => s.entries.map((e) => [e.id, e])));

/** Look up a built-in or custom palette entry by id. */
export function findPaletteEntry(
  id: string,
  custom: CustomComponentDefinition[] = [],
): PaletteEntry | undefined {
  const hit = ENTRY_INDEX.get(id);
  if (hit) return hit;
  const def = custom.find((c) => `custom-${c.id}` === id);
  return def ? customEntry(def) : undefined;
}

/** Drag-and-drop MIME type used by the palette. */
export const PALETTE_DND_TYPE = "application/x-threat-modeler-entry";

/** Lower-case haystack for search across label, why, chips, KC and sub-group. */
export function entryHaystack(e: PaletteEntry, section?: PaletteSection): string {
  return [e.label, e.why, e.subgroup, ...e.chips, section?.label, e.data.componentId]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

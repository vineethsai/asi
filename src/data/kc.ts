/**
 * Canonical KC1–KC6 taxonomy (IMPROVEMENT_PLAN.md P1-05 / A5).
 *
 * Source of truth: the official OWASP "Securing Agentic Applications" key-component names as they
 * appear in src/components/components/frameworkData.ts (`parsedComponentsData`, which overwrites the
 * exported `frameworkData` titles at module load). Every page, the threat-modeler palette and the
 * guide must import names from here instead of re-declaring them.
 *
 * Dependency-free on purpose (no React, no lucide, no other modules) so scripts and workers can
 * import it. `icon` is a key for `getIcon()` in src/lib/icons.ts; `color` is a theme-aware CSS
 * colour string (CSS var `--kc-N` with a light-mode fallback), `colorHsl` holds the raw HSL
 * components for both themes.
 *
 * Usage:
 *   import { KC, KC_ORDER, kcLabel } from "@/data/kc";
 *   KC_ORDER.map((id) => <li key={id} style={{ color: KC[id].color }}>{kcLabel(KC[id].code)}</li>);
 */

export type KcId = "kc1" | "kc2" | "kc3" | "kc4" | "kc5" | "kc6";
export type KcCode = "KC1" | "KC2" | "KC3" | "KC4" | "KC5" | "KC6";

export interface KcEntry {
  code: KcCode;
  id: KcId;
  /** Official OWASP name, e.g. "Language Models (LLMs)". */
  name: string;
  /** Short label for chips / axis ticks. */
  short: string;
  description: string;
  /** Theme-aware CSS colour, e.g. "hsl(var(--kc-1, 217 91% 60%))". */
  color: string;
  /** CSS custom property name, e.g. "--kc-1". */
  colorVar: string;
  /** HSL components ("h s% l%") for light and dark themes (fallbacks for `colorVar`). */
  colorHsl: { light: string; dark: string };
  /** Icon registry key (src/lib/icons.ts). */
  icon: string;
  /** Primary MAESTRO layers (1–7) this component lives in. */
  maestroLayers: number[];
  /** Id of the matching top-level node in frameworkData.ts / componentDataMap.ts. */
  frameworkDataId: KcId;
}

const kcColor = (n: number, light: string) => `hsl(var(--kc-${n}, ${light}))`;

export const KC: Readonly<Record<KcId, KcEntry>> = {
  kc1: {
    code: "KC1",
    id: "kc1",
    name: "Language Models (LLMs)",
    short: "LLMs",
    description:
      'The core cognitive engine or "brain" of the agent (e.g., GPT-4, Claude), responsible for understanding, reasoning, planning, and generating responses. This includes various types of language models.',
    color: kcColor(1, "217 91% 60%"),
    colorVar: "--kc-1",
    colorHsl: { light: "217 91% 60%", dark: "213 94% 68%" },
    icon: "brain",
    maestroLayers: [1],
    frameworkDataId: "kc1",
  },
  kc2: {
    code: "KC2",
    id: "kc2",
    name: "Orchestration (Control Flow)",
    short: "Orchestration",
    description:
      "Mechanisms that dictate the agent's overall behavior, information flow, and decision-making processes. The specific mechanism depends on the architecture and impacts responsiveness and efficiency.",
    color: kcColor(2, "142 71% 45%"),
    colorVar: "--kc-2",
    colorHsl: { light: "142 71% 45%", dark: "142 69% 58%" },
    icon: "git-branch",
    maestroLayers: [3, 7],
    frameworkDataId: "kc2",
  },
  kc3: {
    code: "KC3",
    id: "kc3",
    name: "Reasoning / Planning Paradigm",
    short: "Reasoning",
    description:
      "How agents utilize LLMs to solve complex tasks requiring multiple steps and strategic thinking by breaking down high-level tasks into smaller sub-tasks.",
    color: kcColor(3, "45 93% 47%"),
    colorVar: "--kc-3",
    colorHsl: { light: "45 93% 47%", dark: "48 96% 53%" },
    icon: "lightbulb",
    maestroLayers: [3],
    frameworkDataId: "kc3",
  },
  kc4: {
    code: "KC4",
    id: "kc4",
    name: "Memory Modules",
    short: "Memory",
    description:
      "Enable the agent to retain short-term (immediate context) and long-term information (past interactions, knowledge) for coherent and personalized interactions. Context sensitivity is used to reduce risk. RAG with vector databases is common for long-term memory.",
    color: kcColor(4, "271 91% 65%"),
    colorVar: "--kc-4",
    colorHsl: { light: "271 91% 65%", dark: "270 95% 75%" },
    icon: "database",
    maestroLayers: [2],
    frameworkDataId: "kc4",
  },
  kc5: {
    code: "KC5",
    id: "kc5",
    name: "Tool Integration Frameworks",
    short: "Tools",
    description:
      "Allow agents to extend capabilities by using external tools (APIs, functions, data stores) to interact with the real world or other systems. Manages tool selection and use.",
    color: kcColor(5, "330 81% 60%"),
    colorVar: "--kc-5",
    colorHsl: { light: "330 81% 60%", dark: "330 81% 70%" },
    icon: "wrench",
    maestroLayers: [3, 4],
    frameworkDataId: "kc5",
  },
  kc6: {
    code: "KC6",
    id: "kc6",
    name: "Operational Environment (Agencies)",
    short: "Environment",
    description:
      "Manages the integration layer between AI agents and external tools, APIs, code execution environments, and database systems. Ensures secure invocation of tools with proper authentication, input validation, sandboxing, and output verification to prevent unauthorized access and tool misuse.",
    color: kcColor(6, "239 84% 67%"),
    colorVar: "--kc-6",
    colorHsl: { light: "239 84% 67%", dark: "234 89% 74%" },
    icon: "server",
    maestroLayers: [4, 7],
    frameworkDataId: "kc6",
  },
};

export const KC_ORDER: readonly KcId[] = ["kc1", "kc2", "kc3", "kc4", "kc5", "kc6"] as const;

/** All entries in KC1→KC6 order. */
export const KC_LIST: readonly KcEntry[] = KC_ORDER.map((id) => KC[id]);

/**
 * Look up a KC by code or id, tolerant of case, separators and sub-component suffixes:
 * "KC1", "kc1", "kc1.2", "kc1-2", "KC5 Read-Only Tools" → the KC1 / KC5 entry.
 */
export function kcByCode(codeOrId: string | null | undefined): KcEntry | undefined {
  const m = String(codeOrId ?? "").match(/kc\s*([1-6])/i);
  return m ? KC[`kc${m[1]}` as KcId] : undefined;
}

/** "KC1 · Language Models (LLMs)" (or the short form with `{ short: true }`). */
export function kcLabel(
  codeOrId: string,
  opts: { short?: boolean; separator?: string } = {},
): string {
  const kc = kcByCode(codeOrId);
  if (!kc) return String(codeOrId);
  return `${kc.code}${opts.separator ?? " · "}${opts.short ? kc.short : kc.name}`;
}

/** Normalise any KC reference to its id ("KC3" → "kc3"), or undefined. */
export function kcId(codeOrId: string | null | undefined): KcId | undefined {
  return kcByCode(codeOrId)?.id;
}

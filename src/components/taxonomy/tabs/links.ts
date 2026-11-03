/**
 * URL and mapping helpers for the Taxonomy tabs (no React; safe to import anywhere).
 */
import { FRAMEWORK_PALETTE, type PaletteToken } from "@/lib/palette";
import { ATLAS_NAMES, normaliseAtlasId } from "@/data/atlasCrosswalk";

/** In-app deep link to a Taxonomy tab entry (P1-11). */
export function taxonomyHref(tab: string, entry?: string | null): string {
  return `/taxonomy?tab=${tab}${entry ? `&entry=${encodeURIComponent(entry)}` : ""}`;
}

/** attack.mitre.org page for a technique id ("T1656" → …/T1656/, "T1059.001" → …/T1059/001/). */
export function attackUrl(id: string): string | undefined {
  const m = id.trim().match(/^T(\d{4})(?:\.(\d{3}))?$/);
  if (!m) return undefined;
  return `https://attack.mitre.org/techniques/T${m[1]}/${m[2] ? `${m[2]}/` : ""}`;
}

export type MappingFramework = "owasp" | "atlas" | "attack" | "nistaml" | "mdl" | "other";

export interface ParsedMapping {
  framework: MappingFramework;
  /** Group heading, e.g. "MITRE ATLAS". */
  frameworkLabel: string;
  /** Code as shown on the chip ("ASI01", "AML.T0051", "T1656", "LLM01:2026"). */
  code: string;
  /** Human label, when the mapping string carries one (ATLAS: official 2026.10 name). */
  label?: string;
  /** In-app route. */
  to?: string;
  /** External URL. */
  href?: string;
  /** Accent for the chip. */
  tone?: PaletteToken;
}

const FRAMEWORK_LABEL: Record<MappingFramework, string> = {
  owasp: "OWASP",
  atlas: "MITRE ATLAS",
  attack: "MITRE ATT&CK",
  nistaml: "NIST AML",
  mdl: "Cisco AI MDL",
  other: "Other",
};

/** Display order of mapping groups on Cisco technique rows. */
export const MAPPING_ORDER: MappingFramework[] = [
  "owasp",
  "atlas",
  "attack",
  "nistaml",
  "mdl",
  "other",
];

/**
 * Parse one Cisco mapping string ("MITRE ATLAS: AML.T0051: LLM Prompt Injection",
 * "OWASP: ASI01: Agent Goal Hijack", "MITRE ATT&CK: T1656: Impersonation", …).
 * Returns null for "N/A" entries.
 */
export function parseCiscoMapping(raw: string): ParsedMapping | null {
  const parts = raw.split(": ");
  const fw = (parts[0] ?? "").trim();
  const code = (parts[1] ?? "").trim();
  const label = parts.slice(2).join(": ").trim() || undefined;
  if (!code || /^N\/A$/i.test(code)) return null;
  switch (fw) {
    case "OWASP": {
      const isAsi = /^ASI\d{2}$/.test(code);
      // "LLM01:2026" → the LLM Top 10 tab (2025 ids resolve to their 2026 entry there).
      const llm = code.match(/^(LLM\d{2})(?::\d{4})?$/);
      return {
        framework: "owasp",
        frameworkLabel: FRAMEWORK_LABEL.owasp,
        code,
        label,
        to: isAsi
          ? taxonomyHref("owasp-agentic", code)
          : llm
            ? taxonomyHref("llm-top10", code)
            : undefined,
        tone: isAsi ? FRAMEWORK_PALETTE.asi : undefined,
      };
    }
    case "MITRE ATLAS": {
      const id = normaliseAtlasId(code);
      if (!id) return null;
      return {
        framework: "atlas",
        frameworkLabel: FRAMEWORK_LABEL.atlas,
        code: id,
        label: ATLAS_NAMES[id] ?? label,
        to: taxonomyHref("atlas", id),
        tone: FRAMEWORK_PALETTE.nist,
      };
    }
    case "MITRE ATT&CK":
      return {
        framework: "attack",
        frameworkLabel: FRAMEWORK_LABEL.attack,
        code,
        label,
        href: attackUrl(code),
      };
    case "NIST AML":
      return { framework: "nistaml", frameworkLabel: FRAMEWORK_LABEL.nistaml, code, label };
    case "Cisco AI MDL Code":
      return { framework: "mdl", frameworkLabel: FRAMEWORK_LABEL.mdl, code, label };
    default:
      return { framework: "other", frameworkLabel: fw || FRAMEWORK_LABEL.other, code, label };
  }
}

/** Parse, de-duplicate and group mapping strings by framework (in MAPPING_ORDER). */
export function groupCiscoMappings(
  mappings: readonly string[],
): { framework: MappingFramework; label: string; items: ParsedMapping[] }[] {
  const groups = new Map<MappingFramework, Map<string, ParsedMapping>>();
  for (const raw of mappings) {
    const p = parseCiscoMapping(raw);
    if (!p) continue;
    let g = groups.get(p.framework);
    if (!g) groups.set(p.framework, (g = new Map()));
    if (!g.has(p.code)) g.set(p.code, p);
  }
  return MAPPING_ORDER.filter((fw) => groups.has(fw)).map((fw) => {
    const items = [...groups.get(fw)!.values()];
    return { framework: fw, label: items[0].frameworkLabel, items };
  });
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2025-12" or "2026-03-19" → "Dec 2025" / "Mar 2026" (locale-independent). */
export function formatYearMonth(value: string): string {
  const m = value.match(/^(\d{4})-(\d{2})/);
  const month = m ? MONTHS[Number(m[2]) - 1] : undefined;
  return m && month ? `${month} ${m[1]}` : value;
}

/** Copy text to the clipboard (async API with a hidden-textarea fallback). */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the textarea fallback
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Framework groups of the cross-framework views (Sankey, interconnection map, density matrix).
 * Kept apart from crosswalkGraph.ts (which builds the graph from every data module) so light
 * consumers such as the Home / About site stats can count frameworks without the data.
 */
import { FRAMEWORK_PALETTE, type FrameworkId } from "@/lib/palette";

export type CrosswalkFramework = Extract<
  FrameworkId,
  "asi" | "tm" | "cisco" | "aivss" | "aiuc1" | "llm"
>;

export interface CrosswalkGroup {
  id: CrosswalkFramework;
  label: string;
  short: string;
  /** Taxonomy tab for the framework ("overview" for the T&M threat catalog → /threats). */
  tab: string;
  color: string;
}

export interface CrosswalkNode {
  id: string;
  label: string;
  group: CrosswalkFramework;
  href: string;
  code: string;
}

export interface CrosswalkLink {
  source: string;
  target: string;
  value: number;
  label?: string;
}

export const CROSSWALK_GROUPS: CrosswalkGroup[] = [
  {
    id: "asi",
    label: "OWASP Agentic Top 10",
    short: "OWASP Agentic",
    tab: "owasp-agentic",
    color: FRAMEWORK_PALETTE.asi.css,
  },
  {
    id: "tm",
    label: "OWASP Threats & Mitigations",
    short: "OWASP T&M",
    tab: "overview",
    color: FRAMEWORK_PALETTE.tm.css,
  },
  {
    id: "cisco",
    label: "Cisco AI Taxonomy",
    short: "Cisco",
    tab: "cisco",
    color: FRAMEWORK_PALETTE.cisco.css,
  },
  {
    id: "aivss",
    label: "OWASP AIVSS",
    short: "AIVSS",
    tab: "aivss",
    color: FRAMEWORK_PALETTE.aivss.css,
  },
  {
    id: "aiuc1",
    label: "AIUC-1",
    short: "AIUC-1",
    tab: "aiuc-1",
    color: FRAMEWORK_PALETTE.aiuc1.css,
  },
  {
    id: "llm",
    label: "OWASP LLM Top 10",
    short: "OWASP LLM",
    tab: "llm-top10",
    color: FRAMEWORK_PALETTE.llm.css,
  },
];

/**
 * External frameworks cross-mapped by the crosswalk: every group except the OWASP T&M threat
 * catalog, which is this site's own threat model (/threats).
 */
export const CROSSWALK_EXTERNAL_FRAMEWORKS = CROSSWALK_GROUPS.filter((g) => g.id !== "tm");

import {
  BookMarked,
  BookOpen,
  Boxes,
  ClipboardCheck,
  Gauge,
  GitBranch,
  Hammer,
  Home,
  Info,
  Library,
  ListChecks,
  Network,
  ShieldAlert,
  ShieldCheck,
  Waypoints,
  Workflow,
  type LucideIcon,
} from "lucide-react";

/** Where a navigation entry is rendered. */
export type NavSurface = "header" | "drawer" | "footer" | "palette";

/** Footer columns and drawer sections are derived from this. */
export type NavGroup = "learn" | "verify" | "tools" | "project";

export interface NavItem {
  label: string;
  /** Router path; may carry a query string for palette-only shortcuts (e.g. a taxonomy tab). */
  path: string;
  icon: LucideIcon;
  group: NavGroup;
  description: string;
  showIn: NavSurface[];
}

export const NAV_GROUP_LABELS: Record<NavGroup, string> = {
  learn: "Learn",
  verify: "Verify",
  tools: "Tools",
  project: "Project",
};

export const NAV_GROUP_ORDER: NavGroup[] = ["learn", "verify", "tools", "project"];

const ALL: NavSurface[] = ["header", "drawer", "footer", "palette"];
const SECONDARY: NavSurface[] = ["drawer", "footer", "palette"];

/**
 * The single navigation list for the site. Order matters: it is the order of the header,
 * the "More" menu, the drawer groups, the footer columns and the palette "Pages" group.
 */
export const NAV_ITEMS: NavItem[] = [
  {
    label: "Home",
    path: "/",
    icon: Home,
    group: "learn",
    description: "Overview of the Agentic Security Hub",
    showIn: ["drawer", "palette"],
  },
  {
    label: "Components",
    path: "/components",
    icon: Boxes,
    group: "learn",
    description: "Key components (KC1–KC6) of agentic AI systems",
    showIn: ALL,
  },
  {
    label: "Architectures",
    path: "/architectures",
    icon: Network,
    group: "learn",
    description: "Agentic architecture patterns and their threat surfaces",
    showIn: ALL,
  },
  {
    label: "Threats",
    path: "/threats",
    icon: ShieldAlert,
    group: "learn",
    description: "OWASP agentic threat catalog with attack vectors",
    showIn: ALL,
  },
  {
    label: "Controls",
    path: "/controls",
    icon: ShieldCheck,
    group: "verify",
    description: "Mitigations mapped to threats and lifecycle phases",
    showIn: ALL,
  },
  {
    label: "AISVS",
    path: "/aisvs",
    icon: ClipboardCheck,
    group: "verify",
    description: "OWASP AI Security Verification Standard requirements",
    showIn: ALL,
  },
  {
    label: "NIST Mapping",
    path: "/nist-mapping",
    icon: GitBranch,
    group: "verify",
    description: "NIST AI RMF subcategories mapped to AISVS",
    showIn: ALL,
  },
  {
    label: "Taxonomy",
    path: "/taxonomy",
    icon: Library,
    group: "learn",
    description: "OWASP Agentic Top 10, Cisco, AIVSS and AIUC-1 in one view",
    showIn: ALL,
  },
  {
    label: "Threat Modeler",
    path: "/threat-modeler",
    icon: Workflow,
    group: "tools",
    description: "Model an agentic system and generate its threats",
    showIn: ALL,
  },
  {
    label: "Implementation",
    path: "/implementation",
    icon: Hammer,
    group: "tools",
    description: "Controls organized by design, build and operations phase",
    showIn: SECONDARY,
  },
  {
    label: "Security Checklist",
    path: "/interactive",
    icon: ListChecks,
    group: "verify",
    description: "Step-by-step implementation checklist with progress tracking",
    showIn: SECONDARY,
  },
  {
    label: "References",
    path: "/references",
    icon: BookMarked,
    group: "project",
    description: "Standards, papers and tools cited across the site",
    showIn: SECONDARY,
  },
  {
    label: "Threat Modeler Guide",
    path: "/threat-modeler-guide",
    icon: BookOpen,
    group: "tools",
    description: "How to use the threat modeler",
    showIn: SECONDARY,
  },
  {
    label: "About",
    path: "/about",
    icon: Info,
    group: "project",
    description: "About this project and its methodology",
    showIn: SECONDARY,
  },
  // Palette-only shortcuts into Taxonomy tabs.
  {
    label: "OWASP Agentic Top 10",
    path: "/taxonomy?tab=owasp-agentic",
    icon: ShieldAlert,
    group: "learn",
    description: "Taxonomy › OWASP Top 10 for Agentic Applications",
    showIn: ["palette"],
  },
  {
    label: "Cisco AI Security Taxonomy",
    path: "/taxonomy?tab=cisco",
    icon: Waypoints,
    group: "learn",
    description: "Taxonomy › Cisco objectives, techniques and sub-techniques",
    showIn: ["palette"],
  },
  {
    label: "AIVSS Calculator",
    path: "/taxonomy?tab=aivss",
    icon: Gauge,
    group: "learn",
    description: "Taxonomy › OWASP AI Vulnerability Scoring System",
    showIn: ["palette"],
  },
  {
    label: "AIUC-1",
    path: "/taxonomy?tab=aiuc-1",
    icon: ClipboardCheck,
    group: "learn",
    description: "Taxonomy › AIUC-1 requirements",
    showIn: ["palette"],
  },
];

export interface ExternalLink {
  label: string;
  href: string;
}

/** Off-site links shown in the footer's Project column. */
export const NAV_EXTERNAL: ExternalLink[] = [
  {
    label: "OWASP project",
    href: "https://owasp.org/www-project-securing-agentic-applications/",
  },
  { label: "GitHub", href: "https://github.com/vineethsai/asi/" },
  { label: "Author", href: "https://vineethsai.com/" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/vineethsai/" },
];

export function navItemsFor(surface: NavSurface): NavItem[] {
  return NAV_ITEMS.filter((item) => item.showIn.includes(surface));
}

/** Header primary links. */
export const HEADER_NAV = navItemsFor("header");

/** Header "More" menu: everything reachable from the drawer that is not a primary link. */
export const HEADER_MORE_NAV = NAV_ITEMS.filter(
  (item) => item.showIn.includes("drawer") && !item.showIn.includes("header") && item.path !== "/",
);

/** Items for one surface, grouped in NAV_GROUP_ORDER (empty groups omitted). */
export function groupedNav(
  surface: NavSurface,
): { group: NavGroup; label: string; items: NavItem[] }[] {
  const items = navItemsFor(surface);
  return NAV_GROUP_ORDER.map((group) => ({
    group,
    label: NAV_GROUP_LABELS[group],
    items: items.filter((item) => item.group === group),
  })).filter((g) => g.items.length > 0);
}

/** True when `path` is the current page or an ancestor of it ("/threats" for "/threats/t1"). */
export function isNavActive(path: string, pathname: string): boolean {
  const base = path.split("?")[0];
  if (base === "/") return pathname === "/";
  return pathname === base || pathname.startsWith(`${base}/`);
}

/**
 * Threat Modeler template for each architecture in architecturesData (template ids live in
 * src/components/threat-modeler/templates.ts). One copy, used by /architectures and its detail page.
 */
export const ARCHITECTURE_TEMPLATE: Readonly<Record<string, string>> = {
  sequential: "sequential-pipeline",
  hierarchical: "multi-agent",
  collaborative: "collaborative-swarm",
  reactive: "reactive-agent",
  knowledge_intensive: "knowledge-intensive",
};

/** Deep link that opens the Threat Modeler preloaded with the architecture's template. */
export function threatModelerPathFor(architectureId: string): string {
  const template = ARCHITECTURE_TEMPLATE[architectureId];
  return template ? `/threat-modeler?template=${encodeURIComponent(template)}` : "/threat-modeler";
}

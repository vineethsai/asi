import {
  ArrowRight,
  Boxes,
  ClipboardCheck,
  GitBranch,
  Library,
  Network,
  Search,
  ShieldAlert,
  ShieldCheck,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useCountUp } from "@/hooks/useCountUp";
import { useReveal } from "@/hooks/useReveal";
import { stagger } from "@/lib/motion";
import { useCommandPalette } from "@/components/layout/commandPaletteContext";
import { SITE_STATS } from "./siteStats";

interface InsideItem {
  icon: LucideIcon;
  title: string;
  count: number;
  unit: string;
  path: string;
}

// Two rows of four on desktop; every count is computed from the data (siteStats.ts).
const INSIDE: InsideItem[] = [
  {
    icon: Boxes,
    title: "Components",
    count: SITE_STATS.componentNodes,
    unit: `nodes across KC1–KC${SITE_STATS.keyComponents}`,
    path: "/components",
  },
  {
    icon: Network,
    title: "Architectures",
    count: SITE_STATS.patterns,
    unit: "reference patterns",
    path: "/architectures",
  },
  {
    icon: ShieldAlert,
    title: "Threats",
    count: SITE_STATS.threats,
    unit: `threats · ${SITE_STATS.attackVectors} attack vectors`,
    path: "/threats",
  },
  {
    icon: ShieldCheck,
    title: "Controls",
    count: SITE_STATS.controls,
    unit: "mitigations by lifecycle phase",
    path: "/controls",
  },
  {
    icon: ClipboardCheck,
    title: "AISVS",
    count: SITE_STATS.aisvsRequirements,
    unit: `requirements in ${SITE_STATS.aisvsChapters} chapters (v${SITE_STATS.aisvsVersion})`,
    path: "/aisvs",
  },
  {
    icon: GitBranch,
    title: "NIST AI RMF",
    count: SITE_STATS.nistSubcategories,
    unit: "subcategories mapped to AISVS",
    path: "/nist-mapping",
  },
  {
    icon: Library,
    title: "Taxonomy",
    count: SITE_STATS.taxonomyFrameworks,
    unit: "frameworks cross-mapped",
    path: "/taxonomy",
  },
  {
    icon: Workflow,
    title: "Threat Modeler",
    count: SITE_STATS.modelerTemplates,
    unit: "starter templates",
    path: "/threat-modeler",
  },
];

function InsideCard({
  item,
  index,
  visible,
}: {
  item: InsideItem;
  index: number;
  visible: boolean;
}) {
  const shown = useCountUp(item.count, undefined, visible);
  const Icon = item.icon;
  return (
    <li className="enter" style={stagger(index)}>
      <Link
        to={item.path}
        className="group flex h-full items-start gap-3 bg-background px-4 py-4 transition-colors hover:bg-muted/50 focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Icon
          className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
          aria-hidden="true"
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-medium text-foreground">{item.title}</span>
            <ArrowRight
              className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
              aria-hidden="true"
            />
          </span>
          <span className="mt-1 block">
            <span
              className="font-mono text-2xl font-semibold tabular-nums text-foreground"
              aria-hidden="true"
            >
              {shown.toLocaleString()}
            </span>
            <span className="sr-only">{item.count.toLocaleString()}</span>{" "}
            <span className="text-xs text-muted-foreground">{item.unit}</span>
          </span>
        </span>
      </Link>
    </li>
  );
}

export const HeroSection = () => {
  const { ref, isVisible } = useReveal<HTMLUListElement>({ rootMargin: "0px" });
  const { openPalette } = useCommandPalette();

  return (
    <section className="relative overflow-hidden py-14 md:py-20" aria-labelledby="hero-title">
      {/* Dot-grid background */}
      <div className="hero-grid-bg pointer-events-none absolute inset-0 text-foreground opacity-[0.03] dark:opacity-[0.05]" />

      <div className="container relative mx-auto max-w-5xl px-4 md:px-6">
        <div className="mx-auto flex max-w-3xl flex-col items-center space-y-7 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 dark:bg-muted/30">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
            <span className="font-mono text-xs tracking-wide text-muted-foreground">
              OWASP Agentic Security Framework
            </span>
          </div>

          <h1
            id="hero-title"
            className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
          >
            <span
              className="term-prompt font-mono text-3xl font-normal sm:text-4xl md:text-5xl lg:text-6xl"
              aria-hidden="true"
            >
              {">"}&nbsp;
            </span>
            <span className="text-foreground">Agentic Security Hub</span>
            <span className="animate-blink term-prompt font-mono font-normal" aria-hidden="true">
              _
            </span>
          </h1>

          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Threat models, verification standards, and security controls for AI agent architectures.
            Built on OWASP AISVS and NIST AI RMF.
          </p>

          <button
            type="button"
            onClick={() => openPalette()}
            className="inline-flex w-full max-w-sm items-center gap-2 rounded-md border bg-background px-3 py-2 text-left text-sm text-muted-foreground shadow-sm transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="flex-1">Search threats, controls, AISVS…</span>
            <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
          </button>
        </div>

        <h2 className="sr-only">What&apos;s inside</h2>
        <ul
          ref={ref}
          className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2 lg:grid-cols-4"
        >
          {INSIDE.map((item, i) => (
            <InsideCard key={item.path} item={item} index={i} visible={isVisible} />
          ))}
        </ul>
      </div>
    </section>
  );
};

export default HeroSection;

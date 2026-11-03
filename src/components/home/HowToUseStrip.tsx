import { Link } from "react-router-dom";
import {
  ArrowRight,
  Boxes,
  ClipboardCheck,
  ShieldAlert,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import { useReveal } from "@/hooks/useReveal";
import { stagger } from "@/lib/motion";
import { SITE_STATS } from "./siteStats";

const STEPS = [
  {
    icon: Boxes,
    title: "Learn components",
    text: `The ${SITE_STATS.keyComponents} key components (KC1–KC${SITE_STATS.keyComponents}) of an agent.`,
    path: "/components",
  },
  {
    icon: ShieldAlert,
    title: "Map threats",
    text: `${SITE_STATS.threats} threats and ${SITE_STATS.attackVectors} attack vectors per component.`,
    path: "/threats",
  },
  {
    icon: ShieldCheck,
    title: "Pick controls",
    text: `${SITE_STATS.controls} mitigations by design, build and operations phase.`,
    path: "/controls",
  },
  {
    icon: ClipboardCheck,
    title: "Verify with AISVS",
    text: `${SITE_STATS.aisvsRequirements} requirements across ${SITE_STATS.aisvsChapters} chapters.`,
    path: "/aisvs",
  },
  {
    icon: Workflow,
    title: "Model it",
    text: `Start from ${SITE_STATS.modelerTemplates} templates and generate the threats.`,
    path: "/threat-modeler",
  },
];

/** "How to use this site" (6.1 item 6): the five-step path through the site. */
export function HowToUseStrip() {
  const { ref } = useReveal<HTMLOListElement>();
  return (
    <section className="py-12 lg:py-16" aria-labelledby="how-to-title">
      <div className="container px-4 md:px-6">
        <h2 id="how-to-title" className="text-xl font-semibold tracking-tight">
          How to use this site
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          From the parts of an agent to a verified, modelled system in {STEPS.length} steps.
        </p>
        <ol ref={ref} className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <li key={step.path} className="enter" style={stagger(i)}>
                <Link
                  to={step.path}
                  className="card-hover group flex h-full flex-col rounded-lg border bg-card p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full border font-mono">
                      {i + 1}
                    </span>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="mt-3 font-medium">{step.title}</span>
                  <span className="mt-1 flex-1 text-sm text-muted-foreground">{step.text}</span>
                  <ArrowRight
                    className="mt-3 h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

export default HowToUseStrip;

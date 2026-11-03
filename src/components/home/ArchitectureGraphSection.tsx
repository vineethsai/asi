import { Link } from "react-router-dom";
import { ArrowRight, Share2 } from "lucide-react";
import { SITE_STATS } from "./siteStats";

/**
 * Compact "Explore the graph" call to action (6.1 item 5). The interactive explorer
 * (ArchitectureNavigator) is not mounted on Home; it opens from /architectures?view=graph.
 */
export const ArchitectureGraphSection = () => (
  <section className="py-6" aria-labelledby="graph-cta-title">
    <div className="container px-4 md:px-6">
      <Link
        to="/architectures?view=graph"
        className="card-hover group flex flex-col gap-4 rounded-lg border bg-card p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Share2 className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span id="graph-cta-title" className="block font-semibold">
            Explore the graph
          </span>
          <span className="block text-sm text-muted-foreground">
            Expand {SITE_STATS.patterns} patterns into their components, the threats that hit them
            and the controls that answer each threat.
          </span>
        </span>
        <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
          Open graph explorer
          <ArrowRight
            className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </span>
      </Link>
    </div>
  </section>
);

export default ArchitectureGraphSection;

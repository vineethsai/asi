/**
 * ScenarioLinks — a compact list of attack walkthroughs for other pages to link in (P4-03).
 *
 * Props:
 *   scenarios: Scenario[]   — e.g. scenariosForAsi("ASI01"), scenariosForThreat("t6"),
 *                             scenariosForArchitecture("reactive") from src/data/scenarios.ts
 *   title?: string          — heading (default "Attack walkthroughs"); pass null to omit it
 *   max?: number            — default 4
 *   className?: string
 *
 * Renders nothing when the list is empty.
 */
import { Link } from "react-router-dom";
import { ChevronRight, Footprints } from "lucide-react";
import { SeverityBadge } from "@/components/content/SeverityBadge";
import { architecturesData } from "@/components/components/architecturesData";
import { cn } from "@/lib/utils";
import { scenarioPath, type Scenario } from "@/data/scenarios";

export interface ScenarioLinksProps {
  scenarios: readonly Scenario[];
  title?: string | null;
  max?: number;
  className?: string;
}

export function ScenarioLinks({
  scenarios,
  title = "Attack walkthroughs",
  max = 4,
  className,
}: ScenarioLinksProps) {
  if (!scenarios.length) return null;
  const shown = scenarios.slice(0, max);
  return (
    <section className={cn("space-y-2", className)} aria-label={title ?? "Attack walkthroughs"}>
      {title && (
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Footprints className="h-4 w-4 text-primary" aria-hidden="true" />
          {title}
        </h3>
      )}
      <ul className="grid gap-2 sm:grid-cols-2">
        {shown.map((s) => (
          <li key={s.id}>
            <Link
              to={scenarioPath(s.id)}
              className="card-hover flex h-full items-start gap-3 rounded-lg border bg-card p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="min-w-0 flex-1 space-y-1">
                <span className="block font-medium leading-snug">{s.title}</span>
                <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <SeverityBadge band={s.severity} size="xs" />
                  <span>{architecturesData[s.archId]?.name}</span>
                  <span>· {s.steps.length} steps</span>
                </span>
              </span>
              <ChevronRight
                className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default ScenarioLinks;

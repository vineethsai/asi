/**
 * "What would have stopped this?" — reveals the controls mapped to a scenario's threats as cards
 * linking to /controls/:id (P4-03), plus the OWASP prevention guidelines when the scenario comes
 * from an ASI entry.
 */
import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mitigationsData, threatsData } from "@/components/components/securityData";
import { agenticTop10Data } from "@/components/components/owaspAgenticTop10Data";
import { stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { Scenario } from "@/data/scenarios";

const PHASES = [
  { key: "designPhase", label: "Design" },
  { key: "buildPhase", label: "Build" },
  { key: "operationPhase", label: "Operations" },
] as const;

const MAX_GUIDELINES = 3;

export function StopControls({ scenario }: { scenario: Scenario }) {
  const [open, setOpen] = useState(false);
  const regionId = useId();
  const asi = scenario.asiId ? agenticTop10Data.find((e) => e.id === scenario.asiId) : undefined;
  const guidelines = scenario.source === "asi" ? (asi?.preventionGuidelines ?? []) : [];

  return (
    <section aria-labelledby={`${regionId}-h`} className="space-y-4">
      <h2 id={`${regionId}-h`} className="sr-only">
        What would have stopped this?
      </h2>
      <Button
        type="button"
        size="lg"
        variant={open ? "outline" : "default"}
        aria-expanded={open}
        aria-controls={regionId}
        onClick={() => setOpen((o) => !o)}
      >
        <ShieldCheck aria-hidden="true" />
        What would have stopped this?
        <ChevronDown
          className={cn("transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      </Button>

      <div
        id={regionId}
        hidden={!open}
        className={cn(open && "is-visible")}
        data-visible={open ? "" : undefined}
      >
        {open && (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">
              {scenario.controlsThatStop.length} controls are mapped to{" "}
              {scenario.threatIds.map((id) => threatsData[id]?.code).join(" and ")} in this pattern.
            </p>
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {scenario.controlsThatStop.map((id, i) => {
                const m = mitigationsData[id];
                if (!m) return null;
                const covers = scenario.threatIds.filter(
                  (tid) =>
                    m.threatIds.includes(tid) || threatsData[tid]?.mitigationIds?.includes(id),
                );
                return (
                  <li key={id} className="enter" style={stagger(i)}>
                    <Link
                      to={`/controls/${id}`}
                      className="card-hover flex h-full flex-col gap-2 rounded-lg border bg-card p-4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="flex items-start gap-2">
                        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                          {id.toUpperCase()}
                        </span>
                        <span className="font-medium leading-snug">{m.name}</span>
                      </span>
                      <span className="line-clamp-3 text-sm text-muted-foreground">
                        {m.description}
                      </span>
                      <span className="mt-auto flex flex-wrap gap-1.5 pt-1 text-[11px] text-muted-foreground">
                        <span>Stops {covers.map((tid) => threatsData[tid]?.code).join(", ")}</span>
                        {PHASES.filter((p) => m[p.key]).map((p) => (
                          <span key={p.key} className="rounded-full border px-1.5">
                            {p.label}
                          </span>
                        ))}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            {asi && guidelines.length > 0 && (
              <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                <p className="mb-2 font-medium">
                  OWASP prevention guidance for {asi.code} {asi.name}
                </p>
                <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                  {guidelines.slice(0, MAX_GUIDELINES).map((g) => (
                    <li key={g}>{g}</li>
                  ))}
                </ul>
                {guidelines.length > MAX_GUIDELINES && (
                  <Link
                    to={`/taxonomy?tab=owasp-agentic&entry=${asi.id}`}
                    className="mt-2 inline-block text-xs font-medium text-primary underline-offset-4 hover:underline"
                  >
                    All {guidelines.length} guidelines for {asi.code}
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default StopControls;

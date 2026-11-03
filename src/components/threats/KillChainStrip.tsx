/**
 * KillChainStrip — a threat's attack vectors ordered by severity; under each, the mapped
 * controls that best match it, with their task counts per lifecycle phase
 * (Design → Build → Operations) linking to that phase of the control.
 * The vector → control pairing is a keyword heuristic (killChain.ts) and is labelled as such.
 */
import { Link } from "react-router-dom";
import type { Mitigation, Threat } from "@/components/components/securityData";
import { PhaseBadge } from "@/components/content/PhaseBadge";
import { SeverityBadge } from "@/components/content/SeverityBadge";
import { impactBand } from "@/lib/severity";
import { cn } from "@/lib/utils";
import {
  PHASE_META,
  PHASE_ORDER,
  phaseApplies,
  phaseTaskTotal,
} from "@/components/controls/phaseTasks";
import { killChain } from "./killChain";
import { controlCode } from "./threatIndex";

export interface KillChainStripProps {
  threat: Threat;
  controls: Mitigation[];
  /** Called for "see all controls" when a vector has no keyword match. */
  allControlsHref?: string;
  className?: string;
}

export function KillChainStrip({
  threat,
  controls,
  allControlsHref,
  className,
}: KillChainStripProps) {
  const vectors = killChain(threat, controls);
  if (!vectors.length) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        No attack vectors are documented for this threat.
      </p>
    );
  }
  return (
    <div className={className}>
      <p className="mb-4 max-w-3xl text-sm text-muted-foreground">
        Attack vectors from the most to the least severe. Under each are the mapped controls whose
        guidance shares the most keywords with the vector (a heuristic, not part of the source
        mapping) and how many tasks each has per phase.
      </p>
      <ol
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        aria-label={`${threat.code} attack vectors by severity`}
      >
        {vectors.map((v, i) => (
          <li key={v.vector} className="relative flex flex-col rounded-lg border bg-card p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-muted-foreground">Step {i + 1}</span>
              <SeverityBadge band={impactBand(v.severity)} size="xs" />
            </div>
            <h3 className="font-semibold leading-snug text-foreground">{v.vector}</h3>
            {v.example && <p className="mt-1 text-sm text-muted-foreground">{v.example}</p>}
            <div className="mt-auto pt-4">
              {v.controls.length ? (
                <dl className="space-y-1.5">
                  {PHASE_ORDER.map((p) => {
                    const cs = v.controls.filter((m) => phaseApplies(m, p));
                    return (
                      <div key={p} className="flex items-start gap-2">
                        <dt className="w-[6.75rem] shrink-0">
                          <PhaseBadge phase={p} size="xs" />
                        </dt>
                        <dd className="flex flex-wrap gap-1">
                          {cs.length ? (
                            cs.map((m) => {
                              const n = phaseTaskTotal(m, p);
                              return (
                                <Link
                                  key={m.id}
                                  to={`/controls/${m.id}?tab=${p}`}
                                  title={m.name}
                                  aria-label={`${controlCode(m.id)} ${m.name}: ${n ? `${n} ${PHASE_META[p].label.toLowerCase()} tasks` : `${PHASE_META[p].label.toLowerCase()} guidance`}`}
                                  className="inline-flex h-6 items-center gap-1 rounded border bg-muted/40 px-1.5 font-mono text-[11px] text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                  {controlCode(m.id)}
                                  {n > 0 && <span className="text-muted-foreground">· {n}</span>}
                                </Link>
                              );
                            })
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No keyword match.{" "}
                  {allControlsHref ? (
                    <Link
                      to={allControlsHref}
                      className="underline underline-offset-2 hover:text-foreground"
                    >
                      See all {controls.length} mapped controls
                    </Link>
                  ) : (
                    `All ${controls.length} mapped controls apply.`
                  )}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default KillChainStrip;

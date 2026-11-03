/**
 * ComponentCard — one key component (KC1–KC6) on /components: KC code pill in the KC colour,
 * official name, two-line description, sub-component / threat counts and threat chips.
 */
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { threatsData } from "@/components/components/securityData";
import { SeverityBadge } from "@/components/content/SeverityBadge";
import { KC } from "@/data/kc";
import { Icon } from "@/lib/icons";
import { kcColor } from "@/lib/palette";
import { severityLabel } from "@/lib/severity";
import { cn } from "@/lib/utils";
import { compareThreatCodes, threatBand, threatLabel } from "@/components/threats/threatIndex";
import { descendantsOf, threatIdsInKc, type ComponentEntry } from "./componentIndex";

const MAX_CHIPS = 6;

export interface ComponentCardProps {
  entry: ComponentEntry;
  className?: string;
  style?: CSSProperties;
}

export function ComponentCard({ entry, className, style }: ComponentCardProps) {
  const kc = KC[entry.kc];
  const subs = descendantsOf(entry.id);
  const threats = threatIdsInKc(entry.kc)
    .map((id) => threatsData[id])
    .filter(Boolean)
    .sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0) || compareThreatCodes(a, b));

  return (
    <article
      className={cn(
        "card-hover group relative flex h-full flex-col rounded-lg border bg-card p-5 focus-within:ring-2 focus-within:ring-ring",
        className,
      )}
      style={style}
    >
      <div className="mb-3 flex items-start gap-3">
        <span className="mt-0.5 rounded-md bg-muted p-1.5 text-muted-foreground">
          <Icon name={kc.icon} className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <span
            className="inline-flex h-5 items-center rounded-full border px-2 font-mono text-[11px] font-semibold text-foreground"
            style={{ background: kcColor(kc.id, 0.14), borderColor: kcColor(kc.id, 0.45) }}
          >
            {kc.code}
          </span>
          <h3 className="mt-1 text-base font-semibold leading-snug text-foreground">
            <Link
              to={`/components/${entry.id}`}
              className="outline-none after:absolute after:inset-0 after:content-[''] hover:underline"
            >
              {kc.name}
            </Link>
          </h3>
        </div>
      </div>

      <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
        {entry.description || kc.description}
      </p>

      <p className="mb-3 flex flex-wrap gap-1.5 text-xs">
        <span className="rounded-full border px-2 py-0.5 text-muted-foreground">
          {subs.length} subcomponent{subs.length === 1 ? "" : "s"}
        </span>
        <span className="rounded-full border px-2 py-0.5 text-muted-foreground">
          {threats.length} threat{threats.length === 1 ? "" : "s"}
        </span>
      </p>

      {threats.length > 0 && (
        <ul
          className="relative z-10 mt-auto flex flex-wrap gap-1 border-t pt-3"
          aria-label={`Threats to ${kc.code}`}
        >
          {threats.slice(0, MAX_CHIPS).map((t) => (
            <li key={t.id}>
              <Link
                to={`/threats/${t.id}`}
                title={threatLabel(t)}
                className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <SeverityBadge band={threatBand(t)} label={t.code} size="xs" />
                <span className="sr-only">
                  {" "}
                  {threatLabel(t)}, {severityLabel(threatBand(t))} risk
                </span>
              </Link>
            </li>
          ))}
          {threats.length > MAX_CHIPS && (
            <li className="inline-flex h-5 items-center px-1 text-[11px] text-muted-foreground">
              +{threats.length - MAX_CHIPS}
            </li>
          )}
        </ul>
      )}
    </article>
  );
}

export default ComponentCard;

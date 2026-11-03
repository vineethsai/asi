import { Suspense, lazy, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Minus } from "lucide-react";
import { Ring } from "@/components/charts/Ring";
import { SeverityBadge } from "@/components/content/SeverityBadge";
import { featuredThreatFor } from "@/lib/featured";
import { impactBand, riskBand, severityLabel } from "@/lib/severity";
import { cn } from "@/lib/utils";

const ThreatConstellationThumb = lazy(() => import("./ThreatConstellationThumb"));

const CIA = [
  { key: "confidentiality", label: "Confidentiality", short: "C" },
  { key: "integrity", label: "Integrity", short: "I" },
  { key: "availability", label: "Availability", short: "A" },
] as const;

/** First sentence of a description (the card shows one line of context). */
function firstSentence(text: string): string {
  const m = text.match(/^(.+?[.!?])(\s|$)/);
  return m ? m[1] : text;
}

function formatUtcDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** "Threat of the day" (6.1 item 2): deterministic by UTC date, see src/lib/featured.ts. */
export function FeaturedThreatCard({ date }: { date?: Date }) {
  const today = useMemo(() => date ?? new Date(), [date]);
  const threat = useMemo(() => featuredThreatFor(today), [today]);
  const score = threat.riskScore ?? 0;
  const band = riskBand(score);
  const impact = impactBand(threat.impactLevel);
  const vectors = threat.attackVectors?.length ?? 0;
  const controls = threat.mitigationIds?.length ?? 0;

  return (
    <article
      className="card-hover relative flex h-full flex-col rounded-lg border bg-card p-5 focus-within:ring-2 focus-within:ring-ring"
      aria-labelledby="featured-threat-title"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Threat of the day
        </p>
        <time className="text-xs text-muted-foreground" dateTime={today.toISOString().slice(0, 10)}>
          {formatUtcDate(today)}
        </time>
      </div>

      <div className="mt-3 flex items-start gap-4">
        <div className="min-w-0 flex-1">
          <h3 id="featured-threat-title" className="text-lg font-semibold leading-snug">
            <span className="mr-2 font-mono text-sm text-muted-foreground">{threat.code}</span>
            <Link
              to={`/threats/${threat.id}`}
              className="after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none"
            >
              {threat.name}
            </Link>
          </h3>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {firstSentence(threat.description)}
          </p>
        </div>
        <Ring
          value={score}
          max={10}
          size={60}
          tone={band}
          label={score}
          ariaLabel={`Risk ${score} of 10 (${severityLabel(band)})`}
        />
      </div>

      <ul className="mt-4 flex flex-wrap items-center gap-1.5" aria-label="Impact">
        <li>
          <SeverityBadge band={impact} size="xs" label={`${severityLabel(impact)} impact`} />
        </li>
        {CIA.map((c) => {
          const hit = Boolean(threat.impactAnalysis?.[c.key]);
          return (
            <li
              key={c.key}
              className={cn(
                "inline-flex h-5 items-center gap-1 rounded border px-1.5 text-[10px]",
                hit ? "border-border text-foreground" : "border-dashed text-muted-foreground",
              )}
            >
              {hit ? (
                <Check className="h-3 w-3" aria-hidden="true" />
              ) : (
                <Minus className="h-3 w-3" aria-hidden="true" />
              )}
              {c.label}
              <span className="sr-only">{hit ? "affected" : "not affected"}</span>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 grid flex-1 grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
        <Suspense
          fallback={<div className="skeleton h-[120px] w-full max-w-[220px]" aria-hidden="true" />}
        >
          <ThreatConstellationThumb threat={threat} className="w-full max-w-[220px]" />
        </Suspense>
        <div className="space-y-1 text-right text-xs text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">{vectors}</span> attack vectors
          </p>
          <p>
            <span className="font-medium text-foreground">{controls}</span> mitigating controls
          </p>
          <p
            className="relative z-10 inline-flex items-center gap-1 pt-1 text-sm font-medium text-primary"
            aria-hidden="true"
          >
            Read <ArrowRight className="h-3.5 w-3.5" />
          </p>
        </div>
      </div>
    </article>
  );
}

export default FeaturedThreatCard;

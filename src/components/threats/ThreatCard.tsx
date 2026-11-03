/**
 * ThreatCard — one threat in the catalog grid. Severity is a left bar + RiskScore (never a coloured
 * heading); the whole card is clickable through a stretched title link.
 */
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { Threat } from "@/components/components/securityData";
import { RiskScore } from "@/components/content/RiskScore";
import { Icon } from "@/lib/icons";
import { FRAMEWORK_PALETTE } from "@/lib/palette";
import { severityLabel, severityToken } from "@/lib/severity";
import { cn } from "@/lib/utils";
import { kcByCode } from "@/data/kc";
import { threatBand, threatLabel } from "./threatIndex";
import { threatAsiCodes } from "./frameworkLinks";

export interface ThreatCardProps {
  threat: Threat;
  mitigationCount: number;
  className?: string;
  style?: CSSProperties;
}

const CIA = [
  ["confidentiality", "C", "Confidentiality"],
  ["integrity", "I", "Integrity"],
  ["availability", "A", "Availability"],
] as const;

export function CiaChips({ threat }: { threat: Threat }) {
  const cia = threat.impactAnalysis;
  if (!cia) return null;
  const hit = severityToken("high");
  return (
    <span className="inline-flex items-center gap-1" aria-label="CIA impact">
      {CIA.map(([key, abbr, name]) => {
        const on = cia[key];
        return (
          <span
            key={key}
            title={`${name}: ${on ? "impacted" : "not impacted"}`}
            className={cn(
              "inline-flex h-5 w-5 items-center justify-center rounded border text-[10px] font-bold",
              on ? hit.badge : "border-border bg-muted text-muted-foreground/60",
            )}
          >
            <span aria-hidden>{abbr}</span>
            <span className="sr-only">
              {name} {on ? "impacted" : "not impacted"}
            </span>
          </span>
        );
      })}
    </span>
  );
}

export function ThreatCard({ threat, mitigationCount, className, style }: ThreatCardProps) {
  const band = threatBand(threat);
  const t = severityToken(band);
  const vectors = threat.attackVectors?.length ?? 0;
  const kcs = [...new Set(threat.componentIds.map((c) => kcByCode(c)?.code).filter(Boolean))];
  const asi = threatAsiCodes(threat).length;
  const cisco = threat.ciscoMapping?.length ?? 0;

  return (
    <article
      className={cn(
        "card-hover group relative flex h-full flex-col overflow-hidden rounded-lg border bg-card p-5 pl-6 focus-within:ring-2 focus-within:ring-ring",
        className,
      )}
      style={style}
      data-band={band}
    >
      <span aria-hidden className={cn("absolute inset-y-0 left-0 w-1.5", t.chart)} />
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {threat.icon && (
            <span className="mt-0.5 rounded-md bg-muted p-1.5 text-muted-foreground">
              <Icon name={threat.icon} className="h-5 w-5" />
            </span>
          )}
          <div className="min-w-0">
            <span className="font-mono text-xs font-semibold text-muted-foreground">
              {threat.code}
            </span>
            <h3 className="text-base font-semibold leading-snug text-foreground">
              <Link
                to={`/threats/${threat.id}`}
                className="outline-none after:absolute after:inset-0 after:content-[''] hover:underline"
              >
                {threatLabel(threat)}
              </Link>
            </h3>
          </div>
        </div>
        {typeof threat.riskScore === "number" && (
          <RiskScore
            score={threat.riskScore}
            label="Risk"
            tone="severity"
            showBar={false}
            className="shrink-0"
          />
        )}
      </div>
      <span className="sr-only">{severityLabel(band)} risk.</span>

      <div className="mb-3 flex flex-wrap items-center gap-1.5 text-xs">
        <CiaChips threat={threat} />
        <span className="rounded-full border px-2 py-0.5 text-muted-foreground">
          {vectors} vector{vectors === 1 ? "" : "s"}
        </span>
        <span className="rounded-full border px-2 py-0.5 text-muted-foreground">
          {mitigationCount} control{mitigationCount === 1 ? "" : "s"}
        </span>
        {kcs.length > 0 && (
          <span className="rounded-full border px-2 py-0.5 font-mono text-muted-foreground">
            {kcs.join(" · ")}
          </span>
        )}
      </div>

      <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
        {threat.description}
      </p>

      <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t pt-3 text-[11px]">
        {asi > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-muted-foreground">
            <span
              aria-hidden
              className="h-2 w-2 rounded-full"
              style={{ background: FRAMEWORK_PALETTE.asi.css }}
            />
            ASI × {asi}
          </span>
        )}
        {cisco > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-muted-foreground">
            <span
              aria-hidden
              className="h-2 w-2 rounded-full"
              style={{ background: FRAMEWORK_PALETTE.cisco.css }}
            />
            Cisco × {cisco}
          </span>
        )}
        <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground group-hover:text-foreground">
          Details <ArrowRight aria-hidden className="h-3 w-3" />
        </span>
      </div>
    </article>
  );
}

export default ThreatCard;

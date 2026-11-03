/**
 * Shared presentational pieces for the results panel: severity / verdict /
 * status chips (text + glyph, never colour alone, ≥ 11 px) and disclosures.
 */
import type { ReactNode } from "react";
import { CheckCircle2, CircleDashed, CircleSlash, MinusCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { severityLabel, severityShape, severityToken, type SeverityBand } from "@/lib/severity";
import { SeverityGlyph } from "@/components/content/SeverityBadge";
import type { GeneratedThreat } from "../types";
import type { Verdict } from "../engine/compliance";
import { STATUS_LABELS, statusOf } from "./helpers";

export function SevChip({
  band,
  label,
  className,
  title,
}: {
  band: SeverityBand;
  label?: string;
  className?: string;
  title?: string;
}) {
  const t = severityToken(band);
  return (
    <span
      title={title}
      className={cn(
        "inline-flex h-5 shrink-0 items-center gap-1 rounded border px-1.5 text-[11px] font-semibold leading-none",
        t.badge,
        className,
      )}
    >
      <SeverityGlyph shape={severityShape(band)} className="h-2 w-2" />
      {label ?? severityLabel(band)}
    </span>
  );
}

export function StatusPill({ threat, className }: { threat: GeneratedThreat; className?: string }) {
  const s = statusOf(threat);
  if (s === "open") return null;
  const auto = !threat.status && threat.mitigationState === "mitigated";
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center gap-1 rounded-full border px-1.5 text-[11px] font-medium",
        s === "mitigated" || s === "false-positive"
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300",
        className,
      )}
      title={auto ? "Implemented mitigations cover this threat" : undefined}
    >
      <CheckCircle2 className="h-3 w-3" aria-hidden />
      {auto ? "Mitigated (controls)" : STATUS_LABELS[s]}
    </span>
  );
}

const VERDICT: Record<Verdict, { label: string; icon: typeof CheckCircle2; cls: string }> = {
  met: {
    label: "Met",
    icon: CheckCircle2,
    cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  partial: {
    label: "Partial",
    icon: MinusCircle,
    cls: "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  },
  gap: {
    label: "Gap",
    icon: XCircle,
    cls: "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300",
  },
  "not-applicable": {
    label: "Not applicable",
    icon: CircleSlash,
    cls: "border-dashed border-muted-foreground/40 bg-muted/40 text-muted-foreground",
  },
};

/** Verdict chip: icon + text; "not-applicable" is dashed/neutral so it never reads as a gap. */
export function VerdictChip({
  verdict,
  label,
  notAssessable,
}: {
  verdict: Verdict;
  label?: string;
  notAssessable?: boolean;
}) {
  if (notAssessable) {
    return (
      <span className="inline-flex h-5 shrink-0 items-center gap-1 rounded border border-dashed border-muted-foreground/40 px-1.5 text-[11px] font-medium text-muted-foreground">
        <CircleDashed className="h-3 w-3" aria-hidden />
        {label ?? "Not assessable"}
      </span>
    );
  }
  const v = VERDICT[verdict];
  const I = v.icon;
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center gap-1 rounded border px-1.5 text-[11px] font-medium",
        v.cls,
      )}
    >
      <I className="h-3 w-3" aria-hidden />
      {label ?? v.label}
    </span>
  );
}

export function Chip({
  children,
  title,
  className,
}: {
  children: ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex h-5 items-center rounded border bg-muted/40 px-1.5 font-mono text-[11px] text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Disclosure({
  open,
  onToggle,
  controls,
  children,
  className,
}: {
  open: boolean;
  onToggle: () => void;
  controls: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={controls}
      onClick={onToggle}
      className={cn(
        "inline-flex items-center gap-1 rounded text-[11px] font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {children}
    </button>
  );
}

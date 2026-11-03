/**
 * Small presentational pieces shared by the NIST mapping tabs and the details drawer.
 */
import { Link } from "react-router-dom";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FRAMEWORK_PALETTE, withAlpha } from "@/lib/palette";
import { getAisvsRequirement } from "@/data/aisvs";
import { EDITORIAL_NAME_NOTE, getNistGaiRisk, type NistGaiRiskId } from "@/data/nist";
import { chapterName } from "./selection";

/** An editorial category/subcategory label with the "label by this site" tooltip (A8). */
export function EditorialName({ name, className }: { name: string; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className={cn(
            "cursor-help underline decoration-muted-foreground/50 decoration-dotted underline-offset-4 outline-none focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring",
            className,
          )}
        >
          {name}
          <span className="sr-only"> (editorial label)</span>
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs">{EDITORIAL_NAME_NOTE}</TooltipContent>
    </Tooltip>
  );
}

/** Inline "editorial" hint for headings where a tooltip trigger would be awkward. */
export function EditorialNote({ className }: { className?: string }) {
  return (
    <p className={cn("flex items-center gap-1 text-[11px] text-muted-foreground", className)}>
      <Info aria-hidden className="h-3 w-3" />
      {EDITORIAL_NAME_NOTE}
    </p>
  );
}

const chipBase =
  "inline-flex max-w-full items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** AISVS 1.01 chapter chips linking to the AISVS page (`/aisvs#C5`). */
export function AisvsChapterChips({
  chapters,
  emphasis,
  className,
}: {
  chapters: readonly string[];
  /** Chapter to emphasise (e.g. the matrix column the drawer was opened from). */
  emphasis?: string;
  className?: string;
}) {
  if (chapters.length === 0) return null;
  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)} aria-label="AISVS 1.01 chapters">
      {chapters.map((c) => (
        <li key={c} className="min-w-0">
          <Link
            to={`/aisvs#${c}`}
            title={`AISVS 1.01 ${c}: ${chapterName(c)}`}
            className={cn(
              chipBase,
              "border-primary/30 bg-primary/5 text-foreground hover:bg-primary/10",
              emphasis === c && "border-primary bg-primary/15 font-medium",
            )}
          >
            <span className="font-mono font-semibold">{c}</span>
            <span className="truncate text-muted-foreground">{chapterName(c)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Cited AISVS requirement ids as links (`/aisvs#C1.1.2`), with the requirement text on hover. */
export function RequirementLinks({
  ids,
  className,
}: {
  ids: readonly string[];
  className?: string;
}) {
  if (ids.length === 0) return null;
  return (
    <ul className={cn("flex flex-wrap gap-1", className)} aria-label="Cited AISVS requirements">
      {ids.map((id) => {
        const req = getAisvsRequirement(id);
        return (
          <li key={id}>
            <Link
              to={`/aisvs#${id}`}
              title={req ? `${id} (Level ${req.level}): ${req.text}` : id}
              className={cn(chipBase, "font-mono text-[11px] hover:bg-muted")}
            >
              {id}
              {req && <span className="sr-only">: {req.title}</span>}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

const GAI_TOKEN = FRAMEWORK_PALETTE.nist;

/**
 * NIST AI 600-1 risk chips. With `onSelect` they become filter buttons (pressed = current filter).
 */
export function GaiRiskChips({
  ids,
  selected,
  onSelect,
  className,
}: {
  ids?: readonly NistGaiRiskId[];
  selected?: string;
  onSelect?: (id: NistGaiRiskId) => void;
  className?: string;
}) {
  if (!ids || ids.length === 0) return null;
  return (
    <ul className={cn("flex flex-wrap gap-1", className)} aria-label="NIST AI 600-1 GAI risks">
      {ids.map((id) => {
        const risk = getNistGaiRisk(id);
        const label = risk?.short ?? id;
        const style = {
          borderColor: withAlpha(GAI_TOKEN, 0.35),
          background: withAlpha(GAI_TOKEN, selected === id ? 0.2 : 0.07),
        };
        const title = risk
          ? `NIST AI 600-1 §${risk.section} ${risk.name}: ${risk.description}`
          : id;
        return (
          <li key={id}>
            {onSelect ? (
              <button
                type="button"
                onClick={() => onSelect(id)}
                aria-pressed={selected === id}
                title={`${title} — click to filter`}
                className={cn(chipBase, "text-[11px] hover:brightness-110")}
                style={style}
              >
                {label}
              </button>
            ) : (
              <span title={title} className={cn(chipBase, "text-[11px]")} style={style}>
                {label}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

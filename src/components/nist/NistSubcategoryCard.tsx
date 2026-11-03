/** One NIST AI RMF subcategory in the detailed-mapping view (deep-link target `#sub-GOVERN-1-1`). */
import { ArrowRight, PanelRightOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { AISVS_VERSION } from "@/data/aisvs";
import type { NistRmfSubcategory } from "@/data/nist";
import { entryDomId } from "@/components/taxonomy/deepLink";
import { AisvsChapterChips, EditorialName, GaiRiskChips, RequirementLinks } from "./NistChips";

export interface NistSubcategoryCardProps {
  sub: NistRmfSubcategory;
  selected?: boolean;
  chapterEmphasis?: string;
  gaiSelected?: string;
  onSelect: (code: string) => void;
  onGaiFilter?: (id: string) => void;
}

export function NistSubcategoryCard({
  sub,
  selected,
  chapterEmphasis,
  gaiSelected,
  onSelect,
  onGaiFilter,
}: NistSubcategoryCardProps) {
  return (
    <article
      id={entryDomId(sub.code, "sub")}
      aria-labelledby={`${entryDomId(sub.code, "sub")}-title`}
      className={cn(
        "scroll-mt-24 rounded-lg border p-4 transition-colors",
        selected ? "border-primary bg-primary/5" : "hover:border-primary/40",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h4 id={`${entryDomId(sub.code, "sub")}-title`} className="text-sm font-semibold">
            <span className="font-mono">{sub.code}</span>{" "}
            <EditorialName name={sub.name} className="font-semibold" />
          </h4>
          <p className="text-sm text-muted-foreground">{sub.description}</p>
        </div>
        <button
          type="button"
          onClick={() => onSelect(sub.code)}
          aria-pressed={selected}
          aria-label={`Show details for ${sub.code}`}
          title="Show details"
          className="shrink-0 rounded-md border p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <PanelRightOpen aria-hidden className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 space-y-2 border-t pt-3">
        <p className="flex items-center gap-1.5 text-xs font-medium">
          <ArrowRight aria-hidden className="h-3.5 w-3.5 text-muted-foreground" />
          Maps to AISVS {AISVS_VERSION}
        </p>
        {sub.organizational ? (
          <p className="text-xs text-muted-foreground">
            <span className="mr-1 rounded border border-dashed px-1.5 py-0.5">
              Organizational practice
            </span>
            No AISVS chapter addresses it directly.
          </p>
        ) : (
          <>
            <AisvsChapterChips chapters={sub.aisvs} emphasis={chapterEmphasis} />
            <p className="text-xs text-muted-foreground">{sub.rationale}</p>
            <RequirementLinks ids={sub.requirements} />
          </>
        )}
        {sub.gaiRisks && sub.gaiRisks.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-medium text-muted-foreground">NIST AI 600-1:</span>
            <GaiRiskChips ids={sub.gaiRisks} selected={gaiSelected} onSelect={onGaiFilter} />
          </div>
        )}
      </div>
    </article>
  );
}

export default NistSubcategoryCard;

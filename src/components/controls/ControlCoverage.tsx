/**
 * ControlCoverage — OWASP AISVS 1.01 chapter coverage by the site's controls (§6.4, §9).
 * One row per chapter; each segment is a control mapped to the chapter (`aisvsCategories`),
 * sized by the requirements it cites there. The filled length is the chapter's distinct cited
 * requirements over its total, so overlapping citations are not double-counted.
 */
import { useNavigate } from "react-router-dom";
import type { Mitigation } from "@/components/components/securityData";
import { CoverageBars, type CoverageRow } from "@/components/charts/CoverageBars";
import { aisvsData } from "@/data/aisvs";
import { percent } from "@/components/charts/chartUtils";
import { controlCode } from "@/components/threats/threatIndex";
import { citedInChapter, controlChapters, controlColor } from "./controlIndex";

export interface ControlCoverageProps {
  controls: readonly Mitigation[];
  chapters: readonly string[];
  className?: string;
}

const MAX_LISTED = 6;

export function ControlCoverage({ controls, chapters, className }: ControlCoverageProps) {
  const navigate = useNavigate();
  const rows: (CoverageRow & { controlCount: number; distinct: number })[] = chapters
    .filter((code) => code in aisvsData)
    .map((code) => {
      const cat = aisvsData[code];
      const mapped = controls.filter((m) => controlChapters(m).includes(code));
      const chapterOnly = mapped.filter((m) => citedInChapter(m, code).length === 0);
      const distinct = new Set(mapped.flatMap((m) => citedInChapter(m, code).map((r) => r.id)))
        .size;
      return {
        id: code,
        label: `${code} ${cat.name}`,
        sublabel: chapterOnly.length
          ? `Chapter-level only: ${chapterOnly.map((m) => controlCode(m.id)).join(", ")}`
          : undefined,
        total: cat.requirementCount,
        filled: distinct,
        controlCount: mapped.length,
        distinct,
        segments: mapped.map((m) => {
          const cited = citedInChapter(m, code);
          return {
            id: m.id,
            label: `${controlCode(m.id)} ${m.name}`,
            value: cited.length,
            color: controlColor(m.id),
            detail: (
              <p className="max-w-xs font-mono text-[11px] text-muted-foreground">
                {cited
                  .slice(0, MAX_LISTED)
                  .map((r) => r.id)
                  .join(", ")}
                {cited.length > MAX_LISTED ? ` +${cited.length - MAX_LISTED} more` : ""}
              </p>
            ),
          };
        }),
      };
    });

  return (
    <CoverageBars
      className={className}
      rows={rows}
      scale="row"
      labelWidth={240}
      title="AISVS 1.01 coverage by control"
      description="Each bar is one AISVS chapter at full length. Coloured segments are the controls mapped to it, sized by the requirements each cites there; the filled length counts each requirement once. Select a segment to open the control, or a chapter name to open it in AISVS."
      ariaLabel={`Coverage of ${rows.length} AISVS chapters by ${controls.length} controls: ${rows
        .map((r) => `${r.id} ${r.distinct} of ${r.total} requirements`)
        .join("; ")}.`}
      valueFormat={(row) => {
        const r = row as (typeof rows)[number];
        return `${r.distinct}/${r.total} (${percent(r.distinct, r.total ?? 0)}%) · ${r.controlCount} ctl`;
      }}
      onSegmentClick={(_, seg) => navigate(`/controls/${seg.id}`)}
      onRowClick={(row) => navigate(`/aisvs#${row.id}`)}
    />
  );
}

export default ControlCoverage;

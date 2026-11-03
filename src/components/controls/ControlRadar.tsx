/**
 * ControlRadar — one control's footprint across the 12 OWASP AISVS 1.01 chapters: requirements
 * the control cites per chapter. Lazy-loaded by ControlDetail (recharts).
 */
import type { Mitigation } from "@/components/components/securityData";
import { Radar } from "@/components/charts/Radar";
import { AISVS_CHAPTER_CODES, aisvsData } from "@/data/aisvs";
import { controlCode } from "@/components/threats/threatIndex";
import { chapterOnlyMappings, citedInChapter } from "./controlIndex";

export default function ControlRadar({ control }: { control: Mitigation }) {
  const values = Object.fromEntries(
    AISVS_CHAPTER_CODES.map((c) => [c, citedInChapter(control, c).length]),
  );
  const chapterOnly = chapterOnlyMappings(control);
  const cited = Object.entries(values).filter(([, v]) => v > 0);
  return (
    <div>
      <Radar
        title="AISVS footprint"
        description="Requirements this control cites in each AISVS 1.01 chapter."
        ariaLabel={`${controlCode(control.id)} cites ${cited
          .map(([c, v]) => `${v} in ${c}`)
          .join(", ")} AISVS requirements.`}
        axes={AISVS_CHAPTER_CODES.map((c) => ({ key: c, label: c }))}
        series={[
          {
            id: control.id,
            label: controlCode(control.id),
            values,
          },
        ]}
        max={Math.max(1, ...Object.values(values))}
        height={300}
        valueFormat={(v) => `${v} requirement${v === 1 ? "" : "s"}`}
      />
      {chapterOnly.length > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          Also mapped at chapter level with no specific requirement:{" "}
          {chapterOnly.map((c) => `${c} ${aisvsData[c]?.name ?? ""}`.trim()).join(", ")}.
        </p>
      )}
    </div>
  );
}

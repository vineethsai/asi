/**
 * ControlFootprint — one control's footprint across the 12 OWASP AISVS 1.01 chapters: one row per
 * chapter (C1–C12, code + chapter name), bar length = requirements the control cites there.
 * Controls cite only a few chapters, so a radar collapses to a spike; a bar list keeps every
 * chapter readable: cited rows get a bar and their count, uncited rows a faint baseline and "0".
 * HTML bars grow from 0 (§8.4, CSS, reduced-motion safe); a sr-only table carries the numbers.
 */
import { useEffect, useState } from "react";
import type { Mitigation } from "@/components/components/securityData";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { CHART_MOTION, stagger, usePrefersReducedMotion } from "@/components/charts/motion";
import { AISVS_CHAPTER_CODES, AISVS_VERSION, aisvsData } from "@/data/aisvs";
import { controlCode } from "@/components/threats/threatIndex";
import { cn } from "@/lib/utils";
import { chapterOnlyMappings, citedInChapter } from "./controlIndex";

const plural = (n: number) => `${n} requirement${n === 1 ? "" : "s"}`;

export default function ControlFootprint({ control }: { control: Mitigation }) {
  const reduced = usePrefersReducedMotion();
  const [grown, setGrown] = useState(reduced);
  useEffect(() => {
    if (reduced) return setGrown(true);
    const id = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(id);
  }, [reduced]);

  const rows = AISVS_CHAPTER_CODES.map((code) => ({
    code,
    name: aisvsData[code]?.name ?? "",
    value: citedInChapter(control, code).length,
  }));
  const max = Math.max(1, ...rows.map((r) => r.value));
  const cited = rows.filter((r) => r.value > 0);
  const chapterOnly = chapterOnlyMappings(control);
  const code = controlCode(control.id);

  return (
    <div>
      <ChartFrame
        title="AISVS footprint"
        description={`Requirements this control cites in each AISVS ${AISVS_VERSION} chapter.`}
        ariaLabel={
          cited.length
            ? `${code} cites ${cited.map((r) => `${r.value} in ${r.code}`).join(", ")} AISVS requirements; the other ${rows.length - cited.length} chapters have none.`
            : `${code} cites no specific AISVS requirements.`
        }
        table={{
          columns: ["AISVS chapter", code],
          rows: rows.map((r) => [`${r.code} ${r.name}`.trim(), plural(r.value)]),
        }}
      >
        <ul className="space-y-1">
          {rows.map((r, i) => {
            const on = r.value > 0;
            return (
              <li
                key={r.code}
                data-chapter={r.code}
                className="grid grid-cols-[2.25rem_minmax(0,8rem)_minmax(0,1fr)_1.5rem] items-center gap-x-2 text-xs sm:grid-cols-[2.25rem_minmax(0,11rem)_minmax(0,1fr)_1.5rem]"
              >
                <span
                  className={cn(
                    "font-mono font-semibold",
                    on ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {r.code}
                </span>
                <span
                  className={cn("truncate", on ? "text-foreground" : "text-muted-foreground")}
                  title={r.name}
                >
                  {r.name}
                </span>
                <span aria-hidden className="relative flex h-3.5 items-center">
                  {on ? (
                    <span
                      className="h-full min-w-[4px] rounded-sm bg-primary"
                      style={{
                        width: grown ? `${(r.value / max) * 100}%` : "0%",
                        transition: `width ${CHART_MOTION.barMs}ms ${CHART_MOTION.cssEase} ${stagger(i, reduced)}ms`,
                      }}
                    />
                  ) : (
                    <span className="h-px w-full bg-border" />
                  )}
                </span>
                <span
                  className={cn(
                    "text-right font-mono tabular-nums",
                    on ? "font-semibold text-foreground" : "text-muted-foreground",
                  )}
                >
                  {r.value}
                </span>
              </li>
            );
          })}
        </ul>
      </ChartFrame>
      {chapterOnly.length > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          Also mapped at chapter level with no specific requirement:{" "}
          {chapterOnly.map((c) => `${c} ${aisvsData[c]?.name ?? ""}`.trim()).join(", ")}.
        </p>
      )}
    </div>
  );
}

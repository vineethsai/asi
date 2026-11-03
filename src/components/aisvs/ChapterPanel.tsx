import { Link } from "react-router-dom";
import { CheckCheck, ExternalLink, Undo2 } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { StackedBars } from "@/components/charts/StackedBars";
import { getIcon } from "@/lib/icons";
import { aisvsLevelBand } from "@/lib/severity";
import { cn } from "@/lib/utils";
import type { AISVSCategory, AISVSRequirement, AISVSSubCategory } from "@/data/aisvs";
import { Highlight } from "./Highlight";
import { RequirementRow } from "./RequirementRow";
import {
  AISVS_LEVELS,
  CHAPTER_LEVEL_IDS,
  controlsCitingChapter,
  domId,
  type AisvsLevel,
} from "./aisvsIndex";

export interface VisibleSection {
  section: AISVSSubCategory;
  requirements: AISVSRequirement[];
}

export interface ChapterPanelProps {
  chapter: AISVSCategory;
  sections: VisibleSection[];
  checked: ReadonlySet<string>;
  query: string;
  filtered: boolean;
  openSections: string[];
  onOpenSectionsChange: (chapter: string, open: string[]) => void;
  onToggle: (id: string) => void;
  onSetMany: (ids: readonly string[], done: boolean) => void;
  onCopy: (req: AISVSRequirement) => void;
  onAnchor: (code: string) => void;
  levelFilter: AisvsLevel | null;
  onLevelSelect: (level: AisvsLevel | null) => void;
}

/** One AISVS chapter as an accordion item: header with progress, sections, requirement rows. */
export function ChapterPanel({
  chapter,
  sections,
  checked,
  query,
  filtered,
  openSections,
  onOpenSectionsChange,
  onToggle,
  onSetMany,
  onCopy,
  onAnchor,
  levelFilter,
  onLevelSelect,
}: ChapterPanelProps) {
  const ChapterIcon = getIcon(chapter.code);
  const levelIds = CHAPTER_LEVEL_IDS[chapter.code];
  const total = chapter.requirementCount;
  const done = AISVS_LEVELS.reduce(
    (n, l) => n + levelIds[l].reduce((m, id) => m + (checked.has(id) ? 1 : 0), 0),
    0,
  );
  const pct = total ? Math.round((done / total) * 100) : 0;
  const shown = sections.reduce((n, s) => n + s.requirements.length, 0);
  const chapterControls = controlsCitingChapter(chapter.code);

  return (
    <AccordionItem
      value={chapter.code}
      id={domId(chapter.code)}
      className="scroll-mt-24 overflow-hidden rounded-lg border bg-card"
    >
      <AccordionTrigger className="px-4 py-4 text-left hover:no-underline sm:px-6">
        <span className="flex w-full min-w-0 items-start gap-3 pr-2">
          <span
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-muted/50"
            style={{ color: chapter.color }}
            aria-hidden
          >
            <ChapterIcon className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-semibold leading-snug sm:text-lg">
              <span className="font-mono">{chapter.code}</span>{" "}
              <Highlight text={chapter.name} query={query} />
            </span>
            <span className="mt-1 line-clamp-2 block text-sm font-normal text-muted-foreground">
              {chapter.description}
            </span>
            <span className="mt-2 flex items-center gap-3 text-xs font-normal text-muted-foreground">
              <span
                className="relative h-1.5 w-28 overflow-hidden rounded-full bg-muted sm:w-40"
                aria-hidden
              >
                <span
                  className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-500"
                  style={{ width: `${pct}%` }}
                />
              </span>
              <span className="tabular-nums">
                {done} / {total} verified ({pct}%)
              </span>
              {filtered && (
                <span className="tabular-nums text-foreground">
                  · {shown} {shown === 1 ? "match" : "matches"}
                </span>
              )}
            </span>
          </span>
        </span>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">{chapter.description}</p>
            {chapterControls.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-muted-foreground">Controls mapped to {chapter.code}:</span>
                {chapterControls.map((c) => (
                  <Link
                    key={c.id}
                    to={`/controls/${c.id}`}
                    title={c.name}
                    className="rounded-full border px-2 py-0.5 font-mono hover:bg-muted"
                  >
                    {c.id.toUpperCase()}
                  </Link>
                ))}
              </div>
            )}
            <a
              href={chapter.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              {chapter.code} in the AISVS {chapter.version} source
              <ExternalLink className="h-3 w-3" aria-hidden />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </div>
          <StackedBars
            compact
            ariaLabel={`${chapter.code} progress by AISVS level`}
            data={AISVS_LEVELS.map((l) => ({
              id: `L${l}`,
              label: `Level ${l}`,
              done: levelIds[l].reduce((m, id) => m + (checked.has(id) ? 1 : 0), 0),
              total: levelIds[l].length,
              band: aisvsLevelBand(l),
            })).filter((d) => d.total > 0)}
            selectedId={levelFilter ? `L${levelFilter}` : null}
            onSelect={(id) => onLevelSelect(id ? (Number(id.slice(1)) as AisvsLevel) : null)}
          />
        </div>

        <Accordion
          type="multiple"
          value={openSections}
          onValueChange={(v) => onOpenSectionsChange(chapter.code, v)}
          className="mt-4"
        >
          {sections.map(({ section, requirements }) => {
            const ids = requirements.map((r) => r.id);
            const sectionDone = section.requirements.filter((r) => checked.has(r.id)).length;
            const allShownDone = ids.length > 0 && ids.every((id) => checked.has(id));
            return (
              <AccordionItem
                key={section.code}
                value={section.code}
                id={domId(section.code)}
                className="scroll-mt-24"
              >
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 shrink-0 rounded border px-1.5 py-0.5 font-mono text-xs">
                      {section.code}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-medium">
                        <Highlight text={section.name} query={query} />
                      </span>
                      <span className="mt-0.5 block text-xs font-normal text-muted-foreground tabular-nums">
                        {sectionDone} / {section.requirements.length} verified
                        {filtered && ids.length !== section.requirements.length
                          ? ` · showing ${ids.length}`
                          : ""}
                      </span>
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  {section.description && (
                    <p className="mb-3 text-sm text-muted-foreground">{section.description}</p>
                  )}
                  <div className="mb-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className={cn("h-7 text-xs", allShownDone && "hidden")}
                      onClick={() => onSetMany(ids, true)}
                    >
                      <CheckCheck className="mr-1 h-3.5 w-3.5" aria-hidden />
                      Mark {ids.length === 1 ? "it" : `these ${ids.length}`} verified
                    </Button>
                    {ids.some((id) => checked.has(id)) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => onSetMany(ids, false)}
                      >
                        <Undo2 className="mr-1 h-3.5 w-3.5" aria-hidden />
                        Clear
                      </Button>
                    )}
                  </div>
                  <ul className="space-y-2">
                    {requirements.map((req) => (
                      <RequirementRow
                        key={req.id}
                        req={req}
                        checked={checked.has(req.id)}
                        query={query}
                        onToggle={onToggle}
                        onCopy={onCopy}
                        onAnchor={onAnchor}
                      />
                    ))}
                  </ul>
                  {section.removed.length > 0 && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Removed upstream: {section.removed.join(", ")}
                    </p>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </AccordionContent>
    </AccordionItem>
  );
}

export default ChapterPanel;

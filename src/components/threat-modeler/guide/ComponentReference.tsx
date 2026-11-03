import { Icon } from "@/lib/icons";
import { PALETTE_SECTIONS, type PaletteEntry, type PaletteSection } from "../paletteData";
import { MAESTRO_LAYER_NAMES, type MaestroLayer } from "../types";
import { Chip } from "./GuideSection";

function groupBySubgroup(entries: PaletteEntry[]): [string | undefined, PaletteEntry[]][] {
  const out = new Map<string | undefined, PaletteEntry[]>();
  for (const e of entries) {
    const list = out.get(e.subgroup) ?? [];
    list.push(e);
    out.set(e.subgroup, list);
  }
  return [...out.entries()];
}

function EntryRow({ entry }: { entry: PaletteEntry }) {
  const layers = (entry.data.maestroLayers ?? []) as MaestroLayer[];
  return (
    <li className="flex gap-3 rounded-md border bg-card p-3">
      <span className="mt-0.5 shrink-0 rounded-md bg-muted p-1.5">
        <Icon name={entry.icon} className="h-4 w-4 text-foreground" />
      </span>
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-semibold leading-tight">{entry.label}</p>
        <p className="text-xs text-muted-foreground">{entry.why}</p>
        <div className="flex flex-wrap gap-1">
          {entry.chips.map((c) => (
            <Chip key={c}>{c}</Chip>
          ))}
          {layers.map((l) => (
            <Chip key={`L${l}`} className="font-sans">
              L{l} {MAESTRO_LAYER_NAMES[l]}
            </Chip>
          ))}
        </div>
      </div>
    </li>
  );
}

function SectionCard({ section }: { section: PaletteSection }) {
  return (
    <details
      className="group rounded-lg border bg-card/50 open:bg-card"
      open={section.id === "agentic"}
    >
      <summary className="flex cursor-pointer list-none items-start gap-3 rounded-lg p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        <span
          aria-hidden
          className="mt-1 h-3 w-3 shrink-0 rounded-sm"
          style={{ background: section.color }}
        />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">{section.label}</span>
          <span className="block text-xs text-muted-foreground">{section.description}</span>
        </span>
        <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
          {section.entries.length} item{section.entries.length === 1 ? "" : "s"}
          <span aria-hidden className="ml-1 inline-block transition-transform group-open:rotate-90">
            ›
          </span>
        </span>
      </summary>
      <div className="space-y-3 px-3 pb-3">
        {groupBySubgroup(section.entries).map(([sub, entries]) => (
          <div key={sub ?? "_"} className="space-y-2">
            {sub && (
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {sub}
              </p>
            )}
            <ul className="grid gap-2 md:grid-cols-2">
              {entries.map((e) => (
                <EntryRow key={e.id} entry={e} />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </details>
  );
}

/**
 * Component reference generated from the palette (PALETTE_SECTIONS): the
 * Agentic group, then the official OWASP KC1–KC6 groups (names from
 * src/data/kc.ts), then the data-flow primitives.
 */
export default function ComponentReference() {
  return (
    <div className="space-y-2">
      {PALETTE_SECTIONS.map((s) => (
        <SectionCard key={s.id} section={s} />
      ))}
    </div>
  );
}

import { Fragment, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import {
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { useCanvasActions } from "./hooks/useCanvasActions";
import {
  PALETTE_DND_TYPE,
  PALETTE_SECTIONS,
  customEntry,
  entryHaystack,
  type PaletteEntry,
  type PaletteSection,
} from "./paletteData";
import { tm, useTM } from "./store";
import type { CustomComponentDefinition } from "./types";

export interface ComponentPaletteProps {
  /** "pane": docked column · "rail": 48px icon strip · "sheet": full-width mobile sheet. */
  variant: "pane" | "rail" | "sheet";
  /** Called after an item is added (e.g. to close the mobile sheet). */
  onAdded?: () => void;
}

const CUSTOM_ID = "custom";
const CUSTOM_COLOR = "hsl(var(--muted-foreground))";

/**
 * When the rail asks to expand, the pane variant mounts afterwards; this
 * module-level hand-off tells it which section to reveal or to focus search.
 */
let pendingReveal: { section?: string; search?: boolean } | null = null;

function sectionDomId(id: string) {
  return `tm-palette-section-${id}`;
}

/** Nodes created from a custom definition (same heuristic as the editor's sync). */
function nodesUsing(def: CustomComponentDefinition): number {
  const threatIds = new Set(def.customThreats.map((t) => t.id));
  return tm().document.nodes.filter((n) => {
    const d = n.data;
    if (!d?.isCustom) return false;
    return d.label === def.name || (d.customThreatIds ?? []).some((id) => threatIds.has(id));
  }).length;
}

function groupBySubgroup(
  entries: PaletteEntry[],
): { subgroup?: string; entries: PaletteEntry[] }[] {
  const out: { subgroup?: string; entries: PaletteEntry[] }[] = [];
  for (const e of entries) {
    const last = out[out.length - 1];
    if (last && last.subgroup === e.subgroup) last.entries.push(e);
    else out.push({ subgroup: e.subgroup, entries: [e] });
  }
  return out;
}

export default function ComponentPalette({ variant, onAdded }: ComponentPaletteProps) {
  const actions = useCanvasActions();
  const readOnly = useTM((s) => s.persist === "readonly");
  const customComponents = useTM((s) => s.document.customComponents);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Set<string>>(() => new Set(["agentic", CUSTOM_ID]));
  const searchRef = useRef<HTMLInputElement>(null);

  const customSection: PaletteSection = useMemo(
    () => ({
      id: CUSTOM_ID,
      label: "Custom components",
      description: "Components you defined for this model, with their own threats.",
      color: CUSTOM_COLOR,
      icon: "puzzle",
      entries: customComponents.map(customEntry),
    }),
    [customComponents],
  );
  const sections = useMemo(() => [...PALETTE_SECTIONS, customSection], [customSection]);

  const normalized = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    const tokens = normalized.split(/\s+/).filter(Boolean);
    return sections.map((s) => ({
      section: s,
      entries: tokens.length
        ? s.entries.filter((e) => {
            const hay = entryHaystack(e, s);
            return tokens.every((t) => hay.includes(t));
          })
        : s.entries,
    }));
  }, [sections, normalized]);
  const searching = normalized.length > 0;
  const matchCount = filtered.reduce((n, f) => n + f.entries.length, 0);

  // Consume a reveal request from the rail once the expanded palette mounts.
  useEffect(() => {
    if (variant === "rail" || !pendingReveal) return;
    const req = pendingReveal;
    pendingReveal = null;
    if (req.search) {
      window.requestAnimationFrame(() => searchRef.current?.focus());
      return;
    }
    if (req.section) {
      const id = req.section;
      setOpen((s) => new Set(s).add(id));
      window.requestAnimationFrame(() => {
        const el = document.getElementById(sectionDomId(id));
        el?.scrollIntoView({ block: "start", behavior: "smooth" });
        el?.querySelector<HTMLButtonElement>("button[aria-expanded]")?.focus({
          preventScroll: true,
        });
      });
    }
  }, [variant]);

  const add = (entry: PaletteEntry) => {
    if (readOnly) return;
    const id = actions.addEntry(entry);
    if (id) onAdded?.();
  };

  const onDragStart = (e: DragEvent, entry: PaletteEntry) => {
    if (readOnly) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData(PALETTE_DND_TYPE, entry.id);
    e.dataTransfer.effectAllowed = "copy";
  };

  const toggle = (id: string) =>
    setOpen((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const deleteCustom = (def: CustomComponentDefinition) => {
    const used = nodesUsing(def);
    const msg =
      `Delete custom component "${def.name}"?` +
      (used
        ? `\n\n${used} component${used === 1 ? "" : "s"} on the canvas use it. They stay on the canvas but lose this definition's custom threats.`
        : "");
    if (!window.confirm(msg)) return;
    const ok = tm().commit(
      (doc) => ({ ...doc, customComponents: doc.customComponents.filter((c) => c.id !== def.id) }),
      "Delete custom component",
    );
    if (ok) toast.success(`Deleted "${def.name}"`, { description: "Undo with ⌘/Ctrl+Z." });
  };

  // ─── Rail ─────────────────────────────────────────────────────
  if (variant === "rail") {
    const expand = (req: { section?: string; search?: boolean }) => {
      pendingReveal = req;
      tm().setUi({ paletteMode: "open" });
    };
    return (
      <nav
        data-tour="palette"
        aria-label="Component palette (collapsed)"
        className="flex h-full w-12 shrink-0 flex-col items-center gap-1 overflow-y-auto border-r bg-background py-2"
      >
        <button
          type="button"
          onClick={() => expand({ search: true })}
          aria-label="Search components"
          title="Search components"
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Search className="h-4 w-4" aria-hidden />
        </button>
        <div className="my-1 h-px w-6 bg-border" aria-hidden />
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => expand({ section: s.id })}
            aria-label={`Open ${s.label} (${s.entries.length})`}
            title={`${s.label} · ${s.entries.length}`}
            className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Icon name={s.icon} className="h-4 w-4" style={{ color: s.color }} />
          </button>
        ))}
      </nav>
    );
  }

  // ─── Pane / sheet ─────────────────────────────────────────────
  const renderItem = (entry: PaletteEntry, section: PaletteSection) => {
    const whyId = `tm-palette-why-${entry.id}`;
    const def = entry.customId ? customComponents.find((c) => c.id === entry.customId) : undefined;
    return (
      <li key={entry.id} className="group relative">
        <div
          className="flex items-stretch rounded-md border border-l-[3px] bg-card transition-colors hover:bg-accent/50"
          style={{ borderLeftColor: section.color }}
        >
          <button
            type="button"
            draggable={!readOnly}
            onDragStart={(e) => onDragStart(e, entry)}
            onClick={() => add(entry)}
            disabled={readOnly}
            aria-label={entry.label}
            aria-describedby={whyId}
            title={readOnly ? undefined : "Click or press Enter to add · drag to place"}
            className={cn(
              "flex min-w-0 flex-1 items-start gap-2 rounded-l-md p-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
              readOnly ? "cursor-default opacity-70" : "cursor-grab active:cursor-grabbing",
            )}
          >
            <Icon
              name={entry.icon}
              className="mt-0.5 h-4 w-4 shrink-0"
              style={{ color: def?.color || section.color }}
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-medium">{entry.label}</span>
              <span
                id={whyId}
                className="line-clamp-2 block text-[11px] leading-snug text-muted-foreground"
              >
                {entry.why}
              </span>
              {entry.chips.length > 0 && (
                <span className="mt-1 flex flex-wrap gap-1">
                  {entry.chips.slice(0, 3).map((c) => (
                    <span
                      key={c}
                      className="rounded border bg-muted/50 px-1 text-[11px] leading-4 text-muted-foreground"
                    >
                      {c}
                    </span>
                  ))}
                </span>
              )}
            </span>
          </button>
          <div className="flex flex-col items-center justify-start gap-0.5 p-1">
            <button
              type="button"
              tabIndex={-1}
              onClick={() => add(entry)}
              disabled={readOnly}
              aria-label={`Add ${entry.label} to canvas`}
              title={`Add ${entry.label} to canvas`}
              className="flex h-6 w-6 items-center justify-center rounded border bg-background text-foreground hover:bg-primary hover:text-primary-foreground disabled:pointer-events-none disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
            </button>
            {def && !readOnly && (
              <>
                <button
                  type="button"
                  onClick={() => tm().openDialog("customComponent", { editId: def.id })}
                  aria-label={`Edit custom component ${def.name}`}
                  title="Edit"
                  className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Pencil className="h-3 w-3" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => deleteCustom(def)}
                  aria-label={`Delete custom component ${def.name}`}
                  title="Delete"
                  className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Trash2 className="h-3 w-3" aria-hidden />
                </button>
              </>
            )}
          </div>
        </div>
      </li>
    );
  };

  return (
    <aside
      data-tour="palette"
      aria-label="Component palette"
      className={cn(
        "flex h-full min-h-0 flex-col bg-background",
        variant === "pane" ? "w-64 shrink-0 border-r" : "w-full",
      )}
    >
      <div className="space-y-2 border-b p-2">
        <div className="flex items-center gap-2">
          <h2 className="flex-1 text-sm font-semibold">Components</h2>
          {variant === "pane" && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => tm().setUi({ paletteMode: "rail" })}
              aria-label="Collapse palette"
              title="Collapse palette"
            >
              <PanelLeftClose className="h-4 w-4" aria-hidden />
            </Button>
          )}
        </div>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape" && query) {
                e.stopPropagation();
                setQuery("");
              }
            }}
            placeholder="Search components, KC, chips…"
            aria-label="Search components"
            className="h-8 pl-7 text-xs"
          />
        </div>
        {searching && (
          <p className="text-[11px] text-muted-foreground" aria-live="polite">
            {matchCount} match{matchCount === 1 ? "" : "es"}
          </p>
        )}
        {readOnly ? (
          <p className="rounded border bg-muted/40 p-1.5 text-[11px] text-muted-foreground">
            Read-only shared model — make a copy to add components.
          </p>
        ) : (
          <p className="text-[11px] text-muted-foreground">
            Click, tap or press Enter to add · drag to place.
          </p>
        )}
      </div>

      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
        {searching && matchCount === 0 && (
          <div className="py-6 text-center text-xs text-muted-foreground">
            No components match “{query.trim()}”.
            <Button
              size="sm"
              variant="link"
              className="h-auto p-0 pl-1 text-xs"
              onClick={() => setQuery("")}
            >
              <X className="mr-0.5 h-3 w-3" aria-hidden />
              Clear
            </Button>
          </div>
        )}
        {filtered.map(({ section, entries }) => {
          if (searching && entries.length === 0) return null;
          const isCustom = section.id === CUSTOM_ID;
          const expanded = searching || open.has(section.id);
          const panelId = `${sectionDomId(section.id)}-panel`;
          return (
            <section key={section.id} id={sectionDomId(section.id)} className="scroll-mt-2">
              <h3>
                <button
                  type="button"
                  onClick={() => toggle(section.id)}
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  disabled={searching}
                  className="flex w-full items-center gap-1.5 rounded-md px-1 py-1.5 text-left text-xs font-semibold hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default"
                >
                  {expanded ? (
                    <ChevronDown
                      className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                  ) : (
                    <ChevronRight
                      className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                  )}
                  <Icon
                    name={section.icon}
                    className="h-3.5 w-3.5 shrink-0"
                    style={{ color: section.color }}
                  />
                  <span className="min-w-0 flex-1 truncate">{section.label}</span>
                  <span
                    className="rounded-full bg-muted px-1.5 text-[11px] font-normal text-muted-foreground"
                    aria-label={`${entries.length} components`}
                  >
                    {searching
                      ? `${entries.length}/${section.entries.length}`
                      : section.entries.length}
                  </span>
                </button>
              </h3>
              {expanded && (
                <div id={panelId} className="space-y-1.5 pb-2 pl-1 pt-0.5">
                  {!searching && (
                    <p className="px-1 text-[11px] leading-snug text-muted-foreground">
                      {section.description}
                    </p>
                  )}
                  {isCustom && !searching && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 w-full gap-1 text-xs"
                      onClick={() => tm().openDialog("customComponent")}
                      disabled={readOnly}
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden />
                      New custom component
                    </Button>
                  )}
                  {isCustom && entries.length === 0 && !searching && (
                    <p className="px-1 text-[11px] text-muted-foreground">
                      None yet. Custom components are saved with this model.
                    </p>
                  )}
                  {groupBySubgroup(entries).map((g, i) => (
                    <Fragment key={`${g.subgroup ?? "_"}-${i}`}>
                      {g.subgroup && (
                        <h4 className="px-1 pt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          {g.subgroup}
                        </h4>
                      )}
                      <ul className="space-y-1.5" aria-label={g.subgroup ?? section.label}>
                        {g.entries.map((e) => renderItem(e, section))}
                      </ul>
                    </Fragment>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </aside>
  );
}

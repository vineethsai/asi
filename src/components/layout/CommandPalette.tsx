import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Command } from "cmdk";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  ClipboardCheck,
  Clock,
  FileText,
  GitBranch,
  GraduationCap,
  Library,
  ListOrdered,
  Network,
  Search,
  ShieldAlert,
  ShieldCheck,
  SunMoon,
  Trophy,
  Waypoints,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "./ThemeProvider";
import {
  PALETTE_GROUP_LABELS,
  loadDataIndex,
  loadNistIndex,
  searchEntries,
  staticEntries,
  type PaletteEntry,
  type PaletteGroup,
  type PaletteResultGroup,
} from "./paletteIndex";

const RECENT_KEY = "ash-palette-recent";
const RECENT_MAX = 6;

type RecentItem = Pick<PaletteEntry, "id" | "group" | "title" | "code" | "path">;

function readRecent(): RecentItem[] {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    const parsed = raw ? (JSON.parse(raw) as RecentItem[]) : [];
    return Array.isArray(parsed)
      ? parsed.filter((r) => r && r.id && r.path).slice(0, RECENT_MAX)
      : [];
  } catch {
    return [];
  }
}

function writeRecent(items: RecentItem[]) {
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(items.slice(0, RECENT_MAX)));
  } catch {
    // storage unavailable
  }
}

const GROUP_ICONS: Record<PaletteGroup, LucideIcon> = {
  recent: Clock,
  actions: ArrowRight,
  pages: FileText,
  threats: ShieldAlert,
  controls: ShieldCheck,
  components: Boxes,
  architectures: Network,
  aisvs: ClipboardCheck,
  asi: ShieldAlert,
  llm: ListOrdered,
  cisco: Waypoints,
  aiuc1: Library,
  nist: GitBranch,
};

/** Learning actions (P4-06): shortcuts into the learning path, quizzes and progress. */
const LEARN_ACTIONS: { entry: PaletteEntry; icon: LucideIcon }[] = [
  {
    icon: GraduationCap,
    id: "action:learning-path",
    title: "Start the learning path",
    subtitle: "Components → threats → controls → AISVS → NIST → model it",
    path: "/learn",
    keywords: "learn course tutorial steps beginner",
  },
  {
    icon: Trophy,
    id: "action:quiz",
    title: "Start a quiz",
    subtitle: "Take the Agentic Security Challenge",
    path: "/learn#challenge",
    keywords: "quiz challenge test questions",
  },
  {
    icon: BarChart3,
    id: "action:progress",
    title: "Open my progress",
    subtitle: "AISVS, controls, checklist, path and quiz scores; export or share",
    path: "/progress",
    keywords: "progress badge export import score dashboard",
  },
].map(({ icon, keywords, ...e }) => ({
  icon,
  entry: {
    ...e,
    group: "actions" as const,
    aliases: [],
    titleLower: e.title.toLowerCase(),
    haystack: [e.title, e.subtitle, keywords].join(" ").toLowerCase(),
  },
}));
const LEARN_ACTION_ICONS = new Map(LEARN_ACTIONS.map((a) => [a.entry.id, a.icon]));

function iconFor(entry: PaletteEntry | RecentItem): LucideIcon {
  const learnIcon = LEARN_ACTION_ICONS.get(entry.id);
  if (learnIcon) return learnIcon;
  if (entry.id === "action:toggle-theme") return SunMoon;
  if (entry.id === "action:threat-modeler") return Workflow;
  return GROUP_ICONS[entry.group] ?? FileText;
}

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialQuery?: string;
}

/**
 * Site-wide command palette (IMPROVEMENT_PLAN P1-10). Opened with ⌘K / Ctrl-K or "/" via
 * CommandPaletteProvider; this module (cmdk + the lazy data index) loads on first open.
 */
export function CommandPalette({ open, onOpenChange, initialQuery = "" }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { toggleTheme } = useTheme();
  const [query, setQuery] = useState(initialQuery);
  const [dataEntries, setDataEntries] = useState<PaletteEntry[] | null>(null);
  const [nistEntries, setNistEntries] = useState<PaletteEntry[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [recent, setRecent] = useState<RecentItem[]>(readRecent);
  const statics = useMemo(() => [...staticEntries(), ...LEARN_ACTIONS.map((a) => a.entry)], []);

  useEffect(() => {
    if (open) {
      setQuery(initialQuery);
      setRecent(readRecent());
    }
  }, [open, initialQuery]);

  useEffect(() => {
    if (!open || dataEntries) return;
    let cancelled = false;
    loadDataIndex()
      .then((entries) => !cancelled && setDataEntries(entries))
      .catch(() => !cancelled && setLoadError(true));
    loadNistIndex()
      .then((entries) => !cancelled && setNistEntries(entries))
      .catch(() => {
        // NIST entries are optional; the rest of the palette still works.
      });
    return () => {
      cancelled = true;
    };
  }, [open, dataEntries]);

  const allEntries = useMemo(
    () => [...statics, ...(dataEntries ?? []), ...nistEntries],
    [statics, dataEntries, nistEntries],
  );

  const groups: PaletteResultGroup[] = useMemo(() => {
    if (query.trim()) return searchEntries(allEntries, query);
    const result: PaletteResultGroup[] = [];
    if (recent.length) {
      result.push({
        group: "recent",
        label: PALETTE_GROUP_LABELS.recent,
        items: recent.map((r) => ({
          ...r,
          id: `recent:${r.id}`,
          aliases: [],
          titleLower: r.title.toLowerCase(),
          haystack: "",
        })),
      });
    }
    result.push({
      group: "actions",
      label: PALETTE_GROUP_LABELS.actions,
      items: statics.filter((e) => e.group === "actions"),
    });
    result.push({
      group: "pages",
      label: PALETTE_GROUP_LABELS.pages,
      items: statics.filter((e) => e.group === "pages"),
    });
    return result;
  }, [query, allEntries, recent, statics]);

  const runEntry = useCallback(
    (entry: PaletteEntry) => {
      const original = entry.id.startsWith("recent:")
        ? { ...entry, id: entry.id.slice("recent:".length) }
        : entry;
      onOpenChange(false);
      if (original.action === "toggle-theme") {
        toggleTheme();
        return;
      }
      if (!original.path) return;
      if (original.group !== "actions") {
        const item: RecentItem = {
          id: original.id,
          group: original.group,
          title: original.title,
          code: original.code,
          path: original.path,
        };
        const next = [item, ...readRecent().filter((r) => r.id !== item.id)];
        writeRecent(next);
        setRecent(next.slice(0, RECENT_MAX));
      }
      navigate(original.path);
    },
    [navigate, onOpenChange, toggleTheme],
  );

  const hasQuery = query.trim().length > 0;
  const loading = !dataEntries && !loadError;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-3 z-50 w-[calc(100%-1.5rem)] max-w-2xl -translate-x-1/2 overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-2xl sm:top-[12vh]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-150",
          )}
          aria-describedby="command-palette-help"
        >
          <DialogPrimitive.Title className="sr-only">Search the site</DialogPrimitive.Title>
          <Command
            label="Search the site"
            shouldFilter={false}
            loop
            vimBindings={false}
            className="flex max-h-[min(70vh,36rem)] flex-col"
          >
            <div className="flex items-center gap-2 border-b px-3">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                autoFocus
                placeholder="Search pages, threats, controls, AISVS… or a code like T7, ASI01, OB-004"
                className="h-12 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <kbd className="hidden shrink-0 rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground sm:inline">
                esc
              </kbd>
            </div>

            <Command.List className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
              {hasQuery && loading && (
                <Command.Loading>
                  <div className="px-3 py-2 text-xs text-muted-foreground">Loading index…</div>
                </Command.Loading>
              )}
              {hasQuery && groups.length === 0 && !loading && (
                <div className="px-3 py-10 text-center text-sm text-muted-foreground">
                  No results for “{query.trim()}”.
                </div>
              )}
              {groups.map((group) => (
                <Command.Group
                  key={group.group}
                  heading={group.label}
                  className="mb-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground"
                >
                  {group.items.map((item) => {
                    const Icon = iconFor(item);
                    return (
                      <Command.Item
                        key={item.id}
                        value={item.id}
                        onSelect={() => runEntry(item)}
                        className="flex cursor-pointer select-none items-center gap-3 rounded-md px-2 py-2 text-sm outline-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
                      >
                        <Icon
                          className="h-4 w-4 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                        />
                        {item.code && (
                          <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground/80">
                            {item.code}
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{item.title}</span>
                          {item.subtitle && (
                            <span className="block truncate text-xs text-muted-foreground">
                              {item.subtitle}
                            </span>
                          )}
                        </span>
                      </Command.Item>
                    );
                  })}
                </Command.Group>
              ))}
              {loadError && (
                <div className="px-3 py-2 text-xs text-destructive">
                  Could not load the search index. Pages are still searchable.
                </div>
              )}
            </Command.List>

            <div
              id="command-palette-help"
              className="flex items-center gap-3 border-t px-3 py-2 text-[11px] text-muted-foreground"
            >
              <span>
                <kbd className="font-mono">↑↓</kbd> navigate
              </span>
              <span>
                <kbd className="font-mono">↵</kbd> open
              </span>
              <span>
                <kbd className="font-mono">esc</kbd> close
              </span>
              <span className="ml-auto hidden sm:inline">
                Codes: T7 · M3 · KC6.1 · C5 · 1.2.3 · ASI01 · OB-004 · A001 · GOVERN.1.1
              </span>
            </div>
          </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export default CommandPalette;

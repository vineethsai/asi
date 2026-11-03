/* eslint-disable react-refresh/only-export-components -- lazy-loaded data module for the rail and drawer */
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { threatsData, mitigationsData } from "@/components/components/securityData";
import { architecturesData } from "@/components/components/architecturesData";
import { frameworkData, type ComponentNode } from "@/components/components/frameworkData";
import type { LayoutSection } from "./shellContext";

export interface SectionItem {
  id: string;
  label: string;
  /** Short code shown before the label (e.g. "T7", "KC6.1"). */
  code?: string;
  path: string;
  /** Nesting depth (components only). */
  level: number;
}

const SECTION_META: Record<LayoutSection, { label: string; path: string; all: string }> = {
  components: { label: "Components", path: "/components", all: "All components" },
  threats: { label: "Threats", path: "/threats", all: "All threats" },
  controls: { label: "Controls", path: "/controls", all: "All controls" },
  architectures: { label: "Architectures", path: "/architectures", all: "All architectures" },
};

const byOrder = <T extends { displayOrder?: number }>(a: T, b: T) =>
  (a.displayOrder ?? 999) - (b.displayOrder ?? 999);

function componentItems(nodes: ComponentNode[], level: number, out: SectionItem[]) {
  for (const node of nodes) {
    const id = node.id.replace(/-/g, ".");
    out.push({
      id,
      code: id.toUpperCase(),
      label: node.title.replace(/\s*\(KC[\d.]+\)\s*$/i, ""),
      path: `/components/${id}`,
      level,
    });
    if (node.children?.length) componentItems(node.children, level + 1, out);
  }
  return out;
}

const cache = new Map<LayoutSection, SectionItem[]>();

/** Entity list for a section, in canonical order. */
export function getSectionItems(section: LayoutSection): SectionItem[] {
  const hit = cache.get(section);
  if (hit) return hit;
  let items: SectionItem[];
  switch (section) {
    case "threats":
      items = Object.values(threatsData)
        .sort(byOrder)
        .map((t) => ({
          id: t.id,
          code: t.code,
          label: t.name,
          path: `/threats/${t.id}`,
          level: 0,
        }));
      break;
    case "controls":
      items = Object.values(mitigationsData)
        .sort(byOrder)
        .map((m) => ({ id: m.id, label: m.name, path: `/controls/${m.id}`, level: 0 }));
      break;
    case "architectures":
      items = Object.values(architecturesData)
        .sort(byOrder)
        .map((a) => ({ id: a.id, label: a.name, path: `/architectures/${a.id}`, level: 0 }));
      break;
    case "components":
      items = componentItems(frameworkData, 0, []);
      break;
  }
  cache.set(section, items);
  return items;
}

function isActiveItem(item: SectionItem, activeId: string | undefined, pathname: string) {
  if (activeId && item.id.toLowerCase() === activeId.replace(/-/g, ".").toLowerCase()) return true;
  return pathname === item.path;
}

interface SectionNavListProps {
  section: LayoutSection;
  activeId?: string;
  onNavigate?: () => void;
  className?: string;
}

/** Plain list of a section's entities (used by the rail and the mobile drawer). */
export function SectionNavList({ section, activeId, onNavigate, className }: SectionNavListProps) {
  const { pathname } = useLocation();
  const items = getSectionItems(section);

  return (
    <ul className={cn("space-y-0.5", className)}>
      {items.map((item) => {
        const active = isActiveItem(item, activeId, pathname);
        return (
          <li key={item.id}>
            <Link
              to={item.path}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-baseline gap-2 rounded-md py-1.5 pr-2 text-sm transition-colors duration-fast",
                active
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                item.level > 0 && "text-[13px]",
              )}
              style={{ paddingLeft: `${0.5 + item.level * 0.75}rem` }}
            >
              {item.code && (
                <span
                  className={cn(
                    "shrink-0 font-mono text-[11px] tabular-nums",
                    active ? "text-primary" : "text-muted-foreground/80",
                  )}
                >
                  {item.code}
                </span>
              )}
              <span className="min-w-0">{item.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

const COLLAPSE_KEY = "ash-rail-collapsed";

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

interface SectionRailProps {
  section: LayoutSection;
  activeId?: string;
}

/**
 * In-layout section navigation (IMPROVEMENT_PLAN P0-01): a sticky, collapsible left rail on
 * lg+ that sits in the page flow under the header, so it never overlaps content.
 */
export function SectionRail({ section, activeId }: SectionRailProps) {
  const meta = SECTION_META[section];
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    try {
      window.localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
    } catch {
      // ignore
    }
  }, [collapsed]);

  // Keep the active entry in view inside the rail (without scrolling the page).
  useEffect(() => {
    const container = scrollRef.current;
    const active = container?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!container || !active) return;
    const top = active.offsetTop - container.clientHeight / 2 + active.clientHeight / 2;
    container.scrollTop = Math.max(0, top);
  }, [pathname, activeId, collapsed]);

  return (
    <aside
      aria-label={`${meta.label} navigation`}
      className={cn(
        "sticky top-14 hidden h-[calc(100vh-3.5rem)] shrink-0 border-r bg-background lg:flex lg:flex-col",
        "transition-[width] duration-fast ease-standard",
        collapsed ? "w-12" : "w-64 xl:w-72",
      )}
    >
      <div
        className={cn(
          "flex h-11 shrink-0 items-center border-b",
          collapsed ? "justify-center" : "justify-between pl-4 pr-1",
        )}
      >
        {!collapsed && (
          <Link
            to={meta.path}
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            {meta.all}
          </Link>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          aria-label={
            collapsed
              ? `Show ${meta.label.toLowerCase()} list`
              : `Hide ${meta.label.toLowerCase()} list`
          }
          title={
            collapsed
              ? `Show ${meta.label.toLowerCase()} list`
              : `Hide ${meta.label.toLowerCase()} list`
          }
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </button>
      </div>
      {!collapsed && (
        <div
          ref={scrollRef}
          className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain p-2"
        >
          <nav aria-label={meta.label}>
            <SectionNavList section={section} activeId={activeId} />
          </nav>
        </div>
      )}
    </aside>
  );
}

export default SectionRail;

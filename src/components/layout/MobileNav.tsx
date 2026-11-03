import { Suspense, lazy } from "react";
import { Link, useLocation } from "react-router-dom";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { groupedNav, isNavActive } from "@/config/navigation";
import type { ShellSectionInfo } from "./shellContext";

// The entity list pulls in the data modules, so it loads only when a section page opens the drawer.
const SectionNavList = lazy(() =>
  import("./SectionRail").then((m) => ({ default: m.SectionNavList })),
);
const sectionLabel: Record<ShellSectionInfo["section"], string> = {
  components: "Components",
  threats: "Threats",
  controls: "Controls",
  architectures: "Architectures",
};

interface MobileNavProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionInfo: ShellSectionInfo | null;
}

/** Mobile navigation drawer: every page grouped by nav group, plus the current section's list. */
export function MobileNav({ open, onOpenChange, sectionInfo }: MobileNavProps) {
  const { pathname } = useLocation();
  const groups = groupedNav("drawer");
  const close = () => onOpenChange(false);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 lg:hidden" />
        <DialogPrimitive.Content
          id="mobile-nav"
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-80 max-w-[85vw] flex-col border-r bg-background shadow-xl lg:hidden",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left duration-200",
          )}
        >
          <div className="flex h-14 shrink-0 items-center justify-between border-b px-4">
            <DialogPrimitive.Title className="flex items-center gap-2 text-sm font-semibold">
              <span className="font-mono font-bold" aria-hidden="true">
                &gt;_
              </span>
              Agentic Security Hub
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">
              Site navigation
            </DialogPrimitive.Description>
            <DialogPrimitive.Close
              className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain p-3">
            <nav aria-label="Site">
              {groups.map((group) => (
                <div key={group.group} className="mb-4">
                  <h2 className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </h2>
                  <ul className="space-y-0.5">
                    {group.items.map((item) => {
                      const active = isNavActive(item.path, pathname);
                      const Icon = item.icon;
                      return (
                        <li key={item.path}>
                          <Link
                            to={item.path}
                            onClick={close}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                              "flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors",
                              active
                                ? "bg-primary/10 font-medium text-primary"
                                : "text-foreground/80 hover:bg-accent hover:text-accent-foreground",
                            )}
                          >
                            <Icon className="h-4 w-4 shrink-0 opacity-70" aria-hidden="true" />
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>

            {sectionInfo && (
              <nav
                aria-label={`${sectionLabel[sectionInfo.section]} in this section`}
                className="border-t pt-4"
              >
                <h2 className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  In {sectionLabel[sectionInfo.section]}
                </h2>
                <Suspense fallback={<div className="skeleton mx-2 h-32" aria-hidden="true" />}>
                  <SectionNavList
                    section={sectionInfo.section}
                    activeId={sectionInfo.activeId}
                    onNavigate={close}
                  />
                </Suspense>
              </nav>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export default MobileNav;

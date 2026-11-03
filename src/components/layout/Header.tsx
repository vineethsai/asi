import { Link, useLocation } from "react-router-dom";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, Menu, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { HEADER_MORE_NAV, HEADER_NAV, isNavActive } from "@/config/navigation";
import ThemeToggle from "./ThemeToggle";
import { useShell } from "./shellContext";
import { useCommandPalette } from "./commandPaletteContext";

function useShortcutLabel() {
  if (typeof navigator === "undefined") return "Ctrl K";
  return /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? "⌘K" : "Ctrl K";
}

interface SiteHeaderProps {
  onMenuToggle?: () => void;
  menuOpen?: boolean;
}

/** The site header. Rendered once by AppShell, outside the route Suspense boundary. */
export function SiteHeader({ onMenuToggle, menuOpen = false }: SiteHeaderProps) {
  const { pathname } = useLocation();
  const { openPalette } = useCommandPalette();
  const shortcut = useShortcutLabel();
  const moreActive = HEADER_MORE_NAV.some((item) => isNavActive(item.path, pathname));

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="container flex h-14 items-center gap-2 px-4">
        <Link
          to="/"
          className="mr-2 flex shrink-0 items-center gap-2 rounded-md transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Agentic Security Hub home"
        >
          <span className="font-mono text-base font-bold text-foreground" aria-hidden="true">
            &gt;_
          </span>
          <span className="hidden text-sm font-semibold tracking-tight sm:inline lg:hidden xl:inline">
            Agentic Security Hub
          </span>
          <span className="text-sm font-semibold tracking-tight sm:hidden lg:inline xl:hidden">
            ASH
          </span>
        </Link>

        <nav className="hidden flex-1 items-center gap-0.5 lg:flex" aria-label="Main">
          {HEADER_NAV.map((item) => {
            const active = isNavActive(item.path, pathname);
            return (
              <Link
                key={item.path}
                to={item.path}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "whitespace-nowrap rounded-md px-2 py-1.5 text-sm transition-colors duration-fast hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active ? "font-semibold text-foreground" : "text-muted-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <DropdownMenu.Root modal={false}>
            <DropdownMenu.Trigger
              className={cn(
                "inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-1.5 text-sm transition-colors duration-fast hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:text-foreground",
                moreActive ? "font-semibold text-foreground" : "text-muted-foreground",
              )}
            >
              More
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={8}
                className="z-50 w-72 rounded-lg border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
              >
                {HEADER_MORE_NAV.map((item) => {
                  const Icon = item.icon;
                  const active = isNavActive(item.path, pathname);
                  return (
                    <DropdownMenu.Item key={item.path} asChild>
                      <Link
                        to={item.path}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex cursor-pointer select-none items-start gap-3 rounded-md px-2.5 py-2 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
                          active && "text-primary",
                        )}
                      >
                        <Icon className="mt-0.5 h-4 w-4 shrink-0 opacity-70" aria-hidden="true" />
                        <span className="min-w-0">
                          <span className="block font-medium">{item.label}</span>
                          <span className="block text-xs text-muted-foreground">
                            {item.description}
                          </span>
                        </span>
                      </Link>
                    </DropdownMenu.Item>
                  );
                })}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => openPalette()}
            aria-label="Search the site"
            aria-keyshortcuts="Meta+K Control+K /"
            className="hidden h-9 items-center gap-2 rounded-md border bg-muted/40 px-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:inline-flex lg:w-9 lg:justify-center lg:px-0 xl:w-auto xl:justify-start xl:px-2.5"
          >
            <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="lg:hidden xl:inline">Search…</span>
            <kbd className="pointer-events-none rounded border bg-background px-1.5 font-mono text-[10px] font-medium lg:hidden xl:inline">
              {shortcut}
            </kbd>
          </button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openPalette()}
            className="md:hidden"
            aria-label="Search the site"
          >
            <Search className="h-5 w-5" />
          </Button>
          <ThemeToggle />
          {onMenuToggle && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuToggle}
              className="lg:hidden"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

/**
 * Legacy entry point for pages that still render `<Header />` themselves (the Threat Modeler
 * Guide until it moves to PageLayout). Inside AppShell the shell already renders the header,
 * so this renders nothing; outside the shell it renders a header without the drawer.
 */
export const Header = () => {
  const shell = useShell();
  if (shell) return null;
  return <SiteHeader />;
};

export default Header;

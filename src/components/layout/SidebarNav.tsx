import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { architecturesData, Architecture } from "../components/architecturesData";
import { threatsData, Threat, mitigationsData, Mitigation } from "../components/securityData";
import { frameworkData } from "../components/frameworkData";
import { cn } from "@/lib/utils";
import { X, Menu, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarNavProps {
  type: "architectures" | "threats" | "controls" | "components";
  activeId?: string;
  isOpen: boolean;
  onClose: () => void;
}

const SidebarNav: React.FC<SidebarNavProps> = ({ type, activeId, isOpen, onClose }) => {
  const [isDesktopOpen, setIsDesktopOpen] = useState(false);
  const location = useLocation();
  let items: { id: string; label: string; path: string; level?: number; parentId?: string }[] = [];

  if (type === "architectures") {
    items = Object.values(architecturesData as Record<string, Architecture>).map((a) => ({
      id: a.id,
      label: a.name,
      path: `/architectures/${a.id}`
    }));
  } else if (type === "threats") {
    items = Object.values(threatsData as Record<string, Threat>).map((t) => ({
      id: t.id,
      label: `${t.code} - ${t.name}`,
      path: `/threats/${t.id}`
    }));
  } else if (type === "controls") {
    items = Object.values(mitigationsData as Record<string, Mitigation>).map((m) => ({
      id: m.id,
      label: m.name,
      path: `/controls/${m.id}`
    }));
  } else if (type === "components") {
    // Build hierarchical component items including sub-components and sub-sub-components
    const componentItems: { id: string; label: string; path: string; level: number; parentId?: string }[] = [];
    
    const addComponentsRecursively = (components: any[], level: number, parentId?: string) => {
      components.forEach((comp) => {
        // Normalize ID for consistent routing (replace dashes with dots)
        const normalizedId = comp.id.replace(/-/g, '.');
        
        componentItems.push({
          id: normalizedId,
          label: comp.title,
          path: `/components/${normalizedId}`,
          level: level,
          parentId: parentId
        });
        
        // Recursively add children
        if (comp.children && comp.children.length > 0) {
          addComponentsRecursively(comp.children, level + 1, normalizedId);
        }
      });
    };
    
    addComponentsRecursively(frameworkData, 0);
    items = componentItems;
  }

  // Main navigation items for mobile
  const mainNavItems = [
    { name: "Components", path: "/components" },
    { name: "Architecture", path: "/architectures" },
    { name: "Threats", path: "/threats" },
    { name: "Controls", path: "/controls" },
    { name: "AISVS", path: "/aisvs" },
    { name: "NIST Mapping", path: "/nist-mapping" },
    { name: "Assessment", path: "/assessment" }
  ];

  // Helper function to check if nav item is active
  const isActiveNavItem = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  // Desktop sidebar toggle button
  const sidebarToggle = items.length > 0 ? (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setIsDesktopOpen(!isDesktopOpen)}
      className="fixed top-20 left-4 z-40 hidden lg:flex items-center gap-2 bg-background/80 backdrop-blur-sm border shadow-md hover:shadow-lg transition-all"
      aria-label={isDesktopOpen ? "Close sidebar" : "Open sidebar"}
    >
      <Menu className="h-4 w-4" />
      <span className="text-xs font-medium">
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
      <ChevronRight className={cn("h-3 w-3 transition-transform", isDesktopOpen && "rotate-90")} />
    </Button>
  ) : null;

  // Desktop sidebar
  const sidebar = isDesktopOpen && items.length > 0 ? (
    <aside className="fixed top-24 left-4 z-30 h-fit max-h-[calc(100vh-8rem)] overflow-y-auto w-72 bg-background/95 backdrop-blur-sm border border-border shadow-xl rounded-xl p-4 hidden lg:block">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
        <h3 className="font-semibold text-sm text-foreground">
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsDesktopOpen(false)}
          className="h-6 w-6 p-0"
          aria-label="Close sidebar"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      <nav aria-label="Sidebar Navigation">
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.id} className={item.level ? `ml-${item.level * 4}` : ""}>
              <Link
                to={item.path}
                className={cn(
                  "block px-3 py-2 rounded-md transition-all duration-200 font-medium",
                  item.level === 0 ? "text-sm" : item.level === 1 ? "text-xs" : "text-xs",
                  (activeId === item.id || location.pathname === item.path)
                    ? "bg-primary/10 text-primary font-semibold shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  item.level && item.level > 0 && "border-l-2 border-muted ml-2 pl-3"
                )}
                onClick={() => setIsDesktopOpen(false)}
              >
                {item.level === 1 && "└ "}
                {item.level === 2 && "  └ "}
                {item.level > 2 && "    └ "}
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  ) : null;

  // Mobile drawer
  const mobileDrawer = isOpen ? (
    <div 
      className="fixed inset-0 z-50 bg-black/50 flex lg:hidden" 
      onClick={onClose} 
      aria-modal="true" 
      role="dialog"
      aria-label="Navigation menu"
    >
      <aside 
        className="w-80 max-w-[85vw] bg-background border-r border-border shadow-xl h-full overflow-y-auto" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-primary p-1">
              <div className="h-5 w-5 text-primary-foreground font-bold flex items-center justify-center text-xs">
                AI
              </div>
            </div>
            <span className="font-semibold text-sm">Agentic Security Hub</span>
          </div>
          <button 
            onClick={onClose} 
            aria-label="Close navigation menu"
            className="p-2 rounded-md hover:bg-accent transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Main Navigation */}
        <div className="p-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Main Navigation
          </h3>
          <nav aria-label="Main Navigation">
            <ul className="space-y-1 mb-6">
              {mainNavItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={cn(
                      "block px-3 py-2 rounded-md transition-all duration-200 font-medium text-sm",
                      isActiveNavItem(item.path)
                        ? "bg-primary/10 text-primary font-semibold shadow-sm"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                    onClick={onClose}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Section-specific items */}
          {items.length > 0 && (
            <>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </h3>
              <nav aria-label={`${type} Navigation`}>
                <ul className="space-y-1">
                  {items.map((item) => (
                    <li key={item.id} className={item.level ? `ml-${item.level * 4}` : ""}>
                      <Link
                        to={item.path}
                        className={cn(
                          "block px-3 py-2 rounded-md transition-all duration-200 font-medium",
                          item.level === 0 ? "text-sm" : item.level === 1 ? "text-xs" : "text-xs",
                          (activeId === item.id || location.pathname === item.path)
                            ? "bg-primary/10 text-primary font-semibold shadow-sm"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                          item.level && item.level > 0 && "border-l-2 border-muted ml-2 pl-3"
                        )}
                        onClick={onClose}
                      >
                        {item.level === 1 && "└ "}
                        {item.level === 2 && "  └ "}
                        {item.level > 2 && "    └ "}
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </>
          )}
        </div>
      </aside>
    </div>
  ) : null;

  return <>{sidebarToggle}{sidebar}{mobileDrawer}</>;
};

export default SidebarNav; 
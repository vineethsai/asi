import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  threatsData,
  mitigationsData,
  aisvsData,
  type Threat,
  type Mitigation,
} from "@/components/components/securityData";
import { frameworkData, type ComponentNode } from "@/components/components/frameworkData";
import { architecturesData, type Architecture } from "@/components/components/architecturesData";
import { agenticTop10Data } from "@/components/components/owaspAgenticTop10Data";
import { ciscoTaxonomyData } from "@/components/components/ciscoTaxonomyData";

interface HeaderProps {
  onMobileMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
}

interface SearchResult {
  title: string;
  path: string;
  type: string;
}

function buildSearchIndex(): SearchResult[] {
  const results: SearchResult[] = [
    { title: "Home", path: "/", type: "page" },
    { title: "Components", path: "/components", type: "page" },
    { title: "Architecture Patterns", path: "/architectures", type: "page" },
    { title: "Threats Catalog", path: "/threats", type: "page" },
    { title: "Security Controls", path: "/controls", type: "page" },
    { title: "AISVS Standards", path: "/aisvs", type: "page" },
    { title: "NIST AI RMF Mapping", path: "/nist-mapping", type: "page" },
    { title: "Implementation Guide", path: "/implementation", type: "page" },
    { title: "Security Checklist", path: "/interactive", type: "page" },
    { title: "Threat Modeler", path: "/threat-modeler", type: "page" },
    { title: "References", path: "/references", type: "page" },
    { title: "About", path: "/about", type: "page" },
    { title: "AI Security Taxonomy", path: "/taxonomy", type: "page" },
    { title: "MITRE ATLAS", path: "/taxonomy?tab=mitre-atlas", type: "page" },
    { title: "Cisco AI Taxonomy", path: "/taxonomy?tab=cisco", type: "page" },
    { title: "OWASP Agentic Top 10", path: "/taxonomy?tab=owasp-agentic", type: "page" },
    { title: "AIVSS Calculator", path: "/taxonomy?tab=aivss", type: "page" },
  ];

  Object.values(threatsData).forEach((t: Threat) => {
    results.push({ title: `${t.code} - ${t.name}`, path: `/threats/${t.id}`, type: "threat" });
  });

  Object.values(mitigationsData).forEach((m: Mitigation) => {
    results.push({ title: m.name, path: `/controls/${m.id}`, type: "control" });
  });

  Object.values(architecturesData).forEach((a: Architecture) => {
    results.push({ title: a.name, path: `/architectures/${a.id}`, type: "architecture" });
  });

  const addComponents = (components: ComponentNode[]) => {
    components.forEach((c: ComponentNode) => {
      const normalizedId = c.id.replace(/-/g, ".");
      results.push({ title: c.title, path: `/components/${normalizedId}`, type: "component" });
      if (c.children) addComponents(c.children);
    });
  };
  addComponents(frameworkData);

  Object.values(aisvsData).forEach((cat: { name: string }) => {
    results.push({ title: cat.name, path: "/aisvs", type: "aisvs" });
  });

  agenticTop10Data.forEach((entry) => {
    results.push({
      title: `${entry.code} - ${entry.name}`,
      path: "/taxonomy?tab=owasp-agentic",
      type: "asi",
    });
  });

  ciscoTaxonomyData.forEach((og) => {
    results.push({
      title: `${og.code} - ${og.description}`,
      path: "/taxonomy?tab=cisco",
      type: "cisco",
    });
  });

  return results;
}

export const Header = ({ onMobileMenuToggle, isMobileMenuOpen = false }: HeaderProps) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const location = useLocation();
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const searchIndex = useMemo(() => buildSearchIndex(), []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return searchIndex.filter((item) => item.title.toLowerCase().includes(q)).slice(0, 8);
  }, [searchQuery, searchIndex]);

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setSelectedIndex(-1);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        closeSearch();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [closeSearch]);

  const handleSearchSelect = (path: string) => {
    navigate(path);
    closeSearch();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      closeSearch();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, searchResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && searchResults[selectedIndex]) {
        handleSearchSelect(searchResults[selectedIndex].path);
      } else if (searchResults.length > 0) {
        handleSearchSelect(searchResults[0].path);
      }
    }
  };

  const navItems = [
    { name: "Components", path: "/components" },
    { name: "Architecture", path: "/architectures" },
    { name: "Threats", path: "/threats" },
    { name: "Controls", path: "/controls" },
    { name: "AISVS", path: "/aisvs" },
    { name: "NIST Mapping", path: "/nist-mapping" },
    { name: "Taxonomy", path: "/taxonomy" },
    { name: "Threat Modeler", path: "/threat-modeler" },
  ];

  const isActiveNavItem = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      page: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      threat: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
      control: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      architecture: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
      component: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
      aisvs: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
      asi: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
      cisco: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
    };
    return colors[type] || colors.page;
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="font-mono text-base font-bold text-foreground">&gt;_</span>
            <span className="font-semibold text-sm hidden sm:inline-block tracking-tight">
              Agentic Security Hub
            </span>
            <span className="font-semibold text-sm sm:hidden tracking-tight">ASH</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav
          className="hidden lg:flex items-center gap-1"
          role="navigation"
          aria-label="Main navigation"
        >
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "px-2.5 py-1.5 text-sm transition-colors duration-150",
                "hover:text-foreground",
                isActiveNavItem(item.path)
                  ? "text-foreground font-semibold"
                  : "text-muted-foreground",
              )}
              aria-current={isActiveNavItem(item.path) ? "page" : undefined}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileMenuToggle}
            className="lg:hidden"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {/* Search */}
          <div ref={searchRef} className="relative">
            <div
              className={cn("transition-all duration-300", isSearchOpen ? "w-64" : "w-0 md:w-auto")}
            >
              {isSearchOpen && (
                <div className="relative">
                  <Search
                    className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    ref={inputRef}
                    type="search"
                    placeholder="Search pages, threats, controls..."
                    className="w-full pl-8 pr-4"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSelectedIndex(-1);
                    }}
                    onKeyDown={handleKeyDown}
                    aria-label="Search the site"
                    role="combobox"
                    aria-expanded={searchResults.length > 0}
                    aria-controls="search-results"
                    aria-activedescendant={
                      selectedIndex >= 0 ? `search-result-${selectedIndex}` : undefined
                    }
                  />
                </div>
              )}
            </div>
            {/* Search Results Dropdown */}
            {isSearchOpen && searchResults.length > 0 && (
              <div
                id="search-results"
                role="listbox"
                className="absolute right-0 top-full mt-2 w-80 bg-background border rounded-lg shadow-xl z-50 overflow-hidden"
              >
                {searchResults.map((result, i) => (
                  <button
                    key={result.path}
                    id={`search-result-${i}`}
                    role="option"
                    aria-selected={i === selectedIndex}
                    className={cn(
                      "w-full text-left px-4 py-3 flex items-center justify-between hover:bg-accent transition-colors",
                      i === selectedIndex && "bg-accent",
                    )}
                    onClick={() => handleSearchSelect(result.path)}
                  >
                    <span className="text-sm font-medium truncate">{result.title}</span>
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full flex-shrink-0 ml-2",
                        getTypeBadge(result.type),
                      )}
                    >
                      {result.type}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {isSearchOpen && searchQuery && searchResults.length === 0 && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-background border rounded-lg shadow-xl z-50 p-4 text-center text-sm text-muted-foreground">
                No results found for "{searchQuery}"
              </div>
            )}
          </div>

          {!isSearchOpen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(true)}
              className="hidden md:inline-flex"
              aria-label="Open search"
            >
              <Search className="h-5 w-5" />
            </Button>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default Header;

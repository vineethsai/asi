import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

export const Header = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: "Components", path: "/components" },
    { name: "Architecture", path: "/architectures" },
    { name: "Threats", path: "/threats" },
    { name: "Controls", path: "/controls" },
    { name: "Assessment", path: "/assessment" }
  ];

  // Helper function to check if nav item is active
  const isActiveNavItem = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="rounded-md bg-primary p-1">
              <div className="h-6 w-6 text-primary-foreground font-bold flex items-center justify-center">
                AI
              </div>
            </div>
            <span className="font-bold text-lg hidden sm:inline-block">OWASP Agentic Security</span>
            <span className="font-bold text-lg sm:hidden">OWASP</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1" role="navigation" aria-label="Main navigation">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path}
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 relative",
                "hover:bg-accent hover:text-accent-foreground",
                isActiveNavItem(item.path) 
                  ? "bg-primary/10 text-primary font-semibold shadow-sm" 
                  : "text-muted-foreground"
              )}
              aria-current={isActiveNavItem(item.path) ? "page" : undefined}
            >
              {item.name}
              {isActiveNavItem(item.path) && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
              )}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className={cn(
            "transition-all duration-300", 
            isSearchOpen ? "w-64" : "w-0 md:w-auto"
          )}>
            {isSearchOpen && (
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="search" 
                  placeholder="Search..." 
                  className="w-full pl-8 pr-4"
                  autoFocus
                  onBlur={() => setIsSearchOpen(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setIsSearchOpen(false);
                    }
                  }}
                />
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

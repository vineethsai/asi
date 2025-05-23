import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import SidebarNav from "./SidebarNav";

export const Header = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // Determine sidebar type and activeId based on current path
  let sidebarType = "architectures";
  let activeId: string | undefined = undefined;
  if (location.pathname.startsWith("/components")) {
    sidebarType = "components";
    activeId = location.pathname.split("/")[2];
  } else if (location.pathname.startsWith("/threats")) {
    sidebarType = "threats";
    activeId = location.pathname.split("/")[2];
  } else if (location.pathname.startsWith("/controls")) {
    sidebarType = "controls";
    activeId = location.pathname.split("/")[2];
  } else if (location.pathname.startsWith("/architectures")) {
    sidebarType = "architectures";
    activeId = location.pathname.split("/")[2];
  }

  const navItems = [
    { name: "Components", path: "/components" },
    { name: "Architecture", path: "/architectures" },
    { name: "Threats", path: "/threats" },
    { name: "Controls", path: "/controls" },
    { name: "Assessment", path: "/assessment" }
  ];

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden" 
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <Link to="/" className="flex items-center gap-2">
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
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path}
              className="px-3 py-2 text-sm font-medium rounded-md hover:bg-accent transition-colors"
            >
              {item.name}
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
                  className="w-full pl-8"
                  autoFocus
                  onBlur={() => setIsSearchOpen(false)}
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
            >
              <Search className="h-5 w-5" />
            </Button>
          )}
          <ThemeToggle />
        </div>
      </div>
      {/* Only use SidebarNav for mobile navigation */}
      <SidebarNav
        type={sidebarType as any}
        activeId={activeId}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
    </header>
  );
};

export default Header;

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { architecturesData, Architecture } from "../components/architecturesData";
import { threatsData, Threat, mitigationsData, Mitigation } from "../components/securityData";
import { frameworkData } from "../components/frameworkData";

interface SidebarNavProps {
  type: "architectures" | "threats" | "controls" | "components";
  activeId?: string;
  isOpen: boolean;
  onClose: () => void;
}

const SidebarNav: React.FC<SidebarNavProps> = ({ type, activeId, isOpen, onClose }) => {
  const location = useLocation();
  let items: { id: string; label: string; path: string }[] = [];

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
    items = frameworkData.map((c) => ({
      id: c.id,
      label: c.title,
      path: `/components/${c.id}`
    }));
  }

  // Desktop sidebar
  const sidebar = (
    <aside className="sticky top-24 h-fit max-h-[80vh] overflow-y-auto w-64 bg-background border-r border-border/30 rounded-xl shadow-sm p-4 hidden lg:block">
      <nav aria-label="Sidebar Navigation">
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                to={item.path}
                className={`block px-3 py-2 rounded-md transition-colors font-medium text-sm
                  ${
                    (activeId === item.id || location.pathname === item.path)
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }
                `}
                onClick={onClose}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );

  // Mobile drawer
  const mobileDrawer = isOpen ? (
    <div className="fixed inset-0 z-40 bg-black/40 flex lg:hidden" onClick={onClose} aria-modal="true" role="dialog">
      <aside className="w-64 bg-background border-r border-border/30 rounded-r-xl shadow-lg p-4 h-full" onClick={e => e.stopPropagation()}>
        <button className="mb-4 text-sm font-medium" onClick={onClose} aria-label="Close sidebar">Close ✕</button>
        <nav aria-label="Sidebar Navigation">
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  to={item.path}
                  className={`block px-3 py-3 rounded-md transition-colors font-medium text-base
                    ${
                      (activeId === item.id || location.pathname === item.path)
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }
                  `}
                  onClick={onClose}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </div>
  ) : null;

  return <>{sidebar}{mobileDrawer}</>;
};

export default SidebarNav; 
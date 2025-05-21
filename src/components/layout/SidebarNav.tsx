import React from "react";
import { Link, useLocation } from "react-router-dom";
import { architecturesData, Architecture } from "../components/architecturesData";
import { threatsData, Threat, mitigationsData, Mitigation } from "../components/securityData";

interface SidebarNavProps {
  type: "architectures" | "threats" | "controls";
  activeId?: string;
}

const SidebarNav: React.FC<SidebarNavProps> = ({ type, activeId }) => {
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
  }

  return (
    <aside className="sticky top-24 h-fit max-h-[80vh] overflow-y-auto w-64 bg-background border-r border-border/30 rounded-xl shadow-sm p-4 hidden lg:block">
      <nav>
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
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default SidebarNav; 
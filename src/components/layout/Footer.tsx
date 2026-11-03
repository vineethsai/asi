import { Link } from "react-router-dom";
import { NAV_EXTERNAL, groupedNav } from "@/config/navigation";

const linkClass =
  "link-underline text-sm text-muted-foreground transition-colors duration-fast hover:text-foreground";

export const Footer = () => {
  const groups = groupedNav("footer");

  return (
    <footer className="border-t bg-background py-8">
      <div className="container px-4 md:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-5">
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <div className="mb-3 font-mono text-sm font-semibold text-foreground">&gt;_ ASH</div>
            <p className="text-sm text-muted-foreground">
              Securing agentic AI systems through the entire development lifecycle.
            </p>
          </div>

          {groups.map((group) => (
            <div key={group.group}>
              <h2 className="mb-3 text-xs font-normal uppercase tracking-wider text-muted-foreground">
                {group.label}
              </h2>
              <ul className="space-y-1.5">
                {group.items.map((item) => (
                  <li key={item.path}>
                    <Link to={item.path} className={linkClass}>
                      {item.label}
                    </Link>
                  </li>
                ))}
                {group.group === "project" &&
                  NAV_EXTERNAL.map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={linkClass}
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 border-t pt-4 text-center text-xs text-muted-foreground">
          <p className="font-mono text-xs">
            © {new Date().getFullYear()} OWASP Securing Agentic Applications
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

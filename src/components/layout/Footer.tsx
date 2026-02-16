import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="border-t py-6 bg-background">
      <div className="container">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-1">
            <div className="font-mono text-sm font-semibold mb-3 text-foreground">&gt;_ ASH</div>
            <p className="text-sm text-muted-foreground">
              Securing AI systems through the entire development lifecycle.
            </p>
          </div>

          <div>
            <h4 className="uppercase text-xs tracking-wider text-muted-foreground mb-3">
              Guide Sections
            </h4>
            <ul className="space-y-1.5">
              <li>
                <Link
                  to="/components"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Components
                </Link>
              </li>
              <li>
                <Link
                  to="/architectures"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Architecture
                </Link>
              </li>
              <li>
                <Link
                  to="/threats"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Threats
                </Link>
              </li>
              <li>
                <Link
                  to="/controls"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Controls
                </Link>
              </li>
              <li>
                <Link
                  to="/aisvs"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  AISVS
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="uppercase text-xs tracking-wider text-muted-foreground mb-3">Tools</h4>
            <ul className="space-y-1.5">
              <li>
                <Link
                  to="/interactive"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Security Checklist
                </Link>
              </li>
              <li>
                <Link
                  to="/implementation"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Implementation Guide
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="uppercase text-xs tracking-wider text-muted-foreground mb-3">
              Resources
            </h4>
            <ul className="space-y-1.5">
              <li>
                <Link
                  to="/references"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  References & Links
                </Link>
              </li>
              <li>
                <a
                  href="https://owasp.org/www-project-securing-agentic-applications/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  OWASP Official
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/vineethsai/asi/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://vineethsai.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Author
                </a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/in/vineethsai/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t text-center text-muted-foreground text-xs">
          <p className="font-mono">
            © {new Date().getFullYear()} OWASP Securing Agentic Applications
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

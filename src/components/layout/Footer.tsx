
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="border-t py-8 bg-background">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1">
            <h3 className="text-lg font-bold mb-4">OWASP Agentic Security</h3>
            <p className="text-muted-foreground">
              Securing AI systems through the entire development lifecycle.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Guide Sections</h4>
            <ul className="space-y-2">
              <li><Link to="/components" className="text-muted-foreground hover:text-foreground">Components</Link></li>
              <li><Link to="/architecture" className="text-muted-foreground hover:text-foreground">Architecture</Link></li>
              <li><Link to="/threats" className="text-muted-foreground hover:text-foreground">Threats</Link></li>
              <li><Link to="/controls" className="text-muted-foreground hover:text-foreground">Controls</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Tools</h4>
            <ul className="space-y-2">
              <li><Link to="/assessment" className="text-muted-foreground hover:text-foreground">Architecture Assessment</Link></li>
              <li><Link to="/checklist" className="text-muted-foreground hover:text-foreground">Security Checklist</Link></li>
              <li><Link to="/implementation" className="text-muted-foreground hover:text-foreground">Implementation Guide</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Resources</h4>
            <ul className="space-y-2">
              <li><a href="https://owasp.org/www-project-securing-agentic-applications/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">OWASP Official</a></li>
              <li><a href="https://github.com/OWASP" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">GitHub</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-4 border-t text-center text-muted-foreground">
          <p>© {new Date().getFullYear()} OWASP Securing Agentic Applications Interactive Guide</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

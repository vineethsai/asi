import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SidebarNav from "@/components/layout/SidebarNav";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { architecturesData, Architecture } from "../components/components/architecturesData";
import FeatureComparisonMatrix from "../components/home/FeatureComparisonMatrix";
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Helmet } from "react-helmet";

const Architectures = () => {
  const architectures: Architecture[] = Object.values(architecturesData);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const sorted = useMemo(
    () => [...architectures].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)),
    [architectures],
  );

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <Helmet>
        <title>Agent Architectures & AI Security Patterns | Secure AI Agent Development</title>
        <meta
          name="description"
          content="Comprehensive guide to agent architectures and AI security patterns for agentic systems. Explore secure design patterns, architectural best practices, and security implications for AI agents and LLM-based applications."
        />
        <meta
          name="keywords"
          content="agent architectures, AI security patterns, agentic architectures, secure AI development, AI agent design, agent security, AI security architecture, LLM architectures, artificial intelligence patterns, secure agent development, AI system design"
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://agenticsecurity.info/architectures" />
        <meta property="og:url" content="https://agenticsecurity.info/architectures" />
        <meta name="twitter:url" content="https://agenticsecurity.info/architectures" />
      </Helmet>
      <Header onMobileMenuToggle={handleMobileMenuToggle} isMobileMenuOpen={isMobileMenuOpen} />

      {/* Mobile Navigation Sidebar */}
      <SidebarNav type="architectures" isOpen={isMobileMenuOpen} onClose={handleMobileMenuClose} />

      <section id="main-content" className="py-16">
        <div className="container px-4 md:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight">AI Agent Architectures</h1>
              <p className="mt-1 text-muted-foreground">
                Comprehensive guide to agent architectures and AI security patterns for agentic
                systems. Explore secure design patterns, architectural best practices, and security
                implications for AI agents.
              </p>
            </div>
            {/* Architectures Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-0">
              {sorted.map((arch) => (
                <Link to={`/architectures/${arch.id}`} key={arch.id}>
                  <Card className="h-full bg-card hover:bg-muted/50 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-2">
                        {arch.icon && (
                          <span className="text-muted-foreground">
                            <Icon name={arch.icon} color="currentColor" size={24} />
                          </span>
                        )}
                        <h3 className="text-xl font-bold text-foreground">{arch.name}</h3>
                        {arch.status && (
                          <Badge variant="outline" className="capitalize ml-2">
                            {arch.status}
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground mb-2">{arch.description}</p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {(arch.tags || []).map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Version: {arch.version || "-"} | Last Updated: {arch.lastUpdated || "-"}
                      </div>
                      {arch.references && arch.references.length > 0 && (
                        <div className="text-xs mt-1">
                          {arch.references.map((ref) => (
                            <a
                              key={ref.url}
                              href={ref.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline text-primary mr-2"
                            >
                              {ref.title}
                            </a>
                          ))}
                        </div>
                      )}
                      <div className="text-sm mt-2">
                        <span className="font-medium">Key Components: </span>
                        <span>{arch.keyComponents.map((id) => id.toUpperCase()).join(", ")}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            <div className="mt-16">
              <FeatureComparisonMatrix />
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default Architectures;

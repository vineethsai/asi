import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { frameworkData } from "@/components/components/frameworkData";
import SidebarNav from "@/components/layout/SidebarNav";
import { Icon } from "@/components/ui/icon";
import { Helmet } from "react-helmet";

const getAllTags = (data) => {
  const tags = new Set();
  data.forEach((comp) => {
    if (comp.threatCategories) comp.threatCategories.forEach((t) => tags.add(t));
    if (comp.children) {
      comp.children.forEach((sub) => {
        if (sub.threatCategories) sub.threatCategories.forEach((t) => tags.add(t));
      });
    }
  });
  return Array.from(tags);
};

const Components = () => {
  const [tagFilter, _setTagFilter] = useState("");
  const [sortBy, _setSortBy] = useState("name");
  const [searchQuery, _setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const _allTags = useMemo(() => getAllTags(frameworkData), []);

  const filtered = useMemo(() => {
    let comps = frameworkData;
    if (tagFilter) {
      comps = comps.filter(
        (c) =>
          (c.threatCategories && c.threatCategories.includes(tagFilter)) ||
          (c.children &&
            c.children.some(
              (sc) => sc.threatCategories && sc.threatCategories.includes(tagFilter),
            )),
      );
    }
    if (searchQuery) {
      comps = comps.filter(
        (c) =>
          c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase())),
      );
    }
    if (sortBy === "name") {
      comps = [...comps].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "threats") {
      comps = [...comps].sort(
        (a, b) => (b.threatCategories?.length || 0) - (a.threatCategories?.length || 0),
      );
    }
    return comps;
  }, [tagFilter, sortBy, searchQuery]);

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <Helmet>
        <title>AI Agent Components & Security Architecture | Secure AI Development</title>
        <meta
          name="description"
          content="Comprehensive guide to AI agent components and security architecture for agentic systems. Explore Language Models, Orchestration, Reasoning/Planning, Memory, Tool Integration, and Operational Environment with security best practices for secure AI development."
        />
        <meta
          name="keywords"
          content="AI agent components, AI security architecture, agent architectures, secure AI development, AI components security, agentic systems components, LLM security, AI orchestration security, memory modules security, tool integration security, AI agent design"
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://agenticsecurity.info/components" />
        <meta property="og:title" content="AI Security Components | OWASP Guide" />
        <meta
          property="og:description"
          content="Explore the 6 key components of agentic AI systems and learn security best practices for each component."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://agenticsecurity.info/components" />
        <meta property="og:site_name" content="OWASP Securing Agentic Applications Guide" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="AI Security Components | OWASP Guide" />
        <meta
          name="twitter:description"
          content="Explore the 6 key components of agentic AI systems and learn security best practices for each component."
        />
        <meta name="twitter:url" content="https://agenticsecurity.info/components" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "AI Security Components",
            description: "Key components of agentic AI systems and their security considerations",
            url: "https://agenticsecurity.info/components",
            numberOfItems: frameworkData.length,
            itemListElement: frameworkData.map((component, index) => ({
              "@type": "ListItem",
              position: index + 1,
              item: {
                "@type": "TechArticle",
                name: component.title,
                description: component.description,
                url: `https://agenticsecurity.info/components/${component.id}`,
                about: "AI Security",
              },
            })),
          })}
        </script>
      </Helmet>
      <Header onMobileMenuToggle={handleMobileMenuToggle} isMobileMenuOpen={isMobileMenuOpen} />

      {/* Mobile Navigation Sidebar */}
      <SidebarNav type="components" isOpen={isMobileMenuOpen} onClose={handleMobileMenuClose} />

      <main className="py-16 bg-background">
        <div className="container px-4 md:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight">Agent Components</h1>
              <p className="mt-1 text-muted-foreground">
                Explore the 6 key components of agentic AI systems and learn security best practices
                for each component.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-0">
              {filtered.map((component) => (
                <Link to={`/components/${component.id}`} key={component.id}>
                  <Card className="h-full border hover:bg-muted/50 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-2">
                        {component.icon && (
                          <Icon name={component.icon} className="text-muted-foreground" size={32} />
                        )}
                        <h3 className="text-xl font-bold text-foreground">{component.title}</h3>
                      </div>
                      <p className="text-muted-foreground mb-2">{component.description}</p>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {(component.threatCategories || []).map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      {component.children && component.children.length > 0 && (
                        <div className="text-xs mt-2">
                          <span className="font-medium">Subcomponents: </span>
                          <span>{component.children.map((sc) => sc.title).join(", ")}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Components;

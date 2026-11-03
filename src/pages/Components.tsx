import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import PageLayout from "@/components/layout/PageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { frameworkData } from "@/components/components/frameworkData";
import { Icon } from "@/components/ui/icon";

const Components = () => {
  const [tagFilter] = useState("");
  const [sortBy] = useState("name");
  const [searchQuery] = useState("");

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

  return (
    <PageLayout
      title="Agent Components"
      description={`Guide to the ${frameworkData.length} key components of agentic AI systems — language models, orchestration, reasoning/planning, memory, tool integration and operational environment — with their threats and security considerations.`}
      canonicalPath="/components"
      keywords="AI agent components, AI security architecture, agent architectures, secure AI development, AI components security, agentic systems components, LLM security, AI orchestration security, memory modules security, tool integration security, AI agent design"
      jsonLd={{
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
      }}
    >
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Agent Components</h1>
          <p className="mt-1 text-muted-foreground">
            Explore the {frameworkData.length} key components of agentic AI systems and learn
            security best practices for each component.
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
    </PageLayout>
  );
};

export default Components;

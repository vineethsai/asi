import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { frameworkData, type ComponentNode } from "@/components/components/frameworkData";
import { threatsData } from "@/components/components/securityData";

// UI-specific color mapping (kept local as it's presentation-only)
const COMPONENT_COLORS: Record<string, string> = {
  kc1: "bg-primary/10 border-primary/30 text-primary",
  kc2: "bg-primary/10 border-primary/30 text-primary",
  kc3: "bg-primary/10 border-primary/30 text-primary",
  kc4: "bg-primary/10 border-primary/30 text-primary",
  kc5: "bg-primary/10 border-primary/30 text-primary",
  kc6: "bg-primary/10 border-primary/30 text-primary",
};

// Flatten children for display - formats as "KC1.1: Title - Description"
function flattenSubComponents(node: ComponentNode): string[] {
  if (!node.children?.length) return [];
  return node.children.map((child) => {
    const prefix = child.id.toUpperCase();
    return `${prefix}: ${child.title}${child.description ? ` - ${child.description}` : ""}`;
  });
}

// Get threat display strings from threatIds using threatsData
function getThreatDisplayStrings(threatIds?: string[]): string[] {
  if (!threatIds?.length) return [];
  return threatIds
    .map((tid) => threatsData[tid])
    .filter(Boolean)
    .map((t) => `${t.code}: ${t.name}`);
}

export const ComponentsSection = () => {
  const [expandedComponents, setExpandedComponents] = useState<Set<string>>(new Set());

  const toggleComponent = (componentId: string) => {
    const newExpanded = new Set(expandedComponents);
    if (newExpanded.has(componentId)) {
      newExpanded.delete(componentId);
    } else {
      newExpanded.add(componentId);
    }
    setExpandedComponents(newExpanded);
  };

  const components = useMemo(
    () =>
      frameworkData.map((node) => ({
        id: node.id,
        title: `${node.title} (${node.id.toUpperCase()})`,
        description: node.description ?? "",
        subComponents: flattenSubComponents(node),
        threats: getThreatDisplayStrings(node.threatIds),
        color: COMPONENT_COLORS[node.id] ?? "bg-primary/10 border-primary/30 text-primary",
      })),
    [],
  );

  return (
    <section className="py-16 bg-secondary/50">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2 max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tighter">Key Components</h2>
            <p className="text-muted-foreground md:text-xl">
              Agentic systems comprise six key components, each introducing unique security
              challenges
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-12">
          {components.map((component, i) => {
            const isExpanded = expandedComponents.has(component.id);
            return (
              <Card key={i} className={`border ${component.color}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Link to={`/components/${component.id}`} className="flex-1">
                      <h3 className="text-xl font-bold hover:underline">{component.title}</h3>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleComponent(component.id)}
                      className="ml-2 p-1 h-8 w-8"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  <p className="text-muted-foreground mb-4">{component.description}</p>

                  <div
                    className={cn(
                      "overflow-hidden transition-all duration-300 ease-in-out",
                      isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0",
                    )}
                  >
                    <div className="mb-4">
                      <div className="text-sm font-semibold mb-2">Subcomponents:</div>
                      <ul className="space-y-1">
                        {component.subComponents.map((subComponent, j) => (
                          <li
                            key={j}
                            className="text-sm text-muted-foreground pl-4 border-l-2 border-muted"
                          >
                            {subComponent}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-1">
                      <div className="text-sm font-semibold mb-2">Key Threats:</div>
                      <ul>
                        {component.threats.map((threat, j) => (
                          <li key={j} className="text-sm text-muted-foreground">
                            {threat}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border">
                    <Link to={`/components/${component.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        View Details <ArrowRight className="ml-2 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-6 max-w-3xl mx-auto">
            Understanding these components and their interactions is crucial for implementing
            comprehensive security in agentic applications. Explore each component to learn about
            specific threats and mitigations.
          </p>
          <Link to="/components">
            <Button size="lg">
              Explore In-Depth Components Guide
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ComponentsSection;

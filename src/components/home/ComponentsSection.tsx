import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { frameworkData, type ComponentNode } from "@/components/components/frameworkData";
import { threatsData } from "@/components/components/securityData";

function flattenSubComponents(node: ComponentNode): string[] {
  if (!node.children?.length) return [];
  return node.children.map((child) => {
    const prefix = child.id.toUpperCase();
    return `${prefix}: ${child.title}${child.description ? ` - ${child.description}` : ""}`;
  });
}

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
    const next = new Set(expandedComponents);
    if (next.has(componentId)) next.delete(componentId);
    else next.add(componentId);
    setExpandedComponents(next);
  };

  const components = useMemo(
    () =>
      frameworkData.map((node) => ({
        id: node.id,
        title: `${node.title} (${node.id.toUpperCase()})`,
        description: node.description ?? "",
        subComponents: flattenSubComponents(node),
        threats: getThreatDisplayStrings(node.threatIds),
      })),
    [],
  );

  return (
    <section className="py-12 lg:py-16">
      <div className="container px-4 md:px-6">
        <div className="mb-8">
          <h2 className="text-xl font-semibold tracking-tight">Key Components</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Six key components of agentic systems, each with unique security challenges.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {components.map((component) => {
            const isExpanded = expandedComponents.has(component.id);
            return (
              <Card key={component.id} className="border">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <Link to={`/components/${component.id}`} className="flex-1">
                      <h3 className="text-sm font-semibold hover:underline">{component.title}</h3>
                    </Link>
                    <button
                      onClick={() => toggleComponent(component.id)}
                      className="ml-2 p-1 rounded hover:bg-muted transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  <p className="text-sm text-muted-foreground">{component.description}</p>

                  <div
                    className={cn(
                      "overflow-hidden transition-all duration-300",
                      isExpanded ? "max-h-[1000px] opacity-100 mt-4" : "max-h-0 opacity-0",
                    )}
                  >
                    {component.subComponents.length > 0 && (
                      <div className="mb-3">
                        <div className="text-xs font-medium mb-1.5">Subcomponents</div>
                        <ul className="space-y-0.5">
                          {component.subComponents.map((sub, j) => (
                            <li
                              key={j}
                              className="text-xs text-muted-foreground pl-3 border-l-2 border-muted"
                            >
                              {sub}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {component.threats.length > 0 && (
                      <div>
                        <div className="text-xs font-medium mb-1.5">Key Threats</div>
                        <ul className="space-y-0.5">
                          {component.threats.map((threat, j) => (
                            <li key={j} className="text-xs text-muted-foreground">
                              {threat}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t">
                    <Link to={`/components/${component.id}`}>
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 px-2">
                        View details <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8">
          <Link to="/components">
            <Button variant="outline" size="sm" className="gap-2">
              All components <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ComponentsSection;


import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export const ComponentsSection = () => {
  const components = [
    {
      id: "kc1",
      title: "Language Models",
      description: "Foundation models and multimodal capabilities",
      threats: ["Prompt Injection", "Training Data Poisoning"],
      color: "bg-primary/10 border-primary/30 text-primary"
    },
    {
      id: "kc2",
      title: "Orchestration",
      description: "Workflows, planning, multi-agent collaboration",
      threats: ["Intent Breaking", "Communication Poisoning"],
      color: "bg-architecture/10 border-architecture/30 text-architecture"
    },
    {
      id: "kc3",
      title: "Reasoning",
      description: "ReAct, Chain of Thought, planning paradigms",
      threats: ["Reasoning Manipulation", "Goal Misalignment"],
      color: "bg-control/10 border-control/30 text-control"
    },
    {
      id: "kc4",
      title: "Memory",
      description: "Various memory types and security boundaries",
      threats: ["Memory Poisoning", "Data Leakage"],
      color: "bg-primary/10 border-primary/30 text-primary"
    },
    {
      id: "kc5",
      title: "Tool Integration",
      description: "Frameworks for extending capabilities",
      threats: ["Tool Misuse", "Privilege Compromise"],
      color: "bg-threat/10 border-threat/30 text-threat"
    },
    {
      id: "kc6",
      title: "Environment",
      description: "API access, code execution, database operations",
      threats: ["Resource Exhaustion", "Container Escape"],
      color: "bg-control/10 border-control/30 text-control"
    }
  ];

  return (
    <section className="py-16 bg-secondary/50">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2 max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Key Components</h2>
            <p className="text-muted-foreground md:text-xl">
              Agentic systems comprise six key components, each with unique security implications
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {components.map((component, i) => (
            <Link to={`/components/${component.id}`} key={i}>
              <Card className={`h-full hover-card-trigger border ${component.color}`}>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-2">{component.title}</h3>
                  <p className="text-muted-foreground mb-4">{component.description}</p>
                  <div className="space-y-1">
                    <div className="text-sm font-semibold">Key Threats:</div>
                    {component.threats.map((threat, j) => (
                      <div key={j} className="text-sm text-muted-foreground">
                        • {threat}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <Link to="/components">
            <Button size="lg">
              Explore All Components
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ComponentsSection;

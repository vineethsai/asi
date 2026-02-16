import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { ArrowRight, Network } from "lucide-react";
import ArchitectureDiagram from "@/components/visual/ArchitectureDiagrams";
import { architecturesData } from "@/components/components/architecturesData";

const ARCH_UI: Record<string, { name: string; complexity: string; useCase: string }> = {
  sequential: { name: "Sequential Agent", complexity: "Simple", useCase: "Basic automation" },
  hierarchical: { name: "Hierarchical", complexity: "Complex", useCase: "Enterprise systems" },
  collaborative: {
    name: "Collaborative Swarm",
    complexity: "Advanced",
    useCase: "Distributed problem-solving",
  },
  reactive: { name: "Reactive", complexity: "Moderate", useCase: "Real-time systems" },
  knowledge_intensive: {
    name: "Knowledge-Intensive",
    complexity: "Advanced",
    useCase: "Research & analysis",
  },
};

const architectureOrder = [
  "sequential",
  "hierarchical",
  "collaborative",
  "reactive",
  "knowledge_intensive",
];

export const ArchitectureShowcase = () => {
  const [activeTab, setActiveTab] = useState("sequential");

  const architectures = architectureOrder
    .filter((id) => architecturesData[id])
    .map((id) => {
      const arch = architecturesData[id];
      const ui = ARCH_UI[id] ?? { name: arch.name, complexity: "Standard", useCase: "General" };
      return {
        id: arch.id,
        name: ui.name,
        description: arch.description,
        complexity: ui.complexity,
        useCase: ui.useCase,
      };
    });

  const active = architectures.find((a) => a.id === activeTab) ?? architectures[0];

  return (
    <section className="py-12 lg:py-16">
      <div className="container px-4 md:px-6">
        <div className="mb-8">
          <h2 className="text-xl font-semibold tracking-tight">Architecture Patterns</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Interactive diagrams of AI agent architecture patterns with component relationships and
            data flows.
          </p>
        </div>

        {/* Tab triggers */}
        <div className="flex gap-1 mb-6 overflow-x-auto border-b">
          {architectures.map((arch) => (
            <button
              key={arch.id}
              onClick={() => setActiveTab(arch.id)}
              className={`px-4 py-2 text-sm whitespace-nowrap border-b-2 transition-colors -mb-px ${
                activeTab === arch.id
                  ? "border-foreground text-foreground font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {arch.name}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border rounded-lg overflow-hidden">
          {/* Diagram */}
          <div className="p-6 bg-muted/30 border-b lg:border-b-0 lg:border-r flex items-center justify-center min-h-[350px]">
            <ArchitectureDiagram architectureId={active.id} className="w-full h-80" />
          </div>

          {/* Info */}
          <div className="p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold">{active.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{active.complexity} architecture</p>
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground">{active.description}</p>

            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Complexity</span>
                <div className="font-medium mt-0.5">
                  <Badge
                    variant={
                      active.complexity === "Simple"
                        ? "secondary"
                        : active.complexity === "Moderate"
                          ? "default"
                          : "destructive"
                    }
                  >
                    {active.complexity}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Use case</span>
                <div className="font-medium mt-0.5">{active.useCase}</div>
              </div>
            </div>

            <div className="pt-2">
              <Link to={`/architectures/${active.id}`}>
                <Button variant="outline" size="sm" className="gap-2">
                  View details <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <Link to="/architectures">
            <Button variant="outline" size="sm" className="gap-2">
              <Network className="h-4 w-4" />
              All architectures
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ArchitectureShowcase;

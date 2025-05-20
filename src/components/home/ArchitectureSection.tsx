
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export const ArchitectureSection = () => {
  const architectures = [
    {
      title: "Sequential Agent",
      description: "Single-agent flow with linear execution",
      image: "sequential",
      path: "/architecture/sequential"
    },
    {
      title: "Hierarchical",
      description: "Orchestrator-based multi-agent system",
      image: "hierarchical",
      path: "/architecture/hierarchical"
    },
    {
      title: "Collaborative Swarm",
      description: "Peer-based multi-agent collaboration",
      image: "collaborative",
      path: "/architecture/collaborative"
    }
  ];

  // Simple SVG representations of the architecture patterns
  const renderArchitectureImage = (type: string) => {
    if (type === "sequential") {
      return (
        <svg className="h-24 w-full" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="20" y="40" width="30" height="30" rx="4" fill="currentColor" className="text-primary/20" stroke="currentColor" strokeWidth="2" />
          <rect x="85" y="40" width="30" height="30" rx="4" fill="currentColor" className="text-primary/20" stroke="currentColor" strokeWidth="2" />
          <rect x="150" y="40" width="30" height="30" rx="4" fill="currentColor" className="text-primary/20" stroke="currentColor" strokeWidth="2" />
          <line x1="50" y1="55" x2="85" y2="55" stroke="currentColor" strokeWidth="2" />
          <line x1="115" y1="55" x2="150" y2="55" stroke="currentColor" strokeWidth="2" />
          <polygon points="79,50 79,60 89,55" fill="currentColor" />
          <polygon points="144,50 144,60 154,55" fill="currentColor" />
        </svg>
      );
    } else if (type === "hierarchical") {
      return (
        <svg className="h-24 w-full" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="85" y="10" width="30" height="30" rx="4" fill="currentColor" className="text-primary/20" stroke="currentColor" strokeWidth="2" />
          <rect x="20" y="60" width="30" height="30" rx="4" fill="currentColor" className="text-primary/20" stroke="currentColor" strokeWidth="2" />
          <rect x="85" y="60" width="30" height="30" rx="4" fill="currentColor" className="text-primary/20" stroke="currentColor" strokeWidth="2" />
          <rect x="150" y="60" width="30" height="30" rx="4" fill="currentColor" className="text-primary/20" stroke="currentColor" strokeWidth="2" />
          <line x1="100" y1="40" x2="100" y2="60" stroke="currentColor" strokeWidth="2" />
          <line x1="95" y1="25" x2="35" y2="60" stroke="currentColor" strokeWidth="2" />
          <line x1="105" y1="25" x2="165" y2="60" stroke="currentColor" strokeWidth="2" />
          <polygon points="100,54 95,44 105,44" fill="currentColor" />
          <polygon points="41,54 31,46 46,40" fill="currentColor" />
          <polygon points="159,54 169,46 154,40" fill="currentColor" />
        </svg>
      );
    } else {
      return (
        <svg className="h-24 w-full" viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="85" y="35" width="30" height="30" rx="4" fill="currentColor" className="text-primary/20" stroke="currentColor" strokeWidth="2" />
          <rect x="20" y="35" width="30" height="30" rx="4" fill="currentColor" className="text-primary/20" stroke="currentColor" strokeWidth="2" />
          <rect x="150" y="35" width="30" height="30" rx="4" fill="currentColor" className="text-primary/20" stroke="currentColor" strokeWidth="2" />
          <line x1="50" y1="50" x2="85" y2="50" stroke="currentColor" strokeWidth="2" />
          <line x1="115" y1="50" x2="150" y2="50" stroke="currentColor" strokeWidth="2" />
          <line x1="35" y1="35" x2="75" y2="20" stroke="currentColor" strokeWidth="2" />
          <line x1="165" y1="35" x2="125" y2="20" stroke="currentColor" strokeWidth="2" />
          <line x1="35" y1="65" x2="75" y2="80" stroke="currentColor" strokeWidth="2" />
          <line x1="165" y1="65" x2="125" y2="80" stroke="currentColor" strokeWidth="2" />
        </svg>
      );
    }
  };

  return (
    <section className="py-16">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Architecture Patterns</h2>
            <p className="max-w-[700px] text-muted-foreground md:text-xl">
              Understand the security implications of different agentic system architectures
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {architectures.map((architecture, i) => (
            <Card key={i} className="overflow-hidden hover-card-trigger">
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  {renderArchitectureImage(architecture.image)}
                </div>
                <h3 className="text-xl font-bold mb-2">{architecture.title}</h3>
                <p className="text-muted-foreground mb-4">{architecture.description}</p>
                <Link to={architecture.path} className="inline-block w-full">
                  <Button variant="outline" className="w-full">
                    Explore
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <Link to="/architecture">
            <Button size="lg">
              View All Architectures
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ArchitectureSection;

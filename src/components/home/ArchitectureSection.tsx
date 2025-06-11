import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { architecturesData, Architecture } from "../../components/components/architecturesData";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { useState, useMemo } from "react";

export const ArchitectureSection = () => {
  // Use all architectures from architecturesData, explicitly typed
  const architectures: Architecture[] = Object.values(architecturesData);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleExpand = (architectureId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(architectureId)) {
      newExpanded.delete(architectureId);
    } else {
      newExpanded.add(architectureId);
    }
    setExpandedCards(newExpanded);
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
        
        {/* Simplified Architecture Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
          {architectures.slice(0, 3).map((architecture) => {
            const isExpanded = expandedCards.has(architecture.id);
            return (
              <Card key={architecture.id} className="overflow-hidden border hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon name={architecture.icon} color={architecture.color} size={20} />
                      <h3 className="font-semibold text-foreground">
                        {architecture.name.replace(' Architecture', '').replace(' Agent', '')}
                      </h3>
                    </div>
                    <button
                      onClick={() => toggleExpand(architecture.id)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                  
                  {isExpanded && (
                    <div className="mt-4 space-y-3">
                      <p className="text-sm text-muted-foreground">{architecture.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {(architecture.tags || []).slice(0, 3).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                      <Link to={`/architectures/${architecture.id}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          Learn More
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        <div className="mt-8 text-center">
          <Link to="/architectures">
            <Button size="lg">
              View All Architecture Patterns
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ArchitectureSection;

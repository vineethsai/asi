import Header from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { threatsData, Threat } from "../components/components/securityData";
import { frameworkData } from "../components/components/frameworkData";
import SidebarNav from "../components/layout/SidebarNav";

// Helper to map component IDs to names
const componentIdToName: Record<string, string> = Object.fromEntries(
  frameworkData.map((c) => [c.id, c.title])
);

export const Threats = () => {
  const threats: Threat[] = Object.values(threatsData);

  return (
    <>
      <Header />
      <section className="py-16 bg-secondary/50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col lg:flex-row gap-8">
            <SidebarNav type="threats" />
            <div className="flex-1">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2 max-w-3xl">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Threats</h2>
                  <p className="text-muted-foreground md:text-xl">
                    Explore the key threats to agentic systems and their components
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-12">
                {threats.map((threat) => (
                  <Link to={`/threats/${threat.id}`} key={threat.id}>
                    <Card className="h-full border border-threat/20 hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center mb-2">
                          <span className="font-mono text-xs bg-threat/10 text-threat px-2 py-0.5 rounded mr-2">
                            {threat.code}
                          </span>
                          <h3 className="text-xl font-bold">{threat.name}</h3>
                        </div>
                        <p className="text-muted-foreground mb-4">{threat.description}</p>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            threat.impactLevel === "high"
                              ? "bg-red-100 text-red-700"
                              : threat.impactLevel === "medium"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-blue-100 text-blue-700"
                          }`}>
                            {threat.impactLevel.charAt(0).toUpperCase() + threat.impactLevel.slice(1)} Impact
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Affected Components: </span>
                          <span>{threat.componentIds.map(id => componentIdToName[id] || id).join(", ")}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Threats; 
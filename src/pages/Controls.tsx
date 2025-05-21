import Header from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { mitigationsData, Mitigation } from "../components/components/securityData";
import SidebarNav from "../components/layout/SidebarNav";

export const Controls = () => {
  const controls: Mitigation[] = Object.values(mitigationsData);

  return (
    <>
      <Header />
      <section className="py-16 bg-secondary/50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col lg:flex-row gap-8">
            <SidebarNav type="controls" />
            <div className="flex-1">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2 max-w-3xl">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Security Controls & Mitigations</h2>
                  <p className="text-muted-foreground md:text-xl">
                    Explore security controls and mitigations for agentic systems
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-12">
                {controls.map((control) => (
                  <Link to={`/controls/${control.id}`} key={control.id}>
                    <Card className="h-full border border-control/20 hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <h3 className="text-xl font-bold mb-2">{control.name}</h3>
                        <p className="text-muted-foreground mb-4">{control.description}</p>
                        <div className="text-sm">
                          <span className="font-medium">Mitigates Threats: </span>
                          <span>{control.threatIds.map(id => id.toUpperCase()).join(", ")}</span>
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

export default Controls; 
import Header from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { architecturesData, Architecture } from "../components/components/architecturesData";
import FeatureComparisonMatrix from "../components/home/FeatureComparisonMatrix";
import SidebarNav from "../components/layout/SidebarNav";

const Architectures = () => {
  const architectures: Architecture[] = Object.values(architecturesData);

  return (
    <>
      <Header />
      <section className="py-16 bg-secondary/50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col lg:flex-row gap-8">
            <SidebarNav type="architectures" />
            <div className="flex-1">
              <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
                <div className="space-y-2 max-w-3xl">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Agentic Architectures</h2>
                  <p className="text-muted-foreground md:text-xl">
                    Explore common agentic system architectures, their key components, threats, and mitigations
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-0">
                {architectures.map((arch) => (
                  <Link to={`/architectures/${arch.id}`} key={arch.id}>
                    <Card className="h-full border border-architecture/20 hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <h3 className="text-xl font-bold mb-2">{arch.name}</h3>
                        <p className="text-muted-foreground mb-4">{arch.description}</p>
                        <div className="text-sm">
                          <span className="font-medium">Key Components: </span>
                          <span>{arch.keyComponents.map(id => id.toUpperCase()).join(", ")}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
              <div className="mt-16">
                <FeatureComparisonMatrix />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Architectures; 
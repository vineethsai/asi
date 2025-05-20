
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CircleCheck, Layers, ShieldCheck, Activity } from "lucide-react";

export const FeaturesSection = () => {
  const features = [
    {
      icon: Layers,
      title: "Architecture Assessment",
      description: "Identify security considerations for your specific AI architecture pattern."
    },
    {
      icon: ShieldCheck,
      title: "Security Controls",
      description: "Find the right security controls for each component of your agentic system."
    },
    {
      icon: CircleCheck,
      title: "Implementation Guidance",
      description: "Get practical code examples and implementation patterns for security measures."
    },
    {
      icon: Activity,
      title: "Threat Mapping",
      description: "Visualize how different threats impact your architecture components."
    }
  ];

  return (
    <section className="py-16 bg-accent">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold tracking-tighter mb-2">Interactive Security Features</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore our interactive tools to help secure your agentic AI applications
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <Card key={i} className="hover-card-trigger">
              <CardHeader>
                <feature.icon className="h-10 w-10 text-primary mb-2" />
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;

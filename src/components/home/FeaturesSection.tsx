
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
    <section className="py-16 md:py-24 bg-background">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-block px-3 py-1 text-sm font-medium bg-primary/10 text-primary rounded-full mb-4">
            Features
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            Interactive Security Features
          </h2>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            Explore our comprehensive suite of tools and resources designed to help you secure your agentic AI applications
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {features.map((feature, i) => (
            <Card 
              key={i} 
              className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 border-border hover:border-primary/20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardHeader className="relative z-10">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors duration-300">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <CardDescription className="text-muted-foreground">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;

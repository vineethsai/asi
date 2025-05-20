
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

export const HeroSection = () => {
  const benefits = [
    "Interactive security guidance for AI systems",
    "Implementation examples and code snippets",
    "Architecture-specific security controls",
    "OWASP best practices for agentic systems"
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Secure Your Agentic AI Applications
              </h1>
              <p className="max-w-[600px] text-muted-foreground md:text-xl">
                Navigate the complexities of AI security with our interactive OWASP guide. 
                Build safer agentic systems with actionable controls and implementation guidance.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Link to="/assessment">
                <Button size="lg" className="gap-2">
                  Start Assessment <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/components">
                <Button variant="outline" size="lg">
                  Explore Components
                </Button>
              </Link>
            </div>
            <div className="mt-6">
              <ul className="grid gap-2 sm:grid-cols-2">
                {benefits.map((benefit, i) => (
                  <li key={i} className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="relative mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full lg:order-last">
            <div className="component-diagram h-full w-full flex flex-col items-center justify-center gap-4">
              <div className="w-full flex justify-center">
                <div className="bg-architecture/20 rounded-lg p-3 text-center border border-architecture/30 shadow-sm max-w-xs">
                  <div className="font-semibold">Agentic AI Architecture</div>
                  <div className="text-xs text-muted-foreground">Identify key components and security controls</div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3 mt-4 w-full animate-in" style={{animationDelay: '0.2s'}}>
                <div className="bg-white dark:bg-black rounded-lg p-2 text-center border shadow-sm animate-pulse-light">
                  <div className="text-sm font-medium">Language Models</div>
                </div>
                <div className="bg-white dark:bg-black rounded-lg p-2 text-center border shadow-sm animate-pulse-light" style={{animationDelay: '0.4s'}}>
                  <div className="text-sm font-medium">Orchestration</div>
                </div>
                <div className="bg-white dark:bg-black rounded-lg p-2 text-center border shadow-sm animate-pulse-light" style={{animationDelay: '0.3s'}}>
                  <div className="text-sm font-medium">Reasoning</div>
                </div>
                <div className="bg-white dark:bg-black rounded-lg p-2 text-center border shadow-sm animate-pulse-light" style={{animationDelay: '0.6s'}}>
                  <div className="text-sm font-medium">Memory</div>
                </div>
                <div className="bg-white dark:bg-black rounded-lg p-2 text-center border shadow-sm animate-pulse-light" style={{animationDelay: '0.1s'}}>
                  <div className="text-sm font-medium">Tool Integration</div>
                </div>
                <div className="bg-white dark:bg-black rounded-lg p-2 text-center border shadow-sm animate-pulse-light" style={{animationDelay: '0.5s'}}>
                  <div className="text-sm font-medium">Environment</div>
                </div>
              </div>
              
              <div className="w-full flex justify-center mt-4">
                <div className="bg-threat/20 rounded-lg p-2 text-center border border-threat/30 shadow-sm animate-in max-w-xs" style={{animationDelay: '0.4s'}}>
                  <div className="text-sm">15 Threat Categories</div>
                </div>
              </div>
              
              <div className="w-full flex justify-center mt-2">
                <div className="bg-control/20 rounded-lg p-2 text-center border border-control/30 shadow-sm animate-in max-w-xs" style={{animationDelay: '0.6s'}}>
                  <div className="text-sm">Security Controls & Implementation</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

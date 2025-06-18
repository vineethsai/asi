
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export const HeroSection = () => {
  const benefits = [
    "Interactive security guidance for AI systems",
    "Implementation examples and code snippets",
    "Architecture-specific security controls",
    "OWASP best practices for agentic systems"
  ];

  return (
    <section className="py-12 md:py-20 lg:py-28 bg-gradient-to-b from-background to-muted/20">
      <div className="container px-4 md:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left column - Content */}
          <div className="flex flex-col justify-center space-y-6 max-w-2xl mx-auto lg:mx-0">
            <div className="space-y-4 text-center lg:text-left">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
                Secure Your Agentic AI Applications
              </h1>
              <p className="text-lg text-muted-foreground md:text-xl">
                Navigate the complexities of AI security with our interactive OWASP guide. 
                Build safer agentic systems with actionable controls and implementation guidance.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/assessment" className="w-full sm:w-auto">
                <Button size="lg" className="w-full gap-2">
                  Start Assessment <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/components" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full">
                  Explore Components
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 justify-center lg:justify-start mt-4">
              <Link to="/threats" className="w-full">
                <Button variant="outline" size="lg" className="w-full">
                  View Threats
                </Button>
              </Link>
              <Link to="/controls" className="w-full">
                <Button variant="outline" size="lg" className="w-full">
                  View Controls
                </Button>
              </Link>
              <Link to="/architectures" className="w-full">
                <Button variant="outline" size="lg" className="w-full">
                  Explore Architectures
                </Button>
              </Link>
            </div>
            
            <div className="mt-4">
              <ul className="grid gap-3 sm:grid-cols-2">
                {benefits.map((benefit, i) => (
                  <li key={i} className="flex items-start gap-2 text-muted-foreground">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-left">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Right column - Visual element */}
          <div className="relative hidden lg:block">
            <div className="relative w-full h-full min-h-[400px] bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl overflow-hidden border border-primary/20">
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                    <ShieldCheck className="h-10 w-10 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-primary">Secure AI Systems</h3>
                    <p className="text-muted-foreground text-lg">
                      Comprehensive OWASP guidance for agentic applications
                    </p>
                  </div>
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

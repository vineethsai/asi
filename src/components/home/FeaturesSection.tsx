import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Network, Target, Brain, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

export const FeaturesSection = () => {
  const mainFeatures = [
    {
      icon: Network,
      title: "NIST AI RMF Integration",
      subtitle: "Interactive Framework Mapping",
      description: "Revolutionary D3.js visualization that maps NIST AI Risk Management Framework to OWASP AISVS controls with expandable nodes, focus mode, and bidirectional exploration.",
      features: [
        "Interactive D3.js graph with drag-and-drop",
        "Focus mode for isolated control analysis", 
        "Bidirectional NIST ↔ AISVS mapping",
        "Real-time relationship visualization",
        "Comprehensive implementation guidance"
      ],
      color: "from-blue-500 to-cyan-500",
      borderColor: "border-blue-200 dark:border-blue-800",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      link: "/nist-mapping",
      badge: "Latest"
    },
    {
      icon: Target,
      title: "Smart Assessment Engine",
      subtitle: "AI-Powered Security Analysis",
      description: "Dynamic assessment tool that analyzes your AI system architecture and provides personalized security recommendations based on your specific use case and risk profile.",
      features: [
        "Adaptive questioning based on responses",
        "Architecture-specific recommendations",
        "Risk scoring with detailed explanations",
        "Actionable security roadmap generation",
        "Export capabilities for compliance"
      ],
      color: "from-purple-500 to-pink-500",
      borderColor: "border-purple-200 dark:border-purple-800",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
      link: "/assessment",
      badge: "Popular"
    },
    {
      icon: Brain,
      title: "Component Framework",
      subtitle: "Six Key Component Analysis",
      description: "Comprehensive breakdown of agentic system components with detailed threat modeling, security controls, and implementation guidance for each critical element.",
      features: [
        "Language Models (KC1) security analysis",
        "Orchestration (KC2) threat modeling",
        "Memory modules (KC4) protection strategies",
        "Tool integration (KC5) security controls",
        "Operational environment (KC6) hardening"
      ],
      color: "from-orange-500 to-red-500",
      borderColor: "border-orange-200 dark:border-orange-800",
      bgColor: "bg-orange-50 dark:bg-orange-950/20",
      link: "/components",
      badge: "Core"
    }
  ];



  return (
    <section className="py-16 lg:py-24 bg-gradient-to-b from-background to-muted/30">
      <div className="container px-4 md:px-6">
        {/* Section header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Latest Features
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
            Advanced AI Security Tools
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Cutting-edge interactive tools and frameworks designed to secure your AI systems 
            with unprecedented depth and clarity.
          </p>
        </div>

        {/* Main features */}
        <div className="grid gap-8 lg:gap-12 mb-16">
          {mainFeatures.map((feature, i) => (
            <Card key={i} className={`border-2 ${feature.borderColor} overflow-hidden`}>
              <CardContent className="p-0">
                <div className="grid lg:grid-cols-2 gap-0">
                  {/* Content side */}
                  <div className="p-8 lg:p-12 space-y-6">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg bg-gradient-to-r ${feature.color} text-white`}>
                        <feature.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <Badge variant="outline" className="mb-2">
                          {feature.badge}
                        </Badge>
                        <h3 className="text-2xl font-bold">{feature.title}</h3>
                        <p className="text-muted-foreground font-medium">{feature.subtitle}</p>
                      </div>
                    </div>
                    
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                    
                    <ul className="space-y-2">
                      {feature.features.map((item, j) => (
                        <li key={j} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Link to={feature.link}>
                      <Button className="gap-2 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90">
                        Explore Feature
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                  
                  {/* Visual side */}
                  <div className={`${feature.bgColor} p-8 lg:p-12 flex items-center justify-center min-h-[300px]`}>
                    <div className="text-center space-y-4 max-w-sm">
                      <div className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center text-white shadow-lg`}>
                        <feature.icon className="h-10 w-10" />
                      </div>
                      <h4 className="text-xl font-semibold">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {feature.subtitle}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>




      </div>
    </section>
  );
};

export default FeaturesSection;

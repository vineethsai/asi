import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle, ShieldCheck, Network, Target, Zap, BookOpen, Users, Globe, Sparkles, Brain, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export const HeroSection = () => {
  const features = [
    {
      icon: Network,
      title: "NIST AI RMF Mapping",
      description: "Interactive D3.js visualization mapping NIST AI Risk Management Framework to OWASP AISVS",
      color: "bg-blue-500",
      link: "/nist-mapping"
    },
    {
      icon: ShieldCheck,
      title: "AISVS Security Standards",
      description: "Comprehensive AI Security Verification Standard with 13 control categories",
      color: "bg-green-500",
      link: "/aisvs"
    },
    {
      icon: Target,
      title: "Interactive Assessment",
      description: "Dynamic security assessment tool for AI systems with personalized recommendations",
      color: "bg-purple-500",
      link: "/assessment"
    },
    {
      icon: Brain,
      title: "Component Framework",
      description: "Six key components of agentic systems with detailed threat analysis",
      color: "bg-orange-500",
      link: "/components"
    }
  ];

  const stats = [
    { number: "13", label: "AISVS Categories", color: "text-blue-600" },
    { number: "15", label: "AI Threats", color: "text-red-600" },
    { number: "6", label: "Key Components", color: "text-green-600" },
    { number: "100+", label: "Security Controls", color: "text-purple-600" }
  ];



  return (
    <section className="relative py-12 md:py-20 lg:py-28 overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/30" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-secondary/20 via-transparent to-transparent" />
      
      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/20 rounded-full animate-pulse" />
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-secondary/30 rounded-full animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-3/4 w-1.5 h-1.5 bg-primary/15 rounded-full animate-pulse delay-500" />
      </div>

      <div className="container relative px-4 md:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left column - Enhanced Content */}
          <div className="flex flex-col justify-center space-y-8 max-w-2xl mx-auto lg:mx-0">
            {/* Badge */}
            <div className="flex justify-center lg:justify-start">
              <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
                <Sparkles className="h-4 w-4 mr-2" />
                Latest: NIST AI RMF Integration
              </Badge>
            </div>

            {/* Main heading */}
            <div className="space-y-6 text-center lg:text-left">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary to-secondary">
                  Secure Your
                </span>
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-secondary via-primary to-primary">
                  Agentic AI
                </span>
                <br />
                <span className="text-foreground">Applications</span>
              </h1>
              <p className="text-lg text-muted-foreground md:text-xl leading-relaxed">
                The most comprehensive OWASP guide for securing AI agentic systems. 
                Features interactive NIST AI RMF mapping, advanced threat analysis, 
                and cutting-edge security frameworks.
              </p>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/nist-mapping" className="w-full sm:w-auto">
                <Button size="lg" className="w-full gap-2 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold shadow-lg">
                  <Network className="h-5 w-5" />
                  Explore NIST Mapping
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/assessment" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full border-2 hover:bg-primary/5">
                  Start Assessment
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
              {stats.map((stat, i) => (
                <div key={i} className="text-center p-3 rounded-lg bg-muted/30 backdrop-blur-sm">
                  <div className={`text-2xl font-bold ${stat.color}`}>{stat.number}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Right column - Feature showcase */}
          <div className="relative">
            {/* Main feature cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((feature, i) => (
                <Link key={i} to={feature.link} className="group">
                  <Card className="h-full border-2 border-transparent hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:scale-105 bg-gradient-to-br from-background to-muted/20">
                    <CardContent className="p-6 space-y-4">
                      <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300`}>
                        <feature.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Central connecting element */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center backdrop-blur-sm">
                <Shield className="h-8 w-8 text-primary" />
              </div>
            </div>
          </div>
        </div>



        {/* Quick navigation */}
        <div className="mt-16 lg:mt-20">
          <div className="text-center mb-8">
            <h3 className="text-xl font-semibold mb-2">Quick Navigation</h3>
            <p className="text-muted-foreground">Jump directly to the tools and resources you need</p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "NIST Mapping", link: "/nist-mapping", icon: Network },
              { label: "Threats", link: "/threats", icon: Shield },
              { label: "Controls", link: "/controls", icon: CheckCircle },
              { label: "AISVS", link: "/aisvs", icon: ShieldCheck },
              { label: "Architectures", link: "/architectures", icon: Globe },
              { label: "Components", link: "/components", icon: Brain }
            ].map((item, i) => (
              <Link key={i} to={item.link}>
                <Button 
                  variant="outline" 
                  className="w-full h-auto p-4 flex flex-col gap-2 hover:bg-primary/5 hover:border-primary/30 transition-all duration-200"
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{item.label}</span>
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

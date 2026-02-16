import { ArrowRight, ShieldCheck, Target, Shield, Network, Brain, Crosshair } from "lucide-react";
import { Link } from "react-router-dom";

const sectionLinks = [
  {
    icon: ShieldCheck,
    title: "AISVS Standards",
    description: "13 verification categories for AI agent security",
    path: "/aisvs",
  },
  {
    icon: Target,
    title: "Threat Catalog",
    description: "Known threats to agentic AI systems",
    path: "/threats",
  },
  {
    icon: Shield,
    title: "Security Controls",
    description: "Defensive mitigations and controls",
    path: "/controls",
  },
  {
    icon: Network,
    title: "NIST AI RMF",
    description: "Interactive NIST Risk Management mapping",
    path: "/nist-mapping",
  },
  {
    icon: Brain,
    title: "Architecture Patterns",
    description: "5 agentic architectures with security analysis",
    path: "/architectures",
  },
  {
    icon: Crosshair,
    title: "Threat Modeler",
    description: "Drag-and-drop MAESTRO threat modeling",
    path: "/threat-modeler",
  },
];

export const HeroSection = () => {
  return (
    <section className="relative py-16 md:py-24 lg:py-32 overflow-hidden">
      {/* Dot-grid background */}
      <div className="hero-grid-bg absolute inset-0 text-foreground opacity-[0.03] dark:opacity-[0.05] pointer-events-none" />

      <div className="container relative px-4 md:px-6 max-w-3xl mx-auto">
        <div className="flex flex-col items-center text-center space-y-8">
          {/* Status badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border bg-muted/50 dark:bg-muted/30">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-mono text-xs tracking-wide text-muted-foreground">
              OWASP Agentic Security Framework
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            <span className="term-prompt font-mono font-normal text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
              {">"}&nbsp;
            </span>
            <span className="text-foreground">Agentic Security Hub</span>
            <span className="animate-blink term-prompt font-mono font-normal">_</span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl text-base text-muted-foreground leading-relaxed md:text-lg">
            Threat models, verification standards, and security controls for AI agent architectures.
            Built on OWASP AISVS and NIST AI RMF.
          </p>
        </div>

        {/* Navigation grid */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-px bg-border rounded-lg border overflow-hidden">
          {sectionLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="group flex items-center gap-4 px-5 py-4 bg-background hover:bg-muted/50 transition-colors"
            >
              <link.icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground">{link.title}</div>
                <div className="text-xs text-muted-foreground">{link.description}</div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

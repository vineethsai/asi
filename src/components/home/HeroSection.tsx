import { Button } from "@/components/ui/button";
import { ArrowRight, Crosshair } from "lucide-react";
import { Link } from "react-router-dom";

const terminalStats = [
  { label: "AISVS Categories", value: 13, maxBar: 16 },
  { label: "Threat Vectors", value: 15, maxBar: 16 },
  { label: "Agent Components", value: 6, maxBar: 16 },
  { label: "Security Controls", value: 16, maxBar: 16 },
];

const statusLines = [
  "NIST AI RMF mapping loaded",
  "MAESTRO threat modeling ready",
  "5 architecture patterns analyzed",
];

function TerminalBar({ ratio }: { ratio: number }) {
  const widthPercent = Math.round(ratio * 100);
  return (
    <span
      className="term-bar"
      style={{ width: `${widthPercent}%`, maxWidth: 120, minWidth: 16 }}
      aria-hidden="true"
    />
  );
}

export const HeroSection = () => {
  return (
    <section className="relative py-16 md:py-24 lg:py-32 overflow-hidden">
      {/* Dot-grid background */}
      <div className="hero-grid-bg absolute inset-0 text-foreground opacity-[0.03] dark:opacity-[0.05] pointer-events-none" />

      <div className="container relative px-4 md:px-6 max-w-4xl mx-auto">
        <div className="flex flex-col items-center text-center space-y-8">
          {/* Status badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-muted/50 dark:bg-muted/30 backdrop-blur-sm">
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
          <p className="max-w-2xl text-lg text-muted-foreground leading-relaxed md:text-xl">
            Threat models, verification standards, and security controls for AI agent architectures.
            Built on OWASP AISVS and NIST AI RMF.
          </p>

          {/* Terminal widget */}
          <div className="w-full max-w-2xl terminal-window">
            {/* Title bar */}
            <div className="terminal-titlebar">
              <div className="flex items-center gap-1.5">
                <span className="terminal-dot bg-red-400 dark:bg-red-500" />
                <span className="terminal-dot bg-amber-400 dark:bg-amber-500" />
                <span className="terminal-dot bg-emerald-400 dark:bg-emerald-500" />
              </div>
              <span className="ml-3 text-xs text-muted-foreground font-mono">
                ~/agentic-security
              </span>
            </div>

            {/* Terminal body */}
            <div className="terminal-body text-foreground dark:text-slate-200">
              {/* Command */}
              <div className="mb-4">
                <span className="term-prompt">$</span>{" "}
                <span className="term-command">asi status</span>
              </div>

              {/* Stats with bars */}
              <div className="space-y-2 mb-4">
                {terminalStats.map((stat) => (
                  <div key={stat.label} className="flex items-center gap-3">
                    <span className="term-label w-40 text-right text-xs shrink-0">
                      {stat.label}
                    </span>
                    <span className="term-value w-6 text-right text-xs">{stat.value}</span>
                    <div className="flex-1 flex items-center">
                      <TerminalBar ratio={stat.value / stat.maxBar} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Status lines */}
              <div className="space-y-1 mb-4 border-t border-border/50 dark:border-slate-700/50 pt-3">
                {statusLines.map((line) => (
                  <div key={line} className="text-xs">
                    <span className="term-success">[ok]</span>{" "}
                    <span className="term-muted">{line}</span>
                  </div>
                ))}
              </div>

              {/* Prompt with blinking cursor */}
              <div>
                <span className="term-prompt">$</span>{" "}
                <span className="animate-blink term-prompt">_</span>
              </div>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Link to="/aisvs">
              <Button size="lg" className="gap-2 font-semibold">
                Explore Framework
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/threat-modeler">
              <Button variant="outline" size="lg" className="gap-2 border-2">
                <Crosshair className="h-4 w-4" />
                Threat Modeler
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

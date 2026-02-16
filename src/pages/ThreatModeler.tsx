import { Helmet } from "react-helmet";
import { useSearchParams } from "react-router-dom";
import ThreatModelCanvas from "@/components/threat-modeler/ThreatModelCanvas";

export default function ThreatModelerPage() {
  const [searchParams] = useSearchParams();
  const templateParam = searchParams.get("template") ?? undefined;

  return (
    <>
      <Helmet>
        <title>Threat Modeler - Agentic Security Hub</title>
        <meta
          name="description"
          content="Interactive threat modeling for agentic AI applications with MAESTRO 7-layer analysis"
        />
      </Helmet>
      <div className="h-screen w-screen flex flex-col">
        {/* Minimal header for full-screen canvas */}
        <div className="h-10 flex items-center justify-between px-4 border-b bg-background/95 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-2">
            <a href="/" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
              <div className="rounded-sm bg-primary p-0.5">
                <div className="h-4 w-4 text-primary-foreground font-bold flex items-center justify-center text-[10px]">
                  AI
                </div>
              </div>
              <span className="font-bold text-sm">Threat Modeler</span>
            </a>
            <span className="text-xs text-muted-foreground">|</span>
            <span className="text-xs text-muted-foreground">
              MAESTRO 7-Layer Analysis for Agentic AI
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/interactive"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Back to Interactive Hub
            </a>
            <a
              href="/"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Home
            </a>
          </div>
        </div>

        {/* Full-height canvas */}
        <div className="flex-1 overflow-hidden">
          <ThreatModelCanvas initialTemplate={templateParam} />
        </div>
      </div>
    </>
  );
}

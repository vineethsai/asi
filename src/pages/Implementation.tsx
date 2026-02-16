import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mitigationsData, Mitigation, threatsData } from "@/components/components/securityData";
import {
  Search,
  Layers,
  Hammer,
  Settings,
  ArrowRight,
  Shield,
  BookOpen,
  CheckCircle2,
} from "lucide-react";

const phases = [
  {
    id: "design",
    label: "Design",
    icon: <Layers className="h-5 w-5" />,
    description: "Security decisions made during system design and architecture planning.",
  },
  {
    id: "build",
    label: "Build",
    icon: <Hammer className="h-5 w-5" />,
    description: "Security controls implemented during development and integration.",
  },
  {
    id: "operations",
    label: "Operations",
    icon: <Settings className="h-5 w-5" />,
    description: "Ongoing security monitoring, maintenance, and incident response.",
  },
];

export default function Implementation() {
  const [search, setSearch] = useState("");
  const [activePhase, setActivePhase] = useState("design");

  const mitigations = useMemo(
    () => Object.values(mitigationsData as Record<string, Mitigation>),
    [],
  );

  const filteredMitigations = useMemo(() => {
    const phase = activePhase;
    return mitigations.filter((m) => {
      const matchesPhase =
        (phase === "design" && m.designPhase) ||
        (phase === "build" && m.buildPhase) ||
        (phase === "operations" && m.operationPhase);
      if (!matchesPhase) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        (m.tags && m.tags.some((t) => t.toLowerCase().includes(q)))
      );
    });
  }, [mitigations, activePhase, search]);

  const stats = useMemo(
    () => ({
      design: mitigations.filter((m) => m.designPhase).length,
      build: mitigations.filter((m) => m.buildPhase).length,
      operations: mitigations.filter((m) => m.operationPhase).length,
      total: mitigations.length,
    }),
    [mitigations],
  );

  const getThreatNames = (threatIds: string[]) => {
    return threatIds
      .map((id) => threatsData[id]?.name)
      .filter(Boolean)
      .slice(0, 3);
  };

  return (
    <>
      <Helmet>
        <title>Implementation Guide | Agentic Security Hub</title>
        <meta
          name="description"
          content="Step-by-step security implementation guide for AI agentic systems. Organized by lifecycle phase: Design, Build, and Operations with detailed controls and code examples."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://agenticsecurity.info/implementation" />
        <meta property="og:title" content="Implementation Guide | Agentic Security Hub" />
        <meta
          property="og:description"
          content="Step-by-step security implementation guide for AI agentic systems organized by lifecycle phase."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://agenticsecurity.info/implementation" />
      </Helmet>
      <Header />
      <main id="main-content" className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <BookOpen className="h-4 w-4" />
            Lifecycle-Based Security Guidance
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">Implementation Guide</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Practical security controls organized by development lifecycle phase. Each control
            includes implementation details, tooling recommendations, and threat mappings.
          </p>
        </div>

        {/* Phase Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {phases.map((phase) => (
            <Card
              key={phase.id}
              className={`cursor-pointer transition-all hover:shadow-md ${activePhase === phase.id ? "ring-2 ring-primary" : ""}`}
              onClick={() => setActivePhase(phase.id)}
            >
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">{phase.icon}</div>
                <div>
                  <div className="text-2xl font-bold">{stats[phase.id as keyof typeof stats]}</div>
                  <div className="text-sm text-muted-foreground">{phase.label} Controls</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search controls..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Phase Tabs */}
        <Tabs value={activePhase} onValueChange={setActivePhase}>
          <TabsList className="grid w-full grid-cols-3">
            {phases.map((phase) => (
              <TabsTrigger key={phase.id} value={phase.id} className="flex items-center gap-2">
                {phase.icon}
                {phase.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {phases.map((phase) => (
            <TabsContent key={phase.id} value={phase.id} className="space-y-4 mt-6">
              <p className="text-muted-foreground">{phase.description}</p>
              <div className="text-sm text-muted-foreground">
                Showing {filteredMitigations.length} control
                {filteredMitigations.length !== 1 ? "s" : ""}
              </div>

              <div className="grid gap-4">
                {filteredMitigations.map((m) => (
                  <Card key={m.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Shield className="h-5 w-5 text-primary" aria-hidden="true" />
                          {m.name}
                        </CardTitle>
                        {m.status && (
                          <Badge variant={m.status === "active" ? "default" : "secondary"}>
                            {m.status}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">{m.description}</p>

                      {m.implementationDetail[phase.id as keyof typeof m.implementationDetail] && (
                        <div className="bg-muted/50 rounded-lg p-4">
                          <h4 className="text-sm font-semibold mb-1 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden="true" />
                            {phase.label} Guidance
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {
                              m.implementationDetail[
                                phase.id as keyof typeof m.implementationDetail
                              ]
                            }
                          </p>
                        </div>
                      )}

                      {m.implementationDetail.toolsAndFrameworks && (
                        <div className="text-sm">
                          <span className="font-medium">Tools: </span>
                          <span className="text-muted-foreground">
                            {m.implementationDetail.toolsAndFrameworks}
                          </span>
                        </div>
                      )}

                      {m.threatIds.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {getThreatNames(m.threatIds).map((name) => (
                            <Badge key={name} variant="outline" className="text-xs">
                              {name}
                            </Badge>
                          ))}
                          {m.threatIds.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{m.threatIds.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="flex justify-end">
                        <Link to={`/controls/${m.id}`}>
                          <Button variant="ghost" size="sm" className="text-primary">
                            View Full Details <ArrowRight className="h-4 w-4 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {filteredMitigations.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    No controls found matching your search for this phase.
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </main>
      <Footer />
    </>
  );
}

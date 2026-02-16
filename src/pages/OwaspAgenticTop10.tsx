import { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import {
  Search,
  Shield,
  Target,
  Wrench,
  Users,
  GitBranch,
  Code,
  Database,
  Network,
  Zap,
  User,
  ShieldCheck,
  ExternalLink,
  CircleAlert,
  CircleCheck,
  BookOpen,
} from "lucide-react";
import { agenticTop10Data } from "@/components/components/owaspAgenticTop10Data";

const iconMap: Record<string, React.ReactNode> = {
  target: <Target className="h-5 w-5" />,
  wrench: <Wrench className="h-5 w-5" />,
  users: <Users className="h-5 w-5" />,
  "git-branch": <GitBranch className="h-5 w-5" />,
  code: <Code className="h-5 w-5" />,
  database: <Database className="h-5 w-5" />,
  network: <Network className="h-5 w-5" />,
  zap: <Zap className="h-5 w-5" />,
  user: <User className="h-5 w-5" />,
  "shield-check": <ShieldCheck className="h-5 w-5" />,
};

export function OwaspAgenticTop10Content() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredEntries = searchQuery.trim()
    ? agenticTop10Data.filter(
        (e) =>
          e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : agenticTop10Data;

  return (
    <>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">OWASP Top 10 for Agentic Applications</h1>
        </div>
        <p className="text-muted-foreground max-w-3xl">
          The definitive guide to the most critical security risks in AI agentic systems. Each entry
          provides descriptions, common vulnerabilities, attack scenarios, and actionable
          mitigations for securing autonomous AI agents.
        </p>
        <div className="flex gap-2 mt-3">
          <Badge variant="outline">Version 2026</Badge>
          <Badge variant="outline">OWASP GenAI Security Project</Badge>
        </div>
      </div>

      {/* At a Glance Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        {agenticTop10Data.map((entry) => (
          <Card
            key={entry.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => {
              setExpandedId(expandedId === entry.id ? null : entry.id);
              const el = document.getElementById(`entry-${entry.id}`);
              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            <CardContent className="p-3 text-center">
              <div
                className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center text-white"
                style={{ backgroundColor: entry.color }}
              >
                {iconMap[entry.icon] || <Shield className="h-5 w-5" />}
              </div>
              <div className="font-mono text-xs font-bold mb-1">{entry.code}</div>
              <div className="text-xs leading-tight">{entry.name}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search ASI entries..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Detail Entries */}
      <div className="space-y-4">
        {filteredEntries.map((entry) => (
          <Card
            key={entry.id}
            id={`entry-${entry.id}`}
            className="border-l-4"
            style={{ borderLeftColor: entry.color }}
          >
            <Accordion
              type="single"
              collapsible
              value={expandedId === entry.id ? entry.id : undefined}
              onValueChange={(val) => setExpandedId(val || null)}
            >
              <AccordionItem value={entry.id} className="border-none">
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="flex items-center gap-3 text-left w-full">
                    <div
                      className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white"
                      style={{ backgroundColor: entry.color }}
                    >
                      {iconMap[entry.icon] || <Shield className="h-5 w-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <Badge variant="outline" className="font-mono text-xs">
                          {entry.code}
                        </Badge>
                        <span className="font-semibold text-lg">{entry.name}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {entry.relatedLLMTop10.map((ref, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {ref}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-6 pb-6">
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                    {entry.description}
                  </p>

                  {/* Common Examples */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                      <CircleAlert className="h-4 w-4 text-orange-500" />
                      Common Examples
                    </h3>
                    <ul className="space-y-2">
                      {entry.commonExamples.map((ex, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex gap-2">
                          <span className="text-muted-foreground/50 flex-shrink-0">{i + 1}.</span>
                          {ex}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Attack Scenarios */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                      <Target className="h-4 w-4 text-red-500" />
                      Attack Scenarios
                    </h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      {entry.attackScenarios.map((sc, i) => (
                        <Card key={i} className="bg-muted/30">
                          <CardContent className="p-3">
                            <div className="font-medium text-sm mb-1">{sc.title}</div>
                            <p className="text-xs text-muted-foreground">{sc.description}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Prevention Guidelines */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                      <CircleCheck className="h-4 w-4 text-green-500" />
                      Prevention & Mitigation Guidelines
                    </h3>
                    <ul className="space-y-2">
                      {entry.preventionGuidelines.map((g, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex gap-2">
                          <CircleCheck className="h-3.5 w-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                          {g}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Cross References */}
                  <div className="mb-4">
                    <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                      <BookOpen className="h-4 w-4 text-blue-500" />
                      Cross References
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">
                        AIVSS: {entry.relatedAIVSSRisk}
                      </Badge>
                      {entry.relatedCiscoObjectives.map((co) => (
                        <Link key={co} to="/cisco-taxonomy">
                          <Badge
                            variant="outline"
                            className="text-xs bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-300"
                          >
                            Cisco: {co}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* References */}
                  {entry.references.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-sm flex items-center gap-2 mb-2">
                        <ExternalLink className="h-4 w-4" />
                        References
                      </h3>
                      <ul className="space-y-1">
                        {entry.references.map((ref, i) => (
                          <li key={i}>
                            <a
                              href={ref.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              {ref.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>
        ))}
      </div>

      {filteredEntries.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No results found for "{searchQuery}"
        </div>
      )}
    </>
  );
}

export default function OwaspAgenticTop10() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <OwaspAgenticTop10Content />
      </main>
      <Footer />
    </div>
  );
}

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Search,
  Shield,
  Database,
  AlertTriangle,
  CheckCircle,
  Users,
  Globe,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import {
  aiuc1Principles,
  getAiuc1Stats,
  type Aiuc1Principle,
  type Aiuc1Requirement,
} from "@/components/components/aiuc1Data";

const principleIcons: Record<string, React.ReactNode> = {
  A: <Database className="h-4 w-4" />,
  B: <Shield className="h-4 w-4" />,
  C: <AlertTriangle className="h-4 w-4" />,
  D: <CheckCircle className="h-4 w-4" />,
  E: <Users className="h-4 w-4" />,
  F: <Globe className="h-4 w-4" />,
};

function AivssBadge({ risk, secondary }: { risk: string; secondary?: boolean }) {
  const colorMap: Record<string, string> = {
    "Agent Goal & Instruction Manipulation":
      "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
    "Agentic AI Tool Misuse":
      "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30",
    "Agent Access Control Violation":
      "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    "Agent Memory & Context Manipulation":
      "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
    "Agent Cascading Failures":
      "bg-pink-500/15 text-pink-700 dark:text-pink-300 border-pink-500/30",
    "Agent Untraceability": "bg-gray-500/15 text-gray-700 dark:text-gray-300 border-gray-500/30",
    "Agent Supply Chain & Dependency Risk":
      "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
    "Insecure Agent Critical Systems Interaction":
      "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  };
  const color = colorMap[risk] ?? "bg-muted text-muted-foreground border-border";

  return (
    <Badge variant="outline" className={`text-[10px] ${color} ${secondary ? "opacity-70" : ""}`}>
      {secondary ? "2nd: " : ""}
      {risk}
    </Badge>
  );
}

function RequirementCard({ req, principle }: { req: Aiuc1Requirement; principle: Aiuc1Principle }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border rounded-lg p-3 space-y-2 bg-card">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className="text-xs font-mono shrink-0"
              style={{ borderColor: principle.color, color: principle.color }}
            >
              {req.id}
            </Badge>
            <Badge
              variant={req.application === "Mandatory" ? "default" : "secondary"}
              className="text-[10px]"
            >
              {req.application}
            </Badge>
            <span className="text-[10px] text-muted-foreground">{req.frequency}</span>
          </div>
          <p className="text-sm font-medium mt-1">{req.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{req.fullText}</p>
        </div>
        {req.confidence && (
          <Badge
            variant="outline"
            className={`text-[10px] shrink-0 ${
              req.confidence === "High"
                ? "text-green-600 border-green-500/30"
                : req.confidence === "Medium"
                  ? "text-yellow-600 border-yellow-500/30"
                  : "text-red-600 border-red-500/30"
            }`}
          >
            {req.confidence}
          </Badge>
        )}
      </div>

      <div className="flex flex-wrap gap-1">
        <AivssBadge risk={req.aivss_primary} />
        {req.aivss_secondary && <AivssBadge risk={req.aivss_secondary} secondary />}
        {req.asiId && (
          <Badge
            variant="outline"
            className="text-[10px] bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30"
          >
            {req.asiId}: {req.asiTitle}
          </Badge>
        )}
      </div>

      {req.controls.length > 0 && (
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight
              className={`h-3 w-3 transition-transform ${expanded ? "rotate-90" : ""}`}
            />
            {req.controls.length} control{req.controls.length !== 1 ? "s" : ""}
          </button>
          {expanded && (
            <div
              className="mt-2 space-y-1.5 pl-4 border-l-2"
              style={{ borderColor: principle.color + "40" }}
            >
              {req.controls.map((ctrl) => (
                <div key={ctrl.id} className="text-xs space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-muted-foreground">{ctrl.id}</span>
                    <span className="font-medium">{ctrl.title}</span>
                    <Badge variant="outline" className="text-[9px]">
                      {ctrl.category}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground line-clamp-2">{ctrl.fullText}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AIUC1Content() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPrinciple, setSelectedPrinciple] = useState<string>("all");
  const [applicationFilter, setApplicationFilter] = useState<string>("all");
  const stats = getAiuc1Stats();

  const filteredPrinciples = useMemo(() => {
    let principles = aiuc1Principles;

    if (selectedPrinciple !== "all") {
      principles = principles.filter((p) => p.id === selectedPrinciple);
    }

    if (searchQuery.trim() || applicationFilter !== "all") {
      const q = searchQuery.toLowerCase();
      principles = principles
        .map((p) => ({
          ...p,
          requirements: p.requirements.filter((r) => {
            const matchesSearch =
              !q ||
              r.id.toLowerCase().includes(q) ||
              r.title.toLowerCase().includes(q) ||
              r.fullText.toLowerCase().includes(q) ||
              r.aivss_primary.toLowerCase().includes(q) ||
              (r.asiId?.toLowerCase().includes(q) ?? false);
            const matchesApp = applicationFilter === "all" || r.application === applicationFilter;
            return matchesSearch && matchesApp;
          }),
        }))
        .filter((p) => p.requirements.length > 0);
    }

    return principles;
  }, [searchQuery, selectedPrinciple, applicationFilter]);

  const totalFiltered = filteredPrinciples.reduce((sum, p) => sum + p.requirements.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 text-sm">
        <Card className="flex-1 min-w-[140px]">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{stats.requirements}</p>
            <p className="text-xs text-muted-foreground">Requirements</p>
          </CardContent>
        </Card>
        <Card className="flex-1 min-w-[140px]">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{stats.mandatory}</p>
            <p className="text-xs text-muted-foreground">Mandatory</p>
          </CardContent>
        </Card>
        <Card className="flex-1 min-w-[140px]">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{stats.optional}</p>
            <p className="text-xs text-muted-foreground">Optional</p>
          </CardContent>
        </Card>
        <Card className="flex-1 min-w-[140px]">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{stats.controls}</p>
            <p className="text-xs text-muted-foreground">Controls</p>
          </CardContent>
        </Card>
        <Card className="flex-1 min-w-[140px]">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{stats.principles}</p>
            <p className="text-xs text-muted-foreground">Principles</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search requirements, AIVSS risks, ASI IDs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={selectedPrinciple}
          onChange={(e) => setSelectedPrinciple(e.target.value)}
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          <option value="all">All Principles</option>
          {aiuc1Principles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.id}. {p.name}
            </option>
          ))}
        </select>
        <select
          value={applicationFilter}
          onChange={(e) => setApplicationFilter(e.target.value)}
          className="h-9 rounded-md border bg-background px-3 text-sm"
        >
          <option value="all">All Types</option>
          <option value="Mandatory">Mandatory</option>
          <option value="Optional">Optional</option>
        </select>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {totalFiltered} of {stats.requirements} requirements
      </p>

      <Accordion type="multiple" defaultValue={aiuc1Principles.map((p) => p.id)}>
        {filteredPrinciples.map((principle) => (
          <AccordionItem key={principle.id} value={principle.id}>
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3 text-left">
                <div
                  className="flex items-center justify-center h-8 w-8 rounded-lg"
                  style={{ backgroundColor: principle.color + "20", color: principle.color }}
                >
                  {principleIcons[principle.id]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {principle.id}. {principle.name}
                    </span>
                    <Badge variant="secondary" className="text-[10px]">
                      {principle.requirements.length} req
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-normal line-clamp-1">
                    {principle.description}
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2">
                {principle.requirements.map((req) => (
                  <RequirementCard key={req.id} req={req} principle={principle} />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <Card>
        <CardContent className="p-4 text-center">
          <p className="text-sm text-muted-foreground">
            AIUC-1 is the first AI agent security standard.{" "}
            <a
              href="https://www.aiuc-1.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              Learn more <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AIUC1Page() {
  return null;
}

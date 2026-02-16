import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { ChevronDown, ChevronRight, CheckCircle2, AlertCircle, Circle } from "lucide-react";
import type { AISVSCoverageResult, AISVSMapping, RequirementStatus } from "./engine/aisvsMapping";

interface CompliancePanelProps {
  result: AISVSCoverageResult;
}

const STATUS_ICON: Record<RequirementStatus, { icon: React.ElementType; color: string }> = {
  addressed: { icon: CheckCircle2, color: "text-green-500" },
  identified: { icon: AlertCircle, color: "text-yellow-500" },
  gap: { icon: Circle, color: "text-muted-foreground/40" },
};

export default function CompliancePanel({ result }: CompliancePanelProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggle = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const coveragePct =
    result.totalRequirements > 0
      ? Math.round((result.identifiedRequirements / result.totalRequirements) * 100)
      : 0;
  const addressedPct =
    result.totalRequirements > 0
      ? Math.round((result.addressedRequirements / result.totalRequirements) * 100)
      : 0;

  const categoriesSorted = Object.entries(result.coverageByCategory).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  const reqsByCategory = new Map<string, AISVSMapping[]>();
  for (const req of result.mappings) {
    if (!reqsByCategory.has(req.categoryName)) reqsByCategory.set(req.categoryName, []);
    reqsByCategory.get(req.categoryName)!.push(req);
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-3">
        {/* Overall coverage */}
        <div className="space-y-2 p-3 rounded-lg border bg-accent/20">
          <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
            AISVS Compliance
          </p>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span>Identified</span>
              <span className="font-bold">{coveragePct}%</span>
            </div>
            <Progress value={coveragePct} className="h-2" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span>Addressed (with mitigations)</span>
              <span className="font-bold text-green-600">{addressedPct}%</span>
            </div>
            <Progress value={addressedPct} className="h-2 [&>div]:bg-green-500" />
          </div>
          <div className="grid grid-cols-3 gap-1 text-center pt-1">
            <div className="rounded bg-green-500/10 p-1">
              <p className="text-sm font-bold text-green-600">{result.addressedRequirements}</p>
              <p className="text-[7px] text-muted-foreground">Addressed</p>
            </div>
            <div className="rounded bg-yellow-500/10 p-1">
              <p className="text-sm font-bold text-yellow-600">
                {result.identifiedRequirements - result.addressedRequirements}
              </p>
              <p className="text-[7px] text-muted-foreground">Identified</p>
            </div>
            <div className="rounded bg-muted p-1">
              <p className="text-sm font-bold text-muted-foreground">{result.gapRequirements}</p>
              <p className="text-[7px] text-muted-foreground">Gaps</p>
            </div>
          </div>
        </div>

        {/* By category */}
        <div className="space-y-1">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase">By Category</p>
          {categoriesSorted.map(([catName, stats]) => {
            const isOpen = expandedCategories.has(catName);
            const reqs = reqsByCategory.get(catName) ?? [];
            const catPct =
              stats.total > 0
                ? Math.round(((stats.identified + stats.addressed) / stats.total) * 100)
                : 0;
            return (
              <div key={catName} className="border rounded-md overflow-hidden">
                <button
                  onClick={() => toggle(catName)}
                  className="flex items-center gap-1.5 w-full text-left p-2 hover:bg-accent/50 transition-colors"
                >
                  {isOpen ? (
                    <ChevronDown className="h-3 w-3 shrink-0" />
                  ) : (
                    <ChevronRight className="h-3 w-3 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold truncate">{catName}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Progress value={catPct} className="h-1 flex-1" />
                      <span className="text-[9px] text-muted-foreground shrink-0">{catPct}%</span>
                    </div>
                  </div>
                  <span className="text-[9px] text-muted-foreground shrink-0">
                    {stats.identified + stats.addressed}/{stats.total}
                  </span>
                </button>
                {isOpen && reqs.length > 0 && (
                  <div className="border-t px-2 py-1 space-y-0.5 bg-accent/10">
                    {reqs.map((req) => {
                      const cfg = STATUS_ICON[req.status];
                      const Icon = cfg.icon;
                      return (
                        <div
                          key={req.requirementId}
                          className="flex items-start gap-1.5 py-0.5 text-[10px]"
                        >
                          <Icon className={`h-3 w-3 shrink-0 mt-0.5 ${cfg.color}`} />
                          <div className="min-w-0">
                            <span className="font-mono text-[9px] text-muted-foreground mr-1">
                              {req.code}
                            </span>
                            <span className="text-foreground">{req.title}</span>
                            <span className="text-muted-foreground ml-1">(L{req.level})</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}

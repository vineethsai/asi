import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Crosshair, Network } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkline } from "@/components/charts/Sparkline";
import { SeverityBadge } from "@/components/content/SeverityBadge";
import { architecturesData, type Architecture } from "@/components/components/architecturesData";
import { threatModelerPathFor } from "@/config/navigation";
import AttackPathPlayer from "@/components/visual/AttackPathPlayer";
import { primaryAttackPath } from "@/components/visual/attackPath";
import { threatBandCounts } from "./siteStats";

const ARCHITECTURES = Object.values(architecturesData).sort(
  (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
);

/** Display name without the "… Architecture" suffix for tabs. */
function shortName(name: string): string {
  return name.replace(/\s+(Agent\s+)?Architecture$/i, "").trim();
}

function ShowcasePanel({ arch }: { arch: Architecture }) {
  const scenario = arch.relevantThreats?.[0];
  const path = useMemo(() => primaryAttackPath(arch.id, arch.relevantThreats), [arch]);
  const counts = useMemo(() => threatBandCounts(arch.threatIds), [arch]);

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="border-b bg-muted/20 p-3 sm:p-4">
        <AttackPathPlayer
          architectureId={arch.id}
          steps={path?.steps ?? []}
          autoplay
          title={`${shortName(arch.name)} attack path`}
          diagramClassName="w-full h-[300px] sm:h-[380px] bg-background"
        />
      </div>
      <div className="grid gap-6 p-5 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">{arch.name}</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{arch.description}</p>
          {scenario && (
            <div className="rounded-md border-l-2 border-[hsl(var(--security-high))] bg-muted/30 p-3">
              <p className="text-sm font-medium">Walked above: {scenario.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{scenario.description}</p>
            </div>
          )}
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Threats by severity
            </p>
            <Sparkline counts={counts} width={96} height={24} showText className="mt-2" />
          </div>
          {arch.riskScore != null && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Pattern risk</span>
              <SeverityBadge score={arch.riskScore} showScore size="xs" />
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Link
              to={`/architectures/${arch.id}`}
              className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              View details <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
            <Link
              to={threatModelerPathFor(arch.id)}
              className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
            >
              <Crosshair className="h-3.5 w-3.5" aria-hidden="true" />
              Model it
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Home architecture showcase (6.1 item 3): full-width tabbed diagram that walks the pattern's
 * first relevant threat (§8.5) when it scrolls into view and on every tab change, with replay.
 */
export const ArchitectureShowcase = () => {
  const [activeId, setActiveId] = useState(ARCHITECTURES[0]?.id ?? "");
  if (!ARCHITECTURES.length) return null;

  return (
    <section className="py-12 lg:py-16" aria-labelledby="showcase-title">
      <div className="container px-4 md:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="showcase-title" className="text-xl font-semibold tracking-tight">
              Architecture patterns under attack
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Each of the {ARCHITECTURES.length} reference patterns with the path its first relevant
              threat takes through the system.
            </p>
          </div>
          <Link
            to="/architectures"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <Network className="h-4 w-4" aria-hidden="true" />
            All architectures
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        <Tabs value={activeId} onValueChange={setActiveId}>
          <TabsList className="mb-4 h-auto w-full justify-start overflow-x-auto rounded-none border-b bg-transparent p-0">
            {ARCHITECTURES.map((arch) => (
              <TabsTrigger
                key={arch.id}
                value={arch.id}
                className="-mb-px rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                {shortName(arch.name)}
              </TabsTrigger>
            ))}
          </TabsList>
          {ARCHITECTURES.map((arch) => (
            <TabsContent key={arch.id} value={arch.id} className="mt-0">
              <ShowcasePanel arch={arch} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
};

export default ArchitectureShowcase;

/**
 * Attack paths tab (P3-34): entry → target chains with hop narrative, gates
 * passed, score vs residual, canvas highlight and playback.
 */
import { useState } from "react";
import { Crosshair, Pause, Play, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AnalysisResult } from "../engine/analyze";
import type { AttackPath } from "../engine/paths";
import { useCanvasActions } from "../hooks/useCanvasActions";
import { tm, useTM } from "../store";
import { threatDomId, useNodeLabels } from "./helpers";
import { Chip, Disclosure, SevChip } from "./shared";

function PathCard({
  path,
  rank,
  labels,
  playing,
  threatName,
}: {
  path: AttackPath;
  rank: number;
  labels: Map<string, string>;
  playing: boolean;
  threatName: (id: string) => string | undefined;
}) {
  const actions = useCanvasActions();
  const [open, setOpen] = useState(rank === 0);
  const label = (id: string) => labels.get(id) ?? id;
  const bodyId = `tm-path-${threatDomId(path.id)}`;
  const reduced = path.residualScore < path.score;
  return (
    <article
      className={cn(
        "rounded-md border bg-card p-2 text-xs",
        playing && "border-primary ring-1 ring-primary/40",
      )}
      aria-label={`Attack path ${rank + 1}: ${label(path.entryPoint)} to ${label(path.target)}`}
    >
      <div className="flex items-start gap-2">
        <SevChip band={path.severity} />
        <div className="min-w-0 flex-1">
          <p className="font-medium leading-snug">
            {label(path.entryPoint)} <span aria-hidden>→</span>
            <span className="sr-only">to</span> {label(path.target)}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {path.nodes.length - 1} hop{path.nodes.length === 2 ? "" : "s"} · score {path.score}/25
            {reduced ? ` · residual ${path.residualScore}/25` : ""} · likelihood{" "}
            {Math.round(path.likelihood * 100)}%
          </p>
        </div>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={() => actions.locate(path.nodes)}
        >
          <Crosshair className="h-3.5 w-3.5" aria-hidden />
          Highlight
        </Button>
        <Button
          variant={playing ? "default" : "outline"}
          size="sm"
          className="h-7 gap-1 text-xs"
          aria-pressed={playing}
          onClick={() => tm().setUi({ playback: playing ? null : { pathId: path.id } })}
        >
          {playing ? (
            <Pause className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <Play className="h-3.5 w-3.5" aria-hidden />
          )}
          {playing ? "Playing — stop" : "Play on canvas"}
        </Button>
        <Disclosure open={open} onToggle={() => setOpen((o) => !o)} controls={bodyId}>
          Steps
        </Disclosure>
      </div>
      <div id={bodyId} hidden={!open} className="mt-2 space-y-2">
        {open && (
          <>
            <ol className="space-y-1 border-l pl-3">
              {path.hops.map((h, i) => (
                <li key={`${h.edgeId}-${i}`} className="relative leading-snug">
                  <span
                    aria-hidden
                    className="absolute -left-[17px] top-1 h-2 w-2 rounded-full border border-background bg-muted-foreground/60"
                  />
                  <span className="font-medium">{i + 1}.</span> {h.text}
                  <span className="ml-1 text-[11px] text-muted-foreground">
                    ({Math.round(h.likelihood * 100)}%)
                  </span>
                </li>
              ))}
            </ol>
            {path.gatesPassed.length > 0 && (
              <p className="flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                Gates passed:
                {path.gatesPassed.map((g) => (
                  <Chip key={g}>{label(g)}</Chip>
                ))}
              </p>
            )}
            {path.threats.length > 0 && (
              <div className="space-y-0.5">
                <p className="text-[11px] font-medium text-muted-foreground">
                  Threats along this path
                </p>
                <ul className="space-y-0.5">
                  {path.threats.slice(0, 8).map((id) => (
                    <li key={id}>
                      <button
                        type="button"
                        className="text-left text-primary hover:underline"
                        onClick={() => tm().setUi({ selectedThreatId: id, resultsTab: "threats" })}
                      >
                        {threatName(id) ?? id}
                      </button>
                    </li>
                  ))}
                  {path.threats.length > 8 && (
                    <li className="text-[11px] text-muted-foreground">
                      +{path.threats.length - 8} more
                    </li>
                  )}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </article>
  );
}

export function PathsTab({ analysis }: { analysis: AnalysisResult }) {
  const labels = useNodeLabels();
  const playingId = useTM((s) => s.ui.playback?.pathId ?? null);
  const { paths, truncated, total, brokenByGates } = analysis.paths;
  const names = new Map(analysis.threats.map((t) => [t.id, t.name]));

  if (!paths.length) {
    return (
      <div className="space-y-2 rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
        <p>No attack paths: nothing reachable from an entry point leads to a sensitive target.</p>
        {brokenByGates > 0 && (
          <p>
            {brokenByGates} path{brokenByGates === 1 ? " is" : "s are"} broken by human-approval
            gates.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-muted-foreground">
        {truncated
          ? `Showing the top ${paths.length} of ${total} paths, ranked by score.`
          : `${total} path${total === 1 ? "" : "s"}, ranked by score.`}
        {brokenByGates > 0 &&
          ` ${brokenByGates} more ${brokenByGates === 1 ? "is" : "are"} broken by human-approval gates.`}
      </p>
      {paths.map((p, i) => (
        <PathCard
          key={p.id}
          path={p}
          rank={i}
          labels={labels}
          playing={playingId === p.id}
          threatName={(id) => names.get(id)}
        />
      ))}
    </div>
  );
}

export default PathsTab;

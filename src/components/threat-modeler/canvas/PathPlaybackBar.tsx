import { useEffect, useMemo } from "react";
import { Pause, Play, RotateCcw, SkipBack, SkipForward, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCanvasActions } from "../hooks/useCanvasActions";
import { stepsForPath, usePathPlayback } from "../hooks/usePathPlayback";
import { tm, useTM } from "../store";
import type { AttackPath } from "../engine/paths";

/** Floating controls for attack-path playback (§8.5), started from the Paths tab. */
export default function PathPlaybackBar() {
  const pathId = useTM((s) => s.ui.playback?.pathId ?? null);
  const path = useTM((s) =>
    pathId ? (s.analysis?.paths.paths.find((p) => p.id === pathId) ?? null) : null,
  );
  useEffect(() => {
    // The path vanished (re-run, clear): stop instead of showing stale controls.
    if (pathId && !path) tm().setUi({ playback: null });
  }, [pathId, path]);
  if (!path) return null;
  return <Controls key={path.id} path={path} />;
}

function Controls({ path }: { path: AttackPath }) {
  const actions = useCanvasActions();
  // Labels are read once per path so drags and selection don't restart the timer.
  const steps = useMemo(() => stepsForPath(path, tm().document.nodes, tm().document.edges), [path]);
  const p = usePathPlayback(steps, path.severity);

  useEffect(() => {
    actions.focusNodes(path.nodes);
  }, [actions, path.nodes]);

  const stop = () => tm().setUi({ playback: null });
  return (
    <div
      role="region"
      aria-label={`Attack path playback: ${path.name}`}
      className="absolute left-1/2 top-3 z-20 flex w-[min(36rem,calc(100%-1.5rem))] -translate-x-1/2 items-center gap-2 rounded-lg border bg-card/95 px-2 py-1.5 shadow-lg backdrop-blur"
    >
      <div className="flex shrink-0 items-center">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={p.prev}
          disabled={p.index <= 0}
          aria-label="Previous hop"
        >
          <SkipBack className="h-4 w-4" />
        </Button>
        {p.done ? (
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={p.replay}
            aria-label="Replay"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        ) : p.playing ? (
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={p.pause}
            aria-label="Pause"
          >
            <Pause className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={p.play}
            aria-label="Play"
          >
            <Play className="h-4 w-4" />
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={p.next}
          disabled={p.done}
          aria-label="Next hop"
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium" title={path.name}>
          {path.name}
        </p>
        <p className="truncate text-[11px] text-muted-foreground" aria-live="polite">
          Step {p.index + 1} of {p.total}: {p.caption}
        </p>
      </div>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 shrink-0"
        onClick={stop}
        aria-label="Stop playback"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

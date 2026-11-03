import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import type { AttackPath } from "../engine/paths";
import { tm, type CanvasHighlight } from "../store";
import type { CanvasEdge, CanvasNode, Severity } from "../types";

/**
 * Attack-path playback on the modeler canvas (§7.5 / §8.5). A small sequencer
 * modelled on src/components/visual/useAttackPath.ts (not imported: that
 * module pulls the site's threat catalogue into the modeler chunk). It writes
 * the current frame to `ui.highlight`; nodes pulse and edges carry a moving
 * dot from there.
 */
export const HOP_MS = 1200;
const DWELL_MS = 700;
const ENTRY_MS = 900;

export interface PlaybackStep {
  nodeId: string;
  edgeId?: string;
  reverse?: boolean;
  caption: string;
}

export function stepsForPath(
  path: AttackPath,
  nodes: CanvasNode[],
  edges: CanvasEdge[],
): PlaybackStep[] {
  const label = (id: string) => nodes.find((n) => n.id === id)?.data.label ?? id;
  const entry = path.entryPoint ?? path.nodes[0];
  const steps: PlaybackStep[] = [{ nodeId: entry, caption: `Entry point: ${label(entry)}` }];
  for (const hop of path.hops ?? []) {
    const edge = edges.find((e) => e.id === hop.edgeId);
    steps.push({
      nodeId: hop.to,
      edgeId: hop.edgeId,
      reverse: edge ? edge.source === hop.to : hop.dir === "response",
      caption: hop.text || `${label(hop.from)} → ${label(hop.to)}`,
    });
  }
  if (!path.hops?.length)
    for (let i = 1; i < path.nodes.length; i++)
      steps.push({
        nodeId: path.nodes[i],
        edgeId: path.edges[i - 1],
        caption: `${label(path.nodes[i - 1])} → ${label(path.nodes[i])}`,
      });
  return steps;
}

export interface PlaybackState {
  index: number;
  total: number;
  playing: boolean;
  done: boolean;
  caption: string;
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  replay: () => void;
  goTo: (i: number) => void;
}

export function usePathPlayback(steps: PlaybackStep[], band: Severity): PlaybackState {
  const reduced = useReducedMotion();
  const last = steps.length - 1;
  const [index, setIndex] = useState(reduced ? last : 0);
  const [playing, setPlaying] = useState(!reduced);
  const [runKey, setRunKey] = useState(0);
  const indexRef = useRef(index);
  indexRef.current = index;

  const show = useCallback(
    (i: number) => {
      setIndex(Math.max(0, Math.min(last, i)));
      setRunKey((k) => k + 1);
    },
    [last],
  );

  useEffect(() => {
    if (!playing) return;
    if (index >= last) {
      setPlaying(false);
      return;
    }
    const ms = steps[index]?.edgeId ? HOP_MS + DWELL_MS : ENTRY_MS;
    const t = window.setTimeout(() => show(index + 1), ms);
    return () => window.clearTimeout(t);
  }, [playing, index, last, steps, show]);

  const highlight = useMemo<CanvasHighlight | null>(() => {
    if (index < 0 || !steps.length) return null;
    const upto = steps.slice(0, index + 1);
    const step = steps[index];
    return {
      activeNodeId: step.nodeId,
      activeEdgeId: step.edgeId,
      activeEdgeReverse: step.reverse,
      visitedNodeIds: upto.map((s) => s.nodeId),
      visitedEdgeIds: upto.flatMap((s) => (s.edgeId ? [s.edgeId] : [])),
      band,
      runKey,
      hopMs: HOP_MS,
      still: reduced,
    };
  }, [steps, index, band, runKey, reduced]);

  useEffect(() => {
    tm().setUi({ highlight });
  }, [highlight]);
  useEffect(() => () => tm().setUi({ highlight: null }), []);

  return {
    index,
    total: steps.length,
    playing,
    done: index >= last,
    caption: steps[index]?.caption ?? "",
    play: () => {
      if (reduced) return show(last);
      if (indexRef.current >= last) show(0);
      setPlaying(true);
    },
    pause: () => setPlaying(false),
    next: () => {
      setPlaying(false);
      show(indexRef.current + 1);
    },
    prev: () => {
      setPlaying(false);
      show(indexRef.current - 1);
    },
    replay: () => {
      show(reduced ? last : 0);
      setPlaying(!reduced);
    },
    goTo: (i) => {
      setPlaying(false);
      show(i);
    },
  };
}

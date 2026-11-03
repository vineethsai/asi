/**
 * useAttackPath — headless sequencer behind <AttackPathPlayer> (IMPROVEMENT_PLAN §8.5).
 * Exported separately so other canvases (e.g. the Threat Modeler's React Flow canvas) can drive
 * their own highlight from the same state machine.
 *
 *   const ap = useAttackPath(steps, { autoplay: true, active: isVisible });
 *   ap.play(); ap.pause(); ap.next(); ap.prev(); ap.replay(); ap.goTo(2);
 *   <MyCanvas highlight={ap.highlight} />     // AttackHighlight, see ./attackPath.ts
 *
 * Timing: a step with an edge lasts `hopMs` (the moving dot) + DWELL_MS; the entry step lasts
 * ENTRY_MS. Reduced motion: the final frame is shown from the start, `play`/`replay` jump to
 * it, and `highlight.still` is true (no dots, pulses or dash animation). Remount (React `key`)
 * when `steps` change to reset the sequence.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { highlightForStep, type AttackHighlight, type AttackPathStep } from "./attackPath";

export const DEFAULT_HOP_MS = 1200;
export const DWELL_MS = 700;
export const ENTRY_MS = 900;

export interface UseAttackPathOptions {
  /** Start playing once `active` is true (first time only). */
  autoplay?: boolean;
  /** E.g. "scrolled into view"; autoplay waits for it. Default true. */
  active?: boolean;
  hopMs?: number;
  onStepChange?: (index: number, step: AttackPathStep | undefined) => void;
}

export interface AttackPathState {
  /** Current step (-1 = not started). */
  index: number;
  total: number;
  step: AttackPathStep | undefined;
  playing: boolean;
  /** At (or past) the last step. */
  done: boolean;
  reduced: boolean;
  runKey: number;
  highlight: AttackHighlight | undefined;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  replay: () => void;
  goTo: (index: number) => void;
}

export function stepDurationMs(step: AttackPathStep | undefined, hopMs = DEFAULT_HOP_MS): number {
  if (!step) return ENTRY_MS;
  return step.edgeId ? hopMs + DWELL_MS : ENTRY_MS;
}

export function useAttackPath(
  steps: readonly AttackPathStep[],
  {
    autoplay = false,
    active = true,
    hopMs = DEFAULT_HOP_MS,
    onStepChange,
  }: UseAttackPathOptions = {},
): AttackPathState {
  const reduced = useReducedMotion();
  const last = steps.length - 1;
  const [rawIndex, setIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const autoplayed = useRef(false);

  // Reduced motion shows the final frame until the user steps elsewhere.
  const index = reduced && rawIndex < 0 ? last : Math.min(rawIndex, last);
  const indexRef = useRef(index);
  indexRef.current = index;

  const show = useCallback(
    (i: number) => {
      setIndex(Math.max(0, Math.min(last, i)));
      setRunKey((k) => k + 1);
    },
    [last],
  );

  const play = useCallback(() => {
    if (last < 0) return;
    if (reduced) {
      setPlaying(false);
      show(last);
      return;
    }
    if (indexRef.current < 0 || indexRef.current >= last) show(0);
    setPlaying(true);
  }, [last, reduced, show]);

  const pause = useCallback(() => setPlaying(false), []);

  const replay = useCallback(() => {
    if (last < 0) return;
    if (reduced) {
      show(last);
      return;
    }
    show(0);
    setPlaying(true);
  }, [last, reduced, show]);

  const goTo = useCallback(
    (i: number) => {
      setPlaying(false);
      show(i);
    },
    [show],
  );
  const next = useCallback(() => goTo(indexRef.current + 1), [goTo]);
  const prev = useCallback(() => goTo(Math.max(0, indexRef.current - 1)), [goTo]);
  const toggle = useCallback(() => (playing ? pause() : play()), [playing, pause, play]);

  // Autoplay the first time the player becomes active.
  useEffect(() => {
    if (!autoplay || !active || autoplayed.current || last < 0) return;
    autoplayed.current = true;
    play();
  }, [autoplay, active, last, play]);

  // Advance while playing.
  useEffect(() => {
    if (!playing) return;
    if (index >= last) {
      setPlaying(false);
      return;
    }
    const t = window.setTimeout(() => show(index + 1), stepDurationMs(steps[index], hopMs));
    return () => window.clearTimeout(t);
  }, [playing, index, last, steps, hopMs, show]);

  const onStepChangeRef = useRef(onStepChange);
  onStepChangeRef.current = onStepChange;
  useEffect(() => {
    onStepChangeRef.current?.(index, index >= 0 ? steps[index] : undefined);
  }, [index, steps]);

  const highlight = useMemo(
    () => highlightForStep(steps, index, { runKey, hopMs, still: reduced }),
    [steps, index, runKey, hopMs, reduced],
  );

  return {
    index,
    total: steps.length,
    step: index >= 0 ? steps[index] : undefined,
    playing,
    done: last >= 0 && index >= last,
    reduced,
    runKey,
    highlight,
    play,
    pause,
    toggle,
    next,
    prev,
    replay,
    goTo,
  };
}

export default useAttackPath;

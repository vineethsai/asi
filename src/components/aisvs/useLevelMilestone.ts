/**
 * "Level 1 complete" milestone (IMPROVEMENT_PLAN §8.6): when every AISVS Level 1 requirement is
 * checked, fire confetti once (lazy `canvas-confetti`, skipped under reduced motion) and a toast.
 * A localStorage flag (per AISVS version) makes it once-only; unchecking does not re-arm it.
 */
import { useEffect, useRef } from "react";
import { toast } from "@/components/ui/sonner";
import { prefersReducedMotion } from "@/lib/motion";
import { AISVS_VERSION } from "@/data/aisvs";

export const MILESTONE_STORAGE_KEY = "ash-aisvs-milestones";

function readFlags(): Record<string, string> {
  try {
    const raw = window.localStorage.getItem(MILESTONE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeFlag(key: string): void {
  try {
    const flags = readFlags();
    flags[key] = new Date().toISOString();
    window.localStorage.setItem(MILESTONE_STORAGE_KEY, JSON.stringify(flags));
  } catch {
    /* storage unavailable: the milestone may show again next visit */
  }
}

export function hasMilestone(level: 1 | 2 | 3): boolean {
  return typeof window !== "undefined" && `L${level}@${AISVS_VERSION}` in readFlags();
}

async function celebrate(): Promise<void> {
  if (prefersReducedMotion()) return;
  try {
    const { default: confetti } = await import("canvas-confetti");
    confetti({ particleCount: 140, spread: 75, startVelocity: 38, origin: { y: 0.25 } });
  } catch {
    /* decorative only */
  }
}

/**
 * Fires once when `done === total` for the level. `onShare` is offered as the toast action.
 */
export function useLevelMilestone(
  level: 1 | 2 | 3,
  done: number,
  total: number,
  onShare?: () => void,
): void {
  const fired = useRef(false);
  const shareRef = useRef(onShare);
  shareRef.current = onShare;

  useEffect(() => {
    if (fired.current || total === 0 || done < total) return;
    const key = `L${level}@${AISVS_VERSION}`;
    if (key in readFlags()) {
      fired.current = true;
      return;
    }
    fired.current = true;
    writeFlag(key);
    void celebrate();
    toast.success(`AISVS Level ${level} complete`, {
      description: `All ${total} Level ${level} requirements of AISVS ${AISVS_VERSION} are checked.`,
      action: shareRef.current
        ? { label: "Share", onClick: () => shareRef.current?.() }
        : undefined,
      duration: 8000,
    });
  }, [level, done, total]);
}

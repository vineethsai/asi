/**
 * Milestone confetti (IMPROVEMENT_PLAN §8.6). `canvas-confetti` is loaded lazily on first use.
 * Callers decide *when* (once per milestone, e.g. the first time a quiz is passed) and pass the
 * `useReducedMotion()` flag; nothing runs under reduced motion.
 */
export async function celebrate({ reduced }: { reduced: boolean }): Promise<void> {
  if (reduced || typeof window === "undefined") return;
  try {
    const { default: confetti } = await import("canvas-confetti");
    void confetti({
      particleCount: 110,
      spread: 75,
      startVelocity: 38,
      origin: { y: 0.65 },
      zIndex: 60,
      disableForReducedMotion: true,
    });
  } catch {
    // Decorative only: a failed chunk load must never break the quiz.
  }
}

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useTM } from "../store";

const SWEEP_CSS = `
.tm-sweep{position:absolute;inset:0 auto 0 0;width:45%;
  background:linear-gradient(90deg,transparent,hsl(var(--primary)/.16) 45%,hsl(var(--primary)/.28) 50%,hsl(var(--primary)/.16) 55%,transparent);
  animation:tm-sweep 500ms cubic-bezier(.4,0,.2,1) infinite}
@keyframes tm-sweep{from{transform:translateX(-100%)}to{transform:translateX(230%)}}
`;

/**
 * §7.5 analysis transition: a left→right gradient wipe while the engine runs
 * (the store keeps the run ≥ 500 ms), plus a polite status message for
 * screen readers when a run starts and lands.
 */
export default function AnalysisSweep() {
  const running = useTM((s) => s.analysisPhase === "running");
  const total = useTM((s) => s.analysis?.summary.total ?? null);
  const open = useTM((s) => s.analysis?.summary.open ?? null);
  const error = useTM((s) => s.analysisError);
  const reduced = useReducedMotion();
  const [message, setMessage] = useState("");
  const wasRunning = useRef(false);

  useEffect(() => {
    if (running) setMessage("Analysing the model…");
    else if (wasRunning.current)
      setMessage(
        error
          ? `Analysis failed: ${error}`
          : `Analysis complete: ${total ?? 0} threats, ${open ?? 0} open.`,
      );
    wasRunning.current = running;
  }, [running, total, open, error]);

  return (
    <>
      <div role="status" aria-live="polite" className="sr-only">
        {message}
      </div>
      {running && !reduced && (
        <div aria-hidden className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
          <style>{SWEEP_CSS}</style>
          <div className="tm-sweep" />
        </div>
      )}
    </>
  );
}

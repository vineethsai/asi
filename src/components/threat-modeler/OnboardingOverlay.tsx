import { useCallback, useEffect, useMemo, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Bot, Cable, Check, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCanvasActions } from "./hooks/useCanvasActions";
import { writePrefs } from "./persistence";
import { tm, useTM, type ThreatModelState } from "./store";
import type { CanvasNode } from "./types";

export interface OnboardingOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payload?: Record<string, unknown>;
}

const AGENT_KINDS = new Set(["agent", "orchestrator"]);
const TOOL_KINDS = new Set(["tool", "scoped-tool", "mcp-server"]);

const isAgent = (n: CanvasNode) =>
  n.data?.category === "kc2" || AGENT_KINDS.has(n.data?.semantics?.kind ?? "");
const isTool = (n: CanvasNode) =>
  n.data?.category === "kc5" || TOOL_KINDS.has(n.data?.semantics?.kind ?? "");

const selectAgentId = (s: ThreatModelState) => s.document.nodes.find(isAgent)?.id ?? null;
const selectToolId = (s: ThreatModelState) => s.document.nodes.find(isTool)?.id ?? null;
const selectToolConnected = (s: ThreatModelState) => {
  const tools = new Set(s.document.nodes.filter(isTool).map((n) => n.id));
  return s.document.edges.some((e) => tools.has(e.source) || tools.has(e.target));
};

interface StepDef {
  title: string;
  target: "palette" | "canvas" | "analyze";
  icon: typeof Bot;
}

const STEPS: StepDef[] = [
  { title: "Drop an agent", target: "palette", icon: Bot },
  { title: "Connect a tool", target: "canvas", icon: Cable },
  { title: "Run the analysis", target: "analyze", icon: Play },
];

/** Tracks a `[data-tour]` element's viewport rect (resize, scroll, layout shifts). */
function useTargetRect(target: string | null, active: boolean) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  useEffect(() => {
    if (!active || !target) {
      setRect(null);
      return;
    }
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const el = document.querySelector(`[data-tour="${target}"]`);
        const r = el?.getBoundingClientRect();
        setRect(r && r.width > 0 && r.height > 0 ? r : null);
      });
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    const poll = window.setInterval(measure, 400);
    return () => {
      cancelAnimationFrame(frame);
      window.clearInterval(poll);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [target, active]);
  return rect;
}

/**
 * Guided build (P3-37): drop an agent → connect a tool → run the analysis,
 * with a spotlight on the part of the UI each step uses. A non-modal Radix
 * dialog so the user can work on the canvas while it is open; steps advance
 * on their own when the store shows the step is done.
 */
export default function OnboardingOverlay({ open, onOpenChange }: OnboardingOverlayProps) {
  const actions = useCanvasActions();
  const agentId = useTM(selectAgentId);
  const toolId = useTM(selectToolId);
  const toolConnected = useTM(selectToolConnected);
  const analysed = useTM((s) => s.analysis !== null);
  const readOnly = useTM((s) => s.persist === "readonly");
  const done = useMemo(
    () => [!!agentId, toolConnected, analysed],
    [agentId, toolConnected, analysed],
  );
  const firstOpen = done.findIndex((d) => !d);
  const [step, setStep] = useState(0);

  // Start at the first unfinished step whenever the tour opens.
  useEffect(() => {
    if (open) setStep(firstOpen < 0 ? STEPS.length : firstOpen);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on open
  }, [open]);

  // Auto-advance when the current step's condition becomes true.
  useEffect(() => {
    if (open && step < STEPS.length && done[step]) setStep((s) => Math.min(STEPS.length, s + 1));
  }, [open, step, done]);

  const finished = step >= STEPS.length;
  const rect = useTargetRect(finished ? null : STEPS[step].target, open);

  const close = useCallback(() => {
    writePrefs({ onboardingSeen: true });
    onOpenChange(false);
  }, [onOpenChange]);

  const current = finished ? null : STEPS[step];

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(o) => (o ? onOpenChange(true) : close())}
      modal={false}
    >
      <DialogPrimitive.Portal>
        {open && rect && (
          <div
            aria-hidden
            className="pointer-events-none fixed z-[60] rounded-lg ring-2 ring-primary transition-all duration-200 motion-reduce:transition-none"
            style={{
              top: rect.top - 6,
              left: rect.left - 6,
              width: rect.width + 12,
              height: rect.height + 12,
              boxShadow: "0 0 0 9999px hsl(var(--background) / 0.55)",
            }}
          />
        )}
        <DialogPrimitive.Content
          onInteractOutside={(e) => e.preventDefault()}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="fixed bottom-4 left-1/2 z-[61] w-[min(26rem,calc(100vw-2rem))] -translate-x-1/2 rounded-xl border bg-background p-4 shadow-2xl outline-none sm:bottom-6"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p
                className="text-[11px] font-semibold uppercase tracking-wide text-primary"
                aria-live="polite"
              >
                {finished ? "All done" : `Step ${step + 1} of ${STEPS.length}`}
              </p>
              <DialogPrimitive.Title className="text-base font-semibold">
                {current ? current.title : "Your first threat model is ready"}
              </DialogPrimitive.Title>
            </div>
            <DialogPrimitive.Close
              className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Close the guided build"
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>

          <ol className="mt-2 flex gap-1.5" aria-label="Progress">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex flex-1 items-center gap-1.5">
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold",
                    done[i]
                      ? "border-primary bg-primary text-primary-foreground"
                      : i === step
                        ? "border-primary text-primary"
                        : "text-muted-foreground",
                  )}
                  aria-label={`${s.title}: ${done[i] ? "done" : i === step ? "current" : "to do"}`}
                >
                  {done[i] ? <Check className="h-3 w-3" aria-hidden /> : i + 1}
                </span>
                <span className="hidden truncate text-[11px] text-muted-foreground sm:inline">
                  {s.title}
                </span>
              </li>
            ))}
          </ol>

          <DialogPrimitive.Description asChild>
            <div className="mt-3 space-y-2 text-xs text-muted-foreground">
              {step === 0 && (
                <p>
                  Drag an <strong className="text-foreground">Agent</strong> from the highlighted
                  palette onto the canvas, or press its{" "}
                  <strong className="text-foreground">+</strong> button to place it in the middle of
                  the view.
                </p>
              )}
              {step === 1 && (
                <p>
                  Add a <strong className="text-foreground">Tool</strong>, then drag from the
                  agent&apos;s bottom or right handle onto it. Keyboard: select the agent, press{" "}
                  <kbd className="rounded border bg-muted px-1 font-mono text-[11px]">C</kbd>, focus
                  the tool and press{" "}
                  <kbd className="rounded border bg-muted px-1 font-mono text-[11px]">Enter</kbd>.
                </p>
              )}
              {step === 2 && (
                <p>
                  Press <strong className="text-foreground">Analyze</strong>. Threats appear as
                  badges on the components and in the results panel, each with the rule that fired
                  and why.
                </p>
              )}
              {finished && (
                <p>
                  Open a threat to see its evidence, set a status, or mark a mitigation as
                  implemented and watch the residual score drop.
                </p>
              )}
            </div>
          </DialogPrimitive.Description>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {step === 0 && (
              <Button
                size="sm"
                disabled={readOnly}
                onClick={() => actions.addEntryById("sem-agent")}
              >
                Place one for me
              </Button>
            )}
            {step === 1 && !toolId && (
              <Button
                size="sm"
                disabled={readOnly}
                onClick={() => actions.addEntryById("sem-tool-scoped")}
              >
                Place a tool
              </Button>
            )}
            {step === 1 && toolId && agentId && (
              <Button
                size="sm"
                disabled={readOnly}
                onClick={() => actions.connect(agentId, toolId)}
              >
                Connect them for me
              </Button>
            )}
            {step === 2 && (
              <Button size="sm" onClick={() => void tm().analyze()}>
                <Play className="mr-1 h-3.5 w-3.5" aria-hidden />
                Analyze
              </Button>
            )}
            {finished ? (
              <Button size="sm" onClick={close}>
                Finish
              </Button>
            ) : (
              <Button size="sm" variant="ghost" onClick={close}>
                Skip tour
              </Button>
            )}
            {step === 0 && (
              <button
                type="button"
                onClick={() => {
                  close();
                  tm().openDialog("templates");
                }}
                className="ml-auto text-[11px] text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Start from a template instead
              </button>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

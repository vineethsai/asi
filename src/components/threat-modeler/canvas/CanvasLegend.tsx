import type { ReactNode } from "react";
import { ArrowLeftRight, ChevronDown, ChevronUp, Lock, LockOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { severityColor, severityLabel, type Band } from "@/lib/severity";
import { tm, useTM } from "../store";
import {
  CLASSIFICATIONS,
  TRUST_LABEL,
  classificationColor,
  trustColor,
} from "../nodes/visualTokens";
import type { TrustLevel } from "../types";

/**
 * Persistent, collapsible mini-legend (§7.5): severity ring, trust stripe and
 * edge posture. FlowCanvas positions it in the canvas corner.
 */
const BANDS: Band[] = ["critical", "high", "medium", "low"];
const TRUST: TrustLevel[] = ["untrusted", "semi-trusted", "trusted"];

function Row({ children }: { children: ReactNode }) {
  return <li className="flex items-center gap-1.5">{children}</li>;
}

export default function CanvasLegend({ className }: { className?: string }) {
  const open = useTM((s) => s.ui.legendOpen);
  const contentId = "tm-canvas-legend";
  return (
    <div
      className={cn(
        "pointer-events-auto w-52 rounded-lg border bg-background/95 text-[11px] shadow-sm backdrop-blur-sm",
        className,
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => tm().setUi({ legendOpen: !open })}
        className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-[11px] font-semibold hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Legend
        {open ? (
          <ChevronDown className="h-3.5 w-3.5" aria-hidden />
        ) : (
          <ChevronUp className="h-3.5 w-3.5" aria-hidden />
        )}
      </button>
      {open && (
        <div id={contentId} className="space-y-2 px-2.5 pb-2.5">
          <section>
            <h3 className="mb-1 font-semibold text-muted-foreground">
              Residual risk (ring + fill)
            </h3>
            <ul className="grid grid-cols-2 gap-x-2 gap-y-1">
              {BANDS.map((b) => (
                <Row key={b}>
                  <span
                    aria-hidden
                    className="h-3 w-3 shrink-0 rounded-sm border"
                    style={{
                      boxShadow: `0 0 0 2px ${severityColor(b)}`,
                      background: severityColor(b, "base", 0.25),
                    }}
                  />
                  {severityLabel(b)}
                </Row>
              ))}
              <Row>
                <span
                  aria-hidden
                  className="h-3 w-3 shrink-0 rounded-sm border"
                  style={{ boxShadow: `0 0 0 1.5px ${severityColor("low")}` }}
                />
                Resolved
              </Row>
              <Row>
                <span aria-hidden className="text-muted-foreground">
                  <s>2</s>
                </span>
                resolved count
              </Row>
            </ul>
            <p className="mt-1 text-muted-foreground">Stronger fill = higher residual risk.</p>
          </section>
          <section>
            <h3 className="mb-1 font-semibold text-muted-foreground">Trust (left stripe / zone)</h3>
            <ul className="space-y-1">
              {TRUST.map((t) => (
                <Row key={t}>
                  <span
                    aria-hidden
                    className="h-3 w-1 shrink-0 rounded-sm"
                    style={{ background: trustColor(t) }}
                  />
                  {TRUST_LABEL[t]}
                </Row>
              ))}
            </ul>
          </section>
          <section>
            <h3 className="mb-1 font-semibold text-muted-foreground">Data flows</h3>
            <ul className="space-y-1">
              <Row>
                <svg aria-hidden width="24" height="6" className="shrink-0">
                  <line x1="0" y1="3" x2="24" y2="3" stroke="currentColor" strokeWidth="2" />
                </svg>
                <Lock className="h-3 w-3 shrink-0" aria-hidden /> Encrypted
              </Row>
              <Row>
                <svg aria-hidden width="24" height="6" className="shrink-0">
                  <line
                    x1="0"
                    y1="3"
                    x2="24"
                    y2="3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="6 5"
                  />
                </svg>
                <LockOpen className="h-3 w-3 shrink-0" aria-hidden /> Unencrypted
              </Row>
              <Row>
                <ArrowLeftRight className="h-3 w-3 shrink-0" aria-hidden /> Bidirectional (double
                arrow)
              </Row>
              <Row>
                <svg aria-hidden width="24" height="8" className="shrink-0">
                  <line x1="0" y1="4" x2="24" y2="4" stroke="currentColor" strokeWidth="4" />
                </svg>
                Thicker = on a riskier attack path
              </Row>
            </ul>
            <ul className="mt-1 grid grid-cols-2 gap-x-2 gap-y-1">
              {CLASSIFICATIONS.map((c) => (
                <Row key={c}>
                  <span
                    aria-hidden
                    className="h-1 w-4 shrink-0 rounded-full"
                    style={{ background: classificationColor(c) }}
                  />
                  {c}
                </Row>
              ))}
            </ul>
            <p className="mt-1 text-muted-foreground">
              Moving dashes: Flow toggle or attack-path playback.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}

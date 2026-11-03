import { Copy, Eye, FlaskConical, Info, Link2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { tm, useTM } from "../store";
import { createDocument } from "../document";
import { readStoredDocument } from "../persistence";

/** Strip above the canvas for read-only shared models and transient templates (P3-24). */
export function ModeBanner() {
  const persist = useTM((s) => s.persist);
  const name = useTM((s) => s.document.name);
  const hasNodes = useTM((s) => s.document.nodes.length > 0);

  if (persist === "readonly")
    return (
      <div
        role="status"
        className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b bg-[hsl(var(--security-info)/0.12)] px-4 py-2 text-sm"
      >
        <Eye className="h-4 w-4 shrink-0" aria-hidden />
        <span className="min-w-0 flex-1">
          You are viewing a shared model, <strong className="font-semibold">{name}</strong>. It is
          read-only and nothing is saved to this browser.
        </span>
        <Button size="sm" className="h-8" onClick={() => tm().makeCopy()}>
          <Copy className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          Make a copy
        </Button>
      </div>
    );

  if (persist === "transient" && hasNodes)
    return (
      <div
        role="status"
        className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b bg-muted/60 px-4 py-2 text-sm"
      >
        <Info className="h-4 w-4 shrink-0" aria-hidden />
        <span className="min-w-0 flex-1">
          Previewing the <strong className="font-semibold">{name}</strong> template. Your autosaved
          canvas is kept until you edit this one (it is then moved to My models).
        </span>
        <Button
          size="sm"
          variant="outline"
          className="h-8"
          onClick={() => {
            const stored = readStoredDocument();
            if (stored)
              tm().replaceDocument(stored, "Restore", { persist: "autosave", resetHistory: true });
            else
              tm().replaceDocument(createDocument({}), "Clear", {
                persist: "autosave",
                resetHistory: true,
              });
          }}
        >
          Back to my canvas
        </Button>
      </div>
    );
  return null;
}

/** Floating hint for connect mode and what-if removal. */
export function ModeHint() {
  const connectLabel = useTM((s) =>
    s.ui.connectFrom
      ? (s.document.nodes.find((n) => n.id === s.ui.connectFrom)?.data.label ?? "component")
      : null,
  );
  const whatIf = useTM((s) => s.ui.whatIf);

  if (connectLabel)
    return (
      <Hint
        icon={<Link2 className="h-4 w-4" aria-hidden />}
        onClose={() => tm().setUi({ connectFrom: null })}
        closeLabel="Cancel connection"
      >
        Connecting from <strong className="font-semibold">{connectLabel}</strong>: click or press
        Enter on the target component. Esc cancels.
      </Hint>
    );

  if (whatIf.active) {
    const r = whatIf.result;
    const delta = (a: number, b: number) => (b - a > 0 ? `+${b - a}` : `${b - a}`);
    return (
      <Hint
        icon={<FlaskConical className="h-4 w-4" aria-hidden />}
        onClose={() => tm().setUi({ whatIf: { active: false, result: null } })}
        closeLabel="Exit what-if mode"
      >
        {r ? (
          <span>
            Without <strong className="font-semibold">{r.label}</strong>: threats {r.after.threats}{" "}
            ({delta(r.before.threats, r.after.threats)}), open {r.after.open} (
            {delta(r.before.open, r.after.open)}), attack paths {r.after.paths} (
            {delta(r.before.paths, r.after.paths)}), score {r.after.score} (
            {delta(r.before.score, r.after.score)}). Nothing was changed.
          </span>
        ) : (
          <span>
            What-if: click a component to see the threat model without it. Nothing is changed.
          </span>
        )}
      </Hint>
    );
  }
  return null;
}

function Hint({
  icon,
  children,
  onClose,
  closeLabel,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClose: () => void;
  closeLabel: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="absolute bottom-16 left-1/2 z-20 flex w-[min(34rem,calc(100%-1.5rem))] -translate-x-1/2 items-start gap-2 rounded-lg border bg-card/95 px-3 py-2 text-xs shadow-lg backdrop-blur lg:bottom-4"
    >
      <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span>
      <div className="min-w-0 flex-1 leading-relaxed">{children}</div>
      <Button
        size="icon"
        variant="ghost"
        className="-my-1 h-7 w-7 shrink-0"
        onClick={onClose}
        aria-label={closeLabel}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

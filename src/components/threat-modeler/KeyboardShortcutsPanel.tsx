import { Fragment, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SHORTCUTS, SHORTCUT_GROUPS, formatKey, isMacPlatform } from "./shortcuts";

export interface KeyboardShortcutsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payload?: Record<string, unknown>;
}

/** Keyboard shortcuts dialog (P3-38), generated from the shortcuts table. */
export default function KeyboardShortcutsPanel({
  open,
  onOpenChange,
}: KeyboardShortcutsPanelProps) {
  const mac = useMemo(() => isMacPlatform(), []);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription className="text-xs">
            Canvas shortcuts work while the canvas has focus (click it or Tab into it). Modeler
            shortcuts work anywhere on the page except while typing in a field.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {SHORTCUT_GROUPS.map((group) => {
            const items = SHORTCUTS.filter((s) => s.group === group);
            if (!items.length) return null;
            return (
              <section key={group} aria-labelledby={`tm-sc-${group}`}>
                <h3
                  id={`tm-sc-${group}`}
                  className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  {group}
                </h3>
                <dl className="divide-y rounded-md border">
                  {items.map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-3 px-3 py-1.5">
                      <dt className="text-xs">
                        {s.description}
                        <span className="ml-1.5 text-[11px] text-muted-foreground">
                          ({s.scope === "canvas" ? "canvas" : "modeler"})
                        </span>
                      </dt>
                      <dd className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                        {s.keys.map((combo, i) => (
                          <Fragment key={i}>
                            {i > 0 && <span className="text-[11px] text-muted-foreground">or</span>}
                            <span className="inline-flex items-center gap-0.5">
                              {combo.map((key) => (
                                <kbd
                                  key={key}
                                  className="min-w-[1.5rem] rounded border bg-muted px-1.5 py-0.5 text-center font-mono text-[11px]"
                                >
                                  {formatKey(key, mac)}
                                </kbd>
                              ))}
                            </span>
                          </Fragment>
                        ))}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

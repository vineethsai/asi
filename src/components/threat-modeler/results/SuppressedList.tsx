/** "N suppressed (not applicable)" disclosure with Restore (P3-35). */
import { useId, useState } from "react";
import { Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getRule } from "../engine/catalog";
import { tm, useTM } from "../store";
import { Disclosure } from "./shared";

export function SuppressedList({
  labels,
  readOnly,
}: {
  labels: Map<string, string>;
  readOnly: boolean;
}) {
  const rules = useTM((s) => s.document.suppressedRules);
  const hidden = useTM((s) => s.analysis?.suppressed.length ?? 0);
  const [open, setOpen] = useState(false);
  const id = useId();
  if (!rules.length) return null;
  return (
    <div className="rounded-md border border-dashed px-2 py-1.5">
      <Disclosure open={open} onToggle={() => setOpen((v) => !v)} controls={id}>
        {rules.length} rule suppression{rules.length === 1 ? "" : "s"} (not applicable)
        {hidden ? ` · ${hidden} threat${hidden === 1 ? "" : "s"} hidden` : ""}
      </Disclosure>
      <ul id={id} hidden={!open} className="mt-1.5 space-y-1">
        {open &&
          rules.map((r, i) => {
            const target = r.componentKey
              ? r.componentKey
                  .split(/[>,]/)
                  .map((k) => labels.get(k) ?? k)
                  .join(" → ")
              : r.componentKind
                ? `every ${r.componentKind.replace(/-/g, " ")} component`
                : "the whole model";
            return (
              <li
                key={`${r.ruleId}-${r.componentKey ?? ""}-${r.componentKind ?? ""}-${i}`}
                className="flex items-start gap-2 text-[11px]"
              >
                <div className="min-w-0 flex-1">
                  <p>
                    <span className="font-mono font-semibold">{r.ruleId}</span>{" "}
                    {getRule(r.ruleId)?.title ?? ""}
                  </p>
                  <p className="text-muted-foreground">
                    For {target}
                    {r.reason ? ` — “${r.reason}”` : ""}
                  </p>
                </div>
                {!readOnly && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 text-xs"
                    onClick={() => tm().unsuppress(r)}
                    aria-label={`Restore ${r.ruleId} for ${target}`}
                  >
                    <Undo2 className="h-3.5 w-3.5" aria-hidden />
                    Restore
                  </Button>
                )}
              </li>
            );
          })}
      </ul>
    </div>
  );
}

export default SuppressedList;

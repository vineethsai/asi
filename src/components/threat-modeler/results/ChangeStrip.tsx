/** "What changed since the last run" strip (P3-34) from `analysis.changeSummary`. */
import { useId, useState } from "react";
import { getRule } from "../engine/catalog";
import type { ChangeSummary } from "../engine/analyze";
import type { GeneratedThreat } from "../types";
import { Disclosure, SevChip } from "./shared";

function describeId(id: string, labels: Map<string, string>): string {
  const [ruleId, key = ""] = id.split("::");
  const title = getRule(ruleId)?.title ?? ruleId;
  const comp = key
    .split("~>")[0]
    .split(/[>,]/)
    .map((k) => labels.get(k) ?? k)
    .join(" → ");
  return comp ? `${title} — ${comp}` : title;
}

export function ChangeStrip({
  change,
  threatsById,
  labels,
  onSelect,
}: {
  change: ChangeSummary | null;
  threatsById: Map<string, GeneratedThreat>;
  labels: Map<string, string>;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  if (!change) return null;
  const { added, resolved, severityChanged, scoreDelta } = change;
  if (!added.length && !resolved.length && !severityChanged.length && !scoreDelta) {
    return (
      <p
        className="rounded-md border bg-muted/30 px-2 py-1 text-[11px] text-muted-foreground"
        role="status"
      >
        No changes since the last run.
      </p>
    );
  }
  const parts: string[] = [];
  if (added.length) parts.push(`+${added.length} new`);
  if (resolved.length) parts.push(`−${resolved.length} resolved`);
  if (severityChanged.length) parts.push(`${severityChanged.length} severity changed`);
  if (scoreDelta)
    parts.push(`score ${scoreDelta > 0 ? "+" : "−"}${Math.abs(Math.round(scoreDelta))}`);
  const item = (tid: string) => {
    const t = threatsById.get(tid);
    return t ? (
      <button
        type="button"
        onClick={() => onSelect(tid)}
        className="flex w-full items-center gap-1.5 rounded px-1 py-0.5 text-left text-[11px] hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <SevChip band={t.severity} />
        <span className="truncate">{t.name}</span>
      </button>
    ) : (
      <span className="block px-1 py-0.5 text-[11px] text-muted-foreground line-through">
        {describeId(tid, labels)}
      </span>
    );
  };
  return (
    <div className="rounded-md border bg-primary/5 px-2 py-1.5" role="status" aria-live="polite">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium">
          Since last run: <span className="font-semibold">{parts.join(" · ")}</span>
        </p>
        <Disclosure open={open} onToggle={() => setOpen((v) => !v)} controls={id}>
          {open ? "Hide" : "Details"}
        </Disclosure>
      </div>
      <div id={id} hidden={!open} className="mt-1 space-y-1.5">
        {open && (
          <>
            {added.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold">New</p>
                {added.slice(0, 30).map((t) => (
                  <div key={t}>{item(t)}</div>
                ))}
              </div>
            )}
            {resolved.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold">Resolved</p>
                {resolved.slice(0, 30).map((t) => (
                  <div key={t}>{item(t)}</div>
                ))}
              </div>
            )}
            {severityChanged.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold">Severity changed</p>
                {severityChanged.slice(0, 30).map((c) => (
                  <div key={c.id} className="flex items-center gap-1">
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {c.from} → {c.to}
                    </span>
                    <div className="min-w-0 flex-1">{item(c.id)}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ChangeStrip;

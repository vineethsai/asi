/**
 * Threat status workflow (P3-36): status + justification (required for
 * accepted risk) + owner + due date + evidence link. Writes to the document's
 * threatStatuses via the store (undoable; re-scores the analysis in place).
 */
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { tm } from "../store";
import type { GeneratedThreat, ThreatStatus } from "../types";
import {
  STATUS_LABELS,
  STATUS_OPTIONS,
  draftToEntry,
  validateStatus,
  type StatusDraft,
} from "./helpers";

const field =
  "h-8 w-full rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50";

export function StatusEditor({
  threat,
  onDone,
  disabled,
}: {
  threat: GeneratedThreat;
  onDone?: () => void;
  disabled?: boolean;
}) {
  const uid = useId();
  const [d, setD] = useState<StatusDraft>({
    status: threat.status ?? "open",
    justification: threat.statusJustification ?? "",
    owner: threat.owner ?? "",
    due: threat.due ?? "",
    evidenceUrl: threat.evidenceUrl ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<StatusDraft>) => {
    setD((prev) => ({ ...prev, ...patch }));
    setError(null);
  };

  const save = () => {
    const err = validateStatus(d);
    if (err) {
      setError(err);
      return;
    }
    if (
      d.status === "open" &&
      !d.owner.trim() &&
      !d.due &&
      !d.evidenceUrl.trim() &&
      !d.justification.trim()
    )
      tm().setThreatStatus([threat.id], null);
    else tm().setThreatStatus([threat.id], draftToEntry(d));
    onDone?.();
  };

  const needsJustification = d.status === "accepted";

  return (
    <form
      className="space-y-2 rounded-md border bg-muted/30 p-2"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      aria-label={`Status of ${threat.name}`}
    >
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label htmlFor={`${uid}-status`} className="text-[11px] font-medium">
            Status
          </label>
          <select
            id={`${uid}-status`}
            className={field}
            value={d.status}
            disabled={disabled}
            onChange={(e) => set({ status: e.target.value as ThreatStatus })}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label htmlFor={`${uid}-owner`} className="text-[11px] font-medium">
            Owner
          </label>
          <input
            id={`${uid}-owner`}
            className={field}
            value={d.owner}
            disabled={disabled}
            placeholder="e.g. platform-sec"
            onChange={(e) => set({ owner: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor={`${uid}-due`} className="text-[11px] font-medium">
            Due
          </label>
          <input
            id={`${uid}-due`}
            type="date"
            className={field}
            value={d.due}
            disabled={disabled}
            onChange={(e) => set({ due: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor={`${uid}-evidence`} className="text-[11px] font-medium">
            Evidence link
          </label>
          <input
            id={`${uid}-evidence`}
            type="url"
            inputMode="url"
            className={field}
            value={d.evidenceUrl}
            disabled={disabled}
            placeholder="https://…"
            onChange={(e) => set({ evidenceUrl: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-1">
        <label htmlFor={`${uid}-just`} className="text-[11px] font-medium">
          Justification{needsJustification ? " (required for accepted risk)" : ""}
        </label>
        <textarea
          id={`${uid}-just`}
          rows={2}
          className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          value={d.justification}
          disabled={disabled}
          aria-required={needsJustification}
          aria-invalid={!!error && needsJustification && !d.justification.trim()}
          aria-describedby={error ? `${uid}-err` : undefined}
          onChange={(e) => set({ justification: e.target.value })}
        />
      </div>
      {error && (
        <p id={`${uid}-err`} role="alert" className="text-[11px] font-medium text-destructive">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        {onDone && (
          <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={onDone}>
            Cancel
          </Button>
        )}
        <Button type="submit" size="sm" className="h-7 text-xs" disabled={disabled}>
          Save status
        </Button>
      </div>
    </form>
  );
}

export default StatusEditor;

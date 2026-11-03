/** Bulk actions for the selected threats (P3-34): status change and CSV export. */
import { useId, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { tm } from "../store";
import type { GeneratedThreat, ThreatStatus } from "../types";
import { STATUS_LABELS, STATUS_OPTIONS } from "./helpers";

export function BulkBar({
  selected,
  onClear,
  readOnly,
}: {
  selected: GeneratedThreat[];
  onClear: () => void;
  readOnly: boolean;
}) {
  const uid = useId();
  const [status, setStatus] = useState<ThreatStatus>("mitigated");
  const [justification, setJustification] = useState("");
  const [error, setError] = useState<string | null>(null);
  if (!selected.length) return null;

  const apply = () => {
    if (status === "accepted" && !justification.trim()) {
      setError("Accepted risk needs a justification.");
      return;
    }
    tm().setThreatStatus(
      selected.map((t) => t.id),
      status === "open"
        ? null
        : { status, ...(justification.trim() ? { justification: justification.trim() } : {}) },
    );
    toast.success(
      `${selected.length} threat${selected.length === 1 ? "" : "s"} set to ${STATUS_LABELS[status]}`,
    );
    setJustification("");
    setError(null);
    onClear();
  };

  const exportCsv = async () => {
    const [{ buildThreatsCsv, edgeLabelMap }, { downloadBlob, exportFilename }] = await Promise.all(
      [import("../export/exportCSV"), import("../export/download")],
    );
    const doc = tm().document;
    downloadBlob(
      buildThreatsCsv(selected, doc.nodes, edgeLabelMap(doc)),
      exportFilename(`${doc.name}-selected`, "csv"),
      "text/csv;charset=utf-8",
    );
  };

  return (
    <div
      className="space-y-1.5 rounded-md border border-primary/40 bg-primary/5 p-2"
      role="region"
      aria-label="Bulk actions"
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-semibold">{selected.length} selected</span>
        {!readOnly && (
          <>
            <label htmlFor={`${uid}-status`} className="sr-only">
              New status for the selected threats
            </label>
            <select
              id={`${uid}-status`}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as ThreatStatus);
                setError(null);
              }}
              className="h-7 rounded-md border border-input bg-background px-1.5 text-[11px]"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <Button size="sm" className="h-7 text-xs" onClick={apply}>
              Apply
            </Button>
          </>
        )}
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={() => void exportCsv()}
        >
          <Download className="h-3.5 w-3.5" aria-hidden />
          CSV
        </Button>
        <Button variant="ghost" size="sm" className="ml-auto h-7 text-xs" onClick={onClear}>
          Clear selection
        </Button>
      </div>
      {!readOnly && (status === "accepted" || justification) && (
        <div>
          <label htmlFor={`${uid}-just`} className="text-[11px] font-medium">
            Justification{status === "accepted" ? " (required)" : ""}
          </label>
          <input
            id={`${uid}-just`}
            value={justification}
            onChange={(e) => {
              setJustification(e.target.value);
              setError(null);
            }}
            aria-invalid={!!error}
            className="mt-0.5 h-7 w-full rounded-md border border-input bg-background px-2 text-xs"
          />
        </div>
      )}
      {error && (
        <p role="alert" className="text-[11px] font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export default BulkBar;

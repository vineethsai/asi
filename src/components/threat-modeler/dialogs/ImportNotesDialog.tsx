import { useMemo } from "react";
import { AlertTriangle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ImportedNote } from "../parsers/threatDragon";
import { useTM } from "../store";

export interface ImportNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payload?: Record<string, unknown>;
}

/**
 * Threat Dragon import summary (P0-12 / P3-44): parser warnings, then the
 * threats Threat Dragon stored on each cell, kept as notes next to the
 * modeler's own analysis.
 */
export default function ImportNotesDialog({ open, onOpenChange, payload }: ImportNotesDialogProps) {
  const notes = useMemo(
    () => (Array.isArray(payload?.notes) ? (payload!.notes as ImportedNote[]) : []),
    [payload],
  );
  const warnings = Array.isArray(payload?.warnings) ? (payload!.warnings as string[]) : [];
  const name = typeof payload?.name === "string" ? payload.name : undefined;
  const nodes = useTM((s) => s.document.nodes);
  const edges = useTM((s) => s.document.edges);

  const groups = useMemo(() => {
    const label = (n: ImportedNote) => {
      if (n.nodeId) return nodes.find((x) => x.id === n.nodeId)?.data.label ?? n.nodeId;
      if (n.edgeId) {
        const e = edges.find((x) => x.id === n.edgeId);
        if (!e) return n.edgeId;
        const l = (id: string) => nodes.find((x) => x.id === id)?.data.label ?? id;
        return `${l(e.source)} → ${l(e.target)}${e.data?.label ? ` (${e.data.label})` : ""}`;
      }
      return `Cell ${n.cellId}`;
    };
    const map = new Map<string, { title: string; kind: string; notes: ImportedNote[] }>();
    for (const n of notes) {
      const key = n.nodeId ?? n.edgeId ?? n.cellId;
      if (!map.has(key))
        map.set(key, {
          title: label(n),
          kind: n.nodeId ? "Component" : n.edgeId ? "Data flow" : "Unmapped cell",
          notes: [],
        });
      map.get(key)!.notes.push(n);
    }
    return [...map.values()];
  }, [notes, nodes, edges]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" aria-hidden />
            Threat Dragon import{name ? `: ${name}` : ""}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {notes.length
              ? `${notes.length} threat${notes.length === 1 ? "" : "s"} recorded in Threat Dragon. They are kept as notes; run the analysis to get this modeler's findings.`
              : "No threats were recorded on the imported diagram."}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          {warnings.length > 0 && (
            <div
              role="status"
              className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs"
            >
              <p className="mb-1 flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                {warnings.length} warning{warnings.length === 1 ? "" : "s"}
              </p>
              <ul className="list-disc space-y-0.5 pl-5">
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {groups.map((g) => (
            <section key={g.title} className="rounded-md border">
              <header className="flex items-center justify-between gap-2 border-b bg-muted/40 px-3 py-1.5">
                <h3 className="truncate text-xs font-semibold">{g.title}</h3>
                <span className="shrink-0 text-[11px] text-muted-foreground">{g.kind}</span>
              </header>
              <ul className="divide-y">
                {g.notes.map((n, i) => (
                  <li key={`${n.cellId}-${i}`} className="space-y-1 px-3 py-2 text-xs">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium">{n.title || "Untitled threat"}</span>
                      {n.type && (
                        <span className="rounded border px-1.5 py-0.5 text-[11px]">{n.type}</span>
                      )}
                      {n.severity && (
                        <span className="rounded border px-1.5 py-0.5 text-[11px]">
                          Severity: {n.severity}
                        </span>
                      )}
                      {n.status && (
                        <span className="rounded border px-1.5 py-0.5 text-[11px]">
                          Status: {n.status}
                        </span>
                      )}
                    </div>
                    {n.description && <p className="text-muted-foreground">{n.description}</p>}
                    {n.mitigation && (
                      <p>
                        <span className="font-medium">Mitigation: </span>
                        <span className="text-muted-foreground">{n.mitigation}</span>
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <DialogFooter>
          <Button size="sm" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

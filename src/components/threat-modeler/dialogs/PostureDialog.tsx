import { useEffect, useMemo, useState } from "react";
import { ShieldQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { tm, useTM } from "../store";
import type { CanvasEdgeData, DataFlowMetadata } from "../types";

export interface PostureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payload?: Record<string, unknown>;
}

const AUTH_OPTIONS = ["None", "API Key", "OAuth2", "mTLS", "JWT", "Basic", "Session"] as const;
const CLASSIFICATIONS: DataFlowMetadata["dataClassification"][] = [
  "Public",
  "Internal",
  "Confidential",
  "Restricted",
];

type Draft = Pick<
  DataFlowMetadata,
  "encrypted" | "authentication" | "dataClassification" | "containsPII"
>;

/**
 * Posture prompt for imported flows (P0-12 / P3-44). Importers mark edges
 * `customMetadata.postureUnverified`; this dialog asks for authentication and
 * encryption instead of silently defaulting to "None", and clears the flag.
 */
export default function PostureDialog({ open, onOpenChange, payload }: PostureDialogProps) {
  const edgeIds = useMemo(
    () => (Array.isArray(payload?.edgeIds) ? (payload!.edgeIds as string[]) : []),
    [payload],
  );
  const nodes = useTM((s) => s.document.nodes);
  const allEdges = useTM((s) => s.document.edges);
  const readOnly = useTM((s) => s.persist === "readonly");
  const edges = useMemo(() => allEdges.filter((e) => edgeIds.includes(e.id)), [allEdges, edgeIds]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});

  // Fresh drafts from the current values every time the dialog opens.
  useEffect(() => {
    if (!open) return;
    const next: Record<string, Draft> = {};
    for (const e of tm().document.edges) {
      if (!edgeIds.includes(e.id)) continue;
      const d = (e.data ?? {}) as Partial<CanvasEdgeData>;
      next[e.id] = {
        encrypted: d.encrypted ?? false,
        authentication: d.authentication ?? "None",
        dataClassification: d.dataClassification ?? "Internal",
        containsPII: d.containsPII ?? false,
      };
    }
    setDrafts(next);
  }, [open, edgeIds]);

  const label = (id: string) => nodes.find((n) => n.id === id)?.data.label ?? id;
  const patch = (id: string, p: Partial<Draft>) =>
    setDrafts((d) => ({ ...d, [id]: { ...d[id], ...p } }));

  const confirm = () => {
    tm().commit(
      (doc) => ({
        ...doc,
        edges: doc.edges.map((e) => {
          const d = drafts[e.id];
          if (!d) return e;
          const meta = { ...(e.data?.customMetadata ?? {}) };
          delete meta.postureUnverified;
          return {
            ...e,
            data: { ...(e.data as CanvasEdgeData), ...d, customMetadata: meta },
          };
        }),
      }),
      "Confirm imported flow posture",
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-3xl flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldQuestion className="h-5 w-5" aria-hidden />
            Confirm the posture of imported flows
          </DialogTitle>
          <DialogDescription className="text-xs">
            The import could not tell how {edges.length} data flow
            {edges.length === 1 ? " is" : "s are"} protected. Authentication and encryption drive
            likelihood in the analysis, so confirm them now or decide later from the flow&apos;s
            property panel (flows stay marked “posture unverified” until you do).
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-auto rounded-md border">
          <table className="w-full text-xs">
            <caption className="sr-only">Imported data flows and their security posture</caption>
            <thead className="sticky top-0 z-10 border-b bg-background">
              <tr>
                <th scope="col" className="p-2 text-left font-semibold">
                  Flow
                </th>
                <th scope="col" className="p-2 text-left font-semibold">
                  Encrypted
                </th>
                <th scope="col" className="p-2 text-left font-semibold">
                  Authentication
                </th>
                <th scope="col" className="p-2 text-left font-semibold">
                  Classification
                </th>
                <th scope="col" className="p-2 text-left font-semibold">
                  PII
                </th>
              </tr>
            </thead>
            <tbody>
              {edges.map((e) => {
                const d = drafts[e.id];
                if (!d) return null;
                const flowName = `${label(e.source)} → ${label(e.target)}`;
                return (
                  <tr key={e.id} className="border-b last:border-0">
                    <th scope="row" className="p-2 text-left font-medium">
                      <span className="block">{flowName}</span>
                      {e.data?.label && (
                        <span className="block text-[11px] font-normal text-muted-foreground">
                          {e.data.label}
                        </span>
                      )}
                    </th>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={d.encrypted}
                          onCheckedChange={(v) => patch(e.id, { encrypted: v })}
                          aria-label={`Encrypted: ${flowName}`}
                          disabled={readOnly}
                        />
                        <span className="text-[11px] text-muted-foreground">
                          {d.encrypted ? "Yes" : "No"}
                        </span>
                      </div>
                    </td>
                    <td className="p-2">
                      <Select
                        value={d.authentication}
                        onValueChange={(v) => patch(e.id, { authentication: v })}
                        disabled={readOnly}
                      >
                        <SelectTrigger
                          className="h-7 w-32 text-xs"
                          aria-label={`Authentication: ${flowName}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            ...AUTH_OPTIONS,
                            ...(AUTH_OPTIONS.includes(
                              d.authentication as (typeof AUTH_OPTIONS)[number],
                            )
                              ? []
                              : [d.authentication]),
                          ].map((a) => (
                            <SelectItem key={a} value={a} className="text-xs">
                              {a}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-2">
                      <Select
                        value={d.dataClassification}
                        onValueChange={(v) =>
                          patch(e.id, {
                            dataClassification: v as DataFlowMetadata["dataClassification"],
                          })
                        }
                        disabled={readOnly}
                      >
                        <SelectTrigger
                          className="h-7 w-32 text-xs"
                          aria-label={`Classification: ${flowName}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CLASSIFICATIONS.map((c) => (
                            <SelectItem key={c} value={c} className="text-xs">
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-2">
                      <Checkbox
                        checked={d.containsPII}
                        onCheckedChange={(v) => patch(e.id, { containsPII: v === true })}
                        aria-label={`Carries PII: ${flowName}`}
                        disabled={readOnly}
                      />
                    </td>
                  </tr>
                );
              })}
              {edges.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-muted-foreground">
                    No unverified flows.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Decide later
          </Button>
          <Button size="sm" onClick={confirm} disabled={readOnly || edges.length === 0}>
            Confirm posture
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

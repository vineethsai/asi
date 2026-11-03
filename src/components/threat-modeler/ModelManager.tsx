import { useCallback, useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Clock,
  FolderOpen,
  GitBranch,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ModelDiff from "./dialogs/ModelDiff";
import { useCanvasActions } from "./hooks/useCanvasActions";
import {
  deleteModel,
  deleteVersion,
  readLibrary,
  saveModel,
  saveUserTemplate,
  type SavedModelEntry,
  type SavedVersion,
} from "./persistence";
import { tm, useTM } from "./store";

export interface ModelManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `{ mode: "save" | "load" | "diff" }` picks the initial tab. */
  payload?: Record<string, unknown>;
}

type Tab = "save" | "load" | "diff";

const when = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
};

/**
 * Saved models with versions (P3-23). "Save" updates the model in place (the
 * head version), "Save as version" appends a snapshot; Open restores any
 * version; Versions & diff compares two snapshots via the engine.
 */
export default function ModelManager({ open, onOpenChange, payload }: ModelManagerProps) {
  const actions = useCanvasActions();
  const docId = useTM((s) => s.document.id);
  const docName = useTM((s) => s.document.name);
  const docDescription = useTM((s) => s.document.description ?? "");
  const readOnly = useTM((s) => s.persist === "readonly");
  const nodeCount = useTM((s) => s.document.nodes.length);
  const [tab, setTab] = useState<Tab>("save");
  const [models, setModels] = useState<SavedModelEntry[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [versionLabel, setVersionLabel] = useState("");
  const [asTemplate, setAsTemplate] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const refresh = useCallback(() => setModels(readLibrary().models), []);

  useEffect(() => {
    if (!open) return;
    const mode = payload?.mode;
    setTab(mode === "load" || mode === "diff" ? mode : "save");
    setName(tm().document.name);
    setDescription(tm().document.description ?? "");
    setVersionLabel("");
    setAsTemplate(false);
    setExpanded(new Set([tm().document.id]));
    refresh();
  }, [open, payload, refresh]);

  const current = models.find((m) => m.id === docId);

  const save = (asVersion: boolean) => {
    const n = name.trim() || "Untitled model";
    if (n !== docName || description.trim() !== docDescription)
      tm().setDocumentMeta({ name: n, description: description.trim() || undefined });
    const doc = tm().document;
    const entry = saveModel(doc, {
      asVersion,
      ...(asVersion && versionLabel.trim() ? { label: versionLabel.trim() } : {}),
    });
    if (asTemplate) saveUserTemplate(doc, n, description.trim());
    refresh();
    setVersionLabel("");
    const head = entry.versions[entry.versions.length - 1];
    toast.success(
      asVersion
        ? `Saved "${n}" as version ${head.label}`
        : `Saved "${n}"${entry.versions.length > 1 ? ` (${head.label} updated)` : ""}`,
    );
  };

  const openVersion = (m: SavedModelEntry, v: SavedVersion) => {
    const isHead = m.versions[m.versions.length - 1]?.id === v.id;
    tm().replaceDocument(v.document, "Open saved model");
    onOpenChange(false);
    window.setTimeout(() => actions.fit(), 80);
    toast.success(`Opened "${m.name}" — ${v.label}`, {
      description: isHead
        ? undefined
        : "This is an older version. Save would overwrite the latest one; use Save as version to keep both.",
    });
  };

  const removeModel = (m: SavedModelEntry) => {
    if (
      !window.confirm(
        `Delete "${m.name}" and all ${m.versions.length} version(s)? This cannot be undone.`,
      )
    )
      return;
    deleteModel(m.id);
    refresh();
  };

  const removeVersion = (m: SavedModelEntry, v: SavedVersion) => {
    if (!window.confirm(`Delete ${v.label} of "${m.name}"?`)) return;
    deleteVersion(m.id, v.id);
    refresh();
  };

  const toggle = (id: string) =>
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[88vh] max-w-2xl flex-col">
        <DialogHeader>
          <DialogTitle>Models</DialogTitle>
          <DialogDescription className="text-xs">
            Saved in this browser. Save updates the model in place; Save as version keeps a snapshot
            you can reopen or compare.
          </DialogDescription>
        </DialogHeader>
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as Tab)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="save" className="gap-1 text-xs">
              <Save className="h-3.5 w-3.5" aria-hidden />
              Save
            </TabsTrigger>
            <TabsTrigger value="load" className="gap-1 text-xs">
              <FolderOpen className="h-3.5 w-3.5" aria-hidden />
              Open ({models.length})
            </TabsTrigger>
            <TabsTrigger value="diff" className="gap-1 text-xs">
              <GitBranch className="h-3.5 w-3.5" aria-hidden />
              Versions &amp; diff
            </TabsTrigger>
          </TabsList>

          <TabsContent value="save" className="min-h-0 flex-1 space-y-3 overflow-y-auto pt-2">
            {readOnly && (
              <p className="rounded-md border bg-muted/40 p-2 text-xs">
                Read-only shared model — make a copy before saving.
              </p>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="tm-mm-name" className="text-xs">
                Model name
              </Label>
              <Input
                id="tm-mm-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-8 text-sm"
                disabled={readOnly}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tm-mm-desc" className="text-xs">
                Description (optional)
              </Label>
              <Input
                id="tm-mm-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-8 text-sm"
                disabled={readOnly}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              {current
                ? `Saved model · ${current.versions.length} version${current.versions.length === 1 ? "" : "s"} · last saved ${when(current.updatedAt)}`
                : "Not saved yet."}{" "}
              {nodeCount} component{nodeCount === 1 ? "" : "s"} on the canvas.
            </p>
            <div className="flex items-center gap-2">
              <Checkbox
                id="tm-mm-template"
                checked={asTemplate}
                onCheckedChange={(v) => setAsTemplate(v === true)}
                disabled={readOnly}
              />
              <Label htmlFor="tm-mm-template" className="cursor-pointer text-xs">
                Also save as a reusable template (statuses and mitigations are not included)
              </Label>
            </div>
            <div className="flex flex-wrap items-end gap-2 border-t pt-3">
              <Button size="sm" onClick={() => save(false)} disabled={readOnly} className="gap-1">
                <Save className="h-3.5 w-3.5" aria-hidden />
                {current ? "Save (update in place)" : "Save"}
              </Button>
              <div className="ml-auto flex items-end gap-2">
                <div className="space-y-1">
                  <Label htmlFor="tm-mm-version" className="text-[11px]">
                    Version label (optional)
                  </Label>
                  <Input
                    id="tm-mm-version"
                    value={versionLabel}
                    onChange={(e) => setVersionLabel(e.target.value)}
                    placeholder={current ? `v${current.versions.length + 1}` : "v1"}
                    className="h-8 w-36 text-xs"
                    disabled={readOnly}
                  />
                </div>
                <Button size="sm" variant="outline" onClick={() => save(true)} disabled={readOnly}>
                  Save as version
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="load" className="min-h-0 flex-1 overflow-y-auto pt-2">
            {models.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">No saved models yet.</p>
            ) : (
              <ul className="space-y-2">
                {models.map((m) => {
                  const head = m.versions[m.versions.length - 1];
                  const isOpen = expanded.has(m.id);
                  return (
                    <li key={m.id} className="rounded-md border">
                      <div className="flex items-center gap-2 p-2">
                        <button
                          type="button"
                          onClick={() => toggle(m.id)}
                          aria-expanded={isOpen}
                          aria-controls={`tm-mm-v-${m.id}`}
                          className="rounded p-0.5 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label={`${isOpen ? "Hide" : "Show"} versions of ${m.name}`}
                        >
                          {isOpen ? (
                            <ChevronDown className="h-4 w-4" aria-hidden />
                          ) : (
                            <ChevronRight className="h-4 w-4" aria-hidden />
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {m.name}
                            {m.id === docId && (
                              <span className="ml-2 rounded border px-1 text-[11px] font-normal text-muted-foreground">
                                current
                              </span>
                            )}
                          </p>
                          <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Clock className="h-3 w-3" aria-hidden />
                            {when(m.updatedAt)} · {m.versions.length} version
                            {m.versions.length === 1 ? "" : "s"} · {head.document.nodes.length}{" "}
                            components
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => openVersion(m, head)}
                        >
                          Open
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => removeModel(m)}
                          aria-label={`Delete ${m.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" aria-hidden />
                        </Button>
                      </div>
                      {isOpen && (
                        <ul id={`tm-mm-v-${m.id}`} className="divide-y border-t">
                          {[...m.versions].reverse().map((v, i) => (
                            <li
                              key={v.id}
                              className="flex items-center gap-2 px-3 py-1.5 pl-9 text-xs"
                            >
                              <span className="font-medium">{v.label}</span>
                              {i === 0 && (
                                <span className="text-[11px] text-muted-foreground">(head)</span>
                              )}
                              <span className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground">
                                {when(v.savedAt)} · {v.document.nodes.length} components ·{" "}
                                {v.document.edges.length} flows
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 text-[11px]"
                                onClick={() => openVersion(m, v)}
                              >
                                Open
                              </Button>
                              {m.versions.length > 1 && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => removeVersion(m, v)}
                                  aria-label={`Delete ${v.label} of ${m.name}`}
                                >
                                  <Trash2 className="h-3 w-3 text-destructive" aria-hidden />
                                </Button>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="diff" className="min-h-0 flex-1 overflow-y-auto pt-2">
            <ModelDiff models={models} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

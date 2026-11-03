import { useEffect, useMemo, useState } from "react";
import { FilePlus2, LayoutTemplate, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCanvasActions } from "../hooks/useCanvasActions";
import { deleteUserTemplate, readLibrary, type UserTemplateEntry } from "../persistence";
import { useTM } from "../store";
import { ARCHITECTURE_TEMPLATES, instantiateTemplate } from "../templates";
import TemplateThumbnail from "./TemplateThumbnail";

export interface TemplatePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payload?: Record<string, unknown>;
}

const BUILT_INS = ARCHITECTURE_TEMPLATES.map((t) => {
  const { nodes, edges } = instantiateTemplate(t);
  return {
    id: t.id,
    name: t.name,
    description: t.description,
    nodes,
    edges,
    components: nodes.filter((n) => n.type !== "trustBoundary").length,
    boundaries: nodes.filter((n) => n.type === "trustBoundary").length,
  };
});

/** Template picker (P3-37): every built-in template with a thumbnail, plus user templates. */
export default function TemplatePicker({ open, onOpenChange }: TemplatePickerProps) {
  const actions = useCanvasActions();
  const hasContent = useTM((s) => s.document.nodes.length > 0);
  const readOnly = useTM((s) => s.persist === "readonly");
  const [userTemplates, setUserTemplates] = useState<UserTemplateEntry[]>([]);

  useEffect(() => {
    if (open) setUserTemplates(readLibrary().templates);
  }, [open]);

  const choose = (id: string) => {
    if (actions.loadTemplate(id)) onOpenChange(false);
  };

  const remove = (t: UserTemplateEntry) => {
    if (!window.confirm(`Delete the template "${t.name}"? This cannot be undone.`)) return;
    deleteUserTemplate(t.id);
    setUserTemplates(readLibrary().templates);
  };

  const userCards = useMemo(
    () =>
      userTemplates.map((t) => ({
        ...t,
        components: t.document.nodes.filter((n) => n.type !== "trustBoundary").length,
        flows: t.document.edges.length,
      })),
    [userTemplates],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-5xl flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5" aria-hidden />
            Start from a template
          </DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-1 text-xs">
            {hasContent ? (
              <>
                <Undo2 className="h-3.5 w-3.5" aria-hidden />
                Loading a template replaces the canvas — you can undo it.
              </>
            ) : (
              "Pick an architecture to model, then edit it to match your system."
            )}
          </DialogDescription>
        </DialogHeader>

        {readOnly ? (
          <p className="rounded-md border bg-muted/40 p-3 text-xs">
            This is a read-only shared model. Make a copy to load templates.
          </p>
        ) : (
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
            <ul
              className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
              aria-label="Built-in templates"
            >
              <li>
                <button
                  type="button"
                  onClick={() => {
                    actions.clear();
                    onOpenChange(false);
                  }}
                  className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-center text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <FilePlus2 className="h-6 w-6" aria-hidden />
                  <span className="text-sm font-semibold text-foreground">Blank canvas</span>
                  Start from scratch with the component palette.
                </button>
              </li>
              {BUILT_INS.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => choose(t.id)}
                    className="group flex h-full w-full flex-col overflow-hidden rounded-lg border text-left transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <TemplateThumbnail
                      nodes={t.nodes}
                      edges={t.edges}
                      title={`${t.name} layout`}
                      className="h-28 w-full border-b"
                    />
                    <span className="flex flex-1 flex-col gap-1 p-3">
                      <span className="text-sm font-semibold group-hover:text-primary">
                        {t.name}
                      </span>
                      <span className="line-clamp-3 text-xs text-muted-foreground">
                        {t.description}
                      </span>
                      <span className="mt-auto pt-1 text-[11px] text-muted-foreground">
                        {t.components} components · {t.edges.length} flows
                        {t.boundaries
                          ? ` · ${t.boundaries} trust boundar${t.boundaries === 1 ? "y" : "ies"}`
                          : ""}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <section aria-labelledby="tm-user-templates">
              <h3
                id="tm-user-templates"
                className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Your templates
              </h3>
              {userCards.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Save any model as a reusable template from Models → Save.
                </p>
              ) : (
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {userCards.map((t) => (
                    <li key={t.id} className="relative">
                      <button
                        type="button"
                        onClick={() => choose(t.id)}
                        className="group flex h-full w-full flex-col overflow-hidden rounded-lg border text-left transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <TemplateThumbnail
                          nodes={t.document.nodes}
                          edges={t.document.edges}
                          title={`${t.name} layout`}
                          className="h-24 w-full border-b"
                        />
                        <span className="flex flex-1 flex-col gap-1 p-3 pr-10">
                          <span className="text-sm font-semibold group-hover:text-primary">
                            {t.name}
                          </span>
                          {t.description && (
                            <span className="line-clamp-2 text-xs text-muted-foreground">
                              {t.description}
                            </span>
                          )}
                          <span className="mt-auto pt-1 text-[11px] text-muted-foreground">
                            {t.components} components · {t.flows} flows · saved{" "}
                            {new Date(t.createdAt).toLocaleDateString()}
                          </span>
                        </span>
                      </button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute bottom-2 right-2 h-7 w-7 p-0"
                        onClick={() => remove(t)}
                        aria-label={`Delete template ${t.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" aria-hidden />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

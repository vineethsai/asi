import { lazy, Suspense, type ComponentType } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCanvasActions } from "../hooks/useCanvasActions";
import { useImports, type PendingImport } from "../hooks/useImports";
import { saveModel } from "../persistence";
import { tm, useTM, type DialogName } from "../store";
import OnboardingOverlay from "../OnboardingOverlay";
import KeyboardShortcutsPanel from "../KeyboardShortcutsPanel";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payload?: Record<string, unknown>;
}

const TemplatePicker = lazy(() => import("./TemplatePicker"));
const ModelManager = lazy(() => import("../ModelManager"));
const CustomComponentDialog = lazy(() => import("../CustomComponentDialog"));
const PostureDialog = lazy(() => import("./PostureDialog"));
const ImportNotesDialog = lazy(() => import("./ImportNotesDialog"));
const ShareDialog = lazy(() => import("./ShareDialog"));
const AibomImportDialog = lazy(() => import("../AibomImportDialog"));

const SIMPLE: Partial<Record<DialogName, ComponentType<DialogProps>>> = {
  onboarding: OnboardingOverlay,
  shortcuts: KeyboardShortcutsPanel,
  templates: TemplatePicker,
  models: ModelManager,
  customComponent: CustomComponentDialog,
  posture: PostureDialog,
  share: ShareDialog,
};

/** Renders the one open modeler dialog (store `ui.dialog`). Must sit inside ReactFlowProvider. */
export default function DialogHost() {
  const dialog = useTM((s) => s.ui.dialog);
  const actions = useCanvasActions();
  const imports = useImports();
  if (!dialog) return null;
  const { name, payload } = dialog;
  const close = (open: boolean) => {
    if (!open && tm().ui.dialog === dialog) tm().closeDialog();
  };

  const Simple = SIMPLE[name];
  let body: React.ReactNode = null;
  if (Simple) body = <Simple open onOpenChange={close} payload={payload} />;
  else if (name === "notes")
    body = (
      <ImportNotesDialog
        open
        payload={payload}
        onOpenChange={(open) => {
          if (open) return;
          const pending = Array.isArray(payload?.postureEdgeIds)
            ? (payload!.postureEdgeIds as string[])
            : [];
          if (pending.length) tm().openDialog("posture", { edgeIds: pending });
          else tm().closeDialog();
        }}
      />
    );
  else if (name === "bomImport")
    body = (
      <AibomImportDialog
        open
        payload={payload}
        onOpenChange={close}
        onImport={(nodes, edges, info) => {
          tm().closeDialog();
          imports.importBomGraph(nodes, edges, info);
        }}
      />
    );
  else if (name === "clear")
    body = (
      <Confirm
        title="Clear the canvas?"
        description="This removes every component, data flow, status and suppression from the current model. Undo (Ctrl/⌘+Z) brings it back."
        confirm="Clear canvas"
        destructive
        onConfirm={() => {
          tm().closeDialog();
          actions.clear();
        }}
      />
    );
  else if (name === "importConfirm") {
    const pending = payload?.pending as PendingImport | undefined;
    body = (
      <Confirm
        title={`Replace the canvas with “${pending?.document.name ?? "the imported model"}”?`}
        description="The current model is replaced (undo brings it back). Save it first if you want to keep it in My models."
        confirm="Replace canvas"
        secondary={{
          label: "Save current first",
          run: () => {
            const doc = tm().document;
            if (tm().persist === "readonly") return;
            saveModel(doc);
            toast.success(`Saved "${doc.name}" to My models`);
          },
        }}
        onConfirm={() => {
          tm().closeDialog();
          if (pending) imports.apply(pending);
        }}
      />
    );
  }
  return <Suspense fallback={null}>{body}</Suspense>;
}

function Confirm({
  title,
  description,
  confirm,
  destructive,
  secondary,
  onConfirm,
}: {
  title: string;
  description: string;
  confirm: string;
  destructive?: boolean;
  secondary?: { label: string; run: () => void };
  onConfirm: () => void;
}) {
  return (
    <Dialog open onOpenChange={(open) => !open && tm().closeDialog()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => tm().closeDialog()}>
            Cancel
          </Button>
          {secondary && (
            <Button variant="outline" onClick={secondary.run}>
              {secondary.label}
            </Button>
          )}
          <Button variant={destructive ? "destructive" : "default"} onClick={onConfirm}>
            {confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

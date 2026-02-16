import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, FolderOpen, Trash2, Clock, FileText, Layout } from "lucide-react";

interface SavedModel {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  nodeCount: number;
  edgeCount: number;
  data: string;
}

export interface UserTemplate {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  nodeCount: number;
  edgeCount: number;
  data: string;
}

interface ModelManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "save" | "load";
  onSave: (name: string, description: string) => void;
  onLoad: (data: string) => void;
  currentModelData: string;
  nodeCount: number;
  edgeCount: number;
}

const STORAGE_KEY = "threat-modeler-saved-models";
const TEMPLATE_KEY = "threat-modeler-user-templates";

function getSavedModels(): SavedModel[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveModels(models: SavedModel[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(models));
}

// eslint-disable-next-line react-refresh/only-export-components
export function getUserTemplates(): UserTemplate[] {
  try {
    return JSON.parse(localStorage.getItem(TEMPLATE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveUserTemplates(templates: UserTemplate[]) {
  localStorage.setItem(TEMPLATE_KEY, JSON.stringify(templates));
}

export default function ModelManager({
  open,
  onOpenChange,
  mode,
  onSave,
  onLoad,
  currentModelData,
  nodeCount,
  edgeCount,
}: ModelManagerProps) {
  const [models, setModels] = useState<SavedModel[]>([]);
  const [userTemplates, setUserTemplates] = useState<UserTemplate[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);

  useEffect(() => {
    if (open) {
      setModels(getSavedModels());
      setUserTemplates(getUserTemplates());
    }
  }, [open]);

  const handleSave = () => {
    if (!name.trim()) return;
    const now = new Date().toISOString();
    const newModel: SavedModel = {
      id: `model-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      createdAt: now,
      updatedAt: now,
      nodeCount,
      edgeCount,
      data: currentModelData,
    };
    const updated = [...models, newModel];
    saveModels(updated);
    setModels(updated);

    if (saveAsTemplate) {
      const templateData = stripAnalysisFromData(currentModelData);
      const newTemplate: UserTemplate = {
        id: `user-template-${Date.now()}`,
        name: name.trim(),
        description: description.trim(),
        createdAt: now,
        nodeCount,
        edgeCount,
        data: templateData,
      };
      const updatedTemplates = [...userTemplates, newTemplate];
      saveUserTemplates(updatedTemplates);
      setUserTemplates(updatedTemplates);
    }

    onSave(name, description);
    onOpenChange(false);
    setName("");
    setDescription("");
    setSaveAsTemplate(false);
  };

  const handleLoad = (model: SavedModel) => {
    onLoad(model.data);
    onOpenChange(false);
  };

  const handleDelete = (id: string) => {
    const updated = models.filter((m) => m.id !== id);
    saveModels(updated);
    setModels(updated);
  };

  const handleDeleteTemplate = (id: string) => {
    const updated = userTemplates.filter((t) => t.id !== id);
    saveUserTemplates(updated);
    setUserTemplates(updated);
  };

  const handleLoadTemplate = (template: UserTemplate) => {
    onLoad(template.data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            {mode === "save" ? (
              <>
                <Save className="h-4 w-4" /> Save Model
              </>
            ) : (
              <>
                <FolderOpen className="h-4 w-4" /> Load Model
              </>
            )}
          </DialogTitle>
        </DialogHeader>
        {mode === "save" ? (
          <div className="space-y-3">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Model name"
              className="h-8 text-sm"
            />
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              className="h-8 text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {nodeCount} components, {edgeCount} data flows
            </p>
            <div className="flex items-center gap-2 pt-1 border-t">
              <Checkbox
                id="save-as-template"
                checked={saveAsTemplate}
                onCheckedChange={(v) => setSaveAsTemplate(v === true)}
              />
              <label
                htmlFor="save-as-template"
                className="text-xs cursor-pointer flex items-center gap-1"
              >
                <Layout className="h-3 w-3 text-muted-foreground" />
                Also save as reusable template
              </label>
            </div>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-1.5">
              {/* User Templates */}
              {userTemplates.length > 0 && (
                <>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                    Your Templates
                  </p>
                  {userTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="border rounded-md p-2.5 hover:bg-accent/50 transition-colors border-primary/20 bg-primary/5"
                    >
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => handleLoadTemplate(template)}
                          className="flex-1 text-left"
                        >
                          <div className="flex items-center gap-1.5">
                            <Layout className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="text-xs font-semibold">{template.name}</span>
                            <span className="text-[8px] px-1 py-0 rounded bg-primary/10 text-primary">
                              Template
                            </span>
                          </div>
                          {template.description && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {template.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1 text-[9px] text-muted-foreground">
                            <span>{template.nodeCount} nodes</span>
                            <span>{template.edgeCount} edges</span>
                          </div>
                        </button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 shrink-0"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="h-px bg-border my-2" />
                </>
              )}

              {/* Saved Models */}
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1">
                Saved Models
              </p>
              {models.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No saved models</p>
              )}
              {models.map((model) => (
                <div
                  key={model.id}
                  className="border rounded-md p-2.5 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <button onClick={() => handleLoad(model)} className="flex-1 text-left">
                      <div className="flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="text-xs font-semibold">{model.name}</span>
                      </div>
                      {model.description && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {model.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-[9px] text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-2.5 w-2.5" />
                          {new Date(model.updatedAt).toLocaleDateString()}
                        </span>
                        <span>{model.nodeCount} nodes</span>
                        <span>{model.edgeCount} edges</span>
                      </div>
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 shrink-0"
                      onClick={() => handleDelete(model.id)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {mode === "save" && (
            <Button size="sm" onClick={handleSave} disabled={!name.trim()}>
              Save
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function stripAnalysisFromData(jsonStr: string): string {
  try {
    const parsed = JSON.parse(jsonStr);
    if (parsed.nodes) {
      parsed.nodes = parsed.nodes.map((n: Record<string, unknown>) => ({
        ...n,
        data: {
          ...(n.data as Record<string, unknown>),
          threats: [],
          appliedMitigations: [],
          mitigationStatuses: {},
        },
      }));
    }
    if (parsed.edges) {
      parsed.edges = parsed.edges.map((e: Record<string, unknown>) => ({
        ...e,
        data: { ...(e.data as Record<string, unknown>), threats: [] },
      }));
    }
    delete parsed.analysisResult;
    return JSON.stringify(parsed);
  } catch {
    return jsonStr;
  }
}

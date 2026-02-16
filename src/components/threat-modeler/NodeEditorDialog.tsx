import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Plus } from "lucide-react";
import {
  type CanvasNode,
  type CanvasNodeData,
  type TrustLevel,
  type MaestroLayer,
  type ToolAccessMode,
  type ToolRiskTier,
  type PromptType,
  type DataSensitivity,
  MAESTRO_LAYER_LABELS,
  MAESTRO_LAYER_COLORS,
} from "./types";

interface NodeEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  node: CanvasNode | null;
  onSave: (nodeId: string, updates: Partial<CanvasNodeData>) => void;
}

const ALL_LAYERS: MaestroLayer[] = [1, 2, 3, 4, 5, 6, 7];
const TRUST_LEVELS: TrustLevel[] = ["trusted", "semi-trusted", "untrusted"];
const TOOL_ACCESS_MODES: { value: ToolAccessMode; label: string }[] = [
  { value: "read-only", label: "Read-Only" },
  { value: "read-write", label: "Read-Write" },
  { value: "write-only", label: "Write-Only" },
  { value: "execute", label: "Execute" },
  { value: "admin", label: "Admin" },
];
const TOOL_RISK_TIERS: { value: ToolRiskTier; label: string }[] = [
  { value: "benign", label: "Benign" },
  { value: "sensitive", label: "Sensitive" },
  { value: "destructive", label: "Destructive" },
  { value: "critical", label: "Critical" },
];
const PROMPT_TYPES: { value: PromptType; label: string }[] = [
  { value: "system", label: "System" },
  { value: "user", label: "User" },
  { value: "few-shot", label: "Few-Shot" },
  { value: "chain-of-thought", label: "Chain-of-Thought" },
  { value: "function-call", label: "Function Call" },
  { value: "multi-turn", label: "Multi-Turn" },
];
const DATA_SENSITIVITY_LEVELS: { value: DataSensitivity; label: string }[] = [
  { value: "none", label: "None" },
  { value: "internal", label: "Internal" },
  { value: "pii", label: "PII" },
  { value: "credentials", label: "Credentials" },
  { value: "regulated", label: "Regulated" },
];

export default function NodeEditorDialog({
  open,
  onOpenChange,
  node,
  onSave,
}: NodeEditorDialogProps) {
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [trustLevel, setTrustLevel] = useState<TrustLevel>("semi-trusted");
  const [selectedLayers, setSelectedLayers] = useState<Set<MaestroLayer>>(new Set());
  const [metadata, setMetadata] = useState<Record<string, string>>({});
  const [newMetaKey, setNewMetaKey] = useState("");
  const [newMetaValue, setNewMetaValue] = useState("");
  const [toolAccessMode, setToolAccessMode] = useState<ToolAccessMode | "">("");
  const [toolRiskTier, setToolRiskTier] = useState<ToolRiskTier | "">("");
  const [promptType, setPromptType] = useState<PromptType | "">("");
  const [dataSensitivity, setDataSensitivity] = useState<DataSensitivity | "">("");

  const nodeCategory = node?.data?.category;
  const showToolFields = nodeCategory === "kc5";
  const showPromptFields = nodeCategory === "kc3";
  const showSensitivityField =
    nodeCategory === "kc4" || nodeCategory === "kc5" || nodeCategory === "datastore";

  useEffect(() => {
    if (node?.data) {
      setLabel(node.data.label ?? "");
      setDescription(node.data.description ?? "");
      setTrustLevel(node.data.trustLevel ?? "semi-trusted");
      setSelectedLayers(new Set(node.data.maestroLayers ?? []));
      setMetadata({ ...(node.data.customMetadata ?? {}) });
      setToolAccessMode(node.data.toolAccessMode ?? "");
      setToolRiskTier(node.data.toolRiskTier ?? "");
      setPromptType(node.data.promptType ?? "");
      setDataSensitivity(node.data.dataSensitivity ?? "");
    }
  }, [node]);

  const toggleLayer = (layer: MaestroLayer) => {
    setSelectedLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layer)) next.delete(layer);
      else next.add(layer);
      return next;
    });
  };

  const addMetadata = () => {
    if (newMetaKey.trim()) {
      setMetadata((prev) => ({ ...prev, [newMetaKey.trim()]: newMetaValue }));
      setNewMetaKey("");
      setNewMetaValue("");
    }
  };

  const removeMetadata = (key: string) => {
    setMetadata((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSave = () => {
    if (!node) return;
    onSave(node.id, {
      label: label.trim() || node.data.label,
      description: description.trim() || undefined,
      trustLevel,
      maestroLayers: Array.from(selectedLayers).sort(),
      customMetadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      toolAccessMode: toolAccessMode || undefined,
      toolRiskTier: toolRiskTier || undefined,
      promptType: promptType || undefined,
      dataSensitivity: dataSensitivity || undefined,
    });
    onOpenChange(false);
  };

  if (!node) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">Edit Component Properties</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Label */}
          <div className="space-y-1">
            <Label className="text-xs">Label</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label className="text-xs">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-sm min-h-[60px] resize-none"
              placeholder="Optional description..."
            />
          </div>

          {/* Trust Level */}
          <div className="space-y-1">
            <Label className="text-xs">Trust Level</Label>
            <Select value={trustLevel} onValueChange={(v) => setTrustLevel(v as TrustLevel)}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRUST_LEVELS.map((level) => (
                  <SelectItem key={level} value={level} className="text-sm">
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* MAESTRO Layers */}
          <div className="space-y-1">
            <Label className="text-xs">MAESTRO Layers</Label>
            <div className="flex flex-wrap gap-1">
              {ALL_LAYERS.map((layer) => {
                const isSelected = selectedLayers.has(layer);
                return (
                  <label
                    key={layer}
                    className={`flex items-center gap-1 text-[10px] px-1.5 py-1 rounded cursor-pointer transition-all border ${
                      isSelected
                        ? "text-white font-semibold"
                        : "bg-muted text-muted-foreground hover:bg-accent"
                    }`}
                    style={
                      isSelected
                        ? {
                            backgroundColor: MAESTRO_LAYER_COLORS[layer],
                            borderColor: MAESTRO_LAYER_COLORS[layer],
                          }
                        : undefined
                    }
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleLayer(layer)}
                      className="h-3 w-3 border-white/50"
                    />
                    {MAESTRO_LAYER_LABELS[layer]}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Tool Classification (KC5) */}
          {showToolFields && (
            <>
              <div className="space-y-1">
                <Label className="text-xs">Tool Access Mode</Label>
                <Select
                  value={toolAccessMode}
                  onValueChange={(v) => setToolAccessMode(v as ToolAccessMode)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select access mode..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TOOL_ACCESS_MODES.map((m) => (
                      <SelectItem key={m.value} value={m.value} className="text-sm">
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tool Risk Tier</Label>
                <Select
                  value={toolRiskTier}
                  onValueChange={(v) => setToolRiskTier(v as ToolRiskTier)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select risk tier..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TOOL_RISK_TIERS.map((t) => (
                      <SelectItem key={t.value} value={t.value} className="text-sm">
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Prompt Classification (KC3) */}
          {showPromptFields && (
            <div className="space-y-1">
              <Label className="text-xs">Prompt Type</Label>
              <Select value={promptType} onValueChange={(v) => setPromptType(v as PromptType)}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select prompt type..." />
                </SelectTrigger>
                <SelectContent>
                  {PROMPT_TYPES.map((p) => (
                    <SelectItem key={p.value} value={p.value} className="text-sm">
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Data Sensitivity */}
          {showSensitivityField && (
            <div className="space-y-1">
              <Label className="text-xs">Data Sensitivity</Label>
              <Select
                value={dataSensitivity}
                onValueChange={(v) => setDataSensitivity(v as DataSensitivity)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select sensitivity..." />
                </SelectTrigger>
                <SelectContent>
                  {DATA_SENSITIVITY_LEVELS.map((d) => (
                    <SelectItem key={d.value} value={d.value} className="text-sm">
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Custom Metadata */}
          <div className="space-y-1">
            <Label className="text-xs">Custom Metadata</Label>
            {Object.entries(metadata).length > 0 && (
              <div className="space-y-0.5">
                {Object.entries(metadata).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center gap-1 text-[10px] bg-accent/30 rounded p-1"
                  >
                    <span className="font-semibold">{key}:</span>
                    <span className="flex-1 truncate">{value}</span>
                    <button
                      onClick={() => removeMetadata(key)}
                      className="text-destructive hover:bg-destructive/10 rounded p-0.5"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-1">
              <Input
                placeholder="Key"
                value={newMetaKey}
                onChange={(e) => setNewMetaKey(e.target.value)}
                className="h-6 text-[10px] flex-1"
              />
              <Input
                placeholder="Value"
                value={newMetaValue}
                onChange={(e) => setNewMetaValue(e.target.value)}
                className="h-6 text-[10px] flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={addMetadata}
                disabled={!newMetaKey.trim()}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

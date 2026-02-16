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

  useEffect(() => {
    if (node?.data) {
      setLabel(node.data.label ?? "");
      setDescription(node.data.description ?? "");
      setTrustLevel(node.data.trustLevel ?? "semi-trusted");
      setSelectedLayers(new Set(node.data.maestroLayers ?? []));
      setMetadata({ ...(node.data.customMetadata ?? {}) });
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

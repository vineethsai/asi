import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2 } from "lucide-react";
import {
  type CustomComponentDefinition,
  type CustomThreatDefinition,
  type TrustLevel,
  MaestroLayer,
  MAESTRO_LAYER_LABELS,
} from "./types";

interface CustomComponentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (component: CustomComponentDefinition) => void;
  editComponent?: CustomComponentDefinition;
}

function generateId() {
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const EMPTY_THREAT: CustomThreatDefinition = {
  id: "",
  name: "",
  description: "",
  severity: "medium",
  maestroLayer: MaestroLayer.AgentFrameworks,
  attackVectors: [],
  mitigations: [],
};

export default function CustomComponentDialog({
  open,
  onOpenChange,
  onSave,
  editComponent,
}: CustomComponentDialogProps) {
  const [name, setName] = useState(editComponent?.name ?? "");
  const [description, setDescription] = useState(editComponent?.description ?? "");
  const [trustLevel, setTrustLevel] = useState<TrustLevel>(
    editComponent?.trustLevel ?? "semi-trusted",
  );
  const [maestroLayers, setMaestroLayers] = useState<MaestroLayer[]>(
    editComponent?.maestroLayers ?? [],
  );
  const [color, setColor] = useState(editComponent?.color ?? "#6b7280");
  const [customThreats, setCustomThreats] = useState<CustomThreatDefinition[]>(
    editComponent?.customThreats ?? [],
  );

  const toggleLayer = (layer: MaestroLayer) => {
    setMaestroLayers((prev) =>
      prev.includes(layer) ? prev.filter((l) => l !== layer) : [...prev, layer],
    );
  };

  const addThreat = () => {
    setCustomThreats((prev) => [...prev, { ...EMPTY_THREAT, id: generateId() }]);
  };

  const removeThreat = (index: number) => {
    setCustomThreats((prev) => prev.filter((_, i) => i !== index));
  };

  const updateThreat = (
    index: number,
    field: keyof CustomThreatDefinition,
    value: string | string[] | number,
  ) => {
    setCustomThreats((prev) => prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const comp: CustomComponentDefinition = {
      id: editComponent?.id ?? generateId(),
      name: name.trim(),
      description: description.trim(),
      maestroLayers,
      category: "custom",
      trustLevel,
      icon: "box",
      color,
      associatedThreatIds: [],
      customThreats: customThreats.filter((t) => t.name.trim()),
      metadata: {},
    };
    onSave(comp);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>{editComponent ? "Edit" : "Create"} Custom Component</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Component name"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description"
                className="h-8 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Trust Level</Label>
                <Select value={trustLevel} onValueChange={(v) => setTrustLevel(v as TrustLevel)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="untrusted">Untrusted</SelectItem>
                    <SelectItem value="semi-trusted">Semi-Trusted</SelectItem>
                    <SelectItem value="trusted">Trusted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border"
                  />
                  <span className="text-xs text-muted-foreground">{color}</span>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">MAESTRO Layers</Label>
              <div className="flex flex-wrap gap-1.5">
                {Object.values(MaestroLayer)
                  .filter((v): v is MaestroLayer => typeof v === "number")
                  .map((layer) => (
                    <button
                      key={layer}
                      onClick={() => toggleLayer(layer)}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${maestroLayers.includes(layer) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-accent"}`}
                    >
                      {MAESTRO_LAYER_LABELS[layer]}
                    </button>
                  ))}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Custom Threats</Label>
                <Button variant="ghost" size="sm" onClick={addThreat} className="h-6 text-xs">
                  <Plus className="h-3 w-3 mr-1" />
                  Add Threat
                </Button>
              </div>
              {customThreats.map((threat, index) => (
                <div
                  key={threat.id || index}
                  className="border rounded-md p-2.5 space-y-2 bg-accent/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground font-medium">
                      Threat #{index + 1}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeThreat(index)}
                      className="h-5 w-5 p-0"
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                  <Input
                    value={threat.name}
                    onChange={(e) => updateThreat(index, "name", e.target.value)}
                    placeholder="Threat name"
                    className="h-7 text-xs"
                  />
                  <Input
                    value={threat.description}
                    onChange={(e) => updateThreat(index, "description", e.target.value)}
                    placeholder="Description"
                    className="h-7 text-xs"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={threat.severity}
                      onValueChange={(v) => updateThreat(index, "severity", v)}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={threat.maestroLayer?.toString()}
                      onValueChange={(v) => updateThreat(index, "maestroLayer", parseInt(v))}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder="Layer" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(MaestroLayer)
                          .filter((v): v is MaestroLayer => typeof v === "number")
                          .map((layer) => (
                            <SelectItem key={layer} value={layer.toString()}>
                              {MAESTRO_LAYER_LABELS[layer]}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    value={threat.mitigations?.join(", ") ?? ""}
                    onChange={(e) =>
                      updateThreat(
                        index,
                        "mitigations",
                        e.target.value
                          .split(",")
                          .map((s: string) => s.trim())
                          .filter(Boolean),
                      )
                    }
                    placeholder="Mitigations (comma-separated)"
                    className="h-7 text-xs"
                  />
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!name.trim()}>
            Save Component
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

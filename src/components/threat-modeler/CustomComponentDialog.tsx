import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Icon } from "@/lib/icons";
import { tm, useTM } from "./store";
import {
  MAESTRO_LAYER_NAMES,
  MaestroLayer,
  type CustomComponentDefinition,
  type CustomThreatDefinition,
  type TrustLevel,
} from "./types";

export interface CustomComponentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `{ editId }` edits an existing definition; otherwise a new one is created. */
  payload?: Record<string, unknown>;
}

const LAYERS = Object.values(MaestroLayer).filter((v): v is MaestroLayer => typeof v === "number");

const ICON_CHOICES = [
  "box",
  "bot",
  "brain",
  "network",
  "database",
  "wrench",
  "server",
  "cpu",
  "code",
  "globe",
  "shield",
  "key",
  "lock",
  "mail",
  "terminal",
  "activity",
  "user",
  "file-text",
] as const;

let seq = 0;
function generateId(prefix = "custom") {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}-${seq}`;
}

interface FormState {
  name: string;
  description: string;
  trustLevel: TrustLevel;
  maestroLayers: MaestroLayer[];
  color: string;
  icon: string;
  threats: CustomThreatDefinition[];
  /** Raw comma-separated mitigation text per threat id (parsed on save). */
  mitText: Record<string, string>;
}

function initialState(def?: CustomComponentDefinition): FormState {
  return {
    name: def?.name ?? "",
    description: def?.description ?? "",
    trustLevel: def?.trustLevel ?? "semi-trusted",
    maestroLayers: def ? [...def.maestroLayers] : [MaestroLayer.AgentFrameworks],
    color: def?.color ?? "#6b7280",
    icon: def?.icon || "box",
    threats: def ? def.customThreats.map((t) => ({ ...t })) : [],
    mitText: Object.fromEntries(
      (def?.customThreats ?? []).map((t) => [t.id, t.mitigations.join(", ")]),
    ),
  };
}

const EMPTY_THREAT = (): CustomThreatDefinition => ({
  id: generateId("ct"),
  name: "",
  description: "",
  severity: "medium",
  maestroLayer: MaestroLayer.AgentFrameworks,
  attackVectors: [],
  mitigations: [],
});

/** Custom component authoring (create / edit). Form state resets on every open. */
export default function CustomComponentDialog({
  open,
  onOpenChange,
  payload,
}: CustomComponentDialogProps) {
  const editId = typeof payload?.editId === "string" ? payload.editId : undefined;
  const custom = useTM((s) => s.document.customComponents);
  const readOnly = useTM((s) => s.persist === "readonly");
  const editing = useMemo(() => custom.find((c) => c.id === editId), [custom, editId]);
  const [form, setForm] = useState<FormState>(() => initialState(editing));

  // Reset whenever the dialog opens (or switches to another component).
  useEffect(() => {
    if (open) setForm(initialState(editing));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset on open / target change only
  }, [open, editId]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const toggleLayer = (layer: MaestroLayer) =>
    set(
      "maestroLayers",
      form.maestroLayers.includes(layer)
        ? form.maestroLayers.filter((l) => l !== layer)
        : [...form.maestroLayers, layer].sort(),
    );
  const updateThreat = (i: number, patch: Partial<CustomThreatDefinition>) =>
    set(
      "threats",
      form.threats.map((t, j) => (j === i ? { ...t, ...patch } : t)),
    );

  const save = () => {
    const name = form.name.trim();
    if (!name || readOnly) return;
    const def: CustomComponentDefinition = {
      id: editing?.id ?? generateId(),
      name,
      description: form.description.trim(),
      maestroLayers: form.maestroLayers.length
        ? form.maestroLayers
        : [MaestroLayer.AgentFrameworks],
      category: "custom",
      trustLevel: form.trustLevel,
      icon: form.icon,
      color: form.color,
      associatedThreatIds: editing?.associatedThreatIds ?? [],
      customThreats: form.threats
        .filter((t) => t.name.trim())
        .map((t) => ({
          ...t,
          name: t.name.trim(),
          description: t.description.trim(),
          mitigations: (form.mitText[t.id] ?? "")
            .split(",")
            .map((m) => m.trim())
            .filter(Boolean),
        })),
      metadata: editing?.metadata ?? {},
    };
    const oldThreatIds = new Set(editing?.customThreats.map((t) => t.id) ?? []);
    const newThreatIds = def.customThreats.map((t) => t.id);
    tm().commit((doc) => {
      const exists = doc.customComponents.some((c) => c.id === def.id);
      const customComponents = exists
        ? doc.customComponents.map((c) => (c.id === def.id ? def : c))
        : [...doc.customComponents, def];
      if (!editing) return { ...doc, customComponents };
      // Conservative node sync: only nodes created from this definition.
      const uses = (d: (typeof doc.nodes)[number]["data"]) =>
        d.isCustom &&
        ((d.customThreatIds ?? []).some((id) => oldThreatIds.has(id)) ||
          (d.label === editing.name && (d.customThreatIds ?? []).length === oldThreatIds.size));
      const nodes = doc.nodes.map((n) =>
        n.data && uses(n.data)
          ? {
              ...n,
              data: {
                ...n.data,
                label: n.data.label === editing.name ? def.name : n.data.label,
                color: def.color,
                icon: def.icon,
                customThreatIds: newThreatIds,
              },
            }
          : n,
      );
      return { ...doc, customComponents, nodes };
    }, "Save custom component");
    setForm(initialState());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[88vh] max-w-xl flex-col">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit" : "Create"} custom component</DialogTitle>
          <DialogDescription className="text-xs">
            Custom components appear in the palette under “Custom”; their threats are added to every
            node created from them.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          <div className="space-y-1.5">
            <Label htmlFor="tm-cc-name" className="text-xs">
              Name
            </Label>
            <Input
              id="tm-cc-name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Feature store"
              className="h-8 text-sm"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tm-cc-desc" className="text-xs">
              Description
            </Label>
            <Input
              id="tm-cc-desc"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="One line: what it does and why it matters"
              className="h-8 text-sm"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="tm-cc-trust" className="text-xs">
                Trust level
              </Label>
              <Select
                value={form.trustLevel}
                onValueChange={(v) => set("trustLevel", v as TrustLevel)}
              >
                <SelectTrigger id="tm-cc-trust" className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="untrusted">Untrusted</SelectItem>
                  <SelectItem value="semi-trusted">Semi-trusted</SelectItem>
                  <SelectItem value="trusted">Trusted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tm-cc-icon" className="text-xs">
                Icon
              </Label>
              <Select value={form.icon} onValueChange={(v) => set("icon", v)}>
                <SelectTrigger id="tm-cc-icon" className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICON_CHOICES.map((k) => (
                    <SelectItem key={k} value={k} className="text-xs">
                      <span className="inline-flex items-center gap-2">
                        <Icon name={k} className="h-3.5 w-3.5" />
                        {k}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tm-cc-color" className="text-xs">
                Colour
              </Label>
              <div className="flex items-center gap-2">
                <input
                  id="tm-cc-color"
                  type="color"
                  value={form.color}
                  onChange={(e) => set("color", e.target.value)}
                  className="h-8 w-10 cursor-pointer rounded border bg-transparent"
                />
                <span className="font-mono text-[11px] text-muted-foreground">{form.color}</span>
              </div>
            </div>
          </div>
          <fieldset className="space-y-1.5">
            <legend className="text-xs font-medium">MAESTRO layers</legend>
            <div className="flex flex-wrap gap-1.5">
              {LAYERS.map((layer) => {
                const on = form.maestroLayers.includes(layer);
                return (
                  <button
                    key={layer}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleLayer(layer)}
                    className={`rounded-full border px-2 py-0.5 text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${on ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent"}`}
                  >
                    L{layer} {MAESTRO_LAYER_NAMES[layer]}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <section className="space-y-2" aria-labelledby="tm-cc-threats">
            <div className="flex items-center justify-between">
              <h3 id="tm-cc-threats" className="text-xs font-medium">
                Custom threats ({form.threats.length})
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => set("threats", [...form.threats, EMPTY_THREAT()])}
                className="h-7 text-xs"
              >
                <Plus className="mr-1 h-3 w-3" aria-hidden />
                Add threat
              </Button>
            </div>
            {form.threats.map((t, i) => (
              <div key={t.id} className="space-y-2 rounded-md border bg-accent/30 p-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Threat {i + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      set(
                        "threats",
                        form.threats.filter((_, j) => j !== i),
                      )
                    }
                    className="h-6 w-6 p-0"
                    aria-label={`Remove threat ${i + 1}`}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" aria-hidden />
                  </Button>
                </div>
                <Input
                  value={t.name}
                  onChange={(e) => updateThreat(i, { name: e.target.value })}
                  placeholder="Threat name"
                  aria-label={`Threat ${i + 1} name`}
                  className="h-7 text-xs"
                />
                <Input
                  value={t.description}
                  onChange={(e) => updateThreat(i, { description: e.target.value })}
                  placeholder="Description"
                  aria-label={`Threat ${i + 1} description`}
                  className="h-7 text-xs"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={t.severity}
                    onValueChange={(v) =>
                      updateThreat(i, { severity: v as CustomThreatDefinition["severity"] })
                    }
                  >
                    <SelectTrigger className="h-7 text-xs" aria-label={`Threat ${i + 1} severity`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={String(t.maestroLayer)}
                    onValueChange={(v) =>
                      updateThreat(i, { maestroLayer: Number(v) as MaestroLayer })
                    }
                  >
                    <SelectTrigger
                      className="h-7 text-xs"
                      aria-label={`Threat ${i + 1} MAESTRO layer`}
                    >
                      <SelectValue placeholder="Layer" />
                    </SelectTrigger>
                    <SelectContent>
                      {LAYERS.map((layer) => (
                        <SelectItem key={layer} value={String(layer)} className="text-xs">
                          L{layer} {MAESTRO_LAYER_NAMES[layer]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  value={form.mitText[t.id] ?? ""}
                  onChange={(e) => set("mitText", { ...form.mitText, [t.id]: e.target.value })}
                  placeholder="Mitigations (comma-separated names or MIT-… ids)"
                  aria-label={`Threat ${i + 1} mitigations`}
                  className="h-7 text-xs"
                />
              </div>
            ))}
          </section>
        </div>
        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" size="sm" onClick={save} disabled={!form.name.trim() || readOnly}>
            {editing ? "Save changes" : "Create component"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

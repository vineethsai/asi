import { useState, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  X,
  Edit2,
  ShieldAlert,
  AlertTriangle,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
  Ban,
  CircleDot,
} from "lucide-react";
import {
  type CanvasNode,
  type CanvasEdge,
  type GeneratedThreat,
  type MitigationStatusValue,
  MAESTRO_LAYER_LABELS,
  MAESTRO_LAYER_COLORS,
} from "./types";
import { buildNodeMitigationCatalog, type MitigationItem } from "./engine/mitigationCatalog";

interface NodePropertiesPanelProps {
  selectedNode?: CanvasNode | null;
  selectedEdge?: CanvasEdge | null;
  onClose: () => void;
  onEditEdge?: (edgeId: string) => void;
  allThreats?: GeneratedThreat[];
  onToggleMitigation?: (nodeId: string, mitigationId: string, applied: boolean) => void;
  onMitigationStatusChange?: (
    nodeId: string,
    mitigationId: string,
    status: MitigationStatusValue,
    justification?: string,
  ) => void;
}

const SEVERITY_COLORS = {
  high: "text-red-500",
  medium: "text-yellow-500",
  low: "text-blue-500",
};

const STATUS_CONFIG: Record<
  MitigationStatusValue,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  "not-started": {
    label: "Not Started",
    icon: CircleDot,
    color: "text-muted-foreground",
    bg: "bg-muted",
  },
  "in-progress": {
    label: "In Progress",
    icon: Clock,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  implemented: {
    label: "Implemented",
    icon: CheckCircle2,
    color: "text-green-500",
    bg: "bg-green-500/10",
  },
  "accepted-risk": {
    label: "Accepted Risk",
    icon: Ban,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
  },
};

export default function NodePropertiesPanel({
  selectedNode,
  selectedEdge,
  onClose,
  onEditEdge,
  allThreats,
  onToggleMitigation: _onToggleMitigation,
  onMitigationStatusChange,
}: NodePropertiesPanelProps) {
  void _onToggleMitigation;
  const [mitigationsExpanded, setMitigationsExpanded] = useState(true);
  const [threatsExpanded, setThreatsExpanded] = useState(true);
  const [editingJustification, setEditingJustification] = useState<string | null>(null);
  const [justificationText, setJustificationText] = useState("");

  const catalog = useMemo(() => {
    if (!selectedNode?.data || !allThreats) return null;
    return buildNodeMitigationCatalog(selectedNode.id, selectedNode.data.label, allThreats);
  }, [selectedNode, allThreats]);

  const statusMap = useMemo(() => {
    return selectedNode?.data?.mitigationStatuses ?? {};
  }, [selectedNode?.data?.mitigationStatuses]);

  const statusCounts = useMemo(() => {
    const counts = { implemented: 0, inProgress: 0, acceptedRisk: 0, notStarted: 0 };
    if (!catalog) return counts;
    for (const m of catalog.mitigations) {
      const s = statusMap[m.id]?.status ?? "not-started";
      if (s === "implemented") counts.implemented++;
      else if (s === "in-progress") counts.inProgress++;
      else if (s === "accepted-risk") counts.acceptedRisk++;
      else counts.notStarted++;
    }
    return counts;
  }, [catalog, statusMap]);

  const groupedMitigations = useMemo(() => {
    if (!catalog) return new Map<string, MitigationItem[]>();
    const groups = new Map<string, MitigationItem[]>();
    for (const m of catalog.mitigations) {
      const cat = m.category;
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat)!.push(m);
    }
    return groups;
  }, [catalog]);

  if (!selectedNode && !selectedEdge) return null;

  if (selectedEdge) {
    const data = selectedEdge.data;
    return (
      <div className="w-72 border-l bg-background/95 flex flex-col h-full">
        <div className="p-2 border-b flex items-center justify-between">
          <h3 className="text-xs font-bold">Edge Properties</h3>
          <div className="flex gap-1">
            {onEditEdge && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => onEditEdge(selectedEdge.id!)}
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            )}
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onClose}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <ScrollArea className="flex-1 p-2">
          <div className="space-y-2 text-xs">
            <div>
              <span className="font-semibold">Label:</span> {data?.label ?? "Data Flow"}
            </div>
            <div>
              <span className="font-semibold">Protocol:</span> {data?.protocol ?? "HTTPS"}
            </div>
            <div>
              <span className="font-semibold">Encrypted:</span> {data?.encrypted ? "Yes" : "No"}
            </div>
            <div>
              <span className="font-semibold">Auth:</span> {data?.authentication ?? "None"}
            </div>
            <div>
              <span className="font-semibold">Classification:</span>{" "}
              {data?.dataClassification ?? "Internal"}
            </div>
            <div>
              <span className="font-semibold">PII:</span> {data?.containsPII ? "Yes" : "No"}
            </div>
            {data?.threats && data.threats.length > 0 && (
              <div className="space-y-1 pt-1 border-t">
                <p className="font-semibold flex items-center gap-1">
                  <ShieldAlert className="h-3 w-3 text-red-500" />
                  Threats ({data.threats.length})
                </p>
                {data.threats.map((t, i) => (
                  <div key={i} className="text-[10px] p-1.5 rounded border bg-accent/30">
                    <span className={`font-semibold ${SEVERITY_COLORS[t.severity] ?? ""}`}>
                      [{t.severity}]
                    </span>{" "}
                    {t.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }

  if (selectedNode) {
    const data = selectedNode.data;
    const directThreats = data?.threats?.filter((t) => !t.inherited) ?? [];
    const inheritedThreats = data?.threats?.filter((t) => t.inherited) ?? [];
    const totalMitigations = catalog?.mitigations.length ?? 0;

    const progressPct =
      totalMitigations > 0
        ? Math.round(
            ((statusCounts.implemented + statusCounts.acceptedRisk) / totalMitigations) * 100,
          )
        : 0;

    const handleStatusChange = (mitigationId: string, newStatus: MitigationStatusValue) => {
      if (newStatus === "accepted-risk") {
        setEditingJustification(mitigationId);
        setJustificationText(statusMap[mitigationId]?.justification ?? "");
      } else {
        setEditingJustification(null);
        onMitigationStatusChange?.(selectedNode.id, mitigationId, newStatus);
      }
    };

    const handleSaveJustification = (mitigationId: string) => {
      onMitigationStatusChange?.(selectedNode.id, mitigationId, "accepted-risk", justificationText);
      setEditingJustification(null);
    };

    return (
      <div className="w-72 border-l bg-background/95 flex flex-col h-full">
        <div className="p-2 border-b flex items-center justify-between">
          <h3 className="text-xs font-bold truncate">{data?.label ?? "Node"}</h3>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onClose}>
            <X className="h-3 w-3" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2 text-xs">
            <div>
              <span className="font-semibold">Category:</span> {data?.category}
            </div>
            <div>
              <span className="font-semibold">Trust:</span> {data?.trustLevel}
            </div>
            {data?.description && (
              <div>
                <span className="font-semibold">Description:</span> {data.description}
              </div>
            )}
            {data?.maestroLayers && data.maestroLayers.length > 0 && (
              <div className="space-y-1">
                <span className="font-semibold">MAESTRO Layers:</span>
                <div className="flex flex-wrap gap-0.5">
                  {data.maestroLayers.map((layer) => (
                    <span
                      key={layer}
                      className="text-[8px] px-1 py-0.5 rounded text-white font-medium"
                      style={{ backgroundColor: MAESTRO_LAYER_COLORS[layer] }}
                    >
                      {MAESTRO_LAYER_LABELS[layer]}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Mitigations / Controls section */}
            {catalog && catalog.mitigations.length > 0 && (
              <div className="pt-1 border-t">
                <button
                  onClick={() => setMitigationsExpanded(!mitigationsExpanded)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <p className="font-semibold flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-green-500" />
                    Controls / Mitigations
                  </p>
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${statusCounts.implemented > 0 || statusCounts.acceptedRisk > 0 ? "bg-green-500/20 text-green-600" : "bg-muted text-muted-foreground"}`}
                    >
                      {statusCounts.implemented + statusCounts.acceptedRisk}/{totalMitigations}
                    </span>
                    {mitigationsExpanded ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </div>
                </button>

                {/* Progress bar */}
                <div className="mt-1.5 mb-1 space-y-0.5">
                  <Progress value={progressPct} className="h-1.5" />
                  <div className="flex justify-between text-[8px] text-muted-foreground">
                    <span>{statusCounts.implemented} implemented</span>
                    <span>{statusCounts.inProgress} in progress</span>
                    <span>{statusCounts.acceptedRisk} accepted</span>
                  </div>
                </div>

                {mitigationsExpanded && (
                  <div className="mt-1.5 space-y-2">
                    {Array.from(groupedMitigations.entries()).map(([category, items]) => (
                      <div key={category}>
                        <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                          {category}
                        </p>
                        <div className="space-y-1">
                          {items.map((m) => {
                            const currentStatus = statusMap[m.id]?.status ?? "not-started";
                            const cfg = STATUS_CONFIG[currentStatus];
                            const StatusIcon = cfg.icon;
                            return (
                              <div
                                key={m.id}
                                className={`p-1.5 rounded border transition-all ${cfg.bg}`}
                              >
                                <div className="flex items-start gap-1.5">
                                  <StatusIcon
                                    className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${cfg.color}`}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <span
                                      className={`text-[10px] leading-tight block ${currentStatus === "implemented" ? "line-through opacity-70" : ""}`}
                                    >
                                      {m.name}
                                    </span>
                                    <span className="text-[8px] text-muted-foreground">
                                      Addresses {m.threatsAddressed.length} threat
                                      {m.threatsAddressed.length !== 1 ? "s" : ""}
                                    </span>
                                    <div className="mt-1">
                                      <Select
                                        value={currentStatus}
                                        onValueChange={(v) =>
                                          handleStatusChange(m.id, v as MitigationStatusValue)
                                        }
                                      >
                                        <SelectTrigger className="h-5 text-[9px] w-full">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="not-started" className="text-[10px]">
                                            Not Started
                                          </SelectItem>
                                          <SelectItem value="in-progress" className="text-[10px]">
                                            In Progress
                                          </SelectItem>
                                          <SelectItem value="implemented" className="text-[10px]">
                                            Implemented
                                          </SelectItem>
                                          <SelectItem value="accepted-risk" className="text-[10px]">
                                            Accepted Risk
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    {editingJustification === m.id && (
                                      <div className="mt-1 space-y-1">
                                        <Input
                                          placeholder="Justification for accepting risk..."
                                          value={justificationText}
                                          onChange={(e) => setJustificationText(e.target.value)}
                                          className="h-6 text-[9px]"
                                        />
                                        <Button
                                          size="sm"
                                          className="h-5 text-[9px] w-full"
                                          onClick={() => handleSaveJustification(m.id)}
                                        >
                                          Save
                                        </Button>
                                      </div>
                                    )}
                                    {currentStatus === "accepted-risk" &&
                                      statusMap[m.id]?.justification &&
                                      editingJustification !== m.id && (
                                        <p className="text-[8px] text-orange-500 mt-0.5 italic">
                                          Reason: {statusMap[m.id].justification}
                                        </p>
                                      )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Threats section */}
            {(directThreats.length > 0 || inheritedThreats.length > 0) && (
              <div className="pt-1 border-t">
                <button
                  onClick={() => setThreatsExpanded(!threatsExpanded)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <p className="font-semibold flex items-center gap-1">
                    <ShieldAlert className="h-3 w-3 text-red-500" />
                    Threats ({directThreats.length + inheritedThreats.length})
                  </p>
                  {threatsExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </button>

                {threatsExpanded && (
                  <div className="mt-1 space-y-1">
                    {directThreats.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[9px] font-semibold text-muted-foreground">
                          Direct ({directThreats.length})
                        </p>
                        {directThreats.map((t, i) => (
                          <div key={i} className="text-[10px] p-1.5 rounded border bg-accent/30">
                            <span className={`font-semibold ${SEVERITY_COLORS[t.severity] ?? ""}`}>
                              [{t.severity}]
                            </span>{" "}
                            {t.name}
                          </div>
                        ))}
                      </div>
                    )}
                    {inheritedThreats.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[9px] font-semibold text-muted-foreground flex items-center gap-1">
                          <AlertTriangle className="h-2.5 w-2.5 text-orange-500" />
                          Inherited ({inheritedThreats.length})
                        </p>
                        {inheritedThreats.map((t, i) => (
                          <div
                            key={i}
                            className="text-[10px] p-1.5 rounded border border-dashed bg-orange-500/5"
                          >
                            <span className={`font-semibold ${SEVERITY_COLORS[t.severity] ?? ""}`}>
                              [{t.severity}]
                            </span>{" "}
                            {t.name}
                            {t.source && (
                              <p className="text-muted-foreground mt-0.5">from: {t.source}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }
  return null;
}

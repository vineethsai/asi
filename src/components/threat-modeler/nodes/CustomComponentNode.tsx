import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { type CanvasNodeData, MAESTRO_LAYER_LABELS, MAESTRO_LAYER_COLORS } from "../types";
import {
  Box,
  Brain,
  GitBranch,
  Lightbulb,
  Database,
  Wrench,
  Server,
  Cpu,
  Settings,
  Code,
  Globe,
  HardDrive,
  Network,
  Shield,
  FileText,
  FileSearch,
  Terminal,
  Mail,
  CreditCard,
  Eye,
  Pencil,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  brain: Brain,
  "git-branch": GitBranch,
  lightbulb: Lightbulb,
  database: Database,
  wrench: Wrench,
  server: Server,
  cpu: Cpu,
  box: Box,
  settings: Settings,
  code: Code,
  globe: Globe,
  "hard-drive": HardDrive,
  network: Network,
  shield: Shield,
  "file-text": FileText,
  "file-search": FileSearch,
  terminal: Terminal,
  mail: Mail,
  "credit-card": CreditCard,
  eye: Eye,
  pencil: Pencil,
};

function CustomComponentNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as CanvasNodeData;
  const threatCount = nodeData.threats?.length ?? 0;
  const IconComp = ICON_MAP[nodeData.icon ?? "box"] ?? Box;
  const nodeColor = nodeData.color ?? "#6b7280";

  return (
    <div
      role="group"
      aria-label={`${nodeData.label} - custom component`}
      className={`relative rounded-lg border-2 border-dashed p-3 min-w-[160px] max-w-[220px] shadow-sm transition-all bg-slate-500/10 ${selected ? "ring-2 ring-primary border-primary" : "border-slate-500/40"}`}
    >
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground !w-2 !h-2" />
      <Handle type="target" position={Position.Left} className="!bg-muted-foreground !w-2 !h-2" />
      <div className="flex items-start gap-2">
        <div className="p-1.5 rounded-md bg-background/60 shrink-0">
          <IconComp className="h-4 w-4" style={{ color: nodeColor }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <p className="text-xs font-semibold leading-tight truncate">{nodeData.label}</p>
            <span className="text-[8px] px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium shrink-0">
              Custom
            </span>
          </div>
          {nodeData.description && (
            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
              {nodeData.description}
            </p>
          )}
        </div>
      </div>
      {nodeData.maestroLayers && nodeData.maestroLayers.length > 0 && (
        <div className="flex flex-wrap gap-0.5 mt-1.5">
          {nodeData.maestroLayers.map((layer) => (
            <span
              key={layer}
              className="text-[8px] px-1 py-0.5 rounded font-medium text-white"
              style={{ backgroundColor: MAESTRO_LAYER_COLORS[layer] }}
            >
              {MAESTRO_LAYER_LABELS[layer]}
            </span>
          ))}
        </div>
      )}
      {threatCount > 0 && (
        <span className="absolute -top-1 -right-1 text-[9px] px-1.5 py-0.5 rounded-full bg-red-500 text-white font-bold">
          {threatCount}
        </span>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-muted-foreground !w-2 !h-2" />
    </div>
  );
}

export default memo(CustomComponentNode);

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { type CanvasNodeData, MAESTRO_LAYER_LABELS, MAESTRO_LAYER_COLORS } from "../types";
import {
  Brain,
  GitBranch,
  Lightbulb,
  Database,
  Wrench,
  Server,
  Cpu,
  Box,
  Settings,
  Code,
  Globe,
  HardDrive,
  Network,
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
};

const CATEGORY_DEFAULTS: Record<string, { icon: string; bgClass: string; borderClass: string }> = {
  kc1: { icon: "brain", bgClass: "bg-blue-500/10", borderClass: "border-blue-500/40" },
  kc2: { icon: "git-branch", bgClass: "bg-green-500/10", borderClass: "border-green-500/40" },
  kc3: { icon: "lightbulb", bgClass: "bg-yellow-500/10", borderClass: "border-yellow-500/40" },
  kc4: { icon: "database", bgClass: "bg-purple-500/10", borderClass: "border-purple-500/40" },
  kc5: { icon: "wrench", bgClass: "bg-pink-500/10", borderClass: "border-pink-500/40" },
  kc6: { icon: "server", bgClass: "bg-indigo-500/10", borderClass: "border-indigo-500/40" },
  custom: { icon: "box", bgClass: "bg-gray-500/10", borderClass: "border-gray-500/40" },
};

const ACCESS_MODE_LABELS: Record<string, { short: string; className: string }> = {
  "read-only": { short: "RO", className: "bg-green-500/20 text-green-700 dark:text-green-400" },
  "read-write": { short: "RW", className: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400" },
  "write-only": { short: "WO", className: "bg-orange-500/20 text-orange-700 dark:text-orange-400" },
  execute: { short: "EXEC", className: "bg-red-500/20 text-red-700 dark:text-red-400" },
  admin: { short: "ADMIN", className: "bg-purple-500/20 text-purple-700 dark:text-purple-400" },
};

const RISK_TIER_LABELS: Record<string, { className: string }> = {
  benign: { className: "bg-green-500/20 text-green-700 dark:text-green-400" },
  sensitive: { className: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400" },
  destructive: { className: "bg-red-500/20 text-red-700 dark:text-red-400" },
  critical: { className: "bg-red-600/30 text-red-800 dark:text-red-300 font-bold" },
};

function AgentComponentNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as CanvasNodeData;
  const defaults = CATEGORY_DEFAULTS[nodeData.category] ?? CATEGORY_DEFAULTS.custom;
  const IconComp = ICON_MAP[nodeData.icon ?? defaults.icon] ?? Box;
  const directThreats = nodeData.threats?.filter((t) => !t.inherited) ?? [];
  const inheritedThreats = nodeData.threats?.filter((t) => t.inherited) ?? [];
  const highSeverity = nodeData.threats?.filter((t) => t.severity === "high").length ?? 0;

  const accessModeInfo = nodeData.toolAccessMode
    ? ACCESS_MODE_LABELS[nodeData.toolAccessMode]
    : null;
  const riskTierInfo = nodeData.toolRiskTier ? RISK_TIER_LABELS[nodeData.toolRiskTier] : null;

  return (
    <div
      role="group"
      aria-label={`${nodeData.label} - ${nodeData.category} component`}
      className={`relative rounded-lg border-2 p-3 min-w-[160px] max-w-[220px] shadow-sm transition-all ${defaults.bgClass} ${selected ? "ring-2 ring-primary border-primary" : defaults.borderClass} ${highSeverity > 0 ? "ring-1 ring-red-400/50" : ""}`}
    >
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground !w-2 !h-2" />
      <Handle type="target" position={Position.Left} className="!bg-muted-foreground !w-2 !h-2" />
      <div className="flex items-start gap-2">
        <div className="p-1.5 rounded-md bg-background/60 shrink-0">
          <IconComp className="h-4 w-4 text-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <p className="text-xs font-semibold leading-tight truncate">{nodeData.label}</p>
            {accessModeInfo && (
              <span
                className={`text-[7px] px-1 py-0.5 rounded font-bold shrink-0 ${accessModeInfo.className}`}
              >
                {accessModeInfo.short}
              </span>
            )}
          </div>
          {nodeData.description && (
            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
              {nodeData.description}
            </p>
          )}
          {riskTierInfo && nodeData.toolRiskTier && (
            <span
              className={`text-[7px] px-1 py-0.5 rounded mt-0.5 inline-block ${riskTierInfo.className}`}
            >
              {nodeData.toolRiskTier}
            </span>
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
      {(directThreats.length > 0 || inheritedThreats.length > 0) && (
        <div className="flex items-center gap-1 mt-1.5">
          {directThreats.length > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500 text-white font-bold">
              {directThreats.length}
            </span>
          )}
          {inheritedThreats.length > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-orange-400 text-orange-500 font-bold bg-orange-50 dark:bg-orange-950">
              +{inheritedThreats.length}
            </span>
          )}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-muted-foreground !w-2 !h-2" />
    </div>
  );
}

export default memo(AgentComponentNode);

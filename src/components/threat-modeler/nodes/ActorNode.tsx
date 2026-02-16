import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { CanvasNodeData } from "../types";
import { useZoomLevel, getHandleSize } from "../hooks/useZoomLevel";
import { User, Globe } from "lucide-react";

function ActorNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as CanvasNodeData;
  const { tier } = useZoomLevel();
  const handleSize = getHandleSize(tier);
  const isExternal = nodeData.category === "external";
  const Icon = isExternal ? Globe : User;
  const threatCount = nodeData.threats?.length ?? 0;

  if (tier === "minimal") {
    return (
      <div
        role="group"
        aria-label={`${nodeData.label} - ${isExternal ? "external" : "actor"}`}
        className={`relative flex flex-col items-center gap-0.5 p-1.5 min-w-[60px] ${selected ? "ring-2 ring-primary rounded-lg" : ""}`}
      >
        <Handle
          type="target"
          position={Position.Top}
          className={`!bg-muted-foreground ${handleSize}`}
        />
        <Handle
          type="target"
          position={Position.Left}
          className={`!bg-muted-foreground ${handleSize}`}
        />
        <Icon className="h-5 w-5" />
        <p className="text-[9px] font-semibold text-center max-w-[80px] truncate">
          {nodeData.label}
        </p>
        <Handle
          type="source"
          position={Position.Bottom}
          className={`!bg-muted-foreground ${handleSize}`}
        />
        <Handle
          type="source"
          position={Position.Right}
          className={`!bg-muted-foreground ${handleSize}`}
        />
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label={`${nodeData.label} - ${isExternal ? "external" : "actor"}`}
      className={`relative flex flex-col items-center gap-1 p-3 min-w-[100px] ${selected ? "ring-2 ring-primary rounded-lg" : ""}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className={`!bg-muted-foreground ${handleSize}`}
      />
      <Handle
        type="target"
        position={Position.Left}
        className={`!bg-muted-foreground ${handleSize}`}
      />
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${isExternal ? "bg-orange-500/10 border-orange-500/40" : "bg-blue-500/10 border-blue-500/40"}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xs font-semibold text-center max-w-[120px] truncate">{nodeData.label}</p>
      {threatCount > 0 && (
        <span className="absolute -top-1 -right-1 text-[9px] px-1.5 py-0.5 rounded-full bg-red-500 text-white font-bold">
          {threatCount}
        </span>
      )}
      <Handle
        type="source"
        position={Position.Bottom}
        className={`!bg-muted-foreground ${handleSize}`}
      />
      <Handle
        type="source"
        position={Position.Right}
        className={`!bg-muted-foreground ${handleSize}`}
      />
    </div>
  );
}

export default memo(ActorNode);

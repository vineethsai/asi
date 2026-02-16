import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { CanvasNodeData } from "../types";
import { Database } from "lucide-react";

function DataStoreNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as CanvasNodeData;
  const threatCount = nodeData.threats?.length ?? 0;

  return (
    <div className={`relative min-w-[140px] ${selected ? "ring-2 ring-primary rounded-lg" : ""}`}>
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground !w-2 !h-2" />
      <Handle type="target" position={Position.Left} className="!bg-muted-foreground !w-2 !h-2" />
      <div className="border-2 border-purple-500/40 bg-purple-500/10 rounded-sm px-3 py-2 flex items-center gap-2">
        <Database className="h-4 w-4 text-purple-500 shrink-0" />
        <div className="min-w-0">
          <p className="text-xs font-semibold truncate">{nodeData.label}</p>
          {nodeData.description && (
            <p className="text-[10px] text-muted-foreground truncate">{nodeData.description}</p>
          )}
        </div>
      </div>
      <div className="h-0.5 bg-purple-500/40 w-full" />
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

export default memo(DataStoreNode);

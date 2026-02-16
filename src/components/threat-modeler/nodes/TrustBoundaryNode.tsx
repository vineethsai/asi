import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import type { CanvasNodeData } from "../types";
import { Shield } from "lucide-react";

function TrustBoundaryNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as CanvasNodeData;
  return (
    <div
      className={`border-2 border-dashed rounded-xl p-2 min-w-[200px] min-h-[150px] ${selected ? "border-primary bg-primary/5" : "border-red-400/50 bg-red-500/5"}`}
      style={{ width: "100%", height: "100%" }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <Shield className="h-3.5 w-3.5 text-red-500" />
        <span className="text-[10px] font-semibold text-red-600 dark:text-red-400">
          {nodeData.label}
        </span>
      </div>
    </div>
  );
}

export default memo(TrustBoundaryNode);

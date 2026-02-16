import { memo } from "react";
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from "@xyflow/react";
import type { CanvasEdgeData } from "../types";
import { Lock, Unlock, ShieldAlert } from "lucide-react";

const CLASSIFICATION_COLORS: Record<string, string> = {
  Public: "#22c55e",
  Internal: "#eab308",
  Confidential: "#f97316",
  Restricted: "#ef4444",
};

function DataFlowEdge(props: EdgeProps) {
  const {
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data,
    selected,
  } = props;
  const edgeData = data as unknown as CanvasEdgeData | undefined;
  const encrypted = edgeData?.encrypted ?? true;
  const classification = edgeData?.dataClassification ?? "Internal";
  const label = edgeData?.label ?? "Data Flow";
  const containsPII = edgeData?.containsPII ?? false;
  const threatCount = edgeData?.threats?.length ?? 0;
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  const strokeColor = CLASSIFICATION_COLORS[classification] ?? "#eab308";

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: selected ? "hsl(var(--primary))" : strokeColor,
          strokeWidth: selected ? 2.5 : 1.5,
          strokeDasharray: encrypted ? undefined : "5 5",
          opacity: 0.8,
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan"
        >
          <div
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-medium border bg-background/90 backdrop-blur-sm shadow-sm ${selected ? "border-primary" : "border-border"}`}
          >
            {encrypted ? (
              <Lock className="h-2.5 w-2.5 text-green-500" />
            ) : (
              <Unlock className="h-2.5 w-2.5 text-red-500" />
            )}
            <span className="truncate max-w-[80px]">{label}</span>
            {containsPII && <ShieldAlert className="h-2.5 w-2.5 text-orange-500" />}
            {threatCount > 0 && (
              <span className="px-1 py-0 rounded-full bg-red-500 text-white text-[8px] font-bold">
                {threatCount}
              </span>
            )}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default memo(DataFlowEdge);

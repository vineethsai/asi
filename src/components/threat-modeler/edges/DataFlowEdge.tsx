import { memo, useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from "@xyflow/react";
import type { CanvasEdgeData } from "../types";
import { Lock, Unlock, ShieldAlert } from "lucide-react";

const CLASSIFICATION_COLORS: Record<string, string> = {
  Public: "#22c55e",
  Internal: "#eab308",
  Confidential: "#f97316",
  Restricted: "#ef4444",
};

function EdgeTooltip({
  anchorRef,
  edgeData,
  label,
  encrypted,
  classification,
  containsPII,
}: {
  anchorRef: React.RefObject<HTMLDivElement | null>;
  edgeData: CanvasEdgeData | undefined;
  label: string;
  encrypted: boolean;
  classification: string;
  containsPII: boolean;
}) {
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setPos({
      top: rect.top - 4,
      left: rect.left + rect.width / 2,
    });
  }, [anchorRef]);

  return createPortal(
    <div
      className="fixed w-52 p-2.5 rounded-md border bg-popover text-popover-foreground shadow-lg text-[10px] space-y-0.5 pointer-events-none animate-in fade-in-0 zoom-in-95"
      style={{
        top: pos.top,
        left: pos.left,
        transform: "translate(-50%, -100%)",
        zIndex: 99999,
      }}
    >
      <p className="font-semibold text-xs">{label}</p>
      <p>Protocol: {edgeData?.protocol ?? "HTTPS"}</p>
      <p>Encrypted: {encrypted ? "Yes" : "No"}</p>
      <p>Auth: {edgeData?.authentication ?? "None"}</p>
      <p>Classification: {classification}</p>
      {containsPII && <p className="text-orange-500 font-semibold">Contains PII</p>}
      {edgeData?.bidirectional && <p>Bidirectional: Yes</p>}
    </div>,
    document.body,
  );
}

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

  const [hovered, setHovered] = useState(false);
  const labelRef = useRef<HTMLDivElement>(null);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout>>();

  const onEnter = useCallback(() => {
    clearTimeout(hoverTimeout.current);
    setHovered(true);
  }, []);

  const onLeave = useCallback(() => {
    hoverTimeout.current = setTimeout(() => setHovered(false), 100);
  }, []);

  useEffect(() => {
    return () => clearTimeout(hoverTimeout.current);
  }, []);

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
            ref={labelRef}
            onMouseEnter={onEnter}
            onMouseLeave={onLeave}
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
          {hovered && (
            <EdgeTooltip
              anchorRef={labelRef}
              edgeData={edgeData}
              label={label}
              encrypted={encrypted}
              classification={classification}
              containsPII={containsPII}
            />
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default memo(DataFlowEdge);

import { memo } from "react";
import { NodeResizer, type NodeProps } from "@xyflow/react";
import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { tm, useTM } from "../store";
import type { CanvasNode } from "../types";
import { TRUST_LABEL, trustColor } from "./visualTokens";

/**
 * Trust boundary (§7.5): nestable zone whose stroke colour follows its trust
 * level, a drop target while a component is dragged over it, resizable when
 * selected (one undo entry per resize).
 */
function TrustBoundaryNode({ id, parentId, data, selected }: NodeProps<CanvasNode>) {
  const level = data.trustLevel ?? "trusted";
  const stroke = trustColor(level);
  const text = trustColor(level, undefined, "fg");
  const dropTarget = useTM((s) => s.ui.dropTargetId === id);
  const readonly = useTM((s) => s.persist === "readonly");
  const children = useTM((s) =>
    s.document.nodes.reduce((c, n) => c + (n.parentId === id ? 1 : 0), 0),
  );
  const ghost = useTM((s) => {
    const w = s.ui.whatIf.result?.nodeId;
    return !!w && (w === id || w === parentId);
  });

  return (
    <>
      <NodeResizer
        minWidth={200}
        minHeight={150}
        isVisible={!!selected && !readonly}
        color={stroke}
        handleClassName="!h-2.5 !w-2.5 !rounded-sm !border-background"
        onResizeStart={() => tm().beginGesture()}
        onResizeEnd={() => tm().endGesture("Resize boundary")}
      />
      <div
        role="group"
        aria-label={`${data.label}, trust boundary, ${TRUST_LABEL[level]} zone, ${children} component${children === 1 ? "" : "s"}`}
        className={cn(
          "h-full w-full rounded-xl border-2 border-dashed p-2 transition-[background-color,border-width,opacity] duration-200",
          ghost && "tm-ghost",
        )}
        style={{
          borderColor: selected ? "hsl(var(--primary))" : stroke,
          borderWidth: dropTarget ? 3 : 2,
          backgroundColor: trustColor(level, dropTarget ? 0.14 : 0.04),
        }}
      >
        <div className="flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 shrink-0" style={{ color: text }} aria-hidden />
          <span className="truncate text-[11px] font-semibold">{data.label}</span>
          <span
            className="shrink-0 rounded border px-1 py-px text-[11px] leading-tight"
            style={{ borderColor: stroke, color: text }}
          >
            {TRUST_LABEL[level]} zone
          </span>
          {dropTarget && (
            <span className="shrink-0 text-[11px] font-medium text-primary">
              Drop to place inside
            </span>
          )}
        </div>
      </div>
    </>
  );
}

export default memo(TrustBoundaryNode);

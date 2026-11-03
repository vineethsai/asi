import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import { Sparkles } from "lucide-react";
import type { CanvasNode } from "../types";
import { Chip, NodeShell } from "./NodeShell";

/** User-defined components: custom colour plus a chip with the custom threat count. */
function CustomComponentNode({ id, type, parentId, data, selected }: NodeProps<CanvasNode>) {
  const n = data.customThreatIds?.length ?? 0;
  return (
    <NodeShell
      id={id}
      type={type}
      parentId={parentId}
      data={data}
      fallbackIcon={"box"}
      selected={selected}
      variant="custom"
      accent={data.color || "hsl(var(--muted-foreground))"}
      extraChips={
        <Chip
          icon={<Sparkles className="h-3 w-3 shrink-0" aria-hidden />}
          title={`${n} custom threat${n === 1 ? "" : "s"} defined on this component type`}
        >
          {n} custom
        </Chip>
      }
    />
  );
}

export default memo(CustomComponentNode);

import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import type { CanvasNode } from "../types";
import { Chip, NodeShell } from "./NodeShell";

/** Human actors (round) and external systems (dashed, square). */
function ActorNode({ id, type, parentId, data, selected }: NodeProps<CanvasNode>) {
  const external = data.category === "external";
  return (
    <NodeShell
      id={id}
      type={type}
      parentId={parentId}
      data={data}
      fallbackIcon={external ? "globe" : "user"}
      selected={selected}
      variant={external ? "external" : "actor"}
      extraChips={
        <Chip title={external ? "External system" : "Human actor"}>
          {external ? "External" : "Actor"}
        </Chip>
      }
    />
  );
}

export default memo(ActorNode);

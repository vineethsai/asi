import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import { KC } from "@/data/kc";
import type { CanvasNode } from "../types";
import { NodeShell } from "./NodeShell";

/** Data stores and memory modules; honours `data.color` as the cap / border accent. */
function DataStoreNode({ id, type, parentId, data, selected }: NodeProps<CanvasNode>) {
  return (
    <NodeShell
      id={id}
      type={type}
      parentId={parentId}
      data={data}
      fallbackIcon={"database"}
      selected={selected}
      variant="store"
      accent={data.color || KC.kc4.color}
    />
  );
}

export default memo(DataStoreNode);

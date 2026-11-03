import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import type { CanvasNode } from "../types";
import { NodeShell } from "./NodeShell";

/** KC1–KC6 components and agentic primitives (agents, tools, MCP, gates, …). */
function AgentComponentNode({ id, type, parentId, data, selected }: NodeProps<CanvasNode>) {
  return (
    <NodeShell
      id={id}
      type={type}
      parentId={parentId}
      data={data}
      selected={selected}
      variant="component"
      accent={data.color}
    />
  );
}

export default memo(AgentComponentNode);

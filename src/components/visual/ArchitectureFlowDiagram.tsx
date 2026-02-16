import { memo, useCallback } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Handle,
  Position,
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type NodeTypes,
  type EdgeTypes,
  type Node,
  type Edge,
  type NodeProps,
  type EdgeProps,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Brain, GitBranch, Lightbulb, Database, Wrench, Server, User, Globe } from "lucide-react";

// ---------------------------------------------------------------------------
// Compact node components designed for read-only architecture diagrams
// ---------------------------------------------------------------------------

const CATEGORY_STYLE: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  kc1: {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-400",
    text: "text-blue-700 dark:text-blue-300",
    icon: "text-blue-500",
  },
  kc2: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-400",
    text: "text-emerald-700 dark:text-emerald-300",
    icon: "text-emerald-500",
  },
  kc3: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-400",
    text: "text-amber-700 dark:text-amber-300",
    icon: "text-amber-500",
  },
  kc4: {
    bg: "bg-violet-50 dark:bg-violet-950/40",
    border: "border-violet-400",
    text: "text-violet-700 dark:text-violet-300",
    icon: "text-violet-500",
  },
  kc5: {
    bg: "bg-rose-50 dark:bg-rose-950/40",
    border: "border-rose-400",
    text: "text-rose-700 dark:text-rose-300",
    icon: "text-rose-500",
  },
  kc6: {
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    border: "border-indigo-400",
    text: "text-indigo-700 dark:text-indigo-300",
    icon: "text-indigo-500",
  },
};

const ICON_MAP: Record<string, React.ElementType> = {
  kc1: Brain,
  kc2: GitBranch,
  kc3: Lightbulb,
  kc4: Database,
  kc5: Wrench,
  kc6: Server,
};

const CompactComponentNode = memo(({ data }: NodeProps) => {
  const d = data as Record<string, unknown>;
  const category = (d.category as string) ?? "kc2";
  const label = (d.label as string) ?? "Component";
  const style = CATEGORY_STYLE[category] ?? CATEGORY_STYLE.kc2;
  const Icon = ICON_MAP[category] ?? GitBranch;

  return (
    <div
      className={`relative rounded-lg border-2 ${style.border} ${style.bg} px-3 py-2 min-w-[110px] max-w-[150px] shadow-sm`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-gray-400 !w-1.5 !h-1.5 !border-0"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-gray-400 !w-1.5 !h-1.5 !border-0"
      />
      <div className="flex items-center gap-1.5">
        <Icon className={`h-3.5 w-3.5 shrink-0 ${style.icon}`} />
        <span className={`text-[10px] font-semibold leading-tight ${style.text}`}>{label}</span>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-gray-400 !w-1.5 !h-1.5 !border-0"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-gray-400 !w-1.5 !h-1.5 !border-0"
      />
    </div>
  );
});
CompactComponentNode.displayName = "CompactComponentNode";

const CompactActorNode = memo(({ data }: NodeProps) => {
  const d = data as Record<string, unknown>;
  const isExternal = d.category === "external";
  const label = (d.label as string) ?? "Actor";
  const Icon = isExternal ? Globe : User;

  return (
    <div className="relative flex flex-col items-center gap-1 px-2 py-1">
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-gray-400 !w-1.5 !h-1.5 !border-0"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-gray-400 !w-1.5 !h-1.5 !border-0"
      />
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center border-2 ${isExternal ? "bg-orange-50 dark:bg-orange-950/40 border-orange-300" : "bg-sky-50 dark:bg-sky-950/40 border-sky-300"}`}
      >
        <Icon className={`h-4 w-4 ${isExternal ? "text-orange-500" : "text-sky-500"}`} />
      </div>
      <span className="text-[9px] font-semibold text-muted-foreground whitespace-nowrap">
        {label}
      </span>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-gray-400 !w-1.5 !h-1.5 !border-0"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-gray-400 !w-1.5 !h-1.5 !border-0"
      />
    </div>
  );
});
CompactActorNode.displayName = "CompactActorNode";

const CompactDataStoreNode = memo(({ data }: NodeProps) => {
  const d = data as Record<string, unknown>;
  const label = (d.label as string) ?? "Data Store";

  return (
    <div className="relative min-w-[100px]">
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-gray-400 !w-1.5 !h-1.5 !border-0"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-gray-400 !w-1.5 !h-1.5 !border-0"
      />
      <div className="border-2 border-violet-400 bg-violet-50 dark:bg-violet-950/40 rounded px-2.5 py-1.5 flex items-center gap-1.5">
        <Database className="h-3.5 w-3.5 text-violet-500 shrink-0" />
        <span className="text-[10px] font-semibold text-violet-700 dark:text-violet-300">
          {label}
        </span>
      </div>
      <div className="h-[2px] bg-violet-400 w-full rounded-b" />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-gray-400 !w-1.5 !h-1.5 !border-0"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-gray-400 !w-1.5 !h-1.5 !border-0"
      />
    </div>
  );
});
CompactDataStoreNode.displayName = "CompactDataStoreNode";

// Clean edge with just a label
const CompactEdge = memo((props: EdgeProps) => {
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
  } = props;
  const edgeData = data as Record<string, unknown> | undefined;
  const label = (edgeData?.label as string) ?? "";
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{ ...style, stroke: "#94a3b8", strokeWidth: 1.5, opacity: 0.6 }}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "none",
            }}
          >
            <span className="text-[8px] text-muted-foreground bg-background/80 px-1 py-0.5 rounded whitespace-nowrap">
              {label}
            </span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});
CompactEdge.displayName = "CompactEdge";

const nodeTypes: NodeTypes = {
  agentComponent: CompactComponentNode,
  actor: CompactActorNode,
  dataStore: CompactDataStoreNode,
};

const edgeTypes: EdgeTypes = { dataFlow: CompactEdge };

// ---------------------------------------------------------------------------
// Architecture flow definitions
// ---------------------------------------------------------------------------

type FlowDef = { nodes: Node[]; edges: Edge[] };

function n(id: string, type: string, x: number, y: number, label: string, category: string): Node {
  return { id, type, position: { x, y }, data: { label, category } };
}

function e(id: string, source: string, target: string, label: string): Edge {
  return { id, source, target, type: "dataFlow", data: { label } };
}

const ARCHITECTURE_FLOWS: Record<string, FlowDef> = {
  sequential: {
    nodes: [
      n("0", "actor", 0, 55, "User", "actor"),
      n("1", "agentComponent", 140, 50, "Input Guard", "kc3"),
      n("2", "agentComponent", 300, 50, "LLM Core", "kc1"),
      n("3", "dataStore", 460, 45, "Memory", "kc4"),
      n("4", "agentComponent", 610, 50, "Output Guard", "kc3"),
      n("5", "actor", 770, 55, "Output", "external"),
    ],
    edges: [
      e("e01", "0", "1", "Raw Input"),
      e("e12", "1", "2", "Validated"),
      e("e23", "2", "3", "Context"),
      e("e34", "3", "4", "Response"),
      e("e45", "4", "5", "Safe Output"),
    ],
  },

  hierarchical: {
    nodes: [
      n("0", "actor", 240, 0, "User", "actor"),
      n("1", "agentComponent", 210, 110, "Orchestrator", "kc2"),
      n("2", "agentComponent", 20, 240, "Research Agent", "kc2"),
      n("3", "agentComponent", 210, 240, "Coding Agent", "kc2"),
      n("4", "agentComponent", 400, 240, "Analysis Agent", "kc2"),
      n("5", "agentComponent", 20, 360, "Web Search", "kc5"),
      n("6", "agentComponent", 210, 360, "Code Sandbox", "kc6"),
      n("7", "agentComponent", 400, 360, "LLM", "kc1"),
    ],
    edges: [
      e("e01", "0", "1", "Request"),
      e("e12", "1", "2", "Research"),
      e("e13", "1", "3", "Code"),
      e("e14", "1", "4", "Analyze"),
      e("e25", "2", "5", "Search"),
      e("e36", "3", "6", "Execute"),
      e("e47", "4", "7", "LLM Call"),
    ],
  },

  collaborative: {
    nodes: [
      n("0", "actor", 210, 0, "User", "actor"),
      n("1", "agentComponent", 20, 130, "Agent Alpha", "kc2"),
      n("2", "agentComponent", 200, 130, "Agent Beta", "kc2"),
      n("3", "agentComponent", 380, 130, "Agent Gamma", "kc2"),
      n("4", "dataStore", 160, 280, "Shared Knowledge", "kc4"),
      n("5", "agentComponent", 200, 390, "LLM", "kc1"),
    ],
    edges: [
      e("e02", "0", "2", "Task"),
      e("e12", "1", "2", "Peer Comm"),
      e("e23", "2", "3", "Peer Comm"),
      e("e31", "3", "1", "Peer Comm"),
      e("e14", "1", "4", "Store"),
      e("e24", "2", "4", "Store"),
      e("e34", "3", "4", "Store"),
      e("e45", "4", "5", "LLM Call"),
    ],
  },

  reactive: {
    nodes: [
      n("0", "actor", 0, 90, "Event Source", "external"),
      n("1", "agentComponent", 170, 85, "Reactive Agent", "kc2"),
      n("2", "agentComponent", 170, 220, "LLM", "kc1"),
      n("3", "agentComponent", 380, 30, "Action Tool", "kc5"),
      n("4", "dataStore", 380, 140, "Event Log", "kc4"),
      n("5", "agentComponent", 380, 260, "Feedback", "kc3"),
    ],
    edges: [
      e("e01", "0", "1", "Trigger"),
      e("e12", "1", "2", "Decide"),
      e("e13", "1", "3", "Act"),
      e("e14", "1", "4", "Log"),
      e("e45", "4", "5", "Analyze"),
      e("e51", "5", "1", "Adapt"),
    ],
  },

  knowledge_intensive: {
    nodes: [
      n("0", "actor", 210, 0, "User", "actor"),
      n("1", "agentComponent", 180, 120, "Knowledge Agent", "kc2"),
      n("2", "agentComponent", 180, 260, "LLM", "kc1"),
      n("3", "dataStore", 0, 260, "Vector DB", "kc4"),
      n("4", "dataStore", 360, 260, "Knowledge Graph", "kc4"),
      n("5", "actor", 400, 120, "External APIs", "external"),
      n("6", "dataStore", 0, 120, "Doc Store", "kc4"),
    ],
    edges: [
      e("e01", "0", "1", "Query"),
      e("e12", "1", "2", "LLM Call"),
      e("e13", "1", "3", "Search"),
      e("e14", "1", "4", "Graph Query"),
      e("e15", "1", "5", "API Call"),
      e("e16", "1", "6", "Retrieve"),
    ],
  },
};

// ---------------------------------------------------------------------------
// React Flow viewer
// ---------------------------------------------------------------------------

interface ArchitectureFlowDiagramProps {
  architectureId: string;
  className?: string;
}

function ArchitectureFlowInner({ architectureId }: { architectureId: string }) {
  const { fitView } = useReactFlow();
  const flowData = ARCHITECTURE_FLOWS[architectureId];

  const onInit = useCallback(() => {
    setTimeout(() => fitView({ padding: 0.15, duration: 200 }), 30);
  }, [fitView]);

  if (!flowData) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
        No diagram available
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={flowData.nodes}
      edges={flowData.edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onInit={onInit}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      panOnDrag
      zoomOnScroll
      zoomOnPinch
      fitView
      fitViewOptions={{ padding: 0.15 }}
      minZoom={0.4}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
      className="bg-background"
    >
      <Background variant={BackgroundVariant.Dots} gap={24} size={0.8} className="!bg-muted/10" />
    </ReactFlow>
  );
}

export default function ArchitectureFlowDiagram({
  architectureId,
  className = "w-full h-[400px]",
}: ArchitectureFlowDiagramProps) {
  return (
    <div className={`${className} rounded-lg overflow-hidden border border-border/40`}>
      <ReactFlowProvider key={architectureId}>
        <ArchitectureFlowInner architectureId={architectureId} />
      </ReactFlowProvider>
    </div>
  );
}

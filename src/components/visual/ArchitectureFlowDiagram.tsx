/**
 * ArchitectureFlowDiagram — read-only React Flow diagram of one reference architecture
 * (flow definitions in ./architectureFlows.ts).
 *
 * Props:
 *   architectureId: string
 *   className?: string                 — size of the diagram box (default "w-full h-[400px]")
 *   title?: string                     — accessible name (fullscreen dialog, text alternative)
 *   variant?: "default" | "thumbnail"  — thumbnail: static picture rendered once (no pan / zoom /
 *                                        fullscreen / focus), `aria-hidden`, with an sr-only text
 *                                        alternative (describeArchitectureFlow)
 *   highlight?: AttackHighlight        — attack-path state from <AttackPathPlayer> / useAttackPath:
 *                                        animated edges + moving dot (SVG animateMotion), pulsing
 *                                        node (box-shadow 0 → 8 px → 0, 900 ms × 2), dimmed rest
 *   showFullscreen?: boolean           — default true for the default variant
 *
 * Inline mode never captures the mouse wheel (the page scrolls; P0-03) and, on touch screens,
 * never captures one-finger drags. The fullscreen dialog enables wheel zoom and panning.
 */

import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
  useReactFlow,
  type NodeTypes,
  type EdgeTypes,
  type Node,
  type Edge,
  type NodeProps,
  type EdgeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Brain,
  GitBranch,
  Lightbulb,
  Database,
  Wrench,
  Server,
  User,
  Globe,
  Maximize2,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useChartTheme } from "@/components/charts/useChartTheme";
import { kcColor } from "@/lib/palette";
import { severityColor } from "@/lib/severity";
import { cn } from "@/lib/utils";
import { ARCHITECTURE_FLOWS, describeArchitectureFlow } from "./architectureFlows";
import type { AttackHighlight } from "./attackPath";

// ---------------------------------------------------------------------------
// Attack-path decoration carried in node / edge `data`
// ---------------------------------------------------------------------------

type AttackState = "active" | "affected" | "visited" | "dim";

interface AttackDecoration {
  attack?: AttackState;
  /** Theme-following CSS colour (outline / stroke). */
  attackColor?: string;
  /** Concrete colour for the WAAPI pulse (CSS vars are not reliable in keyframes). */
  pulseColor?: string;
  pulseKey?: number;
  pulseDelay?: number;
  still?: boolean;
  hopMs?: number;
  reverse?: boolean;
}

const PULSE_MS = 900;

/** "hsl(25 95% 53%)" → "hsl(25 95% 53% / 0.55)"; other formats via color-mix. */
function alpha(color: string, a: number): string {
  if (/^hsla?\([^/]*\)$/i.test(color)) return color.replace(/\)$/, ` / ${a})`);
  return `color-mix(in srgb, ${color} ${Math.round(a * 100)}%, transparent)`;
}

/** Severity pulse on the node body (box-shadow 0 → 8 px → 0, 900 ms × 2). */
function usePulse(ref: React.RefObject<HTMLElement>, d: AttackDecoration) {
  const { attack, pulseColor, pulseKey, pulseDelay = 0, still } = d;
  useEffect(() => {
    const el = ref.current;
    if (!el || attack !== "active" || still || !pulseColor) return;
    if (typeof el.animate !== "function") return;
    const c = alpha(pulseColor, 0.55);
    const anim = el.animate(
      [
        { boxShadow: `0 0 0 0 ${alpha(pulseColor, 0)}` },
        { boxShadow: `0 0 0 8px ${c}` },
        { boxShadow: `0 0 0 0 ${alpha(pulseColor, 0)}` },
      ],
      { duration: PULSE_MS, iterations: 2, delay: pulseDelay, easing: "ease-out" },
    );
    return () => anim.cancel();
  }, [ref, attack, pulseColor, pulseKey, pulseDelay, still]);
}

function attackStyle(d: AttackDecoration): React.CSSProperties | undefined {
  if (!d.attack) return undefined;
  if (d.attack === "dim") return { opacity: 0.45, transition: "opacity 200ms ease" };
  const strong = d.attack === "active" || d.attack === "affected";
  return {
    outline: `${strong ? 2 : 1.5}px solid ${d.attackColor}`,
    outlineOffset: 2,
    transition: "opacity 200ms ease, outline-color 200ms ease",
  };
}

// ---------------------------------------------------------------------------
// Compact node components designed for read-only architecture diagrams
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, React.ElementType> = {
  kc1: Brain,
  kc2: GitBranch,
  kc3: Lightbulb,
  kc4: Database,
  kc5: Wrench,
  kc6: Server,
};

const HANDLE_CLASS = "!bg-muted-foreground/60 !w-1.5 !h-1.5 !border-0";

function Handles() {
  return (
    <>
      <Handle type="target" position={Position.Top} className={HANDLE_CLASS} />
      <Handle type="target" position={Position.Left} className={HANDLE_CLASS} />
      <Handle type="source" position={Position.Bottom} className={HANDLE_CLASS} />
      <Handle type="source" position={Position.Right} className={HANDLE_CLASS} />
    </>
  );
}

const CompactComponentNode = memo(({ data }: NodeProps) => {
  const d = data as Record<string, unknown> & AttackDecoration;
  const category = (d.category as string) ?? "kc2";
  const label = (d.label as string) ?? "Component";
  const Icon = ICON_MAP[category] ?? GitBranch;
  const ref = useRef<HTMLDivElement>(null);
  usePulse(ref, d);

  return (
    <div
      ref={ref}
      className="relative min-w-[110px] max-w-[150px] rounded-lg border-2 bg-card px-3 py-2 shadow-sm"
      style={{
        borderColor: kcColor(category),
        backgroundColor: kcColor(category, d.attack === "affected" ? 0.22 : 0.1),
        ...attackStyle(d),
      }}
    >
      <Handles />
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: kcColor(category) }} />
        <span className="text-[10px] font-semibold leading-tight text-foreground">{label}</span>
      </div>
    </div>
  );
});
CompactComponentNode.displayName = "CompactComponentNode";

const CompactActorNode = memo(({ data }: NodeProps) => {
  const d = data as Record<string, unknown> & AttackDecoration;
  const isExternal = d.category === "external";
  const label = (d.label as string) ?? "Actor";
  const Icon = isExternal ? Globe : User;
  const ref = useRef<HTMLDivElement>(null);
  usePulse(ref, d);
  const style = attackStyle(d);

  return (
    <div
      className="relative flex flex-col items-center gap-1 px-2 py-1"
      style={d.attack === "dim" ? style : undefined}
    >
      <Handles />
      <div
        ref={ref}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full border-2",
          isExternal
            ? "border-orange-300 bg-orange-50 dark:bg-orange-950/40"
            : "border-sky-300 bg-sky-50 dark:bg-sky-950/40",
        )}
        style={d.attack && d.attack !== "dim" ? style : undefined}
      >
        <Icon className={cn("h-4 w-4", isExternal ? "text-orange-500" : "text-sky-500")} />
      </div>
      <span className="whitespace-nowrap text-[9px] font-semibold text-muted-foreground">
        {label}
      </span>
    </div>
  );
});
CompactActorNode.displayName = "CompactActorNode";

const CompactDataStoreNode = memo(({ data }: NodeProps) => {
  const d = data as Record<string, unknown> & AttackDecoration;
  const label = (d.label as string) ?? "Data Store";
  const category = (d.category as string) ?? "kc4";
  const ref = useRef<HTMLDivElement>(null);
  usePulse(ref, d);

  return (
    <div className="relative min-w-[100px]" style={d.attack === "dim" ? attackStyle(d) : undefined}>
      <Handles />
      <div
        ref={ref}
        className="flex items-center gap-1.5 rounded border-2 px-2.5 py-1.5"
        style={{
          borderColor: kcColor(category),
          backgroundColor: kcColor(category, d.attack === "affected" ? 0.22 : 0.1),
          ...(d.attack && d.attack !== "dim" ? attackStyle(d) : undefined),
        }}
      >
        <Database className="h-3.5 w-3.5 shrink-0" style={{ color: kcColor(category) }} />
        <span className="text-[10px] font-semibold text-foreground">{label}</span>
      </div>
      <div className="h-[2px] w-full rounded-b" style={{ backgroundColor: kcColor(category) }} />
    </div>
  );
});
CompactDataStoreNode.displayName = "CompactDataStoreNode";

/** Moving dot along the edge path, restarted on every `runKey` (begin="indefinite"). */
function MovingDot({
  path,
  color,
  durationMs,
  reverse,
  runKey,
}: {
  path: string;
  color: string;
  durationMs: number;
  reverse?: boolean;
  runKey?: number;
}) {
  const ref = useRef<SVGAnimateMotionElement>(null);
  useLayoutEffect(() => {
    const el = ref.current as (SVGAnimateMotionElement & { beginElement?: () => void }) | null;
    try {
      el?.beginElement?.();
    } catch {
      /* SMIL unsupported (tests, very old browsers): the dot simply sits at the start. */
    }
  }, [runKey, path]);
  return (
    <circle r={4} fill={color} stroke="hsl(var(--background))" strokeWidth={1}>
      <animateMotion
        ref={ref}
        dur={`${durationMs}ms`}
        begin="indefinite"
        fill="freeze"
        path={path}
        calcMode="linear"
        keyPoints={reverse ? "1;0" : "0;1"}
        keyTimes="0;1"
      />
    </circle>
  );
}

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
  const edgeData = (data ?? {}) as Record<string, unknown> & AttackDecoration;
  const label = (edgeData.label as string) ?? "";
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  const attack = edgeData.attack;
  const onPath = attack === "active" || attack === "visited";
  const stroke = onPath ? (edgeData.attackColor as string) : "hsl(var(--muted-foreground))";

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke,
          strokeWidth: attack === "active" ? 2.5 : onPath ? 2 : 1.5,
          opacity: attack === "dim" ? 0.25 : onPath ? 0.95 : 0.55,
          transition: "opacity 200ms ease, stroke 200ms ease",
        }}
      />
      {attack === "active" && !edgeData.still && (
        <MovingDot
          path={edgePath}
          color={stroke}
          durationMs={(edgeData.hopMs as number) ?? 1200}
          reverse={edgeData.reverse}
          runKey={edgeData.pulseKey}
        />
      )}
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "none",
              opacity: attack === "dim" ? 0.4 : 1,
            }}
          >
            <span className="whitespace-nowrap rounded bg-background/80 px-1 py-0.5 text-[8px] text-muted-foreground">
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
// React Flow viewer
// ---------------------------------------------------------------------------

export interface ArchitectureFlowDiagramProps {
  architectureId: string;
  className?: string;
  /** Accessible name for the fullscreen dialog and the text alternative. */
  title?: string;
  variant?: "default" | "thumbnail";
  highlight?: AttackHighlight;
  showFullscreen?: boolean;
}

function isCoarsePointer() {
  return typeof window !== "undefined" && !!window.matchMedia?.("(pointer: coarse)").matches;
}

function useDecorated(architectureId: string, highlight?: AttackHighlight) {
  const theme = useChartTheme();
  const flowData = ARCHITECTURE_FLOWS[architectureId];
  return useMemo(() => {
    if (!flowData) return undefined;
    if (!highlight) {
      return { nodes: flowData.nodes as Node[], edges: flowData.edges as Edge[] };
    }
    const visitedNodes = new Set(highlight.visitedNodeIds);
    const visitedEdges = new Set(highlight.visitedEdgeIds);
    const affected = new Set(highlight.affectedNodeIds);
    const attackColor = severityColor(highlight.band);
    const pulseColor = theme.severity[highlight.band];
    const nodes: Node[] = flowData.nodes.map((node) => {
      const attack: AttackState =
        node.id === highlight.activeNodeId
          ? "active"
          : affected.has(node.id)
            ? "affected"
            : visitedNodes.has(node.id)
              ? "visited"
              : "dim";
      return {
        ...node,
        data: {
          ...node.data,
          attack,
          attackColor,
          pulseColor,
          pulseKey: highlight.runKey,
          pulseDelay: highlight.pulseDelayMs,
          still: highlight.still,
        } satisfies Record<string, unknown> & AttackDecoration,
      };
    });
    const edges: Edge[] = flowData.edges.map((edge) => {
      const attack: AttackState =
        edge.id === highlight.activeEdgeId
          ? "active"
          : visitedEdges.has(edge.id)
            ? "visited"
            : "dim";
      return {
        ...edge,
        animated: !highlight.still && (attack === "active" || attack === "visited"),
        data: {
          ...edge.data,
          attack,
          attackColor,
          pulseKey: highlight.runKey,
          hopMs: highlight.hopMs,
          still: highlight.still,
          reverse: edge.id === highlight.activeEdgeId ? highlight.activeEdgeReverse : undefined,
        } satisfies Record<string, unknown> & AttackDecoration,
      };
    });
    return { nodes, edges };
  }, [flowData, highlight, theme]);
}

function ArchitectureFlowInner({
  architectureId,
  interactive = false,
  thumbnail = false,
  highlight,
}: {
  architectureId: string;
  interactive?: boolean;
  thumbnail?: boolean;
  highlight?: AttackHighlight;
}) {
  const { fitView } = useReactFlow();
  const decorated = useDecorated(architectureId, highlight);
  const [coarse] = useState(isCoarsePointer);

  const onInit = useCallback(() => {
    setTimeout(() => fitView({ padding: 0.15, duration: thumbnail ? 0 : 200 }), 30);
  }, [fitView, thumbnail]);

  if (!decorated) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
        No diagram available
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={decorated.nodes}
      edges={decorated.edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onInit={onInit}
      nodesDraggable={false}
      nodesConnectable={false}
      nodesFocusable={!thumbnail}
      edgesFocusable={false}
      elementsSelectable={false}
      panOnDrag={!thumbnail && (interactive || !coarse)}
      zoomOnScroll={interactive}
      zoomOnPinch={!thumbnail}
      zoomOnDoubleClick={!thumbnail}
      panOnScroll={false}
      preventScrolling={interactive}
      fitView
      fitViewOptions={{ padding: thumbnail ? 0.08 : 0.15 }}
      minZoom={0.2}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
      className="bg-background"
    >
      {!thumbnail && (
        <Background variant={BackgroundVariant.Dots} gap={24} size={0.8} className="!bg-muted/10" />
      )}
    </ReactFlow>
  );
}

function ArchitectureFlowDiagram({
  architectureId,
  className = "w-full h-[400px]",
  title = "Architecture diagram",
  variant = "default",
  highlight,
  showFullscreen,
}: ArchitectureFlowDiagramProps) {
  const [fullscreen, setFullscreen] = useState(false);
  const hasDiagram = Boolean(ARCHITECTURE_FLOWS[architectureId]);
  const thumbnail = variant === "thumbnail";
  const canFullscreen = hasDiagram && !thumbnail && (showFullscreen ?? true);

  if (thumbnail) {
    return (
      <div className={cn(className, "relative overflow-hidden rounded-md")}>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 select-none">
          <ReactFlowProvider key={architectureId}>
            <ArchitectureFlowInner architectureId={architectureId} thumbnail />
          </ReactFlowProvider>
        </div>
        <p className="sr-only">
          {title}: {describeArchitectureFlow(architectureId)}
        </p>
      </div>
    );
  }

  return (
    <div className={cn(className, "relative overflow-hidden rounded-lg border border-border/40")}>
      <ReactFlowProvider key={architectureId}>
        <ArchitectureFlowInner architectureId={architectureId} highlight={highlight} />
      </ReactFlowProvider>
      {canFullscreen && (
        <button
          type="button"
          onClick={() => setFullscreen(true)}
          className="absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-md border bg-background/90 text-muted-foreground shadow-sm backdrop-blur transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Open ${title} fullscreen`}
          title="Fullscreen (scroll to zoom)"
        >
          <Maximize2 className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
      {canFullscreen && (
        <Dialog open={fullscreen} onOpenChange={setFullscreen}>
          <DialogContent className="flex h-[88vh] w-[96vw] max-w-6xl flex-col gap-0 overflow-hidden p-0">
            <div className="border-b px-4 py-3 pr-12">
              <DialogTitle className="text-base">{title}</DialogTitle>
              <DialogDescription className="text-xs">
                Scroll or pinch to zoom, drag to pan.
              </DialogDescription>
            </div>
            <div className="min-h-0 flex-1">
              {fullscreen && (
                <ReactFlowProvider key={`${architectureId}-fullscreen`}>
                  <ArchitectureFlowInner
                    architectureId={architectureId}
                    interactive
                    highlight={highlight}
                  />
                </ReactFlowProvider>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

/** Thumbnails never re-render after mount unless their architecture changes. */
export default memo(ArchitectureFlowDiagram);

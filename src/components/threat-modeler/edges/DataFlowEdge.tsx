import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from "@xyflow/react";
import { ArrowLeftRight, Lock, LockOpen, ShieldAlert, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { severityColor, severityLabel, severityToken } from "@/lib/severity";
import { tm, useTM } from "../store";
import type { CanvasEdge } from "../types";
import { classificationColor } from "../nodes/visualTokens";

/**
 * Data flow edge (§7.5): colour by classification, width from the attack-path
 * score through it, dashed + lock-open when unencrypted, double arrow when
 * bidirectional, animated dash offset only while "Flow" is on or the edge is
 * on the playing attack path, a moving dot on the active hop, what-if ghost,
 * and an unclipped label whose tooltip lives inside the label renderer so it
 * follows pan / zoom and opens on hover and keyboard focus.
 */

const safeId = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, "_");

/** SMIL animations inserted after page load must be started explicitly. */
function MovingDot({
  path,
  dur,
  reverse,
  color,
}: {
  path: string;
  dur: number;
  reverse?: boolean;
  color: string;
}) {
  const ref = useRef<SVGAnimateMotionElement>(null);
  useLayoutEffect(() => {
    try {
      ref.current?.beginElement();
    } catch {
      /* SMIL unsupported */
    }
  }, []);
  return (
    <circle
      r={5}
      fill={color}
      stroke="hsl(var(--background))"
      strokeWidth={1.5}
      pointerEvents="none"
    >
      <animateMotion
        ref={ref}
        begin="indefinite"
        dur={`${dur}ms`}
        fill="freeze"
        path={path}
        keyPoints={reverse ? "1;0" : "0;1"}
        keyTimes="0;1"
        calcMode="linear"
      />
    </circle>
  );
}

function DataFlowEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<CanvasEdge>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  const summary = useTM((s) => s.edgeThreats[id]);
  const flowOn = useTM((s) => s.ui.flowAnimation);
  const onPath = useTM((s) => !!s.ui.highlight?.visitedEdgeIds.includes(id));
  const still = useTM((s) => !!s.ui.highlight?.still);
  const active = useTM((s) => s.ui.highlight?.activeEdgeId === id && !s.ui.highlight.still);
  const reverse = useTM((s) => !!s.ui.highlight?.activeEdgeReverse);
  const runKey = useTM((s) => s.ui.highlight?.runKey ?? 0);
  const hopMs = useTM((s) => s.ui.highlight?.hopMs ?? 1200);
  const band = useTM((s) => s.ui.highlight?.band ?? "high");
  const ghost = useTM((s) => {
    const w = s.ui.whatIf.result?.nodeId;
    if (!w) return false;
    if (w === source || w === target) return true;
    const parent = (nid: string) => s.document.nodes.find((n) => n.id === nid)?.parentId;
    return parent(source) === w || parent(target) === w;
  });
  const sourceLabel = useTM(
    (s) => s.document.nodes.find((n) => n.id === source)?.data.label ?? source,
  );
  const targetLabel = useTM(
    (s) => s.document.nodes.find((n) => n.id === target)?.data.label ?? target,
  );

  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(leaveTimer.current), []);

  const encrypted = data?.encrypted ?? true;
  const classification = data?.dataClassification ?? "Internal";
  const label = data?.label || "Data flow";
  const pii = !!data?.containsPII;
  const bidirectional = !!data?.bidirectional;
  const unverified = data?.customMetadata?.postureUnverified === "true";
  const stroke = selected ? "hsl(var(--primary))" : classificationColor(classification);
  const width = 1.5 + 3 * Math.max(0, Math.min(1, summary?.pathWeight ?? 0)) + (selected ? 0.5 : 0);
  const markerId = `tm-arrow-${safeId(id)}`;
  const flowing = (flowOn || onPath) && !still;
  const open = summary?.open ?? 0;
  const resolved = (summary?.total ?? 0) - open;

  const select = useCallback(() => {
    tm().setGraph((nodes, edges) => ({
      nodes: nodes.some((n) => n.selected)
        ? nodes.map((n) => (n.selected ? { ...n, selected: false } : n))
        : nodes,
      edges: edges.map((e) =>
        !!e.selected === (e.id === id) ? e : { ...e, selected: e.id === id },
      ),
    }));
    tm().setUi({ selectedEdgeId: id, selectedNodeId: null });
  }, [id]);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      select();
    }
  };

  const showTip = hover || focus;
  const posture = `${encrypted ? "encrypted" : "unencrypted"}, authentication ${data?.authentication ?? "None"}, ${classification}${pii ? ", contains PII" : ""}${bidirectional ? ", bidirectional" : ""}`;

  return (
    <>
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="8.5"
          refY="5"
          markerWidth="12"
          markerHeight="12"
          markerUnits="userSpaceOnUse"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" fill={stroke} />
        </marker>
      </defs>
      <g className={cn(ghost && "tm-ghost")}>
        <BaseEdge
          id={id}
          path={edgePath}
          markerEnd={`url(#${markerId})`}
          markerStart={bidirectional ? `url(#${markerId})` : undefined}
          interactionWidth={18}
          className="tm-edge-path"
          style={{
            stroke,
            strokeWidth: width,
            strokeDasharray: encrypted && !ghost ? undefined : "6 5",
            opacity: onPath ? 1 : 0.85,
          }}
        />
        {onPath && !selected && (
          <path
            d={edgePath}
            fill="none"
            pointerEvents="none"
            stroke={severityColor(band)}
            strokeOpacity={0.35}
            strokeWidth={width + 5}
            strokeLinecap="round"
          />
        )}
        {flowing && (
          <path
            d={edgePath}
            fill="none"
            pointerEvents="none"
            className="tm-flow"
            stroke="hsl(var(--background))"
            strokeOpacity={0.9}
            strokeWidth={Math.max(1, width - 0.5)}
            strokeLinecap="round"
          />
        )}
        {active && (
          <MovingDot
            key={runKey}
            path={edgePath}
            dur={hopMs}
            reverse={reverse}
            color={severityColor(band)}
          />
        )}
      </g>
      <EdgeLabelRenderer>
        <div
          className={cn("nodrag nopan absolute", ghost && "tm-ghost")}
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "all",
            zIndex: showTip ? 1000 : undefined,
          }}
          onMouseEnter={() => {
            clearTimeout(leaveTimer.current);
            setHover(true);
          }}
          onMouseLeave={() => {
            leaveTimer.current = setTimeout(() => setHover(false), 120);
          }}
        >
          <div
            role="button"
            tabIndex={0}
            aria-label={`Data flow ${label}: ${sourceLabel} to ${targetLabel}, ${posture}${open ? `, ${open} open threat${open === 1 ? "" : "s"}` : ""}${unverified ? ", posture unverified" : ""}`}
            aria-pressed={!!selected}
            onClick={(e) => {
              e.stopPropagation();
              select();
            }}
            onKeyDown={onKeyDown}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
            className={cn(
              "flex max-w-[180px] cursor-pointer items-center gap-1 rounded-md border bg-background/95 px-1.5 py-0.5 text-[11px] font-medium shadow-sm backdrop-blur-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected ? "border-primary" : "border-border",
              unverified && "border-dashed",
            )}
          >
            {encrypted ? (
              <Lock
                className="h-3 w-3 shrink-0"
                style={{ color: severityColor("low", "fg") }}
                aria-hidden
              />
            ) : (
              <LockOpen
                className="h-3 w-3 shrink-0"
                style={{ color: severityColor("critical", "fg") }}
                aria-hidden
              />
            )}
            <span className="min-w-0 truncate">{label}</span>
            {bidirectional && (
              <ArrowLeftRight className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden />
            )}
            {pii && (
              <ShieldAlert
                className="h-3 w-3 shrink-0"
                style={{ color: severityColor("high", "fg") }}
                aria-hidden
              />
            )}
            {unverified && (
              <TriangleAlert
                className="h-3 w-3 shrink-0"
                style={{ color: severityColor("medium", "fg") }}
                aria-hidden
              />
            )}
            {open > 0 && summary?.band && (
              <span
                aria-hidden
                className={cn(
                  "shrink-0 rounded-full px-1 text-[11px] font-bold leading-tight",
                  severityToken(summary.band).solid,
                )}
              >
                {open}
              </span>
            )}
            {resolved > 0 && (
              <span aria-hidden className="shrink-0 text-[11px] text-muted-foreground">
                <s>{resolved}</s>
              </span>
            )}
          </div>
          {showTip && (
            <div
              role="tooltip"
              className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 w-56 -translate-x-1/2 space-y-0.5 rounded-md border bg-popover p-2 text-[11px] leading-snug text-popover-foreground shadow-lg"
            >
              <p className="break-words text-xs font-semibold">{label}</p>
              <p className="text-muted-foreground">
                {sourceLabel} → {targetLabel}
              </p>
              <p>Protocol: {data?.protocol || "—"}</p>
              <p>Encrypted: {encrypted ? "Yes" : "No"}</p>
              <p>Authentication: {data?.authentication || "None"}</p>
              <p className="flex items-center gap-1">
                Classification:
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: classificationColor(classification) }}
                />
                {classification}
              </p>
              {pii && <p className="font-semibold">Contains PII</p>}
              {bidirectional && <p>Bidirectional</p>}
              <p>
                Threats: {open} open
                {summary?.band ? ` (highest ${severityLabel(summary.band)})` : ""}
                {resolved > 0 ? `, ${resolved} resolved` : ""}
              </p>
              {unverified && (
                <p className="font-semibold">
                  Posture unverified (imported) — confirm it in the panel.
                </p>
              )}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default memo(DataFlowEdge);

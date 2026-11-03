import { memo, useMemo, type CSSProperties, type ReactNode } from "react";
import { Handle, Position } from "@xyflow/react";
import { Link2 } from "lucide-react";
import { Icon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import {
  severityAbbr,
  severityColor,
  severityLabel,
  severityToken,
  type SeverityBand,
} from "@/lib/severity";
import { getHandleSize, useZoomTier, type ZoomTier } from "../hooks/useZoomLevel";
import { resolveKind } from "../engine/semantics";
import { useTM, type NodeThreatSummary } from "../store";
import {
  MAESTRO_LAYER_COLORS,
  MAESTRO_LAYER_NAMES,
  type CanvasNode,
  type CanvasNodeData,
  type MaestroLayer,
} from "../types";
import {
  ACCESS_BAND,
  ACCESS_MODE,
  CATEGORY_ICON,
  KIND_CHIP,
  KIND_LABEL,
  SENSITIVITY,
  TRUST_LABEL,
  trustColor,
} from "./visualTokens";

/**
 * Shared node shell (§7.5): severity ring + fill intensity from residual risk,
 * trust-level left stripe, access-mode / sensitivity / semantics chips, zoom
 * tiers, threat badges (open, struck-through resolved, inherited) that pop in
 * after each run, attack-path pulse, what-if ghost and connect-mode outline.
 */

export type NodeVariant = "component" | "actor" | "external" | "store" | "custom";

export interface NodeShellProps {
  id: string;
  type?: string;
  parentId?: string;
  data: CanvasNodeData;
  selected?: boolean;
  variant?: NodeVariant;
  /** Accent colour (stores / custom components honour `data.color`). */
  accent?: string;
  /** Extra chips after the built-in ones. */
  extraChips?: ReactNode;
  /** Icon key when `data.icon` is empty (default: by category). */
  fallbackIcon?: string;
}

const WIDTH: Record<ZoomTier, string> = {
  full: "min-w-[170px] max-w-[220px]",
  compact: "min-w-[150px] max-w-[200px]",
  minimal: "min-w-[96px] max-w-[150px]",
};

export function Chip({
  band,
  icon,
  children,
  title,
  className,
  style,
}: {
  band?: SeverityBand;
  icon?: ReactNode;
  children: ReactNode;
  title?: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      title={title}
      style={style}
      className={cn(
        "inline-flex max-w-full items-center gap-0.5 rounded border px-1 py-px text-[11px] font-medium leading-tight",
        band ? severityToken(band).badge : "border-border bg-muted/60 text-muted-foreground",
        className,
      )}
    >
      {icon}
      <span className="truncate">{children}</span>
    </span>
  );
}

/** Threat pills for the full tier (footer) and a corner badge for compact/minimal. */
function ThreatBadges({
  summary,
  tier,
  sweepKey,
}: {
  summary: NodeThreatSummary | undefined;
  tier: ZoomTier;
  sweepKey: number;
}) {
  if (!summary || summary.total === 0) return null;
  const pop = sweepKey > 0 ? "tm-pop" : "";
  const delay: CSSProperties = { animationDelay: `${summary.order * 30}ms` };
  const band = summary.band;
  const open =
    summary.open > 0 && band ? (
      <span
        className={cn(
          "inline-flex items-center rounded-full px-1.5 py-px text-[11px] font-bold leading-tight shadow-sm",
          severityToken(band).solid,
        )}
        title={`${summary.open} open threat${summary.open === 1 ? "" : "s"} — highest ${severityLabel(band)}`}
      >
        {summary.open}
        {tier === "minimal"
          ? ""
          : tier === "compact"
            ? ` ${severityAbbr(band)}`
            : ` · ${severityLabel(band)}`}
      </span>
    ) : null;
  const resolved =
    summary.resolved > 0 && tier !== "minimal" ? (
      <span
        className="inline-flex items-center rounded-full border border-border bg-background px-1.5 py-px text-[11px] font-semibold leading-tight text-muted-foreground"
        title={`${summary.resolved} resolved (mitigated, accepted, transferred or false positive)`}
      >
        <s>{summary.resolved}</s>
        {tier === "full" && <span className="ml-0.5 font-normal">resolved</span>}
      </span>
    ) : null;
  const inherited =
    summary.inherited > 0 && tier === "full" ? (
      <span
        className="inline-flex items-center rounded-full border border-dashed border-border bg-background px-1.5 py-px text-[11px] leading-tight text-muted-foreground"
        title={`${summary.inherited} inherited from upstream components (included in the counts)`}
      >
        +{summary.inherited} inherited
      </span>
    ) : null;
  if (tier === "full")
    return (
      <div
        key={sweepKey}
        className={cn("mt-1.5 flex flex-wrap items-center gap-1", pop)}
        style={delay}
        aria-hidden
      >
        {open}
        {resolved}
        {inherited}
      </div>
    );
  return (
    <div
      key={sweepKey}
      className={cn("absolute -right-2 -top-2 z-10 flex items-center gap-0.5", pop)}
      style={delay}
      aria-hidden
    >
      {open}
      {resolved}
    </div>
  );
}

function NodeShellImpl({
  id,
  type,
  parentId,
  data,
  selected,
  variant = "component",
  accent,
  extraChips,
  fallbackIcon,
}: NodeShellProps) {
  const tier = useZoomTier();
  const handleSize = getHandleSize(tier);
  const summary = useTM((s) => s.nodeThreats[id]);
  const sweepKey = useTM((s) => s.ui.sweepKey);
  // -1 = not the active playback node; otherwise the pulse delay (dot travel time).
  const pulseDelay = useTM((s) => {
    const h = s.ui.highlight;
    if (!h || h.still || h.activeNodeId !== id) return -1;
    return h.activeEdgeId ? h.hopMs : 0;
  });
  const visited = useTM((s) => !!s.ui.highlight?.visitedNodeIds.includes(id));
  const highlightBand = useTM((s) => s.ui.highlight?.band ?? "high");
  const runKey = useTM((s) => s.ui.highlight?.runKey ?? 0);
  const ghost = useTM((s) => {
    const w = s.ui.whatIf.result?.nodeId;
    return !!w && (w === id || w === parentId);
  });
  const connecting = useTM((s) => s.ui.connectFrom === id);
  const readonly = useTM((s) => s.persist === "readonly");

  const kind = useMemo(
    () => resolveKind({ id, type, position: { x: 0, y: 0 }, data } as CanvasNode),
    [id, type, data],
  );
  const descId = `tm-node-desc-${id}`;
  const trust = data.trustLevel ?? "semi-trusted";
  const band = summary?.band ?? null;
  const allResolved = !!summary && summary.total > 0 && summary.open === 0;

  const cardStyle: CSSProperties = {};
  if (band) {
    const tint = severityColor(band, "base", 0.05 + 0.25 * (summary?.intensity ?? 0));
    cardStyle.backgroundImage = `linear-gradient(${tint}, ${tint})`;
    cardStyle.boxShadow = `0 0 0 ${band === "critical" ? 3 : 2}px ${severityColor(band)}`;
  } else if (allResolved) {
    cardStyle.boxShadow = `0 0 0 1.5px ${severityColor("low")}`;
  }
  if (accent && (variant === "store" || variant === "custom")) {
    cardStyle.borderColor = accent;
    if (variant === "store") cardStyle.borderTop = `4px solid ${accent}`;
  }
  if (selected) {
    cardStyle.outline = "2px solid hsl(var(--primary))";
    cardStyle.outlineOffset = "3px";
  } else if (connecting) {
    cardStyle.outline = "2px dashed hsl(var(--primary))";
    cardStyle.outlineOffset = "3px";
  } else if (visited) {
    cardStyle.outline = `2px solid ${severityColor(highlightBand)}`;
    cardStyle.outlineOffset = "3px";
  }

  const iconKey = data.icon || fallbackIcon || CATEGORY_ICON[data.category] || "box";
  const kindChip = KIND_CHIP[kind];
  const access = data.toolAccessMode ? ACCESS_MODE[data.toolAccessMode] : null;
  const sens =
    data.dataSensitivity && data.dataSensitivity !== "none"
      ? SENSITIVITY[data.dataSensitivity]
      : null;
  const labelSize =
    tier === "full" ? "text-xs" : tier === "compact" ? "text-[11px]" : "text-[10px]";
  const round =
    variant === "actor" ? "rounded-2xl" : variant === "external" ? "rounded-md" : "rounded-lg";
  const centered = variant === "actor" || variant === "external";

  const chips =
    tier === "minimal" ? null : (
      <>
        {access && (
          <Chip
            band={ACCESS_BAND[data.toolAccessMode!]}
            icon={<access.icon className="h-3 w-3 shrink-0" aria-hidden />}
            title={`Tool access: ${access.label}${data.toolRiskTier ? ` · risk tier ${data.toolRiskTier}` : ""}`}
          >
            {access.short}
            {tier === "full" && data.toolRiskTier ? ` · ${data.toolRiskTier}` : ""}
          </Chip>
        )}
        {sens && (
          <Chip
            band={sens.band}
            icon={<sens.icon className="h-3 w-3 shrink-0" aria-hidden />}
            title={`Data sensitivity: ${sens.label}`}
          >
            {sens.label}
          </Chip>
        )}
        {kindChip && (tier === "full" || !access) && (
          <Chip
            icon={<kindChip.icon className="h-3 w-3 shrink-0" aria-hidden />}
            title={`Semantics: ${KIND_LABEL[kind]}`}
          >
            {kind === "memory" && data.semantics?.memory?.kind
              ? `memory: ${data.semantics.memory.kind}`
              : kindChip.label}
          </Chip>
        )}
        {extraChips}
      </>
    );

  return (
    <div
      role="group"
      aria-label={`${data.label}, ${KIND_LABEL[kind] ?? data.category}, trust ${TRUST_LABEL[trust]}`}
      aria-describedby={descId}
      className={cn("relative", WIDTH[tier], ghost && "tm-ghost")}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={!readonly}
        className={cn("!border-background !bg-muted-foreground", handleSize)}
      />
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={!readonly}
        className={cn("!border-background !bg-muted-foreground", handleSize)}
      />

      <div
        className={cn(
          "relative overflow-hidden border bg-card text-card-foreground shadow-sm transition-[box-shadow,opacity,outline-color] duration-300",
          round,
          ghost && "border-dashed",
          variant === "external" && "border-dashed",
          tier === "full"
            ? "py-2 pl-3.5 pr-2.5"
            : tier === "compact"
              ? "py-1.5 pl-3 pr-2"
              : "py-1 pl-2.5 pr-1.5",
        )}
        style={cardStyle}
      >
        {/* Trust level stripe */}
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-1"
          style={{ backgroundColor: trustColor(trust) }}
        />
        <span className="sr-only">Trust level {TRUST_LABEL[trust]}.</span>

        <div
          className={cn(
            "flex gap-2",
            centered ? "flex-col items-center text-center" : "items-start",
          )}
        >
          <span
            className={cn(
              "flex shrink-0 items-center justify-center border bg-background/70",
              centered ? "h-8 w-8" : "h-7 w-7",
              variant === "actor" ? "rounded-full" : "rounded-md",
            )}
            style={accent ? { borderColor: accent, color: accent } : undefined}
          >
            <Icon name={iconKey} className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className={cn("truncate font-semibold leading-tight", labelSize)} title={data.label}>
              {data.label}
            </p>
            {tier === "full" && data.description && (
              <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                {data.description}
              </p>
            )}
            {connecting && (
              <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-primary">
                <Link2 className="h-3 w-3" aria-hidden /> connecting…
              </p>
            )}
          </div>
        </div>

        {chips && (
          <div className={cn("mt-1.5 flex flex-wrap gap-1", centered && "justify-center")}>
            {chips}
          </div>
        )}

        {tier === "full" && data.maestroLayers?.length > 0 && (
          <div className={cn("mt-1 flex flex-wrap gap-0.5", centered && "justify-center")}>
            {data.maestroLayers.map((layer: MaestroLayer) => (
              <span
                key={layer}
                title={`MAESTRO L${layer}: ${MAESTRO_LAYER_NAMES[layer]}`}
                className="rounded px-1 py-px text-[11px] font-semibold leading-tight text-white"
                style={{ backgroundColor: MAESTRO_LAYER_COLORS[layer] }}
              >
                L{layer}
                <span className="sr-only"> {MAESTRO_LAYER_NAMES[layer]}</span>
              </span>
            ))}
          </div>
        )}

        {tier === "full" && <ThreatBadges summary={summary} tier={tier} sweepKey={sweepKey} />}
      </div>

      {tier !== "full" && <ThreatBadges summary={summary} tier={tier} sweepKey={sweepKey} />}

      {pulseDelay >= 0 && (
        <span
          key={runKey}
          aria-hidden
          className={cn("tm-pulse pointer-events-none absolute inset-0", round)}
          style={
            {
              "--tm-pulse-color": severityColor(highlightBand, "base", 0.55),
              animationDelay: `${pulseDelay}ms`,
            } as CSSProperties
          }
        />
      )}

      <span id={descId} className="sr-only">
        {summary ? summary.text : "Not analysed yet."}
        {connecting ? " Connecting from this component: focus a target and press Enter." : ""}
      </span>

      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={!readonly}
        className={cn("!border-background !bg-muted-foreground", handleSize)}
      />
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={!readonly}
        className={cn("!border-background !bg-muted-foreground", handleSize)}
      />
    </div>
  );
}

export const NodeShell = memo(NodeShellImpl);
export default NodeShell;

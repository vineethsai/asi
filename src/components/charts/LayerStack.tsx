/**
 * LayerStack — the seven MAESTRO layers as stacked bands with chips (§9 "MAESTRO layer stack").
 * Colours come from MAESTRO_PALETTE (mirrors threat-modeler/types.ts); each band also prints
 * "L3" + its name + a count, so colour is never the only cue.
 *
 * Props:
 *   layers?: { layer: 1–7; label?; description?; count?; chips?: { id; label; href?; band?; onClick?; title? }[] }[]
 *            — any subset; omitted layers render empty (default: all 7, no chips)
 *   order?: "top-down" | "bottom-up"   — default "top-down" (L7 Agent Ecosystem on top)
 *   activeLayer?: number | null; onLayerClick?: (layer: number) => void
 *   countLabel?: string                 — e.g. "threats" (default "items")
 *   maxChips?: number                   — default 8; the rest collapse into "+N more"
 *   ariaLabel: string; title?; description?; legend?; toolbar?; compact?
 *
 * Usage:
 *   <LayerStack ariaLabel="Threats by MAESTRO layer" countLabel="threats"
 *     layers={byLayer.map(([layer, ts]) => ({ layer, count: ts.length,
 *       chips: ts.map((t) => ({ id: t.id, label: t.code, href: `/threats/${t.id}`, band: riskBand(t.riskScore) })) }))} />
 */

import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  MAESTRO_ORDER,
  MAESTRO_PALETTE,
  maestroColor,
  type MaestroLayerNumber,
} from "@/lib/palette";
import { severityShape, type SeverityBand } from "@/lib/severity";
import { SeverityGlyph } from "@/components/content/SeverityBadge";
import { ChartFrame } from "./ChartFrame";
import { stagger, usePrefersReducedMotion } from "./motion";

export interface LayerStackChip {
  id: string;
  label: string;
  href?: string;
  band?: SeverityBand;
  onClick?: () => void;
  title?: string;
}

export interface LayerStackLayer {
  layer: MaestroLayerNumber;
  label?: string;
  description?: string;
  count?: number;
  chips?: LayerStackChip[];
}

export interface LayerStackProps {
  layers?: LayerStackLayer[];
  ariaLabel: string;
  title?: ReactNode;
  description?: ReactNode;
  legend?: ReactNode;
  toolbar?: ReactNode;
  order?: "top-down" | "bottom-up";
  activeLayer?: number | null;
  onLayerClick?: (layer: MaestroLayerNumber) => void;
  countLabel?: string;
  maxChips?: number;
  compact?: boolean;
  className?: string;
}

function Chip({ chip }: { chip: LayerStackChip }) {
  const cls =
    "inline-flex items-center gap-1 rounded-full border bg-background/80 px-2 py-0.5 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const inner = (
    <>
      {chip.band && (
        <span className="text-muted-foreground">
          <SeverityGlyph shape={severityShape(chip.band)} className="h-2 w-2" />
        </span>
      )}
      {chip.label}
      {chip.band && <span className="sr-only">({chip.band})</span>}
    </>
  );
  if (chip.href)
    return (
      <Link to={chip.href} className={cls} title={chip.title}>
        {inner}
      </Link>
    );
  if (chip.onClick)
    return (
      <button type="button" onClick={chip.onClick} className={cls} title={chip.title}>
        {inner}
      </button>
    );
  return (
    <span className={cn(cls, "hover:bg-background/80")} title={chip.title}>
      {inner}
    </span>
  );
}

export function LayerStack({
  layers,
  ariaLabel,
  title,
  description,
  legend,
  toolbar,
  order = "top-down",
  activeLayer,
  onLayerClick,
  countLabel = "items",
  maxChips = 8,
  compact = false,
  className,
}: LayerStackProps) {
  const reduced = usePrefersReducedMotion();
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const byLayer = new Map((layers ?? []).map((l) => [l.layer, l]));
  const seq = order === "top-down" ? [...MAESTRO_ORDER].reverse() : [...MAESTRO_ORDER];

  return (
    <ChartFrame
      ariaLabel={ariaLabel}
      title={title}
      description={description}
      legend={legend}
      toolbar={toolbar}
      interactive
      className={className}
      table={{
        columns: ["Layer", "Count", "Items"],
        rows: seq.map((n) => {
          const l = byLayer.get(n);
          return [
            `L${n} ${l?.label ?? MAESTRO_PALETTE[n].label}`,
            l?.count ?? l?.chips?.length ?? 0,
            (l?.chips ?? []).map((c) => c.label).join(", "),
          ];
        }),
      }}
    >
      <ol className={cn("flex flex-col", compact ? "gap-1" : "gap-1.5")}>
        {seq.map((n, i) => {
          const l = byLayer.get(n);
          const label = l?.label ?? MAESTRO_PALETTE[n].label;
          const count = l?.count ?? l?.chips?.length ?? 0;
          const chips = l?.chips ?? [];
          const isOpen = expanded.has(n);
          const visible = isOpen ? chips : chips.slice(0, maxChips);
          const active = activeLayer === n;
          const dim = activeLayer != null && !active;
          const head = (
            <>
              <span
                className="inline-flex h-6 min-w-[2.25rem] items-center justify-center rounded font-mono text-xs font-bold text-[hsl(240_10%_8%)]"
                style={{ background: maestroColor(n) }}
              >
                L{n}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                {label}
              </span>
              <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                {count} {countLabel}
              </span>
            </>
          );
          return (
            <li
              key={n}
              data-layer={n}
              className={cn(
                "rounded-md border-l-4 bg-muted/30 transition-opacity",
                "animate-in fade-in-0 slide-in-from-bottom-1 fill-mode-both",
                compact ? "px-2 py-1.5" : "px-3 py-2",
                active && "bg-muted/70 ring-1 ring-border",
                dim && "opacity-55",
              )}
              style={{
                borderLeftColor: maestroColor(n),
                animationDelay: `${stagger(i, reduced, 40)}ms`,
                animationDuration: "320ms",
              }}
            >
              {onLayerClick ? (
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => onLayerClick(n)}
                  className="flex w-full items-center gap-2 rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {head}
                </button>
              ) : (
                <div className="flex items-center gap-2">{head}</div>
              )}
              {l?.description && !compact && (
                <p className="mt-1 text-xs text-muted-foreground">{l.description}</p>
              )}
              {chips.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {visible.map((c) => (
                    <Chip key={c.id} chip={c} />
                  ))}
                  {chips.length > maxChips && (
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() =>
                        setExpanded((prev) => {
                          const next = new Set(prev);
                          if (next.has(n)) next.delete(n);
                          else next.add(n);
                          return next;
                        })
                      }
                      className="rounded-full px-2 py-0.5 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {isOpen ? "Show less" : `+${chips.length - maxChips} more`}
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </ChartFrame>
  );
}

export default LayerStack;

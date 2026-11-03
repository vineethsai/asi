import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { ArrowRight } from "lucide-react";
import { ChartFrame } from "@/components/charts/ChartFrame";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { duration, easing } from "@/lib/motion";
import {
  CROSSWALK_GROUPS,
  FRAMEWORK_PAIR_COUNTS,
  frameworkEntryCount,
  type CrosswalkFramework,
  type CrosswalkGroup,
} from "./crosswalkGraph";

export interface FrameworkMapProps {
  onOpen: (group: CrosswalkGroup) => void;
}

const W = 700;
const H = 440;
const CX = W / 2;
const CY = H / 2 + 6;
const R = 160;
const NODE_R = 38;

const POS = Object.fromEntries(
  CROSSWALK_GROUPS.map((g, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / CROSSWALK_GROUPS.length;
    return [g.id, { x: CX + R * Math.cos(a), y: CY + R * Math.sin(a) }];
  }),
) as Record<CrosswalkFramework, { x: number; y: number }>;

const EDGES = CROSSWALK_GROUPS.flatMap((a, i) =>
  CROSSWALK_GROUPS.slice(i + 1).map((b) => ({
    a: a.id,
    b: b.id,
    count: FRAMEWORK_PAIR_COUNTS[`${a.id}|${b.id}`] ?? 0,
  })),
).filter((e) => e.count > 0);

const MAX = Math.max(1, ...EDGES.map((e) => e.count));
const width = (count: number) => 2 + 8 * Math.sqrt(count / MAX);
const groupById = new Map(CROSSWALK_GROUPS.map((g) => [g.id, g]));

function curve(a: CrosswalkFramework, b: CrosswalkFramework, i: number) {
  const s = POS[a];
  const t = POS[b];
  const mx = (s.x + t.x) / 2;
  const my = (s.y + t.y) / 2;
  const dx = t.x - s.x;
  const dy = t.y - s.y;
  const len = Math.hypot(dx, dy) || 1;
  const off = (i % 2 ? -1 : 1) * 18;
  const qx = mx + (-dy / len) * off;
  const qy = my + (dx / len) * off;
  return {
    d: `M ${s.x} ${s.y} Q ${qx} ${qy} ${t.x} ${t.y}`,
    // Midpoint of the quadratic curve (t = 0.5).
    mid: { x: 0.25 * s.x + 0.5 * qx + 0.25 * t.x, y: 0.25 * s.y + 0.5 * qy + 0.25 * t.y },
  };
}

/**
 * Framework interconnection map (§6.8, §9): five frameworks, edge width = mapping statements.
 * Hover, keyboard focus or a first tap highlights a framework's connections (listed in the caption);
 * click, Enter or a second tap opens it. Edges draw in on first view (reduced motion: static).
 */
export function FrameworkMap({ onOpen }: FrameworkMapProps) {
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState<CrosswalkFramework | null>(null);
  /** Set by a first tap on touch screens (hover does not exist there). */
  const [pinned, setPinned] = useState<CrosswalkFramework | null>(null);
  const active = hovered ?? pinned;
  const [drawn, setDrawn] = useState(reduced);
  /** Draw-in finished: the edges drop their dash attributes and rest as plain strokes. */
  const [settled, setSettled] = useState(reduced);
  const lastPointer = useRef<string>("mouse");

  useEffect(() => {
    if (reduced) {
      setDrawn(true);
      setSettled(true);
      return;
    }
    const id = requestAnimationFrame(() => setDrawn(true));
    // Longest edge: 700 ms draw + its stagger delay (see `transitionDelay` below).
    const done = window.setTimeout(() => setSettled(true), 700 + EDGES.length * 40 + 50);
    return () => {
      cancelAnimationFrame(id);
      window.clearTimeout(done);
    };
  }, [reduced]);

  const connections = useMemo(
    () =>
      active
        ? EDGES.filter((e) => e.a === active || e.b === active).map((e) => ({
            group: groupById.get(e.a === active ? e.b : e.a)!,
            count: e.count,
          }))
        : [],
    [active],
  );

  const activate = (g: CrosswalkGroup) => {
    if (lastPointer.current === "touch" && pinned !== g.id) {
      setPinned(g.id);
      return;
    }
    onOpen(g);
  };
  const onKey = (e: KeyboardEvent, g: CrosswalkGroup) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen(g);
    } else if (e.key === "Escape") {
      setPinned(null);
      setHovered(null);
    }
  };
  const transition = reduced
    ? undefined
    : `stroke-dashoffset 700ms ${easing.out}, stroke-width ${duration.slow}ms ${easing.out}, opacity ${duration.fast}ms`;
  const activeGroup = active ? groupById.get(active) : undefined;

  return (
    <ChartFrame
      title="Framework interconnection map"
      description="Edge width and labels show mapping statements between frameworks. Hover, focus or tap a framework to see its links; click, press Enter or tap again to open it."
      ariaLabel="Network of five security frameworks connected by the number of mappings between them"
      interactive
      table={{
        columns: ["Framework A", "Framework B", "Mappings"],
        rows: EDGES.map((e) => [groupById.get(e.a)!.label, groupById.get(e.b)!.label, e.count]),
      }}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mx-auto block h-auto w-full max-w-3xl"
        onPointerDown={(e: PointerEvent) => (lastPointer.current = e.pointerType)}
      >
        {EDGES.map((e, i) => {
          const { d, mid } = curve(e.a, e.b, i);
          const on = !!active && (e.a === active || e.b === active);
          const dim = !!active && !on;
          const color = on ? groupById.get(active!)!.color : "hsl(var(--muted-foreground))";
          return (
            <g key={`${e.a}-${e.b}`} opacity={dim ? 0.15 : 1} style={{ transition }}>
              <path
                d={d}
                fill="none"
                stroke={color}
                strokeOpacity={on ? 0.85 : 0.35}
                strokeLinecap="round"
                pathLength={settled ? undefined : 1}
                strokeDasharray={settled ? undefined : "1"}
                strokeDashoffset={settled ? undefined : drawn ? 0 : 1}
                strokeWidth={drawn ? width(e.count) : 0}
                style={{ transition, transitionDelay: reduced ? undefined : `${i * 40}ms` }}
              >
                <title>{`${groupById.get(e.a)!.label} ↔ ${groupById.get(e.b)!.label}: ${e.count} mappings`}</title>
              </path>
              <g aria-hidden>
                <rect
                  x={mid.x - 16}
                  y={mid.y - 10}
                  width={32}
                  height={20}
                  rx={10}
                  fill={on ? color : "hsl(var(--card))"}
                  stroke={on ? color : "hsl(var(--border))"}
                />
                <text
                  x={mid.x}
                  y={mid.y + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={11}
                  fontWeight={600}
                  fill={on ? "hsl(var(--background))" : "hsl(var(--muted-foreground))"}
                  className="tabular-nums"
                >
                  {e.count}
                </text>
              </g>
            </g>
          );
        })}

        {CROSSWALK_GROUPS.map((g, i) => {
          const p = POS[g.id];
          const isActive = active === g.id;
          const linked =
            !active ||
            isActive ||
            EDGES.some((e) => (e.a === active && e.b === g.id) || (e.b === active && e.a === g.id));
          const count = frameworkEntryCount(g.id);
          const above = p.y < CY;
          return (
            <g
              key={g.id}
              role="button"
              tabIndex={0}
              aria-label={`${g.label}: ${count} ${g.id === "aiuc1" ? "active requirements" : "entries"}. Press Enter to open.`}
              onMouseEnter={() => setHovered(g.id)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(g.id)}
              onBlur={() => setHovered(null)}
              onClick={() => activate(g)}
              onKeyDown={(e) => onKey(e, g)}
              className="cursor-pointer outline-none [&:focus-visible>circle:last-of-type]:stroke-[hsl(var(--ring))]"
              opacity={linked ? 1 : 0.3}
              style={{
                transition: reduced
                  ? undefined
                  : `opacity ${duration.fast}ms, transform ${duration.base}ms ${easing.standard}`,
                transitionDelay: reduced ? undefined : `${i * 40}ms`,
                transformBox: "fill-box",
                transformOrigin: "center",
                transform: drawn ? "scale(1)" : "scale(0.6)",
              }}
            >
              <circle cx={p.x} cy={p.y} r={NODE_R + (isActive ? 4 : 0)} fill={g.color} />
              <text
                x={p.x}
                y={p.y - 3}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={12}
                fontWeight={700}
                fill="hsl(var(--background))"
                className="pointer-events-none"
              >
                {g.short.replace("OWASP ", "")}
              </text>
              <text
                x={p.x}
                y={p.y + 12}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={11}
                fontWeight={600}
                fill="hsl(var(--background))"
                className="pointer-events-none tabular-nums"
              >
                {count}
              </text>
              <text
                x={p.x}
                y={p.y + (above ? -NODE_R - 12 : NODE_R + 18)}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={12}
                fontWeight={600}
                fill="hsl(var(--foreground))"
                className="pointer-events-none"
              >
                {g.label}
              </text>
              <circle
                cx={p.x}
                cy={p.y}
                r={NODE_R + 7}
                fill="none"
                stroke={isActive ? g.color : "transparent"}
                strokeWidth={2}
              />
            </g>
          );
        })}
      </svg>
      <div aria-live="polite" className="mt-2 min-h-[2.5rem] text-sm">
        {activeGroup ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-medium">{activeGroup.label}</span>
            {connections.map((c) => (
              <span key={c.group.id} className="text-muted-foreground">
                ↔ {c.group.short}{" "}
                <span className="font-mono tabular-nums text-foreground">{c.count}</span>
              </span>
            ))}
            <button
              type="button"
              onClick={() => onOpen(activeGroup)}
              onMouseDown={(e) => e.preventDefault()}
              className="ml-auto inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Open {activeGroup.short}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Numbers inside the nodes are entries per framework (AIUC-1: active requirements).
          </p>
        )}
      </div>
    </ChartFrame>
  );
}

export default FrameworkMap;

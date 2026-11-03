/**
 * ThreatConstellation — radial map of a threat's cross-framework references (OWASP Agentic
 * Top 10, Cisco AI taxonomy, OWASP AIVSS). Every node is a keyboard-focusable link; hover and
 * focus show the same label, Enter follows the deep link.
 */
import { useMemo, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { Threat } from "@/components/components/securityData";
import { ChartFrame, ChartLegend } from "@/components/charts/ChartFrame";
import { FRAMEWORK_PALETTE } from "@/lib/palette";
import { severityColor } from "@/lib/severity";
import { truncate } from "@/components/charts/chartUtils";
import type { FrameworkKey, FrameworkRef } from "./frameworkLinks";
import { threatBand } from "./threatIndex";

const SECTORS: { key: FrameworkKey; label: string; center: number }[] = [
  { key: "asi", label: "OWASP Agentic Top 10", center: -Math.PI / 2 },
  { key: "cisco", label: "Cisco AI Taxonomy", center: Math.PI / 6 },
  { key: "aivss", label: "OWASP AIVSS", center: (5 * Math.PI) / 6 },
];
const COLOR: Record<FrameworkKey, string> = {
  asi: FRAMEWORK_PALETTE.asi.css,
  cisco: FRAMEWORK_PALETTE.cisco.css,
  aivss: FRAMEWORK_PALETTE.aivss.css,
};
const INK = "hsl(240 10% 8%)";
const CX = 300;
const CY = 195;
const R = 145;

interface PlacedNode {
  id: string;
  ref: FrameworkRef;
  x: number;
  y: number;
  r: number;
  short: string;
}

export interface ThreatConstellationProps {
  threat: Threat;
  refs: Record<FrameworkKey, FrameworkRef[]>;
}

export function ThreatConstellation({ threat, refs }: ThreatConstellationProps) {
  const navigate = useNavigate();
  const [active, setActive] = useState<string | null>(null);

  const nodes = useMemo(() => {
    const out: PlacedNode[] = [];
    const span = (2 * Math.PI) / 3;
    const pad = 0.12;
    for (const s of SECTORS) {
      const items = refs[s.key];
      const n = items.length;
      if (!n) continue;
      const start = s.center - span / 2 + span * pad;
      const end = s.center + span / 2 - span * pad;
      const arcLen = R * (end - start);
      const r = Math.max(11, Math.min(20, arcLen / (n * 2.3)));
      items.forEach((ref, i) => {
        const t = n === 1 ? 0.5 : i / (n - 1);
        const a = start + t * (end - start);
        out.push({
          id: `${s.key}-${ref.code}`,
          ref,
          x: CX + R * Math.cos(a),
          y: CY + R * Math.sin(a),
          r,
          short: s.key === "aivss" ? ref.code.replace(/^AIVSS\s*/, "") : ref.code,
        });
      });
    }
    return out;
  }, [refs]);

  if (!nodes.length) return null;
  const activeNode = nodes.find((n) => n.id === active);
  const center = severityColor(threatBand(threat));

  const onKey = (e: KeyboardEvent, n: PlacedNode) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      navigate(n.ref.href);
    } else if (e.key === "Escape") setActive(null);
  };

  return (
    <ChartFrame
      title="Framework constellation"
      description="Each node is a reference in another framework. Hover, tap or Tab to a node to see it; Enter opens the entry."
      ariaLabel={`${threat.code} maps to ${nodes.length} entries across ${SECTORS.filter((s) => refs[s.key].length).length} frameworks.`}
      interactive
      legend={
        <ChartLegend
          items={SECTORS.filter((s) => refs[s.key].length).map((s) => ({
            id: s.key,
            label: `${s.label} (${refs[s.key].length})`,
            color: COLOR[s.key],
            shape: "circle" as const,
          }))}
        />
      }
      table={{
        caption: `${threat.code} framework references`,
        columns: ["Framework", "Entry", "Name"],
        rows: SECTORS.flatMap((s) => refs[s.key].map((r) => [s.label, r.code, r.name])),
      }}
    >
      <svg viewBox="0 0 600 390" className="mx-auto w-full" style={{ maxHeight: 360 }}>
        {SECTORS.map((s) => {
          if (!refs[s.key].length) return null;
          const lx = CX + (R + 30) * Math.cos(s.center);
          const ly = CY + (R + 30) * Math.sin(s.center);
          return (
            <text
              key={s.key}
              x={lx}
              y={Math.min(380, Math.max(12, ly))}
              textAnchor="middle"
              dominantBaseline="middle"
              aria-hidden
              style={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 600 }}
            >
              {s.label}
            </text>
          );
        })}

        {nodes.map((n) => {
          const dx = n.x - CX;
          const dy = n.y - CY;
          const len = Math.hypot(dx, dy) || 1;
          const mx = (CX + n.x) / 2 + (-dy / len) * 12;
          const my = (CY + n.y) / 2 + (dx / len) * 12;
          const on = active === n.id;
          const dim = active !== null && !on;
          return (
            <path
              key={`p-${n.id}`}
              d={`M ${CX} ${CY} Q ${mx} ${my} ${n.x} ${n.y}`}
              aria-hidden
              style={{
                fill: "none",
                stroke: COLOR[n.ref.framework],
                strokeWidth: on ? 3 : 1.5,
                strokeOpacity: dim ? 0.1 : on ? 0.9 : 0.35,
                strokeDasharray: on ? "none" : "4 3",
                transition: "stroke-opacity 150ms, stroke-width 150ms",
              }}
            />
          );
        })}

        <circle cx={CX} cy={CY} r={34} style={{ fill: center }} aria-hidden />
        <text
          x={CX}
          y={CY - 5}
          textAnchor="middle"
          dominantBaseline="middle"
          aria-hidden
          style={{ fill: INK, fontSize: 12, fontWeight: 700, pointerEvents: "none" }}
        >
          {threat.code}
        </text>
        <text
          x={CX}
          y={CY + 9}
          textAnchor="middle"
          dominantBaseline="middle"
          aria-hidden
          style={{ fill: INK, fontSize: 7.5, fontWeight: 500, pointerEvents: "none" }}
        >
          {truncate(threat.shortName ?? threat.name, 18)}
        </text>

        {nodes.map((n) => {
          const on = active === n.id;
          const dim = active !== null && !on;
          return (
            <g
              key={n.id}
              role="link"
              tabIndex={0}
              aria-label={`${n.ref.code}: ${n.ref.name}${n.ref.detail ? `, ${n.ref.detail}` : ""}`}
              onMouseEnter={() => setActive(n.id)}
              onMouseLeave={() => setActive((a) => (a === n.id ? null : a))}
              onFocus={() => setActive(n.id)}
              onBlur={() => setActive((a) => (a === n.id ? null : a))}
              onClick={() => navigate(n.ref.href)}
              onKeyDown={(e) => onKey(e, n)}
              className="cursor-pointer outline-none [&:focus-visible>circle.ring]:opacity-100"
            >
              <circle
                className="ring"
                cx={n.x}
                cy={n.y}
                r={n.r + 4}
                style={{
                  fill: "none",
                  stroke: "hsl(var(--ring))",
                  strokeWidth: 2,
                  opacity: 0,
                }}
              />
              <circle
                cx={n.x}
                cy={n.y}
                r={on ? n.r + 3 : n.r}
                style={{
                  fill: COLOR[n.ref.framework],
                  opacity: dim ? 0.25 : 1,
                  transition: "opacity 150ms",
                }}
              />
              <text
                x={n.x}
                y={n.y}
                textAnchor="middle"
                dominantBaseline="middle"
                aria-hidden
                style={{
                  fill: INK,
                  fontSize: n.r < 15 ? 7 : 8,
                  fontWeight: 600,
                  opacity: dim ? 0.3 : 1,
                  pointerEvents: "none",
                }}
              >
                {truncate(n.short, 8)}
              </text>
            </g>
          );
        })}

        {activeNode && (
          <g aria-hidden style={{ pointerEvents: "none" }}>
            {(() => {
              const label = truncate(
                `${activeNode.ref.code}: ${activeNode.ref.name}${activeNode.ref.detail ? ` · ${activeNode.ref.detail}` : ""}`,
                52,
              );
              const w = Math.min(300, Math.max(120, label.length * 5.3 + 16));
              const x = Math.min(600 - w - 4, Math.max(4, activeNode.x - w / 2));
              const below = activeNode.y < 330;
              const y = below ? activeNode.y + activeNode.r + 8 : activeNode.y - activeNode.r - 30;
              return (
                <>
                  <rect
                    x={x}
                    y={y}
                    width={w}
                    height={22}
                    rx={4}
                    style={{ fill: "hsl(var(--popover))", stroke: "hsl(var(--border))" }}
                  />
                  <text
                    x={x + w / 2}
                    y={y + 11}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{ fill: "hsl(var(--popover-foreground))", fontSize: 9, fontWeight: 500 }}
                  >
                    {label}
                  </text>
                </>
              );
            })()}
          </g>
        )}
      </svg>
    </ChartFrame>
  );
}

export default ThreatConstellation;

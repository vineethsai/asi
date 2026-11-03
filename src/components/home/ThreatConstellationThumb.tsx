/**
 * Thumbnail of the ThreatDetail "constellation" (src/pages/ThreatDetail.tsx): the threat in the
 * centre, its framework mappings around it in three sectors — OWASP Agentic Top 10 (direct
 * `asiMapping` + entries whose `relatedThreats` list it), Cisco objectives (`ciscoMapping`) and
 * AIVSS core risks (`coreRiskScores` whose primary ASI code is mapped). Same data and sector
 * layout as the detail page, drawn small and static. Lazy-loaded by FeaturedThreatCard so the
 * framework datasets stay out of the Home chunk.
 */

import { useMemo } from "react";
import type { Threat } from "@/components/components/securityData";
import { agenticTop10Data } from "@/components/components/owaspAgenticTop10Data";
import { coreRiskScores } from "@/components/components/aivssCalcData";
import { FRAMEWORK_PALETTE } from "@/lib/palette";
import { riskBand, severityColor } from "@/lib/severity";

type SectorKey = "asi" | "cisco" | "aivss";

const SECTORS: { key: SectorKey; label: string; center: number }[] = [
  { key: "asi", label: "ASI", center: -Math.PI / 2 },
  { key: "cisco", label: "Cisco", center: Math.PI / 6 },
  { key: "aivss", label: "AIVSS", center: (5 * Math.PI) / 6 },
];

function constellationMappings(threat: Threat) {
  const asiCodes = threat.asiMapping ?? [];
  const reverse = agenticTop10Data
    .filter((e) => e.relatedThreats.includes(threat.id) && !asiCodes.includes(e.code))
    .map((e) => e.code);
  return {
    asi: [...asiCodes, ...reverse],
    cisco: threat.ciscoMapping ?? [],
    aivss: coreRiskScores.filter((r) => asiCodes.includes(r.asiCode)).map((r) => `#${r.rank}`),
  } satisfies Record<SectorKey, string[]>;
}

export default function ThreatConstellationThumb({
  threat,
  className,
}: {
  threat: Threat;
  className?: string;
}) {
  const W = 220;
  const H = 150;
  const cx = W / 2;
  const cy = H / 2 + 4;
  const R = 54;
  const mappings = useMemo(() => constellationMappings(threat), [threat]);

  const nodes = useMemo(() => {
    const out: { id: string; code: string; key: SectorKey; x: number; y: number }[] = [];
    const span = (2 * Math.PI) / 3;
    const pad = 0.14;
    for (const s of SECTORS) {
      const items = mappings[s.key];
      const start = s.center - span / 2 + span * pad;
      const end = s.center + span / 2 - span * pad;
      items.forEach((code, i) => {
        const t = items.length === 1 ? 0.5 : i / (items.length - 1);
        const a = start + t * (end - start);
        out.push({
          id: `${s.key}-${i}`,
          code,
          key: s.key,
          x: cx + R * Math.cos(a),
          y: cy + R * Math.sin(a),
        });
      });
    }
    return out;
  }, [mappings, cx, cy]);

  const total = nodes.length;
  const summary = `${threat.code} maps to ${mappings.asi.length} OWASP Agentic Top 10 ${
    mappings.asi.length === 1 ? "entry" : "entries"
  }${mappings.asi.length ? ` (${mappings.asi.join(", ")})` : ""}, ${mappings.cisco.length} Cisco ${
    mappings.cisco.length === 1 ? "objective" : "objectives"
  } and ${mappings.aivss.length} AIVSS core ${mappings.aivss.length === 1 ? "risk" : "risks"}.`;
  const centre = severityColor(riskBand(threat.riskScore));

  return (
    <figure className={className}>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={summary}>
        {SECTORS.map((s) => {
          if (!mappings[s.key].length) return null;
          const lx = cx + (R + 22) * Math.cos(s.center);
          const ly = cy + (R + 18) * Math.sin(s.center);
          return (
            <text
              key={s.key}
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="8"
              fontWeight="600"
              fill={FRAMEWORK_PALETTE[s.key].css}
            >
              {s.label}
            </text>
          );
        })}
        {nodes.map((node) => (
          <line
            key={`l-${node.id}`}
            x1={cx}
            y1={cy}
            x2={node.x}
            y2={node.y}
            stroke={FRAMEWORK_PALETTE[node.key].css}
            strokeOpacity={0.45}
            strokeDasharray="3 2"
          />
        ))}
        <circle cx={cx} cy={cy} r={19} fill={centre} />
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="10"
          fontWeight="700"
          fill="hsl(240 10% 8%)"
        >
          {threat.code}
        </text>
        {nodes.map((node) => (
          <g key={node.id}>
            <circle cx={node.x} cy={node.y} r={9.5} fill={FRAMEWORK_PALETTE[node.key].css} />
            <text
              x={node.x}
              y={node.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="5.5"
              fontWeight="700"
              fill="hsl(240 10% 8%)"
            >
              {node.code.replace(/^(ASI|OB-)/, "")}
            </text>
          </g>
        ))}
      </svg>
      <figcaption className="mt-1 text-center text-[11px] text-muted-foreground">
        {total} framework {total === 1 ? "mapping" : "mappings"}
      </figcaption>
    </figure>
  );
}

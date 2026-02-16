import React, { useState, useMemo, Suspense, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Layers, Target, Calculator, Zap, Network } from "lucide-react";

import { ciscoTaxonomyData, getTaxonomyStats } from "@/components/components/ciscoTaxonomyData";
import { agenticTop10Data } from "@/components/components/owaspAgenticTop10Data";
import { coreRiskScores } from "@/components/components/aivssCalcData";
import { threatsData } from "@/components/components/securityData";
import atlasTechniquesData from "@/components/components/atlas_techniques.json";
import atlasTacticsData from "@/components/components/atlas_tactics.json";

const MitreAtlasContent = React.lazy(() =>
  import("./MitreAtlas").then((m) => ({ default: m.MitreAtlasContent })),
);
const CiscoTaxonomyContent = React.lazy(() =>
  import("./CiscoTaxonomy").then((m) => ({ default: m.CiscoTaxonomyContent })),
);
const OwaspAgenticTop10Content = React.lazy(() =>
  import("./OwaspAgenticTop10").then((m) => ({
    default: m.OwaspAgenticTop10Content,
  })),
);
const AIVSSCalculatorContent = React.lazy(() =>
  import("./AIVSSCalculator").then((m) => ({
    default: m.AIVSSCalculatorContent,
  })),
);

interface FrameworkNode {
  id: string;
  name: string;
  shortName: string;
  color: string;
  darkColor: string;
  count: number;
  description: string;
  x: number;
  y: number;
}

interface FrameworkEdge {
  source: string;
  target: string;
  count: number;
  label: string;
}

function useFrameworkData() {
  return useMemo(() => {
    const ciscoStats = getTaxonomyStats();
    const atlasCount = (atlasTechniquesData as unknown[]).length;
    const tacticsCount = (atlasTacticsData as unknown[]).length;
    const threatCount = Object.keys(threatsData).length;

    let atlasToThreats = 0;
    (atlasTechniquesData as { threatMapping?: string[] }[]).forEach((t) => {
      if (t.threatMapping) atlasToThreats += t.threatMapping.length;
    });

    let atlasToCisco = 0;
    ciscoTaxonomyData.forEach((og) => {
      og.ai_tech.forEach((t) => {
        t.mappings.forEach((m) => {
          if (m.includes("MITRE ATLAS")) atlasToCisco++;
        });
        t.ai_subtech.forEach((s) => {
          s.mappings.forEach((m) => {
            if (m.includes("MITRE ATLAS")) atlasToCisco++;
          });
        });
      });
    });

    let ciscoToAgentic = 0;
    agenticTop10Data.forEach((e) => {
      ciscoToAgentic += e.relatedCiscoObjectives.length;
    });

    let ciscoToThreats = 0;
    Object.values(threatsData).forEach((t) => {
      if (t.ciscoMapping) ciscoToThreats += t.ciscoMapping.length;
    });

    let agenticToThreats = 0;
    Object.values(threatsData).forEach((t) => {
      if (t.asiMapping) agenticToThreats += t.asiMapping.length;
    });

    const agenticToAivss = coreRiskScores.length;

    const cx = 350,
      cy = 230,
      r = 175;
    const angleOffset = -Math.PI / 2;
    const pos = (i: number) => ({
      x: cx + r * Math.cos(angleOffset + (i * 2 * Math.PI) / 5),
      y: cy + r * Math.sin(angleOffset + (i * 2 * Math.PI) / 5),
    });

    const nodes: FrameworkNode[] = [
      {
        id: "atlas",
        name: "MITRE ATLAS",
        shortName: "ATLAS",
        color: "#3b82f6",
        darkColor: "#60a5fa",
        count: atlasCount,
        description: `${tacticsCount} tactics, ${atlasCount} techniques`,
        ...pos(0),
      },
      {
        id: "cisco",
        name: "Cisco AI Taxonomy",
        shortName: "Cisco",
        color: "#06b6d4",
        darkColor: "#22d3ee",
        count: ciscoStats.objectiveGroups,
        description: `${ciscoStats.objectiveGroups} objectives, ${ciscoStats.techniques} techniques`,
        ...pos(1),
      },
      {
        id: "agentic",
        name: "OWASP Agentic Top 10",
        shortName: "Agentic",
        color: "#f43f5e",
        darkColor: "#fb7185",
        count: 10,
        description: "10 core agentic security risks",
        ...pos(2),
      },
      {
        id: "aivss",
        name: "AIVSS Calculator",
        shortName: "AIVSS",
        color: "#f59e0b",
        darkColor: "#fbbf24",
        count: coreRiskScores.length,
        description: `${coreRiskScores.length} pre-scored core risks`,
        ...pos(3),
      },
      {
        id: "threats",
        name: "Threat Model",
        shortName: "Threats",
        color: "#8b5cf6",
        darkColor: "#a78bfa",
        count: threatCount,
        description: `${threatCount} identified agent threats`,
        ...pos(4),
      },
    ];

    const edges: FrameworkEdge[] = [
      {
        source: "atlas",
        target: "threats",
        count: atlasToThreats,
        label: "technique→threat mappings",
      },
      {
        source: "atlas",
        target: "cisco",
        count: atlasToCisco,
        label: "Cisco→ATLAS references",
      },
      {
        source: "cisco",
        target: "agentic",
        count: ciscoToAgentic,
        label: "Agentic→Cisco objectives",
      },
      {
        source: "cisco",
        target: "threats",
        count: ciscoToThreats,
        label: "threat→Cisco mappings",
      },
      {
        source: "agentic",
        target: "threats",
        count: agenticToThreats,
        label: "threat→ASI mappings",
      },
      {
        source: "agentic",
        target: "aivss",
        count: agenticToAivss,
        label: "AIVSS scored risks",
      },
    ].filter((e) => e.count > 0);

    return { nodes, edges };
  }, []);
}

function FrameworkVisualization({ onSelectTab }: { onSelectTab: (tab: string) => void }) {
  const { nodes, edges } = useFrameworkData();
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<number | null>(null);

  const getNode = useCallback((id: string) => nodes.find((n) => n.id === id)!, [nodes]);

  const getCurvedPath = useCallback(
    (edge: FrameworkEdge, index: number) => {
      const s = getNode(edge.source);
      const t = getNode(edge.target);
      const mx = (s.x + t.x) / 2;
      const my = (s.y + t.y) / 2;
      const dx = t.x - s.x;
      const dy = t.y - s.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const offset = 25 + (index % 2) * 15;
      const sign = index % 2 === 0 ? 1 : -1;
      const nx = (-dy / len) * offset * sign;
      const ny = (dx / len) * offset * sign;
      return `M ${s.x} ${s.y} Q ${mx + nx} ${my + ny} ${t.x} ${t.y}`;
    },
    [getNode],
  );

  const getEdgeMidpoint = useCallback(
    (edge: FrameworkEdge, index: number) => {
      const s = getNode(edge.source);
      const t = getNode(edge.target);
      const mx = (s.x + t.x) / 2;
      const my = (s.y + t.y) / 2;
      const dx = t.x - s.x;
      const dy = t.y - s.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const offset = 12 + (index % 2) * 8;
      const sign = index % 2 === 0 ? 1 : -1;
      return {
        x: mx + (-dy / len) * offset * sign,
        y: my + (dx / len) * offset * sign,
      };
    },
    [getNode],
  );

  const isEdgeConnected = useCallback((edge: FrameworkEdge, nodeId: string | null) => {
    if (!nodeId) return false;
    return edge.source === nodeId || edge.target === nodeId;
  }, []);

  const tabMap: Record<string, string> = {
    atlas: "mitre-atlas",
    cisco: "cisco",
    agentic: "owasp-agentic",
    aivss: "aivss",
    threats: "overview",
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-2 sm:p-6">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
            <Network className="h-5 w-5 text-primary" />
            Framework Interconnection Map
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Click a framework to explore. Hover to see connections.
          </p>
        </div>

        <svg viewBox="0 0 700 460" className="w-full max-w-3xl mx-auto" style={{ minHeight: 300 }}>
          <defs>
            {nodes.map((node) => (
              <radialGradient
                key={`grad-${node.id}`}
                id={`grad-${node.id}`}
                cx="40%"
                cy="35%"
                r="60%"
              >
                <stop offset="0%" stopColor={node.darkColor} stopOpacity="1" />
                <stop offset="100%" stopColor={node.color} stopOpacity="1" />
              </radialGradient>
            ))}
          </defs>

          {edges.map((edge, i) => {
            const connected = isEdgeConnected(edge, hoveredNode);
            const hovered = hoveredEdge === i;
            const dimmed = hoveredNode && !connected;
            const thickness = Math.max(2, Math.min(8, edge.count / 5));

            return (
              <g key={`edge-${i}`}>
                <path
                  d={getCurvedPath(edge, i)}
                  fill="none"
                  stroke={hovered || connected ? getNode(edge.source).color : "currentColor"}
                  strokeWidth={hovered ? thickness + 2 : thickness}
                  strokeOpacity={dimmed ? 0.1 : hovered || connected ? 0.8 : 0.25}
                  strokeDasharray={hovered ? "none" : "6 4"}
                  className="transition-all duration-300 text-muted-foreground"
                  onMouseEnter={() => setHoveredEdge(i)}
                  onMouseLeave={() => setHoveredEdge(null)}
                  style={{ cursor: "pointer" }}
                />
                {(() => {
                  const mid = getEdgeMidpoint(edge, i);
                  return (
                    <g
                      onMouseEnter={() => setHoveredEdge(i)}
                      onMouseLeave={() => setHoveredEdge(null)}
                      style={{ cursor: "pointer" }}
                    >
                      <rect
                        x={mid.x - 14}
                        y={mid.y - 10}
                        width={28}
                        height={20}
                        rx={10}
                        fill={
                          hovered || connected ? getNode(edge.source).color : "hsl(var(--muted))"
                        }
                        stroke={
                          hovered || connected ? getNode(edge.source).color : "hsl(var(--border))"
                        }
                        strokeWidth="1"
                        opacity={dimmed ? 0.2 : 1}
                        className="transition-all duration-300"
                      />
                      <text
                        x={mid.x}
                        y={mid.y + 1}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="11"
                        fontWeight="600"
                        fill={hovered || connected ? "white" : "hsl(var(--muted-foreground))"}
                        opacity={dimmed ? 0.2 : 1}
                        className="transition-all duration-300"
                      >
                        {edge.count}
                      </text>
                      {hovered && (
                        <text
                          x={mid.x}
                          y={mid.y + 20}
                          textAnchor="middle"
                          fontSize="10"
                          fill="hsl(var(--muted-foreground))"
                          fontWeight="500"
                        >
                          {edge.label}
                        </text>
                      )}
                    </g>
                  );
                })()}
              </g>
            );
          })}

          {nodes.map((node) => {
            const dimmed =
              hoveredNode &&
              hoveredNode !== node.id &&
              !edges.some(
                (e) =>
                  (e.source === hoveredNode && e.target === node.id) ||
                  (e.target === hoveredNode && e.source === node.id),
              );
            const isHovered = hoveredNode === node.id;

            return (
              <g
                key={node.id}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => onSelectTab(tabMap[node.id])}
                style={{ cursor: "pointer" }}
                className="transition-all duration-300"
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isHovered ? 42 : 38}
                  fill={`url(#grad-${node.id})`}
                  opacity={dimmed ? 0.25 : 1}
                  className="transition-all duration-300"
                  filter={isHovered ? "url(#glow)" : undefined}
                />
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isHovered ? 44 : 40}
                  fill="none"
                  stroke={node.color}
                  strokeWidth={isHovered ? 3 : 1.5}
                  strokeOpacity={dimmed ? 0.15 : isHovered ? 0.9 : 0.5}
                  className="transition-all duration-300"
                />
                <text
                  x={node.x}
                  y={node.y - 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="12"
                  fontWeight="700"
                  opacity={dimmed ? 0.25 : 1}
                  className="transition-all duration-300 pointer-events-none"
                >
                  {node.shortName}
                </text>
                <text
                  x={node.x}
                  y={node.y + 12}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="10"
                  fontWeight="500"
                  opacity={dimmed ? 0.2 : 0.85}
                  className="transition-all duration-300 pointer-events-none"
                >
                  ({node.count})
                </text>
                <text
                  x={node.x}
                  y={node.y + (node.y < 230 ? -52 : 56)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="hsl(var(--foreground))"
                  fontSize="11"
                  fontWeight="600"
                  opacity={dimmed ? 0.2 : 1}
                  className="transition-all duration-300 pointer-events-none"
                >
                  {node.name}
                </text>
                {isHovered && (
                  <text
                    x={node.x}
                    y={node.y + (node.y < 230 ? -40 : 68)}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="hsl(var(--muted-foreground))"
                    fontSize="9"
                    className="pointer-events-none"
                  >
                    {node.description}
                  </text>
                )}
              </g>
            );
          })}

          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>
      </CardContent>
    </Card>
  );
}

function MappingMatrix() {
  const { nodes, edges } = useFrameworkData();

  const matrix = useMemo(() => {
    const m: Record<string, Record<string, number>> = {};
    nodes.forEach((n) => {
      m[n.id] = {};
      nodes.forEach((n2) => {
        m[n.id][n2.id] = 0;
      });
    });
    edges.forEach((e) => {
      m[e.source][e.target] = e.count;
      m[e.target][e.source] = e.count;
    });
    return m;
  }, [nodes, edges]);

  const maxCount = useMemo(() => {
    let max = 0;
    edges.forEach((e) => {
      if (e.count > max) max = e.count;
    });
    return max || 1;
  }, [edges]);

  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <h3 className="text-lg font-semibold mb-4">Cross-Reference Density Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground" />
                {nodes.map((n) => (
                  <th
                    key={n.id}
                    className="py-2 px-3 text-center font-medium"
                    style={{ color: n.color }}
                  >
                    {n.shortName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {nodes.map((row) => (
                <tr key={row.id} className="border-t">
                  <td
                    className="py-2 px-3 font-medium whitespace-nowrap"
                    style={{ color: row.color }}
                  >
                    {row.shortName}
                  </td>
                  {nodes.map((col) => {
                    const count = matrix[row.id][col.id];
                    const intensity = count / maxCount;
                    return (
                      <td key={col.id} className="py-2 px-3 text-center">
                        {row.id === col.id ? (
                          <span className="text-muted-foreground/30">-</span>
                        ) : count > 0 ? (
                          <Badge
                            variant="outline"
                            className="text-xs font-mono"
                            style={{
                              backgroundColor: `${row.color}${Math.round(intensity * 40 + 10)
                                .toString(16)
                                .padStart(2, "0")}`,
                              borderColor: row.color,
                              color: intensity > 0.5 ? "white" : undefined,
                            }}
                          >
                            {count}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground/30">0</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

const SANKEY_FLABEL: Record<string, string> = {
  asi: "OWASP Agentic",
  cisco: "Cisco Taxonomy",
  aivss: "AIVSS",
};

/* ─── Global Sankey Flow Diagram ─── */
function ThreatSankeyDiagram() {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const navigate = useNavigate();

  const FCOLORS: Record<string, string> = {
    asi: "#f43f5e",
    cisco: "#06b6d4",
    aivss: "#f59e0b",
  };

  const { connectedThreats, frameworkItems, links, fwGroups } = useMemo(() => {
    const allThreats = Object.values(threatsData) as {
      id: string;
      name?: string;
      color?: string;
      asiMapping?: string[];
      ciscoMapping?: string[];
    }[];
    const linksArr: Array<{
      threatId: string;
      targetId: string;
      framework: string;
    }> = [];
    const fwMap = new Map<
      string,
      { id: string; code: string; name: string; framework: string; link: string }
    >();

    for (const t of allThreats) {
      const asiCodes: string[] = t.asiMapping || [];

      for (const code of asiCodes) {
        const entry = agenticTop10Data.find((e) => e.code === code);
        if (entry) {
          const id = `asi-${entry.code}`;
          fwMap.set(id, {
            id,
            code: entry.code,
            name: entry.name,
            framework: "asi",
            link: "/taxonomy?tab=owasp-agentic",
          });
          linksArr.push({ threatId: t.id, targetId: id, framework: "asi" });
        }
      }

      for (const entry of agenticTop10Data) {
        if (entry.relatedThreats.includes(t.id) && !asiCodes.includes(entry.code)) {
          const id = `asi-${entry.code}`;
          fwMap.set(id, {
            id,
            code: entry.code,
            name: entry.name,
            framework: "asi",
            link: "/taxonomy?tab=owasp-agentic",
          });
          if (!linksArr.some((l) => l.threatId === t.id && l.targetId === id)) {
            linksArr.push({ threatId: t.id, targetId: id, framework: "asi" });
          }
        }
      }

      const ciscoCodes: string[] = t.ciscoMapping || [];
      for (const code of ciscoCodes) {
        const entry = ciscoTaxonomyData.find((og) => og.code === code);
        if (entry) {
          const id = `cisco-${entry.code}`;
          fwMap.set(id, {
            id,
            code: entry.code,
            name: entry.description,
            framework: "cisco",
            link: "/taxonomy?tab=cisco",
          });
          linksArr.push({ threatId: t.id, targetId: id, framework: "cisco" });
        }
      }

      for (const risk of coreRiskScores) {
        if (asiCodes.includes(risk.asiCode)) {
          const id = `aivss-${risk.rank}`;
          fwMap.set(id, {
            id,
            code: `#${risk.rank}`,
            name: risk.name,
            framework: "aivss",
            link: "/taxonomy?tab=aivss",
          });
          if (!linksArr.some((l) => l.threatId === t.id && l.targetId === id)) {
            linksArr.push({ threatId: t.id, targetId: id, framework: "aivss" });
          }
        }
      }
    }

    const connected = allThreats
      .filter((t) => linksArr.some((l) => l.threatId === t.id))
      .sort((a, b) => a.id.localeCompare(b.id));

    const items = Array.from(fwMap.values()).sort((a, b) => {
      const ord: Record<string, number> = { asi: 0, cisco: 1, aivss: 2 };
      if (ord[a.framework] !== ord[b.framework]) return ord[a.framework] - ord[b.framework];
      return a.code.localeCompare(b.code);
    });

    const groups: Array<{
      framework: string;
      label: string;
      startIdx: number;
      endIdx: number;
    }> = [];
    let curFw = "";
    let startI = 0;
    items.forEach((item, i) => {
      if (item.framework !== curFw) {
        if (curFw) {
          groups.push({
            framework: curFw,
            label: SANKEY_FLABEL[curFw] || curFw,
            startIdx: startI,
            endIdx: i - 1,
          });
        }
        curFw = item.framework;
        startI = i;
      }
    });
    if (curFw) {
      groups.push({
        framework: curFw,
        label: SANKEY_FLABEL[curFw] || curFw,
        startIdx: startI,
        endIdx: items.length - 1,
      });
    }

    return {
      connectedThreats: connected,
      frameworkItems: items,
      links: linksArr,
      fwGroups: groups,
    };
  }, []);

  const nodeW = 140;
  const nodeH = 24;
  const leftX = 30;
  const rightX = 830;
  const maxItems = Math.max(connectedThreats.length, frameworkItems.length);
  const rowH = Math.max(22, Math.min(32, 550 / maxItems));
  const topPad = 36;
  const svgH = maxItems * rowH + topPad * 2;

  const threatY = useCallback(
    (i: number) => {
      const totalH = connectedThreats.length * rowH;
      const offset = (svgH - totalH) / 2;
      return offset + i * rowH + rowH / 2;
    },
    [connectedThreats.length, rowH, svgH],
  );

  const fwY = useCallback(
    (i: number) => {
      const totalH = frameworkItems.length * rowH;
      const offset = (svgH - totalH) / 2;
      return offset + i * rowH + rowH / 2;
    },
    [frameworkItems.length, rowH, svgH],
  );

  const threatPosMap = useMemo(() => {
    const m = new Map<string, number>();
    connectedThreats.forEach((t, i) => m.set(t.id, threatY(i)));
    return m;
  }, [connectedThreats, threatY]);

  const fwPosMap = useMemo(() => {
    const m = new Map<string, number>();
    frameworkItems.forEach((f, i) => m.set(f.id, fwY(i)));
    return m;
  }, [frameworkItems, fwY]);

  const connectedIds = useMemo(() => {
    if (!hoveredItem) return new Set<string>();
    const s = new Set<string>();
    s.add(hoveredItem);
    links.forEach((l) => {
      if (l.threatId === hoveredItem) s.add(l.targetId);
      if (l.targetId === hoveredItem) s.add(l.threatId);
    });
    return s;
  }, [hoveredItem, links]);

  const highlightedLinks = useMemo(() => {
    if (!hoveredItem) return new Set<number>();
    const s = new Set<number>();
    links.forEach((l, i) => {
      if (l.threatId === hoveredItem || l.targetId === hoveredItem) s.add(i);
    });
    return s;
  }, [hoveredItem, links]);

  if (connectedThreats.length === 0) return null;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-2 sm:p-6">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold flex items-center justify-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Threat-to-Framework Flow Map
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Hover to trace connections between threats and framework items. Click to navigate.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mb-3">
          {(["asi", "cisco", "aivss"] as const).map((fw) => (
            <div key={fw} className="flex items-center gap-1.5 text-xs">
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: FCOLORS[fw] }} />
              <span className="text-muted-foreground">{SANKEY_FLABEL[fw]}</span>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 1000 ${svgH}`}
            className="w-full"
            style={{ minHeight: 260, maxHeight: 650 }}
          >
            {/* Column titles */}
            <text
              x={leftX + nodeW / 2}
              y={14}
              textAnchor="middle"
              fontSize="11"
              fontWeight="700"
              fill="hsl(var(--foreground))"
            >
              Threats
            </text>
            <text
              x={rightX + nodeW / 2}
              y={14}
              textAnchor="middle"
              fontSize="11"
              fontWeight="700"
              fill="hsl(var(--foreground))"
            >
              Framework Items
            </text>

            {/* Framework group brackets */}
            {fwGroups.map((g) => {
              const y1 = fwY(g.startIdx) - rowH / 2 + 2;
              const y2 = fwY(g.endIdx) + rowH / 2 - 2;
              const midY = (y1 + y2) / 2;
              return (
                <g key={g.framework}>
                  <line
                    x1={rightX - 8}
                    y1={y1}
                    x2={rightX - 8}
                    y2={y2}
                    stroke={FCOLORS[g.framework]}
                    strokeWidth={2.5}
                    strokeOpacity={0.5}
                    strokeLinecap="round"
                  />
                  <text
                    x={rightX - 14}
                    y={midY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="9"
                    fontWeight="600"
                    fill={FCOLORS[g.framework]}
                    opacity={0.7}
                    transform={`rotate(-90, ${rightX - 14}, ${midY})`}
                  >
                    {g.label}
                  </text>
                </g>
              );
            })}

            {/* Flow paths */}
            {links.map((link, i) => {
              const y1 = threatPosMap.get(link.threatId);
              const y2 = fwPosMap.get(link.targetId);
              if (y1 === undefined || y2 === undefined) return null;

              const x1 = leftX + nodeW;
              const x2 = rightX;
              const cpx = (x1 + x2) / 2;

              const isHl = highlightedLinks.has(i);
              const isDim = hoveredItem !== null && !isHl;

              return (
                <path
                  key={`sl-${i}`}
                  d={`M ${x1} ${y1} C ${cpx} ${y1} ${cpx} ${y2} ${x2} ${y2}`}
                  fill="none"
                  stroke={FCOLORS[link.framework]}
                  strokeWidth={isHl ? 2.5 : 1}
                  strokeOpacity={isDim ? 0.03 : isHl ? 0.75 : 0.15}
                  className="transition-all duration-200"
                />
              );
            })}

            {/* Threat nodes (left column) */}
            {connectedThreats.map((threat, i) => {
              const y = threatY(i);
              const isDim = hoveredItem !== null && !connectedIds.has(threat.id);
              const isActive = hoveredItem === threat.id;
              return (
                <g
                  key={`st-${threat.id}`}
                  onMouseEnter={() => setHoveredItem(threat.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  onClick={() => navigate(`/threats/${threat.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <rect
                    x={leftX}
                    y={y - nodeH / 2}
                    width={nodeW}
                    height={nodeH}
                    rx={4}
                    fill={threat.color || "#8b5cf6"}
                    opacity={isDim ? 0.12 : isActive ? 1 : 0.85}
                    className="transition-all duration-200"
                  />
                  {isActive && (
                    <rect
                      x={leftX - 2}
                      y={y - nodeH / 2 - 2}
                      width={nodeW + 4}
                      height={nodeH + 4}
                      rx={6}
                      fill="none"
                      stroke={threat.color || "#8b5cf6"}
                      strokeWidth={2}
                      strokeOpacity={0.6}
                    />
                  )}
                  <text
                    x={leftX + nodeW / 2}
                    y={y + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="9"
                    fontWeight="600"
                    opacity={isDim ? 0.12 : 1}
                    className="pointer-events-none transition-opacity duration-200"
                  >
                    {(threat.name as string).length > 20
                      ? (threat.name as string).substring(0, 18) + "\u2026"
                      : threat.name}
                  </text>
                </g>
              );
            })}

            {/* Framework item nodes (right column) */}
            {frameworkItems.map((item, i) => {
              const y = fwY(i);
              const isDim = hoveredItem !== null && !connectedIds.has(item.id);
              const isActive = hoveredItem === item.id;
              const label = `${item.code}: ${item.name}`;
              return (
                <g
                  key={`sf-${item.id}`}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  onClick={() => navigate(item.link)}
                  style={{ cursor: "pointer" }}
                >
                  <rect
                    x={rightX}
                    y={y - nodeH / 2}
                    width={nodeW}
                    height={nodeH}
                    rx={4}
                    fill={FCOLORS[item.framework]}
                    opacity={isDim ? 0.12 : isActive ? 1 : 0.85}
                    className="transition-all duration-200"
                  />
                  {isActive && (
                    <rect
                      x={rightX - 2}
                      y={y - nodeH / 2 - 2}
                      width={nodeW + 4}
                      height={nodeH + 4}
                      rx={6}
                      fill="none"
                      stroke={FCOLORS[item.framework]}
                      strokeWidth={2}
                      strokeOpacity={0.6}
                    />
                  )}
                  <text
                    x={rightX + nodeW / 2}
                    y={y + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize="9"
                    fontWeight="600"
                    opacity={isDim ? 0.12 : 1}
                    className="pointer-events-none transition-opacity duration-200"
                  >
                    {label.length > 20 ? label.substring(0, 18) + "\u2026" : label}
                  </text>
                  {isActive && (
                    <text
                      x={rightX + nodeW + 6}
                      y={y + 1}
                      textAnchor="start"
                      dominantBaseline="middle"
                      fill="hsl(var(--foreground))"
                      fontSize="9"
                      fontWeight="500"
                      className="pointer-events-none"
                    >
                      {item.name.length > 30 ? item.name.substring(0, 28) + "\u2026" : item.name}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}

const TabLoader = () => (
  <div className="flex items-center justify-center py-16">
    <div className="flex flex-col items-center gap-4">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

export default function Taxonomy() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";

  const handleTabChange = useCallback(
    (value: string) => {
      if (value === "overview") {
        setSearchParams({});
      } else {
        setSearchParams({ tab: value });
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [setSearchParams],
  );

  const { nodes, edges: allEdges } = useFrameworkData();
  const _totalMappings = useMemo(() => {
    return allEdges.reduce((sum, e) => sum + e.count, 0);
  }, [allEdges]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Network className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">AI Security Taxonomy</h1>
              <p className="text-muted-foreground">
                Unified view of AI security frameworks, standards, and their interconnections
              </p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <div className="overflow-x-auto -mx-4 px-4 mb-6">
            <TabsList className="inline-flex w-auto min-w-full sm:min-w-0 bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="overview" className="gap-1.5">
                <Network className="h-4 w-4" />
                <span className="hidden sm:inline">Overview & Mapping</span>
                <span className="sm:hidden">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="mitre-atlas" className="gap-1.5">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">MITRE ATLAS</span>
                <span className="sm:hidden">ATLAS</span>
              </TabsTrigger>
              <TabsTrigger value="cisco" className="gap-1.5">
                <Layers className="h-4 w-4" />
                <span className="hidden sm:inline">Cisco Taxonomy</span>
                <span className="sm:hidden">Cisco</span>
              </TabsTrigger>
              <TabsTrigger value="owasp-agentic" className="gap-1.5">
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">Agentic Top 10</span>
                <span className="sm:hidden">Agentic</span>
              </TabsTrigger>
              <TabsTrigger value="aivss" className="gap-1.5">
                <Calculator className="h-4 w-4" />
                <span className="hidden sm:inline">AIVSS Calculator</span>
                <span className="sm:hidden">AIVSS</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="mt-0 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {nodes.map((fw) => (
                <Card
                  key={fw.id}
                  className="cursor-pointer hover:shadow-md transition-all group"
                  onClick={() =>
                    handleTabChange(
                      fw.id === "threats"
                        ? "overview"
                        : fw.id === "atlas"
                          ? "mitre-atlas"
                          : fw.id === "agentic"
                            ? "owasp-agentic"
                            : fw.id,
                    )
                  }
                >
                  <CardContent className="p-4 text-center">
                    <div
                      className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center text-white group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: fw.color }}
                    >
                      {fw.id === "atlas" && <Shield className="h-5 w-5" />}
                      {fw.id === "cisco" && <Layers className="h-5 w-5" />}
                      {fw.id === "agentic" && <Target className="h-5 w-5" />}
                      {fw.id === "aivss" && <Calculator className="h-5 w-5" />}
                      {fw.id === "threats" && <Zap className="h-5 w-5" />}
                    </div>
                    <div className="text-2xl font-bold" style={{ color: fw.color }}>
                      {fw.count}
                    </div>
                    <div className="text-xs font-medium mt-1">{fw.shortName}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 leading-tight">
                      {fw.description}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <ThreatSankeyDiagram />
            <FrameworkVisualization onSelectTab={handleTabChange} />
            <MappingMatrix />
          </TabsContent>

          <TabsContent value="mitre-atlas" className="mt-0">
            <Suspense fallback={<TabLoader />}>
              <MitreAtlasContent />
            </Suspense>
          </TabsContent>

          <TabsContent value="cisco" className="mt-0">
            <Suspense fallback={<TabLoader />}>
              <CiscoTaxonomyContent />
            </Suspense>
          </TabsContent>

          <TabsContent value="owasp-agentic" className="mt-0">
            <Suspense fallback={<TabLoader />}>
              <OwaspAgenticTop10Content />
            </Suspense>
          </TabsContent>

          <TabsContent value="aivss" className="mt-0">
            <Suspense fallback={<TabLoader />}>
              <AIVSSCalculatorContent />
            </Suspense>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}

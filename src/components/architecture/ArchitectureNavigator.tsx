import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import * as d3 from "d3";
import { architecturesData, Architecture } from "../components/architecturesData";
import { frameworkData, type ComponentNode } from "../components/frameworkData";
import { threatsData, mitigationsData } from "../components/securityData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize,
  Minimize,
  X,
  ExternalLink,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: "architecture" | "component" | "threat" | "mitigation";
  description: string;
  color: string;
  size: number;
  riskScore?: number;
  tags?: string[];
  parentArchId?: string;
  parentCompId?: string;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  type: "arch-comp" | "comp-threat" | "threat-mitigation";
}

// ── Component data map ─────────────────────────────────────────────────────

const componentDataMap: Record<string, { title: string; description: string }> = {
  "kc1.1": {
    title: "Large Language Models (LLMs)",
    description:
      "Core cognitive engine utilizing pre-trained foundation models for reasoning, planning, and generation.",
  },
  "kc1.2": {
    title: "Multimodal LLMs (MLLMs)",
    description:
      "LLMs capable of processing and/or generating information across multiple data types beyond text.",
  },
  "kc1.3": {
    title: "Small-Language Models (SLMs)",
    description:
      "Language models with fewer parameters, trained on smaller, focused datasets, designed for specific tasks.",
  },
  "kc1.4": {
    title: "Fine-tuned Models",
    description:
      "Language models that undergo additional training on specific datasets to specialize their capabilities.",
  },
  "kc2.1": {
    title: "Workflows",
    description:
      "Structured, pre-defined sequence of tasks or steps that agents follow to achieve a goal.",
  },
  "kc2.2": {
    title: "Hierarchical Planning",
    description:
      "Multiple agents collaborating via an orchestrator that decomposes tasks and routes sub-tasks.",
  },
  "kc2.3": {
    title: "Multi-agent Collaboration",
    description:
      "Multiple agents working together, communicating and coordinating actions to achieve a common goal.",
  },
  "kc3.1": {
    title: "Structured Planning / Execution",
    description:
      "Focuses on decomposing tasks into a formal plan, defining sequences of actions and executing the plan.",
  },
  "kc3.2": {
    title: "ReAct (Reason + Act)",
    description:
      "Dynamically interleaves reasoning steps with actions and updates reasoning based on feedback.",
  },
  "kc3.3": {
    title: "Chain of Thought (CoT)",
    description:
      'Enhances reasoning quality by prompting step-by-step "thinking" before arriving at a final action.',
  },
  "kc3.4": {
    title: "Tree of Thoughts (ToT)",
    description: "Generalizes CoT by exploring multiple reasoning paths and plans in parallel.",
  },
  "kc4.1": {
    title: "In-agent session memory",
    description: "Memory limited to a single agent and a single session.",
  },
  "kc4.2": {
    title: "Cross-agent session memory",
    description: "Memory shared across multiple agents but limited to a single session.",
  },
  "kc4.3": {
    title: "In-agent cross-session memory",
    description: "Memory limited to a single agent but shared across multiple sessions.",
  },
  "kc4.4": {
    title: "Cross-agent cross-session memory",
    description: "Memory shared across multiple agents and sessions.",
  },
  "kc4.5": {
    title: "In-agent cross-user memory",
    description: "Memory limited to a single agent but shared across multiple users.",
  },
  "kc4.6": {
    title: "Cross-agent cross-user memory",
    description: "Memory shared across multiple agents and users.",
  },
  "kc5.1": {
    title: "Flexible Libraries / SDK Features",
    description: "Code-level building blocks (e.g., LangChain, CrewAI) offering high flexibility.",
  },
  "kc5.2": {
    title: "Managed Platforms / Services",
    description: "Vendor-provided solutions handling infrastructure and simplifying setup.",
  },
  "kc5.3": {
    title: "Managed APIs",
    description:
      "Vendor-hosted services providing higher-level abstractions, managing state via API calls.",
  },
  "kc6.1": {
    title: "API Access",
    description: "Agents utilizing LLM capabilities to interact with APIs.",
  },
  "kc6.1.1": {
    title: "Limited API Access",
    description: "Agent generates some parameters for a predefined API call.",
  },
  "kc6.1.2": {
    title: "Extensive API Access",
    description: "Agent generates the entire API call.",
  },
  "kc6.2": {
    title: "Code Execution",
    description: "Agents utilizing LLM capabilities for code-related tasks.",
  },
  "kc6.2.1": {
    title: "Limited Code Execution",
    description: "Agent generates parameters for a predefined function.",
  },
  "kc6.2.2": {
    title: "Extensive Code Execution",
    description: "Agent runs LLM-generated code. Compromise can lead to arbitrary code execution.",
  },
  "kc6.3": {
    title: "Database Execution",
    description: "Agents utilizing LLM capabilities to interact with databases.",
  },
  "kc6.3.1": {
    title: "Limited DB Execution",
    description: "Agent runs specific queries with limited permissions.",
  },
  "kc6.3.2": {
    title: "Extensive DB Execution",
    description: "Agent generates and runs all CRUD operations.",
  },
  "kc6.3.3": {
    title: "RAG Data Sources",
    description: "Agent uses external datasources for context or updates records.",
  },
  "kc6.4": {
    title: "Web Access (Web-Use)",
    description: "Agent utilizing LLM for browser operations.",
  },
  "kc6.5": {
    title: "PC Operations (PC-Use)",
    description: "Agent utilizing LLM for OS operations, including file system.",
  },
  "kc6.6": {
    title: "Operating Critical Systems",
    description: "Agent utilizing LLM to operate critical systems (e.g., SCADA).",
  },
  "kc6.7": {
    title: "Access to IoT Devices",
    description: "Agent controlling IoT devices.",
  },
  kc1: {
    title: "Language Models (LLMs)",
    description:
      'The core cognitive engine or "brain" of the agent, responsible for understanding, reasoning, planning, and generating responses.',
  },
  kc2: {
    title: "Orchestration (Control Flow)",
    description:
      "Mechanisms that dictate the agent's overall behavior, information flow, and decision-making processes.",
  },
  kc3: {
    title: "Reasoning / Planning Paradigm",
    description:
      "How agents utilize LLMs to solve complex tasks requiring multiple steps and strategic thinking.",
  },
  kc4: {
    title: "Memory Modules",
    description:
      "Enable the agent to retain short-term and long-term information for coherent and personalized interactions.",
  },
  kc5: {
    title: "Tool Integration Frameworks",
    description:
      "Allow agents to extend capabilities by using external tools to interact with the real world or other systems.",
  },
  kc6: {
    title: "Operational Environment",
    description: "API access, code execution, database operations.",
  },
};

const getComponentDataById = (id: string) => {
  const componentData = componentDataMap[id];
  if (componentData) return componentData;
  const searchInFramework = (nodes: ComponentNode[]): ComponentNode | null => {
    for (const node of nodes) {
      if (node.id === id || node.id.replace(/-/g, ".") === id) return node;
      if (node.children) {
        const found = searchInFramework(node.children);
        if (found) return found;
      }
    }
    return null;
  };
  return searchInFramework(frameworkData);
};

// ── Constants ──────────────────────────────────────────────────────────────

const NODE_COLORS = {
  architecture: "#3b82f6",
  component: "#22c55e",
  threat: "#ef4444",
  mitigation: "#f59e0b",
} as const;

const LINK_COLORS = {
  "arch-comp": "#3b82f680",
  "comp-threat": "#ef444460",
  "threat-mitigation": "#f59e0b60",
} as const;

function getDetailPath(node: GraphNode): string | null {
  switch (node.type) {
    case "architecture":
      return `/architectures/${node.id}`;
    case "component":
      return `/components/${node.id}`;
    case "threat":
      return `/threats/${node.id}`;
    case "mitigation":
      return `/controls`;
    default:
      return null;
  }
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.substring(0, max) + "\u2026" : text;
}

// ── Main Component ─────────────────────────────────────────────────────────

const ArchitectureNavigator: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const explorerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 200);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedArchitectures, setExpandedArchitectures] = useState<Set<string>>(new Set());
  const [expandedComponents, setExpandedComponents] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    architecture: true,
    component: true,
    threat: true,
    mitigation: true,
  });

  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    name: string;
    type: string;
  } | null>(null);

  // ── All architectures ────────────────────────────────────────────────
  const allArchitectures = useMemo(() => Object.values(architecturesData), []);

  // ── Build graph data based on expanded state ─────────────────────────
  const { nodes, links } = useMemo(() => {
    const nodeMap = new Map<string, GraphNode>();
    const linkArray: GraphLink[] = [];

    const addNode = (
      id: string,
      name: string,
      type: GraphNode["type"],
      description: string,
      size: number,
      extra?: Partial<GraphNode>,
    ) => {
      if (!nodeMap.has(id)) {
        nodeMap.set(id, {
          id,
          name,
          type,
          description,
          color: NODE_COLORS[type],
          size,
          ...extra,
        });
      }
    };

    // Always add architecture nodes
    allArchitectures.forEach((arch: Architecture) => {
      addNode(arch.id, arch.name, "architecture", arch.description, 45, {
        riskScore: arch.riskScore,
        tags: arch.tags,
      });
    });

    // Add children for expanded architectures
    expandedArchitectures.forEach((archId) => {
      const arch = architecturesData[archId];
      if (!arch) return;

      (arch.keyComponents || []).forEach((compId) => {
        const comp = getComponentDataById(compId);
        if (!comp) return;
        addNode(compId, comp.title, "component", comp.description || "", 30, {
          parentArchId: archId,
          tags: (comp as ComponentNode).threatCategories,
        });
        linkArray.push({ source: archId, target: compId, type: "arch-comp" });

        // Add threats/mitigations for expanded components
        if (expandedComponents.has(compId)) {
          (arch.threatIds || []).forEach((threatId) => {
            const threat = threatsData[threatId];
            if (!threat) return;
            const normalizedCompId = compId.replace(/\./g, "-");
            const mainCompId = compId.includes(".") ? compId.split(".")[0] : compId;
            const affects = threat.componentIds?.some(
              (tCompId) =>
                tCompId === compId ||
                tCompId === normalizedCompId ||
                tCompId === mainCompId ||
                tCompId.replace(/-/g, ".") === compId,
            );
            if (!affects) return;

            addNode(threatId, threat.name, "threat", threat.description, 20, {
              riskScore: threat.riskScore,
              tags: threat.tags,
              parentCompId: compId,
              parentArchId: archId,
            });
            linkArray.push({ source: compId, target: threatId, type: "comp-threat" });

            (arch.mitigationIds || []).forEach((mitId) => {
              const mit = mitigationsData[mitId];
              if (mit && mit.threatIds?.includes(threatId)) {
                addNode(mitId, mit.name, "mitigation", mit.description, 16, {
                  tags: mit.tags,
                  parentCompId: compId,
                  parentArchId: archId,
                });
                linkArray.push({ source: threatId, target: mitId, type: "threat-mitigation" });
              }
            });
          });
        }
      });
    });

    return { nodes: Array.from(nodeMap.values()), links: linkArray };
  }, [allArchitectures, expandedArchitectures, expandedComponents]);

  // ── Filter by search & type toggles ──────────────────────────────────
  const filteredData = useMemo(() => {
    const filteredNodes = nodes.filter((node) => {
      if (!filters[node.type]) return false;
      if (debouncedSearch) {
        const s = debouncedSearch.toLowerCase();
        return (
          node.name.toLowerCase().includes(s) ||
          node.description.toLowerCase().includes(s) ||
          node.tags?.some((tag) => tag.toLowerCase().includes(s))
        );
      }
      return true;
    });
    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    const filteredLinks = links.filter((link) => {
      const sourceId = typeof link.source === "string" ? link.source : link.source.id;
      const targetId = typeof link.target === "string" ? link.target : link.target.id;
      return nodeIds.has(sourceId) && nodeIds.has(targetId);
    });
    return { nodes: filteredNodes, links: filteredLinks };
  }, [nodes, links, filters, debouncedSearch]);

  // ── Connected count for selected node ────────────────────────────────
  const connectedCount = useMemo(() => {
    if (!selectedNode) return 0;
    const ids = new Set<string>();
    filteredData.links.forEach((link) => {
      const src = typeof link.source === "string" ? link.source : link.source.id;
      const tgt = typeof link.target === "string" ? link.target : link.target.id;
      if (src === selectedNode.id) ids.add(tgt);
      if (tgt === selectedNode.id) ids.add(src);
    });
    return ids.size;
  }, [selectedNode, filteredData.links]);

  // ── Toggle expand/collapse ───────────────────────────────────────────
  const toggleArchitecture = useCallback((archId: string) => {
    setExpandedArchitectures((prev) => {
      const next = new Set(prev);
      if (next.has(archId)) {
        next.delete(archId);
        // Also collapse any expanded components under this architecture
        setExpandedComponents((prevComps) => {
          const nextComps = new Set(prevComps);
          const arch = architecturesData[archId];
          if (arch) arch.keyComponents.forEach((c) => nextComps.delete(c));
          return nextComps;
        });
      } else {
        next.add(archId);
      }
      return next;
    });
  }, []);

  const toggleComponent = useCallback((compId: string) => {
    setExpandedComponents((prev) => {
      const next = new Set(prev);
      if (next.has(compId)) next.delete(compId);
      else next.add(compId);
      return next;
    });
  }, []);

  // ── Resize ───────────────────────────────────────────────────────────
  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const isMobile = window.innerWidth < 768;
        setDimensions({
          width: rect.width,
          height: isMobile ? Math.max(400, rect.height) : Math.max(600, rect.height),
        });
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // ── D3 Visualization ────────────────────────────────────────────────
  useEffect(() => {
    if (!svgRef.current || !dimensions.width || !filteredData.nodes.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g");
    const isMobile = dimensions.width < 768;
    const scale = isMobile ? 0.65 : 1;

    // Zoom
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 4])
      .on("zoom", (event) => g.attr("transform", event.transform));
    zoomRef.current = zoom;
    svg.call(zoom);

    // Click empty space to deselect
    svg.on("click", () => {
      setSelectedNode(null);
      g.selectAll(".node-group").transition().duration(300).style("opacity", 1);
      g.selectAll(".link-line").transition().duration(300).style("opacity", 0.5);
    });

    const cx = dimensions.width / 2;
    const cy = dimensions.height / 2;

    // ── Compute positions ────────────────────────────────────────────
    const archNodes = filteredData.nodes.filter((n) => n.type === "architecture");
    const archCount = archNodes.length;
    const archRadius = Math.min(cx, cy) * 0.85;

    // Architecture nodes in a circle
    const archPositions = new Map<string, { x: number; y: number }>();
    archNodes.forEach((arch, i) => {
      const angle = (2 * Math.PI * i) / archCount - Math.PI / 2;
      const x = cx + archRadius * Math.cos(angle);
      const y = cy + archRadius * Math.sin(angle);
      arch.x = x;
      arch.y = y;
      arch.fx = x;
      arch.fy = y;
      archPositions.set(arch.id, { x, y });
    });

    // Components fan out around their parent architecture
    const compNodes = filteredData.nodes.filter((n) => n.type === "component");
    compNodes.forEach((comp) => {
      const parentPos = archPositions.get(comp.parentArchId || "");
      if (!parentPos) return;
      const siblings = compNodes.filter((c) => c.parentArchId === comp.parentArchId);
      const idx = siblings.indexOf(comp);
      const count = siblings.length;
      // Fan outward from center, relative to parent
      const baseAngle = Math.atan2(parentPos.y - cy, parentPos.x - cx);
      const spread = Math.min(Math.PI * 1.2, count * 0.45);
      const startAngle = baseAngle - spread / 2;
      const angleStep = count > 1 ? spread / (count - 1) : 0;
      const dist = 240 * scale;
      const angle = startAngle + angleStep * idx;
      comp.x = parentPos.x + dist * Math.cos(angle);
      comp.y = parentPos.y + dist * Math.sin(angle);
      comp.fx = comp.x;
      comp.fy = comp.y;
    });

    // Threats and mitigations fan out around their parent component
    const threatNodes = filteredData.nodes.filter((n) => n.type === "threat");
    const mitNodes = filteredData.nodes.filter((n) => n.type === "mitigation");

    threatNodes.forEach((threat) => {
      const parentComp = compNodes.find((c) => c.id === threat.parentCompId);
      if (!parentComp || parentComp.x == null || parentComp.y == null) return;
      const parentArch = archPositions.get(threat.parentArchId || "");
      if (!parentArch) return;
      const siblings = threatNodes.filter((t) => t.parentCompId === threat.parentCompId);
      const idx = siblings.indexOf(threat);
      const count = siblings.length;
      const baseAngle = Math.atan2(parentComp.y - parentArch.y, parentComp.x - parentArch.x);
      const spread = Math.min(Math.PI * 1.0, count * 0.5);
      const startAngle = baseAngle - spread / 2;
      const angleStep = count > 1 ? spread / (count - 1) : 0;
      const dist = 160 * scale;
      const angle = startAngle + angleStep * idx;
      threat.x = parentComp.x + dist * Math.cos(angle);
      threat.y = parentComp.y + dist * Math.sin(angle);
      threat.fx = threat.x;
      threat.fy = threat.y;
    });

    mitNodes.forEach((mit) => {
      const parentThreat = threatNodes.find((t) =>
        filteredData.links.some((l) => {
          const src = typeof l.source === "string" ? l.source : l.source.id;
          const tgt = typeof l.target === "string" ? l.target : l.target.id;
          return src === t.id && tgt === mit.id;
        }),
      );
      if (!parentThreat || parentThreat.x == null || parentThreat.y == null) return;
      const parentComp = compNodes.find((c) => c.id === parentThreat.parentCompId);
      if (!parentComp || parentComp.x == null) return;
      const siblingMits = mitNodes.filter((m) =>
        filteredData.links.some((l) => {
          const src = typeof l.source === "string" ? l.source : l.source.id;
          const tgt = typeof l.target === "string" ? l.target : l.target.id;
          return src === parentThreat.id && tgt === m.id;
        }),
      );
      const idx = siblingMits.indexOf(mit);
      const count = siblingMits.length;
      const baseAngle = Math.atan2(parentThreat.y - parentComp.y, parentThreat.x - parentComp.x);
      const spread = Math.min(Math.PI * 0.8, count * 0.5);
      const startAngle = baseAngle - spread / 2;
      const angleStep = count > 1 ? spread / (count - 1) : 0;
      const dist = 110 * scale;
      const angle = startAngle + angleStep * idx;
      mit.x = parentThreat.x + dist * Math.cos(angle);
      mit.y = parentThreat.y + dist * Math.sin(angle);
      mit.fx = mit.x;
      mit.fy = mit.y;
    });

    // ── Arrow markers ────────────────────────────────────────────────
    const defs = svg.append("defs");
    (["arch-comp", "comp-threat", "threat-mitigation"] as const).forEach((type) => {
      defs
        .append("marker")
        .attr("id", `arrow-${type}`)
        .attr("viewBox", "0 -4 8 8")
        .attr("refX", 8)
        .attr("refY", 0)
        .attr("markerWidth", 5)
        .attr("markerHeight", 5)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-4L8,0L0,4")
        .attr("fill", LINK_COLORS[type]);
    });

    // ── Links ────────────────────────────────────────────────────────
    g.append("g")
      .selectAll(".link-line")
      .data(filteredData.links)
      .join("line")
      .attr("class", "link-line")
      .attr("stroke", (d) => LINK_COLORS[d.type] || "#99999940")
      .attr("stroke-width", (d) => (d.type === "arch-comp" ? 2 : 1.5))
      .attr("stroke-opacity", 0.5)
      .attr("marker-end", (d) => `url(#arrow-${d.type})`)
      .attr("x1", (d) => {
        const s =
          typeof d.source === "string"
            ? filteredData.nodes.find((n) => n.id === d.source)
            : d.source;
        return s?.x ?? 0;
      })
      .attr("y1", (d) => {
        const s =
          typeof d.source === "string"
            ? filteredData.nodes.find((n) => n.id === d.source)
            : d.source;
        return s?.y ?? 0;
      })
      .attr("x2", (d) => {
        const t =
          typeof d.target === "string"
            ? filteredData.nodes.find((n) => n.id === d.target)
            : d.target;
        return t?.x ?? 0;
      })
      .attr("y2", (d) => {
        const t =
          typeof d.target === "string"
            ? filteredData.nodes.find((n) => n.id === d.target)
            : d.target;
        return t?.y ?? 0;
      });

    // ── Nodes ────────────────────────────────────────────────────────
    const nodeGroups = g
      .append("g")
      .selectAll(".node-group")
      .data(filteredData.nodes)
      .join("g")
      .attr("class", "node-group")
      .attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`)
      .style("cursor", "pointer");

    // Glow ring for architectures
    nodeGroups
      .filter((d) => d.type === "architecture")
      .append("circle")
      .attr("r", (d) => (d.size + 6) * scale)
      .attr("fill", "none")
      .attr("stroke", (d) => d.color)
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.2);

    // Expanded indicator ring
    nodeGroups
      .filter((d) => d.type === "architecture" && expandedArchitectures.has(d.id))
      .append("circle")
      .attr("r", (d) => (d.size + 10) * scale)
      .attr("fill", "none")
      .attr("stroke", (d) => d.color)
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "4,3")
      .attr("stroke-opacity", 0.35);

    // Expanded indicator for components
    nodeGroups
      .filter((d) => d.type === "component" && expandedComponents.has(d.id))
      .append("circle")
      .attr("r", (d) => (d.size + 6) * scale)
      .attr("fill", "none")
      .attr("stroke", (d) => d.color)
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "3,2")
      .attr("stroke-opacity", 0.35);

    // Main circle
    nodeGroups
      .append("circle")
      .attr("r", (d) => d.size * scale)
      .attr("fill", (d) => d.color)
      .attr("stroke", "hsl(var(--background))")
      .attr("stroke-width", (d) => (d.type === "architecture" ? 3 : 2))
      .attr("opacity", (d) => (d.type === "architecture" ? 1 : 0.9));

    // Risk ring for threats
    nodeGroups
      .filter((d) => d.type === "threat" && d.riskScore != null && d.riskScore > 0)
      .append("circle")
      .attr("r", (d) => (d.size + 4) * scale)
      .attr("fill", "none")
      .attr("stroke", (d) => {
        const r = d.riskScore || 0;
        return r >= 8 ? "#dc2626" : r >= 6 ? "#ea580c" : "#eab308";
      })
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "3,3");

    // Type letter inside node
    nodeGroups
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", (d) => (d.type === "architecture" ? 1 : 1))
      .attr("font-size", (d) => {
        const sizes: Record<string, number> = {
          architecture: 16,
          component: 11,
          threat: 9,
          mitigation: 8,
        };
        return `${(sizes[d.type] || 10) * scale}px`;
      })
      .attr("font-weight", "700")
      .attr("fill", "#fff")
      .attr("pointer-events", "none")
      .text((d) => {
        if (d.type === "architecture") return d.name.split(" ")[0].charAt(0).toUpperCase();
        return d.type.charAt(0).toUpperCase();
      });

    // Label below node
    nodeGroups
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", (d) => (d.size + 14) * scale)
      .attr("font-size", (d) => {
        const sizes: Record<string, number> = {
          architecture: 12,
          component: 10,
          threat: 9,
          mitigation: 8,
        };
        return `${sizes[d.type] * scale}px`;
      })
      .attr("font-weight", (d) => (d.type === "architecture" ? "600" : "400"))
      .attr("fill", "hsl(var(--foreground))")
      .attr("pointer-events", "none")
      .text((d) => {
        const maxLen = d.type === "architecture" ? 22 : d.type === "component" ? 18 : 14;
        return truncate(d.name, isMobile ? maxLen - 5 : maxLen);
      });

    // Expand hint for architectures (small + icon)
    nodeGroups
      .filter((d) => d.type === "architecture")
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", (d) => (d.size + 26) * scale)
      .attr("font-size", `${9 * scale}px`)
      .attr("fill", "hsl(var(--muted-foreground))")
      .attr("pointer-events", "none")
      .text((d) => (expandedArchitectures.has(d.id) ? "click to collapse" : "click to explore"));

    // Expand hint for components
    nodeGroups
      .filter((d) => d.type === "component" && expandedArchitectures.has(d.parentArchId || ""))
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", (d) => (d.size + 22) * scale)
      .attr("font-size", `${8 * scale}px`)
      .attr("fill", "hsl(var(--muted-foreground))")
      .attr("pointer-events", "none")
      .text((d) => (expandedComponents.has(d.id) ? "collapse" : "expand threats"));

    // ── Interactions ─────────────────────────────────────────────────

    nodeGroups.on("click", (event, d) => {
      event.stopPropagation();
      setSelectedNode(d);

      if (d.type === "architecture") {
        toggleArchitecture(d.id);
      } else if (d.type === "component") {
        toggleComponent(d.id);
      }
    });

    nodeGroups
      .on("mouseover", (event, d) => {
        setTooltip({ x: event.clientX, y: event.clientY, name: d.name, type: d.type });

        const connected = new Set<string>();
        filteredData.links.forEach((l) => {
          const src = typeof l.source === "string" ? l.source : l.source.id;
          const tgt = typeof l.target === "string" ? l.target : l.target.id;
          if (src === d.id) connected.add(tgt);
          if (tgt === d.id) connected.add(src);
        });

        g.selectAll<SVGGElement, GraphNode>(".node-group")
          .transition()
          .duration(200)
          .style("opacity", (n) => (n.id === d.id || connected.has(n.id) ? 1 : 0.25));
        g.selectAll<SVGLineElement, GraphLink>(".link-line")
          .transition()
          .duration(200)
          .style("opacity", (l) => {
            const src = typeof l.source === "string" ? l.source : l.source.id;
            const tgt = typeof l.target === "string" ? l.target : l.target.id;
            return src === d.id || tgt === d.id ? 0.8 : 0.08;
          });
      })
      .on("mousemove", (event) => {
        setTooltip((prev) => (prev ? { ...prev, x: event.clientX, y: event.clientY } : null));
      })
      .on("mouseout", () => {
        setTooltip(null);
        g.selectAll(".node-group").transition().duration(300).style("opacity", 1);
        g.selectAll(".link-line").transition().duration(300).style("opacity", 0.5);
      });

    // ── Fit to view ──────────────────────────────────────────────────
    requestAnimationFrame(() => {
      const bounds = (g.node() as SVGGElement)?.getBBox();
      if (bounds && bounds.width > 0 && bounds.height > 0) {
        const fitScale =
          Math.min(
            dimensions.width / (bounds.width + 80),
            dimensions.height / (bounds.height + 80),
          ) * 0.9;
        const tx = dimensions.width / 2 - fitScale * (bounds.x + bounds.width / 2);
        const ty = dimensions.height / 2 - fitScale * (bounds.y + bounds.height / 2);
        svg
          .transition()
          .duration(600)
          .call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(fitScale));
      }
    });

    return () => {
      svg.on(".zoom", null);
    };
  }, [
    filteredData,
    dimensions,
    expandedArchitectures,
    expandedComponents,
    toggleArchitecture,
    toggleComponent,
  ]);

  // ── Zoom controls ────────────────────────────────────────────────────
  const zoomIn = useCallback(() => {
    if (svgRef.current && zoomRef.current)
      d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 1.5);
  }, []);

  const zoomOut = useCallback(() => {
    if (svgRef.current && zoomRef.current)
      d3.select(svgRef.current)
        .transition()
        .duration(300)
        .call(zoomRef.current.scaleBy, 1 / 1.5);
  }, []);

  const resetZoom = useCallback(() => {
    if (svgRef.current && zoomRef.current)
      d3.select(svgRef.current)
        .transition()
        .duration(300)
        .call(zoomRef.current.transform, d3.zoomIdentity);
  }, []);

  const centerView = useCallback(() => {
    if (svgRef.current && zoomRef.current) {
      const svg = d3.select(svgRef.current);
      const gNode = svg.select("g");
      const bounds = (gNode.node() as SVGGElement)?.getBBox();
      if (bounds && bounds.width > 0 && bounds.height > 0) {
        const fitScale =
          Math.min(
            dimensions.width / (bounds.width + 80),
            dimensions.height / (bounds.height + 80),
          ) * 0.9;
        const tx = dimensions.width / 2 - fitScale * (bounds.x + bounds.width / 2);
        const ty = dimensions.height / 2 - fitScale * (bounds.y + bounds.height / 2);
        svg
          .transition()
          .duration(750)
          .call(zoomRef.current.transform, d3.zoomIdentity.translate(tx, ty).scale(fitScale));
      }
    }
  }, [dimensions]);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement && explorerRef.current) {
        await explorerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      setIsFullscreen(!isFullscreen);
    }
  }, [isFullscreen]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedArchitectures(new Set());
    setExpandedComponents(new Set());
    setSelectedNode(null);
  }, []);

  // ── No data guard ────────────────────────────────────────────────────
  if (allArchitectures.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
          <p className="text-muted-foreground">No architecture data found.</p>
        </div>
      </div>
    );
  }

  const detailPath = selectedNode ? getDetailPath(selectedNode) : null;
  const hasExpanded = expandedArchitectures.size > 0;

  return (
    <div
      ref={explorerRef}
      className={cn(
        "flex flex-col lg:flex-row gap-3 h-full",
        isFullscreen && "fixed inset-0 z-[9999] bg-background p-3",
      )}
    >
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden flex items-center gap-2 mb-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? "Collapse controls" : "Expand controls"}
          className="gap-1"
        >
          {sidebarOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          Controls
        </Button>
        <span className="text-xs text-muted-foreground">{filteredData.nodes.length} nodes</span>
      </div>

      {/* Controls Panel */}
      <div
        className={cn(
          "lg:w-72 space-y-3 shrink-0 overflow-y-auto",
          !sidebarOpen && "hidden lg:block",
          isFullscreen && "max-h-screen",
        )}
      >
        <Card>
          <CardContent className="p-3 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search nodes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-8 h-8 text-sm"
                aria-label="Search graph nodes"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {debouncedSearch && filteredData.nodes.length === 0 && (
              <p className="text-xs text-muted-foreground">No matching nodes found.</p>
            )}

            {/* Navigation controls */}
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1.5">Navigation</div>
              <div className="grid grid-cols-4 gap-1.5">
                <Button
                  onClick={zoomIn}
                  variant="outline"
                  size="sm"
                  aria-label="Zoom in"
                  className="h-7 px-0"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </Button>
                <Button
                  onClick={zoomOut}
                  variant="outline"
                  size="sm"
                  aria-label="Zoom out"
                  className="h-7 px-0"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </Button>
                <Button
                  onClick={centerView}
                  variant="outline"
                  size="sm"
                  aria-label="Fit to view"
                  className="h-7 px-0 text-xs"
                >
                  Fit
                </Button>
                <Button
                  onClick={resetZoom}
                  variant="outline"
                  size="sm"
                  aria-label="Reset zoom"
                  className="h-7 px-0"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Fullscreen + Collapse All */}
            <div className="flex gap-1.5">
              <Button
                onClick={toggleFullscreen}
                variant="outline"
                size="sm"
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                className="flex-1 h-7 text-xs gap-1"
              >
                {isFullscreen ? <Minimize className="h-3 w-3" /> : <Maximize className="h-3 w-3" />}
                {isFullscreen ? "Exit" : "Fullscreen"}
              </Button>
              {hasExpanded && (
                <Button
                  onClick={collapseAll}
                  variant="outline"
                  size="sm"
                  className="flex-1 h-7 text-xs gap-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  Collapse All
                </Button>
              )}
            </div>

            {/* Type filters */}
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-1.5">Show / Hide</div>
              <div className="grid grid-cols-2 gap-y-1.5 gap-x-3">
                {(Object.entries(filters) as [string, boolean][]).map(([type, enabled]) => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={enabled}
                      onCheckedChange={() =>
                        setFilters((prev) => ({ ...prev, [type]: !prev[type] }))
                      }
                      aria-label={`Toggle ${type} nodes`}
                      className="h-3.5 w-3.5"
                    />
                    <span className="flex items-center gap-1.5 text-xs capitalize">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: NODE_COLORS[type as keyof typeof NODE_COLORS] }}
                      />
                      {type}s
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Help */}
            <details>
              <summary className="text-xs font-medium text-muted-foreground cursor-pointer select-none">
                Help
              </summary>
              <div className="text-xs text-muted-foreground space-y-0.5 mt-1.5">
                <p>Click an architecture node to expand its components.</p>
                <p>Click a component to reveal its threats and mitigations.</p>
                <p>Scroll to zoom. Drag the background to pan.</p>
                <p>Click empty space to deselect.</p>
              </div>
            </details>
          </CardContent>
        </Card>

        {/* Selected Node Details */}
        {selectedNode && (
          <Card>
            <CardContent className="p-3 space-y-2.5 max-h-96 overflow-y-auto">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: selectedNode.color }}
                />
                <h3 className="font-semibold text-sm leading-tight">{selectedNode.name}</h3>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize text-xs">
                  {selectedNode.type}
                </Badge>
                {connectedCount > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {connectedCount} connection{connectedCount !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {selectedNode.description}
              </p>

              {selectedNode.riskScore != null && selectedNode.riskScore > 0 && (
                <div>
                  <div className="text-xs font-medium mb-1">Risk Score</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-1.5">
                      <div
                        className={cn(
                          "h-1.5 rounded-full",
                          selectedNode.riskScore >= 8
                            ? "bg-red-500"
                            : selectedNode.riskScore >= 6
                              ? "bg-orange-500"
                              : "bg-yellow-500",
                        )}
                        style={{ width: `${(selectedNode.riskScore / 10) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono">{selectedNode.riskScore}/10</span>
                  </div>
                </div>
              )}

              {selectedNode.tags && selectedNode.tags.length > 0 && (
                <div>
                  <div className="text-xs font-medium mb-1">Tags</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedNode.tags.slice(0, 8).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                        {tag}
                      </Badge>
                    ))}
                    {selectedNode.tags.length > 8 && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">
                        +{selectedNode.tags.length - 8}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {detailPath && (
                <Link
                  to={detailPath}
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                >
                  View full details <ExternalLink className="h-3 w-3" />
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Graph */}
      <div className="flex-1 min-h-0 relative" ref={containerRef}>
        <Card className="h-full">
          <CardContent className="p-0 h-full relative overflow-hidden">
            <svg
              ref={svgRef}
              width={dimensions.width}
              height={dimensions.height}
              className="w-full h-full block"
              role="img"
              aria-label="Interactive architecture explorer graph"
            />
          </CardContent>
        </Card>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="fixed z-50 pointer-events-none px-2.5 py-1.5 rounded bg-popover border shadow-sm text-xs"
            style={{ left: tooltip.x + 12, top: tooltip.y - 8 }}
          >
            <div className="font-medium">{tooltip.name}</div>
            <div className="text-muted-foreground capitalize">{tooltip.type}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchitectureNavigator;

export const HierarchicalArchitectureNavigator = ArchitectureNavigator;

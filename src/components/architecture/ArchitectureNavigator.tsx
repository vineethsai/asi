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
  Play,
  Pause,
  Maximize,
  Minimize,
  X,
  ExternalLink,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: "architecture" | "component" | "threat" | "mitigation";
  description: string;
  color: string;
  size: number;
  riskScore?: number;
  tags?: string[];
  group: number;
  fx?: number | null;
  fy?: number | null;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  type: "arch-comp" | "comp-threat" | "threat-mitigation";
  strength: number;
}

// Component data mapping from the parsed components with proper dot notation
const componentDataMap: Record<string, { title: string; description: string }> = {
  "kc1.1": {
    title: "Large Language Models (LLMs)",
    description:
      "Core cognitive engine utilizing pre-trained foundation models for reasoning, planning, and generation, primarily directed via prompt engineering. Operates within constraints like context window, latency, and cost.",
  },
  "kc1.2": {
    title: "Multimodal LLMs (MLLMs)",
    description:
      "LLMs capable of processing and/or generating information across multiple data types beyond text (e.g., images, audio), enabling agents to perform a wider variety of tasks.",
  },
  "kc1.3": {
    title: "Small-Language Models (SLMs)",
    description:
      "Language models with fewer parameters, trained on smaller, focused datasets, designed for specific tasks or use cases. Characterized by smaller weight space, parameter size, and context window compared to LLMs.",
  },
  "kc1.4": {
    title: "Fine-tuned Models",
    description:
      "Language models (LLMs/MLLMs) that undergo additional training on specific datasets to specialize their capabilities, enhancing performance, adopting personas, or improving reliability for particular tasks.",
  },

  "kc2.1": {
    title: "Workflows",
    description:
      "Structured, pre-defined sequence of tasks or steps that agents follow to achieve a goal, defining the flow of information and actions. Can be linear, conditional, or iterative.",
  },
  "kc2.2": {
    title: "Hierarchical Planning",
    description:
      "Multiple agents collaborating via an orchestrator (router) that decomposes tasks, routes sub-tasks to specialized agents, and monitors performance.",
  },
  "kc2.3": {
    title: "Multi-agent Collaboration",
    description:
      "Multiple agents working together, communicating and coordinating actions, sharing information and resources to achieve a common goal. Useful for complex tasks requiring diverse skills.",
  },

  "kc3.1": {
    title: "Structured Planning / Execution",
    description:
      "Focuses on decomposing tasks into a formal plan, defining sequences of actions (often involving tool calls), and executing the plan, sometimes with separate planner/executor components (e.g., ReWoo, LLM Compiler, Plan-and-Execute).",
  },
  "kc3.2": {
    title: "ReAct (Reason + Act)",
    description:
      "Dynamically interleaves reasoning steps with actions (like using tools or querying APIs) and updates reasoning based on feedback.",
  },
  "kc3.3": {
    title: "Chain of Thought (CoT)",
    description:
      'Enhances reasoning quality by prompting step-by-step "thinking," inducing an LLM to generate a set of "thoughts" before arriving at a final action or conclusion.',
  },
  "kc3.4": {
    title: "Tree of Thoughts (ToT)",
    description:
      "Generalizes CoT by exploring multiple reasoning paths and plans in parallel with lookahead, backtracking, and self-evaluation.",
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
    description:
      "Code-level building blocks (e.g., LangChain, CrewAI) or API capabilities (OpenAI Tool Use) offering high flexibility but requiring more coding effort.",
  },
  "kc5.2": {
    title: "Managed Platforms / Services",
    description:
      "Vendor-provided solutions (e.g., Amazon Bedrock Agents, Microsoft Copilot Platform) handling infrastructure and simplifying setup, often with easier ecosystem integration and low-code interfaces.",
  },
  "kc5.3": {
    title: "Managed APIs",
    description:
      "Vendor-hosted services (e.g., OpenAI Assistants API) providing higher-level abstractions, managing state and aspects of tool orchestration via API calls.",
  },

  "kc6.1": {
    title: "API Access",
    description: "Agents utilizing LLM capabilities to interact with APIs.",
  },
  "kc6.1.1": {
    title: "Limited API Access",
    description:
      "Agent generates some parameters for a predefined API call. Compromise can lead to API attacks via LLM-generated parameters.",
  },
  "kc6.1.2": {
    title: "Extensive API Access",
    description:
      "Agent generates the entire API call. Compromise can lead to unwanted API calls and attacks.",
  },
  "kc6.2": {
    title: "Code Execution",
    description: "Agents utilizing LLM capabilities for code-related tasks.",
  },
  "kc6.2.1": {
    title: "Limited Code Execution Capability",
    description:
      "Agent generates parameters for a predefined function. Compromise can lead to code injection.",
  },
  "kc6.2.2": {
    title: "Extensive Code Execution Capability",
    description: "Agent runs LLM-generated code. Compromise can lead to arbitrary code execution.",
  },
  "kc6.3": {
    title: "Database Execution",
    description: "Agents utilizing LLM capabilities to interact with databases.",
  },
  "kc6.3.1": {
    title: "Limited Database Execution Capability",
    description:
      "Agent runs specific queries/commands with limited permissions (e.g., read-only, parameterized writes). Compromise can lead to data exfiltration or limited malicious writes.",
  },
  "kc6.3.2": {
    title: "Extensive Database Execution Capability",
    description:
      "Agent generates and runs all CRUD operations. Compromise can lead to major data alteration, deletion, or leakage.",
  },
  "kc6.3.3": {
    title: "Agent Memory or Context Data Sources (RAG)",
    description:
      "Agent uses external datasources for context or updates records. Compromise can disrupt data or provide malformed information.",
  },
  "kc6.4": {
    title: "Web Access Capabilities (Web-Use)",
    description:
      "Agent utilizing LLM for browser operations. Compromise (often from untrusted web content) can lead to unwanted operations on behalf of the user.",
  },
  "kc6.5": {
    title: "Controlling PC Operations (PC-Use)",
    description:
      "Agent utilizing LLM for OS operations, including file system. Compromise can lead to unwanted operations, data leakage, or malicious actions like encrypting files.",
  },
  "kc6.6": {
    title: "Operating Critical Systems",
    description:
      "Agent utilizing LLM to operate critical systems (e.g., SCADA). Compromise can cause catastrophic failures.",
  },
  "kc6.7": {
    title: "Access to IoT Devices",
    description:
      "Agent controlling IoT devices. Compromise could impact the operational environment or misuse devices.",
  },

  kc1: {
    title: "Language Models (LLMs)",
    description:
      'The core cognitive engine or "brain" of the agent (e.g., GPT-4, Claude), responsible for understanding, reasoning, planning, and generating responses. This includes various types of language models.',
  },
  kc2: {
    title: "Orchestration (Control Flow)",
    description:
      "Mechanisms that dictate the agent's overall behavior, information flow, and decision-making processes. The specific mechanism depends on the architecture and impacts responsiveness and efficiency.",
  },
  kc3: {
    title: "Reasoning / Planning Paradigm",
    description:
      "How agents utilize LLMs to solve complex tasks requiring multiple steps and strategic thinking by breaking down high-level tasks into smaller sub-tasks.",
  },
  kc4: {
    title: "Memory Modules",
    description:
      "Enable the agent to retain short-term (immediate context) and long-term information (past interactions, knowledge) for coherent and personalized interactions. Context sensitivity is used to reduce risk. RAG with vector databases is common for long-term memory.",
  },
  kc5: {
    title: "Tool Integration Frameworks",
    description:
      "Allow agents to extend capabilities by using external tools (APIs, functions, data stores) to interact with the real world or other systems. Manages tool selection and use.",
  },
  kc6: {
    title: "Operational Environment (Agencies)",
    description: "API access, code execution, database operations",
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

const NODE_COLORS = {
  architecture: "#3b82f6",
  component: "#22c55e",
  threat: "#ef4444",
  mitigation: "#f59e0b",
} as const;

const LINK_COLORS = {
  "arch-comp": "#3b82f6",
  "comp-threat": "#ef4444",
  "threat-mitigation": "#f59e0b",
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

const ArchitectureNavigator: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const explorerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 200);
  const [isSimulationRunning, setIsSimulationRunning] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [helpOpen, setHelpOpen] = useState(false);
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

  // Build graph data
  const { nodes, links } = useMemo(() => {
    const nodeMap = new Map<string, GraphNode>();
    const linkArray: GraphLink[] = [];

    const addNode = (
      id: string,
      name: string,
      type: GraphNode["type"],
      description: string,
      color: string,
      size: number,
      riskScore?: number,
      tags?: string[],
    ) => {
      if (!nodeMap.has(id)) {
        nodeMap.set(id, {
          id,
          name,
          type,
          description,
          color,
          size,
          riskScore,
          tags,
          group: type === "architecture" ? 0 : type === "component" ? 1 : type === "threat" ? 2 : 3,
        });
      }
    };

    const addLink = (
      sourceId: string,
      targetId: string,
      type: GraphLink["type"],
      strength: number = 1,
    ) => {
      linkArray.push({ source: sourceId, target: targetId, type, strength });
    };

    try {
      Object.values(architecturesData).forEach((arch: Architecture) => {
        addNode(
          arch.id,
          arch.name,
          "architecture",
          arch.description,
          NODE_COLORS.architecture,
          60,
          arch.riskScore,
          arch.tags,
        );

        (arch.keyComponents || []).forEach((compId) => {
          const component = getComponentDataById(compId);
          if (component) {
            addNode(
              compId,
              component.title,
              "component",
              component.description || "",
              NODE_COLORS.component,
              40,
              undefined,
              (component as ComponentNode).threatCategories,
            );
            addLink(arch.id, compId, "arch-comp", 2);

            (arch.threatIds || []).forEach((threatId) => {
              const threat = threatsData[threatId];
              if (threat) {
                const normalizedCompId = compId.replace(/\./g, "-");
                const mainCompId = compId.includes(".") ? compId.split(".")[0] : compId;
                const threatAffectsComponent = threat.componentIds?.some(
                  (tCompId) =>
                    tCompId === compId ||
                    tCompId === normalizedCompId ||
                    tCompId === mainCompId ||
                    tCompId.replace(/-/g, ".") === compId,
                );

                if (threatAffectsComponent) {
                  addNode(
                    threatId,
                    threat.name,
                    "threat",
                    threat.description,
                    NODE_COLORS.threat,
                    30,
                    threat.riskScore,
                    threat.tags,
                  );
                  addLink(
                    compId,
                    threatId,
                    "comp-threat",
                    threat.riskScore ? threat.riskScore / 10 : 1,
                  );

                  (arch.mitigationIds || []).forEach((mitigationId) => {
                    const mitigation = mitigationsData[mitigationId];
                    if (mitigation && mitigation.threatIds?.includes(threatId)) {
                      addNode(
                        mitigationId,
                        mitigation.name,
                        "mitigation",
                        mitigation.description,
                        NODE_COLORS.mitigation,
                        25,
                        undefined,
                        mitigation.tags,
                      );
                      addLink(threatId, mitigationId, "threat-mitigation", 1.5);
                    }
                  });
                }
              }
            });
          }
        });
      });
    } catch (error) {
      console.error("Error building graph data:", error);
    }

    return { nodes: Array.from(nodeMap.values()), links: linkArray };
  }, []);

  // Filter nodes and links
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

  // Connected nodes count for the selected node
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

  // Resize
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

  // D3 visualization
  useEffect(() => {
    if (!svgRef.current || !dimensions.width || !filteredData.nodes.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    zoomRef.current = zoom;
    svg.call(zoom);

    svg.on("click", () => {
      setSelectedNode(null);
      node.transition().duration(500).style("opacity", 1);
      link.transition().duration(500).style("opacity", 0.6);
      filteredData.nodes.forEach((n) => {
        n.fx = null;
        n.fy = null;
      });
      if (simulationRef.current) {
        simulationRef.current.alpha(0.3).restart();
      }
    });

    const isMobile = dimensions.width < 768;
    const mobileScale = isMobile ? 0.6 : 1;

    const simulation = d3
      .forceSimulation<GraphNode>(filteredData.nodes)
      .force(
        "link",
        d3
          .forceLink<GraphNode, GraphLink>(filteredData.links)
          .id((d) => d.id)
          .distance((d) => {
            const base: Record<string, number> = {
              "arch-comp": 120,
              "comp-threat": 80,
              "threat-mitigation": 60,
            };
            return (base[d.type] || 80) * mobileScale;
          })
          .strength((d) => d.strength * 0.8),
      )
      .force(
        "charge",
        d3.forceManyBody<GraphNode>().strength((d) => {
          const base: Record<string, number> = {
            architecture: -1500,
            component: -800,
            threat: -600,
            mitigation: -400,
          };
          return (base[d.type] || -600) * mobileScale;
        }),
      )
      .force("center", d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force(
        "collision",
        d3
          .forceCollide<GraphNode>()
          .radius((d) => (d.size + 15) * mobileScale)
          .strength(0.8),
      )
      .force("x", d3.forceX(dimensions.width / 2).strength(0.05))
      .force("y", d3.forceY(dimensions.height / 2).strength(0.05));

    simulationRef.current = simulation;

    const defs = svg.append("defs");
    (["arch-comp", "comp-threat", "threat-mitigation"] as const).forEach((type) => {
      defs
        .append("marker")
        .attr("id", `arrow-${type}`)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 15)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", LINK_COLORS[type]);
    });

    const link = g
      .append("g")
      .selectAll(".link")
      .data(filteredData.links)
      .join("line")
      .attr("class", "link")
      .attr("stroke", (d) => LINK_COLORS[d.type] || "#999")
      .attr("stroke-width", (d) => Math.max(1, d.strength * 2))
      .attr("stroke-opacity", 0.6)
      .attr("marker-end", (d) => `url(#arrow-${d.type})`);

    const drag = d3
      .drag<SVGGElement, GraphNode>()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event) => {
        if (!event.active) simulation.alphaTarget(0);
      });

    const node = g
      .append("g")
      .selectAll(".node")
      .data(filteredData.nodes)
      .join("g")
      .attr("class", "node")
      .style("cursor", "pointer")
      .call(drag)
      .on("click", (event, d) => {
        setSelectedNode(d);
        event.stopPropagation();

        const connectedNodeIds = new Set<string>();
        const connectedNodes: GraphNode[] = [];

        filteredData.links.forEach((l) => {
          const sourceId = typeof l.source === "string" ? l.source : l.source.id;
          const targetId = typeof l.target === "string" ? l.target : l.target.id;
          if (sourceId === d.id) {
            connectedNodeIds.add(targetId);
            const tn = filteredData.nodes.find((n) => n.id === targetId);
            if (tn) connectedNodes.push(tn);
          }
          if (targetId === d.id) {
            connectedNodeIds.add(sourceId);
            const sn = filteredData.nodes.find((n) => n.id === sourceId);
            if (sn) connectedNodes.push(sn);
          }
        });

        node
          .transition()
          .duration(500)
          .style("opacity", (n) => (n.id === d.id || connectedNodeIds.has(n.id) ? 1 : 0.1));

        link
          .transition()
          .duration(500)
          .style("opacity", (l) => {
            const src = typeof l.source === "string" ? l.source : l.source.id;
            const tgt = typeof l.target === "string" ? l.target : l.target.id;
            return src === d.id || tgt === d.id ? 1 : 0.05;
          });

        if (connectedNodes.length > 0) {
          const cx = d.x || 0;
          const cy = d.y || 0;
          const radius = 150;
          connectedNodes.forEach((cn, i) => {
            const angle = (2 * Math.PI * i) / connectedNodes.length;
            cn.fx = cx + radius * Math.cos(angle);
            cn.fy = cy + radius * Math.sin(angle);
          });
          d.fx = cx;
          d.fy = cy;
          if (simulationRef.current) simulationRef.current.alpha(0.3).restart();
        }
      })
      .on("mouseover", (event, d) => {
        setTooltip({
          x: event.clientX,
          y: event.clientY,
          name: d.name,
          type: d.type,
        });

        const connected = new Set<string>();
        filteredData.links.forEach((l) => {
          const src = typeof l.source === "string" ? l.source : l.source.id;
          const tgt = typeof l.target === "string" ? l.target : l.target.id;
          if (src === d.id) connected.add(tgt);
          if (tgt === d.id) connected.add(src);
        });

        node.style("opacity", (n) => (n.id === d.id || connected.has(n.id) ? 1 : 0.3));
        link.style("opacity", (l) => {
          const src = typeof l.source === "string" ? l.source : l.source.id;
          const tgt = typeof l.target === "string" ? l.target : l.target.id;
          return src === d.id || tgt === d.id ? 1 : 0.1;
        });
      })
      .on("mousemove", (event) => {
        setTooltip((prev) => (prev ? { ...prev, x: event.clientX, y: event.clientY } : null));
      })
      .on("mouseout", () => {
        setTooltip(null);
        node.style("opacity", 1);
        link.style("opacity", 0.6);
      });

    // Circles
    node
      .append("circle")
      .attr("r", (d) => d.size * mobileScale)
      .attr("fill", (d) => d.color)
      .attr("stroke", "hsl(var(--background))")
      .attr("stroke-width", 2);

    // Risk indicators
    node
      .filter((d) => d.type === "threat" && d.riskScore != null && d.riskScore > 0)
      .append("circle")
      .attr("r", (d) => (d.size + 5) * mobileScale)
      .attr("fill", "none")
      .attr("stroke", (d) => {
        const risk = d.riskScore || 0;
        return risk >= 8 ? "#dc2626" : risk >= 6 ? "#ea580c" : "#eab308";
      })
      .attr("stroke-width", 3)
      .attr("stroke-dasharray", "5,5");

    // Labels
    node
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", (d) => (d.size + 20) * mobileScale)
      .attr("font-size", (d) => {
        const sizes: Record<string, number> = {
          architecture: 14,
          component: 12,
          threat: 10,
          mitigation: 9,
        };
        return `${(sizes[d.type] || 10) * mobileScale}px`;
      })
      .attr("font-weight", (d) => (d.type === "architecture" ? "bold" : "normal"))
      .attr("fill", "hsl(var(--foreground))")
      .text((d) => {
        const max = isMobile
          ? d.type === "architecture"
            ? 15
            : 10
          : d.type === "architecture"
            ? 20
            : 15;
        return d.name.length > max ? d.name.substring(0, max) + "..." : d.name;
      });

    // Type letter
    node
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", 5)
      .attr("font-size", "10px")
      .attr("font-weight", "bold")
      .attr("fill", "#fff")
      .text((d) => d.type.charAt(0).toUpperCase());

    // Tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as GraphNode).x || 0)
        .attr("y1", (d) => (d.source as GraphNode).y || 0)
        .attr("x2", (d) => (d.target as GraphNode).x || 0)
        .attr("y2", (d) => (d.target as GraphNode).y || 0);
      node.attr("transform", (d) => `translate(${d.x || 0},${d.y || 0})`);
    });

    // Fit to view after initial layout
    setTimeout(() => {
      const bounds = (g.node() as SVGGElement)?.getBBox();
      if (bounds && bounds.width > 0 && bounds.height > 0) {
        const scale =
          Math.min(dimensions.width / bounds.width, dimensions.height / bounds.height) * 0.6;
        const tx = dimensions.width / 2 - scale * (bounds.x + bounds.width / 2);
        const ty = dimensions.height / 2 - scale * (bounds.y + bounds.height / 2);
        svg
          .transition()
          .duration(1000)
          .call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
      }
    }, 1000);

    return () => {
      simulation.stop();
    };
  }, [filteredData, dimensions]);

  // Zoom controls using stored ref
  const zoomIn = useCallback(() => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, 1.5);
    }
  }, []);

  const zoomOut = useCallback(() => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(300)
        .call(zoomRef.current.scaleBy, 1 / 1.5);
    }
  }, []);

  const resetZoom = useCallback(() => {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(300)
        .call(zoomRef.current.transform, d3.zoomIdentity);
    }
  }, []);

  const centerView = useCallback(() => {
    if (svgRef.current && zoomRef.current) {
      const svg = d3.select(svgRef.current);
      const g = svg.select("g");
      const bounds = (g.node() as SVGGElement)?.getBBox();
      if (bounds && bounds.width > 0 && bounds.height > 0) {
        const scale =
          Math.min(dimensions.width / bounds.width, dimensions.height / bounds.height) * 0.6;
        const tx = dimensions.width / 2 - scale * (bounds.x + bounds.width / 2);
        const ty = dimensions.height / 2 - scale * (bounds.y + bounds.height / 2);
        svg
          .transition()
          .duration(750)
          .call(zoomRef.current.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
      }
    }
  }, [dimensions]);

  const toggleSimulation = useCallback(() => {
    if (simulationRef.current) {
      if (isSimulationRunning) {
        simulationRef.current.stop();
      } else {
        simulationRef.current.restart();
      }
      setIsSimulationRunning(!isSimulationRunning);
    }
  }, [isSimulationRunning]);

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

  if (nodes.length === 0) {
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
        <span className="text-xs text-muted-foreground">
          {filteredData.nodes.length} nodes, {filteredData.links.length} links
        </span>
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

            {/* View controls */}
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

            {/* Simulation + Fullscreen */}
            <div className="flex gap-1.5">
              <Button
                onClick={toggleSimulation}
                variant="outline"
                size="sm"
                aria-label={isSimulationRunning ? "Pause simulation" : "Resume simulation"}
                className="flex-1 h-7 text-xs gap-1"
              >
                {isSimulationRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                {isSimulationRunning ? "Pause" : "Play"}
              </Button>
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
            </div>

            {/* Filters */}
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
            <details
              open={helpOpen}
              onToggle={(e) => setHelpOpen((e.target as HTMLDetailsElement).open)}
            >
              <summary className="text-xs font-medium text-muted-foreground cursor-pointer select-none">
                Help
              </summary>
              <div className="text-xs text-muted-foreground space-y-0.5 mt-1.5">
                <p>Click a node to select it and highlight connections.</p>
                <p>Drag nodes to reposition. They stay where you drop them.</p>
                <p>Scroll to zoom. Click empty space to deselect all.</p>
                <p>On touch devices, pinch to zoom and drag to pan.</p>
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
                <span className="text-xs text-muted-foreground">
                  {connectedCount} connection{connectedCount !== 1 ? "s" : ""}
                </span>
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
              aria-label="Interactive architecture explorer graph showing architectures, components, threats, and mitigations"
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

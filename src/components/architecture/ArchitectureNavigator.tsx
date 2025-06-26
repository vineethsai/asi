import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { architecturesData, Architecture } from '../components/architecturesData';
import { frameworkData, type ComponentNode } from '../components/frameworkData';
import { threatsData, mitigationsData } from '../components/securityData';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, ZoomIn, ZoomOut, RotateCcw, Play, Pause, Target, Maximize, Minimize } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: 'architecture' | 'component' | 'threat' | 'mitigation';
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
  type: 'arch-comp' | 'comp-threat' | 'threat-mitigation';
  strength: number;
}

// Component data mapping from the parsed components with proper dot notation
const componentDataMap = {
  "kc1.1": { title: "Large Language Models (LLMs)", description: "Core cognitive engine utilizing pre-trained foundation models for reasoning, planning, and generation, primarily directed via prompt engineering. Operates within constraints like context window, latency, and cost." },
  "kc1.2": { title: "Multimodal LLMs (MLLMs)", description: "LLMs capable of processing and/or generating information across multiple data types beyond text (e.g., images, audio), enabling agents to perform a wider variety of tasks." },
  "kc1.3": { title: "Small-Language Models (SLMs)", description: "Language models with fewer parameters, trained on smaller, focused datasets, designed for specific tasks or use cases. Characterized by smaller weight space, parameter size, and context window compared to LLMs." },
  "kc1.4": { title: "Fine-tuned Models", description: "Language models (LLMs/MLLMs) that undergo additional training on specific datasets to specialize their capabilities, enhancing performance, adopting personas, or improving reliability for particular tasks." },
  
  "kc2.1": { title: "Workflows", description: "Structured, pre-defined sequence of tasks or steps that agents follow to achieve a goal, defining the flow of information and actions. Can be linear, conditional, or iterative." },
  "kc2.2": { title: "Hierarchical Planning", description: "Multiple agents collaborating via an orchestrator (router) that decomposes tasks, routes sub-tasks to specialized agents, and monitors performance." },
  "kc2.3": { title: "Multi-agent Collaboration", description: "Multiple agents working together, communicating and coordinating actions, sharing information and resources to achieve a common goal. Useful for complex tasks requiring diverse skills." },
  
  "kc3.1": { title: "Structured Planning / Execution", description: "Focuses on decomposing tasks into a formal plan, defining sequences of actions (often involving tool calls), and executing the plan, sometimes with separate planner/executor components (e.g., ReWoo, LLM Compiler, Plan-and-Execute)." },
  "kc3.2": { title: "ReAct (Reason + Act)", description: "Dynamically interleaves reasoning steps with actions (like using tools or querying APIs) and updates reasoning based on feedback." },
  "kc3.3": { title: "Chain of Thought (CoT)", description: "Enhances reasoning quality by prompting step-by-step \"thinking,\" inducing an LLM to generate a set of \"thoughts\" before arriving at a final action or conclusion." },
  "kc3.4": { title: "Tree of Thoughts (ToT)", description: "Generalizes CoT by exploring multiple reasoning paths and plans in parallel with lookahead, backtracking, and self-evaluation." },
  
  "kc4.1": { title: "In-agent session memory", description: "Memory limited to a single agent and a single session." },
  "kc4.2": { title: "Cross-agent session memory", description: "Memory shared across multiple agents but limited to a single session." },
  "kc4.3": { title: "In-agent cross-session memory", description: "Memory limited to a single agent but shared across multiple sessions." },
  "kc4.4": { title: "Cross-agent cross-session memory", description: "Memory shared across multiple agents and sessions." },
  "kc4.5": { title: "In-agent cross-user memory", description: "Memory limited to a single agent but shared across multiple users." },
  "kc4.6": { title: "Cross-agent cross-user memory", description: "Memory shared across multiple agents and users." },
  
  "kc5.1": { title: "Flexible Libraries / SDK Features", description: "Code-level building blocks (e.g., LangChain, CrewAI) or API capabilities (OpenAI Tool Use) offering high flexibility but requiring more coding effort." },
  "kc5.2": { title: "Managed Platforms / Services", description: "Vendor-provided solutions (e.g., Amazon Bedrock Agents, Microsoft Copilot Platform) handling infrastructure and simplifying setup, often with easier ecosystem integration and low-code interfaces." },
  "kc5.3": { title: "Managed APIs", description: "Vendor-hosted services (e.g., OpenAI Assistants API) providing higher-level abstractions, managing state and aspects of tool orchestration via API calls." },
  
  "kc6.1": { title: "API Access", description: "Agents utilizing LLM capabilities to interact with APIs." },
  "kc6.1.1": { title: "Limited API Access", description: "Agent generates some parameters for a predefined API call. Compromise can lead to API attacks via LLM-generated parameters." },
  "kc6.1.2": { title: "Extensive API Access", description: "Agent generates the entire API call. Compromise can lead to unwanted API calls and attacks." },
  "kc6.2": { title: "Code Execution", description: "Agents utilizing LLM capabilities for code-related tasks." },
  "kc6.2.1": { title: "Limited Code Execution Capability", description: "Agent generates parameters for a predefined function. Compromise can lead to code injection." },
  "kc6.2.2": { title: "Extensive Code Execution Capability", description: "Agent runs LLM-generated code. Compromise can lead to arbitrary code execution." },
  "kc6.3": { title: "Database Execution", description: "Agents utilizing LLM capabilities to interact with databases." },
  "kc6.3.1": { title: "Limited Database Execution Capability", description: "Agent runs specific queries/commands with limited permissions (e.g., read-only, parameterized writes). Compromise can lead to data exfiltration or limited malicious writes." },
  "kc6.3.2": { title: "Extensive Database Execution Capability", description: "Agent generates and runs all CRUD operations. Compromise can lead to major data alteration, deletion, or leakage." },
  "kc6.3.3": { title: "Agent Memory or Context Data Sources (RAG)", description: "Agent uses external datasources for context or updates records. Compromise can disrupt data or provide malformed information." },
  "kc6.4": { title: "Web Access Capabilities (Web-Use)", description: "Agent utilizing LLM for browser operations. Compromise (often from untrusted web content) can lead to unwanted operations on behalf of the user." },
  "kc6.5": { title: "Controlling PC Operations (PC-Use)", description: "Agent utilizing LLM for OS operations, including file system. Compromise can lead to unwanted operations, data leakage, or malicious actions like encrypting files." },
  "kc6.6": { title: "Operating Critical Systems", description: "Agent utilizing LLM to operate critical systems (e.g., SCADA). Compromise can cause catastrophic failures." },
  "kc6.7": { title: "Access to IoT Devices", description: "Agent controlling IoT devices. Compromise could impact the operational environment or misuse devices." },
  
  // Main component data
  "kc1": { title: "Language Models (LLMs)", description: "The core cognitive engine or \"brain\" of the agent (e.g., GPT-4, Claude), responsible for understanding, reasoning, planning, and generating responses. This includes various types of language models." },
  "kc2": { title: "Orchestration (Control Flow)", description: "Mechanisms that dictate the agent's overall behavior, information flow, and decision-making processes. The specific mechanism depends on the architecture and impacts responsiveness and efficiency." },
  "kc3": { title: "Reasoning / Planning Paradigm", description: "How agents utilize LLMs to solve complex tasks requiring multiple steps and strategic thinking by breaking down high-level tasks into smaller sub-tasks." },
  "kc4": { title: "Memory Modules", description: "Enable the agent to retain short-term (immediate context) and long-term information (past interactions, knowledge) for coherent and personalized interactions. Context sensitivity is used to reduce risk. RAG with vector databases is common for long-term memory." },
  "kc5": { title: "Tool Integration Frameworks", description: "Allow agents to extend capabilities by using external tools (APIs, functions, data stores) to interact with the real world or other systems. Manages tool selection and use." },
  "kc6": { title: "Operational Environment (Agencies)", description: "API access, code execution, database operations" }
};

// Helper function to get component data by ID
const getComponentDataById = (id: string) => {
  // First try the component data map
  const componentData = componentDataMap[id];
  if (componentData) {
    return componentData;
  }
  
  // Fallback to searching in framework data
  const searchInFramework = (nodes: ComponentNode[]): ComponentNode | null => {
    for (const node of nodes) {
      if (node.id === id || node.id.replace(/-/g, '.') === id) return node;
      if (node.children) {
        const found = searchInFramework(node.children);
        if (found) return found;
      }
    }
    return null;
  };
  return searchInFramework(frameworkData);
};

const ArchitectureNavigator: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSimulationRunning, setIsSimulationRunning] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [filters, setFilters] = useState({
    architecture: true,
    component: true,
    threat: true,
    mitigation: true
  });

  // Build graph data
  const { nodes, links } = useMemo(() => {
    const nodeMap = new Map<string, GraphNode>();
    const linkArray: GraphLink[] = [];

    // Helper to add node
    const addNode = (id: string, name: string, type: GraphNode['type'], description: string, color: string, size: number, riskScore?: number, tags?: string[]) => {
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
          group: type === 'architecture' ? 0 : type === 'component' ? 1 : type === 'threat' ? 2 : 3
        });
      }
    };

    // Helper to add link
    const addLink = (sourceId: string, targetId: string, type: GraphLink['type'], strength: number = 1) => {
      linkArray.push({
        source: sourceId,
        target: targetId,
        type,
        strength
      });
    };

    try {
      // Add architecture nodes
      Object.values(architecturesData).forEach((arch: Architecture) => {
        addNode(
          arch.id,
          arch.name,
          'architecture',
          arch.description,
          '#3b82f6', // Blue for architectures
          60,
          arch.riskScore,
          arch.tags
        );

        // Add component nodes and links
        (arch.keyComponents || []).forEach(compId => {
          const component = getComponentDataById(compId);
          if (component) {
            addNode(
              compId,
              component.title,
              'component',
              component.description || '',
              '#22c55e', // Green for components
              40,
              undefined,
              component.threatCategories
            );
            addLink(arch.id, compId, 'arch-comp', 2);

            // Add threat nodes and links
            (arch.threatIds || []).forEach(threatId => {
              const threat = threatsData[threatId];
              if (threat) {
                // Check if this threat affects the current component (handle both dot and dash notation)
                const normalizedCompId = compId.replace(/\./g, '-');
                const mainCompId = compId.includes('.') ? compId.split('.')[0] : compId;
                
                const threatAffectsComponent = threat.componentIds?.some(tCompId => 
                  tCompId === compId || 
                  tCompId === normalizedCompId || 
                  tCompId === mainCompId ||
                  tCompId.replace(/-/g, '.') === compId
                );

                if (threatAffectsComponent) {
                  addNode(
                    threatId,
                    threat.name,
                    'threat',
                    threat.description,
                    '#ef4444', // Red for threats
                    30,
                    threat.riskScore,
                    threat.tags
                  );
                  addLink(compId, threatId, 'comp-threat', threat.riskScore ? threat.riskScore / 10 : 1);

                  // Add mitigation nodes and links
                  (arch.mitigationIds || []).forEach(mitigationId => {
                    const mitigation = mitigationsData[mitigationId];
                    if (mitigation && mitigation.threatIds?.includes(threatId)) {
                      addNode(
                        mitigationId,
                        mitigation.name,
                        'mitigation',
                        mitigation.description,
                        '#f59e0b', // Orange for mitigations
                        25,
                        undefined,
                        mitigation.tags
                      );
                      addLink(threatId, mitigationId, 'threat-mitigation', 1.5);
                    }
                  });
                }
              }
            });
          }
        });
      });
    } catch (error) {
      console.error('Error building graph data:', error);
    }

    return {
      nodes: Array.from(nodeMap.values()),
      links: linkArray
    };
  }, []);

  // Filter nodes and links based on search and filters
  const filteredData = useMemo(() => {
    const filteredNodes = nodes.filter(node => {
      // Type filter
      if (!filters[node.type]) return false;
      
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          node.name.toLowerCase().includes(searchLower) ||
          node.description.toLowerCase().includes(searchLower) ||
          node.tags?.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }
      
      return true;
    });

    const nodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredLinks = links.filter(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      return nodeIds.has(sourceId) && nodeIds.has(targetId);
    });

    return { nodes: filteredNodes, links: filteredLinks };
  }, [nodes, links, filters, searchTerm]);

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const isMobile = window.innerWidth < 768; // md breakpoint
        setDimensions({
          width: rect.width,
          height: isMobile ? Math.max(400, rect.height) : Math.max(600, rect.height)
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // D3 visualization
  useEffect(() => {
    if (!svgRef.current || !dimensions.width || !filteredData.nodes.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const g = svg.append('g');

    // Create zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);
    
    // Click on empty space to clear selection
    svg.on('click', () => {
      setSelectedNode(null);
      
      // Reset all node positions and visibility
      node.transition()
        .duration(500)
        .style('opacity', 1);
      
      link.transition()
        .duration(500)
        .style('opacity', 0.6);
      
      // Release all fixed positions
      filteredData.nodes.forEach(n => {
        n.fx = null;
        n.fy = null;
      });
      
      // Restart simulation to spread nodes naturally
      if (simulationRef.current) {
        simulationRef.current.alpha(0.3).restart();
      }
    });

    // Create simulation with improved forces
    const isMobile = dimensions.width < 768;
    const mobileScale = isMobile ? 0.6 : 1; // Scale down for mobile
    
    const simulation = d3.forceSimulation<GraphNode>(filteredData.nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(filteredData.links)
        .id(d => d.id)
        .distance(d => {
          const baseDistance = {
            'arch-comp': 120,
            'comp-threat': 80,
            'threat-mitigation': 60,
            default: 80
          };
          const distance = baseDistance[d.type] || baseDistance.default;
          return distance * mobileScale;
        })
        .strength(d => d.strength * 0.8))
      .force('charge', d3.forceManyBody<GraphNode>()
        .strength(d => {
          const baseStrength = {
            'architecture': -1500,
            'component': -800,
            'threat': -600,
            'mitigation': -400,
            default: -600
          };
          const strength = baseStrength[d.type] || baseStrength.default;
          return strength * mobileScale;
        }))
      .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force('collision', d3.forceCollide<GraphNode>()
        .radius(d => (d.size + 15) * mobileScale)
        .strength(0.8))
      .force('x', d3.forceX(dimensions.width / 2).strength(0.05))
      .force('y', d3.forceY(dimensions.height / 2).strength(0.05));

    simulationRef.current = simulation;

    // Create arrow markers for directed links
    const defs = svg.append('defs');
    
    ['arch-comp', 'comp-threat', 'threat-mitigation'].forEach(type => {
      defs.append('marker')
        .attr('id', `arrow-${type}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 15)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', type === 'arch-comp' ? '#3b82f6' : type === 'comp-threat' ? '#ef4444' : '#f59e0b');
    });

    // Create links
    const link = g.append('g')
      .selectAll('.link')
      .data(filteredData.links)
      .join('line')
      .attr('class', 'link')
      .attr('stroke', d => {
        switch (d.type) {
          case 'arch-comp': return '#3b82f6';
          case 'comp-threat': return '#ef4444';
          case 'threat-mitigation': return '#f59e0b';
          default: return '#999';
        }
      })
      .attr('stroke-width', d => Math.max(1, d.strength * 2))
      .attr('stroke-opacity', 0.6)
      .attr('marker-end', d => `url(#arrow-${d.type})`);

    // Create drag behavior with sticky nodes
    const drag = d3.drag<SVGGElement, GraphNode>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        // Keep nodes at their dragged position (don't reset fx/fy to null)
        // This makes nodes "stick" where they're dragged
      });

    // Create node groups
    const node = g.append('g')
      .selectAll('.node')
      .data(filteredData.nodes)
      .join('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(drag)
      .on('click', (event, d) => {
        setSelectedNode(d);
        event.stopPropagation();
        
        // Get connected nodes
        const connectedNodeIds = new Set<string>();
        const connectedNodes: GraphNode[] = [];
        
        filteredData.links.forEach(link => {
          const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
          const targetId = typeof link.target === 'string' ? link.target : link.target.id;
          if (sourceId === d.id) {
            connectedNodeIds.add(targetId);
            const targetNode = filteredData.nodes.find(n => n.id === targetId);
            if (targetNode) connectedNodes.push(targetNode);
          }
          if (targetId === d.id) {
            connectedNodeIds.add(sourceId);
            const sourceNode = filteredData.nodes.find(n => n.id === sourceId);
            if (sourceNode) connectedNodes.push(sourceNode);
          }
        });

        // Hide unconnected nodes and links
        node.transition()
          .duration(500)
          .style('opacity', n => n.id === d.id || connectedNodeIds.has(n.id) ? 1 : 0.1);
        
        link.transition()
          .duration(500)
          .style('opacity', l => {
            const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
            const targetId = typeof l.target === 'string' ? l.target : l.target.id;
            return sourceId === d.id || targetId === d.id ? 1 : 0.05;
          });

        // Spread out connected nodes in a circle around the selected node
        if (connectedNodes.length > 0) {
          const centerX = d.x || 0;
          const centerY = d.y || 0;
          const radius = 150; // Distance from center
          
          connectedNodes.forEach((connectedNode, index) => {
            const angle = (2 * Math.PI * index) / connectedNodes.length;
            const targetX = centerX + radius * Math.cos(angle);
            const targetY = centerY + radius * Math.sin(angle);
            
            // Animate to new position
            connectedNode.fx = targetX;
            connectedNode.fy = targetY;
          });
          
          // Fix the selected node at its current position
          d.fx = centerX;
          d.fy = centerY;
          
          // Restart simulation with lower alpha to animate smoothly
          if (simulationRef.current) {
            simulationRef.current.alpha(0.3).restart();
          }
        }
      })
      .on('mouseover', (event, d) => {
        // Highlight connected nodes
        const connectedNodeIds = new Set<string>();
        filteredData.links.forEach(link => {
          const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
          const targetId = typeof link.target === 'string' ? link.target : link.target.id;
          if (sourceId === d.id) connectedNodeIds.add(targetId);
          if (targetId === d.id) connectedNodeIds.add(sourceId);
        });

        node.style('opacity', n => n.id === d.id || connectedNodeIds.has(n.id) ? 1 : 0.3);
        link.style('opacity', l => {
          const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
          const targetId = typeof l.target === 'string' ? l.target : l.target.id;
          return sourceId === d.id || targetId === d.id ? 1 : 0.1;
        });
      })
      .on('mouseout', () => {
        node.style('opacity', 1);
        link.style('opacity', 0.6);
      });

    // Add circles
    node.append('circle')
      .attr('r', d => d.size * mobileScale)
      .attr('fill', d => d.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Add risk indicators for threats
    node.filter(d => d.type === 'threat' && d.riskScore && d.riskScore > 0)
      .append('circle')
      .attr('r', d => (d.size + 5) * mobileScale)
      .attr('fill', 'none')
      .attr('stroke', d => {
        const risk = d.riskScore || 0;
        return risk >= 8 ? '#dc2626' : risk >= 6 ? '#ea580c' : '#eab308';
      })
      .attr('stroke-width', 3)
      .attr('stroke-dasharray', '5,5');

    // Add labels
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', d => (d.size + 20) * mobileScale)
      .attr('font-size', d => {
        const baseSizes = {
          'architecture': 14,
          'component': 12,
          'threat': 10,
          'mitigation': 9,
          default: 10
        };
        const size = baseSizes[d.type] || baseSizes.default;
        return `${size * mobileScale}px`;
      })
      .attr('font-weight', d => d.type === 'architecture' ? 'bold' : 'normal')
      .attr('fill', () => {
        // Check if dark mode is active
        const isDarkMode = document.documentElement.classList.contains('dark');
        return isDarkMode ? '#e5e7eb' : '#374151'; // Light gray for dark mode, dark gray for light mode
      })
      .text(d => {
        const maxLength = isMobile ? (d.type === 'architecture' ? 15 : 10) : (d.type === 'architecture' ? 20 : 15);
        return d.name.length > maxLength ? d.name.substring(0, maxLength) + '...' : d.name;
      });

    // Add type indicators
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 5)
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('fill', '#fff')
      .text(d => d.type.charAt(0).toUpperCase());

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as GraphNode).x || 0)
        .attr('y1', d => (d.source as GraphNode).y || 0)
        .attr('x2', d => (d.target as GraphNode).x || 0)
        .attr('y2', d => (d.target as GraphNode).y || 0);

      node.attr('transform', d => `translate(${d.x || 0},${d.y || 0})`);
    });

    // Initial zoom to fit - with delay to ensure nodes are positioned
    setTimeout(() => {
      const bounds = (g.node() as SVGGElement)?.getBBox();
      if (bounds && bounds.width > 0 && bounds.height > 0) {
        const fullWidth = dimensions.width;
        const fullHeight = dimensions.height;
        const width = bounds.width;
        const height = bounds.height;
        const midX = bounds.x + width / 2;
        const midY = bounds.y + height / 2;
        const scale = Math.min(fullWidth / width, fullHeight / height) * 0.6;
        const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];

        svg.transition()
          .duration(1000)
          .call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
      }
    }, 1000);

    return () => {
      simulation.stop();
    };
  }, [filteredData, dimensions]);

  // Control functions
  const zoomIn = useCallback(() => {
    if (svgRef.current) {
      d3.select(svgRef.current).transition().call(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 1.5
      );
    }
  }, []);

  const zoomOut = useCallback(() => {
    if (svgRef.current) {
      d3.select(svgRef.current).transition().call(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 1 / 1.5
      );
    }
  }, []);

  const resetZoom = useCallback(() => {
    if (svgRef.current) {
      d3.select(svgRef.current).transition().call(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        d3.zoom<SVGSVGElement, unknown>().transform as any,
        d3.zoomIdentity
      );
    }
  }, []);

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

  const centerView = useCallback(() => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      const g = svg.select('g');
      const bounds = (g.node() as SVGGElement)?.getBBox();
      
      if (bounds && bounds.width > 0 && bounds.height > 0) {
        const fullWidth = dimensions.width;
        const fullHeight = dimensions.height;
        const width = bounds.width;
        const height = bounds.height;
        const midX = bounds.x + width / 2;
        const midY = bounds.y + height / 2;
        const scale = Math.min(fullWidth / width, fullHeight / height) * 0.6;
        const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];

        svg.transition()
          .duration(750)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .call(d3.zoom<SVGSVGElement, unknown>().transform as any,
            d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
      }
    }
  }, [dimensions]);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        // Enter fullscreen
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        // Exit fullscreen
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
      // Fallback to CSS-only fullscreen
      setIsFullscreen(!isFullscreen);
    }
  }, [isFullscreen]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Early return for debugging
  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
          <p className="text-muted-foreground">
            No architecture data found. Check the console for details.
          </p>
          <div className="mt-4 text-sm text-muted-foreground">
            <p>Architectures: {Object.keys(architecturesData).length}</p>
            <p>Framework Components: {frameworkData.length}</p>
            <p>Threats: {Object.keys(threatsData).length}</p>
            <p>Mitigations: {Object.keys(mitigationsData).length}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col lg:flex-row gap-4 h-full",
      isFullscreen && "fixed inset-0 z-[9999] bg-background p-4"
    )}>
      {/* Controls Panel */}
      <div className={cn(
        "lg:w-80 space-y-4",
        isFullscreen && "lg:w-72 max-h-screen overflow-y-auto"
      )}>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search nodes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Controls */}
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={zoomIn} variant="outline" size="sm" title="Zoom In">
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button onClick={zoomOut} variant="outline" size="sm" title="Zoom Out">
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button onClick={centerView} variant="outline" size="sm" title="Center View">
                  <Target className="h-4 w-4" />
                </Button>
                <Button onClick={resetZoom} variant="outline" size="sm" title="Reset Zoom">
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button onClick={toggleFullscreen} variant="outline" size="sm" title="Toggle Fullscreen" className="col-span-2">
                  {isFullscreen ? <Minimize className="h-4 w-4 mr-2" /> : <Maximize className="h-4 w-4 mr-2" />}
                  {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                </Button>
                <Button onClick={toggleSimulation} variant="outline" size="sm" title={isSimulationRunning ? "Pause Animation" : "Start Animation"} className="col-span-2">
                  {isSimulationRunning ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                  {isSimulationRunning ? "Pause" : "Start"}
                </Button>
              </div>

              {/* Filters */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Show/Hide</h4>
                {Object.entries(filters).map(([type, enabled]) => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => setFilters(prev => ({ ...prev, [type]: !prev[type] }))}
                      className="rounded"
                    />
                    <span className="text-sm capitalize">{type}s</span>
                  </label>
                ))}
              </div>

              {/* Instructions */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Instructions</h4>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Click nodes to select and see details</p>
                  <p>• Drag nodes to reposition them</p>
                  <p>• Use mouse wheel to zoom</p>
                  <p>• Click empty space to deselect</p>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Legend</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                    <span>Architecture</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    <span>Component</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-red-500"></div>
                    <span>Threat</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                    <span>Mitigation</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Node Details */}
        {selectedNode && (
          <Card>
            <CardContent className="p-4 max-h-80 overflow-y-auto">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: selectedNode.color }}
                  />
                  <h3 className="font-semibold">{selectedNode.name}</h3>
                </div>
                
                <Badge variant="outline" className="capitalize">
                  {selectedNode.type}
                </Badge>
                
                <p className="text-sm text-muted-foreground">
                  {selectedNode.description}
                </p>
                
                {selectedNode.riskScore && (
                  <div>
                    <div className="text-sm font-medium mb-1">Risk Score</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div
                          className={cn(
                            "h-2 rounded-full",
                            selectedNode.riskScore >= 8 ? "bg-red-500" :
                            selectedNode.riskScore >= 6 ? "bg-orange-500" :
                            "bg-yellow-500"
                          )}
                          style={{ width: `${(selectedNode.riskScore / 10) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm">{selectedNode.riskScore}/10</span>
                    </div>
                  </div>
                )}
                
                {selectedNode.tags && selectedNode.tags.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-1">Tags</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedNode.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Visualization */}
      <div className="flex-1 min-h-0" ref={containerRef}>
        <Card className="h-full">
          <CardContent className="p-0 h-full relative overflow-hidden">
            <svg
              ref={svgRef}
              width={dimensions.width}
              height={dimensions.height}
              className="w-full h-full block"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ArchitectureNavigator;

// Export with old name for compatibility
export const HierarchicalArchitectureNavigator = ArchitectureNavigator; 
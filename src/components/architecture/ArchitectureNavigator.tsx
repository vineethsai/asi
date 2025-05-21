import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import { cn } from '@/lib/utils';

type D3DragEvent = d3.D3DragEvent<SVGGElement, Node, Node>;
type D3DragBehavior = d3.DragBehavior<SVGGElement, Node, Node>;

const RISK_COLORS = [
  '#10b981', // 1 - green-500
  '#84cc16', // 2 - lime-500
  '#f59e0b', // 3 - amber-500
  '#f97316', // 4 - orange-500
  '#ef4444'  // 5 - red-500
];

// Node types in the hierarchy
type NodeType = 'architecture' | 'component' | 'threat' | 'mitigation';

interface Node extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: NodeType;
  description?: string;
  riskSeverity?: number; // 1-5 scale
  color: string;
  size: number;
  connections: number;
  parent: string[];
  expanded: boolean;
  visible: boolean;
  fx?: number | null;
  fy?: number | null;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node | number;
  target: string | Node | number;
  value: number;
  type: 'architecture-component' | 'component-threat' | 'threat-mitigation';
}

interface ArchitectureComponentRelation {
  architecture: string;
  components: string[];
}

export const HierarchicalArchitectureNavigator: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 800 });
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [filters, setFilters] = useState<Record<NodeType, boolean>>({
    architecture: true,
    component: true,
    threat: true,
    mitigation: true
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [nodeData, setNodeData] = useState<Node[]>([]);
  const [linkData, setLinkData] = useState<Link[]>([]);

  // Node and link data
  const { nodes, architectureComponents } = useMemo((): { 
    nodes: Node[]; 
    architectureComponents: ArchitectureComponentRelation[] 
  } => {
    // Architecture nodes
    const architectureNodes: Node[] = [
      { 
        id: "arch1", 
        name: "Sequential", 
        type: "architecture", 
        description: "A straightforward linear workflow where a single agent processes input through planning, execution, and basic tool use.",
        color: "#4682B4", // Steel Blue
        size: 50,
        connections: 0,
        parent: [],
        expanded: false,
        visible: true
      },
      { 
        id: "arch2", 
        name: "Hierarchical", 
        type: "architecture", 
        description: "An orchestrator agent breaks down complex tasks and distributes them to specialized sub-agents.",
        color: "#4682B4",
        size: 50,
        connections: 0,
        parent: [],
        expanded: false,
        visible: true
      },
      { 
        id: "arch3", 
        name: "Collaborative Swarm", 
        type: "architecture", 
        description: "A pattern where multiple peer agents work together without strict hierarchy.",
        color: "#4682B4",
        size: 50,
        connections: 0,
        parent: [],
        expanded: false,
        visible: true
      },
      { 
        id: "arch4", 
        name: "Reactive", 
        type: "architecture", 
        description: "Agents that respond to stimuli with predefined actions, often using ReAct paradigm.",
        color: "#4682B4",
        size: 50,
        connections: 0,
        parent: [],
        expanded: false,
        visible: true
      },
      { 
        id: "arch5", 
        name: "Knowledge-Intensive", 
        type: "architecture", 
        description: "Focuses on extensive knowledge retrieval and processing capabilities.",
        color: "#4682B4",
        size: 50,
        connections: 0,
        parent: [],
        expanded: false,
        visible: true
      }
    ];
    
    // Component nodes - initially hidden until architecture is expanded
    const componentNodes: Node[] = [
      { 
        id: "kc1", 
        name: "KC1: Large Language Models (LLMs)", 
        type: "component", 
        description: "Core AI models that form the 'brain' of the agent system.",
        color: "#5cb85c", // Green
        size: 25,
        connections: 0,
        parent: [],
        expanded: false,
        visible: false
      },
      { 
        id: "kc2", 
        name: "KC2: Orchestration (Control Flow)", 
        type: "component", 
        description: "Systems that manage workflow and coordination between components.",
        color: "#5cb85c",
        size: 25,
        connections: 0,
        parent: [],
        expanded: false,
        visible: false
      },
      { 
        id: "kc3", 
        name: "KC3: Reasoning/Planning Paradigm", 
        type: "component", 
        description: "Decision-making processes and planning capabilities.",
        color: "#5cb85c",
        size: 25,
        connections: 0,
        parent: [],
        expanded: false,
        visible: false
      },
      { 
        id: "kc4", 
        name: "KC4: Memory Modules", 
        type: "component", 
        description: "Storage and retrieval mechanisms for agent knowledge and state.",
        color: "#5cb85c",
        size: 25,
        connections: 0,
        parent: [],
        expanded: false,
        visible: false
      },
      { 
        id: "kc5", 
        name: "KC5: Tool Integration Frameworks", 
        type: "component", 
        description: "Systems for extending agent capabilities through external tools.",
        color: "#5cb85c",
        size: 25,
        connections: 0,
        parent: [],
        expanded: false,
        visible: false
      },
      { 
        id: "kc6", 
        name: "KC6: Operational Environment", 
        type: "component", 
        description: "Runtime context and execution environment for agents.",
        color: "#5cb85c",
        size: 25,
        connections: 0,
        parent: [],
        expanded: false,
        visible: false
      }
    ];
    
    // Threat nodes - initially hidden until component is expanded
    const threatNodes: Node[] = [
      { 
        id: "t1", 
        name: "T1: Memory Poisoning", 
        type: "threat", 
        description: "Corruption or manipulation of agent memory systems.",
        color: "#d9534f", // Red
        size: 20,
        connections: 0,
        parent: ["kc4"],
        expanded: false,
        visible: false,
        riskSeverity: 4
      },
      { 
        id: "t2", 
        name: "T2: Tool Misuse", 
        type: "threat", 
        description: "Exploiting tools in ways not intended by designers.",
        color: "#d9534f",
        size: 20,
        connections: 0,
        parent: ["kc5", "kc6"],
        expanded: false,
        visible: false,
        riskSeverity: 5
      },
      { 
        id: "t3", 
        name: "T3: Privilege Compromise", 
        type: "threat", 
        description: "Gaining unauthorized access levels through component vulnerabilities.",
        color: "#d9534f",
        size: 20,
        connections: 0,
        parent: ["kc4", "kc5", "kc6"],
        expanded: false,
        visible: false,
        riskSeverity: 5
      },
      { 
        id: "t4", 
        name: "T4: Resource Overload", 
        type: "threat", 
        description: "Overwhelming system resources to cause failures or degradation.",
        color: "#d9534f",
        size: 20,
        connections: 0,
        parent: ["kc6"],
        expanded: false,
        visible: false,
        riskSeverity: 3
      },
      { 
        id: "t5", 
        name: "T5: Cascading Hallucination", 
        type: "threat", 
        description: "Incorrect information that propagates throughout the system.",
        color: "#d9534f",
        size: 20,
        connections: 0,
        parent: ["kc1", "kc3", "kc4"],
        expanded: false,
        visible: false,
        riskSeverity: 4
      },
      { 
        id: "t6", 
        name: "T6: Intent Breaking", 
        type: "threat", 
        description: "Manipulating the agent to pursue unintended goals.",
        color: "#d9534f",
        size: 20,
        connections: 0,
        parent: ["kc1", "kc2", "kc3", "kc4", "kc5"],
        expanded: false,
        visible: false,
        riskSeverity: 5
      },
      { 
        id: "t7", 
        name: "T7: Misaligned Behaviors", 
        type: "threat", 
        description: "Model alignment issues leading to harmful behaviors.",
        color: "#d9534f",
        size: 20,
        connections: 0,
        parent: ["kc1", "kc3", "kc5"],
        expanded: false,
        visible: false,
        riskSeverity: 4
      },
      { 
        id: "t8", 
        name: "T8: Repudiation", 
        type: "threat", 
        description: "Making agent actions difficult to trace or audit.",
        color: "#d9534f",
        size: 20,
        connections: 0,
        parent: ["kc2", "kc3", "kc4", "kc5"],
        expanded: false,
        visible: false,
        riskSeverity: 3
      },
      { 
        id: "t9", 
        name: "T9: Identity Spoofing", 
        type: "threat", 
        description: "Falsifying agent identity in multi-agent systems.",
        color: "#d9534f",
        size: 20,
        connections: 0,
        parent: ["kc2"],
        expanded: false,
        visible: false,
        riskSeverity: 4
      },
      { 
        id: "t10", 
        name: "T10: Overwhelming HITL", 
        type: "threat", 
        description: "Overloading human oversight mechanisms.",
        color: "#d9534f",
        size: 20,
        connections: 0,
        parent: ["kc2", "kc6"],
        expanded: false,
        visible: false,
        riskSeverity: 3
      },
      { 
        id: "t11", 
        name: "T11: Unexpected RCE", 
        type: "threat", 
        description: "Executing unexpected code through agent systems.",
        color: "#d9534f",
        size: 20,
        connections: 0,
        parent: ["kc5", "kc6"],
        expanded: false,
        visible: false,
        riskSeverity: 5
      },
      { 
        id: "t12", 
        name: "T12: Communication Poisoning", 
        type: "threat", 
        description: "Corrupting inter-agent messaging systems.",
        color: "#d9534f",
        size: 20,
        connections: 0,
        parent: ["kc2", "kc4", "kc6"],
        expanded: false,
        visible: false,
        riskSeverity: 4
      },
      { 
        id: "t13", 
        name: "T13: Rogue Agents", 
        type: "threat", 
        description: "Agents operating outside intended constraints.",
        color: "#d9534f",
        size: 20,
        connections: 0,
        parent: ["kc2", "kc6"],
        expanded: false,
        visible: false,
        riskSeverity: 5
      },
      { 
        id: "t14", 
        name: "T14: Human Attacks", 
        type: "threat", 
        description: "Exploiting trust relationships between agents and humans.",
        color: "#d9534f",
        size: 20,
        connections: 0,
        parent: ["kc2"],
        expanded: false,
        visible: false,
        riskSeverity: 4
      },
      { 
        id: "t15", 
        name: "T15: Human Manipulation", 
        type: "threat", 
        description: "Using agent capabilities to manipulate human users.",
        color: "#d9534f",
        size: 20,
        connections: 0,
        parent: ["kc1", "kc3", "kc6"],
        expanded: false,
        visible: false,
        riskSeverity: 4
      }
    ];
    
    // Mitigation nodes (examples) - initially hidden until threat is expanded
    const mitigationNodes: Node[] = [
      { 
        id: "m1", 
        name: "Input Validation", 
        type: "mitigation", 
        description: "Validation of all inputs to prevent injection attacks.",
        color: "#f0ad4e", // Orange
        size: 15,
        connections: 0,
        parent: ["t1", "t2", "t5"],
        expanded: false,
        visible: false
      },
      { 
        id: "m2", 
        name: "Secure Memory Design", 
        type: "mitigation", 
        description: "Architectures that prevent unauthorized memory access or modification.",
        color: "#f0ad4e",
        size: 15,
        connections: 0,
        parent: ["t1", "t3"],
        expanded: false,
        visible: false
      },
      { 
        id: "m3", 
        name: "Least Privilege", 
        type: "mitigation", 
        description: "Ensuring agents operate with minimal necessary permissions.",
        color: "#f0ad4e",
        size: 15,
        connections: 0,
        parent: ["t2", "t3", "t11"],
        expanded: false,
        visible: false
      },
      { 
        id: "m4", 
        name: "Resource Limiting", 
        type: "mitigation", 
        description: "Setting bounds on resource consumption to prevent DoS.",
        color: "#f0ad4e",
        size: 15,
        connections: 0,
        parent: ["t4", "t10"],
        expanded: false,
        visible: false
      },
      { 
        id: "m5", 
        name: "Multi-source Verification", 
        type: "mitigation", 
        description: "Validating information across multiple sources.",
        color: "#f0ad4e",
        size: 15,
        connections: 0,
        parent: ["t5", "t7"],
        expanded: false,
        visible: false
      },
      { 
        id: "m6", 
        name: "Goal Integrity Checks", 
        type: "mitigation", 
        description: "Regular validation that agent goals remain aligned with intended purpose.",
        color: "#f0ad4e",
        size: 15,
        connections: 0,
        parent: ["t6", "t7", "t13"],
        expanded: false,
        visible: false
      },
      { 
        id: "m7", 
        name: "Comprehensive Logging", 
        type: "mitigation", 
        description: "Detailed audit trails of all agent actions and decisions.",
        color: "#f0ad4e",
        size: 15,
        connections: 0,
        parent: ["t8", "t9", "t13", "t14"],
        expanded: false,
        visible: false
      },
      { 
        id: "m8", 
        name: "Agent Authentication", 
        type: "mitigation", 
        description: "Strong identity verification for all agent communications.",
        color: "#f0ad4e",
        size: 15,
        connections: 0,
        parent: ["t9", "t12", "t13"],
        expanded: false,
        visible: false
      },
      { 
        id: "m9", 
        name: "Human-in-the-loop Design", 
        type: "mitigation", 
        description: "Requiring human approval for critical actions.",
        color: "#f0ad4e",
        size: 15,
        connections: 0,
        parent: ["t10", "t14", "t15"],
        expanded: false,
        visible: false
      },
      { 
        id: "m10", 
        name: "Sandboxed Execution", 
        type: "mitigation", 
        description: "Isolating code execution in secure environments.",
        color: "#f0ad4e",
        size: 15,
        connections: 0,
        parent: ["t11"],
        expanded: false,
        visible: false
      },
      { 
        id: "m11", 
        name: "Secure Communication", 
        type: "mitigation", 
        description: "Encrypted and authenticated message passing.",
        color: "#f0ad4e",
        size: 15,
        connections: 0,
        parent: ["t12"],
        expanded: false,
        visible: false
      },
      { 
        id: "m12", 
        name: "Explainability Tools", 
        type: "mitigation", 
        description: "Mechanisms to understand and interpret agent behavior.",
        color: "#f0ad4e",
        size: 15,
        connections: 0,
        parent: ["t7", "t15"],
        expanded: false,
        visible: false
      }
    ];

    // Define relationships between architectures and components
    const architectureComponents: ArchitectureComponentRelation[] = [
      { architecture: "arch1", components: ["kc1", "kc2", "kc3", "kc4", "kc5", "kc6"] },
      { architecture: "arch2", components: ["kc1", "kc2", "kc3", "kc4", "kc5", "kc6"] },
      { architecture: "arch3", components: ["kc1", "kc2", "kc3", "kc4", "kc5", "kc6"] },
      { architecture: "arch4", components: ["kc1", "kc2", "kc3", "kc4", "kc5", "kc6"] },
      { architecture: "arch5", components: ["kc1", "kc3", "kc4", "kc5", "kc6"] }
    ];
    
    // Combine all nodes
    const nodes = [...architectureNodes, ...componentNodes, ...threatNodes, ...mitigationNodes];
    
    return { nodes, architectureComponents };
  }, []);

  // --- INITIALIZE: Only root architectures visible at first ---
  useEffect(() => {
    setNodeData(nodes.map(node => ({
      ...node,
      visible: node.type === 'architecture' && node.parent.length === 0,
      expanded: false
    })));
  }, [nodes]);

  // --- FILTER NODES BASED ON SEARCH AND TYPE FILTERS ---
  const visibleNodes = useMemo(() => {
    return nodeData.filter(node => {
      // Only show nodes that pass visibility rules (expanded parent, etc)
      if (!node.visible) return false;
      
      // Apply type filter
      if (!filters[node.type]) return false;
      
      // Apply search filter if present
      if (searchTerm && searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        return (
          node.name.toLowerCase().includes(term) || 
          (node.description && node.description.toLowerCase().includes(term))
        );
      }
      
      return true;
    });
  }, [nodeData, filters, searchTerm]);

  // --- EXPAND/COLLAPSE LOGIC ---
  // Helper function to update parent-child relationships before visualization
  const updateComponentParents = useCallback(() => {
    const updatedNodes = [...nodeData];

    // Update component parents based on architecture relationships
    architectureComponents.forEach(relation => {
      relation.components.forEach(compId => {
        const compNode = updatedNodes.find(n => n.id === compId);
        if (compNode && !compNode.parent.includes(relation.architecture)) {
          compNode.parent.push(relation.architecture);
        }
      });
    });

    setNodeData(updatedNodes);
  }, [nodeData, architectureComponents]);

  // Run the update once after initial load
  useEffect(() => {
    if (nodeData.length > 0) {
      updateComponentParents();
    }
  }, [nodeData.length, updateComponentParents]);

  // Recursively show/hide children
  const setChildrenVisibility = useCallback((parentId: string, visible: boolean, updatedNodes: Node[]) => {
    // Find children of this parent
    const children = updatedNodes.filter(node => node.parent.includes(parentId));
    
    // Update each child's visibility
    children.forEach(child => {
      const childIndex = updatedNodes.findIndex(n => n.id === child.id);
      if (childIndex >= 0) {
        updatedNodes[childIndex].visible = visible;
        
        // If we're hiding nodes, also collapse them
        if (!visible) {
          updatedNodes[childIndex].expanded = false;
        }
        
        // Recursively update this child's children if it's expanded
        if (updatedNodes[childIndex].expanded) {
          setChildrenVisibility(child.id, visible, updatedNodes);
        }
      }
    });
  }, []);

  // FIX: Define a specific node click handler for D3
  const handleNodeClick = useCallback((d: Node) => {
    console.log("Node clicked:", d.id, d.type);
    
    // Only expandable node types can be clicked to expand
    if (d.type !== 'architecture' && d.type !== 'component' && d.type !== 'threat') {
      setSelectedNode(d);
      return;
    }
    
    // Clone the node data array to avoid direct state mutation
    const updatedNodes = [...nodeData];
    const nodeIndex = updatedNodes.findIndex(n => n.id === d.id);
    
    if (nodeIndex >= 0) {
      // Toggle expanded state
      updatedNodes[nodeIndex].expanded = !updatedNodes[nodeIndex].expanded;
      
      // Update children visibility based on new expanded state
      setChildrenVisibility(
        d.id, 
        updatedNodes[nodeIndex].expanded, 
        updatedNodes
      );
      
      setNodeData(updatedNodes);
    }
  }, [nodeData, setChildrenVisibility]);

  // Expand all nodes
  const handleExpandAll = useCallback(() => {
    const updatedNodes = [...nodeData];
    
    // First pass: expand all expandable nodes
    updatedNodes.forEach(node => {
      if (node.type === 'architecture' || node.type === 'component' || node.type === 'threat') {
        node.expanded = true;
      }
    });
    
    // Second pass: set visibility for all nodes based on parent-child relationships
    // Make all architecture nodes visible
    updatedNodes.filter(n => n.type === 'architecture').forEach(arch => {
      setChildrenVisibility(arch.id, true, updatedNodes);
    });
    
    setNodeData(updatedNodes);
  }, [nodeData, setChildrenVisibility]);

  // Collapse all nodes
  const handleCollapseAll = useCallback(() => {
    const updatedNodes = [...nodeData];
    updatedNodes.forEach(node => {
      node.expanded = false;
      node.visible = node.type === 'architecture'; // Only architectures remain visible
    });
    setNodeData(updatedNodes);
  }, [nodeData]);

  // --- LINK GENERATION: Only between visible nodes ---
  const generateLinks = useCallback((): Link[] => {
    const links: Link[] = [];
    const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
    
    // Architecture -> Component
    architectureComponents.forEach(rel => {
      if (visibleNodeIds.has(rel.architecture)) {
        const arch = nodeData.find(n => n.id === rel.architecture);
        if (arch?.expanded) {
          rel.components.forEach(compId => {
            if (visibleNodeIds.has(compId)) {
              links.push({
                source: rel.architecture,
                target: compId,
                value: 2,
                type: 'architecture-component'
              });
            }
          });
        }
      }
    });
    
    // Component -> Threat
    nodeData.filter(n => n.type === 'threat' && visibleNodeIds.has(n.id)).forEach(threat => {
      threat.parent.forEach(compId => {
        if (visibleNodeIds.has(compId)) {
          const comp = nodeData.find(n => n.id === compId);
          if (comp?.expanded) {
            links.push({
              source: compId,
              target: threat.id,
              value: threat.riskSeverity || 3,
              type: 'component-threat'
            });
          }
        }
      });
    });
    
    // Threat -> Mitigation
    nodeData.filter(n => n.type === 'mitigation' && visibleNodeIds.has(n.id)).forEach(mitigation => {
      mitigation.parent.forEach(threatId => {
        if (visibleNodeIds.has(threatId)) {
          const threat = nodeData.find(n => n.id === threatId);
          if (threat?.expanded) {
            links.push({
              source: threatId,
              target: mitigation.id,
              value: 1,
              type: 'threat-mitigation'
            });
          }
        }
      });
    });
    
    return links;
  }, [nodeData, visibleNodes, architectureComponents]);

  // --- UPDATE LINKS WHEN NODE VISIBILITY CHANGES ---
  useEffect(() => {
    setLinkData(generateLinks());
  }, [visibleNodes, generateLinks]);

  // --- UPDATE DIMENSIONS ON RESIZE ---
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: Math.max(600, window.innerHeight * 0.7)
        });
      }
    };
    
    handleResize(); // Initial call
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Filter change handler
  const handleFilterChange = (type: NodeType) => {
    setFilters(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  // Search term handler
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Set up the simulation
  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0 || visibleNodes.length === 0) return;
    
    const svg = d3.select(svgRef.current);
    
    // Clear previous simulation
    svg.selectAll('*').remove();
    
    // Add a group for the visualization
    const g = svg.append('g');
    
    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        g.attr('transform', event.transform.toString());
      });
    
    svg.call(zoom as any);
    
    // Create simulation
    const simulation = d3.forceSimulation<Node>(visibleNodes)
      .force('link', d3.forceLink<Node, Link>(linkData)
        .id(d => d.id)
        .distance(d => {
          // Different distance based on node types
          if (d.type === 'architecture-component') return 200;
          if (d.type === 'component-threat') return 150;
          return 100;
        })
        .strength(0.7))
      .force('charge', d3.forceManyBody<Node>().strength(-800))
      .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force('collision', d3.forceCollide<Node>()
        .radius(d => d.size + 30)
        .strength(0.9))
      .force('x', d3.forceX(dimensions.width / 2).strength(0.1))
      .force('y', d3.forceY(dimensions.height / 2).strength(0.1));
    
    // Create drag behavior
    const drag = d3.drag<SVGGElement, Node, Node>()
      .on('start', (event: D3DragEvent) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        const node = event.subject;
        node.fx = node.x;
        node.fy = node.y;
      })
      .on('drag', (event: D3DragEvent) => {
        const node = event.subject;
        node.fx = event.x;
        node.fy = event.y;
      })
      .on('end', (event: D3DragEvent) => {
        if (!event.active) simulation.alphaTarget(0);
        const node = event.subject;
        node.fx = null;
        node.fy = null;
      }) as unknown as D3DragBehavior;
    
    // Draw links
    const link = g.append('g')
      .selectAll<SVGLineElement, Link>('.link')
      .data(linkData)
      .join('line')
      .attr('class', 'link')
      .attr('stroke', (d: Link) => {
        if (d.type === 'component-threat') {
          return RISK_COLORS[Math.min(d.value, 5) - 1];
        }
        return '#999';
      })
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', (d: Link) => {
        if (d.type === 'architecture-component') return 2;
        if (d.type === 'component-threat') return 1.5 + (d.value || 0) * 0.5;
        return 1.5;
      });
    
    // Draw nodes
    const nodeGroups = g.append('g')
      .selectAll<SVGGElement, Node>('.node')
      .data(visibleNodes, d => d.id)
      .join('g')
      .attr('class', 'node')
      .attr('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        setSelectedNode(d);
      })
      .on('mouseout', () => {
        setSelectedNode(null);
      })
      .call(drag);
    
    // Add circles for nodes
    nodeGroups.append('circle')
      .attr('r', d => d.size)
      .attr('fill', d => d.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('opacity', 0.9)
      // FIX: Add click handler directly to the circle
      .on('click', (event, d) => {
        event.stopPropagation();
        handleNodeClick(d);
      });
    
    // Add expand/collapse indicator for appropriate nodes
    nodeGroups.filter(d => d.type === 'architecture' || d.type === 'component' || d.type === 'threat')
      .append('circle')
      .attr('class', 'expandable')
      .attr('r', 8)
      .attr('cx', d => d.size - 5)
      .attr('cy', d => -d.size + 5)
      .attr('fill', '#fff')
      .attr('stroke', '#333')
      .attr('stroke-width', 1.5)
      // FIX: Add click handler to the expand/collapse icon
      .on('click', (event, d) => {
        event.stopPropagation();
        handleNodeClick(d);
      });
    
    // Add +/- signs
    nodeGroups.filter(d => d.type === 'architecture' || d.type === 'component' || d.type === 'threat')
      .append('text')
      .attr('class', 'expand-icon')
      .attr('x', d => d.size - 5)
      .attr('y', d => -d.size + 9)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('pointer-events', 'none')
      .text(d => d.expanded ? '−' : '+'); // Using Unicode minus sign
    
    // Add text labels
    nodeGroups.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('fill', d => d.type === 'architecture' ? '#fff' : '#000')
      .attr('font-size', d => {
        if (d.type === 'architecture') return '14px';
        if (d.type === 'component') return '12px';
        if (d.type === 'threat') return '10px';
        return '9px';
      })
      .attr('font-weight', d => d.type === 'architecture' ? 'bold' : 'normal')
      .attr('paint-order', 'stroke')
      .attr('stroke', d => d.type === 'architecture' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.8)')
      .attr('stroke-width', '2px')
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')
      .attr('pointer-events', 'none')
      .text(d => {
        // Shorter labels for better fit
        if (d.type === 'architecture') return d.name;
        if (d.type === 'component') return d.id.toUpperCase();
        if (d.type === 'threat') return d.id.toUpperCase();
        return d.name.split(':')[0];
      });
    
    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => {
          const source = typeof d.source === 'object' ? d.source : visibleNodes.find(n => n.id === d.source);
          return source?.x || 0;
        })
        .attr('y1', d => {
          const source = typeof d.source === 'object' ? d.source : visibleNodes.find(n => n.id === d.source);
          return source?.y || 0;
        })
        .attr('x2', d => {
          const target = typeof d.target === 'object' ? d.target : visibleNodes.find(n => n.id === d.target);
          return target?.x || 0;
        })
        .attr('y2', d => {
          const target = typeof d.target === 'object' ? d.target : visibleNodes.find(n => n.id === d.target);
          return target?.y || 0;
        });
      
      nodeGroups.attr('transform', d => `translate(${d.x || 0},${d.y || 0})`);
    });
    
    // Initial zoom to fit
    const initialZoom = d3.zoomIdentity.scale(0.8).translate(dimensions.width / 2, dimensions.height / 2);
    svg.call(zoom.transform as any, initialZoom);
    
    return () => {
      simulation.stop();
    };
  }, [dimensions, visibleNodes, linkData, handleNodeClick]);

  return (
    <div className="flex flex-col h-full w-full bg-card rounded-xl overflow-hidden">
      {/* Controls */}
      <div className="p-3 sm:p-4 border-b border-border flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3">
        <div className="w-full sm:flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search components, threats, or patterns..."
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button 
            onClick={handleExpandAll}
            className="flex-1 sm:flex-none px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm rounded-md transition-colors"
          >
            Expand All
          </button>
          <button 
            onClick={handleCollapseAll}
            className="flex-1 sm:flex-none px-3 py-1.5 bg-muted hover:bg-muted/80 text-muted-foreground text-sm rounded-md transition-colors"
          >
            Collapse All
          </button>
        </div>
        <div className="flex items-center flex-wrap gap-4">
          {Object.entries(filters).map(([type, isActive]) => (
            <label key={type} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={() => handleFilterChange(type as NodeType)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                {type}s
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-blue-500 mr-1.5"></div>
          <span>Architectures</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-green-500 mr-1.5"></div>
          <span>Components</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-red-500 mr-1.5"></div>
          <span>Threats</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-orange-400 mr-1.5"></div>
          <span>Mitigations</span>
        </div>
        <div className="ml-4 flex items-center">
          <span className="mr-2">Risk:</span>
          {[1, 2, 3, 4, 5].map((level) => (
            <div key={level} className="flex items-center mr-3">
              <div 
                className="w-4 h-4 rounded-sm mr-1.5" 
                style={{ backgroundColor: RISK_COLORS[level - 1] }}
              ></div>
              <span>{level}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Visualization */}
      <div ref={containerRef} className="flex-1 relative">
        <svg 
          ref={svgRef} 
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        />
        
        {/* Tooltip */}
        {selectedNode && (
          <div 
            ref={tooltipRef}
            className="absolute bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 max-w-xs border border-gray-200 dark:border-gray-700 z-10"
            style={{
              left: `${(selectedNode.x || 0) + 30}px`,
              top: `${(selectedNode.y || 0) - 30}px`,
              transform: 'translateY(-50%)',
              pointerEvents: 'none'
            }}
          >
            <h3 className="font-bold text-lg mb-1">{selectedNode.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              {selectedNode.description || 'No description available'}
            </p>
            {selectedNode.riskSeverity !== undefined && (
              <div className="flex items-center">
                <span className="text-sm font-medium mr-2">Risk:</span>
                <div 
                  className="h-2 rounded-full flex-1"
                  style={{
                    background: `linear-gradient(to right, ${RISK_COLORS.slice(0, selectedNode.riskSeverity).join(', ')})`,
                    width: `${selectedNode.riskSeverity * 20}%`
                  }}
                ></div>
                <span className="ml-2 text-sm font-medium">{selectedNode.riskSeverity}/5</span>
              </div>
            )}
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Connections: {selectedNode.connections}
            </div>
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {selectedNode.type === "architecture" || selectedNode.type === "component" || selectedNode.type === "threat" ? 
                `Click to ${selectedNode.expanded ? 'collapse' : 'expand'}` : ''}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HierarchicalArchitectureNavigator;
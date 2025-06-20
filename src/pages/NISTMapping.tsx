import { useState, useMemo, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import * as d3 from "d3";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { aisvsData } from "../components/components/securityData";
import SidebarNav from "../components/layout/SidebarNav";
import { Helmet } from "react-helmet";
import { Search, Shield, Target, ExternalLink, GitBranch, ArrowRight, CheckCircle, AlertTriangle, BookOpen, Network, Layers } from "lucide-react";

// NIST AI RMF Framework Structure
interface NISTFunction {
  id: string;
  code: string;
  name: string;
  description: string;
  categories: NISTCategory[];
  color: string;
  icon: string;
}

interface NISTCategory {
  id: string;
  code: string;
  name: string;
  description: string;
  subcategories: NISTSubcategory[];
}

interface NISTSubcategory {
  id: string;
  code: string;
  name: string;
  description: string;
  aisvsMapping: string[]; // AISVS category codes that map to this subcategory
}

// NIST AI RMF Data Structure
const nistAIRMF: NISTFunction[] = [
  {
    id: "govern",
    code: "GOVERN",
    name: "Govern",
    description: "The organization's approach to managing AI risk is addressed through organizational governance structures and processes.",
    color: "#3b82f6",
    icon: "shield",
    categories: [
      {
        id: "govern.1",
        code: "GOVERN.1",
        name: "Policies, Processes, Procedures, and Practices",
        description: "AI governance, risk management, and assurance processes and practices are established, maintained, and documented.",
        subcategories: [
          {
            id: "govern.1.1",
            code: "GOVERN.1.1",
            name: "Legal and Regulatory Requirements",
            description: "Legal and regulatory requirements involving AI are understood, managed, and documented.",
            aisvsMapping: ["C1", "C5", "C11"]
          },
          {
            id: "govern.1.2",
            code: "GOVERN.1.2", 
            name: "AI Risk Management Strategy",
            description: "A comprehensive AI risk management strategy is developed, documented, and implemented.",
            aisvsMapping: ["C1", "C3", "C12"]
          },
          {
            id: "govern.1.3",
            code: "GOVERN.1.3",
            name: "Roles and Responsibilities",
            description: "Roles and responsibilities for AI governance are clearly defined and assigned.",
            aisvsMapping: ["C5", "C13"]
          }
        ]
      },
      {
        id: "govern.2",
        code: "GOVERN.2", 
        name: "Human-AI Configuration",
        description: "The organization's approach to designing, developing, and using AI systems accounts for human considerations.",
        subcategories: [
          {
            id: "govern.2.1",
            code: "GOVERN.2.1",
            name: "Human-AI Interaction Design",
            description: "Human-AI configurations are designed to be meaningful and appropriate for their intended use.",
            aisvsMapping: ["C13", "C7"]
          },
          {
            id: "govern.2.2",
            code: "GOVERN.2.2",
            name: "Human Review and Decision Authority",
            description: "Human review and decision-making authority are maintained for consequential decisions.",
            aisvsMapping: ["C13", "C7"]
          }
        ]
      },
      {
        id: "govern.3",
        code: "GOVERN.3",
        name: "AI Risk Management",
        description: "Processes and procedures for AI risk management are established, maintained, and documented.",
        subcategories: [
          {
            id: "govern.3.1",
            code: "GOVERN.3.1",
            name: "AI Risk Assessment",
            description: "AI risks are regularly assessed and documented throughout the AI lifecycle.",
            aisvsMapping: ["C1", "C3", "C12"]
          },
          {
            id: "govern.3.2",
            code: "GOVERN.3.2",
            name: "Risk Tolerance and Appetite",
            description: "Risk tolerance and appetite are clearly defined and communicated for AI systems.",
            aisvsMapping: ["C3", "C13"]
          }
        ]
      }
    ]
  },
  {
    id: "map",
    code: "MAP",
    name: "Map",
    description: "The organization's approach to understanding AI system contexts, risks, and impacts is established.",
    color: "#10b981",
    icon: "network",
    categories: [
      {
        id: "map.1",
        code: "MAP.1",
        name: "AI System Context",
        description: "The AI system's context of use and operating environment are understood and documented.",
        subcategories: [
          {
            id: "map.1.1",
            code: "MAP.1.1",
            name: "System Purpose and Use Cases",
            description: "AI system purpose, intended use cases, and operating context are clearly defined.",
            aisvsMapping: ["C3", "C7"]
          },
          {
            id: "map.1.2",
            code: "MAP.1.2",
            name: "Stakeholder Analysis",
            description: "Stakeholders who may be impacted by the AI system are identified and their concerns documented.",
            aisvsMapping: ["C11", "C13"]
          }
        ]
      },
      {
        id: "map.2",
        code: "MAP.2",
        name: "Categorization and Impact Assessment",
        description: "AI systems are categorized and their potential impacts are assessed.",
        subcategories: [
          {
            id: "map.2.1",
            code: "MAP.2.1",
            name: "AI System Categorization",
            description: "AI systems are categorized based on their impact level and risk profile.",
            aisvsMapping: ["C3", "C12"]
          },
          {
            id: "map.2.2",
            code: "MAP.2.2",
            name: "Impact Assessment",
            description: "Potential positive and negative impacts of AI systems are identified and assessed.",
            aisvsMapping: ["C1", "C11", "C12"]
          }
        ]
      },
      {
        id: "map.3",
        code: "MAP.3",
        name: "AI Risk Identification",
        description: "AI risks and their potential sources are identified and documented.",
        subcategories: [
          {
            id: "map.3.1",
            code: "MAP.3.1",
            name: "Risk Source Identification",
            description: "Sources of AI risk throughout the system lifecycle are identified.",
            aisvsMapping: ["C1", "C6", "C10"]
          },
          {
            id: "map.3.2",
            code: "MAP.3.2",
            name: "Threat Modeling",
            description: "AI-specific threats and attack vectors are identified and documented.",
            aisvsMapping: ["C2", "C8", "C9", "C10"]
          }
        ]
      }
    ]
  },
  {
    id: "measure",
    code: "MEASURE",
    name: "Measure",
    description: "Identified AI risks are analyzed, assessed, and prioritized.",
    color: "#f59e0b",
    icon: "target",
    categories: [
      {
        id: "measure.1",
        code: "MEASURE.1",
        name: "Performance Measurement",
        description: "AI system performance is measured and monitored throughout the lifecycle.",
        subcategories: [
          {
            id: "measure.1.1",
            code: "MEASURE.1.1",
            name: "Performance Metrics",
            description: "Appropriate performance metrics for AI systems are defined and measured.",
            aisvsMapping: ["C3", "C12"]
          },
          {
            id: "measure.1.2",
            code: "MEASURE.1.2",
            name: "Bias and Fairness Testing",
            description: "AI systems are tested for bias and fairness throughout development and deployment.",
            aisvsMapping: ["C1", "C11"]
          }
        ]
      },
      {
        id: "measure.2",
        code: "MEASURE.2",
        name: "Risk Assessment and Analysis",
        description: "AI risks are assessed and analyzed using appropriate methods and tools.",
        subcategories: [
          {
            id: "measure.2.1",
            code: "MEASURE.2.1",
            name: "Risk Analysis Methods",
            description: "Appropriate methods for AI risk analysis are selected and applied.",
            aisvsMapping: ["C3", "C10", "C12"]
          },
          {
            id: "measure.2.2",
            code: "MEASURE.2.2",
            name: "Security Testing",
            description: "AI systems undergo appropriate security testing and vulnerability assessment.",
            aisvsMapping: ["C2", "C4", "C8", "C9", "C10"]
          }
        ]
      }
    ]
  },
  {
    id: "manage",
    code: "MANAGE",
    name: "Manage",
    description: "Identified AI risks are prioritized and managed according to organizational risk tolerance.",
    color: "#ef4444",
    icon: "layers",
    categories: [
      {
        id: "manage.1",
        code: "MANAGE.1",
        name: "Risk Response",
        description: "AI risks are responded to according to organizational risk tolerance and strategy.",
        subcategories: [
          {
            id: "manage.1.1",
            code: "MANAGE.1.1",
            name: "Risk Treatment Plans",
            description: "Risk treatment plans for AI systems are developed and implemented.",
            aisvsMapping: ["C1", "C2", "C3", "C4", "C5"]
          },
          {
            id: "manage.1.2",
            code: "MANAGE.1.2",
            name: "Control Implementation",
            description: "Appropriate controls are implemented to manage identified AI risks.",
            aisvsMapping: ["C2", "C4", "C5", "C7", "C8", "C9"]
          }
        ]
      },
      {
        id: "manage.2",
        code: "MANAGE.2",
        name: "Incident Response",
        description: "AI incidents are detected, responded to, and managed appropriately.",
        subcategories: [
          {
            id: "manage.2.1",
            code: "MANAGE.2.1",
            name: "Incident Detection",
            description: "AI-related incidents and anomalies are detected and reported.",
            aisvsMapping: ["C12", "C13"]
          },
          {
            id: "manage.2.2",
            code: "MANAGE.2.2",
            name: "Incident Response Procedures",
            description: "Procedures for responding to AI incidents are established and maintained.",
            aisvsMapping: ["C12", "C13"]
          }
        ]
      },
      {
        id: "manage.3",
        code: "MANAGE.3",
        name: "Third-Party Risk Management",
        description: "Third-party AI risks are identified and managed appropriately.",
        subcategories: [
          {
            id: "manage.3.1",
            code: "MANAGE.3.1",
            name: "Vendor Assessment",
            description: "Third-party AI vendors and services are assessed for risk.",
            aisvsMapping: ["C6"]
          },
          {
            id: "manage.3.2",
            code: "MANAGE.3.2",
            name: "Supply Chain Security",
            description: "AI supply chain risks are identified and managed.",
            aisvsMapping: ["C6"]
          }
        ]
      }
    ]
  }
];

export const NISTMapping = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFunction, setSelectedFunction] = useState<string>("all");
  const [selectedAISVS, setSelectedAISVS] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("overview");
  
  // D3 Graph State
  const svgRef = useRef<SVGSVGElement>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedNodeData, setSelectedNodeData] = useState<any>(null);
  const [focusMode, setFocusMode] = useState<boolean>(false);

  // Convert AISVS data for easier access
  const aisvsCategories = Object.values(aisvsData);

  // Filter NIST functions based on search and filters
  const filteredNISTFunctions = useMemo(() => {
    return nistAIRMF.filter(func => {
      const matchesSearch = searchTerm === "" ||
        func.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        func.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        func.categories.some(cat =>
          cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cat.subcategories.some(sub =>
            sub.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
        );

      const matchesFunction = selectedFunction === "all" || func.id === selectedFunction;

      const matchesAISVS = selectedAISVS === "all" ||
        func.categories.some(cat =>
          cat.subcategories.some(sub =>
            sub.aisvsMapping.includes(selectedAISVS)
          )
        );

      return matchesSearch && matchesFunction && matchesAISVS;
    });
  }, [searchTerm, selectedFunction, selectedAISVS]);

  // Get AISVS category info
  const getAISVSCategory = (code: string) => {
    return aisvsCategories.find(cat => cat.code === code);
  };

  // Calculate mapping statistics
  const mappingStats = useMemo(() => {
    const totalNISTSubcategories = nistAIRMF.reduce((total, func) =>
      total + func.categories.reduce((catTotal, cat) => catTotal + cat.subcategories.length, 0), 0
    );

    const mappedSubcategories = nistAIRMF.reduce((total, func) =>
      total + func.categories.reduce((catTotal, cat) =>
        catTotal + cat.subcategories.filter(sub => sub.aisvsMapping.length > 0).length, 0
      ), 0
    );

    const aisvsWithMappings = aisvsCategories.filter(cat =>
      nistAIRMF.some(func =>
        func.categories.some(nistCat =>
          nistCat.subcategories.some(sub =>
            sub.aisvsMapping.includes(cat.code)
          )
        )
      )
    ).length;

    return {
      totalNISTSubcategories,
      mappedSubcategories,
      aisvsWithMappings,
      coveragePercentage: Math.round((mappedSubcategories / totalNISTSubcategories) * 100)
    };
  }, [aisvsCategories]);

  // D3 Graph Data Structure
  const graphData = useMemo(() => {
    interface GraphNode {
      id: string;
      type: 'nist-function' | 'nist-category' | 'nist-subcategory' | 'aisvs-category';
      label: string;
      description?: string;
      color: string;
      parentId?: string;
      x?: number;
      y?: number;
      fx?: number | null;
      fy?: number | null;
      expanded?: boolean;
      visible?: boolean;
      data?: any;
    }

    interface GraphLink {
      source: string;
      target: string;
      type: 'hierarchy' | 'mapping';
      visible?: boolean;
    }

    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    // Add NIST Function nodes
    nistAIRMF.forEach((func, funcIndex) => {
      nodes.push({
        id: func.id,
        type: 'nist-function',
        label: func.code,
        description: func.name,
        color: func.color,
        x: 200,
        y: 150 + funcIndex * 150,
        expanded: expandedNodes.has(func.id),
        visible: true,
        data: func
      });

      // Add categories and subcategories if function is expanded
      if (expandedNodes.has(func.id)) {
        func.categories.forEach((category, catIndex) => {
          const categoryId = `${func.id}-${category.id}`;
          nodes.push({
            id: categoryId,
            type: 'nist-category',
            label: category.code,
            description: category.name,
            color: func.color,
            parentId: func.id,
            x: 400,
            y: 100 + funcIndex * 150 + catIndex * 60,
            expanded: expandedNodes.has(categoryId),
            visible: true,
            data: category
          });

          // Hierarchy link from function to category
          links.push({
            source: func.id,
            target: categoryId,
            type: 'hierarchy',
            visible: true
          });

          // Add subcategories if category is expanded
          if (expandedNodes.has(categoryId)) {
            category.subcategories.forEach((subcategory, subIndex) => {
              const subcategoryId = `${categoryId}-${subcategory.id}`;
              nodes.push({
                id: subcategoryId,
                type: 'nist-subcategory',
                label: subcategory.code,
                description: subcategory.name,
                color: func.color,
                parentId: categoryId,
                x: 600,
                y: 80 + funcIndex * 150 + catIndex * 60 + subIndex * 30,
                visible: true,
                data: subcategory
              });

              // Hierarchy link from category to subcategory
              links.push({
                source: categoryId,
                target: subcategoryId,
                type: 'hierarchy',
                visible: true
              });

              // Add mapping links to AISVS categories
              subcategory.aisvsMapping.forEach(aisvsCode => {
                const aisvsId = `aisvs-${aisvsCode}`;
                
                // Ensure AISVS node exists
                if (!nodes.find(n => n.id === aisvsId)) {
                  const aisvsCategory = getAISVSCategory(aisvsCode);
                  if (aisvsCategory) {
                    const aisvsIndex = aisvsCategories.findIndex(cat => cat.code === aisvsCode);
                    nodes.push({
                      id: aisvsId,
                      type: 'aisvs-category',
                      label: aisvsCategory.code,
                      description: aisvsCategory.name,
                      color: aisvsCategory.color,
                      x: 900,
                      y: 100 + aisvsIndex * 45,
                      visible: true,
                      data: aisvsCategory
                    });
                  }
                }

                // Add mapping link
                links.push({
                  source: subcategoryId,
                  target: aisvsId,
                  type: 'mapping',
                  visible: true
                });
              });
            });
          }
        });
      }
    });

    // Add standalone AISVS nodes for those not yet connected
    aisvsCategories.forEach((category, index) => {
      const aisvsId = `aisvs-${category.code}`;
      if (!nodes.find(n => n.id === aisvsId)) {
        nodes.push({
          id: aisvsId,
          type: 'aisvs-category',
          label: category.code,
          description: category.name,
          color: category.color,
          x: 900,
          y: 100 + index * 45,
          visible: true,
          data: category
        });
      }
    });

    // Apply focus mode filtering
    if (focusMode && selectedNode) {
      // Get all nodes and links related to the selected node
      const relatedNodeIds = new Set<string>();
      const relatedLinkIds = new Set<string>();
      
      // Add the selected node itself
      relatedNodeIds.add(selectedNode);
      
      // Find all links connected to the selected node
      links.forEach((link, index) => {
        const sourceId = typeof link.source === 'string' ? link.source : (link.source as any)?.id || link.source;
        const targetId = typeof link.target === 'string' ? link.target : (link.target as any)?.id || link.target;
        
        if (sourceId === selectedNode || targetId === selectedNode) {
          relatedLinkIds.add(`${sourceId}-${targetId}`);
          relatedNodeIds.add(sourceId);
          relatedNodeIds.add(targetId);
        }
      });
      
      // If selected node is AISVS, also include parent hierarchy for connected NIST nodes
      if (selectedNode.startsWith('aisvs-')) {
        links.forEach(link => {
          const targetId = typeof link.target === 'string' ? link.target : (link.target as any)?.id || link.target;
          if (targetId === selectedNode && link.type === 'mapping') {
            const nistSubcategoryId = typeof link.source === 'string' ? link.source : (link.source as any)?.id || link.source;
            relatedNodeIds.add(nistSubcategoryId);
            
            // Find parent category and function
            const subcategoryNode = nodes.find(n => n.id === nistSubcategoryId);
            if (subcategoryNode?.parentId) {
              relatedNodeIds.add(subcategoryNode.parentId);
              
              // Add hierarchy links
              relatedLinkIds.add(`${subcategoryNode.parentId}-${nistSubcategoryId}`);
              
              const categoryNode = nodes.find(n => n.id === subcategoryNode.parentId);
              if (categoryNode?.parentId) {
                relatedNodeIds.add(categoryNode.parentId);
                relatedLinkIds.add(`${categoryNode.parentId}-${subcategoryNode.parentId}`);
              }
            }
          }
        });
      }
      
      // If selected node is NIST, include its hierarchy
      if (!selectedNode.startsWith('aisvs-')) {
        // Find children in hierarchy
                  const findChildren = (nodeId: string) => {
            links.forEach(link => {
              const sourceId = typeof link.source === 'string' ? link.source : (link.source as any)?.id || link.source;
              if (sourceId === nodeId && link.type === 'hierarchy') {
                const childId = typeof link.target === 'string' ? link.target : (link.target as any)?.id || link.target;
                relatedNodeIds.add(childId);
                relatedLinkIds.add(`${nodeId}-${childId}`);
                findChildren(childId); // Recursively find children
              }
            });
          };
        
        // Find parents in hierarchy
        const findParents = (nodeId: string) => {
          const node = nodes.find(n => n.id === nodeId);
          if (node?.parentId) {
            relatedNodeIds.add(node.parentId);
            relatedLinkIds.add(`${node.parentId}-${nodeId}`);
            findParents(node.parentId);
          }
        };
        
        findChildren(selectedNode);
        findParents(selectedNode);
      }
      
      // Update node visibility
      nodes.forEach(node => {
        node.visible = relatedNodeIds.has(node.id);
      });
      
      // Update link visibility
      links.forEach(link => {
        const sourceId = typeof link.source === 'string' ? link.source : (link.source as any)?.id || link.source;
        const targetId = typeof link.target === 'string' ? link.target : (link.target as any)?.id || link.target;
        const linkId = `${sourceId}-${targetId}`;
        
        // Show link only if both nodes are visible and link is in related set
        link.visible = relatedNodeIds.has(sourceId) && relatedNodeIds.has(targetId) && 
                     (relatedLinkIds.has(linkId) || relatedLinkIds.has(`${targetId}-${sourceId}`));
      });
    } else {
      // Normal mode - show all visible nodes and links
      nodes.forEach(node => {
        if (node.visible === undefined) node.visible = true;
      });
      links.forEach(link => {
        if (link.visible === undefined) link.visible = true;
      });
    }

    return { nodes, links };
  }, [expandedNodes, aisvsCategories, getAISVSCategory, focusMode, selectedNode]);

  // D3 Graph Rendering Effect
  useEffect(() => {
    if (!svgRef.current || activeTab !== 'graph') return;

    const svg = d3.select(svgRef.current);
    const width = 1200;
    const height = 800;

    // Clear previous content
    svg.selectAll("*").remove();

    // Setup zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        container.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Create main container
    const container = svg.append("g");

    // Add background grid
    const defs = svg.append("defs");
    const pattern = defs.append("pattern")
      .attr("id", "grid")
      .attr("width", 40)
      .attr("height", 40)
      .attr("patternUnits", "userSpaceOnUse");

    pattern.append("path")
      .attr("d", "M 40 0 L 0 0 0 40")
      .attr("fill", "none")
      .attr("stroke", "currentColor")
      .attr("stroke-width", 0.5)
      .attr("opacity", 0.1);

    container.append("rect")
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "url(#grid)");

    // Create force simulation
    const simulation = d3.forceSimulation(graphData.nodes)
      .force("link", d3.forceLink(graphData.links)
        .id((d: any) => d.id)
        .distance((d: any) => d.type === 'hierarchy' ? 100 : 200)
        .strength((d: any) => d.type === 'hierarchy' ? 0.8 : 0.3)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(30));

    // Create links
    const link = container.append("g")
      .selectAll("line")
      .data(graphData.links.filter(l => l.visible))
      .enter().append("line")
      .attr("stroke", (d: any) => d.type === 'hierarchy' ? "#666" : "#999")
      .attr("stroke-width", (d: any) => d.type === 'hierarchy' ? 2 : 1)
      .attr("stroke-dasharray", (d: any) => d.type === 'mapping' ? "5,5" : "none")
      .attr("opacity", 0.6);

    // Create node groups
    const node = container.append("g")
      .selectAll("g")
      .data(graphData.nodes.filter(n => n.visible))
      .enter().append("g")
      .attr("class", "node")
      .style("cursor", "pointer")
      .call(d3.drag<SVGGElement, any>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      );

    // Add node shapes based on type
    node.each(function(d: any) {
      const nodeGroup = d3.select(this);
      
      if (d.type === 'nist-function') {
        // Large circles for NIST functions
        nodeGroup.append("circle")
          .attr("r", 40)
          .attr("fill", d.color)
          .attr("opacity", 0.8)
          .attr("stroke", "white")
          .attr("stroke-width", 3);
          
        // Plus/minus indicator for expansion
        const indicator = nodeGroup.append("circle")
          .attr("r", 8)
          .attr("cx", 28)
          .attr("cy", -28)
          .attr("fill", "white")
          .attr("stroke", d.color)
          .attr("stroke-width", 2);
          
        nodeGroup.append("text")
          .attr("x", 28)
          .attr("y", -24)
          .attr("text-anchor", "middle")
          .attr("font-size", "12px")
          .attr("font-weight", "bold")
          .attr("fill", d.color)
          .text(d.expanded ? "−" : "+");
          
      } else if (d.type === 'nist-category') {
        // Rounded rectangles for categories
        nodeGroup.append("rect")
          .attr("x", -40)
          .attr("y", -15)
          .attr("width", 80)
          .attr("height", 30)
          .attr("rx", 15)
          .attr("fill", d.color)
          .attr("opacity", 0.7)
          .attr("stroke", "white")
          .attr("stroke-width", 2);
          
        // Plus/minus indicator for expansion
        nodeGroup.append("circle")
          .attr("r", 6)
          .attr("cx", 30)
          .attr("cy", -10)
          .attr("fill", "white")
          .attr("stroke", d.color)
          .attr("stroke-width", 2);
          
        nodeGroup.append("text")
          .attr("x", 30)
          .attr("y", -6)
          .attr("text-anchor", "middle")
          .attr("font-size", "10px")
          .attr("font-weight", "bold")
          .attr("fill", d.color)
          .text(d.expanded ? "−" : "+");
          
      } else if (d.type === 'nist-subcategory') {
        // Small rectangles for subcategories
        nodeGroup.append("rect")
          .attr("x", -30)
          .attr("y", -10)
          .attr("width", 60)
          .attr("height", 20)
          .attr("rx", 10)
          .attr("fill", d.color)
          .attr("opacity", 0.6)
          .attr("stroke", "white")
          .attr("stroke-width", 1);
          
      } else if (d.type === 'aisvs-category') {
        // Rounded rectangles for AISVS categories
        nodeGroup.append("rect")
          .attr("x", -50)
          .attr("y", -12)
          .attr("width", 100)
          .attr("height", 24)
          .attr("rx", 12)
          .attr("fill", d.color)
          .attr("opacity", 0.8)
          .attr("stroke", "white")
          .attr("stroke-width", 2);
      }
      
      // Add labels
      nodeGroup.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", d.type === 'nist-function' ? "0.35em" : "0.35em")
        .attr("font-size", d.type === 'nist-function' ? "12px" : "10px")
        .attr("font-weight", "bold")
        .attr("fill", "white")
        .text(d.label);
        
      // Add description text below for functions
      if (d.type === 'nist-function') {
        nodeGroup.append("text")
          .attr("text-anchor", "middle")
          .attr("dy", "50px")
          .attr("font-size", "10px")
          .attr("fill", "currentColor")
          .attr("opacity", 0.7)
          .text(d.description);
      }
    });

    // Add click handlers for expansion and reverse mapping
    node.on("click", (event, d: any) => {
      event.stopPropagation();
      
      // Check if this is the same node being clicked again
      const isSameNode = selectedNode === d.id;
      
      if (d.type === 'nist-function' || d.type === 'nist-category') {
        const newExpandedNodes = new Set(expandedNodes);
        if (expandedNodes.has(d.id)) {
          newExpandedNodes.delete(d.id);
          // Also collapse all children
          if (d.type === 'nist-function') {
            d.data.categories.forEach((cat: any) => {
              const catId = `${d.id}-${cat.id}`;
              newExpandedNodes.delete(catId);
            });
          }
        } else {
          newExpandedNodes.add(d.id);
        }
        setExpandedNodes(newExpandedNodes);
      } else if (d.type === 'aisvs-category') {
        // For AISVS categories, expand all NIST elements that map to this category
        const newExpandedNodes = new Set(expandedNodes);
        
        // Find all NIST subcategories that map to this AISVS category
        nistAIRMF.forEach(func => {
          func.categories.forEach(cat => {
            cat.subcategories.forEach(sub => {
              if (sub.aisvsMapping.includes(d.label)) {
                // Expand the function and category to show this subcategory
                newExpandedNodes.add(func.id);
                newExpandedNodes.add(`${func.id}-${cat.id}`);
              }
            });
          });
        });
        
        setExpandedNodes(newExpandedNodes);
      }
      
      // Toggle focus mode for AISVS categories and NIST subcategories
      if (d.type === 'aisvs-category' || d.type === 'nist-subcategory') {
        if (isSameNode && focusMode) {
          // If clicking the same node and already in focus mode, exit focus mode
          setFocusMode(false);
          setSelectedNode(null);
          setSelectedNodeData(null);
        } else {
          // Enter focus mode for this node
          setFocusMode(true);
          setSelectedNode(d.id);
          setSelectedNodeData(d);
        }
      } else {
        // For other node types, just select without focus mode
        setFocusMode(false);
        setSelectedNode(d.id);
        setSelectedNodeData(d);
      }
    });

    // Add hover effects
    node.on("mouseenter", function(event, d: any) {
      d3.select(this).select("circle, rect")
        .transition()
        .duration(200)
        .attr("opacity", 1);
        
      // Show tooltip
      const tooltip = container.append("g")
        .attr("class", "tooltip")
        .attr("transform", `translate(${d.x + 50}, ${d.y - 20})`);
        
      const rect = tooltip.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 200)
        .attr("height", 40)
        .attr("rx", 5)
        .attr("fill", "black")
        .attr("opacity", 0.8);
        
      tooltip.append("text")
        .attr("x", 10)
        .attr("y", 15)
        .attr("fill", "white")
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .text(d.label);
        
      tooltip.append("text")
        .attr("x", 10)
        .attr("y", 30)
        .attr("fill", "white")
        .attr("font-size", "10px")
        .text(d.description?.substring(0, 30) + "...");
    })
    .on("mouseleave", function(event, d: any) {
      d3.select(this).select("circle, rect")
        .transition()
        .duration(200)
        .attr("opacity", d.type === 'nist-function' ? 0.8 : 
               d.type === 'aisvs-category' ? 0.8 : 
               d.type === 'nist-category' ? 0.7 : 0.6);
               
      container.selectAll(".tooltip").remove();
    });

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    // Add legend
    const legend = container.append("g")
      .attr("transform", "translate(50, 650)");
      
    legend.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", 300)
      .attr("height", 120)
      .attr("rx", 8)
      .attr("fill", "white")
      .attr("opacity", 0.9)
      .attr("stroke", "currentColor")
      .attr("stroke-width", 1);
      
    legend.append("text")
      .attr("x", 10)
      .attr("y", 20)
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .attr("fill", "currentColor")
      .text("Interactive Legend");
      
    // Legend items
    const legendItems = [
      { type: "circle", r: 8, fill: "#3b82f6", text: "NIST Functions (Click to expand)" },
      { type: "rect", width: 16, height: 8, fill: "#3b82f6", text: "NIST Categories/Subcategories" },
      { type: "rect", width: 20, height: 10, fill: "#10b981", text: "AISVS Categories" },
      { type: "line", stroke: "#999", text: "Mapping Connections" }
    ];
    
    legendItems.forEach((item, i) => {
      const y = 40 + i * 20;
      
      if (item.type === "circle") {
        legend.append("circle")
          .attr("cx", 20)
          .attr("cy", y)
          .attr("r", item.r)
          .attr("fill", item.fill)
          .attr("opacity", 0.8);
      } else if (item.type === "rect") {
        legend.append("rect")
          .attr("x", 20 - item.width! / 2)
          .attr("y", y - item.height! / 2)
          .attr("width", item.width)
          .attr("height", item.height)
          .attr("rx", 4)
          .attr("fill", item.fill)
          .attr("opacity", 0.8);
      } else if (item.type === "line") {
        legend.append("line")
          .attr("x1", 10)
          .attr("y1", y)
          .attr("x2", 30)
          .attr("y2", y)
          .attr("stroke", item.stroke)
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "3,3");
      }
      
      legend.append("text")
        .attr("x", 40)
        .attr("y", y + 4)
        .attr("font-size", "11px")
        .attr("fill", "currentColor")
        .text(item.text);
    });

    // Cleanup function
    return () => {
      simulation.stop();
    };
    
  }, [activeTab, graphData, expandedNodes]);

  return (
    <>
      <Helmet>
        <title>NIST AI RMF to AISVS Mapping | Agentic Security Hub</title>
        <meta name="description" content="Comprehensive visual mapping between NIST AI Risk Management Framework (AI RMF) and OWASP AISVS categories, showing alignment and complementary coverage." />
        <meta name="keywords" content="NIST AI RMF, OWASP AISVS, AI risk management, AI security framework, AI governance, compliance mapping" />
        <link rel="canonical" href="https://agenticsecurity.info/#/nist-mapping" />

        {/* Open Graph */}
        <meta property="og:title" content="NIST AI RMF to AISVS Mapping" />
        <meta property="og:description" content="Visual mapping between NIST AI Risk Management Framework and OWASP AISVS categories." />
        <meta property="og:url" content="https://agenticsecurity.info/#/nist-mapping" />
        <meta property="og:type" content="website" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="NIST AI RMF to AISVS Mapping" />
        <meta name="twitter:description" content="Visual mapping between NIST AI Risk Management Framework and OWASP AISVS categories." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <SidebarNav type="controls" isOpen={false} onClose={() => {}} />

        <main className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <GitBranch className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">NIST AI RMF to AISVS Mapping</h1>
                <p className="text-xl text-muted-foreground">Framework Alignment & Compliance Coverage</p>
              </div>
            </div>

            <p className="text-lg text-muted-foreground mb-6 max-w-4xl">
              Explore the comprehensive mapping between NIST AI Risk Management Framework (AI RMF) 
              and OWASP AI Security Verification Standard (AISVS). This visual guide helps organizations 
              understand how these frameworks complement each other for comprehensive AI governance and security.
            </p>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">NIST Functions</p>
                      <p className="text-2xl font-bold">{nistAIRMF.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">NIST Subcategories</p>
                      <p className="text-2xl font-bold">{mappingStats.totalNISTSubcategories}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="text-sm font-medium">AISVS Categories</p>
                      <p className="text-2xl font-bold">{aisvsCategories.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search & Filter Mappings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search NIST functions, categories, or subcategories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedFunction} onValueChange={setSelectedFunction}>
                  <SelectTrigger>
                    <SelectValue placeholder="All NIST Functions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All NIST Functions</SelectItem>
                    {nistAIRMF.map((func) => (
                      <SelectItem key={func.id} value={func.id}>
                        {func.code} - {func.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedAISVS} onValueChange={setSelectedAISVS}>
                  <SelectTrigger>
                    <SelectValue placeholder="All AISVS Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All AISVS Categories</SelectItem>
                    {aisvsCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.code}>
                        {cat.code} - {cat.name.split(' &')[0]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Framework Overview</TabsTrigger>
              <TabsTrigger value="mapping">Detailed Mapping</TabsTrigger>
              <TabsTrigger value="matrix">Compliance Matrix</TabsTrigger>
              <TabsTrigger value="graph">Interactive Graph</TabsTrigger>
            </TabsList>

            {/* Framework Overview Tab */}
            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* NIST AI RMF Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-blue-500" />
                      NIST AI Risk Management Framework
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      A comprehensive framework for managing AI risks across the entire AI lifecycle, 
                      organized into four core functions that provide a structured approach to AI governance.
                    </p>
                    <div className="space-y-3">
                      {nistAIRMF.map((func) => (
                        <div key={func.id} className="p-3 border rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: func.color }}></div>
                            <h4 className="font-semibold">{func.code}</h4>
                          </div>
                          <p className="text-sm text-muted-foreground">{func.description}</p>
                          <div className="mt-2">
                            <Badge variant="outline" className="text-xs">
                              {func.categories.length} categories
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* AISVS Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      OWASP AI Security Verification Standard
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      A comprehensive set of security requirements and controls specifically designed 
                      for AI systems, providing detailed technical guidance for secure AI implementation.
                    </p>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {aisvsCategories.map((cat) => (
                        <div key={cat.id} className="p-2 border rounded text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}></div>
                            <span className="font-medium">{cat.code}</span>
                            <span className="text-muted-foreground">{cat.name.split(' &')[0]}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Detailed Mapping Tab */}
            <TabsContent value="mapping" className="mt-6">
              <div className="space-y-6">
                {filteredNISTFunctions.map((func) => (
                  <Card key={func.id} className="overflow-hidden">
                    <CardHeader className="pb-4" style={{ backgroundColor: `${func.color}10` }}>
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: `${func.color}20` }}>
                          <Shield className="h-6 w-6" style={{ color: func.color }} />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold" style={{ color: func.color }}>
                            {func.code}: {func.name}
                          </h3>
                          <p className="text-muted-foreground text-sm mt-1">
                            {func.description}
                          </p>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <Accordion type="multiple" className="w-full">
                        {func.categories.map((category) => (
                          <AccordionItem key={category.id} value={category.id}>
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex items-center gap-3 text-left">
                                <Badge variant="outline">{category.code}</Badge>
                                <div>
                                  <div className="font-medium">{category.name}</div>
                                  <div className="text-sm text-muted-foreground mt-1">
                                    {category.subcategories.length} subcategories
                                  </div>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4">
                              <div className="space-y-4">
                                {category.subcategories.map((subcategory) => (
                                  <div key={subcategory.id} className="border rounded-lg p-4">
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex-1">
                                        <h5 className="font-semibold text-sm mb-1">
                                          {subcategory.code}: {subcategory.name}
                                        </h5>
                                        <p className="text-muted-foreground text-sm">
                                          {subcategory.description}
                                        </p>
                                      </div>
                                    </div>
                                    
                                    {/* AISVS Mappings */}
                                    <div className="mt-3 pt-3 border-t">
                                      <div className="flex items-center gap-2 mb-2">
                                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">Maps to AISVS:</span>
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        {subcategory.aisvsMapping.length > 0 ? (
                                          subcategory.aisvsMapping.map((aisvsCode) => {
                                            const aisvsCategory = getAISVSCategory(aisvsCode);
                                            return aisvsCategory ? (
                                              <Link key={aisvsCode} to="/aisvs">
                                                <Badge 
                                                  variant="default" 
                                                  className="text-xs hover:opacity-80 transition-opacity cursor-pointer"
                                                  style={{ backgroundColor: aisvsCategory.color }}
                                                >
                                                  {aisvsCode}: {aisvsCategory.name.split(' &')[0]}
                                                </Badge>
                                              </Link>
                                            ) : (
                                              <Badge key={aisvsCode} variant="outline" className="text-xs">
                                                {aisvsCode}
                                              </Badge>
                                            );
                                          })
                                        ) : (
                                          <Badge variant="secondary" className="text-xs">
                                            No direct AISVS mapping identified
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Compliance Matrix Tab */}
            <TabsContent value="matrix" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="h-5 w-5" />
                    Framework Compliance Matrix
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="border p-2 text-left font-medium">NIST AI RMF</th>
                          {aisvsCategories.slice(0, 10).map((cat) => (
                            <th key={cat.id} className="border p-2 text-center text-xs font-medium min-w-16">
                              <div className="transform -rotate-45 origin-center">
                                {cat.code}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {nistAIRMF.map((func) => (
                          func.categories.map((category) => (
                            category.subcategories.map((subcategory) => (
                              <tr key={subcategory.id}>
                                <td className="border p-2 text-sm">
                                  <div className="font-medium">{subcategory.code}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {subcategory.name}
                                  </div>
                                </td>
                                {aisvsCategories.slice(0, 10).map((cat) => (
                                  <td key={cat.id} className="border p-2 text-center">
                                    {subcategory.aisvsMapping.includes(cat.code) ? (
                                      <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                                    ) : (
                                      <div className="w-4 h-4 mx-auto"></div>
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))
                          ))
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-semibold mb-2">Matrix Legend</h4>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Direct mapping exists</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border border-muted-foreground/20 rounded"></div>
                        <span>No direct mapping</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Interactive Graph Tab */}
            <TabsContent value="graph" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="h-5 w-5" />
                    Interactive D3.js Mapping Graph
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Advanced D3.js visualization with expandable nodes. Click NIST function nodes to expand and explore hierarchical mappings. Drag nodes to rearrange the layout.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full h-[800px] border rounded-lg bg-gradient-to-br from-background to-muted/20 overflow-hidden">
                    <svg 
                      ref={svgRef}
                      width="100%" 
                      height="100%" 
                      className="absolute inset-0"
                    />
                    
                    {/* Interactive Controls */}
                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setExpandedNodes(new Set());
                          setSelectedNode(null);
                          setSelectedNodeData(null);
                          setFocusMode(false);
                        }}
                        className="bg-white/90 hover:bg-white text-xs"
                      >
                        Reset Graph
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          const newExpanded = new Set<string>();
                          nistAIRMF.forEach(func => {
                            newExpanded.add(func.id);
                            func.categories.forEach(cat => {
                              newExpanded.add(`${func.id}-${cat.id}`);
                            });
                          });
                          setExpandedNodes(newExpanded);
                        }}
                        className="bg-white/90 hover:bg-white text-xs"
                      >
                        Expand All
                      </Button>
                      <Button
                        variant={focusMode ? "default" : "secondary"}
                        size="sm"
                        onClick={() => {
                          setFocusMode(!focusMode);
                          if (!focusMode && !selectedNode) {
                            // If enabling focus mode but no node selected, show message
                            return;
                          }
                        }}
                        className={`text-xs ${focusMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-white/90 hover:bg-white'}`}
                        disabled={!selectedNode}
                      >
                        {focusMode ? "Exit Focus" : "Focus Mode"}
                      </Button>
                      <div className="bg-white/90 rounded p-2 text-xs">
                        <div className="font-medium mb-1">Status:</div>
                        {focusMode && (
                          <div className="text-blue-600 font-medium mb-1">
                            🎯 Focus Mode Active
                          </div>
                        )}
                        <div className="text-muted-foreground">
                          {expandedNodes.size} nodes expanded
                        </div>
                        <div className="text-muted-foreground">
                          {graphData.nodes.filter(n => n.visible).length} nodes visible
                        </div>
                        <div className="text-muted-foreground">
                          {graphData.links.filter(l => l.visible).length} connections
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Selected Node Information Panel */}
                  {selectedNodeData && (
                    <div className="mt-4">
                      {focusMode && (
                        <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                            <Target className="h-4 w-4" />
                            <span className="font-medium text-sm">Focus Mode Active</span>
                          </div>
                          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                            Showing only "{selectedNodeData.label}" and its direct connections. 
                            Click the same node again or use "Exit Focus" to return to full view.
                          </p>
                        </div>
                      )}
                      <Card className="border-2" style={{ borderColor: selectedNodeData.color }}>
                        <CardHeader className="pb-3" style={{ backgroundColor: `${selectedNodeData.color}15` }}>
                          <CardTitle className="flex items-center gap-3">
                            <div 
                              className="p-2 rounded-lg flex items-center justify-center text-white font-bold"
                              style={{ backgroundColor: selectedNodeData.color }}
                            >
                              {selectedNodeData.type === 'nist-function' && <Shield className="h-5 w-5" />}
                              {selectedNodeData.type === 'nist-category' && <Target className="h-4 w-4" />}
                              {selectedNodeData.type === 'nist-subcategory' && <CheckCircle className="h-4 w-4" />}
                              {selectedNodeData.type === 'aisvs-category' && <Network className="h-4 w-4" />}
                            </div>
                            <div>
                              <h3 className="text-lg font-bold" style={{ color: selectedNodeData.color }}>
                                {selectedNodeData.label}: {selectedNodeData.description}
                              </h3>
                              <Badge variant="outline" className="mt-1">
                                {selectedNodeData.type === 'nist-function' && 'NIST AI RMF Function'}
                                {selectedNodeData.type === 'nist-category' && 'NIST AI RMF Category'}
                                {selectedNodeData.type === 'nist-subcategory' && 'NIST AI RMF Subcategory'}
                                {selectedNodeData.type === 'aisvs-category' && 'OWASP AISVS Category'}
                              </Badge>
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Column - Description and Details */}
                            <div>
                              <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <BookOpen className="h-4 w-4" />
                                Description & Purpose
                              </h4>
                              
                                                             {selectedNodeData.type === 'nist-function' && (
                                 <div className="space-y-4">
                                   <p className="text-sm text-muted-foreground leading-relaxed">
                                     {selectedNodeData.data.description}
                                   </p>
                                   
                                   <div className="p-4 bg-muted/50 rounded-lg">
                                     <h5 className="font-medium text-sm mb-3">Key Responsibilities & Activities:</h5>
                                     <ul className="text-xs text-muted-foreground space-y-2">
                                       {selectedNodeData.id === 'govern' && (
                                         <>
                                           <li className="flex items-start gap-2">
                                             <span className="text-blue-500 font-bold">•</span>
                                             <span><strong>Governance Structure:</strong> Establish AI governance boards, define roles and responsibilities, and create accountability frameworks</span>
                                           </li>
                                           <li className="flex items-start gap-2">
                                             <span className="text-blue-500 font-bold">•</span>
                                             <span><strong>Policy Development:</strong> Create comprehensive AI policies covering ethics, risk management, and compliance requirements</span>
                                           </li>
                                           <li className="flex items-start gap-2">
                                             <span className="text-blue-500 font-bold">•</span>
                                             <span><strong>Human-AI Alignment:</strong> Design meaningful human oversight mechanisms and decision-making processes</span>
                                           </li>
                                           <li className="flex items-start gap-2">
                                             <span className="text-blue-500 font-bold">•</span>
                                             <span><strong>Risk Appetite:</strong> Define organizational tolerance for AI risks and establish clear boundaries</span>
                                           </li>
                                         </>
                                       )}
                                       {selectedNodeData.id === 'map' && (
                                         <>
                                           <li className="flex items-start gap-2">
                                             <span className="text-green-500 font-bold">•</span>
                                             <span><strong>Context Analysis:</strong> Document AI system purpose, use cases, and operational environment thoroughly</span>
                                           </li>
                                           <li className="flex items-start gap-2">
                                             <span className="text-green-500 font-bold">•</span>
                                             <span><strong>Risk Categorization:</strong> Classify AI systems by impact level (high, moderate, low) and risk profile</span>
                                           </li>
                                           <li className="flex items-start gap-2">
                                             <span className="text-green-500 font-bold">•</span>
                                             <span><strong>Stakeholder Mapping:</strong> Identify all affected parties and document their concerns and requirements</span>
                                           </li>
                                           <li className="flex items-start gap-2">
                                             <span className="text-green-500 font-bold">•</span>
                                             <span><strong>Threat Modeling:</strong> Systematically identify AI-specific threats, attack vectors, and vulnerability sources</span>
                                           </li>
                                         </>
                                       )}
                                       {selectedNodeData.id === 'measure' && (
                                         <>
                                           <li className="flex items-start gap-2">
                                             <span className="text-orange-500 font-bold">•</span>
                                             <span><strong>Performance Metrics:</strong> Define and implement comprehensive KPIs for AI system performance and reliability</span>
                                           </li>
                                           <li className="flex items-start gap-2">
                                             <span className="text-orange-500 font-bold">•</span>
                                             <span><strong>Bias Testing:</strong> Conduct systematic fairness assessments across different demographic groups and use cases</span>
                                           </li>
                                           <li className="flex items-start gap-2">
                                             <span className="text-orange-500 font-bold">•</span>
                                             <span><strong>Security Assessment:</strong> Perform penetration testing, vulnerability scans, and adversarial attack simulations</span>
                                           </li>
                                           <li className="flex items-start gap-2">
                                             <span className="text-orange-500 font-bold">•</span>
                                             <span><strong>Risk Quantification:</strong> Use statistical methods to measure and prioritize identified AI risks</span>
                                           </li>
                                         </>
                                       )}
                                       {selectedNodeData.id === 'manage' && (
                                         <>
                                           <li className="flex items-start gap-2">
                                             <span className="text-red-500 font-bold">•</span>
                                             <span><strong>Risk Treatment:</strong> Implement mitigation strategies including avoidance, reduction, transfer, and acceptance</span>
                                           </li>
                                           <li className="flex items-start gap-2">
                                             <span className="text-red-500 font-bold">•</span>
                                             <span><strong>Control Implementation:</strong> Deploy technical, administrative, and physical safeguards for AI systems</span>
                                           </li>
                                           <li className="flex items-start gap-2">
                                             <span className="text-red-500 font-bold">•</span>
                                             <span><strong>Incident Response:</strong> Establish 24/7 monitoring, detection, and response capabilities for AI incidents</span>
                                           </li>
                                           <li className="flex items-start gap-2">
                                             <span className="text-red-500 font-bold">•</span>
                                             <span><strong>Third-Party Management:</strong> Assess and monitor AI vendors, suppliers, and service providers</span>
                                           </li>
                                         </>
                                       )}
                                     </ul>
                                   </div>
                                   
                                   <div className="grid grid-cols-2 gap-3">
                                     <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                                       <h6 className="font-medium text-xs mb-2 text-blue-800 dark:text-blue-200">Implementation Timeline</h6>
                                       <p className="text-xs text-blue-700 dark:text-blue-300">
                                         {selectedNodeData.id === 'govern' && 'Foundational phase (0-6 months)'}
                                         {selectedNodeData.id === 'map' && 'Discovery phase (1-3 months)'}
                                         {selectedNodeData.id === 'measure' && 'Assessment phase (2-6 months)'}
                                         {selectedNodeData.id === 'manage' && 'Ongoing operations (continuous)'}
                                       </p>
                                     </div>
                                     <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                                       <h6 className="font-medium text-xs mb-2 text-green-800 dark:text-green-200">Key Stakeholders</h6>
                                       <p className="text-xs text-green-700 dark:text-green-300">
                                         {selectedNodeData.id === 'govern' && 'C-Suite, Legal, Compliance'}
                                         {selectedNodeData.id === 'map' && 'Risk, Security, Product Teams'}
                                         {selectedNodeData.id === 'measure' && 'QA, Security, Data Science'}
                                         {selectedNodeData.id === 'manage' && 'Operations, Security, IT'}
                                       </p>
                                     </div>
                                   </div>
                                   
                                   <div className="flex items-center gap-2 text-sm">
                                     <span className="font-medium">Contains:</span>
                                     <Badge variant="secondary">{selectedNodeData.data.categories.length} categories</Badge>
                                     <Badge variant="secondary">
                                       {selectedNodeData.data.categories.reduce((total: number, cat: any) => total + cat.subcategories.length, 0)} subcategories
                                     </Badge>
                                   </div>
                                 </div>
                               )}
                              
                              {selectedNodeData.type === 'nist-category' && (
                                <div className="space-y-4">
                                  <p className="text-sm text-muted-foreground leading-relaxed">
                                    {selectedNodeData.data.description}
                                  </p>
                                  
                                  <div className="p-4 bg-muted/50 rounded-lg">
                                    <h5 className="font-medium text-sm mb-3">Implementation Guidance:</h5>
                                    <div className="text-xs text-muted-foreground space-y-2">
                                      <div className="flex items-start gap-2">
                                        <span className="text-indigo-500 font-bold">•</span>
                                        <span><strong>Strategic Importance:</strong> This category is fundamental to the {selectedNodeData.parentId?.toUpperCase()} function and establishes critical foundations for AI governance</span>
                                      </div>
                                      <div className="flex items-start gap-2">
                                        <span className="text-indigo-500 font-bold">•</span>
                                        <span><strong>Implementation Priority:</strong> Should be addressed in coordination with other {selectedNodeData.parentId?.toUpperCase()} categories for maximum effectiveness</span>
                                      </div>
                                      <div className="flex items-start gap-2">
                                        <span className="text-indigo-500 font-bold">•</span>
                                        <span><strong>Cross-Function Impact:</strong> Influences and is influenced by activities in other NIST AI RMF functions (GOVERN, MAP, MEASURE, MANAGE)</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg">
                                      <h6 className="font-medium text-xs mb-2 text-indigo-800 dark:text-indigo-200">Function Context</h6>
                                      <p className="text-xs text-indigo-700 dark:text-indigo-300">
                                        Part of {selectedNodeData.parentId?.toUpperCase()} function
                                      </p>
                                    </div>
                                    <div className="p-3 bg-teal-50 dark:bg-teal-950/20 rounded-lg">
                                      <h6 className="font-medium text-xs mb-2 text-teal-800 dark:text-teal-200">Maturity Level</h6>
                                      <p className="text-xs text-teal-700 dark:text-teal-300">
                                        {selectedNodeData.data.subcategories.length > 6 ? 'Advanced' : 
                                         selectedNodeData.data.subcategories.length > 3 ? 'Intermediate' : 'Foundational'}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="font-medium">Contains:</span>
                                    <Badge variant="secondary">{selectedNodeData.data.subcategories.length} subcategories</Badge>
                                    <Badge variant="outline">Click to expand</Badge>
                                  </div>
                                </div>
                              )}
                              
                              {selectedNodeData.type === 'nist-subcategory' && (
                                <div className="space-y-4">
                                  <p className="text-sm text-muted-foreground leading-relaxed">
                                    {selectedNodeData.data.description}
                                  </p>
                                  
                                  <div className="p-4 bg-muted/50 rounded-lg">
                                    <h5 className="font-medium text-sm mb-3">Implementation Details:</h5>
                                    <div className="text-xs text-muted-foreground space-y-2">
                                      <div className="flex items-start gap-2">
                                        <span className="text-cyan-500 font-bold">•</span>
                                        <span><strong>Operational Focus:</strong> This subcategory defines specific, actionable requirements that organizations must implement to achieve AI risk management objectives</span>
                                      </div>
                                      <div className="flex items-start gap-2">
                                        <span className="text-cyan-500 font-bold">•</span>
                                        <span><strong>Implementation Approach:</strong> Should be addressed through documented policies, technical controls, training programs, and regular assessments</span>
                                      </div>
                                      <div className="flex items-start gap-2">
                                        <span className="text-cyan-500 font-bold">•</span>
                                        <span><strong>Success Metrics:</strong> Progress can be measured through compliance audits, risk assessments, and security testing aligned with mapped AISVS controls</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <h5 className="font-medium text-sm mb-3 text-blue-800 dark:text-blue-200">🔗 AISVS Security Mappings</h5>
                                    {selectedNodeData.data.aisvsMapping.length > 0 ? (
                                      <div className="space-y-2">
                                        <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                                          This NIST subcategory directly supports the following AISVS security controls:
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                          {selectedNodeData.data.aisvsMapping.map((aisvsCode: string) => {
                                            const aisvsCategory = getAISVSCategory(aisvsCode);
                                            return aisvsCategory ? (
                                              <Link key={aisvsCode} to="/aisvs" className="no-underline">
                                                <Badge 
                                                  variant="default" 
                                                  className="text-xs hover:opacity-80 transition-all duration-200 cursor-pointer transform hover:scale-105"
                                                  style={{ backgroundColor: aisvsCategory.color }}
                                                >
                                                  {aisvsCode}: {aisvsCategory.name.split(' &')[0]}
                                                </Badge>
                                              </Link>
                                            ) : (
                                              <Badge key={aisvsCode} variant="outline" className="text-xs">
                                                {aisvsCode}
                                              </Badge>
                                            );
                                          })}
                                        </div>
                                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 italic">
                                          💡 Click on any AISVS badge above to explore detailed security requirements and testing procedures.
                                        </p>
                                      </div>
                                    ) : (
                                      <div className="text-center py-4">
                                        <Badge variant="secondary" className="text-xs mb-2">
                                          No direct AISVS mapping identified
                                        </Badge>
                                        <p className="text-xs text-muted-foreground">
                                          This subcategory may require custom security controls or alignment with general security practices.
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-slate-50 dark:bg-slate-950/20 rounded-lg">
                                      <h6 className="font-medium text-xs mb-2 text-slate-800 dark:text-slate-200">Implementation Complexity</h6>
                                      <p className="text-xs text-slate-700 dark:text-slate-300">
                                        {selectedNodeData.data.aisvsMapping.length > 3 ? 'High - Multi-domain' : 
                                         selectedNodeData.data.aisvsMapping.length > 1 ? 'Medium - Cross-functional' : 
                                         selectedNodeData.data.aisvsMapping.length === 1 ? 'Medium - Focused' : 'Low - Policy-based'}
                                      </p>
                                    </div>
                                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                                      <h6 className="font-medium text-xs mb-2 text-emerald-800 dark:text-emerald-200">Security Impact</h6>
                                      <p className="text-xs text-emerald-700 dark:text-emerald-300">
                                        {selectedNodeData.data.aisvsMapping.length > 0 ? 'Direct security control alignment' : 'Governance and process focused'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                                                             {selectedNodeData.type === 'aisvs-category' && (
                                 <div className="space-y-4">
                                   <p className="text-sm text-muted-foreground leading-relaxed">
                                     {selectedNodeData.data.description}
                                   </p>
                                   
                                   <div className="p-4 bg-muted/50 rounded-lg">
                                     <h5 className="font-medium text-sm mb-3">Security Domain & Requirements:</h5>
                                     <div className="text-xs text-muted-foreground space-y-2">
                                       {selectedNodeData.label === 'C1' && (
                                         <>
                                           <div className="flex items-start gap-2">
                                             <span className="text-purple-500 font-bold">•</span>
                                             <span><strong>Memory Safety:</strong> Protect against buffer overflows, memory corruption, and unsafe memory operations in AI systems</span>
                                           </div>
                                           <div className="flex items-start gap-2">
                                             <span className="text-purple-500 font-bold">•</span>
                                             <span><strong>Input Validation:</strong> Ensure robust validation of all inputs to prevent injection attacks and malformed data processing</span>
                                           </div>
                                           <div className="flex items-start gap-2">
                                             <span className="text-purple-500 font-bold">•</span>
                                             <span><strong>Architecture Security:</strong> Implement secure coding practices and architectural patterns for AI applications</span>
                                           </div>
                                         </>
                                       )}
                                       {selectedNodeData.label === 'C2' && (
                                         <>
                                           <div className="flex items-start gap-2">
                                             <span className="text-blue-500 font-bold">•</span>
                                             <span><strong>Authentication Controls:</strong> Implement strong user authentication and identity verification mechanisms</span>
                                           </div>
                                           <div className="flex items-start gap-2">
                                             <span className="text-blue-500 font-bold">•</span>
                                             <span><strong>Session Management:</strong> Secure session handling, timeout controls, and session invalidation</span>
                                           </div>
                                           <div className="flex items-start gap-2">
                                             <span className="text-blue-500 font-bold">•</span>
                                             <span><strong>Multi-Factor Authentication:</strong> Deploy MFA for privileged access to AI systems and data</span>
                                           </div>
                                         </>
                                       )}
                                       {selectedNodeData.label === 'C3' && (
                                         <>
                                           <div className="flex items-start gap-2">
                                             <span className="text-green-500 font-bold">•</span>
                                             <span><strong>Access Control Policies:</strong> Define and enforce granular access controls for AI resources and capabilities</span>
                                           </div>
                                           <div className="flex items-start gap-2">
                                             <span className="text-green-500 font-bold">•</span>
                                             <span><strong>Role-Based Access:</strong> Implement RBAC/ABAC models appropriate for AI system operations</span>
                                           </div>
                                           <div className="flex items-start gap-2">
                                             <span className="text-green-500 font-bold">•</span>
                                             <span><strong>Privilege Management:</strong> Apply least privilege principles and regular access reviews</span>
                                           </div>
                                         </>
                                       )}
                                       {['C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10', 'C11', 'C12', 'C13'].includes(selectedNodeData.label) && (
                                         <>
                                           <div className="flex items-start gap-2">
                                             <span className="text-orange-500 font-bold">•</span>
                                             <span><strong>Core Security Requirements:</strong> Essential security controls and verification procedures for AI systems</span>
                                           </div>
                                           <div className="flex items-start gap-2">
                                             <span className="text-orange-500 font-bold">•</span>
                                             <span><strong>Implementation Guidelines:</strong> Specific technical requirements and testing methodologies</span>
                                           </div>
                                           <div className="flex items-start gap-2">
                                             <span className="text-orange-500 font-bold">•</span>
                                             <span><strong>Verification Criteria:</strong> Measurable security objectives and compliance checkpoints</span>
                                           </div>
                                         </>
                                       )}
                                     </div>
                                   </div>
                                   
                                   <div className="grid grid-cols-2 gap-3">
                                     <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                                       <h6 className="font-medium text-xs mb-2 text-purple-800 dark:text-purple-200">Security Level</h6>
                                       <p className="text-xs text-purple-700 dark:text-purple-300">
                                         {['C1', 'C2', 'C3'].includes(selectedNodeData.label) && 'Foundational (Level 1)'}
                                         {['C4', 'C5', 'C6', 'C7'].includes(selectedNodeData.label) && 'Standard (Level 2)'}
                                         {['C8', 'C9', 'C10'].includes(selectedNodeData.label) && 'Advanced (Level 3)'}
                                         {['C11', 'C12', 'C13'].includes(selectedNodeData.label) && 'Expert (Level 4)'}
                                       </p>
                                     </div>
                                     <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                                       <h6 className="font-medium text-xs mb-2 text-red-800 dark:text-red-200">Testing Focus</h6>
                                       <p className="text-xs text-red-700 dark:text-red-300">
                                         {['C1', 'C4', 'C8'].includes(selectedNodeData.label) && 'Penetration Testing'}
                                         {['C2', 'C5', 'C9'].includes(selectedNodeData.label) && 'Authentication Testing'}
                                         {['C3', 'C6', 'C10'].includes(selectedNodeData.label) && 'Access Control Testing'}
                                         {['C7', 'C11', 'C12', 'C13'].includes(selectedNodeData.label) && 'Specialized Testing'}
                                       </p>
                                     </div>
                                   </div>
                                   
                                   <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                     <h6 className="font-medium text-xs mb-2 text-amber-800 dark:text-amber-200">💡 Reverse Mapping Tip</h6>
                                     <p className="text-xs text-amber-700 dark:text-amber-300">
                                       Click this AISVS category to automatically expand all related NIST AI RMF subcategories in the graph above. This shows you which governance, mapping, measurement, and management activities support this security control.
                                     </p>
                                   </div>
                                   
                                   {selectedNodeData.data.subCategories && (
                                     <div className="flex items-center gap-2 text-sm">
                                       <span className="font-medium">Contains:</span>
                                       <Badge variant="secondary">{selectedNodeData.data.subCategories.length} subcategories</Badge>
                                       <Badge variant="outline">
                                         {selectedNodeData.data.subCategories.length > 5 ? 'Comprehensive' : 
                                          selectedNodeData.data.subCategories.length > 3 ? 'Moderate' : 'Focused'} scope
                                       </Badge>
                                     </div>
                                   )}
                                 </div>
                               )}
                            </div>
                            
                            {/* Right Column - Relationships and Mappings */}
                            <div>
                              <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <ArrowRight className="h-4 w-4" />
                                Relationships & Mappings
                              </h4>
                              
                              {selectedNodeData.type === 'nist-subcategory' && selectedNodeData.data.aisvsMapping.length > 0 && (
                                <div className="space-y-3">
                                  <div>
                                    <h5 className="font-medium text-sm mb-2">Maps to AISVS Categories:</h5>
                                    <div className="space-y-2">
                                      {selectedNodeData.data.aisvsMapping.map((aisvsCode: string) => {
                                        const aisvsCategory = getAISVSCategory(aisvsCode);
                                        return aisvsCategory ? (
                                          <div key={aisvsCode} className="flex items-center gap-2 p-2 border rounded">
                                            <div 
                                              className="w-3 h-3 rounded-full"
                                              style={{ backgroundColor: aisvsCategory.color }}
                                            ></div>
                                            <div className="flex-1">
                                              <div className="font-medium text-sm">{aisvsCategory.code}</div>
                                              <div className="text-xs text-muted-foreground">{aisvsCategory.name.split(' &')[0]}</div>
                                            </div>
                                            <Link to="/aisvs">
                                              <Badge variant="outline" className="text-xs cursor-pointer hover:bg-accent">
                                                View Details
                                              </Badge>
                                            </Link>
                                          </div>
                                        ) : null;
                                      })}
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {selectedNodeData.type === 'aisvs-category' && (
                                <div className="space-y-4">
                                  <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                                    <h5 className="font-medium text-sm mb-3 text-green-800 dark:text-green-200">
                                      🎯 NIST AI RMF Governance Support
                                    </h5>
                                    <p className="text-xs text-green-700 dark:text-green-300 mb-3">
                                      This AISVS security control is supported by the following NIST AI RMF subcategories. 
                                      Understanding these connections helps you implement comprehensive AI governance.
                                    </p>
                                    
                                    <div className="space-y-3">
                                      {['govern', 'map', 'measure', 'manage'].map(funcId => {
                                        const func = nistAIRMF.find(f => f.id === funcId);
                                        const mappedSubcategories = func ? func.categories.flatMap(cat =>
                                          cat.subcategories.filter(sub => sub.aisvsMapping.includes(selectedNodeData.label))
                                        ) : [];
                                        
                                        if (mappedSubcategories.length === 0) return null;
                                        
                                        return (
                                          <div key={funcId} className="space-y-2">
                                            <div className="flex items-center gap-2 mb-2">
                                              <div 
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: func?.color }}
                                              ></div>
                                              <span className="font-medium text-xs" style={{ color: func?.color }}>
                                                {func?.code} - {func?.name} ({mappedSubcategories.length})
                                              </span>
                                            </div>
                                            <div className="ml-5 space-y-1">
                                              {mappedSubcategories.map(sub => (
                                                <div key={sub.id} className="flex items-start gap-2 p-2 bg-white dark:bg-gray-800 border rounded text-xs">
                                                  <div className="flex-1">
                                                    <div className="font-medium">{sub.code}</div>
                                                    <div className="text-muted-foreground">{sub.name}</div>
                                                    <div className="text-muted-foreground mt-1 text-xs italic">
                                                      "{sub.description.substring(0, 80)}..."
                                                    </div>
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                  
                                  <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                    <h5 className="font-medium text-sm mb-2 text-purple-800 dark:text-purple-200">
                                      📊 Implementation Statistics
                                    </h5>
                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                      {['govern', 'map', 'measure', 'manage'].map(funcId => {
                                        const func = nistAIRMF.find(f => f.id === funcId);
                                        const mappedCount = func ? func.categories.flatMap(cat =>
                                          cat.subcategories.filter(sub => sub.aisvsMapping.includes(selectedNodeData.label))
                                        ).length : 0;
                                        
                                        return (
                                          <div key={funcId} className="flex items-center gap-2">
                                            <div 
                                              className="w-2 h-2 rounded-full"
                                              style={{ backgroundColor: func?.color }}
                                            ></div>
                                            <span className="text-purple-700 dark:text-purple-300">
                                              {func?.code}: {mappedCount} controls
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                  
                                  <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                    <h5 className="font-medium text-sm mb-2 text-amber-800 dark:text-amber-200">
                                      🚀 Quick Action
                                    </h5>
                                    <p className="text-xs text-amber-700 dark:text-amber-300 mb-2">
                                      Want to see all these NIST subcategories in the graph above?
                                    </p>
                                    <p className="text-xs text-amber-600 dark:text-amber-400 italic">
                                      💡 Click this AISVS node again to auto-expand all related NIST elements and visualize the complete governance framework supporting this security control.
                                    </p>
                                  </div>
                                </div>
                              )}
                              
                              {(selectedNodeData.type === 'nist-function' || selectedNodeData.type === 'nist-category') && (
                                <div className="space-y-3">
                                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <h5 className="font-medium text-sm mb-2 text-blue-800 dark:text-blue-200">
                                      💡 Interaction Tip
                                    </h5>
                                    <p className="text-xs text-blue-700 dark:text-blue-300">
                                      Click this node to {expandedNodes.has(selectedNodeData.id) ? 'collapse' : 'expand'} and 
                                      {selectedNodeData.type === 'nist-function' ? ' view its categories and subcategories' : ' view its subcategories'}.
                                    </p>
                                  </div>
                                  
                                  {expandedNodes.has(selectedNodeData.id) && (
                                    <div>
                                      <h5 className="font-medium text-sm mb-2">Currently Expanded:</h5>
                                      <div className="text-xs text-muted-foreground">
                                        This node is currently expanded, showing its child elements in the graph above.
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* Usage Context */}
                              <div className="mt-4 p-3 bg-accent/50 rounded-lg">
                                <h5 className="font-medium text-sm mb-2">Usage Context:</h5>
                                <div className="text-xs text-muted-foreground space-y-1">
                                  {selectedNodeData.type === 'nist-function' && (
                                    <>
                                      <div>• Use for high-level AI governance planning</div>
                                      <div>• Essential for compliance frameworks</div>
                                      <div>• Foundation for risk management strategy</div>
                                    </>
                                  )}
                                  {selectedNodeData.type === 'nist-category' && (
                                    <>
                                      <div>• Implement through specific procedures</div>
                                      <div>• Map to organizational capabilities</div>
                                      <div>• Essential for targeted risk mitigation</div>
                                    </>
                                  )}
                                  {selectedNodeData.type === 'nist-subcategory' && (
                                    <>
                                      <div>• Implement through specific controls</div>
                                      <div>• Verify through AISVS requirements</div>
                                      <div>• Essential for detailed compliance</div>
                                    </>
                                  )}
                                  {selectedNodeData.type === 'aisvs-category' && (
                                    <>
                                      <div>• Use for security verification</div>
                                      <div>• Essential for penetration testing</div>
                                      <div>• Validate AI system security</div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                  
                  {/* Graph Controls and Info */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-2 text-sm">Graph Features</h4>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          <li>• Click nodes to expand/select</li>
                          <li>• Drag nodes to rearrange layout</li>
                          <li>• Zoom and pan for detailed view</li>
                          <li>• Hover for quick information</li>
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-2 text-sm">Mapping Insights</h4>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          <li>• GOVERN maps to foundational controls</li>
                          <li>• MAP focuses on risk identification</li>
                          <li>• MEASURE emphasizes testing & metrics</li>
                          <li>• MANAGE covers incident response</li>
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-2 text-sm">Usage Guide</h4>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          <li>• Click nodes for detailed information</li>
                          <li>• Use for compliance planning</li>
                          <li>• Identify coverage gaps</li>
                          <li>• Plan implementation priorities</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* References Section */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Framework References
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-3">NIST AI Risk Management Framework</h4>
                  <div className="space-y-2">
                    <a
                      href="https://www.nist.gov/itl/ai-risk-management-framework"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors text-sm"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>NIST AI RMF Official Documentation</span>
                    </a>
                    <a
                      href="https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors text-sm"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>NIST AI RMF 1.0 (PDF)</span>
                    </a>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">OWASP AISVS</h4>
                  <div className="space-y-2">
                    <Link
                      to="/aisvs"
                      className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors text-sm"
                    >
                      <ArrowRight className="h-4 w-4" />
                      <span>Interactive AISVS Tool</span>
                    </Link>
                    <a
                      href="https://github.com/OWASP/AISVS"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors text-sm"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>OWASP AISVS GitHub Repository</span>
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default NISTMapping; 
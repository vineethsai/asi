import { useState, forwardRef, useImperativeHandle } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronDown, ExternalLink, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";

type ComponentNode = {
  id: string;
  title: string;
  description?: string;
  threatCategories?: string[];
  controls?: string[];
  color: string;
  children?: ComponentNode[];
};

// Full component framework data
const frameworkData: ComponentNode[] = [
  {
    id: "kc1",
    title: "Language Models",
    description: "Foundation models and multimodal capabilities",
    threatCategories: ["Prompt Injection", "Training Data Poisoning"],
    color: "border-primary/30 bg-primary/5 hover:bg-primary/10",
    children: [
      {
        id: "kc1-1",
        title: "Foundation Models",
        description: "Large language models that serve as the base for agentic systems",
        threatCategories: ["Model Extraction", "Input Validation Bypass"],
        color: "border-primary/20 bg-primary/5 hover:bg-primary/10",
        children: [
          {
            id: "kc1-1-1",
            title: "Base Models",
            description: "Pre-trained models before fine-tuning",
            color: "border-primary/10 bg-transparent hover:bg-primary/5"
          },
          {
            id: "kc1-1-2",
            title: "Fine-tuned Models",
            description: "Models adapted for specific use cases or domains",
            color: "border-primary/10 bg-transparent hover:bg-primary/5"
          }
        ]
      },
      {
        id: "kc1-2",
        title: "Multimodal Capabilities",
        description: "Processing of multiple types of inputs (text, images, audio)",
        threatCategories: ["Cross-Modal Attacks", "Adversarial Examples"],
        color: "border-primary/20 bg-primary/5 hover:bg-primary/10"
      }
    ]
  },
  {
    id: "kc2",
    title: "Orchestration",
    description: "Workflows, planning, and multi-agent collaboration",
    threatCategories: ["Intent Breaking", "Communication Poisoning"],
    color: "border-architecture/30 bg-architecture/5 hover:bg-architecture/10",
    children: [
      {
        id: "kc2-1",
        title: "Task Planning",
        description: "Decomposition of complex tasks into subtasks",
        color: "border-architecture/20 bg-architecture/5 hover:bg-architecture/10"
      },
      {
        id: "kc2-2",
        title: "Agent Collaboration",
        description: "Communication and coordination between multiple agents",
        color: "border-architecture/20 bg-architecture/5 hover:bg-architecture/10",
        children: [
          {
            id: "kc2-2-1",
            title: "Message Passing",
            description: "Communication protocols between agents",
            color: "border-architecture/10 bg-transparent hover:bg-architecture/5"
          },
          {
            id: "kc2-2-2",
            title: "Role Assignment",
            description: "Dynamic allocation of responsibilities among agents",
            color: "border-architecture/10 bg-transparent hover:bg-architecture/5"
          }
        ]
      }
    ]
  },
  {
    id: "kc3",
    title: "Reasoning",
    description: "ReAct, Chain of Thought, planning paradigms",
    threatCategories: ["Reasoning Manipulation", "Goal Misalignment"],
    color: "border-control/30 bg-control/5 hover:bg-control/10",
    children: [
      {
        id: "kc3-1",
        title: "Chain of Thought",
        description: "Step-by-step reasoning to solve problems",
        color: "border-control/20 bg-control/5 hover:bg-control/10"
      },
      {
        id: "kc3-2",
        title: "ReAct Framework",
        description: "Reasoning and acting in an iterative process",
        color: "border-control/20 bg-control/5 hover:bg-control/10"
      }
    ]
  },
  {
    id: "kc4",
    title: "Memory",
    description: "Various memory types and security boundaries",
    threatCategories: ["Memory Poisoning", "Data Leakage"],
    color: "border-primary/30 bg-primary/5 hover:bg-primary/10",
    children: [
      {
        id: "kc4-1",
        title: "Short-term Memory",
        description: "Temporary storage for current task execution",
        color: "border-primary/20 bg-primary/5 hover:bg-primary/10"
      },
      {
        id: "kc4-2",
        title: "Long-term Memory",
        description: "Persistent storage across multiple interactions",
        color: "border-primary/20 bg-primary/5 hover:bg-primary/10",
        children: [
          {
            id: "kc4-2-1",
            title: "Vector Databases",
            description: "Storage and retrieval of embeddings",
            color: "border-primary/10 bg-transparent hover:bg-primary/5"
          },
          {
            id: "kc4-2-2",
            title: "Knowledge Graphs",
            description: "Structured representation of entities and relationships",
            color: "border-primary/10 bg-transparent hover:bg-primary/5"
          }
        ]
      }
    ]
  },
  {
    id: "kc5",
    title: "Tool Integration",
    description: "Frameworks for extending capabilities",
    threatCategories: ["Tool Misuse", "Privilege Compromise"],
    color: "border-threat/30 bg-threat/5 hover:bg-threat/10",
    children: [
      {
        id: "kc5-1",
        title: "API Connections",
        description: "Integration with external services via APIs",
        color: "border-threat/20 bg-threat/5 hover:bg-threat/10"
      },
      {
        id: "kc5-2",
        title: "Function Calling",
        description: "Execution of code or functions by the agent",
        color: "border-threat/20 bg-threat/5 hover:bg-threat/10"
      }
    ]
  },
  {
    id: "kc6",
    title: "Environment",
    description: "API access, code execution, database operations",
    threatCategories: ["Resource Exhaustion", "Container Escape"],
    color: "border-control/30 bg-control/5 hover:bg-control/10",
    children: [
      {
        id: "kc6-1",
        title: "Execution Environment",
        description: "Where code runs and computational resources",
        color: "border-control/20 bg-control/5 hover:bg-control/10"
      },
      {
        id: "kc6-2",
        title: "Data Access",
        description: "Interfaces to databases and storage systems",
        color: "border-control/20 bg-control/5 hover:bg-control/10",
        children: [
          {
            id: "kc6-2-1",
            title: "Read Operations",
            description: "Data retrieval mechanisms",
            color: "border-control/10 bg-transparent hover:bg-control/5"
          },
          {
            id: "kc6-2-2",
            title: "Write Operations",
            description: "Data modification mechanisms",
            color: "border-control/10 bg-transparent hover:bg-control/5"
          }
        ]
      }
    ]
  }
];

const ComponentNode = ({ 
  node, 
  depth = 0, 
  searchQuery = "",
  expandedNodes,
  toggleNode
}: { 
  node: ComponentNode; 
  depth?: number;
  searchQuery?: string;
  expandedNodes: Set<string>;
  toggleNode: (id: string) => void;
}) => {
  const isExpanded = expandedNodes.has(node.id);
  const hasChildren = node.children && node.children.length > 0;
  
  // Check if this node or any children match the search query
  const matchesSearch = searchQuery === "" || 
    node.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (node.description && node.description.toLowerCase().includes(searchQuery.toLowerCase()));
  
  const childrenMatchSearch = node.children?.some(child => 
    child.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (child.description && child.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  if (searchQuery && !matchesSearch && !childrenMatchSearch) {
    return null;
  }
  
  return (
    <div className="mb-1">
      <div 
        className={cn(
          "border rounded-md p-3 transition-colors", 
          node.color,
          depth > 0 ? "ml-6" : ""
        )}
      >
        <div className="flex items-start">
          {hasChildren && (
            <button 
              onClick={() => toggleNode(node.id)} 
              className="mr-2 mt-1"
            >
              {isExpanded ? 
                <ChevronDown className="h-4 w-4" /> : 
                <ChevronRight className="h-4 w-4" />
              }
            </button>
          )}
          <div className="flex-1">
            <div className="flex justify-between">
              <h3 className="font-medium">{node.title}</h3>
              <Link to={`/components/${node.id}`} className="text-muted-foreground hover:text-foreground">
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
            {node.description && (
              <p className="text-sm text-muted-foreground mt-1">{node.description}</p>
            )}
            {node.threatCategories && node.threatCategories.length > 0 && (
              <div className="mt-2">
                <span className="text-xs text-muted-foreground">Threats: </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {node.threatCategories.map((threat, i) => (
                    <span key={i} className="text-xs bg-threat/10 text-threat px-2 py-0.5 rounded-full">
                      {threat}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {hasChildren && isExpanded && (
        <div className="mt-1 border-l-2 border-muted pl-2">
          {node.children?.map(child => (
            <ComponentNode 
              key={child.id} 
              node={child} 
              depth={depth + 1}
              searchQuery={searchQuery}
              expandedNodes={expandedNodes}
              toggleNode={toggleNode}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Export type for ref
export type ComponentFrameworkHandle = {
  expandAll: () => void;
  collapseAll: () => void;
};

const ComponentFramework = forwardRef<ComponentFrameworkHandle, { searchQuery?: string }>(
  ({ searchQuery = "" }, ref) => {
    // Track expanded nodes
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(["kc1", "kc2", "kc3", "kc4", "kc5", "kc6"]));
    
    const toggleNode = (id: string) => {
      const newExpanded = new Set(expandedNodes);
      if (newExpanded.has(id)) {
        newExpanded.delete(id);
      } else {
        newExpanded.add(id);
      }
      setExpandedNodes(newExpanded);
    };
    
    const expandAll = () => {
      const allNodes = new Set<string>();
      
      const collectNodeIds = (nodes: ComponentNode[]) => {
        nodes.forEach(node => {
          allNodes.add(node.id);
          if (node.children) {
            collectNodeIds(node.children);
          }
        });
      };
      
      collectNodeIds(frameworkData);
      setExpandedNodes(allNodes);
    };
    
    const collapseAll = () => {
      // Keep only the top-level nodes expanded
      setExpandedNodes(new Set(["kc1", "kc2", "kc3", "kc4", "kc5", "kc6"]));
    };
    
    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      expandAll,
      collapseAll
    }));
    
    return (
      <div>
        <div className="space-y-4">
          {frameworkData.map(node => (
            <ComponentNode 
              key={node.id} 
              node={node}
              searchQuery={searchQuery}
              expandedNodes={expandedNodes}
              toggleNode={toggleNode}
            />
          ))}
        </div>
      </div>
    );
  }
);

ComponentFramework.displayName = "ComponentFramework";

export default ComponentFramework;

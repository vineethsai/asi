
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { ComponentNode as ComponentNodeType } from "./frameworkData";

interface ComponentNodeProps {
  node: ComponentNodeType;
  depth?: number;
  searchQuery?: string;
  expandedNodes: Set<string>;
  toggleNode: (id: string) => void;
}

const ComponentNode = ({
  node,
  depth = 0,
  searchQuery = "",
  expandedNodes,
  toggleNode
}: ComponentNodeProps) => {
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
    <div className="mb-3">
      <div 
        className={cn(
          "border rounded-md p-4 transition-colors shadow-sm hover:shadow-md", 
          node.color,
          depth > 0 ? "ml-8" : ""
        )}
      >
        <div className="flex items-start">
          {hasChildren && (
            <button 
              onClick={() => toggleNode(node.id)} 
              className="mr-3 mt-1 p-1 hover:bg-background/80 rounded-md"
            >
              {isExpanded ? 
                <ChevronDown className="h-5 w-5" /> : 
                <ChevronRight className="h-5 w-5" />
              }
            </button>
          )}
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-lg">{node.title}</h3>
              <Link to={`/components/${node.id}`} className="text-muted-foreground hover:text-foreground p-1 hover:bg-background/80 rounded-md">
                <ExternalLink className="h-5 w-5" />
              </Link>
            </div>
            {node.description && (
              <p className="text-muted-foreground mt-2">{node.description}</p>
            )}
            {node.threatCategories && node.threatCategories.length > 0 && (
              <div className="mt-3">
                <span className="text-sm text-muted-foreground font-medium">Threats: </span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {node.threatCategories.map((threat, i) => (
                    <span key={i} className="text-xs bg-threat/10 text-threat px-3 py-1 rounded-full font-medium">
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
        <div className="mt-3 border-l-2 border-muted pl-3">
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

export default ComponentNode;

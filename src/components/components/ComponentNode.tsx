
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
    <div className="mb-4">
      <div 
        className={cn(
          "border rounded-lg p-5 transition-colors shadow-sm hover:shadow-md", 
          node.color,
          depth > 0 ? "ml-10" : ""
        )}
      >
        <div className="flex items-start">
          {hasChildren && (
            <button 
              onClick={() => toggleNode(node.id)} 
              className="mr-4 mt-1 p-1.5 hover:bg-background/80 rounded-md"
            >
              {isExpanded ? 
                <ChevronDown className="h-6 w-6" /> : 
                <ChevronRight className="h-6 w-6" />
              }
            </button>
          )}
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-xl">{node.title}</h3>
              <Link to={`/components/${node.id}`} className="text-muted-foreground hover:text-foreground p-1.5 hover:bg-background/80 rounded-md">
                <ExternalLink className="h-5 w-5" />
              </Link>
            </div>
            {node.description && (
              <p className="text-muted-foreground mt-3 text-base">{node.description}</p>
            )}
            {node.threatCategories && node.threatCategories.length > 0 && (
              <div className="mt-4">
                <span className="text-sm font-medium">Threats: </span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {node.threatCategories.map((threat, i) => (
                    <span key={i} className="text-sm bg-threat/10 text-threat px-3 py-1 rounded-full font-medium">
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
        <div className="mt-4 border-l-2 border-muted pl-4">
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

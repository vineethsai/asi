import { useState, forwardRef, useImperativeHandle } from "react";
import { frameworkData } from "./frameworkData";
import ComponentNode from "./ComponentNode";

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
      
      const collectNodeIds = (nodes: typeof frameworkData) => {
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

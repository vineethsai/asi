import React, { useState, useCallback } from "react";
import { frameworkData } from "../components/frameworkData";
import { threatsData, mitigationsData, type Threat as SecurityThreat, type Mitigation as SecurityMitigation } from "../components/securityData";

// --- UI Component Stubs (for self-contained execution if needed) ---
const Button: React.FC<any> = ({ children, variant = "default", ...props }) => (
  <button 
    {...props} 
    className={`px-4 py-2 rounded-md font-medium transition-colors ${
      variant === "outline" 
        ? "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700" 
        : "bg-blue-600 hover:bg-blue-700 text-white"
    } ${props.className || ""}`}
  >
    {children}
  </button>
);

const Card: React.FC<any> = ({ children, ...props }) => (
  <div {...props} className={`border rounded-lg shadow-sm bg-white ${props.className || ""}`}>
    {children}
  </div>
);

const CardHeader: React.FC<any> = ({ children, ...props }) => (
  <div {...props} className={`p-6 border-b ${props.className || ""}`}>
    {children}
  </div>
);

const CardTitle: React.FC<any> = ({ children, ...props }) => (
  <h3 {...props} className={`text-xl font-semibold leading-none tracking-tight ${props.className || ""}`}>
    {children}
  </h3>
);

const CardDescription: React.FC<any> = ({ children, ...props }) => (
  <p {...props} className={`text-sm text-gray-600 mt-2 ${props.className || ""}`}>
    {children}
  </p>
);

const CardContent: React.FC<any> = ({ children, ...props }) => (
  <div {...props} className={`p-6 pt-0 ${props.className || ""}`}>
    {children}
  </div>
);

const CardFooter: React.FC<any> = ({ children, ...props }) => (
  <div {...props} className={`flex items-center p-6 pt-0 ${props.className || ""}`}>
    {children}
  </div>
);

const Accordion: React.FC<any> = ({ children, ...props }) => (
  <div {...props} className="space-y-2">
    {children}
  </div>
);

const AccordionItem: React.FC<any> = ({ children, value, ...props }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div {...props} className="border rounded-lg overflow-hidden">
      {React.Children.map(children, child => 
        React.isValidElement(child) 
          ? React.cloneElement(child as React.ReactElement, { 
              isOpen, 
              onToggle: () => setIsOpen(!isOpen),
              value 
            })
          : child
      )}
    </div>
  );
};

const AccordionTrigger: React.FC<any> = ({ children, isOpen, onToggle, ...props }) => (
  <button 
    {...props} 
    onClick={onToggle}
    className={`w-full text-left py-4 px-6 font-medium hover:bg-gray-50 focus:outline-none focus:bg-gray-50 flex justify-between items-center transition-colors ${props.className || ""}`}
  >
    <div className="flex-1">{children}</div>
    <span className={`transform transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>
      →
    </span>
  </button>
);

const AccordionContent: React.FC<any> = ({ children, isOpen, ...props }) => (
  <div className={`overflow-hidden transition-all duration-200 ${isOpen ? 'max-h-screen' : 'max-h-0'}`}>
    <div {...props} className={`p-6 pt-0 border-t bg-gray-50 ${props.className || ""}`}>
      {children}
    </div>
  </div>
);

// Icons
const CheckCircle: React.FC<any> = (props) => (
  <svg {...props} className={`inline-block ${props.className || ""}`} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const AlertTriangle: React.FC<any> = (props) => (
  <svg {...props} className={`inline-block ${props.className || ""}`} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 3.001-1.742 3.001H4.42c-1.53 0-2.493-1.667-1.743-3.001l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 011-1h.01a1 1 0 010 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
  </svg>
);

const Shield: React.FC<any> = (props) => (
  <svg {...props} className={`inline-block ${props.className || ""}`} fill="currentColor" viewBox="0 0 20 20">
    <path d="M10 12l-6-3V3h12v6l-6 3zm0 2.236l-6-3V14a2 2 0 002 2h8a2 2 0 002-2v-2.764l-6 3z" />
  </svg>
);

const Clock: React.FC<any> = (props) => (
  <svg {...props} className={`inline-block ${props.className || ""}`} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
  </svg>
);

const Info: React.FC<any> = (props) => (
  <svg {...props} className={`inline-block ${props.className || ""}`} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
  </svg>
);

const ChevronRight: React.FC<any> = (props) => (
  <svg {...props} className={`inline-block ${props.className || ""}`} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
  </svg>
);

const AlertCircle: React.FC<any> = (props) => (
  <svg {...props} className={`inline-block ${props.className || ""}`} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

const Target: React.FC<any> = (props) => (
  <svg {...props} className={`inline-block ${props.className || ""}`} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 10a1 1 0 112 0v1a1 1 0 11-2 0v-1zm1-4a3 3 0 100 6 3 3 0 000-6z" clipRule="evenodd" />
  </svg>
);

const Layers: React.FC<any> = (props) => (
  <svg {...props} className={`inline-block ${props.className || ""}`} fill="currentColor" viewBox="0 0 20 20">
    <path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm10 12H5V5h10v10zM3 7a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 6a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
  </svg>
);

const Activity: React.FC<any> = (props) => (
  <svg {...props} className={`inline-block ${props.className || ""}`} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13H9v3.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 8.586V5z" clipRule="evenodd" />
  </svg>
);

const Badge: React.FC<any> = ({ children, variant = "default", ...props }) => (
  <span 
    {...props} 
    className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full ${
      variant === "outline" 
        ? "border border-gray-300 text-gray-700 bg-white" 
        : variant === "destructive"
        ? "bg-red-100 text-red-800"
        : variant === "secondary"
        ? "bg-gray-100 text-gray-800"
        : "bg-blue-100 text-blue-800"
    } ${props.className || ""}`}
  >
    {children}
  </span>
);

const Progress: React.FC<any> = ({ value, ...props }) => (
  <div className={`w-full bg-gray-200 rounded-full h-2 ${props.className || ""}`}>
    <div 
      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
      style={{ width: `${Math.min(100, Math.max(0, value || 0))}%` }}
    />
  </div>
);

const Tabs: React.FC<any> = ({ children, defaultValue, className, ...props }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);
  return (
    <div className={className}>
      {React.Children.map(children, child =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement, { activeTab, setActiveTab })
          : child
      )}
    </div>
  );
};

const TabsList: React.FC<any> = ({ children, activeTab, setActiveTab, className, ...props }) => (
  <div className={`flex border-b bg-white ${className || ""}`}>
    {React.Children.map(children, child =>
      React.isValidElement(child)
        ? React.cloneElement(child as React.ReactElement, { activeTab, setActiveTab })
        : child
    )}
  </div>
);

const TabsTrigger: React.FC<any> = ({ children, value, activeTab, setActiveTab, ...props }) => (
  <button
    {...props}
    onClick={() => setActiveTab(value)}
    className={`py-3 px-6 -mb-px border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
      activeTab === value
        ? "border-blue-500 text-blue-600 bg-blue-50"
        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
    } ${props.className || ""}`}
  >
    {children}
  </button>
);

const TabsContent: React.FC<any> = ({ children, value, activeTab, ...props }) => (
  activeTab === value ? (
    <div {...props} className={`mt-6 ${props.className || ""}`}>
      {children}
    </div>
  ) : null
);

const Alert: React.FC<any> = ({ children, ...props }) => (
  <div {...props} className={`p-4 border rounded-lg bg-blue-50 border-blue-200 flex items-start gap-3 ${props.className || ""}`}>
    {children}
  </div>
);

const AlertDescription: React.FC<any> = ({ children, ...props }) => (
  <div {...props} className="text-sm text-blue-800">
    {children}
  </div>
);

const AlertTitle: React.FC<any> = ({ children, ...props }) => (
  <h5 {...props} className="font-medium text-blue-900 mb-1">
    {children}
  </h5>
);

const Tooltip: React.FC<any> = ({ children, content, ...props }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block" {...props}>
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        {children}
      </div>
      {show && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap">
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
};

// --- End UI Component Stubs ---

// Use the actual types from securityData.ts
export type Threat = SecurityThreat & {
  category?: string; 
  architectureRisk?: Record<string, "low" | "medium" | "high">; 
};

export type Mitigation = SecurityMitigation & {
  effort?: "low" | "medium" | "high"; 
  priority?: "low" | "medium" | "high"; 
};

// --- HIERARCHICAL COMPONENT DATA - Use actual frameworkData ---
export interface HierarchicalComponentOption {
  id: string;
  name: string;
  description: string;
  category?: string;
  children?: HierarchicalComponentOption[];
  threatIds?: string[];
  color?: string;
}

// Convert frameworkData to hierarchical component data
const convertFrameworkDataToHierarchical = (): HierarchicalComponentOption[] => {
  const convertNode = (node: any): HierarchicalComponentOption => {
    return {
      id: node.id,
      name: node.title,
      description: node.description || "",
      threatIds: node.threatCategories || [],
      color: node.color,
      children: node.children ? node.children.map(convertNode) : undefined
    };
  };

  // Add categories based on component types
  return frameworkData.map(node => {
    const converted = convertNode(node);
    // Add category based on component ID
    if (node.id.includes("kc1")) converted.category = "Core";
    else if (node.id.includes("kc2")) converted.category = "Control";
    else if (node.id.includes("kc3")) converted.category = "Core";
    else if (node.id.includes("kc4")) converted.category = "Data";
    else if (node.id.includes("kc5")) converted.category = "Integration";
    else if (node.id.includes("kc6")) converted.category = "Infrastructure";
    
    return converted;
  });
};

const hierarchicalComponentData: HierarchicalComponentOption[] = convertFrameworkDataToHierarchical();

// --- USE ACTUAL THREAT AND MITIGATION DATA ---
// Map real data with architecture risk preservation
const originalThreatDataForPreservation: Record<string, { category?: string; architectureRisk?: Record<string, "low" | "medium" | "high"> }> = {
  t1: { category: "Memory", architectureRisk: { sequential: "medium", hierarchical: "high", collaborative: "high", reactive: "medium", knowledge: "high" } },
  t2: { category: "Tool", architectureRisk: { sequential: "medium", hierarchical: "high", collaborative: "high", reactive: "high", knowledge: "medium" } },
  t3: { category: "Access", architectureRisk: { sequential: "low", hierarchical: "high", collaborative: "medium", reactive: "medium", knowledge: "medium" } },
  t4: { category: "Availability", architectureRisk: { sequential: "low", hierarchical: "medium", collaborative: "high", reactive: "high", knowledge: "medium" } },
  t5: { category: "Integrity", architectureRisk: { sequential: "high", hierarchical: "medium", collaborative: "medium", reactive: "low", knowledge: "high" } },
  t6: { category: "Control", architectureRisk: { sequential: "high", hierarchical: "high", collaborative: "high", reactive: "medium", knowledge: "medium" } },
  t7: { category: "Alignment", architectureRisk: { sequential: "high", hierarchical: "medium", collaborative: "medium", reactive: "medium", knowledge: "medium" } },
  t8: { category: "Accountability", architectureRisk: { sequential: "low", hierarchical: "medium", collaborative: "high", reactive: "medium", knowledge: "low" } },
  t9: { category: "Authentication", architectureRisk: { sequential: "low", hierarchical: "high", collaborative: "high", reactive: "low", knowledge: "low" } },
  t10: { category: "Human Factors", architectureRisk: { sequential: "low", hierarchical: "high", collaborative: "medium", reactive: "medium", knowledge: "medium" } },
  t11: { category: "Execution", architectureRisk: { sequential: "medium", hierarchical: "high", collaborative: "high", reactive: "high", knowledge: "low" } },
  t12: { category: "Communication", architectureRisk: { sequential: "low", hierarchical: "high", collaborative: "high", reactive: "low", knowledge: "low" } },
  t13: { category: "Control", architectureRisk: { sequential: "low", hierarchical: "high", collaborative: "high", reactive: "medium", knowledge: "low" } }, 
  t14: { category: "Human Factors", architectureRisk: { sequential: "low", hierarchical: "medium", collaborative: "medium", reactive: "low", knowledge: "low" } },
  t15: { category: "Trust", architectureRisk: { sequential: "medium", hierarchical: "high", collaborative: "high", reactive: "medium", knowledge: "medium" } }
};

const originalMitigationDataForPreservation: Record<string, { effort?: "low" | "medium" | "high"; priority?: "low" | "medium" | "high" }> = {
  m1: { effort: "medium", priority: "high" },
  m2: { effort: "high", priority: "high" },
  m3: { effort: "medium", priority: "high" },
  m4: { effort: "low", priority: "high" },
  m5: { effort: "medium", priority: "medium" },
  m6: { effort: "medium", priority: "high" },
  m7: { effort: "high", priority: "high" },
  m8: { effort: "medium", priority: "medium" },
  m9: { effort: "low", priority: "medium" },
  m10: { effort: "high", priority: "high" },
  m11: { effort: "medium", priority: "medium" },
  m12: { effort: "high", priority: "high" }
};

// Build final data structures using real data
const threatData: Record<string, Threat> = {};
Object.values(threatsData).forEach(realThreat => {
  const originalInfo = originalThreatDataForPreservation[realThreat.id];
  threatData[realThreat.id] = { 
    ...realThreat,
    category: originalInfo?.category,
    architectureRisk: originalInfo?.architectureRisk,
  };
});

const mitigationData: Record<string, Mitigation> = {};
Object.values(mitigationsData).forEach(realMitigation => {
  const originalInfo = originalMitigationDataForPreservation[realMitigation.id];
  mitigationData[realMitigation.id] = { 
    ...realMitigation,
    effort: originalInfo?.effort,
    priority: originalInfo?.priority,
  };
});

// Architecture Options
const architectureOptions = [
  { id: "sequential", name: "Sequential Agent Architecture", description: "Linear flow with a single agent processing tasks sequentially. High traceability, limited adaptability.", icon: <ChevronRight className="h-5 w-5" /> },
  { id: "hierarchical", name: "Hierarchical Agent Architecture", description: "Orchestrator coordinates multiple specialized sub-agents. Good for complex task decomposition.", icon: <Layers className="h-5 w-5" /> },
  { id: "collaborative", name: "Collaborative Agent Swarm", description: "Peer-based agents working together. Emphasizes communication and distributed decision-making.", icon: <Activity className="h-5 w-5" /> },
  { id: "reactive", name: "Reactive Agent Architecture", description: "Agents respond to stimuli with predefined actions, often using ReAct. Good for real-time response.", icon: <AlertCircle className="h-5 w-5" /> }, 
  { id: "knowledge", name: "Knowledge-Intensive Agent Architecture", description: "Focuses on extensive knowledge retrieval (RAG) to inform decisions. For research and synthesis.", icon: <Info className="h-5 w-5" /> }, 
];

// Types
type ThreatCode = keyof typeof threatData;
type MitigationCode = keyof typeof mitigationData;
type RiskLevel = "low" | "medium" | "high" | "critical";
type Phase = "design" | "build" | "operation";

interface ThreatAssessment {
  threat: Threat; 
  riskLevel: RiskLevel; 
  residualRiskLevel: RiskLevel; 
  mitigations: MitigationCode[]; 
  isUserMitigated: boolean; 
}

interface MitigationRecommendation {
  mitigation: Mitigation; 
  coverage: number; 
  threatsAddressed: ThreatCode[]; 
}

export const AssessmentTool = () => {
  const [architecture, setArchitecture] = useState<string>("");
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const [selectedMitigations, setSelectedMitigations] = useState<MitigationCode[]>([]); 
  const [step, setStep] = useState<number>(1);
  const [showResults, setShowResults] = useState<boolean>(false);

  const MAX_STEPS = 4; 

  // Helper functions for hierarchical component selection
  const getAllChildren = useCallback((componentId: string, data: HierarchicalComponentOption[]): string[] => {
    const findComponentById = (id: string, components: HierarchicalComponentOption[]): HierarchicalComponentOption | null => {
      for (const comp of components) {
        if (comp.id === id) return comp;
        if (comp.children) {
          const found = findComponentById(id, comp.children);
          if (found) return found;
        }
      }
      return null;
    };

    const component = findComponentById(componentId, data);
    if (!component || !component.children) return [];

    const children: string[] = [];
    const collectChildren = (comp: HierarchicalComponentOption) => {
      if (comp.children) {
        comp.children.forEach(child => {
          children.push(child.id);
          collectChildren(child);
        });
      }
    };
    collectChildren(component);
    return children;
  }, []);

  const getAllParents = useCallback((componentId: string): string[] => {
    const parents: string[] = [];
    let currentId = componentId;
    
    while (currentId.includes('.')) {
      const parentId = currentId.substring(0, currentId.lastIndexOf('.'));
      if (parentId && parentId !== currentId) {
        parents.push(parentId);
        currentId = parentId;
      } else {
        break;
      }
    }
    return parents;
  }, []);

  const isComponentFamilySelected = useCallback((
    componentId: string,
    selectedIds: string[]
  ): boolean => {
    // Normalize IDs - convert between dash and dot notation
    const normalizeId = (id: string) => id.replace(/-/g, '.');
    const normalizedComponentId = normalizeId(componentId);
    const normalizedSelectedIds = selectedIds.map(normalizeId);

    // Check if componentId itself is selected (exact match or with dash/dot variations)
    if (selectedIds.includes(componentId) || normalizedSelectedIds.includes(normalizedComponentId)) {
      return true;
    }

    // Check if the base component is selected (e.g., "kc4" matches when "kc4" is selected)
    const baseComponentId = normalizedComponentId.split('.')[0];
    if (normalizedSelectedIds.includes(baseComponentId)) {
      return true;
    }

    // Check if any selected component is a descendant of componentId
    return normalizedSelectedIds.some(selectedId => {
      let currentId = selectedId;
      while (currentId.includes('.')) {
        const parentId = currentId.substring(0, currentId.lastIndexOf('.'));
        if (parentId === normalizedComponentId || parentId === baseComponentId) return true;
        if (!parentId || parentId === currentId) break;
        currentId = parentId;
      }
      return false;
    });
  }, []);

  const handleComponentToggle = useCallback((id: string) => {
    setSelectedComponents(prev => {
      if (prev.includes(id)) {
        // Deselecting: remove this component and all its children
        const children = getAllChildren(id, hierarchicalComponentData);
        return prev.filter(c => c !== id && !children.includes(c));
      } else {
        // Selecting: add this component and all its parents
        const parents = getAllParents(id);
        const toAdd = [id, ...parents.filter(p => !prev.includes(p))];
        return [...prev, ...toAdd];
      }
    });
  }, [getAllChildren, getAllParents]);

  const calculateInitialRiskScore = useCallback((threat: Threat): RiskLevel => {
    const archRiskValue = threat.architectureRisk?.[architecture as keyof typeof threat.architectureRisk] || "medium";
    
    const isThreatComponentFamilySelected = threat.componentIds.some(mainThreatCompId => 
        isComponentFamilySelected(mainThreatCompId, selectedComponents)
    );

    if (!isThreatComponentFamilySelected) return "low";

    if (threat.impactLevel === "high" && archRiskValue === "high") return "critical";
    if (threat.impactLevel === "high" || archRiskValue === "high") return "high";
    if (archRiskValue === "low") return "low";
    return "medium";
  }, [architecture, selectedComponents, isComponentFamilySelected]);
  
  const isThreatUserMitigated = useCallback((threatCode: ThreatCode): boolean => {
    return selectedMitigations.some(smCode => {
        const mitigation = mitigationData[smCode];
        return mitigation && mitigation.threatIds.includes(threatCode);
    });
  }, [selectedMitigations]);

  const getRelevantThreats = useCallback((): ThreatAssessment[] => {
    return Object.values(threatData) 
      .filter((threat) => 
         threat.componentIds.some(mainThreatCompId => 
            isComponentFamilySelected(mainThreatCompId, selectedComponents)
         )
      )
      .map((threat) => {
        const initialRiskLevel = calculateInitialRiskScore(threat);
        const userMitigated = isThreatUserMitigated(threat.id as ThreatCode);
        
        let residualRisk = initialRiskLevel;
        if (userMitigated) { 
            if (initialRiskLevel === "critical") residualRisk = "medium";
            else if (initialRiskLevel === "high") residualRisk = "low";
            else if (initialRiskLevel === "medium") residualRisk = "low";
        }

        const potentialMitigationsForThreat = Object.values(mitigationData)
          .filter((m) => m.threatIds.includes(threat.id as ThreatCode)) 
          .map((m) => m.id as MitigationCode); 
        
        return {
          threat,
          riskLevel: initialRiskLevel,
          residualRiskLevel: residualRisk,
          mitigations: potentialMitigationsForThreat,
          isUserMitigated: userMitigated
        };
      })
      .sort((a, b) => {
        const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        if (riskOrder[a.residualRiskLevel] !== riskOrder[b.residualRiskLevel]) {
            return riskOrder[a.residualRiskLevel] - riskOrder[b.residualRiskLevel];
        }
        return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
      });
  }, [selectedComponents, calculateInitialRiskScore, isThreatUserMitigated, isComponentFamilySelected]);

  const getRecommendedMitigations = useCallback((): MitigationRecommendation[] => {
    const relevantUnmitigatedThreats = getRelevantThreats().filter(t => !t.isUserMitigated);
    const relevantUnmitigatedThreatCodes = relevantUnmitigatedThreats.map(t => t.threat.id as ThreatCode);
    
    if (relevantUnmitigatedThreatCodes.length === 0) return [];

    return Object.values(mitigationData) 
      .filter(m => !selectedMitigations.includes(m.id as MitigationCode)) 
      .map((mitigation) => {
        const threatsAddressedByThisMitigation = mitigation.threatIds.filter(t_id => 
          relevantUnmitigatedThreatCodes.includes(t_id as ThreatCode)
        ) as ThreatCode[];
        
        const coverage = threatsAddressedByThisMitigation.length / Math.max(relevantUnmitigatedThreatCodes.length, 1);
        
        // Note: components property was removed as it's not in the actual SecurityMitigation type
        const mitigationAppliesToSelectedComponentFamily = true;
        
        return {
          mitigation,
          coverage: mitigationAppliesToSelectedComponentFamily ? coverage : coverage * 0.5, 
          threatsAddressed: threatsAddressedByThisMitigation
        };
      })
      .filter(m => m.coverage > 0 && m.threatsAddressed.length > 0) 
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const priorityA = priorityOrder[a.mitigation.priority || 'low'];
        const priorityB = priorityOrder[b.mitigation.priority || 'low'];
        if (priorityA !== priorityB) return priorityA - priorityB;
        return b.coverage - a.coverage;
      });
  }, [getRelevantThreats, selectedMitigations, isComponentFamilySelected, selectedComponents]);
  
  const calculateSecurityScore = useCallback(() => {
    const threatsAssessments = getRelevantThreats();
    if (threatsAssessments.length === 0) return 100; 
    
    const riskWeights = { critical: 4, high: 3, medium: 2, low: 1 };
    
    let totalInitialRiskWeight = 0;
    let totalResidualRiskWeight = 0;

    threatsAssessments.forEach(t => {
        totalInitialRiskWeight += riskWeights[t.riskLevel]; 
        totalResidualRiskWeight += riskWeights[t.residualRiskLevel]; 
    });
    
    if (totalInitialRiskWeight === 0) return 100; 

    const score = Math.max(0, (1 - totalResidualRiskWeight / totalInitialRiskWeight) * 100);
    return Math.round(score);
  }, [getRelevantThreats]);

  const getImplementationRoadmap = useCallback(() => {
    const recommended = getRecommendedMitigations(); 
    const phases: Record<Phase, MitigationRecommendation[]> = {
      design: [],
      build: [],
      operation: []
    };
    
    recommended.forEach(mRec => {
      if (mRec.mitigation.designPhase) phases.design.push(mRec);
      if (mRec.mitigation.buildPhase) phases.build.push(mRec);
      if (mRec.mitigation.operationPhase) phases.operation.push(mRec);
    });
    
    return phases;
  }, [getRecommendedMitigations]);

  const handleArchitectureSelect = (id: string) => {
    setArchitecture(id);
  };

  const handleMitigationToggle = (code: MitigationCode) => {
    setSelectedMitigations(prev =>
      prev.includes(code)
        ? prev.filter(mCode => mCode !== code)
        : [...prev, code]
    );
  };

  const handleNext = () => {
    if (step === 1 && architecture) {
      setStep(2);
    } else if (step === 2 && selectedComponents.length > 0) {
      setStep(3); 
    } else if (step === 3) { 
      setStep(4);
      setShowResults(true);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else if (step === 3) {
      setStep(2);
    } else if (step === 4) {
      setStep(3);
      setShowResults(false);
    }
  };

  const handleStepClick = (targetStep: number) => {
    if (targetStep < step || (targetStep === 2 && architecture) || (targetStep === 3 && selectedComponents.length > 0)) {
      setStep(targetStep);
      if (targetStep === 4) {
        setShowResults(true);
      } else {
        setShowResults(false);
      }
    }
  };

  const handleReset = () => {
    setArchitecture("");
    setSelectedComponents([]);
    setSelectedMitigations([]);
    setStep(1);
    setShowResults(false);
  };

  const getRiskBadgeColor = (level: RiskLevel) => {
    switch(level) {
      case "critical": return "bg-red-600 text-white";
      case "high": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "low": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };
  
  const getEffortIcon = (effort?: "low" | "medium" | "high") => {
    switch(effort) {
      case "low": return <Clock className="h-4 w-4 text-green-600" />;
      case "medium": return <Clock className="h-4 w-4 text-yellow-600" />;
      case "high": return <Clock className="h-4 w-4 text-red-600" />;
      default: return null;
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch(category) {
      case "Core": return <Target className="h-4 w-4" />;
      case "Control": return <Layers className="h-4 w-4" />;
      case "Data": return <AlertCircle className="h-4 w-4" />; 
      case "Integration": return <Activity className="h-4 w-4" />;
      case "Infrastructure": return <Shield className="h-4 w-4" />;
      default: return <ChevronRight className="h-4 w-4 text-gray-400" />;
    }
  };

  const getComponentByIdFlat = (id: string): HierarchicalComponentOption | null => {
    const flattenData = (components: HierarchicalComponentOption[]): HierarchicalComponentOption[] => {
      return components.reduce((acc, comp) => {
        acc.push(comp);
        if (comp.children) {
          acc.push(...flattenData(comp.children));
        }
        return acc;
      }, [] as HierarchicalComponentOption[]);
    };
    
    const flattened = flattenData(hierarchicalComponentData);
    return flattened.find(comp => comp.id === id) || null;
  };

  // Recursive component rendering function
  const renderComponentOptions = (components: HierarchicalComponentOption[], level = 0) => {
    // Static indentation classes for each level
    const levelIndent = ["", "ml-4", "ml-8", "ml-12", "ml-16", "ml-20"];
    return components.map((option) => {
      const isSelected = selectedComponents.includes(option.id);
      const hasSelectedChild = option.children?.some(child => 
        isComponentFamilySelected(child.id, selectedComponents)
      );

      return (
        <React.Fragment key={option.id}>
          <Card
            className={`cursor-pointer transition-all duration-200 ${levelIndent[level] || "ml-20"} ${
              isSelected
                ? "border-blue-500 bg-blue-50 shadow-md ring-1 ring-blue-200"
                : hasSelectedChild
                ? "border-blue-300 bg-blue-25 shadow-sm"
                : "hover:border-gray-300 hover:shadow-sm"
            }`}
            onClick={() => handleComponentToggle(option.id)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                isSelected 
                  ? 'bg-blue-500 border-blue-500' 
                  : hasSelectedChild
                  ? 'bg-blue-100 border-blue-300'
                  : 'border-gray-300'
              }`}>
                {isSelected && <CheckCircle className="h-3 w-3 text-white" />}
                {!isSelected && hasSelectedChild && <div className="w-2 h-2 bg-blue-400 rounded-full" />}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={`font-medium text-sm ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                  {option.name}
                </h4>
                <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{option.description}</p>
              </div>
              {level === 0 && (
                <div className="flex items-center">
                  {getCategoryIcon(option.category)}
                </div>
              )}
            </CardContent>
          </Card>
          {option.children && option.children.length > 0 && (
            <div className="space-y-2 mt-2">
              {renderComponentOptions(option.children, level + 1)}
            </div>
          )}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      <Card className="w-full shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <CardTitle className="text-3xl font-bold">OWASP Agentic AI Security Assessment</CardTitle>
          <CardDescription className="text-blue-100 text-base">
            Identify security threats and controls for your agentic AI architecture based on the OWASP Securing Agentic Applications guide.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {/* Improved Stepper - Sticky */}
          <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-6 py-4">
            <div className="mb-4">
              <Progress value={(step / MAX_STEPS) * 100} className="h-3" />
            </div>
            <div className="flex justify-between">
              {[
                { num: 1, title: "Architecture", subtitle: "Select pattern" },
                { num: 2, title: "Components", subtitle: "Choose modules" },
                { num: 3, title: "Mitigations", subtitle: "Current controls" },
                { num: 4, title: "Assessment", subtitle: "View results" }
              ].map(({ num, title, subtitle }) => {
                const isActive = step === num;
                const isComplete = step > num;
                const isClickable = num < step || (num === 2 && architecture) || (num === 3 && selectedComponents.length > 0);
                
                return (
                  <button
                    key={num}
                    onClick={() => isClickable && handleStepClick(num)}
                    disabled={!isClickable}
                    className={`flex flex-col items-center text-center transition-all duration-200 p-2 rounded-lg ${
                      isActive 
                        ? "text-blue-600 bg-blue-50 font-semibold" 
                        : isComplete
                        ? "text-green-600 hover:bg-green-50"
                        : isClickable
                        ? "text-gray-600 hover:bg-gray-50"
                        : "text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-1 ${
                      isActive 
                        ? "bg-blue-600 text-white" 
                        : isComplete
                        ? "bg-green-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}>
                      {isComplete ? "✓" : num}
                    </div>
                    <span className="text-sm font-medium">{title}</span>
                    <span className="text-xs text-gray-500">{subtitle}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-6">
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Select Your System's Architecture Pattern</h3>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    Choose the architecture pattern that best describes your agentic AI system. This will help tailor the threat analysis to your specific setup.
                  </p>
                </div>
                <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {architectureOptions.map((option) => (
                    <Card 
                      key={option.id} 
                      className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
                        architecture === option.id 
                          ? "border-blue-500 ring-2 ring-blue-200 bg-blue-50 shadow-lg" 
                          : "hover:shadow-lg hover:border-gray-300 border-gray-200"
                      }`}
                      onClick={() => handleArchitectureSelect(option.id)}
                    >
                      <CardContent className="p-6 flex flex-col items-center text-center gap-4 h-full">
                        <div className={`rounded-full w-16 h-16 flex items-center justify-center border-2 transition-all ${
                          architecture === option.id 
                            ? "border-blue-500 bg-blue-100 text-blue-600" 
                            : "border-gray-300 bg-gray-100 text-gray-600"
                        }`}>
                          {React.cloneElement(option.icon, { className: "h-8 w-8" })}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-lg mb-2 text-gray-900">{option.name}</h4>
                          <p className="text-sm text-gray-600 leading-relaxed">{option.description}</p>
                        </div>
                        {architecture === option.id && <CheckCircle className="h-6 w-6 text-blue-600" />}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Select Key System Components</h3>
                  <p className="text-gray-600 max-w-3xl mx-auto">
                    Select all relevant components and sub-components that are part of your agentic system. 
                    Selecting a sub-component automatically includes its parent components.
                  </p>
                </div>
                <Alert className="mb-6">
                  <Info className="h-5 w-5" />
                  <AlertDescription className="ml-2">
                    <strong>Smart Selection:</strong> When you select a sub-component, all parent components are automatically selected. 
                    Deselecting a parent will deselect all its children. Selected: {selectedComponents.length} components.
                  </AlertDescription>
                </Alert>
                <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                  {hierarchicalComponentData.map((topLevelComponent) => (
                    <div key={topLevelComponent.id} className="bg-white rounded-lg border border-gray-200 p-1">
                      <div className="flex items-center gap-3 text-lg font-bold text-gray-800 mb-4 px-3 py-2 bg-gray-50 rounded-lg border-b">
                        {getCategoryIcon(topLevelComponent.category)}
                        <span>{topLevelComponent.category}</span>
                        <div className="ml-auto text-sm font-normal text-gray-500">
                          {topLevelComponent.children?.length || 0} sub-components
                        </div>
                      </div>
                      <div className="space-y-3 px-2">
                        {/* Render the top-level component itself */}
                        <Card className="cursor-pointer transition-all duration-200">
                          <CardContent className="p-4 flex items-center gap-3">
                            <h4 className="font-bold text-base text-gray-900">{topLevelComponent.name}</h4>
                            <p className="text-xs text-gray-600 mt-0.5">{topLevelComponent.description}</p>
                          </CardContent>
                        </Card>
                        {/* Render its children with indentation */}
                        {topLevelComponent.children && renderComponentOptions(topLevelComponent.children, 1)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && !showResults && ( 
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Select Implemented Mitigations</h3>
                  <p className="text-gray-600 max-w-3xl mx-auto">
                    Select all security mitigations you currently have implemented in your system. 
                    This will refine the risk assessment and provide better recommendations.
                  </p>
                </div>
                <Alert className="mb-6">
                  <Shield className="h-5 w-5" />
                  <AlertDescription className="ml-2">
                    <strong>Current Implementation:</strong> Be honest about what you've actually implemented. 
                    This assessment is most valuable when it reflects your real security posture. Selected: {selectedMitigations.length} mitigations.
                  </AlertDescription>
                </Alert>
                <div className="grid lg:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto pr-2">
                                    {Object.values(mitigationData)
                    .sort((a,b) => a.name.localeCompare(b.name)) 
                    .map((mitigation) => (
                      <Card 
                      key={mitigation.id} 
                      className={`cursor-pointer transition-all duration-200 ${
                        selectedMitigations.includes(mitigation.id as MitigationCode) 
                          ? "border-blue-500 bg-blue-50 shadow-md ring-1 ring-blue-200" 
                          : "hover:border-gray-300 hover:shadow-sm"
                      }`}
                      onClick={() => handleMitigationToggle(mitigation.id as MitigationCode)}
                    >
                      <CardContent className="p-4 flex items-start gap-3">
                        <div className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          selectedMitigations.includes(mitigation.id as MitigationCode) 
                            ? 'bg-blue-500 border-blue-500' 
                            : 'border-gray-300'
                        }`}>
                          {selectedMitigations.includes(mitigation.id as MitigationCode) && 
                            <CheckCircle className="h-3 w-3 text-white" />}
                          </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm mb-1">
                            {mitigation.name} <span className="text-xs text-gray-400 font-normal">({mitigation.id})</span>
                          </h4>
                          <p className="text-xs text-gray-600 mb-3 line-clamp-3">{mitigation.description}</p>
                          <div className="flex gap-2 flex-wrap">
                            {mitigation.effort && (
                              <Tooltip content={`Implementation effort: ${mitigation.effort}`}>
                                <Badge variant="outline" className="text-xs flex items-center gap-1">
                                  {getEffortIcon(mitigation.effort)}
                                  {mitigation.effort}
                                </Badge>
                              </Tooltip>
                            )}
                            {mitigation.priority && (
                              <Tooltip content={`Priority level: ${mitigation.priority}`}>
                                <Badge 
                                  variant={mitigation.priority === "high" ? "destructive" : "secondary"} 
                                  className="text-xs"
                                >
                                  {mitigation.priority} priority
                                </Badge>
                              </Tooltip>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            
            {step === 4 && showResults && ( 
              <div className="space-y-8">
                {/* Improved Overview Card */}
                <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardHeader>
                    <CardTitle className="text-2xl text-blue-900 flex items-center gap-2">
                      <Shield className="h-6 w-6" />
                      Security Assessment Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div className="text-center p-6 rounded-xl bg-white shadow-sm border">
                        <div className={`text-6xl font-bold mb-2 ${getScoreColor(calculateSecurityScore())}`}>
                          {calculateSecurityScore()}<span className="text-3xl">%</span>
                        </div>
                        <div className="text-sm font-medium text-gray-700">Overall Security Score</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {calculateSecurityScore() >= 80 ? "Excellent" : 
                           calculateSecurityScore() >= 60 ? "Good" :
                           calculateSecurityScore() >= 40 ? "Needs Improvement" : "Critical"}
                        </div>
                      </div>
                      <div className="text-center p-6 rounded-xl bg-white shadow-sm border">
                        <div className="text-6xl font-bold text-red-500 mb-2">
                          {getRelevantThreats().filter(t => !t.isUserMitigated && (t.residualRiskLevel === "critical" || t.residualRiskLevel === "high")).length}
                        </div>
                        <div className="text-sm font-medium text-gray-700">Unmitigated High/Critical Risks</div>
                        <div className="text-xs text-gray-500 mt-1">Require immediate attention</div>
                      </div>
                      <div className="text-center p-6 rounded-xl bg-white shadow-sm border">
                        <div className="text-6xl font-bold text-blue-500 mb-2">
                          {getRecommendedMitigations().filter(m => m.mitigation.priority === "high").length}
                        </div>
                        <div className="text-sm font-medium text-gray-700">High Priority Recommendations</div>
                        <div className="text-xs text-gray-500 mt-1">Recommended for implementation</div>
                      </div>
                    </div>
                    
                                        <div className="bg-white p-4 rounded-lg border space-y-2 text-sm">
                      <div><span className="font-semibold text-gray-700">Architecture:</span> {architectureOptions.find(a => a.id === architecture)?.name}</div>
                      <div><span className="font-semibold text-gray-700">Components:</span> {selectedComponents.length > 0 ? selectedComponents.map(cId => getComponentByIdFlat(cId)?.name || cId).join(", ") : "None"}</div>
                      <div><span className="font-semibold text-gray-700">Implemented Mitigations:</span> {selectedMitigations.length > 0 ? selectedMitigations.map(mCode => mitigationData[mCode]?.id).join(", ") : "None"}</div>
                  </div>
                  </CardContent>
                </Card>

                {/* Improved Tabs with sticky header */}
                <Tabs defaultValue="threats" className="w-full">
                  <div className="sticky top-[140px] z-10 bg-white border-b border-gray-200 pb-0 mb-6">
                    <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-lg">
                      <TabsTrigger value="threats" className="flex items-center gap-2 py-3">
                        <AlertTriangle className="h-4 w-4" />
                        Threats ({getRelevantThreats().length})
                      </TabsTrigger>
                      <TabsTrigger value="mitigations" className="flex items-center gap-2 py-3">
                        <Shield className="h-4 w-4" />
                        Recommendations ({getRecommendedMitigations().length})
                      </TabsTrigger>
                      <TabsTrigger value="roadmap" className="flex items-center gap-2 py-3">
                        <Clock className="h-4 w-4" />
                        Implementation Roadmap
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="threats" className="space-y-4">
                    <Alert className="border-orange-200 bg-orange-50">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                      <AlertTitle className="text-orange-800">Threat Analysis</AlertTitle>
                      <AlertDescription className="text-orange-700">
                        Identified {getRelevantThreats().length} relevant threats for your architecture and components. 
                        Residual risk considers your implemented mitigations.
                      </AlertDescription>
                    </Alert>
                    <Accordion type="single" collapsible>
                      {getRelevantThreats().map((assessment, index) => (
                        <AccordionItem key={`threat-assessment-${assessment.threat.id}-${index}`} value={assessment.threat.id}>
                          <AccordionTrigger className="hover:no-underline text-sm">
                            <div className="flex items-center gap-4 text-left flex-1">
                              <Badge className={`${getRiskBadgeColor(assessment.residualRiskLevel)} min-w-[80px] justify-center py-1 font-bold`}>
                                {assessment.residualRiskLevel.toUpperCase()}
                              </Badge>
                              <div className="flex-1 min-w-0">
                                <span className="font-semibold block">
                                  {assessment.threat.code}: {assessment.threat.name}
                                </span>
                                {assessment.isUserMitigated && (
                                  <span className="text-xs text-green-600 flex items-center gap-1 mt-1">
                                    <CheckCircle className="h-3 w-3" />
                                    Partially mitigated by your controls
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-2">
                                {assessment.threat.category && (
                                  <Badge variant="outline" className="text-xs">{assessment.threat.category}</Badge>
                                )}
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-4 text-sm">
                              <p className="text-gray-700 leading-relaxed">{assessment.threat.description}</p>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <p className="font-semibold mb-2 text-gray-800">Risk Assessment:</p>
                                  <div className="space-y-1">
                                    <div className="flex justify-between">
                                      <span>Initial Impact:</span>
                                      <Badge variant="outline" className={
                                        assessment.threat.impactLevel === "high" ? "border-red-400 text-red-600" : 
                                        assessment.threat.impactLevel === "medium" ? "border-yellow-400 text-yellow-600" : 
                                        "border-green-400 text-green-600"
                                      }>
                                        {assessment.threat.impactLevel.toUpperCase()}
                                      </Badge>
                                    </div>
                                    {assessment.threat.architectureRisk && architecture && (
                                      <div className="flex justify-between">
                                        <span>Architecture Risk:</span>
                                        <Badge variant="outline">{assessment.threat.architectureRisk[architecture]?.toUpperCase() || 'N/A'}</Badge>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {assessment.threat.affectedComponents && assessment.threat.affectedComponents.length > 0 && (
                                  <div>
                                    <p className="font-semibold mb-2 text-gray-800">Affected Components:</p>
                                    <div className="flex gap-1 flex-wrap">
                                      {assessment.threat.affectedComponents.map(ac => (
                                        <Badge key={ac} variant="secondary" className="text-xs">{ac}</Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {assessment.threat.attackVectors && assessment.threat.attackVectors.length > 0 && (
                                <div>
                                  <p className="font-semibold mb-2 text-gray-800">Attack Vectors:</p>
                                  <div className="flex gap-1 flex-wrap">
                                    {assessment.threat.attackVectors.map((av, index) => (
                                      <Badge key={`av-${index}`} variant="outline" className="text-xs bg-red-50 border-red-200 text-red-700">
                                        {typeof av === 'string' ? av : av.vector || 'Unknown'}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              <div>
                                <p className="font-semibold mb-2 text-gray-800">Available Mitigations ({assessment.mitigations.length}):</p>
                                <div className="flex gap-1 flex-wrap">
                                  {assessment.mitigations.map(mCode => (
                                    <Badge 
                                      key={mCode} 
                                      variant="outline" 
                                      className={`text-xs ${
                                        selectedMitigations.includes(mCode) 
                                          ? 'bg-green-100 text-green-700 border-green-400' 
                                          : 'bg-blue-50 text-blue-700 border-blue-300'
                                      }`}
                                    >
                                      {mitigationData[mCode]?.id || mCode}
                                      {selectedMitigations.includes(mCode) ? ' ✓' : ''}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </TabsContent>

                  <TabsContent value="mitigations" className="space-y-4">
                    <Alert className="border-blue-200 bg-blue-50">
                      <Shield className="h-5 w-5 text-blue-600" />
                      <AlertTitle className="text-blue-800">Recommended Additional Mitigations</AlertTitle>
                      <AlertDescription className="text-blue-700">
                        Implement these controls to address remaining threats. Prioritized by coverage and importance.
                      </AlertDescription>
                    </Alert>
                    {getRecommendedMitigations().length > 0 ? (
                      <Accordion type="single" collapsible>
                        {getRecommendedMitigations().map((rec, index) => (
                          <AccordionItem key={`rec-mitigation-${rec.mitigation.id}-${index}`} value={rec.mitigation.id}>
                            <AccordionTrigger className="hover:no-underline text-sm">
                              <div className="flex items-center gap-4 text-left flex-1">
                                <div className="min-w-[100px]">
                                  <Progress value={rec.coverage * 100} className="h-2 mb-1" />
                                  <span className="text-xs text-gray-500">{Math.round(rec.coverage * 100)}% Coverage</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="font-semibold flex items-center gap-2">
                                    {rec.mitigation.id}: {rec.mitigation.name}
                                    {getEffortIcon(rec.mitigation.effort)}
                                  </span>
                                  <span className="text-xs text-gray-600 block mt-1">
                                    Addresses {rec.threatsAddressed.length} unmitigated threats
                                  </span>
                                </div>
                                <div className="flex gap-2">
                                  {rec.mitigation.priority && (
                                    <Badge 
                                      variant={rec.mitigation.priority === "high" ? "destructive" : "secondary"}
                                      className="text-xs"
                                    >
                                      {rec.mitigation.priority} priority
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-4 text-sm">
                                <p className="text-gray-700 leading-relaxed">{rec.mitigation.description}</p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <p className="font-semibold mb-2 text-gray-800">Implementation Details:</p>
                                    <div className="space-y-1">
                                      {rec.mitigation.effort && (
                                        <div className="flex items-center gap-2">
                                          <span>Effort:</span>
                                          <Badge variant="outline" className="capitalize flex items-center gap-1">
                                            {getEffortIcon(rec.mitigation.effort)}
                                            {rec.mitigation.effort}
                                          </Badge>
                                        </div>
                                      )}
                                      <div>
                                        <span className="font-medium">Phases:</span>
                                        <div className="flex gap-1 flex-wrap mt-1">
                                          {rec.mitigation.designPhase && <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">Design</Badge>}
                                          {rec.mitigation.buildPhase && <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700">Build</Badge>}
                                          {rec.mitigation.operationPhase && <Badge variant="outline" className="text-xs bg-teal-50 text-teal-700">Operation</Badge>}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <p className="font-semibold mb-2 text-gray-800">Threat Coverage:</p>
                                    <div className="flex gap-1 flex-wrap">
                                      {rec.threatsAddressed.map((tCode, index) => (
                                        <Badge key={`threat-${tCode}-${index}`} variant="secondary" className="text-xs">
                                          {threatData[tCode]?.id || tCode}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                
                                <Accordion type="single" collapsible>
                                  <AccordionItem value="implementation-details">
                                    <AccordionTrigger className="text-xs hover:no-underline font-medium text-gray-600 py-2">
                                      View Detailed Implementation Guide
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      <div className="text-xs space-y-3 bg-gray-50 p-3 rounded-lg">
                                        <div>
                                          <strong className="text-purple-700">Design Phase:</strong>
                                          <pre className="whitespace-pre-wrap text-gray-700 bg-white p-2 rounded text-xs mt-1 border">
                                            {rec.mitigation.implementationDetail.design || "N/A"}
                                          </pre>
                                        </div>
                                        <div>
                                          <strong className="text-indigo-700">Build Phase:</strong>
                                          <pre className="whitespace-pre-wrap text-gray-700 bg-white p-2 rounded text-xs mt-1 border">
                                            {rec.mitigation.implementationDetail.build || "N/A"}
                                          </pre>
                                        </div>
                                        <div>
                                          <strong className="text-teal-700">Operations Phase:</strong>
                                          <pre className="whitespace-pre-wrap text-gray-700 bg-white p-2 rounded text-xs mt-1 border">
                                            {rec.mitigation.implementationDetail.operations || "N/A"}
                                          </pre>
                                        </div>
                                        <div>
                                          <strong className="text-gray-700">Tools & Frameworks:</strong>
                                          <pre className="whitespace-pre-wrap text-gray-700 bg-white p-2 rounded text-xs mt-1 border">
                                            {rec.mitigation.implementationDetail.toolsAndFrameworks || "N/A"}
                                          </pre>
                                        </div>
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>
                                </Accordion>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    ) : (
                      <div className="text-center py-12 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-green-800 mb-2">Excellent Security Posture!</h3>
                        <p className="text-sm text-green-700">
                          All identified threats appear to be addressed by your selected mitigations, 
                          or no further specific mitigations are recommended based on your current setup.
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="roadmap" className="space-y-6">
                    <Alert className="border-purple-200 bg-purple-50">
                      <Clock className="h-5 w-5 text-purple-600" />
                      <AlertTitle className="text-purple-800">Implementation Roadmap</AlertTitle>
                      <AlertDescription className="text-purple-700">
                        A phased approach for implementing recommended security controls. 
                        Each phase builds upon the previous one for comprehensive security coverage.
                      </AlertDescription>
                    </Alert>
                    
                    {/* Always show all phases */}
                    {[
                      { 
                        phase: "design" as Phase, 
                        title: "Design Phase", 
                        icon: <Target className="h-5 w-5 text-purple-600" />, 
                        description: "Focus on architectural decisions, policy definitions, and proactive security planning.",
                        styles: {
                          cardBorder: "border-l-4 border-l-purple-400",
                          headerBg: "bg-purple-50 border-b",
                          mitigationBg: "bg-purple-50 rounded-lg border border-purple-200 hover:shadow-sm transition-shadow",
                          emptyStateBg: "bg-purple-100",
                          emptyStateIcon: "h-6 w-6 text-purple-400"
                        }
                      },
                      { 
                        phase: "build" as Phase, 
                        title: "Build Phase", 
                        icon: <Layers className="h-5 w-5 text-indigo-600" />, 
                        description: "Implement technical controls, secure coding practices, and testing during development.",
                        styles: {
                          cardBorder: "border-l-4 border-l-indigo-400",
                          headerBg: "bg-indigo-50 border-b",
                          mitigationBg: "bg-indigo-50 rounded-lg border border-indigo-200 hover:shadow-sm transition-shadow",
                          emptyStateBg: "bg-indigo-100",
                          emptyStateIcon: "h-6 w-6 text-indigo-400"
                        }
                      },
                      { 
                        phase: "operation" as Phase, 
                        title: "Operation Phase", 
                        icon: <Activity className="h-5 w-5 text-teal-600" />, 
                        description: "Establish runtime monitoring, incident response, and ongoing maintenance procedures.",
                        styles: {
                          cardBorder: "border-l-4 border-l-teal-400",
                          headerBg: "bg-teal-50 border-b",
                          mitigationBg: "bg-teal-50 rounded-lg border border-teal-200 hover:shadow-sm transition-shadow",
                          emptyStateBg: "bg-teal-100",
                          emptyStateIcon: "h-6 w-6 text-teal-400"
                        }
                      }
                    ].map(({ phase, title, icon, description, styles }) => {
                      const mitigationsInPhase = getImplementationRoadmap()[phase] || [];
                      const uniqueMitigations = mitigationsInPhase
                        .filter((m, i, arr) => arr.findIndex(x => x.mitigation.id === m.mitigation.id) === i)
                        .sort((a,b) => {
                          const priorityOrder = { high: 0, medium: 1, low: 2 };
                          const priorityA = priorityOrder[a.mitigation.priority || 'low'];
                          const priorityB = priorityOrder[b.mitigation.priority || 'low'];
                          if (priorityA !== priorityB) return priorityA - priorityB;
                          return b.coverage - a.coverage;
                        });

                      return (
                        <Card key={phase} className={styles.cardBorder}>
                          <CardHeader className={styles.headerBg}>
                            <CardTitle className="text-xl flex items-center gap-3">
                              {icon}
                              {title}
                              <Badge variant="outline" className="ml-auto">
                                {uniqueMitigations.length} mitigations
                              </Badge>
                            </CardTitle>
                            <CardDescription className="text-sm mt-2">
                              {description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="p-6">
                            {uniqueMitigations.length > 0 ? (
                              <div className="space-y-3">
                                {uniqueMitigations.map((mRec) => (
                                  <div key={mRec.mitigation.id} className={`flex items-center gap-4 p-4 ${styles.mitigationBg}`}>
                                    <Badge variant="outline" className="text-xs font-mono min-w-[50px] justify-center">
                                      {mRec.mitigation.id}
                                    </Badge>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold text-sm text-gray-900 mb-1">
                                        {mRec.mitigation.name}
                                      </h4>
                                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                        {mRec.mitigation.description}
                                      </p>
                                      <div className="flex items-center gap-3 text-xs text-gray-500">
                                        <span>🎯 {mRec.threatsAddressed.length} threats</span>
                                        <span>📊 {Math.round(mRec.coverage * 100)}% coverage</span>
                                        {mRec.mitigation.effort && (
                                          <span className="flex items-center gap-1">
                                            {getEffortIcon(mRec.mitigation.effort)}
                                            {mRec.mitigation.effort} effort
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    {mRec.mitigation.priority && (
                                      <Badge 
                                        className={
                                          mRec.mitigation.priority === "high" ? "bg-red-100 text-red-700 border-red-300" : 
                                          mRec.mitigation.priority === "medium" ? "bg-yellow-100 text-yellow-700 border-yellow-300" : 
                                          "bg-green-100 text-green-700 border-green-300"
                                        }
                                      >
                                        {mRec.mitigation.priority} priority
                                      </Badge>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8 text-gray-500">
                                <div className={`w-12 h-12 mx-auto mb-3 rounded-full ${styles.emptyStateBg} flex items-center justify-center`}>
                                  {React.cloneElement(icon, { className: styles.emptyStateIcon })}
                                </div>
                                <p className="text-sm font-medium mb-1">No additional mitigations recommended</p>
                                <p className="text-xs">
                                  {phase === "design" && "Your architecture and component selection don't require additional design-phase mitigations."}
                                  {phase === "build" && "No specific build-phase security controls are needed based on your current setup."}
                                  {phase === "operation" && "Your operational security appears to be well-covered by selected mitigations."}
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between bg-gray-50 border-t p-6">
          {step > 1 ? (
            <Button variant="outline" onClick={handleBack} className="flex items-center gap-2">
              ← Back
            </Button>
          ) : <div />}
          
          {step === MAX_STEPS ? (
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => typeof window !== 'undefined' && window.print()}>
                📄 Export Report
              </Button>
              <Button onClick={handleReset}>
                🔄 New Assessment
              </Button>
            </div>
          ) : (
            <Button 
              onClick={handleNext}
              disabled={
                (step === 1 && !architecture) || 
                (step === 2 && selectedComponents.length === 0)
              }
              className="flex items-center gap-2"
            >
              {step === MAX_STEPS - 1 ? "🔍 Generate Assessment" : "Next →"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default AssessmentTool;


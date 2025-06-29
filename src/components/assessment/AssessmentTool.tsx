import React, { useState, useCallback } from "react";
import { frameworkData, type ComponentNode } from "../components/frameworkData";
import { threatsData, mitigationsData, type Threat as SecurityThreat, type Mitigation as SecurityMitigation } from "../components/securityData";

// Import proper UI components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Import icons from lucide-react
import { 
  CheckCircle, 
  AlertTriangle, 
  Shield, 
  Clock, 
  Info, 
  ChevronRight, 
  AlertCircle, 
  Target, 
  Layers, 
  Activity,
  Brain,
  Database,
  Zap,
  Network,
  Eye,
  Lock
} from "lucide-react";

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
  const convertNode = (node: ComponentNode): HierarchicalComponentOption => {
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
  }, [getRelevantThreats, selectedMitigations]);
  
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
                ? "border-primary ring-2 ring-primary/40 bg-primary/20 shadow-lg text-primary"
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
                <h4 className={`font-medium text-sm ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`}>{option.name}</h4>
                <p className={`text-xs mt-0.5 line-clamp-2 ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{option.description}</p>
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
    <div className="w-full max-w-7xl mx-auto p-6 bg-background min-h-screen">
      <Card className="w-full shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700">
          <CardTitle className="text-3xl font-bold text-white">OWASP Agentic AI Security Assessment</CardTitle>
          <CardDescription className="text-blue-50 text-base drop-shadow font-medium">
            Identify security threats and controls for your agentic AI architecture based on the OWASP Securing Agentic Applications guide.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {/* Improved Stepper - Sticky */}
          <div className="sticky top-0 z-20 bg-muted border-b border-border px-6 py-4">
            <div className="mb-4">
              <div className="w-full h-3 rounded-full bg-muted">
                <div className="h-3 rounded-full bg-primary transition-all duration-300" style={{ width: `${(step / MAX_STEPS) * 100}%` }} />
              </div>
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
                        ? "bg-primary text-primary-foreground font-semibold" 
                        : isComplete
                        ? "bg-success/20 text-success hover:bg-success/10"
                        : isClickable
                        ? "bg-muted text-muted-foreground hover:bg-muted/80"
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-1 ${
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : isComplete
                        ? "bg-success text-success-foreground"
                        : "bg-muted text-muted-foreground"
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
                  <h3 className="text-2xl font-bold text-foreground mb-2">Select Your System's Architecture Pattern</h3>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Choose the architecture pattern that best describes your agentic AI system. This will help tailor the threat analysis to your specific setup.
                  </p>
                </div>
                <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {architectureOptions.map((option) => (
                    <Card 
                      key={option.id} 
                      className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
                        architecture === option.id 
                          ? "border-primary ring-2 ring-primary/40 bg-primary/20 shadow-lg text-primary" 
                          : "hover:shadow-lg hover:border-border border-border bg-muted text-foreground"
                      }`}
                      onClick={() => handleArchitectureSelect(option.id)}
                    >
                      <CardContent className="p-6 flex flex-col items-center text-center gap-4 h-full">
                        <div className={`rounded-full w-16 h-16 flex items-center justify-center border-2 transition-all ${
                          architecture === option.id 
                            ? "border-primary bg-primary/10 text-primary" 
                            : "border-border bg-muted text-muted-foreground"
                        }`}>
                          {React.cloneElement(option.icon, { className: "h-8 w-8" })}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-lg mb-2 text-foreground">{option.name}</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">{option.description}</p>
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
                  <h3 className="text-2xl font-bold text-foreground mb-2">Select Key System Components</h3>
                  <p className="text-muted-foreground max-w-3xl mx-auto">
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
                    <div key={topLevelComponent.id} className="bg-background rounded-lg border border-border p-1">
                      <div className="flex items-center gap-3 text-lg font-bold text-foreground mb-4 px-3 py-2 bg-muted rounded-lg border-b">
                        {getCategoryIcon(topLevelComponent.category)}
                        <span>{topLevelComponent.category}</span>
                        <div className="ml-auto text-sm font-normal text-muted-foreground">
                          {topLevelComponent.children?.length || 0} sub-components
                        </div>
                      </div>
                      <div className="space-y-3 px-2">
                        {/* Render the top-level component itself */}
                        <Card className="cursor-pointer transition-all duration-200">
                          <CardContent className="p-4 flex items-center gap-3">
                            <h4 className="font-bold text-base text-foreground">{topLevelComponent.name}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">{topLevelComponent.description}</p>
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
                  <h3 className="text-2xl font-bold text-foreground mb-2">Select Implemented Mitigations</h3>
                  <p className="text-muted-foreground max-w-3xl mx-auto">
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
                          ? "border-primary ring-2 ring-primary/40 bg-primary/10 shadow-lg text-primary" 
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
                          <h4 className={`font-semibold text-sm mb-1 ${selectedMitigations.includes(mitigation.id as MitigationCode) ? 'text-primary' : 'text-foreground'}`}>{mitigation.name} <span className={`text-xs font-normal ml-1 ${selectedMitigations.includes(mitigation.id as MitigationCode) ? 'text-primary/80' : 'text-muted-foreground'}`}>({mitigation.id})</span></h4>
                          <p className={`text-xs mb-3 line-clamp-3 ${selectedMitigations.includes(mitigation.id as MitigationCode) ? 'text-primary/90' : 'text-muted-foreground'}`}>{mitigation.description}</p>
                          <div className="flex gap-2 flex-wrap">
                            {mitigation.effort && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                                      {getEffortIcon(mitigation.effort)}
                                      {mitigation.effort}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Implementation effort: {mitigation.effort}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            {mitigation.priority && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge 
                                      variant={mitigation.priority === "high" ? "destructive" : "secondary"} 
                                      className="text-xs"
                                    >
                                      {mitigation.priority} priority
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Priority level: {mitigation.priority}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
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
                  <CardContent className="bg-muted">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                      <div className="text-center p-6 rounded-xl bg-background shadow-sm border border-border">
                        <div className={`text-6xl font-bold mb-2 ${getScoreColor(calculateSecurityScore())}`}>
                          {calculateSecurityScore()}<span className="text-3xl">%</span>
                        </div>
                        <div className="text-sm font-medium text-muted-foreground">Overall Security Score</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {calculateSecurityScore() >= 80 ? "Excellent" : 
                           calculateSecurityScore() >= 60 ? "Good" :
                           calculateSecurityScore() >= 40 ? "Needs Improvement" : "Critical"}
                        </div>
                      </div>
                      <div className="text-center p-6 rounded-xl bg-background shadow-sm border border-border">
                        <div className="text-6xl font-bold text-red-500 mb-2">
                          {getRelevantThreats().filter(t => !t.isUserMitigated && (t.residualRiskLevel === "critical" || t.residualRiskLevel === "high")).length}
                        </div>
                        <div className="text-sm font-medium text-muted-foreground">Unmitigated High/Critical Risks</div>
                        <div className="text-xs text-muted-foreground mt-1">Require immediate attention</div>
                      </div>
                      <div className="text-center p-6 rounded-xl bg-background shadow-sm border border-border">
                        <div className="text-6xl font-bold text-blue-500 mb-2">
                          {getRecommendedMitigations().filter(m => m.mitigation.priority === "high").length}
                        </div>
                        <div className="text-sm font-medium text-muted-foreground">High Priority Recommendations</div>
                        <div className="text-xs text-muted-foreground mt-1">Recommended for implementation</div>
                      </div>
                    </div>
                    
                                        <div className="bg-muted p-4 rounded-lg border space-y-2 text-sm">
                      <div><span className="font-semibold text-foreground">Architecture:</span> {architectureOptions.find(a => a.id === architecture)?.name}</div>
                      <div><span className="font-semibold text-foreground">Components:</span> {selectedComponents.length > 0 ? selectedComponents.map(cId => getComponentByIdFlat(cId)?.name || cId).join(", ") : "None"}</div>
                      <div><span className="font-semibold text-foreground">Implemented Mitigations:</span> {selectedMitigations.length > 0 ? selectedMitigations.map(mCode => mitigationData[mCode]?.id).join(", ") : "None"}</div>
                  </div>
                  </CardContent>
                </Card>

                {/* Improved Tabs with sticky header */}
                <Tabs defaultValue="threats" className="w-full">
                  <div className="sticky top-[140px] z-10 bg-muted border-b border-border pb-0 mb-6">
                    <TabsList className="grid w-full grid-cols-3 bg-background p-1 rounded-lg">
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
                    <Alert className="border-orange-200 bg-muted">
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
                            <div className="space-y-4 text-sm text-foreground bg-background">
                              <p className="leading-relaxed text-foreground">{assessment.threat.description}</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <p className="font-semibold mb-2 text-foreground">Risk Assessment:</p>
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
                                        <Badge variant="outline" className="text-foreground">{assessment.threat.architectureRisk[architecture]?.toUpperCase() || 'N/A'}</Badge>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {assessment.threat.affectedComponents && assessment.threat.affectedComponents.length > 0 && (
                                  <div>
                                    <p className="font-semibold mb-2 text-foreground">Affected Components:</p>
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
                                  <p className="font-semibold mb-2 text-foreground">Attack Vectors:</p>
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
                                <p className="font-semibold mb-2 text-foreground">Available Mitigations ({assessment.mitigations.length}):</p>
                                <div className="flex gap-1 flex-wrap">
                                  {assessment.mitigations.map(mCode => (
                                    <Badge 
                                      key={mCode} 
                                      variant="outline" 
                                      className={`text-xs ${selectedMitigations.includes(mCode) ? 'bg-green-100 text-green-700 border-green-400' : 'bg-muted text-foreground border-border'}`}
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
                    <Alert className="border-blue-200 bg-muted">
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
                                      <div className="text-xs space-y-3 bg-muted p-3 rounded-lg">
                                        <div>
                                          <strong className="text-purple-700">Design Phase:</strong>
                                          <pre className="whitespace-pre-wrap text-foreground bg-background p-2 rounded text-xs mt-1 border border-border">
                                            {rec.mitigation.implementationDetail.design || "N/A"}
                                          </pre>
                                        </div>
                                        <div>
                                          <strong className="text-indigo-700">Build Phase:</strong>
                                          <pre className="whitespace-pre-wrap text-foreground bg-background p-2 rounded text-xs mt-1 border border-border">
                                            {rec.mitigation.implementationDetail.build || "N/A"}
                                          </pre>
                                        </div>
                                        <div>
                                          <strong className="text-teal-700">Operations Phase:</strong>
                                          <pre className="whitespace-pre-wrap text-foreground bg-background p-2 rounded text-xs mt-1 border border-border">
                                            {rec.mitigation.implementationDetail.operations || "N/A"}
                                          </pre>
                                        </div>
                                        <div>
                                          <strong className="text-gray-700">Tools & Frameworks:</strong>
                                          <pre className="whitespace-pre-wrap text-foreground bg-background p-2 rounded text-xs mt-1 border border-border">
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
                      <div className="text-center py-12 bg-muted border border-green-200 rounded-lg">
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
                    <Alert className="border-purple-200 bg-muted">
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
        <CardFooter className="flex justify-between bg-muted border-t p-6">
          {step > 1 ? (
            <Button variant="outline" onClick={handleBack} className="flex items-center gap-2 border-border bg-background text-foreground hover:bg-muted">
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
              className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
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


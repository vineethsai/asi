import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  CheckCircle, 
  AlertTriangle, 
  Shield, 
  Clock, 
  DollarSign, 
  Info,
  ChevronRight,
  AlertCircle,
  Target,
  Layers,
  Activity 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Complete threat data from OWASP guide
const threatData = {
  T1: {
    code: "T1",
    name: "Memory Poisoning",
    category: "Memory",
    description: "Attackers inject malicious data into the agent's memory to manipulate future decisions",
    impact: "high",
    components: ["kc4"],
    architectureRisk: {
      sequential: "medium",
      hierarchical: "high",
      collaborative: "high"
    }
  },
  T2: {
    code: "T2",
    name: "Tool Misuse",
    category: "Tool",
    description: "Manipulation of tools, APIs, or environment access to perform unintended actions",
    impact: "high",
    components: ["kc5", "kc6"],
    architectureRisk: {
      sequential: "medium",
      hierarchical: "high",
      collaborative: "high"
    }
  },
  T3: {
    code: "T3",
    name: "Privilege Compromise",
    category: "Access",
    description: "Breaking information system boundaries through context collapse or tool privilege exploitation",
    impact: "high",
    components: ["kc4", "kc5", "kc6"],
    architectureRisk: {
      sequential: "low",
      hierarchical: "high",
      collaborative: "medium"
    }
  },
  T4: {
    code: "T4",
    name: "Resource Overload",
    category: "Availability",
    description: "Overwhelming external services through excessive API calls or resource consumption",
    impact: "medium",
    components: ["kc6"],
    architectureRisk: {
      sequential: "low",
      hierarchical: "medium",
      collaborative: "high"
    }
  },
  T5: {
    code: "T5",
    name: "Cascading Hallucination",
    category: "Integrity",
    description: "Foundation models generate incorrect information that propagates through the system",
    impact: "medium",
    components: ["kc1", "kc3", "kc4"],
    architectureRisk: {
      sequential: "high",
      hierarchical: "medium",
      collaborative: "medium"
    }
  },
  T6: {
    code: "T6",
    name: "Intent Breaking & Goal Manipulation",
    category: "Control",
    description: "Attacks that manipulate the agent's core decision-making to achieve unauthorized goals",
    impact: "high",
    components: ["kc1", "kc2", "kc3", "kc4", "kc5"],
    architectureRisk: {
      sequential: "high",
      hierarchical: "high",
      collaborative: "high"
    }
  },
  T7: {
    code: "T7",
    name: "Misaligned Behaviors",
    category: "Alignment",
    description: "Model alignment issues leading to unintended behaviors impacting users or organizations",
    impact: "medium",
    components: ["kc1", "kc3", "kc5"],
    architectureRisk: {
      sequential: "high",
      hierarchical: "medium",
      collaborative: "medium"
    }
  },
  T8: {
    code: "T8",
    name: "Repudiation",
    category: "Accountability",
    description: "Making agent actions difficult to trace through workflow manipulation or evidence tampering",
    impact: "medium",
    components: ["kc2", "kc3", "kc4", "kc5"],
    architectureRisk: {
      sequential: "low",
      hierarchical: "medium",
      collaborative: "high"
    }
  },
  T9: {
    code: "T9",
    name: "Identity Spoofing",
    category: "Authentication",
    description: "Impersonating trusted agents or entities in multi-agent systems",
    impact: "high",
    components: ["kc2"],
    architectureRisk: {
      sequential: "low",
      hierarchical: "high",
      collaborative: "high"
    }
  },
  T10: {
    code: "T10",
    name: "Overwhelming HITL",
    category: "Human Factors",
    description: "Bypassing human oversight by creating excessive activity requiring approval",
    impact: "medium",
    components: ["kc2", "kc6"],
    architectureRisk: {
      sequential: "low",
      hierarchical: "high",
      collaborative: "medium"
    }
  },
  T11: {
    code: "T11",
    name: "Unexpected RCE",
    category: "Execution",
    description: "Tools or environments enabling unexpected code execution",
    impact: "high",
    components: ["kc5", "kc6"],
    architectureRisk: {
      sequential: "medium",
      hierarchical: "high",
      collaborative: "high"
    }
  },
  T12: {
    code: "T12",
    name: "Communication Poisoning",
    category: "Communication",
    description: "Injection of malicious data into inter-agent communication channels",
    impact: "medium",
    components: ["kc2", "kc4", "kc6"],
    architectureRisk: {
      sequential: "low",
      hierarchical: "high",
      collaborative: "high"
    }
  },
  T13: {
    code: "T13",
    name: "Rogue Agents",
    category: "Control",
    description: "Compromised AI agent activity outside monitoring limits or orchestration",
    impact: "high",
    components: ["kc2", "kc6"],
    architectureRisk: {
      sequential: "low",
      hierarchical: "high",
      collaborative: "high"
    }
  },
  T14: {
    code: "T14",
    name: "Human Attacks",
    category: "Human Factors",
    description: "Exploits trust relationships between agents and workflows to manipulate humans",
    impact: "medium",
    components: ["kc2"],
    architectureRisk: {
      sequential: "low",
      hierarchical: "medium",
      collaborative: "medium"
    }
  },
  T15: {
    code: "T15",
    name: "Human Manipulation",
    category: "Trust",
    description: "Models exploit human trust to manipulate users through reasoning or operational access",
    impact: "high",
    components: ["kc1", "kc3", "kc6"],
    architectureRisk: {
      sequential: "medium",
      hierarchical: "high",
      collaborative: "high"
    }
  }
};

// Complete mitigation data from OWASP guide
const mitigationData = {
  M1: {
    code: "M1",
    name: "Memory Validation & Sanitization",
    description: "Implement validation and sanitization for all memory types",
    threats: ["T1", "T3", "T5", "T12"],
    components: ["kc4"],
    effort: "medium",
    phases: ["design", "build", "operation"],
    priority: "high"
  },
  M2: {
    code: "M2",
    name: "Tool Sandboxing & Isolation",
    description: "Run tools in isolated environments with strict resource limitations",
    threats: ["T2", "T3", "T11"],
    components: ["kc5", "kc6"],
    effort: "high",
    phases: ["design", "build", "operation"],
    priority: "high"
  },
  M3: {
    code: "M3",
    name: "Secure Inter-Agent Communication",
    description: "Implement cryptographically secure communication channels",
    threats: ["T9", "T12", "T13"],
    components: ["kc2"],
    effort: "medium",
    phases: ["design", "build"],
    priority: "high"
  },
  M4: {
    code: "M4",
    name: "Prompt Hardening & Jailbreak Prevention",
    description: "Implement structural defenses and behavioral constraints in prompts",
    threats: ["T5", "T6", "T7", "T15"],
    components: ["kc1"],
    effort: "low",
    phases: ["design"],
    priority: "high"
  },
  M5: {
    code: "M5",
    name: "Multi-Stage Reasoning Validation",
    description: "Validate agent reasoning processes at multiple checkpoints",
    threats: ["T5", "T6", "T7"],
    components: ["kc3"],
    effort: "medium",
    phases: ["design", "operation"],
    priority: "medium"
  },
  M6: {
    code: "M6",
    name: "Comprehensive Security Monitoring",
    description: "End-to-end observability with security-focused monitoring",
    threats: ["T8", "T13", "T14"],
    components: ["kc2", "kc6"],
    effort: "medium",
    phases: ["build", "operation"],
    priority: "high"
  },
  M7: {
    code: "M7",
    name: "Zero Trust & Least Privilege",
    description: "Fine-grained access controls with continuous verification",
    threats: ["T2", "T3", "T11"],
    components: ["kc5", "kc6"],
    effort: "high",
    phases: ["design", "build"],
    priority: "high"
  },
  M8: {
    code: "M8",
    name: "Adaptive Human-in-the-Loop Controls",
    description: "Intelligent human oversight with risk-based approval workflows",
    threats: ["T10", "T14", "T15"],
    components: ["kc2", "kc6"],
    effort: "medium",
    phases: ["design", "operation"],
    priority: "medium"
  },
  M9: {
    code: "M9",
    name: "Resource Management & Rate Limiting",
    description: "Multi-layer resource controls with intelligent quotas",
    threats: ["T4"],
    components: ["kc6"],
    effort: "low",
    phases: ["build", "operation"],
    priority: "medium"
  },
  M10: {
    code: "M10",
    name: "Defense-in-Depth Architecture",
    description: "Multiple security layers with clear trust boundaries",
    threats: ["T3", "T9", "T12", "T13"],
    components: ["kc2", "kc4", "kc5", "kc6"],
    effort: "high",
    phases: ["design", "build"],
    priority: "high"
  },
  M11: {
    code: "M11",
    name: "Content Security & Output Filtering",
    description: "Comprehensive filtering and validation of agent outputs",
    threats: ["T5", "T7", "T15"],
    components: ["kc1", "kc3"],
    effort: "medium",
    phases: ["design", "build", "operation"],
    priority: "medium"
  },
  M12: {
    code: "M12",
    name: "Secure Development Lifecycle",
    description: "Embed security throughout the development lifecycle",
    threats: ["T1", "T2", "T3", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12", "T13", "T14", "T15"],
    components: ["kc1", "kc2", "kc3", "kc4", "kc5", "kc6"],
    effort: "high",
    phases: ["design", "build", "operation"],
    priority: "high"
  }
};

// Types
type ThreatCode = keyof typeof threatData;
type MitigationCode = keyof typeof mitigationData;
type RiskLevel = "low" | "medium" | "high" | "critical";
type Phase = "design" | "build" | "operation";

interface ThreatAssessment {
  threat: typeof threatData[ThreatCode];
  riskLevel: RiskLevel;
  mitigations: MitigationCode[];
}

interface MitigationRecommendation {
  mitigation: typeof mitigationData[MitigationCode];
  coverage: number;
  threatsAddressed: ThreatCode[];
}

export const AssessmentTool = () => {
  const [architecture, setArchitecture] = useState<string>("");
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const [step, setStep] = useState<number>(1);
  const [showResults, setShowResults] = useState<boolean>(false);

  const architectureOptions = [
    {
      id: "sequential",
      name: "Sequential Agent Architecture",
      description: "Linear flow with a single agent processing tasks sequentially",
      icon: <ChevronRight className="h-5 w-5" />
    },
    {
      id: "hierarchical", 
      name: "Hierarchical Agent Architecture",
      description: "Orchestrator coordinates multiple specialized sub-agents",
      icon: <Layers className="h-5 w-5" />
    },
    {
      id: "collaborative",
      name: "Collaborative Agent Swarm",
      description: "Peer-based agents working together with shared context",
      icon: <Activity className="h-5 w-5" />
    }
  ];

  const componentOptions = [
    { 
      id: "kc1", 
      name: "Language Models (KC1)", 
      description: "Foundation models with text or multimodal capabilities",
      category: "Core"
    },
    { 
      id: "kc2", 
      name: "Orchestration (KC2)", 
      description: "Components that coordinate agent workflows",
      category: "Control"
    },
    { 
      id: "kc3", 
      name: "Reasoning/Planning (KC3)", 
      description: "Components that implement reasoning paradigms",
      category: "Core"
    },
    { 
      id: "kc4", 
      name: "Memory Modules (KC4)", 
      description: "Various memory types for persistent state",
      category: "Data"
    },
    { 
      id: "kc5", 
      name: "Tool Integration (KC5)", 
      description: "External tool access and capability extensions",
      category: "Integration"
    },
    { 
      id: "kc6", 
      name: "Operational Environment (KC6)", 
      description: "Runtime environment and execution context",
      category: "Infrastructure"
    }
  ];

  // Calculate risk score based on architecture and components
  const calculateRiskScore = (threat: typeof threatData[ThreatCode]): RiskLevel => {
    const archRisk = threat.architectureRisk[architecture as keyof typeof threat.architectureRisk] || "medium";
    const hasAllComponents = threat.components.every(c => selectedComponents.includes(c));
    
    if (threat.impact === "high" && archRisk === "high" && hasAllComponents) return "critical";
    if (threat.impact === "high" || (archRisk === "high" && hasAllComponents)) return "high";
    if (archRisk === "low" && !hasAllComponents) return "low";
    return "medium";
  };

  // Get relevant threats based on selected components and architecture
  const getRelevantThreats = (): ThreatAssessment[] => {
    return Object.entries(threatData)
      .filter(([_, threat]) => 
        threat.components.some(c => selectedComponents.includes(c))
      )
      .map(([code, threat]) => {
        const riskLevel = calculateRiskScore(threat);
        const mitigations = Object.entries(mitigationData)
          .filter(([_, m]) => m.threats.includes(code))
          .map(([mCode]) => mCode as MitigationCode);
        
        return {
          threat,
          riskLevel,
          mitigations
        };
      })
      .sort((a, b) => {
        const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
      });
  };

  // Get recommended mitigations sorted by coverage
  const getRecommendedMitigations = (): MitigationRecommendation[] => {
    const relevantThreats = getRelevantThreats();
    const threatCodes = relevantThreats.map(t => t.threat.code);
    
    return Object.entries(mitigationData)
      .map(([code, mitigation]) => {
        const threatsAddressed = mitigation.threats.filter(t => 
          threatCodes.includes(t as ThreatCode)
        ) as ThreatCode[];
        
        const coverage = threatsAddressed.length / Math.max(threatCodes.length, 1);
        const hasRelevantComponents = mitigation.components.some(c => 
          selectedComponents.includes(c)
        );
        
        return {
          mitigation,
          coverage: hasRelevantComponents ? coverage : coverage * 0.5,
          threatsAddressed
        };
      })
      .filter(m => m.coverage > 0)
      .sort((a, b) => b.coverage - a.coverage);
  };

  // Calculate overall security score
  const calculateSecurityScore = () => {
    const threats = getRelevantThreats();
    const mitigations = getRecommendedMitigations();
    
    if (threats.length === 0) return 100;
    
    // Calculate weighted risk score
    const riskWeights = { critical: 4, high: 3, medium: 2, low: 1 };
    const totalRiskWeight = threats.reduce((sum, t) => sum + riskWeights[t.riskLevel], 0);
    const maxPossibleRisk = threats.length * 4; // If all were critical
    
    // Calculate mitigation effectiveness (how well mitigations cover threats)
    const avgCoverage = mitigations.length > 0 
      ? mitigations.reduce((sum, m) => sum + m.coverage, 0) / mitigations.length 
      : 0;
    
    // Base score from risk level (0-70 range)
    const riskScore = 70 * (1 - totalRiskWeight / maxPossibleRisk);
    
    // Bonus for having mitigations (0-30 range)
    const mitigationBonus = 30 * avgCoverage;
    
    return Math.round(riskScore + mitigationBonus);
  };

  // Get implementation roadmap
  const getImplementationRoadmap = () => {
    const mitigations = getRecommendedMitigations();
    const phases: Record<Phase, MitigationRecommendation[]> = {
      design: [],
      build: [],
      operation: []
    };
    
    mitigations.forEach(m => {
      m.mitigation.phases.forEach(phase => {
        phases[phase as Phase].push(m);
      });
    });
    
    return phases;
  };

  const handleArchitectureSelect = (id: string) => {
    setArchitecture(id);
  };

  const handleComponentToggle = (id: string) => {
    setSelectedComponents(prev => 
      prev.includes(id) 
        ? prev.filter(c => c !== id)
        : [...prev, id]
    );
  };

  const handleNext = () => {
    if (step === 1 && architecture) {
      setStep(2);
    } else if (step === 2 && selectedComponents.length > 0) {
      setStep(3);
      setShowResults(true);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else if (step === 3) {
      setStep(2);
      setShowResults(false);
    }
  };

  const handleReset = () => {
    setArchitecture("");
    setSelectedComponents([]);
    setStep(1);
    setShowResults(false);
  };

  const getRiskBadgeColor = (level: RiskLevel) => {
    switch(level) {
      case "critical":
        return "bg-red-600 text-white";
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const getEffortIcon = (effort: string) => {
    switch(effort) {
      case "low":
        return <Clock className="h-4 w-4 text-green-600" />;
      case "medium":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "high":
        return <Clock className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch(category) {
      case "Core":
        return <Target className="h-4 w-4" />;
      case "Control":
        return <Layers className="h-4 w-4" />;
      case "Data":
        return <AlertCircle className="h-4 w-4" />;
      case "Integration":
        return <Activity className="h-4 w-4" />;
      case "Infrastructure":
        return <Shield className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">OWASP Agentic AI Security Assessment</CardTitle>
          <CardDescription>
            Identify security threats and controls for your agentic AI architecture based on the OWASP Securing Agentic Applications guide
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Progress indicator */}
          <div className="mb-6">
            <Progress value={(step / 3) * 100} className="h-2" />
            <div className="flex justify-between mt-2 text-sm text-muted-foreground">
              <span className={step >= 1 ? "text-primary font-medium" : ""}>Architecture</span>
              <span className={step >= 2 ? "text-primary font-medium" : ""}>Components</span>
              <span className={step >= 3 ? "text-primary font-medium" : ""}>Assessment</span>
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Step 1: Select Architecture Pattern</h3>
              <div className="grid gap-4">
                {architectureOptions.map((option) => (
                  <Card 
                    key={option.id} 
                    className={`cursor-pointer transition-all ${
                      architecture === option.id 
                        ? "border-primary bg-primary/5 shadow-md" 
                        : "hover:border-primary/50 hover:shadow-sm"
                    }`}
                    onClick={() => handleArchitectureSelect(option.id)}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={`rounded-full w-10 h-10 flex items-center justify-center border-2 ${
                        architecture === option.id 
                          ? "border-primary bg-primary text-white" 
                          : "border-muted-foreground bg-muted"
                      }`}>
                        {architecture === option.id ? <CheckCircle className="h-6 w-6" /> : option.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-lg">{option.name}</h4>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Step 2: Select System Components</h3>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Select all components that will be part of your agentic system. This will determine which threats and mitigations are relevant.
                </AlertDescription>
              </Alert>
              <div className="grid gap-3">
                {Object.entries(
                  componentOptions.reduce((acc, comp) => {
                    if (!acc[comp.category]) acc[comp.category] = [];
                    acc[comp.category].push(comp);
                    return acc;
                  }, {} as Record<string, typeof componentOptions>)
                ).map(([category, components]) => (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      {getCategoryIcon(category)}
                      <span>{category}</span>
                    </div>
                    {components.map((option) => (
                      <Card 
                        key={option.id} 
                        className={`cursor-pointer transition-all ml-6 ${
                          selectedComponents.includes(option.id) 
                            ? "border-primary bg-primary/5 shadow-sm" 
                            : "hover:border-primary/50"
                        }`}
                        onClick={() => handleComponentToggle(option.id)}
                      >
                        <CardContent className="p-3 flex items-center gap-3">
                          <div className={`rounded-full w-6 h-6 flex items-center justify-center border ${
                            selectedComponents.includes(option.id) 
                              ? "border-primary bg-primary text-white" 
                              : "border-muted-foreground"
                          }`}>
                            {selectedComponents.includes(option.id) && <CheckCircle className="h-4 w-4" />}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{option.name}</h4>
                            <p className="text-sm text-muted-foreground">{option.description}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {step === 3 && showResults && (
            <div className="space-y-6">
              {/* Security Score Overview */}
              <Card className="border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl">Security Assessment Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className={`text-4xl font-bold ${getScoreColor(calculateSecurityScore())}`}>
                        {calculateSecurityScore()}
                      </div>
                      <div className="text-sm text-muted-foreground">Security Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-red-600">
                        {getRelevantThreats().filter(t => t.riskLevel === "critical" || t.riskLevel === "high").length}
                      </div>
                      <div className="text-sm text-muted-foreground">High Risk Threats</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-blue-600">
                        {getRecommendedMitigations().filter(m => m.coverage > 0.5).length}
                      </div>
                      <div className="text-sm text-muted-foreground">Key Mitigations</div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm">
                      <span className="font-medium">Architecture:</span> {architectureOptions.find(a => a.id === architecture)?.name}
                    </p>
                    <p className="text-sm mt-1">
                      <span className="font-medium">Components:</span> {selectedComponents.map(c => 
                        componentOptions.find(co => co.id === c)?.name.split(' ')[0]
                      ).join(", ")}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Results Tabs */}
              <Tabs defaultValue="threats" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="threats">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Threats ({getRelevantThreats().length})
                  </TabsTrigger>
                  <TabsTrigger value="mitigations">
                    <Shield className="h-4 w-4 mr-2" />
                    Mitigations ({getRecommendedMitigations().length})
                  </TabsTrigger>
                  <TabsTrigger value="roadmap">
                    <Clock className="h-4 w-4 mr-2" />
                    Roadmap
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="threats" className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Threat Analysis</AlertTitle>
                    <AlertDescription>
                      Based on your architecture and components, we've identified {getRelevantThreats().length} relevant threats.
                      Focus on addressing critical and high-risk threats first.
                    </AlertDescription>
                  </Alert>
                  
                  <Accordion type="single" collapsible className="w-full">
                    {getRelevantThreats().map((assessment, index) => (
                      <AccordionItem key={index} value={assessment.threat.code}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-3 text-left flex-1">
                            <Badge className={`${getRiskBadgeColor(assessment.riskLevel)} min-w-[80px] justify-center`}>
                              {assessment.riskLevel.toUpperCase()}
                            </Badge>
                            <div>
                              <span className="font-medium">{assessment.threat.code}: {assessment.threat.name}</span>
                              <Badge variant="outline" className="ml-2 text-xs">{assessment.threat.category}</Badge>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="pt-2 pb-4 space-y-3">
                            <p className="text-muted-foreground">{assessment.threat.description}</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm font-medium mb-1">Impact Level</p>
                                <Badge variant="outline" 
                                  className={assessment.threat.impact === "high" ? "border-red-500 text-red-700" : 
                                           assessment.threat.impact === "medium" ? "border-yellow-500 text-yellow-700" : 
                                           "border-green-500 text-green-700"}>
                                  {assessment.threat.impact.toUpperCase()}
                                </Badge>
                              </div>
                              <div>
                                <p className="text-sm font-medium mb-1">Architecture Risk</p>
                                <Badge variant="outline">
                                  {assessment.threat.architectureRisk[architecture as keyof typeof assessment.threat.architectureRisk]?.toUpperCase()}
                                </Badge>
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-sm font-medium mb-1">Affected Components</p>
                              <div className="flex gap-2 flex-wrap">
                                {assessment.threat.components.map(c => (
                                  <Badge key={c} variant="secondary">
                                    {componentOptions.find(co => co.id === c)?.name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-sm font-medium mb-1">Recommended Mitigations</p>
                              <div className="flex gap-2 flex-wrap">
                                {assessment.mitigations.map(m => (
                                  <Badge key={m} variant="outline" className="bg-blue-50 dark:bg-blue-950">
                                    {m}: {mitigationData[m].name}
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
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertTitle>Mitigation Strategy</AlertTitle>
                    <AlertDescription>
                      Implement these controls to address the identified threats. Mitigations are sorted by coverage percentage.
                    </AlertDescription>
                  </Alert>
                  
                  <Accordion type="single" collapsible className="w-full">
                    {getRecommendedMitigations().map((rec, index) => (
                      <AccordionItem key={index} value={rec.mitigation.code}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center gap-3 text-left flex-1">
                            <div className="min-w-[80px]">
                              <Progress value={rec.coverage * 100} className="h-2" />
                              <span className="text-xs text-muted-foreground">
                                {Math.round(rec.coverage * 100)}% coverage
                              </span>
                            </div>
                            <div className="flex items-center gap-2 flex-1">
                              <span className="font-medium">{rec.mitigation.code}: {rec.mitigation.name}</span>
                              {getEffortIcon(rec.mitigation.effort)}
                              <Badge variant="outline" className="ml-auto text-xs">
                                {rec.threatsAddressed.length} of {getRelevantThreats().length} threats
                              </Badge>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="pt-2 pb-4 space-y-3">
                            <p className="text-muted-foreground">{rec.mitigation.description}</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm font-medium mb-1">Implementation Effort</p>
                                <div className="flex items-center gap-2">
                                  {getEffortIcon(rec.mitigation.effort)}
                                  <span className="text-sm capitalize">{rec.mitigation.effort}</span>
                                </div>
                              </div>
                              <div>
                                <p className="text-sm font-medium mb-1">Priority</p>
                                <Badge variant={rec.mitigation.priority === "high" ? "destructive" : "secondary"}>
                                  {rec.mitigation.priority.toUpperCase()}
                                </Badge>
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-sm font-medium mb-1">Implementation Phases</p>
                              <div className="flex gap-2">
                                {rec.mitigation.phases.map(phase => (
                                  <Badge key={phase} variant="outline" className="capitalize">
                                    {phase}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-sm font-medium mb-1">Threats Addressed ({rec.threatsAddressed.length})</p>
                              <div className="flex gap-2 flex-wrap">
                                {rec.threatsAddressed.map(t => (
                                  <Badge key={t} variant="secondary">
                                    {t}: {threatData[t].name}
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

                <TabsContent value="roadmap" className="space-y-4">
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertTitle>Implementation Roadmap</AlertTitle>
                    <AlertDescription>
                      Follow this phased approach to implement security controls effectively.
                    </AlertDescription>
                  </Alert>
                  
                  {Object.entries(getImplementationRoadmap()).map(([phase, mitigations]) => (
                    <Card key={phase}>
                      <CardHeader>
                        <CardTitle className="text-lg capitalize flex items-center gap-2">
                          {phase === "design" && <Target className="h-5 w-5" />}
                          {phase === "build" && <Layers className="h-5 w-5" />}
                          {phase === "operation" && <Activity className="h-5 w-5" />}
                          {phase} Phase
                        </CardTitle>
                        <CardDescription>
                          {phase === "design" && "Architecture and security design decisions"}
                          {phase === "build" && "Implementation and development controls"}
                          {phase === "operation" && "Runtime monitoring and maintenance"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {mitigations
                            .filter((m, i, arr) => arr.findIndex(x => x.mitigation.code === m.mitigation.code) === i)
                            .slice(0, 5)
                            .map((m, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                              <div className="mt-1">
                                <Badge variant="outline">{m.mitigation.code}</Badge>
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-sm">{m.mitigation.name}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Addresses {m.threatsAddressed.length} threats • {m.mitigation.effort} effort
                                </p>
                              </div>
                              <Badge className={m.mitigation.priority === "high" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}>
                                {m.mitigation.priority}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {step > 1 ? (
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
          ) : (
            <div></div>
          )}
          
          {step === 3 ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => window.print()}>
                Export Report
              </Button>
              <Button onClick={handleReset}>
                New Assessment
              </Button>
            </div>
          ) : (
            <Button 
              onClick={handleNext}
              disabled={(step === 1 && !architecture) || (step === 2 && selectedComponents.length === 0)}
            >
              {step === 2 ? "Generate Assessment" : "Next"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default AssessmentTool;
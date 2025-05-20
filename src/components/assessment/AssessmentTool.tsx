
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
import { CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const AssessmentTool = () => {
  // Architecture type selection
  const [architecture, setArchitecture] = useState<string>("");
  // Component selections
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  // Step in the assessment process
  const [step, setStep] = useState<number>(1);
  // Whether results are shown
  const [showResults, setShowResults] = useState<boolean>(false);

  const architectureOptions = [
    {
      id: "sequential",
      name: "Sequential Agent Architecture",
      description: "Linear flow with a single agent processing tasks sequentially"
    },
    {
      id: "hierarchical", 
      name: "Hierarchical Agent Architecture",
      description: "Orchestrator coordinates multiple specialized sub-agents"
    },
    {
      id: "collaborative",
      name: "Collaborative Agent Swarm",
      description: "Peer-based agents working together with shared context"
    }
  ];

  const componentOptions = [
    { id: "kc1", name: "Language Models", description: "Foundation models with text or multimodal capabilities" },
    { id: "kc2", name: "Orchestration", description: "Components that coordinate agent workflows" },
    { id: "kc3", name: "Reasoning/Planning", description: "Components that implement reasoning paradigms" },
    { id: "kc4", name: "Memory Modules", description: "Various memory types for persistent state" },
    { id: "kc5", name: "Tool Integration", description: "External tool access and capability extensions" },
    { id: "kc6", name: "Operational Environment", description: "Runtime environment and execution context" }
  ];

  // Generate relevant threats based on selected components and architecture
  const getRelevantThreats = () => {
    const threats: {id: string; name: string; description: string; relevance: string; components: string[]}[] = [
      {
        id: "T1",
        name: "Memory Poisoning",
        description: "Manipulation of agent memory through direct or indirect means",
        relevance: "High",
        components: ["kc4"]
      },
      {
        id: "T2", 
        name: "Tool Misuse",
        description: "Exploitation of tools accessible to the agent for unintended purposes",
        relevance: selectedComponents.includes("kc5") ? "High" : "Medium",
        components: ["kc5", "kc6"]
      },
      {
        id: "T3",
        name: "Privilege Compromise",
        description: "Gaining unauthorized access to system resources",
        relevance: architecture === "hierarchical" ? "High" : "Medium",
        components: ["kc5", "kc6"]
      },
      {
        id: "T6",
        name: "Intent Breaking",
        description: "Subverting the agent's intended behavior pattern",
        relevance: "High",
        components: ["kc1", "kc2", "kc3"]
      },
      {
        id: "T12",
        name: "Communication Poisoning",
        description: "Manipulating inter-agent communications in multi-agent systems",
        relevance: architecture !== "sequential" ? "High" : "Low",
        components: ["kc2"]
      }
    ];

    return threats.filter(threat => 
      threat.components.some(c => selectedComponents.includes(c))
    ).sort((a, b) => {
      const relevanceOrder = { "High": 0, "Medium": 1, "Low": 2 };
      return relevanceOrder[a.relevance as keyof typeof relevanceOrder] - 
             relevanceOrder[b.relevance as keyof typeof relevanceOrder];
    });
  };

  // Generate security controls based on selected components, architecture, and threats
  const getRelevantControls = () => {
    const threats = getRelevantThreats();
    const threatIds = threats.map(t => t.id);
    
    const controls = [
      {
        id: "C1",
        name: "Memory Isolation",
        description: "Implement strict boundaries between different memory contexts",
        relevance: selectedComponents.includes("kc4") ? "High" : "Low",
        threats: ["T1"],
        implementation: "Use separate storage contexts for different types of agent state. Validate all memory write operations."
      },
      {
        id: "C2",
        name: "Tool Access Control",
        description: "Implement fine-grained permissions for tool access",
        relevance: selectedComponents.includes("kc5") ? "High" : "Low",
        threats: ["T2", "T3"],
        implementation: "Create capability-based security for tool access. Validate all tool calls against an allow-list."
      },
      {
        id: "C3",
        name: "Intent Verification",
        description: "Validate actions against the original intent before execution",
        relevance: "High",
        threats: ["T6"],
        implementation: "Add verification steps that confirm outputs align with user intent before executing actions."
      },
      {
        id: "C4",
        name: "Message Authentication",
        description: "Authenticate and validate inter-agent communications",
        relevance: architecture !== "sequential" ? "High" : "Low",
        threats: ["T12"],
        implementation: "Add cryptographic signatures to messages between agents and validate before processing."
      },
      {
        id: "C5",
        name: "Environment Sandboxing",
        description: "Isolate execution environments for agent operations",
        relevance: selectedComponents.includes("kc6") ? "High" : "Medium",
        threats: ["T2", "T3"],
        implementation: "Use containerization or VM isolation for agent execution environments."
      }
    ];

    return controls.filter(control => 
      control.threats.some(t => threatIds.includes(t))
    ).sort((a, b) => {
      const relevanceOrder = { "High": 0, "Medium": 1, "Low": 2 };
      return relevanceOrder[a.relevance as keyof typeof relevanceOrder] - 
             relevanceOrder[b.relevance as keyof typeof relevanceOrder];
    });
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

  const getBadgeColor = (relevance: string) => {
    switch(relevance) {
      case "High":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "Medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "Low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  return (
    <div className="w-full">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Architecture Security Assessment</CardTitle>
          <CardDescription>
            Identify security threats and controls for your agentic AI architecture
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Step 1: Select Architecture Pattern</h3>
              <div className="grid gap-4">
                {architectureOptions.map((option) => (
                  <Card 
                    key={option.id} 
                    className={`cursor-pointer transition-all ${
                      architecture === option.id 
                        ? "border-primary bg-primary/5" 
                        : "hover:border-primary/50"
                    }`}
                    onClick={() => handleArchitectureSelect(option.id)}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={`rounded-full w-6 h-6 flex items-center justify-center border ${
                        architecture === option.id 
                          ? "border-primary bg-primary text-white" 
                          : "border-muted-foreground"
                      }`}>
                        {architecture === option.id && <CheckCircle className="h-4 w-4" />}
                      </div>
                      <div>
                        <h4 className="font-medium">{option.name}</h4>
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
              <div className="grid gap-2">
                {componentOptions.map((option) => (
                  <Card 
                    key={option.id} 
                    className={`cursor-pointer transition-all ${
                      selectedComponents.includes(option.id) 
                        ? "border-primary bg-primary/5" 
                        : "hover:border-primary/50"
                    }`}
                    onClick={() => handleComponentToggle(option.id)}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={`rounded-full w-6 h-6 flex items-center justify-center border ${
                        selectedComponents.includes(option.id) 
                          ? "border-primary bg-primary text-white" 
                          : "border-muted-foreground"
                      }`}>
                        {selectedComponents.includes(option.id) && <CheckCircle className="h-4 w-4" />}
                      </div>
                      <div>
                        <h4 className="font-medium">{option.name}</h4>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          {step === 3 && showResults && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-xl font-medium">Assessment Results</h3>
                <div className="space-y-2">
                  <p className="text-muted-foreground">
                    Based on your {architectureOptions.find(a => a.id === architecture)?.name} 
                    architecture and selected components, here are the key security considerations:
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-medium">Relevant Threats</h4>
                <Accordion type="single" collapsible className="w-full">
                  {getRelevantThreats().map((threat, index) => (
                    <AccordionItem key={index} value={threat.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2 text-left">
                          <span>{threat.name}</span>
                          <Badge className={getBadgeColor(threat.relevance)}>{threat.relevance} Risk</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pt-2 pb-4 space-y-2">
                          <p>{threat.description}</p>
                          <div>
                            <span className="font-medium">Affected components:</span>{" "}
                            {threat.components.map(c => 
                              componentOptions.find(co => co.id === c)?.name
                            ).join(", ")}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-medium">Recommended Controls</h4>
                <Accordion type="single" collapsible className="w-full">
                  {getRelevantControls().map((control, index) => (
                    <AccordionItem key={index} value={control.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2 text-left">
                          <span>{control.name}</span>
                          <Badge className={getBadgeColor(control.relevance)}>{control.relevance} Priority</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pt-2 pb-4 space-y-2">
                          <p>{control.description}</p>
                          <div className="mt-2">
                            <div className="font-medium">Implementation:</div>
                            <div className="code-block mt-1">
                              {control.implementation}
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {step > 1 ? (
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
          ) : (
            <div></div> /* Empty div for spacing */
          )}
          
          {step === 3 ? (
            <Button onClick={handleReset}>
              Start New Assessment
            </Button>
          ) : (
            <Button 
              onClick={handleNext}
              disabled={(step === 1 && !architecture) || (step === 2 && selectedComponents.length === 0)}
            >
              {step === 2 ? "Generate Results" : "Next"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default AssessmentTool;

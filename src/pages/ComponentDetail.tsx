import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Shield, AlertTriangle, GitMerge, Wrench, Code, Database } from "lucide-react";
import { cn } from "@/lib/utils";
import { threatsData, mitigationsData, Threat, Mitigation } from "../components/components/securityData";

// Define the component data structure
type Component = {
  id: string;
  title: string;
  description: string;
  subComponents: Array<{
    id: string;
    title: string;
    description: string;
  }>;
  threatCodes: string[];
  controls: string[];
  relatedArchitectures: Array<{
    id: string;
    name: string;
    relevance: "primary" | "secondary";
  }>;
  relatedComponents: string[];
  color: string;
  securityImplications: string;
  implementationConsiderations: string;
};

// Enhanced component data from OWASP Agentic Applications guide
const componentsData: Record<string, Component> = {
  "kc1": {
    id: "kc1",
    title: "Language Models (KC1)",
    description: "The core cognitive engine or 'brain' of agentic systems, responsible for understanding, reasoning, planning, and generating responses.",
    subComponents: [
      {
        id: "kc1.1",
        title: "Large Language Models (LLMs)",
        description: "Pre-trained foundation models like GPT, Claude, and Llama series that serve as the core cognitive engine utilizing pre-trained parameters for reasoning, planning, and generation"
      },
      {
        id: "kc1.2",
        title: "Multimodal LLMs (MLLMs)",
        description: "Models capable of processing multiple data types beyond text (images, audio, video), enabling agents to perform tasks involving visual or auditory information"
      },
      {
        id: "kc1.3",
        title: "Small Language Models (SLMs)",
        description: "Models with fewer parameters, trained on smaller, focused datasets for specific tasks rather than general capabilities"
      },
      {
        id: "kc1.4",
        title: "Fine-tuned Models",
        description: "Models that undergo additional training on specific datasets to specialize capabilities for particular tasks, domains, or interaction styles"
      }
    ],
    threatCodes: ["T5", "T6", "T7", "T15"],
    controls: ["Prompt Hardening", "Input Sanitization", "Output Filtering", "Adversarial Training"],
    relatedArchitectures: [
      { id: "sequential", name: "Sequential Agent", relevance: "primary" },
      { id: "hierarchical", name: "Hierarchical", relevance: "primary" },
      { id: "collaborative", name: "Collaborative Swarm", relevance: "primary" }
    ],
    relatedComponents: ["kc3", "kc4"],
    color: "border-primary/30 bg-primary/5",
    securityImplications: "Foundation models can propagate hallucinations, be susceptible to intent manipulation, develop misaligned behaviors, and potentially manipulate human trust. Security controls must consider both the model's inherent capabilities and how it interfaces with other components.",
    implementationConsiderations: "Implementation should focus on robust prompt engineering with explicit boundaries, input validation, model alignment techniques, and monitoring for unexpected outputs or behaviors."
  },
  "kc2": {
    id: "kc2",
    title: "Orchestration (KC2)",
    description: "Control flow mechanisms that dictate the agent's behavior, information flow, and decision-making processes between components or agents.",
    subComponents: [
      {
        id: "kc2.1",
        title: "Workflows",
        description: "Structured, pre-defined sequences of tasks that agents follow to achieve goals, defining information flow and actions"
      },
      {
        id: "kc2.2",
        title: "Hierarchical Planning",
        description: "Orchestrator breaks down complex tasks and distributes them to specialized sub-agents, managing the overall process"
      },
      {
        id: "kc2.3",
        title: "Multi-agent Collaboration",
        description: "Multiple agents working together to achieve common goals, communicating and coordinating their actions, sharing information and resources"
      }
    ],
    threatCodes: ["T6", "T8", "T9", "T10", "T12", "T13", "T14"],
    controls: ["Communication Verification", "Intent Validation", "Agent Isolation", "Trust Boundaries"],
    relatedArchitectures: [
      { id: "hierarchical", name: "Hierarchical", relevance: "primary" },
      { id: "collaborative", name: "Collaborative Swarm", relevance: "primary" }
    ],
    relatedComponents: ["kc1", "kc3", "kc6"],
    color: "border-architecture/30 bg-architecture/5",
    securityImplications: "Orchestration mechanisms can be manipulated to achieve unauthorized goals, obscure actions, impersonate trusted entities, overwhelm human oversight, or corrupt inter-agent communications.",
    implementationConsiderations: "Secure implementation requires robust authentication and authorization between agents, validated communication protocols, auditable workflows, and defined trust boundaries."
  },
  "kc3": {
    id: "kc3",
    title: "Reasoning/Planning (KC3)",
    description: "Paradigms that enable AI agents to solve complex problems by breaking down tasks, making decisions, and forming plans.",
    subComponents: [
      {
        id: "kc3.1",
        title: "Structured Planning/Execution",
        description: "Formal task decomposition into sequences of actions, often with separate planner and executor components"
      },
      {
        id: "kc3.2",
        title: "ReAct (Reason + Act)",
        description: "Dynamically interleaves reasoning steps with actions and updates reasoning based on feedback"
      },
      {
        id: "kc3.3",
        title: "Chain of Thought (CoT)",
        description: "Enhances reasoning by prompting step-by-step thinking before arriving at actions or conclusions"
      },
      {
        id: "kc3.4",
        title: "Tree of Thoughts (ToT)",
        description: "Explores multiple reasoning paths in parallel with lookahead, backtracking, and self-evaluation"
      }
    ],
    threatCodes: ["T5", "T6", "T7", "T8", "T15"],
    controls: ["Reasoning Validation", "Goal Alignment Checks", "Logic Verification", "Transparent Decision Paths"],
    relatedArchitectures: [
      { id: "sequential", name: "Sequential Agent", relevance: "primary" },
      { id: "hierarchical", name: "Hierarchical", relevance: "secondary" },
      { id: "collaborative", name: "Collaborative Swarm", relevance: "secondary" }
    ],
    relatedComponents: ["kc1", "kc4"],
    color: "border-control/30 bg-control/5",
    securityImplications: "Reasoning processes can propagate hallucinations, be manipulated to achieve unauthorized goals, exhibit misaligned behaviors, create untraceable decision trails, or craft manipulative responses.",
    implementationConsiderations: "Security requires verification at key decision points, traceability of reasoning chains, validation of intermediate conclusions, and checks for logic consistency and alignment with intended goals."
  },
  "kc4": {
    id: "kc4",
    title: "Memory Modules (KC4)",
    description: "Systems that enable agents to retain information across interactions, with varying scope and security boundaries.",
    subComponents: [
      {
        id: "kc4.1",
        title: "In-agent session memory",
        description: "Limited to a single agent and a single session, restricting the ability to compromise additional agents/sessions"
      },
      {
        id: "kc4.2",
        title: "Cross-agent session memory",
        description: "Shared across multiple agents but limited to a single session"
      },
      {
        id: "kc4.3",
        title: "In-agent cross-session memory",
        description: "Limited to a single agent but shared across multiple sessions"
      },
      {
        id: "kc4.4",
        title: "Cross-agent cross-session memory",
        description: "Shared across multiple agents and sessions"
      },
      {
        id: "kc4.5",
        title: "In-agent cross-user memory",
        description: "Limited to a single agent but shared across multiple users"
      },
      {
        id: "kc4.6",
        title: "Cross-agent cross-user memory",
        description: "Shared across multiple agents and users"
      }
    ],
    threatCodes: ["T1", "T3", "T5", "T6", "T8", "T12"],
    controls: ["Memory Isolation", "Data Validation", "Access Control", "Memory Sanitization", "Expiration Policies"],
    relatedArchitectures: [
      { id: "sequential", name: "Sequential Agent", relevance: "primary" },
      { id: "hierarchical", name: "Hierarchical", relevance: "secondary" },
      { id: "collaborative", name: "Collaborative Swarm", relevance: "primary" }
    ],
    relatedComponents: ["kc1", "kc3", "kc6"],
    color: "border-primary/30 bg-primary/5",
    securityImplications: "Memory systems can be poisoned with malicious data, cause information leakage across contexts, store and amplify hallucinations, facilitate goal manipulation, enable tampering with audit trails, or allow communication poisoning in multi-agent systems.",
    implementationConsiderations: "Implementation should include input validation before storage, encryption for sensitive data, strict access controls, memory compartmentalization, and time-to-live (TTL) policies for sensitive information."
  },
  "kc5": {
    id: "kc5",
    title: "Tool Integration (KC5)",
    description: "Frameworks allowing agents to extend capabilities beyond text by using external tools, APIs, functions, data stores, and services.",
    subComponents: [
      {
        id: "kc5.1",
        title: "Flexible Libraries/SDK Features",
        description: "Code-level building blocks like LangChain, AG2, CrewAI that provide high flexibility but require more coding effort"
      },
      {
        id: "kc5.2",
        title: "Managed Platforms/Services",
        description: "Vendor-provided solutions like Amazon Bedrock Agents or Microsoft Copilot Platform that handle infrastructure and simplify setup"
      },
      {
        id: "kc5.3",
        title: "Managed APIs",
        description: "Vendor-hosted services like OpenAI's Assistants API that provide higher-level abstractions via API calls"
      }
    ],
    threatCodes: ["T2", "T3", "T6", "T7", "T8", "T11"],
    controls: ["Tool Sandboxing", "Permission Boundaries", "Resource Limitations", "Tool Verification", "Least Privilege"],
    relatedArchitectures: [
      { id: "sequential", name: "Sequential Agent", relevance: "primary" },
      { id: "hierarchical", name: "Hierarchical", relevance: "primary" },
      { id: "collaborative", name: "Collaborative Swarm", relevance: "primary" }
    ],
    relatedComponents: ["kc2", "kc6"],
    color: "border-threat/30 bg-threat/5",
    securityImplications: "Tool integration can lead to misuse of tools in harmful ways, privilege escalation through excessive permissions, manipulation of tools to achieve unauthorized goals, subtle misalignments in tool usage, lack of proper auditability, and unexpected code execution.",
    implementationConsiderations: "Secure implementation requires running tools in isolated environments with strict resource limitations, implementing least privilege access, validating tool inputs/outputs, and maintaining detailed audit logs of all tool invocations."
  },
  "kc6": {
    id: "kc6",
    title: "Operational Environment (KC6)",
    description: "Capabilities that allow agents to interface with external environments through tools and function calls, including APIs, code execution, database access, and more.",
    subComponents: [
      {
        id: "kc6.1",
        title: "API Access",
        description: "Limited or extensive access to external APIs, with varying levels of control over parameter generation"
      },
      {
        id: "kc6.2",
        title: "Code Execution",
        description: "Capabilities to generate or run code with different levels of restriction"
      },
      {
        id: "kc6.3",
        title: "Database Execution",
        description: "Access to query or modify databases, including RAG systems"
      },
      {
        id: "kc6.4",
        title: "Web Access",
        description: "Browser operation capabilities for interacting with web content"
      },
      {
        id: "kc6.5",
        title: "PC Operations",
        description: "File system and OS level access for operating with the operating system"
      },
      {
        id: "kc6.6",
        title: "Critical Systems",
        description: "Access to SCADA or other critical infrastructure with potential for significant impact"
      },
      {
        id: "kc6.7",
        title: "IoT Devices",
        description: "Control over connected devices in physical environments"
      }
    ],
    threatCodes: ["T2", "T3", "T4", "T10", "T11", "T12", "T13", "T15"],
    controls: ["Resource Quotas", "Container Hardening", "API Rate Limiting", "Sandboxing", "HITL Approval"],
    relatedArchitectures: [
      { id: "sequential", name: "Sequential Agent", relevance: "secondary" },
      { id: "hierarchical", name: "Hierarchical", relevance: "primary" },
      { id: "collaborative", name: "Collaborative Swarm", relevance: "primary" }
    ],
    relatedComponents: ["kc2", "kc4", "kc5"],
    color: "border-control/30 bg-control/5",
    securityImplications: "Operational environments create risk of misusing access to external systems, exploiting excessive permissions, overwhelming services, generating excessive approval requests, executing malicious code, using external systems for side channels, operating outside monitoring boundaries, or leveraging operational access to manipulate humans.",
    implementationConsiderations: "Security implementation should include strong isolation through containerization, strict network access controls, mandatory resource limits, comprehensive logging of all operations, and human approval for critical actions."
  }
};

const ComponentDetail = () => {
  const { componentId } = useParams<{ componentId: string }>();
  const [activeTab, setActiveTab] = useState<"overview" | "threats" | "mitigations" | "architectures">("overview");
  
  // Get component data
  const component = componentId ? componentsData[componentId] : undefined;
  
  // Get related threats by matching component ID with threat componentIds
  const relatedThreats: Threat[] = component 
    ? Object.values(threatsData).filter((threat: Threat) => 
        threat.componentIds.includes(component.id))
    : [];
    
  // Get related mitigations by matching threat IDs with mitigation threatIds
  const relatedMitigations: Mitigation[] = component
    ? Object.values(mitigationsData).filter((mitigation: Mitigation) =>
        relatedThreats.some((threat: Threat) => mitigation.threatIds.includes(threat.id)))
    : [];

  // Icons for subcomponents based on component type
  const getSubcomponentIcon = (componentId: string) => {
    switch(componentId) {
      case 'kc1': return null;
      case 'kc2': return <GitMerge className="w-4 h-4 mr-2" />;
      case 'kc3': return null;
      case 'kc4': return null;
      case 'kc5': return <Wrench className="w-4 h-4 mr-2" />;
      case 'kc6': 
        return componentId.includes('kc6.2') ? <Code className="w-4 h-4 mr-2" /> : 
               componentId.includes('kc6.3') ? <Database className="w-4 h-4 mr-2" /> : 
               null;
      default: return null;
    }
  };

  // If component not found, show not found message
  if (!component) {
    return (
      <>
        <Header />
        <main className="container py-12">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4">Component Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The component you're looking for does not exist or has been removed.
            </p>
            <Link to="/components">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Components
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container py-12">
        <div className="mb-8">
          <Link to="/components" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Components Overview
          </Link>
          
          <div className={cn("p-6 rounded-lg mb-8", component.color)}>
            <h1 className="text-3xl font-bold mb-2">{component.title}</h1>
            <p className="text-lg text-muted-foreground">{component.description}</p>
          </div>
          
          {/* Tab navigation */}
          <div className="border-b mb-6">
            <div className="flex flex-wrap gap-y-2 md:gap-y-0 space-x-6">
              <button 
                onClick={() => setActiveTab("overview")}
                className={cn(
                  "pb-2 px-1 font-medium",
                  activeTab === "overview" 
                    ? "border-b-2 border-primary text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Overview
              </button>
              <button 
                onClick={() => setActiveTab("threats")}
                className={cn(
                  "pb-2 px-1 font-medium flex items-center",
                  activeTab === "threats" 
                    ? "border-b-2 border-threat text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <AlertTriangle className="mr-1 h-4 w-4" />
                Threats
                <span className="ml-1 text-xs bg-threat/10 text-threat px-2 py-0.5 rounded-full">
                  {relatedThreats.length}
                </span>
              </button>
              <button 
                onClick={() => setActiveTab("mitigations")}
                className={cn(
                  "pb-2 px-1 font-medium flex items-center",
                  activeTab === "mitigations" 
                    ? "border-b-2 border-control text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Shield className="mr-1 h-4 w-4" />
                Mitigations
                <span className="ml-1 text-xs bg-control/10 text-control px-2 py-0.5 rounded-full">
                  {relatedMitigations.length}
                </span>
              </button>
              <button 
                onClick={() => setActiveTab("architectures")}
                className={cn(
                  "pb-2 px-1 font-medium flex items-center",
                  activeTab === "architectures" 
                    ? "border-b-2 border-architecture text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <GitMerge className="mr-1 h-4 w-4" />
                Architectures
              </button>
            </div>
          </div>
          
          {/* Tab content */}
          <div>
            {activeTab === "overview" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Subcomponents</h2>
                  <div className="grid grid-cols-1 gap-4">
                    {component.subComponents.map(subComponent => (
                      <Card key={subComponent.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-center mb-2">
                            {getSubcomponentIcon(subComponent.id)}
                            <h3 className="text-lg font-medium">{subComponent.title}</h3>
                          </div>
                          <p className="text-muted-foreground">
                            {subComponent.description}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h2 className="text-xl font-semibold mb-4">Security Implications</h2>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-muted-foreground">
                        {component.securityImplications}
                      </p>
                    </CardContent>
                  </Card>
                </div>
                
                <div>
                  <h2 className="text-xl font-semibold mb-4">Implementation Considerations</h2>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-muted-foreground">
                        {component.implementationConsiderations}
                      </p>
                    </CardContent>
                  </Card>
                </div>
                
                <div>
                  <h2 className="text-xl font-semibold mb-4">Related Components</h2>
                  <div className="flex flex-wrap gap-3">
                    {component.relatedComponents.map(id => (
                      <Link to={`/components/${id}`} key={id}>
                        <div className={cn(
                          "border rounded-md p-3 transition-colors",
                          componentsData[id]?.color
                        )}>
                          {componentsData[id]?.title}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === "threats" && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">Threats to {component.title}</h2>
                {relatedThreats.length > 0 ? (
                  <div className="space-y-4">
                    {relatedThreats.map(threat => (
                      <Card key={threat.id} className="border-threat/20">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-medium">
                              <span className="font-mono text-xs bg-threat/10 text-threat px-2 py-0.5 rounded mr-2">
                                {threat.code}
                              </span>
                              {threat.name}
                            </h3>
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded-full",
                              threat.impactLevel === "high" ? "bg-red-100 text-red-700" :
                              threat.impactLevel === "medium" ? "bg-yellow-100 text-yellow-700" :
                              "bg-blue-100 text-blue-700"
                            )}>
                              {threat.impactLevel.charAt(0).toUpperCase() + threat.impactLevel.slice(1)} Impact
                            </span>
                          </div>
                          <p className="text-muted-foreground mb-4">
                            {threat.description}
                          </p>
                          <div className="text-sm">
                            <span className="font-medium">Affected Components: </span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {threat.componentIds.map(id => (
                                <Link to={`/components/${id}`} key={id}>
                                  <span className="inline-block bg-secondary px-2 py-1 rounded text-xs">
                                    {componentsData[id]?.title.split(" ")[0]} {/* Just get the first word of the title */}
                                  </span>
                                </Link>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No specific threats documented for this component.</p>
                )}
              </div>
            )}
            
            {activeTab === "mitigations" && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">Security Controls & Mitigations</h2>
                {relatedMitigations.length > 0 ? (
                  <div className="space-y-4">
                    {relatedMitigations.map(mitigation => (
                      <Card key={mitigation.id} className="border-control/20">
                        <CardContent className="pt-6">
                          <h3 className="text-lg font-medium mb-2">{mitigation.name}</h3>
                          <p className="text-muted-foreground mb-4">
                            {mitigation.description}
                          </p>
                          
                          <div className="flex flex-wrap gap-2 mb-4">
                            {mitigation.designPhase && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                Design Phase
                              </span>
                            )}
                            {mitigation.buildPhase && (
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                Build Phase
                              </span>
                            )}
                            {mitigation.operationPhase && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                Operation Phase
                              </span>
                            )}
                          </div>
                          
                          <div className="mb-4">
                            <span className="text-sm font-medium">Mitigates Threats: </span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {mitigation.threatIds.map(threatId => {
                                const threat = threatsData[threatId];
                                return threat ? (
                                  <span 
                                    key={threatId} 
                                    className="text-xs bg-threat/10 text-threat px-2 py-0.5 rounded-full"
                                  >
                                    <span className="font-mono">{threat.code}</span> - {threat.name}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          </div>
                          <div className="bg-muted p-4 rounded-md">
                            <h4 className="text-sm font-medium mb-2">Implementation Guidance</h4>
                            {mitigation.implementationDetail ? (
                              <div className="space-y-2">
                                {mitigation.implementationDetail.design && (
                                  <div>
                                    <span className="font-semibold">Design Phase:</span>
                                    <div className="text-sm text-muted-foreground whitespace-pre-line">{mitigation.implementationDetail.design}</div>
                                  </div>
                                )}
                                {mitigation.implementationDetail.build && (
                                  <div>
                                    <span className="font-semibold">Build Phase:</span>
                                    <div className="text-sm text-muted-foreground whitespace-pre-line">{mitigation.implementationDetail.build}</div>
                                  </div>
                                )}
                                {mitigation.implementationDetail.operations && (
                                  <div>
                                    <span className="font-semibold">Operation Phase:</span>
                                    <div className="text-sm text-muted-foreground whitespace-pre-line">{mitigation.implementationDetail.operations}</div>
                                  </div>
                                )}
                                {mitigation.implementationDetail.toolsAndFrameworks && (
                                  <div>
                                    <span className="font-semibold">Tools & Frameworks:</span>
                                    <div className="text-sm text-muted-foreground whitespace-pre-line">{mitigation.implementationDetail.toolsAndFrameworks}</div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No implementation guidance available.</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No specific mitigations documented for this component's threats.</p>
                )}
              </div>
            )}
            
            {activeTab === "architectures" && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">Relevant Architectures</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {component.relatedArchitectures.map(arch => (
                    <Card key={arch.id} className={cn(
                      arch.relevance === "primary" 
                        ? "border-architecture/30 bg-architecture/5" 
                        : "border-muted"
                    )}>
                      <CardContent className="pt-6">
                        <h3 className="text-lg font-medium mb-2">{arch.name}</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {arch.relevance === "primary" 
                            ? `${component.title} is a primary component in this architecture.`
                            : `${component.title} plays a supporting role in this architecture.`}
                        </p>
                        <Link to={`/architectures/${arch.id}`}>
                          <Button variant="outline" size="sm">View Architecture</Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default ComponentDetail;
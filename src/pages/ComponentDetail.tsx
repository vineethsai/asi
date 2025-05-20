
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Shield, AlertTriangle, GitMerge } from "lucide-react";
import { cn } from "@/lib/utils";

// Define the component data structure
type Component = {
  id: string;
  title: string;
  description: string;
  threatCategories: string[];
  controls: string[];
  relatedArchitectures: Array<{
    id: string;
    name: string;
    relevance: "primary" | "secondary";
  }>;
  relatedComponents: string[];
  color: string;
};

// Define the threats data structure
type Threat = {
  id: string;
  name: string;
  description: string;
  impactLevel: "high" | "medium" | "low";
  componentIds: string[];
};

// Define the mitigations data structure
type Mitigation = {
  id: string;
  name: string;
  description: string;
  threatIds: string[];
  implementation: string;
};

// Sample component data
const componentsData: Record<string, Component> = {
  "kc1": {
    id: "kc1",
    title: "Language Models",
    description: "Foundation models and multimodal capabilities that form the core of agentic AI systems. These include both base and fine-tuned models with varying capabilities.",
    threatCategories: ["Prompt Injection", "Training Data Poisoning", "Model Extraction", "Input Validation Bypass"],
    controls: ["Prompt Hardening", "Input Sanitization", "Output Filtering", "Adversarial Training"],
    relatedArchitectures: [
      { id: "sequential", name: "Sequential Agent", relevance: "primary" },
      { id: "hierarchical", name: "Hierarchical", relevance: "primary" },
      { id: "collaborative", name: "Collaborative Swarm", relevance: "primary" }
    ],
    relatedComponents: ["kc3", "kc4"],
    color: "border-primary/30 bg-primary/5"
  },
  "kc2": {
    id: "kc2",
    title: "Orchestration",
    description: "Workflows, planning, and multi-agent collaboration mechanisms that coordinate the activities of agentic systems.",
    threatCategories: ["Intent Breaking", "Communication Poisoning", "Workflow Hijacking"],
    controls: ["Communication Verification", "Intent Validation", "Agent Isolation"],
    relatedArchitectures: [
      { id: "hierarchical", name: "Hierarchical", relevance: "primary" },
      { id: "collaborative", name: "Collaborative Swarm", relevance: "primary" }
    ],
    relatedComponents: ["kc1", "kc3", "kc6"],
    color: "border-architecture/30 bg-architecture/5"
  },
  "kc3": {
    id: "kc3",
    title: "Reasoning",
    description: "ReAct, Chain of Thought, and various planning paradigms that enable agentic systems to make decisions.",
    threatCategories: ["Reasoning Manipulation", "Goal Misalignment", "Logic Injection"],
    controls: ["Reasoning Validation", "Goal Alignment Checks", "Logic Verification"],
    relatedArchitectures: [
      { id: "sequential", name: "Sequential Agent", relevance: "primary" },
      { id: "hierarchical", name: "Hierarchical", relevance: "secondary" },
      { id: "collaborative", name: "Collaborative Swarm", relevance: "secondary" }
    ],
    relatedComponents: ["kc1", "kc4"],
    color: "border-control/30 bg-control/5"
  },
  "kc4": {
    id: "kc4",
    title: "Memory",
    description: "Various memory types and security boundaries for storing and retrieving information in agentic systems.",
    threatCategories: ["Memory Poisoning", "Data Leakage", "Information Disclosure"],
    controls: ["Memory Isolation", "Data Validation", "Access Control"],
    relatedArchitectures: [
      { id: "sequential", name: "Sequential Agent", relevance: "primary" },
      { id: "hierarchical", name: "Hierarchical", relevance: "secondary" },
      { id: "collaborative", name: "Collaborative Swarm", relevance: "primary" }
    ],
    relatedComponents: ["kc1", "kc3", "kc6"],
    color: "border-primary/30 bg-primary/5"
  },
  "kc5": {
    id: "kc5",
    title: "Tool Integration",
    description: "Frameworks for extending capabilities through integration with external tools and services.",
    threatCategories: ["Tool Misuse", "Privilege Compromise", "Resource Abuse"],
    controls: ["Tool Sandboxing", "Permission Boundaries", "Resource Limitations"],
    relatedArchitectures: [
      { id: "sequential", name: "Sequential Agent", relevance: "primary" },
      { id: "hierarchical", name: "Hierarchical", relevance: "primary" },
      { id: "collaborative", name: "Collaborative Swarm", relevance: "primary" }
    ],
    relatedComponents: ["kc2", "kc6"],
    color: "border-threat/30 bg-threat/5"
  },
  "kc6": {
    id: "kc6",
    title: "Environment",
    description: "API access, code execution, database operations, and other environmental aspects of agentic systems.",
    threatCategories: ["Resource Exhaustion", "Container Escape", "API Abuse"],
    controls: ["Resource Quotas", "Container Hardening", "API Rate Limiting"],
    relatedArchitectures: [
      { id: "sequential", name: "Sequential Agent", relevance: "secondary" },
      { id: "hierarchical", name: "Hierarchical", relevance: "primary" },
      { id: "collaborative", name: "Collaborative Swarm", relevance: "primary" }
    ],
    relatedComponents: ["kc2", "kc4", "kc5"],
    color: "border-control/30 bg-control/5"
  }
};

// Sample threats data
const threatsData: Record<string, Threat> = {
  "t1": {
    id: "t1",
    name: "Memory Poisoning",
    description: "Attackers inject malicious data into the agent's memory to manipulate future decisions.",
    impactLevel: "high",
    componentIds: ["kc4"]
  },
  "t2": {
    id: "t2",
    name: "Tool Misuse",
    description: "Manipulation of tool invocations to perform unintended actions or access unauthorized resources.",
    impactLevel: "high",
    componentIds: ["kc5"]
  },
  "t3": {
    id: "t3",
    name: "Privilege Compromise",
    description: "Escalation of privileges through exploitation of tool integration vulnerabilities.",
    impactLevel: "high",
    componentIds: ["kc5", "kc6"]
  },
  "t6": {
    id: "t6",
    name: "Intent Breaking",
    description: "Manipulation of agent orchestration to deviate from intended workflows.",
    impactLevel: "medium",
    componentIds: ["kc2"]
  },
  "t12": {
    id: "t12",
    name: "Communication Poisoning",
    description: "Injection of malicious data into inter-agent communication channels.",
    impactLevel: "medium",
    componentIds: ["kc2"]
  },
  "t4": {
    id: "t4",
    name: "Prompt Injection",
    description: "Manipulation of input prompts to make the model perform unintended actions.",
    impactLevel: "high",
    componentIds: ["kc1"]
  },
  "t5": {
    id: "t5", 
    name: "Reasoning Manipulation",
    description: "Subversion of the agent's reasoning process to produce harmful outputs.",
    impactLevel: "high",
    componentIds: ["kc3"]
  }
};

// Sample mitigations
const mitigationsData: Record<string, Mitigation> = {
  "m1": {
    id: "m1",
    name: "Memory Validation",
    description: "Implement validation checks on all data stored in memory to prevent injection attacks.",
    threatIds: ["t1"],
    implementation: "Validate and sanitize all inputs before storing in memory. Use content filtering and schema validation."
  },
  "m2": {
    id: "m2",
    name: "Tool Sandboxing",
    description: "Run tools in isolated environments with strict resource and access limitations.",
    threatIds: ["t2", "t3"],
    implementation: "Implement containerization for tools, with resource quotas and network isolation."
  },
  "m3": {
    id: "m3",
    name: "Communication Verification",
    description: "Verify the integrity and authenticity of inter-agent communications.",
    threatIds: ["t6", "t12"],
    implementation: "Implement message signing and verification between agents. Use consistent message formats and validation."
  },
  "m4": {
    id: "m4",
    name: "Prompt Hardening",
    description: "Strengthen prompts against manipulation through careful design and validation.",
    threatIds: ["t4"],
    implementation: "Use prefix/suffix injection protection, implement strict parsing of structured outputs."
  },
  "m5": {
    id: "m5",
    name: "Reasoning Validation",
    description: "Verify the reasoning process at key decision points to detect manipulation.",
    threatIds: ["t5"],
    implementation: "Implement multi-step validation, use guardrails that check for reasoning flaws."
  }
};

const ComponentDetail = () => {
  const { componentId } = useParams<{ componentId: string }>();
  const [activeTab, setActiveTab] = useState<"overview" | "threats" | "mitigations" | "architectures">("overview");
  
  // Get component data
  const component = componentId ? componentsData[componentId] : undefined;
  
  // Get related threats
  const relatedThreats = component 
    ? Object.values(threatsData).filter(threat => 
        threat.componentIds.includes(component.id))
    : [];
    
  // Get related mitigations
  const relatedMitigations = component
    ? Object.values(mitigationsData).filter(mitigation =>
        relatedThreats.some(threat => mitigation.threatIds.includes(threat.id)))
    : [];

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
            <div className="flex space-x-6">
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
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Key Aspects</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <h3 className="text-lg font-medium mb-2">Security Implications</h3>
                        <p className="text-muted-foreground">
                          {component.title} components are critical to agentic systems and require specific security 
                          measures to prevent exploitation and ensure safe operation.
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <h3 className="text-lg font-medium mb-2">Implementation Considerations</h3>
                        <p className="text-muted-foreground">
                          When implementing {component.title.toLowerCase()}, focus on isolation, 
                          validation, and monitoring to minimize security risks.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
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
                            <h3 className="text-lg font-medium">{threat.name}</h3>
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
                            {threat.componentIds.map(id => (
                              <Link to={`/components/${id}`} key={id} className="inline-block">
                                <span className="mr-2 bg-secondary px-2 py-1 rounded text-xs">
                                  {componentsData[id]?.title}
                                </span>
                              </Link>
                            ))}
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
                                    {threat.name}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          </div>
                          <div className="bg-muted p-4 rounded-md">
                            <h4 className="text-sm font-medium mb-2">Implementation Guidance</h4>
                            <p className="text-sm text-muted-foreground">
                              {mitigation.implementation}
                            </p>
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
                        <Link to={`/architecture/${arch.id}`}>
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

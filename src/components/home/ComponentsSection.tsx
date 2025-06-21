import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const ComponentsSection = () => {
  const [expandedComponents, setExpandedComponents] = useState<Set<string>>(new Set());

  const toggleComponent = (componentId: string) => {
    const newExpanded = new Set(expandedComponents);
    if (newExpanded.has(componentId)) {
      newExpanded.delete(componentId);
    } else {
      newExpanded.add(componentId);
    }
    setExpandedComponents(newExpanded);
  };

  const components = [
    {
      id: "kc1",
      title: "Language Models (KC1)",
      description: "The core cognitive engine or 'brain' of agentic systems, responsible for understanding, reasoning, and generating responses.",
      subComponents: [
        "KC1.1: Large Language Models (LLMs) - Pre-trained foundation models like GPT, Claude, and Llama",
        "KC1.2: Multimodal LLMs - Processing multiple data types beyond text (images, audio)",
        "KC1.3: Small Language Models (SLMs) - Smaller, focused models for specific tasks",
        "KC1.4: Fine-tuned Models - Specialized for particular domains or behaviors"
      ],
      threats: [
        "T5: Cascading Hallucination - Incorrect information propagates through system",
        "T6: Intent Breaking - Attacks targeting core decision-making capabilities",
        "T7: Misaligned Behaviors - Model alignment issues causing unintended actions",
        "T15: Human Manipulation - Models exploiting human trust"
      ],
      color: "bg-primary/10 border-primary/30 text-primary"
    },
    {
      id: "kc2",
      title: "Orchestration (KC2)",
      description: "Control flow mechanisms that dictate the agent's behavior, information flow, and decision-making processes.",
      subComponents: [
        "KC2.1: Workflows - Structured, pre-defined sequences of tasks agents follow",
        "KC2.2: Hierarchical Planning - Orchestrator breaks down complex tasks for specialized sub-agents",
        "KC2.3: Multi-agent Collaboration - Multiple agents working together, sharing information and resources"
      ],
      threats: [
        "T6: Intent Breaking - Manipulating control flow for unauthorized goals",
        "T8: Repudiation - Making agent actions difficult to trace",
        "T9: Identity Spoofing - Impersonating trusted agents in multi-agent systems",
        "T10: Overwhelming HITL - Bypassing human oversight through overload",
        "T12: Communication Poisoning - Corrupting inter-agent messaging",
        "T13: Rogue Agents - Compromising orchestration in multi-agent systems"
      ],
      color: "bg-primary/10 border-primary/30 text-primary"
    },
    {
      id: "kc3",
      title: "Reasoning/Planning (KC3)",
      description: "Paradigms that enable AI agents to solve complex problems by breaking down tasks, making decisions, and forming plans.",
      subComponents: [
        "KC3.1: Structured Planning/Execution - Formal task decomposition and execution",
        "KC3.2: ReAct (Reason + Act) - Interleaving reasoning with actions based on feedback",
        "KC3.3: Chain of Thought (CoT) - Step-by-step reasoning before conclusions",
        "KC3.4: Tree of Thoughts (ToT) - Exploring multiple reasoning paths with backtracking"
      ],
      threats: [
        "T5: Cascading Hallucination - Propagating incorrect reasoning through plans",
        "T6: Intent Breaking - Manipulating the reasoning process",
        "T7: Misaligned Behaviors - Subtle reasoning misalignments affecting decisions",
        "T8: Repudiation - Obscuring decision trails in reasoning chains",
        "T15: Human Manipulation - Crafting deceptive reasoning paths"
      ],
      color: "bg-primary/10 border-primary/30 text-primary"
    },
    {
      id: "kc4",
      title: "Memory Modules (KC4)",
      description: "Systems that enable agents to retain information across interactions, with varying scope and security boundaries.",
      subComponents: [
        "KC4.1: In-agent session memory - Limited to single agent and session",
        "KC4.2: Cross-agent session memory - Shared across agents in a single session",
        "KC4.3: In-agent cross-session memory - Single agent across multiple sessions",
        "KC4.4: Cross-agent cross-session memory - Shared across agents and sessions",
        "KC4.5: In-agent cross-user memory - Single agent across multiple users",
        "KC4.6: Cross-agent cross-user memory - Shared across agents and users"
      ],
      threats: [
        "T1: Memory Poisoning - Directly compromising any memory type",
        "T3: Privilege Compromise - Breaking information boundaries through context collapse",
        "T5: Cascading Hallucination - Persisting false information across sessions",
        "T6: Intent Breaking - Abusing shared context to manipulate goals",
        "T8: Repudiation - Manipulating or erasing evidence from memory",
        "T12: Communication Poisoning - Corrupting shared memory states"
      ],
      color: "bg-primary/10 border-primary/30 text-primary"
    },
    {
      id: "kc5",
      title: "Tool Integration (KC5)",
      description: "Frameworks allowing agents to extend capabilities beyond text by using external tools, APIs, and functions.",
      subComponents: [
        "KC5.1: Flexible Libraries/SDK Features - Code-level building blocks (LangChain, Agents)",
        "KC5.2: Managed Platforms/Services - Vendor solutions that handle infrastructure (Amazon Bedrock, Copilot)",
        "KC5.3: Managed APIs - Vendor-hosted services providing high-level abstractions (OpenAI Assistants API)"
      ],
      threats: [
        "T2: Tool Misuse - Agents using tools in unintended or harmful ways",
        "T3: Privilege Compromise - Exploiting tool privileges to gain unauthorized access",
        "T6: Intent Breaking - Manipulating tools to achieve unauthorized goals",
        "T7: Misaligned Behaviors - Creating subtle tool usage misalignments",
        "T8: Repudiation - Lack of proper logging in tool operations",
        "T11: Unexpected RCE - Tools enabling unexpected code execution"
      ],
      color: "bg-primary/10 border-primary/30 text-primary"
    },
    {
      id: "kc6",
      title: "Operational Environment (KC6)",
      description: "Capabilities that allow agents to interact with external systems and environments, posing varying levels of risk.",
      subComponents: [
        "KC6.1: API Access - Limited or extensive access to external APIs",
        "KC6.2: Code Execution - Capabilities to generate or run code",
        "KC6.3: Database Execution - Access to query or modify databases",
        "KC6.4: Web Access - Browser operation capabilities",
        "KC6.5: PC Operations - File system and OS level access",
        "KC6.6: Critical Systems - Access to SCADA or other critical infrastructure",
        "KC6.7: IoT Devices - Control over connected devices"
      ],
      threats: [
        "T2: Tool Misuse - Misusing operational environment access",
        "T3: Privilege Compromise - Exploiting excessive permissions",
        "T4: Resource Overload - Overwhelming external services",
        "T10: Overwhelming HITL - Creating excessive approval requests",
        "T11: Unexpected RCE - Direct risks in code execution environments",
        "T12: Communication Poisoning - Using external systems as side channels",
        "T13: Rogue Agents - Operating outside monitoring boundaries"
      ],
      color: "bg-primary/10 border-primary/30 text-primary"
    }
  ];

  return (
    <section className="py-16 bg-secondary/50">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2 max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tighter">Key Components</h2>
            <p className="text-muted-foreground md:text-xl">
              Agentic systems comprise six key components, each introducing unique security challenges
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-12">
          {components.map((component, i) => {
            const isExpanded = expandedComponents.has(component.id);
            return (
              <Card key={i} className={`border ${component.color}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Link to={`/components/${component.id}`} className="flex-1">
                      <h3 className="text-xl font-bold hover:underline">{component.title}</h3>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleComponent(component.id)}
                      className="ml-2 p-1 h-8 w-8"
                    >
                      {isExpanded ? 
                        <ChevronDown className="h-4 w-4" /> : 
                        <ChevronRight className="h-4 w-4" />
                      }
                    </Button>
                  </div>
                  
                  <p className="text-muted-foreground mb-4">{component.description}</p>
                  
                  <div className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                  )}>
                    <div className="mb-4">
                      <div className="text-sm font-semibold mb-2">Subcomponents:</div>
                      <ul className="space-y-1">
                        {component.subComponents.map((subComponent, j) => (
                          <li key={j} className="text-sm text-muted-foreground pl-4 border-l-2 border-muted">
                            {subComponent}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="text-sm font-semibold mb-2">Key Threats:</div>
                      <ul>
                        {component.threats.map((threat, j) => (
                          <li key={j} className="text-sm text-muted-foreground">
                            {threat}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-border">
                    <Link to={`/components/${component.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        View Details <ArrowRight className="ml-2 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-6 max-w-3xl mx-auto">
            Understanding these components and their interactions is crucial for implementing comprehensive security
            in agentic applications. Explore each component to learn about specific threats and mitigations.
          </p>
          <Link to="/components">
            <Button size="lg">
              Explore In-Depth Components Guide
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ComponentsSection;
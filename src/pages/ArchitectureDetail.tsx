import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/layout/Header";
import SidebarNav from "@/components/layout/SidebarNav";
import { architecturesData, Architecture } from "../components/components/architecturesData";
import { threatsData, mitigationsData } from "../components/components/securityData";
import { frameworkData as allComponentNodes } from "../components/components/frameworkData";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Icon } from "@/components/ui/icon";
import { useState } from "react";
import { Helmet } from "react-helmet";
import ArchitectureDiagram from '@/components/visual/ArchitectureDiagrams';

// Helper to get component description from frameworkData
const getComponentDescription = (id: string): string => {
  const node = allComponentNodes.find((n) => n.id === id);
  return node?.description || "";
};

// Real-world examples for each architecture
const realWorldExamples: Record<string, string[]> = {
  sequential: [
    "Basic chatbots with linear conversation flows",
    "Simple automation pipelines (e.g., data processing workflows)",
    "Step-by-step customer support bots",
    "Document processing agents with sequential validation",
    "Linear content generation workflows"
  ],
  hierarchical: [
    "Multi-agent task orchestration systems",
    "Complex workflow engines with specialized agents",
    "Enterprise RPA with sub-process delegation",
    "AI-powered project management with task breakdown",
    "Research assistants with domain-specific sub-agents"
  ],
  collaborative: [
    "Distributed problem-solving agent networks",
    "Collaborative content creation systems",
    "Multi-agent game AI with peer coordination",
    "Decentralized decision-making systems",
    "Swarm intelligence applications"
  ],
  swarm: [
    "Distributed problem-solving agent networks",
    "Collaborative content creation systems",
    "Multi-agent game AI with peer coordination",
    "Decentralized decision-making systems",
    "Swarm intelligence applications"
  ],
  reactive: [
    "Real-time monitoring agents",
    "Event-driven chatbots",
    "IoT device controllers"
  ],
  knowledge: [
    "Research assistants",
    "Legal/medical information synthesis",
    "Enterprise knowledge management bots"
  ]
};

const ArchitectureDetail = () => {
  const { architectureId } = useParams<{ architectureId: string }>();
  const architecture: Architecture | undefined = architectureId ? architecturesData[architectureId] : undefined;

  // Get threats and mitigations
  const threats = architecture?.threatIds.map(id => threatsData[id]).filter(Boolean) || [];
  const mitigations = architecture?.mitigationIds.map(id => mitigationsData[id]).filter(Boolean) || [];

  // Get components with descriptions
  const components = architecture?.keyComponents.map(id => ({
    id,
    description: getComponentDescription(id)
  })) || [];

  // Build threat-to-component matrix for visualization
  const threatComponentMatrix = threats.map(threat => ({
    threat,
    affected: architecture?.keyComponents.filter(cid => threat.componentIds.includes(cid)) || []
  }));

  // Helper: does a threat affect a component (by root)?
  function threatAffectsComponent(threat, compId) {
    // e.g., threat.componentIds: ["kc4"] matches compId: "kc4.1"
    const root = compId.split(".")[0];
    return (threat.componentIds || []).includes(root);
  }

  // Component data mapping from the parsed components with proper dot notation
  const componentDataMap = {
    "kc1.1": { title: "Large Language Models (LLMs)", description: "Core cognitive engine utilizing pre-trained foundation models for reasoning, planning, and generation, primarily directed via prompt engineering. Operates within constraints like context window, latency, and cost." },
    "kc1.2": { title: "Multimodal LLMs (MLLMs)", description: "LLMs capable of processing and/or generating information across multiple data types beyond text (e.g., images, audio), enabling agents to perform a wider variety of tasks." },
    "kc1.3": { title: "Small-Language Models (SLMs)", description: "Language models with fewer parameters, trained on smaller, focused datasets, designed for specific tasks or use cases. Characterized by smaller weight space, parameter size, and context window compared to LLMs." },
    "kc1.4": { title: "Fine-tuned Models", description: "Language models (LLMs/MLLMs) that undergo additional training on specific datasets to specialize their capabilities, enhancing performance, adopting personas, or improving reliability for particular tasks." },
    
    "kc2.1": { title: "Workflows", description: "Structured, pre-defined sequence of tasks or steps that agents follow to achieve a goal, defining the flow of information and actions. Can be linear, conditional, or iterative." },
    "kc2.2": { title: "Hierarchical Planning", description: "Multiple agents collaborating via an orchestrator (router) that decomposes tasks, routes sub-tasks to specialized agents, and monitors performance." },
    "kc2.3": { title: "Multi-agent Collaboration", description: "Multiple agents working together, communicating and coordinating actions, sharing information and resources to achieve a common goal. Useful for complex tasks requiring diverse skills." },
    
    "kc3.1": { title: "Structured Planning / Execution", description: "Focuses on decomposing tasks into a formal plan, defining sequences of actions (often involving tool calls), and executing the plan, sometimes with separate planner/executor components (e.g., ReWoo, LLM Compiler, Plan-and-Execute)." },
    "kc3.2": { title: "ReAct (Reason + Act)", description: "Dynamically interleaves reasoning steps with actions (like using tools or querying APIs) and updates reasoning based on feedback." },
    "kc3.3": { title: "Chain of Thought (CoT)", description: "Enhances reasoning quality by prompting step-by-step \"thinking,\" inducing an LLM to generate a set of \"thoughts\" before arriving at a final action or conclusion." },
    "kc3.4": { title: "Tree of Thoughts (ToT)", description: "Generalizes CoT by exploring multiple reasoning paths and plans in parallel with lookahead, backtracking, and self-evaluation." },
    
    "kc4.1": { title: "In-agent session memory", description: "Memory limited to a single agent and a single session." },
    "kc4.2": { title: "Cross-agent session memory", description: "Memory shared across multiple agents but limited to a single session." },
    "kc4.3": { title: "In-agent cross-session memory", description: "Memory limited to a single agent but shared across multiple sessions." },
    "kc4.4": { title: "Cross-agent cross-session memory", description: "Memory shared across multiple agents and sessions." },
    "kc4.5": { title: "In-agent cross-user memory", description: "Memory limited to a single agent but shared across multiple users." },
    "kc4.6": { title: "Cross-agent cross-user memory", description: "Memory shared across multiple agents and users." },
    
    "kc5.1": { title: "Flexible Libraries / SDK Features", description: "Code-level building blocks (e.g., LangChain, CrewAI) or API capabilities (OpenAI Tool Use) offering high flexibility but requiring more coding effort." },
    "kc5.2": { title: "Managed Platforms / Services", description: "Vendor-provided solutions (e.g., Amazon Bedrock Agents, Microsoft Copilot Platform) handling infrastructure and simplifying setup, often with easier ecosystem integration and low-code interfaces." },
    "kc5.3": { title: "Managed APIs", description: "Vendor-hosted services (e.g., OpenAI Assistants API) providing higher-level abstractions, managing state and aspects of tool orchestration via API calls." },
    
    "kc6.1": { title: "API Access", description: "Agents utilizing LLM capabilities to interact with APIs." },
    "kc6.1.1": { title: "Limited API Access", description: "Agent generates some parameters for a predefined API call. Compromise can lead to API attacks via LLM-generated parameters." },
    "kc6.1.2": { title: "Extensive API Access", description: "Agent generates the entire API call. Compromise can lead to unwanted API calls and attacks." },
    "kc6.2": { title: "Code Execution", description: "Agents utilizing LLM capabilities for code-related tasks." },
    "kc6.2.1": { title: "Limited Code Execution Capability", description: "Agent generates parameters for a predefined function. Compromise can lead to code injection." },
    "kc6.2.2": { title: "Extensive Code Execution Capability", description: "Agent runs LLM-generated code. Compromise can lead to arbitrary code execution." },
    "kc6.3": { title: "Database Execution", description: "Agents utilizing LLM capabilities to interact with databases." },
    "kc6.3.1": { title: "Limited Database Execution Capability", description: "Agent runs specific queries/commands with limited permissions (e.g., read-only, parameterized writes). Compromise can lead to data exfiltration or limited malicious writes." },
    "kc6.3.2": { title: "Extensive Database Execution Capability", description: "Agent generates and runs all CRUD operations. Compromise can lead to major data alteration, deletion, or leakage." },
    "kc6.3.3": { title: "Agent Memory or Context Data Sources (RAG)", description: "Agent uses external datasources for context or updates records. Compromise can disrupt data or provide malformed information." },
    "kc6.4": { title: "Web Access Capabilities (Web-Use)", description: "Agent utilizing LLM for browser operations. Compromise (often from untrusted web content) can lead to unwanted operations on behalf of the user." },
    "kc6.5": { title: "Controlling PC Operations (PC-Use)", description: "Agent utilizing LLM for OS operations, including file system. Compromise can lead to unwanted operations, data leakage, or malicious actions like encrypting files." },
    "kc6.6": { title: "Operating Critical Systems", description: "Agent utilizing LLM to operate critical systems (e.g., SCADA). Compromise can cause catastrophic failures." },
    "kc6.7": { title: "Access to IoT Devices", description: "Agent controlling IoT devices. Compromise could impact the operational environment or misuse devices." },
    
    // Main component data
    "kc1": { title: "Language Models (LLMs)", description: "The core cognitive engine or \"brain\" of the agent (e.g., GPT-4, Claude), responsible for understanding, reasoning, planning, and generating responses. This includes various types of language models." },
    "kc2": { title: "Orchestration (Control Flow)", description: "Mechanisms that dictate the agent's overall behavior, information flow, and decision-making processes. The specific mechanism depends on the architecture and impacts responsiveness and efficiency." },
    "kc3": { title: "Reasoning / Planning Paradigm", description: "How agents utilize LLMs to solve complex tasks requiring multiple steps and strategic thinking by breaking down high-level tasks into smaller sub-tasks." },
    "kc4": { title: "Memory Modules", description: "Enable the agent to retain short-term (immediate context) and long-term information (past interactions, knowledge) for coherent and personalized interactions. Context sensitivity is used to reduce risk. RAG with vector databases is common for long-term memory." },
    "kc5": { title: "Tool Integration Frameworks", description: "Allow agents to extend capabilities by using external tools (APIs, functions, data stores) to interact with the real world or other systems. Manages tool selection and use." },
    "kc6": { title: "Operational Environment (Agencies)", description: "API access, code execution, database operations" }
  };

  // Helper to get component data by ID
  function getComponentDataById(id) {
    // First try the component data map
    const componentData = componentDataMap[id];
    if (componentData) {
      return componentData;
    }
    
    // Fallback to searching in framework data
    function search(nodes) {
      for (const node of nodes) {
        if (node.id === id || node.id.replace(/-/g, '.') === id) return node;
        if (node.children) {
          const found = search(node.children);
          if (found) return found;
        }
      }
      return null;
    }
    return search(allComponentNodes);
  }

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!architecture) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Architecture Not Found</h1>
        <Link to="/architectures">
          <button className="btn">Back to Architectures</button>
        </Link>
      </div>
    );
  }



  return (
    <>
      <Helmet>
        <title>{architecture.name} Architecture | OWASP Securing Agentic Applications Guide</title>
        <meta name="description" content={`${architecture.description} Learn about security threats, mitigations, and implementation best practices for this AI architecture pattern.`} />
        <meta name="keywords" content={`${architecture.name}, AI architecture, OWASP, agentic systems, ${architecture.tags?.join(', ') || ''}, AI security patterns, architecture security`} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`https://agenticsecurity.info/architectures/${architecture.id}`} />
        <meta property="og:title" content={`${architecture.name} Architecture | OWASP Guide`} />
        <meta property="og:description" content={architecture.description} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://agenticsecurity.info/architectures/${architecture.id}`} />
        <meta property="og:site_name" content="OWASP Securing Agentic Applications Guide" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${architecture.name} Architecture | OWASP Guide`} />
        <meta name="twitter:description" content={architecture.description} />
        <meta name="twitter:url" content={`https://agenticsecurity.info/architectures/${architecture.id}`} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TechArticle",
            "headline": `${architecture.name} Architecture`,
            "description": architecture.description,
                         "url": `https://agenticsecurity.info/architectures/${architecture.id}`,
            "datePublished": new Date().toISOString(),
            "dateModified": new Date().toISOString(),
            "author": {
              "@type": "Organization",
              "name": "OWASP"
            },
            "publisher": {
              "@type": "Organization",
              "name": "OWASP",
              "url": "https://owasp.org"
            },
            "about": "AI Architecture Security",
            "keywords": architecture.tags?.join(', ') || '',
            "isPartOf": {
              "@type": "WebSite",
              "name": "OWASP Securing Agentic Applications Guide",
                             "url": "https://agenticsecurity.info"
            }
          })}
        </script>
      </Helmet>
      <Header />
      
      {/* Sidebar Navigation */}
      <SidebarNav 
        type="architectures" 
        activeId={architecture.id} 
        isOpen={false} 
        onClose={() => {}} 
      />
      
      <section className="py-12 bg-secondary/50 min-h-screen">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col gap-6">
            <div className="flex-1">
              <Link to="/architectures" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4">
                &larr; Back to Architectures
              </Link>
              {/* Overview Card */}
              <Card className="mb-4 border border-architecture/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    {architecture.icon && <Icon name={architecture.icon} color={architecture.color} size={32} />}
                    <h1 className="text-2xl font-bold" style={{ color: architecture.color }}>{architecture.name}</h1>
                    {architecture.status && <Badge variant="outline" className="capitalize ml-2">{architecture.status}</Badge>}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(architecture.tags || []).map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">Version: {architecture.version || "-"} | Last Updated: {architecture.lastUpdated || "-"} | Updated By: {architecture.updatedBy || "-"}</div>
                  {architecture.references && architecture.references.length > 0 && <div className="text-xs mt-1">{architecture.references.map(ref => <a key={ref.url} href={ref.url} target="_blank" rel="noopener noreferrer" className="underline text-blue-600 mr-2">{ref.title}</a>)}</div>}
                  <p className="text-muted-foreground mt-4">{architecture.description}</p>
                </CardContent>
              </Card>

              {/* Detailed Description Card */}
              {architecture.detailedDescription && (
                <Card className="mb-4 border border-border">
                  <CardContent className="p-4">
                    <h2 className="text-lg font-semibold mb-3 text-foreground">Architecture Overview</h2>
                    <p className="text-muted-foreground leading-relaxed">{architecture.detailedDescription}</p>
                  </CardContent>
                </Card>
              )}

              {/* Relevant Threats Section */}
              {architecture.relevantThreats && architecture.relevantThreats.length > 0 && (
                <Card className="mb-4 border border-red-200">
                  <CardContent className="p-4">
                    <h2 className="text-lg font-semibold mb-3 text-red-700">Relevant Threats</h2>
                    <p className="text-sm text-muted-foreground mb-4">Security concerns are focused on protecting this architecture from the following attack vectors:</p>
                    <div className="space-y-4">
                      {architecture.relevantThreats.map((threat, index) => (
                        <div key={index} className="border rounded-lg p-4 bg-red-50 border-red-200">
                          <h3 className="font-semibold text-red-800 mb-2">{threat.title}</h3>
                          <p className="text-sm text-red-700 leading-relaxed">{threat.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Grid for the rest of the cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Visual Diagram */}
                <Card className="border border-border bg-background">
                  <CardContent className="p-4">
                    <h2 className="text-base font-semibold mb-2 text-foreground">Visual Diagram</h2>
                    <ArchitectureDiagram architectureId={architecture.id} className="w-full h-64" />
                  </CardContent>
                </Card>
                {/* Real-world Examples */}
                {realWorldExamples[architecture.id] && (
                  <Card className="border border-border bg-background">
                    <CardContent className="p-4">
                      <h2 className="text-base font-semibold mb-2 text-foreground">Real-World Examples</h2>
                      <ul className="list-disc pl-6 text-muted-foreground">
                        {realWorldExamples[architecture.id].map((ex, i) => (
                          <li key={i}>{ex}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
                {/* Key Components */}
                <Card className="border border-primary/20 bg-background lg:col-span-2">
                  <CardContent className="p-4">
                    <h2 className="text-base font-semibold mb-4 text-primary">Key Components & Sub-Components</h2>
                    <div className="space-y-6">
                      {components.map((comp) => {
                        const node = getComponentDataById(comp.id);
                        return (
                          <div key={comp.id} className="border rounded-lg p-4 bg-primary/5">
                            {/* Main Component */}
                            <div className="mb-3">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                              <span className="font-bold text-lg text-primary">{node?.title || comp.id.toUpperCase()}</span>
                                  <span className="ml-2 font-mono text-xs text-primary/70 bg-primary/10 px-2 py-1 rounded">{comp.id.replace(/-/g, '.').toUpperCase()}</span>
                                </div>
                                <Link 
                                  to={`/components/${comp.id.replace(/-/g, '.')}`} 
                                  className="text-blue-700 font-medium underline text-xs hover:text-blue-900"
                                >
                                  View Details →
                                </Link>
                              </div>
                              {node?.description && (
                                <div className="text-sm text-muted-foreground mb-3 leading-relaxed border-l-4 border-primary/20 pl-3 bg-white/50 py-2 rounded-r">
                                  <span className="font-medium text-primary/80">Summary: </span>
                                  {node.description}
                                </div>
                              )}
                              {node?.threatCategories && node.threatCategories.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {node.threatCategories.map((cat, i) => (
                                    <span key={i} className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full">
                                      {cat}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            {/* Sub-Components */}
                            {node?.children && node.children.length > 0 && (
                              <div className="ml-4 border-l-2 border-primary/20 pl-4">
                                <h4 className="text-sm font-semibold text-primary/80 mb-3">Sub-Components:</h4>
                                <div className="grid gap-3">
                                  {node.children.map((subComp) => (
                                    <div key={subComp.id} className="bg-white/80 border border-primary/10 rounded-md p-3">
                                      <div className="flex items-center justify-between mb-2">
                                        <div>
                                          <span className="font-medium text-sm text-primary">{subComp.title}</span>
                                          <span className="ml-2 font-mono text-xs text-primary/60 bg-primary/5 px-1.5 py-0.5 rounded">{subComp.id.replace(/-/g, '.')}</span>
                                        </div>
                                        <Link 
                                          to={`/components/${subComp.id.replace(/-/g, '.')}`} 
                                          className="text-blue-600 text-xs hover:text-blue-800 underline"
                                        >
                                          Details
                                        </Link>
                                      </div>
                                      {subComp.description && (
                                        <div className="text-xs text-muted-foreground leading-relaxed mb-2 border-l-2 border-primary/10 pl-2 bg-gray-50/50 py-1">
                                          <span className="font-medium text-primary/70">Summary: </span>
                                          {subComp.description}
                                        </div>
                                      )}
                                      {subComp.threatCategories && subComp.threatCategories.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                          {subComp.threatCategories.map((cat, i) => (
                                            <span key={i} className="bg-orange-100 text-orange-700 text-xs px-1.5 py-0.5 rounded">
                                              {cat}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                      
                                      {/* Sub-sub-components */}
                                      {subComp.children && subComp.children.length > 0 && (
                                        <div className="ml-4 mt-3 border-l-2 border-primary/15 pl-3">
                                          <div className="text-xs font-semibold text-primary/70 mb-2">Sub-components:</div>
                                          <div className="space-y-2">
                                            {subComp.children.map((subSubComp) => (
                                              <div key={subSubComp.id} className="bg-gray-50 border border-primary/5 rounded p-2">
                                                                                                 <div className="flex items-center justify-between mb-2">
                                                   <div>
                                                     <span className="font-medium text-xs text-primary/90">{subSubComp.title}</span>
                                                     <span className="ml-2 font-mono text-xs text-primary/50 bg-primary/5 px-1 py-0.5 rounded">{subSubComp.id.replace(/-/g, '.')}</span>
                                                   </div>
                                                   <Link 
                                                     to={`/components/${subSubComp.id.replace(/-/g, '.')}`} 
                                                     className="text-blue-500 text-xs hover:text-blue-700 underline"
                                                   >
                                                     Details
                                                   </Link>
                                                 </div>
                                                 {subSubComp.description && (
                                                   <div className="text-xs text-muted-foreground leading-relaxed border-l border-primary/10 pl-2 bg-white/70 py-1">
                                                     <span className="font-medium text-primary/60">Summary: </span>
                                                     {subSubComp.description}
                                                   </div>
                                                 )}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
                {/* Associated Threats */}
                <Card className="border border-threat/20 bg-background">
                  <CardContent className="p-4">
                    <h2 className="text-base font-semibold mb-2 text-threat">Associated Threats</h2>
                    <ul className="space-y-4">
                      {threats.length > 0 ? (
                        threats.map((threat) => (
                          <li key={threat.id}>
                            <Link to={`/threats/${threat.id}`} className="text-threat underline font-medium">
                              {threat.code} - {threat.name}
                            </Link>
                            <div className="text-sm text-muted-foreground mt-1 ml-2">
                              {threat.description}
                            </div>
                          </li>
                        ))
                      ) : (
                        <li className="text-muted-foreground">No threats documented.</li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
                {/* Mitigations */}
                <Card className="border border-control/20 bg-background">
                  <CardContent className="p-4">
                    <h2 className="text-base font-semibold mb-2 text-control">Mitigations</h2>
                    <ul className="space-y-4">
                      {mitigations.length > 0 ? (
                        mitigations.map((mitigation) => (
                          <li key={mitigation.id}>
                            <Link to={`/controls/${mitigation.id}`} className="text-control underline font-medium">
                              {mitigation.name}
                            </Link>
                            <div className="text-sm text-muted-foreground mt-1 ml-2">
                              {mitigation.description}
                            </div>
                          </li>
                        ))
                      ) : (
                        <li className="text-muted-foreground">No mitigations documented.</li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
                {/* Threat-Component Matrix */}
                {threats.length > 0 && components.length > 0 && (
                  <Card className="border border-yellow-200 bg-background lg:col-span-2">
                    <CardContent className="p-4">
                      <h2 className="text-base font-semibold mb-2 text-foreground">Threat-Component Relationship Map</h2>
                      <div className="overflow-x-auto">
                        <table className="min-w-full border text-sm">
                          <thead>
                            <tr>
                              <th className="px-3 py-2 border-b">Threat</th>
                              {components.map((comp) => {
                                                                 const node = getComponentDataById(comp.id);
                                return (
                                  <th key={comp.id} className="px-3 py-2 border-b text-center min-w-[120px]">
                                    <div className="text-xs font-medium text-primary">
                                      {node?.title || comp.id.toUpperCase()}
                                    </div>
                                    <div className="text-xs font-mono text-muted-foreground mt-1 bg-gray-100 px-1 py-0.5 rounded">
                                      {comp.id.replace(/-/g, '.').toUpperCase()}
                                    </div>
                                  </th>
                                );
                              })}
                            </tr>
                          </thead>
                          <tbody>
                            {threats.map((threat) => (
                              <tr key={threat.id}>
                                <td className="px-3 py-2 border-b font-medium">
                                  <Link to={`/threats/${threat.id}`} className="text-threat underline">
                                    {threat.code}
                                  </Link>
                                </td>
                                {components.map((comp) => (
                                  <td key={comp.id} className="px-3 py-2 border-b text-center">
                                    {threatAffectsComponent(threat, comp.id) ? (
                                      <span className="inline-block w-3 h-3 rounded-full bg-yellow-400" title="Threatens" />
                                    ) : null}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ArchitectureDetail; 
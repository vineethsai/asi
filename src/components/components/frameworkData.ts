export type RelatedArchitecture = {
  id: string;
  name: string;
  relevance: "primary" | "secondary";
};

export type ComponentNode = {
  id: string;
  title: string;
  description?: string;
  threatCategories?: string[]; // These will be threat titles
  threatIds?: string[]; // Threat IDs (e.g., "t1", "t5") for linking to threatsData
  controls?: string[]; // This field is not in our MD data, will be preserved if existing
  color: string;
  icon?: string;
  relatedArchitectures?: RelatedArchitecture[];
  relatedComponents?: string[];
  securityImplications?: string;
  implementationConsiderations?: string;
  children?: ComponentNode[];
};

// Helper map for threat IDs to titles (populated from threats.md)
const threatIdToTitleMap: { [key: string]: string } = {
  t1: "Memory Poisoning",
  t2: "Tool Misuse",
  t3: "Privilege Compromise",
  t4: "Resource Overload",
  t5: "Cascading Hallucination",
  t6: "Intent Breaking & Goal Manipulation",
  t7: "Misaligned Behaviors",
  t8: "Repudiation",
  t9: "Identity Spoofing",
  t10: "Overwhelming HITL",
  t11: "Unexpected Remote Code Execution (RCE)",
  t12: "Communication Poisoning",
  t13: "Rogue Agents",
  t14: "Human Attacks (on Orchestration)",
  t15: "Human Manipulation (by LLM)",
};

// Data parsed from components.md with complete component definitions
const parsedComponentsData = [
  {
    id: "kc1",
    title: "Language Models (LLMs)",
    description:
      'The core cognitive engine or "brain" of the agent (e.g., GPT-4, Claude), responsible for understanding, reasoning, planning, and generating responses. This includes various types of language models.',
    threatIds: ["t5", "t6", "t7", "t15"],
    color: "border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10",
    subComponents: [
      {
        id: "kc1.1",
        title: "Large Language Models (LLMs)",
        description:
          "Core cognitive engine utilizing pre-trained foundation models for reasoning, planning, and generation, primarily directed via prompt engineering. Operates within constraints like context window, latency, and cost.",
        threatIds: ["t5", "t6", "t7", "t15"],
      },
      {
        id: "kc1.2",
        title: "Multimodal LLMs (MLLMs)",
        description:
          "LLMs capable of processing and/or generating information across multiple data types beyond text (e.g., images, audio), enabling agents to perform a wider variety of tasks.",
        threatIds: ["t5", "t6", "t7", "t15"],
      },
      {
        id: "kc1.3",
        title: "Small-Language Models (SLMs)",
        description:
          "Language models with fewer parameters, trained on smaller, focused datasets, designed for specific tasks or use cases. Characterized by smaller weight space, parameter size, and context window compared to LLMs.",
        threatIds: ["t5", "t6", "t7", "t15"],
      },
      {
        id: "kc1.4",
        title: "Fine-tuned Models",
        description:
          "Language models (LLMs/MLLMs) that undergo additional training on specific datasets to specialize their capabilities, enhancing performance, adopting personas, or improving reliability for particular tasks.",
        threatIds: ["t5", "t6", "t7", "t15"],
      },
    ],
  },
  {
    id: "kc2",
    title: "Orchestration (Control Flow)",
    description:
      "Mechanisms that dictate the agent's overall behavior, information flow, and decision-making processes. The specific mechanism depends on the architecture and impacts responsiveness and efficiency.",
    threatIds: ["t6", "t8", "t9", "t10", "t12", "t13", "t14"],
    color: "border-green-500/30 bg-green-500/5 hover:bg-green-500/10",
    subComponents: [
      {
        id: "kc2.1",
        title: "Workflows",
        description:
          "Structured, pre-defined sequence of tasks or steps that agents follow to achieve a goal, defining the flow of information and actions. Can be linear, conditional, or iterative.",
        threatIds: ["t6", "t8", "t9", "t10", "t12", "t13", "t14"],
      },
      {
        id: "kc2.2",
        title: "Hierarchical Planning",
        description:
          "Multiple agents collaborating via an orchestrator (router) that decomposes tasks, routes sub-tasks to specialized agents, and monitors performance.",
        threatIds: ["t6", "t8", "t9", "t10", "t12", "t13", "t14"],
      },
      {
        id: "kc2.3",
        title: "Multi-agent Collaboration",
        description:
          "Multiple agents working together, communicating and coordinating actions, sharing information and resources to achieve a common goal. Useful for complex tasks requiring diverse skills.",
        threatIds: ["t6", "t8", "t9", "t10", "t12", "t13", "t14"],
      },
    ],
  },
  {
    id: "kc3",
    title: "Reasoning / Planning Paradigm",
    description:
      "How agents utilize LLMs to solve complex tasks requiring multiple steps and strategic thinking by breaking down high-level tasks into smaller sub-tasks.",
    threatIds: ["t5", "t6", "t7", "t8", "t15"],
    color: "border-yellow-500/30 bg-yellow-500/5 hover:bg-yellow-500/10",
    subComponents: [
      {
        id: "kc3.1",
        title: "Structured Planning / Execution",
        description:
          "Focuses on decomposing tasks into a formal plan, defining sequences of actions (often involving tool calls), and executing the plan, sometimes with separate planner/executor components (e.g., ReWoo, LLM Compiler, Plan-and-Execute).",
        threatIds: ["t5", "t6", "t7", "t8", "t15"],
      },
      {
        id: "kc3.2",
        title: "ReAct (Reason + Act)",
        description:
          "Dynamically interleaves reasoning steps with actions (like using tools or querying APIs) and updates reasoning based on feedback.",
        threatIds: ["t5", "t6", "t7", "t8", "t15"],
      },
      {
        id: "kc3.3",
        title: "Chain of Thought (CoT)",
        description:
          'Enhances reasoning quality by prompting step-by-step "thinking," inducing an LLM to generate a set of "thoughts" before arriving at a final action or conclusion.',
        threatIds: ["t5", "t6", "t7", "t8", "t15"],
      },
      {
        id: "kc3.4",
        title: "Tree of Thoughts (ToT)",
        description:
          "Generalizes CoT by exploring multiple reasoning paths and plans in parallel with lookahead, backtracking, and self-evaluation.",
        threatIds: ["t5", "t6", "t7", "t8", "t15"],
      },
    ],
  },
  {
    id: "kc4",
    title: "Memory Modules",
    description:
      "Enable the agent to retain short-term (immediate context) and long-term information (past interactions, knowledge) for coherent and personalized interactions. Context sensitivity is used to reduce risk. RAG with vector databases is common for long-term memory.",
    threatIds: ["t1", "t3", "t5", "t6", "t8", "t12"],
    color: "border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10",
    subComponents: [
      {
        id: "kc4.1",
        title: "In-agent session memory",
        description: "Memory limited to a single agent and a single session.",
      },
      {
        id: "kc4.2",
        title: "Cross-agent session memory",
        description: "Memory shared across multiple agents but limited to a single session.",
      },
      {
        id: "kc4.3",
        title: "In-agent cross-session memory",
        description: "Memory limited to a single agent but shared across multiple sessions.",
      },
      {
        id: "kc4.4",
        title: "Cross-agent cross-session memory",
        description: "Memory shared across multiple agents and sessions.",
      },
      {
        id: "kc4.5",
        title: "In-agent cross-user memory",
        description: "Memory limited to a single agent but shared across multiple users.",
      },
      {
        id: "kc4.6",
        title: "Cross-agent cross-user memory",
        description: "Memory shared across multiple agents and users.",
      },
    ],
  },
  {
    id: "kc5",
    title: "Tool Integration Frameworks",
    description:
      "Allow agents to extend capabilities by using external tools (APIs, functions, data stores) to interact with the real world or other systems. Manages tool selection and use.",
    threatIds: ["t2", "t3", "t6", "t8", "t11"],
    color: "border-pink-500/30 bg-pink-500/5 hover:bg-pink-500/10",
    subComponents: [
      {
        id: "kc5.1",
        title: "Flexible Libraries / SDK Features",
        description:
          "Code-level building blocks (e.g., LangChain, CrewAI) or API capabilities (OpenAI Tool Use) offering high flexibility but requiring more coding effort.",
        threatIds: ["t2", "t3", "t6", "t8", "t11"],
      },
      {
        id: "kc5.2",
        title: "Managed Platforms / Services",
        description:
          "Vendor-provided solutions (e.g., Amazon Bedrock Agents, Microsoft Copilot Platform) handling infrastructure and simplifying setup, often with easier ecosystem integration and low-code interfaces.",
        threatIds: ["t2", "t3", "t6", "t8", "t11"],
      },
      {
        id: "kc5.3",
        title: "Managed APIs",
        description:
          "Vendor-hosted services (e.g., OpenAI Assistants API) providing higher-level abstractions, managing state and aspects of tool orchestration via API calls.",
        threatIds: ["t2", "t3", "t6", "t8", "t11"],
      },
    ],
  },
  {
    id: "kc6",
    title: "Operational Environment (Agencies)",
    description:
      "Manages the integration layer between AI agents and external tools, APIs, code execution environments, and database systems. Ensures secure invocation of tools with proper authentication, input validation, sandboxing, and output verification to prevent unauthorized access and tool misuse.",
    threatIds: ["t2", "t3", "t4", "t10", "t11", "t12", "t13", "t15"],
    color: "border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10",
    subComponents: [
      {
        id: "kc6.1",
        title: "API Access",
        description: "Agents utilizing LLM capabilities to interact with APIs.",
        threatIds: ["t2", "t3", "t4", "t10", "t11", "t12", "t13", "t15"],
        subSubComponents: [
          {
            id: "kc6.1.1",
            title: "Limited API Access",
            description:
              "Agent generates some parameters for a predefined API call. Compromise can lead to API attacks via LLM-generated parameters.",
            threatIds: ["t2", "t3", "t4", "t10", "t11", "t12", "t13", "t15"],
          },
          {
            id: "kc6.1.2",
            title: "Extensive API Access",
            description:
              "Agent generates the entire API call. Compromise can lead to unwanted API calls and attacks.",
            threatIds: ["t2", "t3", "t4", "t10", "t11", "t12", "t13", "t15"],
          },
        ],
      },
      {
        id: "kc6.2",
        title: "Code Execution",
        description: "Agents utilizing LLM capabilities for code-related tasks.",
        threatIds: ["t2", "t3", "t4", "t10", "t11", "t12", "t13", "t15"],
        subSubComponents: [
          {
            id: "kc6.2.1",
            title: "Limited Code Execution Capability",
            description:
              "Agent generates parameters for a predefined function. Compromise can lead to code injection.",
            threatIds: ["t2", "t3", "t4", "t10", "t11", "t12", "t13", "t15"],
          },
          {
            id: "kc6.2.2",
            title: "Extensive Code Execution Capability",
            description:
              "Agent runs LLM-generated code. Compromise can lead to arbitrary code execution.",
            threatIds: ["t2", "t3", "t4", "t10", "t11", "t12", "t13", "t15"],
          },
        ],
      },
      {
        id: "kc6.3",
        title: "Database Execution",
        description: "Agents utilizing LLM capabilities to interact with databases.",
        threatIds: ["t2", "t3", "t4", "t10", "t11", "t12", "t13", "t15"],
        subSubComponents: [
          {
            id: "kc6.3.1",
            title: "Limited Database Execution Capability",
            description:
              "Agent runs specific queries/commands with limited permissions (e.g., read-only, parameterized writes). Compromise can lead to data exfiltration or limited malicious writes.",
            threatIds: ["t2", "t3", "t4", "t10", "t11", "t12", "t13", "t15"],
          },
          {
            id: "kc6.3.2",
            title: "Extensive Database Execution Capability",
            description:
              "Agent generates and runs all CRUD operations. Compromise can lead to major data alteration, deletion, or leakage.",
            threatIds: ["t2", "t3", "t4", "t10", "t11", "t12", "t13", "t15"],
          },
          {
            id: "kc6.3.3",
            title: "Agent Memory or Context Data Sources (RAG)",
            description:
              "Agent uses external datasources for context or updates records. Compromise can disrupt data or provide malformed information.",
            threatIds: ["t2", "t3", "t4", "t10", "t11", "t12", "t13", "t15"],
          },
        ],
      },
      {
        id: "kc6.4",
        title: "Web Access Capabilities (Web-Use)",
        description:
          "Agent utilizing LLM for browser operations. Compromise (often from untrusted web content) can lead to unwanted operations on behalf of the user.",
        threatIds: ["t2", "t3", "t4", "t10", "t11", "t12", "t13", "t15"],
      },
      {
        id: "kc6.5",
        title: "Controlling PC Operations (PC-Use)",
        description:
          "Agent utilizing LLM for OS operations, including file system. Compromise can lead to unwanted operations, data leakage, or malicious actions like encrypting files.",
        threatIds: ["t2", "t3", "t4", "t10", "t11", "t12", "t13", "t15"],
      },
      {
        id: "kc6.6",
        title: "Operating Critical Systems",
        description:
          "Agent utilizing LLM to operate critical systems (e.g., SCADA). Compromise can cause catastrophic failures.",
        threatIds: ["t2", "t3", "t4", "t10", "t11", "t12", "t13", "t15"],
      },
      {
        id: "kc6.7",
        title: "Access to IoT Devices",
        description:
          "Agent controlling IoT devices. Compromise could impact the operational environment or misuse devices.",
        threatIds: ["t2", "t3", "t4", "t10", "t11", "t12", "t13", "t15"],
      },
    ],
  },
];

// --- Helper function to build a map for easy lookup of parsed component data ---
interface MyComponentData {
  id: string;
  title?: string;
  description?: string;
  threatIds?: string[];
  color?: string;
  children?: MyComponentData[];
}

const myComponentDataMap: Map<string, MyComponentData> = new Map();

// Normalize ID to lowercase for matching (both dot and dash notation map to same key)
function normalizeId(id: string): string {
  return id.replace(/-/g, ".").toLowerCase();
}

interface ParsedComponent {
  id: string;
  title: string;
  description: string;
  threatIds?: string[];
  color?: string;
  subComponents?: ParsedSubComponent[];
}

interface ParsedSubComponent {
  id: string;
  title: string;
  description: string;
  threatIds?: string[];
  color?: string;
  subSubComponents?: ParsedSubSubComponent[];
}

interface ParsedSubSubComponent {
  id: string;
  title: string;
  description: string;
  threatIds?: string[];
  color?: string;
}

function populateComponentMap(components: ParsedComponent[], map: Map<string, MyComponentData>) {
  components.forEach((comp) => {
    const children: MyComponentData[] = [];
    if (comp.subComponents) {
      comp.subComponents.forEach((sc: ParsedSubComponent) => {
        const grandChildren: MyComponentData[] = [];
        if (sc.subSubComponents) {
          sc.subSubComponents.forEach((ssc: ParsedSubSubComponent) => {
            grandChildren.push({
              id: ssc.id,
              title: ssc.title,
              description: ssc.description,
              threatIds: ssc.threatIds,
              color: ssc.color,
              children: [],
            });
          });
        }
        children.push({
          id: sc.id,
          title: sc.title,
          description: sc.description,
          threatIds: sc.threatIds,
          color: sc.color,
          children: grandChildren,
        });
      });
    }

    map.set(normalizeId(comp.id), {
      id: comp.id,
      title: comp.title,
      description: comp.description,
      threatIds: comp.threatIds,
      color: comp.color,
      children: children,
    });
    // Recursively add children to the map as well, so they can be found by ID
    if (children.length > 0) {
      populateComponentMapInternal(children, map);
    }
  });
}

// Helper for populateComponentMap to handle recursion for children
function populateComponentMapInternal(
  components: MyComponentData[],
  map: Map<string, MyComponentData>,
) {
  components.forEach((comp) => {
    map.set(normalizeId(comp.id), comp);
    if (comp.children && comp.children.length > 0) {
      populateComponentMapInternal(comp.children, map);
    }
  });
}

populateComponentMap(parsedComponentsData, myComponentDataMap);
// --- End helper function ---

// Full component framework data - using dot notation consistently
export const frameworkData: ComponentNode[] = [
  {
    id: "kc1",
    title: "Language Models (KC1)",
    description:
      "The core cognitive engine or 'brain' of agentic systems, responsible for understanding, reasoning, planning, and generating responses.",
    threatCategories: ["Prompt Injection", "Training Data Poisoning"],
    color: "border-primary/30 bg-primary/5 hover:bg-primary/10",
    icon: "Brain",
    relatedArchitectures: [
      { id: "sequential", name: "Sequential Agent", relevance: "primary" },
      { id: "hierarchical", name: "Hierarchical", relevance: "primary" },
      { id: "collaborative", name: "Collaborative Swarm", relevance: "primary" },
    ],
    relatedComponents: ["kc3", "kc4"],
    securityImplications:
      "Foundation models can propagate hallucinations, be susceptible to intent manipulation, develop misaligned behaviors, and potentially manipulate human trust. Security controls must consider both the model's inherent capabilities and how it interfaces with other components.",
    implementationConsiderations:
      "Implementation should focus on robust prompt engineering with explicit boundaries, input validation, model alignment techniques, and monitoring for unexpected outputs or behaviors.",
    children: [
      {
        id: "kc1.1",
        title: "Large Language Models (LLMs)",
        description:
          "Core cognitive engine utilizing pre-trained foundation models for reasoning, planning, and generation",
        threatCategories: ["Model Extraction", "Input Validation Bypass"],
        color: "border-primary/20 bg-primary/5 hover:bg-primary/10",
      },
      {
        id: "kc1.2",
        title: "Multimodal LLMs (MLLMs)",
        description:
          "LLMs capable of processing and generating information across multiple data types",
        threatCategories: ["Cross-Modal Attacks", "Adversarial Examples"],
        color: "border-primary/20 bg-primary/5 hover:bg-primary/10",
      },
      {
        id: "kc1.3",
        title: "Small-Language Models (SLMs)",
        description:
          "Language models with fewer parameters, designed for specific tasks or use cases",
        color: "border-primary/20 bg-primary/5 hover:bg-primary/10",
      },
      {
        id: "kc1.4",
        title: "Fine-tuned Models",
        description: "Language models that undergo additional training on specific datasets",
        color: "border-primary/20 bg-primary/5 hover:bg-primary/10",
      },
    ],
  },
  {
    id: "kc2",
    title: "Orchestration (KC2)",
    description:
      "Control flow mechanisms that dictate the agent's behavior, information flow, and decision-making processes between components or agents.",
    threatCategories: ["Intent Breaking", "Communication Poisoning"],
    color: "border-architecture/30 bg-architecture/5 hover:bg-architecture/10",
    icon: "Workflow",
    relatedArchitectures: [
      { id: "hierarchical", name: "Hierarchical", relevance: "primary" },
      { id: "collaborative", name: "Collaborative Swarm", relevance: "primary" },
    ],
    relatedComponents: ["kc1", "kc3", "kc6"],
    securityImplications:
      "Orchestration mechanisms can be manipulated to achieve unauthorized goals, obscure actions, impersonate trusted entities, overwhelm human oversight, or corrupt inter-agent communications.",
    implementationConsiderations:
      "Secure implementation requires robust authentication and authorization between agents, validated communication protocols, auditable workflows, and defined trust boundaries.",
    children: [
      {
        id: "kc2.1",
        title: "Workflows",
        description: "Structured, pre-defined sequence of tasks or steps that agents follow",
        color: "border-architecture/20 bg-architecture/5 hover:bg-architecture/10",
      },
      {
        id: "kc2.2",
        title: "Hierarchical Planning",
        description:
          "Multiple agents collaborating via an orchestrator that decomposes and routes tasks",
        color: "border-architecture/20 bg-architecture/5 hover:bg-architecture/10",
      },
      {
        id: "kc2.3",
        title: "Multi-agent Collaboration",
        description: "Multiple agents working together, sharing information and resources",
        color: "border-architecture/20 bg-architecture/5 hover:bg-architecture/10",
      },
    ],
  },
  {
    id: "kc3",
    title: "Reasoning/Planning (KC3)",
    description:
      "Paradigms that enable AI agents to solve complex problems by breaking down tasks, making decisions, and forming plans.",
    threatCategories: ["Reasoning Manipulation", "Goal Misalignment"],
    color: "border-control/30 bg-control/5 hover:bg-control/10",
    icon: "BrainCircuit",
    relatedArchitectures: [
      { id: "sequential", name: "Sequential Agent", relevance: "primary" },
      { id: "hierarchical", name: "Hierarchical", relevance: "secondary" },
      { id: "collaborative", name: "Collaborative Swarm", relevance: "secondary" },
    ],
    relatedComponents: ["kc1", "kc4"],
    securityImplications:
      "Reasoning processes can propagate hallucinations, be manipulated to achieve unauthorized goals, exhibit misaligned behaviors, create untraceable decision trails, or craft manipulative responses.",
    implementationConsiderations:
      "Security requires verification at key decision points, traceability of reasoning chains, validation of intermediate conclusions, and checks for logic consistency and alignment with intended goals.",
    children: [
      {
        id: "kc3.1",
        title: "Structured Planning / Execution",
        description:
          "Decomposing tasks into a formal plan with separate planner/executor components",
        color: "border-control/20 bg-control/5 hover:bg-control/10",
      },
      {
        id: "kc3.2",
        title: "ReAct (Reason + Act)",
        description: "Dynamically interleaves reasoning steps with actions based on feedback",
        color: "border-control/20 bg-control/5 hover:bg-control/10",
      },
      {
        id: "kc3.3",
        title: "Chain of Thought (CoT)",
        description: "Enhances reasoning quality by prompting step-by-step thinking",
        color: "border-control/20 bg-control/5 hover:bg-control/10",
      },
      {
        id: "kc3.4",
        title: "Tree of Thoughts (ToT)",
        description: "Explores multiple reasoning paths in parallel with backtracking",
        color: "border-control/20 bg-control/5 hover:bg-control/10",
      },
    ],
  },
  {
    id: "kc4",
    title: "Memory Modules (KC4)",
    description:
      "Systems that enable agents to retain information across interactions, with varying scope and security boundaries.",
    threatCategories: ["Memory Poisoning", "Data Leakage"],
    color: "border-primary/30 bg-primary/5 hover:bg-primary/10",
    icon: "Database",
    relatedArchitectures: [
      { id: "sequential", name: "Sequential Agent", relevance: "primary" },
      { id: "hierarchical", name: "Hierarchical", relevance: "secondary" },
      { id: "collaborative", name: "Collaborative Swarm", relevance: "primary" },
    ],
    relatedComponents: ["kc1", "kc3", "kc6"],
    securityImplications:
      "Memory systems can be poisoned with malicious data, cause information leakage across contexts, store and amplify hallucinations, facilitate goal manipulation, enable tampering with audit trails, or allow communication poisoning in multi-agent systems.",
    implementationConsiderations:
      "Implementation should include input validation before storage, encryption for sensitive data, strict access controls, memory compartmentalization, and time-to-live (TTL) policies for sensitive information.",
    children: [
      {
        id: "kc4.1",
        title: "In-agent session memory",
        description: "Memory limited to a single agent and a single session",
        color: "border-primary/20 bg-primary/5 hover:bg-primary/10",
      },
      {
        id: "kc4.2",
        title: "Cross-agent session memory",
        description: "Memory shared across multiple agents but limited to a single session",
        color: "border-primary/20 bg-primary/5 hover:bg-primary/10",
      },
      {
        id: "kc4.3",
        title: "In-agent cross-session memory",
        description: "Memory limited to a single agent but shared across multiple sessions",
        color: "border-primary/20 bg-primary/5 hover:bg-primary/10",
      },
      {
        id: "kc4.4",
        title: "Cross-agent cross-session memory",
        description: "Memory shared across multiple agents and sessions",
        color: "border-primary/20 bg-primary/5 hover:bg-primary/10",
      },
      {
        id: "kc4.5",
        title: "In-agent cross-user memory",
        description: "Memory limited to a single agent but shared across multiple users",
        color: "border-primary/20 bg-primary/5 hover:bg-primary/10",
      },
      {
        id: "kc4.6",
        title: "Cross-agent cross-user memory",
        description: "Memory shared across multiple agents and users",
        color: "border-primary/20 bg-primary/5 hover:bg-primary/10",
      },
    ],
  },
  {
    id: "kc5",
    title: "Tool Integration (KC5)",
    description:
      "Frameworks allowing agents to extend capabilities beyond text by using external tools, APIs, functions, data stores, and services.",
    threatCategories: ["Tool Misuse", "Privilege Compromise"],
    color: "border-threat/30 bg-threat/5 hover:bg-threat/10",
    icon: "Tool",
    relatedArchitectures: [
      { id: "sequential", name: "Sequential Agent", relevance: "primary" },
      { id: "hierarchical", name: "Hierarchical", relevance: "primary" },
      { id: "collaborative", name: "Collaborative Swarm", relevance: "primary" },
    ],
    relatedComponents: ["kc2", "kc6"],
    securityImplications:
      "Tool integration can lead to misuse of tools in harmful ways, privilege escalation through excessive permissions, manipulation of tools to achieve unauthorized goals, subtle misalignments in tool usage, lack of proper auditability, and unexpected code execution.",
    implementationConsiderations:
      "Secure implementation requires running tools in isolated environments with strict resource limitations, implementing least privilege access, validating tool inputs/outputs, and maintaining detailed audit logs of all tool invocations.",
    children: [
      {
        id: "kc5.1",
        title: "Flexible Libraries / SDK Features",
        description:
          "Code-level building blocks offering high flexibility (e.g., LangChain, CrewAI)",
        color: "border-threat/20 bg-threat/5 hover:bg-threat/10",
      },
      {
        id: "kc5.2",
        title: "Managed Platforms / Services",
        description:
          "Vendor-provided solutions handling infrastructure (e.g., Amazon Bedrock, Microsoft Copilot)",
        color: "border-threat/20 bg-threat/5 hover:bg-threat/10",
      },
      {
        id: "kc5.3",
        title: "Managed APIs",
        description:
          "Vendor-hosted services providing higher-level abstractions (e.g., OpenAI Assistants API)",
        color: "border-threat/20 bg-threat/5 hover:bg-threat/10",
      },
    ],
  },
  {
    id: "kc6",
    title: "Operational Environment (KC6)",
    description:
      "Capabilities that allow agents to interface with external environments through tools and function calls, including APIs, code execution, database access, and more.",
    threatCategories: ["Resource Exhaustion", "Container Escape"],
    color: "border-control/30 bg-control/5 hover:bg-control/10",
    icon: "Cloud",
    relatedArchitectures: [
      { id: "sequential", name: "Sequential Agent", relevance: "secondary" },
      { id: "hierarchical", name: "Hierarchical", relevance: "primary" },
      { id: "collaborative", name: "Collaborative Swarm", relevance: "primary" },
    ],
    relatedComponents: ["kc2", "kc4", "kc5"],
    securityImplications:
      "Operational environments create risk of misusing access to external systems, exploiting excessive permissions, overwhelming services, generating excessive approval requests, executing malicious code, using external systems for side channels, operating outside monitoring boundaries, or leveraging operational access to manipulate humans.",
    implementationConsiderations:
      "Security implementation should include strong isolation through containerization, strict network access controls, mandatory resource limits, comprehensive logging of all operations, and human approval for critical actions.",
    children: [
      {
        id: "kc6.1",
        title: "API Access",
        description: "Agents utilizing LLM capabilities to interact with APIs",
        color: "border-control/20 bg-control/5 hover:bg-control/10",
        children: [
          {
            id: "kc6.1.1",
            title: "Limited API Access",
            description: "Agent generates some parameters for a predefined API call",
            color: "border-control/10 bg-transparent hover:bg-control/5",
          },
          {
            id: "kc6.1.2",
            title: "Extensive API Access",
            description: "Agent generates the entire API call",
            color: "border-control/10 bg-transparent hover:bg-control/5",
          },
        ],
      },
      {
        id: "kc6.2",
        title: "Code Execution",
        description: "Agents utilizing LLM capabilities for code-related tasks",
        color: "border-control/20 bg-control/5 hover:bg-control/10",
        children: [
          {
            id: "kc6.2.1",
            title: "Limited Code Execution",
            description: "Agent generates parameters for a predefined function",
            color: "border-control/10 bg-transparent hover:bg-control/5",
          },
          {
            id: "kc6.2.2",
            title: "Extensive Code Execution",
            description: "Agent runs LLM-generated code",
            color: "border-control/10 bg-transparent hover:bg-control/5",
          },
        ],
      },
      {
        id: "kc6.3",
        title: "Database Execution",
        description: "Agents utilizing LLM capabilities to interact with databases",
        color: "border-control/20 bg-control/5 hover:bg-control/10",
        children: [
          {
            id: "kc6.3.1",
            title: "Limited Database Execution",
            description: "Agent runs specific queries with limited permissions",
            color: "border-control/10 bg-transparent hover:bg-control/5",
          },
          {
            id: "kc6.3.2",
            title: "Extensive Database Execution",
            description: "Agent generates and runs all CRUD operations",
            color: "border-control/10 bg-transparent hover:bg-control/5",
          },
          {
            id: "kc6.3.3",
            title: "RAG Data Sources",
            description: "Agent uses external datasources for context or updates records",
            color: "border-control/10 bg-transparent hover:bg-control/5",
          },
        ],
      },
      {
        id: "kc6.4",
        title: "Web Access (Web-Use)",
        description: "Agent utilizing LLM for browser operations",
        color: "border-control/20 bg-control/5 hover:bg-control/10",
      },
      {
        id: "kc6.5",
        title: "PC Operations (PC-Use)",
        description: "Agent utilizing LLM for OS operations, including file system",
        color: "border-control/20 bg-control/5 hover:bg-control/10",
      },
      {
        id: "kc6.6",
        title: "Operating Critical Systems",
        description: "Agent utilizing LLM to operate critical systems (e.g., SCADA)",
        color: "border-control/20 bg-control/5 hover:bg-control/10",
      },
      {
        id: "kc6.7",
        title: "Access to IoT Devices",
        description: "Agent controlling IoT devices",
        color: "border-control/20 bg-control/5 hover:bg-control/10",
      },
    ],
  },
];

// Recursive function to update the user's frameworkData structure with parsed data
function updateUserNode(userNode: ComponentNode): void {
  const normalizedUserNodeId = normalizeId(userNode.id);
  const myData = myComponentDataMap.get(normalizedUserNodeId);

  if (myData) {
    userNode.title = myData.title || userNode.title;
    userNode.description = myData.description || userNode.description;
    userNode.color = myData.color || userNode.color;

    if (myData.threatIds && myData.threatIds.length > 0) {
      userNode.threatIds = myData.threatIds;
      userNode.threatCategories = myData.threatIds.map((tid) => threatIdToTitleMap[tid] || tid);
    } else if (userNode.threatCategories && userNode.threatCategories.length > 0) {
      // Keep existing threat categories if they exist
    } else {
      userNode.threatCategories = [];
    }
  }

  if (userNode.children && userNode.children.length > 0) {
    userNode.children.forEach((childNode) => updateUserNode(childNode));
  }
}

// Perform the update
frameworkData.forEach((topLevelNode) => updateUserNode(topLevelNode));

/** Find a component (or subcomponent) in the framework tree by id */
export function getComponentById(id: string): ComponentNode | undefined {
  const nid = id.replace(/-/g, ".").toLowerCase();
  function search(nodes: ComponentNode[]): ComponentNode | undefined {
    for (const node of nodes) {
      if (normalizeId(node.id) === nid) return node;
      if (node.children?.length) {
        const found = search(node.children);
        if (found) return found;
      }
    }
    return undefined;
  }
  return search(frameworkData);
}

/** Get main component id from any component id (e.g. kc1.1 -> kc1, kc1-1 -> kc1) */
export function getMainComponentId(id: string): string {
  const normalized = id.replace(/-/g, ".").toLowerCase();
  const match = normalized.match(/^kc\d+/i);
  return match ? match[0] : id;
}

/** Build flat map of id -> component for lookup (includes all nodes) */
export function buildComponentMap(): Map<string, ComponentNode> {
  const map = new Map<string, ComponentNode>();
  function add(nodes: ComponentNode[]) {
    for (const node of nodes) {
      map.set(normalizeId(node.id), node);
      if (node.children?.length) add(node.children);
    }
  }
  add(frameworkData);
  return map;
}

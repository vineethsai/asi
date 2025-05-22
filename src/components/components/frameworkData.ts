export type ComponentNode = {
  id: string;
  title: string;
  description?: string;
  threatCategories?: string[]; // These will be threat titles
  controls?: string[]; // This field is not in our MD data, will be preserved if existing
  color: string;
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

// Data parsed from your components.md (simulated structure based on previous interactions)
const parsedComponentsData = [
  {
    id: "kc1",
    title: "Language Models (LLMs)",
    description: "The core cognitive engine or \"brain\" of the agent (e.g., GPT-4, Claude), responsible for understanding, reasoning, planning, and generating responses. This includes various types of language models.",
    threatIds: ["t5", "t6", "t7", "t15"],
    color: "border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10",
    subComponents: [
      {
        id: "kc1.1",
        title: "Large Language Models (LLMs)",
        description: "Core cognitive engine utilizing pre-trained foundation models for reasoning, planning, and generation, primarily directed via prompt engineering. Operates within constraints like context window, latency, and cost.",
      },
      {
        id: "kc1.2",
        title: "Multimodal LLMs (MLLMs)",
        description: "LLMs capable of processing and/or generating information across multiple data types beyond text (e.g., images, audio), enabling agents to perform a wider variety of tasks.",
      },
      {
        id: "kc1.3",
        title: "Small-Language Models (SLMs)",
        description: "Language models with fewer parameters, trained on smaller, focused datasets, designed for specific tasks or use cases. Characterized by smaller weight space, parameter size, and context window compared to LLMs.",
      },
      {
        id: "kc1.4",
        title: "Fine-tuned Models",
        description: "Language models (LLMs/MLLMs) that undergo additional training on specific datasets to specialize their capabilities, enhancing performance, adopting personas, or improving reliability for particular tasks.",
      },
    ],
  },
  {
    id: "kc2",
    title: "Orchestration (Control Flow)",
    description: "Mechanisms that dictate the agent's overall behavior, information flow, and decision-making processes. The specific mechanism depends on the architecture and impacts responsiveness and efficiency.",
    threatIds: ["t6", "t8", "t9", "t10", "t12", "t13", "t14"],
    color: "border-green-500/30 bg-green-500/5 hover:bg-green-500/10",
    subComponents: [
      { id: "kc2.1", title: "Workflows", description: "Structured, pre-defined sequence of tasks or steps that agents follow to achieve a goal, defining the flow of information and actions. Can be linear, conditional, or iterative." },
      { id: "kc2.2", title: "Hierarchical Planning", description: "Multiple agents collaborating via an orchestrator (router) that decomposes tasks, routes sub-tasks to specialized agents, and monitors performance." },
      { id: "kc2.3", title: "Multi-agent Collaboration", description: "Multiple agents working together, communicating and coordinating actions, sharing information and resources to achieve a common goal. Useful for complex tasks requiring diverse skills." },
    ],
  },
  {
    id: "kc3",
    title: "Reasoning / Planning Paradigm",
    description: "How agents utilize LLMs to solve complex tasks requiring multiple steps and strategic thinking by breaking down high-level tasks into smaller sub-tasks.",
    threatIds: ["t5", "t6", "t7", "t8", "t15"],
    color: "border-yellow-500/30 bg-yellow-500/5 hover:bg-yellow-500/10",
    subComponents: [
      { id: "kc3.1", title: "Structured Planning / Execution", description: "Focuses on decomposing tasks into a formal plan, defining sequences of actions (often involving tool calls), and executing the plan, sometimes with separate planner/executor components (e.g., ReWoo, LLM Compiler, Plan-and-Execute)." },
      { id: "kc3.2", title: "ReAct (Reason + Act)", description: "Dynamically interleaves reasoning steps with actions (like using tools or querying APIs) and updates reasoning based on feedback." },
      { id: "kc3.3", title: "Chain of Thought (CoT)", description: "Enhances reasoning quality by prompting step-by-step \"thinking,\" inducing an LLM to generate a set of \"thoughts\" before arriving at a final action or conclusion." },
      { id: "kc3.4", title: "Tree of Thoughts (ToT)", description: "Generalizes CoT by exploring multiple reasoning paths and plans in parallel with lookahead, backtracking, and self-evaluation." },
    ],
  },
  {
    id: "kc4",
    title: "Memory Modules",
    description: "Enable the agent to retain short-term (immediate context) and long-term information (past interactions, knowledge) for coherent and personalized interactions. Context sensitivity is used to reduce risk. RAG with vector databases is common for long-term memory.",
    threatIds: ["t1", "t3", "t5", "t6", "t8", "t12"],
    color: "border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10",
    subComponents: [
      { id: "kc4.1", title: "In-agent session memory", description: "Memory limited to a single agent and a single session." },
      { id: "kc4.2", title: "Cross-agent session memory", description: "Memory shared across multiple agents but limited to a single session." },
      { id: "kc4.3", title: "In-agent cross-session memory", description: "Memory limited to a single agent but shared across multiple sessions." },
      { id: "kc4.4", title: "Cross-agent cross-session memory", description: "Memory shared across multiple agents and sessions." },
      { id: "kc4.5", title: "In-agent cross-user memory", description: "Memory limited to a single agent but shared across multiple users." },
      { id: "kc4.6", title: "Cross-agent cross-user memory", description: "Memory shared across multiple agents and users." },
    ],
  },
  {
    id: "kc5",
    title: "Tool Integration Frameworks",
    description: "Allow agents to extend capabilities by using external tools (APIs, functions, data stores) to interact with the real world or other systems. Manages tool selection and use.",
    threatIds: ["t2", "t3", "t6", "t8", "t11"],
    color: "border-pink-500/30 bg-pink-500/5 hover:bg-pink-500/10",
    subComponents: [
      { id: "kc5.1", title: "Flexible Libraries / SDK Features", description: "Code-level building blocks (e.g., LangChain, CrewAI) or API capabilities (OpenAI Tool Use) offering high flexibility but requiring more coding effort." },
      { id: "kc5.2", title: "Managed Platforms / Services", description: "Vendor-provided solutions (e.g., Amazon Bedrock Agents, Microsoft Copilot Platform) handling infrastructure and simplifying setup, often with easier ecosystem integration and low-code interfaces." },
      { id: "kc5.3", title: "Managed APIs", description: "Vendor-hosted services (e.g., OpenAI Assistants API) providing higher-level abstractions, managing state and aspects of tool orchestration via API calls." },
    ],
  },
  {
    id: "kc6",
    title: "Operational Environment (Agencies)",
    description: "API access, code execution, database operations",
    threatIds: ["t2", "t3", "t4", "t10", "t11", "t12", "t13", "t15"],
    color: "border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10",
    subComponents: [
      {
        id: "kc6.1",
        title: "API Access",
        description: "Agents utilizing LLM capabilities to interact with APIs.",
        subSubComponents: [
          { id: "kc6.1.1", title: "Limited API Access", description: "Agent generates some parameters for a predefined API call. Compromise can lead to API attacks via LLM-generated parameters." },
          { id: "kc6.1.2", title: "Extensive API Access", description: "Agent generates the entire API call. Compromise can lead to unwanted API calls and attacks." },
        ],
      },
      {
        id: "kc6.2",
        title: "Code Execution",
        description: "Agents utilizing LLM capabilities for code-related tasks.",
        subSubComponents: [
          { id: "kc6.2.1", title: "Limited Code Execution Capability", description: "Agent generates parameters for a predefined function. Compromise can lead to code injection." },
          { id: "kc6.2.2", title: "Extensive Code Execution Capability", description: "Agent runs LLM-generated code. Compromise can lead to arbitrary code execution." },
        ],
      },
      {
        id: "kc6.3",
        title: "Database Execution",
        description: "Agents utilizing LLM capabilities to interact with databases.",
        subSubComponents: [
          { id: "kc6.3.1", title: "Limited Database Execution Capability", description: "Agent runs specific queries/commands with limited permissions (e.g., read-only, parameterized writes). Compromise can lead to data exfiltration or limited malicious writes." },
          { id: "kc6.3.2", title: "Extensive Database Execution Capability", description: "Agent generates and runs all CRUD operations. Compromise can lead to major data alteration, deletion, or leakage." },
          { id: "kc6.3.3", title: "Agent Memory or Context Data Sources (RAG)", description: "Agent uses external datasources for context or updates records. Compromise can disrupt data or provide malformed information." },
        ],
      },
      { id: "kc6.4", title: "Web Access Capabilities (Web-Use)", description: "Agent utilizing LLM for browser operations. Compromise (often from untrusted web content) can lead to unwanted operations on behalf of the user." },
      { id: "kc6.5", title: "Controlling PC Operations (PC-Use)", description: "Agent utilizing LLM for OS operations, including file system. Compromise can lead to unwanted operations, data leakage, or malicious actions like encrypting files." },
      { id: "kc6.6", title: "Operating Critical Systems", description: "Agent utilizing LLM to operate critical systems (e.g., SCADA). Compromise can cause catastrophic failures." },
      { id: "kc6.7", title: "Access to IoT Devices", description: "Agent controlling IoT devices. Compromise could impact the operational environment or misuse devices." },
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
  children?: MyComponentData[]; // Parsed children
}

const myComponentDataMap: Map<string, MyComponentData> = new Map();

function normalizeId(id: string): string {
  return id.replace(/-/g, '.').toLowerCase(); // Normalize to dot notation and lowercase for matching
}

function populateComponentMap(components: any[], map: Map<string, MyComponentData>) {
  components.forEach(comp => {
    const children: MyComponentData[] = [];
    if (comp.subComponents) {
      comp.subComponents.forEach((sc: any) => {
        const grandChildren: MyComponentData[] = [];
        if (sc.subSubComponents) {
            sc.subSubComponents.forEach((ssc: any) => {
                grandChildren.push({
                    id: ssc.id,
                    title: ssc.title,
                    description: ssc.description,
                    threatIds: ssc.threatIds, // if they exist at this level
                    color: ssc.color,       // if it exists
                    children: [], // Assuming no further nesting in MD for these
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
      children: children, // Store parsed children
    });
    // Recursively add children to the map as well, so they can be found by ID
    if (children.length > 0) {
        populateComponentMapInternal(children, map);
    }
  });
}

// Helper for populateComponentMap to handle recursion for children
function populateComponentMapInternal(components: MyComponentData[], map: Map<string, MyComponentData>) {
    components.forEach(comp => {
        map.set(normalizeId(comp.id), comp);
        if (comp.children && comp.children.length > 0) {
            populateComponentMapInternal(comp.children, map);
        }
    });
}

populateComponentMap(parsedComponentsData, myComponentDataMap);
// --- End helper function ---

// Full component framework data (User's original structure to be updated)
export const frameworkData: ComponentNode[] = [
  {
    id: "kc1", // Will be updated
    title: "Language Models", // Original: Language Models
    description: "Foundation models and multimodal capabilities", // Original
    threatCategories: ["Prompt Injection", "Training Data Poisoning"], // Original, will be updated
    color: "border-primary/30 bg-primary/5 hover:bg-primary/10", // Original
    children: [
      {
        id: "kc1-1", // Corresponds to kc1.1
        title: "Foundation Models", // Original
        description: "Large language models that serve as the base for agentic systems", // Original
        threatCategories: ["Model Extraction", "Input Validation Bypass"], // Original
        color: "border-primary/20 bg-primary/5 hover:bg-primary/10", // Original
        children: [
          {
            id: "kc1-1-1", // No direct full match in my simplified parsedComponentsData for this level of detail
            title: "Base Models", // Original
            description: "Pre-trained models before fine-tuning", // Original
            color: "border-primary/10 bg-transparent hover:bg-primary/5", // Original
            // threatCategories will remain original if no specific data for kc1.1.1
          },
          {
            id: "kc1-1-2", // No direct full match
            title: "Fine-tuned Models", // Original
            description: "Models adapted for specific use cases or domains", // Original
            color: "border-primary/10 bg-transparent hover:bg-primary/5", // Original
          }
        ]
      },
      {
        id: "kc1-2", // Corresponds to kc1.2
        title: "Multimodal Capabilities", // Original
        description: "Processing of multiple types of inputs (text, images, audio)", // Original
        threatCategories: ["Cross-Modal Attacks", "Adversarial Examples"], // Original
        color: "border-primary/20 bg-primary/5 hover:bg-primary/10", // Original
      },
      // Adding kc1.3 and kc1.4 from my data if they are not in user's structure
      // This part needs careful thought: add new nodes or only update existing?
      // For now, let's only update existing nodes based on user's structure.
      // If the user wants a structure derived purely from components.md, that's a different request.
    ]
  },
  {
    id: "kc2",
    title: "Orchestration",
    description: "Workflows, planning, and multi-agent collaboration",
    threatCategories: ["Intent Breaking", "Communication Poisoning"],
    color: "border-architecture/30 bg-architecture/5 hover:bg-architecture/10",
    children: [
      {
        id: "kc2-1", // Corresponds to kc2.1
        title: "Task Planning", // Original
        description: "Decomposition of complex tasks into subtasks", // Original
        color: "border-architecture/20 bg-architecture/5 hover:bg-architecture/10",
      },
      {
        id: "kc2-2", // Corresponds to kc2.2
        title: "Agent Collaboration", // Original
        description: "Communication and coordination between multiple agents", // Original
        color: "border-architecture/20 bg-architecture/5 hover:bg-architecture/10",
        children: [
          {
            id: "kc2-2-1", // No direct full match in my simplified parsedComponentsData
            title: "Message Passing", // Original
            description: "Communication protocols between agents", // Original
            color: "border-architecture/10 bg-transparent hover:bg-architecture/5",
          },
          {
            id: "kc2-2-2", // No direct full match
            title: "Role Assignment", // Original
            description: "Dynamic allocation of responsibilities among agents", // Original
            color: "border-architecture/10 bg-transparent hover:bg-architecture/5",
          }
        ]
      },
      // Add kc2.3 if necessary
    ]
  },
  {
    id: "kc3",
    title: "Reasoning",
    description: "ReAct, Chain of Thought, planning paradigms",
    threatCategories: ["Reasoning Manipulation", "Goal Misalignment"],
    color: "border-control/30 bg-control/5 hover:bg-control/10",
    children: [
      {
        id: "kc3-1", // Corresponds to kc3.3 (Chain of Thought) or kc3.1 (Structured Planning)
                      // User's title is "Chain of Thought"
        title: "Chain of Thought", // Original
        description: "Step-by-step reasoning to solve problems", // Original
        color: "border-control/20 bg-control/5 hover:bg-control/10",
      },
      {
        id: "kc3-2", // Corresponds to kc3.2 (ReAct)
        title: "ReAct Framework", // Original
        description: "Reasoning and acting in an iterative process", // Original
        color: "border-control/20 bg-control/5 hover:bg-control/10",
      },
      // Add kc3.4 if necessary
    ]
  },
  {
    id: "kc4",
    title: "Memory",
    description: "Various memory types and security boundaries",
    threatCategories: ["Memory Poisoning", "Data Leakage"],
    color: "border-primary/30 bg-primary/5 hover:bg-primary/10", // Note: User used 'border-primary', my MD used 'border-purple' for KC4
    children: [
      {
        id: "kc4-1", // Corresponds to kc4.1
        title: "Short-term Memory", // Original
        description: "Temporary storage for current task execution", // Original
        color: "border-primary/20 bg-primary/5 hover:bg-primary/10",
      },
      {
        id: "kc4-2", // Corresponds to kc4.2, kc4.3, kc4.4 etc. This is a grouping.
        title: "Long-term Memory", // Original
        description: "Persistent storage across multiple interactions", // Original
        color: "border-primary/20 bg-primary/5 hover:bg-primary/10",
        children: [
          {
            id: "kc4-2-1", // No direct full match for "Vector Databases" as a sub-ID in my MD
            title: "Vector Databases", // Original
            description: "Storage and retrieval of embeddings", // Original
            color: "border-primary/10 bg-transparent hover:bg-primary/5",
          },
          {
            id: "kc4-2-2", // No direct full match
            title: "Knowledge Graphs", // Original
            description: "Structured representation of entities and relationships", // Original
            color: "border-primary/10 bg-transparent hover:bg-primary/5",
          }
        ]
      },
      // Add other kc4.x types if necessary
    ]
  },
  {
    id: "kc5",
    title: "Tool Integration",
    description: "Frameworks for extending capabilities",
    threatCategories: ["Tool Misuse", "Privilege Compromise"],
    color: "border-threat/30 bg-threat/5 hover:bg-threat/10", // My MD used 'border-pink' for KC5
    children: [
      {
        id: "kc5-1", // Corresponds to kc5.1, kc5.2, or kc5.3. User title is "API Connections"
        title: "API Connections", // Original
        description: "Integration with external services via APIs", // Original
        color: "border-threat/20 bg-threat/5 hover:bg-threat/10",
      },
      {
        id: "kc5-2", // User title is "Function Calling"
        title: "Function Calling", // Original
        description: "Execution of code or functions by the agent", // Original
        color: "border-threat/20 bg-threat/5 hover:bg-threat/10",
      }
    ]
  },
  {
    id: "kc6",
    title: "Environment", // My MD: "Operational Environment (Agencies)"
    description: "API access, code execution, database operations",
    threatCategories: ["Resource Exhaustion", "Container Escape"], // My MD: t2, t3, t4, t10, t11, t12, t13, t15
    color: "border-control/30 bg-control/5 hover:bg-control/10", // My MD: 'border-indigo' for KC6
    children: [
      {
        id: "kc6-1", // Corresponds to kc6.1 "API Access" or kc6.2 "Code Execution" etc.
                      // User title: "Execution Environment"
        title: "Execution Environment", // Original
        description: "Where code runs and computational resources", // Original
        color: "border-control/20 bg-control/5 hover:bg-control/10",
      },
      {
        id: "kc6-2", // User title: "Data Access"
        title: "Data Access", // Original
        description: "Interfaces to databases and storage systems", // Original
        color: "border-control/20 bg-control/5 hover:bg-control/10",
        children: [
          {
            id: "kc6-2-1", // Corresponds to parts of kc6.3 "Database Execution"
            title: "Read Operations", // Original
            description: "Data retrieval mechanisms", // Original
            color: "border-control/10 bg-transparent hover:bg-control/5",
          },
          {
            id: "kc6-2-2", // Corresponds to parts of kc6.3 "Database Execution"
            title: "Write Operations", // Original
            description: "Data modification mechanisms", // Original
            color: "border-control/10 bg-transparent hover:bg-control/5",
          }
        ]
      }
    ]
  }
];

// Recursive function to update the user's frameworkData structure
function updateUserNode(userNode: ComponentNode): void {
  const normalizedUserNodeId = normalizeId(userNode.id);
  const myData = myComponentDataMap.get(normalizedUserNodeId);

  if (myData) {
    userNode.title = myData.title || userNode.title; // Prefer myData.title if available
    userNode.description = myData.description || userNode.description; // Prefer myData.description
    userNode.color = myData.color || userNode.color; // Prefer myData.color

    if (myData.threatIds && myData.threatIds.length > 0) {
      userNode.threatCategories = myData.threatIds.map(tid => threatIdToTitleMap[tid] || tid);
    } else if (userNode.threatCategories && userNode.threatCategories.length > 0) {
      // Keep user's original threatCategories if myData has no threatIds for this specific node
    } else {
        userNode.threatCategories = []; // Default to empty if neither has it
    }
  }

  if (userNode.children && userNode.children.length > 0) {
    userNode.children.forEach(childNode => updateUserNode(childNode));
  }
}

// Perform the update
frameworkData.forEach(topLevelNode => updateUserNode(topLevelNode));

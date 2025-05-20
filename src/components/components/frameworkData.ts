
export type ComponentNode = {
  id: string;
  title: string;
  description?: string;
  threatCategories?: string[];
  controls?: string[];
  color: string;
  children?: ComponentNode[];
};

// Full component framework data
export const frameworkData: ComponentNode[] = [
  {
    id: "kc1",
    title: "Language Models",
    description: "Foundation models and multimodal capabilities",
    threatCategories: ["Prompt Injection", "Training Data Poisoning"],
    color: "border-primary/30 bg-primary/5 hover:bg-primary/10",
    children: [
      {
        id: "kc1-1",
        title: "Foundation Models",
        description: "Large language models that serve as the base for agentic systems",
        threatCategories: ["Model Extraction", "Input Validation Bypass"],
        color: "border-primary/20 bg-primary/5 hover:bg-primary/10",
        children: [
          {
            id: "kc1-1-1",
            title: "Base Models",
            description: "Pre-trained models before fine-tuning",
            color: "border-primary/10 bg-transparent hover:bg-primary/5"
          },
          {
            id: "kc1-1-2",
            title: "Fine-tuned Models",
            description: "Models adapted for specific use cases or domains",
            color: "border-primary/10 bg-transparent hover:bg-primary/5"
          }
        ]
      },
      {
        id: "kc1-2",
        title: "Multimodal Capabilities",
        description: "Processing of multiple types of inputs (text, images, audio)",
        threatCategories: ["Cross-Modal Attacks", "Adversarial Examples"],
        color: "border-primary/20 bg-primary/5 hover:bg-primary/10"
      }
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
        id: "kc2-1",
        title: "Task Planning",
        description: "Decomposition of complex tasks into subtasks",
        color: "border-architecture/20 bg-architecture/5 hover:bg-architecture/10"
      },
      {
        id: "kc2-2",
        title: "Agent Collaboration",
        description: "Communication and coordination between multiple agents",
        color: "border-architecture/20 bg-architecture/5 hover:bg-architecture/10",
        children: [
          {
            id: "kc2-2-1",
            title: "Message Passing",
            description: "Communication protocols between agents",
            color: "border-architecture/10 bg-transparent hover:bg-architecture/5"
          },
          {
            id: "kc2-2-2",
            title: "Role Assignment",
            description: "Dynamic allocation of responsibilities among agents",
            color: "border-architecture/10 bg-transparent hover:bg-architecture/5"
          }
        ]
      }
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
        id: "kc3-1",
        title: "Chain of Thought",
        description: "Step-by-step reasoning to solve problems",
        color: "border-control/20 bg-control/5 hover:bg-control/10"
      },
      {
        id: "kc3-2",
        title: "ReAct Framework",
        description: "Reasoning and acting in an iterative process",
        color: "border-control/20 bg-control/5 hover:bg-control/10"
      }
    ]
  },
  {
    id: "kc4",
    title: "Memory",
    description: "Various memory types and security boundaries",
    threatCategories: ["Memory Poisoning", "Data Leakage"],
    color: "border-primary/30 bg-primary/5 hover:bg-primary/10",
    children: [
      {
        id: "kc4-1",
        title: "Short-term Memory",
        description: "Temporary storage for current task execution",
        color: "border-primary/20 bg-primary/5 hover:bg-primary/10"
      },
      {
        id: "kc4-2",
        title: "Long-term Memory",
        description: "Persistent storage across multiple interactions",
        color: "border-primary/20 bg-primary/5 hover:bg-primary/10",
        children: [
          {
            id: "kc4-2-1",
            title: "Vector Databases",
            description: "Storage and retrieval of embeddings",
            color: "border-primary/10 bg-transparent hover:bg-primary/5"
          },
          {
            id: "kc4-2-2",
            title: "Knowledge Graphs",
            description: "Structured representation of entities and relationships",
            color: "border-primary/10 bg-transparent hover:bg-primary/5"
          }
        ]
      }
    ]
  },
  {
    id: "kc5",
    title: "Tool Integration",
    description: "Frameworks for extending capabilities",
    threatCategories: ["Tool Misuse", "Privilege Compromise"],
    color: "border-threat/30 bg-threat/5 hover:bg-threat/10",
    children: [
      {
        id: "kc5-1",
        title: "API Connections",
        description: "Integration with external services via APIs",
        color: "border-threat/20 bg-threat/5 hover:bg-threat/10"
      },
      {
        id: "kc5-2",
        title: "Function Calling",
        description: "Execution of code or functions by the agent",
        color: "border-threat/20 bg-threat/5 hover:bg-threat/10"
      }
    ]
  },
  {
    id: "kc6",
    title: "Environment",
    description: "API access, code execution, database operations",
    threatCategories: ["Resource Exhaustion", "Container Escape"],
    color: "border-control/30 bg-control/5 hover:bg-control/10",
    children: [
      {
        id: "kc6-1",
        title: "Execution Environment",
        description: "Where code runs and computational resources",
        color: "border-control/20 bg-control/5 hover:bg-control/10"
      },
      {
        id: "kc6-2",
        title: "Data Access",
        description: "Interfaces to databases and storage systems",
        color: "border-control/20 bg-control/5 hover:bg-control/10",
        children: [
          {
            id: "kc6-2-1",
            title: "Read Operations",
            description: "Data retrieval mechanisms",
            color: "border-control/10 bg-transparent hover:bg-control/5"
          },
          {
            id: "kc6-2-2",
            title: "Write Operations",
            description: "Data modification mechanisms",
            color: "border-control/10 bg-transparent hover:bg-control/5"
          }
        ]
      }
    ]
  }
];

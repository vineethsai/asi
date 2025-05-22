// Agentic Architectures Data
export type Architecture = {
  id: string;
  name: string;
  description: string;
  keyComponents: string[]; // component ids from components.md (e.g., "kc1", "kc1.1")
  threatIds: string[]; // threat ids (e.g., "t1", "t2")
  mitigationIds: string[]; // mitigation ids (e.g., "m1", "m2")
  tags?: string[];
  references?: { title: string; url: string }[];
  riskScore?: number;
  status?: "active" | "deprecated" | "experimental";
  version?: string;
  lastUpdated?: string;
  updatedBy?: string;
  color?: string;
  icon?: string;
  displayOrder?: number;
};

// --- PARSED DATA SIMULATION (from architectures_md_v2_raw content) ---
const parsedArchitecturesMd = [
  {
    id: "sequential",
    name: "Sequential Agent Architecture",
    description: "A straightforward linear workflow where a single agent processes input through planning, execution, and basic tool use. Focuses on simplicity with a clear chain of thought and limited memory. This basic pattern uses a single LLM as the cognitive core with a linear workflow.",
    keyComponents: ["kc1.1", "kc2.1", "kc3.3", "kc4.1", "kc5.1", "kc6.1.1"],
    threatIds: ["t1", "t5", "t6", "t7", "t8", "t15"],
    mitigationIds: ["m1", "m4", "m5", "m6", "m11", "m12"],
    tags: ["simple", "linear", "single-agent"],
    references: [
      { title: "OWASP Agentic Architectures", url: "https://owasp.org/agentic-architectures" }
    ],
    riskScore: 5,
    status: "active",
    version: "2024.1",
    lastUpdated: "2024-06-01",
    updatedBy: "vineeth",
    color: "#2563eb",
    icon: "flow-linear",
    displayOrder: 1
  },
  {
    id: "hierarchical",
    name: "Hierarchical Agent Architecture",
    description: "An orchestrator agent breaks down complex tasks and distributes them to specialized sub-agents. Each agent handles a specific domain using appropriate tools, with the orchestrator managing the overall process and integrating results. A more complex pattern with specialized sub-agents coordinated by an orchestrator.",
    keyComponents: ["kc1.1", "kc1.2", "kc2.2", "kc3.1", "kc4.2", "kc5.2", "kc6.2", "kc6.4"],
    threatIds: ["t1", "t2", "t3", "t5", "t6", "t7", "t8", "t9", "t10", "t11", "t12", "t13", "t14", "t15"],
    mitigationIds: ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m10", "m11", "m12"],
    tags: ["multi-agent", "orchestration", "complex"],
    riskScore: 8,
    status: "active",
    version: "2024.1",
    lastUpdated: "2024-06-01",
    updatedBy: "vineeth",
    color: "#22c55e",
    icon: "flow-hierarchical",
    displayOrder: 2
  },
  {
    id: "swarm",
    name: "Collaborative Agent Swarm",
    description: "A pattern where multiple peer agents work together without strict hierarchy. Agents communicate and coordinate their actions, sharing information and resources to achieve common goals, often exploring multiple solutions in parallel.",
    keyComponents: ["kc1.1", "kc1.2", "kc2.3", "kc3.4", "kc4.4", "kc5.1"],
    threatIds: ["t1", "t2", "t3", "t5", "t6", "t7", "t8", "t9", "t11", "t12", "t13", "t15"],
    mitigationIds: ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m10", "m11", "m12"],
    tags: ["collaborative", "swarm", "distributed"],
    riskScore: 7,
    status: "active",
    color: "#f59e42",
    icon: "flow-swarm",
    displayOrder: 3
  },
  {
    id: "reactive",
    name: "Reactive Agent Architecture",
    description: "Agents designed for responsive workflows, often event-driven, where actions are taken based on immediate inputs or changes in the environment. Utilizes ReAct paradigm and managed APIs for quick interactions.",
    keyComponents: ["kc1.2", "kc2.1", "kc3.2", "kc4.3", "kc5.3", "kc6.4"],
    threatIds: ["t1", "t2", "t3", "t5", "t6", "t7", "t8", "t11", "t12", "t15"],
    mitigationIds: ["m1", "m2", "m4", "m5", "m6", "m7", "m9", "m11", "m12"],
    tags: ["event-driven", "reactive"],
    riskScore: 6,
    status: "active",
    color: "#eab308",
    icon: "flow-reactive",
    displayOrder: 4
  },
  {
    id: "knowledge_intensive",
    name: "Knowledge-Intensive Agent Architecture",
    description: "Agents focused on leveraging and processing large volumes of external data, typically using sophisticated RAG approaches. Employs chain of thought for reasoning over retrieved knowledge and data connectors for accessing persistent knowledge stores.",
    keyComponents: ["kc1.1", "kc1.2", "kc2.1", "kc3.3", "kc4.3", "kc4.6", "kc5.1", "kc6.3.3", "kc6.4"],
    threatIds: ["t1", "t2", "t3", "t5", "t6", "t7", "t8", "t12", "t15"],
    mitigationIds: ["m1", "m2", "m4", "m5", "m6", "m7", "m11", "m12"],
    tags: ["knowledge-intensive", "rag", "data-driven"],
    riskScore: 7,
    status: "active",
    color: "#a21caf",
    icon: "flow-knowledge",
    displayOrder: 5
  }
];
// --- END PARSED DATA SIMULATION ---

export const architecturesData: Record<string, Architecture> = {
  sequential: {
    id: "sequential",
    name: "Sequential Agent",
    description:
      "A single agent or a simple pipeline where tasks are performed in a linear, step-by-step manner. Each step depends on the output of the previous one, with minimal branching or parallelism. Provides high traceability but limited adaptability.",
    keyComponents: ["kc1", "kc3", "kc4"],
    threatIds: ["t5", "t6", "t7", "t15"],
    mitigationIds: ["m5", "m6", "m12"]
  },
  hierarchical: {
    id: "hierarchical",
    name: "Hierarchical",
    description:
      "A multi-level agent system where a top-level orchestrator delegates tasks to specialized sub-agents. Enables decomposition of complex tasks and separation of concerns. Excellent for scaling to complex problems through structured delegation.",
    keyComponents: ["kc1", "kc2", "kc3", "kc4", "kc5", "kc6"],
    threatIds: ["t6", "t8", "t9", "t10", "t12", "t13", "t14"],
    mitigationIds: ["m3", "m6", "m7", "m8", "m9"]
  },
  collaborative: {
    id: "collaborative",
    name: "Collaborative Swarm",
    description:
      "Multiple agents work together, often in a peer-to-peer or loosely coordinated fashion, to solve problems or achieve goals. Emphasizes communication, redundancy, and distributed decision-making. Provides high fault tolerance but can be difficult to explain and control.",
    keyComponents: ["kc1", "kc2", "kc3", "kc4", "kc6"],
    threatIds: ["t9", "t12", "t13", "t14"],
    mitigationIds: ["m7", "m8", "m11"]
  },
  reactive: {
    id: "reactive",
    name: "Reactive",
    description:
      "Agents that respond to stimuli with predefined actions or patterns, often using the ReAct (Reasoning+Acting) paradigm. Highly adaptable to changing conditions and excellent for real-time response systems. Balances structure with flexibility.",
    keyComponents: ["kc1", "kc2", "kc3", "kc5", "kc6"],
    threatIds: ["t2", "t4", "t7", "t11", "t15"],
    mitigationIds: ["m1", "m3", "m4", "m9", "m10"]
  },
  knowledge: {
    id: "knowledge",
    name: "Knowledge-Intensive",
    description:
      "Architecture focused on extensive knowledge retrieval and processing capabilities. Leverages large contextual databases and sophisticated retrieval mechanisms to inform agent decisions. Excellent for research, reasoning, and information synthesis tasks.",
    keyComponents: ["kc1", "kc3", "kc4", "kc5"],
    threatIds: ["t1", "t3", "t5", "t6", "t7"],
    mitigationIds: ["m1", "m2", "m5", "m6", "m12"]
  }
};

// Update logic
parsedArchitecturesMd.forEach(parsedArch => {
  let targetKey = parsedArch.id;
  if (parsedArch.id === "swarm") {
    targetKey = "collaborative"; // Map MD 'swarm' to user's 'collaborative'
  } else if (parsedArch.id === "knowledge_intensive") {
    targetKey = "knowledge"; // Map MD 'knowledge_intensive' to user's 'knowledge'
  }

  if (architecturesData[targetKey]) {
    architecturesData[targetKey].name = parsedArch.name;
    architecturesData[targetKey].description = parsedArch.description;
    architecturesData[targetKey].keyComponents = parsedArch.keyComponents;
    architecturesData[targetKey].threatIds = parsedArch.threatIds;
    architecturesData[targetKey].mitigationIds = parsedArch.mitigationIds;
    // Copy new metadata fields if present
    architecturesData[targetKey].tags = parsedArch.tags;
    architecturesData[targetKey].references = parsedArch.references;
    architecturesData[targetKey].riskScore = parsedArch.riskScore;
    architecturesData[targetKey].status = parsedArch.status as "active" | "deprecated" | "experimental";
    architecturesData[targetKey].version = parsedArch.version;
    architecturesData[targetKey].lastUpdated = parsedArch.lastUpdated;
    architecturesData[targetKey].updatedBy = parsedArch.updatedBy;
    architecturesData[targetKey].color = parsedArch.color;
    architecturesData[targetKey].icon = parsedArch.icon;
    architecturesData[targetKey].displayOrder = parsedArch.displayOrder;
  }
});

export default architecturesData;
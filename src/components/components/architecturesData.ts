// Agentic Architectures Data
export type Architecture = {
  id: string;
  name: string;
  description: string;
  keyComponents: string[]; // component ids
  threatIds: string[];
  mitigationIds: string[];
};

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

export default architecturesData;
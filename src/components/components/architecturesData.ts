// Agentic Architectures Data
export type Architecture = {
  id: string;
  name: string;
  description: string;
  detailedDescription?: string;
  keyComponents: string[]; // component ids from components.md (e.g., "kc1", "kc1.1")
  threatIds: string[]; // threat ids (e.g., "t1", "t2")
  mitigationIds: string[]; // mitigation ids (e.g., "m1", "m2")
  relevantThreats?: { title: string; description: string }[];
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
    description: "A straightforward linear workflow where a single agent processes tasks through a linear workflow. This design typically uses a single KC1.1 (Large Language Model) as its cognitive core, guided by a KC2.1 (Sequential workflow) and KC3.3 (Chain of Thought) reasoning.",
    detailedDescription: "A sequential agent architecture represents the most straightforward pattern, where a single agent processes tasks through a linear workflow. This design typically uses a single KC1.1 (Large Language Model) as its cognitive core, guided by a KC2.1 (Sequential workflow) and KC3.3 (Chain of Thought) reasoning. Its memory is usually a volatile KC4.1 (In-agent session memory), and its interaction with the outside world is through limited capabilities like KC6.1.1 (Limited API access).",
    relevantThreats: [
      {
        title: "T6 (Intent Breaking) & T15 (Human Manipulation)",
        description: "The primary attack vector is manipulating the agent's core KC1 (LLM) through prompt injection. An attacker can craft inputs to bypass safety instructions, break the intended goal, or trick the agent into performing unintended actions."
      },
      {
        title: "T2 (Tool Misuse)",
        description: "Even with limited API access (KC6.1.1), an attacker can exploit this capability. For example, a deceptive prompt could cause the agent to generate malicious parameters for a legitimate API call, leading to parameter pollution or unauthorized operations within the API's allowed scope."
      },
      {
        title: "T1 (Memory Poisoning)",
        description: "While the KC4.1 memory is session-specific, it can still be poisoned by malicious input. This can corrupt the agent's immediate context, causing it to generate flawed or harmful outputs for the duration of the session."
      },
      {
        title: "T11 (Unexpected RCE)",
        description: "If the agent is granted KC6.2 (Code Execution) capabilities, even in a limited form, it creates a direct risk of remote code execution if an attacker can successfully inject malicious code for the agent to run."
      }
    ],
    keyComponents: ["kc1.1", "kc2.1", "kc3.3", "kc4.1", "kc5.1", "kc6.1.1"],
    threatIds: ["t1", "t2", "t6", "t11", "t15"],
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
    description: "This architecture introduces a KC2.2 (Hierarchical planning) model where a central orchestrator agent decomposes complex tasks and delegates them to specialized sub-agents. These sub-agents may use specialized KC1.1 or KC1.4 (Fine-tuned) models.",
    detailedDescription: "This architecture introduces a KC2.2 (Hierarchical planning) model where a central orchestrator agent decomposes complex tasks and delegates them to specialized sub-agents. These sub-agents may use specialized KC1.1 or KC1.4 (Fine-tuned) models. Communication and state are often managed via KC4.2 (Cross-agent session memory). This structure allows for more complex, multi-step problem-solving.",
    relevantThreats: [
      {
        title: "T6 (Intent Breaking) & Control-Flow Hijacking",
        description: "A key threat is compromising the KC2.2 orchestrator. An attacker could manipulate the orchestrator to alter the main goal, misroute tasks to inappropriate agents, or disrupt the entire workflow."
      },
      {
        title: "T3 (Privilege Compromise) & The Confused Deputy Problem",
        description: "A sub-agent with specific permissions (e.g., access to a calendar API) can be \"confused\" by the orchestrator (or another agent) into misusing its authority. This is a classic T3 threat where a component with legitimate privileges is tricked into performing a malicious action."
      },
      {
        title: "T9 (Identity Spoofing)",
        description: "In a multi-agent system, a compromised sub-agent could attempt to impersonate another agent to gain unauthorized access to information or capabilities from the orchestrator or its peers."
      },
      {
        title: "T12 (Communication Poisoning)",
        description: "The shared KC4.2 memory is a critical channel for inter-agent communication. An attacker who compromises one agent can poison this shared memory to manipulate the behavior and decisions of all other agents relying on it for context."
      }
    ],
    keyComponents: ["kc1.1", "kc1.4", "kc2.2", "kc3.1", "kc4.2", "kc5.2", "kc6.2", "kc6.4"],
    threatIds: ["t3", "t6", "t9", "t12"],
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
    description: "A collaborative swarm is a decentralized system where multiple peer agents operate without a strict hierarchy, using KC2.3 (Multi-agent collaboration). They can explore different solutions in parallel, often using advanced reasoning like KC3.4 (Tree of Thoughts).",
    detailedDescription: "A collaborative swarm is a decentralized system where multiple peer agents operate without a strict hierarchy, using KC2.3 (Multi-agent collaboration). They can explore different solutions in parallel, often using advanced reasoning like KC3.4 (Tree of Thoughts). This architecture relies heavily on persistent, shared memory, such as KC4.4 (Cross-agent cross-session memory), to maintain a collective understanding.",
    relevantThreats: [
      {
        title: "T13 (Rogue Agents)",
        description: "A primary danger is a malicious agent joining the swarm. This rogue agent could actively work to sabotage the collective goal, steal information, or spread misinformation to other agents in the swarm."
      },
      {
        title: "T9 (Identity Spoofing) & T12 (Communication Poisoning)",
        description: "In a decentralized P2P network, secure communication and verifiable identity are paramount. Without robust controls like mTLS and decentralized identifiers (DIDs), agents can be easily impersonated (T9), and communication channels can be poisoned (T12) to manipulate the entire swarm."
      },
      {
        title: "T1 (Memory Poisoning)",
        description: "This threat is amplified in a swarm architecture. Poisoning the persistent KC4.4 memory can have devastating, long-term consequences, as the corrupted information remains across sessions and can influence the behavior of the entire swarm indefinitely."
      },
      {
        title: "T8 (Repudiation)",
        description: "The lack of a central controller makes auditing and traceability difficult. It may be challenging to determine which agent was responsible for a malicious action, allowing an attacker to deny responsibility (T8). This necessitates robust, tamper-proof logging for every agent."
      }
    ],
    keyComponents: ["kc1.1", "kc1.2", "kc2.3", "kc3.4", "kc4.4", "kc5.1"],
    threatIds: ["t1", "t8", "t9", "t12", "t13"],
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
    architecturesData[targetKey].detailedDescription = parsedArch.detailedDescription;
    architecturesData[targetKey].relevantThreats = parsedArch.relevantThreats;
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
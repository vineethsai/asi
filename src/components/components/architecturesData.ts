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

export const architecturesData: Record<string, Architecture> = {
  sequential: {
    id: "sequential",
    name: "Sequential Agent Architecture",
    description:
      "A straightforward linear workflow where a single agent processes tasks through a linear workflow. This design typically uses a single KC1.1 (Large Language Model) as its cognitive core, guided by a KC2.1 (Sequential workflow) and KC3.3 (Chain of Thought) reasoning.",
    detailedDescription:
      "A sequential agent architecture represents the most straightforward pattern, where a single agent processes tasks through a linear workflow. This design typically uses a single KC1.1 (Large Language Model) as its cognitive core, guided by a KC2.1 (Sequential workflow) and KC3.3 (Chain of Thought) reasoning. Its memory is usually a volatile KC4.1 (In-agent session memory), and its interaction with the outside world is through limited capabilities like KC6.1.1 (Limited API access).",
    relevantThreats: [
      {
        title: "T6 (Intent Breaking) & T15 (Human Manipulation)",
        description:
          "The primary attack vector is manipulating the agent's core KC1 (LLM) through prompt injection. An attacker can craft inputs to bypass safety instructions, break the intended goal, or trick the agent into performing unintended actions.",
      },
      {
        title: "T2 (Tool Misuse)",
        description:
          "Even with limited API access (KC6.1.1), an attacker can exploit this capability. For example, a deceptive prompt could cause the agent to generate malicious parameters for a legitimate API call, leading to parameter pollution or unauthorized operations within the API's allowed scope.",
      },
      {
        title: "T1 (Memory Poisoning)",
        description:
          "While the KC4.1 memory is session-specific, it can still be poisoned by malicious input. This can corrupt the agent's immediate context, causing it to generate flawed or harmful outputs for the duration of the session.",
      },
      {
        title: "T11 (Unexpected RCE)",
        description:
          "If the agent is granted KC6.2 (Code Execution) capabilities, even in a limited form, it creates a direct risk of remote code execution if an attacker can successfully inject malicious code for the agent to run.",
      },
    ],
    keyComponents: ["kc1.1", "kc2.1", "kc3.3", "kc4.1", "kc5.1", "kc6.1.1"],
    threatIds: ["t1", "t2", "t6", "t11", "t15"],
    mitigationIds: ["m1", "m4", "m5", "m6", "m11", "m12", "m13"],
    tags: ["simple", "linear", "single-agent"],
    references: [
      {
        title: "OWASP Agentic AI Threats",
        url: "https://genai.owasp.org/resource/agentic-ai-threats-and-mitigations/",
      },
      {
        title: "LangChain Agent Architectures",
        url: "https://blog.langchain.dev/what-is-an-agent/",
      },
    ],
    riskScore: 5,
    status: "active",
    version: "2025.1",
    lastUpdated: "2025-01-22",
    updatedBy: "vineeth",
    color: "#2563eb",
    icon: "flow-linear",
    displayOrder: 1,
  },
  hierarchical: {
    id: "hierarchical",
    name: "Hierarchical Agent Architecture",
    description:
      "This architecture introduces a KC2.2 (Hierarchical planning) model where a central orchestrator agent decomposes complex tasks and delegates them to specialized sub-agents. These sub-agents may use specialized KC1.1 or KC1.4 (Fine-tuned) models.",
    detailedDescription:
      "This architecture introduces a KC2.2 (Hierarchical planning) model where a central orchestrator agent decomposes complex tasks and delegates them to specialized sub-agents. These sub-agents may use specialized KC1.1 or KC1.4 (Fine-tuned) models. Communication and state are often managed via KC4.2 (Cross-agent session memory). This structure allows for more complex, multi-step problem-solving.",
    relevantThreats: [
      {
        title: "T6 (Intent Breaking) & Control-Flow Hijacking",
        description:
          "A key threat is compromising the KC2.2 orchestrator. An attacker could manipulate the orchestrator to alter the main goal, misroute tasks to inappropriate agents, or disrupt the entire workflow.",
      },
      {
        title: "T3 (Privilege Compromise) & The Confused Deputy Problem",
        description:
          'A sub-agent with specific permissions (e.g., access to a calendar API) can be "confused" by the orchestrator (or another agent) into misusing its authority. This is a classic T3 threat where a component with legitimate privileges is tricked into performing a malicious action.',
      },
      {
        title: "T9 (Identity Spoofing)",
        description:
          "In a multi-agent system, a compromised sub-agent could attempt to impersonate another agent to gain unauthorized access to information or capabilities from the orchestrator or its peers.",
      },
      {
        title: "T12 (Communication Poisoning)",
        description:
          "The shared KC4.2 memory is a critical channel for inter-agent communication. An attacker who compromises one agent can poison this shared memory to manipulate the behavior and decisions of all other agents relying on it for context.",
      },
    ],
    keyComponents: ["kc1.1", "kc1.4", "kc2.2", "kc3.1", "kc4.2", "kc5.2", "kc6.2", "kc6.4"],
    threatIds: ["t3", "t6", "t9", "t12"],
    mitigationIds: ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m10", "m11", "m12", "m13"],
    tags: ["multi-agent", "orchestration", "complex"],
    references: [
      {
        title: "OWASP Multi-Agent Threat Modeling",
        url: "https://genai.owasp.org/resource/multi-agentic-system-threat-modeling-guide-v1-0/",
      },
      { title: "CrewAI Hierarchical Process", url: "https://docs.crewai.com/concepts/processes" },
    ],
    riskScore: 8,
    status: "active",
    version: "2025.1",
    lastUpdated: "2025-01-22",
    updatedBy: "vineeth",
    color: "#22c55e",
    icon: "flow-hierarchical",
    displayOrder: 2,
  },
  collaborative: {
    id: "collaborative",
    name: "Collaborative Agent Swarm",
    description:
      "A collaborative swarm is a decentralized system where multiple peer agents operate without a strict hierarchy, using KC2.3 (Multi-agent collaboration). They can explore different solutions in parallel, often using advanced reasoning like KC3.4 (Tree of Thoughts).",
    detailedDescription:
      "A collaborative swarm is a decentralized system where multiple peer agents operate without a strict hierarchy, using KC2.3 (Multi-agent collaboration). They can explore different solutions in parallel, often using advanced reasoning like KC3.4 (Tree of Thoughts). This architecture relies heavily on persistent, shared memory, such as KC4.4 (Cross-agent cross-session memory), to maintain a collective understanding.",
    relevantThreats: [
      {
        title: "T13 (Rogue Agents)",
        description:
          "A primary danger is a malicious agent joining the swarm. This rogue agent could actively work to sabotage the collective goal, steal information, or spread misinformation to other agents in the swarm.",
      },
      {
        title: "T9 (Identity Spoofing) & T12 (Communication Poisoning)",
        description:
          "In a decentralized P2P network, secure communication and verifiable identity are paramount. Without robust controls like mTLS and decentralized identifiers (DIDs), agents can be easily impersonated (T9), and communication channels can be poisoned (T12) to manipulate the entire swarm.",
      },
      {
        title: "T1 (Memory Poisoning)",
        description:
          "This threat is amplified in a swarm architecture. Poisoning the persistent KC4.4 memory can have devastating, long-term consequences, as the corrupted information remains across sessions and can influence the behavior of the entire swarm indefinitely.",
      },
      {
        title: "T8 (Repudiation)",
        description:
          "The lack of a central controller makes auditing and traceability difficult. It may be challenging to determine which agent was responsible for a malicious action, allowing an attacker to deny responsibility (T8). This necessitates robust, tamper-proof logging for every agent.",
      },
    ],
    keyComponents: ["kc1.1", "kc1.2", "kc2.3", "kc3.4", "kc4.4", "kc5.1"],
    threatIds: ["t1", "t8", "t9", "t12", "t13"],
    mitigationIds: ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m10", "m11", "m12", "m13"],
    tags: ["collaborative", "swarm", "distributed"],
    references: [
      { title: "OpenAI Swarm Framework", url: "https://github.com/openai/swarm" },
      {
        title: "Swarm Intelligence in AI",
        url: "https://www.lasso.security/blog/agentic-ai-security-threats-2025",
      },
    ],
    riskScore: 7,
    status: "active",
    version: "2025.1",
    lastUpdated: "2025-01-22",
    updatedBy: "vineeth",
    color: "#f59e42",
    icon: "flow-swarm",
    displayOrder: 3,
  },
  reactive: {
    id: "reactive",
    name: "Reactive Agent Architecture",
    description:
      "Agents designed for responsive workflows, often event-driven, where actions are taken based on immediate inputs or changes in the environment. Utilizes ReAct paradigm and managed APIs for quick interactions.",
    detailedDescription:
      "A reactive agent architecture is built around the ReAct (Reasoning + Acting) paradigm, where agents dynamically interleave reasoning steps with actions based on real-time environmental feedback. This architecture typically uses KC1.2 (Multimodal LLMs) for processing diverse inputs, KC3.2 (ReAct reasoning) for decision-making, and KC5.3 (Managed APIs) for rapid external interactions. The agent maintains KC4.3 (In-agent cross-session memory) to learn from past interactions while responding to immediate stimuli. This pattern is ideal for real-time monitoring, event-driven automation, and adaptive systems that must respond quickly to changing conditions.",
    relevantThreats: [
      {
        title: "T2 (Tool Misuse) & T11 (Unexpected RCE)",
        description:
          "The rapid action-taking nature of reactive agents creates risks when tools are invoked quickly without thorough validation. An attacker can exploit the agent's responsiveness to trigger unauthorized tool executions or inject malicious code through event payloads.",
      },
      {
        title: "T6 (Intent Breaking) & T7 (Misaligned Behaviors)",
        description:
          "The real-time decision-making process can be manipulated through carefully crafted environmental inputs or events. Attackers may craft inputs that cause the agent to deviate from its intended purpose or exhibit harmful behaviors in edge cases.",
      },
      {
        title: "T5 (Cascading Hallucination)",
        description:
          "In fast-paced reactive environments, there's less opportunity for validation between reasoning steps. Hallucinated information from one reasoning cycle can quickly propagate through subsequent actions before being caught.",
      },
      {
        title: "T15 (Human Manipulation)",
        description:
          "Reactive agents that interact directly with users in real-time may be exploited to manipulate human operators through rapid, persuasive interactions that don't allow time for careful consideration.",
      },
    ],
    keyComponents: ["kc1.2", "kc2.1", "kc3.2", "kc4.3", "kc5.3", "kc6.4"],
    threatIds: ["t1", "t2", "t3", "t5", "t6", "t7", "t8", "t11", "t12", "t15"],
    mitigationIds: ["m1", "m2", "m4", "m5", "m6", "m7", "m9", "m11", "m12", "m13"],
    tags: ["event-driven", "reactive", "real-time", "ReAct"],
    references: [
      { title: "ReAct: Reasoning and Acting in LLMs", url: "https://arxiv.org/abs/2210.03629" },
      {
        title: "LangChain ReAct Agents",
        url: "https://python.langchain.com/docs/concepts/agents/",
      },
      {
        title: "Event-Driven Agent Patterns",
        url: "https://www.anthropic.com/research/building-effective-agents",
      },
    ],
    riskScore: 6,
    status: "active",
    version: "2025.1",
    lastUpdated: "2025-01-22",
    updatedBy: "vineeth",
    color: "#eab308",
    icon: "flow-reactive",
    displayOrder: 4,
  },
  knowledge_intensive: {
    id: "knowledge_intensive",
    name: "Knowledge-Intensive Agent Architecture",
    description:
      "Agents focused on leveraging and processing large volumes of external data, typically using sophisticated RAG approaches. Employs chain of thought for reasoning over retrieved knowledge and data connectors for accessing persistent knowledge stores.",
    detailedDescription:
      "A knowledge-intensive agent architecture is designed around Retrieval-Augmented Generation (RAG) patterns, where agents leverage extensive external knowledge bases to inform their reasoning and responses. This architecture typically combines KC1.1 (LLMs) with KC1.2 (Multimodal LLMs) for processing diverse content types, uses KC3.3 (Chain of Thought) for reasoning over retrieved information, and relies heavily on KC4.6 (Cross-agent cross-user memory) and KC6.3.3 (RAG data sources) for accessing persistent knowledge stores. The agent excels at research tasks, information synthesis, and providing authoritative responses grounded in verified data sources.",
    relevantThreats: [
      {
        title: "T1 (Memory Poisoning) via RAG Poisoning",
        description:
          "The primary attack vector is injecting malicious content into the knowledge base or RAG data sources. Attackers can plant misinformation, prompt injection payloads, or biased content that gets retrieved and influences the agent's outputs, potentially affecting many users.",
      },
      {
        title: "T5 (Cascading Hallucination) & T7 (Misaligned Behaviors)",
        description:
          "When the agent reasons over retrieved information, it may blend retrieved facts with hallucinated content, creating believable but inaccurate outputs. This is especially dangerous when users trust the agent as an authoritative source.",
      },
      {
        title: "T3 (Privilege Compromise) via Data Access",
        description:
          "Knowledge-intensive agents often have broad read access to data stores. An attacker can exploit this access to exfiltrate sensitive information, bypass access controls, or access documents the user shouldn't see through context manipulation.",
      },
      {
        title: "T12 (Communication Poisoning) via Document Injection",
        description:
          "Indirect prompt injection through documents is a critical threat. Attackers can embed malicious instructions in documents that get retrieved and processed, causing the agent to execute unauthorized actions or leak information.",
      },
    ],
    keyComponents: [
      "kc1.1",
      "kc1.2",
      "kc2.1",
      "kc3.3",
      "kc4.3",
      "kc4.6",
      "kc5.1",
      "kc6.3.3",
      "kc6.4",
    ],
    threatIds: ["t1", "t2", "t3", "t5", "t6", "t7", "t8", "t12", "t15"],
    mitigationIds: ["m1", "m2", "m4", "m5", "m6", "m7", "m11", "m12", "m13"],
    tags: ["knowledge-intensive", "rag", "data-driven", "retrieval", "research"],
    references: [
      { title: "RAG Poisoning Attacks", url: "https://www.promptfoo.dev/blog/rag-poisoning/" },
      { title: "Securing RAG Systems", url: "https://arxiv.org/abs/2312.10997" },
      { title: "LangChain RAG Tutorial", url: "https://python.langchain.com/docs/tutorials/rag/" },
      {
        title: "Vector Database Security",
        url: "https://weaviate.io/blog/security-best-practices",
      },
    ],
    riskScore: 7,
    status: "active",
    version: "2025.1",
    lastUpdated: "2025-01-22",
    updatedBy: "vineeth",
    color: "#a21caf",
    icon: "flow-knowledge",
    displayOrder: 5,
  },
};

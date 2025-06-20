// Enhanced Threat and Mitigation type definitions
export type Threat = {
  id: string;
  code: string;
  name: string;
  description: string;
  impactLevel: "high" | "medium" | "low";
  componentIds: string[];
  affectedComponents?: string[];
  attackVectors?: { vector: string; example?: string; severity?: "high" | "medium" | "low" }[];
  mitigationNames?: string[];
  mitigatedThreatNames?: string[];
  mitigatedThreatIds?: string[];
  tags?: string[];
  references?: { title: string; url: string }[];
  riskScore?: number;
  impactAnalysis?: { confidentiality: boolean; integrity: boolean; availability: boolean };
  status?: "active" | "deprecated" | "experimental";
  version?: string;
  lastUpdated?: string;
  updatedBy?: string;
  color?: string;
  icon?: string;
  displayOrder?: number;
  mitigationIds?: string[];
};

export type Mitigation = {
  id: string;
  name: string;
  description: string;
  threatIds: string[];
  implementationDetail: {
    design: string;
    build: string;
    operations: string;
    toolsAndFrameworks: string;
  };
  designPhase: boolean;
  buildPhase: boolean;
  operationPhase: boolean;
  mitigatedThreatNames?: string[];
  mitigatedThreatIds?: string[];
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

// Threats data
export const threatsData: Record<string, Threat> = {
  "t1": {
    id: "t1",
    code: "T1",
    name: "Memory Poisoning",
    description: "Attackers inject malicious data into the agent's memory to manipulate future decisions, affecting any memory type from in-agent session to cross-agent cross-user memory.",
    impactLevel: "high",
    componentIds: ["kc4"],
    affectedComponents: ["Memory Modules (KC4.1-KC4.6)"],
    attackVectors: [
      { vector: "Data Injection", example: "Injecting malicious payloads into session memory", severity: "high" },
      { vector: "Context Manipulation", example: "Altering agent's context window to bias outputs", severity: "medium" },
      { vector: "Session Contamination", example: "Cross-session poisoning via shared memory", severity: "medium" },
      { vector: "Poisoned RAG sources", example: "Supplying tainted data to retrieval-augmented generation", severity: "high" },
      { vector: "Training Data Corruption", example: "Systematically poisoning knowledge bases with subtle biases", severity: "high" },
      { vector: "Memory Persistence Attacks", example: "Creating malicious memories that persist across sessions", severity: "medium" }
    ],
    mitigationNames: [
      "Memory Validation & Sanitization",
      "Multi-Stage Reasoning Validation", 
      "Prompt Hardening & Jailbreak Prevention",
      "Content Security & Output Filtering",
      "Supply Chain Security & Provenance"
    ],
    mitigationIds: ["m1", "m5", "m4", "m11", "m16"],
    tags: ["memory", "injection", "RAG", "persistence", "knowledge-base"],
    references: [
      { title: "OWASP AI Security", url: "https://owasp.org/www-project-top-10-for-large-language-models/" },
      { title: "RAG Poisoning Attack Techniques", url: "https://www.promptfoo.dev/blog/rag-poisoning/" },
      { title: "Data Poisoning in AI Systems", url: "https://www.crowdstrike.com/en-us/cybersecurity-101/cyberattacks/data-poisoning/" }
    ],
    riskScore: 9,
    impactAnalysis: { confidentiality: true, integrity: true, availability: false },
    status: "active",
    version: "2025.1",
    lastUpdated: "2025-06-18",
    updatedBy: "enhanced-analysis",
    color: "#a855f7",
    icon: "memory",
    displayOrder: 1
  },
  "t2": {
    id: "t2",
    code: "T2",
    name: "Tool Misuse",
    description: "Manipulation of tools, APIs, or environment access to perform unintended actions or access unauthorized resources, including exploitation of access to external systems.",
    impactLevel: "high",
    componentIds: ["kc5", "kc6"],
    affectedComponents: ["Tool Integration Layer (KC5.1-KC5.4)", "External Environment Interface (KC6.1-KC6.3)"],
    attackVectors: [
      { vector: "Prompt Injection for Tool Abuse", example: "Manipulating agent to execute unauthorized tool commands", severity: "high" },
      { vector: "Tool Chain Exploitation", example: "Chaining multiple tool calls to achieve unauthorized outcomes", severity: "high" },
      { vector: "API Parameter Manipulation", example: "Modifying tool parameters to access restricted resources", severity: "medium" },
      { vector: "Tool Authentication Bypass", example: "Exploiting tool authentication mechanisms", severity: "high" },
      { vector: "Resource Exhaustion via Tools", example: "Using tools to overwhelm external services", severity: "medium" },
      { vector: "Lateral Movement through Tools", example: "Using legitimate tools to access unintended systems", severity: "high" }
    ],
    mitigationNames: [
      "Tool Sandboxing & Isolation",
      "Zero Trust & Least Privilege Access",
      "Runtime Security Controls & Sandboxing",
      "Comprehensive Security Monitoring & Auditing",
      "Defense-in-Depth Architecture & Trust Boundaries",
      "Distributed Resource Management & Rate Limiting",
      "Supply Chain Security & Provenance",
      "Incident Response & Recovery Framework"
    ],
    mitigationIds: ["m2", "m7", "m13", "m6", "m10", "m9", "m16", "m17"],
    tags: ["tools", "api", "manipulation", "access-control", "sandbox"],
    references: [
      { title: "AI Agent Tool Security", url: "https://unit42.paloaltonetworks.com/agentic-ai-threats/" },
      { title: "Tool Misuse in Agentic Systems", url: "https://www.lasso.security/blog/agentic-ai-security-threats-2025" }
    ],
    riskScore: 8,
    impactAnalysis: { confidentiality: true, integrity: true, availability: true },
    status: "active",
    version: "2025.1",
    lastUpdated: "2025-06-18",
    updatedBy: "enhanced-analysis",
    color: "#f87171",
    icon: "tool",
    displayOrder: 2
  },
  "t3": {
    id: "t3",
    code: "T3",
    name: "Privilege Compromise",
    description: "Breaking information system boundaries through context collapse, causing unauthorized data access/leakage, or exploiting tool privileges to gain unauthorized access to systems.",
    impactLevel: "high",
    componentIds: ["kc4", "kc5", "kc6"],
    affectedComponents: ["Memory Modules (KC4.1-KC4.6)", "Tool Integration Layer (KC5.1-KC5.4)", "External Environment Interface (KC6.1-KC6.3)"],
    attackVectors: [
      { vector: "Role Inheritance Exploitation", example: "Exploiting dynamic role assignments to gain elevated privileges", severity: "high" },
      { vector: "Permission Escalation", example: "Agent retains admin permissions beyond intended duration", severity: "high" },
      { vector: "Context Collapse", example: "Breaking isolation boundaries between different user contexts", severity: "medium" },
      { vector: "Confused Deputy Attack", example: "Tricking privileged agent to perform unauthorized actions", severity: "high" },
      { vector: "Service Account Token Theft", example: "Extracting cloud service account tokens from agent environment", severity: "high" },
      { vector: "Cross-Tenant Data Access", example: "Accessing data from different organizational tenants", severity: "medium" }
    ],
    mitigationNames: [
      "Zero Trust & Least Privilege Access",
      "Defense-in-Depth Architecture & Trust Boundaries",
      "Memory Validation & Sanitization",
      "Tool Sandboxing & Isolation",
      "Comprehensive Security Monitoring & Auditing",
      "Agent Identity & Authentication Framework",
      "Runtime Security Controls & Sandboxing",
      "Incident Response & Recovery Framework",
      "Supply Chain Security & Provenance"
    ],
    mitigationIds: ["m7", "m10", "m1", "m2", "m6", "m14", "m13", "m17", "m16"],
    tags: ["privilege", "escalation", "rbac", "isolation", "permissions"],
    references: [
      { title: "Privilege Escalation in AI Systems", url: "https://www.beyondtrust.com/blog/entry/privilege-escalation-attack-defense-explained" },
      { title: "OWASP Agent Authorization Controls", url: "https://github.com/precize/OWASP-Agentic-AI/blob/main/agent-auth-control-01.md" }
    ],
    riskScore: 9,
    impactAnalysis: { confidentiality: true, integrity: true, availability: false },
    status: "active",
    version: "2025.1",
    lastUpdated: "2025-06-18",
    updatedBy: "enhanced-analysis",
    color: "#fbbf24",
    icon: "privilege",
    displayOrder: 3
  },
  "t4": {
    id: "t4",
    code: "T4",
    name: "Resource Overload",
    description: "Overwhelming external services through excessive API calls or resource consumption, potentially causing denial of service or excessive costs.",
    impactLevel: "medium",
    componentIds: ["kc6"],
    affectedComponents: ["External Environment Interface (KC6.1-KC6.3)"],
    attackVectors: [
      { vector: "API Rate Limit Exhaustion", example: "Flooding external APIs with requests to cause service denial", severity: "medium" },
      { vector: "Compute Resource Exhaustion", example: "Overwhelming agent processing power with complex tasks", severity: "medium" },
      { vector: "Memory Consumption Attack", example: "Causing agent to consume excessive memory resources", severity: "medium" },
      { vector: "Concurrent Task Flooding", example: "Triggering multiple resource-intensive operations simultaneously", severity: "high" },
      { vector: "Cost Amplification Attack", example: "Exploiting pay-per-use services to generate excessive costs", severity: "medium" },
      { vector: "Feedback Loop Exploitation", example: "Creating recursive operations that consume resources", severity: "medium" }
    ],
    mitigationNames: [
      "Distributed Resource Management & Rate Limiting",
      "Tool Sandboxing & Isolation",
      "Adaptive Human-in-the-Loop Controls",
      "Runtime Security Controls & Sandboxing"
    ],
    mitigationIds: ["m9", "m2", "m8", "m13"],
    tags: ["resources", "denial-of-service", "rate-limiting", "costs", "performance"],
    references: [
      { title: "Resource Management in AI Agents", url: "https://www.xenonstack.com/blog/vulnerabilities-in-ai-agents" },
      { title: "DoS Prevention in Agentic Systems", url: "https://undercodetesting.com/top-10-agentic-ai-threats-a-deep-dive-into-owasps-security-risks/" }
    ],
    riskScore: 6,
    impactAnalysis: { confidentiality: false, integrity: false, availability: true },
    status: "active",
    version: "2025.1",
    lastUpdated: "2025-06-18",
    updatedBy: "enhanced-analysis",
    color: "#38bdf8",
    icon: "resource",
    displayOrder: 4
  },
  "t5": {
    id: "t5", 
    code: "T5",
    name: "Cascading Hallucination",
    description: "Foundation models generate incorrect information that propagates through the system, affecting reasoning quality and being stored in memory across sessions or agents.",
    impactLevel: "medium",
    componentIds: ["kc1", "kc3", "kc4"],
    affectedComponents: ["Foundation Model (KC1.1-KC1.3)", "Reasoning Engine (KC3.1-KC3.4)", "Memory Modules (KC4.1-KC4.6)"],
    attackVectors: [
      { vector: "False Information Injection", example: "Introducing fabricated facts that propagate through agent reasoning", severity: "medium" },
      { vector: "Memory Contamination", example: "Storing hallucinated information in long-term memory", severity: "high" },
      { vector: "Cross-Agent Misinformation", example: "Spreading false information between multiple agents", severity: "medium" },
      { vector: "Confidence Amplification", example: "Reinforcing false information through repeated exposure", severity: "medium" },
      { vector: "Decision Chain Corruption", example: "Contaminating multi-step reasoning processes", severity: "high" },
      { vector: "Source Attribution Errors", example: "Misattributing fabricated information to legitimate sources", severity: "medium" }
    ],
    mitigationNames: [
      "Multi-Stage Reasoning Validation",
      "Content Security & Output Filtering",
      "Memory Validation & Sanitization",
      "Prompt Hardening & Jailbreak Prevention",
      "Behavioral Monitoring & Ethics Framework"
    ],
    mitigationIds: ["m5", "m11", "m1", "m4", "m15"],
    tags: ["hallucination", "misinformation", "reasoning", "verification", "propagation"],
    references: [
      { title: "Cascading Hallucinations in AI", url: "https://www.resilientcyber.io/p/agentic-ai-threats-and-mitigations" },
      { title: "Information Integrity in Agent Systems", url: "https://genai.owasp.org/resource/agentic-ai-threats-and-mitigations/" }
    ],
    riskScore: 7,
    impactAnalysis: { confidentiality: false, integrity: true, availability: false },
    status: "active",
    version: "2025.1",
    lastUpdated: "2025-06-18",
    updatedBy: "enhanced-analysis",
    color: "#f472b6",
    icon: "hallucination",
    displayOrder: 5
  },
  "t6": {
    id: "t6",
    code: "T6",
    name: "Intent Breaking & Goal Manipulation",
    description: "Attacks that manipulate the agent's core decision-making to achieve unauthorized goals, breaking control flow, abusing shared context, or interfering with isolated data.",
    impactLevel: "high",
    componentIds: ["kc1", "kc2", "kc3", "kc4", "kc5"],
    affectedComponents: ["Foundation Model (KC1.1-KC1.3)", "Agent Orchestration (KC2.1-KC2.5)", "Reasoning Engine (KC3.1-KC3.4)", "Memory Modules (KC4.1-KC4.6)", "Tool Integration Layer (KC5.1-KC5.4)"],
    attackVectors: [
      { vector: "Goal Substitution", example: "Replacing agent's primary objectives with malicious goals", severity: "high" },
      { vector: "Intent Parser Overflow", example: "Overwhelming intent extraction with complex nested requests", severity: "medium" },
      { vector: "Semantic Ambiguity Exploitation", example: "Crafting instructions with multiple interpretations", severity: "high" },
      { vector: "Priority Inversion", example: "Manipulating task priorities to execute unauthorized actions first", severity: "medium" },
      { vector: "Control Flow Hijacking", example: "Redirecting agent execution to unintended code paths", severity: "high" },
      { vector: "Context Window Poisoning", example: "Injecting malicious context to influence decision-making", severity: "medium" }
    ],
    mitigationNames: [
      "Prompt Hardening & Jailbreak Prevention",
      "Multi-Stage Reasoning Validation",
      "Memory Validation & Sanitization",
      "Adaptive Human-in-the-Loop Controls",
      "Content Security & Output Filtering",
      "Behavioral Monitoring & Ethics Framework"
    ],
    mitigationIds: ["m4", "m5", "m1", "m8", "m11", "m15"],
    tags: ["intent", "goals", "manipulation", "control-flow", "semantic"],
    references: [
      { title: "Agent Goal Manipulation", url: "https://github.com/precize/OWASP-Agentic-AI/blob/main/agent-goal-instruction-03.md" },
      { title: "Intent Breaking in AI Agents", url: "https://www.humansecurity.com/learn/blog/agentic-ai-security-owasp-threats/" }
    ],
    riskScore: 8,
    impactAnalysis: { confidentiality: true, integrity: true, availability: true },
    status: "active",
    version: "2025.1",
    lastUpdated: "2025-06-18",
    updatedBy: "enhanced-analysis",
    color: "#34d399",
    icon: "intent",
    displayOrder: 6
  },
  "t7": {
    id: "t7",
    code: "T7",
    name: "Misaligned Behaviors",
    description: "Model alignment issues leading to unintended behaviors that impact users, organizations, or broader populations through subtle reasoning or tool usage misalignments.",
    impactLevel: "medium",
    componentIds: ["kc1", "kc3", "kc5"],
    affectedComponents: ["Foundation Model (KC1.1-KC1.3)", "Reasoning Engine (KC3.1-KC3.4)", "Tool Integration Layer (KC5.1-KC5.4)"],
    attackVectors: [
      { vector: "Value Misalignment", example: "Agent pursuing objectives contrary to organizational values", severity: "medium" },
      { vector: "Ethical Boundary Violations", example: "Circumventing ethical guidelines through creative reasoning", severity: "high" },
      { vector: "Unintended Optimization", example: "Optimizing for metrics that lead to harmful outcomes", severity: "medium" },
      { vector: "Deceptive Behavior", example: "Agent hiding its true intentions while appearing compliant", severity: "high" },
      { vector: "Social Manipulation", example: "Exploiting human psychology to achieve goals", severity: "medium" },
      { vector: "Emergent Harmful Behaviors", example: "Developing unexpected harmful strategies", severity: "medium" }
    ],
    mitigationNames: [
      "Behavioral Monitoring & Ethics Framework",
      "Multi-Stage Reasoning Validation",
      "Content Security & Output Filtering",
      "Prompt Hardening & Jailbreak Prevention"
    ],
    mitigationIds: ["m15", "m5", "m11", "m4"],
    tags: ["alignment", "ethics", "behavior", "values", "oversight"],
    references: [
      { title: "AI Alignment Challenges", url: "https://genai.owasp.org/resource/agentic-ai-threats-and-mitigations/" },
      { title: "Misaligned AI Behavior Detection", url: "https://owaspai.org/docs/ai_security_overview/" }
    ],
    riskScore: 6,
    impactAnalysis: { confidentiality: false, integrity: true, availability: false },
    status: "active",
    version: "2025.1",
    lastUpdated: "2025-06-18",
    updatedBy: "enhanced-analysis",
    color: "#818cf8",
    icon: "misalign",
    displayOrder: 7
  },
  "t8": {
    id: "t8",
    code: "T8",
    name: "Repudiation",
    description: "Making agent actions difficult to trace through workflow manipulation, obscuring decision trails in reasoning chains, or tampering with evidence in memory.",
    impactLevel: "medium",
    componentIds: ["kc2", "kc3", "kc4", "kc5"],
    affectedComponents: ["Agent Orchestration (KC2.1-KC2.5)", "Reasoning Engine (KC3.1-KC3.4)", "Memory Modules (KC4.1-KC4.6)", "Tool Integration Layer (KC5.1-KC5.4)"],
    attackVectors: [
      { vector: "Log Tampering", example: "Modifying or deleting audit trails of agent actions", severity: "medium" },
      { vector: "Decision Trail Obfuscation", example: "Making reasoning processes difficult to follow", severity: "medium" },
      { vector: "Identity Spoofing", example: "Masking the true source of agent actions", severity: "high" },
      { vector: "Temporal Manipulation", example: "Altering timestamps to hide action sequences", severity: "medium" },
      { vector: "Evidence Destruction", example: "Removing traces of unauthorized activities", severity: "high" },
      { vector: "Attribution Confusion", example: "Making it unclear which agent performed which action", severity: "medium" }
    ],
    mitigationNames: [
      "Comprehensive Security Monitoring & Auditing",
      "Memory Validation & Sanitization",
      "Agent Identity & Authentication Framework",
      "Incident Response & Recovery Framework"
    ],
    mitigationIds: ["m6", "m1", "m14", "m17"],
    tags: ["repudiation", "audit", "traceability", "logging", "forensics"],
    references: [
      { title: "Agent Action Traceability", url: "https://undercodetesting.com/top-10-agentic-ai-threats-a-deep-dive-into-owasps-security-risks/" },
      { title: "Digital Forensics for AI Systems", url: "https://www.resilientcyber.io/p/agentic-ai-threats-and-mitigations" }
    ],
    riskScore: 5,
    impactAnalysis: { confidentiality: false, integrity: true, availability: false },
    status: "active",
    version: "2025.1",
    lastUpdated: "2025-06-18",
    updatedBy: "enhanced-analysis",
    color: "#facc15",
    icon: "repudiation",
    displayOrder: 8
  },
  "t9": {
    id: "t9",
    code: "T9",
    name: "Identity Spoofing",
    description: "Impersonating trusted agents or entities in multi-agent systems, especially problematic in hierarchical or collaborative architectures.",
    impactLevel: "high",
    componentIds: ["kc2"],
    affectedComponents: ["Agent Orchestration (KC2.1-KC2.5)"],
    attackVectors: [
      { vector: "Agent Impersonation", example: "Malicious agent masquerading as trusted system agent", severity: "high" },
      { vector: "Certificate Spoofing", example: "Forging or stealing agent authentication certificates", severity: "high" },
      { vector: "Session Hijacking", example: "Taking over legitimate agent communication sessions", severity: "medium" },
      { vector: "Trust Chain Exploitation", example: "Exploiting trust relationships between agents", severity: "high" },
      { vector: "Credential Theft", example: "Stealing agent authentication credentials", severity: "high" },
      { vector: "Man-in-the-Middle Attacks", example: "Intercepting and modifying inter-agent communications", severity: "medium" }
    ],
    mitigationNames: [
      "Agent Identity & Authentication Framework",
      "Secure Inter-Agent Communication",
      "Defense-in-Depth Architecture & Trust Boundaries",
      "Zero Trust & Least Privilege Access"
    ],
    mitigationIds: ["m14", "m3", "m10", "m7"],
    tags: ["identity", "spoofing", "authentication", "trust", "certificates"],
    references: [
      { title: "Agent Identity Management", url: "https://github.com/precize/OWASP-Agentic-AI/blob/main/agent-orchestration-07.md" },
      { title: "Multi-Agent Security", url: "https://genai.owasp.org/resource/multi-agentic-system-threat-modeling-guide-v1-0/" }
    ],
    riskScore: 8,
    impactAnalysis: { confidentiality: true, integrity: true, availability: false },
    status: "active",
    version: "2025.1",
    lastUpdated: "2025-06-18",
    updatedBy: "enhanced-analysis",
    color: "#f472b6",
    icon: "identity",
    displayOrder: 9
  },
  "t10": {
    id: "t10",
    code: "T10",
    name: "Overwhelming HITL",
    description: "Bypassing human oversight in workflows by creating excessive activity requiring approval, leading to notification fatigue and reduced scrutiny.",
    impactLevel: "medium",
    componentIds: ["kc2", "kc6"],
    affectedComponents: ["Agent Orchestration (KC2.1-KC2.5)", "External Environment Interface (KC6.1-KC6.3)"],
    attackVectors: [
      { vector: "Alert Flooding", example: "Generating excessive alerts to cause notification fatigue", severity: "medium" },
      { vector: "Decision Queue Manipulation", example: "Flooding approval queues with low-priority requests", severity: "medium" },
      { vector: "Attention Dilution", example: "Burying critical decisions among routine approvals", severity: "high" },
      { vector: "Approval Bypass", example: "Exploiting automatic approval thresholds", severity: "medium" },
      { vector: "Context Switching Attacks", example: "Forcing rapid context changes to reduce scrutiny", severity: "medium" },
      { vector: "Time Pressure Exploitation", example: "Creating artificial urgency to rush decisions", severity: "medium" }
    ],
    mitigationNames: [
      "Adaptive Human-in-the-Loop Controls",
      "Distributed Resource Management & Rate Limiting",
      "Comprehensive Security Monitoring & Auditing"
    ],
    mitigationIds: ["m8", "m9", "m6"],
    tags: ["human-in-the-loop", "oversight", "fatigue", "approval", "attention"],
    references: [
      { title: "Human-AI Interaction Security", url: "https://www.lasso.security/blog/agentic-ai-security-threats-2025" },
      { title: "HITL Security Patterns", url: "https://www.humansecurity.com/learn/blog/agentic-ai-security-owasp-threats/" }
    ],
    riskScore: 6,
    impactAnalysis: { confidentiality: false, integrity: true, availability: true },
    status: "active",
    version: "2025.1",
    lastUpdated: "2025-06-18",
    updatedBy: "enhanced-analysis",
    color: "#60a5fa",
    icon: "hitl",
    displayOrder: 10
  },
  "t11": {
    id: "t11",
    code: "T11",
    name: "Unexpected RCE",
    description: "Tools or environments enabling unexpected code execution, presenting direct risks to code execution environments.",
    impactLevel: "high",
    componentIds: ["kc5", "kc6"],
    affectedComponents: ["Tool Integration Layer (KC5.1-KC5.4)", "External Environment Interface (KC6.1-KC6.3)"],
    attackVectors: [
      { vector: "Code Injection via Tools", example: "Injecting malicious code through tool parameters", severity: "high" },
      { vector: "Interpreter Exploitation", example: "Exploiting code interpreter environments", severity: "high" },
      { vector: "Command Injection", example: "Executing system commands through tool interfaces", severity: "high" },
      { vector: "Script Upload & Execution", example: "Uploading and executing malicious scripts", severity: "high" },
      { vector: "Environment Escape", example: "Breaking out of sandboxed execution environments", severity: "medium" },
      { vector: "Deserialization Attacks", example: "Exploiting unsafe deserialization in tool data", severity: "medium" }
    ],
    mitigationNames: [
      "Runtime Security Controls & Sandboxing",
      "Tool Sandboxing & Isolation",
      "Zero Trust & Least Privilege Access",
      "Comprehensive Security Monitoring & Auditing",
      "Incident Response & Recovery Framework",
      "Supply Chain Security & Provenance"
    ],
    mitigationIds: ["m13", "m2", "m7", "m6", "m17", "m16"],
    tags: ["code-execution", "rce", "sandbox", "injection", "interpreter"],
    references: [
      { title: "Code Execution Threats in AI", url: "https://unit42.paloaltonetworks.com/agentic-ai-threats/" },
      { title: "Sandboxing AI Agent Execution", url: "https://undercodetesting.com/top-10-agentic-ai-threats-a-deep-dive-into-owasps-security-risks/" }
    ],
    riskScore: 9,
    impactAnalysis: { confidentiality: true, integrity: true, availability: true },
    status: "active",
    version: "2025.1",
    lastUpdated: "2025-06-18",
    updatedBy: "enhanced-analysis",
    color: "#fb7185",
    icon: "rce",
    displayOrder: 11
  },
  "t12": {
    id: "t12",
    code: "T12",
    name: "Communication Poisoning",
    description: "Injection of malicious data into inter-agent communication channels or using external systems for side channel communications and memory persistence.",
    impactLevel: "medium",
    componentIds: ["kc2", "kc4", "kc6"],
    affectedComponents: ["Agent Orchestration (KC2.1-KC2.5)", "Memory Modules (KC4.1-KC4.6)", "External Environment Interface (KC6.1-KC6.3)"],
    attackVectors: [
      { vector: "Message Injection", example: "Injecting malicious messages into inter-agent communication", severity: "medium" },
      { vector: "Protocol Manipulation", example: "Exploiting communication protocol vulnerabilities", severity: "medium" },
      { vector: "Side Channel Data Leakage", example: "Using covert channels to exfiltrate information", severity: "high" },
      { vector: "Communication Eavesdropping", example: "Intercepting sensitive inter-agent communications", severity: "medium" },
      { vector: "Feedback Loop Poisoning", example: "Corrupting agent feedback mechanisms", severity: "medium" },
      { vector: "Broadcast Storm Attacks", example: "Overwhelming communication channels with messages", severity: "medium" }
    ],
    mitigationNames: [
      "Secure Inter-Agent Communication",
      "Memory Validation & Sanitization",
      "Defense-in-Depth Architecture & Trust Boundaries",
      "Agent Identity & Authentication Framework"
    ],
    mitigationIds: ["m3", "m1", "m10", "m14"],
    tags: ["communication", "poisoning", "channels", "encryption", "protocols"],
    references: [
      { title: "Inter-Agent Communication Security", url: "https://www.solo.io/blog/deep-dive-mcp-and-a2a-attack-vectors-for-ai-agents" },
      { title: "Communication Protocol Threats", url: "https://blog.christianposta.com/understanding-mcp-and-a2a-attack-vectors-for-ai-agents/" }
    ],
    riskScore: 6,
    impactAnalysis: { confidentiality: true, integrity: true, availability: false },
    status: "active",
    version: "2025.1",
    lastUpdated: "2025-06-18",
    updatedBy: "enhanced-analysis",
    color: "#4ade80",
    icon: "communication",
    displayOrder: 12
  },
  "t13": {
    id: "t13",
    code: "T13",
    name: "Rogue Agents",
    description: "Compromised AI agent activity outside monitoring limits or orchestration in multi-agent systems.",
    impactLevel: "high",
    componentIds: ["kc2", "kc6"],
    affectedComponents: ["Agent Orchestration (KC2.1-KC2.5)", "External Environment Interface (KC6.1-KC6.3)"],
    attackVectors: [
      { vector: "Agent Compromise", example: "Malicious code injection into agent runtime", severity: "high" },
      { vector: "Orchestration Bypass", example: "Agent operating outside management framework", severity: "high" },
      { vector: "Unauthorized Agent Deployment", example: "Deploying malicious agents disguised as legitimate ones", severity: "high" },
      { vector: "Agent Hijacking", example: "Taking control of legitimate agent through vulnerabilities", severity: "medium" },
      { vector: "Swarm Infiltration", example: "Introducing malicious agents into multi-agent systems", severity: "high" },
      { vector: "Command and Control", example: "External control of compromised agents", severity: "medium" }
    ],
    mitigationNames: [
      "Agent Identity & Authentication Framework",
      "Comprehensive Security Monitoring & Auditing",
      "Zero Trust & Least Privilege Access",
      "Defense-in-Depth Architecture & Trust Boundaries",
      "Secure Inter-Agent Communication",
      "Runtime Security Controls & Sandboxing",
      "Supply Chain Security & Provenance",
      "Incident Response & Recovery Framework"
    ],
    mitigationIds: ["m14", "m6", "m7", "m10", "m3", "m13", "m16", "m17"],
    tags: ["rogue", "compromise", "orchestration", "multi-agent", "monitoring"],
    references: [
      { title: "Rogue Agent Detection", url: "https://www.xenonstack.com/blog/vulnerabilities-in-ai-agents" },
      { title: "Multi-Agent Security", url: "https://genai.owasp.org/resource/multi-agentic-system-threat-modeling-guide-v1-0/" }
    ],
    riskScore: 9,
    impactAnalysis: { confidentiality: true, integrity: true, availability: true },
    status: "active",
    version: "2025.1",
    lastUpdated: "2025-06-18",
    updatedBy: "enhanced-analysis",
    color: "#f59e42",
    icon: "rogue",
    displayOrder: 13
  },
  "t14": {
    id: "t14",
    code: "T14",
    name: "Human Attacks",
    description: "Exploits trust relationships between agents and workflows to manipulate human operators.",
    impactLevel: "medium",
    componentIds: ["kc2"],
    affectedComponents: ["Agent Orchestration (KC2.1-KC2.5)"],
    attackVectors: [
      { vector: "Trust Exploitation", example: "Using agent authority to manipulate human decisions", severity: "medium" },
      { vector: "Social Engineering via Agents", example: "Agents used as vectors for social engineering attacks", severity: "high" },
      { vector: "Authority Impersonation", example: "Agents claiming false authority to influence humans", severity: "medium" },
      { vector: "Delegation Abuse", example: "Exploiting human-agent delegation relationships", severity: "medium" },
      { vector: "Workflow Manipulation", example: "Altering workflows to create human vulnerabilities", severity: "medium" },
      { vector: "Information Asymmetry", example: "Leveraging agent access to information for manipulation", severity: "medium" }
    ],
    mitigationNames: [
      "Adaptive Human-in-the-Loop Controls",
      "Comprehensive Security Monitoring & Auditing",
      "Behavioral Monitoring & Ethics Framework",
      "Content Security & Output Filtering",
      "Agent Identity & Authentication Framework"
    ],
    mitigationIds: ["m8", "m6", "m15", "m11", "m14"],
    tags: ["human", "trust", "social-engineering", "manipulation", "workflow"],
    references: [
      { title: "Human-AI Trust Research", url: "https://www.humansecurity.com/learn/blog/agentic-ai-security-owasp-threats/" },
      { title: "Social Engineering via AI", url: "https://www.lasso.security/blog/agentic-ai-security-threats-2025" }
    ],
    riskScore: 6,
    impactAnalysis: { confidentiality: false, integrity: true, availability: false },
    status: "active",
    version: "2025.1",
    lastUpdated: "2025-06-18",
    updatedBy: "enhanced-analysis",
    color: "#fbbf24",
    icon: "human",
    displayOrder: 14
  },
  "t15": {
    id: "t15",
    code: "T15",
    name: "Human Manipulation",
    description: "Models exploit human trust to manipulate users, leveraging reasoning capabilities or operational access to influence human decisions.",
    impactLevel: "high",
    componentIds: ["kc1", "kc3", "kc6"],
    affectedComponents: ["Foundation Model (KC1.1-KC1.3)", "Reasoning Engine (KC3.1-KC3.4)", "External Environment Interface (KC6.1-KC6.3)"],
    attackVectors: [
      { vector: "Psychological Manipulation", example: "Using persuasion techniques to influence human behavior", severity: "high" },
      { vector: "Trust Exploitation", example: "Abusing human trust in AI systems for malicious purposes", severity: "high" },
      { vector: "Emotional Manipulation", example: "Exploiting human emotions to achieve compliance", severity: "medium" },
      { vector: "Information Manipulation", example: "Presenting biased or false information to influence decisions", severity: "high" },
      { vector: "Authority Mimicry", example: "Mimicking authoritative figures to gain compliance", severity: "medium" },
      { vector: "Cognitive Bias Exploitation", example: "Leveraging human cognitive biases for manipulation", severity: "medium" }
    ],
    mitigationNames: [
      "Behavioral Monitoring & Ethics Framework",
      "Content Security & Output Filtering",
      "Prompt Hardening & Jailbreak Prevention",
      "Multi-Stage Reasoning Validation",
      "Adaptive Human-in-the-Loop Controls"
    ],
    mitigationIds: ["m15", "m11", "m4", "m5", "m8"],
    tags: ["manipulation", "trust", "psychology", "influence", "ethics"],
    references: [
      { title: "AI Manipulation Research", url: "https://www.resilientcyber.io/p/agentic-ai-threats-and-mitigations" },
      { title: "Human-AI Interaction Ethics", url: "https://hai.stanford.edu/research" }
    ],
    riskScore: 8,
    impactAnalysis: { confidentiality: false, integrity: true, availability: false },
    status: "active",
    version: "2025.1",
    lastUpdated: "2025-06-18",
    updatedBy: "enhanced-analysis",
    color: "#a3e635",
    icon: "manipulation",
    displayOrder: 15
  }
};

// Mitigations data
// Enhanced Mitigations data
export const mitigationsData: Record<string, Mitigation> = {
  "m1": {
    id: "m1",
    name: "Memory Validation & Sanitization",
    description: "Implement comprehensive validation and sanitization of AI memory systems, including vector databases, embeddings, and training data to prevent poisoning attacks and ensure data integrity throughout the AI lifecycle.",
    threatIds: ["t1", "t8", "t12"],
    implementationDetail: {
      design: `**Memory Architecture Security Design:**
- Design secure memory validation frameworks for AI systems including vector databases, embedding stores, and knowledge bases
- Plan data integrity mechanisms with cryptographic checksums and validation protocols
- Design access control matrices for memory components with role-based and attribute-based controls
- Plan memory isolation strategies to prevent cross-contamination between different AI workloads
- Design data lineage tracking to maintain provenance and audit trails for all memory operations
- Plan secure data ingestion pipelines with multi-stage validation and sanitization
- Design memory encryption strategies for data at rest and in transit
- Plan backup and recovery mechanisms with integrity verification

**AISVS V1 Training Data Governance Integration:**
- Implement V1.1.1 data source documentation requirements with comprehensive metadata management
- Apply V1.1.2 data quality validation frameworks with automated quality gates
- Integrate V1.2.1 bias detection mechanisms into memory validation workflows
- Implement V1.2.2 bias mitigation controls during data preprocessing and storage

**AISVS V8 Memory & Vector Database Security:**
- Apply V8.1.1 vector database security controls with encryption and access management
- Implement V8.1.2 RAG data protection with secure knowledge base management
- Design secure embedding storage with integrity verification and access controls

**AISVS V11 Privacy Protection Integration:**
- Implement V11.1.1 data minimization principles in memory design
- Apply V11.1.2 differential privacy techniques where appropriate for sensitive data`,

      build: `**Data Validation and Sanitization Implementation:**
- Build comprehensive input validation for all data entering AI memory systems:
  * Schema validation for structured data with strict type checking and format verification
  * Content validation for unstructured data including malware scanning and content filtering
  * Semantic validation to detect anomalous patterns and potential poisoning attempts
  * Cross-reference validation against known good datasets and threat intelligence feeds
- Implement data sanitization pipelines:
  * Remove or neutralize potentially malicious content while preserving data utility
  * Apply differential privacy techniques to protect individual privacy in datasets
  * Implement data anonymization and pseudonymization where required by privacy regulations
  * Use secure multi-party computation for sensitive collaborative learning scenarios

**Memory Integrity and Access Control:**
- Build cryptographic integrity verification:
  * Implement hash-based integrity checking for all stored data with merkle tree structures
  * Use digital signatures for critical datasets to ensure authenticity and non-repudiation
  * Deploy blockchain-based provenance tracking for high-value datasets
  * Implement tamper-evident storage mechanisms with audit logging
- Deploy granular access controls:
  * Role-based access control (RBAC) with principle of least privilege
  * Attribute-based access control (ABAC) for context-aware permissions
  * Time-based access controls with automatic expiration and renewal
  * Geographic and network-based access restrictions

**Vector Database and Embedding Security:**
- Implement secure vector database configurations:
  * Deploy encryption at rest using AES-256 or equivalent strong encryption
  * Implement secure communication channels with TLS 1.3 for all database connections
  * Use database-level access controls with fine-grained permissions
  * Deploy database activity monitoring with real-time alerting for suspicious activities
- Build embedding security controls:
  * Implement embedding validation to detect adversarial or poisoned embeddings
  * Use secure embedding generation with validated and trusted models
  * Deploy embedding anonymization techniques to protect sensitive information
  * Implement embedding access logging and audit trails

**RAG and Knowledge Base Protection:**
- Build secure knowledge base management:
  * Implement document validation and sanitization before ingestion
  * Use access-controlled document retrieval with user context validation
  * Deploy content filtering to prevent retrieval of sensitive or inappropriate information
  * Implement query validation to prevent injection attacks through retrieval queries
- Deploy RAG security controls:
  * Validate retrieved context before injection into prompts
  * Implement context size limits to prevent prompt overflow attacks
  * Use secure prompt construction with proper escaping and validation
  * Deploy output filtering to prevent leakage of sensitive retrieved information`,

      operations: `**Continuous Memory Monitoring and Validation:**
- Execute real-time monitoring of all memory operations including reads, writes, updates, and deletions
- Deploy automated integrity checking with scheduled validation of stored data checksums
- Maintain comprehensive audit logs of all memory access patterns and data modifications
- Execute regular data quality assessments with automated reporting and alerting
- Deploy anomaly detection systems to identify unusual memory access patterns or data corruption
- Maintain data lineage tracking with comprehensive provenance documentation
- Execute regular backup validation and disaster recovery testing procedures

**Data Lifecycle Management Operations:**
- Operate automated data retention policies with secure deletion mechanisms
- Execute regular data classification reviews and access permission audits
- Maintain data inventory management with automated discovery and cataloging
- Deploy data loss prevention (DLP) systems to monitor and prevent unauthorized data exfiltration
- Execute regular privacy impact assessments and compliance validation
- Maintain vendor management programs for third-party data sources and processors
- Deploy incident response procedures specific to data breaches and integrity violations

**Performance and Optimization Operations:**
- Monitor memory system performance with capacity planning and optimization
- Execute regular performance tuning of validation and sanitization processes
- Maintain load balancing and failover mechanisms for high availability
- Deploy caching strategies that maintain security while improving performance
- Execute regular security testing including penetration testing of memory systems
- Maintain documentation of security configurations and operational procedures`,

      toolsAndFrameworks: `**Data Validation and Quality Tools:**
- **Open Source:** Great Expectations, Apache Griffin, Deequ, TensorFlow Data Validation
- **Commercial:** Informatica Data Quality, IBM InfoSphere QualityStage, Talend Data Quality
- **Cloud Native:** AWS Glue DataBrew, Google Cloud Data Prep, Azure Data Factory Data Flows
- **Specialized:** Monte Carlo (data observability), Bigeye (data quality monitoring)

**Vector Database and Embedding Security:**
- **Vector Databases:** Pinecone, Weaviate, Chroma, Milvus, Qdrant, Vespa
- **Security Extensions:** Vector database encryption modules, access control plugins
- **Embedding Security:** Adversarial Robustness Toolbox, TextAttack, embedding validation libraries
- **Monitoring:** Vector database monitoring tools, embedding drift detection systems

**Privacy and Anonymization Tools:**
- **Differential Privacy:** Google Differential Privacy library, OpenDP, IBM Differential Privacy Library
- **Anonymization:** ARX Data Anonymization Tool, Amnesia, μ-ARGUS
- **Synthetic Data:** Mostly AI, Gretel, Syntho, DataSynthesizer
- **Privacy-Preserving ML:** PySyft, TensorFlow Privacy, CrypTen

**Integrity and Audit Tools:**
- **Cryptographic Tools:** OpenSSL, Bouncy Castle, libsodium, HashiCorp Vault
- **Blockchain:** Hyperledger Fabric, Ethereum, Provenance tracking solutions
- **Audit and Compliance:** Apache Atlas, LinkedIn DataHub, Collibra, Alation
- **Monitoring:** Datadog, New Relic, Elastic Stack, Prometheus + Grafana`
    },
    designPhase: true,
    buildPhase: true,
    operationPhase: true,
    mitigatedThreatNames: ["Memory Poisoning", "Repudiation", "Communication Poisoning"],
    mitigatedThreatIds: ["t1", "t8", "t12"],
    tags: ["memory", "validation", "sanitization", "integrity", "aisvs-v1", "aisvs-v8", "aisvs-v11"],
    references: [
      { title: "OWASP AISVS V1: Training Data Governance", url: "https://github.com/OWASP/AISVS/tree/main/1.0/en" },
      { title: "OWASP AISVS V8: Memory & Vector Database Security", url: "https://github.com/OWASP/AISVS/tree/main/1.0/en" },
      { title: "OWASP AISVS V11: Privacy Protection", url: "https://github.com/OWASP/AISVS/tree/main/1.0/en" },
      { title: "NIST AI Risk Management Framework", url: "https://www.nist.gov/itl/ai-risk-management-framework" },
      { title: "Vector Database Security Best Practices", url: "https://weaviate.io/blog/security-best-practices" },
      { title: "AI Data Quality Framework", url: "https://www.iso.org/standard/35736.html" },
      { title: "Differential Privacy for Machine Learning", url: "https://github.com/google/differential-privacy" },
      { title: "RAG Security Considerations", url: "https://arxiv.org/abs/2312.10997" }
    ],
    riskScore: 9,
    status: "active",
    version: "2025.1",
    lastUpdated: "2025-01-20",
    updatedBy: "aisvs-integration",
    color: "#3b82f6",
    icon: "database",
    displayOrder: 1
  },

  "m2": {
    id: "m2",
    name: "Tool Sandboxing & Isolation",
    description: "Implement defense-in-depth isolation for tool execution environments using containerization, virtualization, and strict resource controls to prevent tool misuse, contain breaches, and prevent unexpected code execution.",
    threatIds: ["t2", "t3", "t11", "t4"],
    implementationDetail: {
      design: `**Tool Risk Assessment & Classification:**
- Define tool risk categories based on capabilities:
  * LOW RISK: Read-only operations, data retrieval, calculations
  * MEDIUM RISK: File operations, API calls, data processing
  * HIGH RISK: System operations, network access, database writes
  * CRITICAL RISK: Financial transactions, user impersonation, system administration
- Design isolation requirements per risk level with appropriate boundaries
- Plan fail-safe mechanisms for tool failures and timeout scenarios
- Design tool capability attestation and verification systems
- Plan tool dependency mapping and security verification
- Design tool communication protocols with security controls

**Sandboxing Architecture:**
- Design container-based isolation strategy using Docker/Podman with security profiles
- Plan microVM isolation for critical tools using Firecracker or QEMU/KVM
- Design WebAssembly (WASM) sandboxes for lightweight, memory-safe execution
- Plan network isolation strategies with custom namespaces and firewalls
- Design resource quotas and limits for CPU, memory, disk, and network
- Plan security policy enforcement using AppArmor, SELinux, or seccomp-bpf
- Design tool chaining security to prevent privilege escalation

**Execution Environment Design:**
- Plan ephemeral execution contexts with automatic cleanup
- Design stateless tool execution patterns
- Plan secure tool parameter passing mechanisms
- Design tool output validation and sanitization pipelines
- Plan tool execution monitoring and logging strategies
- Design tool capability tokens and permission verification`,

      build: `**Container Isolation Implementation:**
- Deploy Docker containers with hardened security profiles:
  * Use minimal base images (distroless, Alpine Linux)
  * Implement resource limits using cgroups v2
  * Deploy AppArmor/SELinux profiles for container security
  * Use read-only filesystems where possible
  * Implement capability dropping and privilege restrictions
- Configure container networking with restricted egress:
  * Use custom network namespaces with controlled routing
  * Implement firewall rules (iptables/nftables) per container
  * Deploy network policies in Kubernetes environments
  * Use service mesh (Istio/Linkerd) for secure inter-container communication

**Advanced Isolation Techniques:**
- Deploy gVisor for kernel-level isolation of high-risk tools
- Implement Firecracker microVMs for critical tool isolation
- Use WebAssembly (WASM) sandboxes with WASI for portable isolation
- Deploy Kata Containers for VM-level container security
- Implement user namespace mapping for privilege separation
- Use chroot jails for filesystem isolation

**Resource Controls Implementation:**
- CPU Limits: Configure cgroups v2 cpu.max settings and CPU quotas
- Memory Limits: Set memory.max and memory.swap.max restrictions
- I/O Limits: Implement blkio throttling and disk quota management
- Network Limits: Deploy bandwidth limiting and connection quotas
- Process Limits: Set pids.max to prevent fork bombs and process exhaustion
- Time Limits: Implement execution timeouts with automatic termination

**Tool Security Framework:**
- Build tool wrapper libraries with input validation and output sanitization
- Implement tool capability verification and permission checking
- Deploy tool execution monitoring with real-time policy enforcement
- Build tool result verification and integrity checking
- Implement tool chain validation for complex operations`,

      operations: `**Runtime Security Operations:**
- Monitor container and sandbox health with automated restarts
- Execute regular security scans of container images and runtime environments
- Maintain updated base images with security patches
- Monitor resource usage patterns and detect anomalies
- Execute periodic security assessments of tool configurations
- Maintain tool capability registries with security metadata
- Deploy automated threat detection for unusual tool behavior

**Container Management:**
- Use container orchestration (Kubernetes) with security policies
- Implement pod security standards and network policies
- Deploy admission controllers for security policy enforcement
- Use image scanning and vulnerability assessment tools
- Implement container runtime security monitoring
- Maintain container image registries with security scanning

**Incident Response for Sandboxed Tools:**
- Deploy automated containment for compromised sandboxes
- Implement forensic data collection from isolated environments
- Maintain tool execution logs for security analysis
- Execute automated rollback and recovery procedures
- Deploy threat hunting capabilities for sandbox environments
- Implement automated indicators of compromise (IoC) detection

**Performance & Scaling:**
- Monitor sandbox performance and resource utilization
- Implement auto-scaling for tool execution environments
- Deploy load balancing for distributed tool execution
- Optimize sandbox startup times and resource allocation
- Maintain tool execution analytics and performance metrics`,

      toolsAndFrameworks: `**Containerization & Orchestration:**
- **Container Runtimes:** Docker Engine, Podman, containerd with security configurations
- **Orchestration:** Kubernetes with Pod Security Standards, OpenShift with enhanced security
- **Advanced Isolation:** gVisor, Kata Containers, Firecracker microVMs
- **WebAssembly:** Wasmtime, WasmEdge, WASI SDK for portable sandboxing

**Security Enforcement:**
- **Linux Security Modules:** AppArmor profiles, SELinux policies, seccomp-bpf filters
- **Network Security:** Calico, Cilium, Istio service mesh, Linkerd
- **Policy Enforcement:** Open Policy Agent (OPA), Gatekeeper, Falco for runtime security
- **Image Security:** Trivy, Twistlock/Prisma Cloud, Aqua Security

**Resource Management:**
- **Resource Limits:** cgroups v2, systemd, Kubernetes resource quotas
- **Monitoring:** Prometheus, Grafana, cAdvisor for container metrics
- **Performance:** Intel Clear Containers, AWS Nitro Enclaves
- **Storage:** Persistent volumes with encryption, ephemeral storage management

**Development & Testing:**
- **Sandbox Testing:** Docker Compose for development, Kind for Kubernetes testing
- **Security Testing:** Anchore, Clair for vulnerability scanning
- **Compliance:** Docker Bench, kube-bench for security benchmarking
- **Cloud Services:** AWS Lambda, Google Cloud Run, Azure Container Instances with security features`
    },
    designPhase: true,
    buildPhase: true,
    operationPhase: true,
    mitigatedThreatNames: ["Tool Misuse", "Privilege Compromise", "Unexpected RCE", "Resource Overload"],
    mitigatedThreatIds: ["t2", "t3", "t11", "t4"],
    tags: ["sandboxing", "containers", "isolation", "security"],
    references: [
      { title: "Container Security Best Practices", url: "https://kubernetes.io/docs/concepts/security/" },
      { title: "gVisor Security Model", url: "https://gvisor.dev/docs/architecture_guide/security/" },
      { title: "NIST Container Security", url: "https://csrc.nist.gov/publications/detail/sp/800-190/final" }
    ],
    riskScore: 9,
    status: "active",
    version: "2024.2",
    lastUpdated: "2024-12-01",
    updatedBy: "enhanced",
    color: "#f87171",
    icon: "sandbox",
    displayOrder: 2
  },

  "m3": {
    id: "m3",
    name: "Secure Inter-Agent Communication",
    description: "Implement cryptographically secure communication channels between agents with authentication, integrity verification, replay protection, and support for decentralized identity to prevent spoofing, poisoning attacks, and rogue agent infiltration.",
    threatIds: ["t9", "t12", "t13", "t3"],
    implementationDetail: {
      design: `**Agent Identity Architecture:**
- Design agent identity model using public key infrastructure (PKI) with X.509 certificates
- Plan Decentralized Identifiers (DIDs) implementation for self-sovereign agent identities
- Design Verifiable Credentials (VCs) system for agent capability attestation
- Plan agent trust relationships and delegation patterns
- Design agent identity lifecycle management (creation, rotation, revocation)
- Plan cross-domain trust establishment and verification mechanisms
- Design agent reputation systems for trust scoring
- Plan identity recovery and backup mechanisms for agent keys

**Communication Security Architecture:**
- Design end-to-end encryption for all agent-to-agent communication
- Plan message authentication and integrity verification protocols
- Design replay attack prevention using nonces and timestamps
- Plan secure session establishment and key exchange mechanisms
- Design communication protocol selection (mTLS, Noise Protocol, libp2p)
- Plan message ordering and delivery guarantees
- Design communication audit trails and non-repudiation mechanisms
- Plan communication failover and redundancy strategies

**Protocol Design:**
- Design secure message format with authentication, encryption, and metadata
- Plan protocol version negotiation and compatibility management
- Design communication middleware for transparent security
- Plan message routing and discovery protocols with security controls
- Design broadcast and multicast security for swarm communications
- Plan secure group communication for collaborative agents`,

      build: `**Cryptographic Implementation:**
- Implement mutual TLS (mTLS) with certificate pinning for agent communications:
  * Use strong cipher suites (ECDHE-RSA-AES256-GCM-SHA384 or better)
  * Implement certificate rotation and automated renewal
  * Deploy certificate transparency monitoring
  * Use hardware security modules (HSMs) for key protection
- Deploy message-level encryption using NaCl/libsodium:
  * Implement authenticated encryption with additional data (AEAD)
  * Use separate keys for confidentiality and authentication
  * Implement perfect forward secrecy with ephemeral keys
  * Deploy key derivation functions for session keys

**Message Authentication & Integrity:**
- Implement HMAC-SHA256 for message authentication codes
- Deploy digital signatures using ECDSA or EdDSA for non-repudiation
- Use content-based addressing with cryptographic hashes for message integrity
- Implement message sequence numbers for ordering and gap detection
- Deploy timestamp validation with clock synchronization
- Use nonce generation and validation for replay protection

**Agent Authentication System:**
- Build PKI infrastructure for agent certificate management
- Implement SPIFFE/SPIRE for workload identity in containerized environments
- Deploy OAuth 2.0 with client credentials flow for agent-to-agent authentication
- Build JWT token validation with proper signature verification
- Implement agent capability verification using Verifiable Credentials
- Deploy agent identity attestation using hardware trust anchors

**Communication Protocols:**
- Implement secure WebSocket connections with proper upgrade procedures
- Deploy gRPC with TLS for high-performance agent communication
- Build message queue security using AMQP over TLS (RabbitMQ, Apache Qpid)
- Implement event streaming security using Kafka with SASL/SCRAM
- Deploy peer-to-peer communication using libp2p with security transports
- Build REST API security with proper authentication and authorization headers`,

      operations: `**Communication Monitoring & Management:**
- Monitor all agent communications for security anomalies and policy violations
- Maintain communication performance metrics and latency monitoring
- Execute regular certificate rotation and key management operations
- Deploy automated threat detection for communication patterns
- Maintain communication audit logs with tamper-evident storage
- Execute communication protocol updates and security patching
- Monitor communication bandwidth and resource utilization

**Identity & Certificate Management:**
- Operate certificate authority (CA) infrastructure with proper security controls
- Execute automated certificate issuance, renewal, and revocation
- Maintain certificate transparency logs and monitoring
- Deploy identity verification workflows for new agents
- Execute periodic identity audits and access reviews
- Maintain agent reputation scoring and trust metrics
- Deploy identity incident response procedures

**Security Operations:**
- Monitor for communication anomalies and potential attacks
- Execute threat hunting for malicious communication patterns
- Deploy intrusion detection for encrypted communications
- Maintain communication security baselines and deviation detection
- Execute security assessments of communication protocols
- Deploy automated response to communication security incidents

**Performance & Reliability:**
- Monitor communication latency and throughput metrics
- Execute capacity planning for communication infrastructure
- Deploy load balancing and failover for communication services
- Maintain communication service level agreements (SLAs)
- Execute disaster recovery procedures for communication systems`,

      toolsAndFrameworks: `**Identity & Authentication:**
- **PKI Systems:** OpenSSL, CFSSL, Step-ca for certificate management
- **Identity Standards:** SPIFFE/SPIRE for workload identity, W3C DIDs for decentralized identity
- **Authentication:** OAuth 2.0 (Auth0, Keycloak), JWT libraries, mTLS implementations
- **Credential Management:** HashiCorp Vault, AWS Secrets Manager, Azure Key Vault

**Secure Communication:**
- **TLS/mTLS:** OpenSSL, BoringSSL, rustls for transport security
- **Message Encryption:** libsodium, NaCl, AES-GCM implementations
- **Messaging:** Apache Kafka with SASL, RabbitMQ with TLS, NATS with JWT
- **P2P Communication:** libp2p, Noise Protocol Framework, WireGuard

**Network Security:**
- **Service Mesh:** Istio, Linkerd, Consul Connect for secure service communication
- **Network Policies:** Calico, Cilium for Kubernetes network security
- **Load Balancing:** Envoy Proxy, HAProxy with TLS termination
- **Monitoring:** Wireshark for protocol analysis, tcpdump for traffic inspection

**Development & Testing:**
- **Testing Frameworks:** testcontainers for integration testing, chaos engineering tools
- **Protocol Testing:** Burp Suite, OWASP ZAP for security testing
- **Performance Testing:** Apache JMeter, k6 for load testing
- **Compliance:** FIPS 140-2 validated cryptographic modules, Common Criteria evaluations`
    },
    designPhase: true,
    buildPhase: true,
    operationPhase: true,
    mitigatedThreatNames: ["Identity Spoofing", "Communication Poisoning", "Rogue Agents", "Privilege Compromise"],
    mitigatedThreatIds: ["t9", "t12", "t13", "t3"],
    tags: ["communication", "identity", "encryption", "authentication"],
    references: [
      { title: "mTLS Best Practices", url: "https://smallstep.com/blog/use-tls/" },
      { title: "SPIFFE/SPIRE Documentation", url: "https://spiffe.io/docs/" },
      { title: "W3C DID Specification", url: "https://www.w3.org/TR/did-core/" }
    ],
    riskScore: 8,
    status: "active",
    version: "2024.2",
    lastUpdated: "2024-12-01",
    updatedBy: "enhanced",
    color: "#38bdf8",
    icon: "comm",
    displayOrder: 3
  },

  "m4": {
    id: "m4",
    name: "Prompt Hardening & Jailbreak Prevention",
    description: "Implement multiple layers of prompt security including structural defenses, behavioral constraints, runtime detection, and advanced techniques to prevent prompt injection, model manipulation, and jailbreaking attempts.",
    threatIds: ["t5", "t6", "t7", "t15", "t1"],
    implementationDetail: {
      design: `**Prompt Architecture Design:**
- Design clear separation between system prompts and user inputs using structured delimiters
- Plan hierarchical instruction priority system (IMMUTABLE > SYSTEM > USER preferences)
- Design behavioral constraint frameworks with explicit forbidden action lists
- Plan prompt versioning and A/B testing strategies for security improvements
- Design context isolation mechanisms to prevent instruction bleeding
- Plan prompt template security with parameterized input handling
- Design multi-language prompt security for international deployments
- Plan prompt monitoring and anomaly detection strategies

**Defensive Prompt Engineering:**
- Design XML tag isolation patterns for clear instruction boundaries
- Plan instruction re-contextualization techniques to treat user input as data
- Design few-shot example patterns for desired and undesired behaviors
- Plan constitutional AI integration for principle-based responses
- Design prompt complexity limits and input validation rules
- Plan output validation patterns for generated responses
- Design prompt injection detection heuristics and ML-based classifiers
- Plan prompt recovery mechanisms for failed security checks

**Security Layer Architecture:**
- Design multi-layered defense with input filtering, prompt hardening, and output validation
- Plan real-time prompt injection detection and response mechanisms
- Design prompt audit trails and security event logging
- Plan prompt security policy enforcement points
- Design prompt testing and validation frameworks
- Plan prompt security metrics and monitoring dashboards`,

      build: `**Structural Prompt Defenses:**
- Implement XML tag isolation with clear instruction boundaries:
  * Use <system_instructions> and <user_query> tags for separation
  * Implement instruction hierarchy with priority levels
  * Deploy delimiter validation and enforcement
  * Use escaping mechanisms for special characters in user input
- Build instruction re-contextualization frameworks:
  * Implement "treat as data" instructions for user inputs
  * Build context switching mechanisms for different input types
  * Deploy input normalization and canonicalization
  * Implement input length limits and complexity controls

**Behavioral Constraint Implementation:**
- Deploy constitutional AI frameworks for principle-based responses
- Build explicit deny-lists for forbidden actions and topics
- Implement behavioral monitoring with real-time constraint enforcement
- Deploy response validation against security policies
- Build escalation mechanisms for policy violations
- Implement adaptive constraint adjustment based on threat intelligence

**Injection Detection & Prevention:**
- Build ML-based prompt injection classifiers using transformer models
- Implement rule-based detection for known jailbreak patterns
- Deploy input anomaly detection for unusual prompt structures
- Build real-time prompt analysis with threat scoring
- Implement prompt input sanitization and normalization
- Deploy adversarial prompt detection using embedding analysis

**Output Validation Framework:**
- Build response validation against intended functionality
- Implement content filtering for harmful or policy-violating outputs
- Deploy response consistency checking across multiple generations
- Build output attribution and provenance tracking
- Implement response audit trails for security analysis`,

      operations: `**Prompt Security Operations:**
- Monitor prompt injection attempts and attack patterns in real-time
- Execute regular prompt security assessments and penetration testing
- Maintain prompt security baselines and deviation detection
- Deploy automated prompt security policy updates
- Execute prompt vulnerability scanning and remediation
- Maintain prompt security metrics and reporting dashboards
- Deploy incident response procedures for prompt security breaches

**Continuous Improvement:**
- Execute A/B testing for prompt security improvements
- Analyze prompt security logs for attack pattern identification
- Update prompt security policies based on threat intelligence
- Execute red team exercises against prompt security defenses
- Maintain prompt security knowledge base and best practices
- Deploy automated prompt security testing in CI/CD pipelines

**Threat Intelligence Integration:**
- Monitor public disclosure of new jailbreak techniques
- Update detection rules based on emerging attack patterns
- Execute threat hunting for novel prompt injection methods
- Maintain threat intelligence feeds for prompt security
- Deploy automated threat intelligence integration for prompt defenses
- Execute collaborative threat sharing with security community

**Performance Monitoring:**
- Monitor prompt processing latency and performance impact
- Execute capacity planning for prompt security infrastructure
- Deploy performance optimization for security controls
- Maintain service level agreements for prompt processing
- Execute scalability testing for prompt security systems`,

      toolsAndFrameworks: `**Prompt Security Frameworks:**
- **Prompt Management:** LangChain Prompt Templates, OpenAI Evals, Promptfoo for testing
- **Injection Detection:** Rebuff.ai, LLM Guard, custom ML classifiers using HuggingFace
- **Constitutional AI:** Anthropic Constitutional AI, IBM Watsonx governance
- **Guardrails:** NVIDIA NeMo Guardrails, Microsoft Guidance, Guardrails AI

**Detection & Analysis:**
- **ML Frameworks:** scikit-learn, TensorFlow, PyTorch for injection detection models
- **NLP Libraries:** spaCy, NLTK, Transformers for text analysis
- **Anomaly Detection:** Isolation Forest, One-Class SVM, DBSCAN clustering
- **Pattern Matching:** Regular expressions, Aho-Corasick algorithm implementations

**Testing & Validation:**
- **Security Testing:** Garak LLM scanner, PyRIT for red teaming, custom fuzzing tools
- **Prompt Testing:** Promptfoo, LangChain evaluations, custom test harnesses
- **Benchmarking:** HELM benchmark, OpenAI Evals, custom security benchmarks
- **Monitoring:** Weights & Biases, MLflow, custom prompt monitoring solutions

**Integration & Deployment:**
- **API Gateways:** Kong, Istio, AWS API Gateway with custom security plugins
- **Monitoring:** Prometheus, Grafana, DataDog for prompt security metrics
- **Logging:** ELK Stack, Splunk, custom structured logging solutions
- **CI/CD Integration:** GitHub Actions, GitLab CI, Jenkins with security testing plugins`
    },
    designPhase: true,
    buildPhase: true,
    operationPhase: true,
    mitigatedThreatNames: ["Cascading Hallucination", "Intent Breaking & Goal Manipulation", "Misaligned Behaviors", "Human Manipulation", "Memory Poisoning"],
    mitigatedThreatIds: ["t5", "t6", "t7", "t15", "t1"],
    tags: ["prompts", "injection", "jailbreak", "security"],
    references: [
      { title: "Prompt Injection Guide", url: "https://simonwillison.net/2022/Sep/12/prompt-injection/" },
      { title: "Constitutional AI Paper", url: "https://arxiv.org/abs/2212.08073" },
      { title: "OWASP LLM Top 10", url: "https://llmtop10.com/" }
    ],
    riskScore: 8,
    status: "active",
    version: "2024.2",
    lastUpdated: "2024-12-01",
    updatedBy: "enhanced",
    color: "#fbbf24",
    icon: "prompt",
    displayOrder: 4
  },

  "m5": {
    id: "m5",
    name: "Multi-Stage Reasoning Validation",
    description: "Implement comprehensive validation of agent reasoning processes using multiple checkpoints, external validators, consistency checks, and fact verification to ensure goal alignment, prevent manipulation, and detect hallucinations.",
    threatIds: ["t5", "t6", "t7", "t1"],
    implementationDetail: {
      design: `**Reasoning Validation Architecture:**
- Design multi-stage validation pipeline with pre-execution, mid-execution, and post-execution checks
- Plan reasoning checkpoint system with mandatory validation gates
- Design external validator integration for critical decision points
- Plan consistency checking mechanisms across reasoning chains
- Design fact verification integration with authoritative sources
- Plan reasoning transparency and explainability frameworks
- Design reasoning quality metrics and scoring systems
- Plan reasoning audit trails and decision provenance tracking

**Validation Framework Design:**
- Design constitutional AI integration for principle-based reasoning validation
- Plan "LLM as a Judge" implementation for reasoning quality assessment
- Design ground truth verification systems for factual claims
- Plan reasoning pattern analysis for anomaly detection
- Design reasoning confidence scoring and uncertainty quantification
- Plan reasoning fallback mechanisms for failed validations
- Design reasoning performance metrics and benchmarking
- Plan reasoning security policy enforcement at validation points

**Multi-Model Validation Strategy:**
- Design ensemble validation using multiple LLMs for cross-verification
- Plan specialized validator models for different reasoning types
- Design adversarial validation using models trained to detect manipulation
- Plan reasoning comparison and consensus mechanisms
- Design model diversity requirements for validation robustness
- Plan validation model security and integrity protection`,

      build: `**Reasoning Validation Pipeline:**
- Build pre-execution validation for planned actions and reasoning chains:
  * Implement plan parsing and structured analysis
  * Deploy goal alignment verification against original objectives
  * Build safety constraint checking for proposed actions
  * Implement resource consumption validation
  * Deploy policy compliance verification
  * Build risk assessment for proposed reasoning chains
- Implement mid-execution monitoring and validation:
  * Deploy real-time reasoning step validation
  * Build consistency checking across reasoning steps
  * Implement fact verification with external sources
  * Deploy logical coherence analysis
  * Build intermediate result validation
  * Implement dynamic risk reassessment

**Constitutional AI Implementation:**
- Deploy principle-based validation using constitutional AI frameworks
- Build custom constitution definitions for domain-specific validation
- Implement principle violation detection and response mechanisms
- Deploy constitutional fine-tuning for specialized validators
- Build principle hierarchy and conflict resolution mechanisms
- Implement constitutional learning and adaptation

**LLM-as-a-Judge Framework:**
- Build specialized judge models for reasoning quality assessment
- Implement multi-criteria evaluation (accuracy, safety, alignment, coherence)
- Deploy ensemble judging with multiple validator models
- Build judge model training pipelines with curated datasets
- Implement judge calibration and bias detection
- Deploy judge performance monitoring and improvement systems

**Fact Verification System:**
- Integrate authoritative knowledge bases for fact checking
- Build real-time web search integration for current information
- Implement source credibility assessment and scoring
- Deploy multi-source fact verification and consensus building
- Build fact contradiction detection and resolution
- Implement fact freshness validation and update mechanisms`,

      operations: `**Validation Operations Management:**
- Monitor reasoning validation performance and accuracy metrics
- Execute regular validation model retraining and improvement
- Maintain validation ground truth datasets and benchmarks
- Deploy validation system health monitoring and alerting
- Execute validation quality assurance and calibration testing
- Maintain validation performance baselines and improvement tracking
- Deploy validation system incident response and recovery procedures

**Reasoning Quality Monitoring:**
- Monitor reasoning chain quality and consistency across agents
- Execute reasoning pattern analysis for anomaly detection
- Deploy reasoning performance metrics and trend analysis
- Maintain reasoning quality benchmarks and comparisons
- Execute reasoning audit trail analysis and investigation
- Deploy reasoning security event detection and response

**Continuous Improvement:**
- Execute reasoning validation model updates based on new threats
- Analyze reasoning validation failures for system improvement
- Update validation criteria based on domain knowledge evolution
- Execute A/B testing for validation system enhancements
- Maintain validation system documentation and best practices
- Deploy collaborative improvement with research communities

**Performance & Scalability:**
- Monitor validation system latency and throughput
- Execute capacity planning for validation infrastructure
- Deploy load balancing and scaling for validation services
- Maintain validation system availability and reliability
- Execute performance optimization for validation pipelines`,

      toolsAndFrameworks: `**Reasoning Validation Frameworks:**
- **Constitutional AI:** Anthropic Constitutional AI, custom principle-based validators
- **LLM Judges:** GPT-4 for evaluation, Claude for reasoning assessment, custom judge models
- **Validation Libraries:** LangChain Constitutional Chain, Guardrails AI validation
- **Reasoning Frameworks:** Chain-of-Thought validation, Tree-of-Thought verification

**Fact Verification & Knowledge:**
- **Knowledge Bases:** Wikidata, DBpedia, Google Knowledge Graph, custom domain KB
- **Search Integration:** Bing Search API, Google Search API, DuckDuckGo API
- **Fact Checking:** FactCheck.org API, ClaimBuster, custom fact verification models
- **Source Credibility:** NewsGuard API, Media Bias/Fact Check, AllSides bias detection

**ML & Analytics:**
- **Model Frameworks:** HuggingFace Transformers, OpenAI API, Anthropic API
- **Ensemble Methods:** scikit-learn ensemble models, custom voting classifiers
- **Uncertainty Quantification:** Monte Carlo dropout, ensemble disagreement, calibration
- **Anomaly Detection:** Isolation Forest, One-Class SVM, custom outlier detection

**Monitoring & Operations:**
- **Metrics:** Prometheus, Grafana, custom reasoning quality dashboards
- **Logging:** Structured logging with reasoning metadata, ELK Stack integration
- **Benchmarking:** Custom reasoning benchmarks, academic evaluation datasets
- **CI/CD Integration:** Automated validation testing, reasoning regression testing`
    },
    designPhase: true,
    buildPhase: true,
    operationPhase: true,
    mitigatedThreatNames: ["Cascading Hallucination", "Intent Breaking & Goal Manipulation", "Misaligned Behaviors", "Memory Poisoning"],
    mitigatedThreatIds: ["t5", "t6", "t7", "t1"],
    tags: ["reasoning", "validation", "consistency", "fact-checking"],
    references: [
      { title: "Constitutional AI", url: "https://arxiv.org/abs/2212.08073" },
      { title: "LLM as a Judge", url: "https://arxiv.org/abs/2306.05685" },
      { title: "Reasoning Validation", url: "https://arxiv.org/abs/2305.14552" }
    ],
    riskScore: 7,
    status: "active",
    version: "2024.2",
    lastUpdated: "2024-12-01",
    updatedBy: "enhanced",
    color: "#34d399",
    icon: "validate",
    displayOrder: 5
  },

  "m6": {
    id: "m6",
    name: "Comprehensive Security Monitoring & Auditing",
    description: "Implement end-to-end observability with security-focused monitoring, anomaly detection, tamper-evident logging, and advanced threat hunting to ensure accountability, enable incident response, and detect rogue agents.",
    threatIds: ["t8", "t13", "t14", "t2", "t3"],
    implementationDetail: {
      design: `**Security Monitoring Architecture:**
- Design comprehensive logging strategy covering all agent activities and decisions
- Plan security event taxonomy and classification system
- Design real-time monitoring and alerting infrastructure
- Plan log aggregation and correlation across distributed agent systems
- Design anomaly detection algorithms for agent behavior analysis
- Plan security metrics and key performance indicators (KPIs)
- Design incident response integration with monitoring systems
- Plan compliance reporting and audit trail requirements

**Logging Framework Design:**
- Design structured logging format with security metadata and context
- Plan log retention policies and lifecycle management
- Design tamper-evident logging with cryptographic integrity
- Plan log access controls and privacy protection mechanisms
- Design log anonymization and pseudonymization for sensitive data
- Plan log storage encryption and secure archival
- Design log correlation and analysis frameworks
- Plan log export and integration with external SIEM systems

**Anomaly Detection Strategy:**
- Design baseline behavior modeling for agents and users
- Plan machine learning models for anomaly detection
- Design statistical process control for agent performance monitoring
- Plan threat intelligence integration for known attack patterns
- Design behavioral clustering and outlier detection
- Plan contextual anomaly detection based on agent roles and permissions
- Design ensemble anomaly detection using multiple algorithms
- Plan adaptive threshold adjustment based on environmental changes`,

      build: `**Comprehensive Logging Infrastructure:**
- Implement structured logging with JSON format and standardized fields:
  * Agent ID, session ID, user ID, timestamp with high precision
  * Action type, tool usage, parameters, results, and error codes
  * Security context including authentication method, IP address, risk score
  * Payload hashes and digital signatures for integrity verification
  * Performance metrics including duration, resource consumption
- Deploy tamper-evident logging with cryptographic hash chains:
  * Forward integrity using Merkle trees for log verification
  * Centralized logging with write-only access and role separation
  * Log shipping to SIEM systems (Splunk, ELK Stack, Datadog)
  * Cryptographic signing of critical security events

**Anomaly Detection Implementation:**
- Build behavioral baseline models using machine learning:
  * Time series analysis for usage patterns and resource consumption
  * Statistical models for normal agent behavior and communication patterns
  * Clustering algorithms for user behavior classification
  * Deep learning models for complex pattern recognition
- Deploy real-time anomaly detection rules:
  * Unusual tool usage patterns (frequency, sequence, parameters)
  * Privilege escalation attempts and permission violations
  * Data exfiltration indicators and unusual data access patterns
  * Communication with unexpected endpoints and domains
  * Resource usage spikes and performance anomalies

**Security Event Management:**
- Build security event correlation and enrichment engines
- Implement automated incident creation and escalation workflows
- Deploy threat intelligence integration for IoC matching
- Build security dashboard and visualization systems
- Implement automated response and containment mechanisms
- Deploy forensic data collection and preservation systems

**Advanced Monitoring Capabilities:**
- Build user entity behavior analytics (UEBA) for agent interactions
- Implement network traffic analysis for agent communications
- Deploy file integrity monitoring for agent configurations and models
- Build application performance monitoring with security context
- Implement database activity monitoring for agent data access`,

      operations: `**Security Operations Center (SOC) Integration:**
- Operate 24/7 security monitoring with trained analysts
- Execute threat hunting activities using collected telemetry
- Maintain security incident response procedures and playbooks
- Deploy automated threat detection and response systems
- Execute regular security assessments and penetration testing
- Maintain threat intelligence feeds and indicator management
- Deploy security awareness training for operations personnel

**Continuous Monitoring Operations:**
- Monitor security event volumes and processing performance
- Execute regular tuning of detection rules and thresholds
- Maintain monitoring system health and availability
- Deploy capacity planning for logging and monitoring infrastructure
- Execute backup and disaster recovery for monitoring systems
- Maintain monitoring system updates and security patching
- Deploy compliance reporting and audit support

**Incident Response Operations:**
- Execute incident triage and severity classification
- Deploy forensic analysis capabilities for security events
- Maintain evidence collection and chain of custody procedures
- Execute incident containment and eradication procedures
- Deploy communication and notification workflows
- Maintain post-incident analysis and lessons learned processes
- Deploy legal and regulatory compliance support

**Performance & Optimization:**
- Monitor system performance impact of security monitoring
- Execute optimization of logging and monitoring overhead
- Deploy intelligent sampling and filtering for high-volume events
- Maintain storage optimization and archival strategies
- Execute regular performance tuning and capacity planning`,

      toolsAndFrameworks: `**SIEM & Log Management:**
- **Enterprise SIEM:** Splunk Enterprise Security, IBM QRadar, ArcSight, Sentinel
- **Open Source:** ELK Stack (Elasticsearch, Logstash, Kibana), Graylog, OSSIM
- **Cloud SIEM:** Azure Sentinel, AWS Security Hub, Google Chronicle, Sumo Logic
- **Log Aggregation:** Fluentd, Logstash, Vector, rsyslog with encryption

**Monitoring & Analytics:**
- **Application Monitoring:** Datadog, New Relic, Dynatrace with custom metrics
- **Infrastructure Monitoring:** Prometheus + Grafana, Zabbix, Nagios
- **ML/AI Monitoring:** MLflow, Weights & Biases, Arize, WhyLabs
- **Network Monitoring:** Wireshark, ntopng, SolarWinds, Nagios XI

**Anomaly Detection & ML:**
- **ML Frameworks:** scikit-learn, TensorFlow, PyTorch for custom models
- **Time Series:** Prophet, ARIMA, LSTM for temporal anomaly detection
- **Clustering:** DBSCAN, K-means, Isolation Forest for outlier detection
- **Stream Processing:** Apache Kafka, Apache Storm, Apache Flink

**Security Tools:**
- **Threat Intelligence:** MISP, ThreatConnect, Recorded Future, VirusTotal
- **Incident Response:** TheHive, RTIR, Demisto/Phantom, IBM Resilient
- **Forensics:** Volatility, Autopsy, Sleuth Kit, YARA rules
- **Compliance:** Nessus, OpenVAS, Rapid7, Qualys for vulnerability scanning`
    },
    designPhase: true,
    buildPhase: true,
    operationPhase: true,
    mitigatedThreatNames: ["Repudiation", "Rogue Agents", "Human Attacks", "Tool Misuse", "Privilege Compromise"],
    mitigatedThreatIds: ["t8", "t13", "t14", "t2", "t3"],
    tags: ["monitoring", "logging", "auditing", "detection"],
    references: [
      { title: "NIST Cybersecurity Framework", url: "https://www.nist.gov/cyberframework" },
      { title: "MITRE ATT&CK", url: "https://attack.mitre.org/" },
      { title: "OWASP Logging Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html" }
    ],
    riskScore: 8,
    status: "active",
    version: "2024.2",
    lastUpdated: "2024-12-01",
    updatedBy: "enhanced",
    color: "#818cf8",
    icon: "monitor",
    displayOrder: 6
  },

  "m7": {
    id: "m7",
    name: "Zero Trust & Least Privilege Access",
    description: "Implement fine-grained access controls with continuous verification, temporary credentials, minimal permission sets, and dynamic privilege management following zero trust principles to prevent tool misuse, privilege compromise, and unauthorized code execution.",
    threatIds: ["t2", "t3", "t11", "t13"],
    implementationDetail: {
      design: `**Zero Trust Architecture Design:**
- Design "never trust, always verify" principles for all agent interactions
- Plan continuous authentication and authorization for every access request
- Design micro-segmentation strategy for agent environments and communications
- Plan identity-centric security model with strong agent authentication
- Design policy-based access control with dynamic evaluation
- Plan risk-based authentication with adaptive trust scoring
- Design secure-by-default configurations and fail-safe mechanisms
- Plan comprehensive visibility and monitoring for all agent activities

**Least Privilege Framework:**
- Design capability-based access control (CBAC) for fine-grained permissions
- Plan just-in-time (JIT) access provisioning with time-limited credentials
- Design role-based access control (RBAC) with minimal role assignment
- Plan attribute-based access control (ABAC) for contextual authorization
- Design permission inheritance and delegation mechanisms
- Plan privilege escalation detection and prevention systems
- Design automatic privilege de-escalation and session expiration
- Plan privilege audit trails and access review processes

**Dynamic Authorization Architecture:**
- Design real-time policy evaluation engines with low-latency requirements
- Plan context-aware authorization based on agent behavior and environment
- Design risk-based access controls with adaptive security measures
- Plan multi-factor authorization for high-risk operations
- Design authorization policy versioning and deployment mechanisms
- Plan authorization decision caching and performance optimization`,

      build: `**Capability-Based Access Control Implementation:**
- Build fine-grained permission model mapping agent capabilities to specific resources:
  * Resource-specific permissions (database tables, API endpoints, file directories)
  * Action-specific permissions (read, write, execute, delete, admin)
  * Condition-based permissions (time-based, location-based, context-based)
  * Hierarchical permissions with inheritance and override mechanisms
- Implement permission verification at every access point:
  * API gateway integration with policy enforcement points (PEPs)
  * Database-level access controls with row-level security
  * File system permissions with mandatory access controls
  * Container and process-level privilege restrictions

**Just-in-Time Access Management:**
- Build temporary credential issuance systems:
  * AWS STS for short-lived cloud credentials (15-minute to 12-hour expiry)
  * HashiCorp Vault for dynamic secret generation and rotation
  * OAuth 2.0 with narrow scopes and short token lifetimes
  * JWT tokens with minimal claims and automatic expiration
- Implement privilege elevation workflows:
  * Multi-factor authentication for privilege requests
  * Approval workflows for high-privilege operations
  * Time-limited privilege grants with automatic revocation
  * Session recording and monitoring for elevated privileges

**Zero Trust Network Security:**
- Deploy network micro-segmentation with software-defined perimeters
- Implement service mesh security with mTLS for all communications
- Build network policy enforcement with deny-by-default rules
- Deploy network monitoring with encrypted traffic analysis
- Implement network access control (NAC) for device authentication
- Build network anomaly detection for unauthorized communications

**Policy Enforcement Implementation:**
- Build centralized policy decision points (PDPs) using Open Policy Agent (OPA)
- Implement distributed policy enforcement points (PEPs) at critical junctions
- Deploy policy as code with version control and testing
- Build policy evaluation caching for performance optimization
- Implement policy conflict resolution and priority mechanisms
- Deploy policy impact analysis and testing frameworks`,

      operations: `**Access Control Operations:**
- Monitor all access attempts and authorization decisions in real-time
- Execute regular access reviews and privilege audits
- Maintain access control baselines and deviation detection
- Deploy automated access revocation for departing agents or role changes
- Execute privilege escalation monitoring and alerting
- Maintain access control metrics and compliance reporting
- Deploy access control incident response and investigation procedures

**Credential Management Operations:**
- Operate automated credential rotation and lifecycle management
- Execute regular credential security assessments and compliance checks
- Maintain credential inventory and usage tracking
- Deploy credential compromise detection and response procedures
- Execute credential backup and recovery procedures
- Maintain credential policy enforcement and monitoring
- Deploy credential sharing prevention and detection mechanisms

**Policy Management Operations:**
- Execute policy updates and deployment with testing and rollback procedures
- Maintain policy documentation and change management processes
- Deploy policy impact analysis and risk assessment
- Execute policy compliance monitoring and enforcement
- Maintain policy performance optimization and tuning
- Deploy policy audit trails and version history management

**Zero Trust Operations:**
- Monitor trust scores and risk levels for all agents and users
- Execute continuous verification and re-authentication procedures
- Maintain zero trust architecture health and performance monitoring
- Deploy threat hunting and behavioral analysis for trust violations
- Execute zero trust incident response and containment procedures
- Maintain zero trust metrics and maturity assessments`,

      toolsAndFrameworks: `**Identity & Access Management:**
- **Enterprise IAM:** Okta, Auth0, Azure AD, AWS IAM, Google Cloud Identity
- **Open Source:** Keycloak, FreeIPA, Gluu, WSO2 Identity Server
- **Privileged Access:** CyberArk, BeyondTrust, Thycotic, HashiCorp Vault
- **Multi-Factor Auth:** Duo Security, RSA SecurID, YubiKey, TOTP implementations

**Policy & Authorization:**
- **Policy Engines:** Open Policy Agent (OPA), AWS Cedar, Google Zanzibar
- **ABAC Solutions:** Axiomatics, NextLabs, PlainID, custom XACML implementations
- **Zero Trust Platforms:** Zscaler, Palo Alto Prisma, Microsoft Zero Trust
- **Network Security:** Illumio, Guardicore, Akamai, Cloudflare Zero Trust

**Credential Management:**
- **Secret Management:** HashiCorp Vault, AWS Secrets Manager, Azure Key Vault
- **Certificate Management:** Venafi, DigiCert, Let's Encrypt, CFSSL
- **Key Management:** AWS KMS, Google Cloud KMS, Azure Key Vault, PKCS#11 HSMs
- **Session Management:** JWT libraries, OAuth 2.0 implementations, SAML solutions

**Monitoring & Compliance:**
- **Access Analytics:** Varonis, Imperva, SailPoint, custom analytics platforms
- **Compliance Tools:** Rapid7, Qualys, Nessus, OpenSCAP for policy compliance
- **Audit Solutions:** LogRhythm, ArcSight, IBM QRadar, custom audit frameworks
- **Risk Assessment:** ServiceNow GRC, MetricStream, Resolver, custom risk platforms`
    },
    designPhase: true,
    buildPhase: true,
    operationPhase: true,
    mitigatedThreatNames: ["Tool Misuse", "Privilege Compromise", "Unexpected RCE", "Rogue Agents"],
    mitigatedThreatIds: ["t2", "t3", "t11", "t13"],
    tags: ["zero-trust", "access-control", "privileges", "authentication"],
    references: [
      { title: "NIST Zero Trust Architecture", url: "https://csrc.nist.gov/publications/detail/sp/800-207/final" },
      { title: "CISA Zero Trust Maturity Model", url: "https://www.cisa.gov/zero-trust-maturity-model" },
      { title: "Principle of Least Privilege", url: "https://www.nist.gov/blogs/cybersecurity-insights/principle-least-privilege" }
    ],
    riskScore: 9,
    status: "active",
    version: "2024.2",
    lastUpdated: "2024-12-01",
    updatedBy: "enhanced",
    color: "#facc15",
    icon: "trust",
    displayOrder: 7
  },

  "m8": {
    id: "m8",
    name: "Adaptive Human-in-the-Loop Controls",
    description: "Implement intelligent human oversight with risk-based approval workflows, clear decision interfaces, anti-fatigue mechanisms, and adaptive trust systems to prevent approval overwhelm, human attacks, and manipulation while maintaining effective oversight.",
    threatIds: ["t10", "t14", "t15", "t6"],
    implementationDetail: {
      design: `**Risk-Based HITL Architecture:**
- Design action classification system based on risk levels and impact:
  * HIGH RISK: Financial transactions, system administration, data deletion
  * MEDIUM RISK: Bulk operations, configuration changes, external communications
  * LOW RISK: Read-only operations, routine tasks, cached responses
- Plan adaptive approval thresholds based on context and agent performance
- Design escalation mechanisms for complex or unusual requests
- Plan human reviewer assignment based on expertise and availability
- Design approval interface optimized for quick, informed decision-making
- Plan approval workflow automation with intelligent routing
- Design approval performance metrics and quality assessment
- Plan approval audit trails and decision accountability

**Anti-Fatigue & UX Design:**
- Design intelligent batching and grouping of similar approval requests
- Plan context-rich approval interfaces with relevant information presentation
- Design decision support systems with recommendations and risk assessment
- Plan approval time limits and automatic escalation mechanisms
- Design reviewer rotation and workload balancing systems
- Plan approval quality feedback and learning mechanisms
- Design mobile-friendly interfaces for timely approvals
- Plan approval delegation and backup reviewer systems

**Trust & Performance Adaptation:**
- Design agent trust scoring based on historical performance and behavior
- Plan dynamic approval requirements based on trust levels and risk assessment
- Design learning systems that adapt approval requirements over time
- Plan approval bypass mechanisms for trusted agents and routine operations
- Design trust recovery mechanisms for agents with degraded trust scores
- Plan trust calibration based on human reviewer feedback and outcomes`,

      build: `**Risk Assessment & Classification Engine:**
- Build automated risk assessment for all agent actions:
  * Financial impact analysis with configurable thresholds
  * Data sensitivity classification and access impact assessment
  * Operational risk evaluation with business impact scoring
  * Compliance and regulatory impact assessment
  * External dependency and integration risk analysis
- Implement machine learning models for risk prediction:
  * Historical outcome analysis for similar actions
  * Context-aware risk scoring based on current environment
  * Anomaly detection for unusual request patterns
  * Risk correlation analysis across multiple factors

**Intelligent Approval Interface:**
- Build context-rich approval dashboards with comprehensive information:
  * Agent identity, trust score, and historical performance
  * Action details with parameters, scope, and potential impact
  * Risk assessment summary with key factors and mitigation options
  * Similar historical actions with outcomes and lessons learned
  * Time constraints and escalation information
- Implement approval decision support systems:
  * Recommendation engines based on policy and precedent
  * Risk mitigation suggestions and alternative approaches
  * Expert consultation and collaboration features
  * Decision templates and guided workflows

**Adaptive Approval Engine:**
- Build dynamic approval routing based on expertise and availability:
  * Subject matter expert identification and assignment
  * Workload balancing across multiple reviewers
  * Escalation to senior reviewers for high-risk or complex requests
  * Cross-functional review for interdisciplinary impacts
- Implement approval performance optimization:
  * Response time tracking and optimization
  * Approval quality metrics and feedback integration
  * Reviewer training and capability development
  * Approval process continuous improvement

**Anti-Fatigue Mechanisms:**
- Build intelligent request batching and prioritization:
  * Similar request grouping for efficient batch processing
  * Priority-based ordering with urgent request handling
  * Request deduplication and consolidation
  * Automated pre-screening and filtering of routine requests`,

      operations: `**HITL Operations Management:**
- Monitor human reviewer performance and decision quality metrics
- Execute regular training and capability development for reviewers
- Maintain reviewer availability and workload balancing
- Deploy reviewer fatigue monitoring and prevention measures
- Execute approval process optimization and improvement initiatives
- Maintain approval quality assurance and audit procedures
- Deploy backup and contingency procedures for reviewer unavailability

**Approval Workflow Operations:**
- Monitor approval queue performance and processing times
- Execute regular review of approval policies and thresholds
- Maintain approval decision audit trails and compliance reporting
- Deploy approval escalation and resolution procedures
- Execute approval process testing and validation
- Maintain approval system health and availability monitoring
- Deploy approval system backup and disaster recovery procedures

**Trust & Adaptation Operations:**
- Monitor agent trust scores and performance trends
- Execute regular calibration of trust and risk assessment models
- Maintain trust score transparency and explainability
- Deploy trust recovery and improvement programs for underperforming agents
- Execute trust model validation and bias detection
- Maintain trust metrics reporting and stakeholder communication
- Deploy trust education and awareness programs

**Quality Assurance Operations:**
- Execute regular approval decision quality audits and reviews
- Monitor approval outcome correlation with risk assessments
- Maintain approval decision feedback loops and learning systems
- Deploy approval process benchmarking and best practice sharing
- Execute approval system security and integrity monitoring
- Maintain reviewer certification and competency assessment`,

      toolsAndFrameworks: `**Workflow & Process Management:**
- **BPM Platforms:** Camunda, Activiti, jBPM, Microsoft Power Automate
- **Approval Systems:** ServiceNow, Jira Service Management, custom workflow engines
- **Task Management:** Asana, Monday.com, Airtable with approval workflows
- **Collaboration:** Slack, Microsoft Teams, Discord with approval bots

**Risk Assessment & ML:**
- **Risk Analytics:** SAS Risk Management, IBM OpenPages, custom ML models
- **Decision Support:** IBM Watson Decision Platform, Microsoft Cognitive Services
- **ML Frameworks:** scikit-learn, TensorFlow, PyTorch for trust scoring models
- **Analytics:** Tableau, Power BI, Grafana for approval analytics dashboards

**User Interface & Experience:**
- **Dashboard Frameworks:** React, Vue.js, Angular with custom approval interfaces
- **Mobile Apps:** React Native, Flutter, native iOS/Android for mobile approvals
- **Notification Systems:** Twilio, SendGrid, Firebase for approval notifications
- **Real-time Updates:** WebSocket, Server-Sent Events, Socket.io for live updates

**Integration & API:**
- **API Gateways:** Kong, Istio, AWS API Gateway for approval service integration
- **Message Queues:** RabbitMQ, Apache Kafka, Redis for approval request processing
- **Database:** PostgreSQL, MongoDB, Redis for approval state management
- **Authentication:** OAuth 2.0, SAML, JWT for reviewer authentication and authorization`
    },
    designPhase: true,
    buildPhase: true,
    operationPhase: true,
    mitigatedThreatNames: ["Overwhelming HITL", "Human Attacks", "Human Manipulation", "Intent Breaking & Goal Manipulation"],
    mitigatedThreatIds: ["t10", "t14", "t15", "t6"],
    tags: ["human-in-the-loop", "approval", "workflow", "fatigue"],
    references: [
      { title: "Human-AI Interaction Design", url: "https://hai.stanford.edu/research" },
      { title: "Approval Fatigue Research", url: "https://www.microsoft.com/en-us/research/publication/approval-fatigue/" },
      { title: "Human-Centered AI", url: "https://www.fhi.ox.ac.uk/publications/" }
    ],
    riskScore: 7,
    status: "active",
    version: "2024.2",
    lastUpdated: "2024-12-01",
    updatedBy: "enhanced",
    color: "#60a5fa",
    icon: "hitl",
    displayOrder: 8
  },

  "m9": {
    id: "m9",
    name: "Distributed Resource Management & Rate Limiting",
    description: "Implement multi-layer resource controls with intelligent quotas, circuit breakers, cost management, and distributed rate limiting to prevent resource exhaustion, financial damage, and denial of service attacks while maintaining system performance.",
    threatIds: ["t4", "t2", "t10"],
    implementationDetail: {
      design: `**Resource Management Architecture:**
- Design hierarchical resource quota system with global, service, and user-level limits
- Plan intelligent rate limiting with adaptive thresholds based on system load
- Design cost management framework with budget controls and spending alerts
- Plan resource monitoring and analytics for usage pattern analysis
- Design circuit breaker patterns for service protection and graceful degradation
- Plan resource allocation policies based on priority and business value
- Design resource scaling mechanisms with automatic adjustment capabilities
- Plan resource audit trails and usage accounting systems

**Multi-Layer Rate Limiting Design:**
- Design token bucket algorithms for smooth rate limiting with burst capability
- Plan sliding window rate limiting for more accurate long-term rate control
- Design distributed rate limiting for multi-instance deployments
- Plan rate limiting policies based on user identity, IP address, and API endpoints
- Design rate limiting bypass mechanisms for emergency and high-priority requests
- Plan rate limiting coordination across multiple services and dependencies
- Design rate limiting feedback mechanisms for client optimization
- Plan rate limiting analytics and reporting systems

**Cost Management Framework:**
- Design cost tracking and attribution across different resources and operations
- Plan budget management with alerts, limits, and automatic cost controls
- Design cost optimization recommendations and automated cost reduction
- Plan cost forecasting and capacity planning based on usage trends
- Design cost transparency and reporting for stakeholders
- Plan cost anomaly detection and investigation procedures`,

      build: `**Multi-Layer Rate Limiting Implementation:**
- Build token bucket rate limiters with configurable capacity and refill rates:
  * Per-agent rate limits: 200 requests/minute with burst allowance
  * Per-user rate limits: 1,000 requests/minute with fair queuing
  * Per-service rate limits: 10,000 requests/minute with priority handling
  * Global rate limits: 100,000 requests/minute with load balancing
- Implement sliding window rate limiting for accurate long-term control:
  * Fixed window counting with counter reset
  * Sliding log implementation for precise tracking
  * Sliding window counter for memory efficiency
  * Distributed sliding window using Redis or similar

**Resource Quota Management:**
- Build comprehensive resource quota system:
  * Compute quotas: CPU seconds, memory GB-hours, GPU minutes
  * API quotas: External API calls, database queries, cache operations
  * Storage quotas: Memory MB, disk GB, bandwidth GB
  * Financial quotas: Daily spend limits, monthly budgets, cost per operation
- Implement quota enforcement with graceful degradation:
  * Soft limits with warnings and monitoring
  * Hard limits with request blocking and queuing
  * Emergency bypass for critical operations
  * Quota reset and renewal mechanisms

**Circuit Breaker Implementation:**
- Build circuit breaker patterns for service protection:
  * Failure threshold configuration (5 failures in 60 seconds)
  * Timeout and recovery time configuration (60-second open state)
  * Health check integration for service recovery detection
  * Fallback mechanism implementation for degraded service
  * Circuit breaker state monitoring and alerting
- Implement bulkhead patterns for resource isolation:
  * Separate thread pools for different operation types
  * Connection pool isolation for external services
  * Memory allocation limits per operation type
  * CPU time limits per request category

**Cost Management Implementation:**
- Build real-time cost tracking and attribution:
  * Cost per API call calculation and tracking
  * Resource usage cost allocation per agent and user
  * External service cost monitoring and attribution
  * Cost trend analysis and forecasting
- Implement cost control mechanisms:
  * Budget alerts at 50%, 80%, and 95% thresholds
  * Automatic cost reduction through resource throttling
  * Cost-based priority adjustment for resource allocation
  * Emergency cost controls for budget overruns`,

      operations: `**Resource Monitoring & Management:**
- Monitor resource usage patterns and identify optimization opportunities
- Execute capacity planning based on usage trends and growth projections
- Maintain resource allocation policies and quota adjustments
- Deploy automated resource scaling and optimization procedures
- Execute resource usage audits and compliance verification
- Maintain resource performance baselines and anomaly detection
- Deploy resource incident response and recovery procedures

**Rate Limiting Operations:**
- Monitor rate limiting effectiveness and false positive rates
- Execute rate limit tuning based on system performance and user feedback
- Maintain rate limiting policy updates and exception management
- Deploy rate limiting bypass procedures for emergency situations
- Execute rate limiting compliance monitoring and audit
- Maintain rate limiting performance optimization and scaling
- Deploy rate limiting incident response for abuse and attacks

**Cost Management Operations:**
- Monitor cost trends and budget compliance across all resources
- Execute cost optimization initiatives and resource right-sizing
- Maintain cost allocation transparency and chargeback procedures
- Deploy cost anomaly investigation and resolution procedures
- Execute financial reporting and budget planning support
- Maintain cost control policy updates and exception handling
- Deploy cost-related incident response for budget overruns

**Performance & Optimization:**
- Monitor system performance impact of resource controls
- Execute optimization of rate limiting and quota enforcement overhead
- Deploy intelligent caching and resource reuse strategies
- Maintain performance baselines and regression detection
- Execute load testing and capacity validation procedures
- Deploy performance tuning and optimization recommendations`,

      toolsAndFrameworks: `**Rate Limiting & Quotas:**
- **Rate Limiters:** Redis with lua scripts, Nginx rate limiting, Envoy rate limiting
- **API Gateways:** Kong, AWS API Gateway, Azure API Management, Google Cloud Endpoints
- **Circuit Breakers:** Hystrix, Resilience4j, Polly, istio circuit breaker
- **Quota Management:** Kubernetes resource quotas, cloud provider quota APIs

**Monitoring & Analytics:**
- **Metrics Collection:** Prometheus, InfluxDB, CloudWatch, DataDog
- **Visualization:** Grafana, Kibana, Tableau, custom dashboards
- **APM:** New Relic, Dynatrace, AppDynamics, Jaeger for distributed tracing
- **Log Analysis:** ELK Stack, Splunk, Fluentd for usage pattern analysis

**Cost Management:**
- **Cloud Cost Tools:** AWS Cost Explorer, Azure Cost Management, GCP Billing
- **FinOps Platforms:** CloudHealth, Cloudability, Spot by NetApp, Harness
- **Custom Cost Tracking:** InfluxDB + Grafana, custom billing systems
- **Budget Management:** Cloud provider budgets, PagerDuty for cost alerts

**Infrastructure & Scaling:**
- **Load Balancers:** HAProxy, Nginx, Envoy, cloud load balancers
- **Auto-scaling:** Kubernetes HPA/VPA, cloud auto-scaling groups
- **Service Mesh:** Istio, Linkerd, Consul Connect for traffic management
- **Caching:** Redis, Memcached, CDNs for resource optimization`
    },
    designPhase: true,
    buildPhase: true,
    operationPhase: true,
    mitigatedThreatNames: ["Resource Overload", "Tool Misuse", "Overwhelming HITL"],
    mitigatedThreatIds: ["t4", "t2", "t10"],
    tags: ["rate-limiting", "resources", "quotas", "cost-management"],
    references: [
      { title: "Circuit Breaker Pattern", url: "https://martinfowler.com/bliki/CircuitBreaker.html" },
      { title: "FinOps Best Practices", url: "https://www.finops.org/introduction/what-is-finops/" }
    ],
    riskScore: 6,
    status: "active",
    version: "2024.2",
    lastUpdated: "2024-12-01",
    updatedBy: "enhanced",
    color: "#f59e42",
    icon: "resource",
    displayOrder: 9
  },

  "m10": {
    id: "m10",
    name: "Defense-in-Depth Architecture & Trust Boundaries",
    description: "Implement multiple security layers with clear trust boundaries, network segmentation, cryptographic verification, and zero-trust networking to contain breaches, prevent lateral movement, and protect against privilege compromise, identity spoofing, and rogue agents.",
    threatIds: ["t3", "t9", "t12", "t13", "t2"],
    implementationDetail: {
      design: `**Security Architecture Design:**
- Design multiple security layers with independent failure modes
- Plan trust boundary definition and enforcement mechanisms
- Design network segmentation strategy with micro-segmentation
- Plan data flow mapping and security control placement
- Design cryptographic verification for all trust boundaries
- Plan identity federation and trust relationship management
- Design security zone classification and access controls
- Plan security architecture validation and testing frameworks

**Trust Boundary Architecture:**
- Design clear separation between security zones and trust levels:
  * DMZ Zone (Public): Load balancers, reverse proxies, public APIs
  * Application Zone (Restricted): Agent orchestrators, business logic
  * Data Zone (Highly Restricted): Databases, memory stores, sensitive data
  * Management Zone (Admin Only): Monitoring, configuration, audit systems
- Plan trust relationship establishment and verification procedures
- Design trust boundary crossing protocols and security checks
- Plan trust relationship revocation and recovery mechanisms
- Design trust score calculation and adjustment algorithms
- Plan trust boundary monitoring and violation detection

**Zero Trust Network Design:**
- Design network architecture with no implicit trust between zones
- Plan software-defined perimeters (SDP) for dynamic network access
- Design encrypted communication channels for all network traffic
- Plan network access control (NAC) with device and user authentication
- Design network monitoring and threat detection systems
- Plan network policy enforcement and violation response`,

      build: `**Network Segmentation Implementation:**
- Build comprehensive network segmentation with multiple isolation layers:
  * VLAN segmentation for logical network separation
  * Software-defined networking (SDN) for programmable network policies
  * Container network policies in Kubernetes environments
  * Service mesh networking with encrypted service-to-service communication
  * Firewall rules with deny-by-default and allow-listing approaches
- Deploy micro-segmentation with granular access controls:
  * Application-level segmentation with API gateway enforcement
  * Database-level segmentation with connection pooling and access controls
  * Process-level segmentation with container and namespace isolation
  * User-level segmentation with identity-based access controls

**Cryptographic Trust Implementation:**
- Deploy comprehensive encryption for data protection:
  * TLS 1.3 for all network communications with perfect forward secrecy
  * mTLS for service-to-service authentication and encryption
  * Application-level encryption for sensitive data processing
  * End-to-end encryption for agent communications
- Implement cryptographic verification mechanisms:
  * Digital signatures for message integrity and non-repudiation
  * Certificate-based authentication with PKI infrastructure
  * Cryptographic hashing for data integrity verification
  * Key derivation and rotation for long-term security

**Identity Architecture Implementation:**
- Build comprehensive identity and access management:
  * SPIFFE/SPIRE for workload identity in containerized environments
  * Decentralized identifiers (DIDs) for self-sovereign agent identities
  * Verifiable credentials (VCs) for capability and authorization attestation
  * Multi-factor authentication for human and service accounts
- Deploy identity federation and trust management:
  * Cross-domain trust establishment with certificate authorities
  * Identity provider integration with standards-based protocols
  * Trust relationship monitoring and automatic revocation
  * Identity lifecycle management with automated provisioning and deprovisioning

**Security Control Implementation:**
- Deploy intrusion detection and prevention systems (IDS/IPS):
  * Network-based detection for traffic analysis and threat identification
  * Host-based detection for system-level monitoring and protection
  * Application-level detection for API and service protection
  * AI-powered detection for advanced persistent threats (APTs)
- Implement security orchestration and automated response (SOAR):
  * Automated threat response and containment procedures
  * Security playbook execution and workflow automation
  * Incident escalation and notification systems
  * Forensic data collection and evidence preservation`,

      operations: `**Defense-in-Depth Operations:**
- Monitor all security layers for effectiveness and performance
- Execute regular security architecture assessments and penetration testing
- Maintain security control configuration and policy management
- Deploy coordinated incident response across multiple security layers
- Execute security layer integration testing and validation
- Maintain security architecture documentation and change management
- Deploy security layer performance optimization and tuning

**Trust Boundary Operations:**
- Monitor trust boundary crossings and access patterns
- Execute regular trust relationship validation and verification
- Maintain trust score accuracy and calibration procedures
- Deploy trust boundary violation detection and response
- Execute trust relationship audit and compliance verification
- Maintain trust boundary policy updates and exception handling
- Deploy trust recovery and remediation procedures

**Network Security Operations:**
- Monitor network traffic patterns and anomaly detection
- Execute network segmentation effectiveness testing and validation
- Maintain network policy configuration and change management
- Deploy network intrusion detection and automated response
- Execute network performance monitoring and optimization
- Maintain network security compliance and audit procedures
- Deploy network incident response and forensics capabilities

**Identity & Access Operations:**
- Monitor identity lifecycle and access pattern analysis
- Execute identity verification and authentication testing
- Maintain identity provider integration and federation management
- Deploy identity compromise detection and response procedures
- Execute identity audit and compliance verification
- Maintain identity policy updates and exception handling
- Deploy identity recovery and remediation procedures`,

      toolsAndFrameworks: `**Network Security & Segmentation:**
- **Service Mesh:** Istio, Linkerd, Consul Connect for secure service communication
- **Network Policies:** Calico, Cilium, Antrea for Kubernetes network segmentation
- **Firewalls:** pfSense, OPNsense, cloud provider firewalls, next-gen firewalls
- **Zero Trust Networks:** Zscaler, Palo Alto Prisma, Cloudflare Access, BeyondCorp

**Identity & Trust Management:**
- **PKI Systems:** OpenSSL, CFSSL, Microsoft ADCS, HashiCorp Vault PKI
- **Identity Standards:** SPIFFE/SPIRE, W3C DIDs, OAuth 2.0, SAML 2.0
- **Service Identity:** Kubernetes service accounts, AWS IAM roles, Azure managed identities
- **Certificate Management:** cert-manager, Let's Encrypt, Venafi, DigiCert

**Encryption & Cryptography:**
- **TLS Libraries:** OpenSSL, BoringSSL, rustls, Microsoft Schannel
- **Cryptographic Libraries:** libsodium, Bouncy Castle, Java Cryptography Architecture
- **Key Management:** HashiCorp Vault, AWS KMS, Azure Key Vault, Google Cloud KMS
- **Hardware Security:** YubiKey, AWS CloudHSM, Azure Dedicated HSM, PKCS#11 devices

**Security Monitoring & Response:**
- **SIEM Platforms:** Splunk, IBM QRadar, Azure Sentinel, Elastic Security
- **Network Monitoring:** Nagios, Zabbix, SolarWinds, Wireshark, ntopng
- **Intrusion Detection:** Suricata, Snort, OSSEC, Wazuh, Falco
- **SOAR Platforms:** Phantom, Demisto, IBM Resilient, Google Chronicle SOAR`
    },
    designPhase: true,
    buildPhase: true,
    operationPhase: true,
    mitigatedThreatNames: ["Privilege Compromise", "Identity Spoofing", "Communication Poisoning", "Rogue Agents", "Tool Misuse"],
    mitigatedThreatIds: ["t3", "t9", "t12", "t13", "t2"],
    tags: ["defense-in-depth", "network", "segmentation", "trust-boundaries"],
    references: [
      { title: "Defense in Depth", url: "https://www.nist.gov/itl/smallbusinesscyber/guidance-topic/defense-depth" },
      { title: "Zero Trust Architecture", url: "https://csrc.nist.gov/publications/detail/sp/800-207/final" },
      { title: "Network Segmentation", url: "https://www.sans.org/white-papers/36267/" }
    ],
    riskScore: 9,
    status: "active",
    version: "2024.2",
    lastUpdated: "2024-12-01",
    updatedBy: "enhanced",
    color: "#fb7185",
    icon: "defense",
    displayOrder: 10
  },

  "m11": {
    id: "m11",
    name: "Content Security & Output Filtering",
    description: "Implement comprehensive filtering and validation of agent outputs to prevent harmful content generation, data leakage, manipulation attempts, and ensure compliance with security policies and regulatory requirements.",
    threatIds: ["t5", "t7", "t15", "t6", "t1"],
    implementationDetail: {
      design: `**Content Security Architecture:**
- Design multi-stage content filtering pipeline with pre-generation, post-generation, and pre-delivery filtering
- Plan content classification system with sensitivity levels and handling requirements
- Design harmful content detection using ML models and rule-based systems
- Plan PII detection and redaction strategies with regulatory compliance
- Design content provenance and attribution tracking systems
- Plan content audit trails and compliance reporting mechanisms
- Design content security policy enforcement and violation handling
- Plan content filtering performance optimization and scaling strategies

**Output Validation Framework:**
- Design structured output validation with schema enforcement and format verification
- Plan contextual output encoding based on delivery channels (web, API, file, etc.)
- Design content consistency checking across multiple generations and contexts
- Plan output sanitization strategies for different data types and formats
- Design output integrity verification with cryptographic signatures
- Plan output versioning and change tracking for audit purposes
- Design output filtering bypass mechanisms for authorized content types
- Plan output security testing and validation frameworks

**Regulatory Compliance Design:**
- Design compliance frameworks for GDPR, HIPAA, PCI-DSS, and other regulations
- Plan data classification and handling based on regulatory requirements
- Design consent management and data subject rights implementation
- Plan cross-border data transfer controls and localization requirements
- Design retention policy enforcement and secure deletion mechanisms
- Plan compliance audit trails and reporting systems`,

      build: `**Multi-Stage Content Filtering Pipeline:**
- Build comprehensive content analysis and filtering system:
  * Pre-generation filtering of inputs and prompts
  * Post-generation content analysis and policy enforcement
  * Pre-delivery final content validation and sanitization
  * Real-time content monitoring and dynamic filtering
- Implement harmful content detection using multiple approaches:
  * Rule-based filtering for known harmful patterns and keywords
  * ML-based classification using fine-tuned models (LlamaGuard, OpenAI Moderation)
  * Sentiment analysis and toxicity detection (Perspective API, Detoxify)
  * Hate speech and extremism detection using specialized models

**PII Detection & Redaction System:**
- Build comprehensive PII identification and handling:
  * Named Entity Recognition (NER) using spaCy, NLTK, custom models
  * Pattern matching for SSNs, credit cards, phone numbers, emails
  * Context-aware PII detection for complex scenarios
  * Configurable redaction strategies (masking, tokenization, removal)
  * PII database integration for known sensitive identifiers
- Implement data classification and labeling:
  * Automatic sensitivity classification based on content analysis
  * Manual classification workflows for complex or ambiguous content
  * Classification inheritance and propagation across related content
  * Classification accuracy monitoring and improvement systems

**Content Sanitization Implementation:**
- Build contextual output encoding and sanitization:
  * HTML encoding for web delivery with XSS prevention
  * JSON sanitization for API responses with injection prevention
  * CSV/Excel sanitization for data exports with formula injection prevention
  * PDF sanitization for document generation with embedded content protection
- Implement content watermarking and provenance tracking:
  * Digital watermarking for generated content identification
  * Metadata embedding for content attribution and tracking
  * Blockchain-based provenance for high-value content
  * Content fingerprinting for duplicate detection and tracking

**Compliance Implementation:**
- Build regulatory compliance engines:
  * GDPR compliance with right to erasure and data portability
  * HIPAA compliance with healthcare data protection and audit trails
  * PCI-DSS compliance for payment card data handling
  * CCPA compliance with consumer privacy rights and opt-out mechanisms`,

      operations: `**Content Security Operations:**
- Monitor content filtering effectiveness and false positive/negative rates
- Execute regular content policy updates based on threat intelligence and compliance changes
- Maintain content filtering model training and improvement programs
- Deploy content security incident response for policy violations and harmful content
- Execute content audit and compliance verification procedures
- Maintain content security metrics and reporting dashboards
- Deploy content security testing and red team exercises

**PII & Data Protection Operations:**
- Monitor PII detection accuracy and coverage across all content types
- Execute regular PII model training and improvement initiatives
- Maintain data classification accuracy and consistency verification
- Deploy data subject rights fulfillment and response procedures
- Execute data retention policy enforcement and secure deletion
- Maintain privacy impact assessment and compliance monitoring
- Deploy data breach detection and notification procedures

**Content Quality Operations:**
- Monitor content generation quality and consistency metrics
- Execute content validation testing and accuracy verification
- Maintain content approval workflows for sensitive or high-risk outputs
- Deploy content version control and change management procedures
- Execute content performance optimization and caching strategies
- Maintain content analytics and usage pattern analysis
- Deploy content lifecycle management and archival procedures

**Compliance Operations:**
- Monitor regulatory compliance status and requirement changes
- Execute compliance audit preparation and evidence collection
- Maintain compliance training and awareness programs
- Deploy compliance violation detection and remediation procedures
- Execute regulatory reporting and documentation requirements
- Maintain compliance metrics and stakeholder communication
- Deploy compliance testing and validation procedures`,

      toolsAndFrameworks: `**Content Filtering & Moderation:**
- **ML Models:** OpenAI Moderation API, LlamaGuard, Perspective API, Azure Content Moderator
- **Toxicity Detection:** Detoxify, HateBERT, Unitary AI Perspective, custom models
- **Content Analysis:** Google Cloud Natural Language, AWS Comprehend, Azure Text Analytics
- **Rule-Based Filtering:** Regular expressions, Aho-Corasick, custom pattern matching

**PII Detection & Privacy:**
- **PII Detection:** Microsoft Presidio, AWS Macie, Google Cloud DLP, spaCy NER
- **Data Classification:** Microsoft Purview, Varonis, Forcepoint, custom classifiers
- **Privacy Tools:** OneTrust, TrustArc, DataGrail, custom privacy management
- **Anonymization:** ARX Data Anonymization, k-anonymity tools, differential privacy libraries

**Content Sanitization:**
- **HTML Sanitization:** DOMPurify, Bleach, sanitize-html, OWASP Java HTML Sanitizer
- **Document Processing:** Apache Tika, pandoc, custom document sanitizers
- **Media Processing:** FFmpeg for media sanitization, ImageMagick for image processing
- **Encoding Libraries:** OWASP ESAPI, custom encoding libraries for different contexts

**Compliance & Governance:**
- **GDPR Tools:** OneTrust, TrustArc, DataGrail for GDPR compliance automation
- **Audit Frameworks:** SOC 2 tools, ISO 27001 compliance platforms
- **Data Governance:** Collibra, Alation, Apache Atlas for data lineage and governance
- **Reporting:** Custom compliance dashboards, regulatory reporting automation`
    },
    designPhase: true,
    buildPhase: true,
    operationPhase: true,
    mitigatedThreatNames: ["Cascading Hallucination", "Misaligned Behaviors", "Human Manipulation", "Intent Breaking & Goal Manipulation", "Memory Poisoning"],
    mitigatedThreatIds: ["t5", "t7", "t15", "t6", "t1"],
    tags: ["content-filtering", "pii", "compliance", "sanitization"],
    references: [
      { title: "OWASP Output Encoding", url: "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html" },
      { title: "GDPR Technical Measures", url: "https://gdpr.eu/article-32-security-of-processing/" },
      { title: "Content Moderation Best Practices", url: "https://www.perspectiveapi.com/research/" }
    ],
    riskScore: 7,
    status: "active",
    version: "2024.2",
    lastUpdated: "2024-12-01",
    updatedBy: "enhanced",
    color: "#4ade80",
    icon: "filter",
    displayOrder: 11
  },
  "m13": {
    id: "m13",
    name: "Runtime Security Controls & Sandboxing",
    description: "Implement comprehensive runtime security controls including advanced sandboxing, execution monitoring, and dynamic security policy enforcement to prevent unexpected code execution and contain security breaches in real-time.",
    threatIds: ["t11", "t2", "t3", "t4"],
    implementationDetail: {
      design: `**Runtime Security Architecture:**
- Design multi-layered runtime protection with OS, container, and application-level controls
- Plan dynamic security policy enforcement with real-time threat assessment
- Design execution monitoring and anomaly detection for all agent activities
- Plan runtime attestation and integrity verification mechanisms
- Design secure execution environments with hardware-level isolation
- Plan runtime security control orchestration and coordination
- Design performance-optimized security controls with minimal overhead
- Plan runtime security incident response and automatic containment

**Advanced Sandboxing Design:**
- Design hypervisor-based isolation using microVMs and lightweight virtualization
- Plan process-level isolation with namespace and cgroup restrictions
- Design memory protection with address space layout randomization (ASLR)
- Plan system call filtering and monitoring with seccomp-bpf
- Design file system isolation with chroot jails and bind mounts
- Plan network isolation with virtual networking and traffic filtering
- Design resource quotas and limits with real-time enforcement
- Plan sandbox escape detection and prevention mechanisms`,

      build: `**Advanced Isolation Implementation:**
- Deploy hypervisor-based sandboxing:
  * Firecracker microVMs for lightweight VM-level isolation
  * Kata Containers for VM-isolated container workloads
  * gVisor for user-space kernel implementation
  * AWS Nitro Enclaves for confidential computing workloads
- Implement process and system-level isolation:
  * Linux namespaces (PID, network, mount, user, IPC, UTS)
  * Control groups (cgroups) v2 for resource limitation and accounting
  * Mandatory Access Control (MAC) with SELinux or AppArmor
  * Capability-based security with Linux capabilities

**Runtime Monitoring Implementation:**
- Build comprehensive execution monitoring:
  * System call monitoring with Falco and custom rules
  * File system access monitoring with inotify and fanotify
  * Network traffic monitoring with eBPF and packet capture
  * Process creation and execution tracking with audit frameworks
  * Memory access pattern monitoring with hardware performance counters
- Deploy runtime anomaly detection:
  * Machine learning models for behavior deviation detection
  * Statistical process control for performance metrics
  * Rule-based detection for known attack patterns
  * Ensemble methods combining multiple detection approaches

**Dynamic Security Policy Enforcement:**
- Implement real-time policy engines:
  * Open Policy Agent (OPA) integration for dynamic authorization
  * Custom policy engines with low-latency decision making
  * Context-aware policy evaluation with environmental factors
  * Policy conflict resolution and precedence management
- Build automated response mechanisms:
  * Automatic process termination for policy violations
  * Resource throttling for suspicious behavior
  * Network isolation for compromised processes
  * Alert generation and escalation workflows`,

      operations: `**Runtime Security Operations:**
- Monitor runtime security control effectiveness and performance impact
- Execute regular security policy updates and tuning based on threat intelligence
- Maintain runtime security baseline and deviation detection procedures
- Deploy runtime security incident response and forensic collection
- Execute runtime security control testing and validation procedures
- Maintain runtime security metrics and performance optimization
- Deploy runtime security training and awareness programs

**Sandbox Management Operations:**
- Monitor sandbox performance and resource utilization
- Execute sandbox image updates and security patching procedures
- Maintain sandbox configuration management and version control
- Deploy sandbox escape detection and response procedures
- Execute sandbox capacity planning and scaling operations
- Maintain sandbox compliance and audit documentation
- Deploy sandbox troubleshooting and support procedures`,

      toolsAndFrameworks: `**Virtualization & Isolation:**
- **MicroVMs:** Firecracker, Cloud Hypervisor, QEMU with KVM
- **Container Isolation:** gVisor, Kata Containers, Nabla Containers
- **Process Isolation:** Bubblewrap, nsjail, minijail, systemd-nspawn
- **Confidential Computing:** Intel SGX, AMD SEV, ARM TrustZone

**Runtime Monitoring:**
- **Security Monitoring:** Falco, Sysdig, Aqua Security, Twistlock
- **System Monitoring:** osquery, Auditd, Wazuh, OSSEC
- **Network Monitoring:** Suricata, Zeek, Moloch, ntopng
- **Performance Monitoring:** Perf, eBPF tools, Intel VTune

**Policy & Control:**
- **Policy Engines:** Open Policy Agent (OPA), Casbin, AWS Cedar
- **Access Control:** PolicyKit, sudo alternatives, custom RBAC
- **Resource Control:** systemd, cgroups, Docker resource limits
- **Compliance:** OpenSCAP, Lynis, Nessus, custom compliance tools`
    },
    designPhase: true,
    buildPhase: true,
    operationPhase: true,
    mitigatedThreatNames: ["Unexpected RCE", "Tool Misuse", "Privilege Compromise", "Resource Overload"],
    mitigatedThreatIds: ["t11", "t2", "t3", "t4"],
    tags: ["runtime", "sandboxing", "isolation", "monitoring"],
    references: [
      { title: "Firecracker Security Model", url: "https://github.com/firecracker-microvm/firecracker/blob/main/docs/design.md" },
      { title: "gVisor Security", url: "https://gvisor.dev/docs/architecture_guide/security/" },
      { title: "Container Runtime Security", url: "https://kubernetes.io/docs/concepts/security/runtime-security/" }
    ],
    riskScore: 8,
    status: "active",
    version: "2024.2",
    lastUpdated: "2024-12-01",
    updatedBy: "enhanced",
    color: "#8b5cf6",
    icon: "runtime",
    displayOrder: 13
  },

  "m14": {
    id: "m14",
    name: "Agent Identity & Authentication Framework",
    description: "Implement comprehensive agent identity management with decentralized identifiers, verifiable credentials, and strong authentication to prevent identity spoofing, enable secure agent discovery, and support agent reputation systems.",
    threatIds: ["t9", "t13", "t3", "t12"],
    implementationDetail: {
      design: `**Agent Identity Architecture:**
- Design decentralized identifier (DID) framework for self-sovereign agent identities
- Plan verifiable credential (VC) system for agent capability and authorization attestation
- Design agent reputation and trust scoring mechanisms
- Plan agent identity lifecycle management (creation, verification, revocation)
- Design cross-domain trust establishment and federation protocols
- Plan agent identity recovery and backup mechanisms
- Design identity privacy protection and selective disclosure
- Plan agent identity compliance with regulatory requirements

**Authentication Framework Design:**
- Design multi-factor authentication for agent systems
- Plan cryptographic identity verification with digital signatures
- Design hardware-based identity anchoring with TPM and secure enclaves
- Plan biometric-equivalent authentication for agent uniqueness
- Design authentication protocol selection and negotiation
- Plan authentication performance optimization and caching
- Design authentication audit trails and monitoring
- Plan authentication incident response and recovery procedures`,

      build: `**DID Implementation:**
- Build decentralized identifier infrastructure:
  * W3C DID standard compliance with method-specific implementations
  * DID document creation, resolution, and verification
  * Public key infrastructure integration with DID methods
  * DID registry management with distributed ledger integration
  * Cross-chain DID interoperability and resolution
- Implement verifiable credential systems:
  * W3C VC data model implementation with JSON-LD and JWT formats
  * Credential issuance workflows with trusted issuer networks
  * Credential verification and validation procedures
  * Zero-knowledge proof integration for privacy-preserving credentials
  * Credential revocation and status management

**Strong Authentication Implementation:**
- Deploy cryptographic authentication mechanisms:
  * ECDSA and EdDSA digital signature schemes
  * Multi-signature schemes for enhanced security
  * Hardware security module (HSM) integration for key protection
  * Threshold cryptography for distributed key management
- Build authentication protocol implementations:
  * Challenge-response authentication with replay protection
  * Mutual authentication with bidirectional verification
  * Token-based authentication with JWT and custom formats
  * Certificate-based authentication with X.509 and custom formats

**Agent Registry & Discovery:**
- Build secure agent registry systems:
  * Distributed agent registry with consensus mechanisms
  * Agent metadata management with capability descriptions
  * Agent search and discovery with privacy protection
  * Agent reputation tracking and scoring algorithms
- Implement agent verification systems:
  * Agent identity proofing and validation procedures
  * Capability verification with testing and attestation
  * Trust relationship establishment and management
  * Agent certification and compliance validation`,

      operations: `**Identity Lifecycle Management:**
- Monitor agent identity creation, updates, and revocation processes
- Execute regular identity verification and re-authentication procedures
- Maintain agent identity registry health and availability
- Deploy identity compromise detection and response procedures
- Execute identity compliance audits and regulatory reporting
- Maintain identity backup and disaster recovery procedures
- Deploy identity performance monitoring and optimization

**Trust & Reputation Operations:**
- Monitor agent reputation scores and trust relationships
- Execute trust calibration and bias detection procedures
- Maintain trust relationship audit trails and transparency reporting
- Deploy trust incident response and relationship recovery procedures
- Execute trust model validation and improvement initiatives
- Maintain trust metrics and stakeholder reporting
- Deploy trust education and awareness programs

**Authentication Operations:**
- Monitor authentication success rates and security incidents
- Execute authentication system updates and security patching
- Maintain authentication performance and availability monitoring
- Deploy authentication incident response and forensic procedures
- Execute authentication compliance and audit support
- Maintain authentication documentation and training materials`,

      toolsAndFrameworks: `**DID & Verifiable Credentials:**
- **DID Methods:** did:web, did:key, did:ethr, Microsoft ION, Hyperledger Indy
- **VC Libraries:** SpruceID DIDKit, Microsoft VerifiableCredentials-SDK, Evernym Vcx
- **Blockchain Integration:** Ethereum, Hyperledger Fabric, Sovrin Network
- **Identity Wallets:** Trinsic, Evernym Connect.Me, Microsoft Authenticator

**Cryptography & PKI:**
- **Crypto Libraries:** libsodium, OpenSSL, Bouncy Castle, MIRACL
- **HSM Integration:** PKCS#11, SafeNet Luna, Thales nShield, AWS CloudHSM
- **Certificate Authorities:** Let's Encrypt, DigiCert, internal CA with step-ca
- **Key Management:** HashiCorp Vault, AWS KMS, Azure Key Vault

**Authentication Protocols:**
- **Standards:** OAuth 2.0, OpenID Connect, SAML 2.0, WebAuthn
- **Libraries:** Passport.js, Spring Security, Keycloak, Auth0 SDKs
- **Multi-Factor:** TOTP, HOTP, FIDO2, YubiKey, SMS/Email verification
- **Enterprise:** Active Directory, LDAP, Kerberos, RADIUS

**Registry & Discovery:**
- **Service Discovery:** Consul, etcd, Zookeeper, Kubernetes DNS
- **Distributed Registries:** IPFS, Ethereum, Hyperledger, custom blockchain
- **Search & Indexing:** Elasticsearch, Solr, Algolia, custom search engines
- **Monitoring:** Prometheus, Grafana, custom identity metrics dashboards`
    },
    designPhase: true,
    buildPhase: true,
    operationPhase: true,
    mitigatedThreatNames: ["Identity Spoofing", "Rogue Agents", "Privilege Compromise", "Communication Poisoning"],
    mitigatedThreatIds: ["t9", "t13", "t3", "t12"],
    tags: ["identity", "did", "authentication", "reputation"],
    references: [
      { title: "W3C DID Core", url: "https://www.w3.org/TR/did-core/" },
      { title: "W3C Verifiable Credentials", url: "https://www.w3.org/TR/vc-data-model/" },
      { title: "SPIFFE/SPIRE", url: "https://spiffe.io/docs/" }
    ],
    riskScore: 8,
    status: "active",
    version: "2024.2",
    lastUpdated: "2024-12-01",
    updatedBy: "enhanced",
    color: "#ec4899",
    icon: "identity",
    displayOrder: 14
  },

  "m15": {
  id: "m15",
  name: "Behavioral Monitoring & Ethics Framework",
  description: "Implement comprehensive behavioral analysis, ethics enforcement, and bias detection to identify misaligned behaviors, prevent human manipulation, and ensure ethical agent operations while maintaining transparency and accountability.",
  threatIds: ["t7", "t15", "t14", "t6", "t5"],
  implementationDetail: {
    design: `**Behavioral Analysis Architecture:**
- Design comprehensive behavior modeling for agent actions and decisions
- Plan ethical framework integration with constitutional AI principles
- Design bias detection and mitigation systems for agent outputs
- Plan behavioral anomaly detection with machine learning models
- Design transparency and explainability mechanisms for agent decisions
- Plan ethical review workflows and human oversight integration
- Design behavioral metrics and KPIs for ethics compliance
- Plan behavioral incident response and corrective action procedures

**Ethics Framework Design:**
- Design principle-based ethics enforcement with customizable moral frameworks
- Plan fairness and non-discrimination validation for agent decisions
- Design harm prevention mechanisms with proactive risk assessment
- Plan cultural sensitivity and localization for global deployments
- Design stakeholder engagement and feedback integration
- Plan ethics training and awareness programs for development teams
- Design ethics audit and compliance verification procedures
- Plan ethics governance and oversight committee integration

**Bias Detection & Mitigation:**
- Design algorithmic bias detection across protected characteristics
- Plan dataset bias analysis and correction mechanisms
- Design output bias monitoring with statistical fairness metrics
- Plan bias mitigation techniques including adversarial debiasing
- Design fairness-aware model training and validation procedures
- Plan bias reporting and transparency mechanisms
- Design bias incident response and remediation workflows`,

    build: `**Behavioral Monitoring Implementation:**
- Build comprehensive behavior tracking and analysis:
* Decision tree analysis for agent reasoning patterns
* Sentiment analysis for emotional manipulation detection
* Communication pattern analysis for social engineering attempts
* Goal alignment verification with original objectives
* Trust exploitation detection through interaction analysis
- Implement real-time behavioral anomaly detection:
* Machine learning models for behavior deviation detection
* Statistical process control for behavioral consistency
* Pattern recognition for manipulation attempts
* Ensemble methods for robust anomaly identification

**Ethics Enforcement Engine:**
- Deploy constitutional AI framework for ethical decision making:
* Principle-based reasoning validation with customizable ethics frameworks
* Harm assessment and prevention mechanisms
* Fairness evaluation across demographic groups
* Cultural sensitivity analysis for global deployments
- Build ethical review and oversight systems:
* Human ethics review workflows for high-stakes decisions
* Ethics committee integration for policy development
* Stakeholder feedback collection and integration
* Ethics incident escalation and resolution procedures

**Bias Detection Implementation:**
- Build comprehensive bias detection systems:
* Protected characteristic analysis (race, gender, age, religion, etc.)
* Statistical parity and equalized odds measurement
* Individual fairness assessment with similarity metrics
* Intersectional bias detection for multiple characteristics
- Deploy bias mitigation techniques:
* Pre-processing bias correction in training data
* In-processing fairness constraints during model training
* Post-processing output adjustment for fairness
* Adversarial debiasing with fairness-aware adversarial training

**Transparency & Explainability:**
- Build agent decision explanation systems:
* Chain-of-thought reasoning transparency
* Decision factor importance scoring
* Counterfactual explanation generation
* Natural language explanation synthesis`,

    operations: `**Behavioral Operations Management:**
- Monitor agent behavioral patterns and ethics compliance in real-time
- Execute regular behavioral audits and ethics assessments
- Maintain behavioral baselines and deviation detection procedures
- Deploy behavioral incident response and corrective action workflows
- Execute behavioral model retraining and improvement procedures
- Maintain behavioral documentation and knowledge management
- Deploy behavioral training and awareness programs

**Ethics Compliance Operations:**
- Monitor ethics framework compliance and violation detection
- Execute regular ethics policy updates and stakeholder engagement
- Maintain ethics review processes and committee coordination
- Deploy ethics incident investigation and resolution procedures
- Execute ethics training and certification for team members
- Maintain ethics documentation and regulatory compliance
- Deploy ethics reporting and transparency communications

**Bias Monitoring Operations:**
- Monitor bias metrics and fairness indicators across all agent outputs
- Execute regular bias testing and validation procedures
- Maintain bias mitigation effectiveness and performance tracking
- Deploy bias incident response and remediation workflows
- Execute bias awareness training and education programs
- Maintain bias reporting and transparency documentation
- Deploy bias research and improvement initiatives`,

    toolsAndFrameworks: `**Behavioral Analysis:**
- **ML Frameworks:** scikit-learn, TensorFlow, PyTorch for behavior modeling
- **NLP Analysis:** spaCy, NLTK, Transformers for communication analysis
- **Anomaly Detection:** Isolation Forest, One-Class SVM, PyOD library
- **Time Series:** Prophet, ARIMA, LSTM for temporal behavior analysis

**Ethics & Governance:**
- **Ethics Frameworks:** IBM AI Fairness 360, Google What-If Tool, Microsoft Fairlearn
- **Constitutional AI:** Anthropic Constitutional AI, custom principle frameworks
- **Governance Tools:** IBM OpenPages, ServiceNow GRC, MetricStream
- **Audit Tools:** Aequitas, FairTest, custom ethics assessment frameworks

**Bias Detection & Mitigation:**
- **Fairness Libraries:** IBM AIF360, Microsoft Fairlearn, Google Fairness Indicators
- **Bias Testing:** Aequitas, FairML, What-If Tool, custom bias testing frameworks
- **Dataset Analysis:** Data Profiling tools, Great Expectations, custom bias analyzers
- **Mitigation:** Pre-processing tools, in-processing constraints, post-processing adjusters

**Explainability & Transparency:**
- **XAI Tools:** LIME, SHAP, Anchor, Counterfactual explanations
- **Model Interpretation:** Captum, InterpretML, ELI5, Skater
- **Visualization:** Matplotlib, Plotly, D3.js for explanation dashboards
- **Documentation:** Model cards, Datasheets for datasets, Ethics documentation templates`
  },
  designPhase: true,
  buildPhase: true,
  operationPhase: true,
  mitigatedThreatNames: ["Misaligned Behaviors", "Human Manipulation", "Human Attacks", "Intent Breaking & Goal Manipulation", "Cascading Hallucination"],
  mitigatedThreatIds: ["t7", "t15", "t14", "t6", "t5"],
  tags: ["ethics", "bias", "behavior", "monitoring"],
  references: [
    { title: "Partnership on AI", url: "https://partnershiponai.org/" },
    { title: "IEEE Standards for AI Ethics", url: "https://standards.ieee.org/industry-connections/ec/ead-general-principles/" },
    { title: "AI Ethics Guidelines", url: "https://www.oecd.org/going-digital/ai/principles/" }
  ],
  riskScore: 7,
  status: "active",
  version: "2024.2",
  lastUpdated: "2024-12-01",
  updatedBy: "enhanced",
  color: "#06b6d4",
  icon: "ethics",
  displayOrder: 15
},

"m16": {
  id: "m16",
  name: "Supply Chain Security & Provenance",
  description: "Implement comprehensive supply chain security including model provenance verification, dependency management, secure development environments, and third-party component validation to prevent supply chain attacks and ensure component integrity.",
  threatIds: ["t1", "t2", "t3", "t11", "t13"],
  implementationDetail: {
    design: `**Supply Chain Security Architecture:**
- Design comprehensive software bill of materials (SBOM) generation and management
- Plan model provenance and integrity verification systems
- Design secure development environment isolation and protection
- Plan third-party component risk assessment and validation procedures
- Design dependency vulnerability management and automated remediation
- Plan secure artifact storage and distribution mechanisms
- Design supply chain attack detection and response procedures
- Plan vendor security assessment and ongoing monitoring

**Model & Data Provenance Design:**
- Design model lineage tracking from training data through deployment
- Plan cryptographic signing and verification for AI models and datasets
- Design model tampering detection and integrity verification
- Plan secure model storage and distribution with access controls
- Design training data provenance and quality assurance
- Plan model versioning and change management with security controls
- Design model reproducibility and audit trail maintenance
- Plan model security scanning and vulnerability assessment

**Secure Development Environment:**
- Design development environment isolation and hardening procedures
- Plan developer workstation security and compliance requirements
- Design source code protection and intellectual property safeguards
- Plan secure collaboration tools and communication channels
- Design development infrastructure monitoring and threat detection
- Plan incident response for development environment compromises`,

    build: `**SBOM & Dependency Management:**
- Build comprehensive software bill of materials generation:
* Automated SBOM creation using SPDX and CycloneDX formats
* Dependency tree analysis with transitive dependency tracking
* License compliance verification and intellectual property protection
* Component risk assessment with security and quality metrics
- Implement dependency vulnerability management:
* Continuous vulnerability scanning with NIST NVD integration
* Automated security advisory monitoring and alerting
* Dependency update automation with compatibility testing
* Vulnerability remediation prioritization and tracking

**Model Provenance & Integrity:**
- Build model provenance tracking systems:
* Cryptographic hash verification for model weights and configurations
* Digital signature verification using PKI infrastructure
* Model lineage tracking from training through deployment
* Training data provenance and quality verification
- Deploy model security scanning:
* Model file analysis for embedded malware or backdoors
* Model behavior analysis for unexpected or malicious outputs
* Model performance verification against known benchmarks
* Model integrity monitoring during runtime

**Secure Development Infrastructure:**
- Build hardened development environments:
* Developer workstation endpoint protection and monitoring
* Secure code repositories with access controls and audit trails
* Protected CI/CD pipelines with security scanning integration
* Secure artifact storage with encryption and access controls
- Implement development security monitoring:
* Code commit analysis for security policy violations
* Developer behavior monitoring for insider threat detection
* Development infrastructure vulnerability scanning
* Security incident detection and response for development environments

**Third-Party Security Assessment:**
- Build vendor security assessment frameworks:
* Security questionnaire automation and validation
* Third-party security audit and penetration testing requirements
* Vendor security monitoring and continuous assessment
* Contract security requirements and compliance verification`,

    operations: `**Supply Chain Operations:**
- Monitor software supply chain security posture and vulnerability exposure
- Execute regular vendor security assessments and compliance verification
- Maintain SBOM accuracy and dependency inventory management
- Deploy supply chain incident response and vendor breach procedures
- Execute supply chain risk assessment and mitigation planning
- Maintain supply chain security documentation and reporting
- Deploy supply chain security training and awareness programs

**Model Lifecycle Operations:**
- Monitor model provenance and integrity throughout the lifecycle
- Execute model security scanning and vulnerability assessment procedures
- Maintain model versioning and change management with security controls
- Deploy model incident response for tampering or compromise detection
- Execute model compliance verification and audit support
- Maintain model documentation and security metadata
- Deploy model security training and best practices

**Development Security Operations:**
- Monitor development environment security and compliance status
- Execute developer security training and certification programs
- Maintain development infrastructure security and patch management
- Deploy development incident response and forensic procedures
- Execute security code review and static analysis procedures
- Maintain development security metrics and improvement tracking`,

    toolsAndFrameworks: `**SBOM & Dependency Management:**
- **SBOM Tools:** SPDX tools, CycloneDX, Syft, Tern, custom SBOM generators
- **Vulnerability Scanning:** Snyk, GitHub Dependabot, OWASP Dependency-Check, Trivy
- **License Compliance:** FOSSA, WhiteSource/Mend, Black Duck, FOSSology
- **Package Management:** npm audit, pip-audit, Maven dependency:check

**Model Security & Provenance:**
- **Model Scanning:** ModelScan, Giskard, custom model analysis tools
- **Cryptographic Tools:** OpenSSL, GnuPG, Sigstore for model signing
- **Version Control:** Git LFS, DVC, MLflow for model versioning
- **Model Registries:** MLflow Model Registry, Kubeflow, custom registries

**Development Security:**
- **SAST Tools:** SonarQube, Checkmarx, Veracode, Semgrep, CodeQL
- **Secrets Detection:** GitLeaks, TruffleHog, detect-secrets
- **Container Security:** Docker Security Scanning, Aqua, Twistlock, Clair
- **Infrastructure:** Terraform security scanning, CloudFormation Guard

**CI/CD & Automation:**
- **Pipeline Security:** Jenkins security plugins, GitHub Actions, GitLab CI/CD
- **Artifact Security:** JFrog Artifactory, Sonatype Nexus, Harbor registry
- **Compliance:** OpenSCAP, Chef InSpec, Ansible security modules
- **Monitoring:** Splunk, ELK Stack, custom security dashboards`
  },
  designPhase: true,
  buildPhase: true,
  operationPhase: true,
  mitigatedThreatNames: ["Memory Poisoning", "Tool Misuse", "Privilege Compromise", "Unexpected RCE", "Rogue Agents"],
  mitigatedThreatIds: ["t1", "t2", "t3", "t11", "t13"],
  tags: ["supply-chain", "provenance", "dependencies", "sbom"],
  references: [
    { title: "NIST SSDF", url: "https://csrc.nist.gov/Projects/ssdf" },
    { title: "SLSA Framework", url: "https://slsa.dev/" },
    { title: "SPDX Specification", url: "https://spdx.github.io/spdx-spec/" }
  ],
  riskScore: 8,
  status: "active",
  version: "2024.2",
  lastUpdated: "2024-12-01",
  updatedBy: "enhanced",
  color: "#10b981",
  icon: "supply",
  displayOrder: 16
},

"m17": {
  id: "m17",
  name: "Incident Response & Recovery Framework",
  description: "Implement comprehensive incident response capabilities specifically designed for agentic AI systems, including automated containment, forensic analysis, recovery procedures, and lessons learned integration to rapidly respond to security incidents and minimize impact.",
  threatIds: ["t8", "t13", "t11", "t3", "t2"],
  implementationDetail: {
    design: `**Incident Response Architecture:**
- Design AI-specific incident classification and severity assessment frameworks
- Plan automated incident detection and alerting with intelligent triage
- Design incident containment strategies for different agent architectures
- Plan forensic data collection and preservation for AI systems
- Design incident communication and stakeholder notification procedures
- Plan legal and regulatory compliance for incident reporting
- Design incident recovery and business continuity procedures
- Plan post-incident analysis and lessons learned integration

**AI-Specific Incident Types:**
- Design response procedures for prompt injection and jailbreak attacks
- Plan containment for memory poisoning and data corruption incidents
- Design recovery from tool misuse and privilege escalation events
- Plan response to rogue agent detection and containment
- Design handling of model theft and intellectual property breaches
- Plan response to bias incidents and fairness violations
- Design recovery from availability and performance incidents
- Plan handling of compliance and regulatory violations

**Automated Response Design:**
- Design intelligent incident triage and priority assignment
- Plan automated containment and isolation procedures
- Design automated evidence collection and preservation
- Plan automated notification and escalation workflows
- Design automated recovery and restoration procedures
- Plan automated threat hunting and indicator enrichment`,

    build: `**Incident Detection & Classification:**
- Build AI-specific incident detection systems:
* Prompt injection attack detection with ML classifiers
* Memory poisoning detection through content analysis
* Rogue agent behavior detection using anomaly analysis
* Tool misuse detection through permission and usage monitoring
* Model performance degradation detection with statistical monitoring
- Implement intelligent incident classification:
* Automated severity assessment based on impact and scope
* Incident type classification with confidence scoring
* Stakeholder identification and notification automation
* Priority assignment based on business impact and risk

**Automated Containment Systems:**
- Build rapid response containment mechanisms:
* Automatic agent isolation and communication blocking
* Dynamic permission revocation and access control updates
* Network segmentation and traffic filtering
* Memory and data store isolation and protection
* Tool access suspension and capability restriction
- Deploy intelligent containment strategies:
* Risk-based containment scope determination
* Minimal impact containment with business continuity preservation
* Cascading containment for multi-agent incidents
* Recovery-oriented containment with restoration planning

**Forensic & Evidence Collection:**
- Build comprehensive forensic capabilities:
* Automated evidence collection from logs, memory, and network traffic
* Chain of custody management with cryptographic integrity
* Timeline reconstruction and attack path analysis
* Artifact preservation and secure storage
* Expert system integration for forensic analysis automation
- Implement specialized AI forensics:
* Model state capture and analysis at incident time
* Memory content analysis and corruption assessment
* Communication flow analysis and message inspection
* Decision tree reconstruction and reasoning analysis

**Recovery & Restoration:**
- Build automated recovery systems:
* Clean backup identification and validation
* Incremental restoration with integrity verification
* Service health validation and performance testing
* Data consistency checking and repair procedures
- Deploy intelligent recovery strategies:
* Risk-based recovery prioritization
* Gradual service restoration with monitoring
* Rollback procedures for failed recovery attempts
* Business continuity maintenance during recovery`,

    operations: `**Incident Response Operations:**
- Operate 24/7 incident response capability with trained personnel
- Execute regular incident response drills and tabletop exercises
- Maintain incident response procedures and playbook updates
- Deploy incident response performance metrics and improvement tracking
- Execute post-incident reviews and lessons learned integration
- Maintain incident response team training and certification
- Deploy incident response tool maintenance and capability development

**Forensic Operations:**
- Execute forensic analysis and investigation procedures
- Maintain forensic tool capabilities and expert knowledge
- Deploy expert witness support and legal testimony preparation
- Execute chain of custody management and evidence handling
- Maintain forensic laboratory capabilities and certifications
- Deploy forensic research and technique development

**Recovery Operations:**
- Execute business continuity and disaster recovery procedures
- Maintain backup and restoration capabilities testing
- Deploy recovery performance monitoring and optimization
- Execute recovery training and capability development
- Maintain recovery documentation and procedure updates
- Deploy recovery coordination with business stakeholders

**Continuous Improvement:**
- Execute incident response maturity assessment and improvement
- Maintain threat intelligence integration and indicator development
- Deploy industry collaboration and information sharing
- Execute research and development for emerging threats
- Maintain regulatory compliance and reporting capabilities`,

    toolsAndFrameworks: `**Incident Response Platforms:**
- **SOAR Platforms:** Phantom/Splunk, Demisto/Cortex XSOAR, IBM Resilient, TheHive
- **Ticketing Systems:** Jira Service Management, ServiceNow, PagerDuty, OpsGenie
- **Communication:** Slack, Microsoft Teams, Mattermost for incident coordination
- **Documentation:** Confluence, GitBook, custom incident knowledge bases

**Forensic & Analysis Tools:**
- **Log Analysis:** Splunk, ELK Stack, Graylog, Sumo Logic for incident investigation
- **Network Forensics:** Wireshark, NetworkMiner, Moloch, Zeek for traffic analysis
- **Memory Analysis:** Volatility, Rekall, custom memory forensics tools
- **File System:** Autopsy, Sleuth Kit, FTK for file system analysis

**Containment & Recovery:**
- **Network Isolation:** Firewall automation, SDN controllers, network ACL management
- **System Isolation:** Orchestration tools, container management, VM isolation
- **Backup & Recovery:** Veeam, Commvault, cloud-native backup solutions
- **Configuration Management:** Ansible, Puppet, Chef for automated recovery

**Monitoring & Detection:**
- **SIEM Systems:** Splunk Enterprise Security, IBM QRadar, Azure Sentinel
- **EDR Solutions:** CrowdStrike, SentinelOne, Carbon Black, Microsoft Defender
- **Custom Detection:** Sigma rules, Yara rules, custom ML detection models
- **Threat Intelligence:** MISP, ThreatConnect, Recorded Future, VirusTotal Enterprise`
  },
  designPhase: true,
  buildPhase: true,
  operationPhase: true,
  mitigatedThreatNames: ["Repudiation", "Rogue Agents", "Unexpected RCE", "Privilege Compromise", "Tool Misuse"],
  mitigatedThreatIds: ["t8", "t13", "t11", "t3", "t2"],
  tags: ["incident-response", "forensics", "recovery", "automation"],
  references: [
    { title: "NIST Incident Response Guide", url: "https://csrc.nist.gov/publications/detail/sp/800-61/rev-2/final" },
    { title: "SANS Incident Response", url: "https://www.sans.org/white-papers/1901/" },
    { title: "ENISA Incident Response", url: "https://www.enisa.europa.eu/topics/incident-response" }
  ],
  riskScore: 8,
  status: "active",
  version: "2024.2",
  lastUpdated: "2024-12-01",
  updatedBy: "enhanced",
  color: "#f59e0b",
  icon: "incident",
  displayOrder: 17
  }
};

// Populate mitigatedThreatNames and mitigatedThreatIds for each mitigation
Object.values(mitigationsData).forEach(mitigation => {
  mitigation.mitigatedThreatNames = mitigation.threatIds
    .map(tid => threatsData[tid]?.name)
    .filter(name => !!name);
  mitigation.mitigatedThreatIds = mitigation.threatIds.filter(tid => !!threatsData[tid]);
});

// Populate mitigationIds for each threat (bidirectional linking)
Object.values(threatsData).forEach(threat => {
  threat.mitigationIds = Object.values(mitigationsData)
    .filter(mit => mit.threatIds.includes(threat.id))
    .map(mit => mit.id);
});

export interface AISVSRequirement {
  id: string; // e.g., "v2.1.1"
  code: string; // e.g., "V10.1.1"
  title: string;
  description: string;
  level: 1 | 2 | 3;
  category: string; // The parent category code, e.g., "v10"
  role?: string; // e.g., "D/V", "D", "V"
  references: { title: string; url: string }[];
}

/**
 * Defines a sub-category that groups related requirements.
 */
export interface AISVSSubCategory {
  id: string; // e.g., "v2.1"
  code: string; // e.g., "V10.1"
  name: string;
  requirements: AISVSRequirement[];
}

/**
 * Defines a top-level AISVS category.
 */
export interface AISVSCategory {
  id: string; // e.g., "v2"
  code: string; // e.g., "V2"
  name: string;
  description: string;
  subCategories: AISVSSubCategory[]; // Contains the grouped requirements
  color: string;
  icon: string;
  references: { title: string; url: string }[];
}

/**
 * OWASP AI Security Verification Standard (AISVS) v1.0 Data
 *
 * This data structure is populated with requirements from various sources provided by the user,
 * representing a comprehensive and detailed view of AI security controls.
 * Source: User-provided data.
 *
 * The `color`, `icon`, and `role` fields are not part of any official specification but are
 * included for frontend and logical grouping purposes.
 */
export const aisvsData: Record<string, AISVSCategory> = {
  "v1": {
    id: "v1",
    code: "C1",
    name: "Training Data Governance & Bias Management",
    description: "Training data must be sourced, handled, and maintained in a way that preserves provenance, security, quality, and fairness. Doing so fulfils legal duties and reduces risks of bias, poisoning, or privacy breaches throughout the AI lifecycle.",
    color: "#3b82f6",
    icon: "database",
    subCategories: [
      { id: "v1.1", code: "C1.1", name: "Training Data Provenance", requirements: [
          { id: "v1.1.1", code: "1.1.1", title: "Maintain Data Source Inventory", description: "Verify that an up-to-date inventory of every training-data source (origin, steward/owner, licence, collection method, intended use constraints, and processing history) is maintained.", level: 1, category: "v1", role: "D/V", references: [] },
          { id: "v1.1.2", code: "1.1.2", title: "Vet Datasets for Quality and Compliance", description: "Verify that only datasets vetted for quality, representativeness, ethical sourcing, and licence compliance are allowed, reducing risks of poisoning, embedded bias, and intellectual property infringement.", level: 1, category: "v1", role: "D/V", references: [] },
          { id: "v1.1.3", code: "1.1.3", title: "Enforce Data Minimization", description: "Verify that data minimisation is enforced so unnecessary or sensitive attributes are excluded.", level: 1, category: "v1", role: "D/V", references: [] },
          { id: "v1.1.4", code: "1.1.4", title: "Logged Approval Workflow for Changes", description: "Verify that all dataset changes are subject to a logged approval workflow.", level: 2, category: "v1", role: "D/V", references: [] },
          { id: "v1.1.5", code: "1.1.5", title: "Ensure Labeling Quality", description: "Verify that labelling/annotation quality is ensured via reviewer cross-checks or consensus.", level: 2, category: "v1", role: "D/V", references: [] },
          { id: "v1.1.6", code: "1.1.6", title: "Maintain Data Cards/Datasheets", description: "Verify that \"data cards\" or \"datasheets for datasets\" are maintained for significant training datasets, detailing characteristics, motivations, composition, collection processes, preprocessing, and recommended/discouraged uses.", level: 2, category: "v1", role: "D/V", references: [] },
      ]},
      { id: "v1.2", code: "C1.2", name: "Training Data Security & Integrity", requirements: [
          { id: "v1.2.1", code: "1.2.1", title: "Control Access to Storage and Pipelines", description: "Verify that access controls protect storage and pipelines.", level: 1, category: "v1", role: "D/V", references: [] },
          { id: "v1.2.2", code: "1.2.2", title: "Encrypt Data In Transit and At Rest", description: "Verify that datasets are encrypted in transit and, for all sensitive or personally identifiable information (PII), at rest, using industry-standard cryptographic algorithms and key management practices.", level: 2, category: "v1", role: "D/V", references: [] },
          { id: "v1.2.3", code: "1.2.3", title: "Ensure Data Integrity with Hashes", description: "Verify that cryptographic hashes or digital signatures are used to ensure data integrity during storage and transfer, and that automated anomaly detection techniques are applied to guard against unauthorized modifications or corruption, including targeted data poisoning attempts.", level: 2, category: "v1", role: "D/V", references: [] },
          { id: "v1.2.4", code: "1.2.4", title: "Track Dataset Versions", description: "Verify that dataset versions are tracked to enable rollback.", level: 3, category: "v1", role: "D/V", references: [] },
          { id: "v1.2.5", code: "1.2.5", title: "Securely Purge Obsolete Data", description: "Verify that obsolete data is securely purged or anonymized in compliance with data retention policies, regulatory requirements, and to shrink the attack surface.", level: 2, category: "v1", role: "D/V", references: [] },
      ]},
      { id: "v1.3", code: "C1.3", name: "Representation Completeness & Fairness", requirements: [
          { id: "v1.3.1", code: "1.3.1", title: "Profile for Bias and Imbalance", description: "Verify that datasets are profiled for representational imbalance and potential biases across legally protected attributes (e.g., race, gender, age) and other ethically sensitive characteristics relevant to the model's application domain (e.g., socio-economic status, location).", level: 1, category: "v1", role: "D/V", references: [] },
          { id: "v1.3.2", code: "1.3.2", title: "Mitigate Identified Biases", description: "Verify that that identified biases are mitigated via documented strategies such as re-balancing, targeted data augmentation, algorithmic adjustments (e.g., pre-processing, in-processing, post-processing techniques), or re-weighting, and the impact of mitigation on both fairness and overall model performance is assessed.", level: 2, category: "v1", role: "D/V", references: [] },
          { id: "v1.3.3", code: "1.3.3", title: "Evaluate Post-Training Fairness Metrics", description: "Verify that post-training fairness metrics are evaluated and documented.", level: 2, category: "v1", role: "D/V", references: [] },
          { id: "v1.3.4", code: "1.3.4", title: "Maintain Lifecycle Bias-Management Policy", description: "Verify that a lifecycle bias-management policy assigns owners and review cadence.", level: 3, category: "v1", role: "D/V", references: [] },
      ]},
      { id: "v1.4", code: "C1.4", name: "Training Data Labeling Quality, Integrity, and Security", requirements: [
          { id: "v1.4.1", code: "1.4.1", title: "Ensure Labeling Quality", description: "Verify that labeling/annotation quality is ensured via clear guidelines, reviewer cross-checks, consensus mechanisms (e.g., monitoring inter-annotator agreement), and defined processes for resolving discrepancies.", level: 2, category: "v1", role: "D/V", references: [] },
          { id: "v1.4.2", code: "1.4.2", title: "Apply Hashes to Label Artefacts", description: "Verify that cryptographic hashes or digital signatures are applied to label artefacts to ensure their integrity and authenticity.", level: 2, category: "v1", role: "D/V", references: [] },
          { id: "v1.4.3", code: "1.4.3", title: "Secure Labeling Interfaces", description: "Verify that labeling interfaces and platforms enforce strong access controls, maintain tamper-evident audit logs of all labeling activities, and protect against unauthorized modifications.", level: 2, category: "v1", role: "D/V", references: [] },
          { id: "v1.4.4", code: "1.4.4", title: "Dual Review for Critical Labels", description: "Verify that labels critical to safety, security, or fairness (e.g., identifying toxic content, critical medical findings) receive mandatory independent dual review or equivalent robust verification.", level: 3, category: "v1", role: "D/V", references: [] },
          { id: "v1.4.5", code: "1.4.5", title: "Protect Sensitive Information in Labels", description: "Verify that sensitive information (including PII) inadvertently captured or necessarily present in labels is redacted, pseudonymized, anonymized, or encrypted at rest and in transit, according to data minimization principles.", level: 2, category: "v1", role: "D/V", references: [] },
          { id: "v1.4.6", code: "1.4.6", title: "Version Control Labeling Guides", description: "Verify that labeling guides and instructions are comprehensive, version-controlled, and peer-reviewed.", level: 2, category: "v1", role: "D/V", references: [] },
          { id: "v1.4.7", code: "1.4.7", title: "Version Control Data Schemas", description: "Verify that data schemas (including for labels) are clearly defined, and version-controlled.", level: 2, category: "v1", role: "D/V", references: [] },
          { id: "v1.4.8", code: "1.8.2", title: "Secure Outsourced Labeling", description: "Verify that outsourced or crowdsourced labeling workflows include technical/procedural safeguards to ensure data confidentiality, integrity, label quality, and prevent data leakage.", level: 2, category: "v1", role: "D/V", references: [] }, // Renumbered to avoid conflict
      ]},
      { id: "v1.5", code: "C1.5", name: "Training Data Quality Assurance", requirements: [
          { id: "v1.5.1", code: "1.5.1", title: "Automate Quality Tests", description: "Verify that automated tests catch format errors, nulls, and label skews on every ingest or significant transformation.", level: 1, category: "v1", role: "D", references: [] },
          { id: "v1.5.2", code: "1.5.2", title: "Quarantine Failed Datasets", description: "Verify that failed datasets are quarantined with audit trails.", level: 1, category: "v1", role: "D/V", references: [] },
          { id: "v1.5.3", code: "1.5.3", title: "Manual Spot-Checks by Experts", description: "Verify that manual spot-checks by domain experts cover a statistically significant sample (e.g., ≥1% or 1,000 samples, whichever is greater, or as determined by risk assessment) to identify subtle quality issues not caught by automation.", level: 2, category: "v1", role: "V", references: [] },
          { id: "v1.5.4", code: "1.5.4", title: "Log Remediation Steps", description: "Verify that remediation steps are appended to provenance records.", level: 2, category: "v1", role: "D/V", references: [] },
          { id: "v1.5.5", code: "1.5.5", title: "Use Quality Gates", description: "Verify that quality gates block sub-par datasets unless exceptions are approved.", level: 2, category: "v1", role: "D/V", references: [] },
      ]},
      { id: "v1.6", code: "C1.6", name: "Data Poisoning Detection", requirements: [
          { id: "v1.6.1", code: "1.6.1", title: "Apply Anomaly Detection", description: "Verify that anomaly detection techniques (e.g., statistical methods, outlier detection, embedding analysis) are applied to training data at ingest and before major training runs to identify potential poisoning attacks or unintentional data corruption.", level: 2, category: "v1", role: "D/V", references: [] },
          { id: "v1.6.2", code: "1.6.2", title: "Manual Review of Flagged Samples", description: "Verify that flagged samples trigger manual review before training.", level: 2, category: "v1", role: "D/V", references: [] },
          { id: "v1.6.3", code: "1.6.3", title: "Feed Results to Threat Intelligence", description: "Verify that results feed the model's security dossier and inform ongoing threat intelligence.", level: 2, category: "v1", role: "V", references: [] },
          { id: "v1.6.4", code: "1.6.4", title: "Refresh Detection Logic", description: "Verify that detection logic is refreshed with new threat intel.", level: 3, category: "v1", role: "D/V", references: [] },
          { id: "v1.6.5", code: "1.6.5", title: "Monitor Distribution Drift", description: "Verify that online-learning pipelines monitor distribution drift.", level: 3, category: "v1", role: "D/V", references: [] },
          { id: "v1.6.6", code: "1.6.6", title: "Implement Specific Poisoning Defenses", description: "Verify that specific defenses against known data poisoning attack types (e.g., label flipping, backdoor trigger insertion, influential instance attacks) are considered and implemented based on the system's risk profile and data sources.", level: 3, category: "v1", role: "D/V", references: [] },
      ]},
      { id: "v1.7", code: "C1.7", name: "User Data Deletion & Consent Enforcement", requirements: [
          { id: "v1.7.1", code: "1.7.1", title: "Purge Data and Assess Model Impact", description: "Verify that deletion workflows purge primary and derived data and assess model impact, and that the impact on affected models is assessed and, if necessary, addressed (e.g., through retraining or recalibration).", level: 1, category: "v1", role: "D/V", references: [] },
          { id: "v1.7.2", code: "1.7.2", title: "Track and Respect User Consent", description: "Verify that mechanisms are in place to track and respect the scope and status of user consent (and withdrawals) for data used in training, and that consent is validated before data is incorporated into new training processes or significant model updates.", level: 2, category: "v1", role: "D", references: [] },
          { id: "v1.7.3", code: "1.7.3", title: "Test Deletion Workflows Annually", description: "Verify that workflows are tested annually and logged.", level: 2, category: "v1", role: "V", references: [] },
      ]},
      { id: "v1.8", code: "C1.8", name: "Supply Chain Security", requirements: [
          { id: "v1.8.1", code: "1.8.1", title: "Vet Third-Party Data Suppliers", description: "Verify that third-party data suppliers, including providers of pre-trained models and external datasets, undergo security, privacy, ethical sourcing, and data quality due diligence before their data or models are integrated.", level: 2, category: "v1", role: "D/V", references: [] },
          { id: "v1.8.2", code: "1.8.2", title: "Secure External Transfers", description: "Verify that external transfers use TLS/auth and integrity checks.", level: 1, category: "v1", role: "D", references: [] },
          { id: "v1.8.3", code: "1.8.3", title: "Scrutinize High-Risk Data Sources", description: "Verify that high-risk data sources (e.g., open-source datasets with unknown provenance, unvetted suppliers) receive enhanced scrutiny, such as sandboxed analysis, extensive quality/bias checks, and targeted poisoning detection, before use in sensitive applications.", level: 2, category: "v1", role: "D/V", references: [] },
          { id: "v1.8.4", code: "1.8.4", title: "Evaluate Pre-trained Models", description: "Verify that pre-trained models obtained from third parties are evaluated for embedded biases, potential backdoors, integrity of their architecture, and the provenance of their original training data before fine-tuning or deployment.", level: 3, category: "v1", role: "D/V", references: [] },
      ]},
      { id: "v1.9", code: "C1.9", name: "Adversarial Sample Detection", requirements: [
          { id: "v1.9.1", code: "1.9.1", title: "Implement Adversarial Defenses", description: "Verify that appropriate defenses, such as adversarial training (using generated adversarial examples), data augmentation with perturbed inputs, or robust optimization techniques, are implemented and tuned for relevant models based on risk assessment.", level: 3, category: "v1", role: "D/V", references: [] },
          { id: "v1.9.2", code: "1.9.2", title: "Document Adversarial Datasets", description: "Verify that if adversarial training is used, the generation, management, and versioning of adversarial datasets are documented and controlled.", level: 2, category: "v1", role: "D/V", references: [] },
          { id: "v1.9.3", code: "1.9.3", title: "Evaluate Impact of Robustness Training", description: "Verify that the impact of adversarial robustness training on model performance (against both clean and adversarial inputs) and fairness metrics is evaluated, documented, and monitored.", level: 3, category: "v1", role: "D/V", references: [] },
          { id: "v1.9.4", code: "1.9.4", title: "Review and Update Adversarial Strategies", description: "Verify that strategies for adversarial training and robustness are periodically reviewed and updated to counter evolving adversarial attack techniques.", level: 3, category: "v1", role: "D/V", references: [] },
      ]},
      { id: "v1.10", code: "C1.10", name: "Data Lineage and Traceability", requirements: [
          { id: "v1.10.1", code: "1.10.1", title: "Record Data Lineage", description: "Verify that the lineage of each data point, including all transformations, augmentations, and merges, is recorded and can be reconstructed.", level: 2, category: "v1", role: "D/V", references: [] },
          { id: "v1.10.2", code: "1.10.2", title: "Secure Lineage Records", description: "Verify that lineage records are immutable, securely stored, and accessible for audits or investigations.", level: 2, category: "v1", role: "D/V", references: [] },
          { id: "v1.10.3", code: "1.10.3", title: "Track Synthetic Data Lineage", description: "Verify that lineage tracking covers both raw and synthetic data.", level: 2, category: "v1", role: "D/V", references: [] },
      ]},
      { id: "v1.11", code: "C1.11", name: "Synthetic Data Management", requirements: [
          { id: "v1.11.1", code: "1.11.1", title: "Label Synthetic Data", description: "Verify that all synthetic data is clearly labeled and distinguishable from real data throughout the pipeline.", level: 2, category: "v1", role: "D/V", references: [] },
          { id: "v1.11.2", code: "1.11.2", title: "Document Synthetic Data Generation", description: "Verify that the generation process, parameters, and intended use of synthetic data are documented.", level: 2, category: "v1", role: "D/V", references: [] },
          { id: "v1.11.3", code: "1.11.3", title: "Assess Synthetic Data Risk", description: "Verify that synthetic data is risk-assessed for bias, privacy leakage, and representational issues before use in training.", level: 2, category: "v1", role: "D/V", references: [] },
      ]},
      { id: "v1.12", code: "C1.12", name: "Data Access Monitoring & Anomaly Detection", requirements: [
          { id: "v1.12.1", code: "1.12.1", title: "Log Data Access", description: "Verify that all access to training data is logged, including user, time, and action.", level: 2, category: "v1", role: "D/V", references: [] },
          { id: "v1.12.2", code: "1.12.2", title: "Review Access Logs for Anomalies", description: "Verify that access logs are regularly reviewed for unusual patterns, such as large exports or access from new locations.", level: 2, category: "v1", role: "D/V", references: [] },
          { id: "v1.12.3", code: "1.12.3", title: "Generate Alerts for Suspicious Access", description: "Verify that alerts are generated for suspicious access events and investigated promptly.", level: 2, category: "v1", role: "D/V", references: [] },
      ]},
      { id: "v1.13", code: "C1.13", name: "Data Retention & Expiry Policies", requirements: [
          { id: "v1.13.1", code: "1.13.1", title: "Define Retention Periods", description: "Verify that explicit retention periods are defined for all training datasets.", level: 1, category: "v1", role: "D/V", references: [] },
          { id: "v1.13.2", code: "1.13.2", title: "Automate Data Expiry", description: "Verify that datasets are automatically expired, deleted, or reviewed for deletion at the end of their lifecycle.", level: 2, category: "v1", role: "D/V", references: [] },
          { id: "v1.13.3", code: "1.13.3", title: "Log Retention and Deletion Actions", description: "Verify that retention and deletion actions are logged and auditable.", level: 2, category: "v1", role: "D/V", references: [] },
      ]},
      { id: "v1.14", code: "C1.14", name: "Regulatory & Jurisdictional Compliance", requirements: [
          { id: "v1.14.1", code: "1.14.1", title: "Enforce Data Residency Requirements", description: "Verify that data residency and cross-border transfer requirements are identified and enforced for all datasets.", level: 2, category: "v1", role: "D/V", references: [] },
          { id: "v1.14.2", code: "1.14.2", title: "Address Sector-Specific Regulations", description: "Verify that sector-specific regulations (e.g., healthcare, finance) are identified and addressed in data handling.", level: 2, category: "v1", role: "D/V", references: [] },
          { id: "v1.14.3", code: "1.14.3", title: "Document and Review Privacy Law Compliance", description: "Verify that compliance with relevant privacy laws (e.g., GDPR, CCPA) is documented and reviewed regularly.", level: 2, category: "v1", role: "D/V", references: [] },
      ]},
      { id: "v1.15", code: "C1.15", name: "Data Watermarking & Fingerprinting", requirements: [
          { id: "v1.15.1", code: "1.15.1", title: "Watermark Datasets", description: "Verify that datasets or subsets are watermarked or fingerprinted where feasible.", level: 3, category: "v1", role: "D/V", references: [] },
          { id: "v1.15.2", code: "1.15.2", title: "Ensure Watermarking is Fair and Private", description: "Verify that watermarking/fingerprinting methods do not introduce bias or privacy risks.", level: 3, category: "v1", role: "D/V", references: [] },
          { id: "v1.15.3", code: "1.15.3", title: "Check for Unauthorized Reuse", description: "Verify that periodic checks are performed to detect unauthorized reuse or leakage of watermarked data.", level: 3, category: "v1", role: "D/V", references: [] },
      ]},
      { id: "v1.16", code: "C1.16", name: "Data Subject Rights Management", requirements: [
          { id: "v1.16.1", code: "1.16.1", title: "Support Data Subject Requests", description: "Verify that mechanisms exist to respond to data subject requests for access, rectification, restriction, or objection.", level: 2, category: "v1", role: "D/V", references: [] },
          { id: "v1.16.2", code: "1.16.2", title: "Log and Track Requests", description: "Verify that requests are logged, tracked, and fulfilled within legally mandated timeframes.", level: 2, category: "v1", role: "D/V", references: [] },
          { id: "v1.16.3", code: "1.16.3", title: "Test Rights Processes", description: "Verify that data subject rights processes are tested and reviewed regularly for effectiveness.", level: 2, category: "v1", role: "D/V", references: [] },
      ]},
      { id: "v1.17", code: "C1.17", name: "Dataset Version Impact Analysis", requirements: [
          { id: "v1.17.1", code: "1.17.1", title: "Perform Impact Analysis", description: "Verify that an impact analysis is performed before updating or replacing a dataset version, covering model performance, fairness, and compliance.", level: 2, category: "v1", role: "D/V", references: [] },
          { id: "v1.17.2", code: "1.17.2", title: "Document and Review Analysis", description: "Verify that results of the impact analysis are documented and reviewed by relevant stakeholders.", level: 2, category: "v1", role: "D/V", references: [] },
          { id: "v1.17.3", code: "1.17.3", title: "Maintain Rollback Plans", description: "Verify that rollback plans exist in case new versions introduce unacceptable risks or regressions.", level: 2, category: "v1", role: "D/V", references: [] },
      ]},
      { id: "v1.18", code: "C1.18", name: "Data Annotation Workforce Security", requirements: [
          { id: "v1.18.1", code: "1.18.1", title: "Vet and Train Annotators", description: "Verify that all personnel involved in data annotation are background-checked and trained in data security and privacy.", level: 2, category: "v1", role: "D/V", references: [] },
          { id: "v1.18.2", code: "1.18.2", title: "Use Confidentiality Agreements", description: "Verify that all annotation personnel sign confidentiality and non-disclosure agreements.", level: 2, category: "v1", role: "D/V", references: [] },
          { id: "v1.18.3", code: "1.18.3", title: "Secure Annotation Platforms", description: "Verify that annotation platforms enforce access controls and monitor for insider threats.", level: 2, category: "v1", role: "D/V", references: [] },
      ]},
    ],
    references: [
      { title: "NIST AI Risk Management Framework", url: "https://www.nist.gov/itl/ai-risk-management-framework" },
      { title: "EU AI Act – Article 10: Data & Data Governance", url: "https://artificialintelligenceact.eu/article/10/" },
      { title: "MITRE ATLAS: Adversary Tactics for AI", url: "https://atlas.mitre.org/" },
      { title: "Survey of ML Bias Mitigation Techniques – MDPI", url: "https://www.mdpi.com/2673-6470/4/1/1" },
      { title: "Data Provenance & Lineage Best Practices – Nightfall AI", url: "https://www.nightfall.ai/ai-security-101/data-provenance-and-lineage" },
      { title: "Data Labeling Quality Standards – LabelYourData", url: "https://labelyourdata.com/articles/data-labeling-quality-and-how-to-measure-it" },
      { title: "Training Data Poisoning Guide – Lakera.ai", url: "https://www.lakera.ai/blog/training-data-poisoning" },
      { title: "CISA Advisory: Securing Data for AI Systems", url: "https://www.cisa.gov/news-events/cybersecurity-advisories/aa25-142a" },
      { title: "ISO/IEC 23053: AI Management Systems Framework", url: "https://www.iso.org/sectors/it-technologies/ai" },
      { title: "IBM: What is AI Governance?", url: "https://www.ibm.com/think/topics/ai-governance" },
      { title: "Google AI Principles", url: "https://ai.google/principles/" },
      { title: "GDPR & AI Training Data – DataProtectionReport", url: "https://www.dataprotectionreport.com/2024/08/recent-regulatory-developments-in-training-artificial-intelligence-ai-models-under-the-gdpr/" },
      { title: "Supply-Chain Security for AI Data – AppSOC", url: "https://www.appsoc.com/blog/ai-is-the-new-frontier-of-supply-chain-security" },
      { title: "OpenAI Privacy Center – Data Deletion Controls", url: "https://privacy.openai.com/policies?modal=take-control" },
      { title: "Adversarial ML Dataset – Kaggle", url: "https://www.kaggle.com/datasets/cnrieiit/adversarial-machine-learning-dataset" },
    ]
  },
  "v2": {
    id: "v2",
    code: "C2",
    name: "User Input Validation",
    description: "Robust user-input validation is a first-line defense against many of the most damaging attacks on AI systems. Prompt-injection \"jailbreaks\" can override system instructions, leak sensitive data, or steer the model toward disallowed behavior. Research shows that multi-shot jailbreaks exploiting very long context windows remain effective unless dedicated filters and instruction-hierarchies are in place. Meanwhile, imperceptible adversarial perturbations—such as homoglyph swaps or leetspeak—can silently change a model's decisions.",
    color: "#10b981",
    icon: "shield-half",
    subCategories: [
      { id: "v2.1", code: "C2.1", name: "Prompt-Injection Defense", requirements: [
          { id: "v2.1.1", code: "2.1.1", title: "Screen Against Known Injection Patterns", description: "Verify that user inputs are screened against a continuously-updated library of known prompt-injection patterns (jailbreak keywords, \"ignore previous\", role-play chains, indirect HTML/URL attacks).", level: 1, category: "v2", role: "D/V", references: [] },
          { id: "v2.1.2", code: "2.1.2", title: "Enforce Instruction Hierarchy", description: "Verify that the system enforces an instruction hierarchy in which system or developer messages override user instructions, even after context window expansion.", level: 1, category: "v2", role: "D/V", references: [] },
          { id: "v2.1.3", code: "2.1.3", title: "Run Adversarial Evaluation Tests", description: "Verify that adversarial evaluation tests (e.g., red-team \"many-shot\" prompts) are run before every model or prompt-template release, with success-rate thresholds and automated blockers for regressions.", level: 2, category: "v2", role: "D/V", references: [] },
          { id: "v2.1.4", code: "2.1.4", title: "Sanitize Third-Party Content", description: "Verify that prompts originating from third-party content (web pages, PDFs, e-mails) are sanitized in an isolated parsing context before being concatenated into the main prompt.", level: 2, category: "v2", role: "D", references: [] },
          { id: "v2.1.5", code: "2.1.5", title: "Version Control Filters and Block-lists", description: "Verify that all prompt-filter rule updates, classifier model versions and block-list changes are version-controlled and auditable.", level: 3, category: "v2", role: "D/V", references: [] },
      ]},
      { id: "v2.2", code: "C2.2", name: "Adversarial-Example Resistance", requirements: [
          { id: "v2.2.1", code: "2.2.1", title: "Use Basic Input Normalization", description: "Verify that basic input-normalization steps (Unicode NFC, homoglyph mapping, whitespace trimming) run before tokenization.", level: 1, category: "v2", role: "D", references: [] },
          { id: "v2.2.2", code: "2.2.2", title: "Flag Statistical Anomalies", description: "Verify that statistical anomaly detection flags inputs with unusually high edit distance to language norms, excessive repeated tokens, or abnormal embedding distances.", level: 2, category: "v2", role: "D/V", references: [] },
          { id: "v2.2.3", code: "2.2.3", title: "Support Hardened Model Variants", description: "Verify that the inference pipeline supports optional adversarial-training–hardened model variants or defense layers (e.g., randomization, defensive distillation) for high-risk endpoints.", level: 2, category: "v2", role: "D", references: [] },
          { id: "v2.2.4", code: "2.2.4", title: "Quarantine Suspected Adversarial Inputs", description: "Verify that suspected adversarial inputs are quarantined, logged with full payloads (after PII redaction).", level: 2, category: "v2", role: "V", references: [] },
          { id: "v2.2.5", code: "2.2.5", title: "Track Robustness Metrics", description: "Verify that robustness metrics (success rate of known attack suites) are tracked over time and regressions trigger a release blocker.", level: 3, category: "v2", role: "D/V", references: [] },
      ]},
      { id: "v2.3", code: "C2.3", name: "Schema, Type & Length Validation", requirements: [
          { id: "v2.3.1", code: "2.3.1", title: "Define and Validate Input Schemas", description: "Verify that every API or function-call endpoint defines an explicit input schema (JSON Schema, Protobuf or multimodal equivalent) and that inputs are validated before prompt assembly.", level: 1, category: "v2", role: "D", references: [] },
          { id: "v2.3.2", code: "2.3.2", title: "Reject Oversized Inputs", description: "Verify that inputs exceeding maximum token or byte limits are rejected with a safe error and never silently truncated.", level: 1, category: "v2", role: "D/V", references: [] },
          { id: "v2.3.3", code: "2.3.3", title: "Enforce Server-Side Type Checks", description: "Verify that type checks (e.g., numeric ranges, enum values, MIME types for images/audio) are enforced server-side, not only in client code.", level: 2, category: "v2", role: "D/V", references: [] },
          { id: "v2.3.4", code: "2.3.4", title: "Use Constant-Time Semantic Validators", description: "Verify that semantic validators (e.g., JSON Schema) run in constant-time to prevent algorithmic DoS.", level: 2, category: "v2", role: "D", references: [] },
          { id: "v2.3.5", code: "2.3.5", title: "Log Validation Failures", description: "Verify that validation failures are logged with redacted payload snippets and unambiguous error codes to aid security triage.", level: 3, category: "v2", role: "V", references: [] },
      ]},
      { id: "v2.4", code: "C2.4", name: "Content & Policy Screening", requirements: [
          { id: "v2.4.1", code: "2.4.1", title: "Use Content Classifier", description: "Verify that a content-classifier (zero-shot or fine-tuned) scores every input for violence, self-harm, hate, sexual content and illegal requests, with configurable thresholds.", level: 1, category: "v2", role: "D", references: [] },
          { id: "v2.4.2", code: "2.4.2", title: "Provide Safe Refusals", description: "Verify that policy-violating inputs receive standardized refusals or safe-completions and do not propagate to downstream LLM calls.", level: 1, category: "v2", role: "D/V", references: [] },
          { id: "v2.4.3", code: "2.4.3", title: "Update Screening Model Quarterly", description: "Verify that the screening model or rule-set is re-trained/updated at least quarterly, incorporating newly observed jailbreak or policy-bypass patterns.", level: 2, category: "v2", role: "D", references: [] },
          { id: "v2.4.4", code: "2.4.4", title: "Respect User-Specific Policies", description: "Verify that screening respects user-specific policies (age, regional legal constraints) via attribute-based rules resolved at request time.", level: 2, category: "v2", role: "D", references: [] },
          { id: "v2.4.5", code: "2.4.5", title: "Log Screening Results for SOC", description: "Verify that screening logs include classifier confidence scores and policy category tags for SOC correlation and future red-team replay.", level: 3, category: "v2", role: "V", references: [] },
      ]},
      { id: "v2.5", code: "C2.5", name: "Input Rate Limiting & Abuse Prevention", requirements: [
          { id: "v2.5.1", code: "2.5.1", title: "Enforce Rate Limits", description: "Verify that per-user, per-IP, and per-API-key rate limits are enforced for all input endpoints.", level: 1, category: "v2", role: "D/V", references: [] },
          { id: "v2.5.2", code: "2.5.2", title: "Tune Rate Limits", description: "Verify that burst and sustained rate limits are tuned to prevent DoS and brute-force attacks.", level: 2, category: "v2", role: "D/V", references: [] },
          { id: "v2.5.3", code: "2.5.3", title: "Detect Anomalous Usage", description: "Verify that anomalous usage patterns (e.g., rapid-fire requests, input flooding) trigger automated blocks or escalations.", level: 2, category: "v2", role: "D/V", references: [] },
          { id: "v2.5.4", code: "2.5.4", title: "Review Abuse Prevention Logs", description: "Verify that abuse prevention logs are retained and reviewed for emerging attack patterns.", level: 3, category: "v2", role: "V", references: [] },
      ]},
      { id: "v2.6", code: "C2.6", name: "Multi-Modal Input Validation", requirements: [
          { id: "v2.6.1", code: "2.6.1", title: "Validate Non-Text Inputs", description: "Verify that all non-text inputs (images, audio, files) are validated for type, size, and format before processing.", level: 1, category: "v2", role: "D", references: [] },
          { id: "v2.6.2", code: "2.6.2", title: "Scan Files for Malware", description: "Verify that files are scanned for malware and steganographic payloads before ingestion.", level: 2, category: "v2", role: "D/V", references: [] },
          { id: "v2.6.3", code: "2.6.3", title: "Check for Adversarial Perturbations", description: "Verify that image/audio inputs are checked for adversarial perturbations or known attack patterns.", level: 2, category: "v2", role: "D/V", references: [] },
          { id: "v2.6.4", code: "2.6.4", title: "Log Multi-Modal Validation Failures", description: "Verify that multi-modal input validation failures are logged and trigger alerts for investigation.", level: 3, category: "v2", role: "V", references: [] },
      ]},
      { id: "v2.7", code: "C2.7", name: "Input Provenance & Attribution", requirements: [
          { id: "v2.7.1", code: "2.7.1", title: "Tag Inputs with Metadata", description: "Verify that all user inputs are tagged with metadata (user ID, session, source, timestamp, IP address) at ingestion.", level: 1, category: "v2", role: "D/V", references: [] },
          { id: "v2.7.2", code: "2.7.2", title: "Retain and Audit Provenance Metadata", description: "Verify that provenance metadata is retained and auditable for all processed inputs.", level: 2, category: "v2", role: "D/V", references: [] },
          { id: "v2.7.3", code: "2.7.3", title: "Flag Untrusted Input Sources", description: "Verify that anomalous or untrusted input sources are flagged and subject to enhanced scrutiny or blocking.", level: 2, category: "v2", role: "D/V", references: [] },
      ]},
      { id: "v2.8", code: "C2.8", name: "Real-Time Adaptive Threat Detection", requirements: [
          { id: "v2.8.1", code: "2.8.1", title: "Compile Threat Detection Patterns", description: "Verify that threat detection patterns are compiled into optimized regex engines for high-performance real-time filtering with minimal latency impact.", level: 1, category: "v2", role: "D/V", references: [] },
          { id: "v2.8.2", code: "2.8.2", title: "Maintain Separate Pattern Libraries", description: "Verify that threat detection systems maintain separate pattern libraries for different threat categories (prompt injection, harmful content, sensitive data, system commands).", level: 1, category: "v2", role: "D/V", references: [] },
          { id: "v2.8.3", code: "2.8.3", title: "Incorporate Machine Learning Models", description: "Verify that adaptive threat detection incorporates machine learning models that update threat sensitivity based on attack frequency and success rates.", level: 2, category: "v2", role: "D/V", references: [] },
          { id: "v2.8.4", code: "2.8.4", title: "Use Real-Time Threat Intelligence Feeds", description: "Verify that real-time threat intelligence feeds automatically update pattern libraries with new attack signatures and IOCs (Indicators of Compromise).", level: 2, category: "v2", role: "D/V", references: [] },
          { id: "v2.8.5", code: "2.8.5", title: "Monitor False Positive Rates", description: "Verify that threat detection false positive rates are continuously monitored and pattern specificity is automatically tuned to minimize legitimate use case interference.", level: 3, category: "v2", role: "D/V", references: [] },
          { id: "v2.8.6", code: "2.8.6", title: "Use Contextual Threat Analysis", description: "Verify that contextual threat analysis considers input source, user behavior patterns, and session history to improve detection accuracy.", level: 3, category: "v2", role: "D/V", references: [] },
          { id: "v2.8.7", code: "2.8.7", title: "Monitor Threat Detection Performance", description: "Verify that threat detection performance metrics (detection rate, processing latency, resource utilization) are monitored and optimized in real-time.", level: 3, category: "v2", role: "D/V", references: [] },
      ]},
      { id: "v2.9", code: "C2.9", name: "Multi-Modal Security Validation Pipeline", requirements: [
          { id: "v2.9.1", code: "2.9.1", title: "Use Dedicated Security Validators", description: "Verify that each input modality has dedicated security validators with documented threat patterns (text: prompt injection, images: steganography, audio: spectrogram attacks) and detection thresholds.", level: 1, category: "v2", role: "D/V", references: [] },
          { id: "v2.9.2", code: "2.9.2", title: "Process Inputs in Isolated Sandboxes", description: "Verify that multi-modal inputs are processed in isolated sandboxes with defined resource limits (memory, CPU, processing time) specific to each modality type and documented in security policies.", level: 2, category: "v2", role: "D/V", references: [] },
          { id: "v2.9.3", code: "2.9.3", title: "Detect Cross-Modal Attacks", description: "Verify that cross-modal attack detection identifies coordinated attacks spanning multiple input types (e.g., steganographic payloads in images combined with prompt injection in text) with correlation rules and alert generation.", level: 2, category: "v2", role: "D/V", references: [] },
          { id: "v2.9.4", code: "2.9.4", title: "Log Multi-Modal Validation Failures", description: "Verify that multi-modal validation failures trigger detailed logging including all input modalities, validation results, threat scores, and correlation analysis with structured log formats for SIEM integration.", level: 3, category: "v2", role: "D/V", references: [] },
          { id: "v2.9.5", code: "2.9.5", title: "Update Content Classifiers Regularly", description: "Verify that modality-specific content classifiers are updated according to documented schedules (minimum quarterly) with new threat patterns, adversarial examples, and performance benchmarks maintained above baseline thresholds.", level: 3, category: "v2", role: "D/V", references: [] },
      ]},
    ],
    references: [
      { title: "LLM01:2025 Prompt Injection – OWASP Top 10 for LLM & Generative AI Security", url: "https://genai.owasp.org/llmrisk/llm01-prompt-injection/" },
      { title: "Generative AI's Biggest Security Flaw Is Not Easy to Fix", url: "https://www.wired.com/story/generative-ai-prompt-injection-hacking" },
      { title: "Many-shot jailbreaking \\ Anthropic", url: "https://www.anthropic.com/research/many-shot-jailbreaking" },
      { title: "$PDF$ OpenAI GPT-4.5 System Card", url: "https://cdn.openai.com/gpt-4-5-system-card-2272025.pdf" },
      { title: "Notebook for the CheckThat Lab at CLEF 2024", url: "https://ceur-ws.org/Vol-3740/paper-53.pdf" },
      { title: "Mitigate jailbreaks and prompt injections – Anthropic", url: "https://docs.anthropic.com/en/docs/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks" },
      { title: "Chapter 3 MITRE ATT&CK – Adversarial Model Analysis", url: "https://ama.drwhy.ai/mitre-attck.html" },
      { title: "OWASP Top 10 for LLM Applications 2025 – WorldTech IT", url: "https://wtit.com/blog/2025/04/17/owasp-top-10-for-llm-applications-2025/" },
      { title: "OWASP Machine Learning Security Top Ten", url: "https://owasp.org/www-project-machine-learning-security-top-10/" },
      { title: "Few words about AI Security – Jussi Metso", url: "https://www.jussimetso.com/index.php/2024/09/28/few-words-about-ai-security/" },
      { title: "How To Ensure LLM Output Adheres to a JSON Schema | Modelmetry", url: "https://modelmetry.com/blog/how-to-ensure-llm-output-adheres-to-a-json-schema" },
      { title: "Easily enforcing valid JSON schema following – API", url: "https://community.openai.com/t/feature-request-function-calling-easily-enforcing-valid-json-schema-following/263515?utm_source" },
      { title: "AI Safety + Cybersecurity R&D Tracker – Fairly AI", url: "https://www.fairly.ai/blog/ai-cybersecurity-tracker" },
      { title: "Anthropic makes 'jailbreak' advance to stop AI models producing harmful results", url: "https://www.ft.com/content/cf11ebd8-aa0b-4ed4-945b-a5d4401d186e" },
      { title: "Pattern matching filter rules - IBM", url: "https://www.ibm.com/docs/ssw_aix_71/security/intrusion_pattern_matching_filter_rules.html" },
      { title: "Real-time Threat Detection", url: "https://www.darktrace.com/cyber-ai-glossary/real-time-threat-detection" },
    ]
  },
  "v3": {
    id: "v3",
    code: "C3",
    name: "Model Lifecycle Management & Change Control",
    description: "AI systems must implement change control processes that prevent unauthorized or unsafe model modifications from reaching production. This control ensures model integrity through the entire lifecycle - from development through deployment to decommissioning - enabling rapid incident response and maintaining accountability for all changes.",
    color: "#f59e0b",
    icon: "git-pull-request",
    subCategories: [
      { id: "v3.1", code: "C3.1", name: "Model Authorization & Integrity", requirements: [
          { id: "v3.1.1", code: "3.1.1", title: "Cryptographically Sign Model Artifacts", description: "Verify that all model artifacts (weights, configurations, tokenizers) are cryptographically signed by authorized entities before deployment.", level: 1, category: "v3", role: "D/V", references: [] },
          { id: "v3.1.2", code: "3.1.2", title: "Validate Model Integrity at Deployment", description: "Verify that model integrity is validated at deployment time and signature verification failures prevent model loading.", level: 1, category: "v3", role: "D/V", references: [] },
          { id: "v3.1.3", code: "3.1.3", title: "Maintain Model Provenance Records", description: "Verify that model provenance records include authorizing entity identity, training data checksums, validation test results with pass/fail status, and creation timestamp.", level: 2, category: "v3", role: "D/V", references: [] },
          { id: "v3.1.4", code: "3.1.4", title: "Use Semantic Versioning for Models", description: "Verify that all model artifacts use semantic versioning (MAJOR.MINOR.PATCH) with documented criteria specifying when each version component increments.", level: 2, category: "v3", role: "D/V", references: [] },
          { id: "v3.1.5", code: "3.1.5", title: "Maintain Real-Time Dependency Inventory", description: "Verify that dependency tracking maintains a real-time inventory enabling rapid identification of all consuming systems.", level: 2, category: "v3", role: "V", references: [] },
      ]},
      { id: "v3.2", code: "C3.2", name: "Model Validation & Testing", requirements: [
          { id: "v3.2.1", code: "3.2.1", title: "Automate Security and Safety Testing", description: "Verify that models undergo automated security testing including input validation, output sanitization, and safety evaluations with pre-agreed organizational pass/fail thresholds before deployment.", level: 1, category: "v3", role: "D/V", references: [] },
          { id: "v3.2.2", code: "3.2.2", title: "Block Deployment on Validation Failures", description: "Verify that validation failures automatically block model deployment and require explicit override approval from pre-designated authorized personnel with documented business justification.", level: 1, category: "v3", role: "D/V", references: [] },
          { id: "v3.2.3", code: "3.2.3", title: "Sign and Link Test Results", description: "Verify that test results are cryptographically signed and immutably linked to the specific model version hash being validated.", level: 2, category: "v3", role: "V", references: [] },
          { id: "v3.2.4", code: "3.2.4", title: "Require Risk Assessment for Emergency Deployments", description: "Verify that emergency deployments require documented security risk assessment and approval from pre-designated security authority within pre-agreed timeframes.", level: 2, category: "v3", role: "D/V", references: [] },
      ]},
      { id: "v3.3", code: "C3.3", name: "Controlled Deployment & Rollback", requirements: [
          { id: "v3.3.1", code: "3.3.1", title: "Implement Gradual Rollout Mechanisms", description: "Verify that production deployments implement gradual rollout mechanisms (canary deployments, blue-green deployments) with automated rollback triggers based on pre-agreed error rates, latency thresholds, or security alert criteria.", level: 1, category: "v3", role: "D", references: [] },
          { id: "v3.3.2", code: "3.3.2", title: "Ensure Atomic Rollback Capabilities", description: "Verify that rollback capabilities restore the complete model state (weights, configurations, dependencies) atomically within pre-defined organizational time windows.", level: 1, category: "v3", role: "D/V", references: [] },
          { id: "v3.3.3", code: "3.3.3", title: "Validate Signatures and Checksums", description: "Verify that deployment processes validate cryptographic signatures and compute integrity checksums before model activation, failing deployment on any mismatch.", level: 2, category: "v3", role: "D/V", references: [] },
          { id: "v3.3.4", code: "3.3.4", title: "Implement Emergency Model Shutdown", description: "Verify that emergency model shutdown capabilities can disable model endpoints within pre-defined response times via automated circuit breakers or manual kill switches.", level: 2, category: "v3", role: "D/V", references: [] },
          { id: "v3.3.5", code: "3.3.5", title: "Retain Rollback Artifacts Securely", description: "Verify that rollback artifacts (previous model versions, configurations, dependencies) are retained according to organizational policies with immutable storage for incident response.", level: 2, category: "v3", role: "V", references: [] },
      ]},
      { id: "v3.4", code: "C3.4", name: "Change Accountability & Audit", requirements: [
          { id: "v3.4.1", code: "3.4.1", title: "Generate Immutable Audit Records", description: "Verify that all model changes (deployment, configuration, retirement) generate immutable audit records including timestamp, authenticated actor identity, change type, and before/after states.", level: 1, category: "v3", role: "V", references: [] },
          { id: "v3.4.2", code: "3.4.2", title: "Control Access to Audit Logs", description: "Verify that audit log access requires appropriate authorization and all access attempts are logged with user identity and timestamp.", level: 2, category: "v3", role: "D/V", references: [] },
          { id: "v3.4.3", code: "3.4.3", title: "Version Control Prompt Templates", description: "Verify that prompt templates and system messages are version-controlled in git repositories with mandatory code review and approval from designated reviewers before deployment.", level: 2, category: "v3", role: "D/V", references: [] },
          { id: "v3.4.4", code: "3.4.4", title: "Ensure Audit Record Detail", description: "Verify that audit records include sufficient detail (model hashes, configuration snapshots, dependency versions) to enable complete reconstruction of model state for any timestamp within retention period.", level: 2, category: "v3", role: "V", references: [] },
      ]},
      { id: "v3.5", code: "C3.5", name: "Secure Development Practices", requirements: [
          { id: "v3.5.1", code: "3.5.1", title: "Separate Development Environments", description: "Verify that model development, testing, and production environments are physically or logically separated with no shared infrastructure, distinct access controls, and isolated data stores.", level: 1, category: "v3", role: "D", references: [] },
          { id: "v3.5.2", code: "3.5.2", title: "Isolate Model Training Environments", description: "Verify that model training and fine-tuning occur in isolated environments with controlled network access.", level: 1, category: "v3", role: "D", references: [] },
          { id: "v3.5.3", code: "3.5.3", title: "Validate Training Data Sources", description: "Verify that training data sources are validated through integrity checks and authenticated via trusted sources with documented chain of custody before use in model development.", level: 1, category: "v3", role: "D/V", references: [] },
          { id: "v3.5.4", code: "3.5.4", title: "Version Control Development Artifacts", description: "Verify that model development artifacts (hyperparameters, training scripts, configuration files) are stored in version control and require peer review approval before use in training.", level: 2, category: "v3", role: "D", references: [] },
      ]},
      { id: "v3.6", code: "C3.6", name: "Model Retirement & Decommissioning", requirements: [
          { id: "v3.6.1", code: "3.6.1", title: "Automate Retirement Notice", description: "Verify that model retirement processes automatically scan dependency graphs, identify all consuming systems, and provide pre-agreed advance notice periods before decommissioning.", level: 1, category: "v3", role: "D", references: [] },
          { id: "v3.6.2", code: "3.6.2", title: "Securely Wipe Retired Artifacts", description: "Verify that retired model artifacts are securely wiped using cryptographic erasure or multi-pass overwriting according to documented data retention policies with verified destruction certificates.", level: 1, category: "v3", role: "D/V", references: [] },
          { id: "v3.6.3", code: "3.6.3", title: "Log Retirement and Revoke Signatures", description: "Verify that model retirement events are logged with timestamp and actor identity, and model signatures are revoked to prevent reuse.", level: 2, category: "v3", role: "V", references: [] },
          { id: "v3.6.4", code: "3.6.4", title: "Implement Emergency Model Retirement", description: "Verify that emergency model retirement can disable model access within pre-established emergency response timeframes through automated kill switches when critical security vulnerabilities are discovered.", level: 2, category: "v3", role: "D/V", references: [] },
      ]},
    ],
    references: [
      { title: "MLOps Principles", url: "https://ml-ops.org/content/mlops-principles" },
      { title: "Securing AI/ML Ops – Cisco.com", url: "https://sec.cloudapps.cisco.com/security/center/resources/SecuringAIMLOps" },
      { title: "Audit logs security: cryptographically signed tamper-proof logs", url: "https://www.cossacklabs.com/blog/audit-logs-security/" },
      { title: "Machine Learning Model Versioning: Top Tools & Best Practices", url: "https://lakefs.io/blog/model-versioning/" },
      { title: "AI Hygiene Starts with Models and Data Loaders – SEI Blog", url: "https://insights.sei.cmu.edu/documents/6190/AI-Hygiene-Starts-with-Models-and-Data-Loaders_1G0KTRh.pdf" },
      { title: "How to handle versioning and rollback of a deployed ML model?", url: "https://learn.microsoft.com/en-au/answers/questions/1845378/how-to-handle-versioning-and-rollback-of-a-deploye" },
      { title: "Reinforcement fine-tuning – OpenAI API", url: "https://platform.openai.com/docs/guides/reinforcement-fine-tuning" },
      { title: "Auditing Machine Learning models: Governance, Data Security and …", url: "https://www.linkedin.com/pulse/auditing-machine-learning-models-governance-data-security-negrete-yn81f" },
      { title: "Adversarial Training to Improve Model Robustness", url: "https://medium.com/%40amit25173/adversarial-training-to-improve-model-robustness-5e285b516713" },
      { title: "What is AI adversarial robustness? – IBM Research", url: "https://research.ibm.com/blog/securing-ai-workflows-with-adversarial-robustness" },
      { title: "Exploring Data Provenance: Ensuring Data Integrity and Authenticity", url: "https://www.astera.com/type/blog/data-provenance/" },
      { title: "MITRE ATLAS", url: "https://atlas.mitre.org/" },
      { title: "AWS Prescriptive Guidance – Best practices for retiring applications …", url: "https://docs.aws.amazon.com/pdfs/prescriptive-guidance/latest/migration-app-retirement-best-practices/migration-app-retirement-best-practices.pdf" },
    ]
  },
  "v4": {
    id: "v4",
    code: "C4",
    name: "Infrastructure, Configuration & Deployment Security",
    description: "AI infrastructure must be hardened against privilege escalation, supply chain tampering, and lateral movement through secure configuration, runtime isolation, trusted deployment pipelines, and comprehensive monitoring. Only authorized, validated infrastructure components and configurations reach production through controlled processes that maintain security, integrity, and auditability.",
    color: "#ef4444",
    icon: "server",
    subCategories: [
      { id: "v4.1", code: "C4.1", name: "Runtime Environment Isolation", requirements: [
          { id: "v4.1.1", code: "4.1.1", title: "Drop Linux Capabilities", description: "Verify that all AI containers drop ALL Linux capabilities except CAP_SETUID, CAP_SETGID, and explicitly required capabilities documented in security baselines.", level: 1, category: "v4", role: "D/V", references: [] },
          { id: "v4.1.2", code: "4.1.2", title: "Use Seccomp Profiles", description: "Verify that seccomp profiles block all syscalls except those in pre-approved allowlists, with violations terminating the container and generating security alerts.", level: 1, category: "v4", role: "D/V", references: [] },
          { id: "v4.1.3", code: "4.1.3", title: "Use Read-Only Root Filesystems", description: "Verify that AI workloads run with read-only root filesystems, tmpfs for temporary data, and named volumes for persistent data with noexec mount options enforced.", level: 2, category: "v4", role: "D/V", references: [] },
          { id: "v4.1.4", code: "4.1.4", title: "Use eBPF-based Runtime Monitoring", description: "Verify that eBPF-based runtime monitoring (Falco, Tetragon, or equivalent) detects privilege escalation attempts and automatically kills offending processes within organizational response time requirements.", level: 2, category: "v4", role: "D/V", references: [] },
          { id: "v4.1.5", code: "4.1.5", title: "Use Hardware-Isolated Environments", description: "Verify that high-risk AI workloads execute in hardware-isolated environments (Intel TXT, AMD SVM, or dedicated bare-metal nodes) with attestation verification.", level: 3, category: "v4", role: "D/V", references: [] },
      ]},
      { id: "v4.2", code: "C4.2", name: "Secure Build & Deployment Pipelines", requirements: [
          { id: "v4.2.1", code: "4.2.1", title: "Scan Infrastructure-as-Code", description: "Verify that infrastructure-as-code is scanned with tools (tfsec, Checkov, or Terrascan) on every commit, blocking merges with CRITICAL or HIGH severity findings.", level: 1, category: "v4", role: "D/V", references: [] },
          { id: "v4.2.2", code: "4.2.2", title: "Ensure Reproducible Builds", description: "Verify that container builds are reproducible with identical SHA256 hashes across builds and generate SLSA Level 3 provenance attestations signed with Sigstore.", level: 1, category: "v4", role: "D/V", references: [] },
          { id: "v4.2.3", code: "4.2.3", title: "Embed and Sign SBOMs", description: "Verify that container images embed CycloneDX or SPDX SBOMs and are signed with Cosign before registry push, with unsigned images rejected at deployment.", level: 2, category: "v4", role: "D/V", references: [] },
          { id: "v4.2.4", code: "4.2.4", title: "Use Short-Lived CI/CD Tokens", description: "Verify that CI/CD pipelines use OIDC tokens with lifetimes not exceeding organizational security policy limits from HashiCorp Vault, AWS IAM Roles, or Azure Managed Identity.", level: 2, category: "v4", role: "D/V", references: [] },
          { id: "v4.2.5", code: "4.2.5", title: "Validate Signatures at Deployment", description: "Verify that deployment processes validate Cosign signatures and SLSA provenance before container execution, failing deployment on verification errors.", level: 2, category: "v4", role: "D/V", references: [] },
          { id: "v4.2.6", code: "4.2.6", title: "Use Ephemeral Build Environments", description: "Verify that build environments run in ephemeral containers or VMs with no persistent storage and network isolation from production VPCs.", level: 2, category: "v4", role: "D/V", references: [] },
      ]},
      { id: "v4.3", code: "C4.3", name: "Network Security & Access Control", requirements: [
          { id: "v4.3.1", code: "4.3.1", title: "Implement Default-Deny Network Policies", description: "Verify that Kubernetes NetworkPolicies or equivalent implement default-deny ingress/egress with explicit allow rules for required ports (443, 8080, etc.).", level: 1, category: "v4", role: "D/V", references: [] },
          { id: "v4.3.2", code: "4.3.2", title: "Block or Secure Management Ports", description: "Verify that SSH (port 22), RDP (port 3389), and cloud metadata endpoints (169.254.169.254) are blocked or require certificate-based authentication.", level: 1, category: "v4", role: "D/V", references: [] },
          { id: "v4.3.3", code: "4.3.3", title: "Filter Egress Traffic", description: "Verify that egress traffic is filtered through HTTP/HTTPS proxies (Squid, Istio, or cloud NAT gateways) with domain allowlists and blocked requests logged.", level: 2, category: "v4", role: "D/V", references: [] },
          { id: "v4.3.4", code: "4.3.4", title: "Use Mutual TLS for Inter-Service Communication", description: "Verify that inter-service communication uses mutual TLS with certificates rotated according to organizational policy and certificate validation enforced (no skip-verify flags).", level: 2, category: "v4", role: "D/V", references: [] },
          { id: "v4.3.5", code: "4.3.5", title: "Run AI Infrastructure in Dedicated VPCs", description: "Verify that AI infrastructure runs in dedicated VPCs/VNets with no direct internet access and communication through NAT gateways or bastion hosts only.", level: 2, category: "v4", role: "D/V", references: [] },
      ]},
      { id: "v4.4", code: "C4.4", name: "Secrets & Cryptographic Key Management", requirements: [
          { id: "v4.4.1", code: "4.4.1", title: "Use Secure Secret Storage", description: "Verify that secrets are stored in HashiCorp Vault, AWS Secrets Manager, Azure Key Vault, or Google Secret Manager with encryption at rest using AES-256.", level: 1, category: "v4", role: "D/V", references: [] },
          { id: "v4.4.2", code: "4.4.2", title: "Use FIPS 140-2 Level 2 HSMs", description: "Verify that cryptographic keys are generated in FIPS 140-2 Level 2 HSMs (AWS CloudHSM, Azure Dedicated HSM) with key rotation according to organizational cryptographic policy.", level: 1, category: "v4", role: "D/V", references: [] },
          { id: "v4.4.3", code: "4.4.3", title: "Automate Secrets Rotation", description: "Verify that secrets rotation is automated with zero-downtime deployment and immediate rotation triggered by personnel changes or security incidents.", level: 2, category: "v4", role: "D/V", references: [] },
          { id: "v4.4.4", code: "4.4.4", title: "Scan Container Images for Secrets", description: "Verify that container images are scanned with tools (GitLeaks, TruffleHog, or detect-secrets) blocking builds containing API keys, passwords, or certificates.", level: 2, category: "v4", role: "D/V", references: [] },
          { id: "v4.4.5", code: "4.4.5", title: "Require MFA for Production Secret Access", description: "Verify that production secret access requires MFA with hardware tokens (YubiKey, FIDO2) and generates immutable audit logs with user identity and timestamp.", level: 2, category: "v4", role: "D/V", references: [] },
          { id: "v4.4.6", code: "4.4.6", title: "Inject Secrets Securely", description: "Verify that secrets are injected via Kubernetes secrets, mounted volumes, or init containers with secrets never embedded in environment variables or images.", level: 2, category: "v4", role: "D/V", references: [] },
      ]},
      { id: "v4.5", code: "C4.5", name: "AI Workload Sandboxing & Validation", requirements: [
          { id: "v4.5.1", code: "4.5.1", title: "Execute External Models in Sandboxes", description: "Verify that external AI models execute in gVisor, microVMs (such as Firecracker, CrossVM), or Docker containers with --security-opt=no-new-privileges and --read-only flags.", level: 1, category: "v4", role: "D/V", references: [] },
          { id: "v4.5.2", code: "4.5.2", title: "Isolate Sandbox Network", description: "Verify that sandbox environments have no network connectivity (--network=none) or only localhost access with all external requests blocked by iptables rules.", level: 1, category: "v4", role: "D/V", references: [] },
          { id: "v4.5.3", code: "4.5.3", title: "Include Automated Red-Team Testing", description: "Verify that AI model validation includes automated red-team testing with organizationally defined test coverage and behavioral analysis for backdoor detection.", level: 2, category: "v4", role: "D/V", references: [] },
          { id: "v4.5.4", code: "4.5.4", title: "Sign and Log Sandbox Results", description: "Verify that sandbox results are cryptographically signed by authorized security personnel and stored in immutable audit logs before production promotion.", level: 2, category: "v4", role: "D/V", references: [] },
          { id: "v4.5.5", code: "4.5.5", title: "Use Ephemeral Sandboxes", description: "Verify that sandbox environments are destroyed and recreated from golden images between evaluations with complete filesystem and memory cleanup.", level: 2, category: "v4", role: "D/V", references: [] },
      ]},
      { id: "v4.6", code: "C4.6", name: "Infrastructure Security Monitoring", requirements: [
          { id: "v4.6.1", code: "4.6.1", title: "Scan Container Images Regularly", description: "Verify that container images are scanned according to organizational schedules with CRITICAL vulnerabilities blocking deployment based on organizational risk thresholds.", level: 1, category: "v4", role: "D/V", references: [] },
          { id: "v4.6.2", code: "4.6.2", title: "Ensure CIS or NIST Compliance", description: "Verify that infrastructure passes CIS Benchmarks or NIST 800-53 controls with organizationally defined compliance thresholds and automated remediation for failed checks.", level: 1, category: "v4", role: "D/V", references: [] },
          { id: "v4.6.3", code: "4.6.3", title: "Patch Vulnerabilities Promptly", description: "Verify that HIGH severity vulnerabilities are patched according to organizational risk management timelines with emergency procedures for actively exploited CVEs.", level: 2, category: "v4", role: "D/V", references: [] },
          { id: "v4.6.4", code: "4.6.4", title: "Integrate Alerts with SIEM", description: "Verify that security alerts integrate with SIEM platforms (Splunk, Elastic, or Sentinel) using CEF or STIX/TAXII formats with automated enrichment.", level: 2, category: "v4", role: "V", references: [] },
          { id: "v4.6.5", code: "4.6.5", title: "Export Metrics for Monitoring", description: "Verify that infrastructure metrics are exported to monitoring systems (Prometheus, DataDog) with SLA dashboards and executive reporting.", level: 3, category: "v4", role: "V", references: [] },
          { id: "v4.6.6", code: "4.6.6", title: "Detect Configuration Drift", description: "Verify that configuration drift is detected according to organizational monitoring requirements using tools (Chef InSpec, AWS Config) with automatic rollback for unauthorized changes.", level: 2, category: "v4", role: "D/V", references: [] },
      ]},
      { id: "v4.7", code: "C4.7", name: "AI Infrastructure Resource Management", requirements: [
          { id: "v4.7.1", code: "4.7.1", title: "Monitor GPU/TPU Utilization", description: "Verify that GPU/TPU utilization is monitored with alerts triggered at organizationally defined thresholds and automatic scaling or load balancing activated based on capacity management policies.", level: 1, category: "v4", role: "D/V", references: [] },
          { id: "v4.7.2", code: "4.7.2", title: "Collect AI Workload Metrics", description: "Verify that AI workload metrics (inference latency, throughput, error rates) are collected according to organizational monitoring requirements and correlated with infrastructure utilization.", level: 1, category: "v4", role: "D/V", references: [] },
          { id: "v4.7.3", code: "4.7.3", title: "Use Kubernetes ResourceQuotas", description: "Verify that Kubernetes ResourceQuotas or equivalent limit individual workloads according to organizational resource allocation policies with hard limits enforced.", level: 2, category: "v4", role: "D/V", references: [] },
          { id: "v4.7.4", code: "4.7.4", title: "Monitor Costs", description: "Verify that cost monitoring tracks spending per workload/tenant with alerts based on organizational budget thresholds and automated controls for budget overruns.", level: 2, category: "v4", role: "V", references: [] },
          { id: "v4.7.5", code: "4.7.5", title: "Plan Capacity", description: "Verify that capacity planning uses historical data with organizationally defined forecasting periods and automated resource provisioning based on demand patterns.", level: 3, category: "v4", role: "V", references: [] },
          { id: "v4.7.6", code: "4.7.6", title: "Trigger Circuit Breakers", description: "Verify that resource exhaustion triggers circuit breakers according to organizational response requirements, rate limiting based on capacity policies, and workload isolation.", level: 2, category: "v4", role: "D/V", references: [] },
      ]},
      { id: "v4.8", code: "C4.8", name: "Environment Separation & Promotion Controls", requirements: [
          { id: "v4.8.1", code: "4.8.1", title: "Separate Dev/Test/Prod Environments", description: "Verify that dev/test/prod environments run in separate VPCs/VNets with no shared IAM roles, security groups, or network connectivity.", level: 1, category: "v4", role: "D/V", references: [] },
          { id: "v4.8.2", code: "4.8.2", title: "Require Approval for Promotion", description: "Verify that environment promotion requires approval from organizationally defined authorized personnel with cryptographic signatures and immutable audit trails.", level: 1, category: "v4", role: "D/V", references: [] },
          { id: "v4.8.3", code: "4.8.3", title: "Secure Production Environments", description: "Verify that production environments block SSH access, disable debug endpoints, and require change requests with organizational advance notice requirements except emergencies.", level: 2, category: "v4", role: "D/V", references: [] },
          { id: "v4.8.4", code: "4.8.4", title: "Require Peer Review for IaC", description: "Verify that infrastructure-as-code changes require peer review with automated testing and security scanning before merge to main branch.", level: 2, category: "v4", role: "D/V", references: [] },
          { id: "v4.8.5", code: "4.8.5", title: "Anonymize Non-Production Data", description: "Verify that non-production data is anonymized according to organizational privacy requirements, synthetic data generation, or complete data masking with PII removal verified.", level: 2, category: "v4", role: "D/V", references: [] },
          { id: "v4.8.6", code: "4.8.6", title: "Include Automated Security Tests in Promotion Gates", description: "Verify that promotion gates include automated security tests (SAST, DAST, container scanning) with zero CRITICAL findings required for approval.", level: 2, category: "v4", role: "D/V", references: [] },
      ]},
      { id: "v4.9", code: "C4.9", name: "Infrastructure Backup & Recovery", requirements: [
          { id: "v4.9.1", code: "4.9.1", title: "Backup Infrastructure Configurations", description: "Verify that infrastructure configurations are backed up according to organizational backup schedules to geographically separate regions with 3-2-1 backup strategy implementation.", level: 1, category: "v4", role: "D/V", references: [] },
          { id: "v4.9.2", code: "4.9.2", title: "Isolate Backup Systems", description: "Verify that backup systems run in isolated networks with separate credentials and air-gapped storage for ransomware protection.", level: 2, category: "v4", role: "D/V", references: [] },
          { id: "v4.9.3", code: "4.9.3", title: "Test Recovery Procedures", description: "Verify that recovery procedures are tested according to organizational schedules with RTO and RPO targets meeting organizational requirements validated through automated testing.", level: 2, category: "v4", role: "V", references: [] },
          { id: "v4.9.4", code: "4.9.4", title: "Include AI-Specific Runbooks in Disaster Recovery", description: "Verify that disaster recovery includes AI-specific runbooks with model weight restoration, GPU cluster rebuilding, and service dependency mapping.", level: 3, category: "v4", role: "V", references: [] },
      ]},
      { id: "v4.10", code: "C4.10", name: "Infrastructure Compliance & Governance", requirements: [
          { id: "v4.10.1", code: "4.10.1", title: "Assess Infrastructure Compliance", description: "Verify that infrastructure compliance is assessed according to organizational schedules against SOC 2, ISO 27001, or FedRAMP controls with automated evidence collection.", level: 2, category: "v4", role: "D/V", references: [] },
          { id: "v4.10.2", code: "4.10.2", title: "Maintain Infrastructure Documentation", description: "Verify that infrastructure documentation includes network diagrams, data flow maps, and threat models updated according to organizational change management requirements.", level: 2, category: "v4", role: "V", references: [] },
          { id: "v4.10.3", code: "4.10.3", title: "Assess Compliance Impact of Changes", description: "Verify that infrastructure changes undergo automated compliance impact assessment with regulatory approval workflows for high-risk modifications.", level: 3, category: "v4", role: "D/V", references: [] },
      ]},
      { id: "v4.11", code: "C4.11", name: "AI Hardware Security", requirements: [
          { id: "v4.11.1", code: "4.11.1", title: "Verify and Update AI Accelerator Firmware", description: "Verify that AI accelerator firmware (GPU BIOS, TPU firmware) is verified with cryptographic signatures and updated according to organizational patch management timelines.", level: 2, category: "v4", role: "D/V", references: [] },
          { id: "v4.11.2", code: "4.11.2", title: "Use Hardware Attestation", description: "Verify that hardware attestation validates AI accelerator integrity using TPM 2.0, Intel TXT, or AMD SVM before workload execution.", level: 2, category: "v4", role: "D/V", references: [] },
          { id: "v4.11.3", code: "4.11.3", title: "Isolate GPU Memory", description: "Verify that GPU memory is isolated between workloads using SR-IOV, MIG (Multi-Instance GPU), or equivalent hardware partitioning with memory sanitization between jobs.", level: 2, category: "v4", role: "D/V", references: [] },
          { id: "v4.11.4", code: "4.11.4", title: "Verify AI Hardware Supply Chain", description: "Verify that AI hardware supply chain includes provenance verification with manufacturer certificates and tamper-evident packaging validation.", level: 3, category: "v4", role: "V", references: [] },
          { id: "v4.11.5", code: "4.11.5", title: "Use HSMs to Protect Model Weights and Keys", description: "Verify that hardware security modules (HSMs) protect AI model weights and cryptographic keys with FIPS 140-2 Level 3 or Common Criteria EAL4+ certification.", level: 3, category: "v4", role: "D/V", references: [] },
      ]},
      { id: "v4.12", code: "C4.12", name: "Edge & Distributed AI Infrastructure", requirements: [
          { id: "v4.12.1", code: "4.12.1", title: "Authenticate Edge Devices", description: "Verify that edge AI devices authenticate to central infrastructure using mutual TLS with device certificates rotated according to organizational certificate management policy.", level: 2, category: "v4", role: "D/V", references: [] },
          { id: "v4.12.2", code: "4.12.2", title: "Implement Secure Boot", description: "Verify that edge devices implement secure boot with verified signatures and rollback protection preventing firmware downgrade attacks.", level: 2, category: "v4", role: "D/V", references: [] },
          { id: "v4.12.3", code: "4.12.3", title: "Use Byzantine Fault-Tolerant Consensus", description: "Verify that distributed AI coordination uses Byzantine fault-tolerant consensus algorithms with participant validation and malicious node detection.", level: 3, category: "v4", role: "D/V", references: [] },
          { id: "v4.12.4", code: "4.12.4", title: "Secure Edge-to-Cloud Communication", description: "Verify that edge-to-cloud communication includes bandwidth throttling, data compression, and offline operation capabilities with secure local storage.", level: 3, category: "v4", role: "D/V", references: [] },
      ]},
      { id: "v4.13", code: "C4.13", name: "Multi-Cloud & Hybrid Infrastructure Security", requirements: [
          { id: "v4.13.1", code: "4.13.1", title: "Use Cloud-Agnostic Identity Federation", description: "Verify that multi-cloud AI deployments use cloud-agnostic identity federation (OIDC, SAML) with centralized policy management across providers.", level: 2, category: "v4", role: "D/V", references: [] },
          { id: "v4.13.2", code: "4.13.2", title: "Encrypt Cross-Cloud Data Transfer", description: "Verify that cross-cloud data transfer uses end-to-end encryption with customer-managed keys and data residency controls enforced per jurisdiction.", level: 2, category: "v4", role: "D/V", references: [] },
          { id: "v4.13.3", code: "4.13.3", title: "Implement Consistent Security Policies", description: "Verify that hybrid cloud AI workloads implement consistent security policies across on-premises and cloud environments with unified monitoring and alerting.", level: 2, category: "v4", role: "D/V", references: [] },
          { id: "v4.13.4", code: "4.13.4", title: "Prevent Cloud Vendor Lock-In", description: "Verify that cloud vendor lock-in prevention includes portable infrastructure-as-code, standardized APIs, and data export capabilities with format conversion tools.", level: 3, category: "v4", role: "V", references: [] },
          { id: "v4.13.5", code: "4.13.5", title: "Optimize Multi-Cloud Costs Securely", description: "Verify that multi-cloud cost optimization includes security controls preventing resource sprawl and unauthorized cross-cloud data transfer charges.", level: 3, category: "v4", role: "V", references: [] },
      ]},
      { id: "v4.14", code: "C4.14", name: "Infrastructure Automation & GitOps Security", requirements: [
          { id: "v4.14.1", code: "4.14.1", title: "Secure GitOps Repositories", description: "Verify that GitOps repositories require signed commits with GPG keys and branch protection rules preventing direct pushes to main branches.", level: 2, category: "v4", role: "D/V", references: [] },
          { id: "v4.14.2", code: "4.14.2", title: "Detect and Remediate Drift", description: "Verify that infrastructure automation includes drift detection with automatic remediation and rollback capabilities triggered according to organizational response requirements for unauthorized changes.", level: 2, category: "v4", role: "D/V", references: [] },
          { id: "v4.14.3", code: "4.14.3", title: "Validate Security Policies in Automation", description: "Verify that automated infrastructure provisioning includes security policy validation with deployment blocking for non-compliant configurations.", level: 2, category: "v4", role: "D/V", references: [] },
          { id: "v4.14.4", code: "4.14.4", title: "Manage Automation Secrets Securely", description: "Verify that infrastructure automation secrets are managed through external secret operators (External Secrets Operator, Bank-Vaults) with automatic rotation.", level: 2, category: "v4", role: "D/V", references: [] },
          { id: "v4.14.5", code: "4.14.5", title: "Implement Self-Healing Infrastructure", description: "Verify that self-healing infrastructure includes security event correlation with automated incident response and stakeholder notification workflows.", level: 3, category: "v4", role: "V", references: [] },
      ]},
      { id: "v4.15", code: "C4.15", name: "Quantum-Resistant Infrastructure Security", requirements: [
          { id: "v4.15.1", code: "4.15.1", title: "Implement Post-Quantum Cryptography", description: "Verify that AI infrastructure implements NIST-approved post-quantum cryptographic algorithms (CRYSTALS-Kyber, CRYSTALS-Dilithium, SPHINCS+) for key exchange and digital signatures.", level: 3, category: "v4", role: "D/V", references: [] },
          { id: "v4.15.2", code: "4.15.2", title: "Implement Quantum Key Distribution", description: "Verify that quantum key distribution (QKD) systems are implemented for high-security AI communications with quantum-safe key management protocols.", level: 3, category: "v4", role: "D/V", references: [] },
          { id: "v4.15.3", code: "4.15.3", title: "Use Cryptographic Agility Frameworks", description: "Verify that cryptographic agility frameworks enable rapid migration to new post-quantum algorithms with automated certificate and key rotation.", level: 3, category: "v4", role: "D/V", references: [] },
          { id: "v4.15.4", code: "4.15.4", title: "Conduct Quantum Threat Modeling", description: "Verify that quantum threat modeling assesses AI infrastructure vulnerability to quantum attacks with documented migration timelines and risk assessments.", level: 3, category: "v4", role: "V", references: [] },
          { id: "v4.15.5", code: "4.15.5", title: "Use Hybrid Classical-Quantum Cryptography", description: "Verify that hybrid classical-quantum cryptographic systems provide defense-in-depth during the quantum transition period with performance monitoring.", level: 3, category: "v4", role: "D/V", references: [] },
      ]},
      { id: "v4.16", code: "C4.16", name: "Confidential Computing & Secure Enclaves", requirements: [
          { id: "v4.16.1", code: "4.16.1", title: "Execute Models in Secure Enclaves", description: "Verify that sensitive AI models execute within Intel SGX enclaves, AMD SEV-SNP, or ARM TrustZone with encrypted memory and attestation verification.", level: 3, category: "v4", role: "D/V", references: [] },
          { id: "v4.16.2", code: "4.16.2", title: "Use Confidential Containers", description: "Verify that confidential containers (Kata Containers, gVisor with confidential computing) isolate AI workloads with hardware-enforced memory encryption.", level: 3, category: "v4", role: "D/V", references: [] },
          { id: "v4.16.3", code: "4.16.3", title: "Use Remote Attestation", description: "Verify that remote attestation validates enclave integrity before loading AI models with cryptographic proof of execution environment authenticity.", level: 3, category: "v4", role: "D/V", references: [] },
          { id: "v4.16.4", code: "4.16.4", title: "Prevent Model Extraction with Confidential Inference", description: "Verify that confidential AI inference services prevent model extraction through encrypted computation with sealed model weights and protected execution.", level: 3, category: "v4", role: "D/V", references: [] },
          { id: "v4.16.5", code: "4.16.5", title: "Manage Secure Enclave Lifecycle", description: "Verify that trusted execution environment orchestration manages secure enclave lifecycle with remote attestation and encrypted communication channels.", level: 3, category: "v4", role: "D/V", references: [] },
          { id: "v4.16.6", code: "4.16.6", title: "Use Secure Multi-Party Computation", description: "Verify that secure multi-party computation (SMPC) enables collaborative AI training without exposing individual datasets or model parameters.", level: 3, category: "v4", role: "D/V", references: [] },
      ]},
      { id: "v4.17", code: "C4.17", name: "Zero-Knowledge Infrastructure", requirements: [
          { id: "v4.17.1", code: "4.17.1", title: "Use Zero-Knowledge Proofs for Verification", description: "Verify that zero-knowledge proofs (ZK-SNARKs, ZK-STARKs) verify AI model integrity and training provenance without exposing model weights or training data.", level: 3, category: "v4", role: "D/V", references: [] },
          { id: "v4.17.2", code: "4.17.2", title: "Use ZK-Based Authentication", description: "Verify that ZK-based authentication systems enable privacy-preserving user verification for AI services without revealing identity information.", level: 3, category: "v4", role: "D/V", references: [] },
          { id: "v4.17.3", code: "4.17.3", title: "Use Private Set Intersection", description: "Verify that private set intersection (PSI) protocols enable secure data matching for federated AI without exposing individual datasets.", level: 3, category: "v4", role: "D/V", references: [] },
          { id: "v4.17.4", code: "4.17.4", title: "Use Zero-Knowledge Machine Learning", description: "Verify that zero-knowledge machine learning (ZKML) systems enable verifiable AI inference with cryptographic proof of correct computation.", level: 3, category: "v4", role: "D/V", references: [] },
          { id: "v4.17.5", code: "4.17.5", title: "Use ZK-Rollups", description: "Verify that ZK-rollups provide scalable, privacy-preserving AI transaction processing with batch verification and reduced computational overhead.", level: 3, category: "v4", role: "D/V", references: [] },
      ]},
      { id: "v4.18", code: "C4.18", name: "Side-Channel Attack Prevention", requirements: [
          { id: "v4.18.1", code: "4.18.1", title: "Normalize Inference Timing", description: "Verify that AI inference timing is normalized using constant-time algorithms and padding to prevent timing-based model extraction attacks.", level: 3, category: "v4", role: "D/V", references: [] },
          { id: "v4.18.2", code: "4.18.2", title: "Protect Against Power Analysis", description: "Verify that power analysis protection includes noise injection, power line filtering, and randomized execution patterns for AI hardware.", level: 3, category: "v4", role: "D/V", references: [] },
          { id: "v4.18.3", code: "4.18.3", title: "Mitigate Cache-Based Side-Channels", description: "Verify that cache-based side-channel mitigation uses cache partitioning, randomization, and flush instructions to prevent information leakage.", level: 3, category: "v4", role: "D/V", references: [] },
          { id: "v4.18.4", code: "4.18.4", title: "Protect Against Electromagnetic Emanation", description: "Verify that electromagnetic emanation protection includes shielding, signal filtering, and randomized processing to prevent TEMPEST-style attacks.", level: 3, category: "v4", role: "D/V", references: [] },
          { id: "v4.18.5", code: "4.18.5", title: "Implement Microarchitectural Side-Channel Defenses", description: "Verify that microarchitectural side-channel defenses include speculative execution controls and memory access pattern obfuscation.", level: 3, category: "v4", role: "D/V", references: [] },
      ]},
      { id: "v4.19", code: "C4.19", name: "Neuromorphic & Specialized AI Hardware Security", requirements: [
          { id: "v4.19.1", code: "4.19.1", title: "Secure Neuromorphic Chips", description: "Verify that neuromorphic chip security includes spike pattern encryption, synaptic weight protection, and hardware-based learning rule validation.", level: 3, category: "v4", role: "D/V", references: [] },
          { id: "v4.19.2", code: "4.19.2", title: "Secure FPGA-Based AI Accelerators", description: "Verify that FPGA-based AI accelerators implement bitstream encryption, anti-tamper mechanisms, and secure configuration loading with authenticated updates.", level: 3, category: "v4", role: "D/V", references: [] },
          { id: "v4.19.3", code: "4.19.3", title: "Secure Custom ASICs", description: "Verify that custom ASIC security includes on-chip security processors, hardware root of trust, and secure key storage with tamper detection.", level: 3, category: "v4", role: "D/V", references: [] },
          { id: "v4.19.4", code: "4.19.4", title: "Secure Optical Computing Systems", description: "Verify that optical computing systems implement quantum-safe optical encryption, secure photonic switching, and protected optical signal processing.", level: 3, category: "v4", role: "D/V", references: [] },
          { id: "v4.19.5", code: "4.19.5", title: "Secure Hybrid Analog-Digital AI Chips", description: "Verify that hybrid analog-digital AI chips include secure analog computation, protected weight storage, and authenticated analog-to-digital conversion.", level: 3, category: "v4", role: "D/V", references: [] },
      ]},
      { id: "v4.20", code: "C4.20", name: "Privacy-Preserving Compute Infrastructure", requirements: [
          { id: "v4.20.1", code: "4.20.1", title: "Use Homomorphic Encryption", description: "Verify that homomorphic encryption infrastructure enables encrypted computation on sensitive AI workloads with cryptographic integrity verification and performance monitoring.", level: 3, category: "v4", role: "D/V", references: [] },
          { id: "v4.20.2", code: "4.20.2", title: "Use Private Information Retrieval", description: "Verify that private information retrieval systems enable database queries without revealing query patterns with cryptographic protection of access patterns.", level: 3, category: "v4", role: "D/V", references: [] },
          { id: "v4.20.3", code: "4.20.3", title: "Use Secure Multi-Party Computation Protocols", description: "Verify that secure multi-party computation protocols enable privacy-preserving AI inference without exposing individual inputs or intermediate computations.", level: 3, category: "v4", role: "D/V", references: [] },
          { id: "v4.20.4", code: "4.20.4", title: "Use Privacy-Preserving Key Management", description: "Verify that privacy-preserving key management includes distributed key generation, threshold cryptography, and secure key rotation with hardware-backed protection.", level: 3, category: "v4", role: "D/V", references: [] },
          { id: "v4.20.5", code: "4.20.5", title: "Optimize Privacy-Preserving Compute Performance", description: "Verify that privacy-preserving compute performance is optimized through batching, caching, and hardware acceleration while maintaining cryptographic security guarantees.", level: 3, category: "v4", role: "D/V", references: [] },
      ]},
    ],
    references: [
      { title: "NIST Cybersecurity Framework 2.0", url: "https://www.nist.gov/cyberframework" },
      { title: "CIS Controls v8", url: "https://www.cisecurity.org/controls/v8" },
      { title: "OWASP Container Security Verification Standard", url: "https://github.com/OWASP/Container-Security-Verification-Standard" },
      { title: "Kubernetes Security Best Practices", url: "https://kubernetes.io/docs/concepts/security/" },
      { title: "SLSA Supply Chain Security Framework", url: "https://slsa.dev/" },
      { title: "NIST SP 800-190: Application Container Security Guide", url: "https://csrc.nist.gov/publications/detail/sp/800-190/final" },
      { title: "Cloud Security Alliance: Cloud Controls Matrix", url: "https://cloudsecurityalliance.org/research/cloud-controls-matrix/" },
      { title: "ENISA: Secure Infrastructure Design", url: "https://www.enisa.europa.eu/topics/critical-information-infrastructures-and-services" },
      { title: "NIST SP 800-53: Security Controls for Federal Information Systems", url: "https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final" },
      { title: "ISO 27001:2022 Information Security Management", url: "https://www.iso.org/standard/27001" },
      { title: "NIST AI Risk Management Framework", url: "https://www.nist.gov/itl/ai-risk-management-framework" },
      { title: "CIS Kubernetes Benchmark", url: "https://www.cisecurity.org/benchmark/kubernetes" },
      { title: "FIPS 140-2 Security Requirements", url: "https://csrc.nist.gov/publications/detail/fips/140/2/final" },
      { title: "NIST SP 800-207: Zero Trust Architecture", url: "https://csrc.nist.gov/publications/detail/sp/800-207/final" },
      { title: "IEEE 2857: Privacy Engineering for AI Systems", url: "https://standards.ieee.org/ieee/2857/7273/" },
      { title: "NIST SP 800-161: Cybersecurity Supply Chain Risk Management", url: "https://csrc.nist.gov/publications/detail/sp/800-161/rev-1/final" },
      { title: "NIST Post-Quantum Cryptography Standards", url: "https://csrc.nist.gov/Projects/post-quantum-cryptography" },
      { title: "Intel SGX Developer Guide", url: "https://www.intel.com/content/www/us/en/developer/tools/software-guard-extensions/overview.html" },
      { title: "AMD SEV-SNP White Paper", url: "https://www.amd.com/system/files/TechDocs/SEV-SNP-strengthening-vm-isolation-with-integrity-protection-and-more.pdf" },
      { title: "ARM TrustZone Technology", url: "https://developer.arm.com/ip-products/security-ip/trustzone" },
      { title: "ZK-SNARKs: A Gentle Introduction", url: "https://blog.ethereum.org/2016/12/05/zksnarks-in-a-nutshell/" },
      { title: "NIST SP 800-57: Cryptographic Key Management", url: "https://csrc.nist.gov/publications/detail/sp/800-57-part-1/rev-5/final" },
      { title: "Side-Channel Attack Countermeasures", url: "https://link.springer.com/book/10.1007/978-3-319-75268-6" },
      { title: "Neuromorphic Computing Security Challenges", url: "https://ieeexplore.ieee.org/document/9458103" },
      { title: "FPGA Security: Fundamentals, Evaluation, and Countermeasures", url: "https://link.springer.com/book/10.1007/978-3-319-90385-9" },
      { title: "Microsoft SEAL: Homomorphic Encryption Library", url: "https://github.com/Microsoft/SEAL" },
      { title: "HElib: Homomorphic Encryption Library", url: "https://github.com/homenc/HElib" },
      { title: "PALISADE Lattice Cryptography Library", url: "https://palisade-crypto.org/" },
      { title: "Differential Privacy: A Survey of Results", url: "https://link.springer.com/chapter/10.1007/978-3-540-79228-4_1" },
      { title: "Secure Aggregation for Federated Learning", url: "https://eprint.iacr.org/2017/281.pdf" },
      { title: "Private Information Retrieval: Concepts and Constructions", url: "https://link.springer.com/book/10.1007/978-3-030-16234-8" },
    ]
  },
  "v5": {
    id: "v5",
    code: "C5",
    name: "Access Control & Identity for AI Components & Users",
    description: "Effective access control for AI systems requires robust identity management, context-aware authorization, and runtime enforcement following zero-trust principles. These controls ensure that humans, services, and autonomous agents interact with models, data, and computational resources only within explicitly granted scopes, with continuous verification and audit capabilities.",
    color: "#8b5cf6",
    icon: "key",
    subCategories: [
      { id: "v5.1", code: "C5.1", name: "Identity Management & Authentication", requirements: [
          { id: "v5.1.1", code: "5.1.1", title: "Use Centralized Identity Provider", description: "Verify that all human users and service principals authenticate through a centralized enterprise identity provider (IdP) using OIDC/SAML protocols with unique identity-to-token mappings (no shared accounts or credentials).", level: 1, category: "v5", role: "D/V", references: [] },
          { id: "v5.1.2", code: "5.1.2", title: "Require MFA for High-Risk Operations", description: "Verify that high-risk operations (model deployment, weight export, training data access, production configuration changes) require multi-factor authentication or step-up authentication with session re-validation.", level: 1, category: "v5", role: "D/V", references: [] },
          { id: "v5.1.3", code: "5.1.3", title: "Use Identity Proofing Standards", description: "Verify that new principals undergo identity proofing aligned with NIST 800-63-3 IAL-2 or equivalent standards before receiving production system access.", level: 2, category: "v5", role: "D", references: [] },
          { id: "v5.1.4", code: "5.1.4", title: "Conduct Quarterly Access Reviews", description: "Verify that access reviews are conducted quarterly with automated detection of dormant accounts, credential rotation enforcement, and de-provisioning workflows.", level: 2, category: "v5", role: "V", references: [] },
          { id: "v5.1.5", code: "5.1.5", title: "Use Signed JWTs for Federated Agents", description: "Verify that federated AI agents authenticate via signed JWT assertions with maximum lifetime of 24 hours and include cryptographic proof of origin.", level: 3, category: "v5", role: "D/V", references: [] },
      ]},
      { id: "v5.2", code: "C5.2", name: "Resource Authorization & Least Privilege", requirements: [
          { id: "v5.2.1", code: "5.2.1", title: "Enforce Role-Based Access Controls", description: "Verify that every AI resource (datasets, models, endpoints, vector collections, embedding indices, compute instances) enforces role-based access controls with explicit allow-lists and default-deny policies.", level: 1, category: "v5", role: "D/V", references: [] },
          { id: "v5.2.2", code: "5.2.2", title: "Enforce Least-Privilege by Default", description: "Verify that least-privilege principles are enforced by default with service accounts starting at read-only permissions and requiring documented business justification for write access elevation.", level: 1, category: "v5", role: "D/V", references: [] },
          { id: "v5.2.3", code: "5.2.3", title: "Log Access Control Modifications", description: "Verify that all access control modifications are linked to approved change requests and logged immutably with timestamp, actor identity, resource identifier, and permission delta.", level: 1, category: "v5", role: "V", references: [] },
          { id: "v5.2.4", code: "5.2.4", title: "Propagate Data Classification Labels", description: "Verify that data classification labels (PII, PHI, export-controlled, proprietary) automatically propagate to derived resources (embeddings, prompt caches, model outputs) with consistent policy enforcement.", level: 2, category: "v5", role: "D", references: [] },
          { id: "v5.2.5", code: "5.2.5", title: "Trigger Real-Time Alerts", description: "Verify that unauthorized access attempts and privilege escalation events trigger real-time alerts to SIEM systems within 5 minutes with contextual metadata.", level: 2, category: "v5", role: "D/V", references: [] },
      ]},
      { id: "v5.3", code: "C5.3", name: "Dynamic Policy Evaluation", requirements: [
          { id: "v5.3.1", code: "5.3.1", title: "Externalize Authorization Decisions", description: "Verify that authorization decisions are externalized to a dedicated policy engine (OPA, Cedar, or equivalent) accessible via authenticated APIs with cryptographic integrity protection.", level: 1, category: "v5", role: "D/V", references: [] },
          { id: "v5.3.2", code: "5.3.2", title: "Evaluate Dynamic Attributes", description: "Verify that policies evaluate dynamic attributes including user clearance level, resource sensitivity classification, request context, tenant isolation, and temporal constraints at runtime.", level: 1, category: "v5", role: "D/V", references: [] },
          { id: "v5.3.3", code: "5.3.3", title: "Version-Control and Test Policies", description: "Verify that policy definitions are version-controlled, peer-reviewed, and validated through automated testing in CI/CD pipelines before production deployment.", level: 2, category: "v5", role: "D", references: [] },
          { id: "v5.3.4", code: "5.3.4", title: "Log Policy Evaluation Results", description: "Verify that policy evaluation results include structured decision rationale and are transmitted to SIEM systems for correlation analysis and compliance reporting.", level: 2, category: "v5", role: "V", references: [] },
          { id: "v5.3.5", code: "5.3.5", title: "Manage Policy Cache TTL", description: "Verify that policy cache time-to-live (TTL) values do not exceed 5 minutes for high-sensitivity resources and 1 hour for standard resources with cache invalidation capabilities.", level: 3, category: "v5", role: "D/V", references: [] },
      ]},
      { id: "v5.4", code: "C5.4", name: "Query-Time Security Enforcement", requirements: [
          { id: "v5.4.1", code: "5.4.1", title: "Enforce Mandatory Security Filters", description: "Verify that all vector database and SQL queries include mandatory security filters (tenant ID, sensitivity labels, user scope) enforced at the database engine level, not application code.", level: 1, category: "v5", role: "D/V", references: [] },
          { id: "v5.4.2", code: "5.4.2", title: "Enable Row-Level Security", description: "Verify that row-level security (RLS) policies and field-level masking are enabled for all vector databases, search indices, and training datasets with policy inheritance.", level: 1, category: "v5", role: "D/V", references: [] },
          { id: "v5.4.3", code: "5.4.3", title: "Abort Queries on Failed Authorization", description: "Verify that failed authorization evaluations immediately abort queries and return explicit authorization error codes rather than empty result sets to prevent confused deputy attacks.", level: 2, category: "v5", role: "D", references: [] },
          { id: "v5.4.4", code: "5.4.4", title: "Monitor Policy Evaluation Latency", description: "Verify that policy evaluation latency is continuously monitored with automated alerts for timeout conditions that could enable authorization bypass.", level: 2, category: "v5", role: "V", references: [] },
          { id: "v5.4.5", code: "5.4.5", title: "Re-evaluate Authorization on Retries", description: "Verify that query retry mechanisms re-evaluate authorization policies to account for dynamic permission changes within active user sessions.", level: 3, category: "v5", role: "D/V", references: [] },
      ]},
      { id: "v5.5", code: "C5.5", name: "Output Filtering & Data Loss Prevention", requirements: [
          { id: "v5.5.1", code: "5.5.1", title: "Scan and Redact Unauthorized Data", description: "Verify that post-inference filtering mechanisms scan and redact unauthorized PII, classified information, or proprietary data before content delivery to requestors.", level: 1, category: "v5", role: "D/V", references: [] },
          { id: "v5.5.2", code: "5.5.2", title: "Validate Citations and References", description: "Verify that citations, references, and source attributions in model outputs are validated against caller entitlements and removed if unauthorized access is detected.", level: 1, category: "v5", role: "D/V", references: [] },
          { id: "v5.5.3", code: "5.5.3", title: "Enforce Output Format Restrictions", description: "Verify that output format restrictions (sanitized PDFs, metadata-stripped images, approved file types) are enforced based on user permission levels and data classification.", level: 2, category: "v5", role: "D", references: [] },
          { id: "v5.5.4", code: "5.5.4", title: "Maintain Audit Logs for Redaction", description: "Verify that redaction algorithms are deterministic, version-controlled, and maintain audit logs to support compliance investigations and forensic analysis.", level: 2, category: "v5", role: "V", references: [] },
          { id: "v5.5.5", code: "5.5.5", title: "Generate Adaptive Logs for High-Risk Events", description: "Verify that high-risk redaction events generate adaptive logs with cryptographic hashes of original content for forensic retrieval without data exposure.", level: 3, category: "v5", role: "V", references: [] },
      ]},
      { id: "v5.6", code: "C5.6", name: "Multi-Tenant Isolation", requirements: [
          { id: "v5.6.1", code: "5.6.1", title: "Segregate Tenant Resources", description: "Verify that memory spaces, embedding stores, cache entries, and temporary files are namespace-segregated per tenant with secure purging on tenant deletion or session termination.", level: 1, category: "v5", role: "D/V", references: [] },
          { id: "v5.6.2", code: "5.6.2", title: "Validate Tenant Identifier in API Requests", description: "Verify that every API request includes an authenticated tenant identifier that is cryptographically validated against session context and user entitlements.", level: 1, category: "v5", role: "D/V", references: [] },
          { id: "v5.6.3", code: "5.6.3", title: "Implement Default-Deny Network Policies", description: "Verify that network policies implement default-deny rules for cross-tenant communication within service meshes and container orchestration platforms.", level: 2, category: "v5", role: "D", references: [] },
          { id: "v5.6.4", code: "5.6.4", title: "Use Unique Encryption Keys per Tenant", description: "Verify that encryption keys are unique per tenant with customer-managed key (CMK) support and cryptographic isolation between tenant data stores.", level: 3, category: "v5", role: "D", references: [] },
      ]},
      { id: "v5.7", code: "C5.7", name: "Autonomous Agent Authorization", requirements: [
          { id: "v5.7.1", code: "5.7.1", title: "Use Scoped Capability Tokens", description: "Verify that autonomous agents receive scoped capability tokens that explicitly enumerate permitted actions, accessible resources, time boundaries, and operational constraints.", level: 1, category: "v5", role: "D/V", references: [] },
          { id: "v5.7.2", code: "5.7.2", title: "Disable High-Risk Capabilities by Default", description: "Verify that high-risk capabilities (file system access, code execution, external API calls, financial transactions) are disabled by default and require explicit authorization with business justification.", level: 1, category: "v5", role: "D/V", references: [] },
          { id: "v5.7.3", code: "5.7.3", title: "Bind Capability Tokens to User Sessions", description: "Verify that capability tokens are bound to user sessions, include cryptographic integrity protection, and cannot be persisted or reused in offline scenarios.", level: 2, category: "v5", role: "D", references: [] },
          { id: "v5.7.4", code: "5.7.4", title: "Use Secondary Authorization for Agent Actions", description: "Verify that agent-initiated actions undergo secondary authorization through the ABAC policy engine with full context evaluation and audit logging.", level: 2, category: "v5", role: "V", references: [] },
          { id: "v5.7.5", code: "5.7.5", title: "Include Capability Scope in Error Conditions", description: "Verify that agent error conditions and exception handling include capability scope information to support incident analysis and forensic investigation.", level: 3, category: "v5", role: "V", references: [] },
      ]},
    ],
    references: [
      { title: "NIST SP 800-63-3: Digital Identity Guidelines", url: "https://pages.nist.gov/800-63-3/" },
      { title: "Zero Trust Architecture – NIST SP 800-207", url: "https://nvlpubs.nist.gov/nistpubs/specialpublications/NIST.SP.800-207.pdf" },
      { title: "OWASP Application Security Verification Standard (AISVS)", url: "https://owasp.org/www-project-application-security-verification-standard/" },
      { title: "Identity and Access Management in the AI Era: 2025 Guide – IDSA", url: "https://www.idsalliance.org/blog/identity-and-access-management-in-the-ai-era-2025-guide/" },
      { title: "Attribute-Based Access Control with OPA – Permify", url: "https://medium.com/permify-tech-blog/attribute-based-access-control-abac-implementation-with-open-policy-agent-opa-b47052248f29" },
      { title: "How We Designed Cedar to Be Intuitive, Fast, and Safe – AWS", url: "https://aws.amazon.com/blogs/security/how-we-designed-cedar-to-be-intuitive-to-use-fast-and-safe/" },
      { title: "Row Level Security in Vector DBs for RAG – Bluetuple.ai", url: "https://medium.com/bluetuple-ai/implementing-row-level-security-in-vector-dbs-for-rag-applications-fdbccb63d464" },
      { title: "Tenant Isolation in Multi-Tenant Systems – WorkOS", url: "https://workos.com/blog/tenant-isolation-in-multi-tenant-systems" },
      { title: "Handling AI Agent Permissions – Stytch", url: "https://stytch.com/blog/handling-ai-agent-permissions/" },
      { title: "OWASP Top 10 for Large Language Model Applications", url: "https://owasp.org/www-project-top-10-for-large-language-model-applications/" },
    ]
  },
  "v6": {
    id: "v6",
    code: "C6",
    name: "Supply Chain Security for Models, Frameworks & Data",
    description: "AI supply‑chain attacks exploit third‑party models, frameworks, or datasets to embed backdoors, bias, or exploitable code. These controls provide end‑to‑end provenance, vulnerability management, and monitoring to protect the entire model lifecycle.",
    color: "#f97316",
    icon: "truck",
    subCategories: [
        { id: "v6.1", code: "C6.1", name: "Pretrained Model Vetting & Provenance", requirements: [
            { id: "v6.1.1", code: "6.1.1", title: "Require Signed Provenance Records", description: "Verify that every third‑party model artifact includes a signed provenance record identifying source repository and commit hash.", level: 1, category: "v6", role: "D/V", references: [] },
            { id: "v6.1.2", code: "6.1.2", title: "Scan Models for Malicious Layers", description: "Verify that models are scanned for malicious layers or Trojan triggers using automated tools before import.", level: 1, category: "v6", role: "D/V", references: [] },
            { id: "v6.1.3", code: "6.1.3", title: "Adversarially Evaluate Fine-Tunes", description: "Verify that transfer‑learning fine‑tunes pass adversarial evaluation to detect hidden behaviors.", level: 2, category: "v6", role: "D", references: [] },
            { id: "v6.1.4", code: "6.1.4", title: "Record Licenses in ML-BOM", description: "Verify that model licenses, export‑control tags, and data‑origin statements are recorded in a ML‑BOM entry.", level: 2, category: "v6", role: "V", references: [] },
            { id: "v6.1.5", code: "6.1.5", title: "Quarantine High-Risk Models", description: "Verify that high‑risk models (publicly uploaded weights, unverified creators) remain quarantined until human review and sign‑off.", level: 3, category: "v6", role: "D/V", references: [] },
        ]},
        { id: "v6.2", code: "C6.2", name: "Framework & Library Scanning", requirements: [
            { id: "v6.2.1", code: "6.2.1", title: "Run Dependency Scanners in CI", description: "Verify that CI pipelines run dependency scanners on AI frameworks and critical libraries.", level: 1, category: "v6", role: "D/V", references: [] },
            { id: "v6.2.2", code: "6.2.2", title: "Block Promotion on Critical Vulnerabilities", description: "Verify that critical vulnerabilities (CVSS ≥ 7.0) block promotion to production images.", level: 1, category: "v6", role: "D/V", references: [] },
            { id: "v6.2.3", code: "6.2.3", title: "Run Static Code Analysis", description: "Verify that static code analysis runs on forked or vendored ML libraries.", level: 2, category: "v6", role: "D", references: [] },
            { id: "v6.2.4", code: "6.2.4", title: "Include Security Impact Assessment for Upgrades", description: "Verify that framework upgrade proposals include a security impact assessment referencing public CVE feeds.", level: 2, category: "v6", role: "V", references: [] },
            { id: "v6.2.5", code: "6.2.5", title: "Alert on Unexpected Library Loads", description: "Verify that runtime sensors alert on unexpected dynamic library loads that deviate from the signed SBOM.", level: 3, category: "v6", role: "V", references: [] },
        ]},
        { id: "v6.3", code: "C6.3", name: "Dependency Pinning & Verification", requirements: [
            { id: "v6.3.1", code: "6.3.1", title: "Enforce Version Pinning", description: "Verify that all package managers enforce version pinning via lockfiles.", level: 1, category: "v6", role: "D/V", references: [] },
            { id: "v6.3.2", code: "6.3.2", title: "Use Immutable Digests", description: "Verify that immutable digests are used instead of mutable tags in container references.", level: 1, category: "v6", role: "D/V", references: [] },
            { id: "v6.3.3", code: "6.3.3", title: "Use Reproducible-Build Checks", description: "Verify that reproducible‑build checks compare hashes across CI runs to ensure identical outputs.", level: 2, category: "v6", role: "D", references: [] },
            { id: "v6.3.4", code: "6.3.4", title: "Store Build Attestations", description: "Verify that build attestations are stored for 18 months for audit traceability.", level: 2, category: "v6", role: "V", references: [] },
            { id: "v6.3.5", code: "6.3.5", title: "Automate Dependency Updates", description: "Verify that expired dependencies trigger automated PRs to update or fork pinned versions.", level: 3, category: "v6", role: "D", references: [] },
        ]},
        { id: "v6.4", code: "C6.4", name: "Trusted Source Enforcement", requirements: [
            { id: "v6.4.1", code: "6.4.1", title: "Download from Approved Sources", description: "Verify that model weights, datasets, and containers are downloaded only from approved domains or internal registries.", level: 1, category: "v6", role: "D/V", references: [] },
            { id: "v6.4.2", code: "6.4.2", title: "Validate Publisher Identity", description: "Verify that Sigstore/Cosign signatures validate publisher identity before artifacts are cached locally.", level: 1, category: "v6", role: "D/V", references: [] },
            { id: "v6.4.3", code: "6.4.3", title: "Block Unauthenticated Downloads", description: "Verify that egress proxies block unauthenticated artifact downloads to enforce trusted‑source policy.", level: 2, category: "v6", role: "D", references: [] },
            { id: "v6.4.4", code: "6.4.4", title: "Review Allow-Lists Quarterly", description: "Verify that repository allow‑lists are reviewed quarterly with evidence of business justification for each entry.", level: 2, category: "v6", role: "V", references: [] },
            { id: "v6.4.5", code: "6.4.5", title: "Quarantine Artifacts on Policy Violations", description: "Verify that policy violations trigger quarantining of artifacts and rollback of dependent pipeline runs.", level: 3, category: "v6", role: "V", references: [] },
        ]},
        { id: "v6.5", code: "C6.5", name: "Third‑Party Dataset Risk Assessment", requirements: [
            { id: "v6.5.1", code: "6.5.1", title: "Assess Poisoning Risk", description: "Verify that external datasets undergo poisoning risk scoring (e.g., data fingerprinting, outlier detection).", level: 1, category: "v6", role: "D/V", references: [] },
            { id: "v6.5.2", code: "6.5.2", title: "Calculate Bias Metrics", description: "Verify that bias metrics (demographic parity, equal opportunity) are calculated before dataset approval.", level: 1, category: "v6", role: "D", references: [] },
            { id: "v6.5.3", code: "6.5.3", title: "Capture Provenance in ML-BOM", description: "Verify that provenance and license terms for datasets are captured in ML‑BOM entries.", level: 2, category: "v6", role: "V", references: [] },
            { id: "v6.5.4", code: "6.5.4", title: "Monitor Hosted Datasets", description: "Verify that periodic monitoring detects drift or corruption in hosted datasets.", level: 2, category: "v6", role: "V", references: [] },
            { id: "v6.5.5", code: "6.5.5", title: "Remove Disallowed Content", description: "Verify that disallowed content (copyright, PII) is removed via automated scrubbing prior to training.", level: 3, category: "v6", role: "D", references: [] },
        ]},
        { id: "v6.6", code: "C6.6", name: "Supply Chain Attack Monitoring", requirements: [
            { id: "v6.6.1", code: "6.6.1", title: "Stream Audit Logs to SIEM", description: "Verify that CI/CD audit logs stream to SIEM detections for anomalous package pulls or tampered build steps.", level: 1, category: "v6", role: "V", references: [] },
            { id: "v6.6.2", code: "6.6.2", title: "Include Rollback Procedures in Playbooks", description: "Verify that incident response playbooks include rollback procedures for compromised models or libraries.", level: 2, category: "v6", role: "D", references: [] },
            { id: "v6.6.3", code: "6.6.3", title: "Use Threat-Intel Enrichment", description: "Verify that threat‑intel enrichment tags ML‑specific indicators (e.g., model‑poisoning IoCs) in alert triage.", level: 3, category: "v6", role: "V", references: [] },
        ]},
        { id: "v6.7", code: "C6.7", name: "ML‑BOM for Model Artifacts", requirements: [
            { id: "v6.7.1", code: "6.7.1", title: "Publish ML-BOM for Every Artifact", description: "Verify that every model artifact publishes a ML‑BOM that lists datasets, weights, hyperparameters, and licenses.", level: 1, category: "v6", role: "D/V", references: [] },
            { id: "v6.7.2", code: "6.7.2", title: "Automate ML-BOM Generation", description: "Verify that ML‑BOM generation and Cosign signing are automated in CI and required for merge.", level: 1, category: "v6", role: "D/V", references: [] },
            { id: "v6.7.3", code: "6.7.3", title: "Implement ML-BOM Completeness Checks", description: "Verify that ML‑BOM completeness checks fail the build if any component metadata (hash, license) is missing.", level: 2, category: "v6", role: "D", references: [] },
            { id: "v6.7.4", code: "6.7.4", title: "Enable ML-BOM Querying", description: "Verify that downstream consumers can query ML-BOMs via API to validate imported models at deploy time.", level: 2, category: "v6", role: "V", references: [] },
            { id: "v6.7.5", code: "6.7.5", title: "Version-Control ML-BOMs", description: "Verify that ML‑BOMs are version‑controlled and diffed to detect unauthorized modifications.", level: 3, category: "v6", role: "V", references: [] },
        ]},
    ],
    references: [
      { title: "ML Supply Chain Compromise – MITRE ATLAS", url: "https://misp-galaxy.org/mitre-atlas-attack-pattern/" },
      { title: "Supply‑chain Levels for Software Artifacts (SLSA)", url: "https://slsa.dev/" },
      { title: "CycloneDX – Machine Learning Bill of Materials", url: "https://cyclonedx.org/capabilities/mlbom/" },
      { title: "What is Data Poisoning? – SentinelOne", url: "https://www.sentinelone.com/cybersecurity-101/cybersecurity/data-poisoning/" },
      { title: "Transfer Learning Attack – OWASP ML Security Top 10", url: "https://owasp.org/www-project-machine-learning-security-top-10/docs/ML07_2023-Transfer_Learning_Attack" },
      { title: "AI Data Security Best Practices – CISA", url: "https://www.cisa.gov/news-events/cybersecurity-advisories/aa25-142a" },
      { title: "Secure CI/CD Supply Chain – Sumo Logic", url: "https://www.sumologic.com/blog/secure-azure-devops-github-supply-chain-attacks" },
      { title: "AI & Transparency: Protect ML Models – ReversingLabs", url: "https://www.reversinglabs.com/blog/ai-and-transparency-how-ml-model-creators-can-protect-against-supply-chain-attacks" },
      { title: "SBOM Overview – CISA", url: "https://www.cisa.gov/sbom" },
      { title: "Training Data Poisoning Guide – Lakera.ai", url: "https://www.lakera.ai/blog/training-data-poisoning" },
      { title: "Dependency Pinning for Reproducible Python – Medium", url: "https://medium.com/data-science-collective/guarantee-a-locked-reproducible-environment-with-every-python-run-c0e2bf19fb53" },
    ]
  },
  "v7": {
    id: "v7",
    code: "C7",
    name: "Model Behavior, Output Control & Safety Assurance",
    description: "Model outputs must be structured, reliable, safe, explainable, and continuously monitored in production. Doing so reduces hallucinations, privacy leaks, harmful content, and runaway actions, while increasing user trust and regulatory compliance.",
    color: "#06b6d4",
    icon: "safety-goggles",
    subCategories: [
      { id: "v7.1", code: "C7.1", name: "Output Format Enforcement", requirements: [
          { id: "v7.1.1", code: "7.1.1", title: "Validate Response Schemas", description: "Verify that response schemas (e.g., JSON Schema) are supplied in the system prompt and every output is automatically validated; non-conforming outputs trigger repair or rejection.", level: 1, category: "v7", role: "D/V", references: [] },
          { id: "v7.1.2", code: "7.1.2", title: "Enable Constrained Decoding", description: "Verify that constrained decoding (stop tokens, regex, max-tokens) is enabled to prevent overflow or prompt-injection side-channels.", level: 1, category: "v7", role: "D/V", references: [] },
          { id: "v7.1.3", code: "7.1.3", title: "Treat Outputs as Untrusted", description: "Verify that downstream components treat outputs as untrusted and validate them against schemas or injection-safe de-serializers.", level: 2, category: "v7", role: "D/V", references: [] },
          { id: "v7.1.4", code: "7.1.4", title: "Log Improper-Output Events", description: "Verify that improper-output events are logged, rate-limited, and surfaced to monitoring.", level: 3, category: "v7", role: "V", references: [] },
      ]},
      { id: "v7.2", code: "C7.2", name: "Hallucination Detection & Mitigation", requirements: [
          { id: "v7.2.1", code: "7.2.1", title: "Assign Confidence Scores", description: "Verify that token-level log-probabilities, ensemble self-consistency, or fine-tuned hallucination detectors assign a confidence score to each answer.", level: 1, category: "v7", role: "D/V", references: [] },
          { id: "v7.2.2", code: "7.2.2", title: "Trigger Fallback Workflows", description: "Verify that responses below a configurable confidence threshold trigger fallback workflows (e.g., retrieval-augmented generation, secondary model, or human review).", level: 1, category: "v7", role: "D/V", references: [] },
          { id: "v7.2.3", code: "7.2.3", title: "Tag Hallucination Incidents", description: "Verify that hallucination incidents are tagged with root-cause metadata and fed to post-mortem and finetuning pipelines.", level: 2, category: "v7", role: "D/V", references: [] },
          { id: "v7.2.4", code: "7.2.4", title: "Recalibrate Thresholds and Detectors", description: "Verify that thresholds and detectors are re-calibrated after major model or knowledge-base updates.", level: 3, category: "v7", role: "D/V", references: [] },
          { id: "v7.2.5", code: "7.2.5", title: "Track Hallucination Rates", description: "Verify that dashboard visualisations track hallucination rates.", level: 3, category: "v7", role: "V", references: [] },
      ]},
      { id: "v7.3", code: "C7.3", name: "Output Safety & Privacy Filtering", requirements: [
          { id: "v7.3.1", code: "7.3.1", title: "Block Harmful Content", description: "Verify that pre and post-generation classifiers block hate, harassment, self-harm, extremist, and sexually explicit content aligned to policy.", level: 1, category: "v7", role: "D/V", references: [] },
          { id: "v7.3.2", code: "7.3.2", title: "Detect and Redact PII/PCI", description: "Verify that PII/PCI detection and automatic redaction run on every response; violations raise a privacy incident.", level: 1, category: "v7", role: "D/V", references: [] },
          { id: "v7.3.3", code: "7.3.3", title: "Propagate Confidentiality Tags", description: "Verify that confidentiality tags (e.g., trade secrets) propagate across modalities to prevent leakage in text, images, or code.", level: 2, category: "v7", role: "D", references: [] },
          { id: "v7.3.4", code: "7.3.4", title: "Require Secondary Approval for High-Risk Classifications", description: "Verify that filter bypass attempts or high-risk classifications require secondary approval or user re-authentication.", level: 3, category: "v7", role: "D/V", references: [] },
          { id: "v7.3.5", code: "7.3.5", title: "Reflect Legal Jurisdictions in Filtering", description: "Verify that filtering thresholds reflect legal jurisdictions and user age/role context.", level: 3, category: "v7", role: "D/V", references: [] },
      ]},
      { id: "v7.4", code: "C7.4", name: "Output & Action Limiting", requirements: [
          { id: "v7.4.1", code: "7.4.1", title: "Limit Requests, Tokens, and Cost", description: "Verify that per-user and per-API-key quotas limit requests, tokens, and cost with exponential back-off on 429 errors.", level: 1, category: "v7", role: "D", references: [] },
          { id: "v7.4.2", code: "7.4.2", title: "Require Approval for Privileged Actions", description: "Verify that privileged actions (file writes, code exec, network calls) require policy-based approval or human-in-the-loop.", level: 1, category: "v7", role: "D/V", references: [] },
          { id: "v7.4.3", code: "7.4.3", title: "Use Cross-Modal Consistency Checks", description: "Verify that cross-modal consistency checks ensure images, code, and text generated for the same request cannot be used to smuggle malicious content.", level: 2, category: "v7", role: "D/V", references: [] },
          { id: "v7.4.4", code: "7.4.4", title: "Configure Agent Delegation Depth", description: "Verify that agent delegation depth, recursion limits, and allowed tool lists are explicitly configured.", level: 2, category: "v7", role: "D", references: [] },
          { id: "v7.4.5", code: "7.4.5", title: "Emit Structured Security Events", description: "Verify that violation of limits emits structured security events for SIEM ingestion.", level: 3, category: "v7", role: "V", references: [] },
      ]},
      { id: "v7.5", code: "C7.5", name: "Output Explainability", requirements: [
          { id: "v7.5.1", code: "7.5.1", title: "Expose User-Facing Confidence Scores", description: "Verify that user-facing confidence scores or brief reasoning summaries are exposed when risk assessment deems appropriate.", level: 2, category: "v7", role: "D/V", references: [] },
          { id: "v7.5.2", code: "7.5.2", title: "Avoid Revealing Sensitive Data in Explanations", description: "Verify that generated explanations avoid revealing sensitive system prompts or proprietary data.", level: 2, category: "v7", role: "D/V", references: [] },
          { id: "v7.5.3", code: "7.5.3", title: "Capture and Store Token-Level Probabilities", description: "Verify that the system captures token-level log-probabilities or attention maps and stores them for authorized inspection.", level: 3, category: "v7", role: "D", references: [] },
          { id: "v7.5.4", code: "7.5.4", title: "Version Control Explainability Artefacts", description: "Verify that explainability artefacts are version-controlled alongside model releases for auditability.", level: 3, category: "v7", role: "V", references: [] },
      ]},
      { id: "v7.6", code: "C7.6", name: "Monitoring Integration", requirements: [
          { id: "v7.6.1", code: "7.6.1", title: "Stream Metrics to Monitoring Platform", description: "Verify that metrics (schema violations, hallucination rate, toxicity, PII leaks, latency, cost) stream to a central monitoring platform.", level: 1, category: "v7", role: "D", references: [] },
          { id: "v7.6.2", code: "7.6.2", title: "Define Alert Thresholds", description: "Verify that alert thresholds are defined for each safety metric, with on-call escalation paths.", level: 1, category: "v7", role: "V", references: [] },
          { id: "v7.6.3", code: "7.6.3", title: "Correlate Anomalies with Changes", description: "Verify that dashboards correlate output anomalies with model/version, feature flag, and upstream data changes.", level: 2, category: "v7", role: "V", references: [] },
          { id: "v7.6.4", code: "7.6.4", title: "Feed Monitoring Data into MLOps", description: "Verify that monitoring data feeds back into retraining, fine-tuning, or rule updates within a documented MLOps workflow.", level: 2, category: "v7", role: "D/V", references: [] },
          { id: "v7.6.5", code: "7.6.5", title: "Penetration Test Monitoring Pipelines", description: "Verify that monitoring pipelines are penetration-tested and access-controlled to avoid leakage of sensitive logs.", level: 3, category: "v7", role: "V", references: [] },
      ]},
      { id: "v7.7", code: "C7.7", name: "Generative Media Safeguards", requirements: [
          { id: "v7.7.1", code: "7.7.1", title: "Prohibit Generation of Illegal Media", description: "Verify that system prompts and user instructions explicitly prohibit the generation of illegal, harmful, or non-consensual deepfake media (e.g., image, video, audio).", level: 1, category: "v7", role: "D/V", references: [] },
          { id: "v7.7.2", code: "7.7.2", title: "Filter Prompts for Impersonations", description: "Verify that prompts are filtered for attempts to generate impersonations, sexually explicit deepfakes, or media depicting real individuals without consent.", level: 2, category: "v7", role: "D/V", references: [] },
          { id: "v7.7.3", code: "7.7.3", title: "Prevent Reproduction of Copyrighted Media", description: "Verify that the system uses perceptual hashing, watermark detection, or fingerprinting to prevent unauthorized reproduction of copyrighted media.", level: 2, category: "v7", role: "V", references: [] },
          { id: "v7.7.4", code: "7.7.4", title: "Embed Provenance Metadata in Generated Media", description: "Verify that all generated media is cryptographically signed, watermarked, or embedded with tamper-resistant provenance metadata for downstream traceability.", level: 3, category: "v7", role: "D/V", references: [] },
          { id: "v7.7.5", code: "7.7.5", title: "Detect and Log Bypass Attempts", description: "Verify that bypass attempts (e.g., prompt obfuscation, slang, adversarial phrasing) are detected, logged, and rate-limited; repeated abuse is surfaced to monitoring systems.", level: 3, category: "v7", role: "V", references: [] },
      ]},
    ],
    references: [
      { title: "NIST AI Risk Management Framework", url: "https://www.nist.gov/itl/ai-risk-management-framework" },
      { title: "ISO/IEC 42001:2023 – AI Management System", url: "https://www.iso.org/obp/ui/en/" },
      { title: "OWASP Top-10 for Large Language Model Applications (2025)", url: "https://owasp.org/www-project-top-10-for-large-language-model-applications/" },
      { title: "Improper Output Handling – OWASP LLM05:2025", url: "https://genai.owasp.org/llmrisk/llm052025-improper-output-handling/" },
      { title: "Practical Techniques to Constrain LLM Output", url: "https://mychen76.medium.com/practical-techniques-to-constraint-llm-output-in-json-format-e3e72396c670" },
      { title: "Dataiku – Structured Text Generation Guide", url: "https://blog.dataiku.com/your-guide-to-structured-text-generation" },
      { title: "VL-Uncertainty: Detecting Hallucinations", url: "https://arxiv.org/abs/2411.11919" },
      { title: "HaDeMiF: Hallucination Detection & Mitigation", url: "https://openreview.net/forum?id=VwOYxPScxB" },
      { title: "Building Confidence in LLM Outputs", url: "https://www.alkymi.io/data-science-room/building-confidence-in-llm-outputs" },
      { title: "Explainable AI & LLMs", url: "https://duncsand.medium.com/explainable-ai-140912d31b3b" },
      { title: "LLM Red-Teaming Guide", url: "https://www.confident-ai.com/blog/red-teaming-llms-a-step-by-step-guide" },
      { title: "Sensitive Information Disclosure in LLMs", url: "https://virtualcyberlabs.com/llm-sensitive-information-disclosure/" },
      { title: "LangChain – Chat Model Rate Limiting", url: "https://python.langchain.com/docs/how_to/chat_model_rate_limiting/" },
      { title: "OpenAI Rate-Limit & Exponential Back-off", url: "https://hackernoon.com/openais-rate-limit-a-guide-to-exponential-backoff-for-llm-evaluation" },
      { title: "Arize AI – LLM Observability Platform", url: "https://arize.com/" },
    ]
  },
  "v8": {
    id: "v8",
    code: "C8",
    name: "Memory, Embeddings & Vector Database Security",
    description: "Embeddings and vector stores act as the \"live memory\" of contemporary AI systems, continuously accepting user-supplied data and surfacing it back into model contexts via Retrieval-Augmented Generation (RAG). If left ungoverned, this memory can leak PII, violate consent, or be inverted to reconstruct the original text. The objective of this control family is to harden memory pipelines and vector databases so that access is least-privilege, embeddings are privacy-preserving, stored vectors expire or can be revoked on demand, and per-user memory never contaminates another user's prompts or completions.",
    color: "#ec4899",
    icon: "memory",
    subCategories: [
      { id: "v8.1", code: "C8.1", name: "Access Controls on Memory & RAG Indices", requirements: [
          { id: "v8.1.1", code: "8.1.1", title: "Use Row/Namespace-Level Access Control", description: "Verify that row/namespace-level access control rules restrict insert, delete, and query operations per tenant, collection, or document tag.", level: 1, category: "v8", role: "D/V", references: [] },
          { id: "v8.1.2", code: "8.1.2", title: "Use Scoped API Keys/JWTs", description: "Verify that API keys or JWTs carry scoped claims (e.g., collection IDs, action verbs) and are rotated at least quarterly.", level: 1, category: "v8", role: "D/V", references: [] },
          { id: "v8.1.3", code: "8.1.3", title: "Detect and Log Privilege-Escalation Attempts", description: "Verify that privilege-escalation attempts (e.g., cross-namespace similarity queries) are detected and logged to a SIEM within 5 minutes.", level: 2, category: "v8", role: "D/V", references: [] },
          { id: "v8.1.4", code: "8.1.4", title: "Log Vector DB Audits", description: "Verify that vector DB audits log subject-identifier, operation, vector ID/namespace, similarity threshold, and result count.", level: 2, category: "v8", role: "D/V", references: [] },
          { id: "v8.1.5", code: "8.1.5", title: "Test for Access Control Bypass Flaws", description: "Verify that access decisions are tested for bypass flaws whenever engines are upgraded or index-sharding rules change.", level: 3, category: "v8", role: "V", references: [] },
      ]},
      { id: "v8.2", code: "C8.2", name: "Embedding Sanitization & Validation", requirements: [
          { id: "v8.2.1", code: "8.2.1", title: "Detect and Mask PII", description: "Verify that PII and regulated data are detected via automated classifiers and masked, tokenised, or dropped pre-embedding.", level: 1, category: "v8", role: "D/V", references: [] },
          { id: "v8.2.2", code: "8.2.2", title: "Reject Malicious Inputs", description: "Verify that embedding pipelines reject or quarantine inputs containing executable code or non-UTF-8 artifacts that could poison the index.", level: 1, category: "v8", role: "D", references: [] },
          { id: "v8.2.3", code: "8.2.3", title: "Apply Differential Privacy", description: "Verify that local or metric differential-privacy sanitization is applied to sentence embeddings whose distance to any known PII token falls below a configurable threshold.", level: 2, category: "v8", role: "D/V", references: [] },
          { id: "v8.2.4", code: "8.2.4", title: "Validate Sanitization Efficacy", description: "Verify that sanitization efficacy (e.g., recall of PII redaction, semantic drift) is validated at least semi-annually against benchmark corpora.", level: 2, category: "v8", role: "V", references: [] },
          { id: "v8.2.5", code: "8.2.5", title: "Version-Control Sanitization Configs", description: "Verify that sanitization configs are version-controlled and changes undergo peer review.", level: 3, category: "v8", role: "D/V", references: [] },
      ]},
      { id: "v8.3", code: "C8.3", name: "Memory Expiry, Revocation & Deletion", requirements: [
          { id: "v8.3.1", code: "8.3.1", title: "Use TTLs for Vectors", description: "Verify that every vector and metadata record carries a TTL or explicit retention label honoured by automated cleanup jobs.", level: 1, category: "v8", role: "D/V", references: [] },
          { id: "v8.3.2", code: "8.3.2", title: "Purge Data on Deletion Requests", description: "Verify that user-initiated deletion requests purge vectors, metadata, cache copies, and derivative indices within 30 days.", level: 1, category: "v8", role: "D/V", references: [] },
          { id: "v8.3.3", code: "8.3.3", title: "Use Cryptographic Shredding", description: "Verify that logical deletes are followed by cryptographic shredding of storage blocks if hardware supports it, or by key-vault key destruction.", level: 2, category: "v8", role: "D", references: [] },
          { id: "v8.3.4", code: "8.3.4", title: "Exclude Expired Vectors from Search", description: "Verify that expired vectors are excluded from nearest-neighbour search results in < 500 ms after expiration.", level: 3, category: "v8", role: "D/V", references: [] },
      ]},
      { id: "v8.4", code: "C8.4", name: "Prevent Embedding Inversion & Leakage", requirements: [
          { id: "v8.4.1", code: "8.4.1", title: "Maintain a Formal Threat Model", description: "Verify that a formal threat model covering inversion, membership and attribute-inference attacks exists and is reviewed yearly.", level: 1, category: "v8", role: "V", references: [] },
          { id: "v8.4.2", code: "8.4.2", title: "Use Application-Layer Encryption", description: "Verify that application-layer encryption or searchable encryption shields vectors from direct reads by infrastructure admins or cloud staff.", level: 2, category: "v8", role: "D/V", references: [] },
          { id: "v8.4.3", code: "8.4.3", title: "Balance Privacy and Utility", description: "Verify that defence parameters (ε for DP, noise σ, projection rank k) balance privacy ≥ 99 % token protection and utility ≤ 3 % accuracy loss.", level: 3, category: "v8", role: "V", references: [] },
          { id: "v8.4.4", code: "8.4.4", title: "Include Inversion-Resilience in Release Gates", description: "Verify that inversion-resilience metrics are part of release gates for model updates, with regression budgets defined.", level: 3, category: "v8", role: "D/V", references: [] },
      ]},
      { id: "v8.5", code: "C8.5", name: "Scope Enforcement for User-Specific Memory", requirements: [
          { id: "v8.5.1", code: "8.5.1", title: "Post-Filter Retrieval Queries", description: "Verify that every retrieval query is post-filtered by tenant/user ID before being passed to the LLM prompt.", level: 1, category: "v8", role: "D/V", references: [] },
          { id: "v8.5.2", code: "8.5.2", title: "Salt Collection Names", description: "Verify that collection names or namespaced IDs are salted per user or tenant so vectors cannot collide across scopes.", level: 1, category: "v8", role: "D", references: [] },
          { id: "v8.5.3", code: "8.5.3", title: "Discard Out-of-Scope Similarity Results", description: "Verify that similarity results above a configurable distance threshold but outside the caller's scope are discarded and trigger security alerts.", level: 2, category: "v8", role: "D/V", references: [] },
          { id: "v8.5.4", code: "8.5.4", title: "Use Multi-Tenant Stress Tests", description: "Verify that multi-tenant stress tests simulate adversarial queries attempting to retrieve out-of-scope documents and demonstrate zero leakage.", level: 2, category: "v8", role: "V", references: [] },
          { id: "v8.5.5", code: "8.5.5", title: "Segregate Encryption Keys per Tenant", description: "Verify that encryption keys are segregated per tenant, ensuring cryptographic isolation even if physical storage is shared.", level: 3, category: "v8", role: "D/V", references: [] },
      ]},
      { id: "v8.6", code: "C8.6", name: "Advanced Memory System Security", requirements: [
          { id: "v8.6.1", code: "8.6.1", title: "Isolate Memory Types", description: "Verify that different memory types (episodic, semantic, working) have isolated security contexts with role-based access controls, separate encryption keys, and documented access patterns for each memory type.", level: 1, category: "v8", role: "D/V", references: [] },
          { id: "v8.6.2", code: "8.6.2", title: "Validate Memory Consolidation Processes", description: "Verify that memory consolidation processes include security validation to prevent injection of malicious memories through content sanitization, source verification, and integrity checks before storage.", level: 2, category: "v8", role: "D/V", references: [] },
          { id: "v8.6.3", code: "8.6.3", title: "Validate and Sanitize Memory Retrieval Queries", description: "Verify that memory retrieval queries are validated and sanitized to prevent extraction of unauthorized information through query pattern analysis, access control enforcement, and result filtering.", level: 2, category: "v8", role: "D/V", references: [] },
          { id: "v8.6.4", code: "8.6.4", title: "Securely Delete Sensitive Information", description: "Verify that memory forgetting mechanisms securely delete sensitive information with cryptographic erasure guarantees using key deletion, multi-pass overwriting, or hardware-based secure deletion with verification certificates.", level: 3, category: "v8", role: "D/V", references: [] },
          { id: "v8.6.5", code: "8.6.5", title: "Monitor Memory System Integrity", description: "Verify that memory system integrity is continuously monitored for unauthorized modifications or corruption through checksums, audit logs, and automated alerts when memory content changes outside normal operations.", level: 3, category: "v8", role: "D/V", references: [] },
      ]},
    ],
    references: [
      { title: "Vector database security: Pinecone – IronCore Labs", url: "https://ironcorelabs.com/vectordbs/pinecone-security/" },
      { title: "Securing the Backbone of AI: Safeguarding Vector Databases and Embeddings – Privacera", url: "https://privacera.com/blog/securing-the-backbone-of-ai-safeguarding-vector-databases-and-embeddings/" },
      { title: "Enhancing Data Security with RBAC of Qdrant Vector Database – AI Advances", url: "https://ai.gopubby.com/enhancing-data-security-with-role-based-access-control-of-qdrant-vector-database-3878769bec83" },
      { title: "Mitigating Privacy Risks in LLM Embeddings from Embedding Inversion – arXiv", url: "https://arxiv.org/html/2411.05034v1" },
      { title: "DPPN: Detecting and Perturbing Privacy-Sensitive Neurons – OpenReview", url: "https://openreview.net/forum?id=DF5TVzpTW0" },
      { title: "Art. 17 GDPR – Right to Erasure", url: "https://gdpr-info.eu/art-17-gdpr/" },
      { title: "Sensitive Data in Text Embeddings Is Recoverable – Tonic.ai", url: "https://www.tonic.ai/blog/sensitive-data-in-text-embeddings-is-recoverable" },
      { title: "PII Identification and Removal – NVIDIA NeMo Docs", url: "https://docs.nvidia.com/nemo-framework/user-guide/latest/datacuration/personalidentifiableinformationidentificationandremoval.html" },
      { title: "De-identifying Sensitive Data – Google Cloud DLP", url: "https://cloud.google.com/sensitive-data-protection/docs/deidentify-sensitive-data" },
      { title: "Remove PII from Conversations Using Sensitive Information Filters – AWS Bedrock Guardrails", url: "https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails-sensitive-filters.html" },
      { title: "Think Your RAG Is Secure? Think Again – Medium", url: "https://medium.com/%40vijay.poudel1/think-your-rag-is-secure-think-again-heres-how-to-actually-lock-it-down-c4c30e3864e7" },
      { title: "Design a Secure Multitenant RAG Inferencing Solution – Microsoft Learn", url: "https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/secure-multitenant-rag" },
      { title: "Best Practices for Multi-Tenancy RAG with Milvus – Milvus Blog", url: "https://milvus.io/blog/build-multi-tenancy-rag-with-milvus-best-practices-part-one.md" },
    ]
  },
  "v9": {
    id: "v9",
    code: "C9",
    name: "Autonomous Orchestration & Agentic Action Security",
    description: "Ensure that autonomous or multi-agent AI systems can only execute actions that are explicitly intended, authenticated, auditable, and within bounded cost and risk thresholds. This protects against threats such as Autonomous-System Compromise, Tool Misuse, Agent Loop Detection, Communication Hijacking, Identity Spoofing, Swarm Manipulation, and Intent Manipulation.",
    color: "#a855f7",
    icon: "git-branch-plus",
    subCategories: [
      { id: "v9.1", code: "C9.1", name: "Agent Task-Planning & Recursion Budgets", requirements: [
          { id: "v9.1.1", code: "9.1.1", title: "Centrally Configure and Version-Control Budgets", description: "Verify that maximum recursion depth, breadth, wall-clock time, tokens, and monetary cost per agent execution are centrally configured and version-controlled.", level: 1, category: "v9", role: "D/V", references: [] },
          { id: "v9.1.2", code: "9.1.2", title: "Require Human Approval for Privileged Actions", description: "Verify that privileged or irreversible actions (e.g., code commits, financial transfers) require explicit human approval via an auditable channel before execution.", level: 1, category: "v9", role: "D/V", references: [] },
          { id: "v9.1.3", code: "9.1.3", title: "Trigger Circuit-Breaker on Exceeded Thresholds", description: "Verify that real-time resource monitors trigger circuit-breaker interruption when any budget threshold is exceeded, halting further task expansion.", level: 2, category: "v9", role: "D", references: [] },
          { id: "v9.1.4", code: "9.1.4", title: "Log Circuit-Breaker Events for Forensic Review", description: "Verify that circuit-breaker events are logged with agent ID, triggering condition, and captured plan state for forensic review.", level: 2, category: "v9", role: "D/V", references: [] },
          { id: "v9.1.5", code: "9.1.5", title: "Test for Budget Exhaustion and Runaway Scenarios", description: "Verify that security tests cover budget-exhaustion and runaway-plan scenarios, confirming safe halting without data loss.", level: 3, category: "v9", role: "V", references: [] },
          { id: "v9.1.6", code: "9.1.6", title: "Express Budget Policies as Policy-as-Code", description: "Verify that budget policies are expressed as policy-as-code and enforced in CI/CD to block configuration drift.", level: 3, category: "v9", role: "D", references: [] },
      ]},
      { id: "v9.2", code: "C9.2", name: "Tool Plugin Sandboxing", requirements: [
          { id: "v9.2.1", code: "9.2.1", title: "Execute Tools in Least-Privilege Sandboxes", description: "Verify that every tool/plugin executes inside an OS, container, or WASM-level sandbox with least-privilege file-system, network, and system-call policies.", level: 1, category: "v9", role: "D/V", references: [] },
          { id: "v9.2.2", code: "9.2.2", title: "Enforce and Log Sandbox Resource Quotas", description: "Verify that sandbox resource quotas (CPU, memory, disk, network egress) and execution timeouts are enforced and logged.", level: 1, category: "v9", role: "D/V", references: [] },
          { id: "v9.2.3", code: "9.2.3", title: "Validate Tool Signatures Before Loading", description: "Verify that tool binaries or descriptors are digitally signed; signatures are validated before loading.", level: 2, category: "v9", role: "D/V", references: [] },
          { id: "v9.2.4", code: "9.2.4", title: "Stream Sandbox Telemetry to SIEM for Alerting", description: "Verify that sandbox telemetry streams to a SIEM; anomalies (e.g., attempted outbound connections) raise alerts.", level: 2, category: "v9", role: "V", references: [] },
          { id: "v9.2.5", code: "9.2.5", title: "Conduct Security Reviews for High-Risk Plugins", description: "Verify that high-risk plugins undergo security review and penetration testing before production deployment.", level: 3, category: "v9", role: "V", references: [] },
          { id: "v9.2.6", code: "9.2.6", title: "Automatically Block and Quarantine on Escape Attempts", description: "Verify that sandbox escape attempts are automatically blocked and the offending plugin is quarantined pending investigation.", level: 3, category: "v9", role: "D/V", references: [] },
      ]},
      { id: "v9.3", code: "C9.3", name: "Autonomous Loop & Cost Bounding", requirements: [
          { id: "v9.3.1", code: "9.3.1", title: "Enforce Hop-Limits or TTL in Inter-Agent Calls", description: "Verify that inter-agent calls include a hop-limit or TTL that the runtime decrements and enforces.", level: 1, category: "v9", role: "D/V", references: [] },
          { id: "v9.3.2", code: "9.3.2", title: "Use Unique Invocation-Graph IDs to Detect Cycles", description: "Verify that agents maintain a unique invocation-graph ID to spot self-invocation or cyclical patterns.", level: 2, category: "v9", role: "D", references: [] },
          { id: "v9.3.3", code: "9.3.3", title: "Track Cumulative Counters and Abort on Breach", description: "Verify that cumulative compute-unit and spend counters are tracked per request chain; breaching the limit aborts the chain.", level: 2, category: "v9", role: "D/V", references: [] },
          { id: "v9.3.4", code: "9.3.4", title: "Formally Analyze for Unbounded Recursion", description: "Verify that formal analysis or model checking demonstrates absence of unbounded recursion in agent protocols.", level: 3, category: "v9", role: "V", references: [] },
          { id: "v9.3.5", code: "9.3.5", title: "Generate Alerts from Loop-Abort Events", description: "Verify that loop-abort events generate alerts and feed continuous-improvement metrics.", level: 3, category: "v9", role: "D", references: [] },
      ]},
      { id: "v9.4", code: "C9.4", name: "Protocol-Level Misuse Protection", requirements: [
          { id: "v9.4.1", code: "9.4.1", title: "Authenticate and Encrypt All Agent Communications", description: "Verify that all agent-to-tool and agent-to-agent messages are authenticated (e.g., mutual TLS or JWT) and end-to-end encrypted.", level: 1, category: "v9", role: "D/V", references: [] },
          { id: "v9.4.2", code: "9.4.2", title: "Strictly Validate Schemas and Reject Malformed Messages", description: "Verify that schemas are strictly validated; unknown fields or malformed messages are rejected.", level: 1, category: "v9", role: "D", references: [] },
          { id: "v9.4.3", code: "9.4.3", title: "Use Integrity Checks for Message Payloads", description: "Verify that integrity checks (MACs or digital signatures) cover the entire message payload including tool parameters.", level: 2, category: "v9", role: "D/V", references: [] },
          { id: "v9.4.4", code: "9.4.4", title: "Enforce Replay Protection", description: "Verify that replay-protection (nonces or timestamp windows) is enforced at the protocol layer.", level: 2, category: "v9", role: "D", references: [] },
          { id: "v9.4.5", code: "9.4.5", title: "Test Protocol Implementations for Flaws", description: "Verify that protocol implementations undergo fuzzing and static analysis for injection or deserialization flaws.", level: 3, category: "v9", role: "V", references: [] },
      ]},
      { id: "v9.5", code: "C9.5", name: "Agent Identity & Tamper-Evidence", requirements: [
          { id: "v9.5.1", code: "9.5.1", title: "Assign Unique Cryptographic Identities to Agents", description: "Verify that each agent instance possesses a unique cryptographic identity (key-pair or hardware-rooted credential).", level: 1, category: "v9", role: "D/V", references: [] },
          { id: "v9.5.2", code: "9.5.2", title: "Sign and Timestamp All Agent Actions", description: "Verify that all agent actions are signed and timestamped; logs include the signature for non-repudiation.", level: 2, category: "v9", role: "D/V", references: [] },
          { id: "v9.5.3", code: "9.5.3", title: "Store Logs in a Tamper-Evident Medium", description: "Verify that tamper-evident logs are stored in an append-only or write-once medium.", level: 2, category: "v9", role: "V", references: [] },
          { id: "v9.5.4", code: "9.5.4", title: "Rotate Identity Keys on a Defined Schedule", description: "Verify that identity keys rotate on a defined schedule and on compromise indicators.", level: 3, category: "v9", role: "D", references: [] },
          { id: "v9.5.5", code: "9.5.5", title: "Quarantine Agents on Spoofing or Key-Conflict Attempts", description: "Verify that spoofing or key-conflict attempts trigger immediate quarantine of the affected agent.", level: 3, category: "v9", role: "D/V", references: [] },
      ]},
      { id: "v9.6", code: "C9.6", name: "Multi-Agent Swarm Risk Reduction", requirements: [
          { id: "v9.6.1", code: "9.6.1", title: "Isolate Agents in Different Security Domains", description: "Verify that agents operating in different security domains execute in isolated runtime sandboxes or network segments.", level: 1, category: "v9", role: "D/V", references: [] },
          { id: "v9.6.2", code: "9.6.2", title: "Formally Verify Swarm Behaviors for Safety", description: "Verify that swarm behaviors are modeled and formally verified for liveness and safety before deployment.", level: 3, category: "v9", role: "V", references: [] },
          { id: "v9.6.3", code: "9.6.3", title: "Monitor Runtimes for Emergent Unsafe Patterns", description: "Verify that runtime monitors detect emergent unsafe patterns (e.g., oscillations, deadlocks) and initiate corrective action.", level: 3, category: "v9", role: "D", references: [] },
      ]},
      { id: "v9.7", code: "C9.7", name: "User & Tool Authentication / Authorization", requirements: [
          { id: "v9.7.1", code: "9.7.1", title: "Authenticate Agents as First-Class Principals", description: "Verify that agents authenticate as first-class principals to downstream systems, never reusing end-user credentials.", level: 1, category: "v9", role: "D/V", references: [] },
          { id: "v9.7.2", code: "9.7.2", title: "Implement Fine-Grained Authorization Policies", description: "Verify that fine-grained authorization policies restrict which tools an agent may invoke and which parameters it may supply.", level: 2, category: "v9", role: "D", references: [] },
          { id: "v9.7.3", code: "9.7.3", title: "Re-evaluate Privileges on Every Call (Continuous Authorization)", description: "Verify that privilege checks are re-evaluated on every call (continuous authorization), not only at session start.", level: 2, category: "v9", role: "V", references: [] },
          { id: "v9.7.4", code: "9.7.4", title: "Automatically Expire Delegated Privileges", description: "Verify that delegated privileges expire automatically and require re-consent after timeout or scope change.", level: 3, category: "v9", role: "D", references: [] },
      ]},
      { id: "v9.8", code: "C9.8", name: "Agent-to-Agent Communication Security", requirements: [
          { id: "v9.8.1", code: "9.8.1", title: "Mandate Mutual Authentication and Encryption for Agent Channels", description: "Verify that mutual authentication and perfect-forward-secret encryption (e.g. TLS 1.3) are mandatory for agent channels.", level: 1, category: "v9", role: "D/V", references: [] },
          { id: "v9.8.2", code: "9.8.2", title: "Validate Message Integrity and Origin", description: "Verify that message integrity and origin are validated before processing; failures raise alerts and drop the message.", level: 1, category: "v9", role: "D", references: [] },
          { id: "v9.8.3", code: "9.8.3", title: "Log Communication Metadata for Forensics", description: "Verify that communication metadata (timestamps, sequence numbers) is logged to support forensic reconstruction.", level: 2, category: "v9", role: "D/V", references: [] },
          { id: "v9.8.4", code: "9.8.4", title: "Formally Verify Protocol State Machines", description: "Verify that formal verification or model checking confirms that protocol state machines cannot be driven into unsafe states.", level: 3, category: "v9", role: "V", references: [] },
      ]},
      { id: "v9.9", code: "C9.9", name: "Intent Verification & Constraint Enforcement", requirements: [
          { id: "v9.9.1", code: "9.9.1", title: "Use Pre-Execution Constraint Solvers", description: "Verify that pre-execution constraint solvers check proposed actions against hard-coded safety and policy rules.", level: 1, category: "v9", role: "D", references: [] },
          { id: "v9.9.2", code: "9.9.2", title: "Require User Confirmation for High-Impact Actions", description: "Verify that high-impact actions (financial, destructive, privacy-sensitive) require explicit intent confirmation from the initiating user.", level: 2, category: "v9", role: "D/V", references: [] },
          { id: "v9.9.3", code: "9.9.3", title: "Use Post-Condition Checks to Validate Effects", description: "Verify that post-condition checks validate that completed actions achieved intended effects without side effects; discrepancies trigger rollback.", level: 2, category: "v9", role: "V", references: [] },
          { id: "v9.9.4", code: "9.9.4", title: "Use Formal Methods to Demonstrate Constraint Satisfaction", description: "Verify that formal methods (e.g., model checking, theorem proving) or property-based tests demonstrate that agent plans satisfy all declared constraints.", level: 3, category: "v9", role: "V", references: [] },
          { id: "v9.9.5", code: "9.9.5", title: "Use Incidents to Feed Improvement Cycles", description: "Verify that intent-mismatch or constraint-violation incidents feed continuous-improvement cycles and threat-intel sharing.", level: 3, category: "v9", role: "D", references: [] },
      ]},
      { id: "v9.10", code: "C9.10", name: "Agent Reasoning Strategy Security", requirements: [
          { id: "v9.10.1", code: "9.10.1", title: "Use Deterministic Criteria for Strategy Selection", description: "Verify that reasoning strategy selection uses deterministic criteria (input complexity, task type, security context) and identical inputs produce identical strategy selections within the same security context.", level: 1, category: "v9", role: "D/V", references: [] },
          { id: "v9.10.2", code: "9.10.2", title: "Implement Dedicated Security Controls for Each Strategy", description: "Verify that each reasoning strategy (ReAct, Chain-of-Thought, Tree-of-Thoughts) has dedicated input validation, output sanitization, and execution time limits specific to its cognitive approach.", level: 1, category: "v9", role: "D/V", references: [] },
          { id: "v9.10.3", code: "9.10.3", title: "Log Reasoning Strategy Transitions with Full Context", description: "Verify that reasoning strategy transitions are logged with complete context including input characteristics, selection criteria values, and execution metadata for audit trail reconstruction.", level: 2, category: "v9", role: "D/V", references: [] },
          { id: "v9.10.4", code: "9.10.4", title: "Implement Branch Pruning in Tree-of-Thoughts Reasoning", description: "Verify that Tree-of-Thoughts reasoning includes branch pruning mechanisms that terminate exploration when policy violations, resource limits, or safety boundaries are detected.", level: 2, category: "v9", role: "D/V", references: [] },
          { id: "v9.10.5", code: "9.10.5", title: "Include Validation Checkpoints in ReAct Cycles", description: "Verify that ReAct (Reason-Act-Observe) cycles include validation checkpoints at each phase: reasoning step verification, action authorization, and observation sanitization before proceeding.", level: 2, category: "v9", role: "D/V", references: [] },
          { id: "v9.10.6", code: "9.10.6", title: "Monitor Reasoning Strategy Performance Metrics", description: "Verify that reasoning strategy performance metrics (execution time, resource usage, output quality) are monitored with automated alerts when metrics deviate beyond configured thresholds.", level: 3, category: "v9", role: "D/V", references: [] },
          { id: "v9.10.7", code: "9.10.7", title: "Maintain Security Controls in Hybrid Reasoning Approaches", description: "Verify that hybrid reasoning approaches that combine multiple strategies maintain input validation and output constraints of all constituent strategies without bypassing any security controls.", level: 3, category: "v9", role: "D/V", references: [] },
          { id: "v9.10.8", code: "9.10.8", title: "Conduct Security Testing for Reasoning Strategies", description: "Verify that reasoning strategy security testing includes fuzzing with malformed inputs, adversarial prompts designed to force strategy switching, and boundary condition testing for each cognitive approach.", level: 3, category: "v9", role: "D/V", references: [] },
      ]},
      { id: "v9.11", code: "C9.11", name: "Agent Lifecycle State Management & Security", requirements: [
          { id: "v9.11.1", code: "9.11.1", title: "Establish Cryptographic Identity and Immutable Logs at Initialization", description: "Verify that agent initialization includes cryptographic identity establishment with hardware-backed credentials and immutable startup audit logs containing agent ID, timestamp, configuration hash, and initialization parameters.", level: 1, category: "v9", role: "D/V", references: [] },
          { id: "v9.11.2", code: "9.11.2", title: "Cryptographically Sign and Log State Transitions", description: "Verify that agent state transitions are cryptographically signed, timestamped, and logged with complete context including triggering events, previous state hash, new state hash, and security validations performed.", level: 2, category: "v9", role: "D/V", references: [] },
          { id: "v9.11.3", code: "9.11.3", title: "Implement Secure Shutdown Procedures", description: "Verify that agent shutdown procedures include secure memory wiping using cryptographic erasure or multi-pass overwriting, credential revocation with certificate authority notification, and generation of tamper-evident termination certificates.", level: 2, category: "v9", role: "D/V", references: [] },
          { id: "v9.11.4", code: "9.11.4", title: "Implement Secure Agent Recovery Mechanisms", description: "Verify that agent recovery mechanisms validate state integrity using cryptographic checksums (SHA-256 minimum) and rollback to known-good states when corruption is detected with automated alerts and manual approval requirements.", level: 3, category: "v9", role: "D/V", references: [] },
          { id: "v9.11.5", code: "9.11.5", title: "Encrypt Sensitive State Data with Secure Key Rotation", description: "Verify that agent persistence mechanisms encrypt sensitive state data with per-agent AES-256 keys and implement secure key rotation on configurable schedules (maximum 90 days) with zero-downtime deployment.", level: 3, category: "v9", role: "D/V", references: [] },
      ]},
      { id: "v9.12", code: "C9.12", name: "Tool Integration Security Framework", requirements: [
          { id: "v9.12.1", code: "9.12.1", title: "Include Security Metadata in Tool Descriptors", description: "Verify that tool descriptors include security metadata specifying required privileges (read/write/execute), risk levels (low/medium/high), resource limits (CPU, memory, network), and validation requirements documented in tool manifests.", level: 1, category: "v9", role: "D/V", references: [] },
          { id: "v9.12.2", code: "9.12.2", title: "Validate Tool Execution Results Against Schemas and Policies", description: "Verify that tool execution results are validated against expected schemas (JSON Schema, XML Schema) and security policies (output sanitization, data classification) before integration with timeout limits and error handling procedures.", level: 1, category: "v9", role: "D/V", references: [] },
          { id: "v9.12.3", code: "9.12.3", title: "Log Tool Interactions with Detailed Security Context", description: "Verify that tool interaction logs include detailed security context including privilege usage, data access patterns, execution time, resource consumption, and return codes with structured logging for SIEM integration.", level: 2, category: "v9", role: "D/V", references: [] },
          { id: "v9.12.4", code: "9.12.4", title: "Validate Signatures and Isolate Dynamic Tool Loading", description: "Verify that dynamic tool loading mechanisms validate digital signatures using PKI infrastructure and implement secure loading protocols with sandbox isolation and permission verification before execution.", level: 2, category: "v9", role: "D/V", references: [] },
          { id: "v9.12.5", code: "9.12.5", title: "Automate Tool Security Assessments with Mandatory Approval Gates", description: "Verify that tool security assessments are automatically triggered for new versions with mandatory approval gates including static analysis, dynamic testing, and security team review with documented approval criteria and SLA requirements.", level: 3, category: "v9", role: "D/V", references: [] },
      ]},
    ],
    references: [
      { title: "MITRE ATLAS tactics ML09", url: "https://atlas.mitre.org/" },
      { title: "Circuit-breaker research for AI agents — Zou et al., 2024", url: "https://arxiv.org/abs/2406.04313" },
      { title: "Trend Micro analysis of sandbox escapes in AI agents — Park, 2025", url: "https://www.trendmicro.com/vinfo/us/security/news/cybercrime-and-digital-threats/unveiling-ai-agent-vulnerabilities-code-execution" },
      { title: "Auth0 guidance on human-in-the-loop authorization for agents — Martinez, 2025", url: "https://auth0.com/blog/secure-human-in-the-loop-interactions-for-ai-agents/" },
      { title: "Medium deep-dive on MCP & A2A protocol hijacking — ForAISec, 2025", url: "https://medium.com/%40foraisec/security-analysis-potential-ai-agent-hijacking-via-mcp-and-a2a-protocol-insights-cd1ec5e6045f" },
      { title: "Rapid7 fundamentals on spoofing attack prevention — 2024", url: "https://www.rapid7.com/fundamentals/spoofing-attacks/" },
      { title: "Imperial College verification of swarm systems — Lomuscio et al.", url: "https://sail.doc.ic.ac.uk/projects/swarms/" },
      { title: "NIST AI Risk Management Framework 1.0, 2023", url: "https://nvlpubs.nist.gov/nistpubs/ai/nist.ai.100-1.pdf" },
      { title: "WIRED security briefing on encryption best practices, 2024", url: "https://www.wired.com/story/encryption-apps-chinese-telecom-hacking-hydra-russia-exxon" },
      { title: "OWASP Top 10 for LLM Applications, 2025", url: "https://owasp.org/www-project-top-10-for-large-language-model-applications/" },
      { title: "Comprehensive Vulnerability Analysis is Necessary for Trustworthy LLM-MAS", url: "https://arxiv.org/html/2506.01245v1" },
      { title: "How Is LLM Reasoning Distracted by Irrelevant Context?", url: "https://www.arxiv.org/pdf/2505.18761" },
      { title: "Large Language Model Sentinel: LLM Agent for Adversarial Purification", url: "https://arxiv.org/pdf/2405.20770" },
      { title: "Securing Agentic AI: A Comprehensive Threat Model and Mitigation Framework", url: "https://arxiv.org/html/2504.19956v2" },
    ]
  },
  "v10": {
    id: "v10",
    code: "C10",
    name: "Adversarial Robustness & Privacy Defense",
    description: "Ensure that AI models remain reliable, privacy-preserving, and abuse-resistant when facing evasion, inference, extraction, or poisoning attacks.",
    color: "#ec4899",
    icon: "shield-alert",
    subCategories: [
      { id: "v10.1", code: "C10.1", name: "Model Alignment & Safety", requirements: [
          { id: "v10.1.1", code: "10.1.1", title: "Maintain and Run an Alignment Test Suite", description: "Verify that an alignment test-suite (red-team prompts, jailbreak probes, disallowed content) is version-controlled and run on every model release.", level: 1, category: "v10", role: "D/V", references: [] },
          { id: "v10.1.2", code: "10.1.2", title: "Enforce Refusal and Safe-Completion Guard-rails", description: "Verify that refusal and safe-completion guard-rails are enforced.", level: 1, category: "v10", role: "D", references: [] },
          { id: "v10.1.3", code: "10.1.3", title: "Automatically Evaluate and Flag Regressions in Harmful Content Rate", description: "Verify that an automated evaluator measures harmful-content rate and flags regressions beyond a set threshold.", level: 2, category: "v10", role: "D/V", references: [] },
          { id: "v10.1.4", code: "10.1.4", title: "Document and Ensure Reproducibility of Counter-Jailbreak Training", description: "Verify that counter-jailbreak training is documented and reproducible.", level: 2, category: "v10", role: "D", references: [] },
          { id: "v10.1.5", code: "10.1.5", title: "Use Formal Proofs for Policy Compliance in Critical Domains", description: "Verify that formal policy-compliance proofs or certified monitoring cover critical domains.", level: 3, category: "v10", role: "V", references: [] },
      ]},
      { id: "v10.2", code: "C10.2", name: "Adversarial-Example Hardening", requirements: [
          { id: "v10.2.1", code: "10.2.1", title: "Include Reproducible Adversarial-Training Configurations", description: "Verify that project repositories include adversarial-training configurations with reproducible seeds.", level: 1, category: "v10", role: "D", references: [] },
          { id: "v10.2.2", code: "10.2.2", title: "Raise Blocking Alerts for Adversarial-Example Detection", description: "Verify that adversarial-example detection raises blocking alerts in production pipelines.", level: 2, category: "v10", role: "D/V", references: [] },
          { id: "v10.2.4", code: "10.2.4", title: "Provide Certified-Robustness Proofs for Critical Classes", description: "Verify that certified‐robustness proofs or interval-bound certificates cover at least the top critical classes.", level: 3, category: "v10", role: "V", references: [] },
          { id: "v10.2.5", code: "10.2.5", title: "Use Adaptive Attacks in Regression Tests to Confirm Robustness", description: "Verify that regression tests use adaptive attacks to confirm no measurable robustness loss.", level: 3, category: "v10", role: "V", references: [] },
      ]},
      { id: "v10.3", code: "C10.3", name: "Membership-Inference Mitigation", requirements: [
          { id: "v10.3.1", code: "10.3.1", title: "Use Regularization or Scaling to Reduce Overconfident Predictions", description: "Verify that per-query entropy regularisation or temperature-scaling reduces overconfident predictions.", level: 1, category: "v10", role: "D", references: [] },
          { id: "v10.3.2", code: "10.3.2", title: "Employ Differentially-Private Optimization for Sensitive Datasets", description: "Verify that training employs ε-bounded differentially-private optimization for sensitive datasets.", level: 2, category: "v10", role: "D", references: [] },
          { id: "v10.3.3", code: "10.3.3", title: "Ensure Attack Simulations Show Low Attack AUC", description: "Verify that attack simulations (shadow-model or black-box) show attack AUC ≤ 0.60 on held-out data.", level: 2, category: "v10", role: "V", references: [] },
      ]},
      { id: "v10.4", code: "C10.4", name: "Model-Inversion Resistance", requirements: [
          { id: "v10.4.1", code: "10.4.1", title: "Avoid Direct Output of Sensitive Attributes", description: "Verify that sensitive attributes are never directly output; where needed, use buckets or one-way transforms.", level: 1, category: "v10", role: "D", references: [] },
          { id: "v10.4.2", code: "10.4.2", title: "Throttle Repeated Adaptive Queries with Rate Limits", description: "Verify that query-rate limits throttle repeated adaptive queries from the same principal.", level: 1, category: "v10", role: "D/V", references: [] },
          { id: "v10.4.3", code: "10.4.3", title: "Train the Model with Privacy-Preserving Noise", description: "Verify that the model is trained with privacy-preserving noise.", level: 2, category: "v10", role: "D", references: [] },
      ]},
      { id: "v10.5", code: "C10.5", name: "Model-Extraction Defense", requirements: [
          { id: "v10.5.1", code: "10.5.1", title: "Enforce Rate Limits Tuned to Memorization Threshold", description: "Verify that inference gateways enforce global and per-API-key rate limits tuned to the model's memorization threshold.", level: 1, category: "v10", role: "D", references: [] },
          { id: "v10.5.2", code: "10.5.2", title: "Use Automated Detectors for Query Entropy and Input Plurality", description: "Verify that query-entropy and input-plurality statistics feed an automated extraction detector.", level: 2, category: "v10", role: "D/V", references: [] },
          { id: "v10.5.3", code: "10.5.3", title: "Ensure Provable Watermarks Against Suspected Clones", description: "Verify that fragile or probabilistic watermarks can be proved with p < 0.01 in ≤ 1 000 queries against a suspected clone.", level: 2, category: "v10", role: "V", references: [] },
          { id: "v10.5.4", code: "10.5.4", title: "Securely Store and Rotate Watermark Keys", description: "Verify that watermark keys and trigger sets are stored in a hardware-security-module and rotated yearly.", level: 3, category: "v10", role: "D", references: [] },
          { id: "v10.5.5", code: "10.5.5", title: "Integrate Extraction-Alert Events with Incident Response", description: "Verify that extraction-alert events include offending queries and are integrated with incident-response playbooks.", level: 3, category: "v10", role: "V", references: [] },
      ]},
      { id: "v10.6", code: "C10.6", name: "Inference-Time Poisoned-Data Detection", requirements: [
          { id: "v10.6.1", code: "10.6.1", title: "Use Anomaly Detectors for Inputs Before Inference", description: "Verify that inputs pass through an anomaly detector (e.g., STRIP, consistency-scoring) before model inference.", level: 1, category: "v10", role: "D", references: [] },
          { id: "v10.6.2", code: "10.6.2", title: "Tune Detector Thresholds to Minimize False Positives", description: "Verify that detector thresholds are tuned on clean/poisoned validation sets to achieve less that 5% false positives.", level: 1, category: "v10", role: "V", references: [] },
          { id: "v10.6.3", code: "10.6.3", title: "Trigger Soft-Blocking and Human Review for Poisoned Inputs", description: "Verify that inputs flagged as poisoned trigger soft-blocking and human review workflows.", level: 2, category: "v10", role: "D", references: [] },
          { id: "v10.6.4", code: "10.6.4", title: "Stress-Test Detectors with Adaptive, Triggerless Backdoor Attacks", description: "Verify that detectors are stress-tested with adaptive, triggerless backdoor attacks.", level: 2, category: "v10", role: "V", references: [] },
          { id: "v10.6.5", code: "10.6.5", title: "Log and Re-evaluate Detection Efficacy Metrics", description: "Verify that detection efficacy metrics are logged and periodically re-evaluated with fresh threat intel.", level: 3, category: "v10", role: "D", references: [] },
      ]},
      { id: "v10.7", code: "C10.7", name: "Dynamic Security Policy Adaptation", requirements: [
          { id: "v10.7.1", code: "10.7.1", title: "Enable Dynamic Policy Updates without Restart", description: "Verify that security policies can be updated dynamically without agent restart while maintaining policy version integrity.", level: 1, category: "v10", role: "D/V", references: [] },
          { id: "v10.7.2", code: "10.7.2", title: "Cryptographically Sign and Validate Policy Updates", description: "Verify that policy updates are cryptographically signed by authorized security personnel and validated before application.", level: 2, category: "v10", role: "D/V", references: [] },
          { id: "v10.7.3", code: "10.7.3", title: "Log Dynamic Policy Changes with Full Audit Trails", description: "Verify that dynamic policy changes are logged with full audit trails including justification, approval chains, and rollback procedures.", level: 2, category: "v10", role: "D/V", references: [] },
          { id: "v10.7.4", code: "10.7.4", title: "Adapt Threat Detection Sensitivity Based on Risk Context", description: "Verify that adaptive security mechanisms adjust threat detection sensitivity based on risk context and behavioral patterns.", level: 3, category: "v10", role: "D/V", references: [] },
          { id: "v10.7.5", code: "10.7.5", title: "Ensure Explainability of Policy Adaptation Decisions", description: "Verify that policy adaptation decisions are explainable and include evidence trails for security team review.", level: 3, category: "v10", role: "D/V", references: [] },
      ]},
      { id: "v10.8", code: "C10.8", name: "Reflection-Based Security Analysis", requirements: [
          { id: "v10.8.1", code: "10.8.1", title: "Include Security-Focused Self-Assessment in Agent Reflection", description: "Verify that agent reflection mechanisms include security-focused self-assessment of decisions and actions.", level: 1, category: "v10", role: "D/V", references: [] },
          { id: "v10.8.2", code: "10.8.2", title: "Validate Reflection Outputs to Prevent Manipulation", description: "Verify that reflection outputs are validated to prevent manipulation of self-assessment mechanisms by adversarial inputs.", level: 2, category: "v10", role: "D/V", references: [] },
          { id: "v10.8.3", code: "10.8.3", title: "Use Meta-Cognitive Analysis to Identify Security Risks", description: "Verify that meta-cognitive security analysis identifies potential bias, manipulation, or compromise in agent reasoning processes.", level: 2, category: "v10", role: "D/V", references: [] },
          { id: "v10.8.4", code: "10.8.4", title: "Trigger Enhanced Monitoring from Security Warnings", description: "Verify that reflection-based security warnings trigger enhanced monitoring and potential human intervention workflows.", level: 3, category: "v10", role: "D/V", references: [] },
          { id: "v10.8.5", code: "10.8.5", title: "Continuously Learn from Security Reflections", description: "Verify that continuous learning from security reflections improves threat detection without degrading legitimate functionality.", level: 3, category: "v10", role: "D/V", references: [] },
      ]},
      { id: "v10.9", code: "C10.9", name: "Evolution & Self-Improvement Security", requirements: [
          { id: "v10.9.1", code: "10.9.1", title: "Restrict Self-Modification to Safe Areas", description: "Verify that self-modification capabilities are restricted to designated safe areas with formal verification boundaries.", level: 1, category: "v10", role: "D/V", references: [] },
          { id: "v10.9.2", code: "10.9.2", title: "Assess Security Impact of Evolution Proposals", description: "Verify that evolution proposals undergo security impact assessment before implementation.", level: 2, category: "v10", role: "D/V", references: [] },
          { id: "v10.9.3", code: "10.9.3", title: "Include Rollback Capabilities in Self-Improvement", description: "Verify that self-improvement mechanisms include rollback capabilities with integrity verification.", level: 2, category: "v10", role: "D/V", references: [] },
          { id: "v10.9.4", code: "10.9.4", title: "Prevent Adversarial Manipulation of Improvement Algorithms", description: "Verify that meta-learning security prevents adversarial manipulation of improvement algorithms.", level: 3, category: "v10", role: "D/V", references: [] },
          { id: "v10.9.5", code: "10.9.5", title: "Bound Recursive Self-Improvement with Formal Safety Constraints", description: "Verify that recursive self-improvement is bounded by formal safety constraints with mathematical proofs of convergence.", level: 3, category: "v10", role: "D/V", references: [] },
      ]},
    ],
    references: [
      { title: "MITRE ATLAS adversary tactics for ML", url: "https://atlas.mitre.org/" },
      { title: "NIST AI Risk Management Framework 1.0, 2023", url: "https://nvlpubs.nist.gov/nistpubs/ai/nist.ai.100-1.pdf" },
      { title: "OWASP Top 10 for LLM Applications, 2025", url: "https://owasp.org/www-project-top-10-for-large-language-model-applications/" },
      { title: "Adversarial Training: A Survey — Zhao et al., 2024", url: "https://arxiv.org/abs/2410.15042" },
      { title: "RobustBench adversarial-robustness benchmark", url: "https://robustbench.github.io/" },
      { title: "Membership-Inference & Model-Inversion Risk Survey, 2025", url: "https://www.sciencedirect.com/science/article/abs/pii/S0950705125003867" },
      { title: "PURIFIER: Confidence-Score Defense against MI Attacks — AAAI 2023", url: "https://ojs.aaai.org/index.php/AAAI/article/view/26289" },
      { title: "Model-Inversion Attacks & Defenses Survey — AI Review, 2025", url: "https://link.springer.com/article/10.1007/s10462-025-11248-0" },
      { title: "Comprehensive Defense Framework Against Model Extraction — IEEE TDSC 2024", url: "https://doi.org/10.1109/TDSC.2023.3261327" },
      { title: "Fragile Model Watermarking Survey — 2025", url: "https://www.sciencedirect.com/science/article/abs/pii/S0165168425002026" },
      { title: "Data Poisoning in Deep Learning: A Survey — Zhao et al., 2025", url: "https://arxiv.org/abs/2503.22759" },
      { title: "BDetCLIP: Multimodal Prompting Backdoor Detection — Niu et al., 2024", url: "https://arxiv.org/abs/2405.15269" },
    ]
  },
  "v11": {
    id: "v11",
    code: "C11",
    name: "Privacy Protection & Personal Data Management",
    description: "Maintain rigorous privacy assurances across the entire AI lifecycle—collection, training, inference, and incident response—so that personal data is only processed with clear consent, minimum necessary scope, provable erasure, and formal privacy guarantees.",
    color: "#10b981",
    icon: "lock",
    subCategories: [
      { id: "v11.1", code: "C11.1", name: "Anonymization & Data Minimization", requirements: [
          { id: "v11.1.1", code: "11.1.1", title: "Remove or Hash Direct and Quasi-Identifiers", description: "Verify that direct and quasi-identifiers are removed, hashed.", level: 1, category: "v11", role: "D/V", references: [] },
          { id: "v11.1.2", code: "11.1.2", title: "Automate Audits for K-Anonymity/L-Diversity", description: "Verify that automated audits measure k-anonymity/l-diversity and alert when thresholds drop below policy.", level: 2, category: "v11", role: "D/V", references: [] },
          { id: "v11.1.3", code: "11.1.3", title: "Prove No Identifier Leakage via Feature Importance Reports", description: "Verify that model feature-importance reports prove no identifier leakage beyond ε = 0.01 mutual information.", level: 2, category: "v11", role: "V", references: [] },
          { id: "v11.1.4", code: "11.1.4", title: "Formally Prove or Certify Low Re-Identification Risk", description: "Verify that formal proofs or synthetic-data certification show re-identification risk ≤ 0.05 even under linkage attacks.", level: 3, category: "v11", role: "V", references: [] },
      ]},
      { id: "v11.2", code: "C11.2", name: "Right-to-be-Forgotten & Deletion Enforcement", requirements: [
          { id: "v11.2.1", code: "11.2.1", title: "Propagate Deletion Requests Across All Systems", description: "Verify that data-subject deletion requests propagate to raw datasets, checkpoints, embeddings, logs, and backups within service level agreements of less than 30 days.", level: 1, category: "v11", role: "D/V", references: [] },
          { id: "v11.2.2", code: "11.2.2", title: "Use Certified Machine-Unlearning Routines", description: "Verify that \"machine-unlearning\" routines physically re-train or approximate removal using certified unlearning algorithms.", level: 2, category: "v11", role: "D", references: [] },
          { id: "v11.2.3", code: "11.2.3", title: "Prove Minimal Influence of Forgotten Records Post-Unlearning", description: "Verify that shadow-model evaluation proves forgotten records influence less than 1% of outputs after unlearning.", level: 2, category: "v11", role: "V", references: [] },
          { id: "v11.2.4", code: "11.2.4", title: "Immutably Log Deletion Events for Audits", description: "Verify that deletion events are immutably logged and auditable for regulators.", level: 3, category: "v11", role: "V", references: [] },
      ]},
      { id: "v11.3", code: "C11.3", name: "Differential-Privacy Safeguards", requirements: [
          { id: "v11.3.1", code: "11.3.1", title: "Monitor Cumulative Privacy Loss", description: "Verify that privacy-loss accounting dashboards alert when cumulative ε exceeds policy thresholds.", level: 2, category: "v11", role: "D/V", references: [] },
          { id: "v11.3.2", code: "11.3.2", title: "Conduct Black-Box Privacy Audits to Estimate ε", description: "Verify that black-box privacy audits estimate ε̂ within 10% of declared value.", level: 2, category: "v11", role: "V", references: [] },
          { id: "v11.3.3", code: "11.3.3", title: "Provide Formal Proofs for Post-Training Modifications", description: "Verify that formal proofs cover all post-training fine-tunes and embeddings.", level: 3, category: "v11", role: "V", references: [] },
      ]},
      { id: "v11.4", code: "C11.4", name: "Purpose-Limitation & Scope-Creep Protection", requirements: [
          { id: "v11.4.1", code: "11.4.1", title: "Tag Datasets and Models with Machine-Readable Purpose", description: "Verify that every dataset and model checkpoint carries a machine-readable purpose tag aligned to the original consent.", level: 1, category: "v11", role: "D", references: [] },
          { id: "v11.4.2", code: "11.4.2", title: "Monitor Queries for Inconsistent Purpose", description: "Verify that runtime monitors detect queries inconsistent with declared purpose and trigger soft refusal.", level: 1, category: "v11", role: "D/V", references: [] },
          { id: "v11.4.3", code: "11.4.3", title: "Block Redeployment without DPIA Review via Policy-as-Code", description: "Verify that policy-as-code gates block redeployment of models to new domains without DPIA review.", level: 3, category: "v11", role: "D", references: [] },
          { id: "v11.4.4", code: "11.4.4", title: "Demonstrate Traceability to Consented Scope", description: "Verify that formal traceability proofs show every personal data lifecycle remains within consented scope.", level: 3, category: "v11", role: "V", references: [] },
      ]},
      { id: "v11.5", code: "C11.5", name: "Consent Management & Lawful-Basis Tracking", requirements: [
          { id: "v11.5.1", code: "11.5.1", title: "Use a Consent-Management Platform (CMP)", description: "Verify that a Consent-Management Platform (CMP) records opt-in status, purpose, and retention period per data-subject.", level: 1, category: "v11", role: "D/V", references: [] },
          { id: "v11.5.2", code: "11.5.2", title: "Validate Consent Token Scope Before Inference", description: "Verify that APIs expose consent tokens; models must validate token scope before inference.", level: 2, category: "v11", role: "D", references: [] },
          { id: "v11.5.3", code: "11.5.3", title: "Halt Processing on Denied or Withdrawn Consent", description: "Verify that denied or withdrawn consent halts processing pipelines within 24 hours.", level: 2, category: "v11", role: "D/V", references: [] },
      ]},
      { id: "v11.6", code: "C11.6", name: "Federated Learning with Privacy Controls", requirements: [
          { id: "v11.6.1", code: "11.6.1", title: "Employ Local Differential Privacy for Client Updates", description: "Verify that client updates employ local differential privacy noise addition before aggregation.", level: 1, category: "v11", role: "D", references: [] },
          { id: "v11.6.2", code: "11.6.2", title: "Ensure Training Metrics are Differentially Private", description: "Verify that training metrics are differentially private and never reveal single-client loss.", level: 2, category: "v11", role: "D/V", references: [] },
          { id: "v11.6.3", code: "11.6.3", title: "Enable Poisoning-Resistant Aggregation", description: "Verify that poisoning-resistant aggregation (e.g., Krum/Trimmed-Mean) is enabled.", level: 2, category: "v11", role: "V", references: [] },
          { id: "v11.6.4", code: "11.6.4", title: "Formally Prove Overall ε Budget with Minimal Utility Loss", description: "Verify that formal proofs demonstrate overall ε budget with less than 5 utility loss.", level: 3, category: "v11", role: "V", references: [] },
      ]},
    ],
    references: [
      { title: "GDPR & AI Compliance Best Practices", url: "https://www.exabeam.com/explainers/gdpr-compliance/the-intersection-of-gdpr-and-ai-and-6-compliance-best-practices/" },
      { title: "EU Parliament Study on GDPR & AI, 2020", url: "https://www.europarl.europa.eu/RegData/etudes/STUD/2020/641530/EPRS_STU%282020%29641530_EN.pdf" },
      { title: "ISO 31700-1:2023 — Privacy by Design for Consumer Products", url: "https://www.iso.org/standard/84977.html" },
      { title: "NIST Privacy Framework 1.1 (2025 Draft)", url: "https://www.nist.gov/privacy-framework" },
      { title: "Machine Unlearning: Right-to-Be-Forgotten Techniques", url: "https://www.kaggle.com/code/tamlhp/machine-unlearning-the-right-to-be-forgotten" },
      { title: "A Survey of Machine Unlearning, 2024", url: "https://arxiv.org/html/2209.02299v6" },
      { title: "Auditing DP-SGD — ArXiv 2024", url: "https://arxiv.org/html/2405.14106v4" },
      { title: "DP-SGD Explained — PyTorch Blog", url: "https://medium.com/pytorch/differential-privacy-series-part-1-dp-sgd-algorithm-explained-12512c3959a3" },
      { title: "Purpose-Limitation for AI — IJLIT 2025", url: "https://academic.oup.com/ijlit/article/doi/10.1093/ijlit/eaaf003/8121663" },
      { title: "Data-Protection Considerations for AI — URM Consulting", url: "https://www.urmconsulting.com/blog/data-protection-considerations-for-artificial-intelligence-ai" },
      { title: "Top Consent-Management Platforms, 2025", url: "https://www.enzuzo.com/blog/best-consent-management-platforms" },
      { title: "Secure Aggregation in DP Federated Learning — ArXiv 2024", url: "https://arxiv.org/abs/2407.19286" },
    ]
  },
  "v12": {
    id: "v12",
    code: "C12",
    name: "Monitoring, Logging & Anomaly Detection",
    description: "This section provides requirements for delivering real-time and forensic visibility into what the model and other AI components see, do, and return, so threats can be detected, triaged, and learned from.",
    color: "#f97316",
    icon: "activity",
    subCategories: [
      { id: "v12.1", code: "C12.1", name: "Request & Response Logging", requirements: [
          { id: "v12.1.1", code: "12.1.1", title: "Log All User Prompts and Model Responses with Metadata", description: "Verify that all user prompts and model responses are logged with appropriate metadata (e.g. timestamp, user ID, session ID, model version).", level: 1, category: "v12", role: "D/V", references: [] },
          { id: "v12.1.2", code: "12.1.2", title: "Securely Store Logs with Access Controls and Retention Policies", description: "Verify that logs are stored in secure, access-controlled repositories with appropriate retention policies and backup procedures.", level: 1, category: "v12", role: "D/V", references: [] },
          { id: "v12.1.3", code: "12.1.3", title: "Encrypt Log Storage Systems", description: "Verify that log storage systems implement encryption at rest and in transit to protect sensitive information contained in logs.", level: 1, category: "v12", role: "D/V", references: [] },
          { id: "v12.1.4", code: "12.1.4", title: "Automatically Redact or Mask Sensitive Data in Logs", description: "Verify that sensitive data in prompts and outputs is automatically redacted or masked before logging, with configurable redaction rules for PII, credentials, and proprietary information.", level: 1, category: "v12", role: "D/V", references: [] },
          { id: "v12.1.5", code: "12.1.5", title: "Log Policy Decisions and Safety Filtering Actions", description: "Verify that policy decisions and safety filtering actions are logged with sufficient detail to enable audit and debugging of content moderation systems.", level: 2, category: "v12", role: "D/V", references: [] },
          { id: "v12.1.6", code: "12.1.6", title: "Protect Log Integrity", description: "Verify that log integrity is protected through e.g. cryptographic signatures or write-only storage.", level: 2, category: "v12", role: "D/V", references: [] },
      ]},
      { id: "v12.2", code: "C12.2", name: "Abuse Detection and Alerting", requirements: [
          { id: "v12.2.1", code: "12.2.1", title: "Detect and Alert on Known Attack Patterns", description: "Verify that the system detects and alerts on known jailbreak patterns, prompt injection attempts, and adversarial inputs using signature-based detection.", level: 1, category: "v12", role: "D/V", references: [] },
          { id: "v12.2.2", code: "12.2.2", title: "Integrate with SIEM Platforms", description: "Verify that the system integrates with existing Security Information and Event Management (SIEM) platforms using standard log formats and protocols.", level: 1, category: "v12", role: "D/V", references: [] },
          { id: "v12.2.3", code: "12.2.3", title: "Enrich Security Events with AI-Specific Context", description: "Verify that enriched security events include AI-specific context such as model identifiers, confidence scores, and safety filter decisions.", level: 2, category: "v12", role: "D/V", references: [] },
          { id: "v12.2.4", code: "12.2.4", title: "Use Behavioral Anomaly Detection to Identify Unusual Patterns", description: "Verify that behavioral anomaly detection identifies unusual conversation patterns, excessive retry attempts, or systematic probing behaviors.", level: 2, category: "v12", role: "D/V", references: [] },
          { id: "v12.2.5", code: "12.2.5", title: "Implement Real-Time Alerting for Potential Violations", description: "Verify that real-time alerting mechanisms notify security teams when potential policy violations or attack attempts are detected.", level: 2, category: "v12", role: "D/V", references: [] },
          { id: "v12.2.6", code: "12.2.6", title: "Include Custom Rules for AI-Specific Threat Patterns", description: "Verify that custom rules are included to detect AI-specific threat patterns including coordinated jailbreak attempts, prompt injection campaigns, and model extraction attacks.", level: 2, category: "v12", role: "D/V", references: [] },
          { id: "v12.2.7", code: "12.2.7", title: "Automate Incident Response Workflows", description: "Verify that automated incident response workflows can isolate compromised models, block malicious users, and escalate critical security events.", level: 3, category: "v12", role: "D/V", references: [] },
      ]},
      { id: "v12.3", code: "C12.3", name: "Model Drift Detection", requirements: [
          { id: "v12.3.1", code: "12.3.1", title: "Track Basic Performance Metrics", description: "Verify that the system tracks basic performance metrics such as accuracy, confidence scores, latency, and error rates across model versions and time periods.", level: 1, category: "v12", role: "D/V", references: [] },
          { id: "v12.3.2", code: "12.3.2", title: "Trigger Automated Alerts on Performance Degradation", description: "Verify that automated alerting triggers when performance metrics exceed predefined degradation thresholds or deviate significantly from baselines.", level: 2, category: "v12", role: "D/V", references: [] },
          { id: "v12.3.3", code: "12.3.3", title: "Implement Hallucination Detection", description: "Verify that hallucination detection monitors identify and flag instances when model outputs contain factually incorrect, inconsistent, or fabricated information.", level: 2, category: "v12", role: "D/V", references: [] },
      ]},
      { id: "v12.4", code: "C12.4", name: "Performance & Behavior Telemetry", requirements: [
          { id: "v12.4.1", code: "12.4.1", title: "Continuously Collect and Monitor Operational Metrics", description: "Verify that operational metrics including request latency, token consumption, memory usage, and throughput are continuously collected and monitored.", level: 1, category: "v12", role: "D/V", references: [] },
          { id: "v12.4.2", code: "12.4.2", title: "Track Success and Failure Rates with Error Categorization", description: "Verify that success and failure rates are tracked with categorization of error types and their root causes.", level: 1, category: "v12", role: "D/V", references: [] },
          { id: "v12.4.3", code: "12.4.3", title: "Monitor Resource Utilization with Alerting", description: "Verify that resource utilization monitoring includes GPU/CPU usage, memory consumption, and storage requirements with alerting on threshold breaches.", level: 2, category: "v12", role: "D/V", references: [] },
      ]},
      { id: "v12.5", code: "C12.5", name: "AI Incident Response Planning & Execution", requirements: [
          { id: "v12.5.1", code: "12.5.1", title: "Address AI-Related Events in Incident Response Plans", description: "Verify that incident response plans specifically address AI-related security events including model compromise, data poisoning, and adversarial attacks.", level: 1, category: "v12", role: "D/V", references: [] },
          { id: "v12.5.2", code: "12.5.2", title: "Provide AI-Specific Forensic Tools and Expertise", description: "Verify that incident response teams have access to AI-specific forensic tools and expertise to investigate model behavior and attack vectors.", level: 2, category: "v12", role: "D/V", references: [] },
          { id: "v12.5.3", code: "12.5.3", title: "Include AI-Specific Considerations in Post-Incident Analysis", description: "Verify that post-incident analysis includes model retraining considerations, safety filter updates, and lessons learned integration into security controls.", level: 3, category: "v12", role: "D/V", references: [] },
      ]},
      { id: "v12.6", code: "C12.6", name: "AI Performance Degradation Detection", requirements: [
          { id: "v12.6.1", code: "12.6.1", title: "Continuously Monitor Model Performance Scores", description: "Verify that model accuracy, precision, recall, and F1 scores are continuously monitored and compared against baseline thresholds.", level: 1, category: "v12", role: "D/V", references: [] },
          { id: "v12.6.2", code: "12.6.2", title: "Monitor for Data Drift", description: "Verify that data drift detection monitors input distribution changes that may impact model performance.", level: 1, category: "v12", role: "D/V", references: [] },
          { id: "v12.6.3", code: "12.6.3", title: "Detect Concept Drift", description: "Verify that concept drift detection identifies changes in the relationship between inputs and expected outputs.", level: 2, category: "v12", role: "D/V", references: [] },
          { id: "v12.6.4", code: "12.6.4", title: "Automate Retraining or Replacement on Degradation", description: "Verify that performance degradation triggers automated alerts and initiates model retraining or replacement workflows.", level: 2, category: "v12", role: "D/V", references: [] },
          { id: "v12.6.5", code: "12.6.5", title: "Analyze Root Causes of Degradation", description: "Verify that degradation root cause analysis correlates performance drops with data changes, infrastructure issues, or external factors.", level: 3, category: "v12", role: "V", references: [] },
      ]},
      { id: "v12.7", code: "C12.7", name: "DAG Visualization & Workflow Security", requirements: [
          { id: "v12.7.1", code: "12.7.1", title: "Sanitize DAG Visualization Data", description: "Verify that DAG visualization data is sanitized to remove sensitive information before storage or transmission.", level: 1, category: "v12", role: "D/V", references: [] },
          { id: "v12.7.2", code: "12.7.2", title: "Implement Access Controls for Workflow Visualization", description: "Verify that workflow visualization access controls ensure only authorized users can view agent decision paths and reasoning traces.", level: 1, category: "v12", role: "D/V", references: [] },
          { id: "v12.7.3", code: "12.7.3", title: "Protect DAG Data Integrity", description: "Verify that DAG data integrity is protected through cryptographic signatures and tamper-evident storage mechanisms.", level: 2, category: "v12", role: "D/V", references: [] },
          { id: "v12.7.4", code: "12.7.4", title: "Prevent Injection Attacks in Workflow Visualization", description: "Verify that workflow visualization systems implement input validation to prevent injection attacks through crafted node or edge data.", level: 2, category: "v12", role: "D/V", references: [] },
          { id: "v12.7.5", code: "12.7.5", title: "Rate-Limit and Validate Real-time DAG Updates", description: "Verify that real-time DAG updates are rate-limited and validated to prevent denial-of-service attacks on visualization systems.", level: 3, category: "v12", role: "D/V", references: [] },
      ]},
      { id: "v12.8", code: "C12.8", name: "Proactive Security Behavior Monitoring", requirements: [
          { id: "v12.8.1", code: "12.8.1", title: "Security-Validate Proactive Agent Behaviors", description: "Verify that proactive agent behaviors are security-validated before execution with risk assessment integration.", level: 1, category: "v12", role: "D/V", references: [] },
          { id: "v12.8.2", code: "12.8.2", title: "Evaluate Security Context for Autonomous Initiative", description: "Verify that autonomous initiative triggers include security context evaluation and threat landscape assessment.", level: 2, category: "v12", role: "D/V", references: [] },
          { id: "v12.8.3", code: "12.8.3", title: "Analyze Proactive Behavior Patterns for Security Implications", description: "Verify that proactive behavior patterns are analyzed for potential security implications and unintended consequences.", level: 2, category: "v12", role: "D/V", references: [] },
          { id: "v12.8.4", code: "12.8.4", title: "Require Approval for Security-Critical Proactive Actions", description: "Verify that security-critical proactive actions require explicit approval chains with audit trails.", level: 3, category: "v12", role: "D/V", references: [] },
          { id: "v12.8.5", code: "12.8.5", title: "Detect Deviations in Proactive Agent Patterns", description: "Verify that behavioral anomaly detection identifies deviations in proactive agent patterns that may indicate compromise.", level: 3, category: "v12", role: "D/V", references: [] },
      ]},
    ],
    references: [
      { title: "NIST AI RMF 1.0 - Manage 4.1 and 4.3", url: "https://nvlpubs.nist.gov/nistpubs/ai/nist.ai.100-1.pdf" },
      { title: "ISO/IEC 42001:2023 — AI Management Systems - Annex B 6.2.6", url: "https://www.iso.org/standard/81230.html" },
      { title: "EU AI Act — Article 12, 13, 16 and 19 on Logging", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32024R1689" },
    ]
  },
  "v13": {
    id: "v13",
    code: "C13",
    name: "Human Oversight, Accountability & Governance",
    description: "This chapter provides requirements for maintaining human oversight and clear accountability chains in AI systems, ensuring explainability, transparency, and ethical stewardship throughout the AI lifecycle.",
    color: "#6366f1",
    icon: "users",
    subCategories: [
      { id: "v13.1", code: "C13.1", name: "Kill-Switch & Override Mechanisms", requirements: [
          { id: "v13.1.1", code: "13.1.1", title: "Provide a Manual Kill-Switch", description: "Verify that a manual kill-switch mechanism exists to immediately halt AI model inference and outputs.", level: 1, category: "v13", role: "D/V", references: [] },
          { id: "v13.1.2", code: "13.1.2", title: "Restrict Access to Override Controls", description: "Verify that override controls are accessible to only to authorized personnel.", level: 1, category: "v13", role: "D", references: [] },
          { id: "v13.1.3", code: "13.1.3", title: "Implement Rollback Procedures", description: "Verify that rollback procedures can revert to previous model versions or safe-mode operations.", level: 3, category: "v13", role: "D/V", references: [] },
          { id: "v13.1.4", code: "13.1.4", title: "Regularly Test Override Mechanisms", description: "Verify that override mechanisms are tested regularly.", level: 3, category: "v13", role: "V", references: [] },
      ]},
      { id: "v13.2", code: "C13.2", name: "Human-in-the-Loop Decision Checkpoints", requirements: [
          { id: "v13.2.1", code: "13.2.1", title: "Require Human Approval for High-Risk Decisions", description: "Verify that high-risk AI decisions require explicit human approval before execution.", level: 1, category: "v13", role: "D/V", references: [] },
          { id: "v13.2.2", code: "13.2.2", title: "Automatically Trigger Human Review Workflows", description: "Verify that risk thresholds are clearly defined and automatically trigger human review workflows.", level: 1, category: "v13", role: "D", references: [] },
          { id: "v13.2.3", code: "13.2.3", title: "Define Fallback Procedures for Time-Sensitive Decisions", description: "Verify that time-sensitive decisions have fallback procedures when human approval cannot be obtained within required timeframes.", level: 2, category: "v13", role: "D", references: [] },
          { id: "v13.2.4", code: "13.2.4", title: "Define Escalation Procedures", description: "Verify that escalation procedures define clear authority levels for different decision types or risk categories, if applicable.", level: 3, category: "v13", role: "D/V", references: [] },
      ]},
      { id: "v13.3", code: "C13.3", name: "Chain of Responsibility & Auditability", requirements: [
          { id: "v13.3.1", code: "13.3.1", title: "Log All Decisions and Interventions", description: "Verify that all AI system decisions and human interventions are logged with timestamps, user identities, and decision rationale.", level: 1, category: "v13", role: "D/V", references: [] },
          { id: "v13.3.2", code: "13.3.2", title: "Ensure Audit Logs are Tamper-Proof", description: "Verify that audit logs cannot be tampered with and include integrity verification mechanisms.", level: 2, category: "v13", role: "D", references: [] },
      ]},
      { id: "v13.4", code: "C13.4", name: "Explainable-AI Techniques", requirements: [
          { id: "v13.4.1", code: "13.4.1", title: "Provide Basic Explanations for Decisions", description: "Verify that AI systems provide basic explanations for their decisions in human-readable format.", level: 1, category: "v13", role: "D/V", references: [] },
          { id: "v13.4.2", code: "13.4.2", title: "Validate Explanation Quality", description: "Verify that explanation quality is validated through human evaluation studies and metrics.", level: 2, category: "v13", role: "V", references: [] },
          { id: "v13.4.3", code: "13.4.3", title: "Make Feature Importance Scores Available", description: "Verify that feature importance scores or attribution methods (SHAP, LIME, etc.) are available for critical decisions.", level: 3, category: "v13", role: "D/V", references: [] },
          { id: "v13.4.4", code: "13.4.4", title: "Provide Counterfactual Explanations", description: "Verify that counterfactual explanations show how inputs could be modified to change outcomes, if applicable to the use case and domain.", level: 3, category: "v13", role: "V", references: [] },
      ]},
      { id: "v13.5", code: "C13.5", name: "Model Cards & Usage Disclosures", requirements: [
          { id: "v13.5.1", code: "13.5.1", title: "Document Intended Use Cases and Limitations", description: "Verify that model cards document intended use cases, limitations, and known failure modes.", level: 1, category: "v13", role: "D", references: [] },
          { id: "v13.5.2", code: "13.5.2", title: "Disclose Performance Metrics", description: "Verify that performance metrics across different applicable use cases are disclosed.", level: 1, category: "v13", role: "D/V", references: [] },
          { id: "v13.5.3", code: "13.5.3", title: "Document Ethical Considerations and Biases", description: "Verify that ethical considerations, bias assessments, fairness evaluations, training data characteristics, and known training data limitations are documented and updated regularly.", level: 2, category: "v13", role: "D", references: [] },
          { id: "v13.5.4", code: "13.5.4", title: "Version-Control Model Cards", description: "Verify that model cards are version-controlled and maintained throughout the model lifecycle with change tracking.", level: 2, category: "v13", role: "D/V", references: [] },
      ]},
      { id: "v13.6", code: "C13.6", name: "Uncertainty Quantification", requirements: [
          { id: "v13.6.1", code: "13.6.1", title: "Provide Confidence Scores or Uncertainty Measures", description: "Verify that AI systems provide confidence scores or uncertainty measures with their outputs.", level: 1, category: "v13", role: "D", references: [] },
          { id: "v13.6.2", code: "13.6.2", title: "Trigger Actions Based on Uncertainty Thresholds", description: "Verify that uncertainty thresholds trigger additional human review or alternative decision pathways.", level: 2, category: "v13", role: "D/V", references: [] },
          { id: "v13.6.3", code: "13.6.3", title: "Calibrate and Validate Uncertainty Methods", description: "Verify that uncertainty quantification methods are calibrated and validated against ground truth data.", level: 2, category: "v13", role: "V", references: [] },
          { id: "v13.6.4", "code": "13.6.4", "title": "Maintain Uncertainty Propagation", "description": "Verify that uncertainty propagation is maintained through multi-step AI workflows.", "level": 3, "category": "v13", "role": "D/V", "references": [] }
      ]},
      { id: "v13.7", code: "C13.7", name: "User-Facing Transparency Reports", requirements: [
          { id: "v13.7.1", code: "13.7.1", title: "Clearly Communicate Data Usage Policies", description: "Verify that data usage policies and user consent management practices are clearly communicated to stakeholders.", level: 1, category: "v13", role: "D/V", references: [] },
          { id: "v13.7.2", code: "13.7.2", title: "Conduct and Report AI Impact Assessments", description: "Verify that AI impact assessments are conducted and results are included in reporting.", level: 2, category: "v13", role: "D/V", references: [] },
          { id: "v13.7.3", code: "13.7.3", title: "Publish Regular Transparency Reports", description: "Verify that transparency reports published regularly disclose AI incidents and operational metrics in reasonable detail.", level: 2, category: "v13", role: "D/V", references: [] },
      ]},
    ],
    references: [
      { title: "EU Artificial Intelligence Act — Regulation (EU) 2024/1689", url: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj" },
      { title: "ISO/IEC 23894:2023 — AI — Guidance on Risk Management", url: "https://www.iso.org/standard/77304.html" },
      { title: "ISO/IEC 42001:2023 — AI Management Systems Requirements", url: "https://www.iso.org/standard/81230.html" },
      { title: "NIST AI Risk Management Framework 1.0", url: "https://nvlpubs.nist.gov/nistpubs/ai/nist.ai.100-1.pdf" },
      { title: "NIST SP 800-53 Rev 5 — Security and Privacy Controls", url: "https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf" },
      { title: "A Unified Approach to Interpreting Model Predictions (SHAP)", url: "https://arxiv.org/abs/1705.07874" },
      { title: "Model Cards for Model Reporting (Mitchell et al., 2018)", url: "https://arxiv.org/abs/1810.03993" },
      { title: "Dropout as a Bayesian Approximation (Gal & Ghahramani, 2016)", url: "https://arxiv.org/abs/1506.02142" },
      { title: "ISO/IEC 24029-2:2023 — Robustness of NN — Formal Methods", url: "https://www.iso.org/standard/79804.html" },
      { title: "IEEE 7001-2021 — Transparency of Autonomous Systems", url: "https://standards.ieee.org/ieee/7001/6929/" },
      { title: "GDPR — Article 5 \"Transparency Principle\"", url: "https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX%3A32016R0679" },
      { title: "Human Oversight under Article 14 of the EU AI Act (Fink, 2025)", url: "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5147196" },
    ]
  }
};
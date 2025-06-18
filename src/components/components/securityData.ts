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
    description: "Implement comprehensive validation, sanitization, and isolation for all memory types (KC4.1-KC4.6) to prevent injection attacks (T1), information leakage (T3), context collapse, and propagation of hallucinations (T5) or poisoned communication (T12).",
    threatIds: ["t1", "t3", "t5", "t6", "t8", "t12"],
    implementationDetail: {
      design: `**Memory Architecture Design:**
- Define clear memory boundaries and access patterns for each memory type (KC4.1-KC4.6)
- Implement strict data classification schemas (public, internal, confidential, restricted)
- Design context sensitivity mechanisms to reduce unauthorized information exposure
- Plan memory isolation strategies using namespacing, user IDs, and tenant separation
- Establish data retention policies with automated cleanup mechanisms
- Design fail-safe memory access patterns with circuit breakers
- Plan for memory encryption key management and rotation strategies
- Define memory poisoning detection algorithms and response procedures

**Input Validation Strategy:**
- Define schema validation for all memory inputs using tools like Pydantic or JSON Schema
- Plan allow-listing strategies for acceptable data patterns
- Design sanitization pipelines for different data types (text, structured data, embeddings)
- Establish content moderation policies for memory storage
- Plan multilingual content validation and normalization
- Define PII detection and handling strategies before memory storage`,

      build: `**Memory Input Validation Implementation:**
- Use schema validation libraries (Pydantic, Joi, Ajv) for structured memory inputs
- Implement regex-based and ML-based content filtering for text inputs
- Deploy PII detection tools (Microsoft Presidio, AWS Comprehend, spaCy NER) before storage
- Build input sanitization pipelines that escape/neutralize dangerous tokens
- Implement content-based addressing for immutability verification
- Use cryptographic hashing for memory content integrity checks

**Memory Storage Security:**
- Implement field-level encryption for sensitive memory data using AES-256-GCM
- Use separate encryption keys per tenant/user with proper key rotation
- Deploy vector database security configurations (Pinecone, Weaviate, Chroma) with access controls
- Implement database-native row-level security for multi-tenant environments
- Use append-only storage patterns for audit trails
- Deploy automated memory content scanning for policy violations

**RAG-Specific Security:**
- Verify content authenticity and provenance before embedding
- Implement semantic search query validation to prevent information leakage
- Use retrieval result filtering based on user permissions and context
- Deploy content similarity analysis to detect potential poisoning attempts
- Implement embedding validation to detect adversarial examples
- Use differential privacy techniques for aggregated memory queries`,

      operations: `**Memory Management Operations:**
- Implement automated TTL policies for different memory types:
  * Session memory: 24 hours maximum
  * Cross-session memory: 30-90 days based on sensitivity
  * Cross-user memory: Strict access controls with 1-year maximum
- Deploy real-time memory usage monitoring with alerts
- Run periodic memory poisoning detection scans
- Implement automated PII discovery and redaction workflows
- Maintain memory access audit logs with tamper-evident storage
- Execute regular memory cleanup and defragmentation
- Deploy memory corruption detection using checksums and integrity verification

**Context Window Management:**
- Implement sliding window mechanisms for large contexts
- Use context summarization to maintain relevance while reducing size
- Deploy context boundary enforcement to prevent information leakage
- Implement context classification and access control
- Use memory pressure monitoring to prevent resource exhaustion
- Deploy context poisoning detection using anomaly analysis

**Memory Monitoring & Alerting:**
- Monitor unusual memory access patterns and data retrieval frequency
- Alert on attempts to access memory outside authorized scope
- Track memory growth rates and storage consumption
- Monitor for suspicious embedding similarity patterns
- Alert on memory corruption or integrity check failures
- Track memory access latency and performance anomalies`,

      toolsAndFrameworks: `**Memory Storage & Management:**
- **Vector Databases:** Pinecone (managed), Weaviate (open-source), Chroma (lightweight), Qdrant (high-performance)
- **Traditional Databases:** PostgreSQL with pgvector, MongoDB with vector search, Redis with RediSearch
- **Memory Management Frameworks:** Mem0 (memory management), Zep (conversational memory), LangChain Memory modules
- **Caching Solutions:** Redis Cluster, Memcached, Hazelcast with encryption support

**Content Validation & Security:**
- **PII Detection:** Microsoft Presidio, AWS Comprehend, Google Cloud DLP, spaCy NER models
- **Content Moderation:** OpenAI Moderation API, Perspective API, LlamaGuard, Azure Content Moderator
- **Schema Validation:** Pydantic (Python), Joi (Node.js), Ajv (JSON Schema), Yup (JavaScript)
- **Encryption:** AWS KMS, Azure Key Vault, HashiCorp Vault, Google Cloud KMS

**Monitoring & Analysis:**
- **Memory Analytics:** WhyLabs (data monitoring), Arize (ML observability), Weights & Biases
- **Anomaly Detection:** DataDog anomaly detection, Splunk ML toolkit, Elasticsearch anomaly detection
- **Data Lineage:** Apache Atlas, DataHub, Amundsen for memory provenance tracking
- **Backup & Recovery:** Velero (Kubernetes), AWS Backup, Azure Backup with point-in-time recovery`
    },
    designPhase: true,
    buildPhase: true,
    operationPhase: true,
    mitigatedThreatNames: ["Memory Poisoning", "Privilege Compromise", "Cascading Hallucination", "Intent Breaking & Goal Manipulation", "Repudiation", "Communication Poisoning"],
    mitigatedThreatIds: ["t1", "t3", "t5", "t6", "t8", "t12"],
    tags: ["memory", "validation", "sanitization", "rag", "encryption"],
    references: [
      { title: "OWASP Input Validation", url: "https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html" },
      { title: "Vector Database Security", url: "https://weaviate.io/blog/security-best-practices" },
      { title: "PII Detection Best Practices", url: "https://microsoft.github.io/presidio/" }
    ],
    riskScore: 8,
    status: "active",
    version: "2024.2",
    lastUpdated: "2024-12-01",
    updatedBy: "enhanced",
    color: "#a855f7",
    icon: "shield",
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
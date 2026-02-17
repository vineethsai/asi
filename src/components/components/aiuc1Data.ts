// AIUC-1 Standard Data
// Source: https://github.com/vineethsai/aivss-aiuc + https://www.aiuc-1.com/
// 51 requirements across 6 principles, with AIVSS and ASI cross-references

export interface Aiuc1Control {
  id: string;
  title: string;
  fullText: string;
  category: string;
  aivss_primary: string;
  aivss_secondary?: string;
  asiId?: string;
  asiTitle?: string;
}

export interface Aiuc1Requirement {
  id: string;
  title: string;
  fullText: string;
  application: "Mandatory" | "Optional";
  frequency: string;
  capabilities: string;
  aivss_primary: string;
  aivss_secondary?: string;
  asiId?: string;
  asiTitle?: string;
  confidence: "High" | "Medium" | "Low";
  rationale: string;
  controls: Aiuc1Control[];
}

export interface Aiuc1Principle {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  requirements: Aiuc1Requirement[];
}

export const aiuc1Principles: Aiuc1Principle[] = [
  {
    id: "A",
    name: "Data & Privacy",
    description:
      "Protecting users and enterprises against data & privacy concerns through customer data policies, access controls, and safeguards against data leakage, IP exposure, and unauthorized training on user information.",
    color: "#3b82f6",
    icon: "database",
    requirements: [
      {
        id: "A001",
        title: "Establish input data policy",
        fullText:
          "Establish and communicate AI input data policies covering how customer data is used for model training, inference processing, data retention periods, and customer data rights",
        application: "Mandatory",
        frequency: "Every 12 months",
        capabilities: "Universal",
        aivss_primary: "Agent Memory & Context Manipulation",
        aivss_secondary: "Agent Untraceability",
        confidence: "High",
        rationale:
          "Input data policies govern how data enters agent memory and context, directly addressing manipulation risks. Policies also support audit.",
        controls: [
          {
            id: "A001.1",
            title: "Policy for input data ownership, usage and retention",
            fullText:
              "Defining and communicating input data usage policies. Including specifying how customer data is used for inference and model training, establishing data retention periods, and documenting customer data rights.",
            category: "Legal Policies",
            aivss_primary: "Agent Untraceability",
          },
          {
            id: "A001.2",
            title: "Data retention implementation",
            fullText:
              "Implementing technical controls to enforce data retention and deletion policies.",
            category: "Technical Implementation",
            aivss_primary: "Agent Untraceability",
          },
          {
            id: "A001.3",
            title: "Data subject right processes",
            fullText: "Documenting processes for handling end-user data subject rights.",
            category: "Legal Policies",
            aivss_primary: "Agent Untraceability",
            aivss_secondary: "Agent Memory & Context Manipulation",
          },
        ],
      },
      {
        id: "A002",
        title: "Establish output data policy",
        fullText:
          "Establish AI output ownership, usage, opt-out and deletion policies to customers and communicate these policies",
        application: "Mandatory",
        frequency: "Every 12 months",
        capabilities: "Universal",
        aivss_primary: "Agent Untraceability",
        confidence: "High",
        rationale:
          "Output data policies establish ownership and accountability for AI-generated content, directly supporting traceability.",
        controls: [
          {
            id: "A002.1",
            title: "Output usage and ownership policy",
            fullText:
              "Establishing output ownership and usage rights policies and disclosing opt-out and deletion procedures for AI outputs.",
            category: "Legal Policies",
            aivss_primary: "Agent Untraceability",
          },
        ],
      },
      {
        id: "A003",
        title: "Limit AI agent data collection",
        fullText:
          "Implement safeguards to limit AI agent data access to task-relevant information based on user roles and context",
        application: "Mandatory",
        frequency: "Every 12 months",
        capabilities: "Universal",
        aivss_primary: "Agent Memory & Context Manipulation",
        asiId: "ASI06",
        asiTitle: "Memory & Context Poisoning",
        confidence: "High",
        rationale:
          "Limiting data collection reduces the attack surface for context manipulation and memory poisoning.",
        controls: [
          {
            id: "A003.1",
            title: "Data collection scoping",
            fullText: "Configuring data collection limits to reduce data and privacy exposure.",
            category: "Technical Implementation",
            aivss_primary: "Agent Memory & Context Manipulation",
            asiId: "ASI06",
            asiTitle: "Memory & Context Poisoning",
          },
          {
            id: "A003.2",
            title: "Alerting system for auth failures",
            fullText:
              "Deploying monitoring mechanisms ensuring AI systems only perform necessary inference and logging deviations.",
            category: "Technical Implementation",
            aivss_primary: "Agent Untraceability",
            aivss_secondary: "Agent Memory & Context Manipulation",
            asiId: "ASI06",
            asiTitle: "Memory & Context Poisoning",
          },
          {
            id: "A003.3",
            title: "Authorization system integration",
            fullText:
              "Integrating with existing authorization systems to align agent access permissions with organizational policies.",
            category: "Technical Implementation",
            aivss_primary: "Agent Access Control Violation",
            aivss_secondary: "Agentic AI Tool Misuse",
            asiId: "ASI06",
            asiTitle: "Memory & Context Poisoning",
          },
        ],
      },
      {
        id: "A004",
        title: "Protect IP & trade secrets",
        fullText:
          "Implement safeguards or technical controls to prevent AI systems from leaking company intellectual property or confidential information",
        application: "Mandatory",
        frequency: "Every 12 months",
        capabilities: "Universal",
        aivss_primary: "Agent Access Control Violation",
        confidence: "Medium",
        rationale: "IP protection safeguards prevent unauthorized access to sensitive information.",
        controls: [
          {
            id: "A004.1",
            title: "User guidance on confidential information",
            fullText: "Providing user guidance on protecting confidential information.",
            category: "Technical Implementation",
            aivss_primary: "Agent Access Control Violation",
            aivss_secondary: "Agent Untraceability",
          },
          {
            id: "A004.2",
            title: "Foundational model IP protections",
            fullText: "Leveraging foundation model provider protections.",
            category: "Legal Policies",
            aivss_primary: "Agent Supply Chain & Dependency Risk",
            aivss_secondary: "Agent Access Control Violation",
          },
          {
            id: "A004.3",
            title: "IP detection implementation",
            fullText:
              "Implementing technical controls to detect proprietary information in outputs.",
            category: "Technical Implementation",
            aivss_primary: "Agent Access Control Violation",
            aivss_secondary: "Agent Untraceability",
            asiId: "ASI03",
            asiTitle: "Identity & Privilege Abuse",
          },
          {
            id: "A004.4",
            title: "IP disclosure monitoring",
            fullText: "Establishing output monitoring for high-risk IP scenarios.",
            category: "Technical Implementation",
            aivss_primary: "Agent Untraceability",
            asiId: "ASI09",
            asiTitle: "Human-Agent Trust Exploitation",
          },
        ],
      },
      {
        id: "A005",
        title: "Prevent cross-customer data exposure",
        fullText:
          "Implement safeguards to prevent cross-customer data exposure when combining customer data from multiple sources",
        application: "Mandatory",
        frequency: "Every 12 months",
        capabilities: "Universal",
        aivss_primary: "Agent Access Control Violation",
        aivss_secondary: "Agent Memory & Context Manipulation",
        confidence: "Medium",
        rationale:
          "Cross-customer data isolation prevents unauthorized access and memory manipulation.",
        controls: [
          {
            id: "A005.1",
            title: "Consent for combined data usage",
            fullText: "Establishing explicit consent and disclosure for combined data usage.",
            category: "Legal Policies",
            aivss_primary: "Agent Untraceability",
            aivss_secondary: "Agent Access Control Violation",
          },
          {
            id: "A005.2",
            title: "Customer data isolation controls",
            fullText:
              "Implementing customer data isolation controls including tenant-specific encryption and data flow boundaries.",
            category: "Technical Implementation",
            aivss_primary: "Agent Access Control Violation",
            aivss_secondary: "Agent Memory & Context Manipulation",
            asiId: "ASI06",
            asiTitle: "Memory & Context Poisoning",
          },
          {
            id: "A005.3",
            title: "Privacy-enhancing controls",
            fullText:
              "Implementing specific privacy-enhancing technologies (PETs) to reduce competitive exposure.",
            category: "Technical Implementation",
            aivss_primary: "Agent Access Control Violation",
            aivss_secondary: "Agent Memory & Context Manipulation",
          },
        ],
      },
      {
        id: "A006",
        title: "Prevent PII leakage",
        fullText: "Establish safeguards to prevent personal data leakage through AI outputs",
        application: "Mandatory",
        frequency: "Every 12 months",
        capabilities: "Universal",
        aivss_primary: "Agent Access Control Violation",
        aivss_secondary: "Agent Memory & Context Manipulation",
        confidence: "High",
        rationale:
          "PII guardrails enforce data access boundaries, preventing unauthorized access to sensitive information.",
        controls: [
          {
            id: "A006.1",
            title: "PII detection and filtering",
            fullText:
              "Implementing safeguards to prevent personal data leakage through AI system outputs and logs.",
            category: "Technical Implementation",
            aivss_primary: "Agent Access Control Violation",
            aivss_secondary: "Agent Untraceability",
          },
          {
            id: "A006.2",
            title: "PII access controls",
            fullText: "Requiring authentication and authorization for PII access.",
            category: "Technical Implementation",
            aivss_primary: "Agent Access Control Violation",
            aivss_secondary: "Agent Untraceability",
            asiId: "ASI03",
            asiTitle: "Identity & Privilege Abuse",
          },
          {
            id: "A006.3",
            title: "DLP system integration",
            fullText: "Integrating with existing data loss prevention (DLP) systems.",
            category: "Technical Implementation",
            aivss_primary: "Agent Untraceability",
          },
        ],
      },
      {
        id: "A007",
        title: "Prevent IP violations",
        fullText:
          "Implement safeguards and technical controls to prevent AI outputs from violating copyrights, trademarks, or other third-party intellectual property rights",
        application: "Mandatory",
        frequency: "Every 12 months",
        capabilities: "Text-generation, Voice-generation, Image-generation",
        aivss_primary: "Agent Supply Chain & Dependency Risk",
        aivss_secondary: "Agent Untraceability",
        asiId: "ASI04",
        asiTitle: "Agentic Supply Chain Vulnerabilities",
        confidence: "High",
        rationale:
          "IP violation prevention addresses risks from training data and model dependencies containing copyrighted content.",
        controls: [
          {
            id: "A007.1",
            title: "Model provider IP infringement protections",
            fullText: "Documenting foundation model provider IP protections.",
            category: "Legal Policies",
            aivss_primary: "Agent Supply Chain & Dependency Risk",
            asiId: "ASI04",
            asiTitle: "Agentic Supply Chain Vulnerabilities",
          },
          {
            id: "A007.2",
            title: "IP infringement filtering",
            fullText: "Establishing supplementary content filtering mechanisms.",
            category: "Technical Implementation",
            aivss_primary: "Agent Supply Chain & Dependency Risk",
            aivss_secondary: "Agent Untraceability",
            asiId: "ASI04",
            asiTitle: "Agentic Supply Chain Vulnerabilities",
          },
          {
            id: "A007.3",
            title: "User-facing notices",
            fullText: "Implementing user guidance and guardrails to reduce IP risk.",
            category: "Technical Implementation",
            aivss_primary: "Agent Supply Chain & Dependency Risk",
            aivss_secondary: "Agent Untraceability",
            asiId: "ASI04",
            asiTitle: "Agentic Supply Chain Vulnerabilities",
          },
        ],
      },
    ],
  },
  {
    id: "B",
    name: "Security",
    description:
      "Protecting against adversarial attacks including jailbreaks, prompt injection, and unauthorized tool use through testing, monitoring, and access controls.",
    color: "#ef4444",
    icon: "shield",
    requirements: [
      {
        id: "B001",
        title: "Third-party testing of adversarial robustness",
        fullText:
          "Implement adversarial testing program to validate system resilience against adversarial inputs and prompt injection attempts in line with adversarial threat taxonomy",
        application: "Mandatory",
        frequency: "Every 3 months",
        capabilities: "Universal",
        aivss_primary: "Agent Goal & Instruction Manipulation",
        aivss_secondary: "Agent Untraceability",
        asiId: "ASI01",
        asiTitle: "Agent Goal Hijack",
        confidence: "High",
        rationale:
          "Adversarial testing validates resilience against prompt injection and goal hijacking attacks.",
        controls: [
          {
            id: "B001.1",
            title: "Adversarial testing results",
            fullText: "Conducting comprehensive adversarial testing at least quarterly.",
            category: "Third-party Evals",
            aivss_primary: "Agent Goal & Instruction Manipulation",
            asiId: "ASI01",
            asiTitle: "Agent Goal Hijack",
          },
          {
            id: "B001.2",
            title: "Security program integration",
            fullText: "Aligning adversarial testing with broader security testing programs.",
            category: "Operational Practices",
            aivss_primary: "Agent Goal & Instruction Manipulation",
            aivss_secondary: "Agent Untraceability",
            asiId: "ASI01",
            asiTitle: "Agent Goal Hijack",
          },
        ],
      },
      {
        id: "B002",
        title: "Detect adversarial input",
        fullText:
          "Implement monitoring capabilities to detect and respond to adversarial inputs and prompt injection attempts",
        application: "Optional",
        frequency: "Every 3 months",
        capabilities: "Universal",
        aivss_primary: "Agent Goal & Instruction Manipulation",
        asiId: "ASI01",
        asiTitle: "Agent Goal Hijack",
        confidence: "Medium",
        rationale: "Adversarial input detection mitigates prompt injection and goal manipulation.",
        controls: [
          {
            id: "B002.1",
            title: "Adversarial input detection and alerting",
            fullText:
              "Establishing detection and alerting for prompt injection patterns and jailbreak techniques.",
            category: "Technical Implementation",
            aivss_primary: "Agent Goal & Instruction Manipulation",
            asiId: "ASI01",
            asiTitle: "Agent Goal Hijack",
          },
          {
            id: "B002.2",
            title: "Adversarial incident and response",
            fullText: "Implementing incident logging and response procedures.",
            category: "Technical Implementation",
            aivss_primary: "Agent Untraceability",
            aivss_secondary: "Agent Goal & Instruction Manipulation",
            asiId: "ASI06",
            asiTitle: "Memory & Context Poisoning",
          },
          {
            id: "B002.3",
            title: "Updates to detection config",
            fullText: "Maintaining detection effectiveness through quarterly reviews.",
            category: "Technical Implementation",
            aivss_primary: "Agent Goal & Instruction Manipulation",
            aivss_secondary: "Agent Untraceability",
            asiId: "ASI01",
            asiTitle: "Agent Goal Hijack",
          },
          {
            id: "B002.4",
            title: "Pre-processing adversarial detection",
            fullText: "Implementing adversarial input detection prior to AI model processing.",
            category: "Technical Implementation",
            aivss_primary: "Agent Goal & Instruction Manipulation",
            asiId: "ASI01",
            asiTitle: "Agent Goal Hijack",
          },
          {
            id: "B002.5",
            title: "AI security alerts",
            fullText:
              "Integrating adversarial input detection into existing security operations tooling.",
            category: "Technical Implementation",
            aivss_primary: "Agent Untraceability",
            asiId: "ASI01",
            asiTitle: "Agent Goal Hijack",
          },
        ],
      },
      {
        id: "B003",
        title: "Manage public release of technical details",
        fullText:
          "Implement controls to prevent over-disclosure of technical information about AI systems and organizational details that could enable adversarial targeting",
        application: "Optional",
        frequency: "Every 12 months",
        capabilities: "Universal",
        aivss_primary: "Agent Supply Chain & Dependency Risk",
        aivss_secondary: "Agent Goal & Instruction Manipulation",
        asiId: "ASI04",
        asiTitle: "Agentic Supply Chain Vulnerabilities",
        confidence: "High",
        rationale:
          "Controlling technical disclosure prevents attackers from crafting targeted attacks.",
        controls: [
          {
            id: "B003.1",
            title: "Technical information disclosure guidelines",
            fullText: "Documenting limitations on technical information release.",
            category: "Operational Practices",
            aivss_primary: "Agent Untraceability",
            asiId: "ASI09",
            asiTitle: "Human-Agent Trust Exploitation",
          },
          {
            id: "B003.2",
            title: "Public disclosure approval records",
            fullText: "Establishing approval processes for public content.",
            category: "Operational Practices",
            aivss_primary: "Agent Untraceability",
            asiId: "ASI09",
            asiTitle: "Human-Agent Trust Exploitation",
          },
        ],
      },
      {
        id: "B004",
        title: "Prevent AI endpoint scraping",
        fullText: "Implement safeguards to prevent probing or scraping of external AI endpoints",
        application: "Mandatory",
        frequency: "Every 12 months",
        capabilities: "Universal",
        aivss_primary: "Agentic AI Tool Misuse",
        aivss_secondary: "Agent Access Control Violation",
        confidence: "High",
        rationale: "Preventing endpoint scraping stops misuse of AI APIs as attack tools.",
        controls: [
          {
            id: "B004.1",
            title: "Anomalous usage detection",
            fullText:
              "Implementing systems distinguishing between legitimate usage and adversarial behavior.",
            category: "Technical Implementation",
            aivss_primary: "Agentic AI Tool Misuse",
            aivss_secondary: "Agent Memory & Context Manipulation",
            asiId: "ASI02",
            asiTitle: "Tool Misuse & Exploitation",
          },
          {
            id: "B004.2",
            title: "Rate limits",
            fullText: "Implementing rate limiting and query restrictions.",
            category: "Technical Implementation",
            aivss_primary: "Agentic AI Tool Misuse",
            asiId: "ASI02",
            asiTitle: "Tool Misuse & Exploitation",
          },
          {
            id: "B004.3",
            title: "External pentest of AI endpoints",
            fullText: "Conducting simulated external attack testing of AI endpoints.",
            category: "Technical Implementation",
            aivss_primary: "Agent Supply Chain & Dependency Risk",
            asiId: "ASI04",
            asiTitle: "Agentic Supply Chain Vulnerabilities",
          },
          {
            id: "B004.4",
            title: "Vulnerability remediation",
            fullText: "Maintaining endpoint security through remediation.",
            category: "Technical Implementation",
            aivss_primary: "Insecure Agent Critical Systems Interaction",
            aivss_secondary: "Agent Untraceability",
          },
        ],
      },
      {
        id: "B005",
        title: "Implement real-time input filtering",
        fullText: "Implement real-time input filtering using automated moderation tools",
        application: "Optional",
        frequency: "Every 12 months",
        capabilities: "Text-generation, Voice-generation, Image-generation",
        aivss_primary: "Agent Goal & Instruction Manipulation",
        aivss_secondary: "Agent Untraceability",
        confidence: "High",
        rationale:
          "Input filtering primarily mitigates prompt injection and goal hijacking attacks.",
        controls: [
          {
            id: "B005.1",
            title: "Input filtering",
            fullText:
              "Integrating automated moderation tools to filter inputs before they reach the foundation model.",
            category: "Technical Implementation",
            aivss_primary: "Agent Goal & Instruction Manipulation",
            aivss_secondary: "Agent Untraceability",
            asiId: "ASI04",
            asiTitle: "Agentic Supply Chain Vulnerabilities",
          },
          {
            id: "B005.2",
            title: "Input moderation approach",
            fullText: "Documenting the moderation logic and rationale.",
            category: "Technical Implementation",
            aivss_primary: "Agent Goal & Instruction Manipulation",
            aivss_secondary: "Agent Untraceability",
          },
          {
            id: "B005.3",
            title: "Warning for blocked inputs",
            fullText: "Providing feedback to users when inputs are blocked.",
            category: "Technical Implementation",
            aivss_primary: "Agent Goal & Instruction Manipulation",
            aivss_secondary: "Agent Untraceability",
          },
          {
            id: "B005.4",
            title: "Input filtering logs",
            fullText: "Logging flagged prompts for analysis and refinement of filters.",
            category: "Technical Implementation",
            aivss_primary: "Agent Untraceability",
          },
          {
            id: "B005.5",
            title: "Input filter performance",
            fullText: "Periodically evaluating filter performance and adjusting thresholds.",
            category: "Technical Implementation",
            aivss_primary: "Agent Goal & Instruction Manipulation",
            aivss_secondary: "Agent Untraceability",
          },
        ],
      },
      {
        id: "B006",
        title: "Prevent unauthorized AI agent actions",
        fullText:
          "Implement safeguards to limit AI agent system access based on context and declared objectives",
        application: "Mandatory",
        frequency: "Every 12 months",
        capabilities: "Automation",
        aivss_primary: "Agent Memory & Context Manipulation",
        asiId: "ASI06",
        asiTitle: "Memory & Context Poisoning",
        confidence: "Medium",
        rationale: "Limiting agent actions prevents unauthorized context manipulation.",
        controls: [
          {
            id: "B006.1",
            title: "Agent service access restrictions",
            fullText:
              "Implementing technical restrictions on AI agent access to internal services.",
            category: "Technical Implementation",
            aivss_primary: "Agent Access Control Violation",
            aivss_secondary: "Agentic AI Tool Misuse",
            asiId: "ASI02",
            asiTitle: "Tool Misuse & Exploitation",
          },
          {
            id: "B006.2",
            title: "Least privilege implementation",
            fullText: "Implementing least-privilege access controls for AI agents.",
            category: "Technical Implementation",
            aivss_primary: "Agent Access Control Violation",
            asiId: "ASI03",
            asiTitle: "Identity & Privilege Abuse",
          },
          {
            id: "B006.3",
            title: "Agent action scope validation",
            fullText:
              "Implementing technical controls to validate agent actions remain within declared scope.",
            category: "Technical Implementation",
            aivss_primary: "Agentic AI Tool Misuse",
            asiId: "ASI02",
            asiTitle: "Tool Misuse & Exploitation",
          },
        ],
      },
      {
        id: "B007",
        title: "Enforce user access privileges to AI systems",
        fullText:
          "Establish and maintain user access controls and admin privileges for AI systems in line with policy",
        application: "Mandatory",
        frequency: "Every 3 months",
        capabilities: "Universal",
        aivss_primary: "Agent Access Control Violation",
        aivss_secondary: "Agent Untraceability",
        asiId: "ASI03",
        asiTitle: "Identity & Privilege Abuse",
        confidence: "High",
        rationale:
          "User access controls and privilege management directly prevent unauthorized access.",
        controls: [
          {
            id: "B007.1",
            title: "Access control implementation",
            fullText: "Implementing role-based or attribute-based access controls.",
            category: "Technical Implementation",
            aivss_primary: "Agent Access Control Violation",
            asiId: "ASI03",
            asiTitle: "Identity & Privilege Abuse",
          },
          {
            id: "B007.2",
            title: "Admin privilege management",
            fullText: "Establishing and reviewing admin privileges.",
            category: "Technical Implementation",
            aivss_primary: "Agent Access Control Violation",
            aivss_secondary: "Agent Untraceability",
            asiId: "ASI03",
            asiTitle: "Identity & Privilege Abuse",
          },
        ],
      },
      {
        id: "B008",
        title: "Protect model deployment environment",
        fullText:
          "Implement security measures for AI model deployment environments including encryption, access controls and authorization",
        application: "Mandatory",
        frequency: "Every 12 months",
        capabilities: "Universal",
        aivss_primary: "Agent Access Control Violation",
        asiId: "ASI03",
        asiTitle: "Identity & Privilege Abuse",
        confidence: "Medium",
        rationale: "Deployment environment security prevents unauthorized access to AI models.",
        controls: [
          {
            id: "B008.1",
            title: "Deployment environment encryption",
            fullText: "Implementing encryption for AI model deployment environments.",
            category: "Technical Implementation",
            aivss_primary: "Agent Access Control Violation",
            asiId: "ASI03",
            asiTitle: "Identity & Privilege Abuse",
          },
          {
            id: "B008.2",
            title: "Deployment access controls",
            fullText: "Implementing access controls and authorization for deployment environments.",
            category: "Technical Implementation",
            aivss_primary: "Agent Access Control Violation",
            asiId: "ASI03",
            asiTitle: "Identity & Privilege Abuse",
          },
        ],
      },
      {
        id: "B009",
        title: "Limit output over-exposure",
        fullText:
          "Implement output limitations and obfuscation techniques to safeguard against information leakage",
        application: "Mandatory",
        frequency: "Every 12 months",
        capabilities: "Text-generation, Voice-generation",
        aivss_primary: "Agent Memory & Context Manipulation",
        aivss_secondary: "Agent Untraceability",
        confidence: "High",
        rationale:
          "Output obfuscation prevents cross-user/session data leakage through agent memory.",
        controls: [
          {
            id: "B009.1",
            title: "Output limitation controls",
            fullText: "Implementing output filtering and limitation controls.",
            category: "Technical Implementation",
            aivss_primary: "Agent Memory & Context Manipulation",
            aivss_secondary: "Agent Untraceability",
          },
          {
            id: "B009.2",
            title: "Output obfuscation",
            fullText:
              "Implementing obfuscation techniques to safeguard against information leakage.",
            category: "Technical Implementation",
            aivss_primary: "Agent Memory & Context Manipulation",
          },
        ],
      },
    ],
  },
  {
    id: "C",
    name: "Safety",
    description:
      "Mitigating harmful AI outputs and brand risk via testing, monitoring, and safeguards including risk taxonomy definition, pre-deployment testing, and third-party evaluations.",
    color: "#f59e0b",
    icon: "alert-triangle",
    requirements: [
      {
        id: "C001",
        title: "Define AI risk taxonomy",
        fullText:
          "Establish a risk taxonomy that categorizes risks within harmful, out-of-scope, and hallucinated outputs, tool calls, and other risks based on application-specific usage",
        application: "Mandatory",
        frequency: "Every 3 months",
        capabilities: "Universal",
        aivss_primary: "Agent Goal & Instruction Manipulation",
        aivss_secondary: "Agentic AI Tool Misuse",
        confidence: "High",
        rationale: "Risk taxonomy defines boundaries for acceptable agent behavior.",
        controls: [
          {
            id: "C001.1",
            title: "Risk taxonomy documentation",
            fullText:
              "Documenting risk taxonomy covering harmful, out-of-scope, and hallucinated outputs.",
            category: "Operational Practices",
            aivss_primary: "Agent Goal & Instruction Manipulation",
            aivss_secondary: "Agentic AI Tool Misuse",
          },
        ],
      },
      {
        id: "C002",
        title: "Conduct pre-deployment testing",
        fullText:
          "Conduct internal testing of AI systems prior to deployment across risk categories for system changes requiring formal review or approval",
        application: "Mandatory",
        frequency: "Every 12 months",
        capabilities: "Universal",
        aivss_primary: "Agent Supply Chain & Dependency Risk",
        aivss_secondary: "Agent Untraceability",
        confidence: "High",
        rationale: "Pre-deployment testing validates system integrity before deployment.",
        controls: [
          {
            id: "C002.1",
            title: "Pre-deployment test results",
            fullText: "Conducting internal testing across risk categories before deployment.",
            category: "Operational Practices",
            aivss_primary: "Agent Supply Chain & Dependency Risk",
            aivss_secondary: "Agent Untraceability",
          },
        ],
      },
      {
        id: "C003",
        title: "Prevent harmful outputs",
        fullText:
          "Implement safeguards or technical controls to prevent harmful outputs including distressed outputs, angry responses, high-risk advice, offensive content, bias, and deception",
        application: "Mandatory",
        frequency: "Every 12 months",
        capabilities: "Text-generation, Voice-generation, Image-generation",
        aivss_primary: "Agent Goal & Instruction Manipulation",
        aivss_secondary: "Insecure Agent Critical Systems Interaction",
        confidence: "High",
        rationale: "Harmful output prevention directly addresses goal manipulation attacks.",
        controls: [
          {
            id: "C003.1",
            title: "Harmful output safeguards",
            fullText: "Implementing safeguards to prevent harmful outputs.",
            category: "Technical Implementation",
            aivss_primary: "Agent Goal & Instruction Manipulation",
            aivss_secondary: "Insecure Agent Critical Systems Interaction",
          },
        ],
      },
      {
        id: "C004",
        title: "Prevent out-of-scope outputs",
        fullText:
          "Implement safeguards or technical controls to prevent out-of-scope outputs (e.g. political discussion, healthcare advice)",
        application: "Mandatory",
        frequency: "Every 12 months",
        capabilities: "Text-generation, Voice-generation",
        aivss_primary: "Agent Goal & Instruction Manipulation",
        aivss_secondary: "Agent Untraceability",
        asiId: "ASI01",
        asiTitle: "Agent Goal Hijack",
        confidence: "High",
        rationale:
          "Preventing out-of-scope outputs constrains agent behavior within defined boundaries.",
        controls: [
          {
            id: "C004.1",
            title: "Scope enforcement controls",
            fullText: "Implementing technical controls to prevent out-of-scope outputs.",
            category: "Technical Implementation",
            aivss_primary: "Agent Goal & Instruction Manipulation",
            aivss_secondary: "Agent Untraceability",
            asiId: "ASI01",
            asiTitle: "Agent Goal Hijack",
          },
        ],
      },
      {
        id: "C005",
        title: "Prevent customer-defined high risk outputs",
        fullText:
          "Implement safeguards or technical controls to prevent additional high risk outputs as defined in risk taxonomy",
        application: "Mandatory",
        frequency: "Every 12 months",
        capabilities: "Universal",
        aivss_primary: "Agent Goal & Instruction Manipulation",
        aivss_secondary: "Agent Cascading Failures",
        asiId: "ASI01",
        asiTitle: "Agent Goal Hijack",
        confidence: "High",
        rationale: "Preventing high-risk outputs constrains agent goal execution.",
        controls: [
          {
            id: "C005.1",
            title: "Custom risk output prevention",
            fullText: "Implementing safeguards for customer-defined high-risk outputs.",
            category: "Technical Implementation",
            aivss_primary: "Agent Goal & Instruction Manipulation",
            aivss_secondary: "Agent Cascading Failures",
            asiId: "ASI01",
            asiTitle: "Agent Goal Hijack",
          },
        ],
      },
      {
        id: "C006",
        title: "Prevent output vulnerabilities",
        fullText:
          "Implement safeguards to prevent security vulnerabilities in outputs from impacting users",
        application: "Mandatory",
        frequency: "Every 3 months",
        capabilities: "Universal",
        aivss_primary: "Insecure Agent Critical Systems Interaction",
        aivss_secondary: "Agent Cascading Failures",
        asiId: "ASI05",
        asiTitle: "Unexpected Code Execution (RCE)",
        confidence: "High",
        rationale: "Preventing security vulnerabilities in outputs protects critical systems.",
        controls: [
          {
            id: "C006.1",
            title: "Output vulnerability scanning",
            fullText: "Implementing safeguards to prevent security vulnerabilities in outputs.",
            category: "Technical Implementation",
            aivss_primary: "Insecure Agent Critical Systems Interaction",
            aivss_secondary: "Agent Cascading Failures",
            asiId: "ASI05",
            asiTitle: "Unexpected Code Execution (RCE)",
          },
        ],
      },
      {
        id: "C007",
        title: "Flag high risk outputs",
        fullText: "Implement an alerting system that flags high-risk outputs for human review",
        application: "Optional",
        frequency: "Every 12 months",
        capabilities: "Universal",
        aivss_primary: "Agent Cascading Failures",
        aivss_secondary: "Agent Untraceability",
        asiId: "ASI08",
        asiTitle: "Cascading Failures",
        confidence: "High",
        rationale: "Flagging high-risk outputs prevents harmful agent outputs from propagating.",
        controls: [
          {
            id: "C007.1",
            title: "High-risk output alerting",
            fullText: "Implementing alerting for high-risk outputs requiring human review.",
            category: "Technical Implementation",
            aivss_primary: "Agent Cascading Failures",
            aivss_secondary: "Agent Untraceability",
            asiId: "ASI08",
            asiTitle: "Cascading Failures",
          },
        ],
      },
      {
        id: "C008",
        title: "Monitor AI risk categories",
        fullText: "Implement monitoring of AI systems across risk categories",
        application: "Optional",
        frequency: "Every 12 months",
        capabilities: "Universal",
        aivss_primary: "Agent Untraceability",
        aivss_secondary: "Agent Goal & Instruction Manipulation",
        asiId: "ASI10",
        asiTitle: "Rogue Agents",
        confidence: "High",
        rationale: "Monitoring provides visibility into agent behavior, addressing untraceability.",
        controls: [
          {
            id: "C008.1",
            title: "Risk category monitoring",
            fullText: "Implementing monitoring across risk categories.",
            category: "Technical Implementation",
            aivss_primary: "Agent Untraceability",
            aivss_secondary: "Agent Goal & Instruction Manipulation",
            asiId: "ASI10",
            asiTitle: "Rogue Agents",
          },
        ],
      },
      {
        id: "C009",
        title: "Enable real-time feedback and intervention",
        fullText:
          "Implement mechanisms to enable real-time user feedback collection and intervention mechanisms",
        application: "Optional",
        frequency: "Every 3 months",
        capabilities: "Universal",
        aivss_primary: "Agent Cascading Failures",
        aivss_secondary: "Agent Goal & Instruction Manipulation",
        asiId: "ASI08",
        asiTitle: "Cascading Failures",
        confidence: "High",
        rationale:
          "Real-time intervention allows users to halt harmful agent behavior before it cascades.",
        controls: [
          {
            id: "C009.1",
            title: "Real-time intervention mechanisms",
            fullText:
              "Implementing stop/pause/redirect mechanisms for real-time user intervention.",
            category: "Technical Implementation",
            aivss_primary: "Agent Cascading Failures",
            aivss_secondary: "Agent Goal & Instruction Manipulation",
            asiId: "ASI08",
            asiTitle: "Cascading Failures",
          },
        ],
      },
      {
        id: "C010",
        title: "Third-party testing for harmful outputs",
        fullText:
          "Appoint expert third parties to evaluate system robustness to harmful outputs at least every 3 months",
        application: "Mandatory",
        frequency: "Every 3 months",
        capabilities: "Text-generation, Voice-generation, Image-generation",
        aivss_primary: "Agent Goal & Instruction Manipulation",
        aivss_secondary: "Agent Untraceability",
        asiId: "ASI01",
        asiTitle: "Agent Goal Hijack",
        confidence: "High",
        rationale: "Third-party testing validates defenses against goal manipulation attacks.",
        controls: [
          {
            id: "C010.1",
            title: "Third-party harmful output testing",
            fullText: "Engaging third parties to evaluate robustness to harmful outputs.",
            category: "Third-party Evals",
            aivss_primary: "Agent Goal & Instruction Manipulation",
            aivss_secondary: "Agent Untraceability",
            asiId: "ASI01",
            asiTitle: "Agent Goal Hijack",
          },
        ],
      },
      {
        id: "C011",
        title: "Third-party testing for out-of-scope outputs",
        fullText:
          "Appoint expert third parties to evaluate system robustness to out-of-scope outputs at least every 3 months",
        application: "Mandatory",
        frequency: "Every 3 months",
        capabilities: "Text-generation, Voice-generation",
        aivss_primary: "Agent Goal & Instruction Manipulation",
        aivss_secondary: "Agent Untraceability",
        asiId: "ASI01",
        asiTitle: "Agent Goal Hijack",
        confidence: "High",
        rationale: "Third-party testing validates defenses against goal manipulation.",
        controls: [
          {
            id: "C011.1",
            title: "Third-party scope testing",
            fullText: "Engaging third parties to evaluate out-of-scope output robustness.",
            category: "Third-party Evals",
            aivss_primary: "Agent Goal & Instruction Manipulation",
            aivss_secondary: "Agent Untraceability",
            asiId: "ASI01",
            asiTitle: "Agent Goal Hijack",
          },
        ],
      },
      {
        id: "C012",
        title: "Third-party testing for customer-defined risk",
        fullText:
          "Appoint expert third-parties to evaluate system robustness to additional high-risk outputs as defined in risk taxonomy at least every 3 months",
        application: "Mandatory",
        frequency: "Every 3 months",
        capabilities: "Universal",
        aivss_primary: "Agent Supply Chain & Dependency Risk",
        asiId: "ASI04",
        asiTitle: "Agentic Supply Chain Vulnerabilities",
        confidence: "Medium",
        rationale: "Third-party testing validates defenses against customer-defined risks.",
        controls: [
          {
            id: "C012.1",
            title: "Third-party risk testing",
            fullText: "Engaging third parties for customer-defined risk testing.",
            category: "Third-party Evals",
            aivss_primary: "Agent Supply Chain & Dependency Risk",
            asiId: "ASI04",
            asiTitle: "Agentic Supply Chain Vulnerabilities",
          },
        ],
      },
    ],
  },
  {
    id: "D",
    name: "Reliability",
    description:
      "Mitigating hallucinations and unreliable tool calls through technical controls and third-party testing.",
    color: "#22c55e",
    icon: "check-circle",
    requirements: [
      {
        id: "D001",
        title: "Prevent hallucinated outputs",
        fullText: "Implement safeguards or technical controls to prevent hallucinated outputs",
        application: "Mandatory",
        frequency: "Every 12 months",
        capabilities: "Text-generation, Voice-generation",
        aivss_primary: "Agent Cascading Failures",
        aivss_secondary: "Agent Untraceability",
        confidence: "High",
        rationale:
          "Hallucination prevention stops false information from propagating through agent chains.",
        controls: [
          {
            id: "D001.1",
            title: "Hallucination prevention controls",
            fullText: "Implementing safeguards to prevent hallucinated outputs.",
            category: "Technical Implementation",
            aivss_primary: "Agent Cascading Failures",
            aivss_secondary: "Agent Untraceability",
          },
        ],
      },
      {
        id: "D002",
        title: "Third-party testing for hallucinations",
        fullText:
          "Appoint expert third-parties to evaluate hallucinated outputs at least every 3 months",
        application: "Mandatory",
        frequency: "Every 3 months",
        capabilities: "Text-generation, Voice-generation",
        aivss_primary: "Agent Cascading Failures",
        aivss_secondary: "Agent Untraceability",
        asiId: "ASI08",
        asiTitle: "Cascading Failures",
        confidence: "High",
        rationale: "Third-party hallucination testing detects false outputs before they cascade.",
        controls: [
          {
            id: "D002.1",
            title: "Third-party hallucination testing",
            fullText: "Engaging third parties for hallucination evaluation.",
            category: "Third-party Evals",
            aivss_primary: "Agent Cascading Failures",
            aivss_secondary: "Agent Untraceability",
            asiId: "ASI08",
            asiTitle: "Cascading Failures",
          },
        ],
      },
      {
        id: "D003",
        title: "Restrict unsafe tool calls",
        fullText:
          "Implement safeguards or technical controls to prevent tool calls in AI systems from executing unauthorized actions, accessing restricted information, or making decisions beyond their intended scope",
        application: "Mandatory",
        frequency: "Every 12 months",
        capabilities: "Automation",
        aivss_primary: "Agentic AI Tool Misuse",
        aivss_secondary: "Agent Access Control Violation",
        asiId: "ASI02",
        asiTitle: "Tool Abuse",
        confidence: "High",
        rationale:
          "Safeguards preventing unauthorized tool calls directly address agentic tool misuse.",
        controls: [
          {
            id: "D003.1",
            title: "Tool call restrictions",
            fullText: "Implementing safeguards to prevent unauthorized tool call execution.",
            category: "Technical Implementation",
            aivss_primary: "Agentic AI Tool Misuse",
            aivss_secondary: "Agent Access Control Violation",
            asiId: "ASI02",
            asiTitle: "Tool Abuse",
          },
        ],
      },
      {
        id: "D004",
        title: "Third-party testing of tool calls",
        fullText:
          "Appoint expert third-parties to evaluate tool calls in AI systems at least every 3 months",
        application: "Mandatory",
        frequency: "Every 3 months",
        capabilities: "Automation",
        aivss_primary: "Agentic AI Tool Misuse",
        aivss_secondary: "Agent Access Control Violation",
        asiId: "ASI02",
        asiTitle: "Tool Abuse",
        confidence: "High",
        rationale:
          "Third-party testing of tool calls validates defenses against unauthorized tool execution.",
        controls: [
          {
            id: "D004.1",
            title: "Third-party tool call testing",
            fullText: "Engaging third parties for tool call evaluation.",
            category: "Third-party Evals",
            aivss_primary: "Agentic AI Tool Misuse",
            aivss_secondary: "Agent Access Control Violation",
            asiId: "ASI02",
            asiTitle: "Tool Abuse",
          },
        ],
      },
    ],
  },
  {
    id: "E",
    name: "Accountability",
    description:
      "Defining accountability, oversight, incident response, and supplier vetting for AI systems.",
    color: "#8b5cf6",
    icon: "users",
    requirements: [
      {
        id: "E001",
        title: "AI failure plan for security breaches",
        fullText:
          "Document AI failure plan for AI privacy and security breaches assigning accountable owners and establishing notification and remediation",
        application: "Mandatory",
        frequency: "Every 12 months",
        capabilities: "Universal",
        aivss_primary: "Agent Cascading Failures",
        aivss_secondary: "Agent Untraceability",
        asiId: "ASI08",
        asiTitle: "Cascading Failures",
        confidence: "High",
        rationale:
          "AI failure plans establish response procedures to contain incidents before they cascade.",
        controls: [
          {
            id: "E001.1",
            title: "Security breach failure plan",
            fullText: "Documenting failure plan for AI security breaches.",
            category: "Operational Practices",
            aivss_primary: "Agent Cascading Failures",
            aivss_secondary: "Agent Untraceability",
            asiId: "ASI08",
            asiTitle: "Cascading Failures",
          },
        ],
      },
      {
        id: "E002",
        title: "AI failure plan for harmful outputs",
        fullText:
          "Document AI failure plan for harmful AI outputs that cause significant customer harm",
        application: "Mandatory",
        frequency: "Every 12 months",
        capabilities: "Text-generation, Voice-generation, Image-generation",
        aivss_primary: "Agent Goal & Instruction Manipulation",
        aivss_secondary: "Agent Cascading Failures",
        asiId: "ASI01",
        asiTitle: "Agent Goal Hijack",
        confidence: "High",
        rationale:
          "Failure plans for harmful outputs address consequences of goal manipulation attacks.",
        controls: [
          {
            id: "E002.1",
            title: "Harmful output failure plan",
            fullText: "Documenting failure plan for harmful AI outputs.",
            category: "Operational Practices",
            aivss_primary: "Agent Goal & Instruction Manipulation",
            aivss_secondary: "Agent Cascading Failures",
            asiId: "ASI01",
            asiTitle: "Agent Goal Hijack",
          },
        ],
      },
      {
        id: "E003",
        title: "AI failure plan for hallucinations",
        fullText:
          "Document AI failure plan for hallucinated AI outputs that cause substantial customer financial loss",
        application: "Mandatory",
        frequency: "Every 12 months",
        capabilities: "Text-generation, Voice-generation",
        aivss_primary: "Agent Cascading Failures",
        aivss_secondary: "Agent Untraceability",
        asiId: "ASI08",
        asiTitle: "Cascading Failures",
        confidence: "High",
        rationale:
          "Failure plans for hallucinations address scenarios where false outputs cascade into financial harm.",
        controls: [
          {
            id: "E003.1",
            title: "Hallucination failure plan",
            fullText: "Documenting failure plan for hallucinated outputs.",
            category: "Operational Practices",
            aivss_primary: "Agent Cascading Failures",
            aivss_secondary: "Agent Untraceability",
            asiId: "ASI08",
            asiTitle: "Cascading Failures",
          },
        ],
      },
      {
        id: "E004",
        title: "Assign accountability",
        fullText:
          "Document which AI system changes require formal review or approval, assign a lead accountable for each, and document their approval with supporting evidence",
        application: "Mandatory",
        frequency: "Every 12 months",
        capabilities: "Universal",
        aivss_primary: "Agent Untraceability",
        confidence: "Medium",
        rationale: "Accountability assignments support traceability of system changes.",
        controls: [
          {
            id: "E004.1",
            title: "Accountability documentation",
            fullText: "Documenting accountability assignments for AI system changes.",
            category: "Operational Practices",
            aivss_primary: "Agent Untraceability",
          },
        ],
      },
      {
        id: "E005",
        title: "Assess cloud vs on-prem processing",
        fullText:
          "Establish criteria for selecting cloud provider, and circumstances for on-premises processing",
        application: "Mandatory",
        frequency: "Every 12 months",
        capabilities: "Universal",
        aivss_primary: "Agent Supply Chain & Dependency Risk",
        aivss_secondary: "Agent Access Control Violation",
        asiId: "ASI04",
        asiTitle: "Agentic Supply Chain Vulnerabilities",
        confidence: "High",
        rationale: "Cloud vs on-prem decisions directly impact supply chain dependencies.",
        controls: [
          {
            id: "E005.1",
            title: "Processing location criteria",
            fullText: "Establishing criteria for cloud vs on-premises processing.",
            category: "Operational Practices",
            aivss_primary: "Agent Supply Chain & Dependency Risk",
            aivss_secondary: "Agent Access Control Violation",
            asiId: "ASI04",
            asiTitle: "Agentic Supply Chain Vulnerabilities",
          },
        ],
      },
      {
        id: "E006",
        title: "Conduct vendor due diligence",
        fullText:
          "Establish AI vendor due diligence processes for foundation and upstream model providers",
        application: "Mandatory",
        frequency: "Every 12 months",
        capabilities: "Universal",
        aivss_primary: "Agent Supply Chain & Dependency Risk",
        aivss_secondary: "Agent Untraceability",
        confidence: "Medium",
        rationale: "Vendor due diligence manages supply chain risk from upstream providers.",
        controls: [
          {
            id: "E006.1",
            title: "Vendor due diligence process",
            fullText: "Establishing vendor due diligence for model providers.",
            category: "Operational Practices",
            aivss_primary: "Agent Supply Chain & Dependency Risk",
            aivss_secondary: "Agent Untraceability",
          },
        ],
      },
      {
        id: "E007",
        title: "[Retired] Document system change approvals",
        fullText: "Merged with E004 - see changelog (Q1 2026 update)",
        application: "Optional",
        frequency: "Every 12 months",
        capabilities: "Universal",
        aivss_primary: "Agent Untraceability",
        confidence: "Medium",
        rationale: "Retired - merged with E004.",
        controls: [],
      },
      {
        id: "E008",
        title: "Review internal processes",
        fullText:
          "Establish regular internal reviews of key processes and document review records and approvals",
        application: "Mandatory",
        frequency: "Every 12 months",
        capabilities: "Universal",
        aivss_primary: "Agent Untraceability",
        confidence: "Medium",
        rationale: "Internal process reviews support organizational traceability.",
        controls: [
          {
            id: "E008.1",
            title: "Internal review records",
            fullText: "Establishing regular internal reviews of key AI processes.",
            category: "Operational Practices",
            aivss_primary: "Agent Untraceability",
          },
        ],
      },
      {
        id: "E009",
        title: "Monitor third-party access",
        fullText: "Implement systems to monitor third party access",
        application: "Optional",
        frequency: "Every 12 months",
        capabilities: "Universal",
        aivss_primary: "Agent Supply Chain & Dependency Risk",
        aivss_secondary: "Agent Untraceability",
        asiId: "ASI04",
        asiTitle: "Agentic Supply Chain Vulnerabilities",
        confidence: "Medium",
        rationale: "Third-party access monitoring manages supply chain risk.",
        controls: [
          {
            id: "E009.1",
            title: "Third-party access monitoring",
            fullText: "Implementing monitoring for third-party access.",
            category: "Technical Implementation",
            aivss_primary: "Agent Supply Chain & Dependency Risk",
            aivss_secondary: "Agent Untraceability",
            asiId: "ASI04",
            asiTitle: "Agentic Supply Chain Vulnerabilities",
          },
        ],
      },
      {
        id: "E010",
        title: "Establish AI acceptable use policy",
        fullText: "Establish and implement an AI acceptable use policy",
        application: "Mandatory",
        frequency: "Every 12 months",
        capabilities: "Universal",
        aivss_primary: "Agent Untraceability",
        confidence: "Medium",
        rationale: "AI acceptable use policy establishes governance boundaries.",
        controls: [
          {
            id: "E010.1",
            title: "Acceptable use policy",
            fullText: "Establishing AI acceptable use policy.",
            category: "Operational Practices",
            aivss_primary: "Agent Untraceability",
          },
        ],
      },
      {
        id: "E011",
        title: "Record processing locations",
        fullText: "Document AI data processing locations",
        application: "Mandatory",
        frequency: "Every 12 months",
        capabilities: "Universal",
        aivss_primary: "Agent Untraceability",
        confidence: "Medium",
        rationale: "Processing location documentation supports data governance.",
        controls: [
          {
            id: "E011.1",
            title: "Processing location records",
            fullText: "Documenting AI data processing locations.",
            category: "Operational Practices",
            aivss_primary: "Agent Untraceability",
          },
        ],
      },
      {
        id: "E012",
        title: "Document regulatory compliance",
        fullText:
          "Document applicable AI laws and standards, required data protections, and strategies for compliance",
        application: "Mandatory",
        frequency: "Every 6 months",
        capabilities: "Universal",
        aivss_primary: "Agent Untraceability",
        confidence: "Medium",
        rationale: "Regulatory documentation supports compliance traceability.",
        controls: [
          {
            id: "E012.1",
            title: "Regulatory compliance documentation",
            fullText: "Documenting applicable AI laws, standards, and compliance strategies.",
            category: "Operational Practices",
            aivss_primary: "Agent Untraceability",
          },
        ],
      },
      {
        id: "E013",
        title: "Implement quality management system",
        fullText:
          "Establish a quality management system for AI systems proportionate to the size of the organization",
        application: "Optional",
        frequency: "Every 12 months",
        capabilities: "Universal",
        aivss_primary: "Agent Untraceability",
        confidence: "Medium",
        rationale: "Quality management supports systematic AI governance.",
        controls: [
          {
            id: "E013.1",
            title: "Quality management system",
            fullText: "Establishing quality management for AI systems.",
            category: "Operational Practices",
            aivss_primary: "Agent Untraceability",
          },
        ],
      },
      {
        id: "E014",
        title: "Share transparency reports",
        fullText: "Merged with E017 - see changelog (Q1 2026 update)",
        application: "Optional",
        frequency: "Every 12 months",
        capabilities: "Universal",
        aivss_primary: "Agent Untraceability",
        confidence: "High",
        rationale: "Retired - merged with E017.",
        controls: [],
      },
      {
        id: "E015",
        title: "Log model activity",
        fullText:
          "Maintain logs of AI system processes, actions, and model outputs where permitted to support incident investigation, auditing, and explanation of AI system behavior",
        application: "Mandatory",
        frequency: "Every 12 months",
        capabilities: "Universal",
        aivss_primary: "Agent Untraceability",
        asiId: "ASI10",
        asiTitle: "Rogue Agents",
        confidence: "Medium",
        rationale: "Activity logging supports traceability and incident investigation.",
        controls: [
          {
            id: "E015.1",
            title: "Model activity logging",
            fullText: "Maintaining logs of AI system processes and outputs.",
            category: "Technical Implementation",
            aivss_primary: "Agent Untraceability",
            asiId: "ASI10",
            asiTitle: "Rogue Agents",
          },
        ],
      },
      {
        id: "E016",
        title: "Implement AI disclosure mechanisms",
        fullText:
          "Implement clear disclosure mechanisms to inform users when they are interacting with AI systems rather than humans",
        application: "Mandatory",
        frequency: "Every 12 months",
        capabilities: "Universal",
        aivss_primary: "Agent Untraceability",
        confidence: "Medium",
        rationale: "AI disclosure mechanisms support transparency.",
        controls: [
          {
            id: "E016.1",
            title: "AI disclosure implementation",
            fullText: "Implementing disclosure mechanisms for AI interaction.",
            category: "Technical Implementation",
            aivss_primary: "Agent Untraceability",
          },
        ],
      },
      {
        id: "E017",
        title: "Document system transparency policy",
        fullText:
          "Establish a system transparency policy and maintain a repository of model cards, datasheets, and interpretability reports for major systems",
        application: "Optional",
        frequency: "Every 12 months",
        capabilities: "Universal",
        aivss_primary: "Agent Untraceability",
        confidence: "High",
        rationale: "System transparency supports accountability and auditability.",
        controls: [
          {
            id: "E017.1",
            title: "Transparency policy and model cards",
            fullText: "Establishing transparency policy with model cards and datasheets.",
            category: "Operational Practices",
            aivss_primary: "Agent Untraceability",
          },
        ],
      },
    ],
  },
  {
    id: "F",
    name: "Society",
    description:
      "Reducing societal harm from AI-enabled cyber attacks, exploitation, and catastrophic misuse (CBRN).",
    color: "#06b6d4",
    icon: "globe",
    requirements: [
      {
        id: "F001",
        title: "Prevent AI cyber misuse",
        fullText:
          "Implement or document guardrails to prevent AI-enabled misuse for cyber attacks and exploitation",
        application: "Mandatory",
        frequency: "Every 12 months",
        capabilities: "Text-generation, Automation, Voice-generation",
        aivss_primary: "Agentic AI Tool Misuse",
        aivss_secondary: "Agent Access Control Violation",
        confidence: "High",
        rationale:
          "Cyber misuse guardrails prevent agents from using tools for malicious purposes.",
        controls: [
          {
            id: "F001.1",
            title: "Cyber misuse guardrails",
            fullText: "Implementing guardrails to prevent AI-enabled cyber attacks.",
            category: "Technical Implementation",
            aivss_primary: "Agentic AI Tool Misuse",
            aivss_secondary: "Agent Access Control Violation",
          },
        ],
      },
      {
        id: "F002",
        title: "Prevent catastrophic misuse",
        fullText:
          "Implement or document guardrails to prevent AI-enabled catastrophic system misuse (chemical / bio / radio / nuclear)",
        application: "Mandatory",
        frequency: "Every 12 months",
        capabilities: "Text-generation, Voice-generation, Image-generation",
        aivss_primary: "Insecure Agent Critical Systems Interaction",
        aivss_secondary: "Agentic AI Tool Misuse",
        confidence: "High",
        rationale:
          "Catastrophic misuse prevention focuses on protecting critical systems from agent-induced harm.",
        controls: [
          {
            id: "F002.1",
            title: "Catastrophic misuse guardrails",
            fullText: "Implementing guardrails to prevent CBRN misuse.",
            category: "Technical Implementation",
            aivss_primary: "Insecure Agent Critical Systems Interaction",
            aivss_secondary: "Agentic AI Tool Misuse",
          },
        ],
      },
    ],
  },
];

// ASI to AIVSS bridge mapping
export const asiBridge: Record<string, string> = {
  ASI01: "Agent Goal & Instruction Manipulation",
  ASI02: "Agentic AI Tool Misuse",
  ASI03: "Agent Access Control Violation",
  ASI04: "Agent Supply Chain & Dependency Risk",
  ASI05: "Insecure Agent Critical Systems Interaction",
  ASI06: "Agent Memory & Context Manipulation",
  ASI07: "Agent Memory & Context Manipulation",
  ASI08: "Agent Cascading Failures",
  ASI09: "Agent Untraceability",
  ASI10: "Agent Goal & Instruction Manipulation",
};

export function getAiuc1Stats() {
  let requirements = 0;
  let mandatory = 0;
  let optional = 0;
  let controls = 0;
  let withAsi = 0;
  const aivssSet = new Set<string>();

  for (const p of aiuc1Principles) {
    for (const r of p.requirements) {
      requirements++;
      if (r.application === "Mandatory") mandatory++;
      else optional++;
      controls += r.controls.length;
      if (r.asiId) withAsi++;
      aivssSet.add(r.aivss_primary);
      if (r.aivss_secondary) aivssSet.add(r.aivss_secondary);
    }
  }

  return {
    principles: aiuc1Principles.length,
    requirements,
    mandatory,
    optional,
    controls,
    withAsi,
    uniqueAivss: aivssSet.size,
  };
}

export function getAllAiuc1Requirements(): Aiuc1Requirement[] {
  return aiuc1Principles.flatMap((p) => p.requirements);
}

export function getAiuc1AsiMappingCount(): number {
  return getAllAiuc1Requirements().filter((r) => r.asiId).length;
}

export function getAiuc1AivssMappingCount(): number {
  const set = new Set<string>();
  for (const r of getAllAiuc1Requirements()) {
    set.add(r.aivss_primary);
    if (r.aivss_secondary) set.add(r.aivss_secondary);
  }
  return set.size;
}

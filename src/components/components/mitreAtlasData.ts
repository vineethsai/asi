// // MITRE ATLAS (Adversarial Threat Landscape for Artificial-Intelligence Systems) Data Structure
// // Based on https://atlas.mitre.org/matrices/ATLAS

// export interface ATLASTechnique {
//   id: string; // e.g., "AML.T0043"
//   code: string; // e.g., "T0043"
//   name: string;
//   description: string;
//   tactic: string; // Parent tactic ID
//   subtechniques?: ATLASSubtechnique[];
//   mitigations: string[]; // Mitigation IDs that address this technique
//   aisvsMapping: string[]; // AISVS category codes that map to this technique
//   threatMapping: string[]; // Internal threat IDs that relate to this technique
//   references: { title: string; url: string }[];
//   examples: string[];
//   platforms: string[]; // e.g., ["Cloud", "On-Premises", "Mobile"]
//   dataSource: string[];
//   detection: string;
//   version: string;
//   created: string;
//   lastModified: string;
// }

// export interface ATLASSubtechnique {
//   id: string; // e.g., "AML.T0043.001"
//   code: string; // e.g., "T0043.001"
//   name: string;
//   description: string;
//   parentTechnique: string; // Parent technique ID
//   examples: string[];
//   mitigations: string[];
//   aisvsMapping: string[];
//   threatMapping: string[];
// }

// export interface ATLASTactic {
//   id: string; // e.g., "AML.TA0000"
//   code: string; // e.g., "TA0000"
//   name: string;
//   description: string;
//   techniques: string[]; // Technique IDs under this tactic
//   color: string;
//   icon: string;
//   displayOrder: number;
// }

// export interface ATLASCaseStudy {
//   id: string;
//   name: string;
//   description: string;
//   summary: string;
//   targetSystem: string;
//   attackVector: string;
//   techniques: string[]; // ATLAS technique IDs used
//   impact: {
//     confidentiality: boolean;
//     integrity: boolean;
//     availability: boolean;
//   };
//   timeline: string;
//   references: { title: string; url: string }[];
//   lessons: string[];
//   mitigations: string[];
// }

// // MITRE ATLAS Tactics
// export const atlasTactics: Record<string, ATLASTactic> = {
//   "reconnaissance": {
//     id: "reconnaissance",
//     code: "TA0043",
//     name: "Reconnaissance",
//     description: "The adversary is trying to gather information to plan future adversary operations.",
//     techniques: ["search_publicly_available_materials", "active_scanning"],
//     color: "#8b5cf6",
//     icon: "search",
//     displayOrder: 1
//   },
//   "resource_development": {
//     id: "resource_development",
//     code: "TA0042",
//     name: "Resource Development",
//     description: "The adversary is trying to establish resources to support operations.",
//     techniques: ["publish_poisoned_datasets", "establish_accounts"],
//     color: "#06b6d4",
//     icon: "database",
//     displayOrder: 2
//   },
//   "initial_access": {
//     id: "initial_access",
//     code: "TA0001",
//     name: "Initial Access",
//     description: "The adversary is trying to get into your AI system.",
//     techniques: ["exploit_public_facing_application", "prompt_injection", "supply_chain_compromise"],
//     color: "#10b981",
//     icon: "key",
//     displayOrder: 3
//   },
//   "ml_model_access": {
//     id: "ml_model_access",
//     code: "TA0000",
//     name: "ML Model Access",
//     description: "The adversary is trying to gain access to a machine learning model.",
//     techniques: ["inference_api_access", "physical_environment_access", "model_inference"],
//     color: "#f59e0b",
//     icon: "brain",
//     displayOrder: 4
//   },
//   "execution": {
//     id: "execution",
//     code: "TA0002",
//     name: "Execution",
//     description: "The adversary is trying to run malicious code or manipulate the AI system.",
//     techniques: ["user_execution", "backdoor_ml_model", "command_and_scripting_interpreter"],
//     color: "#ef4444",
//     icon: "play",
//     displayOrder: 5
//   },
//   "persistence": {
//     id: "persistence",
//     code: "TA0003",
//     name: "Persistence",
//     description: "The adversary is trying to maintain their foothold in your AI system.",
//     techniques: ["backdoor_ml_model", "create_account", "hijack_execution_flow"],
//     color: "#8b5cf6",
//     icon: "anchor",
//     displayOrder: 6
//   },
//   "privilege_escalation": {
//     id: "privilege_escalation",
//     code: "TA0004",
//     name: "Privilege Escalation",
//     description: "The adversary is trying to gain higher-level permissions.",
//     techniques: ["exploit_software_vulnerability", "hijack_execution_flow"],
//     color: "#f97316",
//     icon: "trending-up",
//     displayOrder: 7
//   },
//   "defense_evasion": {
//     id: "defense_evasion",
//     code: "TA0005",
//     name: "Defense Evasion",
//     description: "The adversary is trying to avoid being detected.",
//     techniques: ["adversarial_perturbations", "obfuscate_artifacts", "rogue_ml_artifacts"],
//     color: "#6366f1",
//     icon: "shield-off",
//     displayOrder: 8
//   },
//   "credential_access": {
//     id: "credential_access",
//     code: "TA0006",
//     name: "Credential Access",
//     description: "The adversary is trying to steal account names and passwords.",
//     techniques: ["unsecured_credentials", "brute_force"],
//     color: "#ec4899",
//     icon: "lock",
//     displayOrder: 9
//   },
//   "discovery": {
//     id: "discovery",
//     code: "TA0007",
//     name: "Discovery",
//     description: "The adversary is trying to figure out your AI system environment.",
//     techniques: ["system_information_discovery", "network_service_scanning"],
//     color: "#84cc16",
//     icon: "eye",
//     displayOrder: 10
//   },
//   "collection": {
//     id: "collection",
//     code: "TA0009",
//     name: "Collection",
//     description: "The adversary is trying to gather data of interest to their goal.",
//     techniques: ["data_from_information_repositories", "screen_capture"],
//     color: "#06b6d4",
//     icon: "folder",
//     displayOrder: 11
//   },
//   "ml_attack_staging": {
//     id: "ml_attack_staging",
//     code: "TA0001",
//     name: "ML Attack Staging",
//     description: "The adversary is trying to prepare for attacks against machine learning components.",
//     techniques: ["craft_adversarial_data", "train_proxy_model", "verify_attack"],
//     color: "#f59e0b",
//     icon: "target",
//     displayOrder: 12
//   },
//   "exfiltration": {
//     id: "exfiltration",
//     code: "TA0010",
//     name: "Exfiltration",
//     description: "The adversary is trying to steal data.",
//     techniques: ["exfiltration_over_web_service", "exfiltration_over_alternative_protocol"],
//     color: "#dc2626",
//     icon: "upload",
//     displayOrder: 13
//   },
//   "impact": {
//     id: "impact",
//     code: "TA0040",
//     name: "Impact",
//     description: "The adversary is trying to manipulate, interrupt, or destroy your AI systems and data.",
//     techniques: ["ml_supply_chain_compromise", "adversarial_perturbations", "data_manipulation"],
//     color: "#7c2d12",
//     icon: "zap",
//     displayOrder: 14
//   }
// };

// // MITRE ATLAS Techniques
// export const atlasTechniques: Record<string, ATLASTechnique> = {
//   // Reconnaissance Techniques
//   "search_publicly_available_materials": {
//     id: "search_publicly_available_materials",
//     code: "T1593",
//     name: "Search Publicly Available Materials",
//     description: "Adversaries may search publicly available materials to gather information about the target AI system, including research papers, documentation, and code repositories.",
//     tactic: "reconnaissance",
//     mitigations: ["m16", "m6"], // Supply Chain Security, Monitoring
//     aisvsMapping: ["C1", "C11"], // Governance, Documentation
//     threatMapping: ["t1", "t2"], // Memory Poisoning, Tool Misuse
//     references: [
//       { title: "MITRE ATLAS T1593", url: "https://atlas.mitre.org/techniques/AML.T1593" },
//       { title: "AI Model Documentation Security", url: "https://owasp.org/www-project-top-10-for-large-language-models/" }
//     ],
//     examples: [
//       "Analyzing published research papers to understand model architecture",
//       "Examining GitHub repositories for training data or model weights",
//       "Reviewing API documentation to identify potential attack vectors"
//     ],
//     platforms: ["Cloud", "On-Premises", "Web"],
//     dataSource: ["Web Traffic", "API Logs"],
//     detection: "Monitor for unusual access patterns to public documentation and repositories",
//     version: "1.0",
//     created: "2021-04-15",
//     lastModified: "2024-12-01"
//   },
//   "active_scanning": {
//     id: "active_scanning",
//     code: "T1595",
//     name: "Active Scanning",
//     description: "Adversaries may execute active reconnaissance scans to gather information that can be used during targeting of AI systems.",
//     tactic: "reconnaissance",
//     mitigations: ["m6", "m13"], // Monitoring, Runtime Security
//     aisvsMapping: ["C8", "C12"], // Network Security, Monitoring
//     threatMapping: ["t4"], // Resource Overload
//     references: [
//       { title: "MITRE ATLAS T1595", url: "https://atlas.mitre.org/techniques/AML.T1595" }
//     ],
//     examples: [
//       "Port scanning AI service endpoints",
//       "API endpoint enumeration",
//       "Vulnerability scanning of ML infrastructure"
//     ],
//     platforms: ["Cloud", "Network"],
//     dataSource: ["Network Traffic", "Firewall Logs"],
//     detection: "Monitor for suspicious scanning activities and unusual network traffic patterns",
//     version: "1.0",
//     created: "2021-04-15",
//     lastModified: "2024-12-01"
//   },

//   // Resource Development
//   "publish_poisoned_datasets": {
//     id: "publish_poisoned_datasets",
//     code: "T1608.001",
//     name: "Publish Poisoned Datasets",
//     description: "Adversaries may publish poisoned datasets to public repositories to compromise systems that consume external training data.",
//     tactic: "resource_development",
//     mitigations: ["m16", "m1"], // Supply Chain Security, Memory Validation
//     aisvsMapping: ["C2", "C3"], // Data Management, Training Data
//     threatMapping: ["t1"], // Memory Poisoning
//     references: [
//       { title: "MITRE ATLAS T1608.001", url: "https://atlas.mitre.org/techniques/AML.T1608.001" }
//     ],
//     examples: [
//       "Uploading backdoored datasets to Hugging Face",
//       "Contributing poisoned training data to open source projects",
//       "Creating malicious synthetic datasets"
//     ],
//     platforms: ["Cloud", "Web"],
//     dataSource: ["Repository Logs", "Data Validation Logs"],
//     detection: "Implement dataset integrity checking and provenance tracking",
//     version: "1.0",
//     created: "2021-04-15",
//     lastModified: "2024-12-01"
//   },

//   // Initial Access
//   "prompt_injection": {
//     id: "prompt_injection",
//     code: "T1190.000",
//     name: "Prompt Injection",
//     description: "Adversaries may craft malicious prompts to manipulate AI system behavior and bypass safety mechanisms.",
//     tactic: "initial_access",
//     mitigations: ["m4", "m11", "m5"], // Prompt Hardening, Content Security, Multi-Stage Reasoning
//     aisvsMapping: ["C4", "C7"], // Input Validation, Output Filtering
//     threatMapping: ["t1", "t2", "t3"], // Memory Poisoning, Tool Misuse, Privilege Compromise
//     references: [
//       { title: "OWASP LLM01 Prompt Injection", url: "https://owasp.org/www-project-top-10-for-large-language-models/" },
//       { title: "Prompt Injection Attack Techniques", url: "https://www.promptfoo.dev/blog/prompt-injection/" }
//     ],
//     examples: [
//       "Direct prompt injection to override system instructions",
//       "Indirect prompt injection through document content",
//       "Jailbreaking techniques to bypass safety filters"
//     ],
//     platforms: ["Cloud", "Web", "Mobile"],
//     dataSource: ["Application Logs", "Input Monitoring"],
//     detection: "Monitor for unusual prompt patterns and system instruction overrides",
//     version: "1.1",
//     created: "2021-04-15",
//     lastModified: "2024-12-01"
//   },
//   "supply_chain_compromise": {
//     id: "supply_chain_compromise",
//     code: "T1195",
//     name: "Supply Chain Compromise",
//     description: "Adversaries may manipulate AI models, datasets, or dependencies before they reach the end user.",
//     tactic: "initial_access",
//     mitigations: ["m16", "m6"], // Supply Chain Security, Monitoring
//     aisvsMapping: ["C1", "C2"], // Governance, Data Management
//     threatMapping: ["t1", "t2"], // Memory Poisoning, Tool Misuse
//     references: [
//       { title: "MITRE ATLAS T1195", url: "https://atlas.mitre.org/techniques/AML.T1195" }
//     ],
//     examples: [
//       "Compromising pre-trained models in model repositories",
//       "Injecting malicious code into ML libraries",
//       "Tampering with training datasets"
//     ],
//     platforms: ["Cloud", "On-Premises"],
//     dataSource: ["Software Repository Logs", "Model Registry Logs"],
//     detection: "Implement model and dependency integrity verification",
//     version: "1.0",
//     created: "2021-04-15",
//     lastModified: "2024-12-01"
//   },

//   // ML Model Access
//   "inference_api_access": {
//     id: "inference_api_access",
//     code: "T1133.000",
//     name: "Inference API Access",
//     description: "Adversaries may gain access to machine learning models through inference APIs for reconnaissance or attack staging.",
//     tactic: "ml_model_access",
//     mitigations: ["m7", "m6", "m9"], // Zero Trust, Monitoring, Rate Limiting
//     aisvsMapping: ["C8", "C12"], // Network Security, Monitoring
//     threatMapping: ["t2", "t4"], // Tool Misuse, Resource Overload
//     references: [
//       { title: "MITRE ATLAS T1133", url: "https://atlas.mitre.org/techniques/AML.T1133" }
//     ],
//     examples: [
//       "Accessing model through legitimate API endpoints",
//       "Using inference APIs for model extraction attacks",
//       "Probing model behavior through API calls"
//     ],
//     platforms: ["Cloud", "Web"],
//     dataSource: ["API Logs", "Network Traffic"],
//     detection: "Monitor API usage patterns and implement rate limiting",
//     version: "1.0",
//     created: "2021-04-15",
//     lastModified: "2024-12-01"
//   },

//   // Execution
//   "backdoor_ml_model": {
//     id: "backdoor_ml_model",
//     code: "T1554.000",
//     name: "Backdoor ML Model",
//     description: "Adversaries may insert backdoors into machine learning models to maintain persistent access or trigger malicious behavior.",
//     tactic: "execution",
//     mitigations: ["m1", "m6", "m16"], // Memory Validation, Monitoring, Supply Chain Security
//     aisvsMapping: ["C2", "C10"], // Data Management, Model Security
//     threatMapping: ["t1", "t3"], // Memory Poisoning, Privilege Compromise
//     references: [
//       { title: "MITRE ATLAS T1554", url: "https://atlas.mitre.org/techniques/AML.T1554" }
//     ],
//     examples: [
//       "Training models with trigger patterns",
//       "Post-training backdoor insertion",
//       "Model weight manipulation"
//     ],
//     platforms: ["Cloud", "On-Premises"],
//     dataSource: ["Model Training Logs", "Model Validation Logs"],
//     detection: "Implement model integrity checking and anomaly detection",
//     version: "1.0",
//     created: "2021-04-15",
//     lastModified: "2024-12-01"
//   },

//   // Defense Evasion
//   "adversarial_perturbations": {
//     id: "adversarial_perturbations",
//     code: "T1027.000",
//     name: "Adversarial Perturbations",
//     description: "Adversaries may use adversarial perturbations to evade detection or cause misclassification.",
//     tactic: "defense_evasion",
//     mitigations: ["m5", "m11"], // Multi-Stage Reasoning, Content Security
//     aisvsMapping: ["C4", "C7"], // Input Validation, Output Filtering
//     threatMapping: ["t1"], // Memory Poisoning
//     references: [
//       { title: "MITRE ATLAS T1027", url: "https://atlas.mitre.org/techniques/AML.T1027" }
//     ],
//     examples: [
//       "Adding imperceptible noise to images",
//       "Crafting adversarial text inputs",
//       "Audio adversarial examples"
//     ],
//     platforms: ["Cloud", "Edge", "Mobile"],
//     dataSource: ["Input Monitoring", "Model Output Logs"],
//     detection: "Implement adversarial detection mechanisms and input validation",
//     version: "1.0",
//     created: "2021-04-15",
//     lastModified: "2024-12-01"
//   },

//   // Credential Access
//   "unsecured_credentials": {
//     id: "unsecured_credentials",
//     code: "T1552",
//     name: "Unsecured Credentials",
//     description: "Adversaries may search for unsecured credentials including API keys, tokens, and certificates used by AI systems.",
//     tactic: "credential_access",
//     mitigations: ["m14", "m7"], // Agent Identity & Authentication, Zero Trust
//     aisvsMapping: ["C5", "C8"], // Authentication, Network Security
//     threatMapping: ["t3"], // Privilege Compromise
//     references: [
//       { title: "MITRE ATLAS T1552", url: "https://atlas.mitre.org/techniques/AML.T1552" }
//     ],
//     examples: [
//       "Extracting API keys from configuration files",
//       "Finding hardcoded credentials in source code",
//       "Accessing unsecured cloud storage with credentials"
//     ],
//     platforms: ["Cloud", "On-Premises"],
//     dataSource: ["File System Logs", "Configuration Monitoring"],
//     detection: "Monitor for credential access attempts and implement secure credential storage",
//     version: "1.0",
//     created: "2021-04-15",
//     lastModified: "2024-12-01"
//   },

//   // ML Attack Staging
//   "craft_adversarial_data": {
//     id: "craft_adversarial_data",
//     code: "T1588.000",
//     name: "Craft Adversarial Data",
//     description: "Adversaries may craft adversarial data to test and stage attacks against machine learning models.",
//     tactic: "ml_attack_staging",
//     mitigations: ["m5", "m11"], // Multi-Stage Reasoning, Content Security
//     aisvsMapping: ["C4", "C7"], // Input Validation, Output Filtering
//     threatMapping: ["t1"], // Memory Poisoning
//     references: [
//       { title: "MITRE ATLAS T1588", url: "https://atlas.mitre.org/techniques/AML.T1588" }
//     ],
//     examples: [
//       "Generating adversarial examples for testing",
//       "Creating poisoned training samples",
//       "Crafting evasive inputs"
//     ],
//     platforms: ["Development", "Research"],
//     dataSource: ["Development Logs", "Testing Logs"],
//     detection: "Monitor for adversarial data generation activities",
//     version: "1.0",
//     created: "2021-04-15",
//     lastModified: "2024-12-01"
//   },

//   // Impact
//   "data_manipulation": {
//     id: "data_manipulation",
//     code: "T1565",
//     name: "Data Manipulation",
//     description: "Adversaries may insert, delete, or manipulate data at rest or during transit to influence AI system behavior.",
//     tactic: "impact",
//     mitigations: ["m1", "m16", "m6"], // Memory Validation, Supply Chain Security, Monitoring
//     aisvsMapping: ["C2", "C3"], // Data Management, Training Data
//     threatMapping: ["t1"], // Memory Poisoning
//     references: [
//       { title: "MITRE ATLAS T1565", url: "https://atlas.mitre.org/techniques/AML.T1565" }
//     ],
//     examples: [
//       "Modifying training datasets",
//       "Altering model weights",
//       "Corrupting input data pipelines"
//     ],
//     platforms: ["Cloud", "On-Premises"],
//     dataSource: ["Data Integrity Logs", "Database Logs"],
//     detection: "Implement data integrity monitoring and validation",
//     version: "1.0",
//     created: "2021-04-15",
//     lastModified: "2024-12-01"
//   }
// };

// // MITRE ATLAS Case Studies
// export const atlasCaseStudies: Record<string, ATLASCaseStudy> = {
//   "tay_poisoning": {
//     id: "tay_poisoning",
//     name: "Microsoft Tay Chatbot Poisoning",
//     description: "Coordinated attack on Microsoft's Tay chatbot through malicious user interactions",
//     summary: "Attackers exploited Tay's learning mechanism by flooding it with offensive content, causing the bot to generate inappropriate responses within 24 hours of launch.",
//     targetSystem: "Microsoft Tay Chatbot",
//     attackVector: "Social Media Manipulation",
//     techniques: ["prompt_injection", "data_manipulation"],
//     impact: {
//       confidentiality: false,
//       integrity: true,
//       availability: true
//     },
//     timeline: "March 2016 - Bot taken offline within 24 hours",
//     references: [
//       { title: "Microsoft Tay Incident Analysis", url: "https://atlas.mitre.org/studies/AML.CS0001" },
//       { title: "Learning from Tay's Introduction", url: "https://blogs.microsoft.com/blog/2016/03/25/learning-tays-introduction/" }
//     ],
//     lessons: [
//       "Implement robust content filtering before deployment",
//       "Consider adversarial training scenarios",
//       "Plan for rapid response to model poisoning"
//     ],
//     mitigations: ["m4", "m11", "m6"] // Prompt Hardening, Content Security, Monitoring
//   },
//   "clearview_ai": {
//     id: "clearview_ai",
//     name: "ClearviewAI Data Scraping",
//     description: "Unauthorized scraping of billions of images from social media platforms for facial recognition training",
//     summary: "ClearviewAI scraped over 3 billion images from social media platforms without consent, creating privacy and ethical concerns around facial recognition systems.",
//     targetSystem: "Social Media Platforms",
//     attackVector: "Web Scraping",
//     techniques: ["search_publicly_available_materials", "data_manipulation"],
//     impact: {
//       confidentiality: true,
//       integrity: false,
//       availability: false
//     },
//     timeline: "2017-2020 - Ongoing scraping operations",
//     references: [
//       { title: "ClearviewAI Case Study", url: "https://atlas.mitre.org/studies/AML.CS0007" }
//     ],
//     lessons: [
//       "Implement data usage consent mechanisms",
//       "Monitor for unauthorized data collection",
//       "Consider privacy implications of training data"
//     ],
//     mitigations: ["m16", "m6", "m7"] // Supply Chain Security, Monitoring, Zero Trust
//   },
//   "gpt2_replication": {
//     id: "gpt2_replication",
//     name: "GPT-2 Model Replication",
//     description: "Independent replication of OpenAI's GPT-2 model using publicly available information",
//     summary: "Researchers successfully replicated OpenAI's GPT-2 model architecture and training approach, demonstrating model extraction risks.",
//     targetSystem: "OpenAI GPT-2",
//     attackVector: "Model Extraction",
//     techniques: ["search_publicly_available_materials", "inference_api_access"],
//     impact: {
//       confidentiality: true,
//       integrity: false,
//       availability: false
//     },
//     timeline: "2019 - Model successfully replicated",
//     references: [
//       { title: "GPT-2 Replication Study", url: "https://atlas.mitre.org/studies/AML.CS0008" }
//     ],
//     lessons: [
//       "Limit information disclosure about model architectures",
//       "Consider intellectual property protection strategies",
//       "Monitor for model extraction attempts"
//     ],
//     mitigations: ["m16", "m6", "m7"] // Supply Chain Security, Monitoring, Zero Trust
//   },
//   "proofpoint_evasion": {
//     id: "proofpoint_evasion",
//     name: "ProofPoint Email Security Evasion",
//     description: "Adversarial attack against ProofPoint's email security ML classifier",
//     summary: "Researchers demonstrated how to craft adversarial emails that bypass ProofPoint's machine learning-based email security filters.",
//     targetSystem: "ProofPoint Email Security",
//     attackVector: "Adversarial Examples",
//     techniques: ["adversarial_perturbations", "craft_adversarial_data"],
//     impact: {
//       confidentiality: false,
//       integrity: true,
//       availability: false
//     },
//     timeline: "2019 - Evasion techniques demonstrated",
//     references: [
//       { title: "ProofPoint Evasion Study", url: "https://atlas.mitre.org/studies/AML.CS0010" }
//     ],
//     lessons: [
//       "Implement adversarial training for security models",
//       "Use ensemble methods for robustness",
//       "Continuous model updating and monitoring"
//     ],
//     mitigations: ["m5", "m11", "m6"] // Multi-Stage Reasoning, Content Security, Monitoring
//   }
// };

// // Mapping functions to connect MITRE ATLAS with existing data
// export const getATLASTechniquesForThreat = (threatId: string): ATLASTechnique[] => {
//   return Object.values(atlasTechniques).filter(technique => 
//     technique.threatMapping.includes(threatId)
//   );
// };

// export const getATLASTechniquesForAISVS = (aisvsCode: string): ATLASTechnique[] => {
//   return Object.values(atlasTechniques).filter(technique => 
//     technique.aisvsMapping.includes(aisvsCode)
//   );
// };

// export const getThreatMappingStats = () => {
//   const totalTechniques = Object.keys(atlasTechniques).length;
//   const mappedTechniques = Object.values(atlasTechniques).filter(
//     technique => technique.threatMapping.length > 0
//   ).length;
  
//   const totalThreats = 15; // Based on current threat count
//   const threatsWithAtlasMapping = new Set(
//     Object.values(atlasTechniques).flatMap(technique => technique.threatMapping)
//   ).size;
  
//   return {
//     totalTechniques,
//     mappedTechniques,
//     totalThreats,
//     threatsWithAtlasMapping,
//     coveragePercentage: Math.round((mappedTechniques / totalTechniques) * 100)
//   };
// };

// // Export all data
// export {
//   atlasTactics,
//   atlasTechniques,
//   atlasCaseStudies
// }; 
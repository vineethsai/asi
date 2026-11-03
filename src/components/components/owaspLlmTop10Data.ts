/**
 * OWASP Top 10 for LLM Applications, 2026 edition (published 2026-08-04, CC BY-SA 4.0).
 *
 * The 2026 edition replaced the 2025 list (Nov 2024): Excessive Agency moved from #6 to #3,
 * Unbounded Consumption from #10 to #6, Improper Output Handling from #5 to #10, and System
 * Prompt Leakage was broadened into Hidden Context Exposure (#8). Every entry records its 2025
 * id in `previous`, so citations of the old numbering (the Agentic Top 10 and AIVSS still use
 * "LLM06:2025 …") resolve through `findLlmTop10Entry()`.
 *
 * What is official and what is editorial:
 * - `id`, `code`, `name`, `previous`: official (OWASP source repo, 2026/final, and the 2025
 *   per-risk pages).
 * - `summary`, `examples`: this site's paraphrase of the entry's Description and "Common Examples
 *   of Risk"; read the linked source for OWASP's text.
 * - `relatedAsi`, `atlasTactics`, `cwe`: official, the primary (●) mappings of the edition's
 *   Appendix A "Related Framework Mappings" (ATLAS tactic names checked against ATLAS 2026.10).
 * - `relatedAisvs` / `supportingAisvs`: official, the primary (●) / supporting (○) chapters of
 *   the edition's AISVS appendix (mapped to AISVS 1.0; chapters C1–C12 are unchanged in 1.01).
 * - `relatedCiscoObjectives`: derived from Cisco's own taxonomy data (techniques and
 *   sub-techniques carrying "OWASP: LLMxx:2026"); check:data warns when they drift.
 * - `relatedThreats` (OWASP Agentic AI T&M v1.1) and `relatedControls` (this site's m1–m20):
 *   editorial, explained in `mappingNote`. Every entry keeps at least one threat that its
 *   official ASI mappings already reach (enforced by `npm run check:data`).
 */

export interface LlmTop10Reference {
  title: string;
  url: string;
}

export interface LlmTop10Entry {
  /** Rank in the current edition, e.g. "LLM01" (deep link: /taxonomy?tab=llm-top10&entry=LLM01). */
  id: string;
  /** Edition-qualified code as OWASP cites it, e.g. "LLM01:2026". */
  code: string;
  /** Official 2026 name. */
  name: string;
  /** The same risk in the 2025 edition. */
  previous: { id: string; code: string; name: string; url: string };
  /** One-paragraph paraphrase of the entry's description (this site's words). */
  summary: string;
  /** Paraphrased "Common Examples of Risk". */
  examples: string[];
  /** OWASP Agentic Top 10 ids, Appendix A primary mappings (official). */
  relatedAsi: string[];
  /** AISVS chapters marked as primary defence in the edition's AISVS appendix (official). */
  relatedAisvs: string[];
  /** AISVS chapters marked as supporting defence (official). */
  supportingAisvs: string[];
  /** MITRE ATLAS tactics, Appendix A primary mappings (official). */
  atlasTactics: string[];
  /** CWE ids, Appendix A primary mappings (official). */
  cwe: string[];
  /** Cisco v2 objectives whose techniques cite this entry (derived from Cisco's data). */
  relatedCiscoObjectives: string[];
  /** OWASP Agentic AI Threats & Mitigations v1.1 threat ids (editorial). */
  relatedThreats: string[];
  /** This site's control ids (editorial). */
  relatedControls: string[];
  /** Why the editorial threat and control links were chosen. */
  mappingNote: string;
  references: LlmTop10Reference[];
}

/** Edition of the OWASP Top 10 for LLM Applications this data follows. */
export const OWASP_LLM_TOP10_EDITION = {
  name: "OWASP Top 10 for LLM Applications",
  version: "2026",
  published: "2026-08-04",
  previousVersion: "2025",
} as const;

const REPO_SHA = "9253e38ade58e959b531c0c5c9a4842272c9cd0e";
const SOURCE_DIR = "https://github.com/GenAI-Security-Project/GenAI-LLM-Top10/blob/main/2026/final";

export const source = {
  name: "OWASP Top 10 for LLM Applications",
  version: "2026 (v1.0, Aug 2026)",
  url: "https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/",
  dataUrl: `https://github.com/GenAI-Security-Project/GenAI-LLM-Top10/tree/${REPO_SHA}/2026/final`,
  retrievedAt: "2026-11-03",
};

/** ATLAS tactic names (ATLAS 2026.10) for the tactics cited in `atlasTactics`. */
export const LLM_ATLAS_TACTICS: Record<string, string> = {
  "AML.TA0003": "Resource Development",
  "AML.TA0004": "Initial Access",
  "AML.TA0005": "Execution",
  "AML.TA0006": "Persistence",
  "AML.TA0007": "Defense Evasion",
  "AML.TA0008": "Discovery",
  "AML.TA0010": "Exfiltration",
  "AML.TA0011": "Impact",
};

/** CWE 4.20 names for the ids cited in `cwe`. */
export const LLM_CWE_NAMES: Record<string, string> = {
  "CWE-79": "Improper Neutralization of Input During Web Page Generation ('Cross-site Scripting')",
  "CWE-116": "Improper Encoding or Escaping of Output",
  "CWE-200": "Exposure of Sensitive Information to an Unauthorized Actor",
  "CWE-212": "Improper Removal of Sensitive Information Before Storage or Transfer",
  "CWE-285": "Improper Authorization",
  "CWE-349": "Acceptance of Extraneous Untrusted Data With Trusted Data",
  "CWE-359": "Exposure of Private Personal Information to an Unauthorized Actor",
  "CWE-400": "Uncontrolled Resource Consumption",
  "CWE-494": "Download of Code Without Integrity Check",
  "CWE-532": "Insertion of Sensitive Information into Log File",
  "CWE-732": "Incorrect Permission Assignment for Critical Resource",
  "CWE-770": "Allocation of Resources Without Limits or Throttling",
  "CWE-829": "Inclusion of Functionality from Untrusted Control Sphere",
  "CWE-1426": "Improper Validation of Generative AI Output",
  "CWE-1427": "Improper Neutralization of Input Used for LLM Prompting",
};

/** atlas.mitre.org page for a tactic id ("AML.TA0004"). */
export const atlasTacticUrl = (id: string) => `https://atlas.mitre.org/tactics/${id}`;

/** cwe.mitre.org page for a CWE id ("CWE-200"). */
export const cweUrl = (id: string) =>
  `https://cwe.mitre.org/data/definitions/${id.replace(/^CWE-/, "")}.html`;

const LLM_RISK_2025 = "https://genai.owasp.org/llmrisk";

export const llmTop10Data: LlmTop10Entry[] = [
  {
    id: "LLM01",
    code: "LLM01:2026",
    name: "Prompt Injection",
    previous: {
      id: "LLM01",
      code: "LLM01:2025",
      name: "Prompt Injection",
      url: `${LLM_RISK_2025}/llm01-prompt-injection/`,
    },
    summary:
      "Anything that reaches the model's context can carry instructions: a user message, a retrieved page or document, a tool result, an image or audio clip, earlier reasoning or stored memory. A model reads instructions and data as one stream of tokens, so there is no equivalent of a parameterised query, and injected text can change what the model says or does against the developer's intent. The 2026 entry names three amplifiers: everything in the context window shares one trust level, injections written to memory or a retrieval corpus persist into later sessions, and once model output drives tools the damage reaches whatever those tools can touch. The entry owns the input boundary; leaks, privileged actions and unsafe output handling belong to LLM02, LLM03 and LLM10.",
    examples: [
      "A user message overrides the system prompt's role or limits, deliberately (a jailbreak) or by accident.",
      "Instructions hidden in a web page, document, email or retrieved passage take effect once the content is pulled into context (indirect injection).",
      "Text planted in a low-privilege channel the user trusts, such as an issue tracker or a support ticket, makes the user's own assistant act with the user's credentials.",
      "Instructions concealed in images, audio or video, below what a person would notice, are picked up by the model's encoder.",
      "Invisible Unicode (tag, variation-selector or zero-width characters) smuggles instructions in, or data out, inside harmless-looking text.",
      "One poisoned entry in persistent memory or a retrieval corpus fires again in every later session that reads it.",
      "A vendor's fine-tuning API is used as a loss oracle to optimise injection payloads against a closed model.",
      "Payloads in low-resource languages or encodings (Base64, ROT13, emoji) slip past filters that never saw them.",
    ],
    relatedAsi: ["ASI01", "ASI02", "ASI03", "ASI05", "ASI06", "ASI08", "ASI09"],
    relatedAisvs: ["C2", "C9", "C10", "C11", "C12"],
    supportingAisvs: ["C7"],
    atlasTactics: ["AML.TA0004", "AML.TA0005", "AML.TA0006", "AML.TA0007", "AML.TA0010"],
    cwe: ["CWE-1427"],
    relatedCiscoObjectives: [
      "OB-001",
      "OB-004",
      "OB-005",
      "OB-007",
      "OB-009",
      "OB-011",
      "OB-015",
      "OB-017",
      "OB-018",
    ],
    relatedThreats: ["t6", "t1", "t2"],
    relatedControls: ["m4", "m11", "m7", "m8", "m1", "m19"],
    mappingNote:
      "Threats: T6 is what a successful injection achieves (the agent's goal or plan is redirected), T1 covers injections persisted in memory or a retrieval corpus, and T2 covers injected instructions that drive tool calls. Controls follow the entry's mitigations: constrain the role in the system prompt (M4), validate output against a strict schema (M11), least privilege per operation (M7), human confirmation for privileged actions (M8), treat memory writes as privileged (M1), and pin and verify MCP servers and tools (M19).",
    references: [
      {
        title: "LLM01:2026 Prompt Injection (OWASP source)",
        url: `${SOURCE_DIR}/LLM01_PromptInjection.md`,
      },
      {
        title: "LLM01:2025 Prompt Injection (previous edition)",
        url: `${LLM_RISK_2025}/llm01-prompt-injection/`,
      },
    ],
  },
  {
    id: "LLM02",
    code: "LLM02:2026",
    name: "Sensitive Information Disclosure",
    previous: {
      id: "LLM02",
      code: "LLM02:2025",
      name: "Sensitive Information Disclosure",
      url: `${LLM_RISK_2025}/llm022025-sensitive-information-disclosure/`,
    },
    summary:
      "Confidential, regulated or proprietary data leaves an LLM system through a channel its owner never authorised. The answer text is only one such channel: tool-call arguments, reasoning traces, retrieved chunks, logs and telemetry, embeddings and measurable side effects such as response length or timing can all disclose data, so each deserves the same classification and redaction rules. Leaks can start at training time (memorised data), at inference time (live context), in pipelines (fine-tuning, distillation, observability) or by observation alone (side channels). Two causes recur: over-shared data sources that feed retrieval exactly as designed, and data that persists in weights, adapters or vectors after the source is deleted.",
    examples: [
      "Extraction attacks make a model or a fine-tuned adapter reproduce memorised training data.",
      "Live context (the system prompt, retrieved documents, files or another user's session) appears in a response, or a summary or translation reveals more than was asked for.",
      "Leaked or exported embeddings are inverted back into the source text.",
      "Vision and multimodal models read credentials or personal data out of screenshots and documents, or reproduce identifiable images.",
      "Side channels such as token length, latency, log-probabilities or shared caches reveal membership or conversation topics without exposing the content.",
      "Fine-tuning, distillation or synthetic-data pipelines carry sensitive examples into derived models.",
      "Observability platforms and logs keep full prompts, completions and traces that are later exposed.",
    ],
    relatedAsi: ["ASI06"],
    relatedAisvs: ["C5", "C7", "C8", "C11"],
    supportingAisvs: ["C1", "C12"],
    atlasTactics: ["AML.TA0010"],
    cwe: ["CWE-200", "CWE-359", "CWE-212", "CWE-532"],
    relatedCiscoObjectives: ["OB-004", "OB-007", "OB-008", "OB-010", "OB-014", "OB-015", "OB-016"],
    relatedThreats: ["t3", "t1"],
    relatedControls: ["m11", "m7", "m1", "m6"],
    mappingNote:
      "Threats: T3 explicitly includes unauthorised data access and leakage across context boundaries, and T1 (through ASI06) covers memory that leaks data across sessions. Controls follow the entry's tiered mitigations: classifier-based sanitisation and redaction of every output channel (M11), authorisation before retrieval (M7), governed corpora and protected vector stores (M1), and AI-aware audit logging (M6).",
    references: [
      {
        title: "LLM02:2026 Sensitive Information Disclosure (OWASP source)",
        url: `${SOURCE_DIR}/LLM02_SensitiveInformationDisclosure.md`,
      },
      {
        title: "LLM02:2025 Sensitive Information Disclosure (previous edition)",
        url: `${LLM_RISK_2025}/llm022025-sensitive-information-disclosure/`,
      },
    ],
  },
  {
    id: "LLM03",
    code: "LLM03:2026",
    name: "Excessive Agency",
    previous: {
      id: "LLM06",
      code: "LLM06:2025",
      name: "Excessive Agency",
      url: `${LLM_RISK_2025}/llm062025-excessive-agency/`,
    },
    summary:
      "When an LLM application can call tools or act on other systems, unexpected, ambiguous or manipulated model output can trigger damaging actions. What makes the model misbehave does not matter (a hallucination, a direct or indirect prompt injection, a compromised tool or peer agent); the weakness is that the system lets the output do more than the task needs. OWASP names three root causes: excessive functionality (tools or functions the task does not require), excessive permissions (downstream rights broader than needed) and excessive autonomy (high-impact actions without independent approval). In agentic systems it shows up as tool misuse, identity and privilege abuse and cascading failures. Filtering inputs and outputs does not fix it; limiting tools, permissions and autonomy does. It moved from sixth to third place in 2026.",
    examples: [
      "A tool chosen for reading documents can also modify or delete them.",
      "A tool tried during development is no longer needed but is still available to the agent.",
      "An open-ended tool, such as one meant to run a single shell command, does not stop other commands.",
      "A read-only tool connects with an identity that can also update, insert and delete.",
      "A tool acting for one user reaches downstream systems through a shared, highly privileged account.",
      "High-impact actions such as deletions run without the user confirming them.",
    ],
    relatedAsi: ["ASI01", "ASI02", "ASI03", "ASI05", "ASI07", "ASI08", "ASI09"],
    relatedAisvs: ["C5", "C9", "C10"],
    supportingAisvs: ["C12"],
    atlasTactics: ["AML.TA0005", "AML.TA0011"],
    cwe: ["CWE-285", "CWE-732"],
    relatedCiscoObjectives: [
      "OB-002",
      "OB-003",
      "OB-004",
      "OB-009",
      "OB-012",
      "OB-013",
      "OB-014",
      "OB-018",
    ],
    relatedThreats: ["t2", "t3", "t11"],
    relatedControls: ["m7", "m2", "m8", "m6", "m9"],
    mappingNote:
      "Threats: the entry says Excessive Agency manifests as tool misuse (T2) and privilege abuse (T3), and its open-ended shell tool example is unexpected code execution (T11). Controls follow the entry's mitigations: minimise tools, functions and permissions and run them in the user's context (M7), avoid open-ended tools and sandbox them (M2), require user approval for high-impact actions (M8), monitor tool use (M6) and rate-limit it (M9).",
    references: [
      {
        title: "LLM03:2026 Excessive Agency (OWASP source)",
        url: `${SOURCE_DIR}/LLM03_ExcessiveAgency.md`,
      },
      {
        title: "LLM06:2025 Excessive Agency (previous edition)",
        url: `${LLM_RISK_2025}/llm062025-excessive-agency/`,
      },
    ],
  },
  {
    id: "LLM04",
    code: "LLM04:2026",
    name: "Supply Chain",
    previous: {
      id: "LLM03",
      code: "LLM03:2025",
      name: "Supply Chain",
      url: `${LLM_RISK_2025}/llm032025-supply-chain/`,
    },
    summary:
      "LLM applications inherit risk from everything they did not build themselves: third-party models and datasets, LoRA and other parameter-efficient adapters, conversion, merge and quantisation pipelines, serving frameworks and the platforms that host them. Tampered or poisoned artifacts, weak provenance and unsafe formats can lead to biased output, compromise or outages, and model artifacts are far harder to inspect than code. The 2026 entry treats artifact provenance and the promotion of artifacts into trusted environments as first-class attack surfaces and adds models shipped on devices. Supply-chain risk specific to agents, such as MCP servers and tool registries, is left to ASI04.",
    examples: [
      "Outdated or vulnerable packages, serving frameworks or models are exploited, including package names that coding assistants hallucinate and attackers register first (slopsquatting).",
      "Model and dataset licences carry obligations that are missed, creating legal exposure.",
      "A pre-trained model carries a backdoor or bias, hidden in its weights, in its computational graph or in a file crafted to exploit the loader.",
      "Unsigned or mutable model artifacts are swapped or altered in transit, in storage or when a pipeline promotes them, for example by resolving a 'latest' tag instead of a digest.",
      "A malicious adapter, or a compromised conversion, merge or quantisation step, changes how the deployed model behaves.",
      "Models shipped on devices are exposed through compromised manufacturing, firmware flaws or repackaged apps.",
      "Unclear provider terms let application data be used for training, with later exposure or copyright risk.",
    ],
    relatedAsi: ["ASI04"],
    relatedAisvs: ["C3", "C4", "C6"],
    supportingAisvs: ["C1", "C10"],
    atlasTactics: ["AML.TA0004"],
    cwe: ["CWE-494", "CWE-829"],
    relatedCiscoObjectives: ["OB-001", "OB-004", "OB-005", "OB-007", "OB-009", "OB-012", "OB-018"],
    relatedThreats: ["t17"],
    relatedControls: ["m17", "m20", "m13"],
    mappingNote:
      "Threat: T17 Supply Chain Compromise is the agentic counterpart the entry itself points to (through ASI04). Controls: model and component provenance and third-party validation (M17), signing, pinning and an AI bill of materials for models, adapters and templates (M20), and dependency scanning and patch policy in the development lifecycle (M13).",
    references: [
      {
        title: "LLM04:2026 Supply Chain (OWASP source)",
        url: `${SOURCE_DIR}/LLM04_SupplyChain.md`,
      },
      {
        title: "LLM03:2025 Supply Chain (previous edition)",
        url: `${LLM_RISK_2025}/llm032025-supply-chain/`,
      },
    ],
  },
  {
    id: "LLM05",
    code: "LLM05:2026",
    name: "Data and Model Poisoning",
    previous: {
      id: "LLM04",
      code: "LLM04:2025",
      name: "Data and Model Poisoning",
      url: `${LLM_RISK_2025}/llm042025-data-and-model-poisoning/`,
    },
    summary:
      "An attacker, or a careless process, manipulates data or model artifacts so that the system learns harmful behaviour, bias or a hidden backdoor. Poisoning can happen wherever data is ingested or reused: pre-training, fine-tuning, embeddings and retrieval, models reused from upstream and continuous-learning pipelines, as well as bundled artifacts such as chat templates, tokenizer configurations and adapters. A poisoned model can behave normally until a trigger appears, and fixing it can mean revalidating data, retraining or replacing the model rather than patching code. The 2026 entry also covers fine-tuning that deliberately erodes safety behaviour; injection at inference time belongs to LLM01 and attacks on embedding geometry to LLM09.",
    examples: [
      "Biased or malicious samples are added to training or fine-tuning data, for example to wear down refusals while keeping accuracy.",
      "Mislabelled records teach a fraud-detection model to accept fraud.",
      "Trigger phrases contributed to a popular open dataset spread into every model fine-tuned on it.",
      "A few hundred poisoned documents are enough to implant a backdoor, whatever the model or corpus size.",
      "Hidden instructions in web content poison an assistant's memory or recommendations.",
      "One optimised passage per targeted query overrides correct content in a retrieval corpus.",
      "Poisoned inputs spread across multi-agent workflows and the systems they reach.",
      "Small amounts of poisoned medical data change clinical outputs while passing standard evaluations.",
      "Backdoored models published to public repositories are inherited by whoever downloads them.",
    ],
    relatedAsi: ["ASI04", "ASI06", "ASI08"],
    relatedAisvs: ["C1", "C3", "C8", "C11"],
    supportingAisvs: ["C6", "C12"],
    atlasTactics: ["AML.TA0003", "AML.TA0006", "AML.TA0011"],
    cwe: ["CWE-349", "CWE-829"],
    relatedCiscoObjectives: ["OB-005", "OB-006", "OB-007", "OB-011", "OB-018", "OB-019"],
    relatedThreats: ["t1", "t17"],
    relatedControls: ["m12", "m1", "m17"],
    mappingNote:
      "Threats: memory and retrieval-corpus poisoning is T1, and backdoored models from public repositories are T17. Controls: data integrity, lineage and adversarial validation in the training pipeline (M12), validation and sanitisation of memory and vector stores (M1), and provenance checks on third-party models and datasets (M17).",
    references: [
      {
        title: "LLM05:2026 Data and Model Poisoning (OWASP source)",
        url: `${SOURCE_DIR}/LLM05_DataModelPoisoning.md`,
      },
      {
        title: "LLM04:2025 Data and Model Poisoning (previous edition)",
        url: `${LLM_RISK_2025}/llm042025-data-and-model-poisoning/`,
      },
    ],
  },
  {
    id: "LLM06",
    code: "LLM06:2026",
    name: "Unbounded Consumption",
    previous: {
      id: "LLM10",
      code: "LLM10:2025",
      name: "Unbounded Consumption",
      url: `${LLM_RISK_2025}/llm102025-unbounded-consumption/`,
    },
    summary:
      "An LLM application that does not control how much inference it performs lets attackers degrade availability, run up costs or copy the model. The defining feature is cost asymmetry: a cheap request can trigger expensive computation, by way of crafted prompts, misused credentials or tampered workflows. Reasoning models with large thinking budgets, multimodal inputs, agentic tool use that fans one request out into many calls and shared inference infrastructure all make it worse, so request-rate limits alone are no longer enough; the entry calls for token-aware cost controls, hard spending caps and circuit breakers for agents. It moved from tenth to sixth place in 2026.",
    examples: [
      "Floods of variable-length inputs, or a poisoned model that always generates to the maximum length, exhaust capacity.",
      "High volumes of paid operations create a denial of wallet.",
      "Requests kept just under the context limit, or ever-growing context, consume disproportionate compute and memory.",
      "Short, harmless-looking prompts push reasoning models into very long or endless thinking.",
      "Inputs optimised for maximum compute cost (sponge examples, adversarial image perturbations) are submitted.",
      "Image, audio and video inputs turn one request into far more tokens than comparable text.",
      "Systematic querying, sped up by exposed log-probabilities, collects enough output to replicate or distil the model.",
      "Malicious tools drive the application into recursive or fan-out tool-calling loops.",
      "Flaws in serving frameworks are exploited to crash the service or exhaust its resources.",
    ],
    relatedAsi: ["ASI02", "ASI08"],
    relatedAisvs: ["C9", "C11", "C12"],
    supportingAisvs: ["C5", "C7"],
    atlasTactics: ["AML.TA0011", "AML.TA0010"],
    cwe: ["CWE-400", "CWE-770"],
    relatedCiscoObjectives: ["OB-010", "OB-011", "OB-013"],
    relatedThreats: ["t4"],
    relatedControls: ["m9", "m14", "m6"],
    mappingNote:
      "Threat: T4 Resource Overload is the same failure in an agentic system (reached through ASI02). Controls follow the entry's mitigations: rate limits, quotas, spending caps and circuit breakers (M9), sandboxing and resource limits at run time (M14), and monitoring for resource-intensive tool interactions (M6).",
    references: [
      {
        title: "LLM06:2026 Unbounded Consumption (OWASP source)",
        url: `${SOURCE_DIR}/LLM06_UnboundedConsumption.md`,
      },
      {
        title: "LLM10:2025 Unbounded Consumption (previous edition)",
        url: `${LLM_RISK_2025}/llm102025-unbounded-consumption/`,
      },
    ],
  },
  {
    id: "LLM07",
    code: "LLM07:2026",
    name: "Misinformation",
    previous: {
      id: "LLM09",
      code: "LLM09:2025",
      name: "Misinformation",
      url: `${LLM_RISK_2025}/llm092025-misinformation/`,
    },
    summary:
      "An LLM produces wrong, incomplete, unsupported or misleading information that looks credible enough for a person, a workflow or an agent to act on. The 2026 entry treats this as a system-level failure: model output now drives tool calls, generated code, inferred system state and decisions passed between agents, so a confident error can turn into a security incident, a financial loss or a safety problem. Causes include hallucination, stale or partial context, weak grounding, biased data, misleading summaries, unvalidated tool output and deliberate manipulation, and overreliance on fluent output is often built into the design itself.",
    examples: [
      "Unsupported output informs business, legal, medical, financial or operational decisions.",
      "The model concludes that a workflow condition is met when it is not, and an action fires.",
      "Generated code is wrong or references packages that do not exist.",
      "Summaries drop key constraints, exceptions, dates or risks.",
      "Attackers craft inputs that produce false claims or leave out critical facts.",
      "An incorrect output from one agent is trusted and passed on by others.",
      "Fabricated or misattributed content is presented as authoritative evidence.",
    ],
    relatedAsi: ["ASI08", "ASI09", "ASI10"],
    relatedAisvs: ["C7", "C12"],
    supportingAisvs: ["C1", "C8", "C11"],
    atlasTactics: ["AML.TA0011"],
    cwe: ["CWE-1426"],
    relatedCiscoObjectives: ["OB-015"],
    relatedThreats: ["t5", "t7"],
    relatedControls: ["m5", "m11", "m8", "m16"],
    mappingNote:
      "Threats: errors that propagate through an agentic system are T5 Cascading Hallucination Attacks, and fabricated evidence or false task completion is T7 Misaligned & Deceptive Behaviors. Controls follow the entry's mitigations: ground claims and check them before acting (M5), structured output with mandatory fields (M11), approval workflows for high-impact actions (M8), and monitoring for misleading output (M16).",
    references: [
      {
        title: "LLM07:2026 Misinformation (OWASP source)",
        url: `${SOURCE_DIR}/LLM07_Misinformation.md`,
      },
      {
        title: "LLM09:2025 Misinformation (previous edition)",
        url: `${LLM_RISK_2025}/llm092025-misinformation/`,
      },
    ],
  },
  {
    id: "LLM08",
    code: "LLM08:2026",
    name: "Hidden Context Exposure",
    previous: {
      id: "LLM07",
      code: "LLM07:2025",
      name: "System Prompt Leakage",
      url: `${LLM_RISK_2025}/llm072025-system-prompt-leakage/`,
    },
    summary:
      "Users can extract, infer or reconstruct context they were never meant to see: the system prompt, developer instructions, retrieved policy text, tool and function schemas and anything else the application places in the model's context window. Renamed and broadened from System Prompt Leakage (LLM07:2025), the entry tells teams to assume hidden context is discoverable. The risk lies in what it contains or what the application relies on it for: credentials, filtering rules, role checks or workflow logic. Severity ranges from informational to critical, and exposure often makes injection, disclosure, excessive agency and output-handling attacks easier.",
    examples: [
      "Hidden context reveals tools, function schemas, architecture details or embedded secrets such as API keys and database credentials.",
      "Internal decision logic is exposed, showing attackers how to steer or bypass the application.",
      "Leaked refusal and filtering rules let attackers craft inputs that avoid them.",
      "Role and permission rules, for example in an internal MCP tool description, invite targeted probing.",
      "Exposed output formats and schemas help attackers produce well-formed but manipulated output for downstream parsers.",
    ],
    relatedAsi: ["ASI06", "ASI07"],
    relatedAisvs: ["C7", "C9", "C11"],
    supportingAisvs: ["C2", "C5", "C12"],
    atlasTactics: ["AML.TA0008", "AML.TA0010"],
    cwe: ["CWE-200"],
    relatedCiscoObjectives: ["OB-008"],
    relatedThreats: ["t3", "t6"],
    relatedControls: ["m4", "m7", "m11"],
    mappingNote:
      "Threats: relying on hidden context for authorisation is a privilege boundary that fails (T3), and disclosed rules make goal manipulation easier to target (T6, reached through ASI06). Controls follow the entry's three mitigations: keep secrets out of prompts and harden them (M4), enforce authorisation outside the model (M7), and use deterministic guardrails for validation and behaviour control (M11).",
    references: [
      {
        title: "LLM08:2026 Hidden Context Exposure (OWASP source)",
        url: `${SOURCE_DIR}/LLM08_HiddenContextExposure.md`,
      },
      {
        title: "LLM07:2025 System Prompt Leakage (previous edition)",
        url: `${LLM_RISK_2025}/llm072025-system-prompt-leakage/`,
      },
    ],
  },
  {
    id: "LLM09",
    code: "LLM09:2026",
    name: "Vector and Embedding Weaknesses",
    previous: {
      id: "LLM08",
      code: "LLM08:2025",
      name: "Vector and Embedding Weaknesses",
      url: `${LLM_RISK_2025}/llm082025-vector-and-embedding-weaknesses/`,
    },
    summary:
      "Applications that embed text, images, code or audio and use similarity search to decide what the model sees (retrieval-augmented generation, vector-backed agent memory, semantic caches, deduplication) make the embedding layer part of their trust boundary. These attacks exploit the geometry of the embedding space and the mechanics of retrieval rather than the model's instruction following, and many work with content that carries no instructions at all. OWASP groups the failure modes as wrong answers (poisoning), leaks (inversion), silence (jamming) and indiscriminate retrieval (missing access control). Injection through retrieved text stays with LLM01, and memory attacks that do not depend on embeddings with ASI06.",
    examples: [
      "In a shared index, crafted queries reveal other tenants' documents through result counts, scores or timing before access control applies.",
      "Stored or leaked embeddings are inverted to recover the source text.",
      "Content written to the corpus is crafted to land next to a target query and is retrieved as trusted context.",
      "A blocker document is retrieved for a query and makes the model refuse or claim it has no answer (retrieval jamming).",
      "Similarity scores or answers reveal whether a specific document is in the index.",
      "Content tuned around a similarity threshold poisons a semantic cache or defeats deduplication.",
      "An image or audio clip is crafted so its embedding sits next to a sensitive text query in a cross-modal index.",
    ],
    relatedAsi: ["ASI04", "ASI06"],
    relatedAisvs: ["C5", "C8"],
    supportingAisvs: ["C1", "C7", "C12"],
    atlasTactics: ["AML.TA0006", "AML.TA0010"],
    cwe: ["CWE-200", "CWE-285"],
    relatedCiscoObjectives: ["OB-001", "OB-007", "OB-009", "OB-011", "OB-012", "OB-019"],
    relatedThreats: ["t1"],
    relatedControls: ["m1", "m7", "m6"],
    mappingNote:
      "Threat: poisoning of vector-backed memory and retrieval is T1 Memory Poisoning (reached through ASI06). Controls follow the entry's mitigations: validate, authenticate and segregate what enters the index (M1), permission-aware retrieval (M7), and anomaly detection, logging and incident response at ingest and retrieval (M6).",
    references: [
      {
        title: "LLM09:2026 Vector and Embedding Weaknesses (OWASP source)",
        url: `${SOURCE_DIR}/LLM09_VectorAndEmbeddingWeaknesses.md`,
      },
      {
        title: "LLM08:2025 Vector and Embedding Weaknesses (previous edition)",
        url: `${LLM_RISK_2025}/llm082025-vector-and-embedding-weaknesses/`,
      },
    ],
  },
  {
    id: "LLM10",
    code: "LLM10:2026",
    name: "Improper Output Handling",
    previous: {
      id: "LLM05",
      code: "LLM05:2025",
      name: "Improper Output Handling",
      url: `${LLM_RISK_2025}/llm052025-improper-output-handling/`,
    },
    summary:
      "Model output is passed to other components without enough validation, sanitisation or encoding. Because prompts can steer that output, the application in effect hands users, and anyone who can inject content, indirect access to the downstream system, with results ranging from cross-site scripting and request forgery in the browser to server-side request forgery, privilege escalation and remote code execution on the back end. The 2026 entry also covers insecure code generated by assistants and renderers that act on output by themselves, such as terminals that interpret control characters and chat interfaces that fetch images or link previews automatically. Whether the output is correct is a separate risk (LLM07). It moved from fifth to tenth place in 2026.",
    examples: [
      "Output reaches a shell, exec or eval and runs as code.",
      "Generated JavaScript or Markdown is rendered in the browser, causing cross-site scripting.",
      "Generated SQL runs without parameterisation, allowing SQL injection.",
      "Output is used to build file paths without sanitisation, allowing path traversal.",
      "Output is inserted into email templates without escaping, enabling phishing.",
      "ANSI escape or other control characters in output are interpreted by a terminal, log viewer or IDE.",
      "A chat interface auto-loads Markdown images or link previews from output, leaking conversation data through the URL.",
    ],
    relatedAsi: ["ASI02", "ASI05", "ASI09"],
    relatedAisvs: ["C7", "C9"],
    supportingAisvs: ["C10"],
    atlasTactics: ["AML.TA0005"],
    cwe: ["CWE-1426", "CWE-116", "CWE-79"],
    relatedCiscoObjectives: ["OB-001", "OB-004", "OB-008", "OB-009", "OB-011", "OB-012"],
    relatedThreats: ["t11", "t2"],
    relatedControls: ["m11", "m14", "m2"],
    mappingNote:
      "Threats: unvalidated output reaching a shell, exec or eval is T11 Unexpected RCE and Code Attacks, and output handed to a privileged extension is T2 Tool Misuse. Controls: context-aware output validation and encoding (M11), and sandboxed execution of anything derived from model output (M14, M2).",
    references: [
      {
        title: "LLM10:2026 Improper Output Handling (OWASP source)",
        url: `${SOURCE_DIR}/LLM10_ImproperOutputHandling.md`,
      },
      {
        title: "LLM05:2025 Improper Output Handling (previous edition)",
        url: `${LLM_RISK_2025}/llm052025-improper-output-handling/`,
      },
    ],
  },
];

const BY_ID = new Map(llmTop10Data.map((e) => [e.id, e]));
const BY_PREVIOUS = new Map(llmTop10Data.map((e) => [e.previous.id, e]));

/**
 * Resolve an LLM Top 10 citation to its 2026 entry: "LLM01", "llm1", "LLM03:2026",
 * "LLM06:2025 Excessive Agency" (→ LLM03:2026) or "LLM07:2025" (→ LLM08:2026 Hidden Context
 * Exposure). Unqualified ids are read as 2026 ids. Returns undefined for anything else.
 */
export function findLlmTop10Entry(code: string | null | undefined): LlmTop10Entry | undefined {
  const m = code?.trim().match(/^LLM\s*0*(\d{1,2})(?::(\d{4}))?/i);
  if (!m) return undefined;
  const id = `LLM${m[1].padStart(2, "0")}`;
  if (m[2] === "2025") return BY_PREVIOUS.get(id);
  if (m[2] && m[2] !== OWASP_LLM_TOP10_EDITION.version) return undefined;
  return BY_ID.get(id);
}

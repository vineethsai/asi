/**
 * OWASP AISVS 1.01 chapter list (official names, IMPROVEMENT_PLAN A1).
 * Rules and checks reference chapters ("C9") or requirement ids ("C9.4.3");
 * requirement-level data comes from `src/data/aisvs.generated.ts` when the
 * generator has produced it (see engine/aisvsSource.ts).
 */
export const AISVS_VERSION = "1.01";

export const AISVS_CHAPTERS: { code: string; name: string }[] = [
  { code: "C1", name: "Training Data Integrity & Traceability" },
  { code: "C2", name: "Input Validation" },
  { code: "C3", name: "Model Lifecycle Management & Change Control" },
  { code: "C4", name: "Infrastructure, Configuration & Deployment Security" },
  { code: "C5", name: "Access Control & Identity for AI Components & Users" },
  { code: "C6", name: "Supply Chain Security for Models" },
  { code: "C7", name: "Model Behavior, Output Control & Safety Assurance" },
  { code: "C8", name: "Memory, Embeddings & Vector Database Security" },
  { code: "C9", name: "Orchestration & Agentic Security" },
  { code: "C10", name: "Model Context Protocol (MCP) Security" },
  { code: "C11", name: "Adversarial Robustness" },
  { code: "C12", name: "Monitoring, Logging & Anomaly Detection" },
];

export const AISVS_CODE_RE = /^C(1[0-2]|[1-9])(\.\d+){0,2}$/;

/** "C9.4.3" → "C9" */
export const aisvsChapterOf = (code: string) => code.split(".")[0];

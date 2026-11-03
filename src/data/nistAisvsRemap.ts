/**
 * NIST AI RMF 1.0 Core → OWASP AISVS 1.01 chapter mapping.
 *
 * Hand-mapped by this site (editorial; neither NIST nor OWASP publishes this
 * crosswalk) for each of the 72 AI RMF subcategories listed on the NIST
 * mapping page. Chapter codes use the AISVS 1.01 meanings (C10 = MCP Security,
 * C11 = Adversarial Robustness, C12 = Monitoring; there is no C13 — human
 * oversight now lives in C9.2/C9.6 and audit trails in C12).
 *
 * AISVS is a technical verification standard. Subcategories that describe a
 * purely organizational practice (training, staffing, leadership, business
 * context, …) map to no chapter and are flagged `organizational: true` rather
 * than being forced onto a loosely related chapter.
 *
 * Requirement ids cited in a rationale are exposed as `requirements` and are
 * validated by `npm run check:data`.
 */

export interface NistAisvsRemapEntry {
  /** NIST subcategory id as used on the page, e.g. "govern.1.1". */
  id: string;
  /** NIST subcategory code, e.g. "GOVERN.1.1". */
  code: string;
  /** AISVS 1.01 chapter codes ("C1"–"C12"). Empty for organizational practices. */
  aisvs: string[];
  /** One-line reason for the mapping, citing example requirements. */
  rationale: string;
  /** True when no AISVS 1.01 chapter addresses the practice directly. */
  organizational?: true;
  /** AISVS 1.01 requirement ids cited in the rationale (derived). */
  requirements: string[];
}

type Row = [code: string, aisvs: string[], rationale: string];

const ORG = "Organizational practice; no AISVS 1.01 requirement addresses it directly.";

const ROWS: Row[] = [
  // ── GOVERN ──────────────────────────────────────────────────────────────
  [
    "GOVERN.1.1",
    ["C1", "C6", "C12"],
    "Licence and data-origin records (C1.1.2, C6.2.1) and immutable audit records (C12.5.3) evidence legal and regulatory obligations.",
  ],
  [
    "GOVERN.1.2",
    ["C1", "C7", "C11"],
    "Trustworthiness properties become verifiable controls: bias evaluation (C1.3.3), output safety (C7.3.1) and alignment testing (C11.1.1).",
  ],
  [
    "GOVERN.1.3",
    ["C3", "C12"],
    "Risk tier sets the AISVS level to verify; change control (C3.2.3) and monitoring depth (C12.2.2) scale with it.",
  ],
  [
    "GOVERN.1.4",
    ["C3", "C12"],
    "Documented change control (C3.1.1, C3.3.1) and immutable audit records of model changes (C12.5.3) make the process transparent.",
  ],
  [
    "GOVERN.1.5",
    ["C3", "C12"],
    "Re-evaluation when provider models or routing change (C3.2.3) and continuous drift and anomaly monitoring (C12.3.4).",
  ],
  [
    "GOVERN.1.6",
    ["C3", "C6"],
    "Model registry inventory (C3.1.1) and machine-readable AI BOMs (C6.2.1).",
  ],
  [
    "GOVERN.1.7",
    ["C3", "C8", "C9"],
    "Safe phase-out through complete rollback (C3.3.2), memory reset (C8.3.2) and the C9.6 shutdown controls such as the manual kill-switch (C9.6.1).",
  ],
  [
    "GOVERN.2.1",
    ["C5", "C9"],
    "Access control on every AI resource (C5.2.1) and explicit human approval of privileged actions (C9.2.1) make responsibilities enforceable.",
  ],
  ["GOVERN.2.2", [], ORG],
  ["GOVERN.2.3", [], ORG],
  ["GOVERN.3.1", [], ORG],
  [
    "GOVERN.3.2",
    ["C9", "C12"],
    "Human-AI oversight roles are realized as approval gates (C9.2.1, C9.2.2) with approver identity logged (C12.4.2).",
  ],
  [
    "GOVERN.4.1",
    ["C3", "C11"],
    "Environment separation in development (C3.4.1, C3.4.2) and an alignment test suite on every release (C11.1.2).",
  ],
  [
    "GOVERN.4.2",
    ["C3", "C6"],
    "Risks and components are documented through the model registry (C3.1.1) and AI BOM (C6.2.1).",
  ],
  [
    "GOVERN.4.3",
    ["C11", "C12"],
    "Adversarial testing (C11.1.3) and detection and alerting of incidents (C12.2.1).",
  ],
  [
    "GOVERN.5.1",
    ["C11", "C12"],
    "External feedback enters through a safety-violation feedback pipeline with human review (C11.4.3) and logged interactions (C12.1.1).",
  ],
  [
    "GOVERN.5.2",
    ["C3", "C11"],
    "Adjudicated feedback is gated by human review (C11.4.3) and shipped through controlled deployment (C3.3.1).",
  ],
  [
    "GOVERN.6.1",
    ["C6", "C10"],
    "Third-party models, data and tools are vetted: approved sources (C6.1.2) and trusted, verified MCP components (C10.1.1).",
  ],
  [
    "GOVERN.6.2",
    ["C3", "C6"],
    "Contingency for third-party failures: automated rollback (C3.3.1), artifact integrity verification (C6.1.3) and a re-evaluation trigger when the provider model changes (C3.2.3).",
  ],
  // ── MAP ─────────────────────────────────────────────────────────────────
  [
    "MAP.1.1",
    ["C1", "C7"],
    "Stated purpose bounds the training data (C1.1.1) and the allowed output schema (C7.1.1).",
  ],
  ["MAP.1.2", [], ORG],
  ["MAP.1.3", [], ORG],
  ["MAP.1.4", [], ORG],
  [
    "MAP.1.5",
    [],
    "Risk tolerance selects the AISVS verification level (L1–L3) rather than a specific chapter.",
  ],
  [
    "MAP.1.6",
    ["C7", "C11"],
    "Socio-technical requirements become output-safety (C7.3.1) and alignment (C11.1.1) requirements.",
  ],
  [
    "MAP.2.1",
    ["C3", "C9"],
    "Models are registered with their origin (C3.1.1) and tools declare privileges and limits in manifests (C9.3.3).",
  ],
  [
    "MAP.2.2",
    ["C7", "C9"],
    "Knowledge limits surface as confidence estimation and citations (C7.2.1, C7.4.1); human oversight as approval gates (C9.2.1).",
  ],
  [
    "MAP.2.3",
    ["C1", "C3", "C11"],
    "TEVV design: training-data quality checks (C1.3.1), pre-deployment validation (C3.2.1) and adversarial evaluation (C11.1.3).",
  ],
  ["MAP.3.1", [], ORG],
  [
    "MAP.3.2",
    ["C7", "C12"],
    "Error costs are bounded by hallucination fallbacks (C7.2.2) and tracked as hallucination-rate metrics (C12.3.3).",
  ],
  [
    "MAP.3.3",
    ["C5", "C9"],
    "Application scope is enforced through access controls on AI resources (C5.2.1) and fine-grained tool policies (C9.5.1).",
  ],
  ["MAP.3.4", [], ORG],
  [
    "MAP.3.5",
    ["C9", "C12"],
    "Human oversight: approval gates (C9.2.1), kill-switch (C9.6.1) and logged overrides (C12.4.3).",
  ],
  [
    "MAP.4.1",
    ["C1", "C6", "C10"],
    "Component legal risk: data licences (C1.1.2), AI BOM licences (C6.2.1) and MCP component provenance (C10.1.1).",
  ],
  [
    "MAP.4.2",
    ["C4", "C6", "C10"],
    "Component controls: sandboxed model execution (C4.1.1), third-party artifact integrity (C6.1.3) and MCP allow-listing (C10.1.2).",
  ],
  [
    "MAP.5.1",
    ["C11", "C12"],
    "Likelihood is informed by adversarial evaluation results (C11.1.6) and observed detections (C12.2.1).",
  ],
  ["MAP.5.2", [], ORG],
  // ── MEASURE ─────────────────────────────────────────────────────────────
  [
    "MEASURE.1.1",
    ["C11", "C12"],
    "Selected metrics: harmful-content rate (C11.1.5) and drift metrics (C12.3.1).",
  ],
  [
    "MEASURE.1.2",
    ["C11", "C12"],
    "Control effectiveness is re-checked by the alignment suite on every update (C11.1.2) and by detection rules (C12.2.3).",
  ],
  [
    "MEASURE.1.3",
    [],
    "Independent assessment is how AISVS as a whole is used (a verification checklist); no single chapter covers it.",
  ],
  [
    "MEASURE.2.1",
    ["C3", "C11"],
    "Documented test suites: automated pre-deployment tests (C3.2.1) and a version-controlled alignment suite (C11.1.2).",
  ],
  ["MEASURE.2.2", [], ORG],
  [
    "MEASURE.2.3",
    ["C3", "C6", "C11"],
    "Deployment-like testing: quantized-artifact re-evaluation (C3.2.2), behavioral acceptance tests (C6.1.4) and attacked-vs-clean reporting (C11.1.6).",
  ],
  [
    "MEASURE.2.4",
    ["C11", "C12"],
    "Production behavior monitoring: runtime anomaly detection (C11.4.1) and interaction logging and alerting (C12.1.1, C12.2.2).",
  ],
  [
    "MEASURE.2.5",
    ["C3", "C7"],
    "Validity and reliability: pre-deployment validation (C3.2.1) and hallucination detection (C7.2.1).",
  ],
  [
    "MEASURE.2.6",
    ["C7", "C9", "C11"],
    "Safety evaluation and failing safely: harmful-output classifiers (C7.3.1), fail-closed approval timeouts (C9.6.2) and safety training (C11.1.1).",
  ],
  [
    "MEASURE.2.7",
    ["C2", "C4", "C5", "C8", "C9", "C10", "C11"],
    "Security and resilience span prompt-injection defenses (C2.1.3), sandboxing (C4.1.1), access control (C5.2.1), memory isolation (C8.1.1), agent tool isolation (C9.3.1), MCP security (C10.2.1) and adversarial robustness (C11.1.4).",
  ],
  [
    "MEASURE.2.8",
    ["C7", "C9", "C12"],
    "Accountability through source attribution (C7.4.1), cryptographically bound agent actions (C9.4.2) and audit logs (C12.4.2).",
  ],
  [
    "MEASURE.2.9",
    ["C7"],
    "Output interpretation: claims traceable to retrieved sources (C7.4.3) and confidence estimation (C7.2.1).",
  ],
  [
    "MEASURE.2.10",
    ["C1", "C5", "C8", "C11"],
    "Privacy: label redaction (C1.2.3), post-inference filtering (C5.2.4), masking before embedding (C8.2.1) and membership-inference defenses (C11.2.5).",
  ],
  [
    "MEASURE.2.11",
    ["C1"],
    "Bias evaluation of models used in security-relevant decisions (C1.3.3).",
  ],
  [
    "MEASURE.2.12",
    [],
    "Environmental impact and sustainability are outside the scope of AISVS 1.01.",
  ],
  [
    "MEASURE.2.13",
    ["C11"],
    "TEVV effectiveness: automated evaluator with regression thresholds (C11.1.5) and attacked-vs-clean comparison (C11.1.6).",
  ],
  [
    "MEASURE.3.1",
    ["C12"],
    "Emergent risks: unexplained behavioral shifts (C12.3.4) and threat-landscape assessment (C12.4.1).",
  ],
  [
    "MEASURE.3.2",
    ["C12"],
    "Hard-to-measure risks are tracked through behavioral anomaly detection (C12.2.2) and drift monitoring (C12.3.4).",
  ],
  [
    "MEASURE.3.3",
    ["C11"],
    "User-reported problems feed a safety-violation pipeline with human review gates (C11.4.3).",
  ],
  [
    "MEASURE.4.1",
    ["C12"],
    "Deployment-context measurement: input drift monitoring matched to the input type (C12.3.1).",
  ],
  ["MEASURE.4.2", [], ORG],
  [
    "MEASURE.4.3",
    ["C12"],
    "Improvements and declines are tracked as time-series metrics (C12.3.3).",
  ],
  // ── MANAGE ──────────────────────────────────────────────────────────────
  [
    "MANAGE.1.1",
    ["C3", "C6"],
    "Go/no-go gates: pre-deployment validation (C3.2.1) and behavioral acceptance before promotion (C6.1.4).",
  ],
  ["MANAGE.1.2", [], ORG],
  [
    "MANAGE.1.3",
    ["C2", "C5", "C7", "C9"],
    "Risk responses are implemented as input screening (C2.1.3), authorization (C5.2.1), output filtering (C7.3.1) and approval gates (C9.2.1).",
  ],
  ["MANAGE.1.4", [], ORG],
  ["MANAGE.2.1", [], ORG],
  [
    "MANAGE.2.2",
    ["C3", "C12"],
    "Sustaining deployed systems: automated rollback (C3.3.1) and performance drift detection (C12.3.1).",
  ],
  [
    "MANAGE.2.3",
    ["C3", "C9", "C12"],
    "Response and recovery: rollback (C3.3.2), kill-switch (C9.6.1) and alerting (C12.2.1).",
  ],
  [
    "MANAGE.2.4",
    ["C9", "C12"],
    "Disengage or deactivate: kill-switches (C9.1.3, C9.6.1) on an out-of-band channel (C9.6.3), with activations logged (C12.4.3).",
  ],
  [
    "MANAGE.3.1",
    ["C6", "C10"],
    "Third-party monitoring: AI BOM completeness (C6.2.3) and re-approval when a tool definition changes (C10.4.8).",
  ],
  [
    "MANAGE.3.2",
    ["C3", "C6"],
    "Pre-trained models: re-evaluation on provider changes (C3.2.3) and artifact integrity verification (C6.1.3).",
  ],
  [
    "MANAGE.4.1",
    ["C11", "C12"],
    "Post-deployment monitoring: runtime anomaly detection (C11.4.1) and interaction logging (C12.1.1).",
  ],
  [
    "MANAGE.4.2",
    ["C3", "C11"],
    "Continual improvement through controlled rollout (C3.3.1) and the alignment suite on every update (C11.1.2).",
  ],
  [
    "MANAGE.4.3",
    ["C12"],
    "Incident tracking: detection and alerting (C12.2.1) and forensic-grade policy logs (C12.1.2).",
  ],
];

function build(): Record<string, NistAisvsRemapEntry> {
  const out: Record<string, NistAisvsRemapEntry> = {};
  for (const [code, aisvs, rationale] of ROWS) {
    out[code] = {
      id: code.toLowerCase(),
      code,
      aisvs,
      rationale,
      ...(aisvs.length === 0 ? { organizational: true as const } : {}),
      requirements: [...new Set(rationale.match(/\bC\d+\.\d+\.\d+\b/g) ?? [])],
    };
  }
  return out;
}

/** Keyed by NIST subcategory code ("GOVERN.1.1"). */
export const NIST_AISVS_REMAP: Record<string, NistAisvsRemapEntry> = build();

/** AISVS 1.01 chapter codes for a NIST subcategory id or code (case-insensitive). */
export function getAisvsChaptersForNist(idOrCode: string): string[] {
  return NIST_AISVS_REMAP[idOrCode.toUpperCase()]?.aisvs ?? [];
}

export const NIST_AISVS_REMAP_AISVS_VERSION = "1.01";

export const source = {
  name: "NIST AI Risk Management Framework (AI RMF 1.0) Core",
  version: "1.0 (NIST AI 100-1, Jan 2023)",
  url: "https://airc.nist.gov/airmf-resources/airmf/5-sec-core/",
  retrievedAt: "2026-11-03",
};

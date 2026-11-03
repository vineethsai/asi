/**
 * SecurityChecklist — the /interactive "Security Checklist" (§6.10): ten implementation items in
 * four categories, each with an OWASP AISVS 1.01 reference (deep-linked to /aisvs#<code>), a
 * guide, a code sample (shared <CodeBlock>) and verification steps. Completion is stored in the
 * shared progress store (useChecklistProgress); the score is a labelled weighted estimate.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { Database, History, Lock, RefreshCw, Shield, Target, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SeverityBadge } from "@/components/content/SeverityBadge";
import { Ring } from "@/components/charts/Ring";
import { CodeBlock } from "@/components/controls/CodeBlock";
import { useChecklistProgress } from "@/hooks/useProgress";
import { priorityBand } from "@/lib/severity";
import { cn } from "@/lib/utils";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: "critical" | "high" | "medium" | "low";
  /** OWASP AISVS 1.01 chapter, section or requirement ("C2", "C2.1", "C2.1.1"). */
  aisvsReference: string;
  implementationGuide: string;
  codeExample?: string;
  /** Fence language of `codeExample` (default "typescript"). */
  codeLanguage?: string;
  estimatedTime: string;
  dependencies?: string[];
  verificationSteps: string[];
}

interface ChecklistCategory {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  items: ChecklistItem[];
}

const securityChecklist: ChecklistCategory[] = [
  {
    id: "input-validation",
    name: "Input Validation & Filtering",
    description: "Protect against prompt injection and malicious inputs",
    icon: Shield,
    items: [
      {
        id: "prompt-injection-defense",
        title: "Implement Prompt Injection Defense",
        description: "Deploy comprehensive protection against prompt injection attacks",
        category: "input-validation",
        priority: "critical",
        aisvsReference: "C2.1",
        implementationGuide:
          "Set up multi-layered defense including input validation, instruction hierarchy enforcement, and pattern detection for known injection techniques.",
        codeExample: `
// Prompt injection detection
const injectionPatterns = [
  /ignore.{0,20}previous/i,
  /system.{0,20}prompt/i,
  /\\\\n\\\\nHuman:/i,
  /roleplay/i,
  /pretend/i
];

function detectPromptInjection(input: string): boolean {
  return injectionPatterns.some(pattern => pattern.test(input));
}

function validateInput(input: string): { valid: boolean; reason?: string } {
  if (detectPromptInjection(input)) {
    return { valid: false, reason: 'Potential prompt injection detected' };
  }
  
  if (input.length > 4000) {
    return { valid: false, reason: 'Input too long' };
  }
  
  return { valid: true };
}
        `,
        estimatedTime: "4-8 hours",
        verificationSteps: [
          "Test with known injection patterns",
          "Verify instruction hierarchy is maintained",
          "Check that malicious prompts are blocked",
          "Ensure legitimate inputs still work",
        ],
      },
      {
        id: "input-sanitization",
        title: "Input Sanitization & Normalization",
        description: "Clean and normalize user inputs before processing",
        category: "input-validation",
        priority: "high",
        aisvsReference: "C2.1",
        implementationGuide:
          "Implement Unicode normalization, homoglyph detection, and content sanitization to prevent adversarial inputs.",
        codeExample: `
function sanitizeInput(input: string): string {
  // Unicode compatibility normalization (also folds fullwidth forms)
  let sanitized = input.normalize('NFKC');
  
  // Remove potentially dangerous characters
  sanitized = sanitized.replace(/[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]/g, '');
  
  // Homoglyph detection and replacement
  const homoglyphMap: Record<string, string> = {
    'а': 'a', 'о': 'o', 'р': 'p', 'е': 'e', // Cyrillic to Latin
    '０': '0', '１': '1', '２': '2', // Fullwidth to ASCII
  };
  
  Object.entries(homoglyphMap).forEach(([from, to]) => {
    sanitized = sanitized.replace(new RegExp(from, 'g'), to);
  });
  
  return sanitized.trim();
}
        `,
        estimatedTime: "2-4 hours",
        verificationSteps: [
          "Test with Unicode variations",
          "Verify homoglyph detection works",
          "Check normalization preserves meaning",
          "Validate against bypass attempts",
        ],
      },
      {
        id: "content-filtering",
        title: "Content Policy Screening",
        description: "Screen inputs and outputs for policy violations",
        category: "input-validation",
        priority: "high",
        aisvsReference: "C2.2",
        implementationGuide:
          "Deploy content classifiers to detect harmful content categories including violence, hate speech, and inappropriate requests.",
        codeLanguage: "python",
        codeExample: `
from transformers import pipeline

# Load content classification model (e.g., zero-shot or fine-tuned)
classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

def screen_content(text: str, thresholds: dict) -> tuple[bool, str]:
    """Screen input for policy violations. Returns (allowed, reason)."""
    categories = ["violence", "hate_speech", "sexual_content", "self_harm", "illegal"]
    result = classifier(text, categories, multi_label=True)
    
    for label, score in zip(result["labels"], result["scores"]):
        if score >= thresholds.get(label, 0.7):
            return False, f"Policy violation: {label} (score: {score:.2f})"
    
    return True, "Content passed screening"

# Usage: block policy-violating inputs before LLM processing
allowed, reason = screen_content(user_input, {"violence": 0.8, "hate_speech": 0.85})
if not allowed:
    return {"error": "Request blocked", "reason": reason}
        `,
        estimatedTime: "6-12 hours",
        verificationSteps: [
          "Test content classifier accuracy",
          "Verify policy violations are blocked",
          "Check false positive rates",
          "Validate safe content passes through",
        ],
      },
    ],
  },
  {
    id: "data-security",
    name: "Training Data Security",
    description: "Secure training data and prevent poisoning attacks",
    icon: Database,
    items: [
      {
        id: "data-provenance",
        title: "Maintain Data Provenance",
        description: "Track and document the source and history of all training data",
        category: "data-security",
        priority: "critical",
        aisvsReference: "C1.1",
        implementationGuide:
          "Implement comprehensive data lineage tracking including source, steward, license, collection method, and processing history.",
        codeExample: `
interface DataProvenance {
  sourceId: string;
  origin: string;
  steward: string;
  license: string;
  collectionMethod: string;
  processingHistory: { step: string; timestamp: string }[];
  createdAt: string;
}

const provenanceStore = new Map<string, DataProvenance>();

function registerDataSource(
  datasetId: string,
  metadata: Omit<DataProvenance, 'createdAt'>
): void {
  provenanceStore.set(datasetId, {
    ...metadata,
    createdAt: new Date().toISOString()
  });
}

function appendProcessingStep(datasetId: string, step: string): void {
  const record = provenanceStore.get(datasetId);
  if (record) {
    record.processingHistory.push({
      step,
      timestamp: new Date().toISOString()
    });
  }
}

// Audit: reconstruct full lineage for any dataset
function getDataLineage(datasetId: string): DataProvenance | undefined {
  return provenanceStore.get(datasetId);
}
        `,
        estimatedTime: "8-16 hours",
        verificationSteps: [
          "Verify all data sources are documented",
          "Check lineage tracking is complete",
          "Validate metadata accuracy",
          "Ensure audit trail exists",
        ],
      },
      {
        id: "data-validation",
        title: "Automated Data Quality Validation",
        description: "Implement automated checks for data quality and integrity",
        category: "data-security",
        priority: "high",
        aisvsReference: "C1.3",
        implementationGuide:
          "Set up automated validation pipelines to detect format errors, null values, label inconsistencies, and statistical anomalies.",
        codeExample: `
interface DataValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function validateDataset(data: any[]): DataValidationResult {
  const result: DataValidationResult = {
    valid: true,
    errors: [],
    warnings: []
  };
  
  // Check for null values
  const nullCount = data.filter(item => item === null || item === undefined).length;
  if (nullCount > data.length * 0.05) {
    result.errors.push(\`High null value rate: \${(nullCount/data.length*100).toFixed(1)}%\`);
    result.valid = false;
  }
  
  // Check data distribution
  const uniqueValues = new Set(data).size;
  if (uniqueValues < data.length * 0.1) {
    result.warnings.push('Low data diversity detected');
  }
  
  return result;
}
        `,
        estimatedTime: "4-8 hours",
        verificationSteps: [
          "Test validation with corrupted data",
          "Verify error detection accuracy",
          "Check performance with large datasets",
          "Validate quarantine mechanisms work",
        ],
      },
      {
        id: "poisoning-detection",
        title: "Data Poisoning Detection",
        description: "Implement anomaly detection to identify potential data poisoning",
        category: "data-security",
        priority: "high",
        aisvsReference: "C1.3.1",
        implementationGuide:
          "Deploy statistical and ML-based anomaly detection to identify suspicious patterns in training data that could indicate poisoning attempts.",
        codeLanguage: "python",
        codeExample: `
import numpy as np
from sklearn.ensemble import IsolationForest

def detect_poisoning_candidates(
    embeddings: np.ndarray,
    contamination: float = 0.01
) -> tuple[np.ndarray, np.ndarray]:
    """
    Flag training samples that may be poisoned using Isolation Forest.
    Returns (indices of normal samples, indices of flagged samples).
    """
    clf = IsolationForest(contamination=contamination, random_state=42)
    preds = clf.fit_predict(embeddings)  # -1 = anomaly
    
    normal_idx = np.where(preds == 1)[0]
    flagged_idx = np.where(preds == -1)[0]
    
    return normal_idx, flagged_idx

# Before training: quarantine flagged samples for manual review
normal_idx, flagged_idx = detect_poisoning_candidates(training_embeddings)
if len(flagged_idx) > 0:
    quarantine_for_review(flagged_idx)
    logger.warning(f"Flagged {len(flagged_idx)} samples for poisoning review")
        `,
        estimatedTime: "12-20 hours",
        verificationSteps: [
          "Test with known poisoning examples",
          "Verify detection sensitivity",
          "Check false positive rates",
          "Validate alerting mechanisms",
        ],
      },
    ],
  },
  {
    id: "access-control",
    name: "Access Control & Authentication",
    description: "Secure access to AI systems and data",
    icon: Lock,
    items: [
      {
        id: "api-authentication",
        title: "API Authentication & Authorization",
        description: "Implement robust authentication for all API endpoints",
        category: "access-control",
        priority: "critical",
        aisvsReference: "C5",
        implementationGuide:
          "Deploy strong authentication mechanisms including API keys, OAuth 2.0, or JWT tokens with proper authorization controls.",
        codeExample: `
import jwt from 'jsonwebtoken';

interface AuthMiddleware {
  (req: Request, res: Response, next: NextFunction): void;
}

const authenticateToken: AuthMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET!, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};
        `,
        estimatedTime: "4-8 hours",
        verificationSteps: [
          "Test authentication with valid tokens",
          "Verify unauthorized access is blocked",
          "Check token expiration handling",
          "Validate rate limiting works",
        ],
      },
      {
        id: "rate-limiting",
        title: "Rate Limiting & Abuse Prevention",
        description: "Implement rate limiting to prevent abuse and DoS attacks",
        category: "access-control",
        priority: "high",
        aisvsReference: "C11.2.2",
        implementationGuide:
          "Configure rate limiting per user, IP, and API key with different limits for different endpoints based on computational cost.",
        codeExample: `
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Different limits: stricter for expensive AI endpoints
const aiEndpointLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  prefix: 'ratelimit:ai'
});

const standardLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(60, '1 m'),
  prefix: 'ratelimit:api'
});

async function checkRateLimit(identifier: string, endpoint: 'ai' | 'standard') {
  const limiter = endpoint === 'ai' ? aiEndpointLimit : standardLimit;
  const { success, limit, remaining } = await limiter.limit(identifier);
  
  if (!success) {
    throw new Error('Rate limit exceeded. Try again in 1 minute.');
  }
  return { remaining, limit };
}

// In API route:
// await checkRateLimit(req.userId ?? req.ip, 'ai');
        `,
        estimatedTime: "2-4 hours",
        verificationSteps: [
          "Test rate limits are enforced",
          "Verify different limits per endpoint",
          "Check burst handling",
          "Validate legitimate users not blocked",
        ],
      },
    ],
  },
  {
    id: "monitoring",
    name: "Deployment & Audit",
    description: "Roll out model changes safely and keep an immutable record of them",
    icon: History,
    items: [
      {
        id: "controlled-deployment",
        title: "Controlled Deployment & Rollback",
        description:
          "Implement gradual rollout mechanisms and atomic rollback capabilities for model deployments",
        category: "monitoring",
        priority: "critical",
        aisvsReference: "C3.3",
        implementationGuide:
          "Implement gradual rollout mechanisms (canary, blue-green deployments) with automated rollback triggers based on error rates, latency thresholds, or security alerts. Ensure atomic rollback restores complete model state including weights, configurations, and dependencies.",
        codeLanguage: "yaml",
        codeExample: `
# Kubernetes canary deployment with automated rollback
apiVersion: v1
kind: ConfigMap
metadata:
  name: rollout-triggers
data:
  error_rate_threshold: "0.05"
  latency_p99_ms: "500"
  security_alert_rollback: "true"
---
# Argo Rollouts - canary with analysis
apiVersion: argoproj.io/v1alpha1
kind: Rollout
spec:
  strategy:
    canary:
      maxSurge: "25%"
      analysis:
        templates:
          - templateName: error-rate
        startingStep: 1
      automatic:
        stepWeight: 25
        failureLimit: 2  # Rollback after 2 failed analysis runs
`,
        estimatedTime: "8-16 hours",
        verificationSteps: [
          "Verify gradual rollout mechanisms work",
          "Test automated rollback triggers",
          "Validate atomic rollback restores full state",
          "Check emergency shutdown capabilities",
        ],
      },
      {
        id: "change-accountability",
        title: "Change Accountability & Audit",
        description:
          "Generate immutable audit records for all model changes including deployment, configuration, and retirement",
        category: "monitoring",
        priority: "high",
        aisvsReference: "C12.5.3",
        implementationGuide:
          "Implement immutable audit records for all model changes including timestamp, authenticated actor identity, change type, and before/after states. Version control prompt templates in git with mandatory code review before deployment.",
        codeExample: `
interface ModelChangeAuditRecord {
  id: string;
  timestamp: string;
  actorId: string;
  actorIdentity: string;
  changeType: 'deployment' | 'configuration' | 'retirement';
  modelId: string;
  beforeState: { version: string; configHash: string };
  afterState: { version: string; configHash: string };
}

async function recordModelChange(audit: Omit<ModelChangeAuditRecord, 'id' | 'timestamp'>): Promise<void> {
  const record: ModelChangeAuditRecord = {
    ...audit,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString()
  };
  
  // Append-only immutable storage (e.g., write to tamper-evident log)
  await auditStore.append(record);
  
  // Access attempts to audit logs are also logged
  logAccessAttempt(record.id, 'write', getCurrentUserId());
}
        `,
        estimatedTime: "4-8 hours",
        verificationSteps: [
          "Verify all model changes generate audit records",
          "Check audit records include before/after states",
          "Validate prompt templates are version-controlled",
          "Test audit log access controls",
        ],
      },
    ],
  },
];

const ALL_ITEMS = securityChecklist.flatMap((c) => c.items);
const TOTAL = ALL_ITEMS.length;

/** Weights of the score estimate (shown in the UI). */
const WEIGHTS = { critical: 60, high: 30, all: 10 } as const;

function weightedScore(done: ReadonlySet<string>): number {
  const part = (items: ChecklistItem[], weight: number) =>
    items.length ? (items.filter((i) => done.has(i.id)).length / items.length) * weight : weight;
  return Math.round(
    part(
      ALL_ITEMS.filter((i) => i.priority === "critical"),
      WEIGHTS.critical,
    ) +
      part(
        ALL_ITEMS.filter((i) => i.priority === "high"),
        WEIGHTS.high,
      ) +
      (ALL_ITEMS.filter((i) => done.has(i.id)).length / Math.max(1, TOTAL)) * WEIGHTS.all,
  );
}

export function SecurityChecklist() {
  const { done, toggle, reset } = useChecklistProgress(TOTAL);
  const [activeCategory, setActiveCategory] = useState<string>(securityChecklist[0].id);
  const [showCompletedOnly, setShowCompletedOnly] = useState(false);

  const completedCount = ALL_ITEMS.filter((i) => done.has(i.id)).length;
  const pct = TOTAL ? Math.round((completedCount / TOTAL) * 100) : 0;
  const score = weightedScore(done);
  const categoryDone = (c: ChecklistCategory) => c.items.filter((i) => done.has(i.id)).length;
  const categoriesComplete = securityChecklist.filter(
    (c) => categoryDone(c) === c.items.length,
  ).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Your progress</h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  aria-pressed={showCompletedOnly}
                  onClick={() => setShowCompletedOnly((v) => !v)}
                >
                  {showCompletedOnly ? "Show all items" : "Show completed only"}
                </Button>
                <Button variant="outline" size="sm" onClick={reset} disabled={completedCount === 0}>
                  <RefreshCw aria-hidden className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              </div>
            </div>
            <dl className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-md border p-3">
                <dt className="text-xs text-muted-foreground">Items done</dt>
                <dd className="text-2xl font-bold tabular-nums">
                  {completedCount}/{TOTAL}
                </dd>
              </div>
              <div className="rounded-md border p-3">
                <dt className="text-xs text-muted-foreground">Progress</dt>
                <dd className="text-2xl font-bold tabular-nums">{pct}%</dd>
              </div>
              <div className="rounded-md border p-3">
                <dt className="text-xs text-muted-foreground">Categories done</dt>
                <dd className="text-2xl font-bold tabular-nums">
                  {categoriesComplete}/{securityChecklist.length}
                </dd>
              </div>
            </dl>
            <Progress
              value={pct}
              aria-label="Checklist progress"
              aria-valuetext={`${completedCount} of ${TOTAL} items (${pct}%)`}
              className="h-2"
            />
            <p className="text-xs text-muted-foreground">Saved in this browser.</p>
          </CardContent>
        </Card>

        <Card className="md:w-72">
          <CardContent className="flex items-center gap-4 p-5">
            <Ring
              value={score}
              max={100}
              size={72}
              thickness={7}
              tone="progress"
              ariaLabel={`Weighted estimate ${score} out of 100`}
            />
            <div className="min-w-0">
              <h2 className="text-sm font-semibold">Weighted estimate</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {WEIGHTS.critical}% critical items, {WEIGHTS.high}% high items, {WEIGHTS.all}% all
                items. A progress indicator for this list, not a security rating.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-4">
          {securityChecklist.map((category) => {
            const CatIcon = category.icon;
            const cd = categoryDone(category);
            return (
              <TabsTrigger key={category.id} value={category.id} className="gap-2">
                <CatIcon aria-hidden className="h-4 w-4 shrink-0" />
                <span className="sr-only sm:not-sr-only sm:truncate">{category.name}</span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {cd}/{category.items.length}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {securityChecklist.map((category) => {
          const items = category.items.filter((i) => !showCompletedOnly || done.has(i.id));
          return (
            <TabsContent key={category.id} value={category.id} className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">{category.name}</h2>
                <p className="text-sm text-muted-foreground">{category.description}</p>
              </div>
              {items.length === 0 && (
                <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No completed items in this category yet.
                </p>
              )}
              {items.map((item) => {
                const checked = done.has(item.id);
                const checkboxId = `checklist-${item.id}`;
                return (
                  <Card key={item.id} className={cn(checked && "border-emerald-500/40")}>
                    <CardContent className="p-0">
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value={item.id} className="border-none">
                          {/* The checkbox and the AISVS link sit beside (not inside) the trigger: no nested interactive content. */}
                          <div className="flex items-start gap-4 px-4 sm:px-6">
                            <Checkbox
                              id={checkboxId}
                              checked={checked}
                              onCheckedChange={() => toggle(item.id)}
                              className="mt-5"
                              aria-label={`Mark "${item.title}" as done`}
                            />
                            <div className="min-w-0 flex-1">
                              <AccordionTrigger className="py-4 hover:no-underline">
                                <span className="block flex-1 text-left">
                                  <span className="mb-1.5 flex flex-wrap items-center gap-2">
                                    <span
                                      className={cn(
                                        "font-semibold",
                                        checked && "text-muted-foreground line-through",
                                      )}
                                    >
                                      {item.title}
                                    </span>
                                    <SeverityBadge
                                      band={priorityBand(item.priority)}
                                      size="xs"
                                      label={`${item.priority[0].toUpperCase()}${item.priority.slice(1)} priority`}
                                    />
                                  </span>
                                  <span className="block text-sm font-normal text-muted-foreground">
                                    {item.description}
                                  </span>
                                </span>
                              </AccordionTrigger>
                              <p className="-mt-2 mb-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                <Link
                                  to={`/aisvs#${item.aisvsReference}`}
                                  className="inline-flex h-5 items-center rounded border px-1.5 font-mono text-[11px] text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                >
                                  AISVS {item.aisvsReference}
                                </Link>
                                <span>Estimated {item.estimatedTime}</span>
                              </p>
                            </div>
                          </div>

                          <AccordionContent className="px-4 pb-6 sm:px-6">
                            <div className="space-y-4">
                              <div>
                                <h3 className="mb-2 font-medium">Implementation guide</h3>
                                <p className="text-sm text-muted-foreground">
                                  {item.implementationGuide}
                                </p>
                              </div>
                              {item.codeExample && (
                                <div>
                                  <h3 className="mb-2 font-medium">Code example</h3>
                                  <CodeBlock
                                    code={item.codeExample}
                                    language={item.codeLanguage ?? "typescript"}
                                  />
                                </div>
                              )}
                              <div>
                                <h3 className="mb-2 font-medium">Verification steps</h3>
                                <ul className="space-y-1">
                                  {item.verificationSteps.map((step) => (
                                    <li key={step} className="flex items-center gap-2 text-sm">
                                      <Target
                                        aria-hidden
                                        className="h-3 w-3 text-muted-foreground"
                                      />
                                      {step}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              {item.dependencies && (
                                <div>
                                  <h3 className="mb-2 font-medium">Dependencies</h3>
                                  <div className="flex flex-wrap gap-2">
                                    {item.dependencies.map((dep) => (
                                      <Badge key={dep} variant="outline" className="text-xs">
                                        {dep}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

export default SecurityChecklist;

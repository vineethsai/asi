import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  CheckCircle,
  AlertTriangle,
  Shield,
  Database,
  Eye,
  Lock,
  RefreshCw,
  Target,
} from "lucide-react";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: "critical" | "high" | "medium" | "low";
  aisvsReference: string;
  implementationGuide: string;
  codeExample?: string;
  estimatedTime: string;
  dependencies?: string[];
  verificationSteps: string[];
}

interface ChecklistCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  items: ChecklistItem[];
}

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  blue: {
    bg: "bg-blue-100 dark:bg-blue-950/30",
    text: "text-blue-800 dark:text-blue-300",
    border: "border-blue-200",
  },
  green: {
    bg: "bg-green-100 dark:bg-green-950/30",
    text: "text-green-800 dark:text-green-300",
    border: "border-green-200",
  },
  purple: {
    bg: "bg-purple-100 dark:bg-purple-950/30",
    text: "text-purple-800 dark:text-purple-300",
    border: "border-purple-200",
  },
  orange: {
    bg: "bg-orange-100 dark:bg-orange-950/30",
    text: "text-orange-800 dark:text-orange-300",
    border: "border-orange-200",
  },
  red: {
    bg: "bg-red-100 dark:bg-red-950/30",
    text: "text-red-800 dark:text-red-300",
    border: "border-red-200",
  },
};

const securityChecklist: ChecklistCategory[] = [
  {
    id: "input-validation",
    name: "Input Validation & Filtering",
    description: "Protect against prompt injection and malicious inputs",
    icon: <Shield className="h-5 w-5" />,
    color: "blue",
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
        aisvsReference: "C2.2",
        implementationGuide:
          "Implement Unicode normalization, homoglyph detection, and content sanitization to prevent adversarial inputs.",
        codeExample: `
import { normalize } from 'normalize-unicode';

function sanitizeInput(input: string): string {
  // Unicode normalization
  let sanitized = normalize(input, 'NFC');
  
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
        aisvsReference: "C2.4",
        implementationGuide:
          "Deploy content classifiers to detect harmful content categories including violence, hate speech, and inappropriate requests.",
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
    icon: <Database className="h-5 w-5" />,
    color: "green",
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
        aisvsReference: "C1.5",
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
        aisvsReference: "C1.6",
        implementationGuide:
          "Deploy statistical and ML-based anomaly detection to identify suspicious patterns in training data that could indicate poisoning attempts.",
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
    icon: <Lock className="h-5 w-5" />,
    color: "purple",
    items: [
      {
        id: "api-authentication",
        title: "API Authentication & Authorization",
        description: "Implement robust authentication for all API endpoints",
        category: "access-control",
        priority: "critical",
        aisvsReference: "C3.1",
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
        aisvsReference: "C2.5",
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
    name: "Monitoring & Logging",
    description: "Monitor AI system behavior and maintain audit logs",
    icon: <Eye className="h-5 w-5" />,
    color: "orange",
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
        aisvsReference: "C3.4",
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

export const SecurityChecklist: React.FC = () => {
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string>("input-validation");
  const [showCompletedOnly, setShowCompletedOnly] = useState(false);

  // Load completed items from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("ai-security-checklist");
    if (saved) {
      setCompletedItems(new Set(JSON.parse(saved)));
    }
  }, []);

  // Save completed items to localStorage
  useEffect(() => {
    localStorage.setItem("ai-security-checklist", JSON.stringify(Array.from(completedItems)));
  }, [completedItems]);

  const toggleItem = (itemId: string) => {
    setCompletedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const resetChecklist = () => {
    setCompletedItems(new Set());
    localStorage.removeItem("ai-security-checklist");
  };

  // Calculate progress
  const totalItems = securityChecklist.reduce((sum, category) => sum + category.items.length, 0);
  const completedCount = completedItems.size;
  const progressPercentage = totalItems > 0 ? (completedCount / totalItems) * 100 : 0;

  // Get category progress
  const getCategoryProgress = (categoryId: string) => {
    const category = securityChecklist.find((c) => c.id === categoryId);
    if (!category) return 0;

    const categoryCompleted = category.items.filter((item) => completedItems.has(item.id)).length;
    return (categoryCompleted / category.items.length) * 100;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-300";
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-950/30 dark:text-orange-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-300";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-950/30 dark:text-gray-300";
    }
  };

  const getSecurityScore = () => {
    const criticalItems = securityChecklist
      .flatMap((c) => c.items)
      .filter((i) => i.priority === "critical");
    const highItems = securityChecklist
      .flatMap((c) => c.items)
      .filter((i) => i.priority === "high");

    const criticalCompleted = criticalItems.filter((i) => completedItems.has(i.id)).length;
    const highCompleted = highItems.filter((i) => completedItems.has(i.id)).length;

    const criticalScore =
      criticalItems.length > 0 ? (criticalCompleted / criticalItems.length) * 60 : 60;
    const highScore = highItems.length > 0 ? (highCompleted / highItems.length) * 30 : 30;
    const overallScore = (completedCount / totalItems) * 10;

    return Math.round(criticalScore + highScore + overallScore);
  };

  const securityScore = getSecurityScore();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-4">AI Security Implementation Checklist</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Follow this comprehensive checklist to implement security controls for your AI system
          based on OWASP AISVS standards. Track your progress and get implementation guidance.
        </p>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="security-card">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-primary mb-1">
              {completedCount}/{totalItems}
            </div>
            <div className="text-sm text-muted-foreground">Items Complete</div>
          </CardContent>
        </Card>

        <Card className="security-card">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-primary mb-1">
              {Math.round(progressPercentage)}%
            </div>
            <div className="text-sm text-muted-foreground">Progress</div>
          </CardContent>
        </Card>

        <Card className="security-card">
          <CardContent className="p-4 text-center">
            <div
              className={`text-3xl font-bold mb-1 ${
                securityScore >= 80
                  ? "text-green-600"
                  : securityScore >= 60
                    ? "text-yellow-600"
                    : "text-red-600"
              }`}
            >
              {securityScore}/100
            </div>
            <div className="text-sm text-muted-foreground">Security Score</div>
          </CardContent>
        </Card>

        <Card className="security-card">
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-primary mb-1">
              {securityChecklist.filter((c) => getCategoryProgress(c.id) === 100).length}
            </div>
            <div className="text-sm text-muted-foreground">Categories Done</div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Overall Security Implementation</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCompletedOnly(!showCompletedOnly)}
              >
                {showCompletedOnly ? "Show All" : "Show Completed"}
              </Button>
              <Button variant="outline" size="sm" onClick={resetChecklist}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(progressPercentage)}% complete</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>

          {securityScore < 80 && (
            <Alert className="mt-4 bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Security Score: {securityScore}/100</strong>
                <br />
                {securityScore < 40 &&
                  "Critical security gaps identified. Prioritize implementing critical and high priority items."}
                {securityScore >= 40 &&
                  securityScore < 60 &&
                  "Moderate security posture. Focus on completing high priority items."}
                {securityScore >= 60 &&
                  securityScore < 80 &&
                  "Good progress! Complete remaining critical items to improve security."}
              </AlertDescription>
            </Alert>
          )}

          {securityScore >= 80 && (
            <Alert className="mt-4 bg-green-50 dark:bg-green-950/30 border-green-200">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Excellent Security Score: {securityScore}/100</strong>
                <br />
                Your AI system has strong security controls implemented. Continue monitoring and
                maintaining these controls.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {securityChecklist.map((category) => (
            <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
              {category.icon}
              <span className="hidden sm:inline">{category.name.split(" ")[0]}</span>
              <Badge variant="outline" className="text-xs">
                {Math.round(getCategoryProgress(category.id))}%
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {securityChecklist.map((category) => (
          <TabsContent key={category.id} value={category.id} className="space-y-4">
            <Card className="security-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${colorMap[category.color]?.bg ?? "bg-gray-100 dark:bg-gray-950/30"}`}
                  >
                    {category.icon}
                  </div>
                  <div>
                    <h3 className="text-xl">{category.name}</h3>
                    <p className="text-muted-foreground text-sm font-normal">
                      {category.description}
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium">Category Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {category.items.filter((item) => completedItems.has(item.id)).length}/
                    {category.items.length} complete
                  </span>
                </div>
                <Progress value={getCategoryProgress(category.id)} className="h-2" />
              </CardContent>
            </Card>

            <div className="space-y-4">
              {category.items
                .filter((item) => !showCompletedOnly || completedItems.has(item.id))
                .map((item) => (
                  <Card
                    key={item.id}
                    className={`checklist-item ${completedItems.has(item.id) ? "completed" : ""}`}
                  >
                    <CardContent className="p-0">
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value={item.id} className="border-none">
                          <AccordionTrigger className="px-6 py-4 hover:no-underline">
                            <div className="flex items-start gap-4 w-full">
                              <Checkbox
                                checked={completedItems.has(item.id)}
                                onCheckedChange={() => toggleItem(item.id)}
                                className="mt-1"
                              />
                              <div className="flex-1 text-left">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="font-semibold">{item.title}</h4>
                                  <Badge className={getPriorityColor(item.priority)}>
                                    {item.priority}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {item.aisvsReference}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                  <span>⏱️ {item.estimatedTime}</span>
                                </div>
                              </div>
                            </div>
                          </AccordionTrigger>

                          <AccordionContent className="px-6 pb-6">
                            <div className="space-y-4">
                              <div>
                                <h5 className="font-medium mb-2">Implementation Guide</h5>
                                <p className="text-sm text-muted-foreground">
                                  {item.implementationGuide}
                                </p>
                              </div>

                              {item.codeExample && (
                                <div>
                                  <h5 className="font-medium mb-2">Code Example</h5>
                                  <pre className="text-xs overflow-auto bg-muted p-4 rounded-lg">
                                    <code>{item.codeExample.trim()}</code>
                                  </pre>
                                </div>
                              )}

                              <div>
                                <h5 className="font-medium mb-2">Verification Steps</h5>
                                <ul className="space-y-1">
                                  {item.verificationSteps.map((step, index) => (
                                    <li key={index} className="flex items-center gap-2 text-sm">
                                      <Target className="h-3 w-3 text-muted-foreground" />
                                      {step}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {item.dependencies && (
                                <div>
                                  <h5 className="font-medium mb-2">Dependencies</h5>
                                  <div className="flex flex-wrap gap-2">
                                    {item.dependencies.map((dep, index) => (
                                      <Badge key={index} variant="outline" className="text-xs">
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
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

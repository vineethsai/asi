import{r as k,j as e,L as A}from"./react-wmot85l4.js";import{C as y,c as v}from"./card-BiQ89yt7.js";import{B as w,c as C}from"./index-6H2AVGHs.js";import{B as R}from"./badge-DYlPCUtB.js";import{C as T}from"./checkbox-xtpmqo8Q.js";import{P}from"./progress-Da_7iANh.js";import{T as V,a as _,b as D,c as E}from"./tabs-DSH8k8J3.js";import{A as z,a as L,b as M,c as q}from"./accordion-D_G_csUt.js";import{S as F}from"./SeverityBadge-Dv1ciHk6.js";import{R as G}from"./Ring-CN49cKNT.js";import{C as H}from"./CodeBlock-D9iJ8-G6.js";import{d as O}from"./useProgress-C6QVtckY.js";import{g as W}from"./severity-DsnMIfr2.js";import{a3 as $,$ as B,s as U,a4 as J,a5 as K,a6 as Q}from"./lucide-react-Bp_TbTJl.js";import{P as Y}from"./PageLayout-1seBd5sn.js";import{P as X}from"./PageHeader-DBZptmLX.js";import"./radix-ui-DYyfr8kh.js";import"./motion-W0bhAho5.js";import"./d3-B6rRE1Sk.js";import"./chartUtils-DoVQo6RP.js";import"./progress-D_pcX5mZ.js";import"./react-C88mmv30.js";import"./useReveal-uSqkWhHq.js";const r=[{id:"input-validation",name:"Input Validation & Filtering",description:"Protect against prompt injection and malicious inputs",icon:U,items:[{id:"prompt-injection-defense",title:"Implement Prompt Injection Defense",description:"Deploy comprehensive protection against prompt injection attacks",category:"input-validation",priority:"critical",aisvsReference:"C2.1",implementationGuide:"Set up multi-layered defense including input validation, instruction hierarchy enforcement, and pattern detection for known injection techniques.",codeExample:`
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
        `,estimatedTime:"4-8 hours",verificationSteps:["Test with known injection patterns","Verify instruction hierarchy is maintained","Check that malicious prompts are blocked","Ensure legitimate inputs still work"]},{id:"input-sanitization",title:"Input Sanitization & Normalization",description:"Clean and normalize user inputs before processing",category:"input-validation",priority:"high",aisvsReference:"C2.1",implementationGuide:"Implement Unicode normalization, homoglyph detection, and content sanitization to prevent adversarial inputs.",codeExample:`
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
        `,estimatedTime:"2-4 hours",verificationSteps:["Test with Unicode variations","Verify homoglyph detection works","Check normalization preserves meaning","Validate against bypass attempts"]},{id:"content-filtering",title:"Content Policy Screening",description:"Screen inputs and outputs for policy violations",category:"input-validation",priority:"high",aisvsReference:"C2.2",implementationGuide:"Deploy content classifiers to detect harmful content categories including violence, hate speech, and inappropriate requests.",codeLanguage:"python",codeExample:`
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
        `,estimatedTime:"6-12 hours",verificationSteps:["Test content classifier accuracy","Verify policy violations are blocked","Check false positive rates","Validate safe content passes through"]}]},{id:"data-security",name:"Training Data Security",description:"Secure training data and prevent poisoning attacks",icon:J,items:[{id:"data-provenance",title:"Maintain Data Provenance",description:"Track and document the source and history of all training data",category:"data-security",priority:"critical",aisvsReference:"C1.1",implementationGuide:"Implement comprehensive data lineage tracking including source, steward, license, collection method, and processing history.",codeExample:`
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
        `,estimatedTime:"8-16 hours",verificationSteps:["Verify all data sources are documented","Check lineage tracking is complete","Validate metadata accuracy","Ensure audit trail exists"]},{id:"data-validation",title:"Automated Data Quality Validation",description:"Implement automated checks for data quality and integrity",category:"data-security",priority:"high",aisvsReference:"C1.3",implementationGuide:"Set up automated validation pipelines to detect format errors, null values, label inconsistencies, and statistical anomalies.",codeExample:`
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
        `,estimatedTime:"4-8 hours",verificationSteps:["Test validation with corrupted data","Verify error detection accuracy","Check performance with large datasets","Validate quarantine mechanisms work"]},{id:"poisoning-detection",title:"Data Poisoning Detection",description:"Implement anomaly detection to identify potential data poisoning",category:"data-security",priority:"high",aisvsReference:"C1.3.1",implementationGuide:"Deploy statistical and ML-based anomaly detection to identify suspicious patterns in training data that could indicate poisoning attempts.",codeLanguage:"python",codeExample:`
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
        `,estimatedTime:"12-20 hours",verificationSteps:["Test with known poisoning examples","Verify detection sensitivity","Check false positive rates","Validate alerting mechanisms"]}]},{id:"access-control",name:"Access Control & Authentication",description:"Secure access to AI systems and data",icon:K,items:[{id:"api-authentication",title:"API Authentication & Authorization",description:"Implement robust authentication for all API endpoints",category:"access-control",priority:"critical",aisvsReference:"C5",implementationGuide:"Deploy strong authentication mechanisms including API keys, OAuth 2.0, or JWT tokens with proper authorization controls.",codeExample:`
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
        `,estimatedTime:"4-8 hours",verificationSteps:["Test authentication with valid tokens","Verify unauthorized access is blocked","Check token expiration handling","Validate rate limiting works"]},{id:"rate-limiting",title:"Rate Limiting & Abuse Prevention",description:"Implement rate limiting to prevent abuse and DoS attacks",category:"access-control",priority:"high",aisvsReference:"C11.2.2",implementationGuide:"Configure rate limiting per user, IP, and API key with different limits for different endpoints based on computational cost.",codeExample:`
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
        `,estimatedTime:"2-4 hours",verificationSteps:["Test rate limits are enforced","Verify different limits per endpoint","Check burst handling","Validate legitimate users not blocked"]}]},{id:"monitoring",name:"Deployment & Audit",description:"Roll out model changes safely and keep an immutable record of them",icon:Q,items:[{id:"controlled-deployment",title:"Controlled Deployment & Rollback",description:"Implement gradual rollout mechanisms and atomic rollback capabilities for model deployments",category:"monitoring",priority:"critical",aisvsReference:"C3.3",implementationGuide:"Implement gradual rollout mechanisms (canary, blue-green deployments) with automated rollback triggers based on error rates, latency thresholds, or security alerts. Ensure atomic rollback restores complete model state including weights, configurations, and dependencies.",codeLanguage:"yaml",codeExample:`
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
`,estimatedTime:"8-16 hours",verificationSteps:["Verify gradual rollout mechanisms work","Test automated rollback triggers","Validate atomic rollback restores full state","Check emergency shutdown capabilities"]},{id:"change-accountability",title:"Change Accountability & Audit",description:"Generate immutable audit records for all model changes including deployment, configuration, and retirement",category:"monitoring",priority:"high",aisvsReference:"C12.5.3",implementationGuide:"Implement immutable audit records for all model changes including timestamp, authenticated actor identity, change type, and before/after states. Version control prompt templates in git with mandatory code review before deployment.",codeExample:`
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
        `,estimatedTime:"4-8 hours",verificationSteps:["Verify all model changes generate audit records","Check audit records include before/after states","Validate prompt templates are version-controlled","Test audit log access controls"]}]}],d=r.flatMap(n=>n.items),o=d.length,l={critical:60,high:30,all:10};function Z(n){const m=(a,p)=>a.length?a.filter(g=>n.has(g.id)).length/a.length*p:p;return Math.round(m(d.filter(a=>a.priority==="critical"),l.critical)+m(d.filter(a=>a.priority==="high"),l.high)+d.filter(a=>n.has(a.id)).length/Math.max(1,o)*l.all)}function ee(){const{done:n,toggle:m,reset:a}=O(o),[p,g]=k.useState(r[0].id),[h,S]=k.useState(!1),u=d.filter(i=>n.has(i.id)).length,f=o?Math.round(u/o*100):0,b=Z(n),j=i=>i.items.filter(s=>n.has(s.id)).length,I=r.filter(i=>j(i)===i.items.length).length;return e.jsxs("div",{className:"space-y-6",children:[e.jsxs("div",{className:"grid gap-4 md:grid-cols-[1fr_auto]",children:[e.jsx(y,{children:e.jsxs(v,{className:"space-y-4 p-5",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-3",children:[e.jsx("h2",{className:"text-lg font-semibold",children:"Your progress"}),e.jsxs("div",{className:"flex gap-2",children:[e.jsx(w,{variant:"outline",size:"sm","aria-pressed":h,onClick:()=>S(i=>!i),children:h?"Show all items":"Show completed only"}),e.jsxs(w,{variant:"outline",size:"sm",onClick:a,disabled:u===0,children:[e.jsx($,{"aria-hidden":!0,className:"mr-2 h-4 w-4"}),"Reset"]})]})]}),e.jsxs("dl",{className:"grid grid-cols-3 gap-3 text-center",children:[e.jsxs("div",{className:"rounded-md border p-3",children:[e.jsx("dt",{className:"text-xs text-muted-foreground",children:"Items done"}),e.jsxs("dd",{className:"text-2xl font-bold tabular-nums",children:[u,"/",o]})]}),e.jsxs("div",{className:"rounded-md border p-3",children:[e.jsx("dt",{className:"text-xs text-muted-foreground",children:"Progress"}),e.jsxs("dd",{className:"text-2xl font-bold tabular-nums",children:[f,"%"]})]}),e.jsxs("div",{className:"rounded-md border p-3",children:[e.jsx("dt",{className:"text-xs text-muted-foreground",children:"Categories done"}),e.jsxs("dd",{className:"text-2xl font-bold tabular-nums",children:[I,"/",r.length]})]})]}),e.jsx(P,{value:f,"aria-label":"Checklist progress","aria-valuetext":`${u} of ${o} items (${f}%)`,className:"h-2"}),e.jsx("p",{className:"text-xs text-muted-foreground",children:"Saved in this browser."})]})}),e.jsx(y,{className:"md:w-72",children:e.jsxs(v,{className:"flex items-center gap-4 p-5",children:[e.jsx(G,{value:b,max:100,size:72,thickness:7,tone:"progress",ariaLabel:`Weighted estimate ${b} out of 100`}),e.jsxs("div",{className:"min-w-0",children:[e.jsx("h2",{className:"text-sm font-semibold",children:"Weighted estimate"}),e.jsxs("p",{className:"mt-1 text-xs text-muted-foreground",children:[l.critical,"% critical items, ",l.high,"% high items, ",l.all,"% all items. A progress indicator for this list, not a security rating."]})]})]})})]}),e.jsxs(V,{value:p,onValueChange:g,className:"w-full",children:[e.jsx(_,{className:"grid h-auto w-full grid-cols-4",children:r.map(i=>{const s=i.icon,t=j(i);return e.jsxs(D,{value:i.id,className:"gap-2",children:[e.jsx(s,{"aria-hidden":!0,className:"h-4 w-4 shrink-0"}),e.jsx("span",{className:"sr-only sm:not-sr-only sm:truncate",children:i.name}),e.jsxs("span",{className:"text-xs tabular-nums text-muted-foreground",children:[t,"/",i.items.length]})]},i.id)})}),r.map(i=>{const s=i.items.filter(t=>!h||n.has(t.id));return e.jsxs(E,{value:i.id,className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("h2",{className:"text-xl font-semibold",children:i.name}),e.jsx("p",{className:"text-sm text-muted-foreground",children:i.description})]}),s.length===0&&e.jsx("p",{className:"rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground",children:"No completed items in this category yet."}),s.map(t=>{const x=n.has(t.id),N=`checklist-${t.id}`;return e.jsx(y,{className:C(x&&"border-emerald-500/40"),children:e.jsx(v,{className:"p-0",children:e.jsx(z,{type:"single",collapsible:!0,className:"w-full",children:e.jsxs(L,{value:t.id,className:"border-none",children:[e.jsxs("div",{className:"flex items-start gap-4 px-4 sm:px-6",children:[e.jsx(T,{id:N,checked:x,onCheckedChange:()=>m(t.id),className:"mt-5","aria-label":`Mark "${t.title}" as done`}),e.jsxs("div",{className:"min-w-0 flex-1",children:[e.jsx(M,{className:"py-4 hover:no-underline",children:e.jsxs("span",{className:"block flex-1 text-left",children:[e.jsxs("span",{className:"mb-1.5 flex flex-wrap items-center gap-2",children:[e.jsx("span",{className:C("font-semibold",x&&"text-muted-foreground line-through"),children:t.title}),e.jsx(F,{band:W(t.priority),size:"xs",label:`${t.priority[0].toUpperCase()}${t.priority.slice(1)} priority`})]}),e.jsx("span",{className:"block text-sm font-normal text-muted-foreground",children:t.description})]})}),e.jsxs("p",{className:"-mt-2 mb-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground",children:[e.jsxs(A,{to:`/aisvs#${t.aisvsReference}`,className:"inline-flex h-5 items-center rounded border px-1.5 font-mono text-[11px] text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",children:["AISVS ",t.aisvsReference]}),e.jsxs("span",{children:["Estimated ",t.estimatedTime]})]})]})]}),e.jsx(q,{className:"px-4 pb-6 sm:px-6",children:e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("h3",{className:"mb-2 font-medium",children:"Implementation guide"}),e.jsx("p",{className:"text-sm text-muted-foreground",children:t.implementationGuide})]}),t.codeExample&&e.jsxs("div",{children:[e.jsx("h3",{className:"mb-2 font-medium",children:"Code example"}),e.jsx(H,{code:t.codeExample,language:t.codeLanguage??"typescript"})]}),e.jsxs("div",{children:[e.jsx("h3",{className:"mb-2 font-medium",children:"Verification steps"}),e.jsx("ul",{className:"space-y-1",children:t.verificationSteps.map(c=>e.jsxs("li",{className:"flex items-center gap-2 text-sm",children:[e.jsx(B,{"aria-hidden":!0,className:"h-3 w-3 text-muted-foreground"}),c]},c))})]}),t.dependencies&&e.jsxs("div",{children:[e.jsx("h3",{className:"mb-2 font-medium",children:"Dependencies"}),e.jsx("div",{className:"flex flex-wrap gap-2",children:t.dependencies.map(c=>e.jsx(R,{variant:"outline",className:"text-xs",children:c},c))})]})]})})]})})})},t.id)})]},i.id)})]})]})}function Ce(){return e.jsxs(Y,{title:"Security Checklist",description:"Step-by-step AI security implementation checklist with progress tracking, code examples and OWASP AISVS references for securing agentic AI systems.",canonicalPath:"/interactive",keywords:"AI security checklist, AI agent security implementation, secure AI development, OWASP AISVS, agentic systems security, security controls checklist",children:[e.jsx(X,{eyebrow:"Tools",title:"Security Checklist",description:"A step-by-step implementation guide with code examples and OWASP AISVS references. Tick items off as you go; progress stays in this browser."}),e.jsx(ee,{})]})}export{Ce as default};

import{c as V,r as p,j as e,B as v,T as _}from"./index-DXul80FD.js";import{H as E}from"./Helmet-CVSAJjce.js";import{C as l,a as c,b as D,c as z}from"./card-DOeIPPhb.js";import{B as g}from"./badge-CQV--Aos.js";import{C as M}from"./checkbox-HD8T1ARW.js";import{P as j}from"./progress-Bn3EDXIh.js";import{T as L,a as H,b as q,c as F}from"./tabs-BunZ-z_O.js";import{A as k,a as w}from"./alert-tSwBDef5.js";import{A as O,a as G,b as W,c as B}from"./accordion-zvQhLj2S.js";import{C as U}from"./circle-check-big-DnjFEJmW.js";import{T as J}from"./target-Dvaz7sjF.js";import{S as $}from"./shield-Cm3QRPjH.js";import{D as K}from"./database-CNqZS0Kk.js";import{L as Q}from"./lock-Bx0GGirq.js";import{E as Y}from"./eye-B21dOTgB.js";import{H as X,F as Z}from"./Footer-BXfd5ABv.js";import"./check-DpjGPZnD.js";import"./index-BoAFyObh.js";import"./index-DtEpRVjO.js";import"./chevron-down-BJ4K9ibJ.js";import"./input-CwWIdGUb.js";import"./frameworkData-BqM4AfIr.js";/**
 * @license lucide-react v0.462.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ee=V("RefreshCw",[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]]),te={blue:{bg:"bg-blue-100 dark:bg-blue-950/30",text:"text-blue-800 dark:text-blue-300",border:"border-blue-200 dark:border-blue-800"},green:{bg:"bg-green-100 dark:bg-green-950/30",text:"text-green-800 dark:text-green-300",border:"border-green-200 dark:border-green-800"},purple:{bg:"bg-purple-100 dark:bg-purple-950/30",text:"text-purple-800 dark:text-purple-300",border:"border-purple-200 dark:border-purple-800"},orange:{bg:"bg-orange-100 dark:bg-orange-950/30",text:"text-orange-800 dark:text-orange-300",border:"border-orange-200 dark:border-orange-800"},red:{bg:"bg-red-100 dark:bg-red-950/30",text:"text-red-800 dark:text-red-300",border:"border-red-200 dark:border-red-800"}},d=[{id:"input-validation",name:"Input Validation & Filtering",description:"Protect against prompt injection and malicious inputs",icon:e.jsx($,{className:"h-5 w-5"}),color:"blue",items:[{id:"prompt-injection-defense",title:"Implement Prompt Injection Defense",description:"Deploy comprehensive protection against prompt injection attacks",category:"input-validation",priority:"critical",aisvsReference:"C2.1",implementationGuide:"Set up multi-layered defense including input validation, instruction hierarchy enforcement, and pattern detection for known injection techniques.",codeExample:`
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
        `,estimatedTime:"4-8 hours",verificationSteps:["Test with known injection patterns","Verify instruction hierarchy is maintained","Check that malicious prompts are blocked","Ensure legitimate inputs still work"]},{id:"input-sanitization",title:"Input Sanitization & Normalization",description:"Clean and normalize user inputs before processing",category:"input-validation",priority:"high",aisvsReference:"C2.2",implementationGuide:"Implement Unicode normalization, homoglyph detection, and content sanitization to prevent adversarial inputs.",codeExample:`
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
        `,estimatedTime:"2-4 hours",verificationSteps:["Test with Unicode variations","Verify homoglyph detection works","Check normalization preserves meaning","Validate against bypass attempts"]},{id:"content-filtering",title:"Content Policy Screening",description:"Screen inputs and outputs for policy violations",category:"input-validation",priority:"high",aisvsReference:"C2.4",implementationGuide:"Deploy content classifiers to detect harmful content categories including violence, hate speech, and inappropriate requests.",codeExample:`
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
        `,estimatedTime:"6-12 hours",verificationSteps:["Test content classifier accuracy","Verify policy violations are blocked","Check false positive rates","Validate safe content passes through"]}]},{id:"data-security",name:"Training Data Security",description:"Secure training data and prevent poisoning attacks",icon:e.jsx(K,{className:"h-5 w-5"}),color:"green",items:[{id:"data-provenance",title:"Maintain Data Provenance",description:"Track and document the source and history of all training data",category:"data-security",priority:"critical",aisvsReference:"C1.1",implementationGuide:"Implement comprehensive data lineage tracking including source, steward, license, collection method, and processing history.",codeExample:`
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
        `,estimatedTime:"8-16 hours",verificationSteps:["Verify all data sources are documented","Check lineage tracking is complete","Validate metadata accuracy","Ensure audit trail exists"]},{id:"data-validation",title:"Automated Data Quality Validation",description:"Implement automated checks for data quality and integrity",category:"data-security",priority:"high",aisvsReference:"C1.5",implementationGuide:"Set up automated validation pipelines to detect format errors, null values, label inconsistencies, and statistical anomalies.",codeExample:`
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
        `,estimatedTime:"4-8 hours",verificationSteps:["Test validation with corrupted data","Verify error detection accuracy","Check performance with large datasets","Validate quarantine mechanisms work"]},{id:"poisoning-detection",title:"Data Poisoning Detection",description:"Implement anomaly detection to identify potential data poisoning",category:"data-security",priority:"high",aisvsReference:"C1.6",implementationGuide:"Deploy statistical and ML-based anomaly detection to identify suspicious patterns in training data that could indicate poisoning attempts.",codeExample:`
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
        `,estimatedTime:"12-20 hours",verificationSteps:["Test with known poisoning examples","Verify detection sensitivity","Check false positive rates","Validate alerting mechanisms"]}]},{id:"access-control",name:"Access Control & Authentication",description:"Secure access to AI systems and data",icon:e.jsx(Q,{className:"h-5 w-5"}),color:"purple",items:[{id:"api-authentication",title:"API Authentication & Authorization",description:"Implement robust authentication for all API endpoints",category:"access-control",priority:"critical",aisvsReference:"C3.1",implementationGuide:"Deploy strong authentication mechanisms including API keys, OAuth 2.0, or JWT tokens with proper authorization controls.",codeExample:`
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
        `,estimatedTime:"4-8 hours",verificationSteps:["Test authentication with valid tokens","Verify unauthorized access is blocked","Check token expiration handling","Validate rate limiting works"]},{id:"rate-limiting",title:"Rate Limiting & Abuse Prevention",description:"Implement rate limiting to prevent abuse and DoS attacks",category:"access-control",priority:"high",aisvsReference:"C2.5",implementationGuide:"Configure rate limiting per user, IP, and API key with different limits for different endpoints based on computational cost.",codeExample:`
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
        `,estimatedTime:"2-4 hours",verificationSteps:["Test rate limits are enforced","Verify different limits per endpoint","Check burst handling","Validate legitimate users not blocked"]}]},{id:"monitoring",name:"Monitoring & Logging",description:"Monitor AI system behavior and maintain audit logs",icon:e.jsx(Y,{className:"h-5 w-5"}),color:"orange",items:[{id:"controlled-deployment",title:"Controlled Deployment & Rollback",description:"Implement gradual rollout mechanisms and atomic rollback capabilities for model deployments",category:"monitoring",priority:"critical",aisvsReference:"C3.3",implementationGuide:"Implement gradual rollout mechanisms (canary, blue-green deployments) with automated rollback triggers based on error rates, latency thresholds, or security alerts. Ensure atomic rollback restores complete model state including weights, configurations, and dependencies.",codeExample:`
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
`,estimatedTime:"8-16 hours",verificationSteps:["Verify gradual rollout mechanisms work","Test automated rollback triggers","Validate atomic rollback restores full state","Check emergency shutdown capabilities"]},{id:"change-accountability",title:"Change Accountability & Audit",description:"Generate immutable audit records for all model changes including deployment, configuration, and retirement",category:"monitoring",priority:"high",aisvsReference:"C3.4",implementationGuide:"Implement immutable audit records for all model changes including timestamp, authenticated actor identity, change type, and before/after states. Version control prompt templates in git with mandatory code review before deployment.",codeExample:`
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
        `,estimatedTime:"4-8 hours",verificationSteps:["Verify all model changes generate audit records","Check audit records include before/after states","Validate prompt templates are version-controlled","Test audit log access controls"]}]}],ie=()=>{const[s,h]=p.useState(new Set),[S,N]=p.useState("input-validation"),[x,C]=p.useState(!1);p.useEffect(()=>{const t=localStorage.getItem("ai-security-checklist");t&&h(new Set(JSON.parse(t)))},[]),p.useEffect(()=>{localStorage.setItem("ai-security-checklist",JSON.stringify(Array.from(s)))},[s]);const I=t=>{h(r=>{const i=new Set(r);return i.has(t)?i.delete(t):i.add(t),i})},A=()=>{h(new Set),localStorage.removeItem("ai-security-checklist")},u=d.reduce((t,r)=>t+r.items.length,0),f=s.size,y=u>0?f/u*100:0,b=t=>{const r=d.find(o=>o.id===t);return r?r.items.filter(o=>s.has(o.id)).length/r.items.length*100:0},R=t=>{switch(t){case"critical":return"bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-300";case"high":return"bg-orange-100 text-orange-800 dark:bg-orange-950/30 dark:text-orange-300";case"medium":return"bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-300";case"low":return"bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-300";default:return"bg-gray-100 text-gray-800 dark:bg-gray-950/30 dark:text-gray-300"}},a=(()=>{const t=d.flatMap(n=>n.items).filter(n=>n.priority==="critical"),r=d.flatMap(n=>n.items).filter(n=>n.priority==="high"),i=t.filter(n=>s.has(n.id)).length,o=r.filter(n=>s.has(n.id)).length,m=t.length>0?i/t.length*60:60,T=r.length>0?o/r.length*30:30,P=f/u*10;return Math.round(m+T+P)})();return e.jsxs("div",{className:"space-y-6",children:[e.jsxs("div",{className:"text-center",children:[e.jsx("h2",{className:"text-3xl font-bold mb-4",children:"AI Security Implementation Checklist"}),e.jsx("p",{className:"text-muted-foreground max-w-2xl mx-auto",children:"Follow this comprehensive checklist to implement security controls for your AI system based on OWASP AISVS standards. Track your progress and get implementation guidance."})]}),e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-4 gap-4",children:[e.jsx(l,{className:"security-card",children:e.jsxs(c,{className:"p-4 text-center",children:[e.jsxs("div",{className:"text-3xl font-bold text-primary mb-1",children:[f,"/",u]}),e.jsx("div",{className:"text-sm text-muted-foreground",children:"Items Complete"})]})}),e.jsx(l,{className:"security-card",children:e.jsxs(c,{className:"p-4 text-center",children:[e.jsxs("div",{className:"text-3xl font-bold text-primary mb-1",children:[Math.round(y),"%"]}),e.jsx("div",{className:"text-sm text-muted-foreground",children:"Progress"})]})}),e.jsx(l,{className:"security-card",children:e.jsxs(c,{className:"p-4 text-center",children:[e.jsxs("div",{className:`text-3xl font-bold mb-1 ${a>=80?"text-green-600 dark:text-green-400":a>=60?"text-yellow-600 dark:text-yellow-400":"text-red-600 dark:text-red-400"}`,children:[a,"/100"]}),e.jsx("div",{className:"text-sm text-muted-foreground",children:"Security Score"})]})}),e.jsx(l,{className:"security-card",children:e.jsxs(c,{className:"p-4 text-center",children:[e.jsx("div",{className:"text-3xl font-bold text-primary mb-1",children:d.filter(t=>b(t.id)===100).length}),e.jsx("div",{className:"text-sm text-muted-foreground",children:"Categories Done"})]})})]}),e.jsx(l,{className:"bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30",children:e.jsxs(c,{className:"p-6",children:[e.jsxs("div",{className:"flex items-center justify-between mb-4",children:[e.jsx("h3",{className:"text-lg font-semibold",children:"Overall Security Implementation"}),e.jsxs("div",{className:"flex gap-2",children:[e.jsx(v,{variant:"outline",size:"sm",onClick:()=>C(!x),children:x?"Show All":"Show Completed"}),e.jsxs(v,{variant:"outline",size:"sm",onClick:A,children:[e.jsx(ee,{className:"h-4 w-4 mr-2"}),"Reset"]})]})]}),e.jsxs("div",{className:"space-y-2",children:[e.jsxs("div",{className:"flex justify-between text-sm",children:[e.jsx("span",{children:"Progress"}),e.jsxs("span",{children:[Math.round(y),"% complete"]})]}),e.jsx(j,{value:y,className:"h-3"})]}),a<80&&e.jsxs(k,{className:"mt-4 bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800",children:[e.jsx(_,{className:"h-4 w-4"}),e.jsxs(w,{children:[e.jsxs("strong",{children:["Security Score: ",a,"/100"]}),e.jsx("br",{}),a<40&&"Critical security gaps identified. Prioritize implementing critical and high priority items.",a>=40&&a<60&&"Moderate security posture. Focus on completing high priority items.",a>=60&&a<80&&"Good progress! Complete remaining critical items to improve security."]})]}),a>=80&&e.jsxs(k,{className:"mt-4 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800",children:[e.jsx(U,{className:"h-4 w-4"}),e.jsxs(w,{children:[e.jsxs("strong",{children:["Excellent Security Score: ",a,"/100"]}),e.jsx("br",{}),"Your AI system has strong security controls implemented. Continue monitoring and maintaining these controls."]})]})]})}),e.jsxs(L,{value:S,onValueChange:N,className:"w-full",children:[e.jsx(H,{className:"grid w-full grid-cols-4",children:d.map(t=>e.jsxs(q,{value:t.id,className:"flex items-center gap-2",children:[t.icon,e.jsx("span",{className:"hidden sm:inline",children:t.name.split(" ")[0]}),e.jsxs(g,{variant:"outline",className:"text-xs",children:[Math.round(b(t.id)),"%"]})]},t.id))}),d.map(t=>{var r;return e.jsxs(F,{value:t.id,className:"space-y-4",children:[e.jsxs(l,{className:"security-card",children:[e.jsx(D,{children:e.jsxs(z,{className:"flex items-center gap-3",children:[e.jsx("div",{className:`p-2 rounded-lg ${((r=te[t.color])==null?void 0:r.bg)??"bg-gray-100 dark:bg-gray-950/30"}`,children:t.icon}),e.jsxs("div",{children:[e.jsx("h3",{className:"text-xl",children:t.name}),e.jsx("p",{className:"text-muted-foreground text-sm font-normal",children:t.description})]})]})}),e.jsxs(c,{children:[e.jsxs("div",{className:"flex items-center justify-between mb-4",children:[e.jsx("span",{className:"text-sm font-medium",children:"Category Progress"}),e.jsxs("span",{className:"text-sm text-muted-foreground",children:[t.items.filter(i=>s.has(i.id)).length,"/",t.items.length," complete"]})]}),e.jsx(j,{value:b(t.id),className:"h-2"})]})]}),e.jsx("div",{className:"space-y-4",children:t.items.filter(i=>!x||s.has(i.id)).map(i=>e.jsx(l,{className:`checklist-item ${s.has(i.id)?"completed":""}`,children:e.jsx(c,{className:"p-0",children:e.jsx(O,{type:"single",collapsible:!0,className:"w-full",children:e.jsxs(G,{value:i.id,className:"border-none",children:[e.jsx(W,{className:"px-6 py-4 hover:no-underline",children:e.jsxs("div",{className:"flex items-start gap-4 w-full",children:[e.jsx(M,{checked:s.has(i.id),onCheckedChange:()=>I(i.id),className:"mt-1"}),e.jsxs("div",{className:"flex-1 text-left",children:[e.jsxs("div",{className:"flex items-center gap-3 mb-2",children:[e.jsx("h4",{className:"font-semibold",children:i.title}),e.jsx(g,{className:R(i.priority),children:i.priority}),e.jsx(g,{variant:"outline",className:"text-xs",children:i.aisvsReference})]}),e.jsx("p",{className:"text-sm text-muted-foreground",children:i.description}),e.jsx("div",{className:"flex items-center gap-4 mt-2 text-xs text-muted-foreground",children:e.jsxs("span",{children:["⏱️ ",i.estimatedTime]})})]})]})}),e.jsx(B,{className:"px-6 pb-6",children:e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("h5",{className:"font-medium mb-2",children:"Implementation Guide"}),e.jsx("p",{className:"text-sm text-muted-foreground",children:i.implementationGuide})]}),i.codeExample&&e.jsxs("div",{children:[e.jsx("h5",{className:"font-medium mb-2",children:"Code Example"}),e.jsx("pre",{className:"text-xs overflow-auto bg-muted p-4 rounded-lg",children:e.jsx("code",{children:i.codeExample.trim()})})]}),e.jsxs("div",{children:[e.jsx("h5",{className:"font-medium mb-2",children:"Verification Steps"}),e.jsx("ul",{className:"space-y-1",children:i.verificationSteps.map((o,m)=>e.jsxs("li",{className:"flex items-center gap-2 text-sm",children:[e.jsx(J,{className:"h-3 w-3 text-muted-foreground"}),o]},m))})]}),i.dependencies&&e.jsxs("div",{children:[e.jsx("h5",{className:"font-medium mb-2",children:"Dependencies"}),e.jsx("div",{className:"flex flex-wrap gap-2",children:i.dependencies.map((o,m)=>e.jsx(g,{variant:"outline",className:"text-xs",children:o},m))})]})]})})]})})})},i.id))})]},t.id)})]})]})};function Ce(){return e.jsxs(e.Fragment,{children:[e.jsxs(E,{children:[e.jsx("title",{children:"Security Implementation Checklist | Agentic Security Hub"}),e.jsx("meta",{name:"description",content:"Step-by-step AI security implementation checklist with progress tracking, code examples, and OWASP AISVS references for securing agentic AI systems."}),e.jsx("meta",{name:"keywords",content:"AI security checklist, AI agent security implementation, secure AI development, OWASP AISVS, agentic systems security, security controls checklist"}),e.jsx("meta",{name:"robots",content:"index, follow"}),e.jsx("link",{rel:"canonical",href:"https://agenticsecurity.info/interactive"}),e.jsx("meta",{property:"og:title",content:"Security Implementation Checklist | Agentic Security Hub"}),e.jsx("meta",{property:"og:description",content:"Step-by-step AI security implementation checklist with progress tracking and code examples."}),e.jsx("meta",{property:"og:type",content:"website"}),e.jsx("meta",{property:"og:url",content:"https://agenticsecurity.info/interactive"}),e.jsx("meta",{name:"twitter:card",content:"summary_large_image"}),e.jsx("meta",{name:"twitter:title",content:"Security Implementation Checklist | Agentic Security Hub"}),e.jsx("meta",{name:"twitter:description",content:"Step-by-step AI security implementation checklist with progress tracking and code examples."})]}),e.jsx(X,{}),e.jsxs("main",{id:"main-content",className:"container mx-auto px-4 py-8 space-y-8",children:[e.jsxs("div",{className:"mb-8",children:[e.jsx("h1",{className:"text-2xl font-bold tracking-tight",children:"Interactive Tools"}),e.jsx("p",{className:"mt-1 text-muted-foreground",children:"A step-by-step implementation guide with progress tracking, code examples, and AISVS references to help you systematically apply security controls to your agentic AI systems."})]}),e.jsx(ie,{})]}),e.jsx(Z,{})]})}export{Ce as default};

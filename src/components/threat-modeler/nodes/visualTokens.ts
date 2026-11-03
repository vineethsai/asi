import {
  Activity,
  Building2,
  Crown,
  Database,
  Eye,
  Fingerprint,
  KeyRound,
  Network,
  PenLine,
  Pencil,
  Plug,
  Scale,
  ShieldCheck,
  Terminal,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { severityColor } from "@/lib/severity";
import type {
  DataFlowMetadata,
  DataSensitivity,
  SemanticKind,
  ToolAccessMode,
  TrustLevel,
} from "../types";

/**
 * Visual tokens shared by the canvas nodes, edges and the legend (§7.5).
 * Every colour is theme-aware (CSS vars with fallbacks) and every colour has a
 * text label next to it somewhere (chip, sr-only text or legend).
 */

export const TRUST_LABEL: Record<TrustLevel, string> = {
  untrusted: "Untrusted",
  "semi-trusted": "Semi-trusted",
  trusted: "Trusted",
};

/** Trust stripe / zone colour: untrusted red, semi-trusted amber, trusted green. */
export function trustColor(
  level: TrustLevel | undefined,
  alpha?: number,
  variant: "base" | "fg" = "base",
): string {
  switch (level) {
    case "untrusted":
      return severityColor("critical", variant, alpha);
    case "trusted":
      return severityColor("low", variant, alpha);
    default:
      return severityColor("medium", variant, alpha);
  }
}

export type Classification = DataFlowMetadata["dataClassification"];

export const CLASSIFICATIONS: Classification[] = [
  "Public",
  "Internal",
  "Confidential",
  "Restricted",
];

/** Data-flow stroke colour by classification (Public → Restricted). */
export function classificationColor(c: Classification | undefined, alpha?: number): string {
  switch (c) {
    case "Public":
      return severityColor("low", "base", alpha);
    case "Confidential":
      return severityColor("high", "base", alpha);
    case "Restricted":
      return severityColor("critical", "base", alpha);
    default:
      return severityColor("info", "base", alpha);
  }
}

export const ACCESS_MODE: Record<
  ToolAccessMode,
  { short: string; label: string; icon: LucideIcon }
> = {
  "read-only": { short: "RO", label: "Read-only", icon: Eye },
  "read-write": { short: "RW", label: "Read-write", icon: Pencil },
  "write-only": { short: "WO", label: "Write-only", icon: PenLine },
  execute: { short: "EXEC", label: "Execute", icon: Terminal },
  admin: { short: "ADMIN", label: "Admin", icon: Crown },
};

/** Danger of an access mode, for chip tone. */
export const ACCESS_BAND: Record<ToolAccessMode, "low" | "medium" | "high" | "critical"> = {
  "read-only": "low",
  "read-write": "medium",
  "write-only": "medium",
  execute: "high",
  admin: "critical",
};

export const SENSITIVITY: Record<
  Exclude<DataSensitivity, "none">,
  { label: string; icon: LucideIcon; band: "low" | "medium" | "high" | "critical" }
> = {
  internal: { label: "Internal", icon: Building2, band: "low" },
  pii: { label: "PII", icon: Fingerprint, band: "high" },
  credentials: { label: "Credentials", icon: KeyRound, band: "critical" },
  regulated: { label: "Regulated", icon: Scale, band: "critical" },
};

/** Agentic kinds that get a visible semantics chip (plain agent/model/tool do not). */
export const KIND_CHIP: Partial<Record<SemanticKind, { label: string; icon: LucideIcon }>> = {
  guardrail: { label: "Guardrail", icon: ShieldCheck },
  "hitl-gate": { label: "HITL gate", icon: UserCheck },
  "mcp-server": { label: "MCP", icon: Plug },
  "a2a-peer": { label: "A2A", icon: Users },
  memory: { label: "Memory", icon: Database },
  identity: { label: "Identity", icon: KeyRound },
  observability: { label: "Observability", icon: Activity },
  orchestrator: { label: "Orchestrator", icon: Network },
  "scoped-tool": { label: "Scoped tool", icon: ShieldCheck },
};

export const KIND_LABEL: Record<SemanticKind, string> = {
  agent: "agent",
  orchestrator: "orchestrator",
  model: "model",
  reasoning: "reasoning component",
  guardrail: "guardrail",
  "hitl-gate": "human approval gate",
  tool: "tool",
  "scoped-tool": "scoped tool",
  "mcp-server": "MCP server",
  "a2a-peer": "A2A peer",
  memory: "memory store",
  datastore: "data store",
  identity: "identity provider",
  observability: "observability",
  infrastructure: "infrastructure",
  "training-pipeline": "training pipeline",
  actor: "actor",
  external: "external system",
  boundary: "trust boundary",
  custom: "custom component",
};

/** Default icon key per category when `data.icon` is missing. */
export const CATEGORY_ICON: Record<string, string> = {
  kc1: "brain",
  kc2: "git-branch",
  kc3: "lightbulb",
  kc4: "database",
  kc5: "wrench",
  kc6: "server",
  actor: "user",
  external: "globe",
  datastore: "database",
  "trust-boundary": "shield",
  custom: "box",
};

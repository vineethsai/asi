import type { EdgeInfo, NodeInfo } from "../../graph";
import type { RuleContext } from "../types";

export const REF = {
  asi: {
    title: "OWASP Top 10 for Agentic Applications (2026)",
    url: "https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/",
  },
  tm: {
    title: "OWASP Agentic AI – Threats and Mitigations",
    url: "https://genai.owasp.org/resource/agentic-ai-threats-and-mitigations/",
  },
  aisvs: { title: "OWASP AISVS 1.01", url: "https://github.com/OWASP/AISVS" },
  maestro: {
    title: "CSA MAESTRO agentic AI threat modeling framework",
    url: "https://cloudsecurityalliance.org/blog/2025/02/06/agentic-ai-threat-modeling-framework-maestro",
  },
  mcp: {
    title: "Model Context Protocol – Security best practices",
    url: "https://modelcontextprotocol.io/specification/2025-06-18/basic/security_best_practices",
  },
  trifecta: {
    title: "The lethal trifecta for AI agents (Simon Willison)",
    url: "https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/",
  },
} as const;

export const label = (ctx: RuleContext, id: string) => ctx.h.label(id);

export function authText(e: EdgeInfo): string {
  const parts: string[] = [];
  parts.push(e.authenticated ? `auth ${e.data.authentication}` : "no authentication");
  parts.push(e.encrypted ? "encrypted" : "unencrypted");
  if (e.data.containsPII) parts.push("carries PII");
  if (e.data.dataClassification === "Confidential" || e.data.dataClassification === "Restricted")
    parts.push(e.data.dataClassification);
  return parts.join(", ");
}

export function edgeText(ctx: RuleContext, e: EdgeInfo): string {
  return `edge ${label(ctx, e.source)} → ${label(ctx, e.target)} (${authText(e)})`;
}

/**
 * The entry point feeding `nodeId` directly or through a chain of gates
 * (User → Guardrail → Agent). Returns the entry and the gates in between.
 */
export function entryVia(
  ctx: RuleContext,
  nodeId: string,
): { entry: NodeInfo; gates: NodeInfo[]; edge: EdgeInfo } | undefined {
  const visit = (id: string, gates: NodeInfo[], depth: number, firstEdge?: EdgeInfo) => {
    if (depth > 4) return undefined;
    for (const e of ctx.h.inbound(id)) {
      const src = ctx.h.node(e.source);
      if (!src) continue;
      if (src.isEntry) return { entry: src, gates, edge: firstEdge ?? e };
      if (src.isGate) {
        const r = visit(src.id, [src, ...gates], depth + 1, firstEdge ?? e);
        if (r) return r;
      }
    }
    return undefined;
  };
  return visit(nodeId, [], 0);
}

/** Danger weight used for excessive agency. */
export const DANGER_WEIGHT: Record<string, number> = {
  critical: 2,
  dangerous: 1.5,
  guarded: 1,
  safe: 0.5,
};

export function isActionTarget(n: NodeInfo): boolean {
  return n.isTool || (n.isExternal && !!n.data.toolAccessMode);
}

export const hasProvenance = (n: NodeInfo) => {
  const p = n.data.semantics?.provenance ?? n.data.semantics?.mcp?.provenance;
  return !!p && p.signed && p.pinned;
};

export function listLabels(ctx: RuleContext, ids: string[], max = 6): string {
  const names = ids.map((id) => label(ctx, id));
  return names.length > max
    ? `${names.slice(0, max).join(", ")} and ${names.length - max} more`
    : names.join(", ");
}

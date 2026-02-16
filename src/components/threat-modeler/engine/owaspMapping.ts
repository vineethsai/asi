import type { GeneratedThreat, OwaspAgenticMapping } from "../types";
import { agenticTop10Data } from "@/components/components/owaspAgenticTop10Data";

// High-confidence keyword patterns mapped to ASI IDs
const KEYWORD_TO_ASI: { pattern: RegExp; asiId: string; confidence: "high" | "medium" }[] = [
  // ASI01: Agent Goal Hijack
  {
    pattern: /prompt.?injection|goal.?hijack|instruction.?injection/i,
    asiId: "ASI01",
    confidence: "high",
  },
  { pattern: /jailbreak|guardrail.?bypass|system.?prompt/i, asiId: "ASI01", confidence: "medium" },

  // ASI02: Tool Misuse & Exploitation
  { pattern: /tool.?misuse|tool.?exploit/i, asiId: "ASI02", confidence: "high" },
  { pattern: /function.?call.?inject|api.?abuse/i, asiId: "ASI02", confidence: "medium" },

  // ASI03: Identity & Privilege Abuse
  {
    pattern: /privilege.?escalat|identity.?abuse|auth.*bypass/i,
    asiId: "ASI03",
    confidence: "high",
  },
  { pattern: /access.?control|permission|impersonat/i, asiId: "ASI03", confidence: "medium" },

  // ASI04: Agentic Supply Chain
  { pattern: /supply.?chain|dependency|plugin.?vulner/i, asiId: "ASI04", confidence: "high" },
  { pattern: /third.?party|library|package/i, asiId: "ASI04", confidence: "medium" },

  // ASI05: Unexpected Code Execution (RCE)
  { pattern: /code.?exec|arbitrary.?code|rce|sandbox/i, asiId: "ASI05", confidence: "high" },
  { pattern: /command.?inject|shell|interpreter/i, asiId: "ASI05", confidence: "medium" },

  // ASI06: Memory & Context Poisoning
  { pattern: /memory.?poison|context.?poison|rag.?poison/i, asiId: "ASI06", confidence: "high" },
  {
    pattern: /data.?poison|knowledge.?corrupt|embedding.?manipul/i,
    asiId: "ASI06",
    confidence: "medium",
  },

  // ASI07: Insecure Inter-Agent Communication
  {
    pattern: /inter.?agent|multi.?agent.?commun|agent.?to.?agent/i,
    asiId: "ASI07",
    confidence: "high",
  },
  { pattern: /message.?integrity|channel.?encrypt/i, asiId: "ASI07", confidence: "medium" },

  // ASI08: Cascading Failures
  {
    pattern: /cascading.?fail|chain.?reaction|propagat.*fail/i,
    asiId: "ASI08",
    confidence: "high",
  },
  { pattern: /single.?point|resilien|availability/i, asiId: "ASI08", confidence: "medium" },

  // ASI09: Human-Agent Trust Exploitation
  {
    pattern: /human.*trust|social.?engineer.*agent|hitl.*bypass/i,
    asiId: "ASI09",
    confidence: "high",
  },
  {
    pattern: /missing.?human|oversight|human.?in.?the.?loop/i,
    asiId: "ASI09",
    confidence: "medium",
  },

  // ASI10: Rogue Agents
  {
    pattern: /rogue.?agent|autonomous.*uncontrol|self.?replicat/i,
    asiId: "ASI10",
    confidence: "high",
  },
  { pattern: /excessive.?agency|unbounded|unconstrained/i, asiId: "ASI10", confidence: "medium" },
];

// MAESTRO layer correlations (lower confidence)
const LAYER_TO_ASI: Record<number, string[]> = {
  1: ["ASI01", "ASI06"], // Foundation Models -> Goal Hijack, Memory Poisoning
  2: ["ASI06", "ASI04"], // Data Operations -> Memory Poisoning, Supply Chain
  3: ["ASI01", "ASI02", "ASI05"], // Agent Frameworks -> Goal Hijack, Tool Misuse, RCE
  4: ["ASI05", "ASI04"], // Deployment Infra -> RCE, Supply Chain
  5: ["ASI09", "ASI08"], // Eval/Observability -> Trust, Cascading
  6: ["ASI03", "ASI09"], // Security/Compliance -> Identity, Trust
  7: ["ASI07", "ASI10", "ASI08"], // Agent Ecosystem -> Inter-Agent, Rogue, Cascading
};

function mapSingleThreat(threat: GeneratedThreat): OwaspAgenticMapping[] {
  const matchMap = new Map<string, "high" | "medium" | "low">();

  const text = `${threat.name} ${threat.description}`;

  // 1. Keyword matching (high/medium confidence)
  for (const { pattern, asiId, confidence } of KEYWORD_TO_ASI) {
    if (pattern.test(text)) {
      const existing = matchMap.get(asiId);
      if (!existing || (confidence === "high" && existing !== "high")) {
        matchMap.set(asiId, confidence);
      }
    }
  }

  // 2. MAESTRO layer correlation (low confidence, only if not already matched)
  if (threat.maestroLayer !== undefined) {
    const layerAsis = LAYER_TO_ASI[threat.maestroLayer as number];
    if (layerAsis) {
      for (const asiId of layerAsis) {
        if (!matchMap.has(asiId)) {
          matchMap.set(asiId, "low");
        }
      }
    }
  }

  // Build results with data from the reference dataset
  const results: OwaspAgenticMapping[] = [];
  for (const [asiId, confidence] of matchMap) {
    const entry = agenticTop10Data.find((e) => e.id === asiId || e.code === asiId);
    if (entry) {
      results.push({
        asiId: entry.id,
        asiName: entry.name,
        confidence,
      });
    }
  }

  // Sort by confidence (high first)
  const order = { high: 0, medium: 1, low: 2 };
  results.sort((a, b) => order[a.confidence] - order[b.confidence]);

  return results;
}

export function applyOwaspMapping(threats: GeneratedThreat[]): GeneratedThreat[] {
  return threats.map((t) => ({
    ...t,
    owaspMapping: mapSingleThreat(t),
  }));
}

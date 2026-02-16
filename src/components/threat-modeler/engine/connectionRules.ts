import type { CanvasNode, CanvasEdge, GeneratedThreat } from "../types";
import type { NodeRiskProfile } from "./nodeProfile";

export function runConnectionAnalysis(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  profiles?: Map<string, NodeRiskProfile>,
): GeneratedThreat[] {
  const threats: GeneratedThreat[] = [];
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  for (const edge of edges) {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);
    if (!source?.data || !target?.data) continue;
    const srcCat = source.data.category;
    const tgtCat = target.data.category;
    const srcProfile = profiles?.get(edge.source);
    const tgtProfile = profiles?.get(edge.target);
    if (srcCat === "actor" && (tgtCat === "kc1" || tgtCat === "kc2" || tgtCat === "kc3")) {
      threats.push({
        id: `conn-prompt-injection-${edge.id}`,
        name: "Prompt Injection Vector",
        description: `User/Actor "${source.data.label}" has a direct data flow to "${target.data.label}". This is a potential prompt injection vector.`,
        severity: "high",
        methodology: "connection",
        affectedNodeIds: [edge.source, edge.target],
        affectedEdgeIds: [edge.id!],
        inherited: false,
        mitigations: [
          "Input validation and sanitization",
          "Prompt hardening and instruction hierarchy",
          "Content security filtering",
        ],
      });
    }
    if ((srcCat === "kc2" || srcCat === "kc1") && (tgtCat === "kc5" || tgtCat === "kc6")) {
      const danger = tgtProfile?.accessDanger ?? "guarded";

      let severity: "critical" | "high" | "medium" | "low" = "high";
      const mitigations = [
        "Tool sandboxing and isolation",
        "Permission boundaries per tool",
        "Human-in-the-loop for destructive actions",
      ];

      if (danger === "critical" || danger === "dangerous") {
        severity = "critical";
        mitigations.push("Mandatory approval workflow for critical tool actions");
      }
      if (danger === "safe") {
        severity = "medium";
      }

      const riskLabel = tgtProfile?.toolRiskTier ? ` (risk: ${tgtProfile.toolRiskTier})` : "";
      const accessLabel = tgtProfile?.toolAccessMode ? ` [${tgtProfile.toolAccessMode}]` : "";

      threats.push({
        id: `conn-tool-misuse-${edge.id}`,
        name: "Tool Misuse via Agent",
        description: `"${source.data.label}" sends commands to "${target.data.label}"${riskLabel}${accessLabel}. A compromised agent could misuse tool capabilities.`,
        severity,
        methodology: "connection",
        affectedNodeIds: [edge.source, edge.target],
        affectedEdgeIds: [edge.id!],
        inherited: false,
        mitigations,
      });

      if (tgtProfile?.isExecutionCapable) {
        threats.push({
          id: `conn-code-exec-${edge.id}`,
          name: "Arbitrary Code Execution",
          description: `"${source.data.label}" can execute code via "${target.data.label}". If the agent is compromised, arbitrary code could run on the host.`,
          severity: "critical",
          methodology: "connection",
          affectedNodeIds: [edge.source, edge.target],
          affectedEdgeIds: [edge.id!],
          inherited: false,
          mitigations: [
            "Sandbox all code execution in isolated containers",
            "Enforce strict resource limits (CPU, memory, network)",
            "Block access to host filesystem and network",
            "Code review / allow-listing for executed commands",
          ],
        });
      }
    }

    if (
      srcCat === "kc3" &&
      tgtCat === "kc5" &&
      (srcProfile?.functionCallSurface ?? source.data.promptType === "function-call")
    ) {
      threats.push({
        id: `conn-fn-call-injection-${edge.id}`,
        name: "Function Call Injection",
        description: `Function Call Schema "${source.data.label}" connects to tool "${target.data.label}". An attacker could manipulate the function call schema to invoke unintended tool actions.`,
        severity: "high",
        methodology: "connection",
        affectedNodeIds: [edge.source, edge.target],
        affectedEdgeIds: [edge.id!],
        inherited: false,
        mitigations: [
          "Validate function call parameters against strict schemas",
          "Whitelist allowed function names and argument types",
          "Log and audit all function call invocations",
          "Implement rate limiting on tool invocations",
        ],
      });
    }
    if ((srcCat === "kc1" || srcCat === "kc2" || srcCat === "kc3") && tgtCat === "kc4") {
      threats.push({
        id: `conn-memory-poisoning-${edge.id}`,
        name: "Memory Poisoning via Agent Output",
        description: `"${source.data.label}" writes to memory component "${target.data.label}". Compromised outputs could poison stored data.`,
        severity: "medium",
        methodology: "connection",
        affectedNodeIds: [edge.source, edge.target],
        affectedEdgeIds: [edge.id!],
        inherited: false,
        mitigations: [
          "Memory validation and sanitization",
          "Output verification before storage",
          "Memory integrity checks",
        ],
      });
    }
    if (srcCat === "kc2" && tgtCat === "kc2") {
      threats.push({
        id: `conn-multi-agent-${edge.id}`,
        name: "Multi-Agent Communication Risk",
        description: `Communication between agents "${source.data.label}" and "${target.data.label}" could be exploited for cascading failures or rogue behavior.`,
        severity: "high",
        methodology: "connection",
        affectedNodeIds: [edge.source, edge.target],
        affectedEdgeIds: [edge.id!],
        inherited: false,
        mitigations: [
          "Mutual authentication between agents",
          "Message integrity verification",
          "Agent behavior monitoring",
          "Communication channel encryption",
        ],
      });
    }
    if (tgtCat === "external" || srcCat === "external") {
      const meta = edge.data;
      if (meta && (!meta.encrypted || meta.authentication === "None")) {
        threats.push({
          id: `conn-external-insecure-${edge.id}`,
          name: "Insecure External System Connection",
          description: `Connection to external system lacks ${!meta.encrypted ? "encryption" : ""}${!meta.encrypted && meta.authentication === "None" ? " and " : ""}${meta.authentication === "None" ? "authentication" : ""}.`,
          severity: "high",
          methodology: "connection",
          affectedNodeIds: [edge.source, edge.target],
          affectedEdgeIds: [edge.id!],
          inherited: false,
          mitigations: [
            "Enforce TLS/mTLS for all external connections",
            "Implement strong authentication",
            "Validate external system certificates",
          ],
        });
      }
    }

    // ── Profile-based fallback rules for custom/non-KC nodes ──────
    // These rules use profiles instead of hardcoded categories so that
    // custom components with correct metadata get the same analysis.

    // Prompt injection: actor → any node with promptInjectionSurface (covers custom prompt nodes)
    if (
      srcCat === "actor" &&
      tgtCat !== "kc1" &&
      tgtCat !== "kc2" &&
      tgtCat !== "kc3" &&
      tgtProfile?.promptInjectionSurface
    ) {
      threats.push({
        id: `conn-prompt-injection-custom-${edge.id}`,
        name: "Prompt Injection Vector",
        description: `User/Actor "${source.data.label}" has a direct data flow to "${target.data.label}" which accepts prompt input. This is a potential prompt injection vector.`,
        severity: "high",
        methodology: "connection",
        affectedNodeIds: [edge.source, edge.target],
        affectedEdgeIds: [edge.id!],
        inherited: false,
        mitigations: [
          "Input validation and sanitization",
          "Prompt hardening and instruction hierarchy",
          "Content security filtering",
        ],
      });
    }

    // Tool misuse: any source → custom node with execution/tool capabilities (not already kc5/kc6)
    if (
      tgtCat !== "kc5" &&
      tgtCat !== "kc6" &&
      (tgtProfile?.isExecutionCapable ||
        tgtProfile?.accessDanger === "dangerous" ||
        tgtProfile?.accessDanger === "critical") &&
      (srcCat === "kc1" ||
        srcCat === "kc2" ||
        srcProfile?.promptInjectionSurface ||
        srcCat === "custom")
    ) {
      const danger = tgtProfile?.accessDanger ?? "guarded";
      let severity: "critical" | "high" | "medium" | "low" = "high";
      const mitigations = [
        "Tool sandboxing and isolation",
        "Permission boundaries per tool",
        "Human-in-the-loop for destructive actions",
      ];
      if (danger === "critical" || danger === "dangerous") {
        severity = "critical";
        mitigations.push("Mandatory approval workflow for critical tool actions");
      }
      const riskLabel = tgtProfile?.toolRiskTier ? ` (risk: ${tgtProfile.toolRiskTier})` : "";
      const accessLabel = tgtProfile?.toolAccessMode ? ` [${tgtProfile.toolAccessMode}]` : "";

      threats.push({
        id: `conn-tool-misuse-custom-${edge.id}`,
        name: "Tool Misuse via Agent",
        description: `"${source.data.label}" sends commands to "${target.data.label}"${riskLabel}${accessLabel}. A compromised agent could misuse tool capabilities.`,
        severity,
        methodology: "connection",
        affectedNodeIds: [edge.source, edge.target],
        affectedEdgeIds: [edge.id!],
        inherited: false,
        mitigations,
      });

      if (tgtProfile?.isExecutionCapable) {
        threats.push({
          id: `conn-code-exec-custom-${edge.id}`,
          name: "Arbitrary Code Execution",
          description: `"${source.data.label}" can execute code via "${target.data.label}". If the agent is compromised, arbitrary code could run on the host.`,
          severity: "critical",
          methodology: "connection",
          affectedNodeIds: [edge.source, edge.target],
          affectedEdgeIds: [edge.id!],
          inherited: false,
          mitigations: [
            "Sandbox all code execution in isolated containers",
            "Enforce strict resource limits (CPU, memory, network)",
            "Block access to host filesystem and network",
            "Code review / allow-listing for executed commands",
          ],
        });
      }
    }

    // Function call injection: any functionCallSurface → any execution-capable target (not already kc3→kc5)
    if (
      !(srcCat === "kc3" && tgtCat === "kc5") &&
      srcProfile?.functionCallSurface &&
      (tgtProfile?.isExecutionCapable || tgtProfile?.toolAccessMode)
    ) {
      threats.push({
        id: `conn-fn-call-injection-custom-${edge.id}`,
        name: "Function Call Injection",
        description: `Function Call Schema "${source.data.label}" connects to "${target.data.label}". An attacker could manipulate the function call schema to invoke unintended actions.`,
        severity: "high",
        methodology: "connection",
        affectedNodeIds: [edge.source, edge.target],
        affectedEdgeIds: [edge.id!],
        inherited: false,
        mitigations: [
          "Validate function call parameters against strict schemas",
          "Whitelist allowed function names and argument types",
          "Log and audit all function call invocations",
          "Implement rate limiting on tool invocations",
        ],
      });
    }

    // Memory poisoning: any agent/model/prompt → custom data store with dataSensitivity
    if (
      tgtCat !== "kc4" &&
      (tgtProfile?.handlesCredentials ||
        tgtProfile?.handlesPII ||
        tgtProfile?.handlesRegulatedData) &&
      (srcCat === "kc1" ||
        srcCat === "kc2" ||
        srcCat === "kc3" ||
        srcProfile?.promptInjectionSurface)
    ) {
      threats.push({
        id: `conn-data-poisoning-custom-${edge.id}`,
        name: "Sensitive Data Poisoning",
        description: `"${source.data.label}" writes to "${target.data.label}" which handles ${tgtProfile?.dataSensitivity} data. Compromised outputs could poison sensitive stored data.`,
        severity: tgtProfile?.handlesCredentials ? "critical" : "high",
        methodology: "connection",
        affectedNodeIds: [edge.source, edge.target],
        affectedEdgeIds: [edge.id!],
        inherited: false,
        mitigations: [
          "Data validation and sanitization before storage",
          "Output verification before storage",
          "Data integrity checks and checksums",
          "Access control on write operations",
        ],
      });
    }
  }
  return threats;
}

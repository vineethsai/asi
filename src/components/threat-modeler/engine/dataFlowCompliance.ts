import type { CanvasNode, CanvasEdge } from "../types";

export interface ComplianceViolation {
  id: string;
  name: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  affectedEdgeIds: string[];
  affectedNodeIds: string[];
  rule: string;
}

export function runDataFlowComplianceCheck(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
): ComplianceViolation[] {
  const violations: ComplianceViolation[] = [];
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  for (const edge of edges) {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);
    if (!source?.data || !target?.data || !edge.data) continue;

    if (edge.data.containsPII && !edge.data.encrypted) {
      violations.push({
        id: `dfc-pii-unencrypted-${edge.id}`,
        name: "PII Transmitted Without Encryption",
        description: `PII data flows between "${source.data.label}" and "${target.data.label}" without encryption.`,
        severity: "critical",
        affectedEdgeIds: [edge.id!],
        affectedNodeIds: [edge.source, edge.target],
        rule: "PII must be encrypted in transit",
      });
    }

    if (edge.data.containsPII && target.data.trustLevel === "untrusted") {
      violations.push({
        id: `dfc-pii-untrusted-${edge.id}`,
        name: "PII Flowing to Untrusted Zone",
        description: `PII data flows from "${source.data.label}" to untrusted component "${target.data.label}".`,
        severity: "critical",
        affectedEdgeIds: [edge.id!],
        affectedNodeIds: [edge.source, edge.target],
        rule: "PII must not flow to untrusted components without sanitization",
      });
    }

    if (edge.data.dataClassification === "Restricted" && !edge.data.encrypted) {
      violations.push({
        id: `dfc-restricted-unencrypted-${edge.id}`,
        name: "Restricted Data Without Encryption",
        description: `Restricted data between "${source.data.label}" and "${target.data.label}" is not encrypted.`,
        severity: "critical",
        affectedEdgeIds: [edge.id!],
        affectedNodeIds: [edge.source, edge.target],
        rule: "Restricted data must always be encrypted",
      });
    }

    if (edge.data.dataClassification === "Confidential" && edge.data.authentication === "None") {
      violations.push({
        id: `dfc-confidential-noauth-${edge.id}`,
        name: "Confidential Data Without Authentication",
        description: `Confidential data flows between "${source.data.label}" and "${target.data.label}" without authentication.`,
        severity: "high",
        affectedEdgeIds: [edge.id!],
        affectedNodeIds: [edge.source, edge.target],
        rule: "Confidential data flows must be authenticated",
      });
    }

    const sourceInBoundary =
      source.parentId && nodes.some((n) => n.id === source.parentId && n.type === "trustBoundary");
    const targetInBoundary =
      target.parentId && nodes.some((n) => n.id === target.parentId && n.type === "trustBoundary");
    if (sourceInBoundary && targetInBoundary && source.parentId !== target.parentId) {
      if (
        edge.data.dataClassification === "Restricted" ||
        edge.data.dataClassification === "Confidential"
      ) {
        if (edge.data.authentication === "None") {
          violations.push({
            id: `dfc-cross-boundary-${edge.id}`,
            name: "Sensitive Data Crossing Trust Boundaries Without Auth",
            description: `Sensitive data crosses trust boundaries between "${source.data.label}" and "${target.data.label}" without authentication.`,
            severity: "high",
            affectedEdgeIds: [edge.id!],
            affectedNodeIds: [edge.source, edge.target],
            rule: "Cross-boundary sensitive data flows must be authenticated",
          });
        }
      }
    }

    if (
      (target.data.category === "external" || source.data.category === "external") &&
      edge.data.protocol === "HTTP"
    ) {
      violations.push({
        id: `dfc-external-http-${edge.id}`,
        name: "External Connection Using HTTP",
        description: `External connection between "${source.data.label}" and "${target.data.label}" uses unencrypted HTTP.`,
        severity: "high",
        affectedEdgeIds: [edge.id!],
        affectedNodeIds: [edge.source, edge.target],
        rule: "External connections must use HTTPS or equivalent encrypted protocol",
      });
    }
  }

  return violations;
}

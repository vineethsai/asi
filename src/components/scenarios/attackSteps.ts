import { flowEntryNode, getArchitectureFlow } from "@/components/visual/architectureFlows";
import type { AttackPathStep } from "@/components/visual/attackPath";
import type { Scenario } from "@/data/scenarios";

/** Scenario steps → player steps (steps whose KC is not drawn stay on the previous node). */
export function toAttackPathSteps(scenario: Scenario): AttackPathStep[] {
  const flow = getArchitectureFlow(scenario.archId);
  let last =
    scenario.steps.find((s) => s.nodeId)?.nodeId ?? (flow ? flowEntryNode(flow)?.id : undefined);
  if (!last) return [];
  return scenario.steps.map((step) => {
    const nodeId = step.nodeId ?? last!;
    last = nodeId;
    return {
      nodeId,
      edgeId: step.nodeId ? step.edgeId : undefined,
      reverse: step.nodeId ? step.reverse : undefined,
      caption: step.title,
      severity: step.severity,
      affected: !!step.threatId && !!step.nodeId,
    };
  });
}

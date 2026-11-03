/**
 * "Open in Threat Modeler" deep link for a threat:
 *   /threat-modeler?template=<template id>&threat=<threat id>
 *
 * The template is the one for the architecture pattern (architecturesData) that best exhibits
 * the threat: patterns that list the threat in `threatIds` first, then the most of the threat's
 * key components (KC1–KC6) among the pattern's `keyComponents`, then the more specific pattern
 * (fewer listed threats), then catalog order. Template ids come from config/navigation.ts so this
 * module never imports the modeler bundle.
 */
import type { Threat } from "@/components/components/securityData";
import { architecturesData, type Architecture } from "@/components/components/architecturesData";
import { ARCHITECTURE_TEMPLATE } from "@/config/navigation";

const kcRoot = (id: string) => /^kc\d/.exec(id.toLowerCase())?.[0] ?? id.toLowerCase();

export interface ModelerTarget {
  href: string;
  architecture?: Architecture;
  templateId?: string;
  /** Why this template was chosen, for the button's title/tooltip. */
  reason: string;
}

export function bestArchitectureFor(threat: Threat): Architecture | undefined {
  const threatKcs = new Set(threat.componentIds.map(kcRoot));
  const scored = Object.values(architecturesData)
    .filter((a) => ARCHITECTURE_TEMPLATE[a.id])
    .map((a, order) => {
      const kcs = new Set(a.keyComponents.map(kcRoot));
      const overlap = [...threatKcs].filter((k) => kcs.has(k)).length;
      return { a, order, listed: a.threatIds.includes(threat.id), overlap };
    })
    .filter((s) => s.listed || s.overlap > 0)
    .sort(
      (x, y) =>
        Number(y.listed) - Number(x.listed) ||
        y.overlap - x.overlap ||
        x.a.threatIds.length - y.a.threatIds.length ||
        x.order - y.order,
    );
  return scored[0]?.a;
}

export function threatModelerTarget(threat: Threat): ModelerTarget {
  const architecture = bestArchitectureFor(threat);
  const templateId = architecture ? ARCHITECTURE_TEMPLATE[architecture.id] : undefined;
  const params = new URLSearchParams();
  if (templateId) params.set("template", templateId);
  params.set("threat", threat.id);
  return {
    href: `/threat-modeler?${params.toString()}`,
    architecture,
    templateId,
    reason: architecture
      ? architecture.threatIds.includes(threat.id)
        ? `Opens the ${architecture.name} template, a pattern exposed to ${threat.code}.`
        : `Opens the ${architecture.name} template, which uses the components ${threat.code} affects.`
      : "Opens an empty Threat Modeler canvas.",
  };
}

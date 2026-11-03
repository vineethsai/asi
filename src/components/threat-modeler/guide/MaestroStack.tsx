import { useMemo, useState } from "react";
import { LayerStack, type LayerStackLayer } from "@/components/charts/LayerStack";
import type { MaestroLayerNumber } from "@/lib/palette";
import { RULES } from "../engine/catalog";
import { PALETTE_SECTIONS } from "../paletteData";
import { MAESTRO_LAYER_NAMES, MaestroLayer } from "../types";

const LAYER_SUMMARY: Record<MaestroLayer, string> = {
  [MaestroLayer.FoundationModels]: "The models themselves: weights, alignment, provenance.",
  [MaestroLayer.DataOperations]:
    "Memory, vector stores, knowledge bases and the data pipelines that feed them.",
  [MaestroLayer.AgentFrameworks]:
    "Agents, orchestrators, prompts, reasoning and tool-calling logic.",
  [MaestroLayer.DeploymentInfrastructure]:
    "Runtimes, containers, hosts and the network they sit on.",
  [MaestroLayer.EvaluationObservability]: "Monitoring, tracing, evaluation and audit logs.",
  [MaestroLayer.SecurityCompliance]:
    "Guardrails, policy engines, approval gates and trust boundaries.",
  [MaestroLayer.AgentEcosystem]: "Users, external systems, third-party agents and MCP servers.",
};

const LAYERS = [1, 2, 3, 4, 5, 6, 7] as MaestroLayer[];

/**
 * The seven CSA MAESTRO layers (A4) as a LayerStack: palette components are
 * placed on the layers they declare, and each band counts the catalog rules
 * mapped to it. Click a band to list its rules and components.
 */
export default function MaestroStack() {
  const [active, setActive] = useState<MaestroLayer | null>(null);

  const { layers, rulesByLayer, entriesByLayer } = useMemo(() => {
    const entriesByLayer = new Map<MaestroLayer, { id: string; label: string; why: string }[]>();
    const seen = new Set<string>();
    for (const s of PALETTE_SECTIONS)
      for (const e of s.entries)
        for (const l of e.data.maestroLayers ?? []) {
          const key = `${l}:${e.label}`;
          if (seen.has(key)) continue;
          seen.add(key);
          const list = entriesByLayer.get(l) ?? [];
          list.push({ id: `${l}-${e.id}`, label: e.label, why: e.why });
          entriesByLayer.set(l, list);
        }
    const rulesByLayer = new Map<MaestroLayer, { id: string; title: string }[]>();
    for (const r of RULES) {
      const l = r.maps.maestroLayer;
      if (l === undefined) continue;
      const list = rulesByLayer.get(l) ?? [];
      list.push({ id: r.id, title: r.title });
      rulesByLayer.set(l, list);
    }
    const layers: LayerStackLayer[] = LAYERS.map((l) => ({
      layer: l as MaestroLayerNumber,
      label: MAESTRO_LAYER_NAMES[l],
      description: LAYER_SUMMARY[l],
      count: rulesByLayer.get(l)?.length ?? 0,
      chips: (entriesByLayer.get(l) ?? []).map((e) => ({ id: e.id, label: e.label, title: e.why })),
    }));
    return { layers, rulesByLayer, entriesByLayer };
  }, []);

  const activeRules = active ? (rulesByLayer.get(active) ?? []) : [];
  const activeEntries = active ? (entriesByLayer.get(active) ?? []) : [];

  return (
    <div className="space-y-3">
      <LayerStack
        ariaLabel="MAESTRO layers with the modeler's components on each layer and the number of rules mapped to it"
        title="MAESTRO 7-layer stack"
        description="Chips are palette components placed on the layers they declare; the count is the number of catalog rules mapped to the layer. Select a layer for details."
        layers={layers}
        countLabel="rules"
        activeLayer={active}
        onLayerClick={(l) => setActive((cur) => (cur === l ? null : (l as MaestroLayer)))}
        maxChips={6}
      />
      <div aria-live="polite">
        {active && (
          <div className="grid gap-3 rounded-lg border bg-card p-3 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold">
                L{active} {MAESTRO_LAYER_NAMES[active]} — rules
              </p>
              {activeRules.length ? (
                <ul className="mt-1 space-y-0.5 text-xs">
                  {activeRules.map((r) => (
                    <li key={r.id}>
                      <a href={`#rule-${r.id}`} className="font-mono text-primary hover:underline">
                        {r.id}
                      </a>{" "}
                      <span className="text-muted-foreground">{r.title}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">
                  No rule is mapped to this layer.
                </p>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold">Components on this layer</p>
              <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                {activeEntries.map((e) => (
                  <li key={e.id}>
                    <span className="font-medium text-foreground">{e.label}</span> — {e.why}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

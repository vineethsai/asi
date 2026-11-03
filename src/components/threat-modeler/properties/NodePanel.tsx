/**
 * Node half of the property panel (P3-33): Identity · Trust & posture ·
 * Tool/memory/prompt metadata · Semantics · Mitigations · Threats on this node.
 * Trust boundaries get Identity, zone trust and the cross-zone flows table.
 */
import { useId, useMemo } from "react";
import {
  ArrowRight,
  Fingerprint,
  Layers,
  ListChecks,
  Shield,
  ShieldAlert,
  Sparkles,
  Wrench,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { isSecureEdge } from "../engine/graph";
import { resolveKind } from "../engine/semantics";
import { selectNodes } from "../hooks/useCanvasActions";
import { tm, useTM } from "../store";
import {
  MAESTRO_LAYER_COLORS,
  MAESTRO_LAYER_NAMES,
  MaestroLayer,
  type CanvasEdge,
  type CanvasNode,
  type CanvasNodeData,
} from "../types";
import {
  ACCESS_OPTIONS,
  PROMPT_OPTIONS,
  RISK_TIER_OPTIONS,
  SENSITIVITY_OPTIONS,
  TRUST_OPTIONS,
  TRUST_STYLES,
  categoryText,
} from "./constants";
import { DraftInput, Field, KeyValueEditor, Section, SelectField } from "./fields";
import MitigationsSection from "./MitigationsSection";
import NodeThreatsSection from "./NodeThreatsSection";
import SemanticsEditor from "./SemanticsEditor";

const LAYERS = [1, 2, 3, 4, 5, 6, 7] as MaestroLayer[];
const TOOL_KINDS = new Set(["tool", "scoped-tool", "mcp-server", "infrastructure"]);

function TrustSelect({
  id,
  value,
  disabled,
  onChange,
}: {
  id: string;
  value: CanvasNodeData["trustLevel"];
  disabled?: boolean;
  onChange: (v: CanvasNodeData["trustLevel"]) => void;
}) {
  const style = TRUST_STYLES[value] ?? TRUST_STYLES["semi-trusted"];
  return (
    <div className="flex items-stretch gap-2">
      <span
        aria-hidden
        className="w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: style.color }}
      />
      <div className="min-w-0 flex-1 space-y-1">
        <SelectField
          id={id}
          value={value}
          options={TRUST_OPTIONS}
          disabled={disabled}
          onChange={(v) => v && onChange(v)}
        />
        <p className="text-[11px] leading-snug text-muted-foreground">
          <span className="font-medium text-foreground">{style.label}:</span> {style.text}
        </p>
      </div>
    </div>
  );
}

function inside(nodeId: string, boundaryId: string, byId: Map<string, CanvasNode>): boolean {
  let cur = byId.get(nodeId)?.parentId;
  const seen = new Set<string>();
  while (cur && !seen.has(cur)) {
    if (cur === boundaryId) return true;
    seen.add(cur);
    cur = byId.get(cur)?.parentId;
  }
  return false;
}

function selectEdge(id: string) {
  selectNodes([]);
  tm().setGraph((nodes, edges) => ({
    nodes,
    edges: edges.map((e) =>
      e.id === id ? { ...e, selected: true } : e.selected ? { ...e, selected: false } : e,
    ),
  }));
  tm().setUi({ selectedEdgeId: id, selectedNodeId: null });
}

function CrossZoneFlows({
  boundary,
  nodes,
  edges,
}: {
  boundary: CanvasNode;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}) {
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const rows = edges.filter(
    (e) => inside(e.source, boundary.id, byId) !== inside(e.target, boundary.id, byId),
  );
  const children = nodes.filter((n) => inside(n.id, boundary.id, byId)).length;
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] text-muted-foreground">
        {children} component{children === 1 ? "" : "s"} inside · {rows.length} flow
        {rows.length === 1 ? "" : "s"} cross this zone
      </p>
      {rows.length > 0 && (
        <table className="w-full text-[11px]">
          <caption className="sr-only">Flows crossing {boundary.data.label}</caption>
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="py-0.5 font-medium">Flow</th>
              <th className="py-0.5 font-medium">Dir.</th>
              <th className="py-0.5 font-medium">Posture</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => {
              const inbound = inside(e.target, boundary.id, byId);
              const secure = isSecureEdge(e.data);
              return (
                <tr key={e.id} className="border-t align-top">
                  <td className="py-1 pr-1">
                    <button
                      type="button"
                      onClick={() => selectEdge(e.id)}
                      className="text-left hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {byId.get(e.source)?.data.label ?? e.source}
                      <ArrowRight className="mx-0.5 inline h-3 w-3" aria-label="to" />
                      {byId.get(e.target)?.data.label ?? e.target}
                    </button>
                    <span className="block text-muted-foreground">{e.data?.label}</span>
                  </td>
                  <td className="py-1 pr-1">{inbound ? "In" : "Out"}</td>
                  <td className="py-1">
                    <span
                      className={cn(
                        "inline-flex items-center gap-0.5",
                        !secure &&
                          "text-[hsl(var(--security-high-fg,20_91%_33%))] dark:text-[hsl(var(--security-high-fg,31_97%_72%))]",
                      )}
                    >
                      {!secure && <ShieldAlert className="h-3 w-3" aria-hidden />}
                      {e.data?.encrypted ? "encrypted" : "unencrypted"} ·{" "}
                      {e.data?.authentication || "None"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function NodePanel({
  node,
  variant,
}: {
  node: CanvasNode;
  variant: "pane" | "sheet";
}) {
  const uid = useId();
  const readonly = useTM((s) => s.persist === "readonly");
  const nodes = useTM((s) => s.document.nodes);
  const edges = useTM((s) => s.document.edges);
  const analysis = useTM((s) => s.analysis);
  const d = node.data;
  const id = node.id;
  const update = (patch: Partial<CanvasNodeData>, label?: string) =>
    tm().updateNodeData(id, patch, label);
  const kind = resolveKind(node);
  const isBoundary = node.type === "trustBoundary";

  const others = useMemo(
    () =>
      nodes
        .filter((n) => n.id !== id && n.type !== "trustBoundary")
        .map((n) => ({ id: n.id, label: n.data.label || n.id })),
    [nodes, id],
  );

  const threatMitigations = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of analysis?.threats ?? [])
      if (t.affectedNodeIds.includes(id))
        for (const mid of t.mitigationIds ?? []) m.set(mid, (m.get(mid) ?? 0) + 1);
    return m;
  }, [analysis, id]);
  const threatCount = useMemo(
    () => (analysis?.threats ?? []).filter((t) => t.affectedNodeIds.includes(id)).length,
    [analysis, id],
  );

  const identity = (
    <Section
      id="identity"
      title="Identity"
      icon={<Fingerprint className="h-3.5 w-3.5" aria-hidden />}
    >
      <Field label="Name" htmlFor={`${uid}-label`}>
        <DraftInput
          id={`${uid}-label`}
          value={d.label}
          disabled={readonly}
          onCommit={(label) => label.trim() && update({ label: label.trim() }, "Rename component")}
        />
      </Field>
      <Field label="Description" htmlFor={`${uid}-desc`}>
        <DraftInput
          id={`${uid}-desc`}
          multiline
          value={d.description ?? ""}
          disabled={readonly}
          onCommit={(description) =>
            update({ description: description || undefined }, "Edit description")
          }
        />
      </Field>
      {!isBoundary && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11px]">
          <dt className="text-muted-foreground">Category</dt>
          <dd>{categoryText(d.category)}</dd>
          {d.componentId && (
            <>
              <dt className="text-muted-foreground">Component id</dt>
              <dd className="font-mono">{d.componentId}</dd>
            </>
          )}
          <dt className="text-muted-foreground">Node id</dt>
          <dd className="truncate font-mono" title={id}>
            {id}
          </dd>
        </dl>
      )}
      {!isBoundary && (
        <fieldset className="space-y-1">
          <legend className="text-[11px] font-medium text-muted-foreground">MAESTRO layers</legend>
          <div className="grid grid-cols-1 gap-1">
            {LAYERS.map((layer) => {
              const lid = `${uid}-layer-${layer}`;
              const on = d.maestroLayers?.includes(layer) ?? false;
              return (
                <div key={layer} className="flex items-center gap-2">
                  <Checkbox
                    id={lid}
                    checked={on}
                    disabled={readonly}
                    onCheckedChange={(c) =>
                      update(
                        {
                          maestroLayers: (c
                            ? [...(d.maestroLayers ?? []), layer]
                            : (d.maestroLayers ?? []).filter((l) => l !== layer)
                          ).sort((a, b) => a - b),
                        },
                        "Edit MAESTRO layers",
                      )
                    }
                  />
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: MAESTRO_LAYER_COLORS[layer] }}
                  />
                  <Label htmlFor={lid} className="text-xs font-normal">
                    L{layer} · {MAESTRO_LAYER_NAMES[layer]}
                  </Label>
                </div>
              );
            })}
          </div>
        </fieldset>
      )}
    </Section>
  );

  if (isBoundary)
    return (
      <>
        {identity}
        <Section id="zone" title="Zone trust" icon={<Shield className="h-3.5 w-3.5" aria-hidden />}>
          <Field label="Trust level of this zone" htmlFor={`${uid}-zone`}>
            <TrustSelect
              id={`${uid}-zone`}
              value={d.trustLevel}
              disabled={readonly}
              onChange={(trustLevel) => update({ trustLevel }, "Change zone trust")}
            />
          </Field>
        </Section>
        <Section
          id="crosszone"
          title="Cross-zone flows"
          icon={<ArrowRight className="h-3.5 w-3.5" aria-hidden />}
        >
          <CrossZoneFlows boundary={node} nodes={nodes} edges={edges} />
        </Section>
      </>
    );

  const showTool =
    TOOL_KINDS.has(kind) || d.category === "kc5" || !!d.toolAccessMode || !!d.toolRiskTier;
  const showPrompt = d.category === "kc3" || kind === "reasoning" || !!d.promptType;
  const hidden = ["postureUnverified"];

  return (
    <>
      {identity}
      <Section
        id="trust"
        title="Trust & posture"
        icon={<Shield className="h-3.5 w-3.5" aria-hidden />}
      >
        <Field label="Trust level" htmlFor={`${uid}-trust`}>
          <TrustSelect
            id={`${uid}-trust`}
            value={d.trustLevel}
            disabled={readonly}
            onChange={(trustLevel) => update({ trustLevel }, "Change trust level")}
          />
        </Field>
        <Field
          label="Data sensitivity"
          htmlFor={`${uid}-sens`}
          hint="Data held or processed here; raises the impact of threats that reach it."
        >
          <SelectField
            id={`${uid}-sens`}
            value={d.dataSensitivity}
            options={SENSITIVITY_OPTIONS}
            allowNone
            disabled={readonly}
            onChange={(dataSensitivity) => update({ dataSensitivity }, "Change data sensitivity")}
          />
        </Field>
      </Section>

      <Section
        id="metadata"
        title="Tool / memory / prompt metadata"
        icon={<Wrench className="h-3.5 w-3.5" aria-hidden />}
        defaultOpen={showTool || showPrompt}
      >
        {showTool && (
          <div className="grid grid-cols-2 gap-2">
            <Field label="Access mode" htmlFor={`${uid}-access`}>
              <SelectField
                id={`${uid}-access`}
                value={d.toolAccessMode}
                options={ACCESS_OPTIONS}
                allowNone
                disabled={readonly}
                onChange={(toolAccessMode) => update({ toolAccessMode }, "Change access mode")}
              />
            </Field>
            <Field label="Risk tier" htmlFor={`${uid}-tier`}>
              <SelectField
                id={`${uid}-tier`}
                value={d.toolRiskTier}
                options={RISK_TIER_OPTIONS}
                allowNone
                disabled={readonly}
                onChange={(toolRiskTier) => update({ toolRiskTier }, "Change risk tier")}
              />
            </Field>
          </div>
        )}
        {showPrompt && (
          <Field label="Prompt type" htmlFor={`${uid}-prompt`}>
            <SelectField
              id={`${uid}-prompt`}
              value={d.promptType}
              options={PROMPT_OPTIONS}
              allowNone
              disabled={readonly}
              onChange={(promptType) => update({ promptType }, "Change prompt type")}
            />
          </Field>
        )}
        {kind === "memory" && (
          <p className="text-[11px] text-muted-foreground">
            Memory kind, retention, isolation and write access are set in Semantics below.
          </p>
        )}
        <Field label="Custom metadata">
          <KeyValueEditor
            value={d.customMetadata ?? {}}
            hiddenKeys={hidden}
            disabled={readonly}
            onChange={(customMetadata) => update({ customMetadata }, "Edit metadata")}
          />
        </Field>
      </Section>

      <Section
        id="semantics"
        title="Semantics"
        icon={<Sparkles className="h-3.5 w-3.5" aria-hidden />}
        defaultOpen={false}
      >
        <SemanticsEditor
          node={node}
          others={others}
          disabled={readonly}
          onChange={(semantics) => {
            if (semantics) update({ semantics }, "Edit semantics");
            else
              tm().commit(
                (doc) => ({
                  ...doc,
                  nodes: doc.nodes.map((n) => {
                    if (n.id !== id) return n;
                    const data = { ...n.data };
                    delete data.semantics;
                    return { ...n, data };
                  }),
                }),
                "Reset semantics",
              );
          }}
        />
      </Section>

      <Section
        id="mitigations"
        title="Mitigations"
        icon={<ListChecks className="h-3.5 w-3.5" aria-hidden />}
        count={threatMitigations.size || undefined}
      >
        <MitigationsSection nodeId={id} threatMitigations={threatMitigations} disabled={readonly} />
      </Section>

      <Section
        id="threats"
        title="Threats on this component"
        icon={<Layers className="h-3.5 w-3.5" aria-hidden />}
        count={analysis ? threatCount : undefined}
      >
        <NodeThreatsSection nodeId={id} variant={variant} />
      </Section>
    </>
  );
}

/**
 * Semantics editor (§7.6 / P3-33): edits `data.semantics` — the agentic
 * meaning the engine reads (gates, scopes, MCP/A2A posture, memory isolation,
 * delegation, observability coverage, provenance). When a node has no
 * explicit semantics the inferred kind (engine/semantics.ts) is shown.
 */
import { useId } from "react";
import { resolveKind } from "../engine/semantics";
import type {
  CanvasNode,
  GuardrailCoverage,
  NodeSemantics,
  ProvenanceInfo,
  SemanticKind,
} from "../types";
import { KIND_LABEL, KIND_OPTIONS, semanticsForKind } from "./constants";
import { DraftInput, Field, ListInput, NodeMultiSelect, SelectField, SwitchField } from "./fields";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type NodeOption = { id: string; label: string };

const PROVENANCE_KINDS = new Set<SemanticKind>([
  "model",
  "training-pipeline",
  "agent",
  "orchestrator",
  "tool",
  "scoped-tool",
  "infrastructure",
  "custom",
]);

const COVERAGE: { value: GuardrailCoverage; label: string }[] = [
  { value: "input", label: "Input" },
  { value: "output", label: "Output" },
  { value: "tool-call", label: "Tool calls" },
];

function ProvenanceFields({
  value,
  onChange,
  disabled,
  label = "Provenance",
}: {
  value: ProvenanceInfo | undefined;
  onChange: (p: ProvenanceInfo) => void;
  disabled?: boolean;
  label?: string;
}) {
  const p = value ?? { signed: false, pinned: false };
  return (
    <div className="space-y-2 rounded-md border p-2">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <SwitchField
        label="Signed artefact"
        checked={p.signed}
        disabled={disabled}
        onChange={(signed) => onChange({ ...p, signed })}
      />
      <SwitchField
        label="Pinned version"
        checked={p.pinned}
        disabled={disabled}
        onChange={(pinned) => onChange({ ...p, pinned })}
      />
    </div>
  );
}

export default function SemanticsEditor({
  node,
  others,
  disabled,
  onChange,
}: {
  node: CanvasNode;
  /** Other components (for protects / write access / coverage lists). */
  others: NodeOption[];
  disabled?: boolean;
  /** `undefined` = reset to the inferred kind (removes data.semantics). */
  onChange: (semantics: NodeSemantics | undefined) => void;
}) {
  const uid = useId();
  const sem = node.data.semantics;
  const inferred = resolveKind({ ...node, data: { ...node.data, semantics: undefined } });
  const kind = sem?.kind ?? inferred;
  const effect = KIND_OPTIONS.find((k) => k.value === kind)?.effect;
  const base = sem ?? semanticsForKind(kind);
  const set = (patch: Partial<NodeSemantics>) => onChange({ ...base, ...patch, kind });

  return (
    <div className="space-y-3">
      <Field
        label="Semantic kind"
        htmlFor={`${uid}-kind`}
        hint={
          <>
            {sem ? (
              <span>Explicit. </span>
            ) : (
              <span>Inferred from the KC category ({KIND_LABEL[inferred] ?? inferred}). </span>
            )}
            {effect}
          </>
        }
      >
        <div className="flex items-center gap-2">
          <SelectField<SemanticKind>
            id={`${uid}-kind`}
            value={kind}
            options={KIND_OPTIONS}
            disabled={disabled}
            onChange={(v) => v && onChange(semanticsForKind(v, sem))}
          />
          {sem && !disabled && (
            <button
              type="button"
              onClick={() => onChange(undefined)}
              className="shrink-0 rounded border px-2 py-1 text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              Reset to inferred
            </button>
          )}
        </div>
      </Field>

      {kind === "guardrail" && (
        <fieldset className="space-y-1">
          <legend className="text-[11px] font-medium text-muted-foreground">Coverage</legend>
          <div className="flex flex-wrap gap-3">
            {COVERAGE.map((c) => {
              const cov = base.guardrail?.coverage ?? ["input", "output"];
              const id = `${uid}-cov-${c.value}`;
              return (
                <div key={c.value} className="flex items-center gap-1.5">
                  <Checkbox
                    id={id}
                    checked={cov.includes(c.value)}
                    disabled={disabled}
                    onCheckedChange={(on) =>
                      set({
                        guardrail: {
                          coverage: on ? [...cov, c.value] : cov.filter((x) => x !== c.value),
                        },
                      })
                    }
                  />
                  <Label htmlFor={id} className="text-xs font-normal">
                    {c.label}
                  </Label>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Lowers prompt-injection / goal-hijack likelihood on paths through this node for the
            covered traffic.
          </p>
        </fieldset>
      )}

      {kind === "hitl-gate" && (
        <NodeMultiSelect
          label="Protects (empty = every downstream tool)"
          options={others}
          value={base.hitl?.protects ?? []}
          disabled={disabled}
          onChange={(protects) => set({ hitl: { protects } })}
        />
      )}

      {(kind === "tool" || kind === "scoped-tool") && (
        <>
          <Field label="Permission scopes" htmlFor={`${uid}-scopes`}>
            <ListInput
              id={`${uid}-scopes`}
              value={base.tool?.scopes ?? []}
              disabled={disabled}
              placeholder="read:tickets, write:comments"
              onChange={(scopes) => set({ tool: { ...(base.tool ?? { scopes: [] }), scopes } })}
            />
          </Field>
          <Field label="Rate limit (calls / minute)" htmlFor={`${uid}-rate`}>
            <DraftInput
              id={`${uid}-rate`}
              type="number"
              value={base.tool?.rateLimit !== undefined ? String(base.tool.rateLimit) : ""}
              disabled={disabled}
              placeholder="unlimited"
              onCommit={(v) => {
                const n = Number(v);
                const tool = { ...(base.tool ?? { scopes: [] }) };
                if (v.trim() === "" || !Number.isFinite(n) || n < 0) delete tool.rateLimit;
                else tool.rateLimit = Math.round(n);
                set({ tool });
              }}
            />
          </Field>
          <Field label="Allow-list (operations / targets)" htmlFor={`${uid}-allow`}>
            <ListInput
              id={`${uid}-allow`}
              value={base.tool?.allowList ?? []}
              disabled={disabled}
              placeholder="api.example.com, /tickets/*"
              onChange={(allowList) =>
                set({ tool: { ...(base.tool ?? { scopes: [] }), allowList } })
              }
            />
          </Field>
        </>
      )}

      {kind === "mcp-server" && base.mcp && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Transport" htmlFor={`${uid}-transport`}>
              <SelectField
                id={`${uid}-transport`}
                value={base.mcp.transport}
                disabled={disabled}
                options={[
                  { value: "stdio", label: "stdio" },
                  { value: "http", label: "HTTP" },
                  { value: "sse", label: "SSE" },
                  { value: "websocket", label: "WebSocket" },
                ]}
                onChange={(transport) => transport && set({ mcp: { ...base.mcp!, transport } })}
              />
            </Field>
            <Field label="Auth" htmlFor={`${uid}-mcpauth`}>
              <SelectField
                id={`${uid}-mcpauth`}
                value={base.mcp.auth}
                disabled={disabled}
                options={[
                  { value: "none", label: "None" },
                  { value: "api-key", label: "API key" },
                  { value: "oauth2", label: "OAuth 2" },
                  { value: "mtls", label: "mTLS" },
                ]}
                onChange={(auth) => auth && set({ mcp: { ...base.mcp!, auth } })}
              />
            </Field>
          </div>
          <Field label="Tools exposed" htmlFor={`${uid}-tools`}>
            <ListInput
              id={`${uid}-tools`}
              value={base.mcp.toolsExposed}
              disabled={disabled}
              placeholder="read_file, run_tests"
              onChange={(toolsExposed) => set({ mcp: { ...base.mcp!, toolsExposed } })}
            />
          </Field>
          <ProvenanceFields
            label="Server provenance"
            value={base.mcp.provenance}
            disabled={disabled}
            onChange={(provenance) => set({ mcp: { ...base.mcp!, provenance } })}
          />
        </>
      )}

      {kind === "a2a-peer" && base.a2a && (
        <div className="space-y-2">
          <SwitchField
            label="Mutual authentication"
            checked={base.a2a.mutualAuth}
            disabled={disabled}
            onChange={(mutualAuth) => set({ a2a: { ...base.a2a!, mutualAuth } })}
          />
          <SwitchField
            label="Message signing"
            checked={base.a2a.messageSigning}
            disabled={disabled}
            onChange={(messageSigning) => set({ a2a: { ...base.a2a!, messageSigning } })}
          />
          <SwitchField
            label="Schema validation"
            checked={base.a2a.schemaValidation}
            disabled={disabled}
            onChange={(schemaValidation) => set({ a2a: { ...base.a2a!, schemaValidation } })}
          />
        </div>
      )}

      {kind === "memory" && base.memory && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Memory kind" htmlFor={`${uid}-memkind`}>
              <SelectField
                id={`${uid}-memkind`}
                value={base.memory.kind}
                disabled={disabled}
                options={[
                  { value: "episodic", label: "Episodic" },
                  { value: "semantic", label: "Semantic" },
                  { value: "vector", label: "Vector" },
                  { value: "shared", label: "Shared" },
                  { value: "session", label: "Session" },
                ]}
                onChange={(k) => k && set({ memory: { ...base.memory!, kind: k } })}
              />
            </Field>
            <Field label="Retention" htmlFor={`${uid}-retention`}>
              <SelectField
                id={`${uid}-retention`}
                value={base.memory.retention}
                disabled={disabled}
                allowNone
                options={[
                  { value: "session", label: "Session" },
                  { value: "days", label: "Days" },
                  { value: "months", label: "Months" },
                  { value: "indefinite", label: "Indefinite" },
                ]}
                onChange={(retention) => {
                  const memory = { ...base.memory! };
                  if (retention) memory.retention = retention;
                  else delete memory.retention;
                  set({ memory });
                }}
              />
            </Field>
          </div>
          <SwitchField
            label="Per-user isolation"
            hint="Each user only reads and writes their own entries."
            checked={base.memory.perUserIsolation}
            disabled={disabled}
            onChange={(perUserIsolation) => set({ memory: { ...base.memory!, perUserIsolation } })}
          />
          <NodeMultiSelect
            label="Write access (empty = only declared flows write)"
            options={others}
            value={base.memory.writeAccess}
            disabled={disabled}
            onChange={(writeAccess) => set({ memory: { ...base.memory!, writeAccess } })}
          />
        </>
      )}

      {kind === "identity" && base.identity && (
        <div className="space-y-2">
          <SwitchField
            label="Delegation (acts on a user's behalf)"
            checked={base.identity.delegation}
            disabled={disabled}
            onChange={(delegation) => set({ identity: { ...base.identity!, delegation } })}
          />
          <SwitchField
            label="Scope narrowing on delegation"
            hint="Delegated tokens are down-scoped to the task."
            checked={base.identity.scopeNarrowing}
            disabled={disabled}
            onChange={(scopeNarrowing) => set({ identity: { ...base.identity!, scopeNarrowing } })}
          />
        </div>
      )}

      {kind === "observability" && base.observability && (
        <>
          <NodeMultiSelect
            label="Covers (agents / tools traced)"
            options={others}
            value={base.observability.covers}
            disabled={disabled}
            onChange={(covers) => set({ observability: { ...base.observability!, covers } })}
          />
          <SwitchField
            label="Immutable / tamper-evident logs"
            checked={!!base.observability.immutable}
            disabled={disabled}
            onChange={(immutable) => set({ observability: { ...base.observability!, immutable } })}
          />
        </>
      )}

      {PROVENANCE_KINDS.has(kind) && (
        <ProvenanceFields
          value={base.provenance}
          disabled={disabled}
          onChange={(provenance) => set({ provenance })}
        />
      )}
    </div>
  );
}

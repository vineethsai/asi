/**
 * Edge half of the property panel (P3-33). Edits are held in a draft and
 * committed once with Apply (one undo step); Cancel reverts. Fields the user
 * has not touched keep tracking the document, so undo elsewhere shows through.
 */
import { useId, useMemo, useState, type KeyboardEvent } from "react";
import {
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  Layers,
  Lock,
  Settings2,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { crossesBoundary, isSecureEdge } from "../engine/graph";
import { tm, useTM } from "../store";
import type { CanvasEdge, DataFlowMetadata } from "../types";
import { AUTH_OPTIONS, CLASSIFICATION_OPTIONS, PROTOCOL_OPTIONS } from "./constants";
import { Field, KeyValueEditor, Section, SelectField, SwitchField, type Option } from "./fields";
import NodeThreatsSection from "./NodeThreatsSection";

type Fields = Pick<
  DataFlowMetadata,
  | "label"
  | "protocol"
  | "encrypted"
  | "authentication"
  | "dataClassification"
  | "containsPII"
  | "bidirectional"
  | "customMetadata"
>;
const KEYS: (keyof Fields)[] = [
  "label",
  "protocol",
  "encrypted",
  "authentication",
  "dataClassification",
  "containsPII",
  "bidirectional",
  "customMetadata",
];
const UNVERIFIED = "postureUnverified";

function baseOf(edge: CanvasEdge): Fields {
  const d = edge.data;
  return {
    label: d?.label ?? "",
    protocol: d?.protocol ?? "",
    encrypted: !!d?.encrypted,
    authentication: d?.authentication ?? "",
    dataClassification: d?.dataClassification ?? "Internal",
    containsPII: !!d?.containsPII,
    bidirectional: !!d?.bidirectional,
    customMetadata: d?.customMetadata ?? {},
  };
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Keep an imported/custom value selectable even when it is not in the preset list. */
function withCurrent(options: Option<string>[], value: string): Option<string>[] {
  return !value || options.some((o) => o.value === value)
    ? options
    : [{ value, label: value }, ...options];
}

export default function EdgePanel({
  edge,
  variant,
}: {
  edge: CanvasEdge;
  variant: "pane" | "sheet";
}) {
  const uid = useId();
  const readonly = useTM((s) => s.persist === "readonly");
  const nodes = useTM((s) => s.document.nodes);
  const [draft, setDraft] = useState<Partial<Fields>>({});

  const base = baseOf(edge);
  const value: Fields = { ...base, ...draft };
  const set = <K extends keyof Fields>(k: K, v: Fields[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const changed = KEYS.filter((k) => k in draft && !same(draft[k], base[k]));
  const dirty = changed.length > 0;
  const unverified = base.customMetadata[UNVERIFIED] === "true";

  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const source = byId.get(edge.source)?.data.label ?? edge.source;
  const target = byId.get(edge.target)?.data.label ?? edge.target;
  const crosses = useMemo(() => crossesBoundary(edge, byId), [edge, byId]);
  const insecure = !isSecureEdge(value);

  const apply = () => {
    if (readonly || (!dirty && !unverified)) return;
    const patch: Partial<Fields> = {};
    for (const k of changed) Object.assign(patch, { [k]: value[k] });
    if (unverified || "customMetadata" in patch) {
      const meta = { ...value.customMetadata };
      delete meta[UNVERIFIED];
      patch.customMetadata = meta;
    }
    if (typeof patch.label === "string") patch.label = patch.label.trim();
    tm().updateEdgeData(
      edge.id,
      patch,
      unverified && !dirty ? "Confirm flow posture" : "Edit data flow",
    );
    setDraft({});
  };
  const cancel = () => setDraft({});

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === "Enter") {
      e.preventDefault();
      apply();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  };
  const customProtocol =
    value.protocol === "Custom" || !PROTOCOL_OPTIONS.some((o) => o.value === value.protocol);
  const customAuth = value.authentication === "Custom";

  return (
    <>
      <div className="space-y-2 border-b px-3 py-2">
        <p className="flex flex-wrap items-center gap-1 text-xs">
          <span className="font-medium">{source}</span>
          {value.bidirectional ? (
            <ArrowLeftRight
              className="h-3.5 w-3.5 text-muted-foreground"
              aria-label="both ways with"
            />
          ) : (
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" aria-label="to" />
          )}
          <span className="font-medium">{target}</span>
        </p>
        <div className="flex flex-wrap gap-1 text-[11px]">
          {crosses && (
            <span className="rounded bg-muted px-1.5 py-0.5">Crosses a trust boundary</span>
          )}
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded px-1.5 py-0.5",
              insecure
                ? "bg-[hsl(var(--security-high,25_95%_53%)/0.12)] text-[hsl(var(--security-high-fg,20_91%_33%))] dark:text-[hsl(var(--security-high-fg,31_97%_72%))]"
                : "bg-[hsl(var(--security-low,142_71%_45%)/0.12)] text-[hsl(var(--security-low-fg,142_72%_25%))] dark:text-[hsl(var(--security-low-fg,142_69%_68%))]",
            )}
          >
            <Lock className="h-3 w-3" aria-hidden />
            {insecure ? "Not fully secured" : "Encrypted and authenticated"}
          </span>
        </div>
        {unverified && (
          <div
            role="status"
            className="flex items-start gap-2 rounded-md border border-[hsl(var(--security-medium,38_92%_50%)/0.5)] bg-[hsl(var(--security-medium,38_92%_50%)/0.1)] px-2 py-1.5 text-[11px]"
          >
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>
              <span className="font-medium">Posture imported, not verified.</span> Check encryption
              and authentication, then {dirty ? "Apply" : "Confirm"} to clear this warning.
            </span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="h-7 px-2 text-xs"
            disabled={readonly || (!dirty && !unverified)}
            onClick={apply}
          >
            {unverified && !dirty ? "Confirm posture" : "Apply"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs"
            disabled={!dirty}
            onClick={cancel}
          >
            Cancel
          </Button>
          <span aria-live="polite" className="text-[11px] text-muted-foreground">
            {dirty && (
              <span className="inline-flex items-center gap-1">
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--security-medium,38_92%_50%))]"
                />
                {changed.length} unsaved change{changed.length === 1 ? "" : "s"}
              </span>
            )}
          </span>
        </div>
      </div>

      <Section id="flow" title="Data flow" icon={<Workflow className="h-3.5 w-3.5" aria-hidden />}>
        <Field label="Label" htmlFor={`${uid}-label`}>
          <Input
            id={`${uid}-label`}
            value={value.label}
            disabled={readonly}
            onChange={(e) => set("label", e.target.value)}
            onKeyDown={onKeyDown}
            className="h-8 text-xs"
          />
        </Field>
        <Field label="Protocol" htmlFor={`${uid}-proto`}>
          <SelectField
            id={`${uid}-proto`}
            value={value.protocol || undefined}
            options={withCurrent(PROTOCOL_OPTIONS, value.protocol)}
            allowNone
            disabled={readonly}
            onChange={(v) => set("protocol", v ?? "")}
          />
        </Field>
        {customProtocol && value.protocol !== "" && (
          <Field label="Protocol name" htmlFor={`${uid}-proto-custom`}>
            <Input
              id={`${uid}-proto-custom`}
              value={value.protocol === "Custom" ? "" : value.protocol}
              placeholder="e.g. AMQP"
              disabled={readonly}
              onChange={(e) => set("protocol", e.target.value || "Custom")}
              onKeyDown={onKeyDown}
              className="h-8 text-xs"
            />
          </Field>
        )}
        <SwitchField
          label="Bidirectional"
          checked={value.bidirectional}
          disabled={readonly}
          onChange={(v) => set("bidirectional", v)}
          hint="Data and influence travel both ways."
        />
      </Section>

      <Section
        id="posture"
        title="Security posture"
        icon={<Lock className="h-3.5 w-3.5" aria-hidden />}
      >
        <SwitchField
          label="Encrypted in transit"
          checked={value.encrypted}
          disabled={readonly}
          onChange={(v) => set("encrypted", v)}
        />
        <Field label="Authentication" htmlFor={`${uid}-auth`}>
          <SelectField
            id={`${uid}-auth`}
            value={value.authentication || undefined}
            options={withCurrent(AUTH_OPTIONS, value.authentication)}
            allowNone
            noneLabel="Not set"
            disabled={readonly}
            onChange={(v) => set("authentication", v ?? "")}
          />
        </Field>
        {customAuth && (
          <p className="text-[11px] text-muted-foreground">
            Describe the custom scheme in Metadata below.
          </p>
        )}
        <Field
          label="Data classification"
          htmlFor={`${uid}-class`}
          hint="The most sensitive data this flow carries."
        >
          <SelectField
            id={`${uid}-class`}
            value={value.dataClassification}
            options={CLASSIFICATION_OPTIONS}
            disabled={readonly}
            onChange={(v) => v && set("dataClassification", v)}
          />
        </Field>
        <SwitchField
          label="Contains personal data (PII)"
          checked={value.containsPII}
          disabled={readonly}
          onChange={(v) => set("containsPII", v)}
        />
      </Section>

      <Section
        id="edge-meta"
        title="Metadata"
        icon={<Settings2 className="h-3.5 w-3.5" aria-hidden />}
        defaultOpen={false}
      >
        <KeyValueEditor
          value={value.customMetadata}
          hiddenKeys={[UNVERIFIED]}
          disabled={readonly}
          onChange={(m) => set("customMetadata", m)}
        />
      </Section>

      <Section
        id="edge-threats"
        title="Threats on this flow"
        icon={<Layers className="h-3.5 w-3.5" aria-hidden />}
      >
        <NodeThreatsSection edgeId={edge.id} variant={variant} />
      </Section>
    </>
  );
}

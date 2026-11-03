/**
 * One threat (P3-35 explainability): rule id, matched evidence, path,
 * severity factors, confidence, mappings, mitigations, status workflow and
 * "Not applicable here" feedback (recorded as a suppression in the document).
 */
import { memo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight, Crosshair, ListChecks, Ban, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { tm } from "../store";
import { getMitigation } from "../engine/catalog";
import { resolveKind } from "../engine/semantics";
import { MAESTRO_LAYER_NAMES, type GeneratedThreat } from "../types";
import { STRIDE_NAMES } from "../export/geometry";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../ui/DropdownMenu";
import { StatusEditor } from "./StatusEditor";
import { CONFIDENCE_LABEL, residualText, threatConfidence, threatDomId } from "./helpers";
import { Chip, SevChip, StatusPill } from "./shared";

export interface ThreatCardProps {
  threat: GeneratedThreat;
  expanded: boolean;
  onToggle: (id: string) => void;
  checked: boolean;
  onCheckedChange: (id: string, checked: boolean) => void;
  highlighted: boolean;
  labels: Map<string, string>;
  unverified: Set<string>;
  readOnly: boolean;
  onFocusThreat: (t: GeneratedThreat) => void;
  /** Number of inherited copies of this threat (rendered collapsed under it). */
  inheritedCount?: number;
  /** The inherited copies, rendered by the list when `inheritedOpen`. */
  inheritedSlot?: ReactNode;
  inheritedOpen?: boolean;
  onToggleInherited?: (id: string) => void;
  /** Rendered as a nested inherited row. */
  nested?: boolean;
}

const kindLabel = (k: string) => k.replace(/-/g, " ");

function NotApplicableMenu({
  threat,
  labels,
}: {
  threat: GeneratedThreat;
  labels: Map<string, string>;
}) {
  const [pending, setPending] = useState<null | {
    componentKey?: string;
    componentKind?: string;
    text: string;
  }>(null);
  const [reason, setReason] = useState("");
  const focusId = threat.focusNodeId ?? threat.affectedNodeIds[0];
  const focus = focusId ? tm().document.nodes.find((n) => n.id === focusId) : undefined;
  const kind = focus ? resolveKind(focus) : undefined;
  const ruleId = threat.ruleId;
  if (!ruleId) return null;
  const component = focusId ? (labels.get(focusId) ?? focusId) : "this model";

  if (pending) {
    return (
      <form
        className="mt-2 space-y-1.5 rounded-md border border-dashed p-2"
        onSubmit={(e) => {
          e.preventDefault();
          tm().suppress({
            ruleId,
            ...(pending.componentKey ? { componentKey: pending.componentKey } : {}),
            ...(pending.componentKind ? { componentKind: pending.componentKind as never } : {}),
            ...(reason.trim() ? { reason: reason.trim() } : {}),
          });
          setPending(null);
        }}
      >
        <label htmlFor={`na-${threatDomId(threat.id)}`} className="block text-[11px] font-medium">
          Why does {ruleId} not apply {pending.text}? (optional)
        </label>
        <input
          id={`na-${threatDomId(threat.id)}`}
          autoFocus
          className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. tool is only reachable from a batch job"
        />
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setPending(null)}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" className="h-7 text-xs">
            Mark not applicable
          </Button>
        </div>
      </form>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
          <Ban className="h-3.5 w-3.5" aria-hidden />
          Not applicable here
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Suppress {ruleId}</DropdownMenuLabel>
        <DropdownMenuItem
          onSelect={() =>
            setPending({ componentKey: threat.componentKey, text: `to ${component}` })
          }
        >
          For {component} only
        </DropdownMenuItem>
        {kind && kind !== "custom" && (
          <DropdownMenuItem
            onSelect={() =>
              setPending({ componentKind: kind, text: `to any ${kindLabel(kind)} component` })
            }
          >
            For every {kindLabel(kind)} component
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Body({
  threat: t,
  labels,
  unverified,
  readOnly,
}: Pick<ThreatCardProps, "threat" | "labels" | "unverified" | "readOnly">) {
  const [editing, setEditing] = useState(false);
  const conf = threatConfidence(t, unverified);
  const L = (id: string) => labels.get(id) ?? id;
  const implemented = new Set(t.implementedMitigationIds ?? []);
  const focusId = t.focusNodeId ?? t.affectedNodeIds[0];
  return (
    <div className="space-y-2.5 border-t px-3 pb-3 pt-2 text-xs">
      <p className="text-muted-foreground">{t.description}</p>

      {t.inherited && (
        <p className="rounded bg-amber-500/10 px-2 py-1 text-[11px] text-amber-800 dark:text-amber-300">
          Inherited{t.hops ? ` (${t.hops} hop${t.hops === 1 ? "" : "s"})` : ""}
          {t.propagationPath?.length ? ` via ${t.propagationPath.map(L).join(" → ")}` : ""}.
        </p>
      )}

      <section aria-label="Why it fired" className="space-y-1">
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Why it fired
        </h4>
        <p className="text-[11px]">
          Rule <span className="font-mono font-semibold">{t.why?.ruleId ?? t.ruleId}</span> · scope{" "}
          {t.scope ?? "node"}
        </p>
        {t.why?.evidence?.length ? (
          <ul className="list-disc space-y-0.5 pl-4 text-[11px]">
            {t.why.evidence.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        ) : null}
        {t.why?.path?.length ? (
          <p className="text-[11px]">
            <span className="font-medium">Path:</span> {t.why.path.map(L).join(" → ")}
          </p>
        ) : null}
        {t.why?.factors?.length ? (
          <ul className="space-y-0.5 text-[11px]" aria-label="Severity factors">
            {t.why.factors.map((f, i) => (
              <li key={i} className="flex gap-1.5">
                <span
                  className={cn(
                    "w-7 shrink-0 text-right font-mono font-semibold",
                    f.delta > 0
                      ? "text-red-700 dark:text-red-300"
                      : "text-emerald-700 dark:text-emerald-300",
                  )}
                >
                  {f.delta > 0 ? `+${f.delta}` : f.delta}
                </span>
                <span>
                  {f.kind}: {f.label}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        <p className="text-[11px]">
          <span className="font-medium">Likelihood</span> {t.likelihood ?? "–"} ×{" "}
          <span className="font-medium">impact</span> {t.impact ?? "–"} · {residualText(t)}
        </p>
        <p className="text-[11px]">
          <span className="font-medium">Confidence: {CONFIDENCE_LABEL[conf.level]}</span> —{" "}
          {conf.reason}
        </p>
      </section>

      <section aria-label="Mappings" className="flex flex-wrap gap-1">
        {(t.owaspMapping ?? []).map((m) => (
          <Chip key={m.asiId} title={`${m.asiName} (${m.confidence} confidence)`}>
            {m.asiId}
            {m.confidence !== "high" ? ` · ${m.confidence}` : ""}
          </Chip>
        ))}
        {(t.ciscoMapping ?? []).map((m) => (
          <Chip key={m.objectiveId} title={m.objectiveName}>
            {m.objectiveId}
          </Chip>
        ))}
        {(t.aisvs ?? []).map((a) => (
          <Chip key={a} title="OWASP AISVS 1.01">
            AISVS {a}
          </Chip>
        ))}
        {(t.stride ?? []).map((s) => (
          <Chip key={s} title={STRIDE_NAMES[s]}>
            {s}
          </Chip>
        ))}
        {t.catalogThreat && (
          <Chip title="OWASP Agentic Threats & Mitigations">{t.catalogThreat.toUpperCase()}</Chip>
        )}
        {t.maestroLayer !== undefined && (
          <Chip title={MAESTRO_LAYER_NAMES[t.maestroLayer]}>L{t.maestroLayer}</Chip>
        )}
      </section>

      {(t.mitigationIds?.length ?? 0) > 0 && (
        <section aria-label="Mitigations" className="space-y-1">
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Mitigations
          </h4>
          <ul className="space-y-0.5 text-[11px]">
            {t.mitigationIds!.map((id) => {
              const m = getMitigation(id);
              const done = implemented.has(id);
              return (
                <li key={id} className="flex items-baseline gap-1.5">
                  <span aria-hidden className={done ? "text-emerald-600" : "text-muted-foreground"}>
                    {done ? "✓" : "○"}
                  </span>
                  <span className={done ? "font-medium" : undefined}>{m?.name ?? id}</span>
                  <span className="text-muted-foreground">
                    {done ? "implemented" : "not implemented"}
                    {m ? ` · −${Math.round(m.effectiveness * 100)}%` : ""}
                  </span>
                </li>
              );
            })}
          </ul>
          {focusId && (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-[11px]"
              onClick={() =>
                tm().setUi({ selectedNodeId: focusId, selectedEdgeId: null, sheet: null })
              }
            >
              Edit mitigations on {L(focusId)}
            </Button>
          )}
        </section>
      )}

      <section aria-label="Status" className="space-y-1">
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <StatusPill threat={t} />
          {t.owner && <span>Owner: {t.owner}</span>}
          {t.due && <span>Due: {t.due}</span>}
          {t.evidenceUrl && (
            <a
              href={t.evidenceUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-0.5 text-primary hover:underline"
            >
              Evidence <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          )}
          {t.statusJustification && (
            <span className="w-full text-muted-foreground">“{t.statusJustification}”</span>
          )}
        </div>
        {editing ? (
          <StatusEditor threat={t} onDone={() => setEditing(false)} disabled={readOnly} />
        ) : null}
      </section>

      <div className="flex flex-wrap gap-1.5">
        {!readOnly && !editing && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => setEditing(true)}
          >
            <ListChecks className="h-3.5 w-3.5" aria-hidden />
            Set status
          </Button>
        )}
        {!readOnly && <NotApplicableMenu threat={t} labels={labels} />}
      </div>
    </div>
  );
}

function ThreatCardImpl(props: ThreatCardProps) {
  const {
    threat: t,
    expanded,
    onToggle,
    checked,
    onCheckedChange,
    highlighted,
    labels,
    readOnly,
  } = props;
  const domId = threatDomId(t.id);
  const sev = t.severity;
  const resolved =
    t.status === "mitigated" ||
    t.status === "false-positive" ||
    t.status === "accepted" ||
    t.status === "transferred" ||
    t.mitigationState === "mitigated";
  const focusId = t.focusNodeId ?? t.affectedNodeIds[0];
  const inheritedCount = props.inheritedCount ?? 0;
  return (
    <article
      id={domId}
      aria-labelledby={`${domId}-title`}
      className={cn(
        "rounded-md border bg-card transition-shadow",
        highlighted && "ring-2 ring-primary",
        props.nested && "border-dashed",
        resolved && "opacity-80",
      )}
    >
      <div className="flex items-start gap-2 px-2 py-2">
        <input
          type="checkbox"
          className="mt-1 h-3.5 w-3.5 shrink-0 accent-primary"
          checked={checked}
          disabled={readOnly}
          aria-label={`Select ${t.name}`}
          onChange={(e) => onCheckedChange(t.id, e.target.checked)}
        />
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={`${domId}-body`}
          onClick={() => {
            onToggle(t.id);
            props.onFocusThreat(t);
          }}
          className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        >
          <span className="flex flex-wrap items-center gap-1.5">
            <SevChip band={sev} />
            <span
              id={`${domId}-title`}
              className={cn(
                "text-xs font-semibold leading-snug",
                resolved && "line-through decoration-1",
              )}
            >
              {t.name}
            </span>
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
            <span className="font-mono">{t.ruleId ?? t.id}</span>
            {focusId && <span>· {labels.get(focusId) ?? focusId}</span>}
            <span>· {residualText(t)}</span>
            {t.inherited && <span>· inherited</span>}
          </span>
        </button>
        <span className="flex shrink-0 items-center gap-1">
          <StatusPill threat={t} />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label={`Locate ${t.name} on the canvas`}
            title="Locate on canvas"
            onClick={() => props.onFocusThreat(t)}
          >
            <Crosshair className="h-3.5 w-3.5" />
          </Button>
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
          )}
        </span>
      </div>
      <div id={`${domId}-body`} hidden={!expanded}>
        {expanded && (
          <Body threat={t} labels={labels} unverified={props.unverified} readOnly={readOnly} />
        )}
      </div>
      {inheritedCount > 0 && (
        <div className="border-t px-3 py-1.5">
          <button
            type="button"
            aria-expanded={!!props.inheritedOpen}
            aria-controls={`${domId}-inherited`}
            onClick={() => props.onToggleInherited?.(t.id)}
            className="text-[11px] font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          >
            {props.inheritedOpen
              ? `Hide ${inheritedCount} inherited`
              : `${inheritedCount} inherited hidden`}
          </button>
          <div
            id={`${domId}-inherited`}
            hidden={!props.inheritedOpen}
            className="mt-1.5 space-y-1.5"
          >
            {props.inheritedOpen && props.inheritedSlot}
          </div>
        </div>
      )}
    </article>
  );
}

export const ThreatCard = memo(ThreatCardImpl);
export default ThreatCard;

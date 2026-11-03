/**
 * Mitigations on a component (P3-33 / P3-36): catalog mitigations with the
 * status workflow (status · owner · due · justification · evidence link).
 * Writes `document.appliedMitigations[nodeId | "*"]` through the store; only
 * "implemented" reduces residual risk (engine/severity.ts `residual`).
 */
import { useId, useMemo, useState } from "react";
import { ExternalLink, Globe2, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { MITIGATIONS, getMitigation, type CatalogMitigation } from "../engine/catalog";
import { tm, useTM } from "../store";
import type { MitigationStatusEntry, MitigationStatusValue } from "../types";
import { MITIGATION_STATUS_OPTIONS } from "./constants";
import { DraftInput, Field, SelectField } from "./fields";

const EMPTY: Record<string, MitigationStatusEntry> = {};

const STATUS_STYLE: Record<MitigationStatusValue, string> = {
  "not-started": "bg-muted text-muted-foreground",
  "in-progress":
    "bg-[hsl(var(--security-info)/0.12)] text-[hsl(var(--security-info-fg,201_96%_30%))] dark:text-[hsl(var(--security-info-fg,199_95%_74%))]",
  implemented:
    "bg-[hsl(var(--security-low)/0.12)] text-[hsl(var(--security-low-fg,142_72%_25%))] dark:text-[hsl(var(--security-low-fg,142_77%_73%))]",
  "accepted-risk":
    "bg-[hsl(var(--security-medium)/0.12)] text-[hsl(var(--security-medium-fg,32_95%_29%))] dark:text-[hsl(var(--security-medium-fg,46_97%_65%))]",
};

const statusLabel = (s: MitigationStatusValue) =>
  MITIGATION_STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s;

function isUrl(v: string | undefined): boolean {
  return !!v && /^https?:\/\/\S+$/i.test(v);
}

/** Move a mitigation entry between a node and the model-wide target ("*") in one commit. */
function moveScope(nodeId: string, mitId: string, toModelWide: boolean) {
  tm().commit(
    (doc) => {
      const from = toModelWide ? nodeId : "*";
      const to = toModelWide ? "*" : nodeId;
      const entry = doc.appliedMitigations[from]?.[mitId] ?? { status: "in-progress" as const };
      const applied = { ...doc.appliedMitigations };
      const src = { ...(applied[from] ?? {}) };
      delete src[mitId];
      if (Object.keys(src).length) applied[from] = src;
      else delete applied[from];
      applied[to] = {
        ...(applied[to] ?? {}),
        [mitId]: { ...entry, updatedAt: new Date().toISOString() },
      };
      return { ...doc, appliedMitigations: applied };
    },
    toModelWide ? "Apply mitigation model-wide" : "Apply mitigation to component",
    { analysis: "rescore" },
  );
}

function MitigationRow({
  nodeId,
  m,
  entry,
  modelWide,
  threatCount,
  disabled,
}: {
  nodeId: string;
  m: CatalogMitigation;
  entry: MitigationStatusEntry | undefined;
  modelWide: boolean;
  threatCount: number;
  disabled?: boolean;
}) {
  const uid = useId();
  const status: MitigationStatusValue = entry?.status ?? "not-started";
  const [expanded, setExpanded] = useState(false);
  const [pendingAccept, setPendingAccept] = useState(false);
  const target = modelWide ? "*" : nodeId;
  const write = (patch: Partial<MitigationStatusEntry>) =>
    tm().setMitigation(target, m.id, {
      ...(entry ?? { status }),
      ...patch,
    } as MitigationStatusEntry);
  const showDetails = expanded || pendingAccept || status !== "not-started";
  const needsJustification = (pendingAccept || status === "accepted-risk") && !entry?.justification;

  return (
    <li className="rounded-md border p-2">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={showDetails}
            className="text-left text-xs font-medium leading-snug hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {m.name}
          </button>
          <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
            <span className="font-mono">{m.id}</span>
            <span aria-label={`Effectiveness ${Math.round(m.effectiveness * 100)} percent`}>
              · −{Math.round(m.effectiveness * 100)} %
            </span>
            {threatCount > 0 && (
              <span>
                · {threatCount} threat{threatCount === 1 ? "" : "s"} here
              </span>
            )}
            {m.aisvs.map((a) => (
              <span key={a} className="rounded border px-1 font-mono">
                AISVS {a}
              </span>
            ))}
            {modelWide && (
              <span className="inline-flex items-center gap-0.5 rounded border px-1">
                <Globe2 className="h-3 w-3" aria-hidden /> model-wide
              </span>
            )}
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium",
            STATUS_STYLE[status],
          )}
        >
          {statusLabel(status)}
        </span>
      </div>

      {showDetails && (
        <div className="mt-2 space-y-2">
          <p className="text-[11px] leading-snug text-muted-foreground">{m.description}</p>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Status" htmlFor={`${uid}-status`}>
              <SelectField<MitigationStatusValue>
                id={`${uid}-status`}
                value={pendingAccept ? "accepted-risk" : status}
                options={[...MITIGATION_STATUS_OPTIONS]}
                disabled={disabled}
                onChange={(v) => {
                  if (!v) return;
                  if (v === "accepted-risk" && !entry?.justification) {
                    setPendingAccept(true);
                    return;
                  }
                  setPendingAccept(false);
                  if (v === "not-started" && !entry) return;
                  write({ status: v });
                }}
              />
            </Field>
            <Field label="Owner" htmlFor={`${uid}-owner`}>
              <DraftInput
                id={`${uid}-owner`}
                value={entry?.owner ?? ""}
                disabled={disabled}
                placeholder="team or person"
                onCommit={(owner) => write({ owner: owner || undefined })}
              />
            </Field>
            <Field label="Due" htmlFor={`${uid}-due`}>
              <DraftInput
                id={`${uid}-due`}
                type="date"
                value={entry?.due ?? ""}
                disabled={disabled}
                onCommit={(due) => write({ due: due || undefined })}
              />
            </Field>
            <Field label="Evidence link" htmlFor={`${uid}-evidence`}>
              <DraftInput
                id={`${uid}-evidence`}
                type="url"
                value={entry?.evidenceUrl ?? ""}
                disabled={disabled}
                placeholder="https://…"
                onCommit={(evidenceUrl) => write({ evidenceUrl: evidenceUrl || undefined })}
              />
            </Field>
          </div>
          <Field
            label={
              needsJustification ? "Justification (required for accepted risk)" : "Justification"
            }
            htmlFor={`${uid}-just`}
            hint={
              needsJustification ? (
                <span className="text-[hsl(var(--security-critical-fg,0_74%_40%))] dark:text-[hsl(var(--security-critical-fg,0_94%_82%))]">
                  Explain why the risk is accepted; the status is saved once this is filled in.
                </span>
              ) : undefined
            }
          >
            <DraftInput
              id={`${uid}-just`}
              multiline
              value={entry?.justification ?? ""}
              disabled={disabled}
              placeholder="Why this status? (compensating controls, ticket, sign-off)"
              onCommit={(justification) => {
                const j = justification.trim();
                if (pendingAccept) {
                  if (!j) return;
                  setPendingAccept(false);
                  write({ status: "accepted-risk", justification: j });
                  return;
                }
                if (status === "accepted-risk" && !j) return; // keep the required justification
                write({ justification: j || undefined });
              }}
            />
          </Field>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Checkbox
                id={`${uid}-wide`}
                checked={modelWide}
                disabled={disabled || status === "not-started"}
                onCheckedChange={(c) => moveScope(nodeId, m.id, !!c)}
              />
              <Label htmlFor={`${uid}-wide`} className="text-[11px] font-normal">
                Apply model-wide
              </Label>
            </div>
            {isUrl(entry?.evidenceUrl) && (
              <a
                href={entry!.evidenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
              >
                Evidence <ExternalLink className="h-3 w-3" aria-hidden />
              </a>
            )}
          </div>
          {entry?.updatedAt && (
            <p className="text-[11px] text-muted-foreground">
              Updated {new Date(entry.updatedAt).toLocaleString()}
            </p>
          )}
        </div>
      )}
    </li>
  );
}

export default function MitigationsSection({
  nodeId,
  threatMitigations,
  disabled,
}: {
  nodeId: string;
  /** Mitigation id → number of this node's threats that list it. */
  threatMitigations: Map<string, number>;
  disabled?: boolean;
}) {
  const own = useTM((s) => s.document.appliedMitigations[nodeId] ?? EMPTY);
  const wide = useTM((s) => s.document.appliedMitigations["*"] ?? EMPTY);
  const [added, setAdded] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);

  const rows = useMemo(() => {
    const ids = new Set<string>([
      ...threatMitigations.keys(),
      ...Object.keys(own),
      ...Object.keys(wide),
      ...added,
    ]);
    return [...ids]
      .map((id) => getMitigation(id))
      .filter((m): m is CatalogMitigation => !!m)
      .sort(
        (a, b) =>
          (threatMitigations.get(b.id) ?? 0) - (threatMitigations.get(a.id) ?? 0) ||
          b.effectiveness - a.effectiveness ||
          a.name.localeCompare(b.name),
      );
  }, [threatMitigations, own, wide, added]);

  const shown = new Set(rows.map((r) => r.id));
  const q = query.trim().toLowerCase();
  const candidates = MITIGATIONS.filter(
    (m) =>
      !shown.has(m.id) &&
      (!q || `${m.id} ${m.name} ${m.description} ${m.aisvs.join(" ")}`.toLowerCase().includes(q)),
  ).slice(0, 8);
  const implemented = rows.filter(
    (m) => (own[m.id] ?? wide[m.id])?.status === "implemented",
  ).length;

  return (
    <div className="space-y-2">
      <p className="text-[11px] leading-snug text-muted-foreground">
        Only <strong className="font-semibold text-foreground">Implemented</strong> reduces residual
        risk; in-progress and accepted-risk are tracked but do not count. {implemented} of{" "}
        {rows.length} implemented.
      </p>
      {rows.length === 0 && (
        <p className="text-[11px] text-muted-foreground">
          Run the analysis to see the mitigations that address this component's threats, or add one
          from the catalog.
        </p>
      )}
      <ul className="space-y-1.5">
        {rows.map((m) => (
          <MitigationRow
            key={m.id}
            nodeId={nodeId}
            m={m}
            entry={own[m.id] ?? wide[m.id]}
            modelWide={!own[m.id] && !!wide[m.id]}
            threatCount={threatMitigations.get(m.id) ?? 0}
            disabled={disabled}
          />
        ))}
      </ul>
      {!disabled &&
        (adding ? (
          <div className="space-y-1.5 rounded-md border p-2">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Escape") setAdding(false);
                }}
                placeholder="Search the mitigation catalog"
                aria-label="Search the mitigation catalog"
                className="h-8 pl-7 text-xs"
              />
            </div>
            <ul className="max-h-48 space-y-0.5 overflow-y-auto">
              {candidates.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setAdded((a) => [...a, m.id]);
                      setQuery("");
                      setAdding(false);
                    }}
                    className="flex w-full items-start gap-2 rounded px-1.5 py-1 text-left hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Plus className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span className="min-w-0">
                      <span className="block text-xs">{m.name}</span>
                      <span className="block text-[11px] text-muted-foreground">
                        {m.id} · −{Math.round(m.effectiveness * 100)} %
                      </span>
                    </span>
                  </button>
                </li>
              ))}
              {candidates.length === 0 && (
                <li className="px-1.5 py-1 text-[11px] text-muted-foreground">No matches.</li>
              )}
            </ul>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 rounded border px-2 py-1 text-[11px] hover:bg-accent"
          >
            <Plus className="h-3 w-3" aria-hidden /> Add mitigation
          </button>
        ))}
    </div>
  );
}

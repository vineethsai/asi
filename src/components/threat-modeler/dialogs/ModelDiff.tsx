import { useMemo, useState } from "react";
import { ArrowRight, GitCompare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { severityLabel, severityToken } from "@/lib/severity";
import { cn } from "@/lib/utils";
import { documentToAnalysisInput, type ThreatModelDocument } from "../document";
import {
  analyzeThreatModel,
  summariseForNextRun,
  type AnalysisResult,
  type ChangeSummary,
} from "../engine/analyze";
import type { SavedModelEntry } from "../persistence";
import { tm } from "../store";
import type { GeneratedThreat, Severity } from "../types";

export interface Snapshot {
  key: string;
  label: string;
  document: () => ThreatModelDocument;
}

/** "Current canvas" plus every saved version, newest first per model. */
function snapshotsFor(models: SavedModelEntry[]): Snapshot[] {
  const out: Snapshot[] = [
    { key: "current", label: "Current canvas", document: () => tm().document },
  ];
  for (const m of models)
    for (const v of [...m.versions].reverse())
      out.push({
        key: `${m.id}::${v.id}`,
        label: `${m.name} — ${v.label} (${new Date(v.savedAt).toLocaleString()})`,
        document: () => v.document,
      });
  return out;
}

function SevText({ s }: { s: Severity }) {
  return <span className={cn("font-medium", severityToken(s).fg)}>{severityLabel(s)}</span>;
}

interface DiffResult {
  a: AnalysisResult;
  b: AnalysisResult;
  change: ChangeSummary;
  labelA: string;
  labelB: string;
  docA: ThreatModelDocument;
  docB: ThreatModelDocument;
}

function describe(t: GeneratedThreat | undefined, doc: ThreatModelDocument, id: string): string {
  if (!t) return id;
  const nodeId = t.focusNodeId ?? t.affectedNodeIds[0];
  const label = nodeId ? doc.nodes.find((n) => n.id === nodeId)?.data.label : undefined;
  return label ? `${t.name} — ${label}` : t.name;
}

/** Versions & diff (P3-23): threats added / resolved / severity-changed between two snapshots. */
export default function ModelDiff({ models }: { models: SavedModelEntry[] }) {
  const snapshots = useMemo(() => snapshotsFor(models), [models]);
  const [keyA, setKeyA] = useState<string>(() => snapshots[1]?.key ?? "current");
  const [keyB, setKeyB] = useState<string>("current");
  const [result, setResult] = useState<DiffResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const compare = () => {
    const a = snapshots.find((s) => s.key === keyA);
    const b = snapshots.find((s) => s.key === keyB);
    if (!a || !b) return;
    try {
      const docA = a.document();
      const docB = b.document();
      const ra = analyzeThreatModel(documentToAnalysisInput(docA));
      const rb = analyzeThreatModel({
        ...documentToAnalysisInput(docB),
        previous: summariseForNextRun(ra),
      });
      setError(null);
      setResult({
        a: ra,
        b: rb,
        change: rb.changeSummary ?? {
          added: [],
          resolved: [],
          severityChanged: [],
          scoreDelta: null,
        },
        labelA: a.label,
        labelB: b.label,
        docA,
        docB,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setResult(null);
    }
  };

  const byIdA = useMemo(() => new Map(result?.a.threats.map((t) => [t.id, t]) ?? []), [result]);
  const byIdB = useMemo(() => new Map(result?.b.threats.map((t) => [t.id, t]) ?? []), [result]);

  return (
    <div className="space-y-3">
      {snapshots.length < 2 ? (
        <p className="text-xs text-muted-foreground">
          Save the model (or a version of it) first; then compare any two snapshots, including the
          current canvas.
        </p>
      ) : (
        <div className="grid grid-cols-1 items-end gap-2 sm:grid-cols-[1fr_auto_1fr_auto]">
          <div className="space-y-1">
            <Label htmlFor="tm-diff-a" className="text-xs">
              Baseline (A)
            </Label>
            <Select value={keyA} onValueChange={setKeyA}>
              <SelectTrigger id="tm-diff-a" className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {snapshots.map((s) => (
                  <SelectItem key={s.key} value={s.key} className="text-xs">
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ArrowRight
            className="mx-auto hidden h-4 w-4 text-muted-foreground sm:mb-2 sm:block"
            aria-hidden
          />
          <div className="space-y-1">
            <Label htmlFor="tm-diff-b" className="text-xs">
              Compared (B)
            </Label>
            <Select value={keyB} onValueChange={setKeyB}>
              <SelectTrigger id="tm-diff-b" className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {snapshots.map((s) => (
                  <SelectItem key={s.key} value={s.key} className="text-xs">
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" onClick={compare} disabled={keyA === keyB} className="gap-1">
            <GitCompare className="h-3.5 w-3.5" aria-hidden />
            Compare
          </Button>
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs text-destructive">
          Comparison failed: {error}
        </p>
      )}

      {result && (
        <div className="space-y-3" aria-live="polite">
          <div className="flex flex-wrap items-center gap-3 rounded-md border bg-muted/30 p-3 text-xs">
            <span>
              Model score{" "}
              <strong>
                {result.a.modelScore.overall} ({result.a.modelScore.label})
              </strong>{" "}
              →{" "}
              <strong>
                {result.b.modelScore.overall} ({result.b.modelScore.label})
              </strong>
              {result.change.scoreDelta !== null && result.change.scoreDelta !== 0 && (
                <span
                  className={
                    result.change.scoreDelta < 0
                      ? " text-emerald-700 dark:text-emerald-400"
                      : " text-red-700 dark:text-red-400"
                  }
                >
                  {" "}
                  ({result.change.scoreDelta > 0 ? "+" : ""}
                  {result.change.scoreDelta})
                </span>
              )}
            </span>
            <span className="text-muted-foreground">
              {result.a.summary.total} → {result.b.summary.total} threats
            </span>
            <span className="ml-auto rounded border px-1.5 py-0.5 text-[11px] text-muted-foreground">
              Indicative — derived from the diagrams
            </span>
          </div>

          <DiffList
            title={`Added in B (${result.change.added.length})`}
            empty="No new threats."
            items={result.change.added.map((id) => ({
              id,
              text: describe(byIdB.get(id), result.docB, id),
              sev: byIdB.get(id)?.severity,
            }))}
          />
          <DiffList
            title={`Resolved in B (${result.change.resolved.length})`}
            empty="Nothing resolved."
            items={result.change.resolved.map((id) => ({
              id,
              text: describe(byIdA.get(id), result.docA, id),
              sev: byIdA.get(id)?.severity,
            }))}
          />
          <section aria-labelledby="tm-diff-sev">
            <h4 id="tm-diff-sev" className="mb-1 text-xs font-semibold">
              Severity changed ({result.change.severityChanged.length})
            </h4>
            {result.change.severityChanged.length === 0 ? (
              <p className="text-xs text-muted-foreground">No severity changes.</p>
            ) : (
              <ul className="divide-y rounded-md border text-xs">
                {result.change.severityChanged.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center gap-2 px-3 py-1.5">
                    <span className="min-w-0 flex-1 truncate">
                      {describe(byIdB.get(c.id), result.docB, c.id)}
                    </span>
                    <SevText s={c.from} /> <ArrowRight className="h-3 w-3" aria-label="to" />{" "}
                    <SevText s={c.to} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function DiffList({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: { id: string; text: string; sev?: Severity }[];
}) {
  return (
    <section>
      <h4 className="mb-1 text-xs font-semibold">{title}</h4>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">{empty}</p>
      ) : (
        <ul className="max-h-48 divide-y overflow-y-auto rounded-md border text-xs">
          {items.map((i) => (
            <li key={i.id} className="flex items-center gap-2 px-3 py-1.5">
              <span className="min-w-0 flex-1 truncate" title={i.id}>
                {i.text}
              </span>
              {i.sev && <SevText s={i.sev} />}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * Compliance tab (P3-34/36): architecture checks, AISVS chapters, data-flow
 * violations and AIUC-1. Everything here is indicative — derived from the
 * diagram only — and "not assessable" / "not applicable" never count as gaps.
 */
import { useMemo, useState, type ReactNode } from "react";
import { Crosshair, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AnalysisResult } from "../engine/analyze";
import type { ComplianceCheckResult, Verdict } from "../engine/compliance";
import type { Aiuc1RequirementStatus } from "../engine/aiuc1Compliance";
import { useCanvasActions } from "../hooks/useCanvasActions";
import { tm } from "../store";
import { threatDomId } from "./helpers";
import { Chip, Disclosure, SevChip, VerdictChip } from "./shared";

const VERDICT_RANK: Record<Verdict, number> = { gap: 0, partial: 1, met: 2, "not-applicable": 3 };
const SUBJECT_TEXT = { ok: "OK", partial: "Partial", missing: "Missing" } as const;
type VerdictFilter = "all" | Verdict;

/** Node ids for a mix of node and edge ids (edges resolve to their endpoints). */
function nodeIdsFor(ids: string[]): string[] {
  const { nodes, edges } = tm().document;
  const nodeSet = new Set(nodes.map((n) => n.id));
  const out = new Set<string>();
  for (const id of ids) {
    if (nodeSet.has(id)) out.add(id);
    const e = edges.find((x) => x.id === id);
    if (e) {
      out.add(e.source);
      out.add(e.target);
    }
  }
  return [...out];
}

function selectThreat(id: string) {
  tm().setUi({ selectedThreatId: id, resultsTab: "threats" });
}

function ThreatLinks({ ids, names }: { ids: string[]; names: Map<string, string> }) {
  if (!ids.length) return null;
  return (
    <div>
      <p className="text-[11px] font-medium text-muted-foreground">Linked threats ({ids.length})</p>
      <ul className="mt-0.5 space-y-0.5">
        {ids.slice(0, 6).map((id) => (
          <li key={id}>
            <button
              type="button"
              className="text-left text-primary hover:underline"
              onClick={() => selectThreat(id)}
            >
              {names.get(id) ?? id}
            </button>
          </li>
        ))}
        {ids.length > 6 && (
          <li className="text-[11px] text-muted-foreground">+{ids.length - 6} more</li>
        )}
      </ul>
    </div>
  );
}

function Section({
  id,
  title,
  summary,
  defaultOpen = true,
  children,
}: {
  id: string;
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const bodyId = `tm-compliance-${id}`;
  return (
    <section aria-labelledby={`${bodyId}-h`} className="space-y-1.5">
      <h3 id={`${bodyId}-h`} className="flex items-center gap-2">
        <Disclosure
          open={open}
          onToggle={() => setOpen((o) => !o)}
          controls={bodyId}
          className="text-xs text-foreground"
        >
          {open ? "▾" : "▸"} {title}
        </Disclosure>
        {summary && <span className="text-[11px] text-muted-foreground">{summary}</span>}
      </h3>
      <div id={bodyId} hidden={!open} className="space-y-1.5">
        {open && children}
      </div>
    </section>
  );
}

function CheckCard({ check, names }: { check: ComplianceCheckResult; names: Map<string, string> }) {
  const actions = useCanvasActions();
  const [open, setOpen] = useState(false);
  const bodyId = `tm-check-${threatDomId(check.id)}`;
  const subjectIds = check.subjects.filter((s) => s.id !== "model").map((s) => s.id);
  return (
    <article className="rounded-md border bg-card p-2 text-xs">
      <div className="flex items-start gap-2">
        <VerdictChip verdict={check.verdict} />
        <div className="min-w-0 flex-1">
          <p className="font-medium leading-snug">
            <span className="mr-1 font-mono text-[11px] text-muted-foreground">{check.id}</span>
            {check.title}
          </p>
          <p className="text-[11px] text-muted-foreground">{check.description}</p>
        </div>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <Disclosure open={open} onToggle={() => setOpen((o) => !o)} controls={bodyId}>
          {open
            ? "Hide evidence"
            : `Evidence (${check.subjects.length} subject${check.subjects.length === 1 ? "" : "s"})`}
        </Disclosure>
        {subjectIds.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 gap-1 px-1.5 text-[11px]"
            onClick={() => actions.locate(nodeIdsFor(subjectIds))}
          >
            <Crosshair className="h-3 w-3" aria-hidden />
            Locate
          </Button>
        )}
      </div>
      <div id={bodyId} hidden={!open} className="mt-1.5 space-y-1.5">
        {open && (
          <>
            {check.evidence.length > 0 && (
              <ul className="list-disc space-y-0.5 pl-4">
                {check.evidence.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )}
            {check.subjects.length > 0 && (
              <ul className="space-y-0.5">
                {check.subjects.map((s) => (
                  <li key={s.id} className="flex items-baseline gap-1.5">
                    <span
                      className={cn(
                        "w-14 shrink-0 text-[11px] font-semibold",
                        s.status === "ok" && "text-emerald-700 dark:text-emerald-400",
                        s.status === "partial" && "text-amber-700 dark:text-amber-400",
                        s.status === "missing" && "text-red-700 dark:text-red-400",
                      )}
                    >
                      {SUBJECT_TEXT[s.status]}
                    </span>
                    <span className="min-w-0">
                      <span className="font-medium">{s.label}</span>
                      {s.note && <span className="text-muted-foreground"> — {s.note}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {check.verdict !== "met" && check.recommendation && (
              <p>
                <span className="font-medium">Recommendation: </span>
                {check.recommendation}
              </p>
            )}
            {(check.aisvs.length > 0 || check.aiuc1.length > 0) && (
              <div className="flex flex-wrap gap-1">
                {check.aisvs.map((c) => (
                  <Chip key={c} title="OWASP AISVS">
                    AISVS {c}
                  </Chip>
                ))}
                {check.aiuc1.map((c) => (
                  <Chip key={c} title="AIUC-1 requirement">
                    AIUC-1 {c}
                  </Chip>
                ))}
              </div>
            )}
            <ThreatLinks ids={check.linkedThreats} names={names} />
          </>
        )}
      </div>
    </article>
  );
}

function RequirementRow({ r, names }: { r: Aiuc1RequirementStatus; names: Map<string, string> }) {
  const [open, setOpen] = useState(false);
  const bodyId = `tm-aiuc-${threatDomId(r.requirementId)}`;
  const notAssessable = r.assessable === false;
  return (
    <li className="rounded border bg-card p-1.5">
      <div className="flex items-start gap-1.5">
        <VerdictChip verdict={r.status} notAssessable={notAssessable} />
        <div className="min-w-0 flex-1">
          <p className="leading-snug">
            <span className="mr-1 font-mono text-[11px] text-muted-foreground">
              {r.requirementId}
            </span>
            {r.requirementTitle}
          </p>
          <p className="text-[11px] text-muted-foreground">{r.application}</p>
        </div>
        <Disclosure open={open} onToggle={() => setOpen((o) => !o)} controls={bodyId}>
          {open ? "Less" : "Details"}
        </Disclosure>
      </div>
      <div id={bodyId} hidden={!open} className="mt-1 space-y-1 pl-1">
        {open && (
          <>
            <p>{r.recommendation}</p>
            {(r.evidence ?? []).length > 0 && (
              <ul className="list-disc space-y-0.5 pl-4 text-[11px] text-muted-foreground">
                {(r.evidence ?? []).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )}
            <ThreatLinks ids={r.relevantThreats} names={names} />
          </>
        )}
      </div>
    </li>
  );
}

function Aiuc1Section({
  analysis,
  names,
}: {
  analysis: AnalysisResult;
  names: Map<string, string>;
}) {
  const a = analysis.compliance.aiuc1;
  const principles = useMemo(() => {
    const m = new Map<string, { name: string; reqs: Aiuc1RequirementStatus[] }>();
    for (const r of a.requirements) {
      const p = m.get(r.principleId) ?? { name: r.principle, reqs: [] };
      p.reqs.push(r);
      m.set(r.principleId, p);
    }
    for (const p of m.values())
      p.reqs.sort(
        (x, y) =>
          Number(x.assessable === false) - Number(y.assessable === false) ||
          VERDICT_RANK[x.status] - VERDICT_RANK[y.status] ||
          x.requirementId.localeCompare(y.requirementId),
      );
    return [...m.entries()];
  }, [a]);
  const s = a.summary;
  return (
    <Section
      id="aiuc1"
      title={`AIUC-1${a.version ? ` ${a.version}` : ""}`}
      summary={`${a.verdictLabel} · ${a.overallScore}%`}
      defaultOpen={false}
    >
      <p className="text-[11px] text-muted-foreground">
        Mandatory: {s.mandatoryMet} met · {s.mandatoryPartial} partial · {s.mandatoryGap} gap.
        Optional: {s.optionalMet} met · {s.optionalPartial} partial · {s.optionalGap} gap.
        {(s.notAssessable ?? 0) > 0 &&
          ` ${s.notAssessable} not assessable from a diagram (need process evidence).`}
        {(s.notApplicable ?? 0) > 0 && ` ${s.notApplicable} not applicable.`} Neither counts toward
        the score.
      </p>
      {principles.map(([pid, p]) => (
        <PrincipleGroup
          key={pid}
          pid={pid}
          name={p.name}
          reqs={p.reqs}
          score={a.principleScores[pid]}
          names={names}
        />
      ))}
    </Section>
  );
}

function PrincipleGroup({
  pid,
  name,
  reqs,
  score,
  names,
}: {
  pid: string;
  name: string;
  reqs: Aiuc1RequirementStatus[];
  score?: { met: number; partial: number; gap: number; total: number; score: number };
  names: Map<string, string>;
}) {
  const [open, setOpen] = useState(false);
  const bodyId = `tm-aiuc-p-${threatDomId(pid)}`;
  return (
    <div className="rounded-md border p-1.5">
      <div className="flex items-center gap-2">
        <Disclosure
          open={open}
          onToggle={() => setOpen((o) => !o)}
          controls={bodyId}
          className="text-xs text-foreground"
        >
          {open ? "▾" : "▸"} {name}
        </Disclosure>
        <span className="ml-auto text-[11px] text-muted-foreground">
          {score && score.total
            ? `${score.score}% · ${score.met}/${score.total} met`
            : "Nothing assessable"}
        </span>
      </div>
      {score && score.total > 0 && (
        <div className="mt-1 h-1.5 overflow-hidden rounded bg-muted" aria-hidden>
          <div className="h-full bg-primary/70" style={{ width: `${score.score}%` }} />
        </div>
      )}
      <ul id={bodyId} hidden={!open} className="mt-1.5 space-y-1">
        {open && reqs.map((r) => <RequirementRow key={r.requirementId} r={r} names={names} />)}
      </ul>
    </div>
  );
}

export function ComplianceTab({ analysis }: { analysis: AnalysisResult }) {
  const actions = useCanvasActions();
  const [filter, setFilter] = useState<VerdictFilter>("all");
  const c = analysis.compliance;
  const names = useMemo(() => new Map(analysis.threats.map((t) => [t.id, t.name])), [analysis]);
  const checks = useMemo(
    () =>
      [...c.checks]
        .filter((x) => filter === "all" || x.verdict === filter)
        .sort(
          (a, b) => VERDICT_RANK[a.verdict] - VERDICT_RANK[b.verdict] || a.id.localeCompare(b.id),
        ),
    [c.checks, filter],
  );
  const counts = useMemo(() => {
    const out: Record<Verdict, number> = { met: 0, partial: 0, gap: 0, "not-applicable": 0 };
    for (const x of c.checks) out[x.verdict] += 1;
    return out;
  }, [c.checks]);
  const as = c.aisvs.summary;

  return (
    <div className="space-y-3">
      <p className="flex items-start gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-[11px] text-amber-900 dark:text-amber-200">
        <Info className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>
          <strong>Indicative — derived from the diagram only.</strong> These verdicts show what the
          architecture suggests; they are not an audit. Process and policy evidence is out of scope.
        </span>
      </p>

      <Section
        id="checks"
        title="Architecture checks"
        summary={`${counts.gap} gap · ${counts.partial} partial · ${counts.met} met`}
      >
        <div role="group" aria-label="Filter checks by verdict" className="flex flex-wrap gap-1">
          {(["all", "gap", "partial", "met", "not-applicable"] as VerdictFilter[]).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={filter === v}
              onClick={() => setFilter(v)}
              className={cn(
                "h-6 rounded border px-2 text-[11px] font-medium",
                filter === v
                  ? "border-primary bg-primary/10 text-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {v === "all"
                ? `All ${c.checks.length}`
                : v === "not-applicable"
                  ? `N/A ${counts[v]}`
                  : `${v[0].toUpperCase()}${v.slice(1)} ${counts[v]}`}
            </button>
          ))}
        </div>
        {checks.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">No checks with this verdict.</p>
        ) : (
          checks.map((x) => <CheckCard key={x.id} check={x} names={names} />)
        )}
      </Section>

      <Section
        id="aisvs"
        title={`OWASP AISVS ${c.aisvs.version}`}
        summary={`${as.percent}% met · ${as.gap} gap · ${as.notApplicable} n/a`}
        defaultOpen={false}
      >
        <ul className="space-y-1">
          {c.aisvs.chapters.map((ch) => (
            <li
              key={ch.code}
              className="flex items-start gap-2 rounded border bg-card p-1.5 text-xs"
            >
              <VerdictChip verdict={ch.verdict} />
              <div className="min-w-0 flex-1">
                <p className="leading-snug">
                  <span className="mr-1 font-mono text-[11px] text-muted-foreground">
                    {ch.code}
                  </span>
                  {ch.name}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {ch.checks.length ? `Checks ${ch.checks.join(", ")}` : "No architecture check"}
                  {ch.linkedThreats.length > 0 &&
                    ` · ${ch.mitigatedThreats.length}/${ch.linkedThreats.length} linked threats mitigated`}
                  {ch.requirementCount ? ` · ${ch.requirementCount} requirements` : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="dataflow"
        title="Data-flow violations"
        summary={c.dataFlow.length ? `${c.dataFlow.length} found` : "None"}
        defaultOpen={c.dataFlow.length > 0}
      >
        {c.dataFlow.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">
            No sensitive flow breaks a data-handling rule.
          </p>
        ) : (
          <ul className="space-y-1">
            {c.dataFlow.map((v) => (
              <li key={v.id} className="rounded border bg-card p-1.5 text-xs">
                <div className="flex items-start gap-2">
                  <SevChip band={v.severity} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-snug">{v.name}</p>
                    <p className="text-[11px] text-muted-foreground">{v.description}</p>
                    <p className="text-[11px] text-muted-foreground">Rule: {v.rule}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    aria-label={`Locate ${v.name} on the canvas`}
                    onClick={() =>
                      actions.locate(nodeIdsFor([...v.affectedNodeIds, ...v.affectedEdgeIds]))
                    }
                  >
                    <Crosshair className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Aiuc1Section analysis={analysis} names={names} />
    </div>
  );
}

export default ComplianceTab;

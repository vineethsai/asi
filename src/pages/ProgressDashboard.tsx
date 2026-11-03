import { useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  ClipboardCheck,
  Download,
  GraduationCap,
  ListChecks,
  RotateCcw,
  Share2,
  ShieldCheck,
  Trophy,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import PageLayout from "@/components/layout/PageLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/content/EmptyState";
import { Ring } from "@/components/charts/Ring";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useProgressShallow } from "@/hooks/useProgress";
import { useReveal } from "@/hooks/useReveal";
import { stagger } from "@/lib/motion";
import {
  PROGRESS_VERSION,
  deserializeProgress,
  useProgressStore,
  type ProgressData,
} from "@/lib/progress";
import { cn } from "@/lib/utils";
import { aisvsStats } from "@/data/aisvs";
import { learningStepPath, type LearningStepId } from "@/data/learningPath";
import { CHALLENGE_QUIZ_ID, dayKey } from "@/data/quizzes";
import {
  aisvsProgress,
  badgeStats,
  controlsProgress,
  learningProgress,
  quizRows,
} from "@/components/learn/progressStats";
import {
  BADGE_HEIGHT,
  BADGE_WIDTH,
  buildBadgeSvg,
  downloadBlob,
  svgDataUrl,
  svgToPng,
} from "@/components/learn/badge";

const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
const KNOWN_KEYS = ["aisvs", "controls", "checklist", "quizzes", "path"] as const;

function Panel({
  title,
  icon: Icon,
  href,
  hrefLabel,
  index,
  children,
}: {
  title: string;
  icon: typeof Check;
  href?: string;
  hrefLabel?: string;
  index: number;
  children: ReactNode;
}) {
  return (
    <section
      className="enter flex flex-col gap-4 rounded-xl border bg-card p-5"
      style={stagger(index)}
      aria-labelledby={`panel-${index}`}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 id={`panel-${index}`} className="flex items-center gap-2 font-semibold">
          <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
          {title}
        </h2>
        {href && (
          <Link
            to={href}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline"
          >
            {hrefLabel}
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) || d.getTime() === 0
    ? "—"
    : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

interface PendingImport {
  text: string;
  fileName: string;
  counts: Record<(typeof KNOWN_KEYS)[number], number>;
}

function countsOf(d: ProgressData): PendingImport["counts"] {
  return {
    aisvs: d.aisvs.size,
    controls: Object.values(d.controls).reduce((n, s) => n + s.size, 0),
    checklist: d.checklist.size,
    quizzes: Object.keys(d.quizzes).length,
    path: Object.values(d.path).filter(Boolean).length,
  };
}

const COUNT_LABELS: Record<(typeof KNOWN_KEYS)[number], string> = {
  aisvs: "AISVS requirements",
  controls: "control tasks",
  checklist: "checklist items",
  quizzes: "quiz scores",
  path: "learning-path steps",
};

/** Validate a progress export before asking to import it. */
function validateImport(
  text: string,
): { ok: true; data: ProgressData } | { ok: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "The file is not valid JSON." };
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, error: "Expected a progress export (a JSON object)." };
  }
  const obj = parsed as Record<string, unknown>;
  if (obj.schema !== undefined && obj.schema !== "ash-progress") {
    return { ok: false, error: `Unknown file type “${String(obj.schema)}”.` };
  }
  if (typeof obj.version === "number" && obj.version > PROGRESS_VERSION) {
    return { ok: false, error: `This export is from a newer version (${obj.version}).` };
  }
  if (!KNOWN_KEYS.some((k) => k in obj)) {
    return { ok: false, error: "No progress data found in this file." };
  }
  return { ok: true, data: deserializeProgress(parsed) };
}

function quizLink(id: string): string {
  if (id === CHALLENGE_QUIZ_ID) return `/learn#${CHALLENGE_QUIZ_ID}`;
  const step = id.replace(/^path-/, "") as LearningStepId;
  return id.startsWith("path-") ? learningStepPath(step) : "/learn";
}

export default function ProgressDashboard() {
  const data = useProgressShallow((s) => ({
    version: s.version,
    aisvs: s.aisvs,
    controls: s.controls,
    checklist: s.checklist,
    quizzes: s.quizzes,
    path: s.path,
  }));
  const exportJSON = useProgressStore((s) => s.exportJSON);
  const importJSON = useProgressStore((s) => s.importJSON);
  const resetAll = useProgressStore((s) => s.reset);

  const aisvs = useMemo(() => aisvsProgress(data.aisvs), [data.aisvs]);
  const controls = useMemo(() => controlsProgress(data.controls), [data.controls]);
  const path = useMemo(() => learningProgress(data.path), [data.path]);
  const quizzes = useMemo(() => quizRows(data.quizzes), [data.quizzes]);
  const badge = useMemo(() => badgeStats(data as ProgressData), [data]);
  const badgeSvg = useMemo(() => buildBadgeSvg(badge), [badge]);

  const fileRef = useRef<HTMLInputElement | null>(null);
  const [pending, setPending] = useState<PendingImport | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [busy, setBusy] = useState(false);
  const { ref } = useReveal<HTMLDivElement>();

  const canShareFiles =
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    typeof File !== "undefined";

  const onExport = () => {
    const blob = new Blob([exportJSON()], { type: "application/json" });
    downloadBlob(blob, `agentic-security-progress-${dayKey()}.json`);
    toast.success("Progress exported", { description: "Import the file on another device." });
  };

  const onFile = async (file: File | undefined) => {
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) {
      toast.error("That file is too large to be a progress export.");
      return;
    }
    const text = await file.text();
    const res = validateImport(text);
    if ("error" in res) {
      toast.error("Could not import", { description: res.error });
      return;
    }
    setPending({ text, fileName: file.name, counts: countsOf(res.data) });
  };

  const confirmImport = (mode: "replace" | "merge") => {
    if (!pending) return;
    const res = importJSON(pending.text, mode);
    setPending(null);
    if ("error" in res) toast.error("Could not import", { description: res.error });
    else toast.success(mode === "merge" ? "Progress merged" : "Progress imported");
  };

  const badgePng = () => svgToPng(badgeSvg, BADGE_WIDTH, BADGE_HEIGHT);

  const onDownloadBadge = async () => {
    setBusy(true);
    try {
      downloadBlob(await badgePng(), `agentic-security-badge-${dayKey()}.png`);
    } catch (err) {
      toast.error("Could not create the badge", { description: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const onShareBadge = async () => {
    setBusy(true);
    try {
      const file = new File([await badgePng()], "agentic-security-badge.png", {
        type: "image/png",
      });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "My agentic security progress" });
      } else {
        downloadBlob(file, file.name);
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        toast.error("Could not share the badge", { description: (err as Error).message });
      }
    } finally {
      setBusy(false);
    }
  };

  const current = countsOf(data as ProgressData);
  const badgeAlt = `Progress badge: AISVS ${badge.aisvs.percent}%, controls ${badge.controls.percent}%, learning path ${badge.path.done} of ${badge.path.total} steps, ${badge.quizzes.done} of ${badge.quizzes.total} quizzes passed.`;

  return (
    <PageLayout
      title="Your progress"
      description="Your AISVS verification, control tasks, checklist, learning path and quiz scores — stored in this browser."
      canonicalPath="/progress"
      noindex
      className="space-y-10"
    >
      <PageHeader
        eyebrow="Your progress"
        title="Your progress"
        description="Everything here is stored only in this browser. Export it to keep a backup or move to another device."
        stats={[
          { label: "AISVS checked", value: aisvs.overall.done },
          { label: "controls started", value: controls.started },
          { label: "steps done", value: path.completed },
          { label: "quizzes taken", value: quizzes.length },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onExport}>
              <Download aria-hidden="true" />
              Export
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
            >
              <Upload aria-hidden="true" />
              Import
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmReset(true)}>
              <RotateCcw aria-hidden="true" />
              Reset
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(e) => void onFile(e.target.files?.[0])}
            />
          </div>
        }
      />

      <div ref={ref} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Panel
          title={`AISVS ${aisvsStats.version}`}
          icon={ClipboardCheck}
          href="/aisvs"
          hrefLabel="Open AISVS"
          index={0}
        >
          <div className="flex items-center gap-5">
            <Ring
              value={aisvs.overall.done}
              max={aisvs.overall.total}
              size={96}
              thickness={9}
              tone="progress"
              ariaLabel={`AISVS: ${aisvs.overall.done} of ${aisvs.overall.total} requirements checked`}
            />
            <p className="text-sm text-muted-foreground">
              <span className="text-2xl font-semibold tabular-nums text-foreground">
                {aisvs.overall.done}
              </span>{" "}
              of {aisvs.overall.total} requirements verified.
            </p>
          </div>
          <ul className="grid grid-cols-3 gap-2" aria-label="By level">
            {aisvs.byLevel.map((l) => (
              <li key={l.level} className="flex flex-col items-center gap-1 rounded-lg border p-2">
                <Ring
                  value={l.done}
                  max={l.total}
                  size={56}
                  thickness={6}
                  tone="progress"
                  ariaLabel={`Level ${l.level}: ${l.done} of ${l.total}`}
                />
                <span className="text-xs font-medium">Level {l.level}</span>
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  {l.done}/{l.total}
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          title="Controls"
          icon={ShieldCheck}
          href="/controls"
          hrefLabel="Open controls"
          index={1}
        >
          <div className="flex items-center gap-5">
            <Ring
              value={controls.tasks.done}
              max={controls.tasks.total}
              size={96}
              thickness={9}
              tone="progress"
              ariaLabel={`Control tasks: ${controls.tasks.done} of ${controls.tasks.total} done`}
            />
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <dt className="text-muted-foreground">Started</dt>
              <dd className="font-semibold tabular-nums">
                {controls.started} / {controls.total}
              </dd>
              <dt className="text-muted-foreground">Completed</dt>
              <dd className="font-semibold tabular-nums">
                {controls.completed} / {controls.total}
              </dd>
              <dt className="text-muted-foreground">Tasks</dt>
              <dd className="font-semibold tabular-nums">
                {controls.tasks.done} / {controls.tasks.total}
              </dd>
            </dl>
          </div>
          {controls.rows.length > 0 ? (
            <ul className="space-y-2" aria-label="Controls in progress">
              {controls.rows.slice(0, 5).map((r) => (
                <li key={r.id}>
                  <Link
                    to={`/controls/${r.id}`}
                    className="block rounded-md text-sm outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="flex justify-between gap-2">
                      <span className="truncate">
                        <span className="font-mono text-xs text-muted-foreground">
                          {r.id.toUpperCase()}
                        </span>{" "}
                        {r.name}
                      </span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {r.done}/{r.total}
                      </span>
                    </span>
                    <span
                      className="mt-1 block h-1.5 overflow-hidden rounded-full bg-muted"
                      aria-hidden="true"
                    >
                      <span
                        className="block h-full rounded-full bg-primary transition-[width] duration-500"
                        style={{
                          width: `${r.total ? Math.min(100, (r.done / r.total) * 100) : 0}%`,
                        }}
                      />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Tick implementation tasks on any control page to track them here.
            </p>
          )}
        </Panel>

        <Panel
          title="Learning path"
          icon={GraduationCap}
          href="/learn"
          hrefLabel="Open the path"
          index={2}
        >
          <div className="flex items-center gap-5">
            <Ring
              value={path.completed}
              max={path.total}
              size={96}
              thickness={9}
              tone="progress"
              format={(v, m) => `${v}/${m}`}
              ariaLabel={`Learning path: ${path.completed} of ${path.total} steps complete`}
            />
            <p className="text-sm text-muted-foreground">
              {path.done
                ? "Every step is complete."
                : `Step ${path.currentStep} of ${path.total} is up next.`}
            </p>
          </div>
          <ol className="space-y-1.5 text-sm">
            {path.steps.map((s) => (
              <li key={s.id}>
                <Link
                  to={learningStepPath(s.id)}
                  className="flex items-center gap-2 rounded-md outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "inline-flex h-5 w-5 items-center justify-center rounded-full border font-mono text-[10px]",
                      s.done
                        ? "border-primary bg-primary text-primary-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {s.done ? <Check className="h-3 w-3" /> : s.number}
                  </span>
                  {s.title}
                  <span className="sr-only">{s.done ? "(complete)" : "(not complete)"}</span>
                </Link>
              </li>
            ))}
          </ol>
        </Panel>

        <Panel
          title="Quizzes"
          icon={Trophy}
          href={`/learn#${CHALLENGE_QUIZ_ID}`}
          hrefLabel="Take the challenge"
          index={3}
        >
          {quizzes.length ? (
            <table className="w-full text-sm">
              <caption className="sr-only">Best quiz scores</caption>
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th scope="col" className="pb-1 font-medium">
                    Quiz
                  </th>
                  <th scope="col" className="pb-1 text-right font-medium">
                    Best
                  </th>
                  <th scope="col" className="pb-1 text-right font-medium">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {quizzes.map((q) => (
                  <tr key={q.id} className="border-t">
                    <th scope="row" className="py-1.5 pr-2 text-left font-normal">
                      <Link to={quizLink(q.id)} className="hover:text-primary hover:underline">
                        {q.title}
                      </Link>
                    </th>
                    <td className="py-1.5 text-right tabular-nums">
                      <span className={cn(q.passed && "font-semibold text-primary")}>
                        {q.score}/{q.total}
                      </span>
                      {q.passed && <span className="sr-only"> (passed)</span>}
                    </td>
                    <td className="py-1.5 pl-2 text-right text-xs text-muted-foreground">
                      {fmtDate(q.at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState
              compact
              icon={Trophy}
              title="No quiz scores yet"
              description="Each learning-path step ends with a short quiz."
              action={{ label: "Start the path", href: "/learn" }}
            />
          )}
        </Panel>

        <Panel
          title="Security checklist"
          icon={ListChecks}
          href="/interactive"
          hrefLabel="Open checklist"
          index={4}
        >
          <p className="text-sm text-muted-foreground">
            <span className="text-2xl font-semibold tabular-nums text-foreground">
              {data.checklist.size}
            </span>{" "}
            checklist item{data.checklist.size === 1 ? "" : "s"} checked.
          </p>
        </Panel>
      </div>

      <section id="badge" aria-labelledby="badge-heading" className="scroll-mt-20 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="badge-heading" className="text-xl font-semibold tracking-tight">
              Share my badge
            </h2>
            <p className="text-sm text-muted-foreground">
              A {BADGE_WIDTH}×{BADGE_HEIGHT} image of your progress, made in your browser — nothing
              is uploaded.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => void onDownloadBadge()} disabled={busy}>
              <Download aria-hidden="true" />
              Download PNG
            </Button>
            {canShareFiles && (
              <Button
                type="button"
                variant="outline"
                onClick={() => void onShareBadge()}
                disabled={busy}
              >
                <Share2 aria-hidden="true" />
                Share…
              </Button>
            )}
          </div>
        </div>
        <img
          src={svgDataUrl(badgeSvg)}
          alt={badgeAlt}
          width={BADGE_WIDTH}
          height={BADGE_HEIGHT}
          className="h-auto w-full max-w-3xl rounded-xl border"
        />
      </section>

      <Dialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import progress?</DialogTitle>
            <DialogDescription>
              {pending?.fileName} contains the data below. Replace overwrites what is in this
              browser; merge keeps both.
            </DialogDescription>
          </DialogHeader>
          {pending && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th scope="col" className="pb-1 font-medium">
                    Data
                  </th>
                  <th scope="col" className="pb-1 text-right font-medium">
                    In file
                  </th>
                  <th scope="col" className="pb-1 text-right font-medium">
                    Current
                  </th>
                </tr>
              </thead>
              <tbody>
                {KNOWN_KEYS.map((k) => (
                  <tr key={k} className="border-t">
                    <th scope="row" className="py-1 text-left font-normal">
                      {COUNT_LABELS[k]}
                    </th>
                    <td className="py-1 text-right tabular-nums">{pending.counts[k]}</td>
                    <td className="py-1 text-right tabular-nums text-muted-foreground">
                      {current[k]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" onClick={() => setPending(null)}>
              Cancel
            </Button>
            <Button type="button" variant="outline" onClick={() => confirmImport("merge")}>
              Merge
            </Button>
            <Button type="button" variant="destructive" onClick={() => confirmImport("replace")}>
              Replace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmReset} onOpenChange={setConfirmReset}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset all progress?</DialogTitle>
            <DialogDescription>
              This clears AISVS checks, control tasks, the checklist, quiz scores and learning-path
              steps in this browser. Export first if you want a backup.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                resetAll();
                setConfirmReset(false);
                toast.success("Progress reset");
              }}
            >
              Reset everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}

import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { BookOpen, Check, CircleDashed, Eye, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/layout/PageLayout";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useCommandPalette } from "@/components/layout/commandPaletteContext";
import ThreatModelCanvas from "@/components/threat-modeler/ThreatModelCanvas";
import { tm, useTM, type BootstrapResult } from "@/components/threat-modeler/store";
import type { AnalysisResult } from "@/components/threat-modeler/engine/analyze";

/** Highest-risk generated threat for a `?threat=` id (catalog id like "t3", or a threat id). */
function threatFor(analysis: AnalysisResult, param: string): string | undefined {
  const p = param.toLowerCase();
  return analysis.threats
    .filter(
      (t) =>
        t.id === param || t.catalogThreat?.toLowerCase() === p || t.threatId?.toLowerCase() === p,
    )
    .sort((a, b) => (b.residualScore ?? b.score ?? 0) - (a.residualScore ?? a.score ?? 0))[0]?.id;
}

const handled = new WeakSet<BootstrapResult>();

/** Toasts, auto-analysis and `?threat=` pre-highlight after a bootstrap (P3-24). */
function afterBootstrap(r: BootstrapResult) {
  if (r.source === "kept" || handled.has(r)) return;
  handled.add(r);
  if (r.error) toast.error(r.error);
  if (r.source === "template")
    toast.success(`Loaded the ${r.templateName} template`, {
      description: "Your own canvas is kept until you edit this one.",
    });
  if (r.source !== "template" && r.source !== "shared" && !r.threatId) return;
  if (!tm().document.nodes.length) return;
  void tm()
    .analyze()
    .then((a) => {
      if (!a || !r.threatId) return;
      const id = threatFor(a, r.threatId);
      if (id) tm().setUi({ selectedThreatId: id, resultsTab: "threats", resultsOpen: true });
      else toast.info(`No threat in this model maps to ${r.threatId.toUpperCase()}.`);
    });
}

function ModelName() {
  const name = useTM((s) => s.document.name);
  const readOnly = useTM((s) => s.persist === "readonly");
  const [draft, setDraft] = useState(name);
  const editing = useRef(false);
  useEffect(() => {
    if (!editing.current) setDraft(name);
  }, [name]);
  const commit = () => {
    editing.current = false;
    const next = draft.trim() || "Untitled model";
    setDraft(next);
    if (next !== name) tm().setDocumentMeta({ name: next });
  };
  return (
    <input
      aria-label="Model name"
      value={draft}
      readOnly={readOnly}
      onFocus={() => (editing.current = true)}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          setDraft(name);
          editing.current = false;
          e.currentTarget.blur();
        }
      }}
      className="h-8 w-full min-w-0 max-w-[18rem] truncate rounded-md border border-transparent bg-transparent px-2 text-sm font-medium hover:border-input focus:border-input focus:outline-none focus:ring-2 focus:ring-ring read-only:hover:border-transparent"
    />
  );
}

function SaveState() {
  const persist = useTM((s) => s.persist);
  const savedAt = useTM((s) => s.lastSavedAt);
  if (persist === "readonly")
    return (
      <span className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
        <Eye className="h-3.5 w-3.5" aria-hidden /> Read-only
      </span>
    );
  if (persist === "transient")
    return (
      <span
        className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground"
        title="Nothing is saved until you edit"
      >
        <CircleDashed className="h-3.5 w-3.5" aria-hidden /> Preview
      </span>
    );
  const time = savedAt
    ? new Date(savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;
  return (
    <span
      className="hidden shrink-0 items-center gap-1 text-[11px] text-muted-foreground sm:flex"
      title="Changes are saved in this browser automatically"
    >
      <Check className="h-3.5 w-3.5" aria-hidden /> {time ? `Saved ${time}` : "Autosave on"}
    </span>
  );
}

export default function ThreatModelerPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { openPalette } = useCommandPalette();
  const persist = useTM((s) => s.persist);
  // Bootstrap before the first render so the canvas mounts with the right document.
  const [first] = useState(() => tm().bootstrap(location.search));

  useEffect(() => {
    afterBootstrap(first);
  }, [first]);

  useEffect(() => {
    afterBootstrap(tm().bootstrap(location.search));
  }, [location.search]);

  // Once a template has been edited (it now autosaves), drop the link parameters
  // so a reload restores the user's work instead of the pristine template.
  useEffect(() => {
    if (persist !== "autosave") return;
    const params = new URLSearchParams(location.search);
    if (!params.has("template") && !params.has("m") && !params.has("threat")) return;
    navigate({ pathname: location.pathname, search: "" }, { replace: true });
  }, [persist, location.pathname, location.search, navigate]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b bg-background/95 px-2 backdrop-blur-sm sm:px-3">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-1.5 rounded-md px-1 py-1 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Agentic Security Hub home"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-primary text-[10px] font-bold text-primary-foreground">
            AI
          </span>
          <span className="hidden text-sm font-bold md:inline">Threat Modeler</span>
        </Link>
        <span aria-hidden className="hidden text-muted-foreground md:inline">
          /
        </span>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <ModelName />
          <SaveState />
        </div>
        <nav aria-label="Modeler links" className="flex shrink-0 items-center gap-0.5">
          <Button asChild variant="ghost" size="sm" className="h-8 gap-1.5 px-2 text-xs">
            <Link to="/threat-modeler-guide">
              <BookOpen className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Guide</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 px-2 text-xs"
            onClick={() => openPalette()}
            aria-label="Search the site"
          >
            <Search className="h-4 w-4" aria-hidden />
            <span className="hidden lg:inline">Search</span>
          </Button>
          <ThemeToggle className="h-8 w-8" />
        </nav>
      </header>
      <PageLayout
        title="Threat Modeler"
        description="Model an agentic AI system on a canvas and get MAESTRO and OWASP Agentic threats, attack paths, AISVS coverage and mitigations, all in your browser."
        canonicalPath="/threat-modeler"
        wide
        noFooter
        className="flex h-[calc(100dvh-3rem)] min-h-0 flex-none flex-col overflow-hidden"
      >
        <h1 className="sr-only">Threat Modeler</h1>
        <ThreatModelCanvas />
      </PageLayout>
    </div>
  );
}

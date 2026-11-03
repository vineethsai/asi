import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  BookOpen,
  Boxes,
  ChevronDown,
  Copy,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  FlaskConical,
  FolderOpen,
  GitCompare,
  Grid3x3,
  Image as ImageIcon,
  Keyboard,
  LayoutTemplate,
  Link2,
  Loader2,
  Map as MapIcon,
  MoreHorizontal,
  Play,
  Redo2,
  Save,
  Shield,
  Sparkles,
  Trash2,
  Undo2,
  Upload,
  Wand2,
  Waves,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCanvasActions } from "./hooks/useCanvasActions";
import { useExports } from "./hooks/useExports";
import { useImports } from "./hooks/useImports";
import { useAnalysisStale } from "./hooks/useLiveAnalysis";
import { saveCurrentModel } from "./hooks/useModelerKeyboard";
import { readLibrary, saveModel } from "./persistence";
import { shortcutHint, type ShortcutId } from "./shortcuts";
import { tm, useTM } from "./store";
import { ARCHITECTURE_TEMPLATES } from "./templates";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/DropdownMenu";

const Kbd = ({ id }: { id: ShortcutId }) => (
  <span className="ml-auto pl-4 text-[10px] tracking-wide text-muted-foreground">
    {shortcutHint(id)}
  </span>
);

function ToolButton({
  label,
  icon,
  onClick,
  disabled,
  pressed,
  hint,
  showLabel = true,
  className,
  tour,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
  hint?: ShortcutId;
  showLabel?: boolean;
  className?: string;
  tour?: string;
}) {
  const title = hint ? `${label} (${shortcutHint(hint)})` : label;
  return (
    <Button
      type="button"
      variant={pressed ? "secondary" : "ghost"}
      size="sm"
      className={cn("h-8 shrink-0 gap-1.5 px-2 text-xs", className)}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pressed}
      aria-label={label}
      title={title}
      data-tour={tour}
    >
      {icon}
      {showLabel && <span className="hidden xl:inline">{label}</span>}
    </Button>
  );
}

function MenuButton({
  label,
  icon,
  children,
  align = "start",
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "end";
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 shrink-0 gap-1 px-2 text-xs"
          aria-label={label}
        >
          {icon}
          <span className="hidden md:inline">{label}</span>
          <ChevronDown className="h-3 w-3 opacity-60" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align}>{children}</DropdownMenuContent>
    </DropdownMenu>
  );
}

const Sep = () => <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-border" />;

function saveAsVersion() {
  const s = tm();
  if (s.persist === "readonly") return saveCurrentModel();
  if (!readLibrary().models.some((m) => m.id === s.document.id)) {
    s.openDialog("models", { mode: "save" });
    return;
  }
  const entry = saveModel(s.document, { asVersion: true });
  s.flushAutosave();
  toast.success(`Saved "${s.document.name}" as ${entry.versions[entry.versions.length - 1].label}`);
}

/** Modeler toolbar (P0-12): Radix menus for templates, save, import and export. */
export default function CanvasToolbar() {
  const actions = useCanvasActions();
  const exp = useExports();
  const imp = useImports();
  const running = useTM((s) => s.analysisPhase === "running");
  const hasAnalysis = useTM((s) => !!s.analysis);
  const stale = useAnalysisStale();
  const live = useTM((s) => s.document.settings.analysisMode === "live");
  const undoLabel = useTM((s) => s.past[s.past.length - 1]?.label ?? null);
  const redoLabel = useTM((s) => s.future[s.future.length - 1]?.label ?? null);
  const readOnly = useTM((s) => s.persist === "readonly");
  const empty = useTM((s) => s.document.nodes.length === 0);
  const selected = useTM((s) => s.document.nodes.filter((n) => n.selected).length);
  const flow = useTM((s) => s.ui.flowAnimation);
  const whatIf = useTM((s) => s.ui.whatIf.active);
  const snap = useTM((s) => s.ui.snapToGrid);
  const legend = useTM((s) => s.ui.legendOpen);

  const toggleLive = () =>
    tm().commit(
      (doc) => ({ ...doc, settings: { ...doc.settings, analysisMode: live ? "manual" : "live" } }),
      live ? "Live analysis off" : "Live analysis on",
      { analysis: "keep" },
    );
  const toggleWhatIf = () =>
    tm().setUi({ whatIf: { active: !whatIf, result: null }, connectFrom: null });

  return (
    <div
      role="toolbar"
      aria-label="Threat modeler tools"
      className="flex min-h-11 shrink-0 items-center gap-0.5 overflow-x-auto border-b bg-card/60 px-2 py-1 [scrollbar-width:thin]"
    >
      <Button
        type="button"
        size="sm"
        className="h-8 shrink-0 gap-1.5 px-3 text-xs"
        onClick={() => void tm().analyze()}
        disabled={empty || running}
        aria-busy={running}
        title={`Analyze (${shortcutHint("analyze")})`}
        data-tour="analyze"
      >
        {running ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        ) : (
          <Play className="h-3.5 w-3.5" aria-hidden />
        )}
        {running ? "Analyzing…" : hasAnalysis && !stale ? "Re-analyze" : "Analyze"}
        {stale && !running && (
          <span
            className="ml-0.5 h-1.5 w-1.5 rounded-full bg-[hsl(var(--security-medium))]"
            title="The model changed since the last run"
          />
        )}
        {stale && !running && <span className="sr-only">(results are out of date)</span>}
      </Button>
      <ToolButton
        label="Live"
        icon={<Zap className="h-3.5 w-3.5" aria-hidden />}
        onClick={toggleLive}
        pressed={live}
        disabled={readOnly}
        className="ml-0.5"
      />
      <Sep />
      <ToolButton
        label={undoLabel ? `Undo ${undoLabel}` : "Undo"}
        icon={<Undo2 className="h-3.5 w-3.5" aria-hidden />}
        onClick={() => tm().undo()}
        disabled={!undoLabel || readOnly}
        hint="undo"
        showLabel={false}
      />
      <ToolButton
        label={redoLabel ? `Redo ${redoLabel}` : "Redo"}
        icon={<Redo2 className="h-3.5 w-3.5" aria-hidden />}
        onClick={() => tm().redo()}
        disabled={!redoLabel || readOnly}
        hint="redo"
        showLabel={false}
      />
      <Sep />
      <MenuButton label="Templates" icon={<LayoutTemplate className="h-3.5 w-3.5" aria-hidden />}>
        <DropdownMenuItem onSelect={() => tm().openDialog("templates")}>
          <LayoutTemplate aria-hidden /> Browse all templates…
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Built-in</DropdownMenuLabel>
        {ARCHITECTURE_TEMPLATES.map((t) => (
          <DropdownMenuItem
            key={t.id}
            onSelect={() => actions.loadTemplate(t.id)}
            disabled={readOnly}
          >
            {t.name}
          </DropdownMenuItem>
        ))}
      </MenuButton>
      <MenuButton label="Save" icon={<Save className="h-3.5 w-3.5" aria-hidden />}>
        <DropdownMenuItem onSelect={saveCurrentModel} disabled={readOnly}>
          <Save aria-hidden /> Save <Kbd id="save" />
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={saveAsVersion} disabled={readOnly}>
          <Copy aria-hidden /> Save as version
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => tm().openDialog("models", { mode: "save" })}
          disabled={readOnly}
        >
          <Save aria-hidden /> Save as…
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => tm().openDialog("models", { mode: "load" })}>
          <FolderOpen aria-hidden /> Open saved model…
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => tm().openDialog("models", { mode: "diff" })}>
          <GitCompare aria-hidden /> Versions &amp; diff…
        </DropdownMenuItem>
        {readOnly && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => tm().makeCopy()}>
              <Copy aria-hidden /> Make a copy
            </DropdownMenuItem>
          </>
        )}
      </MenuButton>
      <MenuButton label="Import" icon={<Upload className="h-3.5 w-3.5" aria-hidden />}>
        <DropdownMenuItem onSelect={() => void imp.importFile()}>
          <FileJson aria-hidden /> From file… (model JSON, Threat Dragon, BOM)
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => tm().openDialog("bomImport")}>
          <Boxes aria-hidden /> CycloneDX ML-BOM / AIBOM…
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => tm().openDialog("customComponent")} disabled={readOnly}>
          <Sparkles aria-hidden /> New custom component…
        </DropdownMenuItem>
      </MenuButton>
      <MenuButton label="Export" icon={<Download className="h-3.5 w-3.5" aria-hidden />}>
        <DropdownMenuLabel>Model</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => void exp.json()}>
          <FileJson aria-hidden /> JSON (re-importable)
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void exp.share()} disabled={empty}>
          <Link2 aria-hidden /> Share link…
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void exp.copyJson()}>
          <Copy aria-hidden /> Copy JSON
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Diagram</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => void exp.png()} disabled={empty}>
          <ImageIcon aria-hidden /> PNG image
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void exp.svg()} disabled={empty}>
          <ImageIcon aria-hidden /> SVG image
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Report (runs the analysis if needed)</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => void exp.pdf()} disabled={empty}>
          <FileText aria-hidden /> PDF report
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void exp.markdown()} disabled={empty}>
          <FileText aria-hidden /> Markdown report
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void exp.csv()} disabled={empty}>
          <FileSpreadsheet aria-hidden /> Threats CSV
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void exp.workItems()} disabled={empty}>
          <FileSpreadsheet aria-hidden /> Mitigations as work items (CSV)
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void exp.sarif()} disabled={empty}>
          <Shield aria-hidden /> SARIF 2.1 (code scanning)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Other tools</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => void exp.threatDragon()} disabled={empty}>
          <Download aria-hidden /> OWASP Threat Dragon v2
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void exp.otm()} disabled={empty}>
          <Download aria-hidden /> Open Threat Model (OTM)
        </DropdownMenuItem>
      </MenuButton>
      <Sep />
      <div className="hidden items-center gap-0.5 lg:flex">
        <ToolButton
          label="Tidy"
          icon={<Wand2 className="h-3.5 w-3.5" aria-hidden />}
          onClick={() => actions.tidy()}
          disabled={empty || readOnly}
          hint="tidy"
        />
        <ToolButton
          label="Group"
          icon={<Boxes className="h-3.5 w-3.5" aria-hidden />}
          onClick={() => actions.group()}
          disabled={!selected || readOnly}
          hint="group"
        />
        <ToolButton
          label="Flow"
          icon={<Waves className="h-3.5 w-3.5" aria-hidden />}
          onClick={() => tm().setUi({ flowAnimation: !flow })}
          pressed={flow}
        />
        <ToolButton
          label="What-if"
          icon={<FlaskConical className="h-3.5 w-3.5" aria-hidden />}
          onClick={toggleWhatIf}
          pressed={whatIf}
          disabled={empty}
        />
        <ToolButton
          label="Snap"
          icon={<Grid3x3 className="h-3.5 w-3.5" aria-hidden />}
          onClick={() => tm().setUi({ snapToGrid: !snap })}
          pressed={snap}
        />
      </div>
      <MenuButton
        label="More"
        icon={<MoreHorizontal className="h-3.5 w-3.5" aria-hidden />}
        align="end"
      >
        <div className="lg:hidden">
          <DropdownMenuItem onSelect={() => actions.tidy()} disabled={empty || readOnly}>
            <Wand2 aria-hidden /> Tidy layout
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => actions.group()} disabled={!selected || readOnly}>
            <Boxes aria-hidden /> Group in trust boundary
          </DropdownMenuItem>
          <DropdownMenuCheckboxItem
            checked={flow}
            onCheckedChange={(v) => tm().setUi({ flowAnimation: !!v })}
          >
            Animate data flows
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={whatIf}
            onCheckedChange={toggleWhatIf}
            disabled={empty}
          >
            What-if removal
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={snap}
            onCheckedChange={(v) => tm().setUi({ snapToGrid: !!v })}
          >
            Snap to grid
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
        </div>
        <DropdownMenuCheckboxItem
          checked={legend}
          onCheckedChange={(v) => tm().setUi({ legendOpen: !!v })}
        >
          <MapIcon aria-hidden /> Legend expanded
        </DropdownMenuCheckboxItem>
        <DropdownMenuItem onSelect={() => tm().openDialog("onboarding")}>
          <Sparkles aria-hidden /> Guided build (3 steps)
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => tm().openDialog("shortcuts")}>
          <Keyboard aria-hidden /> Keyboard shortcuts <Kbd id="help" />
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/threat-modeler-guide">
            <BookOpen aria-hidden /> Threat Modeler guide
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => tm().openDialog("clear")}
          disabled={empty || readOnly}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 aria-hidden /> Clear canvas…
        </DropdownMenuItem>
      </MenuButton>
    </div>
  );
}

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Play,
  Plus,
  Undo2,
  Redo2,
  Download,
  Upload,
  Trash2,
  FileJson,
  Image,
  LayoutGrid,
  Save,
  FolderOpen,
  FileText,
  FileSpreadsheet,
  Grid3x3,
  Flame,
  HelpCircle,
  Crosshair,
  FileCode,
  BookOpen,
  FileType,
  ChevronDown,
  FileDown,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { AnalysisMode } from "./types";
import { ARCHITECTURE_TEMPLATES } from "./templates";

interface CanvasToolbarProps {
  analysisMode: AnalysisMode;
  onAnalysisModeChange: (m: AnalysisMode) => void;
  onAnalyze: () => void;
  onLoadTemplate: (templateId: string) => void;
  onCreateCustom: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onExportJSON: () => void;
  onExportPNG: () => void;
  onExportMarkdown: () => void;
  onExportSVG: () => void;
  onExportCSV: () => void;
  onExportSARIF: () => void;
  onExportPDF?: () => void;
  onImportJSON: () => void;
  onImportAibom: () => void;
  onClear: () => void;
  onAutoLayout: () => void;
  onSaveModel: () => void;
  onLoadModel: () => void;
  onToggleHeatMap: () => void;
  onToggleOnboarding: () => void;
  onToggleSnapToGrid: () => void;
  onWhatIf: () => void;
  isAnalyzing?: boolean;
  heatMapActive?: boolean;
  snapToGrid?: boolean;
  whatIfActive?: boolean;
  saveIndicator?: string;
  userTemplates?: { id: string; name: string }[];
}

function ToolbarButton({
  icon: Icon,
  label,
  description,
  onClick,
  disabled,
  active,
  variant = "ghost",
  destructive,
}: {
  icon: React.ElementType;
  label: string;
  description?: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  variant?: "ghost" | "outline" | "default";
  destructive?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={active ? "default" : variant}
          size="sm"
          className={`h-7 w-7 p-0 ${destructive ? "text-destructive" : ""}`}
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
        >
          <Icon className="h-3.5 w-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-52">
        <p className="text-xs font-semibold">{label}</p>
        {description && <p className="text-[10px] text-muted-foreground mt-0.5">{description}</p>}
      </TooltipContent>
    </Tooltip>
  );
}

function ToolbarDropdown({
  icon: Icon,
  label,
  items,
}: {
  icon: React.ElementType;
  label: string;
  items: { icon: React.ElementType; label: string; onClick: () => void }[];
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, left: rect.left });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open, updatePosition]);

  return (
    <>
      <button
        ref={triggerRef}
        className={`inline-flex items-center gap-0.5 h-7 px-1.5 text-xs rounded-md transition-colors ${open ? "bg-accent" : "hover:bg-accent"}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        title={label}
      >
        <Icon className="h-3.5 w-3.5" />
        <ChevronDown className={`h-2.5 w-2.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed bg-popover border rounded-md shadow-lg py-1 min-w-[170px] animate-in fade-in-0 zoom-in-95"
            style={{ top: pos.top, left: pos.left, zIndex: 9999 }}
          >
            <p className="px-3 py-1 text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
              {label}
            </p>
            {items.map((item, i) => {
              const ItemIcon = item.icon;
              return (
                <button
                  key={i}
                  onClick={() => {
                    item.onClick();
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-[11px] hover:bg-accent transition-colors text-left"
                >
                  <ItemIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  {item.label}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}

export default function CanvasToolbar({
  analysisMode,
  onAnalysisModeChange,
  onAnalyze,
  onLoadTemplate,
  onCreateCustom,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onExportJSON,
  onExportPNG,
  onExportSVG,
  onExportMarkdown,
  onExportCSV,
  onExportSARIF,
  onExportPDF,
  onImportJSON,
  onImportAibom,
  onClear,
  onAutoLayout,
  onSaveModel,
  onLoadModel,
  onToggleHeatMap,
  onToggleOnboarding,
  onToggleSnapToGrid,
  onWhatIf,
  isAnalyzing,
  heatMapActive,
  snapToGrid,
  whatIfActive,
  saveIndicator,
  userTemplates,
}: CanvasToolbarProps) {
  const exportItems = [
    { icon: FileJson, label: "Export JSON", onClick: onExportJSON },
    { icon: Image, label: "Export PNG", onClick: onExportPNG },
    { icon: FileType, label: "Export SVG", onClick: onExportSVG },
    { icon: FileText, label: "Export Markdown", onClick: onExportMarkdown },
    { icon: FileSpreadsheet, label: "Export CSV", onClick: onExportCSV },
    { icon: Download, label: "Export SARIF", onClick: onExportSARIF },
    ...(onExportPDF ? [{ icon: FileDown, label: "Export PDF Report", onClick: onExportPDF }] : []),
  ];

  const importItems = [
    { icon: Upload, label: "Import JSON", onClick: onImportJSON },
    { icon: FileCode, label: "Import AIBOM", onClick: onImportAibom },
  ];

  return (
    <TooltipProvider delayDuration={0}>
      <div className="h-10 border-b bg-background/95 backdrop-blur-sm flex items-center gap-1 px-2 shrink-0 overflow-x-auto relative z-10">
        {/* ── Primary: Analysis ─────────────── */}
        <span className="text-[10px] font-semibold text-primary px-1.5 py-0.5 rounded bg-primary/10 shrink-0">
          MAESTRO
        </span>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              <Label className="text-[10px] text-muted-foreground cursor-help">Live</Label>
              <Switch
                checked={analysisMode === "live"}
                onCheckedChange={(checked) => onAnalysisModeChange(checked ? "live" : "manual")}
                className="scale-75"
              />
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-52">
            <p className="text-xs font-semibold">Live Analysis Mode</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              When enabled, threats are re-analyzed automatically whenever you add, remove, or
              connect components.
            </p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="default"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={onAnalyze}
              disabled={isAnalyzing}
              aria-label="Run Threat Analysis"
            >
              <Play className="h-3 w-3" /> Analyze
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-52">
            <p className="text-xs font-semibold">Run Threat Analysis (Ctrl+E)</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Analyze all components and connections to identify threats using the MAESTRO 7-layer
              framework.
            </p>
          </TooltipContent>
        </Tooltip>

        <ToolbarButton
          icon={Flame}
          label={`Heat Map ${heatMapActive ? "(On)" : "(Off)"}`}
          description="Color-code components by threat severity"
          onClick={onToggleHeatMap}
          active={heatMapActive}
        />
        <ToolbarButton
          icon={Crosshair}
          label={`What-If Mode ${whatIfActive ? "(On)" : "(Off)"}`}
          description="Click a component to simulate its removal"
          onClick={onWhatIf}
          active={whatIfActive}
        />

        <div className="h-5 w-px bg-border mx-0.5" />

        {/* ── Canvas: Edit & Layout ──────────── */}
        <ToolbarButton icon={Undo2} label="Undo (Ctrl+Z)" onClick={onUndo} disabled={!canUndo} />
        <ToolbarButton icon={Redo2} label="Redo (Ctrl+Y)" onClick={onRedo} disabled={!canRedo} />
        <ToolbarButton
          icon={LayoutGrid}
          label="Auto Layout"
          description="Arrange components in a clean hierarchy"
          onClick={onAutoLayout}
        />
        <ToolbarButton
          icon={Grid3x3}
          label={`Snap to Grid ${snapToGrid ? "(On)" : "(Off)"}`}
          description="Align components to grid when dragging"
          onClick={onToggleSnapToGrid}
          active={snapToGrid}
        />

        <div className="h-5 w-px bg-border mx-0.5" />

        {/* ── Build: Templates & Custom ──────── */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Select onValueChange={onLoadTemplate}>
                <SelectTrigger className="h-7 w-32 text-[11px]">
                  <SelectValue placeholder="Templates" />
                </SelectTrigger>
                <SelectContent>
                  {ARCHITECTURE_TEMPLATES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                  {userTemplates && userTemplates.length > 0 && (
                    <>
                      <div className="px-2 py-1 text-[9px] font-semibold text-muted-foreground border-t mt-1 pt-1">
                        YOUR TEMPLATES
                      </div>
                      {userTemplates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-52">
            <p className="text-xs font-semibold">Load Architecture Template</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Start from a pre-built agentic AI architecture pattern.
            </p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={onCreateCustom}
              aria-label="Create Custom Component"
            >
              <Plus className="h-3 w-3" /> Custom
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-52">
            <p className="text-xs font-semibold">Create Custom Component</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Define your own component type with custom MAESTRO layers, trust levels, and
              associated threats.
            </p>
          </TooltipContent>
        </Tooltip>

        <div className="flex-1" />

        {saveIndicator && <span className="text-[9px] text-muted-foreground">{saveIndicator}</span>}

        {/* ── Storage ────────────────────────── */}
        <ToolbarButton
          icon={Save}
          label="Save Model (Ctrl+S)"
          description="Save to browser storage"
          onClick={onSaveModel}
        />
        <ToolbarButton
          icon={FolderOpen}
          label="Load Model"
          description="Open a previously saved model"
          onClick={onLoadModel}
        />

        <div className="h-5 w-px bg-border mx-0.5" />

        {/* ── Import / Export Dropdowns ───────── */}
        <ToolbarDropdown icon={Upload} label="Import" items={importItems} />
        <ToolbarDropdown icon={Download} label="Export" items={exportItems} />

        <div className="h-5 w-px bg-border mx-0.5" />

        {/* ── Help & Destructive ─────────────── */}
        <ToolbarButton
          icon={HelpCircle}
          label="Help & Shortcuts"
          description="Show guided tour and keyboard shortcuts"
          onClick={onToggleOnboarding}
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <Link to="/threat-modeler-guide" target="_blank">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" aria-label="Full Guide">
                <BookOpen className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-52">
            <p className="text-xs font-semibold">Full Guide</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Open the comprehensive Threat Modeler guide in a new tab
            </p>
          </TooltipContent>
        </Tooltip>

        <div className="h-5 w-px bg-border mx-0.5" />

        <ToolbarButton
          icon={Trash2}
          label="Clear Canvas"
          description="Remove all components and connections"
          onClick={onClear}
          destructive
        />
      </div>
    </TooltipProvider>
  );
}

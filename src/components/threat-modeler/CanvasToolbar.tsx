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
} from "lucide-react";
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
  onExportCSV: () => void;
  onExportSARIF: () => void;
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
  onExportMarkdown,
  onExportCSV,
  onExportSARIF,
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
}: CanvasToolbarProps) {
  return (
    <TooltipProvider delayDuration={0}>
      <div className="h-10 border-b bg-background/95 backdrop-blur-sm flex items-center gap-1.5 px-2 shrink-0 overflow-x-auto">
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

        <div className="h-5 w-px bg-border" />

        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Select onValueChange={onLoadTemplate}>
                <SelectTrigger className="h-7 w-32 text-[11px]">
                  <SelectValue placeholder="Load Template" />
                </SelectTrigger>
                <SelectContent>
                  {ARCHITECTURE_TEMPLATES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-52">
            <p className="text-xs font-semibold">Load Architecture Template</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Start from a pre-built agentic AI architecture pattern with components and connections
              already placed.
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

        <div className="h-5 w-px bg-border" />

        <ToolbarButton
          icon={Undo2}
          label="Undo"
          description="Undo the last canvas change (Ctrl+Z)"
          onClick={onUndo}
          disabled={!canUndo}
        />
        <ToolbarButton
          icon={Redo2}
          label="Redo"
          description="Redo a previously undone change (Ctrl+Y)"
          onClick={onRedo}
          disabled={!canRedo}
        />
        <ToolbarButton
          icon={LayoutGrid}
          label="Auto Layout"
          description="Automatically arrange all components in a clean top-to-bottom hierarchy"
          onClick={onAutoLayout}
        />
        <ToolbarButton
          icon={Grid3x3}
          label={`Snap to Grid ${snapToGrid ? "(On)" : "(Off)"}`}
          description="Align components to a grid when dragging for a tidier layout"
          onClick={onToggleSnapToGrid}
          active={snapToGrid}
        />

        <div className="h-5 w-px bg-border" />

        <ToolbarButton
          icon={Flame}
          label={`Heat Map ${heatMapActive ? "(On)" : "(Off)"}`}
          description="Color-code components by threat severity \u2014 red = high risk, green = low risk"
          onClick={onToggleHeatMap}
          active={heatMapActive}
        />
        <ToolbarButton
          icon={Crosshair}
          label={`What-If Mode ${whatIfActive ? "(On)" : "(Off)"}`}
          description="Click a component to simulate its removal and see how the threat landscape changes"
          onClick={onWhatIf}
          active={whatIfActive}
        />

        <div className="flex-1" />

        {saveIndicator && <span className="text-[9px] text-muted-foreground">{saveIndicator}</span>}

        <ToolbarButton
          icon={Save}
          label="Save Model"
          description="Save your current threat model to browser storage (Ctrl+S)"
          onClick={onSaveModel}
        />
        <ToolbarButton
          icon={FolderOpen}
          label="Load Model"
          description="Open a previously saved threat model from browser storage"
          onClick={onLoadModel}
        />

        <div className="h-5 w-px bg-border" />

        <ToolbarButton
          icon={Upload}
          label="Import JSON"
          description="Load a threat model from a JSON file on your computer"
          onClick={onImportJSON}
        />
        <ToolbarButton
          icon={FileCode}
          label="Import AIBOM"
          description="Import architecture from a Cisco AI BOM scan of your agentic AI codebase"
          onClick={onImportAibom}
        />
        <ToolbarButton
          icon={FileJson}
          label="Export JSON"
          description="Download the current model as a JSON file for sharing or backup"
          onClick={onExportJSON}
        />
        <ToolbarButton
          icon={Image}
          label="Export PNG"
          description="Save a screenshot of the canvas as a high-resolution PNG image"
          onClick={onExportPNG}
        />
        <ToolbarButton
          icon={FileText}
          label="Export Markdown"
          description="Generate a comprehensive threat model report in Markdown format"
          onClick={onExportMarkdown}
        />
        <ToolbarButton
          icon={FileSpreadsheet}
          label="Export CSV"
          description="Download all threats as a CSV spreadsheet for analysis in Excel or Google Sheets"
          onClick={onExportCSV}
        />
        <ToolbarButton
          icon={Download}
          label="Export SARIF"
          description="Export threats in SARIF 2.1.0 format for integration with GitHub Security and other SAST tools"
          onClick={onExportSARIF}
        />

        <div className="h-5 w-px bg-border" />

        <ToolbarButton
          icon={HelpCircle}
          label="Help & Shortcuts"
          description="Show a guided tour and keyboard shortcut reference"
          onClick={onToggleOnboarding}
        />
        <ToolbarButton
          icon={Trash2}
          label="Clear Canvas"
          description="Remove all components and connections from the canvas"
          onClick={onClear}
          destructive
        />
      </div>
    </TooltipProvider>
  );
}

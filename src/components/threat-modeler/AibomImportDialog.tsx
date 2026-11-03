import { useState, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, FileCode, AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";
import { detectImportFormat, parseBom } from "./parsers";
import { mapToCanvas, getMaestroLabel } from "./parsers/frameworkMapper";
import type { ParseResult } from "./parsers/types";
import type { CanvasNode, CanvasEdge } from "./types";

export type BomFormat = "cyclonedx" | "cisco-aibom";

export interface AibomImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payload?: Record<string, unknown>;
  /** Imported graph; the caller lays it out, commits it and prompts for flow posture. */
  onImport: (
    nodes: CanvasNode[],
    edges: CanvasEdge[],
    info: { warnings: string[]; format: BomFormat },
  ) => void;
}

type Stage = "upload" | "preview";

export default function AibomImportDialog({
  open,
  onOpenChange,
  onImport,
}: AibomImportDialogProps) {
  const [stage, setStage] = useState<Stage>("upload");
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [format, setFormat] = useState<BomFormat>("cisco-aibom");
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStage("upload");
    setParseResult(null);
    setError(null);
    setDragOver(false);
  }, []);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) reset();
      onOpenChange(next);
    },
    [onOpenChange, reset],
  );

  const processFile = useCallback((file: File) => {
    setError(null);
    if (!file.name.endsWith(".json")) {
      setError("Please upload a .json file (CycloneDX 1.6 ML-BOM or cisco-aibom report).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        const detected = detectImportFormat(json);
        if (detected === "threat-dragon" || detected === "document") {
          setError(
            detected === "threat-dragon"
              ? "This is an OWASP Threat Dragon model — use Import → Threat Dragon instead."
              : "This is a threat-model JSON document — use Import → JSON instead.",
          );
          return;
        }
        const result = parseBom(json);
        setFormat(detected === "cyclonedx" ? "cyclonedx" : "cisco-aibom");
        if (result.components.length === 0 && result.warnings.length > 0) {
          setError(result.warnings.join(" "));
          return;
        }
        setParseResult(result);
        setStage("preview");
      } catch {
        setError(
          "Failed to parse the file. Ensure it is a CycloneDX 1.6 ML-BOM or a cisco-aibom JSON report.",
        );
      }
    };
    reader.readAsText(file);
  }, []);

  const onDropHandler = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const onFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleImport = useCallback(() => {
    if (!parseResult) return;
    const { nodes, edges } = mapToCanvas(parseResult, { addUserActor: true });
    onImport(nodes, edges, { warnings: parseResult.warnings, format });
    handleOpenChange(false);
  }, [parseResult, onImport, handleOpenChange, format]);

  const typeCounts = parseResult
    ? parseResult.components.reduce<Record<string, number>>((acc, c) => {
        acc[c.type] = (acc[c.type] ?? 0) + 1;
        return acc;
      }, {})
    : {};

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5" />
            Import an AI bill of materials
          </DialogTitle>
          <DialogDescription>
            Upload a CycloneDX 1.6 ML-BOM (
            <code className="text-[11px]">machine-learning-model</code> components, model cards,
            dependencies) or a JSON report from{" "}
            <a
              href="https://github.com/cisco-ai-defense/aibom"
              target="_blank"
              rel="noopener noreferrer"
              className="underline inline-flex items-center gap-0.5"
            >
              cisco-aibom <ExternalLink className="h-3 w-3" aria-hidden />
              <span className="sr-only">(opens in a new tab)</span>
            </a>{" "}
            to generate the canvas. Imported flows are marked “posture unverified” so you can
            confirm authentication and encryption afterwards.
          </DialogDescription>
        </DialogHeader>

        {stage === "upload" && (
          <div className="space-y-4 py-2">
            {/* Instructions */}
            <div className="rounded-md border bg-muted/30 p-3 text-xs space-y-2">
              <p className="font-semibold text-sm">CycloneDX ML-BOM</p>
              <p className="text-muted-foreground">
                Any CycloneDX 1.6 BOM with <code className="text-[11px]">components[]</code> and{" "}
                <code className="text-[11px]">dependencies[]</code> works (e.g. exported by your
                model registry or SBOM tooling).
              </p>
              <p className="font-semibold text-sm pt-1">cisco-aibom report</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>
                  Install:{" "}
                  <code className="bg-muted px-1 py-0.5 rounded text-[11px]">
                    pip install cisco-aibom
                  </code>
                </li>
                <li>
                  Run:{" "}
                  <code className="bg-muted px-1 py-0.5 rounded text-[11px]">
                    cisco-aibom analyze /path/to/project --output-format json --output-file
                    report.json
                  </code>
                </li>
                <li>
                  Upload the resulting{" "}
                  <code className="bg-muted px-1 py-0.5 rounded text-[11px]">report.json</code>{" "}
                  below
                </li>
              </ol>
              <p className="text-muted-foreground">
                Supports LangChain, LangGraph, CrewAI, Strands SDK, OpenAI, Anthropic, AWS Bedrock,
                Autogen, Google GenAI, and more.
              </p>
            </div>

            {/* Drop zone */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                ${dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDropHandler}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Choose a BOM JSON file to import"
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">Drop a CycloneDX BOM or AIBOM report.json here</p>
              <p className="text-xs text-muted-foreground mt-1">or press Enter / click to browse</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                aria-hidden
                tabIndex={-1}
                onChange={onFileSelect}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">{error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {stage === "preview" && parseResult && (
          <div className="space-y-3 py-2 min-h-0 flex-1 flex flex-col">
            {/* Summary badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-[11px]">
                {format === "cyclonedx" ? "CycloneDX ML-BOM" : "cisco-aibom"}
              </Badge>
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {parseResult.components.length} components
              </Badge>
              <Badge variant="secondary" className="gap-1">
                {parseResult.connections.length} connections
              </Badge>
              {Object.entries(typeCounts).map(([type, count]) => (
                <Badge key={type} variant="outline" className="text-[11px]">
                  {type}: {count}
                </Badge>
              ))}
            </div>

            {/* Warnings */}
            {parseResult.warnings.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {parseResult.warnings.map((w, i) => (
                    <p key={i}>{w}</p>
                  ))}
                </AlertDescription>
              </Alert>
            )}

            {/* Component preview table */}
            <ScrollArea className="flex-1 min-h-0 max-h-[40vh] border rounded-md">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-background border-b">
                  <tr>
                    <th className="text-left p-2 font-semibold">Name</th>
                    <th className="text-left p-2 font-semibold">Type</th>
                    <th className="text-left p-2 font-semibold">MAESTRO Layer</th>
                    <th className="text-left p-2 font-semibold">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {parseResult.components.map((comp, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="p-2 font-medium">{comp.name}</td>
                      <td className="p-2">
                        <Badge variant="outline" className="text-[11px]">
                          {comp.type}
                        </Badge>
                      </td>
                      <td className="p-2 text-muted-foreground">{getMaestroLabel(comp.type)}</td>
                      <td
                        className="p-2 text-muted-foreground truncate max-w-[150px]"
                        title={comp.metadata.filePath}
                      >
                        {comp.metadata.filePath ?? comp.metadata.source ?? "–"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>

            {/* Connections preview */}
            {parseResult.connections.length > 0 && (
              <details className="text-xs">
                <summary className="cursor-pointer font-semibold text-muted-foreground hover:text-foreground">
                  {parseResult.connections.length} connections detected
                </summary>
                <ScrollArea className="max-h-24 mt-1 border rounded-md">
                  <div className="p-2 space-y-0.5">
                    {parseResult.connections.map((conn, i) => (
                      <div key={i} className="text-muted-foreground">
                        {conn.source} → {conn.target}{" "}
                        <span className="text-[11px] opacity-70">({conn.label})</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </details>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          {stage === "preview" && (
            <Button variant="outline" size="sm" onClick={reset}>
              Back
            </Button>
          )}
          {stage === "preview" && (
            <Button size="sm" onClick={handleImport} className="gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Import to Canvas
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

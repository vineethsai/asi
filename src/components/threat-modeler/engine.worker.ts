/**
 * Analysis Web Worker (§7.8). Plain postMessage protocol:
 *   in:  { id: number, input: AnalysisInput }
 *   out: { id, ok: true, result: AnalysisResult } | { id, ok: false, error: string }
 * Use it through `runAnalysis()` (engine/runAnalysis.ts), never directly.
 */
import { analyzeThreatModel, type AnalysisInput } from "./engine/analyze";

interface WorkerScope {
  onmessage: ((ev: MessageEvent<{ id: number; input: AnalysisInput }>) => void) | null;
  postMessage(message: unknown): void;
}

const scope = self as unknown as WorkerScope;

scope.onmessage = (ev) => {
  const { id, input } = ev.data;
  try {
    scope.postMessage({ id, ok: true, result: analyzeThreatModel(input) });
  } catch (e) {
    scope.postMessage({ id, ok: false, error: e instanceof Error ? e.message : String(e) });
  }
};

import { analyzeThreatModel, type AnalysisInput, type AnalysisResult } from "./analyze";
import { type ThreatModelDocument, documentToAnalysisInput } from "../document";

type Pending = {
  resolve: (r: AnalysisResult) => void;
  reject: (e: Error) => void;
  input: AnalysisInput;
};

let worker: Worker | null = null;
let disabled = false;
let seq = 0;
const pending = new Map<number, Pending>();

function getWorker(): Worker | null {
  if (disabled || typeof Worker === "undefined") return null;
  if (worker) return worker;
  try {
    worker = new Worker(new URL("../engine.worker.ts", import.meta.url), { type: "module" });
  } catch {
    disabled = true;
    return null;
  }
  worker.onmessage = (
    ev: MessageEvent<{ id: number; ok: boolean; result?: AnalysisResult; error?: string }>,
  ) => {
    const p = pending.get(ev.data.id);
    if (!p) return;
    pending.delete(ev.data.id);
    if (ev.data.ok && ev.data.result) p.resolve(ev.data.result);
    else p.reject(new Error(ev.data.error ?? "Analysis failed"));
  };
  worker.onerror = () => {
    // The worker could not load or crashed: finish everything in-thread from now on.
    disabled = true;
    worker?.terminate();
    worker = null;
    for (const [id, p] of pending) {
      pending.delete(id);
      try {
        p.resolve(analyzeThreatModel(p.input));
      } catch (e) {
        p.reject(e instanceof Error ? e : new Error(String(e)));
      }
    }
  };
  return worker;
}

function isDocument(x: AnalysisInput | ThreatModelDocument): x is ThreatModelDocument {
  return (x as ThreatModelDocument).schemaVersion === 2;
}

/**
 * Run the analysis off the main thread (§7.8). Accepts a v2 document or an
 * engine input. Falls back to in-thread execution where Workers are not
 * available (tests, SSR) or when the worker fails to start.
 */
export function runAnalysis(
  docOrInput: ThreatModelDocument | AnalysisInput,
  options: { inThread?: boolean; previous?: AnalysisInput["previous"] } = {},
): Promise<AnalysisResult> {
  const input: AnalysisInput = isDocument(docOrInput)
    ? documentToAnalysisInput(docOrInput)
    : docOrInput;
  if (options.previous !== undefined) input.previous = options.previous;
  const w = options.inThread ? null : getWorker();
  if (!w) {
    try {
      return Promise.resolve(analyzeThreatModel(input));
    } catch (e) {
      return Promise.reject(e instanceof Error ? e : new Error(String(e)));
    }
  }
  const id = ++seq;
  return new Promise<AnalysisResult>((resolve, reject) => {
    pending.set(id, { resolve, reject, input });
    try {
      w.postMessage({ id, input });
    } catch (e) {
      // Not cloneable (e.g. functions in node data): run in-thread.
      pending.delete(id);
      try {
        resolve(analyzeThreatModel(input));
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
      void e;
    }
  });
}

/** Terminate the worker (tests / hot reload). */
export function disposeAnalysisWorker() {
  worker?.terminate();
  worker = null;
  pending.clear();
}

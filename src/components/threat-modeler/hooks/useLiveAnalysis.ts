import { useEffect } from "react";
import { documentFingerprint, tm, useTM } from "../store";

/**
 * Live mode: re-run the analysis 800 ms after the last structural change
 * (positions and selection never count — see documentFingerprint).
 */
export function useLiveAnalysis() {
  const live = useTM((s) => s.document.settings.analysisMode === "live");
  const fingerprint = useTM((s) =>
    s.document.nodes.length ? documentFingerprint(s.document) : "",
  );
  const analysisFp = useTM((s) => s.analysisFingerprint);
  useEffect(() => {
    if (!live || !fingerprint || fingerprint === analysisFp) return;
    const t = window.setTimeout(() => void tm().analyze(), 800);
    return () => window.clearTimeout(t);
  }, [live, fingerprint, analysisFp]);
}

/** True when the current analysis no longer matches the document structure. */
export function useAnalysisStale(): boolean {
  return useTM((s) => !!s.analysis && s.analysisFingerprint !== documentFingerprint(s.document));
}

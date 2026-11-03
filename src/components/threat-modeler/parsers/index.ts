import { parseAibomReport } from "./aibomParser";
import { isCycloneDx, parseCycloneDx } from "./cyclonedx";
import type { ParseResult } from "./types";

export type ImportFormat = "cyclonedx" | "cisco-aibom" | "threat-dragon" | "document";

/** Detect which supported import format a parsed JSON value is. */
export function detectImportFormat(json: unknown): ImportFormat | null {
  if (!json || typeof json !== "object") return null;
  if (isCycloneDx(json)) return "cyclonedx";
  const o = json as Record<string, unknown>;
  if (
    o.detail &&
    typeof o.detail === "object" &&
    Array.isArray((o.detail as { diagrams?: unknown }).diagrams)
  )
    return "threat-dragon";
  if (Array.isArray(o.nodes) && Array.isArray(o.edges)) return "document";
  return "cisco-aibom";
}

/** BOM import: CycloneDX 1.6 ML-BOM or cisco-aibom report → ParseResult. */
export function parseBom(json: unknown): ParseResult {
  return detectImportFormat(json) === "cyclonedx" ? parseCycloneDx(json) : parseAibomReport(json);
}

export { parseAibomReport } from "./aibomParser";
export { parseCycloneDx, isCycloneDx } from "./cyclonedx";
export { parseThreatDragon, isThreatDragon } from "./threatDragon";
export { mapToCanvas } from "./frameworkMapper";

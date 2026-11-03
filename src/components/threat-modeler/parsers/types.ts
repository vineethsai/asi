/**
 * Shared types for importing external architecture definitions into the threat modeler.
 */

export type ParsedComponentType =
  | "model"
  | "agent"
  | "tool"
  | "prompt"
  | "embedding"
  | "guardrail"
  | "mcp"
  | "memory"
  | "datastore"
  | "other";

export interface ParsedComponent {
  /** Stable unique key from the source (instance id / bom-ref); connections resolve by it. */
  key?: string;
  /** Display name, unique within the import */
  name: string;
  /** Normalized component type */
  type: ParsedComponentType;
  /** Arbitrary metadata extracted from the source (file path, model name, etc.) */
  metadata: Record<string, string>;
}

export interface ParsedConnection {
  /** Source component name */
  source: string;
  /** Target component name */
  target: string;
  /** Source/target component keys (preferred over names, P3-19). */
  sourceKey?: string;
  targetKey?: string;
  /** Relationship label (e.g. USES_TOOL, USES_LLM) */
  label: string;
}

export interface ParseResult {
  /** Detected components */
  components: ParsedComponent[];
  /** Detected connections between components */
  connections: ParsedConnection[];
  /** Any warnings produced during parsing */
  warnings: string[];
}

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
  /** Unique name within the import (used for connection matching) */
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

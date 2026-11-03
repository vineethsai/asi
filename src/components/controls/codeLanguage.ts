/**
 * Code-fence language normalisation for <CodeBlock>. Only five Prism grammars are registered
 * (bash, python, typescript, yaml, json) to keep the highlighter chunk small; other languages
 * map to the closest registered grammar or render as plain text.
 */
export type CodeLanguage = "bash" | "python" | "typescript" | "yaml" | "json" | "text";

const ALIASES: Record<string, { lang: CodeLanguage; label: string }> = {
  bash: { lang: "bash", label: "Bash" },
  sh: { lang: "bash", label: "Shell" },
  shell: { lang: "bash", label: "Shell" },
  zsh: { lang: "bash", label: "Shell" },
  console: { lang: "bash", label: "Shell" },
  py: { lang: "python", label: "Python" },
  python: { lang: "python", label: "Python" },
  ts: { lang: "typescript", label: "TypeScript" },
  tsx: { lang: "typescript", label: "TypeScript" },
  typescript: { lang: "typescript", label: "TypeScript" },
  // The TypeScript grammar is a superset of JavaScript's.
  js: { lang: "typescript", label: "JavaScript" },
  jsx: { lang: "typescript", label: "JavaScript" },
  javascript: { lang: "typescript", label: "JavaScript" },
  yml: { lang: "yaml", label: "YAML" },
  yaml: { lang: "yaml", label: "YAML" },
  json: { lang: "json", label: "JSON" },
};

export function normalizeLanguage(language?: string | null): { lang: CodeLanguage; label: string } {
  const key = (language ?? "").trim().toLowerCase();
  return ALIASES[key] ?? { lang: "text", label: key ? key.toUpperCase() : "Code" };
}

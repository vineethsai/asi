import type { ReactNode } from "react";
import { CodeBlock } from "./CodeBlock";

/** `renderCode` adapter for <RichText>: fenced code → <CodeBlock> (lazy-highlighted). */
export function renderCodeBlock(code: string, lang: string, key: string): ReactNode {
  return <CodeBlock key={key} code={code} language={lang} />;
}

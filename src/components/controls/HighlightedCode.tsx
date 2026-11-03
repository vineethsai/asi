/**
 * Syntax-highlighted code, loaded lazily by <CodeBlock>. Uses the Prism *light* build of
 * react-syntax-highlighter with only five grammars registered, so the chunk stays small.
 */
import SyntaxHighlighter from "react-syntax-highlighter/dist/esm/prism-light";
import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash";
import python from "react-syntax-highlighter/dist/esm/languages/prism/python";
import typescript from "react-syntax-highlighter/dist/esm/languages/prism/typescript";
import yaml from "react-syntax-highlighter/dist/esm/languages/prism/yaml";
import json from "react-syntax-highlighter/dist/esm/languages/prism/json";
import duotoneLight from "react-syntax-highlighter/dist/esm/styles/prism/duotone-light";
import duotoneDark from "react-syntax-highlighter/dist/esm/styles/prism/duotone-dark";
import { useChartTheme } from "@/components/charts/useChartTheme";
import type { CodeLanguage } from "./codeLanguage";

SyntaxHighlighter.registerLanguage("bash", bash);
SyntaxHighlighter.registerLanguage("python", python);
SyntaxHighlighter.registerLanguage("typescript", typescript);
SyntaxHighlighter.registerLanguage("yaml", yaml);
SyntaxHighlighter.registerLanguage("json", json);

export default function HighlightedCode({
  code,
  language,
  label,
}: {
  code: string;
  language: Exclude<CodeLanguage, "text">;
  label?: string;
}) {
  const { isDark } = useChartTheme();
  return (
    <SyntaxHighlighter
      language={language}
      style={isDark ? duotoneDark : duotoneLight}
      tabIndex={0}
      aria-label={label}
      customStyle={{
        margin: 0,
        padding: "1rem",
        fontSize: 13,
        lineHeight: 1.6,
        background: "transparent",
        borderRadius: 0,
      }}
      codeTagProps={{ style: { fontFamily: "inherit" } }}
      className="font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
    >
      {code}
    </SyntaxHighlighter>
  );
}

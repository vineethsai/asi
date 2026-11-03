/**
 * CodeBlock — shared code sample with a language label and a copy button. The highlighter
 * (react-syntax-highlighter, Prism light build, five grammars) loads lazily on first render, so
 * pages that import CodeBlock do not pay for it until code is actually shown; the plain <pre>
 * fallback is shown meanwhile and for unknown languages.
 *
 * Props: code; language?: fence language ("ts", "python", "yaml", …); title?: replaces the
 * language label; className?
 *
 * Usage:
 *   <CodeBlock code={item.codeExample} language="typescript" />
 *   <RichText text={md} renderCode={(code, lang, key) => <CodeBlock key={key} code={code} language={lang} />} />
 */
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { normalizeLanguage } from "./codeLanguage";

const HighlightedCode = lazy(() => import("./HighlightedCode"));

export interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  className?: string;
}

function PlainCode({ code, label }: { code: string; label: string }) {
  return (
    <pre
      tabIndex={0}
      aria-label={label}
      className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
    >
      <code>{code}</code>
    </pre>
  );
}

export function CodeBlock({ code, language, title, className }: CodeBlockProps) {
  const { lang, label } = normalizeLanguage(language);
  const text = code.replace(/^\n+|\s+$/g, "");
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard?.writeText(text);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const heading = title ?? label;
  const regionLabel = `${heading} code sample`;

  return (
    <div className={cn("my-3 overflow-hidden rounded-lg border bg-muted/40", className)}>
      <div className="flex items-center justify-between gap-2 border-b bg-muted/60 px-3 py-1.5">
        <span className="font-mono text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {heading}
        </span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex h-7 items-center gap-1.5 rounded px-2 text-xs text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {copied ? (
            <Check aria-hidden className="h-3.5 w-3.5" />
          ) : (
            <Copy aria-hidden className="h-3.5 w-3.5" />
          )}
          {copied ? "Copied" : "Copy"}
          <span className="sr-only"> {heading} code</span>
        </button>
        <span className="sr-only" aria-live="polite">
          {copied ? "Code copied to clipboard" : ""}
        </span>
      </div>
      {lang === "text" ? (
        <PlainCode code={text} label={regionLabel} />
      ) : (
        <Suspense fallback={<PlainCode code={text} label={regionLabel} />}>
          <HighlightedCode code={text} language={lang} label={regionLabel} />
        </Suspense>
      )}
    </div>
  );
}

export default CodeBlock;

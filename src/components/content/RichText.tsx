/**
 * RichText — the one formatter for the light-markdown used in data modules (P1-06).
 * Extracted from ControlDetail.tsx:240-420 and generalised.
 *
 * Handles (block): fenced ```code```, `**Heading**` / `**Heading:**` lines, `**Label:** text`
 * sub-headings, `#`/`##` headings, `- ` / `* ` / `• ` bullets (indented = nested), `1. ` lists,
 * one-line " - a - b" lists, paragraphs.
 * Handles (inline, ONE regex pass per segment): `inline code`, **bold**, [links](url),
 * AISVS codes (`AISVS C1.2.3`, `C1.2.3`, `V1.2.3`, `AISVS C5`, bare `C5`) → /aisvs#C1.2.3,
 * threat codes `T7` → /threats/t7, control codes `M3` → /controls/m3,
 * ASI codes `ASI03` → /taxonomy?tab=owasp-agentic&entry=ASI03, and glossary terms (tooltips
 * under a single TooltipProvider; by default only the first occurrence of each term).
 *
 * Props:
 *   text: string                       — source text (null/empty renders nothing)
 *   variant?: "prose" | "compact"      — prose = detail pages; compact = cards, drawers, modeler
 *   glossary?: Record<string, string | { definition: string; href?: string }> | false
 *   glossaryMode?: "first" | "all"     — default "first"
 *   linkCodes?: boolean                — default true
 *   resolveHref?: (code: CodeRef) => string | undefined   — override any code link target
 *   renderCode?: (code, lang, key) => ReactNode            — e.g. plug in a syntax highlighter
 *   checklist?: { idPrefix, isChecked(id), onToggle(id, checked) }
 *       — when a block is ALL bullets, render checkboxes with ids `${idPrefix}-${i}`
 *         (identical to the legacy ControlDetail task ids, e.g. "design-phase-0")
 *   className?: string
 *
 * Usage:
 *   <RichText text={mitigation.implementationDetail.design} />
 *   <RichText text={threat.description} variant="compact" glossary={false} />
 */

import { Fragment, useId, useMemo, type ReactNode } from "react";
import { Link, useInRouterContext } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  DEFAULT_GLOSSARY,
  defaultCodeHref,
  parseBlocks,
  type CodeRef,
  type GlossaryEntry,
} from "./richTextCore";

export type { CodeRef, GlossaryEntry } from "./richTextCore";

export interface RichTextChecklist {
  idPrefix: string;
  isChecked: (id: string) => boolean;
  onToggle: (id: string, checked: boolean) => void;
}

export interface RichTextProps {
  text: string | null | undefined;
  variant?: "prose" | "compact";
  glossary?: Record<string, string | GlossaryEntry> | false;
  glossaryMode?: "first" | "all";
  linkCodes?: boolean;
  resolveHref?: (code: CodeRef) => string | undefined;
  renderCode?: (code: string, lang: string, key: string) => ReactNode;
  checklist?: RichTextChecklist;
  className?: string;
}

// ─── Inline tokenizer ───────────────────────────────────────────────────────

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Case-insensitive pattern without the `i` flag (codes must stay case-sensitive). */
const ciPattern = (s: string) =>
  escapeRe(s).replace(/[a-z]/gi, (c) => `[${c.toLowerCase()}${c.toUpperCase()}]`);

const INLINE_BASE = [
  /`([^`\n]+)`/.source, // 1 inline code
  /\*\*([^*\n]+?)\*\*/.source, // 2 bold
  /\[([^\]\n]+)\]\(([^)\s]+)\)/.source, // 3,4 markdown link
  /\bAISVS[\s-]+([CV]\d{1,2}(?:\.\d{1,2}){0,2})\b/.source, // 5 AISVS-prefixed code
  /\b([CV]\d{1,2}\.\d{1,2}(?:\.\d{1,2})?)\b/.source, // 6 dotted AISVS code
  /\b(C(?:1[0-3]|[1-9]))\b(?!\s+(?:server|servers|channel|channels|infrastructure|traffic|beacon))/
    .source, // 7 bare chapter
  /\b(ASI(?:0[1-9]|10))\b/.source, // 8 ASI entry
  /\b(T(?:1[0-5]|[1-9]))\b/.source, // 9 threat
  /\b(M(?:1[0-8]|[1-9]))\b/.source, // 10 control
];
const GLOSSARY_GROUP = 11;

type InlineCtx = {
  glossary: Map<string, GlossaryEntry>; // lower-case term → entry
  glossaryRe: RegExp;
  mode: "first" | "all";
  seen: Set<string>;
  linkCodes: boolean;
  resolveHref: (ref: CodeRef) => string | undefined;
  inRouter: boolean;
  variant: "prose" | "compact";
};

function buildInlineRegex(terms: string[]): RegExp {
  const parts = [...INLINE_BASE];
  if (terms.length) {
    const alt = terms
      .slice()
      .sort((a, b) => b.length - a.length)
      .map(ciPattern)
      .join("|");
    parts.push(`\\b(${alt})\\b`);
  } else {
    parts.push("(?!)"); // never matches; keeps group numbering stable
  }
  return new RegExp(parts.join("|"), "g");
}

function SafeLink({
  href,
  children,
  ctx,
  className,
}: {
  href: string;
  children: ReactNode;
  ctx: InlineCtx;
  className?: string;
}) {
  const cls = cn("text-primary underline-offset-2 hover:underline", className);
  if (/^https?:\/\//i.test(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
      </a>
    );
  }
  if (href.startsWith("/") || href.startsWith("#")) {
    return ctx.inRouter && href.startsWith("/") ? (
      <Link to={href} className={cls}>
        {children}
      </Link>
    ) : (
      <a href={href} className={cls}>
        {children}
      </a>
    );
  }
  // Anything else (javascript:, data:, relative junk) renders as text.
  return <>{children}</>;
}

function codeLink(ref: CodeRef, label: string, key: string, ctx: InlineCtx): ReactNode {
  const href = ctx.linkCodes ? ctx.resolveHref(ref) : undefined;
  if (!href) return <Fragment key={key}>{label}</Fragment>;
  return (
    <SafeLink key={key} href={href} ctx={ctx} className="font-mono text-[0.92em] font-medium">
      {label}
    </SafeLink>
  );
}

function renderInline(
  text: string,
  ctx: InlineCtx,
  keyPrefix: string,
  allowBold = true,
): ReactNode[] {
  const out: ReactNode[] = [];
  const re = new RegExp(ctx.glossaryRe.source, "g");
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m[0] === "") {
      re.lastIndex++;
      continue;
    }
    const key = `${keyPrefix}-${i++}`;
    const before = text.slice(last, m.index);
    if (before) out.push(before);
    last = m.index + m[0].length;

    if (m[1] !== undefined) {
      out.push(
        <code
          key={key}
          className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em] text-foreground"
        >
          {m[1]}
        </code>,
      );
    } else if (m[2] !== undefined) {
      out.push(
        allowBold ? (
          <strong key={key} className="font-semibold text-foreground">
            {renderInline(m[2], ctx, key, false)}
          </strong>
        ) : (
          m[0]
        ),
      );
    } else if (m[3] !== undefined) {
      out.push(
        <SafeLink key={key} href={m[4]} ctx={ctx}>
          {m[3]}
        </SafeLink>,
      );
    } else if (m[5] !== undefined) {
      out.push(codeLink({ kind: "aisvs", code: m[5] }, m[0], key, ctx));
    } else if (m[6] !== undefined) {
      out.push(codeLink({ kind: "aisvs", code: m[6] }, m[6], key, ctx));
    } else if (m[7] !== undefined) {
      out.push(codeLink({ kind: "aisvs", code: m[7] }, m[7], key, ctx));
    } else if (m[8] !== undefined) {
      out.push(codeLink({ kind: "asi", code: m[8] }, m[8], key, ctx));
    } else if (m[9] !== undefined) {
      out.push(codeLink({ kind: "threat", code: m[9] }, m[9], key, ctx));
    } else if (m[10] !== undefined) {
      out.push(codeLink({ kind: "control", code: m[10] }, m[10], key, ctx));
    } else if (m[GLOSSARY_GROUP] !== undefined) {
      const term = m[GLOSSARY_GROUP];
      const lower = term.toLowerCase();
      const entry = ctx.glossary.get(lower);
      if (!entry || (ctx.mode === "first" && ctx.seen.has(lower))) {
        out.push(term);
      } else {
        ctx.seen.add(lower);
        out.push(
          <Tooltip key={key}>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="cursor-help rounded-sm font-medium text-foreground underline decoration-primary/60 decoration-dotted underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {term}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="text-sm">{entry.definition}</p>
            </TooltipContent>
          </Tooltip>,
        );
      }
    }
  }
  const rest = text.slice(last);
  if (rest) out.push(rest);
  return out;
}

// ─── Component ──────────────────────────────────────────────────────────────

const STYLES = {
  prose: {
    root: "space-y-2",
    h3: "mt-6 mb-3 flex items-center gap-3 border-b border-border/50 pb-2 text-lg font-semibold text-foreground first:mt-0",
    h4: "mt-4 mb-2 text-base font-semibold text-foreground",
    labelled: "mt-4 mb-3",
    labelledHead: "mb-1 flex items-center gap-2 text-base font-semibold text-foreground",
    labelledBody: "ml-4 text-sm leading-relaxed text-muted-foreground",
    p: "mb-3 text-sm leading-relaxed text-muted-foreground",
    ul: "my-4 space-y-2",
    ol: "my-4 space-y-2",
    li: "flex items-start gap-3 rounded-lg p-2 text-sm leading-relaxed text-muted-foreground transition-colors hover:bg-muted/30",
    code: "my-4 overflow-x-auto rounded-lg border bg-muted/50 p-4 font-mono text-[13px] leading-relaxed text-foreground",
  },
  compact: {
    root: "space-y-1.5",
    h3: "mt-3 mb-1 text-sm font-semibold text-foreground first:mt-0",
    h4: "mt-2 mb-1 text-sm font-medium text-foreground",
    labelled: "mt-2",
    labelledHead: "text-sm font-medium text-foreground",
    labelledBody: "text-sm leading-relaxed text-muted-foreground",
    p: "text-sm leading-relaxed text-muted-foreground",
    ul: "space-y-1",
    ol: "space-y-1",
    li: "flex items-start gap-2 text-sm leading-relaxed text-muted-foreground",
    code: "my-2 overflow-x-auto rounded-md border bg-muted/50 p-2 font-mono text-xs text-foreground",
  },
} as const;

export function RichText({
  text,
  variant = "prose",
  glossary,
  glossaryMode = "first",
  linkCodes = true,
  resolveHref,
  renderCode,
  checklist,
  className,
}: RichTextProps) {
  const inRouter = useInRouterContext();
  const uid = useId();
  const blocks = useMemo(() => (text ? parseBlocks(text) : []), [text]);

  const glossaryMap = useMemo(() => {
    const src = glossary === false ? {} : (glossary ?? DEFAULT_GLOSSARY);
    const map = new Map<string, GlossaryEntry>();
    for (const [term, v] of Object.entries(src)) {
      map.set(term.toLowerCase(), typeof v === "string" ? { definition: v } : v);
    }
    return map;
  }, [glossary]);
  const regex = useMemo(() => buildInlineRegex([...glossaryMap.keys()]), [glossaryMap]);

  if (!blocks.length) return null;

  const ctx: InlineCtx = {
    glossary: glossaryMap,
    glossaryRe: regex,
    mode: glossaryMode,
    seen: new Set(),
    linkCodes,
    resolveHref: resolveHref ?? defaultCodeHref,
    inRouter,
    variant,
  };
  const s = STYLES[variant];
  const inline = (t: string, k: string) => renderInline(t, ctx, k);

  const content = blocks.map((b, bi) => {
    const k = `b${bi}`;
    switch (b.type) {
      case "code":
        return renderCode ? (
          <Fragment key={k}>{renderCode(b.code, b.lang, k)}</Fragment>
        ) : (
          <pre key={k} className={s.code} data-lang={b.lang || undefined}>
            <code>{b.code}</code>
          </pre>
        );
      case "heading":
        return b.level === 3 ? (
          <h3 key={k} className={s.h3}>
            {variant === "prose" && (
              <span
                aria-hidden
                className="h-6 w-1.5 shrink-0 rounded-full bg-gradient-to-b from-primary to-primary/60"
              />
            )}
            <span>{inline(b.text, k)}</span>
          </h3>
        ) : (
          <h4 key={k} className={s.h4}>
            {inline(b.text, k)}
          </h4>
        );
      case "labelled":
        return (
          <div key={k} className={s.labelled}>
            <h4 className={s.labelledHead}>
              {variant === "prose" && (
                <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-primary/70" />
              )}
              {inline(b.label, `${k}h`)}
            </h4>
            <p className={s.labelledBody}>{inline(b.text, `${k}t`)}</p>
          </div>
        );
      case "para":
        return (
          <p key={k} className={s.p}>
            {inline(b.text, k)}
          </p>
        );
      case "list": {
        const allBullets = !b.ordered && !b.inline && b.items.length > 1 && blocks.length === 1;
        if (checklist && allBullets) {
          return (
            <ul key={k} className="space-y-3" role="list">
              {b.items.map((item, i) => {
                const id = `${checklist.idPrefix}-${i}`;
                const domId = `${uid}-${id}`;
                const checked = checklist.isChecked(id);
                return (
                  <li key={id} className="group flex items-start gap-3">
                    <Checkbox
                      id={domId}
                      checked={checked}
                      onCheckedChange={(v) => checklist.onToggle(id, v === true)}
                      className="mt-0.5"
                    />
                    <label
                      htmlFor={domId}
                      className={cn(
                        "flex-1 cursor-pointer text-sm transition-colors",
                        checked ? "text-muted-foreground line-through" : "text-foreground",
                      )}
                    >
                      {inline(item.text, `${k}-${i}`)}
                    </label>
                  </li>
                );
              })}
            </ul>
          );
        }
        const ListTag = b.ordered ? "ol" : "ul";
        return (
          <ListTag key={k} className={b.ordered ? s.ol : s.ul} role="list">
            {b.items.map((item, i) => (
              <li
                key={i}
                className={cn(s.li, item.depth > 0 && (variant === "prose" ? "ml-6" : "ml-4"))}
              >
                {b.ordered ? (
                  <span className="min-w-[1.25rem] shrink-0 font-mono text-xs leading-6 text-muted-foreground">
                    {b.items.slice(0, i + 1).filter((x) => x.depth === item.depth).length}.
                  </span>
                ) : (
                  <span
                    aria-hidden
                    className={cn(
                      "mt-2 h-1.5 w-1.5 shrink-0 rounded-full",
                      item.depth > 0 ? "bg-muted-foreground/60" : "bg-primary",
                    )}
                  />
                )}
                <span className="flex-1">{inline(item.text, `${k}-${i}`)}</span>
              </li>
            ))}
          </ListTag>
        );
      }
    }
  });

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn(s.root, className)} data-variant={variant}>
        {content}
      </div>
    </TooltipProvider>
  );
}

export default RichText;

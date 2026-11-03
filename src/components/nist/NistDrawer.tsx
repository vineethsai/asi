/**
 * Non-modal details drawer for the NIST mapping page: a side panel on lg+ (fixed right, below the
 * sticky header) and a bottom sheet on smaller screens. role="dialog" (non-modal, so the graph
 * and matrix stay usable), labelled by its heading; focus moves to the heading on open and returns
 * to the element that opened it on close; Escape closes.
 */
import { useEffect, useId, useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Copy, ExternalLink, ListTree, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NIST_FUNCTION_PALETTE } from "@/lib/palette";
import { aisvsData, AISVS_VERSION } from "@/data/aisvs";
import {
  NIST_SUBCATEGORIES,
  getNistCategory,
  getNistFunction,
  getNistSubcategory,
  type NistRmfSubcategory,
} from "@/data/nist";
import { AisvsChapterChips, EditorialNote, GaiRiskChips, RequirementLinks } from "./NistChips";
import { chapterName, citedIn, functionOf, type NistSelection } from "./selection";

export interface NistDrawerProps {
  selection: NistSelection | null;
  onClose: () => void;
  onSelect: (sel: NistSelection) => void;
  /** "Show in detailed mapping" for a subcategory or category. */
  onShowInMapping?: (code: string) => void;
  /** Filter the page by a GAI risk (chip click). */
  onGaiFilter?: (id: string) => void;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}

function SubList({
  subs,
  chapter,
  onSelect,
}: {
  subs: readonly NistRmfSubcategory[];
  chapter?: string;
  onSelect: (sel: NistSelection) => void;
}) {
  return (
    <ul className="divide-y rounded-md border">
      {subs.map((s) => (
        <li key={s.code}>
          <button
            type="button"
            onClick={() => onSelect({ kind: "subcategory", code: s.code })}
            className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          >
            <span className="shrink-0 font-mono text-xs font-semibold">{s.code}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate">{s.name}</span>
              <span className="block text-xs text-muted-foreground">
                {s.aisvs.length ? s.aisvs.join(" · ") : "Organizational practice"}
                {chapter &&
                  citedIn(s, chapter).length > 0 &&
                  ` · cites ${citedIn(s, chapter).join(", ")}`}
              </span>
            </span>
            <ChevronRight aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        </li>
      ))}
    </ul>
  );
}

function shareUrl(code: string): string {
  const url = new URL(window.location.href);
  url.search = `?sub=${encodeURIComponent(code)}`;
  url.hash = "";
  return url.toString();
}

async function copyLink(code: string) {
  const text = shareUrl(code);
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Link copied", { description: text });
  } catch {
    toast.error("Could not copy the link", { description: text });
  }
}

export function NistDrawer({
  selection,
  onClose,
  onSelect,
  onShowInMapping,
  onGaiFilter,
}: NistDrawerProps) {
  const open = selection !== null;
  const headingId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const openerRef = useRef<Element | null>(null);
  const wasOpen = useRef(false);

  // Focus management: heading on open, opener on close.
  useEffect(() => {
    if (open && !wasOpen.current) {
      openerRef.current = document.activeElement;
      requestAnimationFrame(() => headingRef.current?.focus({ preventScroll: true }));
    } else if (!open && wasOpen.current) {
      const el = openerRef.current;
      if (el instanceof HTMLElement && el.isConnected) el.focus({ preventScroll: true });
      openerRef.current = null;
    }
    wasOpen.current = open;
  }, [open]);

  // Escape closes when nothing else (a menu, a select, the graph) handled it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      const t = e.target as HTMLElement | null;
      if (t && t !== document.body && !t.closest("[data-nist-drawer]")) return;
      onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!selection) return null;

  let eyebrow = "";
  let heading: ReactNode = selection.code;
  let accent = "hsl(var(--primary))";
  let body: ReactNode = null;
  let shareCode: string | null = null;

  if (selection.kind === "subcategory") {
    const sub = getNistSubcategory(selection.code);
    if (sub) {
      const cat = getNistCategory(sub.categoryCode);
      const fn = getNistFunction(sub.functionCode);
      accent = NIST_FUNCTION_PALETTE[sub.functionCode].css;
      eyebrow = "NIST AI RMF subcategory";
      shareCode = sub.code;
      heading = (
        <>
          <span className="font-mono">{sub.code}</span> {sub.name}
        </>
      );
      body = (
        <>
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs">
            {fn && (
              <button
                type="button"
                className="rounded px-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => onSelect({ kind: "function", code: fn.code })}
              >
                {fn.code}
              </button>
            )}
            <ChevronRight aria-hidden className="h-3 w-3 text-muted-foreground" />
            {cat && (
              <button
                type="button"
                className="rounded px-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => onSelect({ kind: "category", code: cat.code })}
              >
                {cat.code} {cat.name}
              </button>
            )}
          </nav>
          <EditorialNote />
          <Section title="NIST AI RMF 1.0 text">
            <blockquote className="border-l-2 pl-3 text-sm" style={{ borderColor: accent }}>
              {sub.description}
            </blockquote>
          </Section>
          <Section title={`AISVS ${AISVS_VERSION} mapping`}>
            {sub.organizational ? (
              <p className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
                Organizational practice — no AISVS chapter addresses it directly.
              </p>
            ) : (
              <AisvsChapterChips chapters={sub.aisvs} emphasis={selection.chapter} />
            )}
            {!sub.organizational && (
              <p className="text-sm text-muted-foreground">{sub.rationale}</p>
            )}
            {selection.chapter && !sub.aisvs.includes(selection.chapter) && (
              <p className="text-xs text-muted-foreground">
                Not mapped to {selection.chapter} {chapterName(selection.chapter)}.
              </p>
            )}
            {sub.requirements.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Requirements cited</p>
                <RequirementLinks ids={sub.requirements} />
              </div>
            )}
          </Section>
          <Section title="NIST AI 600-1 GAI risks">
            {sub.gaiRisks?.length ? (
              <GaiRiskChips ids={sub.gaiRisks} onSelect={onGaiFilter} />
            ) : (
              <p className="text-sm text-muted-foreground">
                No suggested actions for this subcategory in the Generative AI Profile.
              </p>
            )}
          </Section>
        </>
      );
    }
  } else if (selection.kind === "category") {
    const cat = getNistCategory(selection.code);
    if (cat) {
      accent = NIST_FUNCTION_PALETTE[cat.functionCode].css;
      eyebrow = "NIST AI RMF category";
      shareCode = cat.code;
      heading = (
        <>
          <span className="font-mono">{cat.code}</span> {cat.name}
        </>
      );
      const ch = selection.chapter;
      const mapping = ch ? cat.subcategories.filter((s) => s.aisvs.includes(ch)) : [];
      const rest = ch ? cat.subcategories.filter((s) => !s.aisvs.includes(ch)) : cat.subcategories;
      body = (
        <>
          <EditorialNote />
          <Section title="NIST AI RMF 1.0 text">
            <blockquote className="border-l-2 pl-3 text-sm" style={{ borderColor: accent }}>
              {cat.description}
            </blockquote>
          </Section>
          {ch && (
            <Section title={`Mapping to ${ch}`}>
              <p className="text-sm">
                <strong className="tabular-nums">{mapping.length}</strong> of{" "}
                {cat.subcategories.length} subcategories map to{" "}
                <Link className="text-primary hover:underline" to={`/aisvs#${ch}`}>
                  {ch} {chapterName(ch)}
                </Link>
                .
              </p>
              {mapping.length > 0 && <SubList subs={mapping} chapter={ch} onSelect={onSelect} />}
            </Section>
          )}
          <Section title={ch ? "Other subcategories" : "Subcategories"}>
            {rest.length > 0 ? (
              <SubList subs={rest} onSelect={onSelect} />
            ) : (
              <p className="text-sm text-muted-foreground">None.</p>
            )}
          </Section>
        </>
      );
    }
  } else if (selection.kind === "function") {
    const fn = getNistFunction(selection.code);
    if (fn) {
      accent = NIST_FUNCTION_PALETTE[fn.code].css;
      eyebrow = "NIST AI RMF function";
      shareCode = fn.code;
      heading = fn.name;
      const subs = NIST_SUBCATEGORIES.filter((s) => s.functionCode === fn.code);
      body = (
        <>
          <Section title="NIST AI RMF 1.0">
            <blockquote className="border-l-2 pl-3 text-sm" style={{ borderColor: accent }}>
              {fn.description}
            </blockquote>
            <p className="text-sm text-muted-foreground">
              {fn.categories.length} categories · {subs.length} subcategories ·{" "}
              {subs.filter((s) => !s.organizational).length} mapped to AISVS
            </p>
          </Section>
          <Section title="Categories">
            <ul className="divide-y rounded-md border">
              {fn.categories.map((c) => (
                <li key={c.code}>
                  <button
                    type="button"
                    onClick={() => onSelect({ kind: "category", code: c.code })}
                    className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  >
                    <span className="shrink-0 font-mono text-xs font-semibold">{c.code}</span>
                    <span className="min-w-0 flex-1 truncate">{c.name}</span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {c.subcategories.length}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Section>
        </>
      );
    }
  } else {
    const ch = aisvsData[selection.code];
    if (ch) {
      eyebrow = `OWASP AISVS ${AISVS_VERSION} chapter`;
      heading = (
        <>
          <span className="font-mono">{ch.code}</span> {ch.name}
        </>
      );
      const subs = NIST_SUBCATEGORIES.filter((s) => s.aisvs.includes(ch.code));
      body = (
        <>
          <Section title="Control objective">
            <p className="text-sm">{ch.description}</p>
            <Link
              to={`/aisvs#${ch.code}`}
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Open {ch.code} in AISVS <ExternalLink aria-hidden className="h-3.5 w-3.5" />
            </Link>
          </Section>
          <Section title={`NIST subcategories mapping to ${ch.code} (${subs.length})`}>
            {subs.length > 0 ? (
              <SubList subs={subs} chapter={ch.code} onSelect={onSelect} />
            ) : (
              <p className="text-sm text-muted-foreground">None.</p>
            )}
          </Section>
        </>
      );
    }
  }

  return (
    <div
      data-nist-drawer=""
      role="dialog"
      aria-modal="false"
      aria-labelledby={headingId}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onClose();
        }
      }}
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 flex max-h-[70vh] flex-col rounded-t-xl border-t bg-card shadow-2xl",
        "lg:inset-x-auto lg:bottom-0 lg:right-0 lg:top-14 lg:max-h-none lg:w-[28rem] lg:rounded-none lg:border-l lg:border-t-0",
        "motion-safe:duration-200 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 lg:motion-safe:slide-in-from-bottom-0 lg:motion-safe:slide-in-from-right-8",
      )}
    >
      <div
        className="h-1 w-full shrink-0 rounded-t-xl lg:rounded-none"
        style={{ background: accent }}
      />
      <div className="flex items-start gap-2 border-b px-4 py-3">
        <div className="min-w-0 flex-1">
          {eyebrow && (
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {eyebrow}
              {selection.kind !== "chapter" && ` · ${functionOf(selection.code)}`}
            </p>
          )}
          <h2
            id={headingId}
            ref={headingRef}
            tabIndex={-1}
            className="text-base font-semibold leading-snug outline-none"
          >
            {heading}
          </h2>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Close details"
          onClick={onClose}
          className="-mr-2 h-8 w-8 shrink-0"
        >
          <X aria-hidden className="h-4 w-4" />
        </Button>
      </div>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
        {body ?? <p className="text-sm text-muted-foreground">Nothing selected.</p>}
      </div>
      {(shareCode || (onShowInMapping && selection.kind !== "chapter")) && (
        <div className="flex flex-wrap gap-2 border-t px-4 py-3">
          {shareCode && (
            <Button type="button" size="sm" variant="outline" onClick={() => copyLink(shareCode)}>
              <Copy aria-hidden className="mr-1.5 h-3.5 w-3.5" />
              Copy link
            </Button>
          )}
          {onShowInMapping && selection.kind !== "chapter" && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onShowInMapping(selection.code)}
            >
              <ListTree aria-hidden className="mr-1.5 h-3.5 w-3.5" />
              Show in detailed mapping
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default NistDrawer;

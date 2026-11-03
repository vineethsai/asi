import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Numbered section with an anchor heading (`scroll-mt` so the sticky header never covers it). */
export function GuideSection({
  id,
  number,
  title,
  lead,
  children,
  className,
}: {
  id: string;
  number: number;
  title: string;
  lead?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={cn("scroll-mt-24 space-y-4", className)}
    >
      <h2 id={`${id}-heading`} className="border-b pb-2 text-xl font-bold tracking-tight">
        <a href={`#${id}`} className="no-underline hover:underline">
          <span className="mr-2 font-mono text-muted-foreground">{number}.</span>
          {title}
        </a>
      </h2>
      {lead && <p className="text-sm leading-relaxed text-muted-foreground">{lead}</p>}
      {children}
    </section>
  );
}

export function SubHeading({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h3 id={id} className="scroll-mt-24 pt-2 text-base font-semibold">
      {children}
    </h3>
  );
}

/** Small bordered note. */
export function Callout({
  title,
  children,
  tone = "info",
}: {
  title?: string;
  children: ReactNode;
  tone?: "info" | "warn";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3 text-sm",
        tone === "warn" ? "border-amber-500/40 bg-amber-500/5" : "border-primary/30 bg-primary/5",
      )}
    >
      {title && <p className="mb-1 font-semibold">{title}</p>}
      <div className="space-y-1 text-muted-foreground">{children}</div>
    </div>
  );
}

/** Keyboard key cap. */
export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex min-w-[1.5rem] items-center justify-center rounded border bg-muted px-1.5 py-0.5 font-mono text-[11px] font-semibold text-foreground shadow-sm">
      {children}
    </kbd>
  );
}

/** Metadata chip (mono, muted). */
export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border bg-muted/50 px-2 py-0.5 font-mono text-[11px] text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Two-column definition list used by the prose sections. */
export function DefinitionList({ items }: { items: { term: ReactNode; detail: ReactNode }[] }) {
  return (
    <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[minmax(10rem,auto)_1fr]">
      {items.map((it, i) => (
        <div key={i} className="contents">
          <dt className="font-medium">{it.term}</dt>
          <dd className="text-muted-foreground">{it.detail}</dd>
        </div>
      ))}
    </dl>
  );
}

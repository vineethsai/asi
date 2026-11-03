/**
 * Cross-reference chip used by the Taxonomy tabs: an in-app link (`to`), an external link
 * (`href`, opens in a new tab) or plain text. `tone` adds a framework accent (tinted border and
 * background, theme-aware); text stays `foreground` so contrast holds in both themes.
 */
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { withAlpha, type PaletteToken } from "@/lib/palette";

export interface ChipProps {
  to?: string;
  href?: string;
  tone?: PaletteToken;
  /** Native tooltip with the full text (chips truncate long labels). */
  title?: string;
  mono?: boolean;
  className?: string;
  children: ReactNode;
}

const BASE =
  "inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 text-xs leading-5 text-foreground";

export function Chip({ to, href, tone, title, mono, className, children }: ChipProps) {
  const style = tone
    ? { borderColor: withAlpha(tone, 0.45), backgroundColor: withAlpha(tone, 0.1) }
    : undefined;
  const cls = cn(
    BASE,
    !tone && "border-border bg-muted/50",
    mono && "font-mono",
    (to || href) &&
      "transition-colors hover:border-primary/60 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    className,
  );
  const body = <span className="truncate">{children}</span>;
  if (to) {
    return (
      <Link to={to} className={cls} style={style} title={title}>
        {body}
      </Link>
    );
  }
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cls}
        style={style}
        title={title}
      >
        {body}
        <ExternalLink aria-hidden className="h-3 w-3 shrink-0 opacity-70" />
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    );
  }
  return (
    <span className={cls} style={style} title={title}>
      {body}
    </span>
  );
}

/** A labelled row of chips ("Threats: T1 T2 …"); renders nothing when empty. */
export function ChipRow({
  label,
  children,
  className,
}: {
  label: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-baseline gap-1.5", className)}>
      <span className="mr-1 text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}
